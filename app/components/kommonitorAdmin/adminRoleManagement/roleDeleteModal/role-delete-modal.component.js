angular.module('roleDeleteModal').component('roleDeleteModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleDeleteModal/role-delete-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$http', '__env', '$q', '$timeout', function RoleDeleteModalController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $http, __env, $q, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;

		$scope.elementsToDelete = [];

		$scope.loadingData = false;

		$scope.successfullyDeletedDatasets = [];
		$scope.failedDatasetsAndErrors = [];

		$scope.deleteCorrespondingKeycloakGroup = false;

		$scope.affectedSpatialUnits = [];
		$scope.affectedGeoresources = [];
		$scope.affectedIndicators = [];
		$scope.affectedSpatialUnits = [];

		$scope.$on("onDeleteOrganizationalUnit", function (event, datasets) {

			const original_size = datasets.length;
			datasets = datasets.filter(org => org.name != "public" && org.name != "kommonitor")
			if (datasets.length < original_size) {
				$scope.failedDatasetsAndErrors.push([{"name": "public / kommonitor"}, "System Organisationseinheiten können nicht gelöscht werden! Die betroffene Einheit wurde aus der Liste entfernt."]);
				$("#ouDeleteErrorAlert").show();
			}
			$scope.elementsToDelete = datasets;
			$scope.resetOrganizationalUnitsDeleteForm();
		});


		$scope.resetOrganizationalUnitsDeleteForm = function () {

			$scope.successfullyDeletedDatasets = [];
			$scope.failedDatasetsAndErrors = [];
			$scope.affectedSpatialUnits = $scope.gatherAffectedSpatialUnits();
			$scope.affectedGeoresources = $scope.gatherAffectedGeoresources();
			$scope.affectedIndicators = $scope.gatherAffectedIndicators();
			$("#ouDeleteSuccessAlert").hide();
			$("#ouDeleteErrorAlert").hide();
		};

		$scope.gatherAffectedSpatialUnits = function () {
			$scope.affectedSpatialUnits = [];

			kommonitorDataExchangeService.availableSpatialUnits.forEach(function (spatialUnit) {
				var permissions = spatialUnit.permissions;
				
				for (const datasetToDelete of $scope.elementsToDelete) {

					var userRoles = datasetToDelete.roles.map(e => e.roleId);
					
					if(permissions.some(i => userRoles.includes(i))) {

						let connectedItems = [];
						permissions.forEach(role => {
							
							if(datasetToDelete.roles.filter(e => e.roleId==role).length==1)
								connectedItems.push(`${datasetToDelete.name}-${datasetToDelete.roles.filter(e => e.roleId==role).map(e => { return e.permissionLevel})[0]}`);
						});

						spatialUnit.connectedItems = connectedItems.join(', ');

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
				var permissions = georesource.permissions;

				for (const datasetToDelete of $scope.elementsToDelete) {
					
					var userRoles = datasetToDelete.roles.map(e => e.roleId);

					if(permissions.some(i => userRoles.includes(i))) {

						let connectedItems = [];
						permissions.forEach(role => {
							
							if(datasetToDelete.roles.filter(e => e.roleId==role).length==1)
								connectedItems.push(`${datasetToDelete.name}-${datasetToDelete.roles.filter(e => e.roleId==role).map(e => { return e.permissionLevel})[0]}`);
						});

						georesource.connectedItems = connectedItems.join(', ');

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
				var permissions_metadata = indicator.permissions;

				let temp_indicator = indicator;
				let found = false;
				for (const datasetToDelete of $scope.elementsToDelete) {

					var userRoles = datasetToDelete.roles.map(e => e.roleId);
					var applicableSpatialUnits = temp_indicator.applicableSpatialUnits;

					let connectedItems = [];
					if(permissions_metadata.some(i => userRoles.includes(i))) {

						permissions_metadata.forEach(role => {
							
							if(datasetToDelete.roles.filter(e => e.roleId==role).length==1)
								connectedItems.push(`${datasetToDelete.name}-${datasetToDelete.roles.filter(e => e.roleId==role).map(e => { return e.permissionLevel})[0]}`);
						});

						temp_indicator.connectedItems = connectedItems.join(', ');
						found = true;
					}


					// spatial units and connected spatial units
					let connectedSpatialUnits = [];
					for (const applicableSpatialUnit of applicableSpatialUnits) {

						var permissions = applicableSpatialUnit.permissions;

						if(permissions.some(i => userRoles.includes(i))) {

							let connectedSpatialItem = {
								name: applicableSpatialUnit.spatialUnitName,
								ids:[]
							};

							permissions.forEach(role => {
								
								if(datasetToDelete.roles.filter(e => e.roleId==role).length==1) {
									if(!found)
										connectedItems.push(`${datasetToDelete.name}-${datasetToDelete.roles.filter(e => e.roleId==role).map(e => { return e.permissionLevel})[0]}`);

									connectedSpatialItem.ids.push(`${datasetToDelete.name}-${datasetToDelete.roles.filter(e => e.roleId==role).map(e => { return e.permissionLevel})[0]}`);
								}
							});

							// only if no entry in base indicator
							if(!found) {
								temp_indicator.connectedItems = connectedItems.join(', ');
								found = true;
							}

							connectedSpatialUnits.push(connectedSpatialItem);
						}
					}

					temp_indicator.connectedSpatialUnits = connectedSpatialUnits; 
					
					if(found) {
						$scope.affectedIndicators.push(temp_indicator);
						break; 
					}
				}
			});

			return $scope.affectedIndicators;
		};

		

		$scope.deleteOrganizationalUnits = function () {

			$scope.loadingData = true;

			var deletePromises = [];

			$scope.elementsToDelete.forEach(function (dataset) {
				deletePromises.push($scope.getDeleteDatasetPromise(dataset));
			});

			$q.all(deletePromises).then(async function successCallback(successArray) {
				//

				if ($scope.failedDatasetsAndErrors.length > 0) {
					// error handling
					$("#ouDeleteErrorAlert").show();

					$timeout(function(){
				
						$scope.loadingData = false;
					});	
				}
				if ($scope.successfullyDeletedDatasets.length > 0) {
					$("#ouDeleteSuccessAlert").show();

					// fetch mMetada again as ou were deleted
					
					await kommonitorDataExchangeService.fetchAccessControlMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);
					// refresh ou overview table
					$rootScope.$broadcast("refreshAccessControlTable", "delete", $scope.successfullyDeletedDatasets.map(dataset => dataset.organizationalUnitId));

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

					$timeout(function(){
				
						$scope.loadingData = false;
					});	
				}
			}, function errorCallback(errorArray) {

				$("#ouDeleteErrorAlert").show();
				// if ($scope.successfullyDeletedDatasets.length > 0){
				// 	$("#georesourcesDeleteSuccessAlert").show();
				// }

				$rootScope.$broadcast("refreshAccessControlTable");
				$scope.loadingData = false;
			});

		};

		$scope.getDeleteDatasetPromise = function (dataset) {
			return $http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/organizationalUnits/" + dataset.organizationalUnitId,
				method: "DELETE"
			}).then(function successCallback(response) {
				$scope.successfullyDeletedDatasets.push(dataset);

				// remove entry from array
				var index = -1;

				for (var i = 0; i < kommonitorDataExchangeService.availableRoles.length; i++) {
					if (kommonitorDataExchangeService.availableRoles[i].organizationalUnitId === dataset.organizationalUnitId) {
						index = i;
						break;
					}
				}

				if (index > -1) {
					kommonitorDataExchangeService.availableRoles.splice(index, 1);
				}

				// delete role in keycloak
				if($scope.deleteCorrespondingKeycloakGroup){
					// Data Management API deletes group and roles, so nothing to do here, anymore
					// However, Data Management API maybe later provides a query parameter to control Keycloak entity handling
					// $scope.tryDeleteKeycloakGroup(dataset);
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

		$scope.tryDeleteKeycloakGroup = async function(organizationalUnit){
			try {	
				kommonitorKeycloakHelperService.deleteGroup(organizationalUnit);
				await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles();
				// await kommonitorKeycloakHelperService.fetchAndSetKeycloakGroups();
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
			$("#ouDeleteSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#ouDeleteErrorAlert").hide();
		};

	}
	]
});
