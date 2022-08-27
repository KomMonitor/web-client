angular.module('roleAddModal').component('roleAddModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleAddModal/role-add-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$timeout', '$http', '__env',
		function SpatialUnitAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorKeycloakHelperService, $scope, $rootScope, $timeout, $http, __env) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
			this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

			$scope.loadingData = false;
			$scope.newOrganizationalUnit = {};

			$scope.nameInvalid = false;
			$scope.errorMessagePart = undefined;
			$scope.keycloakErrorMessagePart = undefined;

			$scope.checkRoleName = function () {
				$scope.nameInvalid = kommonitorDataExchangeService.accessControl.some(ou => ou.name === $scope.newOrganizationalUnit.name);
			};

			
			$scope.resetRoleAddForm = function () {
				$scope.newOrganizationalUnit = {};

				$scope.errorMessagePart = undefined;
				$scope.keycloakErrorMessagePart = undefined;
				$scope.checkRoleName();

				setTimeout(() => {
					$scope.$digest();
				}, 250);
			};

			$scope.addRole = async function () {
				$scope.errorMessagePart = undefined;
				$scope.keycloakErrorMessagePart = undefined;

				let roleId = "";
				try {
					var postBody =
					{
						"name": $scope.newOrganizationalUnit.name,
						"description": $scope.newOrganizationalUnit.description,
						"contact": $scope.newOrganizationalUnit.contact,
					};

					$scope.loadingData = true;

					$http({
						url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits",
						method: "POST",
						data: postBody
						// headers: {
						//    'Content-Type': 'application/json'
						// }
					}).then(async function successCallback(response) {
						// this callback will be called asynchronously
						// when the response is available

						$("#roleAddSuccessAlert").show();
						try {
							// The fetch API does not expose the Location Header for XSS protection
							// So we refetch all metadata
							await kommonitorDataExchangeService.fetchAccessControlMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);
							kommonitorDataExchangeService.accessControl.forEach(function (entry) {
								if (entry.name === $scope.newOrganizationalUnit.name) {
									$scope.newOrganizationalUnit = JSON.parse(JSON.stringify(entry))
								}
							});

							await kommonitorKeycloakHelperService.postNewRoles($scope.newOrganizationalUnit.name);
							await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles();
							$("#keycloakRoleAddSuccessAlert").show();
						} catch (error) {
							if (error.data) {
								$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
							}
							else {
								$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
							}

							$timeout(function () {

								$("#keycloakRoleAddErrorAlert").show();
								$scope.loadingData = false;
							});
						}

						$rootScope.$broadcast("refreshAccessControlTable", "add", $scope.newOrganizationalUnit.organizationalUnitId);
						$scope.checkRoleName();
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

					$("#roleAddErrorAlert").show();
					$scope.loadingData = false;
				}
			};

			$scope.hideSuccessAlert = function () {
				$("#roleAddSuccessAlert").hide();
			};

			$scope.hideKeycloakSuccessAlert = function () {
				$("#keycloakRoleAddSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function () {
				$("#roleAddErrorAlert").hide();
			};

			$scope.hideKeycloakErrorAlert = function () {
				$("#keycloakRoleAddErrorAlert").hide();
			};

		}
	]
});
