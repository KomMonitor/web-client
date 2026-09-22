# Offene Punkte — Stand nach Abschluss der Migration

Stand: 2026-09-22, Branch `feature/migration-bootstrap`.
Basis: Codebestand verifiziert gegen alle Dokumente in `documentation/`.

**Ausgangslage:** Die AngularJS → Angular-Migration und der Modernisierungsplan (Prio 2–7)
sind durch. Der Baum ist grün:

| Gate                   | Ergebnis                                             |
| ---------------------- | ---------------------------------------------------- |
| `npm test`             | 196 Suites / **1644 Tests**, 0 failed, **0 skipped** |
| `npm run lint`         | **0 Errors**, 1096 Warnings                          |
| `npm run build`        | EXIT 0                                               |
| `npm run format:check` | **grün** (alle Dateien Prettier-konform)             |

Angular **21.2.17** / TypeScript **5.9**, standalone Bootstrap (`bootstrapApplication` +
`app.config.ts`, kein `AppModule`), Admin-Bereich vollständig lazy-loaded, `DataExchangeService`
vollständig aufgelöst (~70 fokussierte Services).

Die folgende Liste ist das, was danach noch offen ist — sortiert nach Nutzen.

> **Am 2026-09-22 aufgeräumt.** Die erledigten Einträge sind entfernt; sie stehen vollständig in
> der Git-Historie dieser Datei. Die Nummern der verbliebenen Punkte sind **unverändert
> geblieben**, damit Verweise aus Commits und anderen Dokumenten weiter stimmen — die Lücken in
> der Zählung (A1, A2, A6, A9, B3, B5, C1, C3) sind also Absicht.

---

## A. Funktionale Lücken

### A4. MathJax-Formeldarstellung — ⚠️ teils gelöst (2026-09-17)

Herkunft: `master` rendert LaTeX in Indikator-Beschreibungen — `index.html:72,156` konfiguriert
MathJax und lädt `dependencies/mathjax/tex-chtml.js`, `app.js:218` registriert die Direktive
`mathjaxBind`, die per `$watch` den Ausdruck setzt und `MathJax.typesetPromise([element])` aufruft.
Im Migrationsbranch fehlte beides zunächst ersatzlos.

**Mit Paket C (C10) ist die Bibliothek zurück.** `services/mathjax-service/mathjax.service.ts` hängt
beim ersten Bedarf ein `<script>` auf `mathjax/tex-mml-chtml.js` ein — `angular.json` kopiert
`node_modules/mathjax` als Asset nach `/mathjax`, das Startbundle bleibt unberührt. Die
Konfiguration setzt `inlineMath` auf `$…$` (neben dem voreingestellten `$$…$$`); ohne das erkennt
MathJax die Legendentexte nicht. `util/directives/mathjax.directive.ts` stellt `[appMathjax]`
bereit: setzt `innerHTML` und typesettet das Host-Element neu, sobald der Text sich ändert. Schlägt
das Laden fehl, bleibt die Formel als Quelltext stehen, statt die Ansicht zu reißen.

Eingehängt ist die Direktive an **genau einer Stelle**: `script-add-modal.component.html:53`, der
Methodik-Vorschau des Skript-Dialogs. Die Grundsatzfrage „soll MathJax zurück" ist damit
beantwortet, offen ist nur noch das Verdrahten — fünf Stellen fehlen:

