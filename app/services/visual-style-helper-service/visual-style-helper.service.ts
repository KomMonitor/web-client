import { colorbrewer } from './../../components/ngComponents/userInterface/kommonitorClassification/colors';
import { Inject, Injectable } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import * as classyBrew from 'classybrew';

@Injectable({
  providedIn: 'root'
})
export class VisualStyleHelperServiceNew {

  pipedData:any;

  INDICATOR_DATE_PREFIX = window.__env.indicatorDatePrefix;

  defaultBrew:any = undefined;
  measureOfValueBrew:any = undefined;
  dynamicBrew:any = undefined;
  manualBrew:any = undefined;

  //allowesValues: equal_interval, quantile, jenks
  classifyMethods = [{
    name: "Jenks",
    value: "jenks"
    }, {
    name: "Gleiches Intervall",
    value: "equal_interval"
    }, {
    name: "Quantile",
    value: "quantile"
    }];

  manualMOVBreaks:any = undefined;
  regionalDefaultMOVBreaks:any;
  regionalDefaultBreaks:any;
  measureOfValueBrewArray:any;
  dynamicIncreaseBrew:any;
  dynamicDecreaseBrew:any;
  noDataFillPattern:any;

  greaterThanValues:any = [];
  lesserThanValues:any = [];
  positiveValues:any = [];
  negativeValues:any = [];

  defaultBrew_backup;
  measureOfValueBrew_backup ;
  dynamicBrew_backup;
  manualBrew_backup;

  classifyMethod = window.__env.defaultClassifyMethod || "jenks";

  isCustomComputation = false;

  numberOfDecimals = window.__env.numberOfDecimals;
  defaultColorForFilteredValues = window.__env.defaultColorForFilteredValues;
  defaultBorderColorForFilteredValues = window.__env.defaultBorderColorForFilteredValues;
  defaultBorderColor = window.__env.defaultBorderColor;
  defaultFillOpacity = window.__env.defaultFillOpacity;
  defaultFillOpacityForFilteredFeatures = window.__env.defaultFillOpacityForFilteredFeatures;
  defaultFillOpacityForHighlightedFeatures = window.__env.defaultFillOpacityForHighlightedFeatures;
  defaultFillOpacityForZeroFeatures = window.__env.defaultFillOpacityForZeroFeatures;
  defaultColorBrewerPaletteForBalanceIncreasingValues = window.__env.defaultColorBrewerPaletteForBalanceIncreasingValues;
  defaultColorBrewerPaletteForBalanceDecreasingValues = window.__env.defaultColorBrewerPaletteForBalanceDecreasingValues;
  defaultColorBrewerPaletteForGtMovValues = window.__env.defaultColorBrewerPaletteForGtMovValues;
  defaultColorBrewerPaletteForLtMovValues = window.__env.defaultColorBrewerPaletteForLtMovValues;
  defaultColorForHoveredFeatures = window.__env.defaultColorForHoveredFeatures;
  defaultColorForClickedFeatures = window.__env.defaultColorForClickedFeatures;
  defaultBorderColorForNoDataValues = window.__env.defaultBorderColorForNoDataValues;
  defaultColorForNoDataValues = window.__env.defaultColorForNoDataValues;
  defaultFillOpacityForNoDataValues = window.__env.defaultFillOpacityForNoDataValues;

  indicatorTransparency = 1 - window.__env.defaultFillOpacity;
  currentIndicatorOpacity = window.__env.defaultFillOpacity;

  defaultColorForZeroValues = window.__env.defaultColorForZeroValues;


  defaultColorForOutliers_high = window.__env.defaultColorForOutliers_high;
  defaultBorderColorForOutliers_high = window.__env.defaultBorderColorForOutliers_high;
  defaultFillOpacityForOutliers_high = window.__env.defaultFillOpacityForOutliers_high;
  defaultColorForOutliers_low = window.__env.defaultColorForOutliers_low;
  defaultBorderColorForOutliers_low = window.__env.defaultBorderColorForOutliers_low;
  defaultFillOpacityForOutliers_low = window.__env.defaultFillOpacityForOutliers_low;
  useOutlierDetectionOnIndicator = window.__env.useOutlierDetectionOnIndicator;

