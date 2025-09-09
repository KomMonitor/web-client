import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi, ColumnApi, GridReadyEvent, FirstDataRenderedEvent, ColumnResizedEvent } from 'ag-grid-community';

declare const $: any;
declare const __env: any;

@Component({
  selector: 'spatial-unit-edit-features-modal-new',
  templateUrl: './spatial-unit-edit-features-modal.component.html',
  styleUrls: ['./spatial-unit-edit-features-modal.component.css']
})
export class SpatialUnitEditFeaturesModalComponent implements OnInit, OnDestroy {
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('spatialUnitDataSourceInput', { static: false }) spatialUnitDataSourceInput!: ElementRef;
  @ViewChild('spatialUnitFeatureTable', { static: true }) spatialUnitFeatureTable!: AgGridAngular;
  // km-date-picker handles its own datepicker internally; no ngb refs needed

  // Multi-step form
  currentStep = 1;
  totalSteps = 2;

  // Form data
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  loadingData = false;

  // Current dataset being edited
  currentSpatialUnitDataset: any = null;

  // Basic form data
  spatialUnitFeaturesGeoJSON: any = null;
  remainingFeatureHeaders: string[] = [];
  spatialUnitMappingConfigStructure_pretty = '';
  spatialUnitMappingConfigImportError = '';

  // Period of validity
  periodOfValidity: { startDate: string; endDate: string } = {
    startDate: '',
    endDate: ''
  };
  periodOfValidityInvalid = false;

  // Data source input
  geoJsonString: string = '';
  spatialUnit_asGeoJson: any = null;
  spatialUnitEditFeaturesDataSourceInputInvalidReason = '';
  spatialUnitEditFeaturesDataSourceInputInvalid = false;
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
  attributeMapping_data: any = null;
  attributeMapping_attributeType: any = null;
  attributeMappings_adminView: any[] = [];
  keepAttributes = true;
  keepMissingValues = true;

  // Partial update
  isPartialUpdate = false;

  // Error handling
  importerErrors: any[] = [];
  successMessagePart = '';
  errorMessagePart = '';

  // Available options
  availableDatasourceTypes: any[] = [];
  availableConverters: any[] = [];
  availableSpatialUnits: any[] = [];

  // Bbox parameters for OGCAPI_FEATURES
  bboxType: string = '';
  bboxRefSpatialUnit: any = null;
  bboxRefSpatialUnitLevel: string = '';
  bbox_minx: any = null;
  bbox_miny: any = null;
  bbox_maxx: any = null;
  bbox_maxy: any = null;

  // Feature table settings
  enableDeleteFeatures = false;

  // Import/Export functionality
  mappingConfigImportSettings: any = null;

