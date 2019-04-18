angular.module('infoModal').component('infoModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function InfoModalController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$('#infoModal').modal('show');

		$scope.callStartGuidedTour = function(){
			$('#infoModal').modal('hide');
			$rootScope.$broadcast("startGuidedTour");
		};

	}
]});
