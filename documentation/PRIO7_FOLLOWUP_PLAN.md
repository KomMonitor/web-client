# Prio 7 — Folgeprojekte nach dem God-Service-Split

Plan für die verbleibende Arbeit nach Abschluss von Teil A + Teil B (siehe `PRIO7_GOD_SERVICE_SPLIT.md`).
Stand: 2026-06-23, Branch `feature/migration-bootstrap-cleanup`.

## Ausgangslage

Der strukturelle Split ist vollständig ✅. `DataExchangeService` und der schlanke
`KommonitorDataGridHelperService` delegieren extrahierte Member nur noch per Wrapper/Getter;
Konsumenten rufen weiterhin `dataExchangeService.X`. Der Fan-in (~108 Konsumenten) ist daher
unverändert. Die Bridge-Migration der 4 Admin-Modals ist seit 2026-06-22 erledigt.

**Test-Baseline halten:** `npm run build` (EXIT 0) + `npm test` + `npm run lint` (0 errors)
nach jedem Schritt. Node 24 (`.nvmrc`). Aktuell 83 Suites / 124 Tests.

---

## Hauptarbeit: Konsumenten-Migration (Facade-Wrapper abbauen)

**Ziel:** Konsumenten direkt auf die Sub-Services hängen, danach Facade-Wrapper entfernen.
Erst damit sinkt der Fan-in und die Facade kann letztlich verschwinden.

**Rezept pro Sub-Service (1 PR):**
1. `git grep "dataExchangeService\.<member>"` → Konsumentenliste.
2. Betroffene Komponenten: Sub-Service injizieren, `this.dataExchangeService.X` → `this.<store>.X`
   (Sichtbarkeit + HTML-Bindings mitziehen).
3. `git grep` bestätigt 0 verbleibende Wrapper-Nutzer → Wrapper/Getter aus der Facade löschen.
4. Build + Test + Lint grün.

### Phase 1 — Reine Pass-through-Stores (risikoarm, mechanisch)

In aufsteigender Konsumentenzahl:

- [x] **B6b `ProcessScriptMetadataStoreService`** ✅ (2026-06-23) — Pilot. Nur **2 Live-Konsumenten**
      (`admin-script-management`, `admin-dashboard-management`) direkt auf den Store umgehängt;
      facade-interne Reads (Hierarchie-Builder + `fetchIndicatorScriptsMetadata`) repointet, Getter +
      `setProcessScripts`-Wrapper aus der Facade entfernt. Übersprungen (tot): `indicator-delete-modal`
      (providerloser Bridge-Token `'kommonitorDataExchangeService'` → Bridge-Cleanup) +
      `kommonitor-individual-indicator-computation` (AngularJS reference-only). Build/Test/Lint grün.
