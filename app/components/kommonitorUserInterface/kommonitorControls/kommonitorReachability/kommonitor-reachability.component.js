angular
		.module('kommonitorReachability')
		.component(
				'kommonitorReachability',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/kommonitor-reachability.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', '$http', 'kommonitorMapService', 'kommonitorDataExchangeService', '__env',
						function kommonitorReachabilityController($scope, $rootScope, $http, kommonitorMapService, kommonitorDataExchangeService, __env) {

							const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
							this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
							this.kommonitorMapServiceInstance = kommonitorMapService;
							$scope.targetUrlToReachabilityService = __env.targetUrlToReachabilityService;
							var numberOfDecimals = __env.numberOfDecimals;

							$scope.currentIsochronesGeoJSON;
							$scope.fromPlace = "51.4531655, 7.0250244";

							$scope.loadingData = false;

							var constantUrlQueryParamsForDemo = "&algorithm=accSampling&fromPlace=51.4531655,7.0250244&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=300&cutoffSec=600&cutoffSec=900&cutoffSec=1200&cutoffSec=1500"

							$scope.runPedestrianDemo = function(){

								$scope.loadingData = true;

								// http://localhost:8088/otp/routers/current/isochrone?algorithm=accSampling&fromPlace=51.44542,7.04468&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=1800&cutoffSec=3600

								var url = $scope.targetUrlToReachabilityService + "/isochrone?mode=WALK" + constantUrlQueryParamsForDemo;

								var req = {
									 method: 'GET',
									 url: url,
									 headers: {
									   'Accept': 'application/json'
									 }
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, "Fußgänger", "Zeit", ["5", "10", "15", "20", "25"], "Minuten");
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
								});
							};

							$scope.runBicycleDemo = function(){

								$scope.loadingData = true;

								// http://localhost:8088/otp/routers/current/isochrone?algorithm=accSampling&fromPlace=51.44542,7.04468&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=1800&cutoffSec=3600

								var url = $scope.targetUrlToReachabilityService + "/isochrone?mode=BICYCLE" + constantUrlQueryParamsForDemo;

								var req = {
									 method: 'GET',
									 url: url,
									 headers: {
									   'Accept': 'application/json'
									 }
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, "Fahrrad", "Zeit", ["5", "10", "15", "20", "25"], "Minuten");
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
								});
							};

							$scope.runCarDemo = function(){

								$scope.loadingData = true;

								// http://localhost:8088/otp/routers/current/isochrone?algorithm=accSampling&fromPlace=51.44542,7.04468&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=1800&cutoffSec=3600

								var url = $scope.targetUrlToReachabilityService + "/isochrone?mode=CAR" + constantUrlQueryParamsForDemo;

								var req = {
									 method: 'GET',
									 url: url,
									 headers: {
									   'Accept': 'application/json'
									 }
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, "Auto", "Zeit", ["5", "10", "15", "20", "25"], "Minuten");
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
								});
							};


					}]
				});
