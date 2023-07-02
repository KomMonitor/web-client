"use strict";
angular.module('infoModal').component('infoModal', {
    templateUrl: "components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.template.html",
    controller: [
        'kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$timeout',
        function InfoModalController(kommonitorDataExchangeService, $scope, $rootScope, __env, $timeout) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            $scope.isHideGreetings = false;
            $scope.init = function () {
                if (!(localStorage.getItem("hideKomMonitorAppGreeting") === "true")) {
                    $scope.isHideGreetings = false;
                    $('#infoModal').modal('show');
                }
                else {
                    $scope.isHideGreetings = true;
                    $("#changeHideGreetingsInput").prop('checked', true);
                }
                let tab1 = document.getElementById("infoModalTab1");
                tab1.innerHTML = __env.standardInfoModalTabTitle;
                tab1.click();
                tab1.focus();
                if (__env.enableExtendedInfoModal) {
                    let tab3 = document.getElementById("infoModalTab3");
                    let tab3content = document.getElementById("infoModalTab3Content");
                    tab3.innerHTML = __env.extendedInfoModalTabTitle;
                    tab3content.innerHTML = __env.extendedInfoModalHTMLMessage;
                }
                else {
                    document.getElementById("infoModalTab3").style.display = "none";
                }
                $timeout(function () {
                    $scope.$digest();
                }, 250);
            };
            var onChangeHideGreetings = function () {
                if ($scope.isHideGreetings) {
                    localStorage.setItem("hideKomMonitorAppGreeting", "true");
                }
                else {
                    localStorage.setItem("hideKomMonitorAppGreeting", "false");
                }
            };
            $('#changeHideGreetingsInput').on('click', function (event) {
                if ($scope.isHideGreetings) {
                    $scope.isHideGreetings = false;
                }
                else {
                    $scope.isHideGreetings = true;
                }
                onChangeHideGreetings();
                event.stopPropagation();
            });
            var callStartGuidedTour = function () {
                $('#infoModal').modal('hide');
                $rootScope.$broadcast("startGuidedTour");
            };
            $(document).on('click', '#callStartGuidedTourButton', function (e) {
                callStartGuidedTour();
            });
            $scope.showFeedbackForm = function () {
                $('#infoModal').modal('hide');
                $('#feedbackModal').modal('show');
            };
            $scope.init();
        }
    ]
});
//# sourceMappingURL=info-modal.component.js.map