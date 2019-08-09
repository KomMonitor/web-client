angular.module('adminDashboardManagement').component('adminDashboardManagement', {
	templateUrl : "components/kommonitorAdmin/adminDashboardManagement/admin-dashboard-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function DashboardManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;



	}
]});
