angular.module('adminTopicsManagement').component('adminTopicsManagement', {
	templateUrl : "components/kommonitorAdmin/adminTopicsManagement/admin-topics-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function TopicsManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
	  $('.box').boxWidget();


	}
]});
