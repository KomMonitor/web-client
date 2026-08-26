# Manuelle Tests — Reactive-Forms-Umbau der Admin-Wizards

Stand: 2026-08-26, Branch `feature/migration-bootstrap`.
Bezug: B1 aus [`OFFENE_PUNKTE.md`](OFFENE_PUNKTE.md) — Fundament plus die beiden großen
Add-Wizards (`spatialUnitAddModal`, `georesourceAddModal`).

Diese Liste deckt genau das ab, was die automatisierten Tests **nicht** erreichen: Widgets im
Browser, Objekt-Identität in Selects und die Datei-Import-Round-Trips. Alles andere
(Validatoren, Body-Builder, Patcher, Serialisierer, Stepper-Logik) ist TestBed-frei abgedeckt
und läuft über `npm test`.

**Start:** `npm start` → `http://localhost:8000/administration`. Browser-Konsole offen lassen —
die riskanteste Fehlerklasse (Punkt 1) äußert sich dort als Exception, nicht sichtbar im UI.

---

## 1. Importer-Parameter — höchstes Risiko

Die beiden Parameter-Dictionaries sind jetzt `FormRecord`s, deren Controls zur Laufzeit aus der
Konverter- bzw. Datenquelltyp-Auswahl gebaut werden. Rendert das Template ein `formControlName`,
für das noch kein Control existiert, wirft Angular `Cannot find control with name: …`.

Raumebene anlegen → Schritt „Räumlicher Datensatz" (bei Georessourcen identisch prüfen):

- [ ] Konverter wählen → Schema und Quellformat füllen sich automatisch, Parameterfelder erscheinen
- [ ] Konverter **wechseln** → Parameterfelder werden ausgetauscht; Werte gleichnamiger Parameter
      bleiben erhalten
- [ ] Datenquelltyp wählen und wechseln → Parameterfelder passen sich an
- [ ] Datenquelltyp `OGCAPI_FEATURES`: räumlichen Filter auf „Referenzraumebene" und auf
      „manuell" stellen, jeweils Werte eintragen
- [ ] Keine Exception in der Konsole

Bei Fehlern: `adminShared/importerForm/importer-form.model.ts` →
`syncConverterParameterControls` / `syncDatasourceParameterControls`; die Aufrufe hängen an den
`valueChanges` der beiden Selects in `ngOnInit` bzw. `setupEventListeners`.

## 2. Farb- und Musterauswahl im reaktiven Formular

`km-color-picker` und `km-line-pattern-picker` sind neu `ControlValueAccessor`. Das Muster wird
über `dashArrayValue` gegen die Optionsliste aufgelöst, weil importierte Werte strukturgleich,
aber nicht identisch sind.

- [ ] Raumebene → Metadaten → „Als Umriss-Layer markieren" an: Farbe wählen, Popover schließen —
      Wert bleibt stehen
- [ ] Linienmuster wählen → Auswahl bleibt in der Liste markiert
- [ ] Linienbreite ändern
- [ ] Georessourcen: LOI-Farbe, LOI-Muster und AOI-Farbe analog

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

## 4. Import-Round-Trip

Der Pfad, an dem Objekt-Identität in Selects erfahrungsgemäß bricht.

Für **beide** Wizards:

- [ ] Metadaten exportieren → Modal neu öffnen → importieren. Danach müssen korrekt
      vorausgewählt sein: Aktualisierungszyklus, Linienmuster, Thema, und bei Georessourcen der
      POI/LOI/AOI-Typ samt Symbol-/Markerfarben
- [ ] Mapping-Config exportieren → importieren. Danach müssen stimmen: Konverter, Schema,
      Quellformat, Datenquelltyp, **beide** Parameterblöcke, Begrenzungsrahmen, ID-/NAME-Attribut,
      die Keep-Schalter und die Attribut-Mappings

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

---

## Noch offen / nicht in diesem Umbau geprüft

- **`allowedRoles` vs. `permissions`:** `buildPostBody_georesources` sendet `allowedRoles`,
  während `GeoresourcePOSTInputType` das Feld `permissions` nennt (der Raumebenen-Zwilling
  schreibt bereits `permissions`). Georessourcen-Berechtigungen werden vermutlich still
  verworfen. Braucht eine Backend-Prüfung — das aktuelle Verhalten ist im Test nur gepinnt.
  → **Konkret zu prüfen:** eine Georessource mit gesetzten Rollen anlegen und danach in der
  Rechteverwaltung nachsehen, ob die Rollen tatsächlich angekommen sind.
- Die Übergangs-Accessoren (`get/set spatialUnitLevel` usw.) in beiden Komponenten sind bewusst
  stehen geblieben, damit die Sicherheitsnetz-Specs unverändert grün bleiben. Ihr Abbau ist ein
  eigener Folgeschritt.
