angular.module('reportingModal').component('reportingModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reporting-modal.template.html",
	controller : ['$scope', '__env', '$timeout', 
	function ReportingModalController($scope, __env, $timeout) {

		$scope.workflowSelected = false;
		$scope.templateSelected = false;
		$scope.addingNewIndicator = false;
		let modalDialog = document.querySelector("#reporting-modal .modal-dialog");
		$scope.$on('reportingWorkflowSelected', function(event, data) {
			// make modal wide
			modalDialog.classList.add("modal-xl");

			$scope.workflowSelected = true; // go to template select
			// for some reason angularjs won't register the change if a config file was selected
			$timeout(function() {
				$scope.$apply()
			});
			
		});

		$scope.$on('reportingTemplateSelected', function(event, data) {
			$scope.templateSelected = true; // go to overview
			$scope.$broadcast("reportingInitializeOverview", [data])
		});

		$scope.$on('reportingConfigureNewIndicatorClicked', function(event, data) {
			$scope.addingNewIndicator = true; // show add indicator process
			// tell indicator-add component it is shown
			$scope.$broadcast("reportingConfigureNewIndicatorShown", data)
		});

		$scope.$on('reportingAddNewIndicatorClicked', function(event, data) {
			$scope.addingNewIndicator = false; // return to overview
			console.log("Data from adding new indicator: ", data)
			$scope.$broadcast('reportingIndicatorConfigurationCompleted', data)
		});

		$scope.$on('reportingBackToOverviewClicked', function() {
			$scope.addingNewIndicator = false; // return to overview, no data added
		});

		$scope.$on('reportingBackToTemplateSelectionClicked', function() {
			$scope.templateSelected = false;
		});

		$scope.$on('reportingBackToWorkflowSelectionClicked', function() {
			$scope.workflowSelected = false;
			modalDialog.classList.remove("modal-xl")
		});
		
	}
]});


