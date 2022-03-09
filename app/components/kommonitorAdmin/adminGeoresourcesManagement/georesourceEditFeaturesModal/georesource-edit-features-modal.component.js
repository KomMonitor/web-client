angular.module('georesourceEditFeaturesModal').component('georesourceEditFeaturesModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditFeaturesModal/georesource-edit-features-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorDataGridHelperService', 'kommonitorSingleFeatureMapHelperService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function GeoresourcesEditFeaturesModalController(kommonitorDataExchangeService, kommonitorDataGridHelperService, kommonitorSingleFeatureMapHelperService,
			kommonitorImporterHelperService, $scope, $rootScope, $http, __env, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
		this.kommonitorDataGridHelperServiceInstance = kommonitorDataGridHelperService;
		this.kommonitorSingleFeatureMapHelperServiceInstance = kommonitorSingleFeatureMapHelperService;

		/*	PUT BODY
		{
		"geoJsonString": "geoJsonString",
		"periodOfValidity": {
		"endDate": "2000-01-23",
		"startDate": "2000-01-23"
		}
		}
		*/

		//Date picker
    $('#georesourceEditFeaturesDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#georesourceEditFeaturesDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#georesourceSingleFeatureDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#georesourceSingleFeatureDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$scope.georesourceFeaturesGeoJSON;
		$scope.currentGeoresourceDataset;
		$scope.remainingFeatureHeaders;

		$scope.georesourceMappingConfigStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON(kommonitorImporterHelperService.mappingConfigStructure);	
		$scope.georesourceMappingConfigImportError;

		$scope.loadingData = false;

		// variables for single feature import
		$scope.featureIdValue = undefined;
		$scope.featureNameValue = undefined;
		$scope.featureGeometryValue = undefined;
		$scope.featureStartDateValue = undefined;
		$scope.featureEndDateValue = undefined;
		// [{property: name, value: value}]
		$scope.featureSchemaProperties = []; 

		$scope.isPartialUpdate = false;

		// variables for multiple feature import

		$scope.periodOfValidity = {};
		$scope.periodOfValidity.startDate = undefined;
		$scope.periodOfValidity.endDate = undefined;
		$scope.periodOfValidityInvalid = false;

		$scope.georesourceEditFeaturesDataSourceInputInvalidReason = undefined;
		$scope.georesourceEditFeaturesDataSourceInputInvalid = false;
		$scope.georesourceDataSourceIdProperty = undefined;
		$scope.georesourceDataSourceNameProperty = undefined;

		$scope.converter = undefined;
		$scope.schema = undefined;
			$scope.datasourceType = undefined;
			$scope.georesourceDataSourceIdProperty = undefined;
			$scope.georesourceDataSourceNameProperty = undefined;

			$scope.converterDefinition = undefined;
			$scope.datasourceTypeDefinition = undefined;
			$scope.propertyMappingDefinition = undefined;
			$scope.putBody_georesources = undefined;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;

			$scope.attributeMapping_sourceAttributeName = undefined;
			$scope.attributeMapping_destinationAttributeName = undefined;
			$scope.attributeMapping_data = undefined;
			$scope.attributeMapping_attributeType = kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
			$scope.attributeMappings_adminView = [];
			$scope.keepAttributes = true;
			$scope.keepMissingValues = true;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;
		$scope.importerErrors = undefined;

		$scope.$on("onEditGeoresourceFeatures", function (event, georesourceDataset) {

			if($scope.currentGeoresourceDataset && $scope.currentGeoresourceDataset.datasetName === georesourceDataset.datasetName){
				return;
			}
			else{
				$scope.currentGeoresourceDataset = georesourceDataset;

				// $scope.refreshGeoresourceEditFeaturesOverviewTable();

				$scope.resetGeoresourceEditFeaturesForm();

				kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource("georesourceFeatureTable", [], []);

				// init geomap for single feature import, handling geocoding and feature geometry
				let domId = "singleFeatureGeoMap";
				let resourceType = kommonitorSingleFeatureMapHelperService.resourceType_point;
				if($scope.currentGeoresourceDataset.isLOI){
					resourceType = kommonitorSingleFeatureMapHelperService.resourceType_line;
				}
				else if($scope.currentGeoresourceDataset.isAOI){
					resourceType = kommonitorSingleFeatureMapHelperService.resourceType_polygon;
				}
				kommonitorSingleFeatureMapHelperService.initSingleFeatureGeoMap(domId, resourceType);

				// init featureSchema for single feature import
				$scope.initFeatureSchema();
			}

		});

		$scope.initFeatureSchema = function(){
			$scope.featureSchemaProperties = [];

			$http({
				url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/schema",
				method: "GET",
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {

				let schemaObject = response.data;

				for (var property in schemaObject){
					if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME){
						$scope.featureSchemaProperties.push(
							{property: property,
							value: undefined}
						);
					}
				}

				}, function errorCallback(error) {
					
			});
		};

		$scope.addSingleGeoresourceFeature = async function(){

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
				var allDataSpecified = await $scope.buildImporterObjects_singleFeatureImport();

				if (!allDataSpecified) {

					$("#georesourceEditFeaturesForm").validator("update");
					$("#georesourceEditFeaturesForm").validator("validate");
					return;
				}
				else {


					// TODO verify input

					// TODO Create and perform POST Request with loading screen

					var updateGeoresourceResponse_dryRun = undefined;
					try {
						updateGeoresourceResponse_dryRun = await kommonitorImporterHelperService.updateGeoresource($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentGeoresourceDataset.georesourceId, $scope.putBody_georesources, true);

						// this callback will be called asynchronously
						// when the response is available




						if(! kommonitorImporterHelperService.importerResponseContainsErrors(updateGeoresourceResponse_dryRun)){
							// all good, really execute the request to import data against data management API
							var updateGeoresourceResponse = await kommonitorImporterHelperService.updateGeoresource($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentGeoresourceDataset.georesourceId, $scope.putBody_georesources, false);						

							$rootScope.$broadcast("refreshGeoresourceOverviewTable", "edit", $scope.currentGeoresourceDataset.georesourceId);
							// $scope.refreshGeoresourceEditFeaturesOverviewTable();

							$scope.successMessagePart = $scope.currentGeoresourceDataset.datasetName;
							$scope.importedFeatures = kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(updateGeoresourceResponse);

							$("#georesourceEditFeaturesSuccessAlert").show();
							$scope.loadingData = false;
						}
						else{
							// errors ocurred
							// show them 
							$scope.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateGeoresourceResponse_dryRun);

							$("#georesourceEditFeaturesErrorAlert").show();
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
						if(updateGeoresourceResponse_dryRun){
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateGeoresourceResponse_dryRun);
						}
						
						$("#georesourceEditFeaturesErrorAlert").show();
						$scope.loadingData = false;

						setTimeout(() => {
							$scope.$digest();
						}, 250);
					}
				}
		};

		$scope.$on("onUpdateSingleFeatureGeometry", function(event, geoJSON){
			$scope.featureGeometryValue = geoJSON;
		});

		$scope.refreshGeoresourceEditFeaturesOverviewTable = function(){

			$scope.loadingData = true;
			// fetch all georesource features
			$http({
				url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/allFeatures",
				method: "GET",
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {

				$scope.georesourceFeaturesGeoJSON = response.data;

				var tmpRemainingHeaders = [];

				for (var property in $scope.georesourceFeaturesGeoJSON.features[0].properties){
					if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME){
						tmpRemainingHeaders.push(property);
					}
				}

				$scope.remainingFeatureHeaders = tmpRemainingHeaders;

				// as we require the information about the dataset ID within each feature to enable feature record updates from within the datatable
				// we must include the dataset ID within each feature 

				kommonitorDataGridHelperService.buildDataGrid_featureTable_spatialResource("georesourceFeatureTable", tmpRemainingHeaders, $scope.georesourceFeaturesGeoJSON.features, $scope.currentGeoresourceDataset.georesourceId, kommonitorDataGridHelperService.resourceType_georesource, $scope.enableDeleteFeatures);


					$scope.loadingData = false;

				}, function errorCallback(error) {
					if(error.data){							
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#georesourceEditFeaturesErrorAlert").show();
					$scope.loadingData = false;
			});
		};

		$scope.clearAllGeoresourceFeatures = function(){
			$scope.loadingData = true;
			// delete all georesource features
			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/allFeatures",
				method: "DELETE",
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {

				$scope.georesourceFeaturesGeoJSON = undefined;
				$scope.remainingFeatureHeaders = undefined;

				$rootScope.$broadcast("refreshGeoresourceOverviewTable", "edit", $scope.currentGeoresourceDataset.georesourceId);
				// $scope.refreshGeoresourceEditFeaturesOverviewTable();

				$scope.successMessagePart = $scope.currentGeoresourceDataset.datasetName;

				$("#georesourceEditFeaturesSuccessAlert").show();
				$scope.loadingData = false;

				}, function errorCallback(error) {
					if(error.data){							
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#georesourceEditFeaturesErrorAlert").show();
					$scope.loadingData = false;
			});
		};

		$scope.resetGeoresourceEditFeaturesForm = function(){

			// reset edit banners
			kommonitorDataGridHelperService.featureTable_georesource_lastUpdate_timestamp_success = undefined;
			kommonitorDataGridHelperService.featureTable_georesource_lastUpdate_timestamp_failure = undefined;

			// variables for single feature import
			$scope.featureIdValue = undefined;
			$scope.featureNameValue = undefined;
			$scope.featureGeometryValue = undefined;
			$scope.featureStartDateValue = undefined;
			$scope.featureEndDateValue = undefined;
			// [{property: name, value: value}]
			$scope.featureSchemaProperties = []; 

			//variables for multiple feature import

			$scope.georesourceFeaturesGeoJSON = undefined;
			$scope.remainingFeatureHeaders = undefined;

			$scope.periodOfValidity = {};
			$scope.periodOfValidity.startDate = undefined;
			$scope.periodOfValidity.endDate = undefined;
			$scope.periodOfValidityInvalid = false;

			$scope.georesourceEditFeaturesDataSourceInputInvalidReason = undefined;
			$scope.georesourceEditFeaturesDataSourceInputInvalid = false;
			$scope.georesourceDataSourceIdProperty = undefined;
			$scope.georesourceDataSourceNameProperty = undefined;

			$scope.converter = undefined;
			$scope.schema = undefined;
			$scope.datasourceType = undefined;
			$scope.georesourceDataSourceIdProperty = undefined;
			$scope.georesourceDataSourceNameProperty = undefined;

			$scope.converterDefinition = undefined;
			$scope.datasourceTypeDefinition = undefined;
			$scope.propertyMappingDefinition = undefined;
			$scope.putBody_georesources = undefined;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;

			$scope.attributeMapping_sourceAttributeName = undefined;
			$scope.attributeMapping_destinationAttributeName = undefined;
			$scope.attributeMapping_data = undefined;
			$scope.attributeMapping_attributeType = kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
			$scope.attributeMappings_adminView = [];
			$scope.keepAttributes = true;
			$scope.keepMissingValues = true;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$scope.importerErrors = undefined;

			$("#georesourceEditFeaturesSuccessAlert").hide();
			$("#georesourceEditFeaturesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();	
			}, 250);
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

			var scopeProperties = {
				"periodOfValidity": {
					"endDate": $scope.periodOfValidity.endDate,
					"startDate": $scope.periodOfValidity.startDate
				},
				"isPartialUpdate": $scope.isPartialUpdate
			}
			$scope.putBody_georesources = kommonitorImporterHelperService.buildPutBody_georesources(scopeProperties);

			if(!$scope.converterDefinition || !$scope.datasourceTypeDefinition || !$scope.propertyMappingDefinition || !$scope.putBody_georesources){
				return false;
			}

			return true;
		};

		$scope.buildConverterDefinition = function(){

			return kommonitorImporterHelperService.buildConverterDefinition($scope.converter, "converterParameter_georesourceEditFeatures_", $scope.schema);			
		};

		$scope.buildDatasourceTypeDefinition = async function(){
			try {
				return await kommonitorImporterHelperService.buildDatasourceTypeDefinition($scope.datasourceType, 'datasourceTypeParameter_georesourceEditFeatures_', 'georesourceDataSourceInput_editFeatures');			
			} catch (error) {
				if(error.data){							
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else{
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#georesourceEditFeaturesErrorAlert").show();
				$scope.loadingData = false;
				return null;
			}			
		};

		$scope.buildPropertyMappingDefinition = function(){
			// arsion from is undefined currently
			return kommonitorImporterHelperService.buildPropertyMapping_spatialResource($scope.georesourceDataSourceNameProperty, $scope.georesourceDataSourceIdProperty, $scope.validityStartDate_perFeature, $scope.validityEndDate_perFeature, undefined, $scope.keepAttributes, $scope.keepMissingValues, $scope.attributeMappings_adminView);
		};

		$scope.editGeoresourceFeatures = async function(){

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

					$("#georesourceEditFeaturesForm").validator("update");
					$("#georesourceEditFeaturesForm").validator("validate");
					return;
				}
				else {


					// TODO verify input

					// TODO Create and perform POST Request with loading screen

					var updateGeoresourceResponse_dryRun = undefined;
					try {
						updateGeoresourceResponse_dryRun = await kommonitorImporterHelperService.updateGeoresource($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentGeoresourceDataset.georesourceId, $scope.putBody_georesources, true);

						// this callback will be called asynchronously
						// when the response is available




						if(! kommonitorImporterHelperService.importerResponseContainsErrors(updateGeoresourceResponse_dryRun)){
							// all good, really execute the request to import data against data management API
							var updateGeoresourceResponse = await kommonitorImporterHelperService.updateGeoresource($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.currentGeoresourceDataset.georesourceId, $scope.putBody_georesources, false);						

							$rootScope.$broadcast("refreshGeoresourceOverviewTable", "edit", $scope.currentGeoresourceDataset.georesourceId);
							// $scope.refreshGeoresourceEditFeaturesOverviewTable();

							$scope.successMessagePart = $scope.currentGeoresourceDataset.datasetName;
							$scope.importedFeatures = kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(updateGeoresourceResponse);

							$("#georesourceEditFeaturesSuccessAlert").show();
							$scope.loadingData = false;
						}
						else{
							// errors ocurred
							// show them 
							$scope.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateGeoresourceResponse_dryRun);

							$("#georesourceEditFeaturesErrorAlert").show();
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
						if(updateGeoresourceResponse_dryRun){
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateGeoresourceResponse_dryRun);
						}
						
						$("#georesourceEditFeaturesErrorAlert").show();
						$scope.loadingData = false;

						setTimeout(() => {
							$scope.$digest();
						}, 250);
					}
				}
		};

		$scope.onImportGeoresourceEditFeaturesMappingConfig = function(){

			$scope.georesourceMappingConfigImportError = "";

			$("#georesourceMappingConfigEditFeaturesImportFile").files = [];

			// trigger file chooser
			$("#georesourceMappingConfigEditFeaturesImportFile").click();

		};

		$(document).on("change", "#georesourceMappingConfigEditFeaturesImportFile" ,function(){

			console.log("Importing Importer Mapping Config for EditFeatures Georesource Form");

			// get the file
			var file = document.getElementById('georesourceMappingConfigEditFeaturesImportFile').files[0];
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
					$scope.georesourceMappingConfigImportError = "Uploaded MappingConfig File cannot be parsed correctly";
					document.getElementById("georesourcesEditFeaturesMappingConfigPre").innerHTML = $scope.georesourceMappingConfigStructure_pretty;
					$("#georesourceEditFeaturesMappingConfigImportErrorAlert").show();

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
				$scope.georesourceMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster &uuml;berein.";
				document.getElementById("georesourcesEditFeaturesMappingConfigPre").innerHTML = $scope.georesourceMappingConfigStructure_pretty;
				$("#georesourceEditFeaturesMappingConfigImportErrorAlert").show();

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
            			$("#converterParameter_georesourceEditFeatures_" + convParameter.name).val(convParameter.value);
					}
				}	

				// datasourceTypes parameters
				if ($scope.datasourceType){
					for (var dsParameter of $scope.mappingConfigImportSettings.dataSource.parameters) {
            			$("#datasourceTypeParameter_georesourceEditFeatures_" + dsParameter.name).val(dsParameter.value);
					}
				}
				
				// property Mapping
				$scope.georesourceDataSourceNameProperty = $scope.mappingConfigImportSettings.propertyMapping.nameProperty; 
				$scope.georesourceDataSourceIdProperty = $scope.mappingConfigImportSettings.propertyMapping.identifierProperty; 
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
						$("#georesourceEditFeaturesDatepickerStart").datepicker('setDate', $scope.periodOfValidity.startDate);
					}
					if ($scope.periodOfValidity.endDate){						
						$("#georesourceEditFeaturesDatepickerEnd").datepicker('setDate', $scope.periodOfValidity.endDate);
					}
				}				
				
				$scope.$digest();
		};

		$scope.onExportGeoresourceEditFeaturesMappingConfig = async function(){
			var converterDefinition = $scope.buildConverterDefinition();
			var datasourceTypeDefinition = await $scope.buildDatasourceTypeDefinition();
			var propertyMappingDefinition = $scope.buildPropertyMappingDefinition();			

			var mappingConfigExport = {
				"converter": converterDefinition,
				"dataSource": datasourceTypeDefinition,
				"propertyMapping": propertyMappingDefinition,
			};

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
				$("#georesourceEditFeaturesSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#georesourceEditFeaturesErrorAlert").hide();
			};

			$scope.hideMappingConfigErrorAlert = function(){
				$("#georesourceEditFeaturesMappingConfigImportErrorAlert").hide();
			};

			$rootScope.$on("showLoadingIcon_" + kommonitorDataGridHelperService.resourceType_georesource, function(event){
				$timeout(function(){
				
					$scope.loadingData = true;
				});	
			});

			$rootScope.$on("hideLoadingIcon_" + kommonitorDataGridHelperService.resourceType_georesource, function(event){
				$timeout(function(){
				
					$scope.loadingData = false;
				});	
			});

			$rootScope.$on("onDeleteFeatureEntry_" + kommonitorDataGridHelperService.resourceType_georesource, function(event){
				$rootScope.$broadcast("refreshGeoresourceOverviewTable", "edit", $scope.currentGeoresourceDataset.georesourceId);
				$scope.refreshGeoresourceEditFeaturesOverviewTable();
			});

			$scope.onChangeEnableDeleteFeatures = function(){
				if($scope.enableDeleteFeatures){
					$(".georesourceDeleteFeatureRecordBtn").attr("disabled", false);
				}
				else{
					$(".georesourceDeleteFeatureRecordBtn").attr("disabled", true);
				}
			}

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

			$(".next_editFeaturesGeoresource").click(function(){
				if($scope.animating) return false;
				$scope.animating = true;

				// modify state of single feature geo map
				kommonitorSingleFeatureMapHelperService.invalidateMap();
				
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

			$(".previous_editFeaturesGeoresource").click(function(){
				if($scope.animating) return false;
				$scope.animating = true;

				// modify state of single feature geo map
				kommonitorSingleFeatureMapHelperService.invalidateMap();
				
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
