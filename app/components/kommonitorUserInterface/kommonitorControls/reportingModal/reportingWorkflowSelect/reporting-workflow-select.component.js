angular.module('reportingWorkflowSelect').component('reportingWorkflowSelect', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingWorkflowSelect/reporting-workflow-select.template.html",
	controller : ['$scope',  function ReportingWorkflowSelectController($scope) {
        

		// on modal opened
		$('#reporting-modal').on('shown.bs.modal', function () {
			$scope.initialize();
		});

		$scope.initialize = function() {

			document.getElementById("reporting-load-settings-button").addEventListener('change', function(e) {
				$scope.readFile(e)
			}, false);

		}


		$scope.onWorkflowSelected = function(type, config=undefined) {
			if(type === "new") {
				$scope.$emit('reportingWorkflowSelected')
			} else if(type === "existing") {
				$scope.$emit('reportingWorkflowSelected', config)
			} else {
				throw "Workflow type was neither 'new' nor 'existing'"
			}
		}

		/**
		 * helper function to read a file from disk
		 * @param {*} e | the event that triggered the function
		 * @returns 
		 */
		$scope.readFile = function(e) {
			let content = "";
			let file = e.target.files[0];
			if (!file)
				return;

			let reader = new FileReader();
			reader.onload = function(e) {
				content = e.target.result;
				let config = undefined;
				try {
					config = JSON.parse(content);
				} catch(e) {
					console.error("Configuration is no valid JSON.")
				}

				//TODO check if json has correct structure, can be done once config structure is defined

				$scope.onWorkflowSelected("existing", config)
				
			 };
			reader.readAsText(file);
		}

		
    }
]});