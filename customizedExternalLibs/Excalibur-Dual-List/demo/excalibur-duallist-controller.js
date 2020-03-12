(function(angular) {
  'use strict';
  angular.module('app')
    .controller('ExcaliburDualListController', ['$scope', '$filter', function($scope, $filter) {
      
      $scope.myModel = {item: {}};

      $scope.options = {
        title: {label: 'Demo: your title', helpMessage: 'Demo: your help message'},
        selectOptions: {initialText: "ALL", isDisable: false, uppercase: true},
        boxItemsHeight: 'md',
        items: [
          { 'category': 'FF8', 'name': 'Squall Leonhart' },
          { 'category': 'FF8', 'name': 'Quistis Trepe' },
          { 'category': 'FF8', 'name': 'Zell Dincht' },

          { 'category': 'FF9', 'name': 'Zidane' },
          { 'category': 'FF9', 'name': 'Garnet' },
          { 'category': 'FF9', 'name': 'Vivi' },

          { 'category': 'FF7', 'name': 'Cloud Strife' },
          { 'category': 'FF7', 'name': 'Aerith Gainsborough' },
          { 'category': 'FF7', 'name': 'Vincent Valentine' },

        ],
        itemsOrderProperty: '[category, name]',
        categories: ["FF7", "FF8", "FF9"],
        button: {leftText: "Move All" , rightText: "Move All"},
        selectedItems: []
      };
    }]);

})(window.angular);