# Bootstrap-3-Altlasten — offene Punkte

Stand: 2026-09-02, Branch `feature/migration-bootstrap`.
Basis: `bootstrap@5.3.8` (`angular.json` lädt `bootstrap.min.css` + `bootstrap.bundle.min.js`,
davor `jquery.min.js`), dazu FontAwesome 6.7.2 Free (`css/all.min.css`). Es gibt kein
Bootstrap 3 mehr im Baum — wohl aber Markup, das noch gegen Bootstrap 3 geschrieben ist.

**Die Abschnitte A und B sind vollständig abgearbeitet und daher entfernt.** Aus A: die
funktionslosen Tabs des Info-Modals samt Layout (A2, Commit `82126933`), die Glyphicons ohne
Font und die Ausgabepfade für `poiSymbolBootstrap3Name` (A6 und E, Commit `4095d845`), die
nie initialisierten Tooltips (A4, Commit `716c1504`) sowie die restlichen veralteten
`data-*`-Attribute inklusive des toten `bootstrap-validator`-Hooks und des jQuery-getriebenen
Language-Switcher-Dropdowns (A1, A3 und A5). Aus B: die 42 toten Layout-Klassen und die
58 `table-condensed`. Damit gibt es keine offenen *Funktions*fehler aus der
Bootstrap-Migration mehr; was übrig ist, ist Optik und Struktur. Was beim Aufräumen nur
*versteckt* statt gelöst wurde, steht in Abschnitt F.

**Methodik:** Für jede gefundene Klasse wurde geprüft, ob es dafür *irgendwo* noch eine
Definition gibt — in `node_modules/bootstrap/dist/css/bootstrap.min.css`, in `app/app.scss`,
in einem Component-SCSS oder in `customizedExternalLibs/`. Nur wo nichts davon zutrifft, ist
die Klasse als „tot" eingestuft. Zählungen beziehen sich auf echtes Markup
(`class="…"` in Templates bzw. in TS erzeugte HTML-Strings), Doku-Kommentare sind
herausgerechnet. Alle Zahlen wurden am 2026-09-02 nachgemessen; der Erststand hatte an
mehreren Stellen zu hoch gezählt.

**Grobbild:** Übrig ist nur noch der Kleinkram aus Abschnitt C, dazu die drei
Einzelvorhaben aus F. Echte *Funktions*fehler sind keine mehr offen.

---

## C. Strukturelle Reste

| Fundstelle                                                | Problem                                                                                             |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `app.scss:1451` — `.nav-tabs > li > a { … }`               | Selektor auf Bootstrap-3-Tab-Struktur. Das Markup nutzt inzwischen `.nav-item`/`.nav-link`.          |
| 3 × `<li class="nav-item active">`                         | `active` gehört an den `.nav-link`. In `kommonitor-data-setup:42`, `poi:80`, `indicator-radar:25`.   |
| 8 × `class="close"`                                        | Bootstrap 5: `btn-close` (und kein `&times;`-Textknoten mehr nötig). Teilweise durch eigenes CSS in `sidebar.component.scss:24` und `kommonitor-legend.component.scss:47` abgefangen, sonst ungestylt. Je 1 in `script-code`, `admin-topics-management`, `kommonitor-legend`, `generate-report`, `reporting-modal`, `reachability-scenario-modal`, `sidebar`, `spatial-unit-notification-modal`. |
| 3 × `alert-dismissable`                                    | Bootstrap-3-Schreibweise, seit Bootstrap 4 `alert-dismissible`. Alle drei in `adminScriptManagement`: `script-delete-modal:44,64` und `script-code:36`. |
| `progress-bar progress-bar-striped **active**` (3 ×)       | `progress-bar-striped` gibt es in Bootstrap 5 weiterhin, die Streifen erscheinen. Nur die Animation fehlt: `active` heißt jetzt `progress-bar-animated`. In `reporting-progress-banner:18`, `reporting-overview:357`, `indicator-add:1024`. |
| `export-menu-button.component.html:11` — `badge badge-pill` | `badge-pill` ist seit Bootstrap 5 weg (`rounded-pill`). Farbe und Position kommen aus `.export-item-badge`, es fehlt nur die runde Form. |
| `dropdown-menu` mit nackten `<li>`-Kindern                  | 4 Stellen: `georesource-edit-metadata-modal:160,191,260` und `georesource-add-modal:211` (Marker-/Symbolauswahl). Bootstrap 5 stylt nur `.dropdown-item`. |

---

## D. Bewusste Shims — erledigt, hier nur noch zur Einordnung

Diese Klassen sind ebenfalls Bootstrap 3, aber im Projekt absichtlich nachdefiniert. Sie
sehen bei einer Suche wie Altlasten aus, sind aber load-bearing:

- **`.help-block`** (296 ×) — zentral definiert in `app.scss:3984`, inklusive
  `.help-block.with-errors` (`:3989`) für `<app-form-error>`. Der Kommentar darüber erklärt
  die Entscheidung.
- **`.form-group`** (~295 ×, fast ausschließlich Admin) — seit dem Shim in `app.scss:4004`
  ebenfalls zentral, direkt neben `help-block` und nach demselben Muster. `margin-bottom:
  1rem`, der Bootstrap-4-Wert, auf den fünf der sechs früheren Component-Kopien von sich aus
  gekommen waren. Die Kopien sind entfernt; erhalten blieben nur die beiden
  pane-spezifischen Regeln in `config-editor-panes` (fette Label, 20px im
  Stacked-Columns-Media-Query).
