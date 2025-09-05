import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorGeoresourceDataExchangeService } from 'services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { KommonitorMultiStepFormHelperService } from 'services/adminGeoresourceUnit/kommonitor-multi-step-form-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from 'services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';

@Component({
  selector: 'georesource-edit-metadata-modal-new',
  templateUrl: './georesource-edit-metadata-modal.component.html',
  styleUrls: ['./georesource-edit-metadata-modal.component.css'],
  providers: []
})
export class GeoresourceEditMetadataModalComponent implements OnInit, OnDestroy {
  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;

  // Component state
  loadingData = false;
  currentGeoresourceDataset: any;
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
  loiColor: string = '#bf3d2c';
  loiWidth: number = 3;

  // AOI specific
  aoiColor: string = '#bf3d2c';

  // Topic hierarchy
  georesourceTopic_mainTopic: any;
  georesourceTopic_subTopic: any;
  georesourceTopic_subsubTopic: any;
  georesourceTopic_subsubsubTopic: any;

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
    this.loadTopicsData();
    
    // Add click outside handler for dropdown
    document.addEventListener('click', this.onDocumentClick.bind(this));
    
    // Initialize icon picker
    setTimeout(() => {
      this.initializeIconPicker();
    }, 500);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Remove document click listener
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  /**
   * Load topics data for the dropdowns
   */
  private async loadTopicsData(): Promise<void> {
    try {
      console.log('Loading topics data...');
      const roles = this.kommonitorDataExchangeService.currentKeycloakLoginRoles;
      console.log('Current roles:', roles);
      
      if (roles && roles.length > 0) {
        console.log('Fetching topics metadata...');
        const topics = await this.kommonitorDataExchangeService.fetchTopicsMetadata(roles);
        console.log('Topics fetched:', topics);
        console.log('Available topics after fetch:', this.kommonitorDataExchangeService.availableTopics);
      } else {
        console.warn('No roles available for topics loading');
      }
    } catch (error) {
      console.warn('Could not load topics data:', error);
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
    console.log('Main topics for georesource:', this.getMainTopicsForGeoresource());
    console.log('Current main topic:', this.georesourceTopic_mainTopic);
    console.log('Current sub topic:', this.georesourceTopic_subTopic);
    console.log('Current subsub topic:', this.georesourceTopic_subsubTopic);
    console.log('Current subsubsub topic:', this.georesourceTopic_subsubsubTopic);
    console.log('========================');
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
        this.currentGeoresourceDataset = data.georesourceDataset;
        this.resetGeoresourceEditMetadataForm();
        this.kommonitorMultiStepFormHelperService.registerClickHandler();
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

    this.loiColor = this.currentGeoresourceDataset.loiColor || '#bf3d2c';
    this.loiWidth = this.currentGeoresourceDataset.loiWidth || 3;
    this.aoiColor = this.currentGeoresourceDataset.aoiColor || '#bf3d2c';
    this.selectedPoiIconName = this.currentGeoresourceDataset.poiSymbolBootstrap3Name || 'home';

    // Set topic hierarchy
    if (this.kommonitorDataExchangeService.getTopicHierarchyForTopicId) {
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

    // Reset messages
    this.successMessagePart = '';
    this.errorMessagePart = '';

    // Initialize date picker
    setTimeout(() => {
      this.initializeDatePickers();
      this.initializeIconPicker();
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

      // Initialize icon picker
      const iconPicker = document.getElementById('poiSymbolEditPicker');
      if (iconPicker && (window as any).$) {
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
          unselectedClass: ''
        };

        (window as any).$('#poiSymbolEditPicker').iconpicker(iconPickerOptions);
        (window as any).$('#poiSymbolEditPicker').on('change', (e: any) => {
          this.selectedPoiIconName = e.icon.substring(e.icon.indexOf('-') + 1);
        });
        (window as any).$('#poiSymbolEditPicker').iconpicker('setIcon', 'glyphicon-' + this.selectedPoiIconName);
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
    // Reinitialize icon picker if switching to symbol mode
    if (style === 'symbol') {
      setTimeout(() => {
        this.initializeIconPicker();
      }, 100);
    }
  }

  // LOI methods
  onChangeLoiDashArray(loiDashArrayObject: any): void {
    this.selectedLoiDashArrayObject = loiDashArrayObject;
    const buttonElement = document.getElementById('loiDashArrayEditDropdownButton');
    if (buttonElement) {
      buttonElement.innerHTML = loiDashArrayObject.svgString;
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
      metadataExport.loiDashArrayString = this.selectedLoiDashArrayObject.dashArrayValue;
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
    const patchBody: any = {
      metadata: {
        note: this.metadata.note,
        literature: this.metadata.literature,
        updateInterval: this.metadata.updateInterval.apiName,
        sridEPSG: this.metadata.sridEPSG,
        datasource: this.metadata.datasource,
        contact: this.metadata.contact,
        lastUpdate: this.toIsoDateString(this.metadata.lastUpdate),
        description: this.metadata.description,
        databasis: this.metadata.databasis
      },
      allowedRoles: [],
      datasetName: this.datasetName,
      isAOI: this.isAOI,
      isLOI: this.isLOI,
      isPOI: this.isPOI,
      topicReference: null
    };

    const roleIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
    for (const roleId of roleIds) {
      patchBody.allowedRoles.push(roleId);
    }

    if (this.isPOI) {
      patchBody.poiSymbolBootstrap3Name = this.selectedPoiIconName;
      patchBody.poiSymbolColor = this.selectedPoiSymbolColor.colorName;
      patchBody.poiMarkerColor = this.selectedPoiMarkerColor.colorName;
      patchBody.loiDashArrayString = null;
      patchBody.loiColor = null;
      patchBody.loiWidth = null;
      patchBody.aoiColor = null;
    } else if (this.isLOI) {
      patchBody.poiSymbolBootstrap3Name = null;
      patchBody.poiSymbolColor = null;
      patchBody.poiMarkerColor = null;
      patchBody.loiDashArrayString = this.selectedLoiDashArrayObject.dashArrayValue;
      patchBody.loiColor = this.loiColor;
      patchBody.loiWidth = this.loiWidth;
      patchBody.aoiColor = null;
    } else if (this.isAOI) {
      patchBody.poiSymbolBootstrap3Name = null;
      patchBody.poiSymbolColor = null;
      patchBody.poiMarkerColor = null;
      patchBody.loiDashArrayString = null;
      patchBody.loiColor = null;
      patchBody.loiWidth = null;
      patchBody.aoiColor = this.aoiColor;
    }

    // Set topic reference
    if (this.georesourceTopic_subsubsubTopic) {
      patchBody.topicReference = this.georesourceTopic_subsubsubTopic.topicId;
    } else if (this.georesourceTopic_subsubTopic) {
      patchBody.topicReference = this.georesourceTopic_subsubTopic.topicId;
    } else if (this.georesourceTopic_subTopic) {
      patchBody.topicReference = this.georesourceTopic_subTopic.topicId;
    } else if (this.georesourceTopic_mainTopic) {
      patchBody.topicReference = this.georesourceTopic_mainTopic.topicId;
    } else {
      patchBody.topicReference = '';
    }

    this.loadingData = true;

    this.http.patch(
      this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + '/georesources/' + this.currentGeoresourceDataset.georesourceId,
      patchBody
    ).subscribe({
      next: (response: any) => {
        this.successMessagePart = this.datasetName;
        this.broadcastService.broadcast('refreshGeoresourceOverviewTable', { crudType: 'edit', targetGeoresourceId: this.currentGeoresourceDataset.georesourceId });
        this.showSuccessAlert();
        this.loadingData = false;
      },
      error: (error: any) => {
        if (error.data) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON 
            ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data)
            : JSON.stringify(error.data, null, 2);
        } else {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON 
            ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error)
            : JSON.stringify(error, null, 2);
        }
        this.showErrorAlert();
        this.loadingData = false;
      }
    });
  }

  // Alert methods
  showSuccessAlert(): void {
    const alertElement = document.getElementById('georesourceEditMetadataSuccessAlert');
    if (alertElement) {
      alertElement.hidden = false;
    }
  }

  showErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditMetadataErrorAlert');
    if (alertElement) {
      alertElement.hidden = false;
    }
  }

  showMetadataImportErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditMetadataImportErrorAlert');
    if (alertElement) {
      alertElement.hidden = false;
    }
  }

