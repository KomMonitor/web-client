import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { BatchUpdateService } from 'services/batch-update-service/batch-update.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import type {
  Converter,
  DatasourceType,
} from 'services/resource-import-service/resource-import.model';
import { IndicatorBatchUpdateModalComponent } from './indicator-batch-update-modal.component';
import { BATCH_RUN_BLOCKER_KEYS } from './indicator-batch-update-form.model';
import { formatColumnTarget } from './indicator-batch-update-defaults.model';

/**
 * First spec of this modal — it had none before the reactive-forms rework.
 *
 * Like the other admin modal specs the fixture is not rendered; what is pinned
 * is the row mechanics, the derived parameter columns and the run gate. The run
 * itself is still a no-op at this point (`TODO(batch-update)`).
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

const GEOCODING: Converter = {
  name: 'Geokodierung',
  type: 'georesource',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8'],
};

const FILE_SOURCE: DatasourceType = { type: 'FILE', parameters: [] };
const HTTP_SOURCE: DatasourceType = {
  type: 'HTTP',
  parameters: [{ name: 'URL', mandatory: true }],
};

describe('IndicatorBatchUpdateModalComponent', () => {
  let fixture: ComponentFixture<IndicatorBatchUpdateModalComponent>;
  let component: IndicatorBatchUpdateModalComponent;
  let batchUpdate: { runBatchUpdate: jest.Mock };
  let notifications: { showSuccess: jest.Mock; showError: jest.Mock };
  let modalService: { open: jest.Mock };
  let openedResultModal: { resourceType?: string; results?: unknown };
  let importerHelper: {
    getAvailableConverters: () => Converter[];
    getAvailableDatasourceTypes: () => DatasourceType[];
    filterConverters: (resourceType: string) => (converter: Converter) => boolean;
    buildPropertyMapping_indicatorResource: jest.Mock;
    buildPutBody_indicators: jest.Mock;
    /** Awaited in ngOnInit so the dropdowns re-render once the catalogue lands. */
    fetchResourcesFromImporter: jest.Mock;
  };

  /** Fills the single starting row so the run gate opens. */
  function completeFirstRow(): void {
    component.rows[0].patchValue({
      indicatorId: 'ind-1',
      timeseriesMappings: [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
      converter: CSV,
      mimeType: 'text/csv',
      datasourceType: HTTP_SOURCE,
      spatialReferenceKeyProperty: 'ags',
      targetSpatialUnitId: 'su-1',
    });
    component.rows[0].controls.converterParameters.controls['Trennzeichen'].setValue(';');
    component.rows[0].controls.datasourceTypeParameters.controls['URL'].setValue('https://x/d.csv');
  }

  beforeEach(() => {
    batchUpdate = { runBatchUpdate: jest.fn().mockResolvedValue([]) };
    notifications = { showSuccess: jest.fn(), showError: jest.fn() };
    openedResultModal = {};
    modalService = {
      open: jest.fn(() => ({
        componentInstance: openedResultModal,
        result: Promise.resolve(),
      })),
    };
    importerHelper = {
      getAvailableConverters: () => [CSV, WFS, GEOCODING],
      getAvailableDatasourceTypes: () => [FILE_SOURCE, HTTP_SOURCE],
      filterConverters: (resourceType: string) => (converter: Converter) =>
        !(resourceType === 'indicator' && converter.name.includes('Geokodierung')),
      fetchResourcesFromImporter: jest.fn().mockResolvedValue(undefined),
      buildPropertyMapping_indicatorResource: jest.fn().mockReturnValue({ mapping: true }),
      buildPutBody_indicators: jest.fn().mockReturnValue({ putBody: true }),
    };

    TestBed.configureTestingModule({
      imports: [IndicatorBatchUpdateModalComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: IndicatorMetadataStoreService,
          useValue: {
            availableIndicators: [{ indicatorId: 'ind-1', indicatorName: 'Bevölkerung' }],
            getIndicatorMetadataById: (indicatorId: string) =>
              indicatorId === 'ind-1'
                ? {
                    indicatorId: 'ind-1',
                    indicatorName: 'Bevölkerung',
                    permissions: ['viewer'],
                    ownerId: 'org',
                    isPublic: false,
                    defaultClassificationMapping: { numClasses: 5 },
                    applicableSpatialUnits: [],
                  }
                : undefined,
          },
        },
        {
          provide: SpatialUnitMetadataStoreService,
          useValue: {
            availableSpatialUnits: [{ spatialUnitId: 'su-1', spatialUnitLevel: 'Stadtteile' }],
          },
        },
        // Must be stubbed: the real service fires GETs from its constructor.
        { provide: KommonitorImporterHelperService, useValue: importerHelper },
        { provide: BatchUpdateService, useValue: batchUpdate },
        { provide: NotificationService, useValue: notifications },
        { provide: NgbModal, useValue: modalService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(IndicatorBatchUpdateModalComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  });

  /**
   * `saveMappingObjectToFile()` writes the whole row, and the AngularJS original
   * read it back the same way. The migrated reader took only
   * `timeseriesMappings` from the file, so saving and re-reading a row lost the
   * converter, the data source and every parameter.
   */
  it('applies a whole saved row when its mapping table is read back', async () => {
    const row = component.rows[0];
    const fileRow = {
      name: 'ind-1',
      mappingObj: {
        converter: {
          name: 'Tabelle_Zeitreihe_zu_Indikator',
          mimeType: 'text/csv',
          parameters: [{ name: 'Trennzeichen', value: ';' }],
        },
        dataSource: { type: 'HTTP', parameters: [{ name: 'URL', value: 'https://example.org' }] },
        propertyMapping: {
          spatialReferenceKeyProperty: 'gid',
          timeseriesMappings: [{ indicatorValueProperty: 'wert', timestamp: '2020-01-01' }],
        },
      },
    };
    const file = new File([JSON.stringify(fileRow)], 'row-mapping.json', {
      type: 'application/json',
    });

    await component.onMappingTableSelected({ target: { files: [file] } } as unknown as Event, row);

    expect(row.controls.converter.value?.name).toBe('Tabelle_Zeitreihe_zu_Indikator');
    // The converter declares CRS too; it simply stays empty.
    expect(row.controls.converterParameters.getRawValue()).toEqual({ Trennzeichen: ';', CRS: '' });
    expect(row.controls.datasourceType.value?.type).toBe('HTTP');
    expect(row.controls.datasourceTypeParameters.getRawValue()).toEqual({
      URL: 'https://example.org',
    });
    expect(row.controls.spatialReferenceKeyProperty.value).toBe('gid');
    expect(row.controls.timeseriesMappings.value).toEqual([
      { indicatorValueProperty: 'wert', timestamp: '2020-01-01' },
    ]);
    expect(row.controls.mappingTableName.value).toBe('row-mapping.json');
  });

  it('still accepts a bare time-series list as a mapping table', async () => {
    const row = component.rows[0];
    const mappings = [{ indicatorValueProperty: 'wert', timestamp: '2021-01-01' }];
    const file = new File([JSON.stringify({ timeseriesMappings: mappings })], 'ts.json', {
      type: 'application/json',
    });

    await component.onMappingTableSelected({ target: { files: [file] } } as unknown as Event, row);

    expect(row.controls.timeseriesMappings.value).toEqual(mappings);
    expect(row.controls.converter.value).toBeNull();
  });

  it('starts with exactly one empty row', () => {
    expect(component.rows).toHaveLength(1);
    expect(component.rows[0].controls.indicatorId.value).toBe('');
  });

  it('adds and deletes rows through the form array', () => {
    component.addNewRowToBatchList();
    expect(component.rows).toHaveLength(2);

    // Rows start unticked, so only what the user ticks is deleted.
    component.rows[1].controls.selected.setValue(true);
    component.deleteSelectedRowsFromBatchList();

    expect(component.rows).toHaveLength(1);
    expect(component.rows[0].controls.selected.value).toBe(false);
  });

  it('leaves untouched rows alone when deleting the selection', () => {
    component.addNewRowToBatchList();

    component.deleteSelectedRowsFromBatchList();

    expect(component.rows).toHaveLength(2);
  });

  it('reflects and toggles the select-all state', () => {
    component.addNewRowToBatchList();
    expect(component.allRowsSelected).toBe(false);

    component.onChangeSelectAllRows({ target: { checked: true } } as unknown as Event);
    expect(component.rows.every((row) => row.controls.selected.value)).toBe(true);
    expect(component.allRowsSelected).toBe(true);

    component.onChangeSelectAllRows({ target: { checked: false } } as unknown as Event);
    expect(component.rows.every((row) => !row.controls.selected.value)).toBe(true);
    expect(component.allRowsSelected).toBe(false);

    component.onChangeSelectAllRows({ target: { checked: true } } as unknown as Event);
    expect(component.allRowsSelected).toBe(true);
  });

  it('offers only the converters the importer allows for indicators', () => {
    expect(component.availableConverters().map((converter) => converter.name)).toEqual([
      'Tabelle_Zeitreihe_zu_Indikator',
      'WFS_v1',
    ]);
  });

  it('rebuilds the parameter controls when a row changes converter', () => {
    const row = component.rows[0];

    row.controls.converter.setValue(CSV);
    expect(Object.keys(row.controls.converterParameters.controls)).toEqual(['Trennzeichen', 'CRS']);

    row.controls.converter.setValue(WFS);
    expect(Object.keys(row.controls.converterParameters.controls)).toEqual(['NAMESPACE']);
  });

  it('keeps a same-named parameter value across a converter change', () => {
    const row = component.rows[0];
    row.controls.converter.setValue(CSV);
    row.controls.converterParameters.controls['CRS'].setValue('EPSG:25832');

    row.controls.converter.setValue({ ...WFS, parameters: [{ name: 'CRS', mandatory: false }] });

    expect(row.controls.converterParameters.controls['CRS'].value).toBe('EPSG:25832');
  });

  it('preselects the only mime type a converter offers and clears the schema', () => {
    const row = component.rows[0];
    row.controls.schema.setValue('stale');

    row.controls.converter.setValue(CSV);

    expect(row.controls.mimeType.value).toBe('text/csv');
    expect(row.controls.schema.value).toBe('');
  });

  it('derives the parameter columns from all rows', () => {
    component.rows[0].controls.converter.setValue(CSV);
    component.addNewRowToBatchList();
    component.rows[1].controls.converter.setValue(WFS);
    component.rows[1].controls.datasourceType.setValue(HTTP_SOURCE);

    expect(component.converterParameterColumns()).toEqual(['Trennzeichen', 'CRS', 'NAMESPACE']);
    expect(component.datasourceParameterColumns()).toEqual(['URL']);
    expect(component.showFileColumn()).toBe(false);

    component.rows[0].controls.datasourceType.setValue(FILE_SOURCE);
    expect(component.showFileColumn()).toBe(true);
  });

  it('drops the file when a row switches away from a FILE data source', () => {
    const row = component.rows[0];
    row.controls.datasourceType.setValue(FILE_SOURCE);
    row.controls.selectedFile.setValue(new File(['a'], 'a.csv'));

    row.controls.datasourceType.setValue(HTTP_SOURCE);

    expect(row.controls.selectedFile.value).toBeNull();
  });

  it('keeps the run gated while the list is incomplete', () => {
    expect(component.runBlockers()).toContain(BATCH_RUN_BLOCKER_KEYS.name);

    component.rows[0].patchValue({
      indicatorId: 'ind-1',
      timeseriesMappings: [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
      converter: CSV,
      datasourceType: HTTP_SOURCE,
      spatialReferenceKeyProperty: 'ags',
      targetSpatialUnitId: 'su-1',
    });
    component.rows[0].controls.converterParameters.controls['Trennzeichen'].setValue(';');
    component.rows[0].controls.datasourceTypeParameters.controls['URL'].setValue('https://x/d.csv');

    expect(component.runBlockers()).toEqual([]);
  });

  it('expands one timeseries mapping panel at a time', () => {
    component.addNewRowToBatchList();

    component.toggleTimeseriesMapping(1);
    expect(component.expandedMappingRow()).toBe(1);

    component.toggleTimeseriesMapping(0);
    expect(component.expandedMappingRow()).toBe(0);

    component.toggleTimeseriesMapping(0);
    expect(component.expandedMappingRow()).toBeNull();
  });

  it('takes the file of a row from the input event', () => {
    const file = new File(['a'], 'a.csv');

    component.onDataSourceFileSelected(
      { target: { files: [file] } } as unknown as Event,
      component.rows[0]
    );

    expect(component.rows[0].controls.selectedFile.value).toBe(file);
  });

  it('resets to a single empty row and restores the keep-missing default', () => {
    component.rows[0].controls.indicatorId.setValue('ind-1');
    component.addNewRowToBatchList();
    component.form.controls.keepMissingValues.setValue(false);
    component.toggleTimeseriesMapping(0);

    component.resetBatchUpdateForm();

    expect(component.rows).toHaveLength(1);
    expect(component.rows[0].controls.indicatorId.value).toBe('');
    expect(component.form.controls.keepMissingValues.value).toBe(true);
    expect(component.expandedMappingRow()).toBeNull();
  });

  it('resolves an indicator name for the mapping export file name', () => {
    expect(component.indicatorName('ind-1')).toBe('Bevölkerung');
    expect(component.indicatorName('missing')).toBe('');
  });

  // ------------------------------------------------------------------- the run

  it('does not run while the gate is closed', async () => {
    await component.startBatchUpdate();

    expect(batchUpdate.runBatchUpdate).not.toHaveBeenCalled();
  });

  it('hands one prepared row per list row to the batch update service', async () => {
    completeFirstRow();

    await component.startBatchUpdate();

    expect(batchUpdate.runBatchUpdate).toHaveBeenCalledTimes(1);
    const [resourceType, rows] = batchUpdate.runBatchUpdate.mock.calls[0];
    expect(resourceType).toBe('indicator');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      label: 'Bevölkerung',
      resourceId: 'ind-1',
      propertyMapping: { mapping: true },
      putBody: { putBody: true },
    });
  });

  it('keeps the default classification mapping in the PUT body scope', async () => {
    completeFirstRow();

    await component.startBatchUpdate();

    expect(importerHelper.buildPutBody_indicators).toHaveBeenCalledWith(
      expect.objectContaining({
        currentIndicatorDataset: { defaultClassificationMapping: { numClasses: 5 } },
        targetSpatialUnitMetadata: { spatialUnitLevel: 'Stadtteile' },
      })
    );
  });

  it('toasts a success summary and asks the parent to refresh', async () => {
    completeFirstRow();
    batchUpdate.runBatchUpdate.mockResolvedValue([
      { label: 'Bevölkerung', resourceId: 'ind-1', status: 'success', message: '' },
    ]);
    const refresh = jest.fn();
    component.refreshRequested.subscribe(refresh);

    await component.startBatchUpdate();

    expect(notifications.showSuccess).toHaveBeenCalled();
    expect(notifications.showError).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledWith({ crudType: 'edit' });
  });

  it('toasts an error summary when a row failed but still refreshes the successful ones', async () => {
    completeFirstRow();
    batchUpdate.runBatchUpdate.mockResolvedValue([
      { label: 'A', resourceId: 'a', status: 'success', message: '' },
      { label: 'B', resourceId: 'b', status: 'error', message: 'boom' },
    ]);
    const refresh = jest.fn();
    component.refreshRequested.subscribe(refresh);

    await component.startBatchUpdate();

    expect(notifications.showError).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledWith({ crudType: 'edit' });
  });

  it('does not ask for a refresh when every row failed', async () => {
    completeFirstRow();
    batchUpdate.runBatchUpdate.mockResolvedValue([
      { label: 'B', resourceId: 'b', status: 'error', message: 'boom' },
    ]);
    const refresh = jest.fn();
    component.refreshRequested.subscribe(refresh);

    await component.startBatchUpdate();

    expect(refresh).not.toHaveBeenCalled();
  });

  it('keeps the results of the last run and clears the loading state', async () => {
    completeFirstRow();
    const results = [{ label: 'A', resourceId: 'a', status: 'success' as const, message: '' }];
    batchUpdate.runBatchUpdate.mockResolvedValue(results);

    await component.startBatchUpdate();

    expect(component.lastResults()).toEqual(results);
    expect(component.loadingData()).toBe(false);
    expect(component.runProgress()).toBeNull();
  });

  it('reports a row whose indicator vanished without sending it', async () => {
    completeFirstRow();
    // The row passes the gate, but the indicator is gone from the store by the
    // time the run starts — deleted in another tab, say.
    jest
      .spyOn(TestBed.inject(IndicatorMetadataStoreService), 'getIndicatorMetadataById')
      .mockReturnValue(undefined);

    await component.startBatchUpdate();

    expect(batchUpdate.runBatchUpdate).toHaveBeenCalledWith('indicator', [], expect.anything());
    expect(component.lastResults()).toHaveLength(1);
    expect(component.lastResults()![0].status).toBe('error');
  });

  it('clears the stored results on reset', async () => {
    completeFirstRow();
    await component.startBatchUpdate();

    component.resetBatchUpdateForm();

    expect(component.lastResults()).toBeNull();
  });

  // ------------------------------------------------------------ result surface

  it('opens the result modal with the rows of the finished run', async () => {
    completeFirstRow();
    const results = [{ label: 'A', resourceId: 'a', status: 'success' as const, message: '' }];
    batchUpdate.runBatchUpdate.mockResolvedValue(results);

    await component.startBatchUpdate();

    expect(modalService.open).toHaveBeenCalledTimes(1);
    expect(openedResultModal.resourceType).toBe('indicator');
    expect(openedResultModal.results).toEqual(results);
  });

  it('reopens the result modal on demand', async () => {
    completeFirstRow();
    await component.startBatchUpdate();
    modalService.open.mockClear();

    component.openResultModal();

    expect(modalService.open).toHaveBeenCalledTimes(1);
  });

  it('does not open the result modal before a run happened', () => {
    component.openResultModal();

    expect(modalService.open).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------- default-value panel

  it('offers the parameter columns of the current list', () => {
    component.rows[0].controls.converter.setValue(CSV);
    component.rows[0].controls.datasourceType.setValue(HTTP_SOURCE);

    expect(component.columnTargets()).toContainEqual({
      kind: 'converterParameter',
      name: 'Trennzeichen',
    });
    expect(component.columnTargets()).toContainEqual({ kind: 'datasourceParameter', name: 'URL' });
  });

  it('fills a column across all rows and reports how many changed', () => {
    component.addNewRowToBatchList();
    component.defaultValueForm.patchValue({
      column: formatColumnTarget({ kind: 'text', control: 'spatialReferenceKeyProperty' }),
      textValue: 'ags',
    });

    component.onClickSaveColDefaultValue();

    expect(component.rows.map((row) => row.controls.spatialReferenceKeyProperty.value)).toEqual([
      'ags',
      'ags',
    ]);
    expect(notifications.showSuccess).toHaveBeenCalled();
  });

  it('clears the staged value when the target column changes', () => {
    component.defaultValueForm.patchValue({ textValue: 'stale', converterValue: CSV });

    component.onChangeDefaultColumn();

    expect(component.defaultValueForm.controls.textValue.value).toBe('');
    expect(component.defaultValueForm.controls.converterValue.value).toBeNull();
  });

  it('offers the union of converter mime types for the mime-type column', () => {
    expect(component.columnTargetOptions({ kind: 'text', control: 'mimeType' })).toEqual([
      'text/csv',
      'text/xml',
    ]);
  });

  it('offers no option list for a free-text column', () => {
    expect(
      component.columnTargetOptions({ kind: 'text', control: 'spatialReferenceKeyProperty' })
    ).toEqual([]);
    expect(component.columnTargetOptions(null)).toEqual([]);
  });
});
