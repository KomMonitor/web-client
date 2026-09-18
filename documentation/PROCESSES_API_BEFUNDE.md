# OGC Processes API — was die Instanz tatsächlich antwortet

Stand: 2026-09-18, Branch `feature/migration-bootstrap`.

**Wozu dieses Dokument:** Die Processes API liefert **kein brauchbares Schema** — `/openapi` und
`/conformance` sind 404, obwohl das Landing-Dokument sie verlinkt. Die Typen im Client
(`components/ngComponents/models/schedules.models.ts`, `.../jobs.models.ts`) sind deshalb von Hand
gepflegt, und ihre Grundlage sind die hier festgehaltenen echten Antworten. Wer die Typen ändert
oder einen neuen Endpunkt anbindet, findet hier die Belege.

**Methode:** eingeloggter Abruf gegen `https://demo.kommonitor.de.52north.org/processes-api/`. Die
Requests liefen über den `HttpClient` der laufenden App, das Token hat der reguläre
`AuthInterceptor` angehängt. Grundgesamtheit: **24 Prozesse, 21 Schedules, 68 Jobs**.

Zwei **schreibende** Durchläufe sind dokumentiert (Abschnitt 4); beide wurden vollständig
zurückgenommen.

---

## 1. Prozesse

`GET processes` · `GET processes/{id}` — **öffentlich, ohne Token**.

### Zwei Schreibweisen, je nach Richtung

Das ist der Befund, an dem die meisten Fehler hängen:

| Wo                                             | Schreibweise                              |
| ---------------------------------------------- | ----------------------------------------- |
| `GET processes` → `id`                         | `KmIndicatorMultiply` (PascalCase)        |
| **Angelegt** wird über `processes/{id}/schedule` | `KmIndicatorMultiply` (PascalCase)        |
| `GET schedules` → `processID`                  | `km_indicator_multiply` (`apiName`)       |
| `GET jobs` → `processID`                       | `km_indicator_multiply` (`apiName`)       |

Geschrieben wird also mit PascalCase, gemeldet wird `apiName`. Beides ist serverseitig belegt
(Abschnitt 4).

**Eine `apiName → id`-Map ist damit Pflicht**, sobald aus einem Schedule oder Job der Prozess-Titel
oder die Beschreibung gebraucht wird. Alle 21 Schedules lösen darüber vollständig auf (21/21).
Zwei Fallstricke:

- **Naive Konvertierung scheitert.** `KmGeoresourceCountPointsWithinPolygon` trägt den `apiName`
  `km_georesource_count_pointsWithinPolygon` — gemischt snake/camel, nicht algorithmisch ableitbar.
- **Der `apiName` steht nur in der Einzelbeschreibung.** In `GET processes` ist
  `additional_parameters` leer; erst `GET processes/{id}` enthält
  `additional_parameters.parameters[name=kommonitorUiParams].value[0].apiName`. Die Map kostet also
  einen Request pro Prozess — einmalig und cachebar (`ProcessCatalogStoreService`).

### Welche Prozesse die UI betreffen

19 der 24 tragen einen `apiName`: **15 × `KmIndicator*`, 4 × `KmGeoresource*`**. Ohne `apiName`
bleiben `HelloWorld`, `ExportTest`, `SingleExport`, `MultipleExport`, `SpatialUnitExport` — die
vier Export-Prozesse sind dieselben, die `exporting.service.ts:78-80` ohnehin direkt anspricht.

Jobs referenzieren auch Prozesse **ohne** `apiName` (`single_export`, `spatial_unit_export`); dort
greift die Map nicht, die Job-Tabelle braucht den rohen `processID` als Fallback.

### Deklarierte Inputs

Vollständige Inventarliste über alle 19 UI-Prozesse — Grundlage für die generierte Eingabemaske und
für jede Abhängigkeitsprüfung:

| Input                                                            | Referenziert      |
| ----------------------------------------------------------------- | ----------------- |
| `target_indicator_id`                                             | Ziel-Indikator    |
| `computation_id`, `computation_id_numerator`, `..._denominator`   | Basis-Indikator   |
| `computation_ids`, `computation_ids_with_polarity`                | Basis-Indikatoren |
| `reference_id`                                                    | Referenzindikator |
| `georesource_id`                                                  | Georessource      |
| `target_spatial_units`                                            | Raumebenen        |
| `target_time`, `execution_interval`                               | Steuerung         |
| `compMeth`, `compProp`, `comp_filter`, `aggregation_method`, `computation_method`, `temporal_type`, `number_of_temporal_items`, `num_value`, `reference_date` | keine Datensätze |

