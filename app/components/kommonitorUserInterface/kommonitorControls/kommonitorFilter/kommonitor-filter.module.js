"use strict";
angular.module('kommonitorFilter', ['kommonitorDataExchange', 'kommonitorMap', 'kommonitorFilterHelper'])
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
//# sourceMappingURL=kommonitor-filter.module.js.map