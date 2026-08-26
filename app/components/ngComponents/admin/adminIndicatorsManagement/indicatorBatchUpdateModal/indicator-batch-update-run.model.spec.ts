import type {
  Converter,
  DatasourceType,
} from 'services/resource-import-service/resource-import.model';
import {
  BATCH_PREPARE_MESSAGE_KEYS,
  IndicatorRunMetadata,
  buildIndicatorScopeProperties,
  prepareBatchRows,
} from './indicator-batch-update-run.model';
import {
  buildBatchRow,
  buildBatchUpdateForm,
  syncBatchRowParameterControls,
} from './indicator-batch-update-form.model';

/**
 * The classification case below guards the one silent data-loss risk of this
 * port: `defaultClassificationMapping` must travel with the PUT body, because
 * the backend applies it on update even though the generated PUT type does not
 * declare it. Dropping it blanks the indicator's classification on every run.
 */

const CSV: Converter = {
  name: 'CSV',
  type: 'indicator',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8'],
  parameters: [],
};

const HTTP_SOURCE: DatasourceType = {
  type: 'HTTP',
  parameters: [{ name: 'URL', mandatory: true }],
};

const CLASSIFICATION = { colorBrewerSpectrumName: 'Blues', numClasses: 5 };

const METADATA: IndicatorRunMetadata = {
  indicatorId: 'ind-1',
  indicatorName: 'Bevölkerung',
  permissions: ['meta-viewer'],
  ownerId: 'org-root',
  isPublic: false,
  defaultClassificationMapping: CLASSIFICATION,
  applicableSpatialUnits: [
    {
      spatialUnitId: 'su-1',
      spatialUnitName: 'Stadtteile',
      permissions: ['su-1-viewer'],
      ownerId: 'org-su-1',
      isPublic: true,
    },
  ],
};

describe('buildIndicatorScopeProperties', () => {
  it('takes rights from the join entry of the target spatial unit', () => {
    const scope = buildIndicatorScopeProperties(METADATA, 'su-1', 'Stadtteile');

    expect(scope).toEqual({
      targetSpatialUnitMetadata: { spatialUnitLevel: 'Stadtteile' },
      currentIndicatorDataset: { defaultClassificationMapping: CLASSIFICATION },
      permissions: ['su-1-viewer'],
      ownerId: 'org-su-1',
      isPublic: true,
    });
  });

  it('falls back to the indicator rights for a spatial unit that is not linked yet', () => {
    const scope = buildIndicatorScopeProperties(METADATA, 'su-new', 'Baublöcke');

    expect(scope.permissions).toEqual(['meta-viewer']);
    expect(scope.ownerId).toBe('org-root');
    expect(scope.isPublic).toBe(false);
  });

  it('keeps an empty permission list of the join entry instead of widening to the metadata', () => {
    const metadata: IndicatorRunMetadata = {
      ...METADATA,
      applicableSpatialUnits: [{ spatialUnitId: 'su-1', permissions: [] }],
    };

    const scope = buildIndicatorScopeProperties(metadata, 'su-1', 'Stadtteile');

    expect(scope.permissions).toEqual([]);
    expect(scope.ownerId).toBeUndefined();
  });

  it('carries the default classification mapping so the update cannot blank it', () => {
    expect(
      buildIndicatorScopeProperties(METADATA, 'su-1', 'Stadtteile').currentIndicatorDataset
        .defaultClassificationMapping
    ).toBe(CLASSIFICATION);
  });

  it('does not match a join entry by name against an id', () => {
    const metadata: IndicatorRunMetadata = {
      ...METADATA,
      applicableSpatialUnits: [
        { spatialUnitName: 'su-1', permissions: ['wrong'], ownerId: 'wrong' },
      ],
    };

    expect(buildIndicatorScopeProperties(metadata, 'su-1', 'Stadtteile').permissions).toEqual([
      'meta-viewer',
    ]);
  });
});

