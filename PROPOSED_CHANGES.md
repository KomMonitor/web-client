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

**Status (2026-06-15, bewusst zurückgestellt — erst nach Prio 4):** Bestandsaufnahme ergab: Test-Infrastruktur faktisch nicht vorhanden — kein Runner installiert (kein Karma/Jasmine/Jest), **`tsconfig.spec.json` fehlt** (obwohl `angular.json` darauf verweist), kein `karma.conf.js`/`test.ts`, kein `test`-Script, Test-Target referenziert die nicht existierende `app/app.css`. Vor allem: **alle 73 Specs sind leere Auto-Stubs** (`ng generate`-Boilerplate, je ~19 Zeilen, 0 echte Testlogik; 32 Service-Stubs `should be created`, 41 Komponenten-Stubs `should create`).

Konsequenz für die Reihenfolge: Das in der Doc genannte „Sicherheitsnetz vor Prio 4" greift hier nicht — es gibt kein schützenswertes Netz, nur Stubs. Gleichzeitig sind die modernen First-Party-Runner (esbuild/Web-Test-Runner bzw. Jest-Builder) erst **ab Angular 17+** verfügbar. Daher Entscheidung: Test-Setup **nach Prio 4** aufsetzen und dann direkt mit dem First-Party-Runner (kein Karma-Wegwerf-Setup). Die 41 Komponenten-Stubs müssen dabei ohnehin überarbeitet werden (sie deklarieren die Komponente ohne ihre Abhängigkeiten und würden so fehlschlagen).

---

## Prio 7 — God-Services aufteilen

**Problem:** Einzelne Services sind extrem groß und bündeln zu viele Verantwortlichkeiten, v. a. `kommonitorDataGridHelperService` (~4.300 Zeilen) und `kommonitorDataExchangeService` (~3.500 Zeilen). Sie sind zentrale Abhängigkeit fast aller Komponenten und damit Änderungs-Hotspots.

**Maßnahme:** Inkrementell entlang von Verantwortlichkeiten aufteilen (z. B. Grid-Konfiguration vs. Datenaufbereitung vs. Export; Daten-Cache vs. API-Zugriff vs. UI-State). Kein Big Bang — bei jeder ohnehin anstehenden Änderung den betroffenen Teil herauslösen. Tests aus Prio 6 als Absicherung.

**Aufwand: L (inkrementell)** — **Nutzen: mittel–hoch**

---

## Prio 8 — Code-Hygiene und Tooling

**Problem & Maßnahmen:**
- **407 `console.log`-Aufrufe in 108 Dateien:** durch einen schlanken Logging-Service mit Log-Leveln ersetzen bzw. ersatzlos streichen; per Lint-Regel (`no-console`) dauerhaft verhindern.
- **Kein modernes Linting:** Nur eine minimale `jshintConfig` in `package.json`. ESLint (`@angular-eslint`) + Prettier einführen, zunächst mit mildem Regelsatz, in CI prüfen.
- **Große auskommentierte Codeblöcke** (mehrere tausend Zeilen verteilt über die Codebasis, u. a. Hybrid-Bootstrap-Reste): löschen statt kommentieren — Git kennt die Historie.
- **Doppelte/veraltete Dependencies:** `shp-write` **und** `@mapbox/shp-write` (eins reicht), `js-xlsx` 0.8 (uralt; durch aktuelles `xlsx`/SheetJS oder das schon vorhandene `papaparse`+`exceljs`-Äquivalent ersetzen), `bootstrap-tour` (unmaintained, jQuery-basiert), `fastclick` und `jquery-slimscroll` (für moderne Browser obsolet, stammen aus AdminLTE-2-Zeiten).

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
3. **Dann:** Prio 4 (Angular-Upgrade 16 → 17 → 18). *Reihenfolge gegenüber dem ursprünglichen Plan getauscht:* Prio 6 wird **nach** Prio 4 gemacht, weil die 73 Specs nur leere Stubs sind (kein Schutznetz vorhanden) und die modernen First-Party-Test-Runner erst ab Angular 17+ verfügbar sind (siehe Status unter Prio 6).
4. **Danach:** Prio 6 (Tests lauffähig) mit dem dann verfügbaren First-Party-Runner.
5. **Laufend/inkrementell:** Prio 7, 8, 9 im Zuge regulärer Feature-Arbeit.
