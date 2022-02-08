angular.module('indicatorEditIndicatorSpatialUnitRolesModal').component('indicatorEditIndicatorSpatialUnitRolesModal', {
	templateUrl: "components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', function IndicatorEditIndicatorSpatialUnitRolesModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentIndicatorDataset;

		$scope.duallist = { duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, null, "roleName") };
		$scope.allowedRoleNames = { selectedItems: [] };

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;


		$scope.$on("onEditIndicatorSpatialUnitRoles", function (event, indicatorDataset) {

			$scope.currentIndicatorDataset = indicatorDataset;

			$scope.resetIndicatorEditIndicatorSpatialUnitRolesForm();

		});

		$scope.$on("availableRolesUpdate", function (event) {
			$scope.allowedRoleNames = { selectedItems: [] };
			$scope.duallist = { duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, null, "roleName") };
		});

		$scope.resetIndicatorEditIndicatorSpatialUnitRolesForm = function () {

			$scope.targetApplicableSpatialUnit = $scope.currentIndicatorDataset.applicableSpatialUnits[0];

			if ($scope.targetApplicableSpatialUnit && $scope.targetApplicableSpatialUnit.allowedRoles) {
				var selectedRolesMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleIds($scope.targetApplicableSpatialUnit.allowedRoles);
				$scope.duallist = { duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, selectedRolesMetadata, "roleName") };
				$scope.allowedRoleNames = { selectedItems: $scope.duallist.duallistRoleOptions.selectedItems };
			}
			else {
				$scope.duallist = { duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, null, "roleName") };
				$scope.allowedRoleNames = { selectedItems: [] };
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

			for (const roleDuallistItem of $scope.allowedRoleNames.selectedItems) {
				var roleMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleName(roleDuallistItem.name);
				patchBody.allowedRoles.push(roleMetadata.roleId);
			}

			return patchBody;
		};

		$scope.editIndicatorSpatialUnitRoles = function () {

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
				var selectedRolesMetadata = kommonitorDataExchangeService.getRoleMetadataForRoleIds($scope.targetApplicableSpatialUnit.allowedRoles);
				$scope.duallist = { duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, selectedRolesMetadata, "roleName") };
				$scope.allowedRoleNames = { selectedItems: $scope.duallist.duallistRoleOptions.selectedItems };
			}
			else {
				$scope.duallist = { duallistRoleOptions: kommonitorDataExchangeService.initializeRoleDualListConfig(kommonitorDataExchangeService.availableRoles, null, "roleName") };
				$scope.allowedRoleNames = { selectedItems: [] };
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
