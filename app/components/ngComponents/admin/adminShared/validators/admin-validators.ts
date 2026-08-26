import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { toIsoDateString } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
import { validatePeriodOfValidity } from 'services/adminSpatialUnit/spatial-unit-metadata.util';

/**
 * Shared validators for the admin reactive forms. They replace the hand-written
 * `check…()` methods and their `…Invalid` boolean flags in the add/edit modals;
 * the error keys map to the `ADMIN_SHARED_UI.VALIDATION.*` i18n namespace
 * rendered by `<app-form-error>`.
 *
 * The name/hierarchy validators take lazy getters rather than plain arrays so a
 * store that is still loading when the form is built is picked up on the next
 * `updateValueAndValidity()`.
 */

/** Minimal shape the hierarchy validator needs from a spatial-unit dataset. */
export interface SpatialUnitLevelRef {
  spatialUnitLevel: string;
}

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
 * Pure core of `spatialUnitHierarchyValidator`, exported for direct testing.
 *
 * Smaller indices represent coarser spatial units, so the "next lower" level
 * must sit *behind* the "next upper" one in the ordered list. Levels the store
 * does not know are treated as valid — this mirrors the historic
 * implementation, which left its index variables `undefined` and relied on
 * `undefined <= undefined` being false. A naive `findIndex` rewrite would turn
 * that into `-1 <= -1` and start rejecting unknown levels.
 */
export function isSpatialUnitHierarchyValid(
  orderedSpatialUnits: readonly SpatialUnitLevelRef[],
  lowerLevel: string | null | undefined,
  upperLevel: string | null | undefined
): boolean {
  if (!lowerLevel || !upperLevel) {
    return true;
  }

  const units = orderedSpatialUnits ?? [];
  const indexOfLower = units.findIndex((unit) => unit?.spatialUnitLevel === lowerLevel);
  const indexOfUpper = units.findIndex((unit) => unit?.spatialUnitLevel === upperLevel);

  if (indexOfLower === -1 || indexOfUpper === -1) {
    return true;
  }

  return indexOfLower > indexOfUpper;
}

/**
 * Group validator for the two hierarchy selects of the spatial-unit modals.
 * The controls hold the spatial-unit dataset objects (or null).
 */
export function spatialUnitHierarchyValidator(
  orderedSpatialUnits: () => readonly SpatialUnitLevelRef[],
  lowerKey: string = 'nextLowerHierarchySpatialUnit',
  upperKey: string = 'nextUpperHierarchySpatialUnit'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const lower = group.get(lowerKey)?.value as SpatialUnitLevelRef | null;
    const upper = group.get(upperKey)?.value as SpatialUnitLevelRef | null;

    const valid = isSpatialUnitHierarchyValid(
      orderedSpatialUnits() ?? [],
      lower?.spatialUnitLevel,
      upper?.spatialUnitLevel
    );
    return valid ? null : { spatialUnitHierarchy: true };
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
