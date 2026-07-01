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
import { SpatialUnitRefreshRequest } from '../spatial-unit-refresh.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbActiveModal, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { KommonitorImporterHelperService } from '../../../../../services/adminSpatialUnit/kommonitor-importer-helper.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { KommonitorDataExchangeService } from '../../../../../services/adminSpatialUnit/kommonitor-data-exchange.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi } from 'ag-grid-community';

import { KmColorPickerComponent } from '../../../customElements/color-picker/km-color-picker.component';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { FormsModule } from '@angular/forms';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';

import { KmDatePickerComponent } from '../../../customElements/date-picker/km-date-picker.component';
import {
  StepperComponent,
  StepperStep,
} from 'components/ngComponents/common/stepper/stepper.component';
import {
  addOrUpdateAttributeMapping,
  getErrorMessage,
  removeAttributeMapping,
  toIsoDateString,
} from '../spatial-unit-import.util';
import type {
  AttributeMappingRow,
  DatasourceType,
  ImporterObjectsConfig,
  MappingConfigImport,
} from '../spatial-unit-import.model';
import { SpatialUnitImportService } from 'services/spatial-unit-import-service/spatial-unit-import.service';

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
    StepperComponent,
  ],
  standalone: true,
})
export class SpatialUnitAddModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  kommonitorImporterHelperService = inject(KommonitorImporterHelperService);
  private roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private broadcastService = inject(BroadcastService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  private spatialUnitImportService = inject(SpatialUnitImportService);

  /** Emitted after a spatial unit was added so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();

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

  // Stepper labels — the security step is only present when Keycloak is enabled,
  // mirroring the conditional fieldsets below. References are stable so the
  // stepper only re-evaluates when the security flag actually changes.
  private readonly stepsWithSecurity: StepperStep[] = [
    { label: 'Metadaten der Raumebene' },
    { label: 'Allgemeine Metadaten' },
    { label: 'Zugriffsschutz und Eigentümerschaft' },
    { label: 'Räumlicher Datensatz' },
  ];
  private readonly stepsWithoutSecurity: StepperStep[] = [
    { label: 'Metadaten der Raumebene' },
    { label: 'Allgemeine Metadaten' },
    { label: 'Räumlicher Datensatz' },
  ];
  get steps(): StepperStep[] {
    return this.kommonitorDataExchangeService.enableKeycloakSecurity
      ? this.stepsWithSecurity
      : this.stepsWithoutSecurity;
  }

  // Form data
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
  outlineWidth = 3;

  // Period of validity
  periodOfValidity: { startDate: any; endDate: any } = {
    startDate: '',
    endDate: '',
  };
  periodOfValidityInvalid = false;

  // Available options
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  availableDatasourceTypes: DatasourceType[] = [];
  availableLoiDashArrayObjects: any[] = [];

  // Importer functionality
  converter: any = null;
  schema: string = '';
  mimeType: string = '';
  datasourceType: any = null;
  selectedDataSourceFile: File | null = null;
  spatialUnitDataSourceIdProperty = '';
  spatialUnitDataSourceNameProperty = '';

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
  attributeMappings_adminView: AttributeMappingRow[] = [];
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
  ownerOrganization = '';
  ownerOrgFilter = '';
  isPublic = false;
  resourcesCreatorRights: any[] = [];

  // Import/Export functionality
  metadataImportSettings: any = null;
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

  private roleManagementHeaderHeightSetter(): void {
    if (this.roleManagementGridApi) {
      const headerHeight = this.roleManagementHeaderHeightGetter();
      this.roleManagementGridApi.setGridOption('headerHeight', headerHeight);
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
      this.kommonitorDataExchangeService
        .fetchAccessControlMetadata(true)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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

      // The [rowData]/[columnDefs] bindings already pushed the reassigned fields
      // to the grid; just force a re-render of the checkbox cell renderers.
      if (this.roleManagementGridApi) {
        setTimeout(() => {
          if (this.roleManagementGridApi) {
            this.roleManagementGridApi.refreshCells();
            this.roleManagementGridApi.redrawRows();
          }
        }, 100);
      }
    }
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
    const startIso = toIsoDateString(this.periodOfValidity.startDate);
    const endIso = toIsoDateString(this.periodOfValidity.endDate);

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
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    this.attributeMapping_attributeType = attributeMappingTypes[0];
  }

  onClickEditAttributeMapping(attributeMappingEntry: any) {
    this.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
    this.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
    this.attributeMapping_attributeType = attributeMappingEntry.dataType;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any) {
    this.attributeMappings_adminView = removeAttributeMapping(
      this.attributeMappings_adminView,
      attributeMappingEntry.sourceName
    );
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

    // No need to update dropdown display or close dropdown - handled by km-line-pattern-picker
  }

  // Color picker logic removed; handled by km-color-picker

  // Date picker methods
  // Datepicker toggling handled by km-date-picker

  // Ensure valid date or set to today's date on blur
  // Date normalization handled by km-date-picker

  // Importer object building methods
  /** Snapshot of the current form state passed to the shared import service. */
  private importerObjectsConfig(): ImporterObjectsConfig {
    return {
      converter: this.converter,
      schema: this.schema,
      mimeType: this.mimeType,
      converterParameterPrefix: 'converterParameter_spatialUnitAdd_',
      converterParameterValues: this.converterParameterValues,
      datasourceType: this.datasourceType,
      datasourceTypeParameterPrefix: 'datasourceTypeParameter_spatialUnitAdd_',
      datasourceFileInputId: 'spatialUnitDataSourceInput',
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

  /** Add-modal data-source params: bbox fields are always included. */
  private assembleDatasourceFormValues(): { [key: string]: string } {
    return {
      ...this.datasourceTypeParameterValues,
      bboxType: this.bboxType,
      bboxRef: this.bboxRefSpatialUnit,
      bbox_minx: this.bbox_minx,
      bbox_miny: this.bbox_miny,
      bbox_maxx: this.bbox_maxx,
      bbox_maxy: this.bbox_maxy,
    } as { [key: string]: string };
  }

  async buildImporterObjects() {
    try {
      const definitions = await this.spatialUnitImportService.buildImporterObjects(
        this.importerObjectsConfig()
      );
      this.converterDefinition = definitions.converterDefinition;
      this.datasourceTypeDefinition = definitions.datasourceTypeDefinition;
      this.propertyMappingDefinition = definitions.propertyMappingDefinition;
      this.postBody_spatialUnits = this.buildPostBody_spatialUnits();

      return !!(
        this.converterDefinition &&
        this.datasourceTypeDefinition &&
        this.propertyMappingDefinition &&
        this.postBody_spatialUnits
      );
    } catch (error: any) {
      this.notificationService.showError(
        'Fehler beim Aufbau der Datenquellen-Definition: ' + getErrorMessage(error)
      );
      this.loadingData = false;
      return false;
    }
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
        lastUpdate: toIsoDateString(this.metadata.lastUpdate),
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
        endDate: toIsoDateString(
          this.periodOfValidity && this.periodOfValidity.endDate
            ? this.periodOfValidity.endDate
            : null
        ),
        startDate: toIsoDateString(
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

          this.refreshRequested.emit({
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
          'Fehler bei der Registrierung der Raumebene: ' + getErrorMessage(error)
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

  async onMappingConfigFileSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }
    this.spatialUnitMappingConfigImportError = '';
    try {
      const json = await this.spatialUnitImportService.readJsonFile(file);
      this.applyMappingConfig(this.spatialUnitImportService.parseMappingConfig(json));
    } catch (error) {
      this.spatialUnitMappingConfigImportError = getErrorMessage(error);
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

  /** Applies a parsed mapping-config onto this modal's form fields. */
  private applyMappingConfig(parsed: MappingConfigImport): void {
    this.converter = parsed.converter;
    this.schema = parsed.schema;
    this.mimeType = parsed.mimeType;
    this.converterParameterValues = parsed.converterParameters;
    this.datasourceType = parsed.datasourceType;
    this.datasourceTypeParameterValues = parsed.datasourceTypeParameters;

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
      this.periodOfValidityInvalid = false;
    }

    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;
  }

  /** Add-modal bbox interpretation: reads a dedicated bboxType parameter. */
  private applyBbox(dsParams: { name: string; value: string }[]): void {
    const bboxTypeParam = dsParams.find((p) => p.name === 'bboxType');
    if (bboxTypeParam) {
      this.bboxType = bboxTypeParam.value || '';
    }
    const bboxParam = dsParams.find((p) => p.name === 'bbox');
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
  }

  onExportSpatialUnitAddMetadataTemplate() {
    this.spatialUnitImportService.downloadJson(
      'Raumebene_Metadaten_Vorlage_Export.json',
      this.kommonitorDataExchangeService.spatialUnitMetadataStructure
    );
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
    this.spatialUnitImportService.downloadJson(fileName, metadataExport);
  }

  async onExportSpatialUnitAddMappingConfig() {
    const definitions = await this.spatialUnitImportService.buildImporterObjects(
      this.importerObjectsConfig()
    );

    // Use service method to build export structure
    const mappingConfigExport = this.kommonitorDataExchangeService.buildMappingConfigExport(
      definitions.converterDefinition,
      definitions.datasourceTypeDefinition,
      definitions.propertyMappingDefinition,
      this.periodOfValidity
    );

    const name = this.spatialUnitLevel;
    const fileName = `KomMonitor-Import-Mapping-Konfiguration_Export${name ? '-' + name : ''}.json`;
    this.spatialUnitImportService.downloadJson(fileName, mappingConfigExport);
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
    this.spatialUnitMetadataImportError = '';
    this.spatialUnitMappingConfigImportError = '';
    this.spatialUnitMappingConfigStructure = {};
    this.spatialUnitMetadataStructure_pretty = '';
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    this.attributeMapping_attributeType = attributeMappingTypes[0];
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
