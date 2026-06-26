# BroadcastService — Message-Namen typisieren (Enum / const-Objekt)

Vorschlag, die freien String-Message-Namen des `BroadcastService` durch typisierte
Konstanten zu ersetzen, um spätere Refactorings abzusichern.
Stand: 2026-06-26, Branch `feature/migration-bootstrap`.
Zahlen verifiziert per Code-Bestandsaufnahme am 2026-06-26 (siehe Abschnitt
„Bestandsaufnahme").

Betroffene Datei: `app/services/broadcast-service/broadcast.service.ts`.

## Ausgangslage

Der `BroadcastService` ist ein simpler RxJS-Bus:

```ts
broadcast(newMsg: string, values: any = {}) {
  this.broadcastMsg.next({ msg: newMsg, values: values });
}
```

- **226 Call-Sites** (`*.broadcast('...')`) über Services und Komponenten verteilt.
- **103 eindeutige statische** Message-Namen + **3 dynamisch gebaute** Muster (= 106 gesamt).
- **18 Empfänger-Blöcke** (`subscribe`) in 18 Dateien — die Empfängerseite ist überschaubar.
- Empfänger vergleichen durchgängig per String-Literal:
  `if (data.msg === 'initialMetadataLoadingCompleted')`, `switch`/`if`-Ketten auf
  `broadcastMsg.msg`.
- Der Message-Name ist nirgends zentral definiert → keine IDE-Unterstützung
  (kein „Find usages", kein Rename, keine Autocomplete), Tippfehler fallen erst
  zur Laufzeit (oder gar nicht) auf.

### Konkrete Bugs/Risiken, die das heute erzeugt

- **Casing-Mismatch (echter latenter Bug, weiterhin aktiv):**
  `kommonitor-data-setup.component.ts:493` sendet `"DisableBalance"` (großes D),
  der einzige Empfänger in `kommonitor-balance.component.ts:67` lauscht aber nur auf
  `'disableBalance'`. Der Broadcast läuft ins Leere. (Der korrekt geschriebene
  `'disableBalance'` wird zusätzlich aus `user-interface.component.ts:320` gesendet
  und funktioniert — der data-setup-Sender ist der defekte.) **Bei Migration mitfixen.**
- **`LIKEinitialMetadataLoadingCompleted` — faktisch erledigt:** Es existiert kein
  realer Sender/Empfänger mehr; der Name überlebt nur noch in einem Kommentar in
  `poi.component.ts:65`. Beim Cluster-Durchlauf den Restkommentar bereinigen.

### Tote Sender (kein Empfänger auffindbar)

Diese Namen werden gesendet, aber nirgends empfangen (auch nicht dynamisch) — vor der
Typisierung prüfen und ggf. löschen statt ins Enum aufnehmen:

```
onAddedFeatureToSelection
reopenBatchUpdateResultModal
resetTimeseriesMapping
onOpenAddFilterModal
```

### Tote Empfänger (kein Sender auffindbar)

`case`-Zweige, die empfangen, für die es aber **keinen Sender** gibt (auch nicht
dynamisch). Beim Cluster-Durchlauf als Roh-String belassen (nicht ins Enum) und für
späteres Löschen vormerken:

```
changeSpatialUnitViaInfoControl                              # kommonitor-map.component switch
toggleLegendControl                                         # kommonitor-map.component switch
allIndicatorPropertiesForCurrentSpatialUnitAndTime setup begin  # kommonitor-map.component switch
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

Sobald alle 226 Call-Sites umgestellt sind, kann `| string` entfernt werden — ab
dann erzwingt der Compiler typisierte Namen auf Sende- *und* (per Vergleich gegen
`BroadcastMessage.*`) auf Empfängerseite.

## Bestandsaufnahme (verifiziert 2026-06-26)

| Metrik | Wert |
|---|---|
| Sender-Call-Sites `.broadcast(...)` | 226 |
| Eindeutige statische Namen | 103 |
| Dynamisch gebaute Muster | 3 (alle in `feature-table-data-grid-helper.service.ts`) |
| Empfänger-Blöcke (`subscribe`) | 18 Dateien |

**Sender-Konzentration** (Top-4 ≈ 35 % aller Sends):

| Datei | Sends |
|---|---|
| `map-service/map.service.ts` | 24 |
| `kommonitorDataSetup/kommonitor-data-setup.component.ts` | 20 |
| `kommonitorMap/kommonitor-map.component.ts` | 20 |
| `kommonitorClassification/kommonitor-classification.component.ts` | 15 |
| `admin/adminGeoresourcesManagement/admin-georesources-management.component.ts` | 10 |
| `userInterface/user-interface.component.ts` | 7 |
| `admin/adminIndicatorsManagement/admin-indicators-management.component.ts` | 7 |

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

1. **Map-Kern** ✅ *(erledigt 2026-06-26)* — `map.service` (24 Sender) +
   `kommonitor-map.component` (20 Sender, 35 von 38 `case`s) + `generic-map-helper`
   (3 Sender) + `single-feature-map-helper` (3 Sender, 1 `case`). Alle Roh-Strings →
   `BroadcastMessage.*`. **Korrektur:** `reachability-map-helper` gehört *nicht* dazu —
   es hat keine Broadcast-Stellen (der `case 'driving-car'`-Switch läuft auf
   `transitMode`, nicht auf `msg`). Die 3 toten Empfänger (s. o.) blieben bewusst
   Roh-String.
2. **Classification / Legend**: `kommonitor-classification` + `kommonitor-legend`.
3. **DataSetup / Balance / Filter / POI**: `kommonitor-data-setup` (+ `DisableBalance`-Fix),
   `kommonitor-balance`, `kommonitor-filter`, `poi.component` (+ LIKE-Kommentar bereinigen).
4. **Diagramme**: `kommonitor-diagrams`, `indicator-radar`, `regression-diagram`.
5. **Reachability**: alle `reachability-*`-Komponenten + `reachbility-helper`.
6. **Admin**: Georesources / Indicators / SpatialUnits Management + Modals +
   `feature-table-data-grid-helper` (die 3 dynamischen Helper hier zuerst definieren).

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

Statische Namen (Stand 2026-06-26, dedupliziert — 103 Stück inkl. der fälschlichen
Variante `DisableBalance`; im Enum landen die 102 kanonischen Namen):

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
