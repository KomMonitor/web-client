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


		$scope.$on("onEditSpatialUnitUserRoles", function (event, spatialUnitDataset) {

			$scope.currentSpatialUnitDataset = spatialUnitDataset;
			console.log($scope.currentSpatialUnitDataset);

			$scope.resetSpatialUnitEditUserRolesForm();
			kommonitorMultiStepFormHelperService.registerClickHandler();

		});

	/* 	$scope.$on("availableRolesUpdate", function (event) {
			let allowedRoles = $scope.targetApplicableSpatialUnit ? $scope.targetApplicableSpatialUnit.allowedRoles : [];
			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditUserRolesManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, allowedRoles);
		}); */

		$scope.resetSpatialUnitEditUserRolesForm = function () {

			// hier, edited
			$scope.targetApplicableSpatialUnit = $scope.currentSpatialUnitDataset;

			if ($scope.targetApplicableSpatialUnit && $scope.targetApplicableSpatialUnit.allowedRoles) {
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditUserRolesManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.targetApplicableSpatialUnit.allowedRoles);
			}
			else {
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditUserRolesManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds());
			}

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#spatialUnitEditUserRolesSuccessAlert").hide();
			$("#spatialUnitEditUserRolesErrorAlert").hide();

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

			var patchBody = $scope.buildPatchBody_indicatorSpatialUnitRoles();

			// TODO verify input

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			/* $http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentSpatialUnitDataset.spatialUnitId + "/" + $scope.targetApplicableSpatialUnit.spatialUnitId,
				method: "PATCH",
				data: patchBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available

				$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentSpatialUnitDataset.spatialUnitId);
				$("#spatialUnitEditUserRolesSuccessAlert").show();
				$scope.loadingData = false;

			}, function errorCallback(error) {
				if (error.data) {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else {
					$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#spatialUnitEditUserRolesErrorAlert").show();
				$scope.loadingData = false;

				// setTimeout(function() {
				// 		$("#indicatorEditMetadataSuccessAlert").hide();
				// }, 3000);
			}); */
		};

		$scope.onChangeSelectedSpatialUnit = function (targetApplicableSpatialUnit) {

			if ($scope.targetApplicableSpatialUnit && $scope.targetApplicableSpatialUnit.allowedRoles) {
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditUserRolesManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, $scope.targetApplicableSpatialUnit.allowedRoles);
			}
			else {
				$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('spatialUnitEditUserRolesManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds());
			}
			
		};

		$scope.hideSuccessAlert = function () {
			$("#spatialUnitEditUserRolesSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function () {
			$("#spatialUnitEditUserRolesErrorAlert").hide();
		};

	}
	]
});
