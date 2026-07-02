# Erreichbarkeits-Services zusammenführen — Quick-Calc & Szenario-Assistent teilen sich einen State

Stand: 2026-07-02, Branch `feature/migration-bootstrap`.

## Context

`kommonitorReachability` hat zwei Einstiegspunkte in die Isochronen-Berechnung:

- **Schnellberechnung** direkt auf der Hauptkarte (`KommonitorReachabilityComponent`).
- **Szenario-Assistent**, ein 4-Schritte-Wizard (`ReachabilityScenarioModalComponent` + Steps).

Vor diesem Umbau teilten sich beide Pfade nur sehr wenige Daten und taten dies ineffizient, verteilt über **drei** lose synchronisierte State-Container:

| Service | Pfad | Zeilen | Rolle |
|---|---|---|---|
| `ReachabilityCombinerService` | `app/services/reachability-combiner-service/` | 416 | `BehaviorSubject`-State für die Schnellberechnung (Locations, Ergebnis, Loading) |
| `ReachabilityHelperService` | `app/services/reachbility-helper-service/` (Tippfehler im Ordnernamen) | 703 | Plain (nicht-observable) `settings`-Objekt **und** die eigentliche ORS-Berechnungs-Engine — von **beiden** Pfaden genutzt |
| `ReachabilityScenarioHelperService` | `app/services/reachability-scenario-helper-service/` | 213 | `scenarios$` + `tmpActiveScenario`-Staging-Objekt für die Szenario-Persistenz |

**Konkrete Ineffizienzen:**

- Der Wechsel von Schnellberechnung zu Szenario (`KommonitorReachabilityComponent.createScenario()`) kopierte ~40 Zeilen lang Felder von `ReachabilityCombinerService` einzeln in `ReachabilityHelperService.settings`.
- Speichern/Laden eines Szenarios (`configureActiveScenario`/`setActiveScenario`) machte **3–4 vollständige** `JSON.parse(JSON.stringify(...))`-Deep-Clones, um dieselben Daten zwischen `tmpActiveScenario` und `ReachabilityHelperService.settings` hin- und herzuschieben.
- `fetchPoiResourceGeoJSON` (Combiner) und `fetchGeoJSONForIsochrones` (Helper) dupliziertem denselben POI-GeoJSON-HTTP-Fetch inkl. URL-Aufbau.
- `ReachabilityScenarioHelperService` injizierte `Injector`, um `ReachabilityCombinerService` **lazy** aufzulösen — ein klassischer Zirkulär-DI-Workaround (Combiner → ScenarioHelper direkt, ScenarioHelper → Combiner nur lazy).
- Aus der Fragmentierung resultierte ein echter Bug: Der „Szenario speichern"-Button prüfte `tmpActiveScenario.scenarioName`, das aber für **neue** Szenarien nirgends im laufenden Code befüllt wurde (der Titel wurde stattdessen nur auf `ReachabilityCombinerService.scenarioTitle` geschrieben) — der Button blieb für neue Szenarien dauerhaft deaktiviert.

**Ziel:** Beide Einstiegspunkte arbeiten auf **demselben** Live-Session-State. Die Schnellberechnung ist einfach „eine Session ohne Namen"; ein Szenario daraus zu erstellen hängt nur noch einen Namen an dieselbe Session, statt sie in einen zweiten Service zu kopieren.

## Zielarchitektur

```
ReachabilityStateService        (State + Berechnungs-Engine, ersetzt Combiner + Helper)
        ↑
ReachabilityScenarioHelperService (reine Persistenz: scenarios$, snapshot/restore)
```

Kein Service kennt mehr den jeweils anderen in beide Richtungen — die Zirkularität ist strukturell aufgelöst, nicht nur durch `Injector`-Lazyness kaschiert.

## Umsetzung in drei Schritten

### Stage A — `ReachabilityCombinerService` + `ReachabilityHelperService` → `ReachabilityStateService`

Neuer Service `app/services/reachability-state-service/reachability-state.service.ts` (~1120 Zeilen), der beide alten Klassen **wörtlich zusammenführt** — gleiche Feldnamen, gleiches Verhalten, nur als eine Instanz statt zwei:

- **Session-Modell** (`BehaviorSubject<ReachabilityModel>`, vormals `ReachbilityModel` — Tippfehler korrigiert): Locations/Features, Ergebnis-GeoJSON, Loading-/Szenario-Flags. Getter/Setter (`locations`, `features`, `isochronesGeoJson`, `selectedStartPointLayer`, `selectedStartDate`, `scenarioTitle`, `showOnMainMap`, `isValidCalculation`, …) unverändert erhalten, damit Komponenten-Templates minimal angefasst werden mussten.
- **`settings`** (weiterhin ein loses `any`-Objekt): die detaillierte ORS-/Wizard-Konfiguration — Transit-Modus, Ranges, Datumsauswahl, `locationsArray` usw. — **unverändert aus `ReachabilityHelperService` übernommen**, inklusive aller ~20 Ad-hoc-Felder (`isochroneConfig`, `dateSelectionType*`, `routingStartPointInput`, …).
- **`quickCalcSettings`** (umbenannt aus dem alten Combiner-Feld `settings`): die vereinfachten Einstellungen für die Schnellberechnungs-UI (Slider-Ranges, Transit-Modus-Buttons). Musste umbenannt werden, weil beide alten Services ein Feld namens `settings` hatten — mit unterschiedlicher Form (`quickCalcSettings.ranges` ist ein Array, `settings.isochroneInput` ein Komma-String). Das sind **zwei bewusst getrennte** Namensräume für zwei unterschiedliche UI-Paradigmen (einfacher Slider vs. vollständiger Wizard) und wurden **nicht** zusammengeführt (siehe „Bewusst nicht angefasst" unten).
- Die komplette Berechnungs-Engine (`startIsochroneCalculation`, `createBuffers`, `createIsochrones`, `fetchIsochrones`, `createORSIsochroneRequestBody`, `makeLocationsArrayFromStartPoints`, `attachPoiFeatureIDsToIsochrones`, `checkArrayInput`, `sortBuffers`) 1:1 übernommen, liest/schreibt jetzt direkt `this.settings` statt eines fremden Service-Feldes.
- `startIsochroneCalculationForPoints()` ruft jetzt `this.setIsochronesGeoJson(...)` **direkt** statt `this.injector.get(ReachabilityCombinerService).setIsochronesGeoJson(...)` — der `Injector`-Workaround ist komplett entfernt.
- Dedupe: `fetchPoiResourceGeoJSON`/`fetchGeoJSONForIsochrones` bauen die Georesource-GeoJSON-URL jetzt über eine gemeinsame private `buildGeoresourceGeoJSONUrl(georesourceId, date)` — die beiden Methoden bleiben getrennt (unterschiedliche Datums-/Fehlerbehandlung), aber der doppelte URL-Aufbau ist weg.

**Konsumenten umgestellt** (alle `ReachabilityCombinerService`/`ReachabilityHelperService`-Injektionen → `ReachabilityStateService`): `kommonitor-reachability.component`, `kommonitor-map.component`, `indicator-add.component`, `reachability-scenario-modal.component` + alle 4 Wizard-Steps (`reachbility-scenario-setup`, `reachability-scenario-configuration`, `reachability-poi-in-iso`, `reachability-indicator-statistics`), sowie die reinen Leser `reachability-map-helper.service` und `reachability-coverage-reports-helper.service` (letztere unverändert intern, nur die Injektion umgehängt — bewusst nicht weiter aufgeteilt, siehe unten).

Alte Dateien `reachability-combiner.service.ts`/`reachability-helper.service.ts` (+ Specs) gelöscht; neuer Smoke-Test `reachability-state.service.spec.ts` angelegt.

**Verifikation:** `tsc --noEmit`, `npm run build`, `npm run lint` (0 errors), `npm test` (95/96 Suites grün, 1 vorbestehender Skip) — alle grün.

### Stage B — `ReachabilityScenarioHelperService` auf Snapshot-Persistenz umgestellt

`tmpActiveScenario` (Staging-Objekt mit manuellem Sync in beide Richtungen) komplett entfernt. Stattdessen:

- `ReachabilityStateService.getSnapshot()` — **ein** Deep-Clone des kompletten Live-Sessions als `ReachabilitySessionSnapshot` (Settings, Titel, Isochronen-Ergebnisse, `indicatorStatistics`, `poiDataset`).
- `ReachabilityStateService.restoreSnapshot(snapshot)` — ersetzt den Live-State durch einen Clone des Snapshots.

`ReachabilityScenarioHelperService` ist jetzt eine **reine Repository-Schicht**: `scenarios$`, `addReachabilityScenario()` (= `getSnapshot()` + ablegen), `loadActiveScenario()` (= `restoreSnapshot()` + Event), `cloneReachabilityScenario`, `removeReachabilityScenario`, `exportScenarios`/`importScenarios`. Keine `Injector`-Injektion mehr nötig — die Abhängigkeitsrichtung ist jetzt einseitig (`ScenarioHelper → State`).

`indicatorStatistics` (Job-Tracking für Wizard-Step 4) und `poiDataset` (POI-Metadaten fürs Szenario) sind als Live-Session-Felder auf `ReachabilityStateService` gewandert, statt nur im Staging-Objekt der Persistenz-Schicht zu existieren — sie sind Session-Arbeitsdaten, keine Persistenz-Daten.

**Nebenbefund behoben:** `reachability-indicator-statistics.component.spec.ts` war mit `describe.skip` markiert; die dort dokumentierte Begründung (Komponente referenziert nicht-existentes `pipedData`/`configureActiveScenario`, sei nicht verdrahtet) war **veraltet** — die Komponente ist über `reachability-scenario-modal.component.html` aktiv eingebunden. Nach dem Wegfall von `configureActiveScenario()` (im neuen Design überflüssig, da `getSnapshot()` direkt aus dem Live-State liest) kompiliert die Komponente sauber; der Test wurde entskippt.

**Verifikation:** `tsc --noEmit`, `npm run build`, `npm run lint` (0 errors), `npm test` — **96/96 Suites, 152/152 Tests grün** (der zuvor übersprungene Test läuft jetzt echt mit).

### Stage C — Übergabe Schnellberechnung → Szenario vereinfacht

`KommonitorReachabilityComponent.createScenario()` verweist jetzt einheitlich auf eine lokale `state`-Variable (keine zwei Service-Referenzen mehr) und dedupliziert die vormals in beiden Branches (`fromLayer`/`manual`) wiederholte Zeile `settings.selectedStartPointLayer = selectedStartPointLayer` zu einer gemeinsamen Zeile nach dem `if`/`else`.

> **Bewusst nicht weiter vereinfacht:** Die ursprüngliche Idee war, `createScenario()` auf „nur noch Titel setzen + Modal öffnen" zu reduzieren. Das ist **nicht** ohne Verhaltensänderung möglich, weil `quickCalcSettings` (einfache Slider-UI) und `settings` (vollständige Wizard-Konfiguration) unterschiedliche Datenformen haben (z. B. Array vs. Komma-String für Ranges, zusätzliche Datums-/Modus-Felder nur im Wizard). Die Übersetzung zwischen beiden Formen ist inhärente Fachlogik der zwei unterschiedlichen UI-Paradigmen, keine Altlast der Service-Fragmentierung — eine echte Vereinheitlichung wäre ein UI-Redesign, keine Service-Reorganisation, und wurde daher **nicht** umgesetzt, um das Verhalten unverändert zu lassen.

**Verifikation:** `tsc --noEmit`, `npm run build`, `npm run lint` (0 errors), `npm test` — **96/96 Suites, 152/152 Tests grün**.

## Ergebnis

- 5 Services → 4 (2 gelöscht, 1 neu, 1 verschlankt); Netto **−1658 / +361 Zeilen**.
- Keine funktionale Verhaltensänderung außer dem behobenen „Szenario speichern"-Button-Bug (Stage B) und dem entskippten Test.
- `Reachbility`-Tippfehler auf Service-Ebene korrigiert (`ReachabilityHelperService` → `ReachabilityStateService`); Komponenten-/Ordner-Tippfehler (`reachbility-scenario-setup`, `ReachbilityScenarioSetupComponent`) bewusst **nicht** angefasst — höherer Diff (Ordner-/Selektor-/Routing-Referenzen) für einen rein kosmetischen Fix, außerhalb des Scopes dieser Service-Reorganisation.
- `ReachabilityMapHelperService` und `ReachabilityCoverageReportsHelperService` (Leaflet-Rendering bzw. PDF-Export) wurden **nicht** intern restrukturiert — nur ihre Injektionen/Aufrufstellen wurden mechanisch auf `ReachabilityStateService` umgehängt. Beide sind mit >1000 Zeilen weiterhin Kandidaten für eine eigene Aufteilung nach dem in `PRIO7_GOD_SERVICE_SPLIT.md` etablierten Rezept, falls das gewünscht ist.

## Wiederholbares Muster (falls weitere Konsolidierung ansteht)

1. Konsumenten **aller** zu vereinigenden Services vollständig auflisten (`git grep` nach dem Klassennamen, TS **und** HTML-Templates — Angular-Template-Bindings werden von reinen TS-Greps leicht übersehen).
2. Bei gleichnamigen Feldern mit unterschiedlicher Bedeutung (`settings` in beiden Alt-Services) **vor** dem Merge einen eindeutigen Namen für mindestens eines der beiden Felder festlegen.
3. Zirkuläre Abhängigkeiten (hier: `Injector`-Lazy-Lookup) beim Merge auflösen, nicht nur mitverschieben — meist verschwindet die Zirkularität von selbst, wenn die beiden Enden in denselben Service wandern.
4. Bei Persistenz-Services mit Staging-Objekt (`tmpActiveScenario`-Muster): auf Snapshot/Restore gegen den Live-State umstellen, statt Felder einzeln zu synchronisieren.
5. Nach jedem Schritt `tsc --noEmit` + `npm run build` + `npm run lint` + `npm test` grün, bevor der nächste beginnt (wie in `PRIO7_GOD_SERVICE_SPLIT.md`).
