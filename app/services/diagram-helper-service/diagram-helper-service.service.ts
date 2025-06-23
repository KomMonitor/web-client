import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { Inject, Injectable } from '@angular/core';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { HttpClient } from '@angular/common/http';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import * as echarts from 'echarts';
import * as turf from '@turf/turf';
import * as ecStat from 'echarts-stat';

@Injectable({
  providedIn: 'root'
})
export class DiagramHelperServiceService {
  
  pipedData:any;
  indicatorPropertiesForCurrentSpatialUnitAndTime;
  filterSameUnitAndSameTime = false;

  INDICATOR_DATE_PREFIX = window.__env.indicatorDatePrefix;
  defaultColorForHoveredFeatures = window.__env.defaultColorForHoveredFeatures;
  defaultColorForClickedFeatures = window.__env.defaultColorForClickedFeatures;

  numberOfDecimals = window.__env.numberOfDecimals;
  defaultColorForZeroValues = window.__env.defaultColorForZeroValues;
  defaultColorForNoDataValues = window.__env.defaultColorForNoDataValues;
  defaultColorForFilteredValues = window.__env.defaultColorForFilteredValues;

  defaultColorForOutliers_high = window.__env.defaultColorForOutliers_high;
  defaultBorderColorForOutliers_high = window.__env.defaultBorderColorForOutliers_high;
  defaultFillOpacityForOutliers_high = window.__env.defaultFillOpacityForOutliers_high;
  defaultColorForOutliers_low = window.__env.defaultColorForOutliers_low;
  defaultBorderColorForOutliers_low = window.__env.defaultBorderColorForOutliers_low;
  defaultFillOpacityForOutliers_low = window.window.__env.defaultFillOpacityForOutliers_low;

  indicatorPropertyName = "";

  barChartOptions = {};
  lineChartOptions = {series: [{name:''}]};
  histogramChartOptions = {};
  radarChartOptions = {};
  regressionChartOptions = {};
  geoMapChartOptions = {};

  exchangeData!: DataExchange;

  public constructor(
    private broadcastService: BroadcastService,
    private dataExchangeService: DataExchangeService,
    private filterHelperService: FilterHelperService,
    private http: HttpClient
  ) {
    this.exchangeData = this.dataExchangeService.pipedData;
  }

  setCustomFontFamily() {
  
    var elem:any = document.querySelector('#fontFamily-reference');
    var style = getComputedStyle(elem);
    return style.fontFamily;
  }

  customFontFamily = this.setCustomFontFamily(); 

  prepCustomStyling(customFontFamilyEnabled, options) {

    if(customFontFamilyEnabled===true)
      options.textStyle = {fontFamily: this.customFontFamily};

    return options;
  }

  isCloserToTargetDate(date, closestDate, targetDate){
    var targetYear = targetDate.split("-")[0];
    var targetMonth = targetDate.split("-")[1];
    var targetDay = targetDate.split("-")[2];

    var closestDateComps = closestDate.split("-");
    var closestDateYear = closestDateComps[0];
    var closestDateMonth = closestDateComps[1];
    var closestDateDay = closestDateComps[2];

    var dateComps = date.split("-");
    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    var monthDiff_closestDate = Math.abs(targetMonth - closestDateMonth);
    var monthDiff_date = Math.abs(targetMonth - month);

    if(monthDiff_date <= monthDiff_closestDate){
      var dayDiff_closestDate = Math.abs(targetDay - closestDateDay);
      var dayDiff_date = Math.abs(targetDay - day);

      if(dayDiff_date < dayDiff_closestDate){
        return true;
      }
    }
    return false;
  };

  findClostestTimestamForTargetDate(indicatorForRadar, targetDate){
    var applicableDates = indicatorForRadar.indicatorMetadata.applicableDates;

    var targetYear = targetDate.split("-")[0];
    var targetMonth = targetDate.split("-")[1];
    var targetDay = targetDate.split("-")[2];

    var closestDate = undefined;

    for (var date of applicableDates) {
      var dateComps = date.split("-");
      var year = dateComps[0];
      var month = dateComps[1];
      var day = dateComps[2];

      if(targetDate.includes(year)){
        if(! closestDate){
          closestDate = date;
        }
        else{
          if(this.isCloserToTargetDate(date, closestDate, targetDate)){
            closestDate = date;
          }
        }

      }
    }

    return closestDate;
  }

