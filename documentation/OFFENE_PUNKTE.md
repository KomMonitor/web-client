# Offene Punkte — Stand nach Abschluss der Migration

Stand: 2026-08-26, Branch `feature/migration-bootstrap`.
Basis: Codebestand verifiziert gegen alle Dokumente in `documentation/` und `PROPOSED_CHANGES.md`.

**Ausgangslage:** Die AngularJS → Angular-Migration und der Modernisierungsplan aus
`PROPOSED_CHANGES.md` (Prio 2–7) sind durch. Der Baum ist grün:

| Gate                   | Ergebnis                                            |
| ---------------------- | --------------------------------------------------- |
| `npm test`             | 137 Suites / **752 Tests**, 0 failed, **0 skipped** |
| `npm run lint`         | **0 Errors**, 1280 Warnings                         |
| `npm run build`        | EXIT 0                                              |
| `npm run format:check` | **grün** (alle Dateien Prettier-konform)            |

Angular **21.2.17** / TypeScript **5.9**, standalone Bootstrap (`bootstrapApplication` +
`app.config.ts`, kein `AppModule`), Admin-Bereich vollständig lazy-loaded, `DataExchangeService`
vollständig aufgelöst (~70 fokussierte Services).

Die folgende Liste ist das, was danach noch offen ist — sortiert nach Nutzen.

---

## A. Funktionale Lücken

### A1. Zwei AngularJS-Features ohne Angular-Pendant

Unter `app/components/kommonitorUserInterface/kommonitorControls/` liegen noch 5 Legacy-Dateien
(~156 KB), die **nicht gebaut und nicht geladen** werden:

- `feedbackModal/` — im aktiven UI nur über einen auskommentierten Link referenziert.
- `kommonitorIndividualIndicatorComputation/` — „Interaktive parametrisierte Neuberechnung eines
  Indikators", in der README als Key-Feature gelistet, im aktiven Code nicht eingebunden.

Beide referenzieren Services, die es nicht mehr gibt (`kommonitorDataExchangeService`), sind also
nicht 1:1 portierbar. **Entscheidung nötig:** migrieren oder löschen. Erst danach ist Prio 2 aus
`PROPOSED_CHANGES.md` wirklich abgeschlossen.

### A2. Zeitreihen-Mapping des Indikator-Imports — ✅ behoben (2026-08-26)

Der Migrationsbranch hatte den Zeitreihen-Editor des Indikator-Imports verloren: die AngularJS-Komponente
`indicatorEditTimeseriesMapping` wurde am 2026-06-15 (`39862b75`) gelöscht, ohne portiert zu werden. Im
Angular-Modal war sie nur noch als `<!-- todo -->` auskommentiert, `timeseriesMappingReference` wurde
allein von einem Broadcast **ohne Sender** gefüllt, und das Submit-Gate hatte die entsprechende Klausel
verloren. Folge: **der Einzel-Indikator-Import schickte immer `timeseriesMappings: []`** — der Importer
akzeptierte den Request und importierte keine Werte. Auf `master` ist ein nicht-leeres Mapping Pflicht
(`indicator-edit-features-modal.template.html:431`).

Behoben durch den geteilten Baustein `adminShared/timeseriesMappingForm/` (`ControlValueAccessor` über
`TimeseriesMapping[]`, `km-date-picker` statt jQuery-Datepicker, Draft-Zeile als typisierte
`FormGroup`). Das Edit-Features-Modal bindet ihn per `formControlName`; `timeseriesMappingsRequiredValidator`
stellt die historische Gate-Klausel wieder her. Die vier Broadcast-Kanäle der Vorlage entfallen — inklusive
Enum-Member `ResetTimeseriesMapping` und des untypisierten `'timeseriesMappingChanged'`.

**Browser-Prüfung nötig** (siehe [`MANUELLE_TESTS_REACTIVE_FORMS.md`](MANUELLE_TESTS_REACTIVE_FORMS.md),
Punkt 8): ein echter Einzel-Import mit gefülltem Mapping ist automatisiert nicht erreichbar.

