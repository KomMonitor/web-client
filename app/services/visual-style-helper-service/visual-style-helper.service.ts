import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VisualStyleHelperServiceNew {

  pipedData:any;

  public constructor(
    @Inject('kommonitorVisualStyleHelperService') private ajskommonitorVisualStyleHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorVisualStyleHelperServiceProvider;
  }

  setOpacity(opacity) {
    this.ajskommonitorVisualStyleHelperServiceProvider.setOpacity(opacity);
  }

  setupMeasureOfValueBrew(
    currentGeoJSONOfCurrentLayer, 
    indicatorPropertyName, 
    defaultColorBrewerPaletteForGtMovValues, 
    defaultColorBrewerPaletteForLtMovValues, 
    classifyMethod, 
    measureOfValue,
    manualMOVBreaks,
    regionalDefaultMOVBreaks,
    numClasses
  ) {
    return this.ajskommonitorVisualStyleHelperServiceProvider.setupMeasureOfValueBrew(
      currentGeoJSONOfCurrentLayer, 
      indicatorPropertyName, 
      defaultColorBrewerPaletteForGtMovValues, 
      defaultColorBrewerPaletteForLtMovValues, 
      classifyMethod, 
      measureOfValue,
      manualMOVBreaks,
      regionalDefaultMOVBreaks,
      numClasses
    );
  }

  setupDynamicIndicatorBrew(
    geoJSON, 
    indicatorPropertyName, 
    defaultColorBrewerPaletteForBalanceIncreasingValues, 
    defaultColorBrewerPaletteForBalanceDecreasingValues, 
    classifyMethod,
    numClasses,
    val) {
      return this.ajskommonitorVisualStyleHelperServiceProvider.setupDynamicIndicatorBrew(
        geoJSON, 
        indicatorPropertyName, 
        defaultColorBrewerPaletteForBalanceIncreasingValues, 
        defaultColorBrewerPaletteForBalanceDecreasingValues, 
        classifyMethod,
        numClasses,
        val);
  }

  setupManualBrew(numClasses, colorBrewerSchemeName, regionalDefaultBreaks) {
    return this.ajskommonitorVisualStyleHelperServiceProvider.setupManualBrew(numClasses, colorBrewerSchemeName, regionalDefaultBreaks);
  }

  setupDefaultBrew(geoJSON, indicatorPropertyName, numClasses, colorBrewerSchemeName, classifyMethod) {
    return this.ajskommonitorVisualStyleHelperServiceProvider.setupDefaultBrew(geoJSON, indicatorPropertyName, numClasses, colorBrewerSchemeName, classifyMethod);
  }

  styleMeasureOfValue(feature, gtMeasureOfValueBrew, ltMeasureOfValueBrew, propertyName, useTransparencyOnIndicator, bolVal) {
    return this.ajskommonitorVisualStyleHelperServiceProvider.styleMeasureOfValue(feature, gtMeasureOfValueBrew, ltMeasureOfValueBrew, propertyName, useTransparencyOnIndicator, bolVal);
  }

  styleDynamicIndicator(feature, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, bolVal) {
    return this.ajskommonitorVisualStyleHelperServiceProvider.styleDynamicIndicator(feature, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, bolVal);
  }

  styleDefault(feature, manualBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, datasetContainsNegativeValues, bolVal) {
    return this.ajskommonitorVisualStyleHelperServiceProvider.styleDefault(feature, manualBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, datasetContainsNegativeValues, bolVal);
  }
}