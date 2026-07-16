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

**P5 — Totes Gewicht.**
~100+ Zeilen auskommentierter AngularJS-Code in der Komponente, toter Legacy-Block in
`visual-style-helper.service.ts:209–274`, `MapErrorNotificationService` laut eigenem
Header weitgehend tot, doppelt injizierter `EnvConfigService` im
`reachability-map-helper.service.ts` (`envConfigService` + `envConfService`), doppelte
Getter `getMapParts_byDomId` / `getMapsParts_byDomId` (Tippfehler-Variante).

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

### Phase 0 — Aufräumen (risikofrei, sofort)

- [ ] Auskommentierte AngularJS-Blöcke in `kommonitor-map.component.ts` entfernen
- [ ] Tote Broadcast-Cases (`'changeSpatialUnitViaInfoControl'`, `'toggleLegendControl'`) entfernen
- [ ] Toten Legacy-Block `visual-style-helper.service.ts:209–274` entfernen
- [ ] `MapErrorNotificationService` prüfen/entfernen (einziger realer Effekt: `HideLoadingIconOnMap`-Broadcast)
- [ ] Doppelte `EnvConfigService`-Injektion + Doppel-Getter im Reachability-Helper bereinigen
- [ ] `console.log`s entfernen

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

### Phase 2 — Klassifikations-Pipeline extrahieren (größter Hebel)

- [ ] Neuer Service `IndicatorClassificationService`: `buildClassification(geoJSON, metadata, options) → { brews, styleFn }` — die vier Zweige (Default / MOV / Dynamic / RegionalDefault) **einmal** implementieren
- [ ] `_replaceIndicatorLayer` reduzieren auf: Pipeline aufrufen → Layer neu bauen
- [ ] `restyleCurrentLayer` reduzieren auf: Pipeline aufrufen → `eachLayer(setStyle)`
- [ ] Klassifikations-*Zustand* (classifyMethod, numClasses, breaks, brews) aus den öffentlichen Feldern des `VisualStyleHelperServiceNew` in einen Signal-basierten State-Service ziehen — konsistent mit der laufenden Signal-Umstellung der Klassifizierung (step-5-Commits)
- [ ] `VisualStyleHelperServiceNew` wird zustandslose Brew-/Style-Fabrik
- [ ] Unit-Tests für die Pipeline (reine Daten-Transformation, kein Leaflet nötig)

### Phase 3 — Layer-Manager abschälen

- [ ] Gemeinsames Interface (`add / remove / setOpacity`) definieren
- [ ] `GeoresourceLayerManager` (POI/LOI/AOI), `OgcLayerManager` (WMS/WFS), `FileLayerManager`, `ReachabilityLayerManager` extrahieren
- [ ] Komponente reicht `MapContext` (`map`, `layerControl`) hinein — Instanz bleibt gekapselt
- [ ] Popup-/Tooltip-Duplikate in gemeinsamen `FeaturePopupHelper` ziehen (eine Implementierung statt acht; auch `single-feature-` und `reachability-map-helper` umstellen)

### Phase 4 — Initialisierung entwirren

- [ ] Grayscale-Plugin in eigene Datei (`util/leaflet-grayscale.ts`)
- [ ] Basemap-Aufbau in den `GenericMapHelperService` verlagern
- [ ] `setTimeout(2000)` ersetzen: Outline-Layer auf das tatsächliche Ready-Signal des Metadaten-Setups reagieren lassen
- [ ] Viewport-State (`currentLatitude`/`currentLongitude`/`currentZoomLevel`) aus `EnvConfigService` in einen `MapViewportStateService` (oder in den `MapService`)
- [ ] Search-/Measure-/Layer-Control-Setup in einen `MapControlsService`
- [ ] jQuery-Toggles durch Angular-State ersetzen (Info-/Legend-Controls perspektivisch als echte Komponenten, z. B. via `DomPortal` — kann später kommen)

### Phase 5 — Broadcast-Abbau

- [ ] Die verbleibenden ~35 Broadcast-Cases schrittweise durch typisierte `MapService`-Methoden/Subjects ersetzen (Signaturen existieren im `MapService` bereits — es fehlt nur die direkte Zustellung statt des Umwegs über den globalen Bus)
- [ ] Am Ende abonniert die Map-Komponente nur noch wenige typisierte Streams

---

## 4. Reihenfolge & Risiko

| Phase | Status | Risiko | Nutzen | Abhängigkeit |
|---|---|---|---|---|
| 0 | offen | keins | Lesbarkeit | — |
| 1 | ✅ erledigt | gering | ein Refresh-Pfad, Timer weg | — |
| 2 | offen | mittel | −500 duplizierte Zeilen, testbar, stützt Signal-Umstellung | profitiert von 1 ✓ |
| 3 | offen | mittel | Komponente schrumpft massiv | unabhängig |
| 4 | offen | gering–mittel | saubere Init, kein Timer/jQuery | unabhängig |
| 5 | offen | mittel | Bus-Entkopplung | am besten nach 3 |

**Empfehlung:** 0 → ~~1~~ → 2 als Kern zuerst; 3–5 danach häppchenweise, jeweils wenn der
Bereich ohnehin angefasst wird. Nächster Schritt: **Phase 2** — sie unterstützt die
laufende Signal-Umstellung der Klassifizierung direkt und bringt die größte
Zeilen-/Risikoreduktion (Phase 0 kann jederzeit nebenher passieren).
