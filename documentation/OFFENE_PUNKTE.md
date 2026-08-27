# Offene Punkte — Stand nach Abschluss der Migration

Stand: 2026-08-27, Branch `feature/migration-bootstrap`.
Basis: Codebestand verifiziert gegen alle Dokumente in `documentation/`.

**Ausgangslage:** Die AngularJS → Angular-Migration und der Modernisierungsplan (Prio 2–7)
sind durch. Der Baum ist grün:

| Gate                   | Ergebnis                                            |
| ---------------------- | --------------------------------------------------- |
| `npm test`             | 146 Suites / **894 Tests**, 0 failed, **0 skipped** |
| `npm run lint`         | **0 Errors**, 1274 Warnings                         |
| `npm run build`        | EXIT 0                                              |
| `npm run format:check` | **grün** (alle Dateien Prettier-konform)            |

Angular **21.2.17** / TypeScript **5.9**, standalone Bootstrap (`bootstrapApplication` +
`app.config.ts`, kein `AppModule`), Admin-Bereich vollständig lazy-loaded, `DataExchangeService`
vollständig aufgelöst (~70 fokussierte Services).

Die folgende Liste ist das, was danach noch offen ist — sortiert nach Nutzen.

---

## A. Funktionale Lücken

### A1. Zwei AngularJS-Features ohne Angular-Pendant — ✅ gelöscht (2026-08-27)

Entscheidung: **löschen**. `app/components/kommonitorUserInterface/` ist weg (14 Dateien, 156 KB —
je `.ts`, `.js`, `.js.map`, Template); unter `app/components/` liegt nur noch `ngComponents/`. Damit
ist Prio 2 des Modernisierungsplans vollständig abgeschlossen.

Ausschlaggebend war ein Abgleich mit `origin/master`: **beide Features sind auch dort abgeschaltet**,
es ging also keine laufende Funktion verloren. Das ist der Unterschied zu A2 und B1, wo die Vorlage
funktionsfähig war und der Port etwas verloren hatte.

- `feedbackModal` — auf `master` wird `<feedback-modal>` zwar instanziiert
  (`kommonitor-user-interface.template.html:169`), der einzige Öffnen-Link daneben ist aber
  auskommentiert (Zeile 141). Der zweite Pfad, `$scope.showFeedbackForm()`
  (`infoModal/info-modal.component.js:74`), wird von keinem Template aufgerufen — das Modal war dort
  unerreichbar.
- `kommonitorIndividualIndicatorComputation` — steht auf `master` in einem auskommentierten Block,
  mit Begründung im Code: `<!-- hide processing button and menu, as it must be greatly improved -->`
  (`kommonitor-user-interface.template.html:231-233`).

Mitgelöscht: die Lint-/Prettier-Ausnahmen für beide Ordner (`eslint.config.js`, `.prettierignore`)
und der auskommentierte Feedback-Link in `user-interface.component.html`. In `README.md` ist der
Feature-Punkt „customizable indicator computation" als derzeit nicht enthalten markiert.

**Falls die Features fachlich zurückkommen sollen:** Neubau gegen die heutigen Services, kein Port.
Die Vorlage liegt verbatim auf `origin/master`. Ausgangslage dafür:

- Feedback-Formular: POST `${targetUrlToProcessingEngine}feedback-mail` mit
  `{recipientMail, subject, body, attachment}` (Base64); Empfänger aus `__env.feedbackMailRecipient`
  (weiterhin in `env_backup.js:317` gesetzt). Klein — offen ist nicht der Aufwand, sondern ob der
  Endpunkt in der Processing Engine noch existiert und wo im UI der Trigger hin soll.
- Parametrisierte Neuberechnung: Angular hat davon bereits den Monitoring-Teil —
  `admin-script-execution.service.ts` liest Jobs und Health per GET von
  `script-engine/customizableIndicatorComputation`. Was fehlt, ist das Auslösen (POST mit
  Skript-Parametern) und die Anzeige des Ergebnisses auf der Karte.

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

