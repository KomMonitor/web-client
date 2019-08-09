angular.module('adminGeoresourcesManagement').component('adminGeoresourcesManagement', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/admin-georesources-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function GeoresourcesManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;



	}
]});
