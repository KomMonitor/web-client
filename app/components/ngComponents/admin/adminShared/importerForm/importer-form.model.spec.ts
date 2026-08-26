import type {
  Converter,
  DatasourceType,
  MappingConfigImport,
} from 'services/resource-import-service/resource-import.model';
import {
  buildImporterForm,
  importerFormToConfig,
  importerFormToMissingFieldsInput,
  patchBboxFromDataSourceParameters,
  patchImporterFormFromMappingConfig,
  syncConverterParameterControls,
  syncDatasourceParameterControls,
} from './importer-form.model';

const CONVERTER: Converter = {
  name: 'GeoJSON',
  type: 'geojson',
  mimeTypes: ['application/json'],
  encodings: ['UTF-8'],
  schemas: ['default'],
  parameters: [
    { name: 'delimiter', mandatory: true },
    { name: 'comment', mandatory: false },
  ],
};

const OTHER_CONVERTER: Converter = {
  name: 'CSV',
  type: 'csv',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8'],
  parameters: [{ name: 'delimiter', mandatory: true }],
};

const OGC_DATASOURCE: DatasourceType = {
  type: 'OGCAPI_FEATURES',
  parameters: [
    { name: 'url', mandatory: true },
    { name: 'bbox', mandatory: false },
    { name: 'bboxType', mandatory: false },
  ],
};

