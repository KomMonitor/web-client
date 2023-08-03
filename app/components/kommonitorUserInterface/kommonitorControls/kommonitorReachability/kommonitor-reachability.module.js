"use strict";
angular.module('kommonitorReachability', ['kommonitorDataExchange', 'kommonitorMap', 'kommonitorDiagramHelper'])
    .directive('stringToNumber', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (value) {
                return '' + value;
            });
            ngModel.$formatters.push(function (value) {
                return parseFloat(value);
            });
        }
    };
});
//# sourceMappingURL=kommonitor-reachability.module.js.map