angular.module('kommonitorDiagramHelper', ['kommonitorMap', 'kommonitorDataExchange']);

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
  .module('kommonitorDiagramHelper', ['datatables'])
  .service(
    'kommonitorDiagramHelperService', ['$rootScope', '$timeout', 'kommonitorMapService', 'kommonitorDataExchangeService', '$http', '__env', 'DTOptionsBuilder', '$q',
    function ($rootScope, $timeout,
      kommonitorMapService, kommonitorDataExchangeService, $http, __env, DTOptionsBuilder, $q) {

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

      this.indicatorPropertyName = "";

      this.barChartOptions = {};
      this.lineChartOptions = {};
      this.histogramChartOptions = {};
      this.radarChartOptions = {};
      this.regressionChartOptions = {};

      this.isCloserToTargetDate = function(date, closestDate, targetDate){
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

      this.findClostestTimestamForTargetDate = function(indicatorForRadar, targetDate){
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
      };

      // an array of only the properties and metadata of all indicatorFeatures
      this.indicatorPropertiesForCurrentSpatialUnitAndTime;

      this.filterSameUnitAndSameTime = false;

      this.setupIndicatorPropertiesForCurrentSpatialUnitAndTime = function (filterBySameUnitAndSameTime) {
        this.indicatorPropertiesForCurrentSpatialUnitAndTime = [];

        kommonitorDataExchangeService.availableIndicators.forEach(indicatorMetadata => {
          var targetYear = kommonitorDataExchangeService.selectedDate.split("-")[0];
          var indicatorCandidateYears = []
          indicatorMetadata.applicableDates.forEach((date, i) => {
            indicatorCandidateYears.push(date.split("-")[0]);
          });


          // if (indicatorCandidateYears.includes(targetYear) && indicatorMetadata.applicableSpatialUnits.includes(kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
          //   var selectableIndicatorEntry = {};
          //   selectableIndicatorEntry.indicatorProperties = null;
          //   // per default show no indicators on radar
          //   selectableIndicatorEntry.isSelected = false;
          //   selectableIndicatorEntry.indicatorMetadata = indicatorMetadata;
          //   selectableIndicatorEntry.closestTimestamp = undefined;

          //   this.indicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
          // }
          
          if (indicatorMetadata.applicableSpatialUnits.includes(kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
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
              var selectableIndicatorEntry = {};
              selectableIndicatorEntry.indicatorProperties = null;
              // per default show no indicators on radar
              selectableIndicatorEntry.isSelected = false;
              selectableIndicatorEntry.indicatorMetadata = indicatorMetadata;
              // selectableIndicatorEntry.closestTimestamp = undefined;

              this.indicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
            }
            
          }
        });

        $rootScope.$broadcast("allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed");
      };

      this.fetchIndicatorPropertiesIfNotExists = async function(index){
        if(this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === null || this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === undefined){
          // var dateComps = kommonitorDataExchangeService.selectedDate.split("-");
          //
					// 	var year = dateComps[0];
					// 	var month = dateComps[1];
					// 	var day = dateComps[2];

          this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties = await this.fetchIndicatorProperties(this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorMetadata, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId);
        }
      };

      this.fetchIndicatorProperties = function (indicatorMetadata, spatialUnitId) {
        return $http({
          url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + indicatorMetadata.indicatorId + "/" + spatialUnitId + "/without-geometry",
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          return response.data;

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
					kommonitorDataExchangeService.displayMapApplicationError(error);
        });
      };

      this.getBarChartOptions = function () {
        return self.barChartOptions;
      };

      this.getGeoMapChartOptions = function () {
        return self.geoMapChartOptions;
      };

      this.getHistogramChartOptions = function () {
        return self.histogramChartOptions;
      };

      this.getLineChartOptions = function () {
        return self.lineChartOptions;
      };

      this.prepareAllDiagramResources = function (indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates) {

        self.indicatorPropertyName = INDICATOR_DATE_PREFIX + date;

        var featureNamesArray = new Array();
        var indicatorValueArray = new Array();
        var indicatorValueBarChartArray = new Array();

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

        // initialize timeSeries arrays
        for (var i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
          indicatorTimeSeriesAverageArray[i] = 0;
          indicatorTimeSeriesCountArray[i] = 0;
        }

        //sort array of features
        var cartographicFeatures = indicatorMetadataAndGeoJSON.geoJSON.features;
        cartographicFeatures.sort(compareFeaturesByIndicatorValue);

        for (var j = 0; j < cartographicFeatures.length; j++) {
          // diff occurs when balance mode is activated
          // then, cartographicFeatures display balance over time period, which shall be reflected in bar chart and histogram
          // the other diagrams must use the "normal" unbalanced indicator instead --> selectedFeatures
          var cartographicFeature = cartographicFeatures[j];

          var indicatorValue;
          if (kommonitorDataExchangeService.indicatorValueIsNoData(cartographicFeature.properties[self.indicatorPropertyName])) {
            indicatorValue = null;
          }
          else {
            indicatorValue = +Number(cartographicFeature.properties[self.indicatorPropertyName]).toFixed(numberOfDecimals);
          }

          featureNamesArray.push(cartographicFeature.properties[__env.FEATURE_NAME_PROPERTY_NAME]);
          indicatorValueArray.push(indicatorValue);

          var color = kommonitorDataExchangeService.getColorForFeature(cartographicFeature, indicatorMetadataAndGeoJSON, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue);

          var seriesItem = {
            value: indicatorValue,
            itemStyle: {
              color: color
              // borderWidth: 1,
              // borderColor: 'black'
            }
          };

          indicatorValueBarChartArray.push(seriesItem);

          // continue timeSeries arrays by adding and counting all time series values
          for (var i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
            var datePropertyName = INDICATOR_DATE_PREFIX + indicatorTimeSeriesDatesArray[i];
            if (!kommonitorDataExchangeService.indicatorValueIsNoData(cartographicFeature.properties[datePropertyName])) {
              // indicatorTimeSeriesAverageArray[i] += selectedFeature.properties[datePropertyName];
              indicatorTimeSeriesAverageArray[i] += cartographicFeature.properties[datePropertyName];
              indicatorTimeSeriesCountArray[i]++;

              // min stack
              if (indicatorTimeSeriesMinArray[i] === undefined || indicatorTimeSeriesMinArray[i] === null){
                indicatorTimeSeriesMinArray[i] = cartographicFeature.properties[datePropertyName];
              }
              else{
                if(cartographicFeature.properties[datePropertyName] < indicatorTimeSeriesMinArray[i]){
                  indicatorTimeSeriesMinArray[i] = cartographicFeature.properties[datePropertyName];
                }
              }

              // max stack
              if (indicatorTimeSeriesMaxArray[i] === undefined || indicatorTimeSeriesMaxArray[i] === null){
                indicatorTimeSeriesMaxArray[i] = cartographicFeature.properties[datePropertyName];
              }
              else{
                if(cartographicFeature.properties[datePropertyName] > indicatorTimeSeriesMaxArray[i]){
                  indicatorTimeSeriesMaxArray[i] = cartographicFeature.properties[datePropertyName];
                }
              }
            }
          }
        }

        // finish timeSeries arrays by computing averages of all time series values
        for (var i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
          indicatorTimeSeriesAverageArray[i] = +Number(indicatorTimeSeriesAverageArray[i] / indicatorTimeSeriesCountArray[i]).toFixed(numberOfDecimals);
        }

        setHistogramChartOptions(indicatorMetadataAndGeoJSON, indicatorValueArray, spatialUnitName, date);

        setLineChartOptions(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray, indicatorTimeSeriesMaxArray, indicatorTimeSeriesMinArray, spatialUnitName, date);

        setBarChartOptions(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date);

        setGeoMapChartOptions(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue);
      };

      var compareFeaturesByIndicatorValue = function (featureA, featureB) {
        if (featureA.properties[self.indicatorPropertyName] < featureB.properties[self.indicatorPropertyName])
          return -1;
        if (featureA.properties[self.indicatorPropertyName] > featureB.properties[self.indicatorPropertyName])
          return 1;
        return 0;
      };

      var setBarChartOptions = function (indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date) {

        // specify chart configuration item and data
        var labelOption = {
          normal: {
            show: true,
            position: 'insideBottom',
            align: 'left',
            verticalAlign: 'middle',
            rotate: 90,
            formatter: '{c}',
          }
        };

        // default fontSize of echarts
        var fontSize = 18;
        var barChartTitel = 'Feature-Vergleich - ' + spatialUnitName + ' - ';
        if (indicatorMetadataAndGeoJSON.fromDate) {
          barChartTitel += "Bilanz " + indicatorMetadataAndGeoJSON.fromDate + " - " + indicatorMetadataAndGeoJSON.toDate;
          fontSize = 14;
        }
        else {
          barChartTitel += date;
        }

        var barOption = {
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
            formatter: function (params) {
              var value = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value);
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
                show: true, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Feature-Vergleich', 'schlie&szlig;en', 'refresh'], optionToContent: function (opt) {

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
                    var value = kommonitorDataExchangeService.getIndicatorValue_asNumber(barData[i].value);
                    htmlString += "<tr>";
                    htmlString += "<td>" + featureNames[i] + "</td>";
                    htmlString += "<td>" + value + "</td>";
                    htmlString += "</tr>";
                  }

                  htmlString += "</tbody>";
                  htmlString += "</table>";

                  $rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);

                  return htmlString;
                }
              },
              restore: { show: false, title: "Erneuern" },
              saveAsImage: { show: true, title: "Export" }
            }
          },
          // legend: {
          // 		//data:[indicatorMetadataAndGeoJSON.indicatorName]
          // },
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
            z: 6,
            zlevel: 6,
            data: featureNamesArray
          },
          yAxis: {
            type: 'value',
            name: indicatorMetadataAndGeoJSON.unit,
            // splitArea: {
            //     show: true
            // }
          },
          series: [{
            // name: indicatorMetadataAndGeoJSON.indicatorName,
            type: 'bar',
            emphasis: {
              itemStyle: {
                borderWidth: 4,
                borderColor: defaultColorForClickedFeatures
              }
            },
            data: indicatorValueBarChartArray
          }]
        };

        // if (indicatorMetadataAndGeoJSON.geoJSON.features.length > 50) {
        //   // barOption.xAxis.data = undefined;
        //   barOption.xAxis.axisLabel.show = false;
        // }

        // use configuration item and data specified to show chart
        self.barChartOptions = barOption;
      };

      var containsNegativeValues = function (geoJSON, date) {

        var propertyName = date;

        if(! propertyName.includes(kommonitorDataExchangeService.indicatorDatePrefix)){
          propertyName = kommonitorDataExchangeService.indicatorDatePrefix + propertyName;
        }

        var containsNegativeValues = false;
        for (var i = 0; i < geoJSON.features.length; i++) {
          if (geoJSON.features[i].properties[propertyName] < 0) {
            containsNegativeValues = true;
            break;
          }
        }

        return containsNegativeValues;
      };

      var containsZeroValues = function (geoJSON, date) {

        var propertyName = date;

        if(! propertyName.includes(kommonitorDataExchangeService.indicatorDatePrefix)){
          propertyName = kommonitorDataExchangeService.indicatorDatePrefix + propertyName;
        }

        var containsZeroValues = false;
        for (var i = 0; i < geoJSON.features.length; i++) {
          if (geoJSON.features[i].properties[propertyName] === 0 || geoJSON.features[i].properties[propertyName] === "0") {
            containsZeroValues = true;
            break;
          }
        }

        return containsZeroValues;
      };

      var setupGeoMapLegend = function(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue){
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

        var pieces = [];

        if(containsZeroValues(indicatorMetadataAndGeoJSON.geoJSON, date)){
          pieces.push({
            min: 0,  
            opacity: 0.8,     
            max: 0,           
            color: defaultColorForZeroValues
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
          // measure of value brew
          var gtBreaks = gtMeasureOfValueBrew.breaks;
          var gtColors = gtMeasureOfValueBrew.colors;
          var ltBreaks = ltMeasureOfValueBrew.breaks;
          var ltColors = ltMeasureOfValueBrew.colors;

              for (var j = 0; j < gtColors.length; j++) {

                var legendItem_gtMov = {
                  min: gtBreaks[j],     
                  opacity: 0.8,             
                  color: gtColors[j]
                };
                if(gtBreaks[j + 1]){
                  legendItem_gtMov.max = gtBreaks[j + 1];
                }

                pieces.push(legendItem_gtMov);

              }

              for (var j = 0; j < ltColors.length; j++) {

                var legendItem_ltMov = {
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
        else if(indicatorType.includes("DYNAMIC")){
          // dynamic brew

          if(dynamicIncreaseBrew){
              var dynamicIncreaseBreaks = dynamicIncreaseBrew.breaks;
              var dynamicIncreaseColors = dynamicIncreaseBrew.colors;

              for (var j = 0; j < dynamicIncreaseColors.length; j++) {

                var legendItem_dynamicIncreaseMov = {
                  min: dynamicIncreaseBreaks[j],   
                  opacity: 0.8,               
                  color: dynamicIncreaseColors[j]
                };
                if(dynamicIncreaseBreaks[j + 1]){
                  legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j + 1];
                }

                pieces.push(legendItem_dynamicIncreaseMov);

              }
          }

          if(dynamicDecreaseBrew){
              var dynamicDecreaseBreaks = dynamicDecreaseBrew.breaks;
              var dynamicDecreaseColors = dynamicDecreaseBrew.colors;

              for (var j = 0; j < dynamicDecreaseColors.length; j++) {

                var legendItem_dynamicDecreaseMov = {
                  min: dynamicDecreaseBreaks[j],                  
                  opacity: 0.8,
                  color: dynamicDecreaseColors[dynamicDecreaseColors.length - 1 - j]
                };
                if(dynamicDecreaseBreaks[j + 1]){
                  legendItem_dynamicDecreaseMov.max = dynamicDecreaseBreaks[j + 1];
                }

                pieces.push(legendItem_dynamicDecreaseMov);

              }
          }          
        }
        else {
          // default brew

          if(containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON, date)){
            // dynamic brew
            if(dynamicIncreaseBrew){
              var dynamicIncreaseBreaks = dynamicIncreaseBrew.breaks;
              var dynamicIncreaseColors = dynamicIncreaseBrew.colors;

              for (var j = 0; j < dynamicIncreaseColors.length; j++) {

                var legendItem_dynamicIncreaseMov = {
                  min: dynamicIncreaseBreaks[j], 
                  opacity: 0.8,                 
                  color: dynamicIncreaseColors[j]
                };
                if(dynamicIncreaseBreaks[j + 1]){
                  legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j + 1];
                }

                pieces.push(legendItem_dynamicIncreaseMov);

              }
          }

          if(dynamicDecreaseBrew){
              var dynamicDecreaseBreaks = dynamicDecreaseBrew.breaks;
              var dynamicDecreaseColors = dynamicDecreaseBrew.colors;

              for (var j = 0; j < dynamicDecreaseColors.length; j++) {

                var legendItem_dynamicDecreaseMov = {
                  min: dynamicDecreaseBreaks[j],
                  opacity: 0.8,                  
                  color: dynamicDecreaseColors[dynamicDecreaseColors.length - 1 - j]
                };
                if(dynamicDecreaseBreaks[j + 1]){
                  legendItem_dynamicDecreaseMov.max = dynamicDecreaseBreaks[j + 1];
                }

                pieces.push(legendItem_dynamicDecreaseMov);

              }
          }       
          }
          else{
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

        return pieces;

      };

      var setGeoMapChartOptions = function (indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue) {

        indicatorMetadataAndGeoJSON.geoJSON.features.forEach(feature => {
          feature.properties.name= feature.properties[kommonitorDataExchangeService.FEATURE_NAME_PROPERTY_NAME];
        });

        var uniqueMapRef = 'geoMapChart';

        echarts.registerMap(uniqueMapRef, indicatorMetadataAndGeoJSON.geoJSON);

        // specify chart configuration item and data

        var legendConfig = setupGeoMapLegend(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue);

        // default fontSize of echarts
        var fontSize = 18;
        var geoMapChartTitel = indicatorMetadataAndGeoJSON.indicatorName + ' - ' + spatialUnitName + ' - ' + date;

        var seriesData = [];

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
            show: false
            // top: 15
          },
          tooltip: {
            trigger: 'item',
            confine: 'true',
            showDelay: 0,
            transitionDuration: 0.2,
            formatter: function (params) {
              var value = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value);
              return "" + params.name + ": " + value + " [" + indicatorMetadataAndGeoJSON.unit + "]";
            }           
          },
          toolbox: {
            show: true,
            right: '15',
            feature: {
              // mark : {show: true},
              dataView: {
                show: true, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Geo Map Chart', 'schlie&szlig;en', 'refresh'], optionToContent: function (opt) {

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
                    var value = kommonitorDataExchangeService.getIndicatorValue_asNumber(seriesData[i].value);
                    htmlString += "<tr>";
                    htmlString += "<td>" + seriesData[i].name + "</td>";
                    htmlString += "<td>" + value + "</td>";
                    htmlString += "</tr>";
                  }

                  htmlString += "</tbody>";
                  htmlString += "</table>";

                  $rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);

                  return htmlString;
                }
              },
              restore: { show: false, title: "Erneuern" },
              saveAsImage: { show: true, title: "Export" }
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
            precision: 2
        },
          series: [{
            name: indicatorMetadataAndGeoJSON.indicatorName,
            type: 'map',
            roam: true,
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
        self.geoMapChartOptions = geoMapOption;
      };


      var setLineChartOptions = function (indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray, indicatorTimeSeriesMaxArray, indicatorTimeSeriesMinArray, spatialUnitName, date) {

        var lineOption = {
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
            show: false
            // top: 15
          },
          tooltip: {
            trigger: 'axis',
            confine: 'true',
            formatter: function (params) {

              var string = "" + params[0].axisValueLabel + "<br/>";

              params.forEach(function (paramObj) {

                var value = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(paramObj.value);
                string += paramObj.seriesName + ": " + value + " [" + indicatorMetadataAndGeoJSON.unit + "]" + "<br/>";
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
                show: true, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Zeitreihe', 'schlie&szlig;en', 'refresh'], optionToContent: function (opt) {

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
                      var value = kommonitorDataExchangeService.getIndicatorValue_asNumber(lineSeries[k].data[j]);
                      htmlString += "<td>" + value + "</td>";
                    }
                    htmlString += "</tr>";
                  }

                  htmlString += "</tbody>";
                  htmlString += "</table>";

                  $rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);

                  return htmlString;
                }
              },
              restore: { show: false, title: "Erneuern" },
              saveAsImage: { show: true, title: "Export" }
            }
          },
          legend: {
            type: "scroll",
            bottom: 0,
            data: ['Arithmetisches Mittel']
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
            data: indicatorTimeSeriesDatesArray
          },
          yAxis: {
            type: 'value',
            name: indicatorMetadataAndGeoJSON.unit,
            // splitArea: {
            //     show: true
            // }
          },
          series: [
          {
            name: "Min",
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
            // lineStyle: {
            //   normal: {
            //     color: 'gray',
            //     width: 2,
            //     type: 'dashed'
            //   }
            // },
            // itemStyle: {
            //   normal: {
            //     borderWidth: 3,
            //     color: 'gray'
            //   }
            // }
          },
          {
            name: "Max",
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
            // lineStyle: {
            //   normal: {
            //     color: 'gray',
            //     width: 2,
            //     type: 'dashed'
            //   }
            // },
            // itemStyle: {
            //   normal: {
            //     borderWidth: 3,
            //     color: 'gray'
            //   }
            // }
          },
          {
            name: "Arithmetisches Mittel",
            type: 'line',
            data: indicatorTimeSeriesAverageArray,
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
          }]
        };

        // use configuration item and data specified to show chart
        self.lineChartOptions = lineOption;
      };


      var setHistogramChartOptions = function (indicatorMetadataAndGeoJSON, indicatorValueArray, spatialUnitName, date) {
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
                show: true, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Histogramm', 'schlie&szlig;en', 'refresh'], optionToContent: function (opt) {

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
              saveAsImage: { show: true, title: "Export" }
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
      };

      var onlyContainsPositiveNumbers = function (indicatorValueArray) {
        indicatorValueArray.forEach(function (element) {
          if (element < 0) {
            return false;
          }
        });

        return true;
      };


      var appendSeriesToLineChart = function (featureProperties) {

        // in case of activated balance mode, we must use the properties of kommonitorDataExchangeService.selectedIndicator, to aquire the correct time series item!
        if (kommonitorDataExchangeService.isBalanceChecked) {
          featureProperties = findPropertiesForTimeSeries(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
        }

        // append feature name to legend
        $scope.lineOption.legend.data.push(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);

        // create feature data series
        var featureSeries = {};
        featureSeries.name = featureProperties[__env.FEATURE_NAME_PROPERTY_NAME];
        featureSeries.type = 'line';
        featureSeries.data = new Array();

        // for each date create series data entry for feature
        for (var date of $scope.lineOption.xAxis.data) {
          var value;
          if (kommonitorDataExchangeService.indicatorValueIsNoData(featureProperties[INDICATOR_DATE_PREFIX + date])) {
            value = null;
          }
          else {
            value = +Number(featureProperties[INDICATOR_DATE_PREFIX + date]).toFixed(numberOfDecimals)
          }
          featureSeries.data.push(value);
        }

        $scope.lineOption.series.push(featureSeries);

        $scope.lineChart.setOption($scope.lineOption);
        setTimeout(function () {
          $scope.lineChart.resize();
        }, 350);
      };

      var findPropertiesForTimeSeries = function (spatialUnitFeatureName) {
        for (var feature of kommonitorDataExchangeService.selectedIndicator.geoJSON.features) {
          if (feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] === spatialUnitFeatureName) {
            return feature.properties;
          }
        }
      }

      var getSeriesIndexByFeatureName = function (featureName) {
        for (var index = 0; index < $scope.lineOption.series.length; index++) {
          if ($scope.lineOption.series[index].name === featureName)
            return index;
        }

        //return -1 if none was found
        return -1;
      };

      var removeSeriesFromLineChart = function (featureProperties) {
        // remove feature from legend
        var legendIndex = $scope.lineOption.legend.data.indexOf(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
        if (legendIndex > -1) {
          $scope.lineOption.legend.data.splice(legendIndex, 1);
        }

        // remove feature data series
        var seriesIndex = getSeriesIndexByFeatureName(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
        if (seriesIndex > -1) {
          $scope.lineOption.series.splice(seriesIndex, 1);
        }

        // second parameter tells echarts to not merge options with previous data. hence really remove series from graphic
        $scope.lineChart.setOption($scope.lineOption, true);
        setTimeout(function () {
          $scope.lineChart.resize();
        }, 350);
      };

      this.createInitialReachabilityAnalysisPieOptions = function(poiGeoresource, pointsPerIsochroneRangeMap){
        var option = {
          tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
              orient: 'vertical',
              left: 10,
              data: ['Test1', 'Test2', 'Test3', 'Test4', 'Test5']
          },
          series: [
              {
                  name: 'Test1234',
                  type: 'pie',
                  radius: ['50%', '70%'],
                  avoidLabelOverlap: true,
                  label: {
                      show: false,
                      position: 'center'
                  },
                  emphasis: {
                      label: {
                          show: true,
                          fontSize: '30',
                          fontWeight: 'bold'
                      }
                  },
                  labelLine: {
                      show: true
                  },
                  data: [
                      {value: 0, name: 'Test1'},
                      {value: 1, name: 'Test2'},
                      {value: 2, name: 'Test3'},
                      {value: 3, name: 'Test4'},
                      {value: 4, name: 'Test5'}
                  ]
              }
          ]
        };

        return option;
      };

      this.appendToOrReplaceReachabilityAnalysisPieOptions = function(poiGeoresource, pointsPerIsochroneRangeMap){

      };

    }]);
