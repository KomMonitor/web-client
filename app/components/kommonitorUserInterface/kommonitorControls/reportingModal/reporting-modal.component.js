angular.module('reportingModal').component('reportingModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reporting-modal.template.html",
	controller : ['$scope', '__env', '$timeout', 
	function ReportingModalController($scope, __env, $timeout) {

		$scope.workflowSelected = false;
		$scope.templateSelected = false;
		$scope.addingNewIndicator = false;
		let modalDialog = document.querySelector("#reporting-modal .modal-dialog");
		$scope.$on('reportingWorkflowSelected', function (event, data) {
			console.log("data in wrapper: ", data);
			// make modal wide
			modalDialog.classList.add("modal-xl");

			$scope.workflowSelected = true; // go to template select
			// for some reason angularjs won't register the change if a config file was selected
			$timeout(function() {
				$scope.$apply()
			});
			
		});

		$scope.$on('reportingTemplateSelected', function (event, data) {
			$scope.templateSelected = true; // go to overview
		});

		$scope.$on('configureNewIndicatorClicked', function () {
			$scope.addingNewIndicator = true; // show add indicator process
			// tell indicator-add component it is shown
			$scope.$broadcast("configureNewIndicatorShown") // can't use same event name here
		});

		$scope.$on('addNewIndicatorClicked', function (event, data) {
			$scope.addingNewIndicator = false; // return to overview
			console.log("Data from adding new indicator: ", data)
		});

		$scope.$on('backToTemplateSelectionClicked', function () {
			$scope.templateSelected = false;
		});

		$scope.$on('backToWorkflowSelectionClicked', function () {
			$scope.workflowSelected = false;
			modalDialog.classList.remove("modal-xl")
		});
		
	}
]});


