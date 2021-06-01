angular.module('indicatorEditFeaturesModal').component('indicatorEditFeaturesModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditFeaturesModal/indicator-edit-features-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorDataGridHelperService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function IndicatorEditFeaturesModalController(kommonitorDataExchangeService, kommonitorDataGridHelperService, 
			kommonitorImporterHelperService, $scope, $rootScope, $http, __env, $timeout) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
	
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
					"allowedRoles": [
						
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
	
			

			$scope.allowedRoleNames = {selectedItems: []};
			$scope.duallist = {duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, null, "roleName")};			

			// make sure that initial fetching of availableRoles has happened
			$scope.$on("initialMetadataLoadingCompleted", function (event) {
				$timeout(function () {
					$scope.allowedRoleNames = { selectedItems: [] };
					$scope.duallist = { duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, null, "roleName") };
				});
			});
	
			$scope.indicatorFeaturesJSON;
			$scope.currentIndicatorDataset;
			$scope.remainingFeatureHeaders;

			$scope.indicatorMappingConfigImportError;
			$scope.indicatorsEditFeaturesMappingConfigPre = kommonitorDataExchangeService.syntaxHighlightJSON(kommonitorImporterHelperService.mappingConfigStructure_indicator);


			$scope.overviewTableTargetSpatialUnitMetadata = undefined;
	
			$scope.spatialUnitRefKeyProperty = undefined;
			$scope.targetSpatialUnitMetadata = undefined;
			

			$scope.converter = undefined;
			$scope.schema = undefined;
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

	
			$scope.$on("onEditIndicatorFeatures", function (event, indicatorDataset) {
	
				if($scope.currentIndicatorDataset && $scope.currentIndicatorDataset.indicatorName === indicatorDataset.indicatorName){
					return;
				}
				else{
					$scope.currentIndicatorDataset = indicatorDataset;
	
					// $scope.refreshIndicatorEditFeaturesOverviewTable();
	
					$scope.resetIndicatorEditFeaturesForm();

					kommonitorDataGridHelperService.buildDataGrid_featureTable("indicatorFeatureTable", [], []);
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

			$scope.filterImporterConverters = function(){
				return function( converterMetadata ) {
					if(converterMetadata && converterMetadata.simpleName && converterMetadata.simpleName.includes("LatLon")){
						return false;
					}
					return true;
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
						if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME){
							tmpRemainingHeaders.push(property);
						}
					}
	
					$scope.remainingFeatureHeaders = tmpRemainingHeaders;
					kommonitorDataGridHelperService.buildDataGrid_featureTable("indicatorFeatureTable", tmpRemainingHeaders, $scope.indicatorFeaturesJSON);

	
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
	
				$scope.indicatorFeaturesJSON = undefined;
				$scope.remainingFeatureHeaders = undefined;

				$scope.overviewTableTargetSpatialUnitMetadata = undefined;
				for (const spatialUnitMetadataEntry of kommonitorDataExchangeService.availableSpatialUnits) {
					if($scope.currentIndicatorDataset.applicableSpatialUnits.some(o => o.spatialUnitName === spatialUnitMetadataEntry.spatialUnitLevel)){
						$scope.overviewTableTargetSpatialUnitMetadata = spatialUnitMetadataEntry;
						break;
					}					
				}
	
				$scope.allowedRoleNames = {selectedItems: []};
				$scope.duallist = {duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, null, "roleName")};			

				$scope.spatialUnitRefKeyProperty = undefined;
				$scope.targetSpatialUnitMetadata = undefined;

		
				$scope.converter = undefined;
				$scope.schema = undefined;
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

				var targetApplicableSpatialUnit;

				for (const applicableSpatialUnit of applicableSpatialUnits) {
					if (applicableSpatialUnit.spatialUnitId === targetSpatialUnitMetadata.spatialUnitId){
						targetApplicableSpatialUnit = applicableSpatialUnit;
						break;
					}
				}
				
				var selectedRolesMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleIds(targetApplicableSpatialUnit.allowedRoles);			
				$scope.duallist = {duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, selectedRolesMetadata, "roleName")};			
				$scope.allowedRoleNames = {selectedItems: $scope.duallist.duallistRoleOptions.selectedItems};

			};
	
			$scope.onChangeSchema = function(schema){
				$scope.schema = schema;
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
				var scopeProperties = {
					"targetSpatialUnitMetadata": {
						"spatialUnitLevel": $scope.targetSpatialUnitMetadata.spatialUnitLevel,	
					},
					"currentIndicatorDataset": {
						"defaultClassificationMapping": $scope.currentIndicatorDataset.defaultClassificationMapping
					},
					"allowedRoleNames": {
						"selectedItems": $scope.allowedRoleNames.selectedItems
					}
				}
				$scope.putBody_indicators = kommonitorImporterHelperService.buildPutBody_indicators(scopeProperties);
	
				if(!$scope.converterDefinition || !$scope.datasourceTypeDefinition || !$scope.propertyMappingDefinition || !$scope.putBody_indicators){
					return false;
				}
	
				return true;
			};
	
			$scope.buildConverterDefinition = function(){
	
				return kommonitorImporterHelperService.buildConverterDefinition($scope.converter, "converterParameter_indicatorEditFeatures_", $scope.schema);			
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
				// adds a variable timeseriesMappingBackup to $scope that holds a reference to the timeseries mapping
				$scope.$broadcast('getTimeseriesMapping', { varname: "timeseriesMappingBackup"});
				timeseriesMappingForImporter = $scope.timeseriesMappingBackup;
				delete $scope.timeseriesMappingBackup;
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
					
					timeseriesMappingToLoad = $scope.mappingConfigImportSettings.propertyMapping.timeseriesMappings;
					$scope.$broadcast('loadTimeseriesMapping', { mapping: timeseriesMappingToLoad } )

					if($scope.mappingConfigImportSettings.targetSpatialUnitName){
						for (const spatialUnitMetadata of kommonitorDataExchangeService.availableSpatialUnits) {
							if(spatialUnitMetadata.spatialUnitLevel === $scope.mappingConfigImportSettings.targetSpatialUnitName){
								$scope.targetSpatialUnitMetadata = spatialUnitMetadata;
							}
						
						}	
					}

					var selectedRolesMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleIds($scope.mappingConfigImportSettings.allowedRoles);			
					$scope.duallist = {duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, selectedRolesMetadata, "roleName")};			
					$scope.allowedRoleNames = {selectedItems: $scope.duallist.duallistRoleOptions.selectedItems};

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
					"allowedRoles": []
				};

				mappingConfigExport.allowedRoles = [];
				for (const roleDuallistItem of $scope.allowedRoleNames.selectedItems) {
					var roleMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleName(roleDuallistItem.name);
					mappingConfigExport.allowedRoles.push(roleMetadata.roleId);
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
	
				/*
				MULTI STEP FORM STUFF
				*/
				//jQuery time
				$scope.current_fs; 
				$scope.next_fs; 
				$scope.previous_fs; //fieldsets
				$scope.opacity; 
				$scope.scale; //fieldset properties which we will animate
				$scope.animating; //flag to prevent quick multi-click glitches
	
				$(".next_editFeaturesIndicator").click(function(){
					if($scope.animating) return false;
					$scope.animating = true;
					
					$scope.current_fs = $(this).parent();
					$scope.next_fs = $(this).parent().next();
					
					//activate next step on progressbar using the index of $scope.next_fs
					$("#progressbar li").eq($("fieldset").index($scope.next_fs)).addClass("active");
					
					//show the next fieldset
					$scope.next_fs.show(); 
					//hide the current fieldset with style
					$scope.current_fs.animate({opacity: 0}, {
						step: function(now, mx) {
							//as the $scope.opacity of current_fs reduces to 0 - stored in "now"
							//1. $scope.scale current_fs down to 80%
							$scope.scale = 1 - (1 - now) * 0.2;
							//2. bring $scope.next_fs from the right(50%)
							// left = (now * 50)+"%";
							//3. increase $scope.opacity of $scope.next_fs to 1 as it moves in
							$scope.opacity = 1 - now;
							$scope.current_fs.css({
								'position': 'absolute'
							});
							// $scope.next_fs.css({'left': left, '$scope.opacity': $scope.opacity});
							$scope.next_fs.css({'opacity': $scope.opacity});
						}, 
						duration: 200, 
						complete: function(){
							$scope.current_fs.hide();
							$scope.animating = false;
						}, 
						//this comes from the custom easing plugin
						easing: 'easeInOutBack'
					});
				});
	
				$(".previous_editFeaturesIndicator").click(function(){
					if($scope.animating) return false;
					$scope.animating = true;
					
					$scope.current_fs = $(this).parent();
					$scope.previous_fs = $(this).parent().prev();
					
					//de-activate current step on progressbar
					$("#progressbar li").eq($("fieldset").index($scope.current_fs)).removeClass("active");
					
					//show the previous fieldset
					$scope.previous_fs.show(); 
					//hide the current fieldset with style
					$scope.current_fs.animate({opacity: 0}, {
						step: function(now, mx) {
							//as the $scope.opacity of current_fs reduces to 0 - stored in "now"
							//1. $scope.scale $scope.previous_fs from 80% to 100%
							$scope.scale = 0.8 + (1 - now) * 0.2;
							//2. take current_fs to the right(50%) - from 0%
							// left = ((1-now) * 50)+"%";
							//3. increase $scope.opacity of $scope.previous_fs to 1 as it moves in
							$scope.opacity = 1 - now;
							// current_fs.css({'left': left});
							// $scope.previous_fs.css({'transform': '$scope.scale('+$scope.scale+')', '$scope.opacity': $scope.opacity});
							$scope.previous_fs.css({
								'position': 'absolute'
							});
							$scope.previous_fs.css({'opacity': $scope.opacity});
						}, 
						duration: 200, 
						complete: function(){
							$scope.current_fs.hide();
							$scope.previous_fs.css({
								'position': 'relative'
							});
							$scope.animating = false;
						}, 
						//this comes from the custom easing plugin
						easing: 'easeInOutBack'
					});
				});

	}
]});
