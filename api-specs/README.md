# API specs

OpenAPI specifications of the external KomMonitor backend services, vendored here as the
source for generated TypeScript types.

- `kommonitor_dataAccessAPI.yaml` — KomMonitor **Data Management API**. Source:
  <https://github.com/KomMonitor/data-management> (`src/main/resources/specs/data-management/kommonitor_dataAccessAPI.yaml`).

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