  setupIndicatorPropertiesForCurrentSpatialUnitAndTime(filterBySameUnitAndSameTime = false) {
    
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
          selectableIndicatorEntry.selectedDate = indicatorMetadata.applicableDates[indicatorMetadata.applicableDates.length-1];
          // selectableIndicatorEntry.closestTimestamp = undefined;

          this.indicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
        }
        
      }
    });
   this.broadcastService.broadcast("allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed");
  }
  
  fetchIndicatorPropertiesIfNotExists(index) {
    if(this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === null || this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === undefined){
      // var dateComps = kommonitorDataExchangeService.selectedDate.split("-");
      //
      // 	var year = dateComps[0];
      // 	var month = dateComps[1];
      // 	var day = dateComps[2];
      this.setIndicatorProperties(index);
    }
  }

  setIndicatorProperties(index) {
    let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorMetadata.indicatorId + "/" + this.exchangeData.selectedSpatialUnit.spatialUnitId + "/without-geometry";
    return this.http.get(url).subscribe({
      next: (response:any) => {
        this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties = response;
      },
      error: error => {
        this.dataExchangeService.displayMapApplicationError(error);
      }
    });
  }

  fetchIndicatorProperties(indicatorMetadata, spatialUnitId) {
    let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + indicatorMetadata.indicatorId + "/" + spatialUnitId + "/without-geometry";
    return this.http.get(url).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        this.dataExchangeService.displayMapApplicationError(error);
      }
    });
  }

  getColorForFeature(feature, indicatorMetadataAndGeoJSON, targetDate, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue){
    var color;

    if(!targetDate.includes(this.INDICATOR_DATE_PREFIX)){
      targetDate = this.INDICATOR_DATE_PREFIX + targetDate;
    }

    if(this.dataExchangeService.indicatorValueIsNoData(feature.properties[targetDate])){
      color = this.defaultColorForNoDataValues;
    }
    else if(this.filterHelperService.featureIsCurrentlyFiltered(feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME])){
      color = this.defaultColorForFilteredValues;
    }
    else if(this.exchangeData.classifyZeroSeparately && this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) == 0 ){
      color = this.defaultColorForZeroValues;
    }
    else if(feature.properties["outlier"] !== undefined && feature.properties["outlier"].includes("low") && this.exchangeData.useOutlierDetectionOnIndicator){
      color = this.defaultColorForOutliers_low;
    }
    else if(feature.properties["outlier"] !== undefined && feature.properties["outlier"].includes("high") && this.exchangeData.useOutlierDetectionOnIndicator){
      color = this.defaultColorForOutliers_high;
    }
    else if(isMeasureOfValueChecked){

      if(this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) >= +Number(measureOfValue).toFixed(this.numberOfDecimals)){
        color = this.getColorFromBrewInstance(gtMeasureOfValueBrew, feature, targetDate);                
      }
      else {
        color = this.getColorFromBrewInstance(ltMeasureOfValueBrew, feature, targetDate);
      }

    }
    else{
      if(indicatorMetadataAndGeoJSON.indicatorType.includes('DYNAMIC')){

        if(feature.properties[targetDate] < 0){
          
          color = this.getColorFromBrewInstance(dynamicDecreaseBrew, feature, targetDate);
        }
        else{
          color = this.getColorFromBrewInstance(dynamicIncreaseBrew, feature, targetDate);
        }

      }
      else{

        if(this.containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON, targetDate)){
          if(this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[targetDate]) >= 0){
            if(this.exchangeData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[targetDate]) == 0)){
              color = this.defaultColorForZeroValues;
              // if(__env.useTransparencyOnIndicator){
              //   fillOpacity = __env.defaultFillOpacityForZeroFeatures;
              // }
            }
            else{
              color = this.getColorFromBrewInstance(dynamicIncreaseBrew, feature, targetDate);
            }
          }
          else{
            if(this.exchangeData.classifyZeroSeparately && (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[targetDate]) == 0)){
              color = this.defaultColorForZeroValues;
              // if(__env.useTransparencyOnIndicator){
              //   fillOpacity = __env.defaultFillOpacityForZeroFeatures;
              // }
            }
            else{
              color = this.getColorFromBrewInstance(dynamicDecreaseBrew, feature, targetDate);
            }
          }
        }
        else{
          color = this.getColorFromBrewInstance(defaultBrew, feature, targetDate);                 
        }
      }
    }

    return color;
  }

  containsNegativeValues(geoJSON, date) {

    var propertyName = date;

    if(! propertyName.includes(this.exchangeData.indicatorDatePrefix)){
      propertyName = this.exchangeData.indicatorDatePrefix + propertyName;
    }

    var containsNegativeValues = false;
    for (var i = 0; i < geoJSON.features.length; i++) {
      if (geoJSON.features[i].properties[propertyName] < 0) {
        containsNegativeValues = true;
        break;
      }
    }

    return containsNegativeValues;
  }

  getColorFromBrewInstance(brewInstance, feature, targetDate){
    var color;
    for (var index=0; index < brewInstance.breaks.length; index++){

      if(this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) == this.dataExchangeService.getIndicatorValue_asNumber(brewInstance.breaks[index])){
        if(index < brewInstance.breaks.length -1){
          // min value
          color =  brewInstance.colors[index];
          break;
        }
        else {
          //max value
          if (brewInstance.colors[index]){
            color =  brewInstance.colors[index];
          }
          else{
            color =  brewInstance.colors[index - 1];
          }
          break;
        }
      }
      else{
        if(this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) < this.dataExchangeService.getIndicatorValue_asNumber(brewInstance.breaks[index + 1])) {
          color =  brewInstance.colors[index];
          break;
        }
      }
    }

    return color;
  }
  
  getBarChartOptions(customFontFamilyEnabled = false) {
    return this.prepCustomStyling(customFontFamilyEnabled, this.barChartOptions);
  }

  getGeoMapChartOptions(customFontFamilyEnabled = false) {
    return this.prepCustomStyling(customFontFamilyEnabled, this.geoMapChartOptions);
  }

  getHistogramChartOptions(customFontFamilyEnabled = false) {
    return this.prepCustomStyling(customFontFamilyEnabled, this.histogramChartOptions);
  }

  getLineChartOptions(customFontFamilyEnabled = false) {
    return this.prepCustomStyling(customFontFamilyEnabled, this.lineChartOptions);
  };

  prepareAllDiagramResources_forCurrentMapIndicator(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates) {        
    this.prepareAllDiagramResources(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates, false);
  }

  prepareAllDiagramResources_forReportingIndicator(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates) {
    this.prepareAllDiagramResources(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates, true);      
  }

  prepareAllDiagramResources(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates, forceUseSubmittedIndicatorForTimeseries) {

    this.indicatorPropertyName = this.INDICATOR_DATE_PREFIX + date;

    var featureNamesArray = new Array();
    var indicatorValueArray = new Array();
    var indicatorValueBarChartArray = new Array();

    //sort array of features
    var cartographicFeatures = indicatorMetadataAndGeoJSON.geoJSON.features;
    cartographicFeatures.sort((a,b) => this.compareFeaturesByIndicatorValue(a,b));

    for (let j = 0; j < cartographicFeatures.length; j++) {
      // diff occurs when balance mode is activated
      // then, cartographicFeatures display balance over time period, which shall be reflected in bar chart and histogram
      // the other diagrams must use the "normal" unbalanced indicator instead --> selectedFeatures
      var cartographicFeature = cartographicFeatures[j];

      var indicatorValue;
      if (this.dataExchangeService.indicatorValueIsNoData(cartographicFeature.properties[this.indicatorPropertyName])) {
        indicatorValue = null;
      }
      else {
        indicatorValue = this.dataExchangeService.getIndicatorValue_asNumber(cartographicFeature.properties[this.indicatorPropertyName]);  
      }

      var featureName = cartographicFeature.properties[window.__env.FEATURE_NAME_PROPERTY_NAME]
      featureNamesArray.push(featureName);
      indicatorValueArray.push(indicatorValue);

      var color = this.getColorForFeature(cartographicFeature, indicatorMetadataAndGeoJSON, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue);

      var seriesItem = {
        value: indicatorValue,
        name: featureName,
        itemStyle: {
          color: color,
          // borderWidth: 1,
          // borderColor: 'black'
        }
      };

      indicatorValueBarChartArray.push(seriesItem);

    }

    // TIMESERIES
    var indicatorTimeSeriesDatesArray = indicatorMetadataAndGeoJSON.applicableDates;

    if(filterOutFutureDates){
      // remove all timestamps that are newer than the given date
      var dateInDateFormat = Date.parse(date);
      indicatorTimeSeriesDatesArray = indicatorTimeSeriesDatesArray.filter( t => {
        var tInDateFormat = Date.parse(t);
        if (tInDateFormat <= dateInDateFormat) {
          return true;
        } else {
          return false;
        }
      });
    }  
    var indicatorTimeSeriesAverageArray = new Array(indicatorTimeSeriesDatesArray.length);
    var indicatorTimeSeriesMaxArray = new Array(indicatorTimeSeriesDatesArray.length);
    var indicatorTimeSeriesMinArray = new Array(indicatorTimeSeriesDatesArray.length);
    var indicatorTimeSeriesCountArray = new Array(indicatorTimeSeriesDatesArray.length);

    var indicatorTimeSeriesRegionalMeanArray = new Array(indicatorTimeSeriesDatesArray.length);
    var indicatorTimeSeriesRegionalSpatiallyUnassignableArray = new Array(indicatorTimeSeriesDatesArray.length);
    let regionalReferencesMap = new Map();

    if (indicatorMetadataAndGeoJSON.regionalReferenceValues){
      for (const entry of indicatorMetadataAndGeoJSON.regionalReferenceValues) {
        regionalReferencesMap.set(entry.referenceDate, entry);
      }
    }
    

    // initialize timeSeries arrays
    for (var i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
      indicatorTimeSeriesAverageArray[i] = 0;
      indicatorTimeSeriesCountArray[i] = 0;
    }
  
    let indicatorMetadataForTimeseries = indicatorMetadataAndGeoJSON;

    if(!forceUseSubmittedIndicatorForTimeseries && this.exchangeData.isBalanceChecked){
      indicatorMetadataForTimeseries = this.exchangeData.selectedIndicator;
    }
    // we must use the original selectedIndicator in case balance mode is active
    // otherwise balance timestamp will have balance values          
    for (var t = 0; t < indicatorMetadataForTimeseries.geoJSON.features.length; t++) {
      var indicatorFeature = indicatorMetadataForTimeseries.geoJSON.features[t];
      // continue timeSeries arrays by adding and counting all time series values
      for (var i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
        var datePropertyName = this.INDICATOR_DATE_PREFIX + indicatorTimeSeriesDatesArray[i];
        if (!this.dataExchangeService.indicatorValueIsNoData(indicatorFeature.properties[datePropertyName])) {
          // indicatorTimeSeriesAverageArray[i] += selectedFeature.properties[datePropertyName];
          indicatorTimeSeriesAverageArray[i] += indicatorFeature.properties[datePropertyName];
          indicatorTimeSeriesCountArray[i]++;

          // min stack
          if (indicatorTimeSeriesMinArray[i] === undefined || indicatorTimeSeriesMinArray[i] === null){
            indicatorTimeSeriesMinArray[i] = indicatorFeature.properties[datePropertyName];
          }
          else{
            if(indicatorFeature.properties[datePropertyName] < indicatorTimeSeriesMinArray[i]){
              indicatorTimeSeriesMinArray[i] = indicatorFeature.properties[datePropertyName];
            }
          }

          // max stack
          if (indicatorTimeSeriesMaxArray[i] === undefined || indicatorTimeSeriesMaxArray[i] === null){
            indicatorTimeSeriesMaxArray[i] = indicatorFeature.properties[datePropertyName];
          }
          else{
            if(indicatorFeature.properties[datePropertyName] > indicatorTimeSeriesMaxArray[i]){
              indicatorTimeSeriesMaxArray[i] = indicatorFeature.properties[datePropertyName];
            }
          }

          // regional reference values
          // als map auslagern und dann hier prüfen, ob ein element in der map drin ist.
          // falls nicht, dann null setzen, 
          if (regionalReferencesMap.has(indicatorTimeSeriesDatesArray[i])){
            let regionalAverage = regionalReferencesMap.get(indicatorTimeSeriesDatesArray[i]).regionalAverage;
            if (regionalAverage && typeof(regionalAverage) == "number"){
              indicatorTimeSeriesRegionalMeanArray[i] = regionalAverage;
            }
            else{
              indicatorTimeSeriesRegionalMeanArray[i] = null;
            }

            let regionalSpatiallyUnassignable = regionalReferencesMap.get(indicatorTimeSeriesDatesArray[i]).spatiallyUnassignable;
            if (regionalSpatiallyUnassignable && typeof(regionalSpatiallyUnassignable) == "number"){
              indicatorTimeSeriesRegionalSpatiallyUnassignableArray[i] = regionalSpatiallyUnassignable;
            }
            else{
              indicatorTimeSeriesRegionalSpatiallyUnassignableArray[i] = null;
            }
            
          }
          else{
            indicatorTimeSeriesRegionalMeanArray[i] = null;
            indicatorTimeSeriesRegionalSpatiallyUnassignableArray[i] = null;
          }

        }
      }
    }

    // finish timeSeries arrays by computing averages of all time series values
    for (var i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
      indicatorTimeSeriesAverageArray[i] = this.dataExchangeService.getIndicatorValue_asNumber(indicatorTimeSeriesAverageArray[i] / indicatorTimeSeriesCountArray[i]);
    }

    let meanLineLabel = "rechnerischer Durchschnitt";
    let arithmMeanValueIndex = indicatorTimeSeriesDatesArray.indexOf(date);
    // replace formatted string like "12.506,32" to 12506.32 in order to parse the correct number
    let meanLineValue = parseFloat(indicatorTimeSeriesAverageArray[arithmMeanValueIndex]); 
    let regionalMeanValueUsed = false;
    let enableHorizontalMeanLine = true;

    if (indicatorMetadataForTimeseries.regionalReferenceValues){
      for (const regionalReferenceValuesEntry of indicatorMetadataForTimeseries.regionalReferenceValues) {
        if (regionalReferenceValuesEntry.referenceDate && regionalReferenceValuesEntry.referenceDate == date){    
          if(regionalReferenceValuesEntry.regionalAverage && (typeof regionalReferenceValuesEntry.regionalAverage == 'number')){
            meanLineValue = regionalReferenceValuesEntry.regionalAverage;
            // meanLineValue = parseFloat(kommonitorDataExchangeService.allFeaturesRegionalMean.replace(/\./g, '').replace(/,/g, '.')); 
            meanLineLabel = "gesamtregionaler Durchschnitt";
            regionalMeanValueUsed = true;
          }                       
        }
      }
    }

    if (! regionalMeanValueUsed && this.exchangeData.configMeanDataDisplay == 'regionalMeanOrNone'){
      enableHorizontalMeanLine = false;
    }

    // setHistogramChartOptions(indicatorMetadataAndGeoJSON, indicatorValueArray, spatialUnitName, date);

    this.setLineChartOptions(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray, indicatorTimeSeriesMaxArray, indicatorTimeSeriesMinArray, indicatorTimeSeriesRegionalMeanArray, indicatorTimeSeriesRegionalSpatiallyUnassignableArray, spatialUnitName, date);

    this.setBarChartOptions(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, meanLineLabel, meanLineValue, enableHorizontalMeanLine);

    this.setGeoMapChartOptions(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue);
  }

  

  setGeoMapChartOptions(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue) {

    indicatorMetadataAndGeoJSON.geoJSON.features.forEach(feature => {
      feature.properties.name= feature.properties[this.exchangeData.FEATURE_NAME_PROPERTY_NAME];
    });

    var uniqueMapRef = 'geoMapChart';

    echarts.registerMap(uniqueMapRef, indicatorMetadataAndGeoJSON.geoJSON);

    // specify chart configuration item and data

    var legendConfig = this.setupVisualMap(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue);

    // default fontSize of echarts
    var fontSize = 18;
    var geoMapChartTitel = indicatorMetadataAndGeoJSON.indicatorName + ' - ' + spatialUnitName + ' - ' + date;

    var seriesData:any = [];

    for (let index = 0; index < featureNamesArray.length; index++) {
      var featureName = featureNamesArray[index];

      /*
      var seriesItem = {
        value: indicatorValue,
        itemStyle: {
          color: color
          // borderWidth: 1,
          // borderColor: 'black'
        }
      };
      */
      var featureValue = indicatorValueBarChartArray[index].value;
      
      seriesData.push({
        name: featureName,
        value: featureValue
      });
    }

    // needed for reporting
    for(let feature of indicatorMetadataAndGeoJSON.geoJSON.features) {
      bbox = turf.bbox(feature); // calculate bbox for each feature
      feature.properties.bbox = bbox;
    }
    var bbox = this.calculateOverallBoundingBoxFromGeoJSON(indicatorMetadataAndGeoJSON.geoJSON.features)
    // change format of bbox to match the format needed for echarts
    bbox = [
      [bbox[0], bbox[3]], // north-west lon lat
      [bbox[2], bbox[1]] // south-east lon lat
    ]

    var geoMapOption = {
      // grid get rid of whitespace around chart
      // grid: {
      //   left: '4%',
      //   top: 32,
      //   right: '4%',
      //   bottom: 32,
      //   containLabel: true
      // },
      title: {
        text: geoMapChartTitel,
        left: 'center',
        textStyle: {
          fontSize: fontSize
        },
        show: true
        // top: 15
      },
      tooltip: {
        trigger: 'item',
        confine: 'true',
        showDelay: 0,
        transitionDuration: 0.2,
        formatter: (params) => {
          var value = this.dataExchangeService.getIndicatorValue_asFormattedText(params.value);
          return "" + params.name + ": " + value + " [" + indicatorMetadataAndGeoJSON.unit + "]";
        }           
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: this.exchangeData.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Geo Map Chart', 'schlie&szlig;en', 'refresh'], optionToContent: (opt) => {

              var dataTableId = "geoMapDataTable_" + Math.random();
              var tableExportName = indicatorMetadataAndGeoJSON.indicatorName + " - " + opt.title[0].text;

              var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += "<thead>";
              htmlString += "<tr>";
              htmlString += "<th style='text-align:center;'>Feature-Name</th>";
              htmlString += "<th style='text-align:center;'>" + indicatorMetadataAndGeoJSON.indicatorName + " [" + indicatorMetadataAndGeoJSON.indicatorName + "]</th>";
              htmlString += "</tr>";
              htmlString += "</thead>";

              htmlString += "<tbody>";

              for (var i = 0; i < seriesData.length; i++) {
                var value = this.dataExchangeService.getIndicatorValue_asNumber(seriesData[i].value);
                htmlString += "<tr>";
                htmlString += "<td>" + seriesData[i].name + "</td>";
                htmlString += "<td>" + value + "</td>";
                htmlString += "</tr>";
              }

              htmlString += "</tbody>";
              htmlString += "</table>";

              this.broadcastService.broadcast("AppendExportButtonsForTable", [dataTableId, tableExportName]);

              return htmlString;
            }
          },
          restore: { show: false, title: "Erneuern" },
          saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
        }
      },
      // legend: {
      // 		//data:[indicatorMetadataAndGeoJSON.indicatorName]
      // },
      visualMap: {
        left: 'left',
        type: "piecewise",
        pieces: legendConfig,
        // selectedMode: 'multiple',
        precision: 2,
        show: true
    },
      series: [{
        name: indicatorMetadataAndGeoJSON.indicatorName,
        type: 'map',
        roam: true,
        boundingCoords: bbox,
        map: uniqueMapRef,
        emphasis: {
            label: {
                show: true
            }
        },
        data: seriesData
      }]
    };

    // use configuration item and data specified to show chart
    this.geoMapChartOptions = geoMapOption;
  }

  calculateOverallBoundingBoxFromGeoJSON(features) {
    let result:any = [];
    for(var i=0; i<features.length; i++) {
       // check if we have to modify our overall bbox (result)
       if(result.length === 0) { // for first feature
        result.push(...features[i].properties.bbox);
      } else {
        // all other features
        let bbox = features[i].properties.bbox;
        result[0] = (bbox[0] < result[0]) ? bbox[0] : result[0];
        result[1] = (bbox[1] < result[1]) ? bbox[1] : result[1];
        result[2] = (bbox[2] > result[2]) ? bbox[2] : result[2];
        result[3] = (bbox[3] > result[3]) ? bbox[3] : result[3];
      }
    }
    return result;
  }
  
  setBarChartOptions(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, meanLineLabel, meanLineValue, enableHorizontalMeanLine) {

    // specify chart configuration item and data
    var labelOption_singleBars = {
      show: this.exchangeData.showBarChartLabel,
        position: 'insideBottom',
        align: 'left',
        verticalAlign: 'middle',
        rotate: 90,
        formatter: (params) => {
          return params.name + "  " + this.dataExchangeService.getIndicatorValue_asFormattedText(params.value);
        }
        // formatter: '{b} {c}'
    };

    // default fontSize of echarts
    var fontSize = 18;
    var barChartTitel = 'Ranking - ' + spatialUnitName + ' - ';
    if (indicatorMetadataAndGeoJSON.fromDate) {
      barChartTitel += "Bilanz " + indicatorMetadataAndGeoJSON.fromDate + " - " + indicatorMetadataAndGeoJSON.toDate;
      fontSize = 14;
    }
    else {
      barChartTitel += date;
    }

    var legendConfig = this.setupVisualMap(indicatorMetadataAndGeoJSON, featureNamesArray,
              indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew,
              ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked,
              measureOfValue);

    var barOption:any = {
      // grid get rid of whitespace around chart
      grid: {
        left: '4%',
        top: 32,
        right: '4%',
        bottom: 32,
        containLabel: true
      },
      title: {
        text: barChartTitel,
        left: 'center',
        textStyle: {
          fontSize: fontSize
        },
        show: false
        // top: 15
      },
      tooltip: {
        trigger: 'item',
        confine: 'true',
        formatter:  (params, ticket, callback) => {
          var value = this.dataExchangeService.getIndicatorValue_asFormattedText(params.value);
          return "" + params.name + ": " + value + " [" + indicatorMetadataAndGeoJSON.unit + "]";
        },
        axisPointer: {
          type: 'line',
          crossStyle: {
            color: '#999'
          }
        }
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: this.exchangeData.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Feature-Vergleich', 'schlie&szlig;en', 'refresh'], optionToContent: (opt) => {

              var barData = opt.series[0].data;
              var featureNames = opt.xAxis[0].data;

              var dataTableId = "barDataTable_" + Math.random();
              var tableExportName = opt.xAxis[0].name + " - " + opt.title[0].text;

              var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += "<thead>";
              htmlString += "<tr>";
              htmlString += "<th style='text-align:center;'>Feature-Name</th>";
              htmlString += "<th style='text-align:center;'>" + opt.xAxis[0].name + " [" + opt.yAxis[0].name + "]</th>";
              htmlString += "</tr>";
              htmlString += "</thead>";

              htmlString += "<tbody>";

              for (var i = 0; i < barData.length; i++) {
                var value = this.dataExchangeService.getIndicatorValue_asNumber(barData[i].value);
                htmlString += "<tr>";
                htmlString += "<td>" + featureNames[i] + "</td>";
                htmlString += "<td>" + value + "</td>";
                htmlString += "</tr>";
              }

              htmlString += "</tbody>";
              htmlString += "</table>";

              this.broadcastService.broadcast("AppendExportButtonsForTable", [dataTableId, tableExportName]);

              return htmlString;
            }
          },
          restore: { show: false, title: "Erneuern" },
          saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
        }
      },
      xAxis: {
        name: indicatorMetadataAndGeoJSON.indicatorName,
        nameLocation: 'center',
        nameGap: 15,
        axisLabel: {
          rotate: 90,
          interval: 0,
          inside: true,
          show: false
        },
        axisTick: {
          show: false
        },
        z: 6,
        zlevel: 6,
        data: featureNamesArray
      },
      yAxis: {
        type: 'value',
        name: indicatorMetadataAndGeoJSON.unit,
        axisLabel: {
          formatter: (value, index) => {
            return this.dataExchangeService.getIndicatorValue_asFormattedText(value);
          }
        }
        // splitArea: {
        //     show: true
        // }
      },
      label: labelOption_singleBars,
      series: [{
        name: "Ranking",
        type: 'bar',
        emphasis: {
          itemStyle: {
            borderWidth: 4,
            borderColor: this.defaultColorForClickedFeatures
          }
        },            
        data: indicatorValueBarChartArray          
        }
      ],
      visualMap: [{
          left: 'left',
          type: "piecewise",
          pieces: legendConfig,
          precision: 2,
          show: false
      }]
    };

    if (enableHorizontalMeanLine){
      barOption.series[0].markLine = 
        {
          name: meanLineLabel,
          data: [
            {yAxis: meanLineValue, name: meanLineLabel}
          ],
          label: {
            position: 'insideStartTop',
            rotate: 0,
            fontStyle: 'italic',
            fontWeight: 'bold',
            name: meanLineLabel          
          },
          lineStyle: {
            color: 'gray'
          }
        }
    }

    // if (indicatorMetadataAndGeoJSON.geoJSON.features.length > 50) {
    //   // barOption.xAxis.data = undefined;
    //   barOption.xAxis.axisLabel.show = false;
    // }

    // use configuration item and data specified to show chart
    this.barChartOptions = barOption;
  };
  
  setLineChartOptions(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray, indicatorTimeSeriesMaxArray, indicatorTimeSeriesMinArray, indicatorTimeSeriesRegionalMeanArray, indicatorTimeSeriesRegionalSpatiallyUnassignableArray, spatialUnitName, date) {

    var lineOption:any = {
      // grid get rid of whitespace around chart
      grid: {
        left: '4%',
        top: 32,
        right: '4%',
        bottom: 55,
        containLabel: true
      },
      title: {
        text: 'Zeitreihe - ' + spatialUnitName,
        left: 'center',
        show: false,
        textStyle: {
          fontSize: 18
        },
        // top: 15
      },
      tooltip: {
        trigger: 'axis',
        confine: 'true',
        formatter: (params) => {

          var string = "" + params[0].axisValueLabel + "<br/>";

          params.forEach((paramObj) => {

            if(! paramObj.seriesName.includes("Stack")){
              var value = this.dataExchangeService.getIndicatorValue_asFormattedText(paramObj.value);
              string += paramObj.seriesName + ": " + value + " [" + indicatorMetadataAndGeoJSON.unit + "]" + "<br/>";
            }                
          });

          return string;
        },
        axisPointer: {
          type: 'line',
          crossStyle: {
            color: '#999'
          }
        }
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: this.exchangeData.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Zeitreihe', 'schlie&szlig;en', 'refresh'], optionToContent: (opt) => {

              // 	<table class="table table-condensed table-hover">
              // 	<thead>
              // 		<tr>
              // 			<th>Indikator-Name</th>
              // 			<th>Beschreibung der Verkn&uuml;pfung</th>
              // 		</tr>
              // 	</thead>
              // 	<tbody>
              // 		<tr ng-repeat="indicator in $ctrl.kommonitorDataExchangeServiceInstance.selectedIndicator.referencedIndicators">
              // 			<td>{{indicator.referencedIndicatorName}}</td>
              // 			<td>{{indicator.referencedIndicatorDescription}}</td>
              // 		</tr>
              // 	</tbody>
              // </table>

              var lineSeries = opt.series;
              var timestamps = opt.xAxis[0].data;

              var dataTableId = "lineDataTable_" + Math.random();
              var tableExportName = opt.xAxis[0].name + " - " + opt.title[0].text;

              var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += "<thead>";
              htmlString += "<tr>";
              htmlString += "<th style='text-align:center;'>Zeitpunkt</th>";

              for (var i = 0; i < lineSeries.length; i++) {
                htmlString += "<th style='text-align:center;'>" + lineSeries[i].name + " [" + opt.yAxis[0].name + "]</th>";
              }

              htmlString += "</tr>";
              htmlString += "</thead>";

              htmlString += "<tbody>";

              for (var j = 0; j < timestamps.length; j++) {
                htmlString += "<tr>";
                htmlString += "<td>" + timestamps[j] + "</td>";
                for (var k = 0; k < lineSeries.length; k++) {
                  var value = this.dataExchangeService.getIndicatorValue_asNumber(lineSeries[k].data[j]);
                  htmlString += "<td>" + value + "</td>";
                }
                htmlString += "</tr>";
              }

              htmlString += "</tbody>";
              htmlString += "</table>";

              this.broadcastService.broadcast("AppendExportButtonsForTable", [dataTableId, tableExportName]);

              return htmlString;
            }
          },
          restore: { show: false, title: "Erneuern" },
          saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
        }
      },
      legend: {
        type: "scroll",
        bottom: 0,
        data: []
      },
      xAxis: {
        name: indicatorMetadataAndGeoJSON.indicatorName,
        nameLocation: 'center',
        nameGap: 22,
        // axisLabel: {
        // 	rotate: 90,
        // 	interval: 0,
        // 	inside: true
        // },
        // z: 6,
        // zlevel: 6,
        type: 'category',
        axisTick: {
          show: false
        },
        data: indicatorTimeSeriesDatesArray
      },
      yAxis: {
        type: 'value',
        name: indicatorMetadataAndGeoJSON.unit,
        axisLabel: {
          formatter: (value, index) => {
            return this.dataExchangeService.getIndicatorValue_asFormattedText(value);
          }
        }
        
        // splitArea: {
        //     show: true
        // }
      },
      series: [          
      
      ]
    };


    let meanLine = {
      name: this.exchangeData.rankingChartAverageLabel,
      type: 'line',
      data: indicatorTimeSeriesAverageArray,
      symbolSize: 6,
      symbol: "emptyCircle",
      lineStyle: {
        normal: {
          color: 'gray',
          width: 2,
          type: 'dashed'
        }
      },
      itemStyle: {
        normal: {
          borderWidth: 3,
          color: 'gray'
        }
      }
    };

    let regionalMeanLine = {
      name: this.exchangeData.rankingChartRegionalReferenceValueLabel,
      type: 'line',
      symbolSize: 8,
      symbol: "circle",
      data: indicatorTimeSeriesRegionalMeanArray,
      lineStyle: {
        normal: {
          color: 'gray',
          width: 2,
          type: 'dashed'
        }
      },
      itemStyle: {
        normal: {
          borderWidth: 3,
          color: 'gray'
        }
      }
    };           

    let regionalMeanUsed = false;

    // only add regional mean line if it contains at least one meaningful entry
    if(indicatorTimeSeriesRegionalMeanArray.some(el => el !== null)){
      lineOption.series.push(regionalMeanLine);
      lineOption.legend.data.push(this.exchangeData.rankingChartRegionalReferenceValueLabel);
      regionalMeanUsed = true;
    }

    if(this.exchangeData.configMeanDataDisplay == "both" || (regionalMeanUsed == false && this.exchangeData.configMeanDataDisplay == 'preferRegionalMeanIfAvailable')){
      lineOption.series.push(meanLine);
      lineOption.legend.data.push(this.exchangeData.rankingChartAverageLabel);
    }     

    // SETTING FOR MIN AND MAX STACK

    // default for min value of 0
    var minStack:any = {
      name: "MinStack",
      type: 'line',
      data: indicatorTimeSeriesMinArray,
      stack: "MinMax",
      // areaStyle:{
      //   color: "#d6d6d6"
      // },
      lineStyle: {
        opacity: 0
      },
      itemStyle: {
        opacity: 0
      },
      silent: true
    };

    var minLine = {
      name: "Min",
      type: 'line',
      data: indicatorTimeSeriesMinArray,
      lineStyle: {
        opacity: 0,
        color: "#d6d6d6"
      },
      itemStyle: {
        opacity: 0
      }
    };

    var maxStack =  {
      name: "MaxStack",
      type: 'line',
      data: indicatorTimeSeriesMaxArray,
      stack: "MinMax",
      areaStyle:{
        color: "#d6d6d6"
      },
      lineStyle: {
        opacity: 0
      },
      itemStyle: {
        opacity: 0
      },
      silent: true
    };

    var maxLine =  {
      name: "Max",
      type: 'line',
      data: indicatorTimeSeriesMaxArray,
      lineStyle: {
        opacity: 0,
        color: "#d6d6d6"
      },
      itemStyle: {
        opacity: 0
      }
    };

    // perform checks if there are negative values or only > 0 values
    // then stacks must be adjusted to be correctly displayed
    var minStack_minValue = Math.min(...indicatorTimeSeriesMinArray);
    if(minStack_minValue < 0){
      minStack.areaStyle = {
          color: "#d6d6d6"
      };
    }

    let indicatorTimeSeriesMaxArray_copy = JSON.parse(JSON.stringify(indicatorTimeSeriesMaxArray));

    if ((indicatorTimeSeriesMinArray.filter(item => item > 0))){
      for (let index = 0; index < indicatorTimeSeriesMaxArray_copy.length; index++) {

        if(indicatorTimeSeriesMinArray[index] > 0){
          indicatorTimeSeriesMaxArray_copy[index] = indicatorTimeSeriesMaxArray_copy[index] - indicatorTimeSeriesMinArray[index];
        }            
      }
      maxStack.data = indicatorTimeSeriesMaxArray_copy;
    }

    lineOption.series.push(minLine);
    lineOption.series.push(maxLine);
    lineOption.series.push(minStack);
    lineOption.series.push(maxStack);

    // spatially unassignable
    let regionalSpatiallyUnassignableLine = {
      name: "räumlich nicht zuordenbare",
      type: 'line',
      symbol: "diamond",
      symbolSize: 10,
      data: indicatorTimeSeriesRegionalSpatiallyUnassignableArray,
      lineStyle: {
        normal: {
          color: 'gray',
          width: 2,
          type: 'dashed'
        }
      },
      itemStyle: {
        normal: {
          borderWidth: 3,
          color: 'gray'
        }
      }
    };
    // only add regional spatially unassignable line if it contains at least one meaningful entry
    if(indicatorTimeSeriesRegionalSpatiallyUnassignableArray.some(el => el !== null)){
      lineOption.series.push(regionalSpatiallyUnassignableLine);
      lineOption.legend.data.push("räumlich nicht zuordenbare");
    };
    

    // use configuration item and data specified to show chart
    this.lineChartOptions = lineOption;
  }

  compareFeaturesByIndicatorValue(featureA, featureB) {
    if (featureA.properties[this.indicatorPropertyName] < featureB.properties[this.indicatorPropertyName])
      return -1;
    if (featureA.properties[this.indicatorPropertyName] > featureB.properties[this.indicatorPropertyName])
      return 1;
    return 0;
  };

  
  setupVisualMap(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue){
    /*
    pieces: [
          // Range of a piece can be specified by property min and max,
          // where min will be set as -Infinity if ignored,
          // and max will be set as Infinity if ignored.
          {min: 1500},
          {min: 900, max: 1500},
          {min: 310, max: 1000},
          {min: 200, max: 300},
          // Label of the piece can be specified.
          {min: 10, max: 200, label: '10 to 200 (custom label) '},
          // Color of the piece can be specified.
          {value: 123, label: '123 (custom special color) ', color: 'grey'},
          {max: 5}
      ]
    */

    var indicatorType = indicatorMetadataAndGeoJSON.indicatorType;

    var pieces:any = [];

    if(this.containsZeroValues(indicatorMetadataAndGeoJSON.geoJSON, date)){
      pieces.push({
        min: 0,  
        opacity: 0.8,     
        max: 0,           
        color: this.defaultColorForZeroValues
      });
    }

    let outliers = indicatorMetadataAndGeoJSON.geoJSON.features.filter(feature => feature.properties["outlier"] !== undefined);

    if (this.exchangeData.useOutlierDetectionOnIndicator && outliers.length > 0){
      outliers.sort((a,b) => this.compareFeaturesByIndicatorValue(a,b));
      let smallestValue = outliers[0].properties[this.indicatorPropertyName];
      let highestValue = outliers[outliers.length - 1].properties[this.indicatorPropertyName];

      pieces.push({
        min: smallestValue,  
        opacity: 0.8,                          
        color: this.defaultColorForOutliers_low
      });

      pieces.push({
        max: highestValue,  
        opacity: 0.8,                          
        color: this.defaultColorForOutliers_high
      });
    }

    // if(containsOutlierValues(indicatorMetadataAndGeoJSON.geoJSON, date)){
    //   pieces.push({
    //     min: 0,  
    //     opacity: 0.8,     
    //     max: 0,           
    //     color: defaultColorForZeroValues
    //   });
    // }

    if(isMeasureOfValueChecked){

      if(gtMeasureOfValueBrew && gtMeasureOfValueBrew.breaks && gtMeasureOfValueBrew.colors){
        // measure of value brew
      var gtBreaks = gtMeasureOfValueBrew.breaks;
      var gtColors = gtMeasureOfValueBrew.colors;          

          for (var j = 0; j < gtColors.length; j++) {

            var legendItem_gtMov:any = {
              min: gtBreaks[j],     
              opacity: 0.8,             
              color: gtColors[j]
            };
            if(gtBreaks[j + 1]){
              legendItem_gtMov.max = gtBreaks[j + 1];
            }

            pieces.push(legendItem_gtMov);

          }
      }

      if(ltMeasureOfValueBrew && ltMeasureOfValueBrew.breaks && ltMeasureOfValueBrew.colors){
        var ltBreaks = ltMeasureOfValueBrew.breaks;
        var ltColors = ltMeasureOfValueBrew.colors;

        for (var j = 0; j < ltColors.length; j++) {

          var legendItem_ltMov:any = {
            min: ltBreaks[j],         
            opacity: 0.8,         
            color: ltColors[ltColors.length - 1 - j]
          };
          if(ltBreaks[j + 1]){
            legendItem_ltMov.max = ltBreaks[j + 1];
          }

          pieces.push(legendItem_ltMov);

        }
      }
      

          
    }
    else if(indicatorType.includes("DYNAMIC")){
      // dynamic brew   
      
      if(dynamicDecreaseBrew){
        var dynamicDecreaseBreaks = dynamicDecreaseBrew.breaks;
        var dynamicDecreaseColors = dynamicDecreaseBrew.colors;

        for (var j = 0; j < dynamicDecreaseColors.length; j++) {

          var legendItem_dynamicDecreaseMov:any = {
            min: dynamicDecreaseBreaks[j],                  
            opacity: 0.8,
            // color: dynamicDecreaseColors[dynamicDecreaseColors.length - 1 - j]
            color: dynamicDecreaseColors[j]
          };
          if(dynamicDecreaseBreaks[j + 1]){
            legendItem_dynamicDecreaseMov.max = dynamicDecreaseBreaks[j + 1];
            legendItem_dynamicDecreaseMov.label = "" + dynamicDecreaseBreaks[j] + " - < " + dynamicDecreaseBreaks[j + 1];

            // in negative scala we must ensure that smallest value near 0 (here max) is included in range
            if(j == dynamicDecreaseColors.length - 1){
              legendItem_dynamicDecreaseMov.max = -0.01;
            }
          }
          else{
            legendItem_dynamicDecreaseMov.max = -0.01;
            legendItem_dynamicDecreaseMov.label = dynamicDecreaseBreaks[j];
          }

          pieces.push(legendItem_dynamicDecreaseMov);

        }
      }

      if(dynamicIncreaseBrew){
          var dynamicIncreaseBreaks = dynamicIncreaseBrew.breaks;
          var dynamicIncreaseColors = dynamicIncreaseBrew.colors;

          for (var j = 0; j < dynamicIncreaseColors.length; j++) {

            var legendItem_dynamicIncreaseMov:any = {
              min: dynamicIncreaseBreaks[j],   
              opacity: 0.8,               
              color: dynamicIncreaseColors[j]
            };
            if(dynamicIncreaseBreaks[j + 1]){
              legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j + 1];
              legendItem_dynamicIncreaseMov.label = "" + dynamicIncreaseBreaks[j] + " - < " + dynamicIncreaseBreaks[j + 1];
            }
            else{
              legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j];
            }

            pieces.push(legendItem_dynamicIncreaseMov);

          }
      }  
      
    }
    else {
      // default brew

      if(this.containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON, date)){
        // dynamic brew            
        if(dynamicDecreaseBrew){
          var dynamicDecreaseBreaks = dynamicDecreaseBrew.breaks;
          var dynamicDecreaseColors = dynamicDecreaseBrew.colors;

          for (var j = 0; j < dynamicDecreaseColors.length; j++) {

            legendItem_dynamicDecreaseMov = {
              min: dynamicDecreaseBreaks[j],
              opacity: 0.8,                  
              // color: dynamicDecreaseColors[dynamicDecreaseColors.length - 1 - j]
              color: dynamicDecreaseColors[j]
            };
            if(dynamicDecreaseBreaks[j + 1]){
              legendItem_dynamicDecreaseMov.max = dynamicDecreaseBreaks[j + 1];
              legendItem_dynamicDecreaseMov.label = "" + dynamicDecreaseBreaks[j] + " - < " + dynamicDecreaseBreaks[j + 1];

              // in negative scala we must ensure that smallest value near 0 (here max) is included in range
              if(j == dynamicDecreaseColors.length - 1){
                legendItem_dynamicDecreaseMov.max = -0.01;
              }
            }
            else{
              legendItem_dynamicDecreaseMov.max = -0.01;
              legendItem_dynamicDecreaseMov.label = dynamicDecreaseBreaks[j];
            }

            pieces.push(legendItem_dynamicDecreaseMov);

          }
        }
      
        if(dynamicIncreaseBrew){
          var dynamicIncreaseBreaks = dynamicIncreaseBrew.breaks;
          var dynamicIncreaseColors = dynamicIncreaseBrew.colors;

          for (var j = 0; j < dynamicIncreaseColors.length; j++) {

            legendItem_dynamicIncreaseMov = {
              min: dynamicIncreaseBreaks[j], 
              opacity: 0.8,                 
              color: dynamicIncreaseColors[j]
            };
            if(dynamicIncreaseBreaks[j + 1]){
              legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j + 1];
              legendItem_dynamicIncreaseMov.label = "" + dynamicIncreaseBreaks[j] + " - < " + dynamicIncreaseBreaks[j + 1];
            }
            else{
              legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j];
            }

            pieces.push(legendItem_dynamicIncreaseMov);

          }
        }
        
      }
      else{
        if(defaultBrew && defaultBrew.breaks && defaultBrew.colors){
          var breaks = defaultBrew.breaks;
          var colors = defaultBrew.colors;

            for (var j = 0; j < colors.length; j++) {

              var legendItem_default = {
                min: breaks[j],
                opacity: 0.8,
                max: breaks[j + 1],
                color: colors[j]
              };

              pieces.push(legendItem_default);

            } 
       }
           
      }

      
    }

    return pieces;

  }

  containsZeroValues(geoJSON, date) {

    var propertyName = date;

    if(! propertyName.includes(this.exchangeData.indicatorDatePrefix)){
      propertyName = this.exchangeData.indicatorDatePrefix + propertyName;
    }

    var containsZeroValues = false;
    for (var i = 0; i < geoJSON.features.length; i++) {
      if (geoJSON.features[i].properties[propertyName] === 0 || geoJSON.features[i].properties[propertyName] === "0") {
        containsZeroValues = true;
        break;
      }
    }

    return containsZeroValues;
  }

  onlyContainsPositiveNumbers(indicatorValueArray) {

    let ret = true;
    indicatorValueArray.forEach((element) => {
      if (element < 0) {
        ret = false;
      }
    });

    return ret;
  };

  findPropertiesForTimeSeries(spatialUnitFeatureName) {
    for (var feature of this.exchangeData.selectedIndicator.geoJSON.features) {
      if (feature.properties[window.__env.FEATURE_NAME_PROPERTY_NAME] == spatialUnitFeatureName) {
        return feature.properties;
      }
    }
  }

  getSeriesIndexByFeatureName(featureName) {
    for (var index = 0; index < this.lineChartOptions.series.length; index++) {
      if (this.lineChartOptions.series[index].name === featureName)
        return index;
    }

    //return -1 if none was found
    return -1;
  }

  makeFeatureNameForPoiInIsochroneDiagram(poiGeoresource, geoJSONFeatureCollection, date){
    return poiGeoresource.datasetName + " - " + date + " (" + geoJSONFeatureCollection.features.length + ")";
  };

  createInitialReachabilityAnalysisPieOptions(poiGeoresource, geoJSONFeatureCollection, rangeValue, date){
    var option = {
      grid: {
        left: '4%',
        top: 0,
        right: '4%',
        bottom: 30,
        containLabel: true
      },
      title: {
        text: 'Analyse Einzugsgebiet ' + rangeValue,
        left: 'center',
        fontSize: '10',
        show: false
        // top: 15
      },
      toolbox: {
        show: false,
        fontSize: '8',
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: this.exchangeData.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Punkte im Einzugsgebiet ' + rangeValue, 'schlie&szlig;en', 'refresh'], optionToContent: (opt) => {

              var poiData = opt.series[0].data;

              var dataTableId = "poiInIsochroneTable_" + Math.random();
              var tableExportName = opt.title[0].text;

              var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += "<thead>";
              htmlString += "<tr>";
              htmlString += "<th style='text-align:center;'>Punktlayer</th>";
              htmlString += "<th style='text-align:center;'>Anzahl Punkte im Einzugsgebiet</th>";
              htmlString += "</tr>";
              htmlString += "</thead>";

              htmlString += "<tbody>";

              for (var i = 0; i < poiData.length; i++) {
                htmlString += "<tr>";
                htmlString += "<td>" + poiData[i].name + "</td>";
                htmlString += "<td>" + poiData[i].value + "</td>";
                htmlString += "</tr>";
              }

              htmlString += "</tbody>";
              htmlString += "</table>";

              this.broadcastService.broadcast("AppendExportButtonsForTable", [dataTableId, tableExportName]);

              return htmlString;
            }
          },
          restore: { show: false, title: "Erneuern" },
          saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
        }
      },
      tooltip: {
          show: false,
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
          fontSize: '10',
          confine: true
      },
      legend: {
          orient: 'vertical',
          type: "scroll",
          fontSize: '8',
          left: 0,
          data: [this.makeFeatureNameForPoiInIsochroneDiagram(poiGeoresource, geoJSONFeatureCollection, date)]
          // data: [legendText]
      },
      series: [
          {
              name: "Punkte im Einzugsgebiet " + rangeValue,
              type: 'pie',
              radius: ['20%', '30%'],
              center: ["50%", "80%"],
              avoidLabelOverlap: true,
              label: {
                  show: false,
                  position: 'center',
                  fontSize: '10'
              },
              
              emphasis: {
                  label: {
                      show: true,
                      fontSize: '10',
                      // fontWeight: 'bold'
                  }
              },
              labelLine: {
                  show: true
              },
              data: [
                  {value: geoJSONFeatureCollection.features.length, name: this.makeFeatureNameForPoiInIsochroneDiagram(poiGeoresource, geoJSONFeatureCollection, date)}
              ]
          }
      ]
    };

    return option;
  }

  appendToReachabilityAnalysisOptions(poiGeoresource, geoJSONFeatureCollection, eChartsOptions, date){
    eChartsOptions.legend[0].data.push(this.makeFeatureNameForPoiInIsochroneDiagram(poiGeoresource, geoJSONFeatureCollection, date));
    eChartsOptions.series[0].data.push({value: geoJSONFeatureCollection.features.length, name: this.makeFeatureNameForPoiInIsochroneDiagram(poiGeoresource, geoJSONFeatureCollection, date)});

    return eChartsOptions;
  }

  removePoiFromReachabilityAnalysisOption(eChartOptions, poiGeoresource){
    for (let index = 0; index < eChartOptions.legend[0].data.length; index++) {
      const legendItem = eChartOptions.legend[0].data[index];
      if(legendItem.includes(poiGeoresource.datasetName)){
        eChartOptions.legend[0].data.splice(index, 1);
      }
    }

    for (let index2 = 0; index2 < eChartOptions.series[0].data.length; index2++) {
      const dataItem = eChartOptions.series[0].data[index2];
      if(dataItem.name.includes(poiGeoresource.datasetName)){
        eChartOptions.series[0].data.splice(index2, 1);
      }
    }
    
    return eChartOptions;
  }

  makeTrendChartOptions_forAllFeatures(indicatorMetadataAndGeoJSON, fromDateAsPropertyString, toDateAsPropertyString, showMinMax, showCompleteTimeseries, computationType, trendEnabled, customFontFamilyEnabled = false){
      // we may base on the the precomputed timeseries lineOptions and modify that from a cloned instance

      var timeseriesOptions = jQuery.extend(true, {}, this.getLineChartOptions(customFontFamilyEnabled));

      // remove any additional lines for concrete features
      timeseriesOptions.series.length = 5;

      // add markedAreas for periods out of scope

      var fromDateString = fromDateAsPropertyString.split(window.__env.indicatorDatePrefix)[1];
      var fromDate_date = new Date(fromDateString);
      var toDateString = toDateAsPropertyString.split(window.__env.indicatorDatePrefix)[1];
      var toDate_date = new Date(toDateString);
      
      if(showCompleteTimeseries){
        timeseriesOptions.series[0].markArea = {
          silent: true,
          itemStyle: {
              color: '#b50b0b',
              opacity: 0.3
          },
          data: [[{
              xAxis: indicatorMetadataAndGeoJSON.applicableDates[0]
          }, {
              xAxis: fromDateString
          }],
          [{
              xAxis: toDateString
          }, {
              xAxis: indicatorMetadataAndGeoJSON.applicableDates[indicatorMetadataAndGeoJSON.applicableDates.length - 1]
          }]]
        };
      }          

      // hide data points
      timeseriesOptions.series[0].itemStyle.normal.opacity = 0;
      timeseriesOptions.series[0].lineStyle.normal.width = 3;
      timeseriesOptions.series[0].lineStyle.normal.type = "solid";  
      
      var trendData:any = [];

      var timeseriesData = timeseriesOptions.series[0].data;  
      var minSeriesData = timeseriesOptions.series[1].data;  
      var maxSeriesData = timeseriesOptions.series[2].data;           

      if(! showCompleteTimeseries){
        var xData:any = [];
        var timeData:any = [];
        var minData:any = [];
        var maxData:any = [];
        for (let index = 0; index < timeseriesData.length; index++) {
          var date_candidate = new Date(indicatorMetadataAndGeoJSON.applicableDates[index]);
          if(date_candidate >= fromDate_date && date_candidate <= toDate_date){
            const value = timeseriesData[index];
            // const date = indicatorMetadataAndGeoJSON.applicableDates[index];

            timeData.push(value);
            xData.push(indicatorMetadataAndGeoJSON.applicableDates[index]);  
            minData.push(minSeriesData[index]);
            maxData.push(maxSeriesData[index]);             
          }            
        }

        timeseriesOptions.series[0].data = timeData;
        timeseriesOptions.series[1].data = minData;
        timeseriesOptions.series[2].data = maxData;

        timeseriesOptions.xAxis.data = xData;
      }     

      // update value if it has changed
      timeseriesData = timeseriesOptions.series[0].data;
      var xAxisData = timeseriesOptions.xAxis.data;
      for (let index = 0; index < timeseriesData.length; index++) {
        var dateCandidate = new Date(xAxisData[index]);
        if(dateCandidate >= fromDate_date && dateCandidate <= toDate_date){
          const value = timeseriesData[index];
          // const date = indicatorMetadataAndGeoJSON.applicableDates[index];

          trendData.push([index, value]);
        }            
      }

      // add regression line according to option          
      if (trendEnabled) {
        var trendLine; 
        if (computationType.includes("linear")){
          trendLine = ecStat.regression('linear', trendData,0);
        }
        else if (computationType.includes("exponential")){
          trendLine = ecStat.regression('exponential', trendData,0);
        }
        else if (computationType.includes("polynomial_3")){
          trendLine = ecStat.regression('polynomial', trendData, 3);
        }
        else{
          trendLine = ecStat.regression('linear', trendData,0);
        }

        timeseriesOptions.legend.data.push("Trendlinie");

        // make array of numeric values for series
        let trendLineNumbers:any = [];
        let trendLinePointsMap:any = new Map();
        for (const trendLineItem of trendLine.points) {
          trendLinePointsMap.set(trendLineItem[0], trendLineItem[1]);
        }
        for (let index = 0; index < timeseriesData.length; index++) {
          if(trendLinePointsMap.has(index)){
            trendLineNumbers.push(trendLinePointsMap.get(index));
          }
          else{
            trendLineNumbers.push(NaN);
          }
        }
        

        timeseriesOptions.series.push({
          name: 'Trendlinie',
          type: 'line',
          showSymbol: false,
          data: trendLineNumbers,
          lineStyle: {
            normal: {
              color: 'red',
              width: 4,
              type: 'dashed'
            }
          },
          itemStyle: {
            normal: {
              borderWidth: 3,
              color: 'red',
              opacity: 0
            }
          },
          markPoint: {
              itemStyle: {
                  normal: {
                      color: 'transparent'
                  }
              },
              // label: {
              //     normal: {
              //         show: true,
              //         position: 'left',
              //         formatter: trendLine.expression,
              //         textStyle: {
              //             color: '#333',
              //             fontSize: 14
              //         }
              //     }
              // },
              data: [{
                  coord: trendLine.points[trendLine.points.length - 1]
              }]
          }
        });
      }
      

    if(! showMinMax){
      timeseriesOptions.series.splice(1, 4);
    }

      return timeseriesOptions;
  };

  // Returns an image.
  // Attribution has to be converted to an image anyway for report generation.
  createReportingReachabilityMapAttribution() {
    let attributionText = "Leaflet | Map data @ OpenStreetMap contributors"
    let canvas = document.createElement("canvas")
    canvas.width = 800;
    let ctx = canvas.getContext('2d')
    if(ctx) {
      ctx.font = "8pt Arial";
      ctx.textBaseline = 'top';
      ctx.fillStyle = "rgb(60, 60, 60)";
      ctx.fillText(attributionText, 0, 0);
    }
    canvas = this.trimCanvas(canvas, 5)

    let image = new Image(canvas.width, canvas.height)
    image.style.backgroundColor = "white";
    return new Promise( (resolve, reject) => {
      image.onload = function() {
        resolve(image);
      }
      image.src = canvas.toDataURL();
    });
  }

  // Returns an image.
  // Legend has to be converted to an image anyway for report generation.
  createReportingReachabilityMapLegend(echartsOptions, selectedSpatialUnit, isochronesRangeType, isochronesRangeUnits) {
    let legendEntries:any = [];
    let isochronesHeadingAdded = false;
    for(let i=0; i<echartsOptions.series.length; i++) {
      let series = echartsOptions.series[i];

      if(series.name === "spatialUnitBoundaries") {
        legendEntries.push({
          label: selectedSpatialUnit.spatialUnitName ? selectedSpatialUnit.spatialUnitName : selectedSpatialUnit.spatialUnitLevel,
          iconColor: series.itemStyle.borderColor,
          iconHeight: 4,
          isGroupHeading: false
        });
      }

      if(series.name.includes("isochrones")) {

        if(!isochronesHeadingAdded) { // add heading above first isochrone entry
          legendEntries.push({
            label: "Erreichbarkeit",
            isGroupHeading: true
          })
          isochronesHeadingAdded = true;
        }

        let value = series.data[0].value;
        legendEntries.push({
          label: value,
          iconColor: series.data[0].itemStyle.areaColor,
          iconOpacity: series.data[0].itemStyle.opacity,
          iconHeight: 12,
          isGroupHeading: false,
          isIsochroneEntry: true
        })
      }
    }

    let canvas = document.createElement("canvas")
    canvas.width = 800;
    canvas.height = 800;
    let ctx = canvas.getContext('2d')
    let fontStyle = "8pt Arial";
    if(ctx)
      ctx.font = fontStyle
    let xPos = 5
    let yPos = 5
    let rowHeight = 20
    let iconWidth = 30
    
    for(let entry of legendEntries) {
      if(entry.isGroupHeading) {
        let isochronesRangeTypeMapping = {
          "time": "Zeit",
          "distance": "Distanz"
        }
        // only draw label
        ctx!.font = "bold " + fontStyle;
        ctx!.fillStyle = "black";
        ctx!.textBaseline = "top";
        let text = entry.label + " [" + isochronesRangeTypeMapping[isochronesRangeType] + "]"
        ctx!.fillText(text , xPos, yPos);
        yPos += rowHeight
      } else {
        // icon
        if(entry.isIsochroneEntry) {
          let isochroneEntries = legendEntries.filter( entry => {
            return entry.isIsochroneEntry
          });
          // layer isochrone icons on top of each other unitl we reach the current one
          for(let isochroneEntry of isochroneEntries.reverse()) {
            if(isochroneEntry === entry) {
              break;
            }
            ctx!.fillStyle = isochroneEntry.iconColor;
            ctx!.globalAlpha = isochroneEntry.iconOpacity;
            ctx!.fillRect(xPos, yPos + ( (12-entry.iconHeight) / 2), iconWidth, isochroneEntry.iconHeight)
            ctx!.globalAlpha = 1;
          }
        }

        ctx!.fillStyle = entry.iconColor;
        ctx!.globalAlpha = entry.iconOpacity ? entry.iconOpacity : 1;
        ctx!.fillRect(xPos, yPos + ( (12-entry.iconHeight) / 2), iconWidth, entry.iconHeight)
        ctx!.globalAlpha = 1;
        // and label
        ctx!.font = fontStyle;
        ctx!.fillStyle = "black";
        ctx!.textBaseline = "top";
        if(entry.isIsochroneEntry) {
          let text = entry.label + " " + isochronesRangeUnits
          ctx!.fillText(text, xPos + iconWidth + 5, yPos)
        } else {
          ctx!.fillText(entry.label, xPos + iconWidth + 5, yPos)
        }
        yPos += rowHeight
      }
    }

    canvas = this.trimCanvas(canvas, 5)
    let image = new Image(canvas.width, canvas.height)
    image.style.backgroundColor = "white";
    return new Promise( (resolve, reject) => {
      image.onload = function() {
        resolve(image);
      }
      image.src = canvas.toDataURL();
    });
  }

  trimCanvas(canvas, padding=0) {
    function rowBlank(imageData, width, y) {
        for (var x = 0; x < width; ++x) {
            if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
        }
        return true;
    }
 
    function columnBlank(imageData, width, x, top, bottom) {
        for (var y = top; y < bottom; ++y) {
            if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
        }
        return true;
    }
 
 
        var ctx = canvas.getContext("2d");
        var width = canvas.width;
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var top = 0, bottom = imageData.height, left = 0, right = imageData.width;
 
        while (top < bottom && rowBlank(imageData, width, top)) ++top;
        while (bottom - 1 > top && rowBlank(imageData, width, bottom - 1)) --bottom;
        while (left < right && columnBlank(imageData, width, left, top, bottom)) ++left;
        while (right - 1 > left && columnBlank(imageData, width, right - 1, top, bottom)) --right;
 
        var trimmed = ctx.getImageData(left, top, right - left, bottom - top);
        var copy = canvas.ownerDocument.createElement("canvas");
        var copyCtx = copy.getContext("2d");
        copy.width = trimmed.width + padding*2;
        copy.height = trimmed.height + padding*2;
        copyCtx.putImageData(trimmed, padding, padding);
 
        return copy;
  }
  
