angular.module('georesourceAddModal').component('georesourceAddModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceAddModal/georesource-add-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '$timeout', 
		'__env', 'kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService',
		function GeoresourceAddModalAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, $scope, $rootScope, 
			$http, $timeout, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService) {

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
				"permissions": [
					"permissions",
					"permissions"
				],
				"datasetName": "datasetName",
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
				"loiWidth": "loiWidth",
				"aoiColor": "aoiColor"
			}
		*/

		//Date picker
    $('#georesourceAddDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#georesourceAddDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#georesourceAddLastUpdateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$scope.georesourceMetadataStructure = {
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
			"datasetName": "Name of georesource dataset",
			"isPOI": "boolean parameter for point of interest dataset - only one of isPOI, isLOI, isAOI can be true",
			"isLOI": "boolean parameter for lines of interest dataset - only one of isPOI, isLOI, isAOI can be true",
			"isAOI": "boolean parameter for area of interest dataset - only one of isPOI, isLOI, isAOI can be true",
			"poiSymbolBootstrap3Name": "glyphicon name of bootstrap 3 symbol to use for a POI resource",
			"poiSymbolColor": "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
			"loiDashArrayString": "dash array string value - e.g. 20 20",
			"poiMarkerColor": "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
			"loiColor": "color for lines of interest dataset",
			"loiWidth": "width for lines of interest dataset",
			"aoiColor": "color for area of interest dataset"
		};

		$scope.georesourceMetadataStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON($scope.georesourceMetadataStructure);
		$scope.georesourceMappingConfigStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON(kommonitorImporterHelperService.mappingConfigStructure);


		$scope.metadataImportSettings;
		$scope.georesourceMetadataImportError;
		$scope.georesourceMetadataImportErrorAlert;
		$scope.georesourceMappingConfigImportError;

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
		
		$scope.ownerOrganization = undefined;
		$scope.isPublic = false;

		$scope.onChangeOwner = function(orgUnitId) {
			$scope.ownerOrganization = orgUnitId;

			refreshRoles(orgUnitId);

			if(orgUnitId)
				$('#georesourceRoleForm').css('display','block');
		}

		$scope.onChangeIsPublic = function(isPublic){
			$scope.isPublic = isPublic;
		}
		
		$scope.$on("availableRolesUpdate", function (event) {
			refreshRoles();
		});

		// make sure that initial fetching of availableRoles has happened
		$scope.$on("initialMetadataLoadingCompleted", function (event) {

			$('#georesourceRoleForm').css('display','none');

			refreshRoles();

			setTimeout(() => {
				$scope.$digest();	
			}, 250);
		});

		function refreshRoles(orgUnitId) {				
			let permissionIds_ownerUnit = orgUnitId ? kommonitorDataExchangeService.getAccessControlById(orgUnitId).permissions.filter(permission => permission.permissionLevel == "viewer" || permission.permissionLevel == "editor").map(permission => permission.permissionId) : []; 
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('georesourceAddRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, permissionIds_ownerUnit, true);
		}

		$scope.georesourceTopic_mainTopic = undefined;
		$scope.georesourceTopic_subTopic = undefined;
		$scope.georesourceTopic_subsubTopic = undefined;
		$scope.georesourceTopic_subsubsubTopic = undefined;

		$scope.georesourceType = "poi";
		$scope.isPOI = true;
		$scope.isLOI = false;
		$scope.isAOI = false;
		$scope.selectedPoiMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[0];
		$scope.selectedPoiSymbolColor = kommonitorDataExchangeService.availablePoiMarkerColors[1];
		$scope.selectedLoiDashArrayObject = kommonitorDataExchangeService.availableLoiDashArrayObjects[0];
		$scope.loiColor = "#bf3d2c";
		$scope.loiWidth = 3;
		$scope.aoiColor = "#bf3d2c";
		$scope.selectedPoiIconName = "home";

		$scope.periodOfValidity = {};
		$scope.periodOfValidity.startDate = undefined;
		$scope.periodOfValidity.endDate = undefined;
		$scope.periodOfValidityInvalid = false;

		$scope.geoJsonString = undefined;
		$scope.georesource_asGeoJson = undefined;

		$scope.georesourceDataSourceInputInvalidReason = undefined;
		$scope.georesourceDataSourceInputInvalid = false;

		$scope.georesourceDataSourceIdProperty = undefined;
		$scope.georesourceDataSourceNameProperty = undefined;

		$scope.converter = undefined;
		$scope.schema = undefined;
		$scope.mimeType = undefined;
        $scope.datasourceType = undefined;
        $scope.georesourceDataSourceIdProperty = undefined;
        $scope.georesourceDataSourceNameProperty = undefined;

        $scope.availableDatasourceTypes = [];
        $scope.availableSpatialUnits = undefined;

        $scope.converterDefinition = undefined;
        $scope.datasourceTypeDefinition = undefined;
        $scope.propertyMappingDefinition = undefined;
        $scope.postBody_georesources = undefined;

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

		$scope.iconPickerOptions = {
			align: 'center', // Only in div tag
			arrowClass: 'btn-default',
			arrowPrevIconClass: 'fas fa-angle-left',
			arrowNextIconClass: 'fas fa-angle-right',
			cols: 10,
			footer: true,
			header: true,
			icon: 'glyphicon-' + $scope.selectedPoiIconName,
			iconset: 'glyphicon',
			labelHeader: '{0} von {1} Seiten',
			labelFooter: '{0} - {1} von {2} Icons',
			placement: 'bottom', // Only in button tag
			rows: 6,
			search: true,
			searchText: 'Stichwortsuche (Bootstrap Glyphicons)',
			selectedClass: 'btn-success',
			unselectedClass: ''
		};

		$('#poiSymbolPicker').iconpicker($scope.iconPickerOptions);

		$('#poiSymbolPicker').on('change', function(e) {
		    console.log(e.icon);
				// split up due to current data management request structure where we expect only the last name of Bootstrap 3.3.7 glyphicon name
				// i.e. "home" for "glyphicon-home"
				$scope.selectedPoiIconName = e.icon.substring(e.icon.indexOf('-')+1);
				console.log($scope.selectedPoiIconName);
		});

		$scope.loadingData = false;

		// initialize loiDashArray dropdown
		setTimeout(function(){
			for(var i=0; i<kommonitorDataExchangeService.availableLoiDashArrayObjects.length; i++){
				$("#loiDashArrayDropdownItem-" + i).html(kommonitorDataExchangeService.availableLoiDashArrayObjects[i].svgString);
			}

			$("#loiDashArrayDropdownButton_addGeoresource").html($scope.selectedLoiDashArrayObject.svgString);
		},1000);


		// initialize colorPickers
		$('#loiColorPicker').colorpicker();
		$('#aoiColorPicker').colorpicker();


		$scope.resetGeoresourceAddForm = function(){
			$scope.importerErrors = undefined;
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

			console.log("resetGeoresourceAddForm");
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('georesourceAddRoleManagementTable', null, kommonitorDataExchangeService.accessControl, null, true);

			$scope.georesourceTopic_mainTopic = undefined;
			$scope.georesourceTopic_subTopic = undefined;
			$scope.georesourceTopic_subsubTopic = undefined;
			$scope.georesourceTopic_subsubsubTopic = undefined;

			$scope.georesourceType = "poi";
			$scope.isPOI = true;
			$scope.isLOI = false;
			$scope.isAOI = false;
			$scope.selectedPoiMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[0];
			$scope.selectedPoiSymbolColor = kommonitorDataExchangeService.availablePoiMarkerColors[1];
			$scope.selectedLoiDashArrayObject = kommonitorDataExchangeService.availableLoiDashArrayObjects[0];
			$scope.loiColor = "#bf3d2c";
			$scope.loiWidth = 3;
			$scope.aoiColor = "#bf3d2c";
			$scope.selectedPoiIconName = "home";
			$("#poiSymbolPicker").val("").iconpicker('setIcon', 'glyphicon-' + $scope.selectedPoiIconName);

			$scope.ownerOrganization = undefined;
			$scope.isPublic = false;

			$scope.periodOfValidity = {};
			$scope.periodOfValidity.startDate = undefined;
			$scope.periodOfValidity.endDate = undefined;
			$scope.periodOfValidityInvalid = false;

			$scope.georesourceDataSourceInputInvalidReason = undefined;
			$scope.georesourceDataSourceInputInvalid = false;
	
			$scope.converter = undefined;
			$scope.schema = undefined;
			$scope.mimeType = undefined;
			$scope.datasourceType = undefined;
			$scope.georesourceDataSourceIdProperty = undefined;
			$scope.georesourceDataSourceNameProperty = undefined;

			$scope.availableDatasourceTypes = [];
			$scope.availableSpatialUnits = undefined;

			$scope.converterDefinition = undefined;
			$scope.datasourceTypeDefinition = undefined;
			$scope.propertyMappingDefinition = undefined;
			$scope.postBody_georesources = undefined;

			$scope.validityEndDate_perFeature = undefined;
			$scope.validityStartDate_perFeature = undefined;

			$scope.georesourceDataSourceIdProperty = undefined;
			$scope.georesourceDataSourceNameProperty = undefined;

			$scope.attributeMapping_sourceAttributeName = undefined;
			$scope.attributeMapping_destinationAttributeName = undefined;
			$scope.attributeMapping_data = undefined;
			$scope.attributeMapping_attributeType = kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
			$scope.attributeMappings_adminView = [];
			$scope.keepAttributes = true;
			$scope.keepMissingValues = true;

            $scope.onChangeConverter();
            $scope.onChangeDatasourceType();

			setTimeout(() => {
				$scope.$digest();	
			}, 250);
		};

		$scope.onChangeConverter = function(){
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

        $scope.onChangeDatasourceType = function(ds){
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

		$scope.onChangeGeoresourceType = function(){

			switch ($scope.georesourceType) {
				case "poi":
					$scope.isPOI = true;
					$scope.isLOI = false;
					$scope.isAOI = false;
					break;
				case "loi":
					$scope.isPOI = false;
					$scope.isLOI = true;
					$scope.isAOI = false;
					break;
				case "aoi":
					$scope.isPOI = false;
					$scope.isLOI = false;
					$scope.isAOI = true;
					break;
				default:
					$scope.isPOI = true;
					$scope.isLOI = false;
					$scope.isAOI = false;
					break;
			}
		};

		$scope.checkDatasetName = function(){
			$scope.datasetNameInvalid = false;
			kommonitorDataExchangeService.availableGeoresources.forEach(function(georesource){
				if (georesource.datasetName === $scope.datasetName){
					$scope.datasetNameInvalid = true;
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
			$scope.postBody_georesources = $scope.buildPostBody_georesources();

			if(!$scope.converterDefinition || !$scope.datasourceTypeDefinition || !$scope.propertyMappingDefinition || !$scope.postBody_georesources){
				return false;
			}

			return true;
		};

		$scope.buildConverterDefinition = function(){

			return kommonitorImporterHelperService.buildConverterDefinition($scope.converter, "converterParameter_georesourceAdd_", $scope.schema, $scope.mimeType);			
		};

		$scope.buildDatasourceTypeDefinition = async function(){
			try {
				return await kommonitorImporterHelperService.buildDatasourceTypeDefinition($scope.datasourceType, 'datasourceTypeParameter_georesourceAdd_', 'georesourceDataSourceInput_add');			
			} catch (error) {
				if(error.data){							
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else{
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#georesourceAddErrorAlert").show();
				$scope.loadingData = false;
				return null;
			}			
		};

		$scope.buildPropertyMappingDefinition = function(){
			// arsion from is undefined currently
			return kommonitorImporterHelperService.buildPropertyMapping_spatialResource($scope.georesourceDataSourceNameProperty, $scope.georesourceDataSourceIdProperty, $scope.validityStartDate_perFeature, $scope.validityEndDate_perFeature, undefined, $scope.keepAttributes, $scope.keepMissingValues, $scope.attributeMappings_adminView);
		};

		$scope.buildPostBody_georesources = function(){
			var postBody =
			{
				"geoJsonString": $scope.geoJsonString,
				"permissions": [],
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
				"datasetName": $scope.datasetName,
				"periodOfValidity": {
					"endDate": $scope.periodOfValidity.endDate,
					"startDate": $scope.periodOfValidity.startDate
				},
			  "isAOI": $scope.isAOI,
				"isLOI": $scope.isLOI,
				"isPOI": $scope.isPOI,
			  "topicReference": null,
			  "ownerId": $scope.ownerOrganization,
			  "isPublic": $scope.isPublic
			};

			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				postBody.permissions.push(roleId);
			}

			if($scope.isPOI){
				postBody["poiSymbolBootstrap3Name"] = $scope.selectedPoiIconName;
				postBody["poiSymbolColor"] = $scope.selectedPoiSymbolColor.colorName;
				postBody["poiMarkerColor"] = $scope.selectedPoiMarkerColor.colorName;

				postBody["loiDashArrayString"] = null;
				postBody["loiColor"] = null;
				postBody["loiWidth"] = 3;

				postBody["aoiColor"] = null;
			}
			else if($scope.isLOI){
				postBody["poiSymbolBootstrap3Name"] = null;
				postBody["poiSymbolColor"] = null;
				postBody["poiMarkerColor"] = null;

				postBody["loiDashArrayString"] = $scope.selectedLoiDashArrayObject.dashArrayValue;
				postBody["loiColor"] = $scope.loiColor;
				postBody["loiWidth"] = $scope.loiWidth;

				postBody["aoiColor"] = null;
			}
			else if($scope.isAOI){
				postBody["poiSymbolBootstrap3Name"] = null;
				postBody["poiSymbolColor"] = null;
				postBody["poiMarkerColor"] = null;

				postBody["loiDashArrayString"] = null;
				postBody["loiColor"] = null;
				postBody["loiWidth"] = 3;

				postBody["aoiColor"] = $scope.aoiColor;
			}

			// TOPIC REFERENCE
			if($scope.georesourceTopic_subsubsubTopic){
				postBody.topicReference = $scope.georesourceTopic_subsubsubTopic.topicId;
			}
			else if($scope.georesourceTopic_subsubTopic){
				postBody.topicReference = $scope.georesourceTopic_subsubTopic.topicId;
			}
			else if($scope.georesourceTopic_subTopic){
				postBody.topicReference = $scope.georesourceTopic_subTopic.topicId;
			}
			else if($scope.georesourceTopic_mainTopic){
				postBody.topicReference = $scope.georesourceTopic_mainTopic.topicId;
			}
			else {
				postBody.topicReference = "";
			}

			return postBody;
		};

		$scope.addGeoresource = async function(){

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

					$("#georesourceAddForm").validator("update");
					$("#georesourceAddForm").validator("validate");
					return;
				}
				else {
					// TODO verify input
					// TODO Create and perform POST Request with loading screen			

					var newGeoresourceResponse_dryRun = undefined;
					try {
						newGeoresourceResponse_dryRun = await kommonitorImporterHelperService.registerNewGeoresource($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.postBody_georesources, true);


						if(! kommonitorImporterHelperService.importerResponseContainsErrors(newGeoresourceResponse_dryRun)){
							// all good, really execute the request to import data against data management API
							var newGeoresourceResponse = await kommonitorImporterHelperService.registerNewGeoresource($scope.converterDefinition, $scope.datasourceTypeDefinition, $scope.propertyMappingDefinition, $scope.postBody_georesources, false);

							$rootScope.$broadcast("refreshGeoresourceOverviewTable", "add", kommonitorImporterHelperService.getIdFromImporterResponse(newGeoresourceResponse));

							// refresh all admin dashboard diagrams due to modified metadata
							$timeout(function(){
								$rootScope.$broadcast("refreshAdminDashboardDiagrams");
							}, 500);
							
		
							$scope.successMessagePart = $scope.postBody_georesources.datasetName;
							$scope.importedFeatures = kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(newGeoresourceResponse);
		
							$("#georesourceAddSuccessAlert").show();
		
							$scope.loadingData = false;
						}
						else{
							// errors ocurred
							// show them 
							$scope.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(newGeoresourceResponse_dryRun);

							$("#georesourceAddErrorAlert").show();
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

						if(newGeoresourceResponse_dryRun){
							$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(newGeoresourceResponse_dryRun);
						}						

						$("#georesourceAddErrorAlert").show();
						$scope.loadingData = false;

						setTimeout(() => {
							$scope.$digest();
						}, 250);
					}
				}

		};

		$scope.onImportGeoresourceAddMetadata = function(){

			$scope.georesourceMetadataImportError = "";

			$("#georesourceMetadataImportFile").files = [];

			// trigger file chooser
			$("#georesourceMetadataImportFile").click();

		};

		$(document).on("change", "#georesourceMetadataImportFile" ,function(){

			console.log("Importing Georesource metadata for Add Georesource Form");

			// get the file
			var file = document.getElementById('georesourceMetadataImportFile').files[0];
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
					$scope.georesourceMetadataImportError = "Uploaded Metadata File cannot be parsed correctly";
					document.getElementById("georesourcesAddMetadataPre").innerHTML = $scope.georesourceMetadataStructure_pretty;
					$("#georesourceMetadataImportErrorAlert").show();

					$scope.$digest();
				}

			};

			// Read in the image file as a data URL.
			fileReader.readAsText(file);
		};

		// hier
		$scope.parseFromMetadataFile = function(event){
			// $scope.geoJsonString = event.target.result;
			$scope.metadataImportSettings = JSON.parse(event.target.result);

			if(! $scope.metadataImportSettings.metadata){
				console.error("uploaded Metadata File cannot be parsed - wrong structure.");
				$scope.georesourceMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster &uuml;berein.";
				document.getElementById("georesourcesAddMetadataPre").innerHTML = $scope.georesourceMetadataStructure_pretty;
				$("#georesourceMetadataImportErrorAlert").show();

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
				$('#georesourceAddLastUpdateDatepicker').datepicker('setDate', $scope.metadata.lastUpdate);

				$scope.metadata.description = $scope.metadataImportSettings.metadata.description;
				$scope.metadata.databasis = $scope.metadataImportSettings.metadata.databasis;

				$scope.datasetName = $scope.metadataImportSettings.datasetName;

				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('georesourceAddRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.metadataImportSettings.permissions, true);

				// georesource specific properties

				$scope.isPOI = $scope.metadataImportSettings.isPOI;
				$scope.isLOI = $scope.metadataImportSettings.isLOI;
				$scope.isAOI = $scope.metadataImportSettings.isAOI;
				if($scope.metadataImportSettings.isPOI){
						$scope.georesourceType = "poi";
				}
				else if($scope.metadataImportSettings.isLOI){
						$scope.georesourceType = "loi";
				}
				else{
						$scope.georesourceType = "aoi";
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
						$scope.onChangeLoiDashArray($scope.selectedLoiDashArrayObject);
					}
				});
				$scope.loiColor = $scope.metadataImportSettings.loiColor;
				$scope.loiWidth = $scope.metadataImportSettings.loiWidth;
				$scope.aoiColor = $scope.metadataImportSettings.aoiColor;
				$scope.selectedPoiIconName = $scope.metadataImportSettings.poiSymbolBootstrap3Name;

				var topicHierarchy = kommonitorDataExchangeService.getTopicHierarchyForTopicId($scope.metadataImportSettings.topicReference);

				if(topicHierarchy && topicHierarchy[0]){
					$scope.georesourceTopic_mainTopic = topicHierarchy[0];
				}
				if(topicHierarchy && topicHierarchy[1]){
					$scope.georesourceTopic_subTopic = topicHierarchy[1];
				}
				if(topicHierarchy && topicHierarchy[2]){
					$scope.georesourceTopic_subsubTopic = topicHierarchy[2];
				}
				if(topicHierarchy && topicHierarchy[3]){
					$scope.georesourceTopic_subsubsubTopic = topicHierarchy[3];
				}

				$scope.ownerOrganization = $scope.metadataImportSettings.ownerId;

				if($scope.metadataImportSettings.ownerId)
					$('#georesourceRoleForm').css('display','block');

				$scope.isPublic = $scope.metadataImportSettings.isPublic;

				setTimeout(function(){
					$("#poiSymbolPicker").val("").iconpicker('setIcon', 'glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
					// $("#poiSymbolPicker i").css('glyphicon glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
					// $("#poiSymbolPicker input").css('glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
				}, 200);

				$scope.$digest();
		}

		$scope.onExportGeoresourceAddMetadataTemplate = function(){

			var metadataJSON = JSON.stringify($scope.georesourceMetadataStructure);

			var fileName = "Georessource_Metadaten_Vorlage_Export.json";

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

		$scope.onExportGeoresourceAddMetadata = function(){
			var metadataExport = $scope.georesourceMetadataStructure;

			metadataExport.metadata.note = $scope.metadata.note || "";
			metadataExport.metadata.literature = $scope.metadata.literature  || "";
			metadataExport.metadata.sridEPSG = $scope.metadata.sridEPSG || "";
			metadataExport.metadata.datasource = $scope.metadata.datasource || "";
			metadataExport.metadata.contact = $scope.metadata.contact || "";
			metadataExport.metadata.lastUpdate = $scope.metadata.lastUpdate || "";
			metadataExport.metadata.description = $scope.metadata.description || "";
			metadataExport.metadata.databasis = $scope.metadata.databasis || "";
			metadataExport.datasetName = $scope.datasetName || "";

			metadataExport.permissions = [];

			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				metadataExport.permissions.push(roleId);
			}

			if($scope.metadata.updateInterval){
					metadataExport.metadata.updateInterval = $scope.metadata.updateInterval.apiName;
			}

			var name = $scope.datasetName;

			// georesource specific properties
			metadataExport.isPOI = $scope.isPOI;
			metadataExport.isLOI = $scope.isLOI;
			metadataExport.isAOI = $scope.isAOI;

			if($scope.isPOI){
				metadataExport["poiSymbolBootstrap3Name"] = $scope.selectedPoiIconName;
				metadataExport["poiSymbolColor"] = $scope.selectedPoiSymbolColor.colorName;
				metadataExport["poiMarkerColor"] = $scope.selectedPoiMarkerColor.colorName;

				metadataExport["loiDashArrayString"] = "";
				metadataExport["loiColor"] = "";
				metadataExport["loiWidth"] = "";

				metadataExport["aoiColor"] = "";
			}
			else if($scope.isLOI){
				metadataExport["poiSymbolBootstrap3Name"] = "";
				metadataExport["poiSymbolColor"] = "";
				metadataExport["poiMarkerColor"] = "";

				metadataExport["loiDashArrayString"] = $scope.selectedLoiDashArrayObject.dashArrayValue;
				metadataExport["loiColor"] = $scope.loiColor;
				metadataExport["loiWidth"] = $scope.loiWidth;
				

				metadataExport["aoiColor"] = "";
			}
			else if($scope.isAOI){
				metadataExport["poiSymbolBootstrap3Name"] = "";
				metadataExport["poiSymbolColor"] = "";
				metadataExport["poiMarkerColor"] = "";

				metadataExport["loiDashArrayString"] = "";
				metadataExport["loiColor"] = "";
				metadataExport["loiWidth"] = "";

				metadataExport["aoiColor"] = $scope.aoiColor;
			}

			if($scope.georesourceTopic_subsubsubTopic){
				metadataExport.topicReference = $scope.georesourceTopic_subsubsubTopic.topicId;
			}
			else if($scope.georesourceTopic_subsubTopic){
				metadataExport.topicReference = $scope.georesourceTopic_subsubTopic.topicId;
			}
			else if($scope.georesourceTopic_subTopic){
				metadataExport.topicReference = $scope.georesourceTopic_subTopic.topicId;
			}
			else if($scope.georesourceTopic_mainTopic){
				metadataExport.topicReference = $scope.georesourceTopic_mainTopic.topicId;
			}
			else {
				metadataExport.topicReference = "";
			}

			metadataExport.ownerId = $scope.ownerOrganization;
			metadataExport.isPublic = $scope.isPublic;


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

		$scope.onChangeMarkerColor = function(markerColor){
			$scope.selectedPoiMarkerColor = markerColor;
		};

		$scope.onChangeSymbolColor = function(symbolColor){
			$scope.selectedPoiSymbolColor = symbolColor;
		};

		$scope.onChangeLoiDashArray = function(loiDashArrayObject){
			$scope.selectedLoiDashArrayObject = loiDashArrayObject;

			$("#loiDashArrayDropdownButton_addGeoresource").html(loiDashArrayObject.svgString);
		};

		$scope.onImportGeoresourceAddMappingConfig = function(){

			$scope.georesourceMappingConfigImportError = "";

			$("#georesourceMappingConfigAddImportFile").files = [];

			// trigger file chooser
			$("#georesourceMappingConfigAddImportFile").click();

		};

		$(document).on("change", "#georesourceMappingConfigAddImportFile" ,function(){

			console.log("Importing Importer Mapping Config for Add Georesource Form");

			// get the file
			var file = document.getElementById('georesourceMappingConfigAddImportFile').files[0];
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
					document.getElementById("georesourcesAddMappingConfigPre").innerHTML = $scope.georesourceMappingConfigStructure_pretty;
					$("#georesourceMappingConfigImportErrorAlert").show();

					$scope.$digest();
				}

			};

			// Read in the image file as a data URL.
			fileReader.readAsText(file);
		};

		$scope.parseFromMappingConfigFile = function(event){
			$scope.mappingConfigImportSettings = JSON.parse(event.target.result);

			if(! $scope.mappingConfigImportSettings.converter || ! $scope.mappingConfigImportSettings.dataSource || ! $scope.mappingConfigImportSettings.propertyMapping) {
				console.error("uploaded MappingConfig File cannot be parsed - wrong structure.");
				$scope.georesourceMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster &uuml;berein.";
				document.getElementById("georesourcesAddMappingConfigPre").innerHTML = $scope.georesourceMappingConfigStructure_pretty;
				$("#georesourceMappingConfigImportErrorAlert").show();

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
                    $("#converterParameter_georesourceAdd_" + convParameter.name).val(convParameter.value);
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
                    $("#georesourceAddDatepickerStart").datepicker('setDate', $scope.periodOfValidity.startDate);
                }
                if ($scope.periodOfValidity.endDate){
                    $("#georesourceAddDatepickerEnd").datepicker('setDate', $scope.periodOfValidity.endDate);
                }
            }

            $scope.$digest();
		};

		$scope.onExportGeoresourceAddMappingConfig = async function(){
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
            $("#georesourceAddSuccessAlert").hide();
        };

        $scope.hideErrorAlert = function(){
            $("#georesourceAddErrorAlert").hide();
        };

        $scope.hideMetadataErrorAlert = function(){
            $("#georesourceMetadataImportErrorAlert").hide();
        };

        $scope.hideMappingConfigErrorAlert = function(){
            $("#georesourceMappingConfigImportErrorAlert").hide();
        };

        kommonitorMultiStepFormHelperService.registerClickHandler("georesourceAddForm");

	}
]});
