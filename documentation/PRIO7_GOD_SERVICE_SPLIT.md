# Prio 7 — God-Services strukturell & kleinteilig aufteilen

Detaillierter, inkrementeller Fahrplan zur Umsetzung von **Prio 7** aus `PROPOSED_CHANGES.md`.
Stand: 2026-06-17, Branch `feature/migration-bootstrap-cleanup`.

## Context

Zwei Services bündeln zu viele Verantwortlichkeiten und sind Änderungs-Hotspots fast aller Komponenten. Ziel ist **inkrementelles** Herauslösen entlang von Verantwortlichkeiten — kein Big Bang — abgesichert durch die seit Prio 6 grüne Test-Baseline. Die Codebasis ist auf **Angular 21**; das erlaubt **Signals** als modernes State-Primitiv.

**Reale Ausgangslage (Doc-Zahlen aus CLAUDE.md/PROPOSED_CHANGES korrigiert):**

| Service | Pfad | real | Doc sagte | Charakter |
|---|---|---|---|---|
| DataExchangeService | `app/services/data-exchange-service/data-exchange.service.ts` | **2063 Z.** | ~3500 | 14 Cluster, **~25 geteilte mutable Felder**, **108 Konsumenten** — State-lastig, schwierig |
| KommonitorDataGridHelperService | `app/services/adminSpatialUnit/kommonitor-data-grid-helper.service.ts` | **1322 Z.** | ~4300 | LIVE, 15 Admin-Konsumenten, überwiegend **zustandslose** Grid-Builder + toter Code-Cluster |

(Die 4300-Zahl war vermutlich das gelöschte AngularJS-Original.) Hinweis: Es existiert ein
fast identischer **Zwilling** `app/services/adminGeoresourceUnit/kommonitor-data-grid-helper.service.ts`
— dort ist das Click-Handler-Muster **live** (`registerClickHandler_georesources` wird aufgerufen);
nicht mit dem spatialUnit-Service verwechseln.

## Leitprinzipien

1. **Facade-Delegation:** Der alte Service bleibt zunächst bestehen und **delegiert** an die neuen Sub-Services (re-exponiert Methoden/Felder via Getter). So bleiben Konsumenten beim Extrahieren **unverändert**; Migration der Aufrufer erfolgt danach inkrementell, der Facade-Member wird erst entfernt, wenn ihn nichts mehr referenziert.
2. **Konvention beibehalten:** Folder-per-Service, `*.service.ts` + `*.service.spec.ts`, `@Injectable({ providedIn: 'root' })`. Kein Eintrag in `app.module.ts` nötig.
3. **Ein Cluster pro PR**, jeweils `npm run build` + `npm test` + `npm run lint` grün, bevor der nächste beginnt.
4. **State-Primitiv = Signals** (siehe unten), RxJS nur für echte Streams.

## State-Strategie: Signals hinter Facade-Gettern

Für geteilten, synchron in Templates gelesenen State sind **Signals** passender als `BehaviorSubject`. Kernmuster, das die 108 Konsumenten **nicht** anfasst:

```ts
// im Sub-Service (z. B. SelectionStateService)
private _selectedIndicator = signal<IndicatorsDataset | undefined>(undefined);
readonly selectedIndicator = this._selectedIndicator.asReadonly();
setSelectedIndicator(i) { this._selectedIndicator.set(i); }

// abgeleitete Aggregate als computed() statt manuell gepflegter Felder:
readonly allFeaturesSum = computed(() => /* aus selectedIndicator + selectedDate */);

// in der Facade (DataExchangeService) — Oberfläche bleibt plain property:
get selectedIndicator() { return this.selectionState.selectedIndicator(); }
set selectedIndicator(v) { this.selectionState.setSelectedIndicator(v); }
```

- **Lese-Stellen bleiben** `this.dataExchangeService.selectedIndicator` (Getter ruft das Signal). Erst bei der späteren Konsumenten-Migration optional auf `signal()`-Call/`computed` umstellen.
- **RxJS bleibt**, wo Streams sinnvoll sind: `broadcastService` (Events), Keyword-Filter (debounce), das bereits existierende `metadataLoading$`/`selectedDate$`. Interop via `toSignal`/`toObservable` aus `@angular/core/rxjs-interop`.
- Bestehendes `BehaviorSubject`-Vorbild (`adminSpatialUnit/kommonitor-data-exchange.service.ts`) bleibt gültig; neue Stores nutzen Signals. Mischung ist via rxjs-interop unproblematisch.
- Zoneless ist **nicht** Voraussetzung (App bleibt zonen-basiert); Signals funktionieren mit Zone-CD.

