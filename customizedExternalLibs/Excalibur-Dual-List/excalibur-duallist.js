angular.module("excaliburDualList", []).directive("excaliburDualList", [function() {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      options: '='
    },
    link: function($scope, elem, attrs, ngModel) {

      $scope.transfer = function(from, to, index) {
        if (index >= 0) {
          to.push(from[index]);
          from.splice(index, 1);
        } else {
          for (var i = 0; i < from.length; i++) {
            to.push(from[i]);
          }
          from.length = 0;
        }
      };
      ngModel.$setViewValue($scope.options.selectedItems);
      ngModel.$render();

    },
    templateUrl: 'excalibur-duallist.html'
  };

}]);