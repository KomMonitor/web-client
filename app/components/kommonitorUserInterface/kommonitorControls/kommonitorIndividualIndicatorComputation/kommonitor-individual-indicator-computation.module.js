"use strict";
angular.module('kommonitorIndividualIndicatorComputation', ['kommonitorDataExchange'])
    .directive('stringToNumber', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (value) {
                return parseFloat(value);
            });
            ngModel.$formatters.push(function (value) {
                return '' + value;
            });
        }
    };
});
//# sourceMappingURL=kommonitor-individual-indicator-computation.module.js.map