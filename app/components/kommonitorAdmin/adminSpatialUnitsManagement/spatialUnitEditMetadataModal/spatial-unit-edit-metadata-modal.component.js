angular.module('spatialUnitEditMetadataModal').component('spatialUnitEditMetadataModal', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$timeout', 
		'kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService',
		function SpatialUnitEditMetadataModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $timeout, 
			kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentSpatialUnitDataset;

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
		$('#spatialUnitEditMetadataLastUpdateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

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
			"allowedRoles": ['roleId'],
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
		$scope.metadata.sridEPSG = undefined;
		$scope.metadata.datasource = undefined;
		$scope.metadata.databasis = undefined;
		$scope.metadata.contact = undefined;
		$scope.metadata.lastUpdate = undefined;
		$scope.metadata.description = undefined;

		$scope.roleManagementTableOptions = undefined;

		$scope.nextLowerHierarchySpatialUnit = undefined;
		$scope.nextUpperHierarchySpatialUnit = undefined;
		$scope.hierarchyInvalid = false;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditSpatialUnitMetadata", function (event, spatialUnitDataset) {

			$scope.currentSpatialUnitDataset = spatialUnitDataset;

			$scope.resetSpatialUnitEditMetadataForm();

			kommonitorMultiStepFormHelperService.registerClickHandler();

		});

		$scope.$on("availableRolesUpdate", function (event) {
			refreshRoles();
		});

		function refreshRoles() {
			let allowedRoles = $scope.currentSpatialUnitDataset ? $scope.currentSpatialUnitDataset.allowedRoles : [];
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, allowedRoles, true);
		}

		$scope.resetSpatialUnitEditMetadataForm = function(){

			$scope.spatialUnitLevel = $scope.currentSpatialUnitDataset.spatialUnitLevel;
			$scope.spatialUnitLevelInvalid = false;

			$scope.metadata = {};
			$scope.metadata.note = $scope.currentSpatialUnitDataset.metadata.note;
			$scope.metadata.literature = $scope.currentSpatialUnitDataset.metadata.literature;
			$scope.metadata.sridEPSG = 4326;
			$scope.metadata.datasource = $scope.currentSpatialUnitDataset.metadata.datasource;
			$scope.metadata.databasis = $scope.currentSpatialUnitDataset.metadata.databasis;
			$scope.metadata.contact = $scope.currentSpatialUnitDataset.metadata.contact;
			$scope.metadata.description = $scope.currentSpatialUnitDataset.metadata.description;

			let allowedRoles = $scope.currentSpatialUnitDataset ? $scope.currentSpatialUnitDataset.allowedRoles : [];
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, allowedRoles, true);

			$scope.metadata.lastUpdate = $scope.currentSpatialUnitDataset.metadata.lastUpdate;
			// $('#spatialUnitEditMetadataLastUpdateDatepicker').data({date: $scope.currentSpatialUnitDataset.metadata.lastUpdate});
			$('#spatialUnitEditMetadataLastUpdateDatepicker').datepicker('setDate', $scope.currentSpatialUnitDataset.metadata.lastUpdate);

			kommonitorDataExchangeService.updateIntervalOptions.forEach(function(option){
				if(option.apiName === $scope.currentSpatialUnitDataset.metadata.updateInterval){
					$scope.metadata.updateInterval = option;
				}
			});

			for(var i=0; i<kommonitorDataExchangeService.availableSpatialUnits.length; i++){
				var spatialUnit = kommonitorDataExchangeService.availableSpatialUnits[i];
				if (spatialUnit.spatialUnitLevel === $scope.currentSpatialUnitDataset.nextLowerHierarchyLevel){
					$scope.nextLowerHierarchySpatialUnit = spatialUnit;
				}
				if (spatialUnit.spatialUnitLevel === $scope.currentSpatialUnitDataset.nextUpperHierarchyLevel){
					$scope.nextUpperHierarchySpatialUnit = spatialUnit;
				}
			}
			$scope.hierarchyInvalid = false;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#spatialUnitEditMetadataSuccessAlert").hide();
			$("#spatialUnitEditMetadataErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();	
			}, 250);
		};

		$scope.checkSpatialUnitName = function(){
			$scope.spatialUnitLevelInvalid = false;
			kommonitorDataExchangeService.availableSpatialUnits.forEach(function(spatialUnit){
				if (spatialUnit.spatialUnitLevel === $scope.spatialUnitLevel && spatialUnit.spatialUnitId != $scope.currentSpatialUnitDataset.spatialUnitId){
					$scope.spatialUnitLevelInvalid = true;
					return;
				}
			});
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

		$scope.editSpatialUnitMetadata = function(){

			let spatialUnitName_old = $scope.currentSpatialUnitDataset.spatialUnitLevel;
			let spatialUnitName_new = $scope.spatialUnitLevel;

			var patchBody =
			{
				"datasetName": $scope.spatialUnitLevel,
				"metadata": {
					"note": $scope.metadata.note,
					"literature": $scope.metadata.literature,
					"updateInterval": $scope.metadata.updateInterval.apiName,
					"sridEPSG": $scope.metadata.sridEPSG,
					"datasource": $scope.metadata.datasource,
					"contact": $scope.metadata.contact,
					"lastUpdate": $scope.metadata.lastUpdate,
					"description": $scope.metadata.description,
					"databasis": $scope.metadata.databasis,
					"sridEPSG": 4326
				},
				"allowedRoles": [],
				"nextLowerHierarchyLevel": $scope.nextLowerHierarchySpatialUnit ? $scope.nextLowerHierarchySpatialUnit.spatialUnitLevel : null,
				"nextUpperHierarchyLevel": $scope.nextUpperHierarchySpatialUnit ? $scope.nextUpperHierarchySpatialUnit.spatialUnitLevel : null
			};

			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				patchBody.allowedRoles.push(roleId);
			}

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units/" + $scope.currentSpatialUnitDataset.spatialUnitId,
				method: "PATCH",
				data: patchBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentSpatialUnitDataset.spatialUnitLevel;

					$rootScope.$broadcast("refreshSpatialUnitOverviewTable");
					// if the name has changed, then indicator metadata must be fetched as well
					if (spatialUnitName_old != spatialUnitName_new){
						$rootScope.$broadcast("refreshIndicatorOverviewTable");
					}					
					$("#spatialUnitEditMetadataSuccessAlert").show();
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

					$("#spatialUnitEditMetadataErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

					// setTimeout(function() {
					// 		$("#spatialUnitEditMetadataSuccessAlert").hide();
					// }, 3000);
			});
		};

		$scope.onImportSpatialUnitEditMetadata = function(){

			$scope.spatialUnitMetadataImportError = "";

			$("#spatialUnitEditMetadataImportFile").files = [];

			// trigger file chooser
			$("#spatialUnitEditMetadataImportFile").click();

		};

		$(document).on("change", "#spatialUnitEditMetadataImportFile" ,function(){

			console.log("Importing SpatialUnit metadata for Edit SpatialUnit Form");

			// get the file
			var file = document.getElementById('spatialUnitEditMetadataImportFile').files[0];
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
					document.getElementById("spatialUnitsEditMetadataPre").innerHTML = $scope.spatialUnitMetadataStructure_pretty;
					$("#spatialUnitEditMetadataImportErrorAlert").show();

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
				$scope.spatialUnitMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster &uuml;berein.";
				document.getElementById("spatialUnitsEditMetadataPre").innerHTML = $scope.spatialUnitMetadataStructure_pretty;
				$("#spatialUnitEditMetadataImportErrorAlert").show();

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
				$('#spatialUnitEditLastUpdateDatepicker').datepicker('setDate', $scope.metadata.lastUpdate);

				$scope.metadata.description = $scope.metadataImportSettings.metadata.description;
				$scope.metadata.databasis = $scope.metadataImportSettings.metadata.databasis;

				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.metadataImportSettings.allowedRoles, true);

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

				$scope.$digest();
		}

		$scope.onExportSpatialUnitEditMetadataTemplate = function(){

			var metadataJSON = JSON.stringify($scope.spatialUnitMetadataStructure);

			var fileName = "Raumeinheit_Metadaten_Vorlage_Export.json";

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

		$scope.onExportSpatialUnitEditMetadata = function(){
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

			metadataExport.allowedRoles = [];
			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				metadataExport.allowedRoles.push(roleId);
			}

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
				$("#spatialUnitEditMetadataSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#spatialUnitEditMetadataErrorAlert").hide();
			};

	}
]});