describe('importer form model', () => {
  describe('buildImporterForm', () => {
    it('requires the converter, data source and the two property names', () => {
      const form = buildImporterForm();

      expect(form.controls.converter.hasError('required')).toBe(true);
      expect(form.controls.datasourceType.hasError('required')).toBe(true);
      expect(form.controls.idProperty.hasError('required')).toBe(true);
      expect(form.controls.nameProperty.hasError('required')).toBe(true);
    });

    it('defaults the keep flags to true and restores them on reset', () => {
      const form = buildImporterForm();
      form.patchValue({ keepAttributes: false, keepMissingValues: false });

      form.reset();

      expect(form.controls.keepAttributes.value).toBe(true);
      expect(form.controls.keepMissingValues.value).toBe(true);
    });

    it('flags a half-filled bounding box', () => {
      const form = buildImporterForm();
      form.controls.bbox.patchValue({ minx: '1', miny: '2' });

      expect(form.controls.bbox.hasError('bboxIncomplete')).toBe(true);
    });
  });

  describe('syncConverterParameterControls', () => {
    it('creates one control per parameter, required where mandatory', () => {
      const form = buildImporterForm();

      syncConverterParameterControls(form, CONVERTER);

      const record = form.controls.converterParameters;
      expect(Object.keys(record.controls)).toEqual(['delimiter', 'comment']);
      expect(record.controls['delimiter'].hasError('required')).toBe(true);
      expect(record.controls['comment'].valid).toBe(true);
    });

    it('keeps the value of a parameter that survives a converter change', () => {
      const form = buildImporterForm();
      syncConverterParameterControls(form, CONVERTER);
      form.controls.converterParameters.controls['delimiter'].setValue(';');
      form.controls.converterParameters.controls['comment'].setValue('#');

      syncConverterParameterControls(form, OTHER_CONVERTER);

      expect(Object.keys(form.controls.converterParameters.controls)).toEqual(['delimiter']);
      expect(form.controls.converterParameters.controls['delimiter'].value).toBe(';');
    });

    it('clears the record for no converter', () => {
      const form = buildImporterForm();
      syncConverterParameterControls(form, CONVERTER);

      syncConverterParameterControls(form, null);

      expect(Object.keys(form.controls.converterParameters.controls)).toEqual([]);
    });
  });

  describe('syncDatasourceParameterControls', () => {
    it('skips the synthetic bbox parameters', () => {
      const form = buildImporterForm();

      syncDatasourceParameterControls(form, OGC_DATASOURCE);

      expect(Object.keys(form.controls.datasourceTypeParameters.controls)).toEqual(['url']);
    });
  });

  describe('patchBboxFromDataSourceParameters', () => {
    it('reads a reference bbox', () => {
      const form = buildImporterForm();

      patchBboxFromDataSourceParameters(form, [
        { name: 'bboxType', value: 'ref' },
        { name: 'bbox', value: 'su-42' },
      ]);

      expect(form.controls.bboxType.value).toBe('ref');
      expect(form.controls.bboxRefSpatialUnitId.value).toBe('su-42');
    });

    it('splits a literal bbox into its four corners', () => {
      const form = buildImporterForm();

      patchBboxFromDataSourceParameters(form, [
        { name: 'bboxType', value: 'literal' },
        { name: 'bbox', value: '1,2,3,4' },
      ]);

      expect(form.controls.bbox.getRawValue()).toEqual({
        minx: '1',
        miny: '2',
        maxx: '3',
        maxy: '4',
      });
    });

    it('clears the bbox when the config carries none', () => {
      const form = buildImporterForm();
      form.controls.bboxRefSpatialUnitId.setValue('su-42');

      patchBboxFromDataSourceParameters(form, []);

      expect(form.controls.bboxType.value).toBe('');
      expect(form.controls.bboxRefSpatialUnitId.value).toBe('');
    });
  });

  describe('patchImporterFormFromMappingConfig', () => {
    const parsed: MappingConfigImport = {
      converter: CONVERTER,
      schema: 'default',
      mimeType: 'application/json',
      converterParameters: { delimiter: ';' },
      datasourceType: OGC_DATASOURCE,
      datasourceTypeParameters: { url: 'https://example.org' },
      dataSourceParameters: [
        { name: 'url', value: 'https://example.org' },
        { name: 'bboxType', value: 'literal' },
        { name: 'bbox', value: '1,2,3,4' },
      ],
      nameProperty: 'name',
      idProperty: 'id',
      validStartDate: 'von',
      validEndDate: 'bis',
      keepAttributes: false,
      keepMissingValues: false,
      attributeMappings: [],
      periodOfValidity: null,
    };

    it('applies converter, data source, properties and both parameter records', () => {
      const form = buildImporterForm();

      patchImporterFormFromMappingConfig(form, parsed);

      const value = form.getRawValue();
      expect(value.converter).toBe(CONVERTER);
      expect(value.datasourceType).toBe(OGC_DATASOURCE);
      expect(value.idProperty).toBe('id');
      expect(value.nameProperty).toBe('name');
      expect(value.keepAttributes).toBe(false);
      expect(value.converterParameters).toEqual({ delimiter: ';', comment: '' });
      expect(value.datasourceTypeParameters).toEqual({ url: 'https://example.org' });
      expect(value.bbox).toEqual({ minx: '1', miny: '2', maxx: '3', maxy: '4' });
    });
  });

  describe('importerFormToConfig', () => {
    it('folds the bbox into the data-source form values the helper expects', () => {
      const form = buildImporterForm();
      patchImporterFormFromMappingConfig(form, {
        converter: CONVERTER,
        schema: 'default',
        mimeType: 'application/json',
        converterParameters: { delimiter: ';' },
        datasourceType: OGC_DATASOURCE,
        datasourceTypeParameters: { url: 'https://example.org' },
        dataSourceParameters: [
          { name: 'bboxType', value: 'literal' },
          { name: 'bbox', value: '1,2,3,4' },
        ],
        nameProperty: 'name',
        idProperty: 'id',
        validStartDate: '',
        validEndDate: '',
        keepAttributes: true,
        keepMissingValues: true,
        attributeMappings: [],
        periodOfValidity: null,
      });

      const config = importerFormToConfig(form);

      expect(config.converter).toBe(CONVERTER);
      expect(config.converterParameterValues).toEqual({ delimiter: ';', comment: '' });
      expect(config.datasourceTypeFormValues).toEqual({
        url: 'https://example.org',
        bboxType: 'literal',
        bboxRef: '',
        bbox_minx: '1',
        bbox_miny: '2',
        bbox_maxx: '3',
        bbox_maxy: '4',
      });
    });
  });

  describe('importerFormToMissingFieldsInput', () => {
    it('maps the form onto the summary-check input, nulling empty bbox corners', () => {
      const form = buildImporterForm();
      syncConverterParameterControls(form, CONVERTER);
      form.patchValue({ idProperty: 'id', nameProperty: 'name', bboxType: 'ref' });
      form.controls.bboxRefSpatialUnitId.setValue('su-42');

      const input = importerFormToMissingFieldsInput(form, {
        hasFile: true,
        startDate: '2026-01-01',
        periodOfValidityInvalid: false,
      });

      expect(input.bboxType).toBe('ref');
      expect(input.bboxRefSpatialUnitLevel).toBe('su-42');
      expect(input.bboxLiteral).toEqual({ minx: null, miny: null, maxx: null, maxy: null });
      expect(input.converterParameters).toEqual({ delimiter: '', comment: '' });
      expect(input.hasFile).toBe(true);
    });
  });
});
