angular.module('spatialUnitEditFeaturesModal').component('spatialUnitEditFeaturesModal', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$timeout',function SpatialUnitEditFeaturesModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		/*	POST BODY
				{
				  "geoJsonString": "geoJsonString",
				  "metadata": {
				    "note": "note",
				    "literature": "literature",
				    "updateInterval": "ARBITRARY",
				    "sridEPSG": 0.8008281904610115,
				    "datasource": "datasource",
				    "contact": "contact",
				    "lastUpdate": "2000-01-23",
				    "description": "description",
				    "databasis": "databasis"
				  },
				  "jsonSchema": "jsonSchema",
				  "nextLowerHierarchyLevel": "nextLowerHierarchyLevel",
				  "spatialUnitLevel": "spatialUnitLevel",
				  "periodOfValidity": {
				    "endDate": "2000-01-23",
				    "startDate": "2000-01-23"
				  },
				  "nextUpperHierarchyLevel": "nextUpperHierarchyLevel"
				}
		*/

		//Date picker
    $('#spatialUnitEditFeaturesDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#spatialUnitEditFeaturesDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$scope.spatialUnitFeaturesGeoJSON;
		$scope.currentSpatialUnitDataset;
		$scope.remainingFeatureHeaders;

		$scope.loadingData = false;

		$scope.periodOfValidity = {};
		$scope.periodOfValidity.startDate = undefined;
		$scope.periodOfValidity.endDate = undefined;
		$scope.periodOfValidityInvalid = false;

		$scope.geoJsonString = undefined;
		$scope.spatialUnit_asGeoJson = undefined;

		$scope.spatialUnitEditFeaturesDataSourceInputInvalidReason = undefined;
		$scope.spatialUnitEditFeaturesDataSourceInputInvalid = false;
		$scope.spatialResourceConfigured = false;
		$scope.idPropertyNotFound = false;
		$scope.namePropertyNotFound = false;
		$scope.geodataSourceFormat = undefined;
		$scope.spatialUnitDataSourceIdProperty = undefined;
		$scope.spatialUnitDataSourceNameProperty = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditSpatialUnitFeatures", function (event, spatialUnitDataset) {

			if($scope.currentSpatialUnitDataset && $scope.currentSpatialUnitDataset.spatialUnitLevel === spatialUnitDataset.spatialUnitLevel){
				return;
			}
			else{
				$scope.currentSpatialUnitDataset = spatialUnitDataset;

				// $scope.refreshSpatialUnitEditFeaturesOverviewTable();

				$scope.resetSpatialUnitEditFeaturesForm();
			}

		});

		$scope.refreshSpatialUnitEditFeaturesOverviewTable = function(){

			$scope.loadingData = true;
			// fetch all spatial unit features
			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units/" + $scope.currentSpatialUnitDataset.spatialUnitId + "/allFeatures",
				method: "GET",
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {

				$scope.spatialUnitFeaturesGeoJSON = response.data;

				var tmpRemainingHeaders = [];

				for (var property in $scope.spatialUnitFeaturesGeoJSON.features[0].properties){
					if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME){
						tmpRemainingHeaders.push(property);
					}
				}

				$scope.remainingFeatureHeaders = tmpRemainingHeaders;

					$scope.loadingData = false;

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#spatialUnitEditFeaturesErrorAlert").show();
					$scope.loadingData = false;
			});
		};

		$scope.resetSpatialUnitEditFeaturesForm = function(){

			$scope.periodOfValidity = {};
			$scope.periodOfValidity.startDate = undefined;
			$scope.periodOfValidity.endDate = undefined;
			$scope.periodOfValidityInvalid = false;

			$scope.geoJsonString = undefined;
			$scope.spatialUnit_asGeoJson = undefined;

			$scope.spatialUnitEditFeaturesDataSourceInputInvalidReason = undefined;
			$scope.spatialUnitEditFeaturesDataSourceInputInvalid = false;
			$scope.idPropertyNotFound = false;
			$scope.namePropertyNotFound = false;
			$scope.spatialResourceConfigured = false;
			$scope.geodataSourceFormat = undefined;
			$scope.spatialUnitDataSourceIdProperty = undefined;
			$scope.spatialUnitDataSourceNameProperty = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;

			$("#spatialUnitEditFeaturesSuccessAlert").hide();
			$("#spatialUnitEditFeaturesErrorAlert").hide();
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

		$scope.editSpatialUnitFeatures = function(){

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
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units/" + $scope.currentSpatialUnitDataset.spatialUnitId,
				method: "PUT",
				data: putBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$rootScope.$broadcast("refreshSpatialUnitOverviewTable");
					// $scope.refreshSpatialUnitEditFeaturesOverviewTable();

					$scope.successMessagePart = $scope.currentSpatialUnitDataset.spatialUnitLevel;

					$("#spatialUnitEditFeaturesSuccessAlert").show();
					$scope.loadingData = false;

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#spatialUnitEditFeaturesErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitEditFeaturesSuccessAlert").hide();
					// }, 3000);
			});
		};

		$(document).on("change", "#spatialUnitEditFeaturesDataSourceInput" ,function(){
				// TODO validate file input and
				$scope.spatialUnitEditFeaturesDataSourceInputInvalidReason = undefined;
				$scope.spatialUnitEditFeaturesDataSourceInputInvalid = false;

				$scope.geoJsonString = undefined;
				$scope.spatialUnit_asGeoJson = undefined;

				// get the file
				var file = document.getElementById('spatialUnitEditFeaturesDataSourceInput').files[0];

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
				$scope.spatialUnit_asGeoJson = JSON.parse(event.target.result);

				if(! $scope.spatialUnit_asGeoJson.features){
					console.error("uploaded GeoJSON is not a valid FeatureCollection");
					$scope.spatialUnitEditFeaturesDataSourceInputInvalidReason = "GeoJSON ist keine valide FeatureCollection.";
					$scope.spatialUnitEditFeaturesDataSourceInputInvalid = true;
				}

				$scope.checkSpatialUnitDataSource();
			};

			// Read in the image file as a data URL.
			fileReader.readAsText(file);
		};

		$scope.checkSpatialUnitDataSource = function(){
			$scope.idPropertyNotFound = false;
			$scope.namePropertyNotFound = false;
			$scope.spatialResourceConfigured = false;
			if($scope.spatialUnit_asGeoJson && $scope.spatialUnitDataSourceIdProperty && $scope.spatialUnitDataSourceNameProperty){

					 $scope.spatialUnit_asGeoJson.features.forEach(function(feature){
						 if(! feature.properties[$scope.spatialUnitDataSourceIdProperty]){
							 $scope.idPropertyNotFound = true;
							 return;
						 }
						 if(! feature.properties[$scope.spatialUnitDataSourceNameProperty]){
							 $scope.namePropertyNotFound = true;
							 return;
						 }

						 // else everything fine
						 // append ID and NAME properties using KomMOnitor required property names
						 feature.properties[__env.FEATURE_ID_PROPERTY_NAME] = feature.properties[$scope.spatialUnitDataSourceIdProperty];
						 feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] = feature.properties[$scope.spatialUnitDataSourceNameProperty];
					 });

					 $scope.geoJsonString = JSON.stringify($scope.spatialUnit_asGeoJson);
					 $scope.spatialResourceConfigured = true;
			}
		};


			$scope.hideSuccessAlert = function(){
				$("#spatialUnitEditFeaturesSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#spatialUnitEditFeaturesErrorAlert").hide();
			};

	}
]});
