angular.module('adminControlsConfig').component('adminControlsConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminControlsConfig/admin-controls-config.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', '$timeout', function ControlsConfigController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;			
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

	}
	]
});