- [~] **B2 `MetadataExportService`** ⚠️ **teilweise** (2026-06-23). Plan-Schätzung „0–3 Konsumenten"
      war falsch — gemischter Service. **Erledigt: reine Utilities** (`tsToDate_withOptionalUpdateInterval`,
      `dateToTS`, `getIndicatorStringFromIndicatorType`, `getImageDimensions`) direkt umgehängt
      (Konsumenten: legend-HTML 4×, indicator-add, data-setup, adminIndicatorUnit-Grid-Helper) +
      diese 4 Wrapper aus der Facade entfernt. **Bewusst behalten: Glue-PDF/ZIP-Wrapper**
      (`downloadMetadataPDF_georesource`, `generateAndDownload*ZIP`, `generateIndicatorMetadataPdf*`,
      `createMetadataPDF_*`, `generate*MetadataPdf_asBlob`) — sie reichen `availableTopics`/
      `availableSpatialUnits`/`selectedIndicator` durch; Umhängen würde State-Beschaffung in UI/Export
      streuen (Doc: „nicht 1:1 umhängbar"). Build/Test/Lint grün.
- [x] **B6c `TopicMetadataStoreService`** ✅ (2026-06-23). **Korrektur:** real **13 Dateien** (nicht 11) —
      Konsumenten injizieren dieselbe `DataExchangeService` unter verschiedenen Feldnamen
      (`kommonitorDataExchangeService`, `angularJsDataExchangeService`, `d`). Alle direkt auf
      `topicStore.availableTopics` umgehängt: admin-filter-config, admin-filter-edit-modal (6×),
      admin-topics-management, admin-dashboard, indicator-edit-metadata-modal (+HTML), wms-add/edit-modal,
      georesource-add/edit-metadata-modal, indicator-add-modal, ogc-/adminIndicatorUnit-/adminGeoresourceUnit-
      Helper. Facade-interne Reads (Hierarchie-Builder + Glue-PDF/ZIP-Wrapper + fetchTopicsMetadata) repointet;
      `availableTopics`-Getter + `setTopics`-Wrapper entfernt. Build/Test/Lint grün.
- [x] **B6e `GeoresourceMetadataStoreService`** ✅ (2026-06-24). **Korrektur zur Plan-Schätzung (13):**
      real **22 Dateien** auf `georesourceStore` umgehängt (Katalog-Inventar war unvollständig — fehlende
      Field-/Var-Namen: `dataExchange`, lokale `const d`, sowie der Delegations-Layer
      `adminGeoresourceUnit/KommonitorGeoresourceDataExchangeService`, der die Facade-Georessourcen-Methoden
      durchreichte). Umgehängte clean Member: `availableGeoresources`, `displayableGeoresources(_keywordFiltered/
      _forAlphabeticalDisplay)`, `availableWmsDatasets`, `wmsDatasets(_keywordFiltered)`, `wfsDatasets(_keywordFiltered)`,
      `georesourceMapKey_forUnmappedTopicReferences`, `add/replace/deleteSingleGeoresourceMetadata`,
      `getGeoresourceMetadataById`, `getAvailableGeo/IndiWmsDatasets`, `setGeoresources`/`setServices`,
      `onChangeGeoresourceKeywordFilter`, `getGeoresourceDatasets`, `getAvailable(Wfs/TopicWms/)Datasets`/`getAvailableGeoresources`,
      `filterByGeoresourceNamesToHide`, `filterGeoresourcesByTypes`, `removeAoiGeoresource`, `isDisplayableGeoresource`,
      `setWmsLayer(Active/Inactive)`. Facade-interne Reads repointet (`fetchGeoresourcesMetadata`, `fetchServices`,
      `buildTopicGeoresourceHierarchy`, `buildTopicIndicatorHierarchy`); alle Getter + Wrapper aus der Facade entfernt
      (inkl. ungenutzte Imports `WmsDataset`/`GeoresourcesDataset`). **Bewusst behalten:** MetadataExport-Glue
      (`downloadMetadataPDF_georesource`, `createMetadataPDF_georesource`, `generateAndDownloadGeoresourceZIP`),
      Facade-Member `showGeoresourceExportButtons`, B5-Builder. **Übersprungen (tot):** indicator-computation
      (AngularJS), georesource-delete-/batch-update-modal (Bridge-Token), reachability-scenario-modal (auskommentiert).
      Build (EXIT 0) / Test (88 Suites, 129 Tests) / Lint (0 errors) grün.
- [x] **B6d `IndicatorMetadataStoreService`** ✅ (2026-06-23). **23 Konsumenten** auf `indicatorStore`
      umgehängt (Clean-Member: `availableIndicators`, `displayableIndicators`, `setIndicators`,
      `add/replace/deleteSingleIndicatorMetadata`, `getIndicatorMetadataById`, `modifySingleIndicator`,
      `modifyIndicators`, `isDisplayableIndicator`); diese 2 Getter + 8 Wrapper aus der Facade entfernt.
      **Glue bewusst behalten:** `modifyIndicatorApplicableSpatialUnitsForLoginRoles` (setzt zusätzlich
      B4-State `displayableIndicators_keywordFiltered`). Übersprungen (tot): georesource-delete-modal +
      indicator-delete-modal (Bridge-Token), Legacy-Computation (AngularJS); Eigenfelder unangetastet.
      In script-step-metadata + script-indicators-cell-renderer war `dataExchangeService` exklusiv fürs
      migrierte Member → komplette Injection auf `indicatorStore` umgestellt. Build/Test/Lint grün.
- [x] **B6a `SpatialUnitMetadataStoreService`** ✅ (2026-06-23). **14 Dateien** auf `spatialUnitStore`
      umgehängt: admin-dashboard, georesource-add-modal (+HTML), georesource-edit-features-modal,
      indicator-add-modal (nur Service-Präfix), indicator-batch-update-modal (+HTML),
      indicator-edit-features-modal (+HTML), indicator-edit-metadata-modal (+HTML, inkl.
      `getSpatialUnitMetadataById`), kommonitor-legend, kommonitor-map, indicator-add, data-setup
      (service + component), kommonitor-filter. Facade-interne Reads + `setSpatialUnits`-Call repointet;
      Getter `availableSpatialUnits` + Wrapper `setSpatialUnits`/`getSpatialUnitMetadataById` entfernt.
      **Korrektur zum Katalog:** admin-spatial-units-management + spatial-unit-add/edit-features/edit-metadata-modal
      **NICHT** umgehängt — ihr Feld `kommonitorDataExchangeService` injiziert die **andere** Klasse
      `adminSpatialUnit/KommonitorDataExchangeService` (eigener `availableSpatialUnits`-Getter), nicht die Facade.
      Übersprungen (tot): indicator-delete-modal (Bridge-Token). Build/Test/Lint grün.

### Phase 2 — B1 `IndicatorValueService` ✅ (2026-06-24) — vollständig, ein Commit

- [x] **Parameterlose Utilities** (`indicatorValueIsNoData`, `syntaxHighlightJSON`,
      `formatIndicatorNameForLabel`, `createDualListInputArray`) direkt auf `indicatorValueService`
      umgehängt. **Korrektur zur Schätzung „25!":** real **12 `syntaxHighlightJSON`-Konsumenten** (Facade);
      Katalog daneben (fälschlich `indicator-delete-modal` gelistet — nutzt nur den toten Bridge-Token
      `angularJsDataExchangeService`; `topic-delete-modal` gefehlt).
- [x] **Precision-Formatter** (`getIndicatorValue_asNumber/_asFormattedText/_asFixedPrecisionNumber`,
      `getIndicatorValueFromArray_asNumber`): **Entscheidung — Konsument löst Precision selbst auf.**
      Jeder Konsument injiziert `IndicatorValueService` + `SelectionStateService` und bekommt einen lokalen
      Wrapper, der die alte Facade-Glue spiegelt (`indicatorValueService.X(v, selectionState.resolveSelectedPrecision(p))`);
      Call-Sites zeigen auf den lokalen Wrapper (Arg-Listen unverändert → verhaltensgleich). Bei den 2 Templates
      (`kommonitor-legend`, `reachability-indicator-statistics`) ist der Wrapper `protected`.
- **Umfang:** ~27 Live-Konsumenten (12 Admin nur `syntaxHighlightJSON` + 15 UI/Services mit Precision/Utilities).
      Alle 8 Facade-Wrapper **und** die private `resolveSelectedPrecision` aus der Facade entfernt;
      `displayMapApplicationError` auf `indicatorValueService.syntaxHighlightJSON` repointet.
- **Bewusst NICHT angefasst:** Class-E-Konsumenten der **eigenen** `adminSpatialUnit/KommonitorDataExchangeService`-
      `syntaxHighlightJSON`-Kopie (adminRoleManagement/*, adminSpatialUnitsManagement/*, feature-table-grid-helper —
      Dedup ist separat); tote Bridge-Token-/AngularJS-Dateien. Build (EXIT 0) / Test (88 Suites, 129) / Lint (0 errors) grün.

### Phase 3 — Breit gestreute State-Felder (Smoke-Test nötig)

- [x] **B3 `AccessControlService`** ✅ (2026-06-24) — in **zwei Commits** (State getrennt, da auth-kritisch):
      - **Commit 1 — Permission/Role-Query-Methoden** (`check*Permission` ×7, `getAllowedRolesString`,
        `getRoleTitle(s)`, `getAccessControlById`, `filterClientUserAdminRoles`, `updateAvailableRoles`):
        Class-A-Konsumenten + adminGeoresourceUnit-/adminIndicatorUnit-Delegation/Grid-Helper auf
        `accessControlService` umgehängt; 13 Facade-Wrapper entfernt.
      - **Commit 2 — Login-/accessControl-State + Auth-Bootstrap** (7 get/set-Paare + 3 `set*`-Wrapper):
        ~13 Class-A-Konsumenten + Delegation `currentKeycloakLoginRoles` + Facade-interner Auth-Bootstrap
        (Token-Parsing, `fetchAccessControlMetadata`, forkJoin-`fetch*`) auf `accessControlService` repointet;
        7 get/set-Paare + 3 Setter-Wrapper entfernt.
      **Bewusst NICHT angefasst:** `adminSpatialUnit/KommonitorDataExchangeService` mit **eigener** AC-Impl
      (Class E: adminRoleManagement/*, adminSpatialUnitsManagement/*); tote Bridge-Token-Dateien.
      **Korrekturen zum Katalog** (per Build-Gate gefunden): zusätzlich `adminIndicatorUnit/grid-helper`,
      `admin-dashboard` (`d.accessControl`), `indicator-delete-modal` (live `dataExchangeService`-State).
      Build (EXIT 0) / Test (88 Suites, 129) / Lint (0 errors) grün je Commit.
      ⚠️ **Offen: Backend-/Keycloak-Smoke-Test** von Login + Admin-Permission-Gating vor Release (nicht lokal QA-bar).
- [x] **B7 `SelectionStateService`** ✅ (2026-06-24) — **ein Commit** (Selection-Member eng verzahnt).
      **34 Konsumenten-Dateien** (.ts + .html) auf `selectionState` umgehängt — alle 23 Member
      (`selectedIndicator`/`selectedDate`/`selectedSpatialUnit`/`selectedDate$`, 14 Feature-Aggregate,
      5 Methoden). Reiner Receiver-Swap (kein Glue); Feld-Aliase `dataExchangeService` **und** `exchangeData`
      (lokaler Facade-Alias) berücksichtigt. ~15 Dateien brauchten neue `SelectionStateService`-Injection,
      der Rest hatte sie aus B1; bei Template-Bindern `protected`. Facade-interne Reads repointet
      (`isAllowedSpatialUnitForCurrentIndicator`, `selectedSpatialUnitIsRaster`, MetadataExport-ZIP/PDF-Glue);
      `selectedSpatialUnitIsRaster()` + `selectedIndicatorBackup` **bleiben** (Facade-eigen, keine Member).
      Alle Facade-Getter/Setter/Wrapper entfernt (3 State-get/set + `selectedDate$` + 14 Aggregate-Getter + 5 Methoden).
      **Class C/E = 0** (keine Delegation/Local-Impl — einfacher als B3). Build (EXIT 0) / Test (88 Suites, 129) / Lint (0 errors) grün.
      ⚠️ **Offen: Smoke-Test** Karte + Diagramme + Legende + Reachability (selection-getriebenes Rendering) vor Release.
- [x] **B5 `TopicHierarchyStoreService`** ✅ (2026-06-25). **13 Konsumenten-Dateien** (11 `.ts` + 2 `.html`)
      auf `topicHierarchyStore` umgehängt — die 5 Member `headlineIndicatorHierarchy`,
      `computationIndicatorHierarchy`, `topicIndicatorHierarchy`, `topicGeoresourceHierarchy`,
      `topicGeoresourceHierarchy_unmappedEntries`. Reiner Receiver-Swap. Alias-Korrektur: admin-dashboard
      injiziert die Facade als `dataExchange` (nicht `dataExchangeService`). Bei 6 Dateien, deren
      Facade-Injection ausschließlich für ein migriertes Member da war (beide Pipes, favorites-state-,
      georesource-filter-/-favorites-service, catalogue-tab), wurde die Injection komplett auf den Store
      umgestellt (B1-Muster); die übrigen behielten ihre Facade-Injection. Facade-interner Read repointet
      (`topicIndicatorHierarchy_forOrderView`-Deep-Copy auf `topicHierarchyStore.topicIndicatorHierarchy`),
      alle 5 Getter + ungenutzter `IndicatorsTopicsHierarchy`-Import entfernt. **Bewusst behalten:** private
      `build*Hierarchy`-Wrapper + `getTopicHierarchyForTopicId` (Facade-interne Metadaten-Fetch-Orchestrierung),
      `topicIndicatorHierarchy_forOrderView` (Facade-eigenes Feld) + dessen Konsument admin-indicators-management.
      Build (EXIT 0) / Test (88 Suites, 129) / Lint (0 errors) grün.
      ⚠️ **Offen: Smoke-Test** Daten-Setup (Themenbaum + Favoriten), POI-Katalog-Tab, Admin-Dashboard-
      Tortendiagramm, Indikator-Radar (hierarchie-getriebenes Rendering) vor Release.

**Glue-Wrapper, die nicht 1:1 umhängbar sind** (mitmigrieren oder bewusst behalten):
Precision-Formatter, `modifyIndicatorApplicableSpatialUnitsForLoginRoles`, B5-Builder-Wrapper.

---

## Begleitende Aufräumarbeiten

- [x] **Doku-Korrektur:** In `PRIO7_GOD_SERVICE_SPLIT.md` den veralteten Eintrag „AngularJS-Bridge-
      Migration der 4 Admin-Modals (A1d-1)" aus der Liste offener Folgeprojekte (Z. 152) als erledigt
      markiert — seit 2026-06-22 erledigt. ✅ (2026-06-23)
- [ ] **Backend-Smoke-Test** der Indikator-Feature-Tabelle (Bridge-Modal 3) vor Release —
      backend-/Keycloak-gebunden, noch nicht QA-bar.

## Optionale / spätere Arbeiten

- [x] **State-Felder auf Signals/`computed()` heben** ✅ (2026-06-25). Die 14 B7-Feature-Aggregate
      (`allFeatures*`/`selectedFeatures*`) in `SelectionStateService` auf **writable `signal()`** umgestellt
      — sie werden imperativ in `setAllFeaturesProperty`/`setSelectedFeatureProperty` per `.set()` (re)berechnet
      (Push-Semantik), Konsumenten lesen reaktiv via `aggregate()`. Nur **2 Live-Konsumenten** (Templates
      `kommonitor-legend`, `kommonitor-diagrams`, 27 Reads → `()`); der einzige TS-Treffer in `diagram-helper`
      war auskommentiert. Spec mitgezogen. **Bewusst NICHT** auf `computed()` umgestellt: korrekte Ableitung
      bräuchte `selectedDate`/`selectedIndicator` als Signals (regionale Referenzwerte hängen am Datum) → hoher
      Fan-in, nicht „verhaltensgleich". Build (EXIT 0) / Test (88 Suites, 129) / Lint (0 errors) grün.
- [x] **Latenter Feature-Table-Header-Height-Bug** (A1d-3) ✅ (2026-06-25, Commit `7e67dbde`).
      `headerHeightGetter`/`headerHeightSetter` (Live-Muster aus `role-management-data-grid-helper`) in
      `feature-table-data-grid-helper.service` portiert, auf `gridApi_featureTable` verdrahtet
      (`onFirstDataRendered` + `onColumnResized`) in beiden Grid-Buildern. ⚠️ Visuelle QA (mehrzeilige Header)
      backend-/Keycloak-gebunden → Release-QA.

---

## Empfohlene Reihenfolge

1. Doku-Korrektur (Z. 152) — trivial, sofort.
2. Phase 1, beginnend mit `ProcessScript` als Pilot.
3. Phase 2 (B1), dann Phase 3 (B3/B7/B5) mit Smoke-Tests.
4. Optionale Arbeiten nach Bedarf.
