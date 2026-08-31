# Manuelle Tests — Admin-Formulare und Batch-Update

Stand: 2026-08-27, Branch `feature/migration-bootstrap`.
Bezug: B1 aus [`OFFENE_PUNKTE.md`](OFFENE_PUNKTE.md).

- **Punkte 1–8:** der Reactive-Forms-Umbau — Fundament, die beiden großen Add-Wizards
  (`spatialUnitAddModal`, `georesourceAddModal`) und die drei `editFeatures`-Modals.
- **Punkt 9:** das neu portierte Zeitreihen-Mapping (A2) — betrifft den **Einzel**-Import.
- **Punkt 10:** das zurückportierte Batch-Update. Braucht als einziger Punkt einen laufenden
  Importer und schreibt echte Daten.

Diese Liste deckt genau das ab, was die automatisierten Tests **nicht** erreichen: Widgets im
Browser, Objekt-Identität in Selects, die Datei-Round-Trips und alles, was einen echten Importer
voraussetzt. Alles andere (Validatoren, Body-Builder, Patcher, Serialisierer, Stepper-Logik,
Blocker-Listen, die Batch-Schleife mit ihrem Dry-Run-Gate) ist TestBed-frei abgedeckt und läuft
über `npm test`.

**Start:** `npm start` → `http://localhost:8000/administration`. Browser-Konsole offen lassen —
die riskanteste Fehlerklasse (Punkt 1) äußert sich dort als Exception, nicht sichtbar im UI.

---

## 1. Importer-Parameter — höchstes Risiko ✅ durchgeführt 2026-08-31

Die beiden Parameter-Dictionaries sind jetzt `FormRecord`s, deren Controls zur Laufzeit aus der
Konverter- bzw. Datenquelltyp-Auswahl gebaut werden. Rendert das Template ein `formControlName`,
für das noch kein Control existiert, wirft Angular `Cannot find control with name: …`.

**Durchgeführt am 2026-08-31** gegen `demo.kommonitor.de.52north.org` (Chrome, angemeldet als
Realm-Admin), in allen fünf Modals: Raumebene anlegen, Georessource anlegen und die drei
„Sachdaten bearbeiten"-Modals (Raumebene, Georessource, Indikator).

- [x] Konverter wählen → Schema und Quellformat füllen sich automatisch, Parameterfelder erscheinen
- [x] Konverter **wechseln** → Parameterfelder werden ausgetauscht; Werte gleichnamiger Parameter
      bleiben erhalten
      *(Indikator-Modal: nicht prüfbar — von den dort angebotenen Konvertern teilen sich zwei keinen
      Parameternamen; die Wertübernahme deckt der Spec-Block ab.)*
- [x] Datenquelltyp wählen und wechseln → Parameterfelder passen sich an
- [x] Datenquelltyp `OGCAPI_FEATURES`: räumlichen Filter auf „Referenzraumebene" und auf
      „manuell" stellen, jeweils Werte eintragen
      *(Indikator-Modal: entfällt — dort gibt es wie auf `master` keinen Filterblock; `bbox` und
      `bboxType` erscheinen als gewöhnliche Parameterfelder, ebenfalls wie auf `master`.)*
- [x] Keine Exception in der Konsole
      *(übrig bleiben nur `NG0956` (track-by-Identität) und eine Leaflet-Deprecation-Warnung —
      beide bestehen unabhängig von diesem Umbau.)*

### Was der Durchlauf gefunden hat

Der Schritt war **in keinem Modal erreichbar**, bevor vier Fehler behoben waren. Keiner davon war
für einen Test sichtbar: zwei hängen an globalem CSS bzw. an der Reihenfolge zweier
Startup-Ereignisse, einer an einer nie verdrahteten Methode, einer an einer Pipe-Signatur.

1. **Alle Rechte weg nach dem Start** (`common/userLogin/user-login.component.ts`).
   `checkAuthentication()` setzte `accessControlService.currentKeycloakLoginRoles = []`. In der
   AngularJS-Vorlage lief das **vor** `fetchAllMetadata()`, hier hängt es am Ereignis
   „Metadaten vollständig geladen" — also **nach** dem Befüllen. Ergebnis: jede
   `check*Permission()` lieferte für den Rest der Sitzung `false`, sämtliche Erstellen-,
   Bearbeiten- und Löschen-Knöpfe der Administration blieben deaktiviert, auch für einen
   Realm-Admin. Zusätzlich setzt `applyLoginStateFromToken()` jetzt `isRealmAdmin` zurück, wenn es
   die Rollen leert — vorher blieb das Flag auf `true` stehen und widersprach den Rollen.
2. **Der Importer-Schritt rendert nichts** (`spatialUnitAddModal`, `georesourceAddModal`).
   In `app.scss` steht noch die jQuery-Wizard-Regel
   `.multiStepForm fieldset:not(:first-of-type) { display: none }`. Sie schlägt `[hidden]` und
   jedes `@if`. Sobald ein dauerhaft gerendertes Geschwister-Fieldset davor steht — der
   Zugriffsschutz-Schritt, der nur ein Inline-`display` umschaltet — ist der Importer-Schritt
   nicht mehr `:first-of-type` und bleibt unsichtbar: leerer Modalkörper zwischen Stepper und
   Buttons. Behoben durch ein Inline-`display` am Fieldset (Raumebene: `[style.display]` statt
   `[hidden]`, Georessource: `style="display: block"`). Die CSS-Regel selbst bleibt stehen — das
   Erreichbarkeits-Szenario-Modal ist der letzte echte jQuery-Wizard und hängt daran.