describe('prepareBatchRows', () => {
  const builders = {
    buildPropertyMapping: jest.fn((key, mappings, keep) => ({ key, mappings, keep })),
    buildPutBody: jest.fn((scope) => ({ scope })),
  };

  function context(overrides: Partial<Parameters<typeof prepareBatchRows>[1]> = {}) {
    return {
      findIndicator: (id: string) => (id === 'ind-1' ? METADATA : undefined),
      findSpatialUnitLevel: (id: string) => (id === 'su-1' ? 'Stadtteile' : undefined),
      builders,
      ...overrides,
    };
  }

  function formWithCompleteRow() {
    const form = buildBatchUpdateForm();
    const row = buildBatchRow();
    row.patchValue({
      indicatorId: 'ind-1',
      timeseriesMappings: [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
      converter: CSV,
      mimeType: 'text/csv',
      datasourceType: HTTP_SOURCE,
      spatialReferenceKeyProperty: 'ags',
      targetSpatialUnitId: 'su-1',
    });
    syncBatchRowParameterControls(row);
    row.controls.datasourceTypeParameters.controls['URL'].setValue('https://example.org/d.csv');
    form.controls.rows.push(row);
    return form;
  }

  beforeEach(() => {
    builders.buildPropertyMapping.mockClear();
    builders.buildPutBody.mockClear();
  });

  it('prepares a complete row with label, id and both payloads', () => {
    const result = prepareBatchRows(formWithCompleteRow(), context());

    expect(result.failures).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      label: 'Bevölkerung',
      resourceId: 'ind-1',
      propertyMapping: {
        key: 'ags',
        mappings: [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
        keep: true,
      },
    });
    expect(result.rows[0].datasource.datasourceTypeFormValues).toEqual({
      URL: 'https://example.org/d.csv',
    });
  });

  it('passes the run-wide keep-missing flag to the property mapping', () => {
    const form = formWithCompleteRow();
    form.controls.keepMissingValues.setValue(false);

    prepareBatchRows(form, context());

    expect(builders.buildPropertyMapping).toHaveBeenCalledWith('ags', expect.anything(), false);
  });

  it('reports a row whose indicator disappeared instead of sending it', () => {
    const form = formWithCompleteRow();
    form.controls.rows.controls[0].controls.indicatorId.setValue('gone');

    const result = prepareBatchRows(form, context());

    expect(result.rows).toEqual([]);
    expect(result.failures).toEqual([
      {
        label: 'gone',
        resourceId: 'gone',
        status: 'error',
        message: '',
        messageKey: BATCH_PREPARE_MESSAGE_KEYS.metadataMissing,
      },
    ]);
    expect(builders.buildPutBody).not.toHaveBeenCalled();
  });

  it('reports a row whose target spatial unit disappeared', () => {
    const form = formWithCompleteRow();
    form.controls.rows.controls[0].controls.targetSpatialUnitId.setValue('gone');

    const result = prepareBatchRows(form, context());

    expect(result.rows).toEqual([]);
    expect(result.failures[0].messageKey).toBe(BATCH_PREPARE_MESSAGE_KEYS.metadataMissing);
  });

  it('prepares every row, not only the selected ones', () => {
    const form = formWithCompleteRow();
    const second = buildBatchRow();
    second.patchValue({ indicatorId: 'ind-1', targetSpatialUnitId: 'su-1', selected: false });
    form.controls.rows.push(second);

    expect(prepareBatchRows(form, context()).rows).toHaveLength(2);
  });

  it('looks the metadata up per row rather than reusing a captured object', () => {
    const findIndicator = jest.fn(() => METADATA);
    const form = formWithCompleteRow();
    form.controls.rows.push(form.controls.rows.controls[0]);

    prepareBatchRows(form, context({ findIndicator }));

    expect(findIndicator).toHaveBeenCalledTimes(2);
  });
});
