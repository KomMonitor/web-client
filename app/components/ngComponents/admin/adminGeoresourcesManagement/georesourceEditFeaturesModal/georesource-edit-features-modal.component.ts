import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { GeoresourceRefreshRequest } from '../georesource-refresh.model';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { getErrorMessage } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColumnApi,
  ColumnResizedEvent,
  FirstDataRenderedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KmDatePickerComponent } from 'components/ngComponents/customElements/date-picker/km-date-picker.component';
import { SingleFeatureEditComponent } from 'components/ngComponents/common/single-feature-edit/single-feature-edit.component';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import {
  FeatureTableCallbacks,
  FeatureTableDataGridHelperService,
  FeatureTableEditStatus,
} from 'services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
import {
  BboxType,
  ImporterFormGroup,
  SYNTHETIC_DATASOURCE_PARAMETERS,
  patchImporterFormFromMappingConfig,
  syncConverterParameterControls,
  syncDatasourceParameterControls,
} from '../../adminShared/importerForm/importer-form.model';
import type {
  ImporterObjectsConfig,
  MappingConfigImport,
} from 'services/resource-import-service/resource-import.model';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { buildMappingConfigExport } from 'services/adminSpatialUnit/spatial-unit-metadata.util';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { buildGeoresourceEditFeaturesForm } from './georesource-edit-features-form.model';