3. **Keine Datenquelltypen in beiden Georessourcen-Modals**
   (`georesourceAddModal`, `georesourceEditFeaturesModal`). Beide kopierten
   `kommonitorImporterHelperService.availableDatasourceTypes` einmalig in `ngOnInit`. Der
   Helper **ersetzt** das Array, wenn sein Importer-Abruf zurückkommt — die Kopie blieb also für
   immer leer und das Auswahlfeld ohne eine einzige Option. Ohne Datenquelltyp lässt sich keine
   Georessource anlegen. Jetzt lesen beide live über einen Getter.
4. **Das Indikator-Modal war komplett kaputt** (`pipes/filter.pipe.ts`). Das Template übergibt
   `| filter: filterOverviewTargetSpatialUnits()` eine **Prädikatfunktion** (AngularJS-Semantik),
   die Pipe erwartete einen Suchtext und warf bei jedem Change-Detection-Lauf
   `TypeError: searchText.toLowerCase is not a function`. Damit rendert der ganze
   Übersichtsschritt nicht: kein Stepper, keine Ziel-Raumebene, kein Weg zum Importer-Schritt.
   Die Pipe akzeptiert jetzt beides.

Zusätzlich behoben, weil es an derselben Stelle auffiel: `onChangeConverter()` im
Georessourcen-`editFeatures`-Modal war **toter Code** — das Template hat keinen `(change)`-Handler
und niemand rief die Methode auf. Schema und Quellformat blieben daher leer (auf `master` werden
sie mit dem ersten Eintrag des Konverters vorbelegt) und ein veralteter Datenquelltyp überlebte
den Konverterwechsel. Sie hängt jetzt an den `valueChanges` des Konverter-Controls und belegt vor,
statt zu leeren.

### Noch offen aus diesem Durchlauf

- **Datenquelltypen werden nicht nach Konverter gefiltert.** Auf `master` schneidet jedes Modal die
  Liste auf `converter.datasources` zu; auf diesem Branch macht das nur
  `spatialUnitEditFeaturesModal`. Die beiden Add-Wizards und das Georessourcen-`editFeatures`-Modal
  bieten deshalb auch Kombinationen an, die der Konverter nicht unterstützt (z. B.
  `OGCAPI_FEATURES` für GeoJSON) — sie scheitern erst serverseitig. Kein Blocker, aber eine
  Abweichung von `master`.

### Automatisierte Absicherung

`adminShared/importerForm/importer-template-bindings.spec.ts` prüft weiterhin statisch die
`formGroupName`-Wrapper in allen fünf Templates und **neu** die Sichtbarkeitsregel aus Fehler 2
(Inline-`display` am Importer-Fieldset, sobald ein dauerhaft gerendertes Geschwister-Fieldset
existiert; Jest lädt keine globalen Styles, ein gerenderter Test kann das nie sehen). Alle fünf
Modals haben zusätzlich einen gerenderten Spec-Block (`describe('rendered data step')` bzw.
`'rendered batch step'`), der Konverter, Datenquelltyp und räumlichen Filter über die echten
Selects wählt. Neu dazu: `common/userLogin/user-login.component.spec.ts` (Fehler 1) und
`pipes/filter.pipe.spec.ts` (Fehler 4).

Bei Fehlern: `adminShared/importerForm/importer-form.model.ts` →
`syncConverterParameterControls` / `syncDatasourceParameterControls` (im Indikator-Modal das
generische `syncParameterControls`). Die Aufrufe hängen an den `valueChanges` der beiden Selects —
in den Add-Wizards und dem Raumebenen-Edit-Modal in `ngOnInit`, im Georessourcen-Edit-Modal im
Konstruktor.

## 2. Farb- und Musterauswahl im reaktiven Formular ✅ durchgeführt 2026-08-31

`km-color-picker` und `km-line-pattern-picker` sind neu `ControlValueAccessor`. Das Muster wird
über `dashArrayValue` gegen die Optionsliste aufgelöst, weil importierte Werte strukturgleich,
aber nicht identisch sind.

**Durchgeführt am 2026-08-31** gegen `demo.kommonitor.de.52north.org`, in „Raumebene anlegen",
„Georessource anlegen" und „Georessource → Metadaten bearbeiten".

- [x] Raumebene → Metadaten → „Als Umriss-Layer markieren" an: Farbe wählen, Popover schließen —
      Wert bleibt stehen
- [x] Linienmuster wählen → Auswahl bleibt in der Liste markiert
- [x] Linienbreite ändern
- [x] Georessourcen: LOI-Farbe, LOI-Muster und AOI-Farbe analog; die beiden `[formControl]`-Wähler
      übernehmen Auswahl, Zurücksetzen (`#bf3d2c`, Breite 3, Symbol `home`) und den
      Metadaten-Import sichtbar. Round-Trip mitgeprüft: Stil setzen → exportieren → zurücksetzen →
      importieren; Farbknopf und Musterknopf zeigen danach wieder die importierten Werte.
