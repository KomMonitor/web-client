# Prio 7 — God-Services strukturell & kleinteilig aufteilen

Detaillierter, inkrementeller Fahrplan zur Umsetzung von **Prio 7** aus `PROPOSED_CHANGES.md`.
Stand: 2026-06-25, Branch `feature/migration-bootstrap-cleanup`.

## Context

Zwei Services bündeln zu viele Verantwortlichkeiten und sind Änderungs-Hotspots fast aller Komponenten. Ziel ist **inkrementelles** Herauslösen entlang von Verantwortlichkeiten — kein Big Bang — abgesichert durch die seit Prio 6 grüne Test-Baseline. Die Codebasis ist auf **Angular 21**; das erlaubt **Signals** als modernes State-Primitiv.

**Reale Ausgangslage (Doc-Zahlen aus CLAUDE.md/PROPOSED_CHANGES korrigiert):**

| Service                         | Pfad                                                                   | real        | Doc sagte | Charakter                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------- | ----------- | --------- | ------------------------------------------------------------------------------------------ |
| DataExchangeService             | `app/services/data-exchange-service/data-exchange.service.ts`          | **2063 Z.** | ~3500     | 14 Cluster, **~25 geteilte mutable Felder**, **108 Konsumenten** — State-lastig, schwierig |
| KommonitorDataGridHelperService | `app/services/adminSpatialUnit/kommonitor-data-grid-helper.service.ts` | **1322 Z.** | ~4300     | LIVE, 15 Admin-Konsumenten, überwiegend **zustandslose** Grid-Builder + toter Code-Cluster |

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
>
> - **`wms-add-modal` / `wms-edit-user-roles-modal` nutzen NICHT den adminSpatialUnit-Helper**, sondern einen **eigenen `OgcDataGridHelperService`** (`adminOgcServices/ogc-data-grid-helper.service.ts`, 844 Z.) mit **eigener** Role-Mgmt-Implementierung und **abweichender** `buildRoleManagementGrid`-Signatur (4 Params, ohne `tableDOMId`). Bewusst **nicht** angefasst — eigener Dedup-Kandidat (siehe unten). (Der `KommonitorDataGridHelperService`-Import in den wms-Dateien ist ein stale unused import.)
> - **4 Konsumenten injizieren den Helper über den Legacy-AngularJS-String-Token** `@Inject('kommonitorDataGridHelperService')` (Typ `any`): `georesource-add-modal`, `georesource-edit-features-modal`, `indicator-edit-features-modal`, `indicator-edit-indicator-spatial-unit-roles-modal`. **Dieser Token hat nirgends einen Provider** → zur Laufzeit unaufgelöst (würde bei Instanziierung werfen), Teil der toten AngularJS-Bridge. Nicht repointet (rufen Role-Mgmt nicht auf der echten Klasse auf). Separater Bridge-Cleanup.

**A1c · `OgcDataGridHelperService`-Role-Mgmt dedupen.** ✅ **erledigt (2026-06-17, via Delegation).** Die Role-Mgmt-Implementierung in `adminOgcServices/ogc-data-grid-helper.service.ts` war ein **verbatim Duplikat** des Shared-Service (per Diff verifiziert: Renderer-Klassen byte-identisch; einzige Unterschiede: Feldname `gridApi_wms` statt `gridApi` und die 4-Param-`buildRoleManagementGrid`-Signatur ohne das ohnehin **ungenutzte** `tableDOMId`). Der komplette Role-Mgmt-Block (3 Renderer + Builder + `getSelectedRoleIds` + Header-Helper + `gridApi_wms`-Feld) entfernt und durch 6 dünne Delegations-Wrapper an `RoleManagementDataGridHelperService` ersetzt (der 4-Param-Wrapper reicht `''` als `tableDOMId` durch). **844 → 332 Zeilen** (−512, davon ~280 echtes Duplikat). wms-Komponenten/HTML **unverändert** (rufen weiter `dataGridHelperService.*` auf → delegiert). Build/Test/Lint grün (71 Suites/76 Tests, 0 errors, Lint-Warnungen −3).

> `OgcDataGridHelperService` ist `providedIn: 'root'` (die role-mgmt-nutzenden Modals injizieren die Root-Instanz; die Factory `OgcDataGridHelperServiceFactory` betrifft nur die OGC-Datentabelle, nicht Role-Mgmt) → die Delegation an den Root-Shared-Service ist verhaltensgleich zum bisherigen Singleton-Sharing über die Admin-Modals.

**A1d · Restliche Folge-Kandidaten.**

**A1d-2 · `OgcDataGridHelperService`-Vollumstellung.** ✅ **erledigt (2026-06-19).** Die 2 role-mgmt-only Modals (`wms-add-modal`, `wms-edit-user-roles-modal`) injizieren jetzt direkt `RoleManagementDataGridHelperService` (Feld `dataGridHelperService: OgcDataGridHelperService` → `roleManagementHelper`, alle Aufrufe inkl. der beiden HTML-`getRoleManagementComponents()`-Bindings umgestellt). Die `buildRoleManagementGrid`-Aufrufe bekamen `''` als ersten `tableDOMId`-Parameter (reproduziert das bisherige 4-Param-Wrapper-Verhalten verbatim). Danach die 6 Delegations-Wrapper + `roleManagementHelper`-Inject + Import (+ neu verwaisten `GridApi`-Import) aus `OgcDataGridHelperService` entfernt. Verifiziert: nur diese 2 Modals nutzten die Wrapper (`wms-edit-modal`/`wms-admin-table` nicht). Bonus: der laut A1c stale `KommonitorDataGridHelperService`-Import in beiden Modals mitentfernt. Build/Test/Lint grün (71 Suites/76 Tests, 0 errors, Lint-Warnungen −3).

