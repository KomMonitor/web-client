"use strict";
angular.module('indicatorEditTimeseriesMapping').component('indicatorEditTimeseriesMapping', {
    templateUrl: "components/kommonitorAdmin/adminMultiUseComponents/indicatorEditTimeseriesMapping/indicator-edit-timeseries-mapping.template.html",
    controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env',
        function IndicatorEditTimeseriesMappingController(kommonitorDataExchangeService, $scope, $rootScope, __env) {
            /*
            [
                {
                    indicatorValueProperty: "DATE_2008-01-01"
                    timestamp: "2021-04-01"
                    timestampProperty: undefined
                },
                {
                    indicatorValueProperty: "DATE_2009-01-01"
                    timestamp: undefined
                    timestampProperty: "2009-01-01"
                }
            ]
            */
            //$scope.timeseriesMapping = []
            $scope.useTimeseriesAsProperty = false;
            $scope.userInputIndicatorValueProperty = undefined;
            $scope.userInputTimestamp = undefined;
            $scope.userInputTimestampProperty = undefined;
            //Date picker
            $('.indicatorTimeseriesMappingTimestampDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);
            $scope.onChangeUseTimeseriesAsProperty = function () {
                if ($scope.useTimeseriesAsProperty) {
                    $scope.userInputTimestamp = undefined;
                }
                else {
                    $scope.userInputTimestampProperty = undefined;
                }
            };
            $scope.onClickUpdateTimeseriesMapping = function () {
                var tmpIndicatorTimeseriesMapping = {
                    "indicatorValueProperty": $scope.userInputIndicatorValueProperty,
                    "timestampProperty": $scope.userInputTimestampProperty,
                    "timestamp": $scope.userInputTimestamp
                };
                var entryExists = false;
                for (let index = 0; index < $scope.timeseriesMapping.length; index++) {
                    var timeseriesMappingEntry = $scope.timeseriesMapping[index];
                    if (timeseriesMappingEntry.indicatorValueProperty === tmpIndicatorTimeseriesMapping.indicatorValueProperty) {
                        // replace object
                        $scope.timeseriesMapping[index] = tmpIndicatorTimeseriesMapping;
                        entryExists = true;
                        break;
                    }
                }
                if (!entryExists) {
                    // new entry
                    $scope.timeseriesMapping.push(tmpIndicatorTimeseriesMapping);
                }
                $scope.userInputIndicatorValueProperty = undefined;
                $scope.userInputTimestampProperty = undefined;
                $scope.userInputTimestamp = undefined;
                $scope.digestAfterTimeout(250);
                $rootScope.$broadcast("timeseriesMappingChanged", { mapping: $scope.timeseriesMapping });
            };
            $scope.onClickEditTimeseriesMappingEntry = function (timeseriesMappingEntry) {
                $scope.userInputIndicatorValueProperty = timeseriesMappingEntry.indicatorValueProperty;
                $scope.userInputTimestampProperty = timeseriesMappingEntry.timestampProperty;
                $scope.userInputTimestamp = timeseriesMappingEntry.timestamp;
                if ($scope.userInputTimestamp) {
                    $('.indicatorTimeseriesMappingTimestampDatepicker').datepicker('setDate', $scope.userInputTimestamp);
                    $scope.useTimeseriesAsProperty = false;
                }
                else {
                    $scope.useTimeseriesAsProperty = true;
                }
                $scope.digestAfterTimeout(250);
            };
            $scope.onClickDeleteTimeseriesMappingEntry = function (timeseriesMappingEntry) {
                for (let index = 0; index < $scope.timeseriesMapping.length; index++) {
                    if ($scope.timeseriesMapping[index].indicatorValueProperty === timeseriesMappingEntry.indicatorValueProperty) {
                        // remove object
                        $scope.timeseriesMapping.splice(index, 1);
                        break;
                    }
                }
                $scope.digestAfterTimeout(250);
                $rootScope.$broadcast("timeseriesMappingChanged", { mapping: $scope.timeseriesMapping });
            };
            $scope.$on('loadTimeseriesMapping', function (event, args) {
                if (typeof args.mapping !== "undefined") {
                    $scope.loadTimeseriesMapping(args.mapping);
                }
                else {
                    throw "Can't load timeseries mapping because args has no property 'mapping'.";
                }
            });
            $scope.loadTimeseriesMapping = function (mapping) {
                let isValid = true;
                if (mapping) {
                    for (const entry of mapping) {
                        if (!(entry.hasOwnProperty("indicatorValueProperty") &&
                            (entry.hasOwnProperty("timestamp") || entry.hasOwnProperty("timestampProperty"))))
                            isValid = false;
                    }
                }
                if (isValid)
                    $scope.timeseriesMapping = mapping;
                else
                    throw "Can't load timeseries mapping because mapping has incorrect properties.\
						Expected: indicatorValueProperty and either timestamp or timestampProperty.";
                $scope.digestAfterTimeout(250);
                $rootScope.$broadcast("timeseriesMappingChanged", { mapping: $scope.timeseriesMapping });
            };
            $scope.$on('resetTimeseriesMapping', function () {
                $scope.resetTimeseriesMapping();
            });
            $scope.resetTimeseriesMapping = function () {
                $scope.timeseriesMapping = [];
                $scope.useTimeseriesAsProperty = false;
                $scope.userInputIndicatorValueProperty = undefined;
                $scope.userInputTimestamp = undefined;
                $scope.userInputTimestampProperty = undefined;
                $rootScope.$broadcast("timeseriesMappingChanged", { mapping: $scope.timeseriesMapping });
            };
            $scope.digestAfterTimeout = function (timeout) {
                setTimeout(() => {
                    $scope.$digest();
                }, timeout);
            };
        }
    ]
});
//# sourceMappingURL=indicator-edit-timeseries-mapping.component.js.map