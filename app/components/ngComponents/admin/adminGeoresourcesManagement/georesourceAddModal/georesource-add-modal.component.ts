import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, NgZone, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import { Subscription } from 'rxjs';
import { KommonitorGeoresourceDataExchangeService } from 'services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { KommonitorMultiStepFormHelperService } from 'services/adminGeoresourceUnit/kommonitor-multi-step-form-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from 'services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';
import { IconPickerComponent } from 'components/ngComponents/customElements/icon-picker/icon-picker.component';
import { KmDatePickerComponent } from 'components/ngComponents/customElements/date-picker/km-date-picker.component';
import { KmLinePatternPickerComponent, LinePatternOption } from 'components/ngComponents/customElements/line-pattern-picker/km-line-pattern-picker.component';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
import { AdminTopicsManagementComponent } from '../../adminTopicsManagement/admin-topics-management.component';

@Component({
  selector: 'georesource-add-modal-new',
  templateUrl: './georesource-add-modal.component.html',
  styleUrls: ['./georesource-add-modal.component.css'],
  providers: [],
  standalone: true,
  imports: [CommonModule, FormsModule, IconPickerComponent, AgGridAngular, KmDatePickerComponent, KmLinePatternPickerComponent, KmColorPickerComponent, AdminTopicsManagementComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
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
  selectedLoiPattern: LinePatternOption | null = null;
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
  linePatternOptions: LinePatternOption[] = [];
  availableDatasourceTypes: any[] = [];
  
  // Loading states
  loadingTopics = false;
  loadingAccessControl = false;

  get isModalLoading(): boolean {
    return this.loadingData || this.loadingTopics || this.loadingAccessControl;
  }

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
  selectedDataSourceFile: File | null = null;
  selectedDataSourceFileName: string = '';

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
  datasourceTypeParameterValues: { [key: string]: string } = {};

  // Validity dates per feature
  validityStartDate_perFeature = '';
  validityEndDate_perFeature = '';

  // Event subscriptions for role management (like AngularJS component)
  private roleUpdateSubscription?: Subscription;
  private metadataLoadingSubscription?: Subscription;
  private fileInputChangeHandler?: (e: Event) => void;

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

  private syncLinePatternOptionsAndSelection(): void {
    // Map availableLoiDashArrayObjects into LinePatternOption[] used by km-line-pattern-picker
    this.linePatternOptions = (this.availableLoiDashArrayObjects || []).map((o: any) => {
      const display = o?.displayName || o?.dashArrayValue || '';
      const dash = o?.dashArrayValue || '';
      // Render an inline SVG showing the dash pattern
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="180" height="20" viewBox="0 0 180 20">
          <line x1="5" y1="10" x2="175" y2="10" stroke="#333" stroke-width="3" stroke-dasharray="${dash}" stroke-linecap="butt"/>
        </svg>
      `;
      return { label: display, dashArrayValue: dash, svgString: svg } as LinePatternOption;
    });

    // Align selected pattern with selectedLoiDashArrayObject
    if (this.selectedLoiDashArrayObject) {
      this.selectedLoiPattern = this.linePatternOptions.find(p => p.dashArrayValue === this.selectedLoiDashArrayObject.dashArrayValue) || null;
    } else {
      this.selectedLoiPattern = null;
    }
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

  // Icon picker configuration
  iconPickerConfig = {
    placeholder: 'Select Icon',
    buttonClass: 'btn btn-info',
    showSearch: true,
    showHeader: true,
    showFooter: true,
    cols: 10,
    rows: 6,
    searchText: 'Search icons...',
    labelHeader: '{0} of {1} pages',
    labelFooter: '{0} - {1} of {2} icons'
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
    
    // Attach file input listener in case template does not wire (change)
    setTimeout(() => this.attachFileInputListener(), 0);
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
    
    // Remove file input listener
    try {
      const inputEl = document.getElementById('georesourceDataSourceInput_add');
      if (inputEl && this.fileInputChangeHandler) {
        inputEl.removeEventListener('change', this.fileInputChangeHandler);
      }
    } catch {}
  }

  private async initializeForm(): Promise<void> {
    // Initialize form with default values and show overlay while bootstrapping
    this.loadingData = true;
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

    // Initial load completed: hide overlay
    this.loadingData = false;

    // Reapply any dynamic importer fields that may have been set (e.g., from import)
    setTimeout(() => this.reapplyDynamicImporterFields(), 0);
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
      this.loadingAccessControl = true;
      // Try to load real access control data first
      await this.reloadAccessControlData();
    } catch (error) {
      console.warn('Failed to load access control data:', error);
      // Do not inject test data; keep empty to avoid showing fake organizations
      this.resourcesCreatorRights = [];
      this.filteredOrganizations = [];
    } finally {
      this.loadingAccessControl = false;
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
    // Sync line pattern options and selection for LOI picker
    this.syncLinePatternOptionsAndSelection();
    
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
      const topicsResult = await this.kommonitorDataExchangeService.fetchTopicsMetadata(roles);
      // Prefer the service cache after fetch (AngularJS relied on service.availableTopics which preserves hierarchy)
      const topics = (this.kommonitorDataExchangeService as any).availableTopics && Array.isArray((this.kommonitorDataExchangeService as any).availableTopics)
        ? (this.kommonitorDataExchangeService as any).availableTopics
        : topicsResult;
      
      if (topics && Array.isArray(topics)) {
        // Filter topics to only show main topics for georesources (like AngularJS component)
        this.availableTopics = this.filterTopicsForGeoresources(topics);
        // Normalize keys to ensure subtopic tree uses 'subTopics' recursively
        this.availableTopics = this.normalizeTopics(this.availableTopics);
    
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
    // Strictly enforce: only main topics with topicResource 'georesource'
    const result = (topics || []).filter((topic: any) =>
      topic && topic.topicType === 'main' && topic.topicResource === 'georesource'
    );
    return result;
  }

  // Normalize topic tree to always use 'subTopics' (maps 'subtopics' or 'children' etc.)
  private normalizeTopics(topics: any[]): any[] {
    return (topics || []).map(t => this.normalizeTopicNode(t));
  }

  private normalizeTopicNode(topic: any): any {
    if (!topic || typeof topic !== 'object') { return topic; }
    // Normalize label fallbacks (no changes applied to structure, just ensure presence for templates)
    topic.topicName = topic.topicName || topic.name || topic.title || topic.label || topic.text || topic.topicname;
    // Normalize child list
    const children = topic.subTopics || topic.subtopics || topic.children || [];
    topic.subTopics = Array.isArray(children) ? children.map((c: any) => this.normalizeTopicNode(c)) : [];
    return topic;
  }

  // Called when the main topic changes to reset deeper selections and ensure normalization
  onMainTopicChange(): void {
    if (this.georesourceTopic_mainTopic) {
      this.georesourceTopic_mainTopic = this.normalizeTopicNode(this.georesourceTopic_mainTopic);
    }
    this.georesourceTopic_subTopic = null;
    this.georesourceTopic_subsubTopic = null;
    this.georesourceTopic_subsubsubTopic = null;
  }

  onSubTopicChange(): void {
    if (this.georesourceTopic_subTopic) {
      this.georesourceTopic_subTopic = this.normalizeTopicNode(this.georesourceTopic_subTopic);
    }
    this.georesourceTopic_subsubTopic = null;
    this.georesourceTopic_subsubsubTopic = null;
  }

  onSubSubTopicChange(): void {
    if (this.georesourceTopic_subsubTopic) {
      this.georesourceTopic_subsubTopic = this.normalizeTopicNode(this.georesourceTopic_subsubTopic);
    }
    this.georesourceTopic_subsubsubTopic = null;
  }

  /**
   * Remove duplicates by displayed label (topicName/name), case-insensitive
   */
  private deduplicateTopicsByLabel(topics: any[]): any[] {
    const map = new Map<string, any>();
    for (const t of topics) {
      const label = ((t?.topicName ?? t?.name ?? '') + '').trim().toLowerCase();
      const fallback = ((t?.topicId ?? t?.id ?? '') + '').trim().toLowerCase();
      const key = label || fallback;
      if (!key) { continue; }
      if (!map.has(key)) {
        map.set(key, t);
      } else {
        const current = map.get(key);
        const currChildren = Array.isArray(current?.subTopics) ? current.subTopics.length : 0;
        const newChildren = Array.isArray(t?.subTopics) ? t.subTopics.length : 0;
        const currHasId = !!(current?.topicId || current?.id);
        const newHasId = !!(t?.topicId || t?.id);
        // Prefer the entry that has subTopics, or more children; fallback to one that has an id
        if (newChildren > currChildren || (!currHasId && newHasId)) {
          map.set(key, t);
        }
      }
    }
    return Array.from(map.values());
  }

  /**
   * Remove duplicates by stable identifier (topicId | id | name fallback)
   */
  private deduplicateTopicsById(topics: any[]): any[] {
    const map = new Map<string, any>();
    for (const t of topics) {
      const key = ((t?.topicId ?? t?.id ?? t?.name) + '').trim();
      if (!key) { continue; }
      if (!map.has(key)) {
        map.set(key, t);
      } else {
        const current = map.get(key);
        const currChildren = Array.isArray(current?.subTopics) ? current.subTopics.length : 0;
        const newChildren = Array.isArray(t?.subTopics) ? t.subTopics.length : 0;
        if (newChildren > currChildren) {
          map.set(key, t);
        }
      }
    }
    return Array.from(map.values());
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
      // Persist dynamic fields before leaving current step
      this.persistDynamicImporterFields();
      this.currentStep = step;
      // Reapply after DOM updates
      setTimeout(() => this.reapplyDynamicImporterFields(), 0);
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Persist dynamic fields before leaving current step
      this.persistDynamicImporterFields();
      this.currentStep++;
      // Reapply after DOM updates
      setTimeout(() => this.reapplyDynamicImporterFields(), 0);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      // Persist dynamic fields before leaving current step
      this.persistDynamicImporterFields();
      this.currentStep--;
      // Reapply after DOM updates
      setTimeout(() => this.reapplyDynamicImporterFields(), 0);
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
      this.loadingAccessControl = true;
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
    } finally {
      this.loadingAccessControl = false;
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






  // Importer methods
  onChangeConverter(): void {
    this.schema = this.converter?.schemas ? this.converter.schemas[0] : undefined;
    this.mimeType = this.converter?.mimeTypes ? this.converter.mimeTypes[0] : undefined;
    this.converterParameterValues = {};

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
    // Reset related fields when datasource type changes
    this.selectedDataSourceFile = null;
    this.georesourceDataSourceIdProperty = '';
    this.georesourceDataSourceNameProperty = '';
    this.bboxType = '';
    this.bboxRefSpatialUnit = null;
    this.datasourceTypeParameterValues = {};
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
    // Update selected line pattern for the picker component
    if (this.linePatternOptions && this.linePatternOptions.length > 0) {
      this.selectedLoiPattern = this.linePatternOptions.find(p => p.dashArrayValue === this.selectedLoiDashArrayObject?.dashArrayValue) || null;
    }
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

  onIconPickerChange(iconName: string): void {
    this.selectedPoiIconName = iconName;
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
    // Prevent default behavior and stop propagation to avoid any navigation issues
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Update the selected style
    this.selectedPoiMarkerStyle = markerStyle;
    
    // Force change detection to ensure the UI updates properly
    this.cdr.detectChanges();
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
  onGeoresourceFileSelected(event: any): void {
    const file = event?.target?.files?.[0] as File | undefined;
    this.selectedDataSourceFile = file ?? null;
    this.selectedDataSourceFileName = this.selectedDataSourceFile?.name || '';
  }

  onClickGeoresourceFileBrowse(): void {
    try {
      const inputEl = (this.georesourceDataSourceInput?.nativeElement as HTMLInputElement) || (document.getElementById('georesourceDataSourceInput_add') as HTMLInputElement | null);
      inputEl?.click();
    } catch {}
  }

  clearSelectedFile(): void {
    try {
      const inputEl = (this.georesourceDataSourceInput?.nativeElement as HTMLInputElement) || (document.getElementById('georesourceDataSourceInput_add') as HTMLInputElement | null);
      if (inputEl) {
        inputEl.value = '';
      }
    } catch {}
    this.selectedDataSourceFile = null;
    this.selectedDataSourceFileName = '';
  }

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
    // Ensure LOI picker reflects imported selection
    this.syncLinePatternOptionsAndSelection();
    
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

    // datasourceTypes parameters (persist + reflect bbox fields)
    this.datasourceTypeParameterValues = {};
    if (this.datasourceType && Array.isArray(this.mappingConfigImportSettings.dataSource.parameters)) {
      for (const dsParameter of this.mappingConfigImportSettings.dataSource.parameters) {
        const element = document.getElementById("datasourceTypeParameter_georesourceAdd_" + dsParameter.name) as HTMLInputElement;
        if (element) {
          element.value = dsParameter.value ?? '';
        }
        if (dsParameter.name === 'bboxType') {
          this.bboxType = dsParameter.value || '';
        } else if (dsParameter.name === 'bbox') {
          if (this.bboxType === 'ref') {
            this.bboxRefSpatialUnit = dsParameter.value;
          }
        } else {
          this.datasourceTypeParameterValues[dsParameter.name] = dsParameter.value ?? '';
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
    // Reflect LOI dasharray selection in picker if available
    this.syncLinePatternOptionsAndSelection();
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
    this.syncLinePatternOptionsAndSelection();
    this.loiColor = '#bf3d2c';
    this.loiWidth = 3;
    this.aoiColor = '#bf3d2c';
    this.selectedPoiIconName = 'home';
    this.selectedPoiMarkerStyle = 'symbol';
    this.poiMarkerText = '';
    this.poiMarkerTextInvalid = false;
    
    // Reset dropdown state
    this.isMarkerStyleDropdownOpen = false;
    
    // Icon picker will reset automatically through Angular binding
    


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
    this.selectedDataSourceFile = null;

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

    // Reset persisted parameter maps and bbox refs
    this.converterParameterValues = {};
    this.datasourceTypeParameterValues = {};
    this.bboxType = '';
    this.bboxRefSpatialUnit = null;
  }

  // Build post body for API request
  buildPostBody_georesources(): any {
    const postBody: any = {
      "geoJsonString": this.geoJsonString || "",
      "permissions": [],
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
          postBody.permissions.push(roleId);
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

      postBody["loiDashArrayString"] = (this.selectedLoiDashArrayObject as any)?.dashArrayValue || this.selectedLoiPattern?.dashArrayValue || '';
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

    this.converterDefinition = this.buildConverterDefinition();
    if (!this.converterDefinition) {
      this.errorMessage = 'Validierung fehlgeschlagen';
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON({
        cause: 'converterDefinition missing',
        hint: 'Schema/Format wählen und alle Pflicht-Parameter (z.B. CRS) setzen'
      });
      return false;
    }

    this.datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    if (!this.datasourceTypeDefinition) {
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
      this.errorMessage = 'Validierung fehlgeschlagen';
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON({
        cause: 'propertyMappingDefinition missing',
        hint: 'ID-/NAME-Attributnamen angeben'
      });
      return false;
    }

    this.postBody_georesources = this.buildPostBody_georesources();
    if (!this.postBody_georesources) {
      this.errorMessage = 'Validierung fehlgeschlagen';
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON({
        cause: 'postBody missing',
        hint: 'Pflichtfelder prüfen'
      });
      return false;
    }


    return true;
  }

  private buildConverterDefinition(): any {
    const formValues: { [key: string]: string } = { ...this.converterParameterValues };
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
    return def;
  }

  private async buildDatasourceTypeDefinition(): Promise<any> {
    try {

      // Pre-validate FILE datasource: require a selected file (persisted or from input)
      if (this.datasourceType?.type === 'FILE') {
        const fileInput: HTMLInputElement | null = (this.georesourceDataSourceInput?.nativeElement as HTMLInputElement) || (document.getElementById('georesourceDataSourceInput_add') as HTMLInputElement);
        let file: File | undefined | null = this.selectedDataSourceFile;
        if (!file) {
          file = fileInput?.files?.[0];
        }
        const hasFile = !!file;
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
        return localDef;
      }
      const formValues: { [key: string]: string } = {
        ...this.datasourceTypeParameterValues,
        bboxType: this.bboxType as any,
        bboxRef: this.bboxRefSpatialUnit as any
      } as any;
      const result = await this.kommonitorImporterHelperService.buildDatasourceTypeDefinition(
        this.datasourceType, 
        'datasourceTypeParameter_georesourceAdd_', 
        'georesourceDataSourceInput_add',
        formValues
      );
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
    return reasons;
  }

  isRegisterDisabled(): boolean {
    const reasons = this.getRegisterDisabledReasons();
    return reasons.length > 0;
  }

  private persistDynamicImporterFields(): void {
    try {
      // Persist converter parameter inputs
      const convNodes = Array.from(document.querySelectorAll("[id^='converterParameter_georesourceAdd_']")) as HTMLInputElement[];
      for (const el of convNodes) {
        const id = el.id || '';
        const key = id.replace('converterParameter_georesourceAdd_', '');
        if (key) {
          this.converterParameterValues[key] = el.value ?? '';
        }
      }
      // Persist datasource type parameter inputs
      const dsNodes = Array.from(document.querySelectorAll("[id^='datasourceTypeParameter_georesourceAdd_']")) as HTMLInputElement[];
      for (const el of dsNodes) {
        const id = el.id || '';
        const key = id.replace('datasourceTypeParameter_georesourceAdd_', '');
        if (key === 'bboxType') {
          this.bboxType = el.value || '';
        } else if (key === 'bboxRef') {
          this.bboxRefSpatialUnit = el.value || null;
        } else if (key) {
          this.datasourceTypeParameterValues[key] = el.value ?? '';
        }
      }
      // Persist selected file if present
      const fileInput = (this.georesourceDataSourceInput?.nativeElement as HTMLInputElement) || (document.getElementById('georesourceDataSourceInput_add') as HTMLInputElement | null);
      const file = fileInput?.files?.[0];
      if (file) {
        this.selectedDataSourceFile = file;
      }
    } catch {}
  }

  private reapplyDynamicImporterFields(): void {
    try {
      // Reapply converter parameter inputs
      Object.keys(this.converterParameterValues || {}).forEach((key) => {
        const el = document.getElementById(`converterParameter_georesourceAdd_${key}`) as HTMLInputElement | null;
        if (el) {
          el.value = this.converterParameterValues[key] ?? '';
        }
      });
      // Reapply datasource type parameter inputs
      Object.keys(this.datasourceTypeParameterValues || {}).forEach((key) => {
        const el = document.getElementById(`datasourceTypeParameter_georesourceAdd_${key}`) as HTMLInputElement | null;
        if (el) {
          el.value = this.datasourceTypeParameterValues[key] ?? '';
        }
      });
      // Reapply bbox fields if dedicated inputs exist
      const bboxTypeEl = document.getElementById('datasourceTypeParameter_georesourceAdd_bboxType') as HTMLInputElement | null;
      if (bboxTypeEl && this.bboxType) {
        bboxTypeEl.value = this.bboxType;
      }
      const bboxRefEl = document.getElementById('datasourceTypeParameter_georesourceAdd_bboxRef') as HTMLInputElement | null;
      if (bboxRefEl && this.bboxRefSpatialUnit) {
        bboxRefEl.value = `${this.bboxRefSpatialUnit}`;
      }
      // Reattach file listener after DOM changes
      this.attachFileInputListener();
      // Note: File inputs cannot be programmatically set for security reasons; selectedDataSourceFile is used during upload.
    } catch {}
  }

  private attachFileInputListener(): void {
    try {
      const inputEl = document.getElementById('georesourceDataSourceInput_add');
      if (!inputEl) { return; }
      if (this.fileInputChangeHandler) {
        inputEl.removeEventListener('change', this.fileInputChangeHandler);
      }
      this.fileInputChangeHandler = (e: Event) => this.onGeoresourceFileSelected(e);
      inputEl.addEventListener('change', this.fileInputChangeHandler);
    } catch {}
  }
} 