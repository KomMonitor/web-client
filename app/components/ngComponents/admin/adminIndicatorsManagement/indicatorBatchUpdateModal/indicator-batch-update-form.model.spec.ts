import type {
  Converter,
  DatasourceType,
} from 'services/resource-import-service/resource-import.model';
import {
  BATCH_RUN_BLOCKER_KEYS,
  batchRowToConverterConfig,
  batchRowToDatasourceConfig,
  buildBatchRow,
  buildBatchUpdateForm,
  collectBatchRunBlockers,
  hasFileDatasourceRow,
  syncBatchRowParameterControls,
  visibleConverterParameterNames,
  visibleDatasourceParameterNames,
} from './indicator-batch-update-form.model';

/**
 * Pure model tests, no TestBed. `collectBatchRunBlockers` gets the most cases:
 * it replaces `checkIfNameAndFilesChosenInEachRow()`, which wrote German
 * sentences straight into `document.getElementById(...).title`.
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

const WFS: Converter = {
  name: 'WFS_v1',
  type: 'indicator',
  mimeTypes: ['text/xml'],
  encodings: ['UTF-8'],
  schemas: ['default'],
  parameters: [{ name: 'NAMESPACE', mandatory: false }],
};

/** As the importer declares it: `NAME` is the uploaded file's server-side name. */
const FILE_SOURCE: DatasourceType = {
  type: 'FILE',
  parameters: [{ name: 'NAME', mandatory: true }],
};
const HTTP_SOURCE: DatasourceType = {
  type: 'HTTP',
  parameters: [{ name: 'URL', mandatory: true }],
};

