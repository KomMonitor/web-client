angular.module('spatialUnitAddModal').component('spatialUnitAddModal', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitAddModal/spatial-unit-add-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env',
		function SpatialUnitAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

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
    $('#spatialUnitAddDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#spatialUnitAddDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#spatialUnitAddLastUpdateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$scope.loadingData = false;

		$scope.spatialUnitMetadataStructure = {
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
			"nextLowerHierarchyLevel": "Name of lower hierarchy level",
			"spatialUnitLevel": "Name of spatial unit dataset",
			"nextUpperHierarchyLevel": "Name of upper hierarchy level"
		};

		$scope.spatialUnitMetadataStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON($scope.spatialUnitMetadataStructure);

		$scope.metadataImportSettings;
		$scope.spatialUnitMetadataImportError;
		$scope.spatialUnitMetadataImportErrorAlert;

		$scope.spatialUnitLevel = undefined;
		$scope.spatialUnitLevelInvalid = false;

		$scope.metadata = {};
		$scope.metadata.note = undefined;
		$scope.metadata.literature = undefined;
		$scope.metadata.updateInterval = undefined;
		$scope.metadata.sridEPSG = 4326;
		$scope.metadata.datasource = undefined;
		$scope.metadata.databasis = undefined;
		$scope.metadata.contact = undefined;
		$scope.metadata.lastUpdate = undefined;
		$scope.metadata.description = undefined;

		$scope.nextLowerHierarchySpatialUnit = undefined;
		$scope.nextUpperHierarchySpatialUnit = undefined;
		$scope.hierarchyInvalid = false;

		$scope.periodOfValidity = {};
		$scope.periodOfValidity.startDate = undefined;
		$scope.periodOfValidity.endDate = undefined;
		$scope.periodOfValidityInvalid = false;

		$scope.converter = undefined;
		$scope.datasourceType = undefined;
		$scope.spatialUnitDataSourceIdProperty = undefined;
		$scope.spatialUnitDataSourceNameProperty = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.converterDefinition = undefined;
		$scope.datasourceTypeDefinition = undefined;
		$scope.propertyMappingDefinition = undefined;
		$scope.postBody_spatialUnits = undefined;

		$scope.validityEndDate_perFeature = undefined;
		$scope.validityStartDate_perFeature = undefined;


		$scope.resetSpatialUnitAddForm = function(){
			$scope.spatialUnitLevel = undefined;
			$scope.spatialUnitLevelInvalid = false;

			$scope.metadata = {};
			$scope.metadata.note = undefined;
			$scope.metadata.literature = undefined;
			$scope.metadata.updateInterval = undefined;
			$scope.metadata.sridEPSG = 4326;
			$scope.metadata.datasource = undefined;
			$scope.metadata.databasis = undefined;
			$scope.metadata.contact = undefined;
			$scope.metadata.lastUpdate = undefined;
			$scope.metadata.description = undefined;

			$scope.nextLowerHierarchySpatialUnit = undefined;
			$scope.nextUpperHierarchySpatialUnit = undefined;
			$scope.hierarchyInvalid = false;

			$scope.periodOfValidity = {};
			$scope.periodOfValidity.startDate = undefined;
			$scope.periodOfValidity.endDate = undefined;
			$scope.periodOfValidityInvalid = false;

			$scope.converter = undefined;
			$scope.datasourceType = undefined;
			$scope.spatialUnitDataSourceIdProperty = undefined;
			$scope.spatialUnitDataSourceNameProperty = undefined;

			$scope.converterDefinition = undefined;
			$scope.datasourceTypeDefinition = undefined;
			$scope.propertyMappingDefinition = undefined;
			$scope.postBody_spatialUnits = undefined;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;
		};

		$scope.checkSpatialUnitName = function(){
			$scope.spatialUnitLevelInvalid = false;
			kommonitorDataExchangeService.availableSpatialUnits.forEach(function(spatialUnit){
				if (spatialUnit.spatialUnitLevel === $scope.spatialUnitLevel){
					$scope.spatialUnitLevelInvalid = true;
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

		$scope.checkSpatialUnitHierarchy = function(){

			$scope.hierarchyInvalid = false;

			// smaller indices represent higher spatial units
			// i.e. city districts will have a smaller index than building blocks
			if($scope.nextLowerHierarchySpatialUnit && $scope.nextUpperHierarchySpatialUnit){
				var indexOfLowerHierarchyUnit;
				var indexOfUpperHierarchyUnit;

				for(var i=0; i<kommonitorDataExchangeService.availableSpatialUnits.length; i++){
					var spatialUnit = kommonitorDataExchangeService.availableSpatialUnits[i];
					if (spatialUnit.spatialUnitLevel === $scope.nextLowerHierarchySpatialUnit.spatialUnitLevel){
						indexOfLowerHierarchyUnit = i;
					}
					if (spatialUnit.spatialUnitLevel === $scope.nextUpperHierarchySpatialUnit.spatialUnitLevel){
						indexOfUpperHierarchyUnit = i;
					}
				}

					if ((indexOfLowerHierarchyUnit <= indexOfUpperHierarchyUnit)){
						// failure
						$scope.hierarchyInvalid = true;
					}
			}
		};

		$scope.buildImporterObjects = async function(){
			$scope.converterDefinition = $scope.buildConverterDefinition();
			$scope.datasourceTypeDefinition = await $scope.buildDatasourceTypeDefinition();
			$scope.propertyMappingDefinition = $scope.buildPropertyMappingDefinition();
			$scope.postBody_spatialUnits = $scope.buildPostBody_spatialUnits();

			if(!$scope.converterDefinition || !$scope.datasourceTypeDefinition || !$scope.propertyMappingDefinition || !$scope.postBody_spatialUnits){
				return false;
			}

			return true;
		};

		$scope.buildConverterDefinition = function(){
			var converterDefinition = {
				"encoding": $scope.converter.encodings[0],
				"mimeType": $scope.converter.mimeTypes[0],
				"name": $scope.converter.name,
				"parameters": [
				  
				],
				"schema": undefined
			  };

			if($scope.converter.schemas){
				if ($scope.schema === undefined || $scope.schema === null){
					return null;
				}
				else{
					converterDefinition.schema = $scope.schema;
				}
			}  

			if($scope.converter.parameters.length > 0){
				for (const parameter of $scope.converter.parameters) {
					var parameterName = parameter.name;
					var parameterValue = $("#converterParameter_spatialUnitAdd_" + parameterName).val();

					if (parameterValue === undefined || parameterValue === null){
						return null;
					}
					else{
						converterDefinition.parameters.push({
							"name": parameterName,
							"value": parameterValue
						});
					}
				}
			}

			return converterDefinition;
		};

		$scope.buildDatasourceTypeDefinition = async function(){
			var datasourceTypeDefinition = {
				"parameters": [
				  
				],
				"type": $scope.datasourceType.type
			  };

			if($scope.datasourceType.type === "FILE"){
				// get file if present

				// upload it to importer

				// use file reference name for datasourceType definition

				
				var file = document.getElementById('spatialUnitDataSourceInput').files[0];

				if(file === null || file === undefined){
					return null;
				}

				var fileUploadName;
				try {
					fileUploadName = await kommonitorImporterHelperService.uploadNewFile(file, file.name);	
				} catch (error) {
					$scope.errorMessagePart = error;

					$("#spatialUnitAddErrorAlert").show();
					$scope.loadingData = false;
					return null;
				}

				datasourceTypeDefinition.parameters.push({
					"name": "NAME",
					"value": fileUploadName
				});
			}  
			else{
				if($scope.datasourceType.parameters.length > 0){
					for (const parameter of $scope.datasourceType.parameters) {
						var parameterName = parameter.name;
						var parameterValue = $("#datasourceTypeParameter_spatialUnitAdd_" + parameterName).val();
	
						if (parameterValue === undefined || parameterValue === null){
							return null;
						}
						else{
							datasourceTypeDefinition.parameters.push({
								"name": parameterName,
								"value": parameterValue
							});
						}
					}
				}
			}

			return datasourceTypeDefinition;
		};

		$scope.buildPropertyMappingDefinition = function(){
			var propertyMapping = {
				// arisenFrom current not used
				"arisenFromProperty": undefined,
				"identifierProperty": $scope.spatialUnitDataSourceIdProperty,
				"nameProperty": $scope.spatialUnitDataSourceNameProperty,
				"validEndDateProperty": $scope.validityEndDate_perFeature,
				"validStartDateProperty": $scope.validityStartDate_perFeature
			  };

			  return propertyMapping;
		};

		$scope.buildPostBody_spatialUnits = function(){
			var postBody =
			{
				"geoJsonString": undefined, // will be set by importer
				"metadata": {
					"note": $scope.metadata.note,
					"literature": $scope.metadata.literature,
					"updateInterval": $scope.metadata.updateInterval.apiName,
					"sridEPSG": $scope.metadata.sridEPSG,
					"datasource": $scope.metadata.datasource,
					"contact": $scope.metadata.contact,
					"lastUpdate": $scope.metadata.lastUpdate,
					"description": $scope.metadata.description,
					"databasis": $scope.metadata.databasis
				},
				"jsonSchema": undefined,
				"nextLowerHierarchyLevel": $scope.nextLowerHierarchySpatialUnit ? $scope.nextLowerHierarchySpatialUnit.spatialUnitLevel : undefined,
				"spatialUnitLevel": $scope.spatialUnitLevel,
				"periodOfValidity": {
					"endDate": $scope.periodOfValidity.endDate,
					"startDate": $scope.periodOfValidity.startDate
				},
				"nextUpperHierarchyLevel": $scope.nextUpperHierarchySpatialUnit ? $scope.nextUpperHierarchySpatialUnit.spatialUnitLevel : undefined
			};

			return postBody;
		};

			$scope.addSpatialUnit = async function () {

				/*
					now collect data and build request for importer
				*/

				/*
					if any required importer data is missing --> cancel request and highlight required errors 
				*/
				var allDataSpecified = await $scope.buildImporterObjects();

				if (!allDataSpecified) {

					$("#spatialUnitAddForm").validator("update");
					$("#spatialUnitAddForm").validator("validate");
					return;
				}
				else {


					// TODO verify input

					// TODO Create and perform POST Request with loading screen

					$scope.loadingData = true;

					try {
						var newSpatialUnitResponse = await kommonitorImporterHelperService.registerNewSpatialUnit($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.postBody_spatialUnits);

						$rootScope.$broadcast("refreshSpatialUnitOverviewTable");

						// refresh all admin dashboard diagrams due to modified metadata
						$rootScope.$broadcast("refreshAdminDashboardDiagrams");

						$("#spatialUnitAddSucessAlert").show();
						$scope.loadingData = false;
					} catch (error) {
						$scope.errorMessagePart = error;

						$("#spatialUnitAddErrorAlert").show();
						$scope.loadingData = false;

						setTimeout(() => {
							$scope.$apply();
						}, 250);
					}
				}

			};

		$scope.onImportSpatialUnitAddMetadata = function(){

			$scope.spatialUnitMetadataImportError = "";

			$("#spatialUnitMetadataImportFile").files = [];

			// trigger file chooser
			$("#spatialUnitMetadataImportFile").click();

		};

		$(document).on("change", "#spatialUnitMetadataImportFile" ,function(){

			console.log("Importing SpatialUnit metadata for Add SpatialUnit Form");

			// get the file
			var file = document.getElementById('spatialUnitMetadataImportFile').files[0];
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
					$scope.spatialUnitMetadataImportError = "Uploaded Metadata File cannot be parsed correctly";
					document.getElementById("spatialUnitsAddMetadataPre").innerHTML = $scope.spatialUnitMetadataStructure_pretty;
					$("#spatialUnitMetadataImportErrorAlert").show();
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
				$scope.spatialUnitMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster &uuml;berein.";
				document.getElementById("spatialUnitsAddMetadataPre").innerHTML = $scope.spatialUnitMetadataStructure_pretty;
				$("#spatialUnitMetadataImportErrorAlert").show();
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
				$('#spatialUnitAddLastUpdateDatepicker').datepicker('setDate', $scope.metadata.lastUpdate);

				$scope.metadata.description = $scope.metadataImportSettings.metadata.description;
				$scope.metadata.databasis = $scope.metadataImportSettings.metadata.databasis;

				for(var i=0; i<kommonitorDataExchangeService.availableSpatialUnits.length; i++){
					var spatialUnit = kommonitorDataExchangeService.availableSpatialUnits[i];
					if (spatialUnit.spatialUnitLevel === $scope.metadataImportSettings.nextLowerHierarchyLevel){
						$scope.nextLowerHierarchySpatialUnit = spatialUnit;
					}
					if (spatialUnit.spatialUnitLevel === $scope.metadataImportSettings.nextUpperHierarchyLevel){
						$scope.nextUpperHierarchySpatialUnit = spatialUnit;
					}
				}

				$scope.spatialUnitLevel = $scope.metadataImportSettings.spatialUnitLevel;

				$scope.$apply();
		};

		$scope.onExportSpatialUnitAddMetadata = function(){
			var metadataExport = $scope.spatialUnitMetadataStructure;

			metadataExport.metadata.note = $scope.metadata.note || "";
			metadataExport.metadata.literature = $scope.metadata.literature  || "";
			metadataExport.metadata.sridEPSG = $scope.metadata.sridEPSG || "";
			metadataExport.metadata.datasource = $scope.metadata.datasource || "";
			metadataExport.metadata.contact = $scope.metadata.contact || "";
			metadataExport.metadata.lastUpdate = $scope.metadata.lastUpdate || "";
			metadataExport.metadata.description = $scope.metadata.description || "";
			metadataExport.metadata.databasis = $scope.metadata.databasis || "";
			metadataExport.spatialUnitLevel = $scope.spatialUnitLevel || "";

			if($scope.metadata.updateInterval){
					metadataExport.metadata.updateInterval = $scope.metadata.updateInterval.apiName;
			}
			if($scope.nextLowerHierarchySpatialUnit){
				metadataExport.nextLowerHierarchyLevel = $scope.nextLowerHierarchySpatialUnit.spatialUnitLevel;
			}
			else{
				metadataExport.nextLowerHierarchyLevel = "";
			}
			if($scope.nextUpperHierarchySpatialUnit){
				metadataExport.nextUpperHierarchyLevel = $scope.nextUpperHierarchySpatialUnit.spatialUnitLevel;
			}
			else{
				metadataExport.nextUpperHierarchyLevel = "";
			}

			var name = $scope.spatialUnitLevel;

			var metadataJSON = JSON.stringify(metadataExport);

			var fileName = "Raumeinheit_Metadaten_Export";

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
				$("#spatialUnitAddSucessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#spatialUnitAddErrorAlert").hide();
			};

			$scope.hideMetadataErrorAlert = function(){
				$("#spatialUnitMetadataImportErrorAlert").hide();
			};


			/*
			MULTI STEP FORM STUFF
			*/
			//jQuery time
			var current_fs, next_fs, previous_fs; //fieldsets
			var left, opacity, scale; //fieldset properties which we will animate
			var animating; //flag to prevent quick multi-click glitches

			$(".next").click(function(){
				if(animating) return false;
				animating = true;
				
				current_fs = $(this).parent();
				next_fs = $(this).parent().next();
				
				//activate next step on progressbar using the index of next_fs
				$("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
				
				//show the next fieldset
				next_fs.show(); 
				//hide the current fieldset with style
				current_fs.animate({opacity: 0}, {
					step: function(now, mx) {
						//as the opacity of current_fs reduces to 0 - stored in "now"
						//1. scale current_fs down to 80%
						scale = 1 - (1 - now) * 0.2;
						//2. bring next_fs from the right(50%)
						left = (now * 50)+"%";
						//3. increase opacity of next_fs to 1 as it moves in
						opacity = 1 - now;
						current_fs.css({
					'transform': 'scale('+scale+')',
					'position': 'absolute'
				});
						next_fs.css({'left': left, 'opacity': opacity});
					}, 
					duration: 800, 
					complete: function(){
						current_fs.hide();
						animating = false;
					}, 
					//this comes from the custom easing plugin
					easing: 'easeInOutBack'
				});
			});

			$(".previous").click(function(){
				if(animating) return false;
				animating = true;
				
				current_fs = $(this).parent();
				previous_fs = $(this).parent().prev();
				
				//de-activate current step on progressbar
				$("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");
				
				//show the previous fieldset
				previous_fs.show(); 
				//hide the current fieldset with style
				current_fs.animate({opacity: 0}, {
					step: function(now, mx) {
						//as the opacity of current_fs reduces to 0 - stored in "now"
						//1. scale previous_fs from 80% to 100%
						scale = 0.8 + (1 - now) * 0.2;
						//2. take current_fs to the right(50%) - from 0%
						left = ((1-now) * 50)+"%";
						//3. increase opacity of previous_fs to 1 as it moves in
						opacity = 1 - now;
						current_fs.css({'left': left});
						previous_fs.css({'transform': 'scale('+scale+')', 'opacity': opacity});
					}, 
					duration: 800, 
					complete: function(){
						current_fs.hide();
						animating = false;
					}, 
					//this comes from the custom easing plugin
					easing: 'easeInOutBack'
				});
			});

			$(".submit").click(function(){
				return false;
			});

	}
]});
