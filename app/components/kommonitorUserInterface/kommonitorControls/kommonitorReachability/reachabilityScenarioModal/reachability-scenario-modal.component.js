angular.module('reachabilityScenarioModal').component('reachabilityScenarioModal', {
	templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/reachabilityScenarioModal/reachability-scenario-modal.template.html",
	controller: ['kommonitorDataExchangeService',
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorMultiStepFormHelperService', 'kommonitorReachabilityHelperService',
		'kommonitorReachabilityScenarioHelperService', 'kommonitorToastHelperService',
		function ReachabilityScenarioModalController(kommonitorDataExchangeService,
			$scope, $rootScope, $http, __env, $timeout, kommonitorMultiStepFormHelperService, kommonitorReachabilityHelperService,
			kommonitorReachabilityScenarioHelperService, kommonitorToastHelperService) {

			this.kommonitorReachabilityHelperServiceInstance = kommonitorReachabilityHelperService;
			this.kommonitorReachabilityScenarioHelperServiceInstance = kommonitorReachabilityScenarioHelperService;
			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

			$scope.emptyDatasetName = "-- leerer neuer Datensatz --";

			$('#modal-manage-reachability-scenario').on('show.bs.modal', function (event) {
				if (event.target.id === "modal-manage-reachability-scenario") {
					$scope.initEmptyDataset();
				}
			});

			$('#modal-manage-reachability-scenario').on('hidden.bs.modal', function (event) {
				if (event.target.id === "modal-manage-reachability-scenario") {
					$scope.cleanEmptyDataset();
				}
			});

			$scope.initEmptyDataset = function () {
				// add empty dataset to displayableGeoresources
				// ensure to remove it again, if modal gets closed

				// create empty georesource dataset and geoJSON 
				let emptyDataset = {
					"georesourceId": uuidv4(),
					"datasetName": $scope.emptyDatasetName,
					"isNewReachabilityDataSource": true,
					"isPOI": true,
					"availablePeriodsOfValidity": [
						{
							"startDate": undefined,
							"endDate": undefined
						}
					],
					"poiMarkerColor": "orange",
					"poiSymbolBootstrap3Name": "pushpin",
					"poiSymbolColor": "white",
				};

				emptyDataset.geoJSON_reachability = {
					"type": "FeatureCollection",
					"features": []
				};

				kommonitorDataExchangeService.displayableGeoresources.splice(0, 0, emptyDataset)

				$timeout(function () {
					$scope.$digest();
				}, 250);
			};

			$scope.cleanEmptyDataset = function () {
				// remove empty dataset again
				// only if user has not renamed it

				if (kommonitorDataExchangeService.displayableGeoresources[0].datasetName === $scope.emptyDatasetName) {
					kommonitorDataExchangeService.displayableGeoresources.splice(0, 1);
				}

			};

			$scope.resetReachabilityScenarioForm = function(){
				kommonitorReachabilityHelperService.settings.selectedStartPointLayer = undefined;
				kommonitorReachabilityHelperService.currentIsochronesGeoJSON = undefined;
				kommonitorReachabilityHelperService.original_nonDissolved_isochrones = undefined;
				kommonitorReachabilityScenarioHelperService.resetTmpActiveScenario();
				kommonitorReachabilityHelperService.resetSettings();
			}


			$scope.$on("onManageReachabilityScenario", function (event, scenarioDataset) {

				kommonitorMultiStepFormHelperService.registerClickHandler("reachabilityScenarioForm");
				if (scenarioDataset) {						

					if (kommonitorReachabilityScenarioHelperService.tmpActiveScenario.scenarioName && kommonitorReachabilityScenarioHelperService.tmpActiveScenario.scenarioName == scenarioDataset.scenarioName) {
						return;
					}
					else {								
						kommonitorReachabilityScenarioHelperService.loadActiveScenario(scenarioDataset);	
						$scope.initPoiResourceEditFeaturesMenu();
					}
				}

			});

			$scope.onChangePoiResource = async function () {
				kommonitorReachabilityHelperService.settings.isochroneConfig.selectedDate = undefined;

				if(kommonitorReachabilityScenarioHelperService.tmpActiveScenario.poiDataset &&
					kommonitorReachabilityScenarioHelperService.tmpActiveScenario.poiDataset.poiName &&
					kommonitorReachabilityScenarioHelperService.tmpActiveScenario.poiDataset.poiName != kommonitorReachabilityScenarioHelperService.tmpActiveScenario.reachabilitySettings.selectedStartPointLayer.datasetName){
						kommonitorToastHelperService.displayWarningToast("Datenquelle neu gesetzt", "Die weiteren Abschnitte weisen vielleicht veraltete Daten auf.");
					}

				// if emtpy layer is selected then no features can be fetched at all!
				if (kommonitorReachabilityHelperService.settings.selectedStartPointLayer.isNewReachabilityDataSource || kommonitorReachabilityHelperService.settings.selectedStartPointLayer.isTmpDataLayer) {
					
					// if tmp datalayer has been selected we assume that there are features already in property .geoJSON
					if(kommonitorReachabilityHelperService.settings.selectedStartPointLayer.isTmpDataLayer){
						kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability = kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON;
					}
					
					// init geoMap with empty dataset
					$scope.initPoiResourceEditFeaturesMenu();
					return;
				}

				if (!kommonitorReachabilityHelperService.settings.isochroneConfig.selectedDate) {
					kommonitorReachabilityHelperService.settings.isochroneConfig.selectedDate = kommonitorReachabilityHelperService.settings.selectedStartPointLayer.availablePeriodsOfValidity[kommonitorReachabilityHelperService.settings.selectedStartPointLayer.availablePeriodsOfValidity.length - 1];
				}

				$scope.fetchPoiResourceGeoJSON();
			};

			$scope.fetchPoiResourceGeoJSON = async function () {

				var dateComps = kommonitorReachabilityHelperService.settings.isochroneConfig.selectedDate.startDate.split("-");

				var year = dateComps[0];
				var month = dateComps[1];
				var day = dateComps[2];

				// fetch from management API
				$http({
					url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + kommonitorReachabilityHelperService.settings.selectedStartPointLayer.georesourceId + "/" + year + "/" + month + "/" + day,
					method: "GET",
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {

					kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability = response.data;
					kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON = response.data;

					// prepare feature edit geo map
					$scope.initPoiResourceEditFeaturesMenu();

				}, function errorCallback(error) {
					console.error(error);
				}).finally(function () {

				});
			};

			$scope.initFeatureSchema = async function () {
				kommonitorReachabilityHelperService.settings.selectedStartPointLayer.featureSchemaProperties = [];

				return await $http({
					url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + kommonitorReachabilityHelperService.settings.selectedStartPointLayer.georesourceId + "/schema",
					method: "GET",
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {

					kommonitorReachabilityHelperService.settings.selectedStartPointLayer.schemaObject = response.data;

					for (var property in kommonitorReachabilityHelperService.settings.selectedStartPointLayer.schemaObject) {
						if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME) {
							kommonitorReachabilityHelperService.settings.selectedStartPointLayer.featureSchemaProperties.push(
								{
									property: property,
									value: undefined
								}
							);
						}
					}

					return kommonitorReachabilityHelperService.settings.selectedStartPointLayer.schemaObject;

				}, function errorCallback(error) {

				});
			};

			$scope.initPoiResourceEditFeaturesMenu = async function () {
				// check if empty dataset for a new POI dataset has been selected
				// if so, no features can be fetched from KomMonitor Database as thex do not exist
				// then we must init feature edit component with empty dataset!
				let isReachabilityDatasetOnly = false;

				if (kommonitorReachabilityHelperService.settings.selectedStartPointLayer.isNewReachabilityDataSource || kommonitorReachabilityHelperService.settings.selectedStartPointLayer.isTmpDataLayer) {
					isReachabilityDatasetOnly = true;
					// check if geoJSON is available
					// is required by editFeature component
					if(!kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON){
						kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON = kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability
					}
				}

				$rootScope.$broadcast("onEditGeoresourceFeatures", kommonitorReachabilityHelperService.settings.selectedStartPointLayer, isReachabilityDatasetOnly);

			};

			// react on events from single feature edit menu
			$scope.$on("georesourceGeoJSONUpdated", function(event, geoJSON){
				// simply update geoJSON of reachability layer
				kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability = geoJSON;
			});			

		}
	]
});


