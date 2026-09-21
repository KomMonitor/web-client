angular.module('reportingModal').component('reportingModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reporting-modal.template.html",
	controller : ['$scope', '__env', '$timeout', 'kommonitorDataExchangeService', '$rootScope', 'kommonitorMapService',
	function ReportingModalController($scope, __env, $timeout, kommonitorDataExchangeService, $rootScope, kommonitorMapService) {

		$scope.workflowSelected = false;
		$scope.templateSelected = false;
		$scope.addingNewIndicator = false;
		let modalDialog = document.querySelector("#reporting-modal .modal-dialog");

		$scope.$on('reportingWorkflowSelected', function(event, data) {

      // raus
			/* $scope.$broadcast("reportingGenerateReport", 'pptx'); */

      // rein
			// make modal wide
			modalDialog.classList.add("modal-xl");

			$scope.workflowSelected = true; // go to template select
			// if an existing config should be imported
			if(data) {
				// skip template selection, directly go to overview
				$scope.templateSelected = true;
				$scope.$broadcast("reportingInitializeOverview", [true, data]) // data: [config]
			} else {
				// TODO only for debugging, remove later
				$scope.$broadcast('reportingInitializeTemplateSelect');
			}

			// for some reason angular won't register the change if a config file was selected
			$timeout(function(){
				$scope.$digest();
			});
		});

		$scope.$on('reportingTemplateSelected', function(event, data) {
			$scope.templateSelected = true; // go to overview
			$scope.$broadcast("reportingInitializeOverview", [false, data])
		});

		$scope.$on('reportingConfigureNewIndicatorClicked', function(event, data) {
			$scope.addingNewIndicator = true; // show add indicator process
			// tell indicator-add component it is shown
			$scope.$broadcast("reportingConfigureNewIndicatorShown", data)
		});

		$scope.$on('reportingConfigureNewPoiLayerClicked', function(event, data) {
			$scope.addingNewIndicator = true; // show add indicator process
			// tell indicator-add component it is shown
			$scope.$broadcast("reportingConfigureNewPoiLayerShown", data)
		});

		$scope.$on('reportingAddNewIndicatorClicked', function(event, data) {
			$scope.addingNewIndicator = false; // return to overview
			$scope.$broadcast('reportingIndicatorConfigurationCompleted', data)
		});

		$scope.$on('reportingAddNewPoiLayerClicked', function(event, data) {
			$scope.addingNewIndicator = false; // return to overview
			$scope.$broadcast('reportingPoiLayerConfigurationCompleted', data)
		});

		$scope.$on('reportingBackToOverviewClicked', function() {
			$scope.addingNewIndicator = false; // return to overview, no data added
		});

		$scope.$on('reportingBackToTemplateSelectionClicked', function() {
			$scope.templateSelected = false;
		});

		$scope.$on('reportingBackToWorkflowSelectionClicked', function() {
			$scope.workflowSelected = false;
			modalDialog.classList.remove("modal-xl");
		});

		$scope.generateReport = function(format) {
			$('#reporting-report-formats-selection').modal('hide');
			$scope.$broadcast("reportingGenerateReport", format);
		}

		// $scope.$on("reportingPageGenerated", function(event, data) {
		// 	let currentPageNumber = data[0];
		// 	let totalPageNumber = data[1];
		// 	if(currentPageNumber === 1) {
		// 		$('#reporting-report-progress').modal('show');
		// 	}
		// 	let node = document.querySelector("#reporting-report-progress-counter");
		// 	node.innerHTML = "Erzeugte Seiten: " + currentPageNumber + " von " + totalPageNumber;

		// 	if(currentPageNumber === totalPageNumber) {
		// 		$('#reporting-report-progress').modal('hide');
		// 	}

		// });
		
		// Track state of reporting modal
		$('#reporting-modal').on('show.bs.modal', function () {
			kommonitorDataExchangeService.reportingModalOpen = true;
			$timeout(function(){
				$rootScope.$digest();
			});
		});

		$('#reporting-modal').on('hidden.bs.modal', function () {
			kommonitorDataExchangeService.reportingModalOpen = false;
			// after leaving reportinf modal we must make sure that indicator legend show correct numbers of colored features. 
			// we, hence, call restyle of current map layer to update legend, as this will trigger restyle of all features and, thus, also update the number of colored features in legend
			// kommonitorMapService.restyleCurrentLayer();
			$rootScope.$broadcast("restyleCurrentLayer", false);
			$timeout(function(){
				$rootScope.$digest();				
			});
		});


		$scope.makeIndicatorsDraggable = function() {
			$timeout( function() {
				$(".draggable").draggable({
					revert: "invalid",
					revertDuration: 0,
					appendTo: $('#reporting-modal .modal-content'),
					scroll: false,
					helper: "clone"
				});
			}, 500);
		}
	}
]});

angular.module('reportingModal').controller('ReportingBackgroundController', ['$scope', 'kommonitorDataExchangeService', 
	function ReportingBackgroundController($scope, kommonitorDataExchangeService) {
		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		
		// helper to determine visibility, similar to components
		this.checkVisibility = function(pageElement, page) {
			if (!page || !pageElement) return false;
			// we can't easily access the component scopes here, so we use a simplified version
			// or we just trust that the components provide the correct pageElements
			return true; 
		};

		this.getPageNumber = function(index) {
			return (index || 0) + 1;
		};
	}
]);


