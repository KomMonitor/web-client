import { FormControl } from '@angular/forms';
import type { TimeseriesMapping } from 'services/resource-import-service/resource-import.model';
import {
  addOrUpdateTimeseriesMapping,
  buildTimeseriesMappingDraftForm,
  isValidTimeseriesMappingList,
  patchTimeseriesMappingDraft,
  removeTimeseriesMapping,
  resetTimeseriesMappingDraft,
  timeseriesMappingDraftToEntry,
  timeseriesMappingsRequiredValidator,
} from './timeseries-mapping-form.model';

/**
 * Pure model tests, no TestBed — same shape as
 * `attributeMappingDraftForm/attribute-mapping-draft-form.model.spec.ts`.
 *
 * The cases pin the behaviour of the AngularJS `indicatorEditTimeseriesMapping`
 * component this model replaces, above all its keyed replace semantics.
 */

describe('buildTimeseriesMappingDraftForm', () => {
  it('starts invalid: neither attribute name nor time stamp is set', () => {
    expect(buildTimeseriesMappingDraftForm().invalid).toBe(true);
  });

  it('requires the indicator value attribute', () => {
    const form = buildTimeseriesMappingDraftForm();
    form.patchValue({ timestamp: '2026-01-01' });

    expect(form.controls.indicatorValueProperty.hasError('required')).toBe(true);
    expect(form.invalid).toBe(true);
  });

  it('accepts a direct time stamp while the toggle is off', () => {
    const form = buildTimeseriesMappingDraftForm();
    form.patchValue({ indicatorValueProperty: 'DATE_2008-01-01', timestamp: '2008-01-01' });

    expect(form.valid).toBe(true);
  });

  it('accepts a time-stamp attribute while the toggle is on', () => {
    const form = buildTimeseriesMappingDraftForm();
    form.patchValue({
      indicatorValueProperty: 'value',
      useTimestampProperty: true,
      timestampProperty: 'year',
    });

    expect(form.valid).toBe(true);
  });

  it('requires the source the toggle points at, not just either one', () => {
    const form = buildTimeseriesMappingDraftForm();
    form.patchValue({
      indicatorValueProperty: 'value',
      useTimestampProperty: true,
      timestamp: '2008-01-01',
    });

    expect(form.hasError('timestampSourceRequired')).toBe(true);
    expect(form.errors!['timestampSourceRequired']).toEqual({ useProperty: true });
  });

  it('treats a whitespace-only time stamp as missing', () => {
    const form = buildTimeseriesMappingDraftForm();
    form.patchValue({ indicatorValueProperty: 'value', timestamp: '   ' });

    expect(form.hasError('timestampSourceRequired')).toBe(true);
  });
});

describe('timeseriesMappingDraftToEntry', () => {
  it('trims the attribute name and keeps only the direct time stamp', () => {
    const form = buildTimeseriesMappingDraftForm();
    form.patchValue({ indicatorValueProperty: '  DATE_2008  ', timestamp: '2008-01-01' });

    const entry = timeseriesMappingDraftToEntry(form);

    expect(entry).toEqual({ indicatorValueProperty: 'DATE_2008', timestamp: '2008-01-01' });
    expect('timestampProperty' in entry).toBe(false);
  });

  it('keeps only the time-stamp attribute when the toggle is on', () => {
    const form = buildTimeseriesMappingDraftForm();
    form.patchValue({
      indicatorValueProperty: 'value',
      useTimestampProperty: true,
      timestampProperty: '  year  ',
      timestamp: '2008-01-01',
    });

    const entry = timeseriesMappingDraftToEntry(form);

    expect(entry).toEqual({ indicatorValueProperty: 'value', timestampProperty: 'year' });
    expect('timestamp' in entry).toBe(false);
  });
});

describe('patchTimeseriesMappingDraft', () => {
  it('turns the toggle on for an entry carrying a time-stamp attribute', () => {
    const form = buildTimeseriesMappingDraftForm();

    patchTimeseriesMappingDraft(form, {
      indicatorValueProperty: 'value',
      timestampProperty: 'year',
    });

    expect(form.getRawValue()).toEqual({
      indicatorValueProperty: 'value',
      useTimestampProperty: true,
      timestampProperty: 'year',
      timestamp: '',
    });
  });

  it('turns the toggle off for an entry carrying a direct time stamp', () => {
    const form = buildTimeseriesMappingDraftForm();
    form.patchValue({ useTimestampProperty: true, timestampProperty: 'year' });

    patchTimeseriesMappingDraft(form, {
      indicatorValueProperty: 'DATE_2009',
      timestamp: '2009-01-01',
    });

    expect(form.getRawValue()).toEqual({
      indicatorValueProperty: 'DATE_2009',
      useTimestampProperty: false,
      timestampProperty: '',
      timestamp: '2009-01-01',
    });
  });
});

