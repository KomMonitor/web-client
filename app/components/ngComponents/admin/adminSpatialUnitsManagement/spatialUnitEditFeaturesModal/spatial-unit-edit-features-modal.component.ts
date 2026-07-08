import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  DestroyRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SpatialUnitRefreshRequest } from '../spatial-unit-refresh.model';
import { HttpClient } from '@angular/common/http';
import { FeatureTableDataGridHelperService } from 'services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import {
  KommonitorDataExchangeService,
  SpatialUnitMetadata,
} from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KmDatePickerComponent } from '../../../customElements/date-picker/km-date-picker.component';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
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

declare const __env: any;

@Component({
  selector: 'app-spatial-unit-edit-features-modal',
  templateUrl: './spatial-unit-edit-features-modal.component.html',
  styleUrls: ['./spatial-unit-edit-features-modal.component.scss'],
  imports: [FormsModule, CommonModule, AgGridAngular, KmDatePickerComponent, StepperComponent],
  standalone: true,
})
export class SpatialUnitEditFeaturesModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  kommonitorImporterHelperService = inject(KommonitorImporterHelperService);
  featureTableHelper = inject(FeatureTableDataGridHelperService);
  private http = inject(HttpClient);

  /** Emitted after features changed so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  private resourceImportService = inject(ResourceImportService);

  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('spatialUnitDataSourceInput', { static: false })
  spatialUnitDataSourceInput!: ElementRef;
  @ViewChild('spatialUnitFeatureTable', { static: true }) spatialUnitFeatureTable!: AgGridAngular;
  // km-date-picker handles its own datepicker internally; no ngb refs needed

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'overview', label: 'Raumeinheit Übersicht' },
    { key: 'data', label: 'Räumlicher Datensatz' },
  ]);

  // Form data
  loadingData = false;

  // Current dataset being edited
  currentSpatialUnitDataset: SpatialUnitMetadata | null = null;

  // Basic form data
  spatialUnitFeaturesGeoJSON: any = null;
  remainingFeatureHeaders: string[] = [];
  spatialUnitMappingConfigStructure_pretty = '';
  spatialUnitMappingConfigImportError = '';

  // Period of validity
  periodOfValidity: { startDate: string; endDate: string } = {
    startDate: '',
    endDate: '',
  };
  periodOfValidityInvalid = false;

  // Data source input
  geoJsonString: string = '';
  fileSelected: boolean = false;
  selectedDataSourceFile: File | null = null;
  spatialUnitDataSourceIdProperty = '';
  spatialUnitDataSourceNameProperty = '';

  // Converter settings
  converter: any = null;
  schema: string = '';
  mimeType: string = '';
  datasourceType: any = null;

  // Importer objects
  converterDefinition: any = null;
  datasourceTypeDefinition: any = null;
  propertyMappingDefinition: any = null;
  putBody_spatialUnits: any = null;

  // Validity dates per feature
  validityEndDate_perFeature = '';
  validityStartDate_perFeature = '';

  // Attribute mapping
  attributeMapping_sourceAttributeName = '';
  attributeMapping_destinationAttributeName = '';
  attributeMapping_attributeType: any = null;
  attributeMappings_adminView: AttributeMappingRow[] = [];
  keepAttributes = true;
  keepMissingValues = true;

  // Partial update
  isPartialUpdate = false;

  // Import result data
  importerErrors: any[] = [];

  // Available options
  availableDatasourceTypes: DatasourceType[] = [];
  availableConverters: Converter[] = [];
  availableSpatialUnits: any[] = [];

  // Bbox parameters for OGCAPI_FEATURES
  bboxType: string = '';
  bboxRefSpatialUnitLevel: string = '';
  bbox_minx: any = null;
  bbox_miny: any = null;
  bbox_maxx: any = null;
  bbox_maxy: any = null;

  // Feature table settings
  enableDeleteFeatures = false;

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
  public converterParameters: { [key: string]: any } = {};
  public datasourceTypeParameters: { [key: string]: any } = {};

  // compare functions for selects to keep selection across renders
  public compareConverter = (a: any, b: any) => (a && b ? a.name === b.name : a === b);
  public compareDatasourceType = (a: any, b: any) => (a && b ? a.type === b.type : a === b);

  async ngOnInit(): Promise<void> {
    this.initializeForm();
    this.setupEventListeners();
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
      this.kommonitorDataExchangeService?.syntaxHighlightJSON(
        this.kommonitorImporterHelperService?.mappingConfigStructure
      ) || '';

    if (this.kommonitorImporterHelperService?.attributeMapping_attributeTypes?.length > 0) {
      this.attributeMapping_attributeType =
        this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
    }
  }

  private setupEventListeners(): void {
    // React to feature-table loading/delete events from the shared grid helper.
    this.featureTableHelper.featureTableEvents$
      .pipe(
        filter((event) => event.resourceType === this.featureTableHelper.resourceType_spatialUnit),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        if (event.type === 'loadingStart') {
          this.loadingData = true;
        } else if (event.type === 'loadingEnd') {
          this.loadingData = false;
        } else if (event.type === 'featureDeleted') {
          // Handle individual feature deletion
          this.refreshRequested.emit({
            crudType: 'edit',
            targetSpatialUnitId: this.currentSpatialUnitDataset?.spatialUnitId,
          });
          this.refreshSpatialUnitEditFeaturesOverviewTable();
        }
      });
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
    // Get base configuration from service
    const baseGridOptions = this.featureTableHelper.buildDataGrid_featureTable_spatialResource(
      'spatialUnitFeatureTable',
      this.remainingFeatureHeaders || [],
      this.spatialUnitFeaturesGeoJSON?.features || [],
      this.currentSpatialUnitDataset?.spatialUnitId,
      this.featureTableHelper.resourceType_spatialUnit,
      this.enableDeleteFeatures
    );

    // Extract service configuration
    const columnDefs = baseGridOptions.columnDefs || [];
    const rowData = baseGridOptions.rowData || [];
    const defaultColDef = baseGridOptions.defaultColDef || {};

    // Bind to template inputs
    this.columnDefs = columnDefs;
    this.rowData = rowData;
    this.defaultColDef = {
      ...defaultColDef,
      editable: true,
      sortable: true,
      flex: 1,
      minWidth: 150,
      filter: true,
      floatingFilter: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      cellEditor: 'agLargeTextCellEditor',
      cellStyle: {
        'font-size': '12px',
        'white-space': 'normal !important',
        'line-height': '20px !important',
        'word-break': 'break-word !important',
        'padding-top': '17px',
        'padding-bottom': '17px',
      },
    };

    // Override with component-specific settings
    this.featureTableGridOptions = {
      ...baseGridOptions,
      columnDefs: this.columnDefs,
      rowData: this.rowData,
      defaultColDef: this.defaultColDef,
      // Pagination settings
      pagination: true,
      paginationPageSize: this.paginationPageSize,
      paginationPageSizeSelector: this.paginationPageSizeSelector,
      // Grid features
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      suppressColumnVirtualisation: true,
      // enables undo / redo
      undoRedoCellEditing: true,
      undoRedoCellEditingLimit: 10,
      // enables flashing to help see cell changes
      enableCellChangeFlash: true,
      onGridReady: (params: any) => {
        this.gridApi = params.api;
      },
      onFirstDataRendered: () => {
        this.headerHeightSetter();
        this.registerFeatureTableClickHandlers();
      },
      onColumnResized: () => {
        this.headerHeightSetter();
      },
    };
  }

  resetForm(): void {
    // Reset edit banners
    if (this.featureTableHelper) {
      this.featureTableHelper.featureTable_spatialUnit_lastUpdate_timestamp_success = undefined;
      this.featureTableHelper.featureTable_spatialUnit_lastUpdate_timestamp_failure = undefined;
    }

    // Reset form data
    this.spatialUnitFeaturesGeoJSON = null;
    this.remainingFeatureHeaders = [];
    this.periodOfValidity = { startDate: '', endDate: '' };
    this.periodOfValidityInvalid = false;
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
    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMapping_attributeType =
      this.kommonitorImporterHelperService?.attributeMapping_attributeTypes?.[0];
    this.attributeMappings_adminView = [];
    this.keepAttributes = true;
    this.keepMissingValues = true;
    this.isPartialUpdate = false;
    this.enableDeleteFeatures = false;
    this.fileSelected = false;
    this.importerErrors = [];
  }

  onChangeConverter(_schema?: any): void {
    if (this.converter) {
      // Initialize defaults like in Add modal
      this.schema = this.converter.schemas ? this.converter.schemas[0] : '';
      this.mimeType = this.converter.mimeTypes ? this.converter.mimeTypes[0] : '';

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

    if (this.datasourceType && this.datasourceType.type === 'OGCAPI_FEATURES') {
      // Use array of available spatial units like in Add modal
      this.availableSpatialUnits = this.kommonitorDataExchangeService?.availableSpatialUnits || [];
    }
    // reset DS param cache on type change
    this.datasourceTypeParameters = {};
    this.bboxType = '';
    this.bboxRefSpatialUnitLevel = '';
    this.bbox_minx = this.bbox_miny = this.bbox_maxx = this.bbox_maxy = null;
    this.selectedDataSourceFile = null;
    this.fileSelected = false;
  }

  refreshSpatialUnitEditFeaturesOverviewTable(): void {
    if (!this.currentSpatialUnitDataset) {
      return;
    }

    this.loadingData = true;

    const url = `${this.kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}/allFeatures`;

    this.http.get(url).subscribe({
      next: (response: any) => {
        this.spatialUnitFeaturesGeoJSON = response;

        // Use service method to extract remaining headers
        this.remainingFeatureHeaders = this.kommonitorDataExchangeService.extractRemainingHeaders(
          this.spatialUnitFeaturesGeoJSON?.features || []
        );

        // Rebuild the grid options with new data
        this.buildFeatureTable();

        // Update the grid with new data
        this.updateGridWithData();

        // Register click handlers if delete features is enabled
        if (this.enableDeleteFeatures) {
          setTimeout(() => {
            this.featureTableHelper.registerFeatureTableClickHandlers(
              this.currentSpatialUnitDataset?.spatialUnitId,
              this.featureTableHelper.resourceType_spatialUnit,
              this.enableDeleteFeatures
            );
          }, 100);
        }

        // Use setTimeout to ensure proper change detection and DOM updates
        setTimeout(() => {
          this.loadingData = false;

          // If grid API is still not available, try to rebuild the grid
          if (!this.gridApi && this.spatialUnitFeatureTable) {
            this.buildFeatureTable();
          }
        }, 500); // Increased timeout to show loading state longer
      },
      error: (error) => {
        this.handleError(error);
        setTimeout(() => {
          this.loadingData = false;
        }, 500); // Increased timeout to show loading state longer
      },
    });
  }

  clearAllSpatialUnitFeatures(): void {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return;

    this.loadingData = true;

    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${dataset.spatialUnitId}/allFeatures`;

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
          `Alle Features der Raumebene "${dataset.spatialUnitLevel}" wurden gelöscht.`
        );

        setTimeout(() => {
          this.loadingData = false;
        }, 500); // Increased timeout to show loading state longer
      },
      error: (error) => {
        this.handleError(error);
        setTimeout(() => {
          this.loadingData = false;
        }, 500); // Increased timeout to show loading state longer
      },
    });
  }

  checkPeriodOfValidity(): void {
    // Use service method for validation
    const validation = this.kommonitorDataExchangeService.validatePeriodOfValidity(
      this.periodOfValidity.startDate,
      this.periodOfValidity.endDate
    );

    this.periodOfValidityInvalid = !validation.isValid;

    if (!validation.isValid && validation.error) {
      // no action required here
    }
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

  onPeriodStartBlur(): void {
    this.periodOfValidity.startDate = this.ensureValidDateOrToday(this.periodOfValidity.startDate);
    this.checkPeriodOfValidity();
  }

  onPeriodEndBlur(): void {
    if (this.periodOfValidity.endDate) {
      this.periodOfValidity.endDate = this.ensureValidDateOrToday(this.periodOfValidity.endDate);
    }
    this.checkPeriodOfValidity();
  }

  onAddOrUpdateAttributeMapping(): void {
    this.attributeMappings_adminView = addOrUpdateAttributeMapping(
      this.attributeMappings_adminView,
      {
        sourceName: this.attributeMapping_sourceAttributeName,
        destinationName: this.attributeMapping_destinationAttributeName,
        dataType: this.attributeMapping_attributeType,
      }
    );

    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMapping_attributeType =
      this.kommonitorImporterHelperService?.attributeMapping_attributeTypes?.[0];
  }

  onClickEditAttributeMapping(attributeMappingEntry: any): void {
    this.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
    this.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
    this.attributeMapping_attributeType = attributeMappingEntry.dataType;
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

  buildPutBody_spatialUnits(): any {
    return {
      geoJsonString: '', // will be set by importer
      periodOfValidity: {
        endDate: this.periodOfValidity.endDate,
        startDate: this.periodOfValidity.startDate,
      },
      isPartialUpdate: this.isPartialUpdate,
    };
  }

  /** True when a data-source file is selected (via ngModel flag or the DOM input). */
  private hasSelectedDataSourceFile(): boolean {
    if (this.fileSelected) {
      return true;
    }
    const inputEl = this.spatialUnitDataSourceInput?.nativeElement as HTMLInputElement | undefined;
    if (inputEl?.files?.length) {
      return true;
    }
    const fallbackEl = document.getElementById(
      'spatialUnitDataSourceInput_editFeatures'
    ) as HTMLInputElement | null;
    return !!fallbackEl?.files?.length;
  }

  async editSpatialUnitFeatures(): Promise<void> {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return;

    this.loadingData = true;
    this.importerErrors = [];

    const missing = this.resourceImportService.collectMissingImporterFields({
      converter: this.converter,
      schema: this.schema,
      mimeType: this.mimeType,
      converterParameters: this.converterParameters,
      datasourceType: this.datasourceType,
      datasourceTypeParameters: this.datasourceTypeParameters,
      hasFile: this.hasSelectedDataSourceFile(),
      bboxType: this.bboxType,
      bboxRefSpatialUnitLevel: this.bboxRefSpatialUnitLevel,
      bboxLiteral: {
        minx: this.bbox_minx,
        miny: this.bbox_miny,
        maxx: this.bbox_maxx,
        maxy: this.bbox_maxy,
      },
      idProperty: this.spatialUnitDataSourceIdProperty,
      nameProperty: this.spatialUnitDataSourceNameProperty,
      startDate: this.periodOfValidity.startDate,
      periodOfValidityInvalid: this.periodOfValidityInvalid,
    });

    if (missing.length > 0) {
      this.loadingData = false;
      this.notificationService.showError(
        `Bitte füllen Sie alle Pflichtfelder in Schritt 2 aus. Fehlend: ${missing.join(', ')}.`
      );
      return;
    }

    const allDataSpecified = await this.buildImporterObjects();
    if (!allDataSpecified) {
      this.loadingData = false;
      this.notificationService.showError('Bitte füllen Sie alle Pflichtfelder in Schritt 2 aus.');
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
        this.loadingData = false;
        this.notificationService.showSuccess(
          `Die Features der Raumebene "${dataset.spatialUnitLevel}" wurden aktualisiert.`
        );
        this.activeModal.close({ action: 'updated' });
      } else {
        // Dry-run reported import errors: keep the modal open and list the
        // affected feature IDs inline; summarise via a toast.
        this.importerErrors =
          this.kommonitorImporterHelperService?.getErrorsFromImporterResponse(
            updateSpatialUnitResponse_dryRun
          ) || [];
        this.loadingData = false;
        this.notificationService.showError(
          'Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf.'
        );
      }
    } catch (error) {
      this.handleError(error);
      this.loadingData = false;
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
    this.spatialUnitMappingConfigImportError = '';
    if (this.mappingConfigImportFile) {
      this.mappingConfigImportFile.nativeElement.click();
    }
  }

  async onMappingConfigFileSelected(event: any): Promise<void> {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }
    this.spatialUnitMappingConfigImportError = '';
    try {
      const json = await this.resourceImportService.readJsonFile(file);
      this.applyMappingConfig(this.resourceImportService.parseMappingConfig(json));
    } catch (error) {
      this.spatialUnitMappingConfigImportError = getErrorMessage(error);
      this.showMappingConfigErrorAlert();
    }
  }

  /** Applies a parsed mapping-config onto this modal's form fields. */
  private applyMappingConfig(parsed: MappingConfigImport): void {
    this.converter = parsed.converter;
    this.schema = parsed.schema;
    this.mimeType = parsed.mimeType;
    this.converterParameters = parsed.converterParameters;
    this.datasourceType = parsed.datasourceType;
    this.datasourceTypeParameters = parsed.datasourceTypeParameters;

    this.applyBbox(parsed.dataSourceParameters);

    this.spatialUnitDataSourceNameProperty = parsed.nameProperty;
    this.spatialUnitDataSourceIdProperty = parsed.idProperty;
    this.validityStartDate_perFeature = parsed.validStartDate;
    this.validityEndDate_perFeature = parsed.validEndDate;
    this.keepAttributes = parsed.keepAttributes;
    this.keepMissingValues = parsed.keepMissingValues;
    this.attributeMappings_adminView = parsed.attributeMappings;

    if (parsed.periodOfValidity) {
      this.periodOfValidity = parsed.periodOfValidity;
      this.checkPeriodOfValidity();
    }
  }

  /** Edit-features bbox interpretation: infer type from the bbox value (OGCAPI only). */
  private applyBbox(dsParams: { name: string; value: string }[]): void {
    if (this.datasourceType?.type !== 'OGCAPI_FEATURES') {
      return;
    }
    const bboxParam = dsParams.find((p) => p.name === 'bbox');
    if (bboxParam && typeof bboxParam.value === 'string') {
      const parts = bboxParam.value.split(',').map((v) => v.trim());
      if (parts.length === 4 && parts.every((p) => p !== '')) {
        this.bboxType = 'literal';
        this.bbox_minx = parts[0];
        this.bbox_miny = parts[1];
        this.bbox_maxx = parts[2];
        this.bbox_maxy = parts[3];
      } else {
        this.bboxType = 'ref';
        this.bboxRefSpatialUnitLevel = bboxParam.value;
      }
    }
  }

  async onExportSpatialUnitEditFeaturesMappingConfig(): Promise<void> {
    const definitions = await this.resourceImportService.buildImporterObjects(
      this.importerObjectsConfig()
    );

    // Use service method to build export structure
    const mappingConfigExport = this.kommonitorDataExchangeService.buildMappingConfigExport(
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
        this.rowData = this.kommonitorDataExchangeService.transformFeaturesForGrid(
          this.spatialUnitFeaturesGeoJSON.features
        );
      }

      // Force refresh of the grid to show/hide delete buttons
      this.gridApi.refreshCells();

      // Register click handlers after grid update
      setTimeout(() => {
        this.featureTableHelper.registerFeatureTableClickHandlers(
          this.currentSpatialUnitDataset?.spatialUnitId,
          this.featureTableHelper.resourceType_spatialUnit,
          this.enableDeleteFeatures
        );
      }, 100);
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

  private headerHeightSetter(): void {
    if (this.gridApi) {
      const headerHeight = this.headerHeightGetter();
      this.gridApi.setGridOption('headerHeight', headerHeight);
    }
  }

  private headerHeightGetter(): number {
    const headerElement = document.querySelector('.ag-header');
    if (headerElement) {
      const headerTextElements = headerElement.querySelectorAll('.ag-header-cell-text');
      let maxHeight = 0;
      headerTextElements.forEach((element) => {
        const height = element.scrollHeight;
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      return Math.max(maxHeight + 20, 50); // Add padding and minimum height
    }
    return 50;
  }

  private registerFeatureTableClickHandlers(): void {
    if (!this.enableDeleteFeatures) return;

    setTimeout(() => {
      this.featureTableHelper.registerFeatureTableClickHandlers(
        this.currentSpatialUnitDataset?.spatialUnitId,
        this.featureTableHelper.resourceType_spatialUnit,
        this.enableDeleteFeatures
      );
    }, 100);
  }

  private updateGridWithData(): void {
    if (!this.gridApi) {
      return;
    }

    // Transform and set data; the bound columnDefs/rowData (reassigned in
    // buildFeatureTable / here) are pushed to the grid by Angular.
    this.rowData = this.kommonitorDataExchangeService.transformFeaturesForGrid(
      this.spatialUnitFeaturesGeoJSON?.features || []
    );
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
    this.spatialUnitMappingConfigImportError = '';
  }

  private handleError(error: any): void {
    this.notificationService.showError('Ein Fehler ist aufgetreten: ' + getErrorMessage(error));
  }

  // Modal control methods
  closeModal(): void {
    this.activeModal.dismiss();
  }

  saveAndClose(): void {
    this.activeModal.close();
  }
}
