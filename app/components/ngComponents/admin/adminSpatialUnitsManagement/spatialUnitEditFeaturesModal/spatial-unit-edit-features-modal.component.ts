import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
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
  availableSpatialUnits: any[] = [];

  // Bbox parameters for OGCAPI_FEATURES
  bboxType: string = '';
  bboxRefSpatialUnit: any = null;

  // Feature table settings
  enableDeleteFeatures = false;

  // Import/Export functionality
  mappingConfigImportSettings: any = null;

  // Grid options for feature table
  featureTableGridOptions: GridOptions = {};
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    @Inject('kommonitorImporterHelperService') public kommonitorImporterHelperService: any,
    public kommonitorDataGridHelperService: KommonitorDataGridHelperService,
    @Inject('kommonitorMultiStepFormHelperService') private kommonitorMultiStepFormHelperService: any,
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) {
    console.log('SpatialUnitEditFeaturesModalComponent constructor initialized');
  }

  ngOnInit(): void {
    this.initializeDatePickers();
    this.initializeForm();
    this.setupEventListeners();
    this.loadAvailableOptions();
    this.buildFeatureTable();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeDatePickers(): void {
    // Initialize date pickers
    setTimeout(() => {
      if (this.kommonitorDataExchangeService?.datePickerOptions) {
        $('#spatialUnitEditFeaturesDatepickerStart').datepicker(this.kommonitorDataExchangeService.datePickerOptions);
        $('#spatialUnitEditFeaturesDatepickerEnd').datepicker(this.kommonitorDataExchangeService.datePickerOptions);
      }
    }, 100);
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
          this.broadcastService.broadcast('refreshSpatialUnitOverviewTable', ['edit', this.currentSpatialUnitDataset?.spatialUnitId]);
          this.refreshSpatialUnitEditFeaturesOverviewTable();
        }
      }
    });

    this.subscriptions.push(broadcastSubscription);
  }

  private loadAvailableOptions(): void {
    if (this.kommonitorImporterHelperService?.availableConverters) {
      this.availableDatasourceTypes = this.kommonitorImporterHelperService.availableConverters
        .filter((converter: any) => converter.type === 'spatialUnit');
    }
  }

  private buildFeatureTable(): void {
    this.featureTableGridOptions = this.kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource(
      "spatialUnitFeatureTable", 
      [], 
      []
    );
  }

  onEditSpatialUnitFeatures(spatialUnitDataset: any): void {
    this.kommonitorMultiStepFormHelperService?.registerClickHandler();

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
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';

    // Hide alerts
    this.hideSuccessAlert();
    this.hideErrorAlert();
  }

  onChangeConverter(schema?: any): void {
    this.schema = this.converter?.schemas ? this.converter.schemas[0] : '';
    this.mimeType = this.converter?.mimeTypes ? this.converter.mimeTypes[0] : '';
  }

  onChangeMimeType(mimeType: any): void {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any): void {
    if (this.datasourceType && this.datasourceType.type === "OGCAPI_FEATURES") {
      this.availableSpatialUnits = this.kommonitorDataExchangeService?.availableSpatialUnits_map ? 
        [...this.kommonitorDataExchangeService.availableSpatialUnits_map.values()] : [];
    }
  }

  refreshSpatialUnitEditFeaturesOverviewTable(): void {
    if (!this.currentSpatialUnitDataset) return;

    this.loadingData = true;
    const url = `${this.kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}/allFeatures`;

    this.http.get(url).subscribe({
      next: (response: any) => {
        this.spatialUnitFeaturesGeoJSON = response;
        const tmpRemainingHeaders: string[] = [];

        if (this.spatialUnitFeaturesGeoJSON?.features?.[0]?.properties) {
          for (const property in this.spatialUnitFeaturesGeoJSON.features[0].properties) {
            if (property !== __env.FEATURE_ID_PROPERTY_NAME && 
                property !== __env.FEATURE_NAME_PROPERTY_NAME && 
                property !== __env.VALID_START_DATE_PROPERTY_NAME && 
                property !== __env.VALID_END_DATE_PROPERTY_NAME) {
              tmpRemainingHeaders.push(property);
            }
          }
        }

        this.remainingFeatureHeaders = tmpRemainingHeaders;
        this.featureTableGridOptions = this.kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource(
          "spatialUnitFeatureTable", 
          tmpRemainingHeaders, 
          this.spatialUnitFeaturesGeoJSON.features, 
          this.currentSpatialUnitDataset.spatialUnitId, 
          this.kommonitorDataGridHelperService.resourceType_spatialUnit, 
          this.enableDeleteFeatures
        );

        this.loadingData = false;
      },
      error: (error) => {
        this.handleError(error);
        this.loadingData = false;
      }
    });
  }

  clearAllSpatialUnitFeatures(): void {
    if (!this.currentSpatialUnitDataset) return;

    this.loadingData = true;
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}/allFeatures`;

    this.http.delete(url).subscribe({
      next: (response: any) => {
        this.spatialUnitFeaturesGeoJSON = null;
        this.remainingFeatureHeaders = [];
        this.broadcastService.broadcast('refreshSpatialUnitOverviewTable', ['edit', this.currentSpatialUnitDataset.spatialUnitId]);
        this.featureTableGridOptions = this.kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource("spatialUnitFeatureTable", [], []);
        this.successMessagePart = this.currentSpatialUnitDataset.spatialUnitLevel;
        this.showSuccessAlert();
        this.loadingData = false;
      },
      error: (error) => {
        this.handleError(error);
        this.loadingData = false;
      }
    });
  }

  checkPeriodOfValidity(): void {
    this.periodOfValidityInvalid = false;
    if (this.periodOfValidity.startDate && this.periodOfValidity.endDate) {
      const startDate = new Date(this.periodOfValidity.startDate);
      const endDate = new Date(this.periodOfValidity.endDate);

      if (startDate === endDate || startDate > endDate) {
        this.periodOfValidityInvalid = true;
      }
    }
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
      this.mimeType
    );
  }

  async buildDatasourceTypeDefinition(): Promise<any> {
    try {
      return await this.kommonitorImporterHelperService?.buildDatasourceTypeDefinition(
        this.datasourceType, 
        'datasourceTypeParameter_spatialUnitEditFeatures_', 
        'spatialUnitDataSourceInput_editFeatures'
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
      undefined, 
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

    const allDataSpecified = await this.buildImporterObjects();
    if (!allDataSpecified) {
      this.loadingData = false;
      return;
    }

    try {
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
        console.error('Uploaded MappingConfig File cannot be parsed.', error);
        this.spatialUnitMappingConfigImportError = 'Uploaded MappingConfig File cannot be parsed correctly';
        this.showMappingConfigErrorAlert();
      }
    };
    fileReader.readAsText(file);
  }

  parseFromMappingConfigFile(event: any): void {
    this.mappingConfigImportSettings = JSON.parse(event.target.result);

    if (!this.mappingConfigImportSettings.converter || 
        !this.mappingConfigImportSettings.dataSource || 
        !this.mappingConfigImportSettings.propertyMapping) {
      this.spatialUnitMappingConfigImportError = 'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      this.showMappingConfigErrorAlert();
      return;
    }

    // Set converter
    this.converter = this.kommonitorImporterHelperService?.availableConverters?.find(
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
    this.datasourceType = this.kommonitorImporterHelperService?.availableDatasourceTypes?.find(
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
  }

  async onExportSpatialUnitEditFeaturesMappingConfig(): Promise<void> {
    const converterDefinition = this.buildConverterDefinition();
    const datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    const propertyMappingDefinition = this.buildPropertyMappingDefinition();

    const mappingConfigExport = {
      converter: converterDefinition,
      dataSource: datasourceTypeDefinition,
      propertyMapping: propertyMappingDefinition,
      periodOfValidity: this.periodOfValidity
    };

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
    const buttons = document.querySelectorAll('.spatialUnitDeleteFeatureRecordBtn');
    buttons.forEach((button: any) => {
      button.disabled = !this.enableDeleteFeatures;
    });
  }

  filterByKomMonitorProperties(): (item: string) => boolean {
    return (item: string) => {
      try {
        return item !== __env.FEATURE_ID_PROPERTY_NAME && 
               item !== __env.FEATURE_NAME_PROPERTY_NAME && 
               item !== 'validStartDate' && 
               item !== 'validEndDate';
      } catch (error) {
        return false;
      }
    };
  }

  getFeatureId(geojsonFeature: any): string {
    return geojsonFeature.properties?.[__env.FEATURE_ID_PROPERTY_NAME] || '';
  }

  getFeatureName(geojsonFeature: any): string {
    return geojsonFeature.properties?.[__env.FEATURE_NAME_PROPERTY_NAME] || '';
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
  }

  onFirstDataRendered(event: FirstDataRenderedEvent): void {
    // Handle first data rendered event
  }

  onColumnResized(event: ColumnResizedEvent): void {
    // Handle column resize event
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
    console.error('Error occurred:', error);
    if (error.data) {
      this.errorMessagePart = this.kommonitorDataExchangeService?.syntaxHighlightJSON(error.data) || 'An error occurred';
    } else {
      this.errorMessagePart = this.kommonitorDataExchangeService?.syntaxHighlightJSON(error) || 'An error occurred';
    }
    this.showErrorAlert();
  }

  // Modal control methods
  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }

  saveAndClose(): void {
    this.activeModal.close({ action: 'updated' });
  }
} 