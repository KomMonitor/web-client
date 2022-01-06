angular.module('reportingTemplateSelect').component('reportingTemplateSelect', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingTemplateSelect/reporting-template-select.template.html",
	controller : ['$scope', '$rootScope', '__env', '$timeout',
	function ReportingTemplateSelectController($scope, $rootScope, __env, $timeout) {

		$scope.generalSettings = {
			creator: "M. Mustermann",
			commune: "Testkommune",
			communeLogo: "",
			creationDate: "2022-01-01",
			freeText: "Text123. Sanitize?",
			includeCoverPage: true,
			documentTitle: ""
		}
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
						"orientation": "landscape",
						"pageElements": [
							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								}
							},
							{
								"type": "largestSpatialUnitAvg",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								}
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [
							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								}
							},
							{
								"type": "largestSpatialUnitAvg",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								}
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								}
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [
							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								}
							}
						]
					},
					// one page for each selected area
					{
						"orientation": "landscape",
						"area": "spezieller Bereich",
						"pageElements": [
							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "400px",
									"height": "440px"
								}
							},
							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								}
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "390px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"content": $scope.generalSettings.freeText // TODO update before continuing to next mask since it might not be done automatically
							}
						]
					},
					// end of area-specific part
					// datatable might need multiple pages
					{
						"orientation": "landscape",
						"pageElements": [
							{
								"type": "datatable",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "300px",
									"height": "440px"
								}
							},
						]
					}
				]
			},
			{
				"name": "A4-landscape-timeseries",
				"displayName": "DIN A4, Querformat",
				"categoryId": 2,
				"pages": [
					{
						"orientation": "landscape",
						"pageElements": [
							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								}
							},
							{
								"type": "largestSpatialUnitAvg",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								}
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [
							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								}
							},
							{
								"type": "largestSpatialUnitChange",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								}
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								}
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [
							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								}
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [
							{
								// with boxplot at each data point
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								}
							}
						]
					},
					// one page for each selected area
					{
						"orientation": "landscape",
						"area": "spezieller Bereich",
						"pageElements": [
							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "400px",
									"height": "440px"
								}
							},
							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								}
							},
							{
								// percentage change compared to previous jear
								"type": "linechart",
								"dimensions": {
									"top": "240px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								}
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "390px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"content": $scope.generalSettings.freeText // TODO update before continuing to next mask since it might not be done automatically
							}
						]
					},
					// end of area-specific part
					// datatable might need multiple pages
					{
						"orientation": "landscape",
						"pageElements": [
							{
								// should include data for different timestamps
								"type": "datatable",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "300px",
									"height": "440px"
								}
							},
						]
					}
				]
			},
			{
				"name": "A4-landscape-reachability",
				"displayName": "DIN A4, Querformat",
				"categoryId": 3,
				"pages": [
					{
						"orientation": "landscape",
						"pageElements": [
							{
								// isochrones, only show main roads if possible
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								}
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								}
							}
						]
					},
					// one page for each selected area
					{
						"orientation": "landscape",
						"area": "spezieller Bereich",
						"pageElements": [
							{
								// isochrones,background map in black-white 
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								}
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								}
							}
						]
					}
					// end of area-specific part
				]
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

			$scope.datePicker = $('#reporting-general-settings-datefield').datepicker({
				autoclose: true,
            	language: 'de',
            	format: 'yyyy-mm-dd'
			});
			document.getElementById("reporting-load-commune-logo-button").addEventListener('change', readSingleFile, false);
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
			document.querySelectorAll(".reporting-selectable-template").forEach( (element) => {
				if( el !== element) {
					element.style.backgroundColor = "white";
					element.style.color = "black";
				}
			});
			// set scope variable manually each time
			if($scope.selectedTemplate !== template) {
				$scope.selectedTemplate = template;
			}
		}

		/**
		 * reads a file chosen by the user
		 * @returns {string} file content
		 */
		function readSingleFile(e) {
			var content = "";
			var srcElement = e.srcElement;
			var file = e.target.files[0];
			if (!file) {
				return;
			}
			var reader = new FileReader();
			reader.onload = function(e) {
				content = e.target.result;
				if(srcElement.id === "reporting-load-commune-logo-button") {
					console.log(content)
					$scope.generalSettings.communeLogo = content;
					$timeout(function() {
						$scope.$apply();
					});
				}
			 };
			reader.readAsDataURL(file);
		}

		$scope.templateSupportsFreeText = function() {
			if(typeof($scope.selectedTemplate) === "undefined")
				return false;

			for(let page of $scope.selectedTemplate.pages) {
				for(let pageElement of page.pageElements) {
					if (pageElement.type === "textInput") {
						return true;
					}
				}
			}
			return false;
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