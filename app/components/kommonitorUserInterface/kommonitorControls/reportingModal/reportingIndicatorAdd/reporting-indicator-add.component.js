angular.module('reportingIndicatorAdd').component('reportingIndicatorAdd', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingIndicatorAdd/reporting-indicator-add.template.html",
	controller : ['$scope', '$http', '__env', 'kommonitorDataExchangeService',
    function ReportingIndicatorAddController($scope, $http, __env, kommonitorDataExchangeService) {

		$scope.indicatorNameFilter = "";
		$scope.availableIndicators = [];
		$scope.selectedIndicator = undefined;
		$scope.selectedAreas = [];
		$scope.selectedTimestamps = [];
		$scope.loadingData = false;
		
		
		$scope.$on("configureNewIndicatorShown", function() {
			$scope.initializeDualLists();
			$scope.queryIndicators();
		});

		$scope.initializeDualLists = function() {
			$scope.duallistAreasOptions = {
				label: 'Bereiche',
				boxItemsHeight: 'md',
				items: [],
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: []
			};

			$scope.duallistTimestampsOptions = {
				label: 'Zeitpunkte',
				boxItemsHeight: 'md',
				items: [],
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: []
			};
		}

		/**
		 * Queries the DataManagement API to get all available indicators
		 */
		$scope.queryIndicators = async function() {
			$scope.loadingData = true;

			// build request
			// query public endpoint for now, this might change once user role administration is added to reporting
			let url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators"
			
			// send request
			await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
					// save to scope
					$scope.availableIndicators = response.data
					$scope.loadingData = false;

				}, function errorCallback(error) {
					$scope.loadingData = false;
					kommonitorDataExchangeService.displayMapApplicationError(error);
					console.error(response.statusText);
			});
		};

		
		$scope.onIndicatorSelected = function(indicator) {
			// set indicator manually.
			// if we use ng-model it gets converted to string instead of an object
			$scope.selectedIndicator = indicator;
		}

        $scope.onAddNewIndicatorClicked = function() {
			$scope.$emit('addNewIndicatorClicked', [$scope.selectedIndicator])
		}

    }
]})