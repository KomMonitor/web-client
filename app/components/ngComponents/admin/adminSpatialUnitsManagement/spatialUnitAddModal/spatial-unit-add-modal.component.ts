import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { NgbActiveModal, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { HttpClient } from '@angular/common/http';
import { KommonitorImporterHelperService } from '../../../../../services/adminSpatialUnit/kommonitor-importer-helper.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { KommonitorDataExchangeService } from '../../../../../services/adminSpatialUnit/kommonitor-data-exchange.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi, ColumnApi } from 'ag-grid-community';

import { KmColorPickerComponent } from '../../../customElements/color-picker/km-color-picker.component';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';

import { KmDatePickerComponent } from '../../../customElements/date-picker/km-date-picker.component';

// Removed in favor of standalone km-date-picker component providers

@Component({
  selector: 'app-spatial-unit-add-modal',
  templateUrl: './spatial-unit-add-modal.component.html',
  styleUrls: ['./spatial-unit-add-modal.component.scss'],
  imports: [
    FormsModule,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
    AgGridAngular,
    KmDatePickerComponent,
  ],
  standalone: true,
})
export class SpatialUnitAddModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  kommonitorImporterHelperService = inject(KommonitorImporterHelperService);
  private roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private http = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  private sanitizer = inject(DomSanitizer);
  private notificationService = inject(NotificationService);

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('spatialUnitDataSourceInput', { static: false })
  spatialUnitDataSourceInput!: ElementRef;
  @ViewChild('roleManagementGrid', { static: false }) roleManagementGrid!: AgGridAngular;
  // datepickers handled by km-date-picker
  @ViewChild('lastUpdateDatepicker', { static: false }) lastUpdateDatepicker!: NgbDatepicker;

  // Multi-step form
  currentStep = 1;
  totalSteps = 3; // Will be adjusted based on security settings

  // Form data
  isSubmitting = false;
  loadingData = false;

  // Basic form data
  spatialUnitLevel = '';
  spatialUnitLevelInvalid = false;
  metadata: any = {
    description: '',
    databasis: '',
    datasource: '',
    contact: '',
    updateInterval: null,
    lastUpdate: '',
    literature: '',
    note: '',
    sridEPSG: 4326,
  };

  // Hierarchy
  nextLowerHierarchySpatialUnit: any = null;
  nextUpperHierarchySpatialUnit: any = null;
  hierarchyInvalid = false;

  // Outline layer settings
  isOutlineLayer = false;
  loiColor = '#bf3d2c';
  outlineWidth = 3;
  outlineDashArray: any = null;

  // Period of validity
  periodOfValidity: { startDate: any; endDate: any } = {
    startDate: '',
    endDate: '',
  };
  periodOfValidityInvalid = false;

  // Available options
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  availableDatasourceTypes: any[] = [];
  availableLoiDashArrayObjects: any[] = [];

  // Importer functionality
  converter: any = null;
  schema: string = '';
  mimeType: string = '';
  datasourceType: any = null;
  selectedDataSourceFile: File | null = null;
  spatialUnitDataSourceIdProperty = '';
  spatialUnitDataSourceIdPropertyInvalid = false;
  spatialUnitDataSourceNameProperty = '';
  spatialUnitDataSourceNamePropertyInvalid = false;

  // Bbox parameters for OGCAPI_FEATURES
  bboxType: string = '';
  bboxRefSpatialUnit: any = null;
  bbox_minx: any = null;
  bbox_miny: any = null;
  bbox_maxx: any = null;
  bbox_maxy: any = null;

  // Attribute mapping
  attributeMapping_sourceAttributeName = '';
  attributeMapping_destinationAttributeName = '';
  attributeMapping_attributeType: any = null;
  attributeMappings_adminView: any[] = [];
  keepAttributes = true;
  keepMissingValues = true;

  // Persisted parameter values for converter and datasource type
  converterParameterValues: { [key: string]: string } = {};
  datasourceTypeParameterValues: { [key: string]: string } = {};

  // Validity dates per feature
  validityStartDate_perFeature = '';
  validityEndDate_perFeature = '';

  // Role management
  roleManagementTableOptions: any = null;
  roleManagementColumnDefs: ColDef[] = [];
  roleManagementRowData: any[] = [];
  roleManagementDefaultColDef: ColDef = {};
  roleManagementGridOptions: GridOptions = {};
  roleManagementGridApi: GridApi | null = null;
  roleManagementColumnApi: ColumnApi | null = null;
  ownerOrganization = '';
  ownerOrgFilter = '';
  isPublic = false;
  resourcesCreatorRights: any[] = [];

  // Import/Export functionality
  metadataImportSettings: any = null;
  mappingConfigImportSettings: any = null;
  spatialUnitMetadataImportError = '';
  spatialUnitMappingConfigImportError = '';

  // Import result data
  importerErrors: any[] = [];
  importedFeatures: any[] = [];

  // Importer objects
  converterDefinition: any = null;
  datasourceTypeDefinition: any = null;
  propertyMappingDefinition: any = null;
  postBody_spatialUnits: any = null;

  // Validation flags
  idPropertyNotFound = false;
  namePropertyNotFound = false;
  spatialUnitDataSourceInputInvalid = false;
  spatialUnitDataSourceInputInvalidReason = '';

  // Missing properties from original component
  outlineColor = '#000000';
  selectedOutlineDashArrayObject: LinePatternOption | null = null;
  spatialUnitMetadataStructure_pretty: string = '';
  spatialUnitMappingConfigStructure: any = {};

  // Role form visibility
  showRoleForm = false;

  // Color picker handled by km-color-picker
  // Line pattern picker handled by km-line-pattern-picker

  // Grid ready event handler
  onRoleManagementGridReady(params: any) {
    this.roleManagementGridApi = params.api;
    this.roleManagementColumnApi = params.columnApi;

    // Update the service with the grid API so it can be used for getSelectedRoleIds
    this.roleManagementHelper.setGridApi(params.api);
  }

  // Additional grid event handlers to match parent component
  onRoleManagementFirstDataRendered(_event: any): void {
    this.roleManagementHeaderHeightSetter();
  }

  onRoleManagementColumnResized(_event: any): void {
    this.roleManagementHeaderHeightSetter();
  }

  onRoleManagementModelUpdated(): void {
    // Grid model updated
  }

  onRoleManagementViewportChanged(): void {
    // Viewport changed
  }

  private roleManagementHeaderHeightSetter(): void {
    if (this.roleManagementGridApi) {
      const headerHeight = this.roleManagementHeaderHeightGetter();
      this.roleManagementGridApi.setHeaderHeight(headerHeight);
    }
  }

  private roleManagementHeaderHeightGetter(): number {
    const headerElement = document.querySelector('#roleManagementGrid .ag-header');
    if (headerElement) {
      const headerTextElements = headerElement.querySelectorAll('.ag-header-cell-text');
      let maxHeight = 0;
      headerTextElements.forEach((element) => {
        const height = element.scrollHeight;
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      return Math.max(maxHeight + 20, 40); // Add padding and minimum height
    }
    return 40;
  }

  // Filter organizations based on ownerOrgFilter
  get filteredAccessControl() {
    const accessControl = this.kommonitorDataExchangeService.accessControl || [];

    if (!this.ownerOrgFilter) {
      return accessControl;
    }
    const filtered = accessControl.filter((org) =>
      org.name.toLowerCase().includes(this.ownerOrgFilter.toLowerCase())
    );
    return filtered;
  }

  get filteredResourcesCreatorRights() {
    if (!this.ownerOrgFilter) {
      return this.resourcesCreatorRights;
    }
    const filtered = this.resourcesCreatorRights.filter((org) =>
      org.name.toLowerCase().includes(this.ownerOrgFilter.toLowerCase())
    );
    return filtered;
  }

  get availableLinePatternOptions(): LinePatternOption[] {
    return (this.kommonitorDataExchangeService.availableLoiDashArrayObjects || []).map(
      (option) => ({
        label: option.label,
        dashArrayValue: option.dashArrayValue,
        svgString: option.svgString,
      })
    );
  }

  ngOnInit() {
    this.loadInitialData();
    this.initializeMultiStepForm();
    this.initializeOutlineLayerSettings();
    this.initializeMetadataStructures();
    this.setupEventListeners();
  }

  private async loadInitialData() {
    this.loadingData = true;

    // Load available spatial units
    if (this.kommonitorDataExchangeService.availableSpatialUnits) {
      this.availableSpatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits;
    }

    // Load update interval options
    if (this.kommonitorDataExchangeService.updateIntervalOptions) {
      this.updateIntervalOptions = this.kommonitorDataExchangeService.updateIntervalOptions;
    } else {
      // no branch action required
    }

    // Initialize attribute mapping types
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    if (attributeMappingTypes && attributeMappingTypes.length > 0) {
      this.attributeMapping_attributeType = attributeMappingTypes[0];
    }

    // Ensure importer resources are fetched before reading converters/datasource types
    try {
      await this.kommonitorImporterHelperService.fetchResourcesFromImporter();
    } catch {
      // best-effort: ignore resource fetch errors
    }

    // Load datasource types from importer helper after fetch
    this.loadDatasourceTypes();

    // Load access control data and prepare creator list
    this.loadAccessControlData();

    // Initialize metadata structures
    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;
  }

  private loadAccessControlData() {
    // Check if access control data is already available
    if (
      this.kommonitorDataExchangeService.accessControl &&
      this.kommonitorDataExchangeService.accessControl.length > 0
    ) {
      this.prepareCreatorList();
      this.loadingData = false;
    } else {
      // Fetch access control data from server
      this.kommonitorDataExchangeService.fetchAccessControlMetadata(true).subscribe({
        next: (_data) => {
          this.prepareCreatorList();
          this.loadingData = false;
        },
        error: (_error) => {
          // Set empty arrays to avoid errors
          this.resourcesCreatorRights = [];
          this.loadingData = false;
        },
      });
    }
  }

  private initializeMultiStepForm() {
    // Initialize multi-step form based on security settings
    if (
      this.kommonitorDataExchangeService.accessControl &&
      this.kommonitorDataExchangeService.accessControl.length > 0
    ) {
      this.totalSteps = 5; // Include role management step
    } else {
      this.totalSteps = 4;
    }

    // Initialize role management if available
    if (
      this.kommonitorDataExchangeService.accessControl &&
      this.kommonitorDataExchangeService.accessControl.length > 0
    ) {
      this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
        'spatialUnitAddRoleManagementTable',
        this.roleManagementTableOptions,
        this.kommonitorDataExchangeService.accessControl,
        []
      );

      // Extract initial column definitions and row data and build grid config
      if (this.roleManagementTableOptions) {
        this.roleManagementColumnDefs = this.roleManagementTableOptions.columnDefs || [];
        this.roleManagementRowData = this.roleManagementTableOptions.rowData || [];

        // Build grid configuration
        this.buildRoleManagementGridConfig();
      }
    }
  }

  private loadConverters(): void {
    // Converters are fetched and exposed by the importer helper service.
    // The template reads them directly from the service; no component state needed here.
    return;
  }

  private loadDatasourceTypes(): void {
    const datasourceTypes = this.kommonitorImporterHelperService.getAvailableDatasourceTypes();
    this.availableDatasourceTypes = datasourceTypes || [];
  }

  private initializeOutlineLayerSettings() {
    const availableOptions = this.kommonitorDataExchangeService.availableLoiDashArrayObjects || [];
    if (availableOptions.length > 0) {
      this.selectedOutlineDashArrayObject = {
        label: availableOptions[0].label,
        dashArrayValue: availableOptions[0].dashArrayValue,
        svgString: availableOptions[0].svgString,
      };
    } else {
      this.selectedOutlineDashArrayObject = null;
    }
    this.availableLoiDashArrayObjects = availableOptions;
  }

  private initializeMetadataStructures() {
    this.spatialUnitMetadataStructure_pretty =
      this.kommonitorDataExchangeService.syntaxHighlightJSON(
        this.kommonitorDataExchangeService.spatialUnitMetadataStructure
      );
    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;
  }

  prepareCreatorList() {
    if (this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames?.length > 0) {
      const creatorRights: string[] = [];

      this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.forEach(
        (roles: string) => {
          const key = roles.split('.')[0];
          const role = roles.split('.')[1];

          if (role === 'unit-resources-creator' && !creatorRights.includes(key)) {
            creatorRights.push(key);
          }
        }
      );

      // Simplified approach - just filter based on creator rights
      this.resourcesCreatorRights =
        this.kommonitorDataExchangeService.accessControl?.filter((elem) =>
          creatorRights.includes(elem.name)
        ) || [];
    } else {
      this.resourcesCreatorRights = [];
    }
  }

  private refreshRoles(orgUnitId?: string) {
    let permissionIds_ownerUnit: string[] = [];

    if (orgUnitId) {
      const accessControl = this.kommonitorDataExchangeService.getAccessControlById(orgUnitId);
      permissionIds_ownerUnit =
        accessControl?.permissions
          ?.filter(
            (permission) =>
              permission.permissionLevel === 'viewer' || permission.permissionLevel === 'editor'
          )
          .map((permission) => permission.permissionId) || [];
    }

    // Set datasetOwner flags
    this.kommonitorDataExchangeService.accessControl?.forEach((item) => {
      item.datasetOwner = item.organizationalUnitId === orgUnitId;
    });

    // Build the role management grid options
    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'spatialUnitAddRoleManagementTable',
      this.roleManagementTableOptions,
      this.kommonitorDataExchangeService.accessControl || [],
      permissionIds_ownerUnit,
      true
    );

    // Extract column definitions and row data for ag-grid-angular and rebuild grid config
    if (this.roleManagementTableOptions) {
      this.roleManagementColumnDefs = this.roleManagementTableOptions.columnDefs || [];
      this.roleManagementRowData = this.roleManagementTableOptions.rowData || [];

      // Build grid configuration (this will use the components from roleManagementTableOptions)
      this.buildRoleManagementGridConfig();

      // If grid is already initialized, update the data and grid options
      if (this.roleManagementGridApi) {
        // Update data
        this.roleManagementGridApi.setRowData(this.roleManagementRowData);
        this.roleManagementGridApi.setColumnDefs(this.roleManagementColumnDefs);

        // Refresh the grid to ensure it updates
        setTimeout(() => {
          if (this.roleManagementGridApi) {
            this.roleManagementGridApi.refreshCells();
            this.roleManagementGridApi.redrawRows();
          }
        }, 100);
      }
    }
  }

  private setupEventListeners() {
    // Note: In Angular, we typically use subscription to broadcast events
    // For now, we'll handle these events in the appropriate service calls
    // The original AngularJS component used $scope.$on which is not available in Angular
  }

  checkSpatialUnitName() {
    this.spatialUnitLevelInvalid = false;
    const level = this.spatialUnitLevel;

    if (level) {
      this.availableSpatialUnits.forEach((spatialUnit) => {
        if (spatialUnit.spatialUnitLevel === level) {
          this.spatialUnitLevelInvalid = true;
          return;
        }
      });
    }
  }

  checkSpatialUnitHierarchy() {
    this.hierarchyInvalid = false;

    // smaller indices represent higher spatial units
    // i.e. city districts will have a smaller index than building blocks
    if (this.nextLowerHierarchySpatialUnit && this.nextUpperHierarchySpatialUnit) {
      let indexOfLowerHierarchyUnit: number;
      let indexOfUpperHierarchyUnit: number;

      for (let i = 0; i < this.kommonitorDataExchangeService.availableSpatialUnits.length; i++) {
        const spatialUnit = this.kommonitorDataExchangeService.availableSpatialUnits[i];
        if (spatialUnit.spatialUnitLevel === this.nextLowerHierarchySpatialUnit.spatialUnitLevel) {
          indexOfLowerHierarchyUnit = i;
        }
        if (spatialUnit.spatialUnitLevel === this.nextUpperHierarchySpatialUnit.spatialUnitLevel) {
          indexOfUpperHierarchyUnit = i;
        }
      }

      if (indexOfLowerHierarchyUnit! <= indexOfUpperHierarchyUnit!) {
        // failure
        this.hierarchyInvalid = true;
      }
    }
  }

  checkPeriodOfValidity() {
    // Normalize to ISO strings first (handles NgbDateStruct or string)
    const startIso = this.toIsoDateString(this.periodOfValidity.startDate);
    const endIso = this.toIsoDateString(this.periodOfValidity.endDate);

    // Use service validation (guards optional end)
    const validation = this.kommonitorDataExchangeService.validatePeriodOfValidity(
      startIso as any,
      endIso as any
    );

    this.periodOfValidityInvalid = !validation.isValid;

    if (!validation.isValid && validation.error) {
      // no action required here
    }
  }

  // Attribute mapping methods
  onAddOrUpdateAttributeMapping() {
    const tmpAttributeMapping_adminView = {
      sourceName: this.attributeMapping_sourceAttributeName,
      destinationName: this.attributeMapping_destinationAttributeName,
      dataType: this.attributeMapping_attributeType,
    };

    let processed = false;

    for (let index = 0; index < this.attributeMappings_adminView.length; index++) {
      const attributeMappingEntry_adminView = this.attributeMappings_adminView[index];

      if (attributeMappingEntry_adminView.sourceName === tmpAttributeMapping_adminView.sourceName) {
        // replace object
        this.attributeMappings_adminView[index] = tmpAttributeMapping_adminView;
        processed = true;
        break;
      }
    }

    if (!processed) {
      // new entry
      this.attributeMappings_adminView.push(tmpAttributeMapping_adminView);
    }

    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    this.attributeMapping_attributeType = attributeMappingTypes[0];
  }

  onClickEditAttributeMapping(attributeMappingEntry: any) {
    this.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
    this.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
    this.attributeMapping_attributeType = attributeMappingEntry.dataType;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any) {
    for (let index = 0; index < this.attributeMappings_adminView.length; index++) {
      if (this.attributeMappings_adminView[index].sourceName === attributeMappingEntry.sourceName) {
        // remove object
        this.attributeMappings_adminView.splice(index, 1);
        break;
      }
    }
  }

  onChangeConverter(_schema?: any) {
    this.schema = this.converter.schemas ? this.converter.schemas[0] : undefined;
    this.mimeType = this.converter.mimeTypes ? this.converter.mimeTypes[0] : undefined;
    this.converterParameterValues = {};
  }

  onChangeMimeType(mimeType: any) {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any) {
    // Handle datasource type change
    this.datasourceType = datasourceType;
    // Reset related fields when datasource type changes
    this.selectedDataSourceFile = null;
    this.spatialUnitDataSourceIdProperty = '';
    this.spatialUnitDataSourceNameProperty = '';
    this.bboxType = '';
    this.bboxRefSpatialUnit = null;
    this.bbox_minx = null;
    this.bbox_miny = null;
    this.bbox_maxx = null;
    this.bbox_maxy = null;
    this.datasourceTypeParameterValues = {};
  }

  onSpatialUnitFileSelected(event: any) {
    const file = event?.target?.files?.[0] as File | undefined;
    this.selectedDataSourceFile = file ?? null;
  }

  onChangeOutlineDashArray(outlineDashArrayObject: LinePatternOption | null) {
    // Handle outline dash array change
    this.selectedOutlineDashArrayObject = outlineDashArrayObject;
    this.outlineDashArray = outlineDashArrayObject;

    // No need to update dropdown display or close dropdown - handled by km-line-pattern-picker
  }

  // Color picker logic removed; handled by km-color-picker

  // Date picker methods
  // Datepicker toggling handled by km-date-picker

  // Ensure valid date or set to today's date on blur
  // Date normalization handled by km-date-picker

  // Importer object building methods
  async buildImporterObjects() {
    this.converterDefinition = this.buildConverterDefinition();

    this.datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();

    this.propertyMappingDefinition = this.buildPropertyMappingDefinition();

    this.postBody_spatialUnits = this.buildPostBody_spatialUnits();

    const allValid =
      this.converterDefinition &&
      this.datasourceTypeDefinition &&
      this.propertyMappingDefinition &&
      this.postBody_spatialUnits;

    if (!allValid) {
      // no action required here
    }

    return allValid;
  }

  buildConverterDefinition() {
    const result = this.kommonitorImporterHelperService.buildConverterDefinition(
      this.converter,
      'converterParameter_spatialUnitAdd_',
      this.schema,
      this.mimeType,
      this.converterParameterValues
    );

    return result;
  }

  async buildDatasourceTypeDefinition() {
    try {
      // Prefer robust Angular-native handling for FILE uploads
      if (this.datasourceType?.type === 'FILE') {
        // Use persisted file across step changes
        let file: File | undefined | null = this.selectedDataSourceFile;
        if (!file) {
          const inputEl = this.spatialUnitDataSourceInput?.nativeElement as
            | HTMLInputElement
            | undefined;
          file = inputEl?.files?.[0];
        }
        if (!file) {
          return null;
        }
        const uploadedName = await this.kommonitorImporterHelperService.uploadNewFile(
          file,
          file.name
        );
        return {
          type: 'FILE',
          parameters: [{ name: 'NAME', value: uploadedName }],
        };
      }

      const formValues: { [key: string]: string } = {
        ...this.datasourceTypeParameterValues,
        bboxType: this.bboxType as any,
        bboxRef: this.bboxRefSpatialUnit as any,
        bbox_minx: this.bbox_minx as any,
        bbox_miny: this.bbox_miny as any,
        bbox_maxx: this.bbox_maxx as any,
        bbox_maxy: this.bbox_maxy as any,
      } as any;

      const result = await this.kommonitorImporterHelperService.buildDatasourceTypeDefinition(
        this.datasourceType,
        'datasourceTypeParameter_spatialUnitAdd_',
        'spatialUnitDataSourceInput',
        formValues
      );

      return result;
    } catch (error: any) {
      this.notificationService.showError(
        'Fehler beim Aufbau der Datenquellen-Definition: ' + this.getErrorMessage(error)
      );
      this.loadingData = false;
      return null;
    }
  }

  buildPropertyMappingDefinition() {
    const result = this.kommonitorImporterHelperService.buildPropertyMapping_spatialResource(
      this.spatialUnitDataSourceNameProperty,
      this.spatialUnitDataSourceIdProperty,
      this.validityStartDate_perFeature,
      this.validityEndDate_perFeature,
      '',
      this.keepAttributes,
      this.keepMissingValues,
      this.attributeMappings_adminView
    );

    return result;
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

  buildPostBody_spatialUnits() {
    const postBody: any = {
      geoJsonString: '', // will be set by importer
      metadata: {
        note: this.metadata.note,
        literature: this.metadata.literature,
        updateInterval: this.metadata.updateInterval?.apiName,
        sridEPSG: this.metadata.sridEPSG,
        datasource: this.metadata.datasource,
        contact: this.metadata.contact,
        lastUpdate: this.toIsoDateString(this.metadata.lastUpdate),
        description: this.metadata.description,
        databasis: this.metadata.databasis,
      },
      jsonSchema: undefined,
      permissions: [] as string[], // Changed from allowedRoles to match original
      nextLowerHierarchyLevel: this.nextLowerHierarchySpatialUnit
        ? this.nextLowerHierarchySpatialUnit.spatialUnitLevel
        : null,
      spatialUnitLevel: this.spatialUnitLevel,
      periodOfValidity: {
        endDate: this.toIsoDateString(
          this.periodOfValidity && this.periodOfValidity.endDate
            ? this.periodOfValidity.endDate
            : null
        ),
        startDate: this.toIsoDateString(
          this.periodOfValidity && this.periodOfValidity.startDate
            ? this.periodOfValidity.startDate
            : null
        ),
      },
      nextUpperHierarchyLevel: this.nextUpperHierarchySpatialUnit
        ? this.nextUpperHierarchySpatialUnit.spatialUnitLevel
        : null,
      // Add missing outline layer properties
      isOutlineLayer: this.isOutlineLayer,
      outlineColor: this.outlineColor,
      outlineWidth: this.outlineWidth,
      outlineDashArrayString: this.selectedOutlineDashArrayObject?.dashArrayValue,
      ownerId: this.ownerOrganization,
      isPublic: this.isPublic,
    };

    if (this.roleManagementTableOptions) {
      const roleIds = this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions
      );
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          postBody.permissions.push(roleId);
        }
      }
    }

    return postBody;
  }

  async addSpatialUnit() {
    this.loadingData = true;
    this.importerErrors = [];

    const allDataSpecified = await this.buildImporterObjects();

    if (!allDataSpecified) {
      // TODO: Add form validation here
      this.loadingData = false;
      return;
    } else {
      // TODO verify input
      // TODO Create and perform POST Request with loading screen

      let newSpatialUnitResponse_dryRun: any = undefined;
      try {
        newSpatialUnitResponse_dryRun =
          await this.kommonitorImporterHelperService.registerNewSpatialUnit(
            this.converterDefinition,
            this.datasourceTypeDefinition,
            this.propertyMappingDefinition,
            this.postBody_spatialUnits,
            true // isDryRun
          );

        if (
          !this.kommonitorImporterHelperService.importerResponseContainsErrors(
            newSpatialUnitResponse_dryRun
          )
        ) {
          // all good, really execute the request to import data against data management API
          const newSpatialUnitResponse =
            await this.kommonitorImporterHelperService.registerNewSpatialUnit(
              this.converterDefinition,
              this.datasourceTypeDefinition,
              this.propertyMappingDefinition,
              this.postBody_spatialUnits,
              false // isDryRun
            );

          this.broadcastService.broadcast(BroadcastMessage.RefreshSpatialUnitOverviewTable, {
            crudType: 'add',
            targetSpatialUnitId:
              this.kommonitorImporterHelperService.getIdFromImporterResponse(
                newSpatialUnitResponse
              ),
          });

          // refresh all admin dashboard diagrams due to modified metadata
          setTimeout(() => {
            this.broadcastService.broadcast(BroadcastMessage.RefreshAdminDashboardDiagrams);
          }, 500);

          const importedFeatures =
            this.kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(
              newSpatialUnitResponse
            );
          this.importedFeatures = importedFeatures || [];

          this.loadingData = false;
          const featureCount = this.importedFeatures.length;
          this.notificationService.showSuccess(
            `Eine neue Raumebene mit Namen "${this.postBody_spatialUnits.spatialUnitLevel}" wurde registriert` +
              (featureCount > 0 ? ` (${featureCount} Raumeinheiten importiert).` : '.')
          );
          this.activeModal.close({ action: 'added' });
        } else {
          // Dry-run reported import errors: keep the modal open and list the
          // affected feature IDs inline; summarise via a toast.
          const errors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(
            newSpatialUnitResponse_dryRun
          );
          this.importerErrors = errors || [];

          this.loadingData = false;
          this.notificationService.showError(
            'Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf.'
          );
        }
      } catch (error: any) {
        if (newSpatialUnitResponse_dryRun) {
          const errors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(
            newSpatialUnitResponse_dryRun
          );
          this.importerErrors = errors || [];
        }

        this.loadingData = false;
        this.notificationService.showError(
          'Fehler bei der Registrierung der Raumebene: ' + this.getErrorMessage(error)
        );
      }
    }
  }

  onSubmit() {
    if (!this.spatialUnitLevelInvalid && !this.hierarchyInvalid) {
      this.addSpatialUnit();
    } else {
      this.loadingData = false;
    }
  }

  // Multi-step navigation
  nextStep() {
    const maxSteps = this.kommonitorDataExchangeService.enableKeycloakSecurity ? 4 : 3;
    if (this.currentStep < maxSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    const maxSteps = this.kommonitorDataExchangeService.enableKeycloakSecurity ? 4 : 3;

    // Validate step range
    if (step < 1 || step > maxSteps) {
      return;
    }

    // For now, allow navigation to any step for testing
    // TODO: Add validation back once basic navigation works
    this.currentStep = step;
  }

  // Import/Export functionality
  onImportSpatialUnitAddMetadata() {
    this.spatialUnitMetadataImportError = '';
    if (this.metadataImportFile) {
      this.metadataImportFile.nativeElement.click();
    }
  }

  onImportSpatialUnitAddMappingConfig() {
    this.spatialUnitMappingConfigImportError = '';
    if (this.mappingConfigImportFile) {
      this.mappingConfigImportFile.nativeElement.click();
    }
  }

  onMetadataFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.parseMetadataFromFile(file);
    }
  }

  onMappingConfigFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.parseMappingConfigFromFile(file);
    }
  }

  parseMetadataFromFile(file: File) {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMetadataFile(event);
      } catch {
        this.spatialUnitMetadataImportError = 'Uploaded Metadata File cannot be parsed correctly';
      }
    };

    fileReader.readAsText(file);
  }

  parseMappingConfigFromFile(file: File) {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMappingConfigFile(event);
      } catch {
        this.spatialUnitMappingConfigImportError =
          'Uploaded MappingConfig File cannot be parsed correctly';
      }
    };

    fileReader.readAsText(file);
  }

  parseFromMetadataFile(event: any) {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      this.spatialUnitMetadataImportError =
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      return;
    }

    // Parse metadata
    this.metadata = {};
    this.metadata.note = this.metadataImportSettings.metadata.note;
    this.metadata.literature = this.metadataImportSettings.metadata.literature;

    // Use the same array instance as the select options to ensure object identity matches
    const intervalOptions =
      this.updateIntervalOptions && this.updateIntervalOptions.length
        ? this.updateIntervalOptions
        : this.kommonitorDataExchangeService.updateIntervalOptions;

    for (const option of intervalOptions) {
      if (option.apiName === this.metadataImportSettings.metadata.updateInterval) {
        this.metadata.updateInterval = option;
        break;
      }
    }

    this.metadata.sridEPSG = this.metadataImportSettings.metadata.sridEPSG;
    this.metadata.datasource = this.metadataImportSettings.metadata.datasource;
    this.metadata.contact = this.metadataImportSettings.metadata.contact;
    this.metadata.lastUpdate = this.metadataImportSettings.metadata.lastUpdate;
    this.metadata.description = this.metadataImportSettings.metadata.description;
    this.metadata.databasis = this.metadataImportSettings.metadata.databasis;

    // Parse role management (changed from allowedRoles to permissions)
    if (this.kommonitorDataExchangeService.accessControl) {
      this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
        'spatialUnitAddRoleManagementTable',
        this.roleManagementTableOptions,
        this.kommonitorDataExchangeService.accessControl,
        this.metadataImportSettings.permissions || [], // Changed from allowedRoles
        true
      );
    }

    // Parse hierarchy
    this.kommonitorDataExchangeService.availableSpatialUnits.forEach((spatialUnit: any) => {
      if (spatialUnit.spatialUnitLevel === this.metadataImportSettings.nextLowerHierarchyLevel) {
        this.nextLowerHierarchySpatialUnit = spatialUnit;
      }
      if (spatialUnit.spatialUnitLevel === this.metadataImportSettings.nextUpperHierarchyLevel) {
        this.nextUpperHierarchySpatialUnit = spatialUnit;
      }
    });

    // Parse outline layer settings
    this.isOutlineLayer = this.metadataImportSettings.isOutlineLayer || false;
    this.outlineColor = this.metadataImportSettings.outlineColor || '#000000';
    this.outlineWidth = this.metadataImportSettings.outlineWidth || 3;

    this.kommonitorDataExchangeService.availableLoiDashArrayObjects?.forEach((option: any) => {
      if (option.dashArrayValue === this.metadataImportSettings.outlineDashArrayString) {
        this.selectedOutlineDashArrayObject = {
          label: option.label,
          dashArrayValue: option.dashArrayValue,
          svgString: option.svgString,
        };
        this.onChangeOutlineDashArray(this.selectedOutlineDashArrayObject);
      }
    });

    // Line pattern picker will handle the display automatically

    this.spatialUnitLevel = this.metadataImportSettings.spatialUnitLevel;
    this.ownerOrganization = this.metadataImportSettings.ownerId;
    this.isPublic = this.metadataImportSettings.isPublic;

    // Initialize metadata structures
    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;
  }

  parseFromMappingConfigFile(event: any) {
    this.mappingConfigImportSettings = JSON.parse(event.target.result);

    if (
      !this.mappingConfigImportSettings.converter ||
      !this.mappingConfigImportSettings.dataSource ||
      !this.mappingConfigImportSettings.propertyMapping
    ) {
      this.spatialUnitMappingConfigImportError =
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      return;
    }

    this.converter = undefined;
    const converters = this.kommonitorImporterHelperService.getAvailableConverters();
    for (const converter of converters) {
      if (converter.name === this.mappingConfigImportSettings.converter.name) {
        this.converter = converter;
        break;
      }
    }

    this.schema = '';
    if (
      this.converter &&
      this.converter.schemas &&
      this.mappingConfigImportSettings.converter.schema
    ) {
      for (const schema of this.converter.schemas) {
        if (schema === this.mappingConfigImportSettings.converter.schema) {
          this.schema = schema;
        }
      }
    }

    this.mimeType = '';
    if (
      this.converter &&
      this.converter.mimeTypes &&
      this.mappingConfigImportSettings.converter.mimeType
    ) {
      for (const mimeType of this.converter.mimeTypes) {
        if (mimeType === this.mappingConfigImportSettings.converter.mimeType) {
          this.mimeType = mimeType;
        }
      }
    }

    // Populate converter parameters (e.g., CRS) from imported mapping config
    // Defer to ensure inputs exist in the DOM after bindings render
    setTimeout(() => {
      const params = this.mappingConfigImportSettings?.converter?.parameters || [];
      if (this.converter && Array.isArray(params)) {
        for (const convParameter of params) {
          const el = document.getElementById(
            `converterParameter_spatialUnitAdd_${convParameter.name}`
          ) as HTMLInputElement | null;
          if (el) {
            el.value = convParameter.value ?? '';
          }
          this.converterParameterValues[convParameter.name] = convParameter.value ?? '';
        }
      }
    }, 0);

    this.datasourceType = null;
    const datasourceTypes = this.kommonitorImporterHelperService.getAvailableDatasourceTypes();
    for (const datasourceType of datasourceTypes) {
      if (datasourceType.type === this.mappingConfigImportSettings.dataSource.type) {
        this.datasourceType = datasourceType;
        break;
      }
    }

    // Populate datasource type params and bbox
    this.datasourceTypeParameterValues = {};
    const dsParams = this.mappingConfigImportSettings?.dataSource?.parameters || [];
    const bboxTypeParam = dsParams.find((p: any) => p.name === 'bboxType');
    if (bboxTypeParam) {
      this.bboxType = bboxTypeParam.value || '';
    }
    const bboxParam = dsParams.find((p: any) => p.name === 'bbox');
    if (bboxParam && typeof bboxParam.value === 'string') {
      if (this.bboxType === 'ref') {
        this.bboxRefSpatialUnit = bboxParam.value;
      } else {
        const parts = bboxParam.value.split(',');
        if (parts.length === 4) {
          this.bbox_minx = parts[0];
          this.bbox_miny = parts[1];
          this.bbox_maxx = parts[2];
          this.bbox_maxy = parts[3];
        }
      }
    }
    for (const p of dsParams) {
      if (p.name !== 'bbox' && p.name !== 'bboxType') {
        this.datasourceTypeParameterValues[p.name] = p.value ?? '';
      }
    }

    // Property Mapping
    this.spatialUnitDataSourceNameProperty =
      this.mappingConfigImportSettings.propertyMapping.nameProperty;
    this.spatialUnitDataSourceIdProperty =
      this.mappingConfigImportSettings.propertyMapping.identifierProperty;
    this.validityStartDate_perFeature =
      this.mappingConfigImportSettings.propertyMapping.validStartDateProperty;
    this.validityEndDate_perFeature =
      this.mappingConfigImportSettings.propertyMapping.validEndDateProperty;
    this.keepAttributes = this.mappingConfigImportSettings.propertyMapping.keepAttributes;
    this.keepMissingValues =
      this.mappingConfigImportSettings.propertyMapping.keepMissingOrNullValueAttributes;
    this.attributeMappings_adminView = [];

    for (const attributeMapping of this.mappingConfigImportSettings.propertyMapping.attributes) {
      const tmpEntry: any = {
        sourceName: attributeMapping.name,
        destinationName: attributeMapping.mappingName,
      };

      const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
      for (const dataType of attributeMappingTypes) {
        if (dataType.apiName === attributeMapping.type) {
          tmpEntry.dataType = dataType;
        }
      }

      this.attributeMappings_adminView.push(tmpEntry);
    }

    if (this.mappingConfigImportSettings.periodOfValidity) {
      this.periodOfValidity = {
        startDate: this.mappingConfigImportSettings.periodOfValidity.startDate || '',
        endDate: this.mappingConfigImportSettings.periodOfValidity.endDate || '',
      };
      this.periodOfValidityInvalid = false;
    }

    // Initialize metadata structures
    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;

    // Line pattern picker will handle the display automatically
  }

  onExportSpatialUnitAddMetadataTemplate() {
    const metadataJSON = JSON.stringify(
      this.kommonitorDataExchangeService.spatialUnitMetadataStructure
    );
    const fileName = 'Raumebene_Metadaten_Vorlage_Export.json';
    this.downloadFile(metadataJSON, fileName);
  }

  onExportSpatialUnitAddMetadata() {
    // Use service method to build export structure
    const metadataExport = this.kommonitorDataExchangeService.buildSpatialUnitMetadataExport(
      this.metadata,
      this.spatialUnitLevel,
      this.nextLowerHierarchySpatialUnit?.spatialUnitLevel || null,
      this.nextUpperHierarchySpatialUnit?.spatialUnitLevel || null,
      this.isOutlineLayer,
      this.outlineColor,
      this.outlineWidth,
      this.selectedOutlineDashArrayObject?.dashArrayValue || null
    );

    // Add component-specific properties
    metadataExport.permissions = [];
    if (this.roleManagementTableOptions) {
      const roleIds = this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions
      );
      metadataExport.permissions.push(...roleIds);
    }

    // Add owner properties
    metadataExport.ownerId = this.ownerOrganization;
    metadataExport.isPublic = this.isPublic;

    const name = this.spatialUnitLevel;
    const fileName = `Raumebene_Metadaten_Export${name ? '-' + name : ''}.json`;
    this.downloadFile(JSON.stringify(metadataExport), fileName);
  }

  async onExportSpatialUnitAddMappingConfig() {
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

    const name = this.spatialUnitLevel;
    const metadataJSON = JSON.stringify(mappingConfigExport);
    let fileName = 'KomMonitor-Import-Mapping-Konfiguration_Export';

    if (name) {
      fileName += '-' + name;
    }

    fileName += '.json';
    this.downloadFile(metadataJSON, fileName);
  }

  private downloadFile(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'application/json' });
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

  // Metadata structure for export
  get spatialUnitMetadataStructure() {
    return this.kommonitorDataExchangeService.spatialUnitMetadataStructure;
  }

  get spatialUnitMappingConfigStructure_pretty() {
    return this.kommonitorDataExchangeService.syntaxHighlightJSON(
      this.kommonitorImporterHelperService.mappingConfigStructure
    );
  }

  resetForm() {
    this.currentStep = 1;
    this.spatialUnitLevel = '';
    this.spatialUnitLevelInvalid = false;
    this.metadata = {
      description: '',
      databasis: '',
      datasource: '',
      contact: '',
      updateInterval: null,
      lastUpdate: '',
      literature: '',
      note: '',
      sridEPSG: 4326,
    };
    this.nextLowerHierarchySpatialUnit = null;
    this.nextUpperHierarchySpatialUnit = null;
    this.hierarchyInvalid = false;
    this.periodOfValidity = { startDate: '', endDate: '' };
    this.periodOfValidityInvalid = false;

    // Reset outline layer settings
    this.isOutlineLayer = false;
    this.outlineColor = '#000000';
    this.outlineWidth = 3;
    this.outlineDashArray = null;
    const availableOptions = this.kommonitorDataExchangeService.availableLoiDashArrayObjects || [];
    if (availableOptions.length > 0) {
      this.selectedOutlineDashArrayObject = {
        label: availableOptions[0].label,
        dashArrayValue: availableOptions[0].dashArrayValue,
        svgString: availableOptions[0].svgString,
      };
    } else {
      this.selectedOutlineDashArrayObject = null;
    }
    this.spatialUnitMappingConfigStructure = {};

    // Line pattern picker will handle the display automatically

    this.converter = null;
    this.schema = '';
    this.mimeType = '';
    this.datasourceType = null;
    this.selectedDataSourceFile = null;
    this.spatialUnitDataSourceIdProperty = '';
    this.spatialUnitDataSourceNameProperty = '';
    this.validityStartDate_perFeature = '';
    this.validityEndDate_perFeature = '';
    this.converterParameterValues = {};
    this.datasourceTypeParameterValues = {};
    this.bboxType = '';
    this.bboxRefSpatialUnit = null;
    this.bbox_minx = null;
    this.bbox_miny = null;
    this.bbox_maxx = null;
    this.bbox_maxy = null;
    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMappings_adminView = [];
    this.keepAttributes = true;
    this.keepMissingValues = true;
    this.importerErrors = [];
    this.importedFeatures = [];
    this.converterDefinition = null;
    this.datasourceTypeDefinition = null;
    this.propertyMappingDefinition = null;
    this.postBody_spatialUnits = null;
    this.idPropertyNotFound = false;
    this.namePropertyNotFound = false;
    this.spatialUnitDataSourceInputInvalid = false;
    this.spatialUnitDataSourceInputInvalidReason = '';

    // Reset role management
    this.ownerOrganization = '';
    this.ownerOrgFilter = '';
    this.isPublic = false;
    this.resourcesCreatorRights = [];
    this.showRoleForm = false;

    // Reset role management table
    if (this.kommonitorDataExchangeService.accessControl) {
      this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
        'spatialUnitAddRoleManagementTable',
        this.roleManagementTableOptions,
        this.kommonitorDataExchangeService.accessControl,
        [],
        true
      );
    }

    this.metadataImportSettings = null;
    this.mappingConfigImportSettings = null;
    this.spatialUnitMetadataImportError = '';
    this.spatialUnitMappingConfigImportError = '';
    this.spatialUnitDataSourceIdPropertyInvalid = false;
    this.spatialUnitDataSourceNamePropertyInvalid = false;
    this.spatialUnitMappingConfigStructure = {};
    this.spatialUnitMetadataStructure_pretty = '';
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    this.attributeMapping_attributeType = attributeMappingTypes[0];
  }

  private getErrorMessage(error: any): string {
    if (typeof error?.error === 'string') {
      return error.error;
    }
    if (typeof error?.error?.message === 'string') {
      return error.error.message;
    }
    if (typeof error?.message === 'string') {
      return error.message;
    }
    return 'Unbekannter Fehler';
  }

  hideMetadataErrorAlert() {
    this.spatialUnitMetadataImportError = '';
  }

  hideMappingConfigErrorAlert() {
    this.spatialUnitMappingConfigImportError = '';
  }

  onChangeOwner(ownerOrganization: any) {
    // Handle owner organization change
    this.ownerOrganization = ownerOrganization;

    // Refresh roles for the selected organization
    this.refreshRoles(ownerOrganization);

    // Show/hide the role form based on whether an organization is selected
    this.showRoleForm = !!ownerOrganization;
  }

  onChangeIsPublic(isPublic: boolean) {
    // Handle public access change
    this.isPublic = isPublic;
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }

  private buildRoleManagementGridConfig() {
    // Use service methods for base grid configuration
    this.roleManagementDefaultColDef = this.roleManagementHelper.buildRoleManagementDefaultColDef();
    const baseGridOptions = this.roleManagementHelper.buildRoleManagementGridOptionsPublic(
      this.roleManagementTableOptions?.components
    );

    // Apply component-specific overrides
    this.roleManagementGridOptions = {
      ...baseGridOptions,
      onGridReady: (params) => {
        this.onRoleManagementGridReady(params);
      },
      onFirstDataRendered: (event) => {
        this.onRoleManagementFirstDataRendered(event);
      },
      onColumnResized: (event) => {
        this.onRoleManagementColumnResized(event);
      },
    };
  }
}
