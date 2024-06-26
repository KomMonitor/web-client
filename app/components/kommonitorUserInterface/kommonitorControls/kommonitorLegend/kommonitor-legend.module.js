angular.module('kommonitorLegend', ['kommonitorClassification', 'kommonitorDataExchange', 'kommonitorDiagramHelper', 'kommonitorVisualStyleHelper',
'kommonitorMap', 'kommonitorElementVisibilityHelper', 'kommonitorFilterHelper', 'kommonitorShareHelper'])

.directive('stringToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(value) {
        return '' + value;
      });
      ngModel.$formatters.push(function(value) {
        return parseFloat(value);
      });
    }
  };
});
