import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import type {
  Converter,
  DatasourceType,
  TimeseriesMapping,
} from 'services/resource-import-service/resource-import.model';
import { downloadJson, readJsonFile } from 'util/json-file.util';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { TimeseriesMappingFormComponent } from '../../adminShared/timeseriesMappingForm/timeseries-mapping-form.component';
import { isValidTimeseriesMappingList } from '../../adminShared/timeseriesMappingForm/timeseries-mapping-form.model';
import {
  BatchRowFormGroup,
  BatchUpdateFormGroup,
  buildBatchRow,
  buildBatchUpdateForm,
  collectBatchRunBlockers,
  hasFileDatasourceRow,
  syncBatchRowParameterControls,
  visibleConverterParameterNames,
  visibleDatasourceParameterNames,
} from './indicator-batch-update-form.model';
import {
  BatchListFileRow,
  batchListFileRowToRow,
  batchRowToFileRow,
  keepMissingValuesFromFile,
} from './indicator-batch-update-file.model';

/**
 * Batch update for indicator time series: one table row per indicator, each with
 * its own converter, data source and time-series mapping.
 *
 * WORK IN PROGRESS — the form is complete, the run is not: `startBatchUpdate()`
 * is still a no-op (`TODO(batch-update)`). The orchestration it will call already
 * exists as `BatchUpdateService`; wiring it up, the result surface and the
 * default-value function are the remaining steps. Do not treat a click on
 * "Update ausführen" as a completed update yet.
 */
