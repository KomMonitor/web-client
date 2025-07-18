import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'indicator-add-modal-new',
  templateUrl: './indicator-add-modal.component.html',
  styleUrls: ['./indicator-add-modal.component.css']
})
export class IndicatorAddModalComponent implements OnInit {
  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;

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
  indicatorUnit = '';
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

  // Role management
  roleManagementTableOptions: any = null;
  ownerOrganization: any = null;
  ownerOrgFilter = '';
  isPublic = false;
  resourcesCreatorRights: any[] = [];

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
  
  // Step 6: Regional Comparison Values
  comparisonValueType: string | null = null;
  comparisonValue: number | null = null;
  comparisonRegion: string | null = null;
  comparisonTimeframe: string | null = null;
  comparisonDescription = '';
  evaluationDirection: string | null = null;
  toleranceRange: number | null = null;
  
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

  constructor(
    public activeModal: NgbActiveModal,
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    @Inject('kommonitorImporterHelperService') public kommonitorImporterHelperService: any,
    @Inject('kommonitorDataGridHelperService') private kommonitorDataGridHelperService: any,
    @Inject('kommonitorMultiStepFormHelperService') private kommonitorMultiStepFormHelperService: any,
    private http: HttpClient,
    private broadcastService: BroadcastService,
    @Inject('kommonitorConfigStorageService') private kommonitorConfigStorageService: any
  ) {
    console.log('IndicatorAddModalComponent constructor initialized - Modal is being created');
  }

  ngOnInit() {
    console.log('IndicatorAddModalComponent ngOnInit - Modal is being initialized');
    this.loadInitialData();
    this.initializeMultiStepForm();
    console.log('IndicatorAddModalComponent ngOnInit - Modal initialization complete');
    console.log('Current step:', this.currentStep);
    console.log('Total steps:', this.totalSteps);
  }

  private loadInitialData() {
    this.loadingData = true;
    
    // Load available spatial units
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.availableSpatialUnits) {
      this.availableSpatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits;
      this.indicatorLowestSpatialUnitMetadataObjectForComputation = this.availableSpatialUnits.length > 0 ? this.availableSpatialUnits[0] : null;
    }

