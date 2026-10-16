import { TranslateService } from '@ngx-translate/core';
import { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { SpatialUnitOverviewType as SpatialUnitMetadata } from 'models/data-management-api';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { textListCell } from 'util/grid-cell.util';

/**
 * The hierarchies a spatial unit belongs to, by name, ordered by its position
 * in each. Falls back to the id where the API leaves `hierarchyName` null.
 */
function hierarchyNamesOf(dataset: SpatialUnitMetadata | undefined): string[] {
  return [...(dataset?.hierarchies ?? [])]
    .sort((a, b) => a.hierarchyLevel - b.hierarchyLevel)
    .map((membership) => membership.hierarchyName || membership.hierarchyId);
}

/**
 * The data columns of the spatial unit overview grid — everything but the
 * edit-buttons column, which the overview component prepends because it owns
 * the click dispatch.
 *
 * Free-text columns go through `valueGetter`, never a function `cellRenderer`
 * returning a string: AG Grid assigns such a string to innerHTML unsanitized
 * (see `util/grid-cell.util.ts`).
 */
export function buildSpatialUnitDataColumns(
  translate: TranslateService,
  accessControlService: AccessControlService
): ColDef<SpatialUnitMetadata>[] {
  return [
    {
      headerName: translate.instant('ADMIN_SHARED.ID'),
      field: 'spatialUnitId',
      pinned: 'left',
      maxWidth: 125,
    },
    {
      headerName: translate.instant('ADMIN_SHARED.NAME'),
      field: 'spatialUnitLevel',
      pinned: 'left',
      minWidth: 300,
    },
    {
      headerName: translate.instant('ADMIN_SHARED.DESCRIPTION'),
      minWidth: 400,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        params.data?.metadata?.description,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: translate.instant('ADMIN_SPATIAL_UNITS.GRID.COL_HIERARCHIES'),
      minWidth: 300,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        hierarchyNamesOf(params.data).join(', '),
      filter: 'agTextColumnFilter',
    },
    {
      headerName: translate.instant('ADMIN_SHARED.PERIOD_OF_VALIDITY'),
      minWidth: 400,
      cellRenderer: (params: ICellRendererParams<SpatialUnitMetadata>) =>
        textListCell(
          (params.data?.availablePeriodsOfValidity ?? []).map(
            (period) => `${period.startDate} – ${period.endDate || 'heute'}`
          ),
          5,
          true
        ),
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) => {
        if (
          params.data!.availablePeriodsOfValidity &&
          params.data!.availablePeriodsOfValidity.length > 1
        ) {
          return '' + JSON.stringify(params.data!.availablePeriodsOfValidity);
        }
        return params.data!.availablePeriodsOfValidity;
      },
    },
    {
      headerName: translate.instant('ADMIN_SHARED.DATASOURCE'),
      minWidth: 400,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        params.data?.metadata?.datasource,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: translate.instant('ADMIN_SHARED.DATA_HOLDER_CONTACT'),
      minWidth: 400,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        params.data?.metadata?.contact,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: translate.instant('COMMON.ROLES'),
      minWidth: 400,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        accessControlService.getAllowedRolesString(params.data?.permissions),
      filter: 'agTextColumnFilter',
    },
    {
      headerName: translate.instant('ADMIN_SHARED.PUBLIC_VISIBLE'),
      minWidth: 400,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        params.data?.isPublic ? 'ja' : 'nein',
      filter: 'agTextColumnFilter',
    },
    {
      headerName: translate.instant('ADMIN_SHARED.OWNER'),
      minWidth: 400,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        accessControlService.getRoleTitle(params.data?.ownerId ?? ''),
      filter: 'agTextColumnFilter',
    },
    {
      headerName: translate.instant('ADMIN_SPATIAL_UNITS.GRID.COL_OUTLINE_LINE_COLOR'),
      minWidth: 200,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        params.data?.outlineColor || '-',
      filter: 'agTextColumnFilter',
    },
    {
      headerName: translate.instant('ADMIN_SPATIAL_UNITS.GRID.COL_OUTLINE_LINE_WIDTH'),
      minWidth: 200,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        params.data?.outlineWidth || '-',
      filter: 'agTextColumnFilter',
    },
    {
      headerName: translate.instant('ADMIN_SPATIAL_UNITS.GRID.COL_OUTLINE_LINE_PATTERN'),
      minWidth: 200,
      valueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        params.data?.outlineDashArrayString || '-',
      filter: 'agTextColumnFilter',
    },
  ];
}
