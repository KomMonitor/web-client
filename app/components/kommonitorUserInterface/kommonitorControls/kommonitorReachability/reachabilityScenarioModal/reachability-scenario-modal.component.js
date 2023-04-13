angular.module('reachabilityScenarioModal').component('reachabilityScenarioModal', {
	templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/reachabilityScenarioModal/reachability-scenario-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorSingleFeatureMapHelperService',
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorMultiStepFormHelperService', 'kommonitorReachabilityHelperService',
		function ReachabilityScenarioModalController(kommonitorDataExchangeService, kommonitorSingleFeatureMapHelperService,
			$scope, $rootScope, $http, __env, $timeout, kommonitorMultiStepFormHelperService, kommonitorReachabilityHelperService) {

			this.kommonitorReachabilityHelperServiceInstance = kommonitorReachabilityHelperService;
			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorSingleFeatureMapHelperServiceInstance = kommonitorSingleFeatureMapHelperService;

			$scope.currentScenarioDataset;

			$scope.$on("onManageReachabilityScenario", function (event, scenarioDataset) {
				kommonitorMultiStepFormHelperService.registerClickHandler();
				if (scenarioDataset) {
					if ($scope.currentScenarioDataset && $scope.currentScenarioDataset.name === scenarioDataset.name) {
						return;
					}
					else {
						$scope.currentScenarioDataset = scenarioDataset;

						$scope.resetReachabilityScenarioForm();

					}
				}

			});

			$scope.onChangePoiResource = async function () {
				$scope.currentScenarioDataset.selectedDate = undefined;

				if (!$scope.currentScenarioDataset.selectedDate) {
					$scope.currentScenarioDataset.selectedDate = $scope.currentScenarioDataset.poiResource.availablePeriodsOfValidity[$scope.currentScenarioDataset.poiResource.availablePeriodsOfValidity.length - 1];
				}

				$scope.fetchPoiResourceGeoJSON();
			};

			$scope.fetchPoiResourceGeoJSON = async function () {

				var dateComps = $scope.currentScenarioDataset.selectedDate.startDate.split("-");

				var year = dateComps[0];
				var month = dateComps[1];
				var day = dateComps[2];

				// fetch from management API
				$http({
					url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + $scope.currentScenarioDataset.poiResource.georesourceId + "/" + year + "/" + month + "/" + day,
					method: "GET",
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {

					$scope.currentScenarioDataset.poiResource.geoJSON = response.data;

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
					url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + $scope.currentScenarioDataset.poiResource.georesourceId + "/schema",
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
				kommonitorSingleFeatureMapHelperService.addDataLayertoSingleFeatureGeoMap($scope.currentScenarioDataset.poiResource.geoJSON);

				$scope.featureInfoText_singleFeatureAddMenu = "" + $scope.currentScenarioDataset.poiResource.geoJSON.features.length + " Features im Szenario-Datensatz vorhanden";

			};

			$scope.onChangeSelectedIndicatorForStatistics = function(){
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


