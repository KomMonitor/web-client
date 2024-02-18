angular.module('indicatorEditIndicatorSpatialUnitRolesModal').component('indicatorEditIndicatorSpatialUnitRolesModal', {
	templateUrl: "components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', 'kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService',
		function IndicatorEditIndicatorSpatialUnitRolesModalController(kommonitorDataExchangeService, $scope, $rootScope, 
				$http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentIndicatorDataset;

		$scope.roleManagementTableOptions = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.indicatorTargetUserRoleFilter = undefined;

		$scope.targetResourceCreatorRole = undefined;

		$scope.$on("onEditIndicatorSpatialUnitRoles", function (event, indicatorDataset) {

			$scope.currentIndicatorDataset = indicatorDataset;

			$scope.availableRoles = redefineAvailableRoles();
			$scope.$apply();

			$scope.resetIndicatorEditIndicatorSpatialUnitRolesForm();
			kommonitorMultiStepFormHelperService.registerClickHandler("indicatorEditIndicatorSpatialUnitRolesForm");

		});

		$scope.$on("availableRolesUpdate", function (event) {
			let allowedRoles = $scope.targetApplicableSpatialUnit ? $scope.targetApplicableSpatialUnit.allowedRoles : [];
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, allowedRoles, true);
		});

		$scope.onChangeSelectedTargetCreatorRole = function(targetResourceCreatorRole) {

			$scope.targetResourceCreatorRole = targetResourceCreatorRole;
			console.log("Target creator role selected to be:",$scope.targetResourceCreatorRole);
		}

		function redefineAvailableRoles() {

			let tempRoles = [];
			kommonitorDataExchangeService.availableRoles.forEach(role => {
				if(role.permissionLevel == 'creator')
					tempRoles.push(role);
			});

			return tempRoles;
		}

		$scope.resetIndicatorEditIndicatorSpatialUnitRolesForm = function () {

			$scope.targetResourceCreatorRole = undefined;
			document.getElementById('targetUserRoleSelect').selectedIndex = 0;

			$scope.indicatorTargetUserRoleFilter = undefined;

			$scope.targetApplicableSpatialUnit = $scope.currentIndicatorDataset.applicableSpatialUnits[0];

			if ($scope.targetApplicableSpatialUnit && $scope.targetApplicableSpatialUnit.allowedRoles) {
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.targetApplicableSpatialUnit.allowedRoles, true);
			}
			else {
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds(), true);
			}

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").hide();
			$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.buildPatchBody_indicatorSpatialUnitRoles = function () {
			var patchBody =
			{
				"allowedRoles": []
			}

			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				patchBody.allowedRoles.push(roleId);
			}

			return patchBody;
		};

		$scope.editIndicatorSpatialUnitRoles = function () {

			if($scope.targetResourceCreatorRole !== undefined)
				if(!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?'))
					return;

			var patchBody = $scope.buildPatchBody_indicatorSpatialUnitRoles();

			// TODO verify input

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/" + $scope.targetApplicableSpatialUnit.spatialUnitId,
				method: "PATCH",
				data: patchBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available

				$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
				$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").show();
				$scope.loadingData = false;

			}, function errorCallback(error) {
				if (error.data) {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").show();
				$scope.loadingData = false;

				// setTimeout(function() {
				// 		$("#indicatorEditMetadataSuccessAlert").hide();
				// }, 3000);
			});
		};

		$scope.onChangeSelectedSpatialUnit = function (targetApplicableSpatialUnit) {

			if ($scope.targetApplicableSpatialUnit && $scope.targetApplicableSpatialUnit.allowedRoles) {
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.targetApplicableSpatialUnit.allowedRoles, true);
			}
			else {
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds(), true);
			}
			
		};

		$scope.hideSuccessAlert = function () {
			$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").hide();
		};

	}
	]
});
