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

		$scope.onSubmit = function(){
				// var body = "Titel:  " + $scope.titel + "\n";
				var body = "Fachbereich/Organisation:  " + $scope.organization + "\n\n";
				body += "Kontaktdaten:  " + $scope.contactDetails + "\n\n";
				body += "Feedback Typ:  " + $scope.feedbackType + "\n\n";
				body += "Feedback Inhalt:  " + $scope.feedbackContent + "\n\n";
				body += "KomMonitor Bewertung:  " + $scope.like + "\n\n";

				var mailInput = {};
				mailInput.recipientMail = recipientMail;
				mailInput.subject = "KomMonitor - Feedback";
				mailInput.body = body;

				$scope.sendMail(mailInput);
		};

		$scope.sendMail = function(mailInput){

			if(! $scope.validate()){
				return;
			}

			$http({
				url: emailURL,
				method: "POST",
				data: mailInput
			}).then(function successCallback(response) {

					alert("Success");

				}, function errorCallback(response) {

					alert("Failed");
			});

		  // var link = "mailto:"+ feedbackMailRecipient +
		  //            "?"+
		  //            "subject=" + encodeURIComponent("KomMonitor - Feedback") +
		  //            "&body=" + encodeURIComponent(body);
		  // window.location.href = link;

			// Email.send({
			//     SecureToken : "77870d8f-41cb-4aa4-a9dc-2eae310cbc92",
			// 		// Host : "mail.gmx.net",
			//     // Username : "kommonitor@gmx.de",
			//     // Password : "ProjektKM2017",
			//     To : feedbackMailRecipient	,
			//     From : "kommonitor@gmx.de",
			//     Subject : "KomMonitor - Feedback",
			//     Body : body
			// }).then(
			//   message => alert(message)
			// );



			// console.log(link);
		}

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
		}

	}
]});
