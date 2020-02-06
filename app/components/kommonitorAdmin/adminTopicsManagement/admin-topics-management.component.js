angular.module('adminTopicsManagement').component('adminTopicsManagement', {
	templateUrl : "components/kommonitorAdmin/adminTopicsManagement/admin-topics-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function TopicsManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.newMainTopicTitle;
		$scope.newMainTopicDescription;

		$scope.unCollapsedTopicIds = [];

		$scope.errorMessagePart;

		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		var addClickListenerToEachCollapseTrigger = function(){
			setTimeout(function(){
				$('.list-group-item > .collapseTrigger').on('click', function() {
			    $('.glyphicon', this)
			      .toggleClass('glyphicon-chevron-right')
			      .toggleClass('glyphicon-chevron-down');

						// manage uncollapsed entries
						var clickedTopicId = $(this).attr('id');
						if ($scope.unCollapsedTopicIds.includes(clickedTopicId)){
							var index = $scope.unCollapsedTopicIds.indexOf(clickedTopicId);
							$scope.unCollapsedTopicIds.splice(index, 1);
						}
						else{
							$scope.unCollapsedTopicIds.push(clickedTopicId);
						}
			  });
			}, 500);
		};

		$(document).ready(function() {

			addClickListenerToEachCollapseTrigger();
		});

		$scope.refreshTopicsOverview = function(){
			$scope.loadingData = true;

			$scope.unCollapsedTopicIds.forEach(function(topicId){
				// simulate click on item in order to uncollapse it
				$('#'+topicId).click();
			});

			addClickListenerToEachCollapseTrigger();

			$scope.loadingData = false;
		};

		$scope.$on("refreshTopicsOverview", function (event) {
			$scope.refreshTopicsOverview();
		});

		$scope.onAddMainTopic = function(){

			var postBody = {
			  "topicName": $scope.newMainTopicTitle,
			  "topicDescription": $scope.newMainTopicDescription,
			  "topicType": "main",
			  "subTopics": []
			};

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/topics",
				method: "POST",
				data: postBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(async function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					await kommonitorDataExchangeService.fetchTopicsMetadata();

					$scope.refreshTopicsOverview();

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#topicsErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitAddSucessAlert").hide();
					// }, 3000);
			});

			$scope.newMainTopicTitle = undefined;
			$scope.newMainTopicDescription = undefined;
		};

		$scope.onAddSubTopic = function(mainTopic){

			$scope.loadingData = true;
			var topicId = mainTopic.topicId;

			var subTopic = {
			  "topicName": mainTopic.newSubTopicTitle,
			  "topicDescription": mainTopic.newSubTopicDescription,
			  "topicType": "sub",
			  "subTopics": []
			};

			// check if subTopic already exists, then abort - add to mainTopic otherwise
			if($scope.alreadyInSubtopics(subTopic, mainTopic.subTopics)){
				$scope.errorMessagePart = "Ein Unterthema mit dem gleichen Titel existiert bereits.";

				$("#topicsErrorAlert").show();
				$scope.loadingData = false;
				return;
			}
			else{
				mainTopic.subTopics.push(subTopic);
			}

			var putBody = {
			  "topicName": mainTopic.topicName,
			  "topicDescription": mainTopic.topicDescription,
			  "topicType": mainTopic.topicType,
			  "subTopics": mainTopic.subTopics
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

					$scope.refreshTopicsOverview();

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#topicsErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitAddSucessAlert").hide();
					// }, 3000);
			});

			delete mainTopic.newSubTopicTitle;
			delete mainTopic.newSubTopicDescription;
		};

		$scope.alreadyInSubtopics = function(subTopicCandidate, subTopics){
			for(var subTopic of  subTopics){
				if (subTopic.topicName === subTopicCandidate.topicName){
					return true;
				}
			}
			return false;
		};

		$scope.onAddSubSubSubTopic = function(subTopic){

			$scope.loadingData = true;
			var topicId = subTopic.topicId;

			var subSubSubTopic = {
			  "topicName": subTopic.newSubTopicTitle,
			  "topicDescription": subTopic.newSubTopicDescription,
			  "topicType": "sub",
			  "subTopics": []
			};

			// check if subTopic already exists, then abort - add to mainTopic otherwise
			if($scope.alreadyInSubtopics(subSubSubTopic, subTopic.subTopics)){
				$scope.errorMessagePart = "Ein Unterthema mit dem gleichen Titel existiert bereits.";

				$("#topicsErrorAlert").show();
				$scope.loadingData = false;
				return;
			}
			else{
				subTopic.subTopics.push(subSubSubTopic);
			}

			var putBody = {
			  "topicName": subTopic.topicName,
			  "topicDescription": subTopic.topicDescription,
			  "topicType": subTopic.topicType,
			  "subTopics": subTopic.subTopics
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

					$scope.refreshTopicsOverview();

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#topicsErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitAddSucessAlert").hide();
					// }, 3000);
			});

			delete subTopic.newSubTopicTitle;
			delete subTopic.newSubTopicDescription;
		};

		$scope.onAddSubSubTopic = function(subTopic){

			$scope.loadingData = true;
			var topicId = subTopic.topicId;

			var subSubTopic = {
			  "topicName": subTopic.newSubTopicTitle,
			  "topicDescription": subTopic.newSubTopicDescription,
			  "topicType": "sub",
			  "subTopics": []
			};

			// check if subTopic already exists, then abort - add to mainTopic otherwise
			if($scope.alreadyInSubtopics(subSubTopic, subTopic.subTopics)){
				$scope.errorMessagePart = "Ein Unterthema mit dem gleichen Titel existiert bereits.";

				$("#topicsErrorAlert").show();
				$scope.loadingData = false;
				return;
			}
			else{
				subTopic.subTopics.push(subSubTopic);
			}

			var putBody = {
			  "topicName": subTopic.topicName,
			  "topicDescription": subTopic.topicDescription,
			  "topicType": subTopic.topicType,
			  "subTopics": subTopic.subTopics
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

					$scope.refreshTopicsOverview();

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#topicsErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitAddSucessAlert").hide();
					// }, 3000);
			});

			delete subTopic.newSubTopicTitle;
			delete subTopic.newSubTopicDescription;
		};

		$scope.deleteTopic = function(topic){

			var topicId = topic.topicId;

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/topics/" + topicId,
				method: "DELETE"
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(async function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					await kommonitorDataExchangeService.fetchTopicsMetadata();

					$scope.refreshTopicsOverview();

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#topicsErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitAddSucessAlert").hide();
					// }, 3000);
			});
		};

		$scope.onClickEditTopic = function(topic){
			// submit selected topic to modal controller
			$rootScope.$broadcast("onEditTopic", topic);
		};

		$scope.onClickDeleteTopic = function(topic){
			// submit selected topic to modal controller
			$rootScope.$broadcast("onDeleteTopic", topic);
		};

		$scope.hideErrorAlert = function(){
			$("#topicsErrorAlert").hide();
		};

	}
]});
