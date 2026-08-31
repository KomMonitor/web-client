import type {
  Converter,
  DatasourceType,
} from 'services/resource-import-service/resource-import.model';
import {
  BatchListFileRow,
  batchListFileRowToRow,
  batchRowToFileRow,
  keepMissingValuesFromFile,
} from './indicator-batch-update-file.model';
import { buildBatchRow, syncBatchRowParameterControls } from './indicator-batch-update-form.model';

/**
 * The on-disk format must stay readable for lists exported by the released
 * AngularJS client, so the fixture below is shaped exactly like its output:
 * `name` is the bare indicator id, converter and data source are importer
 * definitions with a name/value parameter array, and the target spatial unit
 * travels as its level name.
 */

const CSV: Converter = {
  name: 'Tabelle_Zeitreihe_zu_Indikator',
  type: 'indicator',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8', 'ISO-8859-1'],
  parameters: [
    { name: 'Trennzeichen', mandatory: true },
    { name: 'CRS', mandatory: false },
  ],
};

const HTTP_SOURCE: DatasourceType = {
  type: 'HTTP',
  parameters: [{ name: 'URL', mandatory: true }],
};

const FILE_SOURCE: DatasourceType = {
  type: 'FILE',
  parameters: [{ name: 'NAME', mandatory: true }],
};

const SPATIAL_UNITS = [
  { spatialUnitId: 'su-1', spatialUnitLevel: 'Stadtteile' },
  { spatialUnitId: 'su-2', spatialUnitLevel: 'Baublöcke' },
];

const CONTEXT = {
  converters: [CSV],
  datasourceTypes: [HTTP_SOURCE, FILE_SOURCE],
  spatialUnits: SPATIAL_UNITS,
};

