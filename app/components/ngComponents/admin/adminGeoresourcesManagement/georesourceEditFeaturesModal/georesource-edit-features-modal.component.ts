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
import { Subscription, filter } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';

import { FormsModule } from '@angular/forms';
import { KmDatePickerComponent } from 'components/ngComponents/customElements/date-picker/km-date-picker.component';
import { SingleFeatureEditComponent } from 'components/ngComponents/common/single-feature-edit/single-feature-edit.component';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeatureTableDataGridHelperService } from 'services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-georesource-edit-features-modal',
  templateUrl: './georesource-edit-features-modal.component.html',
  styleUrls: ['./georesource-edit-features-modal.component.scss'],
  imports: [
    AgGridAngular,
    FormsModule,
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
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  kommonitorImporterHelperService = inject(KommonitorImporterHelperService);
  featureTableHelper = inject(FeatureTableDataGridHelperService);
  private envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // Model-backed values for the dynamic converter/datasource parameter inputs
  // (formerly scraped from the DOM by element id)
  converterParameterValues: Record<string, string> = {};
  datasourceParameterValues: Record<string, string> = {};
  bboxMinX = '';
  bboxMinY = '';
  bboxMaxX = '';
  bboxMaxY = '';

  // Alert visibility (template binding; formerly toggled via document.getElementById).
  // Update success/error feedback is toasted via NotificationService; only the
  // inline mapping-config import error report remains.
  // Signal: written from the async FileReader callback (OnPush).
  mappingConfigImportErrorAlertVisible = signal(false);

  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('dataSourceInput', { static: false }) dataSourceInput!: ElementRef;
  @ViewChild('georesourceFeatureTable', { static: true }) georesourceFeatureTable!: AgGridAngular;

  // Component state
  // Signal: toggled from subscriptions and grid-helper events (OnPush).
  loadingData = signal(false);
  private _currentGeoresourceDataset: any;
  readonly stepper = new WizardStepper([
    { key: 'overview', label: 'Feature Übersicht' },
    { key: 'single', label: 'Import einzelner Features' },
    { key: 'batch', label: 'Import mehrerer Features' },
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
    console.log('GeoresourceEditFeaturesModalComponent constructor initialized');
    this.initializeDefaultValues();
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
    this.availableDatasourceTypes = this.kommonitorImporterHelperService.availableDatasourceTypes;
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

    // React to feature-table loading/delete events from the shared grid helper.
    const featureTableSubscription = this.featureTableHelper.featureTableEvents$
      .pipe(
        filter((event) => event.resourceType === this.featureTableHelper.resourceType_georesource)
      )
      .subscribe((event) => {
        if (event.type === 'loadingStart') {
          this.loadingData.set(true);
        } else if (event.type === 'loadingEnd') {
          this.loadingData.set(false);
        } else if (event.type === 'featureDeleted') {
          this.refreshRequested.emit({
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
    this.refreshGeoresourceEditFeaturesOverviewTable();
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
        this.gridApi.setGridOption('columnDefs', this.featureTableGridOptions.columnDefs);
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
      this.loadingData.set(true);

      this.http
        .delete(
          `${this.envConfigService.baseUrlToKomMonitorDataAPI}/georesources/${this.currentGeoresourceDataset.georesourceId}/allFeatures`
        )
        .subscribe({
          next: (_response: any) => {
            this.loadingData.set(false);
            this.refreshGeoresourceEditFeaturesOverviewTable();
            alert('Alle Features wurden erfolgreich gelöscht.');
          },
          error: (error: any) => {
            this.loadingData.set(false);
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
    this.georesourceMappingConfigImportError.set('');
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
        this.georesourceMappingConfigImportError.set(
          'Uploaded Mapping Config File cannot be parsed correctly'
        );
        this.showMappingConfigImportErrorAlert();
      }
      // The import rewrites several ngModel-bound fields from an async callback —
      // mark the OnPush view once instead of converting each field to a signal.
      this.cdr.markForCheck();
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

    this.loadingData.set(true);

    // Build the request body
    const putBody = this.buildPutBody();

    this.http
      .put(
        `${this.envConfigService.baseUrlToKomMonitorDataAPI}/georesources/${this.currentGeoresourceDataset.georesourceId}/features`,
        putBody
      )
      .subscribe({
        next: (response: any) => {
          this.importedFeatures = response.importedFeatures || [];
          this.cdr.markForCheck();
          this.refreshRequested.emit({
            crudType: 'edit',
            targetGeoresourceId: this.currentGeoresourceDataset.georesourceId,
          });
          this.loadingData.set(false);
          const featureCount = this.importedFeatures.length;
          this.notificationService.showSuccess(
            `Die Features der Georessource "${this.currentGeoresourceDataset.datasetName}" wurden aktualisiert` +
              (featureCount > 0 ? ` (${featureCount} Features importiert).` : '.')
          );
          this.activeModal.close({ action: 'updated' });
        },
        error: (error: any) => {
          // Keep the modal open so the per-feature importer error report stays visible.
          this.importerErrors.set(error.error?.importerErrors || []);
          this.notificationService.showError(
            'Fehler beim Fortführen der Features: ' + getErrorMessage(error)
          );
          this.loadingData.set(false);
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
      if (this.bboxType === 'ref' && this.bboxRefSpatialUnit) {
        parameters.spatialUnitId = this.bboxRefSpatialUnit.spatialUnitId;
      } else if (this.bboxType === 'literal') {
        parameters.bbox = `${this.bboxMinX},${this.bboxMinY},${this.bboxMaxX},${this.bboxMaxY}`;
      }
    }

    // Add other datasource parameters
    if (this.datasourceType.parameters) {
      this.datasourceType.parameters.forEach((param: any) => {
        if (param.name !== 'bbox') {
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

  getFilteredDatasourceParameters(): any[] {
    if (!this.datasourceType?.parameters) return [];
    return this.datasourceType.parameters.filter((param: any) => param.name !== 'bbox');
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
    this.notificationService.showError('Ein Fehler ist aufgetreten: ' + getErrorMessage(error));
  }

  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }
}