**A1d-3 · `gridApi_spatialUnits` entfernen.** ✅ **erledigt (2026-06-19).** Im `adminSpatialUnit/kommonitor-data-grid-helper.service.ts` das nie gesetzte Feld `gridApi_spatialUnits` + seine Leser entfernt: toter Code `getSelectedSpatialUnitsMetadata`, blanke `saveGridStore`/`restoreGridStore` (nur die `_featureTable`-Varianten waren live). **Korrektur zum ursprünglichen A1d-Befund:** auch `headerHeightSetter` las das Feld und war **live** (Aufrufe in den Feature-Table-Grid-Optionen `onFirstDataRendered`/`onColumnResized`) — da das Feld aber immer `null` war, lief der Body nie → reiner No-op. `headerHeightSetter` + sein nur dort genutzter `headerHeightGetter` + die 2 Call-Sites verhaltensneutral entfernt. Build/Test/Lint grün.

> **Latenter Bug (nicht gefixt, bewusst):** `headerHeightSetter` hätte vermutlich `gridApi_featureTable` statt `gridApi_spatialUnits` setzen sollen (Copy-Paste aus `RoleManagementDataGridHelperService`/`adminFilterConfig`, die ein eigenes `gridApi` führen). Header-Höhe der Feature-Tabelle wurde nie angewendet. Ein Fix wäre eine Verhaltensänderung → separater Bugfix-Kandidat, falls die Feature-Table-Header-Höhe dynamisch sein soll.

**A1d-1 · Tote Bridge-Token-Modals → ausgegliedert als eigenes Folgeprojekt (siehe unten).** Ursprüngliche Annahme (nur der providerlose Grid-Token) **korrigiert:** alle 4 Modals hängen an **3–5** toten AngularJS-Bridge-String-Tokens (0 Provider, verifiziert), nicht nur am Grid-Service. Wiederbeleben = vollständige Migration weg von der Bridge pro Modal — das ist Bridge-Cleanup, nicht Grid-Helper-Splitting.

### Folgeprojekt: AngularJS-Bridge-Migration der 4 Admin-Modals

> **✅ ALLE 4 Modals erledigt (2026-06-22)** — Folgeprojekt abgeschlossen: `indicator-edit-indicator-spatial-unit-roles-modal`; `georesource-add-modal` (Porting-Lücke `getCurrentKomMonitorLoginRoleIds` → `[]`); `georesource-edit-features-modal` (`FeatureTableDataGridHelperService`); `indicator-edit-features-modal` (voller Port: `buildDataGrid_featureTable_indicatorResource` + `buildPutBody_indicators` aus der Git-Historie, `$http`→`HttpClient`, `<ag-grid-angular>`). Korrektur zur Tabelle unten: Modal 4 öffnet **nicht** via `NgbModal.open`, sondern via Broadcast + jQuery `$('#…').modal('show')` (unverändert gelassen). ⚠️ Die Indikator-Feature-Tabelle (Modal 3) ist backend-/Keycloak-gebunden → Backend-Smoke-Test vor Release nötig.

Die 4 Modals werden via `NgbModal.open(KomponenteKlasse)` an Buttons geöffnet und **werfen heute beim Öffnen** (DI-Fehler: kein Provider für die String-Tokens — alle Modals zur Laufzeit kaputt). Jedes braucht eine eigene Migration weg von der toten AngularJS-Bridge (echte Angular-Services verdrahten + Bodies umschreiben). Backend-integriert (Importer = Spatial Insert/Update) → ohne Keycloak + Backend **nicht QA-bar**. Empfehlung: **1 Commit pro Modal**.

| Modal                                               | Tote Bridge-Tokens (kein Provider)                                | Zusätzlich                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `georesource-add-modal`                             | dataExchange, importer, multiStepForm, dataGrid                   | —                                                                                                           |
| `georesource-edit-features-modal`                   | dataExchange, multiStepForm, dataGrid, importer, singleFeatureMap | —                                                                                                           |
| `indicator-edit-features-modal`                     | dataExchange, dataGrid, importer, multiStepForm                   | `buildDataGrid_featureTable_indicatorResource` portieren (existiert **nirgends** als echte Implementierung) |
| `indicator-edit-indicator-spatial-unit-roles-modal` | dataExchange, dataGrid, multiStepForm                             | —                                                                                                           |

> Hinweis: Tier 1 (`georesource-add`, `indicator-edit-indicator-spatial-unit-roles`) nutzt vom Grid-Token nur Role-Mgmt → der Grid-Anteil ist trivial auf `RoleManagementDataGridHelperService` umstellbar; blockierend sind die übrigen Bridge-Tokens. Tier 2a (`georesource-edit-features`) bräuchte `buildDataGrid_featureTable_spatialResource` + `resourceType_georesource` (seit A2 im `FeatureTableDataGridHelperService`). Tier 2b (`indicator-edit-features`) braucht die **nirgends existierende** `buildDataGrid_featureTable_indicatorResource` → echtes Porting.

