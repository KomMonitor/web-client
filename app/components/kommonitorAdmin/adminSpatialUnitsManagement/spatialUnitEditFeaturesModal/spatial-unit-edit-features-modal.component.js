angular.module('spatialUnitEditFeaturesModal').component('spatialUnitEditFeaturesModal', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorDataGridHelperService', 'kommonitorImporterHelperService', 
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorMultiStepFormHelperService',
		function SpatialUnitEditFeaturesModalController(kommonitorDataExchangeService, kommonitorDataGridHelperService, 
			kommonitorImporterHelperService, $scope, $rootScope, $http, __env, $timeout, kommonitorMultiStepFormHelperService) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
		this.kommonitorDataGridHelperServiceInstance = kommonitorDataGridHelperService;

		/*	POST BODY
				{
				  "geoJsonString": "geoJsonString",
				  "metadata": {
				    "note": "note",
				    "literature": "literature",
				    "updateInterval": "ARBITRARY",
				    "sridEPSG": 0.8008281904610115,
				    "datasource": "datasource",
				    "contact": "contact",
				    "lastUpdate": "2000-01-23",
				    "description": "description",
				    "databasis": "databasis"
				  },
				  "jsonSchema": "jsonSchema",
				  "nextLowerHierarchyLevel": "nextLowerHierarchyLevel",
				  "spatialUnitLevel": "spatialUnitLevel",
				  "periodOfValidity": {
				    "endDate": "2000-01-23",
				    "startDate": "2000-01-23"
				  },
				  "nextUpperHierarchyLevel": "nextUpperHierarchyLevel"
				}
		*/

		//Date picker
        $('#spatialUnitEditFeaturesDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#spatialUnitEditFeaturesDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$scope.spatialUnitFeaturesGeoJSON;
		$scope.currentSpatialUnitDataset;
		$scope.remainingFeatureHeaders;

		$scope.spatialUnitMappingConfigStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON(kommonitorImporterHelperService.mappingConfigStructure);
		$scope.spatialUnitMappingConfigImportError;

		$scope.loadingData = false;

		$scope.periodOfValidity = {};
		$scope.periodOfValidity.startDate = undefined;
		$scope.periodOfValidity.endDate = undefined;
		$scope.periodOfValidityInvalid = false;

		$scope.geoJsonString = undefined;
		$scope.spatialUnit_asGeoJson = undefined;

		$scope.spatialUnitEditFeaturesDataSourceInputInvalidReason = undefined;
		$scope.spatialUnitEditFeaturesDataSourceInputInvalid = false;
		$scope.spatialUnitDataSourceIdProperty = undefined;
		$scope.spatialUnitDataSourceNameProperty = undefined;

        $scope.availableDatasourceTypes = [];
        $scope.availableSpatialUnits = undefined;

		$scope.converter = undefined;
		$scope.schema = undefined;
		$scope.mimeType = undefined;
        $scope.datasourceType = undefined;
        $scope.spatialUnitDataSourceIdProperty = undefined;
        $scope.spatialUnitDataSourceNameProperty = undefined;

        $scope.converterDefinition = undefined;
        $scope.datasourceTypeDefinition = undefined;
        $scope.propertyMappingDefinition = undefined;
        $scope.putBody_spatialUnits = undefined;

        $scope.validityEndDate_perFeature = undefined;
        $scope.validityStartDate_perFeature = undefined;

		$scope.isPartialUpdate = false;

        $scope.attributeMapping_sourceAttributeName = undefined;
        $scope.attributeMapping_destinationAttributeName = undefined;
        $scope.attributeMapping_data = undefined;
        $scope.attributeMapping_attributeType = kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
        $scope.attributeMappings_adminView = [];
        $scope.keepAttributes = true;
        $scope.keepMissingValues = true;

        $scope.importerErrors = undefined;
        $scope.successMessagePart = undefined;
        $scope.errorMessagePart = undefined;

		$scope.$on("onEditSpatialUnitFeatures", function (event, spatialUnitDataset) {
            kommonitorMultiStepFormHelperService.registerClickHandler("spatialUnitEditFeaturesForm");
            if($scope.currentSpatialUnitDataset && $scope.currentSpatialUnitDataset.spatialUnitLevel === spatialUnitDataset.spatialUnitLevel) {
                return;
            } else {
                $scope.currentSpatialUnitDataset = spatialUnitDataset;

                // $scope.refreshSpatialUnitEditFeaturesOverviewTable();

                $scope.resetSpatialUnitEditFeaturesForm();
                kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource("spatialUnitFeatureTable", [], []);
            }
		});

		$scope.onChangeConverter = function(schema){
		    if ($scope.converter) {
                $scope.schema = $scope.converter.schemas ? $scope.converter.schemas[0] : undefined;
                $scope.mimeType = $scope.converter.mimeTypes[0];

                // update available datasourcetypes for this specific converter
                $scope.availableDatasourceTypes = [];
                for(var datasourceType of kommonitorImporterHelperService.availableDatasourceTypes){
                    for(var availableType of $scope.converter.datasources) {
                        if (datasourceType.type === availableType){
                            $scope.availableDatasourceTypes.push(datasourceType);
                        }
                    }
                }

                if ($scope.availableDatasourceTypes.length == 1) {
                    $scope.datasourceType = $scope.availableDatasourceTypes[0];
                    $scope.onChangeDatasourceType();
                }
            }
		};

		$scope.onChangeMimeType = function(mimeType){
			$scope.mimeType = mimeType;
		};

		$scope.refreshSpatialUnitEditFeaturesOverviewTable = function(){

			$scope.loadingData = true;
			// fetch all spatial unit features
			$http({
				url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/spatial-units/" + $scope.currentSpatialUnitDataset.spatialUnitId + "/allFeatures",
				method: "GET",
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {

				$scope.spatialUnitFeaturesGeoJSON = response.data;

				var tmpRemainingHeaders = [];

				for (var property in $scope.spatialUnitFeaturesGeoJSON.features[0].properties){
					if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME){
						tmpRemainingHeaders.push(property);
					}
				}

				$scope.remainingFeatureHeaders = tmpRemainingHeaders;

				kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource("spatialUnitFeatureTable", tmpRemainingHeaders, $scope.spatialUnitFeaturesGeoJSON.features, $scope.currentSpatialUnitDataset.spatialUnitId, kommonitorDataGridHelperService.resourceType_spatialUnit, $scope.enableDeleteFeatures);

				$timeout(function(){
				
					$scope.loadingData = false;
				});	

				}, function errorCallback(error) {
					if(error.data){							
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#spatialUnitEditFeaturesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		};

		$scope.clearAllSpatialUnitFeatures = function(){
			$scope.loadingData = true;
			// delete all georesource features
			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units/" + $scope.currentSpatialUnitDataset.spatialUnitId + "/allFeatures",
				method: "DELETE",
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {

				$scope.spatialUnitFeaturesGeoJSON = undefined;
				$scope.remainingFeatureHeaders = undefined;

				$rootScope.$broadcast("refreshSpatialUnitOverviewTable", "edit", $scope.currentSpatialUnitDataset.spatialUnitId);
				// $scope.refreshGeoresourceEditFeaturesOverviewTable();
				// force empty feature overview table on successful deletion of entries 
				kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource("spatialUnitFeatureTable", [], []);

				$scope.successMessagePart = $scope.currentSpatialUnitDataset.spatialUnitLevel;

				$("#spatialUnitEditFeaturesSuccessAlert").show();
				$timeout(function(){
				
					$scope.loadingData = false;
				});	

				}, function errorCallback(error) {
					if(error.data){							
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#spatialUnitEditFeaturesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		};

        $scope.onChangeDatasourceType = function(ds){
            if ($scope.datasourceType && $scope.datasourceType.type == "OGCAPI_FEATURES") {
                $scope.availableSpatialUnits = [ ...kommonitorDataExchangeService.availableSpatialUnits_map.values() ]
                // console.log($scope.availableSpatialUnits)
            }
        };

        $scope.onChangeConverter();
        $scope.onChangeDatasourceType();

		$scope.resetSpatialUnitEditFeaturesForm = function(){

			// reset edit banners
			kommonitorDataGridHelperService.featureTable_spatialUnit_lastUpdate_timestamp_success = undefined;
			kommonitorDataGridHelperService.featureTable_spatialUnit_lastUpdate_timestamp_failure = undefined;

			$scope.spatialUnitFeaturesGeoJSON = undefined;
			$scope.remainingFeatureHeaders = undefined;

			$scope.periodOfValidity = {};
			$scope.periodOfValidity.startDate = undefined;
			$scope.periodOfValidity.endDate = undefined;
			$scope.periodOfValidityInvalid = false;

			$scope.geoJsonString = undefined;
			$scope.spatialUnit_asGeoJson = undefined;

			$scope.spatialUnitEditFeaturesDataSourceInputInvalidReason = undefined;
			$scope.spatialUnitEditFeaturesDataSourceInputInvalid = false;
			$scope.spatialUnitDataSourceIdProperty = undefined;
			$scope.spatialUnitDataSourceNameProperty = undefined;

			$scope.converter = undefined;
			$scope.schema = undefined;
			$scope.mimeType = undefined;
			$scope.datasourceType = undefined;
			$scope.spatialUnitDataSourceIdProperty = undefined;
			$scope.spatialUnitDataSourceNameProperty = undefined;

			$scope.converterDefinition = undefined;
			$scope.datasourceTypeDefinition = undefined;
			$scope.propertyMappingDefinition = undefined;
			$scope.putBody_spatialUnits = undefined;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;

			$scope.isPartialUpdate = false;

			$scope.attributeMapping_sourceAttributeName = undefined;
			$scope.attributeMapping_destinationAttributeName = undefined;
			$scope.attributeMapping_data = undefined;
			$scope.attributeMapping_attributeType = kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
			$scope.attributeMappings_adminView = [];
			$scope.keepAttributes = true;
			$scope.keepMissingValues = true;

			$scope.importerErrors = undefined;
			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

            $scope.onChangeConverter();
            $scope.onChangeDatasourceType();

			$("#spatialUnitEditFeaturesSuccessAlert").hide();
			$("#spatialUnitEditFeaturesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();	
			}, 250);
		};

		$scope.filterByKomMonitorProperties = function() {
			return function( item ) {

				try{
					if (item === __env.FEATURE_ID_PROPERTY_NAME || item === __env.FEATURE_NAME_PROPERTY_NAME || item === "validStartDate" || item === "validEndDate"){
						return false;
					}
					return true;
				}
				catch(error){
					return false;
				}
			};
		};

		$scope.getFeatureId = function(geojsonFeature){
			return geojsonFeature.properties[__env.FEATURE_ID_PROPERTY_NAME];
		};

		$scope.getFeatureName = function(geojsonFeature){
			return geojsonFeature.properties[__env.FEATURE_NAME_PROPERTY_NAME];
		};

		$scope.checkPeriodOfValidity = function(){
			$scope.periodOfValidityInvalid = false;
			if ($scope.periodOfValidity.startDate && $scope.periodOfValidity.endDate){
				var startDate = new Date($scope.periodOfValidity.startDate);
				var endDate = new Date($scope.periodOfValidity.endDate);

				if ((startDate === endDate) || startDate > endDate){
					// failure
					$scope.periodOfValidityInvalid = true;
				}
			}
		};

		$scope.onAddOrUpdateAttributeMapping = function(){
			var tmpAttributeMapping_adminView = {
				"sourceName": $scope.attributeMapping_sourceAttributeName,
				"destinationName": $scope.attributeMapping_destinationAttributeName,
				"dataType": $scope.attributeMapping_attributeType
			};

			var processed = false;

			for (let index = 0; index < $scope.attributeMappings_adminView.length; index++) {
				var attributeMappingEntry_adminView = $scope.attributeMappings_adminView[index];
				
				if (attributeMappingEntry_adminView.sourceName === tmpAttributeMapping_adminView.sourceName){
					// replace object
					$scope.attributeMappings_adminView[index] = tmpAttributeMapping_adminView;
					processed = true;
					break;
				}
			}			

			if(! processed){
				// new entry
				$scope.attributeMappings_adminView.push(tmpAttributeMapping_adminView);
			}

			$scope.attributeMapping_sourceAttributeName = undefined;
			$scope.attributeMapping_destinationAttributeName = undefined;
			$scope.attributeMapping_attributeType = kommonitorImporterHelperService.attributeMapping_attributeTypes[0];

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.onClickEditAttributeMapping = function(attributeMappingEntry){
			$scope.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
			$scope.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
			$scope.attributeMapping_attributeType = attributeMappingEntry.dataType;			

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.onClickDeleteAttributeMapping = function(attributeMappingEntry){
			for (let index = 0; index < $scope.attributeMappings_adminView.length; index++) {
				
				if ($scope.attributeMappings_adminView[index].sourceName === attributeMappingEntry.sourceName){
					// remove object
					$scope.attributeMappings_adminView.splice(index, 1);
					break;
				}
			}				

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.buildImporterObjects = async function(){
			$scope.converterDefinition = $scope.buildConverterDefinition();
			$scope.datasourceTypeDefinition = await $scope.buildDatasourceTypeDefinition();
			$scope.propertyMappingDefinition = $scope.buildPropertyMappingDefinition();
			$scope.putBody_spatialUnits = $scope.buildPutBody_spatialUnits();

			if(!$scope.converterDefinition || !$scope.datasourceTypeDefinition || !$scope.propertyMappingDefinition || !$scope.putBody_spatialUnits){
				return false;
			}

			return true;
		};

		$scope.buildConverterDefinition = function(){

			return kommonitorImporterHelperService.buildConverterDefinition($scope.converter, "converterParameter_spatialUnitEditFeatures_", $scope.schema, $scope.mimeType);			
		};

		$scope.buildDatasourceTypeDefinition = async function(){
			try {
				return await kommonitorImporterHelperService.buildDatasourceTypeDefinition($scope.datasourceType, 'datasourceTypeParameter_spatialUnitEditFeatures_', 'spatialUnitDataSourceInput_editFeatures');			
			} catch (error) {
				if(error.data){							
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else{
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#spatialUnitEditFeaturesErrorAlert").show();
				$timeout(function(){
				
					$scope.loadingData = false;
				});	
				return null;
			}			
		};

		$scope.buildPropertyMappingDefinition = function(){
			// arsion from is undefined currently
			return kommonitorImporterHelperService.buildPropertyMapping_spatialResource($scope.spatialUnitDataSourceNameProperty, $scope.spatialUnitDataSourceIdProperty, $scope.validityStartDate_perFeature, $scope.validityEndDate_perFeature, undefined, $scope.keepAttributes, $scope.keepMissingValues, $scope.attributeMappings_adminView);
		};

		$scope.buildPutBody_spatialUnits = function(){
			var putBody =
			{
				"geoJsonString": "", // will be set by importer
				"periodOfValidity": {
					"endDate": $scope.periodOfValidity.endDate,
					"startDate": $scope.periodOfValidity.startDate
				},
				"isPartialUpdate": $scope.isPartialUpdate
			};

			return putBody;
		};


		$scope.editSpatialUnitFeatures = async function(){

			$timeout(function(){
				$scope.loadingData = true;
			});

			$scope.importerErrors = undefined;
				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;

			/*
					now collect data and build request for importer
				*/

				/*
					if any required importer data is missing --> cancel request and highlight required errors 
				*/
				var allDataSpecified = await $scope.buildImporterObjects();

				if (!allDataSpecified) {

					$("#spatialUnitEditFeaturesForm").validator("update");
					$("#spatialUnitEditFeaturesForm").validator("validate");
					return;
				}
				else {


					// TODO verify input

					// TODO Create and perform POST Request with loading screen

					var updateSpatialUnitResponse_dryRun = undefined;
					try {
						updateSpatialUnitResponse_dryRun = await kommonitorImporterHelperService.updateSpatialUnit($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentSpatialUnitDataset.spatialUnitId, $scope.putBody_spatialUnits, true);

						if(! kommonitorImporterHelperService.importerResponseContainsErrors(updateSpatialUnitResponse_dryRun)){
							// all good, really execute the request to import data against data management API
							
						var updateSpatialUnitResponse = await kommonitorImporterHelperService.updateSpatialUnit($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentSpatialUnitDataset.spatialUnitId, $scope.putBody_spatialUnits, false);
							$scope.successMessagePart = $scope.putBody_spatialUnits.spatialUnitLevel;
							$scope.importedFeatures = kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(updateSpatialUnitResponse);

							$rootScope.$broadcast("refreshSpatialUnitOverviewTable", "edit", $scope.currentSpatialUnitDataset.spatialUnitId);
							// $scope.refreshSpatialUnitEditFeaturesOverviewTable();

							$scope.successMessagePart = $scope.currentSpatialUnitDataset.spatialUnitLevel;

							$("#spatialUnitEditFeaturesSuccessAlert").show();
							$timeout(function(){
				
								$scope.loadingData = false;
							});	
						}
						else{
							// errors ocurred
							// show them 
							$scope.errorMessagePart = "Einige der zu importierenden Raumeinheiten des Datensatzes weisen kritische Fehler auf";
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateSpatialUnitResponse_dryRun);

							$("#spatialUnitEditFeaturesErrorAlert").show();
							$scope.loadingData = false;

							setTimeout(() => {
								$scope.$digest();
							}, 250);

						}
						
					} catch (error) {
						if(error.data){							
							$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
						}
						else{
							$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
						}

						if(updateSpatialUnitResponse_dryRun){
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateSpatialUnitResponse_dryRun);
						}

						$("#spatialUnitEditFeaturesErrorAlert").show();
						$scope.loadingData = false;

						setTimeout(() => {
							$scope.$digest();
						}, 250);
					}
				}
		};

		$scope.onImportSpatialUnitEditFeaturesMappingConfig = function(){

			$scope.spatialUnitMappingConfigImportError = "";

			$("#spatialUnitMappingConfigEditFeaturesImportFile").files = [];

			// trigger file chooser
			$("#spatialUnitMappingConfigEditFeaturesImportFile").click();

		};

		$(document).on("change", "#spatialUnitMappingConfigEditFeaturesImportFile" ,function(){

			console.log("Importing Importer Mapping Config for EditFeatures SpatialUnit Form");

			// get the file
			var file = document.getElementById('spatialUnitMappingConfigEditFeaturesImportFile').files[0];
			$scope.parseMappingConfigFromFile(file);
		});

		$scope.parseMappingConfigFromFile = function(file){
			var fileReader = new FileReader();

			fileReader.onload = function(event) {

				try{
					$scope.parseFromMappingConfigFile(event);
				}
				catch(error){
					console.error(error);
					console.error("Uploaded MappingConfig File cannot be parsed.");
					$scope.spatialUnitMappingConfigImportError = "Uploaded MappingConfig File cannot be parsed correctly";
					document.getElementById("spatialUnitsEditFeaturesMappingConfigPre").innerHTML = $scope.spatialUnitMappingConfigStructure_pretty;
					$("#spatialUnitEditFeaturesMappingConfigImportErrorAlert").show();

					$scope.$digest();
				}

			};

			// Read in the image file as a data URL.
			fileReader.readAsText(file);
		};

		$scope.parseFromMappingConfigFile = function(event){
			$scope.mappingConfigImportSettings = JSON.parse(event.target.result);

			if(! $scope.mappingConfigImportSettings.converter || ! $scope.mappingConfigImportSettings.dataSource || ! $scope.mappingConfigImportSettings.propertyMapping){
				console.error("uploaded MappingConfig File cannot be parsed - wrong structure.");
				$scope.spatialUnitMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster &uuml;berein.";
				document.getElementById("spatialUnitsEditFeaturesMappingConfigPre").innerHTML = $scope.spatialUnitMappingConfigStructure_pretty;
				$("#spatialUnitEditFeaturesMappingConfigImportErrorAlert").show();

				$scope.$digest();
			}
			
            $scope.converter = undefined;
			for(var converter of kommonitorImporterHelperService.availableConverters){
				if ($scope.mappingConfigImportSettings.converter && converter.name === $scope.mappingConfigImportSettings.converter.name){
					$scope.converter = converter;
					break;
				}
			}
			
            $scope.schema = undefined;
            if ($scope.converter && $scope.converter.schemas && $scope.mappingConfigImportSettings.converter.schema){
                for (var schema of $scope.converter.schemas) {
                    if (schema === $scope.mappingConfigImportSettings.converter.schema){
                        $scope.schema = schema;
                    }
                }
            }	
            
            $scope.mimeType = undefined;
                if ($scope.converter && $scope.converter.mimeTypes && $scope.mappingConfigImportSettings.converter.mimeType){
                    for (var mimeType of $scope.converter.mimeTypes) {
                        if (mimeType === $scope.mappingConfigImportSettings.converter.mimeType){
                            $scope.mimeType = mimeType;
                        }
                    }
                }

            $scope.datasourceType = undefined;
            if ($scope.converter) {
                for(var availableType of $scope.converter.datasources) {
                    for (var datasourceType of kommonitorImporterHelperService.availableDatasourceTypes) {
                        if (datasourceType.type === availableType){
                            $scope.availableDatasourceTypes.push(datasourceType);
                            var settings = $scope.mappingConfigImportSettings;
                            if (settings.dataSource && settings.dataSource.type === availableType) {
                                $scope.datasourceType = $scope.mappingConfigImportSettings.dataSource;
                            }
                            break;
                        }
                    }
                }
            }

            $scope.onChangeConverter();
            $scope.$digest();

            // converter parameters
            if ($scope.converter){
                for (var convParameter of $scope.mappingConfigImportSettings.converter.parameters) {
                    $("#converterParameter_spatialUnitEditFeatures_" + convParameter.name).val(convParameter.value);
                }
            }	

            // datasourceTypes parameters
            if ($scope.datasourceType){
                for (var dsParameter of $scope.mappingConfigImportSettings.dataSource.parameters) {
                    if (dsParameter.name === "bbox") {
                        if ($("#datasourceTypeParameter_spatialUnitEditFeatures_bboxType").val() == "ref") {
                            $scope.bboxType = "ref";
                            $("#datasourceTypeParameter_spatialUnitEditFeatures_bboxRef").val(dsParameter.value)
                        } else {
                            $scope.bboxType = "literal";
                            var bbox = dsParameter.value.split(',');
                            $("#datasourceTypeParameter_spatialUnitEditFeatures_bbox_minx").val(bbox[0])
                            $("#datasourceTypeParameter_spatialUnitEditFeatures_bbox_miny").val(bbox[1])
                            $("#datasourceTypeParameter_spatialUnitEditFeatures_bbox_maxx").val(bbox[2])
                            $("#datasourceTypeParameter_spatialUnitEditFeatures_bbox_maxy").val(bbox[3])
                        }
                    } else {
                        $("#datasourceTypeParameter_spatialUnitEditFeatures_" + dsParameter.name).val(dsParameter.value);
                    }
                }
            }
            
            // property Mapping
            $scope.spatialUnitDataSourceNameProperty = $scope.mappingConfigImportSettings.propertyMapping.nameProperty; 
            $scope.spatialUnitDataSourceIdProperty = $scope.mappingConfigImportSettings.propertyMapping.identifierProperty; 
            $scope.validityStartDate_perFeature  = $scope.mappingConfigImportSettings.propertyMapping.validStartDateProperty;
            $scope.validityEndDate_perFeature  = $scope.mappingConfigImportSettings.propertyMapping.validEndDateProperty;
            $scope.keepAttributes  = $scope.mappingConfigImportSettings.propertyMapping.keepAttributes;
            $scope.keepMissingValues = $scope.mappingConfigImportSettings.propertyMapping.keepMissingOrNullValueAttributes;
            $scope.attributeMappings_adminView = [];

            for (var attributeMapping of $scope.mappingConfigImportSettings.propertyMapping.attributes) {
                var tmpEntry = {
                    "sourceName": attributeMapping.name,
                    "destinationName": attributeMapping.mappingName
                };

                for (const dataType of kommonitorImporterHelperService.attributeMapping_attributeTypes) {
                    if (dataType.apiName === attributeMapping.type){
                        tmpEntry.dataType = dataType;
                    }
                }

                $scope.attributeMappings_adminView.push(tmpEntry);
            }

            if ($scope.mappingConfigImportSettings.periodOfValidity){
                $scope.periodOfValidity = {};
                $scope.periodOfValidity.startDate = $scope.mappingConfigImportSettings.periodOfValidity.startDate;
                $scope.periodOfValidity.endDate = $scope.mappingConfigImportSettings.periodOfValidity.endDate;
                $scope.periodOfValidityInvalid = false;

                // update datePickers
                if ($scope.periodOfValidity.startDate){						
                    $("#spatialUnitEditFeaturesDatepickerStart").datepicker('setDate', $scope.periodOfValidity.startDate);
                }
                if ($scope.periodOfValidity.endDate){						
                    $("#spatialUnitEditFeaturesDatepickerEnd").datepicker('setDate', $scope.periodOfValidity.endDate);
                }
            }				
            
            $scope.$digest();
		};

		$scope.onExportSpatialUnitEditFeaturesMappingConfig = async function(){
			var converterDefinition = $scope.buildConverterDefinition();
			var datasourceTypeDefinition = await $scope.buildDatasourceTypeDefinition();
			var propertyMappingDefinition = $scope.buildPropertyMappingDefinition();			

			var mappingConfigExport = {
				"converter": converterDefinition,
				"dataSource": datasourceTypeDefinition,
				"propertyMapping": propertyMappingDefinition,
			};

			mappingConfigExport.periodOfValidity = $scope.periodOfValidity;

			var name = $scope.spatialUnitLevel;

			var metadataJSON = JSON.stringify(mappingConfigExport);

			var fileName = "KomMonitor-Import-Mapping-Konfiguration_Export";

			if (name){
				fileName += "-" + name;
			}

			fileName += ".json";

			var blob = new Blob([metadataJSON], {type: "application/json"});
			var data  = URL.createObjectURL(blob);

			var a = document.createElement('a');
			a.download    = fileName;
			a.href        = data;
			a.textContent = "JSON";
			a.target = "_blank";
			a.rel = "noopener noreferrer";
			a.click();

			a.remove();
		};


			$scope.hideSuccessAlert = function(){
				$("#spatialUnitEditFeaturesSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#spatialUnitEditFeaturesErrorAlert").hide();
			};

			$scope.hideMappingConfigErrorAlert = function(){
				$("#spatialUnitEditFeaturesMappingConfigImportErrorAlert").hide();
			};

			$scope.onChangeEnableDeleteFeatures = function(){
				if($scope.enableDeleteFeatures){
					$(".spatialUnitDeleteFeatureRecordBtn").attr("disabled", false);
				}
				else{
					$(".spatialUnitDeleteFeatureRecordBtn").attr("disabled", true);
				}
			}

            $rootScope.$on("showLoadingIcon_" + kommonitorDataGridHelperService.resourceType_spatialUnit, function(event){
				$timeout(function(){
				
					$scope.loadingData = true;
				});	
			});

			$rootScope.$on("hideLoadingIcon_" + kommonitorDataGridHelperService.resourceType_spatialUnit, function(event){
				$timeout(function(){
				
					$scope.loadingData = false;
				});	
			});

			$rootScope.$on("onDeleteFeatureEntry_" + kommonitorDataGridHelperService.resourceType_spatialUnit, function(event){
				$rootScope.$broadcast("refreshSpatialUnitOverviewTable", "edit", $scope.currentSpatialUnitDataset.spatialUnitId);
				$scope.refreshSpatialUnitEditFeaturesOverviewTable();
			});

	}
]});