const LEGACY_ROW: BatchListFileRow = {
  name: 'ind-1',
  isSelected: false,
  mappingTableName: 'mapping.json',
  mappingObj: {
    converter: {
      name: 'Tabelle_Zeitreihe_zu_Indikator',
      encoding: 'ISO-8859-1',
      mimeType: 'text/csv',
      parameters: [{ name: 'Trennzeichen', value: ';' }],
    },
    dataSource: {
      type: 'HTTP',
      parameters: [{ name: 'URL', value: 'https://example.org/data.csv' }],
    },
    propertyMapping: {
      timeseriesMappings: [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
      spatialReferenceKeyProperty: 'ags',
      keepMissingOrNullValueIndicator: false,
    },
    targetSpatialUnitName: 'Baublöcke',
  },
};

describe('batchListFileRowToRow', () => {
  it('reads a list exported by the released AngularJS client', () => {
    const row = buildBatchRow();

    batchListFileRowToRow(row, LEGACY_ROW, CONTEXT);

    expect(row.getRawValue()).toMatchObject({
      selected: false,
      indicatorId: 'ind-1',
      mappingTableName: 'mapping.json',
      converter: CSV,
      mimeType: 'text/csv',
      encoding: 'ISO-8859-1',
      spatialReferenceKeyProperty: 'ags',
      targetSpatialUnitId: 'su-2',
      timeseriesMappings: [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
    });
    expect(row.controls.datasourceType.value).toEqual(HTTP_SOURCE);
  });

  it('restores the parameter values under their importer parameter names', () => {
    const row = buildBatchRow();

    batchListFileRowToRow(row, LEGACY_ROW, CONTEXT);

    expect(row.controls.converterParameters.getRawValue()).toEqual({
      Trennzeichen: ';',
      CRS: '',
    });
    expect(row.controls.datasourceTypeParameters.getRawValue()).toEqual({
      URL: 'https://example.org/data.csv',
    });
  });

  /**
   * An imported FILE row used to come back with a *required* `NAME` control that
   * the table never renders a column for, so the row was permanently invalid and
   * "run update" stayed disabled with a blocker naming a field the user cannot
   * see. The FILE rule belongs to `syncBatchRowParameterControls`, and the
   * import has to go through it like every other path.
   */
  it('gives a FILE data source no parameter controls at all', () => {
    const row = buildBatchRow();

    batchListFileRowToRow(
      row,
      {
        ...LEGACY_ROW,
        mappingObj: {
          ...LEGACY_ROW.mappingObj,
          dataSource: { type: 'FILE', parameters: [{ name: 'NAME', value: 'upload-123.csv' }] },
        },
      },
      CONTEXT
    );

    expect(row.controls.datasourceTypeParameters.getRawValue()).toEqual({});
    expect(row.controls.datasourceTypeParameters.valid).toBe(true);
    // The upload name is single-use, so the file itself is never restored.
    expect(row.controls.selectedFile.value).toBeNull();
  });

  it('leaves an imported FILE row blocked by nothing but the missing file', () => {
    const row = buildBatchRow();

    batchListFileRowToRow(
      row,
      {
        ...LEGACY_ROW,
        mappingObj: {
          ...LEGACY_ROW.mappingObj,
          dataSource: { type: 'FILE', parameters: [] },
        },
      },
      CONTEXT
    );

    expect(row.errors).toEqual({ fileRequired: true });
    expect(row.controls.datasourceTypeParameters.valid).toBe(true);

    row.controls.selectedFile.setValue(new File(['gid;wert'], 'werte.csv'));

    expect(row.errors).toBeNull();
    expect(row.valid).toBe(true);
  });

  it('leaves the converter unresolved when the importer no longer offers it', () => {
    const row = buildBatchRow();

    batchListFileRowToRow(
      row,
      { ...LEGACY_ROW, mappingObj: { ...LEGACY_ROW.mappingObj, converter: { name: 'gone' } } },
      CONTEXT
    );

    expect(row.controls.converter.value).toBeNull();
    expect(row.controls.converterParameters.getRawValue()).toEqual({});
  });

  it('leaves the target spatial unit empty for an unknown level name', () => {
    const row = buildBatchRow();

    batchListFileRowToRow(
      row,
      { ...LEGACY_ROW, mappingObj: { ...LEGACY_ROW.mappingObj, targetSpatialUnitName: 'gone' } },
      CONTEXT
    );

    expect(row.controls.targetSpatialUnitId.value).toBe('');
  });

  it('ignores a malformed timeseries mapping instead of importing it', () => {
    const row = buildBatchRow();

    batchListFileRowToRow(
      row,
      {
        ...LEGACY_ROW,
        mappingObj: {
          ...LEGACY_ROW.mappingObj,
          propertyMapping: { timeseriesMappings: [{ nonsense: true }] as never },
        },
      },
      CONTEXT
    );

    expect(row.controls.timeseriesMappings.value).toEqual([]);
  });

  it('defaults a row without isSelected to selected', () => {
    const row = buildBatchRow();

    batchListFileRowToRow(row, { name: 'ind-2' }, CONTEXT);

    expect(row.controls.selected.value).toBe(true);
  });
});

describe('batchRowToFileRow', () => {
  function exportableRow() {
    const row = buildBatchRow();
    row.patchValue({
      selected: true,
      indicatorId: 'ind-1',
      mappingTableName: 'mapping.json',
      converter: CSV,
      mimeType: 'text/csv',
      datasourceType: HTTP_SOURCE,
      spatialReferenceKeyProperty: 'ags',
      targetSpatialUnitId: 'su-1',
      timeseriesMappings: [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
    });
    syncBatchRowParameterControls(row);
    row.controls.converterParameters.controls['Trennzeichen'].setValue(';');
    row.controls.datasourceTypeParameters.controls['URL'].setValue('https://example.org/d.csv');
    return row;
  }

  it('writes the legacy shape back', () => {
    const fileRow = batchRowToFileRow(exportableRow(), { availableSpatialUnits: SPATIAL_UNITS });

    expect(fileRow).toEqual({
      name: 'ind-1',
      isSelected: true,
      mappingTableName: 'mapping.json',
      mappingObj: {
        converter: {
          name: 'Tabelle_Zeitreihe_zu_Indikator',
          encoding: 'UTF-8',
          mimeType: 'text/csv',
          schema: undefined,
          parameters: [{ name: 'Trennzeichen', value: ';' }],
        },
        dataSource: {
          type: 'HTTP',
          parameters: [{ name: 'URL', value: 'https://example.org/d.csv' }],
        },
        propertyMapping: {
          timeseriesMappings: [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
          spatialReferenceKeyProperty: 'ags',
        },
        targetSpatialUnitName: 'Stadtteile',
      },
    });
  });

  it('falls back to the converter default encoding', () => {
    const row = exportableRow();
    row.controls.encoding.setValue('');

    expect(
      batchRowToFileRow(row, { availableSpatialUnits: SPATIAL_UNITS }).mappingObj!.converter!
        .encoding
    ).toBe('UTF-8');
  });

  it('survives a round trip through the file format', () => {
    const exported = batchRowToFileRow(exportableRow(), { availableSpatialUnits: SPATIAL_UNITS });
    const reimported = buildBatchRow();

    batchListFileRowToRow(reimported, exported, CONTEXT);

    expect(reimported.getRawValue()).toMatchObject({
      indicatorId: 'ind-1',
      converter: CSV,
      mimeType: 'text/csv',
      spatialReferenceKeyProperty: 'ags',
      targetSpatialUnitId: 'su-1',
    });
    expect(reimported.controls.converterParameters.getRawValue()).toEqual({
      Trennzeichen: ';',
      CRS: '',
    });
  });
});

describe('keepMissingValuesFromFile', () => {
  it('takes the flag of the first row that carries it', () => {
    expect(keepMissingValuesFromFile([{ name: 'a' }, LEGACY_ROW])).toBe(false);
  });

  it('returns undefined when no row carries it', () => {
    expect(keepMissingValuesFromFile([{ name: 'a' }])).toBeUndefined();
  });
});
