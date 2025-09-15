import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorGeoresourceDataExchangeService } from 'services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { KommonitorMultiStepFormHelperService } from 'services/adminGeoresourceUnit/kommonitor-multi-step-form-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from 'services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';
import { IconPickerComponent } from 'components/ngComponents/customElements/icon-picker/icon-picker.component';
import { KmDatePickerComponent } from 'components/ngComponents/customElements/date-picker/km-date-picker.component';
import { AdminTopicsManagementComponent } from '../../adminTopicsManagement/admin-topics-management.component';
import { KmLinePatternPickerComponent, LinePatternOption } from 'components/ngComponents/customElements/line-pattern-picker/km-line-pattern-picker.component';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';

@Component({
  selector: 'georesource-edit-metadata-modal-new',
  standalone: true,
  templateUrl: './georesource-edit-metadata-modal.component.html',
  styleUrls: ['./georesource-edit-metadata-modal.component.css'],
  providers: [],
  imports: [CommonModule, FormsModule, IconPickerComponent, KmDatePickerComponent, AdminTopicsManagementComponent, KmLinePatternPickerComponent, KmColorPickerComponent]
})
export class GeoresourceEditMetadataModalComponent implements OnInit, OnDestroy {
  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;

  // Component state
  loadingData = false;
  private _currentGeoresourceDataset: any;
  get currentGeoresourceDataset(): any { return this._currentGeoresourceDataset; }
  set currentGeoresourceDataset(value: any) {
    this._currentGeoresourceDataset = value;
    if (value) {
      // Ensure form is populated whenever dataset is assigned programmatically or via broadcast
      this.resetGeoresourceEditMetadataForm();
      this.kommonitorMultiStepFormHelperService.registerClickHandler();
    }
  }
  currentStep = 1;

  // Form data
  datasetName: string = '';
  datasetNameInvalid = false;
  poiMarkerText: string = '';
  poiMarkerTextInvalid = false;

  // Metadata
  metadata: any = {
    note: '',
    literature: '',
    updateInterval: undefined,
    sridEPSG: 4326,
    datasource: '',
    contact: '',
    lastUpdate: '',
    description: '',
    databasis: ''
  };

  // Georesource type
  georesourceType: string = 'poi';
  isPOI = true;
  isLOI = false;
  isAOI = false;

  // POI specific
  selectedPoiMarkerColor: any;
  selectedPoiSymbolColor: any;
  selectedPoiMarkerStyle: string = 'symbol';
  selectedPoiIconName: string = 'home';

  // LOI specific
  selectedLoiDashArrayObject: any;
  selectedLoiPattern: LinePatternOption | null = null;
  linePatternOptions: LinePatternOption[] = [];
  loiColor: string = '#bf3d2c';
  loiWidth: number = 3;

  // AOI specific
  aoiColor: string = '#bf3d2c';

  // Topic hierarchy
  georesourceTopic_mainTopic: any;
  georesourceTopic_subTopic: any;
  georesourceTopic_subsubTopic: any;
  georesourceTopic_subsubsubTopic: any;
  mainTopicsForGeoresource: any[] = [];
  private topicsLoaded = false;
  private topicsLoading = false;

  // Role management
  roleManagementTableOptions: any;

  // Import/Export
  metadataImportSettings: any;
  georesourceMetadataImportError: string = '';
  georesourceMetadataStructure: any;
  georesourceMetadataStructure_pretty: string = '';