### A3. Divergenz `master` ↔ `feature/migration-bootstrap`

Fork-Punkt ist `0ca8f810` (2025-01-10); seither sind **560 Commits** auf `master` gelandet, darunter
fachliche Arbeit bis 2026-08-10 (Reporting-Zeitreihen-Fixes, Choropleth-Legende, konfigurierbares
Geocoding, Filter-Config für Resource-Creator, Indikator-Range-Filter-Präzision). A2 und B1/Batch-Update
sind aus diesem Spalt entstanden — vermutlich nicht als einzige.

Zwei bereits belegte Fälle:

- **Aggregations-Mapping des Indikator-Imports fehlt vollständig.** `master` schickt im Importer-Body ein
  Feld `aggregations` und hat dafür UI im Edit-Features-Modal (13 Template-Stellen); in Angular existiert
  davon nichts, `updateIndicator()` hat den Parameter nicht. Anders als A2 keine Port-Regression, sondern
  nie erhaltene Weiterentwicklung: die Aggregationen kamen am 2025-09-09 (`b9cd8b5c`, `c3cff91a`), der
  Port des Modals war am 2025-07-18 (`772e1c89`).
- **Batch-Update** — siehe B1.

Ein systematischer Abgleich ist vor einem Merge nach `develop` ohnehin unumgänglich.

---

## B. Laufende / begonnene Refactorings

### B1. Reactive Forms im Admin-Bereich (aktuelle Baustelle)

**Alle Admin-Formulare sind umgestellt; offen sind nur noch bewusste Ausnahmen.** Stand:

- **255 `ngModel`-Bindings in 51 Templates** unter `ngComponents/` (davon **97 in 25 Templates**
  im Admin-Bereich — durchweg Grid-Zustand, Filterfelder und kontrollierte Kind-Inputs, kein
  template-getriebenes Formular mehr)
- **23 Templates** nutzen `formGroup`/`formControlName`/`[formControl]`

#### Erledigt

Das **geteilte Fundament** unter `adminShared/` — es hat alle weiteren Umbauten blockiert:

| Baustein                                                               | Inhalt                                                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `validators/`                                                          | `uniqueNameValidator`, `periodOfValidityValidator`, `spatialUnitHierarchyValidator`, `bboxCompleteValidator` |
| `formError/`                                                           | `<app-form-error>` (signalbasiert über `control.events`) + `[appAria]`-Direktive                             |
| `importerForm/`                                                        | Konverter/Datenquelle inkl. der laufzeit-verschlüsselten Parameter als `FormRecord`                          |
| `topicHierarchyForm/`                                                  | Modell **und** Komponente; leert tiefere Ebenen beim Wechsel                                                 |
| `periodOfValidityForm/`, `attributeMappingDraftForm/`, `securityForm/` | kleine geteilte Gruppen                                                                                      |
| `forms/control-state.ts`                                               | `controlInvalidSignal` für die Stepper-Markierung                                                            |

Dazu: `ControlValueAccessor` nachgerüstet an `km-color-picker`, `km-line-pattern-picker` und
`app-owner-organization-select`; `km-date-picker` um `registerOnValidatorChange` und
`showErrors` ergänzt. `<app-stepper>` markiert ungültige Schritte rot (Navigation bleibt bewusst
frei). Neuer i18n-Namespace `ADMIN_SHARED_UI.VALIDATION.*`, de/en synchron.

Darauf umgestellt sind die beiden **Add-Wizards** (`spatialUnitAddModal`, `georesourceAddModal`):
je eine typisierte Root-`FormGroup` mit einer Child-Group pro Stepper-Schritt, **0 `ngModel`**,
die 11-klauseligen `[disabled]`-Ausdrücke durch je ein `addForm.invalid` ersetzt, die
`<form>`-Elemente entfernt (sie hatten kein `type="submit"` und ihre Template-Ref wurde nie
gelesen), die Body-Builder als pure, TestBed-freie Funktionen extrahiert.

