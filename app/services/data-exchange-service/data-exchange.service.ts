import { Inject, Injectable } from '@angular/core';

export interface DataExchange {
  customGreetingsContact_mail: string;
  customGreetingsContact_name: string;
  customGreetingsContact_organisation: string;
  customGreetingsTextInfoMessage: string;
  selectedIndicator: Indicator;
  availableSpatialUnits: SpatialUnit[];
  selectedDate: any;
  selectedSpatialUnit: SpatialUnit;
  disableIndicatorDatePicker: boolean;
  isBalanceChecked: boolean;
  indicatorAndMetadataAsBalance: any;
  indicatorDatePrefix: string;
  measureOfValue: any;
  isMeasureOfValueChecked: any;
  useOutlierDetectionOnIndicator: any;
  classifyZeroSeparately: any;
  allFeaturesRegionalMean: any;
  enableMeanDataDisplayInLegend: any;
  labelMean_regional: any;
  labelMean: any;
  allFeaturesMean: any;
  configMeanDataDisplay: any;
  wmsDatasets_keywordFiltered: any;
  labelAllFeatures: any;
  labelFilteredFeatures: any;
  labelSelectedFeatures: any;
  labelNumberOfFeatures: any;
  allFeaturesNumberOfFeatures: any;
  selectedFeaturesNumberOfFeatures: any;
  labelSum: any;
  allFeaturesSum: any;
  labelSum_regional: any;
  allFeaturesRegionalSum: any;
  selectedFeaturesSum: any;
  selectedFeaturesMean: any;
  labelMin: any;
  labelMax: any;
  allFeaturesMin: any;
  selectedFeaturesMin: any;
  allFeaturesMax: any;
  selectedFeaturesMax: any;
  labelSpatiallyUnassignable_regional: any;
  allFeaturesRegionalSpatiallyUnassignable: any;
  classifyUsingWholeTimeseries: any;
  useNoDataToggle: any;
  topicIndicatorHierarchy: IndicatorTopic[];
  selectedIndicatorBackup: Indicator;
  displayableIndicators: any;
  wmsUrlForSelectedIndicator: any;
  wfsUrlForSelectedIndicator: any;
  headlineIndicatorHierarchy: any;
  displayableIndicators_keywordFiltered: any;
  POISizes: any;
  topicGeoresourceHierarchy: any;
  showGeoresourceExportButtons: any;
  displayableGeoresources_keywordFiltered: any; 
  wfsDatasets: any;
  wmsLegendImage: any;
  topicGeoresourceHierarchy_unmappedEntries: any;
  displayableGeoresources_keywordFiltered_forAlphabeticalDisplay: any;
  selectedPOISize: any;
  rangeFilterData: any;
  classifyZeroSeparately_backup: any;
  simplifyGeometriesParameterName:any;
  simplifyGeometries:any;
  enableBilanceTrend: any;
  showBarChartLabel:any;
  showBarChartAverageLine:any; 
  appTitle: string;
  customLogo_onClickURL: any;
  customLogoURL: any;
  customLogoWidth: any;
  currentKeycloakUser: KeycloakUser;
  keycloakTokenExpirationInfo: any;
  enableKeycloakSecurity: any;
  currentKomMonitorLoginRoleNames:any;
  currentKeycloakLoginGroups: any;
  currentKeycloakLoginRoles: any;
  showDiagramExportButtons:any;
  computationIndicatorHierarchy:any[];
}

export interface KeycloakUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface IndicatorTopic {
  indicatorCount: number;
  indicatorData: any;
  subTopics: IndicatorTopic[];
  topicDescription: string;
  topicId: string;
  topicName: string;
  topicResource: string;
  topicType: string;
}

export interface SpatialUnit {
  spatialUnitLevel: string;
  spatialUnitId: any;
  isOutlineLayer: any;
  outlineColor: any;
  outlineWidth: any;
  outlineDashArrayString: any;
}

