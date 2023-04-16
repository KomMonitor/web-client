angular.module('reachabilityScenarioModal').component('reachabilityScenarioModal', {
	templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/reachabilityScenarioModal/reachability-scenario-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorSingleFeatureMapHelperService',
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorMultiStepFormHelperService', 'kommonitorReachabilityHelperService',
		function ReachabilityScenarioModalController(kommonitorDataExchangeService, kommonitorSingleFeatureMapHelperService,
			$scope, $rootScope, $http, __env, $timeout, kommonitorMultiStepFormHelperService, kommonitorReachabilityHelperService) {

			this.kommonitorReachabilityHelperServiceInstance = kommonitorReachabilityHelperService;
			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorSingleFeatureMapHelperServiceInstance = kommonitorSingleFeatureMapHelperService;

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
					"datasetName": $scope.emptyDatasetName,
					"isEmptyDataset": true,
					"isNewReachabilityDataSource": true,
					"isPOI": true,
					"availablePeriodsOfValidity": [
						{
							"startDate": undefined,
							"endDate": undefined
						}
					]
				};

				emptyDataset.geoJSON = {
					"type": "FeatureCollection",
					"features": []
				};

				kommonitorDataExchangeService.displayableGeoresources.splice(0, 0, emptyDataset)

				$timeout(function(){
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


			$scope.$on("onManageReachabilityScenario", function (event, scenarioDataset) {
				kommonitorMultiStepFormHelperService.registerClickHandler();
				if (scenarioDataset) {
					if (kommonitorReachabilityHelperService.settings.selectedStartPointLayer && kommonitorReachabilityHelperService.settings.selectedStartPointLayer.scenarioName === scenarioDataset.name) {						
						return;
					}
					else {
						kommonitorReachabilityHelperService.settings.selectedStartPointLayer = scenarioDataset;

						$scope.resetReachabilityScenarioForm();

					}
				}

			});

			$scope.onChangePoiResource = async function () {
				kommonitorReachabilityHelperService.settings.isochroneConfig.selectedDate = undefined;

				// if emtpy layer is selected then no features can be fetched at all!
				if (kommonitorReachabilityHelperService.settings.selectedStartPointLayer.isEmptyDataset) {
					// init geoMap with empty dataset
					$scope.initPoiResourceEditFeaturesGeoMap();
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

					kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON = response.data;

					// prepare feature edit geo map
					$scope.initPoiResourceEditFeaturesGeoMap();

				}, function errorCallback(error) {
					console.error(error);
				}).finally(function () {

				});
			};

			$scope.initFeatureSchema = async function () {
				$scope.featureSchemaProperties = [];

				return await $http({
					url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + kommonitorReachabilityHelperService.settings.selectedStartPointLayer.georesourceId + "/schema",
					method: "GET",
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {

					$scope.schemaObject = response.data;

					for (var property in $scope.schemaObject) {
						if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME) {
							$scope.featureSchemaProperties.push(
								{
									property: property,
									value: undefined
								}
							);
						}
					}

					return $scope.schemaObject;

				}, function errorCallback(error) {

				});
			};

			$scope.initPoiResourceEditFeaturesGeoMap = async function () {
				// init geomap for single feature import, handling geocoding and feature geometry
				let domId = "reachabilityScenarioEditFeaturesGeoMap";
				let resourceType = kommonitorSingleFeatureMapHelperService.resourceType_point;
				kommonitorSingleFeatureMapHelperService.initSingleFeatureGeoMap(domId, resourceType);

				// init featureSchema for single feature import
				await $scope.initFeatureSchema();

				// add data layer to singleFeatureMap
				kommonitorSingleFeatureMapHelperService.addDataLayertoSingleFeatureGeoMap(kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON);

				$scope.featureInfoText_singleFeatureAddMenu = "" + kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON.features.length + " Features im Szenario-Datensatz vorhanden";

			};

			$scope.onChangeSelectedIndicatorForStatistics = function () {
				// $scope.selectedIndicatorForStatistics;

				$scope.selectedSpatialUnit = $scope.selectedIndicatorForStatistics.applicableSpatialUnits[$scope.selectedIndicatorForStatistics.applicableSpatialUnits.length - 1];
				$scope.selectedIndicatorDate = $scope.selectedIndicatorForStatistics.applicableDates[$scope.selectedIndicatorForStatistics.applicableDates.length - 1];

				$scope.$digest();
				// for (const iterator of $ctrl.kommonitorDataExchangeServiceInstance.availableSpatialUnits) {

				// }				
			}

		}
	]
});