@Component({
  selector: 'app-indicator-batch-update-modal',
  templateUrl: './indicator-batch-update-modal.component.html',
  styleUrls: ['./indicator-batch-update-modal.component.scss'],
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    FormErrorComponent,
    TimeseriesMappingFormComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorBatchUpdateModalComponent implements OnInit, OnDestroy {
  protected indicatorStore = inject(IndicatorMetadataStoreService);
  protected spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private importerHelper = inject(KommonitorImporterHelperService);

  @ViewChild('batchListFileInput') batchListFileInput!: ElementRef<HTMLInputElement>;
  @Input() modalRef?: NgbModalRef;

  readonly form: BatchUpdateFormGroup = buildBatchUpdateForm();

  /** Signal: set from awaits and (later) the batch run itself (OnPush). */
  readonly loadingData = signal(false);

  /** Row index whose time-series mapping panel is expanded, or null. */
  readonly expandedMappingRow = signal<number | null>(null);

  /** Emits on every value/status event of the form, driving the computeds below. */
  private readonly formEvent = toSignal(this.form.events, { initialValue: null });

  /**
   * Parameter columns are derived from the selected converters and data-source
   * types instead of being hard-coded per converter name, which is what the
   * legacy `checkColumnsToShowSelectedConverter()` /
   * `checkIfSelectedDatasourceTypeIs*()` scans did — once per header, per footer
   * and per row on every change-detection pass.
   */
  readonly converterParameterColumns = computed(() => {
    this.formEvent();
    return visibleConverterParameterNames(this.form);
  });

  readonly datasourceParameterColumns = computed(() => {
    this.formEvent();
    return visibleDatasourceParameterNames(this.form);
  });

  readonly showFileColumn = computed(() => {
    this.formEvent();
    return hasFileDatasourceRow(this.form);
  });

  /** i18n keys of everything that keeps the run button disabled. */
  readonly runBlockers = computed(() => {
    this.formEvent();
    return collectBatchRunBlockers(this.form);
  });

  private readonly rowSubscriptions = new Map<BatchRowFormGroup, { unsubscribe(): void }[]>();

  get rows(): BatchRowFormGroup[] {
    return this.form.controls.rows.controls;
  }

  ngOnInit(): void {
    if (this.rows.length === 0) {
      this.addNewRowToBatchList();
    }
  }

  ngOnDestroy(): void {
    this.rowSubscriptions.forEach((subscriptions) =>
      subscriptions.forEach((subscription) => subscription.unsubscribe())
    );
    this.rowSubscriptions.clear();
  }

  // ---------------------------------------------------------------- table rows

  addNewRowToBatchList(): void {
    const row = buildBatchRow();
    this.form.controls.rows.push(row);

    // Both parameter records are rebuilt from the current selection, so the
    // template only ever renders controls that exist.
    this.rowSubscriptions.set(row, [
      row.controls.converter.valueChanges.subscribe(() => this.onConverterChanged(row)),
      row.controls.datasourceType.valueChanges.subscribe(() => this.onDatasourceTypeChanged(row)),
    ]);
  }

  deleteSelectedRowsFromBatchList(): void {
    for (let index = this.rows.length - 1; index >= 0; index -= 1) {
      if (this.rows[index].controls.selected.value) {
        this.removeRowAt(index);
      }
    }
    this.expandedMappingRow.set(null);
  }

  private removeRowAt(index: number): void {
    const row = this.rows[index];
    this.rowSubscriptions.get(row)?.forEach((subscription) => subscription.unsubscribe());
    this.rowSubscriptions.delete(row);
    this.form.controls.rows.removeAt(index);
  }

  get allRowsSelected(): boolean {
    return this.rows.length > 0 && this.rows.every((row) => row.controls.selected.value);
  }

  onChangeSelectAllRows(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.rows.forEach((row) => row.controls.selected.setValue(checked));
  }

  // ------------------------------------------------------- converter selection

  private onConverterChanged(row: BatchRowFormGroup): void {
    const converter = row.controls.converter.value;
    row.controls.mimeType.setValue(
      converter?.mimeTypes?.length === 1 ? converter.mimeTypes[0] : ''
    );
    row.controls.schema.setValue('');
    row.controls.encoding.setValue('');
    syncBatchRowParameterControls(row);
  }

  private onDatasourceTypeChanged(row: BatchRowFormGroup): void {
    row.controls.selectedFile.setValue(null);
    syncBatchRowParameterControls(row);
  }

  /** Converters the importer offers for indicators. */
  availableConverters(): Converter[] {
    return this.importerHelper
      .getAvailableConverters()
      .filter(this.importerHelper.filterConverters('indicator'));
  }

  availableDatasourceTypes(): DatasourceType[] {
    return this.importerHelper.getAvailableDatasourceTypes();
  }

  /** Whether a row's converter declares the given parameter, i.e. renders a cell. */
  rowHasConverterParameter(row: BatchRowFormGroup, name: string): boolean {
    return !!row.controls.converterParameters.controls[name];
  }

  rowHasDatasourceParameter(row: BatchRowFormGroup, name: string): boolean {
    return !!row.controls.datasourceTypeParameters.controls[name];
  }

  isFileDatasource(row: BatchRowFormGroup): boolean {
    return row.controls.datasourceType.value?.type === 'FILE';
  }

  // ------------------------------------------------------ time-series mapping

  toggleTimeseriesMapping(index: number): void {
    this.expandedMappingRow.update((current) => (current === index ? null : index));
  }

  // ------------------------------------------------------------- file handling

  onDataSourceFileSelected(event: Event, row: BatchRowFormGroup): void {
    const input = event.target as HTMLInputElement;
    row.controls.selectedFile.setValue(input.files?.[0] ?? null);
  }

  async onMappingTableSelected(event: Event, row: BatchRowFormGroup): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    row.controls.mappingTableName.setValue(file.name);

    // The mapping table only carries the time-series mapping for this row; the
    // full mapping config is imported through the batch list instead.
    try {
      const parsed = await readJsonFile(file);
      const mapping = (parsed as { timeseriesMappings?: unknown })?.timeseriesMappings ?? parsed;
      if (isValidTimeseriesMappingList(mapping)) {
        row.controls.timeseriesMappings.setValue(mapping as TimeseriesMapping[]);
      }
    } catch {
      // Leave the row untouched; the file name still shows what was picked.
    }
  }

  saveMappingObjectToFile(row: BatchRowFormGroup): void {
    const indicatorName = this.indicatorName(row.controls.indicatorId.value) || 'unknown';
    downloadJson(
      `indicator-mapping-${indicatorName}.json`,
      JSON.stringify(batchRowToFileRow(row, this.spatialUnitStore), null, 2)
    );
  }

  loadIndicatorsBatchList(): void {
    this.batchListFileInput?.nativeElement.click();
  }

  async onBatchListFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.loadingData.set(true);
    try {
      const parsed = await readJsonFile(file);
      this.applyBatchListFile(Array.isArray(parsed) ? (parsed as BatchListFileRow[]) : []);
    } catch (error) {
      console.error('Error parsing batch list file:', error);
    } finally {
      this.loadingData.set(false);
    }
  }

  private applyBatchListFile(fileRows: readonly BatchListFileRow[]): void {
    while (this.rows.length > 0) {
      this.removeRowAt(this.rows.length - 1);
    }

    // The legacy format stored this per row although the importer takes it once
    // per run; the first row that carries it wins.
    const keepMissingValues = keepMissingValuesFromFile(fileRows);
    if (keepMissingValues !== undefined) {
      this.form.controls.keepMissingValues.setValue(keepMissingValues);
    }

    fileRows.forEach((fileRow) => {
      this.addNewRowToBatchList();
      batchListFileRowToRow(this.rows[this.rows.length - 1], fileRow, {
        converters: this.availableConverters(),
        datasourceTypes: this.availableDatasourceTypes(),
        spatialUnits: this.spatialUnitStore.availableSpatialUnits ?? [],
      });
    });

    if (this.rows.length === 0) {
      this.addNewRowToBatchList();
    }
  }

  saveBatchListToFile(): void {
    downloadJson(
      'indicator-batch-list.json',
      JSON.stringify(
        this.rows.map((row) => batchRowToFileRow(row, this.spatialUnitStore)),
        null,
        2
      )
    );
  }

  // ------------------------------------------------------------------ the run

  startBatchUpdate(): void {
    // TODO(batch-update): map the rows onto BatchUpdateRow (indicator metadata,
    // property mapping, PUT body) and hand them to
    // BatchUpdateService.runBatchUpdate, then show the result surface.
    // Still a no-op — nothing is persisted.
  }

  resetBatchUpdateForm(): void {
    while (this.rows.length > 0) {
      this.removeRowAt(this.rows.length - 1);
    }
    this.form.controls.keepMissingValues.setValue(true);
    this.expandedMappingRow.set(null);
    this.addNewRowToBatchList();
  }

  // ------------------------------------------------------------------ helpers

  indicatorName(indicatorId: string): string {
    return (
      this.indicatorStore.availableIndicators?.find(
        (indicator: any) => indicator.indicatorId === indicatorId
      )?.indicatorName ?? ''
    );
  }

  closeModal(): void {
    this.modalRef?.close();
  }
}
