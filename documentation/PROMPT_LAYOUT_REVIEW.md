# Prompt-Vorlage: Layout-Review eines Admin-Menüpunkts

Diese Datei ist eine **Vorlage**, kein fertiger Auftrag. Vor dem Einsatz in einer neuen Session:

- `XYZ` durch den tatsächlichen Menüpunkt ersetzen (z. B. „Georessourcen", „Raumebenen",
  „Indikatoren", „Skripte", „Rollen", „Themen", „Konfiguration").
- Den Abschnitt „Grenzen" anpassen, falls doch eine eigene Testinstanz zur Verfügung steht —
  gegen die geteilte Demo-Instanz bleibt es beim Nur-Lesen.

Alles unterhalb der Trennlinie ist der Prompt, der in die neue Session kopiert wird.

---

## Aufgabe

Schaue dir im Admin-Bereich unter dem Menü-Punkt **XYZ** die ganze View und die Dialoge im Bezug
auf das Layout an. Überprüfe auf einheitliche Schrift, Dialoggröße und einheitlichen
Gesamteindruck. Wenn dir etwas auffällt, benenne es, aber mache noch keine Änderungen.

## Wie du dir den Client ansiehst

Du siehst dir die Oberfläche **im echten Browser** an, nicht nur im Quelltext. Der Ablauf:

1. **Dev-Server prüfen.** Läuft auf `http://localhost:8000`. Wenn nichts antwortet, starte ihn mit
   `npm start` im Hintergrund und warte, bis der erste Build durch ist. Ein laufender Server kann
   ein **veraltetes Bundle** ausliefern — wenn sich dein Eindruck nicht mit dem Quelltext deckt,
   ist das die erste Verdächtige.
2. **Chrome mit offenem Debug-Port.** Der Nutzer startet (oder hat bereits gestartet):

   ```
   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/kommonitor-chrome
   ```

   Das eigene `--user-data-dir` ist wichtig — ein bereits laufendes Chrome-Profil nimmt den Port
   sonst nicht an.
3. **Der Nutzer meldet sich selbst an.** Die Keycloak-Maske (Realm `kommonitor-demo-dev`, Rolle
   `kommonitor-creator`) füllt **der Nutzer**, nicht du. Du tippst kein Passwort. Frage nach, ob
   die Anmeldung steht, und mache erst danach weiter. Ohne Token antwortet das Demo-Backend mit
   401 und die Views bleiben leer.
4. **Du hängst dich per CDP an dieselbe Instanz.** `playwright-core` ist vorhanden:

   ```js
   import { chromium } from 'playwright-core';
   const browser = await chromium.connectOverCDP('http://localhost:9222');
   const page = browser.contexts()[0].pages()[0];
   ```

   Skripte legst du im Scratchpad-Verzeichnis ab, nicht im Repo. `browser.close()` am Ende trennt
   nur die Verbindung, es schließt dem Nutzer nicht das Fenster.
5. **Messen statt raten.** Screenshots (`page.screenshot`) für den Gesamteindruck, dazu
   `getComputedStyle` für die harten Zahlen: `font-family`, `font-size`, `font-weight`,
   `line-height`, Abstände, Dialogbreiten. „Wirkt kleiner" ist keine Feststellung — „14px hier
   gegen 16px zwei Dialoge weiter" schon.

## Fallstricke, die dich sonst Zeit kosten

- **Property-Bindings hinterlassen keine DOM-Attribute.** `[formControl]`, `[formGroupName]`,
  `[hidden]` stehen nicht im HTML. Suche über `id`, `aria-label`, `placeholder` oder Text.
- **Komponenten live auslesen** geht im Dev-Build über `window.ng.getComponent(el)`; nach
  Änderungen von außen `window.ng.applyChanges(el)`.
- **AG Grid virtualisiert** Zeilen *und* Spalten. Was du nicht siehst, ist oft nicht im DOM.
  Angepinnte Spalten liegen in `.ag-pinned-left-cols-container`, der Rest im Center-Container.
- **Dialoggrößen** kommen nicht aus dem CSS, sondern aus dem Aufruf:
  `modalService.open(..., { size, modalDialogClass, windowClass })`. Wenn ein Dialog aus der Reihe
  fällt, vergleiche zuerst diese Aufrufe untereinander.
- **Alte `.multiStepForm`-Regeln** in `app.scss` blenden Fieldsets aus (`fieldset:not(:first-of-type)
  { display: none }`) und schlagen `[hidden]`. Sie sind Altlast, aber noch aktiv benutzt — nicht
  als Fehler melden, ohne geprüft zu haben, wer daran hängt.
- **Nur `npm run build` typprüft.** `npm test` (Jest) und `npm run lint` tun es nicht.

## Worauf du bei der Durchsicht achtest

**Schrift**
- Gleiche Familie, Größe und Gewicht bei gleichrangigen Elementen (Überschriften, Labels,
  Hilfetexte, Tabellenzellen, Knöpfe)?
- Eigene `font-size`/`font-family` direkt am Element statt über die gemeinsamen Klassen?
- Zeilenhöhen und Textfarben (auch die gedämpften) untereinander stimmig?

**Dialoge**
- Breite (`sm`/`lg`/`xl`/Standard) passend zum Inhalt und konsistent zwischen verwandten Dialogen?
- Kopf-, Rumpf- und Fußzeile gleich aufgebaut; Knöpfe in gleicher Reihenfolge, gleicher Farbe,
  gleicher Ausrichtung?
- Verhalten bei kleinem Fenster: scrollt der Rumpf oder die ganze Seite? Läuft etwas über?
- Abstände innen (Padding, Abstände zwischen Feldgruppen) einheitlich?

**Gesamteindruck**
- Wirken View und Dialoge wie aus einem Guss oder wie zwei Baustellen?
- Ausrichtung von Werkzeugleiste, Tabelle, Filtern; Ränder und Weißraum gleichmäßig?
- Ladezustände, leere Zustände und Fehlermeldungen im gleichen Stil?
- Icons in einheitlicher Größe und einheitlichem Satz?

**Quervergleich**
- Stelle denselben Bereich neben mindestens einen anderen Admin-Menüpunkt. Vieles fällt erst im
  Vergleich auf — und der Vergleich sagt dir auch, welche Seite die Ausnahme ist.

## Grenzen

- **Nur ansehen.** Keine Formulare abschicken, nichts anlegen, nichts löschen, nichts hochladen.
  Die Demo-Instanz ist geteilt.
- **Keine Codeänderungen.** Auch keine „schnellen" CSS-Korrekturen — erst berichten.
- **Nicht committen.**

## Ergebnis

Eine Liste der Auffälligkeiten, je Punkt: **wo** (Datei plus Zeile, wenn du die Ursache im Code
findest), **was** (mit gemessenen Werten, nicht nur dem Eindruck) und **wie stark** es aus der
Reihe fällt. Trenne dabei klar, was gegen den Rest der Anwendung verstößt, von dem, was dir bloß
persönlich nicht gefällt.
