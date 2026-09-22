import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  SpatialUnitHierarchyMemberType,
  SpatialUnitHierarchyMembershipInputType,
  SpatialUnitHierarchyMembershipPOSTInputType,
  SpatialUnitHierarchyMembershipType,
  SpatialUnitHierarchyOverviewType,
} from 'models/data-management-api';

/**
 * One row of the "Zuordnung zu Hierarchien" panel of the add wizard: the new
 * spatial unit level joins a hierarchy at a place described by its neighbours.
 *
 * That shape is the API's, not an invention here. `SpatialUnitPOSTInputType`
 * takes `SpatialUnitHierarchyMembershipPOSTInputType`, which names the next
 * upper and the next lower spatial unit — "Leave empty if the spatial unit is
 * the top level" and the mirror of it. A row therefore carries one reference
 * level at most, never both, which is also what the panel says.
 *
 * The level-based sibling (`{ hierarchyId, hierarchyLevel }`, built by
 * `membershipsByLevelForRows` below) belongs to
 * `PUT /spatial-units/{id}/hierarchies`, the path the edit dialog takes. The
 * two wire shapes are not interchangeable, which is why the same row maps
 * through two different functions depending on which dialog sends it.
 */
export type HierarchyPlacementMode = 'append' | 'above' | 'below';

/** A row as the form holds it. */
export interface HierarchyAssignmentRow {
  readonly hierarchyId: string;
  readonly placement: HierarchyPlacementMode;
  /** The level the new one is placed against; unused while appending. */
  readonly referenceSpatialUnitId: string;
}

export type HierarchyAssignmentRowGroup = FormGroup<{
  hierarchyId: FormControl<string>;
  placement: FormControl<HierarchyPlacementMode>;
  referenceSpatialUnitId: FormControl<string>;
}>;

/**
 * A row that names no hierarchy is not "optional", it is unfinished — the
 * panel as a whole may stay empty, a row may not.
 */
