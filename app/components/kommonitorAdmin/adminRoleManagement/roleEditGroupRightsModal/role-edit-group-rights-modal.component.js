angular.module('roleEditGroupRightsModal').component('roleEditGroupRightsModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleEditGroupRightsModal/role-edit-group-rights-modal.template.html",
	controller: ['kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService', 'kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$timeout', '$http', '__env', 
    function RoleEditGroupRightsModalController(kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService, kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $timeout, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

		$scope.current = {};

		$scope.loadingData = false;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.delegatedRoleManagementTableOptions = undefined;
    $scope.authorityRoleManagementTableOptions = undefined;

    $scope.authorityRoleIDs = [];
    $scope.authorityAccess = undefined;
    $scope.authorityPermissions = [];

    $scope.delegatedRoleIDs = [];
    $scope.delegatedAccess = undefined;
    $scope.delegatedPermissions = [];
    $scope.activeDelegatedRolesOnly = true;

		$scope.$on("onEditOrganizationalUnitGroupRights", function (event, organizationalUnit) {

            $scope.current = organizationalUnit;

            $scope.access = kommonitorDataExchangeService.accessControl;

            // create permissions structure based on "unitIds-roleName"
            let permissionStrings = [
                "unit-users-creator",
                "client-users-creator",
                "unit-resources-creator",
                "client-resources-creator",
                "unit-themes-creator",
                "client-themes-creator"];
            $scope.access.forEach(elem => {

                permissionStrings.forEach(role => {
                    elem.permissions.push({ 
                        permissionLevel: role, 
                        permissionId: elem.organizationalUnitId + "-" + role
                    });
                });
            });

            $scope.buildAuthorityRolesTable();
            $scope.buildDelegatedRolesTable();

            kommonitorMultiStepFormHelperService.registerClickHandler("roleEditGroupRightsMultistepForm");
		});

		$scope.onActiveDelegatedRolesOnlyChange = function() {
      $scope.buildDelegatedRolesTable();
    }

        $scope.buildAuthorityRolesTable = function() {

            $scope.authorityPermissions = [];
            $scope.authorityRoleIDs = [];
           
            // get all roles this orgaUnit has authorities over
            $http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits/" + $scope.current.organizationalUnitId + "/role-authorities",
				method: "GET"
			}).then(function successCallback(response) {

                let roleAuthorities = response.data.authorityRoles;
                
                roleAuthorities.forEach(elem => {

                    $scope.authorityRoleIDs.push(elem.organizationalUnitId);

                    elem.adminRoles.forEach(role => {
                        $scope.authorityPermissions.push(elem.organizationalUnitId + "-" + role);
                    });
                });
                
                $scope.authorityAccess = $scope.access.filter(elem => $scope.authorityRoleIDs.includes(elem.organizationalUnitId));

                $scope.authorityRoleManagementTableOptions = kommonitorDataGridHelperService.buildAdvancedRoleManagementGrid('editAuthorityGroupRoleManagementTable', $scope.authorityRoleManagementTableOptions, $scope.authorityAccess, $scope.authorityPermissions, true);
			});
        }

        $scope.buildDelegatedRolesTable = function() {

            // get all roles other orgaUnits have over this orgaUnit
            $http({
                url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits/" + $scope.current.organizationalUnitId + "/role-delegates",
                method: "GET"
            }).then(function successCallback(response) {

                $scope.delegatedRoleIDs = [];
                $scope.delegatedPermissions = [];

                let roleDelegates = response.data.roleDelegates;
                
                roleDelegates.forEach(elem => {

                    $scope.delegatedRoleIDs.push(elem.organizationalUnitId);

                    elem.adminRoles.forEach(role => {
                        $scope.delegatedPermissions.push(elem.organizationalUnitId + "-" + role);
                    });
                });
                
                if($scope.delegatedRoleIDs.length==0)
                    $scope.activeDelegatedRolesOnly = false;

                // $scope.delegatedAccess = $scope.access.filter(elem => elem.organizationalUnitId!=$scope.current.organizationalUnitId);
                $scope.delegatedAccess = $scope.access;

                // hide (non-)applicable groups
                if($scope.delegatedRoleIDs.length>0 && $scope.activeDelegatedRolesOnly) {
                    // $scope.delegatedAccess = $scope.access.filter(elem => (elem.organizationalUnitId!=$scope.current.organizationalUnitId && $scope.delegatedRoleIDs.includes(elem.organizationalUnitId)));
                    $scope.delegatedAccess = $scope.access.filter(elem => ($scope.delegatedRoleIDs.includes(elem.organizationalUnitId)));
                } 
                
                $scope.delegatedRoleManagementTableOptions = kommonitorDataGridHelperService.buildAdvancedRoleManagementGrid('editDelegatedGroupRoleManagementTable', $scope.delegatedRoleManagementTableOptions, $scope.delegatedAccess, $scope.delegatedPermissions);
            });
        }
	
		$scope.editRoleDelegates = function () {
            
            // recreate json permission structure out of "unitIds-roleName"
            const permissions = [];
            $scope.delegatedRoleIDs = [];
            kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.delegatedRoleManagementTableOptions).forEach(permission => {
                
                let parts = permission.split('-');

                let unitId = parts.slice(0,5).join('-');
                let role = parts.slice(5,10).join('-');

                if(!permissions[unitId])
                    permissions[unitId] = [];

                if(!permissions[unitId].includes(role)) {
                    permissions[unitId].push(role);
                    $scope.delegatedRoleIDs.push(unitId);
                }
            });

            var putBody = [];
            for (var key in permissions) {

                let orgUnit = $scope.access.filter(elem => elem.organizationalUnitId==key)[0];

                putBody.push({
                    "organizationalUnitId": key,
                    "organizationalUnitName": orgUnit.name,
                    "keycloakId": orgUnit.keycloakId,
                    "adminRoles": permissions[key]
                });
            }

			$scope.loadingData = true;
			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits/" + $scope.current.organizationalUnitId + "/role-delegates",
				method: "PUT",
				data: putBody
			}).then(async function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available

				$scope.successMessagePart = $scope.current.name;
                $scope.buildDelegatedRolesTable();
				
				$("#editOuRoleDelegatesSuccessAlert").show();
				$timeout(function(){
				
					$scope.loadingData = false;
				});	

			}, function errorCallback(error) {
				if (error.data) {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#editOuRoleDelegatesErrorAlert").show();
				$scope.loadingData = false;
			});
		};

        $scope.resetRoleDelegatesForm = function () {

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

            $scope.buildDelegatedRolesTable();

			$("#editOuRoleDelegatesSuccessAlert").hide();
			$("#editOuRoleDelegatesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.hideSuccessAlert = function () {
			$("#editOuRoleDelegatesSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#editOuRoleDelegatesErrorAlert").hide();
		};

	}
	]
});
