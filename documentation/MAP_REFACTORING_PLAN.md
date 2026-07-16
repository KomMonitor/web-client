# Refactoring-Plan: Karten-Rendering & -Initialisierung

Analyse und Refactoring-Fahrplan für `kommonitor-map.component.ts` und die umliegenden
Map-Services. Stand: Juli 2026, Branch `feature/migration-bootstrap` —
**Abschnitt 1 aktualisiert nach Umsetzung von Phase 1.**

Methodisch konsistent mit `PRIO7_GOD_SERVICE_SPLIT.md`: **inkrementell abschälen, kein Big Bang.**

---

## 1. Ist-Zustand

### 1.1 Der God-Component

`app/components/ngComponents/userInterface/kommonitorMap/kommonitor-map.component.ts`
(**4281 Zeilen**, ursprünglich 4316) besitzt die Leaflet-Instanz (sauber gekapselt als
`private map`, wird nirgends nach außen gereicht — das ist gut) und macht darüber
hinaus *alles* selbst:

| Verantwortung | Stellen |
|---|---|
| Leaflet-Init inkl. Basemaps, Controls | `initMap()` (~170 Z.), `initSearch()`, `initMeasurement()` |
| Indikator-Rendering + Klassifikation | `_replaceIndicatorLayer` (~410 Z.), `restyleCurrentLayer` (~325 Z.) |
| Layer-Verwaltung für 7 Layer-Typen | POI/LOI/AOI/WMS/WFS/File/Reachability, je add/remove/opacity (~900 Z.) |
| Outlier-/NoData-Erkennung | `markOutliers`, `refreshOutliersStyle`, jStat-Statistik |
| Feature-Highlighting/Selektion | ~450 Z. (`switchHighlightFeature`, `resetHighlight*`, …) |
| Such-Control mit eigener Leaflet-Subklasse | `MultipleResultsLeafletSearch` (~280 Z.) |
| Map-Export (dom-to-image) | `exportMap`, `filterForScreenshot` |
| Legenden-/Info-Control-DOM per jQuery | `toggleInfoControl`, `appendSpatialUnitOptions`, … |

Die Spec hat 32 Zeilen — der Rendering-Kern ist praktisch ungetestet.

### 1.2 Hauptprobleme

**P1 — Kommunikation: untypisierter globaler Bus.** *(Teilweise behoben durch Phase 1.)*
Die Komponente konsumiert **35 Cases** aus dem `BroadcastService` (globaler
`BehaviorSubject` mit 103 Message-Typen, `values: any`). Der `MapService` (269 Z.) ist
für die Layer-Verwaltung weiterhin nur eine Fassade, die Methodenaufrufe in Broadcasts
übersetzt — Abbau in Phase 5.

~~Für den Indikator-Refresh existieren drei konkurrierende Wege~~ → **erledigt (Phase 1):**
Der Indikator-Refresh läuft jetzt über genau einen typisierten Kanal
(`MapService.indicatorRenderRequest$`, Payload `IndicatorRenderRequest`); der frühere
Subject-Pfad `replaceIndicatorLayerSubject$` (senderlos) und der Broadcast
`ReplaceIndicatorAsGeoJSON` (inkl. `setTimeout(1000)`-Workaround) sind entfernt.

Dazu zwei tote String-Cases ohne Sender (`'changeSpatialUnitViaInfoControl'`,
`'toggleLegendControl'`) — Phase 0.

**P2 — Massive Duplikation im Rendering-Kern.**
`_replaceIndicatorLayer` und `restyleCurrentLayer` implementieren dieselbe
Klassifikations-Pipeline (Outlier markieren → Zero/NoData scannen → Brew-Setup →
Style-Funktion) doppelt, jeweils mit 3–4 fast identischen Zweigen
(Default / MeasureOfValue / Dynamic / RegionalDefault). Der `L.geoJSON`-Aufruf mit
Style-Callback ist allein in `_replaceIndicatorLayer` viermal kopiert.
Zusätzlich ist das Popup-/Tooltip-HTML **~8-fach** kopiert:

- `featurePropertyPopupContent`-Tabelle: `generic-map-helper.service.ts:206`,
  `single-feature-map-helper.service.ts:70` + `:224`, `kommonitor-map.component.ts:1785`,
  `:1808`, `:2417`, `:2542`
- Indikator-Tooltip (`<b>Name</b><br/>Wert [Einheit]` inkl. NoData-Fallback): dreifach in
  `kommonitor-map.component.ts:1830`, `single-feature-map-helper.service.ts:144`,
  `reachability-map-helper.service.ts:652`

**P3 — Geteilter mutabler Zustand statt API.**
`VisualStyleHelperServiceNew` (1266 Z.) hält `classifyMethod`, `numClasses`, `manualBrew`,
`dynamicBrewBreaks` etc. als öffentliche Felder, die die Map-Komponente direkt beschreibt
(z. B. `visualStyleHelperService.manualBrew.breaks = …`, `kommonitor-map.component.ts:1654`).
`_replaceIndicatorLayer` resettet zu Beginn ~10 dieser Felder von Hand — der
Klassifikationszustand ist über zwei Klassen verschmiert. `MapOverlayStateService` ist ein
reiner `any`-State-Bag (6/6 Felder untypisiert).

**P4 — Initialisierungs-Smells.**
- `setTimeout(2000)` in `ngOnInit` für den Spatial-Unit-Outline-Layer (`:290`) — reine
  Hoffnung, dass die Daten dann da sind.
- Grayscale-TileLayer-Plugin (~55 Z.) inline in `ngOnInit` per `L.TileLayer.extend` definiert.
- Karten-Position/Zoom werden in den `EnvConfigService` zurückgeschrieben
  (`currentLatitude` etc.) — ein Config-Service als Laufzeit-State-Container.
- jQuery-DOM-Manipulation für Controls (`$('.leaflet-control-layers').hide()`,
  `$('.geosearch').toggle()`, …).
- `GenericMapHelperService.initMap()` existiert, wird für die Hauptkarte aber **nicht**
  genutzt — die Komponente baut alles parallel selbst.

**P5 — Totes Gewicht.** *(✅ behoben durch Phase 0.)*
~~Auskommentierter AngularJS-Code, toter Legacy-Block im VisualStyleHelper, weitgehend
toter `MapErrorNotificationService`, doppelte `EnvConfigService`-Injektion und
Tippfehler-Getter im Reachability-Helper~~ — alles entfernt bzw. bereinigt.

### 1.3 Umfeld (Helper-Services)

| Service | Zeilen | Rolle | Zustand |
|---|---|---|---|
| `generic-map-helper.service` | 537 | zustandslose Leaflet-Fabrik (Map-Init, Controls, Marker) | ok, wird für Hauptkarte nicht genutzt |
| `single-feature-map-helper.service` | 283 | Karte des Single-Feature-Editors | hält Leaflet-Refs, duplizierter Popup-Code |
| `reachability-map-helper.service` | 1013 | Isochronen-/Reachability-Karten | Multi-Map-State, 51× `any`, Doppel-Injektion |
| `visual-style-helper.service` | 1266 | Brew-/Klassifikations- und Style-Logik | erheblicher shared mutable State |
| `map-overlay-state.service` | 20 | State-Bag (WMS/WFS-URLs etc.) | 6/6 Felder `any` |
| `map-error-notification.service` | 40 | Fehler-Banner | weitgehend tot |
| `map.service` | 269 | Fassade → Broadcast; seit Phase 1 zusätzlich Besitzer des typisierten Render-Kanals `indicatorRenderRequest$` | Layer-Methoden weiterhin reine Durchreiche |

---

## 2. Zielbild

**Die Komponente wird zur dünnen Leaflet-Hülle, die einen `MapContext` besitzt;
Rendering-Logik wandert in testbare Services; Kommunikation läuft über typisierte APIs
statt Broadcast.**

- Die Leaflet-Instanz bleibt gekapselt; Layer-Manager erhalten ein schmales
  `MapContext`-Objekt (`map`, `layerControl`), keine globale Referenz.
