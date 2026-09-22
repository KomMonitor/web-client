import { SpatialUnitHierarchyOverviewType } from 'models/data-management-api';

import {
  assignmentSummary,
  buildAssignmentRow,
  buildHierarchyAssignmentArray,
  membershipForRow,
  membershipsForRows,
  orderedMembersOf,
} from './hierarchy-assignment.model';

/**
 * The rules behind the assignment panel of the add wizard, without a fixture:
 * every one of them is a pure function over a hierarchy list.
 */

/** Members deliberately out of order — the array order is what may be wrong. */
const VERWALTUNG: SpatialUnitHierarchyOverviewType = {
  hierarchyId: 'h-1',
  name: 'Verwaltungsgliederung',
  mandantId: 'm-1',
  isPublic: false,
  members: [
    { spatialUnitId: 'su-district', spatialUnitLevel: 'Stadtteile', hierarchyLevel: 1 },
    { spatialUnitId: 'su-city', spatialUnitLevel: 'Stadt', hierarchyLevel: 0 },
  ],
};

const EMPTY: SpatialUnitHierarchyOverviewType = {
  hierarchyId: 'h-empty',
  name: 'Frisch angelegt',
  mandantId: 'm-1',
  isPublic: false,
  members: [],
};

const HIERARCHIES = [VERWALTUNG, EMPTY];

describe('orderedMembersOf', () => {
  it('sorts by hierarchyLevel, not by the order the array happens to have', () => {
    expect(orderedMembersOf(VERWALTUNG).map((member) => member.spatialUnitId)).toEqual([
      'su-city',
      'su-district',
    ]);
  });

  it('answers empty for a hierarchy without members, and for none at all', () => {
    expect(orderedMembersOf(EMPTY)).toEqual([]);
    expect(orderedMembersOf(undefined)).toEqual([]);
  });
});

describe('membershipForRow', () => {
  it('appends behind the last member', () => {
    expect(
      membershipForRow(
        { hierarchyId: 'h-1', placement: 'append', referenceSpatialUnitId: '' },
        HIERARCHIES
      )
    ).toEqual({ hierarchyId: 'h-1', nextUpperSpatialUnitId: 'su-district' });
  });

  it('names no neighbour at all in an empty hierarchy — the level becomes its first', () => {
    expect(
      membershipForRow(
        { hierarchyId: 'h-empty', placement: 'append', referenceSpatialUnitId: '' },
        HIERARCHIES
      )
    ).toEqual({ hierarchyId: 'h-empty' });
  });

  it('places above a level by naming it as the lower neighbour', () => {
    expect(
      membershipForRow(
        { hierarchyId: 'h-1', placement: 'above', referenceSpatialUnitId: 'su-district' },
        HIERARCHIES
      )
    ).toEqual({ hierarchyId: 'h-1', nextLowerSpatialUnitId: 'su-district' });
  });

  it('places below a level by naming it as the upper neighbour', () => {
    expect(
      membershipForRow(
        { hierarchyId: 'h-1', placement: 'below', referenceSpatialUnitId: 'su-city' },
        HIERARCHIES
      )
    ).toEqual({ hierarchyId: 'h-1', nextUpperSpatialUnitId: 'su-city' });
  });

  it('answers null for a row that does not describe a place yet', () => {
    expect(
      membershipForRow(
        { hierarchyId: '', placement: 'append', referenceSpatialUnitId: '' },
        HIERARCHIES
      )
    ).toBeNull();
    expect(
      membershipForRow(
        { hierarchyId: 'h-1', placement: 'above', referenceSpatialUnitId: '' },
        HIERARCHIES
      )
    ).toBeNull();
  });

  it('still appends into a hierarchy it knows nothing about', () => {
    // The list may still be loading; the hierarchy id is the user's choice.
    expect(
      membershipForRow({ hierarchyId: 'h-x', placement: 'append', referenceSpatialUnitId: '' }, [])
    ).toEqual({ hierarchyId: 'h-x' });
  });
});

