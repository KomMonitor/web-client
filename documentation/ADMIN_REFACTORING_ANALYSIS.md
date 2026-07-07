# Analyse: Verbesserungspotential im Admin-Bereich

Stand: 2026-07-07. Analyse des gesamten Admin-Bereichs (`app/components/ngComponents/admin/**` und zugehörige Services) auf Code-Qualität, Duplikation und Architektur. Umfang: 208 Dateien — 89 `*.ts` (~20.900 Zeilen), 64 Templates (~16.000 Zeilen), 69 Komponenten.

**Kernbefund:** Das größte Verbesserungspotential liegt nicht in einer einzelnen Datei, sondern in einem Strukturproblem: Der komplette CRUD-Ablauf (Anlegen/Editieren/Löschen von Ressourcen) ist dreimal parallel implementiert — für Indikatoren, Georessourcen und Raumeinheiten — auf drei verschiedenen Reifegraden mit 60–80 % Duplikation in den Modals. Die Migration hat die AngularJS-Struktur Bildschirm für Bildschirm konserviert, statt sie zu vereinheitlichen. Die Zielarchitektur existiert bereits im Repo, verstreut über die drei Bereiche — sie muss zusammengeführt werden.

Ergänzt die bestehenden Dokumente `PROPOSED_CHANGES.md` und `documentation/PRIO7_GOD_SERVICE_SPLIT.md`; die CRUD-Verdreifachung und der `adminSpatialUnit`-Service-Zweig sind dort bisher unterrepräsentiert.

---

## 1. Die CRUD-Verdreifachung (größter Hebel)

Jeder der drei Bereiche (`adminIndicatorsManagement/`, `adminGeoresourcesManagement/`, `adminSpatialUnitsManagement/`) hat: Übersichtsseite (AG Grid) + Add-, Edit-Metadata-, Edit-Features-, Edit-User-Roles-, Delete- und Batch-Update-Modal.

### Drei Reifegrade

| Bereich | Architektur-Reife | Modal-Kommunikation | Importer-Anbindung | Feedback |
|---|---|---|---|---|
| **SpatialUnits** | modern (Referenz) | `@Output refreshRequested` | ausgelagerter `SpatialUnitImportService` + `spatial-unit-import.util.ts` | `NotificationService` |
| **Indicators** | modern, eigener Weg | `@Output refreshRequested` | inline `KommonitorImporterHelperService`, DOM-frei | `NotificationService` |
| **Georesources** | Legacy-Monolith | `BroadcastService` (37×), 0 EventEmitter | 33× `document.getElementById` | keine — inline Message-Strings |

Alle drei öffnen Modals modern via `NgbModal.open(...)` (kein jQuery-Modal-Handling mehr).

### Gemessene Duplikation

- **Add-Modals** (`georesource-add-modal.component.ts` 1260 Z. vs. `spatial-unit-add-modal.component.ts` 1277 Z.): **~65–70 % deckungsgleich**, bis hin zu wortgleich kopierten Kommentaren. Identisch: Metadaten-Objekt (`description/databasis/datasource/contact/updateInterval/lastUpdate/literature/note/sridEPSG`), Stepper-Navigation, Attribute-Mapping, Importer-Flow (dry-run `registerNew…(…, true)` → `importerResponseContainsErrors` → echter Call), Metadaten-Import/Export, ~90 Zeilen `resetForm`.
- **Edit-Metadata-Modals** (georesource 856 / spatial-unit 583 / indicator 792 Z.): zu **~70 % Teilmengen des jeweiligen Add-Modals** — Duplikation in zwei Dimensionen (zwischen Ressourcentypen *und* zwischen Add/Edit).
- **Edit-Features-Modals** (georesource 914 / spatial-unit 1032 / indicator 658 Z.): **~60 %** gemeinsamer Kern (Feature-Grid, Attribute-Mapping, Mapping-Config-Import/Export, dry-run-Ablauf).
- **Edit-User-Roles-Modals** (georesource 514 / spatial-unit 509 Z.): **~75–80 % identisch**.
- **Delete-Modals**: nur ~25–30 % — überwiegend echt ressourcenspezifisch (v. a. die aufwändige Teil-Lösch-Logik im `indicator-delete-modal`).