### A4. MathJax-Formeldarstellung fehlt vollständig (gefunden 2026-08-27)

`master` rendert LaTeX in Indikator-Beschreibungen: `index.html:72,156` konfiguriert MathJax und
lädt `dependencies/mathjax/tex-chtml.js`, `app.js:218` registriert die Direktive `mathjaxBind`, die
per `$watch` den Ausdruck setzt und `MathJax.typesetPromise([element])` aufruft. Im Migrationsbranch
existiert **weder das Script noch die Direktive** — nur `@types/mathjax` steht noch in
`package.json`. Folgen:

- `kommonitor-map.component.html`: das `<p id="indicatorProcessDescription">` bleibt leer (das
  Attribut `mathjax-bind=` war ein wirkungsloser String und ist jetzt ein TODO-Kommentar).
- `pdf-export.service.ts:282-288`: bei Indikatoren mit `$` in der `processDescription` fotografiert
  `domtoimage.toJpeg(node)` genau diesen leeren Absatz — **im PDF-Report fehlt die Formel**.
- `admin-indicators-management.component.ts:221`: der Aufruf steht hinter
  `if (window.MathJax …)` und läuft daher nie.
- `kommonitor-legend.component.html:874`: eine `[mathjax]`-Bindung ist auskommentiert.

Aufwand klein (Script laden + eine Direktive oder ein `afterRenderEffect`), die Entscheidung ist,
ob MathJax überhaupt zurück soll — es ist die einzige Stelle, an der der Client Formeln darstellt.

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

- **234 `ngModel`-Bindings in 52 Templates** unter `ngComponents/` (davon **76 in 24 Templates**
  im Admin-Bereich — durchweg Grid-Zustand, Filterfelder und kontrollierte Kind-Inputs, kein
  template-getriebenes Formular mehr)
- **25 Templates** nutzen `formGroup`/`formControlName`/`[formControl]`

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
| `indicatorBatchUpdateModal`                          |         0 | **Port durch** — Formular, `BatchUpdateService`, Run, Ergebnis-Modal und Standardwert-Funktion stehen, kein `TODO(batch-update)` mehr. Offen: manuelle Browser-Tests.                                                                      |
| Skript-Wizard: kontrollierte Kind-Inputs (4 Dateien) |        14 | `[ngModel]` + `@Output`-Emit bzw. Filterfelder — der bewusste `@Input`/`@Output`-Schrittvertrag, kein template-getriebenes Formular. Die Selects binden Objekte über `[ngValue]`; ein Umbau auf `[value]` würde die Objektbindung brechen. |
| Grid-Toggles, Filterfelder, Zeilen-Checkboxen        |       ~62 | bewusst außen vor                                                                                                                                                                                                                          |

#### B1-Restposten — ✅ erledigt (2026-08-27)

Die drei in der „Empfohlenen Reihenfolge" als Punkt 2 geführten Restposten sind umgesetzt.

**1. Übergangs-Accessoren abgebaut.** Beide Add-Wizards hatten je ~25 `get/set`-Paare, die
Formular-Controls unter den historischen Feldnamen spiegelten. Sie sind weg; die Aufrufstellen
lesen und schreiben die typisierte Form direkt, die Templates lesen sie über `@let`-Bindungen
(`@let selectedConverter = importerForm.controls.converter.value;` usw.), die Specs über
`patchValue`/`getRawValue` statt über die Accessoren. Erhalten geblieben sind nur die echten
Konvenienz-Getter (`metadataForm`, `metadata`, `importerForm`, `styleGroup`, die `*Invalid`-Sichten
und die abgeleiteten `isPOI`/`isLOI`/`isAOI`). Nebenbei mitgenommen:

- `importerObjectsConfig()` bzw. der Importer-Aufruf in beiden Wizards bauen ihre 15 Felder jetzt
  über das geteilte `importerFormToConfig(...)` statt Feld für Feld.
- Die Entwurfszeile des Attribut-Mappings der Georessourcen nutzt die geteilten Helfer
  (`attributeMappingDraftToRow`/`patchAttributeMappingDraft`/`resetAttributeMappingDraft`,
  `addOrUpdateAttributeMapping`) und ihr Button-Gate ist wie beim Zwilling ein
  `attributeMappingDraft.invalid`.
