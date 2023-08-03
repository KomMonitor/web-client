"use strict";
angular.module('spatialUnitNotificationModal').component('spatialUnitNotificationModal', {
    templateUrl: "components/kommonitorUserInterface/kommonitorControls/spatialUnitNotificationModal/spatial-unit-notification-modal.template.html",
    controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '$timeout', '__env', function spatialUnitNotificationModalController(kommonitorDataExchangeService, $scope, $rootScope, $timeout, __env) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            $scope.isHideNotification = false;
            $scope.init = function () {
                document.getElementById("spatialUnitNotificationModalTitle").innerHTML = __env.spatialUnitNotificationTitle;
                document.getElementById("spatialUnitNotificationModalMessage").innerHTML = __env.spatialUnitNotificationMessage;
                if (!(localStorage.getItem("hideKomMonitorSpatialUnitNotification") === "true")) {
                    $scope.isHideNotification = false;
                }
                else {
                    $scope.isHideNotification = true;
                    $("#changeHideSpatialUnitNotificationInput").prop('checked', true);
                }
                $timeout(function () {
                    $scope.$digest();
                }, 250);
            };
            $scope.init();
            var onChangeHideSpatialUnitNotification = function () {
                if ($scope.isHideNotification) {
                    localStorage.setItem("hideKomMonitorSpatialUnitNotification", "true");
                }
                else {
                    localStorage.setItem("hideKomMonitorSpatialUnitNotification", "false");
                }
            };
            $('#changeHideSpatialUnitNotificationInput').on('click', function (event) {
                if ($scope.isHideNotification) {
                    $scope.isHideNotification = false;
                }
                else {
                    $scope.isHideNotification = true;
                }
                onChangeHideSpatialUnitNotification();
                event.stopPropagation();
            });
            // 	$scope.init();
        }
    ]
});
//# sourceMappingURL=spatial-unit-notification-modal.component.js.map