- [x] Georessourcen → Metadaten: Marker-Farbe, Marker-Stil (Symbol/Text) und Symbolfarbe über die
      drei Bootstrap-Dropdowns; Knopftext und die abhängigen Blöcke (Symbolname ↔ Markertext,
      „Farbe des Punktsymbols" ↔ „Textfarbe") schalten sofort um. Ebenfalls geprüft im Modal
      „Metadaten bearbeiten", das dieselben drei Dropdowns benutzt.

### Was der Durchlauf gefunden hat

**Sämtliche Bootstrap-Dropdowns der Anwendung waren tot.** `angular.json` lud
`bootstrap/dist/js/bootstrap.min.js` — diese Variante bringt **kein Popper** mit, und Bootstrap 5
positioniert Dropdowns darüber. Ein Klick auf den Auslöser tat schlicht nichts; über die API
kommt `TypeError: i.createPopper is not a function`. Betroffen waren die je drei Marker-Dropdowns
in „Georessource anlegen" und „Georessource → Metadaten bearbeiten", also Markerfarbe, Markerstil
und Symbolfarbe — sie ließen sich überhaupt nicht öffnen. Tabs sind nicht betroffen, die brauchen
Popper nicht. `@popperjs/core` steht bereits in `package.json`, wurde aber nie geladen; jetzt lädt
`angular.json` `bootstrap.bundle.min.js` (Bootstrap + Popper).

Gewacht wird das von `app/app.bootstrap-scripts.spec.ts` — ein Build-Konfigurationsfehler, den
kein Komponententest sehen kann, weil Jest die globalen Skripte nie lädt.

Randnotiz, nicht behoben: es gibt noch Reste mit dem Bootstrap-4-Attribut `data-toggle=` statt
`data-bs-toggle=` (u. a. `user-interface.component.html`, `info-modal.component.html`,
`reporting-overview.component.html`). Die sind unter Bootstrap 5 wirkungslos — betrifft Tooltips,
Tabs und ein Modal in der Nutzeroberfläche, nicht die Formularwidgets aus diesem Punkt.

Bei Fehlern: `writeValue` in `customElements/color-picker/km-color-picker.component.ts` bzw.
`customElements/line-pattern-picker/km-line-pattern-picker.component.ts`.

## 3. Georessourcen-Gültigkeitsdatum — geändertes Widget ✅ durchgeführt 2026-08-31

Die Felder „Gültig ab/bis" waren rohe Textfelder und sind jetzt `<km-date-picker>` wie beim
Raumebenen-Zwilling.

- [x] Datum über den Picker wählen, Datum manuell eintippen
- [x] **Offene Frage entschieden und umgesetzt:** `coerceEmptyToToday` bleibt für „gültig ab"
      an (das Feld ist Pflicht, ein leeres Startdatum wird weiterhin auf heute gesetzt) und ist
      für „gültig bis" jetzt **aus** — siehe Fund unten. Konsistent an allen vier Fundstellen.
- [x] Gleiches Start- und Enddatum wird abgelehnt (`periodOfValidity`-Fehler, Meldung sichtbar);
      ein späteres Enddatum räumt den Fehler wieder ab

## 3b. „Sachdaten bearbeiten" — die drei editFeatures-Modals ✅ teilweise durchgeführt 2026-08-31

Diese drei sind später umgestellt worden als die Add-Wizards. Am 2026-08-31 erstmals im Browser
gelaufen — alles außer den echten Schreibvorgängen (siehe „Nicht ausgeführt" unten).

**Raumebene → Sachdaten bearbeiten:**

- [x] Schritt 1: „Zeige alle Raumeinheiten" lädt die Feature-Tabelle (5 Zeilen, Spalten
      DB-Record-Id … plus die Sachattribute). Der Schalter „Löschen aktivieren" ist weiterhin
      **kein** Formularfeld und schaltet den Knopf „Lösche alle Raumeinheiten" korrekt frei und
      wieder zu (der Knopf selbst wurde **nicht** gedrückt — die Aktion ist unwiderruflich).
- [ ] Zellen bearbeiten, einzelnes Feature löschen — **nicht ausgeführt**, das schreibt sofort auf
      den Server (`persistSpatialResourceCellEdit`)
- [x] Schritt 2: „gültig ab" leer anklicken und verlassen → wird mit heute gefüllt; Unsinn
      eintippen → wird ebenfalls auf heute korrigiert. Die Korrektur schreibt ins Control, nicht in
      einen Snapshot — genau die Stelle, die der Umbau hätte kaputtmachen können, hält.
      „gültig bis" bleibt seit dem Fix unten leer, wenn man es leert.
- [ ] Kompletter Durchlauf: Datei wählen, Attribut-Mapping anlegen, absenden — **nicht ausgeführt**

**Georessource → Sachdaten bearbeiten:**

- [x] Räumlichen Filter auf „Referenzraumebene" stellen und eine Raumebene wählen: das Select hält
      die **Id** (`de88e2d8-…`), die Auswahl übersteht einen Schrittwechsel und steht danach
      weiterhin im Formular
- [x] **Verhaltensänderung bestätigt:** Konverter mit Pflichtparameter (Shapefile → `CRS`) wählen
      und leer lassen → „Features fortführen" bleibt deaktiviert, `canSubmitForm()` ist `false`.
      Nach dem Ausfüllen wird das Parameter-Control gültig; der Knopf bleibt zu Recht gesperrt,
      solange Datei, Id-/Name-Attribut und Zeitraum fehlen.
