"use strict";
angular.module('reportingModal').component('reportingModal', {
    templateUrl: "components/kommonitorUserInterface/kommonitorControls/reportingModal/reporting-modal.template.html",
    controller: ['$scope', '__env', '$timeout',
        function ReportingModalController($scope, __env, $timeout) {
            $scope.workflowSelected = false;
            $scope.templateSelected = false;
            $scope.addingNewIndicator = false;
            let modalDialog = document.querySelector("#reporting-modal .modal-dialog");
            $scope.$on('reportingWorkflowSelected', function (event, data) {
                // make modal wide
                modalDialog.classList.add("modal-xl");
                $scope.workflowSelected = true; // go to template select
                // if an existing config should be imported
                if (data) {
                    // skip template selection, directly go to overview
                    $scope.templateSelected = true;
                    $scope.$broadcast("reportingInitializeOverview", [true, data]); // data: [config]
                }
                else {
                    // TODO only for debugging, remove later
                    $scope.$broadcast('reportingInitializeTemplateSelect');
                }
                // for some reason angular won't register the change if a config file was selected
                $timeout(function () {
                    $scope.$digest();
                });
            });
            $scope.$on('reportingTemplateSelected', function (event, data) {
                $scope.templateSelected = true; // go to overview
                $scope.$broadcast("reportingInitializeOverview", [false, data]);
            });
            $scope.$on('reportingConfigureNewIndicatorClicked', function (event, data) {
                $scope.addingNewIndicator = true; // show add indicator process
                // tell indicator-add component it is shown
                $scope.$broadcast("reportingConfigureNewIndicatorShown", data);
            });
            $scope.$on('reportingConfigureNewPoiLayerClicked', function (event, data) {
                $scope.addingNewIndicator = true; // show add indicator process
                // tell indicator-add component it is shown
                $scope.$broadcast("reportingConfigureNewPoiLayerShown", data);
            });
            $scope.$on('reportingAddNewIndicatorClicked', function (event, data) {
                $scope.addingNewIndicator = false; // return to overview
                $scope.$broadcast('reportingIndicatorConfigurationCompleted', data);
            });
            $scope.$on('reportingAddNewPoiLayerClicked', function (event, data) {
                $scope.addingNewIndicator = false; // return to overview
                $scope.$broadcast('reportingPoiLayerConfigurationCompleted', data);
            });
            $scope.$on('reportingBackToOverviewClicked', function () {
                $scope.addingNewIndicator = false; // return to overview, no data added
            });
            $scope.$on('reportingBackToTemplateSelectionClicked', function () {
                $scope.templateSelected = false;
            });
            $scope.$on('reportingBackToWorkflowSelectionClicked', function () {
                $scope.workflowSelected = false;
                modalDialog.classList.remove("modal-xl");
            });
            $scope.generateReport = function (format) {
                $('#reporting-report-formats-selection').modal('hide');
                $scope.$broadcast("reportingGenerateReport", format);
            };
            // $scope.$on("reportingPageGenerated", function(event, data) {
            // 	let currentPageNumber = data[0];
            // 	let totalPageNumber = data[1];
            // 	if(currentPageNumber === 1) {
            // 		$('#reporting-report-progress').modal('show');
            // 	}
            // 	let node = document.querySelector("#reporting-report-progress-counter");
            // 	node.innerHTML = "Erzeugte Seiten: " + currentPageNumber + " von " + totalPageNumber;
            // 	if(currentPageNumber === totalPageNumber) {
            // 		$('#reporting-report-progress').modal('hide');
            // 	}
            // });
            $scope.makeIndicatorsDraggable = function () {
                $timeout(function () {
                    $(".draggable").draggable({
                        revert: "invalid",
                        revertDuration: 0,
                        appendTo: $('#reporting-modal .modal-content'),
                        scroll: false,
                        helper: "clone"
                    });
                }, 500);
            };
        }
    ]
});
//# sourceMappingURL=reporting-modal.component.js.map