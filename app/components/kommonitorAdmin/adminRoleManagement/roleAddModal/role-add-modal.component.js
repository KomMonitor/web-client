angular.module('roleAddModal').component('roleAddModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleAddModal/role-add-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$http', '__env',
		function SpatialUnitAddModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorKeycloakHelperService, $scope, $rootScope, $http, __env) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

			$scope.loadingData = false;
			$scope.roleName = undefined;
			$scope.roleNameInvalid = false;
			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

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

				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;

				setTimeout(() => {
					$scope.$apply();
				}, 250);
			};

			$scope.addRole = async function () {
				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;

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
				}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.roleName;

					$rootScope.$broadcast("refreshRoleOverviewTable");
					$("#roleAddSuccessAlert").show();
					$scope.loadingData = false;

				}, function errorCallback(error) {
					if (error.data) {
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else {
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#georesourceEditMetadataErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#georesourceEditMetadataSuccessAlert").hide();
					// }, 3000);
				});
			};

			$scope.hideSuccessAlert = function () {
				$("#roleAddSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function () {
				$("#roleAddErrorAlert").hide();
			};

		}
	]
});
