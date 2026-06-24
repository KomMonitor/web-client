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

### Phase 2 — B1 `IndicatorValueService` (Glue beachten)

- [ ] Parameterlose Utilities direkt umhängen: `indicatorValueIsNoData`, `syntaxHighlightJSON` (25!),
      `formatIndicatorNameForLabel`, `createDualListInputArray`.
- [ ] Precision-Formatter (`getIndicatorValue_asNumber/_asFormattedText/_asFixedPrecisionNumber`,
      `getIndicatorValueFromArray_asNumber`) brauchen `SelectionStateService.resolveSelectedPrecision`.
      → Konsument Precision selbst auflösen lassen **oder** als dünne Facade behalten.

### Phase 3 — Breit gestreute State-Felder (Smoke-Test nötig)

- [ ] **B3 `AccessControlService`** — `accessControl` (18 Leser) u. a. ⚠️ Auth-kritisch,
      ohne Keycloak nicht laufzeit-QA-bar.
- [ ] **B7 `SelectionStateService`** — `selectedIndicator` (21), `selectedDate` (18),
      `selectedSpatialUnit` (14). ⚠️ Karte/Diagramme betroffen → Smoke-Test vor Release.
- [ ] **B5 `TopicHierarchyStoreService`** — Builder-Wrapper (`buildTopic*Hierarchy`) lesen
      Facade-State und reichen ihn durch → mitmigrieren oder bewusst behalten.

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

- [ ] **State-Felder auf Signals/`computed()` heben** — v. a. die B7-Aggregate
      (`allFeatures*`/`selectedFeatures*`). Bisher plain Fields (verhaltensgleich, niedrigstes Risiko).
- [ ] **Latenter Feature-Table-Header-Height-Bug** (A1d-3) — `headerHeightSetter` sollte vermutlich
      `gridApi_featureTable` statt des entfernten `gridApi_spatialUnits` setzen; Header-Höhe der
      Feature-Tabelle wurde nie angewendet. Echte Verhaltensänderung → separater Bugfix.

---

## Empfohlene Reihenfolge

1. Doku-Korrektur (Z. 152) — trivial, sofort.
2. Phase 1, beginnend mit `ProcessScript` als Pilot.
3. Phase 2 (B1), dann Phase 3 (B3/B7/B5) mit Smoke-Tests.
4. Optionale Arbeiten nach Bedarf.
