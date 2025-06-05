angular.module('kobotoolboxModal').component('kobotoolboxModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/kobotoolboxModal/kobotoolbox-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$timeout', '__env', function kobotoolboxModalModalController(kommonitorDataExchangeService, $scope, $rootScope, $timeout, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		
		$scope.isHideNotification = false;

		$scope.init = function(){

			$timeout(function(){
				$scope.$digest();
			}, 250);
		};

		$scope.init();


	}
]});