Die Prozessbeschreibung ist damit die Quelle der Eingabefelder — eine feste Liste im Client wäre
falsch.

---

## 2. Schedules

`GET schedules` · `GET schedules/{id}` — **Token erforderlich**.

```ts
export interface ProcessSchedule {
  type: 'process';
  processID: string; // apiName, snake_case — s. Abschnitt 1
  scheduleID: string; // UUID
  jobIDs: string[]; // UUIDs, dazwischen kurzlebige Slugs — s. unten
  status: string; // READY im Betrieb, NOT_READY direkt nach dem Anlegen
  scheduleCreated: string; // ISO 8601 mit Offset, z.B. 2026-05-29T08:43:53.823389+00:00
  scheduleUpdated: string;
  scheduleActive: boolean; // nur true beobachtet
  scheduleCron: string; // z.B. "0 0 1 */3 *"
  inputs: ProcessScheduleInputs;
}
```

Auf **allen 21** Schedules war **jedes** dieser Felder gesetzt — keines ist optional. Die Antwort
kommt in der Hülle `{ schedules: [...] }`, auch beim Einzelabruf (dort mit genau einem Eintrag).

Die Zahlen hier sind ein Stand, kein Vertrag: am 2026-09-18 waren es 22 Schedules, weiterhin alle
`READY` und `scheduleActive: true`.

### `jobIDs` enthält Nicht-UUIDs

Von 36 Einträgen über alle Schedules sind 17 UUIDs (36 Zeichen) und **19 kurze Slugs** mit 12–22
Zeichen: `denim-swallow`, `hysterical-terrier`, `optimistic-tarsier`, `thundering-sloth`,
`curious-hornet`, `pygmy-ferret`, `cryptic-parrot`, `mega-narwhal`, …

Die Slugs tauchen in `GET jobs` nicht auf, zeigen also ins Leere. Ein Längenfilter trennt sauber —
zwischen 22 und 36 Zeichen liegt nichts.

### `inputs`: welche Felder, und in welcher Form

Auf allen 21 Schedules vorhanden: `target_time`, `execution_interval`, `target_indicator_id`,
`target_spatial_units`. Je nach Prozess dazu `computation_ids` (7×), `computation_method` /
`aggregation_method` / `computation_ids_with_polarity` / `georesource_id` (je 6×), `reference_id`
(6×), `compMeth` / `compProp` (je 5×), `computation_id` (2×), sowie einmalig `comp_filter`,
`temporal_type`, `number_of_temporal_items`, `reference_date`.

**Zwei Formregeln, die sich aus der Prozessbeschreibung nicht ablesen lassen** und nur aus den
gespeicherten Schedules hervorgehen — `schedule-input-builder.util.ts` setzt sie um:

1. **Nur manche Inputs stecken in `{ value: … }`.** Die Regel ist *nicht* „Objekt ⇒ eingepackt":
   `compMeth` ist im Schema als `type: object` deklariert und wird trotzdem flach gespeichert.
   Eingepackt sind `target_time`, `execution_interval` und `comp_filter`. Bei
   `computation_ids_with_polarity` trägt nicht die Liste die Hülle, sondern **jeder Eintrag**:
   `[{ value: { ID, POLARITY } }]`.
2. **Enum-Inputs werden als blanker `apiName`-String gespeichert** — `"MEAN"`, `"ZSCORE"`, `"SUM"`,
   `"YEARS"` —, obwohl das Schema sie als `type: object` mit `{apiName, displayName}`-Optionen
   deklariert. Das Objekt ist für das Dropdown, der String geht über die Leitung.

---

## 3. Jobs

`GET jobs` · `GET jobs/{id}` · `GET jobs/{id}/results` — **Token erforderlich**.

```ts
export interface ProcessJob {
  type: 'process';
  processID: string; // apiName
  jobID: string; // UUID
  status: string; // successful | failed beobachtet; OGC kennt zusätzlich
  // accepted | running | dismissed
  message: string | null; // Fehlertext bei failed — der einzige Ort dafür
  progress: number | null; // durchweg null
  parameters: {
    negotiated_execution_mode: string;
    generated_outputs: unknown;
    requested_response_type: string;
  };
  job_start_datetime: string;
  job_end_datetime: string;
  links: Array<{ href: string; rel: string; type: string | null; title?: string }>;
}
```

Antwort in der Hülle `{ jobs: [...] }`.

### `limit` und `offset` wirken nicht