### Echt ressourcenspezifisch (nicht zusammenführen)

- POI/LOI/AOI-Styling + Icon-/Marker-Picker (Georesource, ~250 Z.).
- Outline-Layer, Raumebenen-Hierarchie (`nextLower/nextUpperHierarchyLevel`), Bbox (SpatialUnit, ~150 Z.).
- Indikator-Referenzen, Klassifikation/Colorbrewer, regionale Vergleichswerte, Precision/Unit, Teil-Lösch-Logik, pro-Raumebene-Rollen-Modal (Indicator).
- API-Vertragsunterschied `permissions` (SpatialUnit) vs. `allowedRoles` (Georesource) im PostBody — parametrisierbar halten.

### Konsolidierungsplan (Bausteine existieren bereits)

1. **Import-Flow generalisieren:** `SpatialUnitImportService` (271 Z.) + `spatial-unit-import.util.ts` + `spatial-unit-import.model.ts` sind bereits ressourcen-agnostisch geschrieben, werden aber nur von SpatialUnits genutzt. Zu einem generischen `ResourceImportService` machen, Georesource/Indicator umstellen. Einsparung grob 1.500–2.000 Zeilen; eliminiert nebenbei die `getElementById`-Zugriffe der Georesource-Modals.
2. **Gemeinsame `<resource-metadata-form>`-Komponente:** der identische Metadaten-Block (Formular + `parseFromMetadataFile` + Export/Import) steckt in 6 Modals.
3. **Gemeinsame `<role-management-panel>`-Komponente:** Rollen-Grid + Owner-Filter ist 4× neu implementiert (Add-, Edit-Metadata-, Edit-User-Roles-Modals, `indicator-add-form-state.service`), obwohl `RoleManagementDataGridHelperService` die Bausteine liefert.
4. **Stepper-/Validierungs-Basis:** `currentStep/nextStep/previousStep/goToStep` + Security-Step-Weiche ist in allen Add/Edit-Modals zeilenweise identisch.
5. **Georesource-Bereich mechanisch auf SpatialUnit-Muster heben** (Outputs statt Broadcast, `NotificationService`, DOM-Zugriffe raus) — Voraussetzung für 1–4.

### Sonderfall `indicator-add-form-state.service.ts` (2064 Z.)

Modal-scoped provided (frische Instanz pro Modal), teilt Formularstate zwischen den 7 Step-Komponenten (`steps/indicator-add-step1..7`) und bedient Add **und** Edit (`buildPostBody_indicators`, `buildPatchBody`, `enterEditMode`). Architektonisch das sauberste Muster im CRUD-Bereich — aber indikator-spezifisch; Metadaten-, Rollen-Grid-, Import/Export- und Stepper-Blöcke darin wären generisch extrahierbar.

---

## 2. Admin-Service-Schicht (zweitgrößter Hebel)

### `adminSpatialUnit/kommonitor-data-exchange.service.ts` (1192 Z.) — unerkannter God-Service mit irreführendem Namen

Fan-in: **16 Dateien**, darunter das gesamte Role-Management, `indicator-add-form-state.service` und sogar die Reachability-Coverage-Reports — faktisch ein globaler Admin/Auth-Service, kein SpatialUnit-Service. Mindestens 8 unzusammenhängende Verantwortlichkeiten:

- Keycloak-Auth-Polling per `timer(0, 1000)` (`:161`) + 30s-Token-Refresh-Polling (`:208`) + `setTimeout`-Retries (`:186-202`)
- HTTP-Fetch für SpatialUnits, AccessControl, Indikatoren (`:462`, `:494`, `:530` — `fetchIndicatorsMetadata` gehört hier gar nicht hin)
- eigener In-Memory-Cache mit 5-Min-TTL (`:96-111`, `:748-772`)
- State-Store mit 7 BehaviorSubjects (`:76-94`) plus synchrone `.value`-Getter — mehrere Wahrheitsquellen
- Permission-Logik (`checkCreatePermission :621`, `checkAdminPermission :827`, OU-Hierarchie-Traversierung `:855-887`)
- UI-Konstanten inkl. SVG-Strings (`datePickerOptions :372`, `availableLoiDashArrayObjects :423`)
- Formvalidierung + PATCH-Body-Bau (`:924-1054`)
- View-Logik: `syntaxHighlightJSON` erzeugt HTML-Strings (`:670`), `transformFeaturesForGrid` (`:1085`)

