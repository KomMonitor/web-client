angular.module('roleEditGroupRightsModal').component('roleEditGroupRightsModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleEditGroupRightsModal/role-edit-group-rights-modal.template.html",
	controller: ['kommonitorDataGridHelperService', 'kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$timeout', '$http', '__env', 
    function RoleEditGroupRightsModalController(kommonitorDataGridHelperService, kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $timeout, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

		$scope.current = {};

		$scope.loadingData = false;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditOrganizationalUnitGroupRights", function (event, organizationalUnit) {

			$scope.current = organizationalUnit;

            let permissions = [
                "b2af5972-d08f-4838-9285-a1a8cb6f900f", // unit-users
                "ee2f31f6-363e-4acb-8802-c6f933b73e8c" // client-users
            ];

            let access = kommonitorDataExchangeService.accessControl;

            access.forEach(elem => {

                elem.permissions = [
                    { 
                        permissionLevel: "creator", 
                        permissionType: "unit-users", 
                        permissionId: "ee2f3"+Math.random(100)+"1f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "client-users", 
                        permissionId: "ee2f3"+Math.random(100)+"1f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "unit-resources", 
                        permissionId: "ee2f3"+Math.random(100)+"1f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "client-resources", 
                        permissionId: "ee2f3"+Math.random(100)+"1f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "unit-themes", 
                        permissionId: "ee2f3"+Math.random(100)+"1f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "client-themes", 
                        permissionId: "ee2f3"+Math.random(100)+"1f6-363e-4acb-8802-c6f933b73e8c"
                    }
                ]
            });

            access.push({
                children: [ "8552b0c5-003c-4879-8ae7-ef223d5d14a7" ],
                contact: "s.drost@52north.org",
                description: "123452°North",
                keycloakId: "abcdefg-ca48-4225-8a28-4e3e04dce15a",
                mandant: true,
                name: "123452N",
                organizationalUnitId: "abcdfeg-e72e-4c1a-90ac-511e70d9fd79",
                parentId: null,
                permissions: [
                    { 
                        permissionLevel: "creator", 
                        permissionType: "unit-users", 
                        permissionId: "ee2fsd3sdsds1f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "client-users", 
                        permissionId: "ee2fsdsd31f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "unit-resources", 
                        permissionId: "ee2f3dffgghgh1f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "client-resources", 
                        permissionId: "ee2f3jkklö1f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "unit-themes", 
                        permissionId: "ee2f3fgjkj1f6-363e-4acb-8802-c6f933b73e8c"
                    },
                    { 
                        permissionLevel: "creator", 
                        permissionType: "client-themes", 
                        permissionId: "ee2f3ghiiio1f6-363e-4acb-8802-c6f933b73e8c"
                    }
                ]});

            $scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildAdvancedRoleManagementGrid('editRoleEditGroupRoleManagementTable', $scope.roleManagementTableOptions, access, permissions);
		});

		
	
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
