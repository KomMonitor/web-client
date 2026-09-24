import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toIsoDateString } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
import { validatePeriodOfValidity } from 'services/adminSpatialUnit/spatial-unit-metadata.util';

/**
 * Shared validators for the admin reactive forms. They replace the hand-written
 * `check…()` methods and their `…Invalid` boolean flags in the add/edit modals;
 * the error keys map to the `ADMIN_SHARED_UI.VALIDATION.*` i18n namespace
 * rendered by `<app-form-error>`.
 *
 * The name validators take lazy getters rather than plain arrays so a store
 * that is still loading when the form is built is picked up on the next
 * `updateValueAndValidity()`.
 */

export interface UniqueNameValidatorOptions {
  /**
   * Name that is allowed even though it is in the list — the record's own
   * current name in edit modals.
   */
  ignore?: () => string | null | undefined;
  /** Compare verbatim instead of trimmed + case-insensitive (default: false). */
  caseSensitive?: boolean;
}

/**
 * Rejects a name that is already taken. Empty values are left to
 * `Validators.required` so the user sees "field is required" rather than a
 * misleading duplicate-name message.
 *
 * Note: unlike the historic `checkSpatialUnitName()`/`checkDatasetName()` this
 * compares trimmed and case-insensitively by default — `'Stadtteile'` and
 * `'stadtteile'` used to pass the client check and then collide server-side.
 */
export function uniqueNameValidator(
  existingNames: () => readonly string[],
  options: UniqueNameValidatorOptions = {}
): ValidatorFn {
  const normalize = (value: string): string =>
    options.caseSensitive ? value : value.trim().toLowerCase();

  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (typeof raw !== 'string' || raw.trim() === '') {
      return null;
    }

    const candidate = normalize(raw);
    const ignored = options.ignore?.();
    if (typeof ignored === 'string' && normalize(ignored) === candidate) {
      return null;
    }

    const taken = (existingNames() ?? []).some(
      (name) => typeof name === 'string' && normalize(name) === candidate
    );
    return taken ? { uniqueName: { name: raw } } : null;
  };
}

/**
 * Group validator for a `{ startDate, endDate }` pair: both are optional, but
 * when both are set the start must lie strictly before the end. Values are
 * normalised with `toIsoDateString()` first, so `NgbDateStruct` objects coming
 * from `<km-date-picker>` are handled.
 */
export function periodOfValidityValidator(
  startKey: string = 'startDate',
  endKey: string = 'endDate'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const startIso = toIsoDateString(group.get(startKey)?.value);
    const endIso = toIsoDateString(group.get(endKey)?.value);

    const validation = validatePeriodOfValidity(startIso as any, endIso as any);
    return validation.isValid ? null : { periodOfValidity: true };
  };
}

/**
 * Group validator for a literal bounding box: either all four corners are set
 * or none of them. Mirrors the bbox branch of
 * `ResourceImportService.collectMissingImporterFields()`.
 */
export function bboxCompleteValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const corners = ['minx', 'miny', 'maxx', 'maxy'].map((key) => group.get(key)?.value);
    const isSet = (value: any): boolean => value !== null && value !== undefined && value !== '';

    const setCount = corners.filter(isSet).length;
    if (setCount === 0 || setCount === corners.length) {
      return null;
    }
    return { bboxIncomplete: true };
  };
}