`jobs?limit=50`, `jobs?limit=500` und `jobs?limit=100&offset=136` liefern **alle dieselben 68
Jobs**, und die `links` der Antwort enthalten kein `next`. Die Liste kommt immer vollständig und
wächst unbegrenzt; begrenzt werden muss clientseitig (`JobOverviewService.MAX_JOBS`).

### `results` gibt es nur für erfolgreiche Jobs

Ein fehlgeschlagener Job antwortet mit **400**:
`{"code":"InvalidParameterValue","type":"InvalidParameterValue","description":"job failed"}`.
Details dürfen also nicht blind nachgeladen werden — der Fehlertext steht ohnehin in `job.message`.

### `jobSummary`: am echten Payload verifiziert (2026-09-18)

Lange gab es auf der Demo **keinen einzigen erfolgreichen Indikator-Job** — 8 von 68 erfolgreich,
alle `single_export` / `spatial_unit_export`, deren `results` nur `{file, status, userId}` liefert.
Am 2026-09-18 wurde der Schedule `86233dc8-…` (`km_indicator_promille`, Ziel „Test Prozess -
KmIndicatorPromille") von Hand angestoßen; er lief in unter 20 Sekunden **erfolgreich** durch. Damit
liegt erstmals ein echtes `jobSummary` vor.

Nebenbefund: derselbe Schedule war am 1.9.2026 noch gescheitert, unverändert. Die 60 Fehlschläge
sind also **kein Client-Problem**, sondern ein Zustand der Instanz, der zwischenzeitlich behoben
wurde.

Beobachtete Antwort (`GET jobs/{id}/results`): `{ jobSummary: […], resultData: […] }`, `jobSummary`
mit einem Eintrag je Raumeinheit:

```json
{
  "spatialUnitId": "6c49621f-…",
  "modifiedResource": "https://…/management/indicators/b1f64ce7-…/6c49621f-…",
  "numberOfIntegratedIndicatorFeatures": 9,
  "integratedTargetDates": [],
  "errorsOccurred": [
    {
      "type": "missingTimestamp",
      "affectedResourceType": "INDICATOR",
      "affectedDatasetId": "f3a69877-…",
      "affectedTimestamps": ["2023-12-31", "2024-12-31", "2022-12-31"],
      "affectedSpatialUnitFeatures": [],
      "errorMessage": "Timestamps are missing for INDICATOR with ID f3a69877-…."
    }
  ]
}
```

**Der Payload widerspricht dem deklarierten Schema an zwei Stellen** — `GET processes/{id}`
deklariert unter `outputs.jobSummary`, was der Server liefern will:

| | Schema sagt | Payload sendet | Client |
| --- | --- | --- | --- |
| Fehlertyp | `MISSING_TIMESTAMP` … | **`missingTimestamp`** … | akzeptiert beide |
| `errorsOccurred` | Array **von** Arrays | **flache Liste** | flacht eine Ebene ab |
| `errorMessage` | required | vorhanden und gefüllt | wird angezeigt |
| `affectedResourceType` | `INDICATOR` / `GEORESOURCE` | `INDICATOR` | case-insensitiver Vergleich |

Masters camelCase-Annahme war also richtig und das Schema an dieser Stelle irreführend. Weil beide
Seiten auseinanderlaufen, bleibt die Toleranz im Client bestehen — sie kostet sechs Zeilen und
überlebt, welche Seite sich auch bewegt.

`jobSummary` ist ein Array von Objekten mit `spatialUnitId`, `modifiedResource` (URI, vom Client
ungenutzt), `numberOfIntegratedIndicatorFeatures` (integer), `integratedTargetDates[]` (date) und
`errorsOccurred`.

Zum Schema selbst: **alle 20** Berechnungsprozesse deklarieren `errorsOccurred` doppelt
verschachtelt, die vier Export-Prozesse (`ExportTest`, `MultipleExport`, `SingleExport`,
`SpatialUnitExport`) haben gar kein `jobSummary`. Die Doppelung ist auch kein Generator-Artefakt —
in derselben Beschreibung sind `resultData.indicatorValues` und dessen `valueMapping` einstufig.
Sie ist schlicht falsch: der Server sendet flach.

Die sechs Typen und ihre Zusatzfelder:

| `error.type` (Schema)          | Zusatzfelder                    |
| ------------------------------ | ------------------------------- |
| `MISSING_TIMESTAMP`            | `affectedTimestamps[]`          |
| `MISSING_DATASET`              | —                               |
| `MISSING_SPATIAL_UNIT`         | —                               |
| `MISSING_SPATIAL_UNIT_FEATURE` | `affectedSpatialUnitFeatures[]` |
| `DATAMANAGEMENT_API_ERROR`     | —                               |
| `PROCESSING_ERROR`             | —                               |

Alle sechs tragen zusätzlich `affectedDatasetId` (uuid), `affectedResourceType` (`INDICATOR` /
`GEORESOURCE`; der Client vergleicht case-insensitiv) und `errorMessage`.

---

## 4. Schreiboperationen

### `POST processes/{id}/schedule`

Die Prozessbeschreibung **bewirbt diesen Endpunkt nicht** — verlinkt ist nur
`.../processes/{id}/execution` (rel `…/1.0/execute`). Der Link fehlt, der Endpunkt nicht:

| Probe                                       | Antwort                          |
| ------------------------------------------- | -------------------------------- |
| `GET processes/KmIndicatorSum/schedule`     | **405** Method Not Allowed       |
| `OPTIONS processes/KmIndicatorSum/schedule` | 200, **`Allow: OPTIONS, POST`**  |
| `OPTIONS schedules`                         | 200, `Allow: OPTIONS, HEAD, GET` |

> **Achtung beim 405:** `GET processes/Nonexistent/schedule` antwortet ebenfalls mit 405. Das 405
> kommt vom Routen-Muster `/processes/<str>/schedule`, nicht davon, dass der Prozess existiert. Wer
> daraus schließt „dieser Prozess ist schedulebar", irrt.

**Round-Trip (2026-09-17, auf Freigabe, vollständig zurückgenommen):** Ziel war `Test Processes API`
(`b3339d4f-…`), ein COMPUTATION-Indikator **ohne** bestehenden Schedule — ein belegter Ziel-Indikator
hätte einen echten Schedule verdrängt (s. unten). Cron `0 3 1 1 *`, damit im Testfenster nichts
feuert. Vorher 21 Schedules, nachher wieder dieselben 21 mit identischen IDs.

| Aufruf                                                         | Antwort                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `POST processes/KmIndicatorSum/schedule` mit `{ "inputs": … }` | **200**, `{"scheduling_id": "0a89c40b-…"}`                                          |
| `GET schedules`                                                | 22 Einträge, der neue mit `status: "NOT_READY"`                                     |
| `DELETE schedules/{id}`                                        | **200**, `{"scheduleID": …, "status": "DISMISSED", "message": "Schedule dismissed"}` |

Drei Details, die aus Masters Code nicht hervorgehen, weil er die Antworten verwirft:

1. **Die neue ID heißt `scheduling_id`** — snake_case, nicht `scheduleID`, wie dieselbe Größe
   überall sonst heißt. Wer die Antwort auf `scheduleID` ausliest, bekommt `undefined`.
2. **`status` kennt `NOT_READY`.** Auf allen bestehenden Schedules war nur `READY` zu sehen; ein
   frisch angelegter startet als `NOT_READY` und wechselt von allein — s. den zweiten Round-Trip.
3. **Löschen ist ein Dismiss** mit eigener Antwort, kein leeres 204.

**Zweiter Round-Trip (2026-09-18, auf Freigabe, vollständig zurückgenommen):** derselbe
Ziel-Indikator, angelegt als `8963e560-…`, nur um den Statuswechsel zu beobachten. `GET
schedules/{id}` im 15-Sekunden-Takt:

| nach | `status`    | `scheduleActive` | `jobIDs` |
| ---- | ----------- | ---------------- | -------- |
| 0 s  | `NOT_READY` | `true`           | 0        |
| 15 s | `READY`     | `true`           | 0        |

**`NOT_READY` ist also ein Durchgangszustand von Sekunden, kein Zustand, den die UI behandeln
müsste** — und `scheduleActive` steht von der ersten Antwort an auf `true`. Das Anlegen hat keinen
Job ausgelöst (`jobIDs` blieb leer), der Cron `0 3 1 1 *` feuerte erwartungsgemäß nicht. Vorher wie
nachher 22 Schedules.

**Body-Vertrag:** `{ "inputs": { … } }` mit genau den Feldern, die die Prozessbeschreibung unter
`inputs` deklariert, in der Form aus Abschnitt 2. Die Werte kommen unverändert zurück.

**Höchstens ein Schedule je Ziel-Indikator.** Master löscht den bestehenden vor dem Anlegen
(`script-add-modal.component.js:212-214`); der Client tut dasselbe
(`ScheduleDraftService.submit()`).

### `POST schedules/{id}/execution`

Stößt einen Lauf außerhalb des Cron-Plans an. **Die Antwort enthält keine Job-ID** — der neue Job
taucht erst kurz darauf in den `jobIDs` des Schedules auf. `ScheduleExecutionService` pollt darauf.

### `DELETE schedules/{id}`

S. Round-Trip oben: 200 mit Dismiss-Antwort.

### Ändern lässt sich ein Schedule nicht

`OPTIONS schedules/{id}` meldet `HEAD, GET, OPTIONS, DELETE`; `PATCH` und `PUT` antworten mit **405**
und derselben `allow`-Liste. Es gibt also keinen Weg, einen bestehenden Schedule zu ändern oder zu
pausieren — wer einen Cron oder einen Input korrigieren will, löscht und legt neu an, und genau das
tut `ScheduleDraftService.submit()`.

---

## 5. Auth und Fehlerformen

| Endpunkt                     | ohne Token |
| ---------------------------- | ---------- |
| `processes`, `processes/{id}` | 200        |
| `schedules`                  | **401**    |
| `jobs`                       | **401**    |

Die 401-Antwort:

```
HTTP/2 401
www-authenticate: bearer error="missing_authorization", …
access-control-allow-origin: *

{"error": "missing_authorization", "error_description": "Missing \"Authorization\" in headers."}
```

Sauber abfangbar — und nötig, weil KomMonitor ohne Login startet: lesende Zugriffe in
`ProcessesApiService` liefern bei Fehlern leere Ergebnisse statt zu werfen, schreibende werfen.

**Ausgeloggter Start verifiziert (2026-09-18).** In einem frischen Browser-Kontext ohne
Keycloak-Session läuft der Bootstrap durch: Karte, Indikator, Klassifikation und Legende stehen,
`GET schedules` antwortet mit 401, das bleibt eine Konsolenmeldung
(`Could not fetch process schedules`) und die Schedule-Liste bleibt leer.

Dabei fiel ein Fehler auf, der den ausgeloggten Betrieb vorher unmöglich machte:
`AuthService.ensureValidToken()` prüfte nur, ob der Keycloak-Adapter existiert. Nach
`onLoad: 'check-sso'` existiert er auch ohne Login — nur ohne Token. Der erste Request durch den
`AuthInterceptor` rief damit `updateToken()` auf einer Sitzung auf, die es nicht gibt; der Reject
führte in `login()`, und der anonyme Besucher landete auf der Keycloak-Maske statt in der Anwendung.
Master hatte diesen Fall abgedeckt (`app.js:358`: `if (Auth.keycloak.token && …)`), der Client prüft
jetzt wieder auf das Token.

**`/openapi` und `/conformance` sind 404**, obwohl das Landing-Dokument sie als `service-desc` bzw.
`conformance` verlinkt. Daher dieses Dokument.

---

## 6. Befunde über Masters Client-Code

Beim Abgleich mit den echten Antworten sind drei Stellen aufgefallen, an denen `master` das eigene
Datenmodell falsch liest. Sie sind hier festgehalten, damit sie beim nächsten Blick in den
Master-Code nicht für bare Münze genommen werden.

1. **`computation_ids_with_polarity` wird falsch ausgelesen.** Die echte Form ist
   `[{ value: { ID, POLARITY } }]`; master liest im Indikator-Löschdialog `item.ID` direkt auf dem
   Wrapper und bekommt `undefined`. Die Abhängigkeitsprüfung übersieht damit genau die
   Leitindikatoren-Schedules, für die sie gedacht ist.
2. **Die Hierarchie-Builder sind halb migriert.** `buildHeadlineIndicatorHierarchy` und
   `buildComputationIndicatorHierarchy` (`kommonitor-data-exchange-service.module.js:1603 ff.`)
   keyen ihre Skript-Map auf `scriptMetadata.indicatorId` — ein Feld, das ein Schedule nicht hat
   (s. Abschnitt 2). Die Map bleibt leer, `baseIndicators` ist durchgängig `[]`, obwohl die
   Basis-Indikatoren zwei Zeilen später korrekt aus `inputs.computation_ids` gelesen würden.
3. **Die Abhängigkeitsprüfung übersieht drei Inputs:** `reference_id` („Referenzindikator",
   deklariert z. B. von `KmIndicatorShare`), `computation_id_numerator` und
   `computation_id_denominator`.

---

## 7. Was unbelegt bleibt

Ein Punkt — und der ist vom Client aus nicht zu belegen: **`scheduleActive`** war auf jedem
beobachteten Schedule `true`, auch in der ersten Antwort nach dem Anlegen. Auf `false` bringen kann
ihn der Client nicht, weil es keine ändernde Methode gibt (s. Abschnitt 4). Das Feld setzt allein
die Serverseite; wer `false` sehen will, muss dort ansetzen.
