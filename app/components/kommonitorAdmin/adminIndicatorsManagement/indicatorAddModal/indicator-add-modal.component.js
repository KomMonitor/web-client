angular.module('indicatorAddModal').component('indicatorAddModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorAddModal/indicator-add-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env',
		function IndicatorAddModalAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

		/*	POST BODY
			{
						"refrencesToOtherIndicators": [
							{
							"referenceDescription": "referenceDescription",
							"indicatorId": "indicatorId"
							},
							{
							"referenceDescription": "referenceDescription",
							"indicatorId": "indicatorId"
							}
						],
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
						"datasetName": "datasetName",
						"abbreviation": "abbreviation",
						"characteristicValue": "characteristicValue",
						"tags": [
							"tags",
							"tags"
						],
						"creationType": "INSERTION",
						"unit": "unit",
						"topicReference": "topicReference",
						"refrencesToGeoresources": [
							{
							"referenceDescription": "referenceDescription",
							"georesourceId": "georesourceId"
							},
							{
							"referenceDescription": "referenceDescription",
							"georesourceId": "georesourceId"
							}
						],
						"indicatorType": "STATUS_ABSOLUTE",
						"interpretation": "interpretation",
						"isHeadlineIndicator": false,
						"processDescription": "processDescription",
						"lowestSpatialUnitForComputation": "lowestSpatialUnitForComputation",
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

		//Date picker
    	$('#indicatorAddLastUpdateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$('#indicatorAddDirectTimestampDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

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
			"refrencesToOtherIndicators": [
				{
				  "referenceDescription": "description about the reference",
				  "indicatorId": "ID of referenced indicator dataset"
				}
			  ],
			  "refrencesToGeoresources": [
				{
				  "referenceDescription": "description about the reference",
				  "georesourceId": "ID of referenced georesource dataset"
				}
			  ],
			"datasetName": "Name of indicator dataset",
			"abbreviation": "optional abbreviation of the indicator dataset",
			"characteristicValue": "if the same datasetName is used for different indicators, the optional characteristicValue parameter may serve to distinguish between them (i.e. Habitants - male, Habitants - female, Habitants - diverse)",
			"tags": [
				"optinal list of tags; each tag is a free text tag"
			],
			"creationType": "INSERTION|COMPUTATION  <-- enum parameter controls whether each timestamp must be updated manually (INSERTION) or if KomMonitor shall compute the indicator values for respective timestamps based on script file (COMPUTATION)",
			"unit": "unit of the indicator",
			"topicReference": "ID of the respective main/sub topic instance",
			"indicatorType": "STATUS_ABSOLUTE|STATUS_RELATIVE|DYNAMIC_ABSOLUTE|DYNAMIC_RELATIVE|STATUS_STANDARDIZED|DYNAMIC_STANDARDIZED",
			"interpretation": "interpretation hints for the user to better understand the indicator values",
			"isHeadlineIndicator": "boolean parameter to indicate if indicator is a headline indicator",
			"processDescription": "detailed description about the computation/creation of the indicator",
			"lowestSpatialUnitForComputation": "the name of the lowest possible spatial unit for which an indicator of creationType=COMPUTATION may be computed. All other superior spatial units will be aggregated automatically",
			"defaultClassificationMapping": {
				"colorBrewerSchemeName": "schema name of colorBrewer colorPalette to use for classification",
				"items": [
					{
						"defaultCustomRating": "a string to rate indicator values of this class",
						"defaultColorAsHex": "color as hexadecimal value"
					}
				]
			}
		};

		$scope.indicatorMetadataStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON($scope.indicatorMetadataStructure);
		$scope.indicatorMappingConfigStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON(kommonitorImporterHelperService.mappingConfigStructure_indicator);


		$scope.metadataImportSettings;
		$scope.indicatorMetadataImportError;
		$scope.indicatorAddMetadataImportErrorAlert;

		$scope.datasetName = undefined;
		$scope.datasetNameInvalid = false;

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

		$scope.datasetName = undefined;
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
			$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = kommonitorDataExchangeService.availableSpatialUnits[0];
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

			$scope.postBody_indicators = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.loadingData = false;

		$scope.colorbrewerSchemes = colorbrewer;
		$scope.colorbreweSchemeName_dynamicIncrease = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
		$scope.colorbreweSchemeName_dynamicDecrease = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
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

			// instantiate with palette 'Blues'
			$scope.selectedColorBrewerPaletteEntry = $scope.colorbrewerPalettes[13];

		};

		$scope.instantiateColorBrewerPalettes();

		$scope.resetIndicatorAddForm = function(){

				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;

			$scope.datasetName = undefined;
			$scope.datasetNameInvalid = false;

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

			$scope.datasetName = undefined;
			$scope.indicatorAbbreviation = undefined;
			$scope.indicatorType = kommonitorDataExchangeService.indicatorTypeOptions[0];
			$scope.indicatorCharacteristicValue = undefined;
			$scope.isHeadlineIndicator = false;
			$scope.indicatorUnit = undefined;
			$scope.enableFreeTextUnit = false;
			$scope.indicatorProcessDescription = undefined;
			$scope.indicatorTagsString_withCommas = undefined;
			$scope.indicatorInterpretation = undefined;
			$scope.indicatorCreationType = kommonitorDataExchangeService.indicatorCreationTypeOptions[0];
			$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = kommonitorDataExchangeService.availableSpatialUnits[0];
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
			$scope.selectedColorBrewerPaletteEntry = $scope.colorbrewerPalettes[13];

			$scope.postBody_indicators = undefined;

			setTimeout(() => {
				$scope.$apply();	
			}, 250);
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

			$scope.tmpIndicatorReference_selectedIndicatorMetadata = undefined;
			$scope.tmpIndicatorReference_referenceDescription = undefined;

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

			$scope.tmpGeoresourceReference_selectedGeoresourceMetadata = undefined;
			$scope.tmpGeoresourceReference_referenceDescription = undefined;

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
			$scope.datasetNameInvalid = false;
			kommonitorDataExchangeService.availableIndicators.forEach(function(indicator){
				if (indicator.indicatorName === $scope.datasetName){
					$scope.datasetNameInvalid = true;
					return;
				}
			});
		};

		$scope.buildPostBody_indicators = function(){
			var postBody =
			{
				"metadata": {
					"note": $scope.metadata.note || null,
					"literature": $scope.metadata.literature || null,
					"updateInterval": $scope.metadata.updateInterval.apiName,
					"sridEPSG": $scope.metadata.sridEPSG || 4326,
					"datasource": $scope.metadata.datasource,
					"contact": $scope.metadata.contact,
					"lastUpdate": $scope.metadata.lastUpdate,
					"description": $scope.metadata.description || null,
					"databasis": $scope.metadata.databasis || null
				},
				"refrencesToOtherIndicators": [], // filled directly after
				  "allowedRoles": [],
				  "datasetName": $scope.datasetName,
				  "abbreviation": $scope.indicatorAbbreviation || null,
				  "characteristicValue": $scope.indicatorCharacteristicValue || null,
				  "tags": [], // filled directly after
				  "creationType": $scope.indicatorCreationType.apiName,
				  "unit": $scope.indicatorUnit,
				  "topicReference": "", // filled directly after
				  "refrencesToGeoresources": [], // filled directly after
				  "indicatorType": $scope.indicatorType.apiName,
				  "interpretation": $scope.indicatorInterpretation || "",
				  "isHeadlineIndicator": $scope.isHeadlineIndicator || false,
				  "processDescription": $scope.indicatorProcessDescription || "",
				  "lowestSpatialUnitForComputation": $scope.indicatorLowestSpatialUnitMetadataObjectForComputation? $scope.indicatorLowestSpatialUnitMetadataObjectForComputation.spatialUnitLevel : null,
				  "defaultClassificationMapping": {
					"colorBrewerSchemeName": $scope.selectedColorBrewerPaletteEntry.paletteName,
					"items": [
						{
						  "defaultColorAsHex": "#edf8e9",
						  "defaultCustomRating": "sehr niedrig"
						},
						{
						  "defaultColorAsHex": "#bae4b3",
						  "defaultCustomRating": "niedrig"
						},
						{
						  "defaultColorAsHex": "#74c476",
						  "defaultCustomRating": "mittel"
						},
						{
						  "defaultColorAsHex": "#31a354",
						  "defaultCustomRating": "hoch"
						},
						{
						  "defaultColorAsHex": "#006d2c",
						  "defaultCustomRating": "sehr hoch"
						}
					  ]
				  }
			};

			// TAGS
			if($scope.indicatorTagsString_withCommas){
				var tags_splitted = $scope.indicatorTagsString_withCommas.split(",");
				for (const tagString of tags_splitted) {
					postBody.tags.push(tagString.trim());
				}
			}

			// TOPIC REFERENCE
			if($scope.indicatorTopic_subsubsubTopic){
				postBody.topicReference = $scope.indicatorTopic_subsubsubTopic.topicId;
			}
			else if($scope.indicatorTopic_subsubTopic){
				postBody.topicReference = $scope.indicatorTopic_subsubTopic.topicId;
			}
			else if($scope.indicatorTopic_subTopic){
				postBody.topicReference = $scope.indicatorTopic_subTopic.topicId;
			}
			else if($scope.indicatorTopic_mainTopic){
				postBody.topicReference = $scope.indicatorTopic_mainTopic.topicId;
			}
			else {
				postBody.topicReference = "";
			}


			// REFERENCES
			if($scope.indicatorReferences_adminView && $scope.indicatorReferences_adminView.length > 0){
				postBody.refrencesToOtherIndicators = [];

				for (const indicRef of $scope.indicatorReferences_adminView) {
					postBody.refrencesToOtherIndicators.push({
						"indicatorId": indicRef.referencedIndicatorId,
						"referenceDescription": indicRef.referencedIndicatorDescription
					});
				}
			}

			if($scope.georesourceReferences_adminView && $scope.georesourceReferences_adminView.length > 0){
				postBody.refrencesToGeoresources = [];

				for (const geoRef of $scope.georesourceReferences_adminView) {
					postBody.refrencesToGeoresources.push({
						"georesourceId": geoRef.referencedGeoresourceId,
						"referenceDescription": geoRef.referencedGeoresourceDescription
					});
				}
			}	
			

			return postBody;
		};

		$scope.addIndicator = async function(){

			$scope.loadingData = true;

			var postBody = $scope.buildPostBody_indicators();

			return await $http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators",
				method: "POST",
				data: postBody,
				headers: {
				  'Content-Type': "application/json"
				}
			  }).then(function successCallback(response) {
				  // this callback will be called asynchronously
				  // when the response is available
						  				  
				  var response = response.data;

				  $rootScope.$broadcast("refreshIndicatorOverviewTable");

						// refresh all admin dashboard diagrams due to modified metadata
						$rootScope.$broadcast("refreshAdminDashboardDiagrams");

						$scope.successMessagePart = $scope.datasetName;
						$scope.importedFeatures = [];

						$("#indicatorAddSuccessAlert").show();

						$scope.loadingData = false;
		
				}, function errorCallback(error) {
				  console.error("Error while adding computable indicatorMetadata service.");
				  if(error.data){							
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

						$("#indicatorAddErrorAlert").show();
						$scope.loadingData = false;

						setTimeout(() => {
							$scope.$apply();
						}, 250);
			  });

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
					console.error(error);
					console.error("Uploaded Metadata File cannot be parsed.");
					$scope.indicatorMetadataImportError = "Uploaded Metadata File cannot be parsed correctly";
					document.getElementById("indicatorsAddMetadataPre").innerHTML = $scope.indicatorMetadataStructure_pretty;
					$("#indicatorAddMetadataImportErrorAlert").show();

					$scope.$apply();
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
				$("#indicatorAddMetadataImportErrorAlert").show();

				$scope.$apply();
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

				$scope.datasetName = $scope.metadataImportSettings.datasetName;

				// indicator specific properties

				
				$scope.indicatorAbbreviation = $scope.metadataImportSettings.abbreviation;

				for (const indicatorTypeOption of kommonitorDataExchangeService.indicatorTypeOptions) {
					if(indicatorTypeOption.apiName === $scope.metadataImportSettings.indicatorType){
						$scope.indicatorType = indicatorTypeOption;
						break;
					}
				}

				for (const indicatorCreationTypeOption of kommonitorDataExchangeService.indicatorCreationTypeOptions) {
					if(indicatorCreationTypeOption.apiName === $scope.metadataImportSettings.creationType){
						$scope.indicatorCreationType = indicatorCreationTypeOption;

						if(indicatorCreationTypeOption.apiName === "COMPUTATION"){
							$scope.enableLowestSpatialUnitSelect = true;
						}
						else{
							$scope.enableLowestSpatialUnitSelect = false;
						}
						break;
					}
				}

				$scope.indicatorCharacteristicValue = $scope.metadataImportSettings.characteristicValue;
				$scope.isHeadlineIndicator = $scope.metadataImportSettings.isHeadlineIndicator;
				$scope.indicatorUnit = $scope.metadataImportSettings.unit;
				if(kommonitorDataExchangeService.indicatorUnitOptions.includes($scope.metadataImportSettings.unit)){
					$scope.enableFreeTextUnit = false;
				}
				else{
					$scope.enableFreeTextUnit = true;
				}
				
				$scope.indicatorProcessDescription = $scope.metadataImportSettings.processDescription;
				
				$scope.indicatorTagsString_withCommas = undefined;
				if($scope.metadataImportSettings.tags && $scope.metadataImportSettings.tags.length > 0){
					$scope.indicatorTagsString_withCommas = "";
					for (let index = 0; index < $scope.metadataImportSettings.tags.length; index++) {
						$scope.indicatorTagsString_withCommas += $scope.metadataImportSettings.tags[index];
						
						if(index < $scope.metadataImportSettings.tags.length - 1){
							$scope.indicatorTagsString_withCommas += ",";
						}
					}
				}

				$scope.indicatorInterpretation = $scope.metadataImportSettings.interpretation;
				$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = kommonitorDataExchangeService.availableSpatialUnits[0];

				for (let i = 0; i < kommonitorDataExchangeService.availableSpatialUnits.length; i++) {
					const spatialUnitMetadata = kommonitorDataExchangeService.availableSpatialUnits[i];
	
					if(spatialUnitMetadata.spatialUnitLevel === $scope.metadataImportSettings.lowestSpatialUnitForComputation){
						$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = spatialUnitMetadata;
						break;
					}				
				}
				
				var topicHierarchy = kommonitorDataExchangeService.getTopicHierarchyForTopicId($scope.metadataImportSettings.topicReference);

				if(topicHierarchy && topicHierarchy[0]){
					$scope.indicatorTopic_mainTopic = topicHierarchy[0];
				}
				if(topicHierarchy && topicHierarchy[1]){
					$scope.indicatorTopic_subTopic = topicHierarchy[1];
				}
				if(topicHierarchy && topicHierarchy[2]){
					$scope.indicatorTopic_subsubTopic = topicHierarchy[2];
				}
				if(topicHierarchy && topicHierarchy[3]){
					$scope.indicatorTopic_subsubsubTopic = topicHierarchy[3];
				}

				$scope.indicatorNameFilter = undefined;
				$scope.tmpIndicatorReference_selectedIndicatorMetadata = undefined;
				$scope.tmpIndicatorReference_referenceDescription = undefined;

				// tmp array to display indicatorReferences
				$scope.indicatorReferences_adminView = [];
				// array for API request (has less information per item)
				$scope.indicatorReferences_apiRequest = [];
				if($scope.metadataImportSettings.refrencesToOtherIndicators && $scope.metadataImportSettings.refrencesToOtherIndicators.length > 0){
					for (const indicatorReference of $scope.metadataImportSettings.refrencesToOtherIndicators) {
						var indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorReference.indicatorId);
						var referenceEntry = {
							"referencedIndicatorName": indicatorMetadata.indicatorName,
							"referencedIndicatorId": indicatorMetadata.indicatorId,
							"referencedIndicatorAbbreviation": indicatorMetadata.abbreviation,
							"referencedIndicatorDescription": indicatorReference.referenceDescription
						};
						$scope.indicatorReferences_adminView.push(referenceEntry);	
					}
					
				}

				$scope.georesourceNameFilter = undefined;
				$scope.tmpGeoresourceReference_selectedGeoresourceMetadata = undefined;
				$scope.tmpGeoresourceReference_referenceDescription = undefined;
				// tmp array to display georesourceReferences
				$scope.georesourceReferences_adminView = [];
				// array for API request (has less information per item)
				$scope.georesourceReferences_apiRequest = [];

				if($scope.metadataImportSettings.refrencesToGeoresources && $scope.metadataImportSettings.refrencesToGeoresources.length > 0){
					for (const georesourceReference of $scope.metadataImportSettings.refrencesToGeoresources) {
						var georesourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceReference.georesourceId);
						var geo_referenceEntry = {
							"referencedGeoresourceName": georesourceMetadata.datasetName,
							"referencedGeoresourceId": georesourceMetadata.georesourceId,
							"referencedGeoresourceDescription": georesourceReference.referenceDescription
						};
						$scope.georesourceReferences_adminView.push(geo_referenceEntry);	
					}
					
				}			

				$scope.numClassesArray = [3,4,5,6,7,8];
				$scope.numClasses = $scope.numClassesArray[2];
				// instantiate with palette 'Blues'
				$scope.selectedColorBrewerPaletteEntry = $scope.colorbrewerPalettes[13];

				for (const colorbrewerPalette of $scope.colorbrewerPalettes) {
					if (colorbrewerPalette.paletteName === $scope.metadataImportSettings.defaultClassificationMapping.colorBrewerSchemeName){
						$scope.selectedColorBrewerPaletteEntry = colorbrewerPalette;
						break;
					}
				}

				$scope.$apply();
		};

		$scope.onExportIndicatorAddMetadataTemplate = function(){

			var metadataJSON = JSON.stringify($scope.indicatorMetadataStructure);

			var fileName = "Indikator_Metadaten_Vorlage_Export.json";

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
			metadataExport.datasetName = $scope.datasetName || "";

			if($scope.metadata.updateInterval){
					metadataExport.metadata.updateInterval = $scope.metadata.updateInterval.apiName;
			}

			var name = $scope.datasetName;

			// indicator specific properties

			metadataExport.abbreviation = $scope.indicatorAbbreviation || "";
			metadataExport.indicatorType = $scope.indicatorType ? $scope.indicatorType.apiName : "";
			metadataExport.creationType = $scope.indicatorCreationType ? $scope.indicatorCreationType.apiName : "";

			metadataExport.characteristicValue = $scope.indicatorCharacteristicValue || "";
			metadataExport.isHeadlineIndicator = $scope.isHeadlineIndicator || false;
			metadataExport.unit = $scope.indicatorUnit || "";
			metadataExport.processDescription = $scope.indicatorProcessDescription || "";
			metadataExport.tags = [];

			if($scope.indicatorTagsString_withCommas){
				var tags_splitted = $scope.indicatorTagsString_withCommas.split(",");
				for (const tagString of tags_splitted) {
					metadataExport.tags.push(tagString.trim());
				}
			}
				
			metadataExport.interpretation = $scope.indicatorInterpretation || "";
			metadataExport.lowestSpatialUnitForComputation = $scope.indicatorLowestSpatialUnitMetadataObjectForComputation? $scope.indicatorLowestSpatialUnitMetadataObjectForComputation.spatialUnitLevel : "";

			if($scope.indicatorTopic_subsubsubTopic){
				metadataExport.topicReference = $scope.indicatorTopic_subsubsubTopic.topicId;
			}
			else if($scope.indicatorTopic_subsubTopic){
				metadataExport.topicReference = $scope.indicatorTopic_subsubTopic.topicId;
			}
			else if($scope.indicatorTopic_subTopic){
				metadataExport.topicReference = $scope.indicatorTopic_subTopic.topicId;
			}
			else if($scope.indicatorTopic_mainTopic){
				metadataExport.topicReference = $scope.indicatorTopic_mainTopic.topicId;
			}
			else {
				metadataExport.topicReference = "";
			}

			metadataExport.refrencesToOtherIndicators = [];

			if($scope.indicatorReferences_adminView && $scope.indicatorReferences_adminView.length > 0){
				metadataExport.refrencesToOtherIndicators = [];

				for (const indicRef of $scope.indicatorReferences_adminView) {
					metadataExport.refrencesToOtherIndicators.push({
						"indicatorId": indicRef.referencedIndicatorId,
						"referenceDescription": indicRef.referencedIndicatorDescription
					});
				}
			}

			metadataExport.refrencesToGeoresources = [];

			if($scope.georesourceReferences_adminView && $scope.georesourceReferences_adminView.length > 0){
				metadataExport.refrencesToGeoresources = [];

				for (const geoRef of $scope.georesourceReferences_adminView) {
					metadataExport.refrencesToGeoresources.push({
						"georesourceId": geoRef.referencedGeoresourceId,
						"referenceDescription": geoRef.referencedGeoresourceDescription
					});
				}
			}		

				var defaultClassificationMapping = {
					"colorBrewerSchemeName" : $scope.selectedColorBrewerPaletteEntry ? $scope.selectedColorBrewerPaletteEntry.paletteName : "Blues",
					"items": [
						{
						  "defaultColorAsHex": "#edf8e9",
						  "defaultCustomRating": "sehr niedrig"
						},
						{
						  "defaultColorAsHex": "#bae4b3",
						  "defaultCustomRating": "niedrig"
						},
						{
						  "defaultColorAsHex": "#74c476",
						  "defaultCustomRating": "mittel"
						},
						{
						  "defaultColorAsHex": "#31a354",
						  "defaultCustomRating": "hoch"
						},
						{
						  "defaultColorAsHex": "#006d2c",
						  "defaultCustomRating": "sehr hoch"
						}
					  ]
				};

				metadataExport.defaultClassificationMapping = defaultClassificationMapping;
			

			var metadataJSON = JSON.stringify(metadataExport);

			var fileName = "Indikatoren_Metadaten_Export";

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
				$("#indicatorAddMetadataImportErrorAlert").hide();
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
