# BroadcastService — Message-Namen typisieren (Enum / const-Objekt)

Vorschlag, die freien String-Message-Namen des `BroadcastService` durch typisierte
Konstanten zu ersetzen, um spätere Refactorings abzusichern.
Stand: 2026-06-26, Branch `feature/migration-bootstrap`.

> **Update Juli 2026 (Map-Refactoring Phase 5 + Nachträge, siehe `MAP_REFACTORING_PLAN.md`):**
> Die Zahlen unten sind historisch. Die Map-Komponente ist **komplett vom Bus
> entkoppelt** — konsumierte Messages laufen über `MapService.mapCommand$`,
> gesendete über `MapService.mapEvent$`; insgesamt 49 verwaiste Einträge wurden
> aus `BroadcastMessage` gelöscht (103 → 54 Message-Typen). Auch das prominent
> erwähnte Tippfehler-Message `IndicatortMapDisplayFinished` existiert nicht
> mehr (Sender ohne Empfänger, ersatzlos entfernt).
> Zahlen verifiziert per Code-Bestandsaufnahme am 2026-06-26 (siehe Abschnitt
> „Bestandsaufnahme").

Betroffene Datei: `app/services/broadcast-service/broadcast.service.ts`.

## Ausgangslage

Der `BroadcastService` ist ein simpler RxJS-Bus:

```ts
broadcast(newMsg: string, values: any = {}) {
  this.broadcastMsg.next({ msg: newMsg, values: values });
}
```

- **226 Call-Sites** (`*.broadcast('...')`) über Services und Komponenten verteilt.
- **~106 eindeutige statische** Message-Namen + **3 dynamisch gebaute** Muster. Das Enum
  `BroadcastMessage` enthält final **105 typisierte Namen** (inkl. 3 erst in Cluster 7 über
  Multi-Line-Sender gefundene; ohne die fälschlich doppelte `DisableBalance`-Variante).
- **18 Empfänger-Blöcke** (`subscribe`) in 18 Dateien — die Empfängerseite ist überschaubar.
- Empfänger vergleichen durchgängig per String-Literal:
  `if (data.msg === 'initialMetadataLoadingCompleted')`, `switch`/`if`-Ketten auf
  `broadcastMsg.msg`.
- Der Message-Name ist nirgends zentral definiert → keine IDE-Unterstützung
  (kein „Find usages", kein Rename, keine Autocomplete), Tippfehler fallen erst
  zur Laufzeit (oder gar nicht) auf.

### Konkrete Bugs/Risiken, die das heute erzeugt

- **Casing-Mismatch — behoben ✅ (Cluster 3, 2026-06-26):**
  `kommonitor-data-setup.component.ts:493` sendete `"DisableBalance"` (großes D),
  der einzige Empfänger in `kommonitor-balance.component.ts:67` lauschte aber nur auf
  `'disableBalance'`. Mit der Migration sendet der Sender jetzt
  `BroadcastMessage.DisableBalance` (= `'disableBalance'`) und passt zum Empfänger.
  (Ein verbliebenes `"DisableBalance"` existiert nur noch als auskommentierter
  Legacy-`$rootScope.$broadcast` in `kommonitor-filter.component.ts:565`.)
- **`LIKEinitialMetadataLoadingCompleted` — erledigt ✅ (Cluster 3):** Es gab keinen
  realen Sender/Empfänger mehr; der tote String-Name wurde aus dem erläuternden
  Kommentar in `poi.component.ts` entfernt (Erklärung beibehalten).

### Tote Sender (kein Empfänger auffindbar)

Diese Namen werden gesendet, aber nirgends empfangen (auch nicht dynamisch) — vor der
Typisierung prüfen und ggf. löschen statt ins Enum aufnehmen:

```
onAddedFeatureToSelection
reopenBatchUpdateResultModal
resetTimeseriesMapping
onOpenAddFilterModal
CSVFromFileFinished_indicatorRegionalReferenceValues   # file-helper.service; Multi-Line-Sender, kein Empfänger
```

### Tote Empfänger (kein Sender auffindbar)

Empfänger-Zweige (`case` oder `if (data.msg === …)`), für die es **keinen Sender**
gibt (auch nicht dynamisch). Beim Cluster-Durchlauf als Roh-String belassen (nicht ins
Enum) und für späteres Löschen vormerken. Viele davon sind vermutlich Legacy-Reste aus
der AngularJS-Zeit (`$scope.$broadcast` ohne Angular-Bus-Gegenstück):

> Korrektur (Cluster 7): `allIndicatorPropertiesForCurrentSpatialUnitAndTime setup
begin` und `… setup completed` standen hier zunächst irrtümlich — sie haben sehr wohl
> einen **Multi-Line-Sender** in `diagram-helper` (`broadcast(\n 'name'\n)`), den das
> zeilenbasierte Sender-Grep übersah. Sie sind jetzt im Enum und migriert.

```
changeSpatialUnitViaInfoControl                              # kommonitor-map.component switch
toggleLegendControl                                         # kommonitor-map.component switch
updateShowRegionalDefaultOption                             # kommonitor-classification.component switch; einziger "Sender" ist ein auskommentierter $rootScope.$broadcast in kommonitor-map
updateIndicatorOgcServices                                  # kommonitor-data-setup.component switch; kein Sender
resizeDiagrams                                              # kommonitor-diagrams / indicator-radar / regression-diagram switch; kein Sender
switchReportingMode                                        # kommonitor-reachability / reachability-scenario-configuration switch; nur Legacy-$scope.$broadcast in indicator-add, kein Angular-Bus-Sender
onManageReachabilityScenario                               # reachability-scenario-configuration switch; kein Sender
onGlobalFilterDelete                                        # admin-filter-config switch; kein Sender
timeseriesMappingChanged                                   # indicator-edit-features-modal; kein Sender
onEditIndicatorFeatures                                    # admin-indicators-management; kein Sender
onEditIndicatorMetadata                                    # indicator-edit-metadata-modal; kein Sender
onDeleteIndicators                                         # indicator-delete-modal; kein Sender
onEditSpatialUnitFeatures                                  # spatial-unit-edit-features-modal; kein Sender
onEditSpatialUnitMetadata                                  # spatial-unit-edit-metadata-modal; kein Sender
onEditSpatialUnitUserRoles                                 # spatial-unit-edit-user-roles-modal; kein Sender
onDeleteSpatialUnits                                       # admin-spatial-units-management; kein Sender
onEditGeoresourcesUserRoles                                # georesource-edit-user-roles-modal; kein Sender
georesourceBatchListParsed                                 # georesource-batch-update-modal; kein Sender
```

## Frage: Ist ein Enum technisch möglich?

Ja, problemlos. Die einzige Komplikation sind **6 dynamisch gebaute Namen** in
`feature-table-data-grid-helper.service.ts`:

```ts
this.broadcastService.broadcast(`showLoadingIcon_${resourceType}`, {});
// konsumiert als: data.msg === 'showLoadingIcon_indicator'
```

Ein reines Enum kann `showLoadingIcon_${resourceType}` nicht 1:1 abbilden — dafür
braucht es typisierte Helper-Funktionen (siehe unten).

## Empfehlung: `const`-Objekt + Union-Type (statt numerischem Enum)

Grund: Die Werte sollen **echte Strings** bleiben (kompatibel zu allen bestehenden
`=== '...'`-Vergleichen, daher inkrementell migrierbar), und ein `const`-Objekt ist
tree-shake-freundlich. Der IDE-Nutzen (Autocomplete, Find-usages, Rename) ist
identisch zu einem `enum`. Wer die Enum-Syntax bevorzugt, kann genauso
`enum BroadcastMessage { RestyleCurrentLayer = 'restyleCurrentLayer', ... }`
verwenden — funktional gleichwertig.

```ts
// app/services/broadcast-service/broadcast-message.ts
export const BroadcastMessage = {
  HideLoadingIconOnMap: 'hideLoadingIconOnMap',
  ShowLoadingIconOnMap: 'showLoadingIconOnMap',
  RestyleCurrentLayer: 'restyleCurrentLayer',
  // ... (vollständige Liste unten)
} as const;

export type BroadcastMessage = (typeof BroadcastMessage)[keyof typeof BroadcastMessage];

// Für die dynamischen Namen aus feature-table-data-grid-helper.service.ts:
export const showLoadingIconFor = (resourceType: string) =>
  `showLoadingIcon_${resourceType}` as const;
export const hideLoadingIconFor = (resourceType: string) =>
  `hideLoadingIcon_${resourceType}` as const;
export const onDeleteFeatureEntryFor = (resourceType: string) =>
  `onDeleteFeatureEntry_${resourceType}` as const;
```

> **Hinweis (2026-07-01):** Diese dynamischen Helper wurden inzwischen wieder entfernt —
> die Feature-Table-Signalisierung wurde ganz vom Bus auf eine typisierte reaktive API
> (`FeatureTableDataGridHelperService.featureTableEvents$`) umgestellt. Details im Nachtrag
> im Abschnitt „Status" weiter unten. Der übrige Enum-Ansatz bleibt unverändert gültig.

Service typisieren — mit `| string` als **Übergangstyp** für die schrittweise Migration:

```ts
broadcast(newMsg: BroadcastMessage | string, values: any = {}) {
  this.broadcastMsg.next({ msg: newMsg, values });
}
```

Sobald alle 226 Call-Sites umgestellt sind, kann `| string` entfernt werden — ab
dann erzwingt der Compiler typisierte Namen auf Sende- _und_ (per Vergleich gegen
`BroadcastMessage.*`) auf Empfängerseite.

## Bestandsaufnahme (verifiziert 2026-06-26)

| Metrik                              | Wert                                                    |
| ----------------------------------- | ------------------------------------------------------- |
| Sender-Call-Sites `.broadcast(...)` | 226                                                     |
| Eindeutige statische Namen          | ~106 (Enum: 105 typisierte Namen)                       |
| Dynamisch gebaute Muster            | 3 (alle in `feature-table-data-grid-helper.service.ts`) |
| Empfänger-Blöcke (`subscribe`)      | 18 Dateien                                              |

**Sender-Konzentration** (Top-4 ≈ 35 % aller Sends):

| Datei                                                                          | Sends |
| ------------------------------------------------------------------------------ | ----- |
| `map-service/map.service.ts`                                                   | 24    |
| `kommonitorDataSetup/kommonitor-data-setup.component.ts`                       | 20    |
| `kommonitorMap/kommonitor-map.component.ts`                                    | 20    |
| `kommonitorClassification/kommonitor-classification.component.ts`              | 15    |
| `admin/adminGeoresourcesManagement/admin-georesources-management.component.ts` | 10    |
| `userInterface/user-interface.component.ts`                                    | 7     |
| `admin/adminIndicatorsManagement/admin-indicators-management.component.ts`     | 7     |

**Empfänger-Konzentration** (Anzahl `msg`-Vergleiche im `subscribe`):

- `kommonitor-map.component.ts` ist die **zentrale Drehscheibe** mit **38** `msg`-Vergleichen
  in einem Handler — mit Abstand der größte. Hier liegt das meiste Migrationsrisiko und
  der größte Nutzen.
- Danach mit großem Abstand: `indicator-radar` (7), `regression-diagram` (6),
  `indicator-edit-features-modal` (6), diverse mit 4–5.
- Nur **18** Dateien haben überhaupt einen `subscribe`-Block → gut clusterbar.

## Migrations-Cluster (Sender + Empfänger gemeinsam)

Empfohlene Reihenfolge nach Kopplung/Risiko. Pro Schritt **Sender und zugehörige
Empfänger zusammen** umstellen, sonst läuft ein typisierter Sender an einem
String-Empfänger vorbei.

1. **Map-Kern** ✅ _(erledigt 2026-06-26)_ — `map.service` (24 Sender) +
   `kommonitor-map.component` (20 Sender, 35 von 38 `case`s) + `generic-map-helper`
   (3 Sender) + `single-feature-map-helper` (3 Sender, 1 `case`). Alle Roh-Strings →
   `BroadcastMessage.*`. **Korrektur:** `reachability-map-helper` gehört _nicht_ dazu —
   es hat keine Broadcast-Stellen (der `case 'driving-car'`-Switch läuft auf
   `transitMode`, nicht auf `msg`). Damals als „tot" belassen: `changeSpatialUnitViaInfoControl`
   und `toggleLegendControl` (bleiben roh); `…setup begin` wurde in Cluster 7 nachmigriert.
2. **Classification / Legend** ✅ _(erledigt 2026-06-26)_ — `kommonitor-classification`
   (15 Sender, 2 von 3 `case`s) + `kommonitor-legend` (2 Sender, 4 `case`s). Ein
   `case 'onChangeSelectedIndicator' :` mit Leerzeichen vor dem Doppelpunkt manuell
   migriert; ein auskommentierter Legacy-`broadcast` in `kommonitor-legend` blieb
   Roh-String. Toter Empfänger `updateShowRegionalDefaultOption` (s. o.) blieb Roh-String.
3. **DataSetup / Balance / Filter / POI** ✅ _(erledigt 2026-06-26)_ — `kommonitor-data-setup`
   (.component 20 Sender + 1 von 2 `case`s, .service 2 Sender) + `favorites-state.service`
   (1) + `kommonitor-balance` (2 `case`s) + `kommonitor-filter` (1 Sender, 5 `case`s) +
   `poi.component` (2 `case`s) + `georesource-layer.service` (3) + `georesource-favorites.service`
   (1). Enthält den **`DisableBalance`-Bugfix** und die **LIKE-Kommentar-Bereinigung**. Vier
   `case`s mit Leerzeichen vor `:` manuell migriert; toter Empfänger
   `updateIndicatorOgcServices` (s. o.) blieb Roh-String.
4. **Diagramme** ✅ _(erledigt 2026-06-26)_ — `kommonitor-diagrams` (3 Sender, 4 von 5 `case`s)
   - `indicator-radar` (4 Sender, 4 von 7 `case`s) + `regression-diagram` (6 Sender, 3 von 6
     `case`s). Ein `case 'updateDiagrams' :` mit Leerzeichen vor `:` manuell migriert; ein
     auskommentierter `broadcast` in `indicator-radar` blieb Roh-String. Toter Empfänger
     `resizeDiagrams` blieb Roh-String. (Die `…setup begin/completed`-`case`s blieben hier
     zunächst roh und wurden in Cluster 7 nachmigriert, nachdem ihr Multi-Line-Sender
     gefunden war.)
5. **Reachability** ✅ _(erledigt 2026-06-26)_ — `kommonitor-reachability` (2 Sender, 1 von 2
   `case`s) + `reachability-scenario-modal` (5 Sender, 1 `case`) + `reachability-helper.service`
   (3 Sender) + `reachability-scenario-configuration` (3 Sender, 3 von 5 `case`s) +
   `reachbility-scenario-setup` (1 Sender) + `reachability-indicator-statistics` (2 `case`s) +
   `reachability-poi-in-iso` (4 `case`s). Zwei Space-Variant-`case`s manuell migriert. Tote
   Empfänger `switchReportingMode` und `onManageReachabilityScenario` (s. o.) blieben Roh-String.
6. **Admin** ✅ _(erledigt 2026-06-26)_ — 30 Dateien: alle Georesources- / Indicators- /
   SpatialUnits- / Topics- / Scripts- / Dashboard- / Config-Komponenten + Modals,
   `admin-topics.service`, `feature-table-data-grid-helper`, `adminGeoresourceUnit/kommonitor-data-grid-helper`
   und `common/wms-admin-table`. Besonderheiten:
   - Admin nutzt überwiegend **`if (data.msg === 'X')`-Ketten** statt `switch/case` — dafür
     ein zweites sed-Regelset (`\.msg === '…'`). Cluster 1–5 waren reine `switch/case` und
     damit bereits vollständig.
   - **Dynamische Namen** via Helper aufgelöst: 6 Sender in `feature-table-data-grid-helper`
     → `showLoadingIconFor()/hideLoadingIconFor()/onDeleteFeatureEntryFor()`; die Empfänger
     in den 3 Edit-Features-Modals entsprechend (Multi-Line-Konkatenation, `?.` entfernt).
   - 11 tote Empfänger gefunden (s. o.); `poi/loi/aoi`-`case`s unangetastet (Switch auf
     `georesourceType`, kein Broadcast).
7. **Rest / verstreut** ✅ _(erledigt 2026-06-26)_ — Sender/Empfänger außerhalb der
   Cluster 1–6, jeweils nur ein paar Stellen pro Datei:
   - Services: `access-control-service` (1), `diagram-helper-service` (4×
     `AppendExportButtonsForTable` + 2 Multi-Line-Sender), `element-visibility-helper-service`
     (1), `filter-helper-service` (5), `leaflet-screenshot-cache-helper-service` (2),
     `map-error-notification-service` (1), `script-helper-service` (1), `file-helper-service`
     (1 Multi-Line-Sender).
   - Komponenten: `user-interface.component` (7 Sender), `common/single-feature-edit`
     (4 Sender + 4 `case`s), `reporting/indicator-add` (Sender + reportingIsochrones-`case`s;
     der `this.broadcastSerice`-Tippfehler im Property-Namen wurde belassen, nur die
     Nachricht typisiert).
   - **Enum-Korrektur:** 3 Namen, die das zeilenbasierte Sender-Grep übersah, weil ihr
     Argument auf einer Folgezeile steht (`broadcast(\n 'name'\n)`), ergänzt — Enum nun
     **105 Namen**: `…SetupBegin`, `…SetupCompleted` (live; vorher fälschlich „tote
     Empfänger") und `CSVFromFileFinishedIndicatorRegionalReferenceValues` (toter Sender).
     Die zuvor roh belassenen Empfänger in `kommonitor-map` / `indicator-radar` /
     `regression-diagram` wurden nachmigriert.

> **Status: ✅ ABGESCHLOSSEN.** Cluster 1–7 erledigt; app-weit keine migrierbaren
> Roh-Sender/-Empfänger mehr (geprüft via `grep` gegen alle Enum-Werte _und_ compiler-
> erzwungen, s. u.). Übrig nur bewusst belassene tote Empfänger (raw) und
> auskommentierter Legacy-Code.
>
> **`| string` entfernt ✅:** Der Übergangstyp wurde durch die typisierten
> `BroadcastMessage`-Namen ersetzt: `broadcast(newMsg: BroadcastMessage, …)`. Der
> Compiler erzwingt damit typisierte Namen auf Senderseite — beliebige Roh-Strings
> werden abgelehnt (Build EXIT 0 bestätigt: kein Roh-String-Sender mehr vorhanden).
>
> **`BehaviorSubject<any>` typisiert ✅:** Das Bus-Subject ist jetzt
> `BehaviorSubject<BroadcastEnvelope>` (`{ msg: BroadcastMessage | (string & {});
values?: any }`). `msg` lässt bewusst beliebige Strings zu, damit die Empfängerseite
> weiter gegen die toten Roh-Namen und den Seed `''` vergleichen kann; `values` bleibt
> als heterogene Payload untypisiert.
>
> **Nachtrag 2026-07-01 — dynamische Nachrichten entfernt:** Die 3 Helper
> (`showLoadingIconFor` / `hideLoadingIconFor` / `onDeleteFeatureEntryFor`) und der Typ
> `DynamicBroadcastMessage` wurden entfernt; `broadcast()` nimmt jetzt ausschließlich
> `BroadcastMessage`. Die zugehörige Feature-Table-Signalisierung (Loading-Icon an/aus,
> Einzel-Feature-Löschung) läuft nicht mehr über den Bus, sondern über eine typisierte
> reaktive API des Grid-Helpers: `FeatureTableDataGridHelperService` exponiert
> `featureTableEvents$: Observable<FeatureTableEvent>`, das die 3 Edit-Features-Modals
> (SpatialUnit / Georesource / Indicator) nach `resourceType` gefiltert abonnieren.
> Damit gibt es keine dynamisch gebauten Nachrichtennamen mehr — der Bus trägt nur noch
> statische `BroadcastMessage`-Namen (Bestandsaufnahme oben entsprechend: „Dynamisch
> gebaute Muster" jetzt **0**).

## Migrationsweg (kein Big-Bang)

Passend zum inkrementellen Vorgehen aus `PROPOSED_CHANGES.md` /
`PRIO7_GOD_SERVICE_SPLIT.md`:

1. `broadcast-message.ts` mit allen gesammelten Namen + Helpern anlegen.
2. `broadcast()`-Signatur auf `BroadcastMessage | string` setzen (bricht nichts).
3. Cluster-weise Sender **und** zugehörige Empfänger umstellen — Reihenfolge siehe
   Abschnitt „Migrations-Cluster". Bei der Gelegenheit die o. g. Bugs fixen
   (`DisableBalance` → `disableBalance`, LIKE-Kommentar, tote Sender löschen).
4. Wenn `git grep "broadcast('"` / `"\.msg === '"` keine Roh-Strings mehr findet:
   `| string` aus der Signatur entfernen.
5. Nach jedem Schritt Baseline halten: `npm run build` (EXIT 0) + `npm test` +
   `npm run lint` (0 errors).

## Vollständige Liste der aktuell verwendeten Message-Namen

Statische Namen (Stand 2026-06-26, dedupliziert). Inkl. der 3 erst in Cluster 7 über
Multi-Line-Sender gefundenen Namen umfasst das Enum **105 kanonische Namen** (ohne die
fälschlich doppelte `DisableBalance`-Variante):

> Hinweis: `initialMetadataLoadingCompleted`, `initialMetadataLoadingFailed` und
> `LIKEinitialMetadataLoadingCompleted` sind seit dem `metadata-bootstrap`-Refactor
> **nicht mehr im Broadcast-Bus** (Completion-Signalling wurde vereinheitlicht) und
> daher aus dieser Liste entfernt.

```
addAoiGeoresourceAsGeoJSON
addFileLayerToMap
addLoiGeoresourceAsGeoJSON
addPoiGeoresourceAsGeoJSON
addWfsLayerToMap
addWmsLayerToMap
adjustColorForFileLayer
adjustColorForWfsLayer
adjustOpacityForAoiLayer
adjustOpacityForFileLayer
adjustOpacityForLoiLayer
adjustOpacityForPoiLayer
adjustOpacityForWfsLayer
adjustOpacityForWmsLayer
allIndicatorPropertiesForCurrentSpatialUnitAndTime setup begin     # Multi-Line-Sender (diagram-helper)
allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed # Multi-Line-Sender (diagram-helper)
AppendExportButtonsForTable
applyNoDataDisplay
availableRolesUpdate
batchUpdateCompleted
CSVFromFileFinished_indicatorRegionalReferenceValues   # Multi-Line-Sender (file-helper), kein Empfänger
changeBreaks
changeClassifyMethod
changeColorScheme
changeDynamicBreaks
changeIndicatorDate
changeNumClasses
changeSpatialUnit
changeStartPointsSource_fromLayer
disableBalance            # ACHTUNG: in kommonitor-data-setup fälschlich "DisableBalance" gesendet → Bug
disablePointDrawTool
exportMap
favItemsStored
FileLayerError
geoFavItemsStored
georesourceGeoJSONUpdated
georesourceGeoJSONUpdated_addSingleFeature
georesourceGeoJSONUpdated_deleteSingleFeature
georesourceGeoJSONUpdated_editSingleFeature
hideLoadingIconOnMap
highlightFeatureOnMap
indicatortMapDisplayFinished
isochronesCalculationFinished
onAddedFeatureToSelection
onChangeSelectedIndicator
onDeleteGeoresources
onEditGeoresourceFeatures
onEditGeoresourceMetadata
onGlobalFilterChange
onOpenAddFilterModal
onRemovedFeatureFromSelection
onUpdateSingleFeatureGeometry
openLayerControl
preserveHighlightedFeatures
refreshAdminDashboardDiagrams
refreshAdminFilterOverview
refreshGeoresourceOverviewTable
refreshGeoresourceOverviewTableCompleted
refreshIndicatorOverviewTable
refreshIndicatorOverviewTableCompleted
refreshScriptOverviewTable
refreshSpatialUnitOverviewTable
refreshTopicsOverview
reinitIndicatorStatisticsConfiguration
reinitPoisInReachabilityMap
reinitReachabilityConfiguration
reinitSingleFeatureEdit
removeAllDrawnPoints
removeAoiGeoresource
removeFileLayerFromMap
removeLoiGeoresource
removePoiGeoresource
removePotentialDrawnStartingPoints
removeRangeFilter
removeReachabilityScenarioFromMainMap
removeWfsLayerFromMap
removeWmsLayerFromMap
reopenBatchUpdateResultModal
replaceIndicatorAsGeoJSON
replaceReachabilityScenarioOnMainMap
reportingIsochronesCalculationFinished
reportingIsochronesCalculationStarted
reportingPoiLayerSelected
resetPoisInIsochrone
resetTimeseriesMapping
restyleCurrentLayer
screenshotsForCurrentSpatialUnitUpdate
selectedIndicatorDateHasChanged
showLoadingIconOnMap
singleFeatureSelected
switchHighlightFeatureOnMap
toggleExpertControl
toggleInfoControl
unhighlightFeatureOnMap
unselectAllFeatures
updateBalanceSlider
updateClassificationComponent
updateDatePickerAvailableDates
updateDatePickerSelectedDate
updateDiagrams
updateDiagramsForHoveredFeature
updateDiagramsForUnhoveredFeature
updateIndicatorValueRangeFilter
updateLegendDisplay
updateMeasureOfValueBar
```

Dynamisch gebaute Namen (→ über Helper-Funktionen abgebildet — **seit 2026-07-01
entfernt**, siehe Nachtrag oben; die Feature-Table-Signalisierung läuft jetzt über
`FeatureTableDataGridHelperService.featureTableEvents$` statt über den Bus):

```
showLoadingIcon_${resourceType}      -> showLoadingIconFor(resourceType)     # entfernt
hideLoadingIcon_${resourceType}      -> hideLoadingIconFor(resourceType)     # entfernt
onDeleteFeatureEntry_${resourceType} -> onDeleteFeatureEntryFor(resourceType) # entfernt
```

> Diese Liste regenerieren mit:
>
> ```bash
> grep -rhoE "\.broadcast\(\s*['\"\`][^'\"\`]+['\"\`]" app --include=*.ts \
>   | sed -E "s/.*broadcast\(\s*['\"\`]//; s/['\"\`].*//" | sort -u
> ```
