"use strict";
angular.module('versionInfo').component('versionInfo', {
    templateUrl: "components/kommonitorUserInterface/kommonitorControls/versionInfo/version-info.template.html",
    controller: [
        'kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$timeout',
        function VersionInfoController(kommonitorDataExchangeService, $scope, $rootScope, __env, $timeout) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            // initialize any adminLTE box widgets
            $('.box').boxWidget();
        }
    ]
});
//# sourceMappingURL=version-info.component.js.map