Ebenso die drei **`editFeatures`-Modals** (Raumebene 27→1, Georessource 37→2, Indikator 24→4
`ngModel`; die Reste sind Grid-Zustand im Übersichtsschritt, kein Formular). Zwei davon hatten nur
einen `should create`-Smoke-Test, eines gar keine Spec — vor jedem Umbau ist eine
Charakterisierungs-Spec entstanden (21 / 34 / 13 Tests). Das Indikator-Modal ist bewusst **nicht**
auf `ImporterFormGroup` gebaut: es importiert Zeitreihen statt Geometrien und hat weder
ID-/NAME-Attribut noch Begrenzungsrahmen; es teilt nur die Form der Parameter-`FormRecord`s. Es ist
zugleich das erste Modal mit flächendeckender `<app-form-error>`-Anzeige.

Danach der **`indicatorAddModal`** (76 → 18, davon 12 Klassifikation und 6 tot bzw. Filterfelder).
Dabei ist die Doppelung der Themen-Felder verschwunden: `indicatorTopic_*` (Payload) und
`selected*Topic*` (UI) waren zwei parallel von Hand synchronisierte Feldsätze plus drei
`available*Topics`-Arrays — alles sind jetzt Sichten auf die geteilte Kaskade, die drei
`on*TopicChange`-Handler sind leere Hooks. Indikatornamen sind nur **pro Indikatortyp** eindeutig,
dafür gibt es einen eigenen `indicatorNameUniqueValidator`, der das Geschwister-Control liest.

Zuletzt die **kleinen Modals**: die beiden WMS-Modals (Topic-Reste auf die geteilte Komponente,
der tote `checkDatasetName`-Hook entfernt), `add-topic`, `roleEditMetadataModal` und
`roleAddModal` — zusammen 24 Bindings auf 0. Die drei letztgenannten hatten keine Spec; sie haben
jetzt eine (4 / 8 / 12 Tests), die Namens-Eindeutigkeit, Submit-Gate und das Zurückschreiben auf
das übergebene Dataset-Objekt festhalten.

Zum Abschluss die beiden **`editMetadata`-Modals** (Geo 12→0, Raumebene 8→0) und die
**Parameter-Entwurfszeile des Skript-Wizards** (12→0). Der Name-/Typ-/Stil-Block der Georessourcen
ist jetzt als `buildGeoresourceMetadataStep()` mit dem Add-Wizard geteilt; beide `editMetadata`-Modals
nutzen die geteilte Topic-Komponente und die geteilten Validatoren. Dabei ist eine Divergenz
zwischen den Raumebenen-Zwillingen verschwunden: das Edit-Modal wertete zwei dem Store unbekannte
Hierarchie-Ebenen als **ungültig** (`-1 <= -1`), das Add-Modal als gültig (`undefined <= undefined`)
— beide folgen jetzt der Add-Modal-Semantik.
Die **Verhaltensänderungen** dabei, jeweils durch einen umbenannten oder neu benannten Test
dokumentiert: gleiches Start-/Enddatum wird bei Georessourcen jetzt abgelehnt (`===` verglich zwei frische
`Date`-Objekte); die Themen-Kaskade leert tiefere Ebenen, statt eine veraltete Referenz aus einem
fremden Ast zu posten; Raumebenen lassen sich ohne Keycloak überhaupt anlegen (die Klausel
`!ownerOrganization` war unbedingt, obwohl das Feld hinter `@if (enableKeycloakSecurity)` liegt).
Zusätzlich prüft die Namens-Eindeutigkeit jetzt getrimmt und case-insensitiv. In
`georesourceEditFeaturesModal` ist das Submit-Gate strenger geworden (Pflicht-Konverterparameter
zählen mit — vorher scheiterte der Import erst serverseitig), und das Referenzraumebenen-Select
hält dort die Id statt des ganzen Datensatz-Objekts (gleiches Wire-Format, ein
Objekt-Identitäts-Select weniger). Im Indikator-Wizard sendete der POST-Body für
`interpretation`/`processDescription`/`isHeadlineIndicator` ein durchgereichtes `undefined`,
während der PATCH-Body normalisierte — mit `nonNullable`-Controls ist dieser Zustand nicht mehr
darstellbar, beide Bodies senden jetzt `''`/`false`.

