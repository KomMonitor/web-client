angular
		.module('measureOfValueClassification')
		.component(
				'measureOfValueClassification',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/measureOfValueClassification/measure-of-value-classification.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'kommonitorDataExchangeService', '__env', function measureOfValueClassificationController($scope, $rootScope, kommonitorMapService, kommonitorDataExchangeService, __env) {

							const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
							this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
							this.kommonitorMapServiceInstance = kommonitorMapService;
							var numberOfDecimals = __env.numberOfDecimals;

							$scope.minValue;
							$scope.maxValue;
							$scope.middleValue;
							$scope.step;

							$scope.inputNotValid = false;


							this.onChangeUseMeasureOfValue = function(){
								kommonitorDataExchangeService.isBalanceChecked = false;
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
								var geoJSON = kommonitorDataExchangeService.selectedIndicator.geoJSON;

								var measureOfValueInput = document.getElementById("measureOfValueInput");

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

								$scope.minValue = +Number(values[0]).toFixed(numberOfDecimals);
								$scope.maxValue = +Number(values[values.length - 1]).toFixed(numberOfDecimals);

								$scope.middleValue = +(($scope.maxValue + $scope.minValue) / 2).toFixed(numberOfDecimals);
								$scope.step = +(($scope.maxValue - $scope.minValue)/35).toFixed(2);

								measureOfValueInput.setAttribute("min", $scope.minValue);
								measureOfValueInput.setAttribute("max", $scope.maxValue);
								measureOfValueInput.setAttribute("step", $scope.step);
								measureOfValueInput.setAttribute("value", $scope.middleValue);

								kommonitorDataExchangeService.measureOfValue = $scope.middleValue;

								var measureOfValueTextInput = document.getElementById("measureOfValueTextInput");
								measureOfValueTextInput.setAttribute("min", $scope.minValue);
								measureOfValueTextInput.setAttribute("max", $scope.maxValue);
								measureOfValueTextInput.setAttribute("value", $scope.middleValue);
								measureOfValueTextInput.setAttribute("step", $scope.step);

								$scope.inputNotValid = false;

							};

							this.onMeasureOfValueChange = function(){

								kommonitorDataExchangeService.measureOfValue = +Number(kommonitorDataExchangeService.measureOfValue).toFixed(numberOfDecimals);

								if(kommonitorDataExchangeService.measureOfValue >= $scope.minValue && kommonitorDataExchangeService.measureOfValue <= $scope.maxValue){
									$scope.inputNotValid = false;
									this.kommonitorMapServiceInstance.restyleCurrentLayer();
								}
								else{
									$scope.inputNotValid = true;
								}

							};

					}]
				});
