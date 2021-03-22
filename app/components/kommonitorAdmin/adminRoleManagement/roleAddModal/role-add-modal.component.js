angular.module('roleAddModal').component('roleAddModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleAddModal/role-add-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$timeout', '$http', '__env',
		function SpatialUnitAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorKeycloakHelperService, $scope, $rootScope, $timeout, $http, __env) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
			this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

			$scope.loadingData = false;
			$scope.roleName = undefined;
			$scope.roleNameInvalid = false;
			$scope.errorMessagePart = undefined;
			$scope.keycloakErrorMessagePart = undefined;

			$scope.checkRoleName = function(){
				$scope.roleNameInvalid = false;
				kommonitorDataExchangeService.availableRoles.forEach(function(role){
					if (role.roleName === $scope.roleName){
						$scope.roleNameInvalid = true;
						return;
					}
				});
			};

			$scope.resetRoleAddForm = function () {
				$scope.roleName = undefined;

				$scope.errorMessagePart = undefined;
				$scope.keycloakErrorMessagePart = undefined;

				setTimeout(() => {
					$scope.$digest();
				}, 250);
			};

			$scope.addRole = async function () {
				$scope.errorMessagePart = undefined;
				$scope.keycloakErrorMessagePart = undefined;

				try {
					var postBody =
					{
						"roleName": $scope.roleName
					};

					$scope.loadingData = true;

					$http({
						url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/roles",
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
							await kommonitorKeycloakHelperService.postNewRole($scope.roleName);	
							await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles();
							$("#keycloakRoleAddSuccessAlert").show();
						} catch (error) {
							if (error.data) {
								$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
							}
							else {
								$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
							}		

							$timeout(function(){
				
								$("#keycloakRoleAddErrorAlert").show();
								$scope.loadingData = false;
							});
						}

						$rootScope.$broadcast("refreshRoleOverviewTable");						
						$timeout(function(){
				
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

			$scope.hideKeycloakErrorAlert = function(){
				$("#keycloakRoleAddErrorAlert").hide();
			};

		}
	]
});
