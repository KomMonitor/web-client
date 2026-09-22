# Raumeinheitshierarchien — was die Instanz tatsächlich antwortet

Stand: 2026-09-18, Branch `feature/migration-bootstrap`. Nachträge vom 2026-09-21 (Abschnitt 9)
und vom 2026-09-22 (Abschnitte 11–12: der Mitgliedschafts-Endpunkt der Raumeinheiten und der
Importer).

**Wozu dieses Dokument:** Die Spec der Data Management API v6 beschreibt die Hierarchie-Endpunkte
nur grob und an einer Stelle nachweislich falsch — **alle** Fehler-Responses (401/403/404/405) sind
mit dem Erfolgs-Schema annotiert, ein 401 liefert dort angeblich eine Hierarchie-Liste. Die offenen
Fragen der Anbindung sind deshalb an der laufenden Instanz geklärt worden. Wer den Client gegen diese Endpunkte baut, findet hier die Belege.

**Methode:** eingeloggter Abruf gegen
`https://demo.kommonitor.de.52north.org/data-management-v6/management/`. Die Requests liefen über
den `HttpClient` der laufenden App, das Token hat der reguläre `AuthInterceptor` angehängt.
Ausgangslage: **0 Hierarchien**, 47 Raumeinheiten, 47 organisatorische Einheiten (21 davon mit
`mandant: true`), Nutzer mit `creator` auf allen Datensätzen.

**Schreibender Durchlauf, vollständig zurückgenommen.** Angelegt wurden zwei Hierarchien
`ZZZ-CLAUDE-TEST-A` und `ZZZ-CLAUDE-TEST-B` im Mandanten `52N`
(`e2826bb6-2dd7-4f6e-be03-b15d9569fb99`) mit vier bestehenden Raumeinheiten als Mitgliedern. Beide
wurden am Ende gelöscht; die Schlusskontrolle zeigt wieder **0 Hierarchien**, und alle vier
Raumeinheiten existieren unverändert mit `hierarchies: []` (Abschnitt 7).

---

## 1. `hierarchyLevel` — der Server normalisiert, und zwar nach Wert

**Das ist der wichtigste Befund.** Die Spec sagt nur „Lower values denote upper levels". Tatsächlich
gilt:

| gesendet                                          | zurückgegeben  |
| ------------------------------------------------- | -------------- |
| `0, 1, 2`                                         | `0, 1, 2`      |
| `1, 2, 3`                                         | `0, 1, 2`      |
| `0, 5, 10` (Lücken)                               | `0, 1, 2`      |
| `0, 0, 1` (Duplikat)                              | `0, 1, 2`      |
| `2, 1, 0` (Array-Reihenfolge ≠ Level-Reihenfolge) | **umsortiert** |

Die Instanz **normalisiert immer auf eine lückenlose 0-basierte Folge**. Weder Lücken noch Duplikate
werden abgewiesen — beides wird stillschweigend geglättet.

**Maßgeblich ist der `hierarchyLevel`-Wert, nicht die Array-Position.** Der entscheidende Test:
gesendet wurde

```json
[
  { "spatialUnitId": "16397ed6…", "hierarchyLevel": 2 }, // Gemeinden Kreis Viersen
  { "spatialUnitId": "15fcddce…", "hierarchyLevel": 1 }, // Städte Kreis RE
  { "spatialUnitId": "d60c9a5a…", "hierarchyLevel": 0 } // Stadt Essen - 1km Raster
]
```

zurück kam `0 = Stadt Essen - 1km Raster`, `1 = Städte Kreis RE`, `2 = Gemeinden Kreis Viersen` —
also nach Level sortiert, die Array-Reihenfolge ignoriert. Bei **gleichem** Level entscheidet
ersatzweise die Array-Position (Test `0, 0, 1` behielt die gesendete Reihenfolge).

> **Konsequenz für den Client:** Beim Senden den **Index der Kette** als `hierarchyLevel` schreiben
> (`chain().map((e, i) => ({ spatialUnitId: e.id, hierarchyLevel: i }))`). Dann stimmen Wert und
> Reihenfolge überein und die Normalisierung ist ein No-op. Sich auf die Array-Reihenfolge allein zu
> verlassen wäre falsch.

