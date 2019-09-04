angular.module('adminIndicatorsManagement').component('adminIndicatorsManagement', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/admin-indicators-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function IndicatorsManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
	  $('.box').boxWidget();


	}
]});
