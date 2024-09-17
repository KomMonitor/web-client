angular.module('indicatorEditIndicatorSpatialUnitRolesModal').component('indicatorEditIndicatorSpatialUnitRolesModal', {
	templateUrl: "components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', 'kommonitorMultiStepFormHelperService', 
	'kommonitorDataGridHelperService', '$timeout',
		function IndicatorEditIndicatorSpatialUnitRolesModalController(kommonitorDataExchangeService, $scope, $rootScope, 
				$http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentIndicatorDataset;

		$scope.roleManagementTableOptions_indicatorMetadata = undefined;
		$scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.ownerOrgFilter = undefined;
		$scope.ownerOrganization = undefined;
    $scope.activeRolesOnly = true;
    $scope.activeConnectedRolesOnly = true;
    $scope.permissions = [];
    $scope.resourcesCreatorRights = [];

		$scope.$on("onEditIndicatorSpatialUnitRoles", function (event, indicatorDataset) {

			$scope.currentIndicatorDataset = indicatorDataset;

      $scope.prepareCreatorList();

			$scope.$apply();

			$scope.resetIndicatorEditIndicatorSpatialUnitRolesForm();
			kommonitorMultiStepFormHelperService.registerClickHandler("indicatorEditIndicatorSpatialUnitRolesForm");

		});

    $scope.prepareCreatorList = function() {

      if(kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.length>0) {

        let creatorRights = [];
        let creatorRightsChildren = [];
        kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.forEach(roles => {
          
          let key = roles.split('.')[0];
          let role = roles.split('.')[1];

          // case unit-resources-creator
          if(role=='unit-resources-creator' && !$scope.resourcesCreatorRights.includes(key)) {
            creatorRights.push(key);
          }

          // case client-resources-creator, gather unit-ids first, then fetch all unit-data
          if(role=='client-resources-creator' && !creatorRightsChildren.includes(key)) {
            creatorRightsChildren.push(key);
          }
        });

        // gather all children
        gatherCreatorRightsChildren(creatorRights, creatorRightsChildren);

        $scope.resourcesCreatorRights = kommonitorDataExchangeService.accessControl.filter(elem => creatorRights.includes(elem.name));
      }
    }

	function gatherCreatorRightsChildren(creatorRights, creatorRightsChildren) {
        if(creatorRightsChildren.length>0) {
			kommonitorDataExchangeService.accessControl.filter(elem => creatorRightsChildren.includes(elem.name)).map(res => res.children).forEach(child => {
			  kommonitorDataExchangeService.accessControl.filter(elem => elem.organizationalUnitId==child).forEach(childData => {
				creatorRights.push(childData.name);
				gatherCreatorRightsChildren(creatorRights, [childData.name]);
			  });
			  
			});
		}
	}

		$scope.refreshRoleManagementTable_indicatorMetadata = function() {
			$scope.permissions = $scope.currentIndicatorDataset ? $scope.currentIndicatorDataset.permissions : [];

			// set datasetOwner to disable checkboxes for owned datasets in permissions-table
			kommonitorDataExchangeService.accessControl.forEach(item => {
				if($scope.currentIndicatorDataset) {
					if(item.organizationalUnitId==$scope.currentIndicatorDataset.ownerId)
						item.datasetOwner = true;
					else
						item.datasetOwner = false;
				}
			});

      if($scope.permissions.length==0)
        $scope.activeRolesOnly = false;

      let access = kommonitorDataExchangeService.accessControl;
      if($scope.permissions.length>0 && $scope.activeRolesOnly) {
        access = kommonitorDataExchangeService.accessControl.filter(unit => {

          return (unit.permissions.filter(unitPermission => $scope.permissions.includes(unitPermission.permissionId)).length>0 ? true : false);
        });
      }

			$scope.roleManagementTableOptions_indicatorMetadata = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditRoleManagementTable', $scope.roleManagementTableOptions_indicatorMetadata, access, $scope.permissions, true);
		}

		$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries = function(){

			if ($scope.targetApplicableSpatialUnit && $scope.targetApplicableSpatialUnit.permissions) {

        if($scope.targetApplicableSpatialUnit.permissions.length==0)
          $scope.activeConnectedRolesOnly = false;
  
        let connectedAccess = kommonitorDataExchangeService.accessControl;
        if($scope.targetApplicableSpatialUnit.permissions.length>0 && $scope.activeConnectedRolesOnly) {
          connectedAccess = kommonitorDataExchangeService.accessControl.filter(unit => {
  
            return (unit.permissions.filter(unitPermission => $scope.targetApplicableSpatialUnit.permissions.includes(unitPermission.permissionId)).length>0 ? true : false);
          });
        }


				$scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries, connectedAccess, $scope.targetApplicableSpatialUnit.permissions, true);
			} else {

        $scope.activeConnectedRolesOnly = false;

				$scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries, kommonitorDataExchangeService.accessControl, [], true);
			}
		}	
    
    $scope.onActiveConnectedRolesOnlyChange = function() {

      $scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
    }
    
    $scope.onActiveRolesOnlyChange = function() {

      $scope.refreshRoleManagementTable_indicatorMetadata();
    }

		$scope.$on("availableRolesUpdate", function (event) {

			$scope.refreshRoleManagementTable_indicatorMetadata();
			$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
		});

		$scope.onChangeOwner = function(ownerOrganization) {

			$scope.ownerOrganization = ownerOrganization;
			console.log("Target creator role selected to be:", $scope.ownerOrganization);
		}

		$scope.resetIndicatorEditIndicatorSpatialUnitRolesForm = function () {

			$scope.ownerOrganization = $scope.currentIndicatorDataset.ownerId;
			document.getElementById('targetUserRoleSelect').selectedIndex = 0;

			$scope.ownerOrgFilter = undefined;

			$scope.targetApplicableSpatialUnit = $scope.currentIndicatorDataset.applicableSpatialUnits[0];

			$scope.refreshRoleManagementTable_indicatorMetadata();
			$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").hide();
			$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.editIndicatorSpatialUnitRoles = function () {

			if($scope.ownerOrganization !== undefined && $scope.ownerOrganization != $scope.currentIndicatorDataset.ownerId)
				if(!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?'))
					return;

			$scope.executeRequest_indicatorMetadataRoles();

			$scope.executeRequest_indicatorOwnership();

			$scope.executeRequest_indicatorSpatialUnitRoles();			

			$scope.executeRequest_indicatorSpatialUnitOwnership();
		};

		$scope.executeRequest_indicatorMetadataRoles = function(){
			$scope.loadingData = true;

			let putBody = {
				"permissions": kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions_indicatorMetadata),
				"isPublic": $scope.currentIndicatorDataset.isPublic
			}

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/permissions",
				method: "PUT",
				data: putBody,
				headers: {
				   'Content-Type': "application/json"
				}
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentIndicatorDataset.indicatorName;

					$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
								
					$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

				}, function errorCallback(error) {
					$scope.errorMessagePart = "Fehler beim Aktualisieren der Metadaten-Zugriffsrechte. Fehler lautet: \n\n";
					if(error.data){							
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		}

		$scope.executeRequest_indicatorOwnership = function(){
			$scope.loadingData = true;

			let putBody = {
				"ownerId": $scope.ownerOrganization === undefined ? $scope.currentIndicatorDataset.ownerId : $scope.ownerOrganization
			}

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/ownership",
				method: "PUT",
				data: putBody,
				headers: {
				   'Content-Type': "application/json"
				}
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentIndicatorDataset.indicatorName;

					$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
								
					$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

				}, function errorCallback(error) {
					$scope.errorMessagePart = "Fehler beim Aktualisieren der Metadaten-Eigentümerschaft. Fehler lautet: \n\n";
					if(error.data){							
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		}

		$scope.executeRequest_indicatorSpatialUnitOwnership = function(){
			$scope.loadingData = true;

			if($scope.currentIndicatorDataset.applicableSpatialUnits && $scope.currentIndicatorDataset.applicableSpatialUnits.length>0) {
				$scope.currentIndicatorDataset.applicableSpatialUnits.forEach(indicatorSpatialUnit => {

					let putBody = {
						"ownerId": $scope.ownerOrganization === undefined ? $scope.currentIndicatorDataset.ownerId : $scope.ownerOrganization
					}

					$http({
						url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/" + indicatorSpatialUnit.spatialUnitId + "/ownership",
						method: "PUT",
						data: putBody,
						headers: {
						'Content-Type': "application/json"
						}
					}).then(function successCallback(response) {
							// this callback will be called asynchronously
							// when the response is available

							$scope.successMessagePart = $scope.currentIndicatorDataset.indicatorName;

							$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
										
							$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").show();
							$timeout(function(){
						
								$scope.loadingData = false;
							});	

						}, function errorCallback(error) {
							$scope.errorMessagePart = "Fehler beim Aktualisieren der Metadaten-Eigentümerschaft. Fehler lautet: \n\n";
							if(error.data){							
								$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
							}
							else{
								$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error);
							}

							$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").show();
							$timeout(function(){
						
								$scope.loadingData = false;
							});	
					});
				});
			}
		}

		$scope.executeRequest_indicatorSpatialUnitRoles = function(){
			
			var putBody =
			{
				"permissions": kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries),
				"isPublic": $scope.targetApplicableSpatialUnit.isPublic
			};

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/" + $scope.targetApplicableSpatialUnit.spatialUnitId + "/permissions",
				method: "PUT",
				data: putBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available

				$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
				$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").show();
				$scope.loadingData = false;

			}, function errorCallback(error) {
				$scope.errorMessagePart = "Fehler beim Aktualisieren der Zugriffsrechte auf Zeitreihe der Raumeinheit " + $scope.targetApplicableSpatialUnit.spatialUnitName + ". Fehler lautet: \n\n";
				if (error.data) {
					$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else {
					$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").show();
				$scope.loadingData = false;

				// setTimeout(function() {
				// 		$("#indicatorEditMetadataSuccessAlert").hide();
				// }, 3000);
			});
		}

		$scope.onChangeSelectedSpatialUnit = function (targetApplicableSpatialUnit) {

			$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
			
		};

		$scope.hideSuccessAlert = function () {
			$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").hide();
		};

	}
	]
});
