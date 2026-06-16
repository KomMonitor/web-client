# Vorschläge für die sinnvollsten Änderungen am KomMonitor Web-Client

Stand: 2026-06-12, Branch `feature/migration-bootstrap`.
Analysebasis: Codebestand, `angular.json`, `webpack.config.js`, `package.json`, `dist/`-Output, Git-Historie.

**Gesamtbild:** Die Migration AngularJS → Angular 16 ist faktisch durch — `app/main.ts` bootstrappt rein Angular, es gibt kein aktives ngUpgrade mehr, und die verbliebenen ~38 AngularJS-Komponenten werden von der laufenden App gar nicht mehr geladen. Die größten Hebel sind jetzt: Altlasten konsequent entfernen, den Build-Output reparieren (aktuell wird der komplette Quellcode mit ausgeliefert) und das EOL-Framework anheben.

---

## Prio 2 — AngularJS-Altlasten vollständig entfernen

**Problem:** Es existieren noch 38 `*.component.js` und 65 `*.module.js` aus der AngularJS-Welt (u. a. `app/components/kommonitorAdmin/adminRoleManagement/`, `adminScriptManagement/`, `app/components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/`) sowie `app/app.js` als alter App-Einstieg. Nichts davon wird noch geladen: `app/index.html` bindet keine Skripte ein, `angular.json` lädt nur jQuery/Bootstrap, ngUpgrade ist nirgends aktiv. Für RoleManagement, ScriptManagement und Reachability existieren bereits fertige Angular-Pendants unter `app/components/ngComponents/`.

**Maßnahme:**
1. Vorher prüfen, ob zwei Features ohne Angular-Pendant noch gebraucht werden: `feedbackModal` und `kommonitorIndividualIndicatorComputation` (beide unter `app/components/kommonitorUserInterface/kommonitorControls/`). Falls ja → migrieren; falls nein → mit löschen.
2. Alle `*.component.js`/`*.module.js`, `app/app.js` und zugehörige AngularJS-Templates löschen.
3. Danach aus `package.json` entfernen: `angular`, `angular-route`, `angular-resource`, `angular-sanitize`, `angular-animations`, `angular-ui-bootstrap`, `angularjs-dropdown-multiselect`, `angular-legacy-sortablejs-maintained`, `ui-select`, `@angular/upgrade`, `babel-plugin-angularjs-annotate` sowie alle `@types/angular*`-Pakete.
4. Auskommentierten Hybrid-Code in `app/mainComponent/main/main.component.ts` entfernen.

**Aufwand: M** — **Nutzen: hoch** (kleinere Installation, kein toter Code mehr, der bei Suchen/Refactorings stört)

**Status (2026-06-15, erledigt):** Schritte 2–4 umgesetzt. Gelöscht: `app/app.js`, `app/components/common/`, `app/components/kommonitorAdmin/`, `app/components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/` (Angular-Pendant unter `app/components/ngComponents/userInterface/sidebar/kommonitorReachability/`), `app/util/genericServices/`. Die o. g. AngularJS-`package.json`-Einträge entfernt. Zwei aktive ngComponents (`reporting-overview`, `indicator-add`) nutzten noch `fromJson`/`toJson` aus `angular` — auf natives `JSON.parse`/`JSON.stringify` umgestellt.

> **TODO — offene AngularJS-Migration (bewusst behalten):** Zwei Features unter `app/components/kommonitorUserInterface/kommonitorControls/` haben noch kein Angular-Pendant und sind als Migrationsreferenz im Repo geblieben (werden nicht gebaut/geladen):
> - `feedbackModal` — im aktiven UI nur über einen auskommentierten Link in `user-interface.component.html` referenziert.
> - `kommonitorIndividualIndicatorComputation` ("Interaktive parametrisierte Neuberechnung eines Indikators") — in der README als Key-Feature gelistet, im aktiven Code aktuell nicht eingebunden.
>
> Beide nach Angular (`ngComponents/`) migrieren oder nach finaler Produktentscheidung löschen. Erst danach ist Prio 2 vollständig abgeschlossen.

---

## Prio 3 — Webpack-Pipeline stilllegen

**Problem:** `webpack.config.js` baut noch `app/app.js` zu `app/dependencies/app.bundle.js` und kopiert ~96 Bibliotheks-Assets nach `app/dependencies/` (56 MB). Kein einziges Quell- oder Template-File referenziert `dependencies/` — der Output ist verwaist. Die benötigten Bibliotheken laufen längst über `angular.json` (`styles`/`scripts`) bzw. npm-Imports.

**Maßnahme:** `webpack.config.js`, `.babelrc`, den Ordner `app/dependencies/` und die zugehörigen devDependencies (`webpack`, `webpack-cli`, `copy-webpack-plugin`, alle `babel-*`-Pakete, `babel-polyfill`) entfernen. Falls einzelne Assets daraus doch noch gebraucht werden (z. B. Webfonts), gezielt in `angular.json` aufnehmen.

**Aufwand: S–M** — **Nutzen: hoch** (eine Build-Pipeline statt zwei, −56 MB Repo-/Deploy-Ballast)

**Status (2026-06-15, erledigt):** Gelöscht: `webpack.config.js`, `.babelrc`, der Ordner `app/dependencies/` (56 MB; war via `.gitignore` ohnehin nicht im Repo, nur lokaler Build-/Deploy-Ballast) sowie der obsolete `dependencies/`-Eintrag in `.gitignore`. Aus `package.json` (devDependencies) entfernt: `webpack`, `webpack-cli`, `copy-webpack-plugin`, `babel-core`, `babel-polyfill`, `babel-preset-env`, `babel-plugin-transform-es2015-destructuring`, `babel-plugin-transform-object-rest-spread` sowie zusätzlich `@babel/cli` und `@babel/core` (gehörten zur selben toten Babel-Toolchain — kein npm-Script ruft sie auf, Angular CLI bringt sein eigenes Babel mit). `npm install --force` + `npm run build` danach grün (EXIT 0).