describe('membershipsForRows', () => {
  it('keeps the row order and drops the unfinished ones', () => {
    const memberships = membershipsForRows(
      [
        { hierarchyId: 'h-empty', placement: 'append', referenceSpatialUnitId: '' },
        { hierarchyId: '', placement: 'append', referenceSpatialUnitId: '' },
        { hierarchyId: 'h-1', placement: 'below', referenceSpatialUnitId: 'su-city' },
      ],
      HIERARCHIES
    );

    expect(memberships).toEqual([
      { hierarchyId: 'h-empty' },
      { hierarchyId: 'h-1', nextUpperSpatialUnitId: 'su-city' },
    ]);
  });
});

describe('assignmentSummary', () => {
  it('says where the level lands, as a key with its parameters', () => {
    expect(
      assignmentSummary(
        { hierarchyId: 'h-1', placement: 'append', referenceSpatialUnitId: '' },
        HIERARCHIES
      )
    ).toEqual({
      key: 'ADMIN_SPATIAL_UNITS.METADATA_STEP.RESULT_APPEND',
      params: { hierarchy: 'Verwaltungsgliederung' },
    });

    expect(
      assignmentSummary(
        { hierarchyId: 'h-empty', placement: 'append', referenceSpatialUnitId: '' },
        HIERARCHIES
      )
    ).toMatchObject({ key: 'ADMIN_SPATIAL_UNITS.METADATA_STEP.RESULT_APPEND_EMPTY' });

    expect(
      assignmentSummary(
        { hierarchyId: 'h-1', placement: 'above', referenceSpatialUnitId: 'su-district' },
        HIERARCHIES
      )
    ).toEqual({
      key: 'ADMIN_SPATIAL_UNITS.METADATA_STEP.RESULT_ABOVE',
      params: { hierarchy: 'Verwaltungsgliederung', level: 'Stadtteile' },
    });

    expect(
      assignmentSummary(
        { hierarchyId: 'h-1', placement: 'below', referenceSpatialUnitId: 'su-city' },
        HIERARCHIES
      )
    ).toMatchObject({
      key: 'ADMIN_SPATIAL_UNITS.METADATA_STEP.RESULT_BELOW',
      params: { hierarchy: 'Verwaltungsgliederung', level: 'Stadt' },
    });
  });

  it('says nothing while the row is incomplete', () => {
    expect(
      assignmentSummary(
        { hierarchyId: '', placement: 'append', referenceSpatialUnitId: '' },
        HIERARCHIES
      )
    ).toBeNull();
    expect(
      assignmentSummary(
        { hierarchyId: 'h-1', placement: 'above', referenceSpatialUnitId: '' },
        HIERARCHIES
      )
    ).toBeNull();
  });
});

describe('the row and array rules', () => {
  it('needs a hierarchy in every row that exists', () => {
    const row = buildAssignmentRow();

    expect(row.controls.hierarchyId.hasError('required')).toBe(true);

    row.controls.hierarchyId.setValue('h-1');
    expect(row.valid).toBe(true);
  });

  it('asks for a reference level as soon as the row stops appending', () => {
    const row = buildAssignmentRow({ hierarchyId: 'h-1' });

    row.controls.placement.setValue('above');
    expect(row.hasError('referenceRequired')).toBe(true);

    row.controls.referenceSpatialUnitId.setValue('su-city');
    expect(row.hasError('referenceRequired')).toBe(false);

    row.controls.placement.setValue('append');
    expect(row.valid).toBe(true);
  });

  it('refuses the same hierarchy twice — the endpoint replaces the whole list', () => {
    const rows = buildHierarchyAssignmentArray();
    rows.push(buildAssignmentRow({ hierarchyId: 'h-1' }));
    rows.push(buildAssignmentRow({ hierarchyId: 'h-1' }));

    expect(rows.hasError('duplicateHierarchy')).toBe(true);

    rows.removeAt(1);
    expect(rows.hasError('duplicateHierarchy')).toBe(false);
  });

  it('leaves two rows that name no hierarchy yet alone', () => {
    const rows = buildHierarchyAssignmentArray();
    rows.push(buildAssignmentRow());
    rows.push(buildAssignmentRow());

    expect(rows.hasError('duplicateHierarchy')).toBe(false);
  });
});
