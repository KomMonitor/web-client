angular
		.module('kommonitorFilter')
		.component(
				'kommonitorFilter',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorFilter/kommonitor-filter.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'kommonitorDataExchangeService', '__env', function kommonitorFilterController($scope, $rootScope, kommonitorMapService, kommonitorDataExchangeService, __env) {

							const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
							this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
							this.kommonitorMapServiceInstance = kommonitorMapService;
							var numberOfDecimals = __env.numberOfDecimals;

							$scope.rangeSliderForFilter;
							$scope.currentRangeStartPosition;
							$scope.currentRangeEndPosition;

							$scope.maxNumberOfSliderItems = 8;


							$scope.$on("updateIndicatorValueRangeFilter", function (event, date) {

									$scope.setuprangeSliderForFilter(date);

							});

							$scope.makeInputItems = function(geoJSON, date){
								var values = [];

								geoJSON.features.forEach(function(feature){
									var item = {};

									var value = +Number(feature.properties[date]).toFixed(numberOfDecimals);

									item.key = value;
									item.value = value;

									values.push(item);
								});

								//sort ascending order
								values.sort(function(a, b){return a.key-b.key});

								var difference = values[values.length-1].key - values[0].key;
								var step = difference / $scope.maxNumberOfSliderItems;

								var items = [];
								items.push(values[0]);
								for(var index=0; index <= $scope.maxNumberOfSliderItems - 2; index++){
									var newItem = {};

									newItem.key = +Number(items[items.length-1].key + step).toFixed(numberOfDecimals);
									newItem.value = newItem.key;

									items.push(newItem);
								}
								items.push(values[values.length-1]);

								return items;
							};

							$scope.setuprangeSliderForFilter = function(date){
								date = INDICATOR_DATE_PREFIX + date;
								var domNode = document.getElementById("rangeSliderForFiltering");

								while (domNode.hasChildNodes()) {
									domNode.removeChild(domNode.lastChild);
								}

								var geoJSON = kommonitorDataExchangeService.selectedIndicator.geoJSON;

								var items = $scope.makeInputItems(geoJSON, date);

								$scope.currentRangeStartPosition = 0;
								$scope.currentRangeEndPosition = items.length - 1;
								$scope.rangeSliderForFilter = rangeslide("#rangeSliderForFiltering", {
									data: items,
									startPosition: $scope.currentRangeStartPosition,
									endPosition: $scope.currentRangeEndPosition,
									thumbWidth: 20,
									thumbHeight: 36,
									labelsPosition: "alternate",
									showLabels: true,
									startAlternateLabelsFromTop: false,
									trackHeight: 5,
									showTicks: false,
									showTrackMarkers: true,
									showTrackMarkersProgress: true,
									showTrackProgress: true,
									markerSize: 12,
									tickHeight: 0,
									slideMode: "free",
									valuePosition: "above",
									valueIndicatorWidth: 60,
									valueIndicatorHeight: 20,
									highlightSelectedLabels: true,
									dataSource: "key",
									labelsContent: "key",
									valueIndicatorContent: "key",
									showValue: true,
									mode: "range",
									handlers: {
										"valueChanged": [onChangeValueRange]
									}
								});

							};

							var onChangeValueRange = async function(dataItem, rangeslideElement){

									console.log("Change selected indicator value range");

									// $scope.currentRangeStartPosition = 0;
									// $scope.currentRangeEndPosition = 1;

									//TODO
							};

							var wait = ms => new Promise((r, j)=>setTimeout(r, ms))

							$scope.$on("refreshIndicatorValueRangeSlider", async function (event) {

									await wait(100);

									if($scope.dateSlider){
										$scope.resetIndicatorValueRangeSlider();

									}

							});

							$scope.resetIndicatorValueRangeSlider = function(){

								if($scope.rangeSliderForFilter){
									$scope.rangeSliderForFilter.destroy();
								}

								var date = INDICATOR_DATE_PREFIX + kommonitorDataExchangeService.selectedDate;
								var domNode = document.getElementById("rangeSliderForFiltering");

								while (domNode.hasChildNodes()) {
									domNode.removeChild(domNode.lastChild);
								}

								var geoJSON = kommonitorDataExchangeService.selectedIndicator.geoJSON;

								var items = $scope.makeInputItems(geoJSON, date);

								$scope.currentRangeStartPosition = 0;
								$scope.currentRangeEndPosition = values.length - 1;

								$scope.rangeSliderForFilter = rangeslide("#rangeSliderForFiltering", {
									data: items,
									startPosition: $scope.currentRangeStartPosition,
									endPosition: $scope.currentRangeEndPosition,
									thumbWidth: 20,
									thumbHeight: 36,
									labelsPosition: "alternate",
									showLabels: true,
									startAlternateLabelsFromTop: false,
									trackHeight: 5,
									showTicks: false,
									showTrackMarkers: true,
									showTrackMarkersProgress: true,
									showTrackProgress: true,
									markerSize: 12,
									tickHeight: 0,
									slideMode: "free",
									valuePosition: "above",
									valueIndicatorWidth: 60,
									valueIndicatorHeight: 20,
									highlightSelectedLabels: true,
									dataSource: "key",
									labelsContent: "key",
									valueIndicatorContent: "key",
									showValue: true,
									mode: "range",
									handlers: {
										"valueChanged": [onChangeValueRange]
									}
								});
							};



					}]
				});
