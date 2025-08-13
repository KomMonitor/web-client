import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, HostListener } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { KommonitorIndicatorCacheHelperService } from 'services/adminIndicatorUnit/kommonitor-cache-helper.service';
import { NgForm } from '@angular/forms';

declare const $: any;
declare const __env: any;
declare const colorbrewer: any;

@Component({
  selector: 'indicator-edit-metadata-modal',
  templateUrl: './indicator-edit-metadata-modal.component.html',
  styleUrls: ['./indicator-edit-metadata-modal.component.css']
})
export class IndicatorEditMetadataModalComponent implements OnInit, OnDestroy {
  @ViewChild('modal') modal!: ElementRef;
  @ViewChild('indicatorEditMetadataForm') indicatorEditMetadataForm!: NgForm;
  @Input() currentIndicatorDataset: any = null;

  private subscriptions: Subscription[] = [];

  // Multi-step form properties
  currentStep = 1;
  totalSteps = 6;

  // Form data
  datasetName = '';
  datasetNameInvalid = false;
  indicatorAbbreviation = '';
  indicatorType: any = null;
  isHeadlineIndicator = false;
  indicatorUnit = '';
  enableFreeTextUnit = false;
  indicatorProcessDescription = '';
  indicatorTagsString_withCommas = '';
  indicatorInterpretation = '';
  indicatorCreationType: any = null;
  indicatorLowestSpatialUnitMetadataObjectForComputation: any = null;
  enableLowestSpatialUnitSelect = false;
  indicatorPrecision: number | null = null;
  showCustomCommaValue = false;
  indicatorReferenceDateNote = '';
  displayOrder = 0;
  indicatorCharacteristicValue = '';

  // Metadata
  metadata: any = {
    note: '',
    literature: '',
    updateInterval: null,
    sridEPSG: 4326,
    datasource: '',
    contact: '',
    lastUpdate: '',
    description: '',
    databasis: ''
  };

  // Topic hierarchy
  indicatorTopic_mainTopic: any = null;
  indicatorTopic_subTopic: any = null;
  indicatorTopic_subsubTopic: any = null;
  indicatorTopic_subsubsubTopic: any = null;

  // References
  indicatorNameFilter = '';
  tmpIndicatorReference_selectedIndicatorMetadata: any = null;
  tmpIndicatorReference_referenceDescription = '';
  indicatorReferences_adminView: any[] = [];
  indicatorReferences_apiRequest: any[] = [];

  georesourceNameFilter = '';
  tmpGeoresourceReference_selectedGeoresourceMetadata: any = null;
  tmpGeoresourceReference_referenceDescription = '';
  georesourceReferences_adminView: any[] = [];
  georesourceReferences_apiRequest: any[] = [];

  // Step 4: Filtered lists for references (like add modal)
  // Remove these - we'll use service properties directly like AngularJS
  // filteredIndicators: any[] = [];
  // filteredGeoresources: any[] = [];

  // Step 4: Collapsible Box Properties (like add modal)
  isIndicatorReferencesCollapsed = true;
  isGeoresourceReferencesCollapsed = true;

  // Classification
  numClassesArray = [3, 4, 5, 6, 7, 8];
  selectedColorBrewerPaletteEntry: any = null;
  numClassesPerSpatialUnit: number | null = null;
  classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
  spatialUnitClassification: any[] = [];
  classBreaksInvalid = false;
  tabClasses: string[] = [];
  
  // Additional classification variables (missing from original)
  classificationMethodOptions: any[] = [];
  defaultClassificationMethod = (__env?.defaultClassifyMethod || 'jenks');
  enableManualClassification = false;
  enableRegionalClassification = false;
  


  // Regional reference values
  regionalReferenceValuesManagementTableOptions: any = undefined;
  tmpIndicatorRegionalReferenceValuesObject: any = undefined;
  noneColumnValue = '-- keine --';
  file_regionalReferenceValuesImport: File | null = null;
  isDragOver: boolean = false;
  csvProcessingStatus: { type: 'success' | 'error' | 'info', message: string } | null = null;

  // Messages - standardized to match spatial units pattern
  successMessage = '';
  errorMessage = '';
  successMessagePart = '';
  errorMessagePart = '';
  indicatorMetadataImportError = '';
  indicatorAddMetadataImportErrorAlert = false;

  // Loading state - standardized to match spatial units pattern
  loadingData = false;

  // Color brewer
  colorbrewerSchemes = colorbrewer || {};
  colorbreweSchemeName_dynamicIncrease = __env?.defaultColorBrewerPaletteForBalanceIncreasingValues || 'Blues';
  colorbreweSchemeName_dynamicDecrease = __env?.defaultColorBrewerPaletteForBalanceDecreasingValues || 'Reds';
  colorbrewerPalettes: any[] = [];
  
  // Classification properties
  decreaseBreaksLength: number = 0;
  increaseBreaksLength: number = 0;
  
  // Enhanced classification properties (like add modal)
  enableDynamicColorAssignment = false;
  currentClassificationTab: number = 0;
  classificationValidationErrors: string[] = [];
  enableColorValidation: boolean = false;
  dynamicColorAssignmentEnabled = false;
  negativeValueColorScheme = 'Reds';
  positiveValueColorScheme = 'Blues';
  zeroValueColor = '#bababa';
  classificationBreakValidationEnabled: boolean = true;

  // Available options - these were missing!
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  indicatorTypeOptions: any[] = [];
  indicatorCreationTypeOptions: any[] = [];
  indicatorUnitOptions: any[] = [];
  availableTopics: any[] = [];
  availableIndicators: any[] = [];
  availableGeoresources: any[] = [];

  // Metadata structure
  indicatorMetadataStructure: any = {
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
    "precision": "Custom decimal place",
    "refrencesToOtherIndicators": [
      {
        "referenceDescription": "description about the reference",
        "indicatorId": "ID of referenced indicator dataset"
      }
    ],
    "refrencesToGeoresources": [
      {
        "referenceDescription": "description about the reference",
        "georesourceId": "ID of referenced georesource dataset"
      }
    ],
    "datasetName": "Name of indicator dataset",
    "abbreviation": "optional abbreviation of the indicator dataset",
    "characteristicValue": "if the same datasetName is used for different indicators, the optional characteristicValue parameter may serve to distinguish between them (i.e. Habitants - male, Habitants - female, Habitants - diverse)",
    "tags": [
      "optinal list of tags; each tag is a free text tag"
    ],
    "creationType": "INSERTION|COMPUTATION  <-- enum parameter controls whether each timestamp must be updated manually (INSERTION) or if KomMonitor shall compute the indicator values for respective timestamps based on script file (COMPUTATION)",
    "unit": "unit of the indicator",
    "topicReference": "ID of the respective main/sub topic instance",
    "indicatorType": "STATUS_ABSOLUTE|STATUS_RELATIVE|DYNAMIC_ABSOLUTE|DYNAMIC_RELATIVE|STATUS_STANDARDIZED|DYNAMIC_STANDARDIZED",
    "interpretation": "interpretation hints for the user to better understand the indicator values",
    "isHeadlineIndicator": "boolean parameter to indicate if indicator is a headline indicator",
    "processDescription": "detailed description about the computation/creation of the indicator",
    "lowestSpatialUnitForComputation": "the name of the lowest possible spatial unit for which an indicator of creationType=COMPUTATION may be computed. All other superior spatial units will be aggregated automatically",
    "referenceDateNote": "optional note for indicator reference date",
    "displayOrder": 0,
    "defaultClassificationMapping": {
      "colorBrewerSchemeName": "schema name of colorBrewer colorPalette to use for classification",
      "numClasses": "number of Classes",
      "classificationMethod": "Classification Method ID",
      "items": [
        {
          "spatialUnit": "spatial unit id for manual classification",
          "breaks": ['break']
        }
      ]
    },
    "regionalReferenceValues": [
      {
        "referenceDate": "2024-04-23",
        "regionalSum": 0,
        "regionalAverage": 0,
        "spatiallyUnassignable": 0
      }
    ],
  };

  indicatorMetadataStructure_pretty = '';

  // Color palette management
  isColorPaletteOpen: boolean = false;

  // File handling properties
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private kommonitorCacheHelperService: KommonitorIndicatorCacheHelperService,
    private kommonitorDataGridHelperService: KommonitorIndicatorDataGridHelperService,
    private broadcastService: BroadcastService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('IndicatorEditMetadataModalComponent ngOnInit started');
    console.log('currentIndicatorDataset:', this.currentIndicatorDataset);
    
    this.setupEventListeners();
    this.loadEnvironmentConfiguration(); // Load environment config first
    await this.loadInitialData();
    this.instantiateColorBrewerPalettes();
    this.indicatorMetadataStructure_pretty = this.kommonitorDataExchangeService.syntaxHighlightJSON(this.indicatorMetadataStructure);
    
    // Initialize classification with default values
    this.onNumClassesChanged(5);
    
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
    // If currentIndicatorDataset is already set (from parent component), initialize form
    if (this.currentIndicatorDataset) {
      console.log('Initializing form with existing dataset');
      this.resetIndicatorEditMetadataForm();
      // Initialize regional reference values table
      this.initializeRegionalReferenceValuesTable();
    } else {
      console.log('No currentIndicatorDataset available, form will be initialized later');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Multi-step form navigation methods
  nextStep(): void {
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
    if (this.currentStep < this.totalSteps && this.isCurrentStepValid()) {
      this.currentStep++;
      this.updateProgressBar();
    }
  }

  previousStep(): void {
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressBar();
    }
  }

