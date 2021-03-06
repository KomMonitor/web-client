angular.module('roleEditMetadataModal').component('roleEditMetadataModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleEditMetadataModal/role-edit-metadata-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$timeout', '$http', '__env', function RoleEditMetadataModalController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $timeout, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

		$scope.currentRoleDataset;
		$scope.oldRoleName = undefined;
		$scope.roleNameInvalid = false;

		$scope.keycloakAdminUserName = undefined;
		$scope.keycloakAdminUserPassword = undefined;

		$scope.loadingData = false;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditRoleMetadata", function (event, roleDataset) {

			$scope.currentRoleDataset = roleDataset;
			$scope.oldRoleName = roleDataset.roleName;

			$scope.resetRoleEditMetadataForm();

		});

		$scope.checkRoleName = function(){
			$scope.roleNameInvalid = false;
			kommonitorDataExchangeService.availableRoles.forEach(function(role){
				if (role.roleName === $scope.currentRoleDataset.roleName && role.roleId != $scope.currentRoleDataset.roleId){
					$scope.roleNameInvalid = true;
					return;
				}
			});
		};


		$scope.resetRoleEditMetadataForm = function () {

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

			$scope.keycloakAdminUserName = undefined;
			$scope.keycloakAdminUserPassword = undefined;

			$("#roleEditMetadataSuccessAlert").hide();
			$("#roleEditMetadataErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.editRoleMetadata = function () {

			var putBody =
			{
				"roleName": $scope.currentRoleDataset.roleName
			};

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/roles/" + $scope.currentRoleDataset.roleId,
				method: "PUT",
				data: putBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(async function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available

				$scope.successMessagePart = $scope.currentRoleDataset.roleName;
				
				$("#roleEditMetadataSuccessAlert").show();
				$timeout(function(){
				
					$scope.loadingData = false;
				});	

				try {							
					await kommonitorKeycloakHelperService.renameExistingRole($scope.oldRoleName, $scope.currentRoleDataset.roleName, $scope.keycloakAdminUserName, $scope.keycloakAdminUserPassword);
					await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles($scope.keycloakAdminUserName, $scope.keycloakAdminUserPassword);	
					$("#keycloakRoleEditSuccessAlert").show();
				} catch (error) {
					if (error.data) {
						$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else {
						$scope.keycloakErrorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$timeout(function(){
				
						$("#keycloakRoleEditErrorAlert").show();
					$scope.loadingData = false;
					});
				}

				$rootScope.$broadcast("refreshRoleOverviewTable", "edit", $scope.currentRoleDataset.roleId);

			}, function errorCallback(error) {
				if (error.data) {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#roleEditMetadataErrorAlert").show();
				$scope.loadingData = false;
			});
		};


		$scope.hideSuccessAlert = function () {
			$("#roleEditMetadataSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#roleEditMetadataErrorAlert").hide();
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
