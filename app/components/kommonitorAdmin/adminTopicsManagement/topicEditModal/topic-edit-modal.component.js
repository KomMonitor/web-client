angular.module('topicEditModal').component('topicEditModal', {
	templateUrl : "components/kommonitorAdmin/adminTopicsManagement/topicEditModal/topic-edit-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', 
	'kommonitorMultiStepFormHelperService', 'kommonitorDataGridHelperService','$timeout',
	function TopicEditModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, 
		kommonitorMultiStepFormHelperService, kommonitorDataGridHelperService, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentTopic;
		$scope.metadata = [];
		$scope.metadata.topicId = undefined;
		$scope.metadata.name = undefined;
		$scope.metadata.description = undefined;
		$scope.metadata.topicType = undefined;
		$scope.metadata.topicResource = undefined;
		$scope.metadata.subTopics = undefined;
		$scope.metadata.isPublic = false;

		$scope.loadingData = false;

		$scope.errorMessagePart = undefined;
		$scope.roleManagementTableOptions = undefined;	

		$scope.$on("onEditTopic", function (event, topic) {

			$scope.currentTopic = topic;

			$scope.metadata.topicId = $scope.currentTopic.topicId;
			$scope.metadata.name = $scope.currentTopic.topicName;
			$scope.metadata.description = $scope.currentTopic.topicDescription;
			$scope.metadata.topicType = $scope.currentTopic.topicType;
			$scope.metadata.topicResource = $scope.currentTopic.topicResource;
			$scope.metadata.subTopics = $scope.currentTopic.subTopics;

			refreshRoles();
		});

		function refreshRoles() {			

			$scope.roleManagementTableOptions = kommonitorDataGridHelperService.buildRoleManagementGrid('topicEditRoleManagementTable', $scope.roleManagementTableOptions, kommonitorDataExchangeService.accessControl, [], true);	
		}

		$scope.updateTopic = function(){
			$scope.loadingData = true;


			var putBody = {
				"topicName": $scope.metadata.name,
				"topicDescription": $scope.metadata.dscription,
				"topicType": $scope.metadata.topicType,
				"topicResource": $scope.metadata.topicResource,
				"subTopics": $scope.metadata.subTopics,
				"resourcePermissions": [],
				"isPublic": $scope.metadata.isPublic
			  };

			let roleIds = kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid($scope.roleManagementTableOptions);
			for (const roleId of roleIds) {
				putBody.resourcePermissions.push(roleId);
			}

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/topics/" + $scope.metadata.topicId,
				method: "PUT",
				data: putBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(async function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					await kommonitorDataExchangeService.fetchTopicsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);

					$rootScope.$broadcast("refreshTopicsOverview");

					$("#topicEditMetadataSuccessAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
					//
					// $scope.refreshTopicsOverview();

				}, async function errorCallback(error) {
					if(error.data){							
							$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
						}
						else{
							$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
						}

					$("#topicEditMetadataErrorAlert").show();
					$timeout(function(){
				
						$scope.loadingData = false;
					});	

			});
		};

		$scope.resetTopicEditForm = function() {
			
			$scope.errorMessagePart = undefined;
			$scope.metadata.name = $scope.currentTopic.topicName;
			$scope.metadata.description = $scope.currentTopic.topicDescription;
			
			refreshRoles();
			//todo: beim anlegen eines topics hinweis, dass standard-rechte vergeben werden können
		}

		$scope.hideSuccessAlert = function(){
			$("#topicEditMetadataSuccessAlert").hide();
		};

		$scope.hideErrorAlert = function(){
			$("#topicEditMetadataErrorAlert").hide();
		};

			
		kommonitorMultiStepFormHelperService.registerClickHandler("topicEditForm");		
	}
]});
