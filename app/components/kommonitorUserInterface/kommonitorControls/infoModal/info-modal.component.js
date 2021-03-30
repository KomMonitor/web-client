angular.module('infoModal').component('infoModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$timeout', function InfoModalController(kommonitorDataExchangeService, $scope, $rootScope, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.isHideGreetings = false;

		$scope.init = function(){
			if(! (localStorage.getItem("hideKomMonitorAppGreeting") === "true")) {
					
				$scope.isHideGreetings = false;

				$('#infoModal').modal('show');		
			}
			else{
				$scope.isHideGreetings = true;
			}

			$timeout(function(){
				$scope.$digest();
			}, 250);
			
		};

		var onChangeHideGreetings = function(){
			if($scope.isHideGreetings){
				localStorage.setItem("hideKomMonitorAppGreeting", "true");
			}
			else{
				localStorage.setItem("hideKomMonitorAppGreeting", "false");
			}
		};

		$(document).on('click', '#changeHideGreetingsInput', function (e) {
			if($scope.isHideGreetings){
				$scope.isHideGreetings = false;
			}
			else{
				$scope.isHideGreetings = true;
			}
			onChangeHideGreetings();
		});

		var callStartGuidedTour = function(){
			$('#infoModal').modal('hide');
			$rootScope.$broadcast("startGuidedTour");
		};

		$(document).on('click', '#callStartGuidedTourButton', function (e) {
			callStartGuidedTour();
		  });

		$scope.showFeedbackForm = function(){
			$('#infoModal').modal('hide');
			$('#feedbackModal').modal('show');
		};

		$scope.init();
	}
]});
