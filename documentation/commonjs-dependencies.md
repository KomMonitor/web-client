# CommonJS-Abhängigkeiten

Stand: 2026-08-27, verifiziert gegen `angular.json` und einen vollständigen `npm run build`.

Der Angular-Build (`@angular-devkit/build-angular:application`, **esbuild** — der Webpack-`browser`-Builder
ist seit 2026-06-17 abgelöst) erkennt manche Pakete als CommonJS/AMD und meldet
„optimization bailout"-Warnungen. Freigegebene Pakete stehen in `angular.json` unter
`build.options.allowedCommonJsDependencies` (**20 Einträge**, jeweils der Paketname — Angular
reduziert Deep-Imports wie `codemirror/mode/...` bzw. `core-js/modules/...` auf den Paketnamen).

**Die Liste ist nicht mehr vollständig:** der Build meldet weiterhin 9 Warnungen (siehe unten).

## Freigegeben und direkt in unserem Code verwendet

| Dep                       | Verwendet in                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **codemirror**            | Admin-Config-Editoren (`adminAppConfig`, `adminControlsConfig`, `adminFilterConfig`, `configEditor`) + `script-code.component`             |
| **docx**                  | Reporting: `reporting-overview`, `generate-report` — DOCX-Export                                                                           |
| **dom-to-image-more**     | `pdf-export.service`, `reachability-map-helper.service`, `leaflet-screenshot-cache-helper.service`, `kommonitor-map.component`             |
| **file-saver**            | `pdf-export.service`, `generate-report`, `kommonitor-map.component` — Datei-Download                                                       |
| **jspdf-autotable**       | `pdf-export.service` (Seiteneffekt-Import), `generate-report` — Tabellen im PDF-Export                                                     |
| **jstat**                 | `indicator-classification.service`, `kommonitor-balance.component` — Statistik (Klassifikation/Balance)                                    |
| **jszip**                 | `pdf-export.service`, `generate-report` — ZIP (u. a. Shapefile-Export)                                                                     |
| **leaflet.markercluster** | `app/util/leaflet-cluster.ts` (UMD-Plugin, Seiteneffekt-Import), genutzt von `reachability-map-helper.service`, `kommonitor-map.component` |
| **papaparse**             | `file-helper.service` — CSV-Parsing                                                                                                        |
| **jquery**                | als globales `window.$` über den Script-Eintrag in `angular.json` geladen (nicht mehr per Import aus `main.ts`)                            |

## Freigegeben, aber nur transitiv (kein eigener Import)

| Dep                         | Eltern-Lib                                    |
| --------------------------- | --------------------------------------------- |
| **core-js** (14 Sub-Module) | `canvg` (SVG-Rendering, via jsPDF/PDF-Export) |
| **raf**                     | `canvg`                                       |
| **rgbcolor**                | `canvg`                                       |
| **js-sha256**               | `keycloak-js` (Auth)                          |
| **@turf/jsts**              | `@turf/buffer`                                |
| **concaveman**              | `@turf/convex`                                |
| **earcut**                  | `@turf/tesselate`                             |
| **fast-deep-equal**         | `@turf/line-overlap`                          |
| **rbush**                   | `@turf/clusters-dbscan`                       |
| **skmeans**                 | `@turf/clusters-kmeans`                       |

## Offen: 9 nicht freigegebene Nicht-ESM-Module

Diese lösen bei jedem `npm run build` eine Warnung aus und fehlen in
`allowedCommonJsDependencies`:

| Dep                         | Herkunft                                        |
| --------------------------- | ----------------------------------------------- |
| **leaflet**                 | eigener Import (Karte, überall)                 |
| **leaflet-draw**            | eigener Import (`map-controls.service`)         |
| **leaflet-measure**         | eigener Import (`map-controls.service`)         |
| **leaflet-search**          | eigener Import (`map-controls.service`)         |
| **leaflet.pattern**         | eigener Import (Kartenschraffuren)              |
| **leaflet.awesome-markers** | eigener Import (Marker-Icons)                   |
| **echarts-stat**            | eigener Import (`regression-diagram.component`) |
| **html2canvas**             | transitiv über `jspdf`                          |
| **dompurify**               | transitiv über `jspdf`                          |

Nachtragen wäre rein kosmetisch (die Warnung verschwindet, das Bundle ändert sich nicht);
siehe C6 in [`OFFENE_PUNKTE.md`](OFFENE_PUNKTE.md).

## Kurzfazit

- **Eigene Imports:** im Wesentlichen **Export-/Reporting** (docx, jspdf-autotable, jszip,
  file-saver, dom-to-image-more), **Karte** (leaflet + Plugins, leaflet.markercluster, jstat),
  **CSV** (papaparse) und die **Admin-Code-Editoren** (codemirror).
- **Transitiv:** alle `@turf/*`-Hilfspakete, die `canvg`-Kette (PDF/SVG), `js-sha256`
  (Keycloak) sowie `html2canvas`/`dompurify` über `jspdf` — nicht direkt entfernbar, ohne die
  Eltern-Lib zu wechseln.