Verifiziert vor dem Löschen: Webpack-Entry war `./app/app.js` (bereits in Prio 2 gelöscht → Pipeline baute ohnehin ins Leere); kein Quell-/Template-File referenziert `dependencies/` (nur auskommentierte `background:url(...)`-Zeilen in `app/app.scss`); `.babelrc` war bereits tot (Plugin `angularjs-annotate` in Prio 2 entfernt). Einzige verbleibende Babel-Nutzung: das eigenständige `gulpfile.js` der vendored Lib `customizedExternalLibs/Excalibur-Dual-List/` (nutzt `gulp-babel`, nicht unsere Deps; nicht Teil des Builds).

---

## Prio 4 — Angular 16 (EOL) anheben

**Problem:** Angular 16 ist seit November 2024 End-of-Life — keine Security-Patches mehr. Auch `keycloak-js` 25 und weitere Pakete hängen daran.

**Maßnahme:** Schrittweises Upgrade über `ng update` (16 → 17 → 18, danach optional weiter). Sinnvoll **nach** Prio 2/3, weil dann `@angular/upgrade` und die AngularJS-Typings nicht mehr mitgezogen werden müssen. Bei der Gelegenheit `bootstrap` 5.2 → 5.3 prüfen (passt zu den aktuellen Bootstrap-Konfliktbereinigungen in `app/app.scss`).

**Aufwand: M–L** — **Nutzen: hoch** (Security-Support, Voraussetzung für alles Weitere)

**Status (2026-06-15, erledigt bis Angular 18):** Upgrade 16 → 17 → 18 durchgeführt (zwei Commits: „upgrade Angular 16 -> 17", „upgrade Angular 17 -> 18"). Alle `@angular/*`-Framework-Pakete auf 17.3.12 bzw. 18.2.14; `zone.js ~0.14` und `typescript ~5.4` explizit als direkte Deps ergänzt (vorher nur transitiv). Build nach jedem Schritt grün.

Begleitende Anpassungen:
- **Gekoppelte Drittpakete** mit-hochgezogen: `@ng-bootstrap/ng-bootstrap` 15 → 17, `ngx-echarts` 16 → 18.
- **`ngx-color-picker` 20 → 17** zurückgestuft — v20 verlangte Angular ≥19 (war ursprünglich nur per `--force` in das Angular-16-Projekt gezwungen) und blockierte die Auflösung. v17 akzeptiert Angular ≥9, läuft also auch unter 18. In `kommonitor-data-import.component.ts` den Import von `ColorPickerDirective` auf `ColorPickerModule` umgestellt (Directive ist in v17 nicht standalone).
- Fehlende **`tsconfig.spec.json`** angelegt (vom `test`-Target in `angular.json` referenziert; blockierte sonst die CDK-Migration). Erster Baustein für Prio 6.
- Angular-Migrationen automatisch angewandt: `browserTarget` → `buildTarget` (17), HTTP `HttpClientModule` → `provideHttpClient(withInterceptorsFromDi())` in `app.module.ts` (18, DI-registrierter `AuthInterceptor` bleibt erhalten).

> **Wichtig für Build/Serve:** Das Projekt braucht jetzt **Node 18 (oder 20)** — Node 24 wird von der Angular-CLI als „Unsupported" gemeldet. Lokal via `nvm use 18`.

