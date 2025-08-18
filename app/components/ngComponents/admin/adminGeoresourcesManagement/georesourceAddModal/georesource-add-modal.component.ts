import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import { Subscription } from 'rxjs';
import { KommonitorGeoresourceDataExchangeService } from 'services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { KommonitorImporterHelperService } from 'services/adminGeoresourceUnit/kommonitor-importer-helper.service';
import { KommonitorMultiStepFormHelperService } from 'services/adminGeoresourceUnit/kommonitor-multi-step-form-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from 'services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';

@Component({
  selector: 'georesource-add-modal-new',
  templateUrl: './georesource-add-modal.component.html',
  styleUrls: ['./georesource-add-modal.component.css']
})
export class GeoresourceAddModalComponent implements OnInit {
  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('georesourceDataSourceInput', { static: false }) georesourceDataSourceInput!: ElementRef;
  @ViewChild('roleManagementGrid', { static: false }) roleManagementGrid!: AgGridAngular;

  // Multi-step form
  currentStep = 1;
  totalSteps = 4; // Will be adjusted based on security settings

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
    "allowedRoles": ['roleId'],
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
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('GeoresourceAddModalComponent ngOnInit');
    await this.initializeForm();
    this.setupEventListeners();
    
    // Debug: Check initial state
    console.log('Initial selectedPoiMarkerStyle:', this.selectedPoiMarkerStyle);
    console.log('Initial availablePoiMarkerColors:', this.availablePoiMarkerColors);
    
    // Add click outside handler for dropdown
    document.addEventListener('click', this.onDocumentClick.bind(this));
    
    // Initialize Bootstrap Icon Picker (same as AngularJS)
    console.log('ngOnInit: About to initialize icon picker...');
    
    // Test if button exists immediately
    const immediateTest = document.getElementById('poiSymbolPicker');
    console.log('ngOnInit: Immediate button test - found:', !!immediateTest);
    console.log('ngOnInit: selectedPoiMarkerStyle value:', this.selectedPoiMarkerStyle);
    console.log('ngOnInit: Should Symbol button be visible?', this.selectedPoiMarkerStyle === 'symbol');
    
    if (immediateTest) {
      console.log('ngOnInit: Button HTML:', immediateTest.outerHTML);
    } else {
      console.log('ngOnInit: Button NOT found - this means selectedPoiMarkerStyle !== "symbol"');
    }
    
    this.initializeIconPicker();
    console.log('ngOnInit: Icon picker initialization called');
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

  /**
   * Manual refresh topics for debugging
   */
  async manualRefreshTopics(): Promise<void> {
    console.log('=== MANUAL TOPICS REFRESH ===');
    console.log('Current availableTopics:', this.availableTopics);
    console.log('Current availableTopics length:', this.availableTopics?.length);
    
    // Check if services are properly injected
    console.log('Service injection check:');
    console.log('  - kommonitorDataExchangeService:', !!this.kommonitorDataExchangeService);
    console.log('  - kommonitorDataExchangeService type:', typeof this.kommonitorDataExchangeService);
    console.log('  - kommonitorDataExchangeService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.kommonitorDataExchangeService)));
    
    await this.loadTopicsData();
    
    console.log('After refresh - availableTopics:', this.availableTopics);
    console.log('After refresh - availableTopics length:', this.availableTopics?.length);
    console.log('=== END MANUAL REFRESH ===');
  }

  // Initialize resources creator rights (for non-admin users)
  private async initializeResourcesCreatorRights() {
    try {
      // Try to load real access control data first
      await this.reloadAccessControlData();
    } catch (error) {
      console.warn('Failed to load access control data, using test data:', error);
      // Fall back to test data if API call fails
      this.createTestAccessControlData();
    }
    
    // Initialize the role management table options with transformed data
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable',
      null,
      this.resourcesCreatorRights,
      []
    );
    
    // Initialize the role management table
    this.refreshRoles();
  }

