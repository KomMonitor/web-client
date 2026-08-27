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

## 1. Importer-Parameter — höchstes Risiko

Die beiden Parameter-Dictionaries sind jetzt `FormRecord`s, deren Controls zur Laufzeit aus der
Konverter- bzw. Datenquelltyp-Auswahl gebaut werden. Rendert das Template ein `formControlName`,
für das noch kein Control existiert, wirft Angular `Cannot find control with name: …`.

Raumebene anlegen → Schritt „Räumlicher Datensatz". **Identisch prüfen** in: Georessource
anlegen, sowie in allen drei „Sachdaten bearbeiten"-Modals (Raumebene, Georessource, Indikator):

- [ ] Konverter wählen → Schema und Quellformat füllen sich automatisch, Parameterfelder erscheinen
- [ ] Konverter **wechseln** → Parameterfelder werden ausgetauscht; Werte gleichnamiger Parameter
      bleiben erhalten
- [ ] Datenquelltyp wählen und wechseln → Parameterfelder passen sich an
- [ ] Datenquelltyp `OGCAPI_FEATURES`: räumlichen Filter auf „Referenzraumebene" und auf
      „manuell" stellen, jeweils Werte eintragen
- [ ] Keine Exception in der Konsole

Bei Fehlern: `adminShared/importerForm/importer-form.model.ts` →
`syncConverterParameterControls` / `syncDatasourceParameterControls` (im Indikator-Modal das
generische `syncParameterControls`). Die Aufrufe hängen an den `valueChanges` der beiden Selects —
in den Add-Wizards und dem Raumebenen-Edit-Modal in `ngOnInit`, im Georessourcen-Edit-Modal im
Konstruktor.

## 2. Farb- und Musterauswahl im reaktiven Formular

`km-color-picker` und `km-line-pattern-picker` sind neu `ControlValueAccessor`. Das Muster wird
über `dashArrayValue` gegen die Optionsliste aufgelöst, weil importierte Werte strukturgleich,
aber nicht identisch sind.

- [ ] Raumebene → Metadaten → „Als Umriss-Layer markieren" an: Farbe wählen, Popover schließen —
      Wert bleibt stehen
- [ ] Linienmuster wählen → Auswahl bleibt in der Liste markiert
- [ ] Linienbreite ändern
- [ ] Georessourcen: LOI-Farbe, LOI-Muster und AOI-Farbe analog. **Neu (2026-08-27):** die
      beiden Farbwähler dort hängen jetzt per `[formControl]` am Stil-Formular statt per
      `[(color)]` an einem Komponenten-Accessor — Auswahl, Zurücksetzen und der Metadaten-Import
      müssen den Wert im Wähler sichtbar setzen
- [ ] Georessourcen → Metadaten: Marker-Farbe, Marker-Stil (Symbol/Text) und Symbolfarbe über die
      drei Bootstrap-Dropdowns wählen. Die Templates lesen den Formularwert jetzt über `@let`;
      der Text im Button und die abhängigen Blöcke (Symbolname vs. Markertext) müssen sofort
      umschalten

Bei Fehlern: `writeValue` in `customElements/color-picker/km-color-picker.component.ts` bzw.
`customElements/line-pattern-picker/km-line-pattern-picker.component.ts`.

## 3. Georessourcen-Gültigkeitsdatum — geändertes Widget

Die Felder „Gültig ab/bis" waren rohe Textfelder und sind jetzt `<km-date-picker>` wie beim
Raumebenen-Zwilling.

- [ ] Datum über den Picker wählen, Datum manuell eintippen
- [ ] **Offene Frage:** der Picker hat `coerceEmptyToToday = true` — ein leer angeklicktes und
      wieder verlassenes Feld füllt sich mit dem heutigen Datum. Bei Raumebenen seit jeher so,
      bei Georessourcen neu. Wenn unerwünscht: `[coerceEmptyToToday]="false"` — dann aber
      konsistent an **beiden** Stellen.
- [ ] Gleiches Start- und Enddatum wird jetzt **abgelehnt** (vorher stillschweigend akzeptiert,
      weil `startDate === endDate` zwei frische `Date`-Objekte verglich)