## 2. Eine Raumeinheit darf in mehreren Hierarchien liegen

Bestätigt, aus beiden Richtungen. `16397ed6` (Gemeinden Kreis Viersen) war gleichzeitig Mitglied von
A und B, `d60c9a5a` ebenfalls. `GET spatial-units/{id}` liefert dann beide Mitgliedschaften:

```json
"hierarchies": [
  { "hierarchyId": "921f767f…", "hierarchyName": "ZZZ-CLAUDE-TEST-B", "hierarchyLevel": 0,
    "nextUpperSpatialUnitId": null, "nextLowerSpatialUnitId": "15fcddce…" },
  { "hierarchyId": "1ac270dc…", "hierarchyName": "ZZZ-CLAUDE-TEST-A", "hierarchyLevel": 0,
    "nextUpperSpatialUnitId": null, "nextLowerSpatialUnitId": "2b420223…" }
]
```

Die Ebene kann je Hierarchie eine andere sein. `hierarchyName` wird mitgeliefert, eine Auflösung über
die Hierarchienliste ist für die Anzeige also nicht nötig.

## 3. POST antwortet 201 und liefert den vollständigen Datensatz

`POST /spatial-unit-hierarchies` → **201**, Body ist der angelegte
`SpatialUnitHierarchyOverviewType` inklusive `hierarchyId` und aufgelösten `members` (mit
`spatialUnitLevel` und den `nextUpper`/`nextLower`-Verweisen).

**Kein Nachladen nötig** — der Store kann direkt aus der Antwort einfügen.

## 4. Mandantengrenze wird durchgesetzt

`PUT /{hierarchyId}/members` mit einer Raumeinheit eines fremden Mandanten → **400**:

```json
{
  "label": "de.hsbo.kommonitor.datamanagement.api.impl.exception.ResourceNotFoundException",
  "message": "Spatial unit '3377a2ef…' and hierarchy '921f767f…' do not belong to the same mandant. A spatial unit may only be placed into hierarchies of its own mandant.",
  "type": "ResourceNotFoundException"
}
```

Die Zusicherung aus der Beschreibung hält also. Der Client muss die Auswahl trotzdem auf den
Mandanten der Hierarchie einschränken — der Fehlertext ist englisch und nicht für Endnutzer gedacht.

## 5. Namensdublette innerhalb eines Mandanten → 400

`POST` mit einem bereits vergebenen Namen im selben Mandanten → **400**:

```json
{
  "label": "de.hsbo.kommonitor.datamanagement.api.impl.exception.ResourceNotFoundException",
  "message": "Eine Raumeinheiten-Hierarchie mit dem Namen 'ZZZ-CLAUDE-TEST-A' existiert bereits für den Mandanten '52N'. Vorgang wird abgebrochen.",
  "type": "ResourceNotFoundException"
}
```

Die Eindeutigkeit wird serverseitig geprüft — die Prüfung im Dialog (`uniqueNameValidator`) bleibt
als schnelle Rückmeldung sinnvoll, ersetzt sie aber nicht.

> **Fallstrick: `type` und `label` lügen.** Beide melden `ResourceNotFoundException`, obwohl es sich
> um Validierungsfehler mit Status 400 handelt. **Nicht auf `type` verzweigen** — nur `message` ist
> verwertbar, und die Fehlerhülle ist einheitlich `{ label, message, type }`. Die deutsche Meldung
> in 5 gegenüber der englischen in 4 zeigt außerdem, dass die Sprache je Fehlerpfad unterschiedlich
> ist; für die Anzeige also besser eigene Texte als die durchgereichte `message`.

## 6. `isPublic` beim PUT weglassen heißt `false`, nicht „unverändert"

`PUT /{hierarchyId}` ist ein **echter Vollersatz**:

| Schritt                                        | `isPublic` danach |
| ---------------------------------------------- | ----------------- |
| PUT mit `isPublic: true`                       | `true`            |
| PUT ohne `isPublic` (nur `name` + `mandantId`) | **`false`**       |

