# BroadcastService — Message-Namen typisieren (Enum / const-Objekt)

Vorschlag, die freien String-Message-Namen des `BroadcastService` durch typisierte
Konstanten zu ersetzen, um spätere Refactorings abzusichern.
Stand: 2026-06-23, Branch `feature/migration-bootstrap-cleanup`.

Betroffene Datei: `app/services/broadcast-service/broadcast.service.ts`.

## Ausgangslage

Der `BroadcastService` ist ein simpler RxJS-Bus:

```ts
broadcast(newMsg: string, values: any = {}) {
  this.broadcastMsg.next({ msg: newMsg, values: values });
}
```

- **228 Call-Sites** (`*.broadcast('...')`) über Services und Komponenten verteilt.
- Empfänger vergleichen durchgängig per String-Literal:
  `if (data.msg === 'initialMetadataLoadingCompleted')`, `switch`/`if`-Ketten auf
  `broadcastMsg.msg`.
- Der Message-Name ist nirgends zentral definiert → keine IDE-Unterstützung
  (kein „Find usages", kein Rename, keine Autocomplete), Tippfehler fallen erst
  zur Laufzeit (oder gar nicht) auf.

### Konkrete Bugs/Risiken, die das heute erzeugt

- **Casing-Mismatch (echter latenter Bug):**
  `kommonitor-data-setup.component.ts:485` sendet `"DisableBalance"` (großes D),
  der einzige Empfänger in `kommonitor-balance.component.ts:46` lauscht aber nur auf
  `'disableBalance'`. Der Broadcast läuft ins Leere.
- **Inkonsistente Präfix-Konvention:** `"LIKEinitialMetadataLoadingCompleted"`
  (gesendet in `kommonitor-filter.component.ts:223`, konsumiert in `poi.component.ts:74`
  und `kommonitor-data-setup.component.ts:112`) — ein Name, der nur durch Kopieren
  überlebt und ohne Typsicherheit jederzeit auseinanderdriften kann.

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
`enum BroadcastMessage { InitialMetadataLoadingCompleted = 'initialMetadataLoadingCompleted', ... }`
verwenden — funktional gleichwertig.

```ts
// app/services/broadcast-service/broadcast-message.ts
export const BroadcastMessage = {
  InitialMetadataLoadingCompleted: 'initialMetadataLoadingCompleted',
  InitialMetadataLoadingFailed: 'initialMetadataLoadingFailed',
  HideLoadingIconOnMap: 'hideLoadingIconOnMap',
  ShowLoadingIconOnMap: 'showLoadingIconOnMap',
  RestyleCurrentLayer: 'restyleCurrentLayer',
  // ... (vollständige Liste unten)
} as const;

export type BroadcastMessage =
  (typeof BroadcastMessage)[keyof typeof BroadcastMessage];

// Für die dynamischen Namen aus feature-table-data-grid-helper.service.ts:
export const showLoadingIconFor = (resourceType: string) =>
  `showLoadingIcon_${resourceType}` as const;
export const hideLoadingIconFor = (resourceType: string) =>
  `hideLoadingIcon_${resourceType}` as const;
export const onDeleteFeatureEntryFor = (resourceType: string) =>
  `onDeleteFeatureEntry_${resourceType}` as const;
```

Service typisieren — mit `| string` als **Übergangstyp** für die schrittweise Migration:

```ts
broadcast(newMsg: BroadcastMessage | string, values: any = {}) {
  this.broadcastMsg.next({ msg: newMsg, values });
}
```

Sobald alle 228 Call-Sites umgestellt sind, kann `| string` entfernt werden — ab
dann erzwingt der Compiler typisierte Namen auf Sende- *und* (per Vergleich gegen
`BroadcastMessage.*`) auf Empfängerseite.

## Migrationsweg (kein Big-Bang)

Passend zum inkrementellen Vorgehen aus `PROPOSED_CHANGES.md` /
`PRIO7_GOD_SERVICE_SPLIT.md`:

1. `broadcast-message.ts` mit allen gesammelten Namen + Helpern anlegen.
2. `broadcast()`-Signatur auf `BroadcastMessage | string` setzen (bricht nichts).
3. Modulweise Sender **und** zugehörige Empfänger umstellen
   (z. B. erst `data-exchange` + `map-service`, dann `kommonitorClassification`/`Legend` …).
   Bei der Gelegenheit die o. g. Bugs fixen (`DisableBalance` → `disableBalance`).
4. Wenn `git grep "broadcast('"` / `"\.msg === '"` keine Roh-Strings mehr findet:
   `| string` aus der Signatur entfernen.
5. Nach jedem Schritt Baseline halten: `npm run build` (EXIT 0) + `npm test` +
   `npm run lint` (0 errors).

## Vollständige Liste der aktuell verwendeten Message-Namen

Statische Namen (Stand 2026-06-23, dedupliziert):

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
AppendExportButtonsForTable
applyNoDataDisplay
availableRolesUpdate
batchUpdateCompleted
changeBreaks
changeClassifyMethod
changeColorScheme
changeDynamicBreaks
changeIndicatorDate
changeNumClasses
changeSpatialUnit
changeStartPointsSource_fromLayer
disableBalance            # ACHTUNG: an einer Stelle fälschlich "DisableBalance" gesendet → Bug
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
initialMetadataLoadingCompleted
initialMetadataLoadingFailed
isochronesCalculationFinished
LIKEinitialMetadataLoadingCompleted   # ungewöhnliches Präfix, Migration prüfen
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

Dynamisch gebaute Namen (→ über Helper-Funktionen abbilden):

```
showLoadingIcon_${resourceType}      -> showLoadingIconFor(resourceType)
hideLoadingIcon_${resourceType}      -> hideLoadingIconFor(resourceType)
onDeleteFeatureEntry_${resourceType} -> onDeleteFeatureEntryFor(resourceType)
```

> Diese Liste regenerieren mit:
> ```bash
> grep -rhoE "\.broadcast\(\s*['\"\`][^'\"\`]+['\"\`]" app --include=*.ts \
>   | sed -E "s/.*broadcast\(\s*['\"\`]//; s/['\"\`].*//" | sort -u
> ```
