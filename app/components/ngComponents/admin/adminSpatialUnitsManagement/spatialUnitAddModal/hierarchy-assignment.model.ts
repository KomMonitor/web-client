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
  SpatialUnitHierarchyMembershipPOSTInputType,
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
 * `placementFor`) belongs to `PUT /spatial-units/{id}/hierarchies`, the path
 * the edit dialog takes. The two wire shapes are not interchangeable.
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

/** What the row's result line says, as a translation key plus its parameters. */
export interface HierarchyAssignmentSummary {
  readonly key: string;
  readonly params: { hierarchy: string; level?: string };
}

const SUMMARY_PREFIX = 'ADMIN_SPATIAL_UNITS.METADATA_STEP';

/**
 * Spells out where the row puts the new level, so the choice can be read back
 * in words instead of inferred from three selects. A key with parameters, not
 * a sentence: the texts live in the i18n files like every other label.
 */
export function assignmentSummary(
  row: HierarchyAssignmentRow,
  hierarchies: readonly SpatialUnitHierarchyOverviewType[]
): HierarchyAssignmentSummary | null {
  const hierarchy = hierarchies.find((entry) => entry.hierarchyId === row.hierarchyId);
  if (!hierarchy) {
    return null;
  }
  const members = orderedMembersOf(hierarchy);
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
