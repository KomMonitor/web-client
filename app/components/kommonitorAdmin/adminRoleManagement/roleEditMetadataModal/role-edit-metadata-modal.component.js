angular.module('roleEditMetadataModal').component('roleEditMetadataModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleEditMetadataModal/role-edit-metadata-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$timeout', '$http', '__env', function RoleEditMetadataModalController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $timeout, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

		$scope.current = {};
		$scope.old = {};
		$scope.old.name = undefined;
		$scope.nameInvalid = false;

		$scope.keycloakAdminUserName = undefined;
		$scope.keycloakAdminUserPassword = undefined;

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
		$scope.checkRoleName = function(){
			$scope.nameInvalid = false;
			kommonitorDataExchangeService.accessControl.forEach(function(ou){
				if (ou.name === $scope.current.name && ou.organizationalUnitId != $scope.current.organizationalUnitId){
					$scope.nameInvalid = true;
					return;
				}
			});
		};


		$scope.resetRoleEditMetadataForm = function () {

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

			$scope.keycloakAdminUserName = undefined;
			$scope.keycloakAdminUserPassword = undefined;

			$("#editMetadataSuccessAlert").hide();
			$("#editMetadataErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.editRoleMetadata = function () {

			var putBody =
			{
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
				$timeout(function(){
				
					$scope.loadingData = false;
				});	

				try {
					console.log("TODO(specki): implement kc sync")							
					//await kommonitorKeycloakHelperService.renameExistingRole($scope.oldRoleName, $scope.currentRoleDataset.roleName, $scope.keycloakAdminUserName, $scope.keycloakAdminUserPassword);
					//await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles($scope.keycloakAdminUserName, $scope.keycloakAdminUserPassword);	
					$("#keycloakRoleEditErrorAlert").show();
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
