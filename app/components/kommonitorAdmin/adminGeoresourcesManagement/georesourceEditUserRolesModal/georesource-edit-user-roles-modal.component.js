angular.module('georesourceEditUserRolesModal').component('georesourceEditUserRolesModal', {
	templateUrl: "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditUserRolesModal/georesource-edit-user-roles-modal.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', 'kommonitorMultiStepFormHelperService', 
	'kommonitorDataGridHelperService', '$timeout', 
		function GeoresourceEditUserRolesModalController(kommonitorDataExchangeService, $scope, $rootScope, 
				$http, __env, kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService, $timeout) {

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

			$scope.putUserRoles();

			$scope.putOwnership();
		}

		$scope.putUserRoles = function(){

			$scope.loadingData = true;

			let putBody = {
				allowedRoles: kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions)
			}

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/permissions",
				method: "PUT",
				data: putBody,
				headers: {
				   'Content-Type': "application/json"
				}
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentGeoresourceDataset.datasetName;

					$rootScope.$broadcast("refreshGeoresourceOverviewTable", "edit", $scope.currentGeoresourceDataset.georesourceId);
								
					$("#georesourceEditUserRolesSuccessAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

				}, function errorCallback(error) {
					$scope.errorMessagePart = "Fehler beim Aktualisieren der Zugriffsrechte. Fehler lautet: \n\n";
					if(error.data){							
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else{
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#georesourceEditUserRolesErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});
		}

		$scope.putOwnership = function(){

			console.log("not yet implemented");
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