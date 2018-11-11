angular
		.module('regressionDiagram')
		.component(
				'regressionDiagram',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/regressionDiagram/regression-diagram.template.html",

					controller : [
							'kommonitorDataExchangeService', '$scope', '$http',
							function indicatorRadarController(
									kommonitorDataExchangeService, $scope, $http) {
								/*
								 * reference to kommonitorDataExchangeService instances
								 */
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

								const DATE_PREFIX = "DATE_";

								//$scope.allIndicatorProperties;
								$scope.selectedIndicatorForXAxis;
								$scope.selectedIndicatorForYAxis;
								$scope.correlation;
								$scope.linearRegression;

								$scope.date;
								$scope.spatialUnitName;

								$scope.onChangeSelectedIndicators = function(){
									if($scope.selectedIndicatorForXAxis && $scope.selectedIndicatorForYAxis){

										

										$scope.linearRegression = ecStat.regression('linear', data);

										myRegression.points.sort(function(a, b) {
										    return a[0] - b[0];
										});
									}
								}


							} ]
				});