**Kontrast/Zielbild:** `adminGeoresourceUnit/kommonitor-data-exchange.service.ts` (134 Z.) ist eine saubere Fassade, die an `AccessControlService`, `GeoresourceMetadataStoreService`, `TopicMetadataStoreService`, `MetadataBootstrapService` und `CacheHelperService` delegiert — die Prio-7-Zielarchitektur. Der SpatialUnit-Zweig wurde beim Split schlicht nicht mitgezogen.

### Dreifach-Caching der Spatial-Unit-Metadaten

1. In-Memory-Cache im data-exchange (5-Min-TTL),
2. localStorage-Cache in `adminSpatialUnit/kommonitor-cache-helper.service.ts` (`:225-306`, mit eigenem, widersprüchlichem `SpatialUnitMetadata`-Interface),
3. zentraler `cache-helper-service`.

Zwei der Caches kennen sich nicht → Inkonsistenz eingebaut. `kommonitor-cache-helper.isUserAuthenticated()` gibt hart `true` zurück (`:118-122`). Die 22-Zeilen-Weiterleitungs-Services `adminIndicatorUnit/` und `adminGeoresourceUnit/kommonitor-cache-helper.service.ts` sind überflüssige Indirektion.

### Grid-Helper: HTML-String-Bau, DOM-Handler, tote Kopien

- **~400 Zeilen 1:1-Kopie** des Role-Management-Grids (drei `CheckboxRenderer_*`-Klassen + `buildRoleManagementGrid*`) in `adminFilterConfig/kommonitor-data-grid-helper.service.ts` (`:410-820`) — kanonisch existiert alles in `role-management-data-grid-helper-service`. Ebenso das `regionalReferenceValues`-Grid doppelt (adminIndicatorUnit `:361-572` und adminFilterConfig `:194-405`). Die echte Filter-Logik in adminFilterConfig umfasst nur ~70 Zeilen.
- Zellrenderer als HTML-Strings + `document.querySelectorAll(...).addEventListener` + `setTimeout(…, 200)`-Hacks (georesource-grid-helper `:41-66`, `:144-231`); Event-Routing über ID-String-Parsing (`event.target.id.split('_')[3]`, feature-table `split('__')`).
- **Tote AG-Grid-APIs:** `columnApi` und `new agGrid.Grid()` (in v31+ entfernt) in `adminFilterConfig` (`:125`, `:208`); globaler State auf `window.colState`/`window.filterState` (`:116-133`).
- POI/LOI/AOI-Column-Defs und Grid-Options im georesource-grid-helper dreifach nahezu identisch (`:300/:424/:541`, `:714/:752/:790`).

### `kommonitor-importer-helper.service.ts` (988 Z.)

Promise-basierter API-Client über **11× deprecated `.toPromise()`**; Fire-and-forget-Fetch im Konstruktor (`:258`); sequenzielle await-Schleifen statt `forkJoin`; **greift als Service per `document.getElementById` in Formularfelder** (`:449`, `:497-586` — der `formValues`-Fallback-Pfad existiert bereits und sollte der einzige werden); Management-API-Bodies durchweg `any`; Config aus `window.__env` statt `EnvConfigService`.

### Sicherheitsrelevanter Fund

`admin-login-state-service` hält `adminUserName`, `adminPassword`, `adminIsLoggedIn` als **öffentliche, untypisierte mutable Felder** (`:13-15`) — Klartext-Passwort im Singleton-State. Prüfen und entfernen.

### Weitere Service-Befunde

- `feature-table-data-grid-helper` (`providedIn: 'root'`) hält mutable Instanzfelder (`currentResourceId`, Grid-Referenzen) — zwei parallel geöffnete Edit-Modals überschreiben sich gegenseitig.
- Zwei divergierende HTTP-Error-Handler (`handleHttpError` liefert String, `handleError` wirft); `deleteSpatialUnit` verschluckt Fehlerursachen und liefert nur `boolean` (`:1145-1153`).
- `KeycloakHelperService` (1375 Z.) ist ein weiterer God-Service (Keycloak-Admin-REST komplett) — gleiches Split-Kandidatenprofil.

