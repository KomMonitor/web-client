angular.module('adminFilterAddModal').component('adminFilterAddModal', {
	templateUrl : "components/kommonitorAdmin/adminConfig/adminFilterConfig/adminFilterAddModal/admin-filter-add-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', 
		'$timeout', '$http', '__env', 'kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService',
		function AdminFilterAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, 
			$scope, $rootScope, $timeout, $http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

		$scope.loadingData = false;

		$scope.addIndicatorTableOptions = undefined;	
		$scope.addGeoresourceTableOptions = undefined;	
    $scope.selectedIndicatorIds = [];

		/* $scope.$on("availableRolesUpdate", function (event) {
			refreshRoles();
		});*/

    $scope.indicatorTopicsTree = [];
    $scope.selectedIndicatorTopicIds = [];

    $scope.georesourceTopicsTree = [];
    $scope.selectedGeoresourceTopicIds = [];

		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		var addClickListenerToEachCollapseTrigger = function(){
			setTimeout(function(){
				$('.list-group-item > .collapseTrigger').on('click', function() {
			    $('.glyphicon', this)
			      .toggleClass('glyphicon-chevron-right')
			      .toggleClass('glyphicon-chevron-down');

						// manage entries
						var clickedTopicId = $(this).attr('id');
            if(document.getElementById('subTopic-'+clickedTopicId).style.display=='none')
              document.getElementById('subTopic-'+clickedTopicId).style.display = 'block';
            else
              document.getElementById('subTopic-'+clickedTopicId).style.display = 'none';
			  });
			}, 500);
		};

		// make sure that initial fetching of availableRoles has happened
		$scope.$on("initialMetadataLoadingCompleted", function (event) {

      $scope.indicatorTopicsTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='indicator'),0);
      $scope.georesourceTopicsTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='georesource'),0);
			addClickListenerToEachCollapseTrigger();

			refreshIndicatorsTable();
      refreshGeoresourcesTable();
		}); 

    // georesource tree
    $scope.onSelectedGeoresourceItemsChange = function(id,selected) {

      if(selected===true) {
        if(!$scope.selectedGeoresourceTopicIds.includes(id))
          $scope.selectedGeoresourceTopicIds.push(id);
      } else
        $scope.selectedGeoresourceTopicIds = $scope.selectedGeoresourceTopicIds.filter(e => e!=id);

      searchGeoresourceItemRecursive($scope.georesourceTopicsTree, id, selected);
      console.log("geo", id, $scope.selectedGeoresourceTopicIds);
    }

    function searchGeoresourceItemRecursive(tree, id, selected) {

      tree.forEach(entry => {
        if(entry.topicId==id) {
          checkGeoresourceItemsRecursive(entry.subTopics, selected);
        } else 
          searchGeoresourceItemRecursive(entry.subTopics, id, selected);
      });
    }

    function checkGeoresourceItemsRecursive(tree, selected) {
      tree.forEach(entry => {

        if(selected===true) {
          document.getElementById('checkbox-'+entry.topicId).checked = true;
          document.getElementById('checkbox-'+entry.topicId).disabled = true;
        } else {
          document.getElementById('checkbox-'+entry.topicId).checked = false;
          document.getElementById('checkbox-'+entry.topicId).disabled = false;
        }
        
        // delete all downlevel items if they exists, just in case a level higher up has been checked afterwards  
        $scope.selectedGeoresourceTopicIds = $scope.selectedGeoresourceTopicIds.filter(e => e!=entry.topicId);

        if(entry.subTopics.length>0)
          checkGeoresourceItemsRecursive(entry.subTopics, selected);
      })
    }
    // end

    // indicator tree
    $scope.onSelectedIndicatorItemsChange = function(id,selected) {

      if(selected===true) {
        if(!$scope.selectedIndicatorTopicIds.includes(id))
          $scope.selectedIndicatorTopicIds.push(id);
      } else
        $scope.selectedIndicatorTopicIds = $scope.selectedIndicatorTopicIds.filter(e => e!=id);

      searchIndicatorItemRecursive($scope.indicatorTopicsTree, id, selected);
      console.log("indi", id, $scope.selectedIndicatorTopicIds);
    }

    function searchIndicatorItemRecursive(tree, id, selected) {

      tree.forEach(entry => {
        if(entry.topicId==id) {
          checkIndicatorItemsRecursive(entry.subTopics, selected);
        } else 
          searchIndicatorItemRecursive(entry.subTopics, id, selected);
      });
    }

    function checkIndicatorItemsRecursive(tree, selected) {
      tree.forEach(entry => {

        if(selected===true) {
          document.getElementById('checkbox-'+entry.topicId).checked = true;
          document.getElementById('checkbox-'+entry.topicId).disabled = true;
        } else {
          document.getElementById('checkbox-'+entry.topicId).checked = false;
          document.getElementById('checkbox-'+entry.topicId).disabled = false;
        }
        
        // delete all downlevel items if they exists, just in case a level higher up has been checked afterwards  
        $scope.selectedIndicatorTopicIds = $scope.selectedIndicatorTopicIds.filter(e => e!=entry.topicId);

        if(entry.subTopics.length>0)
          checkIndicatorItemsRecursive(entry.subTopics, selected);
      })
    }
    // end

    function prepTopicsTree(tree, level) {
      tree.forEach(entry => {
        entry.level = level;
        entry.selected = false;

        if(entry.subTopics.length>0) {
          let newLevel = level+1;
          entry.subTopics = prepTopicsTree(entry.subTopics, newLevel);
        }
      });

      return tree;
    }
		
    function refreshGeoresourcesTable() {

      let preppedGeoresourceData = [];
      kommonitorDataExchangeService.availableGeoresources.forEach((element,index) => {
        preppedGeoresourceData[index] = {
          id: element.georesourceId,
          name: element.datasetName,
          description: element.metadata.description,
          checked: false
        }
      });

			$scope.addGeoresourceTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterAddGeoresourcesTable', $scope.addGeoresourceTableOptions, preppedGeoresourceData, []);	
		}

		function refreshIndicatorsTable() {

      let preppedIndicatorData = [];
      kommonitorDataExchangeService.availableIndicators.forEach((element,index) => {
        preppedIndicatorData[index] = {
          id: element.indicatorId,
          name: element.indicatorName,
          description: element.metadata.description,
          checked: false
        }
      });

			$scope.addIndicatorTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterAddIndicatorsTable', $scope.addIndicatorTableOptions, preppedIndicatorData, []);	
		}

    $scope.test = function() {

      $scope.selectedIndicatorIds = kommonitorDataGridHelperService.getSelectedIds_singleSelectGrid($scope.addIndicatorTableOptions);
      console.log($scope.selectedIndicatorIds)
    }


	/* 	$scope.resetSpatialUnitAddForm = function(){
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

			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitAddRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds());	

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
		}; */
/* 

			$scope.addSpatialUnit = async function () {

				$timeout(function(){
					$scope.loadingData = true;
				});

				$scope.importerErrors = undefined;
				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;

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



 */

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


			kommonitorMultiStepFormHelperService.registerClickHandler("adminFilterAddForm");			

	}
]});
