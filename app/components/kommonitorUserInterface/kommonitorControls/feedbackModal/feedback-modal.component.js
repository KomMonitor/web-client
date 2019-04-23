angular.module('feedbackModal').component('feedbackModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/feedbackModal/feedback-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function FeedbackModalController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

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

				$scope.sendMail(body);
		};

		$scope.sendMail = function(body){

			if(! $scope.validate()){
				return;
			}

		  var link = "mailto:christian.danowski-buhren@hs-bochum.de"+
		             "?"+
		             "subject=" + encodeURIComponent("KomMonitor - Feedback") +
		             "&body=" + encodeURIComponent(body);
		  window.location.href = link;

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
