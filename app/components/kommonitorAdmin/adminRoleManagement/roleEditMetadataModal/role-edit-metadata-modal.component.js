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

		$scope.parentOrganizationalUnitFilter = undefined;
		$scope.parentOrganizationalUnit = undefined;
		$scope.parentOrganizationalUnit_current = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditOrganizationalUnitMetadata", function (event, organizationalUnit) {

			$scope.current = organizationalUnit;
			$scope.old.name = organizationalUnit.name;

			$scope.resetOrganizationalUnitEditMetadataForm();
		});

		// Checks for duplicate names
		// Disallowed to prevent confusion
		$scope.checkOrganizationalUnitName = function(){
			$scope.nameInvalid = false;
			kommonitorDataExchangeService.accessControl.forEach(function(ou){
				if (ou.name === $scope.current.name && ou.organizationalUnitId != $scope.current.organizationalUnitId){
					$scope.nameInvalid = true;
					return;
				}
			});
		};


		$scope.resetOrganizationalUnitEditMetadataForm = function () {

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

			$scope.parentOrganizationalUnitFilter = undefined;
			$scope.parentOrganizationalUnit = undefined;
			$scope.parentOrganizationalUnit_current = undefined;
			if ($scope.current.parentId && $scope.current.parentId != ""){
				$scope.parentOrganizationalUnit = kommonitorDataExchangeService.getAccessControlById($scope.current.parentId);
				$scope.parentOrganizationalUnit_current = JSON.parse(JSON.stringify($scope.parentOrganizationalUnit));
			}

			$("#editOuMetadataSuccessAlert").hide();
			$("#editOuMetadataErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.onChangeParentOrganizationalUnit = function(){
			// let parentId = $scope.parentOrganizationalUnit ? $scope.parentOrganizationalUnit.organizationalUnitId : "";			
		}

		$scope.editRoleMetadata = function () {

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
					//await kommonitorKeycloakHelperService.updateExistingGroup($scope.current, $scope.old.name, $scope.parentOrganizationalUnit);					

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
		};


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
