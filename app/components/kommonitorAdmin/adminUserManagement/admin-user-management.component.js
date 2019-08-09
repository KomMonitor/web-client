angular.module('adminUserManagement').component('adminUserManagement', {
	templateUrl : "components/kommonitorAdmin/adminUserManagement/admin-user-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function UserManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;



	}
]});
