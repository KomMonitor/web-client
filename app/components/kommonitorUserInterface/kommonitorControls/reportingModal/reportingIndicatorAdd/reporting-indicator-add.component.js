angular.module('reportingIndicatorAdd').component('reportingIndicatorAdd', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingIndicatorAdd/reporting-indicator-add.template.html",
	controller : ['$scope', '$rootScope', '__env',
    function ReportingIndicatorAddController($scope, $rootScope, __env) {

        $scope.onAddNewIndicatorClicked = function() {
			$scope.$emit('addNewIndicatorClicked', ['dataAboutNewIndicator'])
		}
    }
]})