  outlierPropertyName = "outlier";
  outlierPropertyValue_high_soft = "high-soft";
  outlierPropertyValue_low_soft = "low-soft";
  outlierPropertyValue_high_extreme = "high-extreme";
  outlierPropertyValue_low_extreme = "low-extreme";
  outlierPropertyValue_no = "no";

  //outlierFillPattern_low = new L.StripePattern({ weight: 1, spaceweight: 1, patternTransform: "rotate(45)" });
  outlierFillPattern_low = [];

  //outlierFillPattern_high = new L.StripePattern({ weight: 1, spaceweight: 1, patternTransform: "rotate(-45)" });
  outlierFillPattern_high = [];

  /* shape = new L.PatternCircle({
    x: 5,
    y: 5,
    radius: 1,
    fill: true,
    color: this.dataExchangeService.pipedData.selectedSpatialUnitIsRaster() ? undefined : defaultColorForNoDataValues
  }); */
  //noDataFillPattern = new L.Pattern({ width: 8, height: 8 });
  //noDataFillPattern = [];
  //noDataFillPattern.addShape(shape);

  outliers_high = undefined;
  outliers_low = undefined;

  outlierStyle_high = {
    weight: 1,
    opacity: 1,
    color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColorForOutliers_high,
    dashArray: '',
    fillOpacity: this.defaultFillOpacityForOutliers_high,
    fillColor: this.defaultColorForOutliers_high,
    fillPattern: this.outlierFillPattern_high
  };

  outlierStyle_low = {
    weight: 1,
    opacity: 1,
    color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColorForOutliers_low,
    dashArray: '',
    fillOpacity: this.defaultFillOpacityForOutliers_low,
    fillColor: this.defaultColorForOutliers_low,
    fillPattern: this.outlierFillPattern_low
  };

  noDataStyle = {
    weight: 1,
    opacity: 1,
    color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColorForNoDataValues,
    dashArray: '',
    fillOpacity: this.defaultFillOpacityForNoDataValues,
    fillColor: this.defaultColorForNoDataValues,
    // fillPattern: this.noDataFillPattern
  };

  filteredStyle = {
    weight: 1,
    opacity: 1,
    color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColorForFilteredValues,
    dashArray: '',
    fillOpacity: this.defaultFillOpacityForFilteredFeatures,
    fillColor: this.defaultColorForFilteredValues
  };

  featuresPerColorMap = new Map();
  featuresPerNoData = 0;
  featuresPerZero = 0;
  featuresPerOutlierHigh = 0;
  featuresPerOutlierLow = 0;

  dynamicBrewBreaks:any = [];
  numClasses;

  public constructor(
    @Inject('kommonitorVisualStyleHelperService') private ajskommonitorVisualStyleHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    private dataExchangeService: DataExchangeService
  ) {
    this.pipedData = this.ajskommonitorVisualStyleHelperServiceProvider;
  }
/* 
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
  } */

  //
  resetFeaturesPerColorObjects(){
    this.featuresPerColorMap = new Map();
    this.featuresPerNoData = 0;
    this.featuresPerZero = 0;
    this.featuresPerOutlierLow = 0;
    this.featuresPerOutlierHigh = 0;
  }

  incrementFeaturesPerColor(color){
    if(this.featuresPerColorMap.has(color)){
      this.featuresPerColorMap.set(color, this.featuresPerColorMap.get(color) + 1);
    }
    else{
      this.featuresPerColorMap.set(color, 1);
    }
  }

  getFillColorForZero(incrementFeatures){
    if (incrementFeatures) {
      this.featuresPerZero ++;
    }
    return this.defaultColorForZeroValues;
  }

  createNewClassyBrewInstance(){
    let classyBrewInstance = new classyBrew();
    // must overwrite the color schemes of classybrew if there are any custom color palettes defined by KomMonitor users
    // that are not part of official colorbrewer project
    // deep clone colorbrewer content in case some methods use .shift method on color palette arrays
    classyBrewInstance.colorSchemes = jQuery.extend(true, {}, colorbrewer);

    return classyBrewInstance;
  }

