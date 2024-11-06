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

		$scope.editIndicatorTableOptions = undefined;	
		$scope.editGeoresourceTableOptions = undefined;	

    $scope.selectedIndicatorIds = [];
    $scope.selectedGeoresourceIds = [];

    $scope.preppedGeoresourceData = [];
    $scope.preppedIndicatorData = [];

    $scope.indicatorTopicsTree = [];
    $scope.selectedIndicatorTopicIds = [];

    $scope.georesourceTopicsTree = [];
    $scope.selectedGeoresourceTopicIds = [];

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

      $scope.indicatorTopicsTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='indicator'),0);
      $scope.georesourceTopicsTree = prepTopicsTree(kommonitorDataExchangeService.availableTopics.filter(e => e.topicResource=='georesource'),0);
			addClickListenerToEachCollapseTrigger();
		}); 

    $scope.$on("onGlobalFilterEdit", async function (event, itemId) {

      // reset
      $scope.filterName = undefined;
      resetTreeSelection($scope.indicatorTopicsTree);
      resetTreeSelection($scope.georesourceTopicsTree);

      $scope.filterConfig = await kommonitorConfigStorageService.getFilterConfig();

      $scope.filterConfig.forEach((elem, index) => {
        if(index==itemId) {
          $scope.filterName = elem.name;

          $scope.selectedIndicatorTopicIds = elem.indicatorTopics;
          $scope.selectedGeoresourceTopicIds = elem.georesourceTopics;

          $scope.selectedIndicatorTopicIds.forEach(e => {
            searchIndicatorItemRecursive($scope.indicatorTopicsTree, e, true);
          });

          $scope.selectedGeoresourceTopicIds.forEach(e => {
            searchGeoresourceItemRecursive($scope.georesourceTopicsTree, e, true);
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
        if(!$scope.selectedGeoresourceTopicIds.includes(id))
          $scope.selectedGeoresourceTopicIds.push(id);
      } else
        $scope.selectedGeoresourceTopicIds = $scope.selectedGeoresourceTopicIds.filter(e => e!=id);

      searchGeoresourceItemRecursive($scope.georesourceTopicsTree, id, selected);
    }

    function searchGeoresourceItemRecursive(tree, id, selected) {

      tree.forEach(entry => {
        
        if(entry.topicId==id) {
          document.getElementById('editCheckbox-'+id).checked = true;
          document.getElementById('editSubTopic-'+id).style.display = 'block';

          checkGeoresourceItemsRecursive(entry.subTopics, selected);
        } else 
          searchGeoresourceItemRecursive(entry.subTopics, id, selected);
      });
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
        $scope.selectedGeoresourceTopicIds = $scope.selectedGeoresourceTopicIds.filter(e => e!=entry.topicId);

        if(entry.subTopics.length>0)
          checkGeoresourceItemsRecursive(entry.subTopics, selected);
      })
    }
    // end

    // indicator tree
    $scope.onSelectedIndicatorEditItemsChange = function(id,selected) {

      if(selected===true) {
        if(!$scope.selectedIndicatorTopicIds.includes(id))
          $scope.selectedIndicatorTopicIds.push(id);
      } else
        $scope.selectedIndicatorTopicIds = $scope.selectedIndicatorTopicIds.filter(e => e!=id);

      searchIndicatorItemRecursive($scope.indicatorTopicsTree, id, selected);
    }

    function searchIndicatorItemRecursive(tree, id, selected) {

      tree.forEach(entry => {
        if(entry.topicId==id) {
          document.getElementById('editCheckbox-'+id).checked = true;
          document.getElementById('editSubTopic-'+id).style.display = 'block';

          checkIndicatorItemsRecursive(entry.subTopics, selected);
        } else 
          searchIndicatorItemRecursive(entry.subTopics, id, selected);
      });
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

			$scope.editIndicatorTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditIndicatorsTable', $scope.editIndicatorTableOptions, $scope.preppedIndicatorData, []);	
		}

    $scope.editAdminFilter = async function () {

      var selectedIndicatorIds = kommonitorDataGridHelperService.getSelectedIds_singleSelectGrid($scope.editIndicatorTableOptions);
      var selectedGeoresourceIds = kommonitorDataGridHelperService.getSelectedIds_singleSelectGrid($scope.editGeoresourceTableOptions);

      if(!$scope.filterName)
          return;

      if(selectedGeoresourceIds.length==0 && selectedIndicatorIds.length==0 && $scope.selectedIndicatorTopicIds.length==0 && $scope.selectedGeoresourceTopicIds.length==0) {
        if(!confirm("Sie haben weder Indikator- noch Georesource Daten zur späteren Ansicht ausgewählt. Trotzdem fortfahren?"))
          return;
      }

      let filterConfig = await kommonitorConfigStorageService.getFilterConfig();      

      if(filterConfig.some(e => e.name==$scope.filterName)) {
        alert('Es existiert bereits ein Filter mit dem selben Namen!');
        return;
      }

      /* $timeout(function(){
        $scope.loadingData = true;
      }); */

      $scope.successMessagePart = undefined;
      $scope.errorMessagePart = undefined;

      let filterBody = {
        "name": $scope.filterName,
        "indicatorTopics": $scope.selectedIndicatorTopicIds,
        "indicators": selectedIndicatorIds,
        "georesourceTopics": $scope.selectedGeoresourceTopicIds,
        "georesources": selectedGeoresourceIds
      };

      filterConfig.push(filterBody);

/*       filterConfig = [
        {
            "name": "DemoApp",
            "indicatorTopics": [
                "61040cc0-b9c0-420f-92dd-fc6016ba1b22",
                "db2fda25-6259-4950-bf1c-584b5af3a0f8"
            ],
            "indicators": [
                "c2ae1c42-6d6c-4f5a-8b83-b8e3d50dd301",
                "7acae0d9-d56e-47ef-986c-562036189be2"
            ],
            "georesourceTopics": [
                "c839a9d4-41fd-4989-888e-e0a3d7949c9c"
            ],
            "georesources": [
            "edb29cfc-9d34-4df0-b059-575f213d381e"
            ]
        },
        {
            "name": "Demo 2",
            "indicatorTopics": [
                "f78d9a95-3b69-48a3-8076-d0d052426d03"
            ],
            "indicators": [
                "392273a0-d506-4b05-b7fa-7f492ed97c33"
            ],
            "georesourceTopics": [],
            "georesources": []
        }
    ]; */

      var editConfigResponse = await kommonitorConfigStorageService.postFilterConfig(JSON.stringify(filterConfig, null, "    "));	
      
      $("#globalFilterEditSucessAlert").show();
      $scope.loadingData = false;

      $timeout(function(){
        $rootScope.$broadcast("refreshAdminFilterOverviewTable");
        $scope.resetAdminFilterEditForm();
      }, 500);

      setTimeout(() => {
        $scope.$digest();
      }, 250);
    };


		$scope.resetAdminFilterEditForm = function(){

      $scope.filterName = undefined;
      
      $scope.editGeoresourceTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditGeoresourcesTable', $scope.editGeoresourceTableOptions, $scope.preppedGeoresourceData, []);	
			$scope.editIndicatorTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditIndicatorsTable', $scope.editIndicatorTableOptions, $scope.preppedIndicatorData, []);	

      $scope.successMessagePart = undefined;
      $scope.errorMessagePart = undefined;

      resetTreeSelection($scope.indicatorTopicsTree);
      resetTreeSelection($scope.georesourceTopicsTree);

      $scope.selectedIndicatorTopicIds = [];
      $scope.selectedGeoresourceTopicIds = [];

			setTimeout(() => {
				$scope.$digest();	
			}, 250);
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
