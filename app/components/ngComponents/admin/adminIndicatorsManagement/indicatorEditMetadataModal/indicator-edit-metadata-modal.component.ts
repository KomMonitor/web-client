import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';
import { KommonitorIndicatorCacheHelperService } from 'services/adminIndicatorUnit/kommonitor-cache-helper.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

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

  private subscriptions: Subscription[] = [];

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

  // Messages
  successMessagePart = '';
  errorMessagePart = '';
  indicatorMetadataImportError = '';
  indicatorAddMetadataImportErrorAlert = false;

  // Loading state
  loadingData = false;

  // Color brewer
  colorbrewerSchemes = colorbrewer;
  colorbreweSchemeName_dynamicIncrease = __env?.defaultColorBrewerPaletteForBalanceIncreasingValues;
  colorbreweSchemeName_dynamicDecrease = __env?.defaultColorBrewerPaletteForBalanceDecreasingValues;
  colorbrewerPalettes: any[] = [];

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
    this.setupEventListeners();
    this.instantiateColorBrewerPalettes();
    this.indicatorMetadataStructure_pretty = this.kommonitorDataExchangeService.syntaxHighlightJSON(this.indicatorMetadataStructure);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    const sub = this.broadcastService.currentBroadcastMsg.subscribe(data => {
      if (data.msg === 'onEditIndicatorMetadata') {
        this.currentIndicatorDataset = data.values;
        this.resetIndicatorEditMetadataForm();
      }
    });
    this.subscriptions.push(sub);
  }

  openModal(): void {
    // Modal is already opened by the parent component
    // This method is called after the modal is already open
    this.resetIndicatorEditMetadataForm();
    this.instantiateColorBrewerPalettes();
  }

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
  }

  onClassificationMethodSelected(method: any): void {
    this.classificationMethod = method.id;
  }

  onNumClassesChanged(numClasses: number): void {
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
    const increaseBreaksLength = this.spatialUnitClassification[tabIndex].breaks.filter((val: number) => val > 0).length;
    const decreaseBreaksLength = this.spatialUnitClassification[tabIndex].breaks.filter((val: number) => val < 0).length;
    
    if (increaseBreaksLength < 3) {
      // Handle minimum increase breaks
    }
    if (decreaseBreaksLength < 3) {
      // Handle minimum decrease breaks
    }
  }

  refreshReferenceValuesManagementTable(): void {
    this.regionalReferenceValuesManagementTableOptions = this.kommonitorDataGridHelperService.buildReferenceValuesManagementGrid(
      this.regionalReferenceValuesManagementTableOptions
    );
  }

  resetIndicatorEditMetadataForm(): void {
    this.successMessagePart = '';
    this.errorMessagePart = '';

    this.datasetName = this.currentIndicatorDataset.indicatorName;
    this.datasetNameInvalid = false;

    this.indicatorReferenceDateNote = this.currentIndicatorDataset.referenceDateNote;
    this.displayOrder = this.currentIndicatorDataset.displayOrder;

    // Reset metadata
    this.metadata = {
      note: this.currentIndicatorDataset.metadata.note,
      literature: this.currentIndicatorDataset.metadata.literature,
      sridEPSG: 4326,
      datasource: this.currentIndicatorDataset.metadata.datasource,
      databasis: this.currentIndicatorDataset.metadata.databasis,
      contact: this.currentIndicatorDataset.metadata.contact,
      description: this.currentIndicatorDataset.metadata.description,
      lastUpdate: this.currentIndicatorDataset.metadata.lastUpdate
    };

    // Set update interval
    this.kommonitorDataExchangeService.updateIntervalOptions.forEach((option: any) => {
      if (option.apiName === this.currentIndicatorDataset.metadata.updateInterval) {
        this.metadata.updateInterval = option;
      }
    });

    this.refreshReferenceValuesManagementTable();

    this.indicatorAbbreviation = this.currentIndicatorDataset.abbreviation;
    this.indicatorPrecision = this.currentIndicatorDataset.precision;

    if (this.currentIndicatorDataset.defaultPrecision === false) {
      this.showCustomCommaValue = true;
    } else {
      this.showCustomCommaValue = false;
    }

    // Set indicator type
    this.kommonitorDataExchangeService.indicatorTypeOptions.forEach((option: any) => {
      if (option.apiName === this.currentIndicatorDataset.indicatorType) {
        this.indicatorType = option;
      }
    });

    this.isHeadlineIndicator = this.currentIndicatorDataset.isHeadlineIndicator;
    this.indicatorUnit = this.currentIndicatorDataset.unit;

    this.enableFreeTextUnit = true;
    this.kommonitorDataExchangeService.indicatorUnitOptions.forEach((option: any) => {
      if (option === this.currentIndicatorDataset.unit) {
        this.enableFreeTextUnit = false;
      }
    });

    this.indicatorProcessDescription = this.currentIndicatorDataset.processDescription;
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

    this.indicatorInterpretation = this.currentIndicatorDataset.interpretation;

    // Set creation type
    this.kommonitorDataExchangeService.indicatorCreationTypeOptions.forEach((option: any) => {
      if (option.apiName === this.currentIndicatorDataset.creationType) {
        this.indicatorCreationType = option;
      }
    });

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
        const referenceEntry = {
          "referencedIndicatorName": indicatorMetadata.indicatorName,
          "referencedIndicatorId": indicatorMetadata.indicatorId,
          "referencedIndicatorAbbreviation": indicatorMetadata.abbreviation,
          "referencedIndicatorDescription": indicatorReference.referencedIndicatorDescription
        };
        this.indicatorReferences_adminView.push(referenceEntry);
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
        const geo_referenceEntry = {
          "referencedGeoresourceName": georesourceMetadata.datasetName,
          "referencedGeoresourceId": georesourceMetadata.georesourceId,
          "referencedGeoresourceDescription": georesourceReference.referencedGeoresourceDescription
        };
        this.georesourceReferences_adminView.push(geo_referenceEntry);
      }
    }

    // Reset classification
    this.numClassesArray = [3, 4, 5, 6, 7, 8];
    this.numClassesPerSpatialUnit = null;
    this.classificationMethod = __env?.defaultClassifyMethod || 'jenks';
    this.spatialUnitClassification = [];
    this.classBreaksInvalid = false;

    if (this.currentIndicatorDataset.defaultClassificationMapping.classificationMethod) {
      this.classificationMethod = this.currentIndicatorDataset.defaultClassificationMapping.classificationMethod.toLowerCase();
    }
    if (this.currentIndicatorDataset.defaultClassificationMapping.numClasses) {
      this.numClassesPerSpatialUnit = this.currentIndicatorDataset.defaultClassificationMapping.numClasses;
      this.onNumClassesChanged(this.numClassesPerSpatialUnit || 5);
      
      // apply breaks for spatial units:
      for (let i = 0; i < this.spatialUnitClassification.length; i++) {
        for (let item of this.currentIndicatorDataset.defaultClassificationMapping.items) {
          if (item.spatialUnitId == this.spatialUnitClassification[i].spatialUnitId) {
            this.spatialUnitClassification[i] = item;
            this.onBreaksChanged(i);
          }
        }
      }
    }
    
    // instantiate with palette 'Blues'
    this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes[13];

    for (const colorbrewerPalette of this.colorbrewerPalettes) {
      if (colorbrewerPalette.paletteName === this.currentIndicatorDataset.defaultClassificationMapping.colorBrewerSchemeName) {
        this.selectedColorBrewerPaletteEntry = colorbrewerPalette;
        break;
      }
    }

    this.successMessagePart = '';
    this.errorMessagePart = '';
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
    this.tmpIndicatorReference_selectedIndicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorReference_adminView.referencedIndicatorId);
    this.tmpIndicatorReference_referenceDescription = indicatorReference_adminView.referencedIndicatorDescription;
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
    const tmpGeoresourceReference_adminView = {
      "referencedGeoresourceName": this.tmpGeoresourceReference_selectedGeoresourceMetadata.datasetName,
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
    this.tmpGeoresourceReference_selectedGeoresourceMetadata = this.kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceReference_adminView.referencedGeoresourceId);
    this.tmpGeoresourceReference_referenceDescription = georesourceReference_adminView.referencedGeoresourceDescription;
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

    this.http.patch(
      this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + this.currentIndicatorDataset.indicatorId,
      patchBody
    ).subscribe({
      next: (response: any) => {
        this.successMessagePart = this.datasetName;
        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { crudType: 'edit', targetIndicatorId: this.currentIndicatorDataset.indicatorId });
        this.loadingData = false;
      },
      error: (error: any) => {
        console.error("Error while updating indicator metadata.");
        if (error.data?.message) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data.message);
        } else if (error.data) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
        } else {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        }
        this.loadingData = false;
      }
    });
  }

  hideSuccessAlert(): void {
    this.successMessagePart = '';
  }

  hideErrorAlert(): void {
    this.errorMessagePart = '';
  }

  hideMetadataErrorAlert(): void {
    this.indicatorAddMetadataImportErrorAlert = false;
  }
} 