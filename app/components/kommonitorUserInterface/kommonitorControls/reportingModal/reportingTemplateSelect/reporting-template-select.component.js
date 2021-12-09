angular.module('reportingTemplateSelect').component('reportingTemplateSelect', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingTemplateSelect/reporting-template-select.template.html",
	controller : ['$scope', '$rootScope', '__env', 
	function ReportingTemplateSelectController($scope, $rootScope, __env) {
        
		$scope.onTemplateSelected = function() {
			$scope.$emit('reportingTemplateSelected', ['someData'])
		}
    }
]});