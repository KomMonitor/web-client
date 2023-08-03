angular.module('wfsModal').component('wfsModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/poi/wfsModal/wfs-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function WfsModalController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		// initialize colorpicker
		$('#wfsLegendColorPicker').colorpicker();

		$scope.customWfsTitle = undefined;
		$scope.customWfsDescription = undefined;
		$scope.customWfsUrl = undefined;
		$scope.customWfsFeatureTypeName = undefined;
		$scope.customWfsFeatureTypeNamespace = undefined;
		$scope.customWfsFeatureTypeGeometryAttributeName = undefined;
		$scope.customWfsLegendColor = `#00AABB`;
		$scope.useBBOXFilter = true;


		$scope.resetCustomTempWFSForm = function(){
			$scope.customWfsTitle = undefined;
			$scope.customWfsDescription = undefined;
			$scope.customWfsUrl = undefined;
			$scope.customWfsFeatureTypeName = undefined;
			$scope.customWfsFeatureTypeNamespace = undefined;
			$scope.customWfsFeatureTypeGeometryAttributeName = undefined;
			$scope.customWfsLegendColor = `#00AABB`;
			$scope.useBBOXFilter = true;
		};

		$scope.addCustomTempWFS = function(){
			var wfsObject = {
				title: $scope.customWfsTitle,
				description: $scope.customWfsDescription,
				url: $scope.customWfsUrl,
				featureTypeNamespace: $scope.customWfsFeatureTypeNamespace,
	      featureTypeName: $scope.customWfsFeatureTypeName,
	      featureTypeGeometryName: $scope.customWfsFeatureTypeGeometryAttributeName,
	      displayColor: $scope.customWfsLegendColor,
				filterFeaturesToMapBBOX: $scope.useBBOXFilter

			};

			// TODO verify input

			kommonitorDataExchangeService.wfsDatasets.push(wfsObject);

			$("#wfsSucessAlert").show();

			$scope.resetCustomTempWFSForm();

			setTimeout(function() {
					$("#wfsSucessAlert").hide();
			}, 3000);

			setTimeout(function() {
					// initialize colorpicker
					$('.input-group.colorpicker-component').colorpicker();
			}, 1000);

			// initialize colorpicker
			$('.colorpicker-component').colorpicker();

		};

	}
]});
