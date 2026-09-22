import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  HierarchyAssignmentRowGroup,
  buildHierarchyAssignmentArray,
} from '../hierarchyAssignment/hierarchy-assignment.model';
import {
  ResourceMetadataFormGroup,
  buildResourceMetadataForm,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';
import { LinePatternOption } from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';

/**
 * Typed model of the spatial-unit "edit metadata" modal.
 *
 * Same shape as the `metadata` step of the add wizard, but with this modal's own
 * outline defaults (`#bf3d2c` / width 2 instead of `#000000` / 3) and a
 * uniqueness rule that ignores the dataset being edited.
 */

export const EDIT_DEFAULT_OUTLINE_COLOR = '#bf3d2c';
export const EDIT_DEFAULT_OUTLINE_WIDTH = 2;

export type SpatialUnitEditMetadataFormGroup = FormGroup<{
  spatialUnitLevel: FormControl<string>;
  /** The hierarchies the level belongs to, one row each. May be empty. */
  hierarchyAssignments: FormArray<HierarchyAssignmentRowGroup>;
  isOutlineLayer: FormControl<boolean>;
  outlineColor: FormControl<string>;
  outlineWidth: FormControl<number>;
  outlineDashArray: FormControl<LinePatternOption | null>;
  general: ResourceMetadataFormGroup;
}>;

export interface SpatialUnitEditMetadataFormOptions {
  /** Existing level names, re-read on every validation run. */
  existingLevelNames: () => readonly string[];
  /** The edited dataset's own name, so it does not collide with itself. */
  currentLevelName: () => string | null;
}

export function buildSpatialUnitEditMetadataForm(
  options: SpatialUnitEditMetadataFormOptions
): SpatialUnitEditMetadataFormGroup {
  return new FormGroup({
    spatialUnitLevel: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        uniqueNameValidator(options.existingLevelNames, { ignore: options.currentLevelName }),
      ],
    }),
    // Through the builder, not by hand: the "one row per hierarchy" rule lives
    // on the array, and the membership write replaces the whole list — two rows
    // for one hierarchy could only contradict each other.
    hierarchyAssignments: buildHierarchyAssignmentArray(),
    isOutlineLayer: new FormControl(false, { nonNullable: true }),
    outlineColor: new FormControl(EDIT_DEFAULT_OUTLINE_COLOR, { nonNullable: true }),
    outlineWidth: new FormControl(EDIT_DEFAULT_OUTLINE_WIDTH, { nonNullable: true }),
    outlineDashArray: new FormControl<LinePatternOption | null>(null),
    general: buildResourceMetadataForm(),
  });
}