  setupDefaultBrew (geoJSON, propertyName, numClasses, colorCode, classifyMethod, forceProvidedIndicator=false, indicator=false) {
    this.resetFeaturesPerColorObjects();

    var values = new Array();

    if(this.dataExchangeService.pipedData.classifyUsingWholeTimeseries){
      values = this.setupDefaultBrewValues_wholeTimeseries(geoJSON, values, forceProvidedIndicator, indicator);
    }
    else{
      values = this.setupDefaultBrewValues_singleTimestamp(geoJSON, propertyName, values);
    }

    this.defaultBrew = this.setupClassyBrew_usingFeatureCount(values, colorCode, classifyMethod, numClasses);         
    return this.defaultBrew;
  }

  setupDefaultBrewValues_singleTimestamp(geoJSON, propertyName, values){
    for (var i = 0; i < geoJSON.features.length; i++) {
      if (this.dataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]))
        continue;

      if(this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) == 0)){
        continue;
      }  

      // check if is outlier, then do not use within classification, as it will be marked on map with special color
      if (geoJSON.features[i].properties[this.outlierPropertyName] && geoJSON.features[i].properties[this.outlierPropertyName] !== this.outlierPropertyValue_no && this.dataExchangeService.pipedData.useOutlierDetectionOnIndicator) {
        continue;
      }

      if(! values.includes(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
        values.push(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
      }
    }

    return values;
  }

  setupDefaultBrewValues_wholeTimeseries(geoJSON, values, forceProvidedIndicator, indicator) {
    var indicatorTimeSeriesDatesArray;
    if(forceProvidedIndicator) {
      indicatorTimeSeriesDatesArray = indicator.applicableDates;
    } else {
      indicatorTimeSeriesDatesArray = this.dataExchangeService.pipedData.selectedIndicator.applicableDates;
    }
    

      for (const date of indicatorTimeSeriesDatesArray) {
        var propertyName = window.__env.indicatorDatePrefix + date;
        values = this.setupDefaultBrewValues_singleTimestamp(geoJSON, propertyName, values);
      }          

    return values;
  }

  setupManualBrew (numClasses, colorCode, breaks) {
    this.resetFeaturesPerColorObjects();

    var colorBrewerInstance = this.createNewClassyBrewInstance(); 
    numClasses = breaks.length-1;

    if(numClasses >= 3) {
      colorBrewerInstance.colors = colorBrewerInstance.colorSchemes[colorCode][numClasses];
    }
    else {
      colorBrewerInstance.colors = colorBrewerInstance.colorSchemes[colorCode][3];
      if(numClasses == 2) {
        colorBrewerInstance.colors.shift();
      }
      if(numClasses == 1) {
        colorBrewerInstance.colors.shift();
        colorBrewerInstance.colors.shift();
      }
      if(numClasses <= 0) {
        colorBrewerInstance.colors = [];
      }
    }
    
    colorBrewerInstance.numClasses = numClasses;
    colorBrewerInstance.colorCode = colorCode;

    colorBrewerInstance.breaks = breaks;
    
    return colorBrewerInstance;
  }

  /**
   * Returns and array of color brewer instances for greater and lesser than measure of value colors
   *
   * [gtMeasureOfValueBrew, ltMeasureOfValueBrew]
   */
  setupMeasureOfValueBrew (geoJSON, propertyName, colorCodeForGreaterThanValues, colorCodeForLesserThanValues, classifyMethod, measureOfValue, manualBreaks, regionalDefaultMOVBreaks, numClasses) {

    /*
    * Idea: Analyse the complete geoJSON property array for each feature and make conclusion about how to build the legend

    e.g. if there are only positive values then display only positive values within 5 categories - same for only negative values

    e.g. if there are equally many positive as negative values then display both using 3 categories each

    e.g. if there are way more positive than negative values, then display both with 2 (negative) and 4 (positive) classes

    --> implement special cases (0, 1 or 2 negative/positive values --> apply colors manually)
    --> treat all other cases equally to measureOfValue
    */

   this.resetFeaturesPerColorObjects();

   this.greaterThanValues = [];
   this.lesserThanValues = [];

    if(this.dataExchangeService.pipedData.classifyUsingWholeTimeseries){
      this.setupMovBrewValues_wholeTimeseries(geoJSON, measureOfValue);
    }
    else{
      this.setupMovBrewValues_singleTimestamp(geoJSON, propertyName, measureOfValue);
    }        

    var gtMeasureOfValueBrew = this.setupGtMeasureOfValueBrew(this.greaterThanValues, colorCodeForGreaterThanValues, classifyMethod, Math.ceil(numClasses / 2));
    var ltMeasureOfValueBrew = this.setupLtMeasureOfValueBrew(this.lesserThanValues, colorCodeForLesserThanValues, classifyMethod, Math.floor(numClasses / 2));

    if(classifyMethod == "regional_default" && regionalDefaultMOVBreaks[0] && regionalDefaultMOVBreaks[1]) {
      gtMeasureOfValueBrew = this.setupManualBrew(regionalDefaultMOVBreaks[0].length -1, colorCodeForGreaterThanValues, regionalDefaultMOVBreaks[0]);
      ltMeasureOfValueBrew = this.setupManualBrew(regionalDefaultMOVBreaks[1].length -1, colorCodeForLesserThanValues, regionalDefaultMOVBreaks[1]);
      ltMeasureOfValueBrew.colors = ltMeasureOfValueBrew.colors.reverse();
    }
    else if(classifyMethod == "manual") {
      if (!manualBreaks || manualBreaks.length == 0) {
        manualBreaks = [];
        manualBreaks[0] = gtMeasureOfValueBrew ? gtMeasureOfValueBrew.breaks : [];
        manualBreaks[1] = ltMeasureOfValueBrew ? ltMeasureOfValueBrew.breaks : [];
      }

      var manualBreaksMatchMeasureOfValue = 
        (manualBreaks[1][manualBreaks[1].length-1] <= measureOfValue) &&
        (measureOfValue <= manualBreaks[0][0]);

      if (manualBreaksMatchMeasureOfValue) {
        gtMeasureOfValueBrew = this.setupManualBrew(manualBreaks[0].length -1, colorCodeForGreaterThanValues, manualBreaks[0]);
        ltMeasureOfValueBrew = this.setupManualBrew(manualBreaks[1].length -1, colorCodeForLesserThanValues, manualBreaks[1]);
        ltMeasureOfValueBrew.colors = ltMeasureOfValueBrew.colors.reverse();
      }
    }
    
    this.measureOfValueBrew = [gtMeasureOfValueBrew, ltMeasureOfValueBrew];
    return this.measureOfValueBrew;
  }

  setupMovBrewValues_singleTimestamp(geoJSON, propertyName, measureOfValue){
    for (var i = 0; i < geoJSON.features.length; i++) {

      if (this.dataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]))
        continue;

      if(this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) == 0)){
        continue;
      }

      // check if is outlier, then do not use within classification, as it will be marked on map with special color
      if (geoJSON.features[i].properties[this.outlierPropertyName] && geoJSON.features[i].properties[this.outlierPropertyName] !== this.outlierPropertyValue_no && this.dataExchangeService.pipedData.useOutlierDetectionOnIndicator) {
        continue;
      }

      else if (this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) >= this.dataExchangeService.getIndicatorValue_asNumber(measureOfValue)){
        if(! this.greaterThanValues.includes(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
          this.greaterThanValues.push(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
        }
      }
      else{
        if(! this.lesserThanValues.includes(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
          this.lesserThanValues.push(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
        }
      }
    }
  }

  setupMovBrewValues_wholeTimeseries(geoJSON, measureOfValue){
    var indicatorTimeSeriesDatesArray = this.dataExchangeService.pipedData.selectedIndicator.applicableDates;

      for (const date of indicatorTimeSeriesDatesArray) {
        var propertyName = window.__env.indicatorDatePrefix + date;
        this.setupMovBrewValues_singleTimestamp(geoJSON, propertyName, measureOfValue);
      }    
  }

  setupClassyBrew_usingFeatureCount(valuesArray, colorCode, classifyMethod, maxNumberOfClasses){
    if(!maxNumberOfClasses) {
      maxNumberOfClasses = 5;
    }

    var tempBrew = this.createNewClassyBrewInstance();
    var colorBrewerInstance = this.createNewClassyBrewInstance();

    if (valuesArray.length >= 5) {
      // pass array to our classyBrew series
      tempBrew.setSeries(valuesArray);
      // define number of classes
      tempBrew.setNumClasses(maxNumberOfClasses);
      // set color ramp code
      tempBrew.setColorCode(colorCode);
      // classify by passing in statistical method
      // i.e. equal_interval, jenks, quantile
      tempBrew.classify(classifyMethod);

      colorBrewerInstance.colors = tempBrew.getColors();
      colorBrewerInstance.breaks = tempBrew.getBreaks();

      if(tempBrew.numClasses == 2) {
        colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
        colorBrewerInstance.colors.shift();
      }
      if(tempBrew.numClasses == 1) {
        colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
        colorBrewerInstance.colors.shift();
        colorBrewerInstance.colors.shift();
      }
    }

    else if (valuesArray.length === 4) {
      valuesArray.sort((a, b) => a - b);

      colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['4'];
      colorBrewerInstance.breaks = valuesArray;
    }

    else if (valuesArray.length === 3) {
      valuesArray.sort((a, b) => a - b);

      colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
      colorBrewerInstance.breaks = valuesArray;
    }
    else if (valuesArray.length === 2) {
      valuesArray.sort((a, b) => a - b);

      colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
      colorBrewerInstance.breaks = valuesArray;

      colorBrewerInstance.colors.shift(); // remove first element of array
    }
    else if (valuesArray.length === 1) {
      valuesArray.sort((a, b) => a - b);

      colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
      colorBrewerInstance.breaks = valuesArray;

      colorBrewerInstance.colors.shift(); // remove first element of array
      colorBrewerInstance.colors.shift(); // remove first element of array
    }
    else {
      // no positive values
      colorBrewerInstance = undefined;
    }

    // round values 
    if (colorBrewerInstance && colorBrewerInstance.breaks){
      for (let index = 0; index < colorBrewerInstance.breaks.length; index++) {
        colorBrewerInstance.breaks[index] = this.dataExchangeService.getIndicatorValue_asNumber(colorBrewerInstance.breaks[index]);            
      }
    }

    return colorBrewerInstance;
  }

  setupGtMeasureOfValueBrew (greaterThanValues, colorCodeForGreaterThanValues, classifyMethod, numClasses) {        

    return this.setupClassyBrew_usingFeatureCount(greaterThanValues, colorCodeForGreaterThanValues, classifyMethod, numClasses);

  }

  setupLtMeasureOfValueBrew (lesserThanValues, colorCodeForLesserThanValues, classifyMethod, numClasses) {

    var brew = this.setupClassyBrew_usingFeatureCount(lesserThanValues, colorCodeForLesserThanValues, classifyMethod, numClasses);
    if(brew && brew.colors && brew.colors.length > 1){        
      brew.colors = brew.colors.reverse();
    }
    return brew;
  }

  /**
   * Returns and array of color brewer instances for dynamic increase and decrease colors
   *
   * [dynamicIncreaseBrew, dynamicDecreaseBrew]
   */
  setupDynamicIndicatorBrew (geoJSON, propertyName, colorCodeForPositiveValues, colorCodeForNegativeValues, classifyMethod, numClasses, breaks) {

    /*
    * Idea: Analyse the complete geoJSON property array for each feature and make conclusion about how to build the legend

    e.g. if there are only positive values then display only positive values within 5 categories - same for only negative values

    e.g. if there are equally many positive as negative values then display both using 3 categories each

    e.g. if there are way more positive than negative values, then display both with 2 (negative) and 4 (positive) classes

    --> implement special cases (0, 1 or 2 negative/positive values --> apply colors manually)
    --> treat all other cases equally to measureOfValue
    */

   this.resetFeaturesPerColorObjects();

    this.positiveValues = [];
    this.negativeValues = [];
   
    if(this.dataExchangeService.pipedData.classifyUsingWholeTimeseries){
      this.setupDynamicBrewValues_wholeTimeseries(geoJSON);
    }
    else{
      this.setupDynamicBrewValues_singleTimestamp(geoJSON, propertyName);
    }

    var dynamicIncreaseBrew = this.setupDynamicIncreaseBrew(this.positiveValues, colorCodeForPositiveValues, classifyMethod, Math.ceil(numClasses / 2));
    var dynamicDecreaseBrew = this.setupDynamicDecreaseBrew(this.negativeValues, colorCodeForNegativeValues, classifyMethod, Math.floor(numClasses / 2));

    if(classifyMethod == "manual") {
      if (!breaks || breaks.length == 0) {
        breaks = [];
        breaks[0] = dynamicIncreaseBrew ? dynamicIncreaseBrew.breaks : [];
        breaks[1] = dynamicDecreaseBrew ? dynamicDecreaseBrew.breaks : [];
      }
      dynamicIncreaseBrew = this.setupManualBrew(breaks[0].length -1, colorCodeForPositiveValues, breaks[0]);
      dynamicDecreaseBrew = this.setupManualBrew(breaks[1].length -1, colorCodeForNegativeValues, breaks[1]);
      dynamicDecreaseBrew.colors = dynamicDecreaseBrew.colors.reverse();
    }

    this.dynamicBrew = [dynamicIncreaseBrew, dynamicDecreaseBrew]; 

    return this.dynamicBrew;
  }

  setupDynamicBrewValues_wholeTimeseries(geoJSON){
    var indicatorTimeSeriesDatesArray = this.dataExchangeService.pipedData.selectedIndicator.applicableDates;

      for (const date of indicatorTimeSeriesDatesArray) {
        var propertyName = window.__env.indicatorDatePrefix + date;
        this.setupDynamicBrewValues_singleTimestamp(geoJSON, propertyName);
      }    
  }

  setupDynamicBrewValues_singleTimestamp(geoJSON, propertyName){
    for (var i = 0; i < geoJSON.features.length; i++) {
      if (this.dataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]))
        continue;

      if(this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) == 0)){
        continue;
      }

      // check if is outlier, then do not use within classification, as it will be marked on map with special color
      if (geoJSON.features[i].properties[this.outlierPropertyName] && geoJSON.features[i].properties[this.outlierPropertyName] !== this.outlierPropertyValue_no && this.dataExchangeService.pipedData.useOutlierDetectionOnIndicator) {
        continue;
      }

      else if (this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) >= 0){
        if(! this.positiveValues.includes(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
          this.positiveValues.push(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
        }
      }
      else if (this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) < 0){
        if(! this.negativeValues.includes(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
          this.negativeValues.push(this.dataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
        }
      }
    }
  }

  setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod, numClasses) {
    return this.setupClassyBrew_usingFeatureCount(positiveValues, colorCodeForPositiveValues, classifyMethod, numClasses);
  }

  setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod, numClasses) {
    var brew = this.setupClassyBrew_usingFeatureCount(negativeValues, colorCodeForNegativeValues, classifyMethod, numClasses);
    if(brew && brew.colors && brew.colors.length > 1){        
      brew.colors = brew.colors.reverse();
    }
    return brew;
  }

  styleNoData(feature, incrementFeatures) {
    if (incrementFeatures) {
      this.featuresPerNoData ++;
    }
    return this.noDataStyle;
  }

  styleOutlier(feature, incrementFeatures) {
    if ((feature.properties[this.outlierPropertyName] === this.outlierPropertyValue_low_soft) || (feature.properties[this.outlierPropertyName] === this.outlierPropertyValue_low_extreme)) {

      if (incrementFeatures) {
        this.featuresPerOutlierLow ++;
      }
      return this.outlierStyle_low;
    }
    else {

      if (incrementFeatures) {
        this.featuresPerOutlierHigh ++;
      }
      return this.outlierStyle_high;
    }
  }

  getOpacity(opacity){

    return this.defaultFillOpacity;
  };

  setOpacity(opacity){

    opacity = Number(opacity);
    this.indicatorTransparency = Number((1 - opacity).toFixed(this.numberOfDecimals));
    this.currentIndicatorOpacity = opacity;

    this.defaultFillOpacity = opacity;
    this.defaultFillOpacityForOutliers_low = opacity;
    this.defaultFillOpacityForOutliers_high = opacity;
    this.defaultFillOpacityForZeroFeatures = opacity;
    this.defaultFillOpacityForNoDataValues = opacity;
    this.defaultFillOpacityForFilteredFeatures = opacity;
  }

  // style function to return
  styleDefault(feature, defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, datasetContainsNegativeValues, incrementFeatures) {

    // check if feature is NoData
    if (this.dataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
      return this.styleNoData(feature, incrementFeatures);
    }

    // check if feature is outlier
    if ((feature.properties[this.outlierPropertyName] !== this.outlierPropertyValue_no) && this.dataExchangeService.pipedData.useOutlierDetectionOnIndicator) {
      return this.styleOutlier(feature, incrementFeatures);
    }

    var fillOpacity = 1;
    if (useTransparencyOnIndicator) {
      fillOpacity = this.defaultFillOpacity;
    }

    var fillColor;
    if (this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0)) {
      fillColor = this.getFillColorForZero(incrementFeatures);
      if (useTransparencyOnIndicator) {
        fillOpacity = this.defaultFillOpacityForZeroFeatures;
      }

    }
    else {
      if (datasetContainsNegativeValues) {
        if (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= 0) {
          if (this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0)) {
            fillColor = this.getFillColorForZero(incrementFeatures);
            if (useTransparencyOnIndicator) {
              fillOpacity = this.defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            fillColor = this.findColorInRange(feature, propertyName, dynamicIncreaseBrew, incrementFeatures);
          }

          return {
            weight: 1,
            opacity: fillOpacity,
            color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }
        else {

          if (this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0)) {
            fillColor = this.getFillColorForZero(incrementFeatures);
            if (useTransparencyOnIndicator) {
              fillOpacity = this.defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            // invert colors, so that lowest values will become strong colored!
            fillColor = this.findColorInRange(feature, propertyName, dynamicDecreaseBrew, incrementFeatures);
          }

          return {
            weight: 1,
            opacity: fillOpacity,
            color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }
      }
      else {
        fillColor = this.findColorInRange(feature, propertyName, defaultBrew, incrementFeatures);            
      }
    }

    return {
      weight: 1,
      opacity: fillOpacity,
      color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColor,
      dashArray: '',
      fillOpacity: fillOpacity,
      fillColor: fillColor,
      fillPattern: undefined
    };
  }

  findColorInRange(feature, propertyName, colorBrewInstance, incrementFeatures){
    var color;

    for (var index = 0; index < colorBrewInstance.breaks.length; index++) {
      if (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == this.dataExchangeService.getIndicatorValue_asNumber(colorBrewInstance.breaks[index])) {
        if (index < colorBrewInstance.breaks.length - 1) {
          // min value
          color = colorBrewInstance.colors[index];
          break;
        }
        else {
          //max value
          if (colorBrewInstance.colors[index]) {
            color = colorBrewInstance.colors[index];
          }
          else {
            color = colorBrewInstance.colors[index - 1];
          }
          break;
        }
      }
      else {
        if (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < this.dataExchangeService.getIndicatorValue_asNumber(colorBrewInstance.breaks[index + 1])) {
          if (colorBrewInstance.colors && colorBrewInstance.colors[index]) {
            color = colorBrewInstance.colors[index];
          }
          break;
        }
      }
    }

    if(incrementFeatures) {
      this.incrementFeaturesPerColor(color);
    }
    
    return color;
  }

  // this.findColorInRange_invertedColorGradient (feature, propertyName, colorBrewInstance){
  //   var color;

  //   for (var k = 0; k < colorBrewInstance.breaks.length; k++) {
  //     if (this.dataExchangeService.pipedData.getIndicatorValue_asNumber(feature.properties[propertyName]) == this.dataExchangeService.pipedData.getIndicatorValue_asNumber(colorBrewInstance.breaks[k])) {
  //       if (k < colorBrewInstance.breaks.length - 1) {
  //         // min value
  //         color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
  //         break;
  //       }
  //       else {
  //         //max value
  //         if (colorBrewInstance.colors[colorBrewInstance.colors.length - k]) {
  //           color = colorBrewInstance.colors[colorBrewInstance.colors.length - k];
  //         }
  //         else {
  //           color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
  //         }
  //         break;
  //       }
  //     }
  //     else {
  //       if (this.dataExchangeService.pipedData.getIndicatorValue_asNumber(feature.properties[propertyName]) < this.dataExchangeService.pipedData.getIndicatorValue_asNumber(colorBrewInstance.breaks[k + 1])) {
  //         color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
  //         break;
  //       }
  //     }
  //   }

  //   this.incrementFeaturesPerColor(color);

  //   return color;
  // };

  styleMeasureOfValue(feature, gtMeasureOfValueBrew, ltMeasureOfValueBrew, propertyName, useTransparencyOnIndicator, incrementFeatures) {


    // check if feature is NoData
    if (this.dataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
      return this.styleNoData(feature, incrementFeatures);
    }

    // check if feature is outlier
    if ((feature.properties[this.outlierPropertyName] !== this.outlierPropertyValue_no) && this.dataExchangeService.pipedData.useOutlierDetectionOnIndicator) {
      return this.styleOutlier(feature, incrementFeatures);
    }

    var fillOpacity = 1;
    if (useTransparencyOnIndicator) {
      fillOpacity = this.defaultFillOpacity;
    }

    var fillColor;
    if (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= this.dataExchangeService.pipedData.measureOfValue) {

      if (this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0)) {
        fillColor = this.getFillColorForZero(incrementFeatures);
        if (useTransparencyOnIndicator) {
          fillOpacity = this.defaultFillOpacityForZeroFeatures;
        }
      }
      else {

        fillColor = this.findColorInRange(feature, propertyName, gtMeasureOfValueBrew, incrementFeatures);
      }

      return {
        weight: 1,
        opacity: 1,
        color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColor,
        dashArray: '',
        fillOpacity: fillOpacity,
        fillColor: fillColor,
        fillPattern: undefined
      };
    }
    else {
      if (this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0)) {
        fillColor = this.getFillColorForZero(incrementFeatures);
        if (useTransparencyOnIndicator) {
          fillOpacity = this.defaultFillOpacityForZeroFeatures;
        }
      }
      else {
        // invert colors, so that lowest values will become strong colored!
        fillColor = this.findColorInRange(feature, propertyName, ltMeasureOfValueBrew, incrementFeatures);
      }

      return {
        weight: 1,
        opacity: 1,
        color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColor,
        dashArray: '',
        fillOpacity: fillOpacity,
        fillColor: fillColor,
        fillPattern: undefined
      };
    }

  }

  styleDynamicIndicator(feature, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, incrementFeatures) {



    // check if feature is NoData
    if (this.dataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
      return this.styleNoData(feature, incrementFeatures);
    }

    // check if feature is outlier
    if ((feature.properties[this.outlierPropertyName] !== this.outlierPropertyValue_no) && this.dataExchangeService.pipedData.useOutlierDetectionOnIndicator) {
      return this.styleOutlier(feature, incrementFeatures);
    }

    var fillOpacity = 1;
    if (useTransparencyOnIndicator) {
      fillOpacity = this.defaultFillOpacity;
    }

    var fillColor;
    if (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= 0) {

      if (this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0)) {
        fillColor = this.getFillColorForZero(incrementFeatures);
        if (useTransparencyOnIndicator) {
          fillOpacity = this.defaultFillOpacityForZeroFeatures;
        }
      }
      else {
        fillColor = this.findColorInRange(feature, propertyName, dynamicIncreaseBrew, incrementFeatures);
      }

      return {
        weight: 1,
        opacity: 1,
        color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColor,
        dashArray: '',
        fillOpacity: fillOpacity,
        fillColor: fillColor,
        fillPattern: undefined
      };
    }
    else {
      if (this.dataExchangeService.pipedData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0)) {
        fillColor = this.getFillColorForZero(incrementFeatures);
        if (useTransparencyOnIndicator) {
          fillOpacity = this.defaultFillOpacityForZeroFeatures;
        }
      }
      else {
        // invert colors, so that lowest values will become strong colored!
        fillColor = this.findColorInRange(feature, propertyName, dynamicDecreaseBrew, incrementFeatures);
      }

      return {
        weight: 1,
        opacity: 1,
        color: this.dataExchangeService.selectedSpatialUnitIsRaster() ? undefined : this.defaultBorderColor,
        dashArray: '',
        fillOpacity: fillOpacity,
        fillColor: fillColor,
        fillPattern: undefined
      };
    }

  }

  backupCurrentBrewObjects_forMainMapIndicator(){
    // backup all current brew objects
    this.defaultBrew_backup = jQuery.extend(true, {}, this.defaultBrew);
    this.measureOfValueBrew_backup = jQuery.extend(true, {}, this.measureOfValueBrew);
    this.dynamicBrew_backup = jQuery.extend(true, {}, this.dynamicBrew);
    this.manualBrew_backup = jQuery.extend(true, {}, this.manualBrew);
  }

  resetCurrentBrewObjects_forMainMapIndicator(){
    // backup all current brew objects
    this.defaultBrew = jQuery.extend(true, {}, this.defaultBrew_backup);
    this.measureOfValueBrew = jQuery.extend(true, {}, this.measureOfValueBrew_backup);
    this.dynamicBrew = jQuery.extend(true, {}, this.dynamicBrew_backup);
    this.manualBrew = jQuery.extend(true, {}, this.manualBrew_backup);
  }
}