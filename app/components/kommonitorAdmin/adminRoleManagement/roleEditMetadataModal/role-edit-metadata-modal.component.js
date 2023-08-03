"use strict";
angular.module('roleEditMetadataModal').component('roleEditMetadataModal', {
    templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleEditMetadataModal/role-edit-metadata-modal.template.html",
    controller: ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$timeout', '$http', '__env', function RoleEditMetadataModalController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $timeout, $http, __env) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;
            $scope.current = {};
            $scope.old = {};
            $scope.old.name = undefined;
            $scope.nameInvalid = false;
            $scope.loadingData = false;
            $scope.successMessagePart = undefined;
            $scope.errorMessagePart = undefined;
            $scope.$on("onEditRoleMetadata", function (event, organizationalUnit) {
                $scope.current = organizationalUnit;
                $scope.old.name = organizationalUnit.name;
                $scope.resetRoleEditMetadataForm();
            });
            // Checks for duplicate names
            // Disallowed to prevent confusion
            $scope.checkRoleName = function () {
                $scope.nameInvalid = false;
                kommonitorDataExchangeService.accessControl.forEach(function (ou) {
                    if (ou.name === $scope.current.name && ou.organizationalUnitId != $scope.current.organizationalUnitId) {
                        $scope.nameInvalid = true;
                        return;
                    }
                });
            };
            $scope.resetRoleEditMetadataForm = function () {
                $scope.successMessagePart = undefined;
                $scope.errorMessagePart = undefined;
                $("#editMetadataSuccessAlert").hide();
                $("#editMetadataErrorAlert").hide();
                setTimeout(() => {
                    $scope.$digest();
                }, 250);
            };
            $scope.editRoleMetadata = function () {
                var putBody = {
                    "name": $scope.current.name,
                    "description": $scope.current.description,
                    "contact": $scope.current.contact
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
                    $("#editMetadataSuccessAlert").show();
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                    try {
                        await kommonitorKeycloakHelperService.renameExistingRoles($scope.old.name, $scope.current.name);
                        // on successful update within keycloak explicitly set old name to current name
                        // otherwise subsequent edit requests will be erronous 
                        $scope.old.name = $scope.current.name;
                        await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles();
                        $("#keycloakRoleEditSuccessAlert").show();
                    }
                    catch (error) {
                        if (error.data) {
                            $scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                        }
                        else {
                            $scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                        }
                        $timeout(function () {
                            $("#keycloakRoleEditErrorAlert").show();
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
                    $("#editMetadataErrorAlert").show();
                    $scope.loadingData = false;
                });
            };
            $scope.hideSuccessAlert = function () {
                $("#editMetadataSuccessAlert").hide();
            };
            $scope.hideErrorAlert = function () {
                $("#editMetadataErrorAlert").hide();
            };
            $scope.hideKeycloakSuccessAlert = function () {
                $("#keycloakRoleEditSuccessAlert").hide();
            };
            $scope.hideKeycloakErrorAlert = function () {
                $("#keycloakRoleEditErrorAlert").hide();
            };
        }
    ]
});
//# sourceMappingURL=role-edit-metadata-modal.component.js.map