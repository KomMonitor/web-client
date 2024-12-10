angular.module('adminFilterEditModal').component('adminFilterEditModal', {
	templateUrl : "components/kommonitorAdmin/adminConfig/adminFilterConfig/adminFilterEditModal/admin-filter-edit-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', 
		'$timeout', '$http', '__env', 'kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService', 'kommonitorConfigStorageService',
		function AdminFilterEditModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, 
			$scope, $rootScope, $timeout, $http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService, kommonitorConfigStorageService) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

		$scope.loadingData = false;

    $scope.filterName = undefined;

    $scope.selectedItem = undefined;

		$scope.editIndicatorTableOptions = undefined;	
		$scope.editGeoresourceTableOptions = undefined;	

    $scope.selectedIndicatorIds = [];
    $scope.selectedGeoresourceIds = [];

    $scope.preppedGeoresourceData = [];
    $scope.preppedIndicatorData = [];

    $scope.indicatorTopicsEditTree = [];
    $scope.selectedIndicatorTopicEditIds = [];

    $scope.georesourceTopicsEditTree = [];
    $scope.selectedGeoresourceTopicEditIds = [];

    $scope.showSelectedIndicatorsOnly = true;
    $scope.showSelectedGeoresourcesOnly = true;
    
    $scope.filterConfig = [];

		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		var addClickListenerToEachCollapseTrigger = function(){

			setTimeout(function(){
				$('.list-group-item > .editCollapseTrigger').on('click', function() {
			    $('.glyphicon', this)
			      .toggleClass('glyphicon-chevron-right')
			      .toggleClass('glyphicon-chevron-down');
						// manage entries
						var clickedTopicId = $(this).attr('id');
            if(document.getElementById('editSubTopic-'+clickedTopicId).style.display=='none')
              document.getElementById('editSubTopic-'+clickedTopicId).style.display = 'block';
            else
              document.getElementById('editSubTopic-'+clickedTopicId).style.display = 'none';
			  });
			}, 500);
		};

		// make sure that initial fetching of availableRoles has happened
		$scope.$on("initialMetadataLoadingCompleted", function (event) {

      $scope.indicatorTopicsEditTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='indicator'), 0, []);
      $scope.georesourceTopicsEditTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='georesource'), 0, []);
			addClickListenerToEachCollapseTrigger();
		}); 

    $scope.$on("onGlobalFilterEdit", async function (event, itemId) {

      $scope.selectedItem = itemId;

      // reset
      $scope.filterName = undefined;
      resetTreeSelection($scope.indicatorTopicsEditTree);
      resetTreeSelection($scope.georesourceTopicsEditTree);

      $scope.filterConfig = await kommonitorConfigStorageService.getFilterConfig();

      $scope.filterConfig.forEach((elem, index) => {
        if(index==itemId) {
          $scope.filterName = elem.name;

          $scope.selectedIndicatorTopicEditIds = elem.indicatorTopics;
          $scope.selectedGeoresourceTopicEditIds = elem.georesourceTopics;

          $scope.indicatorTopicsEditTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='indicator'), 0, $scope.selectedIndicatorTopicEditIds);
          $scope.georesourceTopicsEditTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='georesource'),0, $scope.selectedGeoresourceTopicEditIds);

          $scope.selectedIndicatorTopicEditIds.forEach(e => {
            searchIndicatorItemRecursive($scope.indicatorTopicsEditTree, e, true);
          });

          $scope.selectedGeoresourceTopicEditIds.forEach(e => {
            searchGeoresourceItemRecursive($scope.georesourceTopicsEditTree, e, true);
          });
          
          $scope.selectedIndicatorIds = elem.indicators;
          $scope.selectedGeoresourceIds = elem.georesources;
          
          refreshIndicatorsTable();
          refreshGeoresourcesTable();
          
          setTimeout(() => {
            $scope.$digest();
          }, 250);
        }
      });
		}); 

    // georesource tree
    $scope.onSelectedGeoresourceEditItemsChange = function(id,selected) {
      
      if(selected===true) {
        if(!$scope.selectedGeoresourceTopicEditIds.includes(id))
          $scope.selectedGeoresourceTopicEditIds.push(id);
      } else
        $scope.selectedGeoresourceTopicEditIds = $scope.selectedGeoresourceTopicEditIds.filter(e => e!=id);

      searchGeoresourceItemRecursive($scope.georesourceTopicsEditTree, id, selected);
    }

    $scope.onShowSelectedIndicatorsOnly = function() {
      refreshIndicatorsTable();
    }
    $scope.onShowSelectedGeoresourcesOnly = function() {
      refreshGeoresourcesTable();
    }

    function searchGeoresourceItemRecursive(tree, id, selected) {

      let ret = false;

      tree.forEach(entry => {
        if(entry.topicId==id) {
          if(selected===true) {
            document.getElementById('editCheckbox-'+id).checked = true;
            document.getElementById('editSubTopic-'+id).style.display = 'block';
          }

          checkGeoresourceItemsRecursive(entry.subTopics, selected);

          ret = true;
        } else {
          let itemFound = searchGeoresourceItemRecursive(entry.subTopics, id, selected);
          if(itemFound===true) {
            document.getElementById('editSubTopic-'+entry.topicId).style.display = 'block';
            ret = true;
          }
        }
      });

      return ret;
    }

    function checkGeoresourceItemsRecursive(tree, selected) {
      tree.forEach(entry => {
        if(selected===true) {
          document.getElementById('editCheckbox-'+entry.topicId).checked = true;
          document.getElementById('editCheckbox-'+entry.topicId).disabled = true;
        } else {
          document.getElementById('editCheckbox-'+entry.topicId).checked = false;
          document.getElementById('editCheckbox-'+entry.topicId).disabled = false;
        }
        
        // delete all downlevel items if they exists, just in case a level higher up has been checked afterwards  
        $scope.selectedGeoresourceTopicEditIds = $scope.selectedGeoresourceTopicEditIds.filter(e => e!=entry.topicId);

        if(entry.subTopics.length>0)
          checkGeoresourceItemsRecursive(entry.subTopics, selected);
      })
    }
    // end

    // indicator tree
    $scope.onSelectedIndicatorEditItemsChange = function(id,selected) {

      if(selected===true) {
        if(!$scope.selectedIndicatorTopicEditIds.includes(id))
          $scope.selectedIndicatorTopicEditIds.push(id);
      } else
        $scope.selectedIndicatorTopicEditIds = $scope.selectedIndicatorTopicEditIds.filter(e => e!=id);

      searchIndicatorItemRecursive($scope.indicatorTopicsEditTree, id, selected);
    }

    function searchIndicatorItemRecursive(tree, id, selected) {

      let ret = false;

      tree.forEach(entry => {
        if(entry.topicId==id) {
          if(selected===true) {
            document.getElementById('editCheckbox-'+id).checked = true;
            document.getElementById('editSubTopic-'+id).style.display = 'block';
          }

          checkIndicatorItemsRecursive(entry.subTopics, selected);

          ret = true;
        } else {
          let itemFound = searchIndicatorItemRecursive(entry.subTopics, id, selected);
          if(itemFound===true) {
            document.getElementById('editSubTopic-'+entry.topicId).style.display = 'block';
            ret = true;
          }
        }
      });

      return ret;
    }

    function checkIndicatorItemsRecursive(tree, selected) {
      tree.forEach(entry => {

        if(selected===true) {
          document.getElementById('editCheckbox-'+entry.topicId).checked = true;
          document.getElementById('editCheckbox-'+entry.topicId).disabled = true;
        } else {
          document.getElementById('editCheckbox-'+entry.topicId).checked = false;
          document.getElementById('editCheckbox-'+entry.topicId).disabled = false;
        }
        
        // delete all downlevel items if they exists, just in case a level higher up has been checked afterwards  
        $scope.selectedIndicatorTopicEditIds = $scope.selectedIndicatorTopicEditIds.filter(e => e!=entry.topicId);

        if(entry.subTopics.length>0)
          checkIndicatorItemsRecursive(entry.subTopics, selected);
      })
    }
    // end

    function prepTopicsTree(tree, level, selectedItemIds) {
      tree.forEach(entry => {
        entry.level = level;
        entry.selected = selectedItemIds.includes(entry.topicId);

        if(entry.subTopics.length>0) {
          let newLevel = level+1;
          entry.subTopics = prepTopicsTree(entry.subTopics, newLevel, selectedItemIds);
        }
      });

      return tree;
    }

    function resetTreeSelection(tree) {
      tree.forEach(entry => {
        
        document.getElementById('editCheckbox-'+entry.topicId).checked = false;
        document.getElementById('editCheckbox-'+entry.topicId).disabled = false;

        document.getElementById('editSubTopic-'+entry.topicId).style.display = 'none';

        if(entry.subTopics.length>0) 
          resetTreeSelection(entry.subTopics);
      });
    }

    function refreshGeoresourcesTable() {

      kommonitorDataExchangeService.availableGeoresources.forEach((element,index) => {
        $scope.preppedGeoresourceData[index] = {
          id: element.georesourceId,
          name: element.datasetName,
          description: element.metadata.description,
          checked: $scope.selectedGeoresourceIds.includes(element.georesourceId)
        }
      });

      if($scope.showSelectedGeoresourcesOnly)
        $scope.preppedGeoresourceData = $scope.preppedGeoresourceData.filter(e => e.checked===true);

			$scope.editGeoresourceTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditGeoresourcesTable', $scope.editGeoresourceTableOptions, $scope.preppedGeoresourceData, []);	
		}

		function refreshIndicatorsTable() {

      kommonitorDataExchangeService.availableIndicators.forEach((element,index) => {
        $scope.preppedIndicatorData[index] = {
          id: element.indicatorId,
          name: element.indicatorName,
          description: element.metadata.description,
          checked: $scope.selectedIndicatorIds.includes(element.indicatorId)
        }
      });

      if($scope.showSelectedIndicatorsOnly)
        $scope.preppedIndicatorData = $scope.preppedIndicatorData.filter(e => e.checked===true);

			$scope.editIndicatorTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditIndicatorsTable', $scope.editIndicatorTableOptions, $scope.preppedIndicatorData, []);	
		}

    $scope.editAdminFilter = async function () {

      var selectedIndicatorIds = kommonitorDataGridHelperService.getSelectedIds_singleSelectGrid($scope.editIndicatorTableOptions);
      var selectedGeoresourceIds = kommonitorDataGridHelperService.getSelectedIds_singleSelectGrid($scope.editGeoresourceTableOptions);

      if(!$scope.filterName)
          return;

      if(selectedGeoresourceIds.length==0 && selectedIndicatorIds.length==0 && $scope.selectedIndicatorTopicEditIds.length==0 && $scope.selectedGeoresourceTopicEditIds.length==0) {
        if(!confirm("Sie haben weder Indikator- noch Georesource Daten zur späteren Ansicht ausgewählt. Trotzdem fortfahren?"))
          return;
      }

      let filterConfig = await kommonitorConfigStorageService.getFilterConfig();      

      $timeout(function(){
        $scope.loadingData = true;
      });

      $scope.successMessagePart = undefined;
      $scope.errorMessagePart = undefined;

      let filterBody = {
        "name": $scope.filterName,
        "indicatorTopics": $scope.selectedIndicatorTopicEditIds,
        "indicators": selectedIndicatorIds,
        "georesourceTopics": $scope.selectedGeoresourceTopicEditIds,
        "georesources": selectedGeoresourceIds
      };

      filterConfig[$scope.selectedItem] = filterBody;

      var editConfigResponse = await kommonitorConfigStorageService.postFilterConfig(JSON.stringify(filterConfig, null, "    "));	
      
      $("#globalFilterEditSucessAlert").show();
      $scope.loadingData = false;

      $timeout(function(){
        $rootScope.$broadcast("refreshAdminFilterOverview");
      }, 500);

      setTimeout(() => {
        $scope.$digest();
      }, 250);
    };


		$scope.resetAdminFilterEditForm = function(){

      // reset
      $scope.filterName = undefined;
      resetTreeSelection($scope.indicatorTopicsEditTree);
      resetTreeSelection($scope.georesourceTopicsEditTree);

      $scope.filterConfig.forEach((elem, index) => {
        if(index==$scope.selectedItem) {
          $scope.filterName = elem.name;

          $scope.selectedIndicatorTopicEditIds = elem.indicatorTopics;
          $scope.selectedGeoresourceTopicEditIds = elem.georesourceTopics;

          $scope.indicatorTopicsEditTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='indicator'), 0, $scope.selectedIndicatorTopicEditIds);
          $scope.georesourceTopicsEditTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='georesource'),0, $scope.selectedGeoresourceTopicEditIds);

          $scope.selectedIndicatorTopicEditIds.forEach(e => {
            searchIndicatorItemRecursive($scope.indicatorTopicsEditTree, e, true);
          });

          $scope.selectedGeoresourceTopicEditIds.forEach(e => {
            searchGeoresourceItemRecursive($scope.georesourceTopicsEditTree, e, true);
          });
          
          $scope.selectedIndicatorIds = elem.indicators;
          $scope.selectedGeoresourceIds = elem.georesources;
          
          refreshIndicatorsTable();
          refreshGeoresourcesTable();
          
          setTimeout(() => {
            $scope.$digest();
          }, 250);
        }
      });

      /* $scope.filterName = undefined;
      
      $scope.editGeoresourceTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditGeoresourcesTable', $scope.editGeoresourceTableOptions, $scope.preppedGeoresourceData, []);	
			$scope.editIndicatorTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditIndicatorsTable', $scope.editIndicatorTableOptions, $scope.preppedIndicatorData, []);	

      $scope.successMessagePart = undefined;
      $scope.errorMessagePart = undefined;

      resetTreeSelection($scope.indicatorTopicsEditTree);
      resetTreeSelection($scope.georesourceTopicsEditTree);

      $scope.selectedIndicatorTopicEditIds = [];
      $scope.selectedGeoresourceTopicEditIds = [];

			setTimeout(() => {
				$scope.$digest();	
			}, 250); */
		};
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
				$("#globalFilterEditSucessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#globalFilterEditErrorAlert").hide();
			};

			kommonitorMultiStepFormHelperService.registerClickHandler("adminFilterEditForm");			

	}
]});
