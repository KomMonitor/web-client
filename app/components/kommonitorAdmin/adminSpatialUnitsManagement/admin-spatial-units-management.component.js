angular.module('adminSpatialUnitsManagement').component('adminSpatialUnitsManagement', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/admin-spatial-units-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function SpatialUnitsManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
	  $('.box').boxWidget();


	}
]});
