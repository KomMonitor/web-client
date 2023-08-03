"use strict";
angular.module('adminScriptManagement').component('adminScriptManagement', {
    templateUrl: "components/kommonitorAdmin/adminScriptManagement/admin-script-management.template.html",
    controller: ['kommonitorDataExchangeService', 'kommonitorCacheHelperService', 'kommonitorDataGridHelperService', '$scope', '$rootScope', '__env', '$timeout', '$http',
        function ScriptManagementController(kommonitorDataExchangeService, kommonitorCacheHelperService, kommonitorDataGridHelperService, $scope, $rootScope, __env, $timeout, $http) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            // initialize any adminLTE box widgets
            $('.box').boxWidget();
            $scope.loadingData = true;
            $scope.availableScriptDatasets;
            $scope.selectAllEntriesInput = false;
            $scope.$on("initialMetadataLoadingCompleted", function (event) {
                $timeout(function () {
                    $scope.initializeOrRefreshOverviewTable();
                }, 250);
            });
            $scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {
                $scope.loadingData = false;
            });
            $scope.initializeOrRefreshOverviewTable = function () {
                $scope.loadingData = true;
                $scope.availableScriptDatasets = JSON.parse(JSON.stringify(kommonitorDataExchangeService.availableProcessScripts));
                kommonitorDataGridHelperService.buildDataGrid_scripts($scope.availableScriptDatasets);
                $scope.loadingData = false;
            };
            $scope.$on("refreshScriptOverviewTable", function (event, crudType, scriptId) {
                $scope.loadingData = true;
                $scope.refreshScriptOverviewTable(crudType, scriptId);
            });
            $scope.onChangeSelectAllEntries = function () {
                if ($scope.selectAllEntriesInput) {
                    $scope.availableScriptDatasets.forEach(function (dataset) {
                        dataset.isSelected = true;
                    });
                }
                else {
                    $scope.availableScriptDatasets.forEach(function (dataset) {
                        dataset.isSelected = false;
                    });
                }
            };
            $scope.onChangeSelectAllEntries = function () {
                if ($scope.selectAllEntriesInput) {
                    $scope.availableScriptDatasets.forEach(function (dataset) {
                        dataset.isSelected = true;
                    });
                }
                else {
                    $scope.availableScriptDatasets.forEach(function (dataset) {
                        dataset.isSelected = false;
                    });
                }
            };
            $scope.refreshScriptOverviewTable = function (crudType, targetScriptId) {
                if (!crudType || !targetScriptId) {
                    // refetch all metadata from spatial units to update table
                    kommonitorDataExchangeService.fetchIndicatorScriptsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(response) {
                        $scope.initializeOrRefreshOverviewTable();
                        $scope.loadingData = false;
                    }, function errorCallback(response) {
                        $scope.loadingData = false;
                    });
                }
                else if (crudType && targetScriptId) {
                    if (crudType == "add") {
                        kommonitorCacheHelperService.fetchSingleIndicatorScriptMetadata(targetScriptId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {
                            kommonitorDataExchangeService.addSingleProcessScriptMetadata(data);
                            $scope.initializeOrRefreshOverviewTable();
                            $scope.loadingData = false;
                        }, function errorCallback(response) {
                            $scope.loadingData = false;
                        });
                    }
                    else if (crudType == "edit") {
                        kommonitorCacheHelperService.fetchSingleIndicatorScriptMetadata(targetScriptId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {
                            kommonitorDataExchangeService.replaceSingleProcessScriptMetadata(data);
                            $scope.initializeOrRefreshOverviewTable();
                            $scope.loadingData = false;
                        }, function errorCallback(response) {
                            $scope.loadingData = false;
                        });
                    }
                    else if (crudType == "delete") {
                        // targetScriptId might be array in this case
                        if (targetScriptId && typeof targetScriptId == "string") {
                            kommonitorDataExchangeService.deleteSingleProcessScriptMetadata(targetScriptId);
                            $scope.initializeOrRefreshOverviewTable();
                            $scope.loadingData = false;
                        }
                        else if (targetScriptId && Array.isArray(targetScriptId)) {
                            for (const id of targetScriptId) {
                                kommonitorDataExchangeService.deleteSingleProcessScriptMetadata(id);
                            }
                            $scope.initializeOrRefreshOverviewTable();
                            $scope.loadingData = false;
                        }
                    }
                }
            };
            $scope.onClickDeleteDatasets = function () {
                $scope.loadingData = true;
                var markedEntriesForDeletion = kommonitorDataGridHelperService.getSelectedScriptsMetadata();
                // submit selected spatial units to modal controller
                $rootScope.$broadcast("onDeleteScripts", markedEntriesForDeletion);
                $scope.loadingData = false;
            };
            $scope.onClickEditScript = function (scriptDataset) {
                // submit selected spatial unit to modal controller
                $rootScope.$broadcast("onEditScriptMetadata", scriptDataset);
            };
        }
    ]
});
//# sourceMappingURL=admin-script-management.component.js.map