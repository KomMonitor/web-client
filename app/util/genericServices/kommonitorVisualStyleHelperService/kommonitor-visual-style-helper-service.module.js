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

      this.setupDefaultBrew = function (geoJSON, propertyName, numClasses, colorCode, classifyMethod) {
        var values = [];
        for (var i = 0; i < geoJSON.features.length; i++) {
          if (kommonitorDataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]) || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
            continue;

          // check if is outlier, then do not use within classification, as it will be marked on map with special color
          if (geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
            continue;
          }

          values.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
        }

        var colorBrewer = new classyBrew();

        // pass array to our classyBrew series
        colorBrewer.setSeries(values);

        // define number of classes
        colorBrewer.setNumClasses(numClasses);

        // set color ramp code
        colorBrewer.setColorCode(colorCode);

        // classify by passing in statistical method
        // i.e. equal_interval, jenks, quantile
        colorBrewer.classify(classifyMethod);

        return colorBrewer;
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

        var greaterThanValues = [];
        var lesserThanValues = [];

        for (var i = 0; i < geoJSON.features.length; i++) {

          if (kommonitorDataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]) || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
            continue;

          // check if is outlier, then do not use within classification, as it will be marked on map with special color
          if (geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
            continue;
          }

          else if (kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) >= kommonitorDataExchangeService.getIndicatorValue_asNumber(measureOfValue))
            greaterThanValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
          else
            lesserThanValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
        }

        var gtMeasureOfValueBrew = this.setupGtMeasureOfValueBrew(greaterThanValues, colorCodeForGreaterThanValues, classifyMethod);
        var ltMeasureOfValueBrew = this.setupLtMeasureOfValueBrew(lesserThanValues, colorCodeForLesserThanValues, classifyMethod);

        return [gtMeasureOfValueBrew, ltMeasureOfValueBrew];
      };

      this.setupGtMeasureOfValueBrew = function (greaterThanValues, colorCodeForGreaterThanValues, classifyMethod) {
        var tempBrew = new classyBrew();
        var gtMeasureOfValueBrew = new classyBrew();

        if (greaterThanValues.length === 4 || greaterThanValues.length >= 5) {
          // pass array to our classyBrew series
          tempBrew.setSeries(greaterThanValues);
          // define number of classes
          tempBrew.setNumClasses(3);
          // set color ramp code
          tempBrew.setColorCode(colorCodeForGreaterThanValues);
          // classify by passing in statistical method
          // i.e. equal_interval, jenks, quantile
          tempBrew.classify(classifyMethod);

          gtMeasureOfValueBrew.colors = tempBrew.getColors();
          gtMeasureOfValueBrew.breaks = tempBrew.getBreaks();
        }

        else if (greaterThanValues.length === 3) {
          greaterThanValues.sort((a, b) => a - b);

          gtMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForGreaterThanValues]['3'];
          gtMeasureOfValueBrew.breaks = greaterThanValues;
        }
        else if (greaterThanValues.length === 2) {
          greaterThanValues.sort((a, b) => a - b);

          gtMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForGreaterThanValues]['3'];
          gtMeasureOfValueBrew.breaks = greaterThanValues;

          gtMeasureOfValueBrew.colors.shift(); // remove first element of array
        }
        else if (greaterThanValues.length === 1) {
          greaterThanValues.sort((a, b) => a - b);

          gtMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForGreaterThanValues]['3'];
          gtMeasureOfValueBrew.breaks = greaterThanValues;

          gtMeasureOfValueBrew.colors.shift(); // remove first element of array
          gtMeasureOfValueBrew.colors.shift(); // remove first element of array
        }
        else {
          // no positive values
          gtMeasureOfValueBrew = undefined;
        }

        return gtMeasureOfValueBrew;
      };

      this.setupLtMeasureOfValueBrew = function (lesserThanValues, colorCodeForLesserThanValues, classifyMethod) {
        var tempBrew = new classyBrew();
        var ltMeasureOfValueBrew = new classyBrew();
        // if(lesserThanValues.length > 5){
        //   // pass array to our classyBrew series
        //   tempBrew.setSeries(lesserThanValues);
        //   // define number of classes
        //   tempBrew.setNumClasses(5);
        //   // set color ramp code
        //   tempBrew.setColorCode(colorCodeForLesserThanValues);
        //   // classify by passing in statistical method
        //   // i.e. equal_interval, jenks, quantile
        //   tempBrew.classify(classifyMethod);
        //
        //   ltMeasureOfValueBrew.colors = tempBrew.getColors();
        //   ltMeasureOfValueBrew.breaks = tempBrew.getBreaks();
        // }
        // else if(lesserThanValues.length === 4 || lesserThanValues.length === 5){
        //   // pass array to our classyBrew series
        //   tempBrew.setSeries(lesserThanValues);
        //   // define number of classes
        //   tempBrew.setNumClasses(3);
        //   // set color ramp code
        //   tempBrew.setColorCode(colorCodeForLesserThanValues);
        //   // classify by passing in statistical method
        //   // i.e. equal_interval, jenks, quantile
        //   tempBrew.classify(classifyMethod);
        //
        //   ltMeasureOfValueBrew.colors = tempBrew.getColors();
        //   ltMeasureOfValueBrew.breaks = tempBrew.getBreaks();
        // }
        if (lesserThanValues.length === 4 || lesserThanValues.length >= 5) {
          // pass array to our classyBrew series
          tempBrew.setSeries(lesserThanValues);
          // define number of classes
          tempBrew.setNumClasses(3);
          // set color ramp code
          tempBrew.setColorCode(colorCodeForLesserThanValues);
          // classify by passing in statistical method
          // i.e. equal_interval, jenks, quantile
          tempBrew.classify(classifyMethod);

          ltMeasureOfValueBrew.colors = tempBrew.getColors();
          ltMeasureOfValueBrew.breaks = tempBrew.getBreaks();
        }
        else if (lesserThanValues.length === 3) {
          lesserThanValues.sort((a, b) => a - b);

          ltMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForLesserThanValues]['3'];
          ltMeasureOfValueBrew.breaks = lesserThanValues;
        }
        else if (lesserThanValues.length === 2) {
          lesserThanValues.sort((a, b) => a - b);

          ltMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForLesserThanValues]['3'];
          ltMeasureOfValueBrew.breaks = lesserThanValues;

          ltMeasureOfValueBrew.colors.shift(); // remove first element of array
        }
        else if (lesserThanValues.length === 1) {
          lesserThanValues.sort((a, b) => a - b);

          ltMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForLesserThanValues]['3'];
          ltMeasureOfValueBrew.breaks = lesserThanValues;

          ltMeasureOfValueBrew.colors.shift(); // remove first element of array
          ltMeasureOfValueBrew.colors.shift(); // remove first element of array
        }
        else {
          // no positive values
          ltMeasureOfValueBrew = undefined;
        }

        return ltMeasureOfValueBrew;
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

        var positiveValues = [];
        var negativeValues = [];

        for (var i = 0; i < geoJSON.features.length; i++) {
          if (kommonitorDataExchangeService.indicatorValueIsNoData(geoJSON.features[i].properties[propertyName]) || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
            continue;

          // check if is outlier, then do not use within classification, as it will be marked on map with special color
          if (geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
            continue;
          }

          else if (kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) > 0)
            positiveValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
          else if (kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]) < 0)
            negativeValues.push(kommonitorDataExchangeService.getIndicatorValue_asNumber(geoJSON.features[i].properties[propertyName]));
        }

        var dynamicIncreaseBrew = setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod);
        var dynamicDecreaseBrew = setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod);
        
        return [dynamicIncreaseBrew, dynamicDecreaseBrew];
      };

      function setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod) {
        // analyse length of value arrays

        var tempBrew = new classyBrew();
        var dynamicIncreaseBrew = new classyBrew();
        // if(positiveValues.length > 5){
        //   // pass array to our classyBrew series
        //   tempBrew.setSeries(positiveValues);
        //   // define number of classes
        //   tempBrew.setNumClasses(5);
        //   // set color ramp code
        //   tempBrew.setColorCode(colorCodeForPositiveValues);
        //   // classify by passing in statistical method
        //   // i.e. equal_interval, jenks, quantile
        //   tempBrew.classify(classifyMethod);
        //
        //   dynamicIncreaseBrew.colors = tempBrew.getColors();
        //   dynamicIncreaseBrew.breaks = tempBrew.getBreaks();
        // }
        // else if(positiveValues.length === 4 || positiveValues.length === 5){
        //   // pass array to our classyBrew series
        //   tempBrew.setSeries(positiveValues);
        //   // define number of classes
        //   tempBrew.setNumClasses(3);
        //   // set color ramp code
        //   tempBrew.setColorCode(colorCodeForPositiveValues);
        //   // classify by passing in statistical method
        //   // i.e. equal_interval, jenks, quantile
        //   tempBrew.classify(classifyMethod);
        //
        //   dynamicIncreaseBrew.colors = tempBrew.getColors();
        //   dynamicIncreaseBrew.breaks = tempBrew.getBreaks();
        // }
        if (positiveValues.length === 4 || positiveValues.length >= 5) {
          // pass array to our classyBrew series
          tempBrew.setSeries(positiveValues);
          // define number of classes
          tempBrew.setNumClasses(3);
          // set color ramp code
          tempBrew.setColorCode(colorCodeForPositiveValues);
          // classify by passing in statistical method
          // i.e. equal_interval, jenks, quantile
          tempBrew.classify(classifyMethod);

          dynamicIncreaseBrew.colors = tempBrew.getColors();
          dynamicIncreaseBrew.breaks = tempBrew.getBreaks();
        }
        else if (positiveValues.length === 3) {
          positiveValues.sort((a, b) => a - b);

          dynamicIncreaseBrew.colors = tempBrew.colorSchemes[colorCodeForPositiveValues]['3'];
          dynamicIncreaseBrew.breaks = positiveValues;
        }
        else if (positiveValues.length === 2) {
          positiveValues.sort((a, b) => a - b);

          dynamicIncreaseBrew.colors = tempBrew.colorSchemes[colorCodeForPositiveValues]['3'];
          dynamicIncreaseBrew.breaks = positiveValues;

          dynamicIncreaseBrew.colors.shift(); // remove first element of array
        }
        else if (positiveValues.length === 1) {
          positiveValues.sort((a, b) => a - b);

          dynamicIncreaseBrew.colors = tempBrew.colorSchemes[colorCodeForPositiveValues]['3'];
          dynamicIncreaseBrew.breaks = positiveValues;

          dynamicIncreaseBrew.colors.shift(); // remove first element of array
          dynamicIncreaseBrew.colors.shift(); // remove first element of array
        }
        else {
          // no positive values
          dynamicIncreaseBrew = undefined;
        }

        return dynamicIncreaseBrew;
      }

      function setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod) {
        var tempBrew = new classyBrew();
        var dynamicDecreaseBrew = new classyBrew();
        // analyse length of value arrays
        // if(negativeValues.length > 5){
        //   // pass array to our classyBrew series
        //   tempBrew.setSeries(negativeValues);
        //   // define number of classes
        //   tempBrew.setNumClasses(5);
        //   // set color ramp code
        //   tempBrew.setColorCode(colorCodeForNegativeValues);
        //   // classify by passing in statistical method
        //   // i.e. equal_interval, jenks, quantile
        //   tempBrew.classify(classifyMethod);
        //
        //   dynamicDecreaseBrew.colors = tempBrew.getColors();
        //   dynamicDecreaseBrew.breaks = tempBrew.getBreaks();
        // }
        // else if(negativeValues.length === 4 || negativeValues.length === 5){
        //   // pass array to our classyBrew series
        //   tempBrew.setSeries(negativeValues);
        //   // define number of classes
        //   tempBrew.setNumClasses(3);
        //   // set color ramp code
        //   tempBrew.setColorCode(colorCodeForNegativeValues);
        //   // classify by passing in statistical method
        //   // i.e. equal_interval, jenks, quantile
        //   tempBrew.classify(classifyMethod);
        //
        //   dynamicDecreaseBrew.colors = tempBrew.getColors();
        //   dynamicDecreaseBrew.breaks = tempBrew.getBreaks();
        // }
        if (negativeValues.length === 4 || negativeValues.length >= 5) {
          // pass array to our classyBrew series
          tempBrew.setSeries(negativeValues);
          // define number of classes
          tempBrew.setNumClasses(3);
          // set color ramp code
          tempBrew.setColorCode(colorCodeForNegativeValues);
          // classify by passing in statistical method
          // i.e. equal_interval, jenks, quantile
          tempBrew.classify(classifyMethod);

          dynamicDecreaseBrew.colors = tempBrew.getColors();
          dynamicDecreaseBrew.breaks = tempBrew.getBreaks();
        }
        else if (negativeValues.length === 3) {

          negativeValues.sort((a, b) => a - b);

          dynamicDecreaseBrew.colors = tempBrew.colorSchemes[colorCodeForNegativeValues]['3'];
          dynamicDecreaseBrew.breaks = negativeValues;
        }
        else if (negativeValues.length === 2) {
          negativeValues.sort((a, b) => a - b);

          dynamicDecreaseBrew.colors = tempBrew.colorSchemes[colorCodeForNegativeValues]['3'];
          dynamicDecreaseBrew.breaks = negativeValues;

          dynamicDecreaseBrew.colors.shift(); // remove first element of array
        }
        else if (negativeValues.length === 1) {
          negativeValues.sort((a, b) => a - b);

          dynamicDecreaseBrew.colors = tempBrew.colorSchemes[colorCodeForNegativeValues]['3'];
          dynamicDecreaseBrew.breaks = negativeValues;

          dynamicDecreaseBrew.colors.shift(); // remove first element of array
          dynamicDecreaseBrew.colors.shift(); // remove first element of array
        }
        else {
          // no negative values
          dynamicDecreaseBrew = undefined;
        }

        return dynamicDecreaseBrew;
      }

      function styleNoData(feature) {
        return this.noDataStyle;
      }

      function styleOutlier(feature) {
        if ((feature.properties[outlierPropertyName] === outlierPropertyValue_low_soft) || (feature.properties[outlierPropertyName] === outlierPropertyValue_low_extreme)) {
          
          return this.outlierStyle_low;
        }
        else {
          
          return this.outlierStyle_high;
        }
      }

      // style function to return
      // fill color based on defaultBrew.getColorInRange() method
      this.styleDefault = function(feature, defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, propertyName, useTransparencyOnIndicator, datasetContainsNegativeValues) {
        // check if feature is NoData
        if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[propertyName])) {
          return this.styleNoData(feature);
        }

        // check if feature is outlier
        if ((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator) {
          return styleOutlier(feature);
        }

        var fillOpacity = 1;
        if (useTransparencyOnIndicator) {
          fillOpacity = defaultFillOpacity;
        }

        var fillColor;
        if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
          fillColor = defaultColorForZeroValues;
          if (useTransparencyOnIndicator) {
            fillOpacity = defaultFillOpacityForZeroFeatures;
          }

        }
        else {
          if (datasetContainsNegativeValues) {
            if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) >= 0) {
              if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
                fillColor = defaultColorForZeroValues;
                if (useTransparencyOnIndicator) {
                  fillOpacity = defaultFillOpacityForZeroFeatures;
                }
              }
              else {
                for (var index = 0; index < dynamicIncreaseBrew.breaks.length; index++) {
                  if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == kommonitorDataExchangeService.getIndicatorValue_asNumber(dynamicIncreaseBrew.breaks[index])) {
                    if (index < dynamicIncreaseBrew.breaks.length - 1) {
                      // min value
                      fillColor = dynamicIncreaseBrew.colors[index];
                      break;
                    }
                    else {
                      //max value
                      if (dynamicIncreaseBrew.colors[index]) {
                        fillColor = dynamicIncreaseBrew.colors[index];
                      }
                      else {
                        fillColor = dynamicIncreaseBrew.colors[index - 1];
                      }
                      break;
                    }
                  }
                  else {
                    if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < kommonitorDataExchangeService.getIndicatorValue_asNumber(dynamicIncreaseBrew.breaks[index + 1])) {
                      fillColor = dynamicIncreaseBrew.colors[index];
                      break;
                    }
                  }
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
            }
            else {

              if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
                fillColor = defaultColorForZeroValues;
                if (useTransparencyOnIndicator) {
                  fillOpacity = defaultFillOpacityForZeroFeatures;
                }
              }
              else {
                // invert colors, so that lowest values will become strong colored!
                for (var k = 0; k < dynamicDecreaseBrew.breaks.length; k++) {
                  if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == kommonitorDataExchangeService.getIndicatorValue_asNumber(dynamicDecreaseBrew.breaks[k])) {
                    if (k < dynamicDecreaseBrew.breaks.length - 1) {
                      // min value
                      fillColor = dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - k - 1];
                      break;
                    }
                    else {
                      //max value
                      if (dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - k]) {
                        fillColor = dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - k];
                      }
                      else {
                        fillColor = dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - k - 1];
                      }
                      break;
                    }
                  }
                  else {
                    if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < kommonitorDataExchangeService.getIndicatorValue_asNumber(dynamicDecreaseBrew.breaks[k + 1])) {
                      fillColor = dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - k - 1];
                      break;
                    }
                  }
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
            }
          }
          else {
            fillColor = defaultBrew.getColorInRange(kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]));
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
            fillColor = defaultColorForZeroValues;
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {



            for (var index = 0; index < gtMeasureOfValueBrew.breaks.length; index++) {

              if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == kommonitorDataExchangeService.getIndicatorValue_asNumber(gtMeasureOfValueBrew.breaks[index])) {
                if (index < gtMeasureOfValueBrew.breaks.length - 1) {
                  // min value
                  fillColor = gtMeasureOfValueBrew.colors[index];
                  break;
                }
                else {
                  //max value
                  if (gtMeasureOfValueBrew.colors[index]) {
                    fillColor = gtMeasureOfValueBrew.colors[index];
                  }
                  else {
                    fillColor = gtMeasureOfValueBrew.colors[index - 1];
                  }
                  break;
                }
              }
              else {
                if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < kommonitorDataExchangeService.getIndicatorValue_asNumber(gtMeasureOfValueBrew.breaks[index + 1])) {
                  fillColor = gtMeasureOfValueBrew.colors[index];
                  break;
                }
              }
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
        }
        else {
          if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
            fillColor = defaultColorForZeroValues;
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            // invert colors, so that lowest values will become strong colored!
            for (var j = 0; j < ltMeasureOfValueBrew.breaks.length; j++) {
              if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == kommonitorDataExchangeService.getIndicatorValue_asNumber(ltMeasureOfValueBrew.breaks[j])) {
                if (j < ltMeasureOfValueBrew.breaks.length - 1) {
                  // min value
                  fillColor = ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - j - 1];
                  break;
                }
                else {
                  //max value
                  if (ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - j]) {
                    fillColor = ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - j];
                  }
                  else {
                    fillColor = ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - j - 1];
                  }
                  break;
                }
              }
              else {
                if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < kommonitorDataExchangeService.getIndicatorValue_asNumber(ltMeasureOfValueBrew.breaks[j + 1])) {
                  fillColor = ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - j - 1];
                  break;
                }
              }
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
            fillColor = defaultColorForZeroValues;
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            for (var index = 0; index < dynamicIncreaseBrew.breaks.length; index++) {
              if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == kommonitorDataExchangeService.getIndicatorValue_asNumber(dynamicIncreaseBrew.breaks[index])) {
                if (index < dynamicIncreaseBrew.breaks.length - 1) {
                  // min value
                  fillColor = dynamicIncreaseBrew.colors[index];
                  break;
                }
                else {
                  //max value
                  if (dynamicIncreaseBrew.colors[index]) {
                    fillColor = dynamicIncreaseBrew.colors[index];
                  }
                  else {
                    fillColor = dynamicIncreaseBrew.colors[index - 1];
                  }
                  break;
                }
              }
              else {
                if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < kommonitorDataExchangeService.getIndicatorValue_asNumber(dynamicIncreaseBrew.breaks[index + 1])) {
                  fillColor = dynamicIncreaseBrew.colors[index];
                  break;
                }
              }
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
        }
        else {
          if (feature.properties[propertyName] == 0 || feature.properties[propertyName] == "0") {
            fillColor = defaultColorForZeroValues;
            if (useTransparencyOnIndicator) {
              fillOpacity = defaultFillOpacityForZeroFeatures;
            }
          }
          else {
            // invert colors, so that lowest values will become strong colored!
            for (var l = 0; l < dynamicDecreaseBrew.breaks.length; l++) {
              if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) == kommonitorDataExchangeService.getIndicatorValue_asNumber(dynamicDecreaseBrew.breaks[l])) {
                if (l < dynamicDecreaseBrew.breaks.length - 1) {
                  // min value
                  fillColor = dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - l - 1];
                  break;
                }
                else {
                  //max value
                  if (dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - l]) {
                    fillColor = dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - l];
                  }
                  else {
                    fillColor = dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - l - 1];
                  }
                  break;
                }
              }
              else {
                if (kommonitorDataExchangeService.getIndicatorValue_asNumber(feature.properties[propertyName]) < kommonitorDataExchangeService.getIndicatorValue_asNumber(dynamicDecreaseBrew.breaks[l + 1])) {
                  fillColor = dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - l - 1];
                  break;
                }
              }
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
        }

      };

    }]);
