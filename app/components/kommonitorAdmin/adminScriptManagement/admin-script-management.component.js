angular.module('adminScriptManagement').component('adminScriptManagement', {
	templateUrl : "components/kommonitorAdmin/adminScriptManagement/admin-script-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function ScriptManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;



	}
]});