  private async loadAvailableOptions(): Promise<void> {
    // Load available options from services
    this.updateIntervalOptions = this.kommonitorDataExchangeService.updateIntervalOptions || [];
    this.availablePoiMarkerColors = this.kommonitorDataExchangeService.availablePoiMarkerColors || [];
    this.availableLoiDashArrayObjects = this.kommonitorDataExchangeService.availableLoiDashArrayObjects || [];
    this.availableDatasourceTypes = this.kommonitorImporterHelperService.availableDatasourceTypes || [];
    
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
      console.log('=== LOADING TOPICS DATA ===');
      console.log('1. Starting topics data load...');
      
      this.loadingTopics = true;
      
      const roles = this.kommonitorDataExchangeService.currentKeycloakLoginRoles;
      console.log('2. Current roles:', roles);
      
      console.log('3. Calling fetchTopicsMetadata...');
      const topics = await this.kommonitorDataExchangeService.fetchTopicsMetadata(roles);
      console.log('4. Topics response received:', topics);
      
      if (topics && Array.isArray(topics)) {
        this.availableTopics = topics;
        console.log('5. Topics loaded successfully. Count:', this.availableTopics.length);
        console.log('6. First few topics:', this.availableTopics.slice(0, 3));
      } else {
        console.warn('5. No topics data received or invalid format');
        this.availableTopics = [];
      }
      
      console.log('7. Final availableTopics array:', this.availableTopics);
      console.log('=== END TOPICS LOADING ===');
    } catch (error: any) {
      console.error('=== ERROR LOADING TOPICS ===');
      console.error('Error loading topics data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      console.error('=== END ERROR ===');
      
      // Set fallback test data for development/testing
      console.log('Setting fallback test data for topics...');
      this.availableTopics = this.getFallbackTopicsData();
      
      // Try to show a user-friendly error message
      this.errorMessage = 'Fehler beim Laden der Themen. Verwende Testdaten.';
    } finally {
      this.loadingTopics = false;
    }
  }

  /**
   * Get fallback topics data for testing when API fails
   */
  private getFallbackTopicsData(): any[] {
    return [
      {
        topicId: 'test-topic-1',
        name: 'Test Hauptthema 1',
        topicName: 'Test Hauptthema 1',
        subTopics: [
          {
            topicId: 'test-subtopic-1-1',
            name: 'Test Unterthema 1.1',
            topicName: 'Test Unterthema 1.1',
            subTopics: []
          },
          {
            topicId: 'test-subtopic-1-2',
            name: 'Test Unterthema 1.2',
            topicName: 'Test Unterthema 1.2',
            subTopics: []
          }
        ]
      },
      {
        topicId: 'test-topic-2',
        name: 'Test Hauptthema 2',
        topicName: 'Test Hauptthema 2',
        subTopics: []
      },
      {
        topicId: 'test-topic-3',
        name: 'Test Hauptthema 3',
        topicName: 'Test Hauptthema 3',
        subTopics: [
          {
            topicId: 'test-subtopic-3-1',
            name: 'Test Unterthema 3.1',
            topicName: 'Test Unterthema 3.1',
            subTopics: []
          }
        ]
      }
    ];
  }

