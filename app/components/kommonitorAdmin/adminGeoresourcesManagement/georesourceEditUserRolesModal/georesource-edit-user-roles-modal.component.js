angular.module('georesourceEditUserRolesModal').component('georesourceEditUserRolesModal', {
	templateUrl: "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditUserRolesModal/georesource-edit-user-roles-modal.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', 'kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService',
		function GeoresourceEditUserRolesModalController(kommonitorDataExchangeService, $scope, $rootScope, 
				$http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentGeoresourceDataset;

		$scope.roleManagementTableOptions = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.georesourcesTargetUserRoleFilter = undefined;

		$scope.targetResourceCreatorRole = undefined;

		$scope.$on("onEditGeoresourcesUserRoles", function (event, georesourceDataset) {

			$scope.currentGeoresourceDataset = georesourceDataset;
			console.log($scope.currentGeoresourceDataset)

			$scope.availableRoles = redefineAvailableRoles();
			$scope.$apply();

			$scope.resetGeoresourceEditUserRolesForm();
			kommonitorMultiStepFormHelperService.registerClickHandler('georesourceEditUserRolesForm');
		});

		$scope.refreshRoleManagementTable = function() {
			let allowedRoles = $scope.currentGeoresourceDataset ? $scope.currentGeoresourceDataset.allowedRoles : [];
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('georesourceEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, allowedRoles, true);
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

		$scope.resetGeoresourceEditUserRolesForm = function () {

			$scope.targetResourceCreatorRole = undefined;
			document.getElementById('targetUserRoleSelect').selectedIndex = 0;

			$scope.refreshRoleManagementTable();
			$scope.georesourcesTargetUserRoleFilter = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#RolesSuccessAlert").hide();
			$("#georesourceEditUserRolesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.editGeoresourceEditUserRolesForm = function(){

			if($scope.targetResourceCreatorRole !== undefined)
			if(!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?'))
				return;

			// TODO FIXME prepare request to update role-based access
			let patchBody = {};
			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				patchBody.allowedRoles.push(roleId);
			}

			// all other to go next
		}

		$scope.hideSuccessAlert = function () {
			$("#georesourceEditUserRolesSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#georesourceEditUserRolesErrorAlert").hide();
		};

	}
	]
});
