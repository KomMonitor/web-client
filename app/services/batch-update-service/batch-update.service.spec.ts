import { TestBed } from '@angular/core/testing';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { BatchUpdateService } from './batch-update.service';
import { BATCH_UPDATE_MESSAGE_KEYS, BatchUpdateRow } from './batch-update.model';

/**
 * Pins the contract the AngularJS `kommonitorBatchUpdateHelperService.batchUpdate`
 * had: sequential rows, dry run before commit, one file upload per row, and a
 * failing row that does not abort the run.
 */
describe('BatchUpdateService', () => {
  let service: BatchUpdateService;
  let importerHelper: {
    updateIndicator: jest.Mock;
    updateGeoresource: jest.Mock;
    importerResponseContainsErrors: jest.Mock;
    getErrorsFromImporterResponse: jest.Mock;
  };
  let resourceImport: {
    buildConverterDefinition: jest.Mock;
    buildDatasourceTypeDefinition: jest.Mock;
  };

  const row = (overrides: Partial<BatchUpdateRow> = {}): BatchUpdateRow => ({
    label: 'Indikator A',
    resourceId: 'ind-1',
    converter: {
      converter: { name: 'CSV' } as any,
      schema: '',
      mimeType: 'text/csv',
      converterParameterValues: {},
    },
    datasource: {
      datasourceType: { type: 'FILE' } as any,
      datasourceTypeFormValues: {},
      selectedFile: new File(['a'], 'a.csv'),
      fileInputElement: null,
    },
    propertyMapping: { spatialReferenceKeyProperty: 'ags' },
    putBody: { indicatorValues: [] },
    ...overrides,
  });

  beforeEach(() => {
    importerHelper = {
      updateIndicator: jest.fn().mockResolvedValue({ uri: 'ok' }),
      updateGeoresource: jest.fn().mockResolvedValue({ uri: 'ok' }),
      importerResponseContainsErrors: jest.fn().mockReturnValue(false),
      getErrorsFromImporterResponse: jest.fn((response) => response.errors),
    };
    resourceImport = {
      buildConverterDefinition: jest.fn().mockReturnValue({ name: 'CSV' }),
      buildDatasourceTypeDefinition: jest
        .fn()
        .mockResolvedValue({ type: 'FILE', parameters: [{ name: 'NAME', value: 'up.csv' }] }),
    };

    TestBed.configureTestingModule({
      providers: [
        BatchUpdateService,
        { provide: KommonitorImporterHelperService, useValue: importerHelper },
        { provide: ResourceImportService, useValue: resourceImport },
      ],
    });
    service = TestBed.inject(BatchUpdateService);
  });

  it('runs the dry run first and commits only afterwards', async () => {
    const results = await service.runBatchUpdate('indicator', [row()]);

    expect(importerHelper.updateIndicator).toHaveBeenCalledTimes(2);
    expect(importerHelper.updateIndicator.mock.calls[0][5]).toBe(true);
    expect(importerHelper.updateIndicator.mock.calls[1][5]).toBe(false);
    expect(results).toEqual([
      { label: 'Indikator A', resourceId: 'ind-1', status: 'success', message: '' },
    ]);
  });

  it('passes the pre-built property mapping and put body through unchanged', async () => {
    await service.runBatchUpdate('indicator', [row()]);

    expect(importerHelper.updateIndicator).toHaveBeenCalledWith(
      { name: 'CSV' },
      { type: 'FILE', parameters: [{ name: 'NAME', value: 'up.csv' }] },
      { spatialReferenceKeyProperty: 'ags' },
      'ind-1',
      { indicatorValues: [] },
      true
    );
  });

  it('does not commit when the dry run reports errors', async () => {
    importerHelper.updateIndicator.mockResolvedValueOnce({ errors: ['line 3 broken'] });
    importerHelper.importerResponseContainsErrors.mockReturnValueOnce(true);

    const results = await service.runBatchUpdate('indicator', [row()]);

    expect(importerHelper.updateIndicator).toHaveBeenCalledTimes(1);
    expect(results[0].status).toBe('error');
    expect(results[0].message).toContain('line 3 broken');
    expect(results[0].errors).toEqual(['line 3 broken']);
  });

  it('builds the data-source definition exactly once per row, so the file is uploaded once', async () => {
    await service.runBatchUpdate('indicator', [row()]);

    expect(resourceImport.buildDatasourceTypeDefinition).toHaveBeenCalledTimes(1);
  });

  it('reports a failed upload as an error row and continues with the next row', async () => {
    resourceImport.buildDatasourceTypeDefinition
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce({ type: 'FILE', parameters: [] });

    const results = await service.runBatchUpdate('indicator', [
      row({ label: 'A', resourceId: 'a' }),
      row({ label: 'B', resourceId: 'b' }),
    ]);

    expect(results[0]).toMatchObject({ label: 'A', status: 'error', message: 'upload failed' });
    expect(results[1]).toMatchObject({ label: 'B', status: 'success' });
  });

  it('reports a rejected importer call as an error row and continues', async () => {
    importerHelper.updateIndicator
      .mockRejectedValueOnce({ error: { message: 'importer down' } })
      .mockResolvedValue({ uri: 'ok' });

    const results = await service.runBatchUpdate('indicator', [
      row({ label: 'A', resourceId: 'a' }),
      row({ label: 'B', resourceId: 'b' }),
    ]);

    expect(results[0]).toMatchObject({ status: 'error', message: 'importer down' });
    expect(results[1].status).toBe('success');
  });

  it('skips a row with an incomplete converter without calling the importer', async () => {
    resourceImport.buildConverterDefinition.mockReturnValueOnce(null);

    const results = await service.runBatchUpdate('indicator', [row()]);

    expect(importerHelper.updateIndicator).not.toHaveBeenCalled();
    expect(results[0]).toMatchObject({
      status: 'error',
      messageKey: BATCH_UPDATE_MESSAGE_KEYS.incompleteRow,
    });
  });

  it('skips a row whose data source stays incomplete', async () => {
    resourceImport.buildDatasourceTypeDefinition.mockResolvedValueOnce(null);

    const results = await service.runBatchUpdate('indicator', [row()]);

    expect(importerHelper.updateIndicator).not.toHaveBeenCalled();
    expect(results[0].messageKey).toBe(BATCH_UPDATE_MESSAGE_KEYS.incompleteRow);
  });

  it('keeps result order and length aligned with the input rows', async () => {
    const results = await service.runBatchUpdate('indicator', [
      row({ label: 'A', resourceId: 'a' }),
      row({ label: 'B', resourceId: 'b' }),
      row({ label: 'C', resourceId: 'c' }),
    ]);

    expect(results.map((result) => result.label)).toEqual(['A', 'B', 'C']);
  });

  it('runs the rows sequentially rather than in parallel', async () => {
    const order: string[] = [];
    importerHelper.updateIndicator.mockImplementation((...args: unknown[]) => {
      const id = args[3] as string;
      const isDryRun = args[5] as boolean;
      order.push(`${id}:${isDryRun ? 'dry' : 'commit'}`);
      return Promise.resolve({ uri: 'ok' });
    });

    await service.runBatchUpdate('indicator', [
      row({ label: 'A', resourceId: 'a' }),
      row({ label: 'B', resourceId: 'b' }),
    ]);

    expect(order).toEqual(['a:dry', 'a:commit', 'b:dry', 'b:commit']);
  });

  it('reports progress once per row', async () => {
    const onProgress = jest.fn();

    await service.runBatchUpdate(
      'indicator',
      [row({ resourceId: 'a' }), row({ resourceId: 'b' })],
      { onProgress }
    );

    expect(onProgress.mock.calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it('posts to the georesource endpoint for the georesource resource type', async () => {
    await service.runBatchUpdate('georesource', [row({ label: 'Geo', resourceId: 'geo-1' })]);

    expect(importerHelper.updateGeoresource).toHaveBeenCalledTimes(2);
    expect(importerHelper.updateIndicator).not.toHaveBeenCalled();
  });

  it('returns an empty result list for an empty batch', async () => {
    expect(await service.runBatchUpdate('indicator', [])).toEqual([]);
    expect(importerHelper.updateIndicator).not.toHaveBeenCalled();
  });
});