  // Success/Error messages
  successMessagePart: string = '';
  errorMessagePart: string = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    public kommonitorDataExchangeService: KommonitorGeoresourceDataExchangeService,
    private kommonitorMultiStepFormHelperService: KommonitorMultiStepFormHelperService,
    private kommonitorDataGridHelperService: KommonitorGeoresourceDataGridHelperService,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.initializeDefaultValues();
  }

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

  onLastUpdateBlur(): void {
    this.metadata.lastUpdate = this.ensureValidDateOrToday(this.metadata.lastUpdate);
  }

  ngOnInit(): void {
    this.setupEventListeners();
    this.initializeMetadataStructure();
    // React to role changes and load topics once available
    const rolesSub = this.kommonitorDataExchangeService.currentRoles$.subscribe(() => {
      if (!this.topicsLoaded && !this.topicsLoading) {
        this.loadTopicsData();
      }
    });
    this.subscriptions.push(rolesSub);
    // Try an initial load in case roles are already set
    this.loadTopicsData();
    this.updateMainTopicsForGeoresource();
    
    
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load topics data for the dropdowns
   */
  private async loadTopicsData(): Promise<void> {
    try {
      if (this.topicsLoaded || this.topicsLoading) { return; }
      this.topicsLoading = true;
      const roles = this.kommonitorDataExchangeService.currentKeycloakLoginRoles || [];
      console.log('[GeoresourceEditMetadataModal] loadTopicsData: fetching topics with roles', roles);
      const topics = await this.kommonitorDataExchangeService.fetchTopicsMetadata(roles);
      console.log('[GeoresourceEditMetadataModal] loadTopicsData: fetched topics length', Array.isArray(topics) ? topics.length : 'n/a');
      this.updateMainTopicsForGeoresource();
      // If a dataset is already selected, set its topic selection now
      if (this.currentGeoresourceDataset?.topicReference) {
        this.applyTopicSelectionFromDataset();
      }
      this.topicsLoaded = true;
    } catch (error) {
      console.warn('Could not load topics data:', error);
    }
    finally {
      this.topicsLoading = false;
    }
  }

  /**
   * Public method to manually refresh topics (for debugging)
   */
  public refreshTopics(): void {
    this.loadTopicsData();
  }

  /**
   * Debug method to check topics state
   */
  public debugTopicsState(): void {
    console.log('=== Topics Debug Info ===');
    console.log('Available topics:', this.kommonitorDataExchangeService.availableTopics);
    console.log('Topics length:', this.kommonitorDataExchangeService.availableTopics?.length);
    console.log('Main topics for georesource:', this.mainTopicsForGeoresource);
    console.log('Current main topic:', this.georesourceTopic_mainTopic);
    console.log('Current sub topic:', this.georesourceTopic_subTopic);
    console.log('Current subsub topic:', this.georesourceTopic_subsubTopic);
    console.log('Current subsubsub topic:', this.georesourceTopic_subsubsubTopic);
    console.log('========================');
  }

  // Filtered subtopics by topicResource === 'georesource' to align with backend hierarchy
  get filteredSubTopicsLevel1(): any[] {
    return this.filterSubTopicsByResource(this.georesourceTopic_mainTopic);
  }

  get filteredSubTopicsLevel2(): any[] {
    return this.filterSubTopicsByResource(this.georesourceTopic_subTopic);
  }

  get filteredSubTopicsLevel3(): any[] {
    return this.filterSubTopicsByResource(this.georesourceTopic_subsubTopic);
  }

  private filterSubTopicsByResource(parentTopic: any): any[] {
    const subs = (parentTopic?.subTopics || []);
    return subs.filter((t: any) => t?.topicResource === 'georesource');
  }

  private initializeDefaultValues(): void {
    // Initialize with default values from the service
    if (this.kommonitorDataExchangeService.availablePoiMarkerColors?.length > 0) {
      this.selectedPoiMarkerColor = this.kommonitorDataExchangeService.availablePoiMarkerColors[0];
    }
    if (this.kommonitorDataExchangeService.availablePoiMarkerColors?.length > 1) {
      this.selectedPoiSymbolColor = this.kommonitorDataExchangeService.availablePoiMarkerColors[1];
    }
    if (this.kommonitorDataExchangeService.availableLoiDashArrayObjects?.length > 0) {
      this.selectedLoiDashArrayObject = this.kommonitorDataExchangeService.availableLoiDashArrayObjects[0];
    }
    this.syncLinePatternOptionsAndSelection();
  }

  private initializeMetadataStructure(): void {
    this.georesourceMetadataStructure = {
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

    this.georesourceMetadataStructure_pretty = this.kommonitorDataExchangeService.syntaxHighlightJSON 
      ? this.kommonitorDataExchangeService.syntaxHighlightJSON(this.georesourceMetadataStructure)
      : JSON.stringify(this.georesourceMetadataStructure, null, 2);
  }

  private setupEventListeners(): void {
    // Listen for edit georesource metadata event
    const editSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'onEditGeoresourceMetadata') {
        // Align with BroadcastService signature { msg, values }
        const payload = (data && (data.values ?? data.georesourceDataset)) || null;
        if (payload) {
          this.currentGeoresourceDataset = payload;
        }
      }
    });
    this.subscriptions.push(editSub);

    // Listen for available roles update
    const rolesSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'availableRolesUpdate') {
        this.refreshRoles();
      }
    });
    this.subscriptions.push(rolesSub);
  }

  private refreshRoles(): void {
    const allowedRoles = this.currentGeoresourceDataset ? this.currentGeoresourceDataset.allowedRoles : [];
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceEditRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
      allowedRoles
    );
  }

  // Form methods
  resetGeoresourceEditMetadataForm(): void {
    if (!this.currentGeoresourceDataset) return;

    this.currentStep = 1;
    this.datasetName = this.currentGeoresourceDataset.datasetName;
    this.datasetNameInvalid = false;

    // Load topics data if not already loaded
    this.loadTopicsData();

    // Reset metadata
    this.metadata = {
      note: this.currentGeoresourceDataset.metadata?.note || '',
      literature: this.currentGeoresourceDataset.metadata?.literature || '',
      sridEPSG: 4326,
      datasource: this.currentGeoresourceDataset.metadata?.datasource || '',
      databasis: this.currentGeoresourceDataset.metadata?.databasis || '',
      contact: this.currentGeoresourceDataset.metadata?.contact || '',
      description: this.currentGeoresourceDataset.metadata?.description || '',
      lastUpdate: this.currentGeoresourceDataset.metadata?.lastUpdate || ''
    };

    // Set update interval
    if (this.kommonitorDataExchangeService.updateIntervalOptions) {
      this.kommonitorDataExchangeService.updateIntervalOptions.forEach((option: any) => {
        if (option.apiName === this.currentGeoresourceDataset.metadata?.updateInterval) {
          this.metadata.updateInterval = option;
        }
      });
    }

    // Set role management
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceEditRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
      this.currentGeoresourceDataset.allowedRoles || []
    );

    // Set georesource type
    this.isPOI = this.currentGeoresourceDataset.isPOI || false;
    this.isLOI = this.currentGeoresourceDataset.isLOI || false;
    this.isAOI = this.currentGeoresourceDataset.isAOI || false;

    if (this.isPOI) {
      this.georesourceType = 'poi';
    } else if (this.isLOI) {
      this.georesourceType = 'loi';
    } else {
      this.georesourceType = 'aoi';
    }

    // Set POI colors
    if (this.kommonitorDataExchangeService.availablePoiMarkerColors) {
      this.kommonitorDataExchangeService.availablePoiMarkerColors.forEach((option: any) => {
        if (option.colorName === this.currentGeoresourceDataset.poiMarkerColor) {
          this.selectedPoiMarkerColor = option;
        }
        if (option.colorName === this.currentGeoresourceDataset.poiSymbolColor) {
          this.selectedPoiSymbolColor = option;
        }
      });
    }

    // Set LOI properties
    if (this.kommonitorDataExchangeService.availableLoiDashArrayObjects) {
      this.kommonitorDataExchangeService.availableLoiDashArrayObjects.forEach((option: any) => {
        if (option.dashArrayValue === this.currentGeoresourceDataset.loiDashArrayString) {
          this.selectedLoiDashArrayObject = option;
          this.onChangeLoiDashArray(this.selectedLoiDashArrayObject);
        }
      });
    }
    this.syncLinePatternOptionsAndSelection();

    this.loiColor = this.currentGeoresourceDataset.loiColor || '#bf3d2c';
    this.loiWidth = this.currentGeoresourceDataset.loiWidth || 3;
    this.aoiColor = this.currentGeoresourceDataset.aoiColor || '#bf3d2c';
    this.selectedPoiIconName = this.currentGeoresourceDataset.poiSymbolBootstrap3Name || 'home';

    // Set topic hierarchy if topics are already loaded, otherwise defer until after load
    if (this.topicsLoaded) {
      this.applyTopicSelectionFromDataset();
    }

    // Clear any existing alert messages
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.georesourceMetadataImportError = '';

    // Initialize date picker
    setTimeout(() => {
      this.initializeDatePickers();
    }, 250);
  }

  private initializeDatePickers(): void {
    try {
      // Datepicker initialization is handled by ngbDatepicker in the template.

      // Initialize color pickers
      const loiColorPicker = document.getElementById('loiColorEditPicker');
      const aoiColorPicker = document.getElementById('aoiColorEditPicker');
      
      if (loiColorPicker && (window as any).$) {
        (window as any).$('#loiColorEditPicker').colorpicker();
        (window as any).$('#loiColorEditPicker').colorpicker('setValue', this.loiColor);
      }
      
      if (aoiColorPicker && (window as any).$) {
        (window as any).$('#aoiColorEditPicker').colorpicker();
        (window as any).$('#aoiColorEditPicker').colorpicker('setValue', this.aoiColor);
      }


      // Initialize LOI dash array dropdown
      setTimeout(() => {
        if (this.kommonitorDataExchangeService.availableLoiDashArrayObjects) {
          for (let i = 0; i < this.kommonitorDataExchangeService.availableLoiDashArrayObjects.length; i++) {
            const element = document.getElementById('loiDashArrayEditDropdownItem-' + i);
            if (element) {
              element.innerHTML = this.kommonitorDataExchangeService.availableLoiDashArrayObjects[i].svgString;
            }
          }

          const buttonElement = document.getElementById('loiDashArrayEditDropdownButton');
          if (buttonElement) {
            buttonElement.innerHTML = this.selectedLoiDashArrayObject.svgString;
          }
        }
      }, 1000);

    } catch (error) {
      console.warn('Date picker/color picker initialization failed:', error);
    }
  }

  // Validation methods
  checkDatasetName(): void {
    this.datasetNameInvalid = false;
    if (this.kommonitorDataExchangeService.availableGeoresources) {
      this.kommonitorDataExchangeService.availableGeoresources.forEach((georesource: any) => {
        if (georesource.datasetName === this.datasetName && 
            georesource.georesourceId !== this.currentGeoresourceDataset?.georesourceId) {
          this.datasetNameInvalid = true;
          return;
        }
      });
    }
  }

  checkPoiMarkerText(): void {
    this.poiMarkerTextInvalid = this.poiMarkerText.length > 3;
  }

  // Georesource type change
  onChangeGeoresourceType(): void {
    this.isPOI = this.georesourceType === 'poi';
    this.isLOI = this.georesourceType === 'loi';
    this.isAOI = this.georesourceType === 'aoi';
  }

  // POI methods
  onChangeMarkerColor(markerColor: any): void {
    this.selectedPoiMarkerColor = markerColor;
  }

  onChangeSymbolColor(symbolColor: any): void {
    this.selectedPoiSymbolColor = symbolColor;
  }

  onChangeMarkerStyle(style: string): void {
    this.selectedPoiMarkerStyle = style;
  }

  onIconSelect(iconName: string): void {
    this.selectedPoiIconName = iconName;
  }

  // LOI methods
  onChangeLoiDashArray(loiDashArrayObjectOrPattern: any): void {
    const dash = loiDashArrayObjectOrPattern?.dashArrayValue;
    if (dash) {
      // Update selected pattern for the picker
      this.selectedLoiPattern = this.linePatternOptions.find(p => p.dashArrayValue === dash) || null;
      // Update legacy selected object from service list
      const svcObj = (this.kommonitorDataExchangeService.availableLoiDashArrayObjects || []).find((o: any) => o?.dashArrayValue === dash);
      this.selectedLoiDashArrayObject = svcObj || loiDashArrayObjectOrPattern;
      const buttonElement = document.getElementById('loiDashArrayEditDropdownButton');
      if (buttonElement && (svcObj?.svgString || this.selectedLoiPattern?.svgString)) {
        buttonElement.innerHTML = (svcObj?.svgString || this.selectedLoiPattern?.svgString) as string;
      }
    }
  }

  private syncLinePatternOptionsAndSelection(): void {
    // Map available LOI patterns to LinePatternOption[] for the picker
    const src = this.kommonitorDataExchangeService.availableLoiDashArrayObjects || [];
    this.linePatternOptions = src.map((o: any) => {
      const display = o?.displayName || o?.dashArrayValue || '';
      const dash = o?.dashArrayValue || '';
      const svg = o?.svgString || `
        <svg xmlns="http://www.w3.org/2000/svg" width="180" height="20" viewBox="0 0 180 20">
          <line x1="5" y1="10" x2="175" y2="10" stroke="#333" stroke-width="3" stroke-dasharray="${dash}" stroke-linecap="butt"/>
        </svg>
      `;
      return { label: display, dashArrayValue: dash, svgString: svg } as LinePatternOption;
    });
    if (this.selectedLoiDashArrayObject) {
      const dashSel = this.selectedLoiDashArrayObject.dashArrayValue;
      this.selectedLoiPattern = this.linePatternOptions.find(p => p.dashArrayValue === dashSel) || null;
    } else {
      this.selectedLoiPattern = null;
    }
  }

  // Import/Export methods
  onImportGeoresourceEditMetadata(): void {
    this.georesourceMetadataImportError = '';
    this.metadataImportFile.nativeElement.click();
  }

  onMetadataFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.parseMetadataFromFile(file);
    }
  }

  private parseMetadataFromFile(file: File): void {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMetadataFile(event);
      } catch (error) {
        console.error('Uploaded Metadata File cannot be parsed.');
        this.georesourceMetadataImportError = 'Uploaded Metadata File cannot be parsed correctly';
        const preElement = document.getElementById('georesourcesEditMetadataPre');
        if (preElement) {
          preElement.innerHTML = this.georesourceMetadataStructure_pretty;
        }
        this.showMetadataImportErrorAlert();
      }
    };

    fileReader.readAsText(file);
  }

  private parseFromMetadataFile(event: any): void {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      console.error('uploaded Metadata File cannot be parsed - wrong structure.');
      this.georesourceMetadataImportError = 'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      const preElement = document.getElementById('georesourcesEditMetadataPre');
      if (preElement) {
        preElement.innerHTML = this.georesourceMetadataStructure_pretty;
      }
      this.showMetadataImportErrorAlert();
      return;
    }

    // Parse metadata
    this.metadata = {
      note: this.metadataImportSettings.metadata.note,
      literature: this.metadataImportSettings.metadata.literature,
      sridEPSG: this.metadataImportSettings.metadata.sridEPSG,
      datasource: this.metadataImportSettings.metadata.datasource,
      contact: this.metadataImportSettings.metadata.contact,
      lastUpdate: this.metadataImportSettings.metadata.lastUpdate,
      description: this.metadataImportSettings.metadata.description,
      databasis: this.metadataImportSettings.metadata.databasis
    };

    // Set update interval
    if (this.kommonitorDataExchangeService.updateIntervalOptions) {
      this.kommonitorDataExchangeService.updateIntervalOptions.forEach((option: any) => {
        if (option.apiName === this.metadataImportSettings.metadata.updateInterval) {
          this.metadata.updateInterval = option;
        }
      });
    }

    this.datasetName = this.metadataImportSettings.datasetName;

    // Set role management
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceEditRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
      this.metadataImportSettings.allowedRoles
    );

    // Set georesource specific properties
    this.isPOI = this.metadataImportSettings.isPOI;
    this.isLOI = this.metadataImportSettings.isLOI;
    this.isAOI = this.metadataImportSettings.isAOI;

    if (this.metadataImportSettings.isPOI) {
      this.georesourceType = 'poi';
    } else if (this.metadataImportSettings.isLOI) {
      this.georesourceType = 'loi';
    } else {
      this.georesourceType = 'aoi';
    }

    // Set POI colors
    if (this.kommonitorDataExchangeService.availablePoiMarkerColors) {
      this.kommonitorDataExchangeService.availablePoiMarkerColors.forEach((option: any) => {
        if (option.colorName === this.metadataImportSettings.poiMarkerColor) {
          this.selectedPoiMarkerColor = option;
        }
        if (option.colorName === this.metadataImportSettings.poiSymbolColor) {
          this.selectedPoiSymbolColor = option;
        }
      });
    }

    // Set LOI properties
    if (this.kommonitorDataExchangeService.availableLoiDashArrayObjects) {
      this.kommonitorDataExchangeService.availableLoiDashArrayObjects.forEach((option: any) => {
        if (option.dashArrayValue === this.metadataImportSettings.loiDashArrayString) {
          this.selectedLoiDashArrayObject = option;
          this.onChangeLoiDashArray(this.selectedLoiDashArrayObject);
        }
      });
    }

    this.loiColor = this.metadataImportSettings.loiColor;
    this.loiWidth = this.metadataImportSettings.loiWidth;
    this.aoiColor = this.metadataImportSettings.aoiColor;
    this.selectedPoiIconName = this.metadataImportSettings.poiSymbolBootstrap3Name;

    // Set color pickers
    setTimeout(() => {
      if ((window as any).$) {
        (window as any).$('#loiColorEditPicker').colorpicker('setValue', this.loiColor);
        (window as any).$('#aoiColorEditPicker').colorpicker('setValue', this.aoiColor);
        (window as any).$('#poiSymbolEditPicker').iconpicker('setIcon', 'glyphicon-' + this.metadataImportSettings.poiSymbolBootstrap3Name);
      }
    }, 200);

    // Set topic hierarchy
    if (this.kommonitorDataExchangeService.getTopicHierarchyForTopicId) {
      const topicHierarchy = this.kommonitorDataExchangeService.getTopicHierarchyForTopicId(
        this.metadataImportSettings.topicReference
      );

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
  }

  onExportGeoresourceEditMetadata(): void {
    const metadataExport = JSON.parse(JSON.stringify(this.georesourceMetadataStructure));

    metadataExport.metadata.note = this.metadata.note || '';
    metadataExport.metadata.literature = this.metadata.literature || '';
    metadataExport.metadata.sridEPSG = this.metadata.sridEPSG || '';
    metadataExport.metadata.datasource = this.metadata.datasource || '';
    metadataExport.metadata.contact = this.metadata.contact || '';
    metadataExport.metadata.lastUpdate = this.metadata.lastUpdate || '';
    metadataExport.metadata.description = this.metadata.description || '';
    metadataExport.metadata.databasis = this.metadata.databasis || '';
    metadataExport.datasetName = this.datasetName || '';

    metadataExport.allowedRoles = [];

    const roleIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
    for (const roleId of roleIds) {
      metadataExport.allowedRoles.push(roleId);
    }

    if (this.metadata.updateInterval) {
      metadataExport.metadata.updateInterval = this.metadata.updateInterval.apiName;
    }

    // Georesource specific properties
    metadataExport.isPOI = this.isPOI;
    metadataExport.isLOI = this.isLOI;
    metadataExport.isAOI = this.isAOI;

    if (this.isPOI) {
      metadataExport.poiSymbolBootstrap3Name = this.selectedPoiIconName;
      metadataExport.poiSymbolColor = this.selectedPoiSymbolColor.colorName;
      metadataExport.poiMarkerColor = this.selectedPoiMarkerColor.colorName;
      metadataExport.loiDashArrayString = '';
      metadataExport.loiColor = '';
      metadataExport.loiWidth = '';
      metadataExport.aoiColor = '';
    } else if (this.isLOI) {
      metadataExport.poiSymbolBootstrap3Name = '';
      metadataExport.poiSymbolColor = '';
      metadataExport.poiMarkerColor = '';
      metadataExport.loiDashArrayString = (this.selectedLoiDashArrayObject?.dashArrayValue) || (this.selectedLoiPattern?.dashArrayValue) || '';
      metadataExport.loiColor = this.loiColor;
      metadataExport.loiWidth = this.loiWidth;
      metadataExport.aoiColor = '';
    } else if (this.isAOI) {
      metadataExport.poiSymbolBootstrap3Name = '';
      metadataExport.poiSymbolColor = '';
      metadataExport.poiMarkerColor = '';
      metadataExport.loiDashArrayString = '';
      metadataExport.loiColor = '';
      metadataExport.loiWidth = '';
      metadataExport.aoiColor = this.aoiColor;
    }

    // Set topic reference
    if (this.georesourceTopic_subsubsubTopic) {
      metadataExport.topicReference = this.georesourceTopic_subsubsubTopic.topicId;
    } else if (this.georesourceTopic_subsubTopic) {
      metadataExport.topicReference = this.georesourceTopic_subsubTopic.topicId;
    } else if (this.georesourceTopic_subTopic) {
      metadataExport.topicReference = this.georesourceTopic_subTopic.topicId;
    } else if (this.georesourceTopic_mainTopic) {
      metadataExport.topicReference = this.georesourceTopic_mainTopic.topicId;
    } else {
      metadataExport.topicReference = '';
    }

    const metadataJSON = JSON.stringify(metadataExport);
    let fileName = 'Georessource_Metadaten_Export';

    if (this.datasetName) {
      fileName += '-' + this.datasetName;
    }

    fileName += '.json';

    const blob = new Blob([metadataJSON], { type: 'application/json' });
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

  // Export template method (missing from AngularJS version)
  onExportGeoresourceEditMetadataTemplate(): void {
    const metadataJSON = JSON.stringify(this.georesourceMetadataStructure);
    const fileName = "Georessource_Metadaten_Vorlage_Export.json";

    const blob = new Blob([metadataJSON], { type: "application/json" });
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

  // Main edit method
  editGeoresourceMetadata(): void {
    // Set topic reference
    let topicReference = '';
    if (this.georesourceTopic_subsubsubTopic) {
      topicReference = this.georesourceTopic_subsubsubTopic.topicId;
    } else if (this.georesourceTopic_subsubTopic) {
      topicReference = this.georesourceTopic_subsubTopic.topicId;
    } else if (this.georesourceTopic_subTopic) {
      topicReference = this.georesourceTopic_subTopic.topicId;
    } else if (this.georesourceTopic_mainTopic) {
      topicReference = this.georesourceTopic_mainTopic.topicId;
    }

    const patchBody: any = {
      metadata: {
        note: this.metadata.note || '',
        literature: this.metadata.literature || '',
        updateInterval: this.metadata.updateInterval?.apiName || '',
        sridEPSG: this.metadata.sridEPSG || 4326,
        datasource: this.metadata.datasource || '',
        contact: this.metadata.contact || '',
        lastUpdate: this.toIsoDateString(this.metadata.lastUpdate) || '',
        description: this.metadata.description || '',
        databasis: this.metadata.databasis || ''
      },
      datasetName: this.datasetName || '',
      isAOI: this.isAOI,
      isLOI: this.isLOI,
      isPOI: this.isPOI,
      topicReference: topicReference,
      poiSymbolBootstrap3Name: null,
      poiSymbolColor: null,
      poiMarkerColor: null,
      poiMarkerStyle: null,
      poiMarkerText: null,
      loiDashArrayString: null,
      loiColor: null,
      loiWidth: null,
      aoiColor: null
    };

    // Set georesource-specific fields based on type
    if (this.isPOI) {
      patchBody.poiSymbolBootstrap3Name = this.selectedPoiIconName || '';
      patchBody.poiSymbolColor = this.selectedPoiSymbolColor?.colorName || '';
      patchBody.poiMarkerColor = this.selectedPoiMarkerColor?.colorName || '';
      patchBody.poiMarkerStyle = this.selectedPoiMarkerStyle || 'symbol';
      patchBody.poiMarkerText = this.poiMarkerText || '';
    } else if (this.isLOI) {
      patchBody.loiDashArrayString = (this.selectedLoiDashArrayObject?.dashArrayValue) || (this.selectedLoiPattern?.dashArrayValue) || null;
      patchBody.loiColor = this.loiColor || null;
      patchBody.loiWidth = this.loiWidth || null;
    } else if (this.isAOI) {
      patchBody.aoiColor = this.aoiColor || null;
    }

    // Debug logging
    console.log('PATCH Request Body:', JSON.stringify(patchBody, null, 2));
    console.log('PATCH URL:', this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + '/georesources/' + this.currentGeoresourceDataset.georesourceId);

    this.loadingData = true;

    this.http.patch(
      this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + '/georesources/' + this.currentGeoresourceDataset.georesourceId,
      patchBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).subscribe({
      next: (response: any) => {
        console.log('PATCH Request Success:', response);
        this.successMessagePart = this.datasetName;
        console.log('Success message part set to:', this.successMessagePart);
        
        this.broadcastService.broadcast('refreshGeoresourceOverviewTable', { crudType: 'edit', targetGeoresourceId: this.currentGeoresourceDataset.georesourceId });
        console.log('Refresh broadcast sent');
        
        // Success alert will be shown via *ngIf since successMessagePart is set
        this.loadingData = false;
        
        // Auto-hide success message after 5 seconds and close modal
        setTimeout(() => {
          console.log('Auto-hiding success alert and closing modal');
          this.hideSuccessAlert();
          this.activeModal.close();
        }, 5000);
      },
      error: (error: any) => {
        console.error('PATCH Request Error:', error);
        console.error('Error Status:', error.status);
        console.error('Error Message:', error.message);
        console.error('Error Body:', error.error);
        
        if (error.error) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON 
            ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error)
            : JSON.stringify(error.error, null, 2);
        } else if (error.data) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON 
            ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data)
            : JSON.stringify(error.data, null, 2);
        } else {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON 
            ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error)
            : JSON.stringify(error, null, 2);
        }
        // Error alert will be shown via *ngIf since errorMessagePart is set
        this.loadingData = false;
      }
    });
  }

  // Alert methods - simplified since we now use *ngIf
  showSuccessAlert(): void {
    // Alerts are now shown/hidden via *ngIf based on message content
    console.log('Success alert should be visible for:', this.successMessagePart);
  }

  showErrorAlert(): void {
    // Alerts are now shown/hidden via *ngIf based on message content
    console.log('Error alert should be visible for:', this.errorMessagePart);
  }

  showMetadataImportErrorAlert(): void {
    // Alerts are now shown/hidden via *ngIf based on message content
    console.log('Metadata import error alert should be visible');
  }

  hideSuccessAlert(): void {
    this.successMessagePart = '';
    console.log('Success alert hidden');
  }

  hideErrorAlert(): void {
    this.errorMessagePart = '';
    console.log('Error alert hidden');
  }

  hideMetadataErrorAlert(): void {
    this.georesourceMetadataImportError = '';
    console.log('Metadata import error alert hidden');
  }

  // Compute and cache filtered topics for georesource
  private updateMainTopicsForGeoresource(): void {
    const topics = this.kommonitorDataExchangeService.availableTopics;
    if (!topics) {
      this.mainTopicsForGeoresource = [];
      return;
    }
    // 1) Filter to main topics for georesources (align with Add modal)
    let filtered = this.filterTopicsForGeoresources(Array.isArray(topics) ? topics : []);
    console.log('[GeoresourceEditMetadataModal] updateMainTopicsForGeoresource: after filter', {
      inputLength: Array.isArray(topics) ? topics.length : 'n/a',
      filteredLength: filtered.length,
      sample: filtered.slice(0, 3)
    });
    // 2) Normalize to ensure consistent keys and child arrays
    filtered = this.normalizeTopics(filtered);
    console.log('[GeoresourceEditMetadataModal] updateMainTopicsForGeoresource: after normalize', {
      normalizedLength: filtered.length,
      sample: filtered.slice(0, 3)
    });
    // 3) Deduplicate by displayed label first (case-insensitive)
    filtered = this.deduplicateTopicsByLabel(filtered);
    // 4) Ensure uniqueness by ID as well
    this.mainTopicsForGeoresource = this.deduplicateTopicsById(filtered);
  }

  /**
   * Filter topics to only show main topics for georesources (like AngularJS component)
   */
  private filterTopicsForGeoresources(topics: any[]): any[] {
    const result = (topics || []).filter((topic: any) =>
      topic && topic.topicType === 'main' && topic.topicResource === 'georesource'
    );
    console.log('[GeoresourceEditMetadataModal] filterTopicsForGeoresources', {
      inputLength: Array.isArray(topics) ? topics.length : 'n/a',
      outputLength: result.length,
      firstItem: result[0]
    });
    return result;
  }

  /**
   * Remove duplicates by the displayed label (case-insensitive), e.g., topicName/name.
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
        if (newChildren > currChildren || (!currHasId && newHasId)) {
          map.set(key, t);
        }
      }
    }
    return Array.from(map.values());
  }

  /**
   * Remove duplicates from topics array by stable identifier (topicId | id | name fallback)
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

  // Normalize topic tree to always use 'subTopics' recursively and provide label fallback
  private normalizeTopics(topics: any[]): any[] {
    return (topics || []).map(t => this.normalizeTopicNode(t));
  }

  private normalizeTopicNode(topic: any): any {
    if (!topic || typeof topic !== 'object') { return topic; }
    topic.topicName = topic.topicName || topic.name || topic.title || topic.label || topic.text || topic.topicname;
    const children = topic.subTopics || topic.subtopics || topic.children || [];
    topic.subTopics = Array.isArray(children) ? children.map((c: any) => this.normalizeTopicNode(c)) : [];
    return topic;
  }

  private applyTopicSelectionFromDataset(): void {
    if (!this.currentGeoresourceDataset?.topicReference) { return; }
    if (!this.kommonitorDataExchangeService.getTopicHierarchyForTopicId) { return; }
    const topicHierarchy = this.kommonitorDataExchangeService.getTopicHierarchyForTopicId(
      this.currentGeoresourceDataset.topicReference
    );
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

  // Validation for form submission
  canSubmitForm(): boolean {
    return !this.datasetNameInvalid && 
           !!this.metadata.description && 
           !!this.metadata.datasource && 
           !!this.metadata.contact && 
           !!this.metadata.updateInterval && 
           !!this.metadata.lastUpdate && 
           !this.poiMarkerTextInvalid;
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


  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }

} 