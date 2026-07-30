import { TestBed } from '@angular/core/testing';
import { ResourceImportService } from './resource-import.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import type { ImporterObjectsConfig } from 'services/resource-import-service/resource-import.model';

describe('ResourceImportService', () => {
  let service: ResourceImportService;
  let importerHelper: {
    buildConverterDefinition: jest.Mock;
    buildDatasourceTypeDefinition: jest.Mock;
    buildPropertyMapping_spatialResource: jest.Mock;
    uploadNewFile: jest.Mock;
    getAvailableConverters: jest.Mock;
    getAvailableDatasourceTypes: jest.Mock;
    getAttributeMappingTypes: jest.Mock;
  };

  const baseConfig = (overrides: Partial<ImporterObjectsConfig> = {}): ImporterObjectsConfig => ({
    converter: { name: 'GeoJSON', type: 'spatialUnit', mimeTypes: [], encodings: [] } as any,
    schema: 's',
    mimeType: 'application/json',
    converterParameterValues: {},
    datasourceType: { type: 'OGCAPI_FEATURES', parameters: [] } as any,
    datasourceTypeFormValues: { foo: 'bar' },
    selectedFile: null,
    fileInputElement: null,
    idProperty: 'ID',
    nameProperty: 'NAME',
    validStartDate: '',
    validEndDate: '',
    keepAttributes: true,
    keepMissingValues: false,
    attributeMappings: [],
    ...overrides,
  });

  beforeEach(() => {
    importerHelper = {
      buildConverterDefinition: jest.fn().mockReturnValue({ name: 'GeoJSON' }),
      buildDatasourceTypeDefinition: jest
        .fn()
        .mockResolvedValue({ type: 'OGCAPI_FEATURES', parameters: [] }),
      buildPropertyMapping_spatialResource: jest.fn().mockReturnValue({ identifierProperty: 'ID' }),
      uploadNewFile: jest.fn().mockResolvedValue('server-file.json'),
      getAvailableConverters: jest
        .fn()
        .mockReturnValue([
          { name: 'GeoJSON', mimeTypes: ['application/json'], encodings: [], schemas: ['s1'] },
        ]),
      getAvailableDatasourceTypes: jest
        .fn()
        .mockReturnValue([{ type: 'OGCAPI_FEATURES', parameters: [] }]),
      getAttributeMappingTypes: jest
        .fn()
        .mockReturnValue([{ displayName: 'Integer', apiName: 'integer' }]),
    };
    TestBed.configureTestingModule({
      providers: [
        ResourceImportService,
        { provide: KommonitorImporterHelperService, useValue: importerHelper },
      ],
    });
    service = TestBed.inject(ResourceImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('builds the three definitions and forwards the form values', async () => {
    const defs = await service.buildImporterObjects(baseConfig());

    expect(importerHelper.buildConverterDefinition).toHaveBeenCalledWith(
      expect.anything(),
      's',
      'application/json',
      {}
    );
    expect(importerHelper.buildDatasourceTypeDefinition).toHaveBeenCalledWith(expect.anything(), {
      foo: 'bar',
    });
    expect(defs.converterDefinition).toEqual({ name: 'GeoJSON' });
    expect(defs.datasourceTypeDefinition).toEqual({ type: 'OGCAPI_FEATURES', parameters: [] });
    expect(defs.propertyMappingDefinition).toEqual({ identifierProperty: 'ID' });
  });

  it('returns a null converter definition when no converter is selected', async () => {
    const defs = await service.buildImporterObjects(baseConfig({ converter: null }));

    expect(importerHelper.buildConverterDefinition).not.toHaveBeenCalled();
    expect(defs.converterDefinition).toBeNull();
  });

  it('always passes the form values object, even when empty', async () => {
    await service.buildImporterObjects(baseConfig({ datasourceTypeFormValues: {} }));

    expect(importerHelper.buildDatasourceTypeDefinition).toHaveBeenCalledWith(
      expect.anything(),
      {}
    );
  });

  it('uploads a FILE data source and maps the returned name', async () => {
    const file = new File(['x'], 'a.json');
    const defs = await service.buildImporterObjects(
      baseConfig({ datasourceType: { type: 'FILE', parameters: [] } as any, selectedFile: file })
    );

    expect(importerHelper.uploadNewFile).toHaveBeenCalledWith(file, 'a.json');
    expect(importerHelper.buildDatasourceTypeDefinition).not.toHaveBeenCalled();
    expect(defs.datasourceTypeDefinition).toEqual({
      type: 'FILE',
      parameters: [{ name: 'NAME', value: 'server-file.json' }],
    });
  });

  describe('parseMappingConfig', () => {
    it('throws when the top-level structure is incomplete', () => {
      expect(() => service.parseMappingConfig({ converter: {} })).toThrow();
    });

    it('resolves converter/data-source/property mapping and excludes bbox params', () => {
      const parsed = service.parseMappingConfig({
        converter: {
          name: 'GeoJSON',
          schema: 's1',
          mimeType: 'application/json',
          parameters: [{ name: 'crs', value: '4326' }],
        },
        dataSource: {
          type: 'OGCAPI_FEATURES',
          parameters: [
            { name: 'url', value: 'http://x' },
            { name: 'bbox', value: '1,2,3,4' },
          ],
        },
        propertyMapping: {
          nameProperty: 'NAME',
          identifierProperty: 'ID',
          validStartDateProperty: 'vs',
          validEndDateProperty: 've',
          keepAttributes: true,
          keepMissingOrNullValueAttributes: false,
          attributes: [{ name: 'a', mappingName: 'b', type: 'integer' }],
        },
        periodOfValidity: { startDate: '2026-01-01', endDate: '2026-12-31' },
      });

      expect(parsed.converter?.name).toBe('GeoJSON');
      expect(parsed.schema).toBe('s1');
      expect(parsed.mimeType).toBe('application/json');
      expect(parsed.converterParameters).toEqual({ crs: '4326' });
      expect(parsed.datasourceType?.type).toBe('OGCAPI_FEATURES');
      expect(parsed.datasourceTypeParameters).toEqual({ url: 'http://x' });
      expect(parsed.dataSourceParameters).toContainEqual({ name: 'bbox', value: '1,2,3,4' });
      expect(parsed.idProperty).toBe('ID');
      expect(parsed.attributeMappings).toEqual([
        {
          sourceName: 'a',
          destinationName: 'b',
          dataType: { displayName: 'Integer', apiName: 'integer' },
        },
      ]);
      expect(parsed.periodOfValidity).toEqual({ startDate: '2026-01-01', endDate: '2026-12-31' });
    });
  });

  describe('collectMissingImporterFields', () => {
    const completeInput = () => ({
      converter: {
        name: 'GeoJSON',
        mimeTypes: ['application/json'],
        schemas: ['s1'],
        parameters: [{ name: 'crs', mandatory: true }],
      } as any,
      schema: 's1',
      mimeType: 'application/json',
      converterParameters: { crs: '4326' },
      datasourceType: { type: 'FILE', parameters: [] } as any,
      datasourceTypeParameters: {},
      hasFile: true,
      bboxType: '',
      bboxRefSpatialUnitLevel: '',
      bboxLiteral: { minx: null, miny: null, maxx: null, maxy: null },
      idProperty: 'ID',
      nameProperty: 'NAME',
      startDate: '2026-01-01',
      periodOfValidityInvalid: false,
    });

    it('returns an empty array when everything required is present', () => {
      expect(service.collectMissingImporterFields(completeInput())).toEqual([]);
    });

    it('flags a missing converter, mandatory converter param, file and id/name/start', () => {
      const missing = service.collectMissingImporterFields({
        ...completeInput(),
        converter: null,
        hasFile: false,
        idProperty: '',
        nameProperty: '',
        startDate: '',
      });
      expect(missing).toContain('Konverter');
      expect(missing).toContain('Datei');
      expect(missing).toContain('ID Attributname');
      expect(missing).toContain('NAME Attributname');
      expect(missing).toContain('Gültig seit (Periodenbeginn)');
    });

    it('flags an incomplete literal bbox for an OGCAPI data source', () => {
      const missing = service.collectMissingImporterFields({
        ...completeInput(),
        datasourceType: { type: 'OGCAPI_FEATURES', parameters: [] } as any,
        bboxType: 'literal',
        bboxLiteral: { minx: '1', miny: '2', maxx: '3', maxy: null },
      });
      expect(missing).toContain('Begrenzungsrahmen (minx, miny, maxx, maxy)');
    });
  });
});
