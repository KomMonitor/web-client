"use strict";
angular.module('kommonitorBalance', ['kommonitorDataExchange', 'kommonitorDiagramHelper', 'kommonitorMap', 'kommonitorFilterHelper'])
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
//# sourceMappingURL=kommonitor-balance.module.js.map