  goToStep(step: number): void {
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
    if (step >= 1 && step <= this.totalSteps) {
      // Allow navigation to any step for better user experience
      this.currentStep = step;
      this.updateProgressBar();
      
      // Initialize filtered lists when navigating to Step 4 (like add modal)
      if (step === 4) {
        console.log('=== Navigating to Step 4 ===');
        console.log('Before - availableIndicators:', this.availableIndicators?.length || 0);
        console.log('Before - availableGeoresources:', this.availableGeoresources?.length || 0);
        
        // Always refresh local properties from service to ensure they're up-to-date
        this.refreshLocalPropertiesFromService();
        
        console.log('After refresh - availableIndicators:', this.availableIndicators?.length || 0);
        console.log('After refresh - availableGeoresources:', this.availableGeoresources?.length || 0);
        
        // Expand the collapsible boxes by default for better UX
        this.isIndicatorReferencesCollapsed = false;
        this.isGeoresourceReferencesCollapsed = false;
      }
      
      // Show validation feedback if navigating to a step that requires validation
      if (step > 1 && !this.isStepValid(step)) {
        // Step requires validation
      }
    }
  }

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
        // Step 5 validation depends on indicator type
        if (this.indicatorType?.apiName?.includes('STATUS')) {
          return !!this.selectedColorBrewerPaletteEntry && !!this.numClassesPerSpatialUnit;
        }
        return !!this.numClassesPerSpatialUnit;
      case 6:
        // Step 6 is informational
        return true;
      default:
        return true;
    }
  }

  updateProgressBar(): void {
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
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
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
    return this.currentStep === step;
  }

  isStepCompleted(step: number): boolean {
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
    return this.currentStep > step;
  }

  isCurrentStepValid(): boolean {
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
    return this.isStepValid(this.currentStep);
  }

  private setupEventListeners(): void {
    // Listen for broadcast messages if needed
    const sub = this.broadcastService.currentBroadcastMsg.subscribe(data => {
      if (data.msg === 'refreshIndicatorOverviewTableCompleted') {
        if (this.currentIndicatorDataset) {
          this.currentIndicatorDataset = this.kommonitorDataExchangeService.getIndicatorMetadataById(this.currentIndicatorDataset.indicatorId);
        }
      }
    });
    this.subscriptions.push(sub);

    // Setup Bootstrap accordion functionality
    setTimeout(() => {
      ($('[data-widget="collapse"]') as any).on('click', function(this: any) {
        const icon = $(this).find('i');
        if (icon.hasClass('fa-plus')) {
          icon.removeClass('fa-plus').addClass('fa-minus');
        } else {
          icon.removeClass('fa-minus').addClass('fa-plus');
        }
      });
    }, 100);

    // Setup Bootstrap dropdown functionality
    setTimeout(() => {
      ($('[data-toggle="dropdown"]') as any).on('click', function(this: any, e: any) {
        e.preventDefault();
        const dropdown = $(this).next('.dropdown-menu');
        dropdown.toggleClass('show');
      });

      // Close dropdown when clicking outside
      $(document).on('click', function(e: any) {
        if (!$(e.target).closest('.dropdown').length) {
          $('.dropdown-menu').removeClass('show');
        }
      });
    }, 100);
  }

  private async loadInitialData(): Promise<void> {
    // Load available spatial units
    if (this.kommonitorDataExchangeService.availableSpatialUnits) {
      this.availableSpatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits;
    }

    // Load update interval options
    if (this.kommonitorDataExchangeService.updateIntervalOptions) {
      this.updateIntervalOptions = this.kommonitorDataExchangeService.updateIntervalOptions;
    }

    // Load indicator type options
    if (this.kommonitorDataExchangeService.indicatorTypeOptions) {
      this.indicatorTypeOptions = this.kommonitorDataExchangeService.indicatorTypeOptions;
    }

    // Load indicator creation type options
    if (this.kommonitorDataExchangeService.indicatorCreationTypeOptions) {
      this.indicatorCreationTypeOptions = this.kommonitorDataExchangeService.indicatorCreationTypeOptions;
      console.log('Available creation type options:', this.indicatorCreationTypeOptions);
    }

    // Load indicator unit options
    if (this.kommonitorDataExchangeService.indicatorUnitOptions) {
      this.indicatorUnitOptions = this.kommonitorDataExchangeService.indicatorUnitOptions;
    }

    // Load available topics
    if (this.kommonitorDataExchangeService.availableTopics) {
      this.availableTopics = this.kommonitorDataExchangeService.availableTopics;
    }

    // Load available indicators (like add modal)
    this.availableIndicators = this.kommonitorDataExchangeService.availableIndicators || [];

    // Load available georesources (like add modal)
    this.availableGeoresources = this.kommonitorDataExchangeService.availableGeoresources || [];

    // Initialize available lists for Step 4 (like AngularJS)

    // Load indicators if not already loaded (do not gate by roles length)
    if (!this.kommonitorDataExchangeService.availableIndicators || 
        this.kommonitorDataExchangeService.availableIndicators.length === 0) {
      try {
        await this.kommonitorDataExchangeService.fetchIndicatorsMetadata(
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles || []
        );
        // Update local properties after fetching (like AngularJS)
        this.availableIndicators = this.kommonitorDataExchangeService.availableIndicators || [];
      } catch (error) {
        console.error('Error loading indicators:', error);
      }
    }

    // Load georesources if not already loaded (do not gate by roles length)
    if (!this.kommonitorDataExchangeService.availableGeoresources || 
        this.kommonitorDataExchangeService.availableGeoresources.length === 0) {
      try {
        await this.kommonitorDataExchangeService.fetchGeoresourcesMetadata(
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles || []
        );
        // Update local properties after fetching (like AngularJS)
        this.availableGeoresources = this.kommonitorDataExchangeService.availableGeoresources || [];
      } catch (error) {
        console.error('Error loading georesources:', error);
      }
    }
  }

  // Remove openModal method - no longer needed

  closeModal(): void {
    this.activeModal.dismiss();
  }

  instantiateColorBrewerPalettes(): void {
    const customColorSchemes = __env?.customColorSchemes;
    let colorbrewerExtended = colorbrewer;

    // Add custom color themes from configuration properties
    if (customColorSchemes) {
      colorbrewerExtended = Object.assign(customColorSchemes, colorbrewer);
    }

    // Check if colorbrewer is available
    if (!colorbrewer || typeof colorbrewer !== 'object') {
      // Create fallback color palettes
      this.createFallbackColorPalettes();
      return;
    }

    for (const key in colorbrewerExtended) {
      if (colorbrewerExtended.hasOwnProperty(key)) {
        const colorPalettes = colorbrewerExtended[key];
        
        const paletteEntry = {
          "paletteName": key,
          "paletteArrayObject": colorPalettes
        };

        this.colorbrewerPalettes.push(paletteEntry);
      }
    }

    // instantiate with palette 'Blues'
    if (this.colorbrewerPalettes.length > 13) {
      this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes[13];
    } else if (this.colorbrewerPalettes.length > 0) {
      this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes[0];
    }
  }

  // Create fallback color palettes when colorbrewer library is not available
  private createFallbackColorPalettes(): void {
    const fallbackPalettes = {
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
    
    // Convert fallback palettes to the expected format
    for (const key in fallbackPalettes) {
      if (fallbackPalettes.hasOwnProperty(key)) {
        const colorPalettes = fallbackPalettes[key];
        
        const paletteEntry = {
          "paletteName": key,
          "paletteArrayObject": colorPalettes
        };

        this.colorbrewerPalettes.push(paletteEntry);
      }
    }
    
    // Also update the colorbrewerSchemes for dynamic color assignment
    this.colorbrewerSchemes = fallbackPalettes;
    
    // Set default palette
    if (this.colorbrewerPalettes.length > 0) {
      this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes[0];
    }
  }

  // Load environment configuration (like add modal)
  private loadEnvironmentConfiguration() {
    // Load default classification method from environment
    this.defaultClassificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    this.classificationMethod = this.defaultClassificationMethod;
    
    // Load color scheme names from environment
    this.colorbreweSchemeName_dynamicIncrease = __env?.defaultColorBrewerPaletteForBalanceIncreasingValues || 'Blues';
    this.colorbreweSchemeName_dynamicDecrease = __env?.defaultColorBrewerPaletteForBalanceDecreasingValues || 'Reds';
    
    // Load classification method options
    this.classificationMethodOptions = [
      { 
        id: 'jenks', 
        name: 'Jenks Natural Breaks', 
        description: 'Automatische Klassifizierung nach natürlichen Brüchen',
        imgPath: 'icons/classificationMethods/neu/jenks.svg'
      },
      { 
        id: 'equal', 
        name: 'Gleiche Intervalle', 
        description: 'Gleichmäßige Aufteilung des Wertebereichs',
        imgPath: 'icons/classificationMethods/neu/gleichesIntervall.svg'
      },
      { 
        id: 'manual', 
        name: 'Manuelle Klassifizierung', 
        description: 'Benutzerdefinierte Klassengrenzen',
        imgPath: 'icons/classificationMethods/neu/manual.svg'
      },
      { 
        id: 'regional_default', 
        name: 'Regionale Standard-Klassifizierung', 
        description: 'Regionsspezifische Klassengrenzen',
        imgPath: 'icons/classificationMethods/neu/regional.svg'
      }
    ];
    
    // Check if manual classification is disabled
    if (__env?.disableManualClassification) {
      this.classificationMethodOptions = this.classificationMethodOptions.filter(option => option.id !== 'manual');
    }
  }

  // Enhanced classification method selection (like add modal)
  onClassificationMethodSelected(method: any) {
    // Handle both method objects and method IDs
    const methodId = typeof method === 'string' ? method : method.id;
    this.classificationMethod = methodId;
    
    // Enable/disable specific features based on method
    this.enableManualClassification = methodId === 'manual';
    this.enableRegionalClassification = methodId === 'regional_default';
    
    // Reset validation errors
    this.classificationValidationErrors = [];
    this.classBreaksInvalid = false;
    
    // Reinitialize classification when method changes
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
    
    // Update dynamic color assignment based on method
    this.updateDynamicColorAssignment();
  }

  onNumClassesChanged(numClasses: any): void {
    // Handle both event parameters and direct values
    let classes: number | null;
    
    if (typeof numClasses === 'object' && numClasses !== null && numClasses.target) {
      classes = parseInt(numClasses.target.value) || null;
    } else {
      classes = numClasses;
    }
    
    if (classes === null || classes === undefined || classes < 1) {
      return; // Don't process if null, undefined, or less than 1
    }
    
    this.numClassesPerSpatialUnit = classes;
    this.spatialUnitClassification = [];
    this.tabClasses = [];
    
    if (this.availableSpatialUnits && this.availableSpatialUnits.length > 0) {
      this.availableSpatialUnits.forEach((spatialUnit, index) => {
        // Initialize breaks array
        const breaks: Array<number | null> = [];
        for (let i = 0; i < classes! - 1; i++) {
          breaks.push(null);
        }
        
        this.spatialUnitClassification.push({
          spatialUnitId: spatialUnit.spatialUnitId,
          spatialUnitLevel: spatialUnit.spatialUnitLevel,
          breaks: breaks
        });
        
        // Initialize tab class - first tab is active
        this.tabClasses[index] = index === 0 ? 'active' : '';
      });
    }
    
    // Reset validation
    this.classBreaksInvalid = false;
    this.classificationValidationErrors = [];
    
    // Set first tab as active
    this.currentClassificationTab = 0;
    
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
  }

  onBreaksChanged(tabIndex: number): void {
    if (!this.spatialUnitClassification[tabIndex]) {
      return;
    }
    
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
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

  // Enhanced classification methods (like add modal)
  goToClassificationTab(tabIndex: number) {
    this.currentClassificationTab = tabIndex;
    
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
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

  // Update dynamic color assignment based on classification method
  private updateDynamicColorAssignment() {
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
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
      if (this.selectedColorBrewerPaletteEntry?.paletteArrayObject) {
        const colors = this.selectedColorBrewerPaletteEntry.paletteArrayObject[this.numClassesPerSpatialUnit?.toString() || '5'];
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

  // Helper method to get color palette colors safely
  getColorPaletteColors(paletteEntry: any, numColors: number): string[] {
    if (!paletteEntry?.paletteArrayObject) {
      return ['#cccccc', '#cccccc', '#cccccc', '#cccccc', '#cccccc'];
    }
    
    const colors = paletteEntry.paletteArrayObject[numColors?.toString() || '5'];
    if (!colors || !Array.isArray(colors)) {
      return ['#cccccc', '#cccccc', '#cccccc', '#cccccc', '#cccccc'];
    }
    
    return colors;
  }

  // Helper method to get color scheme colors safely
  getColorSchemeColors(schemeName: string, numColors: number): string[] {
    if (!this.colorbrewerSchemes?.[schemeName]) {
      return ['#cccccc', '#cccccc', '#cccccc', '#cccccc', '#cccccc'];
    }
    
    const colors = this.colorbrewerSchemes[schemeName][numColors?.toString() || '5'];
    if (!colors || !Array.isArray(colors)) {
      return ['#cccccc', '#cccccc', '#cccccc', '#cccccc', '#cccccc'];
    }
    
    return colors;
  }

  // Reload color palettes (like add modal)
  reloadColorPalettes() {
    this.colorbrewerPalettes = [];
    this.instantiateColorBrewerPalettes();
  }

  // Get dynamic color for classification (like add modal)
  getDynamicColor(schemeName: string, breakLength: number, index: number, type: 'increase' | 'decrease'): string {
    if (!this.colorbrewerSchemes?.[schemeName]) {
      return '#cccccc';
    }
    
    const colors = this.colorbrewerSchemes[schemeName];
    if (!colors?.[breakLength + 1]) {
      return '#cccccc';
    }
    
    const colorArray = colors[breakLength + 1];
    if (type === 'decrease') {
      const colorIndex = Math.max(0, breakLength - index - 1);
      return colorArray[colorIndex] || '#cccccc';
    } else {
      const colorIndex = Math.max(0, breakLength - (this.spatialUnitClassification[this.currentClassificationTab]?.breaks?.length - index) - 1);
      return colorArray[colorIndex] || '#cccccc';
    }
  }

  updateDecreaseAndIncreaseBreaks(tabIndex: number): void {
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
  }

  refreshReferenceValuesManagementTable(): void {
    this.regionalReferenceValuesManagementTableOptions = this.kommonitorDataGridHelperService.buildReferenceValuesManagementGrid(
      this.regionalReferenceValuesManagementTableOptions
    );
  }

  resetIndicatorEditMetadataForm(): void {
    if (!this.currentIndicatorDataset) {
      return;
    }
    
    this.successMessage = '';
    this.errorMessage = '';
    this.successMessagePart = '';
    this.errorMessagePart = '';

    // Basic form data with null checks
    this.datasetName = this.currentIndicatorDataset.indicatorName || '';
    this.datasetNameInvalid = false;

    this.indicatorReferenceDateNote = this.currentIndicatorDataset.referenceDateNote || '';
    this.displayOrder = this.currentIndicatorDataset.displayOrder || 0;

    // Reset metadata with null checks
    const metadata = this.currentIndicatorDataset.metadata || {};
    this.metadata = {
      note: metadata.note || '',
      literature: metadata.literature || '',
      sridEPSG: 4326,
      datasource: metadata.datasource || '',
      databasis: metadata.databasis || '',
      contact: metadata.contact || '',
      description: metadata.description || '',
      lastUpdate: metadata.lastUpdate || ''
    };

    // Set update interval
    this.kommonitorDataExchangeService.updateIntervalOptions.forEach((option: any) => {
      if (option.apiName === this.currentIndicatorDataset.metadata.updateInterval) {
        this.metadata.updateInterval = option;
      }
    });

    this.refreshReferenceValuesManagementTable();

    this.indicatorAbbreviation = this.currentIndicatorDataset.abbreviation || '';
    this.indicatorPrecision = this.currentIndicatorDataset.precision || null;

    if (this.currentIndicatorDataset.defaultPrecision === false) {
      this.showCustomCommaValue = true;
    } else {
      this.showCustomCommaValue = false;
    }

    // Set indicator type
    this.indicatorType = null;
    console.log('Setting indicator type...');
    console.log('Current dataset indicatorType:', this.currentIndicatorDataset.indicatorType);
    console.log('Available indicator type options:', this.kommonitorDataExchangeService.indicatorTypeOptions);
    
    if (this.currentIndicatorDataset.indicatorType) {
      this.kommonitorDataExchangeService.indicatorTypeOptions.forEach((option: any) => {
        if (option.apiName === this.currentIndicatorDataset.indicatorType) {
          this.indicatorType = option;
          console.log('Found matching indicator type:', this.indicatorType);
        }
      });
    }
    
    console.log('Final indicatorType:', this.indicatorType);
    console.log('indicatorType.apiName:', this.indicatorType?.apiName);
    console.log('includes STATUS:', this.indicatorType?.apiName?.includes('STATUS'));

    this.isHeadlineIndicator = this.currentIndicatorDataset.isHeadlineIndicator || false;
    this.indicatorUnit = this.currentIndicatorDataset.unit || '';

    this.enableFreeTextUnit = true;
    this.kommonitorDataExchangeService.indicatorUnitOptions.forEach((option: any) => {
      if (option === this.currentIndicatorDataset.unit) {
        this.enableFreeTextUnit = false;
      }
    });

    this.indicatorProcessDescription = this.currentIndicatorDataset.processDescription || '';
    this.indicatorTagsString_withCommas = '';

    if (this.currentIndicatorDataset.tags && this.currentIndicatorDataset.tags.length > 0) {
      for (let index = 0; index < this.currentIndicatorDataset.tags.length; index++) {
        this.indicatorTagsString_withCommas += this.currentIndicatorDataset.tags[index];
        if (index < this.currentIndicatorDataset.tags.length - 1) {
          this.indicatorTagsString_withCommas += ',';
        }
      }
    } else {
      this.indicatorTagsString_withCommas = '';
    }

    this.indicatorInterpretation = this.currentIndicatorDataset.interpretation || '';

    // Set creation type
    this.indicatorCreationType = null;
    if (this.currentIndicatorDataset.creationType) {
      this.kommonitorDataExchangeService.indicatorCreationTypeOptions.forEach((option: any) => {
        if (option.apiName === this.currentIndicatorDataset.creationType) {
          this.indicatorCreationType = option;
        }
      });
    }
    
    // Fallback: if no creation type is set, use INSERTION as default
    if (!this.indicatorCreationType && this.kommonitorDataExchangeService.indicatorCreationTypeOptions && this.kommonitorDataExchangeService.indicatorCreationTypeOptions.length > 0) {
      // Check what structure the service is returning
      const firstOption = this.kommonitorDataExchangeService.indicatorCreationTypeOptions[0];
      console.log('Service returned creation type option:', firstOption);
      
      if (firstOption.apiName) {
        // Service has correct structure, find INSERTION
        const insertionOption = this.kommonitorDataExchangeService.indicatorCreationTypeOptions.find(option => option.apiName === 'INSERTION');
        if (insertionOption) {
          this.indicatorCreationType = insertionOption;
          console.log('Fallback: Set default creation type to INSERTION:', this.indicatorCreationType);
        } else {
          this.indicatorCreationType = firstOption;
          console.log('Fallback: Set default creation type to first option:', this.indicatorCreationType);
        }
      } else if (firstOption.value === 'manual') {
        // Service has different structure, convert to expected format
        this.indicatorCreationType = {
          displayName: firstOption.label || 'Manuell',
          apiName: 'INSERTION'
        };
        console.log('Fallback: Converted structure and set default creation type to INSERTION:', this.indicatorCreationType);
      } else {
        // Unknown structure, create safe fallback
        this.indicatorCreationType = {
          displayName: 'Manuell',
          apiName: 'INSERTION'
        };
        console.log('Fallback: Created safe default creation type:', this.indicatorCreationType);
      }
    }

    this.indicatorLowestSpatialUnitMetadataObjectForComputation = null;

    for (let i = 0; i < this.kommonitorDataExchangeService.availableSpatialUnits.length; i++) {
      const spatialUnitMetadata = this.kommonitorDataExchangeService.availableSpatialUnits[i];
      if (spatialUnitMetadata.spatialUnitLevel === this.currentIndicatorDataset.lowestSpatialUnitForComputation) {
        this.indicatorLowestSpatialUnitMetadataObjectForComputation = spatialUnitMetadata;
        break;
      }
    }

    if (this.indicatorCreationType?.apiName === 'COMPUTATION') {
      this.enableLowestSpatialUnitSelect = true;
    } else {
      this.enableLowestSpatialUnitSelect = false;
    }

    // Set topic hierarchy
    const topicHierarchy = this.kommonitorDataExchangeService.getTopicHierarchyForTopicId(this.currentIndicatorDataset.topicReference);

    if (topicHierarchy && topicHierarchy[0]) {
      this.indicatorTopic_mainTopic = topicHierarchy[0];
    }
    if (topicHierarchy && topicHierarchy[1]) {
      this.indicatorTopic_subTopic = topicHierarchy[1];
    }
    if (topicHierarchy && topicHierarchy[2]) {
      this.indicatorTopic_subsubTopic = topicHierarchy[2];
    }
    if (topicHierarchy && topicHierarchy[3]) {
      this.indicatorTopic_subsubsubTopic = topicHierarchy[3];
    }

    // Reset references
    this.indicatorNameFilter = '';
    this.tmpIndicatorReference_selectedIndicatorMetadata = null;
    this.tmpIndicatorReference_referenceDescription = '';
    this.indicatorReferences_adminView = [];
    this.indicatorReferences_apiRequest = [];

    if (this.currentIndicatorDataset.referencedIndicators && this.currentIndicatorDataset.referencedIndicators.length > 0) {
      for (const indicatorReference of this.currentIndicatorDataset.referencedIndicators.filter((item: any) => item != null && item != undefined)) {
        const indicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorReference.referencedIndicatorId);
        if (indicatorMetadata) {
          const referenceEntry = {
            "referencedIndicatorName": indicatorMetadata.indicatorName,
            "referencedIndicatorId": indicatorMetadata.indicatorId,
            "referencedIndicatorAbbreviation": indicatorMetadata.abbreviation,
            "referencedIndicatorDescription": indicatorReference.referencedIndicatorDescription
          };
          this.indicatorReferences_adminView.push(referenceEntry);
        }
      }
    }

    this.georesourceNameFilter = '';
    this.tmpGeoresourceReference_selectedGeoresourceMetadata = null;
    this.tmpGeoresourceReference_referenceDescription = '';
    this.georesourceReferences_adminView = [];
    this.georesourceReferences_apiRequest = [];

    if (this.currentIndicatorDataset.referencedGeoresources && this.currentIndicatorDataset.referencedGeoresources.length > 0) {
      for (const georesourceReference of this.currentIndicatorDataset.referencedGeoresources) {
        const georesourceMetadata = this.kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceReference.referencedGeoresourceId);
        if (georesourceMetadata) {
          const geo_referenceEntry = {
            "referencedGeoresourceName": georesourceMetadata.datasetName || georesourceMetadata.georesourceName,
            "referencedGeoresourceId": georesourceMetadata.georesourceId,
            "referencedGeoresourceDescription": georesourceReference.referencedGeoresourceDescription
          };
          this.georesourceReferences_adminView.push(geo_referenceEntry);
        }
      }
    }

    // Initialize available lists for Step 4 (like AngularJS)

    // Reset classification
    this.numClassesArray = [3, 4, 5, 6, 7, 8];
    this.numClassesPerSpatialUnit = null;
    this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    this.spatialUnitClassification = [];
    this.classBreaksInvalid = false;

    if (this.currentIndicatorDataset.defaultClassificationMapping && this.currentIndicatorDataset.defaultClassificationMapping.classificationMethod) {
      this.classificationMethod = this.currentIndicatorDataset.defaultClassificationMapping.classificationMethod.toLowerCase();
    }
    if (this.currentIndicatorDataset.defaultClassificationMapping && this.currentIndicatorDataset.defaultClassificationMapping.numClasses) {
      this.numClassesPerSpatialUnit = this.currentIndicatorDataset.defaultClassificationMapping.numClasses;
      this.onNumClassesChanged(this.numClassesPerSpatialUnit || 5);
      
      // apply breaks for spatial units:
      if (this.currentIndicatorDataset.defaultClassificationMapping.items) {
        for (let i = 0; i < this.spatialUnitClassification.length; i++) {
          for (let item of this.currentIndicatorDataset.defaultClassificationMapping.items) {
            if (item.spatialUnitId == this.spatialUnitClassification[i].spatialUnitId) {
              this.spatialUnitClassification[i] = item;
              this.onBreaksChanged(i);
            }
          }
        }
      }
    } else {
      // Fallback: initialize with default values if no classification mapping exists
      this.numClassesPerSpatialUnit = 5;
      this.onNumClassesChanged(5);
    }
    
    // instantiate with palette 'Blues'
    this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes[13];

    if (this.currentIndicatorDataset.defaultClassificationMapping && this.currentIndicatorDataset.defaultClassificationMapping.colorBrewerSchemeName) {
      for (const colorbrewerPalette of this.colorbrewerPalettes) {
        if (colorbrewerPalette.paletteName === this.currentIndicatorDataset.defaultClassificationMapping.colorBrewerSchemeName) {
          this.selectedColorBrewerPaletteEntry = colorbrewerPalette;
          break;
        }
      }
    }

    this.successMessage = '';
    this.errorMessage = '';
    this.successMessagePart = '';
    this.errorMessagePart = '';
  }

  checkDatasetName(): void {
    this.datasetNameInvalid = false;
    this.kommonitorDataExchangeService.availableIndicators.forEach((indicator: any) => {
      // show error only if indicator is renamed to another already existing indicator
      if (indicator.indicatorName === this.datasetName && 
          indicator.indicatorType === this.indicatorType?.apiName && 
          indicator.indicatorId != this.currentIndicatorDataset.indicatorId) {
        this.datasetNameInvalid = true;
        return;
      }
    });
  }

  onClickColorBrewerEntry(colorPaletteEntry: any): void {
    this.selectedColorBrewerPaletteEntry = colorPaletteEntry;
    this.isColorPaletteOpen = false;
    
    // Update dynamic color assignment
    this.updateDynamicColorAssignment();
  }

  toggleColorPalette(): void {
    this.isColorPaletteOpen = !this.isColorPaletteOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close color palette dropdown if clicking outside
    if (this.isColorPaletteOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown')) {
        this.isColorPaletteOpen = false;
      }
    }
  }

  onAddOrUpdateIndicatorReference(): void {
    if (!this.tmpIndicatorReference_selectedIndicatorMetadata) {
      return;
    }
    
    const tmpIndicatorReference_adminView = {
      "referencedIndicatorName": this.tmpIndicatorReference_selectedIndicatorMetadata.indicatorName,
      "referencedIndicatorId": this.tmpIndicatorReference_selectedIndicatorMetadata.indicatorId,
      "referencedIndicatorAbbreviation": this.tmpIndicatorReference_selectedIndicatorMetadata.abbreviation,
      "referencedIndicatorDescription": this.tmpIndicatorReference_referenceDescription
    };

    let processed = false;

    for (let index = 0; index < this.indicatorReferences_adminView.length; index++) {
      const indicatorReference_adminView = this.indicatorReferences_adminView[index];
      
      if (indicatorReference_adminView.referencedIndicatorId === tmpIndicatorReference_adminView.referencedIndicatorId) {
        // replace object
        this.indicatorReferences_adminView[index] = tmpIndicatorReference_adminView;
        processed = true;
        break;
      }
    }

    if (!processed) {
      // new entry
      this.indicatorReferences_adminView.push(tmpIndicatorReference_adminView);
    }

    this.tmpIndicatorReference_selectedIndicatorMetadata = null;
    this.tmpIndicatorReference_referenceDescription = '';

    // Force change detection like AngularJS $scope.$digest()
    this.checkButtonState();
  }

  onClickEditIndicatorReference(indicatorReference_adminView: any): void {
    const indicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorReference_adminView.referencedIndicatorId);
    if (indicatorMetadata) {
      this.tmpIndicatorReference_selectedIndicatorMetadata = indicatorMetadata;
      this.tmpIndicatorReference_referenceDescription = indicatorReference_adminView.referencedIndicatorDescription;
      
      // Force change detection like AngularJS $scope.$digest()
      this.checkButtonState();
    }
  }

  onClickDeleteIndicatorReference(indicatorReference_adminView: any): void {
    for (let index = 0; index < this.indicatorReferences_adminView.length; index++) {
      if (this.indicatorReferences_adminView[index].referencedIndicatorId === indicatorReference_adminView.referencedIndicatorId) {
        // remove object
        this.indicatorReferences_adminView.splice(index, 1);
        break;
      }
    }
    
    // Force change detection like AngularJS $scope.$digest()
    this.checkButtonState();
  }

  onAddOrUpdateGeoresourceReference(): void {
    if (!this.tmpGeoresourceReference_selectedGeoresourceMetadata) {
      return;
    }
    
    const tmpGeoresourceReference_adminView = {
      "referencedGeoresourceName": this.tmpGeoresourceReference_selectedGeoresourceMetadata.datasetName || this.tmpGeoresourceReference_selectedGeoresourceMetadata.georesourceName,
      "referencedGeoresourceId": this.tmpGeoresourceReference_selectedGeoresourceMetadata.georesourceId,
      "referencedGeoresourceDescription": this.tmpGeoresourceReference_referenceDescription
    };

    let processed = false;

    for (let index = 0; index < this.georesourceReferences_adminView.length; index++) {
      const georesourceReference_adminView = this.georesourceReferences_adminView[index];
      
      if (georesourceReference_adminView.referencedGeoresourceId === tmpGeoresourceReference_adminView.referencedGeoresourceId) {
        // replace object
        this.georesourceReferences_adminView[index] = tmpGeoresourceReference_adminView;
        processed = true;
        break;
      }
    }

    if (!processed) {
      // new entry
      this.georesourceReferences_adminView.push(tmpGeoresourceReference_adminView);
    }

    this.tmpGeoresourceReference_selectedGeoresourceMetadata = null;
    this.tmpGeoresourceReference_referenceDescription = '';

    // Force change detection like AngularJS $scope.$digest()
    this.checkButtonState();
  }

  onClickEditGeoresourceReference(georesourceReference_adminView: any): void {
    const georesourceMetadata = this.kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceReference_adminView.referencedGeoresourceId);
    if (georesourceMetadata) {
      this.tmpGeoresourceReference_selectedGeoresourceMetadata = georesourceMetadata;
      this.tmpGeoresourceReference_referenceDescription = georesourceReference_adminView.referencedGeoresourceDescription;
      
      // Force change detection like AngularJS $scope.$digest()
      this.checkButtonState();
    }
  }

  onClickDeleteGeoresourceReference(georesourceReference_adminView: any): void {
    for (let index = 0; index < this.georesourceReferences_adminView.length; index++) {
      if (this.georesourceReferences_adminView[index].referencedGeoresourceId === georesourceReference_adminView.referencedGeoresourceId) {
        // remove object
        this.georesourceReferences_adminView.splice(index, 1);
        break;
      }
    }
    
    // Force change detection like AngularJS $scope.$digest()
    this.checkButtonState();
  }

  onChangeCreationType(): void {
    if (this.indicatorCreationType?.apiName === 'COMPUTATION') {
      this.enableLowestSpatialUnitSelect = true;
    } else {
      this.enableLowestSpatialUnitSelect = false;
    }
  }

  onChangeIndicatorUnit(): void {
    if (this.indicatorUnit.includes('Freitext')) {
      this.enableFreeTextUnit = true;
    } else {
      this.enableFreeTextUnit = false;
    }
  }

  // Topic hierarchy change methods
  onMainTopicChanged(): void {
    // Reset sub-topics when main topic changes
    this.indicatorTopic_subTopic = null;
    this.indicatorTopic_subsubTopic = null;
    this.indicatorTopic_subsubsubTopic = null;
  }

  onSubTopicChanged(): void {
    // Reset sub-sub-topics when sub topic changes
    this.indicatorTopic_subsubTopic = null;
    this.indicatorTopic_subsubsubTopic = null;
  }

  onSubSubTopicChanged(): void {
    // Reset sub-sub-sub-topics when sub-sub topic changes
    this.indicatorTopic_subsubsubTopic = null;
  }

  // Filter methods to replace AngularJS filters
  getMainTopics(): any[] {
    return this.availableTopics.filter((topic: any) => 
      topic.topicType === 'main' && topic.topicResource === 'indicator'
    );
  }

  // Reference filter methods (like AngularJS)
  getFilteredIndicators(): any[] {
    const indicators = this.availableIndicators || [];
    if (!indicators || indicators.length === 0) {
      return [];
    }
    
    if (!this.indicatorNameFilter || this.indicatorNameFilter.trim() === '') {
      return indicators;
    }
    
    const filterLower = this.indicatorNameFilter.toLowerCase().trim();
    return indicators.filter((indicator: any) => {
      if (!indicator) return false;
      
      const name = (indicator.indicatorName || indicator.datasetName || '').toLowerCase();
      const abbr = (indicator.abbreviation || '').toLowerCase();
      
      return name.includes(filterLower) || abbr.includes(filterLower);
    });
  }

  getFilteredGeoresources(): any[] {
    const georesources = this.availableGeoresources || [];
    if (!georesources || georesources.length === 0) {
      return [];
    }
    
    if (!this.georesourceNameFilter || this.georesourceNameFilter.trim() === '') {
      return georesources;
    }
    
    const filterLower = this.georesourceNameFilter.toLowerCase().trim();
    return georesources.filter((georesource: any) => {
      if (!georesource) return false;
      
      const name = (georesource.datasetName || georesource.georesourceName || '').toLowerCase();
      
      return name.includes(filterLower);
    });
  }

  // Step 4: Reference Filtering Methods (like AngularJS - no local filtering needed)
  // The HTML will use the service properties directly with Angular pipes

  // Step 4: Collapsible Box Methods (like add modal)
  toggleIndicatorReferences() {
    this.isIndicatorReferencesCollapsed = !this.isIndicatorReferencesCollapsed;
  }

  toggleGeoresourceReferences() {
    this.isGeoresourceReferencesCollapsed = !this.isGeoresourceReferencesCollapsed;
  }

  // Step 4: Selection Methods (like add modal) - AngularJS style without ngModelChange
  onIndicatorSelected() {
    console.log('=== onIndicatorSelected called ===');
    console.log('Indicator selected:', this.tmpIndicatorReference_selectedIndicatorMetadata);
    console.log('Reference description:', this.tmpIndicatorReference_referenceDescription);
    console.log('Reference description length:', this.tmpIndicatorReference_referenceDescription?.length || 0);
    console.log('Button should be enabled:', !!(this.tmpIndicatorReference_selectedIndicatorMetadata && this.tmpIndicatorReference_referenceDescription && this.tmpIndicatorReference_referenceDescription.trim().length > 0));
    
    // Force change detection like AngularJS $scope.$digest()
    this.checkButtonState();
  }

  onGeoresourceSelected() {
    console.log('=== onGeoresourceSelected called ===');
    console.log('Georesource selected:', this.tmpGeoresourceReference_selectedGeoresourceMetadata);
    console.log('Reference description:', this.tmpGeoresourceReference_referenceDescription);
    console.log('Reference description length:', this.tmpGeoresourceReference_referenceDescription?.length || 0);
    console.log('Button should be enabled:', !!(this.tmpGeoresourceReference_selectedGeoresourceMetadata && this.tmpGeoresourceReference_referenceDescription && this.tmpGeoresourceReference_referenceDescription.trim().length > 0));
    
    // Force change detection like AngularJS $scope.$digest()
    this.checkButtonState();
  }

  // Step 4: Description change handlers - AngularJS style
  onIndicatorDescriptionChanged() {
    console.log('=== onIndicatorDescriptionChanged called ===');
    console.log('Reference description changed to:', this.tmpIndicatorReference_referenceDescription);
    console.log('Reference description length:', this.tmpIndicatorReference_referenceDescription?.length || 0);
    console.log('Current selected indicator:', this.tmpIndicatorReference_selectedIndicatorMetadata);
    
    // Force change detection like AngularJS $scope.$digest()
    this.checkButtonState();
  }

  onGeoresourceDescriptionChanged() {
    console.log('=== onGeoresourceDescriptionChanged called ===');
    console.log('Reference description changed to:', this.tmpGeoresourceReference_referenceDescription);
    console.log('Reference description length:', this.tmpGeoresourceReference_referenceDescription?.length || 0);
    console.log('Current selected georesource:', this.tmpGeoresourceReference_selectedGeoresourceMetadata);
    
    // Force change detection like AngularJS $scope.$digest()
    this.checkButtonState();
  }

  // Debug method for georesource data (simplified like AngularJS)
  debugGeoresourceData() {
    console.log('=== Debug Georesource Data ===');
    console.log('Service availableGeoresources:', this.kommonitorDataExchangeService.availableGeoresources);
    console.log('Local availableGeoresources:', this.availableGeoresources);
    console.log('Current step:', this.currentStep);
    
    // Try to reload data
    if (this.kommonitorDataExchangeService.availableGeoresources && this.kommonitorDataExchangeService.availableGeoresources.length > 0) {
      this.availableGeoresources = this.kommonitorDataExchangeService.availableGeoresources;
      console.log('Reloaded georesources:', this.availableGeoresources);
    } else {
      // Try to fetch georesources manually
      console.log('No georesources in service, trying to fetch manually...');
      this.kommonitorDataExchangeService.fetchGeoresourcesMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles)
        .then(georesources => {
          console.log('Manually fetched georesources:', georesources);
          this.availableGeoresources = georesources;
          console.log('Updated georesources:', this.availableGeoresources);
        })
        .catch(error => {
          console.error('Error fetching georesources:', error);
        });
    }
  }

  // Method to refresh local properties from service (like AngularJS)
  private refreshLocalPropertiesFromService(): void {
    // Sync indicators
    if (this.kommonitorDataExchangeService.availableIndicators && 
        this.kommonitorDataExchangeService.availableIndicators.length > 0) {
      this.availableIndicators = this.kommonitorDataExchangeService.availableIndicators;
    }
    
    // Sync georesources
    if (this.kommonitorDataExchangeService.availableGeoresources && 
        this.kommonitorDataExchangeService.availableGeoresources.length > 0) {
      this.availableGeoresources = this.kommonitorDataExchangeService.availableGeoresources;
    }
  }

  // Method to manually refresh georesources (for debugging)
  async refreshGeoresources(): Promise<void> {
    console.log('=== Manually refreshing georesources ===');
    try {
      await this.kommonitorDataExchangeService.fetchGeoresourcesMetadata(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles || []
      );
      this.refreshLocalPropertiesFromService();
      console.log('Georesources refreshed successfully:', this.availableGeoresources?.length || 0);
    } catch (error) {
      console.error('Error refreshing georesources:', error);
    }
  }

  // Method to manually refresh indicators (for debugging)
  async refreshIndicators(): Promise<void> {
    console.log('=== Manually refreshing indicators ===');
    try {
      await this.kommonitorDataExchangeService.fetchIndicatorsMetadata(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles || []
      );
      this.refreshLocalPropertiesFromService();
      console.log('Indicators refreshed successfully:', this.availableIndicators?.length || 0);
    } catch (error) {
      console.error('Error refreshing indicators:', error);
    }
  }

  // Method to check button state (for debugging)
  checkButtonState(): void {
    console.log('=== Button State Check ===');
    
    // Check indicator button state (AngularJS logic)
    const indicatorSelected = !!this.tmpIndicatorReference_selectedIndicatorMetadata;
    const indicatorDescriptionExists = !!(this.tmpIndicatorReference_referenceDescription && this.tmpIndicatorReference_referenceDescription.trim().length > 0);
    const indicatorButtonEnabled = indicatorSelected || !indicatorDescriptionExists; // AngularJS logic: !selected && description
    
    console.log('Indicator button state:');
    console.log('  - Selected indicator:', this.tmpIndicatorReference_selectedIndicatorMetadata);
    console.log('  - Reference description:', this.tmpIndicatorReference_referenceDescription);
    console.log('  - Reference description length:', this.tmpIndicatorReference_referenceDescription?.length || 0);
    console.log('  - Indicator selected:', indicatorSelected);
    console.log('  - Description exists:', indicatorDescriptionExists);
    console.log('  - Button should be enabled:', indicatorButtonEnabled);
    console.log('  - Button disabled condition: !selected && description =', !indicatorSelected && indicatorDescriptionExists);
    
    // Check georesource button state (AngularJS logic)
    const georesourceSelected = !!this.tmpGeoresourceReference_selectedGeoresourceMetadata;
    const georesourceDescriptionExists = !!(this.tmpGeoresourceReference_referenceDescription && this.tmpGeoresourceReference_referenceDescription.trim().length > 0);
    const georesourceButtonEnabled = georesourceSelected || !georesourceDescriptionExists; // AngularJS logic: !selected && description
    
    console.log('Georesource button state:');
    console.log('  - Selected georesource:', this.tmpGeoresourceReference_selectedGeoresourceMetadata);
    console.log('  - Reference description:', this.tmpGeoresourceReference_referenceDescription);
    console.log('  - Reference description length:', this.tmpGeoresourceReference_referenceDescription?.length || 0);
    console.log('  - Georesource selected:', georesourceSelected);
    console.log('  - Description exists:', georesourceDescriptionExists);
    console.log('  - Button should be enabled:', georesourceButtonEnabled);
    console.log('  - Button disabled condition: !selected && description =', !georesourceSelected && georesourceDescriptionExists);
  }

  // Method to manually test button state (for debugging)
  testButtonState(): void {
    console.log('=== Testing Button State ===');
    
    // Test with sample data
    this.tmpIndicatorReference_selectedIndicatorMetadata = { indicatorId: 'test', indicatorName: 'Test Indicator' };
    this.tmpIndicatorReference_referenceDescription = 'Test description';
    
    console.log('Set test data:');
    console.log('  - Selected indicator:', this.tmpIndicatorReference_selectedIndicatorMetadata);
    console.log('  - Reference description:', this.tmpIndicatorReference_referenceDescription);
    
    // Check button state again
    this.checkButtonState();
  }

  // Method to manually check button state (for debugging)
  manualCheckButtonState(): void {
    console.log('=== Manual Button State Check ===');
    console.log('This method was called manually');
    
    // Check current state
    this.checkButtonState();
    
    // Try to manually trigger change detection
    console.log('Attempting to manually trigger change detection...');
    
    // Force a change detection cycle
    setTimeout(() => {
      console.log('=== After manual timeout ===');
      this.checkButtonState();
    }, 100);
  }

  // Method to manually simulate selection and description (for debugging)
  simulateUserInput(): void {
    console.log('=== Simulating User Input ===');
    
    // Simulate selecting an indicator
    console.log('Simulating indicator selection...');
    this.tmpIndicatorReference_selectedIndicatorMetadata = { 
      indicatorId: 'simulated', 
      indicatorName: 'Simulated Indicator' 
    };
    
    // Simulate typing a description
    console.log('Simulating description input...');
    this.tmpIndicatorReference_referenceDescription = 'Simulated description';
    
    // Manually call the change handlers to see if they work
    console.log('Manually calling change handlers...');
    this.onIndicatorSelected();
    this.onIndicatorDescriptionChanged();
    
    // Check final state
    console.log('=== Final state after simulation ===');
    this.checkButtonState();
  }

  buildPatchBody_indicators(): any {
    const patchBody: any = {
      "metadata": {
        "note": this.metadata.note || null,
        "literature": this.metadata.literature || null,
        "updateInterval": this.metadata.updateInterval?.apiName,
        "sridEPSG": this.metadata.sridEPSG || 4326,
        "datasource": this.metadata.datasource,
        "contact": this.metadata.contact,
        "lastUpdate": this.metadata.lastUpdate,
        "description": this.metadata.description || null,
        "databasis": this.metadata.databasis || null
      },
      "refrencesToOtherIndicators": [] as any[],
      "regionalReferenceValues": [] as any[],
      "datasetName": this.datasetName,
      "abbreviation": this.indicatorAbbreviation || null,
      "precision": (this.showCustomCommaValue === true) ? this.indicatorPrecision : null,
      "characteristicValue": null,
      "tags": [] as string[],
      "creationType": this.indicatorCreationType?.apiName || 'INSERTION',
      "unit": this.indicatorUnit,
      "topicReference": "",
      "refrencesToGeoresources": [] as any[],
      "indicatorType": this.indicatorType?.apiName,
      "interpretation": this.indicatorInterpretation || "",
      "isHeadlineIndicator": this.isHeadlineIndicator || false,
      "processDescription": this.indicatorProcessDescription || "",
      "referenceDateNote": this.indicatorReferenceDateNote || "",
      "displayOrder": this.displayOrder,
      "lowestSpatialUnitForComputation": this.indicatorLowestSpatialUnitMetadataObjectForComputation ? 
        this.indicatorLowestSpatialUnitMetadataObjectForComputation.spatialUnitLevel : null,
      "defaultClassificationMapping": {
        "colorBrewerSchemeName": this.selectedColorBrewerPaletteEntry.paletteName,
        "classificationMethod": this.classificationMethod.toUpperCase(),
        "numClasses": this.numClassesPerSpatialUnit ? Number(this.numClassesPerSpatialUnit) : 5,
        "items": this.spatialUnitClassification.filter((entry: any) => !entry.breaks.includes(null)),
      }
    };

    // regionalReferenceValues
    const regionalReferenceValuesList = this.getRegionalReferenceValues();
    for (const referenceValueEntry of regionalReferenceValuesList) {
      patchBody.regionalReferenceValues.push(referenceValueEntry);
    }

    // TAGS
    if (this.indicatorTagsString_withCommas) {
      const tags_splitted = this.indicatorTagsString_withCommas.split(",");
      for (const tagString of tags_splitted) {
        patchBody.tags.push(tagString.trim());
      }
    }

    // TOPIC REFERENCE
    if (this.indicatorTopic_subsubsubTopic) {
      patchBody.topicReference = this.indicatorTopic_subsubsubTopic.topicId;
    } else if (this.indicatorTopic_subsubTopic) {
      patchBody.topicReference = this.indicatorTopic_subsubTopic.topicId;
    } else if (this.indicatorTopic_subTopic) {
      patchBody.topicReference = this.indicatorTopic_subTopic.topicId;
    } else if (this.indicatorTopic_mainTopic) {
      patchBody.topicReference = this.indicatorTopic_mainTopic.topicId;
    } else {
      patchBody.topicReference = "";
    }

    // REFERENCES
    if (this.indicatorReferences_adminView && this.indicatorReferences_adminView.length > 0) {
      patchBody.refrencesToOtherIndicators = [];

      for (const indicRef of this.indicatorReferences_adminView) {
        patchBody.refrencesToOtherIndicators.push({
          "indicatorId": indicRef.referencedIndicatorId,
          "referenceDescription": indicRef.referencedIndicatorDescription
        });
      }
    }

    if (this.georesourceReferences_adminView && this.georesourceReferences_adminView.length > 0) {
      patchBody.refrencesToGeoresources = [];

      for (const geoRef of this.georesourceReferences_adminView) {
        patchBody.refrencesToGeoresources.push({
          "georesourceId": geoRef.referencedGeoresourceId,
          "referenceDescription": geoRef.referencedGeoresourceDescription
        });
      }
    }

    return patchBody;
  }

  editIndicatorMetadata(): void {
    // Validate critical fields before sending
    if (!this.indicatorCreationType?.apiName) {
      console.error('Creation type is missing, attempting to set fallback...');
      if (this.kommonitorDataExchangeService.indicatorCreationTypeOptions && this.kommonitorDataExchangeService.indicatorCreationTypeOptions.length > 0) {
              // Check what structure the service is returning
      const firstOption = this.kommonitorDataExchangeService.indicatorCreationTypeOptions[0];
      console.log('Service returned creation type option:', firstOption);
      
      if (firstOption.apiName) {
        // Service has correct structure, find INSERTION
        const insertionOption = this.kommonitorDataExchangeService.indicatorCreationTypeOptions.find(option => option.apiName === 'INSERTION');
        if (insertionOption) {
          this.indicatorCreationType = insertionOption;
          console.log('Fallback creation type set to INSERTION:', this.indicatorCreationType);
        } else {
          this.indicatorCreationType = firstOption;
          console.log('Fallback creation type set to first option:', this.indicatorCreationType);
        }
      } else if (firstOption.value === 'manual') {
        // Service has different structure, convert to expected format
        this.indicatorCreationType = {
          displayName: firstOption.label || 'Manuell',
          apiName: 'INSERTION'
        };
        console.log('Fallback: Converted structure and set default creation type to INSERTION:', this.indicatorCreationType);
      } else {
        // Unknown structure, create safe fallback
        this.indicatorCreationType = {
          displayName: 'Manuell',
          apiName: 'INSERTION'
        };
        console.log('Fallback: Created safe default creation type:', this.indicatorCreationType);
      }
      } else {
        this.errorMessage = 'Fehler: Keine gültigen Erstellungstypen verfügbar.';
        this.errorMessagePart = 'Bitte stellen Sie sicher, dass die Erstellungstypen geladen wurden.';
        return;
      }
    }

    const patchBody = this.buildPatchBody_indicators();
    
    // Debug: Log the patch body to see what's being sent
    console.log('Patch body being sent:', patchBody);
    console.log('Creation type in patch body:', patchBody.creationType);
    console.log('Current indicatorCreationType:', this.indicatorCreationType);

    this.loadingData = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.errorMessagePart = '';
    this.successMessagePart = '';

    this.http.patch(
      this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId,
      patchBody
    ).subscribe({
      next: (response: any) => {
        this.successMessagePart = this.datasetName;
        this.successMessage = `Metadaten für Indikator "${this.successMessagePart}" erfolgreich aktualisiert.`;

        // Broadcast refresh events with proper parameters (matching spatial units pattern)
        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { 
          crudType: 'edit', 
          targetIndicatorId: this.currentIndicatorDataset.indicatorId 
        });

        this.loadingData = false;
        
        // Auto-close after delay (matching spatial units pattern)
        setTimeout(() => {
          this.activeModal.close({ action: 'updated', indicatorId: this.currentIndicatorDataset.indicatorId });
        }, 2000); // Close after 2 seconds
      },
      error: (error: any) => {
        this.errorMessagePart = error.error ? 
          this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error) : 
          this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        this.errorMessage = 'Fehler beim Aktualisieren der Metadaten.';
        this.loadingData = false;
      }
    });
  }

  hideSuccessAlert(): void {
    this.successMessage = '';
  }

  hideErrorAlert(): void {
    this.errorMessage = '';
  }

  hideMetadataErrorAlert(): void {
    this.indicatorAddMetadataImportErrorAlert = false;
  }

  closeOnSuccess(): void {
    this.activeModal.close({ action: 'updated', indicatorId: this.currentIndicatorDataset?.indicatorId });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  onSubmit(event?: Event): void {
    // Set default classification method if not already set
    if (!this.classificationMethod) {
      this.classificationMethod = (__env?.defaultClassifyMethod || 'jenks');
    }
    
    if (event) {
      event.preventDefault();
    }
    
    if (this.isFormValid()) {
      this.editIndicatorMetadata();
    }
  }

  isFormValid(): boolean {
    return this.indicatorEditMetadataForm ? this.indicatorEditMetadataForm.valid || false : false;
  }

  // Import/Export methods for indicator metadata
  onImportIndicatorEditMetadata(): void {
    this.indicatorMetadataImportError = '';
    const fileInput = document.getElementById('indicatorEditMetadataImportFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onExportIndicatorEditMetadata(): void {
    const metadataExport = {
      metadata: {
        note: this.metadata.note || '',
        literature: this.metadata.literature || '',
        updateInterval: this.metadata.updateInterval ? this.metadata.updateInterval.apiName : '',
        sridEPSG: this.metadata.sridEPSG || 4326,
        datasource: this.metadata.datasource || '',
        contact: this.metadata.contact || '',
        lastUpdate: this.metadata.lastUpdate || '',
        description: this.metadata.description || '',
        databasis: this.metadata.databasis || ''
      },
      datasetName: this.datasetName || '',
      abbreviation: this.indicatorAbbreviation || '',
      indicatorType: this.indicatorType ? this.indicatorType.apiName : '',
      creationType: this.indicatorCreationType ? this.indicatorCreationType.apiName : '',
      characteristicValue: this.indicatorCharacteristicValue || '',
      isHeadlineIndicator: this.isHeadlineIndicator || false,
      unit: this.indicatorUnit || '',
      processDescription: this.indicatorProcessDescription || '',
      tags: this.indicatorTagsString_withCommas ? this.indicatorTagsString_withCommas.split(',').map(tag => tag.trim()) : [],
      interpretation: this.indicatorInterpretation || '',
      lowestSpatialUnitForComputation: this.indicatorLowestSpatialUnitMetadataObjectForComputation ? this.indicatorLowestSpatialUnitMetadataObjectForComputation.spatialUnitLevel : '',
      topicReference: this.getTopicReference(),
      refrencesToOtherIndicators: this.getIndicatorReferences(),
      refrencesToGeoresources: this.getGeoresourceReferences(),
      defaultClassificationMapping: this.getDefaultClassificationMapping()
    };

    const metadataJSON = JSON.stringify(metadataExport, null, 2);
    const fileName = `Indikator_Metadaten_Export${this.datasetName ? '-' + this.datasetName : ''}.json`;
    this.downloadFile(metadataJSON, fileName);
  }

  private getTopicReference(): string {
    if (this.indicatorTopic_subsubsubTopic) {
      return this.indicatorTopic_subsubsubTopic.topicId;
    } else if (this.indicatorTopic_subsubTopic) {
      return this.indicatorTopic_subsubTopic.topicId;
    } else if (this.indicatorTopic_subTopic) {
      return this.indicatorTopic_subTopic.topicId;
    } else if (this.indicatorTopic_mainTopic) {
      return this.indicatorTopic_mainTopic.topicId;
    }
    return '';
  }

  private getIndicatorReferences(): any[] {
    const references: any[] = [];
    if (this.indicatorReferences_adminView && this.indicatorReferences_adminView.length > 0) {
      for (const indicRef of this.indicatorReferences_adminView) {
        references.push({
          indicatorId: indicRef.referencedIndicatorId,
          referenceDescription: indicRef.referencedIndicatorDescription
        });
      }
    }
    return references;
  }

  private getGeoresourceReferences(): any[] {
    const references: any[] = [];
    if (this.georesourceReferences_adminView && this.georesourceReferences_adminView.length > 0) {
      for (const geoRef of this.georesourceReferences_adminView) {
        references.push({
          georesourceId: geoRef.referencedGeoresourceId,
          referenceDescription: geoRef.referencedGeoresourceDescription
        });
      }
    }
    return references;
  }

  private downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = fileName;
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private getDefaultClassificationMapping(): any {
    if (this.spatialUnitClassification && this.spatialUnitClassification.length > 0) {
      return {
        colorBrewerSchemeName: this.selectedColorBrewerPaletteEntry ? this.selectedColorBrewerPaletteEntry.paletteName : '',
        items: this.spatialUnitClassification.map(classification => ({
          defaultCustomRating: classification.customRating || '',
          defaultColorAsHex: classification.colorAsHex || ''
        }))
      };
    }
    return null;
  }

  // Method to set the current indicator dataset (called by parent component)
  setCurrentIndicatorDataset(indicatorDataset: any): void {
    console.log('Setting current indicator dataset:', indicatorDataset);
    this.currentIndicatorDataset = indicatorDataset;
    
    if (this.currentIndicatorDataset) {
      this.resetIndicatorEditMetadataForm();
      // Initialize regional reference values table
      this.initializeRegionalReferenceValuesTable();
    }
  }

  // Debug method to set a test dataset
  setTestDataset(): void {
    console.log('Setting test dataset...');
    const testDataset = {
      indicatorId: 'test-123',
      indicatorName: 'Test Indicator',
      indicatorType: 'STATUS_ABSOLUTE',
      abbreviation: 'TI',
      unit: 'percent',
      processDescription: 'Test process description',
      tags: ['test', 'debug'],
      interpretation: 'Test interpretation',
      creationType: 'INSERTION',
      metadata: {
        note: 'Test note',
        literature: 'Test literature',
        updateInterval: 'MONTHLY',
        datasource: 'Test source',
        databasis: 'Test basis',
        contact: 'test@example.com',
        description: 'Test description',
        lastUpdate: '2024-01-01'
      }
    };
    
    this.setCurrentIndicatorDataset(testDataset);
  }

  // Step 6: Regional Reference Values Methods
  
  // Initialize regional reference values management table
  initializeRegionalReferenceValuesTable(): void {
    if (this.currentIndicatorDataset?.applicableDates && this.currentIndicatorDataset?.regionalReferenceValues) {
      // Create ag-Grid compatible structure
      this.regionalReferenceValuesManagementTableOptions = {
        columnDefs: [
          { field: 'referenceDate', headerName: 'Referenzdatum', sortable: true, filter: true },
          { field: 'regionalSum', headerName: 'Regionale Summe', sortable: true, filter: true },
          { field: 'regionalAverage', headerName: 'Regionales Mittel', sortable: true, filter: true },
          { field: 'spatiallyUnassignable', headerName: 'Räumlich nicht zuordenbar', sortable: true, filter: true }
        ],
        rowData: this.currentIndicatorDataset.regionalReferenceValues || [],
        pagination: true,
        paginationPageSize: 10,
        domLayout: 'autoHeight',
        defaultColDef: {
          resizable: true,
          sortable: true,
          filter: true
        }
      };
    }
  }

  // File dialog methods
  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.file_regionalReferenceValuesImport = file;
      this.csvProcessingStatus = { type: 'info', message: 'CSV-Datei wird verarbeitet...' };
      this.processCSVFile(file);
    } else {
      this.csvProcessingStatus = { type: 'error', message: 'Ungültiger Dateityp. Bitte wählen Sie eine CSV-Datei aus.' };
      console.error('Invalid file type. Please select a CSV file.');
    }
  }

  // Drag and drop methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv') {
        this.file_regionalReferenceValuesImport = file;
        this.csvProcessingStatus = { type: 'info', message: 'CSV-Datei wird verarbeitet...' };
        this.processCSVFile(file);
      } else {
        this.csvProcessingStatus = { type: 'error', message: 'Ungültiger Dateityp. Bitte legen Sie eine CSV-Datei ab.' };
        console.error('Invalid file type. Please drop a CSV file.');
      }
    }
  }

  // Process CSV file and extract schema
  private processCSVFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const csvContent = e.target.result;
      const lines = csvContent.split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((header: string) => header.trim());
        this.tmpIndicatorRegionalReferenceValuesObject = {
          featureSchema: headers,
          TIMESTAMP_ATTRIBUTE: headers[0] || '',
          REGIONAL_SUM_ATTRIBUTE: headers[1] || '',
          REGIONAL_MEAN_ATTRIBUTE: headers[2] || '',
          SPATIALLY_UNASSIGNABLE: headers[3] || ''
        };
        this.csvProcessingStatus = { type: 'success', message: `CSV-Schema erfolgreich geladen. ${headers.length} Spalten gefunden.` };
      } else {
        this.csvProcessingStatus = { type: 'error', message: 'CSV-Datei konnte nicht verarbeitet werden. Überprüfen Sie das Format.' };
      }
    };
    reader.onerror = () => {
      this.csvProcessingStatus = { type: 'error', message: 'Fehler beim Lesen der CSV-Datei.' };
    };
    reader.readAsText(file);
  }

  // Load CSV data into the system
  loadCSV_indicatorRegionalReferenceValues(): void {
    if (!this.tmpIndicatorRegionalReferenceValuesObject?.TIMESTAMP_ATTRIBUTE) {
      this.csvProcessingStatus = { type: 'error', message: 'Zeitstempel-Spalte ist erforderlich.' };
      console.error('Timestamp attribute is required');
      return;
    }

    if (!this.file_regionalReferenceValuesImport) {
      this.csvProcessingStatus = { type: 'error', message: 'Keine Datei ausgewählt.' };
      console.error('No file selected');
      return;
    }

    this.csvProcessingStatus = { type: 'info', message: 'CSV-Daten werden geladen...' };

    // Process the CSV file and add to regional reference values
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const csvContent = e.target.result;
      const lines = csvContent.split('\n');
      
      if (lines.length < 2) {
        this.csvProcessingStatus = { type: 'error', message: 'CSV-Datei muss mindestens eine Kopfzeile und eine Datenzeile haben.' };
        console.error('CSV file must have at least a header and one data row');
        return;
      }

      const headers = lines[0].split(',').map((header: string) => header.trim());
      const timestampIndex = headers.indexOf(this.tmpIndicatorRegionalReferenceValuesObject.TIMESTAMP_ATTRIBUTE);
      const sumIndex = headers.indexOf(this.tmpIndicatorRegionalReferenceValuesObject.REGIONAL_SUM_ATTRIBUTE);
      const meanIndex = headers.indexOf(this.tmpIndicatorRegionalReferenceValuesObject.REGIONAL_MEAN_ATTRIBUTE);
      const unassignableIndex = headers.indexOf(this.tmpIndicatorRegionalReferenceValuesObject.SPATIALLY_UNASSIGNABLE);

      if (timestampIndex === -1) {
        this.csvProcessingStatus = { type: 'error', message: 'Zeitstempel-Spalte nicht gefunden.' };
        console.error('Timestamp column not found');
        return;
      }

      // Process data rows
      const newReferenceValues: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map((value: string) => value.trim());
          const referenceValue = {
            referenceDate: values[timestampIndex],
            regionalSum: sumIndex !== -1 ? parseFloat(values[sumIndex]) || 0 : 0,
            regionalAverage: meanIndex !== -1 ? parseFloat(values[meanIndex]) || 0 : 0,
            spatiallyUnassignable: unassignableIndex !== -1 ? parseFloat(values[unassignableIndex]) || 0 : 0
          };
          newReferenceValues.push(referenceValue);
        }
      }

      // Add to existing regional reference values
      if (!this.currentIndicatorDataset.regionalReferenceValues) {
        this.currentIndicatorDataset.regionalReferenceValues = [];
      }
      
      this.currentIndicatorDataset.regionalReferenceValues.push(...newReferenceValues);
      
      // Refresh the table
      this.initializeRegionalReferenceValuesTable();
      
      // Reset file selection
      this.file_regionalReferenceValuesImport = null;
      this.tmpIndicatorRegionalReferenceValuesObject = undefined;
      
      this.csvProcessingStatus = { type: 'success', message: `${newReferenceValues.length} regionale Vergleichswerte erfolgreich geladen.` };
      console.log(`Successfully loaded ${newReferenceValues.length} regional reference values`);
    };
    reader.onerror = () => {
      this.csvProcessingStatus = { type: 'error', message: 'Fehler beim Lesen der CSV-Datei.' };
    };
    reader.readAsText(this.file_regionalReferenceValuesImport);
  }

  // Get regional reference values for form submission
  private getRegionalReferenceValues(): any[] {
    if (this.regionalReferenceValuesManagementTableOptions?.api) {
      const referenceValues: any[] = [];
      this.regionalReferenceValuesManagementTableOptions.api.forEachNode((node: any, index: number) => {
        referenceValues.push(node.data);
      });
      return referenceValues;
    }
    return this.currentIndicatorDataset?.regionalReferenceValues || [];
  }

  // Initialize special fields for regional reference values
  initSpecialFields(indicatorRegionalReferenceValuesObject: any): void {
    if (indicatorRegionalReferenceValuesObject?.featureSchema) {
      // Add none option to schema
      indicatorRegionalReferenceValuesObject.featureSchema.splice(0, 0, this.noneColumnValue);
      
      // Set default attributes
      indicatorRegionalReferenceValuesObject.TIMESTAMP_ATTRIBUTE = indicatorRegionalReferenceValuesObject.featureSchema[0];
      indicatorRegionalReferenceValuesObject.REGIONAL_SUM_ATTRIBUTE = indicatorRegionalReferenceValuesObject.featureSchema[1] || this.noneColumnValue;
      indicatorRegionalReferenceValuesObject.REGIONAL_MEAN_ATTRIBUTE = indicatorRegionalReferenceValuesObject.featureSchema[2] || this.noneColumnValue;
      indicatorRegionalReferenceValuesObject.SPATIALLY_UNASSIGNABLE = indicatorRegionalReferenceValuesObject.featureSchema[3] || this.noneColumnValue;
    }
  }

} 