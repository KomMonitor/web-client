angular.module('indicatorEditIndicatorSpatialUnitRolesModal').component('indicatorEditIndicatorSpatialUnitRolesModal', {
	templateUrl: "components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', 'kommonitorMultiStepFormHelperService', 
	'kommonitorDataGridHelperService', '$timeout',
		function IndicatorEditIndicatorSpatialUnitRolesModalController(kommonitorDataExchangeService, $scope, $rootScope, 
				$http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentIndicatorDataset;

		$scope.roleManagementTableOptions_indicatorMetadata = undefined;
		$scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries = undefined;

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

		$scope.refreshRoleManagementTable_indicatorMetadata = function() {
			let allowedRoles = $scope.currentGeoresourceDataset ? $scope.currentGeoresourceDataset.allowedRoles : [];
			$scope.roleManagementTableOptions_indicatorMetadata = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditRoleManagementTable', $scope.roleManagementTableOptions_indicatorMetadata, kommonitorDataExchangeService.accessControl, allowedRoles, true);
		}

		$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries = function(){
			if ($scope.targetApplicableSpatialUnit && $scope.targetApplicableSpatialUnit.allowedRoles) {
				$scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries, kommonitorDataExchangeService.accessControl, $scope.targetApplicableSpatialUnit.allowedRoles, true);
			}
			else {
				$scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries, kommonitorDataExchangeService.accessControl, kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds(), true);
			}
		}

		$scope.$on("availableRolesUpdate", function (event) {

			$scope.refreshRoleManagementTable_indicatorMetadata();
			$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
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

			$scope.refreshRoleManagementTable_indicatorMetadata();
			$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").hide();
			$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").hide();

			setTimeout(() => {
				$scope.$digest();
			}, 250);
		};

		$scope.editIndicatorSpatialUnitRoles = function () {

			if($scope.targetResourceCreatorRole !== undefined)
				if(!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?'))
					return;

			$scope.executeRequest_indicatorMetadataRoles();

			$scope.executeRequest_indicatorOwnership();

			$scope.executeRequest_indicatorSpatialUnitRoles();			
		};

		$scope.executeRequest_indicatorMetadataRoles = function(){
			$scope.loadingData = true;

			let putBody = {
				allowedRoles: kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions)
			}

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/permissions",
				method: "PUT",
				data: putBody,
				headers: {
				   'Content-Type': "application/json"
				}
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentIndicatorDataset.indicatorName;

					$rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", $scope.currentIndicatorDataset.indicatorId);
								
					$("#indicatorEditIndicatorSpatialUnitRolesSuccessAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

				}, function errorCallback(error) {
					$scope.errorMessagePart = "Fehler beim Aktualisieren der Metadaten-Zugriffsrechte. Fehler lautet: \n\n";
					if(error.data){							
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		}

		$scope.executeRequest_indicatorOwnership = function(){
			console.log("not yet implemented");
		}

		$scope.executeRequest_indicatorSpatialUnitRoles = function(){
			
			var putBody =
			{
				"allowedRoles": kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries)
			};

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/" + $scope.targetApplicableSpatialUnit.spatialUnitId + "/permissions",
				method: "PUT",
				data: putBody
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
				$scope.errorMessagePart = "Fehler beim Aktualisieren der Zugriffsrechte auf Zeitreihe der Raumeinheit " + $scope.targetApplicableSpatialUnit.spatialUnitName + ". Fehler lautet: \n\n";
				if (error.data) {
					$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
				}
				else {
					$scope.errorMessagePart += kommonitorDataExchangeService.syntaxHighlightJSON(error);
				}

				$("#indicatorEditIndicatorSpatialUnitRolesErrorAlert").show();
				$scope.loadingData = false;

				// setTimeout(function() {
				// 		$("#indicatorEditMetadataSuccessAlert").hide();
				// }, 3000);
			});
		}

		$scope.onChangeSelectedSpatialUnit = function (targetApplicableSpatialUnit) {

			$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
			
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
