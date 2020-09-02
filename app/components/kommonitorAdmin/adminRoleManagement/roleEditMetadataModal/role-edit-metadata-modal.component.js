angular.module('roleEditMetadataModal').component('roleEditMetadataModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleEditMetadataModal/role-edit-metadata-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$http', '__env', function RoleEditMetadataModalController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentRoleDataset;

		$scope.loadingData = false;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditRoleMetadata", function (event, roleDataset) {

			$scope.currentRoleDataset = roleDataset;

			$scope.resetRoleEditMetadataForm();

		});


		$scope.resetRoleEditMetadataForm = function () {

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#roleEditMetadataSuccessAlert").hide();
			$("#roleEditMetadataErrorAlert").hide();

			setTimeout(() => {
				$scope.$apply();
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
			}).then(function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available

				$scope.successMessagePart = $scope.currentRoleDataset.roleName;

				$rootScope.$broadcast("refreshRoleOverviewTable");
				$("#roleEditMetadataSuccessAlert").show();
				$scope.loadingData = false;

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


	}
	]
});
