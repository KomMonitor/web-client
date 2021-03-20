angular.module('adminIndicatorsManagement', ['kommonitorDataExchange', 'datatables']);

angular.module('adminIndicatorsManagement').directive("sortable", function () {
    return {
      restrict: "EA",
      controller: [
        "$scope",
        "$element",
        "$attrs",
        function ($scope, $element, $attrs) {
            Sortable.create($element[0], {
                handle: ".handle",
                onEnd: function (/**Event*/evt) {
                    var itemEl = evt.item;  // dragged HTMLElement
                    var newOrder = evt.to;    // target list
                    var oldOrder = evt.from;  // previous list// when item is in another sortable: `"clone"` if cloning, `true` if moving
                },
            });                        
        },
      ],
    };
  });
