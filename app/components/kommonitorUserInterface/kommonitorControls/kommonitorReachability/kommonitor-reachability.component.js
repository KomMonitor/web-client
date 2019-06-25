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
							$scope.reachProfile;
							$scope.reachMode;
							$scope.speedInKilometersPerHour;
							$scope.useMultipleStartPoints = false;

							$scope.loadingData = false;

							//"locations":[[7.049869894,51.42055331],[7.19869894,51.52055331]]
							//"locations":[[7.049869894,51.42055331]]
							var isochronesGETParameter = "profile=foot-walking&units=m&location_type=start&locations=7.268504,51.448405&range_type=time&range=300,600,900&attributes=area|reachfactor&options={'maximum_speed':3}";

							var createORSIsochroneRequest = function(reachProfile, locationsArray, rangeArray, speedInKilometersPerHour){
								var locationsString = "";
								for (var index=0; index<locationsArray.length; index++){
									//element looks like [longitude,latitude]
									locationsString += locationsArray[index][0] + "," + locationsArray[index][1];
									if(index != locationsArray.length - 1){
										// encode pipe symbol "|" manually
										locationsString += "%7C";
									}
								};

								var rangeString = "";
								for (var i=0; i<rangeArray.length; i++){
									rangeString += rangeArray[i];
									if(i != rangeArray.length - 1){
										rangeString += ",";
									}
								};

								var optionsString = '{"maximum_speed":' + speedInKilometersPerHour + '}';

								// var constantParameters = "&units=m&location_type=start&range_type=time";
								// encode pipe symbol manually via %7C
								var constantParameters = "&units=m&location_type=start&range_type=time&attributes=area%7Creachfactor";

								var getRequest = $scope.targetUrlToReachabilityService_ORS + "/isochrones?profile=" + reachProfile + "&locations=" + locationsString + "&range=" + rangeString + constantParameters + "&options=" + encodeURIComponent(optionsString);

																// var getRequest = $scope.targetUrlToReachabilityService_ORS + "/isochrones?profile=" + reachProfile + "&locations=" + encodeURIComponent(locationsString) + "&range=" + rangeString + constantParameters;
								console.log(getRequest);
								return getRequest;
							}

							$scope.runChildDemoHolthausen = function(){

								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");

								$scope.transitMode = "Fußgänger (Kind)";
								$scope.reachProfile = "foot-walking";
								$scope.speedInKilometersPerHour = 3;
								$scope.reachMode = "Zeit";
								$scope.locationsArray = [[8.87997, 51.40330], [6.88013, 51.41958], [6.90614, 51.42382]];
								$scope.rangeArray = [300,600,900];
								$scope.useMultipleStartPoints = true;

								var url = createORSIsochroneRequest_byTime($scope.reachProfile, $scope.locationsArray, $scope.rangeArray, $scope.speedInKilometersPerHour);

								var req = {
									 method: 'GET',
									 url: url,
									 headers: {
									   // 'Accept': 'application/json'
									 }
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, $scope.rangeArray, $scope.useMultipleStartPoints);
										$scope.prepareDownloadGeoJSON();
										$scope.loadingData = false;
										kommonitorDataExchangeService.isochroneLegend.cutOffUnit = "Sekunden";
										$rootScope.$broadcast("hideLoadingIconOnMap");

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
								});
							};

							$scope.runEqualDistanceDemoHolthausen = function(){

								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");

								$scope.transitMode = "Fußgänger";
								$scope.reachProfile = "foot-walking";
								$scope.speedInKilometersPerHour = 5;
								$scope.reachMode = "Äquidistanz";
								$scope.locationsArray = [[8.87997, 51.40330], [6.88013, 51.41958], [6.90614, 51.42382]];
								$scope.rangeArray = [1500];
								$scope.useMultipleStartPoints = true;

								var url = createORSIsochroneRequest_byDistance($scope.reachProfile, $scope.locationsArray, $scope.rangeArray, $scope.speedInKilometersPerHour);

								var req = {
									 method: 'GET',
									 url: url,
									 headers: {
									   // 'Accept': 'application/json'
									 }
									}

								$http(req).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available
										$scope.currentIsochronesGeoJSON = response.data;

										kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
										kommonitorMapService.replaceIsochroneGeoJSON($scope.currentIsochronesGeoJSON, $scope.transitMode, $scope.reachMode, $scope.rangeArray, $scope.useMultipleStartPoints);
										$scope.prepareDownloadGeoJSON();
										$scope.loadingData = false;
										kommonitorDataExchangeService.isochroneLegend.cutOffUnit = "Meter";
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
