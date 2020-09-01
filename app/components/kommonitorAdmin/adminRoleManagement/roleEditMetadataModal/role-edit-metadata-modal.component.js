angular.module('roleEditMetadataModal').component('roleEditMetadataModal', {
	templateUrl : "components/kommonitorAdmin/adminRoleManagement/roleEditMetadataModal/role-edit-metadata-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '$http', '__env',function RoleEditMetadataModalController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

	}
]});
