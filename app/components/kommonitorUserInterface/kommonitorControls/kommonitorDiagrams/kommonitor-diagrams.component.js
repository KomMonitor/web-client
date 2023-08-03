"use strict";
angular
    .module('kommonitorDiagrams')
    .component('kommonitorDiagrams', {
    templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorDiagrams/kommonitor-diagrams.template.html",
    /*
     * injected with a modules service method that manages
     * enabled tabs
     */
    controller: [
        'kommonitorDataExchangeService', 'kommonitorDiagramHelperService', 'kommonitorFilterHelperService',
        '$scope', '$rootScope', '__env',
        function kommonitorDiagramsController(kommonitorDataExchangeService, kommonitorDiagramHelperService, kommonitorFilterHelperService, $scope, $rootScope, __env) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            this.kommonitorDiagramHelperServiceInstance = kommonitorDiagramHelperService;
            // initialize any adminLTE box widgets
            $('.box').boxWidget();
            $(window).on('resize', function () {
                if ($scope.histogramChart != null && $scope.histogramChart != undefined) {
                    $scope.histogramChart.resize();
                }
                if ($scope.barChart != null && $scope.barChart != undefined) {
                    $scope.barChart.resize();
                }
                if ($scope.lineChart != null && $scope.lineChart != undefined) {
                    $scope.lineChart.resize();
                }
            });
            $scope.$on("resizeDiagrams", function (event) {
                setTimeout(function () {
                    if ($scope.histogramChart != null && $scope.histogramChart != undefined) {
                        $scope.histogramChart.resize();
                    }
                    if ($scope.barChart != null && $scope.barChart != undefined) {
                        $scope.barChart.resize();
                    }
                    if ($scope.lineChart != null && $scope.lineChart != undefined) {
                        $scope.lineChart.resize();
                    }
                }, 350);
            });
            const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
            const defaultColorForHoveredFeatures = __env.defaultColorForHoveredFeatures;
            const defaultColorForClickedFeatures = __env.defaultColorForClickedFeatures;
            // $scope.userHoveresOverBarItem = false;
            $scope.eventsRegistered = false;
            $scope.isTooManyFeatures = false;
            $scope.histogramCanBeDisplayed = false;
            $scope.spatialUnitName;
            $scope.date;
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
            var compareFeaturesByIndicatorValue = function (featureA, featureB) {
                if (featureA.properties[$scope.indicatorPropertyName] < featureB.properties[$scope.indicatorPropertyName])
                    return -1;
                if (featureA.properties[$scope.indicatorPropertyName] > featureB.properties[$scope.indicatorPropertyName])
                    return 1;
                return 0;
            };
            var showLoadingIcons = function () {
                if ($scope.histogramChart)
                    $scope.histogramChart.showLoading();
                if ($scope.barChart)
                    $scope.barChart.showLoading();
                if ($scope.lineChart)
                    $scope.lineChart.showLoading();
            };
            $scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) {
                // console.log("Updating diagrams!");
                $scope.loadingData = true;
                showLoadingIcons();
                $scope.spatialUnitName = spatialUnitName;
                $scope.date = date;
                kommonitorDiagramHelperService.prepareAllDiagramResources_forCurrentMapIndicator(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, false);
                // updateHistogramChart();
                updateLineChart();
                updateBarChart();
                $scope.loadingData = false;
            });
            //HISTOGRAM CHART FUNCTION
            var updateHistogramChart = function () {
                $scope.histogramCanBeDisplayed = false;
                if (!$scope.histogramChart)
                    $scope.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
                else {
                    // explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
                    $scope.histogramChart.dispose();
                    $scope.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
                }
                $scope.histogramOption = kommonitorDiagramHelperService.getHistogramChartOptions();
                $scope.histogramChart.setOption($scope.histogramOption);
                $scope.histogramChart.hideLoading();
                $scope.histogramCanBeDisplayed = true;
                setTimeout(function () {
                    $scope.histogramChart.resize();
                }, 350);
            };
            // BAR CHART FUNCTION
            var updateBarChart = function (indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray) {
                // based on prepared DOM, initialize echarts instance
                $scope.eventsRegistered = false;
                if (!$scope.barChart)
                    $scope.barChart = echarts.init(document.getElementById('barDiagram'));
                else {
                    // explicitly kill and reinstantiate bar diagram to avoid zombie states on spatial unit change
                    $scope.barChart.dispose();
                    $scope.barChart = echarts.init(document.getElementById('barDiagram'));
                }
                // use configuration item and data specified to show chart
                $scope.barOption = kommonitorDiagramHelperService.getBarChartOptions();
                $scope.barChart.setOption($scope.barOption);
                $scope.barChart.hideLoading();
                setTimeout(function () {
                    $scope.barChart.resize();
                }, 350);
                registerEventsIfNecessary();
            };
            function registerEventsIfNecessary() {
                if (!$scope.eventsRegistered) {
                    // when hovering over elements of the chart then highlight them in the map.
                    $scope.barChart.on('mouseOver', function (params) {
                        // $scope.userHoveresOverBarItem = true;
                        var seriesIndex = params.seriesIndex;
                        var dataIndex = params.dataIndex;
                        // console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
                        //
                        // var barElement = $scope.barOption.series[seriesIndex].data[dataIndex];
                        //
                        // console.log(barElement);
                        var spatialFeatureName = $scope.barOption.xAxis.data[dataIndex];
                        if (spatialFeatureName) {
                            // console.log(spatialFeatureName);
                            $rootScope.$broadcast("highlightFeatureOnMap", spatialFeatureName);
                        }
                    });
                    $scope.barChart.on('mouseOut', function (params) {
                        // $scope.userHoveresOverBarItem = false;
                        var seriesIndex = params.seriesIndex;
                        var dataIndex = params.dataIndex;
                        // console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
                        //
                        // var barElement = $scope.barOption.series[seriesIndex].data[dataIndex];
                        //
                        // console.log(barElement);
                        var spatialFeatureName = $scope.barOption.xAxis.data[dataIndex];
                        // console.log(spatialFeatureName);
                        if (spatialFeatureName) {
                            $rootScope.$broadcast("unhighlightFeatureOnMap", spatialFeatureName);
                        }
                    });
                    $scope.barChart.on('click', function (params) {
                        var seriesIndex = params.seriesIndex;
                        var dataIndex = params.dataIndex;
                        // console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
                        //
                        // var barElement = $scope.barOption.series[seriesIndex].data[dataIndex];
                        //
                        // console.log(barElement);
                        var spatialFeatureName = $scope.barOption.xAxis.data[dataIndex];
                        // console.log(spatialFeatureName);
                        if (spatialFeatureName) {
                            $rootScope.$broadcast("switchHighlightFeatureOnMap", spatialFeatureName);
                        }
                    });
                    $scope.eventsRegistered = true;
                }
            }
            ;
            // LINE CHART TIME SERIES FUNCTION
            var updateLineChart = function (indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray) {
                // based on prepared DOM, initialize echarts instance
                if (!$scope.lineChart)
                    $scope.lineChart = echarts.init(document.getElementById('lineDiagram'));
                else {
                    // explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
                    $scope.lineChart.dispose();
                    $scope.lineChart = echarts.init(document.getElementById('lineDiagram'));
                }
                // use configuration item and data specified to show chart
                $scope.lineOption = kommonitorDiagramHelperService.getLineChartOptions();
                $scope.lineChart.setOption($scope.lineOption);
                $scope.lineChart.hideLoading();
                setTimeout(function () {
                    $scope.lineChart.resize();
                }, 350);
            };
            $scope.$on("updateDiagramsForHoveredFeature", function (event, featureProperties) {
                if (!$scope.lineOption.legend.data.includes(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME])) {
                    appendSeriesToLineChart(featureProperties);
                }
                highlightFeatureInBarChart(featureProperties);
                highlightFeatureInLineChart(featureProperties);
            });
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
                        value = kommonitorDataExchangeService.getIndicatorValue_asNumber(featureProperties[INDICATOR_DATE_PREFIX + date]);
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
                    if (feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] == spatialUnitFeatureName) {
                        return feature.properties;
                    }
                }
            };
            var highlightFeatureInBarChart = function (featureProperties) {
                // highlight the corresponding bar diagram item
                // get index of bar item
                // if($scope.userHoveresOverBarItem){
                // 	return;
                // }
                var index = -1;
                for (var i = 0; i < $scope.barOption.xAxis.data.length; i++) {
                    if ($scope.barOption.xAxis.data[i] === featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    $scope.barChart.dispatchAction({
                        type: 'highlight',
                        seriesIndex: 0,
                        dataIndex: index
                    });
                    // tooltip
                    $scope.barChart.dispatchAction({
                        type: 'showTip',
                        seriesIndex: 0,
                        dataIndex: index
                    });
                }
            };
            var highlightFeatureInLineChart = function (featureProperties) {
                // highlight the corresponding bar diagram item
                // get series index of series
                var seriesIndex = getSeriesIndexByFeatureName(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
                if (seriesIndex > -1) {
                    $scope.lineChart.dispatchAction({
                        type: 'highlight',
                        seriesIndex: seriesIndex
                    });
                }
            };
            $scope.$on("updateDiagramsForUnhoveredFeature", function (event, featureProperties) {
                if (!kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[__env.FEATURE_ID_PROPERTY_NAME])) {
                    unhighlightFeatureInLineChart(featureProperties);
                    removeSeriesFromLineChart(featureProperties);
                    unhighlightFeatureInBarChart(featureProperties);
                }
            });
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
            var unhighlightFeatureInBarChart = function (featureProperties) {
                // highlight the corresponding bar diagram item
                // get index of bar item
                var index = -1;
                for (var i = 0; i < $scope.barOption.xAxis.data.length; i++) {
                    if ($scope.barOption.xAxis.data[i] === featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    $scope.barChart.dispatchAction({
                        type: 'downplay',
                        seriesIndex: 0,
                        dataIndex: index
                    });
                    // tooltip
                    $scope.barChart.dispatchAction({
                        type: 'hideTip',
                        seriesIndex: 0,
                        dataIndex: index
                    });
                }
            };
            var unhighlightFeatureInLineChart = function (featureProperties) {
                // highlight the corresponding bar diagram item
                // get series index of series
                var seriesIndex = getSeriesIndexByFeatureName(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
                if (seriesIndex > -1) {
                    $scope.lineChart.dispatchAction({
                        type: 'downplay',
                        seriesIndex: seriesIndex
                    });
                }
            };
            $scope.$on("AppendExportButtonsForTable", function (event, tableId, tableExportName) {
                setTimeout(function () {
                    // new TableExport(document.getElementsByTagName("table"), {
                    new TableExport(document.getElementById(tableId), {
                        headers: true,
                        footers: true,
                        formats: ['xlsx', 'csv', 'txt'],
                        filename: tableExportName,
                        bootstrap: true,
                        exportButtons: true,
                        position: 'top',
                        ignoreRows: null,
                        ignoreCols: null,
                        trimWhitespace: true // (Boolean), remove all leading/trailing newlines, spaces, and tabs from cell text in the exported file(s) (default: false)
                    });
                }, 50);
            });
        }
    ]
});
//# sourceMappingURL=kommonitor-diagrams.component.js.map