---

## 3. Querschnittsthemen

### Typisierung (Enabler für alles andere)

- **680 `: any`-Annotationen**, 59 `as any`, 125 `any[]`-Varianten im Admin-Code.
- **Null Interfaces für die zentralen API-Objekte** (Indicator-/Georesource-/SpatialUnit-Metadaten); nur 5 lokale `*.model.ts` für Randthemen. Selbst Broadcast-Payloads sind `any`.
- Empfehlung: Typen aus der OpenAPI-Spec der Data-Management-API generieren und sukzessive einziehen — ohne typisierte Modelle ist jedes größere Refactoring Blindflug.

### Formulare

**455 `ngModel`-Bindings, 0 Reactive Forms** im gesamten Admin-Bereich. Validierung über handgeschriebene `…Invalid`-Flags + `check…()`-Methoden, dreifach kopiert. Bei der CRUD-Konsolidierung direkt auf Typed Reactive Forms gehen, statt das ngModel-Muster zu verallgemeinern.

### AngularJS-Erbe in den Modal-Innereien

- **33 jQuery-Aufrufe** — konzentriert in den Edit-Features-/Edit-Metadata-Modals: `datepicker()`/`colorpicker()`/`iconpicker()`-Plugins (`georesource-edit-metadata-modal.component.ts:313-361`), bootstrap-validator (`indicator-edit-features-modal.component.ts:526`), AdminLTE `boxWidget()` (`admin-georesources-management.component.ts:208`).
- **59× `document.getElementById`** (Hotspot `georesource-edit-features-modal` ~15×), 72× `document.*` gesamt.
- **79 `setTimeout`-Timing-Hacks** (u. a. `admin.component.ts:49`, diverse Modal-Choreografien).
- **Broadcast-Bus** (176 Treffer) mit `Refresh…` → `…Completed`-Roundtrips als `$broadcast`-Ersatz.
- Async-Wildwuchs: 25× `.then(`, 84× `.subscribe(`, **7× deprecated `.toPromise()`**, 8× `firstValueFrom` — drei Paradigmen parallel.

### Feedback an den User: zwei konkurrierende Systeme

- Modern: `NotificationService` in 22 Dateien.
- Alt: `show/hideSuccessAlert`-Muster in 20 Dateien (154 Treffer) — statische Alert-Divs per `document.getElementById(...).hidden = false`, ohne Fehlertext aus der Response.
- Etliche Subscribes ohne Error-Handler; 49× `console.error`-only-Pfade.

### Change Detection / Rendering

- **0× OnPush**, Signals nur im Dashboard (`admin-dashboard-management.component.ts` — komplett signal-basiert, Vorbild) und 1× `signal(false)` im indicator-delete-modal.
- Riesige Templates mit Logik: `georesource-add-modal.component.html` 1487 Z. (44 `*ngIf`), `georesource-batch-update-modal.component.html` 1319 Z. (**80 `*ngIf`**), `spatial-unit-add-modal.component.html` 1172 Z. 491 `*ngIf` gesamt, kaum neue `@if`-Syntax.

### i18n

Nur 2 Admin-Dateien nutzen `translate`; **51 von 64 Templates** enthalten hartkodiertes Deutsch. Der Admin-Bereich ist faktisch nicht übersetzt, obwohl ngx-translate eingerichtet ist.

### `window.__env`

62 Direktzugriffe in 6 Dateien per `declare const __env: any` — am vorhandenen `EnvConfigService` vorbei (den 14 andere Admin-Dateien korrekt nutzen).

### Tests

**8 Specs für 89 TS-Dateien (~9 %)**, davon 7 reine "should create"-Smoke-Tests. Einzige echte Logiktests: `spatial-unit-import.util.spec.ts`. Die riskantesten Dateien (2064-Zeilen-Form-State, beide Add-Modals) sind ungetestet.

---

## 4. Shell, Routing & Config-Seiten

### Positiv

