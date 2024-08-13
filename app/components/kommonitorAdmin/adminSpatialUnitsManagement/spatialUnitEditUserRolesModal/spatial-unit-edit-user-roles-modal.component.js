angular.module('spatialUnitEditUserRolesModal').component('spatialUnitEditUserRolesModal', {
	templateUrl: "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditUserRolesModal/spatial-unit-edit-user-roles-modal.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', 'kommonitorMultiStepFormHelperService', 
	'kommonitorDataGridHelperService', '$timeout', 
		function SpatialUnitEditUserRolesModalController(kommonitorDataExchangeService, $scope, $rootScope, 
				$http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentSpatialUnitDataset;

		$scope.roleManagementTableOptions = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.ownerOrgFilter = undefined;
		$scope.ownerOrganization = undefined;
    $scope.activeRolesOnly = true;
    $scope.permissions = [];

		$scope.$on("onEditSpatialUnitUserRoles", function (event, spatialUnitDataset) {

			$scope.currentSpatialUnitDataset = spatialUnitDataset;
			
			$scope.$apply();

			$scope.resetSpatialUnitEditUserRolesForm();
			kommonitorMultiStepFormHelperService.registerClickHandler('spatialUnitEditUserRolesForm');
		});

		$scope.refreshRoleManagementTable = function() {
			$scope.permissions = $scope.currentSpatialUnitDataset ? $scope.currentSpatialUnitDataset.permissions : [];

			// set datasetOwner to disable checkboxes for owned datasets in permissions-table
			kommonitorDataExchangeService.accessControl.forEach(item => {
				if($scope.currentSpatialUnitDataset) {
					if(item.organizationalUnitId==$scope.currentSpatialUnitDataset.ownerId)
						item.datasetOwner = true;
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

			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditRoleManagementTable', $scope.roleManagementTableOptions, access, $scope.permissions, true);
		}
    
		$scope.onActiveRolesOnlyChange = function() {
      $scope.refreshRoleManagementTable();
    }

		$scope.$on("availableRolesUpdate", function (event) {
			$scope.refreshRoleManagementTable();
		});

		$scope.onChangeOwner = function(ownerOrganization) {

			$scope.ownerOrganization = ownerOrganization;
			console.log("Target creator role selected to be ",$scope.ownerOrganization);
		}	
		
		$scope.resetSpatialUnitEditUserRolesForm = function () {

			$scope.ownerOrganization = $scope.currentSpatialUnitDataset.ownerId;

			$scope.refreshRoleManagementTable();
			$scope.ownerOrgFilter = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#spatialUnitEditUserRolesSuccessAlert").hide();
			$("#spatialUnitEditUserRolesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.editSpatialUnitEditUserRolesForm = function(){

			if($scope.ownerOrganization !== undefined && $scope.ownerOrganization != $scope.currentSpatialUnitDataset.ownerId)
				if(!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?'))
					return;

			$scope.putUserRoles();

			$scope.putOwnership();
		}

		$scope.putUserRoles = function(){

			$scope.loadingData = true;

			let putBody = {
				"permissions": kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions),
				"isPublic": $scope.currentSpatialUnitDataset.isPublic
			}

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units/" + $scope.currentSpatialUnitDataset.spatialUnitId + "/permissions",
				method: "PUT",
				data: putBody,
				headers: {
				   'Content-Type': "application/json"
				}
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentSpatialUnitDataset.spatialUnitLevel;

					$rootScope.$broadcast("refreshSpatialUnitOverviewTable", "edit", $scope.currentSpatialUnitDataset.spatialUnitId);
								
					$("#spatialUnitEditUserRolesSuccessAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

				}, function errorCallback(error) {
					$scope.errorMessagePart = "Fehler beim Aktualisieren der Zugriffsrechte. Fehler lautet: \n\n";
					if(error.data){							
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#spatialUnitEditUserRolesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		}

		$scope.putOwnership = function(){

			$scope.loadingData = true;

			let putBody = {
				"ownerId": $scope.ownerOrganization === undefined ? $scope.currentSpatialUnitDataset.ownerId : $scope.ownerOrganization
			}
			

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units/" + $scope.currentSpatialUnitDataset.spatialUnitId + "/ownership",
				method: "PUT",
				data: putBody,
				headers: {
				   'Content-Type': "application/json"
				}
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentSpatialUnitDataset.spatialUnitLevel;

					$rootScope.$broadcast("refreshSpatialUnitOverviewTable", "edit", $scope.currentSpatialUnitDataset.spatialUnitId);
								
					$("#spatialUnitEditUserRolesSuccessAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

				}, function errorCallback(error) {
					$scope.errorMessagePart = "Fehler beim Aktualisieren der Zugriffsrechte. Fehler lautet: \n\n";
					if(error.data){							
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#spatialUnitEditUserRolesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		}

		$scope.hideSuccessAlert = function () {
			$("#spatialUnitEditUserRolesSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#spatialUnitEditUserRolesErrorAlert").hide();
		};

	}
	]
});
