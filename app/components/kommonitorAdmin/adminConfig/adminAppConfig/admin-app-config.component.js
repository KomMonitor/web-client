angular.module('adminAppConfig').component('adminAppConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminAppConfig/admin-app-config.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', '$timeout', function AppConfigController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;			
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

	}
	]
});
