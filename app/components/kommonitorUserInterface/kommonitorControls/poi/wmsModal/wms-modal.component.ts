angular.module('wmsModal').component('wmsModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/poi/wmsModal/wms-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function WmsModalController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.customWmsTitle = undefined;
		$scope.customWmsDescription = undefined;
		$scope.customWmsUrl = undefined;
		$scope.customWmsLayerName = undefined;

		$scope.resetCustomTempWMSForm = function(){
			$scope.customWmsTitle = undefined;
			$scope.customWmsDescription = undefined;
			$scope.customWmsUrl = undefined;
			$scope.customWmsLayerName = undefined;
		};

		$scope.addCustomTempWMS = function(){
			var wmsObject = {
				title: $scope.customWmsTitle,
				description: $scope.customWmsDescription,
				url: $scope.customWmsUrl,
				layerName: $scope.customWmsLayerName
			};

			// TODO verify input

			kommonitorDataExchangeService.wmsDatasets.push(wmsObject);

			$("#wmsSucessAlert").show();

			$scope.resetCustomTempWMSForm();

			setTimeout(function() {
					$("#wmsSucessAlert").hide();
			}, 3000);

		};

	}
]});
