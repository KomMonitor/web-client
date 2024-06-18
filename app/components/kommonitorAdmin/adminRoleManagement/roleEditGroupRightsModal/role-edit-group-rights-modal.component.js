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

            // TODO: replace "replacer" in BOTH get url to "$scope.current.organizationalUnitId"
            let replacer = "adff03a0-e72e-4c1a-90ac-511e70d9fd79";

            // ret all roles this orgaUnit has authorities over
            $http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits/" + replacer + "/role-authorities",
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

                $scope.buildAuthorityRolesTable();
			});

            // get all roles other orgaUnits have over this orgaUnit
            $http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits/" + replacer + "/role-delegates",
				method: "GET"
			}).then(function successCallback(response) {

                let roleDelegates = response.data.roleDelegates;
                
                roleDelegates.forEach(elem => {

                    $scope.delegatedRoleIDs.push(elem.organizationalUnitId);

                    elem.adminRoles.forEach(role => {
                        $scope.delegatedPermissions.push(elem.organizationalUnitId + "-" + role);
                    });
                });
                
                $scope.buildDelegatedRolesTable();
			});

            kommonitorMultiStepFormHelperService.registerClickHandler("roleEditGroupRightsMultistepForm");
		});

		$scope.onActiveDelegatedRolesOnlyChange = function() {
            $scope.buildDelegatedRolesTable();
        }

        $scope.buildAuthorityRolesTable = function() {
           
            $scope.authorityRoleManagementTableOptions = kommonitorDataGridHelperService.buildAdvancedRoleManagementGrid('editAuthorityGroupRoleManagementTable', $scope.authorityRoleManagementTableOptions, $scope.authorityAccess, $scope.authorityPermissions, true);
        }

        $scope.buildDelegatedRolesTable = function() {
            // hide (non-)applicable groups
            if($scope.activeDelegatedRolesOnly)
                $scope.delegatedAccess = $scope.access.filter(elem => (elem.organizationalUnitId!=$scope.current.organizationalUnitId && $scope.delegatedRoleIDs.includes(elem.organizationalUnitId)));
            else 
                $scope.delegatedAccess = $scope.access.filter(elem => elem.organizationalUnitId!=$scope.current.organizationalUnitId);

            $scope.delegatedRoleManagementTableOptions = kommonitorDataGridHelperService.buildAdvancedRoleManagementGrid('editDelegatedGroupRoleManagementTable', $scope.delegatedRoleManagementTableOptions, $scope.delegatedAccess, $scope.delegatedPermissions);
        }
	
		/* $scope.editRoleMetadata = function () {

			var putBody =
			{
				"name": $scope.current.name,
				"description": $scope.current.description,
				"contact": $scope.current.contact,
				"mandant": $scope.current.mandant,
				"keycloakId": $scope.current.keycloakId,
				"parentId": $scope.parentOrganizationalUnit ? $scope.parentOrganizationalUnit.organizationalUnitId : undefined
			};

			$scope.loadingData = true;
			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits/" + $scope.current.organizationalUnitId,
				method: "PUT",
				data: putBody
			}).then(async function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available

				$scope.successMessagePart = $scope.current.name;
				
				$("#editOuMetadataSuccessAlert").show();
				$timeout(function(){
				
					$scope.loadingData = false;
				});	

				try {

					//KEYCLOAK SYNC
					await kommonitorKeycloakHelperService.updateExistingGroup($scope.current, $scope.old.name, $scope.parentOrganizationalUnit);					

					await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles();
					// await kommonitorKeycloakHelperService.fetchAndSetKeycloakGroups();	

					// on successful update within keycloak explicitly set old name to current name
					// otherwise subsequent edit requests will be erronous 
					$scope.old.name = $scope.current.name;
					$scope.current.parentId = $scope.parentOrganizationalUnit ? $scope.parentOrganizationalUnit.organizationalUnitId : undefined;
					$scope.parentOrganizationalUnit_current = $scope.parentOrganizationalUnit;
			
					$("#keycloakGroupEditSuccessAlert").show();
				} catch (error) {
					if (error.data) {
						$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else {
						$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$timeout(function(){
						$("#keycloakGroupEditErrorAlert").show();
						$scope.loadingData = false;
					});
				}

				$rootScope.$broadcast("refreshAccessControlTable", "edit", $scope.current.organizationalUnitId);

			}, function errorCallback(error) {
				if (error.data) {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#editOuMetadataErrorAlert").show();
				$scope.loadingData = false;
			});
		}; */


		$scope.hideSuccessAlert = function () {
			$("#editOuMetadataSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#editOuMetadataErrorAlert").hide();
		};

		$scope.hideKeycloakSuccessAlert = function () {
			$("#keycloakGroupEditSuccessAlert").hide();
		};

		$scope.hideKeycloakErrorAlert = function () {
			$("#keycloakGroupEditErrorAlert").hide();
		};

	}
	]
});