Ein Aufruf, der das Feld nicht mitschickt, macht die Hierarchie also stillschweigend privat.
`mandantId` und `isPublic` müssen bei jedem Metadaten-Update mitgesendet werden.

## 7. DELETE: 200, und die Raumeinheiten überleben

`DELETE /{hierarchyId}` → **200** (nicht 204, obwohl die Spec beides anbietet), ohne Body.

Schlusskontrolle nach dem Löschen beider Testhierarchien:

- `GET /spatial-unit-hierarchies` → `[]` (0 Hierarchien, wie zu Beginn)
- alle vier beteiligten Raumeinheiten existieren unverändert, jede wieder mit `hierarchies: []`

Die Zusicherung „The spatial units that were members of the hierarchy are not deleted" hält, und
gelöste Mitglieder fallen zurück in den Zustand „unzugeordnet". Der Ausgangszustand der Instanz ist
damit wiederhergestellt.

---

## 8. Zusammenfassung für die Umsetzung

| Frage (Schritt 3)                      | Antwort                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------- |
| 1. `hierarchyLevel` 0- oder 1-basiert? | 0-basiert, dicht; Server normalisiert. **Wert schlägt Array-Reihenfolge.** |
| 2. POST-Status und Body                | 201 mit vollständigem Datensatz — kein Nachladen                           |
| 3. Namensdublette                      | 400, deutsche `message`, irreführender `type`                              |
| 4. Mandantenprüfung bei `/members`     | ja, 400 mit englischer `message`                                           |
| 5. Mehrfachzuordnung                   | erlaubt, je Hierarchie eigene Ebene                                        |
| 6. DELETE                              | 200, Raumeinheiten bleiben, fallen zurück auf „unzugeordnet"               |
| 7. `isPublic` beim PUT weglassen       | wird `false` — Vollersatz, immer mitsenden                                 |

---

## 9. Nachtrag aus dem Browser-Durchlauf (2026-09-21)

Der erste Durchlauf der fertigen Seite gegen eine echte Instanz — angelegt, Ebenen eingehängt,
umsortiert, entfernt, umbenannt, `isPublic` umgeschaltet, gelöscht. Die Demo steht danach wieder bei
0 Hierarchien, keine Raumeinheit trägt eine Zuordnung.

**Die Demo-Konfiguration zeigt auf die falsche Instanz.** `client-app-config` liefert
`apiUrl = https://demo.kommonitor.de.52north.org/data-management/`; die Hierarchien liegen unter
`/data-management-v6/`. Gegen die konfigurierte Instanz antwortet
`GET /management/spatial-unit-hierarchies` mit **404**, und die Raumeinheiten kommen im alten Schema
(`nextUpper-/nextLowerHierarchyLevel`, **kein** `mandantId`, **kein** `hierarchies`). Für den
Durchlauf wurde die Config im Browser lokal auf `/data-management-v6/` umgebogen; an der Demo wurde
nichts geändert. **Wer die Seite gegen die Demo-Konfiguration öffnet, sieht eine leere Seite ohne
jeden Hinweis** — der 404 verschwindet in der Regel „Lesen resolvt leer".

**Der POST ist nicht atomar.** Ein Anlegen mit einer mandantenfremden Ebene antwortet 400
(`Spatial unit '…' and hierarchy '…' do not belong to the same mandant`) — die Hierarchie ist zu
diesem Zeitpunkt aber **schon angelegt** und bleibt als leerer Datensatz zurück (im Test
`50ec5f1c-…`, 0 Mitglieder). Der Fehlertext nennt ihre Id. Ergänzt Befund 4: die Mandantenprüfung
greift, aber erst nach dem Anlegen.

> **Wie der Client seit dem 2026-09-21 damit umgeht.** Abstellen kann er es nicht. Der Anlege-Dialog
> bietet nur noch Ebenen des gewählten Mandanten an, dieser Weg in den Fehler ist damit zu; und
> `HierarchyStoreService.addHierarchy` lädt nach jedem fehlgeschlagenen POST die Liste neu, sodass
> ein trotzdem angelegter leerer Datensatz sichtbar wird und gelöscht werden kann. Am 2026-09-21
> gegen die Demo belegt: POST 400 → GET 200 → die leere Hierarchie steht in der Liste.