- Echtes Child-Routing: `AdminComponent` ist standalone mit `<router-outlet>`; 12 Child-Routes unter `administration` (`app/app.routes.ts:19-38`), nur der aktive Tab wird instanziiert.
- Qualitäts-Leuchttürme: Dashboard (Signals/`computed`), `advanced-role-permissions.ts` (sauber extrahiert, dokumentiert — bester Code im Admin-Bereich), `admin-script-execution` (sauberes `forkJoin`-RxJS), TopicsManagement (schlank, Store-basiert).

### Befunde

- **Kein Lazy Loading:** alle Admin-Routen statisch importiert (`component:` statt `loadComponent:`) — der komplette Admin-Bereich (~37.000 Zeilen TS+HTML) landet im Bundle jedes Nutzers, der nie `/administration` sieht. Billiger, großer Gewinn.
- **Voller Metadaten-Refetch bei jedem Betreten:** `AdminComponent.ngOnInit()` ruft `metadataBootstrap.fetchAllMetadata()` (`admin.component.ts:43`), obwohl der Startup bereits geladen hat; die `inFlight`-Serialisierung im Bootstrap-Service mildert nur Races, verhindert den Doppel-Fetch nicht. Dazu `setTimeout(prepUserInformation, 1000)`-Hack (`admin.component.ts:49-51`).
- **Tote Komponente:** `AdminLandingpageConfigComponent` ist vollständig implementiert, aber in keiner Route referenziert; enthält zudem einen wirkungslosen `await …subscribe()`-Bug (`:56`).
- **Config-Editoren** (AppConfig 302 Z. / ControlsConfig 321 Z.): Copy-Paste-Zwillinge — CodeMirror-Textareas mit "String-enthält-Keyword"-Validierung (50 hartkodierte `window.__env.*`-Keywords), `getElementById` statt des deklarierten `@ViewChild`, auskommentierte AngularJS-Downgrade-Reste. FilterConfig (519 Z.) ist moderner (`takeUntilDestroyed`), mischt aber CodeMirror + AG Grid + Broadcast.
- `AdminComponent` steht überflüssig im `imports`-Array von `AppModule` (`app.module.ts:92`), obwohl es nur per Route geladen wird.

---

## 5. Empfohlene Reihenfolge