describe('resetTimeseriesMappingDraft', () => {
  it('clears every field including the toggle', () => {
    const form = buildTimeseriesMappingDraftForm();
    form.patchValue({
      indicatorValueProperty: 'value',
      useTimestampProperty: true,
      timestampProperty: 'year',
    });

    resetTimeseriesMappingDraft(form);

    expect(form.getRawValue()).toEqual({
      indicatorValueProperty: '',
      useTimestampProperty: false,
      timestampProperty: '',
      timestamp: '',
    });
  });
});

describe('addOrUpdateTimeseriesMapping', () => {
  const existing: TimeseriesMapping[] = [
    { indicatorValueProperty: 'DATE_2008', timestamp: '2008-01-01' },
    { indicatorValueProperty: 'DATE_2009', timestampProperty: '2009' },
  ];

  it('appends an entry for a new attribute name', () => {
    const next = addOrUpdateTimeseriesMapping(existing, {
      indicatorValueProperty: 'DATE_2010',
      timestamp: '2010-01-01',
    });

    expect(next).toHaveLength(3);
    expect(next[2]).toEqual({ indicatorValueProperty: 'DATE_2010', timestamp: '2010-01-01' });
  });

  it('replaces the entry of an existing attribute name in place', () => {
    const next = addOrUpdateTimeseriesMapping(existing, {
      indicatorValueProperty: 'DATE_2008',
      timestampProperty: 'year',
    });

    expect(next).toHaveLength(2);
    expect(next[0]).toEqual({ indicatorValueProperty: 'DATE_2008', timestampProperty: 'year' });
  });

  it('does not mutate the list it was given', () => {
    addOrUpdateTimeseriesMapping(existing, {
      indicatorValueProperty: 'DATE_2008',
      timestamp: '1999-01-01',
    });

    expect(existing[0]).toEqual({ indicatorValueProperty: 'DATE_2008', timestamp: '2008-01-01' });
  });
});

describe('removeTimeseriesMapping', () => {
  it('drops the entry with the matching attribute name', () => {
    const list: TimeseriesMapping[] = [
      { indicatorValueProperty: 'a', timestamp: '2008-01-01' },
      { indicatorValueProperty: 'b', timestamp: '2009-01-01' },
    ];

    expect(removeTimeseriesMapping(list, list[0])).toEqual([
      { indicatorValueProperty: 'b', timestamp: '2009-01-01' },
    ]);
  });

  it('leaves the list untouched when nothing matches', () => {
    const list: TimeseriesMapping[] = [{ indicatorValueProperty: 'a', timestamp: '2008-01-01' }];

    expect(removeTimeseriesMapping(list, { indicatorValueProperty: 'z' })).toEqual(list);
  });
});

describe('isValidTimeseriesMappingList', () => {
  it('accepts entries with either time-stamp source', () => {
    expect(
      isValidTimeseriesMappingList([
        { indicatorValueProperty: 'a', timestamp: '2008-01-01' },
        { indicatorValueProperty: 'b', timestampProperty: 'year' },
      ])
    ).toBe(true);
  });

  it('accepts an empty list (the required validator reports that separately)', () => {
    expect(isValidTimeseriesMappingList([])).toBe(true);
  });

  it('rejects an entry without any time-stamp source', () => {
    expect(isValidTimeseriesMappingList([{ indicatorValueProperty: 'a' }])).toBe(false);
  });

  it('rejects an entry without an attribute name', () => {
    expect(isValidTimeseriesMappingList([{ timestamp: '2008-01-01' }])).toBe(false);
  });

  it('rejects anything that is not an array', () => {
    expect(isValidTimeseriesMappingList(null)).toBe(false);
    expect(isValidTimeseriesMappingList({ indicatorValueProperty: 'a' })).toBe(false);
  });
});

describe('timeseriesMappingsRequiredValidator', () => {
  it('flags an empty mapping list', () => {
    const control = new FormControl<TimeseriesMapping[]>([], {
      nonNullable: true,
      validators: [timeseriesMappingsRequiredValidator],
    });

    expect(control.hasError('timeseriesMappingRequired')).toBe(true);
  });

  it('accepts a list with at least one entry', () => {
    const control = new FormControl<TimeseriesMapping[]>(
      [{ indicatorValueProperty: 'a', timestamp: '2008-01-01' }],
      { nonNullable: true, validators: [timeseriesMappingsRequiredValidator] }
    );

    expect(control.valid).toBe(true);
  });
});
