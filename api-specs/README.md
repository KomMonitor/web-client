# API specs

OpenAPI specifications of the external KomMonitor backend services, vendored here as the
source for generated TypeScript types.

- `kommonitor_dataAccessAPI.yaml` — KomMonitor **Data Management API**. Source:
  <https://github.com/KomMonitor/data-management> (`src/main/resources/specs/data-management/kommonitor_dataAccessAPI.yaml`),
  branch **`feature/spatial-unit-multi-hierarchies`**, fetched 2026-09-21. Copied verbatim.
- `examples.yaml` — **placeholder, not from upstream.** The spec above references this neighbouring
  file 126 times (`./examples.yaml#/components/examples/...`), but it is not checked in anywhere in
  the backend repo, so `generate:api-types` cannot resolve the `$ref`s. The stub supplies the 53
  referenced names with empty values. Nothing type-relevant is lost: no `$ref` from that file points
  at a schema, `examples` are purely documentary, and keeping the stub lets the main spec stay
  byte-identical to upstream. Drop it once the backend ships the real file.

## Which branch, and why not `master`

`master` of the backend repo is what this file used to hold, and it is **behind the deployed
demo instance**. The chain is `master` → `develop` (adds the qualitative/categorical classification
model) → `feature/spatial-unit-multi-hierarchies` (adds the spatial unit hierarchy endpoints).
The demo instance at `demo.kommonitor.de.52north.org/data-management-v6` serves the last of these,
which is why the vendored copy follows that branch. Move it back to `master` or `develop` once the
hierarchy work is merged there.

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

To update the spec, replace the YAML file with the version matching the deployed backend
and re-run the generation script.