export interface Indicator {
  indicatorName: string;
  geoJSON: any;
  referenceDateNote: any;
  metadata: {
    updateInterval: any;
    description: string;
  }
  unit: any;
  indicatorType: any;
  interpretation: any;
  abbreviation: string;
  referencedIndicators: any;
  referencedGeoresources: any;
  isHeadlineIndicator: boolean;
  defaultClassificationMapping: any;
  applicableSpatialUnits: any;
  indicatorId: any;
  ogcServices: any;
  applicableDates: any;
  creationType: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataExchangeService {

  pipedData:DataExchange;

  public constructor(
    @Inject('kommonitorDataExchangeService') private ajskommonitorDataExchangeServiceeProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorDataExchangeServiceeProvider;
  }

  isAllowedSpatialUnitForCurrentIndicator(spatialUnitMetadata:any) {

    if(!this.ajskommonitorDataExchangeServiceeProvider.selectedIndicator){
      return false;
    }

    if(! spatialUnitMetadata || ! spatialUnitMetadata.spatialUnitLevel){
      return false;
    }

    var filteredApplicableUnits = this.ajskommonitorDataExchangeServiceeProvider.selectedIndicator.applicableSpatialUnits.filter(function (applicableSpatialUnit:any) {
      if (applicableSpatialUnit.spatialUnitId ===  spatialUnitMetadata.spatialUnitId){
        return true;
      }
      else{
        return false;
      }
    });
   
    return filteredApplicableUnits.length > 0;
  }

  fetchAllMetadata() {
    this.ajskommonitorDataExchangeServiceeProvider.fetchAllMetadata();
  }

  downloadMetadataPDF_georesource(loi) {
    this.ajskommonitorDataExchangeServiceeProvider.downloadMetadataPDF_georesource(loi);
  }

  generateAndDownloadIndicatorZIP(indicatorData, fileName, fileEnding, jsZipOptions) {
    this.ajskommonitorDataExchangeServiceeProvider.generateAndDownloadIndicatorZIP(indicatorData, fileName, fileEnding, jsZipOptions);
  }

  generateIndicatorMetadataPdf(indicatorMetadata, pdfName, autosave) {	
    this.ajskommonitorDataExchangeServiceeProvider.generateIndicatorMetadataPdf(indicatorMetadata, pdfName, autosave);
  }

  getIndicatorValue_asFormattedText(indicatorValue:any) {
    return this.ajskommonitorDataExchangeServiceeProvider.getIndicatorValue_asFormattedText(indicatorValue);
  }

  tsToDate_withOptionalUpdateInterval(value: any, interval:any) {
    return this.ajskommonitorDataExchangeServiceeProvider.tsToDate_withOptionalUpdateInterval(value, interval);
  }

  dateToTS(value: any) {
    return this.ajskommonitorDataExchangeServiceeProvider.dateToTS(value);
  }

  displayMapApplicationError(error: any) {
    this.ajskommonitorDataExchangeServiceeProvider.displayMapApplicationError(error);
  }

  getBaseUrlToKomMonitorDataAPI_spatialResource() {
    return this.ajskommonitorDataExchangeServiceeProvider.getBaseUrlToKomMonitorDataAPI_spatialResource();
  }

  onChangeIndicatorKeywordFilter(name) {
    this.ajskommonitorDataExchangeServiceeProvider.onChangeIndicatorKeywordFilter(name);
  }

  onChangeGeoresourceKeywordFilter(georesourceNameFilterValue, showPOI, showLOI, showAOI, showWMS, showWFS) {
    this.ajskommonitorDataExchangeServiceeProvider.onChangeGeoresourceKeywordFilter(georesourceNameFilterValue, showPOI, showLOI, showAOI, showWMS, showWFS);
  }

  getGeoresourceDatasets(topic, georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS){
    return this.ajskommonitorDataExchangeServiceeProvider.getGeoresourceDatasets(topic, georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS);
  }

  referencedTopicIdExists(reference) {
    return this.ajskommonitorDataExchangeServiceeProvider.referencedTopicIdExists(reference);
  }

  removeAoiGeoresource(aoiGeoresource) {
    return this.ajskommonitorDataExchangeServiceeProvider.removeAoiGeoresource(aoiGeoresource);
  }

  indicatorValueIsNoData(feature) {
    return this.ajskommonitorDataExchangeServiceeProvider.indicatorValueIsNoData(feature);
  }

  getIndicatorValue_asNumber(value) {
    return this.ajskommonitorDataExchangeServiceeProvider.getIndicatorValue_asNumber(value);
  }

  setAllFeaturesProperty(indicatorMetadataAndGeoJSON, indicatorPropertyName) {
    this.ajskommonitorDataExchangeServiceeProvider.setAllFeaturesProperty(indicatorMetadataAndGeoJSON, indicatorPropertyName);
  }
  
  setSelectedFeatureProperty(selectedIndicatorFeatureIds, indicatorPropertyName) {
    this.ajskommonitorDataExchangeServiceeProvider.setSelectedFeatureProperty(selectedIndicatorFeatureIds, indicatorPropertyName);
  }
  
  selectedSpatialUnitIsRaster() {
    return this.ajskommonitorDataExchangeServiceeProvider.selectedSpatialUnitIsRaster();
  }

  generateAndDownloadGeoresourceZIP(poi, geoJSON_string, fileName, extension, val) {
    this.ajskommonitorDataExchangeServiceeProvider.generateAndDownloadGeoresourceZIP(poi, geoJSON_string, fileName, extension, val);
  }

  createDualListInputArray(areaNames, name, id) {
    return this.ajskommonitorDataExchangeServiceeProvider.createDualListInputArray(areaNames, name, id);
  }

  onRemovedFeatureFromSelection([selectedIndicatorFeatureIds]) {
    let propertyName = this.buildIndicatorPropertyName();

    setTimeout(() => {
      this.setSelectedFeatureProperty(selectedIndicatorFeatureIds, propertyName);
    });
  }

  buildIndicatorPropertyName() {
    const INDICATOR_DATE_PREFIX = window.__env.indicatorDatePrefix;
    let propertyName = INDICATOR_DATE_PREFIX + this.ajskommonitorDataExchangeServiceeProvider.selectedDate;
    return propertyName;
  }

  getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, selectedDate) {
    return this.ajskommonitorDataExchangeServiceeProvider.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, selectedDate);
  }

  formatIndicatorNameForLabel(value, num) {
    return this.ajskommonitorDataExchangeServiceeProvider.formatIndicatorNameForLabel(value, num);
  }

  filterIndicators() {
    return this.ajskommonitorDataExchangeServiceeProvider.filterIndicators();
  }
}
