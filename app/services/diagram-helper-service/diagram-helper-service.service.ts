import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { ajskommonitorDiagramHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Injectable({
  providedIn: 'root'
})
export class DiagramHelperServiceService {
  
  pipedData:any;
  indicatorPropertiesForCurrentSpatialUnitAndTime;

  exchangeData!: DataExchange;

  public constructor(
    @Inject('kommonitorDiagramHelperService') private ajskommonitorDiagramHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any,
    private broadcastService: BroadcastService,
    private dataExchangeService: DataExchangeService
  ) {
    this.pipedData = this.ajskommonitorDiagramHelperServiceProvider;
    this.exchangeData = this.dataExchangeService.pipedData;
  }

  makeTrendChartOptions_forAllFeatures(indicatorMetadata, fromDateAsPropertyString, toDateAsPropertyString, showMinMax, showCompleteTimeseries, trendComputationType, enableBilanceTrend) {
    return this.ajskommonitorDiagramHelperServiceProvider.makeTrendChartOptions_forAllFeatures(indicatorMetadata, fromDateAsPropertyString, toDateAsPropertyString, showMinMax, showCompleteTimeseries, trendComputationType, enableBilanceTrend);
  }

  getHistogramChartOptions() {
    return this.ajskommonitorDiagramHelperServiceProvider.getHistogramChartOptions();
  }

  getBarChartOptions() {
    return this.ajskommonitorDiagramHelperServiceProvider.getBarChartOptions();
  }

  getLineChartOptions() {
    return this.ajskommonitorDiagramHelperServiceProvider.getLineChartOptions();
  }

  prepareAllDiagramResources_forCurrentMapIndicator(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, bolval) {
    this.ajskommonitorDiagramHelperServiceProvider.prepareAllDiagramResources_forCurrentMapIndicator(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, bolval);
  }

  setupIndicatorPropertiesForCurrentSpatialUnitAndTime(filterBySameUnitAndSameTime = false) {
    //this.ajskommonitorDiagramHelperServiceProvider.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(param);
    
   this.broadcastService.broadcast("allIndicatorPropertiesForCurrentSpatialUnitAndTime setup begin");

    this.indicatorPropertiesForCurrentSpatialUnitAndTime = [];

    this.exchangeData.displayableIndicators.forEach(indicatorMetadata => {
      let targetYear = this.exchangeData.selectedDate.split("-")[0];
      let indicatorCandidateYears:any = []
      indicatorMetadata.applicableDates.forEach((date, i) => {
        indicatorCandidateYears.push(date.split("-")[0]);
      });


      // if (indicatorCandidateYears.includes(targetYear) && indicatorMetadata.applicableSpatialUnits.some(o => o.spatialUnitName ===  kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
      //   var selectableIndicatorEntry = {};
      //   selectableIndicatorEntry.indicatorProperties = null;
      //   // per default show no indicators on radar
      //   selectableIndicatorEntry.isSelected = false;
      //   selectableIndicatorEntry.indicatorMetadata = indicatorMetadata;
      //   selectableIndicatorEntry.closestTimestamp = undefined;

      //   this.indicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
      // }
      
      if (indicatorMetadata.applicableSpatialUnits.some(o => o.spatialUnitName === this.exchangeData.selectedSpatialUnit.spatialUnitLevel)) {
        var canBeAdded = true;

        if(filterBySameUnitAndSameTime){
          if(indicatorCandidateYears.includes(targetYear)){
            canBeAdded = true;
          }
          else{
            canBeAdded = false;
          }
        }

        if (canBeAdded){
          var selectableIndicatorEntry:any = {};
          selectableIndicatorEntry.indicatorProperties = null;
          // per default show no indicators on radar
          selectableIndicatorEntry.isSelected = false;
          selectableIndicatorEntry.indicatorMetadata = indicatorMetadata;
          // selectableIndicatorEntry.closestTimestamp = undefined;

          this.indicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
        }
        
      }
    });

   this.broadcastService.broadcast("allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed");
  }
  
  fetchIndicatorPropertiesIfNotExists(i) {
    this.ajskommonitorDiagramHelperServiceProvider.fetchIndicatorPropertiesIfNotExists(i);
  }
}
