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
							$scope.latitudeStart = 51.4531655;
							$scope.longitudeStart = 7.0250244;
							$scope.transitMode;
							$scope.reachMode;

							$scope.loadingData = false;

							var constantUrlQueryParamsForDemo = "&algorithm=accSampling&fromPlace=51.4531655,7.0250244&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=300&cutoffSec=600&cutoffSec=900&cutoffSec=1200&cutoffSec=1500"

							$scope.runPedestrianDemo = function(){

								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");

								$scope.transitMode = "Fußgänger";
								$scope.reachMode = "Zeit";

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

										kommonitorMapService.replaceIsochroneMarker($scope.latitudeStart, $scope.longitudeStart);

										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, ["5", "10", "15", "20", "25"], "Minuten");
										$scope.prepareDownloadGeoJSON();
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
								$rootScope.$broadcast("showLoadingIconOnMap");

								$scope.transitMode = "Fahrrad";
								$scope.reachMode = "Zeit";
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

										kommonitorMapService.replaceIsochroneMarker($scope.latitudeStart, $scope.longitudeStart);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, ["5", "10", "15", "20", "25"], "Minuten");
										$scope.prepareDownloadGeoJSON();
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
								$rootScope.$broadcast("showLoadingIconOnMap");
								
								$scope.transitMode = "Auto";
								$scope.reachMode = "Zeit";

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

										kommonitorMapService.replaceIsochroneMarker($scope.latitudeStart, $scope.longitudeStart);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, ["5", "10", "15", "20", "25"], "Minuten");
										$scope.prepareDownloadGeoJSON();
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
								});
							};

							$scope.removeReachabilityLayers = function(){
								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");

								kommonitorMapService.removeReachabilityLayers();
								$scope.currentIsochronesGeoJSON = undefined;
								$scope.loadingData = false;
								$rootScope.$broadcast("hideLoadingIconOnMap");
							};

							$scope.prepareDownloadGeoJSON = function(){

								console.log("removing old download button if available")
								if(document.getElementById("downloadReachabilityIsochrones"))
									document.getElementById("downloadReachabilityIsochrones").remove();

								var geoJSON_string = JSON.stringify($scope.currentIsochronesGeoJSON);

								var fileName = "Erreichbarkeitsisochronen_via-" + $scope.transitMode + "_Abbruchkriterium-" + $scope.reachMode + ".geojson";

								var blob = new Blob([geoJSON_string], {type: "application/json"});
								var data  = URL.createObjectURL(blob);

								console.log("create new Download button and append it to DOM");
								var a = document.createElement('a');
								a.download    = fileName;
								a.href        = data;
								a.textContent = "Download Isochronen als GeoJSON";
								a.id = "downloadReachabilityIsochrones";
								a.setAttribute("class", "btn btn-info");

								document.getElementById('reachabilityButtonSection').appendChild(a);
							};

							// $scope.downloadGeoJSON = function(){
							//
							// 	var geoJSON_string = JSON.stringify($scope.computedCustomizedIndicatorGeoJSON);
							//
							// 	filename = $scope.targetIndicator.indicatorName + "_" + $scope.targetSpatialUnit.spatialUnitLevel + "_" + $scope.targetDate + "_CUSTOM.geojson";
							//
							// 	if (!geoJSON_string.match(/^data:application\/vnd.geo+json/i)) {
							// 		geoJSON_string = 'data:application/vnd.geo+json;charset=utf-8,' + geoJSON_string;
							// 	}
							// 	data = encodeURI(geoJSON_string);
							//
							// 	link = document.createElement('a');
							// 	link.setAttribute('href', data);
							// 	link.setAttribute('download', filename);
							//
							// 	document.body.appendChild(link);
							//
							// 	console.log("Trigger download");
							//
							// 	link.click();
							// }


					}]
				});