@Component({
  selector: 'app-georesource-edit-features-modal',
  templateUrl: './georesource-edit-features-modal.component.html',
  styleUrls: ['./georesource-edit-features-modal.component.scss'],
  imports: [
    AgGridAngular,
    FormsModule,
    LoadingOverlayComponent,
    ReactiveFormsModule,
    FormErrorComponent,
    FormControlAriaDirective,
    SingleFeatureEditComponent,
    StepperComponent,
    KmDatePickerComponent,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoresourceEditFeaturesModalComponent implements OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);

  /** Emitted after a feature update/delete so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<GeoresourceRefreshRequest>();
  private cacheHelperService = inject(CacheHelperServiceService);
  private indicatorValueService = inject(IndicatorValueService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  kommonitorImporterHelperService = inject(KommonitorImporterHelperService);
  private resourceImportService = inject(ResourceImportService);
  featureTableHelper = inject(FeatureTableDataGridHelperService);
  private envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  /**
   * Typed model of the batch-import step. The overview step is the AG-Grid
   * feature table and the single-feature step is its own component; neither is
   * part of this form. The accessors below keep the historic property names
   * working for the PUT-body builder and the spec.
   */
  readonly editForm = buildGeoresourceEditFeaturesForm();

  get importerForm(): ImporterFormGroup {
    return this.editForm.controls.importer;
  }

  private readonly batchStepInvalid = controlInvalidSignal(this.editForm, { whenTouched: true });

  // Dynamic converter/datasource parameter inputs, keyed by parameter name.
  get converterParameterValues(): Record<string, string> {
    return this.importerForm.controls.converterParameters.getRawValue();
  }
  get datasourceParameterValues(): Record<string, string> {
    return this.importerForm.controls.datasourceTypeParameters.getRawValue();
  }
  get bboxMinX(): string {
    return this.importerForm.controls.bbox.controls.minx.value;
  }
  set bboxMinX(value: string) {
    this.importerForm.controls.bbox.controls.minx.setValue(value ?? '');
  }
  get bboxMinY(): string {
    return this.importerForm.controls.bbox.controls.miny.value;
  }
  set bboxMinY(value: string) {
    this.importerForm.controls.bbox.controls.miny.setValue(value ?? '');
  }
  get bboxMaxX(): string {
    return this.importerForm.controls.bbox.controls.maxx.value;
  }
  set bboxMaxX(value: string) {
    this.importerForm.controls.bbox.controls.maxx.setValue(value ?? '');
  }
  get bboxMaxY(): string {
    return this.importerForm.controls.bbox.controls.maxy.value;
  }
  set bboxMaxY(value: string) {
    this.importerForm.controls.bbox.controls.maxy.setValue(value ?? '');
  }

  // Alert visibility (template binding; formerly toggled via document.getElementById).
  // Update success/error feedback is toasted via NotificationService; only the
  // inline mapping-config import error report remains.
  // Signal: written from the async FileReader callback (OnPush).
  mappingConfigImportErrorAlertVisible = signal(false);

  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('dataSourceInput', { static: false }) dataSourceInput!: ElementRef;
  @ViewChild('georesourceFeatureTable', { static: true }) georesourceFeatureTable!: AgGridAngular;
  /** Same element, read as host node: scopes the header measurement to this grid. */
  @ViewChild('georesourceFeatureTable', { static: true, read: ElementRef })
  georesourceFeatureTableEl!: ElementRef<HTMLElement>;

  // Component state
  // Signal: toggled from subscriptions and grid-helper events (OnPush).
  loadingData = signal(false);
  private _currentGeoresourceDataset: any;
  readonly stepper = new WizardStepper([
    { key: 'overview', label: 'ADMIN_SHARED_UI.STEP_LABELS.FEATURE_OVERVIEW' },
    { key: 'single', label: 'ADMIN_SHARED_UI.STEP_LABELS.IMPORT_SINGLE_FEATURES' },
    {
      key: 'batch',
      label: 'ADMIN_SHARED_UI.STEP_LABELS.IMPORT_MULTIPLE_FEATURES',
      invalid: this.batchStepInvalid,
    },
  ]);

  get currentGeoresourceDataset(): any {
    return this._currentGeoresourceDataset;
  }

  set currentGeoresourceDataset(value: any) {
    this._currentGeoresourceDataset = value;
  }

  // Feature management
  enableDeleteFeatures = false;
  georesourceFeaturesGeoJSON: any;
  remainingFeatureHeaders: any[] = [];

  /** Last edit/delete outcome of this modal's feature table (own instance). */
  readonly featureTableStatus = new FeatureTableEditStatus();

  // AG-Grid configuration
  featureTableGridOptions: GridOptions = {};
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;

  // Single feature variables
  featureIdValue = 0;
  featureIdExampleString: string = '';
  featureIdIsValid = false;
  featureNameValue: string = '';
  featureGeometryValue: any;
  featureStartDateValue: string = '';
  featureEndDateValue: string = '';
  featureSchemaProperties: any[] = [];
  schemaObject: any;

  // Multiple feature import variables
  get periodOfValidity(): { startDate: string; endDate: string } {
    const period = this.editForm.controls.periodOfValidity.getRawValue();
    // Clearing the "valid until" field writes null (the picker no longer forces
    // today); the PUT body keeps sending '' for an open-ended period.
    return { startDate: period.startDate, endDate: period.endDate ?? '' };
  }
  set periodOfValidity(value: { startDate: any; endDate: any } | null | undefined) {
    patchPeriodOfValidityForm(this.editForm.controls.periodOfValidity, value);
  }
  get periodOfValidityInvalid(): boolean {
    return this.editForm.controls.periodOfValidity.hasError('periodOfValidity');
  }

  // Data source variables
  georesourceDataSourceInputInvalid = false;
  georesourceDataSourceInputInvalidReason: string = '';
  get georesourceDataSourceIdProperty(): string {
    return this.importerForm.controls.idProperty.value;
  }
  set georesourceDataSourceIdProperty(value: string) {
    this.importerForm.controls.idProperty.setValue(value ?? '');
  }
  get georesourceDataSourceNameProperty(): string {
    return this.importerForm.controls.nameProperty.value;
  }
  set georesourceDataSourceNameProperty(value: string) {
    this.importerForm.controls.nameProperty.setValue(value ?? '');
  }
  idPropertyNotFound = false;
  namePropertyNotFound = false;

  // Import configuration
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

  // Available options
  /**
   * Read live from the helper service instead of copying the array once: the
   * helper *replaces* availableDatasourceTypes when its importer fetch resolves,
   * so a copy taken during ngOnInit stays empty forever and the data source
   * select renders no options at all.
   */
  get availableDatasourceTypes(): any[] {
    return this.kommonitorImporterHelperService.availableDatasourceTypes ?? [];
  }
  availableSpatialUnits: any[] = [];

  // Converter parameters
  converterDefinition: any;
  datasourceTypeDefinition: any;
  propertyMappingDefinition: any;
  putBody_georesources: any;

  // Validity date attributes
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
  attributeMappings_adminView: any[] = [];
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

  // BBOX configuration
  get bboxType(): string {
    return this.importerForm.controls.bboxType.value;
  }
  set bboxType(value: string) {
    this.importerForm.controls.bboxType.setValue((value ?? '') as BboxType);
  }
  /**
   * Id of the reference spatial unit. Historically this held the whole dataset
   * object and the PUT body read `.spatialUnitId` off it; storing the id keeps
   * the wire format identical and drops one object-identity `[ngValue]` select.
   */
  get bboxRefSpatialUnitId(): string {
    return this.importerForm.controls.bboxRefSpatialUnitId.value;
  }
  set bboxRefSpatialUnitId(value: string) {
    this.importerForm.controls.bboxRefSpatialUnitId.setValue(value ?? '');
  }

  // Partial update
  get isPartialUpdate(): boolean {
    return this.editForm.controls.isPartialUpdate.value;
  }
  set isPartialUpdate(value: boolean) {
    this.editForm.controls.isPartialUpdate.setValue(!!value);
  }

  // Per-feature importer error report (shown inline; summaries are toasted)
  // Signal: filled from the PUT error callback (OnPush).
  importerErrors = signal<any>(undefined);
  importedFeatures: any[] = [];

  // Mapping config import/export
  // Signal: written from the async FileReader callback (OnPush).
  georesourceMappingConfigImportError = signal('');
  georesourceMappingConfigStructure_pretty: string = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor() {
    this.initializeDefaultValues();

    // The importer selects no longer carry (ngModelChange) handlers; their
    // dependent fields and parameter controls hang off the form instead.
    // Wired here rather than in ngOnInit so the controls exist as soon as a
    // converter or data source is selected, however that happens.
    this.importerForm.controls.converter.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      syncConverterParameterControls(this.importerForm, this.converter);
      // Without this call onChangeConverter() was dead code — the template has
      // no (change) handler — so schema and source format stayed empty and the
      // stale data source survived a converter switch.
      this.onChangeConverter();
    });
    this.importerForm.controls.datasourceType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((datasourceType) => this.applyDatasourceTypeChange(datasourceType));
  }

  ngOnInit(): void {
    this.setupEventListeners();
    this.initializeMappingConfigStructure();
    this.buildFeatureTable();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private initializeDefaultValues(): void {
    this.attributeMapping_attributeType =
      this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
    this.availableSpatialUnits = this.spatialUnitStore.availableSpatialUnits;
  }

  private initializeMappingConfigStructure(): void {
    this.georesourceMappingConfigStructure_pretty = this.indicatorValueService.syntaxHighlightJSON(
      this.kommonitorImporterHelperService.mappingConfigStructure
    );
  }

  private setupEventListeners(): void {
    // Bus listener kept only for the cross-area "edit features" trigger.
    const broadcastSubscription = this.broadcastService.currentBroadcastMsg.subscribe(
      (broadcastMsg) => {
        if (broadcastMsg?.msg === BroadcastMessage.OnEditGeoresourceFeatures) {
          this.onEditGeoresourceFeatures(broadcastMsg.values);
        }
      }
    );
    this.subscriptions.push(broadcastSubscription);
  }

  /** Callbacks this modal's feature table reports its edits and deletes through. */
  private featureTableCallbacks(): FeatureTableCallbacks {
    return {
      onDeleteStart: () => this.loadingData.set(true),
      onDeleteSuccess: () => {
        this.refreshRequested.emit({
          crudType: 'edit',
          targetGeoresourceId: this.currentGeoresourceDataset?.georesourceId,
        });
        this.refreshGeoresourceEditFeaturesOverviewTable();
      },
      onDeleteError: () => this.loadingData.set(false),
      onCellEditResult: (success) => this.featureTableStatus.record(success),
    };
  }

  onEditGeoresourceFeatures(georesourceDataset: any): void {
    if (
      this.currentGeoresourceDataset &&
      this.currentGeoresourceDataset.datasetName === georesourceDataset.datasetName
    ) {
      return;
    }

    this.currentGeoresourceDataset = georesourceDataset;
    this.resetGeoresourceEditFeaturesForm();
    this.buildFeatureTable();
    this.refreshGeoresourceEditFeaturesOverviewTable();
  }

  // Feature table management
  private buildFeatureTable(headers: string[] = [], features: any[] = []): void {
    this.featureTableGridOptions = this.featureTableHelper.buildSpatialResourceFeatureTable(
      {
        headers,
        features,
        resourceId: this.currentGeoresourceDataset?.georesourceId,
        resourceType: 'georesource',
        enableDelete: this.enableDeleteFeatures,
        gridRoot: () => this.georesourceFeatureTableEl?.nativeElement,
      },
      this.featureTableCallbacks()
    );
  }

  refreshGeoresourceEditFeaturesOverviewTable(): void {
    if (!this.currentGeoresourceDataset) {
      console.warn('No current georesource dataset selected');
      return;
    }

    console.log('Starting refresh of georesource features table...');
    this.loadingData.set(true);

    const url = `${this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/georesources/${this.currentGeoresourceDataset.georesourceId}/allFeatures`;
    console.log('Fetching from URL:', url);

    this.http.get(url).subscribe({
      next: (response: any) => {
        console.log('Successfully received georesource features data:', response);
        this.georesourceFeaturesGeoJSON = response;
        const tmpRemainingHeaders: string[] = [];

        // Extract headers from the first feature's properties
        if (this.georesourceFeaturesGeoJSON?.features?.[0]?.properties) {
          console.log(
            'First feature properties:',
            this.georesourceFeaturesGeoJSON.features[0].properties
          );
          for (const property in this.georesourceFeaturesGeoJSON.features[0].properties) {
            if (
              property !== this.envConfigService.FEATURE_ID_PROPERTY_NAME &&
              property !== this.envConfigService.FEATURE_NAME_PROPERTY_NAME &&
              property !== this.envConfigService.VALID_START_DATE_PROPERTY_NAME &&
              property !== this.envConfigService.VALID_END_DATE_PROPERTY_NAME
            ) {
              tmpRemainingHeaders.push(property);
            }
          }
        }

        this.remainingFeatureHeaders = tmpRemainingHeaders;
        console.log('Remaining headers:', tmpRemainingHeaders);
        console.log('Features count:', this.georesourceFeaturesGeoJSON.features?.length || 0);

        // Rebuild the grid options with new data
        this.buildFeatureTable(tmpRemainingHeaders, this.georesourceFeaturesGeoJSON.features);

        // If grid API is available, update the data directly
        if (this.gridApi) {
          console.log('Updating grid data via API...');
          // Transform the data to match the expected format
          const transformedData = (this.georesourceFeaturesGeoJSON.features || []).map(
            (feature: any) => {
              if (feature.properties) {
                // Add geometry and record ID to properties
                feature.properties.kommonitorGeometry = feature.geometry;
                feature.properties.kommonitorRecordId = feature.id;
                return feature.properties;
              }
              return feature;
            }
          );
          console.log('Transformed data for grid:', transformedData);
          this.gridApi.setGridOption('rowData', transformedData);
          // Force refresh of the grid
          this.gridApi.refreshCells();
        }

        this.loadingData.set(false);
        // The grid options / headers above were rebuilt in this async callback.
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching georesource features:', error);
        this.handleError(error);
        this.loadingData.set(false);
      },
    });
  }

  onChangeEnableDeleteFeatures(): void {
    // Rebuild the table with updated delete functionality
    if (
      this.currentGeoresourceDataset &&
      this.remainingFeatureHeaders &&
      this.georesourceFeaturesGeoJSON
    ) {
      this.buildFeatureTable(
        this.remainingFeatureHeaders,
        this.georesourceFeaturesGeoJSON.features || []
      );

      // Update grid if API is available
      if (this.gridApi && this.featureTableGridOptions && this.featureTableGridOptions.columnDefs) {
        // Update column definitions to include/exclude delete buttons
        this.gridApi.setGridOption('columnDefs', this.featureTableGridOptions.columnDefs);
      }
    }
  }

  clearAllGeoresourceFeatures(): void {
    if (!this.enableDeleteFeatures || !this.currentGeoresourceDataset) return;

    if (
      confirm(this.translate.instant('ADMIN_GEORESOURCES.FEATURES_MODAL.MSG.DELETE_ALL_CONFIRM'))
    ) {
      this.loadingData.set(true);

      this.http
        .delete(
          `${this.envConfigService.baseUrlToKomMonitorDataAPI}/georesources/${this.currentGeoresourceDataset.georesourceId}/allFeatures`
        )
        .subscribe({
          next: (_response: any) => {
            this.loadingData.set(false);
            this.refreshGeoresourceEditFeaturesOverviewTable();
            alert(
              this.translate.instant('ADMIN_GEORESOURCES.FEATURES_MODAL.MSG.ALL_FEATURES_DELETED')
            );
          },
          error: (error: any) => {
            this.loadingData.set(false);
            console.error('Error deleting features:', error);
            alert(
              this.translate.instant('ADMIN_GEORESOURCES.FEATURES_MODAL.MSG.DELETE_FEATURES_FAILED')
            );
          },
        });
    }
  }

  // Converter and data source methods
  onChangeConverter(): void {
    // Seed the dependent fields from the converter, like the spatial-unit twin
    // and the AngularJS original: schema and source format default to the
    // converter's first entry, the data source has to be picked again.
    this.schema = this.converter?.schemas ? this.converter.schemas[0] : '';
    this.mimeType = this.converter?.mimeTypes ? this.converter.mimeTypes[0] : '';
    this.datasourceType = undefined;
  }

  onChangeMimeType(mimeType: string): void {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any): void {
    this.datasourceType = datasourceType;
  }

  /**
   * Rebuilds the data-source parameter controls. Called from the control's
   * `valueChanges`, so it must not write the control back.
   */
  private applyDatasourceTypeChange(datasourceType: any): void {
    syncDatasourceParameterControls(this.importerForm, datasourceType);
  }

  // Validation methods
  /** The rule is `periodOfValidityValidator` on the group now. */
  checkPeriodOfValidity(): void {
    this.editForm.controls.periodOfValidity.updateValueAndValidity();
  }

  // Attribute mapping methods
  onAddOrUpdateAttributeMapping(): void {
    if (this.attributeMappingDraft.invalid) {
      return;
    }

    const newMapping = attributeMappingDraftToRow(this.attributeMappingDraft);
    const existingIndex = this.attributeMappings_adminView.findIndex(
      (mapping) => mapping.sourceName === newMapping.sourceName
    );

    if (existingIndex >= 0) {
      this.attributeMappings_adminView[existingIndex] = newMapping;
    } else {
      this.attributeMappings_adminView.push(newMapping);
    }

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
    const index = this.attributeMappings_adminView.indexOf(attributeMappingEntry);
    if (index >= 0) {
      this.attributeMappings_adminView.splice(index, 1);
    }
  }

  // Import/Export methods
  onImportGeoresourceEditFeaturesMappingConfig(): void {
    this.georesourceMappingConfigImportError.set('');
    this.mappingConfigImportFile.nativeElement.click();
  }

  async onMappingConfigFileSelected(event: any): Promise<void> {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }
    this.georesourceMappingConfigImportError.set('');
    try {
      const json = await this.resourceImportService.readJsonFile(file);
      this.applyMappingConfig(this.resourceImportService.parseMappingConfig(json));
    } catch (error) {
      this.georesourceMappingConfigImportError.set(getErrorMessage(error));
      this.showMappingConfigImportErrorAlert();
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
   * Edit-features bbox interpretation, mirroring the spatial-unit twin: unlike
   * the add modal there is no dedicated `bboxType` parameter, so the type is
   * inferred from the bbox value itself — and only for OGCAPI data sources.
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
      this.bboxRefSpatialUnitId = bboxParam.value;
    }
  }

  /** Data-source form values for the definition builders: bbox only for OGCAPI. */
  private assembleDatasourceFormValues(): { [key: string]: string } {
    const formValues: { [key: string]: string } = { ...this.datasourceParameterValues };
    if (this.datasourceType?.type === 'OGCAPI_FEATURES' && this.bboxType) {
      formValues['bboxType'] = this.bboxType;
      if (this.bboxType === 'ref' && this.bboxRefSpatialUnitId) {
        formValues['bboxRef'] = this.bboxRefSpatialUnitId;
      } else if (this.bboxType === 'literal') {
        formValues['bbox_minx'] = this.bboxMinX;
        formValues['bbox_miny'] = this.bboxMinY;
        formValues['bbox_maxx'] = this.bboxMaxX;
        formValues['bbox_maxy'] = this.bboxMaxY;
      }
    }
    return formValues;
  }

  /**
   * Writes the shared mapping-config format (`converter` / `dataSource` /
   * `propertyMapping` / `periodOfValidity`) that the other importer modals and
   * the AngularJS original use, so a file written here can be read back by this
   * modal's own import and by its siblings. The definitions are built directly
   * from the helper rather than through `buildImporterObjects()`, which would
   * upload a selected file as a side effect of an export.
   */
  onExportGeoresourceEditFeaturesMappingConfig(): void {
    const converterDefinition = this.converter
      ? this.kommonitorImporterHelperService.buildConverterDefinition(
          this.converter,
          this.schema,
          this.mimeType,
          this.converterParameterValues
        )
      : null;

    const datasourceTypeDefinition = this.datasourceType
      ? this.kommonitorImporterHelperService.buildDatasourceTypeDefinition(
          this.datasourceType,
          this.assembleDatasourceFormValues()
        )
      : null;

    const propertyMappingDefinition =
      this.kommonitorImporterHelperService.buildPropertyMapping_spatialResource(
        this.georesourceDataSourceNameProperty,
        this.georesourceDataSourceIdProperty,
        this.validityStartDate_perFeature,
        this.validityEndDate_perFeature,
        '',
        this.keepAttributes,
        this.keepMissingValues,
        this.attributeMappings_adminView
      );

    const mappingConfigExport = buildMappingConfigExport(
      converterDefinition,
      datasourceTypeDefinition,
      propertyMappingDefinition,
      this.periodOfValidity
    );

    const name = this.currentGeoresourceDataset?.datasetName;
    const fileName = `KomMonitor-Import-Mapping-Konfiguration_Export${name ? '-' + name : ''}.json`;
    this.resourceImportService.downloadJson(fileName, mappingConfigExport);
  }

  /**
   * Sends the feature update through the **importer**, like every other import
   * in this app and like the spatial-unit twin: a dry run first, and only on a
   * clean dry run the real one. It used to PUT straight at
   * `{dataManagement}/georesources/{id}/features` — an endpoint that does not
   * exist (404) — and never uploaded the selected file, so this modal could
   * never update anything.
   */
  async editGeoresourceFeatures(): Promise<void> {
    const dataset = this.currentGeoresourceDataset;
    if (!dataset || !this.converter || !this.datasourceType) {
      return;
    }

    this.loadingData.set(true);
    this.importerErrors.set([]);

    if (!(await this.buildImporterObjects())) {
      this.loadingData.set(false);
      return;
    }

    try {
      const putBody = this.buildPutBody();

      const dryRunResponse = await this.kommonitorImporterHelperService.updateGeoresource(
        this.converterDefinition,
        this.datasourceTypeDefinition,
        this.propertyMappingDefinition,
        dataset.georesourceId,
        putBody,
        true
      );

      if (this.kommonitorImporterHelperService.importerResponseContainsErrors(dryRunResponse)) {
        // Dry run reported import errors: keep the modal open and list them.
        this.importerErrors.set(
          this.kommonitorImporterHelperService.getErrorsFromImporterResponse(dryRunResponse) || []
        );
        this.loadingData.set(false);
        this.notificationService.showError(
          this.translate.instant('ADMIN_GEORESOURCES.ADD_MODAL.MSG.CRITICAL_FEATURE_ERRORS')
        );
        return;
      }

      const response = await this.kommonitorImporterHelperService.updateGeoresource(
        this.converterDefinition,
        this.datasourceTypeDefinition,
        this.propertyMappingDefinition,
        dataset.georesourceId,
        putBody,
        false
      );

      this.importedFeatures =
        this.kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(response) ||
        [];
      this.cdr.markForCheck();
      this.refreshRequested.emit({ crudType: 'edit', targetGeoresourceId: dataset.georesourceId });
      this.loadingData.set(false);

      const featureCount = this.importedFeatures.length;
      this.notificationService.showSuccess(
        featureCount > 0
          ? this.translate.instant('ADMIN_GEORESOURCES.FEATURES_MODAL.MSG.FEATURES_UPDATED_WITH', {
              name: dataset.datasetName,
              count: featureCount,
            })
          : this.translate.instant('ADMIN_GEORESOURCES.FEATURES_MODAL.MSG.FEATURES_UPDATED', {
              name: dataset.datasetName,
            })
      );
      this.activeModal.close({ action: 'updated' });
    } catch (error: any) {
      // Keep the modal open so the per-feature importer error report stays visible.
      this.importerErrors.set(error?.error?.importerErrors || []);
      this.notificationService.showError(
        this.translate.instant('ADMIN_GEORESOURCES.FEATURES_MODAL.MSG.CONTINUE_FAILED', {
          error: getErrorMessage(error),
        })
      );
      this.loadingData.set(false);
    }
  }

  /** What the shared import service needs to build the three definitions. */
  private importerObjectsConfig(): ImporterObjectsConfig {
    return {
      converter: this.converter,
      schema: this.schema,
      mimeType: this.mimeType,
      converterParameterValues: this.converterParameterValues,
      datasourceType: this.datasourceType,
      datasourceTypeFormValues: this.assembleDatasourceFormValues(),
      selectedFile: this.dataSourceInput?.nativeElement?.files?.[0] ?? null,
      fileInputElement: this.dataSourceInput?.nativeElement,
      idProperty: this.georesourceDataSourceIdProperty,
      nameProperty: this.georesourceDataSourceNameProperty,
      validStartDate: this.validityStartDate_perFeature,
      validEndDate: this.validityEndDate_perFeature,
      keepAttributes: this.keepAttributes,
      keepMissingValues: this.keepMissingValues,
      attributeMappings: this.attributeMappings_adminView,
    };
  }

  /**
   * Builds converter, data source and property mapping the way every other
   * importer modal does — including the file upload for a FILE data source.
   */
  private async buildImporterObjects(): Promise<boolean> {
    try {
      const definitions = await this.resourceImportService.buildImporterObjects(
        this.importerObjectsConfig()
      );
      this.converterDefinition = definitions.converterDefinition;
      this.datasourceTypeDefinition = definitions.datasourceTypeDefinition;
      this.propertyMappingDefinition = definitions.propertyMappingDefinition;
      return !!(
        this.converterDefinition &&
        this.datasourceTypeDefinition &&
        this.propertyMappingDefinition
      );
    } catch (error) {
      this.importerErrors.set([]);
      this.notificationService.showError(
        this.translate.instant('ADMIN_GEORESOURCES.FEATURES_MODAL.MSG.CONTINUE_FAILED', {
          error: getErrorMessage(error),
        })
      );
      return false;
    }
  }

  /**
   * The `georesourcePutBody` of the importer envelope: exactly what
   * `GeoresourcePUTInputType` declares. The converter, data source and property
   * mapping travel as siblings next to it — they used to be folded in here as
   * hand-built blocks whose parameters were a dictionary instead of the
   * `{name, value}` array every other caller sends.
   */
  private buildPutBody(): {
    geoJsonString: string;
    periodOfValidity: any;
    isPartialUpdate: boolean;
  } {
    return {
      geoJsonString: '', // filled in by the importer
      periodOfValidity: {
        startDate: this.periodOfValidity.startDate,
        endDate: this.periodOfValidity.endDate,
      },
      isPartialUpdate: this.isPartialUpdate,
    };
  }

  private getConverterParameters(): any {
    const parameters: any = {};

    if (this.converter.parameters) {
      this.converter.parameters.forEach((param: any) => {
        parameters[param.name] = this.converterParameterValues[param.name] ?? '';
      });
    }

    if (this.schema) {
      parameters.schema = this.schema;
    }
    if (this.mimeType) {
      parameters.mimeType = this.mimeType;
    }

    return parameters;
  }

  private getDatasourceParameters(): any {
    const parameters: any = {};

    if (this.datasourceType.type === 'FILE') {
      // Handle file upload
      const fileInput: HTMLInputElement | undefined = this.dataSourceInput?.nativeElement;
      if (fileInput?.files?.[0]) {
        // File will be handled separately in actual implementation
        parameters.file = fileInput.files[0];
      }
    } else if (this.datasourceType.type === 'OGCAPI_FEATURES') {
      // Handle BBOX parameters
      if (this.bboxType === 'ref' && this.bboxRefSpatialUnitId) {
        parameters.spatialUnitId = this.bboxRefSpatialUnitId;
      } else if (this.bboxType === 'literal') {
        parameters.bbox = `${this.bboxMinX},${this.bboxMinY},${this.bboxMaxX},${this.bboxMaxY}`;
      }
    }

    // Add other datasource parameters. The synthetic bbox entries are already
    // handled above and have no control in the record — emitting them here
    // would put an empty `bboxType` into the importer body.
    if (this.datasourceType.parameters) {
      this.datasourceType.parameters.forEach((param: any) => {
        if (!SYNTHETIC_DATASOURCE_PARAMETERS.includes(param.name)) {
          parameters[param.name] = this.datasourceParameterValues[param.name] ?? '';
        }
      });
    }

    return parameters;
  }

  // Filter methods
  getFilteredConverters(): any[] {
    return this.kommonitorImporterHelperService.availableConverters.filter(
      this.kommonitorImporterHelperService.filterConverters('georesource')
    );
  }

  /**
   * The data-source parameters the template renders as plain fields: the
   * synthetic bbox entries have no control in `datasourceTypeParameters`,
   * they are rendered by the dedicated bbox block.
   */
  getFilteredDatasourceParameters(): any[] {
    if (!this.datasourceType?.parameters) return [];
    return this.datasourceType.parameters.filter(
      (param: any) => !SYNTHETIC_DATASOURCE_PARAMETERS.includes(param.name)
    );
  }

  // Form reset
  resetGeoresourceEditFeaturesForm(): void {
    this.stepper.reset();
    this.enableDeleteFeatures = false;

    // Reset all form fields
    this.converter = undefined;
    this.schema = '';
    this.mimeType = '';
    this.datasourceType = undefined;
    this.georesourceDataSourceIdProperty = '';
    this.georesourceDataSourceNameProperty = '';
    this.validityStartDate_perFeature = '';
    this.validityEndDate_perFeature = '';

    this.periodOfValidity = {
      startDate: '',
      endDate: '',
    };

    this.isPartialUpdate = false;
    this.keepAttributes = true;
    this.keepMissingValues = true;

    this.attributeMappings_adminView = [];
    resetAttributeMappingDraft(this.attributeMappingDraft, this.defaultAttributeMappingType());

    this.bboxType = '';
    this.bboxRefSpatialUnitId = '';
    this.importerForm.controls.bbox.reset();

    this.importerErrors.set(undefined);
    this.importedFeatures = [];
  }

  // Alert methods (template-bound flags)
  showMappingConfigImportErrorAlert(): void {
    this.mappingConfigImportErrorAlertVisible.set(true);
  }

  hideMappingConfigErrorAlert(): void {
    this.mappingConfigImportErrorAlertVisible.set(false);
  }

  // Validation for form submission
  canSubmitForm(): boolean {
    return !!this.currentGeoresourceDataset?.datasetName && this.editForm.valid;
  }

  // AG-Grid event handlers
  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    console.log('Grid is ready, API initialized');

    // Auto-size columns to fit content
    this.gridApi.sizeColumnsToFit();
  }

  onFirstDataRendered(_event: FirstDataRenderedEvent): void {
    // Handle first data rendered event
  }

  onColumnResized(_event: ColumnResizedEvent): void {
    // Handle column resize event
  }

  onCellValueChanged(params: any): void {
    // Handle cell value changes here
    console.log('Cell value changed:', params);

    // TODO: Implement API call to update the feature in the backend
    // Similar to the AngularJS version's cell update functionality
  }

  private handleError(error: any): void {
    console.error('Error occurred:', error);
    this.notificationService.showError(
      this.translate.instant('ADMIN_GEORESOURCES.FEATURES_MODAL.MSG.GENERIC_ERROR', {
        error: getErrorMessage(error),
      })
    );
  }

  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }
}
