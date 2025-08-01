import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';
import { KommonitorIndicatorCacheHelperService } from 'services/adminIndicatorUnit/kommonitor-cache-helper.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
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

  private subscriptions: Subscription[] = [];

  // Multi-step form properties
  currentStep = 1;
  totalSteps = 6;

  // Current indicator dataset
  currentIndicatorDataset: any = null;

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

  // Classification
  numClassesArray = [3, 4, 5, 6, 7, 8];
  selectedColorBrewerPaletteEntry: any = null;
  numClassesPerSpatialUnit: number | null = null;
  classificationMethod = __env?.defaultClassifyMethod || 'jenks';
  spatialUnitClassification: any[] = [];
  classBreaksInvalid = false;
  tabClasses: string[] = [];

  // Regional reference values
  regionalReferenceValuesManagementTableOptions: any = null;
  tmpIndicatorRegionalReferenceValuesObject: any = null;
  noneColumnValue = '-- keine --';
  file_regionalReferenceValuesImport: any = null;

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
  colorbrewerSchemes = colorbrewer;
  colorbreweSchemeName_dynamicIncrease = __env?.defaultColorBrewerPaletteForBalanceIncreasingValues;
  colorbreweSchemeName_dynamicDecrease = __env?.defaultColorBrewerPaletteForBalanceDecreasingValues;
  colorbrewerPalettes: any[] = [];
  
  // Classification properties
  decreaseBreaksLength: number = 0;
  increaseBreaksLength: number = 0;

  // Available options - these were missing!
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  indicatorTypeOptions: any[] = [];
  indicatorCreationTypeOptions: any[] = [];
  indicatorUnitOptions: any[] = [];
  availableTopics: any[] = [];

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

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private kommonitorCacheHelperService: KommonitorIndicatorCacheHelperService,
    private kommonitorDataGridHelperService: KommonitorIndicatorDataGridHelperService,
    private broadcastService: BroadcastService
  ) {}

  ngOnInit(): void {
    console.log('IndicatorEditMetadataModalComponent ngOnInit');
    console.log('Current indicator dataset:', this.currentIndicatorDataset);
    console.log('KommonitorDataExchangeService:', this.kommonitorDataExchangeService);
    
    this.setupEventListeners();
    this.loadInitialData();
    this.instantiateColorBrewerPalettes();
    this.indicatorMetadataStructure_pretty = this.kommonitorDataExchangeService.syntaxHighlightJSON(this.indicatorMetadataStructure);
    
    console.log('Available options loaded:');
    console.log('- indicatorTypeOptions:', this.indicatorTypeOptions);
    console.log('- indicatorCreationTypeOptions:', this.indicatorCreationTypeOptions);
    console.log('- indicatorUnitOptions:', this.indicatorUnitOptions);
    console.log('- updateIntervalOptions:', this.updateIntervalOptions);
    console.log('- availableSpatialUnits:', this.availableSpatialUnits);
    
    // If currentIndicatorDataset is already set (from parent component), initialize form
    if (this.currentIndicatorDataset) {
      console.log('Initializing form with currentIndicatorDataset');
      this.resetIndicatorEditMetadataForm();
    } else {
      console.log('No currentIndicatorDataset available');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Multi-step form navigation methods
  nextStep(): void {
    if (this.currentStep < this.totalSteps && this.isCurrentStepValid()) {
      this.currentStep++;
      this.updateProgressBar();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressBar();
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      // Allow navigation to any step for better user experience
      this.currentStep = step;
      this.updateProgressBar();
      
      // Show validation feedback if navigating to a step that requires validation
      if (step > 1 && !this.isStepValid(step)) {
        console.log(`Step ${step} requires validation. Please complete the required fields.`);
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

  isCurrentStepValid(): boolean {
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
      console.log('Setting up accordion event listeners');
      ($('[data-widget="collapse"]') as any).on('click', function(this: any) {
        console.log('Accordion button clicked');
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
      console.log('Setting up dropdown event listeners');
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

  private loadInitialData(): void {
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
    }

    // Load indicator unit options
    if (this.kommonitorDataExchangeService.indicatorUnitOptions) {
      this.indicatorUnitOptions = this.kommonitorDataExchangeService.indicatorUnitOptions;
    }

    // Load available topics
    if (this.kommonitorDataExchangeService.availableTopics) {
      this.availableTopics = this.kommonitorDataExchangeService.availableTopics;
    }
  }

  // Remove openModal method - no longer needed

  closeModal(): void {
    this.activeModal.dismiss();
  }

  instantiateColorBrewerPalettes(): void {
    console.log('instantiateColorBrewerPalettes called');
    console.log('colorbrewer:', colorbrewer);
    console.log('colorbrewerSchemes:', this.colorbrewerSchemes);
    console.log('colorbreweSchemeName_dynamicDecrease:', this.colorbreweSchemeName_dynamicDecrease);
    console.log('colorbreweSchemeName_dynamicIncrease:', this.colorbreweSchemeName_dynamicIncrease);
    
    const customColorSchemes = __env?.customColorSchemes;
    let colorbrewerExtended = colorbrewer;

    // Add custom color themes from configuration properties
    if (customColorSchemes) {
      colorbrewerExtended = Object.assign(customColorSchemes, colorbrewer);
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
    this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes[13];
    
    console.log('colorbrewerPalettes length:', this.colorbrewerPalettes.length);
    console.log('selectedColorBrewerPaletteEntry:', this.selectedColorBrewerPaletteEntry);
  }

  onClassificationMethodSelected(method: any): void {
    this.classificationMethod = method.id;
  }

  onNumClassesChanged(numClasses: number | null): void {
    if (numClasses === null) {
      return; // Don't process if null
    }
    
    this.numClassesPerSpatialUnit = numClasses;
    for (let i = 0; i < this.kommonitorDataExchangeService.availableSpatialUnits.length; i++) {
      const spatialUnit = this.kommonitorDataExchangeService.availableSpatialUnits[i];
      this.spatialUnitClassification[i] = {
        spatialUnitId: spatialUnit.spatialUnitId,
        breaks: []
      };
      this.tabClasses[i] = '';
      for (let classNr = 0; classNr < numClasses - 1; classNr++) {
        this.spatialUnitClassification[i].breaks.push(null);
      }
    }
  }

  onBreaksChanged(tabIndex: number): void {
    this.classBreaksInvalid = false;
    let cssClass = 'tab-completed';
    
    for (const classBreak of this.spatialUnitClassification[tabIndex].breaks) {
      if (classBreak === null) {
        cssClass = '';
      }
    }
    
    if (cssClass === 'tab-completed') {
      for (let i = 0; i < this.spatialUnitClassification[tabIndex].breaks.length - 1; i++) {
        if (this.spatialUnitClassification[tabIndex].breaks[i] > this.spatialUnitClassification[tabIndex].breaks[i + 1]) {
          cssClass = 'tab-error';
          this.classBreaksInvalid = true;
        }
      }
    } else {
      for (const classBreak of this.spatialUnitClassification[tabIndex].breaks) {
        if (classBreak !== null) {
          cssClass = 'tab-error';
          this.classBreaksInvalid = true;
        }
      }
    }
    this.tabClasses[tabIndex] = cssClass;
    this.updateDecreaseAndIncreaseBreaks(tabIndex);
  }

  updateDecreaseAndIncreaseBreaks(tabIndex: number): void {
    this.increaseBreaksLength = this.spatialUnitClassification[tabIndex].breaks.filter((val: number) => val > 0).length;
    this.decreaseBreaksLength = this.spatialUnitClassification[tabIndex].breaks.filter((val: number) => val < 0).length;
    
    if (this.increaseBreaksLength < 3) {
      // Handle minimum increase breaks
    }
    if (this.decreaseBreaksLength < 3) {
      // Handle minimum decrease breaks
    }
  }

  refreshReferenceValuesManagementTable(): void {
    this.regionalReferenceValuesManagementTableOptions = this.kommonitorDataGridHelperService.buildReferenceValuesManagementGrid(
      this.regionalReferenceValuesManagementTableOptions
    );
  }

  resetIndicatorEditMetadataForm(): void {
    console.log('resetIndicatorEditMetadataForm called with currentIndicatorDataset:', this.currentIndicatorDataset);
    
    if (!this.currentIndicatorDataset) {
      console.error('currentIndicatorDataset is null or undefined!');
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
    if (this.currentIndicatorDataset.indicatorType) {
      this.kommonitorDataExchangeService.indicatorTypeOptions.forEach((option: any) => {
        if (option.apiName === this.currentIndicatorDataset.indicatorType) {
          this.indicatorType = option;
        }
      });
    }

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

    // Reset classification
    this.numClassesArray = [3, 4, 5, 6, 7, 8];
    this.numClassesPerSpatialUnit = null;
    this.classificationMethod = __env?.defaultClassifyMethod || 'jenks';
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
  }

  onAddOrUpdateIndicatorReference(): void {
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
  }

  onClickEditIndicatorReference(indicatorReference_adminView: any): void {
    const indicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorReference_adminView.referencedIndicatorId);
    if (indicatorMetadata) {
      this.tmpIndicatorReference_selectedIndicatorMetadata = indicatorMetadata;
      this.tmpIndicatorReference_referenceDescription = indicatorReference_adminView.referencedIndicatorDescription;
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
  }

  onClickEditGeoresourceReference(georesourceReference_adminView: any): void {
    const georesourceMetadata = this.kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceReference_adminView.referencedGeoresourceId);
    if (georesourceMetadata) {
      this.tmpGeoresourceReference_selectedGeoresourceMetadata = georesourceMetadata;
      this.tmpGeoresourceReference_referenceDescription = georesourceReference_adminView.referencedGeoresourceDescription;
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
    console.log('Main topic changed to:', this.indicatorTopic_mainTopic);
    // Reset sub-topics when main topic changes
    this.indicatorTopic_subTopic = null;
    this.indicatorTopic_subsubTopic = null;
    this.indicatorTopic_subsubsubTopic = null;
  }

  onSubTopicChanged(): void {
    console.log('Sub topic changed to:', this.indicatorTopic_subTopic);
    // Reset sub-sub-topics when sub topic changes
    this.indicatorTopic_subsubTopic = null;
    this.indicatorTopic_subsubsubTopic = null;
  }

  onSubSubTopicChanged(): void {
    console.log('Sub-sub topic changed to:', this.indicatorTopic_subsubTopic);
    // Reset sub-sub-sub-topics when sub-sub topic changes
    this.indicatorTopic_subsubsubTopic = null;
  }

  // Filter methods to replace AngularJS filters
  getMainTopics(): any[] {
    return this.availableTopics.filter((topic: any) => 
      topic.topicType === 'main' && topic.topicResource === 'indicator'
    );
  }

  // Reference filter methods
  getFilteredIndicators(): any[] {
    if (!this.kommonitorDataExchangeService.availableIndicators) {
      return [];
    }
    
    if (!this.indicatorNameFilter) {
      return this.kommonitorDataExchangeService.availableIndicators;
    }
    
    const filterLower = this.indicatorNameFilter.toLowerCase();
    return this.kommonitorDataExchangeService.availableIndicators.filter((indicator: any) =>
      indicator.indicatorName.toLowerCase().includes(filterLower)
    );
  }

  getFilteredGeoresources(): any[] {
    if (!this.kommonitorDataExchangeService.availableGeoresources) {
      return [];
    }
    
    if (!this.georesourceNameFilter) {
      return this.kommonitorDataExchangeService.availableGeoresources;
    }
    
    const filterLower = this.georesourceNameFilter.toLowerCase();
    return this.kommonitorDataExchangeService.availableGeoresources.filter((georesource: any) =>
      georesource.datasetName.toLowerCase().includes(filterLower)
    );
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
      "creationType": this.indicatorCreationType?.apiName,
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
    const regionalReferenceValuesList = this.kommonitorDataGridHelperService.getReferenceValues_regionalReferenceValuesManagementGrid(this.regionalReferenceValuesManagementTableOptions);
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
    const patchBody = this.buildPatchBody_indicators();

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
        console.error('Error updating indicator metadata:', error);
        console.error('Error response:', error.error);
        console.error('Error status:', error.status);
        
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
    // Prevent default form submission behavior
    if (event) {
      event.preventDefault();
    }
    
    // Check if form is valid
    if (this.indicatorEditMetadataForm && !this.indicatorEditMetadataForm.valid) {
      console.log('Form is not valid');
      return;
    }
    
    // Only proceed if not already loading
    if (!this.loadingData) {
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
} 