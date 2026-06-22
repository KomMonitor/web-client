# Admin-Bereich — AngularJS-Bridge-Migration der 4 Admin-Modals

Stand: 2026-06-22, Branch `feature/migration-bootstrap-cleanup`.
Scope: **ausschließlich der Admin-Bereich** (`app/components/ngComponents/admin/`), konkret die
vier Modals, die noch an toten AngularJS-Bridge-String-Tokens hängen.
Ergänzt das gröbere „Folgeprojekt A1d-1" aus [`PRIO7_GOD_SERVICE_SPLIT.md`](PRIO7_GOD_SERVICE_SPLIT.md)
um einen verifizierten, umsetzbaren Plan.

## Fortschritt

- ✅ **Modal 4 · `indicator-edit-indicator-spatial-unit-roles-modal`** — erledigt (2026-06-22). Reiner
  Rewire ohne Porting-Lücke (Details unten im Tier-1-Block). Build/Test/Lint grün
  (84 passed / 1 skipped, 0 lint-errors); neuer Smoke-Spec ergänzt; die 8 Bestands-Lint-Warnungen
  der Datei (7× `prefer-inject`, 1× `no-console`) bei der Gelegenheit mitbereinigt
  (Konstruktor → `inject()`).
- ✅ **Modal 1 · `georesource-add-modal`** — erledigt (2026-06-22). Verzahnter Rewire (Importer +
  Role-Grid + Topic-Hierarchie + mehrquellige DataExchange-Aufteilung) inkl. **Porting-Lücke #2**
  gelöst: `getCurrentKomMonitorLoginRoleIds()` → `[]` (Add-Modal-Muster: neue Ressource hat keine
  vorausgewählten Rollen). Details unten im Tier-1-Block. Build/Test/Lint grün (85 passed / 1 skipped,
  0 lint-errors); neuer Smoke-Spec ergänzt.