- Klassifikation = reine Daten-Transformation ohne Leaflet-Abhängigkeit → unit-testbar.
- Ein typisierter Kanal pro Anliegen statt globalem Bus mit `any`-Payloads.

---

## 3. Phasenplan

### Phase 0 — Aufräumen ✅ (umgesetzt Juli 2026)

- [x] Auskommentierte AngularJS-Blöcke in `kommonitor-map.component.ts` entfernt (~700 Zeilen; Komponente 3419 → **2653 Zeilen**)
- [x] Tote Broadcast-Cases (`'changeSpatialUnitViaInfoControl'`, `'toggleLegendControl'`) samt Handler-Methoden entfernt; mit ihnen die nur noch aus totem Code referenzierten `appendSpatialUnitOptions()` und das Feld `showLegendControl`
- [x] Toten Legacy-Wrapper-Block im `visual-style-helper.service.ts` entfernt
- [x] `MapErrorNotificationService` auf den einzigen realen Effekt reduziert (`console.error` + `HideLoadingIconOnMap`-Broadcast); toter `errorMessage`-State, jQuery-Zugriff auf nicht existentes Markup und `setTimeout(1000)` entfernt — Service bleibt als Hook für eine künftige echte Fehler-UI
- [x] Doppelte `EnvConfigService`-Injektion (`envConfService`) + Tippfehler-Getter (`getMapsParts_byDomId`) im Reachability-Helper bereinigt
- [x] `console.log`s in `kommonitor-map.component.ts` und `map.service.ts` entfernt (Karten-Scope; App-weite Logs sind nicht Teil dieses Plans)

### Phase 1 — Indikator-Refresh-Kanal vereinheitlichen ✅ (umgesetzt Juli 2026)

- [x] Typ `IndicatorRenderRequest { indicator, spatialUnitName, date, justRestyling, isCustomComputation, source }` eingeführt (statt Positions-Arrays)
- [x] Die drei Wege auf **einen** typisierten `ReplaySubject(1)` (`indicatorRenderRequest$`) im `MapService` zusammengeführt; die Map-Komponente hat nur noch eine Render-Subscription
- [x] Sender: `setMapRefreshValues` (Data-Setup) emittiert bei vollständigen Werten selbst; `replaceIndicatorGeoJSON` (Filter-Helper, Balance) liefert direkt statt über den Broadcast-Bus
- [x] `setTimeout(1000)` im Broadcast-Case entfernt; Broadcast-Case + Enum-Eintrag `ReplaceIndicatorAsGeoJSON` gelöscht

**Umsetzungsnotizen:**
- `replaceIndicatorLayerSubject$` hatte **keinen einzigen Sender** (toter Pfad) → ersatzlos entfernt, inkl. `MapService.replaceIndicatorLayer()` und `KommonitorMapComponent.onReplaceIndicatorAsGeoJSON()`.
- Der Broadcast hatte einen **zweiten Empfänger**: `kommonitor-filter.component` (Spatial-Unit-Filter-Setup + Filter-Reset bei Raumebenen-Wechsel). Um dessen Semantik exakt zu erhalten, trägt der Request ein `source`-Feld (`'selection'` = Data-Setup-Selektionswechsel, `'dataset-replacement'` = Filter/Balance ersetzt Feature-Werte); der Filter reagiert nur auf `'dataset-replacement'` (Handler umbenannt in `onIndicatorDatasetReplaced`). Ob der Filter auch auf `'selection'` reagieren sollte, ist eine offene fachliche Frage für später.
- `mapRefreshState$` bleibt als Selektions-State-Kanal bestehen (Filter-Komponente nutzt ihn für die Measure-of-Value-Bar) — Konsolidierung davon ggf. in Phase 5.
- Verhaltens-Delta: Filter-/Balance-Renders passieren jetzt sofort statt 1 s verzögert.

### Phase 2 — Klassifikations-Pipeline extrahieren ✅ (Pipeline-Teil umgesetzt Juli 2026)