## Reihenfolge: erst Grid-Helper (risikoarm), dann DataExchange

Der Grid-Helper ist kleiner, weitgehend zustandslos, hat disjunkte Schnitte und weniger Konsumenten → ideal, um das **Extraktions- + Test-Rezept** zu etablieren, bevor der State-lastige DataExchange-Service drankommt.

---

## Teil A — `kommonitor-data-grid-helper.service.ts` aufteilen

**A0 · Toten Code löschen (Cluster G).** ✅ **erledigt (2026-06-17).** `registerClickHandler_spatialUnits` + `handleEditMetadataClick/handleEditFeaturesClick/handleEditUserRolesClick/handleDeleteClick` (ehem. Z. 143–222) entfernt — der Einstiegspunkt war **nur** in einer auskommentierten, ebenfalls toten Methode `refreshSpatialUnitsGrid` (ehem. Z. 1182–1194) referenziert, also provably unreachable. Beide Blöcke gelöscht (−98 Z., 1322 → 1224). Die injizierten `BroadcastService`/`KommonitorDataExchangeService` werden anderweitig im File weiter genutzt (kein verwaister Import). Build/Test/Lint grün (70 passed/1 skipped, 0 errors).
> Nebenbefund (nicht Teil von A0): Der zugehörige Broadcast-Pfad für die Edit-/Delete-Buttons der Raumebenen-Übersicht (`onEditSpatialUnitMetadata`/`…Features`/`…UserRoles`/`onDeleteSpatialUnits`, emittiert ausschließlich aus dem nun gelöschten Code) war über den auskommentierten Einstiegspunkt **bereits zur Laufzeit deaktiviert**. Falls diese Buttons funktional sein sollen, ist das ein separater Bug — vor dem Löschen war der Pfad ebenso tot.

**A1 · `RoleManagementDataGridHelperService` herauslösen.** ✅ **erledigt (2026-06-17, via Facade-Delegation).** Neuer Service `app/services/role-management-data-grid-helper-service/role-management-data-grid-helper.service.ts` (+ Spec) enthält die volle Role-Mgmt-Implementierung: `buildRoleManagementGrid`, `buildRoleManagementGridOptionsPublic`, `buildRoleManagementDefaultColDef`, `getSelectedRoleIds_roleManagementGrid`, `getRoleManagementComponents`, `setGridApi`, die 3 privaten Renderer-Klassen `CheckboxRenderer_viewer/editor/creator`, die privaten Builder (`buildRoleManagementGridRowData/…ColumnConfig/…GridOptions`) und eigene `headerHeightSetter/Getter`. **Keine injizierten Deps** (die Renderer sind self-contained über `params`). Eigenes `gridApi`-Feld statt des im alten Service geteilten `gridApi_spatialUnits`.
> **Erkenntnisse beim Schnitt:** (a) Das vermeintlich „spatialUnit"-Feld `gridApi_spatialUnits` ist faktisch die **Role-Mgmt-Grid-API** — `setGridApi` wird ausschließlich aus Role-Mgmt-`onGridReady`-Handlern aufgerufen. (b) `getSelectedSpatialUnitsMetadata`/`saveGridStore`/`restoreGridStore` der Overview sind **toter Code** (kein Konsument). (c) Der georesource-Zwilling enthält **keine** Role-Mgmt-Logik — alle ~12 Konsumenten (spatialUnit/georesource/indicator/role/wms) importieren den spatialUnit-Helper dafür. Role-Mgmt ist also querschnittlich und gehörte nie in den spatialUnit-Service.
> **Status alter Service:** delegiert die 6 öffentlichen Methoden an den neuen Service (Konsumenten **unverändert**, 0 Komponenten angefasst). 1224 → 755 Zeilen. `setGridApi` setzt zusätzlich weiter `gridApi_spatialUnits` (Sicherheit; nur noch von totem Code gelesen). Build/Test/Lint grün (71 Suites/76 Tests, 0 errors).