**A2 · `FeatureTableDataGridHelperService` herauslösen.** ✅ **erledigt (2026-06-19, vollständige Extraktion + Repoint).** Neuer Service `app/services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service.ts` (+ Spec) übernimmt den kompletten Feature-Table-Cluster (Cluster B+F): `buildDataGrid_featureTable_spatialResource`, `registerFeatureTableClickHandlers`, `getSelectedFeatures`, `clearFeatureTable`, `refreshFeatureTable`, `getFeatureTableGridOptions` (public); privat `buildFeatureTableGridOptions/…ColumnConfig/…RowData`, `deleteButtonRenderer`, `handleFeatureDeleteClick` (HTTP DELETE), `handleCellValueChanged` (HTTP PUT), `getCurrentTimestamp`, `saveGridStore_featureTable/restoreGridStore_featureTable`; Felder `dataGridOptions_featureTable`, `gridApi_featureTable`, `currentResourceId`, die 6 `featureTable_*_timestamp_*` **und die 3 `resourceType_*`-Konstanten** (werden nur im Feature-Table-Kontext genutzt). Deps: `HttpClient`, `BroadcastService`, `KommonitorDataExchangeService`.

> **Schnitt:** Statt Facade-Delegation direkt umgestellt, da nur **ein** Live-Konsument existierte: `spatial-unit-edit-features-modal` (die georesource-/indicator-`edit-features`-Modals rufen dieselben Namen auf dem **toten** Bridge-Token auf → siehe Folgeprojekt, nicht betroffen). Dieser Konsument injiziert jetzt `FeatureTableDataGridHelperService` (Feld `kommonitorDataGridHelperService` → `featureTableHelper`, TS + 4 HTML-Bindings). Der alte `KommonitorDataGridHelperService` schrumpft **633 → 61 Z.** und ist jetzt der schlanke Basis-Service. Build/Test/Lint grün.

**Rest:** Generische Grid-Config-Builder (Cluster A: `buildDefaultColDef`/`buildGridOptions`, `getSpatialUnitsGridOptions`) verbleiben als schlanker Basis-`KommonitorDataGridHelperService`. Die Feature-Table-spezifischen State-Save/Restore-Helper (`*_featureTable`) sind mit A2 in den neuen Service gewandert; die Resource-Type-Konstanten ebenfalls.

---

## Teil B — `data-exchange.service.ts` aufteilen (Facade-basiert, geordnet von leicht → schwer)

Reihenfolge nach Kopplung: erst die State-armen, reinen Seams; der zentrale Cache- und Selektions-State zuletzt.

> **Reihenfolge B4↔B5↔B6 getauscht (2026-06-19):** B4 (Filter) sitzt funktional **über** B5 (Hierarchie) + B6 (Metadaten-Collections) — die Keyword-Filter rufen die Hierarchie-Builder und lesen die Collections. Daher faktische Abhängigkeit **B6 → B5 → B4**; ausgeführt wird **B5, dann B6, dann B4**, um zirkuläre DI zu vermeiden.

**B1 · `IndicatorValueService` — reine Wert-/Format-Utilities (Cluster G+N).** ✅ **erledigt (2026-06-19, via Facade-Delegation).** Neuer Service `app/services/indicator-value-service/indicator-value.service.ts` (+ Spec) mit den **8** Utilities: `indicatorValueIsNoData`, `getIndicatorValue_asFormattedText/_asNumber/_asFixedPrecisionNumber`, `getIndicatorValueFromArray_asNumber`, `syntaxHighlightJSON`, `formatIndicatorNameForLabel`, `createDualListInputArray`. **Dep: nur `EnvConfigService`** — verifiziert zustandslos (kein `selectedIndicator`/`selectedDate`).

> **Erkenntnisse beim Schnitt:** (a) Der Cluster war **nicht** ganz zustandslos: die 3 Value-Formatter lasen `selectedIndicator.precision`. Gelöst, ohne den neuen Service zu verunreinigen: dieser nimmt `precision` als Parameter (Default `envConfigService.numberOfDecimals`); die **Facade** löst den State über den privaten Helper `resolveSelectedPrecision()` auf und reicht ihn beim Delegieren durch (verhaltensgleich). (b) `syntaxHighlightJSON` war im DataExchange ein Feld (`= function(){}`) → im neuen Service eine Methode; der interne Caller `displayMapApplicationError` ruft weiter `this.syntaxHighlightJSON(...)` über den Facade-Wrapper. (c) `buildIndicatorPropertyName` **bewusst zurückgestellt** (nicht extrahiert): 0 externe Konsumenten, reine `prefix + this.selectedDate`-Logik → gehört zu **B7** (SelectionState); eine Extraktion brächte nur eine weitere selectedDate-Kopplung. (d) `syntaxHighlightJSON` ist generisch (nicht indikator-spezifisch), wurde aber laut Doc-Cluster mit übernommen.
> **Status DataExchange:** 8 Methoden sind jetzt Delegations-Wrapper gleicher Signatur; `IndicatorValueService` injiziert. Konsumenten **unverändert** (u. a. 25 `syntaxHighlightJSON`-Nutzer). Build/Test/Lint grün (73 Suites/88 Tests, 0 errors).

**B2 · `MetadataExportService` — PDF/ZIP-Delegation (Cluster J, 12 Methoden).** ✅ **erledigt (2026-06-19, via Facade-Delegation).** Neuer `app/services/metadata-export-service/metadata-export.service.ts` (+ Spec), Dep nur `PdfExportService`, verifiziert zustandslos. Die 12 Methoden (`downloadMetadataPDF_georesource`, `createMetadataPDF_georesource/_indicator`, `generateAndDownloadIndicatorZIP`, `generateIndicatorMetadataPdf*`, `generateAndDownloadGeoresourceZIP`, `generateGeoresourceMetadataPdf_asBlob`, `getImageDimensions`, `getIndicatorStringFromIndicatorType`, `tsToDate_withOptionalUpdateInterval`, `dateToTS`) bekommen den DataExchange-State (`availableTopics`/`availableSpatialUnits`/`selectedIndicator`) als Parameter; die Facade liest ihn und reicht ihn über gleich-signierte Delegations-Wrapper durch. Die `PdfExportService`-Injection wurde aus DataExchange **entfernt** (nur noch hier genutzt). Konsumenten unverändert. Build/Test/Lint grün (74 Suites/91 Tests, 0 errors).