- [x] Neuer Service `IndicatorClassificationService` (`app/services/indicator-classification-service/`): `buildClassification(input) → { brews, facts, styleFor }` — alle Zweige (Default / MOV / Dynamic / RegionalDefault) **einmal** implementiert; Mode-Divergenzen (`replace` vs. `restyle`) als kommentierte `if (mode === …)`-Stellen
- [x] `_replaceIndicatorLayer` reduziert auf: Housekeeping → Pipeline → **ein** `L.geoJSON` → Layer-Control/Broadcasts (~100 Zeilen statt ~410)
- [x] `restyleCurrentLayer` reduziert auf: Pipeline → `eachLayer(setStyle(result.styleFor))` → Broadcasts (~65 Zeilen statt ~325)
- [x] Unit-Tests: 13 Specs mit echtem `VisualStyleHelperServiceNew` + Mini-GeoJSON-Fixtures (Zero/NoData/Outlier/negativ, alle Zweige, Mode-Divergenzen)
- [x] Signal-State + zustandsloser VisualStyleHelper → **Phase 2b, umgesetzt Juli 2026** (siehe eigener Abschnitt unten)

**Umsetzungsnotizen:**
- Mit umgezogen in den Service: `markOutliers`, `setNoDataValuesAsNull`, `applyDefaultClassificationSettings`, `applyRegionalDefaultClassification`, `checkAvailabilityOfRegionalDefault`, `setClassifyZeroForClassifyMethod`, `calcMOVBreaks`, `containsNegativeValues`, `prepFeatureModelForMapUse`, `updateDefault-/updateManualMOVBreaks…` (letzteres public mit `isDynamicOrNegative`-Parameter — Aufrufer: `changeBreaks`/`changeDynamicBreaks`/Time-Setup-Flow). Outlier-/Zero-/NoData-Befunde kommen als `result.facts` zurück; die Komponente übernimmt sie via `adoptClassificationResult()` (Legende, Diagramme, Outlier-Alert, Highlight-Code).
- Tote VSH-Felder entfernt: `measureOfValueBrewArray`, `dynamicIncreaseBrew`, `dynamicDecreaseBrew` (Schreiber nur in der Map-Komponente, keine Leser).
- `kommonitor-map.component.ts`: 4281 → **3419 Zeilen**.

**Bewusste Verhaltensänderungen:**
1. `replace` erzeugt nur noch **ein** `L.geoJSON` statt bis zu drei (nur der letzte gewann; Nebeneffekt: im MOV+DYNAMIC-Fall sind die `featuresPerColorMap`-Zähler der Legende jetzt korrekt befüllt statt leer).
2. **TypeError-Guard**: `updateDefaultManualBreaksFromMOVManualBreaks` schrieb unconditional in das frisch resettete `manualBrew` (latenter Crash bei Indikator-/Datumswechsel mit aktivem MOV) → jetzt `if (manualBrew)`-Guard, per Regressionstest abgedeckt.
3. `styleFor` preppt das `tempData`-Tooltip-Modell auch beim Restyle (bisher nur replace) — idempotent, hält Tooltips konsistent.
4. **Shadowing-Bug 1:1 beibehalten**: in `updateManualMOVBreaksFromDefaultManualBreaks` wurden die rekombinierten dynamischen Breaks nie verwendet (inneres `const breaks`); im Service dokumentiert + TODO, kein stiller Funktionswechsel.

### Phase 2b — Signal-State + zustandsloser VisualStyleHelper ✅ (umgesetzt Juli 2026)

