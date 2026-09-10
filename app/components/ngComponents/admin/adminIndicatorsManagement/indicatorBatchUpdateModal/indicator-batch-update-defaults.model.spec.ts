import type {
  Converter,
  DatasourceType,
} from 'services/resource-import-service/resource-import.model';
import {
  applyColumnDefault,
  availableColumnTargets,
  buildDefaultValueForm,
  formatColumnTarget,
  mergeTimeseriesMappings,
  parseColumnTarget,
} from './indicator-batch-update-defaults.model';
import {
  buildBatchRow,
  buildBatchUpdateForm,
  syncBatchRowParameterControls,
} from './indicator-batch-update-form.model';

const CSV: Converter = {
  name: 'Tabelle_Zeitreihe_zu_Indikator',
  type: 'indicator',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8'],
  parameters: [{ name: 'Trennzeichen', mandatory: true }],
};

const HTTP_SOURCE: DatasourceType = {
  type: 'HTTP',
  parameters: [{ name: 'URL', mandatory: true }],
};

function formWithRows(count: number, converter: Converter | null = CSV) {
  const form = buildBatchUpdateForm();
  for (let index = 0; index < count; index += 1) {
    const row = buildBatchRow();
    if (converter) {
      row.controls.converter.setValue(converter);
      row.controls.datasourceType.setValue(HTTP_SOURCE);
      syncBatchRowParameterControls(row);
    }
    form.controls.rows.push(row);
  }
  return form;
}

describe('column target round trip', () => {
  it.each([
    { kind: 'timeseriesMappings' as const },
    { kind: 'converter' as const },
    { kind: 'datasourceType' as const },
    { kind: 'text' as const, control: 'mimeType' as const },
    { kind: 'converterParameter' as const, name: 'Trennzeichen' },
    { kind: 'datasourceParameter' as const, name: 'URL' },
  ])('survives format and parse: %o', (target) => {
    expect(parseColumnTarget(formatColumnTarget(target))).toEqual(target);
  });

  it('rejects an unknown or malformed value', () => {
    expect(parseColumnTarget('')).toBeNull();
    expect(parseColumnTarget('nonsense')).toBeNull();
    expect(parseColumnTarget('text:notAControl')).toBeNull();
    expect(parseColumnTarget('converterParameter:')).toBeNull();
  });

  it('handles a parameter name that contains a colon', () => {
    const target = { kind: 'converterParameter' as const, name: 'a:b' };

    expect(parseColumnTarget(formatColumnTarget(target))).toEqual(target);
  });
});

describe('availableColumnTargets', () => {
  it('offers one entry per parameter the rows actually declare', () => {
    const targets = availableColumnTargets(formWithRows(1));

    expect(targets).toContainEqual({ kind: 'converterParameter', name: 'Trennzeichen' });
    expect(targets).toContainEqual({ kind: 'datasourceParameter', name: 'URL' });
  });

  it('offers the fixed columns even for an empty list', () => {
    const targets = availableColumnTargets(buildBatchUpdateForm());

    expect(targets).toContainEqual({ kind: 'timeseriesMappings' });
    expect(targets).toContainEqual({ kind: 'text', control: 'targetSpatialUnitId' });
    expect(targets.filter((target) => target.kind.endsWith('Parameter'))).toEqual([]);
  });
});

describe('mergeTimeseriesMappings', () => {
  const existing = [
    { indicatorValueProperty: 'A', timestamp: '2008-01-01' },
    { indicatorValueProperty: 'B', timestamp: '2009-01-01' },
  ];

  it('appends entries the row does not have yet', () => {
    const merged = mergeTimeseriesMappings(
      existing,
      [{ indicatorValueProperty: 'C', timestamp: '2010-01-01' }],
      false
    );

    expect(merged).toHaveLength(3);
    expect(merged[2]).toEqual({ indicatorValueProperty: 'C', timestamp: '2010-01-01' });
  });

  it('keeps an existing entry when overwriting is off', () => {
    const merged = mergeTimeseriesMappings(
      existing,
      [{ indicatorValueProperty: 'A', timestamp: '1999-01-01' }],
      false
    );

    expect(merged).toEqual(existing);
  });

  it('replaces an existing entry when overwriting is on', () => {
    const merged = mergeTimeseriesMappings(
      existing,
      [{ indicatorValueProperty: 'A', timestamp: '1999-01-01' }],
      true
    );

    expect(merged[0]).toEqual({ indicatorValueProperty: 'A', timestamp: '1999-01-01' });
    expect(merged[1]).toEqual(existing[1]);
  });

  it('writes the replacement at the position of the match, not of the incoming entry', () => {
    // The legacy implementation used the incoming index here, so an entry that
    // matched at position 1 overwrote position 0.
    const merged = mergeTimeseriesMappings(
      existing,
      [
        { indicatorValueProperty: 'C', timestamp: '2010-01-01' },
        { indicatorValueProperty: 'B', timestamp: '1999-01-01' },
      ],
      true
    );

    expect(merged[0]).toEqual({ indicatorValueProperty: 'A', timestamp: '2008-01-01' });
    expect(merged[1]).toEqual({ indicatorValueProperty: 'B', timestamp: '1999-01-01' });
  });

  it('does not mutate the arrays it was given', () => {
    mergeTimeseriesMappings(existing, [{ indicatorValueProperty: 'A', timestamp: 'x' }], true);

    expect(existing[0].timestamp).toBe('2008-01-01');
  });
});

