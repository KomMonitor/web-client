angular.module('topicEditModal').component('topicEditModal', {
	templateUrl : "components/kommonitorAdmin/adminTopicsManagement/topicEditModal/topic-edit-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorConfigStorageService', '$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorGlobalFilterHelperService',
    function TopicEditModalController(kommonitorDataExchangeService, kommonitorConfigStorageService, $scope, $rootScope, $http, __env, $timeout, kommonitorGlobalFilterHelperService) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
    this.kommonitorConfigStorageServiceInstance = kommonitorConfigStorageService;		

		$scope.currentTopic;

		$scope.loadingData = false;

		$scope.errorMessagePart = undefined;

		$scope.$on("onEditTopic", function (event, topic) {

			$scope.currentTopic = topic;
      $scope.loadGlobalFilters();
		});

    $scope.loadGlobalFilters = async function() {

      $scope.globalFilters = await kommonitorConfigStorageService.getFilterConfig();
    }

    $scope.onChangeFilterSelection = function(index) {

      var topicId = $scope.currentTopic.topicId;
      kommonitorGlobalFilterHelperService.editGlobalFilterConfig($scope.globalFilters, index, 'indicatorTopics', topicId);
      /* var topicId = $scope.currentTopic.topicId;

      if($scope.globalFilters[index]['indicatorTopics'].indexOf(topicId)<0)
        $scope.globalFilters[index]['indicatorTopics'].push(topicId);

      console.log($scope.globalFilters[index]); */
    }

		$scope.updateTopic = function(topic){

      console.log(topic.topicId, $scope.globalFilters.filter(e => e.checked===true));

			/* $scope.loadingData = true;

			var topicId = topic.topicId;

			var putBody = {
			  "topicName": topic.topicName,
			  "topicDescription": topic.topicDescription,
			  "topicType": topic.topicType,
			  "topicResource": topic.topicResource,
			  "subTopics": topic.subTopics
			};

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/topics/" + topicId,
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

			}); */
		};

			$scope.hideSuccessAlert = function(){
				$("#topicEditMetadataSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#topicEditMetadataErrorAlert").hide();
			};

	}
]});
