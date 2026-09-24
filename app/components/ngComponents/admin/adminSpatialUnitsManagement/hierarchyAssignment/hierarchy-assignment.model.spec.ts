import {
  SpatialUnitHierarchyMembershipType,
  SpatialUnitHierarchyOverviewType,
} from 'models/data-management-api';

import {
  assignmentSummary,
  buildAssignmentRow,
  buildHierarchyAssignmentArray,
  chainWithout,
  membershipForRow,
  membershipLevelForRow,
  membershipsByLevelForRows,
  membershipsForRows,
  orderedMembersOf,
  rowForExistingMembership,
  sameMemberships,
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

/**
 * Four levels, so "top", "middle" and "bottom" are three different things —
 * what the edit dialog's rows have to tell apart. Out of order again.
 */
const SCHULE: SpatialUnitHierarchyOverviewType = {
  hierarchyId: 'h-4',
  name: 'Schulbezirke',
  mandantId: 'm-1',
  isPublic: false,
  members: [
    { spatialUnitId: 'su-c', spatialUnitLevel: 'C', hierarchyLevel: 2 },
    { spatialUnitId: 'su-a', spatialUnitLevel: 'A', hierarchyLevel: 0 },
    { spatialUnitId: 'su-d', spatialUnitLevel: 'D', hierarchyLevel: 3 },
    { spatialUnitId: 'su-b', spatialUnitLevel: 'B', hierarchyLevel: 1 },
  ],
};

/** A hierarchy whose only member is the unit being edited. */
const SOLO: SpatialUnitHierarchyOverviewType = {
  hierarchyId: 'h-solo',
  name: 'Nur eine Ebene',
  mandantId: 'm-1',
  isPublic: false,
  members: [{ spatialUnitId: 'su-b', spatialUnitLevel: 'B', hierarchyLevel: 0 }],
};

const HIERARCHIES = [VERWALTUNG, EMPTY];
const EDIT_HIERARCHIES = [SCHULE, SOLO, EMPTY];

/** The memberships `su-b` has, as the API answers them. */
function membershipOf(
  hierarchy: SpatialUnitHierarchyOverviewType,
  spatialUnitId: string
): SpatialUnitHierarchyMembershipType {
  const members = orderedMembersOf(hierarchy);
  const index = members.findIndex((member) => member.spatialUnitId === spatialUnitId);
  return {
    hierarchyId: hierarchy.hierarchyId,
    hierarchyName: hierarchy.name,
    hierarchyLevel: members[index].hierarchyLevel,
    nextUpperSpatialUnitId: members[index - 1]?.spatialUnitId,
    nextLowerSpatialUnitId: members[index + 1]?.spatialUnitId,
  };
}

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
      key: 'ADMIN_SPATIAL_UNITS.HIERARCHY_ASSIGNMENT.RESULT_APPEND',
      params: { hierarchy: 'Verwaltungsgliederung' },
    });

    expect(
      assignmentSummary(
        { hierarchyId: 'h-empty', placement: 'append', referenceSpatialUnitId: '' },
        HIERARCHIES
      )
    ).toMatchObject({ key: 'ADMIN_SPATIAL_UNITS.HIERARCHY_ASSIGNMENT.RESULT_APPEND_EMPTY' });

    expect(
      assignmentSummary(
        { hierarchyId: 'h-1', placement: 'above', referenceSpatialUnitId: 'su-district' },
        HIERARCHIES
      )
    ).toEqual({
      key: 'ADMIN_SPATIAL_UNITS.HIERARCHY_ASSIGNMENT.RESULT_ABOVE',
      params: { hierarchy: 'Verwaltungsgliederung', level: 'Stadtteile' },
    });

    expect(
      assignmentSummary(
        { hierarchyId: 'h-1', placement: 'below', referenceSpatialUnitId: 'su-city' },
        HIERARCHIES
      )
    ).toMatchObject({
      key: 'ADMIN_SPATIAL_UNITS.HIERARCHY_ASSIGNMENT.RESULT_BELOW',
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

describe('chainWithout', () => {
  it('leaves the chain alone where no unit is named', () => {
    expect(chainWithout(SCHULE, '').map((member) => member.spatialUnitId)).toEqual([
      'su-a',
      'su-b',
      'su-c',
      'su-d',
    ]);
  });

  it('drops the named unit and keeps the rest in level order', () => {
    expect(chainWithout(SCHULE, 'su-b').map((member) => member.spatialUnitId)).toEqual([
      'su-a',
      'su-c',
      'su-d',
    ]);
  });

  it('answers empty for a hierarchy it does not have', () => {
    expect(chainWithout(undefined, 'su-b')).toEqual([]);
  });
});

describe('rowForExistingMembership', () => {
  it('reads a level in the middle as sitting above the one below it', () => {
    expect(rowForExistingMembership(membershipOf(SCHULE, 'su-b'), SCHULE)).toEqual({
      hierarchyId: 'h-4',
      placement: 'above',
      referenceSpatialUnitId: 'su-c',
    });
  });

  it('reads the top level the same way — it is above the second', () => {
    expect(rowForExistingMembership(membershipOf(SCHULE, 'su-a'), SCHULE)).toMatchObject({
      placement: 'above',
      referenceSpatialUnitId: 'su-b',
    });
  });

  it('reads the finest level as an append: nothing sits below it', () => {
    expect(rowForExistingMembership(membershipOf(SCHULE, 'su-d'), SCHULE)).toEqual({
      hierarchyId: 'h-4',
      placement: 'append',
      referenceSpatialUnitId: '',
    });
  });

  it('reads a sole member as an append as well', () => {
    expect(rowForExistingMembership(membershipOf(SOLO, 'su-b'), SOLO)).toMatchObject({
      placement: 'append',
      referenceSpatialUnitId: '',
    });
  });

  it('falls back to the chain where the payload names no lower neighbour', () => {
    // The rows are seeded while the hierarchy list is still in flight, and the
    // field is optional in the schema.
    const bare = { hierarchyId: 'h-4', hierarchyLevel: 1 };

    expect(rowForExistingMembership(bare, SCHULE)).toMatchObject({
      placement: 'above',
      referenceSpatialUnitId: 'su-c',
    });
    expect(rowForExistingMembership(bare)).toMatchObject({
      placement: 'append',
      referenceSpatialUnitId: '',
    });
  });
});

describe('membershipLevelForRow', () => {
  describe('a level joining a chain it is not in', () => {
    it('appends behind the last member', () => {
      expect(
        membershipLevelForRow(
          { hierarchyId: 'h-4', placement: 'append', referenceSpatialUnitId: '' },
          EDIT_HIERARCHIES
        )
      ).toEqual({ hierarchyId: 'h-4', hierarchyLevel: 4 });
    });

    it('takes the place of the level it is put above', () => {
      expect(
        membershipLevelForRow(
          { hierarchyId: 'h-4', placement: 'above', referenceSpatialUnitId: 'su-c' },
          EDIT_HIERARCHIES
        )
      ).toEqual({ hierarchyId: 'h-4', hierarchyLevel: 2 });
    });

    it('takes the place after the level it is put below', () => {
      expect(
        membershipLevelForRow(
          { hierarchyId: 'h-4', placement: 'below', referenceSpatialUnitId: 'su-c' },
          EDIT_HIERARCHIES
        )
      ).toEqual({ hierarchyId: 'h-4', hierarchyLevel: 3 });
    });

    it('is the first level of an empty hierarchy', () => {
      expect(
        membershipLevelForRow(
          { hierarchyId: 'h-empty', placement: 'append', referenceSpatialUnitId: '' },
          EDIT_HIERARCHIES
        )
      ).toEqual({ hierarchyId: 'h-empty', hierarchyLevel: 0 });
    });
  });

  describe('a level already in the chain', () => {
    it('counts against the chain without itself, so appending is the last free slot', () => {
      expect(
        membershipLevelForRow(
          { hierarchyId: 'h-4', placement: 'append', referenceSpatialUnitId: '' },
          EDIT_HIERARCHIES,
          'su-b'
        )
        // Three members left, so the finest position is 3 and not 4.
      ).toEqual({ hierarchyId: 'h-4', hierarchyLevel: 3 });
    });

    it('never takes itself as a reference', () => {
      expect(
        membershipLevelForRow(
          { hierarchyId: 'h-4', placement: 'above', referenceSpatialUnitId: 'su-b' },
          EDIT_HIERARCHIES,
          'su-b'
        )
      ).toBeNull();
    });
  });

  it('answers null for a row that does not describe a place yet', () => {
    expect(
      membershipLevelForRow(
        { hierarchyId: '', placement: 'append', referenceSpatialUnitId: '' },
        EDIT_HIERARCHIES
      )
    ).toBeNull();
    expect(
      membershipLevelForRow(
        { hierarchyId: 'h-4', placement: 'above', referenceSpatialUnitId: '' },
        EDIT_HIERARCHIES
      )
    ).toBeNull();
  });
});

describe('membershipsByLevelForRows', () => {
  it('keeps the row order and drops the unfinished ones', () => {
    expect(
      membershipsByLevelForRows(
        [
          { hierarchyId: 'h-empty', placement: 'append', referenceSpatialUnitId: '' },
          { hierarchyId: '', placement: 'append', referenceSpatialUnitId: '' },
          { hierarchyId: 'h-4', placement: 'above', referenceSpatialUnitId: 'su-a' },
        ],
        EDIT_HIERARCHIES
      )
    ).toEqual([
      { hierarchyId: 'h-empty', hierarchyLevel: 0 },
      { hierarchyId: 'h-4', hierarchyLevel: 0 },
    ]);
  });

  /**
   * The property the whole edit dialog rests on: a membership read into a row
   * and written back out again is the membership it started as. Without it,
   * opening a dialog and saving it unchanged would move levels around.
   */
  it('reproduces every membership it was seeded from', () => {
    for (const spatialUnitId of ['su-a', 'su-b', 'su-c', 'su-d']) {
      const memberships = [membershipOf(SCHULE, spatialUnitId)];
      const rows = memberships.map((membership) => rowForExistingMembership(membership, SCHULE));

      expect(membershipsByLevelForRows(rows, EDIT_HIERARCHIES, spatialUnitId)).toEqual([
        { hierarchyId: 'h-4', hierarchyLevel: memberships[0].hierarchyLevel },
      ]);
    }
  });

  it('reproduces a membership in a hierarchy of one', () => {
    const membership = membershipOf(SOLO, 'su-b');

    expect(
      membershipsByLevelForRows(
        [rowForExistingMembership(membership, SOLO)],
        EDIT_HIERARCHIES,
        'su-b'
      )
    ).toEqual([{ hierarchyId: 'h-solo', hierarchyLevel: 0 }]);
  });
});

describe('sameMemberships', () => {
  it('ignores the order the two lists happen to have', () => {
    expect(
      sameMemberships(
        [
          { hierarchyId: 'h-4', hierarchyLevel: 1 },
          { hierarchyId: 'h-solo', hierarchyLevel: 0 },
        ],
        [
          { hierarchyId: 'h-solo', hierarchyLevel: 0 },
          { hierarchyId: 'h-4', hierarchyLevel: 1 },
        ]
      )
    ).toBe(true);
  });

  it('sees a changed level, a dropped membership and an added one', () => {
    const current = [{ hierarchyId: 'h-4', hierarchyLevel: 1 }];

    expect(sameMemberships([{ hierarchyId: 'h-4', hierarchyLevel: 2 }], current)).toBe(false);
    expect(sameMemberships([], current)).toBe(false);
    expect(
      sameMemberships(
        [
          { hierarchyId: 'h-4', hierarchyLevel: 1 },
          { hierarchyId: 'h-solo', hierarchyLevel: 0 },
        ],
        current
      )
    ).toBe(false);
  });

  it('treats a membership without a level as the top one, as the schema does', () => {
    expect(
      sameMemberships([{ hierarchyId: 'h-4', hierarchyLevel: 0 }], [{ hierarchyId: 'h-4' }])
    ).toBe(true);
  });
});

describe('assignmentSummary, for a level already in the chain', () => {
  it('reads a sole member as the first level, not as one appended behind itself', () => {
    expect(
      assignmentSummary(
        rowForExistingMembership(membershipOf(SOLO, 'su-b'), SOLO),
        EDIT_HIERARCHIES,
        'su-b'
      )
    ).toMatchObject({
      key: 'ADMIN_SPATIAL_UNITS.HIERARCHY_ASSIGNMENT.RESULT_APPEND_EMPTY',
    });
  });

  it('names the level below it where it sits above one', () => {
    expect(
      assignmentSummary(
        { hierarchyId: 'h-4', placement: 'above', referenceSpatialUnitId: 'su-c' },
        EDIT_HIERARCHIES,
        'su-b'
      )
    ).toEqual({
      key: 'ADMIN_SPATIAL_UNITS.HIERARCHY_ASSIGNMENT.RESULT_ABOVE',
      params: { hierarchy: 'Schulbezirke', level: 'C' },
    });
  });
});
