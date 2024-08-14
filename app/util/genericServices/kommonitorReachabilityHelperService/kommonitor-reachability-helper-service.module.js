angular.module('kommonitorReachabilityHelper', ['kommonitorDataExchange']);


angular
	.module('kommonitorReachabilityHelper')
	.service(
		'kommonitorReachabilityHelperService', [
		'$http', '$rootScope', '$timeout','__env', 'Auth', '$routeParams', '$location', 'kommonitorDataExchangeService',
		function ($http, $rootScope, $timeout, __env, Auth, $routeParams, $location, kommonitorDataExchangeService) {

			let self = this;

			this.currentIsochronesGeoJSON = undefined;
			this.original_nonDissolved_isochrones = undefined;

			this.settings = {};

			this.settings.pointSourceConfigured = false;
			this.settings.useMultipleStartPoints = false;
			this.settings.unit = 'Meter';

			this.settings.locationsArray = [];
			this.settings.locationsArrayIdArray = [];

			this.settings.dateSelectionType_valueIndicator = "date_indicator";
			this.settings.dateSelectionType_valueManual = "date_manual";
			this.settings.dateSelectionType_valuePerDataset = "date_perDataset";
			this.settings.dateSelectionType = {
				selectedDateType: this.settings.dateSelectionType_valuePerDataset
			};

			this.settings.selectedDate_manual = undefined;

			this.settings.isochroneConfig = {};
			this.settings.isochroneConfig.dateSelectionType_valueIndicator = "date_indicator";
			this.settings.isochroneConfig.dateSelectionType_valueManual = "date_manual";
			this.settings.isochroneConfig.dateSelectionType_valuePerDataset = "date_perDataset";
			this.settings.isochroneConfig.dateSelectionType = {
				selectedDateType: this.settings.isochroneConfig.dateSelectionType_valuePerDataset
			};

			this.settings.isochroneConfig.selectedDate_manual = undefined;

			this.settings.dissolveIsochrones = true;

			this.settings.routingStartPointInput = undefined;
			this.settings.routingEndPointInput = undefined;

			/**
			 * The current time-or-distance value of the
			 * analysis. The unit of the stored value can be
			 * found in the variable 'unit'. This value
			 * represents value of the slider in the GUI and
			 * handed to the routing API.
			 */
			this.settings.currentTODValue = 1;

			/**
			 * Specifies the route preference.
			 *
			 * Allowed values are:
			 * - "fastest"
			 * - "shortest"
			 * - "recommended"
			 */
			this.settings.preference = "fastest";

			this.settings.isochroneInput = undefined;

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
			this.settings.transitMode = 'buffer';

			/**
			 * The focus of the analysis. Valid values are:
			 * 'distance' and 'time'. TODO : Starke
			 * Ueberschneidung mit der Variablen 'focus',
			 * die im Grunde genau das gleiche speichert.
			 */
			this.settings.focus = 'distance';

			/**
			 * config of starting points source (layer or manual draw) for isochrones
			 */
			this.settings.startPointsSource = "fromLayer";

			/**
			* selected start point layer for isochrone computation
			* GeoJSON within property .geoJSON
			*/
			this.settings.selectedStartPointLayer = undefined;

			this.resetSettings = function () {


				this.settings = {};

				this.settings.pointSourceConfigured = false;
				this.settings.useMultipleStartPoints = false;
				this.settings.unit = 'Meter';

				this.settings.locationsArray = [];

				this.settings.dateSelectionType_valueIndicator = "date_indicator";
				this.settings.dateSelectionType_valueManual = "date_manual";
				this.settings.dateSelectionType_valuePerDataset = "date_perDataset";
				this.settings.dateSelectionType = {
					selectedDateType: this.settings.dateSelectionType_valuePerDataset
				};

				this.settings.selectedDate_manual = undefined;

				this.settings.isochroneConfig = {};
				this.settings.isochroneConfig.dateSelectionType_valueIndicator = "date_indicator";
				this.settings.isochroneConfig.dateSelectionType_valueManual = "date_manual";
				this.settings.isochroneConfig.dateSelectionType_valuePerDataset = "date_perDataset";
				this.settings.isochroneConfig.dateSelectionType = {
					selectedDateType: this.settings.isochroneConfig.dateSelectionType_valuePerDataset
				};

				this.settings.isochroneConfig.selectedDate_manual = undefined;


				this.settings.dissolveIsochrones = true;
				this.settings.transitMode = 'buffer';
				document.getElementById("optBuffer").click();
				this.settings.focus = 'distance';
				document.getElementById("focus_distance").click();
				this.settings.startPointsSource = "fromLayer";

				document.getElementById("startPointsSource_layer").click();
				this.settings.selectedStartPointLayer = undefined;

				this.settings.loadingData = false;

				this.settings.currentTODValue = 1;

				this.settings.preference = "fastest";

				this.settings.routingStartPointInput = undefined;
				this.settings.routingEndPointInput = undefined;
			}

			/**
						   * TODO
						   */
			this.createRoutingRequest = function (transitMode, preference, routingStartPointInput, routingEndPointInput) {
				var locString = routingStartPointInput + '%7C' + routingEndPointInput;

				// if user never clicked transit mode set standard 
				if (transitMode === "buffer") {
					transitMode = "foot-walking";
				}

				// var getRequest = __env.targetUrlToReachabilityService_ORS
				// 	+ '/routes?'
				// 	+ 'coordinates=' + locString
				// 	+ '&profile='+transitMode
				// 	+ '&preference='+preference
				// 	+ '&units='+'km'
				// 	+ '&language='+'de'
				// 	+ '&format='+'geojson'
				// 	+ '&instructions='+'true'
				// 	+ '&instructions_format='+'html'
				// 	+ '&maneuvers='+'true'
				// 	+ '&attributes='+'avgspeed'
				// 	+ '&elevation='+'true';

				//console.log(getRequest);

				var getRequest = __env.targetUrlToReachabilityService_ORS
					+ '/v2/directions/' + transitMode + '?'
					+ 'start=' + routingStartPointInput
					+ '&end=' + routingEndPointInput;

				return getRequest;
			}

			/**
			 * TODO
			 */
			this.createORSIsochroneRequestBody = function (locationsArray, rangeArray) {
				let body = { 
					"locations": [], 
					"range": [], 
					"attributes": ["reachfactor", "area"], 
					"location_type": "start", 
					"range_type": self.settings.focus, 
					"smoothing": 0, 
					"area_units": "km", 
					"units": "m" 
				};

				for (var index = 0; index < locationsArray.length; index++) {
					// element looks like
					// [longitude,latitude]
					let point = [locationsArray[index][0], locationsArray[index][1]];
					body.locations.push(point);
				};

					for (var i = 0; i < rangeArray.length; i++) {
						var cValue = rangeArray[i];

						// CALCULATE SECONDS FROM MINUTE VALUES IF TIME-ANALYSIS IS WANTED
						if(self.settings.focus=='time'){
							cValue = cValue*60;
						}
							
						body.range.push(cValue);
					};

				return body;
			};

			this.makeLocationsArrayFromStartPoints = function () {
				// array of arrays of lon,lat
				self.settings.locationsArray = [];
				self.settings.locationsArrayIdArray = [];

				if (self.settings.startPointsSource === "manual") {
					// establish from drawn points
					self.settings.manualStartPoints.features.forEach(function (feature) {
						self.settings.locationsArray.push(feature.geometry.coordinates);
						self.settings.locationsArrayIdArray.push(feature.properties[__env.FEATURE_ID_PROPERTY_NAME]);
					});
				}
				else {
					// establish from chosen layer
					self.settings.selectedStartPointLayer.geoJSON_reachability.features.forEach(function (feature) {
						self.settings.locationsArray.push(feature.geometry.coordinates);
						self.settings.locationsArrayIdArray.push(feature.properties[__env.FEATURE_ID_PROPERTY_NAME]);
					});
				}

				return self.settings.locationsArray;
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
			this.checkArrayInput = function () {
				this.settings.rangeArray = [];
				var split = self.settings.isochroneInput.split(',');
				var actVal;
				if (split.length > 0) {
					for (var a = 0; a < split.length; a++) {
						if (!isNaN(split[a])) {
							actVal = parseFloat(split[a]);
							if (!isNaN(actVal))
								this.settings.rangeArray
									.push(actVal);
						}
					}
				}

				this.settings.rangeArray.sort(function (a, b) { return a - b; });
			};

			/*
			attaches the featureID of starting points to corresponding result isochrones
			using
			featureID_rangeValue
			i.e.
			1_300 --> may stand for featureID = 1 and rangeValue = 300
			*/
			this.attachPoiFeatureIDsToIsochrones = function(){

				// the order of isochrone features following rules:
				// for two starting points an three ranges
				// the first starting point is on index 0,1,2 with increasing range value
				// then index 3,4,5 will represent the second point for each increasing range
				let locationsArrayIdIndex = 0;
				for (let isochroneIndex = 0; isochroneIndex < this.original_nonDissolved_isochrones.features.length; isochroneIndex++) {					

					for (let rangeIndex = 0; rangeIndex < self.settings.rangeArray.length; rangeIndex++) {
						const rangeValue = self.settings.rangeArray[rangeIndex];
						
						const resultIsochrone = this.original_nonDissolved_isochrones.features[isochroneIndex];
						resultIsochrone.properties.ID = self.settings.locationsArrayIdArray[locationsArrayIdIndex] + '_' + rangeValue;
						this.original_nonDissolved_isochrones.features[isochroneIndex] = resultIsochrone;

						// for multiple ranges we must increment the isochrone index in this inner loop
						// but not if the last range value has been processed
						if(rangeIndex != self.settings.rangeArray.length -1){
							isochroneIndex++;
						}						
					}	
					// now increment locationArrayIDIndex as now the point for each range has been processed 
					locationsArrayIdIndex++;				
				}

				return this.original_nonDissolved_isochrones;
			}

			/**
			 * Starts an isochrone-calculation.
			 */
			this.startIsochroneCalculation = async function (isUsedInReporting) {
				if (!isUsedInReporting) { // reporting uses it's own loading overlay, which is controlled there
					self.settings.loadingData = true;
				} else {
					$rootScope.$broadcast("reportingIsochronesCalculationStarted");
				}

				this.checkArrayInput();

				self.settings.locationsArray = this.makeLocationsArrayFromStartPoints();

				// SWITCH THE VALUE DEPENDING ON THE LENGTH
				// OF THE LOCATIONS ARRAY
				if (self.settings.locationsArray.length > 1)
					self.settings.useMultipleStartPoints = true;
				else
					self.settings.useMultipleStartPoints = false;

				var resultIsochrones;

				if (self.settings.transitMode === 'buffer') {
					resultIsochrones = await this.createBuffers();
				}
				else {
					resultIsochrones = await this.createIsochrones();
				}

				if (isUsedInReporting) {
					// No need to add isochrones to main map.
					// Instead they are returned to reporting modal
					$rootScope.$broadcast("reportingIsochronesCalculationFinished", resultIsochrones);
					return;
				}

				self.currentIsochronesGeoJSON = resultIsochrones;			

				$rootScope.$broadcast("isochronesCalculationFinished");

				self.settings.loadingData = false;

			};



			this.fetchIsochrones = async function (tempStartPointsArray) {
				var body = self.createORSIsochroneRequestBody(
					tempStartPointsArray,
					self.settings.rangeArray);

				let url = __env.targetUrlToReachabilityService_ORS +
				'/v2/isochrones/' + self.settings.transitMode;	

				var req = {
					method: 'POST',
					url: url,
					data: body,
					headers: {
						// 'Accept': 'application/json',
						"Content-Type": 'application/json'
					}
				};

				return await $http(req)
					.then(
						function successCallback(
							response) {
							// this callback will
							// becalled
							// asynchronously
							// when the response is
							// available
							
							return response.data;

						},
						function errorCallback(
							error) {
							// called asynchronously
							// if an error occurs
							// or server returns
							// response with an
							// error status.
							console.error(error.data.error.message);
							this.error = error.data.error.message;
							self.settings.loadingData = false;
							kommonitorDataExchangeService.displayMapApplicationError(error);
						});
			};

			this.createBuffers = function () {
				var resultIsochrones;

				var startingPoints_geoJSON;
				// create Buffers for each input and range definition
				if (self.settings.startPointsSource === "manual") {
					// establish from drawn points
					startingPoints_geoJSON = jQuery.extend(true, {}, self.settings.manualStartPoints);
				}
				else {
					// establish from chosen layer
					startingPoints_geoJSON = jQuery.extend(true, {}, self.settings.selectedStartPointLayer.geoJSON_reachability);
				}

				// range in meters				
				for (const range of this.settings.rangeArray) {
					var geoJSON_buffered = turf.buffer(jQuery.extend(true, {}, startingPoints_geoJSON), Number(range) / 1000, { units: 'kilometers', steps: 12 });

					if (!geoJSON_buffered.features) {
						// transform single feature to featureCollection
						geoJSON_buffered = turf.featureCollection([
							geoJSON_buffered
						]);
					}

					// add property: value --> range
					if (geoJSON_buffered.features && geoJSON_buffered.features.length > 0) {
						for (const feature of geoJSON_buffered.features) {
							feature.properties.value = range;
						}
					}

					if (!resultIsochrones) {
						resultIsochrones = jQuery.extend(true, {}, geoJSON_buffered);
					}
					else {
						resultIsochrones.features = resultIsochrones.features.concat(jQuery.extend(true, {}, geoJSON_buffered).features);
					}
				}

				this.original_nonDissolved_isochrones = jQuery.extend(true, {}, resultIsochrones);
				// sort buffered isochrones before attaching featureIDs as that expects a certain order of the point buffers
				// each point must have consecutive indices and increasing range!
				this.original_nonDissolved_isochrones.features = this.original_nonDissolved_isochrones.features.sort(self.sortBuffers); 
				this.original_nonDissolved_isochrones = this.attachPoiFeatureIDsToIsochrones();

				if (self.settings.dissolveIsochrones) {
					try {
						geoJSON_buffered = turf.dissolve(geoJSON_buffered, { propertyName: 'value' });
					} catch (e) {
						console.error("Dissolving Isochrones failed with error: " + e);
						console.error("Will return undissolved isochrones");
					} finally {

					}

				}

				return resultIsochrones;
			};

			this.sortBuffers = function(a, b){
				if (a.properties[__env.FEATURE_ID_PROPERTY_NAME] == b.properties[__env.FEATURE_ID_PROPERTY_NAME]) {
					// sort by ascending range
					if (a.properties["value"] < b.properties["value"]) {
						return -1;
					  }
					else if (a.properties["value"] > b.properties["value"]) {
						return 1;
					  } 
					else{
						return 0;
					}
				  } 
				if (a.properties[__env.FEATURE_ID_PROPERTY_NAME] < b.properties[__env.FEATURE_ID_PROPERTY_NAME]) {
					return -1;
				  } 
				else if (a.properties[__env.FEATURE_ID_PROPERTY_NAME] < b.properties[__env.FEATURE_ID_PROPERTY_NAME]) {
					return 1;
				  }
				  // a must be equal to b
				  return 0;
			}

			this.createIsochrones = async function () {
				var resultIsochrones;

				console.log('Calculating isochrones for ' +
					self.settings.locationsArray.length +
					' start points.');

				var maxLocationsForORSRequest = 150;

				var featureIndex = 0;
				// log progress for each 10% of features
				var logProgressIndexSeparator = Math.round(self.settings.locationsArray.length / 100 * 10);

				var countFeatures = 0;
				var tempStartPointsArray = [];
				for (var pointIndex = 0; pointIndex < self.settings.locationsArray.length; pointIndex++) {
					tempStartPointsArray.push(self.settings.locationsArray[pointIndex]);
					countFeatures++;

					// if maxNumber of locations is reached or the last starting point is reached
					if (countFeatures === maxLocationsForORSRequest || pointIndex === self.settings.locationsArray.length - 1) {
						// make request, collect results

						// responses will be GeoJSON FeatureCollections
						var tempIsochrones = await this.fetchIsochrones(tempStartPointsArray);

						if (!resultIsochrones) {
							resultIsochrones = tempIsochrones;
						}
						else {
							// apend results of tempIsochrones to resultIsochrones
							resultIsochrones.features = resultIsochrones.features.concat(tempIsochrones.features);
						}
						// increment featureIndex
						featureIndex++;
						if (featureIndex % logProgressIndexSeparator === 0) {
							console.log("PROGRESS: Computed isochrones for '" + featureIndex + "' of total '" + self.settings.locationsArray.length + "' starting points.");
						}

						// reset temp vars
						tempStartPointsArray = [];
						countFeatures = 0;

					} // end if
				} // end for

				this.original_nonDissolved_isochrones = resultIsochrones;
				this.original_nonDissolved_isochrones = this.attachPoiFeatureIDsToIsochrones();

				if (self.settings.dissolveIsochrones) {
					try {
						var dissolved = turf.dissolve(resultIsochrones, { propertyName: 'value' });
						return dissolved;
					} catch (e) {
						console.error("Dissolving Isochrones failed with error: " + e);
						console.error("Will return undissolved isochrones");
						return response.data;
					} finally {

					}

				}

				return resultIsochrones;

			};

			// fetch georesource GeoJSON
			this.fetchGeoJSONForIsochrones = async function () {
				if (!self.settings.selectedStartPointLayer) {
					self.settings.loadingData = false;
					return;
				}

				// clear any previous results
				self.settings.selectedStartPointLayer.geoJSON_reachability = undefined;

				var date;

				if (self.settings.isochroneConfig.dateSelectionType.selectedDateType === self.settings.isochroneConfig.dateSelectionType_valuePerDataset) {
					date = self.settings.isochroneConfig.selectedDate.startDate;
				}
				else if (self.settings.isochroneConfig.dateSelectionType.selectedDateType === self.settings.isochroneConfig.dateSelectionType_valueManual) {
					date = self.settings.isochroneConfig.selectedDate_manual;
				}
				else {
					date = kommonitorDataExchangeService.selectedDate;
				}

				if (!date) {
					self.settings.loadingData = false;
					return;
				}


				self.settings.loadingData = true;
				var id = self.settings.selectedStartPointLayer.georesourceId;

				var dateComps = date.split("-");

				var year = dateComps[0];
				var month = dateComps[1];
				var day = dateComps[2];

				await $http({
					url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
					method: "GET"
				}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available
					var geoJSON = response.data;

					self.settings.selectedStartPointLayer.geoJSON_reachability = geoJSON;
					self.settings.selectedStartPointLayer.geoJSON = geoJSON;

					self.settings.loadingData = false;
					self.settings.pointSourceConfigured = true;

				}, function errorCallback(error) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					self.settings.pointSourceConfigured = false;
					self.settings.loadingData = false;
					console.error(error.statusText);
					kommonitorDataExchangeService.displayMapApplicationError(error);
					this.error = error.statusText;
				});
			};



		}]);
