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
							$scope.targetUrlToReachabilityService_ORS = __env.targetUrlToReachabilityService_ORS;
							var numberOfDecimals = __env.numberOfDecimals;

							$scope.currentIsochronesGeoJSON;

							$scope.latitudeStart = 51.42055331;
							$scope.longitudeStart = 7.049869894;
							$scope.locationsArray = [[7.049869894,51.42055331]];
							$scope.rangeArray = [300,600,900];
							$scope.transitMode;
							$scope.reachMode;
							$scope.speedInMetersPerSecond;
							$scope.speedInKilometersPerHour;
							$scope.useMultipleStartPoints = false;

							$scope.loadingData = false;

							//"locations":[[7.049869894,51.42055331],[7.19869894,51.52055331]]
							//"locations":[[7.049869894,51.42055331]]
							var isochronesPOSTBody = {"locations":[[7.049869894,51.42055331]],"range":[300,600,900],"attributes":["area","reachfactor"],"intersections":"false","location_type":"start","range_type":"time","area_units":"m","units":"m"};

							$scope.runChildDemo = function(){

								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");

								$scope.transitMode = "Fußgänger (Kind)";
								// $scope.speedInMetersPerSecond = "0.833333";
								// $scope.speedInKilometersPerHour = Number($scope.speedInMetersPerSecond * 3600 / 1000).toFixed(0);
								$scope.reachMode = "Zeit";
								$scope.locationsArray = [[7.049869894,51.42055331]];
								$scope.rangeArray = [300,600,900];
								isochronesPOSTBody.locations = $scope.locationsArray;
								isochronesPOSTBody.range = $scope.rangeArray;
								$scope.useMultipleStartPoints = false;

								// http://localhost:8088/otp/routers/current/isochrone?algorithm=accSampling&fromPlace=51.44542,7.04468&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=1800&cutoffSec=3600

								var url = $scope.targetUrlToReachabilityService_ORS + "/v2/isochrones/foot-walking";

								var req = {
									 method: 'POST',
									 url: url,
									 headers: {
									   // 'Accept': 'application/json'
									 },
									 data: isochronesPOSTBody
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, $scope.rangeArray, $scope.useMultipleStartPoints);
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

							$scope.runPedestrianDemo = function(){

								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");

								$scope.transitMode = "Fußgänger";
								// $scope.speedInMetersPerSecond = "0.833333";
								// $scope.speedInKilometersPerHour = Number($scope.speedInMetersPerSecond * 3600 / 1000).toFixed(0);
								$scope.reachMode = "Zeit";
								$scope.locationsArray = [[7.049869894,51.42055331]];
								$scope.rangeArray = [300,600,900];
								isochronesPOSTBody.locations = $scope.locationsArray;
								isochronesPOSTBody.range = $scope.rangeArray;
								$scope.useMultipleStartPoints = false;

								// http://localhost:8088/otp/routers/current/isochrone?algorithm=accSampling&fromPlace=51.44542,7.04468&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=1800&cutoffSec=3600

								var url = $scope.targetUrlToReachabilityService_ORS + "/v2/isochrones/foot-walking";

								var req = {
									 method: 'POST',
									 url: url,
									 headers: {
										 // 'Accept': 'application/json'
									 },
									 data: isochronesPOSTBody
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, $scope.rangeArray, $scope.useMultipleStartPoints);
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
								// $scope.speedInMetersPerSecond = "0.833333";
								// $scope.speedInKilometersPerHour = Number($scope.speedInMetersPerSecond * 3600 / 1000).toFixed(0);
								$scope.reachMode = "Zeit";
								$scope.locationsArray = [[7.049869894,51.42055331]];
								$scope.rangeArray = [300,600,900];
								isochronesPOSTBody.locations = $scope.locationsArray;
								isochronesPOSTBody.range = $scope.rangeArray;
								$scope.useMultipleStartPoints = false;

								// http://localhost:8088/otp/routers/current/isochrone?algorithm=accSampling&fromPlace=51.44542,7.04468&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=1800&cutoffSec=3600

								var url = $scope.targetUrlToReachabilityService_ORS + "/v2/isochrones/cycling-regular";

								var req = {
									 method: 'POST',
									 url: url,
									 headers: {
										 // 'Accept': 'application/json'
									 },
									 data: isochronesPOSTBody
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, $scope.rangeArray, $scope.useMultipleStartPoints);
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
								// $scope.speedInMetersPerSecond = "0.833333";
								// $scope.speedInKilometersPerHour = Number($scope.speedInMetersPerSecond * 3600 / 1000).toFixed(0);
								$scope.reachMode = "Zeit";
								$scope.locationsArray = [[7.049869894,51.42055331]];
								$scope.rangeArray = [300,600,900];
								isochronesPOSTBody.locations = $scope.locationsArray;
								isochronesPOSTBody.range = $scope.rangeArray;
								$scope.useMultipleStartPoints = false;

								// http://localhost:8088/otp/routers/current/isochrone?algorithm=accSampling&fromPlace=51.44542,7.04468&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=1800&cutoffSec=3600

								var url = $scope.targetUrlToReachabilityService_ORS + "/v2/isochrones/driving-car";

								var req = {
									 method: 'POST',
									 url: url,
									 headers: {
										 // 'Accept': 'application/json'
									 },
									 data: isochronesPOSTBody
								 }

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, $scope.rangeArray, $scope.useMultipleStartPoints);
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

							$scope.runBicycleDemoWithMultipleStartPoints = function(){

								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");

								$scope.transitMode = "Fahrrad";
								// $scope.speedInMetersPerSecond = "0.833333";
								// $scope.speedInKilometersPerHour = Number($scope.speedInMetersPerSecond * 3600 / 1000).toFixed(0);
								$scope.reachMode = "Zeit";
								$scope.locationsArray = [[7.049869894,51.42055331],[7.0115552,51.4386432]];
								$scope.rangeArray = [300,600,900];
								isochronesPOSTBody.locations = $scope.locationsArray;
								isochronesPOSTBody.range = $scope.rangeArray;
								$scope.useMultipleStartPoints = true;

								// http://localhost:8088/otp/routers/current/isochrone?algorithm=accSampling&fromPlace=51.44542,7.04468&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=1800&cutoffSec=3600

								var url = $scope.targetUrlToReachabilityService_ORS + "/v2/isochrones/cycling-regular";

								var req = {
									 method: 'POST',
									 url: url,
									 headers: {
										 // 'Accept': 'application/json'
									 },
									 data: isochronesPOSTBody
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, $scope.rangeArray, $scope.useMultipleStartPoints);
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

							$scope.runPedestrianKitaRellinghausenDemoWithMultipleStartPoints = function(){

								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");

								$scope.transitMode = "Fußgänger";
								// $scope.speedInMetersPerSecond = "0.833333";
								// $scope.speedInKilometersPerHour = Number($scope.speedInMetersPerSecond * 3600 / 1000).toFixed(0);
								$scope.reachMode = "Zeit";
								// $scope.locationsArray = [[7.049869894,51.42055331],[7.0394219,51.4232979],[7.040197,51.4254453]];
								$scope.locationsArray = [[7.049869894,51.42055331],[7.0382865,51.4234454],[7.0403425,51.4258269]];
								$scope.rangeArray = [300,600,900];
								isochronesPOSTBody.locations = $scope.locationsArray;
								isochronesPOSTBody.range = $scope.rangeArray;
								$scope.useMultipleStartPoints = true;

								// http://localhost:8088/otp/routers/current/isochrone?algorithm=accSampling&fromPlace=51.44542,7.04468&date=2018/10/01&time=12:00:00&mode=WALK&cutoffSec=1800&cutoffSec=3600

								var url = $scope.targetUrlToReachabilityService_ORS + "/v2/isochrones/foot-walking";

								var req = {
									 method: 'POST',
									 url: url,
									 headers: {
										 // 'Accept': 'application/json'
									 },
									 data: isochronesPOSTBody
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, $scope.rangeArray, $scope.useMultipleStartPoints);
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