> **Fortschritt (2026-07-07):** Schritt 1 (API-Typen) begonnen. OpenAPI-Spec der Data-Management-API unter `api-specs/` eingecheckt, Typ-Generierung per `npm run generate:api-types` (openapi-typescript) nach `app/models/data-management-api.generated.ts`, benannte Re-Exports in `app/models/data-management-api.ts`. Bestehende Hand-Modelle (`IndicatorsDataset`, `GeoresourcesDataset`, `Topic`) auf die Spec-Typen rebasiert; alle fünf Metadata-Stores (`indicator`/`georesource`/`spatial-unit`/`topic`/`process-script`) und der zentrale `cache-helper-service` (Fetch-Rückgaben) sind typisiert.
>
> **Fortschritt (2026-07-07, Teil 2):** `permissions.models.ts` auf `OrganizationalUnitOverviewType` rebasiert (`AccessControlPermission`/`AccessControlMetadata`/`AvailableRole`); `AccessControlService` komplett durchtypisiert. Die **beiden konkurrierenden Duplikat-Interfaces** `SpatialUnitMetadata`/`AccessControlMetadata` in `adminSpatialUnit/kommonitor-data-exchange.service.ts` und `adminSpatialUnit/kommonitor-cache-helper.service.ts` sind durch Aliasse auf die kanonischen Typen ersetzt (Legacy-Exportnamen bleiben für die 16 Importer bestehen). `admin-role-management.service` (`OrganizationalUnitInputType`-POST-Body) und `fetchIndicatorsMetadata` im Admin-Data-Exchange typisiert.
>
> **Fortschritt (2026-07-07, Teil 3):** `kommonitor-importer-helper`: alle 6 Register/Update-Bodies mit den Spec-Input-Typen (`SpatialUnitPOSTInputType` etc.) typisiert, `buildPutBody_indicators` typisiert (inkl. dokumentierter Spec-Abweichung `defaultClassificationMapping` im PUT-Body), 11× deprecated `.toPromise()` → `firstValueFrom`. Georesource-/Indicator-Grid-Helper und die Georesource-Fassade: Datenpfade typisiert (`GeoresourcesDataset[]`/`IndicatorsDataset[]`/`RegionalReferenceValueType[]`; Cell-Renderer-Params bewusst `any` gelassen — werden laut Roadmap durch Angular-Komponenten ersetzt). **`adminFilterConfig/kommonitor-data-grid-helper.service.ts` von 821 auf 92 Zeilen reduziert**: die toten 1:1-Kopien des Role-Management-Grids und des RegionalReferenceValues-Grids gelöscht (inkl. `window.colState`-Global-State und der in AG Grid v31 entfernten `columnApi`/`new agGrid.Grid()`-Aufrufe). Noch offen: restliche `: any` in den großen Add-/Edit-Modals; Aufräumkandidat: Debug-Fallback `testGridsWithSampleData()` in `admin-georesources-management.component.ts` (rendert bei Fetch-Fehlern Fake-Zeilen).
>
> **Fortschritt (2026-07-07, Teil 4 — Schritt 2 begonnen):** Georesource-Bereich aufs SpatialUnit-Muster gehoben. **Drei zuvor zur Laufzeit kaputte Modals repariert**: `georesource-delete-modal` und `georesource-edit-user-roles-modal` injizierten den AngularJS-String-Token `'kommonitorDataExchangeService'` ohne Provider (→ `NullInjectorError` beim Öffnen) — jetzt echte Services. Alle fünf Georesource-Modals (Add/Delete/EditMetadata/EditFeatures/EditUserRoles) kommunizieren jetzt via `@Output() refreshRequested` (`georesource-refresh.model.ts`) statt über den Broadcast-Bus; Delete-Daten laufen per `componentInstance`-Input statt `OnDeleteGeoresources`-Broadcast; der doppelte Refresh (Broadcast + `modalRef.result`) ist beseitigt; das Add-Modal sendete zudem falsche Payload-Keys (`action`/`id`), die immer den Full-Refetch-Fallback erzwangen. Der Broadcast-Listener der Übersicht bleibt nur noch für den externen Sender `wms-admin-table`. **Toter Event-Traffic entfernt:** `RefreshAdminDashboardDiagrams` hatte keinen Empfänger mehr (Dashboard ist signal-basiert) — alle 8 Sender + Enum-Member gelöscht; ebenso die Enum-Member `OnDeleteGeoresources`/`OnEditGeoresourceMetadata` und das tote Cell-Renderer-Callback-Trio der Übersicht. **Weiterhin kaputt (separates Thema):** `georesource-batch-update-modal` injiziert per String-Token drei Services, darunter den nicht mehr existierenden `kommonitorBatchUpdateHelperService` — das Modal crasht beim Öffnen und braucht eine echte Reparatur oder Entfernung (das Indicator-Pendant ist davon nicht betroffen).
>
> **Fortschritt (2026-07-07, Teil 5 — DOM/jQuery-Ablösung Georesource-Edit-Modals):** Wichtige Erkenntnis vorab: `angular.json` lädt nur jQuery-Core + Bootstrap — die jQuery-Plugins `datepicker`/`colorpicker`/`iconpicker` existieren zur Laufzeit **nicht**. Alle jQuery-Picker im `georesource-edit-metadata-modal` (Datum, LOI-/AOI-Farbe, POI-Icon, LOI-Linienmuster) waren daher seit der Migration stillschweigend tot (try/catch schluckte den TypeError). Ersetzt durch die vorhandenen Angular-`customElements`: `km-date-picker`, `km-color-picker`, `km-line-pattern-picker`; der tote POI-Icon-Picker-Button ist jetzt ein funktionierendes Text-Input für den Glyphicon-Namen (ein echter `km-icon-picker` wäre ein sinnvolles Folge-Feature, auch fürs Add-Modal). Im `georesource-edit-features-modal`: dynamische Converter-/Datasource-Parameter und BBOX-Felder werden nicht mehr per `getElementById` aus dem DOM gescraped, sondern sind ngModel-gebunden (`converterParameterValues`/`datasourceParameterValues`); Datei-Input über den vorhandenen `@ViewChild`. In beiden Modals: Alert-Ein-/Ausblenden über Template-Flags statt `document.getElementById(...).hidden`, `<pre>`-Beispielstruktur per `[innerHTML]`-Binding. Beide Modals sind jetzt frei von `document.*`- und jQuery-Zugriffen.
>
> **Fortschritt (2026-07-07, Teil 6 — Picker-Prüfung Add-Modal + Restbestände):** App-weite Prüfung auf tote jQuery-Picker-Aufrufe: Außerhalb des Admin-Bereichs nur noch auskommentierte Reste (Reachability, Data-Import). Im `georesource-add-modal` waren **alle Styling-Picker funktionsunfähig**: LOI-/AOI-Farbwahl (verstecktes Input ohne jegliche Picker-Init), POI-Icon-Button (nie initialisiert), Linienmuster-Dropdown und die drei POI-Dropdowns (Marker-Farbe/Art/Textfarbe) nutzten Bootstrap-3-Syntax (`data-toggle`) unter geladenem **Bootstrap 5** → Dropdowns konnten nicht öffnen. Fixes: Farben → `km-color-picker`, Datum → `km-date-picker`, Linienmuster → `km-line-pattern-picker`, Icon-Button → Text-Input; die POI-Dropdowns auf `data-bs-toggle` migriert und die `<a href="">`-Menüeinträge entschärft (hätten nach dem Fix Seiten-Reloads ausgelöst) — dieselben Dropdown-Fixes auch im Edit-Metadata-Modal. Im `georesource-edit-features-modal` die übersehene tote `initializeDatePickers()` entfernt und die Gültigkeitszeitraum-Inputs auf `km-date-picker` umgestellt (analog SpatialUnit-Vorlage). Verbleibende inerte `data-toggle="validator"`-Attribute (Plugin nicht geladen, folgenlos) in 6 Modals als Kosmetik-Rest notiert; `data-toggle="modal"` in `admin-filter-config.component.html:19` sollte bei nächster Gelegenheit geprüft werden.
>
> **Fortschritt (2026-07-07, Teil 7):** Tote `AdminLandingpageConfigComponent` (inkl. Template/SCSS) gelöscht — war in keiner Route referenziert, Selector nirgends verwendet. Aus dem Schritt-1-Paket damit noch offen: `adminPassword`-Klärung (Legacy-Login ohne Keycloak in `user-interface`/`user-login` — fachliche Entscheidung) und die restlichen `: any` in den großen Add-/Edit-Modals (gehen in Schritt 3 auf).

