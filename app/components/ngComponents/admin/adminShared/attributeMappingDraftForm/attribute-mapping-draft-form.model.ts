import { FormControl, FormGroup, Validators } from '@angular/forms';
import type {
  AttributeMappingRow,
  AttributeMappingType,
} from 'services/resource-import-service/resource-import.model';

/**
 * The "add or edit an attribute mapping" row that sits above the mapping table
 * in the spatial-unit and georesource importer steps. It is a staging area, not
 * part of the submitted payload: `attributeMappingDraftToRow()` turns a
 * completed draft into a row for `addOrUpdateAttributeMapping()`.
 *
 * Replaces the three-clause `[disabled]` expressions on the add buttons with
 * `draft.invalid`.
 */

export type AttributeMappingDraftFormGroup = FormGroup<{
  sourceName: FormControl<string>;
  destinationName: FormControl<string>;
  dataType: FormControl<AttributeMappingType | null>;
}>;

export function buildAttributeMappingDraftForm(
  defaultType: AttributeMappingType | null = null
): AttributeMappingDraftFormGroup {
  return new FormGroup({
    sourceName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    destinationName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dataType: new FormControl<AttributeMappingType | null>(defaultType, Validators.required),
  });
}

/** Serialises the draft into a table row. Trims the two attribute names. */
export function attributeMappingDraftToRow(
  form: AttributeMappingDraftFormGroup
): AttributeMappingRow {
  const value = form.getRawValue();
  return {
    sourceName: value.sourceName.trim(),
    destinationName: value.destinationName.trim(),
    dataType: value.dataType as AttributeMappingType,
  };
}

/** Loads an existing row back into the draft for editing. */
export function patchAttributeMappingDraft(
  form: AttributeMappingDraftFormGroup,
  row: AttributeMappingRow
): void {
  form.patchValue({
    sourceName: row.sourceName,
    destinationName: row.destinationName,
    dataType: row.dataType,
  });
}

/**
 * Clears the draft after a row was added. `reset()` alone would drop the
 * pre-selected default data type, which the modals restore by hand today.
 */
export function resetAttributeMappingDraft(
  form: AttributeMappingDraftFormGroup,
  defaultType: AttributeMappingType | null = null
): void {
  form.reset({ sourceName: '', destinationName: '', dataType: defaultType });
}