- [ ] Kompletter Durchlauf inkl. Teil-Aktualisierung — **nicht ausgeführt**

**Indikator → Sachdaten bearbeiten:**

- [x] Flächendeckende Fehleranzeige: Konverter, Datenquelltyp, Raumbezugsschlüssel und
      Zielraumebene antippen und leer lassen → unter jedem Feld „Dieses Feld ist erforderlich.",
      der Schritt trägt `stepper-step … invalid` samt Ausrufezeichen und bleibt anklickbar. Ein
      gefülltes Feld verliert seine Meldung sofort wieder. (Die Meldung „Bitte mindestens einen
      Zeitschnitt zuordnen." steht unabhängig davon dauerhaft — `showWhen="always"`, so gewollt.)
- [ ] Kompletter Zeitreihen-Import über Datei — **nicht ausgeführt**

### Was der Durchlauf gefunden hat — behoben 2026-08-31

**Ein offener Gültigkeitszeitraum war über die Oberfläche nicht mehr erreichbar** — zwei
Ursachen, die sich gegenseitig verdeckt haben:

1. `km-date-picker.validate()` behandelt den **leeren String wie ein kaputtes Datum**: `''` ist
   nicht `null`, fällt also in die Formatprüfung und liefert `{ dateFormat: 'Expected YYYY-MM-DD' }`.
   Ein leeres „gültig bis" macht damit die Gruppe `periodOfValidity` ungültig. In beiden
   Add-Wizards hängt der Anlegen-Knopf an `addForm.invalid` — **ohne Enddatum lässt sich weder
   eine Raumebene noch eine Georessource anlegen.** Im Browser nachgestellt: Startdatum
   `2020-01-01`, Ende leer → `endDate.errors = { dateFormat }`, Gruppe ungültig; mit Enddatum
   sofort wieder gültig.
2. Selbst das Leeren des Feldes hilft nicht: `coerceEmptyToToday` ist am Widget per Default `true`
   und keine der vier Fundstellen setzt es ab, also steht nach dem Verlassen des Feldes wieder
   das heutige Datum darin. Das widerspricht dem eigenen Handler des Raumebenen-Modals
   (`onPeriodEndBlur()` korrigiert bewusst **nur** ein nicht-leeres Enddatum) und dem Unit-Test
   `leaves an empty end date empty`, der grün bleibt, weil er den Handler direkt aufruft und das
   Widget dabei nicht im Spiel ist.

Beides widerspricht dem Hilfetext, der unverändert unter dem Feld steht: „Enddatum darf leer sein,
um anzuzeigen, dass es sich um aktuell gültige Raumeinheiten/Features handelt." Auf `master` war
das Feld ein einfaches optionales Textfeld.

**Behoben:** `validate()` behandelt den leeren String jetzt wie `null` — die `required`-Prüfung
darüber deckt den Pflichtfall weiterhin ab — und die vier „gültig bis"-Felder setzen
`[coerceEmptyToToday]="false"` (`spatialUnitAddModal`, `spatialUnitEditFeaturesModal`,
`georesourceAddModal`, `georesourceEditFeaturesModal`). Ein geleertes Feld schreibt damit `null`
ins Control; die drei Stellen, die den Wert unnormalisiert in den Body durchreichen, machen
daraus mit `?? ''` wieder den bisherigen Leerstring — **das Wire-Format ändert sich nicht**.

Im Browser gegengeprüft: Startdatum gesetzt und Ende leer ergibt in beiden Add-Wizards einen
gültigen Zeitraum, ein geleertes Enddatum bleibt leer, und das Startdatum wird weiterhin auf heute
gezwungen. Neu abgesichert durch `customElements/date-picker/km-date-picker.component.spec.ts`.

Randbeobachtung: tippt man Unsinn in „gültig bis", greift weiterhin `coerceInvalidToToday` und es
steht heute im Feld. Nur ein *geleertes* Feld bleibt leer.

### Nicht ausgeführt

Alles, was echte Daten auf der Demo-Instanz schreibt: Zell-Editierung und Feature-Löschung in der
Raumebenen-Tabelle, die drei kompletten Durchläufe (Datei + Attribut-Mapping + Absenden) und die
Teil-Aktualisierung. Dafür braucht es eine Testinstanz oder eine ausdrückliche Freigabe.

## 4. Import-Round-Trip ✅ durchgeführt 2026-08-31

Der Pfad, an dem Objekt-Identität in Selects erfahrungsgemäß bricht.

Für **beide** Add-Wizards:

- [x] Metadaten exportieren → Modal neu öffnen → importieren. Korrekt vorausgewählt sind danach:
      Aktualisierungszyklus (das Select steht auf dem richtigen Eintrag, das Control hält
      **dieselbe Objektreferenz** wie die Option — die Identität bricht also nicht), Linienmuster,
      Thema sowie bei Georessourcen der POI/LOI/AOI-Typ samt Marker- und Symbolfarbe und
      Symbolname. Farb- und Musterwähler zeigen die importierten Werte auch sichtbar an.
- [x] Mapping-Config exportieren → importieren. Es stimmen: Konverter, Schema, Quellformat,
      Datenquelltyp, **beide** Parameterblöcke, Begrenzungsrahmen, ID-/NAME-Attribut, beide
      Keep-Schalter und die Attribut-Mappings. Gegenprobe: die Datei nach dem Import erneut
      exportiert ist **zeichengleich** mit dem Original.

Und in den beiden räumlichen `editFeatures`-Modals:

- [x] **Raumebene:** Mapping-Config importieren. Die abweichende bbox-Auswertung greift wie
      vorgesehen — die Datei enthält keinen `bboxType`-Parameter, der Typ wird aus dem Wert
      abgeleitet (`"10,20,30,40"` → `literal`) und nur für OGCAPI-Datenquellen angewendet;
      `bbox`/`bboxType` erscheinen nicht als gewöhnliche Parameterfelder.
- [x] **Georessource:** war ein Stub und ist am 2026-08-31 nachgezogen worden — siehe Fund unten.
      Danach geprüft: dieselbe Datei wie oben wird vollständig übernommen (Konverter aus dem
      Katalog, Schema, Quellformat, Datenquelltyp, beide Parameterblöcke, abgeleiteter
      Begrenzungsrahmen, ID-/NAME-Attribut, Keep-Schalter, Attribut-Mappings), der eigene
      Export lässt sich wieder einlesen, und eine vom Raumebenen-Wizard geschriebene Datei
      ebenfalls.

- [x] Hinweis bestätigt: Eine Metadaten-Datei ohne gesetztes `isPOI`/`isLOI`/`isAOI` landet auf
      „Areas of Interest" (Select zeigt „Areas of Interest", der Flächenfarbwähler erscheint).