**Was bestätigt ist**, jeweils gegen den öffentlichen Endpunkt gegengelesen:

| Vorgang                    | Client                                        | Server                                                            |
| -------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Anlegen mit 3 Ebenen       | 1× POST                                       | `hierarchyLevel` 0/1/2, `nextUpper`/`nextLower` korrekt verkettet |
| ▼ eine Ebene               | 1× `PUT /members` mit ganzer Liste            | Reihenfolge deckungsgleich — Index als Wert wirkt                 |
| Ebene einfügen / entfernen | je 1× `PUT /members`                          | deckungsgleich                                                    |
| Umbenennen                 | `PUT /{id}` mit `name`+`mandantId`+`isPublic` | 200, Mitglieder unberührt                                         |
| `isPublic` auf `false`     | dito                                          | 200, verschwindet aus `/public/…`                                 |
| Löschen                    | `DELETE /{id}`                                | 200, Raumebenen fallen auf „unzugeordnet" zurück                  |

Fehlerfall geprüft: ein abgelehnter PUT lässt den Store unverändert und meldet
`Hierarchie „…" konnte nicht aktualisiert werden.` als Toast.

---

## 10. Hierarchien ohne Ebenen sind erlaubt

Die Spec macht `members` beim `POST /spatial-unit-hierarchies` **optional** —
`SpatialUnitHierarchyPOSTInputType` verlangt nur `name` und `mandantId`, das Feld ist beschrieben
als „optional ordered list of existing spatial units". Pflicht ist die Kette also nicht.

Dass der Server eine Hierarchie ohne Mitglieder auch **hält und ausliefert**, zeigt Befund 9 von der
anderen Seite: nach dem abgelehnten Anlegen mit mandantenfremder Ebene bleibt genau so ein
Datensatz zurück (`50ec5f1c-…`, 0 Mitglieder) und steht im folgenden `GET` in der Liste. Ein leerer
Datensatz ist für die Instanz also kein Sonderfall, sondern ein normaler Zustand — die Ebenen kommen
später über `PUT /{id}/members` dazu.

> **Noch nicht direkt gemessen:** ein `POST` ganz ohne `members` gegen die laufende Instanz. Beleg
> ist bislang die Spec plus der leere Datensatz aus Befund 9. Falls die Instanz wider Erwarten
> anders antwortet, gehört das hier ergänzt.

**Konsequenz für den Client (seit 2026-09-22):** Der Anlege-Dialog verlangt keine Ebene mehr — die
Ebenenkette trägt keinen Stern, und `canSubmit` hängt nur noch am Metadaten-Formular. Ist die Kette
leer, lässt `HierarchyStoreService.addHierarchy` `members` aus dem Body weg, statt ein leeres Array
zu schicken. Das erlaubt außerdem das Anlegen, wenn der Mandant gerade keine freie Raumebene hat.

---

## 11. `PUT /spatial-units/{spatialUnitId}/hierarchies` — gemessen (2026-09-22)

Der Endpunkt, über den das **Bearbeiten-Modal** der Raumeinheiten seine Zuordnungen schreibt, war
bis hierher unbelegt (`OFFENE_PUNKTE.md` A9). Gemessen am 2026-09-22 gegen dieselbe v6-Instanz, über
den `HttpClient` der laufenden App. Aufbau: zwei Testhierarchien `ZZZ-CLAUDE-A9-A` (drei Mitglieder)
und `ZZZ-CLAUDE-A9-B` (eines) im Mandanten `52N`, Mitglieder ausschließlich Raumeinheiten, die
vorher in **keiner** Hierarchie lagen. Beide Hierarchien sind am Ende gelöscht; die Instanz steht
wieder bei den zwei Hierarchien, die vorher da waren, und alle acht berührten Raumeinheiten bei
`hierarchies: []`.

### 11.1 Belegter Level → der Server fügt ein und schiebt nach

Kette `[U1:0, U2:1, U3:2]`, dann `PUT /spatial-units/U4/hierarchies` mit
`[{ hierarchyId: A, hierarchyLevel: 1 }]` — Level 1 hält U2:

