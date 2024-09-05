angular.module('roleAddModal').component('roleAddModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleAddModal/role-add-modal.template.html",
	controller: ['kommonitorDataGridHelperService', 'kommonitorMultiStepFormHelperService', 'kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$timeout', '$http', '__env',
		function RoleAddModalController(kommonitorDataGridHelperService, kommonitorMultiStepFormHelperService, kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorKeycloakHelperService, $scope, $rootScope, $timeout, $http, __env) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
			this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

            $scope.roleManagementTableOptions = undefined;

			$scope.loadingData = false;
			$scope.newOrganizationalUnit = {
				mandant: false,
				parentId: ""
			};

			$scope.nameInvalid = false;
			$scope.errorMessagePart = undefined;
			$scope.keycloakErrorMessagePart = undefined;

			$scope.parentOrganizationalUnitFilter = undefined;
			$scope.parentOrganizationalUnit = undefined;
      $scope.parentSelected = false;

            $scope.unitAddSuccess = false;

            // make sure that initial fetching of availableRoles has happened
            $scope.$on("initialMetadataLoadingCompleted", function (event) {

                $scope.access = kommonitorDataExchangeService.accessControl;

                //console.log(kommonitorDataExchangeService.allowedAccessControl);

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

			    $scope.buildRoleDelegatesTable();
            });

            $scope.buildRoleDelegatesTable = function() {
                $scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildAdvancedRoleManagementGrid('addRoleEditGroupRoleManagementTable', $scope.roleManagementTableOptions, $scope.access, []);
            }

			$scope.checkOrganizationalUnitName = function () {
				$scope.nameInvalid = kommonitorDataExchangeService.accessControl.some(ou => ou.name === $scope.newOrganizationalUnit.name);
			};

			
			$scope.resetOrganizationalUnitAddForm = function () {
				$scope.newOrganizationalUnit = {
					mandant: false,
					parentId: ""
				};

				$scope.errorMessagePart = undefined;
				$scope.keycloakErrorMessagePart = undefined;
				$scope.parentOrganizationalUnitFilter = undefined;
				$scope.parentOrganizationalUnit = undefined;
				$scope.checkOrganizationalUnitName();

			    $scope.buildRoleDelegatesTable();

				setTimeout(() => {
					$scope.$digest();
				}, 250);
			};

			$scope.onChangeParentOrganizationalUnit = function(selectedOption){

        if(selectedOption)
          $scope.parentSelected = true;
        else
          $scope.parentSelected = false;

				let parentId = selectedOption ? selectedOption.organizationalUnitId : "";
				if (! parentId){
					parentId = "";
				}

				$scope.newOrganizationalUnit.parentId = parentId;
			}

			$scope.addOrganizationalUnit = async function () {

				$scope.errorMessagePart = undefined;
				$scope.keycloakErrorMessagePart = undefined;

				try {

					var postBody =
					{
						"name": $scope.newOrganizationalUnit.name,
						"description": $scope.newOrganizationalUnit.description,
						"contact": $scope.newOrganizationalUnit.contact,
						"mandant": $scope.newOrganizationalUnit.mandant,
						// "keycloakId": keycloakGroupId,
						"parentId": $scope.newOrganizationalUnit.parentId
					};					

					$scope.loadingData = true;

					await $http({
						url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits",
						method: "POST",
						data: postBody,
						headers: {
						   'Content-Type': 'application/json'
						}
					}).then(async function successCallback(response) {
						// this callback will be called asynchronously
						// when the response is available
						
						await kommonitorDataExchangeService.fetchAccessControlMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);
						await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles();
						
						// $("#ouAddSuccessAlert").show();						

						// $rootScope.$broadcast("refreshAccessControlTable");
                        
                        // $scope.resetOrganizationalUnitAddForm();

						// $timeout(function () {
						// 	$scope.loadingData = false;
						// });

						$scope.unitAddSuccess = true;

					}, function errorCallback(error) {

					});
				} catch (error) {
					if (error.data) {
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else {
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#ouAddErrorAlert").show();
					$scope.loadingData = false;
				}


        // add role delegates
        try {

          let orgaUnit = kommonitorDataExchangeService.getAccessControlByName($scope.newOrganizationalUnit.name);

					if(!$scope.unitAddSuccess || !orgaUnit.organizationalUnitId){
					 	throw new Error("Anlegen der Gruppe fehlgeschlagen.");
          }

                    // recreate json permission structure out of "unitIds-roleName"
                    const permissions = [];
                    $scope.delegatedRoleIDs = [];
                    kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions).forEach(permission => {
                        
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
                        url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits/" + orgaUnit.organizationalUnitId + "/role-delegates",
                        method: "PUT",
                        data: putBody
                    }).then(async function successCallback(response) {
                        // this callback will be called asynchronously
                        // when the response is available

                        $("#ouAddSuccessAlert").show();						

						$rootScope.$broadcast("refreshAccessControlTable");
						$scope.checkOrganizationalUnitName();
						$scope.resetOrganizationalUnitAddForm();
						$timeout(function () {
							$scope.loadingData = false;
						});

                    }, function errorCallback(error) {
                        if (error.data) {
                            $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                        }
                        else {
                            $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                        }

                        $("#ouAddErrorAlert").show();
                        $scope.loadingData = false;
                    });
        } catch (error) {
            $scope.errorMessagePart = "Unable to update role authorities"

					$("#ouAddErrorAlert").show();
					$scope.loadingData = false;
				}
			};

			$scope.hideSuccessAlert = function () {
				$("#ouAddSuccessAlert").hide();
			};

			$scope.hideKeycloakSuccessAlert = function () {
				$("#keycloakGroupAddSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function () {
				$("#ouAddErrorAlert").hide();
			};

			$scope.hideKeycloakErrorAlert = function () {
				$("#keycloakGroupAddErrorAlert").hide();
			};

            
			kommonitorMultiStepFormHelperService.registerClickHandler("ouAddForm");
        

		}
	]
});
