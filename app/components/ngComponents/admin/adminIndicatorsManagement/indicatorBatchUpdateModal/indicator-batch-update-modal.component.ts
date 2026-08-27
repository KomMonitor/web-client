import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { BatchUpdateService } from 'services/batch-update-service/batch-update.service';
import {
  BatchUpdateRowResult,
  summariseBatchResults,
} from 'services/batch-update-service/batch-update.model';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import type {
  Converter,
  DatasourceType,
  TimeseriesMapping,
} from 'services/resource-import-service/resource-import.model';
import { downloadJson, readJsonFile } from 'util/json-file.util';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { BatchUpdateResultModalComponent } from '../../adminShared/batchUpdateResultModal/batch-update-result-modal.component';
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
  BatchColumnTarget,
  DefaultValueFormGroup,
  applyColumnDefault,
  availableColumnTargets,
  buildDefaultValueForm,
  columnTargetLabelKey,
  columnTargetPlainLabel,
  formatColumnTarget,
  parseColumnTarget,
} from './indicator-batch-update-defaults.model';
import { prepareBatchRows } from './indicator-batch-update-run.model';
import type { IndicatorRefreshRequest } from '../indicator-refresh.model';
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
 * The run is wired to `BatchUpdateService`: every row is dry-run first and only
 * committed when the importer reports no errors, and a failing row does not stop
 * the others — so a batch can end partially applied, which the summary reports.
 *
 * The per-row result table and the default-value function that fills one column
 * across all rows are wired up as well; what the released AngularJS client had
 * and this one does not is the georesource variant of the same list.
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
    ExpandableBoxComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorBatchUpdateModalComponent implements OnInit, OnDestroy {
  protected indicatorStore = inject(IndicatorMetadataStoreService);
  protected spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private importerHelper = inject(KommonitorImporterHelperService);
  private batchUpdateService = inject(BatchUpdateService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private modalService = inject(NgbModal);

  @ViewChild('batchListFileInput') batchListFileInput!: ElementRef<HTMLInputElement>;
  @Input() modalRef?: NgbModalRef;
  @Output() refreshRequested = new EventEmitter<IndicatorRefreshRequest>();

  readonly form: BatchUpdateFormGroup = buildBatchUpdateForm();

  /** Staging form of the "fill one column across all rows" panel. */
  readonly defaultValueForm: DefaultValueFormGroup = buildDefaultValueForm();

  /** Signal: set from awaits and (later) the batch run itself (OnPush). */
  readonly loadingData = signal(false);

  /** Row index whose time-series mapping panel is expanded, or null. */
  readonly expandedMappingRow = signal<number | null>(null);

  /** Results of the last run, kept for the result surface. */
  readonly lastResults = signal<BatchUpdateRowResult[] | null>(null);

  /** Rows already processed during a run, for the progress label. */
  readonly runProgress = signal<{ done: number; total: number } | null>(null);

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

  /** Columns the default-value panel can fill, derived from the current list. */
  readonly columnTargets = computed(() => {
    this.formEvent();
    return availableColumnTargets(this.form);
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

  /**
   * Runs the whole list. As in the released client **every** row runs — the row
   * checkbox drives deletion only, not selection for the run.
   */
  async startBatchUpdate(): Promise<void> {
    if (this.runBlockers().length > 0) {
      return;
    }

    const prepared = prepareBatchRows(this.form, {
      // Looked up per run, not captured in the row: an earlier row of the same
      // run may already have changed the indicator's metadata.
      findIndicator: (indicatorId) => this.indicatorStore.getIndicatorMetadataById(indicatorId),
      findSpatialUnitLevel: (spatialUnitId) =>
        (this.spatialUnitStore.availableSpatialUnits ?? []).find(
          (unit: any) => unit.spatialUnitId === spatialUnitId
        )?.spatialUnitLevel,
      builders: {
        buildPropertyMapping: (spatialReferenceKeyProperty, timeseriesMappings, keepMissing) =>
          this.importerHelper.buildPropertyMapping_indicatorResource(
            spatialReferenceKeyProperty,
            timeseriesMappings,
            keepMissing
          ),
        buildPutBody: (scopeProperties) =>
          this.importerHelper.buildPutBody_indicators(scopeProperties),
      },
    });

    this.loadingData.set(true);
    this.runProgress.set({ done: 0, total: prepared.rows.length });

    try {
      const results = await this.batchUpdateService.runBatchUpdate('indicator', prepared.rows, {
        onProgress: (done, total) => this.runProgress.set({ done, total }),
      });

      this.finishRun([...prepared.failures, ...results]);
    } finally {
      this.loadingData.set(false);
      this.runProgress.set(null);
    }
  }

  private finishRun(results: BatchUpdateRowResult[]): void {
    this.lastResults.set(results);

    const summary = summariseBatchResults(results);
    const message = this.translate.instant('ADMIN_INDICATORS.BATCH_MODAL.RUN_SUMMARY', summary);
    if (summary.error > 0) {
      this.notificationService.showError(message);
    } else {
      this.notificationService.showSuccess(message);
    }

    // A partially applied batch still changed data, so refresh either way.
    if (summary.success > 0) {
      this.refreshRequested.emit({ crudType: 'edit' });
    }

    this.openResultModal();
  }

  /**
   * Shows the per-row result table. Opened on top of this modal — nesting an
   * `NgbModal` inside an `NgbModal` is supported, but has no other precedent in
   * this repo yet, so it is worth a look in the browser.
   */
  openResultModal(): void {
    const results = this.lastResults();
    if (!results) {
      return;
    }

    const modalRef = this.modalService.open(BatchUpdateResultModalComponent, {
      size: 'xl',
      container: 'body',
      animation: false,
    });
    const instance = modalRef.componentInstance as BatchUpdateResultModalComponent;
    instance.resourceType = 'indicator';
    instance.results = results;

    modalRef.result.catch(() => {
      // Dismissed via backdrop or Escape.
    });
  }

  resetBatchUpdateForm(): void {
    while (this.rows.length > 0) {
      this.removeRowAt(this.rows.length - 1);
    }
    this.form.controls.keepMissingValues.setValue(true);
    this.expandedMappingRow.set(null);
    this.lastResults.set(null);
    this.addNewRowToBatchList();
  }

  // ------------------------------------------------------- default-value panel

  /** The parsed target of the panel's column select, or null while unset. */
  selectedColumnTarget(): BatchColumnTarget | null {
    return parseColumnTarget(this.defaultValueForm.controls.column.value);
  }

  columnTargetValue(target: BatchColumnTarget): string {
    return formatColumnTarget(target);
  }

  columnTargetLabelKey(target: BatchColumnTarget): string | null {
    return columnTargetLabelKey(target);
  }

  columnTargetPlainLabel(target: BatchColumnTarget): string {
    return columnTargetPlainLabel(target);
  }

  /** Text targets that are picked from a list rather than typed. */
  columnTargetOptions(target: BatchColumnTarget | null): string[] {
    if (target?.kind !== 'text') {
      return [];
    }
    switch (target.control) {
      case 'mimeType':
        return unique(this.availableConverters().flatMap((converter) => converter.mimeTypes ?? []));
      case 'encoding':
        return unique(this.availableConverters().flatMap((converter) => converter.encodings ?? []));
      case 'schema':
        return unique(this.availableConverters().flatMap((converter) => converter.schemas ?? []));
      default:
        return [];
    }
  }

  onChangeDefaultColumn(): void {
    this.defaultValueForm.patchValue({
      textValue: '',
      converterValue: null,
      datasourceTypeValue: null,
      timeseriesMappings: [],
    });
  }

  onClickSaveColDefaultValue(): void {
    const changed = applyColumnDefault(this.form, this.defaultValueForm);

    this.notificationService.showSuccess(
      this.translate.instant('ADMIN_INDICATORS.BATCH_MODAL.DEFAULT_APPLIED', { changed })
    );
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

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
