angular.module('roleDeleteModal').component('roleDeleteModal', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/roleDeleteModal/role-delete-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$http', '__env', '$q', function RoleDeleteModalController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $http, __env, $q) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;



	}
	]
});