- Die beiden Farbwähler der Georessourcen hängen per `[formControl]` am Stil-Formular statt per
  `[(color)]` an einem Accessor; `PoiMarkerColor` hat sein `colorValue` jetzt typisiert (bis dahin
  lief der Template-Zugriff über `any`).
- Zwei tote Handler (`onChangeMimeType`, `onChangeDatasourceType`) und der No-op
  `this.georesourceType = this.georesourceType` sind entfallen.

**2. `stateRevision` aufgelöst.** Der Zähler und die sieben (mit der Schale: acht)
`effect(() => { state.stateRevision(); cdr.markForCheck(); })` sind gelöscht. Statt aller Felder
mussten nur die **asynchron geschriebenen Template-Lesestellen** reaktiv werden — das waren fünf:
`indicatorType` und `datasetNameInvalid` (neues `controlStateSignal(...)` neben
`controlInvalidSignal` in `adminShared/forms/control-state.ts`), die beiden
`*References_adminView`-Listen (signalgestützte Shims; alle `push`/`splice`-Stellen ersetzen das
Array jetzt, statt es in place zu mutieren) und `showRoleForm`. `selectedRoleCount` liest eine
eigene `roleGridRevision`. Die bekannte Grenze bleibt: ein Häkchen _im_ Rollen-Grid aktualisiert
die Zusammenfassungszeile nicht, weil das Grid kein Output emittiert, das Schritt 7 bindet.

**3. `allowedRoles` vs. `permissions` geklärt — es war ein Wire-Bug.** Keine Backend-Frage:
`origin/master` schickt in **allen** Admin-Modalen `permissions`, und zwar seit `cbc8640a`, also
schon vor dem Fork-Punkt; `GeoresourcePOSTInputType`, `SpatialUnitPOSTInputType` und
`IndicatorPOSTInputType` nennen das Feld ebenfalls so (bei den letzten beiden ist es `required`).
`allowedRoles` war eine Rückkehr des alten Namens im Angular-Port. Behoben:

- `buildPostBody_georesources` sendet `permissions` — **Georessourcen-Berechtigungen kamen bisher
  gar nicht an.**
- Metadaten-Import/-Export von Georessource und Indikator lesen/schreiben `permissions`; die
  Platzhalter `allowedRoles: ['roleId']` in den drei Beispielstrukturen und im
  Raumebenen-Export-Builder (der Platzhalter landete real in der Exportdatei) heißen jetzt so.
- Das Georessourcen-`editMetadata`-Modal schickt **kein** Berechtigungsfeld mehr im PATCH:
  `GeoresourcePATCHInputType` hat keins und `master` sendet keins. Die Durchleitung las ohnehin
  `dataset.allowedRoles`, was die API nie liefert — sie war immer leer. Das Modal hatte keine
  Spec; es hat jetzt eine (4 Tests), die genau das festhält.
- Der nie aufgerufene Alt-Builder `buildPostBody_indicators` (mit `allowedRoles`) ist gelöscht,
  samt `convertReferencesToApiFormat` und den beiden `*_apiRequest`-Arrays. Dadurch fiel auf, dass
  der **Indikator-Metadaten-Export seine Referenzen aus einem nie gefüllten Array las** —
  interaktiv angelegte Referenzen fehlten in der Datei. Er leitet sie jetzt wie `master` aus der
  Admin-Sicht ab.

Nicht behoben (eigenständiger Fund, im Test als Fehler benannt und gepinnt): `applyMetadataImport()`
des Indikator-Wizards legt Referenzzeilen der Form `{ indicatorId, … }` an, während alle anderen
Aufrufer `{ indicatorMetadata, … }` erwarten — ein Import gefolgt von „Anlegen" wirft einen
`TypeError`.

**Browser-Prüfung nötig:** [`MANUELLE_TESTS_REACTIVE_FORMS.md`](MANUELLE_TESTS_REACTIVE_FORMS.md),
neuer Punkt 11 (plus die Ergänzungen in Punkt 2).

