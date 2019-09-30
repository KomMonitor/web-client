angular
	.module('kommonitorReachability')
	.component(
		'kommonitorReachability', {
			templateUrl: 'components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/kommonitor-reachability.template.html',
			/*
			 * injected with a modules service method that manages
			 * enabled tabs
			 */
			controller: [
				'$scope',
				'$rootScope',
				'$http',
				'kommonitorMapService',
				'kommonitorDataExchangeService',
				'__env',
				/**
				 * TODO
				 */
				function kommonitorReachabilityController($scope,
					$rootScope, $http, kommonitorMapService,
					kommonitorDataExchangeService, __env) {
					
					//$("[data-toggle=tooltip]").tooltip();

					const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
					this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
					this.kommonitorMapServiceInstance = kommonitorMapService;
					$scope.targetUrlToReachabilityService_ORS = __env.targetUrlToReachabilityService_ORS;
					var numberOfDecimals = __env.numberOfDecimals;

					$scope.currentIsochronesGeoJSON = undefined;
					$scope.currentRouteGeoJSON = undefined;

					/**
					 * Show the isochrone-calculation-div if this
					 * value is set to 'true', if the value is set
					 * to 'false' the routing between different
					 * points shall be displayed.
					 */
					$scope.showIsochrones = true;

					/**
					 * TODO : Folgende drei Variablen werden fuer den
					 * Produktivbetrieb eigentlich nicht benoetigt,
					 * oder?
					 */
					$scope.locationsArray = [[7.049869894,51.42055331]];
					
					/**
					 * Values used in the GUI (initial).
					 */
					$scope.latitudeStart = 51.42055331;
					$scope.longitudeStart = 7.049869894;
					$scope.latitudeEnd = 51.42055331+0.05;
					$scope.longitudeEnd = 7.049869894+0.05;
					$scope.startArray = $scope.longitudeStart+','+$scope.latitudeStart;
					$scope.endArray = $scope.longitudeEnd+','+$scope.latitudeEnd;

					/**
					 * The range array (for isochrone calculation)
					 * prefilled with dummy-values. TODO : Werte und
					 * Variable behalten, oder im Grunde dann nicht
					 * mehr benoetigt?
					 */
					$scope.rangeArray = [300, 600, 900];

					/**
					 * Variable to save the keywords used by the
					 * routing API. Valid values are: 
					 * driving-car
					 * driving-hgv // LKW 
					 * cycling-regular
					 * cycling-road 
					 * cycling-safe 
					 * cycling-mountain
					 * cycling-tour 
					 * cycling-electric 
					 * foot-walking
					 * foot-hiking 
					 * wheelchair
					 */
					$scope.transitMode = 'foot-walking';

					/**
					 * The focus of the analysis. Valid values are:
					 * 'distance' and 'time'. TODO : Starke
					 * Ueberschneidung mit der Variablen 'focus',
					 * die im Grunde genau das gleiche speichert.
					 */
					$scope.focus = 'distance';

					/**
					 * The analysis speed (for the current vehicle)
					 * in km/h.
					 */
					$scope.speedInKilometersPerHour = 3;

					/**
					 * Indicator if multiple starting-points shall
					 * be used.
					 */
					$scope.useMultipleStartPoints = false;

					/**
					 * Flag indicating if data is loading /
					 * calculations are in progress. Used to set the
					 * GUI on 'standby' until the progress is
					 * completed.
					 */
					$scope.loadingData = false;

					/**
					 * The calculation unit-indicator.
					 */
					$scope.unit = 'm';

					/**
					 * Stores the minimal speed in km/h for the
					 * currently chosen vehicle.
					 */
					$scope.minSpeedInKilometersPerHour = 3;

					/**
					 * Stores the maximum speed in km/h for the
					 * currently chosen vehicle.
					 */
					$scope.maxSpeedInKilometersPerHour = 6;

					/**
					 * The maximum distance or time for the current
					 * vehicle. The unit of the stored value can be
					 * found in the variable 'unit'.
					 */
					$scope.max_value = 5000;

					/**
					 * The current time-or-distance value of the
					 * analysis. The unit of the stored value can be
					 * found in the variable 'unit'. This value
					 * represents value of the slider in the GUI and
					 * handed to the routing API.
					 */
					$scope.currentTODValue = 1;
					
					/**
					 * Variable that stores 'true' if the speed-selection
					 * shall be shown or 'false' if not.
					 */
					$scope.isTime = false;
					
					/**
					 * Specifies the route preference.
					 * 
					 * Allowed values are:
					 * - "fastest"
					 * - "shortest"
					 * - "recommended"
					 */
					$scope.preference = "fastest";
					
					/*
					 * TODO : MUSS NOCH ENTFERNT / ERSETZT
					 * WERDEN
					 */
					$scope.locationsArray = [
						[7.049869894, 51.42055331],
						[7.0382865, 51.4234454],
						[7.0403425, 51.4258269]
					];

					/**
					 * TODO
					 */
					var isochronesGETParameter = 'profile=foot-walking&units=m&location_type=start&locations=7.268504,51.448405&range_type=time&range=300,600,900&attributes=area|reachfactor&options={"maximum_speed":3}';

					/**
					 * TODO
					 */
					var createRoutingRequest = function(transitMode, preference, startArray, endArray){
						var locString = startArray+'%7C'+endArray;
						var getRequest = $scope.targetUrlToReachabilityService_ORS
							+ '/routes?'
							+ 'coordinates=' + locString
							+ '&profile='+transitMode
							+ '&preference='+preference
							+ '&units='+'m'
							+ '&language='+'de';
						
						//console.log(getRequest);
						
						return getRequest;
					}
					
					/**
					 * TODO
					 */
					var createORSIsochroneRequest = function(transitMode, locationsArray, rangeArray, speedInKilometersPerHour) {
						var locationsString = '';
						for (var index = 0; index < locationsArray.length; index++) {
							// element looks like
							// [longitude,latitude]
							locationsString += locationsArray[index][0] + ',' + locationsArray[index][1];
							if (index != locationsArray.length - 1) {
								// encode pipe symbol '|' manually
								locationsString += '%7C';
							}
						};

						var rangeString = '';
							for (var i = 0; i < rangeArray.length; i++) {
								var cValue = rangeArray[i];
								
								// CALCULATE SECONDS FROM MINUTE VALUES IF TIME-ANALYSIS IS WANTED
								if($scope.focus=='time')
									cValue = cValue*60;
								rangeString += cValue;
								
								if (i != rangeArray.length - 1) {
									rangeString += ',';
								}
							};

						var optionsString = '{"maximum_speed":' + speedInKilometersPerHour + '}';

						// var constantParameters = '&units=m&location_type=start&range_type=time';
						// encode pipe symbol manually via %7C
						
						var constantParameters = '&units=m&location_type=start&range_type=' +
								$scope.focus+'&attributes=area%7Creachfactor';

						var getRequest = $scope.targetUrlToReachabilityService_ORS +
							'/isochrones?profile=' +
							transitMode +
							'&locations=' +
							locationsString +
							'&range=' +
							rangeString +
							constantParameters +
							'&options=' +
							encodeURIComponent(optionsString);

						console.log(getRequest);
						return getRequest;
					}

					/**
					 * TODO
					 */
					$scope.removeReachabilityLayers = function() {
						$scope.loadingData = true;
						$rootScope
							.$broadcast('showLoadingIconOnMap');

						kommonitorMapService
							.removeReachabilityLayers();
						$scope.currentIsochronesGeoJSON = undefined;
						$scope.loadingData = false;
						$rootScope
							.$broadcast('hideLoadingIconOnMap');
					};

					/**
					 * TODO
					 */
					$scope.prepareDownloadGeoJSON = function() {
						console
							.log('removing old download button if available')
						if (document
							.getElementById('downloadReachabilityIsochrones'))
							document
							.getElementById(
								'downloadReachabilityIsochrones')
							.remove();

						var geoJSON_string = JSON
							.stringify($scope.currentIsochronesGeoJSON);

						var fileName = 'Erreichbarkeitsisochronen_via-' +
							$scope.transitMode +
							'_Abbruchkriterium-' +
							$scope.focus + '.geojson';

						var blob = new Blob([geoJSON_string], {
							type: 'application/json'
						});
						var data = URL.createObjectURL(blob);

						console
							.log('create new Download button and append it to DOM');
						var a = document.createElement('a');
						a.download = fileName;
						a.href = data;
						a.textContent = 'Download Isochronen als GeoJSON';
						a.id = 'downloadReachabilityIsochrones';
						a.setAttribute('class', 'btn btn-info');

						document.getElementById(
								'reachabilityButtonSection')
							.appendChild(a);
					};

					/**
					 * Dummy function.
					 */
					$scope.TODO = function() {
						alert('Funktion wurde noch nicht implementiert!');
					};

					/**
					 * Changes the focus of the analysis between
					 * distance and time.
					 */
					$scope.changeFocus = function() {
						$scope.resetSlider();
						
						if ($scope.focus=='distance') 
							$scope.isTime=false;
						if ($scope.focus=='time') 
							$scope.isTime=true;

						$scope.changeMinMaxSpeed();
						$scope.changeValues();
					};

					/**
					 * Resets the slider for the distance-/time and
					 * speed to initial values.
					 */
					$scope.resetSlider = function() {
						$scope.speedInKilometersPerHour = $scope.minSpeedInKilometersPerHour;
						$scope.currentTODValue = 1;
					};

					/**
					 * Changes the vehicle type according to an
					 * action on the related buttons.
					 */
					$scope.changeType = function() {
						$scope.changeValues();
						$scope.changeMinMaxSpeed();
						$scope.resetSlider();
					};
					
					/**
					 * Changes the transitMode depending on the selection in the 
					 * transitModeList-GUI-elements current selection.
					 */
					$scope.changeTransitMode = function(){
						$scope.transitMode = document.getElementById('transitModeList').value;
					};

					/**
					 * Changes the max_value depending on the
					 * selected vehicle type.
					 */
					$scope.changeValues = function() {
						if ($scope.transitMode == 'foot-walking')
							if ($scope.focus == 'distance')
								$scope.max_value = 5000;
							else
								$scope.max_value = 25;

						if ($scope.transitMode == 'cycling-regular')
							if ($scope.focus == 'distance')
								$scope.max_value = 5000;
							else
								$scope.max_value = 20;

						if ($scope.transitMode == 'driving-car')
							if ($scope.focus == 'distance')
								$scope.max_value = 5000;
							else
								$scope.max_value = 15;
					};

					/**
					 * Changes the minimum and maximum
					 * speed-per-hour value depending on the current
					 * selected vehicle type.
					 */
					$scope.changeMinMaxSpeed = function() {
						if ($scope.transitMode == 'foot-walking') {
							$scope.minSpeedInKilometersPerHour = 1;
							$scope.maxSpeedInKilometersPerHour = 6;
						}
						if ($scope.transitMode == 'cycling-regular') {
							$scope.minSpeedInKilometersPerHour = 10;
							$scope.maxSpeedInKilometersPerHour = 25;
						}
						if ($scope.transitMode == 'driving-car') {
							$scope.minSpeedInKilometersPerHour = 30;
							$scope.maxSpeedInKilometersPerHour = 50;
						}

						$scope.speedInKilometersPerHour = $scope.minSpeedInKilometersPerHour;
					};

					/**
					 * Checks the input-textfield for the
					 * isochrone-distance-array for validity.
					 * Extracts the text value of the textfield,
					 * splits it at every ',' and writes the values
					 * into the array of desired distances. Adds the
					 * analysis distance at the end of the array so
					 * the whole distance of the analysis will be
					 * covered by isochones.
					 */
					$scope.checkArrayInput = function() {
						$scope.rangeArray = [];
						var split = document
							.getElementById('isoInputText').value
							.split(',');
						var actVal = $scope.currentTODValue;
						if (split.length > 0) {
							for (var a = 0; a < split.length; a++) {
								if (!isNaN(split[a])) {
									actVal = parseFloat(split[a]);
									if (!isNaN(actVal))
										$scope.rangeArray
										.push(actVal);
								}
							}
							if ($scope.rangeArray[$scope.rangeArray.length - 1] != $scope.currentTODValue) {
								$scope.rangeArray
									.push($scope.currentTODValue);
							}
						} else {
							$scope.rangeArray = [$scope.currentTODValue];
						}
					};

					/**
					 * Changes variables so the isochrone-calculation-elements will be shown.
					 */
					$scope.showIso = function() {
						$scope.showIsochrones = true;
					};

					/**
					 * Changes variables so the routing-calculation-elements will be shown.
					 */
					$scope.showRouting = function() {
						$scope.showIsochrones = false;
					};

					/**
					 * Starts the analysis. This function is fired
					 * when the related button is pushed.
					 * 
					 * Depending on the current selection of the
					 * calculation-task the function
					 * 'startRoutingAnalysis' or
					 * 'startIsochroneCalculation' will be
					 * triggered.
					 * 
					 * The values from the input-elements are all
					 * up-to-date and saved in the variables
					 * accessable via the scope. The request URl
					 * will be build by this values and send towards
					 * the routing-API. The result will be handled,
					 * stored in the related scope- variables and
					 * displayed in the KM GUI.
					 */
					$scope.startAnalysis = function() {
						if ($scope.showIsochrones)
							$scope.startIsochroneCalculation();
						else
							$scope.startRoutingCalculation();
					};

					/**
					 * Starts the routing-calculation.
					 */
					$scope.startRoutingCalculation = function() {
						var startPointString = document.getElementById('startInput').value;
						var endPointString = document.getElementById('goalInput').value;
						
						var url = createRoutingRequest($scope.transitMode, $scope.preference, startPointString, endPointString);
						
						alert(url);
						
						var req = {
								method: 'GET',
								url: url,
								headers: {
									// 'Accept': 'application/json'
								}
							}

							$http(req)
								.then(
									function successCallback(
										response) {
										$scope.currentRouteGeoJSON = response.data;
										// TODO : CDB
										/*
										kommonitorMapService
											.replaceRouteGeoJSON(
												$scope.currentRouteGeoJSON,
												$scope.transitMode,
												$scope.focus,
												$scope.rangeArray,
												$scope.useMultipleStartPoints);
										$scope.prepareDownloadGeoJSON();
										*/
										$scope.loadingData = false;
										$rootScope.$broadcast('hideLoadingIconOnMap');
									},
									function errorCallback(
										response) {
										// called asynchronously
										// if an error occurs
										// or server returns
										// response with an
										// error status.
										$scope.loadingData = false;
										$rootScope.$broadcast('hideLoadingIconOnMap');
									});
					};

					/**
					 * Starts an isochrone-calculation.
					 */
					$scope.startIsochroneCalculation = function() {
						$scope.loadingData = true;
						$rootScope.$broadcast('showLoadingIconOnMap');

						$scope.checkArrayInput();

						// SWITCH THE VALUE DEPENDING ON THE LENGTH
						// OF THE LOCATIONS ARRAY
						if ($scope.locationsArray.length > 1)
							$scope.useMultipleStartPoints = true;
						else
							$scope.useMultipleStartPoints = false;

						console.log('Calculating isochrones for ' +
							$scope.locationsArray.length +
							' start points.')

						var url = createORSIsochroneRequest(
							$scope.transitMode,
							$scope.locationsArray,
							$scope.rangeArray,
							$scope.speedInKilometersPerHour);

						var req = {
							method: 'GET',
							url: url,
							headers: {
								// 'Accept': 'application/json'
							}
						}

						$http(req)
							.then(
								function successCallback(
									response) {
									// this callback will
									// becalled
									// asynchronously
									// when the response is
									// available
									$scope.currentIsochronesGeoJSON = response.data;
									kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
									kommonitorMapService
										.replaceIsochroneGeoJSON(
											$scope.currentIsochronesGeoJSON,
											$scope.transitMode,
											$scope.focus,
											$scope.rangeArray,
											$scope.useMultipleStartPoints);
									$scope
										.prepareDownloadGeoJSON();
									$scope.loadingData = false;
									$rootScope.$broadcast('hideLoadingIconOnMap');
								},
								function errorCallback(
									response) {
									// called asynchronously
									// if an error occurs
									// or server returns
									// response with an
									// error status.
									$scope.loadingData = false;
									$rootScope.$broadcast('hideLoadingIconOnMap');
								});
					};
				}
			]
		});

