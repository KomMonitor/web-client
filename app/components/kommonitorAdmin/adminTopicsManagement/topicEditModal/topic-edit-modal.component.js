angular.module('topicEditModal').component('topicEditModal', {
	templateUrl : "components/kommonitorAdmin/adminTopicsManagement/topicEditModal/topic-edit-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env',function TopicEditModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentTopic;
		
		$scope.loadingData = false;

		$scope.errorMessagePart = undefined;

		$scope.$on("onEditTopic", function (event, topic) {

			$scope.currentTopic = topic;
		});

		$scope.updateTopic = function(topic){
			$scope.loadingData = true;

			var topicId = topic.topicId;

			var putBody = {
			  "topicName": topic.topicName,
			  "topicDescription": topic.topicDescription,
			  "topicType": topic.topicType,
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

					await kommonitorDataExchangeService.fetchTopicsMetadata();

					$("#topicEditMetadataSuccessAlert").show();
					$scope.loadingData = false;
					//
					// $scope.refreshTopicsOverview();

				}, async function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#topicEditMetadataErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitAddSucessAlert").hide();
					// }, 3000);
			});
		};

			$scope.hideSuccessAlert = function(){
				$("#spatialUnitEditMetadataSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#spatialUnitEditMetadataErrorAlert").hide();
			};

	}
]});
