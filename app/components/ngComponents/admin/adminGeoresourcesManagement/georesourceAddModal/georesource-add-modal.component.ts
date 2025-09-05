import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import { Subscription } from 'rxjs';
import { KommonitorGeoresourceDataExchangeService } from 'services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { KommonitorMultiStepFormHelperService } from 'services/adminGeoresourceUnit/kommonitor-multi-step-form-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from 'services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';

@Component({
  selector: 'georesource-add-modal-new',
  templateUrl: './georesource-add-modal.component.html',
  styleUrls: ['./georesource-add-modal.component.css'],
  providers: []
})
export class GeoresourceAddModalComponent implements OnInit {
  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('georesourceDataSourceInput', { static: false }) georesourceDataSourceInput!: ElementRef;
  @ViewChild('roleManagementGrid', { static: false }) roleManagementGrid!: AgGridAngular;

  // Multi-step form
  currentStep = 1;
  totalSteps = 4; // Will be adjusted based on security settings

  // Debug logging state (prevents spam in console)
  private lastDisabledReasonsKey: string = '';
  private lastDisabledReasonsLogMs: number = 0;
  private hasLoggedAccessControlEmptyWarning: boolean = false;

  // Form data
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  loadingData = false;

  // Basic form data
  datasetName = '';
  datasetNameInvalid = false;
  georesourceType = 'poi';
  isPOI = true;
  isLOI = false;
  isAOI = false;

  // Metadata
  metadata: any = {
    description: '',
    databasis: '',
    datasource: '',
    contact: '',
    updateInterval: null,
    lastUpdate: '',
    literature: '',
    note: '',
    sridEPSG: 4326
  };

  // Topic hierarchy
  georesourceTopic_mainTopic: any = null;
  georesourceTopic_subTopic: any = null;
  georesourceTopic_subsubTopic: any = null;
  georesourceTopic_subsubsubTopic: any = null;

  // Visual styling
  selectedPoiMarkerColor: any = null;
  selectedPoiSymbolColor: any = null;
  selectedLoiDashArrayObject: any = null;
  loiColor = '#bf3d2c';
  loiWidth = 3;
  aoiColor = '#bf3d2c';
  selectedPoiIconName = 'home';
  selectedPoiMarkerStyle = 'symbol';
  poiMarkerText = '';
  poiMarkerTextInvalid = false;
  
  // Custom dropdown state
  isMarkerStyleDropdownOpen = false;
  


  // Period of validity
  periodOfValidity: { startDate: string; endDate: string } = {
    startDate: '',
    endDate: ''
  };
  periodOfValidityInvalid = false;

  // Available options
  availableTopics: any[] = [];
  updateIntervalOptions: any[] = [];
  availablePoiMarkerColors: any[] = [];
  availableLoiDashArrayObjects: any[] = [];
  availableDatasourceTypes: any[] = [];
  
  // Loading states
  loadingTopics = false;

  // Importer functionality
  converter: any = null;
  schema: string = '';
  mimeType: string = '';
  encoding: string = 'UTF-8';
  datasourceType: any = null;
  georesourceDataSourceIdProperty = '';
  georesourceDataSourceIdPropertyInvalid = false;
  georesourceDataSourceNameProperty = '';
  georesourceDataSourceNamePropertyInvalid = false;

  // Bbox parameters for OGCAPI_FEATURES
  bboxType: string = '';
  bboxRefSpatialUnit: any = null;

  // Attribute mapping
  attributeMapping_sourceAttributeName = '';
  attributeMapping_destinationAttributeName = '';
  attributeMapping_data: any = null;
  attributeMapping_attributeType: any = null;
  attributeMappings_adminView: any[] = [];
  keepAttributes = true;
  keepMissingValues = true;

  // Persisted converter/datasource parameter values
  converterParameterValues: { [key: string]: string } = {};

  // Validity dates per feature
  validityStartDate_perFeature = '';
  validityEndDate_perFeature = '';

  // Event subscriptions for role management (like AngularJS component)
  private roleUpdateSubscription?: Subscription;
  private metadataLoadingSubscription?: Subscription;

  // Grid API references for role management
  roleManagementGridApi: any = null;
  roleManagementColumnApi: any = null;

  // Role management
  roleManagementTableOptions: any = null;
  ownerOrganization = '';
  ownerOrgFilter = '';
  isPublic = false;
  resourcesCreatorRights: any[] = [];
  filteredOrganizations: any[] = [];
  showRoleManagementForm = false;

  // GeoJSON data
  geoJsonString: any = null;
  georesource_asGeoJson: any = null;

  // Import/Export functionality
  metadataImportSettings: any = null;
  mappingConfigImportSettings: any = null;
  georesourceMetadataImportError = '';
  georesourceMappingConfigImportError = '';

  // Success/Error data
  successMessagePart = '';
  errorMessagePart = '';
  importerErrors: any[] = [];
  importedFeatures: any[] = [];

  // Metadata structure for import/export
  georesourceMetadataStructure: any = {
    "metadata": {
      "note": "an optional note",
      "literature": "optional text about literature",
      "updateInterval": "YEARLY|HALF_YEARLY|QUARTERLY|MONTHLY|ARBITRARY",
      "sridEPSG": 4326,
      "datasource": "text about data source",
      "contact": "text about contact details",
      "lastUpdate": "YYYY-MM-DD",
      "description": "description about spatial unit dataset",
      "databasis": "text about data basis",
    },
    // legacy naming used in AngularJS example
    "permissions": ['roleId'],
    "datasetName": "Name of georesource dataset",
    "isPOI": "boolean parameter for point of interest dataset - only one of isPOI, isLOI, isAOI can be true",
    "isLOI": "boolean parameter for lines of interest dataset - only one of isPOI, isLOI, isAOI can be true",
    "isAOI": "boolean parameter for area of interest dataset - only one of isPOI, isLOI, isAOI can be true",
    "poiSymbolBootstrap3Name": "glyphicon name of bootstrap 3 symbol to use for a POI resource",
    "poiSymbolColor": "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
    "loiDashArrayString": "dash array string value - e.g. 20 20",
    "poiMarkerColor": "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
    "loiColor": "color for lines of interest dataset",
    "loiWidth": "width for lines of interest dataset",
    "aoiColor": "color for area of interest dataset"
  };

  georesourceMetadataStructure_pretty = '';
  georesourceMappingConfigStructure_pretty = '';

  // Importer objects
  converterDefinition: any = null;
  datasourceTypeDefinition: any = null;
  propertyMappingDefinition: any = null;
  postBody_georesources: any = null;

  // Validation flags
  idPropertyNotFound = false;
  namePropertyNotFound = false;
  georesourceDataSourceInputInvalid = false;
  georesourceDataSourceInputInvalidReason = '';

  // Date helpers
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

  onLastUpdateBlur(): void {
    this.metadata.lastUpdate = this.ensureValidDateOrToday(this.metadata.lastUpdate);
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

  // Icon picker options
  iconPickerOptions: any = {
    align: 'center',
    arrowClass: 'btn-default',
    arrowPrevIconClass: 'fas fa-angle-left',
    arrowNextIconClass: 'fas fa-angle-right',
    cols: 10,
    footer: true,
    header: true,
    icon: 'glyphicon-home',
    iconset: 'glyphicon',
    labelHeader: '{0} von {1} Seiten',
    labelFooter: '{0} - {1} von {2} Icons',
    placement: 'bottom',
    rows: 6,
    search: true,
    searchText: 'Stichwortsuche (Bootstrap Glyphicons)',
    selectedClass: 'btn-success',
    unselectedClass: ''
  };

  constructor(
    public activeModal: NgbActiveModal,
    public kommonitorDataExchangeService: KommonitorGeoresourceDataExchangeService,
    public kommonitorImporterHelperService: KommonitorImporterHelperService,
    public kommonitorMultiStepFormHelperService: KommonitorMultiStepFormHelperService,
    public kommonitorDataGridHelperService: KommonitorGeoresourceDataGridHelperService,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    await this.initializeForm();
    this.setupEventListeners();
    
    // Add click outside handler for dropdown
    document.addEventListener('click', this.onDocumentClick.bind(this));
    

    
    // Initialize icon picker
    setTimeout(() => {
      this.initializeIconPicker();
    }, 500);
  }



  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.roleUpdateSubscription) {
      this.roleUpdateSubscription.unsubscribe();
    }
    if (this.metadataLoadingSubscription) {
      this.metadataLoadingSubscription.unsubscribe();
    }
    