### Was der Durchlauf gefunden hat

**Der Mapping-Config-Import des Georessourcen-`editFeatures`-Modals ist nie portiert worden.**
`parseFromMappingConfigFile()` in `georesource-edit-features-modal.component.ts` ist ein
Zwölfzeiler, der drei Dinge falsch macht:

1. `this.converter = mappingConfig.converter` legt das **rohe JSON-Objekt** aus der Datei ins
   Control, statt den passenden Konverter im Importer-Katalog zu suchen. Das Select kann den
   Fremdkörper nicht über Objektidentität finden (zeigt also nichts an), und jeder Zugriff auf
   `converter.schemas` / `.datasources` / `.parameters[].mandatory` läuft ins Leere.
2. Es liest `mappingConfig.datasourceType` — diesen Schlüssel gibt es im Dateiformat nicht, er
   heißt `dataSource`. Der Datenquelltyp bleibt darum leer, und mit ihm Begrenzungsrahmen und
   Datenquell-Parameter.
3. `this.attributeMappings_adminView = mappingConfig.propertyMapping` weist das **ganze
   propertyMapping-Objekt** der Mapping-Liste zu, statt dessen `attributes`-Array. Das Feld ist
   danach kein Array mehr, sondern trägt die Schlüssel `identifierProperty`, `nameProperty`,
   `keepAttributes`, `keepMissingOrNullValueAttributes`, `attributes`.

Schema, Quellformat, Konverter-Parameter, ID-/NAME-Attribut und die Keep-Schalter werden gar
nicht erst angefasst. Im Browser nachgestellt: nach dem Import steht nur der (falsch typisierte)
Konverter, alles andere ist leer.

Dazu passend schreibt `onExportGeoresourceEditFeaturesMappingConfig()` ein **eigenes Format**
(`{converter, datasourceType, propertyMapping, idProperty, nameProperty, validityStartDate, …}`),
während die anderen drei Modals `buildMappingConfigExport()` benutzen. Export und Import dieses
Modals sind damit weder zu den anderen Modals noch zu `master` kompatibel.

Auf `master` ist die Funktion vollständig vorhanden (Konverter über den Katalog auflösen, Schema
und Quellformat abgleichen, Datenquelltyp filtern und setzen, Parameter und bbox anwenden).

**Nachgezogen am 2026-08-31**, entlang des Raumebenen-Zwillings: `onMappingConfigFileSelected()`
liest die Datei über `ResourceImportService.readJsonFile()` + `parseMappingConfig()`,
`applyMappingConfig()` setzt Konverter/Schema/Quellformat/Datenquelltyp und ruft
`patchImporterFormFromMappingConfig()`, und ein eigenes `applyBbox()` leitet den bbox-Typ aus dem
Wert ab (nur für OGCAPI). Der Export schreibt jetzt `buildMappingConfigExport()` — dasselbe Format
wie die anderen drei Modals und wie `master` — statt seines Eigenformats; die Definitionen baut er
direkt über den Helper, damit ein Export keine Datei zum Importer hochlädt.

Abgesichert durch acht neue Tests in `georesource-edit-features-modal.component.spec.ts`
(`describe('applyMappingConfig')`): Katalog-Konverter, beide Parameterblöcke, Attributnamen und
Keep-Schalter, Attribut-Mappings, literale und Referenz-bbox, unangetasteter bbox bei
Nicht-OGCAPI-Quellen, Gültigkeitszeitraum.

**Nicht angefasst:** `buildPutBody()` dieses Modals schickt Konverter- und Datenquell-Parameter
als **Wörterbuch**, während der kanonische `ConverterDefinition`-Typ (und die anderen Modals) ein
Array `[{name, value}]` verlangt. Die vorhandenen Specs pinnen die Wörterbuch-Form. Das ist ein
eigener Verdacht — ohne echten Importer-Lauf nicht zu entscheiden, deshalb hier nur notiert.

