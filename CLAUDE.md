# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent workflow (read this)

- **Never commit on your own.** Make the changes, run build/test/lint, and stop — leave staging and committing to the user. Only `git add`/`git commit` when explicitly asked.
- **Keep plan descriptions short** — concise, scannable bullets over long prose.

## What this is

The **KomMonitor Web Client** — the main user-facing application of the [KomMonitor](http://kommonitor.de) spatial data infrastructure. It displays and analyzes municipal indicator and georesource data, combining cartographic (Leaflet) and statistical (ECharts) visualizations with exploration tools for city planning (filters, reachability/isochrone analysis, reporting, data export, admin pages).

It is a browser SPA that consumes external KomMonitor backend services (see "Runtime dependencies"). There is no backend in this repo.

## Commands

The build uses the **Angular CLI** (`ng`). Despite what `README.md` says, webpack and grunt are **no longer the active build pipeline** — ignore those instructions.

```bash
npm install --force      # README notes --force is needed due to peer-dep conflicts
npm start                # = ng serve, dev server on http://localhost:8000
npm run build            # = ng build, production build into dist/kommonitor-client
npm run watch            # ng build --watch, development configuration
npm run serve:dist       # serve a built dist/ via http-server on :8000
```

Production deployment is a static build served by nginx (see `Dockerfile`, `nginx.conf`). `docker-compose.yml` brings up the client plus the **client-config** service it depends on at startup.

### Tests

⚠️ Tests are **not currently runnable**. There are ~73 `*.spec.ts` files and a Karma `test` target in `angular.json`, but there is no `test` npm script, Karma/Jasmine runtime packages are not installed (only `@types/jasmine`), and the test target references a stale `app/app.css`. If asked to run or add tests, this gap must be addressed first (see `PROPOSED_CHANGES.md` Prio 6). Do not assume `ng test` works.

There is no ESLint/Prettier setup — only a minimal `jshintConfig` in `package.json`.

## Migration status — read this before editing

This codebase is **mid-migration from AngularJS 1.8 → Angular 16**, and the migration is effectively complete at runtime. This is the single most important thing to understand before touching code:

- The live app bootstraps **pure Angular** via `app/main.ts` → `app/app.module.ts` → `MainComponent`. There is **no active ngUpgrade/hybrid bootstrap** despite `@angular/upgrade` still being in `package.json`.
- **`app/app.js` is dead code** — the old AngularJS entry point. It is not loaded (`app/index.html` includes no scripts; `angular.json` only loads jQuery/Bootstrap).
- The legacy AngularJS source lives under `app/components/kommonitorUserInterface/`, `app/components/kommonitorAdmin/`, and `app/components/common/`. These `*.component.js` / `*.module.js` / `*.template.html` files (~38 components) are **not loaded by the running app**. Many also have compiled `.js`/`.js.map` siblings — noise from the migration.
- **All active code is Angular and lives under `app/components/ngComponents/`** plus `app/services/`, `app/pipes/`, `app/guards/`, `app/mainComponent/`, `app/util/interceptors/`.

When implementing features, work in the `ngComponents` / `services` (TypeScript) world. Treat the AngularJS files as a reference for behavior being ported, not as live code. `PROPOSED_CHANGES.md` (German) is the authoritative cleanup/roadmap doc — consult it for what is dead, what is intentionally kept, and the recommended refactor order.

### Files that look like backups but are loaded at runtime

`app/config/` mixes deletable backups with **intentional runtime fallbacks** that ship with the app (referenced in `angular.json` assets):
- `env_backup.js` — fallback app config.
- `keycloak_backup.json` — fallback Keycloak config (used by `keycloak-helper.service.ts`).
- `*_forAdminViewExplanation.txt` — example text shown in admin config views.

Do not delete these. Other `*_backup*` / `*_old` files are genuine cruft.

## Architecture

### Startup & runtime configuration

The app is configured at **runtime**, not build time. `StartupService` (`app/services/startup-service/startup.service.ts`) runs as an Angular `APP_INITIALIZER` and, before the app renders:
1. Fetches `./config/config-storage-server.json` (URLs of the external **Client Config Service**).
2. Loads app config (`env.js`), Keycloak config, controls config, and filter config from that service — falling back to the local `app/config/*_backup*` files when unreachable.
3. Populates the global **`window.__env`** object (typed loosely in `app/globals.d.ts`).
4. Initializes Keycloak auth via `AuthService` / `KeycloakHelperService`.

**Access config through `EnvConfigService`** (`app/services/env-config-service/env-config.service.ts`), which wraps `window.__env` with typed getters. Some legacy direct `window.__env` reads still exist; prefer the service in new code.

### Auth

Keycloak (`keycloak-js`) provides optional role-based access. `AuthInterceptor` (`app/util/interceptors/auth.interceptor.ts`) is a global `HTTP_INTERCEPTORS` entry that attaches tokens. `authAdminGuard` (`app/guards/auth.guard.ts`) protects the `/administration` route.

### Routing

`app/app.routes.ts` is tiny and the structural backbone: `/administration` → `AdminComponent` (guarded), everything else (`**`) → `UserInterfaceComponent`. The two top-level feature areas are the **user interface** (map/charts/exploration) and **administration** (data & config management).

### Components

Under `app/components/ngComponents/`:
- `userInterface/` — the end-user app: `kommonitorMap`, `kommonitorClassification`, `kommonitorLegend`, `sidebar`, `exporting`, `reporting`, modals.
- `admin/` — management pages: indicators, georesources, spatial units, topics, scripts, roles, dashboard, and `adminConfig/` (app/landingpage/filter/controls config editors).
- `common/` — shared widgets (loading overlay, notification, stepper, user login, language switcher, etc.).
- `customElements/` — reusable form controls (color picker, date picker, line-pattern picker, dual-list-box) — several are standalone components imported directly into `AppModule`.

### Services (the core logic layer)

`app/services/` holds the bulk of the application logic — most components are thin orchestrators over these. Convention: one folder per service, `*.service.ts` + `*.service.spec.ts`.

Key central services (high fan-in; change carefully):
- **`data-exchange-service`** — central data cache + API access + shared UI state (~2060 lines; a known "god service"). See `documentation/PRIO7_GOD_SERVICE_SPLIT.md` for the incremental split roadmap.
- **`map-service`** / `generic-map-helper-service` / `single-feature-map-helper-service` — Leaflet map orchestration.
- **`diagram-helper-service`** — ECharts chart construction.
- **`reachability-*` services** — isochrone/routing analysis via Open Route Service.
- **`exporting` / `pdf-export-service` / `file-helper-service`** — data and document export (XLSX, shapefile, DOCX, PPTX, PDF, images).
- **`config-storage-service` / `env-config-service`** — config plumbing.
- **`keycloak-helper-service` / `auth-service`** — auth.

Note: a large `kommonitorDataGridHelperService` (~1320 lines, in `app/services/adminSpatialUnit/`; a near-identical twin lives in `adminGeoresourceUnit/`) also exists. Per `PROPOSED_CHANGES.md` / `documentation/PRIO7_GOD_SERVICE_SPLIT.md`, these god-services are being split incrementally — peel off responsibilities when you touch them rather than doing a big-bang rewrite.

### Vendored libraries

`customizedExternalLibs/` holds patched copies of third-party libs (Leaflet plugins, classybrew, colorbrewer, shp-write, etc.) that diverge from their npm versions. The `*_old` variants there are stale.

## Runtime dependencies (external KomMonitor services)

The client is non-functional without these backends (configured via the runtime config above):
- **Data Management API** — main data retrieval/modification.
- **Client Config Service** — serves app/keycloak/controls/filter config on startup.
- **Importer** — spatial insert/update for spatial-units, georesources, indicators (admin pages).
- **Processing Engine** — indicator computation.
- **Open Route Service** — on-the-fly isochrones/routing.
- **Keycloak** (optional) — role-based access.

## Conventions

- TypeScript is `strict` (`tsconfig.json`), but `noImplicitAny` is **off** — untyped values are common, especially around `window.__env` and legacy data. Angular `strictTemplates` is on.
- Path imports are baseUrl-relative to `app/` (e.g. `import { StartupService } from 'services/startup-service/startup.service'`), not just relative paths.
- jQuery and Bootstrap JS are globals (set up in `main.ts` and loaded via `angular.json`); some components and vendored libs rely on `window.$`.
- i18n via `@ngx-translate` (default language `de`, files in `app/assets/i18n/`) is set up but inconsistently used — many German labels are still hardcoded.

## Branching

`master` = stable releases. `develop` = main integration branch. Feature/fix work happens on dedicated branches (current work is on `feature/migration-bootstrap`).
