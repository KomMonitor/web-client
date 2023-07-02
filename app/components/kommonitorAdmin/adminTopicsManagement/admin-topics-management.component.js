"use strict";
angular.module('adminTopicsManagement').component('adminTopicsManagement', {
    templateUrl: "components/kommonitorAdmin/adminTopicsManagement/admin-topics-management.template.html",
    controller: ['kommonitorDataExchangeService', 'kommonitorCacheHelperService', '$scope', '$rootScope', '__env', '$http', '$timeout',
        function TopicsManagementController(kommonitorDataExchangeService, kommonitorCacheHelperService, $scope, $rootScope, __env, $http, $timeout) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            $scope.newMainTopicTitle_indicator;
            $scope.newMainTopicDescription_indicator;
            $scope.newMainTopicTitle_georesource;
            $scope.newMainTopicDescription_georesource;
            $scope.showTopicIds = false;
            $scope.unCollapsedTopicIds = [];
            $scope.errorMessagePart;
            // initialize any adminLTE box widgets
            $('.box').boxWidget();
            var addClickListenerToEachCollapseTrigger = function () {
                setTimeout(function () {
                    $('.list-group-item > .collapseTrigger').on('click', function () {
                        $('.glyphicon', this)
                            .toggleClass('glyphicon-chevron-right')
                            .toggleClass('glyphicon-chevron-down');
                        // manage uncollapsed entries
                        var clickedTopicId = $(this).attr('id');
                        if ($scope.unCollapsedTopicIds.includes(clickedTopicId)) {
                            var index = $scope.unCollapsedTopicIds.indexOf(clickedTopicId);
                            $scope.unCollapsedTopicIds.splice(index, 1);
                        }
                        else {
                            $scope.unCollapsedTopicIds.push(clickedTopicId);
                        }
                    });
                }, 500);
            };
            $(document).ready(function () {
                addClickListenerToEachCollapseTrigger();
            });
            $scope.refreshTopicsOverview = function () {
                $scope.loadingData = true;
                $scope.unCollapsedTopicIds.forEach(function (topicId) {
                    // simulate click on item in order to uncollapse it
                    $('#' + topicId).click();
                });
                addClickListenerToEachCollapseTrigger();
                $scope.loadingData = false;
            };
            $scope.$on("refreshTopicsOverview", function (event) {
                $scope.refreshTopicsOverview();
            });
            $scope.onAddMainTopic = function (resourceType) {
                var postBody = {
                    "topicResource": resourceType,
                    "topicType": "main",
                    "subTopics": []
                };
                if (resourceType === "indicator") {
                    postBody.topicName = $scope.newMainTopicTitle_indicator;
                    postBody.topicDescription = $scope.newMainTopicDescription_indicator;
                }
                else {
                    postBody.topicName = $scope.newMainTopicTitle_georesource;
                    postBody.topicDescription = $scope.newMainTopicDescription_georesource;
                }
                $scope.loadingData = true;
                $http({
                    url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/topics",
                    method: "POST",
                    data: postBody
                    // headers: {
                    //    'Content-Type': undefined
                    // }
                }).then(async function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    await kommonitorDataExchangeService.fetchTopicsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);
                    $scope.refreshTopicsOverview();
                    // refresh all admin dashboard diagrams due to modified metadata
                    $rootScope.$broadcast("refreshAdminDashboardDiagrams");
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                }, function errorCallback(error) {
                    if (error.data) {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                    }
                    else {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                    }
                    $("#topicsErrorAlert").show();
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                    // setTimeout(function() {
                    // 		$("#spatialUnitAddSucessAlert").hide();
                    // }, 3000);
                });
                $scope.newMainTopicTitle_indicator = undefined;
                $scope.newMainTopicDescription_indicator = undefined;
                $scope.newMainTopicTitle_georesource = undefined;
                $scope.newMainTopicDescription_georesource = undefined;
            };
            $scope.onAddSubTopic = function (mainTopic, resourceType) {
                $scope.loadingData = true;
                var topicId = mainTopic.topicId;
                var subTopic = {
                    "topicResource": resourceType,
                    "topicType": "sub",
                    "subTopics": []
                };
                if (resourceType === "indicator") {
                    subTopic.topicName = mainTopic.newSubTopicTitle_indicator;
                    subTopic.topicDescription = mainTopic.newSubTopicDescription_indicator;
                }
                else {
                    subTopic.topicName = mainTopic.newSubTopicTitle_georesource;
                    subTopic.topicDescription = mainTopic.newSubTopicDescription_georesource;
                }
                // check if subTopic already exists, then abort - add to mainTopic otherwise
                if ($scope.alreadyInSubtopics(subTopic, mainTopic.subTopics)) {
                    $scope.errorMessagePart = "Ein Unterthema mit dem gleichen Titel existiert bereits.";
                    $("#topicsErrorAlert").show();
                    $scope.loadingData = false;
                    return;
                }
                else {
                    mainTopic.subTopics.push(subTopic);
                }
                var putBody = {
                    "topicName": mainTopic.topicName,
                    "topicDescription": mainTopic.topicDescription,
                    "topicResource": resourceType,
                    "topicType": mainTopic.topicType,
                    "subTopics": mainTopic.subTopics
                };
                $http({
                    url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/topics/" + topicId,
                    method: "PUT",
                    data: putBody
                    // headers: {
                    //    'Content-Type': undefined
                    // }
                }).then(async function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    await kommonitorDataExchangeService.fetchTopicsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);
                    $scope.refreshTopicsOverview();
                    // refresh all admin dashboard diagrams due to modified metadata
                    $rootScope.$broadcast("refreshAdminDashboardDiagrams");
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                }, function errorCallback(error) {
                    if (error.data) {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                    }
                    else {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                    }
                    $("#topicsErrorAlert").show();
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                    // setTimeout(function() {
                    // 		$("#spatialUnitAddSucessAlert").hide();
                    // }, 3000);
                });
                delete mainTopic.newSubTopicTitle_indicator;
                delete mainTopic.newSubTopicDescription_indicator;
            };
            $scope.alreadyInSubtopics = function (subTopicCandidate, subTopics) {
                for (var subTopic of subTopics) {
                    if (subTopic.topicName === subTopicCandidate.topicName) {
                        return true;
                    }
                }
                return false;
            };
            $scope.onAddSubSubSubTopic = function (subTopic, resourceType) {
                $scope.loadingData = true;
                var topicId = subTopic.topicId;
                var subSubSubTopic = {
                    "topicResource": resourceType,
                    "topicType": "sub",
                    "subTopics": []
                };
                if (resourceType === "indicator") {
                    subSubSubTopic.topicName = subTopic.newSubTopicTitle_indicator;
                    subSubSubTopic.topicDescription = subTopic.newSubTopicDescription_indicator;
                }
                else {
                    subSubSubTopic.topicName = subTopic.newSubTopicTitle_georesource;
                    subSubSubTopic.topicDescription = subTopic.newSubTopicDescription_georesource;
                }
                // check if subTopic already exists, then abort - add to mainTopic otherwise
                if ($scope.alreadyInSubtopics(subSubSubTopic, subTopic.subTopics)) {
                    $scope.errorMessagePart = "Ein Unterthema mit dem gleichen Titel existiert bereits.";
                    $("#topicsErrorAlert").show();
                    $scope.loadingData = false;
                    return;
                }
                else {
                    subTopic.subTopics.push(subSubSubTopic);
                }
                var putBody = {
                    "topicName": subTopic.topicName,
                    "topicDescription": subTopic.topicDescription,
                    "topicResource": resourceType,
                    "topicType": subTopic.topicType,
                    "subTopics": subTopic.subTopics
                };
                $http({
                    url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/topics/" + topicId,
                    method: "PUT",
                    data: putBody
                    // headers: {
                    //    'Content-Type': undefined
                    // }
                }).then(async function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    await kommonitorDataExchangeService.fetchTopicsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);
                    $scope.refreshTopicsOverview();
                    // refresh all admin dashboard diagrams due to modified metadata
                    $rootScope.$broadcast("refreshAdminDashboardDiagrams");
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                }, function errorCallback(error) {
                    if (error.data) {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                    }
                    else {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                    }
                    $("#topicsErrorAlert").show();
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                    // setTimeout(function() {
                    // 		$("#spatialUnitAddSucessAlert").hide();
                    // }, 3000);
                });
                delete subTopic.newSubTopicTitle_indicator;
                delete subTopic.newSubTopicDescription_indicator;
            };
            $scope.onAddSubSubTopic = function (subTopic, resourceType) {
                $scope.loadingData = true;
                var topicId = subTopic.topicId;
                var subSubTopic = {
                    "topicResource": resourceType,
                    "topicType": "sub",
                    "subTopics": []
                };
                if (resourceType === "indicator") {
                    subSubTopic.topicName = subTopic.newSubTopicTitle_indicator;
                    subSubTopic.topicDescription = subTopic.newSubTopicDescription_indicator;
                }
                else {
                    subSubTopic.topicName = subTopic.newSubTopicTitle_georesource;
                    subSubTopic.topicDescription = subTopic.newSubTopicDescription_georesource;
                }
                // check if subTopic already exists, then abort - add to mainTopic otherwise
                if ($scope.alreadyInSubtopics(subSubTopic, subTopic.subTopics)) {
                    $scope.errorMessagePart = "Ein Unterthema mit dem gleichen Titel existiert bereits.";
                    $("#topicsErrorAlert").show();
                    $scope.loadingData = false;
                    return;
                }
                else {
                    subTopic.subTopics.push(subSubTopic);
                }
                var putBody = {
                    "topicName": subTopic.topicName,
                    "topicDescription": subTopic.topicDescription,
                    "topicResource": resourceType,
                    "topicType": subTopic.topicType,
                    "subTopics": subTopic.subTopics
                };
                $http({
                    url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/topics/" + topicId,
                    method: "PUT",
                    data: putBody
                    // headers: {
                    //    'Content-Type': undefined
                    // }
                }).then(async function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    await kommonitorDataExchangeService.fetchTopicsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);
                    $scope.refreshTopicsOverview();
                    // refresh all admin dashboard diagrams due to modified metadata
                    $rootScope.$broadcast("refreshAdminDashboardDiagrams");
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                }, function errorCallback(error) {
                    if (error.data) {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                    }
                    else {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                    }
                    $("#topicsErrorAlert").show();
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                    // setTimeout(function() {
                    // 		$("#spatialUnitAddSucessAlert").hide();
                    // }, 3000);
                });
                delete subTopic.newSubTopicTitle_indicator;
                delete subTopic.newSubTopicDescription_indicator;
            };
            $scope.deleteTopic = function (topic) {
                var topicId = topic.topicId;
                $scope.loadingData = true;
                $http({
                    url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/topics/" + topicId,
                    method: "DELETE"
                    // headers: {
                    //    'Content-Type': undefined
                    // }
                }).then(async function successCallback(response) {
                    // this callback will be called asynchronously
                    // when the response is available
                    await kommonitorDataExchangeService.fetchTopicsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);
                    $scope.refreshTopicsOverview();
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                }, function errorCallback(error) {
                    if (error.data) {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                    }
                    else {
                        $scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                    }
                    $("#topicsErrorAlert").show();
                    $timeout(function () {
                        $scope.loadingData = false;
                    });
                    // setTimeout(function() {
                    // 		$("#spatialUnitAddSucessAlert").hide();
                    // }, 3000);
                });
            };
            $scope.onClickEditTopic = function (topic) {
                // submit selected topic to modal controller
                $rootScope.$broadcast("onEditTopic", topic);
            };
            $scope.onClickDeleteTopic = function (topic) {
                // submit selected topic to modal controller
                $rootScope.$broadcast("onDeleteTopic", topic);
            };
            $scope.hideErrorAlert = function () {
                $("#topicsErrorAlert").hide();
            };
        }
    ]
});
//# sourceMappingURL=admin-topics-management.component.js.map