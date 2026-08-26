import { FormControl, FormGroup, Validators } from '@angular/forms';
import { toIsoDateString } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
import { periodOfValidityValidator } from '../validators/admin-validators';

/**
 * Shared `{ startDate, endDate }` block of the resource add/edit modals,
 * including the cross-field rule that a set start must lie before a set end.
 * Both controls hold ISO `YYYY-MM-DD` strings, so `<km-date-picker>` binds to
 * them directly via `formControlName`.
 */

export interface PeriodOfValidityValue {
  startDate: string;
  endDate: string;
}

export type PeriodOfValidityFormGroup = FormGroup<{
  startDate: FormControl<string>;
  endDate: FormControl<string>;
}>;

export interface PeriodOfValidityFormOptions {
  /** Adds `Validators.required` to `startDate` (most POST bodies require one). */
  requireStart?: boolean;
}

export function buildPeriodOfValidityForm(
  options: PeriodOfValidityFormOptions = {}
): PeriodOfValidityFormGroup {
  return new FormGroup(
    {
      startDate: new FormControl('', {
        nonNullable: true,
        validators: options.requireStart ? [Validators.required] : [],
      }),
      endDate: new FormControl('', { nonNullable: true }),
    },
    { validators: periodOfValidityValidator() }
  );
}

/** Applies raw (possibly `NgbDateStruct`) values, normalised to ISO strings. */
export function patchPeriodOfValidityForm(
  form: PeriodOfValidityFormGroup,
  period: { startDate?: unknown; endDate?: unknown } | null | undefined
): void {
  form.patchValue({
    startDate: toIsoDateString(period?.startDate) ?? '',
    endDate: toIsoDateString(period?.endDate) ?? '',
  });
}

/**
 * Wire format for the POST/PUT bodies. Empty dates become null so the API sees
 * an open-ended period rather than an empty string.
 */
export function periodOfValidityFormToApi(form: PeriodOfValidityFormGroup): {
  startDate: string | null;
  endDate: string | null;
} {
  const value = form.getRawValue();
  return {
    startDate: toIsoDateString(value.startDate),
    endDate: toIsoDateString(value.endDate),
  };
}
