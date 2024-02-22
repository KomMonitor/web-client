angular.module('indicatorEditFeaturesModal').component('indicatorEditFeaturesModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditFeaturesModal/indicator-edit-features-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorDataGridHelperService', 'kommonitorImporterHelperService', 
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorMultiStepFormHelperService',
		function IndicatorEditFeaturesModalController(kommonitorDataExchangeService, kommonitorDataGridHelperService, 
			kommonitorImporterHelperService, $scope, $rootScope, $http, __env, $timeout, kommonitorMultiStepFormHelperService) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
			this.kommonitorDataGridHelperServiceInstance = kommonitorDataGridHelperService;
	
			/*	PUT BODY
				{
					"indicatorValues": [
						{
						"spatialReferenceKey": "spatialReferenceKey",
						"valueMapping": [
							{
							"indicatorValue": 0.8008282,
							"timestamp": "2000-01-23"
							},
							{
							"indicatorValue": 0.8008282,
							"timestamp": "2000-01-23"
							}
						]
						},
						{
						"spatialReferenceKey": "spatialReferenceKey",
						"valueMapping": [
							{
							"indicatorValue": 0.8008282,
							"timestamp": "2000-01-23"
							},
							{
							"indicatorValue": 0.8008282,
							"timestamp": "2000-01-23"
							}
						]
						}
					],
					"applicableSpatialUnit": "applicableSpatialUnit",
					"permissions": [
						
					]
					"defaultClassificationMapping": {
						"colorBrewerSchemeName": "colorBrewerSchemeName",
						"items": [
						{
							"defaultCustomRating": "defaultCustomRating",
							"defaultColorAsHex": "defaultColorAsHex"
						},
						{
							"defaultCustomRating": "defaultCustomRating",
							"defaultColorAsHex": "defaultColorAsHex"
						}
						]
					}
					}
			*/
	
			

			$scope.roleManagementTableOptions = undefined;

			$scope.$on("availableRolesUpdate", function (event) {
				refreshRoles();
			});
	
			// make sure that initial fetching of availableRoles has happened
			$scope.$on("initialMetadataLoadingCompleted", function (event) {
				refreshRoles();
			});
			
			function refreshRoles() {
				let permissions = $scope.targetApplicableSpatialUnit ? $scope.targetApplicableSpatialUnit.permissions : [];
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditFeaturesRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, permissions, true);
			}
	
			$scope.indicatorFeaturesJSON;
			$scope.currentIndicatorDataset;
			$scope.targetApplicableSpatialUnit;
			$scope.remainingFeatureHeaders;

			$scope.indicatorMappingConfigImportError;
			$scope.indicatorsEditFeaturesMappingConfigPre = kommonitorDataExchangeService.syntaxHighlightJSON(kommonitorImporterHelperService.mappingConfigStructure_indicator);


			$scope.overviewTableTargetSpatialUnitMetadata = undefined;
	
			$scope.spatialUnitRefKeyProperty = undefined;
			$scope.targetSpatialUnitMetadata = undefined;
			

			$scope.converter = undefined;
			$scope.schema = undefined;
			$scope.mimeType = undefined;
			$scope.datasourceType = undefined;
			$scope.indicatorDataSourceIdProperty = undefined;
			$scope.indicatorDataSourceNameProperty = undefined;

			$scope.converterDefinition = undefined;
			$scope.datasourceTypeDefinition = undefined;
			$scope.propertyMappingDefinition = undefined;
			$scope.putBody_indicators = undefined;

			$scope.keepMissingValues = true;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$scope.importerErrors = undefined;

			$scope.loadingData = false;

			$scope.timeseriesMappingReference; // gets updated by a broadcast whenever $scope.timeseries mapping in indicatorEditTimeseriesMapping component changes
	
			$scope.$on("onEditIndicatorFeatures", function (event, indicatorDataset) {
				kommonitorMultiStepFormHelperService.registerClickHandler("indicatorEditFeaturesForm");
				if($scope.currentIndicatorDataset && $scope.currentIndicatorDataset.indicatorId === indicatorDataset.indicatorId){
					return;
				}
				else{
					$scope.currentIndicatorDataset = indicatorDataset;
	
					// $scope.refreshIndicatorEditFeaturesOverviewTable();
	
					$scope.resetIndicatorEditFeaturesForm();

					kommonitorDataGridHelperService.buildDataGrid_featureTable_indicatorResource("indicatorFeatureTable", [], []);
					
				}
	
			});

			// called if indicator was edited - then we must make sure that the view is refreshed
			// i.e. if a new spatial unit was setup the first time via edit menu, then we must ensure that this new spatial unit is actually 
			// visible within features overview table dropdown
			$rootScope.$on("refreshIndicatorOverviewTableCompleted", function() {
				if($scope.currentIndicatorDataset){
					$scope.currentIndicatorDataset = kommonitorDataExchangeService.getIndicatorMetadataById($scope.currentIndicatorDataset.indicatorId);

					$scope.$digest();
				}
				
			});

			$scope.filterOverviewTargetSpatialUnits = function(){
				return function( spatialUnitMetadata ) {
					if($scope.currentIndicatorDataset){
						var isIncluded = $scope.currentIndicatorDataset.applicableSpatialUnits.some(o => o.spatialUnitName === spatialUnitMetadata.spatialUnitLevel);
						return isIncluded;
					}
				  };
			};
	
			$scope.refreshIndicatorEditFeaturesOverviewTable = function(){
	
				$scope.loadingData = true;
				// fetch all indicator features
				$http({
					url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/" + $scope.overviewTableTargetSpatialUnitMetadata.spatialUnitId + "/without-geometry",
					method: "GET",
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {
	
					$scope.indicatorFeaturesJSON = response.data;
	
					var tmpRemainingHeaders = [];
	
					for (var property in $scope.indicatorFeaturesJSON[0]){
						// only show indicator date columns as editable fields
						// since we fetch the database view (with joined spatial unit), any additional information from the spatial unit must be filtered out 
						if (property.includes(__env.indicatorDatePrefix)){
							tmpRemainingHeaders.push(property);
						}						
					}

					//sort date headers
					tmpRemainingHeaders.sort((a, b) => a.localeCompare(b));

					$scope.remainingFeatureHeaders = tmpRemainingHeaders;
					kommonitorDataGridHelperService.buildDataGrid_featureTable_indicatorResource("indicatorFeatureTable", tmpRemainingHeaders, $scope.indicatorFeaturesJSON, $scope.currentIndicatorDataset.indicatorId, kommonitorDataGridHelperService.resourceType_indicator, $scope.enableDeleteFeatures, $scope.overviewTableTargetSpatialUnitMetadata.spatialUnitId);

	
						$scope.loadingData = false;
	
					}, function errorCallback(error) {
						if(error.data){							
							$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
						}
						else{
							$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
						}
	
						$("#indicatorEditFeaturesErrorAlert").show();
						$scope.loadingData = false;
				});
			};
	
			$scope.clearAllIndicatorFeatures = function(){
				$scope.loadingData = true;
				// delete all indicator features for target spatial unit
				$http({
					url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/" + $scope.overviewTableTargetSpatialUnitMetadata.spatialUnitId,
					method: "DELETE",
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {
	
					$scope.indicatorFeaturesJSON = undefined;
					$scope.remainingFeatureHeaders = undefined;
	
					$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
					// $scope.refreshIndicatorEditFeaturesOverviewTable();
					// force empty feature overview table on successful deletion of entries 
					kommonitorDataGridHelperService.buildDataGrid_featureTable_indicatorResource("indicatorFeatureTable", [], []);
	
					$scope.successMessagePart = $scope.currentIndicatorDataset.indicatorName;
	
					$("#indicatorEditFeaturesSuccessAlert").show();
					$scope.loadingData = false;
	
					}, function errorCallback(error) {
						if(error.data){							
							$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
						}
						else{
							$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
						}
	
						$("#indicatorEditFeaturesErrorAlert").show();
						$scope.loadingData = false;
				});
			};
	
			$scope.resetIndicatorEditFeaturesForm = function(){

				// reset edit banners
				kommonitorDataGridHelperService.featureTable_indicator_lastUpdate_timestamp_success = undefined;
				kommonitorDataGridHelperService.featureTable_indicator_lastUpdate_timestamp_failure = undefined;
	
				$scope.indicatorFeaturesJSON = undefined;
				$scope.remainingFeatureHeaders = undefined;

				$scope.overviewTableTargetSpatialUnitMetadata = undefined;
				for (const spatialUnitMetadataEntry of kommonitorDataExchangeService.availableSpatialUnits) {
					if($scope.currentIndicatorDataset.applicableSpatialUnits.some(o => o.spatialUnitName === spatialUnitMetadataEntry.spatialUnitLevel)){
						$scope.overviewTableTargetSpatialUnitMetadata = spatialUnitMetadataEntry;
						break;
					}					
				}
	
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditFeaturesRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, [], true);

				$scope.spatialUnitRefKeyProperty = undefined;
				$scope.targetSpatialUnitMetadata = undefined;
				$scope.targetApplicableSpatialUnit = undefined;

		
				$scope.converter = undefined;
				$scope.schema = undefined;
				$scope.mimeType = undefined;
				$scope.datasourceType = undefined;
				$scope.indicatorDataSourceIdProperty = undefined;
				$scope.indicatorDataSourceNameProperty = undefined;

				$scope.converterDefinition = undefined;
				$scope.datasourceTypeDefinition = undefined;
				$scope.propertyMappingDefinition = undefined;
				$scope.putBody_indicators = undefined;

				$scope.keepMissingValues = true;

				$scope.validityEndDate_perFeature = undefined;
				$scope.validityStartDate_perFeature = undefined;

				$scope.indicatorDataSourceIdProperty = undefined;
				$scope.indicatorDataSourceNameProperty = undefined;
	
				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;
				$scope.importerErrors = undefined;

				$rootScope.$broadcast('resetTimeseriesMapping')
	
				$("#indicatorEditFeaturesSuccessAlert").hide();
				$("#indicatorEditFeaturesErrorAlert").hide();

				setTimeout(() => {
					$scope.$digest();	
				}, 250);
				
			};

			$scope.onChangeSelectedSpatialUnit = function(targetSpatialUnitMetadata){
				
				var applicableSpatialUnits = $scope.currentIndicatorDataset.applicableSpatialUnits;

				for (const applicableSpatialUnit of applicableSpatialUnits) {
					if (applicableSpatialUnit.spatialUnitId === targetSpatialUnitMetadata.spatialUnitId){
						$scope.targetApplicableSpatialUnit = applicableSpatialUnit;
						break;
					}
				}
				
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditFeaturesRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.targetApplicableSpatialUnit.permissions, true);

			};
	
			$scope.onChangeConverter = function(){
				$scope.schema = $scope.converter.schemas ? $scope.converter.schemas[0] : undefined;
				$scope.mimeType = $scope.converter.mimeTypes[0];
			};

			$scope.onChangeMimeType = function(mimeType){
				$scope.mimeType = mimeType;
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

			
	
	
			$scope.getFeatureId = function(jsonFeature){
				return jsonFeature[__env.FEATURE_ID_PROPERTY_NAME];
			};
	
			$scope.getFeatureName = function(jsonFeature){
				return jsonFeature[__env.FEATURE_NAME_PROPERTY_NAME];
			};
	
			
			$scope.buildImporterObjects = async function(){
				$scope.converterDefinition = $scope.buildConverterDefinition();
				$scope.datasourceTypeDefinition = await $scope.buildDatasourceTypeDefinition();
				$scope.propertyMappingDefinition = $scope.buildPropertyMappingDefinition();

				let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);

				// TODO FIXME currently set owner the same as indicator metadata
				// is there a use case where different indicator spatial units timeseries may have different owners?  

				var scopeProperties = {
					"targetSpatialUnitMetadata": {
						"spatialUnitLevel": $scope.targetSpatialUnitMetadata.spatialUnitLevel,	
					},
					"currentIndicatorDataset": {
						"defaultClassificationMapping": $scope.currentIndicatorDataset.defaultClassificationMapping
					},
					"permissions": roleIds,
					"ownerId": $scope.currentIndicatorDataset.ownerId
				}
				$scope.putBody_indicators = kommonitorImporterHelperService.buildPutBody_indicators(scopeProperties);
	
				if(!$scope.converterDefinition || !$scope.datasourceTypeDefinition || !$scope.propertyMappingDefinition || !$scope.putBody_indicators){
					return false;
				}
	
				return true;
			};
	
			$scope.buildConverterDefinition = function(){
	
				return kommonitorImporterHelperService.buildConverterDefinition($scope.converter, "converterParameter_indicatorEditFeatures_", $scope.schema, $scope.mimeType);			
			};
	
			$scope.buildDatasourceTypeDefinition = async function(){
				try {
					return await kommonitorImporterHelperService.buildDatasourceTypeDefinition($scope.datasourceType, 'datasourceTypeParameter_indicatorEditFeatures_', 'indicatorDataSourceInput_editFeatures');			
				} catch (error) {
					if(error.data){							
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}
	
					$("#indicatorEditFeaturesErrorAlert").show();
					$scope.loadingData = false;
					return null;
				}			
			};
	
			$scope.buildPropertyMappingDefinition = function(){
				// arsion from is undefined currently
				let timeseriesMappingForImporter = [];
				timeseriesMappingForImporter = $scope.timeseriesMappingReference;
				console.log("timeseriesMappingForImporter: ", timeseriesMappingForImporter);
				return kommonitorImporterHelperService.buildPropertyMapping_indicatorResource($scope.spatialUnitRefKeyProperty, timeseriesMappingForImporter, $scope.keepMissingValues);	
			};
	
			
	
	
			$scope.editIndicatorFeatures = async function(){

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
	
						var updateIndicatorResponse_dryRun = undefined;
						try {
							updateIndicatorResponse_dryRun = await kommonitorImporterHelperService.updateIndicator($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentIndicatorDataset.indicatorId, $scope.putBody_indicators, true);
	
							// this callback will be called asynchronously
							// when the response is available
	
							if(! kommonitorImporterHelperService.importerResponseContainsErrors(updateIndicatorResponse_dryRun)){
								// all good, really execute the request to import data against data management API
								var updateIndicatorResponse = await kommonitorImporterHelperService.updateIndicator($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentIndicatorDataset.indicatorId, $scope.putBody_indicators, false);						
	
								$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
								// $scope.refreshIndicatorEditFeaturesOverviewTable();
	
								$scope.successMessagePart = $scope.currentIndicatorDataset.indicatorName;
								$scope.importedFeatures = kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(updateIndicatorResponse);
	
								$("#indicatorEditFeaturesSuccessAlert").show();
								$scope.loadingData = false;
							}
							else{
								// errors ocurred
								// show them 
								$scope.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
								$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateIndicatorResponse_dryRun);
	
								$("#indicatorEditFeaturesErrorAlert").show();
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
							if(updateIndicatorResponse_dryRun){
								$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateIndicatorResponse_dryRun);
							}
							
							$("#indicatorEditFeaturesErrorAlert").show();
							$scope.loadingData = false;
	
							setTimeout(() => {
								$scope.$digest();
							}, 250);
						}
					}
			};

			$scope.onImportIndicatorEditFeaturesMappingConfig = function(){

				$scope.indicatorMappingConfigImportError = "";
	
				$("#indicatorMappingConfigEditFeaturesImportFile").files = [];
	
				// trigger file chooser
				$("#indicatorMappingConfigEditFeaturesImportFile").click();
	
			};
	
			$(document).on("change", "#indicatorMappingConfigEditFeaturesImportFile" ,function(){
	
				console.log("Importing Importer Mapping Config for EditFeatures Indicator Form");
	
				// get the file
				var file = document.getElementById('indicatorMappingConfigEditFeaturesImportFile').files[0];
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
						$scope.indicatorMappingConfigImportError = "Uploaded MappingConfig File cannot be parsed correctly";
						document.getElementById("indicatorsEditFeaturesMappingConfigPre").innerHTML = $scope.indicatorMappingConfigStructure_pretty;
						$("#indicatorEditFeaturesMappingConfigImportErrorAlert").show();
	
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
					$scope.indicatorMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster &uuml;berein.";
					document.getElementById("indicatorsEditFeaturesMappingConfigPre").innerHTML = $scope.indicatorMappingConfigStructure_pretty;
					$("#indicatorEditFeaturesMappingConfigImportErrorAlert").show();
	
					$scope.$digest();
				}
				
				  $scope.converter = undefined;
				for(var converter of kommonitorImporterHelperService.availableConverters){
					if (converter.name === $scope.mappingConfigImportSettings.converter.name){
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
					for(var datasourceType of kommonitorImporterHelperService.availableDatasourceTypes){
						if (datasourceType.type === $scope.mappingConfigImportSettings.dataSource.type){
							$scope.datasourceType = datasourceType;					
							break;
						}
					}
	
					$scope.$digest();
	
					// converter parameters
					if ($scope.converter){
						for (var convParameter of $scope.mappingConfigImportSettings.converter.parameters) {
							$("#converterParameter_indicatorEditFeatures_" + convParameter.name).val(convParameter.value);
						}
					}	
	
					// datasourceTypes parameters
					if ($scope.datasourceType){
						for (var dsParameter of $scope.mappingConfigImportSettings.dataSource.parameters) {
							$("#datasourceTypeParameter_indicatorEditFeatures_" + dsParameter.name).val(dsParameter.value);
						}
					}
					
					// property Mapping
					$scope.spatialUnitRefKeyProperty = $scope.mappingConfigImportSettings.propertyMapping.spatialReferenceKeyProperty; 
					
					$scope.$broadcast('loadTimeseriesMapping', { mapping: $scope.mappingConfigImportSettings.propertyMapping.timeseriesMappings } );

					if($scope.mappingConfigImportSettings.targetSpatialUnitName){
						for (const spatialUnitMetadata of kommonitorDataExchangeService.availableSpatialUnits) {
							if(spatialUnitMetadata.spatialUnitLevel === $scope.mappingConfigImportSettings.targetSpatialUnitName){
								$scope.targetSpatialUnitMetadata = spatialUnitMetadata;
							}
						
						}	
					}
		
					$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditFeaturesRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.mappingConfigImportSettings.permissions, true);

					$scope.keepMissingValues = $scope.mappingConfigImportSettings.propertyMapping.keepMissingOrNullValueIndicator;
					
					$scope.$digest();
			};
	
			$scope.onExportIndicatorEditFeaturesMappingConfig = async function(){
				var converterDefinition = $scope.buildConverterDefinition();
				var datasourceTypeDefinition = await $scope.buildDatasourceTypeDefinition();
				var propertyMappingDefinition = $scope.buildPropertyMappingDefinition();			
	
				var mappingConfigExport = {
					"converter": converterDefinition,
					"dataSource": datasourceTypeDefinition,
					"propertyMapping": propertyMappingDefinition,
					"targetSpatialUnitName": $scope.targetSpatialUnitMetadata.spatialUnitLevel,
					"permissions": []
				};

				mappingConfigExport.permissions = [];

				let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
				for (const roleId of roleIds) {
					mappingConfigExport.permissions.push(roleId);
				}
	
				mappingConfigExport.periodOfValidity = $scope.periodOfValidity;
	
				var name = $scope.datasetName;
	
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
					$("#indicatorEditFeaturesSuccessAlert").hide();
				};
	
				$scope.hideErrorAlert = function(){
					$("#indicatorEditFeaturesErrorAlert").hide();
				};

				$scope.hideMappingConfigErrorAlert = function(){
					$("#indicatorEditFeaturesMappingConfigImportErrorAlert").hide();
				};

				$rootScope.$on("showLoadingIcon_" + kommonitorDataGridHelperService.resourceType_indicator, function(event){
					$timeout(function(){
					
						$scope.loadingData = true;
					});	
				});
	
				$rootScope.$on("hideLoadingIcon_" + kommonitorDataGridHelperService.resourceType_indicator, function(event){
					$timeout(function(){
					
						$scope.loadingData = false;
					});	
				});
	
				$rootScope.$on("onDeleteFeatureEntry_" + kommonitorDataGridHelperService.resourceType_indicator, function(event){
					$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
					$scope.refreshIndicatorEditFeaturesOverviewTable();
				});
	
				$scope.onChangeEnableDeleteFeatures = function(){
					if($scope.enableDeleteFeatures){
						$(".indicatorDeleteFeatureRecordBtn").attr("disabled", false);
					}
					else{
						$(".indicatorDeleteFeatureRecordBtn").attr("disabled", true);
					}
				}

				$rootScope.$on("timeseriesMappingChanged", function(event, data) {
					$scope.timeseriesMappingReference = data.mapping;
				});

	}
]});
