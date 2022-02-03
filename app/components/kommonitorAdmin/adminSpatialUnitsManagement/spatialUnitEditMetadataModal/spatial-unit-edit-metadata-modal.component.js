angular.module('spatialUnitEditMetadataModal').component('spatialUnitEditMetadataModal', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$timeout',function SpatialUnitEditMetadataModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $timeout) {

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

		$scope.allowedRoleNames = {selectedItems: []};
		$scope.duallist = {duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, null, "roleName")};			


		$scope.nextLowerHierarchySpatialUnit = undefined;
		$scope.nextUpperHierarchySpatialUnit = undefined;
		$scope.hierarchyInvalid = false;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditSpatialUnitMetadata", function (event, spatialUnitDataset) {

			$scope.currentSpatialUnitDataset = spatialUnitDataset;

			$scope.resetSpatialUnitEditMetadataForm();

		});

		$scope.$on("availableRolesUpdate", function (event) {
			refreshRoles();
		});

		function refreshRoles() {
			$scope.allowedRoleNames = { selectedItems: [] };
			$scope.duallist = { duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, null, "roleName") };
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

			var selectedRolesMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleIds($scope.currentSpatialUnitDataset.allowedRoles);			
			$scope.duallist = {duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, selectedRolesMetadata, "roleName")};			
			$scope.allowedRoleNames = {selectedItems: $scope.duallist.duallistRoleOptions.selectedItems};

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
				if (spatialUnit.spatialUnitLevel === $scope.spatialUnitLevel){
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

			var patchBody =
			{
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

			for (const roleDuallistItem of $scope.allowedRoleNames.selectedItems) {
				var roleMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleName(roleDuallistItem.name);
				patchBody.allowedRoles.push(roleMetadata.roleId);
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

					$rootScope.$broadcast("refreshSpatialUnitOverviewTable", "edit", $scope.currentSpatialUnitDataset);
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

				var selectedRolesMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleIds($scope.metadataImportSettings.allowedRoles);			
				$scope.duallist = {duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, selectedRolesMetadata, "roleName")};			
				$scope.allowedRoleNames = {selectedItems: $scope.duallist.duallistRoleOptions.selectedItems};

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
			for (const roleDuallistItem of $scope.allowedRoleNames.selectedItems) {
				var roleMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleName(roleDuallistItem.name);
				metadataExport.allowedRoles.push(roleMetadata.roleId);
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

			$timeout(function(){
				$(".next_editSpatialUnit").click(function(){
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
	
				$(".previous_editSpatialUnit").click(function(){
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
				
			}, 500);

	}
]});
