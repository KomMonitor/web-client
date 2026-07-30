# Reporting unterstützt keine kategorischen (`isCategorical`) Indikatoren

Stand: 2026-07-30, Branch `feature/migration-bootstrap`. **Analyse — noch nicht umgesetzt.**

## Context

Mit der qualitativen Klassifikation (`ClassificationType = 'QUALITATIVE'`, siehe
[`classification.models.ts`](../app/components/ngComponents/models/classification.models.ts))
können Indikatoren jetzt statt numerischer Klassen (Brew/Breaks) diskrete Kategorien
(`CategoricalClassificationItem[]`) tragen. `isQualitativeMapping(mapping)` erkennt das
anhand von `classificationType === 'QUALITATIVE'` oder eines befüllten `categoricalData`-Arrays.

Auf der Hauptkarte ist das bereits vollständig verdrahtet:

- `IndicatorClassificationService.buildClassification()`
  ([`indicator-classification.service.ts:119-124`](../app/services/indicator-classification-service/indicator-classification.service.ts#L119-L124))
  erkennt `isCategorical` **vor** dem numerischen Setup (MOV/Dynamic/regional_default) und
  schaltet komplett auf den `'categorical'`-Style-Branch um.
- `VisualStyleHelperServiceNew.styleCategorical()` /
  `resolveCategoricalColor()` ([`visual-style-helper.service.ts:827-860`](../app/services/visual-style-helper-service/visual-style-helper.service.ts#L827-L860))
  matcht den Feature-Wert als String gegen `categoricalData` statt gegen numerische `breaks`.
- Die Legende (`KommonitorLegendComponent.isQualitativeClassification` /
  `categoricalClassification`, `kommonitor-legend.component.ts:137-151`) rendert die
  Kategorien-Zeilen separat von der numerischen Klassenliste.

**Das Reporting-Feature** (`app/components/ngComponents/userInterface/reporting/`) geht diesen
Pfad nicht mit. Es hat eine eigene, parallele, rein numerische Klassifikations-Pipeline und ruft
weder `IndicatorClassificationService.buildClassification()` noch `styleCategorical()` auf. Ein
Indikator mit `isCategorical`/`QUALITATIVE`-Mapping lässt sich aktuell zwar in einen Report
einfügen, produziert dort aber falsche Farben, eine leere/falsche Legende und sinnlose
Kennzahlen (Durchschnittswerte über Kategorie-Strings).

## Betroffene Dateien

| Datei                                                                                                                                                           | Rolle                                                                                                | Numerische Annahme                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [`indicatorAdd/indicator-add.component.ts`](../app/components/ngComponents/userInterface/reporting/indicatorAdd/indicator-add.component.ts)                     | Indikator-Auswahl + zentrale Klassifikations-Vorbereitung (`prepareDiagrams`)                        | liest `numClasses`/`colorBrewerSchemeName`, ruft `setupDefaultBrew`/`setupDynamicIndicatorBrew`, rechnet Zeitreihen-Differenzen |
| [`diagram-helper-service.service.ts`](../app/services/diagram-helper-service/diagram-helper-service.service.ts)                                                 | Pro-Feature-Einfärbung + ECharts-`visualMap`-Legende, gemeinsam für Live-Karte und Reporting genutzt | `getColorForFeature`/`getColorFromBrewInstance`/`setupVisualMap` kennen nur `breaks`/`colors`                                   |
| [`generate-report/generate-report.component.ts`](../app/components/ngComponents/userInterface/reporting/generate-report/generate-report.component.ts)           | Rendert die von obigem bereits erzeugten Artefakte (PNG/Tabellen) in PDF/PPTX/DOCX                   | keine eigene Klassifikationslogik, erbt aber alle Fehler der Vorstufen                                                          |
| [`reportingOverview/reporting-overview.component.ts`](../app/components/ngComponents/userInterface/reporting/reportingOverview/reporting-overview.component.ts) | Orchestriert die Seitenvorschau, baut die Reachability-Legende                                       | keine eigene Klassifikationslogik                                                                                               |
| [`reporting-background-processor/`](../app/components/ngComponents/userInterface/reporting/reporting-background-processor/)                                     | reines DOM-Positioning für Off-Screen-Rendering                                                      | nicht betroffen                                                                                                                 |

## Fundstellen im Detail

### 1. Indikator-Auswahl hat keinen Klassifikations-Typ-Filter

`indicator-add.component.ts` baut die Auswahllisten (`initialize()`,
[`indicator-add.component.ts:319-335`](../app/components/ngComponents/userInterface/reporting/indicatorAdd/indicator-add.component.ts#L319-L335))
ausschließlich aus `IndicatorMetadataStoreService.displayableIndicators`, sortiert nach Namen.
Es gibt keinen Filter/Hinweis auf `defaultClassificationMapping.classificationType` — ein
kategorischer Indikator ist im Dropdown nicht von einem numerischen zu unterscheiden und
durchläuft denselben Code-Pfad.

### 2. `prepareDiagrams()` behandelt jeden Indikator als numerisch

[`indicator-add.component.ts:3618-3709`](../app/components/ngComponents/userInterface/reporting/indicatorAdd/indicator-add.component.ts#L3618-L3709):

- Zeile 3663–3666: liest `indicator.defaultClassificationMapping.numClasses` (Default 5) und
  `.colorBrewerSchemeName` bedingungslos — beide Felder sind bei einer kategorischen Mapping
  typischerweise leer/undefiniert (die eigentlichen Daten stehen in `categoricalData`, siehe
  [`classification.models.ts:39-53`](../app/components/ngComponents/models/classification.models.ts#L39-L53)).
- Zeile 3671: `classifyMethod = envConfigService.defaultClassifyMethod` — rein numerisches Konzept
  (Equal Interval/Quantile/Jenks…).
- Zeile 3674–3694: ruft `visualStyleHelperService.setupDefaultBrew(...)` und
  `.setupDynamicIndicatorBrew(...)` auf — **nicht** `IndicatorClassificationService.buildClassification()`,
  d.h. die dort bereits vorhandene `isQualitativeMapping`-Weiche wird umgangen.
- `setupDefaultBrew`
  ([`visual-style-helper.service.ts:193-224`](../app/services/visual-style-helper-service/visual-style-helper.service.ts#L193-L224))
  konvertiert jeden Feature-Wert über `getIndicatorValue_asNumber` — Kategorie-Strings werden zu
  `NaN`/Müll-Klassen.
- Zeitreihen-Modus (Zeile 3632–3647): rechnet `DATE_to - DATE_from` (Subtraktion) und schreibt
  `indicator.indicatorType` zwangsweise auf `DYNAMIC_*` um — für kategorische Werte ergibt die
  Subtraktion `NaN`, und „dynamisch" hat für Kategorien keine Bedeutung.
- `calculateAvg()` / `calculateChange()`
  ([`indicator-add.component.ts:3558`](../app/components/ngComponents/userInterface/reporting/indicatorAdd/indicator-add.component.ts#L3558),
  [`:3586`](../app/components/ngComponents/userInterface/reporting/indicatorAdd/indicator-add.component.ts#L3586)):
  summieren nur `typeof value === 'number'`-Werte; bei kategorischen Daten ist das Ergebnis ein
  bedeutungsloses `0`, das unkommentiert in Balkendiagramm und Datentabelle landet.
- Manuelles Re-Scannen von `visualMap.pieces` für Flächenhervorhebung und Durchschnitts-Balken
  ([`indicator-add.component.ts:2865-2896, 3105-3132`](../app/components/ngComponents/userInterface/reporting/indicatorAdd/indicator-add.component.ts#L2865-L2896)):
  `piece.min <= value && value < piece.max` matcht nie einen Kategorie-String → Fallback-Grau.
- Boxplot-/Liniendiagramm-Code (Zeile 3251–3305) füttert Rohwerte direkt in ECharts'
  numerischen `boxplot`-Transform — dafür gibt es kein kategorisches Äquivalent.

### 3. Pro-Feature-Einfärbung im `DiagramHelperService` kennt keine Kategorien

- `getColorForFeature()`
  ([`diagram-helper-service.service.ts:279-372`](../app/services/diagram-helper-service/diagram-helper-service.service.ts#L279-L372))
  → `getColorFromBrewInstance()`
  ([`diagram-helper-service.service.ts:392`](../app/services/diagram-helper-service/diagram-helper-service.service.ts#L392))
  laufen über ein numerisches `breaks`-Array (`<`/`==`-Vergleiche). Es existiert kein zu
  `styleCategorical()` äquivalenter Zweig, obwohl `VisualStyleHelperServiceNew` bereits einen hat.
- `prepareAllDiagramResources()`
  ([`diagram-helper-service.service.ts:559-580`](../app/services/diagram-helper-service/diagram-helper-service.service.ts#L559-L580))
  schreibt dieses Farbergebnis direkt in `itemStyle.color` jedes ECharts-Series-Items — **die
  gerenderte Kartengrafik selbst** wäre bei kategorischen Indikatoren falsch, unabhängig von der
  Legende.
- `setupVisualMap()`
  ([`diagram-helper-service.service.ts:1600`](../app/services/diagram-helper-service/diagram-helper-service.service.ts#L1600))
  baut die ECharts-`pieces`-Legende ausschließlich aus `.breaks`/`.colors` — bei einem
  kategorischen Indikator bliebe `pieces` leer, die Legende im Reportbild wäre leer.

### 4. Reporting hat kein kategorisches Legenden-Konzept

Reporting kennt zwei „Legenden", beide ohne Bezug zur Klassifikation:

1. Für Zeitstempel-/Zeitreihen-Templates ist die Legende **kein eigenes Seitenelement**, sondern
   das numerische ECharts-`visualMap`-Widget, das direkt in das Kartenbild eingebacken ist
   (Kommentar `// case "mapLegend" can be ignored since it is included in the map if needed`,
   [`indicator-add.component.ts:439`](../app/components/ngComponents/userInterface/reporting/indicatorAdd/indicator-add.component.ts#L439)).
2. Für Reachability-Templates gibt es eine separat gezeichnete Isochronen-Legende
   (`DiagramHelperService.createReportingReachabilityMapLegend`,
   [`diagram-helper-service.service.ts:2295`](../app/services/diagram-helper-service/diagram-helper-service.service.ts#L2295)) —
   fachlich völlig unabhängig von Indikator-Klassifikation.

Die bereits vorhandene kategorie-fähige Legende der Hauptkarte
(`KommonitorLegendComponent`/`KommonitorClassificationComponent`) wird von Reporting nirgends
importiert oder wiederverwendet.

### 5. `generate-report.component.ts` / `reporting-overview.component.ts`

Beide Komponenten führen keine eigene Klassifikationslogik aus — sie rastern/layouten nur, was
`prepareDiagrams()` vorher erzeugt hat (`page.generatedData?.echarts?.[...]`,
`pageElement.tableData`). Sie erben dadurch alle oben genannten Fehler unverändert, benötigen
aber selbst keine Änderung an der Klassifikationslogik.

## Notwendige Änderungen (noch nicht umgesetzt)

1. **Klassifikations-Typ in der Indikator-Vorbereitung berücksichtigen.** In `prepareDiagrams()`
   die numerischen Aufrufe (`setupDefaultBrew`, `setupDynamicIndicatorBrew`, Lesen von
   `numClasses`/`colorBrewerSchemeName`/`classifyMethod`) hinter eine
   `isQualitativeMapping(indicator.defaultClassificationMapping)`-Prüfung stellen — analog zu
   `IndicatorClassificationService.buildClassification()`.
2. **Pro-Feature-Einfärbung kategorie-fähig machen.** `DiagramHelperService.getColorForFeature`/
   `getColorFromBrewInstance` um einen kategorischen Zweig erweitern (oder `prepareDiagrams()`
   direkt `styleCategorical()`/`buildClassification()` aufrufen lassen), damit `itemStyle.color`
   je Feature aus `categoricalData` statt aus numerischen Brews stammt.
3. **Kategorische Legende fürs Reportbild.** `setupVisualMap()` um einen Kategorie-Zweig
   erweitern (Pieces je Kategorie-Wert/-Farbe) oder ein eigenes Legenden-Artefakt für
   kategorische Indikatoren erzeugen — die numerische ECharts-`pieces`-Struktur kann
   `categoricalData` nicht direkt abbilden.
4. **Numerische Kennzahlen absichern.** `calculateAvg`/`calculateChange` sowie die
   `Durchschnitt`-Zeilen in Balkendiagramm und Datentabelle für kategorische Indikatoren
   auslassen oder durch eine sinnvolle Alternative (z. B. Kategorie-Häufigkeit/Modus) ersetzen,
   statt einer bedeutungslosen `0`.
5. **Zeitreihen-/Boxplot-/Liniendiagramm-Seitenelemente einschränken.** Der
   „als Zeitreihe darstellen"-Modus (Differenzberechnung), Liniendiagramm und Boxplot sind
   inhärent numerisch; für kategorische Indikatoren in der `indicatorAdd`-UI ausblenden oder ein
   eigenes Set an Seitenelement-Typen anbieten (z. B. nur statische Karte + Datentabelle +
   Kategorie-Häufigkeitsdiagramm).
6. **Manuelles `visualMap.pieces`-Rescanning korrigieren.** Die Flächenhervorhebung und die
   Durchschnitts-Balken-Einfärbung in `indicator-add.component.ts` auf den kategorischen
   Farb-Resolver umstellen statt auf den numerischen `piece.min <= value < piece.max`-Scan.
7. **Klassifikationstyp in der Auswahl-UI sichtbar machen.** Damit Punkt 5 (angepasste
   Seitenelement-Optionen) UI-seitig umgesetzt werden kann, muss `indicatorAdd` den
   `classificationType` des gewählten Indikators kennen, statt es erst downstream stillschweigend
   scheitern zu lassen.

**Reihenfolge:** 1 und 2 sind Voraussetzung für alles Weitere (ohne sie ist jede Kartengrafik für
kategorische Indikatoren schlicht falsch eingefärbt). 3 macht die Grafik nutzbar. 4–7 sind
UI-/Kennzahlen-Politur, die verhindert, dass sinnlose Werte im fertigen Report auftauchen.