**B3 · `AccessControlService` — Berechtigungen/Rollen (Cluster H).** ✅ **erledigt (2026-06-19, via Facade-Delegation).** Neuer `app/services/access-control-service/access-control.service.ts` (+ Spec), Deps `EnvConfigService` + `BroadcastService`. Verschoben (verbatim): die **7** `check*Permission`-Methoden (`checkDelete/Admin/Create/Editor/Groups/Themes/ResourcesEdit*`), `getAllowedRolesString`, `getRoleTitle(s)`, `setCurrentKomMonitorLogin*`, `getAccessControlById`, `filterClientUserAdminRoles`, `updateAvailableRoles`, `setAccessControl` (public), `filterAllowedAccessControl` (private) — **zusammen mit** ihrem State (`currentKeycloakLogin*`, `currentKomMonitorLogin*`, `isRealmAdmin`, `accessControl(_map)`, `allowedAccessControl`, `availableRoles/Permissions/Users`).

> **Schnitt:** Methoden → Delegations-Wrapper in der Facade (`filterAllowedAccessControl` ist cluster-privat → kein Wrapper). State: nur die **7** extern bzw. von der bleibenden Auth-/Fetch-Orchestrierung genutzten Felder (`accessControl`, `currentKeycloakLogin*` ×3, `currentKomMonitorLogin*` ×2, `isRealmAdmin`) bekommen **Facade-Get/Set** (Login-Felder werden in der Orchestrierung beim Token-Parsing geschrieben + extern in `user-login` zurückgesetzt → Set nötig); die übrigen 5 (`accessControl_map`, `allowedAccessControl`, `availableRoles/Permissions/Users`, 0 externe Konsumenten) leben nur noch im neuen Service. Konsumenten unverändert (u. a. 18 `accessControl`-Leser). ⚠️ Auth-kritisch, ohne Keycloak nicht laufzeit-QA-bar — Bodies wurden daher unverändert übernommen. Build/Test/Lint grün (75 Suites/96 Tests, 0 errors).

**B4 · Keyword-/Typ-Filter (Cluster I).** ✅ **erledigt (2026-06-19, zweigeteilt).** Der **Georesource-Teil** ging wegen der gegenseitigen Kopplung mit `setGeoresources` **zusammen mit B6e** in den `GeoresourceMetadataStoreService` (siehe B6e ✅). Der **Indicator-Keyword-Filter** ist jetzt der neue `app/services/metadata-filter-service/metadata-filter.service.ts` (+ Spec): `onChangeIndicatorKeywordFilter` (schreibt `displayableIndicators_keywordFiltered` + triggert die 3 Indicator-Hierarchie-Builds direkt über den `TopicHierarchyStore`), `filterIndicators` (Prädikat über `indicatorStore.isDisplayableIndicator`), private `filterArrayObjectsByValue`. Deps: Indicator-/Topic-/ProcessScript-/Georesource-Store + `TopicHierarchyStoreService` (alles Leaf-Stores, kein Zyklus). Facade: `displayableIndicators_keywordFiltered` → Get/Set (B6d-Wrapper schreibt es, Build-Wrapper + `kommonitor-data-setup` lesen), 2 Methoden-Wrapper, facade-`filterArrayObjectsByValue` entfernt. Build/Test/Lint grün (82 Suites/119 Tests, 0 errors).

**B5 · `TopicHierarchyStoreService` (Cluster E).** ✅ **erledigt (2026-06-19, via Param-Passing-Facade).** Neuer `app/services/topic-hierarchy-store-service/topic-hierarchy-store.service.ts` (+ Spec), Dep nur `TopicHierarchyService`. Verschoben: die 5 Builder (`buildTopicGeoresource/Computation/Topic/HeadlineIndicatorHierarchy`, `getTopicHierarchyForTopicId`) + 5 Ergebnisfelder (`topicIndicatorHierarchy`, `headline/computationIndicatorHierarchy`, `topicGeoresourceHierarchy(_unmappedEntries)`).

> **Schnitt:** Die Builder rufen **nicht** in DataExchange zurück (nur in `TopicHierarchyService` + schreiben eigene Felder) → kein Zyklus. Input-Collections (`availableTopics`, `displayable*_keywordFiltered`, `wms/wfsDatasets_keywordFiltered`, `availableProcessScripts`, `getAvailableIndiWmsDatasets()`) werden als **Parameter** übergeben; die Facade behält private Builder-Wrapper (lesen `this.X`, reichen durch) + Getter für die 5 Ergebnisfelder (je ~4 externe Leser, keine externen Schreibzugriffe → keine Setter). `topicIndicatorHierarchy_forOrderView` bleibt in DataExchange (Orchestrierungs-Snapshot). Build/Test/Lint grün (76 Suites/100 Tests, 0 errors).

**B6 · Domänen-Metadaten-Stores (Cluster B/C/D/L/M).** 🚧 **in Arbeit — inkrementell, je ein Store pro Domäne.** Je ein Store für Indicator / Georesource / SpatialUnit / WMS-WFS-Datasets: `set*`, `addSingle*`, `replaceSingle*`, `deleteSingle*`, `get*MetadataById`, `isDisplayable*` + `available*`/`available*_map`/`displayable*`-Felder. **Vorsicht Kopplung:** `setGeoresources` ruft `onChangeGeoresourceKeywordFilter` (B4) → die Georesource-Domäne ist mit B4 verzahnt und wird **erst nach/mit B4** geschnitten. (Plain Fields + Facade-Getter statt `signal()` — verhaltensgleich, niedrigstes Risiko; Signals optional später.)

