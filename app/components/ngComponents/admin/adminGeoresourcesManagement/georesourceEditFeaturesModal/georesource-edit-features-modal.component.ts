import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
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
import { Subscription, filter } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';

import { FormsModule } from '@angular/forms';
import { SingleFeatureEditComponent } from 'components/ngComponents/common/single-feature-edit/single-feature-edit.component';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { DATE_PICKER_OPTIONS } from 'util/date-picker.constants';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeatureTableDataGridHelperService } from 'services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import {
  StepperComponent,
  StepperStep,
} from 'components/ngComponents/common/stepper/stepper.component';

declare const __env: any;

@Component({
  selector: 'app-georesource-edit-features-modal',
  templateUrl: './georesource-edit-features-modal.component.html',
  styleUrls: ['./georesource-edit-features-modal.component.scss'],
  imports: [AgGridAngular, FormsModule, SingleFeatureEditComponent, StepperComponent],
  standalone: true,
})
export class GeoresourceEditFeaturesModalComponent implements OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);
  private cacheHelperService = inject(CacheHelperServiceService);
  private indicatorValueService = inject(IndicatorValueService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  kommonitorImporterHelperService = inject(KommonitorImporterHelperService);
  featureTableHelper = inject(FeatureTableDataGridHelperService);
  private envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);

  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('dataSourceInput', { static: false }) dataSourceInput!: ElementRef;
  @ViewChild('georesourceFeatureTable', { static: true }) georesourceFeatureTable!: AgGridAngular;

  // Component state
  loadingData = false;
  private _currentGeoresourceDataset: any;
  currentStep = 1;
  steps: StepperStep[] = [
    { label: 'Feature Übersicht' },
    { label: 'Import einzelner Features' },
    { label: 'Import mehrerer Features' },
  ];

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
  periodOfValidity: any = {
    startDate: '',
    endDate: '',
  };
  periodOfValidityInvalid = false;

  // Data source variables
  georesourceDataSourceInputInvalid = false;
  georesourceDataSourceInputInvalidReason: string = '';
  georesourceDataSourceIdProperty: string = '';
  georesourceDataSourceNameProperty: string = '';
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

  constructor() {
    console.log('GeoresourceEditFeaturesModalComponent constructor initialized');
    this.initializeDefaultValues();
  }

  ngOnInit(): void {
    this.initializeDatePickers();
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
    this.availableDatasourceTypes = this.kommonitorImporterHelperService.availableDatasourceTypes;
    this.availableSpatialUnits = this.spatialUnitStore.availableSpatialUnits;
  }

  private initializeMappingConfigStructure(): void {
    this.georesourceMappingConfigStructure_pretty = this.indicatorValueService.syntaxHighlightJSON(
      this.kommonitorImporterHelperService.mappingConfigStructure
    );
  }

  private initializeDatePickers(): void {
    setTimeout(() => {
      try {
        if ((window as any).$) {
          (window as any)
            .$('#georesourceEditFeaturesDatepickerStart')
            .datepicker(DATE_PICKER_OPTIONS);
          (window as any)
            .$('#georesourceEditFeaturesDatepickerEnd')
            .datepicker(DATE_PICKER_OPTIONS);
          (window as any)
            .$('#georesourceSingleFeatureDatepickerStart')
            .datepicker(DATE_PICKER_OPTIONS);
          (window as any)
            .$('#georesourceSingleFeatureDatepickerEnd')
            .datepicker(DATE_PICKER_OPTIONS);
        }
      } catch (error) {
        console.warn('Date picker initialization failed:', error);
      }
    }, 250);
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

    // React to feature-table loading/delete events from the shared grid helper.
    const featureTableSubscription = this.featureTableHelper.featureTableEvents$
      .pipe(
        filter((event) => event.resourceType === this.featureTableHelper.resourceType_georesource)
      )
      .subscribe((event) => {
        if (event.type === 'loadingStart') {
          this.loadingData = true;
        } else if (event.type === 'loadingEnd') {
          this.loadingData = false;
        } else if (event.type === 'featureDeleted') {
          this.broadcastService.broadcast(BroadcastMessage.RefreshGeoresourceOverviewTable, {
            crudType: 'edit',
            targetGeoresourceId: this.currentGeoresourceDataset?.georesourceId,
          });
          this.refreshGeoresourceEditFeaturesOverviewTable();
        }
      });
    this.subscriptions.push(featureTableSubscription);
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

    // Load the georesource features
    setTimeout(() => {
      this.refreshGeoresourceEditFeaturesOverviewTable();
    }, 100);
  }

  // Step navigation
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
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
    }
  }

  // Feature table management
  private buildFeatureTable(): void {
    this.featureTableGridOptions =
      this.featureTableHelper.buildDataGrid_featureTable_spatialResource(
        'georesourceFeatureTable',
        [],
        [],
        undefined,
        this.featureTableHelper.resourceType_georesource,
        this.enableDeleteFeatures
      );
  }

  refreshGeoresourceEditFeaturesOverviewTable(): void {
    if (!this.currentGeoresourceDataset) {
      console.warn('No current georesource dataset selected');
      return;
    }

    console.log('Starting refresh of georesource features table...');
    this.loadingData = true;

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
              property !== __env.FEATURE_ID_PROPERTY_NAME &&
              property !== __env.FEATURE_NAME_PROPERTY_NAME &&
              property !== __env.VALID_START_DATE_PROPERTY_NAME &&
              property !== __env.VALID_END_DATE_PROPERTY_NAME
            ) {
              tmpRemainingHeaders.push(property);
            }
          }
        }

        this.remainingFeatureHeaders = tmpRemainingHeaders;
        console.log('Remaining headers:', tmpRemainingHeaders);
        console.log('Features count:', this.georesourceFeaturesGeoJSON.features?.length || 0);

        // Rebuild the grid options with new data
        this.featureTableGridOptions =
          this.featureTableHelper.buildDataGrid_featureTable_spatialResource(
            'georesourceFeatureTable',
            tmpRemainingHeaders,
            this.georesourceFeaturesGeoJSON.features,
            this.currentGeoresourceDataset.georesourceId,
            this.featureTableHelper.resourceType_georesource,
            this.enableDeleteFeatures
          );

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
          this.gridApi.setRowData(transformedData);
          // Force refresh of the grid
          this.gridApi.refreshCells();
        }

        // Use setTimeout to ensure proper change detection and DOM updates
        setTimeout(() => {
          this.loadingData = false;
          console.log('Loading completed');
        }, 500); // Increased timeout to show loading state longer
      },
      error: (error) => {
        console.error('Error fetching georesource features:', error);
        this.handleError(error);
        setTimeout(() => {
          this.loadingData = false;
        }, 500); // Increased timeout to show loading state longer
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
      this.featureTableGridOptions =
        this.featureTableHelper.buildDataGrid_featureTable_spatialResource(
          'georesourceFeatureTable',
          this.remainingFeatureHeaders,
          this.georesourceFeaturesGeoJSON.features || [],
          this.currentGeoresourceDataset.georesourceId,
          this.featureTableHelper.resourceType_georesource,
          this.enableDeleteFeatures
        );

      // Update grid if API is available
      if (this.gridApi && this.featureTableGridOptions && this.featureTableGridOptions.columnDefs) {
        // Update column definitions to include/exclude delete buttons
        this.gridApi.setColumnDefs(this.featureTableGridOptions.columnDefs);
      }
    }
  }

  clearAllGeoresourceFeatures(): void {
    if (!this.enableDeleteFeatures || !this.currentGeoresourceDataset) return;

    if (
      confirm(
        'Sind Sie sicher, dass Sie alle Features dieser Georessource löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'
      )
    ) {
      this.loadingData = true;

      this.http
        .delete(
          `${this.envConfigService.baseUrlToKomMonitorDataAPI}/georesources/${this.currentGeoresourceDataset.georesourceId}/allFeatures`
        )
        .subscribe({
          next: (_response: any) => {
            this.loadingData = false;
            this.refreshGeoresourceEditFeaturesOverviewTable();
            alert('Alle Features wurden erfolgreich gelöscht.');
          },
          error: (error: any) => {
            this.loadingData = false;
            console.error('Error deleting features:', error);
            alert('Fehler beim Löschen der Features.');
          },
        });
    }
  }

  // Converter and data source methods
  onChangeConverter(): void {
    this.schema = '';
    this.mimeType = '';
    this.datasourceType = undefined;
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
    if (
      !this.attributeMapping_sourceAttributeName ||
      !this.attributeMapping_destinationAttributeName ||
      !this.attributeMapping_attributeType
    ) {
      return;
    }

    const existingIndex = this.attributeMappings_adminView.findIndex(
      (mapping) => mapping.sourceName === this.attributeMapping_sourceAttributeName
    );

    const newMapping = {
      sourceName: this.attributeMapping_sourceAttributeName,
      destinationName: this.attributeMapping_destinationAttributeName,
      dataType: this.attributeMapping_attributeType,
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
    this.attributeMapping_attributeType =
      this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
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
    this.mappingConfigImportFile.nativeElement.click();
  }

  onMappingConfigFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.parseMappingConfigFromFile(file);
    }
  }

  private parseMappingConfigFromFile(file: File): void {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMappingConfigFile(event);
      } catch {
        console.error('Uploaded Mapping Config File cannot be parsed.');
        this.georesourceMappingConfigImportError =
          'Uploaded Mapping Config File cannot be parsed correctly';
        const preElement = document.getElementById('georesourcesEditFeaturesMappingConfigPre');
        if (preElement) {
          preElement.innerHTML = this.georesourceMappingConfigStructure_pretty;
        }
        this.showMappingConfigImportErrorAlert();
      }
    };

    fileReader.readAsText(file);
  }

  private parseFromMappingConfigFile(event: any): void {
    const mappingConfig = JSON.parse(event.target.result);

    // Apply mapping configuration
    if (mappingConfig.converter) {
      this.converter = mappingConfig.converter;
    }
    if (mappingConfig.datasourceType) {
      this.datasourceType = mappingConfig.datasourceType;
    }
    if (mappingConfig.propertyMapping) {
      this.attributeMappings_adminView = mappingConfig.propertyMapping || [];
    }
    // Add more mapping config properties as needed
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
      isPartialUpdate: this.isPartialUpdate,
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
  editGeoresourceFeatures(): void {
    if (!this.currentGeoresourceDataset || !this.converter || !this.datasourceType) {
      return;
    }

    this.loadingData = true;

    // Build the request body
    const putBody = this.buildPutBody();

    this.http
      .put(
        `${this.envConfigService.baseUrlToKomMonitorDataAPI}/georesources/${this.currentGeoresourceDataset.georesourceId}/features`,
        putBody
      )
      .subscribe({
        next: (response: any) => {
          this.successMessagePart = this.currentGeoresourceDataset.datasetName;
          this.importedFeatures = response.importedFeatures || [];
          this.broadcastService.broadcast(BroadcastMessage.RefreshGeoresourceOverviewTable, {
            crudType: 'edit',
            targetGeoresourceId: this.currentGeoresourceDataset.georesourceId,
          });
          this.showSuccessAlert();
          this.loadingData = false;
        },
        error: (error: any) => {
          if (error.error) {
            this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error.error);
          } else {
            this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error);
          }
          this.importerErrors = error.error?.importerErrors || [];
          this.showErrorAlert();
          this.loadingData = false;
        },
      });
  }

  private buildPutBody(): any {
    const putBody: any = {
      geoJsonString: '',
      periodOfValidity: {
        startDate: this.periodOfValidity.startDate,
        endDate: this.periodOfValidity.endDate,
      },
    };

    // Add converter definition
    putBody.converterDefinition = {
      name: this.converter.name,
      parameters: this.getConverterParameters(),
    };

    // Add datasource definition
    putBody.datasourceTypeDefinition = {
      type: this.datasourceType.type,
      parameters: this.getDatasourceParameters(),
    };

    // Add property mapping
    putBody.propertyMappingDefinition = {
      idProperty: this.georesourceDataSourceIdProperty,
      nameProperty: this.georesourceDataSourceNameProperty,
      validityStartDateProperty: this.validityStartDate_perFeature,
      validityEndDateProperty: this.validityEndDate_perFeature,
      keepAttributes: this.keepAttributes,
      keepMissingValues: this.keepMissingValues,
      attributeMappings: this.attributeMappings_adminView,
    };

    // Add partial update flag
    putBody.isPartialUpdate = this.isPartialUpdate;

    return putBody;
  }

  private getConverterParameters(): any {
    const parameters: any = {};

    if (this.converter.parameters) {
      this.converter.parameters.forEach((param: any) => {
        const element = document.getElementById(
          `converterParameter_georesourceEditFeatures_${param.name}`
        );
        if (element) {
          parameters[param.name] = (element as HTMLInputElement).value;
        }
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
      const fileInput = document.getElementById(
        'georesourceDataSourceInput_editFeatures'
      ) as HTMLInputElement;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        // File will be handled separately in actual implementation
        parameters.file = fileInput.files[0];
      }
    } else if (this.datasourceType.type === 'OGCAPI_FEATURES') {
      // Handle BBOX parameters
      if (this.bboxType === 'ref' && this.bboxRefSpatialUnit) {
        parameters.spatialUnitId = this.bboxRefSpatialUnit.spatialUnitId;
      } else if (this.bboxType === 'literal') {
        const minx = (
          document.getElementById(
            'datasourceTypeParameter_georesourceEditFeatures_bbox_minx'
          ) as HTMLInputElement
        )?.value;
        const miny = (
          document.getElementById(
            'datasourceTypeParameter_georesourceEditFeatures_bbox_miny'
          ) as HTMLInputElement
        )?.value;
        const maxx = (
          document.getElementById(
            'datasourceTypeParameter_georesourceEditFeatures_bbox_maxx'
          ) as HTMLInputElement
        )?.value;
        const maxy = (
          document.getElementById(
            'datasourceTypeParameter_georesourceEditFeatures_bbox_maxy'
          ) as HTMLInputElement
        )?.value;

        parameters.bbox = `${minx},${miny},${maxx},${maxy}`;
      }
    }

    // Add other datasource parameters
    if (this.datasourceType.parameters) {
      this.datasourceType.parameters.forEach((param: any) => {
        if (param.name !== 'bbox') {
          const element = document.getElementById(
            `datasourceTypeParameter_georesourceEditFeatures_${param.name}`
          );
          if (element) {
            parameters[param.name] = (element as HTMLTextAreaElement).value;
          }
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

  getFilteredDatasourceParameters(): any[] {
    if (!this.datasourceType?.parameters) return [];
    return this.datasourceType.parameters.filter((param: any) => param.name !== 'bbox');
  }

  // Form reset
  resetGeoresourceEditFeaturesForm(): void {
    this.currentStep = 1;
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
    this.periodOfValidityInvalid = false;

    this.isPartialUpdate = false;
    this.keepAttributes = true;
    this.keepMissingValues = true;

    this.attributeMappings_adminView = [];
    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMapping_attributeType =
      this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];

    this.bboxType = '';
    this.bboxRefSpatialUnit = undefined;

    // Reset messages
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.importerErrors = undefined;
    this.importedFeatures = [];
  }

  // Alert methods
  showSuccessAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesSuccessAlert');
    if (alertElement) {
      alertElement.hidden = false;
    }
  }

  showErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesErrorAlert');
    if (alertElement) {
      alertElement.hidden = false;
    }
  }

  showMappingConfigImportErrorAlert(): void {
    const alertElement = document.getElementById(
      'georesourceEditFeaturesMappingConfigImportErrorAlert'
    );
    if (alertElement) {
      alertElement.hidden = false;
    }
  }

  hideSuccessAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesSuccessAlert');
    if (alertElement) {
      alertElement.hidden = true;
    }
  }

  hideErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditFeaturesErrorAlert');
    if (alertElement) {
      alertElement.hidden = true;
    }
  }

  hideMappingConfigErrorAlert(): void {
    const alertElement = document.getElementById(
      'georesourceEditFeaturesMappingConfigImportErrorAlert'
    );
    if (alertElement) {
      alertElement.hidden = true;
    }
  }

  // Validation for form submission
  canSubmitForm(): boolean {
    return (
      !!this.currentGeoresourceDataset?.datasetName &&
      !!this.georesourceDataSourceIdProperty &&
      !!this.georesourceDataSourceNameProperty &&
      !!this.periodOfValidity.startDate &&
      !this.periodOfValidityInvalid &&
      !!this.converter &&
      !!this.datasourceType
    );
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
    if (error.data) {
      this.errorMessagePart =
        this.indicatorValueService.syntaxHighlightJSON(error.data) || 'An error occurred';
    } else {
      this.errorMessagePart =
        this.indicatorValueService.syntaxHighlightJSON(error) || 'An error occurred';
    }
    this.showErrorAlert();
  }

  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }
}
