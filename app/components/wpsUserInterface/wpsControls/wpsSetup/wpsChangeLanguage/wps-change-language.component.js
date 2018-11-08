angular
		.module('wpsChangeLanguage')
		.component(
				'wpsChangeLanguage',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsSetup/wpsChangeLanguage/wps-change-language.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', 'wpsMapService', 'wpsPropertiesService', function WpsChangeLanguageController($scope, $rootScope, wpsMapService, wpsPropertiesService) {

							const INDICATOR_DATE_PREFIX = "DATE_";
							this.wpsPropertiesServiceInstance = wpsPropertiesService;
							this.wpsMapServiceInstance = wpsMapService;

							this.onChangeUseMeasureOfValue = function(){
								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");

								console.log("Change UseMeasureOfValue");

								// try{
								// 	var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
								// }
								// catch(error){
								// 	console.error(error);
								// 	$scope.loadingData = false;
								// 	return;
								// }

								// $scope.modifyComponentsForCurrentIndicatorTimestampAndSpatialUnit();
							//	$scope.addSelectedIndicatorToMap();

								this.wpsMapServiceInstance.restyleCurrentLayer();

								$scope.loadingData = false;
								$rootScope.$broadcast("hideLoadingIconOnMap");
								//$scope.$apply();
							};

							$scope.$on("updateMeasureOfValueBar", function (event, date) {

									$scope.updateMeasureOfValueBar(date);

							});

							$scope.updateMeasureOfValueBar = function(date){

								//append date prefix to access correct property!
								date = INDICATOR_DATE_PREFIX + date;
								var geoJSON = wpsPropertiesService.selectedIndicator.geoJSON;

								var measureOfValueInput = document.getElementById("measureOfValueInput");

								// <input ng-model="$ctrl.wpsPropertiesServiceInstance.measureOfValue" ng-change="$ctrl.onMeasureOfValueChange()" type="range" min="0" max="100" step="1" value="51" class="slider" id="measureOfValueInput">
								var sampleFeature = geoJSON.features[0];
								var minValue = sampleFeature.properties[date];
								var maxValue = sampleFeature.properties[date];
								var middleValue;
								var step;

								var values = [];

								geoJSON.features.forEach(function(feature){
									// if (feature.properties[date] > maxValue)
									// 	maxValue = feature.properties[date];
									//
									// else if (feature.properties[date] < minValue)
									// 	minValue = feature.properties[date];

									values.push(feature.properties[date]);
								});

								//sort ascending order
								values.sort(function(a, b){return a-b});

								// plus sign turn it into a number again and removes tailing 0s
								minValue = +values[4].toFixed(4);
								maxValue = +values[values.length - 4].toFixed(4);

								middleValue = +((maxValue + minValue) / 2).toFixed(4);
								step = +(maxValue/values.length).toFixed(4);

								measureOfValueInput.setAttribute("min", minValue);
								measureOfValueInput.setAttribute("max", maxValue);
								measureOfValueInput.setAttribute("step", step);
								measureOfValueInput.setAttribute("value", middleValue);

								wpsPropertiesService.measureOfValue = middleValue;

							};

							this.onMeasureOfValueChange = function(){
								this.wpsMapServiceInstance.restyleCurrentLayer();
							};

					}]
				});
