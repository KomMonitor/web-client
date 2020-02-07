angular.module('georesourceEditFeaturesModal').component('georesourceEditFeaturesModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditFeaturesModal/georesource-edit-features-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
		function GeoresourcesEditFeaturesModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, $scope, $rootScope, $http, __env, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

		/*	PUT BODY
		{
		"geoJsonString": "geoJsonString",
		"periodOfValidity": {
		"endDate": "2000-01-23",
		"startDate": "2000-01-23"
		}
		}
		*/

		//Date picker
    $('#georesourceEditFeaturesDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#georesourceEditFeaturesDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$scope.georesourceFeaturesGeoJSON;
		$scope.currentGeoresourceDataset;
		$scope.remainingFeatureHeaders;

		$scope.loadingData = false;

		$scope.periodOfValidity = {};
		$scope.periodOfValidity.startDate = undefined;
		$scope.periodOfValidity.endDate = undefined;
		$scope.periodOfValidityInvalid = false;

		$scope.geoJsonString = undefined;
		$scope.georesource_asGeoJson = undefined;

		$scope.georesourceEditFeaturesDataSourceInputInvalidReason = undefined;
		$scope.georesourceEditFeaturesDataSourceInputInvalid = false;
		$scope.spatialResourceConfigured = false;
		$scope.idPropertyNotFound = false;
		$scope.namePropertyNotFound = false;
		$scope.geodataSourceFormat = undefined;
		$scope.georesourceDataSourceIdProperty = undefined;
		$scope.georesourceDataSourceNameProperty = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditGeoresourceFeatures", function (event, georesourceDataset) {

			if($scope.currentGeoresourceDataset && $scope.currentGeoresourceDataset.datasetName === georesourceDataset.datasetName){
				return;
			}
			else{
				$scope.currentGeoresourceDataset = georesourceDataset;

				// $scope.refreshGeoresourceEditFeaturesOverviewTable();

				$scope.resetGeoresourceEditFeaturesForm();
			}

		});

		$scope.refreshGeoresourceEditFeaturesOverviewTable = function(){

			$scope.loadingData = true;
			// fetch all georesource features
			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/allFeatures",
				method: "GET",
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {

				$scope.georesourceFeaturesGeoJSON = response.data;

				var tmpRemainingHeaders = [];

				for (var property in $scope.georesourceFeaturesGeoJSON.features[0].properties){
					if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME){
						tmpRemainingHeaders.push(property);
					}
				}

				$scope.remainingFeatureHeaders = tmpRemainingHeaders;

					$scope.loadingData = false;

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#georesourceEditFeaturesErrorAlert").show();
					$scope.loadingData = false;
			});
		};

		$scope.clearAllGeoresourceFeatures = function(){
			$scope.loadingData = true;
			// delete all georesource features
			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId + "/allFeatures",
				method: "DELETE",
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {

				$scope.georesourceFeaturesGeoJSON = undefined;
				$scope.remainingFeatureHeaders = undefined;

				$rootScope.$broadcast("refreshGeoresourceOverviewTable");
				// $scope.refreshGeoresourceEditFeaturesOverviewTable();

				$scope.successMessagePart = $scope.currentGeoresourceDataset.datasetName;

				$("#georesourceEditFeaturesSuccessAlert").show();
				$scope.loadingData = false;

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#georesourceEditFeaturesErrorAlert").show();
					$scope.loadingData = false;
			});
		};

		$scope.resetGeoresourceEditFeaturesForm = function(){

			$scope.georesourceFeaturesGeoJSON = undefined;
			$scope.remainingFeatureHeaders = undefined;

			$scope.periodOfValidity = {};
			$scope.periodOfValidity.startDate = undefined;
			$scope.periodOfValidity.endDate = undefined;
			$scope.periodOfValidityInvalid = false;

			$scope.geoJsonString = undefined;
			$scope.georesource_asGeoJson = undefined;

			$scope.georesourceEditFeaturesDataSourceInputInvalidReason = undefined;
			$scope.georesourceEditFeaturesDataSourceInputInvalid = false;
			$scope.idPropertyNotFound = false;
			$scope.namePropertyNotFound = false;
			$scope.spatialResourceConfigured = false;
			$scope.geodataSourceFormat = undefined;
			$scope.georesourceDataSourceIdProperty = undefined;
			$scope.georesourceDataSourceNameProperty = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

			$("#georesourceEditFeaturesSuccessAlert").hide();
			$("#georesourceEditFeaturesErrorAlert").hide();
		};

		$scope.filterByKomMonitorProperties = function() {
			return function( item ) {

				try{
					if (item === __env.FEATURE_ID_PROPERTY_NAME || item === __env.FEATURE_NAME_PROPERTY_NAME || item === "validStartDate" || item === "validEndDate"){
						return false;
					}
					return true;
				}
				catch(error){
					return false;
				}
			};
		};

		$scope.getFeatureId = function(geojsonFeature){
			return geojsonFeature.properties[__env.FEATURE_ID_PROPERTY_NAME];
		};

		$scope.getFeatureName = function(geojsonFeature){
			return geojsonFeature.properties[__env.FEATURE_NAME_PROPERTY_NAME];
		};

		$scope.checkPeriodOfValidity = function(){
			$scope.periodOfValidityInvalid = false;
			if ($scope.periodOfValidity.startDate && $scope.periodOfValidity.endDate){
				var startDate = new Date($scope.periodOfValidity.startDate);
				var endDate = new Date($scope.periodOfValidity.endDate);

				if ((startDate === endDate) || startDate > endDate){
					// failure
					$scope.periodOfValidityInvalid = true;
				}
			}
		};

		$scope.editGeoresourceFeatures = function(){

			var putBody =
			{
				"geoJsonString": $scope.geoJsonString,
				"periodOfValidity": {
					"endDate": $scope.periodOfValidity.endDate,
					"startDate": $scope.periodOfValidity.startDate
				}
			};

			// TODO verify input

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId,
				method: "PUT",
				data: putBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$rootScope.$broadcast("refreshGeoresourceOverviewTable");
					// $scope.refreshGeoresourceEditFeaturesOverviewTable();

					$scope.successMessagePart = $scope.currentGeoresourceDataset.datasetName;

					$("#georesourceEditFeaturesSuccessAlert").show();
					$scope.loadingData = false;

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#georesourceEditFeaturesErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#georesourceEditFeaturesSuccessAlert").hide();
					// }, 3000);
			});
		};

		$(document).on("change", "#georesourceEditFeaturesDataSourceInput" ,function(){
				// TODO validate file input and
				$scope.georesourceEditFeaturesDataSourceInputInvalidReason = undefined;
				$scope.georesourceEditFeaturesDataSourceInputInvalid = false;

				$scope.geoJsonString = undefined;
				$scope.georesource_asGeoJson = undefined;

				// get the file
				var file = document.getElementById('georesourceEditFeaturesDataSourceInput').files[0];

				var fileEnding = file.name.split('.').pop();

				if(fileEnding.toUpperCase() === "json".toUpperCase() || fileEnding.toUpperCase() === "geojson".toUpperCase()){
					console.log("Potential GeoJSON file identified")
					$scope.processFileInput_geoJson(file);
				}
		});

		$scope.processFileInput_geoJson = function(file){
			var fileReader = new FileReader();

			fileReader.onload = function(event) {
				// $scope.geoJsonString = event.target.result;
				$scope.georesource_asGeoJson = JSON.parse(event.target.result);

				if(! $scope.georesource_asGeoJson.features){
					console.error("uploaded GeoJSON is not a valid FeatureCollection");
					$scope.georesourceEditFeaturesDataSourceInputInvalidReason = "GeoJSON ist keine valide FeatureCollection.";
					$scope.georesourceEditFeaturesDataSourceInputInvalid = true;
				}

				$scope.checkGeoresourceDataSource();
			};

			// Read in the image file as a data URL.
			fileReader.readAsText(file);
		};

		$scope.checkGeoresourceDataSource = function(){
			$scope.idPropertyNotFound = false;
			$scope.namePropertyNotFound = false;
			$scope.spatialResourceConfigured = false;
			if($scope.georesource_asGeoJson && $scope.georesourceDataSourceIdProperty && $scope.georesourceDataSourceNameProperty){

					 $scope.georesource_asGeoJson.features.forEach(function(feature){
						 if(! feature.properties[$scope.georesourceDataSourceIdProperty]){
							 $scope.idPropertyNotFound = true;
							 return;
						 }
						 if(! feature.properties[$scope.georesourceDataSourceNameProperty]){
							 $scope.namePropertyNotFound = true;
							 return;
						 }

						 // else everything fine
						 // append ID and NAME properties using KomMOnitor required property names
						 feature.properties[__env.FEATURE_ID_PROPERTY_NAME] = feature.properties[$scope.georesourceDataSourceIdProperty];
						 feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] = feature.properties[$scope.georesourceDataSourceNameProperty];
					 });

					 $scope.geoJsonString = JSON.stringify($scope.georesource_asGeoJson);
					 $scope.spatialResourceConfigured = true;
			}
		};


			$scope.hideSuccessAlert = function(){
				$("#georesourceEditFeaturesSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#georesourceEditFeaturesErrorAlert").hide();
			};

	}
]});