- ⬜ Modal 2 · `georesource-edit-features-modal`
- ⬜ Modal 3 · `indicator-edit-features-modal` (Porting-Lücken #1 + #3)

## Ausgangslage (im Code verifiziert)

Vier Admin-Modals injizieren AngularJS-Bridge-String-Tokens (`@Inject('kommonitor…Service')`),
für die es **keinen Provider** gibt → die Modals **werfen beim Öffnen** einen DI-Fehler und sind
zur Laufzeit kaputt.

Die Migration ist teilweise schon angefangen: **Modals 3 & 4 injizieren die echten Services
bereits zusätzlich** (`DataExchangeService`, `KommonitorIndicatorDataGridHelperService`,
`MultiStepHelperServiceService`, `EnvConfigService`) — die Bridge-Aufrufe dort sind also
größtenteils nur „umzuhängen".

Betroffene Dateien:

| # | Modal | Pfad (unter `app/components/ngComponents/admin/`) |
|---|---|---|
| 1 | `georesource-add-modal` | `adminGeoresourcesManagement/georesourceAddModal/georesource-add-modal.component.ts` |
| 2 | `georesource-edit-features-modal` | `adminGeoresourcesManagement/georesourceEditFeaturesModal/georesource-edit-features-modal.component.ts` |
| 3 | `indicator-edit-features-modal` | `adminIndicatorsManagement/indicatorEditFeaturesModal/indicator-edit-features-modal.component.ts` |
| 4 | `indicator-edit-indicator-spatial-unit-roles-modal` | `adminIndicatorsManagement/indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.component.ts` |

## Token → echter Service (verifiziert)

| Bridge-Token | Echter Ersatz | Status |
|---|---|---|
| `kommonitorImporterHelperService` | `adminSpatialUnit/KommonitorImporterHelperService` | ✅ **alle** Methoden/Felder vorhanden (`registerNewGeoresource`, `updateIndicator`, `buildPropertyMapping_spatialResource/_indicatorResource`, `buildConverterDefinition`, `buildDatasourceTypeDefinition`, `filterConverters`, `importerResponseContainsErrors`, `getIdFromImporterResponse`, `getImportedFeaturesFromImporterResponse`, `getErrorsFromImporterResponse`, `availableDatasourceTypes`, `mappingConfigStructure`, `attributeMapping_attributeTypes`, `availableConverters`) |
| `kommonitorMultiStepFormHelperService` | `MultiStepHelperServiceService` | ✅ `registerClickHandler(domId)` vorhanden — in Modal 1 & 2 ohnehin **ungenutzt** → ersatzlos streichen |
| `kommonitorSingleFeatureMapHelperService` | `SingleFeatureMapHelperService` | in Modal 2 **ungenutzt** → ersatzlos streichen |
| `kommonitorDataGridHelperService` (Role-Mgmt-Teil) | `RoleManagementDataGridHelperService` | ✅ `buildRoleManagementGrid`, `getSelectedRoleIds_roleManagementGrid` |
| `kommonitorDataGridHelperService` (Feature-Table spatial) | `FeatureTableDataGridHelperService` (A2) | ✅ `buildDataGrid_featureTable_spatialResource`, `resourceType_georesource` |
| `kommonitorDataExchangeService` (Indikator-Modals 3/4) | `DataExchangeService` (Facade, schon injiziert) | ✅ `accessControl`, `getAccessControlById`, `getIndicatorMetadataById`, `getTopicHierarchyForTopicId`, `syntaxHighlightJSON`, `currentKomMonitorLoginRoleNames`, `availableSpatialUnits` |

## ⚠️ Drei echte Porting-Lücken (nicht bloß Rewire)

Diese existieren **nirgends** als echte Implementierung und müssen portiert werden — das ist der
eigentliche Aufwand:

1. **`buildDataGrid_featureTable_indicatorResource`** (Modal 3) — existiert nirgends. Muss analog
   zu `buildDataGrid_featureTable_spatialResource` (in `FeatureTableDataGridHelperService`) neu
   gebaut werden, für Indicator-Resource. Plus die zugehörigen
   `featureTable_indicator_lastUpdate_timestamp_success/_failure`-Felder und `resourceType_indicator`.
   → **schwerster Brocken.**
2. **`getCurrentKomMonitorLoginRoleIds`** (Modal 1) — existiert nirgends auf den echten Services
   (nur `currentKomMonitorLoginRoleNames` ist da, auf `AccessControlService`). Entweder auf
   `AccessControlService` ergänzen oder im Modal aus den Names ableiten.
3. **`$http()`** (Modal 3, Z. 210 & 263) — AngularJS-`$http`-Promise-API über den Bridge-DataExchange.
   Modal 3 injiziert **kein** `HttpClient` → muss auf `HttpClient` (+ `firstValueFrom`/`lastValueFrom`)
   umgeschrieben werden.

**Zusätzliche UI-Config-Lücke (Georesource-Modals 1/2):** `datePickerOptions`, `updateIntervalOptions`,
`enableKeycloakSecurity`, `availableLoiDashArrayObjects` liegen auf
`adminSpatialUnit/KommonitorDataExchangeService` (+ teils `EnvConfigService`), **nicht** auf der
Haupt-Facade `DataExchangeService`. → Entscheidung nötig: dieses Admin-Service mitinjizieren **oder**
die Getter an die Facade durchreichen. **Empfehlung:** direkt injizieren (kein weiterer Facade-Ballast,
konsistent mit der laufenden Konsumenten-Migration).

## Per-Modal-Plan (nach Aufwand getiert)

### Tier 1 — fast reiner Rewire

**Modal 4 · `indicator-edit-indicator-spatial-unit-roles-modal`** (nur Role-Mgmt) — ✅ **erledigt (2026-06-22)**
- Umgesetzt wie geplant: `angularJsDataGridHelperService` → neu injizierter `RoleManagementDataGridHelperService`;
  `angularJsMultiStepFormHelperService` → `MultiStepHelperServiceService`; `angularJsDataExchangeService`
  → echter `DataExchangeService` (inkl. `checkAdminPermission()` im Template), **außer**
  `baseUrlToKomMonitorDataAPI` → `EnvConfigService` (existiert nicht auf der Facade). Ungenutzten
  `KommonitorIndicatorDataGridHelperService` mitentfernt. Neuer Smoke-Spec (existierte nicht).
  Konstruktor auf `inject()` umgestellt (Lint-Warnungen der Datei = 0).
- Repoint-Referenz (Original-Plan): `angularJsDataExchangeService` → bereits injizierter `DataExchangeService`;
  `angularJsDataGridHelperService.buildRoleManagementGrid/getSelectedRoleIds_roleManagementGrid`
  → `RoleManagementDataGridHelperService` (neu injizieren);
  `angularJsMultiStepFormHelperService.registerClickHandler` → `MultiStepHelperServiceService` (schon injiziert).
- **Sonderfall:** öffnet **nicht** über `NgbModal.open`, sondern via Broadcast
  `onEditIndicatorSpatialUnitRoles` + jQuery `$('#…').modal('show')` (Bootstrap-3-Pattern).
  Entscheidung: so lassen oder auf `NgbModal` ziehen (separater Schritt, nicht Bridge-relevant).
- 3 Tokens weg, 0 Porting-Lücken. **Niedrigstes Risiko → Referenz-Commit.**

**Modal 1 · `georesource-add-modal`** — ✅ **erledigt (2026-06-22)**
- Umgesetzt: Importer → `KommonitorImporterHelperService`; Role-Grid → `RoleManagementDataGridHelperService`
  (Feld `kommonitorDataGridHelperService` → `roleManagementHelper`); ungenutzten MultiStep-Token gestrichen.
- DataExchange: `availableTopics`/`availableGeoresources`/`accessControl`/`syntaxHighlightJSON` → Haupt-Facade ✅.
- **Korrekturen ggü. dem ursprünglichen Plan** (im Code verifiziert):
  - `getTopicHierarchyForTopicId` ist auf der Facade **`private`** → stattdessen `TopicHierarchyService`
    (2-arg: `availableTopics` + `topicId`) injiziert.
  - Config-Flags `enableKeycloakSecurity`/`updateIntervalOptions` → **`EnvConfigService`** (nicht das
    Admin-`KommonitorDataExchangeService`); `availablePoiMarkerColors`/`availableLoiDashArrayObjects` →
    **Konstanten** `POI_MARKER_COLORS`/`LOI_DASH_ARRAY_OBJECTS` aus `data-exchange.constants` (Muster der
    Schwester-Modals). `envConfigService` als `protected` (Template nutzt `enableKeycloakSecurity`).
- **Porting-Lücke #2** `getCurrentKomMonitorLoginRoleIds()` → `[]` (Add-Modal-Muster: neue Ressource ohne
  vorausgewählte Rollen, vgl. `indicator-add-modal`).