**A1b · Konsumenten umstellen + Delegations-Wrapper entfernen.** ✅ **erledigt (2026-06-17).** Die **7** Komponenten, die den adminSpatialUnit-Helper typisiert (`: KommonitorDataGridHelperService`) **nur** für Role-Mgmt injizierten, injizieren jetzt direkt `RoleManagementDataGridHelperService` (Import + Injection ersetzt, Sichtbarkeit erhalten; Aufrufe inkl. Truthy-Guards + 1 HTML-Template auf `roleManagementHelper` umgestellt). Danach die 6 Delegations-Wrapper + Injection/Import aus `KommonitorDataGridHelperService` entfernt → 755 → **710 Zeilen**. Build/Test/Lint grün (71 Suites/76 Tests, 0 errors).
> Umgestellt: `georesource-edit-metadata-modal`, `georesource-edit-user-roles-modal`, `indicator-add-modal`, `role-add-modal`, `role-edit-group-rights-modal`, `spatial-unit-add-modal`, `spatial-unit-edit-user-roles-modal` (+ dessen HTML).
> **Wichtige Korrekturen gegenüber der ursprünglichen „~12 Konsumenten"-Annahme** (gleiche Methodennamen über mehrere Services führten zunächst in die Irre):
> - **`wms-add-modal` / `wms-edit-user-roles-modal` nutzen NICHT den adminSpatialUnit-Helper**, sondern einen **eigenen `OgcDataGridHelperService`** (`adminOgcServices/ogc-data-grid-helper.service.ts`, 844 Z.) mit **eigener** Role-Mgmt-Implementierung und **abweichender** `buildRoleManagementGrid`-Signatur (4 Params, ohne `tableDOMId`). Bewusst **nicht** angefasst — eigener Dedup-Kandidat (siehe unten). (Der `KommonitorDataGridHelperService`-Import in den wms-Dateien ist ein stale unused import.)
> - **4 Konsumenten injizieren den Helper über den Legacy-AngularJS-String-Token** `@Inject('kommonitorDataGridHelperService')` (Typ `any`): `georesource-add-modal`, `georesource-edit-features-modal`, `indicator-edit-features-modal`, `indicator-edit-indicator-spatial-unit-roles-modal`. **Dieser Token hat nirgends einen Provider** → zur Laufzeit unaufgelöst (würde bei Instanziierung werfen), Teil der toten AngularJS-Bridge. Nicht repointet (rufen Role-Mgmt nicht auf der echten Klasse auf). Separater Bridge-Cleanup.

**A1c · `OgcDataGridHelperService`-Role-Mgmt dedupen.** ✅ **erledigt (2026-06-17, via Delegation).** Die Role-Mgmt-Implementierung in `adminOgcServices/ogc-data-grid-helper.service.ts` war ein **verbatim Duplikat** des Shared-Service (per Diff verifiziert: Renderer-Klassen byte-identisch; einzige Unterschiede: Feldname `gridApi_wms` statt `gridApi` und die 4-Param-`buildRoleManagementGrid`-Signatur ohne das ohnehin **ungenutzte** `tableDOMId`). Der komplette Role-Mgmt-Block (3 Renderer + Builder + `getSelectedRoleIds` + Header-Helper + `gridApi_wms`-Feld) entfernt und durch 6 dünne Delegations-Wrapper an `RoleManagementDataGridHelperService` ersetzt (der 4-Param-Wrapper reicht `''` als `tableDOMId` durch). **844 → 332 Zeilen** (−512, davon ~280 echtes Duplikat). wms-Komponenten/HTML **unverändert** (rufen weiter `dataGridHelperService.*` auf → delegiert). Build/Test/Lint grün (71 Suites/76 Tests, 0 errors, Lint-Warnungen −3).
> `OgcDataGridHelperService` ist `providedIn: 'root'` (die role-mgmt-nutzenden Modals injizieren die Root-Instanz; die Factory `OgcDataGridHelperServiceFactory` betrifft nur die OGC-Datentabelle, nicht Role-Mgmt) → die Delegation an den Root-Shared-Service ist verhaltensgleich zum bisherigen Singleton-Sharing über die Admin-Modals.

