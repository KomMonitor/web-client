angular.module('roleAddModal').component('roleAddModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleAddModal/role-add-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$timeout', '$http', '__env',
		function SpatialUnitAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorKeycloakHelperService, $scope, $rootScope, $timeout, $http, __env) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
			this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

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

				setTimeout(() => {
					$scope.$digest();
				}, 250);
			};

			$scope.onChangeParentOrganizationalUnit = function(){
				let parentId = $scope.parentOrganizationalUnit ? $scope.parentOrganizationalUnit.organizationalUnitId : "";
				if (! parentId){
					parentId = "";
				}
				$scope.newOrganizationalUnit.parentId = parentId;
			}

			$scope.addOrganizationalUnit = async function () {
				$scope.errorMessagePart = undefined;
				$scope.keycloakErrorMessagePart = undefined;

				// first add new grpoup in keycloak

				// only if that works, then use it's keycloak group id to register organizationalUnit in KomMonitor

				let keycloakGroupId;

				try {

					await kommonitorKeycloakHelperService.postNewGroup($scope.newOrganizationalUnit, $scope.parentOrganizationalUnit);
					await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles();
					await kommonitorKeycloakHelperService.fetchAndSetKeycloakGroups();

					keycloakGroupId = kommonitorKeycloakHelperService.getGroupId($scope.newOrganizationalUnit);
					$("#keycloakGroupAddSuccessAlert").show();
				} catch (error) {
					if (error.data) {
						$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else {
						$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$timeout(function () {

						$("#keycloakGroupAddErrorAlert").show();
						$scope.loadingData = false;
					});
				}

				try {
					if(! keycloakGroupId){
						throw new Error("Gruppe kann nicht in KomMonitor angelegt werden, da die Registrierung in keycloak fehlgeschlagen ist.");
					}

					var postBody =
					{
						"name": $scope.newOrganizationalUnit.name,
						"description": $scope.newOrganizationalUnit.description,
						"contact": $scope.newOrganizationalUnit.contact,
						"mandant": $scope.newOrganizationalUnit.mandant,
						"keycloakId": keycloakGroupId,
						"parentId": $scope.newOrganizationalUnit.parentId
					};

					$scope.loadingData = true;

					$http({
						url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits",
						method: "POST",
						data: postBody,
						headers: {
						   'Content-Type': 'application/json'
						}
					}).then(async function successCallback(response) {
						// this callback will be called asynchronously
						// when the response is available

						$("#ouAddSuccessAlert").show();
						

						$rootScope.$broadcast("refreshAccessControlTable");
						$scope.checkOrganizationalUnitName();
						$timeout(function () {
							$scope.loadingData = false;
						});

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

		}
	]
});