- **Von `any` maskierte Typfehler** beim Typisieren mitgefixt (verhaltenswahrend): `null`/`undefined`-Argumente
  → `[]`/`''`, `|| []` für optionale Importer-Rückgaben, Template-Truthy-Guards `checkAdminPermission && …()`
  vereinfacht. 7 vorbestehende `console.error`-Warnungen bewusst belassen (legitimes Error-Logging, Prio-8-Backlog).

### Tier 2 — Rewire + Feature-Table

**Modal 2 · `georesource-edit-features-modal`**
- Importer → `KommonitorImporterHelperService`; Feature-Table (`buildDataGrid_featureTable_spatialResource`,
  `resourceType_georesource`) → `FeatureTableDataGridHelperService` ✅; MultiStep- & SingleFeatureMap-Token
  **ungenutzt** → streichen.
- DataExchange: `getBaseUrlToKomMonitorDataAPI_spatialResource`/`baseUrlToKomMonitorDataAPI`/
  `syntaxHighlightJSON`/`availableSpatialUnits` ✅; `datePickerOptions` → Admin-Service.
- Keine fehlende Methode außer der `datePickerOptions`-Quelle.

### Tier 3 — echtes Porting

**Modal 3 · `indicator-edit-features-modal`**
- Importer/MultiStep/Role-Mgmt: wie oben repointbar.
- **Porting-Lücke #1** `buildDataGrid_featureTable_indicatorResource` + Indicator-Timestamp-Felder neu
  implementieren (am besten als Erweiterung von `FeatureTableDataGridHelperService`, symmetrisch zur
  spatialResource-Variante).
- **Porting-Lücke #3** `$http` → `HttpClient` (2 Call-Sites umschreiben, `HttpClient` injizieren).
- **Aufwändigstes Modal.**

## Querschnitt & QA-Grenzen

- **Backend-Abhängigkeit:** alle 4 hängen am Importer (Spatial Insert/Update) → **echte Funktions-QA
  nur mit Keycloak + laufendem Backend**. Ohne das nur Build/Lint/Unit-Test + „Modal öffnet ohne DI-Crash".
- **Spec je Modal:** Smoke-Test „instanziiert + öffnet ohne DI-Fehler" (heute der eigentliche
  Regressionsbeweis), Standard-Provider-Rezept aus `app/testing/test-providers.ts`.

## Empfohlene Reihenfolge & Schnitt (1 Commit pro Modal)

1. ~~**Modal 4** (reiner Role-Mgmt-Rewire) → etabliert das Repoint-Rezept, keine Porting-Lücke.~~ ✅ erledigt (2026-06-22)
2. ~~**Modal 1** (Rewire + Porting-Lücke #2 `getCurrentKomMonitorLoginRoleIds` + Admin-Service-Entscheidung).~~ ✅ erledigt (2026-06-22)
3. **Modal 2** (Rewire + Feature-Table spatial, schon vorhanden).
4. **Modal 3** (Porting #1 Indicator-Feature-Table + #3 `$http`→`HttpClient`) — zuletzt, größter Brocken.

**Vorab zu klären (Designentscheidung):** UI-Config-Getter der Georesource-Modals —
Admin-`KommonitorDataExchangeService` direkt injizieren vs. als Facade-Getter durchreichen
(Empfehlung: direkt injizieren).

Pro Commit: `npm run build` + `npm test` + `npm run lint` grün (Node 24, siehe `.nvmrc`).

## Verifikation pro Commit

- `git grep "@Inject('kommonitor"` im jeweiligen Modal → 0 Treffer nach der Umstellung.
- `npm run build` (EXIT 0), `npm test` (keine Regression der Baseline), `npm run lint` (0 errors).
- Soweit ohne Keycloak möglich: Modal öffnet ohne DI-Crash (Smoke-Spec).
