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
      const defaultColorForHoveredFeatures = __env.defaultColorForHoveredFeatures;
      const defaultColorForClickedFeatures = __env.defaultColorForClickedFeatures;

      var numberOfDecimals = __env.numberOfDecimals;
      var defaultColorForZeroValues = __env.defaultColorForZeroValues;
      var defaultColorForNoDataValues = __env.defaultColorForNoDataValues;
      var defaultColorForFilteredValues = __env.defaultColorForFilteredValues;

      const defaultColorForOutliers_high = __env.defaultColorForOutliers_high;
      const defaultBorderColorForOutliers_high = __env.defaultBorderColorForOutliers_high;
      const defaultFillOpacityForOutliers_high = __env.defaultFillOpacityForOutliers_high;
      const defaultColorForOutliers_low = __env.defaultColorForOutliers_low;
      const defaultBorderColorForOutliers_low = __env.defaultBorderColorForOutliers_low;
      const defaultFillOpacityForOutliers_low = __env.defaultFillOpacityForOutliers_low;

      const outlierPropertyName = "outlier";
      const outlierPropertyValue_high_soft = "high-soft";
      const outlierPropertyValue_low_soft = "low-soft";
      const outlierPropertyValue_high_extreme = "high-extreme";
      const outlierPropertyValue_low_extreme = "low-extreme";
      const outlierPropertyValue_no = "no";


      this.buildDefaultColorBrewer = function (geoJSON, propertyName, numClasses, colorCode, classifyMethod) {
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

    }]);
