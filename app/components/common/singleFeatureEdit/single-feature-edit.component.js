angular.module('singleFeatureEdit').component('singleFeatureEdit', {
	templateUrl: "components/common/singleFeatureEdit/single-feature-edit.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorSingleFeatureMapHelperService',
		'$scope', '$rootScope', '__env', '$http',
		function SingleFeatureEditController(kommonitorDataExchangeService, kommonitorSingleFeatureMapHelperService,
			$scope, $rootScope, __env, $http) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

			let domId = "singleFeatureGeoMap";

			$scope.currentGeoresourceDataset = undefined;
			$scope.isReachabilityDatasetOnly = false;

			$scope.georesourceFeaturesGeoJSON = undefined;

			// variables for single feature import
			$scope.featureIdValue = 0;
			$scope.featureIdExampleString = undefined;
			$scope.featureIdIsUnique = false;
			$scope.featureNameValue = undefined;
			$scope.featureGeometryValue = undefined;
			$scope.featureStartDateValue = undefined;
			$scope.featureEndDateValue = undefined;
			// [{property: name, value: value}]
			$scope.featureSchemaProperties = [];
			$scope.schemaObject;

			// init datepickers
			$('#georesourceSingleFeatureDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);
			$('#georesourceSingleFeatureDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);

			$scope.$on("onEditGeoresourceFeatures", async function (event, georesourceDataset, isReachabilityDatasetOnly) {
				if ($scope.currentGeoresourceDataset && $scope.currentGeoresourceDataset.datasetName === georesourceDataset.datasetName) {
					return;
				}
				else {
					$scope.currentGeoresourceDataset = georesourceDataset;
					$scope.isReachabilityDatasetOnly = isReachabilityDatasetOnly;

					await $scope.initFeatureSchema();
					await $scope.initGeoMap();
				}

			});

			$scope.resetContent = function () {
				$scope.georesourceFeaturesGeoJSON = undefined;

				// variables for single feature import
				$scope.featureIdValue = 0;
				$scope.featureIdExampleString = undefined;
				$scope.featureIdIsUnique = false;
				$scope.featureNameValue = undefined;
				$scope.featureGeometryValue = undefined;
				$scope.featureStartDateValue = undefined;
				$scope.featureEndDateValue = undefined;
				// [{property: name, value: value}]
				$scope.featureSchemaProperties = [];
				$scope.schemaObject;
			};

			$scope.$on("reinitSingleFeatureEdit", async function () {
				$scope.resetContent();
				await $scope.initFeatureSchema();
				await $scope.initGeoMap();
			});

			let initDefaultSchema = function () {
				let schemaObject = {};
				schemaObject[__env.FEATURE_ID_PROPERTY_NAME] = "number";
				schemaObject[__env.FEATURE_NAME_PROPERTY_NAME] = "string";
				schemaObject[__env.VALID_START_DATE_PROPERTY_NAME] = "date";
				schemaObject[__env.VALID_END_DATE_PROPERTY_NAME] = "date";

				return schemaObject;
			};

			$scope.initFeatureSchema = async function () {
				$scope.featureSchemaProperties = [];

				$scope.schemaObject = initDefaultSchema();

				// only fetch more details if possible - that is - if data is actually stored in database
				if (!$scope.isReachabilityDatasetOnly) {
					return await $http({
						url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/schema",
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
				}

			};

			$scope.initGeoMap = function () {
				let resourceType = kommonitorSingleFeatureMapHelperService.resourceType_point;
				if ($scope.currentGeoresourceDataset.isLOI) {
					resourceType = kommonitorSingleFeatureMapHelperService.resourceType_line;
				}
				else if ($scope.currentGeoresourceDataset.isAOI) {
					resourceType = kommonitorSingleFeatureMapHelperService.resourceType_polygon;
				}
				kommonitorSingleFeatureMapHelperService.initSingleFeatureGeoMap(domId, resourceType);

				$scope.initGeoresourceFeatures();
			};

			let initEmptyGeoJSON = function(){
				return {
					"type": "FeatureCollection",
					"features": []
				};
			};

			$scope.initGeoresourceFeatures = async function () {

				// only fetch more details if possible - that is - if data is actually stored in database
				if (!$scope.isReachabilityDatasetOnly) {
					// add data layer to singleFeatureMap
					await $http({
						url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/allFeatures",
						method: "GET",
						// headers: {
						//    'Content-Type': undefined
						// }
					}).then(function successCallback(response) {

						$scope.georesourceFeaturesGeoJSON = response.data;

					}, function errorCallback(error) {
						$scope.featureInfoText_singleFeatureAddMenu = "Keine Features im Datensatz vorhanden oder Fehler bei Abruf";
					}).finally(function () {

					});
				}
				else {
					$scope.georesourceFeaturesGeoJSON = $scope.currentGeoresourceDataset.geoJSON ? $scope.currentGeoresourceDataset.geoJSON : initEmptyGeoJSON()
				}

				kommonitorSingleFeatureMapHelperService.addDataLayertoSingleFeatureGeoMap($scope.georesourceFeaturesGeoJSON);

				$scope.featureInfoText_singleFeatureAddMenu = "" + $scope.georesourceFeaturesGeoJSON.features.length + " Features im Datensatz vorhanden";

				//once the dataset features are fetched we may make a proposal for the ID of a new Feature
				$scope.featureIdValue = $scope.generateIdProposalFromExistingFeatures();
				$scope.addExampleValuesToSchemaProperties();
				$scope.validateSingleFeatureId();
			}

			$scope.generateIdProposalFromExistingFeatures = function () {
				if (!$scope.georesourceFeaturesGeoJSON) {
					return 0;
				}
				// String or Integer
				let idDataType = $scope.schemaObject[__env.FEATURE_ID_PROPERTY_NAME];

				// array of id values
				let existingFeatureIds = $scope.georesourceFeaturesGeoJSON.features.map(feature => {
					if (feature.properties[__env.FEATURE_ID_PROPERTY_NAME]) {
						return feature.properties[__env.FEATURE_ID_PROPERTY_NAME];
					}
					else {
						return 0;
					}
				});

				let length = existingFeatureIds.length;
				$scope.featureIdExampleString = "" + existingFeatureIds[0] + "; " + existingFeatureIds[Math.round(length / 2)] + "; " + existingFeatureIds[length - 1];

				if (idDataType == "Integer" || idDataType == "Double") {
					return $scope.generateIdProposalFromExistingFeatures_numeric(existingFeatureIds);
				}
				else {
					// generate UUID
					return $scope.generateIdProposalFromExistingFeatures_uuid(existingFeatureIds);
				}
			};

			$scope.generateIdProposalFromExistingFeatures_numeric = function (existingFeatureIds) {

				// determine max value
				let maxValue = Math.max(...existingFeatureIds);

				// return increment
				return maxValue + 1;
			};

			$scope.generateIdProposalFromExistingFeatures_uuid = function (existingFeatureIds) {
				// return UUID using UUID library 
				return uuidv4();
			};

			$scope.validateSingleFeatureId = function () {
				$scope.featureIdIsUnique = true;
				if ($scope.georesourceFeaturesGeoJSON && $scope.featureIdValue) {
					let filteredFeatures = $scope.georesourceFeaturesGeoJSON.features.filter(feature => feature.properties[__env.FEATURE_ID_PROPERTY_NAME] == $scope.featureIdValue);

					if (filteredFeatures.length == 0) {
						$scope.featureIdIsUnique = true;
					}
					else {
						$scope.featureIdIsUnique = false;
					}
					return $scope.featureIdIsUnique;
				}
				else {
					// no other data available in dataset
					if ($scope.featureIdValue == undefined || $scope.featureIdValue == null) {
						$scope.featureIdIsUnique = false;
					}
					else {
						$scope.featureIdIsUnique = true;
					}
				}

				return $scope.featureIdIsUnique;
			};

			$scope.addExampleValuesToSchemaProperties = function () {
				if ($scope.georesourceFeaturesGeoJSON && $scope.featureSchemaProperties && $scope.georesourceFeaturesGeoJSON.features && $scope.georesourceFeaturesGeoJSON.features[0]) {
					let exampleFeature = $scope.georesourceFeaturesGeoJSON.features[0];
					for (const element of $scope.featureSchemaProperties) {
						element.exampleValue = exampleFeature.properties[element.property];
					}
				}
			};

			$scope.addSingleGeoresourceFeature = async function () {

				// build new feature object and add it to geoJSON
				// then broadcast updated resources
				$scope.featureGeometryValue.features[0].properties[__env.FEATURE_ID_PROPERTY_NAME] = $scope.featureIdValue;
				$scope.featureGeometryValue.features[0].properties[__env.FEATURE_NAME_PROPERTY_NAME] = $scope.featureNameValue;
				$scope.featureGeometryValue.features[0].properties[__env.VALID_START_DATE_PROPERTY_NAME] = $scope.featureStartDateValue;
				$scope.featureGeometryValue.features[0].properties[__env.VALID_END_DATE_PROPERTY_NAME] = $scope.featureEndDateValue;

				for (const element of $scope.featureSchemaProperties) {
					$scope.featureGeometryValue.features[0].properties[element.property] = element.value;
				}

				// as the update was successfull we must prevent the user from importing the same object again
				$scope.featureIdIsUnique = false;
				// add the new feature to current dataset!
				if ($scope.georesourceFeaturesGeoJSON) {
					$scope.georesourceFeaturesGeoJSON.features.push($scope.featureGeometryValue.features[0]);
				}
				else {
					$scope.georesourceFeaturesGeoJSON = turf.featureCollection([
						$scope.featureGeometryValue.features[0]
					]);
				}

				$scope.broadcastUpdate_addSingleFeature();
				$scope.broadcastUpdate_wholeGeoJSON();

			};

			$scope.broadcastUpdate_addSingleFeature = function () {
				$rootScope.$broadcast("georesourceGeoJSONUpdated_addSingleFeature", $scope.featureGeometryValue.features[0]);
			};

			$scope.broadcastUpdate_editSingleFeature = function () {
				$rootScope.$broadcast("georesourceGeoJSONUpdated_addSingleFeature", $scope.georesourceFeaturesGeoJSON);
			};

			$scope.broadcastUpdate_wholeGeoJSON = function () {
				$rootScope.$broadcast("georesourceGeoJSONUpdated", $scope.georesourceFeaturesGeoJSON);
			};

			$scope.$on("onUpdateSingleFeatureGeometry", function (event, geoJSON) {
				$scope.featureGeometryValue = geoJSON;
				$scope.$digest();
			});


		}
	]
});