```
L0 U1   L1 U4   L2 U2   L3 U3
```

**U4 landet auf 1, die übrigen rutschen um eins nach unten.** Der Server verschiebt also, er lehnt
weder ab noch glättet er zu einem Duplikat. Damit ist die Rechnung des Clients
(`membershipLevelForRow`: Index in der Kette **ohne** die bearbeitete Ebene) genau die richtige —
„über einer Ebene" trifft die Position, die der Dialog anzeigt.

### 11.2 Umzug innerhalb einer Kette = entfernen und neu einfügen

Kette `[U4, U5, U2, U1, U3]`, `PUT U5 → level 1` aus Position 3: U5 steht danach auf 1, die Ebenen
dazwischen rücken auf. Es gibt keinen Tausch-, sondern reines Einfüge-Verhalten.

### 11.3 Entfernen schließt die Lücke

`PUT U5 → []` (leere Liste): U5 ist raus, die Kette ist wieder dicht von 0 an durchnummeriert. Auch
ein Weglassen **einer** Hierarchie aus der Liste entfernt genau diese Mitgliedschaft — belegt daran,
dass ein `PUT U1 [A:2]` die vorher bestehende Mitgliedschaft in B ersatzlos gelöscht hat. Der
Endpunkt ist also tatsächlich Vollersatz, wie die Spec sagt.

### 11.4 Mehrelementige Liste

`PUT U1 [{A, 2}, {B, 0}]` schreibt beide Mitgliedschaften in einem Call. Kein Sonderverhalten.

### 11.5 Level über dem Ende wird geklemmt, die Nachbarn-Form wird ignoriert

- `hierarchyLevel: 99` bei sechs Mitgliedern → die Ebene landet auf 6, dem Ende der Kette.
- Ein Body in der **Nachbarn-Form** (`{ hierarchyId, nextUpperSpatialUnitId }`, kein
  `hierarchyLevel`) wird mit 200 angenommen — die Ebene hängt danach aber **am Ende**, nicht unter
  dem genannten Nachbarn. Zweimal geprüft, mit verschiedenen Nachbarn.

**Konsequenz:** Dieser Endpunkt versteht nur die Level-Form. Die Nachbarn-Form ist allein Sache von
`SpatialUnitPOSTInputType.hierarchies` (Anlege-Weg). Der Client muss die Position hier also selbst
ausrechnen — er tut es, und nach 11.1 richtig.

### 11.6 Der Antwortstatus hängt an `isPublic` der Raumeinheit — und lügt

**Das ist der wichtigste Befund dieses Abschnitts.** Derselbe Aufruf antwortet je nach Datensatz
unterschiedlich:

| Raumeinheit                     | `isPublic` | Status                                            |
| ------------------------------- | ---------- | ------------------------------------------------- |
| Test Bezirke FID                | true       | 200 mit dem aktualisierten `SpatialUnitOverview`  |
| Stadtbezirksebene Essen         | true       | 200                                               |
| Stadtteile Essen, Test Bezirke  | true       | 200                                               |
| Gemeinden RSK                   | false      | **404** `ResourceNotFoundException`               |
| Berlin - LOR - Bezirksregionen  | false      | **404**                                           |
| Berlin - LOR - Planungsräume    | false      | **404**                                           |
| Stadt Viersen Sozialräume       | false      | **404**                                           |

Acht Raumeinheiten, acht Treffer, deterministisch über mehrere Wiederholungen — und unabhängig
davon, ob der Call etwas ändert, nichts ändert, einfügt, umzieht oder entfernt. Die Fehlerhülle
nennt die Id der Raumeinheit:

```json
{ "label": "…ResourceNotFoundException", "message": "The requested resource '416b573a-…' was not found.", "type": "ResourceNotFoundException" }
```

**Die Schreiboperation läuft dabei vollständig durch.** Jede der oben beschriebenen Messungen
(11.1–11.4) ist teils über solche 404-Antworten entstanden; das anschließende `GET` auf die
Hierarchie zeigt jedes Mal den gewünschten Zustand. Ein `GET /spatial-units/{id}` auf dieselbe Id
antwortet außerdem 200 — die Raumeinheit ist also sehr wohl da.