  // Grid options for feature table
  featureTableGridOptions: GridOptions = {};
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;

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
  public compareConverter = (a: any, b: any) => a && b ? a.name === b.name : a === b;
  public compareDatasourceType = (a: any, b: any) => a && b ? a.type === b.type : a === b;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    public kommonitorImporterHelperService: KommonitorImporterHelperService,
    public kommonitorDataGridHelperService: KommonitorDataGridHelperService,
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) {
  }

  async ngOnInit(): Promise<void> {
    this.initializeDatePickers();
    this.initializeForm();
    this.setupEventListeners();
    await this.loadAvailableOptions();
    this.buildFeatureTable();
    this.ensureGridConfiguration();
    
    // Add a small delay to ensure everything is initialized
    setTimeout(() => {
      this.checkGridConfiguration();
    }, 500);
  }

  private checkGridConfiguration(): void {
    // Grid configuration check completed
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeDatePickers(): void {
    // ng-bootstrap date pickers are automatically initialized via template
    // No additional initialization needed
  }

  private initializeForm(): void {
    // Initialize form with defaults
    this.spatialUnitMappingConfigStructure_pretty = this.kommonitorDataExchangeService?.syntaxHighlightJSON(
      this.kommonitorImporterHelperService?.mappingConfigStructure
    ) || '';
    
    if (this.kommonitorImporterHelperService?.attributeMapping_attributeTypes?.length > 0) {
      this.attributeMapping_attributeType = this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
    }
  }

  private setupEventListeners(): void {
    // Setup broadcast listeners
    const broadcastSubscription = this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      if (broadcastMsg) {
        if (broadcastMsg.msg === 'onEditSpatialUnitFeatures') {
          this.onEditSpatialUnitFeatures(broadcastMsg.values);
        } else if (broadcastMsg.msg === 'showLoadingIcon_' + this.kommonitorDataGridHelperService?.resourceType_spatialUnit) {
          this.loadingData = true;
        } else if (broadcastMsg.msg === 'hideLoadingIcon_' + this.kommonitorDataGridHelperService?.resourceType_spatialUnit) {
          this.loadingData = false;
        } else if (broadcastMsg.msg === 'onDeleteFeatureEntry_' + this.kommonitorDataGridHelperService?.resourceType_spatialUnit) {
          // Handle individual feature deletion
          this.broadcastService.broadcast('refreshSpatialUnitOverviewTable', { 
            crudType: 'edit', 
            targetSpatialUnitId: this.currentSpatialUnitDataset?.spatialUnitId 
          });
          this.refreshSpatialUnitEditFeaturesOverviewTable();
        }
      }
    });

    this.subscriptions.push(broadcastSubscription);
  }

  private async loadAvailableOptions(): Promise<void> {
    // Wait for the importer helper service to load data if it hasn't already
    if (!this.kommonitorImporterHelperService?.getAvailableDatasourceTypes()?.length) {
      try {
        await this.kommonitorImporterHelperService.fetchResourcesFromImporter();
      } catch (error) {
      }
    }
    
    // Load available datasource types from the importer helper service
    this.availableDatasourceTypes = this.kommonitorImporterHelperService?.getAvailableDatasourceTypes() || [];
    // Cache available converters to preserve object identity across renders
    this.availableConverters = this.kommonitorImporterHelperService?.getAvailableConverters() || [];
  }

  private buildFeatureTable(): void {
    
    // Get base configuration from service
    const baseGridOptions = this.kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource(
      "spatialUnitFeatureTable", 
      this.remainingFeatureHeaders || [], 
      this.spatialUnitFeaturesGeoJSON?.features || [],
      this.currentSpatialUnitDataset?.spatialUnitId,
      this.kommonitorDataGridHelperService.resourceType_spatialUnit,
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
        'padding-bottom': '17px' 
      }
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
        this.columnApi = params.columnApi;
      },
      onFirstDataRendered: () => {
        this.headerHeightSetter();
        this.registerFeatureTableClickHandlers();
      },
      onColumnResized: () => {
        this.headerHeightSetter();
      }
    };
    

  }

  onEditSpatialUnitFeatures(spatialUnitDataset: any): void {
    if (this.currentSpatialUnitDataset && 
        this.currentSpatialUnitDataset.spatialUnitLevel === spatialUnitDataset.spatialUnitLevel) {
      return;
    }

    this.currentSpatialUnitDataset = spatialUnitDataset;
    this.resetForm();
    this.buildFeatureTable();
  }

  resetForm(): void {
    // Reset edit banners
    if (this.kommonitorDataGridHelperService) {
      this.kommonitorDataGridHelperService.featureTable_spatialUnit_lastUpdate_timestamp_success = undefined;
      this.kommonitorDataGridHelperService.featureTable_spatialUnit_lastUpdate_timestamp_failure = undefined;
    }

    // Reset form data
    this.spatialUnitFeaturesGeoJSON = null;
    this.remainingFeatureHeaders = [];
    this.periodOfValidity = { startDate: '', endDate: '' };
    this.periodOfValidityInvalid = false;
    this.geoJsonString = '';
    this.spatialUnit_asGeoJson = null;
    this.spatialUnitEditFeaturesDataSourceInputInvalidReason = '';
    this.spatialUnitEditFeaturesDataSourceInputInvalid = false;
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
    this.attributeMapping_data = null;
    this.attributeMapping_attributeType = this.kommonitorImporterHelperService?.attributeMapping_attributeTypes?.[0];
    this.attributeMappings_adminView = [];
    this.keepAttributes = true;
    this.keepMissingValues = true;
    this.isPartialUpdate = false;
    this.enableDeleteFeatures = false;
    this.fileSelected = false;
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';

    // Hide alerts
    this.hideSuccessAlert();
    this.hideErrorAlert();
  }

  onChangeConverter(schema?: any): void {
    if (this.converter) {
      // Initialize defaults like in Add modal
      this.schema = this.converter.schemas ? this.converter.schemas[0] : '';
      this.mimeType = this.converter.mimeTypes ? this.converter.mimeTypes[0] : '';
      {
        converter: this.converter?.name,
        schema: this.schema,
        mimeType: this.mimeType
      });

      // Update available datasource types. If converter doesn't declare supported datasources,
      // fall back to all available types (matches Add modal behavior)
      const allDatasourceTypes = this.kommonitorImporterHelperService?.getAvailableDatasourceTypes() || [];
      const declared = (this.converter as any)?.datasources as string[] | undefined;
      if (Array.isArray(declared) && declared.length > 0) {
        this.availableDatasourceTypes = allDatasourceTypes.filter(dt => declared.includes(dt.type));
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
    
    if (this.datasourceType && this.datasourceType.type === "OGCAPI_FEATURES") {
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
    this.hideSuccessAlert();
    this.hideErrorAlert();
    
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
            this.kommonitorDataGridHelperService.registerFeatureTableClickHandlers(
              this.currentSpatialUnitDataset?.spatialUnitId,
              this.kommonitorDataGridHelperService.resourceType_spatialUnit,
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
      }
    });
  }

  clearAllSpatialUnitFeatures(): void {
    if (!this.currentSpatialUnitDataset) return;

    this.loadingData = true;
    this.hideSuccessAlert();
    this.hideErrorAlert();
    
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}/allFeatures`;

    this.http.delete(url).subscribe({
      next: (response: any) => {
        this.spatialUnitFeaturesGeoJSON = null;
        this.remainingFeatureHeaders = [];
        this.broadcastService.broadcast('refreshSpatialUnitOverviewTable', ['edit', this.currentSpatialUnitDataset.spatialUnitId]);
        
        // Clear the grid data
        this.spatialUnitFeaturesGeoJSON = null;
        this.remainingFeatureHeaders = [];
        this.buildFeatureTable();
        
        if (this.gridApi) {
          this.gridApi.setRowData([]);
        }
        
        this.successMessagePart = this.currentSpatialUnitDataset.spatialUnitLevel;
        this.showSuccessAlert();
        
        setTimeout(() => {
          this.loadingData = false;
        }, 500); // Increased timeout to show loading state longer
      },
      error: (error) => {
        this.handleError(error);
        setTimeout(() => {
          this.loadingData = false;
        }, 500); // Increased timeout to show loading state longer
      }
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

  private toIsoDateString(value: any): string | null {
    if (!value) {
      return null;
    }
    if (typeof value === 'string') {
      return value;
    }
    const maybeStruct = value as { year?: number; month?: number; day?: number };
    if (
      maybeStruct &&
      typeof maybeStruct.year === 'number' &&
      typeof maybeStruct.month === 'number' &&
      typeof maybeStruct.day === 'number'
    ) {
      const y = maybeStruct.year;
      const m = String(maybeStruct.month).padStart(2, '0');
      const d = String(maybeStruct.day).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return null;
  }

  private ensureValidDateOrToday(value: any): string {
    if (!value) {
      return this.getTodayDateString();
    }
    if (typeof value === 'string') {
      return this.isValidDateString(value) ? value : this.getTodayDateString();
    }
    const asIso = this.toIsoDateString(value);
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
    const tmpAttributeMapping = {
      sourceName: this.attributeMapping_sourceAttributeName,
      destinationName: this.attributeMapping_destinationAttributeName,
      dataType: this.attributeMapping_attributeType
    };

    let processed = false;
    for (let index = 0; index < this.attributeMappings_adminView.length; index++) {
      const attributeMappingEntry = this.attributeMappings_adminView[index];
      if (attributeMappingEntry.sourceName === tmpAttributeMapping.sourceName) {
        this.attributeMappings_adminView[index] = tmpAttributeMapping;
        processed = true;
        break;
      }
    }

    if (!processed) {
      this.attributeMappings_adminView.push(tmpAttributeMapping);
    }

    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMapping_attributeType = this.kommonitorImporterHelperService?.attributeMapping_attributeTypes?.[0];
  }

  onClickEditAttributeMapping(attributeMappingEntry: any): void {
    this.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
    this.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
    this.attributeMapping_attributeType = attributeMappingEntry.dataType;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any): void {
    for (let index = 0; index < this.attributeMappings_adminView.length; index++) {
      if (this.attributeMappings_adminView[index].sourceName === attributeMappingEntry.sourceName) {
        this.attributeMappings_adminView.splice(index, 1);
        break;
      }
    }
  }

  async buildImporterObjects(): Promise<boolean> {
    this.converterDefinition = this.buildConverterDefinition();
    this.datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    this.propertyMappingDefinition = this.buildPropertyMappingDefinition();
    this.putBody_spatialUnits = this.buildPutBody_spatialUnits();

    return !!(this.converterDefinition && this.datasourceTypeDefinition && this.propertyMappingDefinition && this.putBody_spatialUnits);
  }

  buildConverterDefinition(): any {
    return this.kommonitorImporterHelperService?.buildConverterDefinition(
      this.converter, 
      "converterParameter_spatialUnitEditFeatures_", 
      this.schema, 
      this.mimeType,
      this.converterParameters
    );
  }

  async buildDatasourceTypeDefinition(): Promise<any> {
    try {
      // Prefer robust Angular-native handling for FILE uploads (like Add modal)
      if (this.datasourceType?.type === 'FILE') {
        let file: File | undefined | null = this.selectedDataSourceFile;
        if (!file) {
          const inputEl = this.spatialUnitDataSourceInput?.nativeElement as HTMLInputElement | undefined;
          file = inputEl?.files?.[0];
        }
        if (!file) {
          return null;
        }
        const uploadedName = await this.kommonitorImporterHelperService.uploadNewFile(file, file.name);
        return {
          type: 'FILE',
          parameters: [
            { name: 'NAME', value: uploadedName }
          ]
        };
      }

      const formValues: { [key: string]: string } = { ...this.datasourceTypeParameters } as any;
      if (this.datasourceType && this.datasourceType.type === 'OGCAPI_FEATURES') {
        if (this.bboxType) {
          formValues['bboxType'] = this.bboxType;
          if (this.bboxType === 'ref' && this.bboxRefSpatialUnitLevel) {
            formValues['bboxRef'] = this.bboxRefSpatialUnitLevel;
          } else if (this.bboxType === 'literal') {
            formValues['bbox_minx'] = this.bbox_minx as any;
            formValues['bbox_miny'] = this.bbox_miny as any;
            formValues['bbox_maxx'] = this.bbox_maxx as any;
            formValues['bbox_maxy'] = this.bbox_maxy as any;
          }
        }
      }

      return await this.kommonitorImporterHelperService?.buildDatasourceTypeDefinition(
        this.datasourceType,
        'datasourceTypeParameter_spatialUnitEditFeatures_',
        'spatialUnitDataSourceInput_editFeatures',
        Object.keys(formValues).length ? formValues : undefined
      );
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  buildPropertyMappingDefinition(): any {
    return this.kommonitorImporterHelperService?.buildPropertyMapping_spatialResource(
      this.spatialUnitDataSourceNameProperty, 
      this.spatialUnitDataSourceIdProperty, 
      this.validityStartDate_perFeature, 
      this.validityEndDate_perFeature, 
      '', // empty string instead of undefined
      this.keepAttributes, 
      this.keepMissingValues, 
      this.attributeMappings_adminView
    );
  }

  buildPutBody_spatialUnits(): any {
    return {
      geoJsonString: "", // will be set by importer
      periodOfValidity: {
        endDate: this.periodOfValidity.endDate,
        startDate: this.periodOfValidity.startDate
      },
      isPartialUpdate: this.isPartialUpdate
    };
  }

  async editSpatialUnitFeatures(): Promise<void> {
    this.loadingData = true;
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';

    // Pre-validate like legacy component (show precise issues)
    const missing: string[] = [];
    if (!this.converter) {
      missing.push('Konverter');
    } else {
      if (Array.isArray(this.converter.schemas) && this.converter.schemas.length > 0 && !this.schema) {
        missing.push('Schema');
      }
      if (Array.isArray(this.converter.mimeTypes) && this.converter.mimeTypes.length > 0 && !this.mimeType) {
        missing.push('Quellformat');
      }
      if (Array.isArray(this.converter.parameters) && this.converter.parameters.length > 0) {
        for (const p of this.converter.parameters) {
          if (p.mandatory && (!this.converterParameters || !this.converterParameters[p.name])) {
            missing.push(`Konverter-Parameter '${p.name}'`);
          }
        }
      }
    }

    if (!this.datasourceType) {
      missing.push('Datenquelltyp');
    } else if (this.datasourceType.type === 'FILE') {
      let hasFile = this.fileSelected;
      const fileInputEl = this.spatialUnitDataSourceInput?.nativeElement as HTMLInputElement | undefined;
      if (!hasFile && fileInputEl && fileInputEl.files && fileInputEl.files.length > 0) {
        hasFile = true;
      }
      if (!hasFile) {
        const fallbackEl = document.getElementById('spatialUnitDataSourceInput_editFeatures') as HTMLInputElement | null;
        if (fallbackEl && fallbackEl.files && fallbackEl.files.length > 0) {
          hasFile = true;
        }
      }
      if (!hasFile) {
        missing.push('Datei');
      }
    } else if (this.datasourceType.type === 'OGCAPI_FEATURES') {
      if (!this.bboxType) {
        missing.push('Räumlicher Filter');
      } else if (this.bboxType === 'ref' && !this.bboxRefSpatialUnitLevel) {
        missing.push('Referenzraumebene für Begrenzungsrahmen');
      } else if (this.bboxType === 'literal') {
        if (this.bbox_minx === null || this.bbox_miny === null || this.bbox_maxx === null || this.bbox_maxy === null) {
          missing.push('Begrenzungsrahmen (minx, miny, maxx, maxy)');
        }
      }
      // Other datasourceType parameters
      if (Array.isArray(this.datasourceType.parameters) && this.datasourceType.parameters.length > 0) {
        for (const p of this.datasourceType.parameters) {
          if (p.name === 'bbox') { continue; }
          const v = this.datasourceTypeParameters ? this.datasourceTypeParameters[p.name] : undefined;
          if (p.mandatory && (v === undefined || v === null || v === '')) {
            missing.push(`Datenquelle-Parameter '${p.name}'`);
          }
        }
      }
    } else {
      // Generic datasourceType params
      if (Array.isArray(this.datasourceType.parameters) && this.datasourceType.parameters.length > 0) {
        for (const p of this.datasourceType.parameters) {
          const v = this.datasourceTypeParameters ? this.datasourceTypeParameters[p.name] : undefined;
          if (p.mandatory && (v === undefined || v === null || v === '')) {
            missing.push(`Datenquelle-Parameter '${p.name}'`);
          }
        }
      }
    }

    if (!this.spatialUnitDataSourceIdProperty) {
      missing.push('ID Attributname');
    }
    if (!this.spatialUnitDataSourceNameProperty) {
      missing.push('NAME Attributname');
    }
    if (!this.periodOfValidity.startDate) {
      missing.push("Gültig seit (Periodenbeginn)");
    }
    if (this.periodOfValidityInvalid) {
      missing.push('Gültigkeitszeitraum ist ungültig');
    }

    if (missing.length > 0) {
      
      this.loadingData = false;
      this.errorMessage = `Bitte füllen Sie alle Pflichtfelder in Schritt 2 aus. Fehlend: ${missing.join(', ')}.`;
      this.showErrorAlert();
      return;
    }

    const allDataSpecified = await this.buildImporterObjects();
    if (!allDataSpecified) {
      {
        converterDefinition: !!this.converterDefinition,
        datasourceTypeDefinition: !!this.datasourceTypeDefinition,
        propertyMappingDefinition: !!this.propertyMappingDefinition,
        putBody_spatialUnits: !!this.putBody_spatialUnits
      });
      this.loadingData = false;
      this.errorMessage = 'Bitte füllen Sie alle Pflichtfelder in Schritt 2 aus.';
      this.showErrorAlert();
      return;
    }

    try {
      {
        spatialUnitId: this.currentSpatialUnitDataset.spatialUnitId,
        converterDefinition: this.converterDefinition?.name,
        datasourceTypeDefinition: this.datasourceTypeDefinition?.type,
        hasPropertyMapping: !!this.propertyMappingDefinition,
        putBody: this.putBody_spatialUnits
      });
      const updateSpatialUnitResponse_dryRun = await this.kommonitorImporterHelperService?.updateSpatialUnit(
        this.converterDefinition, 
        this.datasourceTypeDefinition, 
        this.propertyMappingDefinition, 
        this.currentSpatialUnitDataset.spatialUnitId, 
        this.putBody_spatialUnits, 
        true
      );

      if (!this.kommonitorImporterHelperService?.importerResponseContainsErrors(updateSpatialUnitResponse_dryRun)) {
        const updateSpatialUnitResponse = await this.kommonitorImporterHelperService?.updateSpatialUnit(
          this.converterDefinition, 
          this.datasourceTypeDefinition, 
          this.propertyMappingDefinition, 
          this.currentSpatialUnitDataset.spatialUnitId, 
          this.putBody_spatialUnits, 
          false
        );

        this.successMessagePart = this.currentSpatialUnitDataset.spatialUnitLevel;
        this.broadcastService.broadcast('refreshSpatialUnitOverviewTable', ['edit', this.currentSpatialUnitDataset.spatialUnitId]);
        this.showSuccessAlert();
        this.loadingData = false;
      } else {
        this.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
        this.importerErrors = this.kommonitorImporterHelperService?.getErrorsFromImporterResponse(updateSpatialUnitResponse_dryRun) || [];
        this.showErrorAlert();
        this.loadingData = false;
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

  onMappingConfigFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.parseMappingConfigFromFile(file);
    }
  }

  parseMappingConfigFromFile(file: File): void {
    const fileReader = new FileReader();
    fileReader.onload = (event: any) => {
      try {
        this.parseFromMappingConfigFile(event);
      } catch (error) {
        this.spatialUnitMappingConfigImportError = 'Uploaded MappingConfig File cannot be parsed correctly';
        this.showMappingConfigErrorAlert();
      }
    };
    fileReader.readAsText(file);
  }

  parseFromMappingConfigFile(event: any): void {
    this.mappingConfigImportSettings = JSON.parse(event.target.result);

    // Use service method to validate import structure
    const validation = this.kommonitorDataExchangeService.validateMappingConfigImport(this.mappingConfigImportSettings);
    if (!validation.isValid) {
      this.spatialUnitMappingConfigImportError = validation.error || 'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      this.showMappingConfigErrorAlert();
      return;
    }

    // Set converter (use cached list to keep object identity stable)
    const converters = this.availableConverters;
    this.converter = converters?.find(
      (converter: any) => converter.name === this.mappingConfigImportSettings.converter.name
    );

    // Set schema and mimeType
    if (this.converter?.schemas && this.mappingConfigImportSettings.converter.schema) {
      this.schema = this.converter.schemas.find(
        (schema: string) => schema === this.mappingConfigImportSettings.converter.schema
      ) || '';
    }

    if (this.converter?.mimeTypes && this.mappingConfigImportSettings.converter.mimeType) {
      this.mimeType = this.converter.mimeTypes.find(
        (mimeType: string) => mimeType === this.mappingConfigImportSettings.converter.mimeType
      ) || '';
    }

    // Set datasource type
    const datasourceTypes = this.kommonitorImporterHelperService?.getAvailableDatasourceTypes();
    this.datasourceType = datasourceTypes?.find(
      (datasourceType: any) => datasourceType.type === this.mappingConfigImportSettings.dataSource.type
    );

    // Set property mapping
    this.spatialUnitDataSourceNameProperty = this.mappingConfigImportSettings.propertyMapping.nameProperty;
    this.spatialUnitDataSourceIdProperty = this.mappingConfigImportSettings.propertyMapping.identifierProperty;
    this.validityStartDate_perFeature = this.mappingConfigImportSettings.propertyMapping.validStartDateProperty;
    this.validityEndDate_perFeature = this.mappingConfigImportSettings.propertyMapping.validEndDateProperty;
    this.keepAttributes = this.mappingConfigImportSettings.propertyMapping.keepAttributes;
    this.keepMissingValues = this.mappingConfigImportSettings.propertyMapping.keepMissingOrNullValueAttributes;

    // Set attribute mappings
    this.attributeMappings_adminView = this.mappingConfigImportSettings.propertyMapping.attributes?.map((attr: any) => ({
      sourceName: attr.name,
      destinationName: attr.mappingName,
      dataType: this.kommonitorImporterHelperService?.attributeMapping_attributeTypes?.find(
        (dataType: any) => dataType.apiName === attr.type
      )
    })) || [];

    // Set period of validity
    if (this.mappingConfigImportSettings.periodOfValidity) {
      this.periodOfValidity = {
        startDate: this.mappingConfigImportSettings.periodOfValidity.startDate,
        endDate: this.mappingConfigImportSettings.periodOfValidity.endDate
      };
      this.checkPeriodOfValidity();
    }

    // Set converter parameters (e.g., CRS)
    this.converterParameters = {};
    if (this.mappingConfigImportSettings.converter?.parameters?.length) {
      for (const param of this.mappingConfigImportSettings.converter.parameters) {
        if (param?.name) {
          this.converterParameters[param.name] = param.value;
        }
      }
    }

    // Set datasource parameters for OGC API Features (bbox)
    if (this.datasourceType?.type === 'OGCAPI_FEATURES' && Array.isArray(this.mappingConfigImportSettings.dataSource?.parameters)) {
      const bboxParam = this.mappingConfigImportSettings.dataSource.parameters.find((p: any) => p?.name === 'bbox');
      if (bboxParam && typeof bboxParam.value === 'string') {
        const value = bboxParam.value;
        const parts = value.split(',').map((v: string) => v.trim());
        if (parts.length === 4 && parts.every((p: string) => p !== '')) {
          // literal bbox
          this.bboxType = 'literal';
          this.bbox_minx = parts[0];
          this.bbox_miny = parts[1];
          this.bbox_maxx = parts[2];
          this.bbox_maxy = parts[3];
        } else {
          // ref bbox (value is spatial unit level)
          this.bboxType = 'ref';
          this.bboxRefSpatialUnitLevel = value;
        }
      }
    }

    // Populate datasource type generic parameters
    this.datasourceTypeParameters = {};
    const params = this.mappingConfigImportSettings?.dataSource?.parameters || [];
    for (const p of params) {
      if (p?.name && p.name !== 'bbox' && p.name !== 'bboxType') {
        this.datasourceTypeParameters[p.name] = p.value;
      }
    }
  }

  async onExportSpatialUnitEditFeaturesMappingConfig(): Promise<void> {
    const converterDefinition = this.buildConverterDefinition();
    const datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    const propertyMappingDefinition = this.buildPropertyMappingDefinition();

    // Use service method to build export structure
    const mappingConfigExport = this.kommonitorDataExchangeService.buildMappingConfigExport(
      converterDefinition,
      datasourceTypeDefinition,
      propertyMappingDefinition,
      this.periodOfValidity
    );

    const fileName = `KomMonitor-Import-Mapping-Konfiguration_Export-${this.currentSpatialUnitDataset?.spatialUnitLevel || 'SpatialUnit'}.json`;
    const metadataJSON = JSON.stringify(mappingConfigExport);
    const blob = new Blob([metadataJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.download = fileName;
    a.href = url;
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  onChangeEnableDeleteFeatures(): void {
    // Rebuild the grid with updated delete settings
    this.buildFeatureTable();

    // Update grid column definitions and data if API is available
    if (this.gridApi && this.columnDefs?.length) {
      // Update column definitions
      this.gridApi.setColumnDefs(this.columnDefs);
      
      // Update data if we have features
      if (this.spatialUnitFeaturesGeoJSON?.features) {
        // Use service method to transform data for grid display
        const transformedData = this.kommonitorDataExchangeService.transformFeaturesForGrid(
          this.spatialUnitFeaturesGeoJSON.features
        );
        this.rowData = transformedData;
        this.gridApi.setRowData(this.rowData);
      }
      
      // Force refresh of the grid to show/hide delete buttons
      this.gridApi.refreshCells();
      
      // Register click handlers after grid update
      setTimeout(() => {
        this.kommonitorDataGridHelperService.registerFeatureTableClickHandlers(
          this.currentSpatialUnitDataset?.spatialUnitId,
          this.kommonitorDataGridHelperService.resourceType_spatialUnit,
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

  // Navigation methods
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  // AG Grid event handlers
  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    
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
      this.gridApi.setHeaderHeight(headerHeight);
    }
  }

  private headerHeightGetter(): number {
    const headerElement = document.querySelector('.ag-header');
    if (headerElement) {
      const headerTextElements = headerElement.querySelectorAll('.ag-header-cell-text');
      let maxHeight = 0;
      headerTextElements.forEach(element => {
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
      this.kommonitorDataGridHelperService.registerFeatureTableClickHandlers(
        this.currentSpatialUnitDataset?.spatialUnitId,
        this.kommonitorDataGridHelperService.resourceType_spatialUnit,
        this.enableDeleteFeatures
      );
    }, 100);
  }

  private updateGridWithData(): void {
    if (!this.gridApi) {
      return;
    }

    // Update column definitions
    if (this.columnDefs?.length) {
      this.gridApi.setColumnDefs(this.columnDefs);
    }

    // Transform and set data
    const transformedData = this.kommonitorDataExchangeService.transformFeaturesForGrid(
      this.spatialUnitFeaturesGeoJSON?.features || []
    );
    
    this.rowData = transformedData;
    this.gridApi.setRowData(this.rowData);
    this.gridApi.refreshCells();
    this.gridApi.redrawRows();
    
    // Force refresh of pagination and filtering
    this.gridApi.paginationGoToPage(0);
    this.gridApi.refreshHeader();
  }

  onFirstDataRendered(event: FirstDataRenderedEvent): void {
    // Handle first data rendered event
  }

  onColumnResized(event: ColumnResizedEvent): void {
    // Handle column resize event
  }

  onCellValueChanged(event: any): void {
    // Handle cell value changes - this will be called by the grid
    
    // The actual API call and visual feedback is handled in the data grid helper service
    // This method can be used for additional component-specific logic if needed
  }

  // Alert methods
  showSuccessAlert(): void {
    this.successMessage = 'Operation completed successfully';
    setTimeout(() => this.hideSuccessAlert(), 5000);
  }

  hideSuccessAlert(): void {
    this.successMessage = '';
  }

  showErrorAlert(): void {
    setTimeout(() => this.hideErrorAlert(), 10000);
  }

  hideErrorAlert(): void {
    this.errorMessage = '';
    this.errorMessagePart = '';
  }

  showMappingConfigErrorAlert(): void {
    setTimeout(() => this.hideMappingConfigErrorAlert(), 10000);
  }

  hideMappingConfigErrorAlert(): void {
    this.spatialUnitMappingConfigImportError = '';
  }

  private handleError(error: any): void {
    if (error.data) {
      this.errorMessagePart = this.kommonitorDataExchangeService?.syntaxHighlightJSON(error.data) || 'An error occurred';
    } else {
      this.errorMessagePart = this.kommonitorDataExchangeService?.syntaxHighlightJSON(error) || 'An error occurred';
    }
    this.showErrorAlert();
  }

  // Modal control methods
  closeModal(): void {
    this.activeModal.dismiss();
  }

  saveAndClose(): void {
    this.activeModal.close();
  }
} 