    // Load update interval options
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.updateIntervalOptions) {
      this.updateIntervalOptions = this.kommonitorDataExchangeService.updateIntervalOptions;
    }

    // Load indicator type options
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.indicatorTypeOptions) {
      this.indicatorTypeOptions = this.kommonitorDataExchangeService.indicatorTypeOptions;
      this.indicatorType = this.indicatorTypeOptions.length > 0 ? this.indicatorTypeOptions[0] : null;
    }

    // Load available indicators
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.availableIndicators) {
      this.availableIndicators = this.kommonitorDataExchangeService.availableIndicators;
    }

    // Load available georesources
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.availableGeoresources) {
      this.availableGeoresources = this.kommonitorDataExchangeService.availableGeoresources;
    }

    // Load available topics
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.availableTopics) {
      this.availableTopics = this.kommonitorDataExchangeService.availableTopics;
    }

    // Load access control
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.accessControl) {
      this.accessControl = this.kommonitorDataExchangeService.accessControl;
    }

    // Load color brewer schemes
    this.loadColorBrewerSchemes();

    // Initialize filtered lists for Step 4
    this.filteredIndicators = this.availableIndicators || [];
    this.filteredGeoresources = this.availableGeoresources || [];

    // Initialize data for Step 7
    this.filteredOrganizations = this.accessControl || [];
    this.filteredRoles = this.accessControl || [];
    this.availableRegions = this.availableSpatialUnits || [];

    this.loadingData = false;
  }

  private initializeMultiStepForm() {
    // Initialize multi-step form based on security settings
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.enableKeycloakSecurity) {
      this.totalSteps = 7; // Include role management step
    } else {
      this.totalSteps = 6;
    }

    // Initialize role management if available
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.accessControl && this.kommonitorDataGridHelperService) {
      this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
        'indicatorAddRoleManagementTable', 
        this.roleManagementTableOptions, 
        this.kommonitorDataExchangeService.accessControl, 
        []
      );
    }

    // Initialize classification
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }

  private loadColorBrewerSchemes() {
    // Load color brewer schemes from environment or default
    const customColorSchemes = (window as any).__env?.customColorSchemes;
    this.colorbrewerSchemes = (window as any).colorbrewer || {};
    
    if (customColorSchemes) {
      this.colorbrewerSchemes = Object.assign(customColorSchemes, this.colorbrewerSchemes);
    }

    this.instantiateColorBrewerPalettes();
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

    // Instantiate with palette 'Blues'
    this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes[13] || this.colorbrewerPalettes[0];
  }

  checkDatasetName() {
    this.datasetNameInvalid = false;
    
    if (this.datasetName && this.indicatorType && this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.availableIndicators) {
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

  // Build post body for API request
  buildPostBody_indicators() {
    // Convert references to API format
    this.convertReferencesToApiFormat();

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
        "sridEPSG": this.metadata.sridEPSG,
        "datasource": this.metadata.datasource,
        "contact": this.metadata.contact,
        "lastUpdate": this.metadata.lastUpdate,
        "description": this.metadata.description,
        "databasis": this.metadata.databasis
      },
      "allowedRoles": [] as string[],
      "refrencesToOtherIndicators": this.indicatorReferences_apiRequest,
      "refrencesToGeoresources": this.georesourceReferences_apiRequest,
      "defaultClassificationMapping": {
        "colorBrewerSchemeName": this.selectedColorBrewerPaletteEntry?.paletteName,
        "numClasses": this.numClassesPerSpatialUnit,
        "classificationMethod": this.classificationMethod,
        "items": this.spatialUnitClassification.map(classification => ({
          "spatialUnit": classification.spatialUnitId,
          "breaks": classification.breaks.filter(breakVal => breakVal !== null)
        }))
      }
    };

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
    if (this.roleManagementTableOptions && this.kommonitorDataGridHelperService) {
      const roleIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          postBody.allowedRoles.push(roleId);
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

      // Check if service is available
      if (!this.kommonitorDataExchangeService || !this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI) {
        throw new Error('Data exchange service not available');
      }

      const response = await this.http.post(
        this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators",
        this.postBody_indicators
      ).toPromise();

      this.broadcastService.broadcast("refreshIndicatorOverviewTable", ["add", (response as any).indicatorId]);

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
      if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.syntaxHighlightJSON) {
      if (error.data) {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        }
      } else {
        this.errorMessagePart = error.message || 'An error occurred';
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
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    const maxSteps = this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.enableKeycloakSecurity ? 7 : 6;
    
    // Allow navigation to any step without validation (like old AngularJS counterpart)
    if (step >= 1 && step <= maxSteps) {
    console.log(`Navigating to step: ${step}`);
    this.currentStep = step;
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
    
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.updateIntervalOptions) {
    this.kommonitorDataExchangeService.updateIntervalOptions.forEach((option: any) => {
      if (option.apiName === this.metadataImportSettings.metadata.updateInterval) {
        this.metadata.updateInterval = option;
      }
    });
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
    this.indicatorUnit = this.metadataImportSettings.unit || '';
    this.indicatorProcessDescription = this.metadataImportSettings.processDescription || '';
    this.indicatorInterpretation = this.metadataImportSettings.interpretation || '';
    this.indicatorReferenceDateNote = this.metadataImportSettings.referenceDateNote || '';
    this.displayOrder = this.metadataImportSettings.displayOrder || 0;
    this.isHeadlineIndicator = this.metadataImportSettings.isHeadlineIndicator || false;

    // Parse indicator type
    if (this.metadataImportSettings.indicatorType && this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.indicatorTypeOptions) {
      this.kommonitorDataExchangeService.indicatorTypeOptions.forEach((option: any) => {
        if (option.apiName === this.metadataImportSettings.indicatorType) {
          this.indicatorType = option;
        }
      });
    }

    // Parse creation type
    if (this.metadataImportSettings.creationType) {
      // Add creation type options if available
      // this.indicatorCreationType = ...
    }

    // Parse tags
    if (this.metadataImportSettings.tags && Array.isArray(this.metadataImportSettings.tags)) {
      this.indicatorTagsString_withCommas = this.metadataImportSettings.tags.join(', ');
    }

    // Parse references
    if (this.metadataImportSettings.refrencesToOtherIndicators && this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.availableIndicators) {
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

    if (this.metadataImportSettings.refrencesToGeoresources && this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.availableGeoresources) {
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

    // Parse classification mapping
    if (this.metadataImportSettings.defaultClassificationMapping) {
      const mapping = this.metadataImportSettings.defaultClassificationMapping;
      this.numClassesPerSpatialUnit = mapping.numClasses || 5;
      this.classificationMethod = mapping.classificationMethod || 'jenks';
      
      // Set color brewer palette
      if (mapping.colorBrewerSchemeName) {
        this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes.find(palette => 
          palette.paletteName === mapping.colorBrewerSchemeName
        );
      }

      // Parse spatial unit classification
      if (mapping.items) {
        this.onNumClassesChanged(this.numClassesPerSpatialUnit);
        mapping.items.forEach((item: any) => {
          const index = this.spatialUnitClassification.findIndex(classification => 
            classification.spatialUnitId === item.spatialUnit
          );
          if (index > -1) {
            this.spatialUnitClassification[index].breaks = item.breaks;
          }
        });
      }
    }

    // Parse role permissions
    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.accessControl && this.metadataImportSettings.allowedRoles && this.kommonitorDataGridHelperService) {
      this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
        'indicatorAddRoleManagementTable', 
        this.roleManagementTableOptions, 
        this.kommonitorDataExchangeService.accessControl, 
        this.metadataImportSettings.allowedRoles
      );
    }
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

    // Add classification mapping
    metadataExport.defaultClassificationMapping = {
      colorBrewerSchemeName: this.selectedColorBrewerPaletteEntry?.paletteName,
      numClasses: this.numClassesPerSpatialUnit,
      classificationMethod: this.classificationMethod,
      items: this.spatialUnitClassification.map(classification => ({
        spatialUnit: classification.spatialUnitId,
        breaks: classification.breaks.filter(breakVal => breakVal !== null)
      }))
    };

    // Add role permissions
    metadataExport.allowedRoles = [];
    if (this.roleManagementTableOptions && this.kommonitorDataGridHelperService) {
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
    this.indicatorUnit = '';
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
        indicator.datasetName && indicator.datasetName.toLowerCase().includes(filter)
      );
    }
  }

  filterGeoresources() {
    if (!this.georesourceNameFilter || this.georesourceNameFilter.trim() === '') {
      this.filteredGeoresources = this.availableGeoresources || [];
    } else {
      const filter = this.georesourceNameFilter.toLowerCase().trim();
      this.filteredGeoresources = (this.availableGeoresources || []).filter(georesource =>
        georesource.datasetName && georesource.datasetName.toLowerCase().includes(filter)
      );
    }
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

  // Override existing classification methods to work with Step 5
  onClassificationMethodSelected(method: any) {
    this.classificationMethod = method;
    // Reinitialize classification when method changes
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }

  onClickColorBrewerEntry(colorPaletteEntry: any) {
    this.selectedColorBrewerPaletteEntry = colorPaletteEntry;
  }

  onNumClassesChanged(numClasses: number) {
    this.numClassesPerSpatialUnit = numClasses;
    
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
    let cssClass = 'active';
    this.classBreaksInvalid = false;
    
    // Validate breaks for manual classification
    if (this.classificationMethod === 'manual') {
      let lastValidBreak = null;
      for (let i = 0; i < breaks.length; i++) {
        if (breaks[i] !== null && breaks[i] !== undefined) {
          if (lastValidBreak !== null && breaks[i] <= lastValidBreak) {
            cssClass = 'tab-error';
            this.classBreaksInvalid = true;
            break;
          }
          lastValidBreak = breaks[i];
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

  cancel() {
    console.log('Modal cancelled');
    this.activeModal.dismiss('cancel');
  }
} 