- **`.checkbox-inline`** (23 ×) — als Grid-Layout neu definiert in `app.scss:4063`.
- **`.list-group-root`** (51 ×) — keine Bootstrap-Klasse, sondern projekteigen, gestylt ab
  `app.scss:476`.

---

## F. Einzelposten aus den behobenen Abschnitten

Punkte, die beim Aufräumen aufgefallen sind und bewusst *nicht* mitbehoben wurden, weil sie
über Bootstrap-Altlasten hinausgehen.

### F1. Guided Tour ist verloren gegangen — derzeit versteckt

Kein Bootstrap-Thema, aber der Grund, warum zwei Trigger im UI ohne Funktion dastanden. Das
Feature war auf `origin/master` voll implementiert: `bootstrap-tour` in der `package.json`,
`startGuidedTour` / `goToGuidedTourStep` / Schritt-Inhaltsverzeichnis und ~10
`redrawGuidedTourElement`-Broadcasts in `kommonitor-user-interface.component.js`. Bei der
Migration ist die Implementierung samt Dependency verloren gegangen; stehen geblieben waren
der Button im Info-Modal und der Trigger in der Kopfzeile
(`user-interface.component.html:55-61`), beide ohne Click-Handler.

Beide sind seit Commit `82126933` auskommentiert — mit `fas fa-play` statt Glyphicon im
auskommentierten Markup, damit ein Reaktivieren nicht wieder ein unsichtbares Icon ergibt.
**Offen: die Tour portieren oder die beiden Trigger endgültig entfernen.**

### F2. Iconpicker ohne FontAwesome-Iconset

`georesource-add-modal.component.ts:361-362` nutzt `icon: 'glyphicon-home'` /
`iconset: 'glyphicon'`. Das ist **kein** Altlast-Fundort im engeren Sinn: der Picker ist ein
*Eingabe*pfad und muss gültige Bootstrap-3-Namen für `poiSymbolBootstrap3Name` liefern —
speicherte er FontAwesome-Namen, wäre der API-Vertrag für alle anderen Clients gebrochen.
Die Data-Management-API schreibt das Format vor
(`app/models/data-management-api.generated.ts:2445,2485,2528`: *„the name of a Bootstrap 3
glyphicon symbol"*), der Client kann das Feld nicht abschaffen.

Das Problem ist die Darstellung: `customizedExternalLibs/bootstrap-iconpicker` registriert
in `bootstrap-iconpicker.js:46-50` `fontawesome5`-Iconsets und nutzt `fontawesome5` sogar
als eigenen Default (`:69`), liefert aber unter `js/iconset/` **keine**
`iconset-fontawesome-5*.js` mit — nur 4.x und `iconset-glyphicon`. Nicht vorhandene
Iconsets fallen auf `ICONSET_EMPTY` zurück. Und weil die Glyphicon-Font fehlt, zeigt die
Vorschau im Picker leere Kästchen.

**Offen:** entweder die Glyphicon-Font nachliefern oder das Picker-Rendering über
`pipes/icon-translate.pipe.ts` mappen, ohne das gespeicherte Format zu ändern.

### F3. Der WFS-Farbwähler in der POI-Sidebar ist tot

Aufgefallen bei `input-group-addon` (Abschnitt B). Vier Stellen in
`georesource-dataset-table:399,417` und `georesource-list-tab:512,530` bauen eine
`div.input-group.colorpicker-component` aus einem `<input class="form-control">` und einem
Swatch-`<span>` — das Markup von `bootstrap-colorpicker`.

Nur: **die Library wird nirgends geladen.** `bootstrap-colorpicker` steht in der
`package.json`, taucht aber weder in den `scripts` von `angular.json` auf noch in einem
`import` unter `app/`; die einzigen `.colorpicker()`-Aufrufe stehen auskommentiert in
`kommonitor-data-import.component.ts:109-121`. Dazu trägt der `<input>` ein
`style="display: none"`. Sichtbar ist also nur das Swatch-Kästchen, dessen `title`
„Klicken, um die Farbe anzupassen" verspricht — passieren tut beim Klick nichts.

Die Umbenennung auf `input-group-text` war trotzdem gefahrlos: `bootstrap-colorpicker`
würde zwar per Default-Selektor `'.add-on, .input-group-addon'` genau dieses Element als
Trigger suchen (`node_modules/bootstrap-colorpicker/dist/js/bootstrap-colorpicker.js:704`),
aber ohne geladene Library greift der Selektor ohnehin nie.

**Offen:** entweder den Farbwähler an `customElements/color-picker` anschließen oder die
vier Blöcke samt Dependency entfernen.

---

## Vorgeschlagene Reihenfolge

1. **C** — Kleinkram (`btn-close`, `alert-dismissible`, `progress-bar-animated`,
   `rounded-pill`, `active` am `nav-link`), sammelbar in einem Commit. Der Close-Button des
   Topics-Alerts hängt inzwischen an einem Angular-Handler, ihm fehlt nur noch `btn-close`.
2. **F1, F2 und F3** — eigene Vorhaben, unabhängig von der Bootstrap-Migration.