/* 
  setHistogramChartOptions = function (indicatorMetadataAndGeoJSON, indicatorValueArray, spatialUnitName, date) {
    var bins;
    try {
      bins = ecStat.histogram(indicatorValueArray);
    }
    catch (error) {
      console.log("Histogram chart cannot be drawn - error in bins creation");
      // kommonitorDataExchangeService.displayMapApplicationError(error);          
    }

    // default fontSize of echarts title
    var fontSize = 18;
    var histogramChartTitel = 'Histogramm - ' + spatialUnitName + ' - ';
    if (indicatorMetadataAndGeoJSON.fromDate) {
      histogramChartTitel += "Bilanz " + indicatorMetadataAndGeoJSON.fromDate + " - " + indicatorMetadataAndGeoJSON.toDate;
      fontSize = 14;
    }
    else {
      histogramChartTitel += date;
    }

    var histogramOption = {
      // grid get rid of whitespace around chart
      grid: {
        left: '4%',
        top: 32,
        right: '4%',
        bottom: 35,
        containLabel: true
      },
      title: {
        text: histogramChartTitel,
        left: 'center',
        textStyle: {
          fontSize: fontSize
        },
        show: false
        // top: 15
      },
      tooltip: {
        trigger: 'item',
        confine: 'true',
        axisPointer: {
          type: 'line',
          crossStyle: {
            color: '#999'
          }
        }
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: kommonitorDataExchangeService.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Histogramm', 'schlie&szlig;en', 'refresh'], optionToContent: function (opt) {

              // 	<table class="table table-condensed table-hover">
              // 	<thead>
              // 		<tr>
              // 			<th>Indikator-Name</th>
              // 			<th>Beschreibung der Verkn&uuml;pfung</th>
              // 		</tr>
              // 	</thead>
              // 	<tbody>
              // 		<tr ng-repeat="indicator in $ctrl.kommonitorDataExchangeServiceInstance.selectedIndicator.referencedIndicators">
              // 			<td>{{indicator.referencedIndicatorName}}</td>
              // 			<td>{{indicator.referencedIndicatorDescription}}</td>
              // 		</tr>
              // 	</tbody>
              // </table>

              var histogramData = opt.series[0].data;

              var dataTableId = "histogramDataTable_" + Math.random();
              var tableExportName = opt.xAxis[0].name + " - " + opt.title[0].text;

              var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += "<thead>";
              htmlString += "<tr>";
              htmlString += "<th style='text-align:center;'>Wertintervall</th>";
              htmlString += "<th style='text-align:center;'>H&auml;ufigkeit</th>";
              htmlString += "</tr>";
              htmlString += "</thead>";

              htmlString += "<tbody>";

              for (var i = 0; i < histogramData.length; i++) {
                htmlString += "<tr>";
                htmlString += "<td>" + histogramData[i][0] + " &mdash; " + histogramData[i][1] + "</td>";
                htmlString += "<td>" + histogramData[i][2] + "</td>";
                htmlString += "</tr>";
              }

              htmlString += "</tbody>";
              htmlString += "</table>";

              $rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);

              return htmlString;
            }
          },
          restore: { show: false, title: "Erneuern" },
          saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
        }
      },
      xAxis: [{
        name: indicatorMetadataAndGeoJSON.indicatorName,
        nameLocation: 'center',
        nameGap: 22,
        scale: true,
      }],
      yAxis: {
        name: 'Anzahl Features',
        axisLabel: {
          formatter: function (value, index) {
            return kommonitorDataExchangeService.getIndicatorValue_asFormattedText(value);
          }
        }
        // nameGap: 35,
        // nameLocation: 'center',
        // nameRotate: 90,
      },
      series: [{
        type: 'custom',
        name: indicatorMetadataAndGeoJSON.indicatorName,
        renderItem: function (params, api) {
          var yValue = api.value(2);
          var start = api.coord([api.value(0), yValue]);
          var size = api.size([api.value(1) - api.value(0), yValue]);
          return {
            type: 'rect',
            shape: {
              x: start[0],
              y: start[1],
              width: size[0] * 0.99,
              height: size[1]
            },
            style: api.style()
          };
        },
        itemStyle: {
          color: '#337ab7'
        },
        // label: {
        //     normal: {
        //         show: true,
        //         position: 'insideTop'
        //     }
        // },
        dimensions: ['untere Intervallgrenze', 'obere Intervallgrenze', 'Anzahl'],
        encode: {
          x: [0, 1],
          y: 2,
          tooltip: [0, 1, 2]
        },
        data: bins ? bins.customData : undefined
      }]
    };

    // var option = {
    //     title: {
    //         text: 'Histogram Chart',
    //         left: 'center',
    //         top: 20
    //     },
    // 		tooltip: {
    // 					trigger: 'axis',
    // 					axisPointer: {
    // 							type: 'line',
    // 							crossStyle: {
    // 									color: '#999'
    // 							}
    // 					}
    // 				},
    //     color: ['rgb(25, 183, 207)'],
    //     grid: {
    //         left: '3%',
    //         right: '3%',
    //         bottom: '3%',
    //         containLabel: true
    //     },
    // 		xAxis: [{
    // 				type: 'value',
    // 					name: 'Wertintervalle',
    // 					nameLocation: 'center',
    // 					nameGap: 15,
    //             scale: true,
    //         }],
    //         yAxis: {
    // 					type: 'value',
    // 					name: 'Anzahl Features',
    // 					nameGap: 22,
    // 					nameLocation: 'center',
    // 					nameRotate: 90,
    //         },
    //     series: [{
    //         name: 'Anzahl',
    //         type: 'bar',
    // 				barWidth: '99,3%',
    //         // label: {
    //         //     normal: {
    //         //         show: true,
    //         //         position: 'insideTop',
    //         //         formatter: function (params) {
    //         //             return params.value[1];
    //         //         }
    //         //     }
    //         // },
    //         data: bins.data
    //     }]
    // };

    if (onlyContainsPositiveNumbers(indicatorValueArray)) {
      histogramOption.xAxis.min = 0;
    }

    self.histogramChartOptions = histogramOption;
  }; */

}
