angular.module('spatialUnitAddModal').component('spatialUnitAddModal', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitAddModal/spatial-unit-add-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env',function SpatialUnitAddModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env) {

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
    $('#spatialUnitAddDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#spatialUnitAddDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);
		$('#spatialUnitAddLastUpdateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$scope.loadingData = false;

		$scope.spatialUnitLevel = undefined;
		$scope.spatialUnitLevelInvalid = false;

		$scope.metadata = {};
		$scope.metadata.note = undefined;
		$scope.metadata.literature = undefined;
		$scope.metadata.updateInterval = undefined;
		$scope.metadata.sridEPSG = undefined;
		$scope.metadata.datasource = undefined;
		$scope.metadata.databasis = undefined;
		$scope.metadata.contact = undefined;
		$scope.metadata.lastUpdate = undefined;
		$scope.metadata.description = undefined;

		$scope.nextLowerHierarchySpatialUnit = undefined;
		$scope.nextUpperHierarchySpatialUnit = undefined;
		$scope.hierarchyInvalid = false;

		$scope.periodOfValidity = {};
		$scope.periodOfValidity.startDate = undefined;
		$scope.periodOfValidity.endDate = undefined;
		$scope.periodOfValidityInvalid = false;

		$scope.geoJsonString = undefined;
		$scope.spatialUnit_asGeoJson = undefined;

		$scope.spatialUnitDataSourceInputInvalidReason = undefined;
		$scope.spatialUnitDataSourceInputInvalid = false;
		$scope.spatialResourceConfigured = false;
		$scope.idPropertyNotFound = false;
		$scope.namePropertyNotFound = false;
		$scope.geodataSourceFormat = undefined;
		$scope.spatialUnitDataSourceIdProperty = undefined;
		$scope.spatialUnitDataSourceNameProperty = undefined;

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;


		$scope.resetSpatialUnitAddForm = function(){
			$scope.spatialUnitLevel = undefined;
			$scope.spatialUnitLevelInvalid = false;

			$scope.metadata = {};
			$scope.metadata.note = undefined;
			$scope.metadata.literature = undefined;
			$scope.metadata.updateInterval = undefined;
			$scope.metadata.sridEPSG = undefined;
			$scope.metadata.datasource = undefined;
			$scope.metadata.databasis = undefined;
			$scope.metadata.contact = undefined;
			$scope.metadata.lastUpdate = undefined;
			$scope.metadata.description = undefined;

			$scope.nextLowerHierarchySpatialUnit = undefined;
			$scope.nextUpperHierarchySpatialUnit = undefined;
			$scope.hierarchyInvalid = false;

			$scope.periodOfValidity = {};
			$scope.periodOfValidity.startDate = undefined;
			$scope.periodOfValidity.endDate = undefined;
			$scope.periodOfValidityInvalid = false;

			$scope.geoJsonString = undefined;
			$scope.spatialUnit_asGeoJson = undefined;

			$scope.spatialUnitDataSourceInputInvalidReason = undefined;
			$scope.spatialUnitDataSourceInputInvalid = false;
			$scope.idPropertyNotFound = false;
			$scope.namePropertyNotFound = false;
			$scope.spatialResourceConfigured = false;
			$scope.geodataSourceFormat = undefined;
			$scope.spatialUnitDataSourceIdProperty = undefined;
			$scope.spatialUnitDataSourceNameProperty = undefined;
		};

		$scope.checkSpatialUnitName = function(){
			$scope.spatialUnitLevelInvalid = false;
			kommonitorDataExchangeService.availableSpatialUnits.forEach(function(spatialUnit){
				if (spatialUnit.spatialUnitLevel === $scope.spatialUnitLevel){
					$scope.spatialUnitLevelInvalid = true;
					return;
				}
			});
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

		$scope.checkSpatialUnitHierarchy = function(){

			$scope.hierarchyInvalid = false;

			// smaller indices represent higher spatial units
			// i.e. city districts will have a smaller index than building blocks
			if($scope.nextLowerHierarchySpatialUnit && $scope.nextUpperHierarchySpatialUnit){
				var indexOfLowerHierarchyUnit;
				var indexOfUpperHierarchyUnit;

				for(var i=0; i<kommonitorDataExchangeService.availableSpatialUnits.length; i++){
					var spatialUnit = kommonitorDataExchangeService.availableSpatialUnits[i];
					if (spatialUnit.spatialUnitLevel === $scope.nextLowerHierarchySpatialUnit.spatialUnitLevel){
						indexOfLowerHierarchyUnit = i;
					}
					if (spatialUnit.spatialUnitLevel === $scope.nextUpperHierarchySpatialUnit.spatialUnitLevel){
						indexOfUpperHierarchyUnit = i;
					}
				}

					if ((indexOfLowerHierarchyUnit <= indexOfUpperHierarchyUnit)){
						// failure
						$scope.hierarchyInvalid = true;
					}
			}
		};

		$scope.addSpatialUnit = function(){

			var postBody =
			{
				"geoJsonString": $scope.geoJsonString,
				"metadata": {
					"note": $scope.metadata.note,
					"literature": $scope.metadata.literature,
					"updateInterval": $scope.metadata.updateInterval.apiName,
					"sridEPSG": $scope.metadata.sridEPSG,
					"datasource": $scope.metadata.datasource,
					"contact": $scope.metadata.contact,
					"lastUpdate": $scope.metadata.lastUpdate,
					"description": $scope.metadata.description,
					"databasis": $scope.metadata.databasis,
					"sridEPSG": 4326
				},
				"jsonSchema": null,
				"nextLowerHierarchyLevel": $scope.nextLowerHierarchySpatialUnit.spatialUnitLevel,
				"spatialUnitLevel": $scope.spatialUnitLevel,
				"periodOfValidity": {
					"endDate": $scope.periodOfValidity.endDate,
					"startDate": $scope.periodOfValidity.startDate
				},
				"nextUpperHierarchyLevel": $scope.nextUpperHierarchySpatialUnit.spatialUnitLevel
			};

			// TODO verify input

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units",
				method: "POST",
				data: postBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$rootScope.$broadcast("refreshSpatialUnitOverviewTable");
					$scope.loadingData = false;

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#spatialUnitAddErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitAddSucessAlert").hide();
					// }, 3000);
			});
		};

		$(document).on("change", "#spatialUnitDataSourceInput" ,function(){
				// TODO validate file input and
				$scope.spatialUnitDataSourceInputInvalidReason = undefined;
				$scope.spatialUnitDataSourceInputInvalid = false;

				$scope.geoJsonString = undefined;
				$scope.spatialUnit_asGeoJson = undefined;

				// get the file
				var file = document.getElementById('spatialUnitDataSourceInput').files[0];

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
					$scope.spatialUnitDataSourceInputInvalidReason = "GeoJSON ist keine valide FeatureCollection.";
					$scope.spatialUnitDataSourceInputInvalid = true;
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
				$("#spatialUnitAddSucessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#spatialUnitAddErrorAlert").hide();
			};

	}
]});