### Zwei Randbeobachtungen, kein Handlungsbedarf

- Die vier Begrenzungsrahmen-Felder kommen nach dem Import als **Zeichenketten** zurück
  (`"10"` statt `10`). Beide Formen werden beim Bauen des Parameters zu `"10,20,30,40"`
  verkettet; der Re-Export ist zeichengleich, das Wire-Format also unverändert.
- Die exportierte `dataSource.parameters`-Liste enthält `bboxType` **zweimal**: der Importer
  deklariert `bbox` *und* `bboxType` als Parameter, und der Builder schreibt `bboxType` einmal im
  `bbox`-Zweig und einmal in der allgemeinen Schleife. Auf `master` passiert exakt dasselbe —
  vorbestehend, kein Migrationsfehler.

## 5. Themen-Kaskade — Verhaltensänderung

- [ ] Georessourcen → Schritt „Themen": Haupt-, Unter- und Unterunterthema wählen, dann das
      **Hauptthema wechseln** → die tieferen Ebenen leeren sich
- [ ] Ein Datensatz mit tief gewähltem Thema anlegen und in der Übersicht prüfen, dass die
      richtige Themenzuordnung ankommt

Vorher blieb eine veraltete tiefere Auswahl stehen und gewann die `topicReference` — es wurde
eine Referenz aus einem fremden Themenast gepostet.

## 6. Submit-Gate, Stepper und Zurücksetzen

Die 11-klauseligen `[disabled]`-Ausdrücke sind je durch ein `addForm.invalid` ersetzt.

- [ ] Je einen vollständigen Datensatz anlegen: **Raumebene** und **Georessource** (End-to-End
      inkl. Importer-Lauf)
- [ ] In allen drei `editFeatures`-Modals: der Absenden-Button gibt frei, sobald die Pflichtfelder
      gefüllt sind
- [ ] Der „Anlegen"-Button gibt frei, sobald alle Pflichtfelder gefüllt sind — und nicht früher
- [ ] Schritte mit Pflichtfeldfehlern werden im Stepper rot mit Ausrufezeichen markiert, bleiben
      aber anklickbar (Navigation wurde bewusst **nicht** gesperrt)
- [ ] „Zurücksetzen": Linienbreite zurück auf 3, Farben auf `#000000` (Raumebene) bzw. `#bf3d2c`
      (Georessource), Symbol auf `home`, Markerstil auf `symbol`, beide Keep-Schalter an, SRID
      4326 — **nicht** leer bzw. null
- [ ] Fehlermeldungen erscheinen erst, nachdem ein Feld angefasst wurde, und verschwinden wieder

## 7. Betrieb ohne Keycloak

Konfiguration mit `enableKeycloakSecurity: false`:

- [ ] Raumebene lässt sich anlegen. Der „Anlegen"-Button war dort bisher **dauerhaft
      deaktiviert**, weil die Klausel `!ownerOrganization` unbedingt war, obwohl das Feld hinter
      `@if (enableKeycloakSecurity)` liegt.
- [ ] Der Security-Schritt fehlt im Stepper

## 8. Namens-Eindeutigkeit — Verhaltensänderung

- [ ] Einen bestehenden Datensatznamen in abweichender Groß-/Kleinschreibung oder mit
      führenden/nachgestellten Leerzeichen eingeben → wird jetzt als Dublette abgelehnt.
      Vorher lief das durch und kollidierte erst serverseitig.

## 9. Zeitreihen-Mapping des Indikator-Imports — neu portiert

Bezug: A2 in [`OFFENE_PUNKTE.md`](OFFENE_PUNKTE.md). Die Komponente ersetzt einen jQuery-Datepicker
und vier Broadcast-Kanäle; der Datei-Round-Trip und das Widget sind automatisiert nicht erreichbar.

Indikator → „Sachdaten bearbeiten" → Schritt „Räumlicher Datensatz", Abschnitt
„Zeitreihen-Mapping":

- [ ] Attributname eingeben, Datum über den Datepicker wählen → „Hinzufügen/Editieren" wird aktiv,
      der Eintrag erscheint in der Übersichtstabelle
- [ ] Umschalter „Zeitstempel aus einem Attribut entnehmen" an → das Datumsfeld wird gegen ein
      Textfeld getauscht, ein vorher gewähltes Datum ist geleert (und umgekehrt)
- [ ] Denselben Attributnamen erneut hinzufügen → der bestehende Eintrag wird **ersetzt**, es
      entsteht keine zweite Zeile
- [ ] Editier-Button lädt den Eintrag zurück in die Eingabezeile, Umschalter steht passend
- [ ] Löschen-Button entfernt die Zeile
- [ ] Bei leerer Tabelle ist „Zeitreihen fortführen" **deaktiviert** und die Meldung „Bitte
      mindestens einen Zeitschnitt zuordnen" steht unter dem Abschnitt.
      **Verhaltensänderung:** vorher war der Button aktiv und der Import lief mit leerem Mapping
      durch, ohne Werte zu importieren.
