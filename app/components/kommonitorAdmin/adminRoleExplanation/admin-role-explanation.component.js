"use strict";
angular.module('adminRoleExplanation').component('adminRoleExplanation', {
    templateUrl: "components/kommonitorAdmin/adminRoleExplanation/admin-role-explanation.template.html",
    controller: ['kommonitorDataExchangeService', '$scope', '$timeout', '$rootScope', '__env', '$http',
        function RoleManagementController(kommonitorDataExchangeService, $scope, $timeout, $rootScope, __env, $http) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
        }
    ]
});
//# sourceMappingURL=admin-role-explanation.component.js.map