> **B6a · `SpatialUnitMetadataStoreService`** ✅ **erledigt (2026-06-19).** Neuer `app/services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service.ts` (+ Spec, keine Deps): Felder `availableSpatialUnits(_map)`, Methoden `setSpatialUnits`/`getSpatialUnitMetadataById` (verbatim). Sauberste Domäne (Setter populiert nur, keine Filter-/Hierarchie-Calls). Facade: Getter für `availableSpatialUnits` (23 Leser, keine externen Schreibzugriffe → kein Setter), `_map` nur im Store, 2 Delegations-Wrapper. Build/Test/Lint grün (77 Suites/103 Tests, 0 errors).
> **B6b · `ProcessScriptMetadataStoreService`** ✅ **erledigt (2026-06-19).** Neuer `app/services/process-script-metadata-store-service/process-script-metadata-store.service.ts` (+ Spec, keine Deps): `availableProcessScripts(_map)` + `setProcessScripts` (verbatim). Facade-Getter für `availableProcessScripts` (4 Leser, kein Setter), `_map` nur im Store, 1 Wrapper. Build/Test/Lint grün (78 Suites/105 Tests, 0 errors).
> **B6c · `TopicMetadataStoreService`** ✅ **erledigt (2026-06-19).** Neuer `app/services/topic-metadata-store-service/topic-metadata-store.service.ts` (+ Spec, keine Deps): `availableTopics` + `setTopics` (verbatim). Facade-Getter für `availableTopics` (11 Leser, kein Setter), 1 Wrapper. Build/Test/Lint grün (79 Suites/107 Tests, 0 errors).
> **B6d · `IndicatorMetadataStoreService`** ✅ **erledigt (2026-06-19).** Neuer `app/services/indicator-metadata-store-service/indicator-metadata-store.service.ts` (+ Spec), Dep nur `EnvConfigService`. Verschoben: `availableIndicators(_map)` + `displayableIndicators` + die 9 Methoden (`setIndicators`, `add/replace/deleteSingleIndicatorMetadata`, `getIndicatorMetadataById`, `modifySingleIndicator`, `modifyIndicators`, `modifyIndicatorApplicableSpatialUnitsForLoginRoles`, `isDisplayableIndicator`). Facade-Getter für `availableIndicators` (15 Leser) + `displayableIndicators` (6 Leser), keine Setter; `_map` nur im Store; 9 Delegations-Wrapper. **Kopplung gelöst:** `modifyIndicatorApplicableSpatialUnitsForLoginRoles` bekommt `availableSpatialUnits` als Parameter (Facade reicht durch); der B4-Snapshot `displayableIndicators_keywordFiltered` bleibt in der Facade (wird im Wrapper aus `this.displayableIndicators` abgeleitet). Build/Test/Lint grün (80 Suites/111 Tests, 0 errors).
> **B6e · `GeoresourceMetadataStoreService` (Georesource + WMS/WFS + Georesource-Filter, B6e + B4-Georesource zusammen)** ✅ **erledigt (2026-06-19).** Neuer `app/services/georesource-metadata-store-service/georesource-metadata-store.service.ts` (+ Spec). Deps: `EnvConfigService`, `TopicHierarchyService`, `TopicHierarchyStoreService`, `TopicMetadataStoreService`. Verschoben: 12 Felder (`availableGeoresources(_map)`, `displayableGeoresources`, `availableWmsDatasets`, `wmsDatasets`, `wfsDatasets`, `*_keywordFiltered`, `…_forAlphabeticalDisplay`, `georesourceMapKey_forUnmappedTopicReferences`) + ~19 Methoden (setGeoresources/setServices, add/replace/delete, getById, isDisplayableGeoresource, alle Georesource-/WMS/WFS-Filter inkl. `onChangeGeoresourceKeywordFilter`/`getGeoresourceDatasets`/`getAvailable*`/`filterGeoresourcesByTypes`, setWmsLayer*). **Kopplung intern gelöst:** `setGeoresources`↔`onChangeGeoresourceKeywordFilter` beide im Store; `buildTopicGeoresourceHierarchy` direkt über injizierten `TopicHierarchyStore`; `availableTopics` aus `TopicStore`; `filterArrayObjectsByValue` als private Store-Kopie; `topicHierarchyContains*` ganz in den Store (kein Facade-Wrapper). Facade: 12 Getter (`displayableGeoresources`zusätzlich Setter — 1 ext. Schreibzugriff in`reachability-poi-in-iso`), Methoden-Wrapper; ungenutzte `TopicHierarchyService`-Injection aus DataExchange entfernt. Build/Test/Lint grün (81 Suites/115 Tests, 0 errors).
> **Offen (Teil B):** nur noch **B7 · SelectionStateService**.

**B7 · `SelectionStateService` — Selektion + Aggregation (Cluster F).** ✅ **erledigt (2026-06-19).** Neuer `app/services/selection-state-service/selection-state.service.ts` (+ Spec), Deps `IndicatorValueService` + `EnvConfigService`. Verschoben: `selectedIndicator`, `selectedSpatialUnit`, `selectedDate`, `selectedDate$` (+ privates `selectedDateSubject`), die 14 `allFeatures*`/`selectedFeatures*`-Aggregate (inkl. `allFeaturesPropertyUnit`, `*Regional*`), die Methoden `setSelectedDate`/`setAllFeaturesProperty`/`setSelectedFeatureProperty`/`onRemovedFeatureFromSelection`/`buildIndicatorPropertyName` (B1-zurückgestellt) + `resolveSelectedPrecision`.