- [ ] Datumsfeld leeren → bleibt leer (wird **nicht** auf „heute" gesetzt) und das Gate greift
- [ ] Schrittwechsel zur Zeitreihen-Übersicht und zurück: die Tabelle ist noch gefüllt (eine
      halb ausgefüllte Eingabezeile geht dabei bewusst verloren)
- [ ] **Echter Import:** Mapping füllen und „Zeitreihen fortführen" ausführen → im Netzwerk-Tab
      enthält der POST auf `indicators/update` ein gefülltes `propertyMapping.timeseriesMappings`,
      und die importierten Werte erscheinen danach in der Zeitreihen-Übersicht

## 10. Batch-Update für Indikatoren — zurückportiertes Feature

Bezug: B1/Batch in [`OFFENE_PUNKTE.md`](OFFENE_PUNKTE.md). Das Feature war auf diesem Branch seit
der Migration funktionslos und ist gegen `origin/master` neu aufgebaut. **Nichts davon war bisher
im Browser**, und Punkt 10.4 braucht einen laufenden Importer und schreibt echte Daten — am besten
auf einer Testinstanz.

Indikatoren-Übersicht → Knopf „Batch-Update".

### 10.1 Tabelle und abgeleitete Spalten

- [ ] Zeile hinzufügen/löschen, „alle auswählen" hakt alle Zeilen an und wieder ab
- [ ] Konverter in einer Zeile wählen → die Parameterspalten dieses Konverters erscheinen
      (z. B. `Trennzeichen`, `CRS`), Zellen anderer Zeilen ohne diesen Parameter bleiben leer
- [ ] **Zwei Zeilen mit verschiedenen Konvertern** → die Spaltenüberschriften sind die Vereinigung
      beider Parametersätze, keine `Cannot find control with name: …`-Exception in der Konsole.
      Das ist die riskanteste Fehlerklasse des Umbaus (`FormRecord`, vgl. Punkt 1)
- [ ] Konverter wechseln → gleichnamige Parameterwerte bleiben erhalten, fremde verschwinden
- [ ] Datenquelltyp `FILE` in einer Zeile → die Datei-Spalte erscheint; Wechsel auf `HTTP` →
      die gewählte Datei ist verworfen und das URL-Feld erscheint
- [ ] Indikator- und Ziel-Raumebenen-Select behalten ihre Auswahl, nachdem die Übersichtstabelle
      im Hintergrund neu geladen wurde (die Selects binden jetzt Ids statt Objekte)

### 10.2 Zeitreihen-Mapping pro Zeile

- [ ] Knopf in der Spalte „Zeitreihen-Mapping" klappt die Zeile auf, der Zähler am Knopf stimmt
- [ ] Es ist immer nur **eine** Zeile aufgeklappt
- [ ] Eintrag anlegen (Datepicker!), editieren, löschen — wie in Punkt 9

### 10.3 Standardwert-Funktion

Klappbox „Standardwert-Funktion" unter der Tabelle:

- [ ] Die Spaltenliste enthält die Parameter der aktuell gewählten Konverter/Datenquelltypen
- [ ] Wert setzen, **ohne** „Bestehende überschreiben" → nur leere Zellen werden gefüllt, der Toast
      nennt die Anzahl geänderter Zeilen
- [ ] Mit „Bestehende überschreiben" → alle Zellen werden gesetzt
- [ ] Spalte „Zeitreihen-Mapping" wählen → das Mapping-Widget erscheint; Anwenden ergänzt die
      Zeilen-Mappings, ersetzt gleichnamige Einträge aber nur bei „Bestehende überschreiben"
- [ ] Spaltenwechsel leert den zuvor eingestellten Wert
- [ ] Die Klappbox lässt sich auf- und zuklappen (sie nutzt jetzt `<expandable-box>`; der alte
      AdminLTE-Knopf war seit der Migration tot)

### 10.4 Echter Lauf gegen den Importer

- [ ] Solange Pflichtfelder fehlen, ist „Update ausführen" deaktiviert und die Blocker-Liste rechts
      nennt konkret, was fehlt (Tooltip = erster Blocker)
- [ ] Zwei Zeilen füllen, **eine davon mit einer absichtlich defekten Datei** → Lauf starten
- [ ] Während des Laufs erscheint der Fortschritt („Zeile 1 von 2")
- [ ] Ergebnis-Modal öffnet sich: gemischte Tabelle, die Fehlerzeile hat ein aufklappbares Detail,
      der Warnhinweis „teilweise angewendet" ist sichtbar
- [ ] **Verschachteltes Modal prüfen** — Backdrop, Scrollen und Schließen des Ergebnis-Modals über
      dem Batch-Modal. Dafür gibt es im Repo keinen Präzedenzfall; fällt es durch, kommt das
      Ergebnis stattdessen inline unter die Tabelle
- [ ] Nach dem Schließen: „Ergebnis anzeigen" öffnet dieselbe Tabelle erneut
- [ ] Die Übersichtstabelle zeigt die aktualisierten Zeitreihen
- [ ] **Klassifikation prüfen:** den erfolgreich aktualisierten Indikator öffnen — die
      Standard-Klassifikation muss unverändert sein. Fehlt `defaultClassificationMapping` im
      PUT-Body, leert das Backend sie; im Test ist das gepinnt, im echten Aufruf nicht
- [ ] **Zugriffsrechte prüfen:** Rechte und Eigentümerschaft des Indikators sind unverändert.
      Bei einer **neu** verknüpften Ziel-Raumebene erbt sie die Rechte der Metadaten — genau das
      sagt der Warnbanner im Modal an

### 10.5 Batch-Liste als Datei

- [ ] Liste exportieren, Modal zurücksetzen, wieder importieren → alle Felder stehen wie zuvor
- [ ] **Eine mit dem alten Client (`master`) exportierte Liste importieren** → Konverter,
      Datenquelltyp, Parameter, Zeitreihen-Mapping und Ziel-Raumebene werden aufgelöst
- [ ] Eine FILE-Zeile exportieren → in der Datei steht **kein** Dateiname (ein Upload-Name ist
      einmalig); nach dem Import muss die Datei neu gewählt werden
- [ ] Mapping-Tabelle pro Zeile speichern und wieder einlesen

---

## 11. Nachwirkungen des B1-Abschlusses (2026-08-27)

Die drei B1-Restposten sind umgesetzt; was sie im Browser berühren, steht hier.

### 11.1 Georessourcen-Berechtigungen — behobener Wire-Bug

`buildPostBody_georesources` sendete `allowedRoles`; das Feld heißt in
`GeoresourcePOSTInputType`, beim Raumebenen-Zwilling und in der AngularJS-Vorlage
`permissions` (dort seit `cbc8640a`, also schon vor dem Fork-Punkt). Alle
Georessourcen-Berechtigungen liefen damit ins Leere.

- [ ] Georessource mit gesetzten Rollen anlegen → die Rollen stehen danach in der
      Rechteverwaltung (das war vorher **nicht** der Fall)
- [ ] Metadaten-Export einer Georessource enthält `permissions` (nicht `allowedRoles`);
      Re-Import setzt die Häkchen im Rollen-Grid
- [ ] Gleiches für Raumebene und Indikator — dort steht in der Exportdatei kein
      `allowedRoles: ["roleId"]`-Platzhalter mehr
- [ ] „Metadaten bearbeiten" einer Georessource speichern → der PATCH enthält **kein**
      Berechtigungsfeld mehr (wie auf `master`); die Rechte bleiben unverändert

### 11.2 Indikator-Metadaten-Export — Referenzen

Der Export las die Referenzen aus einem Array, das nur ein Metadaten-Import füllte; interaktiv
angelegte Referenzen fehlten in der Datei.

- [ ] Im Indikator-Wizard Indikator- und Georessourcen-Referenzen anlegen, Metadaten exportieren
      → beide Listen stehen in der Datei (`{ indicatorId | georesourceId, referenceDescription }`)
- [ ] Datei wieder importieren → die Referenztabellen sind gefüllt

### 11.3 OnPush ohne `stateRevision`

`stateRevision` und die sieben `effect(…markForCheck())` im Indikator-Wizard sind weg; die
asynchron geschriebenen Lesestellen sind jetzt signalgestützt. Das ist genau die Klasse von
Fehlern, die kein Test sieht — **eine stehengebliebene Ansicht**.

- [ ] Indikator anlegen → Metadatendatei importieren. Danach müssen **sofort**, ohne Klick und
      ohne Schrittwechsel, aktualisiert sein: Name/Kürzel/Einheit (Schritt 1), der Indikatortyp
      und die davon abhängige Anzeige in Schritt 5, die Referenztabellen (Schritt 4), die Themen
      (Schritt 3) und die Häkchen im Rollen-Grid (Schritt 7)
- [ ] Namens-Dublette per Import erzeugen → die Fehlermeldung „Name bereits vergeben" erscheint
      sofort in Schritt 1
- [ ] Eigentümerorganisation wählen → das Rollen-Grid erscheint und die Zusammenfassungszeile
      („n Rollen ausgewählt") stimmt
- [ ] **Bekannte Grenze, unverändert:** ein Häkchen *im* Grid aktualisiert die
      Zusammenfassungszeile nicht sofort — das Grid gibt kein Output, das Schritt 7 bindet

### 11.4 Referenz-Datenform nach Metadaten-Import — behoben (2026-08-28)

`applyMetadataImport()` legte `{ indicatorId, … }`-Zeilen an, während Schritt 4, die
Bearbeiten-/Löschen-Handler und beide Body-Builder `{ indicatorMetadata, … }` erwarten. Ein
Import gefolgt von „Anlegen" warf einen `TypeError`. Die Zeilen tragen jetzt das aufgelöste
Metadatenobjekt aus dem Store.

- [ ] Metadatendatei mit Indikator- **und** Georessourcen-Referenzen importieren → die beiden
      Tabellen in Schritt 4 zeigen Name und Typ (vorher blieben die Spalten leer bzw. die
      Ansicht brach ab)
- [ ] Eine importierte Referenz bearbeiten und eine löschen → beides greift die richtige Zeile
- [ ] Danach „Anlegen" → der POST geht raus (**kein** `TypeError` in der Konsole) und enthält
      `refrencesToOtherIndicators` / `refrencesToGeoresources` mit den importierten Einträgen
- [ ] Referenz auf einen inzwischen gelöschten Indikator importieren → die Zeile wird
      stillschweigend verworfen, der Rest des Imports bleibt vollständig

---

## Noch offen / nicht in diesem Umbau geprüft

- (nichts)
