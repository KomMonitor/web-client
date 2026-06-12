# Vorschläge für die sinnvollsten Änderungen am KomMonitor Web-Client

Stand: 2026-06-12, Branch `feature/migration-bootstrap`.
Analysebasis: Codebestand, `angular.json`, `webpack.config.js`, `package.json`, `dist/`-Output, Git-Historie.

**Gesamtbild:** Die Migration AngularJS → Angular 16 ist faktisch durch — `app/main.ts` bootstrappt rein Angular, es gibt kein aktives ngUpgrade mehr, und die verbliebenen ~38 AngularJS-Komponenten werden von der laufenden App gar nicht mehr geladen. Die größten Hebel sind jetzt: Altlasten konsequent entfernen, den Build-Output reparieren (aktuell wird der komplette Quellcode mit ausgeliefert) und das EOL-Framework anheben.

---

## Prio 1 — Build-Output reparieren: Quellcode wird mit ausgeliefert

**Problem:** In `angular.json` ist der gesamte App-Ordner als Asset deklariert:

```json
"assets": ["app/", "app/assets/"]
```

Dadurch landet bei jedem Build der komplette Quellbaum im `dist/`-Ordner — nachweisbar im aktuellen `dist/kommonitor-client/`: alle `.ts`-Quelldateien (z. B. `components/ngComponents/admin/admin.component.ts`), die Backup-Konfigurationen (`config/env_backup.ts` inkl. des Platzhalter-Secrets `password: "password"`) und der 56 MB große, ungenutzte `app/dependencies/`-Ordner.

**Folgen:** Quellcode-Offenlegung im Produktiv-Deployment, potenziell sensible Konfigurationsreste öffentlich, massiv aufgeblähtes Image.

**Maßnahme:** Assets-Liste auf das tatsächlich Benötigte eingrenzen (`app/assets/`, `app/config/` nur mit den Runtime-Configs, Favicon, ggf. Übersetzungsdateien). Anschließend `dist/` einmal neu bauen und prüfen, dass keine `.ts`/`.js`-Quellen mehr enthalten sind.

**Aufwand: S** (eine Konfigurationsänderung + Smoke-Test) — **Nutzen: sehr hoch**

---

## Prio 2 — AngularJS-Altlasten vollständig entfernen

**Problem:** Es existieren noch 38 `*.component.js` und 65 `*.module.js` aus der AngularJS-Welt (u. a. `app/components/kommonitorAdmin/adminRoleManagement/`, `adminScriptManagement/`, `app/components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/`) sowie `app/app.js` als alter App-Einstieg. Nichts davon wird noch geladen: `app/index.html` bindet keine Skripte ein, `angular.json` lädt nur jQuery/Bootstrap, ngUpgrade ist nirgends aktiv. Für RoleManagement, ScriptManagement und Reachability existieren bereits fertige Angular-Pendants unter `app/components/ngComponents/`.

**Maßnahme:**
1. Vorher prüfen, ob zwei Features ohne Angular-Pendant noch gebraucht werden: `feedbackModal` und `kommonitorIndividualIndicatorComputation` (beide unter `app/components/kommonitorUserInterface/kommonitorControls/`). Falls ja → migrieren; falls nein → mit löschen.
2. Alle `*.component.js`/`*.module.js`, `app/app.js` und zugehörige AngularJS-Templates löschen.
3. Danach aus `package.json` entfernen: `angular`, `angular-route`, `angular-resource`, `angular-sanitize`, `angular-animations`, `angular-ui-bootstrap`, `angularjs-dropdown-multiselect`, `angular-legacy-sortablejs-maintained`, `ui-select`, `@angular/upgrade`, `babel-plugin-angularjs-annotate` sowie alle `@types/angular*`-Pakete.
4. Auskommentierten Hybrid-Code in `app/mainComponent/main/main.component.ts` entfernen.

**Aufwand: M** — **Nutzen: hoch** (kleinere Installation, kein toter Code mehr, der bei Suchen/Refactorings stört)

---

## Prio 3 — Webpack-Pipeline stilllegen

