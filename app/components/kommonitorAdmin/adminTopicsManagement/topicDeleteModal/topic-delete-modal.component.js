angular.module('topicDeleteModal').component('topicDeleteModal', {
	templateUrl : "components/kommonitorAdmin/adminTopicsManagement/topicDeleteModal/topic-delete-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$q',function TopicDeleteModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $q) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.topicToDelete;
		$scope.topicToDelete_prettyPrint;

		$scope.loadingData = false;

		$scope.errorMessagePart = undefined;

		$scope.$on("onDeleteTopic", function (event, topic) {

			$scope.topicToDelete = topic;

			// $scope.topicToDelete_prettyPrint = JSON.stringify(topic, null, 2); // spacing level = 2;
			$scope.topicToDelete_prettyPrint = $scope.syntaxHighlight(topic);

			document.getElementById("deleteTopicPre").innerHTML = $scope.topicToDelete_prettyPrint;

			$scope.resetTopicDeleteForm();

		});


		$scope.resetTopicDeleteForm = function(){
			$scope.errorMessagePart = undefined;
			$("#topicDeleteSuccessAlert").hide();
			$("#topicDeleteErrorAlert").hide();
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

					$rootScope.$broadcast("refreshTopicsOverview");

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

					$scope.loadingData = false;

					$scope.showSuccessAlert();

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#topicsErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitAddSucessAlert").hide();
					// }, 3000);
			});

		};

		$scope.syntaxHighlight = function(json) {
		    if (typeof json != 'string') {
		         json = JSON.stringify(json, undefined, 2);
		    }
		    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
		        var cls = 'number';
		        if (/^"/.test(match)) {
		            if (/:$/.test(match)) {
		                cls = 'key';
		            } else {
		                cls = 'string';
		            }
		        } else if (/true|false/.test(match)) {
		            cls = 'boolean';
		        } else if (/null/.test(match)) {
		            cls = 'null';
		        }
		        return '<span class="' + cls + '">' + match + '</span>';
		    });
		}

			$scope.hideSuccessAlert = function(){
				$("#topicDeleteSuccessAlert").hide();

				$scope.topicToDelete = undefined;
				$scope.topicToDelete_prettyPrint = undefined;
				document.getElementById("deleteTopicPre").innerHTML = undefined;
			};

			$scope.showSuccessAlert = function(){
				$("#topicDeleteSuccessAlert").show();
			};

			$scope.hideErrorAlert = function(){
				$("#topicDeleteErrorAlert").hide();
			};

			$scope.showErrorAlert = function(){
				$("#topicDeleteErrorAlert").show();
			};

	}
]});
