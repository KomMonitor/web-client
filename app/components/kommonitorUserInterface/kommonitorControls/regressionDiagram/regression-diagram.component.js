"use strict";
angular
    .module('regressionDiagram')
    .component('regressionDiagram', {
    templateUrl: "components/kommonitorUserInterface/kommonitorControls/regressionDiagram/regression-diagram.template.html",
    controller: [
        'kommonitorDataExchangeService', 'kommonitorDiagramHelperService', 'kommonitorFilterHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
        function indicatorRadarController(kommonitorDataExchangeService, kommonitorDiagramHelperService, kommonitorFilterHelperService, $scope, $rootScope, $http, __env, $timeout) {
            /*
             * reference to kommonitorDataExchangeService instances
             */
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            this.kommonitorDiagramHelperServiceInstance = kommonitorDiagramHelperService;
            var self = this;
            $scope.activeTab = 0;
            // initialize any adminLTE box widgets
            $('.box').boxWidget();
            $(window).on('resize', function () {
                if ($scope.regressionChart != null && $scope.regressionChart != undefined) {
                    $scope.regressionChart.resize();
                }
            });
            $scope.$on("resizeDiagrams", function (event) {
                setTimeout(function () {
                    if ($scope.regressionChart != null && $scope.regressionChart != undefined) {
                        $scope.regressionChart.resize();
                    }
                }, 350);
            });
            $scope.selection = {};
            $scope.selection.indicatorNameFilterForXAxis = undefined;
            $scope.selection.indicatorNameFilterForYAxis = undefined;
            const DATE_PREFIX = __env.indicatorDatePrefix;
            var numberOfDecimals = __env.numberOfDecimals;
            const defaultColorForFilteredValues = __env.defaultColorForFilteredValues;
            const defaultColorForZeroValues = __env.defaultColorForZeroValues;
            const defaultColorForNoDataValues = __env.defaultColorForNoDataValues;
            const defaultColorForHoveredFeatures = __env.defaultColorForHoveredFeatures;
            const defaultColorForClickedFeatures = __env.defaultColorForClickedFeatures;
            const defaultColorForOutliers_high = __env.defaultColorForOutliers_high;
            const defaultBorderColorForOutliers_high = __env.defaultBorderColorForOutliers_high;
            const defaultFillOpacityForOutliers_high = __env.defaultFillOpacityForOutliers_high;
            const defaultColorForOutliers_low = __env.defaultColorForOutliers_low;
            const defaultBorderColorForOutliers_low = __env.defaultBorderColorForOutliers_low;
            const defaultFillOpacityForOutliers_low = __env.defaultFillOpacityForOutliers_low;
            $scope.setupCompleted = true;
            //$scope.allIndicatorProperties;
            $scope.selection.selectedIndicatorForXAxis;
            $scope.selection.selectedIndicatorForXAxis_backup;
            $scope.selection.selectedIndicatorForYAxis;
            $scope.selection.selectedIndicatorForYAxis_backup;
            $scope.correlation;
            $scope.linearRegression;
            $scope.regressionOption;
            $scope.regressionChart;
            $scope.data;
            $scope.dataWithLabels;
            $scope.eventsRegistered = false;
            // $scope.userHoveresOverItem = false;
            $scope.sortedIndicatorProps;
            $scope.spatialUnitName;
            $scope.date;
            $scope.filterIndicators = function () {
                return kommonitorDataExchangeService.filterIndicators();
            };
            $scope.filterIndicatorsBySpatialUnitAndDate = function () {
                return async function (item) {
                    //
                    // await wait(2000);
                    if (item.applicableSpatialUnits.some(o => o.spatialUnitName == kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
                        return item.applicableDates.includes(kommonitorDataExchangeService.selectedDate);
                    }
                    else {
                        return false;
                    }
                };
            };
            var wait = ms => new Promise((r, j) => setTimeout(r, ms));
            $scope.$on("allIndicatorPropertiesForCurrentSpatialUnitAndTime setup begin", async function (event) {
                await wait(130);
                $scope.setupCompleted = false;
                $timeout(function () {
                    $scope.$digest();
                }, 500);
            });
            $scope.$on("allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed", async function (event) {
                await wait(100);
                $timeout(function () {
                    $scope.setupCompleted = true;
                    $scope.$digest();
                    $scope.onChangeSelectedIndicators();
                }, 500);
            });
            $scope.onChangeSelectedDate = function (input) {
                $scope.onChangeSelectedIndicators();
            };
            $scope.onChangeFilterSameUnitAndSameTime = function () {
                if ($scope.regressionChart) {
                    $scope.regressionChart.dispose();
                    $scope.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
                }
                kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
                kommonitorDiagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(kommonitorDiagramHelperService.filterSameUnitAndSameTime);
            };
            $scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) {
                $scope.correlation = undefined;
                $scope.linearRegression = undefined;
                $scope.regressionOption = undefined;
                $scope.sortedIndicatorProps = undefined;
                $scope.data = undefined;
                $scope.dataWithLabels = undefined;
                $scope.eventsRegistered = false;
                // $scope.userHoveresOverItem = false;
                $scope.indicatorPropertyName = DATE_PREFIX + kommonitorDataExchangeService.selectedDate;
                $scope.spatialUnitName = spatialUnitName;
                $scope.date = date;
                $scope.indicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;
                $scope.defaultBrew = defaultBrew;
                $scope.gtMeasureOfValueBrew = gtMeasureOfValueBrew;
                $scope.ltMeasureOfValueBrew = ltMeasureOfValueBrew;
                $scope.dynamicIncreaseBrew = dynamicIncreaseBrew;
                $scope.dynamicDecreaseBrew = dynamicDecreaseBrew;
                $scope.isMeasureOfValueChecked = isMeasureOfValueChecked;
                $scope.measureOfValue = measureOfValue;
                if (justRestyling) {
                    $scope.onChangeSelectedIndicators();
                }
                else {
                    if ($scope.regressionChart) {
                        $scope.regressionChart.dispose();
                        $scope.regressionChart = undefined;
                    }
                    $scope.setupCompleted = false;
                    $scope.selection.selectedIndicatorForXAxis = undefined;
                    $scope.selection.selectedIndicatorForYAxis = undefined;
                    $timeout(function () {
                        $("option").each(function (index, element) {
                            var text = $(element).text();
                            $(element).attr("title", text);
                        });
                    });
                }
                $scope.activeTab = 0;
                if (kommonitorDataExchangeService.selectedIndicator.creationType == "COMPUTATION") {
                    $scope.activeTab = 1;
                }
                if (kommonitorDataExchangeService.selectedIndicator.isHeadlineIndicator) {
                    $scope.activeTab = 2;
                }
                $timeout(function () {
                    $scope.onChangeSelectedIndicators();
                }, 500);
            });
            $scope.$on("updateDiagramsForHoveredFeature", function (event, featureProperties) {
                if (!$scope.regressionChart) {
                    return;
                }
                // if($scope.userHoveresOverItem){
                // 	return;
                // }
                var index = -1;
                for (var i = 0; i < $scope.regressionOption.series[0].data.length; i++) {
                    if ($scope.regressionOption.series[0].data[i].name == featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    $scope.regressionChart.dispatchAction({
                        type: 'highlight',
                        seriesIndex: 0,
                        dataIndex: index
                    });
                    // tooltip
                    $scope.regressionChart.dispatchAction({
                        type: 'showTip',
                        seriesIndex: 0,
                        dataIndex: index
                    });
                }
            });
            $scope.$on("updateDiagramsForUnhoveredFeature", function (event, featureProperties) {
                if (!$scope.regressionChart) {
                    return;
                }
                if (!kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[__env.FEATURE_ID_PROPERTY_NAME])) {
                    // highlight the corresponding bar diagram item
                    var index = -1;
                    for (var i = 0; i < $scope.regressionOption.series[0].data.length; i++) {
                        if ($scope.regressionOption.series[0].data[i].name == featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]) {
                            index = i;
                            break;
                        }
                    }
                    if (index > -1) {
                        $scope.regressionChart.dispatchAction({
                            type: 'downplay',
                            seriesIndex: 0,
                            dataIndex: index
                        });
                        // tooltip
                        $scope.regressionChart.dispatchAction({
                            type: 'hideTip',
                            seriesIndex: 0,
                            dataIndex: index
                        });
                    }
                }
            });
            $scope.getAllIndicatorPropertiesSortedBySpatialUnitFeatureName = function () {
                for (var i = 0; i < kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.length; i++) {
                    // make object to hold indicatorName, max value and average value
                    kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorProperties.sort(function (a, b) {
                        // a and b are arrays of indicatorProperties for all features of the selected spatialUnit. We sort them by their property "spatialUnitFeatureName"
                        var nameA = a[__env.FEATURE_NAME_PROPERTY_NAME].toUpperCase(); // ignore upper and lowercase
                        var nameB = b[__env.FEATURE_NAME_PROPERTY_NAME].toUpperCase(); // ignore upper and lowercase
                        if (nameA < nameB) {
                            return -1;
                        }
                        if (nameA > nameB) {
                            return 1;
                        }
                        // names are equal
                        return 0;
                    });
                }
                return kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime;
            };
            $scope.getPropertiesForIndicatorName = async function (indicatorName) {
                for (var [index, indicator] of kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.entries()) {
                    if (indicator.indicatorMetadata.indicatorName == indicatorName) {
                        await kommonitorDiagramHelperService.fetchIndicatorPropertiesIfNotExists(index);
                        // var closestApplicableTimestamp = kommonitorDiagramHelperService.findClostestTimestamForTargetDate(indicator, kommonitorDataExchangeService.selectedDate);
                        // indicator.closestTimestamp = closestApplicableTimestamp;
                        return indicator.indicatorProperties;
                    }
                }
            };
            var getColor = function (featureName) {
                var color;
                for (var index = 0; index < $scope.indicatorMetadataAndGeoJSON.geoJSON.features.length; index++) {
                    var feature = $scope.indicatorMetadataAndGeoJSON.geoJSON.features[index];
                    if (feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] == featureName) {
                        color = kommonitorDiagramHelperService.getColorForFeature(feature, $scope.indicatorMetadataAndGeoJSON, $scope.indicatorPropertyName, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.isMeasureOfValueChecked, $scope.measureOfValue);
                        break;
                    }
                }
                return color;
            };
            function mapRegressionData(indicatorPropertiesArray, timestamp, map, axisValueName) {
                for (const indicatorPropertiesEntry of indicatorPropertiesArray) {
                    let featureName = indicatorPropertiesEntry[__env.FEATURE_NAME_PROPERTY_NAME];
                    let indicatorValue;
                    if (kommonitorDataExchangeService.indicatorValueIsNoData(indicatorPropertiesEntry[DATE_PREFIX + timestamp])) {
                        indicatorValue = null;
                    }
                    else {
                        indicatorValue = kommonitorDataExchangeService.getIndicatorValue_asNumber(indicatorPropertiesEntry[DATE_PREFIX + timestamp]);
                    }
                    if (map.has(featureName)) {
                        let oldObject = map.get(featureName);
                        oldObject[axisValueName] = indicatorValue;
                        map.set(featureName, oldObject);
                    }
                    else {
                        let color = getColor(featureName);
                        let regressionObject = {
                            name: featureName,
                            itemStyle: {
                                color: color
                            }
                        };
                        regressionObject[axisValueName] = indicatorValue;
                        map.set(featureName, regressionObject);
                    }
                }
                return map;
            }
            $scope.buildDataArrayForSelectedIndicators = async function () {
                $scope.data = new Array();
                $scope.dataWithLabels = new Array();
                var indicatorPropertiesArrayForXAxis = await $scope.getPropertiesForIndicatorName($scope.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName);
                var indicatorPropertiesArrayForYAxis = await $scope.getPropertiesForIndicatorName($scope.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName);
                if (kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay && kommonitorFilterHelperService.filteredIndicatorFeatureIds.size > 0) {
                    indicatorPropertiesArrayForXAxis = indicatorPropertiesArrayForXAxis.filter(featureProperties => !kommonitorFilterHelperService.featureIsCurrentlyFiltered(featureProperties[__env.FEATURE_ID_PROPERTY_NAME]));
                    indicatorPropertiesArrayForYAxis = indicatorPropertiesArrayForYAxis.filter(featureProperties => !kommonitorFilterHelperService.featureIsCurrentlyFiltered(featureProperties[__env.FEATURE_ID_PROPERTY_NAME]));
                }
                var timestamp_xAxis = $scope.selection.selectedIndicatorForXAxis.selectedDate;
                var timestamp_yAxis = $scope.selection.selectedIndicatorForYAxis.selectedDate;
                /*
                consider several cases
                across data timestamps or whole features might not exist
                --> cope with that and only preserve those result objects that have both timestamp values
                for x and y axis
                */
                // store data in a map to check above prerequesits
                // key = ID, 
                // value = regressionObject = {
                // 	name: featureName,											
                // 	itemStyle: {
                // 		color: color
                // 	},
                //  xAxisName: indicatorValue_x,
                //  yAxisName: indicatorValue_y
                //}
                let xAxisName = "xValue";
                let yAxisName = "yValue";
                let dataCandidateMap = mapRegressionData(indicatorPropertiesArrayForXAxis, timestamp_xAxis, new Map(), xAxisName);
                dataCandidateMap = mapRegressionData(indicatorPropertiesArrayForYAxis, timestamp_yAxis, dataCandidateMap, yAxisName);
                // now iterate over map and identify those objects that have both indicator axis values set
                // put those into resulting lists 
                dataCandidateMap.forEach(function (regressionObject, key, map) {
                    // $scope.data.push([xAxisDataElement, yAxisDataElement])
                    if (regressionObject[xAxisName] && regressionObject[yAxisName]) {
                        $scope.data.push([regressionObject[xAxisName], regressionObject[yAxisName]]);
                        regressionObject.value = [regressionObject[xAxisName], regressionObject[yAxisName]];
                        $scope.dataWithLabels.push(regressionObject);
                    }
                });
                return $scope.data;
            };
            /*
             *  Source: http://stevegardner.net/2012/06/11/javascript-code-to-calculate-the-pearson-correlation-coefficient/
             */
            function getPearsonCorrelation(x, y) {
                var shortestArrayLength = 0;
                if (x.length == y.length) {
                    shortestArrayLength = x.length;
                }
                else if (x.length > y.length) {
                    shortestArrayLength = y.length;
                    console.error('x has more items in it, the last ' + (x.length - shortestArrayLength) + ' item(s) will be ignored');
                }
                else {
                    shortestArrayLength = x.length;
                    console.error('y has more items in it, the last ' + (y.length - shortestArrayLength) + ' item(s) will be ignored');
                }
                var x_numeric = [];
                var y_numeric = [];
                var xy = [];
                var x2 = [];
                var y2 = [];
                for (var i = 0; i < shortestArrayLength; i++) {
                    if (x[i] && y[i]) {
                        x_numeric.push(x[i]);
                        y_numeric.push(y[i]);
                        xy.push(x[i] * y[i]);
                        x2.push(x[i] * x[i]);
                        y2.push(y[i] * y[i]);
                    }
                }
                var sum_x = 0;
                var sum_y = 0;
                var sum_xy = 0;
                var sum_x2 = 0;
                var sum_y2 = 0;
                for (var i = 0; i < x_numeric.length; i++) {
                    sum_x += x_numeric[i];
                    sum_y += y_numeric[i];
                    sum_xy += xy[i];
                    sum_x2 += x2[i];
                    sum_y2 += y2[i];
                }
                var step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
                var step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
                var step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
                var step4 = Math.sqrt(step2 * step3);
                var answer = step1 / step4;
                return Number(+answer.toFixed(2));
            }
            $scope.calculatePearsonCorrelation = function (data) {
                // data is an array of arrays containing the pairs of [x, y]
                var xArray = new Array();
                var yArray = new Array();
                data.forEach(function (xyPair) {
                    xArray.push(xyPair[0]);
                    yArray.push(xyPair[1]);
                });
                return getPearsonCorrelation(xArray, yArray);
            };
            $scope.onChangeSelectedIndicators = async function () {
                if ($scope.selection.selectedIndicatorForXAxis) {
                    $scope.selection.selectedIndicatorForXAxis_backup = $scope.selection.selectedIndicatorForXAxis;
                }
                else if ($scope.selection.selectedIndicatorForXAxis_backup) {
                    $scope.selection.selectedIndicatorForXAxis = $scope.selection.selectedIndicatorForXAxis_backup;
                }
                if ($scope.selection.selectedIndicatorForYAxis) {
                    $scope.selection.selectedIndicatorForYAxis_backup = $scope.selection.selectedIndicatorForYAxis;
                }
                else if ($scope.selection.selectedIndicatorForYAxis_backup) {
                    $scope.selection.selectedIndicatorForYAxis = $scope.selection.selectedIndicatorForYAxis_backup;
                }
                if ($scope.selection.selectedIndicatorForXAxis && $scope.selection.selectedIndicatorForYAxis) {
                    $scope.eventsRegistered = false;
                    if (!$scope.regressionChart)
                        $scope.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
                    else {
                        // explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
                        $scope.regressionChart.dispose();
                        $scope.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
                    }
                    await $scope.regressionChart.showLoading();
                    // if(!$scope.sortedIndicatorProps){
                    // 	$scope.sortedIndicatorProps = $scope.getAllIndicatorPropertiesSortedBySpatialUnitFeatureName();
                    // }
                    var data = await $scope.buildDataArrayForSelectedIndicators();
                    data.sort(function (a, b) {
                        return a[0] - b[0];
                    });
                    $scope.correlation = $scope.calculatePearsonCorrelation(data);
                    $scope.linearRegression = ecStat.regression('linear', data);
                    $scope.regressionOption = {
                        grid: {
                            left: '10%',
                            top: 10,
                            right: '5%',
                            bottom: 55,
                            containLabel: true
                        },
                        title: {
                            text: 'Lineare Regression - ' + $scope.spatialUnitName + ' - ' + $scope.date,
                            left: 'center',
                            show: false
                        },
                        tooltip: {
                            trigger: 'item',
                            confine: 'true',
                            axisPointer: {
                                type: 'cross'
                            },
                            formatter: function (params) {
                                if (!(params && params.value && params.value[0] && params.value[1])) {
                                    return "";
                                }
                                var string = "" + params.name + "<br/>";
                                string += $scope.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName + ": " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value[0]) + " [" + $scope.selection.selectedIndicatorForXAxis.indicatorMetadata.unit + "]<br/>";
                                string += $scope.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName + ": " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value[1]) + " [" + $scope.selection.selectedIndicatorForYAxis.indicatorMetadata.unit + "]<br/>";
                                return string;
                            }
                        },
                        xAxis: {
                            name: kommonitorDataExchangeService.formatIndicatorNameForLabel($scope.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName + " - " + $scope.selection.selectedIndicatorForXAxis.selectedDate + " [" + $scope.selection.selectedIndicatorForXAxis.indicatorMetadata.unit + "]", 100),
                            nameLocation: 'center',
                            nameGap: 22,
                            scale: true,
                            type: 'value',
                            splitLine: {
                                lineStyle: {
                                    type: 'dashed'
                                }
                            },
                        },
                        yAxis: {
                            name: kommonitorDataExchangeService.formatIndicatorNameForLabel($scope.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName + " - " + $scope.selection.selectedIndicatorForYAxis.selectedDate + " [" + $scope.selection.selectedIndicatorForYAxis.indicatorMetadata.unit + "]", 75),
                            nameLocation: 'center',
                            nameGap: 50,
                            type: 'value',
                            splitLine: {
                                lineStyle: {
                                    type: 'dashed'
                                }
                            },
                        },
                        toolbox: {
                            show: true,
                            right: '15',
                            feature: {
                                // mark : {show: true},
                                dataView: { show: kommonitorDataExchangeService.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - lineare Regression', 'schlie&szlig;en', 'refresh'], optionToContent: function (opt) {
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
                                        // has properties "name" and "value"
                                        // value: [Number(xAxisDataElement.toFixed(4)), Number(yAxisDataElement.toFixed(4))]
                                        var scatterSeries = opt.series[0].data;
                                        var lineSeries = opt.series[1].data;
                                        var dataTableId = "regressionDataTable";
                                        var tableExportName = opt.title[0].text + " - Scatter Table";
                                        var htmlString = "<p>Data View enth&auml;lt zwei nachstehende Tabellen, die Tabelle des Scatter Plots und die Tabelle der Punkte der Regressionsgeraden.</p><br/>";
                                        htmlString += '<h4>Scatter Plot Tabelle</h4>';
                                        htmlString += '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
                                        htmlString += "<thead>";
                                        htmlString += "<tr>";
                                        htmlString += "<th style='text-align:center;'>Feature-Name</th>";
                                        htmlString += "<th style='text-align:center;'>" + opt.xAxis[0].name + "</th>";
                                        htmlString += "<th style='text-align:center;'>" + opt.yAxis[0].name + "</th>";
                                        htmlString += "</tr>";
                                        htmlString += "</thead>";
                                        htmlString += "<tbody>";
                                        for (var j = 0; j < scatterSeries.length; j++) {
                                            htmlString += "<tr>";
                                            htmlString += "<td>" + scatterSeries[j].name + "</td>";
                                            htmlString += "<td>" + kommonitorDataExchangeService.getIndicatorValue_asNumber(scatterSeries[j].value[0]) + "</td>";
                                            htmlString += "<td>" + kommonitorDataExchangeService.getIndicatorValue_asNumber(scatterSeries[j].value[1]) + "</td>";
                                            htmlString += "</tr>";
                                        }
                                        htmlString += "</tbody>";
                                        htmlString += "</table>";
                                        var lineTableId = "lineDataTable";
                                        var lineTableExportName = opt.title[0].text + " - Line Table";
                                        htmlString += "<br/><h4>Referenzpunkte der Regressionsgraden '" + $scope.linearRegression.expression + "'</h4>";
                                        htmlString += '<table id="' + lineTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
                                        htmlString += "<thead>";
                                        htmlString += "<tr>";
                                        htmlString += "<th style='text-align:center;'>X</th>";
                                        htmlString += "<th style='text-align:center;'>Y</th>";
                                        htmlString += "</tr>";
                                        htmlString += "</thead>";
                                        htmlString += "<tbody>";
                                        for (var j = 0; j < lineSeries.length; j++) {
                                            htmlString += "<tr>";
                                            htmlString += "<td>" + kommonitorDataExchangeService.getIndicatorValue_asNumber(lineSeries[j][0]) + "</td>";
                                            htmlString += "<td>" + kommonitorDataExchangeService.getIndicatorValue_asNumber(lineSeries[j][1]) + "</td>";
                                            htmlString += "</tr>";
                                        }
                                        htmlString += "</tbody>";
                                        htmlString += "</table>";
                                        $rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);
                                        $rootScope.$broadcast("AppendExportButtonsForTable", lineTableId, lineTableExportName);
                                        return htmlString;
                                    } },
                                restore: { show: false, title: "Erneuern" },
                                saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
                            }
                        },
                        series: [{
                                name: "scatter",
                                type: 'scatter',
                                // label: {
                                //     emphasis: {
                                //         show: false,
                                //         position: 'left',
                                //         textStyle: {
                                //             color: 'blue',
                                //             fontSize: 16
                                //         }
                                //     }
                                // },
                                itemStyle: {
                                    borderWidth: 1,
                                    borderColor: 'black'
                                },
                                emphasis: {
                                    itemStyle: {
                                        borderWidth: 4,
                                        borderColor: defaultColorForClickedFeatures
                                    }
                                },
                                data: $scope.dataWithLabels
                            }, {
                                name: 'line',
                                type: 'line',
                                showSymbol: false,
                                data: $scope.linearRegression.points,
                                markPoint: {
                                    itemStyle: {
                                        normal: {
                                            color: 'transparent'
                                        }
                                    },
                                    label: {
                                        normal: {
                                            show: true,
                                            position: 'left',
                                            formatter: $scope.linearRegression.expression,
                                            textStyle: {
                                                color: '#333',
                                                fontSize: 14
                                            }
                                        }
                                    },
                                    data: [{
                                            coord: $scope.linearRegression.points[$scope.linearRegression.points.length - 1]
                                        }]
                                }
                            }]
                    };
                    $scope.regressionChart.setOption($scope.regressionOption);
                    await $scope.regressionChart.hideLoading();
                    setTimeout(function () {
                        $scope.regressionChart.resize();
                    }, 350);
                    registerEventsIfNecessary();
                    $rootScope.$broadcast("preserveHighlightedFeatures");
                    $timeout(function () {
                        $scope.$digest();
                    }, 500);
                }
            };
            function registerEventsIfNecessary() {
                if (!$scope.eventsRegistered) {
                    // when hovering over elements of the chart then highlight them in the map.
                    $scope.regressionChart.on('mouseOver', function (params) {
                        // $scope.userHoveresOverItem = true;
                        var spatialFeatureName = params.data.name;
                        // console.log(spatialFeatureName);
                        if (spatialFeatureName) {
                            $rootScope.$broadcast("highlightFeatureOnMap", spatialFeatureName);
                        }
                    });
                    $scope.regressionChart.on('mouseOut', function (params) {
                        // $scope.userHoveresOverItem = false;
                        var spatialFeatureName = params.data.name;
                        // console.log(spatialFeatureName);
                        if (spatialFeatureName) {
                            $rootScope.$broadcast("unhighlightFeatureOnMap", spatialFeatureName);
                        }
                    });
                    $scope.regressionChart.on('click', function (params) {
                        var spatialFeatureName = params.data.name;
                        // console.log(spatialFeatureName);
                        if (spatialFeatureName) {
                            $rootScope.$broadcast("switchHighlightFeatureOnMap", spatialFeatureName);
                        }
                    });
                    $scope.eventsRegistered = true;
                }
            }
            ;
        }
    ]
});
//# sourceMappingURL=regression-diagram.component.js.map