import { ajskommonitorDiagramHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DiagramHelperServiceService {
  
  pipedData:any;

  public constructor(
    @Inject('kommonitorDiagramHelperService') private ajskommonitorDiagramHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorDiagramHelperServiceProvider;
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
}