Naheliegende Deutung (nicht im Servercode nachgeprüft): der Endpunkt liest den Datensatz nach dem
Schreiben über einen Weg zurück, der nur öffentliche Raumeinheiten findet, und dessen
`ResourceNotFoundException` schlägt auf die Antwort durch.

**Konsequenz für den Client:** Das Bearbeiten-Modal wertet den Fehler aus und meldet
`MSG.HIERARCHY_UPDATE_FAILED` — bei jeder **nicht öffentlichen** Raumeinheit also eine Fehlermeldung
auf eine gespeicherte Änderung. Auf der Demo betrifft das 32 von 47 Raumeinheiten.

---

## 12. Importer: er schreibt in die **alte** Instanz — A8 ist auf der Demo nicht messbar (2026-09-22)

Zu `OFFENE_PUNKTE.md` A8. Gemessen am 2026-09-22 gegen den Importer der Demo
(`https://demo.kommonitor.de.52north.org/data-importer/importer/`), mit demselben Request, den der
Anlege-Dialog absetzt: Converter `GeoJSON`, Datenquelle `INLINE` (zwei Polygone), zwei
Hierarchie-Zuordnungen im `spatialUnitPostBody` — eine in Nachbarn-Form mit
`nextUpperSpatialUnitId`, eine nur mit `hierarchyId`.

**Trockenlauf** (`dryRun: true`) → 200, `importedFeatures: ["A1","A2"]`, `errors: []`.
**Echter Lauf** (`dryRun: false`) → 200, zusätzlich `uri` mit der neuen `spatialUnitId`.

Das Gegenlesen bringt den eigentlichen Befund:

| Abfrage                                      | Ergebnis                                                  |
| -------------------------------------------- | --------------------------------------------------------- |
| `GET /spatial-units` auf **v6**              | unverändert 47 Datensätze — der neue ist **nicht** dabei  |
| `GET /spatial-units/{neueId}` auf **v6**     | 403                                                        |
| `GET /spatial-units` auf `…/data-management/` | **48** Datensätze, `ZZZ-CLAUDE-A8` ist dabei              |
| `GET /spatial-units/{neueId}` dort            | 200, mit `nextUpperHierarchyLevel` / `nextLowerHierarchyLevel` (beide `null`) und **ohne** `hierarchies` |

**Der Importer der Demo schreibt in die alte Data-Management-Instanz**, nicht in die v6 daneben. Die
Zielinstanz kennt Hierarchien überhaupt nicht — sie führt noch das alte Feldpaar. Die Frage aus A8,
ob der Importer `spatialUnitPostBody.hierarchies` durchreicht, lässt sich an der Demo deshalb **nicht
beantworten**: es gibt dort kein Gegenüber, das das Feld auswerten könnte. Dass er es **annimmt**
(keine Fehlermeldung, keine Warnung), ist alles, was diese Messung zeigt.

Der Testdatensatz ist in der alten Instanz wieder gelöscht (danach erneut 47), die beiden
Testhierarchien in v6 ebenfalls.

### 12.1 Was daraus für die Entwicklungsumgebung folgt

Der Client liest seit A7 aus `…/data-management-v6/`, weil `env_local.js` die `apiUrl` umbiegt.
`targetUrlToImporterService` kommt aber unverändert aus der App-Konfiguration der Demo — und dieser
Importer bedient die alte Instanz. **Wer in dieser Aufstellung eine Raumebene über den Admin-Dialog
anlegt, schreibt sie in ein Backend, aus dem die Anwendung gar nicht liest.** Der Dialog meldet
Erfolg, die Liste bleibt, wie sie war. Dasselbe gilt für alle anderen Importwege (Georessourcen,
Indikatoren, Batch-Update).

Das ist keine Eigenheit der Hierarchien, sondern die zweite Hälfte von A7: die `apiUrl` ist
umgebogen, der Importer nicht — und der Importer kennt seine Zielinstanz aus seiner eigenen
Konfiguration, die der Client nicht setzen kann.
