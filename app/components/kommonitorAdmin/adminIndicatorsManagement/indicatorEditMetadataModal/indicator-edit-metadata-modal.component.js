angular.module('indicatorEditMetadataModal').component('indicatorEditMetadataModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditMetadataModal/indicator-edit-metadata-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorMultiStepFormHelperService',
		'kommonitorDataGridHelperService', 'kommonitorFileHelperService', 'kommonitorToastHelperService',
		function IndicatorEditMetadataModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $timeout, 
			kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService, kommonitorFileHelperService, kommonitorToastHelperService) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentIndicatorDataset;

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
						"applicableSpatialUnit": "applicableSpatialUnit",
						"abbreviation": "abbreviation",
						"characteristicValue": "characteristicValue",
						"tags": [
							"tags",
							"tags"
						],
						"creationType": "INSERTION",
						"unit": "unit",
						"topicReference": "topicReference",
						"referenceDateNote": "optional note for indicator reference date",
						"displayOrder": 0,
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
							"colorBrewerSchemeName": "schema name of colorBrewer colorPalette to use for classification",
							"numClasses": "number of Classes",
							"classificationMethod": "Classification Method ID",
							"items": [
								{
									"spatialUnit": "spatial unit id for manual classification",
									"breaks": ['break']
								}
							]
						},
						"regionalReferenceValues": [
							{
							"referenceDate": "2024-04-23",
							"regionalSum": 0,
							"regionalAverage": 0,
							"spatiallyUnassignable": 0
							}
						],
						}
		*/

		//Date picker
		$('#indicatorEditLastUpdateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

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
      "precision": "Custom decimal place",
			"allowedRoles": ['roleId'],
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
			"referenceDateNote": "optional note for indicator reference date",
			"displayOrder": 0,
			"defaultClassificationMapping": {
				"colorBrewerSchemeName": "schema name of colorBrewer colorPalette to use for classification",
				"numClasses": "number of Classes",
				"classificationMethod": "Classification Method ID",
				"items": [
					{
						"spatialUnit": "spatial unit id for manual classification",
						"breaks": ['break']
					}
				]
			},
			"regionalReferenceValues": [
				{
				  "referenceDate": "2024-04-23",
				  "regionalSum": 0,
				  "regionalAverage": 0,
				  "spatiallyUnassignable": 0
				}
			  ],
		};

		$scope.indicatorMetadataStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON($scope.indicatorMetadataStructure);

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

		$scope.roleManagementTableOptions = undefined;


		$scope.datasetName = undefined;
			$scope.indicatorAbbreviation = undefined;
			$scope.indicatorType = undefined;
			// $scope.indicatorCharacteristicValue = undefined;
			$scope.isHeadlineIndicator = false;
			$scope.indicatorUnit = undefined;
			$scope.enableFreeTextUnit = false;
			$scope.indicatorProcessDescription = undefined;
			$scope.indicatorTagsString_withCommas = undefined;
			$scope.indicatorInterpretation = undefined;
			$scope.indicatorCreationType = undefined;
			$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = undefined;
			$scope.enableLowestSpatialUnitSelect = false;
      $scope.indicatorPrecision = null;

			$scope.indicatorReferenceDateNote = undefined;
			$scope.displayOrder = 0;

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
			$scope.selectedColorBrewerPaletteEntry = undefined;

			$scope.numClassesPerSpatialUnit = undefined;
			$scope.classificationMethod = __env.defaultClassifyMethod || "jenks";
			$scope.spatialUnitClassification = [];
			$scope.classBreaksInvalid = false;

			$scope.tabClasses = [];

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.colorbrewerSchemes = colorbrewer;
		$scope.colorbreweSchemeName_dynamicIncrease = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
		$scope.colorbreweSchemeName_dynamicDecrease = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
		$scope.colorbrewerPalettes = [];

		$scope.regionalReferenceValuesManagementTableOptions = undefined;

		$scope.tmpIndicatorRegionalReferenceValuesObject = undefined;
		$scope.noneColumnValue = "-- keine --";
		$scope.file_regionalReferenceValuesImport;

    $scope.showCustomCommaValue = false;

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

		$scope.onClassificationMethodSelected = function(method){
			$scope.classificationMethod = method.id;
		};

		$scope.onNumClassesChanged = function(numClasses) {
			$scope.numClassesPerSpatialUnit = numClasses;
			for (let i = 0; i < kommonitorDataExchangeService.availableSpatialUnits.length; i++) {
				let spatialUnit = kommonitorDataExchangeService.availableSpatialUnits[i];
				$scope.spatialUnitClassification[i] = {};
				$scope.spatialUnitClassification[i].spatialUnitId = spatialUnit.spatialUnitId;
				$scope.spatialUnitClassification[i].breaks = [];
				$scope.tabClasses[i] = '';
				for (let classNr = 0; classNr < numClasses - 1; classNr++) {
					$scope.spatialUnitClassification[i].breaks.push(null);
				}
			}
		}

		$scope.onBreaksChanged = function(tabIndex) {
			$scope.classBreaksInvalid = false;
			let cssClass = 'tab-completed';
			for(const classBreak of $scope.spatialUnitClassification[tabIndex].breaks) {
				if (classBreak === null) {
					cssClass = '';
				}
			}
			
			if (cssClass == 'tab-completed') {
				for(let i = 0; i < $scope.spatialUnitClassification[tabIndex].breaks.length - 1; i ++) {
					if ($scope.spatialUnitClassification[tabIndex].breaks[i] > $scope.spatialUnitClassification[tabIndex].breaks[i+1]) {
						cssClass = 'tab-error';
						$scope.classBreaksInvalid = true;
					}
				}
			}
			else {
				for(const classBreak of $scope.spatialUnitClassification[tabIndex].breaks) {
					if (classBreak !== null) {
						cssClass = 'tab-error';
						$scope.classBreaksInvalid = true;
					}
				}
			}
			$scope.tabClasses[tabIndex] = cssClass;
			$scope.updateDecreaseAndIncreaseBreaks(tabIndex);
		}

		$scope.updateDecreaseAndIncreaseBreaks = function(tabIndex) {
			$scope.increaseBreaksLength = $scope.spatialUnitClassification[tabIndex].breaks.filter(val => val > 0).length;
			$scope.decreaseBreaksLength = $scope.spatialUnitClassification[tabIndex].breaks.filter(val => val < 0).length;
			if($scope.increaseBreaksLength < 3) {
				$scope.increaseBreaksLength = 3;
			}
			if($scope.decreaseBreaksLength < 3) {
				$scope.decreaseBreaksLength = 3;
			}
		}

		$scope.refreshReferenceValuesManagementTable = function() {
			$scope.regionalReferenceValuesManagementTableOptions = kommonitorDataGridHelperService.buildReferenceValuesManagementGrid('indicatorRegionalReferenceValuesManagementTable', $scope.currentIndicatorDataset.applicableDates, $scope.currentIndicatorDataset.regionalReferenceValues);
		}

		$scope.$on("onEditIndicatorMetadata", function (event, indicatorDataset) {

			$scope.currentIndicatorDataset = indicatorDataset;

			$scope.resetIndicatorEditMetadataForm();
			kommonitorMultiStepFormHelperService.registerClickHandler("indicatorEditMetadataForm");

		});

		$scope.$on("availableRolesUpdate", function (event) {
			let allowedRoles = $scope.currentIndicatorDataset ? $scope.currentIndicatorDataset.allowedRoles : [];
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, allowedRoles);
		});

		$scope.resetIndicatorEditMetadataForm = function(){

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

			$scope.datasetName = $scope.currentIndicatorDataset.indicatorName;
			$scope.datasetNameInvalid = false;

			$scope.indicatorReferenceDateNote = $scope.currentIndicatorDataset.referenceDateNote;
			$scope.displayOrder = $scope.currentIndicatorDataset.displayOrder;

			$scope.metadata = {};
			$scope.metadata.note = $scope.currentIndicatorDataset.metadata.note;
			$scope.metadata.literature = $scope.currentIndicatorDataset.metadata.literature;
			$scope.metadata.sridEPSG = 4326;
			$scope.metadata.datasource = $scope.currentIndicatorDataset.metadata.datasource;
			$scope.metadata.databasis = $scope.currentIndicatorDataset.metadata.databasis;
			$scope.metadata.contact = $scope.currentIndicatorDataset.metadata.contact;
			$scope.metadata.description = $scope.currentIndicatorDataset.metadata.description;

			$scope.metadata.lastUpdate = $scope.currentIndicatorDataset.metadata.lastUpdate;
			// $('#indicatorEditLastUpdateDatepicker').data({date: $scope.currentIndicatorDataset.metadata.lastUpdate});
			$('#indicatorEditLastUpdateDatepicker').datepicker('setDate', $scope.currentIndicatorDataset.metadata.lastUpdate);

			kommonitorDataExchangeService.updateIntervalOptions.forEach(function(option){
				if(option.apiName === $scope.currentIndicatorDataset.metadata.updateInterval){
					$scope.metadata.updateInterval = option;
				}
			});

			let allowedRoles = $scope.currentIndicatorDataset ? $scope.currentIndicatorDataset.allowedRoles : [];
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, allowedRoles);

			$scope.refreshReferenceValuesManagementTable();

			$scope.indicatorAbbreviation = $scope.currentIndicatorDataset.abbreviation;

      $scope.indicatorPrecision = $scope.currentIndicatorDataset.precision;

      if($scope.indicatorPrecision!=null)
        $scope.showCustomCommaValue = true;
      else
        $scope.showCustomCommaValue = false;

			kommonitorDataExchangeService.indicatorTypeOptions.forEach(function(option){
				if(option.apiName === $scope.currentIndicatorDataset.indicatorType){
					$scope.indicatorType = option;
				}
			});

			// $scope.indicatorCharacteristicValue = $scope.currentIndicatorDataset.characteristicValue;
			$scope.isHeadlineIndicator = $scope.currentIndicatorDataset.isHeadlineIndicator;
			$scope.indicatorUnit = $scope.currentIndicatorDataset.unit;

			$scope.enableFreeTextUnit = true;
			kommonitorDataExchangeService.indicatorUnitOptions.forEach(function(option){
				if(option === $scope.currentIndicatorDataset.unit){
					// if the unit is in list of known units then disable freeText
					$scope.enableFreeTextUnit = false;
				}
			});

			$scope.indicatorProcessDescription = $scope.currentIndicatorDataset.processDescription;
			$scope.indicatorTagsString_withCommas = "";

			for (let index = 0; index < $scope.currentIndicatorDataset.tags.length; index++) {
				$scope.indicatorTagsString_withCommas += $scope.currentIndicatorDataset.tags[index];

				if(index < $scope.currentIndicatorDataset.tags.length - 1){
					$scope.indicatorTagsString_withCommas += ",";
				}				
			}

			if (! $scope.currentIndicatorDataset.tags || $scope.currentIndicatorDataset.tags.length === 0){
				$scope.indicatorTagsString_withCommas = undefined;
			}

			$scope.indicatorInterpretation = $scope.currentIndicatorDataset.interpretation;

			kommonitorDataExchangeService.indicatorCreationTypeOptions.forEach(function(option){
				if(option.apiName === $scope.currentIndicatorDataset.creationType){
					$scope.indicatorCreationType = option;
				}
			});

			$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = undefined;

			for (let i = 0; i < kommonitorDataExchangeService.availableSpatialUnits.length; i++) {
				const spatialUnitMetadata = kommonitorDataExchangeService.availableSpatialUnits[i];

				if(spatialUnitMetadata.spatialUnitLevel === $scope.currentIndicatorDataset.lowestSpatialUnitForComputation){
					$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = spatialUnitMetadata;
					break;
				}				
			}

			if($scope.indicatorCreationType.apiName === "COMPUTATION"){
				$scope.enableLowestSpatialUnitSelect = true;
			}
			else{
				$scope.enableLowestSpatialUnitSelect = false;
			}

			var topicHierarchy = kommonitorDataExchangeService.getTopicHierarchyForTopicId($scope.currentIndicatorDataset.topicReference);

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
				if($scope.currentIndicatorDataset.referencedIndicators && $scope.currentIndicatorDataset.referencedIndicators.length > 0){
					for (const indicatorReference of $scope.currentIndicatorDataset.referencedIndicators) {
						var indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorReference.referencedIndicatorId);
						var referenceEntry = {
							"referencedIndicatorName": indicatorMetadata.indicatorName,
							"referencedIndicatorId": indicatorMetadata.indicatorId,
							"referencedIndicatorAbbreviation": indicatorMetadata.abbreviation,
							"referencedIndicatorDescription": indicatorReference.referencedIndicatorDescription
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

				if($scope.currentIndicatorDataset.referencedGeoresources && $scope.currentIndicatorDataset.referencedGeoresources.length > 0){
					for (const georesourceReference of $scope.currentIndicatorDataset.referencedGeoresources) {
						var georesourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceReference.referencedGeoresourceId);
						var geo_referenceEntry = {
							"referencedGeoresourceName": georesourceMetadata.datasetName,
							"referencedGeoresourceId": georesourceMetadata.georesourceId,
							"referencedGeoresourceDescription": georesourceReference.referencedGeoresourceDescription
						};
						$scope.georesourceReferences_adminView.push(geo_referenceEntry);	
					}
					
				}			

				$scope.numClassesArray = [3,4,5,6,7,8];

				$scope.numClassesPerSpatialUnit = undefined;
				$scope.classificationMethod = __env.defaultClassifyMethod || "jenks";
				$scope.spatialUnitClassification = [];
				$scope.classBreaksInvalid = false;

				if ($scope.currentIndicatorDataset.defaultClassificationMapping.classificationMethod) {
					$scope.classificationMethod = $scope.currentIndicatorDataset.defaultClassificationMapping.classificationMethod.toLowerCase();
				}
				if ($scope.currentIndicatorDataset.defaultClassificationMapping.numClasses) {
					$scope.numClassesPerSpatialUnit = $scope.currentIndicatorDataset.defaultClassificationMapping.numClasses;
					$scope.onNumClassesChanged($scope.numClassesPerSpatialUnit);
					
					// apply breaks for spatial units:
					for (let i = 0; i < $scope.spatialUnitClassification.length; i++) {
						for (let item of $scope.currentIndicatorDataset.defaultClassificationMapping.items) {
							if(item.spatialUnitId == $scope.spatialUnitClassification[i].spatialUnitId) {
								$scope.spatialUnitClassification[i] = item;
								$scope.onBreaksChanged(i);
							}
						}
					}
				}
				
				// instantiate with palette 'Blues'
				$scope.selectedColorBrewerPaletteEntry = $scope.colorbrewerPalettes[13];

				for (const colorbrewerPalette of $scope.colorbrewerPalettes) {
					if (colorbrewerPalette.paletteName === $scope.currentIndicatorDataset.defaultClassificationMapping.colorBrewerSchemeName){
						$scope.selectedColorBrewerPaletteEntry = colorbrewerPalette;
						break;
					}
				}			

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#indicatorEditMetadataSuccessAlert").hide();
			$("#indicatorEditMetadataErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.onClickColorBrewerEntry = function(colorPaletteEntry){
			$scope.selectedColorBrewerPaletteEntry = colorPaletteEntry;

			setTimeout(() => {
				$scope.$digest();
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
				$scope.$digest();
			}, 250);
		};

		$scope.onClickEditIndicatorReference = function(indicatorReference_adminView){

			$scope.tmpIndicatorReference_selectedIndicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorReference_adminView.referencedIndicatorId);
			$scope.tmpIndicatorReference_referenceDescription = indicatorReference_adminView.referencedIndicatorDescription;

			setTimeout(() => {
				$scope.$digest();
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
				$scope.$digest();
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
				$scope.$digest();
			}, 250);
		};

		$scope.onClickEditGeoresourceReference = function(georesourceReference_adminView){

			$scope.tmpGeoresourceReference_selectedGeoresourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceReference_adminView.referencedGeoresourceId);
			$scope.tmpGeoresourceReference_referenceDescription = georesourceReference_adminView.referencedGeoresourceDescription;

			setTimeout(() => {
				$scope.$digest();
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
				$scope.$digest();
			}, 250);
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
				// show error only if indicator is renamed to another already existing indicator
				if (indicator.indicatorName === $scope.datasetName && indicator.indicatorType === $scope.indicatorType.apiName && indicator.indicatorId != $scope.currentIndicatorDataset.indicatorId){
					$scope.datasetNameInvalid = true;
					return;
				}
			});
		};

		$scope.buildPatchBody_indicators = function(){

			var patchBody =
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
				  "regionalReferenceValues": [],
				  "datasetName": $scope.datasetName,
				  "abbreviation": $scope.indicatorAbbreviation || null,
          "precision": ($scope.showCustomCommaValue===true) ? $scope.indicatorPrecision : null,
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
				  "referenceDateNote": $scope.indicatorReferenceDateNote || "",
				  "displayOrder": $scope.displayOrder,
				  "lowestSpatialUnitForComputation": $scope.indicatorLowestSpatialUnitMetadataObjectForComputation? $scope.indicatorLowestSpatialUnitMetadataObjectForComputation.spatialUnitLevel : null,
				  "defaultClassificationMapping": {
					"colorBrewerSchemeName": $scope.selectedColorBrewerPaletteEntry.paletteName,
					"classificationMethod": $scope.classificationMethod.toUpperCase(),
					"numClasses": $scope.numClassesPerSpatialUnit ? Number($scope.numClassesPerSpatialUnit) : 5,
					"items": $scope.spatialUnitClassification.filter(entry => ! entry.breaks.includes(null)),
				  }
			};

			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				patchBody.allowedRoles.push(roleId);
			}

			// regionalReferenceValues
			let regionalReferenceValuesList = kommonitorDataGridHelperService.getReferenceValues_regionalReferenceValuesManagementGrid($scope.regionalReferenceValuesManagementTableOptions);
			for (const referenceValueEntry of regionalReferenceValuesList) {
				patchBody.regionalReferenceValues.push(referenceValueEntry);
			}

			// TAGS
			if($scope.indicatorTagsString_withCommas){
				var tags_splitted = $scope.indicatorTagsString_withCommas.split(",");
				for (const tagString of tags_splitted) {
					patchBody.tags.push(tagString.trim());
				}
			}

			// TOPIC REFERENCE
			if($scope.indicatorTopic_subsubsubTopic){
				patchBody.topicReference = $scope.indicatorTopic_subsubsubTopic.topicId;
			}
			else if($scope.indicatorTopic_subsubTopic){
				patchBody.topicReference = $scope.indicatorTopic_subsubTopic.topicId;
			}
			else if($scope.indicatorTopic_subTopic){
				patchBody.topicReference = $scope.indicatorTopic_subTopic.topicId;
			}
			else if($scope.indicatorTopic_mainTopic){
				patchBody.topicReference = $scope.indicatorTopic_mainTopic.topicId;
			}
			else {
				patchBody.topicReference = "";
			}


			// REFERENCES
			if($scope.indicatorReferences_adminView && $scope.indicatorReferences_adminView.length > 0){
				patchBody.refrencesToOtherIndicators = [];

				for (const indicRef of $scope.indicatorReferences_adminView) {
					patchBody.refrencesToOtherIndicators.push({
						"indicatorId": indicRef.referencedIndicatorId,
						"referenceDescription": indicRef.referencedIndicatorDescription
					});
				}
			}

			if($scope.georesourceReferences_adminView && $scope.georesourceReferences_adminView.length > 0){
				patchBody.refrencesToGeoresources = [];

				for (const geoRef of $scope.georesourceReferences_adminView) {
					patchBody.refrencesToGeoresources.push({
						"georesourceId": geoRef.referencedGeoresourceId,
						"referenceDescription": geoRef.referencedGeoresourceDescription
					});
				}
			}	
			

			return patchBody;
		};

		$scope.editIndicatorMetadata = function(){

			var patchBody = $scope.buildPatchBody_indicators();

			// TODO verify input

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId,
				method: "PATCH",
				data: patchBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.datasetName;

					$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
					$("#indicatorEditMetadataSuccessAlert").show();
					$scope.loadingData = false;

				}, function errorCallback(error) {
					if(error.data){							
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#indicatorEditMetadataErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#indicatorEditMetadataSuccessAlert").hide();
					// }, 3000);
			});
		};

		$scope.onImportIndicatorEditMetadata = function(){

			$scope.indicatorMetadataImportError = "";

			$("#indicatorEditMetadataImportFile").files = [];

			// trigger file chooser
			$("#indicatorEditMetadataImportFile").click();

		};

		$(document).on("change", "#indicatorEditMetadataImportFile" ,function(){

			console.log("Importing Indicator metadata for Edit Indicator Form");

			// get the file
			var file = document.getElementById('indicatorEditMetadataImportFile').files[0];
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
					document.getElementById("indicatorsEditMetadataPre").innerHTML = $scope.indicatorMetadataStructure_pretty;
					$("#indicatorEditMetadataImportErrorAlert").show();

					$scope.$digest();
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

				$scope.$digest();
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

				$scope.indicatorReferenceDateNote = $scope.metadataImportSettings.referenceDateNote;
				$scope.displayOrder = $scope.metadataImportSettings.displayOrder;

				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.metadataImportSettings.allowedRoles);

				$scope.regionalReferenceValuesManagementTableOptions = kommonitorDataGridHelperService.buildReferenceValuesManagementGrid('indicatorRegionalReferenceValuesManagementTable', $scope.currentIndicatorDataset.applicableDates, $scope.metadataImportSettings.regionalReferenceValues);

				// indicator specific properties

				$scope.indicatorAbbreviation = $scope.metadataImportSettings.abbreviation;
        $scope.indicatorPrecision = ($scope.metadataImportSettings.precision!="") ? $scope.metadataImportSettings.precision : null;
        
        if($scope.indicatorPrecision!=null)
          $scope.showCustomCommaValue = true;
        else
          $scope.showCustomCommaValue = false;

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

				// $scope.indicatorCharacteristicValue = $scope.metadataImportSettings.characteristicValue;
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
				$scope.indicatorLowestSpatialUnitMetadataObjectForComputation = undefined;

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
				$scope.selectedColorBrewerPaletteEntry = undefined;

				$scope.numClassesPerSpatialUnit = $scope.numClassesArray[2];

				for (const numClassesEntry of $scope.numClassesArray) {
					if (numClassesEntry == $scope.metadataImportSettings.defaultClassificationMapping.numClasses){
						$scope.numClassesPerSpatialUnit = numClassesEntry;
						break;	
					}
				}

				$scope.classificationMethod = $scope.metadataImportSettings.defaultClassificationMapping.classificationMethod || __env.defaultClassifyMethod;
				$scope.spatialUnitClassification = $scope.metadataImportSettings.defaultClassificationMapping.items;

				for (const colorbrewerPalette of $scope.colorbrewerPalettes) {
					if (colorbrewerPalette.paletteName === $scope.metadataImportSettings.defaultClassificationMapping.colorBrewerSchemeName){
						$scope.selectedColorBrewerPaletteEntry = colorbrewerPalette;
						break;
					}
				}

				$scope.spatialUnitRefKeyProperty = undefined;
				$scope.targetSpatialUnitMetadata = undefined;
				$scope.$digest();
		};

		$scope.onExportIndicatorEditMetadataTemplate = function(){

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

		$scope.onExportIndicatorEditMetadata = function(){
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

			metadataExport.referenceDateNote = $scope.indicatorReferenceDateNote;
			metadataExport.displayOrder = $scope.displayOrder;

			metadataExport.allowedRoles = [];
			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				metadataExport.allowedRoles.push(roleId);
			}

			metadataExport.regionalReferenceValues = [];
			let regionalReferenceValuesList = kommonitorDataGridHelperService.getReferenceValues_regionalReferenceValuesManagementGrid($scope.regionalReferenceValuesManagementTableOptions);
			for (const regionalReferenceValuesEntry of regionalReferenceValuesList) {
				metadataExport.regionalReferenceValues.push(regionalReferenceValuesEntry);
			}

			if($scope.metadata.updateInterval){
					metadataExport.metadata.updateInterval = $scope.metadata.updateInterval.apiName;
			}

			var name = $scope.datasetName;

			// indicator specific properties

			metadataExport.abbreviation = $scope.indicatorAbbreviation || "";
			metadataExport.indicatorType = $scope.indicatorType ? $scope.indicatorType.apiName : "";
			metadataExport.creationType = $scope.indicatorCreationType ? $scope.indicatorCreationType.apiName : "";
      metadataExport.precision = $scope.indicatorPrecision || "";

			// metadataExport.characteristicValue = $scope.indicatorCharacteristicValue || "";
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
					"classificationMethod": $scope.classificationMethod,
					"numClasses": $scope.numClassesPerSpatialUnit,
					"items": $scope.spatialUnitClassification
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

		$scope.dropHandler = function (ev) {

			try {
				// Prevent default behavior (Prevent file from being opened)
				ev.preventDefault();

				if (ev.dataTransfer.items) {
					// Use DataTransferItemList interface to access the file(s)
					for (var i = 0; i < ev.dataTransfer.items.length; i++) {
						// If dropped items aren't files, reject them
						if (ev.dataTransfer.items[i].kind === 'file') {
							var file = ev.dataTransfer.items[i].getAsFile();
							kommonitorFileHelperService.transformFileToKomMonitorIndicatorRegionalReferenceValuesObject(file);
						}
					}
				} else {
					// Use DataTransfer interface to access the file(s)
					for (var i = 0; i < ev.dataTransfer.files.length; i++) {
						var file = ev.dataTransfer.files[i];
						kommonitorFileHelperService.transformFileToKomMonitorIndicatorRegionalReferenceValuesObject(file);
					}
				}
			} catch (e) {
				$scope.fileLayerError = e;
				$scope.loadingData = false;
				console.error(e);
				kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Dateiverarbeitung", $scope.fileLayerError);
			} finally {

			}

		};


		$scope.$on("onDropFile_importRegionalReferenceValues", function (ev, dropEvent) {
			$scope.dropHandler(dropEvent);
		});

		// $scope.dragOverHandler = function(ev) {
		//   console.log('File(s) in drop zone');
		//
		//   // Prevent default behavior (Prevent file from being opened)
		//   ev.preventDefault();
		// };

		$scope.openFileDialog = function () {
			// $("#fileUploadInput_importRegionalReferenceValues").trigger("click");
			document.getElementById("fileUploadInput_importRegionalReferenceValues").click();
		};

		$(document).on('change', '#fileUploadInput_importRegionalReferenceValues', function () {

			// get the file
			var files = document.getElementById('fileUploadInput_importRegionalReferenceValues').files;

			for (var i = 0; i < files.length; i++) {
				$scope.file_regionalReferenceValuesImport = files[i];
				
				kommonitorFileHelperService.transformFileToKomMonitorIndicatorRegionalReferenceValuesObject($scope.file_regionalReferenceValuesImport);
				$scope.$digest();
			}
		});

		$scope.initSpecialFields = function (indicatorRegionalReferenceValuesObject) {

			// add special entry for NO selection to allow users to mark certain colors as not existant in dataset
			// only timestamp is necessary			
			indicatorRegionalReferenceValuesObject.featureSchema.splice(0, 0, $scope.noneColumnValue);

			// init feature NAME and ID fields
			indicatorRegionalReferenceValuesObject.TIMESTAMP_ATTRIBUTE = indicatorRegionalReferenceValuesObject.featureSchema[0];
			indicatorRegionalReferenceValuesObject.REGIONAL_SUM_ATTRIBUTE = indicatorRegionalReferenceValuesObject.featureSchema[0];
			indicatorRegionalReferenceValuesObject.REGIONAL_MEAN_ATTRIBUTE = indicatorRegionalReferenceValuesObject.featureSchema[0];
			indicatorRegionalReferenceValuesObject.SPATIALLY_UNASSIGNABLE = indicatorRegionalReferenceValuesObject.featureSchema[0];

			for (const property of indicatorRegionalReferenceValuesObject.featureSchema) {
				if (property.toLowerCase().includes("zeit") || property.toLowerCase().includes("dat") || property.toLowerCase().includes("jahr")) {
					indicatorRegionalReferenceValuesObject.TIMESTAMP_ATTRIBUTE = property;
				}			
				if (property.toLowerCase().includes("sum")) {
					indicatorRegionalReferenceValuesObject.REGIONAL_SUM_ATTRIBUTE = property;
				}
				if (property.toLowerCase().includes("mit") || property.toLowerCase().includes("durch") || property.toLowerCase().includes("mean") || property.toLowerCase().includes("avg") || property.toLowerCase().includes("ave")) {
					indicatorRegionalReferenceValuesObject.REGIONAL_MEAN_ATTRIBUTE = property;
				}	
				if (property.toLowerCase().includes("nicht") || property.toLowerCase().includes("zuord") || property.toLowerCase().includes("zuzu") || property.toLowerCase().includes("ord")) {
					indicatorRegionalReferenceValuesObject.SPATIALLY_UNASSIGNABLE = property;
				}				
			}

			return indicatorRegionalReferenceValuesObject;
		}

		$scope.$on("CSVFromFileFinished_indicatorRegionalReferenceValues", function (event, indicatorRegionalReferenceValuesObject) {
			try {
				indicatorRegionalReferenceValuesObject = $scope.initSpecialFields(indicatorRegionalReferenceValuesObject)

				$scope.tmpIndicatorRegionalReferenceValuesObject = indicatorRegionalReferenceValuesObject;

				kommonitorToastHelperService.displayInfoToast_upperRight("CSV-Datei erkannt", "Weitere Konfiguration erforderlich");

				$scope.$digest();
			} catch (error) {
				console.error(error);
				$scope.loadingData = false;
				kommonitorToastHelperService.displayErrorToast_upperRight("Fehler beim Laden der CSV-Datei", error);
			}						
		});

		$scope.makeIndicatorRegionalReferenceValues_fromCsv = function(tmpIndicatorRegionalReferenceValuesObject){
			let indicatorRegionalReferenceValuesObject = [];
			let containsEmptyValues = false;

			for (const tmpIndicatorRegionalReferenceValuesEntry of tmpIndicatorRegionalReferenceValuesObject.dataRows) {

				let dateValue = tmpIndicatorRegionalReferenceValuesEntry[tmpIndicatorRegionalReferenceValuesObject.TIMESTAMP_ATTRIBUTE];
				let sumValue = tmpIndicatorRegionalReferenceValuesEntry[tmpIndicatorRegionalReferenceValuesObject.REGIONAL_SUM_ATTRIBUTE];
				let meanValue = tmpIndicatorRegionalReferenceValuesEntry[tmpIndicatorRegionalReferenceValuesObject.REGIONAL_MEAN_ATTRIBUTE];
				let spatiallyUnassignableValue = tmpIndicatorRegionalReferenceValuesEntry[tmpIndicatorRegionalReferenceValuesObject.SPATIALLY_UNASSIGNABLE];

				let dateValueInvalid = false;
				let sumValueInvalid = false;
				let meanValueInvalid = false;
				let spatiallyUnassignableValueInvalid = false;
				

				if (!dateValue || dateValue.split("-").length != 3){
					 
					dateValueInvalid = true;
					kommonitorToastHelperService.displayErrorToast_upperRight("Ungültige Zeitwerte Definition in angegebener Zeitspalte '" +
					tmpIndicatorRegionalReferenceValuesObject.TIMESTAMP_ATTRIBUTE + "'", "Konkreter Wert ist '" + dateValue + "'");															
				
				}

				//SUMVALUE
				if (!sumValue){
					sumValue = NaN;
					containsEmptyValues = true;
				}
				else if ( typeof(sumValue) == "String"){
					try {
						sumValue = Number(sumValue);
					} catch (error) {
						sumValueInvalid = true;
						sumValue = NaN;
					}
					
				}
				else{
					sumValue = Number(sumValue);
				}

				//MEANVALUE
				//SUMVALUE
				if (!meanValue){
					meanValue = NaN;
					containsEmptyValues = true;
				}
				else if ( typeof(meanValue) == "String"){
					try {
						meanValue = Number(meanValue);
					} catch (error) {
						meanValueInvalid = true;
						meanValue = NaN;
					}
				}
				else{
					meanValue = Number(meanValue);
				}

				//SPATIALLYUNASSIGNABLEVALUE
				if (!spatiallyUnassignableValue){
					spatiallyUnassignableValue = NaN;
					containsEmptyValues = true;
				}
				else if ( typeof(spatiallyUnassignableValue) == "String"){
					try {
						spatiallyUnassignableValue = Number(spatiallyUnassignableValue);
					} catch (error) {
						spatiallyUnassignableValueInvalid = true;
						spatiallyUnassignableValue = NaN;
					}
				}
				else{
					spatiallyUnassignableValue = Number(spatiallyUnassignableValue);
				}

				
				
				// object building
				if(! dateValueInvalid){
					 
					indicatorRegionalReferenceValuesObject.push({					
						"referenceDate": dateValue,
						"regionalSum": sumValue,
						"regionalAverage": meanValue,
						"spatiallyUnassignable": spatiallyUnassignableValue					
					});
				}
				
			}

			// validations / warning / errors

				// if(dateValueInvalid || sumValueInvalid || meanValueInvalid){
				// 	kommonitorToastHelperService.displayErrorToast_upperRight("Datei enthält ungültige Definitionen", "Bitte prüfen und vergleichen Sie die Tabelleneinträge mit der Original-Datei");															
				// }
				if(containsEmptyValues){
					kommonitorToastHelperService.displayWarningToast_upperRight("Datei enthält leere oder ungültige Zahlenwerte für Summe, Mittelwert oder räumlich nicht zuordenbare Elemente", "Leerwerte und ungültige werden als ungültige Zahlenwerte interpretiert.");
				}

			return indicatorRegionalReferenceValuesObject;
		}

		$scope.loadCSV_indicatorRegionalReferenceValues = function () {
			try {
				let tmpIndicatorRegionalReferenceValues = $scope.makeIndicatorRegionalReferenceValues_fromCsv($scope.tmpIndicatorRegionalReferenceValuesObject);
				let applicableIndicatorRegionalReferenceValues = [];
				let nonApplicableIndicatorRegionalReferenceValues = [];

				if($scope.currentIndicatorDataset.applicableDates && $scope.currentIndicatorDataset.applicableDates.length > 0){

					for (const tmpIndicatorRegionalReferenceValuesEntry of tmpIndicatorRegionalReferenceValues) {
		  
						if($scope.currentIndicatorDataset.applicableDates.includes(tmpIndicatorRegionalReferenceValuesEntry.referenceDate)){
							applicableIndicatorRegionalReferenceValues.push(tmpIndicatorRegionalReferenceValuesEntry);
						}
						else{
							nonApplicableIndicatorRegionalReferenceValues.push(tmpIndicatorRegionalReferenceValuesEntry);
						}					  
					}
					
				  }

				$scope.regionalReferenceValuesManagementTableOptions = kommonitorDataGridHelperService.buildReferenceValuesManagementGrid('indicatorRegionalReferenceValuesManagementTable', $scope.currentIndicatorDataset.applicableDates, applicableIndicatorRegionalReferenceValues);

				kommonitorToastHelperService.displaySuccessToast_upperRight(applicableIndicatorRegionalReferenceValues.length + " Vergleichswerte erfolgreich in Tabelle eingetragen", "");
				if (nonApplicableIndicatorRegionalReferenceValues.length > 0){
					kommonitorToastHelperService.displayErrorToast_upperRight(nonApplicableIndicatorRegionalReferenceValues.length + " Vergleichswerte der Datei konnten nicht zu einem Indikatoren-Zeitpunkt zugeordnet werden", "");				
				}
				kommonitorToastHelperService.displayWarningToast_upperRight("Erst durch Aktualisieren der Metadaten werden die Vergleichswerte in die Datenbank importiert", "");

			} catch (error) {
				console.error(error);
				$scope.loadingData = false;
				kommonitorToastHelperService.displayErrorToast_upperRight("Fehler beim Laden der CSV-Datei", error);
			}
		}

			$scope.hideSuccessAlert = function(){
				$("#indicatorEditMetadataSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#indicatorEditMetadataErrorAlert").hide();
			};

			$scope.hideMetadataErrorAlert = function(){
				$("#indicatorEditMetadataImportErrorAlert").hide();
			};

	}
]});
