import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Inject, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { KmDatePickerComponent } from '../../../customElements/date-picker/km-date-picker.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi, ColumnApi, GridReadyEvent, FirstDataRenderedEvent, ColumnResizedEvent } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { ajskommonitorSingleFeatureMapHelperServiceProvider } from '../../../../../app-upgraded-providers';
import { KommonitorGeoresourceDataExchangeService } from 'services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { KommonitorImporterHelperService } from 'services/adminGeoresourceUnit/kommonitor-importer-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from 'services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';
import { KommonitorMultiStepFormHelperService } from 'services/adminGeoresourceUnit/kommonitor-multi-step-form-helper.service';
import { SingleFeatureEditComponent } from '../../../common/single-feature-edit/single-feature-edit.component';

declare const $: any;
declare const __env: any;

// Removed ng-bootstrap date adapters and formatters in favor of km-date-picker

@Component({
  selector: 'georesource-edit-features-modal-new',
  templateUrl: './georesource-edit-features-modal.component.html',
  styleUrls: ['./georesource-edit-features-modal.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, SingleFeatureEditComponent, AgGridModule, NgbDatepickerModule, KmDatePickerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: []
})
export class GeoresourceEditFeaturesModalComponent implements OnInit, OnDestroy {
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('dataSourceInput', { static: false }) dataSourceInput!: ElementRef;
  @ViewChild('georesourceFeatureTable', { static: true }) georesourceFeatureTable!: AgGridAngular;

  // Component state
  loadingData = false;
  private _currentGeoresourceDataset: any;
  currentStep = 1;

  get currentGeoresourceDataset(): any {
    return this._currentGeoresourceDataset;
  }

  set currentGeoresourceDataset(value: any) {
    this._currentGeoresourceDataset = value;
    
    // If we have valid data and the view is initialized, refresh the table
    if (value && value.georesourceId && this.featureTableGridOptions) {
      // Defer to next tick to avoid change detection errors
      setTimeout(() => {
        this.refreshGeoresourceEditFeaturesOverviewTable();
        // Mark for check after model update
        this.cdr.detectChanges();
      }, 0);
    }
  }

  // Feature management
  enableDeleteFeatures = false;
  georesourceFeaturesGeoJSON: any;
  remainingFeatureHeaders: any[] = [];
  
  // AG-Grid configuration
  featureTableGridOptions: GridOptions = {};
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;

  // Single feature variables
  featureIdValue: any = 0;
  featureIdExampleString: string = '';
  featureIdIsValid = false;
  featureNameValue: string = '';
  featureGeometryValue: any;
  featureStartDateValue: string = '';
  featureEndDateValue: string = '';
  featureSchemaProperties: any[] = [];
  schemaObject: any;
  featureInfoText_singleFeatureAddMenu: string = '';

  // Multiple feature import variables
  periodOfValidity: any = {
    startDate: '',
    endDate: ''
  };
  periodOfValidityInvalid = false;

  // Data source variables
  georesourceDataSourceInputInvalid = false;
  georesourceDataSourceInputInvalidReason: string = '';
  georesourceDataSourceIdProperty: string = '';
  georesourceDataSourceNameProperty: string = '';
  selectedDataSourceFile: File | null = null;
  selectedDataSourceFileName: string = '';
  idPropertyNotFound = false;
  namePropertyNotFound = false;

  // Import configuration
  converter: any;
  schema: string = '';
  mimeType: string = '';
  datasourceType: any;
  
  // Available options
  availableDatasourceTypes: any[] = [];
  availableSpatialUnits: any[] = [];

  // Converter parameters
  converterDefinition: any;
  datasourceTypeDefinition: any;
  propertyMappingDefinition: any;
  putBody_georesources: any;

  // Validity date attributes
  validityEndDate_perFeature: string = '';
  validityStartDate_perFeature: string = '';

  // Attribute mapping
  attributeMapping_sourceAttributeName: string = '';
  attributeMapping_destinationAttributeName: string = '';
  attributeMapping_data: any;
  attributeMapping_attributeType: any;
  attributeMappings_adminView: any[] = [];
  keepAttributes = true;
  keepMissingValues = true;

  // BBOX configuration
  bboxType: string = '';
  bboxRefSpatialUnit: any;

  // Partial update
  isPartialUpdate = false;

  // Success/Error messages
  successMessagePart: string = '';
  errorMessagePart: string = '';
  importerErrors: any;
  importedFeatures: any[] = [];

  // Mapping config import/export
  georesourceMappingConfigImportError: string = '';
  georesourceMappingConfigStructure_pretty: string = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    public kommonitorDataExchangeService: KommonitorGeoresourceDataExchangeService,
    public kommonitorMultiStepFormHelperService: KommonitorMultiStepFormHelperService,
    public kommonitorDataGridHelperService: KommonitorGeoresourceDataGridHelperService,
    public kommonitorImporterHelperService: KommonitorImporterHelperService,
    @Inject(ajskommonitorSingleFeatureMapHelperServiceProvider.provide) private kommonitorSingleFeatureMapHelperService: any,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeDefaultValues();
  }

  // Date helpers (ISO YYYY-MM-DD)
  private getTodayDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private isValidDateString(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) { return false; }
    const [yStr, mStr, dStr] = value.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    if (m < 1 || m > 12 || d < 1 || d > 31) { return false; }
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  private ensureValidDateOrToday(value: any): string {
    if (!value) { return this.getTodayDateString(); }
    if (typeof value === 'string') {
      return this.isValidDateString(value) ? value : this.getTodayDateString();
    }
    const asIso = this.toIsoDateString(value);
    return asIso ?? this.getTodayDateString();
  }

  private toIsoDateString(value: any): string | null {
    if (!value) { return null; }
    if (typeof value === 'string') { return value; }
    const maybeStruct = value as { year?: number; month?: number; day?: number };
    if (maybeStruct && typeof maybeStruct.year === 'number' && typeof maybeStruct.month === 'number' && typeof maybeStruct.day === 'number') {
      const y = maybeStruct.year;
      const m = String(maybeStruct.month).padStart(2, '0');
      const d = String(maybeStruct.day).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return null;
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

  ngOnInit(): void {
    this.initializeDatePickers();
    this.setupEventListeners();
    this.initializeMappingConfigStructure();
    this.buildFeatureTable();
  }

  ngAfterViewInit(): void {
    // Defer to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      if (this.currentGeoresourceDataset && this.currentGeoresourceDataset.georesourceId) {
        this.refreshGeoresourceEditFeaturesOverviewTable();
      }
    }, 0);
    // Stabilize view after initial async scheduling
    Promise.resolve().then(() => this.cdr.detectChanges());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.kommonitorSingleFeatureMapHelperService.invalidateMap();
  }

  private initializeDefaultValues(): void {
    this.attributeMapping_attributeType = this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
    this.availableDatasourceTypes = this.kommonitorImporterHelperService.availableDatasourceTypes;
    this.availableSpatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits;
  }

  private initializeMappingConfigStructure(): void {
    this.georesourceMappingConfigStructure_pretty = this.kommonitorDataExchangeService.syntaxHighlightJSON(
      this.kommonitorImporterHelperService.mappingConfigStructure
    );
  }

  private initializeDatePickers(): void {
    setTimeout(() => {
      try {
        if ((window as any).$) {
          (window as any).$('#georesourceSingleFeatureDatepickerStart').datepicker(
            this.kommonitorDataExchangeService.datePickerOptions
          );
          (window as any).$('#georesourceSingleFeatureDatepickerEnd').datepicker(
            this.kommonitorDataExchangeService.datePickerOptions
          );
        }
      } catch (error) {
        // Date picker initialization failed
      }
    }, 250);
  }

  private setupEventListeners(): void {
    // Setup broadcast listeners
    const broadcastSubscription = this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      if (broadcastMsg) {
        if (broadcastMsg.msg === 'onEditGeoresourceFeatures') {
          // Defer handling to avoid changing bound values mid-cycle
          setTimeout(() => { this.onEditGeoresourceFeatures(broadcastMsg.values); }, 0);
        } else if (broadcastMsg.msg === 'showLoadingIcon_' + this.kommonitorDataGridHelperService?.resourceType_georesource) {
          setTimeout(() => { this.loadingData = true; }, 0);
        } else if (broadcastMsg.msg === 'hideLoadingIcon_' + this.kommonitorDataGridHelperService?.resourceType_georesource) {
          setTimeout(() => { this.loadingData = false; }, 0);
        } else if (broadcastMsg.msg === 'onDeleteFeatureEntry_' + this.kommonitorDataGridHelperService?.resourceType_georesource) {
          this.broadcastService.broadcast('refreshGeoresourceOverviewTable', { crudType: 'edit', targetGeoresourceId: this.currentGeoresourceDataset?.georesourceId });
          setTimeout(() => { this.refreshGeoresourceEditFeaturesOverviewTable(); }, 0);
        } else if (broadcastMsg.msg === 'onUpdateSingleFeatureGeometry') {
          this.onUpdateSingleFeatureGeometry(broadcastMsg.values);
        }
      }
    });

    this.subscriptions.push(broadcastSubscription);
  }

  // File handling for FILE datasource (align with Add modal)
  onGeoresourceFileSelected(event: any): void {
    const file = event?.target?.files?.[0] as File | undefined;
    this.selectedDataSourceFile = file ?? null;
    this.selectedDataSourceFileName = this.selectedDataSourceFile?.name || '';
    try { this.cdr.detectChanges(); } catch {}
  }

  onEditGeoresourceFeatures(georesourceDataset: any): void {
    this.kommonitorMultiStepFormHelperService?.registerClickHandler();

    // Ensure we have valid data
    if (!georesourceDataset || !georesourceDataset.georesourceId) {
      return;
    }

    if (this.currentGeoresourceDataset && 
        this.currentGeoresourceDataset.datasetName === georesourceDataset.datasetName) {
      return;
    }

    this.currentGeoresourceDataset = georesourceDataset;
    
    this.resetGeoresourceEditFeaturesForm();
    this.buildFeatureTable();
    
    // Load the georesource features immediately
    this.refreshGeoresourceEditFeaturesOverviewTable();
  }

  // Single feature import methods
  async initSingleFeatureAddMenu(): Promise<void> {
    if (!this.currentGeoresourceDataset) return;

    // If we're in Step 2, broadcast to the single-feature-edit component
    if (this.currentStep === 2) {
      // SingleFeatureEditComponent expects an array [georesourceDataset, isReachabilityDatasetOnly]
      this.broadcastService.broadcast('onEditGeoresourceFeatures', [this.currentGeoresourceDataset, false]);
      return; // Let the single-feature-edit component handle the rest
    }

    // Initialize map for single feature import
    const domId = "singleFeatureGeoMap";
    let resourceType = this.kommonitorSingleFeatureMapHelperService.resourceType_point;
    
    if (this.currentGeoresourceDataset.isLOI) {
      resourceType = this.kommonitorSingleFeatureMapHelperService.resourceType_line;
    } else if (this.currentGeoresourceDataset.isAOI) {
      resourceType = this.kommonitorSingleFeatureMapHelperService.resourceType_polygon;
    }
    
    this.kommonitorSingleFeatureMapHelperService.initSingleFeatureGeoMap(domId, resourceType);

    // Initialize feature schema
    await this.initFeatureSchema();

    // Load existing features and add to map
    try {
      const response = await this.http.get(
        `${this.kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/georesources/${this.currentGeoresourceDataset.georesourceId}/allFeatures`
      ).toPromise();

      this.georesourceFeaturesGeoJSON = response;
      
      if (this.georesourceFeaturesGeoJSON?.features) {
        this.kommonitorSingleFeatureMapHelperService.addDataLayertoSingleFeatureGeoMap(this.georesourceFeaturesGeoJSON);
        
        this.featureInfoText_singleFeatureAddMenu = `${this.georesourceFeaturesGeoJSON.features.length} weitere Features im Datensatz vorhanden`;
        
        // Generate ID proposal
        this.featureIdValue = this.generateIdProposalFromExistingFeatures();
        this.addExampleValuesToSchemaProperties();
      } else {
        this.featureInfoText_singleFeatureAddMenu = "Keine weiteren Features im Datensatz vorhanden";
      }
    } catch (error) {
      this.featureInfoText_singleFeatureAddMenu = "Fehler bei Abruf der Features";
    }

    // Validate the generated ID
    this.validateSingleFeatureId();
  }

  private async initFeatureSchema(): Promise<void> {
    if (!this.currentGeoresourceDataset) return;

    if (!this.currentGeoresourceDataset.georesourceId) {
      return;
    }

    try {
      const schemaResult = await this.initFeatureSchemaDirectly(
        this.currentGeoresourceDataset.georesourceId
      );

      if (schemaResult) {
        this.schemaObject = schemaResult.schemaObject;
        this.featureSchemaProperties = schemaResult.featureSchemaProperties;
      }
    } catch (error) {
      // Error initializing feature schema
    }
  }

  private async initFeatureSchemaDirectly(georesourceId: string): Promise<{ schemaObject: any; featureSchemaProperties: any[] }> {
    try {
      const response = await this.http.get(
        `${this.kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/georesources/${georesourceId}/schema`
      ).toPromise();
      
      const schemaObject = response as any;
      const featureSchemaProperties: any[] = [];
      
      // Environment constants (these should match your environment configuration)
      const FEATURE_ID_PROPERTY_NAME = 'ID';
      const FEATURE_NAME_PROPERTY_NAME = 'NAME';
      const VALID_START_DATE_PROPERTY_NAME = 'validStartDate';
      const VALID_END_DATE_PROPERTY_NAME = 'validEndDate';
      
      for (const property in schemaObject) {
        if (property !== FEATURE_ID_PROPERTY_NAME && 
            property !== FEATURE_NAME_PROPERTY_NAME && 
            property !== VALID_START_DATE_PROPERTY_NAME && 
            property !== VALID_END_DATE_PROPERTY_NAME) {
          featureSchemaProperties.push({
            property: property,
            value: undefined
          });
        }
      }

      return { schemaObject, featureSchemaProperties };
    } catch (error) {
      throw error;
    }
  }

  private generateIdProposalFromExistingFeatures(): any {
    if (!this.georesourceFeaturesGeoJSON?.features || !this.schemaObject) {
      return 0;
    }

    const idDataType = this.schemaObject['ID']; // Using the constant from initFeatureSchemaDirectly
    const existingFeatureIds = this.georesourceFeaturesGeoJSON.features
      .map((feature: any) => feature.properties?.['ID'])
      .filter((id: any) => id !== undefined && id !== null);

    if (existingFeatureIds.length > 0) {
      const length = existingFeatureIds.length;
      this.featureIdExampleString = `${existingFeatureIds[0]}; ${existingFeatureIds[Math.round(length/2)]}; ${existingFeatureIds[length - 1]}`;
    }

    return this.generateIdProposalFromExistingFeaturesDirectly(
      existingFeatureIds,
      idDataType
    );
  }

  private generateIdProposalFromExistingFeaturesDirectly(existingFeatureIds: any[], idDataType: string): any {
    if (existingFeatureIds.length === 0) {
      return idDataType === 'Integer' || idDataType === 'Double' ? 1 : this.generateUUID();
    }

    if (idDataType === 'Integer' || idDataType === 'Double') {
      const maxValue = Math.max(...existingFeatureIds);
      return maxValue + 1;
    } else {
      return this.generateUUID();
    }
  }

  private generateUUID(): string {
    // Simple UUID generation - you might want to use a proper UUID library
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private addExampleValuesToSchemaProperties(): void {
    if (this.georesourceFeaturesGeoJSON?.features?.[0] && this.featureSchemaProperties) {
      const exampleFeature = this.georesourceFeaturesGeoJSON.features[0];
      this.addExampleValuesToSchemaPropertiesDirectly(
        this.featureSchemaProperties,
        exampleFeature
      );
    }
  }

  private addExampleValuesToSchemaPropertiesDirectly(featureSchemaProperties: any[], exampleFeature: any): void {
    for (const element of featureSchemaProperties) {
      element.exampleValue = exampleFeature.properties[element.property];
    }
  }

  private validateSingleFeatureId(): void {
    if (!this.georesourceFeaturesGeoJSON?.features || !this.featureIdValue) {
      this.featureIdIsValid = false;
      return;
    }

    this.featureIdIsValid = this.validateSingleFeatureIdDirectly(
      this.featureIdValue,
      this.georesourceFeaturesGeoJSON.features
    );
  }

  private validateSingleFeatureIdDirectly(featureIdValue: any, features: any[]): boolean {
    if (!features || !featureIdValue) {
      return featureIdValue !== undefined && featureIdValue !== null;
    }

    const filteredFeatures = features.filter(
      (feature: any) => feature.properties?.['ID'] === featureIdValue
    );

    return filteredFeatures.length === 0;
  }

  onUpdateSingleFeatureGeometry(geoJSONOrArray: any): void {
    const geoJSON = Array.isArray(geoJSONOrArray) ? geoJSONOrArray[0] : geoJSONOrArray;
    this.featureGeometryValue = geoJSON;
  }

  async addSingleGeoresourceFeature(): Promise<void> {
    if (!this.currentGeoresourceDataset || !this.featureGeometryValue) {
      return;
    }

    this.loadingData = true;
    this.importerErrors = null;
    this.successMessagePart = '';
    this.errorMessagePart = '';

    try {
      // Build importer objects for single feature import
      const allDataSpecified = await this.buildImporterObjects_singleFeatureImport();
      
      if (!allDataSpecified) {
        this.loadingData = false;
        return;
      }

      // Perform dry run first
      const updateGeoresourceResponse_dryRun = await this.kommonitorImporterHelperService.updateGeoresource(
        this.converterDefinition,
        this.datasourceTypeDefinition,
        this.propertyMappingDefinition,
        this.currentGeoresourceDataset.georesourceId,
        this.putBody_georesources,
        true
      );

      if (!this.kommonitorImporterHelperService.importerResponseContainsErrors(updateGeoresourceResponse_dryRun)) {
        // Execute the actual import
        const updateGeoresourceResponse = await this.kommonitorImporterHelperService.updateGeoresource(
          this.converterDefinition,
          this.datasourceTypeDefinition,
          this.propertyMappingDefinition,
          this.currentGeoresourceDataset.georesourceId,
          this.putBody_georesources,
          false
        );

        // Handle success
        this.broadcastService.broadcast('refreshGeoresourceOverviewTable', { 
          crudType: 'edit', 
          targetGeoresourceId: this.currentGeoresourceDataset.georesourceId 
        });
        
        this.refreshGeoresourceEditFeaturesOverviewTable();
        this.initSingleFeatureAddMenu();

        this.successMessagePart = this.currentGeoresourceDataset.datasetName;
        this.importedFeatures = this.kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(updateGeoresourceResponse);

        // Prevent duplicate import
        this.featureIdIsValid = false;

        // Add new feature to current dataset
        if (this.georesourceFeaturesGeoJSON) {
          this.georesourceFeaturesGeoJSON.features.push(this.featureGeometryValue.features[0]);
        } else {
          this.georesourceFeaturesGeoJSON = {
            type: 'FeatureCollection',
            features: [this.featureGeometryValue.features[0]]
          };
        }

        this.showSuccessAlert();
        this.loadingData = false;
      } else {
        // Handle errors
        this.errorMessagePart = "Das zu importierende Feature des Datensatzes weist kritische Fehler auf";
        this.importerErrors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(updateGeoresourceResponse_dryRun);
        this.showErrorAlert();
        this.loadingData = false;
      }
    } catch (error) {
      this.handleError(error);
      this.loadingData = false;
    }
  }

  private async buildImporterObjects_singleFeatureImport(): Promise<boolean> {
    this.converterDefinition = this.getSingleFeatureConverterDefinition();
    
    const singleFeatureObjects = this.buildSingleFeatureImportObjects(
      this.featureGeometryValue,
      this.featureIdValue,
      this.featureNameValue || '',
      this.featureStartDateValue || '',
      this.featureEndDateValue || '',
      this.featureSchemaProperties
    );
    
    this.datasourceTypeDefinition = singleFeatureObjects.datasourceDefinition;
    this.propertyMappingDefinition = singleFeatureObjects.propertyMappingDefinition;

    // Build put body
    const scopeProperties = {
      periodOfValidity: {
        endDate: this.featureEndDateValue || '',
        startDate: this.featureStartDateValue || ''
      },
      isPartialUpdate: true
    };
    
    this.putBody_georesources = this.kommonitorImporterHelperService.buildPutBody_georesources(scopeProperties);

    return !!(this.converterDefinition && this.datasourceTypeDefinition && this.propertyMappingDefinition && this.putBody_georesources);
  }

  // Step navigation
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
      
      // Initialize Step 2 if moving to it
      if (this.currentStep === 2) {
        this.initSingleFeatureAddMenu();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 3) {
      this.currentStep = step;
      
      // Initialize Step 2 if moving to it
      if (this.currentStep === 2) {
        this.initSingleFeatureAddMenu();
      }
    }
  }

  // Feature table management
  private buildFeatureTable(): void {
    this.featureTableGridOptions = this.kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource(
      "georesourceFeatureTable",
      [],
      [],
      undefined,
      this.kommonitorDataGridHelperService.resourceType_georesource,
      this.enableDeleteFeatures
    );
    
    // Initialize with empty data to show the grid structure
    if (this.gridApi) {
      this.gridApi.setRowData([]);
    }
  }

  refreshGeoresourceEditFeaturesOverviewTable(): void {
    if (!this.currentGeoresourceDataset) {
      return;
    }

    if (!this.currentGeoresourceDataset.georesourceId) {
      return;
    }

    // Set synchronously, but stabilize the view immediately
    this.loadingData = true;
    this.cdr.detectChanges();
    this.hideSuccessAlert();
    this.hideErrorAlert();
    
    const url = `${this.kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/georesources/${this.currentGeoresourceDataset.georesourceId}/allFeatures`;

    this.http.get(url).subscribe({
      next: (response: any) => {
        this.georesourceFeaturesGeoJSON = response;
        const tmpRemainingHeaders: string[] = [];

        // Extract headers from the first feature's properties
        if (this.georesourceFeaturesGeoJSON?.features?.[0]?.properties) {
          for (const property in this.georesourceFeaturesGeoJSON.features[0].properties) {
            if (property !== (__env?.FEATURE_ID_PROPERTY_NAME || 'ID') && 
                property !== (__env?.FEATURE_NAME_PROPERTY_NAME || 'NAME') && 
                property !== (__env?.VALID_START_DATE_PROPERTY_NAME || 'validStartDate') && 
                property !== (__env?.VALID_END_DATE_PROPERTY_NAME || 'validEndDate')) {
              tmpRemainingHeaders.push(property);
            }
          }
        }

        this.remainingFeatureHeaders = tmpRemainingHeaders;
        
        // Rebuild the grid options with new data
        this.featureTableGridOptions = this.kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource(
          "georesourceFeatureTable", 
          tmpRemainingHeaders, 
          this.georesourceFeaturesGeoJSON.features, 
          this.currentGeoresourceDataset.georesourceId, 
          this.kommonitorDataGridHelperService.resourceType_georesource, 
          this.enableDeleteFeatures
        );

        // If grid API is available, update the data directly
        if (this.gridApi) {
          // Transform the data to match the expected format
          const transformedData = (this.georesourceFeaturesGeoJSON.features || []).map((feature: any) => {
            if (feature.properties) {
              // Add geometry and record ID to properties
              feature.properties.kommonitorGeometry = feature.geometry;
              feature.properties.kommonitorRecordId = feature.id;
              return feature.properties;
            }
            return feature;
          });
          this.gridApi.setRowData(transformedData);
          // Force refresh of the grid
          this.gridApi.refreshCells();
        }

        this.loadingData = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.handleError(error);
        this.loadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  onChangeEnableDeleteFeatures(): void {
    // Rebuild the table with updated delete functionality
    if (this.currentGeoresourceDataset && this.remainingFeatureHeaders && this.georesourceFeaturesGeoJSON) {
      this.featureTableGridOptions = this.kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource(
        "georesourceFeatureTable",
        this.remainingFeatureHeaders,
        this.georesourceFeaturesGeoJSON.features || [],
        this.currentGeoresourceDataset.georesourceId,
        this.kommonitorDataGridHelperService.resourceType_georesource,
        this.enableDeleteFeatures
      );
      
             // Update grid if API is available
       if (this.gridApi && this.featureTableGridOptions && this.featureTableGridOptions.columnDefs) {
         // Update column definitions to include/exclude delete buttons
         this.gridApi.setColumnDefs(this.featureTableGridOptions.columnDefs);
        
        // Update data if we have features
        if (this.georesourceFeaturesGeoJSON?.features) {
          const transformedData = (this.georesourceFeaturesGeoJSON.features || []).map((feature: any) => {
            if (feature.properties) {
              // Add geometry and record ID to properties
              feature.properties.kommonitorGeometry = feature.geometry;
              feature.properties.kommonitorRecordId = feature.id;
              return feature.properties;
            }
            return feature;
          });
          this.gridApi.setRowData(transformedData);
        }
        
        // Force refresh of the grid to show/hide delete buttons
        this.gridApi.refreshCells();
        
        // Register click handlers after grid update
        setTimeout(() => {
          this.kommonitorDataGridHelperService.registerFeatureTableClickHandlers(
            this.currentGeoresourceDataset?.georesourceId,
            this.kommonitorDataGridHelperService.resourceType_georesource,
            this.enableDeleteFeatures
          );
        }, 100);
      }
    }
  }

  clearAllGeoresourceFeatures(): void {
    if (!this.enableDeleteFeatures || !this.currentGeoresourceDataset) return;

    if (confirm('Sind Sie sicher, dass Sie alle Features dieser Georessource löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      this.loadingData = true;
      this.hideSuccessAlert();
      this.hideErrorAlert();

      this.http.delete(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/georesources/${this.currentGeoresourceDataset.georesourceId}/allFeatures`
      ).subscribe({
        next: (response: any) => {
          this.georesourceFeaturesGeoJSON = null;
          this.remainingFeatureHeaders = [];
          
          this.broadcastService.broadcast('refreshGeoresourceOverviewTable', { 
            crudType: 'edit', 
            targetGeoresourceId: this.currentGeoresourceDataset.georesourceId 
          });
          
          // Clear the grid data
          this.featureTableGridOptions = this.kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource(
            "georesourceFeatureTable", 
            [], 
            []
          );
          
          if (this.gridApi) {
            this.gridApi.setRowData([]);
          }
          
          this.successMessagePart = this.currentGeoresourceDataset.datasetName;
          this.showSuccessAlert();
          
          setTimeout(() => {
          this.loadingData = false;
          }, 500);
        },
        error: (error: any) => {
          this.handleError(error);
          setTimeout(() => {
          this.loadingData = false;
          }, 500);
        }
      });
    }
  }

  // Converter and data source methods
  onChangeConverter(): void {
    if (this.converter) {
      this.schema = this.converter.schemas ? this.converter.schemas[0] : '';
      this.mimeType = this.converter.mimeTypes ? this.converter.mimeTypes[0] : '';
    this.datasourceType = undefined;
    }
  }

  onChangeMimeType(mimeType: string): void {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any): void {
    this.datasourceType = datasourceType;
  }

  // Validation methods
  checkPeriodOfValidity(): void {
    this.periodOfValidityInvalid = false;

    // Validate format first
    if (this.periodOfValidity.startDate && !this.isValidDateString(String(this.periodOfValidity.startDate))) {
      this.periodOfValidityInvalid = true;
      return;
    }
    if (this.periodOfValidity.endDate && !this.isValidDateString(String(this.periodOfValidity.endDate))) {
      this.periodOfValidityInvalid = true;
      return;
    }

    if (this.periodOfValidity.startDate && this.periodOfValidity.endDate) {
      const startDate = new Date(this.periodOfValidity.startDate);
      const endDate = new Date(this.periodOfValidity.endDate);

      if (startDate >= endDate) {
        this.periodOfValidityInvalid = true;
      }
    }
  }

  // Attribute mapping methods
  onAddOrUpdateAttributeMapping(): void {
    if (!this.attributeMapping_sourceAttributeName || 
        !this.attributeMapping_destinationAttributeName || 
        !this.attributeMapping_attributeType) {
      return;
    }

    const existingIndex = this.attributeMappings_adminView.findIndex(
      mapping => mapping.sourceName === this.attributeMapping_sourceAttributeName
    );

    const newMapping = {
      sourceName: this.attributeMapping_sourceAttributeName,
      destinationName: this.attributeMapping_destinationAttributeName,
      dataType: this.attributeMapping_attributeType
    };

    if (existingIndex >= 0) {
      // Update existing mapping
      this.attributeMappings_adminView[existingIndex] = newMapping;
    } else {
      // Add new mapping
      this.attributeMappings_adminView.push(newMapping);
    }

    // Clear form
    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMapping_attributeType = this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
  }

  onClickEditAttributeMapping(attributeMappingEntry: any): void {
    this.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
    this.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
    this.attributeMapping_attributeType = attributeMappingEntry.dataType;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any): void {
    const index = this.attributeMappings_adminView.indexOf(attributeMappingEntry);
    if (index >= 0) {
      this.attributeMappings_adminView.splice(index, 1);
    }
  }

  // Import/Export methods
  onImportGeoresourceEditFeaturesMappingConfig(): void {
    this.georesourceMappingConfigImportError = '';
    try {
      const inputEl = document.getElementById('georesourceMappingConfigEditFeaturesImportFile_ng') as HTMLInputElement | null;
      (inputEl || this.mappingConfigImportFile?.nativeElement)?.click();
    } catch {
      this.mappingConfigImportFile?.nativeElement?.click();
    }
  }

  onMappingConfigFileSelected(event: any): void {
    const inputEl = (event?.target as HTMLInputElement) || (document.getElementById('georesourceMappingConfigEditFeaturesImportFile_ng') as HTMLInputElement | null);
    const file = inputEl?.files?.[0];
    if (!file) {
      this.georesourceMappingConfigImportError = 'Keine Datei ausgewählt oder ungültige Eingabe.';
      this.showMappingConfigImportErrorAlert();
      return;
    }
    this.parseMappingConfigFromFile(file as File);
  }

  private parseMappingConfigFromFile(file: File): void {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMappingConfigFile(event);
      } catch (error) {
        this.georesourceMappingConfigImportError = 'Uploaded Mapping Config File cannot be parsed correctly';
        const preElement = document.getElementById('georesourcesEditFeaturesMappingConfigPre');
        if (preElement) {
          preElement.innerHTML = this.georesourceMappingConfigStructure_pretty;
        }
        this.showMappingConfigImportErrorAlert();
      }
    };

    try {
      fileReader.readAsText(file as Blob);
    } catch (err) {
      this.georesourceMappingConfigImportError = 'Fehler beim Lesen der Datei.';
      this.showMappingConfigImportErrorAlert();
    }
  }

  private parseFromMappingConfigFile(event: any): void {
    const mappingConfig = JSON.parse(event.target.result);

    // Basic structure validation (align with Add modal expectations)
    if (!mappingConfig.converter || !mappingConfig.dataSource || !mappingConfig.propertyMapping) {
      this.georesourceMappingConfigImportError = 'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      const pre = document.getElementById('georesourcesEditFeaturesMappingConfigPre');
      if (pre) {
        pre.innerHTML = this.georesourceMappingConfigStructure_pretty;
      }
      this.showMappingConfigImportErrorAlert();
      return;
    }

    // 1) Resolve converter by name or fallbacks (mimeType/name heuristics)
    this.converter = undefined as any;
    const allConverters = this.kommonitorImporterHelperService.availableConverters || [];
    for (const conv of allConverters) {
      if (conv.name === mappingConfig.converter.name) {
        this.converter = conv;
        break;
      }
    }
    if (!this.converter) {
      const byMime = allConverters.find((c: any) => Array.isArray(c.mimeTypes) && c.mimeTypes.includes(mappingConfig.converter.mimeType));
      if (byMime) {
        this.converter = byMime;
      } else {
        const wantedName = (mappingConfig.converter.name || '').toLowerCase();
        const byName = allConverters.find((c: any) => (c.name || '').toLowerCase().includes(wantedName));
        if (byName) {
          this.converter = byName;
        } else {
          // Heuristic for GeoJSON
          const geojsonConv = allConverters.find((c: any) => Array.isArray(c.mimeTypes) && c.mimeTypes.some((m: string) => m.includes('geo+json')));
          if (geojsonConv) {
            this.converter = geojsonConv;
          }
        }
      }
    }

    // 2) Schema and mimeType
    this.schema = '';
    if (this.converter && this.converter.schemas && mappingConfig.converter.schema) {
      for (const sch of this.converter.schemas) {
        if (sch === mappingConfig.converter.schema) {
          this.schema = sch;
        }
      }
    }

    this.mimeType = '';
    if (this.converter && this.converter.mimeTypes && mappingConfig.converter.mimeType) {
      for (const mt of this.converter.mimeTypes) {
        if (mt === mappingConfig.converter.mimeType) {
          this.mimeType = mt;
        }
      }
    }

    // 3) Datasource type
    this.datasourceType = undefined as any;
    const allTypes = this.kommonitorImporterHelperService.availableDatasourceTypes || [];
    for (const dsType of allTypes) {
      if (dsType.type === mappingConfig.dataSource.type) {
        this.datasourceType = dsType;
        break;
      }
    }

    // 4) Apply converter parameters to DOM inputs so helper can pick them up later
    if (Array.isArray(mappingConfig.converter.parameters)) {
      for (const p of mappingConfig.converter.parameters) {
        const el = document.getElementById('converterParameter_georesourceEditFeatures_' + p.name) as HTMLInputElement | null;
        if (el) {
          el.value = p.value ?? '';
        }
      }
    }

    // 5) Apply datasource parameters and bbox specifics
    this.bboxType = '';
    this.bboxRefSpatialUnit = undefined as any;
    if (this.datasourceType && Array.isArray(mappingConfig.dataSource.parameters)) {
      for (const dsParam of mappingConfig.dataSource.parameters) {
        const el = document.getElementById('datasourceTypeParameter_georesourceEditFeatures_' + dsParam.name) as HTMLInputElement | null;
        if (el) {
          el.value = dsParam.value ?? '';
        }
        if (dsParam.name === 'bboxType') {
          this.bboxType = dsParam.value || '';
          const bboxTypeEl = document.getElementById('datasourceTypeParameter_georesourceEditFeatures_bboxType') as HTMLInputElement | null;
          if (bboxTypeEl) { bboxTypeEl.value = this.bboxType; }
        } else if (dsParam.name === 'bbox') {
          if (this.bboxType === 'ref') {
            this.bboxRefSpatialUnit = dsParam.value;
            const bboxRefEl = document.getElementById('datasourceTypeParameter_georesourceEditFeatures_bboxRef') as HTMLInputElement | null;
            if (bboxRefEl) { bboxRefEl.value = `${this.bboxRefSpatialUnit}`; }
          } else if (this.bboxType === 'literal' && typeof dsParam.value === 'string') {
            // Try to split "minx,miny,maxx,maxy"
            const parts = dsParam.value.split(/[,\s]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
            if (parts.length >= 4) {
              const [minx, miny, maxx, maxy] = parts;
              const minxEl = document.getElementById('datasourceTypeParameter_georesourceEditFeatures_bbox_minx') as HTMLInputElement | null;
              const minyEl = document.getElementById('datasourceTypeParameter_georesourceEditFeatures_bbox_miny') as HTMLInputElement | null;
              const maxxEl = document.getElementById('datasourceTypeParameter_georesourceEditFeatures_bbox_maxx') as HTMLInputElement | null;
              const maxyEl = document.getElementById('datasourceTypeParameter_georesourceEditFeatures_bbox_maxy') as HTMLInputElement | null;
              if (minxEl) { minxEl.value = minx; }
              if (minyEl) { minyEl.value = miny; }
              if (maxxEl) { maxxEl.value = maxx; }
              if (maxyEl) { maxyEl.value = maxy; }
            }
          }
        }
      }
    }

    // 6) Property mapping fields and flags
    this.georesourceDataSourceNameProperty = mappingConfig.propertyMapping.nameProperty || '';
    this.georesourceDataSourceIdProperty = mappingConfig.propertyMapping.identifierProperty || '';
    this.validityStartDate_perFeature = mappingConfig.propertyMapping.validStartDateProperty || '';
    this.validityEndDate_perFeature = mappingConfig.propertyMapping.validEndDateProperty || '';
    this.keepAttributes = !!mappingConfig.propertyMapping.keepAttributes;
    this.keepMissingValues = !!mappingConfig.propertyMapping.keepMissingOrNullValueAttributes;

    this.attributeMappings_adminView = [];
    if (Array.isArray(mappingConfig.propertyMapping.attributes)) {
      for (const attr of mappingConfig.propertyMapping.attributes) {
        const tmp: any = {
          sourceName: attr.name,
          destinationName: attr.mappingName
        };
        for (const dataType of this.kommonitorImporterHelperService.attributeMapping_attributeTypes) {
          if (dataType.apiName === attr.type) {
            tmp.dataType = dataType;
            break;
          }
        }
        this.attributeMappings_adminView.push(tmp);
      }
    }

    // 7) Period of validity
    if (mappingConfig.periodOfValidity) {
      this.periodOfValidity = {
        startDate: mappingConfig.periodOfValidity.startDate || '',
        endDate: mappingConfig.periodOfValidity.endDate || ''
      };
      this.periodOfValidityInvalid = false;
    }
  }

  onExportGeoresourceEditFeaturesMappingConfig(): void {
    const mappingConfig = {
      converter: this.converter,
      datasourceType: this.datasourceType,
      propertyMapping: this.attributeMappings_adminView,
      idProperty: this.georesourceDataSourceIdProperty,
      nameProperty: this.georesourceDataSourceNameProperty,
      validityStartDate: this.validityStartDate_perFeature,
      validityEndDate: this.validityEndDate_perFeature,
      keepAttributes: this.keepAttributes,
      keepMissingValues: this.keepMissingValues,
      isPartialUpdate: this.isPartialUpdate
    };

    const mappingJSON = JSON.stringify(mappingConfig, null, 2);
    let fileName = 'Georessource_Features_Mapping_Export';

    if (this.currentGeoresourceDataset?.datasetName) {
      fileName += '-' + this.currentGeoresourceDataset.datasetName;
    }

    fileName += '.json';

    const blob = new Blob([mappingJSON], { type: 'application/json' });
    const data = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = 'JSON';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();

    a.remove();
  }

  // Main edit method
  async editGeoresourceFeatures(): Promise<void> {
    if (!this.currentGeoresourceDataset || !this.converter || !this.datasourceType) {
      return;
    }

    this.loadingData = true;
    this.importerErrors = null;
    this.successMessagePart = '';
    this.errorMessagePart = '';

    try {
      // Build importer objects
      const allDataSpecified = await this.buildImporterObjects();
      
      if (!allDataSpecified) {
        this.loadingData = false;
        return;
      }

      // Perform dry run first
      const updateGeoresourceResponse_dryRun = await this.kommonitorImporterHelperService.updateGeoresource(
        this.converterDefinition,
        this.datasourceTypeDefinition,
        this.propertyMappingDefinition,
        this.currentGeoresourceDataset.georesourceId,
        this.putBody_georesources,
        true
      );

      if (!this.kommonitorImporterHelperService.importerResponseContainsErrors(updateGeoresourceResponse_dryRun)) {
        // Execute the actual import
        const updateGeoresourceResponse = await this.kommonitorImporterHelperService.updateGeoresource(
          this.converterDefinition,
          this.datasourceTypeDefinition,
          this.propertyMappingDefinition,
          this.currentGeoresourceDataset.georesourceId,
          this.putBody_georesources,
          false
        );

        // Handle success
        this.broadcastService.broadcast('refreshGeoresourceOverviewTable', { 
          crudType: 'edit', 
          targetGeoresourceId: this.currentGeoresourceDataset.georesourceId 
        });
        
        this.refreshGeoresourceEditFeaturesOverviewTable();
        this.initSingleFeatureAddMenu();

        this.successMessagePart = this.currentGeoresourceDataset.datasetName;
        this.importedFeatures = this.kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(updateGeoresourceResponse);

        this.showSuccessAlert();
        this.loadingData = false;
        } else {
        // Handle errors
        this.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
        this.importerErrors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(updateGeoresourceResponse_dryRun);
        this.showErrorAlert();
        this.loadingData = false;
      }
    } catch (error) {
      this.handleError(error);
      this.loadingData = false;
    }
  }

  private async buildImporterObjects(): Promise<boolean> {
    this.converterDefinition = this.buildConverterDefinition();
    this.datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    this.propertyMappingDefinition = this.buildPropertyMappingDefinition();

    const scopeProperties = {
      periodOfValidity: {
        endDate: this.toIsoDateString(this.periodOfValidity.endDate),
        startDate: this.toIsoDateString(this.periodOfValidity.startDate)
      },
      isPartialUpdate: this.isPartialUpdate
    };
    
    this.putBody_georesources = this.kommonitorImporterHelperService.buildPutBody_georesources(scopeProperties);

    return !!(this.converterDefinition && this.datasourceTypeDefinition && this.propertyMappingDefinition && this.putBody_georesources);
  }

  private buildConverterDefinition(): any {
    return this.kommonitorImporterHelperService.buildConverterDefinition(
      this.converter, 
      "converterParameter_georesourceEditFeatures_", 
      this.schema, 
      this.mimeType
    );
  }

  private async buildDatasourceTypeDefinition(): Promise<any> {
    try {
      // Pre-validate FILE datasource: require a selected file and upload it first
      if (this.datasourceType?.type === 'FILE') {
        // Prefer selectedDataSourceFile captured by onGeoresourceFileSelected, fallback to input element
        const fileInput = document.getElementById('georesourceDataSourceInput_editFeatures') as HTMLInputElement | null;
        let file: File | undefined | null = this.selectedDataSourceFile as File | null | undefined;
        if (!file) {
          file = fileInput?.files?.[0];
        }
        const hasFile = !!file;
        if (!hasFile) {
          this.georesourceDataSourceInputInvalid = true;
          this.georesourceDataSourceInputInvalidReason = 'Bitte eine Datei auswählen.';
          return null;
        }
        this.georesourceDataSourceInputInvalid = false;
        this.georesourceDataSourceInputInvalidReason = '';

        const uploadedName = await this.kommonitorImporterHelperService.uploadNewFile(file as File, (file as File).name);
        const localDef = {
          type: 'FILE',
          parameters: [
            { name: 'NAME', value: uploadedName }
          ]
        };
        return localDef;
      }

      // Non-FILE: let helper build from parameter inputs
      return await this.kommonitorImporterHelperService.buildDatasourceTypeDefinition(
        this.datasourceType,
        'datasourceTypeParameter_georesourceEditFeatures_',
        'georesourceDataSourceInput_editFeatures'
      );
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  private buildPropertyMappingDefinition(): any {
    return this.kommonitorImporterHelperService.buildPropertyMapping_spatialResource(
      this.georesourceDataSourceNameProperty, 
      this.georesourceDataSourceIdProperty, 
      this.validityStartDate_perFeature, 
      this.validityEndDate_perFeature, 
      undefined, 
      this.keepAttributes, 
      this.keepMissingValues, 
      this.attributeMappings_adminView
    );
  }

  // Filter methods
  getFilteredConverters(): any[] {
    return this.kommonitorImporterHelperService.availableConverters.filter(
      this.kommonitorImporterHelperService.filterConverters('georesource')
    );
  }

  getFilteredDatasourceParameters(): any[] {
    if (!this.datasourceType?.parameters) return [];
    return this.datasourceType.parameters.filter((param: any) => param.name !== 'bbox');
  }



  // Form reset
  resetGeoresourceEditFeaturesForm(): void {
    this.currentStep = 1;
    this.enableDeleteFeatures = false;
    
    // Reset single feature variables
    this.featureIdValue = 0;
    this.featureIdExampleString = '';
    this.featureIdIsValid = false;
    this.featureNameValue = '';
    this.featureGeometryValue = undefined;
    this.featureStartDateValue = '';
    this.featureEndDateValue = '';
    this.featureSchemaProperties = [];
    this.schemaObject = undefined;
    this.featureInfoText_singleFeatureAddMenu = '';
    
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
      endDate: ''
    };
    this.periodOfValidityInvalid = false;
    
    this.isPartialUpdate = false;
    this.keepAttributes = true;
    this.keepMissingValues = true;
    
    this.attributeMappings_adminView = [];
    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMapping_attributeType = this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
    
    this.bboxType = '';
    this.bboxRefSpatialUnit = undefined;
    this.selectedDataSourceFile = null;
    this.selectedDataSourceFileName = '';
    
    // Reset messages
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.importerErrors = undefined;
    this.importedFeatures = [];

    // Reinitialize single feature add menu
    setTimeout(() => {
      this.initSingleFeatureAddMenu();
    }, 100);
  }

  // Alert methods
  showSuccessAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesSuccessAlert_ng');
    if (alertElement) {
      alertElement.hidden = false;
    }
  }

  showErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesErrorAlert_ng');
    if (alertElement) {
      alertElement.hidden = false;
    }
  }

  showMappingConfigImportErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesMappingConfigImportErrorAlert');
    if (alertElement) {
      alertElement.hidden = false;
    }
  }

  hideSuccessAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesSuccessAlert_ng');
    if (alertElement) {
      alertElement.hidden = true;
    }
  }

  hideErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesErrorAlert_ng');
    if (alertElement) {
      alertElement.hidden = true;
    }
  }

  hideMappingConfigErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesMappingConfigImportErrorAlert');
    if (alertElement) {
      alertElement.hidden = true;
    }
  }

  // Validation for form submission
  canSubmitForm(): boolean {
    return !!this.currentGeoresourceDataset?.datasetName &&
           !!this.georesourceDataSourceIdProperty &&
           !!this.georesourceDataSourceNameProperty &&
           !!this.periodOfValidity.startDate &&
           !this.periodOfValidityInvalid &&
           !!this.converter &&
           !!this.datasourceType;
  }

  // AG-Grid event handlers
  onGridReady(event: any): void {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    
    // Auto-size columns to fit content
    this.gridApi.sizeColumnsToFit();
    
    // If we have data, load it into the grid
    if (this.currentGeoresourceDataset && this.georesourceFeaturesGeoJSON) {
      this.refreshGeoresourceEditFeaturesOverviewTable();
    }
  }

  onFirstDataRendered(event: any): void {
    // Handle first data rendered event
    
    // Auto-size columns after data is rendered
    if (this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
  }

  onColumnResized(event: any): void {
    // Handle column resize event
  }

  onCellValueChanged(params: any): void {
    // Handle cell value changes here
    // The actual API call is handled by the data grid helper service
    // This method is called by the ag-grid component when a cell value changes
    
    console.log('Cell value changed:', {
      column: params.colDef?.field,
      oldValue: params.oldValue,
      newValue: params.newValue,
      data: params.data
    });
    
    // Call the data grid helper service with the current georesource ID
    this.kommonitorDataGridHelperService.handleCellValueChanged(
      params, 
      this.currentGeoresourceDataset?.georesourceId, 
      this.kommonitorDataGridHelperService.resourceType_georesource
    );
  }

  private handleError(error: any): void {
    if (error.data) {
      this.errorMessagePart = this.kommonitorDataExchangeService?.syntaxHighlightJSON(error.data) || 'An error occurred';
    } else {
      this.errorMessagePart = this.kommonitorDataExchangeService?.syntaxHighlightJSON(error) || 'An error occurred';
    }
    this.showErrorAlert();
  }

  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }



  private getSingleFeatureConverterDefinition(): any {
    // This should return the converter definition for single feature import
    // You'll need to implement this based on your importer helper service
    return {
      name: 'singleFeatureImport',
      // Add other converter properties as needed
    };
  }

  private buildSingleFeatureImportObjects(
    featureGeometryValue: any,
    featureIdValue: any,
    featureNameValue: string,
    featureStartDateValue: string,
    featureEndDateValue: string,
    featureSchemaProperties: any[]
  ): any {
    // Set properties on the feature
    featureGeometryValue.features[0].properties['ID'] = featureIdValue;
    featureGeometryValue.features[0].properties['NAME'] = featureNameValue;
    featureGeometryValue.features[0].properties['validStartDate'] = featureStartDateValue;
    featureGeometryValue.features[0].properties['validEndDate'] = featureEndDateValue;

    // Add schema properties
    for (const element of featureSchemaProperties) {
      featureGeometryValue.features[0].properties[element.property] = element.value;
    }

    // Build converter definition
    const converterDefinition = this.getSingleFeatureConverterDefinition();

    // Build datasource type definition
    const datasourceTypeDefinition = {
      type: 'singleFeature',
      parameters: [{
        name: 'geoJsonData',
        value: JSON.stringify(featureGeometryValue)
      }]
    };

    // Build property mapping definition
    const propertyMappingDefinition = {
      nameProperty: 'NAME',
      identifierProperty: 'ID',
      validStartDateProperty: 'validStartDate',
      validEndDateProperty: 'validEndDate',
      keepAttributes: true,
      keepMissingOrNullValueAttributes: true,
      attributes: []
    };

    // Build PUT body
    const putBody = {
      periodOfValidity: {
        endDate: featureEndDateValue,
        startDate: featureStartDateValue
      },
      isPartialUpdate: true
    };

    return {
      converterDefinition,
      datasourceDefinition: datasourceTypeDefinition,
      propertyMappingDefinition,
      putBody
    };
  }

} 