- [x] Neuer `ClassificationStateService` (`app/services/classification-state-service/`, 211 Z.): **einziger Besitzer** des geteilten Klassifikations-States (`classifyMethod`, `numClasses`, die vier Brew-Objekte, alle Breaks-Listen, `isCustomComputation`, `currentIndicatorOpacity`, die `featuresPer*`-Legende-Zähler, Brew-Backups). Alle Felder als **signal-backed Accessor-Properties** — Property-Lese-/Schreibzugriffe und `[(ngModel)]` funktionieren unverändert, der State ist für reaktive Konsumenten vorbereitet.
- [x] `VisualStyleHelperServiceNew` ist jetzt **zustandslos** (1266 → 1118 Z.): reine Brew-/Style-Fabrik plus statische Konstanten/Patterns/Styles; die `setup*Brew`-Methoden und Style-Zähler schreiben in den State-Service. Totes `classifyMethods`-Array und `outliers_high/low` entfernt; Arbeits-Arrays privat.
- [x] Konsumenten umgestellt: `kommonitor-classification` (171 Referenzen ts+html — nutzt **nur noch** den State-Service, VSH-Injektion entfernt), `kommonitor-legend` (67 Template-Referenzen, dito), `kommonitor-map.component` (State→State-Service, Factory/Styles→VSH), `indicator-classification.service`, `single-feature-`/`reachability-map-helper` (inkl. Brew-Backup/-Restore), `user-interface` (ungenutzte VSH-Injektion entfernt)
- [x] Spec für den State-Service (Accessors, Zähler, Backup/Restore); Pipeline-Spec auf State-Service umgestellt

**Bewusste Einschränkung (dokumentiert im Service):** Die Brew-Objekte und Breaks-Arrays werden vom Classification-Panel weiterhin **in-place** mutiert (`manualBrew.breaks.push/splice/sort`) — solche Mutationen ändern den Signal-Wert nicht und laufen wie bisher über die Zone-Change-Detection. Eine vollständige Immutable-Umstellung würde die classyBrew-Interaktion neu erfinden und ist bewusst nicht Teil von 2b.

### Phase 3 — Layer-Manager abschälen ✅ (umgesetzt Juli 2026)

- [x] `MapContext` (`map`, `layerControl`, `updateSearchControl()`, `hideLoadingIcon()`) in `services/map-service/map-context.ts` definiert, plus geteilte Layer-Gruppen-Namen `MAP_LAYER_GROUPS`; die Komponente reicht den Kontext einmalig nach `initMap()` hinein — die Leaflet-Instanz bleibt gekapselt
- [x] Extrahiert: `GeoresourceLayerManagerService` (POI/LOI/AOI, 170 Z.), `OgcLayerManagerService` (WMS/WFS inkl. Filter-Encoding, 233 Z.), `FileLayerManagerService` (146 Z.), `ReachabilityLayerManagerService` (Szenario-Marker/-Isochronen, 88 Z.) — die Broadcast-Cases der Komponente delegieren mit sauberer Destrukturierung
- [x] `FeaturePopupHelperService` dedupliziert das Popup-/Tooltip-HTML (eine Implementierung statt acht): Map-Komponente (SpatialUnit-Popup, Indikator-Tooltip), Georesource-/OGC-/File-Manager, `generic-map-helper` (`addPoiMarker`), `single-feature-map-helper` (2 Stellen + Tooltip), `reachability-map-helper` (Tooltip)
- [x] Specs: FeaturePopupHelper mit echten Assertions, Creation-Specs für die vier Manager

**Umsetzungsnotizen / bewusste Verhaltensfixes:**
- `RemoveLoiGeoresource` und `RemoveWfsLayerFromMap` reichten das Payload-**Array** als Dataset durch (`datasetName`/`title` = undefined) — die Entfernung dieser Layer lief seit jeher ins Leere. Beim Umhängen auf die Manager gefixt (Destrukturierung), im Switch kommentiert.
- `RemoveFileLayerFromMap` hat weiterhin weder Sender noch Empfänger-Case — die Manager-Methode `removeFileLayer` existiert als API, die Verdrahtung ist Thema von Phase 5.
- Die POI/AOI/LOI-Entfernung matcht wie bisher **nur über den Layer-Namen** (nicht über die Gruppe) — 1:1 beibehalten, im Manager kommentiert.
- WFS-Fehlerpfad: `loadingData = false` lief bisher sofort, jetzt über `context.hideLoadingIcon()` (250 ms verzögert wie alle anderen Pfade).
- `kommonitor-map.component.ts`: 2653 → **2020 Zeilen**.

