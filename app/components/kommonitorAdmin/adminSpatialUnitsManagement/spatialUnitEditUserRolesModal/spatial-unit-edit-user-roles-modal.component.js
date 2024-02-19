angular.module('spatialUnitEditUserRolesModal').component('spatialUnitEditUserRolesModal', {
	templateUrl: "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditUserRolesModal/spatial-unit-edit-user-roles-modal.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', 'kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService',
		function SpatialUnitEditUserRolesModalController(kommonitorDataExchangeService, $scope, $rootScope, 
				$http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentSpatialUnitDataset;

		$scope.roleManagementTableOptions = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.spatialUnitTargetUserRoleFilter = undefined;

		$scope.targetResourceCreatorRole = undefined;

		$scope.$on("onEditSpatialUnitUserRoles", function (event, spatialUnitDataset) {

			$scope.currentSpatialUnitDataset = spatialUnitDataset;

			$scope.availableRoles = redefineAvailableRoles();
			$scope.$apply();

			$scope.resetSpatialUnitEditUserRolesForm();
			kommonitorMultiStepFormHelperService.registerClickHandler('spatialUnitEditUserRolesForm');
		});

		$scope.refreshRoleManagementTable = function() {
			let allowedRoles = $scope.currentSpatialUnitDataset ? $scope.currentSpatialUnitDataset.allowedRoles : [];
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, allowedRoles, true);
		}

		$scope.$on("availableRolesUpdate", function (event) {
			$scope.refreshRoleManagementTable();
		});

		$scope.onChangeSelectedTargetCreatorRole = function(targetResourceCreatorRole) {

			$scope.targetResourceCreatorRole = targetResourceCreatorRole;
			console.log("Target creator role selected to be ",$scope.targetResourceCreatorRole);
		}	
		
		function redefineAvailableRoles() {

			let tempRoles = [];
			kommonitorDataExchangeService.availableRoles.forEach(role => {
				if(role.permissionLevel == 'creator')
					tempRoles.push(role);
			});

			return tempRoles;
		}

		$scope.resetSpatialUnitEditUserRolesForm = function () {

			$scope.targetResourceCreatorRole = undefined;
			document.getElementById('targetUserRoleSelect').selectedIndex = 0;

			$scope.refreshRoleManagementTable();
			$scope.spatialUnitTargetUserRoleFilter = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#spatialUnitEditUserRolesSuccessAlert").hide();
			$("#spatialUnitEditUserRolesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.editSpatialUnitEditUserRolesForm = function(){

			if($scope.targetResourceCreatorRole !== undefined)
			if(!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?'))
				return;

			// TODO FIXME prepare request to update role-based access
			let patchBody = {};
			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				patchBody.allowedRoles.push(roleId);
			}

			// TODO all other to go next
		}

		$scope.hideSuccessAlert = function () {
			$("#spatialUnitEditUserRolesSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#spatialUnitEditUserRolesErrorAlert").hide();
		};

	}
	]
});