- `kommonitor-map.component.html:15`: `<p id="indicatorProcessDescription">` bleibt leer; darüber
  steht nur ein TODO, dessen Text („neither exists here") inzwischen selbst überholt ist.
- `pdf-export.service.ts:282-288`: bei Indikatoren mit `$` in der `processDescription` fotografiert
  `domtoimage.toJpeg(node)` genau diesen leeren Absatz — **im PDF-Report fehlt die Formel**. Hängt
  an der Kartenansicht: ist der Absatz gefüllt, ist auch das erledigt.
- `kommonitor-legend.component.html:873-874`: die `<td>`-Bindung ist auskommentiert — und zwar auf
  den alten Selektor `[mathjax]`; unverändert wieder einkommentieren geht also nicht, heute heißt
  er `[appMathjax]`.
- `schedule-methodology-cell-renderer.component.ts`: die Methodik-Spalte des Zeitplan-Grids bindet
  `innerHTML` ohne Direktive, ihr Doc-Kommentar behauptet noch, MathJax sei nicht da.
- `admin-filter-config.component.ts:313-322`: `onViewportChanged` ist ein vollständig
  auskommentierter MathJax-Block.

Dazu ein Rest der alten Bauweise: `admin-indicators-management.component.ts:218-224` ruft in
`typesetMath()` hinter `if (window.MathJax …)` ein globales `typesetPromise()` ohne Element auf. Der
Zweig war früher tot; seit C10 setzt der Service `window.MathJax`, er greift also — aber nur, wenn
vorher irgendwo der Skript-Dialog offen war, und dann über das ganze Dokument. Gehört auf die
Direktive umgestellt.

`@types/mathjax` steht weiter in `package.json`, wird aber von nichts mehr gebraucht: der Service
bringt sein eigenes `MathJaxGlobal`-Interface samt `declare global` mit, und in keinem `types`-Array
der `tsconfig*.json` taucht das Paket auf. Kann raus.

### A3. Divergenz `master` ↔ `feature/migration-bootstrap`

Fork-Punkt ist `0ca8f810` (2025-01-10); seither sind **560 Commits** auf `master` gelandet, darunter
fachliche Arbeit bis 2026-08-10 (Reporting-Zeitreihen-Fixes, Choropleth-Legende, konfigurierbares
Geocoding, Filter-Config für Resource-Creator, Indikator-Range-Filter-Präzision). Das
Zeitreihen-Mapping des Indikator-Imports und das Batch-Update sind aus diesem Spalt entstanden —
vermutlich nicht als einzige.

Zwei bereits belegte Fälle:

- **Aggregations-Mapping des Indikator-Imports fehlt vollständig.** `master` schickt im Importer-Body ein
  Feld `aggregations` und hat dafür UI im Edit-Features-Modal (13 Template-Stellen); in Angular existiert
  davon nichts, `updateIndicator()` hat den Parameter nicht. Keine Port-Regression, sondern
  nie erhaltene Weiterentwicklung: die Aggregationen kamen am 2025-09-09 (`b9cd8b5c`, `c3cff91a`), der
  Port des Modals war am 2025-07-18 (`772e1c89`).
- **Batch-Update** — siehe B1.
- **Skriptverwaltung und Indikatorenberechnung: Umstellung auf die OGC Processes API**
  (aufgenommen 2026-09-16). Der mit Abstand größte Posten aus diesem Spalt und kein Nachziehen
  einzelner Commits, sondern ein Datenmodellwechsel: `master` hat beide Admin-Seiten zwischen
  Januar und März 2026 von Data-Management-API `process-scripts` + Processing Engine auf
  `processes` / `schedules` / `jobs` umgestellt. Die Migration steht komplett auf dem Stand davor.
  Eigene Dokumente:

  | Dokument                                                                           | Inhalt                                          |
  | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
  | [`PROCESSES_API_BEFUNDE.md`](PROCESSES_API_BEFUNDE.md)                             | **Referenz** — was die API antwortet, nach Ressource |

  Was gebaut wurde, steht im Code und seinen Kommentaren; als Referenz bleiben die API-Befunde
  oben. Die Master-Commits der Umstellung liegen im Log von `origin/master` zwischen `3f0b8951`
  (2026-01-12) und `6d77b6e9` (2026-03-23).

  **Stand 2026-09-17: abgeschlossen.** Alle fünf Etappen sind erledigt — Auth-Verifikation,
  Paket A (Fundament), Indikatorenberechnung (vormals I1–I14), Paket B (Tabelle),
  Paket C (Anlage-Dialog) und Paket E (Aufräumen). Die App liest Schedules und Jobs aus der Processes API, legt Schedules
  an, stößt Berechnungen an und löscht sie wieder; das alte Skriptcode-Modell ist restlos entfernt,
  ebenso `targetUrlToProcessingEngine`. **Die letzten zwei Einzelheiten sind am 2026-09-18 erledigt**: die Werteliste samt
  Mehrfachauswahl im Filter des Anlage-Dialogs (dabei fielen falsche Operator-Namen und ein zu viel
  gesendeter Schlüssel auf) und der Methodik-PATCH, der als Ein-Feld-Body die übrigen Metadaten des
  Ziel-Indikators gelöscht hätte; er wird jetzt vollständig aufgebaut und ist an einer echten
  Schreiboperation bestätigt. Von den Entscheidungen, die zur Revision offen standen, sind auf der
  Job-Seite inzwischen alle getroffen (Fehler-Export statt Log-Download, Tabelle auch auf der
  Seite, `MAX_JOBS` auf 500 angehoben); in der Skriptverwaltung bleibt der Skripttyp-Titel
  einsprachig vom Server.

  Zwei Punkte daraus greifen in dieses Dokument:
  - ~~**C10 (MathJax) ist dasselbe Thema wie A4 oben**~~ — ✅ die Bibliothek ist mit C10
    eingezogen; eingehängt ist sie bislang nur im Skript-Dialog. Der Rest läuft unter A4 weiter.
  - ~~**Paket E4** baut `targetUrlToProcessingEngine` aus~~ — ✅ erledigt; die Processing Engine ist
    als Runtime-Abhängigkeit weg, `CLAUDE.md` ist nachgezogen.

Ein systematischer Abgleich ist vor einem Merge nach `develop` ohnehin unumgänglich.

### A7. Die Demo zeigt auf das alte Data-Management (2026-09-21)

Der Client-Config-Service der Demo antwortet `apiUrl = …/data-management/`. Diese Instanz kennt die
Hierarchie-Endpunkte nicht (`/spatial-unit-hierarchies` → **404**) und liefert Raumeinheiten ohne
`mandantId`, während die vendorierte Spec in `api-specs/` die v6 beschreibt. Der Client zeigt also
auf ein Backend, zu dem seine eigenen generierten Typen nicht mehr passen.

Die Seite sagt davon **nichts**: der 404 verschwindet in der Regel „Lesen resolvt leer" und wird zu
einer leeren Liste. Ob ein Lesefehler sichtbar werden sollte, ist eine eigene Frage — die Regel
selbst stammt aus der Processes-API-Anbindung und hat dort gute Gründe.

**Für die Entwicklung gelöst:** `app/assets/env_local.js` lädt die App-Config der Demo und setzt
danach `apiUrl` auf v6, `config/config-storage-server.json` zeigt mit seinem App-Config-Eintrag
darauf (Erläuterung in `CLAUDE.md`, samt der Warnung, dass diese eine Zeile so nicht in ein Release
gehört). Am 2026-09-21 durchgesehen: Übersicht, Raumebenen, Hierarchien, Indikatoren, Georessourcen,
Themen, Gruppen, Skripte und die Kartenoberfläche laden gegen v6 fehlerfrei und gefüllt.

**Der Importer zieht nicht mit (2026-09-22).** `targetUrlToImporterService` kommt weiter aus der
App-Konfiguration der Demo, und dieser Importer schreibt in die **alte** Instanz — belegt in
`RAUMEINHEITSHIERARCHIEN_BEFUNDE.md`, Abschnitt 12.1. In der Entwicklungsaufstellung legt ein
Import also einen Datensatz an, den die Anwendung nie zu sehen bekommt: der Dialog meldet Erfolg,
die Liste bleibt unverändert. Das betrifft alle Importwege, nicht nur Raumebenen. Umbiegen lässt es
sich nicht wie die `apiUrl` — der Importer kennt seine Zielinstanz aus seiner eigenen Konfiguration.

**Für die Demo offen:** sie umzustellen heißt, `apiUrl` in ihrer App-Konfiguration zu ändern —
`/administration/settings` schreibt sie per POST an den Client-Config-Service zurück. Das wirkt für
alle Nutzer der Instanz und ist deshalb eine bewusste Entscheidung, keine Nebenbei-Änderung.

---

### A8. Importer: reicht er `hierarchies` durch? — an der Demo nicht beantwortbar (2026-09-22)

Der Anlege-Dialog für Raumebenen schickt seit dem 2026-09-22 die Hierarchie-Zuordnungen als
`spatialUnitPostBody.hierarchies` mit — in der Nachbarn-Form, die `SpatialUnitPOSTInputType`
verlangt. Der Weg führt aber nicht direkt zur Data Management API, sondern über den **Importer**
(`POST {importer}/spatial-units`, `kommonitor-importer-helper.service.ts`), und für den gibt es
keine vendorierte Spec.

**Am 2026-09-22 gemessen** (`RAUMEINHEITSHIERARCHIEN_BEFUNDE.md`, Abschnitt 12), Trockenlauf und
echter Lauf. Ergebnis: Der Importer **nimmt** das Feld an (200, keine Warnung) — aber der neue
Datensatz landet in der **alten** Data-Management-Instanz, nicht in der v6. Die kennt Hierarchien
gar nicht; sie führt noch `nextUpper`/`nextLowerHierarchyLevel`. Ein Gegenüber, das das Feld
auswerten könnte, gibt es an der Demo also nicht, und die Frage bleibt dort unbeantwortbar. Der
Testdatensatz ist wieder gelöscht.

**Was noch offen ist:** dieselbe Messung gegen einen Importer, der auf eine v6-Instanz schreibt.
Erst dann zeigt sich, ob er das Feld weitergibt oder verschluckt. Fällt es weg, ist der Ersatz ein
zweiter Aufruf nach dem Anlegen (`PUT /spatial-units/{id}/hierarchies`) — der nimmt allerdings die
**Level-Form**. Den Mapper dafür gibt es seit dem 2026-09-22: `membershipsByLevelForRows` neben
`membershipsForRows`.

---

### A10. Der Mitgliedschafts-Endpunkt antwortet 404, obwohl er gespeichert hat (2026-09-22)

`PUT /spatial-units/{spatialUnitId}/hierarchies` antwortet **404** mit
`ResourceNotFoundException` auf die Id der Raumeinheit, wenn diese `isPublic: false` ist — und
**200** mit dem aktualisierten Datensatz, wenn sie öffentlich ist. Acht Raumeinheiten geprüft, acht
Treffer, deterministisch und unabhängig von der Operation. **Die Schreiboperation läuft in beiden
Fällen vollständig durch**; das anschließende `GET` zeigt jedes Mal den gewünschten Zustand
(Belege: `RAUMEINHEITSHIERARCHIEN_BEFUNDE.md`, Abschnitt 11.6).

Das ist ein Serverfehler — vermutlich ein Rücklesen über einen nur-öffentlichen Pfad — und er
trifft den Client an einer sichtbaren Stelle: das Bearbeiten-Modal meldet `MSG.HIERARCHY_UPDATE_FAILED`
auf eine Änderung, die gespeichert ist. Auf der Demo betrifft das 32 von 47 Raumeinheiten, also den
Normalfall.

Zu entscheiden:

- **Serverseitig melden** — der saubere Weg; der Client bleibt, wie er ist.
- **Clientseitig abfangen** — den 404 dieses einen Aufrufs als Erfolg werten und danach neu laden.
  Das versteckt einen echten 404 (gelöschte Raumeinheit, falsche Id) und gehört deshalb nur mit
  Kommentar und Verweis auf diesen Punkt in den Code.
- **Nichts tun** — dann bleibt eine Fehlermeldung stehen, die bei fast jedem Datensatz falsch ist.

---

## B. Laufende / begonnene Refactorings

### B1. Reactive Forms im Admin-Bereich (aktuelle Baustelle)

**Alle Admin-Formulare sind umgestellt; offen sind nur noch bewusste Ausnahmen.** Stand:

- **234 `ngModel`-Bindings in 52 Templates** unter `ngComponents/` (davon **76 in 24 Templates**
  im Admin-Bereich — durchweg Grid-Zustand, Filterfelder und kontrollierte Kind-Inputs, kein
  template-getriebenes Formular mehr)
- **25 Templates** nutzen `formGroup`/`formControlName`/`[formControl]`

#### Offen

| Block                                                | `ngModel` | Warum offen                                                                                                                                                                                                                                |
| ---------------------------------------------------- | --------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `indicatorBatchUpdateModal`                          |         0 | **Port durch** — Formular, `BatchUpdateService`, Run, Ergebnis-Modal und Standardwert-Funktion stehen, kein `TODO(batch-update)` mehr. Manuelle Browser-Tests am 2026-08-31 durchgeführt.                                                  |
| Skript-Wizard: kontrollierte Kind-Inputs (4 Dateien) |        14 | `[ngModel]` + `@Output`-Emit bzw. Filterfelder — der bewusste `@Input`/`@Output`-Schrittvertrag, kein template-getriebenes Formular. Die Selects binden Objekte über `[ngValue]`; ein Umbau auf `[value]` würde die Objektbindung brechen. |
| Grid-Toggles, Filterfelder, Zeilen-Checkboxen        |       ~62 | bewusst außen vor                                                                                                                                                                                                                          |

Dazu eine bewusste Ausnahme aus dem bereits umgebauten Teil: **die Klassifikation (Schritt 5 des
Indikator-Wizards)** ist **nicht** auf `FormArray` umgebaut. Ihre Bindings sitzen auf einem
signalbasierten Store mit expliziten, immutablen Settern; ein `FormArray` hätte drei Signal-Arrays,
alle abgeleiteten Berechnungen und die Spec betroffen, und der Gewinn wäre allein die
Stepper-Markierung gewesen — der Wizard gatet ohnehin per Dialog. Sollen die Regeln
(„mindestens 2 Kategorien", „Wert und Label je Kategorie") echte Validatoren werden, ist das ein
eigenes Vorhaben.

### B4. Restbestände des Admin-Refactorings

Aus der Admin-Analyse von 2026-07-07 sind Konsolidierungsplan und Querschnittsthemen
abgearbeitet (jQuery 33→0, OnPush 0→166, i18n 2 Templates→1732 `| translate`, Reactive Forms
via B1, Lazy Loading, API-Typen, Specs 8→146 Suites). Vier Reste sind geblieben, keiner
blockierend, alle beim nächsten Anfassen der jeweiligen Datei mitzunehmen:

| Rest                                                       | Treffer | Anmerkung                                                                                 |
| ---------------------------------------------------------- | ------: | ----------------------------------------------------------------------------------------- |
| `show/hideSuccessAlert`-Muster neben `NotificationService` |      70 | statische Alert-Divs; das ältere der beiden Feedback-Systeme, meist ohne Fehlertext       |
| `setTimeout`-Timing-Hacks                                  |      19 | Rest der Modal-Choreografien (waren 79)                                                   |
| `document.getElementById`                                  |       6 | Rest von 59; der `formValues`-Pfad des Importer-Helpers existiert, der DOM-Pfad lebt noch |
| deprecated `.toPromise()`                                  |       3 | app-weit                                                                                  |

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
| `indicatorAddModal/indicator-add-form-state.service.ts`  |   1886 | modal-scoped, bedient Add **und** Edit über 7 Steps    |

#### Rezept pro Schnitt

Aus dem Prio-7-Split übernommen (dort auf ~20 Schnitte angewandt), **ohne** dessen
Fassaden-Delegation — die war ein Übergangsmechanismus für einen God-Service mit 108
Konsumenten und hat am Ende ~100 irreführende Kommentare hinterlassen (inzwischen bereinigt). Bei
Services dieser Größe die Konsumenten direkt umhängen:

1. Neuen Service unter `app/services/<name>/<name>.service.ts` anlegen,
   `@Injectable({ providedIn: 'root' })`, ein Ordner pro Service.
2. Einen kohärenten Cluster aus Methoden **und** zugehörigen Feldern verschieben — nicht
   Methoden ohne ihren State. Geteilter State als `signal()`, Abgeleitetes als `computed()`,
   RxJS nur für echte Streams.
3. Konsumenten im selben Schritt direkt auf den neuen Service umhängen (Sichtbarkeit und
   HTML-Bindings mitziehen). `git grep <member>` bestätigt danach 0 verbliebene Nutzer.
4. `<name>.service.spec.ts` nach Standardrezept: `TestBed.configureTestingModule({ providers:
[provideHttpClient(), provideHttpClientTesting()] })`, ggf. `provideRouter([])`; gemeinsame
   Helfer aus [`app/testing/test-providers.ts`](../app/testing/test-providers.ts).
5. Pro Schnitt alle vier Gates grün (`format:check`, `lint`, `test`, `build`), bevor der
   nächste beginnt. Ein Cluster pro Commit.

**Fallstricke aus dem Prio-7-Split, die sich wiederholen werden:** vermeintliche Konsumenten
liegen in `/* */`-Blöcken (per Klammer-Balance prüfen, nicht per Textsuche); gleiche
Methodennamen in mehreren Services führen bei der Konsumentenzählung in die Irre — nach
**injiziertem Typ** suchen, nicht nach Variablenname; Felder, die nie geschrieben werden,
liefern still `undefined` an ihre Leser.

### B6. Drei Reste aus der Klassifikations-Typisierung (2026-09-22)

Bei der Konsolidierung der Klassifikations-Typen mit aufgefallen, bewusst nicht mitgenommen:

- **Importer-Helper.** `kommonitor-importer-helper.service.ts:629-638` typisiert
  `defaultClassificationMapping` über eine Intersection gegen den **nur-quantitativen**
  `DefaultClassificationMappingType` — für kategorische Indikatoren also falsch. Seitdem ist der
  Fix eine Zeile (`ClassificationMapping`), aber es ist ein eigener Nutzerpfad (Indikator-Import)
  und gehört einmal durchgeklickt.
- **Export-Template.** `indicator-add-form-state.service.ts:1359-1364` beschreibt die
  Metadaten-Vorlage für Nutzer ohne `classificationType`, `labels`, `individualColors` und
  `categoricalData`, obwohl Zeile 1311 genau die exportiert. Ändert ein Nutzer-Artefakt.
- **Legenden-Divergenz.** Die Legende erkennt „qualitativ" strenger als Karte und Reporting: sie
  geht nur über den Discriminator, während `isQualitativeMapping()` auch ein befülltes
  `categoricalData` gelten lässt. Der Unterschied ist seit der Konsolidierung in
  `kommonitor-legend.component.spec.ts` festgeschrieben, damit er eine Entscheidung bleibt und kein
  Unfall wird — welche Seite nachgibt, ist offen.

---

### B7. `getLabelForFeature` bekommt im Restyle-Pfad einen String statt des Mappings (2026-09-22)

`kommonitor-map.component.ts:1453` übergibt
`…defaultClassificationMapping.classificationType` — also einen String — an `getLabelForFeature`,
während der Aufruf in Zeile 961 dort korrekt das Mapping-**Objekt** übergibt. Die Funktion liest
`classification.classificationType` (Zeile 886/920), im Restyle-Pfad kommt deshalb nie ein Label
zurück. Bei der Konsolidierung der Klassifikations-Typen gefunden und bewusst nicht mitgefixt:
eigener Fehler, eigener Test.

---

## C. Hygiene & Tooling

### C2. `console.log` und das globale `console`-Patching — ⏸️ zurückgestellt (2026-08-27)

**Entscheidung: der Logger-Service wird vorerst nicht umgesetzt.** Der Befund bleibt bestehen,
die Sanierung ist bewusst aufgeschoben — der aktuelle Zustand gilt bis auf Weiteres als hingenommen:

- **143 `console.log`** in 51 Dateien (ohne Specs). Lint-Regel `no-console` bleibt damit auf `warn`.
- `StartupService.initEnvVariables()` ersetzt weiterhin `window.console.log` durch eine No-op,
  wenn `enableDebug` fehlt — das unterdrückt auch Logs von Drittbibliotheken und erschwert
  Support-Fälle (offener Punkt 9 in [`STARTUP_IMPROVEMENTS.md`](STARTUP_IMPROVEMENTS.md)).

Beides hängt zusammen: ein schlanker Logger-Service mit Log-Leveln würde es in einem Zug lösen,
danach könnte `no-console` auf `error` hochgezogen werden. Das bleibt der Weg, falls der Punkt
wieder aufgenommen wird.

### C4. i18n: der UserInterface-Bereich ist komplett unübersetzt

Der Admin-Bereich ist zu 100 % über `ngx-translate` geführt (1790 `| translate`-Referenzen,
1386 Keys in `de.json`/`en.json`). Im UserInterface-Bereich dagegen:

- **0 von 52 Templates** unter `ngComponents/userInterface/` nutzen `| translate`
- alle Labels sind hartkodiert deutsch

Das ist die größte verbliebene i18n-Lücke (Prio 9 des Modernisierungsplans). Das Rezept aus
dem Admin-Strang (Namespaces pro Feature, alle Sprachdateien gleichzeitig pflegen) ist direkt
übertragbar.

_Kein Problem:_ `de-at/de-ch/de-li/de-lu.json` sind absichtlich leere `{}` und fallen per
`defaultLanguage: 'de'` + `useDefaultLang` auf `de.json` zurück — abgesichert durch
`app/app.i18n-variant-fallback.spec.ts`.

### C5. Lint-Warnungs-Backlog

1280 Warnings bei 0 Errors. Der Ratchet-Ansatz gilt weiter: erst die echten Funde (`no-debugger`, `no-dupe-else-if`, `no-self-assign`,
`no-constant-binary-expression`) auf `error` ziehen. Der `no-console`-Schritt hängt an C2
und entfällt damit vorerst (Logger-Service zurückgestellt).

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

Verifiziert gegen den Code am 2026-08-26, Bereinigung am 2026-08-27.

### Größtenteils abgearbeitet — als Historie lesen

| Datei                                                                              | Befund                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_REFACTORING_ANALYSIS.md`                                                    | **Gelöscht.** Die Analyse von 2026-07-07 war abgearbeitet, nicht falsch: Konsolidierungsplan (5 Punkte) und Querschnittsthemen sind umgesetzt — jQuery 33→0, OnPush 0→166, i18n 2 Templates→1732 `                                                                                                                                                                      | translate`, Reactive Forms via B1, Lazy Loading, API-Typen, Specs 8→146 Suites; die Add-Wizards teilen heute `WizardStepper`, `ResourceImportService`, `ResourceMetadataForm`und`RoleManagementGrid`. Die 35 Fortschrittseinträge waren reine Historie. Was offen blieb, steht jetzt in B4 (Restbestände) und B2 (`indicator-add-form-state.service.ts`, 1886 Z.). Liegt in git. |
| [`BROADCAST_SERVICE_ENUM.md`](BROADCAST_SERVICE_ENUM.md)                           | **Aktuell und abgeschlossen** („Status: ✅ ABGESCHLOSSEN", Cluster 1–7). Kann als Referenz für das Broadcast-Typsystem stehen bleiben.                                                                                                                                                                                                                                  |
| [`REACHABILITY_STATE_UNIFICATION.md`](REACHABILITY_STATE_UNIFICATION.md)           | **Aktuell und abgeschlossen.** Die dort selbst notierten Ausklammerungen (Map-Helper + Coverage-Reports, beide >1000 Z.) sind in B2 übernommen.                                                                                                                                                                                                                         |
| [`STARTUP_IMPROVEMENTS.md`](STARTUP_IMPROVEMENTS.md)                               | **Aktuell**, 12 von 13 Punkten erledigt: Punkt 11 (`__env`-Direktzugriffe) ist am 2026-08-27 abgeschlossen worden, offen ist nur noch Punkt 9 (`console`-Patching) — hier als C2 geführt und zurückgestellt.                                                                                                                                                                          |
| [`REPORTING_CATEGORICAL_INDICATOR_GAP.md`](REPORTING_CATEGORICAL_INDICATOR_GAP.md) | **Aktuell und offen.** Führt die Reporting-Lücke bei kategorischen Indikatoren eigenständig — der einzige bekannte echte Funktionsfehler. Die dort genannten Zeilennummern sind nicht nachgeprüft worden.                                                                                                                                                               |
| `MANUELLE_TESTS_REACTIVE_FORMS.md`                                                 | **Gelöscht (2026-08-31).** Die manuellen Testpfade für den Reactive-Forms-Umbau sind abgearbeitet: Punkte 1–10 durchgeführt, die dabei gefundenen Fehler behoben und mit Tests abgesichert. Was offen blieb, steht unten unter „Restposten aus dem manuellen Testlauf". Das Protokoll selbst liegt in git.                                                              |
| [`COMPONENT_NESTING_TREE.md`](COMPONENT_NESTING_TREE.md)                           | **Aktuell (2026-08-27).** Die vier geteilten Admin-Bausteine (`app-resource-metadata-form`, `app-role-management-grid`, `app-owner-organization-select`, `app-config-editor-panes`) sind in der Selektor-Tabelle ergänzt, mit einer Notiz, warum sie in den Diagrammen fehlen (sie sitzen in Modals, und Modals sind aus dem Baum ausgenommen). `Stand:`-Datum ergänzt. |

### Neu und offen (2026-09-16, ergänzt 2026-09-21)

| Datei                                                                              | Befund                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`PROCESSES_API_BEFUNDE.md`](PROCESSES_API_BEFUNDE.md)                             | **Aktuell, dauerhaft.** Referenz der echten API-Antworten, nach Ressource geordnet: Schreibweisen, Feldformen, Auth, Schreiboperationen, unbelegte Stellen. Die API liefert kein Schema (`/openapi` 404), die handgepflegten Typen im Client hängen daran — drei Quelldateien verweisen darauf. |
| [`RAUMEINHEITSHIERARCHIEN_BEFUNDE.md`](RAUMEINHEITSHIERARCHIEN_BEFUNDE.md)         | **Aktuell, dauerhaft.** Was die Hierarchie-Endpunkte der Data Management API v6 am 2026-09-18 wirklich geantwortet haben, sieben Fragen mit Belegen: `hierarchyLevel` ist 0-basiert und dicht, der Level-Wert schlägt die Array-Reihenfolge, ein weggelassenes `isPublic` setzt `false`. Am 2026-09-22 um Abschnitt 11 (der Mitgliedschafts-Endpunkt der Raumeinheiten: einfügendes Verhalten, ignorierte Nachbarn-Form, 404 trotz Erfolg) und Abschnitt 12 (Importer-Trockenlauf) ergänzt. Der schreibende Durchlauf wurde vollständig zurückgenommen. |

Verifikationsgrad: `processes`, `schedules`, `jobs` und seit dem 2026-09-18 auch `jobSummary` sind
gegen die Demo-Instanz belegt (eingeloggt) — A4 und die Job-Typen stehen damit fest. Die Lücke
schloss ein von
Hand angestoßener Lauf, der erstmals erfolgreich durchlief; derselbe Schedule war am 1.9.2026 noch
gescheitert, die 60 Fehlschläge waren also ein Zustand der Instanz, kein Client-Problem.

---

## Restposten aus dem manuellen Testlauf (Stand 2026-08-31)

Aus `MANUELLE_TESTS_REACTIVE_FORMS.md` (gelöscht, liegt in git) blieben diese Stichproben offen —
alle brauchen einen laufenden Backend-Stack und schreiben echte Daten:

- **„Sachdaten bearbeiten" (Punkt 3b):** Zellen bearbeiten bzw. ein einzelnes Feature löschen sowie
  ein kompletter Durchlauf mit Attribut-Mapping. Beides schreibt sofort auf den Datenbestand und
  wurde deshalb nicht ausgeführt.
- **11.1 Georessourcen-Berechtigungen:** Anlegen mit gesetzten Rollen, `permissions` statt
  `allowedRoles` im Metadaten-Export (Georessource vs. Raumebene/Indikator), PATCH ohne
  Rollenfeld beim reinen Metadaten-Speichern.
- **11.2 Indikator-Metadaten-Export:** Referenzen exportieren und wieder importieren, die
  Referenztabellen müssen danach gefüllt sein.
- **11.3 OnPush ohne `stateRevision`:** Metadaten-Import muss Formularfelder, Namens-Dubletten-Fehler
  und das Rollen-Grid ohne Zusatzklick aktualisieren. Bekannte, unveränderte Grenze: ein Häkchen
  _im_ Grid aktualisiert die Zusammenfassungszeile nicht sofort.

---

## Empfohlene Reihenfolge

1. **A3 — der `master`-Abgleich.** Der einzige Punkt, bei dem unbekannt ist, *was* fehlt: 560
   Commits seit dem Fork-Punkt, davon eine belegte Lücke (das Aggregations-Mapping des
   Indikator-Imports) und ein ungeprüfter Rest. Die Processes-API war der große Brocken daraus und
   ist durch.
2. **A4 — MathJax an den fünf Stellen einhängen.** Bibliothek, Service und Direktive stehen seit
   dem 2026-09-17; es fehlt nur noch `[appMathjax]` in Kartenansicht (und damit PDF-Report),
   Legende, Zeitplan-Grid und Filter-Config, dazu das globale `typesetPromise()` in der
   Indikatorenverwaltung.
3. **A10 melden, B6/B7 mitnehmen.** A10 ist ein Serverfehler und gehört ans Backend; B6 (Importer
   auf dem nur-quantitativen Typ) und B7 (Map-Bug) sind kleine, abgegrenzte Fixes.
4. **Laufend:** B2 (große Services) und C4 (i18n UserInterface) im Zuge regulärer Feature-Arbeit.
5. **Wenn ein Backend-Stack bereitsteht:** die Restposten aus dem manuellen Testlauf (oben) und,
   sobald ein Importer auf v6 schreibt, A8.
6. **Fremdbestimmt:** A7 (Demo-Umstellung) ist eine Betriebsentscheidung, keine Code-Aufgabe.
