angular.module('reachabilityScenarioConfiguration').component('reachabilityScenarioConfiguration', {
	templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/reachabilityScenarioModal/reachabilityScenarioConfiguration/reachability-scenario-configuration.template.html",
	controller: ['kommonitorDataExchangeService',
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorReachabilityHelperService', 'kommonitorSingleFeatureMapHelperService',
		function ReachabilityScenarioConfigurationController(kommonitorDataExchangeService,
			$scope, $rootScope, $http, __env, $timeout, kommonitorReachabilityHelperService, kommonitorSingleFeatureMapHelperService) {

			this.kommonitorReachabilityHelperServiceInstance = kommonitorReachabilityHelperService;
			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			//this.kommonitorMapServiceInstance = kommonitorMapService;

			$('#manualDateDatepicker_reachabilityConfig').datepicker(kommonitorDataExchangeService.datePickerOptions);

			$scope.isUsedInReporting = false;

			$scope.initIsochronesFeaturesGeoMap = async function () {
				let domId = "reachabilityScenarioIsochroneGeoMap";
				let resourceType = kommonitorSingleFeatureMapHelperService.resourceType_polygon;
				kommonitorSingleFeatureMapHelperService.initSingleFeatureGeoMap(domId, resourceType);

				// add data layer to singleFeatureMap
				// kommonitorSingleFeatureMapHelperService.addDataLayertoSingleFeatureGeoMap($scope.currentScenarioDataset.poiResource.geoJSON);

			};

			// init empty map
			$scope.initIsochronesFeaturesGeoMap();

			let input = document.getElementById("isochroneCutInput");
			input.addEventListener("keypress", function isInputAllowed(evt) {
				var code = (evt.keyCode ? evt.keyCode : evt.which);
				if (code == 8) { //Backspace key press
					return true;
				} else {
					var ch = String.fromCharCode(evt.which);
					if (!(/[0-9,]/.test(ch))) {
						evt.preventDefault();
					}
				}
			});

			$scope.error = undefined;

			/**
			* start points that were drawn manually
			* direct GeoJSON structure
			*/
			kommonitorReachabilityHelperService.settings.manualStartPoints = undefined;

			/**
			 * Indicator if multiple starting-points shall
			 * be used.
			 */
			kommonitorReachabilityHelperService.settings.useMultipleStartPoints = false;

			/**
				 * The calculation unit-indicator.
				 */
			kommonitorReachabilityHelperService.settings.unit = 'Meter';

			/**
			 * The maximum distance or time for the current
			 * vehicle. The unit of the stored value can be
			 * found in the variable 'unit'.
			 */
			$scope.max_value = 5000;



			/**
			 * Variable that stores 'true' if the time-selection
			 * shall be shown or 'false' if not.
			 */
			$scope.isTime = false;



			/*
			 * array of arrays of lon, lat
			 * [[lon,lat],[lon,lat]]
			 */
			kommonitorReachabilityHelperService.settings.locationsArray = [];

			// If the reporting modal is shown we want to integrate this component there.
			// A couple of modifications need to be done to achieve that.
			// These are controlled by setting a variable and checking it when needed.
			$('#reporting-modal').on('hidden.bs.modal', function (e) {
				$scope.isUsedInReporting = false;
				$scope.$digest();
			})

			$scope.$on("reportingPoiLayerSelected", function (event, data) {
				$scope.isUsedInReporting = true;
				kommonitorReachabilityHelperService.settings.selectedStartPointLayer = data;
				$scope.$digest();
			});

			$scope.resetForm = function () {
				$scope.resetSlider();

				$scope.error = undefined;

				kommonitorReachabilityHelperService.resetSettings();

				$scope.changeStartPointsSource_fromLayer();				

				$scope.rangeArray = [];

				$scope.isTime = false;

				$scope.removePotentialDrawnStartingPoints();

				$scope.error = undefined;


				setTimeout(function () {
					$scope.$digest();
				}, 200);
			};

			/**
			 * TODO
			 */
			$scope.removeReachabilityLayers = function () {
				kommonitorReachabilityHelperService.settings.loadingData = true;
				$rootScope
					.$broadcast('showLoadingIconOnMap');

				kommonitorMapService
					.removeReachabilityLayers();
				kommonitorReachabilityHelperService.currentIsochronesGeoJSON = undefined;
				kommonitorDataExchangeService.isochroneLegend = undefined;
				// remove any diagram
				$rootScope.$broadcast("resetPoisInIsochrone");
				kommonitorReachabilityHelperService.settings.loadingData = false;
				$rootScope
					.$broadcast('hideLoadingIconOnMap');
			};

			/**
					 * TODO
					 */
			$scope.prepareDownloadGeoJSON = function () {

				if (kommonitorReachabilityHelperService.currentIsochronesGeoJSON) {
					$scope.prepareIsochroneDownload();
				}

			};

			$scope.prepareIsochroneDownload = function () {
				console.log('removing old download button if available')
				if (document
					.getElementById('downloadReachabilityIsochrones'))
					document
						.getElementById(
							'downloadReachabilityIsochrones')
						.remove();

				var geoJSON_string = JSON
					.stringify(kommonitorReachabilityHelperService.currentIsochronesGeoJSON);

				var fileName = 'Erreichbarkeitsisochronen_via-' +
					kommonitorReachabilityHelperService.settings.transitMode +
					'_Abbruchkriterium-' +
					kommonitorReachabilityHelperService.settings.focus + '.geojson';

				var blob = new Blob([geoJSON_string], {
					type: 'application/json'
				});
				var data = URL.createObjectURL(blob);

				console.log('create new Download button and append it to DOM');
				var a = document.createElement('a');
				a.download = fileName;
				a.href = data;
				a.textContent = 'Download Isochronen';
				a.id = 'downloadReachabilityIsochrones';
				a.setAttribute('class', 'btn btn-s btn-info');

				let elements = document.getElementsByClassName(
					'reachabilityIsochroneButtonSection');

				for (const element of elements) {
					element.appendChild(a);
				}
			};

			/**
					 * Changes the focus of the analysis between
					 * distance and time.
					 */
			$scope.changeFocus = function (value) {

				if (value === 'time' && kommonitorReachabilityHelperService.settings.transitMode === "buffer") {
					kommonitorReachabilityHelperService.settings.focus = 'distance'
					$scope.isTime = false;
					kommonitorReachabilityHelperService.settings.unit = 'Meter';
					$scope.changeValues();
					return;
				}

				$scope.resetSlider();

				if (kommonitorReachabilityHelperService.settings.focus == 'distance') {
					$scope.isTime = false;
					kommonitorReachabilityHelperService.settings.unit = 'Meter';
				}
				else if (kommonitorReachabilityHelperService.settings.focus == 'time') {
					kommonitorReachabilityHelperService.settings.unit = 'Minuten';
					$scope.isTime = true;
				}

				$scope.changeValues();

				$timeout(function(){
					$scope.$digest();
				});				
			};

			/**
			 * Resets the slider for the distance-/time to initial values.
			 */
			$scope.resetSlider = function () {
				kommonitorReachabilityHelperService.settings.currentTODValue = 1;
			};

			/**
			 * Changes the vehicle type according to an
			 * action on the related buttons.
			 */
			$scope.changeType = function () {
				$scope.changeValues();
				$scope.resetSlider();
			};

			/**
			 * Changes the max_value depending on the
			 * selected vehicle type.
			 */
			$scope.changeValues = function () {
				if (kommonitorReachabilityHelperService.settings.transitMode == 'buffer') {
					kommonitorReachabilityHelperService.settings.focus = 'distance';
					$("#focus_distance").click();
					if (kommonitorReachabilityHelperService.settings.focus == 'distance')
						$scope.max_value = 5000;
					else
						$scope.max_value = 25;
				}

				if (kommonitorReachabilityHelperService.settings.transitMode == 'foot-walking') {
					if (kommonitorReachabilityHelperService.settings.focus == 'distance')
						$scope.max_value = 5000;
					else
						$scope.max_value = 25;
				}


				if (kommonitorReachabilityHelperService.settings.transitMode == 'cycling-regular') {
					if (kommonitorReachabilityHelperService.settings.focus == 'distance')
						$scope.max_value = 5000;
					else
						$scope.max_value = 20;
				}


				if (kommonitorReachabilityHelperService.settings.transitMode == 'driving-car') {
					if (kommonitorReachabilityHelperService.settings.focus == 'distance')
						$scope.max_value = 5000;
					else
						$scope.max_value = 15;
				}

				if (kommonitorReachabilityHelperService.settings.transitMode == 'wheelchair') {
					if (kommonitorReachabilityHelperService.settings.focus == 'distance')
						$scope.max_value = 5000;
					else
						$scope.max_value = 25;
				}

			};

			$scope.onClickPerDataset_isochroneConfig = function () {
				$timeout(function () {
					if (!kommonitorReachabilityHelperService.settings.isochroneConfig.selectedDate) {
						kommonitorReachabilityHelperService.settings.isochroneConfig.selectedDate = kommonitorReachabilityHelperService.settings.selectedStartPointLayer.availablePeriodsOfValidity[kommonitorReachabilityHelperService.settings.selectedStartPointLayer.availablePeriodsOfValidity.length - 1];
					}
					if (!$scope.isUsedInReporting) {
						kommonitorReachabilityHelperService.fetchGeoJSONForIsochrones();
					}
				}, 500);
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
			 * accessible via the scope. The request URL
			 * will be build by this values and send towards
			 * the routing-API. The result will be handled,
			 * stored in the related scope- variables and
			 * displayed in the KM GUI.
			 * 
			 * If this method is fired from within the reporting modal
			 * ($scope.isUsedInReporting = true) the result is not added to the main map,
			 * but returned to the reporting component per broadcast.
			 */
			$scope.startAnalysis = function () {

				$timeout(function () {
					// Any code in here will automatically have an $scope.apply() run afterwards 
					if (!$scope.isUsedInReporting) { // reporting uses it's own loading overlay, which is controlled there
						kommonitorReachabilityHelperService.settings.loadingData = true;
						$rootScope.$broadcast("showLoadingIconOnMap");
					}
					// And it just works! 
				}, 50);

				$timeout(function () {
					$scope.error = undefined;

					kommonitorReachabilityHelperService.startIsochroneCalculation($scope.isUsedInReporting);

				}, 150);

			};

			$rootScope.$on("isochronesCalculationFinished", function(){
				$scope
					.prepareDownloadGeoJSON();

				// add data to interactive map
				kommonitorSingleFeatureMapHelperService.addDataLayertoSingleFeatureGeoMap(kommonitorReachabilityHelperService.currentIsochronesGeoJSON);
			});

		}
	]
});


