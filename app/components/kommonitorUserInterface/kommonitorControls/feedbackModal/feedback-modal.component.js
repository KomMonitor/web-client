angular.module('feedbackModal').component('feedbackModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/feedbackModal/feedback-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function FeedbackModalController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		const feedbackMailRecipient = __env.feedbackMailRecipient;
		const emailURL = __env.targetUrlToProcessingEngine + "feedback-mail";

		// $scope.titel;
		$scope.organization;
		$scope.contactDetails;
		$scope.feedbackType = "Frage";
		$scope.feedbackContent;
		$scope.like = "gut";

		$scope.error = undefined;
		$scope.success = undefined;

		$scope.onSubmit = function(){
				// var body = "Titel:  " + $scope.titel + "\n";
				var body = "Fachbereich/Organisation:  " + $scope.organization + "\n\n";
				body += "Kontaktdaten:  " + $scope.contactDetails + "\n\n";
				body += "Feedback Typ:  " + $scope.feedbackType + "\n\n";
				body += "Feedback Inhalt:  " + $scope.feedbackContent + "\n\n";
				body += "KomMonitor Bewertung:  " + $scope.like + "\n\n";

				var mailInput = {};
				mailInput.recipientMail = feedbackMailRecipient;
				mailInput.subject = "KomMonitor - Feedback";
				mailInput.body = body;

				$scope.sendMail(mailInput);
		};

		$scope.sendMail = function(mailInput){

			if(! $scope.validate()){
				return;
			}

			$scope.error = undefined;
			$scope.success = undefined;

			$http({
				url: emailURL,
				method: "POST",
				data: mailInput
			}).then(function successCallback(response) {

				$scope.error = undefined;
				$scope.success = true;

				$("#mailSuccessInfo").show();

				// auto-close after 3 seconds
				// setTimeout(function() {
		    //     $("#mailSuccessInfo").alert('close');
		    // }, 3000);

			}, function errorCallback(error) {

					$scope.error = error;
					$scope.success = undefined;

					$("#mailErrorInfo").show();
			});
		}

		$scope.onCloseSuccessAlert = function(){
			$("#mailSuccessInfo").hide();
		};

		$scope.onCloseErrorAlert = function(){
			$("#mailErrorInfo").hide();
		};

		$scope.validate = function(){
			if ($scope.feedbackType && $scope.feedbackContent && $scope.like){
				return true;
			}
			return false;
		}

		$scope.reset = function(){
			$scope.organization = undefined;
			$scope.contactDetails = undefined;
			$scope.feedbackType = "Frage";
			$scope.feedbackContent = undefined;
			$scope.like = "gut";

			$scope.error = undefined;
			$scope.success = undefined;
		}

	}
]});
