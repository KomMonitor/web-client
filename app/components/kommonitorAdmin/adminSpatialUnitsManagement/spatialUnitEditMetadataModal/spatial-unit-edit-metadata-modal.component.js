angular.module('spatialUnitEditMetadataModal').component('spatialUnitEditMetadataModal', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env',function SpatialUnitEditMetadataModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentSpatialUnitDataset;

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
		$('#spatialUnitEditMetadataLastUpdateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

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

		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditSpatialUnitMetadata", function (event, spatialUnitDataset) {

			$scope.currentSpatialUnitDataset = spatialUnitDataset;

			$scope.resetSpatialUnitEditMetadataForm();

		});


		$scope.resetSpatialUnitEditMetadataForm = function(){

			$scope.spatialUnitLevel = $scope.currentSpatialUnitDataset.spatialUnitLevel;
			$scope.spatialUnitLevelInvalid = false;

			$scope.metadata = {};
			$scope.metadata.note = $scope.currentSpatialUnitDataset.metadata.note;
			$scope.metadata.literature = $scope.currentSpatialUnitDataset.metadata.literature;
			$scope.metadata.sridEPSG = 4326;
			$scope.metadata.datasource = $scope.currentSpatialUnitDataset.metadata.datasource;
			$scope.metadata.databasis = $scope.currentSpatialUnitDataset.metadata.databasis;
			$scope.metadata.contact = $scope.currentSpatialUnitDataset.metadata.contact;
			$scope.metadata.description = $scope.currentSpatialUnitDataset.metadata.description;

			$scope.metadata.lastUpdate = $scope.currentSpatialUnitDataset.metadata.lastUpdate;
			// $('#spatialUnitEditMetadataLastUpdateDatepicker').data({date: $scope.currentSpatialUnitDataset.metadata.lastUpdate});
			$('#spatialUnitEditMetadataLastUpdateDatepicker').datepicker('setDate', $scope.currentSpatialUnitDataset.metadata.lastUpdate);

			kommonitorDataExchangeService.updateIntervalOptions.forEach(function(option){
				if(option.apiName === $scope.currentSpatialUnitDataset.metadata.updateInterval){
					$scope.metadata.updateInterval = option;
				}
			});

			for(var i=0; i<kommonitorDataExchangeService.availableSpatialUnits.length; i++){
				var spatialUnit = kommonitorDataExchangeService.availableSpatialUnits[i];
				if (spatialUnit.spatialUnitLevel === $scope.currentSpatialUnitDataset.nextLowerHierarchyLevel){
					$scope.nextLowerHierarchySpatialUnit = spatialUnit;
				}
				if (spatialUnit.spatialUnitLevel === $scope.currentSpatialUnitDataset.nextUpperHierarchyLevel){
					$scope.nextUpperHierarchySpatialUnit = spatialUnit;
				}
			}
			$scope.hierarchyInvalid = false;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#spatialUnitEditMetadataSuccessAlert").hide();
			$("#spatialUnitEditMetadataErrorAlert").hide();
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

		$scope.editSpatialUnitMetadata = function(){

			var patchBody =
			{
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
				"nextLowerHierarchyLevel": $scope.nextLowerHierarchySpatialUnit.spatialUnitLevel,
				"nextUpperHierarchyLevel": $scope.nextUpperHierarchySpatialUnit.spatialUnitLevel
			};

			// TODO verify input

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units/" + $scope.currentSpatialUnitDataset.spatialUnitId,
				method: "PATCH",
				data: patchBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.currentSpatialUnitDataset.spatialUnitLevel;

					$rootScope.$broadcast("refreshSpatialUnitOverviewTable");
					$("#spatialUnitEditMetadataSuccessAlert").show();
					$scope.loadingData = false;

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#spatialUnitEditMetadataErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitEditMetadataSuccessAlert").hide();
					// }, 3000);
			});
		};

			$scope.hideSuccessAlert = function(){
				$("#spatialUnitEditMetadataSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#spatialUnitEditMetadataErrorAlert").hide();
			};

	}
]});
