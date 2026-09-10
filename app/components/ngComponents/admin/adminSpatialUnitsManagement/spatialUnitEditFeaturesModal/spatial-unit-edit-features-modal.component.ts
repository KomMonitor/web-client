import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SpatialUnitRefreshRequest } from '../spatial-unit-refresh.model';
import { HttpClient } from '@angular/common/http';
import {
  FeatureTableCallbacks,
  FeatureTableDataGridHelperService,
  FeatureTableEditStatus,
} from 'services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import { SpatialUnitOverviewType as SpatialUnitMetadata } from 'models/data-management-api';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import {
  buildMappingConfigExport,
  extractRemainingHeaders,
  transformFeaturesForGrid,
} from 'services/adminSpatialUnit/spatial-unit-metadata.util';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KmDatePickerComponent } from '../../../customElements/date-picker/km-date-picker.component';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import {
  addOrUpdateAttributeMapping,
  getErrorMessage,
  removeAttributeMapping,
  toIsoDateString,
} from '../spatial-unit-import.util';
import type {
  AttributeMappingRow,
  Converter,
  DatasourceType,
  ImporterObjectsConfig,
  MappingConfigImport,
} from 'services/resource-import-service/resource-import.model';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import {
  BboxType,
  ImporterFormGroup,
  importerFormToMissingFieldsInput,
  patchImporterFormFromMappingConfig,
  syncConverterParameterControls,
  syncDatasourceParameterControls,
} from '../../adminShared/importerForm/importer-form.model';
import { patchPeriodOfValidityForm } from '../../adminShared/periodOfValidityForm/period-of-validity-form.model';
import {
  attributeMappingDraftToRow,
  buildAttributeMappingDraftForm,
  patchAttributeMappingDraft,
  resetAttributeMappingDraft,
} from '../../adminShared/attributeMappingDraftForm/attribute-mapping-draft-form.model';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { FormControlAriaDirective } from '../../adminShared/formError/form-control-aria.directive';
import { controlInvalidSignal } from '../../adminShared/forms/control-state';
import {
  SpatialUnitEditFeaturesPutBody,
  buildSpatialUnitEditFeaturesForm,
  spatialUnitEditFeaturesFormToApi,
} from './spatial-unit-edit-features-form.model';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-spatial-unit-edit-features-modal',
  templateUrl: './spatial-unit-edit-features-modal.component.html',
  styleUrls: ['./spatial-unit-edit-features-modal.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FormErrorComponent,
    FormControlAriaDirective,
    CommonModule,
    LoadingOverlayComponent,
    AgGridAngular,
    KmDatePickerComponent,
    StepperComponent,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialUnitEditFeaturesModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private cacheHelperService = inject(CacheHelperServiceService);
  private indicatorValueService = inject(IndicatorValueService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private envConfigService = inject(EnvConfigService);
  kommonitorImporterHelperService = inject(KommonitorImporterHelperService);
  featureTableHelper = inject(FeatureTableDataGridHelperService);
  private http = inject(HttpClient);

  /** Emitted after features changed so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private resourceImportService = inject(ResourceImportService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('spatialUnitDataSourceInput', { static: false })
  spatialUnitDataSourceInput!: ElementRef;
  @ViewChild('spatialUnitFeatureTable', { static: true }) spatialUnitFeatureTable!: AgGridAngular;
  /** Same element, read as host node: scopes the header measurement to this grid. */
  @ViewChild('spatialUnitFeatureTable', { static: true, read: ElementRef })
  spatialUnitFeatureTableEl!: ElementRef<HTMLElement>;
  // km-date-picker handles its own datepicker internally; no ngb refs needed

  // Form data — signal: written from subscriptions/awaits/setTimeouts (OnPush).
  loadingData = signal(false);

  // Current dataset being edited
  currentSpatialUnitDataset: SpatialUnitMetadata | null = null;

  // Basic form data
  spatialUnitFeaturesGeoJSON: any = null;
  remainingFeatureHeaders: string[] = [];
  spatialUnitMappingConfigStructure_pretty = '';
  // Signal: written from async import callbacks and a hide timer (OnPush).
  spatialUnitMappingConfigImportError = signal('');

  /**
   * Typed model of the data step. The overview step is the AG-Grid feature
   * table and stays imperative. The accessors below keep the historic property
   * names working for the callers and the spec.
   */
  readonly editForm = buildSpatialUnitEditFeaturesForm();

  get importerForm(): ImporterFormGroup {
    return this.editForm.controls.importer;
  }

  private readonly dataStepInvalid = controlInvalidSignal(this.editForm, { whenTouched: true });

  // Multi-step form; only the data step carries a form, so only it can be
  // marked invalid.
  readonly stepper = new WizardStepper([
    { key: 'overview', label: 'ADMIN_SHARED_UI.STEP_LABELS.SPATIAL_UNIT_OVERVIEW' },
    {
      key: 'data',
      label: 'ADMIN_SHARED_UI.STEP_LABELS.SPATIAL_DATASET',
      invalid: this.dataStepInvalid,
    },
  ]);

  // Period of validity
  get periodOfValidity(): { startDate: string; endDate: string } {
    return this.editForm.controls.periodOfValidity.getRawValue();
  }
  set periodOfValidity(value: { startDate: any; endDate: any } | null | undefined) {
    patchPeriodOfValidityForm(this.editForm.controls.periodOfValidity, value);
  }
  get periodOfValidityInvalid(): boolean {
    return this.editForm.controls.periodOfValidity.hasError('periodOfValidity');
  }

  // Data source input
  geoJsonString: string = '';
  fileSelected: boolean = false;
  selectedDataSourceFile: File | null = null;
  get spatialUnitDataSourceIdProperty(): string {
    return this.importerForm.controls.idProperty.value;
  }
  set spatialUnitDataSourceIdProperty(value: string) {
    this.importerForm.controls.idProperty.setValue(value ?? '');
  }
  get spatialUnitDataSourceNameProperty(): string {
    return this.importerForm.controls.nameProperty.value;
  }
  set spatialUnitDataSourceNameProperty(value: string) {
    this.importerForm.controls.nameProperty.setValue(value ?? '');
  }

  // Converter settings
  get converter(): any {
    return this.importerForm.controls.converter.value;
  }
  set converter(value: any) {
    this.importerForm.controls.converter.setValue(value ?? null);
  }
  get schema(): string {
    return this.importerForm.controls.schema.value;
  }
  set schema(value: string) {
    this.importerForm.controls.schema.setValue(value ?? '');
  }
  get mimeType(): string {
    return this.importerForm.controls.mimeType.value;
  }
  set mimeType(value: string) {
    this.importerForm.controls.mimeType.setValue(value ?? '');
  }
  get datasourceType(): any {
    return this.importerForm.controls.datasourceType.value;
  }
  set datasourceType(value: any) {
    this.importerForm.controls.datasourceType.setValue(value ?? null);
  }

  // Importer objects
  converterDefinition: any = null;
  datasourceTypeDefinition: any = null;
  propertyMappingDefinition: any = null;
  putBody_spatialUnits: any = null;

  // Validity dates per feature
  get validityEndDate_perFeature(): string {
    return this.importerForm.controls.validEndDateProperty.value;
  }
  set validityEndDate_perFeature(value: string) {
    this.importerForm.controls.validEndDateProperty.setValue(value ?? '');
  }
  get validityStartDate_perFeature(): string {
    return this.importerForm.controls.validStartDateProperty.value;
  }
  set validityStartDate_perFeature(value: string) {
    this.importerForm.controls.validStartDateProperty.setValue(value ?? '');
  }

  /**
   * Staging row above the mapping table. Deliberately not part of `editForm`:
   * it is not submitted, and its required rules must not gate the modal.
   */
  readonly attributeMappingDraft = buildAttributeMappingDraftForm();
  get attributeMapping_sourceAttributeName(): string {
    return this.attributeMappingDraft.controls.sourceName.value;
  }
  set attributeMapping_sourceAttributeName(value: string) {
    this.attributeMappingDraft.controls.sourceName.setValue(value ?? '');
  }
  get attributeMapping_destinationAttributeName(): string {
    return this.attributeMappingDraft.controls.destinationName.value;
  }
  set attributeMapping_destinationAttributeName(value: string) {
    this.attributeMappingDraft.controls.destinationName.setValue(value ?? '');
  }
  get attributeMapping_attributeType(): any {
    return this.attributeMappingDraft.controls.dataType.value;
  }
  set attributeMapping_attributeType(value: any) {
    this.attributeMappingDraft.controls.dataType.setValue(value ?? null);
  }
  attributeMappings_adminView: AttributeMappingRow[] = [];
  get keepAttributes(): boolean {
    return this.importerForm.controls.keepAttributes.value;
  }
  set keepAttributes(value: boolean) {
    this.importerForm.controls.keepAttributes.setValue(!!value);
  }
  get keepMissingValues(): boolean {
    return this.importerForm.controls.keepMissingValues.value;
  }
  set keepMissingValues(value: boolean) {
    this.importerForm.controls.keepMissingValues.setValue(!!value);
  }

  // Partial update
  get isPartialUpdate(): boolean {
    return this.editForm.controls.isPartialUpdate.value;
  }
  set isPartialUpdate(value: boolean) {
    this.editForm.controls.isPartialUpdate.setValue(!!value);
  }

  // Import result data — signal: written after importer responses (OnPush).
  importerErrors = signal<any[]>([]);

  // Available options
  availableDatasourceTypes: DatasourceType[] = [];
  availableConverters: Converter[] = [];
  availableSpatialUnits: any[] = [];

  // Bbox parameters for OGCAPI_FEATURES
  get bboxType(): string {
    return this.importerForm.controls.bboxType.value;
  }
  set bboxType(value: string) {
    this.importerForm.controls.bboxType.setValue((value ?? '') as BboxType);
  }
  get bboxRefSpatialUnitLevel(): string {
    return this.importerForm.controls.bboxRefSpatialUnitId.value;
  }
  set bboxRefSpatialUnitLevel(value: string) {
    this.importerForm.controls.bboxRefSpatialUnitId.setValue(value ?? '');
  }
  get bbox_minx(): string {
    return this.importerForm.controls.bbox.controls.minx.value;
  }
  set bbox_minx(value: any) {
    this.importerForm.controls.bbox.controls.minx.setValue(value ?? '');
  }
  get bbox_miny(): string {
    return this.importerForm.controls.bbox.controls.miny.value;
  }
  set bbox_miny(value: any) {
    this.importerForm.controls.bbox.controls.miny.setValue(value ?? '');
  }
  get bbox_maxx(): string {
    return this.importerForm.controls.bbox.controls.maxx.value;
  }
  set bbox_maxx(value: any) {
    this.importerForm.controls.bbox.controls.maxx.setValue(value ?? '');
  }
  get bbox_maxy(): string {
    return this.importerForm.controls.bbox.controls.maxy.value;
  }
  set bbox_maxy(value: any) {
    this.importerForm.controls.bbox.controls.maxy.setValue(value ?? '');
  }

  // Feature table settings
  enableDeleteFeatures = false;

  /** Last edit/delete outcome of this modal's feature table (own instance). */
  readonly featureTableStatus = new FeatureTableEditStatus();

  // Grid options for feature table
  featureTableGridOptions: GridOptions = {};
  private gridApi!: GridApi;

  // AG Grid inputs (align with parent component pattern)
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public defaultColDef: ColDef = {};
  public paginationPageSize: number = 20;
  public paginationPageSizeSelector: number[] = [10, 20, 50, 100];

  // Persisted converter parameter values (e.g., CRS)
  get converterParameters(): { [key: string]: string } {
    return this.importerForm.controls.converterParameters.getRawValue();
  }
  get datasourceTypeParameters(): { [key: string]: string } {
    return this.importerForm.controls.datasourceTypeParameters.getRawValue();
  }

  // compare functions for selects to keep selection across renders
  public compareConverter = (a: any, b: any) => (a && b ? a.name === b.name : a === b);
  public compareDatasourceType = (a: any, b: any) => (a && b ? a.type === b.type : a === b);

  async ngOnInit(): Promise<void> {
    this.initializeForm();

    // The importer selects no longer carry (change) handlers; their dependent
    // fields and parameter controls hang off the form instead.
    this.importerForm.controls.converter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onChangeConverter());
    this.importerForm.controls.datasourceType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((datasourceType) => this.applyDatasourceTypeChange(datasourceType));

    await this.loadAvailableOptions();
    this.buildFeatureTable();
    this.ensureGridConfiguration();
  }

  private ensureGridConfiguration(): void {
    // Ensure grid options are properly configured
    if (this.featureTableGridOptions) {
      // Force enable pagination and filtering
      this.featureTableGridOptions.pagination = true;
      this.featureTableGridOptions.paginationPageSize = 20;
      this.featureTableGridOptions.paginationPageSizeSelector = [10, 20, 50, 100];

      // Ensure defaultColDef has proper filtering
      if (this.featureTableGridOptions.defaultColDef) {
        this.featureTableGridOptions.defaultColDef.filter = true;
        this.featureTableGridOptions.defaultColDef.floatingFilter = true;
        this.featureTableGridOptions.defaultColDef.sortable = true;
      }
    }
  }

  private initializeForm(): void {
    // Initialize form with defaults
    this.spatialUnitMappingConfigStructure_pretty =
      this.indicatorValueService.syntaxHighlightJSON(
        this.kommonitorImporterHelperService?.mappingConfigStructure
      ) || '';

    if (this.kommonitorImporterHelperService?.attributeMapping_attributeTypes?.length > 0) {
      this.attributeMapping_attributeType =
        this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
    }
  }

  /** Callbacks this modal's feature table reports its edits and deletes through. */
  private featureTableCallbacks(): FeatureTableCallbacks {
    return {
      onDeleteStart: () => this.loadingData.set(true),
      onDeleteSuccess: () => {
        this.refreshRequested.emit({
          crudType: 'edit',
          targetSpatialUnitId: this.currentSpatialUnitDataset?.spatialUnitId,
        });
        this.refreshSpatialUnitEditFeaturesOverviewTable();
      },
      onDeleteError: () => this.loadingData.set(false),
      onCellEditResult: (success) => this.featureTableStatus.record(success),
    };
  }

  private async loadAvailableOptions(): Promise<void> {
    // Wait for the importer helper service to load data if it hasn't already
    if (!this.kommonitorImporterHelperService?.getAvailableDatasourceTypes()?.length) {
      try {
        await this.kommonitorImporterHelperService.fetchResourcesFromImporter();
      } catch {
        // best-effort: ignore resource fetch errors
      }
    }

    // Load available datasource types from the importer helper service
    this.availableDatasourceTypes =
      this.kommonitorImporterHelperService?.getAvailableDatasourceTypes() || [];
    // Cache available converters to preserve object identity across renders
    this.availableConverters = this.kommonitorImporterHelperService?.getAvailableConverters() || [];
  }

  private buildFeatureTable(): void {
    this.featureTableGridOptions = this.featureTableHelper.buildSpatialResourceFeatureTable(
      {
        headers: this.remainingFeatureHeaders || [],
        features: this.spatialUnitFeaturesGeoJSON?.features || [],
        resourceId: this.currentSpatialUnitDataset?.spatialUnitId,
        resourceType: 'spatialUnit',
        enableDelete: this.enableDeleteFeatures,
        gridRoot: () => this.spatialUnitFeatureTableEl?.nativeElement,
      },
      this.featureTableCallbacks()
    );

    // Bind the pieces the template feeds to <ag-grid-angular> individually
    this.columnDefs = this.featureTableGridOptions.columnDefs as ColDef[];
    this.rowData = this.featureTableGridOptions.rowData || [];
    this.defaultColDef = this.featureTableGridOptions.defaultColDef || {};

    // The grid bindings above are also reassigned from HTTP callbacks — mark
    // the OnPush view once here instead of signalling each grid field.
    this.cdr.markForCheck();
  }

  resetForm(): void {
    // Reset edit banners
    this.featureTableStatus.reset();

    // Reset form data
    this.spatialUnitFeaturesGeoJSON = null;
    this.remainingFeatureHeaders = [];
    this.periodOfValidity = { startDate: '', endDate: '' };
    this.geoJsonString = '';
    this.spatialUnitDataSourceIdProperty = '';
    this.spatialUnitDataSourceNameProperty = '';
    this.converter = null;
    this.schema = '';
    this.mimeType = '';
    this.datasourceType = null;
    this.converterDefinition = null;
    this.datasourceTypeDefinition = null;
    this.propertyMappingDefinition = null;
    this.putBody_spatialUnits = null;
    this.validityEndDate_perFeature = '';
    this.validityStartDate_perFeature = '';
    resetAttributeMappingDraft(this.attributeMappingDraft, this.defaultAttributeMappingType());
    this.attributeMappings_adminView = [];
    this.keepAttributes = true;
    this.keepMissingValues = true;
    this.isPartialUpdate = false;
    this.enableDeleteFeatures = false;
    this.fileSelected = false;
    this.importerErrors.set([]);
  }

  onChangeConverter(_schema?: any): void {
    if (this.converter) {
      // Initialize defaults like in Add modal
      this.schema = this.converter.schemas ? this.converter.schemas[0] : '';
      this.mimeType = this.converter.mimeTypes ? this.converter.mimeTypes[0] : '';
      syncConverterParameterControls(this.importerForm, this.converter);

      // Update available datasource types. If converter doesn't declare supported datasources,
      // fall back to all available types (matches Add modal behavior)
      const allDatasourceTypes =
        this.kommonitorImporterHelperService?.getAvailableDatasourceTypes() || [];
      const declared = (this.converter as any)?.datasources as string[] | undefined;
      if (Array.isArray(declared) && declared.length > 0) {
        this.availableDatasourceTypes = allDatasourceTypes.filter((dt) =>
          declared.includes(dt.type)
        );
      } else {
        this.availableDatasourceTypes = allDatasourceTypes;
      }

      // Auto-select if only one datasource type is available
      if (this.availableDatasourceTypes.length === 1) {
        this.datasourceType = this.availableDatasourceTypes[0];
        this.onChangeDatasourceType(this.datasourceType);
      }
    }
  }

  onChangeMimeType(mimeType: any): void {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any): void {
    this.datasourceType = datasourceType;
  }

  /**
   * Clears everything that depends on the data source type. Called from the
   * control's `valueChanges`, so it must not write the control back.
   */
  private applyDatasourceTypeChange(datasourceType: any): void {
    if (datasourceType && datasourceType.type === 'OGCAPI_FEATURES') {
      // Use array of available spatial units like in Add modal
      this.availableSpatialUnits = this.spatialUnitStore.availableSpatialUnits || [];
    }
    // reset DS param controls on type change
    syncDatasourceParameterControls(this.importerForm, datasourceType);
    this.bboxType = '';
    this.bboxRefSpatialUnitLevel = '';
    this.importerForm.controls.bbox.reset();
    this.selectedDataSourceFile = null;
    this.fileSelected = false;
  }

  refreshSpatialUnitEditFeaturesOverviewTable(): void {
    if (!this.currentSpatialUnitDataset) {
      return;
    }

    this.loadingData.set(true);

    const url = `${this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}/allFeatures`;

    this.http.get(url).subscribe({
      next: (response: any) => {
        this.spatialUnitFeaturesGeoJSON = response;

        // Use service method to extract remaining headers
        this.remainingFeatureHeaders = extractRemainingHeaders(
          this.spatialUnitFeaturesGeoJSON?.features || []
        );

        // Rebuild the grid options with new data
        this.buildFeatureTable();

        // Update the grid with new data
        this.updateGridWithData();

        // Use setTimeout to ensure proper change detection and DOM updates
        setTimeout(() => {
          this.loadingData.set(false);

          // If grid API is still not available, try to rebuild the grid
          if (!this.gridApi && this.spatialUnitFeatureTable) {
            this.buildFeatureTable();
          }
        }, 500); // Increased timeout to show loading state longer
      },
      error: (error) => {
        this.handleError(error);
        setTimeout(() => {
          this.loadingData.set(false);
        }, 500); // Increased timeout to show loading state longer
      },
    });
  }

  clearAllSpatialUnitFeatures(): void {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return;

    this.loadingData.set(true);

    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/spatial-units/${dataset.spatialUnitId}/allFeatures`;

    this.http.delete(url).subscribe({
      next: (_response: any) => {
        this.spatialUnitFeaturesGeoJSON = null;
        this.remainingFeatureHeaders = [];
        this.refreshRequested.emit({
          crudType: 'edit',
          targetSpatialUnitId: dataset.spatialUnitId,
        });

        // Clear the grid data; buildFeatureTable() reassigns the bound rowData/columnDefs.
        this.spatialUnitFeaturesGeoJSON = null;
        this.remainingFeatureHeaders = [];
        this.buildFeatureTable();

        this.notificationService.showSuccess(
          this.translate.instant(
            'ADMIN_SPATIAL_UNITS.EDIT_FEATURES_MODAL.MSG.ALL_FEATURES_DELETED',
            { name: dataset.spatialUnitLevel }
          )
        );

        setTimeout(() => {
          this.loadingData.set(false);
        }, 500); // Increased timeout to show loading state longer
      },
      error: (error) => {
        this.handleError(error);
        setTimeout(() => {
          this.loadingData.set(false);
        }, 500); // Increased timeout to show loading state longer
      },
    });
  }

  /** The rule is `periodOfValidityValidator` on the group now. */
  checkPeriodOfValidity(): void {
    this.editForm.controls.periodOfValidity.updateValueAndValidity();
  }

  // Date input helpers to support keyboard entry similar to Add modal
  private getTodayDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private isValidDateString(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const [yStr, mStr, dStr] = value.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
      return false;
    }
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  private ensureValidDateOrToday(value: any): string {
    if (!value) {
      return this.getTodayDateString();
    }
    if (typeof value === 'string') {
      return this.isValidDateString(value) ? value : this.getTodayDateString();
    }
    const asIso = toIsoDateString(value);
    return asIso ?? this.getTodayDateString();
  }

  // The `periodOfValidity` getter returns a snapshot of the form value, so
  // these write through the controls rather than mutating that object.
  onPeriodStartBlur(): void {
    const control = this.editForm.controls.periodOfValidity.controls.startDate;
    control.setValue(this.ensureValidDateOrToday(control.value));
  }

  onPeriodEndBlur(): void {
    const control = this.editForm.controls.periodOfValidity.controls.endDate;
    if (control.value) {
      control.setValue(this.ensureValidDateOrToday(control.value));
    }
  }

  onAddOrUpdateAttributeMapping(): void {
    this.attributeMappings_adminView = addOrUpdateAttributeMapping(
      this.attributeMappings_adminView,
      attributeMappingDraftToRow(this.attributeMappingDraft)
    );

    resetAttributeMappingDraft(this.attributeMappingDraft, this.defaultAttributeMappingType());
  }

  onClickEditAttributeMapping(attributeMappingEntry: any): void {
    patchAttributeMappingDraft(this.attributeMappingDraft, attributeMappingEntry);
  }

  /** First attribute-mapping type offered by the importer, if it has loaded. */
  private defaultAttributeMappingType(): any {
    return this.kommonitorImporterHelperService?.attributeMapping_attributeTypes?.[0] ?? null;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any): void {
    this.attributeMappings_adminView = removeAttributeMapping(
      this.attributeMappings_adminView,
      attributeMappingEntry.sourceName
    );
  }

  /** Snapshot of the current form state passed to the shared import service. */
  private importerObjectsConfig(): ImporterObjectsConfig {
    return {
      converter: this.converter,
      schema: this.schema,
      mimeType: this.mimeType,
      converterParameterValues: this.converterParameters,
      datasourceType: this.datasourceType,
      datasourceTypeFormValues: this.assembleDatasourceFormValues(),
      selectedFile: this.selectedDataSourceFile,
      fileInputElement: this.spatialUnitDataSourceInput?.nativeElement,
      idProperty: this.spatialUnitDataSourceIdProperty,
      nameProperty: this.spatialUnitDataSourceNameProperty,
      validStartDate: this.validityStartDate_perFeature,
      validEndDate: this.validityEndDate_perFeature,
      keepAttributes: this.keepAttributes,
      keepMissingValues: this.keepMissingValues,
      attributeMappings: this.attributeMappings_adminView,
    };
  }

  /** Edit-features data-source params: bbox fields are only included for OGCAPI. */
  private assembleDatasourceFormValues(): { [key: string]: string } {
    const formValues: { [key: string]: string } = { ...this.datasourceTypeParameters };
    if (this.datasourceType?.type === 'OGCAPI_FEATURES' && this.bboxType) {
      formValues['bboxType'] = this.bboxType;
      if (this.bboxType === 'ref' && this.bboxRefSpatialUnitLevel) {
        formValues['bboxRef'] = this.bboxRefSpatialUnitLevel;
      } else if (this.bboxType === 'literal') {
        formValues['bbox_minx'] = this.bbox_minx;
        formValues['bbox_miny'] = this.bbox_miny;
        formValues['bbox_maxx'] = this.bbox_maxx;
        formValues['bbox_maxy'] = this.bbox_maxy;
      }
    }
    return formValues;
  }

  async buildImporterObjects(): Promise<boolean> {
    try {
      const definitions = await this.resourceImportService.buildImporterObjects(
        this.importerObjectsConfig()
      );
      this.converterDefinition = definitions.converterDefinition;
      this.datasourceTypeDefinition = definitions.datasourceTypeDefinition;
      this.propertyMappingDefinition = definitions.propertyMappingDefinition;
      this.putBody_spatialUnits = this.buildPutBody_spatialUnits();

      return !!(
        this.converterDefinition &&
        this.datasourceTypeDefinition &&
        this.propertyMappingDefinition &&
        this.putBody_spatialUnits
      );
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  buildPutBody_spatialUnits(): SpatialUnitEditFeaturesPutBody {
    return spatialUnitEditFeaturesFormToApi(this.editForm);
  }

  /**
   * True when a data-source file is selected: either the change handler set the
   * flag, or the file input itself carries a file (it survives a form reset that
   * only clears the flag).
   */
  private hasSelectedDataSourceFile(): boolean {
    if (this.fileSelected) {
      return true;
    }
    const inputEl = this.spatialUnitDataSourceInput?.nativeElement as HTMLInputElement | undefined;
    return !!inputEl?.files?.length;
  }

  async editSpatialUnitFeatures(): Promise<void> {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return;

    this.loadingData.set(true);
    this.importerErrors.set([]);

    const missing = this.resourceImportService.collectMissingImporterFields(
      importerFormToMissingFieldsInput(this.importerForm, {
        hasFile: this.hasSelectedDataSourceFile(),
        startDate: this.periodOfValidity.startDate,
        periodOfValidityInvalid: this.periodOfValidityInvalid,
      })
    );

    if (missing.length > 0) {
      this.loadingData.set(false);
      this.notificationService.showError(
        this.translate.instant(
          'ADMIN_SPATIAL_UNITS.EDIT_FEATURES_MODAL.MSG.REQUIRED_FIELDS_MISSING',
          { missing: missing.join(', ') }
        )
      );
      return;
    }

    const allDataSpecified = await this.buildImporterObjects();
    if (!allDataSpecified) {
      this.loadingData.set(false);
      this.notificationService.showError(
        this.translate.instant('ADMIN_SPATIAL_UNITS.EDIT_FEATURES_MODAL.MSG.REQUIRED_FIELDS')
      );
      return;
    }

    try {
      const updateSpatialUnitResponse_dryRun =
        await this.kommonitorImporterHelperService?.updateSpatialUnit(
          this.converterDefinition,
          this.datasourceTypeDefinition,
          this.propertyMappingDefinition,
          dataset.spatialUnitId,
          this.putBody_spatialUnits,
          true
        );

      if (
        !this.kommonitorImporterHelperService?.importerResponseContainsErrors(
          updateSpatialUnitResponse_dryRun
        )
      ) {
        await this.kommonitorImporterHelperService?.updateSpatialUnit(
          this.converterDefinition,
          this.datasourceTypeDefinition,
          this.propertyMappingDefinition,
          dataset.spatialUnitId,
          this.putBody_spatialUnits,
          false
        );

        this.refreshRequested.emit({
          crudType: 'edit',
          targetSpatialUnitId: dataset.spatialUnitId,
        });
        this.loadingData.set(false);
        this.notificationService.showSuccess(
          this.translate.instant('ADMIN_SPATIAL_UNITS.EDIT_FEATURES_MODAL.MSG.FEATURES_UPDATED', {
            name: dataset.spatialUnitLevel,
          })
        );
        this.activeModal.close({ action: 'updated' });
      } else {
        // Dry-run reported import errors: keep the modal open and list the
        // affected feature IDs inline; summarise via a toast.
        this.importerErrors.set(
          this.kommonitorImporterHelperService?.getErrorsFromImporterResponse(
            updateSpatialUnitResponse_dryRun
          ) || []
        );
        this.loadingData.set(false);
        this.notificationService.showError(
          this.translate.instant(
            'ADMIN_SPATIAL_UNITS.EDIT_FEATURES_MODAL.MSG.CRITICAL_FEATURE_ERRORS'
          )
        );
      }
    } catch (error) {
      this.handleError(error);
      this.loadingData.set(false);
    }
  }

  onFileSelected(event: any): void {
    const input = event?.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
      this.selectedDataSourceFile = input.files[0];
    } else {
      this.selectedDataSourceFile = null;
    }
    this.fileSelected = !!(input && input.files && input.files.length > 0);
  }

  // Import/Export functionality
  onImportSpatialUnitEditFeaturesMappingConfig(): void {
    this.spatialUnitMappingConfigImportError.set('');
    if (this.mappingConfigImportFile) {
      this.mappingConfigImportFile.nativeElement.click();
    }
  }

  async onMappingConfigFileSelected(event: any): Promise<void> {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }
    this.spatialUnitMappingConfigImportError.set('');
    try {
      const json = await this.resourceImportService.readJsonFile(file);
      this.applyMappingConfig(this.resourceImportService.parseMappingConfig(json));
    } catch (error) {
      this.spatialUnitMappingConfigImportError.set(getErrorMessage(error));
      this.showMappingConfigErrorAlert();
    }
    // The import rewrites many ngModel-bound fields after an await — mark the
    // OnPush view once instead of converting each field to a signal.
    this.cdr.markForCheck();
  }

  /** Applies a parsed mapping-config onto this modal's form fields. */
  private applyMappingConfig(parsed: MappingConfigImport): void {
    this.converter = parsed.converter;
    this.schema = parsed.schema;
    this.mimeType = parsed.mimeType;
    this.datasourceType = parsed.datasourceType;

    // Covers converter/schema/mime type, both parameter records, the data
    // source, the property names and the keep flags. The bbox is handled by
    // this modal's own interpretation right below.
    patchImporterFormFromMappingConfig(this.importerForm, parsed);
    this.applyBbox(parsed.dataSourceParameters);

    this.attributeMappings_adminView = parsed.attributeMappings;

    if (parsed.periodOfValidity) {
      this.periodOfValidity = parsed.periodOfValidity;
      this.checkPeriodOfValidity();
    }
  }

  /**
   * Edit-features bbox interpretation: unlike the add modal there is no
   * dedicated `bboxType` parameter, so the type is inferred from the bbox value
   * itself — and only for OGCAPI data sources.
   */
  private applyBbox(dsParams: { name: string; value: string }[]): void {
    if (this.datasourceType?.type !== 'OGCAPI_FEATURES') {
      return;
    }
    const bboxParam = dsParams.find((p) => p.name === 'bbox');
    if (!bboxParam || typeof bboxParam.value !== 'string') {
      return;
    }
    const parts = bboxParam.value.split(',').map((v) => v.trim());
    if (parts.length === 4 && parts.every((p) => p !== '')) {
      this.bboxType = 'literal';
      this.importerForm.controls.bbox.setValue({
        minx: parts[0],
        miny: parts[1],
        maxx: parts[2],
        maxy: parts[3],
      });
    } else {
      this.bboxType = 'ref';
      this.bboxRefSpatialUnitLevel = bboxParam.value;
    }
  }

  async onExportSpatialUnitEditFeaturesMappingConfig(): Promise<void> {
    const definitions = await this.resourceImportService.buildImporterObjects(
      this.importerObjectsConfig()
    );

    // Use service method to build export structure
    const mappingConfigExport = buildMappingConfigExport(
      definitions.converterDefinition,
      definitions.datasourceTypeDefinition,
      definitions.propertyMappingDefinition,
      this.periodOfValidity
    );

    const fileName = `KomMonitor-Import-Mapping-Konfiguration_Export-${this.currentSpatialUnitDataset?.spatialUnitLevel || 'SpatialUnit'}.json`;
    this.resourceImportService.downloadJson(fileName, mappingConfigExport);
  }

  onChangeEnableDeleteFeatures(): void {
    // Rebuild the grid with updated delete settings
    this.buildFeatureTable();

    // buildFeatureTable() reassigned the bound columnDefs/rowData; just update the
    // row data for the new delete settings and force a re-render.
    if (this.gridApi && this.columnDefs?.length) {
      // Update data if we have features
      if (this.spatialUnitFeaturesGeoJSON?.features) {
        // Use service method to transform data for grid display
        this.rowData = transformFeaturesForGrid(this.spatialUnitFeaturesGeoJSON.features);
      }

      // Force refresh of the grid to show/hide delete buttons
      this.gridApi.refreshCells();
    }
  }

  // Filtering is now handled by the service method extractRemainingHeaders

  getFeatureId(geojsonFeature: any): string {
    return geojsonFeature.properties?.['ID'] || '';
  }

  getFeatureName(geojsonFeature: any): string {
    return geojsonFeature.properties?.['NAME'] || '';
  }

  // AG Grid event handlers
  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;

    // Force refresh grid configuration after a short delay
    setTimeout(() => {
      this.forceRefreshGridConfiguration();
    }, 100);

    // If we have data already, update the grid
    if (this.spatialUnitFeaturesGeoJSON?.features && this.remainingFeatureHeaders.length > 0) {
      this.updateGridWithData();
    }
  }

  private forceRefreshGridConfiguration(): void {
    if (!this.gridApi) return;

    // Force refresh of grid configuration
    this.gridApi.refreshHeader();
    this.gridApi.refreshCells();

    // Ensure pagination is visible
    if (this.featureTableGridOptions.pagination) {
      this.gridApi.paginationGoToPage(0);
    }
  }

  private updateGridWithData(): void {
    if (!this.gridApi) {
      return;
    }

    // Transform and set data; the bound columnDefs/rowData (reassigned in
    // buildFeatureTable / here) are pushed to the grid by Angular.
    this.rowData = transformFeaturesForGrid(this.spatialUnitFeaturesGeoJSON?.features || []);
    this.cdr.markForCheck();
    this.gridApi.refreshCells();
    this.gridApi.redrawRows();

    // Force refresh of pagination and filtering
    this.gridApi.paginationGoToPage(0);
    this.gridApi.refreshHeader();
  }

  showMappingConfigErrorAlert(): void {
    setTimeout(() => this.hideMappingConfigErrorAlert(), 10000);
  }

  hideMappingConfigErrorAlert(): void {
    this.spatialUnitMappingConfigImportError.set('');
  }

  private handleError(error: any): void {
    this.notificationService.showError(
      this.translate.instant('ADMIN_SPATIAL_UNITS.EDIT_FEATURES_MODAL.MSG.GENERIC_ERROR', {
        error: getErrorMessage(error),
      })
    );
  }

  // Modal control methods
  closeModal(): void {
    this.activeModal.dismiss();
  }

  saveAndClose(): void {
    this.activeModal.close();
  }
}
