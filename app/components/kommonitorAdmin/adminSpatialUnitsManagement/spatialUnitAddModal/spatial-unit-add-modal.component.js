angular.module('spatialUnitAddModal').component('spatialUnitAddModal', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitAddModal/spatial-unit-add-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', 
		'$timeout', '$http', '__env', 'kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService',
		function SpatialUnitAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, 
			$scope, $rootScope, $timeout, $http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService) {

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
		
		$scope.outlineColor = "#000000";
		$scope.outlineWidth = 3;

		// initialize colorPickers
		$('#outlineColorPicker').colorpicker({"color": $scope.outlineColor});

		$scope.selectedOutlineDashArrayObject = kommonitorDataExchangeService.availableLoiDashArrayObjects[0];

		// initialize loiDashArray dropdown
		setTimeout(function(){
			for(var i=0; i<kommonitorDataExchangeService.availableLoiDashArrayObjects.length; i++){
				$("#outlineDashArrayDropdownItem-" + i).html(kommonitorDataExchangeService.availableLoiDashArrayObjects[i].svgString);
			}

			$("#outlineDashArrayDropdownButton_addSpatialUnit").html($scope.selectedOutlineDashArrayObject.svgString);
		},1000);

		$scope.onChangeOutlineDashArray = function(outlineDashArrayObject){
			$scope.selectedOutlineDashArrayObject = outlineDashArrayObject;

			$("#outlineDashArrayDropdownButton_addSpatialUnit").html(outlineDashArrayObject.svgString);
		};

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
			"permissions": ['roleId'],
			"nextLowerHierarchyLevel": "Name of lower hierarchy level",
			"spatialUnitLevel": "Name of spatial unit dataset",
			"nextUpperHierarchyLevel": "Name of upper hierarchy level"
		};

		$scope.spatialUnitMetadataStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON($scope.spatialUnitMetadataStructure);
		$scope.spatialUnitMappingConfigStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON(kommonitorImporterHelperService.mappingConfigStructure);

		$scope.metadataImportSettings;
		$scope.spatialUnitMetadataImportError;
		$scope.spatialUnitMetadataImportErrorAlert;
		$scope.spatialUnitMappingConfigImportError;

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

		$scope.ownerOrganization = undefined;
		$scope.ownerOrgFilter = undefined;
		$scope.isPublic = false;
    $scope.resourcesCreatorRights = [];

		$scope.onChangeOwner = function(orgUnitId) {	
			$scope.ownerOrganization = orgUnitId;		

			refreshRoles(orgUnitId);

			if(orgUnitId)
				$('#spatialUnitRoleForm').css('display','block');

		}

		$scope.onChangeIsPublic = function(isPublic){
			$scope.isPublic = isPublic;
		}

		$scope.roleManagementTableOptions = undefined;	

		$scope.$on("availableRolesUpdate", function (event) {
			refreshRoles();
		});

		// make sure that initial fetching of availableRoles has happened
		$scope.$on("initialMetadataLoadingCompleted", function (event) {
			$('#spatialUnitRoleForm').css('display','none');

      $scope.prepareCreatorList();
      
			refreshRoles();
			setTimeout(() => {
				$scope.$digest();	
			}, 250);
		});
    
    $scope.prepareCreatorList = function() {

      if(kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.length>0) {

        let creatorRights = [];
        kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.forEach(roles => {
          
          let key = roles.split('.')[0];
          let role = roles.split('.')[1];

          if((role=='unit-resources-creator' || role=='client-resources-creator') && !$scope.resourcesCreatorRights.includes(key)) {
            creatorRights.push(key);
          }
        });

        $scope.resourcesCreatorRights = kommonitorDataExchangeService.accessControl.filter(elem => creatorRights.includes(elem.name));
      }
    }
		
		function refreshRoles(orgUnitId) {			

			let permissionIds_ownerUnit = orgUnitId ? kommonitorDataExchangeService.getAccessControlById(orgUnitId).permissions.filter(permission => permission.permissionLevel == "viewer" || permission.permissionLevel == "editor").map(permission => permission.permissionId) : []; 
			
			// set datasetOwner to disable checkboxes for owned datasets in permissions-table
			kommonitorDataExchangeService.accessControl.forEach(item => {
				if(item.organizationalUnitId==orgUnitId)
					item.datasetOwner = true;
			});
			
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitAddRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, permissionIds_ownerUnit, true);	
		}

		$scope.nextLowerHierarchySpatialUnit = undefined;
		$scope.nextUpperHierarchySpatialUnit = undefined;
		$scope.hierarchyInvalid = false;

		$scope.periodOfValidity = {};
		$scope.periodOfValidity.startDate = undefined;
		$scope.periodOfValidity.endDate = undefined;
		$scope.periodOfValidityInvalid = false;

		$scope.converter = undefined;
		$scope.schema = undefined;
		$scope.mimeType = undefined;
		$scope.datasourceType = undefined;
		$scope.spatialUnitDataSourceIdProperty = undefined;
		$scope.spatialUnitDataSourceNameProperty = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;
		$scope.importerErrors = undefined;

        $scope.availableDatasourceTypes = [];

		$scope.converterDefinition = undefined;
		$scope.datasourceTypeDefinition = undefined;
		$scope.propertyMappingDefinition = undefined;
		$scope.postBody_spatialUnits = undefined;

		$scope.attributeMapping_sourceAttributeName = undefined;
			$scope.attributeMapping_destinationAttributeName = undefined;
			$scope.attributeMapping_data = undefined;
			$scope.attributeMapping_attributeType = kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
			$scope.attributeMappings_adminView = [];
			$scope.keepAttributes = true;
			$scope.keepMissingValues = true;

		$scope.validityEndDate_perFeature = undefined;
		$scope.validityStartDate_perFeature = undefined;


		$scope.resetSpatialUnitAddForm = function(){
			$scope.importerErrors = undefined;
			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

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

			$scope.ownerOrganization = undefined;
			$scope.ownerOrgFilter = undefined;
			$scope.isPublic = false;

			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitAddRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, [], true);	

			$scope.nextLowerHierarchySpatialUnit = undefined;
			$scope.nextUpperHierarchySpatialUnit = undefined;
			$scope.hierarchyInvalid = false;

			$scope.periodOfValidity = {};
			$scope.periodOfValidity.startDate = undefined;
			$scope.periodOfValidity.endDate = undefined;
			$scope.periodOfValidityInvalid = false;

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
			$scope.postBody_spatialUnits = undefined;

			$scope.attributeMapping_sourceAttributeName = undefined;
			$scope.attributeMapping_destinationAttributeName = undefined;
			$scope.attributeMapping_data = undefined;
			$scope.attributeMapping_attributeType = kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
			$scope.attributeMappings_adminView = [];
			$scope.keepAttributes = true;
			$scope.keepMissingValues = true;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;

			$scope.isOutlineLayer = false;
			$scope.outlineColor = "#000000";
			$scope.outlineWidth = 3;

			$scope.selectedOutlineDashArrayObject = kommonitorDataExchangeService.availableLoiDashArrayObjects[0];

            $scope.onChangeConverter();
            $scope.onChangeDatasourceType();

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

        $scope.onChangeDatasourceType = function(){
            if ($scope.datasourceType && $scope.datasourceType.type == "OGCAPI_FEATURES") {
                $scope.availableSpatialUnits = [ ...kommonitorDataExchangeService.availableSpatialUnits_map.values() ]
                // console.log($scope.availableSpatialUnits)
            }
        };

        $scope.onChangeConverter();
        $scope.onChangeDatasourceType();

		$scope.onChangeMimeType = function(mimeType){
			$scope.mimeType = mimeType;
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

			return kommonitorImporterHelperService.buildConverterDefinition($scope.converter, "converterParameter_spatialUnitAdd_", $scope.schema, $scope.mimeType);			
		};

		$scope.buildDatasourceTypeDefinition = async function(){
			try {
				return await kommonitorImporterHelperService.buildDatasourceTypeDefinition($scope.datasourceType, 'datasourceTypeParameter_spatialUnitAdd_', 'spatialUnitDataSourceInput');			
			} catch (error) {
				if(error.data){							
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else{
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#spatialUnitAddErrorAlert").show();
				$scope.loadingData = false;
				setTimeout(() => {
					$scope.$digest();
				}, 250);
				return null;
			}			
		};

		$scope.buildPropertyMappingDefinition = function(){
			// arsion from is undefined currently
			return kommonitorImporterHelperService.buildPropertyMapping_spatialResource($scope.spatialUnitDataSourceNameProperty, $scope.spatialUnitDataSourceIdProperty, $scope.validityStartDate_perFeature, $scope.validityEndDate_perFeature, undefined, $scope.keepAttributes, $scope.keepMissingValues, $scope.attributeMappings_adminView);
		};

		$scope.buildPostBody_spatialUnits = function(){
			var postBody =
			{
				"geoJsonString": "", // will be set by importer
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
				"permissions": [],
				"nextLowerHierarchyLevel": $scope.nextLowerHierarchySpatialUnit ? $scope.nextLowerHierarchySpatialUnit.spatialUnitLevel : undefined,
				"spatialUnitLevel": $scope.spatialUnitLevel,
				"periodOfValidity": {
					"endDate": $scope.periodOfValidity.endDate,
					"startDate": $scope.periodOfValidity.startDate
				},
				"nextUpperHierarchyLevel": $scope.nextUpperHierarchySpatialUnit ? $scope.nextUpperHierarchySpatialUnit.spatialUnitLevel : undefined,
				"isOutlineLayer": $scope.isOutlineLayer,
				"outlineColor": $scope.outlineColor,
				"outlineWidth": $scope.outlineWidth,
				"outlineDashArrayString": $scope.selectedOutlineDashArrayObject.dashArrayValue,
				"ownerId": $scope.ownerOrganization,
				"isPublic": $scope.isPublic
			};

			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				postBody.permissions.push(roleId);
			}

			return postBody;
		};

			$scope.addSpatialUnit = async function () {

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

					$("#spatialUnitAddForm").validator("update");
					$("#spatialUnitAddForm").validator("validate");
					return;
				}
				else {


					// TODO verify input

					// TODO Create and perform POST Request with loading screen

					var newSpatialUnitResponse_dryRun = undefined;
					try {
						newSpatialUnitResponse_dryRun = await kommonitorImporterHelperService.registerNewSpatialUnit($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.postBody_spatialUnits, true);

						if(! kommonitorImporterHelperService.importerResponseContainsErrors(newSpatialUnitResponse_dryRun)){
							// all good, really execute the request to import data against data management API
							var newSpatialUnitResponse = await kommonitorImporterHelperService.registerNewSpatialUnit($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.postBody_spatialUnits, false);

							$rootScope.$broadcast("refreshSpatialUnitOverviewTable", "add", kommonitorImporterHelperService.getIdFromImporterResponse(newSpatialUnitResponse));

							// refresh all admin dashboard diagrams due to modified metadata
							$timeout(function(){
								$rootScope.$broadcast("refreshAdminDashboardDiagrams");
							}, 500);
							

							$scope.successMessagePart = $scope.postBody_spatialUnits.spatialUnitLevel;
							$scope.importedFeatures = kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(newSpatialUnitResponse);

							$("#spatialUnitAddSucessAlert").show();
							$scope.loadingData = false;

							setTimeout(() => {
								$scope.$digest();
							}, 250);
						}
						else{
							// errors ocurred
							// show them 
							$scope.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(newSpatialUnitResponse_dryRun);

							$("#spatialUnitAddErrorAlert").show();
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

						if(newSpatialUnitResponse_dryRun){
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(newSpatialUnitResponse_dryRun);
						}

						$("#spatialUnitAddErrorAlert").show();
						$scope.loadingData = false;

						setTimeout(() => {
							$scope.$digest();
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
					console.error(error);
					console.error("Uploaded Metadata File cannot be parsed.");
					$scope.spatialUnitMetadataImportError = "Uploaded Metadata File cannot be parsed correctly";
					document.getElementById("spatialUnitsAddMetadataPre").innerHTML = $scope.spatialUnitMetadataStructure_pretty;
					$("#spatialUnitMetadataImportErrorAlert").show();

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
				document.getElementById("spatialUnitsAddMetadataPre").innerHTML = $scope.spatialUnitMetadataStructure_pretty;
				$("#spatialUnitMetadataImportErrorAlert").show();

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
				$('#spatialUnitAddLastUpdateDatepicker').datepicker('setDate', $scope.metadata.lastUpdate);

				$scope.metadata.description = $scope.metadataImportSettings.metadata.description;
				$scope.metadata.databasis = $scope.metadataImportSettings.metadata.databasis;

				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitAddRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.metadataImportSettings.permissions, true);	

				for(var i=0; i<kommonitorDataExchangeService.availableSpatialUnits.length; i++){
					var spatialUnit = kommonitorDataExchangeService.availableSpatialUnits[i];
					if (spatialUnit.spatialUnitLevel === $scope.metadataImportSettings.nextLowerHierarchyLevel){
						$scope.nextLowerHierarchySpatialUnit = spatialUnit;
					}
					if (spatialUnit.spatialUnitLevel === $scope.metadataImportSettings.nextUpperHierarchyLevel){
						$scope.nextUpperHierarchySpatialUnit = spatialUnit;
					}
				}

				$scope.isOutlineLayer = $scope.metadataImportSettings.isOutlineLayer;
				$scope.outlineColor = $scope.metadataImportSettings.outlineColor;
				$scope.outlineWidth = $scope.metadataImportSettings.outlineWidth;
				kommonitorDataExchangeService.availableLoiDashArrayObjects.forEach(function(option){
					if(option.dashArrayValue === $scope.metadataImportSettings.outlineDashArrayString){
						$scope.selectedOutlineDashArrayObject = option;
						$scope.onChangeOutlineDashArray($scope.selectedOutlineDashArrayObject);
					}
				});

				$scope.spatialUnitLevel = $scope.metadataImportSettings.spatialUnitLevel;

				$scope.ownerOrganization = $scope.metadataImportSettings.ownerId;

				if($scope.metadataImportSettings.ownerId)
					$('#spatialUnitRoleForm').css('display','block');

				$scope.isPublic = $scope.metadataImportSettings.isPublic;

				$scope.$digest();
		};

		$scope.onExportSpatialUnitAddMetadataTemplate = function(){

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

			metadataExport.permissions = [];
			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				metadataExport.permissions.push(roleId);
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

			metadataExport["isOutlineLayer"] = $scope.isOutlineLayer;
			metadataExport["outlineDashArrayString"] = $scope.selectedOutlineDashArrayObject.dashArrayValue;
			metadataExport["outlineColor"] = $scope.outlineColor;			
			metadataExport["outlineWidth"] = $scope.outlineWidth;

			metadataExport.ownerId = $scope.ownerOrganization;
			metadataExport.isPublic = $scope.isPublic;

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

		$scope.onImportSpatialUnitAddMappingConfig = function(){

			$scope.spatialUnitMappingConfigImportError = "";

			$("#spatialUnitMappingConfigAddImportFile").files = [];

			// trigger file chooser
			$("#spatialUnitMappingConfigAddImportFile").click();

		};

		$(document).on("change", "#spatialUnitMappingConfigAddImportFile" ,function(){

			console.log("Importing Importer Mapping Config for Add SpatialUnit Form");

			// get the file
			var file = document.getElementById('spatialUnitMappingConfigAddImportFile').files[0];
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
					document.getElementById("spatialUnitsAddMappingConfigPre").innerHTML = $scope.spatialUnitMappingConfigStructure_pretty;
					$("#spatialUnitMappingConfigImportErrorAlert").show();

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
				document.getElementById("spatialUnitsAddMappingConfigPre").innerHTML = $scope.spatialUnitMappingConfigStructure_pretty;
				$("#spatialUnitMappingConfigImportErrorAlert").show();

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
                    $("#converterParameter_spatialUnitAdd_" + convParameter.name).val(convParameter.value);
                }
            }

            // datasourceTypes parameters
            if ($scope.datasourceType){
                for (var dsParameter of $scope.mappingConfigImportSettings.dataSource.parameters) {
                    if (dsParameter.name === "bbox") {
                        if ($("#datasourceTypeParameter_georesourceAdd_bboxType").val() == "ref") {
                            $scope.bboxType = "ref";
                            $("#datasourceTypeParameter_georesourceAdd_bboxRef").val(dsParameter.value)
                        } else {
                            $scope.bboxType = "literal";
                            var bbox = dsParameter.value.split(',');
                            $("#datasourceTypeParameter_georesourceAdd_bbox_minx").val(bbox[0])
                            $("#datasourceTypeParameter_georesourceAdd_bbox_miny").val(bbox[1])
                            $("#datasourceTypeParameter_georesourceAdd_bbox_maxx").val(bbox[2])
                            $("#datasourceTypeParameter_georesourceAdd_bbox_maxy").val(bbox[3])
                        }
                    } else {
                        $("#datasourceTypeParameter_georesourceAdd_" + dsParameter.name).val(dsParameter.value);
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
                    $("#spatialUnitAddDatepickerStart").datepicker('setDate', $scope.periodOfValidity.startDate);
                }
                if ($scope.periodOfValidity.endDate){
                    $("#spatialUnitAddDatepickerEnd").datepicker('setDate', $scope.periodOfValidity.endDate);
                }
            }

            $scope.$digest();
		};

		$scope.onExportSpatialUnitAddMappingConfig = async function(){
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
				$("#spatialUnitAddSucessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#spatialUnitAddErrorAlert").hide();
			};

			$scope.hideMetadataErrorAlert = function(){
				$("#spatialUnitMetadataImportErrorAlert").hide();
			};

			$scope.hideMappingConfigErrorAlert = function(){
				$("#spatialUnitMappingConfigImportErrorAlert").hide();
			};


			kommonitorMultiStepFormHelperService.registerClickHandler("spatialUnitAddForm");			

	}
]});
