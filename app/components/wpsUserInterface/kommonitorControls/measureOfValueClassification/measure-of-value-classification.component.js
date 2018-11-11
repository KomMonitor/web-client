angular
		.module('measureOfValueClassification')
		.component(
				'measureOfValueClassification',
				{
					templateUrl : "components/wpsUserInterface/kommonitorControls/measureOfValueClassification/measure-of-value-classification.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'wpsPropertiesService', function measureOfValueClassificationController($scope, $rootScope, kommonitorMapService, wpsPropertiesService) {

							const INDICATOR_DATE_PREFIX = "DATE_";
							this.wpsPropertiesServiceInstance = wpsPropertiesService;
							this.kommonitorMapServiceInstance = kommonitorMapService;

							$scope.minValue;
							$scope.maxValue;
							$scope.middleValue;
							$scope.step;

							$scope.inputNotValid = false;


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

								this.kommonitorMapServiceInstance.restyleCurrentLayer();

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
								$scope.minValue = sampleFeature.properties[date];
								$scope.maxValue = sampleFeature.properties[date];

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

								// for minValue we need to find the fifth lowest value
								// in order to use classyBrew classification lib properly
								// and ensure that minimum measureOfValue will guarantee that there are
								// four lower values for three classes!
								var counterToFive = 0;

								for(var i=0; i<values.length; i++){
									if(values[i] != null && Number(values[i]) > 0){
										counterToFive++;

										if(counterToFive === 5){
											// plus sign turn it into a number again and removes tailing 0s
											$scope.minValue = +values[i].toFixed(4);
										}
									}

								}

								// plus sign turn it into a number again and removes tailing 0s
								// minValue = +values[4].toFixed(4);
								$scope.maxValue = +values[values.length - 4].toFixed(4);

								$scope.middleValue = +(($scope.maxValue + $scope.minValue) / 2).toFixed(4);
								// $scope.step = +($scope.maxValue/values.length).toFixed(4);
								$scope.step = 1;

								measureOfValueInput.setAttribute("min", $scope.minValue);
								measureOfValueInput.setAttribute("max", $scope.maxValue);
								measureOfValueInput.setAttribute("step", $scope.step);
								measureOfValueInput.setAttribute("value", $scope.middleValue);

								wpsPropertiesService.measureOfValue = $scope.middleValue;

								var measureOfValueTextInput = document.getElementById("measureOfValueTextInput");
								measureOfValueTextInput.setAttribute("min", $scope.minValue);
								measureOfValueTextInput.setAttribute("max", $scope.maxValue);
								measureOfValueTextInput.setAttribute("value", $scope.middleValue);
								measureOfValueTextInput.setAttribute("step", $scope.step);

								$scope.inputNotValid = false;

							};

							this.onMeasureOfValueChange = function(){

								if(wpsPropertiesService.measureOfValue >= $scope.minValue && wpsPropertiesService.measureOfValue <= $scope.maxValue){
									$scope.inputNotValid = false;
									this.kommonitorMapServiceInstance.restyleCurrentLayer();
								}
								else{
									$scope.inputNotValid = true;
								}

							};

					}]
				});
