import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { KommonitorImporterHelperService } from '../../../../../services/adminSpatialUnit/kommonitor-importer-helper.service';
import { KommonitorDataGridHelperService } from '../../../../../services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { KommonitorDataExchangeService } from '../../../../../services/adminSpatialUnit/kommonitor-data-exchange.service';

@Component({
  selector: 'spatial-unit-add-modal-new',
  templateUrl: './spatial-unit-add-modal.component.html',
  styleUrls: ['./spatial-unit-add-modal.component.css']
})
export class SpatialUnitAddModalComponent implements OnInit {
  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('spatialUnitDataSourceInput', { static: false }) spatialUnitDataSourceInput!: ElementRef;

  // Multi-step form
  currentStep = 1;
  totalSteps = 3; // Will be adjusted based on security settings

  // Form data
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
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
    sridEPSG: 4326
  };

  // Hierarchy
  nextLowerHierarchySpatialUnit: any = null;
  nextUpperHierarchySpatialUnit: any = null;
  hierarchyInvalid = false;

  // Outline layer settings
  isOutlineLayer = false;
  loiColor = '#bf3d2c';
  outlineWidth = 2;
  outlineDashArray: any = null;

  // Period of validity
  periodOfValidity: { startDate: string; endDate: string } = {
    startDate: '',
    endDate: ''
  };
  periodOfValidityInvalid = false;

  // Available options
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  availableDatasourceTypes: any[] = [];
  availableLoiDashArrayObjects: any[] = [];

  // Importer functionality
  converter: any = null;
  schema: string = '';
  mimeType: string = '';
  datasourceType: any = null;
  spatialUnitDataSourceIdProperty = '';
  spatialUnitDataSourceIdPropertyInvalid = false;
  spatialUnitDataSourceNameProperty = '';
  spatialUnitDataSourceNamePropertyInvalid = false;

  // Bbox parameters for OGCAPI_FEATURES
  bboxType: string = '';
  bboxRefSpatialUnit: any = null;

  // Attribute mapping
  attributeMapping_sourceAttributeName = '';
  attributeMapping_destinationAttributeName = '';
  attributeMapping_attributeType: any = null;
  attributeMappings_adminView: any[] = [];
  keepAttributes = true;
  keepMissingValues = true;

  // Validity dates per feature
  validityStartDate_perFeature = '';
  validityEndDate_perFeature = '';

  // Role management
  roleManagementTableOptions: any = null;
  ownerOrganization = '';
  ownerOrgFilter = '';
  isPublic = false;
  resourcesCreatorRights: any[] = [];

  // Import/Export functionality
  metadataImportSettings: any = null;
  mappingConfigImportSettings: any = null;
  spatialUnitMetadataImportError = '';
  spatialUnitMappingConfigImportError = '';

  // Success/Error data
  successMessagePart = '';
  errorMessagePart = '';
  importerErrors: any[] = [];
  importedFeatures: any[] = [];

  // Importer objects
  converterDefinition: any = null;
  datasourceTypeDefinition: any = null;
  propertyMappingDefinition: any = null;
  postBody_spatialUnits: any = null;

  // Validation flags
  idPropertyNotFound = false;
  namePropertyNotFound = false;
  spatialUnitDataSourceInputInvalid = false;
  spatialUnitDataSourceInputInvalidReason = '';

  constructor(
    public activeModal: NgbActiveModal,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    public kommonitorImporterHelperService: KommonitorImporterHelperService,
    private kommonitorDataGridHelperService: KommonitorDataGridHelperService,
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) {
    console.log('SpatialUnitAddModalComponent constructor initialized - Modal is being created');
  }

  ngOnInit() {
    console.log('SpatialUnitAddModalComponent ngOnInit - Modal is being initialized');
    this.loadInitialData();
    this.initializeMultiStepForm();
    console.log('SpatialUnitAddModalComponent ngOnInit - Modal initialization complete');
    console.log('Current step:', this.currentStep);
    console.log('Total steps:', this.totalSteps);
  }

  private loadInitialData() {
    this.loadingData = true;
    
    // Load available spatial units
    if (this.kommonitorDataExchangeService.availableSpatialUnits) {
      this.availableSpatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits;
    }

    // Load update interval options
    if (this.kommonitorDataExchangeService.updateIntervalOptions) {
      this.updateIntervalOptions = this.kommonitorDataExchangeService.updateIntervalOptions;
    }

    // Initialize attribute mapping types
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    if (attributeMappingTypes && attributeMappingTypes.length > 0) {
      this.attributeMapping_attributeType = attributeMappingTypes[0];
    }

    // Load converters and datasource types
    this.loadConverters();
    this.loadDatasourceTypes();

    this.loadingData = false;
  }

  private initializeMultiStepForm() {
    // Initialize multi-step form based on security settings
    if (this.kommonitorDataExchangeService.accessControl && 
        this.kommonitorDataExchangeService.accessControl.length > 0) {
      this.totalSteps = 5; // Include role management step
    } else {
      this.totalSteps = 4;
    }

    // Initialize role management if available
    if (this.kommonitorDataExchangeService.accessControl && 
        this.kommonitorDataExchangeService.accessControl.length > 0) {
      this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
        'spatialUnitAddRoleManagementTable', 
        this.roleManagementTableOptions, 
        this.kommonitorDataExchangeService.accessControl, 
        []
      );
    }
  }

  private loadConverters(): void {
    const converters = this.kommonitorImporterHelperService.getAvailableConverters();
    if (converters) {
      // Filter converters for spatial units
      this.availableDatasourceTypes = converters
        .filter((converter: any) => converter.type === 'spatialUnit');
    }
  }

  private loadDatasourceTypes(): void {
    const datasourceTypes = this.kommonitorImporterHelperService.getAvailableDatasourceTypes();
    if (datasourceTypes) {
      this.availableDatasourceTypes = datasourceTypes;
    }
  }

  checkSpatialUnitName() {
    this.spatialUnitLevelInvalid = false;
    const level = this.spatialUnitLevel;
    
    if (level) {
      this.availableSpatialUnits.forEach(spatialUnit => {
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

      if ((indexOfLowerHierarchyUnit! <= indexOfUpperHierarchyUnit!)) {
        // failure
        this.hierarchyInvalid = true;
      }
    }
  }

  checkPeriodOfValidity() {
    this.periodOfValidityInvalid = false;
    if (this.periodOfValidity.startDate && this.periodOfValidity.endDate) {
      const startDate = new Date(this.periodOfValidity.startDate);
      const endDate = new Date(this.periodOfValidity.endDate);

      if ((startDate.getTime() === endDate.getTime()) || startDate > endDate) {
        // failure
        this.periodOfValidityInvalid = true;
      }
    }
  }

  // Attribute mapping methods
  onAddOrUpdateAttributeMapping() {
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
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    this.attributeMapping_attributeType = attributeMappingTypes[0];
  }

  onClickEditAttributeMapping(attributeMappingEntry: any) {
    this.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
    this.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
    this.attributeMapping_attributeType = attributeMappingEntry.dataType;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any) {
    for (let index = 0; index < this.attributeMappings_adminView.length; index++) {
      if (this.attributeMappings_adminView[index].sourceName === attributeMappingEntry.sourceName) {
        // remove object
        this.attributeMappings_adminView.splice(index, 1);
        break;
      }
    }
  }

  onChangeConverter(schema?: any) {
    this.schema = this.converter.schemas ? this.converter.schemas[0] : undefined;
    this.mimeType = this.converter.mimeTypes ? this.converter.mimeTypes[0] : undefined;
  }

  onChangeMimeType(mimeType: any) {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any) {
    // Handle datasource type change
    this.datasourceType = datasourceType;
    // Reset related fields when datasource type changes
    this.spatialUnitDataSourceIdProperty = '';
    this.spatialUnitDataSourceNameProperty = '';
    this.bboxType = '';
    this.bboxRefSpatialUnit = null;
  }

  onChangeOutlineDashArray(outlineDashArrayObject: any) {
    // Handle outline dash array change
    this.outlineDashArray = outlineDashArrayObject;
  }

  // Importer object building methods
  async buildImporterObjects() {
    console.log('=== BUILDING IMPORTER OBJECTS - START ===');
    
    console.log('Building converter definition...');
    this.converterDefinition = this.buildConverterDefinition();
    console.log('- converterDefinition result:', this.converterDefinition);
    
    console.log('Building datasource type definition...');
    this.datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    console.log('- datasourceTypeDefinition result:', this.datasourceTypeDefinition);
    
    console.log('Building property mapping definition...');
    this.propertyMappingDefinition = this.buildPropertyMappingDefinition();
    console.log('- propertyMappingDefinition result:', this.propertyMappingDefinition);
    
    console.log('Building post body for spatial units...');
    this.postBody_spatialUnits = this.buildPostBody_spatialUnits();
    console.log('- postBody_spatialUnits result:', this.postBody_spatialUnits);

    const allValid = this.converterDefinition && 
                    this.datasourceTypeDefinition && 
                    this.propertyMappingDefinition && 
                    this.postBody_spatialUnits;
    
    console.log('=== BUILDING IMPORTER OBJECTS - END ===');
    console.log('- All objects valid:', allValid);
    console.log('- converterDefinition valid:', !!this.converterDefinition);
    console.log('- datasourceTypeDefinition valid:', !!this.datasourceTypeDefinition);
    console.log('- propertyMappingDefinition valid:', !!this.propertyMappingDefinition);
    console.log('- postBody_spatialUnits valid:', !!this.postBody_spatialUnits);

    if (!allValid) {
      console.error('=== BUILDING IMPORTER OBJECTS - FAILED ===');
      console.error('One or more required objects could not be built');
    }

    return allValid;
  }

  buildConverterDefinition() {
    console.log('=== BUILDING CONVERTER DEFINITION ===');
    console.log('- converter:', this.converter);
    console.log('- schema:', this.schema);
    console.log('- mimeType:', this.mimeType);
    
    const result = this.kommonitorImporterHelperService.buildConverterDefinition(
      this.converter, 
      "converterParameter_spatialUnitAdd_", 
      this.schema, 
      this.mimeType
    );
    
    console.log('- buildConverterDefinition result:', result);
    return result;
  }

  async buildDatasourceTypeDefinition() {
    console.log('=== BUILDING DATASOURCE TYPE DEFINITION ===');
    console.log('- datasourceType:', this.datasourceType);
    
    try {
      const result = await this.kommonitorImporterHelperService.buildDatasourceTypeDefinition(
        this.datasourceType, 
        'datasourceTypeParameter_spatialUnitAdd_', 
        'spatialUnitDataSourceInput'
      );
      
      console.log('- buildDatasourceTypeDefinition result:', result);
      return result;
    } catch (error: any) {
      console.error('=== BUILDING DATASOURCE TYPE DEFINITION - ERROR ===');
      console.error('- Error:', error);
      console.error('- Error data:', error.data);
      
      if (error.data) {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }

      this.loadingData = false;
      return null;
    }
  }

  buildPropertyMappingDefinition() {
    console.log('=== BUILDING PROPERTY MAPPING DEFINITION ===');
    console.log('- spatialUnitDataSourceNameProperty:', this.spatialUnitDataSourceNameProperty);
    console.log('- spatialUnitDataSourceIdProperty:', this.spatialUnitDataSourceIdProperty);
    console.log('- validityStartDate_perFeature:', this.validityStartDate_perFeature);
    console.log('- validityEndDate_perFeature:', this.validityEndDate_perFeature);
    console.log('- keepAttributes:', this.keepAttributes);
    console.log('- keepMissingValues:', this.keepMissingValues);
    console.log('- attributeMappings_adminView:', this.attributeMappings_adminView);
    
    // arsion from is undefined currently
    const result = this.kommonitorImporterHelperService.buildPropertyMapping_spatialResource(
      this.spatialUnitDataSourceNameProperty, 
      this.spatialUnitDataSourceIdProperty, 
      this.validityStartDate_perFeature, 
      this.validityEndDate_perFeature, 
      '', // empty string instead of undefined
      this.keepAttributes, 
      this.keepMissingValues, 
      this.attributeMappings_adminView
    );
    
    console.log('- buildPropertyMappingDefinition result:', result);
    return result;
  }

  buildPostBody_spatialUnits() {
    console.log('=== BUILDING POST BODY FOR SPATIAL UNITS ===');
    console.log('- metadata:', this.metadata);
    console.log('- nextLowerHierarchySpatialUnit:', this.nextLowerHierarchySpatialUnit);
    console.log('- nextUpperHierarchySpatialUnit:', this.nextUpperHierarchySpatialUnit);
    console.log('- spatialUnitLevel:', this.spatialUnitLevel);
    console.log('- periodOfValidity:', this.periodOfValidity);
    console.log('- roleManagementTableOptions:', this.roleManagementTableOptions);
    
    const postBody: any = {
      "geoJsonString": "", // will be set by importer
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
      "jsonSchema": undefined,
      "allowedRoles": [] as string[],
      "nextLowerHierarchyLevel": this.nextLowerHierarchySpatialUnit ? this.nextLowerHierarchySpatialUnit.spatialUnitLevel : null,
      "spatialUnitLevel": this.spatialUnitLevel,
      "periodOfValidity": {
        "endDate": this.periodOfValidity && this.periodOfValidity.endDate ? this.periodOfValidity.endDate : null,
        "startDate": this.periodOfValidity && this.periodOfValidity.startDate ? this.periodOfValidity.startDate : null
      },
      "nextUpperHierarchyLevel": this.nextUpperHierarchySpatialUnit ? this.nextUpperHierarchySpatialUnit.spatialUnitLevel : null
    };

    if (this.roleManagementTableOptions) {
      const roleIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
      console.log('- roleIds from grid:', roleIds);
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          postBody.allowedRoles.push(roleId);
        }
      }
    }

    console.log('- buildPostBody_spatialUnits result:', postBody);
    return postBody;
  }

  async addSpatialUnit() {
    console.log('=== SPATIAL UNIT ADD - START ===');
    console.log('Current form state:');
    console.log('- spatialUnitLevel:', this.spatialUnitLevel);
    console.log('- metadata:', this.metadata);
    console.log('- converter:', this.converter);
    console.log('- datasourceType:', this.datasourceType);
    console.log('- currentStep:', this.currentStep);
    console.log('- totalSteps:', this.totalSteps);
    
    this.loadingData = true;
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';

    console.log('=== BUILDING IMPORTER OBJECTS ===');
    // now collect data and build request for importer
    const allDataSpecified = await this.buildImporterObjects();

    console.log('=== IMPORTER OBJECTS RESULT ===');
    console.log('- allDataSpecified:', allDataSpecified);
    console.log('- converterDefinition:', this.converterDefinition);
    console.log('- datasourceTypeDefinition:', this.datasourceTypeDefinition);
    console.log('- propertyMappingDefinition:', this.propertyMappingDefinition);
    console.log('- postBody_spatialUnits:', this.postBody_spatialUnits);

    if (!allDataSpecified) {
      console.error('=== VALIDATION FAILED ===');
      console.error('- Not all data was specified correctly');
      console.error('- converterDefinition exists:', !!this.converterDefinition);
      console.error('- datasourceTypeDefinition exists:', !!this.datasourceTypeDefinition);
      console.error('- propertyMappingDefinition exists:', !!this.propertyMappingDefinition);
      console.error('- postBody_spatialUnits exists:', !!this.postBody_spatialUnits);
      
      // TODO: Add form validation here
      this.loadingData = false;
      return;
    } else {
      console.log('=== VALIDATION PASSED - PROCEEDING WITH DRY RUN ===');
      // TODO verify input
      // TODO Create and perform POST Request with loading screen

      let newSpatialUnitResponse_dryRun: any = undefined;
      try {
        console.log('=== STARTING DRY RUN ===');
        console.log('Calling kommonitorImporterHelperService.registerNewSpatialUnit with dryRun=true');
        
        newSpatialUnitResponse_dryRun = await this.kommonitorImporterHelperService.registerNewSpatialUnit(
          this.converterDefinition,
          this.datasourceTypeDefinition,
          this.propertyMappingDefinition,
          this.postBody_spatialUnits,
          true // isDryRun
        );

        console.log('=== DRY RUN RESPONSE ===');
        console.log('- newSpatialUnitResponse_dryRun:', newSpatialUnitResponse_dryRun);
        console.log('- Response contains errors:', this.kommonitorImporterHelperService.importerResponseContainsErrors(newSpatialUnitResponse_dryRun));

        if (!this.kommonitorImporterHelperService.importerResponseContainsErrors(newSpatialUnitResponse_dryRun)) {
          console.log('=== DRY RUN SUCCESSFUL - PROCEEDING WITH ACTUAL IMPORT ===');
          // all good, really execute the request to import data against data management API
          const newSpatialUnitResponse = await this.kommonitorImporterHelperService.registerNewSpatialUnit(
            this.converterDefinition,
            this.datasourceTypeDefinition,
            this.propertyMappingDefinition,
            this.postBody_spatialUnits,
            false // isDryRun
          );

          console.log('=== ACTUAL IMPORT RESPONSE ===');
          console.log('- newSpatialUnitResponse:', newSpatialUnitResponse);
          console.log('- Imported ID:', this.kommonitorImporterHelperService.getIdFromImporterResponse(newSpatialUnitResponse));

          this.broadcastService.broadcast("refreshSpatialUnitOverviewTable", ["add", this.kommonitorImporterHelperService.getIdFromImporterResponse(newSpatialUnitResponse)]);

          // refresh all admin dashboard diagrams due to modified metadata
          setTimeout(() => {
            this.broadcastService.broadcast("refreshAdminDashboardDiagrams");
          }, 500);

          this.successMessagePart = this.postBody_spatialUnits.spatialUnitLevel;
          const importedFeatures = this.kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(newSpatialUnitResponse);
          this.importedFeatures = importedFeatures || [];

          console.log('=== IMPORT SUCCESSFUL ===');
          console.log('- successMessagePart:', this.successMessagePart);
          console.log('- importedFeatures count:', this.importedFeatures.length);

          this.loadingData = false;
        } else {
          console.error('=== DRY RUN FAILED WITH ERRORS ===');
          // errors occurred
          // show them 
          this.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
          const errors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(newSpatialUnitResponse_dryRun);
          this.importerErrors = errors || [];

          console.error('- errorMessagePart:', this.errorMessagePart);
          console.error('- importerErrors:', this.importerErrors);

          this.loadingData = false;
        }
      } catch (error: any) {
        console.error('=== EXCEPTION DURING IMPORT ===');
        console.error('- Error type:', typeof error);
        console.error('- Error:', error);
        console.error('- Error message:', error?.message);
        console.error('- Error data:', error?.data);
        console.error('- Error status:', error?.status);
        
        if (error.data) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        }

        if (newSpatialUnitResponse_dryRun) {
          const errors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(newSpatialUnitResponse_dryRun);
          this.importerErrors = errors || [];
          console.error('- Errors from dry run:', this.importerErrors);
        }

        this.loadingData = false;
      }
    }
    console.log('=== SPATIAL UNIT ADD - END ===');
  }

  onSubmit() {
    console.log('=== ON SUBMIT - START ===');
    console.log('Current form state:');
    console.log('- spatialUnitLevel:', this.spatialUnitLevel);
    console.log('- spatialUnitLevelInvalid:', this.spatialUnitLevelInvalid);
    console.log('- hierarchyInvalid:', this.hierarchyInvalid);
    console.log('- currentStep:', this.currentStep);
    console.log('- totalSteps:', this.totalSteps);

    if (!this.spatialUnitLevelInvalid && !this.hierarchyInvalid) {
      this.addSpatialUnit();
    } else {
      console.log('=== ON SUBMIT - FAILED VALIDATION ===');
      console.log('- spatialUnitLevelInvalid:', this.spatialUnitLevelInvalid);
      console.log('- hierarchyInvalid:', this.hierarchyInvalid);
      this.loadingData = false;
    }
    console.log('=== ON SUBMIT - END ===');
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
      console.log(`Invalid step: ${step}. Valid range: 1-${maxSteps}`);
      return;
    }

    // For now, allow navigation to any step for testing
    // TODO: Add validation back once basic navigation works
    console.log(`Navigating to step: ${step}`);
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
        this.spatialUnitMetadataImportError = "Uploaded Metadata File cannot be parsed correctly";
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
        this.spatialUnitMappingConfigImportError = "Uploaded MappingConfig File cannot be parsed correctly";
      }
    };

    fileReader.readAsText(file);
  }

  parseFromMetadataFile(event: any) {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      console.error("uploaded Metadata File cannot be parsed - wrong structure.");
      this.spatialUnitMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster überein.";
      return;
    }

    this.metadata = {};
    this.metadata.note = this.metadataImportSettings.metadata.note;
    this.metadata.literature = this.metadataImportSettings.metadata.literature;
    
    this.kommonitorDataExchangeService.updateIntervalOptions.forEach((option: any) => {
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

    if (this.kommonitorDataExchangeService.accessControl) {
      this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
        'spatialUnitAddRoleManagementTable', 
        this.roleManagementTableOptions, 
        this.kommonitorDataExchangeService.accessControl, 
        this.metadataImportSettings.allowedRoles
      );
    }

    for (let i = 0; i < this.kommonitorDataExchangeService.availableSpatialUnits.length; i++) {
      const spatialUnit = this.kommonitorDataExchangeService.availableSpatialUnits[i];
      if (spatialUnit.spatialUnitLevel === this.metadataImportSettings.nextLowerHierarchyLevel) {
        this.nextLowerHierarchySpatialUnit = spatialUnit;
      }
      if (spatialUnit.spatialUnitLevel === this.metadataImportSettings.nextUpperHierarchyLevel) {
        this.nextUpperHierarchySpatialUnit = spatialUnit;
      }
    }

    this.spatialUnitLevel = this.metadataImportSettings.spatialUnitLevel;
  }

  parseFromMappingConfigFile(event: any) {
    this.mappingConfigImportSettings = JSON.parse(event.target.result);

    if (!this.mappingConfigImportSettings.converter || !this.mappingConfigImportSettings.dataSource || !this.mappingConfigImportSettings.propertyMapping) {
      console.error("uploaded MappingConfig File cannot be parsed - wrong structure.");
      this.spatialUnitMappingConfigImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster überein.";
      return;
    }

    this.converter = undefined;
    const converters = this.kommonitorImporterHelperService.getAvailableConverters();
    for (const converter of converters) {
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

    this.datasourceType = null;
    const datasourceTypes = this.kommonitorImporterHelperService.getAvailableDatasourceTypes();
    for (const datasourceType of datasourceTypes) {
      if (datasourceType.type === this.mappingConfigImportSettings.dataSource.type) {
        this.datasourceType = datasourceType;
        break;
      }
    }

    // Property Mapping
    this.spatialUnitDataSourceNameProperty = this.mappingConfigImportSettings.propertyMapping.nameProperty;
    this.spatialUnitDataSourceIdProperty = this.mappingConfigImportSettings.propertyMapping.identifierProperty;
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

      const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    for (const dataType of attributeMappingTypes) {
        if (dataType.apiName === attributeMapping.type) {
          tmpEntry.dataType = dataType;
        }
      }

      this.attributeMappings_adminView.push(tmpEntry);
    }

    if (this.mappingConfigImportSettings.periodOfValidity) {
      this.periodOfValidity = {
        startDate: this.mappingConfigImportSettings.periodOfValidity.startDate || '',
        endDate: this.mappingConfigImportSettings.periodOfValidity.endDate || ''
      };
      this.periodOfValidityInvalid = false;
    }
  }

  onExportSpatialUnitAddMetadataTemplate() {
    const metadataJSON = JSON.stringify(this.spatialUnitMetadataStructure);
    const fileName = "Raumeinheit_Metadaten_Vorlage_Export.json";
    this.downloadFile(metadataJSON, fileName);
  }

  onExportSpatialUnitAddMetadata() {
    const metadataExport: any = { ...this.spatialUnitMetadataStructure };

    metadataExport.metadata.note = this.metadata.note || "";
    metadataExport.metadata.literature = this.metadata.literature || "";
    metadataExport.metadata.sridEPSG = this.metadata.sridEPSG || "";
    metadataExport.metadata.datasource = this.metadata.datasource || "";
    metadataExport.metadata.contact = this.metadata.contact || "";
    metadataExport.metadata.lastUpdate = this.metadata.lastUpdate || "";
    metadataExport.metadata.description = this.metadata.description || "";
    metadataExport.metadata.databasis = this.metadata.databasis || "";
    metadataExport.spatialUnitLevel = this.spatialUnitLevel || "";

    metadataExport.allowedRoles = [];
    if (this.roleManagementTableOptions) {
      const roleIds = this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
      for (const roleId of roleIds) {
        metadataExport.allowedRoles.push(roleId);
      }
    }

    if (this.metadata.updateInterval) {
      metadataExport.metadata.updateInterval = this.metadata.updateInterval.apiName;
    }
    if (this.nextLowerHierarchySpatialUnit) {
      metadataExport.nextLowerHierarchyLevel = this.nextLowerHierarchySpatialUnit.spatialUnitLevel;
    } else {
      metadataExport.nextLowerHierarchyLevel = "";
    }
    if (this.nextUpperHierarchySpatialUnit) {
      metadataExport.nextUpperHierarchyLevel = this.nextUpperHierarchySpatialUnit.spatialUnitLevel;
    } else {
      metadataExport.nextUpperHierarchyLevel = "";
    }

    const name = this.spatialUnitLevel;
    const metadataJSON = JSON.stringify(metadataExport);
    let fileName = "Raumeinheit_Metadaten_Export";

    if (name) {
      fileName += "-" + name;
    }

    fileName += ".json";
    this.downloadFile(metadataJSON, fileName);
  }

  async onExportSpatialUnitAddMappingConfig() {
    const converterDefinition = this.buildConverterDefinition();
    const datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    const propertyMappingDefinition = this.buildPropertyMappingDefinition();

    const mappingConfigExport = {
      "converter": converterDefinition,
      "dataSource": datasourceTypeDefinition,
      "propertyMapping": propertyMappingDefinition,
    };

    (mappingConfigExport as any).periodOfValidity = this.periodOfValidity;

    const name = this.spatialUnitLevel;
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
  get spatialUnitMetadataStructure() {
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
      "nextLowerHierarchyLevel": "",
      "spatialUnitLevel": "",
      "nextUpperHierarchyLevel": ""
    };
  }

  get spatialUnitMappingConfigStructure_pretty() {
    return JSON.stringify(this.spatialUnitMetadataStructure, null, 2);
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
      sridEPSG: 4326
    };
    this.nextLowerHierarchySpatialUnit = null;
    this.nextUpperHierarchySpatialUnit = null;
    this.hierarchyInvalid = false;
    this.periodOfValidity = { startDate: '', endDate: '' };
    this.periodOfValidityInvalid = false;
    this.isOutlineLayer = false;
    this.loiColor = '#bf3d2c';
    this.outlineWidth = 2;
    this.outlineDashArray = null;
    this.converter = null;
    this.schema = '';
    this.mimeType = '';
    this.datasourceType = null;
    this.spatialUnitDataSourceIdProperty = '';
    this.spatialUnitDataSourceNameProperty = '';
    this.validityStartDate_perFeature = '';
    this.validityEndDate_perFeature = '';
    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMappings_adminView = [];
    this.keepAttributes = true;
    this.keepMissingValues = true;
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.importerErrors = [];
    this.importedFeatures = [];
    this.converterDefinition = null;
    this.datasourceTypeDefinition = null;
    this.propertyMappingDefinition = null;
    this.postBody_spatialUnits = null;
    this.idPropertyNotFound = false;
    this.namePropertyNotFound = false;
    this.spatialUnitDataSourceInputInvalid = false;
    this.spatialUnitDataSourceInputInvalidReason = '';
    this.ownerOrganization = '';
    this.ownerOrgFilter = '';
    this.isPublic = false;
    this.roleManagementTableOptions = null;
    this.metadataImportSettings = null;
    this.mappingConfigImportSettings = null;
    this.spatialUnitMetadataImportError = '';
    this.spatialUnitMappingConfigImportError = '';
    this.resourcesCreatorRights = [];
    this.spatialUnitDataSourceIdPropertyInvalid = false;
    this.spatialUnitDataSourceNamePropertyInvalid = false;
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    this.attributeMapping_attributeType = attributeMappingTypes[0];
    this.errorMessage = '';
    this.successMessage = '';
  }

  hideSuccessAlert() {
    this.successMessage = '';
  }

  hideErrorAlert() {
    this.errorMessage = '';
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
  }

  onChangeIsPublic(isPublic: boolean) {
    // Handle public access change
    this.isPublic = isPublic;
  }

  cancel() {
    console.log('Modal cancelled');
    this.activeModal.dismiss('cancel');
  }
} 