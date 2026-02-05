angular.module('georesourceEditUserRolesModal').component('georesourceEditUserRolesModal', {
	templateUrl: "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditUserRolesModal/georesource-edit-user-roles-modal.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', 'kommonitorMultiStepFormHelperService', 
	'kommonitorDataGridHelperService', '$timeout', 
		function GeoresourceEditUserRolesModalController(kommonitorDataExchangeService, $scope, $rootScope, 
				$http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentGeoresourceDataset;

		$scope.roleManagementTableOptions = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.ownerOrgFilter = undefined;
		$scope.ownerOrganization = undefined;
    $scope.activeRolesOnly = true;
    $scope.permissions = [];
    $scope.resourcesCreatorRights = [];

		$scope.$on("onEditGeoresourcesUserRoles", function (event, georesourceDataset) {

			$scope.currentGeoresourceDataset = georesourceDataset;

      $scope.prepareCreatorList();

			$scope.$apply();

			$scope.resetGeoresourceEditUserRolesForm();
			kommonitorMultiStepFormHelperService.registerClickHandler('georesourceEditUserRolesForm');
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
			kommonitorDataExchangeService.accessControl.filter(elem => creatorRightsChildren.includes(elem.name)).flatMap(res => res.children).forEach(child => {
			  kommonitorDataExchangeService.accessControl.filter(elem => elem.organizationalUnitId==child).forEach(childData => {
				creatorRights.push(childData.name);
				gatherCreatorRightsChildren(creatorRights, [childData.name]);
			  });
			  
			});
		}
	}

		$scope.refreshRoleManagementTable = function() {
			$scope.permissions = $scope.currentGeoresourceDataset ? $scope.currentGeoresourceDataset.permissions : [];
      
			// set datasetOwner to disable checkboxes for owned datasets in permissions-table
			kommonitorDataExchangeService.accessControl.forEach(item => {
				if($scope.currentGeoresourceDataset) {
					if(item.organizationalUnitId==$scope.currentGeoresourceDataset.ownerId)
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

			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('georesourceEditRoleManagementTable', $scope.roleManagementTableOptions, access, $scope.permissions, true);
		}
    
		$scope.onActiveRolesOnlyChange = function() {

      if($scope.activeRolesOnly)
        $scope.activeRolesOnly = false;
      else
        $scope.activeRolesOnly = true;

      $scope.refreshRoleManagementTable();
    }

		$scope.$on("availableRolesUpdate", function (event) {
			$scope.refreshRoleManagementTable();
		});

		$scope.onChangeOwner = function(ownerOrganization) {

			$scope.ownerOrganization = ownerOrganization;
			console.log("Target creator role selected to be ",$scope.ownerOrganization);
			refreshRoles(ownerOrganization);
		}	

		function refreshRoles(orgUnitId) {	

			let permissionIds_ownerUnit = orgUnitId ? kommonitorDataExchangeService.getAccessControlById(orgUnitId).permissions.filter(permission => permission.permissionLevel == "viewer" || permission.permissionLevel == "editor").map(permission => permission.permissionId) : []; 

			// set datasetOwner to disable checkboxes for owned datasets in permissions-table
			kommonitorDataExchangeService.accessControl.forEach(item => {
				if(item.organizationalUnitId==orgUnitId)
					item.datasetOwner = true;
				else
					item.datasetOwner = false;
			});

			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('georesourceEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, permissionIds_ownerUnit, true);
		}

		$scope.resetGeoresourceEditUserRolesForm = function () {

			document.getElementById('targetUserRoleSelect').selectedIndex = 0;

			$scope.ownerOrganization = $scope.currentGeoresourceDataset.ownerId;

			$scope.refreshRoleManagementTable();
			$scope.ownerOrgFilter = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#RolesSuccessAlert").hide();
			$("#georesourceEditUserRolesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.editGeoresourceEditUserRolesForm = function(){

			if($scope.ownerOrganization !== undefined && $scope.ownerOrganization != $scope.currentGeoresourceDataset.ownerId)
				if(!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?'))
					return;

			$scope.putUserRoles();

			$scope.putOwnership();
		}

		$scope.putUserRoles = function(){

			$scope.loadingData = true;

			let putBody = {
				"permissions": kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions),
				"isPublic": $scope.currentGeoresourceDataset.isPublic
			}

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/permissions",
				method: "PUT",
				data: putBody,
				headers: {
				   'Content-Type': "application/json"
				}
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentGeoresourceDataset.datasetName;

					$rootScope.$broadcast("refreshGeoresourceOverviewTable", "edit", $scope.currentGeoresourceDataset.georesourceId);
								
					$("#georesourceEditUserRolesSuccessAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

				}, function errorCallback(error) {
					$scope.errorMessagePart = "Fehler beim Aktualisieren der Zugriffsrechte. Fehler lautet: \n\n";
					if(error.data){							
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#georesourceEditUserRolesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		}

		$scope.putOwnership = function(){

			$scope.loadingData = true;

			let putBody = {
				"ownerId": $scope.ownerOrganization === undefined ? $scope.currentGeoresourceDataset.ownerId : $scope.ownerOrganization
			}

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/ownership",
				method: "PUT",
				data: putBody,
				headers: {
				   'Content-Type': "application/json"
				}
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentGeoresourceDataset.datasetName;

					$rootScope.$broadcast("refreshGeoresourceOverviewTable", "edit", $scope.currentGeoresourceDataset.georesourceId);
								
					$("#georesourceEditUserRolesSuccessAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

				}, function errorCallback(error) {
					$scope.errorMessagePart = "Fehler beim Aktualisieren der Eigentümerschaft. Fehler lautet: \n\n";
					if(error.data){							
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#georesourceEditUserRolesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		}

		$scope.hideSuccessAlert = function () {
			$("#georesourceEditUserRolesSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#georesourceEditUserRolesErrorAlert").hide();
		};

	}
	]
});