// $scope.downloadGeoJSON = function(){
//
// var geoJSON_string =
// JSON.stringify($scope.computedCustomizedIndicatorGeoJSON);
//
// filename =
// $scope.targetIndicator.indicatorName + '_' +
// $scope.targetSpatialUnit.spatialUnitLevel +
// '_' + $scope.targetDate + '_CUSTOM.geojson';
//
// if
// (!geoJSON_string.match(/^data:application\/vnd.geo+json/i))
// {
// geoJSON_string =
// 'data:application/vnd.geo+json;charset=utf-8,'
// + geoJSON_string;
// }
// data = encodeURI(geoJSON_string);
//
// link = document.createElement('a');
// link.setAttribute('href', data);
// link.setAttribute('download', filename);
//
// document.body.appendChild(link);
//
// console.log('Trigger download');
//
// link.click();
// }

// /**
// * Prebuild calculation.
// */
// $scope.runChildDemo = function() {
//
// $scope.loadingData = true;
// $rootScope
// .$broadcast('showLoadingIconOnMap');
//
// $scope.transitMode = 'Fußgänger (Kind)';
// $scope.reachProfile = 'foot-walking';
// $scope.speedInKilometersPerHour = 3;
// $scope.reachMode = 'Zeit';
// $scope.locationsArray = [ [ 7.049869894,
// 51.42055331 ] ];
// $scope.rangeArray = [ 300, 600, 900 ];
// $scope.useMultipleStartPoints = false;
//
// var url = createORSIsochroneRequest(
// $scope.reachProfile,
// $scope.locationsArray,
// $scope.rangeArray,
// $scope.speedInKilometersPerHour);
//
// var req = {
// method : 'GET',
// url : url,
// headers : {
// // 'Accept': 'application/json'
// }
// }
//
// $http(req)
// .then(
// function successCallback(
// response) {
// // this callback will be
// // called asynchronously
// // when the response is
// // available
// $scope.currentIsochronesGeoJSON = response.data;
//
// kommonitorMapService
// .replaceIsochroneMarker($scope.locationsArray);
// kommonitorMapService
// .replaceIsochroneGeoJSON(
// $scope.currentIsochronesGeoJSON,
// $scope.transitMode,
// $scope.reachMode,
// $scope.rangeArray,
// $scope.useMultipleStartPoints);
// $scope
// .prepareDownloadGeoJSON();
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
//
// },
// function errorCallback(
// response) {
// // called asynchronously
// // if an error occurs
// // or server returns
// // response with an
// // error status.
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
// });
// };
//
// /**
// * Prebuild calculation.
// */
// $scope.runPedestrianDemo = function() {
//
// $scope.loadingData = true;
// $rootScope
// .$broadcast('showLoadingIconOnMap');
//
// $scope.transitMode = 'Fußgänger (Erwachsener)';
// $scope.reachMode = 'Zeit';
// $scope.locationsArray = [ [ 7.049869894,
// 51.42055331 ] ];
// $scope.rangeArray = [ 300, 600, 900 ];
// $scope.reachProfile = 'foot-walking';
// $scope.speedInKilometersPerHour = 5;
// $scope.useMultipleStartPoints = false;
//
// var url = createORSIsochroneRequest(
// $scope.reachProfile,
// $scope.locationsArray,
// $scope.rangeArray,
// $scope.speedInKilometersPerHour);
//
// var req = {
// method : 'GET',
// url : url,
// headers : {
// // 'Accept': 'application/json'
// }
// }
//
// $http(req)
// .then(
// function successCallback(
// response) {
// // this callback will be
// // called asynchronously
// // when the response is
// // available
// $scope.currentIsochronesGeoJSON = response.data;
//
// kommonitorMapService
// .replaceIsochroneMarker($scope.locationsArray);
// kommonitorMapService
// .replaceIsochroneGeoJSON(
// $scope.currentIsochronesGeoJSON,
// $scope.transitMode,
// $scope.reachMode,
// $scope.rangeArray,
// $scope.useMultipleStartPoints);
// $scope
// .prepareDownloadGeoJSON();
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
//
// },
// function errorCallback(
// response) {
// // called asynchronously
// // if an error occurs
// // or server returns
// // response with an
// // error status.
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
// });
// };
//
// /**
// * Prebuild calculation.
// */
// $scope.runBicycleDemo = function() {
//
// $scope.loadingData = true;
// $rootScope
// .$broadcast('showLoadingIconOnMap');
//
// $scope.transitMode = 'Fahrrad';
// $scope.reachMode = 'Zeit';
// $scope.locationsArray = [ [ 7.049869894,
// 51.42055331 ] ];
// $scope.rangeArray = [ 300, 600, 900 ];
// $scope.reachProfile = 'cycling-regular';
// $scope.speedInKilometersPerHour = 15;
// $scope.useMultipleStartPoints = false;
//
// var url = createORSIsochroneRequest(
// $scope.reachProfile,
// $scope.locationsArray,
// $scope.rangeArray,
// $scope.speedInKilometersPerHour);
//
// var req = {
// method : 'GET',
// url : url,
// headers : {
// // 'Accept': 'application/json'
// }
// }
//
// $http(req)
// .then(
// function successCallback(
// response) {
// // this callback will be
// // called asynchronously
// // when the response is
// // available
// $scope.currentIsochronesGeoJSON = response.data;
//
// kommonitorMapService
// .replaceIsochroneMarker($scope.locationsArray);
// kommonitorMapService
// .replaceIsochroneGeoJSON(
// $scope.currentIsochronesGeoJSON,
// $scope.transitMode,
// $scope.reachMode,
// $scope.rangeArray,
// $scope.useMultipleStartPoints);
// $scope
// .prepareDownloadGeoJSON();
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
//
// },
// function errorCallback(
// response) {
// // called asynchronously
// // if an error occurs
// // or server returns
// // response with an
// // error status.
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
// });
// };
//
// /**
// * Prebuild calculation.
// */
// $scope.runCarDemo = function() {
//
// $scope.loadingData = true;
// $rootScope
// .$broadcast('showLoadingIconOnMap');
//
// $scope.transitMode = 'Auto';
// $scope.reachMode = 'Zeit';
// $scope.locationsArray = [ [ 7.049869894,
// 51.42055331 ] ];
// $scope.rangeArray = [ 300, 600, 900 ];
// $scope.reachProfile = 'driving-car';
// $scope.speedInKilometersPerHour = 130;
// $scope.useMultipleStartPoints = false;
//
// var url = createORSIsochroneRequest(
// $scope.reachProfile,
// $scope.locationsArray,
// $scope.rangeArray,
// $scope.speedInKilometersPerHour);
//
// var req = {
// method : 'GET',
// url : url,
// headers : {
// // 'Accept': 'application/json'
// }
// }
//
// $http(req)
// .then(
// function successCallback(
// response) {
// // this callback will be
// // called asynchronously
// // when the response is
// // available
// $scope.currentIsochronesGeoJSON = response.data;
//
// kommonitorMapService
// .replaceIsochroneMarker($scope.locationsArray);
// kommonitorMapService
// .replaceIsochroneGeoJSON(
// $scope.currentIsochronesGeoJSON,
// $scope.transitMode,
// $scope.reachMode,
// $scope.rangeArray,
// $scope.useMultipleStartPoints);
// $scope
// .prepareDownloadGeoJSON();
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
//
// },
// function errorCallback(
// response) {
// // called asynchronously
// // if an error occurs
// // or server returns
// // response with an
// // error status.
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
// });
// };
//
// /**
// * Prebuild calculation.
// */
// $scope.runBicycleDemoWithMultipleStartPoints = function() {
//
// $scope.loadingData = true;
// $rootScope
// .$broadcast('showLoadingIconOnMap');
//
// $scope.transitMode = 'Fahrrad';
// $scope.reachMode = 'Zeit';
// $scope.locationsArray = [
// [ 7.049869894, 51.42055331 ],
// [ 7.0382865, 51.4234454 ],
// [ 7.0403425, 51.4258269 ] ];
// $scope.rangeArray = [ 300, 600, 900 ];
// $scope.reachProfile = 'cycling-regular';
// $scope.speedInKilometersPerHour = 15;
// $scope.useMultipleStartPoints = true;
//
// var url = createORSIsochroneRequest(
// $scope.reachProfile,
// $scope.locationsArray,
// $scope.rangeArray,
// $scope.speedInKilometersPerHour);
//
// var req = {
// method : 'GET',
// url : url,
// headers : {
// // 'Accept': 'application/json'
// }
// }
//
// $http(req)
// .then(
// function successCallback(
// response) {
// // this callback will be
// // called asynchronously
// // when the response is
// // available
// $scope.currentIsochronesGeoJSON = response.data;
//
// kommonitorMapService
// .replaceIsochroneMarker($scope.locationsArray);
// kommonitorMapService
// .replaceIsochroneGeoJSON(
// $scope.currentIsochronesGeoJSON,
// $scope.transitMode,
// $scope.reachMode,
// $scope.rangeArray,
// $scope.useMultipleStartPoints);
// $scope
// .prepareDownloadGeoJSON();
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
//
// },
// function errorCallback(
// response) {
// // called asynchronously
// // if an error occurs
// // or server returns
// // response with an
// // error status.
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
// });
// };
//
// /**
// * Prebuild calculation.
// */
// $scope.runPedestrianKitaRellinghausenDemoWithMultipleStartPoints = function()
// {
//
// $scope.loadingData = true;
// $rootScope
// .$broadcast('showLoadingIconOnMap');
//
// $scope.transitMode = 'Fußgänger (Kind)';
// $scope.reachMode = 'Zeit';
// // $scope.locationsArray =
// // [[7.049869894,51.42055331],[7.0394219,51.4232979],[7.040197,51.4254453]];
// $scope.locationsArray = [
// [ 7.049869894, 51.42055331 ],
// [ 7.0382865, 51.4234454 ],
// [ 7.0403425, 51.4258269 ] ];
// $scope.rangeArray = [ 300, 600, 900 ];
// $scope.reachProfile = 'foot-walking';
// $scope.speedInKilometersPerHour = 3;
// $scope.useMultipleStartPoints = true;
//
// var url = createORSIsochroneRequest(
// $scope.reachProfile,
// $scope.locationsArray,
// $scope.rangeArray,
// $scope.speedInKilometersPerHour);
//
// var req = {
// method : 'GET',
// url : url,
// headers : {
// // 'Accept': 'application/json'
// }
// }
//
// $http(req)
// .then(
// function successCallback(
// response) {
// // this callback will be
// // called asynchronously
// // when the response is
// // available
// $scope.currentIsochronesGeoJSON = response.data;
//
// kommonitorMapService
// .replaceIsochroneMarker($scope.locationsArray);
// kommonitorMapService
// .replaceIsochroneGeoJSON(
// $scope.currentIsochronesGeoJSON,
// $scope.transitMode,
// $scope.reachMode,
// $scope.rangeArray,
// $scope.useMultipleStartPoints);
// $scope
// .prepareDownloadGeoJSON();
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
//
// },
// function errorCallback(
// response) {
// // called asynchronously
// // if an error occurs
// // or server returns
// // response with an
// // error status.
// $scope.loadingData = false;
// $rootScope
// .$broadcast('hideLoadingIconOnMap');
// });
// };