  hideSuccessAlert(): void {
    const alertElement = document.getElementById('georesourceEditMetadataSuccessAlert');
    if (alertElement) {
      alertElement.hidden = true;
    }
  }

  hideErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditMetadataErrorAlert');
    if (alertElement) {
      alertElement.hidden = true;
    }
  }

  hideMetadataErrorAlert(): void {
    const alertElement = document.getElementById('georesourceEditMetadataImportErrorAlert');
    if (alertElement) {
      alertElement.hidden = true;
    }
  }

  // Get filtered topics for georesource
  getMainTopicsForGeoresource(): any[] {
    console.log('getMainTopicsForGeoresource called');
    console.log('Available topics:', this.kommonitorDataExchangeService.availableTopics);
    
    if (this.kommonitorDataExchangeService.availableTopics) {
      // First, try the exact AngularJS filter
      let filtered = this.kommonitorDataExchangeService.availableTopics.filter((topic: any) => {
        return topic.topicType === 'main' && topic.topicResource === 'georesource';
      });
      
      console.log('Filtered by topicType and topicResource:', filtered);
      
      // If no results, try alternative filtering approaches
      if (filtered.length === 0) {
        // Try filtering by topicType only
        filtered = this.kommonitorDataExchangeService.availableTopics.filter((topic: any) => topic.topicType === 'main');
        console.log('Filtered by topicType only:', filtered);
        
        if (filtered.length === 0) {
          // If still no results, show all topics that have subTopics (likely main topics)
          filtered = this.kommonitorDataExchangeService.availableTopics.filter((topic: any) => topic.subTopics && Array.isArray(topic.subTopics));
          console.log('Filtered by subTopics:', filtered);
        }
      }
      
      console.log('Final filtered topics:', filtered);
      return filtered;
    }
    console.log('No available topics found');
    return [];
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

  // Icon picker methods (from add modal)
  
  /**
   * Initialize Bootstrap Icon Picker (based on AngularJS implementation)
   */
  private initializeIconPicker(): void {
    // Wait for the DOM to be ready and ensure jQuery and iconpicker are available
    const initIconPicker = () => {
      const element = document.getElementById('poiSymbolEditPicker');
      
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
        const existingIconPicker = (window as any).$('#poiSymbolEditPicker').data('bs.iconpicker');
        if (existingIconPicker) {
          (window as any).$('#poiSymbolEditPicker').iconpicker('setIcon', 'glyphicon-' + this.selectedPoiIconName);
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
        
        const iconPickerElement = (window as any).$('#poiSymbolEditPicker');
        iconPickerElement.iconpicker(iconPickerOptions);

        // Handle icon selection change (same logic as AngularJS)
        (window as any).$('#poiSymbolEditPicker').on('change', (e: any) => {
          // Extract icon name from full class (e.g., "glyphicon-home" -> "home")
          this.selectedPoiIconName = e.icon.substring(e.icon.indexOf('-') + 1);
          this.cdr.detectChanges();
        });

        // Set initial icon (like AngularJS version)
        (window as any).$('#poiSymbolEditPicker').iconpicker('setIcon', 'glyphicon-' + this.selectedPoiIconName);
          
      } catch (error) {
        // Handle error silently
      }
    };
    
    // Start initialization with a delay to ensure DOM is ready
    setTimeout(initIconPicker, 200);
  }

  onIconPickerClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if icon picker is initialized
    if ((window as any).$ && (window as any).$('#poiSymbolEditPicker').length > 0) {
      const iconPicker = (window as any).$('#poiSymbolEditPicker');
      
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
      this.createManualIconPicker();
    }
  }

  onDocumentClick(event: Event): void {
    // Close manual icon picker if clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.manual-icon-picker')) {
      this.closeManualIconPicker();
    }
  }

  /**
   * Create a manual icon picker as fallback
   */
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
    const button = document.getElementById('poiSymbolEditPicker');
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
          if ((window as any).$ && (window as any).$('#poiSymbolEditPicker').length > 0) {
            (window as any).$('#poiSymbolEditPicker').iconpicker('setIcon', 'glyphicon-' + iconName);
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

  /**
   * Update the icon picker button display
   */
  private updateIconPickerButtonDisplay(iconName: string): void {
    const button = document.getElementById('poiSymbolEditPicker');
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

  /**
   * Rebuild the icon picker button content completely
   */
  private rebuildIconPickerButton(iconName: string): void {
    const button = document.getElementById('poiSymbolEditPicker');
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

  /**
   * Close manual icon picker
   */
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

  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }
} 