**Manuell zu prüfen:** [`MANUELLE_TESTS_REACTIVE_FORMS.md`](MANUELLE_TESTS_REACTIVE_FORMS.md) —
Widgets im Browser, Objekt-Identität in Selects und die Datei-Import-Round-Trips sind
automatisiert nicht erreichbar.

#### Offen

| Block                                                | `ngModel` | Warum offen                                                                                                                                                                                                                                |
| ---------------------------------------------------- | --------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `indicatorBatchUpdateModal`                          |        21 | **Feature-Regression, wird zurückportiert** (Entscheidung 2026-08-26, siehe unten) — 12 `TODO(batch-update)`, `startBatchUpdate` ist ein No-op. Der Reactive-Forms-Umbau ist Teil des Ports, nicht davor.                                  |
| Skript-Wizard: kontrollierte Kind-Inputs (4 Dateien) |        14 | `[ngModel]` + `@Output`-Emit bzw. Filterfelder — der bewusste `@Input`/`@Output`-Schrittvertrag, kein template-getriebenes Formular. Die Selects binden Objekte über `[ngValue]`; ein Umbau auf `[value]` würde die Objektbindung brechen. |
| Grid-Toggles, Filterfelder, Zeilen-Checkboxen        |       ~62 | bewusst außen vor                                                                                                                                                                                                                          |

Vier Punkte aus dem bereits umgebauten Teil:

- **Die Klassifikation (Schritt 5)** ist bewusst **nicht** auf `FormArray` umgebaut. Ihre sechs
  Bindings waren `[ngModel]` + `(ngModelChange)` auf einen signal-basierten Store mit expliziten,
  immutablen Settern — kein `*Invalid`-Flag, kein handgerolltes `[disabled]`, kein untypisierter
  State. Ein `FormArray` hätte drei Signal-Arrays, alle daraus abgeleiteten Berechnungen und die
  194-Zeilen-Spec betroffen; der Gewinn wäre nur die Stepper-Markierung gewesen, weil der Wizard
  ohnehin per Dialog gatet. Die irreführenden `ngModel`-Marker sind durch `[value]`/`(input)`
  ersetzt, der Store ist unverändert. Wenn die Regeln („mindestens 2 Kategorien", „Wert und Label
  je Kategorie") echte Validatoren werden sollen, ist das ein eigenes Vorhaben.
- **`stateRevision` + die sieben `effect(…markForCheck())`** im Indikator-Wizard sind geblieben.
  Die Form-Direktiven aktualisieren gebundene Inputs von selbst, aber die Step-Templates lesen
  Felder auch in `@if`-Bedingungen und Interpolationen — die sind weiterhin nicht reaktiv. Ihr
  Abbau braucht signal-gestützte Lesezugriffe für diese abgeleiteten Stellen.
- Die **Übergangs-Accessoren** (`get/set spatialUnitLevel` usw.) in beiden Wizards sind bewusst
  stehen geblieben — sie sind der Grund, warum die Sicherheitsnetz-Specs über jeden
  Zwischenschritt unverändert grün blieben. Ihr Abbau (plus Umschreiben der Spec-Setups auf
  `patchValue`) ist ein eigener Folgeschritt.
- **Batch-Update: zurückportieren, nicht entfernen** (Entscheidung 2026-08-26). Die Annahme
  „nicht funktionsfähiges Gerüst" war falsch: `origin/master` (`e1a0af90`, 2026-08-10, **nicht**
  Vorfahr dieses Branches) liefert das Feature funktionsfähig aus — `kommonitorBatchUpdateHelperService`
  (1282 Z.) ruft pro Zeile den Importer auf, Dry-Run vor Commit, für Indikatoren **und**
  Georessourcen. Das CHANGELOG-Zitat „only the UI exists (mostly)" (v1.2.0) beschreibt nur den
  ersten Stand von 2021-04-16; `5932a712` (2021-05-04) hat es fertiggestellt. Der Angular-Port
  `540d1acb` (2025-07-19) hat nur das Template übernommen und einen `setTimeout(2000)`-Fake-Erfolg
  erfunden (entfernt in `c4fdf7b6`); die Logik lag im geteilten Helper, gelöscht am 2026-06-15
  (`39862b75`) samt Ergebnis-Modal und Zeitreihen-Editor. Vorlage liegt verbatim in git.
  Reihenfolge: Zeitreihen-Mapping (A2, ✅) → `BatchUpdateService` → Zeilenmodell/Reactive Forms →
  Run → Ergebnis-Modal; Georessourcen optional danach. Der Georessourcen-Zwilling wurde in
  `d9875a2a` gelöscht, mit der ausdrücklichen Empfehlung, ein künftiges Batch-Update als
  **ressourcen-agnostischen** Baustein neu zu bauen — genau so ist der Port angelegt.