export function buildAssignmentRow(
  values: Partial<HierarchyAssignmentRow> = {}
): HierarchyAssignmentRowGroup {
  return new FormGroup(
    {
      hierarchyId: new FormControl(values.hierarchyId ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      placement: new FormControl<HierarchyPlacementMode>(values.placement ?? 'append', {
        nonNullable: true,
      }),
      referenceSpatialUnitId: new FormControl(values.referenceSpatialUnitId ?? '', {
        nonNullable: true,
      }),
    },
    { validators: [referenceRequiredUnlessAppend] }
  );
}

/** Above or below what? Appending needs no answer, the other two do. */
export function referenceRequiredUnlessAppend(group: AbstractControl): ValidationErrors | null {
  const { placement, referenceSpatialUnitId } = group.value as Partial<HierarchyAssignmentRow>;
  return placement !== 'append' && !referenceSpatialUnitId ? { referenceRequired: true } : null;
}

/**
 * One hierarchy per row: the endpoint replaces the whole membership list, so a
 * second row for the same hierarchy could only contradict the first.
 */
export function distinctHierarchies(control: AbstractControl): ValidationErrors | null {
  const rows = (control.value ?? []) as HierarchyAssignmentRow[];
  const named = rows.map((row) => row.hierarchyId).filter((id) => id !== '');
  return new Set(named).size === named.length ? null : { duplicateHierarchy: true };
}

/**
 * The hierarchy's members, coarsest first.
 *
 * Sorted by `hierarchyLevel` rather than taken as they come: the backend orders
 * by that value and pays no attention to the array, so the array is the one
 * thing that may be out of order.
 */
export function orderedMembersOf(
  hierarchy: SpatialUnitHierarchyOverviewType | undefined
): readonly SpatialUnitHierarchyMemberType[] {
  return [...(hierarchy?.members ?? [])].sort(
    (a, b) => (a.hierarchyLevel ?? 0) - (b.hierarchyLevel ?? 0)
  );
}

/**
 * One row as the POST expects it, or null where the row does not describe a
 * place yet — no hierarchy, or a reference level the user still has to pick.
 * Total on purpose: the form blocks those rows anyway, and a mapper that
 * throws would turn a half-filled dialog into a crash.
 */
export function membershipForRow(
  row: HierarchyAssignmentRow,
  hierarchies: readonly SpatialUnitHierarchyOverviewType[]
): SpatialUnitHierarchyMembershipPOSTInputType | null {
  if (!row.hierarchyId) {
    return null;
  }

  if (row.placement === 'append') {
    const last = orderedMembersOf(
      hierarchies.find((entry) => entry.hierarchyId === row.hierarchyId)
    ).at(-1);
    // An empty hierarchy has no neighbour to name: the level becomes its first,
    // which is top and bottom at once.
    return last
      ? { hierarchyId: row.hierarchyId, nextUpperSpatialUnitId: last.spatialUnitId }
      : { hierarchyId: row.hierarchyId };
  }

  if (!row.referenceSpatialUnitId) {
    return null;
  }
  return row.placement === 'above'
    ? { hierarchyId: row.hierarchyId, nextLowerSpatialUnitId: row.referenceSpatialUnitId }
    : { hierarchyId: row.hierarchyId, nextUpperSpatialUnitId: row.referenceSpatialUnitId };
}

/** The whole panel, in the order of its rows, without the unfinished ones. */
export function membershipsForRows(
  rows: readonly HierarchyAssignmentRow[],
  hierarchies: readonly SpatialUnitHierarchyOverviewType[]
): SpatialUnitHierarchyMembershipPOSTInputType[] {
  return rows
    .map((row) => membershipForRow(row, hierarchies))
    .filter(
      (membership): membership is SpatialUnitHierarchyMembershipPOSTInputType => !!membership
    );
}

/**
 * The hierarchy's chain, coarsest first, without one spatial unit.
 *
 * Everything the edit dialog computes is computed against this rather than
 * against the raw chain: a level is never its own neighbour, and while it is
 * being placed it is not in the chain it is being placed into. Passing the
 * empty string leaves the chain as it is, which is what the add wizard does —
 * a level that does not exist yet is in no chain to begin with.
 */
export function chainWithout(
  hierarchy: SpatialUnitHierarchyOverviewType | undefined,
  spatialUnitId: string
): readonly SpatialUnitHierarchyMemberType[] {
  const members = orderedMembersOf(hierarchy);
  return spatialUnitId
    ? members.filter((member) => member.spatialUnitId !== spatialUnitId)
    : members;
}

/**
 * A membership the dataset already has, as the row that reproduces it.
 *
 * Every position can be said in the panel's own words, and exactly: a level at
 * the bottom of its chain — or alone in it — is where "append" puts it, and any
 * other level is directly above the one below it. Left untouched, such a row
 * therefore maps back to the very membership it came from, which is what makes
 * "the user changed nothing" detectable.
 *
 * Read from the membership's own neighbour fields, with the chain as a
 * fallback: the edit dialog seeds its rows while the hierarchy list is still in
 * flight, and `nextLowerSpatialUnitId` is optional in the schema.
 */
export function rowForExistingMembership(
  membership: SpatialUnitHierarchyMembershipType,
  hierarchy?: SpatialUnitHierarchyOverviewType
): HierarchyAssignmentRow {
  const below = membership.nextLowerSpatialUnitId ?? lowerNeighbourOf(membership, hierarchy);
  return below
    ? { hierarchyId: membership.hierarchyId, placement: 'above', referenceSpatialUnitId: below }
    : { hierarchyId: membership.hierarchyId, placement: 'append', referenceSpatialUnitId: '' };
}

/** The member one step finer than this membership, straight from the chain. */
function lowerNeighbourOf(
  membership: SpatialUnitHierarchyMembershipType,
  hierarchy?: SpatialUnitHierarchyOverviewType
): string {
  const members = orderedMembersOf(hierarchy);
  const index = members.findIndex((member) => member.hierarchyLevel === membership.hierarchyLevel);
  return index >= 0 ? (members[index + 1]?.spatialUnitId ?? '') : '';
}

/**
 * One row as `PUT /spatial-units/{id}/hierarchies` expects it, or null where the
 * row does not describe a place yet — total for the same reason
 * `membershipForRow` is.
 *
 * This endpoint takes the level, not the neighbours, so the position has to be
 * worked out here. It is an index into the chain the unit is *not* part of, so
 * it comes out dense, which is what the backend orders and renumbers by.
 */
export function membershipLevelForRow(
  row: HierarchyAssignmentRow,
  hierarchies: readonly SpatialUnitHierarchyOverviewType[],
  selfSpatialUnitId = ''
): SpatialUnitHierarchyMembershipInputType | null {
  if (!row.hierarchyId) {
    return null;
  }

  const chain = chainWithout(
    hierarchies.find((entry) => entry.hierarchyId === row.hierarchyId),
    selfSpatialUnitId
  ).map((member) => member.spatialUnitId);

  if (row.placement === 'append') {
    return { hierarchyId: row.hierarchyId, hierarchyLevel: chain.length };
  }

  const reference = chain.indexOf(row.referenceSpatialUnitId);
  if (reference < 0) {
    return null;
  }
  return {
    hierarchyId: row.hierarchyId,
    hierarchyLevel: row.placement === 'above' ? reference : reference + 1,
  };
}

/**
 * The whole panel as the membership list of one spatial unit, in the order of
 * its rows and without the unfinished ones.
 *
 * The list is complete on purpose: the endpoint replaces every membership the
 * unit has, so a hierarchy missing from it is a hierarchy the unit leaves.
 */
export function membershipsByLevelForRows(
  rows: readonly HierarchyAssignmentRow[],
  hierarchies: readonly SpatialUnitHierarchyOverviewType[],
  selfSpatialUnitId = ''
): SpatialUnitHierarchyMembershipInputType[] {
  return rows
    .map((row) => membershipLevelForRow(row, hierarchies, selfSpatialUnitId))
    .filter((membership): membership is SpatialUnitHierarchyMembershipInputType => !!membership);
}

/**
 * Whether two membership lists say the same thing, whatever order they are in.
 *
 * What the "nothing changed, write nothing" decision rests on. Compared as a
 * set rather than position by position, because the rows follow the panel while
 * the dataset follows the server.
 */
export function sameMemberships(
  a: readonly SpatialUnitHierarchyMembershipInputType[],
  b: readonly { hierarchyId?: string; hierarchyLevel?: number }[]
): boolean {
  const key = (entry: { hierarchyId?: string; hierarchyLevel?: number }): string =>
    `${entry.hierarchyId ?? ''}:${entry.hierarchyLevel ?? 0}`;
  const left = a.map(key).sort();
  const right = b.map(key).sort();
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

/** What the row's result line says, as a translation key plus its parameters. */
export interface HierarchyAssignmentSummary {
  readonly key: string;
  readonly params: { hierarchy: string; level?: string };
}

const SUMMARY_PREFIX = 'ADMIN_SPATIAL_UNITS.HIERARCHY_ASSIGNMENT';

/**
 * Spells out where the row puts the new level, so the choice can be read back
 * in words instead of inferred from three selects. A key with parameters, not
 * a sentence: the texts live in the i18n files like every other label.
 */
export function assignmentSummary(
  row: HierarchyAssignmentRow,
  hierarchies: readonly SpatialUnitHierarchyOverviewType[],
  selfSpatialUnitId = ''
): HierarchyAssignmentSummary | null {
  const hierarchy = hierarchies.find((entry) => entry.hierarchyId === row.hierarchyId);
  if (!hierarchy) {
    return null;
  }
  // Without the unit itself: a level that is a chain's only member appends into
  // an empty chain, and it must not read itself as its own neighbour.
  const members = chainWithout(hierarchy, selfSpatialUnitId);
  const name = hierarchy.name ?? '';

  if (row.placement === 'append') {
    return {
      key: `${SUMMARY_PREFIX}.${members.length > 0 ? 'RESULT_APPEND' : 'RESULT_APPEND_EMPTY'}`,
      params: { hierarchy: name },
    };
  }

  const reference = members.find(
    (member) => member.spatialUnitId === row.referenceSpatialUnitId
  )?.spatialUnitLevel;
  if (!reference) {
    return null;
  }
  return {
    key: `${SUMMARY_PREFIX}.${row.placement === 'above' ? 'RESULT_ABOVE' : 'RESULT_BELOW'}`,
    params: { hierarchy: name, level: reference },
  };
}

/** The panel's rows, with the one rule that spans them. */
export function buildHierarchyAssignmentArray(): FormArray<HierarchyAssignmentRowGroup> {
  return new FormArray<HierarchyAssignmentRowGroup>([], { validators: [distinctHierarchies] });
}