function completeRow(overrides: { converter?: Converter; datasourceType?: DatasourceType } = {}) {
  const row = buildBatchRow();
  row.patchValue({
    indicatorId: 'ind-1',
    timeseriesMappings: [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
    converter: overrides.converter ?? CSV,
    mimeType: 'text/csv',
    datasourceType: overrides.datasourceType ?? FILE_SOURCE,
    selectedFile: new File(['a'], 'a.csv'),
    spatialReferenceKeyProperty: 'ags',
    targetSpatialUnitId: 'su-1',
  });
  syncBatchRowParameterControls(row);
  row.controls.converterParameters.controls['Trennzeichen']?.setValue(';');
  if (overrides.converter === WFS) {
    row.controls.schema.setValue('default');
  }
  return row;
}

function formWith(...rows: ReturnType<typeof buildBatchRow>[]) {
  const form = buildBatchUpdateForm();
  rows.forEach((row) => form.controls.rows.push(row));
  return form;
}

describe('buildBatchRow', () => {
  it('starts invalid with an empty required set', () => {
    const row = buildBatchRow();

    expect(row.controls.indicatorId.hasError('required')).toBe(true);
    expect(row.controls.converter.hasError('required')).toBe(true);
    expect(row.controls.datasourceType.hasError('required')).toBe(true);
    expect(row.controls.spatialReferenceKeyProperty.hasError('required')).toBe(true);
    expect(row.controls.targetSpatialUnitId.hasError('required')).toBe(true);
    expect(row.controls.timeseriesMappings.hasError('timeseriesMappingRequired')).toBe(true);
  });

  it('is unticked by default, like a freshly added legacy row', () => {
    // The AngularJS `addNewRowToBatchList()` created the row with
    // `isSelected = false`. With `true`, one click on "delete selected rows"
    // wiped the whole list before the user had ticked anything.
    expect(buildBatchRow().controls.selected.value).toBe(false);
  });

  it('becomes valid once every required field is filled', () => {
    expect(completeRow().valid).toBe(true);
  });

  it('requires a file for a FILE data source only', () => {
    const row = completeRow();
    row.controls.selectedFile.setValue(null);
    expect(row.hasError('fileRequired')).toBe(true);

    row.controls.datasourceType.setValue(HTTP_SOURCE);
    expect(row.hasError('fileRequired')).toBe(false);
  });

  it('requires a schema only for a converter that declares schemas', () => {
    const row = completeRow();
    expect(row.hasError('schemaRequired')).toBe(false);

    row.controls.converter.setValue(WFS);
    row.controls.mimeType.setValue('text/xml');
    expect(row.hasError('schemaRequired')).toBe(true);

    row.controls.schema.setValue('default');
    expect(row.hasError('schemaRequired')).toBe(false);
  });

  it('requires a mime type as soon as the converter offers one', () => {
    const row = completeRow();
    row.controls.mimeType.setValue('');

    expect(row.hasError('mimeTypeRequired')).toBe(true);
  });
});

describe('syncBatchRowParameterControls', () => {
  it('builds a control per converter and data-source parameter', () => {
    const row = buildBatchRow();
    row.controls.converter.setValue(CSV);
    row.controls.datasourceType.setValue(HTTP_SOURCE);

    syncBatchRowParameterControls(row);

    expect(Object.keys(row.controls.converterParameters.controls)).toEqual(['Trennzeichen', 'CRS']);
    expect(Object.keys(row.controls.datasourceTypeParameters.controls)).toEqual(['URL']);
    expect(row.controls.converterParameters.controls['Trennzeichen'].hasError('required')).toBe(
      true
    );
    expect(row.controls.converterParameters.controls['CRS'].valid).toBe(true);
  });

  it('keeps the value of a parameter that survives a converter change', () => {
    const row = buildBatchRow();
    row.controls.converter.setValue(CSV);
    syncBatchRowParameterControls(row);
    row.controls.converterParameters.controls['CRS'].setValue('EPSG:25832');

    row.controls.converter.setValue({ ...CSV, parameters: [{ name: 'CRS', mandatory: false }] });
    syncBatchRowParameterControls(row);

    expect(Object.keys(row.controls.converterParameters.controls)).toEqual(['CRS']);
    expect(row.controls.converterParameters.controls['CRS'].value).toBe('EPSG:25832');
  });
});

describe('parameter columns', () => {
  it('collects the union of the rows parameters, in converter order', () => {
    const first = buildBatchRow();
    first.controls.converter.setValue(CSV);
    const second = buildBatchRow();
    second.controls.converter.setValue(WFS);

    expect(visibleConverterParameterNames(formWith(first, second))).toEqual([
      'Trennzeichen',
      'CRS',
      'NAMESPACE',
    ]);
  });

  it('offers no parameter column for a FILE data source', () => {
    // `NAME` is filled by the upload; as a column it exposed an internal field
    // and its required control kept the row invalid.
    const file = buildBatchRow();
    file.controls.datasourceType.setValue(FILE_SOURCE);

    expect(visibleDatasourceParameterNames(formWith(file))).toEqual([]);
    expect(Object.keys(file.controls.datasourceTypeParameters.controls)).toEqual([]);
  });

  it('does not repeat a parameter two rows share', () => {
    const first = buildBatchRow();
    first.controls.datasourceType.setValue(HTTP_SOURCE);
    const second = buildBatchRow();
    second.controls.datasourceType.setValue(HTTP_SOURCE);

    expect(visibleDatasourceParameterNames(formWith(first, second))).toEqual(['URL']);
  });

  it('reports the file column as soon as one row uses a FILE data source', () => {
    const http = buildBatchRow();
    http.controls.datasourceType.setValue(HTTP_SOURCE);
    expect(hasFileDatasourceRow(formWith(http))).toBe(false);

    const file = buildBatchRow();
    file.controls.datasourceType.setValue(FILE_SOURCE);
    expect(hasFileDatasourceRow(formWith(http, file))).toBe(true);
  });
});

describe('collectBatchRunBlockers', () => {
  it('reports the empty list on its own', () => {
    expect(collectBatchRunBlockers(buildBatchUpdateForm())).toEqual([
      BATCH_RUN_BLOCKER_KEYS.emptyList,
    ]);
  });

  it('is empty for a complete row', () => {
    expect(collectBatchRunBlockers(formWith(completeRow()))).toEqual([]);
  });

  it('reports the missing name', () => {
    const row = completeRow();
    row.controls.indicatorId.setValue('');

    expect(collectBatchRunBlockers(formWith(row))).toEqual([BATCH_RUN_BLOCKER_KEYS.name]);
  });

  it('reports a missing timeseries mapping', () => {
    const row = completeRow();
    row.controls.timeseriesMappings.setValue([]);

    expect(collectBatchRunBlockers(formWith(row))).toEqual([
      BATCH_RUN_BLOCKER_KEYS.timeseriesMapping,
    ]);
  });

  it('reports an incomplete converter for a missing mandatory parameter', () => {
    const row = completeRow();
    row.controls.converterParameters.controls['Trennzeichen'].setValue('');

    expect(collectBatchRunBlockers(formWith(row))).toEqual([BATCH_RUN_BLOCKER_KEYS.converter]);
  });

  it('reports a missing file as a data-source blocker', () => {
    const row = completeRow();
    row.controls.selectedFile.setValue(null);

    expect(collectBatchRunBlockers(formWith(row))).toEqual([BATCH_RUN_BLOCKER_KEYS.datasource]);
  });

  it('reports a missing URL of an HTTP data source', () => {
    const row = completeRow({ datasourceType: HTTP_SOURCE });
    syncBatchRowParameterControls(row);

    expect(collectBatchRunBlockers(formWith(row))).toEqual([BATCH_RUN_BLOCKER_KEYS.datasource]);
  });

  it('reports the missing reference key and target spatial unit', () => {
    const row = completeRow();
    row.controls.spatialReferenceKeyProperty.setValue('');
    row.controls.targetSpatialUnitId.setValue('');

    expect(collectBatchRunBlockers(formWith(row))).toEqual([
      BATCH_RUN_BLOCKER_KEYS.spatialReferenceKey,
      BATCH_RUN_BLOCKER_KEYS.targetSpatialUnit,
    ]);
  });

  it('reports a blocker once, no matter how many rows carry it', () => {
    const first = completeRow();
    first.controls.indicatorId.setValue('');
    const second = completeRow();
    second.controls.indicatorId.setValue('');

    expect(collectBatchRunBlockers(formWith(first, second))).toEqual([BATCH_RUN_BLOCKER_KEYS.name]);
  });

  it('orders the blockers most actionable first', () => {
    const row = buildBatchRow();

    expect(collectBatchRunBlockers(formWith(row))).toEqual([
      BATCH_RUN_BLOCKER_KEYS.name,
      BATCH_RUN_BLOCKER_KEYS.timeseriesMapping,
      BATCH_RUN_BLOCKER_KEYS.converter,
      BATCH_RUN_BLOCKER_KEYS.datasourceType,
      BATCH_RUN_BLOCKER_KEYS.spatialReferenceKey,
      BATCH_RUN_BLOCKER_KEYS.targetSpatialUnit,
    ]);
  });
});

describe('row to importer config', () => {
  it('hands the parameter record over keyed by importer parameter name', () => {
    const config = batchRowToConverterConfig(completeRow());

    expect(config).toEqual({
      converter: CSV,
      schema: '',
      mimeType: 'text/csv',
      encoding: undefined,
      converterParameterValues: { Trennzeichen: ';', CRS: '' },
    });
  });

  it('passes an explicitly chosen encoding on', () => {
    const row = completeRow();
    row.controls.encoding.setValue('ISO-8859-1');

    expect(batchRowToConverterConfig(row).encoding).toBe('ISO-8859-1');
  });

  it('never hands over a DOM file input — batch rows carry the file themselves', () => {
    const config = batchRowToDatasourceConfig(completeRow());

    expect(config.fileInputElement).toBeNull();
    expect(config.selectedFile).toBeInstanceOf(File);
    expect(config.datasourceType).toEqual(FILE_SOURCE);
  });
});
