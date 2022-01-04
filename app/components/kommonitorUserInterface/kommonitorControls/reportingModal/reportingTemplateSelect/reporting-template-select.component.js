angular.module('reportingTemplateSelect').component('reportingTemplateSelect', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingTemplateSelect/reporting-template-select.template.html",
	controller : ['$scope', '$rootScope', '__env', 
	function ReportingTemplateSelectController($scope, $rootScope, __env) {

		$scope.availableTemplateCategories = [
			{
				"id": 1,
				"displayName": "Zeitpunkt",
			},
			{
				"id": 2,
				"displayName": "Zeitserie",
			},
			{
				"id": 3,
				"displayName": "Erreichbarkeit",
			}
		]
		
		$scope.availableTemplates = [
			{
				"name": "A4-landscape-timestamp",
				"displayName": "DIN A4, Querformat",
				"categoryId": 1,
				"pages": [
					{
						"pageElements": [
							{
								"type": "map",
								"dimensions": {
									"top": "40",
									"left": "20",
									"width": "500",
									"height": "300"
								}
							},
							{
								"type": "largestSpatialUnitAvg",
								"dimensions": {
									"top": "100",
									"left": "500",
									"width": "80",
									"height": "30"
								}
							}
						]
					},
					{
						"pageElements": [

						]
					},
				]
			},
			{
				"name": "A4-landscape-timeseies",
				"displayName": "DIN A4, Querformat",
				"categoryId": 2,
			},
			{
				"name": "A4-landscape-reachability",
				"displayName": "DIN A4, Querformat",
				"categoryId": 3,
			},
		]
	
		$scope.selectedTemplate = undefined;

		// on modal opened
		$('#reporting-modal').on('show.bs.modal', function () {
			$scope.initialize();
		});

		$scope.initialize = function() {
			// open first category
			let collapsible = document.querySelector("#reporting-template-category-accordion #collapse1")
			collapsible.classList.add("in");
			// select first template
			collapsible.querySelector("#collapse1-template0").click();
		}

		/**
		 * filters templates to only show the ones matching the given category.
		 * @param {*} categoryId 
		 * @returns 
		 */
		$scope.templateFilter = function(categoryId) {
			return function(value) {
				return categoryId === value.categoryId;
			}
		}

		$scope.onTemplateElementClicked = function($event, template) {
			let el = $event.target;
			el.style.backgroundColor = "#0078D7";
			el.style.color = "white";
			document.querySelectorAll(".selectableTemplate").forEach( (element) => {
				if( el !== element) {
					element.style.backgroundColor = "white";
					element.style.color = "black";
				}
			});
			// set scope variable manually each time
			$scope.selectedTemplate = template;
			$scope.updatePreview(template);
		}

		$scope.updatePreview = function(template) {
			console.log("updating preview"); //TODO
		}
        
		$scope.onTemplateSelected = function() {
			console.log("template selected: ", $scope.selectedTemplate)
			$scope.$emit('reportingTemplateSelected', [$scope.selectedTemplate])
		}

		$scope.onBackToTWorkflowSelectionClicked = function() {
			$scope.selectedTemplate = {};
			$scope.$emit('backToWorkflowSelectionClicked')
		}
    }
]});