## 3b. „Sachdaten bearbeiten" — die drei editFeatures-Modals

Diese drei sind später umgestellt worden als die Add-Wizards und noch gar nicht im Browser
gelaufen.

**Raumebene → Sachdaten bearbeiten:**

- [ ] Schritt 1 (Feature-Tabelle): Zellen bearbeiten, Feature löschen — der Schalter „Löschen
      aktivieren" ist bewusst **kein** Formularfeld geblieben und muss weiter funktionieren
- [ ] Schritt 2: Gültigkeitsdatum leer anklicken und Feld verlassen → wird mit heute gefüllt;
      Unsinn eintippen und verlassen → wird ebenfalls auf heute korrigiert.
      **Diese Korrektur hätte der Umbau still kaputt gemacht** (sie schrieb in einen
      Wert-Snapshot statt ins Control) — hier genau hinsehen.
- [ ] Kompletter Durchlauf: Datei wählen, Attribut-Mapping anlegen, absenden

**Georessource → Sachdaten bearbeiten:**

- [ ] Räumlichen Filter auf „Referenzraumebene" stellen und eine Raumebene wählen. Das Select
      hält jetzt die **Id** statt des ganzen Datensatz-Objekts — das Wire-Format ist unverändert,
      aber die Auswahl muss stehen bleiben und beim Absenden ankommen.
- [ ] **Verhaltensänderung:** Konverter mit Pflichtparameter wählen und das Feld leer lassen →
      der Absenden-Button bleibt jetzt deaktiviert. Vorher ließ sich absenden und der Importer
      scheiterte erst serverseitig.
- [ ] Kompletter Durchlauf inkl. Teil-Aktualisierung („Partial Update")

**Indikator → Sachdaten bearbeiten:**

- [ ] Erstes Modal mit flächendeckender Fehleranzeige: Pflichtfelder (Konverter, Datenquelltyp,
      Zielraumebene, Raumbezugsschlüssel) antippen und leer lassen → unter jedem Feld erscheint
      eine Meldung, der Schritt wird im Stepper rot markiert
- [ ] Kompletter Zeitreihen-Import über Datei

## 4. Import-Round-Trip

Der Pfad, an dem Objekt-Identität in Selects erfahrungsgemäß bricht.

Für **beide** Add-Wizards:

- [ ] Metadaten exportieren → Modal neu öffnen → importieren. Danach müssen korrekt
      vorausgewählt sein: Aktualisierungszyklus, Linienmuster, Thema, und bei Georessourcen der
      POI/LOI/AOI-Typ samt Symbol-/Markerfarben
- [ ] Mapping-Config exportieren → importieren. Danach müssen stimmen: Konverter, Schema,
      Quellformat, Datenquelltyp, **beide** Parameterblöcke, Begrenzungsrahmen, ID-/NAME-Attribut,
      die Keep-Schalter und die Attribut-Mappings

Und in den beiden räumlichen `editFeatures`-Modals:

- [ ] Mapping-Config importieren. Achtung, die bbox-Auswertung unterscheidet sich hier bewusst
      von den Add-Wizards: es gibt keinen eigenen `bboxType`-Parameter, der Typ wird aus dem Wert
      abgeleitet und nur für OGCAPI-Datenquellen angewendet.

Hinweis: Eine Metadaten-Datei ohne gesetztes `isPOI`/`isLOI`/`isAOI` landet jetzt auf „Areas of
Interest" statt in einem Zustand ohne Stil-Felder — die drei Flags sind auf ein einzelnes
`georesourceType`-Control zusammengefasst.

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

---

## Noch offen / nicht in diesem Umbau geprüft

- Die **Referenz-Datenform** des Indikator-Wizards divergiert weiter: `applyMetadataImport()`
  legt `{ indicatorId, … }`-Zeilen an, alle anderen Aufrufer erwarten
  `{ indicatorMetadata, … }`. Ein Import gefolgt von „Anlegen" wirft deshalb einen `TypeError`
  — als Fehler benannt und in `indicator-add-form-state.service.spec.ts` gepinnt, aber nicht
  behoben.
