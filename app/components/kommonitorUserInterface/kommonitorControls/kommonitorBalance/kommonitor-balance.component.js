"use strict";
angular
		.module('kommonitorBalance')
		.component(
				'kommonitorBalance',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorBalance/kommonitor-balance.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'kommonitorDataExchangeService', 'kommonitorDiagramHelperService', 
					'kommonitorFilterHelperService', '__env', '$timeout',
					function kommonitorBalanceController($scope, $rootScope, kommonitorMapService, kommonitorDataExchangeService, kommonitorDiagramHelperService, 
						kommonitorFilterHelperService, __env, $timeout) {

						const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
						this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
						this.kommonitorMapServiceInstance = kommonitorMapService;
						// initialize any adminLTE box widgets
						$('.box').boxWidget();
						var numberOfDecimals = __env.numberOfDecimals;

						$scope.targetDate;
						$scope.targetIndicatorProperty;
						$scope.rangeSliderForBalance;
						$scope.datesAsMs;

						$scope.trendConfig_allFeatures = {
							showMinMax: true,
							showCompleteTimeseries: true,
							trendComputationType: "linear"
						};

						$scope.$on("DisableBalance", function (event) {
							kommonitorDataExchangeService.isBalanceChecked = false;
							if($scope.rangeSliderForBalance){
								$scope.rangeSliderForBalance.update({
										block: true
								});
							}

							// reanebalbe DateSlider on map
							$rootScope.$broadcast("EnableDateSlider");
						});

						$scope.$on("replaceBalancedIndicator", function (event) {
							if(kommonitorDataExchangeService.isBalanceChecked){
								$scope.onChangeUseBalance();
							}
						});

						$scope.onChangeUseBalance = function(){

							if(kommonitorDataExchangeService.isMeasureOfValueChecked){
								kommonitorDataExchangeService.isMeasureOfValueChecked = false;
							}

							let indicatorMetadataAndGeoJSON = undefined;

							if(kommonitorDataExchangeService.isBalanceChecked){
								kommonitorDataExchangeService.isMeasureOfValueChecked = false;
								kommonitorDataExchangeService.classifyUsingWholeTimeseries = false;
								$scope.rangeSliderForBalance.update({
										block: false
								});
								// disable DateSlider on map
								$rootScope.$broadcast("DisableDateSlider");
								if(!kommonitorDataExchangeService.indicatorAndMetadataAsBalance){
									kommonitorDataExchangeService.indicatorAndMetadataAsBalance = jQuery.extend(true, {}, kommonitorDataExchangeService.selectedIndicator);
									var indicatorType = kommonitorDataExchangeService.selectedIndicator.indicatorType;
									if(indicatorType.includes("ABSOLUTE")){
										kommonitorDataExchangeService.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_ABSOLUTE";
									}
									else if(indicatorType.includes("RELATIVE")){
										kommonitorDataExchangeService.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_RELATIVE";
									}
									else if(indicatorType.includes("STANDARDIZED")){
										kommonitorDataExchangeService.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_STANDARDIZED";
									}

								}
								var data = $scope.rangeSliderForBalance.options;
								computeAndSetBalance(data);
								$timeout(function(){
								
									$scope.updateTrendChart(kommonitorDataExchangeService.selectedIndicator, data);	
								});
								indicatorMetadataAndGeoJSON = kommonitorDataExchangeService.indicatorAndMetadataAsBalance;
								// kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.indicatorAndMetadataAsBalance, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.targetDate, true);
							}
							else{
								$scope.rangeSliderForBalance.update({
										block: true
								});
								// reanebalbe DateSlider on map
								$rootScope.$broadcast("EnableDateSlider");
								indicatorMetadataAndGeoJSON = kommonitorDataExchangeService.selectedIndicator;
								// kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.targetDate, true);
							}
							// $rootScope.$broadcast("updateIndicatorValueRangeFilter", $scope.targetDate, indicatorMetadataAndGeoJSON);
							// do not replace dataset directly, but check if any filter can be applied when changing balance mode for the current dataset
							kommonitorFilterHelperService.filterAndReplaceDataset();
						};

						function getFromDate_asPropertyString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							var fromDate = new Date($scope.datesAsMs[datePeriodSliderData.from]);

							var fromDateAsPropertyString = makePropertyString(fromDate);
							var fromDateAsString = makeDateString(fromDate);
							if(!kommonitorDataExchangeService.indicatorAndMetadataAsBalance.applicableDates.includes(fromDateAsString)){
								fromDateAsPropertyString = snapToNearestUpperDate(fromDate, kommonitorDataExchangeService.indicatorAndMetadataAsBalance.applicableDates);
							}

							return fromDateAsPropertyString;
						}

						function getFromDate_asDateString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							var fromDate = new Date($scope.datesAsMs[datePeriodSliderData.from]);

							var fromDateAsString = makeDateString(fromDate);

							return fromDateAsString;
						}

						function getToDate_asPropertyString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							var toDate = new Date($scope.datesAsMs[datePeriodSliderData.to]);

							var toDateAsPropertyString = makePropertyString(toDate);
							var toDateAsString = makeDateString(toDate);
							if(!kommonitorDataExchangeService.indicatorAndMetadataAsBalance.applicableDates.includes(toDateAsString)){
								toDateAsPropertyString = snapToNearestLowerDate(toDate, kommonitorDataExchangeService.indicatorAndMetadataAsBalance.applicableDates);
							}

							return toDateAsPropertyString;
						}

						function getToDate_asDateString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							var toDate = new Date($scope.datesAsMs[datePeriodSliderData.to]);

							var toDateAsString = makeDateString(toDate);

							return toDateAsString;
						}

						$scope.updateTrendChart = function(indicatorMetadata, datePeriodSliderData){
							

							var fromDateAsPropertyString = getFromDate_asPropertyString(datePeriodSliderData);
							var toDateAsPropertyString = getToDate_asPropertyString(datePeriodSliderData);
							var fromDateString = getFromDate_asDateString(datePeriodSliderData);
							var fromDate_date = new Date(fromDateString);
							var toDateString = getToDate_asDateString(datePeriodSliderData);
          					var toDate_date = new Date(toDateString);  

							// based on prepared DOM, initialize echarts instance
							if (!$scope.trendChart_allFeatures)
								$scope.trendChart_allFeatures = echarts.init(document.getElementById('trendDiagram_allFeatures'));
							else {
								// explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
								$scope.trendChart_allFeatures.dispose();
								$scope.trendChart_allFeatures = echarts.init(document.getElementById('trendDiagram_allFeatures'));
							}

							// use configuration item and data specified to show chart
							$scope.trendOption = kommonitorDiagramHelperService.makeTrendChartOptions_forAllFeatures(indicatorMetadata, fromDateAsPropertyString, toDateAsPropertyString, $scope.trendConfig_allFeatures.showMinMax, $scope.trendConfig_allFeatures.showCompleteTimeseries, $scope.trendConfig_allFeatures.trendComputationType, kommonitorDataExchangeService.enableBilanceTrend);
							$scope.trendChart_allFeatures.setOption($scope.trendOption);

							$scope.trendChart_allFeatures.hideLoading();
							setTimeout(function () {
								$scope.trendChart_allFeatures.resize();
							}, 350);

							var trendData = [];
							var timeseriesData; 
							timeseriesData = $scope.trendOption.series[0].data;

							if(! $scope.trendConfig_allFeatures.showCompleteTimeseries){
								for (let index = 0; index < timeseriesData.length; index++) {
									var dateCandidate = new Date(indicatorMetadata.applicableDates[index]);
									if(dateCandidate >= fromDate_date && dateCandidate <= toDate_date){
										trendData.push(timeseriesData[index]);
									}            
								}
							}
							else{
								trendData = timeseriesData;
							}

							

							var balanceValue = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(trendData[trendData.length - 1] - trendData[0]);
							var balanceValue_numeric = kommonitorDataExchangeService.getIndicatorValue_asNumber(trendData[trendData.length - 1] - trendData[0]);
							var trendValue = "";
							if(Number(balanceValue_numeric) == 0){
								trendValue = "gleichbleibend";
							}
							else if(Number(balanceValue_numeric) > 0){
								trendValue = "steigend";
							}
							else {
								trendValue = "sinkend";
							}

							$scope.trendAnalysis_allFeatures = {
								min: kommonitorDataExchangeService.getIndicatorValue_asFormattedText(jStat.min(trendData)),
								max: kommonitorDataExchangeService.getIndicatorValue_asFormattedText(jStat.max(trendData)),
								deviation: kommonitorDataExchangeService.getIndicatorValue_asFormattedText(jStat.stdev(trendData)),
								variance: kommonitorDataExchangeService.getIndicatorValue_asFormattedText(jStat.variance(trendData)),
								mean: kommonitorDataExchangeService.getIndicatorValue_asFormattedText(jStat.mean(trendData)),
								median: kommonitorDataExchangeService.getIndicatorValue_asFormattedText(jStat.median(trendData)),
								balance: balanceValue,
								trend: trendValue
							};
							
						};

						$(window).on('resize', function () {
	
							if ($scope.trendChart_allFeatures != null && $scope.trendChart_allFeatures != undefined) {
								$scope.trendChart_allFeatures.resize();
							}
						});

						$scope.$on("updateBalanceSlider", function (event, date) {

								// kommonitorDataExchangeService.isBalanceChecked = false;
								$scope.setupRangeSliderForBalance(date);

						});

						function dateToTS (date) {
								return date.valueOf();
						}

						function tsToDateString (dateAsMs) {
							var date = new Date(dateAsMs);

							/**
							* TODO FIXME dateSLider formatter will return only year for now to prevent misleading month and day settings
							*/

							// return date.getFullYear();

								return date.toLocaleDateString("de-DE", {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
								});
						}

						function dateToDateString (date) {

							/**
							* TODO FIXME dateSLider formatter will return only year for now to prevent misleading month and day settings
							*/

							// return date.getFullYear();

								return date.toLocaleDateString("de-DE", {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
								});
						}

						function createDatesFromIndicatorDates(indicatorDates) {

							$scope.datesAsMs = [];

							for (var index=0; index < indicatorDates.length; index++){
								// year-month-day
								var dateComponents = indicatorDates[index].split("-");
								$scope.datesAsMs.push(dateToTS(new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]))));
							}
							return $scope.datesAsMs;
						}

						$scope.createNewBalanceInstance = function(){
							$scope.datesAsMs = createDatesFromIndicatorDates(kommonitorDataExchangeService.selectedIndicator.applicableDates);

							// new Date() uses month between 0-11!
							$("#rangeSliderForBalance").ionRangeSlider({
									skin: "big",
									type: "double",
									grid: true,
									values: $scope.datesAsMs,
									from: 0, // index, not the date
									to: $scope.datesAsMs.length -1, // index, not the date
									force_edges: true,
									prettify: tsToDateString,
									onChange: onChangeBalanceRange
							});

							$scope.rangeSliderForBalance = $("#rangeSliderForBalance").data("ionRangeSlider");
							// make sure that the handles are properly set to min and max values
							$scope.rangeSliderForBalance.update({
									from: 0, // index, not the date
									to: $scope.datesAsMs.length -1, // index, not the date
							});

							if (!kommonitorDataExchangeService.isBalanceChecked){
								// deactivate balance slider
								$scope.rangeSliderForBalance.update({
										block: true
								});
							}
						}

						$scope.removeOldInstance = function(){
							kommonitorDataExchangeService.rangeFilterData = undefined;
							$scope.rangeSliderForBalance.destroy();
							kommonitorDataExchangeService.indicatorAndMetadataAsBalance = undefined;

							var domNode = document.getElementById("rangeSliderForBalance");

							while (domNode.hasChildNodes()) {
								domNode.removeChild(domNode.lastChild);
							}
						}

						$scope.setupRangeSliderForBalance = function(date){
							$scope.targetDate = date;
							$scope.targetIndicatorProperty = INDICATOR_DATE_PREFIX + date;

							if(!$scope.rangeSliderForBalance){
								// create new instance
								$scope.createNewBalanceInstance();
							}
							else {

								if(kommonitorDataExchangeService.indicatorAndMetadataAsBalance){
									if (kommonitorDataExchangeService.selectedIndicator.indicatorName != kommonitorDataExchangeService.indicatorAndMetadataAsBalance.indicatorName){
										$scope.removeOldInstance();

										// create new instance
										$scope.createNewBalanceInstance();
									}
								}
								else{
									$scope.removeOldInstance();
									$scope.createNewBalanceInstance();
								}

							}

						};

						function onChangeBalanceRange (data) {
							// create balance GeoJSON and broadcast "replaceIndicatorAsGeoJSON"
							// Called every time handle position is changed
							computeAndSetBalance(data);
						
							$timeout(function(){
								
								$scope.updateTrendChart(kommonitorDataExchangeService.selectedIndicator, data);	
							});
							// we must call replaceIndicatorGeoJSON because the feature vaues have changed. calling restyle will not work as it only restyles the old numbers
							kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.indicatorAndMetadataAsBalance, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.targetDate, true);
						};

						function computeAndSetBalance(data){

							var fromDateAsPropertyString = getFromDate_asPropertyString(data);
							var fromDateAsDateString = getFromDate_asDateString(data);
							var toDateAsPropertyString = getToDate_asPropertyString(data);
							var toDateAsDateString = getToDate_asDateString(data);

							// make another copy of selectedIndicator to ensure that feature order matches each other
							kommonitorDataExchangeService.indicatorAndMetadataAsBalance = jQuery.extend(true, {}, kommonitorDataExchangeService.selectedIndicator);

							var indicatorType = kommonitorDataExchangeService.selectedIndicator.indicatorType;
							if(indicatorType.includes("ABSOLUTE")){
								kommonitorDataExchangeService.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_ABSOLUTE";
							}
							else if(indicatorType.includes("RELATIVE")){
								kommonitorDataExchangeService.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_RELATIVE";
							}
							else if(indicatorType.includes("STANDARDIZED")){
								kommonitorDataExchangeService.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_STANDARDIZED";
							}

							// set value of selected target property with the computed balance between toDate - FromDate
							for (var index=0; index < kommonitorDataExchangeService.selectedIndicator.geoJSON.features.length; index++){

								var toDateValue = kommonitorDataExchangeService.getIndicatorValue_asNumber(kommonitorDataExchangeService.selectedIndicator.geoJSON.features[index].properties[toDateAsPropertyString]);
								var fromDateValue = kommonitorDataExchangeService.getIndicatorValue_asNumber(kommonitorDataExchangeService.selectedIndicator.geoJSON.features[index].properties[fromDateAsPropertyString]);

								kommonitorDataExchangeService.indicatorAndMetadataAsBalance.geoJSON.features[index].properties[$scope.targetIndicatorProperty] = kommonitorDataExchangeService.getIndicatorValue_asNumber(toDateValue - fromDateValue);
							}
							kommonitorDataExchangeService.indicatorAndMetadataAsBalance['fromDate'] = dateToDateString(new Date(fromDateAsDateString));
							kommonitorDataExchangeService.indicatorAndMetadataAsBalance['toDate'] = dateToDateString(new Date(toDateAsDateString));
						};

						function snapToNearestLowerDate(toDate, applicableDates){
							var earliestDateStringComponents = applicableDates[0].split("-");

							var earliestDate = new Date(Number(earliestDateStringComponents[0]), Number(earliestDateStringComponents[1]) - 1, Number(earliestDateStringComponents[2]));
							var dateCandidate = toDate;

							// we need to find the next lower applicableDate
							// decrement day by one and check, otherwise decrement month and/or year
							dateCandidate.setDate(dateCandidate.getDate() - 1);

							var targetDatePropertyString;

							while(dateCandidate > earliestDate){
								var dateCandidateString = makeDateString(dateCandidate);
								if (applicableDates.includes(dateCandidateString)){
									targetDatePropertyString = makePropertyString(dateCandidate);
									break;
								}
								//decrement by one day
								dateCandidate.setDate(dateCandidate.getDate() - 1);
							}

							if(!targetDatePropertyString)
								targetDatePropertyString = makePropertyString(earliestDate);

							return targetDatePropertyString;
						}

						function snapToNearestUpperDate(fromDate, applicableDates){
							var lastDateStringComponents = applicableDates[applicableDates.length -1].split("-");

							var latestDate = new Date(Number(lastDateStringComponents[0]), Number(lastDateStringComponents[1]) - 1, Number(lastDateStringComponents[2]));
							var dateCandidate = fromDate;

							// we need to find the next upper applicableDate
							// increment day by one and check, otherwise increment month and/or year
							dateCandidate.setDate(dateCandidate.getDate() + 1);

							var targetDatePropertyString;

							while(dateCandidate < latestDate){
								var dateCandidateString = makeDateString(dateCandidate);
								if (applicableDates.includes(dateCandidateString)){
									targetDatePropertyString = makePropertyString(dateCandidate);
									break;
								}
								//increment by one day
								dateCandidate.setDate(dateCandidate.getDate() + 1);
							}

							if(!targetDatePropertyString)
								targetDatePropertyString = makePropertyString(latestDate);

							return targetDatePropertyString;
						}

						function makeDateString(date){
							var year = date.getFullYear();
							var month = date.getMonth() + 1; // because month is from 0-11
							var day = date.getDate();

							// e.g. 2018-01-01
							var propertyString = year + "-";

							if(month < 10){
								propertyString += "0" + month + "-";
							}
							else{
								propertyString += month  + "-";
							}

							if(day < 10){
								propertyString += "0" + day;
							}
							else{
								propertyString += day;
							}

							return propertyString;
						};

						function makePropertyString(date){
							var dateString = makeDateString(date);
							return INDICATOR_DATE_PREFIX + dateString;
						};


						$scope.onChangeTrendConfig = function(){
							var data = $scope.rangeSliderForBalance.result;
								$timeout(function(){
								
									$scope.updateTrendChart(kommonitorDataExchangeService.selectedIndicator, data);	
								});
						};

						$scope.onChangeEnableBilanceTrend = function(){
							var data = $scope.rangeSliderForBalance.result;
								$timeout(function(){
								
									$scope.updateTrendChart(kommonitorDataExchangeService.selectedIndicator, data);	
								});
						}

					}]
				});
