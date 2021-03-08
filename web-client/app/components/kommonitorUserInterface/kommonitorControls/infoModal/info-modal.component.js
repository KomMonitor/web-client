angular.module('infoModal').component('infoModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function InfoModalController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.isHideGreetings = false;

		if(! (localStorage.getItem("hideKomMonitorAppGreeting") === "true")) {
			$('#infoModal').modal('show');			
		}
		else{
			$scope.isHideGreetings = true;
		}

		$scope.onChangeHideGreetings = function(){
			if($scope.isHideGreetings){
				localStorage.setItem("hideKomMonitorAppGreeting", "true");
			}
			else{
				localStorage.setItem("hideKomMonitorAppGreeting", "false");
			}
		};

		$scope.callStartGuidedTour = function(){
			$('#infoModal').modal('hide');
			$rootScope.$broadcast("startGuidedTour");
		};

		$scope.showFeedbackForm = function(){
			$('#infoModal').modal('hide');
			$('#feedbackModal').modal('show');
		};

	}
]});
