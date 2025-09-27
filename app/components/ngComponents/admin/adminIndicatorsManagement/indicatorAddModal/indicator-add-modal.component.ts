import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import { KommonitorIndicatorImporterHelperService } from 'services/adminIndicatorUnit/kommonitor-importer-helper.service';
import { KommonitorIndicatorCacheHelperService } from 'services/adminIndicatorUnit/kommonitor-cache-helper.service';
import { Subscription } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'indicator-add-modal-new',
  templateUrl: './indicator-add-modal.component.html',
  styleUrls: ['./indicator-add-modal.component.css']
})
export class IndicatorAddModalComponent implements OnInit, OnDestroy {
  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('roleManagementGrid', { static: false }) roleManagementGrid!: AgGridAngular;

  // Event subscriptions for role management (like AngularJS component)
  private roleUpdateSubscription?: Subscription;
  private metadataLoadingSubscription?: Subscription;

  // Grid API references for role management
  roleManagementGridApi: any = null;
  roleManagementColumnApi: any = null;

  // Multi-step form
  currentStep = 1;
  totalSteps = 7; // Will be adjusted based on security settings

  // Form data
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  loadingData = false;

  // Basic form data
  datasetName = '';
  datasetNameInvalid = false;
  indicatorAbbreviation = '';
  indicatorType: any = null;
  isHeadlineIndicator = false;
  indicatorUnit: string | null = null;
  enableFreeTextUnit = false;
  indicatorProcessDescription = '';
  indicatorTagsString_withCommas = '';
  indicatorInterpretation = '';
  indicatorCreationType: any = null;
  indicatorLowestSpatialUnitMetadataObjectForComputation: any = null;
  enableLowestSpatialUnitSelect = false;
  indicatorPrecision: any = null;
  showCustomCommaValue = false;

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

  // References
  indicatorReferences_adminView: any[] = [];
  indicatorReferences_apiRequest: any[] = [];
  georesourceReferences_adminView: any[] = [];
  georesourceReferences_apiRequest: any[] = [];

  // Topic hierarchy
  indicatorTopic_mainTopic: any = null;
  indicatorTopic_subTopic: any = null;
  indicatorTopic_subsubTopic: any = null;
  indicatorTopic_subsubsubTopic: any = null;

  // Step 3: Topic Hierarchy
  selectedTopic: any = null;
  selectedSubTopic: any = null;
  availableSubTopics: any[] = [];
  additionalTopic: any = null;
  additionalSubTopic: any = null;
  additionalSubTopics: any[] = [];
  additionalTopicAssignments: Array<{topic: any, subTopic: any}> = [];

  // Classification
  numClassesArray = [3, 4, 5, 6, 7, 8];
  numClassesPerSpatialUnit = 5;
  classificationMethod = 'jenks';
  selectedColorBrewerPaletteEntry: any = null;
  spatialUnitClassification: any[] = [];
  classBreaksInvalid = false;
  tabClasses: string[] = [];
  
  // Additional classification variables (missing from original)
  classificationMethodOptions: any[] = [];
  defaultClassificationMethod = 'jenks';
  enableManualClassification = false;
  enableRegionalClassification = false;

  // Role management
  roleManagementTableOptions: any = null;
  ownerOrganization: any = null;
  ownerOrgFilter = '';
  isPublic = false;
  resourcesCreatorRights: any[] = [];
  
  // Initialize resources creator rights (for non-admin users)
  private initializeResourcesCreatorRights() {
    // For now, use the same as access control, but this should be filtered based on user permissions
    this.resourcesCreatorRights = this.accessControl || [];
  }

  // Import/Export functionality
  metadataImportSettings: any = null;
  mappingConfigImportSettings: any = null;
  indicatorMetadataImportError = '';
  indicatorMappingConfigImportError = '';

  // Success/Error data
  successMessagePart = '';
  errorMessagePart = '';
  importerErrors: any[] = [];
  importedFeatures: any[] = [];

  // Available options
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  indicatorTypeOptions: any[] = [];
  indicatorCreationTypeOptions: any[] = [];
  colorbrewerPalettes: any[] = [];
  colorbrewerSchemes: any = {};
  availableIndicators: any[] = [];
  availableGeoresources: any[] = [];
  availableTopics: any[] = [];
  accessControl: any[] = [];
  colorbreweSchemeName_dynamicIncrease = 'Blues';
  colorbreweSchemeName_dynamicDecrease = 'Reds';
  
  // Step 5: Classification Options
  enableDynamicColorAssignment = false;
  currentClassificationTab = 0;
  decreaseBreaksLength = 0;
  increaseBreaksLength = 0;
  
  // Additional classification validation and color assignment variables
  classificationValidationErrors: string[] = [];
  enableColorValidation = false;
  dynamicColorAssignmentEnabled = false;
  negativeValueColorScheme = 'Reds';
  positiveValueColorScheme = 'Blues';
  zeroValueColor = '#bababa';
  classificationBreakValidationEnabled = true;
  
  // Step 6: Regional Comparison Values
  comparisonValueType: string | null = null;
  comparisonValue: number | null = null;
  comparisonRegion: string | null = null;
  comparisonTimeframe: string | null = null;
  comparisonDescription = '';
  evaluationDirection: string | null = null;
  toleranceRange: number | null = null;
  // Dates are handled as ISO strings by km-date-picker
  
  // Additional comparison values
  additionalComparisonType: string | null = null;
  additionalComparisonValue: number | null = null;
  additionalComparisonDescription = '';
  additionalComparisonValues: Array<{type: string, value: number, description: string}> = [];
  
  // Benchmarking configuration
  enableBenchmarking = false;
  benchmarkingVisualizationType: string | null = null;
  greenThreshold: number | null = null;
  yellowThreshold: number | null = null;
  redThreshold: number | null = null;
  
  // Step 7: Access Control and Ownership
  filteredOrganizations: any[] = [];
  roleFilter = '';
  filteredRoles: any[] = [];
  selectedRoles: any[] = [];


  
  // Advanced access control
  enableTimeRestrictedAccess = false;
  enableGeographicRestriction = false;
  accessStartDate = '';
  accessEndDate = '';
  allowedRegions: any[] = [];
  availableRegions: any[] = [];
  enableAccessLogging = false;

  // Temporary variables for references
  indicatorNameFilter = '';
  tmpIndicatorReference_selectedIndicatorMetadata: any = null;
  tmpIndicatorReference_referenceDescription = '';
  georesourceNameFilter = '';
  tmpGeoresourceReference_selectedGeoresourceMetadata: any = null;
  tmpGeoresourceReference_referenceDescription = '';
  
  // Step 4: Filtered lists for references
  filteredIndicators: any[] = [];
  filteredGeoresources: any[] = [];

  // Post body
  postBody_indicators: any = null;

  // Reference date
  indicatorReferenceDateNote = '';
  displayOrder = 0;

  // Helper: compute main topics for indicators (AngularJS parity) and deduplicate
  getMainIndicatorTopics(): any[] {
    const topics = this.availableTopics || [];
    const mains = topics.filter((t: any) => t && t.topicType === 'main' && (t.topicResource === 'indicator' || t.topicResource === undefined));
    return this.deduplicateTopicsByIdOrLabel(mains);
  }

  private deduplicateTopicsByIdOrLabel(topics: any[]): any[] {
    const seen = new Map<string, any>();
    for (const t of topics) {
      if (!t) { continue; }
      const id = (t.topicId || t.id || '').toString();
      const label = (t.topicName || t.name || '').toString().trim().toLowerCase();
      const key = id || label;
      if (!key) { continue; }
      if (!seen.has(key)) {
        seen.set(key, t);
      } else {
        const current = seen.get(key);
        const currChildren = Array.isArray(current?.subTopics) ? current.subTopics.length : 0;
        const newChildren = Array.isArray(t?.subTopics) ? t.subTopics.length : 0;
        if (newChildren > currChildren) {
          seen.set(key, t);
        }
      }
    }
    return Array.from(seen.values());
  }

  constructor(
    public activeModal: NgbActiveModal,
    public kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    public kommonitorImporterHelperService: KommonitorIndicatorImporterHelperService,
    public kommonitorDataGridHelperService: KommonitorIndicatorDataGridHelperService,
    private kommonitorCacheHelperService: KommonitorIndicatorCacheHelperService,
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) {
  }