> **Offene Punkte (nicht blockierend):**
> - Die **optionale** Migration „use-application-builder" (esbuild/Vite statt Webpack-`browser`-Builder) wurde **nicht** angewendet — kann separat als eigener Schritt erfolgen.
> - ~~43 „CommonJS optimization bailout"-Warnungen (jquery, jszip, docx, codemirror, papaparse, jstat, file-saver, dom-to-image-more, leaflet.markercluster, …) — über `allowedCommonJsDependencies` in `angular.json` unterdrückbar.~~ ✅ erledigt (2026-06-15): `allowedCommonJsDependencies` in den Build-Options ergänzt (21 Einträge, jeweils der Paketname — Angular reduziert Deep-Imports wie `codemirror/mode/...` bzw. `core-js/modules/...` auf den Paketnamen, daher genügen `codemirror`/`core-js`). Build danach mit **0** CommonJS-Warnungen, grün.
> - ~~Vorbestehender Bug: `serve.options.buildTarget` in `angular.json` zeigt auf `latest-angular:build` statt `kommonitor-client:build` (betrifft `npm start`, unabhängig vom Upgrade).~~ ✅ behoben (2026-06-15): auf `kommonitor-client:build` korrigiert (+ schiefe Einrückung bereinigt); `ng serve` löst das Target nun auf und kompiliert grün („Compiled successfully").
> - ~~`bootstrap` 5.2 → 5.3 noch offen.~~ ✅ erledigt (2026-06-16, siehe Status-Block unten). ~~Optionales Weiter-Upgrade auf Angular 19/20 noch offen.~~ → **Angular 19 erledigt** (2026-06-16, siehe Status-Block unten); 20 weiterhin offen.

**Status (2026-06-16, Bootstrap/SCSS-Konsolidierung erledigt):** Der unter „Offene Punkte" notierte Bootstrap-Rest sowie die angefangene `app/app.scss`-Konsolidierung wurden in vier Commits abgeschlossen. Realisierte Reihenfolge (sicher → riskant, jeder Schritt einzeln verifiziert):

1. **`bootstrap` 5.2.3 → 5.3.8.** Bootstrap wird als kompiliertes CSS/JS konsumiert (`angular.json` `styles`/`scripts`), nicht aus SCSS rekompiliert → Drop-in-Tausch. `@ng-bootstrap/ng-bootstrap` 17 deklariert keinen `bootstrap`-Peer (versionsagnostisch). 5.3.8 emittiert eine harmlose Optimizer-Warnung aus Bootstrap selbst (`1 rules skipped: .form-floating>~label`) — ungültiger Selektor im Bootstrap-CSS für das `form-floating`-Feature, das die App nicht nutzt; kein Build-Fehler.
2. **Toten CSS-Code entfernt:** 14 lange deaktivierte `/* … */`-Regelblöcke (~175 Zeilen) aus `app/app.scss` gelöscht (Marker-Icon-Farben, dateSlider/irs-Reste, `.btn-custom.invert`, georesource-Error u. a.). **Beweisbar render-neutral:** das kompilierte globale Stylesheet ist nach Strippen aller Kommentare + Whitespace byte-identisch (md5 `f2a757c2…`).
3. **Style-Ladereihenfolge gedreht:** `bootstrap.min.css` lädt jetzt **vor** `app/app.scss` (vorher umgekehrt). Damit gewinnt `app.scss` Spezifitäts-Gleichstände natürlich — das war die Wurzel der 172 `!important`. Einziger sichtbarer Effekt (statische CSS-Fixture über Buttons/Forms/Inputs/Selects/input-group/nav-tabs/Dropdown/list-group/Alerts/Card/Modal): `.list-group-item.active` wechselt von Bootstrap-Blau (#0d6efd) auf `--kommonitor-primary` (#337ab7) — eine zuvor dormante app.scss-Regel gleicher Spezifität, jetzt konsistent mit den Primary-Buttons. Trivial reversibel (1-Zeilen-Revert).
4. **Globale Bootstrap-3-Ära-Overrides konsolidiert:** Drei aggressive globale Element-Regeln entfernt, damit Bootstrap-5-Defaults greifen (`input/select` font-size+border-radius, `label` bold, `.input-group` baseline+gap) plus deren redundante `!important`; netto −4 live `!important` (173 → 148 über den Branch, Rest aus Schritt 2).

> **Verifikations-Setup:** `ng serve` (Node 18) + Headless-Chrome-Screenshots einer **statischen CSS-Fixture** (`styles.css`-Bundle + repräsentatives Bootstrap-Markup, `file://`). **Volle Live-App-Visual-QA war nicht möglich** — die App leitet zu Keycloak, das die `localhost`-`redirect_uri` ablehnt. Die Fixture isoliert dafür genau die globale Cascade.

> **Bewusst NICHT gemacht — breiter `!important`-Sweep (offen, inkrementell):** Die verbleibenden ~148 `!important` wurden **nicht** pauschal entfernt. Das erfordert Live-Visual-QA (hier blockiert), und blindes Entfernen ist unsicher: z. B. `.dropdown-menu { position: absolute !important }` überschreibt **Popper-Inline-Styles**, nicht Bootstrap-CSS — eine statische Fixture würde die Regression nicht erkennen. **Sichere Methodik für später:** nur `!important` entfernen, die gegen *Bootstrap* (jetzt vor app.scss) bei gleicher/niedrigerer Spezifität kämpfen; **behalten** bei (a) später geladenen Libs (nouislider/ag-grid/leaflet/codemirror laden in `angular.json` nach app.scss), (b) Inline-Styles (Popper/JS), (c) spezifischeren Fremdselektoren — jede Entfernung in der laufenden App visuell prüfen.

**Status (2026-06-16, Angular 18 → 19 erledigt):** Upgrade via `ng update @angular/core@19 @angular/cli@19 --force` durchgeführt. Alle `@angular/*` auf **19.2.x**, CLI/Devkit 19.2.27, **TypeScript 5.4 → 5.8.3**, **zone.js 0.14 → 0.15.1** (von `ng update` automatisch). `@angular/cdk` manuell auf 19.2.x. Node 18.20.7 erfüllt Angular 19s `^18.19.1`. Die optionale `use-application-builder`-Migration (esbuild) weiterhin **nicht** angewendet — `browser`-Builder läuft unter 19 weiter.

Gekoppelte Drittpakete mit-hochgezogen: **`@ng-bootstrap/ng-bootstrap` 17 → 18** (Peer `^18`), **`ngx-echarts` 18 → 19**, **`@angular-builders/jest` 18 → 19** (Test-Builder), **`angular-eslint` 18 → 19**. Locker gepinnte Libs (`ngx-color-picker` 17, `ngx-color` 8, `ag-grid-angular` 31, `@ngx-translate` 16, `ng2-*`) unverändert — Peers (`>=9/14`) decken 19 ab.

Begleitende Fixes (alle test-/build-seitig, kein Feature-Verhalten):
- **`standalone:false` ergänzt** an `MainComponent` (Bootstrap) + `OrderByPipe` — in Angular 19 ist `standalone` Default `true`; als NgModule-`declarations`-Mitglieder müssen sie explizit opt-out. (Die automatische standalone-Migration schlug an einer tsconfig-Pfad-Eigenheit des Jest-Builders fehl → manuell nachgezogen.) Dazu `@angular-eslint/prefer-standalone` (in v19 als Error) auf `warn` gestellt — die App behält bewusst ein NgModule.
- **`data-exchange.service.ts`**: fehlendes `return false;` in einem `.some()`-Callback ergänzt (TS 5.8 erkennt `noImplicitReturns` jetzt strenger).
- **`tsconfig.json`**: `skipLibCheck: true` (echarts-`.d.ts` nutzt `export =`, unter TS 5.8 sonst `TS1203`).
- **`angular.json`**: `anyComponentStyle maximumError` 280 → 300 kB (eine vorbestehend übergroße Komponenten-CSS war unter 18 nur Warnung, unter 19 Error).
- **Test-Infra (Angular-19-spezifisch):** `@angular-builders/jest 19` initialisiert das Zone-Test-Env jetzt selbst (eingebautes `setup.js` mit `setupZoneTestEnv()`) → die alte Zeile `import "jest-preset-angular/setup-jest"` aus `setup-jest.ts` entfernt (sonst Doppel-Init „Cannot set base providers"). Außerdem `isolatedModules: true` in `tsconfig.spec.json`: der Bundler-Build und ts-jest können CJS-Interop nicht für jedes Muster gleichzeitig per tsconfig-Flag abbilden (`import * as shp from 'shpjs'; shp(...)` ist über den Bundler aufrufbar, unter `esModuleInterop`+TS5.8 aber `TS2349`) → ts-jest transpiliert nur, Typprüfung übernimmt vollständig der Produktions-Build.

Ergebnis: `npm run build` **EXIT 0**, `tsc -p tsconfig.app.json` **EXIT 0**, `npm test` **70 passed / 1 skipped / 0 failed**, `npm run lint` **0 errors** (4865 warnings, +2 prefer-standalone als Ratchet-Backlog). `ng version` zeigt 19.2.x.

> **Offen:** Angular 20 (analoges Vorgehen), die optionale esbuild-`use-application-builder`-Migration, sowie Live-Visual-QA (weiterhin durch Keycloak-`localhost`-Redirect eingeschränkt).

---

## Prio 5 — Backup- und Altdateien aus dem Repo entfernen

**Problem:** `app/config/` enthält acht `*_backup*`-Dateien (`env_backup.js/.ts/.js.map`, `keycloak_backup.json`, `filter-config_backup.json`, `controls-config_backup.json`, `landingPage_backup.html`, …) und `config-storage-server.json_old`. In `customizedExternalLibs/` liegen `leaflet-groupedlayercontrol_old/`, `leaflet-wfst.src_custom_old.js`. Diese Dateien enthalten Konfigurations-/Secret-Platzhalter.

**Achtung:** Vier davon werden zur Laufzeit geladen und sind bewusst Teil des Deployments: `keycloak_backup.json` (Fallback in `keycloak-helper.service.ts`), `env_backup.js` sowie die beiden `*_forAdminViewExplanation.txt` (Beispiel-Anzeige in den Admin-Config-Views). Diese nicht löschen, sondern umbenennen (z. B. `*.example.*`) und die Referenzen sowie die Assets-Liste in `angular.json` anpassen.

**Maßnahme:** Den Rest löschen — die Historie liegt in Git. Beispiel-Konfigurationen, die bewusst dokumentiert bleiben sollen, in `documentation/` bzw. als `*.example.json` führen und in `.gitignore`/Assets-Ausschluss aufnehmen.

**Aufwand: S** — **Nutzen: mittel**

**Status (2026-06-15, Löschungen erledigt):** Gelöscht (keine lebenden Referenzen): `app/config/config-storage-server.json_old`, `env_backup.js.map`, `env_backup.ts`, `controls-config_backup.json`, `filter-config_backup.json`, `keycloak_backup_withComments.txt`, `landingPage_backup.html` sowie `customizedExternalLibs/leaflet-groupedlayercontrol_old/` und `leaflet-wfst.src_custom_old.js`. Build danach grün.

Wichtige Korrektur zur Annahme oben: `controls-config_backup.json` und `filter-config_backup.json` sind **keine** Runtime-Fallbacks — der `catch`-Block in `startup.service.ts` lädt keine lokale Backup-Datei nach (die Log-Meldung „Using local backup defaults" ist irreführend), sie wurden nur noch im toten `app/dependencies/app.bundle.js` (Prio 3) referenziert.

Bewusst behalten (echte Runtime-Fallbacks, in `angular.json` assets): `keycloak_backup.json` (Fallback in `keycloak-helper.service.ts`), `env_backup.js` (geladen in `admin-app-config.component.ts`), beide `*_forAdminViewExplanation.txt` (Admin-Config-Views) sowie `config-storage-server.json` (startup).

> **TODO — offen:** Das im Maßnahme-Text vorgeschlagene Umbenennen der behaltenen Fallbacks nach `*.example.*` ist **noch nicht** erfolgt (ändert ausgelieferte Asset-Dateinamen + Referenzen in 3 Komponenten + `angular.json`; Namens-/Deployment-Entscheidung offen).

---

## Prio 6 — Test-Setup lauffähig machen

**Problem:** Es existieren 73 `*.spec.ts`-Dateien und ein `test`-Target in `angular.json` (Karma-Builder), aber: kein `test`-Script in `package.json`, Karma/Jasmine sind nicht installiert (nur `@types/jasmine`), und das Test-Target referenziert `app/app.css` statt `app/app.scss`. Die Tests sind also nicht ausführbar — geschriebene Tests verrotten.

**Maßnahme:** Entweder Karma-Stack nachinstallieren oder (empfohlen, da Karma deprecated ist) auf Jest bzw. den ab Angular 17+ verfügbaren Web-Test-Runner umstellen, `npm test`-Script ergänzen, Test-Target korrigieren und die 73 Specs einmal grün ziehen. Anschließend in CI verankern.

**Aufwand: M** — **Nutzen: hoch** (Sicherheitsnetz für Upgrade in Prio 4 und Refactorings in Prio 7)

**Status (2026-06-15, Bestandsaufnahme — zurückgestellt bis nach Prio 4):** Test-Infrastruktur faktisch nicht vorhanden — kein Runner installiert (kein Karma/Jasmine/Jest), **`tsconfig.spec.json` fehlt** (obwohl `angular.json` darauf verweist), kein `karma.conf.js`/`test.ts`, kein `test`-Script, Test-Target referenziert die nicht existierende `app/app.css`. Vor allem: **alle 73 Specs sind leere Auto-Stubs** (`ng generate`-Boilerplate, je ~19 Zeilen, 0 echte Testlogik; 32 Service-Stubs `should be created`, 41 Komponenten-Stubs `should create`).

Konsequenz für die Reihenfolge: Das in der Doc genannte „Sicherheitsnetz vor Prio 4" greift hier nicht — es gibt kein schützenswertes Netz, nur Stubs. Die 41 Komponenten-Stubs müssen ohnehin überarbeitet werden (sie deklarieren die Komponente ohne ihre Abhängigkeiten und würden so fehlschlagen).

**Status (2026-06-16, erledigt — Runner lauffähig + tragfähige grüne Baseline):**

Runner-Entscheidung: **`@angular-builders/jest`** (Jest 29 + `jest-preset-angular`, jsdom → kein Browser, CI-freundlich). Die in der ursprünglichen Maßnahme angedachten **First-Party-Runner (`@angular-devkit/build-angular:jest` / `web-test-runner`) wurden verworfen** — Angular hat beide am 25.02.2026 aus der CLI **entfernt** (in 18.2.x noch vorhanden, aber Upstream gelöscht → Sackgasse, würde das spätere Upgrade auf Angular 19/20 blockieren). Zudem hätte der First-Party-Jest-Builder die `use-application-builder`-Migration (esbuild) erzwungen; `@angular-builders/jest` läuft unabhängig von der Build-Pipeline, daher **esbuild-Migration weiterhin aufgeschoben** und der `browser`-Build unverändert.

Umgesetzt:
- Neu: `jest.config.js` (Root; `moduleDirectories` für die `baseUrl: ./app`-Imports ohne `paths`, `testEnvironment: jsdom`), `setup-jest.ts` (Root; `jest-preset-angular/setup-jest` + globaler `window.__env`-Stub, da EnvConfigService/StartupService ihn transitiv brauchen), `app/testing/test-providers.ts` (gemeinsame Helper).
- `angular.json` `test`-Target auf `@angular-builders/jest:run` umgestellt (Karma-Builder + kaputter `app/app.css`-Styles-Eintrag raus; `tsConfig`/`configPath` zeigen via `../` auf den Workspace-Root, da der Builder projekt-root-relativ (`app/`) auflöst).
- `tsconfig.spec.json` `types: ["jasmine"]` → `["jest","node","jquery"]`; `@types/jasmine` aus devDeps entfernt.
- Scripts: `test` / `test:watch` / `test:coverage`.
- **Stub-Sanierung (Sammelrezept):** Service-Specs → `providers: [provideHttpClient(), provideHttpClientTesting()]` (+ `provideRouter([])` bei ActivatedRoute). Komponenten-Specs → `declarations:` → `imports:` (alle Komponenten sind *standalone*), Standard-Provider + `NO_ERRORS_SCHEMA`, und `fixture.detectChanges()` entfernt (vermeidet ngOnInit-Crashes durch ungebundene `@Input()`s).
- Gelöscht: `app/services/test.service.ts` (+Spec) — totes Relikt, importierte nicht-existierendes `app-upgraded-providers`; und `admin-landingpage-config.component.spec.ts` — die Quell-Komponente ist totes, kaputtes Code (importiert nicht-existierendes `PipesModule`, wird nirgends referenziert → deshalb stört es den AOT-Build nicht).

Ergebnis (Baseline 2026-06-16): **`npm test` grün (Exit 0): 42 passed, 29 skipped, 0 failed** (71 Suites). `npm run build` und `npm run lint` weiterhin grün. *(Aktualisiert nach Cluster-6-Aufarbeitung, siehe Status-Block unten: jetzt 46 passed / 25 skipped.)*

Die **29 Skips** sind bewusst (`describe.skip` + `// TODO(prio6):`-Grund) — sie scheitern an jsdom-/Umgebungs-Grenzen, nicht an den Stubs. Cluster:
1. **ECharts** (Canvas `getContext` / untransformiertes ESM): ~10 Suites (kommonitorDiagrams, indicatorRadar, kommonitorBalance, regressionDiagram, admin.component, reporting-overview/-modal, indicator-add, generate-report …). → **erledigt** (alle entskippt; eigentlicher Blocker war nicht ESM/echarts, sondern `getComputedStyle(#fontFamily-reference)` — siehe Status-Block unten).
2. **shpjs `TextDecoder` not defined** in jsdom: file-helper, sidebar, kommonitorDataImport. → **erledigt** (file-helper + kommonitorDataImport entskippt; sidebar zu Cluster 1 umgehängt — siehe Status-Block unten).
3. **`structuredClone` not defined**: reporting, templateSelect, workflowSelect. → **erledigt** (alle drei entskippt, Status-Block unten).
4. **`indexedDB` not defined**: leaflet-screenshot-cache, generate-report. → **erledigt** (beide entskippt, Status-Block unten).
5. **Legacy/Deep-DI**: reachability-coverage-reports (hängt an AngularJS-Service `kommonitorReachabilityCoverageReportsHelperService`), poi, user-interface (12 Deps). → **erledigt** (alle 7 entskippt; Blocker waren großteils schon durch frühere Hebel weg — siehe Status-Block unten).
6. **Vorbestehende TS-Fehler in App-Source** (von ts-jest gemeldet, im AOT-Build offenbar maskiert — verifizieren!): `visual-style-helper.service.ts` (classybrew `colors`/`manualBrew`-Typing) blockiert transitiv ~7 Suites (kommonitorClassification, kommonitorLegend, Reachability-Subtree, kommonitorMap); `reachability-indicator-statistics.component.ts` (`pipedData` fehlt auf `ReachabilityScenarioHelperService`). → **Cluster 6 aufgearbeitet, siehe Status-Block unten.**

> **Folgearbeit (inkrementell, je TODO(prio6)):** Skips in echte Tests überführen. Günstige zentrale Hebel, die ganze Cluster auf einmal freischalten: `jest-canvas-mock` (Cluster 1), `structuredClone`/`TextDecoder`-Polyfills in `setup-jest.ts` (Cluster 2+3), `fake-indexeddb` (Cluster 4), echarts in `transformIgnorePatterns`. Cluster 6 zuerst klären — sind das echte latente Typfehler? Die toten Quell-Dateien (`admin-landingpage-config.component.ts` + `PipesModule`-Referenz) separat entfernen.
> **CI-Verankerung** von `npm test` steht noch aus (gehört zu Prio 8).

**Status (2026-06-16, Cluster 6 verifiziert + gefixt + entskippt):** Die offene „verifizieren!"-Frage ist beantwortet — **keiner** der beiden Cluster-6-Befunde ist ein echter Produktions-Bug:

- **`visual-style-helper.service.ts` (`colors`/`colorSchemes`) — Typ-Artefakt, kein Bug.** Der Build (`tsc -p tsconfig.app.json`, `npm run build`) ist grün. Die Vendored-Lib `customizedExternalLibs/classyBrew.js` (untypisiert, `module.exports = classyBrew`) wird via `import * as classyBrew` geladen. Unter der Build-Config (`allowJs` ungesetzt = `false`) ist der Import `any` → `.colors`/`.colorSchemes` checken sauber. Unter ts-jest (jest-preset-angular transformiert/analysiert auch `.js`) bekommt die Instanz einen zu engen Typ **ohne** das zur Laufzeit extern zugewiesene `.colors` → `TS2339`. Reine Config-Divergenz. **Fix:** `createNewClassyBrewInstance(): any` + `new (classyBrew as any)()` — build- und ts-jest-konsistent, rein additiv.
- **`reachability-indicator-statistics.component.ts` (`pipedData`) — echter Typ-Mismatch, aber in totem Code.** `ReachabilityScenarioHelperService` hat weder `pipedData` noch `configureActiveScenario` (alle Methoden auskommentierte Stubs). Die Komponente ist **nicht eingebunden**: `<app-reachability-indicator-statistics>` ist im einzigen Template auskommentiert (`reachability-scenario-modal.component.html:165`), und die Klasse steht in keinem `imports:`-Array → AOT kompiliert sie nie → Build bleibt grün. **Entscheidung (Nutzer):** als unfertige Migrationsreferenz behalten (vgl. Prio-2-TODO); Spec bleibt geskippt, `TODO(prio6)`-Begründung präzisiert.

**Entskippt (Cluster 6 → echte Tests):** `visual-style-helper.service.spec`, `kommonitor-classification`, `kommonitor-legend`, `kommonitor-map`. Dafür drei zentrale Test-Env-Hebel ergänzt (test-only, Build unberührt):
- `tsconfig.spec.json`: **`esModuleInterop: true`** — ts-jest braucht es für CJS-Default-Interop (`import L from 'leaflet'` wäre sonst `undefined`); esbuild-Build macht das selbst.
- `setup-jest.ts`: **`jest-canvas-mock`** (Canvas `getContext` für Leaflet/ECharts) + **`TextEncoder`/`TextDecoder`-Polyfill** aus `util` (Cluster-2-Hebel).
- `jest.config.js`: **`transformIgnorePatterns`** um `leaflet-geosearch` (ESM-only) erweitert.

Ergebnis: **`npm test` grün: 46 passed, 25 skipped, 0 failed** (71 Suites); `tsc -p tsconfig.app.json`, `npm run build`, `npm run lint` weiterhin grün, keine Regression. Die ergänzten Hebel (`jest-canvas-mock`, `TextDecoder`, `transformIgnorePatterns`) senken den Aufwand für die verbleibenden Cluster 1–4 in der Folgearbeit.

**Status (2026-06-16, Cluster 2 + 3 + 4 entskippt):** Mit zwei weiteren zentralen Hebeln in `setup-jest.ts` (test-only, Build unberührt) **7 von 8** Ziel-Suites in echte Tests überführt:
- **`structuredClone`-Polyfill** (Cluster 3) — jest-jsdom liefert es nicht (Node-Global im Sandbox unsichtbar); dependency-frei über V8-Strukturklon (`v8.deserialize(v8.serialize(x))`, erhält Dates/Maps/Sets/TypedArrays).
- **`fake-indexeddb/auto`** (Cluster 4, neue devDependency) — setzt globales `indexedDB` für `leaflet-screenshot-cache-helper.service` (ruft `indexedDB.open` im Konstruktor).
- **`window.__env`-Stub erweitert** um `enabledGeoresourcesInfrastructure`/`enabledGeoresourcesGeoservices` (`[]`, `GeoresourceFilterService` ruft `.indexOf`) und `targetUrlToGeocoderService` (`GeocoderHelperService` ruft `.split("nominatim")`).

Entskippt & grün: `file-helper.service`, `kommonitor-data-import` (Cluster 2); `reporting.service`, `template-select`, `workflow-select` (Cluster 3); `leaflet-screenshot-cache-helper.service`, `generate-report` (Cluster 4).

> **`sidebar.component` bleibt geskippt — neu zugeordnet zu Cluster 1.** Der `TextDecoder`-Blocker ist behoben, aber `SidebarComponent` injiziert `DiagramHelperServiceService`, dessen Konstruktor `getComputedStyle(document.querySelector('#fontFamily-reference'))` aufruft — Element fehlt in jsdom → wirft. Gehört damit zum ECharts/Diagram-Cluster (1), nicht 2–4. `TODO(prio6)`-Begründung entsprechend korrigiert.

Ergebnis: **`npm test` grün: 53 passed, 18 skipped, 0 failed** (71 Suites); `tsc -p tsconfig.app.json`, `npm run build`, `npm run lint` weiterhin grün, keine Regression. Verbleibende Skips: Cluster 1 (ECharts/Diagram, inkl. sidebar) und Cluster 5 (Legacy/Deep-DI: poi, user-interface, reachability-coverage-reports + Reachability-Subtree).

**Status (2026-06-16, Cluster 1 (ECharts/Diagram) entskippt):** Alle **10** Ziel-Suites in echte Tests überführt. Der eigentliche Blocker war **nicht** primär ECharts/Canvas, sondern zwei separate Punkte:
- **`getComputedStyle(#fontFamily-reference)` warf.** `DiagramHelperServiceService` hat den Feld-Initialisierer `customFontFamily = this.setCustomFontFamily()`, der `getComputedStyle(document.querySelector('#fontFamily-reference'))` aufruft — Element fehlt in jsdom → `getComputedStyle(null)` wirft. Erster Crash für **alle** Specs, die den Service (transitiv) injizieren. **Hebel:** in `setup-jest.ts` ein `<div id="fontFamily-reference">` an `document.body` anhängen.
- **ESM-Module, die jest nicht transformierte:** `echarts/core` (nur `admin` via `admin-dashboard-management` + `provideEchartsCore`) und **`d3` v7** (ESM-only, `reporting-overview`/`indicator-add` via `import * as d3 from 'd3'`; `reporting-modal` transitiv). Das gängige `import * as echarts from 'echarts'` (UMD-Main) lud dagegen ohne Eingriff. **Hebel:** `echarts`/`zrender` in `transformIgnorePatterns` aufgenommen; `d3` per `moduleNameMapper` auf den vorgebauten UMD-Bundle `node_modules/d3/dist/d3.js` gemappt (statt die große d3-ESM-Familie zu transformieren).

Entskippt & grün: `diagram-helper-service`, `kommonitor-diagrams`, `indicator-radar`, `kommonitor-balance`, `regression-diagram`, `admin.component`, `reporting-overview`, `reporting-modal`, `indicator-add`, `sidebar`.

Ergebnis: **`npm test` grün: 63 passed, 8 skipped, 0 failed** (71 Suites); `tsc -p tsconfig.app.json`, `npm run build`, `npm run lint` weiterhin grün, keine Regression (auch die zuvor grünen UMD-echarts-Specs bleiben grün). **Verbleibende 8 Skips = Cluster 5** (Legacy/Deep-DI): `reachability-coverage-reports` (AngularJS-Service), `poi`, `user-interface` (12 Deps) sowie der Reachability-Subtree (`kommonitor-reachability`, `reachability-scenario-modal`/-`configuration`/-`poi-in-iso`) und die bewusst behaltene `reachability-indicator-statistics` (Referenz, vgl. Cluster 6).

**Status (2026-06-16, Cluster 5 (Legacy/Deep-DI) entskippt):** **7 von 8** Suites in echte Tests überführt — **ohne** neue zentrale Hebel. Erkenntnis: die `TODO(prio6)`-Begründungen waren veraltet; die Blocker waren großteils schon durch frühere Runden weg:
- Die 4 Reachability-Komponenten + `poi` nannten `visual-style-helper` (Typ-Fix Cluster 6), Leaflet/geosearch (Cluster-6-Transform + canvas-mock), `DiagramHelperServiceService`/`#fontFamily-reference` (Cluster 1) bzw. `GeoresourceFilterService`/`enabledGeoresourcesInfrastructure` (`window.__env`-Stub aus Cluster 2–4). Alle erledigt → nach Entskippen grün.
- **`reachability-coverage-reports-helper.service`**: injiziert den Legacy-AngularJS-Token `@Inject('kommonitorReachabilityCoverageReportsHelperService')` (kein Provider im migrierten Stand — wie viele tote AngularJS-Bridge-Tokens). Im Spec ein Unit-Test-Double `{ provide: '…', useValue: {} }` ergänzt → grün. (Verdeckt keinen echten Bug: der Token ist auch zur Laufzeit nicht verdrahtet.)
- **`user-interface`** (12 Deps): degenerierter Stub (`createComponent(null)`) durch das Standard-Rezept ersetzt → grün (Konstruktor-Smoke-Test, kein `detectChanges()`).

Entskippt & grün: `reachability-coverage-reports-helper.service`, `poi`, `kommonitor-reachability`, `reachability-scenario-modal`, `reachability-scenario-configuration`, `reachability-poi-in-iso`, `user-interface`.

Ergebnis: **`npm test` grün: 70 passed, 1 skipped, 0 failed** (71 Suites); `tsc -p tsconfig.app.json`, `npm run build`, `npm run lint` weiterhin grün, keine Regression. **Einziger verbleibender Skip:** die bewusst behaltene tote Referenz `reachability-indicator-statistics` (vgl. Cluster 6). Damit ist die Prio-6-Skip-Sanierung abgeschlossen — es bleibt nur noch die **CI-Verankerung** von `npm test`/`lint` (gehört zu Prio 8).

---

## Prio 7 — God-Services aufteilen

**Problem:** Einzelne Services sind extrem groß und bündeln zu viele Verantwortlichkeiten, v. a. `kommonitorDataGridHelperService` (~4.300 Zeilen) und `kommonitorDataExchangeService` (~3.500 Zeilen). Sie sind zentrale Abhängigkeit fast aller Komponenten und damit Änderungs-Hotspots.

**Maßnahme:** Inkrementell entlang von Verantwortlichkeiten aufteilen (z. B. Grid-Konfiguration vs. Datenaufbereitung vs. Export; Daten-Cache vs. API-Zugriff vs. UI-State). Kein Big Bang — bei jeder ohnehin anstehenden Änderung den betroffenen Teil herauslösen. Tests aus Prio 6 als Absicherung.

**Aufwand: L (inkrementell)** — **Nutzen: mittel–hoch**

---

## Prio 8 — Code-Hygiene und Tooling

**Problem & Maßnahmen:**
- **`console.log`-Aufrufe (~240 in 67 Dateien):** durch einen schlanken Logging-Service mit Log-Leveln ersetzen bzw. ersatzlos streichen. Lint-Regel `no-console` ist seit dem ESLint-Setup als **`warn`** aktiv (sichtbarer Backlog) — Ziel: später auf `error` hochziehen.
- ~~**Kein modernes Linting:** Nur eine minimale `jshintConfig` in `package.json`. ESLint (`@angular-eslint`) + Prettier einführen, zunächst mit mildem Regelsatz, in CI prüfen.~~ ✅ erledigt (2026-06-15): ESLint (`angular-eslint` 18 + `typescript-eslint`, Flat-Config in `eslint.config.js`) und Prettier (`.prettierrc.json` + `.prettierignore`, `eslint-config-prettier` gegen Regelkonflikte) eingerichtet; Scripts `lint`/`lint:fix`/`format`/`format:check`. **Bewusst milder Einstieg:** `tseslint.stylistic` weggelassen, viele rauscharme/Legacy-getriebene Regeln auf `warn`/`off`, sodass `ng lint` **grün** läuft (0 errors, ~4865 warnings als Ratchet-Backlog). **Wichtig:** ein `eslint --fix`-Massenlauf wurde **verworfen** — der `prefer-const`-Fixer schrieb `let x = []` zu `const x = []` um und brach den Build (TS leitet bei den `noImplicitAny:off`-„evolving-any"-Arrays dann `never[]` ab). Daher kein Auto-Fix angewandt; `var`/`const` bleiben vorerst Warnungen. Build + Lint danach grün. **Erste Ratchet-Kandidaten** (echte Funde, aktuell als Warnung): `no-debugger`, `no-dupe-else-if`, `no-self-assign`, `no-constant-binary-expression`.
- **CI-Verankerung des Lint-Laufs** steht noch aus.
- **Große auskommentierte Codeblöcke** (mehrere tausend Zeilen verteilt über die Codebasis, u. a. Hybrid-Bootstrap-Reste): löschen statt kommentieren — Git kennt die Historie.
- ~~**Doppelte/veraltete Dependencies:** `shp-write` **und** `@mapbox/shp-write` (eins reicht), `js-xlsx` 0.8 (uralt; durch aktuelles `xlsx`/SheetJS oder das schon vorhandene `papaparse`+`exceljs`-Äquivalent ersetzen), `bootstrap-tour` (unmaintained, jQuery-basiert), `fastclick` und `jquery-slimscroll` (für moderne Browser obsolet, stammen aus AdminLTE-2-Zeiten).~~ ✅ erledigt (2026-06-15): 7 verifiziert ungenutzte Deps aus `package.json` entfernt — `shp-write` (wir nutzen `@mapbox/shp-write` in `kommonitor-legend`), `js-xlsx`, `bootstrap-tour`, `fastclick`, `jquery-slimscroll` sowie zusätzlich `slimscroll` (zweite AdminLTE-2-Scroll-Lib) und `tableexport` (nirgends importiert, verlangte ein gar nicht installiertes `xlsx`-Modul). Außerdem die verwaiste vendored Kopie `customizedExternalLibs/shpwrite.js` gelöscht. Keiner der Treffer war im Quellcode/`index.html`/`angular.json` referenziert (nur in `package.json` + auto-generierter `ThirdParty.json`); `npm install --force` + Build danach grün, Bundle-Hash unverändert.
- **Verbliebene `console.log` und das fehlende Linting** bleiben offen — sinnvoller nächster Schritt: ESLint (`@angular-eslint`) + Prettier mit `no-console` als Fundament vor den God-Service-Refactors (Prio 7).

**Aufwand: S–M (gut parallelisierbar)** — **Nutzen: mittel**

---

## Prio 9 — Konfiguration & i18n konsolidieren

**Problem & Maßnahmen:**
- Der Runtime-Config-Mechanismus ist sauber angelegt (`app/services/startup-service/startup.service.ts` befüllt `window.__env`, `app/services/env-config-service/env-config.service.ts` kapselt den Zugriff) — aber es gibt noch direkte `window.__env`-Zugriffe außerhalb des Services. Diese auf `EnvConfigService` umstellen, damit Konfigzugriffe typisiert und testbar sind.
- i18n ist mit `@ngx-translate` angelegt, aber nicht konsequent genutzt; in Konfigurationen und Templates stehen hartkodierte deutsche Labels. Sukzessive in die Übersetzungsdateien überführen — spätestens wenn eine zweite Sprache real gebraucht wird.

**Aufwand: M (inkrementell)** — **Nutzen: mittel**

---

## Empfohlene Reihenfolge

1. ~~**Sofort, geringer Aufwand:** Prio 5 (Backups löschen).~~ ✅ erledigt (2026-06-15)
2. ~~**Als Nächstes:** Prio 2 + 3 (AngularJS- und Webpack-Altlasten) — ein Aufräum-PR.~~ ✅ erledigt (2026-06-15; Prio 2 bis auf bewusst behaltenes AngularJS-TODO)
3. ~~**Dann:** Prio 4 (Angular-Upgrade 16 → 17 → 18).~~ ✅ erledigt (2026-06-15, bis Angular 18). *Reihenfolge gegenüber dem ursprünglichen Plan getauscht:* Prio 6 wird **nach** Prio 4 gemacht, weil die 73 Specs nur leere Stubs sind (kein Schutznetz vorhanden) und die modernen First-Party-Test-Runner erst ab Angular 17+ verfügbar sind (siehe Status unter Prio 6).
4. ~~**Als Nächstes:** Prio 6 (Tests lauffähig).~~ ✅ erledigt (2026-06-16) mit **`@angular-builders/jest`** (nicht dem First-Party-Builder — der wurde Upstream entfernt; siehe Status unter Prio 6). `npm test` grün: 42 passed / 29 skipped / 0 failed.
5. **Laufend/inkrementell:** Prio 7, 8, 9 im Zuge regulärer Feature-Arbeit; dazu die Prio-6-Skips schrittweise in echte Tests überführen.