describe('applyColumnDefault', () => {
  it('does nothing while no column is selected', () => {
    const form = formWithRows(2);

    expect(applyColumnDefault(form, buildDefaultValueForm())).toBe(0);
  });

  it('fills an empty text column in every row', () => {
    const form = formWithRows(2);
    const defaults = buildDefaultValueForm();
    defaults.patchValue({
      column: formatColumnTarget({ kind: 'text', control: 'spatialReferenceKeyProperty' }),
      textValue: 'ags',
    });

    expect(applyColumnDefault(form, defaults)).toBe(2);
    expect(
      form.controls.rows.controls.map((row) => row.controls.spatialReferenceKeyProperty.value)
    ).toEqual(['ags', 'ags']);
  });

  it('leaves a filled cell alone unless overwriting is on', () => {
    const form = formWithRows(2);
    form.controls.rows.controls[0].controls.spatialReferenceKeyProperty.setValue('keep-me');
    const defaults = buildDefaultValueForm();
    defaults.patchValue({
      column: formatColumnTarget({ kind: 'text', control: 'spatialReferenceKeyProperty' }),
      textValue: 'ags',
    });

    expect(applyColumnDefault(form, defaults)).toBe(1);
    expect(form.controls.rows.controls[0].controls.spatialReferenceKeyProperty.value).toBe(
      'keep-me'
    );

    defaults.controls.replaceAll.setValue(true);
    expect(applyColumnDefault(form, defaults)).toBe(2);
    expect(form.controls.rows.controls[0].controls.spatialReferenceKeyProperty.value).toBe('ags');
  });

  it('never applies an empty value', () => {
    const form = formWithRows(1);
    const defaults = buildDefaultValueForm();
    defaults.patchValue({
      column: formatColumnTarget({ kind: 'text', control: 'spatialReferenceKeyProperty' }),
      textValue: '',
      replaceAll: true,
    });

    expect(applyColumnDefault(form, defaults)).toBe(0);
  });

  it('fills the converter object column', () => {
    const form = formWithRows(2, null);
    const defaults = buildDefaultValueForm();
    defaults.patchValue({
      column: formatColumnTarget({ kind: 'converter' }),
      converterValue: CSV,
    });

    expect(applyColumnDefault(form, defaults)).toBe(2);
    expect(form.controls.rows.controls[0].controls.converter.value).toBe(CSV);
  });

  it('fills a converter parameter only in rows that declare it', () => {
    const form = formWithRows(1);
    const other = buildBatchRow();
    other.controls.converter.setValue({ ...CSV, name: 'other', parameters: [] });
    syncBatchRowParameterControls(other);
    form.controls.rows.push(other);
    const defaults = buildDefaultValueForm();
    defaults.patchValue({
      column: formatColumnTarget({ kind: 'converterParameter', name: 'Trennzeichen' }),
      textValue: ';',
    });

    expect(applyColumnDefault(form, defaults)).toBe(1);
    expect(
      form.controls.rows.controls[0].controls.converterParameters.controls['Trennzeichen'].value
    ).toBe(';');
    expect(
      form.controls.rows.controls[1].controls.converterParameters.controls['Trennzeichen']
    ).toBeUndefined();
  });

  it('skips a disabled control, as the legacy DOM check did', () => {
    const form = formWithRows(2);
    form.controls.rows.controls[0].controls.spatialReferenceKeyProperty.disable();
    const defaults = buildDefaultValueForm();
    defaults.patchValue({
      column: formatColumnTarget({ kind: 'text', control: 'spatialReferenceKeyProperty' }),
      textValue: 'ags',
      replaceAll: true,
    });

    expect(applyColumnDefault(form, defaults)).toBe(1);
    expect(form.controls.rows.controls[0].controls.spatialReferenceKeyProperty.value).toBe('');
  });

  it('merges the default timeseries mapping into every row', () => {
    const form = formWithRows(2);
    form.controls.rows.controls[0].controls.timeseriesMappings.setValue([
      { indicatorValueProperty: 'A', timestamp: '2008-01-01' },
    ]);
    const defaults = buildDefaultValueForm();
    defaults.patchValue({
      column: formatColumnTarget({ kind: 'timeseriesMappings' }),
      timeseriesMappings: [{ indicatorValueProperty: 'B', timestamp: '2009-01-01' }],
    });

    expect(applyColumnDefault(form, defaults)).toBe(2);
    expect(form.controls.rows.controls[0].controls.timeseriesMappings.value).toHaveLength(2);
    expect(form.controls.rows.controls[1].controls.timeseriesMappings.value).toEqual([
      { indicatorValueProperty: 'B', timestamp: '2009-01-01' },
    ]);
  });

  it('does not touch the rows for an empty default mapping', () => {
    const form = formWithRows(1);
    const defaults = buildDefaultValueForm();
    defaults.controls.column.setValue(formatColumnTarget({ kind: 'timeseriesMappings' }));

    expect(applyColumnDefault(form, defaults)).toBe(0);
  });
});
