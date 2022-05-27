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
				'$timeout',
				'kommonitorMapService',
				'kommonitorDataExchangeService',
				'kommonitorDiagramHelperService',
				'__env',
				/**
				 * TODO
				 */
				function kommonitorReachabilityController($scope,
					$rootScope, $http, $timeout, kommonitorMapService,
					kommonitorDataExchangeService, kommonitorDiagramHelperService,__env) {

					//$("[data-toggle=tooltip]").tooltip();

					$scope.isUsedInReporting = false;

					// initialize any adminLTE box widgets
					$('.box').boxWidget();

					var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;

					 $scope.openStreetMapProvider = new OpenStreetMapProvider(    
						{
						  params: {
							'accept-language': 'de', // render results in Dutch
							countrycodes: 'de', // limit search results to the Netherlands
							addressdetails: 1, // include additional address detail parts  
							viewbox: "" + (Number(__env.initialLongitude) - 0.001) + "," + (Number(__env.initialLatitude) - 0.001) + "," + (Number(__env.initialLongitude) + 0.001) + "," + (Number(__env.initialLatitude) + 0.001)             
						  },
						  searchUrl: __env.targetUrlToGeocoderService + '/search',
						  reverseUrl: __env.targetUrlToGeocoderService + '/reverse'
						}
					  );

					const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
					this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
					this.kommonitorDiagramHelperServiceInstance = kommonitorDiagramHelperService;
					this.kommonitorMapServiceInstance = kommonitorMapService;
					$scope.targetUrlToReachabilityService_ORS = __env.targetUrlToReachabilityService_ORS;
					var numberOfDecimals = __env.numberOfDecimals;

					$scope.currentIsochronesGeoJSON = undefined;
					$scope.currentRouteGeoJSON = undefined;
					$scope.error = undefined;

					$scope.echartsInstances_reachabilityAnalysis = new Map();

					/**
					* a delay object for geosearch input
					*/
					$scope.delay = undefined;

					$scope.geosearchResults_startingPoint;
					$scope.geosearchResults_endPoint;

					$scope.settings = {};

					$scope.settings.usePreconfigRanges_500_1000 = false;

					$scope.settings.dateSelectionType_valueIndicator = "date_indicator";
								$scope.settings.dateSelectionType_valueManual = "date_manual";
								$scope.settings.dateSelectionType_valuePerDataset = "date_perDataset";
								$scope.settings.dateSelectionType = {
									selectedDateType: $scope.settings.dateSelectionType_valuePerDataset
								};

					$scope.settings.selectedDate_manual = undefined;

					$scope.settings.isochroneConfig = {};
					$scope.settings.isochroneConfig.dateSelectionType_valueIndicator = "date_indicator";
								$scope.settings.isochroneConfig.dateSelectionType_valueManual = "date_manual";
								$scope.settings.isochroneConfig.dateSelectionType_valuePerDataset = "date_perDataset";
								$scope.settings.isochroneConfig.dateSelectionType = {
									selectedDateType: $scope.settings.isochroneConfig.dateSelectionType_valuePerDataset
								};

					$scope.settings.isochroneConfig.selectedDate_manual = undefined;
					$('#manualDateDatepicker_reachabilityAnalysis').datepicker(kommonitorDataExchangeService.datePickerOptions);
					$('#manualDateDatepicker_reachabilityConfig').datepicker(kommonitorDataExchangeService.datePickerOptions);


					$scope.routeDistance_km = undefined;
					$scope.routeDuration_minutes = undefined;


					/**
					 * Show the isochrone-calculation-div if this
					 * value is set to 'true', if the value is set
					 * to 'false' the routing between different
					 * points shall be displayed.
					 */
					$scope.showIsochrones = true;

					$scope.settings.dissolveIsochrones = true;

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
					$scope.settings.routingStartPointInput = undefined;
					$scope.settings.routingEndPointInput = undefined;

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
					$scope.settings.transitMode = 'buffer';

					/**
					 * The focus of the analysis. Valid values are:
					 * 'distance' and 'time'. TODO : Starke
					 * Ueberschneidung mit der Variablen 'focus',
					 * die im Grunde genau das gleiche speichert.
					 */
					$scope.settings.focus = 'distance';

					/**
					 * config of starting points source (layer or manual draw) for isochrones
					 */
					$scope.settings.startPointsSource = "fromLayer";

					/**
					* selected start point layer for isochrone computation
					* GeoJSON within property .geoJSON
					*/
					$scope.settings.selectedStartPointLayer = undefined;

					/**
					* start points that were drawn manually
					* direct GeoJSON structure
					*/
					$scope.manualStartPoints = undefined;

					/**
					* indicator wheather the isochrone point source is configured
					*/
					$scope.pointSourceConfigured = false;

					/**
					 * The analysis speed (for the current vehicle)
					 * in km/h.
					 */
					$scope.settings.speedInKilometersPerHour = 3;

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
					$scope.settings.loadingData = false;

					/**
					 * The calculation unit-indicator.
					 */
					$scope.unit = 'Meter';

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
					$scope.settings.currentTODValue = 1;

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
					$scope.settings.preference = "fastest";

					/*
					 * array of arrays of lon, lat
					 * [[lon,lat],[lon,lat]]
					 */
					$scope.locationsArray = [];

					$scope.settings.isochroneInput = undefined;

					/**
					 * TODO
					 */
					var isochronesGETParameter = 'profile=foot-walking&units=m&location_type=start&locations=7.268504,51.448405&range_type=time&range=300,600,900&attributes=area|reachfactor&options={"maximum_speed":3}';

					/**
					 * TODO
					 */
					var createRoutingRequest = function(transitMode, preference, routingStartPointInput, routingEndPointInput){
						var locString = routingStartPointInput+'%7C'+routingEndPointInput;

						// if user never clicked transit mode set standard 
						if(transitMode === "buffer"){
							transitMode = "foot-walking";
						}
						
						// var getRequest = $scope.targetUrlToReachabilityService_ORS
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

						var getRequest = $scope.targetUrlToReachabilityService_ORS
							+ '/v2/directions/' + transitMode + '?'
							+ 'start=' + routingStartPointInput 
							+ '&end=' + routingEndPointInput;

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
								if($scope.settings.focus=='time')
									cValue = cValue*60;
								rangeString += cValue;

								if (i != rangeArray.length - 1) {
									rangeString += ',';
								}
							};

						var optionsString = '{"maximum_speed":' + speedInKilometersPerHour + '}';

						// var constantParameters = '&units=m&location_type=start&range_type=time';
						// encode pipe symbol manually via %7C

						var constantParameters = '&smoothing=0&units=m&location_type=start&range_type=' +
								$scope.settings.focus+'&attributes=area%7Creachfactor';

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
					};

					// If the reporting modal is shown we want to integrate this component there.
					// A couple of modifications need to be done to achieve that.
					// These are controlled by setting a variable and checking it when needed.
					$('#reporting-modal').on('shown.bs.modal', function (e) {
						$scope.isUsedInReporting = true;
						$scope.$digest();
					})
			
					$('#reporting-modal').on('hidden.bs.modal', function (e) {
						$scope.isUsedInReporting = false;
						$scope.$digest();
					})

					$scope.$on("reportingPoiLayerSelected", function(event, data) {
						$scope.settings.selectedStartPointLayer = data;
						$scope.pointSourceConfigured = true; // timestamp selection is hidden, so we are good to go for now.
					});
					

					$scope.resetPoisInIsochrone = function(){
						$scope.echartsInstances_reachabilityAnalysis = new Map();
						document.getElementById("reachability_diagrams_section").innerHTML = "";
						for (var poi of kommonitorDataExchangeService.availableGeoresources){							
							if (poi.isSelected_reachabilityAnalysis){
								poi.isSelected_reachabilityAnalysis = false;
								//remove POI layer from map
								$scope.removePoiLayerFromMap(poi);
							}
						}
					};

					$scope.resetForm = function(){
						$scope.resetSlider();

						$scope.resetPoisInIsochrone();

						$scope.error = undefined;

						$scope.settings = {};

						$scope.settings = {};

						$scope.settings.usePreconfigRanges_500_1000 = false;

						$scope.settings.dateSelectionType_valueIndicator = "date_indicator";
									$scope.settings.dateSelectionType_valueManual = "date_manual";
									$scope.settings.dateSelectionType_valuePerDataset = "date_perDataset";
									$scope.settings.dateSelectionType = {
										selectedDateType: $scope.settings.dateSelectionType_valuePerDataset
									};

						$scope.settings.selectedDate_manual = undefined;

						$scope.settings.isochroneConfig = {};
						$scope.settings.isochroneConfig.dateSelectionType_valueIndicator = "date_indicator";
									$scope.settings.isochroneConfig.dateSelectionType_valueManual = "date_manual";
									$scope.settings.isochroneConfig.dateSelectionType_valuePerDataset = "date_perDataset";
									$scope.settings.isochroneConfig.dateSelectionType = {
										selectedDateType: $scope.settings.isochroneConfig.dateSelectionType_valuePerDataset
									};

						$scope.settings.isochroneConfig.selectedDate_manual = undefined;

						$scope.showIsochrones = true;
						$scope.settings.dissolveIsochrones = true;
						document.getElementById("btn_isochrones").click();
						$scope.settings.transitMode = 'buffer';
						document.getElementById("optBuffer").click();
						$scope.settings.focus = 'distance';
						document.getElementById("focus_distance").click();
						$scope.settings.startPointsSource = "fromLayer";
						$scope.changeStartPointsSource_fromLayer();
						document.getElementById("startPointsSource_layer").click();
						$scope.settings.selectedStartPointLayer = undefined;
						$scope.pointSourceConfigured = false;
						$scope.settings.speedInKilometersPerHour = 3;
						$scope.useMultipleStartPoints = false;
						$scope.settings.loadingData = false;
						$scope.unit = 'Meter';
						$scope.settings.currentTODValue = 1;
						$scope.isTime = false;
						$scope.settings.preference = "fastest";
						$scope.locationsArray = [];

						$scope.rangeArray = [];

						$scope.removePotentialDrawnStartingPoints();

						$scope.routeDistance_km = undefined;
						$scope.routeDuration_minutes = undefined;

						$scope.currentIsochronesGeoJSON = undefined;
						$scope.currentRouteGeoJSON = undefined;
						$scope.error = undefined;

						$scope.geosearchResults_startingPoint;
						$scope.geosearchResults_endPoint;

						$scope.routingStartPoint = undefined;
						$scope.routingEndPoint = undefined;

						$scope.settings.routingStartPointInput = undefined;
						$scope.settings.routingEndPointInput = undefined;

						setTimeout(function(){
							$scope.$digest();
						}, 200);
					};

					$scope.removePotentialDrawnStartingPoints = function(){
						// TODO
						$scope.manualStartPoints = undefined;
						$scope.disablePointDrawTool();
						$scope.removeAllDrawnPoints();
					};

					/**
					 * TODO
					 */
					$scope.removeReachabilityLayers = function() {
						$scope.settings.loadingData = true;
						$rootScope
							.$broadcast('showLoadingIconOnMap');

						kommonitorMapService
							.removeReachabilityLayers();
						$scope.currentIsochronesGeoJSON = undefined;
						kommonitorDataExchangeService.isochroneLegend = undefined;
						// remove any diagram
						$scope.resetPoisInIsochrone();
						$scope.settings.loadingData = false;
						$rootScope
							.$broadcast('hideLoadingIconOnMap');
					};

					$scope.removeRoutingLayers = function() {
						$scope.settings.loadingData = true;
						$rootScope
							.$broadcast('showLoadingIconOnMap');

						kommonitorMapService
							.removeRoutingLayers();
						$scope.currentRouteGeoJSON = undefined;
						kommonitorDataExchangeService.routingLegend = undefined;
						$scope.settings.loadingData = false;
						$rootScope
							.$broadcast('hideLoadingIconOnMap');
					};

					/**
					 * TODO
					 */
					$scope.prepareDownloadGeoJSON = function() {

						if($scope.currentIsochronesGeoJSON){
								$scope.prepareIsochroneDownload();
						}
						if($scope.currentRouteGeoJSON){
								$scope.prepareRouteDownload();
						}

					};

					$scope.prepareIsochroneDownload = function(){
						console.log('removing old download button if available')
						if (document
							.getElementById('downloadReachabilityIsochrones'))
							document
							.getElementById(
								'downloadReachabilityIsochrones')
							.remove();

						var geoJSON_string = JSON
							.stringify($scope.currentIsochronesGeoJSON);

						var fileName = 'Erreichbarkeitsisochronen_via-' +
							$scope.settings.transitMode +
							'_Abbruchkriterium-' +
							$scope.settings.focus + '.geojson';

						var blob = new Blob([geoJSON_string], {
							type: 'application/json'
						});
						var data = URL.createObjectURL(blob);

						console.log('create new Download button and append it to DOM');
						var a = document.createElement('a');
						a.download = fileName;
						a.href = data;
						a.textContent = 'Download Isochronen als GeoJSON';
						a.id = 'downloadReachabilityIsochrones';
						a.setAttribute('class', 'btn btn-info');

						let elements = document.getElementsByClassName(
								'reachabilityIsochroneButtonSection');

						for (const element of elements) {
							element.appendChild(a);
						}
					};

					$scope.prepareRouteDownload = function(){
						console.log('removing old download button if available')
						if (document
							.getElementById('downloadReachabilityRoute'))
							document
							.getElementById(
								'downloadReachabilityRoute')
							.remove();

						var geoJSON_string = JSON
							.stringify($scope.currentRouteGeoJSON);

						var fileName = 'Routing-Ergebnis.geojson';

						var blob = new Blob([geoJSON_string], {
							type: 'application/json'
						});
						var data = URL.createObjectURL(blob);

						console.log('create new Download button and append it to DOM');
						var a = document.createElement('a');
						a.download = fileName;
						a.href = data;
						a.textContent = 'Download Route als GeoJSON';
						a.id = 'downloadReachabilityRoute';
						a.setAttribute('class', 'btn btn-info');

							let elements = document.getElementsByClassName(
								'reachabilityRouteButtonSection');

						for (const element of elements) {
							element.appendChild(a);
						}
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
					$scope.changeFocus = function(value) {

						if(value === 'time' && $scope.settings.transitMode === "buffer") {
							$scope.settings.focus = 'distance'
							$scope.isTime=false;
							$scope.unit = 'Meter';
							$scope.changeValues();
							return;
						}

						$scope.resetSlider();

						if ($scope.settings.focus=='distance'){
							$scope.isTime=false;
							$scope.unit = 'Meter';
						}
						else if ($scope.settings.focus=='time'){
							$scope.unit = 'Minuten';
							$scope.isTime=true;
						}

						$scope.changeMinMaxSpeed();
						$scope.changeValues();
					};

					/**
					 * Changes the start points source of the analysis between
					 * fromLayer and manualDraw.
					 */
					$scope.changeStartPointsSource_fromLayer = function() {

						$scope.disablePointDrawTool();	
						$scope.settings.startPointsSource = "fromLayer";					

					};
					$scope.changeStartPointsSource_manual = function() {

						$scope.enablePointDrawTool();
						$scope.settings.startPointsSource = "manual";

					};

					$scope.removeAllDrawnPoints = function(){
						// TODO

						$rootScope.$broadcast("removeAllDrawnPoints");
					};

					$scope.enablePointDrawTool = function(){
						// add/activate leaflet-draw toolbar for only POINT features

						$rootScope.$broadcast("enablePointDrawTool");
					};

					$scope.disablePointDrawTool = function(){
						// disable/hide leaflet-draw toolbar for only POINT features
						$rootScope.$broadcast("disablePointDrawTool");
					};

					$scope.$on("onUpdateDrawnPointFeatures", function (event, drawnPointsFeatureGroup) {

						// if drawnPointsFeatureGroup is empty or does not exist, we must catch that
						try{
							$scope.manualStartPoints = drawnPointsFeatureGroup.toGeoJSON();
							$scope.pointSourceConfigured = true;
						}
						catch (error){
							$scope.manualStartPoints = undefined;
							$scope.pointSourceConfigured = false;
						}

						setTimeout(function(){
								$scope.$digest();
						}, 150);
					});


					/**
					 * Resets the slider for the distance-/time and
					 * speed to initial values.
					 */
					$scope.resetSlider = function() {
						$scope.settings.speedInKilometersPerHour = $scope.minSpeedInKilometersPerHour;
						$scope.settings.currentTODValue = 1;
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
					 * Changes the max_value depending on the
					 * selected vehicle type.
					 */
					$scope.changeValues = function() {
						if ($scope.settings.transitMode == 'buffer'){
							$scope.settings.focus = 'distance';
							$("#focus_distance").click();
							if ($scope.settings.focus == 'distance')
								$scope.max_value = 5000;
							else
								$scope.max_value = 25;
						}

						if ($scope.settings.transitMode == 'foot-walking'){
							if ($scope.settings.focus == 'distance')
								$scope.max_value = 5000;
							else
								$scope.max_value = 25;
						}


						if ($scope.settings.transitMode == 'cycling-regular'){
							if ($scope.settings.focus == 'distance')
								$scope.max_value = 5000;
							else
								$scope.max_value = 20;
						}


						if ($scope.settings.transitMode == 'driving-car'){
							if ($scope.settings.focus == 'distance')
								$scope.max_value = 5000;
							else
								$scope.max_value = 15;
						}

						if ($scope.settings.transitMode == 'wheelchair'){
							if ($scope.settings.focus == 'distance')
								$scope.max_value = 5000;
							else
								$scope.max_value = 25;
						}

					};

					/**
					 * Changes the minimum and maximum
					 * speed-per-hour value depending on the current
					 * selected vehicle type.
					 */
					$scope.changeMinMaxSpeed = function() {
						if ($scope.settings.transitMode == 'buffer') {
							$scope.minSpeedInKilometersPerHour = 1;
							$scope.maxSpeedInKilometersPerHour = 6;
						}
						if ($scope.settings.transitMode == 'foot-walking') {
							$scope.minSpeedInKilometersPerHour = 1;
							$scope.maxSpeedInKilometersPerHour = 6;
						}
						if ($scope.settings.transitMode == 'cycling-regular') {
							$scope.minSpeedInKilometersPerHour = 10;
							$scope.maxSpeedInKilometersPerHour = 25;
						}
						if ($scope.settings.transitMode == 'driving-car') {
							$scope.minSpeedInKilometersPerHour = 30;
							$scope.maxSpeedInKilometersPerHour = 130;
						}
						if ($scope.settings.transitMode == 'wheelchair') {
							$scope.minSpeedInKilometersPerHour = 1;
							$scope.maxSpeedInKilometersPerHour = 6;
						}

						$scope.settings.speedInKilometersPerHour = $scope.minSpeedInKilometersPerHour;
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
						var split = $scope.settings.isochroneInput.split(',');
						var actVal;
						if (split.length > 0) {
							for (var a = 0; a < split.length; a++) {
								if (!isNaN(split[a])) {
									actVal = parseFloat(split[a]);
									if (!isNaN(actVal))
										$scope.rangeArray
										.push(actVal);
								}
							}
						}

						$scope.rangeArray.sort(function(a, b){return a-b;});
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
						// force active setting of transit mode foot-walking when changing to routing mode 
						$scope.settings.transitMode = "foot-walking";
						document.getElementById("optFeet").click();
						document.getElementById("optFeetRadioButtonLabel").classList.add('active');
						$timeout(function(){
							$scope.$digest();
						});
					};

					$scope.onClickPerDataset_isochroneConfig = function(){
						$timeout(function(){
							if(! $scope.settings.isochroneConfig.selectedDate){
								$scope.settings.isochroneConfig.selectedDate = $scope.settings.selectedStartPointLayer.availablePeriodsOfValidity[$scope.settings.selectedStartPointLayer.availablePeriodsOfValidity.length - 1];
							}
							if(!$scope.isUsedInReporting) {
								$scope.fetchGeoJSONForIsochrones();
							}
						}, 500);
					};

					$scope.fetchGeoJSONForIsochrones = async function(){
						if(! $scope.settings.selectedStartPointLayer){
							$scope.settings.loadingData = false;
							return;
						}

						// clear any previous results
						$scope.settings.selectedStartPointLayer.geoJSON = undefined;						

						var date;

						if($scope.settings.isochroneConfig.dateSelectionType.selectedDateType === $scope.settings.isochroneConfig.dateSelectionType_valuePerDataset){
							date = $scope.settings.isochroneConfig.selectedDate.startDate;
						}
						else if($scope.settings.isochroneConfig.dateSelectionType.selectedDateType === $scope.settings.isochroneConfig.dateSelectionType_valueManual){
							date = $scope.settings.isochroneConfig.selectedDate_manual;
						}
						else{
							date = kommonitorDataExchangeService.selectedDate;
						}

						if(! date){
							$scope.settings.loadingData = false;
							return;
						}
						
						
							$scope.settings.loadingData = true;
							var id = $scope.settings.selectedStartPointLayer.georesourceId;							

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

									$scope.settings.selectedStartPointLayer.geoJSON = geoJSON;

									$scope.settings.loadingData = false;
									$scope.pointSourceConfigured = true;

								}, function errorCallback(error) {
									// called asynchronously if an error occurs
									// or server returns response with an error status.
									$scope.pointSourceConfigured = false;
									$scope.settings.loadingData = false;
									console.error(error.statusText);
									kommonitorDataExchangeService.displayMapApplicationError(error);
									$scope.error = error.statusText;
							});						
					};

					$scope.onChangeSelectedStartPointLayer = async function(){
						$scope.settings.isochroneConfig.selectedDate = undefined;

						if(! $scope.settings.isochroneConfig.selectedDate){
							$scope.settings.isochroneConfig.selectedDate = $scope.settings.selectedStartPointLayer.availablePeriodsOfValidity[$scope.settings.selectedStartPointLayer.availablePeriodsOfValidity.length - 1];
						}

						if(!$scope.isUsedInReporting) {
							$scope.fetchGeoJSONForIsochrones();
						}
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
					$scope.startAnalysis = function() {

						$timeout(function(){ 
							// Any code in here will automatically have an $scope.apply() run afterwards 
							if(!$scope.isUsedInReporting) { // reporting uses it's own loading overlay, which is controlled there
								$scope.settings.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");
							}
							// And it just works! 
						  }, 50);

						  $timeout(function(){ 
							$scope.error = undefined;

							if ($scope.showIsochrones)
								$scope.startIsochroneCalculation();
							else
								$scope.startRoutingCalculation();
						  }, 150);

					};

					/**
					 * Starts the routing-calculation.
					 */
					$scope.startRoutingCalculation = function() {

						$scope.settings.loadingData = true;
						$rootScope.$broadcast("showLoadingIconOnMap");
						var startPointString = $scope.routingStartPoint.longitude + "," + $scope.routingStartPoint.latitude;
						var endPointString = $scope.routingEndPoint.longitude + "," + $scope.routingEndPoint.latitude;

						var url = createRoutingRequest($scope.settings.transitMode, $scope.settings.preference, startPointString, endPointString);
						// let coordinatesArray = [];
						// coordinatesArray.push(startPointString);
						// coordinatesArray.push(endPointString);
						// let postBody = {
						// 	"coordinates": coordinatesArray
						// };
						// let url = $scope.targetUrlToReachabilityService_ORS
						// + '/v2/directions/' + $scope.settings.transitMode + '/geojson';

						console.log("execute OpenRouteService routing request: " + url);

						var req = {
								method: 'GET',
								url: url,
								headers: {
									// 'Accept': 'application/json'
								}
							};

							$http(req)
							// $http.post(url, postBody)
								.then(
									function successCallback(
										response) {
										$scope.currentRouteGeoJSON = response.data;

										$scope.routeDistance_km = $scope.currentRouteGeoJSON.features[0].properties.summary.distance / 1000;
										$scope.routeDuration_minutes = Math.round($scope.currentRouteGeoJSON.features[0].properties.summary.duration / 60);


										// TODO : CDB
										kommonitorMapService
											.replaceRouteGeoJSON(
												$scope.currentRouteGeoJSON,
												$scope.settings.transitMode,
												$scope.settings.preference, $scope.routingStartPoint, $scope.routingEndPoint,
												$scope.routeDistance_km, $scope.routeDuration_minutes);
										$scope.prepareDownloadGeoJSON();
										$scope.settings.loadingData = false;
										$rootScope.$broadcast('hideLoadingIconOnMap');
									},
									function errorCallback(
										error) {
										// called asynchronously
										// if an error occurs
										// or server returns
										// response with an
										// error status.
										console.error(error.data.error.message);
										$scope.error = error.data.error.message;

										$scope.settings.loadingData = false;
										kommonitorDataExchangeService.displayMapApplicationError(error);
										$rootScope.$broadcast("hideLoadingIconOnMap");
									});
					};

					$scope.makeLocationsArrayFromStartPoints = function(){
						// array of arrays of lon,lat
						$scope.locationsArray = [];

						if($scope.settings.startPointsSource === "manual"){
							// establish from drawn points
							$scope.manualStartPoints.features.forEach(function(feature){
								$scope.locationsArray.push(feature.geometry.coordinates);
							});
						}
						else{
							// establish from chosen layer
							$scope.settings.selectedStartPointLayer.geoJSON.features.forEach(function(feature){
								$scope.locationsArray.push(feature.geometry.coordinates);
							});
						}

						return $scope.locationsArray;
					};

					/**
					 * Starts an isochrone-calculation.
					 */
					$scope.startIsochroneCalculation = async function() {
						if(!$scope.isUsedInReporting) { // reporting uses it's own loading overlay, which is controlled there
							$scope.settings.loadingData = true;
							$rootScope.$broadcast("showLoadingIconOnMap");
						}
						
						$scope.checkArrayInput();

						$scope.locationsArray = $scope.makeLocationsArrayFromStartPoints();	

						// SWITCH THE VALUE DEPENDING ON THE LENGTH
						// OF THE LOCATIONS ARRAY
						if ($scope.locationsArray.length > 1)
							$scope.useMultipleStartPoints = true;
						else
							$scope.useMultipleStartPoints = false;
						
						var resultIsochrones;

						if($scope.settings.transitMode === 'buffer'){
							resultIsochrones = await $scope.createBuffers();
						}
						else{
							resultIsochrones = await $scope.createIsochrones();
						}

						if($scope.isUsedInReporting) {
							// No need to add isochrones to main map.
							// Instead they are returned to reporting modal
							$scope.$emit("reportingIsochronesCalculationFinished", resultIsochrones)
							return;
						}

						$scope.currentIsochronesGeoJSON = resultIsochrones;


						kommonitorMapService.replaceIsochroneMarker($scope.locationsArray);
						kommonitorMapService
							.replaceIsochroneGeoJSON(
								$scope.currentIsochronesGeoJSON,
								$scope.settings.transitMode,
								$scope.settings.focus,
								$scope.rangeArray,
								$scope.useMultipleStartPoints,
								$scope.settings.dissolveIsochrones, 
								$scope.settings.speedInKilometersPerHour);
						$scope
							.prepareDownloadGeoJSON();

							$scope.settings.loadingData = false;
							$timeout(function(){
								$rootScope.$broadcast('hideLoadingIconOnMap');
							}, 500);
							

							$scope.$digest();
					};



					$scope.fetchIsochrones = async function(tempStartPointsArray){
						var url = createORSIsochroneRequest(
							$scope.settings.transitMode,
							tempStartPointsArray,
							$scope.rangeArray,
							$scope.settings.speedInKilometersPerHour);

						var req = {
							method: 'GET',
							url: url,
							headers: {
								// 'Accept': 'application/json'
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

									// dissolve features
									if ($scope.settings.dissolveIsochrones){
										try {
											var dissolved = turf.dissolve(response.data, {propertyName: 'value'});
											return dissolved;
										} catch (e) {
											console.error("Dissolving Isochrones failed with error: " + e);
											console.error("Will return undissolved isochrones");
											return response.data;
										} finally {

										}

									}
									else{
										return response.data;
									}

								},
								function errorCallback(
									error) {
									// called asynchronously
									// if an error occurs
									// or server returns
									// response with an
									// error status.
									console.error(error.data.error.message);
									$scope.error = error.data.error.message;
									$scope.settings.loadingData = false;
									kommonitorDataExchangeService.displayMapApplicationError(error);
									$rootScope.$broadcast("hideLoadingIconOnMap");
								});
					};

					$scope.createBuffers = function(){
						var resultIsochrones;

						var startingPoints_geoJSON;
						// create Buffers for each input and range definition
						if($scope.settings.startPointsSource === "manual"){
							// establish from drawn points
							startingPoints_geoJSON = $scope.manualStartPoints;
						}
						else{
							// establish from chosen layer
							startingPoints_geoJSON = $scope.settings.selectedStartPointLayer.geoJSON;
						}

						// range in meters
						for (const range of $scope.rangeArray) {
							var geoJSON_buffered = turf.buffer(startingPoints_geoJSON, Number(range)/1000, {units: 'kilometers', steps: 12});

							if(! geoJSON_buffered.features){
								// transform single feature to featureCollection
								geoJSON_buffered = turf.featureCollection([
									geoJSON_buffered
								  ]);
							}

							if ($scope.settings.dissolveIsochrones){
								try {
									geoJSON_buffered = turf.dissolve(geoJSON_buffered);
								} catch (e) {
									console.error("Dissolving Isochrones failed with error: " + e);
									console.error("Will return undissolved isochrones");
								} finally {

								}

							}

							// add property: value --> range
							if (geoJSON_buffered.features && geoJSON_buffered.features.length > 0){
								for (const feature of geoJSON_buffered.features) {
									feature.properties.value = range;
								}
							}

							if(! resultIsochrones){
								resultIsochrones = geoJSON_buffered;
							}
							else{
								resultIsochrones.features = resultIsochrones.features.concat(geoJSON_buffered.features);
							}
						}

						return resultIsochrones;
					};

					$scope.createIsochrones = async function(){
						var resultIsochrones;

						console.log('Calculating isochrones for ' +
							$scope.locationsArray.length +
							' start points.');

							var maxLocationsForORSRequest = 150;

						console.log("Number of Isochrone starting points is greater than the maximum number of locations (" + maxLocationsForORSRequest + "). Must split up starting points to make multiple requests. Result will contain all isochrones though.");
	
						var featureIndex = 0;
						// log progress for each 10% of features
						var logProgressIndexSeparator = Math.round($scope.locationsArray.length / 100 * 10);

						var countFeatures = 0;
						var tempStartPointsArray = [];
						for (var pointIndex=0; pointIndex < $scope.locationsArray.length; pointIndex++){
						tempStartPointsArray.push($scope.locationsArray[pointIndex]);
						countFeatures++;

						// if maxNumber of locations is reached or the last starting point is reached
						if(countFeatures === maxLocationsForORSRequest || pointIndex ===  $scope.locationsArray.length -1){
							// make request, collect results

							// responses will be GeoJSON FeatureCollections
							var tempIsochrones = await $scope.fetchIsochrones(tempStartPointsArray);

							if (! resultIsochrones){
							resultIsochrones = tempIsochrones;
							}
							else{
							// apend results of tempIsochrones to resultIsochrones
							resultIsochrones.features = resultIsochrones.features.concat(tempIsochrones.features);
							}
							// increment featureIndex
							featureIndex++;
							if(featureIndex % logProgressIndexSeparator === 0){
								console.log("PROGRESS: Computed isochrones for '" + featureIndex + "' of total '" + $scope.locationsArray.length + "' starting points.");
							}

							// reset temp vars
							tempStartPointsArray = [];
							countFeatures = 0;

						} // end if
						} // end for

						return resultIsochrones;

					};

					$scope.onChangeRoutingStartPoint = function(){

						// Clear the timeout if it has already been set.
				    // This will prevent the previous task from executing
				    // if it has been less than <MILLISECONDS>
				    clearTimeout($scope.delay);

						$scope.geosearchResults_startingPoint = undefined;

				    // Make a new timeout set to go off in 800ms
				    $scope.delay = setTimeout(function () {
				        console.log('Geosearch for Input String: ', $scope.settings.routingStartPointInput);

								$scope.openStreetMapProvider.search({ query: $scope.settings.routingStartPointInput })
								.then(function(result){
										$scope.geosearchResults_startingPoint = result;

										$scope.$digest();
								});

				    }, 500);
					};

					$scope.onClickGeosearchResult_startingPoint = function(geosearchResult){
						// result object from leaflet-geosearch

						// const result = {
						//   x: Number,                      // lon,
						//   y: Number,                      // lat,
						//   label: String,                  // formatted address
						//   bounds: [
						//     [Number, Number],             // s, w - lat, lon
						//     [Number, Number],             // n, e - lat, lon
						//   ],
						//   raw: {},                        // raw provider result
						// }

						$scope.routingStartPoint = {
							label: geosearchResult.label,
							longitude: geosearchResult.x,
							latitude: geosearchResult.y
						};

						// hide geosearch results to minimize page height
						$scope.geosearchResults_startingPoint = undefined;
					};

					$scope.onChangeRoutingEndPoint = function(){

						// Clear the timeout if it has already been set.
				    // This will prevent the previous task from executing
				    // if it has been less than <MILLISECONDS>
				    clearTimeout($scope.delay);

						$scope.geosearchResults_endPoint = undefined;

				    // Make a new timeout set to go off in 800ms
				    $scope.delay = setTimeout(function () {
				        console.log('Geosearch for Input String: ', $scope.settings.routingEndPointInput);

								$scope.openStreetMapProvider.search({ query: $scope.settings.routingEndPointInput })
								.then(function(result){
										$scope.geosearchResults_endPoint = result;

										$scope.$digest();
								});

				    }, 500);
					};

					$scope.onClickGeosearchResult_endPoint = function(geosearchResult){
						// result object from leaflet-geosearch

						// const result = {
						//   x: Number,                      // lon,
						//   y: Number,                      // lat,
						//   label: String,                  // formatted address
						//   bounds: [
						//     [Number, Number],             // s, w - lat, lon
						//     [Number, Number],             // n, e - lat, lon
						//   ],
						//   raw: {},                        // raw provider result
						// }

						$scope.routingEndPoint = {
							label: geosearchResult.label,
							longitude: geosearchResult.x,
							latitude: geosearchResult.y
						};

						// hide geosearch results to minimize page height
						$scope.geosearchResults_endPoint = undefined;
					};


					//////////////////////////// SECTION FOR GORESOURCE AND INDICATOR ANALYSIS

					$scope.getQueryDate = function(resource){
						if ($scope.settings.dateSelectionType.selectedDateType === $scope.settings.dateSelectionType_valueIndicator){
							return kommonitorDataExchangeService.selectedDate;
						}
						else if($scope.settings.dateSelectionType.selectedDateType === $scope.settings.dateSelectionType_valueManual){
							return $scope.settings.selectedDate_manual;
						}
						else if($scope.settings.dateSelectionType.selectedDateType === $scope.settings.dateSelectionType_valuePerDataset){
							return resource.selectedDate.startDate;
						}
						else{
							return kommonitorDataExchangeService.selectedDate;
						}
					};

					$scope.handlePoiForAnalysis = async function(poi){
						$scope.settings.loadingData = true;
						$rootScope.$broadcast("showLoadingIconOnMap");

						try {
							if(poi.isSelected_reachabilityAnalysis){
								poi = await $scope.fetchGeoJSONForDate(poi);
							}
	
							poi = await $scope.handlePoiOnDiagram(poi);
	
							if(kommonitorDataExchangeService.isDisplayableGeoresource(poi)){
								$scope.handlePoiOnMap(poi);
							}							
						} catch (error) {
							console.error(error);
						}
						
						$scope.settings.loadingData = false;
						$rootScope.$broadcast("hideLoadingIconOnMap");

						// as method is async we may call angular digest cycle
						setTimeout(() => {
							$scope.$digest();
						}, 250);
					};

					$scope.fetchGeoJSONForDate = function(poiGeoresource){
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
								$scope.settings.loadingData = false;
								kommonitorDataExchangeService.displayMapApplicationError(error);
								$rootScope.$broadcast("hideLoadingIconOnMap");
						});
					};

					$scope.handlePoiOnDiagram = async function(poi){
						if(poi.isSelected_reachabilityAnalysis){
							// maps range value to result GeoJSON
							var pointsPerIsochroneRangeMap = await $scope.computePoisWithinIsochrones(poi);
							$scope.addOrReplaceWithinDiagrams(poi, pointsPerIsochroneRangeMap);
							// now filter the geoJSON to only include those datasets that are actually inside any isochrone
							poi = filterGeoJSONPointsInsideLargestIsochrone(poi, pointsPerIsochroneRangeMap);
						}
						else{
							//remove POI layer from map
							$scope.removePoiFromDiagram(poi);
						}

						return poi;
					};

					function filterGeoJSONPointsInsideLargestIsochrone(poi, pointsPerIsochroneRangeMap){
						var keyIter = pointsPerIsochroneRangeMap.keys();

						var nextKey = keyIter.next();

						var largestRange;

						while(nextKey.value){
							var nextRange = nextKey.value;
							if (! largestRange){
								largestRange = Number(nextRange);
							}
							else if (largestRange < Number(nextRange)){
								largestRange = Number(nextRange);
							}
							
							nextKey = keyIter.next();
						}

						poi.geoJSON = pointsPerIsochroneRangeMap.get(largestRange);

						return poi;
					}

					$scope.computePoisWithinIsochrones = async function(poi){
						var pointsPerIsochroneRangeMap = $scope.initializeMapWithRangeKeys();
						if (! poi.geoJSON){
							poi = await $scope.fetchGeoJSONForDate(poi);
						}

						// as there might be mutliple isochrone ranges
						// we must perform point in polygon for each range
						var keyIter = pointsPerIsochroneRangeMap.keys();

						var nextKey = keyIter.next();

						while(nextKey.value){
							var nextKeyValue = nextKey.value;

							var geoJSON_featureCollection = $scope.computePoisWithinIsochrone(nextKeyValue, poi);
							pointsPerIsochroneRangeMap.set(nextKeyValue, geoJSON_featureCollection);
							nextKey = keyIter.next();
						}
						
						return pointsPerIsochroneRangeMap;
					};

					$scope.computePoisWithinIsochrone = function(rangeValue, poi){
						// create clones of poi geoJSON and isochrone geoJSON
						var isochrones_geoJSON_clone = JSON.parse(JSON.stringify($scope.currentIsochronesGeoJSON));
						var poi_geoJSON_clone = JSON.parse(JSON.stringify(poi.geoJSON));
					
						// filter isochrone geoJSON clone by range value
						isochrones_geoJSON_clone.features = isochrones_geoJSON_clone.features.filter(feature => {
							return String(feature.properties.value) === String(rangeValue);
						});

						// filter poi geoJSON clone by spatial within isochrone
						var pointsWithinIsochrones = turf.pointsWithinPolygon(poi_geoJSON_clone, isochrones_geoJSON_clone);
						
						return pointsWithinIsochrones;
					};


					$scope.initializeMapWithRangeKeys = function(){
						var map = new Map();

						for (const feature of $scope.currentIsochronesGeoJSON.features) {
							map.set(feature.properties.value, null);
						}

						return map;
					};

					

					$scope.addOrReplaceWithinDiagrams = function(poi, pointsPerIsochroneRangeMap){
						var mapEntries = pointsPerIsochroneRangeMap.entries();
						
						var nextEntry = mapEntries.next();
						while(nextEntry.value){
							
							var nextEntry_keyRange = nextEntry.value[0];
							var nextEntry_valueGeoJSON = nextEntry.value[1];
							var numberOfFeatures = 0;

							var nextEntry_keyRange_label = nextEntry_keyRange;
							if($scope.settings.focus == 'time'){
								// compute seconds to minutes for display
								nextEntry_keyRange_label = nextEntry_keyRange_label / 60;
							}

							if(nextEntry_valueGeoJSON){
								numberOfFeatures = nextEntry_valueGeoJSON.features.length;
							}
							console.log("Number of Points wihtin Range '" + nextEntry_keyRange + "' is '" + numberOfFeatures + "'");

							var date = $scope.getQueryDate(poi);
							
							if ($scope.echartsInstances_reachabilityAnalysis && $scope.echartsInstances_reachabilityAnalysis.has(nextEntry_keyRange)){
								// append to diagram

								var echartsInstance = $scope.echartsInstances_reachabilityAnalysis.get(nextEntry_keyRange);
								var echartsOptions = echartsInstance.getOption();
								echartsOptions = kommonitorDiagramHelperService.appendToReachabilityAnalysisOptions(poi, nextEntry_valueGeoJSON, echartsOptions, date);
								echartsInstance.setOption(echartsOptions);
								$scope.echartsInstances_reachabilityAnalysis.set(nextEntry_keyRange, echartsInstance);
							}
							else{
								var reachabilityDiagramsSectionNode = document.getElementById("reachability_diagrams_section");
								var newChartNode = document.createElement("div");
								newChartNode.innerHTML = '<hr><h4>Analyse Einzugsgebiet ' + nextEntry_keyRange_label + ' [' + kommonitorDataExchangeService.isochroneLegend.cutOffUnit + ']</h4><br/><br/><div class="chart"><div  id="reachability_pieDiagram_range_' + nextEntry_keyRange + '" style="width:100%; min-height:150px;"></div></div>';
								reachabilityDiagramsSectionNode.appendChild(newChartNode);

								// init new echarts instance
								var echartsInstance = echarts.init(document.getElementById('reachability_pieDiagram_range_' + nextEntry_keyRange + ''));
								// use configuration item and data specified to show chart
								var echartsOptions = kommonitorDiagramHelperService.createInitialReachabilityAnalysisPieOptions(poi, nextEntry_valueGeoJSON, nextEntry_keyRange_label + " " + $scope.unit, date);
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

					$scope.removePoiFromDiagram = function(poiGeoresource){
						var chart_entries = $scope.echartsInstances_reachabilityAnalysis.entries();

						var nextChartInstanceEntry = chart_entries.next();
						while(nextChartInstanceEntry.value){

							var nextChartInstance = nextChartInstanceEntry.value[1];
							var nextChartOptions = nextChartInstance.getOption();

							nextChartOptions = kommonitorDiagramHelperService.removePoiFromReachabilityAnalysisOption(nextChartOptions, poiGeoresource);
							nextChartInstance.setOption(nextChartOptions);

							$scope.echartsInstances_reachabilityAnalysis.set(nextChartInstanceEntry.value[0], nextChartInstance);							

							nextChartInstanceEntry = chart_entries.next();
						}
					};

					$scope.handlePoiOnMap = function(poi){

						if(poi.isSelected_reachabilityAnalysis){
							//display on Map
							$scope.addPoiLayerToMap(poi);
						}
						else{
							//remove POI layer from map
							$scope.removePoiLayerFromMap(poi);
						}

					};

					$scope.addPoiLayerToMap = function(poiGeoresource) {
						$scope.settings.loadingData = true;
						$rootScope.$broadcast("showLoadingIconOnMap");

						// fale --> useCluster = false 
						kommonitorMapService.addPoiGeoresourceGeoJSON_reachabilityAnalysis(poiGeoresource, $scope.getQueryDate(poiGeoresource), false);
								$scope.settings.loadingData = false;
								$rootScope.$broadcast("hideLoadingIconOnMap");

					};

					$scope.removePoiLayerFromMap = function(poiGeoresource) {
						$scope.settings.loadingData = true;
						$rootScope.$broadcast("showLoadingIconOnMap");

						poiGeoresource = poiGeoresource;

						kommonitorMapService.removePoiGeoresource_reachabilityAnalysis(poiGeoresource);
						$scope.settings.loadingData = false;
						$rootScope.$broadcast("hideLoadingIconOnMap");

					};

					$scope.refreshPoiLayers = async function(){
						for (var poi of kommonitorDataExchangeService.availableGeoresources){
							if (poi.isSelected_reachabilityAnalysis){
								//remove POI layer from map
								$scope.removePoiLayerFromMap(poi);

								poi = await $scope.fetchGeoJSONForDate(poi);

								// remove layer and add layer again
								$scope.addPoiLayerToMap(poi);
							}
						}
					};

					$scope.onClickUseIndicatorTimestamp = function(){
						$scope.settings.dateSelectionType.selectedDateType = $scope.settings.dateSelectionType_valueIndicator;

						$scope.refreshSelectedGeoresources();
					};

					$scope.timeout_manualdate;

					function isNoValidDate(dateCandidate){
						var dateComps = dateCandidate.split("-");

						if(dateComps.length < 3){
							return true;
						}
						else if(! dateComps[0] || ! dateComps[1] || ! dateComps[2]){
							return true;
						}
						else if(isNaN(dateComps[0]) || isNaN(dateComps[1]) || isNaN(dateComps[2])){
							return true;
						}
						else if(Number(dateComps[1]) > 12 || Number(dateComps[2]) > 31){
							return true;
						}

						return false;
					}

					$scope.onChangeManualDate = function(){
						// check if date is an actual date
						// if so then refresh selected layers

						 // Clear the timeout if it has already been set.
						// This will prevent the previous task from executing
						// if it has been less than <MILLISECONDS>
						clearTimeout($scope.timeout_manualdate);

						// Make a new timeout set to go off in 1000ms (1 second)
						$scope.timeout_manualdate = setTimeout(function () {
							var dateCandidate = $scope.settings.selectedDate_manual;

							if(isNoValidDate(dateCandidate)){
								return;
							}

							$timeout(function(){
	
								$scope.loadingData = true;
								$rootScope.$broadcast("showLoadingIconOnMap");
							});

							$timeout(function(){
		
								$scope.refreshSelectedGeoresources();
							}, 250);	
						}, 1000);

					};

					$scope.onChangeManualDate_isochroneConfig = function(){
						// check if date is an actual date
						// if so then refresh selected layers

						 // Clear the timeout if it has already been set.
						// This will prevent the previous task from executing
						// if it has been less than <MILLISECONDS>
						clearTimeout($scope.timeout_manualdate);

						// Make a new timeout set to go off in 1000ms (1 second)
						$scope.timeout_manualdate = setTimeout(function () {
							var dateCandidate = $scope.settings.isochroneConfig.selectedDate_manual;

							if(isNoValidDate(dateCandidate)){
								return;
							}

							if(!$scope.isUsedInReporting) {
								$scope.fetchGeoJSONForIsochrones();
							}

							// $timeout(function(){
	
							// 	$scope.loadingData = true;
							// 	$rootScope.$broadcast("showLoadingIconOnMap");
							// });

							// $timeout(function(){
		
							// 	$scope.fetchGeoJSONForIsochrones();
							// }, 250);	
						}, 1000);

					};					

					$scope.$on("selectedIndicatorDateHasChanged", function (event) {

						console.log("refresh selected georesource layers according to new date");

						// only refresh georesources if sync with indicator timestamp is selected
						if(! $scope.settings.dateSelectionType.selectedDateType.includes($scope.settings.dateSelectionType_valueIndicator)){
							return;
						}
			
						$timeout(function(){
	
							$scope.loadingData = true;
							$rootScope.$broadcast("showLoadingIconOnMap");
						});

						$timeout(function(){
	
							$scope.refreshSelectedGeoresources();
						}, 250);							
					});

					$scope.refreshSelectedGeoresources = async function(){
						for (const georesource of kommonitorDataExchangeService.availableGeoresources) {
							if (georesource.isSelected_reachabilityAnalysis){

								if(georesource.isPOI){
									georesource.isSelected_reachabilityAnalysis = false;
									await $scope.handlePoiForAnalysis(georesource);
									georesource.isSelected_reachabilityAnalysis = true;
									await $scope.handlePoiForAnalysis(georesource);
								}										

							}
						}

						$scope.loadingData = false;
						$rootScope.$broadcast("hideLoadingIconOnMap");
					};

					$scope.onChangeSelectedDate = async function(georesourceDataset){
						// only if it s already selected, we must modify the shown dataset 


						if(georesourceDataset.isSelected_reachabilityAnalysis){
							// depending on type we must call different methods
							if (georesourceDataset.isPOI){
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
						while(nextChartInstanceEntry.value){

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
