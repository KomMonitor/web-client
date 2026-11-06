import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

import {
  GroupPermissionIds,
  OwnerDatasetSources,
  resourcePermissionIds,
} from './dataset-permissions.model';

/**
 * Builders for the dataset-permissions specs. Permission ids follow the
 * pattern `<unit>-<kind>` — `a-viewer`, `a-editor`, `a-creator` on resources,
 * `a-themes` and `a-users` for the themes/users creator — so expectations can
 * name them directly.
 *
 * Not used by the application — only by `*.spec.ts` in this folder.
 */

/** An organizational unit with all five permissions a v6 unit has. */
export function orgUnit(
  id: string,
  options: { name?: string; parentId?: string; mandant?: boolean; children?: string[] } = {}
): AccessControlMetadata {
  return {
    organizationalUnitId: id,
    name: options.name ?? id,
    mandant: options.mandant ?? false,
    parentId: options.parentId,
    children: options.children ?? [],
    permissions: [
      { permissionId: `${id}-viewer`, permissionLevel: 'viewer', permissioneType: 'resources' },
      { permissionId: `${id}-editor`, permissionLevel: 'editor', permissioneType: 'resources' },
      { permissionId: `${id}-creator`, permissionLevel: 'creator', permissioneType: 'resources' },
      { permissionId: `${id}-themes`, permissionLevel: 'creator', permissioneType: 'themes' },
      { permissionId: `${id}-users`, permissionLevel: 'creator', permissioneType: 'users' },
    ],
  };
}

/** The resolved permission ids of `orgUnit(id)`. */
export function group(id: string): GroupPermissionIds {
  return resourcePermissionIds([orgUnit(id)])[0];
}

type IndicatorSource = OwnerDatasetSources['indicators'][number];
type GeoresourceSource = OwnerDatasetSources['georesources'][number];
type SpatialUnitSource = OwnerDatasetSources['spatialUnits'][number];

/** An indicator; `timeseries` maps spatial unit ids to the permission ids of that timeseries. */
export function indicatorSource(
  id: string,
  ownerId: string,
  permissions: string[],
  timeseries: Record<string, string[]> = {},
  name = id
): IndicatorSource {
  return {
    indicatorId: id,
    indicatorName: name,
    ownerId,
    permissions,
    applicableSpatialUnits: Object.entries(timeseries).map(([spatialUnitId, ids]) => ({
      spatialUnitId,
      spatialUnitName: `level ${spatialUnitId}`,
      permissions: ids,
    })),
  };
}

export function georesourceSource(
  id: string,
  ownerId: string,
  permissions: string[],
  name = id
): GeoresourceSource {
  return { georesourceId: id, datasetName: name, ownerId, permissions };
}

export function spatialUnitSource(
  id: string,
  ownerId: string,
  permissions: string[],
  name = id
): SpatialUnitSource {
  return { spatialUnitId: id, spatialUnitLevel: name, ownerId, permissions };
}

export function sources(partial: Partial<OwnerDatasetSources>): OwnerDatasetSources {
  return { indicators: [], georesources: [], spatialUnits: [], ...partial };
}
