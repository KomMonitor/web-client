angular.module('reachabilityPoiInIso').component('reachabilityPoiInIso', {
	templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/reachabilityScenarioModal/reachabilityPoiInIso/reachability-poi-in-iso.template.html",
	controller: ['kommonitorDataExchangeService',
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorReachabilityHelperService', 'kommonitorDiagramHelperService',
		'kommonitorReachabilityMapHelperService',
		function reachabilityPoiInIsoController(kommonitorDataExchangeService,
			$scope, $rootScope, $http, __env, $timeout, kommonitorReachabilityHelperService, kommonitorDiagramHelperService,
			kommonitorReachabilityMapHelperService) {

			this.kommonitorReachabilityHelperServiceInstance = kommonitorReachabilityHelperService;
			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorDiagramHelperServiceInstance = kommonitorDiagramHelperService;

			$scope.domId = "reachabilityScenarioPoiInIsoGeoMap";
			$scope.mapParts;

			$scope.echartsInstances_reachabilityAnalysis = new Map();

			$('#manualDateDatepicker_reachabilityAnalysis').datepicker(kommonitorDataExchangeService.datePickerOptions);

			$rootScope.$on("resetPoisInIsochrone", function () {
				$scope.resetPoisInIsochrone();
			});

			$rootScope.$on("isochronesCalculationFinished", function () {

				kommonitorReachabilityMapHelperService
					.replaceIsochroneGeoJSON(
						$scope.domId,
						kommonitorReachabilityHelperService.currentIsochronesGeoJSON,
						kommonitorReachabilityHelperService.settings.transitMode,
						kommonitorReachabilityHelperService.settings.focus,
						kommonitorReachabilityHelperService.rangeArray,
						kommonitorReachabilityHelperService.settings.useMultipleStartPoints,
						kommonitorReachabilityHelperService.settings.dissolveIsochrones);

			});

			$scope.init = function () {
				$scope.mapParts = kommonitorReachabilityMapHelperService.initReachabilityGeoMap($scope.domId);
			};

			$scope.init();

			$scope.resetPoisInIsochrone = function () {
				$scope.echartsInstances_reachabilityAnalysis = new Map();
				document.getElementById("reachability_diagrams_section").innerHTML = "";
				for (var poi of kommonitorDataExchangeService.availableGeoresources) {
					if (poi.isSelected_reachabilityAnalysis) {
						poi.isSelected_reachabilityAnalysis = false;
						//remove POI layer from map
						$scope.removePoiLayerFromMap(poi);
					}
				}
			};

			//////////////////////////// SECTION FOR GORESOURCE AND INDICATOR ANALYSIS

			$scope.getQueryDate = function (resource) {
				if (kommonitorReachabilityHelperService.settings.dateSelectionType.selectedDateType === kommonitorReachabilityHelperService.settings.dateSelectionType_valueIndicator) {
					return kommonitorDataExchangeService.selectedDate;
				}
				else if (kommonitorReachabilityHelperService.settings.dateSelectionType.selectedDateType === kommonitorReachabilityHelperService.settings.dateSelectionType_valueManual) {
					return kommonitorReachabilityHelperService.settings.selectedDate_manual;
				}
				else if (kommonitorReachabilityHelperService.settings.dateSelectionType.selectedDateType === kommonitorReachabilityHelperService.settings.dateSelectionType_valuePerDataset) {
					return resource.selectedDate.startDate;
				}
				else {
					return kommonitorDataExchangeService.selectedDate;
				}
			};

			$scope.handlePoiForAnalysis = async function (poi) {
				kommonitorReachabilityHelperService.settings.loadingData = true;
				

				try {
					if (poi.isSelected_reachabilityAnalysis) {
						poi = await $scope.fetchGeoJSONForDate(poi);
					}

					poi = await $scope.handlePoiOnDiagram(poi);

					if (kommonitorDataExchangeService.isDisplayableGeoresource(poi)) {
						$scope.handlePoiOnMap(poi);
					}
				} catch (error) {
					console.error(error);
				}

				kommonitorReachabilityHelperService.settings.loadingData = false;
				

				// as method is async we may call angular digest cycle
				setTimeout(() => {
					$scope.$digest();
				}, 250);
			};

			$scope.fetchGeoJSONForDate = function (poiGeoresource) {
				var id = poiGeoresource.georesourceId;

				var date = $scope.getQueryDate(poiGeoresource);

				var dateComps = date.split("-");

				var year = dateComps[0];
				var month = dateComps[1];
				var day = dateComps[2];

				return $http({
					url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
					method: "GET"
				}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available
					var geoJSON = response.data;

					poiGeoresource.geoJSON = geoJSON;

					return poiGeoresource;

				}, function errorCallback(error) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					kommonitorReachabilityHelperService.settings.loadingData = false;
					kommonitorDataExchangeService.displayMapApplicationError(error);
					
				});
			};

			$scope.handlePoiOnDiagram = async function (poi) {
				if (poi.isSelected_reachabilityAnalysis) {
					// maps range value to result GeoJSON
					var pointsPerIsochroneRangeMap = await $scope.computePoisWithinIsochrones(poi);
					$scope.addOrReplaceWithinDiagrams(poi, pointsPerIsochroneRangeMap);
					// now filter the geoJSON to only include those datasets that are actually inside any isochrone
					poi = filterGeoJSONPointsInsideLargestIsochrone(poi, pointsPerIsochroneRangeMap);
				}
				else {
					//remove POI layer from map
					$scope.removePoiFromDiagram(poi);
				}

				return poi;
			};

			function filterGeoJSONPointsInsideLargestIsochrone(poi, pointsPerIsochroneRangeMap) {
				var keyIter = pointsPerIsochroneRangeMap.keys();

				var nextKey = keyIter.next();

				var largestRange;

				while (nextKey.value) {
					var nextRange = nextKey.value;
					if (!largestRange) {
						largestRange = Number(nextRange);
					}
					else if (largestRange < Number(nextRange)) {
						largestRange = Number(nextRange);
					}

					nextKey = keyIter.next();
				}

				// map stores keys as string
				poi.geoJSON = pointsPerIsochroneRangeMap.get("" + largestRange);

				return poi;
			}

			$scope.computePoisWithinIsochrones = async function (poi) {
				var pointsPerIsochroneRangeMap = $scope.initializeMapWithRangeKeys();
				if (!poi.geoJSON) {
					poi = await $scope.fetchGeoJSONForDate(poi);
				}

				// as there might be mutliple isochrone ranges
				// we must perform point in polygon for each range
				var keyIter = pointsPerIsochroneRangeMap.keys();

				var nextKey = keyIter.next();

				while (nextKey.value) {
					var nextKeyValue = nextKey.value;

					var geoJSON_featureCollection = $scope.computePoisWithinIsochrone(nextKeyValue, poi);
					pointsPerIsochroneRangeMap.set(nextKeyValue, geoJSON_featureCollection);
					nextKey = keyIter.next();
				}

				return pointsPerIsochroneRangeMap;
			};

			$scope.computePoisWithinIsochrone = function (rangeValue, poi) {
				// create clones of poi geoJSON and isochrone geoJSON
				var isochrones_geoJSON_clone = JSON.parse(JSON.stringify(kommonitorReachabilityHelperService.currentIsochronesGeoJSON));
				var poi_geoJSON_clone = JSON.parse(JSON.stringify(poi.geoJSON));

				// filter isochrone geoJSON clone by range value
				isochrones_geoJSON_clone.features = isochrones_geoJSON_clone.features.filter(feature => {
					return String(feature.properties.value) === String(rangeValue);
				});

				// filter poi geoJSON clone by spatial within isochrone
				var pointsWithinIsochrones = turf.pointsWithinPolygon(poi_geoJSON_clone, isochrones_geoJSON_clone);

				return pointsWithinIsochrones;
			};


			$scope.initializeMapWithRangeKeys = function () {
				var map = new Map();

				for (const feature of kommonitorReachabilityHelperService.currentIsochronesGeoJSON.features) {
					map.set("" + feature.properties.value, null);
				}

				return map;
			};



			$scope.addOrReplaceWithinDiagrams = function (poi, pointsPerIsochroneRangeMap) {
				var mapEntries = pointsPerIsochroneRangeMap.entries();

				var nextEntry = mapEntries.next();
				while (nextEntry.value) {

					var nextEntry_keyRange = nextEntry.value[0];
					var nextEntry_valueGeoJSON = nextEntry.value[1];
					var numberOfFeatures = 0;

					var nextEntry_keyRange_label = nextEntry_keyRange;
					if (kommonitorReachabilityHelperService.settings.focus == 'time') {
						// compute seconds to minutes for display
						nextEntry_keyRange_label = nextEntry_keyRange_label / 60;
					}

					if (nextEntry_valueGeoJSON) {
						numberOfFeatures = nextEntry_valueGeoJSON.features.length;
					}
					console.log("Number of Points wihtin Range '" + nextEntry_keyRange + "' is '" + numberOfFeatures + "'");

					var date = $scope.getQueryDate(poi);

					if ($scope.echartsInstances_reachabilityAnalysis && $scope.echartsInstances_reachabilityAnalysis.has(nextEntry_keyRange)) {
						// append to diagram

						var echartsInstance = $scope.echartsInstances_reachabilityAnalysis.get(nextEntry_keyRange);
						var echartsOptions = echartsInstance.getOption();
						echartsOptions = kommonitorDiagramHelperService.appendToReachabilityAnalysisOptions(poi, nextEntry_valueGeoJSON, echartsOptions, date);
						echartsInstance.setOption(echartsOptions);
						$scope.echartsInstances_reachabilityAnalysis.set(nextEntry_keyRange, echartsInstance);
					}
					else {
						var reachabilityDiagramsSectionNode = document.getElementById("reachability_diagrams_section");
						var newChartNode = document.createElement("div");
						newChartNode.innerHTML = '<hr><h4>Analyse Einzugsgebiet ' + nextEntry_keyRange_label + ' [' + kommonitorDataExchangeService.isochroneLegend.cutOffUnit + ']</h4><br/><br/><div class="chart"><div  id="reachability_pieDiagram_range_' + nextEntry_keyRange + '" style="width:100%; min-height:150px;"></div></div>';
						reachabilityDiagramsSectionNode.appendChild(newChartNode);

						// init new echarts instance
						var echartsInstance = echarts.init(document.getElementById('reachability_pieDiagram_range_' + nextEntry_keyRange + ''));
						// use configuration item and data specified to show chart
						var echartsOptions = kommonitorDiagramHelperService.createInitialReachabilityAnalysisPieOptions(poi, nextEntry_valueGeoJSON, nextEntry_keyRange_label + " " + kommonitorDataExchangeService.isochroneLegend.cutOffUnit, date);
						echartsInstance.setOption(echartsOptions);

						echartsInstance.hideLoading();

						$scope.echartsInstances_reachabilityAnalysis.set(nextEntry_keyRange, echartsInstance);

						setTimeout(function () {
							echartsInstance.resize();
						}, 350);
					}

					nextEntry = mapEntries.next();
				}
			};

			$scope.removePoiFromDiagram = function (poiGeoresource) {
				var chart_entries = $scope.echartsInstances_reachabilityAnalysis.entries();

				var nextChartInstanceEntry = chart_entries.next();
				while (nextChartInstanceEntry.value) {

					var nextChartInstance = nextChartInstanceEntry.value[1];
					var nextChartOptions = nextChartInstance.getOption();

					nextChartOptions = kommonitorDiagramHelperService.removePoiFromReachabilityAnalysisOption(nextChartOptions, poiGeoresource);
					nextChartInstance.setOption(nextChartOptions);

					$scope.echartsInstances_reachabilityAnalysis.set(nextChartInstanceEntry.value[0], nextChartInstance);

					nextChartInstanceEntry = chart_entries.next();
				}
			};

			$scope.handlePoiOnMap = function (poi) {

				if (poi.isSelected_reachabilityAnalysis) {
					//display on Map
					$scope.addPoiLayerToMap(poi);
				}
				else {
					//remove POI layer from map
					$scope.removePoiLayerFromMap(poi);
				}

			};

			$scope.addPoiLayerToMap = function (poiGeoresource) {
				kommonitorReachabilityHelperService.settings.loadingData = true;
				

				// fale --> useCluster = false 
				kommonitorReachabilityMapHelperService.addPoiGeoresourceGeoJSON_reachabilityAnalysis($scope.domId, poiGeoresource, $scope.getQueryDate(poiGeoresource), false);
				kommonitorReachabilityHelperService.settings.loadingData = false;
				

			};

			$scope.removePoiLayerFromMap = function (poiGeoresource) {
				kommonitorReachabilityHelperService.settings.loadingData = true;
				

				poiGeoresource = poiGeoresource;

				kommonitorReachabilityMapHelperService.removePoiGeoresource_reachabilityAnalysis($scope.domId, poiGeoresource);
				kommonitorReachabilityHelperService.settings.loadingData = false;
			};

			$scope.refreshPoiLayers = async function () {
				for (var poi of kommonitorDataExchangeService.availableGeoresources) {
					if (poi.isSelected_reachabilityAnalysis) {
						//remove POI layer from map
						$scope.removePoiLayerFromMap(poi);

						poi = await $scope.fetchGeoJSONForDate(poi);

						// remove layer and add layer again
						$scope.addPoiLayerToMap(poi);
					}
				}
			};

			$scope.onClickUseIndicatorTimestamp = function () {
				kommonitorReachabilityHelperService.settings.dateSelectionType.selectedDateType = kommonitorReachabilityHelperService.settings.dateSelectionType_valueIndicator;

				$scope.refreshSelectedGeoresources();
			};

			$scope.timeout_manualdate;

			function isNoValidDate(dateCandidate) {
				var dateComps = dateCandidate.split("-");

				if (dateComps.length < 3) {
					return true;
				}
				else if (!dateComps[0] || !dateComps[1] || !dateComps[2]) {
					return true;
				}
				else if (isNaN(dateComps[0]) || isNaN(dateComps[1]) || isNaN(dateComps[2])) {
					return true;
				}
				else if (Number(dateComps[1]) > 12 || Number(dateComps[2]) > 31) {
					return true;
				}

				return false;
			}

			$scope.onChangeManualDate = function () {
				// check if date is an actual date
				// if so then refresh selected layers

				// Clear the timeout if it has already been set.
				// This will prevent the previous task from executing
				// if it has been less than <MILLISECONDS>
				clearTimeout($scope.timeout_manualdate);

				// Make a new timeout set to go off in 1000ms (1 second)
				$scope.timeout_manualdate = setTimeout(function () {
					var dateCandidate = kommonitorReachabilityHelperService.settings.selectedDate_manual;

					if (isNoValidDate(dateCandidate)) {
						return;
					}

					$timeout(function () {

						$scope.loadingData = true;
						
					});

					$timeout(function () {

						$scope.refreshSelectedGeoresources();
					}, 250);
				}, 1000);

			};

			$scope.onChangeManualDate_isochroneConfig = function () {
				// check if date is an actual date
				// if so then refresh selected layers

				// Clear the timeout if it has already been set.
				// This will prevent the previous task from executing
				// if it has been less than <MILLISECONDS>
				clearTimeout($scope.timeout_manualdate);

				// Make a new timeout set to go off in 1000ms (1 second)
				$scope.timeout_manualdate = setTimeout(function () {
					var dateCandidate = kommonitorReachabilityHelperService.settings.isochroneConfig.selectedDate_manual;

					if (isNoValidDate(dateCandidate)) {
						return;
					}

					if (!$scope.isUsedInReporting) {
						$scope.fetchGeoJSONForIsochrones();
					}

					// $timeout(function(){

					// 	$scope.loadingData = true;
					// 	
					// });

					// $timeout(function(){

					// 	$scope.fetchGeoJSONForIsochrones();
					// }, 250);	
				}, 1000);

			};

			$scope.$on("selectedIndicatorDateHasChanged", function (event) {

				console.log("refresh selected georesource layers according to new date");

				// only refresh georesources if sync with indicator timestamp is selected
				if (!kommonitorReachabilityHelperService.settings.dateSelectionType.selectedDateType.includes(kommonitorReachabilityHelperService.settings.dateSelectionType_valueIndicator)) {
					return;
				}

				$timeout(function () {

					$scope.loadingData = true;
					
				});

				$timeout(function () {

					$scope.refreshSelectedGeoresources();
				}, 250);
			});

			$scope.refreshSelectedGeoresources = async function () {
				for (const georesource of kommonitorDataExchangeService.availableGeoresources) {
					if (georesource.isSelected_reachabilityAnalysis) {

						if (georesource.isPOI) {
							georesource.isSelected_reachabilityAnalysis = false;
							await $scope.handlePoiForAnalysis(georesource);
							georesource.isSelected_reachabilityAnalysis = true;
							await $scope.handlePoiForAnalysis(georesource);
						}

					}
				}

				$scope.loadingData = false;
				
			};

			$scope.onChangeSelectedDate = async function (georesourceDataset) {
				// only if it s already selected, we must modify the shown dataset 


				if (georesourceDataset.isSelected_reachabilityAnalysis) {
					// depending on type we must call different methods
					if (georesourceDataset.isPOI) {
						georesourceDataset.isSelected_reachabilityAnalysis = false;
						await $scope.handlePoiForAnalysis(georesourceDataset);
						georesourceDataset.isSelected_reachabilityAnalysis = true;
						await $scope.handlePoiForAnalysis(georesourceDataset);
					}
				}
			};


			$(window).on('resize', function () {
				var chart_entries = $scope.echartsInstances_reachabilityAnalysis.entries();

				var nextChartInstanceEntry = chart_entries.next();
				while (nextChartInstanceEntry.value) {

					var nextChartInstance = nextChartInstanceEntry.value[1];
					if (nextChartInstance != null && nextChartInstance != undefined) {
						nextChartInstance.resize();
					}
					nextChartInstanceEntry = chart_entries.next();
				}


			});

		}
	]
});


