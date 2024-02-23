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

		$scope.ownerOrgFilter = undefined;

		$scope.ownerOrganization = undefined;

		$scope.$on("onEditIndicatorSpatialUnitRoles", function (event, indicatorDataset) {

			$scope.currentIndicatorDataset = indicatorDataset;

			
			$scope.$apply();

			$scope.resetIndicatorEditIndicatorSpatialUnitRolesForm();
			kommonitorMultiStepFormHelperService.registerClickHandler("indicatorEditIndicatorSpatialUnitRolesForm");

		});

		$scope.refreshRoleManagementTable_indicatorMetadata = function() {
			let permissions = $scope.currentIndicatorDataset ? $scope.currentIndicatorDataset.permissions : [];
			$scope.roleManagementTableOptions_indicatorMetadata = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditRoleManagementTable', $scope.roleManagementTableOptions_indicatorMetadata, kommonitorDataExchangeService.accessControl, permissions, true);
		}

		$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries = function(){
			if ($scope.targetApplicableSpatialUnit && $scope.targetApplicableSpatialUnit.permissions) {
				$scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries, kommonitorDataExchangeService.accessControl, $scope.targetApplicableSpatialUnit.permissions, true);
			}
			else {
				$scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries = kommonitorDataGridHelperService.buildRoleManagementGrid('indicatorEditIndicatorSpatialUnitsRoleManagementTable', $scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries, kommonitorDataExchangeService.accessControl, [], true);
			}
		}

		$scope.$on("availableRolesUpdate", function (event) {

			$scope.refreshRoleManagementTable_indicatorMetadata();
			$scope.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
		});

		$scope.onChangeOwner = function(ownerOrganization) {

			$scope.ownerOrganization = ownerOrganization;
			console.log("Target creator role selected to be:",$scope.ownerOrganization);
		}

		$scope.resetIndicatorEditIndicatorSpatialUnitRolesForm = function () {

			$scope.ownerOrganization = undefined;
			document.getElementById('targetUserRoleSelect').selectedIndex = 0;

			$scope.ownerOrgFilter = undefined;

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

			if($scope.ownerOrganization !== undefined)
				if(!confirm('Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?'))
					return;

			$scope.executeRequest_indicatorMetadataRoles();

			$scope.executeRequest_indicatorOwnership();

			$scope.executeRequest_indicatorSpatialUnitRoles();			
		};

		$scope.executeRequest_indicatorMetadataRoles = function(){
			$scope.loadingData = true;

			let putBody = {
				"permissions": kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions_indicatorMetadata),
				"isPublic": $scope.currentIndicatorDataset.isPublic
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
			$scope.loadingData = true;

			let putBody = {
				"ownerId": $scope.ownerOrganization
			}

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.currentIndicatorDataset.indicatorId + "/ownership",
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
					$scope.errorMessagePart = "Fehler beim Aktualisieren der Metadaten-Eigentümerschaft. Fehler lautet: \n\n";
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

		$scope.executeRequest_indicatorSpatialUnitRoles = function(){
			
			var putBody =
			{
				"permissions": kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions_indicatorSpatialUnitTimeseries),
				"isPublic": $scope.targetApplicableSpatialUnit.isPublic
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
