angular.module('feedbackModal').component('feedbackModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/feedbackModal/feedback-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function FeedbackModalController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

	}
]});