1. **API-Typen einführen** (Enabler, risikoarm) + tote Kopien löschen (Role-/ReferenceValues-Grid-Kopien in `adminFilterConfig`, `AdminLandingpageConfigComponent`) + `adminPassword`-Feld im `admin-login-state-service` klären/entfernen.
2. **Georesource-Bereich auf SpatialUnit-Niveau heben:** Broadcast → `@Output`, `getElementById` raus, `NotificationService` — rein mechanisch, macht die drei Bereiche verhaltensgleich.
3. **Gemeinsame Bausteine extrahieren:** `ResourceImportService` (aus `SpatialUnitImportService` generalisiert), `<resource-metadata-form>`, `<role-management-panel>`, Stepper-Basis — der große Zeilen-Abbau (grob 4.000–6.000 Zeilen über alle Modals). Neue Bausteine mit Typed Reactive Forms und echten Tests.
4. **`adminSpatialUnit/KommonitorDataExchangeService` zerschlagen** nach dem Muster der Georesource-Fassade: Auth/Polling → Auth-/AccessControl-Services, UI-Konstanten/Body-Bau/Validierung in dedizierte Module, Caches auf den zentralen `cache-helper-service` konsolidieren, danach umbenennen.
5. **Modernisierung in der Breite:** Lazy Loading der Admin-Routen, Doppel-Fetch beim Admin-Einstieg beseitigen, Signals/OnPush ausrollen (Vorbild Dashboard), `.toPromise()`/`setTimeout`-Hacks entfernen, Feedback auf `NotificationService` vereinheitlichen, i18n der 51 Templates, `__env`-Zugriffe auf `EnvConfigService`.