Dazu diese Punkte aus dem bereits umgebauten Teil — der letzte hält die Batch-Update-Entscheidung fest:

- **Die Klassifikation (Schritt 5)** ist bewusst **nicht** auf `FormArray` umgebaut. Ihre sechs
  Bindings waren `[ngModel]` + `(ngModelChange)` auf einen signal-basierten Store mit expliziten,
  immutablen Settern — kein `*Invalid`-Flag, kein handgerolltes `[disabled]`, kein untypisierter
  State. Ein `FormArray` hätte drei Signal-Arrays, alle daraus abgeleiteten Berechnungen und die
  194-Zeilen-Spec betroffen; der Gewinn wäre nur die Stepper-Markierung gewesen, weil der Wizard
  ohnehin per Dialog gatet. Die irreführenden `ngModel`-Marker sind durch `[value]`/`(input)`
  ersetzt, der Store ist unverändert. Wenn die Regeln („mindestens 2 Kategorien", „Wert und Label
  je Kategorie") echte Validatoren werden sollen, ist das ein eigenes Vorhaben.
- **Batch-Update: zurückportieren, nicht entfernen** (Entscheidung 2026-08-26). Die Annahme
  „nicht funktionsfähiges Gerüst" war falsch: `origin/master` (`e1a0af90`, 2026-08-10, **nicht**
  Vorfahr dieses Branches) liefert das Feature funktionsfähig aus — `kommonitorBatchUpdateHelperService`
  (1282 Z.) ruft pro Zeile den Importer auf, Dry-Run vor Commit, für Indikatoren **und**
  Georessourcen. Das CHANGELOG-Zitat „only the UI exists (mostly)" (v1.2.0) beschreibt nur den
  ersten Stand von 2021-04-16; `5932a712` (2021-05-04) hat es fertiggestellt. Der Angular-Port
  `540d1acb` (2025-07-19) hat nur das Template übernommen und einen `setTimeout(2000)`-Fake-Erfolg
  erfunden (entfernt in `c4fdf7b6`); die Logik lag im geteilten Helper, gelöscht am 2026-06-15
  (`39862b75`) samt Ergebnis-Modal und Zeitreihen-Editor. Vorlage liegt verbatim in git.
  Reihenfolge: Zeitreihen-Mapping (A2, ✅) → `BatchUpdateService` (✅) → Zeilenmodell/Reactive
  Forms (✅) → Run (✅) → Ergebnis-Modal (✅) → Standardwert-Funktion (✅). **Der Indikator-Port
  ist damit fertig**; offen sind die manuellen Browser-Tests und optional die Georessourcen-Variante,
  für die `BatchUpdateService` und Ergebnis-Modal unverändert nutzbar sind. Mit dem Ergebnis-Modal sind auch die beiden Enum-Member
  `BatchUpdateCompleted`/`ReopenBatchUpdateResultModal` gelöscht — die in
  in der Admin-Analyse notierte Restschuld ist damit abgetragen. Der Georessourcen-Zwilling wurde in
  `d9875a2a` gelöscht, mit der ausdrücklichen Empfehlung, ein künftiges Batch-Update als
  **ressourcen-agnostischen** Baustein neu zu bauen — genau so ist der Port angelegt.

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
Konsumenten und hat am Ende ~100 irreführende Kommentare hinterlassen (siehe B3). Bei
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

### B3. Historische Kommentare zur aufgelösten Fassade — ✅ erledigt (2026-08-27)

Es waren **100 Treffer**, nicht ~80, und sie zerfielen in vier Töpfe. Heute liefert
`grep -rn DataExchangeService app --include="*.ts"` **null Treffer**.