**A1d · Restliche Folge-Kandidaten (offen, brauchen Entscheidung/A2):**
> - **Tote Bridge-Token-Konsumenten** (4: `georesource-add-modal`, `georesource-edit-features-modal`, `indicator-edit-features-modal`, `indicator-edit-indicator-spatial-unit-roles-modal`) klären: Sie injizieren `@Inject('kommonitorDataGridHelperService')` (kein Provider → tote AngularJS-Bridge). Entweder echten Service injizieren (falls das Feature leben soll — Produktentscheidung, nicht QA-bar ohne Keycloak) oder Komponenten als tot entfernen.
> - **`OgcDataGridHelperService`-Vollumstellung** (optional): die 2 role-mgmt-only Modals (`wms-add`, `wms-edit-user-roles`) direkt auf `RoleManagementDataGridHelperService` umstellen + die 6 Wrapper aus Ogc entfernen (analog A1b) — verlangt das Angleichen der 4-/5-Param-Signatur.
> - Im alten `KommonitorDataGridHelperService` ist `gridApi_spatialUnits` jetzt nur noch von totem Code (`getSelectedSpatialUnitsMetadata`, `saveGridStore/restoreGridStore`) gelesen und nie mehr gesetzt → mit A2-Cleanup entfernen.

**A2 · `FeatureTableDataGridHelperService` herauslösen (~566 Z.).** Cluster B+F: `buildDataGrid_featureTable_spatialResource`, `registerFeatureTableClickHandlers`, `getSelectedFeatures`, `clearFeatureTable`, `refreshFeatureTable` + private `buildFeatureTableRowData/…ColumnConfig/…GridOptions`, `handleCellValueChanged` (HTTP PUT), `handleFeatureDeleteClick` (HTTP DELETE), `deleteButtonRenderer` + die `featureTable_*_timestamp_*`-Felder. Abhängigkeiten: `HttpClient`, `BroadcastService`, `KommonitorDataExchangeService`. Konsumenten: spatial-unit edit-features etc.

**Rest:** Generische Grid-Config-Builder (Cluster A: `buildDefaultColDef`/`buildGridOptions`, Resource-Type-Konstanten, `getSpatialUnitsGridOptions`/`getFeatureTableGridOptions`) + die privaten State-Save/Restore-Helper bleiben als schlanker Basis-Service im bisherigen File.

---

## Teil B — `data-exchange.service.ts` aufteilen (Facade-basiert, geordnet von leicht → schwer)

Reihenfolge nach Kopplung: erst die State-armen, reinen Seams; der zentrale Cache- und Selektions-State zuletzt.

**B1 · `IndicatorValueService` — reine Wert-/Format-Utilities (Cluster G+N).** `indicatorValueIsNoData`, `getIndicatorValue_asFormattedText/_asNumber/_asFixedPrecisionNumber`, `getIndicatorValueFromArray_asNumber`, `syntaxHighlightJSON`, `formatIndicatorNameForLabel`, `createDualListInputArray`, `buildIndicatorPropertyName`. Praktisch zustandslos (nur `envConfigService`) → niedrigstes Risiko, erster echter Extraktions-PR nach Teil A.

**B2 · `MetadataExportService` — PDF/ZIP-Delegation (Cluster J, 12 Methoden).** `downloadMetadataPDF_georesource`, `createMetadataPDF_georesource/_indicator`, `generateAndDownloadIndicatorZIP`, `generateIndicatorMetadataPdf*`, `generateAndDownloadGeoresourceZIP`, `generateGeoresourceMetadataPdf_asBlob`, `getImageDimensions`, `getIndicatorStringFromIndicatorType`, `tsToDate_withOptionalUpdateInterval`, `dateToTS`. Fast reine Pass-throughs zu `PdfExportService` → near-zero Kopplung.

**B3 · `AccessControlService` — Berechtigungen/Rollen (Cluster H).** Die 6 `check*Permission`-Methoden, Rollen-/Org-Unit-Methoden (`getAllowedRolesString`, `getRoleTitle(s)`, `setCurrentKomMonitorLogin*`, `getAccessControlById`, `filterClientUserAdminRoles`, `updateAvailableRoles` + private `setAccessControl`/`filterAllowedAccessControl`) **zusammen mit** ihrem State (`currentKeycloakLogin*`, `currentKomMonitorLogin*`, `isRealmAdmin`, `accessControl(_map)`, `allowedAccessControl`, `availableRoles/Permissions/Users`). Kohäsiv, schreibt nur eigenen State → als Block verschiebbar; Facade-Getter für die State-Felder.

