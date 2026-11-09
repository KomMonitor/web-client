# API specs

OpenAPI specifications of the external KomMonitor backend services, vendored here as the
source for generated TypeScript types.

- `kommonitor_dataAccessAPI.yaml` — KomMonitor **Data Management API**. Source:
  <https://github.com/KomMonitor/data-management> (`src/main/resources/specs/data-management/kommonitor_dataAccessAPI.yaml`),
  tag **`v6.0.0-SNAPSHOT`** = commit `f97af31c`, fetched 2026-11-09. Same content as upstream;
  only the YAML quoting differs (see "Updating the spec").
- `examples.yaml` — the spec's neighbouring examples file, which it references by
  `./examples.yaml#/components/examples/...` (53 names). From the same commit and directory
  upstream; it replaces the stub this folder held while the backend did not ship the file.

## Which source, and why not `master`

`master` of the backend repo is what this file used to hold, and it is **behind the deployed
demo instance**. The chain is `master` → `develop` (adds the qualitative/categorical classification
model) → `feature/spatial-unit-multi-hierarchies` (adds the spatial unit hierarchy endpoints) →
`feature/v6` (adds the hierarchy `description`, commit `d476a3f7`). The demo instance at
`demo.kommonitor.de.52north.org/data-management-v6` serves the last of these, which is why the
vendored copy followed that branch. Move it back to `master` or `develop` once the v6 work is merged
there.

Since 2026-11-06 the tag `v6.0.0-SNAPSHOT` — and the published
`kommonitor/data-management:6.0.0-SNAPSHOT` image built from it — points one step further, at
`feature/batch-permissions` (`f97af31c`, four commits ahead of `feature/v6`, not yet merged). It
adds `PATCH /organizationalUnits/permissions`, which the dataset-permissions wizard sends, changes
the answer of `GET /organizationalUnits/{id}/permissions`, and fixes the `spatialunits,` typo in the
`ResourceType` enum. The vendored copy follows that tag for now; return to `feature/v6` once the
branch is merged into it.

The deployed instance also serves a springdoc-generated spec at `/v3/api-docs`. It is **not** the
right source here: it inlines the named enum schemas (`IndicatorTypeEnum`, `CreationTypeEnum`, …)
that `app/models/data-management-api.ts` re-exports by name, and it prefixes every path with
`/management`. It is useful for checking what the running backend actually answers — see
`documentation/RAUMEINHEITSHIERARCHIEN_BEFUNDE.md`.

### Known gap: nullability

The hand-maintained spec is OpenAPI 3.0.3 and never uses `nullable: true`, so the generated types
say `string` where the API really answers `null` (e.g. `nextUpperSpatialUnitId` on a top-level
hierarchy member). The springdoc output documents these correctly as `["string", "null"]`. This is
a long-standing property of the vendored spec, not new — but do not trust a non-optional `string`
from these types to be non-null at runtime.

## Regenerating the client types

```bash
npm run generate:api-types
```

This runs `openapi-typescript` and writes `app/models/data-management-api.generated.ts`
(do not edit that file by hand; it is excluded from Prettier). Application code should
import the named re-exports from `app/models/data-management-api.ts` instead of the
generated file. Client-side extensions of API types (extra fields the web client attaches)
live in `app/components/ngComponents/models/*.models.ts`.

## Updating the spec

Take both files from the backend revision matching the deployed instance, normalise them with
the repo's Prettier config (single quotes, as here), and regenerate:

```bash
REV=f97af31c408e4f095de087dc143f3b09f27cdab7
SRC=https://raw.githubusercontent.com/KomMonitor/data-management/$REV/src/main/resources/specs/data-management
for f in kommonitor_dataAccessAPI.yaml examples.yaml; do
  curl -sf "$SRC/$f" | npx prettier --stdin-filepath "api-specs/$f" > "api-specs/$f"
done
npm run generate:api-types
```

The Prettier step keeps the diff down to real changes: upstream uses double quotes, and without it
every quoted key would show up as changed. Check the diff of the generated file before committing
— a renamed schema breaks the re-exports in `app/models/data-management-api.ts`, which only
`npm run build` reports.
