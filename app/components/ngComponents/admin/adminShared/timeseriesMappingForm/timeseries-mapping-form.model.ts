import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import type { TimeseriesMapping } from 'services/resource-import-service/resource-import.model';

/**
 * The "add or edit a time-series mapping" draft row that sits above the mapping
 * table in the indicator importer steps. It is a staging area, not part of the
 * submitted payload: `timeseriesMappingDraftToEntry()` turns a completed draft
 * into an entry for `addOrUpdateTimeseriesMapping()`.
 *
 * Ported from the AngularJS `indicatorEditTimeseriesMapping` component, whose
 * three-clause `ng-disabled` on the add button is replaced by `draft.invalid`.
 *
 * The mapping list is keyed by `indicatorValueProperty`: adding an entry whose
 * attribute name already exists **replaces** it rather than appending a second
 * mapping for the same attribute.
 */

export type TimeseriesMappingDraftFormGroup = FormGroup<{
  indicatorValueProperty: FormControl<string>;
  /** Umschalter: read the time stamp from an attribute instead of entering it. */
  useTimestampProperty: FormControl<boolean>;
  timestampProperty: FormControl<string>;
  /**
   * ISO date, `YYYY-MM-DD` — the format `km-date-picker` reads and writes. It
   * writes `null` when the field is cleared, so the type admits null.
   */
  timestamp: FormControl<string | null>;
}>;

/**
 * Requires the time-stamp source the toggle points at. The legacy add button
 * accepted either field regardless of the toggle, which only worked because
 * switching the toggle cleared the other one; validating the *active* source
 * says the same thing without relying on that side effect.
 */
export function timestampSourceValidator(group: AbstractControl): ValidationErrors | null {
  const useProperty = !!group.get('useTimestampProperty')?.value;
  const active = useProperty ? group.get('timestampProperty') : group.get('timestamp');
  const value = (active?.value ?? '') as string;

  return value.trim() ? null : { timestampSourceRequired: { useProperty } };
}

export function buildTimeseriesMappingDraftForm(): TimeseriesMappingDraftFormGroup {
  return new FormGroup(
    {
      indicatorValueProperty: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      useTimestampProperty: new FormControl(false, { nonNullable: true }),
      timestampProperty: new FormControl('', { nonNullable: true }),
      timestamp: new FormControl<string | null>(''),
    },
    { validators: [timestampSourceValidator] }
  );
}

/**
 * Serialises the draft into a mapping entry. Trims both attribute names and
 * omits the time-stamp source the toggle does not point at — the legacy
 * component wrote `undefined` there, which `JSON.stringify` drops anyway, so
 * the wire format is unchanged.
 */
export function timeseriesMappingDraftToEntry(
  form: TimeseriesMappingDraftFormGroup
): TimeseriesMapping {
  const value = form.getRawValue();
  const entry: TimeseriesMapping = {
    indicatorValueProperty: value.indicatorValueProperty.trim(),
  };

  if (value.useTimestampProperty) {
    entry.timestampProperty = value.timestampProperty.trim();
  } else {
    entry.timestamp = (value.timestamp ?? '').trim();
  }

  return entry;
}

/** Loads an existing entry back into the draft for editing. */
export function patchTimeseriesMappingDraft(
  form: TimeseriesMappingDraftFormGroup,
  entry: TimeseriesMapping
): void {
  form.patchValue({
    indicatorValueProperty: entry.indicatorValueProperty,
    useTimestampProperty: !!entry.timestampProperty,
    timestampProperty: entry.timestampProperty ?? '',
    timestamp: entry.timestamp ?? '',
  });
}

/** Clears the draft after an entry was added, toggle included. */
export function resetTimeseriesMappingDraft(form: TimeseriesMappingDraftFormGroup): void {
  form.reset({
    indicatorValueProperty: '',
    useTimestampProperty: false,
    timestampProperty: '',
    timestamp: '',
  });
}

/**
 * Adds `entry` to `list`, replacing an existing entry for the same
 * `indicatorValueProperty`. Returns a new array — the value is handed to a form
 * control, so it must not be mutated in place.
 */
export function addOrUpdateTimeseriesMapping(
  list: readonly TimeseriesMapping[],
  entry: TimeseriesMapping
): TimeseriesMapping[] {
  const index = list.findIndex(
    (candidate) => candidate.indicatorValueProperty === entry.indicatorValueProperty
  );

  if (index === -1) {
    return [...list, entry];
  }

  const next = [...list];
  next[index] = entry;
  return next;
}

/** Removes the entry for `entry.indicatorValueProperty`, if any. */
export function removeTimeseriesMapping(
  list: readonly TimeseriesMapping[],
  entry: TimeseriesMapping
): TimeseriesMapping[] {
  return list.filter(
    (candidate) => candidate.indicatorValueProperty !== entry.indicatorValueProperty
  );
}

/**
 * Guards a mapping list read from a file. The legacy `loadTimeseriesMapping`
 * threw a string on bad input; this reports instead, so the importing modal can
 * show its own error.
 */
export function isValidTimeseriesMappingList(value: unknown): value is TimeseriesMapping[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((entry) => {
    if (!entry || typeof entry !== 'object') {
      return false;
    }
    const candidate = entry as Partial<TimeseriesMapping>;
    return (
      typeof candidate.indicatorValueProperty === 'string' &&
      (typeof candidate.timestamp === 'string' || typeof candidate.timestampProperty === 'string')
    );
  });
}

/**
 * Submit gate for the importer steps: at least one time slice must be mapped,
 * or the importer receives an empty `timeseriesMappings` array and imports
 * nothing. Mirrors the legacy `timeseriesMappingReference.length === 0` clause.
 */
export function timeseriesMappingsRequiredValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value as TimeseriesMapping[] | null | undefined;

  return Array.isArray(value) && value.length > 0 ? null : { timeseriesMappingRequired: true };
}