- **`allowedRoles` vs. `permissions`:** `buildPostBody_georesources` sendet `allowedRoles`,
  während `GeoresourcePOSTInputType` das Feld `permissions` nennt (der Raumebenen-Zwilling
  schreibt bereits `permissions`). Georessourcen-Berechtigungen werden vermutlich still
  verworfen — braucht eine Backend-Prüfung, das aktuelle Verhalten ist im Test nur gepinnt.

### B2. Verbleibende große Services

Der God-Service-Split (Prio 7) hat die zentralen Fassaden aufgelöst, aber drei Cluster nie
angefasst:

| Service                                                  | Zeilen | Anmerkung                                              |
| -------------------------------------------------------- | -----: | ------------------------------------------------------ |
| `reporting-service/reporting.service.ts`                 |   3396 | größter Service der Codebasis, nie gesplittet          |
| `diagram-helper-service/…`                               |   2757 | ECharts-Konstruktion, enthält viel toten Kommentarcode |
| `reachability-state-service/…`                           |   1157 | aus der Unifikation entstanden, bewusst so belassen    |
| `reachability-coverage-reports-helper-service/…`         |   1025 | PDF-Export, in der Unifikation ausgeklammert           |
| `reachability-map-helper-service/…`                      |   1017 | Leaflet-Rendering, in der Unifikation ausgeklammert    |
| `visual-style-helper-service/…`                          |   1002 | —                                                      |
| `adminSpatialUnit/kommonitor-importer-helper.service.ts` |    960 | größter verbliebener Admin-Service                     |