**Ein Topf war lebender Code.** `app/services/adminGeoresourceUnit/kommonitor-data-exchange.service.ts`
(135 Z.) war die **letzte echte Fassade** — reine Durchreiche ohne eigene Logik, 2 Konsumenten,
14 Aufrufstellen. Sie ist gelöscht; `admin-georesources-management.component` und
`kommonitor-data-grid-helper.service` injizieren jetzt direkt `AccessControlService`,
`GeoresourceMetadataStoreService`, `MetadataBootstrapService`, `PoiPresentationService` und
`TopicHierarchyService`. Mitgelöscht, weil nachweislich tot: das nie gefüllte `georesources$`-Subject,
`getGeoresourceMetadataById`, `getBaseUrlToKomMonitorDataAPI_spatialResource` und die drei
`check*Permission()`-Durchreichen der Übersichtskomponente — **die Rechte-Gates der Admin-Buttons
sind also sichtbar ungebaut**, was der TODO in `admin-script-management.component.html` jetzt
korrekt benennt. `MetadataBootstrapService.fetchGeoresourcesMetadata` hat dabei den fehlenden
Default `filter: any = undefined` bekommen (wie seine Geschwister; die Fassade hatte ihn gestellt).

**~20 Datei-Header** behaupteten im Präsens etwas Falsches („The facade re-exposes … so its
consumers stay unchanged"). Sie beschreiben jetzt, was der Service heute tut; der Herkunftshinweis
ist auf „Extracted in the Prio 7 god-service split (see …)" eingedampft. Vier Sonderfälle mit
konkret falscher Aussage sind korrigiert: `topic-hierarchy.service.ts` („DataExchangeService uses
this service" → `TopicHierarchyStoreService`), der kaputte TSDoc-Link `{@link DataExchangeService}`
in `georesource-list-tab.component.ts`, `pdf-export.service.ts` und `access-control.service.ts:52`.

**14 wortgleiche** `// Local precision-resolving wrapper (formerly the DataExchangeService facade
glue, Prio7 B1)` sagen jetzt, was der Wrapper tut, statt auf ein Nichts zu verweisen.

**~340 Zeilen toter AngularJS-Code gelöscht** — darunter ein einzelner 220-Zeilen-Block
(`diagram-helper-service.service.ts`, auskommentiertes `setHistogramChartOptions`), acht
`$scope`/`$http`/jQuery-Blöcke (u. a. `user-interface.component.ts`, zwei in
`reachability-scenario-modal`, vier in `indicator-add.component.ts`), vier identische
`ng-repeat`-Tabellen am Kopf **lebender** `optionToContent`-Callbacks und die leere No-op-Methode
`removeAoiGeoresource` im Georessourcen-Store (der echte Pfad läuft über `MapService`).

**Bewusst stehen geblieben:** die 22 `$ctrl`-Treffer in auskommentiertem Markup in vier Templates
(`reachability-poi-in-iso` 12, `kommonitor-filter` 4, `user-interface` 3, `regression-diagram` 3) —
sie markieren teils nicht portierte UI. Damit bleiben 5 Namens-Treffer in 3 `.html`-Dateien; in
`.ts` ist es null. Ebenso unangetastet: auskommentierte ECharts-Konfigurationsalternativen in
`diagram-helper` — die gehören zu B2.

---

## C. Hygiene & Tooling

### C1. `format:check` im CI-Gate — ✅ erledigt

**Status: umgesetzt.** Die damalige Begründung für die Ausklammerung
(„443 unformatierte Bestands-Dateien") ist hinfällig — `npm run format:check` läuft vollständig
grün (verifiziert 2026-08-26).

- `.github/workflows/ci.yml` (Job `quality-gate`) führt `format:check` als **ersten** Schritt aus,
  vor `lint` → `test` → `build`. Getriggert bei jedem Pull Request sowie bei Push auf
  `master`/`develop`/`feature/migration-bootstrap`.
- Derselbe Check läuft lokal als Husky-`pre-commit`-Hook (`.husky/pre-commit`); Contributors
  bekommen ihn automatisch über das `prepare`-Script beim `npm install`
  (`core.hooksPath = .husky/_`).

Damit ist das Gate gegen künftiges Format-Abdriften geschlossen; hier ist nichts mehr offen.

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

### C3. Verbleibende `window.__env`-Direktzugriffe — ✅ erledigt (2026-08-27)

**Es gibt keine mehr.** Die frühere Zählung („75 Treffer", offener Punkt 11 in
`STARTUP_IMPROVEMENTS.md`) war ein reines Textsuchen-Artefakt: nachgeprüft am 2026-08-27 ist
jeder verbliebene Treffer entweder legitim oder gar kein Property-Zugriff.

Vollständige Aufschlüsselung der 204 `__env`-Treffer (ohne Specs, `globals.d.ts` und
`config/env_backup.js`):

| Datei                                                                 | Treffer | Was es wirklich ist                                                                                       |
| --------------------------------------------------------------------- | ------: | --------------------------------------------------------------------------------------------------------- |
| `env-config-service/env-config.service.ts`                            |     130 | der typisierte Wrapper selbst — **soll so**                                                               |
| `adminConfig/adminAppConfig/admin-app-config.component.ts`            |      43 | **String-Literale** (`'window.__env.appTitle'` …): die Schlüsselliste zum Erzeugen der `env.js`-Textdatei |
| `userInterface/versionInfo/version-info.component.html`               |      12 | `<code>`-Beispiele im Hilfetext für Administratoren                                                       |
| `startup-service/startup.service.ts`                                  |       7 | **füllt** `window.__env` beim Start — soll so                                                             |
| `diagram-helper-service/…`                                            |       4 | auskommentierter Code                                                                                     |
| `access-control-service/…`                                            |       3 | Blockkommentar; der Code darunter liest bereits über `EnvConfigService`                                   |
| `map-viewport-state-service`, `auth-service`, `resourceMetadataForm`  |    je 1 | Doc-Kommentare                                                                                            |
| `util/genericServices/…ReachabilityScenarioHelperService/*.module.js` |       2 | toter AngularJS-Rest (siehe unten)                                                                        |

Damit entfällt auch die als offen notierte Entscheidung zu `admin-app-config` (Schreibzugriff vs.
getypte Setter im `EnvConfigService`): die Komponente greift das Objekt nicht an, sie kennt nur
die Schlüsselnamen als Text.

**Nebenfund — Datei gelöscht (2026-08-27):**
`app/util/genericServices/kommonitorReachabilityScenarioHelperService/kommonitor-reachability-scenario-helper-service.module.js`
(228 Z.) war übersehener AngularJS-Code — `angular.module(...)`, injizierte `__env` und
`kommonitorDataExchangeService`, von nirgends referenziert (nicht in `angular.json`, kein Import,
nicht in Lint-/Prettier-/Jest-Konfiguration). Nach A1 war das die letzte AngularJS-Datei im Baum;
der Angular-Ersatz liegt unter `services/reachability-scenario-helper-service/`. `app/util/` enthält
jetzt nur noch `interceptors/`.

Mitgeräumt wurden die `$ctrl.*`-Reste in den Reachability-Templates. **Korrektur zur ersten
Einschätzung:** das waren keine zur Laufzeit toten Bindings, sondern auskommentierte
AngularJS-Markup-Blöcke — die drei Buttons in `kommonitor-reachability.component.html` sind direkt
darunter als Icon-Variante live vorhanden, und die beiden PDF-Report-Blöcke in
`reachability-indicator-statistics.component.html` sind auch auf `origin/master` auskommentiert
(inkl. der Begründung „a spatial unit wise report is more complicated"). Die Begründung ist als
Prosa-Kommentar erhalten, das Markup entfernt.

Dabei zwei echte Funde:

- **Fortschrittstext des POI-Coverage-Reports wiederhergestellt.** `master` zeigt während des
  Reports `progressText_poiCoverage` (`n / gesamt`); der Port hatte die Stelle auskommentiert und
  durch ein leeres `<span>&nbsp;</span>` ersetzt. Der Service pflegt das Feld weiter
  (`reachability-coverage-reports-helper.service.ts:371,411`), nur las es niemand — das Template
  bindet es jetzt wieder.
- **MathJax fehlt komplett** — siehe A4.

Verbleibend und **nicht angefasst**: 22 `$ctrl`-Treffer in auskommentiertem Markup in vier
Templates (`reachability-poi-in-iso` 12, `kommonitor-filter` 4, `regression-diagram` 3,
`user-interface` 3). Teils markieren sie nicht portierte UI (z. B. die `dateSelectionType`-Radios),
darum sind sie bewusst stehen geblieben und gehören zu B3. Die zwei **aktiven** toten Attribute sind
weg: `value="$ctrl…enableScatterPlotRegression"` am Regressions-Schalter (die Live-Bindung ist
`[(ngModel)]`) und `mathjax-bind=` in `kommonitor-map.component.html` (durch einen TODO-Kommentar
ersetzt, siehe A4).

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

### Überholt — ✅ bereinigt (2026-08-27)

| Datei                                                  | Was passiert ist                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ReadMe.md` + `MVC-pattern.png`                        | **Gelöscht.** War der AngularJS-Ära-User-Guide (MVC-Pattern, `$scope`/`ng-view`, `kommonitorAdmin/`, `app/dependencies/`, `app.css`) mit drei leeren Kapiteln. `CLAUDE.md` deckt den Zweck ab; ein neuer Angular-Entwicklerguide wurde bewusst **nicht** geschrieben.                                                                                                                                               |
| [`commonjs-dependencies.md`](commonjs-dependencies.md) | **Neu erhoben.** Builder korrigiert (`:application`/esbuild), 20 statt 21 Einträge gegen `angular.json` gegengelesen, gelöschte Artefakte raus, „0 Warnungen" ersetzt durch die **9 real fehlenden Nicht-ESM-Module** als eigene Tabelle. Ein kaputtes `</content>`-Artefakt am Dateiende ist mit weg.                                                                                                              |
| `PRIO7_GOD_SERVICE_SPLIT.md`                           | **Gelöscht.** Beschrieb einen Service, den es nicht mehr gibt, und als Vorgehen die Fassaden-Delegation, die inzwischen vollständig abgebaut ist. Seine beiden noch als offen geführten Befunde (latenter Feature-Table-Header-Height-Bug, toter Broadcast-Pfad der Raumebenen-Übersicht) sind beide erledigt — nachgeprüft am 2026-08-27. Das Rezept ist als „Rezept pro Schnitt" nach B2 gewandert. Liegt in git. |
| `PROPOSED_CHANGES.md` (Repo-Root)                      | **Gelöscht.** Der Modernisierungsplan von 2026-06 war als Statusquelle durchgehend irreführend (Prio 4 „bis Angular 18" statt 21, „42 passed / 29 skipped" statt 894/0, esbuild als „aufgeschoben" statt erledigt) und als Historie durch dieses Dokument abgelöst. Liegt in git.                                                                                                                                   |

### Größtenteils abgearbeitet — als Historie lesen

| Datei                                                                              | Befund                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_REFACTORING_ANALYSIS.md`                                                    | **Gelöscht.** Die Analyse von 2026-07-07 war abgearbeitet, nicht falsch: Konsolidierungsplan (5 Punkte) und Querschnittsthemen sind umgesetzt — jQuery 33→0, OnPush 0→166, i18n 2 Templates→1732 `                                                                                                                                                                      | translate`, Reactive Forms via B1, Lazy Loading, API-Typen, Specs 8→146 Suites; die Add-Wizards teilen heute `WizardStepper`, `ResourceImportService`, `ResourceMetadataForm`und`RoleManagementGrid`. Die 35 Fortschrittseinträge waren reine Historie. Was offen blieb, steht jetzt in B4 (Restbestände) und B2 (`indicator-add-form-state.service.ts`, 1886 Z.). Liegt in git. |
| [`BROADCAST_SERVICE_ENUM.md`](BROADCAST_SERVICE_ENUM.md)                           | **Aktuell und abgeschlossen** („Status: ✅ ABGESCHLOSSEN", Cluster 1–7). Kann als Referenz für das Broadcast-Typsystem stehen bleiben.                                                                                                                                                                                                                                  |
| [`REACHABILITY_STATE_UNIFICATION.md`](REACHABILITY_STATE_UNIFICATION.md)           | **Aktuell und abgeschlossen.** Die dort selbst notierten Ausklammerungen (Map-Helper + Coverage-Reports, beide >1000 Z.) sind in B2 übernommen.                                                                                                                                                                                                                         |
| [`STARTUP_IMPROVEMENTS.md`](STARTUP_IMPROVEMENTS.md)                               | **Aktuell**, 12 von 13 Punkten erledigt: Punkt 11 (`__env`-Direktzugriffe) ist mit C3 abgeschlossen, offen ist nur noch Punkt 9 (`console`-Patching) — hier als C2 geführt und zurückgestellt.                                                                                                                                                                          |
| [`REPORTING_CATEGORICAL_INDICATOR_GAP.md`](REPORTING_CATEGORICAL_INDICATOR_GAP.md) | **Aktuell und offen.** Führt die Reporting-Lücke bei kategorischen Indikatoren eigenständig — der einzige bekannte echte Funktionsfehler. Die dort genannten Zeilennummern sind nicht nachgeprüft worden.                                                                                                                                                               |
| [`MANUELLE_TESTS_REACTIVE_FORMS.md`](MANUELLE_TESTS_REACTIVE_FORMS.md)             | **Aktuell und offen.** Manuelle Testpfade für den Reactive-Forms-Umbau — genau das, was die automatisierten Tests nicht erreichen (Widgets, Objekt-Identität in Selects, Import-Round-Trips). Nach Risiko sortiert, mit Ankreuzkästchen.                                                                                                                                |
| [`COMPONENT_NESTING_TREE.md`](COMPONENT_NESTING_TREE.md)                           | **Aktuell (2026-08-27).** Die vier geteilten Admin-Bausteine (`app-resource-metadata-form`, `app-role-management-grid`, `app-owner-organization-select`, `app-config-editor-panes`) sind in der Selektor-Tabelle ergänzt, mit einer Notiz, warum sie in den Diagrammen fehlen (sie sitzen in Modals, und Modals sind aus dem Baum ausgenommen). `Stand:`-Datum ergänzt. |

---

## Empfohlene Reihenfolge

1. **Manuelle Tests** — [`MANUELLE_TESTS_REACTIVE_FORMS.md`](MANUELLE_TESTS_REACTIVE_FORMS.md)
   abarbeiten. Elf umgestellte Formulare plus das zurückportierte Batch-Update hängen daran,
   nichts davon war bisher im Browser. Punkt 10 braucht einen laufenden Importer.
2. ~~**B1-Restposten**~~ — ✅ erledigt am 2026-08-27 (siehe B1). Die dort behobenen
   Verhaltensänderungen brauchen noch die Browser-Prüfung aus Punkt 11 der manuellen Tests.
3. ~~**A1**~~ — ✅ erledigt am 2026-08-27: beide Features gelöscht (siehe A1). Der zugehörige
   Teil von C3 ist damit weggefallen.
4. ~~**C2 + C3**~~ — C2 (Logger-Service) ⏸️ zurückgestellt, C3 ✅ erledigt, beides am
   2026-08-27. Offen bleibt daraus nur der Löschkandidat aus C3 (letzte AngularJS-Datei).
5. ~~**B3 + D**~~ — ✅ erledigt am 2026-08-27: letzte Fassade aufgelöst, ~100 irreführende
   Kommentare und ~340 Zeilen toter AngularJS-Code entfernt; `ReadMe.md`,
   `PROPOSED_CHANGES.md`, `PRIO7_GOD_SERVICE_SPLIT.md` und `ADMIN_REFACTORING_ANALYSIS.md`
   gelöscht (ihre noch gültigen Teile nach B2/B4 gerettet), `commonjs-dependencies.md`
   neu erhoben. `documentation/` ist damit von 13 auf 8 Dateien geschrumpft.
6. **Laufend:** B2 (große Services) und C4 (i18n UserInterface) im Zuge regulärer Feature-Arbeit.
