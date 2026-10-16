import { TranslateService } from '@ngx-translate/core';

import { buildSpatialUnitDataColumns } from './spatial-unit-grid-columns';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import {
  HOSTILE_PAYLOAD,
  expectNoMarkupInjection,
  renderCellLikeAgGrid,
} from 'testing/ag-grid-cell.testing';

const translate = { instant: (key: string) => key } as unknown as TranslateService;
const accessControl = {
  getAllowedRolesString: () => HOSTILE_PAYLOAD,
  getRoleTitle: () => HOSTILE_PAYLOAD,
} as unknown as AccessControlService;

/** A spatial unit with the hostile payload in every free-text field. */
function hostileSpatialUnit(): any {
  return {
    spatialUnitId: 'spatial-unit-1',
    spatialUnitLevel: HOSTILE_PAYLOAD,
    metadata: {
      description: HOSTILE_PAYLOAD,
      datasource: HOSTILE_PAYLOAD,
      contact: HOSTILE_PAYLOAD,
    },
    hierarchies: [{ hierarchyId: 'h-1', hierarchyName: HOSTILE_PAYLOAD, hierarchyLevel: 1 }],
    availablePeriodsOfValidity: [{ startDate: '2020-01-01', endDate: HOSTILE_PAYLOAD }],
    permissions: ['permission-1'],
    isPublic: true,
    ownerId: 'owner-1',
    outlineColor: HOSTILE_PAYLOAD,
    outlineWidth: HOSTILE_PAYLOAD,
    outlineDashArrayString: HOSTILE_PAYLOAD,
  };
}

describe('buildSpatialUnitDataColumns', () => {
  it('renders free text from the API as text in every column', () => {
    const spatialUnit = hostileSpatialUnit();

    const cells = expectNoMarkupInjection(
      buildSpatialUnitDataColumns(translate, accessControl),
      spatialUnit
    );

    const textCells = cells.filter((cell) => cell.textContent?.includes(HOSTILE_PAYLOAD));
    expect(textCells.length).toBe(11);
  });

  it('lists the periods of validity, an open end as "heute"', () => {
    const periods = buildSpatialUnitDataColumns(translate, accessControl).find(
      (col) => col.headerName === 'ADMIN_SHARED.PERIOD_OF_VALIDITY'
    )!;

    const cell = renderCellLikeAgGrid(periods, {
      availablePeriodsOfValidity: [
        { startDate: '2020-01-01', endDate: '2020-12-31' },
        { startDate: '2021-01-01' },
      ],
    })!;

    expect(Array.from(cell.querySelectorAll('li p')).map((p) => p.textContent)).toEqual([
      '2020-01-01 – 2020-12-31',
      '2021-01-01 – heute',
    ]);
  });

  it('falls back to "-" for missing outline styles', () => {
    const columns = buildSpatialUnitDataColumns(translate, accessControl);
    const outlineColor = columns.find(
      (col) => col.headerName === 'ADMIN_SPATIAL_UNITS.GRID.COL_OUTLINE_LINE_COLOR'
    )!;

    expect(renderCellLikeAgGrid(outlineColor, { metadata: {} })!.textContent).toBe('-');
  });
});
