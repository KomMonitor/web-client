import { ValidationErrors } from '@angular/forms';

/**
 * Maps Angular validator error keys to the `ADMIN_SHARED_UI.VALIDATION.*` i18n
 * namespace rendered by `<app-form-error>`. Pure and TestBed-free so the
 * mapping can be tested on its own.
 */

export const FORM_ERROR_I18N_PREFIX = 'ADMIN_SHARED_UI.VALIDATION.';

/** Validator error key -> i18n sub-key under `FORM_ERROR_I18N_PREFIX`. */
export const FORM_ERROR_KEY_MAP: Readonly<Record<string, string>> = {
  // Angular built-ins
  required: 'REQUIRED',
  requiredTrue: 'REQUIRED',
  minlength: 'MIN_LENGTH',
  maxlength: 'MAX_LENGTH',
  min: 'MIN',
  max: 'MAX',
  pattern: 'PATTERN',
  // KmDatePickerComponent (NG_VALIDATORS)
  dateFormat: 'DATE_FORMAT',
  minDate: 'MIN_DATE',
  maxDate: 'MAX_DATE',
  // adminShared/validators
  uniqueName: 'UNIQUE_NAME',
  periodOfValidity: 'PERIOD_OF_VALIDITY',
  spatialUnitHierarchy: 'SPATIAL_UNIT_HIERARCHY',
  bboxIncomplete: 'BBOX_INCOMPLETE',
  topicRequired: 'TOPIC_REQUIRED',
};

/**
 * Evaluation order — the most actionable message wins when a control carries
 * several errors at once. "Fill this in" always beats "the value you filled in
 * collides with an existing one".
 */
export const FORM_ERROR_PRIORITY: readonly string[] = [
  'required',
  'requiredTrue',
  'topicRequired',
  'dateFormat',
  'pattern',
  'minlength',
  'maxlength',
  'min',
  'max',
  'minDate',
  'maxDate',
  'uniqueName',
  'periodOfValidity',
  'spatialUnitHierarchy',
  'bboxIncomplete',
];

export interface ResolvedFormError {
  /** Full i18n key, ready for the `translate` pipe. */
  key: string;
  /** Interpolation parameters for that key. */
  params: Record<string, unknown>;
}

/**
 * Turns a control's `errors` object into the single message to render.
 *
 * Parameter rule, so an unmapped validator can never produce a broken message:
 * an object error value is spread (`minlength: {requiredLength, actualLength}`),
 * a scalar one is wrapped as `{ value }` (`minDate: '2026-01-01'`), and a plain
 * `true` yields no parameters. Unknown error keys fall back to the generic
 * `UNKNOWN` message rather than leaking a raw key into the UI.
 */
export function resolveFormError(
  errors: ValidationErrors | null | undefined
): ResolvedFormError | null {
  if (!errors) {
    return null;
  }

  const presentKeys = Object.keys(errors);
  if (presentKeys.length === 0) {
    return null;
  }

  const errorKey =
    FORM_ERROR_PRIORITY.find((candidate) => presentKeys.includes(candidate)) ?? presentKeys[0];

  const subKey = FORM_ERROR_KEY_MAP[errorKey];
  if (!subKey) {
    return { key: `${FORM_ERROR_I18N_PREFIX}UNKNOWN`, params: { code: errorKey } };
  }

  return { key: `${FORM_ERROR_I18N_PREFIX}${subKey}`, params: toParams(errors[errorKey]) };
}

function toParams(errorValue: unknown): Record<string, unknown> {
  if (errorValue === true || errorValue === null || errorValue === undefined) {
    return {};
  }
  if (typeof errorValue === 'object') {
    return { ...(errorValue as Record<string, unknown>) };
  }
  return { value: errorValue };
}
