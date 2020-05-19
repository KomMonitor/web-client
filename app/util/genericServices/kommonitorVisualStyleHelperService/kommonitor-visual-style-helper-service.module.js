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
        color: defaultColorForNoDataValues
      });
      this.noDataFillPattern = new L.Pattern({ width: 8, height: 8 });
      this.noDataFillPattern.addShape(shape);

      var outliers_high = undefined;
      var outliers_low = undefined;

      this.outlierStyle_high = {
        weight: 1,
        opacity: 1,
        color: defaultBorderColorForOutliers_high,
        dashArray: '',
        fillOpacity: defaultFillOpacityForOutliers_high,
        fillColor: defaultColorForOutliers_high,
        fillPattern: this.outlierFillPattern_high
      };

      this.outlierStyle_low = {
        weight: 1,
        opacity: 1,
        color: defaultBorderColorForOutliers_low,
        dashArray: '',
        fillOpacity: defaultFillOpacityForOutliers_low,
        fillColor: defaultColorForOutliers_low,
        fillPattern: this.outlierFillPattern_low
      };

      this.noDataStyle = {
        weight: 1,
        opacity: 1,
        color: defaultBorderColorForNoDataValues,
        dashArray: '',
        fillOpacity: defaultFillOpacityForNoDataValues,
        fillColor: defaultColorForNoDataValues,
        fillPattern: this.noDataFillPattern
      };

      this.filteredStyle = {
        weight: 1,
        opacity: 1,
        color: defaultBorderColorForFilteredValues,
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

      this.getFillColorForZero = function(){
        this.featuresPerZero ++;
        return defaultColorForZeroValues;
      };

      this.setupDefaultBrew = function (geoJSON, propertyName, numClasses, colorCode, classifyMethod) {
        this.resetFeaturesPerColorObjects();

        var values = [];
        for (var i = 0; i < geoJSON.features.length; i++) {
          if (kommonitorDataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]) || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
            continue;

          // check if is outlier, then do not use within classification, as it will be marked on map with special color
          if (geoJSON.features[i].properties[outlierPropertyName] && geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
            continue;
          }

          if(! values.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
            values.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
          }
        }

        return setupClassyBrew_usingFeatureCount(values, colorCode, classifyMethod, numClasses);
      };

      /**
       * Returns and array of color brewer instances for greater and lesser than measure of value colors
       *
       * [gtMeasureOfValueBrew, ltMeasureOfValueBrew]
       */
      this.setupMeasureOfValueBrew = function (geoJSON, propertyName, colorCodeForGreaterThanValues, colorCodeForLesserThanValues, classifyMethod, measureOfValue) {

        /*
        * Idea: Analyse the complete geoJSON property array for each feature and make conclusion about how to build the legend

        e.g. if there are only positive values then display only positive values within 5 categories - same for only negative values

        e.g. if there are equally many positive as negative values then display both using 3 categories each

        e.g. if there are way more positive than negative values, then display both with 2 (negative) and 4 (positive) classes

        --> implement special cases (0, 1 or 2 negative/positive values --> apply colors manually)
        --> treat all other cases equally to measureOfValue
        */

       this.resetFeaturesPerColorObjects();

        var greaterThanValues = [];
        var lesserThanValues = [];

        for (var i = 0; i < geoJSON.features.length; i++) {

          if (kommonitorDataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]) || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
            continue;

          // check if is outlier, then do not use within classification, as it will be marked on map with special color
          if (geoJSON.features[i].properties[outlierPropertyName] && geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
            continue;
          }

          else if (kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) >= kommonitorDataExchangeService.getIndicatorValue_asNumber(measureOfValue)){
            if(! greaterThanValues.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
              greaterThanValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
            }
          }
          else{
            if(! lesserThanValues.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
              lesserThanValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
            }
          }
        }

        var gtMeasureOfValueBrew = this.setupGtMeasureOfValueBrew(greaterThanValues, colorCodeForGreaterThanValues, classifyMethod);
        var ltMeasureOfValueBrew = this.setupLtMeasureOfValueBrew(lesserThanValues, colorCodeForLesserThanValues, classifyMethod);

        return [gtMeasureOfValueBrew, ltMeasureOfValueBrew];
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

        return colorBrewerInstance;
      }

      this.setupGtMeasureOfValueBrew = function (greaterThanValues, colorCodeForGreaterThanValues, classifyMethod) {        

        return setupClassyBrew_usingFeatureCount(greaterThanValues, colorCodeForGreaterThanValues, classifyMethod, 3);

      };

      this.setupLtMeasureOfValueBrew = function (lesserThanValues, colorCodeForLesserThanValues, classifyMethod) {
        return setupClassyBrew_usingFeatureCount(lesserThanValues, colorCodeForLesserThanValues, classifyMethod, 3);
      };

      /**
       * Returns and array of color brewer instances for dynamic increase and decrease colors
       *
       * [dynamicIncreaseBrew, dynamicDecreaseBrew]
       */
      this.setupDynamicIndicatorBrew = function (geoJSON, propertyName, colorCodeForPositiveValues, colorCodeForNegativeValues, classifyMethod) {

        /*
        * Idea: Analyse the complete geoJSON property array for each feature and make conclusion about how to build the legend

        e.g. if there are only positive values then display only positive values within 5 categories - same for only negative values

        e.g. if there are equally many positive as negative values then display both using 3 categories each

        e.g. if there are way more positive than negative values, then display both with 2 (negative) and 4 (positive) classes

        --> implement special cases (0, 1 or 2 negative/positive values --> apply colors manually)
        --> treat all other cases equally to measureOfValue
        */

       this.resetFeaturesPerColorObjects();

        var positiveValues = [];
        var negativeValues = [];

        for (var i = 0; i < geoJSON.features.length; i++) {
          if (kommonitorDataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]) || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
            continue;

          // check if is outlier, then do not use within classification, as it will be marked on map with special color
          if (geoJSON.features[i].properties[outlierPropertyName] && geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
            continue;
          }

          else if (kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) > 0){
            if(! positiveValues.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
              positiveValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
            }
          }
          else if (kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) < 0){
            if(! negativeValues.includes(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]))){            
              negativeValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
            }
          }
        }

        var dynamicIncreaseBrew = setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod);
        var dynamicDecreaseBrew = setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod);

        return [dynamicIncreaseBrew, dynamicDecreaseBrew];
      };

      function setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod) {
        return setupClassyBrew_usingFeatureCount(positiveValues, colorCodeForPositiveValues, classifyMethod, 3);
      }

      function setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod) {
        return setupClassyBrew_usingFeatureCount(negativeValues, colorCodeForNegativeValues, classifyMethod, 3);
      }

      this.styleNoData = function(feature) {
        this.featuresPerNoData ++;
        return this.noDataStyle;
      };

      this.styleOutlier = function(feature) {
        if ((feature.properties[outlierPropertyName] === outlierPropertyValue_low_soft) || (feature.properties[outlierPropertyName] === outlierPropertyValue_low_extreme)) {

          this.featuresPerOutlierLow ++;
          return this.outlierStyle_low;
        }
        else {

          this.featuresPerOutlierHigh ++;
          return this.outlierStyle_high;
        }
      };

      this.getOpacity = function(opacity){

        return defaultFillOpacity;
      };

      this.setOpacity = function(opacity){

        opacity = Number(opacity);

        defaultFillOpacity = opacity;
        defaultFillOpacityForOutliers_low = opacity;
        defaultFillOpacityForOutliers_high = opacity;
        defaultFillOpacityForZeroFeatures = opacity;
        defaultFillOpacityForNoDataValues = opacity;
        defaultFillOpacityForFilteredFeatures = opacity;
      };

      // style function to return
      this.styleDefault = function(feature, defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, datasetContainsNegativeValues) {

        // check if feature is NoData
        if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
          return this.styleNoData(feature);
        }

        // check if feature is outlier
        if ((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
          return this.styleOutlier(feature);
        }

        var fillOpacity = 1;
        if (useTransparencyOnIndicator) {
          fillOpacity = defaultFillOpacity;
        }

        var fillColor;
        if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
          fillColor = this.getFillColorForZero();
          if (useTransparencyOnIndicator) {
            fillOpacity = defaultFillOpacityForZeroFeatures;
          }

        }
        else {
          if (datasetContainsNegativeValues) {
            if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= 0) {
              if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
                fillColor = this.getFillColorForZero();
                if (useTransparencyOnIndicator) {
                  fillOpacity = defaultFillOpacityForZeroFeatures;
                }
              }
              else {
                fillColor = this.findColorInRange(feature, propertyName, dynamicIncreaseBrew);
              }

              return {
                weight: 1,
                opacity: 1,
                color: defaultBorderColor,
                dashArray: '',
                fillOpacity: fillOpacity,
                fillColor: fillColor,
                fillPattern: undefined
              };
            }
            else {

              if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
                fillColor = this.getFillColorForZero();
                if (useTransparencyOnIndicator) {
                  fillOpacity = defaultFillOpacityForZeroFeatures;
                }
              }
              else {
                // invert colors, so that lowest values will become strong colored!
                fillColor = this.findColorInRange_invertedColorGradient(feature, propertyName, dynamicDecreaseBrew);
              }

              return {
                weight: 1,
                opacity: 1,
                color: defaultBorderColor,
                dashArray: '',
                fillOpacity: fillOpacity,
                fillColor: fillColor,
                fillPattern: undefined
              };
            }
          }
          else {
            fillColor = this.findColorInRange(feature, propertyName, defaultBrew);            
          }
        }

        return {
          weight: 1,
          opacity: 1,
          color: defaultBorderColor,
          dashArray: '',
          fillOpacity: fillOpacity,
          fillColor: fillColor,
          fillPattern: undefined
        };
      };

      this.findColorInRange = function(feature, propertyName, colorBrewInstance){
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

        this.incrementFeaturesPerColor(color);

        return color;
      };

      this.findColorInRange_invertedColorGradient = function (feature, propertyName, colorBrewInstance){
        var color;

        for (var k = 0; k < colorBrewInstance.breaks.length; k++) {
          if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == kommonitorDataExchangeService.getIndicatorValue_asNumber(colorBrewInstance.breaks[k])) {
            if (k < colorBrewInstance.breaks.length - 1) {
              // min value
              color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
              break;
            }
            else {
              //max value
              if (colorBrewInstance.colors[colorBrewInstance.colors.length - k]) {
                color = colorBrewInstance.colors[colorBrewInstance.colors.length - k];
              }
              else {
                color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
              }
              break;
            }
          }
          else {
            if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < kommonitorDataExchangeService.getIndicatorValue_asNumber(colorBrewInstance.breaks[k + 1])) {
              color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
              break;
            }
          }
        }

        this.incrementFeaturesPerColor(color);

        return color;
      };

      this.styleMeasureOfValue = function(feature, gtMeasureOfValueBrew, ltMeasureOfValueBrew, propertyName, useTransparencyOnIndicator) {


        // check if feature is NoData
        if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
          return this.styleNoData(feature);
        }

        // check if feature is outlier
        if ((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
          return this.styleOutlier(feature);
        }

        var fillOpacity = 1;
        if (useTransparencyOnIndicator) {
          fillOpacity = defaultFillOpacity;
        }

        var fillColor;
        if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= kommonitorDataExchangeService.measureOfValue) {

          if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
            fillColor = this.getFillColorForZero();
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {

            fillColor = this.findColorInRange(feature, propertyName, gtMeasureOfValueBrew);
          }

          return {
            weight: 1,
            opacity: 1,
            color: defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }
        else {
          if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
            fillColor = this.getFillColorForZero();
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            // invert colors, so that lowest values will become strong colored!
            fillColor = this.findColorInRange_invertedColorGradient(feature, propertyName, ltMeasureOfValueBrew);
          }

          return {
            weight: 1,
            opacity: 1,
            color: defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }

      };

      this.styleDynamicIndicator = function(feature, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator) {



        // check if feature is NoData
        if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
          return this.styleNoData(feature);
        }

        // check if feature is outlier
        if ((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
          return this.styleOutlier(feature);
        }

        var fillOpacity = 1;
        if (useTransparencyOnIndicator) {
          fillOpacity = defaultFillOpacity;
        }

        var fillColor;
        if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= 0) {

          if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
            fillColor = this.getFillColorForZero();
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            fillColor = this.findColorInRange(feature, propertyName, dynamicIncreaseBrew);
          }

          return {
            weight: 1,
            opacity: 1,
            color: defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }
        else {
          if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
            fillColor = this.getFillColorForZero();
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            // invert colors, so that lowest values will become strong colored!
            fillColor = this.findColorInRange_invertedColorGradient(feature, propertyName, dynamicDecreaseBrew);
          }

          return {
            weight: 1,
            opacity: 1,
            color: defaultBorderColor,
            dashArray: '',
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            fillPattern: undefined
          };
        }

      };

    }]);
