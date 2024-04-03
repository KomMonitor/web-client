angular.module('kommonitorVisualStyleHelper', ['kommonitorDataExchange']);

/**
 * a common serviceInstance that holds all needed properties for a WPS service.
 *
 * This service represents a shared object ´which is used across the different
 * application tabs/components like Setup, Capabilities, Execute etc.
 *
 * This way, one single service instance can be used to easily share values and
 * parameters for each WPS operation represented by different Angular components
 */
angular
  .module('kommonitorVisualStyleHelper', [])
  .service(
    'kommonitorVisualStyleHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', '__env',
    function ($rootScope, $timeout,
      kommonitorDataExchangeService, $http, __env) {

      const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;

      this.defaultBrew = undefined;
      this.measureOfValueBrew = undefined;
      this.dynamicBrew = undefined;
      this.manualBrew = undefined;

      //allowesValues: equal_interval, quantile, jenks
      this.classifyMethods = [{
        name: "Jenks",
        value: "jenks"
        }, {
        name: "Gleiches Intervall",
        value: "equal_interval"
        }, {
        name: "Quantile",
        value: "quantile"
        }];

      this.manualMOVBreaks = undefined;
    
      this.classifyMethod = __env.defaultClassifyMethod || "jenks";

      this.isCustomComputation = false;

      const numberOfDecimals = __env.numberOfDecimals;
      var defaultColorForFilteredValues = __env.defaultColorForFilteredValues;
      var defaultBorderColorForFilteredValues = __env.defaultBorderColorForFilteredValues;
      var defaultBorderColor = __env.defaultBorderColor;
      var defaultFillOpacity = __env.defaultFillOpacity;
      var defaultFillOpacityForFilteredFeatures = __env.defaultFillOpacityForFilteredFeatures;
      var defaultFillOpacityForHighlightedFeatures = __env.defaultFillOpacityForHighlightedFeatures;
      var defaultFillOpacityForZeroFeatures = __env.defaultFillOpacityForZeroFeatures;
      var defaultColorBrewerPaletteForBalanceIncreasingValues = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
      var defaultColorBrewerPaletteForBalanceDecreasingValues = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
      var defaultColorBrewerPaletteForGtMovValues = __env.defaultColorBrewerPaletteForGtMovValues;
      var defaultColorBrewerPaletteForLtMovValues = __env.defaultColorBrewerPaletteForLtMovValues;
      var defaultColorForHoveredFeatures = __env.defaultColorForHoveredFeatures;
      var defaultColorForClickedFeatures = __env.defaultColorForClickedFeatures;
      var defaultBorderColorForNoDataValues = __env.defaultBorderColorForNoDataValues;
      var defaultColorForNoDataValues = __env.defaultColorForNoDataValues;
      var defaultFillOpacityForNoDataValues = __env.defaultFillOpacityForNoDataValues;

      this.indicatorTransparency = 1 - __env.defaultFillOpacity;
      this.currentIndicatorOpacity = __env.defaultFillOpacity;

      var defaultColorForZeroValues = __env.defaultColorForZeroValues;


      var defaultColorForOutliers_high = __env.defaultColorForOutliers_high;
      var defaultBorderColorForOutliers_high = __env.defaultBorderColorForOutliers_high;
      var defaultFillOpacityForOutliers_high = __env.defaultFillOpacityForOutliers_high;
      var defaultColorForOutliers_low = __env.defaultColorForOutliers_low;
      var defaultBorderColorForOutliers_low = __env.defaultBorderColorForOutliers_low;
      var defaultFillOpacityForOutliers_low = __env.defaultFillOpacityForOutliers_low;
      var useOutlierDetectionOnIndicator = __env.useOutlierDetectionOnIndicator;

      const outlierPropertyName = "outlier";
      const outlierPropertyValue_high_soft = "high-soft";
      const outlierPropertyValue_low_soft = "low-soft";
      const outlierPropertyValue_high_extreme = "high-extreme";
      const outlierPropertyValue_low_extreme = "low-extreme";
      const outlierPropertyValue_no = "no";

      this.outlierFillPattern_low = new L.StripePattern({ weight: 1, spaceweight: 1, patternTransform: "rotate(45)" });

      this.outlierFillPattern_high = new L.StripePattern({ weight: 1, spaceweight: 1, patternTransform: "rotate(-45)" });

      var shape = new L.PatternCircle({
        x: 5,
        y: 5,
        radius: 1,
        fill: true,
        color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultColorForNoDataValues
      });
      this.noDataFillPattern = new L.Pattern({ width: 8, height: 8 });
      this.noDataFillPattern.addShape(shape);

      var outliers_high = undefined;
      var outliers_low = undefined;

      this.outlierStyle_high = {
        weight: 1,
        opacity: 1,
        color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColorForOutliers_high,
        dashArray: '',
        fillOpacity: defaultFillOpacityForOutliers_high,
        fillColor: defaultColorForOutliers_high,
        fillPattern: this.outlierFillPattern_high
      };

      this.outlierStyle_low = {
        weight: 1,
        opacity: 1,
        color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColorForOutliers_low,
        dashArray: '',
        fillOpacity: defaultFillOpacityForOutliers_low,
        fillColor: defaultColorForOutliers_low,
        fillPattern: this.outlierFillPattern_low
      };

      this.noDataStyle = {
        weight: 1,
        opacity: 1,
        color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColorForNoDataValues,
        dashArray: '',
        fillOpacity: defaultFillOpacityForNoDataValues,
        fillColor: defaultColorForNoDataValues,
        // fillPattern: this.noDataFillPattern
      };

      this.filteredStyle = {
        weight: 1,
        opacity: 1,
        color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColorForFilteredValues,
        dashArray: '',
        fillOpacity: defaultFillOpacityForFilteredFeatures,
        fillColor: defaultColorForFilteredValues
      };

      this.featuresPerColorMap = new Map();
      this.featuresPerNoData = 0;
      this.featuresPerZero = 0;
      this.featuresPerOutlierHigh = 0;
      this.featuresPerOutlierLow = 0;

      this.resetFeaturesPerColorObjects = function(){
        this.featuresPerColorMap = new Map();
        this.featuresPerNoData = 0;
        this.featuresPerZero = 0;
        this.featuresPerOutlierLow = 0;
        this.featuresPerOutlierHigh = 0;
      };

      this.incrementFeaturesPerColor = function(color){
        if(this.featuresPerColorMap.has(color)){
          this.featuresPerColorMap.set(color, this.featuresPerColorMap.get(color) + 1);
        }
        else{
          this.featuresPerColorMap.set(color, 1);
        }
      };

      this.getFillColorForZero = function(incrementFeatures){
        if (incrementFeatures) {
          this.featuresPerZero ++;
        }
        return defaultColorForZeroValues;
      };

      this.setupDefaultBrew = function (geoJSON, propertyName, numClasses, colorCode, classifyMethod, forceProvidedIndicator, indicator) {
        this.resetFeaturesPerColorObjects();

        var values = new Array();

        if(kommonitorDataExchangeService.classifyUsingWholeTimeseries){
          values = this.setupDefaultBrewValues_wholeTimeseries(geoJSON, values, forceProvidedIndicator, indicator);
        }
        else{
          values = this.setupDefaultBrewValues_singleTimestamp(geoJSON, propertyName, values);
        }

        this.defaultBrew = setupClassyBrew_usingFeatureCount(values, colorCode, classifyMethod, numClasses);         
        return this.defaultBrew;
      };

      this.setupDefaultBrewValues_singleTimestamp = function(geoJSON, propertyName, values){
        for (var i = 0; i < geoJSON.features.length; i++) {
          if (kommonitorDataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]))
            continue;

          if(kommonitorDataExchangeService.classifyZeroSeparately && (geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")){
            continue;
          }  

          // check if is outlier, then do not use within classification, as it will be marked on map with special color
          if (geoJSON.features[i].properties[outlierPropertyName] && geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
            continue;
          }

          if(! values.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
            values.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
          }
        }

        return values;
      };

      this.setupDefaultBrewValues_wholeTimeseries = function(geoJSON, values, forceProvidedIndicator, indicator){
        var indicatorTimeSeriesDatesArray;
        if(forceProvidedIndicator) {
          indicatorTimeSeriesDatesArray = indicator.applicableDates;
        } else {
          indicatorTimeSeriesDatesArray = kommonitorDataExchangeService.selectedIndicator.applicableDates;
        }
        

          for (const date of indicatorTimeSeriesDatesArray) {
            var propertyName = __env.indicatorDatePrefix + date;
            values = this.setupDefaultBrewValues_singleTimestamp(geoJSON, propertyName, values);
          }          

        return values;
      };

      this.setupManualBrew = function (numClasses, colorCode, breaks) {
        this.resetFeaturesPerColorObjects();

        var colorBrewerInstance = new classyBrew();
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
      };

      /**
       * Returns and array of color brewer instances for greater and lesser than measure of value colors
       *
       * [gtMeasureOfValueBrew, ltMeasureOfValueBrew]
       */
      this.setupMeasureOfValueBrew = function (geoJSON, propertyName, colorCodeForGreaterThanValues, colorCodeForLesserThanValues, classifyMethod, measureOfValue, breaks, numClasses) {

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

        if(kommonitorDataExchangeService.classifyUsingWholeTimeseries){
          this.setupMovBrewValues_wholeTimeseries(geoJSON, measureOfValue);
        }
        else{
          this.setupMovBrewValues_singleTimestamp(geoJSON, propertyName, measureOfValue);
        }        

        var gtMeasureOfValueBrew = this.setupGtMeasureOfValueBrew(this.greaterThanValues, colorCodeForGreaterThanValues, classifyMethod, Math.ceil(numClasses / 2));
        var ltMeasureOfValueBrew = this.setupLtMeasureOfValueBrew(this.lesserThanValues, colorCodeForLesserThanValues, classifyMethod, Math.floor(numClasses / 2));

        if(classifyMethod == "manual") {
          if (!breaks || breaks.length == 0) {
            breaks = [];
            breaks[0] = gtMeasureOfValueBrew ? gtMeasureOfValueBrew.breaks : [];
            breaks[1] = ltMeasureOfValueBrew ? ltMeasureOfValueBrew.breaks : [];
          }
  
          var manualBreaksMatchMeasureOfValue = 
            (breaks[1][breaks[1].length-1] <= measureOfValue) &&
            (measureOfValue <= breaks[0][0]);

          if (manualBreaksMatchMeasureOfValue) {
            gtMeasureOfValueBrew = this.setupManualBrew(breaks[0].length -1, colorCodeForGreaterThanValues, breaks[0]);
            ltMeasureOfValueBrew = this.setupManualBrew(breaks[1].length -1, colorCodeForLesserThanValues, breaks[1]);
            ltMeasureOfValueBrew.colors = ltMeasureOfValueBrew.colors.reverse();
          }
        }
        
        this.measureOfValueBrew = [gtMeasureOfValueBrew, ltMeasureOfValueBrew];
        return this.measureOfValueBrew;
      };

      this.setupMovBrewValues_singleTimestamp = function(geoJSON, propertyName, measureOfValue){
        for (var i = 0; i < geoJSON.features.length; i++) {

          if (kommonitorDataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]))
            continue;

          if(kommonitorDataExchangeService.classifyZeroSeparately && (geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")){
            continue;
          }

          // check if is outlier, then do not use within classification, as it will be marked on map with special color
          if (geoJSON.features[i].properties[outlierPropertyName] && geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
            continue;
          }

          else if (kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) >= kommonitorDataExchangeService.getIndicatorValue_asNumber(measureOfValue)){
            if(! this.greaterThanValues.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
              this.greaterThanValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
            }
          }
          else{
            if(! this.lesserThanValues.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
              this.lesserThanValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
            }
          }
        }
      };

      this.setupMovBrewValues_wholeTimeseries = function(geoJSON, measureOfValue){
        var indicatorTimeSeriesDatesArray = kommonitorDataExchangeService.selectedIndicator.applicableDates;

          for (const date of indicatorTimeSeriesDatesArray) {
            var propertyName = __env.indicatorDatePrefix + date;
            this.setupMovBrewValues_singleTimestamp(geoJSON, propertyName, measureOfValue);
          }    
      };

      function setupClassyBrew_usingFeatureCount(valuesArray, colorCode, classifyMethod, maxNumberOfClasses){

        var tempBrew = new classyBrew();
        var colorBrewerInstance = new classyBrew();

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
            colorBrewerInstance.breaks[index] = kommonitorDataExchangeService.getIndicatorValue_asNumber(colorBrewerInstance.breaks[index]);            
          }
        }

        return colorBrewerInstance;
      }

      this.setupGtMeasureOfValueBrew = function (greaterThanValues, colorCodeForGreaterThanValues, classifyMethod, numClasses) {        

        return setupClassyBrew_usingFeatureCount(greaterThanValues, colorCodeForGreaterThanValues, classifyMethod, numClasses);

      };

      this.setupLtMeasureOfValueBrew = function (lesserThanValues, colorCodeForLesserThanValues, classifyMethod, numClasses) {

        var brew = setupClassyBrew_usingFeatureCount(lesserThanValues, colorCodeForLesserThanValues, classifyMethod, numClasses);
        if(brew && brew.colors && brew.colors.length > 1){        
          brew.colors = brew.colors.reverse();
        }
        return brew;
      };

      /**
       * Returns and array of color brewer instances for dynamic increase and decrease colors
       *
       * [dynamicIncreaseBrew, dynamicDecreaseBrew]
       */
      this.setupDynamicIndicatorBrew = function (geoJSON, propertyName, colorCodeForPositiveValues, colorCodeForNegativeValues, classifyMethod, numClasses, breaks) {

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
        
        if(kommonitorDataExchangeService.classifyUsingWholeTimeseries){
          this.setupDynamicBrewValues_wholeTimeseries(geoJSON);
        }
        else{
          this.setupDynamicBrewValues_singleTimestamp(geoJSON, propertyName);
        }

        var dynamicIncreaseBrew = setupDynamicIncreaseBrew(this.positiveValues, colorCodeForPositiveValues, classifyMethod, Math.ceil(numClasses / 2));
        var dynamicDecreaseBrew = setupDynamicDecreaseBrew(this.negativeValues, colorCodeForNegativeValues, classifyMethod, Math.floor(numClasses / 2));

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
      };

      this.setupDynamicBrewValues_wholeTimeseries = function(geoJSON){
        var indicatorTimeSeriesDatesArray = kommonitorDataExchangeService.selectedIndicator.applicableDates;

          for (const date of indicatorTimeSeriesDatesArray) {
            var propertyName = __env.indicatorDatePrefix + date;
            this.setupDynamicBrewValues_singleTimestamp(geoJSON, propertyName);
          }    
      };

      this.setupDynamicBrewValues_singleTimestamp = function(geoJSON, propertyName){
        for (var i = 0; i < geoJSON.features.length; i++) {
          if (kommonitorDataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]))
            continue;

          if(kommonitorDataExchangeService.classifyZeroSeparately && (geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")){
            continue;
          }

          // check if is outlier, then do not use within classification, as it will be marked on map with special color
          if (geoJSON.features[i].properties[outlierPropertyName] && geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
            continue;
          }

          else if (kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) >= 0){
            if(! this.positiveValues.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
              this.positiveValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
            }
          }
          else if (kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) < 0){
            if(! this.negativeValues.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
              this.negativeValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
            }
          }
        }
      };

      function setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod, numClasses) {
        return setupClassyBrew_usingFeatureCount(positiveValues, colorCodeForPositiveValues, classifyMethod, numClasses);
      }

      function setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod, numClasses) {
        var brew = setupClassyBrew_usingFeatureCount(negativeValues, colorCodeForNegativeValues, classifyMethod, numClasses);
        if(brew && brew.colors && brew.colors.length > 1){        
          brew.colors = brew.colors.reverse();
        }
        return brew;
      }

      this.styleNoData = function(feature, incrementFeatures) {
        if (incrementFeatures) {
          this.featuresPerNoData ++;
        }
        return this.noDataStyle;
      };

      this.styleOutlier = function(feature, incrementFeatures) {
        if ((feature.properties[outlierPropertyName] === outlierPropertyValue_low_soft) || (feature.properties[outlierPropertyName] === outlierPropertyValue_low_extreme)) {

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
      };

      this.getOpacity = function(opacity){

        return defaultFillOpacity;
      };

      this.setOpacity = function(opacity){

        opacity = Number(opacity);
        this.indicatorTransparency = Number((1 - opacity).toFixed(numberOfDecimals));
        this.currentIndicatorOpacity = opacity;

        defaultFillOpacity = opacity;
        defaultFillOpacityForOutliers_low = opacity;
        defaultFillOpacityForOutliers_high = opacity;
        defaultFillOpacityForZeroFeatures = opacity;
        defaultFillOpacityForNoDataValues = opacity;
        defaultFillOpacityForFilteredFeatures = opacity;

        $timeout(function(){
          $rootScope.$apply();
        });
      };

      // style function to return
      this.styleDefault = function(feature, defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, datasetContainsNegativeValues, incrementFeatures) {

        // check if feature is NoData
        if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
          return this.styleNoData(feature, incrementFeatures);
        }

        // check if feature is outlier
        if ((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
          return this.styleOutlier(feature, incrementFeatures);
        }

        var fillOpacity = 1;
        if (useTransparencyOnIndicator) {
          fillOpacity = defaultFillOpacity;
        }

        var fillColor;
        if (kommonitorDataExchangeService.classifyZeroSeparately && (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0")) {
          fillColor = this.getFillColorForZero(incrementFeatures);
          if (useTransparencyOnIndicator) {
            fillOpacity = defaultFillOpacityForZeroFeatures;
          }

        }
        else {
          if (datasetContainsNegativeValues) {
            if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= 0) {
              if (kommonitorDataExchangeService.classifyZeroSeparately && (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0")) {
                fillColor = this.getFillColorForZero(incrementFeatures);
                if (useTransparencyOnIndicator) {
                  fillOpacity = defaultFillOpacityForZeroFeatures;
                }
              }
              else {
                fillColor = this.findColorInRange(feature, propertyName, dynamicIncreaseBrew, incrementFeatures);
              }

              return {
                weight: 1,
                opacity: fillOpacity,
                color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColor,
                dashArray: '',
                fillOpacity: fillOpacity,
                fillColor: fillColor,
                fillPattern: undefined
              };
            }
            else {

              if (kommonitorDataExchangeService.classifyZeroSeparately && (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0")) {
                fillColor = this.getFillColorForZero(incrementFeatures);
                if (useTransparencyOnIndicator) {
                  fillOpacity = defaultFillOpacityForZeroFeatures;
                }
              }
              else {
                // invert colors, so that lowest values will become strong colored!
                fillColor = this.findColorInRange(feature, propertyName, dynamicDecreaseBrew, incrementFeatures);
              }

              return {
                weight: 1,
                opacity: fillOpacity,
                color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColor,
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
          color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColor,
          dashArray: '',
          fillOpacity: fillOpacity,
          fillColor: fillColor,
          fillPattern: undefined
        };
      };

      this.findColorInRange = function(feature, propertyName, colorBrewInstance, incrementFeatures){
        var color;

        for (var index = 0; index < colorBrewInstance.breaks.length; index++) {
          if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == kommonitorDataExchangeService.getIndicatorValue_asNumber(colorBrewInstance.breaks[index])) {
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
            if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < kommonitorDataExchangeService.getIndicatorValue_asNumber(colorBrewInstance.breaks[index + 1])) {
              color = colorBrewInstance.colors[index];
              break;
            }
          }
        }

        if(incrementFeatures) {
          this.incrementFeaturesPerColor(color);
        }
        
        return color;
      };

      // this.findColorInRange_invertedColorGradient = function (feature, propertyName, colorBrewInstance){
      //   var color;

      //   for (var k = 0; k < colorBrewInstance.breaks.length; k++) {
      //     if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == kommonitorDataExchangeService.getIndicatorValue_asNumber(colorBrewInstance.breaks[k])) {
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
      //       if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < kommonitorDataExchangeService.getIndicatorValue_asNumber(colorBrewInstance.breaks[k + 1])) {
      //         color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
      //         break;
      //       }
      //     }
      //   }

      //   this.incrementFeaturesPerColor(color);

      //   return color;
      // };

      this.styleMeasureOfValue = function(feature, gtMeasureOfValueBrew, ltMeasureOfValueBrew, propertyName, useTransparencyOnIndicator, incrementFeatures) {


        // check if feature is NoData
        if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
          return this.styleNoData(feature, incrementFeatures);
        }

        // check if feature is outlier
        if ((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
          return this.styleOutlier(feature, incrementFeatures);
        }

        var fillOpacity = 1;
        if (useTransparencyOnIndicator) {
          fillOpacity = defaultFillOpacity;
        }

        var fillColor;
        if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= kommonitorDataExchangeService.measureOfValue) {

          if (kommonitorDataExchangeService.classifyZeroSeparately && (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0")) {
            fillColor = this.getFillColorForZero(incrementFeatures);
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {

            fillColor = this.findColorInRange(feature, propertyName, gtMeasureOfValueBrew, incrementFeatures);
          }

          return {
            weight: 1,
            opacity: 1,
            color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }
        else {
          if (kommonitorDataExchangeService.classifyZeroSeparately && (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0")) {
            fillColor = this.getFillColorForZero(incrementFeatures);
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            // invert colors, so that lowest values will become strong colored!
            fillColor = this.findColorInRange(feature, propertyName, ltMeasureOfValueBrew, incrementFeatures);
          }

          return {
            weight: 1,
            opacity: 1,
            color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }

      };

      this.styleDynamicIndicator = function(feature, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, incrementFeatures) {



        // check if feature is NoData
        if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
          return this.styleNoData(feature, incrementFeatures);
        }

        // check if feature is outlier
        if ((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
          return this.styleOutlier(feature, incrementFeatures);
        }

        var fillOpacity = 1;
        if (useTransparencyOnIndicator) {
          fillOpacity = defaultFillOpacity;
        }

        var fillColor;
        if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= 0) {

          if (kommonitorDataExchangeService.classifyZeroSeparately && (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0")) {
            fillColor = this.getFillColorForZero(incrementFeatures);
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            fillColor = this.findColorInRange(feature, propertyName, dynamicIncreaseBrew, incrementFeatures);
          }

          return {
            weight: 1,
            opacity: 1,
            color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }
        else {
          if (kommonitorDataExchangeService.classifyZeroSeparately && (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0")) {
            fillColor = this.getFillColorForZero(incrementFeatures);
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            // invert colors, so that lowest values will become strong colored!
            fillColor = this.findColorInRange(feature, propertyName, dynamicDecreaseBrew, incrementFeatures);
          }

          return {
            weight: 1,
            opacity: 1,
            color: kommonitorDataExchangeService.selectedSpatialUnitIsRaster() ? undefined : defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }

      };

    }]);
