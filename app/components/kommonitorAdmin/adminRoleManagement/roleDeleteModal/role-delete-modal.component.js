angular.module('roleDeleteModal').component('roleDeleteModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleDeleteModal/role-delete-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$http', '__env', '$q', '$timeout', function RoleDeleteModalController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $http, __env, $q, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

		$scope.datasetsToDelete = [];

		$scope.loadingData = false;

		$scope.keycloakAdminUserName = undefined;
		$scope.keycloakAdminUserPassword = undefined;

		$scope.successfullyDeletedDatasets = [];
		$scope.failedDatasetsAndErrors = [];

		$scope.deleteCorrespondingKeycloakRole = false;

		$scope.affectedSpatialUnits = [];
		$scope.affectedGeoresources = [];
		$scope.affectedIndicators = [];

		$scope.$on("onDeleteRoles", function (event, datasets) {

			$scope.datasetsToDelete = datasets;

			$scope.resetRolesDeleteForm();

		});


		$scope.resetRolesDeleteForm = function () {

			$scope.keycloakAdminUserName = undefined;
			$scope.keycloakAdminUserPassword = undefined;

			$scope.successfullyDeletedDatasets = [];
			$scope.failedDatasetsAndErrors = [];
			$scope.affectedSpatialUnits = $scope.gatherAffectedSpatialUnits();
			$scope.affectedGeoresources = $scope.gatherAffectedGeoresources();
			$scope.affectedIndicators = $scope.gatherAffectedIndicators();
			$("#rolesDeleteSuccessAlert").hide();
			$("#rolesDeleteErrorAlert").hide();
		};

		$scope.gatherAffectedSpatialUnits = function () {
			$scope.affectedSpatialUnits = [];

			kommonitorDataExchangeService.availableSpatialUnits.forEach(function (spatialUnit) {
				var allowedRoles = spatialUnit.allowedRoles;

				for (const datasetToDelete of $scope.datasetsToDelete) {
					if (allowedRoles.includes(datasetToDelete.roleId)) {
						$scope.affectedSpatialUnits.push(spatialUnit);
						break;
					}
				}
			});

			return $scope.affectedSpatialUnits;
		};

		$scope.gatherAffectedGeoresources = function () {
			$scope.affectedGeoresources = [];

			kommonitorDataExchangeService.availableGeoresources.forEach(function (georesource) {
				var allowedRoles = georesource.allowedRoles;

				for (const datasetToDelete of $scope.datasetsToDelete) {
					if (allowedRoles.includes(datasetToDelete.roleId)) {
						$scope.affectedGeoresources.push(georesource);
						break;
					}
				}
			});

			return $scope.affectedGeoresources;
		};

		$scope.gatherAffectedIndicators = function () {
			$scope.affectedIndicators = [];

			kommonitorDataExchangeService.availableIndicators.forEach(function (indicator) {
				var allowedRoles_metadata = indicator.allowedRoles;

				for (const datasetToDelete of $scope.datasetsToDelete) {
					if (allowedRoles_metadata.includes(datasetToDelete.roleId)) {
						$scope.affectedIndicators.push(indicator);
						break;
					}

					var applicableSpatialUnits = indicator.applicableSpatialUnits;
					for (const applicableSpatialUnit of applicableSpatialUnits) {
						if (applicableSpatialUnit.allowedRoles.includes(datasetToDelete.roleId)) {
							$scope.affectedIndicators.push(indicator);
							break;
						}
					}
				}
			});

			return $scope.affectedIndicators;
		};

		$scope.deleteRoles = function () {

			$scope.loadingData = true;

			var deletePromises = [];

			$scope.datasetsToDelete.forEach(function (dataset) {
				deletePromises.push($scope.getDeleteDatasetPromise(dataset));
			});

			$q.all(deletePromises).then(async function successCallback(successArray) {
				//

				if ($scope.failedDatasetsAndErrors.length > 0) {
					// error handling
					$("#rolesDeleteErrorAlert").show();

					$timeout(function(){
				
						$scope.loadingData = false;
					});	
				}
				if ($scope.successfullyDeletedDatasets.length > 0) {
					$("#rolesDeleteSuccessAlert").show();

					// fetch mMetada again as roles were deleted
					await kommonitorDataExchangeService.fetchRolesMetadata();
					// refresh role overview table
					$rootScope.$broadcast("refreshRoleOverviewTable", "delete", $scope.successfullyDeletedDatasets.map(dataset => dataset.roleId));

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

					$timeout(function(){
				
						$scope.loadingData = false;
					});	
				}
			}, function errorCallback(errorArray) {

				$("#rolesDeleteErrorAlert").show();
				// if ($scope.successfullyDeletedDatasets.length > 0){
				// 	$("#georesourcesDeleteSuccessAlert").show();
				// }

				$rootScope.$broadcast("refreshRoleOverviewTable");
				$scope.loadingData = false;
			});

		};

		$scope.getDeleteDatasetPromise = function (dataset) {
			return $http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/roles/" + dataset.roleId,
				method: "DELETE"
			}).then(function successCallback(response) {
				$scope.successfullyDeletedDatasets.push(dataset);

				// remove entry from array
				var index = -1;

				for (var i = 0; i < kommonitorDataExchangeService.availableRoles.length; i++) {
					if (kommonitorDataExchangeService.availableRoles[i].roleId === dataset.roleId) {
						index = i;
						break;
					}
				}

				if (index > -1) {
					kommonitorDataExchangeService.availableRoles.splice(index, 1);
				}

				// delete role in keycloak
				if($scope.deleteCorrespondingKeycloakRole){
					$scope.tryDeleteKeycloakRole(dataset);
				}

			}, function errorCallback(error) {
				if (error.data) {
					$scope.failedDatasetsAndErrors.push([dataset, kommonitorDataExchangeService.syntaxHighlightJSON(error.data)]);
				}
				else {
					$scope.failedDatasetsAndErrors.push([dataset, kommonitorDataExchangeService.syntaxHighlightJSON(error)]);
				}
			});
		};

		$scope.tryDeleteKeycloakRole = async function(roleMetadata){
			try {	
				kommonitorKeycloakHelperService.deleteRole(roleMetadata.roleName, $scope.keycloakAdminUserName, $scope.keycloakAdminUserPassword);

				await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles($scope.keycloakAdminUserName, $scope.keycloakAdminUserPassword);
			} catch (error) {
				if (error.data) {
					$scope.failedDatasetsAndErrors.push([dataset, kommonitorDataExchangeService.syntaxHighlightJSON(error.data)]);
				}
				else {
					$scope.failedDatasetsAndErrors.push([dataset, kommonitorDataExchangeService.syntaxHighlightJSON(error)]);
				}
			} 
		};

		$scope.hideSuccessAlert = function () {
			$("#rolesDeleteSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#rolesDeleteErrorAlert").hide();
		};

	}
	]
});
