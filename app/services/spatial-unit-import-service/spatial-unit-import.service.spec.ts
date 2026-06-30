import { TestBed } from '@angular/core/testing';
import { SpatialUnitImportService } from './spatial-unit-import.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import type { ImporterObjectsConfig } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.model';

describe('SpatialUnitImportService', () => {
  let service: SpatialUnitImportService;
  let importerHelper: {
    buildConverterDefinition: jest.Mock;
    buildDatasourceTypeDefinition: jest.Mock;
    buildPropertyMapping_spatialResource: jest.Mock;
    uploadNewFile: jest.Mock;
  };

  const baseConfig = (overrides: Partial<ImporterObjectsConfig> = {}): ImporterObjectsConfig => ({
    converter: { name: 'GeoJSON', type: 'spatialUnit', mimeTypes: [], encodings: [] } as any,
    schema: 's',
    mimeType: 'application/json',
    converterParameterPrefix: 'c_',
    converterParameterValues: {},
    datasourceType: { type: 'OGCAPI_FEATURES', parameters: [] } as any,
    datasourceTypeParameterPrefix: 'd_',
    datasourceFileInputId: 'in',
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
    };
    TestBed.configureTestingModule({
      providers: [
        SpatialUnitImportService,
        { provide: KommonitorImporterHelperService, useValue: importerHelper },
      ],
    });
    service = TestBed.inject(SpatialUnitImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('builds the three definitions and forwards the prefixes/form values', async () => {
    const defs = await service.buildImporterObjects(baseConfig());

    expect(importerHelper.buildConverterDefinition).toHaveBeenCalledWith(
      expect.anything(),
      'c_',
      's',
      'application/json',
      {}
    );
    expect(importerHelper.buildDatasourceTypeDefinition).toHaveBeenCalledWith(
      expect.anything(),
      'd_',
      'in',
      { foo: 'bar' }
    );
    expect(defs.converterDefinition).toEqual({ name: 'GeoJSON' });
    expect(defs.datasourceTypeDefinition).toEqual({ type: 'OGCAPI_FEATURES', parameters: [] });
    expect(defs.propertyMappingDefinition).toEqual({ identifierProperty: 'ID' });
  });

  it('returns a null converter definition when no converter is selected', async () => {
    const defs = await service.buildImporterObjects(baseConfig({ converter: null }));

    expect(importerHelper.buildConverterDefinition).not.toHaveBeenCalled();
    expect(defs.converterDefinition).toBeNull();
  });

  it('passes undefined form values when there are none', async () => {
    await service.buildImporterObjects(baseConfig({ datasourceTypeFormValues: {} }));

    expect(importerHelper.buildDatasourceTypeDefinition).toHaveBeenCalledWith(
      expect.anything(),
      'd_',
      'in',
      undefined
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
});