    // Remove document click listener
    document.removeEventListener('click', this.onDocumentClick.bind(this));
    

  }

  private async initializeForm(): Promise<void> {
    // Initialize form with default values
    this.resetGeoresourceAddForm();
    
    // Ensure importer resources (converters, datasource types) are fetched before binding options
    try {
      await this.kommonitorImporterHelperService.fetchResourcesFromImporter();
    } catch (e) {
      console.warn('[GeoresourceAddModal] Failed to fetch importer resources', e);
    }
    
    // Load available options (including topics)
    await this.loadAvailableOptions();
    
    // Initialize role management data (async)
    await this.initializeResourcesCreatorRights();
    
    // Adjust total steps based on security settings
    this.totalSteps = this.kommonitorDataExchangeService.enableKeycloakSecurity ? 5 : 4;
  }

  private setupEventListeners(): void {
    // Listen for broadcast messages
    const broadcastSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'availableRolesUpdate') {
        this.refreshRoles();
      } else if (data.msg === 'initialMetadataLoadingCompleted') {
        this.refreshRoles();
      } else if (data.msg === 'topicsUpdated' || data.msg === 'refreshTopics') {
        this.loadTopicsData();
      }
    });
  }

  /**
   * Refresh topics data
   */
  async refreshTopics(): Promise<void> {
    await this.loadTopicsData();
  }



  // Initialize resources creator rights (for non-admin users)
  private async initializeResourcesCreatorRights() {
    try {
      // Try to load real access control data first
      await this.reloadAccessControlData();
    } catch (error) {
      console.warn('Failed to load access control data:', error);
      // Do not inject test data; keep empty to avoid showing fake organizations
      this.resourcesCreatorRights = [];
      this.filteredOrganizations = [];
    }
    
    // Initialize the role management table options with transformed data
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable',
      null,
      this.resourcesCreatorRights,
      []
    );
    
    // Initialize the role management table (like AngularJS component - initially hidden)
    this.showRoleManagementForm = false;
    this.refreshRoles();
  }

  private async loadAvailableOptions(): Promise<void> {
    // Load available options from services
    this.updateIntervalOptions = this.kommonitorDataExchangeService.updateIntervalOptions || [];
    this.availablePoiMarkerColors = this.kommonitorDataExchangeService.availablePoiMarkerColors || [];
    this.availableLoiDashArrayObjects = this.kommonitorDataExchangeService.availableLoiDashArrayObjects || [];
    this.availableDatasourceTypes = this.kommonitorImporterHelperService.getAvailableDatasourceTypes();
    if (!this.availableDatasourceTypes || this.availableDatasourceTypes.length === 0) {
      console.warn('[GeoresourceAddModal] No datasource types available from importer.');
    }

    // Ensure POI/LOI defaults after options are loaded
    if (!this.selectedPoiMarkerColor && this.availablePoiMarkerColors.length > 0) {
      this.selectedPoiMarkerColor = this.availablePoiMarkerColors[0];
    }
    if (!this.selectedPoiSymbolColor && this.availablePoiMarkerColors.length > 0) {
      // Prefer the second entry if present (legacy behavior), else fall back to first
      this.selectedPoiSymbolColor = this.availablePoiMarkerColors[1] || this.availablePoiMarkerColors[0];
    }
    if (!this.selectedLoiDashArrayObject && this.availableLoiDashArrayObjects.length > 0) {
      this.selectedLoiDashArrayObject = this.availableLoiDashArrayObjects[0];
    }
    
    // Initialize metadata structure pretty print
    this.georesourceMetadataStructure_pretty = this.kommonitorDataExchangeService.syntaxHighlightJSON(this.georesourceMetadataStructure);
    this.georesourceMappingConfigStructure_pretty = this.kommonitorDataExchangeService.syntaxHighlightJSON(this.kommonitorImporterHelperService.mappingConfigStructure);
    
    // Load topics data
    await this.loadTopicsData();
  }

  /**
   * Load topics data from the API
   */
  private async loadTopicsData(): Promise<void> {
    try {
      this.loadingTopics = true;
      
      const roles = this.kommonitorDataExchangeService.currentKeycloakLoginRoles;
      const topics = await this.kommonitorDataExchangeService.fetchTopicsMetadata(roles);
      
      if (topics && Array.isArray(topics)) {
        // Filter topics to only show main topics for georesources (like AngularJS component)
        this.availableTopics = this.filterTopicsForGeoresources(topics);
    
      } else {
        this.availableTopics = [];
      }
    } catch (error: any) {
      console.error('Error loading topics data:', error);
      this.availableTopics = [];
      this.errorMessage = 'Fehler beim Laden der Themen. Verwende Testdaten.';
    } finally {
      this.loadingTopics = false;
    }
  }

  /**
   * Filter topics to only show main topics for georesources (like AngularJS component)
   */
  private filterTopicsForGeoresources(topics: any[]): any[] {
    // First, try the exact AngularJS filter
    let filtered = topics.filter(topic => {
      return topic.topicType === 'main' && topic.topicResource === 'georesource';
    });
    
    // If no results, try alternative filtering approaches
    if (filtered.length === 0) {
      // Try filtering by topicType only
      filtered = topics.filter(topic => topic.topicType === 'main');
      
      if (filtered.length === 0) {
        // If still no results, show all topics that have subTopics (likely main topics)
        filtered = topics.filter(topic => topic.subTopics && Array.isArray(topic.subTopics));
      }
    }
    
    return filtered;
  }





  // Handle role management grid ready event
  onRoleManagementGridReady(params: any) {
    // Store API references
    this.roleManagementGridApi = params.api;
    this.roleManagementColumnApi = params.columnApi;
    
    // The grid is now ready and can be accessed via params.api
    if (params.api) {
      // Auto-size columns
      params.api.sizeColumnsToFit();
      // Ensure proper row heights
      try {
        params.api.resetRowHeights();
      } catch {}
      
      // Set the row data if we have it
      if (this.roleManagementTableOptions && this.roleManagementTableOptions.rowData) {
        params.api.setRowData(this.roleManagementTableOptions.rowData);
        try {
          params.api.resetRowHeights();
        } catch {}
      }
    }
  }

  // Handle role management first data rendered event
  onRoleManagementFirstDataRendered(params: any) {
    try {
      params.api.resetRowHeights();
      params.api.sizeColumnsToFit();
    } catch {}
  }

  // Handle role management column resized event
  onRoleManagementColumnResized(params: any) {
    try {
      params.api.resetRowHeights();
    } catch {}
  }

  // Handle role management model updated event
  onRoleManagementModelUpdated() {
    try {
      this.roleManagementGridApi?.resetRowHeights();
    } catch {}
  }

  // Handle role management viewport changed event
  onRoleManagementViewportChanged() {
    try {
      this.roleManagementGridApi?.resetRowHeights();
    } catch {}
  }

  // Refresh role management table
  refreshRoleManagementTable() {
    // Rebuild role management grid with current data
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.resourcesCreatorRights, 
      this.kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds()
    );
    
    // Refresh the grid if API is available
    if (this.roleManagementGridApi) {
      this.roleManagementGridApi.refreshCells();
      this.roleManagementGridApi.redrawRows();
    }
  }

  private refreshRoles(): void {
    // Check if access control data is available
    if (!this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
      // Clear grid when no access control data is available; do not inject test data
      this.roleManagementTableOptions = null;
      setTimeout(() => {
        if (this.roleManagementGrid && this.roleManagementGrid.api) {
          this.roleManagementGrid.api.setRowData([]);
          this.roleManagementGrid.api.refreshCells();
          this.roleManagementGrid.api.redrawRows();
        }
      }, 100);
      return;
    }
    
    // Get permission IDs for the selected organization (like AngularJS component)
    let permissionIds: string[] = [];
    if (this.ownerOrganization) {
      const accessControlItem = this.kommonitorDataExchangeService.getAccessControlById(this.ownerOrganization);
      if (accessControlItem && accessControlItem.permissions) {
        permissionIds = accessControlItem.permissions
          .filter((permission: any) => permission.permissionLevel === 'viewer' || permission.permissionLevel === 'editor')
          .map((permission: any) => permission.permissionId);
      }
      
      // Set datasetOwner flag for the selected organization (like AngularJS component)
      this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
        if (item.organizationalUnitId === this.ownerOrganization) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      });
    }
    
    // Use transformed data for the grid
    const transformedData = this.transformAccessControlData(this.kommonitorDataExchangeService.accessControl);
    
    // Build role management grid with filtered data (like AngularJS component)
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable', 
      this.roleManagementTableOptions, 
      transformedData, 
      permissionIds
    );
    
    // Force change detection by updating the options
    setTimeout(() => {
      if (this.roleManagementGrid && this.roleManagementGrid.api) {
        // Update the grid data directly using the API
        if (this.roleManagementTableOptions && this.roleManagementTableOptions.rowData) {
          this.roleManagementGrid.api.setRowData(this.roleManagementTableOptions.rowData);
        } else {
          this.roleManagementGrid.api.setRowData([]);
        }
        
        // Refresh the grid to ensure it updates
        this.roleManagementGrid.api.refreshCells();
        this.roleManagementGrid.api.redrawRows();
      }
    }, 100);
  }

  // Multi-step form navigation
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

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

  // Form validation methods
  checkDatasetName(): void {
    this.datasetNameInvalid = false;
    this.kommonitorDataExchangeService.availableGeoresources.forEach((georesource: any) => {
      if (georesource.datasetName === this.datasetName) {
        this.datasetNameInvalid = true;
        return;
      }
    });
  }

  checkPeriodOfValidity(): void {
    this.periodOfValidityInvalid = false;
    if (this.periodOfValidity.startDate && this.periodOfValidity.endDate) {
      const startDate = new Date(this.periodOfValidity.startDate);
      const endDate = new Date(this.periodOfValidity.endDate);

      if ((startDate === endDate) || startDate > endDate) {
        this.periodOfValidityInvalid = true;
      }
    }
  }

  onChangeGeoresourceType(): void {
    switch (this.georesourceType) {
      case "poi":
        this.isPOI = true;
        this.isLOI = false;
        this.isAOI = false;
        break;
      case "loi":
        this.isPOI = false;
        this.isLOI = true;
        this.isAOI = false;
        break;
      case "aoi":
        this.isPOI = false;
        this.isLOI = false;
        this.isAOI = true;
        break;
      default:
        this.isPOI = true;
        this.isLOI = false;
        this.isAOI = false;
        break;
    }
  }

  // Create test access control data for development/testing
  private createTestAccessControlData() {
    // Create test data that matches the expected structure for buildRoleManagementGrid
    const accessControlData = [
      {
        organizationalUnitId: 'org1',
        name: 'Test Organisation 1',
        organizationalUnitName: 'Test Organisation 1',
        organizationDescription: 'Test Organisation 1 Description',
        viewerPermissionId: 'view1',
        editorPermissionId: 'edit1',
        creatorPermissionId: 'create1',
        datasetOwner: true,
        permissions: [
          { roleId: 'view1', roleName: 'Viewer', permissionLevel: 'viewer' },
          { roleId: 'edit1', roleName: 'Editor', permissionLevel: 'editor' },
          { roleId: 'create1', roleName: 'Creator', permissionLevel: 'creator' }
        ]
      },
      {
        organizationalUnitId: 'org2',
        name: 'Test Organisation 2',
        organizationalUnitName: 'Test Organisation 2',
        organizationDescription: 'Test Organisation 2 Description',
        viewerPermissionId: 'view2',
        editorPermissionId: 'edit2',
        creatorPermissionId: 'create2',
        datasetOwner: false,
        permissions: [
          { roleId: 'view2', roleName: 'Viewer', permissionLevel: 'viewer' },
          { roleId: 'edit2', roleName: 'Editor', permissionLevel: 'editor' }
        ]
      },
      {
        organizationalUnitId: 'org3',
        name: 'Test Organisation 3',
        organizationalUnitName: 'Test Organisation 3',
        organizationDescription: 'Test Organisation 3 Description',
        viewerPermissionId: 'view3',
        editorPermissionId: 'edit3',
        creatorPermissionId: 'create3',
        datasetOwner: false,
        permissions: [
          { roleId: 'view3', roleName: 'Viewer', permissionLevel: 'viewer' }
        ]
      }
    ];
    
    // Update local references
    this.resourcesCreatorRights = accessControlData;
    this.filteredOrganizations = accessControlData;
    
    // Also update the service's access control data
    if (this.kommonitorDataExchangeService) {
      (this.kommonitorDataExchangeService as any)._accessControl = accessControlData;
    }
  }

  onChangeOwner(orgUnitId: string): void {
    this.ownerOrganization = orgUnitId;
    
    // Show role management form only when an organization is selected
    this.showRoleManagementForm = !!orgUnitId;
    
    this.refreshRoles();
  }

  // Handle owner organization change with proper validation
  onChangeOwnerOrganization(ownerOrganization: any): void {
    this.ownerOrganization = ownerOrganization;
    
    // Show role management form only when an organization is selected
    this.showRoleManagementForm = !!ownerOrganization;
    
    // Refresh roles based on the selected owner organization
    this.refreshRoles();
  }

  // Filter organizations based on search input
  filterOrganizations() {
    if (!this.ownerOrgFilter || this.ownerOrgFilter.trim() === '') {
      // Reset to original access control data
      this.reloadAccessControlData();
    } else {
      const filter = this.ownerOrgFilter.toLowerCase().trim();
      const originalAccessControl = this.kommonitorDataExchangeService.accessControl || [];
      const filteredAccessControl = originalAccessControl.filter(org =>
        org.name && org.name.toLowerCase().includes(filter)
      );
      // Create a temporary filtered view without modifying the original data
      this.filteredOrganizations = filteredAccessControl;
    }
  }

  // Clear organization filter
  clearOwnerFilter() {
    this.ownerOrgFilter = '';
    this.filteredOrganizations = [];
    this.reloadAccessControlData();
  }

  // Validate access control configuration
  validateAccessControl(): boolean {
    // Owner organization is required
    if (!this.ownerOrganization) {
      return false;
    }

    // If not public, at least one role must be selected
    if (!this.isPublic && (!this.roleManagementTableOptions || !this.roleManagementTableOptions.rowData || this.roleManagementTableOptions.rowData.length === 0)) {
      return false;
    }

    return true;
  }

  // Get selected role IDs for API
  getSelectedRoleIds(): string[] {
    if (this.roleManagementTableOptions && this.roleManagementTableOptions.rowData) {
      return this.roleManagementTableOptions.rowData
        .filter((row: any) => row.selected)
        .map((row: any) => row.organizationalUnitId);
    }
    return [];
  }

  // Step validation methods for progress bar
  isStepValid(step: number): boolean {
    // Validation for specific steps
    switch (step) {
      case 1:
        return !!this.datasetName && !!this.georesourceType;
      case 2:
        return !!this.metadata.description && !!this.metadata.datasource && !!this.metadata.contact && !!this.metadata.updateInterval && !!this.metadata.lastUpdate;
      case 3:
        return !!this.georesourceTopic_mainTopic;
      case 4:
        // Step 4 validation for access control
        if (this.kommonitorDataExchangeService.enableKeycloakSecurity) {
          return this.validateAccessControl();
        }
        return true;
      case 5:
        // Step 5 validation for spatial data
        return !!this.converter && !!this.datasourceType && !!this.georesourceDataSourceIdProperty && !!this.georesourceDataSourceNameProperty;
      default:
        return true;
    }
  }

  isCurrentStepValid(): boolean {
    return this.isStepValid(this.currentStep);
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }

  // Check if user has admin permissions (like AngularJS component)
  checkAdminPermission(): boolean {
    return this.kommonitorDataExchangeService.checkAdminPermission();
  }

  // Get filtered organizations based on admin permissions (like AngularJS component)
  getFilteredOrganizations(): any[] {
    if (this.checkAdminPermission()) {
      return this.filteredOrganizations.length > 0 ? this.filteredOrganizations : this.kommonitorDataExchangeService.accessControl || [];
    } else {
      // For non-admin users, show only their creator rights
      return this.resourcesCreatorRights || [];
    }
  }

  // Method to manually reload access control data
  async reloadAccessControlData() {
    try {
      // Try to fetch from API first
      await this.kommonitorDataExchangeService.fetchAccessControlMetadata();
      
      // Reload access control from service
      if (this.kommonitorDataExchangeService.accessControl) {
        // Transform API data to match the expected structure for the grid
        const transformedData = this.transformAccessControlData(this.kommonitorDataExchangeService.accessControl);
        
        // Update local references
        this.resourcesCreatorRights = transformedData;
        this.filteredOrganizations = transformedData;
      } else {
        throw new Error('No access control data returned from API');
      }
    } catch (error: any) {
      console.warn('Failed to load access control data from API:', error);
      // Do not inject test data; keep empty to avoid showing fake organizations
      this.resourcesCreatorRights = [];
      this.filteredOrganizations = [];
    }
  }

  // Transform API access control data to match the expected grid structure
  private transformAccessControlData(apiData: any[]): any[] {
    return apiData.map(org => {
      // Extract permission IDs from the permissions array
      const viewerPermission = org.permissions?.find((p: any) => p.permissionLevel === 'viewer');
      const editorPermission = org.permissions?.find((p: any) => p.permissionLevel === 'editor');
      const creatorPermission = org.permissions?.find((p: any) => p.permissionLevel === 'creator');

      return {
        organizationalUnitId: org.organizationalUnitId,
        name: org.name,
        organizationalUnitName: org.name,
        organizationDescription: org.description || '',
        viewerPermissionId: viewerPermission?.permissionId || '',
        editorPermissionId: editorPermission?.permissionId || '',
        creatorPermissionId: creatorPermission?.permissionId || '',
        datasetOwner: org.datasetOwner || false,
        permissions: org.permissions || []
      };
    });
  }



  // Initialize Bootstrap Icon Picker (based on AngularJS implementation)
  private initializeIconPicker(): void {
    // Wait for the DOM to be ready and ensure jQuery and iconpicker are available
    const initIconPicker = () => {
      const element = document.getElementById('poiSymbolPicker');
      
      if (!element) {
        setTimeout(initIconPicker, 100);
        return;
      }
      
      if (!(window as any).$) {
        return;
      }
      
      if (!(window as any).$.fn?.iconpicker) {
        return;
      }
      
      try {
        // Check if already initialized
        const existingIconPicker = (window as any).$('#poiSymbolPicker').data('bs.iconpicker');
        if (existingIconPicker) {
          (window as any).$('#poiSymbolPicker').iconpicker('setIcon', 'glyphicon-' + this.selectedPoiIconName);
          return;
        }
        
        // Initialize Bootstrap Icon Picker with same options as AngularJS
        const iconPickerOptions = {
            align: 'center',
            arrowClass: 'btn-default',
            arrowPrevIconClass: 'fas fa-angle-left',
            arrowNextIconClass: 'fas fa-angle-right',
            cols: 10,
            footer: true,
            header: true,
            icon: 'glyphicon-' + this.selectedPoiIconName,
            iconset: 'glyphicon',
            labelHeader: '{0} von {1} Seiten',
            labelFooter: '{0} - {1} von {2} Icons',
            placement: 'bottom',
            rows: 6,
            search: true,
            searchText: 'Stichwortsuche (Bootstrap Glyphicons)',
            selectedClass: 'btn-success',
          unselectedClass: '',
          container: 'body' // Ensure popover is appended to body
        };
        
        const iconPickerElement = (window as any).$('#poiSymbolPicker');
        iconPickerElement.iconpicker(iconPickerOptions);

        // Handle icon selection change (same logic as AngularJS)
        (window as any).$('#poiSymbolPicker').on('change', (e: any) => {
          // Extract icon name from full class (e.g., "glyphicon-home" -> "home")
          this.selectedPoiIconName = e.icon.substring(e.icon.indexOf('-') + 1);
          this.cdr.detectChanges();
        });

        // Set initial icon (like AngularJS version)
        (window as any).$('#poiSymbolPicker').iconpicker('setIcon', 'glyphicon-' + this.selectedPoiIconName);
          
      } catch (error) {
        // Handle error silently
      }
    };
    
    // Start initialization with a delay to ensure DOM is ready
    setTimeout(initIconPicker, 200);
  }



  // Importer methods
  onChangeConverter(): void {
    this.schema = this.converter?.schemas ? this.converter.schemas[0] : undefined;
    this.mimeType = this.converter?.mimeTypes ? this.converter.mimeTypes[0] : undefined;

    // Filter available datasource types based on selected converter's supported datasources
    const allTypes = this.kommonitorImporterHelperService.getAvailableDatasourceTypes() || [];
    if (this.converter?.datasources && Array.isArray(this.converter.datasources) && this.converter.datasources.length > 0) {
      this.availableDatasourceTypes = allTypes.filter((t: any) => this.converter.datasources.includes(t.type));
    } else {
      this.availableDatasourceTypes = allTypes;
    }

    // Auto-select if there is exactly one matching datasource type
    if (this.availableDatasourceTypes.length === 1) {
      this.datasourceType = this.availableDatasourceTypes[0];
      this.onChangeDatasourceType(this.datasourceType);
    } else {
      // Reset selected datasourceType if current selection is not compatible anymore
      if (this.datasourceType && !this.availableDatasourceTypes.find((t: any) => t.type === this.datasourceType.type)) {
        this.datasourceType = null;
      }
    }
  }

  onChangeMimeType(mimeType: string): void {
    this.mimeType = mimeType;
  }

  onChangeEncoding(encoding: string): void {
    this.encoding = encoding;
  }

  onChangeDatasourceType(datasourceType: any): void {
    this.datasourceType = datasourceType;
    console.log('[GeoresourceAddModal] onChangeDatasourceType', this.datasourceType);
  }

  // Color and styling methods
  onChangeMarkerColor(markerColor: any, event?: Event): void {
    // Prevent default behavior and stop propagation to avoid any navigation issues
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedPoiMarkerColor = markerColor;
    this.cdr.detectChanges();
  }

  onChangeSymbolColor(symbolColor: any, event?: Event): void {
    // Prevent default behavior and stop propagation to avoid any navigation issues
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedPoiSymbolColor = symbolColor;
    this.cdr.detectChanges();
  }

  onChangeLoiDashArray(loiDashArrayObject: any, event?: Event): void {
    // Prevent default behavior and stop propagation to avoid any navigation issues
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedLoiDashArrayObject = loiDashArrayObject;
    this.cdr.detectChanges();
  }

  onDropdownButtonClick(event: Event): void {
    // Toggle custom dropdown state
    this.isMarkerStyleDropdownOpen = !this.isMarkerStyleDropdownOpen;
    this.cdr.detectChanges();
  }

  closeMarkerStyleDropdown(): void {
    this.isMarkerStyleDropdownOpen = false;
    this.cdr.detectChanges();
  }

  onIconPickerClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if icon picker is initialized
    if ((window as any).$ && (window as any).$('#poiSymbolPicker').length > 0) {
      const iconPicker = (window as any).$('#poiSymbolPicker');
      
      if (iconPicker.data('bs.iconpicker')) {
        // Try to trigger the icon picker popover directly
        try {
          // The icon picker should automatically show when clicked
          // Let's try to trigger the click event on the button
          iconPicker.trigger('click');
        } catch (error) {
          // Fallback: try manual popover creation
          this.createManualIconPicker();
        }
        
        // Add a small delay and check if popover is visible
        setTimeout(() => {
          const popover = document.querySelector('.iconpicker-popover');
          if (!popover) {
            this.createManualIconPicker();
          }
        }, 200);
        
      } else {
        this.initializeIconPicker();
      }
    } else {
      // jQuery not available, use manual picker
    }
  }

  onDocumentClick(event: Event): void {
    // Close dropdown if clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.customColorPicker')) {
      this.isMarkerStyleDropdownOpen = false;
      this.cdr.detectChanges();
    }
    
    // Close manual icon picker if clicking outside
    if (!target.closest('.manual-icon-picker')) {
      this.closeManualIconPicker();
    }
  }



  // Create a manual icon picker as fallback
  private createManualIconPicker(): void {
    
    // Remove any existing manual icon picker
    this.closeManualIconPicker();
    
    // Create popover container
    const popover = document.createElement('div');
    popover.className = 'manual-icon-picker popover bottom';
    popover.style.cssText = `
      position: absolute;
      z-index: 9999999;
      display: block;
      max-width: 400px;
      min-width: 300px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    // Get button position and parent container for proper positioning
    const button = document.getElementById('poiSymbolPicker');
    const buttonParent = button?.parentElement;
    const modalElement = document.querySelector('.modal');
    
    if (button && buttonParent) {
      // Position relative to the button's parent container
      const buttonRect = button.getBoundingClientRect();
      const parentRect = buttonParent.getBoundingClientRect();
      
      // Calculate position relative to parent
      const relativeLeft = buttonRect.left - parentRect.left;
      const relativeTop = buttonRect.bottom - parentRect.top + 5;
      
      popover.style.left = relativeLeft + 'px';
      popover.style.top = relativeTop + 'px';
      
      // Ensure it doesn't go outside parent bounds
      const maxLeft = parentRect.width - 400; // 400px is max-width
      if (relativeLeft > maxLeft) {
        popover.style.left = maxLeft + 'px';
      }
      
      // If it would go below parent, show above button instead
      if (relativeTop + 300 > parentRect.height) { // 300px is approximate height
        popover.style.top = (buttonRect.top - parentRect.top - 305) + 'px';
      }
      

    } else if (button) {
      // Fallback to viewport positioning if parent not found
      const rect = button.getBoundingClientRect();
      popover.style.position = 'fixed';
      popover.style.left = rect.left + 'px';
      popover.style.top = (rect.bottom + 5) + 'px';

    }
    

    
    // Create popover content
    const content = document.createElement('div');
    content.className = 'popover-content';
    content.style.cssText = `
      padding: 10px;
      max-height: 300px;
      overflow-y: auto;
    `;
    
    // Add search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'form-control';
    searchInput.placeholder = 'Search icons...';
    searchInput.style.marginBottom = '10px';
    content.appendChild(searchInput);
    
    // Add icon grid
    const iconGrid = document.createElement('div');
    iconGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 5px;
    `;
    
    // Common glyphicon icons
    const icons = ['home', 'star', 'heart', 'user', 'cog', 'search', 'plus', 'minus', 'check', 'remove', 'edit', 'eye', 'download', 'upload', 'folder', 'file'];
    
    icons.forEach(iconName => {
      const iconButton = document.createElement('button');
      iconButton.className = 'btn btn-default';
      iconButton.style.cssText = `
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      `;
      iconButton.innerHTML = `<i class="glyphicon glyphicon-${iconName}"></i>`;
      iconButton.title = iconName;
      
      iconButton.addEventListener('click', () => {
        // Update the component property within NgZone
        this.ngZone.run(() => {
          this.selectedPoiIconName = iconName;
          
          // Update the Bootstrap Icon Picker (like AngularJS version)
          if ((window as any).$ && (window as any).$('#poiSymbolPicker').length > 0) {
            (window as any).$('#poiSymbolPicker').iconpicker('setIcon', 'glyphicon-' + iconName);
          }
          
          // Force change detection
          this.cdr.detectChanges();
          
          // Update the button display
          this.updateIconPickerButtonDisplay(iconName);
          
          // Force another change detection cycle
          setTimeout(() => {
            this.ngZone.run(() => {
              this.cdr.detectChanges();
            });
          }, 200);
        });
        
        this.closeManualIconPicker();
      });
      
      iconGrid.appendChild(iconButton);
    });
    
    content.appendChild(iconGrid);
    popover.appendChild(content);
    
    // Try to append to the button's parent container first for better positioning
    if (buttonParent) {
      buttonParent.appendChild(popover);
    } else if (modalElement) {
      modalElement.appendChild(popover);
    } else {
      // Fallback to body if neither found
      document.body.appendChild(popover);
    }
    
    // Add search functionality
    searchInput.addEventListener('input', (e) => {
      const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
      const iconButtons = iconGrid.querySelectorAll('button');
      iconButtons.forEach(button => {
        const iconName = button.title.toLowerCase();
        if (iconName.includes(searchTerm)) {
          (button as HTMLElement).style.display = 'flex';
        } else {
          (button as HTMLElement).style.display = 'none';
        }
      });
    });
    

    
    // Add resize and scroll handlers to reposition if needed
    const repositionHandler = () => {
      const existingPicker = document.querySelector('.manual-icon-picker') as HTMLElement;
      if (existingPicker && button && buttonParent) {
        const buttonRect = button.getBoundingClientRect();
        const parentRect = buttonParent.getBoundingClientRect();
        
        // Update position relative to button parent
        const relativeLeft = buttonRect.left - parentRect.left;
        const relativeTop = buttonRect.bottom - parentRect.top + 5;
        
        existingPicker.style.left = relativeLeft + 'px';
        existingPicker.style.top = relativeTop + 'px';
        
        // Ensure it doesn't go outside parent bounds
        const maxLeft = parentRect.width - 400;
        if (relativeLeft > maxLeft) {
          existingPicker.style.left = maxLeft + 'px';
        }
        
        // If it would go below parent, show above button instead
        if (relativeTop + 300 > parentRect.height) {
          existingPicker.style.top = (buttonRect.top - parentRect.top - 305) + 'px';
        }
      }
    };
    
    window.addEventListener('resize', repositionHandler);
    window.addEventListener('scroll', repositionHandler);
    
    // Store the handler for cleanup
    (popover as any)._repositionHandler = repositionHandler;
  }

  // Update the icon picker button display
  private updateIconPickerButtonDisplay(iconName: string): void {
    const button = document.getElementById('poiSymbolPicker');
    if (button) {
      // Method 1: Try to update existing elements
      const iconElement = button.querySelector('i.glyphicon');
      if (iconElement) {
        // Remove all existing glyphicon classes and add the new one
        iconElement.className = `glyphicon glyphicon-${iconName}`;
      }
      
      const textElement = button.querySelector('span');
      if (textElement) {
        textElement.textContent = iconName;
      }
      
      // Method 2: Update data attributes
      button.setAttribute('data-icon', `glyphicon-${iconName}`);
      
      // Method 3: Force a complete button rebuild if the above didn't work
      if (!iconElement || !textElement) {
        this.rebuildIconPickerButton(iconName);
      }
      
      // Method 4: Try to trigger a click event to force Angular to re-render
      setTimeout(() => {
        button.click();
        button.blur();
      }, 50);
    }
  }

  // Rebuild the icon picker button content completely
  private rebuildIconPickerButton(iconName: string): void {
    const button = document.getElementById('poiSymbolPicker');
    if (button) {
      // Clear the button content
      button.innerHTML = '';
      
      // Recreate the icon element
      const iconElement = document.createElement('i');
      iconElement.className = `glyphicon glyphicon-${iconName}`;
      iconElement.style.fontSize = '16px';
      
      // Recreate the text element
      const textElement = document.createElement('span');
      textElement.textContent = iconName;
      textElement.style.marginLeft = '5px';
      
      // Append the new elements
      button.appendChild(iconElement);
      button.appendChild(textElement);
    }
  }

  // Close manual icon picker
  private closeManualIconPicker(): void {
    const existingPicker = document.querySelector('.manual-icon-picker') as HTMLElement;
    if (existingPicker) {
      // Clean up event listeners
      const repositionHandler = (existingPicker as any)._repositionHandler;
      if (repositionHandler) {
        window.removeEventListener('resize', repositionHandler);
        window.removeEventListener('scroll', repositionHandler);
      }
      existingPicker.remove();
    }
  }

  onChangeMarkerStyle(markerStyle: string, event?: Event): void {
    // Prevent default behavior and stop propagation to avoid any navigation issues
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Update the selected style
    this.selectedPoiMarkerStyle = markerStyle;
    
    // Force change detection to ensure the UI updates properly
    this.cdr.detectChanges();
    
    // Reinitialize icon picker if switching to symbol mode
    if (markerStyle === 'symbol') {
      setTimeout(() => {
          this.initializeIconPicker();
      }, 100);
    }
  }

  checkPoiMarkerText(): void {
    this.poiMarkerTextInvalid = false;
    if (this.poiMarkerText && this.poiMarkerText.length > 3) {
      this.poiMarkerTextInvalid = true;
    }
  }

  // Attribute mapping methods
  onAddOrUpdateAttributeMapping(): void {
    const tmpAttributeMapping_adminView = {
      "sourceName": this.attributeMapping_sourceAttributeName,
      "destinationName": this.attributeMapping_destinationAttributeName,
      "dataType": this.attributeMapping_attributeType
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
    this.attributeMapping_attributeType = this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
  }

  onClickEditAttributeMapping(attributeMappingEntry: any): void {
    this.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
    this.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
    this.attributeMapping_attributeType = attributeMappingEntry.dataType;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any): void {
    for (let index = 0; index < this.attributeMappings_adminView.length; index++) {
      if (this.attributeMappings_adminView[index].sourceName === attributeMappingEntry.sourceName) {
        // remove object
        this.attributeMappings_adminView.splice(index, 1);
        break;
      }
    }
  }

  // Import/Export methods
  onImportGeoresourceAddMetadata(): void {
    this.georesourceMetadataImportError = '';
    this.metadataImportFile.nativeElement.click();
  }

  onExportGeoresourceAddMetadataTemplate(): void {
    const metadataJSON = JSON.stringify(this.georesourceMetadataStructure);
    const fileName = "Georessource_Metadaten_Vorlage_Export.json";
    this.downloadFile(metadataJSON, fileName);
  }

  onExportGeoresourceAddMetadata(): void {
    const metadataExport = JSON.parse(JSON.stringify(this.georesourceMetadataStructure));

    metadataExport.metadata.note = this.metadata.note || "";
    metadataExport.metadata.literature = this.metadata.literature || "";
    metadataExport.metadata.sridEPSG = this.metadata.sridEPSG || "";
    metadataExport.metadata.datasource = this.metadata.datasource || "";
    metadataExport.metadata.contact = this.metadata.contact || "";
    metadataExport.metadata.lastUpdate = this.metadata.lastUpdate || "";
    metadataExport.metadata.description = this.metadata.description || "";
    metadataExport.metadata.databasis = this.metadata.databasis || "";
    metadataExport.datasetName = this.datasetName || "";

    metadataExport.allowedRoles = [];

    if (this.roleManagementTableOptions) {
      const roleIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          metadataExport.allowedRoles.push(roleId);
        }
      }
    }

    if (this.metadata.updateInterval) {
      metadataExport.metadata.updateInterval = this.metadata.updateInterval.apiName;
    }

    const name = this.datasetName;

    // georesource specific properties
    metadataExport.isPOI = this.isPOI;
    metadataExport.isLOI = this.isLOI;
    metadataExport.isAOI = this.isAOI;

    if (this.isPOI) {
      metadataExport["poiSymbolBootstrap3Name"] = this.selectedPoiIconName;
      metadataExport["poiSymbolColor"] = (this.selectedPoiSymbolColor as any)?.colorName || '';
      metadataExport["poiMarkerColor"] = (this.selectedPoiMarkerColor as any)?.colorName || '';

      metadataExport["loiDashArrayString"] = "";
      metadataExport["loiColor"] = "";
      metadataExport["loiWidth"] = "";

      metadataExport["aoiColor"] = "";
    } else if (this.isLOI) {
      metadataExport["poiSymbolBootstrap3Name"] = "";
      metadataExport["poiSymbolColor"] = "";
      metadataExport["poiMarkerColor"] = "";

      metadataExport["loiDashArrayString"] = this.selectedLoiDashArrayObject.dashArrayValue;
      metadataExport["loiColor"] = this.loiColor;
      metadataExport["loiWidth"] = this.loiWidth;

      metadataExport["aoiColor"] = "";
    } else if (this.isAOI) {
      metadataExport["poiSymbolBootstrap3Name"] = "";
      metadataExport["poiSymbolColor"] = "";
      metadataExport["poiMarkerColor"] = "";

      metadataExport["loiDashArrayString"] = "";
      metadataExport["loiColor"] = "";
      metadataExport["loiWidth"] = "";

      metadataExport["aoiColor"] = this.aoiColor;
    }

    // Topic reference
    if (this.georesourceTopic_subsubsubTopic) {
      metadataExport.topicReference = this.georesourceTopic_subsubsubTopic.topicId;
    } else if (this.georesourceTopic_subsubTopic) {
      metadataExport.topicReference = this.georesourceTopic_subsubTopic.topicId;
    } else if (this.georesourceTopic_subTopic) {
      metadataExport.topicReference = this.georesourceTopic_subTopic.topicId;
    } else if (this.georesourceTopic_mainTopic) {
      metadataExport.topicReference = this.georesourceTopic_mainTopic.topicId;
    } else {
      metadataExport.topicReference = "";
    }

    const metadataJSON = JSON.stringify(metadataExport);
    let fileName = "Georessource_Metadaten_Export";

    if (name) {
      fileName += "-" + name;
    }

    fileName += ".json";
    this.downloadFile(metadataJSON, fileName);
  }

  onImportGeoresourceAddMappingConfig(): void {
    this.georesourceMappingConfigImportError = '';
    this.mappingConfigImportFile.nativeElement.click();
  }

  onExportGeoresourceAddMappingConfig(): void {
    this.buildImporterObjects().then(() => {
      const mappingConfigExport: any = {
        "converter": this.converterDefinition,
        "dataSource": this.datasourceTypeDefinition,
        "propertyMapping": this.propertyMappingDefinition,
      };

      mappingConfigExport.periodOfValidity = this.periodOfValidity;

      const name = this.datasetName;
      const metadataJSON = JSON.stringify(mappingConfigExport);
      let fileName = "KomMonitor-Import-Mapping-Konfiguration_Export";

      if (name) {
        fileName += "-" + name;
      }

      fileName += ".json";
      this.downloadFile(metadataJSON, fileName);
    });
  }

  // File handling methods
  onMetadataFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.parseMetadataFromFile(file);
    }
  }

  onMappingConfigFileSelected(event: any): void {
    const inputEl = event?.target as HTMLInputElement;
    const file = inputEl?.files?.[0];
    if (!file) {
      this.georesourceMappingConfigImportError = 'Keine Datei ausgewählt oder ungültige Eingabe.';
      this.showMappingConfigErrorAlert();
      return;
    }
    try {
      this.parseMappingConfigFromFile(file);
    } catch (e) {
      this.georesourceMappingConfigImportError = 'Fehler beim Lesen der Datei.';
      this.showMappingConfigErrorAlert();
    }
  }

  private parseMetadataFromFile(file: File): void {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMetadataFile(event);
      } catch (error) {
        console.error(error);
        console.error("Uploaded Metadata File cannot be parsed.");
        this.georesourceMetadataImportError = "Uploaded Metadata File cannot be parsed correctly";
        this.showMetadataErrorAlert();
      }
    };

    fileReader.readAsText(file);
  }

  private parseMappingConfigFromFile(file: File): void {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMappingConfigFile(event);
      } catch (error) {
        console.error(error);
        console.error("Uploaded MappingConfig File cannot be parsed.");
        this.georesourceMappingConfigImportError = "Uploaded MappingConfig File cannot be parsed correctly";
        this.showMappingConfigErrorAlert();
      }
    };

    try {
      fileReader.readAsText(file as Blob);
    } catch (err) {
      this.georesourceMappingConfigImportError = 'Fehler: Ungültiger Dateiinhalt.';
      this.showMappingConfigErrorAlert();
    }
  }

  private parseFromMetadataFile(event: any): void {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      console.error("uploaded Metadata File cannot be parsed - wrong structure.");
      this.georesourceMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster überein.";
      this.showMetadataErrorAlert();
      return;
    }

    this.metadata = {};
    this.metadata.note = this.metadataImportSettings.metadata.note;
    this.metadata.literature = this.metadataImportSettings.metadata.literature;
    
    this.updateIntervalOptions.forEach((option: any) => {
      if (option.apiName === this.metadataImportSettings.metadata.updateInterval) {
        this.metadata.updateInterval = option;
      }
    });
    
    if (!this.metadata.updateInterval && this.metadataImportSettings.metadata.updateInterval) {
      // Fallback: add missing interval to options and select it
      const fallbackInterval = {
        apiName: this.metadataImportSettings.metadata.updateInterval,
        displayName: this.metadataImportSettings.metadata.updateInterval
      };
      if (Array.isArray(this.updateIntervalOptions)) {
        this.updateIntervalOptions = [...this.updateIntervalOptions, fallbackInterval];
      } else {
        this.updateIntervalOptions = [fallbackInterval];
      }
      this.metadata.updateInterval = fallbackInterval;
      console.warn('[GeoresourceAddModal] Added fallback updateInterval option from import:', fallbackInterval);
    }
    
    this.metadata.sridEPSG = this.metadataImportSettings.metadata.sridEPSG;
    this.metadata.datasource = this.metadataImportSettings.metadata.datasource;
    this.metadata.contact = this.metadataImportSettings.metadata.contact;
    this.metadata.lastUpdate = this.metadataImportSettings.metadata.lastUpdate;
    this.metadata.description = this.metadataImportSettings.metadata.description;
    this.metadata.databasis = this.metadataImportSettings.metadata.databasis;

    this.datasetName = this.metadataImportSettings.datasetName;

    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
      this.metadataImportSettings.allowedRoles
    );

    // georesource specific properties
    this.isPOI = this.metadataImportSettings.isPOI;
    this.isLOI = this.metadataImportSettings.isLOI;
    this.isAOI = this.metadataImportSettings.isAOI;
    
    if (this.metadataImportSettings.isPOI) {
      this.georesourceType = "poi";
    } else if (this.metadataImportSettings.isLOI) {
      this.georesourceType = "loi";
    } else {
      this.georesourceType = "aoi";
    }
    
    this.availablePoiMarkerColors.forEach((option: any) => {
      if (option.colorName === this.metadataImportSettings.poiMarkerColor) {
        this.selectedPoiMarkerColor = option;
      }
      if (option.colorName === this.metadataImportSettings.poiSymbolColor) {
        this.selectedPoiSymbolColor = option;
      }
    });
    
    this.availableLoiDashArrayObjects.forEach((option: any) => {
      if (option.dashArrayValue === this.metadataImportSettings.loiDashArrayString) {
        this.selectedLoiDashArrayObject = option;
        this.onChangeLoiDashArray(this.selectedLoiDashArrayObject);
      }
    });
    
    this.loiColor = this.metadataImportSettings.loiColor;
    this.loiWidth = this.metadataImportSettings.loiWidth;
    this.aoiColor = this.metadataImportSettings.aoiColor;
    this.selectedPoiIconName = this.metadataImportSettings.poiSymbolBootstrap3Name;

    const topicHierarchy = this.kommonitorDataExchangeService.getTopicHierarchyForTopicId(this.metadataImportSettings.topicReference);

    if (topicHierarchy && topicHierarchy[0]) {
      this.georesourceTopic_mainTopic = topicHierarchy[0];
    }
    if (topicHierarchy && topicHierarchy[1]) {
      this.georesourceTopic_subTopic = topicHierarchy[1];
    }
    if (topicHierarchy && topicHierarchy[2]) {
      this.georesourceTopic_subsubTopic = topicHierarchy[2];
    }
    if (topicHierarchy && topicHierarchy[3]) {
      this.georesourceTopic_subsubsubTopic = topicHierarchy[3];
    }
  }

  private parseFromMappingConfigFile(event: any): void {
    this.mappingConfigImportSettings = JSON.parse(event.target.result);

    if (!this.mappingConfigImportSettings.converter || !this.mappingConfigImportSettings.dataSource || !this.mappingConfigImportSettings.propertyMapping) {
      console.error("uploaded MappingConfig File cannot be parsed - wrong structure.");
      this.georesourceMappingConfigImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster überein.";
      this.showMappingConfigErrorAlert();
      return;
    }

    this.converter = undefined;
    for (const converter of this.kommonitorImporterHelperService.availableConverters) {
      if (converter.name === this.mappingConfigImportSettings.converter.name) {
        this.converter = converter;
        break;
      }
    }
    // Fallback: try to find by mimeType or by name similarity
    if (!this.converter) {
      const allConverters = this.kommonitorImporterHelperService.availableConverters || [];
      const byMime = allConverters.find((c: any) => Array.isArray(c.mimeTypes) && c.mimeTypes.includes(this.mappingConfigImportSettings.converter.mimeType));
      if (byMime) {
        this.converter = byMime;
      } else {
        const wantedName = (this.mappingConfigImportSettings.converter.name || '').toLowerCase();
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

    this.schema = '';
    if (this.converter && this.converter.schemas && this.mappingConfigImportSettings.converter.schema) {
      for (const schema of this.converter.schemas) {
        if (schema === this.mappingConfigImportSettings.converter.schema) {
          this.schema = schema;
        }
      }
    }

    this.mimeType = '';
    if (this.converter && this.converter.mimeTypes && this.mappingConfigImportSettings.converter.mimeType) {
      for (const mimeType of this.converter.mimeTypes) {
        if (mimeType === this.mappingConfigImportSettings.converter.mimeType) {
          this.mimeType = mimeType;
        }
      }
    }

    // Encoding from mapping if present
    this.encoding = this.mappingConfigImportSettings.converter.encoding || this.encoding;

    this.datasourceType = undefined;
    for (const datasourceType of this.kommonitorImporterHelperService.availableDatasourceTypes) {
      if (datasourceType.type === this.mappingConfigImportSettings.dataSource.type) {
        this.datasourceType = datasourceType;
        break;
      }
    }

    // converter parameters
    this.converterParameterValues = {};
    if (Array.isArray(this.mappingConfigImportSettings.converter.parameters)) {
      for (const convParameter of this.mappingConfigImportSettings.converter.parameters) {
        const element = document.getElementById("converterParameter_georesourceAdd_" + convParameter.name) as HTMLInputElement;
        if (element) {
          element.value = convParameter.value ?? '';
        }
        this.converterParameterValues[convParameter.name] = convParameter.value ?? '';
      }
    }

    // datasourceTypes parameters
    if (this.datasourceType) {
      for (const dsParameter of this.mappingConfigImportSettings.dataSource.parameters) {
        const element = document.getElementById("datasourceTypeParameter_georesourceAdd_" + dsParameter.name) as HTMLInputElement;
        if (element) {
          element.value = dsParameter.value;
        }
      }
    }

    // property Mapping
    this.georesourceDataSourceNameProperty = this.mappingConfigImportSettings.propertyMapping.nameProperty;
    this.georesourceDataSourceIdProperty = this.mappingConfigImportSettings.propertyMapping.identifierProperty;
    this.validityStartDate_perFeature = this.mappingConfigImportSettings.propertyMapping.validStartDateProperty;
    this.validityEndDate_perFeature = this.mappingConfigImportSettings.propertyMapping.validEndDateProperty;
    this.keepAttributes = this.mappingConfigImportSettings.propertyMapping.keepAttributes;
    this.keepMissingValues = this.mappingConfigImportSettings.propertyMapping.keepMissingOrNullValueAttributes;
    this.attributeMappings_adminView = [];

    for (const attributeMapping of this.mappingConfigImportSettings.propertyMapping.attributes) {
      const tmpEntry: any = {
        "sourceName": attributeMapping.name,
        "destinationName": attributeMapping.mappingName
      };

      for (const dataType of this.kommonitorImporterHelperService.attributeMapping_attributeTypes) {
        if (dataType.apiName === attributeMapping.type) {
          tmpEntry.dataType = dataType;
        }
      }

      this.attributeMappings_adminView.push(tmpEntry);
    }

    if (this.mappingConfigImportSettings.periodOfValidity) {
      this.periodOfValidity = {
        startDate: this.mappingConfigImportSettings.periodOfValidity.startDate,
        endDate: this.mappingConfigImportSettings.periodOfValidity.endDate
      };
      this.periodOfValidityInvalid = false;
    }
  }

  private downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], { type: "application/json" });
    const data = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = "JSON";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();

    a.remove();
  }

  // Alert methods
  hideSuccessAlert(): void {
    this.successMessage = '';
  }

  hideErrorAlert(): void {
    this.errorMessage = '';
  }

  hideMetadataErrorAlert(): void {
    this.georesourceMetadataImportError = '';
  }

  hideMappingConfigErrorAlert(): void {
    this.georesourceMappingConfigImportError = '';
  }

  private showMetadataErrorAlert(): void {
    // Ensure pretty-print structure is available and scroll alert into view
    if (!this.georesourceMetadataStructure_pretty) {
      this.georesourceMetadataStructure_pretty = this.kommonitorDataExchangeService.syntaxHighlightJSON(this.georesourceMetadataStructure);
    }
    setTimeout(() => {
      const el = document.getElementById('georesourceMetadataImportErrorAlert');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }

  private showMappingConfigErrorAlert(): void {
    // Ensure pretty-print structure is available and scroll alert into view
    if (!this.georesourceMappingConfigStructure_pretty) {
      this.georesourceMappingConfigStructure_pretty = this.kommonitorDataExchangeService.syntaxHighlightJSON(this.kommonitorImporterHelperService.mappingConfigStructure);
    }
    setTimeout(() => {
      const el = document.getElementById('georesourceMappingConfigImportErrorAlert');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }

  // Form reset
  resetGeoresourceAddForm(): void {
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';

    this.datasetName = '';
    this.datasetNameInvalid = false;

    this.metadata = {
      note: '',
      literature: '',
      updateInterval: null,
      sridEPSG: 4326,
      datasource: '',
      databasis: '',
      contact: '',
      lastUpdate: '',
      description: ''
    };

    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable', 
      [], 
      this.kommonitorDataExchangeService.accessControl, 
      []
    );

    this.georesourceTopic_mainTopic = null;
    this.georesourceTopic_subTopic = null;
    this.georesourceTopic_subsubTopic = null;
    this.georesourceTopic_subsubsubTopic = null;

    this.georesourceType = 'poi';
    this.isPOI = true;
    this.isLOI = false;
    this.isAOI = false;
    this.selectedPoiMarkerColor = this.availablePoiMarkerColors[0] || null;
    this.selectedPoiSymbolColor = this.availablePoiMarkerColors[1] || null;
    this.selectedLoiDashArrayObject = this.availableLoiDashArrayObjects[0] || null;
    this.loiColor = '#bf3d2c';
    this.loiWidth = 3;
    this.aoiColor = '#bf3d2c';
    this.selectedPoiIconName = 'home';
    this.selectedPoiMarkerStyle = 'symbol';
    this.poiMarkerText = '';
    this.poiMarkerTextInvalid = false;
    
    // Reset dropdown state
    this.isMarkerStyleDropdownOpen = false;
    
    // Reset icon picker (same as AngularJS)
    if ((window as any).$ && (window as any).$('#poiSymbolPicker').length > 0) {
      try {
        (window as any).$('#poiSymbolPicker').val("").iconpicker('setIcon', 'glyphicon-' + this.selectedPoiIconName);
      } catch (error) {
        console.error('Error resetting icon picker:', error);
      }
    }
    


    this.periodOfValidity = {
      startDate: '',
      endDate: ''
    };
    this.periodOfValidityInvalid = false;

    this.geoJsonString = null;
    this.georesource_asGeoJson = null;

    this.georesourceDataSourceInputInvalidReason = '';
    this.georesourceDataSourceInputInvalid = false;

    this.georesourceDataSourceIdProperty = '';
    this.georesourceDataSourceNameProperty = '';

    this.converter = null;
    this.schema = '';
    this.mimeType = '';
    this.datasourceType = null;

    this.converterDefinition = null;
    this.datasourceTypeDefinition = null;
    this.propertyMappingDefinition = null;
    this.postBody_georesources = null;

    this.validityEndDate_perFeature = '';
    this.validityStartDate_perFeature = '';

    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMapping_data = null;
    this.attributeMapping_attributeType = this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
    this.attributeMappings_adminView = [];
    this.keepAttributes = true;
    this.keepMissingValues = true;

    this.ownerOrganization = '';
    this.ownerOrgFilter = '';
    this.isPublic = false;
    this.showRoleManagementForm = false;

    this.metadataImportSettings = null;
    this.mappingConfigImportSettings = null;
    this.georesourceMetadataImportError = '';
    this.georesourceMappingConfigImportError = '';
  }

  // Build post body for API request
  buildPostBody_georesources(): any {
    const postBody: any = {
      "geoJsonString": this.geoJsonString || "",
      "allowedRoles": [],
      "metadata": {
        "note": this.metadata.note,
        "literature": this.metadata.literature,
        "updateInterval": this.metadata.updateInterval?.apiName,
        "sridEPSG": this.metadata.sridEPSG || 4326,
        "datasource": this.metadata.datasource,
        "contact": this.metadata.contact,
        "lastUpdate": this.toIsoDateString(this.metadata.lastUpdate),
        "description": this.metadata.description,
        "databasis": this.metadata.databasis
      },
      "jsonSchema": null,
      "datasetName": this.datasetName,
      "periodOfValidity": {
        "endDate": this.toIsoDateString(this.periodOfValidity.endDate),
        "startDate": this.toIsoDateString(this.periodOfValidity.startDate)
      },
      "isAOI": this.isAOI,
      "isLOI": this.isLOI,
      "isPOI": this.isPOI,
      "topicReference": null,
      "ownerId": this.ownerOrganization,
      "isPublic": this.isPublic
    };

    if (this.roleManagementTableOptions) {
      const roleIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          postBody.allowedRoles.push(roleId);
        }
      }
    }

    if (this.isPOI) {
      // Fallback to defaults to avoid empty ColorType values
      const symbolColorName = (this.selectedPoiSymbolColor as any)?.colorName 
        || this.availablePoiMarkerColors[1]?.colorName 
        || this.availablePoiMarkerColors[0]?.colorName 
        || 'red';
      const markerColorName = (this.selectedPoiMarkerColor as any)?.colorName 
        || this.availablePoiMarkerColors[0]?.colorName 
        || 'red';

      postBody["poiSymbolBootstrap3Name"] = this.selectedPoiIconName || 'home';
      postBody["poiSymbolColor"] = symbolColorName;
      postBody["poiMarkerColor"] = markerColorName;
      postBody["poiMarkerStyle"] = this.selectedPoiMarkerStyle;
      postBody["poiMarkerText"] = this.poiMarkerText;

      postBody["loiDashArrayString"] = null;
      postBody["loiColor"] = null;
      postBody["loiWidth"] = 3;

      postBody["aoiColor"] = null;
    } else if (this.isLOI) {
      postBody["poiSymbolBootstrap3Name"] = null;
      postBody["poiSymbolColor"] = null;
      postBody["poiMarkerColor"] = null;
      postBody["poiMarkerStyle"] = null;
      postBody["poiMarkerText"] = null;

      postBody["loiDashArrayString"] = (this.selectedLoiDashArrayObject as any)?.dashArrayValue || '';
      postBody["loiColor"] = this.loiColor;
      postBody["loiWidth"] = this.loiWidth;

      postBody["aoiColor"] = null;
    } else if (this.isAOI) {
      postBody["poiSymbolBootstrap3Name"] = null;
      postBody["poiSymbolColor"] = null;
      postBody["poiMarkerColor"] = null;
      postBody["poiMarkerStyle"] = null;
      postBody["poiMarkerText"] = null;

      postBody["loiDashArrayString"] = null;
      postBody["loiColor"] = null;
      postBody["loiWidth"] = 3;

      postBody["aoiColor"] = this.aoiColor;
    }

    // TOPIC REFERENCE
    if (this.georesourceTopic_subsubsubTopic) {
      postBody.topicReference = this.georesourceTopic_subsubsubTopic.topicId;
    } else if (this.georesourceTopic_subsubTopic) {
      postBody.topicReference = this.georesourceTopic_subsubTopic.topicId;
    } else if (this.georesourceTopic_subTopic) {
      postBody.topicReference = this.georesourceTopic_subTopic.topicId;
    } else if (this.georesourceTopic_mainTopic) {
      postBody.topicReference = this.georesourceTopic_mainTopic.topicId;
    } else {
      postBody.topicReference = "";
    }

    console.log('[GeoresourceAddModal] buildPostBody_georesources', {
      inputState: {
        metadata: this.metadata,
        datasetName: this.datasetName,
        periodOfValidity: this.periodOfValidity,
        isPOI: this.isPOI,
        isLOI: this.isLOI,
        isAOI: this.isAOI,
        selectedPoiIconName: this.selectedPoiIconName,
        selectedPoiSymbolColor: this.selectedPoiSymbolColor,
        selectedPoiMarkerColor: this.selectedPoiMarkerColor,
        selectedPoiMarkerStyle: this.selectedPoiMarkerStyle,
        poiMarkerText: this.poiMarkerText,
        selectedLoiDashArrayObject: this.selectedLoiDashArrayObject,
        loiColor: this.loiColor,
        loiWidth: this.loiWidth,
        aoiColor: this.aoiColor,
        ownerOrganization: this.ownerOrganization,
        isPublic: this.isPublic
      },
      result: postBody,
      datasourceTypeDefinition: this.datasourceTypeDefinition
    });
    return postBody;
  }

  // Main add method
  async addGeoresource(): Promise<void> {
    this.loadingData = true;
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';
    console.log('[GeoresourceAddModal] addGeoresource called', {
      currentStep: this.currentStep,
      totalSteps: this.totalSteps,
      datasetName: this.datasetName,
      georesourceType: this.georesourceType,
      isPOI: this.isPOI,
      isLOI: this.isLOI,
      isAOI: this.isAOI
    });

    try {
      // Build importer objects
      const allDataSpecified = await this.buildImporterObjects();
      console.log('[GeoresourceAddModal] buildImporterObjects ->', allDataSpecified, {
        converterDefinition: this.converterDefinition,
        datasourceTypeDefinition: this.datasourceTypeDefinition,
        propertyMappingDefinition: this.propertyMappingDefinition,
        postBody: this.postBody_georesources
      });

      if (!allDataSpecified) {
        // Validation failed
        this.loadingData = false;
        console.warn('[GeoresourceAddModal] Missing required importer objects. Aborting submit.');
        return;
      }

      // Perform dry run
      console.log('[GeoresourceAddModal] Sending DRY RUN request', {
        converterDefinition: this.converterDefinition,
        datasourceTypeDefinition: this.datasourceTypeDefinition,
        propertyMappingDefinition: this.propertyMappingDefinition,
        postBody: this.postBody_georesources
      });
      const newGeoresourceResponse_dryRun = await this.kommonitorImporterHelperService.registerNewGeoresource(
        this.converterDefinition,
        this.datasourceTypeDefinition,
        this.propertyMappingDefinition,
        this.postBody_georesources,
        true
      );
      console.log('[GeoresourceAddModal] DRY RUN response', newGeoresourceResponse_dryRun);

      if (!this.kommonitorImporterHelperService.importerResponseContainsErrors(newGeoresourceResponse_dryRun)) {
        // all good, really execute the request to import data against data management API
        console.log('[GeoresourceAddModal] Dry run successful. Sending REAL request');
        const newGeoresourceResponse = await this.kommonitorImporterHelperService.registerNewGeoresource(
          this.converterDefinition,
          this.datasourceTypeDefinition,
          this.propertyMappingDefinition,
          this.postBody_georesources,
          false
        );
        console.log('[GeoresourceAddModal] REAL response', newGeoresourceResponse);

        // Broadcast refresh events
        this.broadcastService.broadcast('refreshGeoresourceOverviewTable', { action: 'add', id: this.kommonitorImporterHelperService.getIdFromImporterResponse(newGeoresourceResponse) });
        
        // refresh all admin dashboard diagrams due to modified metadata
        setTimeout(() => {
          this.broadcastService.broadcast('refreshAdminDashboardDiagrams');
        }, 500);

        this.successMessagePart = this.postBody_georesources.datasetName;
        this.importedFeatures = this.kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(newGeoresourceResponse) || [];

        // Show success alert before closing the modal
        this.successMessage = 'Georessource erfolgreich registriert';
        this.loadingData = false;
        this.cdr.detectChanges();

        // Close modal after a short delay and pass the created georesourceId to parent
        const createdId = this.kommonitorImporterHelperService.getIdFromImporterResponse(newGeoresourceResponse);
        setTimeout(() => {
          this.activeModal.close({ georesourceId: createdId });
        }, 1500);
      } else {
        // errors occurred
        this.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
        this.importerErrors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(newGeoresourceResponse_dryRun) || [];
        this.errorMessage = 'Validierung fehlgeschlagen';
      }
    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }

      this.errorMessage = 'Fehler beim Registrieren der Georessource';
      console.error('Error adding georesource:', error);
    } finally {
      this.loadingData = false;
    }
  }

  private async buildImporterObjects(): Promise<boolean> {
    console.log('[GeoresourceAddModal] Building importer objects with state', {
      converter: this.converter,
      schema: this.schema,
      mimeType: this.mimeType,
      datasourceType: this.datasourceType,
      georesourceDataSourceNameProperty: this.georesourceDataSourceNameProperty,
      georesourceDataSourceIdProperty: this.georesourceDataSourceIdProperty,
      validityStartDate_perFeature: this.validityStartDate_perFeature,
      validityEndDate_perFeature: this.validityEndDate_perFeature,
      datasetName: this.datasetName,
      ownerOrganization: this.ownerOrganization,
      isPublic: this.isPublic
    });

    this.converterDefinition = this.buildConverterDefinition();
    if (!this.converterDefinition) {
      console.warn('[GeoresourceAddModal] converterDefinition missing. Ensure schema/mimeType and all mandatory converter parameters are set.');
      this.errorMessage = 'Validierung fehlgeschlagen';
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON({
        cause: 'converterDefinition missing',
        hint: 'Schema/Format wählen und alle Pflicht-Parameter (z.B. CRS) setzen'
      });
      return false;
    }

    this.datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    if (!this.datasourceTypeDefinition) {
      console.warn('[GeoresourceAddModal] datasourceTypeDefinition missing. Ensure datasource type and its required parameters/file are set.');
      this.errorMessage = 'Validierung fehlgeschlagen';
      if (!this.errorMessagePart) {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON({
          cause: 'datasourceTypeDefinition missing',
          hint: 'Datenquelltyp wählen und alle Pflichtfelder (Datei/Parameter) ausfüllen'
        });
      }
      return false;
    }

    this.propertyMappingDefinition = this.buildPropertyMappingDefinition();
    if (!this.propertyMappingDefinition) {
      console.warn('[GeoresourceAddModal] propertyMappingDefinition missing. Ensure ID/NAME properties are provided.');
      this.errorMessage = 'Validierung fehlgeschlagen';
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON({
        cause: 'propertyMappingDefinition missing',
        hint: 'ID-/NAME-Attributnamen angeben'
      });
      return false;
    }

    this.postBody_georesources = this.buildPostBody_georesources();
    if (!this.postBody_georesources) {
      console.warn('[GeoresourceAddModal] postBody_georesources missing.');
      this.errorMessage = 'Validierung fehlgeschlagen';
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON({
        cause: 'postBody missing',
        hint: 'Pflichtfelder prüfen'
      });
      return false;
    }

    console.log('[GeoresourceAddModal] Built objects', {
      converterDefinition: this.converterDefinition,
      datasourceTypeDefinition: this.datasourceTypeDefinition,
      propertyMappingDefinition: this.propertyMappingDefinition,
      postBody: this.postBody_georesources
    });

    return true;
  }

  private buildConverterDefinition(): any {
    const formValues: { [key: string]: string } = {};
    // Collect currently rendered converter parameter inputs (if any)
    if (this.converter?.parameters && Array.isArray(this.converter.parameters)) {
      for (const p of this.converter.parameters) {
        const el = document.getElementById(`converterParameter_georesourceAdd_${p.name}`) as HTMLInputElement | null;
        if (el && typeof el.value === 'string') {
          formValues[p.name] = el.value;
        }
      }
    }
    const def = this.kommonitorImporterHelperService.buildConverterDefinition(
      this.converter, 
      "converterParameter_georesourceAdd_", 
      this.schema, 
      this.mimeType,
      formValues
    );
    console.log('[GeoresourceAddModal] buildConverterDefinition', {
      input: { converter: this.converter, schema: this.schema, mimeType: this.mimeType },
      result: def
    });
    return def;
  }

  private async buildDatasourceTypeDefinition(): Promise<any> {
    try {
      console.log('[GeoresourceAddModal] buildDatasourceTypeDefinition input', {
        datasourceType: this.datasourceType
      });

      // Pre-validate FILE datasource: require a selected file
      if (this.datasourceType?.type === 'FILE') {
        const fileInput: HTMLInputElement | null = (this.georesourceDataSourceInput?.nativeElement as HTMLInputElement) || (document.getElementById('georesourceDataSourceInput_add') as HTMLInputElement);
        const file = fileInput?.files?.[0];
        const hasFile = !!file;
        console.log('[GeoresourceAddModal] FILE datasource pre-check', {
          fileInputFound: !!fileInput,
          filesLength: fileInput?.files?.length || 0,
          hasFile
        });
        if (!hasFile) {
          this.georesourceDataSourceInputInvalid = true;
          this.georesourceDataSourceInputInvalidReason = 'Bitte eine Datei auswählen.';
          this.cdr.detectChanges();
          return null;
        }
        this.georesourceDataSourceInputInvalid = false;
        this.georesourceDataSourceInputInvalidReason = '';

        // Upload file immediately and build definition locally (robust approach used in SpatialUnit add)
        const uploadedName = await this.kommonitorImporterHelperService.uploadNewFile(file as File, (file as File).name);
        const localDef = {
          type: 'FILE',
          parameters: [
            { name: 'NAME', value: uploadedName }
          ]
        };
        console.log('[GeoresourceAddModal] buildDatasourceTypeDefinition FILE result (local)', localDef);
        return localDef;
      }
      const result = await this.kommonitorImporterHelperService.buildDatasourceTypeDefinition(
        this.datasourceType, 
        'datasourceTypeParameter_georesourceAdd_', 
        'georesourceDataSourceInput_add'
      );
      console.log('[GeoresourceAddModal] buildDatasourceTypeDefinition result', result);
      return result;
    } catch (error: any) {
      console.error('[GeoresourceAddModal] buildDatasourceTypeDefinition error', error);
      if (error.data) {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON({ message: error?.message || error });
      }

      this.loadingData = false;
      return null;
    }
  }

  private buildPropertyMappingDefinition(): any {
    const def = this.kommonitorImporterHelperService.buildPropertyMapping_spatialResource(
      this.georesourceDataSourceNameProperty, 
      this.georesourceDataSourceIdProperty, 
      this.validityStartDate_perFeature, 
      this.validityEndDate_perFeature, 
      '', 
      this.keepAttributes, 
      this.keepMissingValues, 
      this.attributeMappings_adminView
    );
    console.log('[GeoresourceAddModal] buildPropertyMappingDefinition', {
      input: {
        georesourceDataSourceNameProperty: this.georesourceDataSourceNameProperty,
        georesourceDataSourceIdProperty: this.georesourceDataSourceIdProperty,
        validityStartDate_perFeature: this.validityStartDate_perFeature,
        validityEndDate_perFeature: this.validityEndDate_perFeature,
        keepAttributes: this.keepAttributes,
        keepMissingValues: this.keepMissingValues,
        attributeMappings_adminView: this.attributeMappings_adminView
      },
      result: def
    });
    return def;
  }

  // Modal control methods
  cancel(): void {
    this.activeModal.dismiss();
  }

  // Compute reasons that prevent enabling the register button and log them for diagnostics
  getRegisterDisabledReasons(): string[] {
    const reasons: string[] = [];
    if (!this.datasetName) { reasons.push('datasetName'); }
    if (!this.metadata?.description) { reasons.push('metadata.description'); }
    if (!this.metadata?.datasource) { reasons.push('metadata.datasource'); }
    if (!this.metadata?.contact) { reasons.push('metadata.contact'); }
    if (!this.metadata?.updateInterval) { reasons.push('metadata.updateInterval'); }
    if (!this.metadata?.lastUpdate) { reasons.push('metadata.lastUpdate'); }
    if (!this.georesourceDataSourceIdProperty) { reasons.push('georesourceDataSourceIdProperty'); }
    if (!this.georesourceDataSourceNameProperty) { reasons.push('georesourceDataSourceNameProperty'); }
    if (!this.periodOfValidity?.startDate) { reasons.push('periodOfValidity.startDate'); }
    if (!this.schema && this.converter?.schemas?.length > 0) { reasons.push('schema'); }
    if (!this.mimeType && this.converter?.mimeTypes?.length > 0) { reasons.push('mimeType'); }
    if (this.datasetNameInvalid) { reasons.push('datasetNameInvalid'); }
    if (this.poiMarkerTextInvalid) { reasons.push('poiMarkerTextInvalid'); }
    if (this.periodOfValidityInvalid) { reasons.push('periodOfValidityInvalid'); }
    if (!this.converter) { reasons.push('converter'); }
    if (!this.datasourceType) { reasons.push('datasourceType'); }
    // Only require owner when security is enabled AND access control data is available
    const hasAccessControl = Array.isArray(this.kommonitorDataExchangeService.accessControl) && this.kommonitorDataExchangeService.accessControl.length > 0;
    if (this.kommonitorDataExchangeService.enableKeycloakSecurity && hasAccessControl && !this.ownerOrganization) { reasons.push('ownerOrganization'); }
    if (this.kommonitorDataExchangeService.enableKeycloakSecurity && !hasAccessControl) {
      if (!this.hasLoggedAccessControlEmptyWarning) {
        console.warn('[GeoresourceAddModal] Keycloak security enabled but access control is empty. Allowing submit without owner selection.');
        this.hasLoggedAccessControlEmptyWarning = true;
      }
    }
    return reasons;
  }

  isRegisterDisabled(): boolean {
    const reasons = this.getRegisterDisabledReasons();
    const key = reasons.slice().sort().join('|');
    const now = Date.now();
    if (reasons.length > 0 && key !== this.lastDisabledReasonsKey && (now - this.lastDisabledReasonsLogMs) > 1000) {
      console.log('[GeoresourceAddModal] Register button disabled due to:', reasons);
      this.lastDisabledReasonsKey = key;
      this.lastDisabledReasonsLogMs = now;
    }
    return reasons.length > 0;
  }
} 