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

      this.setupIndicatorPropertiesForCurrentSpatialUnitAndTime = function () {
        this.indicatorPropertiesForCurrentSpatialUnitAndTime = [];

        kommonitorDataExchangeService.availableIndicators.forEach(indicatorMetadata => {
          var targetYear = kommonitorDataExchangeService.selectedDate.split("-")[0];
          var indicatorCandidateYears = []
          indicatorMetadata.applicableDates.forEach((date, i) => {
            indicatorCandidateYears.push(date.split("-")[0]);
          });


          if (indicatorCandidateYears.includes(targetYear) && indicatorMetadata.applicableSpatialUnits.includes(kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
            var selectableIndicatorEntry = {};
            selectableIndicatorEntry.indicatorProperties = null;
            // per default show no indicators on radar
            selectableIndicatorEntry.isSelected = false;
            selectableIndicatorEntry.indicatorMetadata = indicatorMetadata;
            selectableIndicatorEntry.closestTimestamp = undefined;

            this.indicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
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

        }, function errorCallback(response) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });
      }

      this.getBarChartOptions = function () {
        return self.barChartOptions;
      };

      this.getHistogramChartOptions = function () {
        return self.histogramChartOptions;
      };

      this.getLineChartOptions = function () {
        return self.lineChartOptions;
      };

      this.prepareAllDiagramResources = function (indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, ) {

        self.indicatorPropertyName = INDICATOR_DATE_PREFIX + date;

        var featureNamesArray = new Array();
        var indicatorValueArray = new Array();
        var indicatorValueBarChartArray = new Array();

        var indicatorTimeSeriesDatesArray = indicatorMetadataAndGeoJSON.applicableDates;
        var indicatorTimeSeriesAverageArray = new Array(indicatorTimeSeriesDatesArray.length);
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
            }
          }
        }

        // finish timeSeries arrays by computing averages of all time series values
        for (var i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
          indicatorTimeSeriesAverageArray[i] = +Number(indicatorTimeSeriesAverageArray[i] / indicatorTimeSeriesCountArray[i]).toFixed(numberOfDecimals);
        }

        setHistogramChartOptions(indicatorMetadataAndGeoJSON, indicatorValueArray, spatialUnitName, date);

        setLineChartOptions(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray, spatialUnitName, date);

        setBarChartOptions(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray, spatialUnitName, date);
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
            left: '7%',
            top: 32,
            right: '5%',
            bottom: 32
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
              inside: true
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

        if (indicatorMetadataAndGeoJSON.geoJSON.features.length > 50) {
          // barOption.xAxis.data = undefined;
          barOption.xAxis.axisLabel.show = false;
        }

        // use configuration item and data specified to show chart
        self.barChartOptions = barOption;
      };


      var setLineChartOptions = function (indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray, spatialUnitName, date) {

        var lineOption = {
          // grid get rid of whitespace around chart
          grid: {
            left: '7%',
            top: 32,
            right: '5%',
            bottom: 55
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
          series: [{
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
            left: '7%',
            top: 32,
            right: '7%',
            bottom: 35
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
            data: bins.customData
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

    }]);