  /**
   * Set test data manually for debugging
   */
  setTestTopicsData(): void {
    console.log('=== SETTING TEST TOPICS DATA ===');
    console.log('Before setting - availableTopics:', this.availableTopics);
    console.log('Before setting - availableTopics length:', this.availableTopics?.length);
    
    this.availableTopics = this.getFallbackTopicsData();
    
    console.log('After setting - availableTopics:', this.availableTopics);
    console.log('After setting - availableTopics length:', this.availableTopics?.length);
    console.log('After setting - first topic:', this.availableTopics[0]);
    console.log('After setting - first topic name:', this.availableTopics[0]?.name);
    console.log('After setting - first topic topicName:', this.availableTopics[0]?.topicName);
    
    // Force change detection
    this.cdr.detectChanges();
    
    console.log('Change detection triggered');
    
    // Also try with a timeout to see if there's a timing issue
    setTimeout(() => {
      console.log('Timeout callback - availableTopics:', this.availableTopics);
      console.log('Timeout callback - availableTopics length:', this.availableTopics?.length);
      this.cdr.detectChanges();
      console.log('Timeout callback - change detection triggered again');
    }, 100);
    
    console.log('=== END SETTING TEST DATA ===');
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
      
      // Set the row data if we have it
      if (this.roleManagementTableOptions && this.roleManagementTableOptions.rowData) {
        params.api.setRowData(this.roleManagementTableOptions.rowData);
      }
    }
  }

  // Handle role management first data rendered event
  onRoleManagementFirstDataRendered(params: any) {
    // Role management first data rendered
  }

  // Handle role management column resized event
  onRoleManagementColumnResized(params: any) {
    // Role management column resized
  }

  // Handle role management model updated event
  onRoleManagementModelUpdated() {
    // Role management model updated
  }

  // Handle role management viewport changed event
  onRoleManagementViewportChanged() {
    // Role management viewport changed
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
      this.createTestAccessControlData();
    }
    
    // Get permission IDs for the selected organization (like other Angular components)
    let permissionIds: string[] = [];
    if (this.ownerOrganization) {
      const accessControlItem = this.kommonitorDataExchangeService.getAccessControlById(this.ownerOrganization);
      if (accessControlItem && accessControlItem.permissions) {
        permissionIds = accessControlItem.permissions
          .filter((permission: any) => permission.permissionLevel === 'viewer' || permission.permissionLevel === 'editor')
          .map((permission: any) => permission.permissionId);
      }
      
      // Set datasetOwner flag for the selected organization (like other Angular components)
      this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
        if (item.organizationalUnitId === this.ownerOrganization) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      });
    } else {
      // Use current user roles if no organization is selected
      permissionIds = this.kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds();
    }
    
    // Use transformed data for the grid
    const transformedData = this.transformAccessControlData(this.kommonitorDataExchangeService.accessControl);
    
    // Build role management grid with filtered data
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
        this.roleManagementGrid.api.setRowData(this.roleManagementTableOptions.rowData);
        
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
    this.refreshRoles();
  }

  // Handle owner organization change with proper validation
  onChangeOwnerOrganization(ownerOrganization: any): void {
    this.ownerOrganization = ownerOrganization;
    
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
      console.warn('Failed to load access control data from API, using test data:', error);
      this.createTestAccessControlData();
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
    console.log('=== ICON PICKER DEBUG ===');
    console.log('1. initializeIconPicker() called');
    console.log('2. Current selectedPoiIconName:', this.selectedPoiIconName);
    console.log('3. DOM ready state:', document.readyState);
    console.log('4. Component state - georesourceType:', this.georesourceType);
    console.log('5. Component state - selectedPoiMarkerStyle:', this.selectedPoiMarkerStyle);
    
    // Wait for the DOM to be ready
    setTimeout(() => {
      console.log('4. setTimeout callback executed (100ms delay)');
      
      // Check jQuery availability
      const jQueryAvailable = !!(window as any).$;
      const iconPickerAvailable = !!(window as any).$ && (window as any).$.fn?.iconpicker;
      
      console.log('5. jQuery available:', jQueryAvailable);
      console.log('6. Bootstrap Icon Picker available:', iconPickerAvailable);
      
      if (jQueryAvailable) {
        console.log('7. jQuery version:', (window as any).$.fn.jquery);
      }
      
      if (iconPickerAvailable) {
        console.log('8. Icon picker version:', (window as any).$.fn.iconpicker.Constructor.VERSION);
      }
      
      // Check if element exists
      const element = document.getElementById('poiSymbolPicker');
      console.log('9. Element found:', !!element);
      console.log('10. Element details:', element);
      
      if (element) {
        console.log('11. Element classes:', element.className);
        console.log('12. Element visible:', element.offsetParent !== null);
        console.log('13. Element styles:', window.getComputedStyle(element));
        console.log('14. Element HTML:', element.outerHTML);
        
        // Add a basic click handler immediately to test if clicks work at all
        element.addEventListener('click', (e) => {
          console.log('=== BASIC CLICK TEST ===');
          console.log('Basic click event triggered!');
          console.log('Event:', e);
          console.log('Element clicked:', e.target);
          console.log('=== END BASIC CLICK TEST ===');
        });
        console.log('15. Basic click handler added successfully');
      }
      
      if (element && (window as any).$ && (window as any).$.fn?.iconpicker) {
        console.log('14. All requirements met, initializing icon picker...');
        
        try {
          // Initialize Bootstrap Icon Picker with same options as AngularJS
          (window as any).$('#poiSymbolPicker').iconpicker({
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
            unselectedClass: ''
          });
          
          console.log('15. Icon picker initialized successfully');

          // Handle icon selection change (same logic as AngularJS)
          (window as any).$('#poiSymbolPicker').on('change', (e: any) => {
            console.log('16. Icon selection change event triggered:', e.icon);
            // Extract icon name from full class (e.g., "glyphicon-home" -> "home")
            this.selectedPoiIconName = e.icon.substring(e.icon.indexOf('-') + 1);
            console.log('17. New selectedPoiIconName:', this.selectedPoiIconName);
            this.cdr.detectChanges();
          });

          // Add click event logging to debug button clicks
          (window as any).$('#poiSymbolPicker').on('click', (e: any) => {
            console.log('=== BUTTON CLICK DEBUG ===');
            console.log('Button clicked! Event:', e);
            console.log('Event target:', e.target);
            console.log('Event currentTarget:', e.currentTarget);
            console.log('Button element:', (window as any).$('#poiSymbolPicker')[0]);
            
            // Check if icon picker is properly initialized
            const iconPickerInstance = (window as any).$('#poiSymbolPicker').data('iconpicker');
            console.log('Icon picker instance on click:', !!iconPickerInstance);
            
            // Try to manually show the picker
            try {
              console.log('Attempting to show icon picker...');
              (window as any).$('#poiSymbolPicker').iconpicker('show');
              console.log('Icon picker show() called successfully');
            } catch (error) {
              console.error('Error showing icon picker:', error);
            }
            
            console.log('=== END CLICK DEBUG ===');
          });

          // Add show event logging
          (window as any).$('#poiSymbolPicker').on('show', (e: any) => {
            console.log('=== ICON PICKER SHOW EVENT ===');
            console.log('Show event triggered:', e);
            console.log('Event type:', e.type);
            console.log('=== END SHOW EVENT ===');
          });

          // Add shown event logging
          (window as any).$('#poiSymbolPicker').on('shown', (e: any) => {
            console.log('=== ICON PICKER SHOWN EVENT ===');
            console.log('Shown event triggered:', e);
            console.log('Event type:', e.type);
            console.log('=== END SHOWN EVENT ===');
          });

          // Set initial icon
          (window as any).$('#poiSymbolPicker').iconpicker('setIcon', 'glyphicon-' + this.selectedPoiIconName);
          console.log('18. Initial icon set to:', 'glyphicon-' + this.selectedPoiIconName);
          
          // Test if icon picker is working
          const iconPickerInstance = (window as any).$('#poiSymbolPicker').data('iconpicker');
          console.log('19. Icon picker instance created:', !!iconPickerInstance);
          
          // Add native click event listener as backup
          const buttonElement = document.getElementById('poiSymbolPicker');
          if (buttonElement) {
            // Check button properties
            console.log('20. Button element properties:');
            console.log('   - disabled:', (buttonElement as HTMLButtonElement).disabled);
            console.log('   - readonly:', (buttonElement as any).readonly);
            console.log('   - tabIndex:', buttonElement.tabIndex);
            console.log('   - style.pointerEvents:', buttonElement.style.pointerEvents);
            console.log('   - style.cursor:', buttonElement.style.cursor);
            
            // Check computed styles
            const computedStyle = window.getComputedStyle(buttonElement);
            console.log('   - computed pointerEvents:', computedStyle.pointerEvents);
            console.log('   - computed cursor:', computedStyle.cursor);
            console.log('   - computed display:', computedStyle.display);
            console.log('   - computed visibility:', computedStyle.visibility);
            console.log('   - computed opacity:', computedStyle.opacity);
            
            buttonElement.addEventListener('click', (e) => {
              console.log('=== NATIVE CLICK EVENT ===');
              console.log('Native click event triggered');
              console.log('Event:', e);
              console.log('Element:', e.target);
              console.log('=== END NATIVE CLICK ===');
            });
          }
          
        } catch (error) {
          console.error('20. Error initializing icon picker:', error);
        }
      } else {
        console.warn('21. Cannot initialize icon picker - missing requirements');
        console.warn('   - Element exists:', !!element);
        console.warn('   - jQuery available:', jQueryAvailable);
        console.warn('   - Icon picker available:', iconPickerAvailable);
      }
      
      console.log('=== END ICON PICKER DEBUG ===');
    }, 100);
  }

  // Test method for debugging (can be called from browser console)
  testIconPickerDebug(): void {
    console.log('=== MANUAL ICON PICKER TEST ===');
    console.log('Component state:', {
      selectedPoiIconName: this.selectedPoiIconName,
      selectedPoiMarkerStyle: this.selectedPoiMarkerStyle,
      georesourceType: this.georesourceType
    });
    
    console.log('jQuery status:', {
      available: !!(window as any).$,
      version: (window as any).$ ? (window as any).$.fn.jquery : 'N/A'
    });
    
    console.log('Icon picker status:', {
      available: !!(window as any).$ && (window as any).$.fn?.iconpicker,
      version: (window as any).$ && (window as any).$.fn?.iconpicker ? 
        (window as any).$.fn.iconpicker.Constructor.VERSION : 'N/A'
    });
    
    const element = document.getElementById('poiSymbolPicker');
    console.log('DOM element:', {
      found: !!element,
      element: element,
      visible: element ? element.offsetParent !== null : false,
      classes: element ? element.className : 'N/A'
    });
    
    // Try to manually trigger icon picker
    if (element && (window as any).$ && (window as any).$.fn?.iconpicker) {
      console.log('Attempting to manually show icon picker...');
      try {
        (window as any).$('#poiSymbolPicker').iconpicker('show');
        console.log('Icon picker show() called successfully');
      } catch (error) {
        console.error('Error calling icon picker show():', error);
      }
    }
    
    console.log('=== END MANUAL TEST ===');
  }

    // Test method to manually click the button
  testButtonClick(): void {
    console.log('=== TESTING BUTTON CLICK ===');
    const button = document.getElementById('poiSymbolPicker');
    if (button) {
      console.log('Button found, attempting to click...');
      console.log('Button before click:', button);
      
      // Try different click methods
      try {
        // Method 1: Native click
        button.click();
        console.log('Native click() called');
        
        // Method 2: jQuery click
        if ((window as any).$) {
          (window as any).$('#poiSymbolPicker').click();
          console.log('jQuery click() called');
        }
        
        // Method 3: jQuery trigger
        if ((window as any).$) {
          (window as any).$('#poiSymbolPicker').trigger('click');
          console.log('jQuery trigger("click") called');
        }
        
      } catch (error) {
        console.error('Error during click test:', error);
      }
    } else {
      console.error('Button not found for click test');
    }
    console.log('=== END CLICK TEST ===');
  }

    // Test method to check button visibility and force symbol mode
  testButtonVisibility(): void {
    console.log('=== TESTING BUTTON VISIBILITY ===');
    console.log('Current selectedPoiMarkerStyle:', this.selectedPoiMarkerStyle);
    console.log('Current georesourceType:', this.georesourceType);
    
    // Check if button exists
    const button = document.getElementById('poiSymbolPicker');
    console.log('Button found in DOM:', !!button);
    
    if (!button) {
      console.log('Button not found - forcing symbol mode...');
      this.selectedPoiMarkerStyle = 'symbol';
      this.cdr.detectChanges();
      
      // Wait for DOM update
      setTimeout(() => {
        const newButton = document.getElementById('poiSymbolPicker');
        console.log('Button found after forcing symbol mode:', !!newButton);
        if (newButton) {
          console.log('Button HTML after forcing symbol mode:', newButton.outerHTML);
          this.initializeIconPicker();
        }
      }, 100);
    } else {
      console.log('Button found, HTML:', button.outerHTML);
    }
    
    console.log('=== END VISIBILITY TEST ===');
  }

  // Importer methods
  onChangeConverter(): void {
    this.schema = this.converter?.schemas ? this.converter.schemas[0] : undefined;
    this.mimeType = this.converter?.mimeTypes ? this.converter.mimeTypes[0] : undefined;
  }

  onChangeMimeType(mimeType: string): void {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any): void {
    this.datasourceType = datasourceType;
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
    console.log('Dropdown button clicked:', event);
    // Toggle custom dropdown state
    this.isMarkerStyleDropdownOpen = !this.isMarkerStyleDropdownOpen;
    this.cdr.detectChanges();
  }

  closeMarkerStyleDropdown(): void {
    this.isMarkerStyleDropdownOpen = false;
    this.cdr.detectChanges();
  }

  onDocumentClick(event: Event): void {
    // Close dropdown if clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.customColorPicker')) {
      this.isMarkerStyleDropdownOpen = false;
      this.cdr.detectChanges();
    }
  }

  onChangeMarkerStyle(markerStyle: string, event?: Event): void {
    console.log('=== MARKER STYLE CHANGE DEBUG ===');
    console.log('Previous selectedPoiMarkerStyle:', this.selectedPoiMarkerStyle);
    console.log('New markerStyle:', markerStyle);
    
    // Prevent default behavior and stop propagation to avoid any navigation issues
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Update the selected style
    this.selectedPoiMarkerStyle = markerStyle;
    console.log('Updated selectedPoiMarkerStyle:', this.selectedPoiMarkerStyle);
    
    // Force change detection to ensure the UI updates properly
    this.cdr.detectChanges();
    
    // Initialize icon picker if switching to symbol mode (same as AngularJS)
    if (markerStyle === 'symbol') {
      console.log('onChangeMarkerStyle: Switching to symbol mode, reinitializing icon picker...');
      console.log('Waiting for DOM update before initializing icon picker...');
      
      // Wait longer for DOM to update
      setTimeout(() => {
        console.log('onChangeMarkerStyle: DOM update timeout completed, checking button...');
        const button = document.getElementById('poiSymbolPicker');
        console.log('Button found after style change:', !!button);
        if (button) {
          console.log('Button HTML after style change:', button.outerHTML);
          this.initializeIconPicker();
        } else {
          console.log('Button still not found after style change - DOM update issue');
        }
      }, 200); // Increased timeout to 200ms
    } else {
      console.log('onChangeMarkerStyle: Not switching to symbol mode, skipping icon picker init');
    }
    
    console.log('=== END MARKER STYLE CHANGE DEBUG ===');
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
    const file = event.target.files[0];
    if (file) {
      this.parseMappingConfigFromFile(file);
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

    fileReader.readAsText(file);
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

    this.datasourceType = undefined;
    for (const datasourceType of this.kommonitorImporterHelperService.availableDatasourceTypes) {
      if (datasourceType.type === this.mappingConfigImportSettings.dataSource.type) {
        this.datasourceType = datasourceType;
        break;
      }
    }

    // converter parameters
    if (this.converter) {
      for (const convParameter of this.mappingConfigImportSettings.converter.parameters) {
        const element = document.getElementById("converterParameter_georesourceAdd_" + convParameter.name) as HTMLInputElement;
        if (element) {
          element.value = convParameter.value;
        }
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
    // Implementation for showing metadata error alert
  }

  private showMappingConfigErrorAlert(): void {
    // Implementation for showing mapping config error alert
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
    console.log('resetGeoresourceAddForm: Attempting to reset icon picker...');
    if ((window as any).$ && (window as any).$('#poiSymbolPicker').length > 0) {
      console.log('resetGeoresourceAddForm: jQuery and element found, resetting icon picker...');
      try {
        (window as any).$('#poiSymbolPicker').val("").iconpicker('setIcon', 'glyphicon-' + this.selectedPoiIconName);
        console.log('resetGeoresourceAddForm: Icon picker reset successfully');
      } catch (error) {
        console.error('resetGeoresourceAddForm: Error resetting icon picker:', error);
      }
    } else {
      console.warn('resetGeoresourceAddForm: Cannot reset icon picker - jQuery or element not available');
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

    this.metadataImportSettings = null;
    this.mappingConfigImportSettings = null;
    this.georesourceMetadataImportError = '';
    this.georesourceMappingConfigImportError = '';
  }

  // Build post body for API request
  buildPostBody_georesources(): any {
    const postBody: any = {
      "geoJsonString": "", // will be set by importer
      "allowedRoles": [],
      "metadata": {
        "note": this.metadata.note,
        "literature": this.metadata.literature,
        "updateInterval": this.metadata.updateInterval?.apiName,
        "sridEPSG": this.metadata.sridEPSG || 4326,
        "datasource": this.metadata.datasource,
        "contact": this.metadata.contact,
        "lastUpdate": this.metadata.lastUpdate,
        "description": this.metadata.description,
        "databasis": this.metadata.databasis
      },
      "jsonSchema": null,
      "datasetName": this.datasetName,
      "periodOfValidity": {
        "endDate": this.periodOfValidity.endDate,
        "startDate": this.periodOfValidity.startDate
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
      postBody["poiSymbolBootstrap3Name"] = this.selectedPoiIconName;
      postBody["poiSymbolColor"] = (this.selectedPoiSymbolColor as any)?.colorName || '';
      postBody["poiMarkerColor"] = (this.selectedPoiMarkerColor as any)?.colorName || '';
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

    return postBody;
  }

  // Main add method
  async addGeoresource(): Promise<void> {
    this.loadingData = true;
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';

    try {
      // Build importer objects
      const allDataSpecified = await this.buildImporterObjects();

      if (!allDataSpecified) {
        // Validation failed
        this.loadingData = false;
        return;
      }

      // Perform dry run
      const newGeoresourceResponse_dryRun = await this.kommonitorImporterHelperService.registerNewGeoresource(
        this.converterDefinition,
        this.datasourceTypeDefinition,
        this.propertyMappingDefinition,
        this.postBody_georesources,
        true
      );

      if (!this.kommonitorImporterHelperService.importerResponseContainsErrors(newGeoresourceResponse_dryRun)) {
        // all good, really execute the request to import data against data management API
        const newGeoresourceResponse = await this.kommonitorImporterHelperService.registerNewGeoresource(
          this.converterDefinition,
          this.datasourceTypeDefinition,
          this.propertyMappingDefinition,
          this.postBody_georesources,
          false
        );

        // Broadcast refresh events
        this.broadcastService.broadcast('refreshGeoresourceOverviewTable', { action: 'add', id: this.kommonitorImporterHelperService.getIdFromImporterResponse(newGeoresourceResponse) });
        
        // refresh all admin dashboard diagrams due to modified metadata
        setTimeout(() => {
          this.broadcastService.broadcast('refreshAdminDashboardDiagrams');
        }, 500);

        this.successMessagePart = this.postBody_georesources.datasetName;
        this.importedFeatures = this.kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(newGeoresourceResponse);

        this.successMessage = 'Georessource erfolgreich registriert';
        this.activeModal.close(true);
      } else {
        // errors occurred
        this.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
        this.importerErrors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(newGeoresourceResponse_dryRun);
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
    this.converterDefinition = this.buildConverterDefinition();
    this.datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    this.propertyMappingDefinition = this.buildPropertyMappingDefinition();
    this.postBody_georesources = this.buildPostBody_georesources();

    if (!this.converterDefinition || !this.datasourceTypeDefinition || !this.propertyMappingDefinition || !this.postBody_georesources) {
      return false;
    }

    return true;
  }

  private buildConverterDefinition(): any {
    return this.kommonitorImporterHelperService.buildConverterDefinition(
      this.converter, 
      "converterParameter_georesourceAdd_", 
      this.schema, 
      this.mimeType
    );
  }

  private async buildDatasourceTypeDefinition(): Promise<any> {
    try {
      return await this.kommonitorImporterHelperService.buildDatasourceTypeDefinition(
        this.datasourceType, 
        'datasourceTypeParameter_georesourceAdd_', 
        'georesourceDataSourceInput_add'
      );
    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }

      this.loadingData = false;
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

  // Modal control methods
  cancel(): void {
    this.activeModal.dismiss();
  }
} 