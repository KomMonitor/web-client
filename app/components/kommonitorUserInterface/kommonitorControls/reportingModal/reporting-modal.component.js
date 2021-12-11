angular.module('reportingModal').component('reportingModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reporting-modal.template.html",
	controller : ['$scope', '$rootScope', '__env', '$timeout', 
	function ReportingModalController($scope, $rootScope, __env) {

		$scope.templateSelected = false;
		$scope.addingNewIndicator = false;

		$scope.$on('reportingTemplateSelected', function (event, data) {
			$scope.templateSelected = true; // go to overview
		});

		$scope.$on('configureNewIndicatorClicked', function () {
			$scope.addingNewIndicator = true; // show add indicator process
		});

		$scope.$on('addNewIndicatorClicked', function (event, data) {
			$scope.addingNewIndicator = false; // return to overview
			console.log("Data from adding new indicator: ", data)
		});

		$scope.$on('backToTemplateSelectionClicked', function () {
			$scope.templateSelected = false;
		});

	}
]});