**B4 · `MetadataFilterService` — Keyword-/Typ-Filter (Cluster I).** `onChangeIndicatorKeywordFilter`, `onChangeGeoresourceKeywordFilter`, `getGeoresourceDatasets`, `getAvailable*`, `filterGeoresourcesByTypes`, `filterIndicators` + `*_keywordFiltered`-Felder. Hier **RxJS** sinnvoll (debounced Filter-Eingabe). Liest Metadaten-Collections → nach B6 final entkoppeln oder per Facade-Read koppeln.

**B5 · `TopicHierarchyStoreService` (Cluster E).** Die privaten Hierarchie-Builder (`buildTopic*Hierarchy`, `buildHeadline/ComputationIndicatorHierarchy`, `getTopicHierarchyForTopicId`) + Ergebnis-Felder (`topicIndicatorHierarchy*`, `headline/computationIndicatorHierarchy`, `topicGeoresourceHierarchy*`). Delegiert ohnehin an `TopicHierarchyService`.

**B6 · Domänen-Metadaten-Stores — Signal-Backing (Cluster B/C/D/L/M).** Je ein Store für Indicator / Georesource / SpatialUnit / WMS-WFS-Datasets: `set*`, `addSingle*`, `replaceSingle*`, `deleteSingle*`, `get*MetadataById`, `isDisplayable*` + `available*`/`available*_map`/`displayable*`-Felder als `signal()`. **Vorsicht Kopplung:** `setGeoresources` verzahnt Georesource- mit WMS/WFS-Filterung — diese Verzahnung beim Schnitt entwirren.

**B7 · `SelectionStateService` — Selektion + Aggregation (Cluster F, zuletzt/schwerste).** `selectedIndicator`, `selectedSpatialUnit`, `selectedDate`, `setSelectedDate`, `setAllFeaturesProperty`, `setSelectedFeatureProperty`, `onRemovedFeatureFromSelection` + die ~15 `allFeatures*`/`selectedFeatures*`-Aggregate. Hier zahlt sich **Signals + `computed()`** am stärksten aus: die Aggregate als abgeleitete `computed()` aus `selectedIndicator`+`selectedDate` statt manueller Pflege. Höchste Konsumenten-Dichte (`kommonitor-map`, Diagramme) → Facade-Getter halten Lese-Stellen stabil.

**Rest:** Metadaten-Orchestrierung (`fetchAllMetadata` + `fetch*Metadata`, `reinitServices`) und UI-Config-Flags (Cluster K) bleiben vorerst in der schlank gewordenen Facade; `fetchAllMetadata` koordiniert künftig die neuen Stores.

---

## Wiederholbares Rezept pro Schritt

1. Neuen Service unter `app/services/<name>/<name>.service.ts` mit `@Injectable({ providedIn: 'root' })` anlegen.
2. Cluster-Methoden + zugehörige Felder verschieben; State als `signal()` (bzw. `computed()` für Abgeleitetes), Streams als RxJS.
3. Im alten Service den neuen injizieren und für **jedes** verschobene Member einen **Delegations-Getter/-Wrapper** anlegen → Konsumenten bleiben grün.
4. `<name>.service.spec.ts` nach Standardrezept: `TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })`, ggf. `provideRouter([])`; gemeinsame Helfer aus `app/testing/test-providers.ts`. Für etwaige Legacy-String-Tokens das Double-Muster `{ provide: '…', useValue: {} }`.
5. `npm run build` + `npm test` + `npm run lint` grün → PR.
6. **Separat danach:** Konsumenten schrittweise direkt auf den neuen Service umstellen, dann den Delegations-Wrapper aus der Facade entfernen.

## Verifikation

- Nach jedem Schritt: `npm run build` (EXIT 0), `npm test` (Baseline **70 passed / 1 skipped**), `npm run lint` (0 errors). Keine Regression der Zahlen. **Node 24** nötig (`.nvmrc`).
- Neue Sub-Services bekommen je ein Spec (mind. „should be created" + ein Verhaltenstest pro nicht-trivialer Methode) → die Test-Zahl steigt.
- Smoke-Test der betroffenen Admin-Flows soweit ohne Keycloak möglich; Live-Visual-QA bleibt durch den Keycloak-`localhost`-Redirect eingeschränkt (bekannt).
- `git grep` nach dem alten Member-Namen bestätigt vor dem Entfernen eines Facade-Wrappers, dass kein Konsument ihn mehr direkt nutzt.
