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
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'kommonitorDataExchangeService', '__env', function kommonitorBalanceController($scope, $rootScope, kommonitorMapService, kommonitorDataExchangeService, __env) {

						const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
						this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
						this.kommonitorMapServiceInstance = kommonitorMapService;
						var numberOfDecimals = __env.numberOfDecimals;

						$scope.targetDate;
						$scope.targetIndicatorProperty;
						$scope.rangeSliderForBalance;
						$scope.datesAsMs;

						$scope.$on("DisableBalance", function (event) {
							kommonitorDataExchangeService.isBalanceChecked = false;
							if($scope.rangeSliderForBalance){
								$scope.rangeSliderForBalance.update({
										block: true
								});
							}
						});

						this.onChangeUseBalance = function(){
							console.log("Change UseBalance");

							if(kommonitorDataExchangeService.isMeasureOfValueChecked){
								kommonitorDataExchangeService.isMeasureOfValueChecked = false;
							}

							if(kommonitorDataExchangeService.isBalanceChecked){
								kommonitorDataExchangeService.isMeasureOfValueChecked = false;
								$scope.rangeSliderForBalance.update({
										block: false
								});
								if(!kommonitorDataExchangeService.indicatorAndMetadataAsBalance){
									kommonitorDataExchangeService.indicatorAndMetadataAsBalance = jQuery.extend(true, {}, kommonitorDataExchangeService.selectedIndicator);
									kommonitorDataExchangeService.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC";
								}
								var data = $scope.rangeSliderForBalance.options;
								computeAndSetBalance(data);
								kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.indicatorAndMetadataAsBalance, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.targetDate, true);
							}
							else{
								$scope.rangeSliderForBalance.update({
										block: true
								});
								kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.targetDate, true);
							}
							$rootScope.$broadcast("updateIndicatorValueRangeFilter", $scope.targetDate);
						};

						$scope.$on("updateBalanceSlider", function (event, date) {

								kommonitorDataExchangeService.isBalanceChecked = false;
								$scope.setupRangeSliderForBalance(date);

						});

						function dateToTS (date) {
								return date.valueOf();
						}

						function tsToDateString (dateAsMs) {
							var date = new Date(dateAsMs);

								return date.toLocaleDateString("de-DE", {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
								});
						}

						function dateToDateString (date) {

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

						$scope.setupRangeSliderForBalance = function(date){
							$scope.targetDate = date;
							$scope.targetIndicatorProperty = INDICATOR_DATE_PREFIX + date;

							if($scope.rangeSliderForBalance){
								kommonitorDataExchangeService.rangeFilterData = undefined;
								$scope.rangeSliderForBalance.destroy();
								kommonitorDataExchangeService.indicatorAndMetadataAsBalance = undefined;

								var domNode = document.getElementById("rangeSliderForBalance");

								while (domNode.hasChildNodes()) {
									domNode.removeChild(domNode.lastChild);
								}
							}

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
									block: true,
									onChange: onChangeBalanceRange
							});

							$scope.rangeSliderForBalance = $("#rangeSliderForBalance").data("ionRangeSlider");
							// make sure that tha handles are properly set to man and max values
							$scope.rangeSliderForBalance.update({
									from: 0, // index, not the date
								 	to: $scope.datesAsMs.length -1, // index, not the date
							});

							if (!kommonitorDataExchangeService.isBalanceChecked){
								// deactivate balance slider
								$scope.rangeSliderForBalance.block = true;
							}

						};

						function onChangeBalanceRange (data) {
							// create balance GeoJSON and broadcast "replaceIndicatorAsGeoJSON"
							// Called every time handle position is changed
							computeAndSetBalance(data);
							// we must call replaceIndicatorGeoJSON because the feature vaues have changed. calling restyle will not work as it only restyles the old numbers
							kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.indicatorAndMetadataAsBalance, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.targetDate, true);
						};

						function computeAndSetBalance(data){

							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							var fromDate = new Date($scope.datesAsMs[data.from]);
							var toDate = new Date($scope.datesAsMs[data.to]);

							var fromDateAsPropertyString = makePropertyString(fromDate);
							var fromDateAsString = makeDateString(fromDate);
							if(!kommonitorDataExchangeService.indicatorAndMetadataAsBalance.applicableDates.includes(fromDateAsString)){
								fromDateAsPropertyString = snapToNearestUpperDate(fromDate, kommonitorDataExchangeService.indicatorAndMetadataAsBalance.applicableDates);
							}
							var toDateAsPropertyString = makePropertyString(toDate);
							var toDateAsString = makeDateString(toDate);
							if(!kommonitorDataExchangeService.indicatorAndMetadataAsBalance.applicableDates.includes(toDateAsString)){
								toDateAsPropertyString = snapToNearestLowerDate(toDate, kommonitorDataExchangeService.indicatorAndMetadataAsBalance.applicableDates);
							}

							// make another copy of selectedIndicator to ensure that feature order matches each other
							kommonitorDataExchangeService.indicatorAndMetadataAsBalance = jQuery.extend(true, {}, kommonitorDataExchangeService.selectedIndicator);
							kommonitorDataExchangeService.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC";

							// set value of selected target property with the computed balance between toDate - FromDate
							for (var index=0; index < kommonitorDataExchangeService.selectedIndicator.geoJSON.features.length; index++){
								kommonitorDataExchangeService.indicatorAndMetadataAsBalance.geoJSON.features[index].properties[$scope.targetIndicatorProperty] = +Number(kommonitorDataExchangeService.selectedIndicator.geoJSON.features[index].properties[toDateAsPropertyString] - kommonitorDataExchangeService.selectedIndicator.geoJSON.features[index].properties[fromDateAsPropertyString]).toFixed(numberOfDecimals);
							}
							kommonitorDataExchangeService.indicatorAndMetadataAsBalance['fromDate'] = dateToDateString(fromDate);
							kommonitorDataExchangeService.indicatorAndMetadataAsBalance['toDate'] = dateToDateString(toDate);
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


					}]
				});
