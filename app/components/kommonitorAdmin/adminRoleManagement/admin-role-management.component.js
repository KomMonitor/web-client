angular.module('adminRoleManagement').component('adminRoleManagement', {
	templateUrl : "components/kommonitorAdmin/adminRoleManagement/admin-role-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function RoleManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
	  $('.box').boxWidget();


	}
]});