> **Schnitt:** Facade-**Get/Set** für `selectedIndicator`/`selectedSpatialUnit`/`selectedDate` (externe Writes nur in `kommonitor-data-setup`; Leser: 21/14/18 Dateien), **Getter** für die Aggregate + `selectedDate$` (keine externen Writes). Die Value-Aufrufe in `setAllFeaturesProperty`/`setSelectedFeatureProperty` gehen direkt an `IndicatorValueService` mit selbst aufgelöster Precision. `metadataLoading$`/`setMetadataState` **bleiben** in der Facade (kein Selektions-State). Facade-`resolveSelectedPrecision` delegiert an den Store. Plain Fields (Signals/`computed()` optional später). Build/Test/Lint grün (83 Suites/124 Tests, 0 errors). ⚠️ Karte/Diagramme betroffen → manueller Smoke-Test vor Release empfohlen.

**Rest (B8, 2026-06-25 nachgezogen):** Die Metadaten-Orchestrierung (`fetchAllMetadata` + `fetch*Metadata`, `reinitServices`) + `metadataLoading$` sind seit B8 (siehe unten) **nicht mehr** in der Facade, sondern im `MetadataBootstrapService`. In der Facade verbleiben **nur** die UI-Config-Flags (Cluster K) + POI-/Misc-State als plain Fields.