### Phase 4 — Initialisierung entwirren ✅ (umgesetzt Juli 2026)

- [x] Grayscale-Plugin nach `util/leaflet-grayscale.ts` (Factory `createGrayscaleTileLayer`, Muster wie `util/leaflet-cluster.ts`)
- [x] Basemap-Aufbau (`TILE_LAYER` / `TILE_LAYER_GRAYSCALE` / `WMS`) in `GenericMapHelperService.createBaseLayers()`
- [x] `setTimeout(2000)` ersetzt: Outline-Layer initialisiert sich, sobald **beide** Bedingungen erfüllt sind — Map-View vorhanden **und** `metadataBootstrap.metadataLoading$` meldet `COMPLETE` (`tryInitSpatialUnitOutlineLayer`, läuft genau einmal)
- [x] `MapViewportStateService` (neu): `currentLatitude`/`currentLongitude`/`currentZoomLevel` raus aus `EnvConfigService`/`window.__env`; Schreiber = Map-Komponente (zoomend/moveend), Leser = `share-helper.service`; die `current*`-Accessoren im `EnvConfigService` sind gelöscht
- [x] `MapControlsService` (neu, 449 Z.): besitzt Layer-Control (inkl. `_groupList`-Hack, Drag-Disable, Hide-Button), Scale-Bar, Geosearch, Feature-Suche (inkl. der `MultipleResultsLeafletSearch`-Leaflet-Erweiterung und `updateSearchControl`) und Measure-Control; Komponente und Layer-Manager rufen `updateSearchControl()` über den Service/Kontext
- [x] jQuery-Toggles ersetzt *(Nachtrag Juli 2026)*: `MapControlsService` hält die Sichtbarkeit als Zustand (`layerControlVisible`, `expertControlsVisible`) und wendet sie per `control.getContainer().style.display` an — wirkt damit nur noch auf die Controls der Hauptkarte, nicht mehr klassenbasiert auf fremde Karten. **Bugfix dabei:** das blinde `$('.leaflet-control-search').toggle()` nach jeder Neu-Erzeugung in `updateSearchControl` versteckte die Feature-Suche bei aktivem Experten-Modus nach jeder Layer-Änderung; jetzt wird der Experten-Zustand re-appliziert. Außerdem die komplett tote Info-Control-Kette entfernt (`toggleInfoControl` in Map/MapService/User-Interface — weder Auslöser im Template noch Ziel-DOM existierten). Map-Komponente und Map-Services sind jetzt jQuery-frei.

**Umsetzungsnotiz:** Die Reihenfolge „`initMap()` → env-`sortableLayers` zuweisen" wurde 1:1 beibehalten — d. h. das Layer-Control bekommt wie bisher den Default-Wert, die env-Konfiguration griff auch vorher nie fürs Control (dokumentierter Alt-Quirk, kein stiller Fix).
`kommonitor-map.component.ts`: 2020 → **1499 Zeilen**.

### Phase 5 — Broadcast-Abbau ✅ (umgesetzt Juli 2026)

- [x] `MapService` besitzt jetzt einen typisierten Kanal `mapCommand$` mit der Discriminated Union `MapCommand` (~37 Kommandos) plus je einer Sender-Methode; **alle** vormals über den Bus konsumierten Map-Messages laufen darüber
- [x] Die Map-Komponente hat **keine** `BroadcastService`-Subscription mehr — sie abonniert `mapCommand$` (ein exhaustiver, typisierter Dispatcher: Layer-Kommandos → Manager, Styling/Highlight/UI → eigene Handler) plus die bestehenden typisierten Streams (`indicatorRenderRequest$`, `mapRecenter$`, Reachability)
- [x] Alle Sender umgehängt: `kommonitor-classification` (14 Aufrufe), `kommonitor-legend`, `user-interface` (5), `kommonitor-filter`, `kommonitor-data-setup` (9 Loading-Icon-Aufrufe), `georesource-layer.service`, `map-error-notification`, `kommonitor-diagrams`/`indicator-radar`/`regression-diagram` (Highlight/Preserve), `diagram-helper` (Time-Setup-Begin)
- [x] Mit-Empfänger der geteilten Kommandos abonnieren jetzt ebenfalls `mapCommand$`: `kommonitor-data-setup` (`changeSpatialUnit`), `kommonitor-legend` (`onGlobalFilterChange`), `indicator-radar`/`regression-diagram` (`beginIndicatorTimeSetup`)
- [x] **40 verwaiste `BroadcastMessage`-Einträge gelöscht** (Bus: 103 → 63 Message-Typen)

