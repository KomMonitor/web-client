angular.module('excaliburDualList', []).directive('excaliburDualList', [
  function () {
    return {
      restrict: 'E',
      require: 'ngModel',
      scope: { options: '=' },
      link: function (e, l, i, t) {
        e.transfer = function (l, i, r) {
          if (r >= 0) (i.push(l[r]), l.splice(r, 1));
          else {
            for (var n = 0; n < l.length; n++) i.push(l[n]);
            l.length = 0;
          }
          (t.$setViewValue(e.options.selectedItems), t.$render());
        };
      },
      templateUrl: 'dependencies/excalibur-duallist/excalibur-duallist.html',
    };
  },
]);