**B8 · `MetadataBootstrapService` — App-Startup-Orchestrierung (Cluster „Rest") + Auth-Token-Parsing.** ✅ **erledigt (2026-06-25).** Neuer `app/services/metadata-bootstrap-service/metadata-bootstrap.service.ts` (+ Spec, 218 Z.). Verschoben aus der Facade: `fetchAllMetadata`, die per-Resource-Fetcher (`fetchTopics/SpatialUnits/Georesources/Indicators/IndicatorScripts/AccessControlMetadata`, `fetchServices`), `reinitServices`, `modifyIndicatorApplicableSpatialUnitsForLoginRoles`, `onMetadataLoadingCompleted`, die `build*Hierarchy`-Orchestrierung sowie der Loading-State (`metadataLoading$` + `setMetadataState`) und die beiden Bootstrap-Felder `currentKeycloakUser` + `topicIndicatorHierarchy_forOrderView`. **B2-Teil:** das Keycloak-Token-Parsing (Login-Rollen/-Gruppen/`isRealmAdmin`) wanderte als `AccessControlService.applyLoginStateFromToken` in den B3-Service; der Bootstrap ruft es nur noch auf.

> **Schnitt:** zunächst **Facade-Delegation** (8 Methoden-Wrapper + 3 Getter) → Konsumenten unverändert; die Facade injizierte danach nur noch **2** statt 14 Services. ⚠️ Startup- + Auth-Pfad → Backend/Keycloak-Smoke-Test vor Release nötig (lokal nicht verifizierbar). Build/Test/Lint grün.

---

## Teil C — Facade-Restauflösung („B-Rest", Phasen 0–10, 2026-06-25)

Nach Teil B blieb `DataExchangeService` ein **schlanker UI-State-Halter** (~117 Z., nur noch plain mutable Felder, kein Methoden-Wrapper mehr). Teil C löst diesen Rest auf, bis die **Facade ganz verschwindet**. Anders als in Teil B sind es plain Felder, die direkt gelesen **und geschrieben** werden → **Direkt-Repoint** je Cluster (Reads + Writes zusammen, kein Delegations-Zwischenschritt). Pro Cluster ein PR, Felder in einen kohärenten Service oder lokal verschoben. Methodik-Hinweis: der Fan-in wurde nach **injiziertem Typ** ermittelt (die Facade wurde unter 4 Variablennamen injiziert: `dataExchangeService`, `kommonitorDataExchangeService`, `angularJsDataExchangeService`, `service`), nicht nach Variablenname.

| Phase  | Schnitt                                                                                                                                                                                                                                                                                                                                                                                                              | Ergebnis   |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **0**  | Dead-Code: `selectedDateInit`, `tmpIndicatorGeoJSON`, `anySideBarIsShown` (0 Refs) entfernt                                                                                                                                                                                                                                                                                                                          | 117 → 111  |
| **1**  | `PoiPresentationService` (`selectedPoiSize`, `availablePoiMarkerColors`, `getLoiDashSvgFromStringValue`); dedupte das doppelte Marker-Color-Array gegen `POI_MARKER_COLORS`                                                                                                                                                                                                                                          | —          |
| **2**  | `ChartDisplayStateService` (Balance/Measure-of-Value: `isBalanceChecked`, `indicatorAndMetadataAsBalance`, `isMeasureOfValueChecked`, `measureOfValue`) — 16 Dateien                                                                                                                                                                                                                                                 | —          |
| **3**  | `MapOverlayStateService` (`isochroneLegend`, `reachabilityScenarioOnMainMap`, `wms/wfsUrlForSelectedIndicator`, `wmsLegendImage`, `baseLayerDefinitionsArray`) — 15 Dateien                                                                                                                                                                                                                                          | —          |
| **4**  | `RangeFilterStateService` (`rangeFilterData`, `rangeFilterIsApplied`)                                                                                                                                                                                                                                                                                                                                                | —          |
| **5**  | `GeometrySimplificationService` (`simplifyGeometries`, `simplifyGeometriesParameterName`)                                                                                                                                                                                                                                                                                                                            | —          |
| **6**  | `AdminLoginStateService` (`adminUserName/Password/IsLoggedIn`) — inkl. `auth.guard` (funktionaler Guard)                                                                                                                                                                                                                                                                                                             | —          |
| **7**  | `ExportButtonVisibilityService` (`showDiagram/GeoresourceExportButtons`)                                                                                                                                                                                                                                                                                                                                             | —          |
| **8**  | Restfelder aufgelöst → **Facade leer**: `selectedIndicatorBackup`/`classifyZeroSeparately_backup`/`fileDatasets` als **lokales Komponentenfeld** (Single-Consumer); totes `SpatialUnit`-Interface entfernt; `configMeanDataDisplay` (Default in den EnvConfig-Getter gezogen), `disableIndicatorDatePicker` (→ `SelectionStateService`), `indicatorDatePrefix` + `FEATURE_NAME_PROPERTY_NAME` (→ `EnvConfigService`) | 0 Member   |
| **9**  | **Leere Facade + Spec gelöscht** + ~45 stale Imports/Injections entfernt                                                                                                                                                                                                                                                                                                                                             | Klasse weg |
| **10** | `data-exchange.constants.ts` aufgelöst: `MetadataLoadingState` → `metadata-bootstrap.service.ts`, `UPDATE_INTERVAL_LABELS` → `pdf-export.service.ts` (file-private), `DATE_PICKER_OPTIONS` → `util/date-picker.constants.ts`                                                                                                                                                                                         | Ordner weg |

> **Schnitt-Erkenntnisse / Fallstricke (vom Build gefangen, wo nötig):**
>
> - **Block-Kommentar-Fallen:** mehrere vermeintliche Live-Konsumenten (`kommonitor-map` WMS/WFS-URL-Zeilen ~1361, diagram-helper `showDiagramExportButtons` ~2527, diverse `datePickerOptions`) lagen in `/* */`-Blöcken → tot. Per `/*`-/`*/`-Balance verifiziert.
> - **Lokale Shadows:** `regression-diagram` hat **eigene** lokale `measureOfValue`/`isMeasureOfValueChecked`-Felder (kein Facade-State) — nicht angefasst.
> - **Diagram-helper (Phase 7):** zunächst fälschlich übersprungen (nur der tote Kommentar gesehen) — hatte aber **4 live** `showDiagramExportButtons`-Stellen; der Build fing es, als ADD-Datei nachgezogen.
> - **`enableScatterPlotRegression` (Phase 9):** wurde per `[(ngModel)]`-Checkbox **ad-hoc auf das Facade-Singleton** geschrieben (deshalb lief es) → in ein echtes lokales Komponentenfeld (TS + Template) überführt.
> - **`indicator-add-modal` (Phase 9):** 13 vestigiale Truthy-Guards `this.kommonitorDataExchangeService && X` verhaltensneutral aufgelöst (`true && X` ≡ `X`).
>
> ⚠️ **Bewusste Verhaltensänderung (Phase 8, vom User freigegeben):** Die Facade-Felder `indicatorDatePrefix`/`FEATURE_NAME_PROPERTY_NAME` wurden **nie geschrieben** → Live-Leser bekamen `undefined` (z. B. `feature.properties[undefined]`, `"undefined"+date`-Property-Namen). Sie lesen jetzt den echten Env-Wert via `EnvConfigService` (Bugfix, konsistent mit den 28+/50+ bestehenden `envConfigService.X`-Nutzungen). Betrifft Legende + Chart-Property-Lookups → **Smoke-Test vor Release** (lokal Keycloak-limitiert).

Aus `DataExchangeService` extrahierte/abgeleitete Services in Teil C: `PoiPresentationService`, `ChartDisplayStateService`, `MapOverlayStateService`, `RangeFilterStateService`, `GeometrySimplificationService`, `AdminLoginStateService`, `ExportButtonVisibilityService` (+ Felder nach `SelectionStateService`/`EnvConfigService`/lokal). Test-Baseline durchgängig grün; je neuer Service ein Spec.

---

## Stand: Prio 7 abgeschlossen — `DataExchangeService` gelöscht (2026-06-25)

Alle geplanten Schnitte ✅. Aus `DataExchangeService` extrahiert: `IndicatorValueService` (B1),
`MetadataExportService` (B2), `AccessControlService` (B3), `MetadataFilterService` (B4-Indicator),
`TopicHierarchyStoreService` (B5), die Metadaten-Stores `SpatialUnit`/`ProcessScript`/`Topic`/`Indicator`/`Georesource(+WMS/WFS+Filter)` (B6a–e), `SelectionStateService` (B7),
`MetadataBootstrapService` (B8, App-Startup-Orchestrierung) und in Teil C die UI-State-Cluster
(`PoiPresentation`/`ChartDisplayState`/`MapOverlayState`/`RangeFilterState`/`GeometrySimplification`/`AdminLoginState`/`ExportButtonVisibility`).

**Stand der Facade (2026-06-25): gelöscht.** Nach Teil C (Phasen 0–10) hat `DataExchangeService`
keine Member mehr; die leere Klasse, ihr Spec und die ~45 stale Imports/Injections wurden entfernt, danach
`data-exchange.constants.ts` aufgelöst. Der gesamte Ordner `app/services/data-exchange-service/` existiert
**nicht mehr**. Der einstige ~2000-Zeilen-God-Service ist vollständig dissolviert (Fan-in 108 → 0).

**Offene Folgeprojekte (separat, nicht Teil des Splits):**

- ~~Konsumenten schrittweise direkt auf die neuen Sub-Services umstellen + Facade-Wrapper entfernen (Rezept-Schritt 6).~~ ✅ **abgeschlossen** — alle Sub-Services repointet, Facade gelöscht (Teil C).
- ~~AngularJS-Bridge-Migration der 4 Admin-Modals (A1d-1).~~ ✅ **erledigt (2026-06-22)** — siehe Folgeprojekt-Abschnitt oben. ⚠️ Backend-Smoke-Test der Indikator-Feature-Tabelle (Modal 3) vor Release noch offen.
- ⚠️ **Smoke-Test vor Release** für die Teil-C-Sweeps (Karte/Diagramme/Legende/Admin) + die bewusste Verhaltensänderung in Phase 8 (`indicatorDatePrefix`/`FEATURE_NAME_PROPERTY_NAME`). Lokal Keycloak-limitiert.
- Optional: die nun in eigene Services gehobenen UI-State-Felder auf Signals/`computed()` heben (v. a. B7-Aggregate).
- Latenter Feature-Table-Header-Height-Bug (A1d-3).

---

## Folgeprojekt: Konsumenten-Migration (Facade-Wrapper abbauen)

> **✅ abgeschlossen (2026-06-25).** Alle Konsumenten wurden auf die Sub-Services repointet und die
> `DataExchangeService`-Facade gelöscht (siehe Teil C). Der folgende Abschnitt dokumentiert das ursprüngliche
> Vorgehen/Rezept (historisch).

**Ziel.** Heute leiten `DataExchangeService` (und der schlanke `KommonitorDataGridHelperService`) jeden
extrahierten Member nur noch per Delegations-Wrapper/Getter weiter; Konsumenten rufen weiter
`dataExchangeService.X`. Schritt 6 hängt die Konsumenten **direkt auf den jeweiligen Sub-Service** um
und entfernt danach den Wrapper. Erst damit sinkt der Fan-in (heute ~108 Konsumenten am DataExchange),
werden echte Abhängigkeiten sichtbar und die Facade kann letztlich verschwinden.

**Vorgehen (pro Sub-Service, 1 PR):**

1. `git grep "dataExchangeService\.<member>"` → Konsumentenliste.
2. Betroffene Komponenten: konkreten Sub-Service injizieren (statt/zusätzlich zu `DataExchangeService`),
   Aufrufe `this.dataExchangeService.X` → `this.<store>.X` (Sichtbarkeit/HTML-Bindings mitziehen — wie bei A1b/A2).
3. `git grep` bestätigt 0 verbleibende Wrapper-Nutzer → Wrapper/Getter aus der Facade löschen.
4. `npm run build` + `npm test` + `npm run lint` grün.

**Fortschritt:**

- **B8 `MetadataBootstrapService` ✅ erledigt (2026-06-25, in 2 Batches).** Batch 1: 12 Konsumenten der 6 Members `metadataLoading$`, `currentKeycloakUser`, `topicIndicatorHierarchy_forOrderView`, `fetchAllMetadata`, `reinitServices`, `fetchIndicatorScriptsMetadata` direkt auf den Bootstrap umgehängt (`admin-script-management` tauschte die Injection komplett). Batch 2: die restlichen `fetch*Metadata`-Konsumenten (`admin-topics-management.service`, adminGeoresourceUnit-Delegation, `admin-indicators-management`) repointet; `fetchSpatialUnitsMetadata`/`fetchAccessControlMetadata`-Wrapper waren **tot** (Konsumenten nutzen die eigenständigen adminSpatialUnit-Implementierungen) → ersatzlos entfernt. Danach injiziert die Facade nur noch `EnvConfigService`. Der tote Bridge-Token-Konsument in `indicator-delete-modal` blieb unangetastet.

**Reihenfolge (risikoarm → -reich), nach Konsumentenzahl/Glue:**

- **Reine Pass-throughs zuerst:** B6-Stores `ProcessScript` (4), `Topic` (11), `SpatialUnit` (23),
  `Indicator` (15), `Georesource/WMS/WFS` (13) sowie `MetadataExportService` (0–3) — mechanischer Repoint.
- **B1 `IndicatorValueService`:** rein nur für die parameterlosen Utilities (`indicatorValueIsNoData`,
  `syntaxHighlightJSON` (25!), `formatIndicatorNameForLabel`, `createDualListInputArray`). **Achtung Glue:**
  die Precision-auflösenden Formatter (`getIndicatorValue_asNumber/_asFormattedText/_asFixedPrecisionNumber`,
  `getIndicatorValueFromArray_asNumber`) brauchen `SelectionStateService.resolveSelectedPrecision` — beim
  direkten Aufruf des reinen Service ginge die Selektions-Precision verloren. Solche Konsumenten entweder
  Precision selbst auflösen lassen oder als dünne Facade behalten.
- **B3 `AccessControlService` / B7 `SelectionStateService`:** Get/Set-State-Felder breit gestreut
  (`accessControl` 18, `selectedIndicator` 21, `selectedDate` 18, `selectedSpatialUnit` 14). Mechanisch
  einfach, aber Karte/Diagramme + Auth betroffen → Smoke-Test; auth-kritische Pfade ohne Keycloak nicht QA-bar.

**Nicht 1:1 umhängbar (Glue-Wrapper — mitmigrieren oder bewusst behalten):**

- die o. g. Precision-Formatter,
- `modifyIndicatorApplicableSpatialUnitsForLoginRoles` (ruft Store **und** setzt danach B4-State
  `displayableIndicators_keywordFiltered`),
- die B5-Builder-Wrapper (`buildTopic*Hierarchy` lesen Facade-State und reichen ihn an den Store).

**Hinweis:** Wrapper erst entfernen, wenn `git grep` 0 Konsumenten zeigt (Rezept-Schritt, Verifikation unten).

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
