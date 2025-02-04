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
}

export interface SpatialUnit {
  spatialUnitLevel: string;
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

  generateAndDownloadIndicatorZIP(indicatorData, fileName, fileEnding, jsZipOptions) {
    this.ajskommonitorDataExchangeServiceeProvider.generateAndDownloadIndicatorZIP(indicatorData, fileName, fileEnding, jsZipOptions);
  }

  generateIndicatorMetadataPdf(indicatorMetadata, pdfName, autosave) {	
    this.ajskommonitorDataExchangeServiceeProvider.generateIndicatorMetadataPdf(indicatorMetadata, pdfName, autosave);
  }

  getIndicatorValue_asFormattedText(indicatorValue:any) {
    return this.ajskommonitorDataExchangeServiceeProvider.getIndicatorValue_asFormattedText(indicatorValue);
  }

  tsToDate_withOptionalUpdateInterval(value: any) {
    return this.ajskommonitorDataExchangeServiceeProvider.tsToDate_withOptionalUpdateInterval(value);
  }

  dateToTS(value: any, interval: any) {
    return this.ajskommonitorDataExchangeServiceeProvider.dateToTS(value, interval);
  }
}
