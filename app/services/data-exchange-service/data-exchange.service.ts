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
}

export interface SpatialUnit {
  spatialUnitLevel: string;
}

export interface Indicator {
  indicatorName: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataExchangeService {

  pipedData:DataExchange;
  selectedIndicator: any;

  public constructor(
    @Inject('kommonitorDataExchangeService') private ajskommonitorDataExchangeServiceeProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorDataExchangeServiceeProvider;
    this.selectedIndicator = this.ajskommonitorDataExchangeServiceeProvider.selectedIndicator;
  }

  isAllowedSpatialUnitForCurrentIndicator(spatialUnitMetadata:any) {

    this.selectedIndicator = this.ajskommonitorDataExchangeServiceeProvider.selectedIndicator;

    if(!this.selectedIndicator){
      return false;
    }

    if(! spatialUnitMetadata || ! spatialUnitMetadata.spatialUnitLevel){
      return false;
    }

    var filteredApplicableUnits = this.selectedIndicator.applicableSpatialUnits.filter(function (applicableSpatialUnit:any) {
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
}