**Problem:** `webpack.config.js` baut noch `app/app.js` zu `app/dependencies/app.bundle.js` und kopiert ~96 Bibliotheks-Assets nach `app/dependencies/` (56 MB). Kein einziges Quell- oder Template-File referenziert `dependencies/` — der Output ist verwaist und wird über das Assets-Problem aus Prio 1 sogar mit deployt. Die benötigten Bibliotheken laufen längst über `angular.json` (`styles`/`scripts`) bzw. npm-Imports.

**Maßnahme:** `webpack.config.js`, `.babelrc`, den Ordner `app/dependencies/` und die zugehörigen devDependencies (`webpack`, `webpack-cli`, `copy-webpack-plugin`, alle `babel-*`-Pakete, `babel-polyfill`) entfernen. Falls einzelne Assets daraus doch noch gebraucht werden (z. B. Webfonts), gezielt in `angular.json` aufnehmen.

**Aufwand: S–M** — **Nutzen: hoch** (eine Build-Pipeline statt zwei, −56 MB Repo-/Deploy-Ballast)

---

## Prio 4 — Angular 16 (EOL) anheben

**Problem:** Angular 16 ist seit November 2024 End-of-Life — keine Security-Patches mehr. Auch `keycloak-js` 25 und weitere Pakete hängen daran.

**Maßnahme:** Schrittweises Upgrade über `ng update` (16 → 17 → 18, danach optional weiter). Sinnvoll **nach** Prio 2/3, weil dann `@angular/upgrade` und die AngularJS-Typings nicht mehr mitgezogen werden müssen. Bei der Gelegenheit `bootstrap` 5.2 → 5.3 prüfen (passt zu den aktuellen Bootstrap-Konfliktbereinigungen in `app/app.scss`).

**Aufwand: M–L** — **Nutzen: hoch** (Security-Support, Voraussetzung für alles Weitere)

---

## Prio 5 — Backup- und Altdateien aus dem Repo entfernen

**Problem:** `app/config/` enthält acht `*_backup*`-Dateien (`env_backup.js/.ts/.js.map`, `keycloak_backup.json`, `filter-config_backup.json`, `controls-config_backup.json`, `landingPage_backup.html`, …) und `config-storage-server.json_old`. In `customizedExternalLibs/` liegen `leaflet-groupedlayercontrol_old/`, `leaflet-wfst.src_custom_old.js`. Diese Dateien werden teils mit ausgeliefert (siehe Prio 1) und enthalten Konfigurations-/Secret-Platzhalter.

**Maßnahme:** Löschen — die Historie liegt in Git. Beispiel-Konfigurationen, die bewusst dokumentiert bleiben sollen, in `documentation/` bzw. als `*.example.json` führen und in `.gitignore`/Assets-Ausschluss aufnehmen.

**Aufwand: S** — **Nutzen: mittel**

---

## Prio 6 — Test-Setup lauffähig machen

**Problem:** Es existieren 73 `*.spec.ts`-Dateien und ein `test`-Target in `angular.json` (Karma-Builder), aber: kein `test`-Script in `package.json`, Karma/Jasmine sind nicht installiert (nur `@types/jasmine`), und das Test-Target referenziert `app/app.css` statt `app/app.scss`. Die Tests sind also nicht ausführbar — geschriebene Tests verrotten.

**Maßnahme:** Entweder Karma-Stack nachinstallieren oder (empfohlen, da Karma deprecated ist) auf Jest bzw. den ab Angular 17+ verfügbaren Web-Test-Runner umstellen, `npm test`-Script ergänzen, Test-Target korrigieren und die 73 Specs einmal grün ziehen. Anschließend in CI verankern.

**Aufwand: M** — **Nutzen: hoch** (Sicherheitsnetz für Upgrade in Prio 4 und Refactorings in Prio 7)

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

1. **Sofort, geringer Aufwand:** Prio 1 (Assets-Fix), Prio 5 (Backups löschen) — zusammen ein kleiner PR mit großem Effekt.
2. **Als Nächstes:** Prio 2 + 3 (AngularJS- und Webpack-Altlasten) — ein Aufräum-PR.
3. **Dann:** Prio 6 (Tests lauffähig) als Sicherheitsnetz, danach Prio 4 (Angular-Upgrade).
4. **Laufend/inkrementell:** Prio 7, 8, 9 im Zuge regulärer Feature-Arbeit.
