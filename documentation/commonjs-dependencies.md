# CommonJS-Abhängigkeiten

Stand: 2026-06-15.

Diese Pakete werden vom Angular-Build (`@angular-devkit/build-angular:browser`, Webpack)
als CommonJS/AMD erkannt und lösten „optimization bailout"-Warnungen aus. Sie sind in
`angular.json` unter `build.options.allowedCommonJsDependencies` freigegeben (21 Einträge,
jeweils der Paketname — Angular reduziert Deep-Imports wie `codemirror/mode/...` bzw.
`core-js/modules/...` auf den Paketnamen). Build danach mit **0** Warnungen.

Diese Liste dokumentiert, **wo** die Deps genutzt werden — direkt in unserem Code vs.
transitiv über andere Libs.

## Direkt in unserem Code verwendet

| Dep | Verwendet in |
|---|---|
| **codemirror** | Admin-Config-Editoren (`adminAppConfig`, `adminLandingpageConfig`, `adminControlsConfig`, `adminFilterConfig`) + `script-code.component` — Code-Editor für Skripte/Config |
| **docx** | Reporting: `reporting-overview`, `generate-report` — DOCX-Export |
| **dom-to-image-more** | `pdf-export.service`, `reachability-map-helper.service`, `leaflet-screenshot-cache-helper.service`, `kommonitor-map.component` — Karten/DOM → Bild |
| **file-saver** | `pdf-export.service`, `generate-report`, `kommonitor-map.component` — Datei-Download |
| **jspdf-autotable** | `pdf-export.service`, `generate-report` — Tabellen im PDF-Export |
| **jstat** | `kommonitor-map.component`, `kommonitor-balance.component` — Statistik (Klassifikation/Balance) |
| **jszip** | `pdf-export.service`, `generate-report`, `customizedExternalLibs/shpwrite.js` — ZIP (u. a. Shapefile-Export) |
| **leaflet.markercluster** | `reachability-map-helper.service`, `kommonitor-map.component` — Marker-Clustering auf der Karte |
| **papaparse** | `file-helper.service`, `kommonitor-legend.component` — CSV-Parsing |
| **jquery** | `app/main.ts` — als globales `window.$` gesetzt |
| **core-js** | `customizedExternalLibs/shpwrite.js` (1×) — *plus* transitiv (siehe unten) |

## Transitiv (kein eigener Import, kommen nur über andere Libs rein)

| Dep | Eltern-Lib |
|---|---|
| **core-js** (14 Sub-Module) | `canvg` (SVG-Rendering, via jsPDF/PDF-Export) |
| **raf** | `canvg` |
| **rgbcolor** | `canvg` |
| **js-sha256** | `keycloak-js` (Auth) |
| **@turf/jsts** | `@turf/buffer` |
| **concaveman** | `@turf/convex` |
| **earcut** | `@turf/tesselate` |
| **fast-deep-equal** | `@turf/line-overlap` |
| **rbush** | `@turf/clusters-dbscan` |
| **skmeans** | `@turf/clusters-kmeans` |

## Kurzfazit

- **Eigene Imports:** im Wesentlichen **Export-/Reporting** (docx, jspdf-autotable, jszip,
  file-saver, dom-to-image-more), **Karte** (leaflet.markercluster, jstat,
  dom-to-image-more), **CSV** (papaparse) und die **Admin-Code-Editoren** (codemirror).
- **Transitiv:** alle `@turf/*`-Hilfspakete, die `canvg`-Kette (PDF/SVG) und `js-sha256`
  (Keycloak) — nicht direkt entfernbar, ohne die Eltern-Lib zu wechseln.
</content>
</invoke>
