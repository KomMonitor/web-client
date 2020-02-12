angular.module('indicatorAddModal').component('indicatorAddModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorAddModal/indicator-add-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env',
		function IndicatorAddModalAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

		/*	POST BODY
		{
				"isLOI": false,
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
				"allowedRoles": [
					"allowedRoles",
					"allowedRoles"
				],
				"indicatorName": "indicatorName",
				"poiSymbolBootstrap3Name": "poiSymbolBootstrap3Name",
				"poiSymbolColor": "white",
				"isAOI": false,
				"loiDashArrayString": "loiDashArrayString",
				"geoJsonString": "geoJsonString",
				"topicReference": "topicReference",
				"poiMarkerColor": "white",
				"jsonSchema": "jsonSchema",
				"periodOfValidity": {
					"endDate": "2000-01-23",
					"startDate": "2000-01-23"
				},
				"isPOI": false,
				"loiColor": "loiColor",
				"aoiColor": "aoiColor"
			}
		*/

		//Date picker
    $('#indicatorAddDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#indicatorAddDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#indicatorAddLastUpdateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$scope.indicatorMetadataStructure = {
			"metadata": {
				"note": "an optional note",
				"literature": "optional text about literature",
				"updateInterval": "YEARLY|HALF_YEARLY|QUARTERLY|MONTHLY|ARBITRARY",
				"sridEPSG": 4326,
				"datasource": "text about data source",
				"contact": "text about contact details",
				"lastUpdate": "YYYY-MM-DD",
				"description": "description about spatial unit dataset",
				"databasis": "text about data basis",
			},
			"indicatorName": "Name of indicator dataset",
			"isPOI": "boolean parameter for point of interest dataset - only one of isPOI, isLOI, isAOI can be true",
			"isLOI": "boolean parameter for lines of interest dataset - only one of isPOI, isLOI, isAOI can be true",
			"isAOI": "boolean parameter for area of interest dataset - only one of isPOI, isLOI, isAOI can be true",
			"poiSymbolBootstrap3Name": "glyphicon name of bootstrap 3 symbol to use for a POI resource",
			"poiSymbolColor": "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
			"loiDashArrayString": "dash array string value - e.g. 20 20",
			"poiMarkerColor": "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
			"loiColor": "color for lines of interest dataset",
			"aoiColor": "color for area of interest dataset"
		};

		$scope.indicatorMetadataStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON($scope.indicatorMetadataStructure);

		$scope.metadataImportSettings;
		$scope.indicatorMetadataImportError;
		$scope.indicatorMetadataImportErrorAlert;

		$scope.indicatorName = undefined;
		$scope.indicatorNameInvalid = false;

		$scope.metadata = {};
		$scope.metadata.note = undefined;
		$scope.metadata.literature = undefined;
		$scope.metadata.updateInterval = undefined;
		$scope.metadata.sridEPSG = undefined;
		$scope.metadata.datasource = undefined;
		$scope.metadata.databasis = undefined;
		$scope.metadata.contact = undefined;
		$scope.metadata.lastUpdate = undefined;
		$scope.metadata.description = undefined;

		$scope.indicatorName = undefined;
			$scope.indicatorAbbreviation = undefined;
			$scope.indicatorType = undefined;
			$scope.indicatorCharacteristicValue = undefined;
			$scope.isHeadlineIndicator = false;
			$scope.indicatorUnit = undefined;
			$scope.enableFreeTextUnit = false;
			$scope.indicatorProcessDescription = undefined;
			$scope.indicatorTagsString_withCommas = undefined;
			$scope.indicatorInterpretation = undefined;
			$scope.indicatorCreationType = undefined;
			$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = undefined;
			$scope.enableLowestSpatialUnitSelect = false;

			$scope.indicatorTopic_mainTopic = undefined;
			$scope.indicatorTopic_subTopic = undefined;
			$scope.indicatorTopic_subsubTopic = undefined;
			$scope.indicatorTopic_subsubsubTopic = undefined;

			$scope.indicatorNameFilter = undefined;
			$scope.tmpIndicatorReference_selectedIndicatorMetadata = undefined;
			$scope.tmpIndicatorReference_referenceDescription = undefined;
			// tmp array to display indicatorReferences
			$scope.indicatorReferences_adminView = [];
			// array for API request (has less information per item)
			$scope.indicatorReferences_apiRequest = [];

			$scope.georesourceNameFilter = undefined;
			$scope.tmpGeoresourceReference_selectedGeoresourceMetadata = undefined;
			$scope.tmpGeoresourceReference_referenceDescription = undefined;
			// tmp array to display georesourceReferences
			$scope.georesourceReferences_adminView = [];
			// array for API request (has less information per item)
			$scope.georesourceReferences_apiRequest = [];

			$scope.numClassesArray = [3,4,5,6,7,8];
			$scope.numClasses = $scope.numClassesArray[2];
			$scope.selectedColorBrewerPaletteEntry = undefined;



		$scope.periodOfValidity = {};
		$scope.periodOfValidity.startDate = undefined;
		$scope.periodOfValidity.endDate = undefined;
		$scope.periodOfValidityInvalid = false;

		$scope.indicatorDataSourceIdProperty = undefined;
		$scope.indicatorDataSourceNameProperty = undefined;

		$scope.converter = undefined;
			$scope.datasourceType = undefined;
			$scope.indicatorDataSourceIdProperty = undefined;
			$scope.indicatorDataSourceNameProperty = undefined;

			$scope.converterDefinition = undefined;
			$scope.datasourceTypeDefinition = undefined;
			$scope.propertyMappingDefinition = undefined;
			$scope.postBody_indicators = undefined;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.loadingData = false;

		$scope.colorbrewerPalettes = [];

		$scope.instantiateColorBrewerPalettes = function(){
			for (const key in colorbrewer) {
				if (colorbrewer.hasOwnProperty(key)) {
					const colorPalettes = colorbrewer[key];
					
					var paletteEntry = {
						"paletteName": key,
						"paletteArrayObject": colorPalettes
					};

					$scope.colorbrewerPalettes.push(paletteEntry);
				}
			}

		};

		$scope.instantiateColorBrewerPalettes();

		$scope.resetIndicatorAddForm = function(){
			$scope.indicatorName = undefined;
			$scope.indicatorNameInvalid = false;

			$scope.metadata = {};
			$scope.metadata.note = undefined;
			$scope.metadata.literature = undefined;
			$scope.metadata.updateInterval = undefined;
			$scope.metadata.sridEPSG = undefined;
			$scope.metadata.datasource = undefined;
			$scope.metadata.databasis = undefined;
			$scope.metadata.contact = undefined;
			$scope.metadata.lastUpdate = undefined;
			$scope.metadata.description = undefined;

			$scope.indicatorName = undefined;
			$scope.indicatorAbbreviation = undefined;
			$scope.indicatorType = undefined;
			$scope.indicatorCharacteristicValue = undefined;
			$scope.isHeadlineIndicator = false;
			$scope.indicatorUnit = undefined;
			$scope.enableFreeTextUnit = false;
			$scope.indicatorProcessDescription = undefined;
			$scope.indicatorTagsString_withCommas = undefined;
			$scope.indicatorInterpretation = undefined;
			$scope.indicatorCreationType = undefined;
			$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = undefined;
			$scope.enableLowestSpatialUnitSelect = false;

			$scope.indicatorTopic_mainTopic = undefined;
			$scope.indicatorTopic_subTopic = undefined;
			$scope.indicatorTopic_subsubTopic = undefined;
			$scope.indicatorTopic_subsubsubTopic = undefined;

			$scope.indicatorNameFilter = undefined;
			$scope.tmpIndicatorReference_selectedIndicatorMetadata = undefined;
			$scope.tmpIndicatorReference_referenceDescription = undefined;
			// tmp array to display indicatorReferences
			$scope.indicatorReferences_adminView = [];
			// array for API request (has less information per item)
			$scope.indicatorReferences_apiRequest = [];

			$scope.georesourceNameFilter = undefined;
			$scope.tmpGeoresourceReference_selectedGeoresourceMetadata = undefined;
			$scope.tmpGeoresourceReference_referenceDescription = undefined;
			// tmp array to display georesourceReferences
			$scope.georesourceReferences_adminView = [];
			// array for API request (has less information per item)
			$scope.georesourceReferences_apiRequest = [];

			$scope.numClassesArray = [3,4,5,6,7,8];
			$scope.numClasses = $scope.numClassesArray[2];
			$scope.selectedColorBrewerPaletteEntry = undefined;


			$scope.periodOfValidity = {};
			$scope.periodOfValidity.startDate = undefined;
			$scope.periodOfValidity.endDate = undefined;
			$scope.periodOfValidityInvalid = false;
	
			$scope.converter = undefined;
			$scope.datasourceType = undefined;
			$scope.indicatorDataSourceIdProperty = undefined;
			$scope.indicatorDataSourceNameProperty = undefined;

			$scope.converterDefinition = undefined;
			$scope.datasourceTypeDefinition = undefined;
			$scope.propertyMappingDefinition = undefined;
			$scope.postBody_indicators = undefined;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;

			$scope.indicatorDataSourceIdProperty = undefined;
			$scope.indicatorDataSourceNameProperty = undefined;
		};

		$scope.onClickColorBrewerEntry = function(colorPaletteEntry){
			$scope.selectedColorBrewerPaletteEntry = colorPaletteEntry;

			setTimeout(() => {
				$scope.$apply();
			}, 250);
		};

		$scope.onAddOrUpdateIndicatorReference = function(){
			var tmpIndicatorReference_adminView = {
				"referencedIndicatorName": $scope.tmpIndicatorReference_selectedIndicatorMetadata.indicatorName,
				"referencedIndicatorId": $scope.tmpIndicatorReference_selectedIndicatorMetadata.indicatorId,
				"referencedIndicatorAbbreviation": $scope.tmpIndicatorReference_selectedIndicatorMetadata.abbreviation,
				"referencedIndicatorDescription": $scope.tmpIndicatorReference_referenceDescription
			};

			var processed = false;

			for (let index = 0; index < $scope.indicatorReferences_adminView.length; index++) {
				var indicatorReference_adminView = $scope.indicatorReferences_adminView[index];
				
				if (indicatorReference_adminView.referencedIndicatorId === tmpIndicatorReference_adminView.referencedIndicatorId){
					// replace object
					$scope.indicatorReferences_adminView[index] = tmpIndicatorReference_adminView;
					processed = true;
					break;
				}
			}			

			if(! processed){
				// new entry
				$scope.indicatorReferences_adminView.push(tmpIndicatorReference_adminView);
			}

			setTimeout(() => {
				$scope.$apply();
			}, 250);
		};

		$scope.onClickEditIndicatorReference = function(indicatorReference_adminView){

			$scope.tmpIndicatorReference_selectedIndicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorReference_adminView.referencedIndicatorId);
			$scope.tmpIndicatorReference_referenceDescription = indicatorReference_adminView.referencedIndicatorDescription;

			setTimeout(() => {
				$scope.$apply();
			}, 250);
		};

		$scope.onClickDeleteIndicatorReference = function(indicatorReference_adminView){

			for (let index = 0; index < $scope.indicatorReferences_adminView.length; index++) {
				
				if ($scope.indicatorReferences_adminView[index].referencedIndicatorId === indicatorReference_adminView.referencedIndicatorId){
					// remove object
					$scope.indicatorReferences_adminView.splice(index, 1);
					break;
				}
			}				

			setTimeout(() => {
				$scope.$apply();
			}, 250);
		};

		$scope.onAddOrUpdateGeoresourceReference = function(){
			var tmpGeoresourceReference_adminView = {
				"referencedGeoresourceName": $scope.tmpGeoresourceReference_selectedGeoresourceMetadata.datasetName,
				"referencedGeoresourceId": $scope.tmpGeoresourceReference_selectedGeoresourceMetadata.georesourceId,
				"referencedGeoresourceDescription": $scope.tmpGeoresourceReference_referenceDescription
			};

			var processed = false;

			for (let index = 0; index < $scope.georesourceReferences_adminView.length; index++) {
				var georesourceReference_adminView = $scope.georesourceReferences_adminView[index];
				
				if (georesourceReference_adminView.referencedGeoresourceId === tmpGeoresourceReference_adminView.referencedGeoresourceId){
					// replace object
					$scope.georesourceReferences_adminView[index] = tmpGeoresourceReference_adminView;
					processed = true;
					break;
				}
			}			

			if(! processed){
				// new entry
				$scope.georesourceReferences_adminView.push(tmpGeoresourceReference_adminView);
			}

			setTimeout(() => {
				$scope.$apply();
			}, 250);
		};

		$scope.onClickEditGeoresourceReference = function(georesourceReference_adminView){

			$scope.tmpGeoresourceReference_selectedGeoresourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceReference_adminView.referencedGeoresourceId);
			$scope.tmpGeoresourceReference_referenceDescription = georesourceReference_adminView.referencedGeoresourceDescription;

			setTimeout(() => {
				$scope.$apply();
			}, 250);
		};

		$scope.onClickDeleteGeoresourceReference = function(georesourceReference_adminView){

			for (let index = 0; index < $scope.georesourceReferences_adminView.length; index++) {
				
				if ($scope.georesourceReferences_adminView[index].referencedGeoresourceId === georesourceReference_adminView.referencedGeoresourceId){
					// remove object
					$scope.georesourceReferences_adminView.splice(index, 1);
					break;
				}
			}				

			setTimeout(() => {
				$scope.$apply();
			}, 250);
		};


		$scope.filterIndicators = function() {

			return kommonitorDataExchangeService.filterIndicators();
		};

		$scope.onChangeCreationType = function(){
			if($scope.indicatorCreationType.apiName === "COMPUTATION"){
				$scope.enableLowestSpatialUnitSelect = true;
			}
			else{
				$scope.enableLowestSpatialUnitSelect = false;
			}

		};

		$scope.onChangeIndicatorUnit = function(){
			if ($scope.indicatorUnit.includes("Freitext")){
				$scope.enableFreeTextUnit = true;
			}
			else{
				$scope.enableFreeTextUnit = false;
			}
		};

		$scope.checkDatasetName = function(){
			$scope.indicatorNameInvalid = false;
			kommonitorDataExchangeService.availableIndicators.forEach(function(indicator){
				if (indicator.indicatorName === $scope.indicatorName){
					$scope.indicatorNameInvalid = true;
					return;
				}
			});
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

		$scope.buildImporterObjects = async function(){
			$scope.converterDefinition = $scope.buildConverterDefinition();
			$scope.datasourceTypeDefinition = await $scope.buildDatasourceTypeDefinition();
			$scope.propertyMappingDefinition = $scope.buildPropertyMappingDefinition();
			$scope.postBody_indicators = $scope.buildPostBody_indicators();

			if(!$scope.converterDefinition || !$scope.datasourceTypeDefinition || !$scope.propertyMappingDefinition || !$scope.postBody_indicators){
				return false;
			}

			return true;
		};

		$scope.buildConverterDefinition = function(){

			return kommonitorImporterHelperService.buildConverterDefinition($scope.converter, "converterParameter_indicatorAdd_", $scope.schema);			
		};

		$scope.buildDatasourceTypeDefinition = async function(){
			try {
				return await kommonitorImporterHelperService.buildDatasourceTypeDefinition($scope.datasourceType, 'datasourceTypeParameter_indicatorAdd_', 'indicatorDataSourceInput_add');			
			} catch (error) {
				$scope.errorMessagePart = error;

				$("#indicatorAddErrorAlert").show();
				$scope.loadingData = false;
				return null;
			}			
		};

		$scope.buildPropertyMappingDefinition = function(){
			// arsion from is undefined currently
			return kommonitorImporterHelperService.buildPropertyMapping_spatialResource($scope.indicatorDataSourceNameProperty, $scope.indicatorDataSourceIdProperty, $scope.validityStartDate_perFeature, $scope.validityEndDate_perFeature, undefined);
		};

		$scope.buildPostBody_indicators = function(){
			var postBody =
			{
				"geoJsonString": $scope.geoJsonString,
				"metadata": {
					"note": $scope.metadata.note,
					"literature": $scope.metadata.literature,
					"updateInterval": $scope.metadata.updateInterval.apiName,
					"sridEPSG": $scope.metadata.sridEPSG || 4326,
					"datasource": $scope.metadata.datasource,
					"contact": $scope.metadata.contact,
					"lastUpdate": $scope.metadata.lastUpdate,
					"description": $scope.metadata.description,
					"databasis": $scope.metadata.databasis
				},
				"jsonSchema": null,
				"indicatorName": $scope.indicatorName,
				"periodOfValidity": {
					"endDate": $scope.periodOfValidity.endDate,
					"startDate": $scope.periodOfValidity.startDate
				},
			  "isAOI": $scope.isAOI,
				"isLOI": $scope.isLOI,
				"isPOI": $scope.isPOI,
			  "topicReference": null
			};

			

			return postBody;
		};

		$scope.addIndicator = async function(){

			/*
					now collect data and build request for importer
				*/

				/*
					if any required importer data is missing --> cancel request and highlight required errors 
				*/
				var allDataSpecified = await $scope.buildImporterObjects();

				if (!allDataSpecified) {

					$("#indicatorAddForm").validator("update");
					$("#indicatorAddForm").validator("validate");
					return;
				}
				else {


					// TODO verify input

					// TODO Create and perform POST Request with loading screen

					$scope.loadingData = true;

					try {
						var newIndicatorResponse = await kommonitorImporterHelperService.registerNewIndicator($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.postBody_indicators);

						$rootScope.$broadcast("refreshIndicatorOverviewTable");

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

					$scope.successMessagePart = $scope.indicatorName;

					$("#indicatorAddSuccessAlert").show();

					$scope.loadingData = false;
					} catch (error) {
						$scope.errorMessagePart = error;

						$("#indicatorAddErrorAlert").show();
						$scope.loadingData = false;

						setTimeout(() => {
							$scope.$apply();
						}, 250);
					}
				}

		};

		$scope.onImportIndicatorAddMetadata = function(){

			$scope.indicatorMetadataImportError = "";

			$("#indicatorMetadataImportFile").files = [];

			// trigger file chooser
			$("#indicatorMetadataImportFile").click();

		};

		$(document).on("change", "#indicatorMetadataImportFile" ,function(){

			console.log("Importing Indicator metadata for Add Indicator Form");

			// get the file
			var file = document.getElementById('indicatorMetadataImportFile').files[0];
			$scope.parseMetadataFromFile(file);
		});

		$scope.parseMetadataFromFile = function(file){
			var fileReader = new FileReader();

			fileReader.onload = function(event) {

				try{
					$scope.parseFromMetadataFile(event);
				}
				catch(error){
					console.error("Uploaded Metadata File cannot be parsed.");
					$scope.indicatorMetadataImportError = "Uploaded Metadata File cannot be parsed correctly";
					document.getElementById("indicatorsAddMetadataPre").innerHTML = $scope.indicatorMetadataStructure_pretty;
					$("#indicatorMetadataImportErrorAlert").show();
				}

			};

			// Read in the image file as a data URL.
			fileReader.readAsText(file);
		};

		$scope.parseFromMetadataFile = function(event){
			// $scope.geoJsonString = event.target.result;
			$scope.metadataImportSettings = JSON.parse(event.target.result);

			if(! $scope.metadataImportSettings.metadata){
				console.error("uploaded Metadata File cannot be parsed - wrong structure.");
				$scope.indicatorMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster &uuml;berein.";
				document.getElementById("indicatorsAddMetadataPre").innerHTML = $scope.indicatorMetadataStructure_pretty;
				$("#indicatorMetadataImportErrorAlert").show();
			}

				$scope.metadata = {};
				$scope.metadata.note = $scope.metadataImportSettings.metadata.note;
				$scope.metadata.literature = $scope.metadataImportSettings.metadata.literature;
				kommonitorDataExchangeService.updateIntervalOptions.forEach(function(option){
					if(option.apiName === $scope.metadataImportSettings.metadata.updateInterval){
						$scope.metadata.updateInterval = option;
					}
				});
				$scope.metadata.sridEPSG = $scope.metadataImportSettings.metadata.sridEPSG;
				$scope.metadata.datasource = $scope.metadataImportSettings.metadata.datasource;
				$scope.metadata.contact = $scope.metadataImportSettings.metadata.contact;
				$scope.metadata.lastUpdate = $scope.metadataImportSettings.metadata.lastUpdate;
				// initialize date
				$('#indicatorAddLastUpdateDatepicker').datepicker('setDate', $scope.metadata.lastUpdate);

				$scope.metadata.description = $scope.metadataImportSettings.metadata.description;
				$scope.metadata.databasis = $scope.metadataImportSettings.metadata.databasis;

				$scope.indicatorName = $scope.metadataImportSettings.indicatorName;

				// indicator specific properties

				$scope.isPOI = $scope.metadataImportSettings.isPOI;
				$scope.isLOI = $scope.metadataImportSettings.isLOI;
				$scope.isAOI = $scope.metadataImportSettings.isAOI;
				if($scope.metadataImportSettings.isPOI){
						$scope.indicatorType = "poi";
				}
				else if($scope.metadataImportSettings.isLOI){
						$scope.indicatorType = "loi";
				}
				else{
						$scope.indicatorType = "aoi";
				}
				kommonitorDataExchangeService.availablePoiMarkerColors.forEach(function(option){
					if(option.colorName === $scope.metadataImportSettings.poiMarkerColor){
						$scope.selectedPoiMarkerColor = option;
					}
					if(option.colorName === $scope.metadataImportSettings.poiSymbolColor){
						$scope.selectedPoiSymbolColor = option;
					}
				});
				kommonitorDataExchangeService.availableLoiDashArrayObjects.forEach(function(option){
					if(option.dashArrayValue === $scope.metadataImportSettings.loiDashArrayString){
						$scope.selectedLoiDashArrayObject = option;
					}
				});
				$scope.loiColor = $scope.metadataImportSettings.loiColor;
				$scope.aoiColor = $scope.metadataImportSettings.aoiColor;
				$scope.selectedPoiIconName = $scope.metadataImportSettings.poiSymbolBootstrap3Name;

				setTimeout(function(){
					$("#poiSymbolPicker").val("").iconpicker('setIcon', 'glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
					// $("#poiSymbolPicker i").css('glyphicon glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
					// $("#poiSymbolPicker input").css('glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
				}, 200);

				$scope.$apply();
		}

		$scope.onExportIndicatorAddMetadata = function(){
			var metadataExport = $scope.indicatorMetadataStructure;

			metadataExport.metadata.note = $scope.metadata.note || "";
			metadataExport.metadata.literature = $scope.metadata.literature  || "";
			metadataExport.metadata.sridEPSG = $scope.metadata.sridEPSG || "";
			metadataExport.metadata.datasource = $scope.metadata.datasource || "";
			metadataExport.metadata.contact = $scope.metadata.contact || "";
			metadataExport.metadata.lastUpdate = $scope.metadata.lastUpdate || "";
			metadataExport.metadata.description = $scope.metadata.description || "";
			metadataExport.metadata.databasis = $scope.metadata.databasis || "";
			metadataExport.indicatorName = $scope.indicatorName || "";

			if($scope.metadata.updateInterval){
					metadataExport.metadata.updateInterval = $scope.metadata.updateInterval.apiName;
			}

			var name = $scope.indicatorName;

			// indicator specific properties
			metadataExport.isPOI = $scope.isPOI;
			metadataExport.isLOI = $scope.isLOI;
			metadataExport.isAOI = $scope.isAOI;

			if($scope.isPOI){
				metadataExport["poiSymbolBootstrap3Name"] = $scope.selectedPoiIconName;
				metadataExport["poiSymbolColor"] = $scope.selectedPoiSymbolColor.colorName;
				metadataExport["poiMarkerColor"] = $scope.selectedPoiMarkerColor.colorName;

				metadataExport["loiDashArrayString"] = "";
				metadataExport["loiColor"] = "";

				metadataExport["aoiColor"] = "";
			}
			else if($scope.isLOI){
				metadataExport["poiSymbolBootstrap3Name"] = "";
				metadataExport["poiSymbolColor"] = "";
				metadataExport["poiMarkerColor"] = "";

				metadataExport["loiDashArrayString"] = $scope.selectedLoiDashArrayObject.dashArrayValue;
				metadataExport["loiColor"] = $scope.loiColor;

				metadataExport["aoiColor"] = "";
			}
			else if($scope.isAOI){
				metadataExport["poiSymbolBootstrap3Name"] = "";
				metadataExport["poiSymbolColor"] = "";
				metadataExport["poiMarkerColor"] = "";

				metadataExport["loiDashArrayString"] = "";
				metadataExport["loiColor"] = "";

				metadataExport["aoiColor"] = $scope.aoiColor;
			}


			var metadataJSON = JSON.stringify(metadataExport);

			var fileName = "Georessource_Metadaten_Export";

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
				$("#indicatorAddSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#indicatorAddErrorAlert").hide();
			};

			$scope.hideMetadataErrorAlert = function(){
				$("#indicatorMetadataImportErrorAlert").hide();
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

			$(".next_addIndicator").click(function(){
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
						left = (now * 50)+"%";
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

			$(".previous_addIndicator").click(function(){
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
						left = ((1-now) * 50)+"%";
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