Das Rezept dafür steht in [`PRIO7_GOD_SERVICE_SPLIT.md`](PRIO7_GOD_SERVICE_SPLIT.md)
(Abschnitt „Wiederholbares Rezept pro Schritt") und hat sich bewährt — es ist nur auf diese
Services noch nicht angewandt worden.

### B3. Historische Kommentare zur aufgelösten Fassade

~80 Datei-Header und Inline-Kommentare sprechen noch von „the `DataExchangeService` facade
re-exposes …". Diese Fassade **existiert nicht mehr**. Die Kommentare sind irreführend für
jeden, der neu in den Code kommt (und für Agenten). Mechanische Bereinigung.

---

## C. Hygiene & Tooling

### C1. `format:check` im CI-Gate — ✅ erledigt

**Status: umgesetzt.** Die in `PROPOSED_CHANGES.md` genannte Begründung für die Ausklammerung
(„443 unformatierte Bestands-Dateien") ist hinfällig — `npm run format:check` läuft vollständig
grün (verifiziert 2026-08-26).

- `.github/workflows/ci.yml` (Job `quality-gate`) führt `format:check` als **ersten** Schritt aus,
  vor `lint` → `test` → `build`. Getriggert bei jedem Pull Request sowie bei Push auf
  `master`/`develop`/`feature/migration-bootstrap`.
- Derselbe Check läuft lokal als Husky-`pre-commit`-Hook (`.husky/pre-commit`); Contributors
  bekommen ihn automatisch über das `prepare`-Script beim `npm install`
  (`core.hooksPath = .husky/_`).

Damit ist das Gate gegen künftiges Format-Abdriften geschlossen; hier ist nichts mehr offen.

### C2. `console.log` und das globale `console`-Patching

- **143 `console.log`** in 51 Dateien (ohne Specs). Lint-Regel `no-console` steht auf `warn`.
- `StartupService.initEnvVariables()` ersetzt weiterhin `window.console.log` durch eine No-op,
  wenn `enableDebug` fehlt — das unterdrückt auch Logs von Drittbibliotheken und erschwert
  Support-Fälle (offener Punkt 9 in [`STARTUP_IMPROVEMENTS.md`](STARTUP_IMPROVEMENTS.md)).

Beides hängt zusammen: ein schlanker Logger-Service mit Log-Leveln löst es in einem Zug,
danach kann `no-console` auf `error` hochgezogen werden.

### C3. Verbleibende `window.__env`-Direktzugriffe

81 Treffer, aber stark konzentriert (offener Punkt 11 in `STARTUP_IMPROVEMENTS.md`):

| Datei                                                                | Treffer | Bewertung                                          |
| -------------------------------------------------------------------- | ------: | -------------------------------------------------- |
| `adminConfig/adminAppConfig/admin-app-config.component.ts`           |      43 | bearbeitet das Config-Objekt selbst — ggf. legitim |
| `diagram-helper-service`                                             |       4 | umstellbar                                         |
| `access-control-service`                                             |       3 | umstellbar                                         |
| `map-viewport-state-service`, `auth-service`, `resourceMetadataForm` |    je 1 | umstellbar                                         |
| die 2 toten AngularJS-Dateien (A1)                                   |       6 | erledigt sich mit A1                               |

Der reale Rest ist also klein (~10 Stellen); für `admin-app-config` braucht es eine bewusste
Entscheidung (Schreibzugriff vs. getypte Setter im `EnvConfigService`).

### C4. i18n: der UserInterface-Bereich ist komplett unübersetzt

Der Admin-Bereich ist zu 100 % über `ngx-translate` geführt (1790 `| translate`-Referenzen,
1386 Keys in `de.json`/`en.json`). Im UserInterface-Bereich dagegen:

- **0 von 52 Templates** unter `ngComponents/userInterface/` nutzen `| translate`
- alle Labels sind hartkodiert deutsch

Das ist die größte verbliebene i18n-Lücke (Prio 9 in `PROPOSED_CHANGES.md`). Das Rezept aus
dem Admin-Strang (Namespaces pro Feature, alle Sprachdateien gleichzeitig pflegen) ist direkt
übertragbar.

_Kein Problem:_ `de-at/de-ch/de-li/de-lu.json` sind absichtlich leere `{}` und fallen per
`defaultLanguage: 'de'` + `useDefaultLang` auf `de.json` zurück — abgesichert durch
`app/app.i18n-variant-fallback.spec.ts`.

### C5. Lint-Warnungs-Backlog

1280 Warnings bei 0 Errors. Der in `PROPOSED_CHANGES.md` genannte Ratchet-Ansatz gilt
weiter: erst die echten Funde (`no-debugger`, `no-dupe-else-if`, `no-self-assign`,
`no-constant-binary-expression`) auf `error` ziehen, dann `no-console` (nach C2).

**Achtung, dokumentierte Falle:** Ein `eslint --fix`-Massenlauf ist bereits einmal
verworfen worden — der `prefer-const`-Fixer schreibt `let x = []` zu `const x = []` um und
bricht den Build (TS leitet bei `noImplicitAny: false` dann `never[]` ab).

### C6. Build-Warnungen

- **Initial-Bundle 6,07 MB** gegen ein `maximumWarning` von 500 kB (Error-Grenze 10 MB, also
  nur eine Warnung). Das Lazy Loading des Admin-Bereichs ist bereits umgesetzt; der Rest sind
  im Wesentlichen Leaflet + ECharts + ag-Grid im Initial-Chunk. Entweder Budget realistisch
  setzen oder weitere Chunks abspalten (Reporting/Export wären die Kandidaten).
- **9 Nicht-ESM-Module** lösen „optimization bailout"-Warnungen aus:
  `leaflet`, `leaflet-draw`, `leaflet-measure`, `leaflet-search`, `leaflet.pattern`,
  `leaflet.awesome-markers`, `echarts-stat` (eigene Imports) sowie `html2canvas` und
  `dompurify` (transitiv über `jspdf`). Sie fehlen in `allowedCommonJsDependencies`
  (20 Einträge, alle noch aus der Webpack-Ära).
- Zwei Komponenten-SCSS über dem 6-kB-Budget (`spatial-unit-edit-user-roles-modal`,
  `kommonitor-map`) plus `ag-grid.css` selbst.

### C7. Runtime-Fallbacks noch nicht nach `*.example.*` umbenannt

Aus Prio 5 offen geblieben: `env_backup.js`, `keycloak_backup.json` und die beiden
`*_forAdminViewExplanation.txt` heißen weiterhin nach dem „Backup"-Schema, obwohl sie
ausgelieferte Runtime-Fallbacks sind. Die Umbenennung berührt `angular.json` (assets),
`startup.service.ts`, `keycloak-helper.service.ts` und `admin-app-config.component.ts` —
offen ist die Namens-/Deployment-Entscheidung, nicht der Aufwand.

---

## D. Zustand der Dokumentation

Verifiziert gegen den Code am 2026-08-26.

### Überholt — vor Verwendung nicht vertrauen

| Datei                                                      | Befund                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`ReadMe.md`](ReadMe.md)                                   | **Vollständig überholt.** Ist der AngularJS-Ära-User-Guide: MVC-Pattern, `$scope`/`ng-view`, Ordner `kommonitorAdmin/`, `app/dependencies/`, `app.css`, „data-exchange-service im util-Ordner". Nichts davon existiert noch. Entweder neu schreiben (als Angular-Entwicklerguide) oder löschen — `CLAUDE.md` deckt den Inhalt heute besser ab. **Auch `MVC-pattern.png` gehört dazu.**                        |
| [`commonjs-dependencies.md`](commonjs-dependencies.md)     | **Überholt.** Nennt den Builder `@angular-devkit/build-angular:browser` (Webpack) — heute ist es `:application` (esbuild). Behauptet „Build danach mit 0 Warnungen" — heute 9 Nicht-ESM-Warnungen (siehe C6). Verweist auf gelöschte Artefakte (`adminLandingpageConfig`, `customizedExternalLibs/shpwrite.js`) und nennt 21 statt 20 Einträge. Neu erheben oder löschen.                                     |
| [`PRIO7_GOD_SERVICE_SPLIT.md`](PRIO7_GOD_SERVICE_SPLIT.md) | **Teilweise überholt.** Beschreibt `DataExchangeService` (2063 Z., 108 Konsumenten) und einen Fassaden-Delegationsplan mit offenen Schritten B1/B3/B6/B7 — das ist alles erledigt, der Service existiert nicht mehr. Nennt außerdem den falschen Branch (`…-cleanup`) und eine veraltete Test-Baseline (70/1). **Wert erhalten:** Abschnitt „Wiederholbares Rezept pro Schritt" ist weiter gültig (siehe B2). |
| `PROPOSED_CHANGES.md` (Repo-Root)                          | **Teilweise überholt.** Prio 4 steht als „erledigt bis Angular 18" (tatsächlich 21); Prio 6 nennt „42 passed / 29 skipped" (tatsächlich 391/0); die `format:check`-Begründung „443 unformatierte Dateien" ist inzwischen per Nachtrag korrigiert (C1); die esbuild-Migration gilt dort als „aufgeschoben", ist aber erfolgt. Als **Historie** weiter wertvoll — nur nicht als Statusquelle lesen.             |

### Größtenteils abgearbeitet — als Historie lesen

| Datei                                                                              | Befund                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`ADMIN_REFACTORING_ANALYSIS.md`](ADMIN_REFACTORING_ANALYSIS.md)                   | Analyse von 2026-07-07 plus 33 Fortschrittseinträge; der letzte stammt vom 2026-07-09. Die Arbeit lief danach weiter (Config-Editor-Zusammenführung, Filter-Config, i18n der TS-Strings, statusloser Feature-Table-Helper) — **diese Schritte sind nicht dokumentiert.** Von der 5-Punkte-Empfehlung am Ende sind 1–3 und 5 erledigt, 4 (adminSpatialUnit-Fassade) ebenfalls. Offen bleibt daraus nur der Reactive-Forms-Umbau (B1). |
| [`BROADCAST_SERVICE_ENUM.md`](BROADCAST_SERVICE_ENUM.md)                           | **Aktuell und abgeschlossen** („Status: ✅ ABGESCHLOSSEN", Cluster 1–7). Kann als Referenz für das Broadcast-Typsystem stehen bleiben.                                                                                                                                                                                                                                                                                               |
| [`REACHABILITY_STATE_UNIFICATION.md`](REACHABILITY_STATE_UNIFICATION.md)           | **Aktuell und abgeschlossen.** Die dort selbst notierten Ausklammerungen (Map-Helper + Coverage-Reports, beide >1000 Z.) sind in B2 übernommen.                                                                                                                                                                                                                                                                                      |
| [`STARTUP_IMPROVEMENTS.md`](STARTUP_IMPROVEMENTS.md)                               | **Aktuell**, 11 von 13 Punkten erledigt. Die zwei offenen sind hier als C2 und C3 geführt.                                                                                                                                                                                                                                                                                                                                           |
| [`REPORTING_CATEGORICAL_INDICATOR_GAP.md`](REPORTING_CATEGORICAL_INDICATOR_GAP.md) | **Aktuell und offen.** Führt die Reporting-Lücke bei kategorischen Indikatoren eigenständig — der einzige bekannte echte Funktionsfehler. Die dort genannten Zeilennummern sind nicht nachgeprüft worden.                                                                                                                                                                                                                            |
| [`MANUELLE_TESTS_REACTIVE_FORMS.md`](MANUELLE_TESTS_REACTIVE_FORMS.md)             | **Aktuell und offen.** Manuelle Testpfade für den Reactive-Forms-Umbau — genau das, was die automatisierten Tests nicht erreichen (Widgets, Objekt-Identität in Selects, Import-Round-Trips). Nach Risiko sortiert, mit Ankreuzkästchen.                                                                                                                                                                                             |
| [`COMPONENT_NESTING_TREE.md`](COMPONENT_NESTING_TREE.md)                           | **Inhaltlich korrekt, aber unvollständig.** Alle 34 dort genannten Selektoren existieren. Es fehlen die seither entstandenen geteilten Admin-Bausteine (`app-resource-metadata-form`, `app-role-management-grid`, `app-config-editor-panes`, `app-owner-organization-select`) sowie ein `Stand:`-Datum.                                                                                                                              |

---

## Empfohlene Reihenfolge

1. **Manuelle Tests** — [`MANUELLE_TESTS_REACTIVE_FORMS.md`](MANUELLE_TESTS_REACTIVE_FORMS.md)
   abarbeiten. Elf umgestellte Formulare hängen daran, keines war bisher im Browser.
2. **Batch-Update zurückportieren** — B1/Batch, Schritte 2 ff.: `BatchUpdateService`,
   Zeilenmodell + Reactive Forms, Run, Ergebnis-Modal. Schritt 1 (Zeitreihen-Mapping, A2) ist
   erledigt.
3. **B1-Restposten** — die Übergangs-Accessoren abbauen, `stateRevision` auflösen und die
   `allowedRoles`/`permissions`-Frage klären.
4. **A1** — Entscheidung zu `feedbackModal` / `individualIndicatorComputation`; damit fällt auch
   ein Teil von C3 weg.
5. **C2 + C3** — Logger-Service, danach `no-console` auf `error`; Rest der `__env`-Zugriffe.
6. **B3 + D** — Kommentar- und Doku-Bereinigung (billig, hoher Orientierungswert).
7. **Laufend:** B2 (große Services) und C4 (i18n UserInterface) im Zuge regulärer Feature-Arbeit.
