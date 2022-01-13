angular.module('reportingTemplateSelect').component('reportingTemplateSelect', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingTemplateSelect/reporting-template-select.template.html",
	controller : ['$scope', '$rootScope', '__env', '$timeout', 'kommonitorDataExchangeService',
	function ReportingTemplateSelectController($scope, $rootScope, __env, $timeout, kommonitorDataExchangeService) {

		$scope.generalSettings = {
			creator: "M. Mustermann",
			commune: "Testkommune",
			communeLogo: "",
			creationDate: "2022-01-01",
			freeText: "Text123",
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

		// A basic version of the templates.
    	// These are not full-fledged templates yet, but they can serve as a starting point and are adjusted according to user choices dynamically.
		$scope.availableTemplates = [
			{
				"name": "A4-landscape-timestamp",
				"displayName": "DIN A4, Querformat",
				"categoryId": 1,
				"pages": [
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"placeholderText": "Karte",
							},
							{
								"type": "largestSpatialUnitAvg",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"placeholderText": "Durchschnitt Gesamtstadt"
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"placeholderText": "Karte"
							},
							{
								"type": "largestSpatialUnitAvg",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"placeholderText": "Durchschnitt Gesamtstadt"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"placeholderText": "Legende"
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"placeholderText": "Säulendiagramm"
							}
						]
					},
					// one page for each selected area
					{
						"orientation": "landscape",
						"area": "spezieller Bereich",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "400px",
									"height": "440px"
								},
								"placeholderText": "Karte"
							},
							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"placeholderText": "Säulendiagramm"
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "390px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					},
					// end of area-specific part
					// datatable might need multiple pages
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "datatable",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "300px",
									"height": "440px"
								},
								"placeholderText": "Datentabelle"
							}
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

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"placeholderText": "Karte"
							},
							{
								"type": "largestSpatialUnitAvg",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"placeholderText": "Durchschnitt Gesamtstadt"
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"placeholderText": "Karte"
							},
							{
								"type": "largestSpatialUnitChange",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"placeholderText": "Veränderung Gesamtstadt"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"placeholderText": "Legende"
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"placeholderText": "Liniendiagramm"
							}
						]
					},
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								// with boxplot at each data point
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"placeholderText": "Liniendiagramm mit Boxplots"
							}
						]
					},
					// one page for each selected area
					{
						"orientation": "landscape",
						"area": "spezieller Bereich",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "400px",
									"height": "440px"
								},
								"placeholderText": "Karte"
							},
							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"placeholderText": "Liniendiagramm"
							},
							{
								// percentage change compared to previous jear
								"type": "linechart",
								"dimensions": {
									"top": "240px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"placeholderText": "Liniendiagramm - proz. Veränderung zum Vorjahr"
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "390px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					},
					// end of area-specific part
					// datatable might need multiple pages
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								// should include data for different timestamps
								"type": "datatable",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "300px",
									"height": "440px"
								},
								"placeholderText": "Datentabelle"
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

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								// isochrones, only show main roads if possible
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"placeholderText": "Karte"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"placeholderText": "Legende"
							}
						]
					},
					// one page for each selected area
					{
						"orientation": "landscape",
						"area": "spezieller Bereich",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),
							
							{
								// isochrones,background map in black-white 
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"placeholderText": "Karte"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"placeholderText": "Legende"
							}
						]
					}
					// end of area-specific part
				]
			}
		]
	
		$scope.selectedTemplate = undefined;

		// on modal opened
		$('#reporting-modal').on('show.bs.modal', function () {
			$scope.initialize();
		});

		$scope.initialize = function() {
			console.log($scope.availableTemplates);
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
			let content = "";
			let srcElement = e.srcElement;
			let file = e.target.files[0];
			if (!file) {
				return;
			}
			var reader = new FileReader();
			reader.onload = function(e) {
				content = e.target.result;
				if(srcElement.id === "reporting-load-commune-logo-button") {
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
			// update selected template with general settings
			for(let [idx, page] of $scope.selectedTemplate.pages.entries()) {
				for(let el of page.pageElements) {
					if(el.type === "footerCreationInfo-landscape") {
						el.placeholderText = "Erstellt am " + $scope.generalSettings.creationDate + " von " + $scope.generalSettings.creator + ", " + $scope.generalSettings.commune
					}
					if(el.type === "textInput") {
						el.placeholderText = $scope.generalSettings.freeText;
					}
					if(el.type === "communeLogo-landscape") {
						el.placeholderText = $scope.generalSettings.communeLogo
					}
					// page number is generated by html expression, but we update if anyway for consistency
					if(el.type === "pageNumber-landscape") {
						el.placeholderText = "Seite " + (idx+1)
					}
				}
			}
			$scope.$emit('reportingTemplateSelected', [$scope.selectedTemplate])
		}

		$scope.onBackToTWorkflowSelectionClicked = function() {
			$scope.selectedTemplate = {};
			$scope.$emit('backToWorkflowSelectionClicked')
		}
    }
]});