**Umsetzungsnotizen / bewusste Änderungen:**
- `mapCommand$` ist ein plain `Subject` (kein Replay). Der alte Bus replayte ohnehin nur die *letzte* Message beliebigen Typs an Spätabonnenten — praktisch kein Verlust; dokumentiert für den Fall früher Kommandos vor Map-Init.
- **Datei-Layer-Entfernung gefixt:** `mapService.removeFileLayerFromMap` (Aufrufer: `kommonitor-data-import`, 3 Stellen) hatte auf dem Bus keinen Empfänger-Case — Datei-Layer konnten nie entfernt werden. Jetzt verdrahtet (`removeFileLayer`-Kommando → `FileLayerManagerService`).
- Handler-Signaturen der Map-Komponente von Positions-Arrays auf benannte Parameter umgestellt (`changeBreaks(breaks)` statt `changeBreaks([breaks])` usw.); komponenteninterne `RestyleCurrentLayer`-Broadcasts (7 Stellen) sind direkte `this.restyleCurrentLayer(false)`-Aufrufe.
- Bewusst als **dokumentierte Sackgassen** erhalten (Feature war schon vor dem Refactoring wirkungslos, Re-Implementierung wäre neues Feature): `adjustOpacityForWmsLayer` (Aufrufer: Legende) und `adjustColorForWfsLayer` (Aufrufer: `georesource-layer.service`) broadcasten weiter ins Leere; die vier komplett aufruferlosen `adjustOpacityFor{Aoi,Poi,Loi,Wfs}Layer`-Methoden sind gelöscht.
- Die Map-Komponente **sendet** weiterhin auf dem Bus (`UpdateLegendDisplay`, `UpdateDiagrams`, `IndicatortMapDisplayFinished`, Hover-Updates) — deren Empfänger sind Legende/Diagramme; das ist deren Refactoring-Baustelle, nicht die der Karte.

---

## 4. Reihenfolge & Risiko

| Phase | Status | Risiko | Nutzen | Abhängigkeit |
|---|---|---|---|---|
| 0 | ✅ erledigt | keins | Lesbarkeit | — |
| 1 | ✅ erledigt | gering | ein Refresh-Pfad, Timer weg | — |
| 2 | ✅ erledigt (Pipeline) | mittel | −860 Zeilen in der Komponente, Pipeline getestet | — |
| 2b | ✅ erledigt | hoch | Signal-State, zustandsloser VisualStyleHelper | — |
| 3 | ✅ erledigt | mittel | Komponente schrumpft massiv | — |
| 4 | ✅ erledigt | gering–mittel | saubere Init, kein Timer | — |
| 5 | ✅ erledigt | mittel | Bus-Entkopplung | — |

**Alle Phasen des Plans inkl. 2b sind umgesetzt**; die jQuery-Toggles sind im
Nachtrag zu Phase 4 ebenfalls ersetzt. Verbleibende, bewusst offene Punkte:
- Die von der Map-Komponente **gesendeten** Bus-Messages (`UpdateLegendDisplay`,
  `UpdateDiagrams`, …) — typisierte Zustellung wäre der nächste Schritt, gehört
  aber zum Refactoring von Legende/Diagrammen.
- Wirkungslose Opacity-/Farb-Regler für WMS/WFS (dokumentierte Sackgassen in
  `MapService`).
- In-place-Mutation der Brew-/Breaks-Objekte durch das Classification-Panel
  (dokumentiert im `ClassificationStateService`) — echte Immutable-/Signal-
  Reaktivität wäre ein Folgeschritt beim Panel-Refactoring.
