angular.module('adminKeycloakConfig').component('adminKeycloakConfig', {
	templateUrl: "components/kommonitorAdmin/adminConfig/adminKeycloakConfig/admin-keycloak-config.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', '$timeout', function KeycloakConfigController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;			
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

	}
	]
});