  async ngOnInit() {
    await this.loadInitialData();
    this.initializeMultiStepForm();
    
    // Ensure color palettes are loaded
    if (this.colorbrewerPalettes.length === 0) {
      this.loadColorBrewerSchemes();
    }
    
    // Initialize role management grid after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.refreshRoles(); // Call refreshRoles() like AngularJS component
    }, 100);

    // Set up event listeners for role management (like AngularJS component)
    this.setupEventListeners();

    // Date inputs are bound directly to strings via km-date-picker
  }

  private async loadInitialData() {
    this.loadingData = true;
    
    // Ensure indicators and georesources data is loaded
    if (!this.kommonitorDataExchangeService.availableIndicators || this.kommonitorDataExchangeService.availableIndicators.length === 0) {
      await this.kommonitorDataExchangeService.fetchIndicatorsMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles);
    }
    
    if (!this.kommonitorDataExchangeService.availableGeoresources || this.kommonitorDataExchangeService.availableGeoresources.length === 0) {
      await this.kommonitorDataExchangeService.fetchGeoresourcesMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles);
    }

    // Ensure spatial units are loaded (needed for lowest spatial unit selection)
    if (!this.kommonitorDataExchangeService.availableSpatialUnits || this.kommonitorDataExchangeService.availableSpatialUnits.length === 0) {
      await this.kommonitorDataExchangeService.fetchSpatialUnitsMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles);
    }
    
    // Ensure access control data is loaded
    if (!this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
      try {
        await this.kommonitorDataExchangeService.fetchAccessControlMetadata();
      } catch (error) {
        this.createTestAccessControlData();
      }
    }
    
    // Load available spatial units
    this.availableSpatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits;
    this.indicatorLowestSpatialUnitMetadataObjectForComputation = this.availableSpatialUnits.length > 0 ? this.availableSpatialUnits[0] : null;

    // Load update interval options
    this.updateIntervalOptions = this.kommonitorDataExchangeService.updateIntervalOptions;

    // Load indicator type options
    this.indicatorTypeOptions = this.kommonitorDataExchangeService.indicatorTypeOptions;
    this.indicatorType = this.indicatorTypeOptions.length > 0 ? this.indicatorTypeOptions[0] : null;

    // Load indicator creation type options (cache locally to avoid template binding to a getter)
    this.indicatorCreationTypeOptions = this.kommonitorDataExchangeService.indicatorCreationTypeOptions || [];

    // Load available indicators
    this.availableIndicators = this.kommonitorDataExchangeService.availableIndicators;

    // Load available georesources
    this.availableGeoresources = this.kommonitorDataExchangeService.availableGeoresources;

    // Load available topics
    this.availableTopics = this.kommonitorDataExchangeService.availableTopics;

    // Load access control
    this.accessControl = this.kommonitorDataExchangeService.accessControl;

    // Load color brewer schemes
    this.loadColorBrewerSchemes();

    // Initialize filtered lists for Step 4
    this.filteredIndicators = this.availableIndicators || [];
    this.filteredGeoresources = this.availableGeoresources || [];

    // Initialize data for Step 7
    this.filteredOrganizations = this.accessControl || [];
    this.filteredRoles = this.accessControl || [];
    this.availableRegions = this.availableSpatialUnits || [];
    
    // Initialize resources creator rights
    this.initializeResourcesCreatorRights();

    this.loadingData = false;
  }

  private initializeMultiStepForm() {
    // Initialize multi-step form based on security settings
    if (this.kommonitorDataExchangeService.enableKeycloakSecurity) {
      this.totalSteps = 7; // Include role management step
    } else {
      this.totalSteps = 6;
    }

    // Initialize role management if available
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'indicatorAddRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
      this.kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds()
    );
    


    // Initialize classification
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }

  private loadColorBrewerSchemes() {
    // Load color brewer schemes from environment or default
    const customColorSchemes = (window as any).__env?.customColorSchemes;
    this.colorbrewerSchemes = (window as any).colorbrewer || {};
    
    // Fallback to default color schemes if colorbrewer is not available
    if (!this.colorbrewerSchemes || Object.keys(this.colorbrewerSchemes).length === 0) {
      console.warn('Colorbrewer library not found, using default color schemes');
      this.colorbrewerSchemes = {
        'Blues': {
          '3': ['#deebf7', '#9ecae1', '#3182bd'],
          '4': ['#deebf7', '#9ecae1', '#3182bd', '#08519c'],
          '5': ['#deebf7', '#9ecae1', '#3182bd', '#08519c', '#08306b'],
          '6': ['#f7fbff', '#deebf7', '#9ecae1', '#3182bd', '#08519c', '#08306b'],
          '7': ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#3182bd', '#08519c', '#08306b'],
          '8': ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c', '#08306b']
        },
        'Reds': {
          '3': ['#fee5d9', '#fcae91', '#de2d26'],
          '4': ['#fee5d9', '#fcae91', '#de2d26', '#a50f15'],
          '5': ['#fee5d9', '#fcae91', '#de2d26', '#a50f15', '#67000d'],
          '6': ['#fff5f0', '#fee5d9', '#fcae91', '#de2d26', '#a50f15', '#67000d'],
          '7': ['#fff5f0', '#fee5d9', '#fcbba1', '#fcae91', '#de2d26', '#a50f15', '#67000d'],
          '8': ['#fff5f0', '#fee5d9', '#fcbba1', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15', '#67000d']
        },
        'Greens': {
          '3': ['#e5f5e0', '#a1d99b', '#31a354'],
          '4': ['#e5f5e0', '#a1d99b', '#31a354', '#006d2c'],
          '5': ['#e5f5e0', '#a1d99b', '#31a354', '#006d2c', '#00441b'],
          '6': ['#f7fcf5', '#e5f5e0', '#a1d99b', '#31a354', '#006d2c', '#00441b'],
          '7': ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#31a354', '#006d2c', '#00441b'],
          '8': ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#31a354', '#006d2c', '#00441b']
        },
        'Oranges': {
          '3': ['#fee6ce', '#fdd0a2', '#e6550d'],
          '4': ['#fee6ce', '#fdd0a2', '#e6550d', '#a63603'],
          '5': ['#fee6ce', '#fdd0a2', '#e6550d', '#a63603', '#7f2704'],
          '6': ['#fff5eb', '#fee6ce', '#fdd0a2', '#e6550d', '#a63603', '#7f2704'],
          '7': ['#fff5eb', '#fee6ce', '#fed98e', '#fdd0a2', '#e6550d', '#a63603', '#7f2704'],
          '8': ['#fff5eb', '#fee6ce', '#fed98e', '#fdd0a2', '#fdbe85', '#e6550d', '#a63603', '#7f2704']
        }
      };
    }
    
    if (customColorSchemes) {
      this.colorbrewerSchemes = Object.assign(customColorSchemes, this.colorbrewerSchemes);
    }

    // Load environment configuration for classification
    this.loadEnvironmentConfiguration();

    this.instantiateColorBrewerPalettes();
  }

  // Helper method to get color palette colors safely
  getColorPaletteColors(paletteEntry: any, numColors: number): string[] {
    if (!paletteEntry || !paletteEntry.paletteArrayObject) {
      return ['#cccccc', '#cccccc', '#cccccc', '#cccccc', '#cccccc'];
    }
    
    const colors = paletteEntry.paletteArrayObject[numColors.toString()];
    if (!colors || !Array.isArray(colors)) {
      return ['#cccccc', '#cccccc', '#cccccc', '#cccccc', '#cccccc'];
    }
    
    return colors;
  }

  // Helper method to get color scheme colors safely
  getColorSchemeColors(schemeName: string, numColors: number): string[] {
    if (!this.colorbrewerSchemes || !this.colorbrewerSchemes[schemeName]) {
      return ['#cccccc', '#cccccc', '#cccccc', '#cccccc', '#cccccc'];
    }
    
    const colors = this.colorbrewerSchemes[schemeName][numColors.toString()];
    if (!colors || !Array.isArray(colors)) {
      return ['#cccccc', '#cccccc', '#cccccc', '#cccccc', '#cccccc'];
    }
    
    return colors;
  }

  // Helper method to get dynamic color for classification legend
  getDynamicColor(schemeName: string, breakLength: number, index: number, type: 'increase' | 'decrease'): string {
    if (!this.colorbrewerSchemes || !this.colorbrewerSchemes[schemeName]) {
      return '#cccccc';
    }
    
    const colors = this.colorbrewerSchemes[schemeName][(breakLength + 1).toString()];
    if (!colors || !Array.isArray(colors)) {
      return '#cccccc';
    }
    
    let colorIndex: number;
    if (type === 'decrease') {
      colorIndex = Math.max(0, breakLength - index - 1);
    } else {
      colorIndex = Math.max(0, breakLength - index - 1);
    }
    
    return colors[colorIndex] || '#cccccc';
  }

  // Method to manually reload color palettes
  reloadColorPalettes() {
    this.loadColorBrewerSchemes();
  }

  // Method to manually reload access control data
  async reloadAccessControlData() {
    try {
      // Try to fetch from API first
      await this.kommonitorDataExchangeService.fetchAccessControlMetadata();
      
      // Reload access control from service
      if (this.kommonitorDataExchangeService.accessControl) {
        this.accessControl = this.kommonitorDataExchangeService.accessControl;
        this.filteredOrganizations = this.accessControl || [];
        this.filteredRoles = this.accessControl || [];
      } else {
        throw new Error('No access control data returned from API');
      }
    } catch (error) {
      this.createTestAccessControlData();
    }
  }

  // Check if user has admin permissions (like AngularJS component)
  checkAdminPermission(): boolean {
    return this.kommonitorDataExchangeService.checkAdminPermission();
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
      'indicatorAddRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
      this.kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds()
    );
    
    // Refresh the grid if API is available
    if (this.roleManagementGridApi) {
      this.roleManagementGridApi.refreshCells();
      this.roleManagementGridApi.redrawRows();
    }
  }

  // Set up event listeners for role management (like AngularJS component)
  setupEventListeners() {
    // Listen for role updates (like AngularJS "availableRolesUpdate" event)
    // Note: We'll use a different approach since BroadcastService might not have the same API
    // In a real implementation, you would need to check the BroadcastService API
    
    // For now, we'll trigger refreshRoles() manually when needed
    // This matches the AngularJS pattern where refreshRoles() is called when events are triggered
  }

  // Refresh roles (like other Angular components)
  refreshRoles(orgUnitId?: string) {
    // Check if access control data is available
    if (!this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
      this.createTestAccessControlData();
    }
    
    // Get permission IDs for the selected organization (like other Angular components)
    let permissionIds: string[] = [];
    if (orgUnitId) {
      const accessControlItem = this.kommonitorDataExchangeService.getAccessControlById(orgUnitId);
      if (accessControlItem && accessControlItem.permissions) {
        permissionIds = accessControlItem.permissions
          .filter((permission: any) => permission.permissionLevel === 'viewer' || permission.permissionLevel === 'editor')
          .map((permission: any) => permission.permissionId);
      }
      
      // Set datasetOwner flag for the selected organization (like other Angular components)
      this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
        if (item.organizationalUnitId === orgUnitId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      });
    } else {
      // Use current user roles if no organization is selected
      permissionIds = this.kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds();
    }
    
    // Build role management grid with filtered data
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'indicatorAddRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
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



  // Create test access control data for development/testing
  private createTestAccessControlData() {
    this.accessControl = [
      {
        organizationalUnitId: 'org1',
        name: 'Test Organisation 1',
        organizationalUnitName: 'Test Organisation 1',
        organizationDescription: 'Erste Testorganisation für Entwicklung',
        viewerPermissionId: 'viewer_org1',
        editorPermissionId: 'editor_org1',
        creatorPermissionId: 'creator_org1',
        permissions: [
          {
            permissionId: 'viewer_org1',
            permissionLevel: 'viewer',
            roleName: 'Viewer',
            roleDescription: 'Nur Leserechte auf Daten'
          },
          {
            permissionId: 'editor_org1',
            permissionLevel: 'editor',
            roleName: 'Editor',
            roleDescription: 'Bearbeitung von Indikatoren und Daten'
          },
          {
            permissionId: 'creator_org1',
            permissionLevel: 'creator',
            roleName: 'Creator',
            roleDescription: 'Erstellen von neuen Datensätzen'
          }
        ]
      },
      {
        organizationalUnitId: 'org2',
        name: 'Test Organisation 2',
        organizationalUnitName: 'Test Organisation 2',
        organizationDescription: 'Zweite Testorganisation für Entwicklung',
        viewerPermissionId: 'viewer_org2',
        editorPermissionId: 'editor_org2',
        creatorPermissionId: 'creator_org2',
        permissions: [
          {
            permissionId: 'viewer_org2',
            permissionLevel: 'viewer',
            roleName: 'Viewer',
            roleDescription: 'Nur Leserechte auf Daten'
          },
          {
            permissionId: 'editor_org2',
            permissionLevel: 'editor',
            roleName: 'Editor',
            roleDescription: 'Bearbeitung von Indikatoren und Daten'
          },
          {
            permissionId: 'creator_org2',
            permissionLevel: 'creator',
            roleName: 'Creator',
            roleDescription: 'Erstellen von neuen Datensätzen'
          }
        ]
      },
      {
        organizationalUnitId: 'org3',
        name: 'Test Organisation 3',
        organizationalUnitName: 'Test Organisation 3',
        organizationDescription: 'Dritte Testorganisation für Entwicklung',
        viewerPermissionId: 'viewer_org3',
        editorPermissionId: 'editor_org3',
        creatorPermissionId: 'creator_org3',
        permissions: [
          {
            permissionId: 'viewer_org3',
            permissionLevel: 'viewer',
            roleName: 'Viewer',
            roleDescription: 'Nur Leserechte auf Daten'
          },
          {
            permissionId: 'editor_org3',
            permissionLevel: 'editor',
            roleName: 'Editor',
            roleDescription: 'Bearbeitung von Indikatoren und Daten'
          },
          {
            permissionId: 'creator_org3',
            permissionLevel: 'creator',
            roleName: 'Creator',
            roleDescription: 'Erstellen von neuen Datensätzen'
          }
        ]
      }
    ];
    
    // Also update the service's access control data
    this.kommonitorDataExchangeService.accessControl = this.accessControl;
    
    this.filteredOrganizations = this.accessControl;
    this.filteredRoles = this.accessControl;
  }

  private loadEnvironmentConfiguration() {
    // Load default classification method from environment
    this.defaultClassificationMethod = (window as any).__env?.defaultClassifyMethod || 'jenks';
    this.classificationMethod = this.defaultClassificationMethod;
    
    // Load color scheme names from environment
    this.colorbreweSchemeName_dynamicIncrease = (window as any).__env?.defaultColorBrewerPaletteForBalanceIncreasingValues || 'Blues';
    this.colorbreweSchemeName_dynamicDecrease = (window as any).__env?.defaultColorBrewerPaletteForBalanceDecreasingValues || 'Reds';
    
    // Load classification method options
    this.classificationMethodOptions = [
      { id: 'jenks', name: 'Jenks Natural Breaks', description: 'Automatische Klassifizierung nach natürlichen Brüchen' },
      { id: 'equal', name: 'Gleiche Intervalle', description: 'Gleichmäßige Aufteilung des Wertebereichs' },
      { id: 'manual', name: 'Manuelle Klassifizierung', description: 'Benutzerdefinierte Klassengrenzen' },
      { id: 'regional_default', name: 'Regionale Standard-Klassifizierung', description: 'Regionsspezifische Klassengrenzen' }
    ];
    
    // Check if manual classification is disabled
    if ((window as any).__env?.disableManualClassification) {
      this.classificationMethodOptions = this.classificationMethodOptions.filter(option => option.id !== 'manual');
    }
  }

  private instantiateColorBrewerPalettes() {
    this.colorbrewerPalettes = [];
    
    for (const key in this.colorbrewerSchemes) {
      if (this.colorbrewerSchemes.hasOwnProperty(key)) {
        const colorPalettes = this.colorbrewerSchemes[key];
        
        const paletteEntry = {
          "paletteName": key,
          "paletteArrayObject": colorPalettes
        };

        this.colorbrewerPalettes.push(paletteEntry);
      }
    }

    // Instantiate with palette 'Blues' or first available
    this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes.find(p => p.paletteName === 'Blues') || 
                                          this.colorbrewerPalettes[0];
  }

  // km-date-picker binds directly to ISO strings, no conversion helpers needed

  checkDatasetName() {
    this.datasetNameInvalid = false;
    
    if (this.datasetName && this.indicatorType && this.kommonitorDataExchangeService.availableIndicators) {
      this.kommonitorDataExchangeService.availableIndicators.forEach((indicator: any) => {
        if (indicator.datasetName === this.datasetName && 
            indicator.indicatorType === this.indicatorType.apiName) {
          this.datasetNameInvalid = true;
          return;
        }
      });
    }
  }



  // Reference management methods
  onAddOrUpdateIndicatorReference() {
    if (this.tmpIndicatorReference_selectedIndicatorMetadata && this.tmpIndicatorReference_referenceDescription) {
      const tmpReference = {
        "indicatorMetadata": this.tmpIndicatorReference_selectedIndicatorMetadata,
        "referenceDescription": this.tmpIndicatorReference_referenceDescription
      };

      let processed = false;
      for (let index = 0; index < this.indicatorReferences_adminView.length; index++) {
        const indicatorReference = this.indicatorReferences_adminView[index];
        if (indicatorReference.indicatorMetadata.indicatorId === tmpReference.indicatorMetadata.indicatorId) {
          // replace object
          this.indicatorReferences_adminView[index] = tmpReference;
          processed = true;
          break;
        }
      }

      if (!processed) {
        // new entry
        this.indicatorReferences_adminView.push(tmpReference);
      }

      this.tmpIndicatorReference_selectedIndicatorMetadata = null;
      this.tmpIndicatorReference_referenceDescription = '';
    }
  }

  onClickEditIndicatorReference(indicatorReference: any) {
    this.tmpIndicatorReference_selectedIndicatorMetadata = indicatorReference.indicatorMetadata;
    this.tmpIndicatorReference_referenceDescription = indicatorReference.referenceDescription;
      }

  onClickDeleteIndicatorReference(indicatorReference: any) {
    for (let index = 0; index < this.indicatorReferences_adminView.length; index++) {
      if (this.indicatorReferences_adminView[index].indicatorMetadata.indicatorId === indicatorReference.indicatorMetadata.indicatorId) {
        // remove object
        this.indicatorReferences_adminView.splice(index, 1);
        break;
      }
    }
  }

  onAddOrUpdateGeoresourceReference() {
    if (this.tmpGeoresourceReference_selectedGeoresourceMetadata && this.tmpGeoresourceReference_referenceDescription) {
      const tmpReference = {
        "georesourceMetadata": this.tmpGeoresourceReference_selectedGeoresourceMetadata,
        "referenceDescription": this.tmpGeoresourceReference_referenceDescription
      };

      let processed = false;
      for (let index = 0; index < this.georesourceReferences_adminView.length; index++) {
        const georesourceReference = this.georesourceReferences_adminView[index];
        if (georesourceReference.georesourceMetadata.georesourceId === tmpReference.georesourceMetadata.georesourceId) {
          // replace object
          this.georesourceReferences_adminView[index] = tmpReference;
          processed = true;
          break;
        }
      }

      if (!processed) {
        // new entry
        this.georesourceReferences_adminView.push(tmpReference);
      }

      this.tmpGeoresourceReference_selectedGeoresourceMetadata = null;
      this.tmpGeoresourceReference_referenceDescription = '';
    }
  }

  onClickEditGeoresourceReference(georesourceReference: any) {
    this.tmpGeoresourceReference_selectedGeoresourceMetadata = georesourceReference.georesourceMetadata;
    this.tmpGeoresourceReference_referenceDescription = georesourceReference.referenceDescription;
  }

  onClickDeleteGeoresourceReference(georesourceReference: any) {
    for (let index = 0; index < this.georesourceReferences_adminView.length; index++) {
      if (this.georesourceReferences_adminView[index].georesourceMetadata.georesourceId === georesourceReference.georesourceMetadata.georesourceId) {
        // remove object
      this.georesourceReferences_adminView.splice(index, 1);
        break;
      }
    }
  }

  // Map UI classification method to API enum
  private mapClassificationMethodForApi(method: string | null | undefined): string {
    const m = (method || '').toLowerCase();
    switch (m) {
      case 'jenks':
        return 'JENKS';
      case 'equal':
      case 'equal_interval':
        return 'EQUAL_INTERVAL';
      case 'manual':
        return 'MANUAL';
      case 'regional_default':
        return 'REGIONAL_DEFAULT';
      default:
        return (method || 'EQUAL_INTERVAL').toString().toUpperCase();
    }
  }

  private isManualLikeClassification(methodApi: string): boolean {
    return methodApi === 'MANUAL' || methodApi === 'REGIONAL_DEFAULT';
  }

  private getClassificationItemsForApi(methodApi: string) {
    if (!this.isManualLikeClassification(methodApi)) {
      return [];
    }
    return this.spatialUnitClassification.map(classification => ({
      "spatialUnit": classification.spatialUnitId,
      "breaks": (classification.breaks || []).filter((breakVal: any) => breakVal !== null && breakVal !== '' && breakVal !== undefined)
    }));
  }

  private getSridForApi(): number {
    const srid = Number(this.metadata?.sridEPSG);
    return Number.isFinite(srid) && srid > 0 ? srid : 4326;
  }

  // Build post body for API request
  buildPostBody_indicators() {
    // Convert references to API format
    this.convertReferencesToApiFormat();

    const classificationMethodApi = this.mapClassificationMethodForApi(this.classificationMethod);

    const postBody: any = {
      "datasetName": this.datasetName,
      "abbreviation": this.indicatorAbbreviation,
      "indicatorType": this.indicatorType?.apiName,
      "isHeadlineIndicator": this.isHeadlineIndicator,
      "unit": this.indicatorUnit,
      "processDescription": this.indicatorProcessDescription,
      "interpretation": this.indicatorInterpretation,
      "creationType": this.indicatorCreationType?.apiName,
      "lowestSpatialUnitForComputation": this.indicatorLowestSpatialUnitMetadataObjectForComputation?.spatialUnitLevel,
      "referenceDateNote": this.indicatorReferenceDateNote,
      "displayOrder": this.displayOrder,
      "metadata": {
        "note": this.metadata.note,
        "literature": this.metadata.literature,
        "updateInterval": this.metadata.updateInterval?.apiName,
        "sridEPSG": this.getSridForApi(),
        "datasource": this.metadata.datasource,
        "contact": this.metadata.contact,
        "lastUpdate": this.metadata.lastUpdate,
        "description": this.metadata.description,
        "databasis": this.metadata.databasis
      },
      "permissions": [] as string[],
      "refrencesToOtherIndicators": this.indicatorReferences_apiRequest,
      "refrencesToGeoresources": this.georesourceReferences_apiRequest,
      "defaultClassificationMapping": {
        "colorBrewerSchemeName": this.selectedColorBrewerPaletteEntry?.paletteName,
        "numClasses": this.numClassesPerSpatialUnit,
        "classificationMethod": classificationMethodApi,
        "items": this.getClassificationItemsForApi(classificationMethodApi)
      }
    };

    // Owner and visibility
    if (this.ownerOrganization?.organizationalUnitId) {
      postBody.ownerId = this.ownerOrganization.organizationalUnitId;
    }
    if (typeof this.isPublic === 'boolean') {
      postBody.isPublic = this.isPublic;
    }

    // Add topic reference if selected
    if (this.indicatorTopic_subsubsubTopic) {
      postBody.topicReference = this.indicatorTopic_subsubsubTopic.topicId;
    } else if (this.indicatorTopic_subsubTopic) {
      postBody.topicReference = this.indicatorTopic_subsubTopic.topicId;
    } else if (this.indicatorTopic_subTopic) {
      postBody.topicReference = this.indicatorTopic_subTopic.topicId;
    } else if (this.indicatorTopic_mainTopic) {
      postBody.topicReference = this.indicatorTopic_mainTopic.topicId;
    }

    // Add tags if provided
    if (this.indicatorTagsString_withCommas) {
      postBody.tags = this.indicatorTagsString_withCommas.split(',').map((tag: string) => tag.trim());
    }

    // Add precision if custom value is enabled
    if (this.showCustomCommaValue && this.indicatorPrecision !== null) {
      postBody.precision = this.indicatorPrecision;
    }

    // Add role permissions
    if (this.roleManagementTableOptions) {
      const roleIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          postBody.permissions.push(roleId);
        }
      }
    }

    return postBody;
  }

  async addIndicator() {
    this.loadingData = true;
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';

    try {
      this.postBody_indicators = this.buildPostBody_indicators();

      const response = await this.http.post(
        this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators",
        this.postBody_indicators
      ).toPromise();

      this.broadcastService.broadcast("refreshIndicatorOverviewTable", { crudType: "add", targetIndicatorId: (response as any).indicatorId });

      // Refresh all admin dashboard diagrams due to modified metadata
      setTimeout(() => {
        this.broadcastService.broadcast("refreshAdminDashboardDiagrams");
      }, 500);

      this.successMessagePart = this.postBody_indicators.datasetName;
      this.loadingData = false;
      
      // Close modal with success result
      setTimeout(() => {
        this.activeModal.close('success');
      }, 2000);

    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }

      this.loadingData = false;
    }
  }

  onSubmit() {
    if (!this.datasetNameInvalid && !this.classBreaksInvalid) {
      this.addIndicator();
    }
  }

  // Multi-step navigation
  nextStep() {
    const maxSteps = this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.enableKeycloakSecurity ? 7 : 6;
    if (this.currentStep < maxSteps) {
      this.currentStep++;
      this.updateProgressBar();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressBar();
    }
  }

  goToStep(step: number) {
    const maxSteps = this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.enableKeycloakSecurity ? 7 : 6;
    
    // Allow navigation to any step without validation (like old AngularJS counterpart)
    if (step >= 1 && step <= maxSteps) {
  
      this.currentStep = step;
      this.updateProgressBar();
      
      // Initialize filtered lists when navigating to Step 4
      if (step === 4) {
        this.filterIndicators();
        this.filterGeoresources();
        // Expand the collapsible boxes by default for better UX
        this.isIndicatorReferencesCollapsed = false;
        this.isGeoresourceReferencesCollapsed = false;
      }
      
      // Initialize access control data when navigating to Step 7
      if (step === 7) {
        // Ensure access control data is loaded
        if (this.filteredOrganizations.length === 0 || this.filteredRoles.length === 0) {
    
          this.reloadAccessControlData();
        }
        
        // Initialize role management grid with delay to ensure DOM is ready (like AngularJS component)
        setTimeout(() => {
          this.refreshRoles(); // Call refreshRoles() like AngularJS component
        }, 200);
      }
      
      // Show validation feedback if navigating to a step that requires validation
      if (step > 1 && !this.isStepValid(step)) {

        // You can add visual feedback here if needed
      }
    }
  }

  // Import/Export functionality
  onImportIndicatorAddMetadata() {
    this.indicatorMetadataImportError = '';
    if (this.metadataImportFile) {
      this.metadataImportFile.nativeElement.click();
    }
  }

  onImportIndicatorAddMappingConfig() {
    this.indicatorMappingConfigImportError = '';
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
      } catch (error) {
        console.error(error);
        console.error("Uploaded Metadata File cannot be parsed.");
        this.indicatorMetadataImportError = "Uploaded Metadata File cannot be parsed correctly";
      }
    };

    fileReader.readAsText(file);
  }

  parseMappingConfigFromFile(file: File) {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMappingConfigFile(event);
      } catch (error) {
        console.error(error);
        console.error("Uploaded MappingConfig File cannot be parsed.");
        this.indicatorMappingConfigImportError = "Uploaded MappingConfig File cannot be parsed correctly";
      }
    };

    fileReader.readAsText(file);
  }

  parseFromMetadataFile(event: any) {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      console.error("uploaded Metadata File cannot be parsed - wrong structure.");
      this.indicatorMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster überein.";
      return;
    }

    // Parse metadata
    this.metadata = {};
    this.metadata.note = this.metadataImportSettings.metadata.note;
    this.metadata.literature = this.metadataImportSettings.metadata.literature;
    
    // Update interval: select from the same array the template uses to avoid identity mismatch
    if (!this.updateIntervalOptions || this.updateIntervalOptions.length === 0) {
      this.updateIntervalOptions = this.kommonitorDataExchangeService.updateIntervalOptions || [];
    }
    if (Array.isArray(this.updateIntervalOptions) && this.metadataImportSettings.metadata.updateInterval) {
      const importedInterval = this.metadataImportSettings.metadata.updateInterval;
      const match = this.updateIntervalOptions.find((opt: any) => opt.apiName === importedInterval);
      if (match) {
        this.metadata.updateInterval = match;
      } else {
        // Fallback: add missing interval to options and select it (align with georesource add modal)
        const fallbackInterval = { apiName: importedInterval, displayName: importedInterval };
        this.updateIntervalOptions = [...this.updateIntervalOptions, fallbackInterval];
        this.metadata.updateInterval = fallbackInterval;
      }
    }
    
    this.metadata.sridEPSG = this.metadataImportSettings.metadata.sridEPSG;
    this.metadata.datasource = this.metadataImportSettings.metadata.datasource;
    this.metadata.contact = this.metadataImportSettings.metadata.contact;
    this.metadata.lastUpdate = this.metadataImportSettings.metadata.lastUpdate;
    this.metadata.description = this.metadataImportSettings.metadata.description;
    this.metadata.databasis = this.metadataImportSettings.metadata.databasis;

    // Parse basic fields
    this.datasetName = this.metadataImportSettings.datasetName || '';
    this.indicatorAbbreviation = this.metadataImportSettings.abbreviation || '';
    const importedUnit: string = this.metadataImportSettings.unit || '';
    this.indicatorUnit = importedUnit;
    this.indicatorProcessDescription = this.metadataImportSettings.processDescription || '';
    this.indicatorInterpretation = this.metadataImportSettings.interpretation || '';
    this.indicatorReferenceDateNote = this.metadataImportSettings.referenceDateNote || '';
    this.displayOrder = this.metadataImportSettings.displayOrder || 0;
    this.isHeadlineIndicator = this.metadataImportSettings.isHeadlineIndicator || false;

    // Toggle free-text unit if imported unit is not in predefined options (align with AngularJS behavior)
    try {
      const unitOptions = this.kommonitorDataExchangeService.indicatorUnitOptions || [];
      this.enableFreeTextUnit = importedUnit ? !unitOptions.includes(importedUnit) : false;
    } catch (_) {
      this.enableFreeTextUnit = false;
    }

    // Precision (if provided), keep UI toggle in sync
    if (this.metadataImportSettings.hasOwnProperty('precision')) {
      const p = this.metadataImportSettings.precision;
      this.indicatorPrecision = (p !== '' && p !== undefined && p !== null) ? parseInt(p, 10) : null;
      this.showCustomCommaValue = this.indicatorPrecision !== null;
    }

    // Parse indicator type
    if (this.metadataImportSettings.indicatorType) {
      // Prefer the already-bound options array to avoid object identity mismatches in the template
      const options = this.indicatorTypeOptions && this.indicatorTypeOptions.length > 0
        ? this.indicatorTypeOptions
        : (this.kommonitorDataExchangeService.indicatorTypeOptions || []);
      for (const option of options) {
        if (option.apiName === this.metadataImportSettings.indicatorType) {
          this.indicatorType = option;
          break;
        }
      }
    }

    // Parse creation type
    if (this.metadataImportSettings.creationType) {
      const creationOptions = this.indicatorCreationTypeOptions && this.indicatorCreationTypeOptions.length > 0
        ? this.indicatorCreationTypeOptions
        : (this.kommonitorDataExchangeService.indicatorCreationTypeOptions || []);
      for (const option of creationOptions) {
        if (option.apiName === this.metadataImportSettings.creationType) {
          this.indicatorCreationType = option;
          this.enableLowestSpatialUnitSelect = option.apiName === 'COMPUTATION';
          break;
        }
      }
    }

    // Parse tags
    if (this.metadataImportSettings.tags && Array.isArray(this.metadataImportSettings.tags)) {
      this.indicatorTagsString_withCommas = this.metadataImportSettings.tags.join(', ');
    }

    // Parse references
    if (this.metadataImportSettings.refrencesToOtherIndicators && this.kommonitorDataExchangeService.availableIndicators) {
      this.indicatorReferences_apiRequest = this.metadataImportSettings.refrencesToOtherIndicators;
      // Populate admin view
      this.indicatorReferences_adminView = [];
      this.indicatorReferences_apiRequest.forEach((ref: any) => {
        const indicator = this.kommonitorDataExchangeService.availableIndicators.find((ind: any) => ind.indicatorId === ref.indicatorId);
        if (indicator) {
          this.indicatorReferences_adminView.push({
            indicatorId: ref.indicatorId,
            referenceDescription: ref.referenceDescription,
            indicatorName: indicator.indicatorName
          });
        }
      });
    }

    if (this.metadataImportSettings.refrencesToGeoresources && this.kommonitorDataExchangeService.availableGeoresources) {
      this.georesourceReferences_apiRequest = this.metadataImportSettings.refrencesToGeoresources;
      // Populate admin view
      this.georesourceReferences_adminView = [];
      this.georesourceReferences_apiRequest.forEach((ref: any) => {
        const georesource = this.kommonitorDataExchangeService.availableGeoresources.find((geo: any) => geo.georesourceId === ref.georesourceId);
        if (georesource) {
          this.georesourceReferences_adminView.push({
            georesourceId: ref.georesourceId,
            referenceDescription: ref.referenceDescription,
            georesourceName: georesource.georesourceName
          });
        }
      });
    }

    // Enhanced classification mapping parsing
    if (this.metadataImportSettings.defaultClassificationMapping) {
      const mapping = this.metadataImportSettings.defaultClassificationMapping;
      
      // Parse basic classification settings
      this.numClassesPerSpatialUnit = mapping.numClasses || 5;
      this.classificationMethod = mapping.classificationMethod || 'jenks';
      
      // Parse color brewer palette
      if (mapping.colorBrewerSchemeName) {
        this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes.find(palette => 
          palette.paletteName === mapping.colorBrewerSchemeName
        );
      }

      // Parse dynamic color assignment settings
      if (mapping.dynamicColorAssignment) {
        this.dynamicColorAssignmentEnabled = mapping.dynamicColorAssignment.enabled || false;
        this.negativeValueColorScheme = mapping.dynamicColorAssignment.negativeColorScheme || 'Reds';
        this.positiveValueColorScheme = mapping.dynamicColorAssignment.positiveColorScheme || 'Blues';
        this.zeroValueColor = mapping.dynamicColorAssignment.zeroColor || '#bababa';
      }

      // Parse spatial unit classification with enhanced validation
      if (mapping.items) {
        this.onNumClassesChanged(this.numClassesPerSpatialUnit);
        mapping.items.forEach((item: any) => {
          const index = this.spatialUnitClassification.findIndex(classification => 
            classification.spatialUnitId === item.spatialUnit
          );
          if (index > -1) {
            this.spatialUnitClassification[index].breaks = item.breaks || [];
            
            // Parse color assignment if available
            if (item.colorAssignment) {
              this.spatialUnitClassification[index].colorAssignment = item.colorAssignment;
            }
          }
        });
        
        // Update color assignment for all spatial units
        this.updateColorAssignmentForAllSpatialUnits();
      }

      // Parse validation settings
      if (mapping.validation) {
        this.classificationBreakValidationEnabled = mapping.validation.enabled !== false;
        this.enableColorValidation = mapping.validation.colorValidation || false;
      }
    }

    // Lowest spatial unit (if provided)
    if (this.metadataImportSettings.lowestSpatialUnitForComputation && Array.isArray(this.availableSpatialUnits)) {
      const targetLevel = this.metadataImportSettings.lowestSpatialUnitForComputation;
      const found = this.availableSpatialUnits.find(su => su.spatialUnitLevel === targetLevel);
      if (found) {
        this.indicatorLowestSpatialUnitMetadataObjectForComputation = found;
      }
    }

    // Parse role permissions
    if (this.kommonitorDataExchangeService.accessControl && this.metadataImportSettings.allowedRoles) {
      this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
        'indicatorAddRoleManagementTable', 
        this.roleManagementTableOptions, 
        this.kommonitorDataExchangeService.accessControl, 
        this.metadataImportSettings.allowedRoles
      );
    } else if (this.kommonitorDataExchangeService.accessControl) {
      // Initialize with current user roles if no imported roles
      this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
        'indicatorAddRoleManagementTable', 
        this.roleManagementTableOptions, 
        this.kommonitorDataExchangeService.accessControl, 
        this.kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds()
      );
    }

    // Classification settings imported
  }

  parseFromMappingConfigFile(event: any) {
    this.mappingConfigImportSettings = JSON.parse(event.target.result);

    if (!this.mappingConfigImportSettings.converter || !this.mappingConfigImportSettings.dataSource || !this.mappingConfigImportSettings.propertyMapping) {
      console.error("uploaded MappingConfig File cannot be parsed - wrong structure.");
      this.indicatorMappingConfigImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster überein.";
      return;
    }

    // Parse converter settings
    // This would be similar to spatial unit mapping config parsing
    // but adapted for indicators
  }

  onExportIndicatorAddMetadataTemplate() {
    const metadataJSON = JSON.stringify(this.indicatorMetadataStructure);
    const fileName = "Indikator_Metadaten_Vorlage_Export.json";
    this.downloadFile(metadataJSON, fileName);
  }

  onExportIndicatorAddMetadata() {
    const metadataExport: any = { ...this.indicatorMetadataStructure };

    // Populate with current form data
    metadataExport.datasetName = this.datasetName || "";
    metadataExport.abbreviation = this.indicatorAbbreviation || "";
    metadataExport.unit = this.indicatorUnit || "";
    metadataExport.processDescription = this.indicatorProcessDescription || "";
    metadataExport.interpretation = this.indicatorInterpretation || "";
    metadataExport.referenceDateNote = this.indicatorReferenceDateNote || "";
    metadataExport.displayOrder = this.displayOrder || 0;
    metadataExport.isHeadlineIndicator = this.isHeadlineIndicator || false;

    if (this.indicatorType) {
      metadataExport.indicatorType = this.indicatorType.apiName;
    }

    if (this.indicatorCreationType) {
      metadataExport.creationType = this.indicatorCreationType.apiName;
    }

    if (this.indicatorTagsString_withCommas) {
      metadataExport.tags = this.indicatorTagsString_withCommas.split(',').map((tag: string) => tag.trim());
    }

    if (this.showCustomCommaValue && this.indicatorPrecision !== null) {
      metadataExport.precision = this.indicatorPrecision;
    }

    // Add metadata
    metadataExport.metadata.note = this.metadata.note || "";
    metadataExport.metadata.literature = this.metadata.literature || "";
    metadataExport.metadata.sridEPSG = this.metadata.sridEPSG || "";
    metadataExport.metadata.datasource = this.metadata.datasource || "";
    metadataExport.metadata.contact = this.metadata.contact || "";
    metadataExport.metadata.lastUpdate = this.metadata.lastUpdate || "";
    metadataExport.metadata.description = this.metadata.description || "";
    metadataExport.metadata.databasis = this.metadata.databasis || "";

    if (this.metadata.updateInterval) {
      metadataExport.metadata.updateInterval = this.metadata.updateInterval.apiName;
    }

    // Add references
    metadataExport.refrencesToOtherIndicators = this.indicatorReferences_apiRequest;
    metadataExport.refrencesToGeoresources = this.georesourceReferences_apiRequest;

    // Enhanced classification mapping export
    metadataExport.defaultClassificationMapping = {
      colorBrewerSchemeName: this.selectedColorBrewerPaletteEntry?.paletteName,
      numClasses: this.numClassesPerSpatialUnit,
      classificationMethod: this.classificationMethod,
      dynamicColorAssignment: {
        enabled: this.dynamicColorAssignmentEnabled,
        negativeColorScheme: this.negativeValueColorScheme,
        positiveColorScheme: this.positiveValueColorScheme,
        zeroColor: this.zeroValueColor
      },
      validation: {
        enabled: this.classificationBreakValidationEnabled,
        colorValidation: this.enableColorValidation
      },
      items: this.spatialUnitClassification.map(classification => ({
        spatialUnit: classification.spatialUnitId,
        breaks: classification.breaks.filter(breakVal => breakVal !== null),
        colorAssignment: classification.colorAssignment || null
      }))
    };

    // Add role permissions
    metadataExport.allowedRoles = [];
    if (this.roleManagementTableOptions) {
      const roleIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          metadataExport.allowedRoles.push(roleId);
        }
      }
    }

    const name = this.datasetName;
    const metadataJSON = JSON.stringify(metadataExport);
    let fileName = "Indikator_Metadaten_Export";

    if (name) {
      fileName += "-" + name;
    }

    fileName += ".json";
    this.downloadFile(metadataJSON, fileName);
  }

  async onExportIndicatorAddMappingConfig() {
    const mappingConfigExport = {
      "converter": {}, // Would be populated if converter is used
      "dataSource": {}, // Would be populated if data source is used
      "propertyMapping": {}, // Would be populated if property mapping is used
    };

    const name = this.datasetName;
    const metadataJSON = JSON.stringify(mappingConfigExport);
    let fileName = "KomMonitor-Import-Mapping-Konfiguration_Export";

    if (name) {
      fileName += "-" + name;
    }

    fileName += ".json";
    this.downloadFile(metadataJSON, fileName);
  }

  private downloadFile(content: string, fileName: string) {
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

  // Metadata structure for export
  get indicatorMetadataStructure() {
    return {
      "metadata": {
        "note": "",
        "literature": "",
        "updateInterval": "",
        "sridEPSG": "",
        "datasource": "",
        "contact": "",
        "lastUpdate": "",
        "description": "",
        "databasis": ""
      },
      "allowedRoles": [],
      "datasetName": "",
      "abbreviation": "",
      "indicatorType": "",
      "isHeadlineIndicator": false,
      "unit": "",
      "processDescription": "",
      "interpretation": "",
      "creationType": "",
      "lowestSpatialUnitForComputation": "",
      "referenceDateNote": "",
      "displayOrder": 0,
      "refrencesToOtherIndicators": [],
      "refrencesToGeoresources": [],
      "tags": [],
      "precision": null,
      "defaultClassificationMapping": {
        "colorBrewerSchemeName": "",
        "numClasses": 5,
        "classificationMethod": "jenks",
        "dynamicColorAssignment": {
          "enabled": false,
          "negativeColorScheme": "Reds",
          "positiveColorScheme": "Blues",
          "zeroColor": "#bababa"
        },
        "validation": {
          "enabled": true,
          "colorValidation": false
        },
        "items": []
      }
    };
  }

  get indicatorMetadataStructure_pretty() {
    return JSON.stringify(this.indicatorMetadataStructure, null, 2);
  }

  get indicatorMappingConfigStructure_pretty() {
    if (this.kommonitorImporterHelperService && this.kommonitorImporterHelperService.mappingConfigStructure_indicator) {
    return JSON.stringify(this.kommonitorImporterHelperService.mappingConfigStructure_indicator, null, 2);
    }
    return JSON.stringify({}, null, 2);
  }

  resetForm() {
    this.currentStep = 1;
    this.datasetName = '';
    this.datasetNameInvalid = false;
    this.indicatorAbbreviation = '';
    this.indicatorType = this.indicatorTypeOptions && this.indicatorTypeOptions.length > 0 ? this.indicatorTypeOptions[0] : null;
    this.isHeadlineIndicator = false;
    this.indicatorUnit = null;
    this.enableFreeTextUnit = false;
    this.indicatorProcessDescription = '';
    this.indicatorTagsString_withCommas = '';
    this.indicatorInterpretation = '';
    this.indicatorCreationType = null;
    this.indicatorLowestSpatialUnitMetadataObjectForComputation = this.availableSpatialUnits && this.availableSpatialUnits.length > 0 ? this.availableSpatialUnits[0] : null;
    this.enableLowestSpatialUnitSelect = false;
    this.indicatorPrecision = null;
    this.showCustomCommaValue = false;
    this.indicatorReferenceDateNote = '';
    this.displayOrder = 0;
    this.indicatorTopic_mainTopic = null;
    this.indicatorTopic_subTopic = null;
    this.indicatorTopic_subsubTopic = null;
    this.indicatorTopic_subsubsubTopic = null;
    
    // Reset Step 3: Topic Hierarchy
    this.selectedTopic = null;
    this.selectedSubTopic = null;
    this.availableSubTopics = [];
    this.additionalTopic = null;
    this.additionalSubTopic = null;
    this.additionalSubTopics = [];
    this.additionalTopicAssignments = [];
    this.indicatorReferences_adminView = [];
    this.indicatorReferences_apiRequest = [];
    this.georesourceReferences_adminView = [];
    this.georesourceReferences_apiRequest = [];
    this.numClassesPerSpatialUnit = 5;
    this.classificationMethod = 'jenks';
    this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes && this.colorbrewerPalettes.length > 13 ? this.colorbrewerPalettes[13] : (this.colorbrewerPalettes && this.colorbrewerPalettes.length > 0 ? this.colorbrewerPalettes[0] : null);
    this.spatialUnitClassification = [];
    this.classBreaksInvalid = false;
    this.tabClasses = [];
    this.ownerOrganization = '';
    this.ownerOrgFilter = '';
    this.isPublic = false;
    this.roleManagementTableOptions = null;
    this.metadataImportSettings = null;
    this.mappingConfigImportSettings = null;
    this.indicatorMetadataImportError = '';
    this.indicatorMappingConfigImportError = '';
    this.resourcesCreatorRights = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.importerErrors = [];
    this.importedFeatures = [];
    this.postBody_indicators = null;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Reset metadata
    this.metadata = {
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

    // Dates reset as plain strings

    // Reset temporary variables
    this.indicatorNameFilter = '';
    this.tmpIndicatorReference_selectedIndicatorMetadata = null;
    this.tmpIndicatorReference_referenceDescription = '';
    this.georesourceNameFilter = '';
    this.tmpGeoresourceReference_selectedGeoresourceMetadata = null;
    this.tmpGeoresourceReference_referenceDescription = '';
    
    // Reset Step 4: Filtered lists
    this.filteredIndicators = this.availableIndicators || [];
    this.filteredGeoresources = this.availableGeoresources || [];
    
    // Reset Step 5: Classification Options
    this.enableDynamicColorAssignment = false;
    this.currentClassificationTab = 0;
    
    // Reset enhanced classification variables
    this.classificationValidationErrors = [];
    this.enableColorValidation = false;
    this.dynamicColorAssignmentEnabled = false;
    this.negativeValueColorScheme = 'Reds';
    this.positiveValueColorScheme = 'Blues';
    this.zeroValueColor = '#bababa';
    this.classificationBreakValidationEnabled = true;
    
    // Reset Step 6: Regional Comparison Values
    this.comparisonValueType = null;
    this.comparisonValue = null;
    this.comparisonRegion = null;
    this.comparisonTimeframe = null;
    this.comparisonDescription = '';
    this.evaluationDirection = null;
    this.toleranceRange = null;
    this.additionalComparisonType = null;
    this.additionalComparisonValue = null;
    this.additionalComparisonDescription = '';
    this.additionalComparisonValues = [];
    this.enableBenchmarking = false;
    this.benchmarkingVisualizationType = null;
    this.greenThreshold = null;
    this.yellowThreshold = null;
    this.redThreshold = null;

    // Reset Step 7: Access Control and Ownership
    this.roleFilter = '';
    this.selectedRoles = [];
    this.enableTimeRestrictedAccess = false;
    this.enableGeographicRestriction = false;
    this.accessStartDate = '';
    this.accessEndDate = '';
    this.allowedRegions = [];
    this.enableAccessLogging = false;
    this.filteredOrganizations = this.accessControl || [];
    this.filteredRoles = this.accessControl || [];

    // Reset role management
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'indicatorAddRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
      this.kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds()
    );

    // Reinitialize classification
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }

  hideSuccessAlert() {
    this.successMessage = '';
  }

  hideErrorAlert() {
    this.errorMessage = '';
  }

  hideMetadataErrorAlert() {
    this.indicatorMetadataImportError = '';
  }

  hideMappingConfigErrorAlert() {
    this.indicatorMappingConfigImportError = '';
  }

  onChangeIndicatorUnit() {
    if (this.indicatorUnit && this.indicatorUnit.includes("Freitext")) {
      this.enableFreeTextUnit = true;
    } else {
      this.enableFreeTextUnit = false;
    }
  }

  onChangeCreationType() {
    if (this.indicatorCreationType && this.indicatorCreationType.apiName === "COMPUTATION") {
      this.enableLowestSpatialUnitSelect = true;
    } else {
      this.enableLowestSpatialUnitSelect = false;
    }
  }

  onChangeOwner(ownerOrganization: any) {
    this.ownerOrganization = ownerOrganization;

    
    // Refresh roles based on the selected owner organization
    this.refreshRoles(this.ownerOrganization?.organizationalUnitId);
  }

  onChangeIsPublic(isPublic: boolean) {
    this.isPublic = isPublic;
  }

  // Step 3: Topic Hierarchy Methods
  onTopicChange() {
    if (this.selectedTopic) {
      // Load sub-topics for the selected topic
      this.availableSubTopics = this.selectedTopic.subTopics || [];
      this.selectedSubTopic = null;
      
      // Update main topic reference
      this.indicatorTopic_mainTopic = this.selectedTopic;
      this.indicatorTopic_subTopic = null;
      this.indicatorTopic_subsubTopic = null;
      this.indicatorTopic_subsubsubTopic = null;
    } else {
      this.availableSubTopics = [];
      this.selectedSubTopic = null;
    }
  }

  onSubTopicChange() {
    if (this.selectedSubTopic) {
      // Update sub topic reference
      this.indicatorTopic_subTopic = this.selectedSubTopic;
      this.indicatorTopic_subsubTopic = null;
      this.indicatorTopic_subsubsubTopic = null;
    }
  }

  onAdditionalTopicChange() {
    if (this.additionalTopic) {
      // Load sub-topics for the additional topic
      this.additionalSubTopics = this.additionalTopic.subTopics || [];
      this.additionalSubTopic = null;
    } else {
      this.additionalSubTopics = [];
      this.additionalSubTopic = null;
    }
  }

  addAdditionalTopicAssignment() {
    if (this.additionalTopic && this.additionalSubTopic) {
      // Check if this assignment already exists
      const existingAssignment = this.additionalTopicAssignments.find(
        assignment => assignment.topic.topicId === this.additionalTopic.topicId && 
                     assignment.subTopic.subTopicId === this.additionalSubTopic.subTopicId
      );

      if (!existingAssignment) {
        // Check if it's the same as the main assignment
        const isMainAssignment = this.selectedTopic && this.selectedSubTopic &&
          this.selectedTopic.topicId === this.additionalTopic.topicId &&
          this.selectedSubTopic.subTopicId === this.additionalSubTopic.subTopicId;

        if (!isMainAssignment) {
          this.additionalTopicAssignments.push({
            topic: this.additionalTopic,
            subTopic: this.additionalSubTopic
          });

          // Reset additional topic selection
          this.additionalTopic = null;
          this.additionalSubTopic = null;
          this.additionalSubTopics = [];
        }
      }
    }
  }

  removeAdditionalTopicAssignment(index: number) {
    if (index >= 0 && index < this.additionalTopicAssignments.length) {
      this.additionalTopicAssignments.splice(index, 1);
    }
  }

  // Helper method to get all topic assignments (main + additional)
  getAllTopicAssignments(): Array<{topic: any, subTopic: any, isMain: boolean}> {
    const assignments: Array<{topic: any, subTopic: any, isMain: boolean}> = [];
    
    // Add main assignment if exists
    if (this.selectedTopic && this.selectedSubTopic) {
      assignments.push({
        topic: this.selectedTopic,
        subTopic: this.selectedSubTopic,
        isMain: true
      });
    }
    
    // Add additional assignments
    this.additionalTopicAssignments.forEach(assignment => {
      assignments.push({
        ...assignment,
        isMain: false
      });
    });
    
    return assignments;
  }

  // Step 4: Reference Filtering Methods
  filterIndicators() {
    if (!this.indicatorNameFilter || this.indicatorNameFilter.trim() === '') {
      this.filteredIndicators = this.availableIndicators || [];
    } else {
      const filter = this.indicatorNameFilter.toLowerCase().trim();
      this.filteredIndicators = (this.availableIndicators || []).filter(indicator =>
        (indicator.indicatorName && indicator.indicatorName.toLowerCase().includes(filter)) ||
        (indicator.datasetName && indicator.datasetName.toLowerCase().includes(filter))
      );
    }
  }

  filterGeoresources() {
    if (!this.georesourceNameFilter || this.georesourceNameFilter.trim() === '') {
      this.filteredGeoresources = this.availableGeoresources || [];
    } else {
      const filter = this.georesourceNameFilter.toLowerCase().trim();
      this.filteredGeoresources = (this.availableGeoresources || []).filter(georesource =>
        (georesource.georesourceName && georesource.georesourceName.toLowerCase().includes(filter)) ||
        (georesource.datasetName && georesource.datasetName.toLowerCase().includes(filter))
      );
    }
  }

  // Step 4: Collapsible Box Properties
  isIndicatorReferencesCollapsed = true;
  isGeoresourceReferencesCollapsed = true;

  // Step 4: Collapsible Box Methods
  toggleIndicatorReferences() {
    this.isIndicatorReferencesCollapsed = !this.isIndicatorReferencesCollapsed;
  }

  toggleGeoresourceReferences() {
    this.isGeoresourceReferencesCollapsed = !this.isGeoresourceReferencesCollapsed;
  }

  // Step 4: Selection Methods
  onIndicatorSelected() {
    // Selection handled by ngModel binding
  }

  onGeoresourceSelected() {
    // Selection handled by ngModel binding
  }

  // Convert admin view references to API format
  private convertReferencesToApiFormat() {
    // Convert indicator references
    this.indicatorReferences_apiRequest = this.indicatorReferences_adminView.map(ref => ({
      "referencedIndicatorName": ref.indicatorMetadata.datasetName,
      "referencedIndicatorId": ref.indicatorMetadata.indicatorId,
      "referencedIndicatorAbbreviation": ref.indicatorMetadata.abbreviation,
      "referencedIndicatorDescription": ref.referenceDescription
    }));

    // Convert georesource references
    this.georesourceReferences_apiRequest = this.georesourceReferences_adminView.map(ref => ({
      "referencedGeoresourceName": ref.georesourceMetadata.datasetName,
      "referencedGeoresourceId": ref.georesourceMetadata.georesourceId,
      "referencedGeoresourceDescription": ref.referenceDescription
    }));
  }

  // Step 5: Classification Methods
  goToClassificationTab(tabIndex: number) {
    this.currentClassificationTab = tabIndex;
    
    // Update active tab classes
    this.tabClasses.forEach((_, index) => {
      if (index === tabIndex) {
        this.tabClasses[index] = 'active';
      } else {
        this.tabClasses[index] = '';
      }
    });
  }

  getClassColor(classIndex: number, palette: any): string {
    if (!palette || !palette.colors) {
      return '#cccccc';
    }
    
    const colors = palette.colors;
    if (classIndex >= 0 && classIndex < colors.length) {
      return colors[classIndex];
    }
    
    return '#cccccc';
  }

  // Enhanced classification method selection
  onClassificationMethodSelected(method: any) {
    this.classificationMethod = method;
    
    // Enable/disable specific features based on method
    this.enableManualClassification = method === 'manual';
    this.enableRegionalClassification = method === 'regional_default';
    
    // Reset validation errors
    this.classificationValidationErrors = [];
    this.classBreaksInvalid = false;
    
    // Reinitialize classification when method changes
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
    
    // Update dynamic color assignment based on method
    this.updateDynamicColorAssignment();
    

  }

  // Update dynamic color assignment based on classification method
  private updateDynamicColorAssignment() {
    // Enable dynamic color assignment for certain methods
    this.dynamicColorAssignmentEnabled = this.classificationMethod === 'regional_default' || 
                                       this.classificationMethod === 'manual';
    
    // Set color schemes based on method
    if (this.classificationMethod === 'regional_default') {
      this.negativeValueColorScheme = 'Reds';
      this.positiveValueColorScheme = 'Blues';
    } else if (this.classificationMethod === 'manual') {
      this.negativeValueColorScheme = 'Reds';
      this.positiveValueColorScheme = 'Blues';
    } else {
      // For automatic methods, use default schemes
      this.negativeValueColorScheme = this.colorbreweSchemeName_dynamicDecrease;
      this.positiveValueColorScheme = this.colorbreweSchemeName_dynamicIncrease;
    }
    
    // Update color assignment for all spatial units
    this.updateColorAssignmentForAllSpatialUnits();
  }

  // Update color assignment for all spatial units
  private updateColorAssignmentForAllSpatialUnits() {
    if (!this.dynamicColorAssignmentEnabled) {
      return;
    }

    for (let i = 0; i < this.spatialUnitClassification.length; i++) {
      this.updateColorAssignmentForSpatialUnit(i);
    }
  }

  // Update color assignment for a specific spatial unit
  private updateColorAssignmentForSpatialUnit(spatialUnitIndex: number) {
    if (!this.spatialUnitClassification[spatialUnitIndex]) {
      return;
    }

    const classification = this.spatialUnitClassification[spatialUnitIndex];
    const breaks = classification.breaks;

    // Calculate color assignment based on break values
    let hasNegativeValues = false;
    let hasPositiveValues = false;
    let hasZeroValue = false;

    for (const breakValue of breaks) {
      if (breakValue !== null && breakValue !== undefined) {
        if (breakValue < 0) hasNegativeValues = true;
        if (breakValue > 0) hasPositiveValues = true;
        if (breakValue === 0) hasZeroValue = true;
      }
    }

    // Store color assignment information
    classification.colorAssignment = {
      hasNegativeValues,
      hasPositiveValues,
      hasZeroValue,
      negativeColorScheme: this.negativeValueColorScheme,
      positiveColorScheme: this.positiveValueColorScheme,
      zeroColor: this.zeroValueColor
    };


  }

  // Get color for a specific class based on break value
  getClassColorForBreak(breakValue: number, classIndex: number): string {
    if (!this.dynamicColorAssignmentEnabled) {
      // Use standard color brewer palette
      if (this.selectedColorBrewerPaletteEntry && this.selectedColorBrewerPaletteEntry.paletteArrayObject) {
        const colors = this.selectedColorBrewerPaletteEntry.paletteArrayObject[this.numClassesPerSpatialUnit.toString()];
        if (colors && colors[classIndex]) {
          return colors[classIndex];
        }
      }
      return '#cccccc';
    }

    // Dynamic color assignment based on break value
    if (breakValue < 0) {
      // Negative values - use decreasing color scheme
      const colors = this.colorbrewerSchemes[this.negativeValueColorScheme];
      if (colors && colors[this.decreaseBreaksLength]) {
        const colorIndex = Math.min(classIndex, this.decreaseBreaksLength - 1);
        return colors[this.decreaseBreaksLength][colorIndex];
      }
    } else if (breakValue > 0) {
      // Positive values - use increasing color scheme
      const colors = this.colorbrewerSchemes[this.positiveValueColorScheme];
      if (colors && colors[this.increaseBreaksLength]) {
        const colorIndex = Math.min(classIndex, this.increaseBreaksLength - 1);
        return colors[this.increaseBreaksLength][colorIndex];
      }
    } else if (breakValue === 0) {
      // Zero value - use neutral color
      return this.zeroValueColor;
    }

    return '#cccccc';
  }

  onClickColorBrewerEntry(colorPaletteEntry: any) {
    this.selectedColorBrewerPaletteEntry = colorPaletteEntry;
  }

  onNumClassesChanged(numClasses: number) {
    this.numClassesPerSpatialUnit = numClasses;
    
    // Calculate break lengths for dynamic color assignment
    this.decreaseBreaksLength = Math.floor(numClasses / 2);
    this.increaseBreaksLength = numClasses - this.decreaseBreaksLength;
    
    // Initialize classification for each spatial unit
    this.spatialUnitClassification = [];
    this.tabClasses = [];
    
    if (this.availableSpatialUnits && this.availableSpatialUnits.length > 0) {
      this.availableSpatialUnits.forEach((spatialUnit, index) => {
        // Initialize breaks array
        const breaks: Array<number | null> = [];
        for (let i = 0; i < numClasses - 1; i++) {
          breaks.push(null);
        }
        
        this.spatialUnitClassification.push({
          spatialUnitId: spatialUnit.spatialUnitId,
          spatialUnitLevel: spatialUnit.spatialUnitLevel,
          breaks: breaks
        });
        
        // Initialize tab class
        this.tabClasses[index] = index === 0 ? 'active' : '';
      });
    }
    
    // Reset validation
    this.classBreaksInvalid = false;
  }

  onBreaksChanged(tabIndex: number) {
    if (!this.spatialUnitClassification[tabIndex]) {
      return;
    }
    
    const breaks = this.spatialUnitClassification[tabIndex].breaks;
    let cssClass = 'tab-completed';
    this.classBreaksInvalid = false;
    this.classificationValidationErrors = [];
    
    // Enhanced validation logic matching AngularJS implementation
    if (this.classificationMethod === 'regional_default' || this.classificationMethod === 'manual') {
      // Check if all breaks are filled
      let allBreaksFilled = true;
      for (const classBreak of breaks) {
        if (classBreak === null || classBreak === undefined || classBreak === '') {
          allBreaksFilled = false;
          break;
        }
      }
      
      if (allBreaksFilled) {
        // Validate that breaks are in ascending order
        for (let i = 0; i < breaks.length - 1; i++) {
          if (breaks[i] >= breaks[i + 1]) {
            cssClass = 'tab-error';
            this.classBreaksInvalid = true;
            this.classificationValidationErrors.push(
              `Klassengrenze ${i + 1} (${breaks[i]}) muss kleiner sein als Klassengrenze ${i + 2} (${breaks[i + 1]})`
            );
            break;
          }
        }
      } else {
        // Check if any breaks are filled but not all
        let hasAnyBreaks = false;
        for (const classBreak of breaks) {
          if (classBreak !== null && classBreak !== undefined && classBreak !== '') {
            hasAnyBreaks = true;
            break;
          }
        }
        
        if (hasAnyBreaks) {
          cssClass = 'tab-error';
          this.classBreaksInvalid = true;
          this.classificationValidationErrors.push('Alle Klassengrenzen müssen ausgefüllt werden');
        } else {
          cssClass = 'active';
        }
      }
    } else {
      // For automatic classification methods, check if any manual breaks are entered
      let hasManualBreaks = false;
      for (const classBreak of breaks) {
        if (classBreak !== null && classBreak !== undefined && classBreak !== '') {
          hasManualBreaks = true;
          break;
        }
      }
      
      if (hasManualBreaks) {
        cssClass = 'tab-error';
        this.classBreaksInvalid = true;
        this.classificationValidationErrors.push('Manuelle Klassengrenzen sind für automatische Klassifizierungsmethoden nicht erlaubt');
      }
    }
    
    this.tabClasses[tabIndex] = cssClass;
    
    // Update decrease and increase breaks for dynamic color assignment
    this.updateDecreaseAndIncreaseBreaks(tabIndex);
  }

  // Update decrease and increase breaks for dynamic color assignment
  private updateDecreaseAndIncreaseBreaks(tabIndex: number) {
    if (!this.spatialUnitClassification[tabIndex]) {
      return;
    }
    
    const breaks = this.spatialUnitClassification[tabIndex].breaks;
    
    // Count positive and negative breaks
    this.increaseBreaksLength = breaks.filter(val => val !== null && val !== undefined && val > 0).length;
    this.decreaseBreaksLength = breaks.filter(val => val !== null && val !== undefined && val < 0).length;
    
    // Ensure minimum lengths for color schemes
    if (this.increaseBreaksLength < 3) {
      this.increaseBreaksLength = 3;
    }
    if (this.decreaseBreaksLength < 3) {
      this.decreaseBreaksLength = 3;
    }
    // Updated break lengths
  }

  // Validate classification breaks across all spatial units
  validateClassificationBreaks(): boolean {
    this.classificationValidationErrors = [];
    let isValid = true;

    // Check if classification method is selected
    if (!this.classificationMethod) {
      this.classificationValidationErrors.push('Klassifizierungsmethode muss ausgewählt werden');
      isValid = false;
    }

    // Check if number of classes is selected
    if (!this.numClassesPerSpatialUnit || this.numClassesPerSpatialUnit < 3) {
      this.classificationValidationErrors.push('Mindestens 3 Klassen müssen ausgewählt werden');
      isValid = false;
    }

    // Validate breaks for each spatial unit
    for (let i = 0; i < this.spatialUnitClassification.length; i++) {
      const classification = this.spatialUnitClassification[i];
      if (!classification) continue;

      const breaks = classification.breaks;
      
      // Check for null/undefined breaks
      for (let j = 0; j < breaks.length; j++) {
        if (breaks[j] === null || breaks[j] === undefined || breaks[j] === '') {
          this.classificationValidationErrors.push(
            `Klassengrenze ${j + 1} für Raumebene ${classification.spatialUnitLevel} ist nicht ausgefüllt`
          );
          isValid = false;
        }
      }

      // Check for ascending order
      for (let j = 0; j < breaks.length - 1; j++) {
        if (breaks[j] >= breaks[j + 1]) {
          this.classificationValidationErrors.push(
            `Klassengrenzen für Raumebene ${classification.spatialUnitLevel} müssen in aufsteigender Reihenfolge sein`
          );
          isValid = false;
          break;
        }
      }
    }

    this.classBreaksInvalid = !isValid;
    return isValid;
  }

  // Get validation status for a specific spatial unit
  getSpatialUnitValidationStatus(spatialUnitIndex: number): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    if (!this.spatialUnitClassification[spatialUnitIndex]) {
      return { isValid: false, errors: ['Raumeinheit nicht gefunden'] };
    }

    const classification = this.spatialUnitClassification[spatialUnitIndex];
    const breaks = classification.breaks;

    // Check for null/undefined breaks
    for (let i = 0; i < breaks.length; i++) {
      if (breaks[i] === null || breaks[i] === undefined || breaks[i] === '') {
        errors.push(`Klassengrenze ${i + 1} ist nicht ausgefüllt`);
        isValid = false;
      }
    }

    // Check for ascending order
    for (let i = 0; i < breaks.length - 1; i++) {
      if (breaks[i] >= breaks[i + 1]) {
        errors.push(`Klassengrenze ${i + 1} (${breaks[i]}) muss kleiner sein als Klassengrenze ${i + 2} (${breaks[i + 1]})`);
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  // Step 6: Regional Comparison Methods
  onComparisonValueTypeChange() {
    // Reset comparison value when type changes
    if (this.comparisonValueType === null) {
      this.comparisonValue = null;
    }
  }

  addAdditionalComparisonValue() {
    if (this.additionalComparisonType && this.additionalComparisonValue !== null) {
      // Check if this comparison already exists
      const existingComparison = this.additionalComparisonValues.find(
        comparison => comparison.type === this.additionalComparisonType && 
                     comparison.value === this.additionalComparisonValue
      );

      if (!existingComparison) {
        this.additionalComparisonValues.push({
          type: this.additionalComparisonType,
          value: this.additionalComparisonValue,
          description: this.additionalComparisonDescription || ''
        });

        // Reset additional comparison inputs
        this.additionalComparisonType = null;
        this.additionalComparisonValue = null;
        this.additionalComparisonDescription = '';
      }
    }
  }

  removeAdditionalComparisonValue(index: number) {
    if (index >= 0 && index < this.additionalComparisonValues.length) {
      this.additionalComparisonValues.splice(index, 1);
    }
  }

  getComparisonTypeDisplayName(type: string): string {
    const typeMap: { [key: string]: string } = {
      'target': 'Zielwert',
      'average': 'Durchschnittswert',
      'median': 'Medianwert',
      'best_practice': 'Best Practice',
      'threshold': 'Schwellenwert',
      'custom': 'Benutzerdefiniert'
    };
    return typeMap[type] || type;
  }

  // Helper method to get all comparison values (main + additional)
  getAllComparisonValues(): Array<{type: string, value: number, description: string, isMain: boolean}> {
    const comparisons: Array<{type: string, value: number, description: string, isMain: boolean}> = [];
    
    // Add main comparison if exists
    if (this.comparisonValueType && this.comparisonValue !== null) {
      comparisons.push({
        type: this.comparisonValueType,
        value: this.comparisonValue,
        description: this.comparisonDescription,
        isMain: true
      });
    }
    
    // Add additional comparisons
    this.additionalComparisonValues.forEach(comparison => {
      comparisons.push({
        ...comparison,
        isMain: false
      });
    });
    
    return comparisons;
  }

  // Validate benchmarking thresholds
  validateBenchmarkingThresholds(): boolean {
    if (!this.enableBenchmarking) {
      return true;
    }

    if (this.greenThreshold === null || this.yellowThreshold === null || this.redThreshold === null) {
      return false;
    }

    // Ensure thresholds are in logical order
    return this.greenThreshold <= this.yellowThreshold && this.yellowThreshold <= this.redThreshold;
  }

  // Step 7: Access Control Methods
  filterOrganizations() {
    if (!this.ownerOrgFilter || this.ownerOrgFilter.trim() === '') {
      this.filteredOrganizations = this.accessControl || [];
    } else {
      const filter = this.ownerOrgFilter.toLowerCase().trim();
      this.filteredOrganizations = (this.accessControl || []).filter(org =>
        org.organizationName && org.organizationName.toLowerCase().includes(filter)
      );
    }
  }

  // Get filtered organizations based on admin permissions (like AngularJS component)
  getFilteredOrganizations(): any[] {
    if (this.checkAdminPermission()) {
      return this.filteredOrganizations;
    } else {
      // For non-admin users, show only their creator rights
      return this.resourcesCreatorRights || [];
    }
  }

  clearOwnerFilter() {
    this.ownerOrgFilter = '';
    this.filterOrganizations();
  }

  filterRoles() {
    if (!this.roleFilter || this.roleFilter.trim() === '') {
      this.filteredRoles = this.accessControl || [];
    } else {
      const filter = this.roleFilter.toLowerCase().trim();
      this.filteredRoles = (this.accessControl || []).filter(role =>
        role.roleName && role.roleName.toLowerCase().includes(filter)
      );
    }
  }

  isRoleSelected(role: any): boolean {
    return this.selectedRoles.some(selectedRole => selectedRole.roleId === role.roleId);
  }

  toggleRoleSelection(role: any) {
    if (this.isRoleSelected(role)) {
      this.removeRole(role);
    } else {
      this.addRole(role);
    }
  }

  addRole(role: any) {
    if (!this.isRoleSelected(role)) {
      this.selectedRoles.push(role);
    }
  }

  removeRole(role: any) {
    const index = this.selectedRoles.findIndex(selectedRole => selectedRole.roleId === role.roleId);
    if (index >= 0) {
      this.selectedRoles.splice(index, 1);
    }
  }

  // Validate access control configuration
  validateAccessControl(): boolean {
    // Owner organization is required
    if (!this.ownerOrganization) {
      return false;
    }

    // If not public, at least one role must be selected
    if (!this.isPublic && this.selectedRoles.length === 0) {
      return false;
    }

    // Validate time restrictions if enabled
    if (this.enableTimeRestrictedAccess) {
      if (!this.accessStartDate || !this.accessEndDate) {
        return false;
      }
      // Check if end date is after start date
      const startDate = new Date(this.accessStartDate);
      const endDate = new Date(this.accessEndDate);
      if (endDate <= startDate) {
        return false;
      }
    }

    // Validate geographic restrictions if enabled
    if (this.enableGeographicRestriction && (!this.allowedRegions || this.allowedRegions.length === 0)) {
      return false;
    }

    return true;
  }

  // Get selected role IDs for API
  getSelectedRoleIds(): string[] {
    return this.selectedRoles.map(role => role.roleId);
  }

  // Step validation methods for progress bar
  isStepValid(step: number): boolean {
    // Validation for specific steps
    switch (step) {
      case 1:
        return !!this.datasetName && !!this.indicatorType && !!this.indicatorUnit && !!this.indicatorInterpretation;
      case 2:
        return !!this.metadata.description && !!this.metadata.datasource && !!this.metadata.contact && !!this.metadata.updateInterval && !!this.metadata.lastUpdate;
      case 3:
        return !!this.indicatorTopic_mainTopic;
      case 4:
        // Step 4 is optional (references)
        return true;
      case 5:
        // Enhanced Step 5 validation with classification breaks validation
        if (this.indicatorType?.apiName?.includes('STATUS')) {
          const basicValidation = !!this.selectedColorBrewerPaletteEntry && !!this.numClassesPerSpatialUnit;
          if (this.classificationMethod === 'regional_default' || this.classificationMethod === 'manual') {
            return basicValidation && this.validateClassificationBreaks();
          }
          return basicValidation;
        }
        return !!this.numClassesPerSpatialUnit;
      case 6:
        // Step 6 is informational
        return true;
      case 7:
        // Step 7 validation for access control
        return this.validateAccessControl();
      default:
        return true;
    }
  }

  isCurrentStepValid(): boolean {
    return this.isStepValid(this.currentStep);
  }

  updateProgressBar(): void {
    // Update progress bar active states
    const progressItems = document.querySelectorAll('#progressbar li');
    progressItems.forEach((item, index) => {
      if (index < this.currentStep) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  isStepCompleted(step: number): boolean {
    return this.currentStep > step;
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }

  ngOnDestroy() {
    // Clean up event subscriptions (like AngularJS component)
    if (this.roleUpdateSubscription) {
      this.roleUpdateSubscription.unsubscribe();
    }
    if (this.metadataLoadingSubscription) {
      this.metadataLoadingSubscription.unsubscribe();
    }
  }
} 