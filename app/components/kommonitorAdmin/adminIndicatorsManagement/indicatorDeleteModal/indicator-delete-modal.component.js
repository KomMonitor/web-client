angular.module('indicatorDeleteModal').component('indicatorDeleteModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorDeleteModal/indicator-delete-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$q', '$timeout', function IndicatorDeleteModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $q, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.indicatorDeleteTypes = [{
			"displayName": "Gesamter Datensatz",
			"apiName": "indicatorDataset"
		},
		{
			"displayName": "Einzelne Zeitschnitte",
			"apiName": "indicatorTimestamp"
		},
		{
			"displayName": "Einzelne Raumebenen",
			"apiName": "indicatorSpatialUnit"
		}];
		$scope.indicatorDeleteType = $scope.indicatorDeleteTypes[0];
		$scope.selectedIndicatorDataset = undefined;
		$scope.currentApplicableDates = [];
		$scope.selectIndicatorTimestampsInput = false;
		$scope.currentApplicableSpatialUnits = [];
		$scope.selectIndicatorSpatialUnitsInput = false;

		$scope.loadingData = false;

		$scope.successfullyDeletedDatasets = [];
		$scope.successfullyDeletedTimestamps = [];
		$scope.successfullyDeletedSpatialUnits = [];
		$scope.failedDatasetsAndErrors = [];
		$scope.failedTimestampsAndErrors = [];
		$scope.failedSpatialUnitsAndErrors = [];

		$scope.affectedScripts = [];
		$scope.affectedIndicatorReferences = [];
		$scope.affectedGeoresourceReferences = [];

		$scope.onChangeSelectIndicatorTimestampEntries = function(){

			if(!$scope.selectIndicatorTimestampsInput){
				$scope.selectIndicatorTimestampsInput = true;
			}
			else{
				$scope.selectIndicatorTimestampsInput = false;
			}

			if ($scope.selectIndicatorTimestampsInput){
				$scope.currentApplicableDates.forEach(function(applicableDate){
					applicableDate.isSelected = true;
						
				});
			}
			else{
				$scope.currentApplicableDates.forEach(function(applicableDate){
					applicableDate.isSelected = false;
				});
			}
		};

		$scope.onChangeSelectIndicatorSpatialUnitsEntries = function(){

			if(!$scope.selectIndicatorSpatialUnitsInput){
				$scope.selectIndicatorSpatialUnitsInput = true;
			}
			else{
				$scope.selectIndicatorSpatialUnitsInput = false;
			}

			if ($scope.selectIndicatorSpatialUnitsInput){
				$scope.currentApplicableSpatialUnits.forEach(function(applicableSpatialUnit){
					applicableSpatialUnit.isSelected = true;
						
				});
			}
			else{
				$scope.currentApplicableSpatialUnits.forEach(function(applicableSpatialUnit){
					applicableSpatialUnit.isSelected = false;
				});
			}
		};

		$scope.onChangeSelectedIndicator = function(){
			if ($scope.selectedIndicatorDataset){	
				
				$scope.successfullyDeletedDatasets = [];
				$scope.successfullyDeletedTimestamps = [];
				$scope.successfullyDeletedSpatialUnits = [];
				$scope.failedDatasetsAndErrors = [];
				$scope.failedTimestampsAndErrors = [];
				$scope.failedSpatialUnitsAndErrors = [];

				$scope.currentApplicableDates = [];
				for (const timestamp of $scope.selectedIndicatorDataset.applicableDates) {
					$scope.currentApplicableDates.push({
						"timestamp": timestamp,
						"isSelected": false
						
					});
				}

				$scope.currentApplicableSpatialUnits = [];
				for (const spatialUnitMetadata of kommonitorDataExchangeService.availableSpatialUnits) {
					if($scope.selectedIndicatorDataset.applicableSpatialUnits && $scope.selectedIndicatorDataset.applicableSpatialUnits.some(o => o.spatialUnitName === spatialUnitMetadata.spatialUnitLevel))
					
					$scope.currentApplicableSpatialUnits.push({
						"spatialUnitMetadata": spatialUnitMetadata,
						"isSelected": false
						
					});
				}

				$scope.affectedScripts = $scope.gatherAffectedScripts();
				$scope.affectedIndicatorReferences = $scope.gatherAffectedIndicatorReferences();
				$scope.affectedGeoresourceReferences = $scope.gatherAffectedGeoresourceReferences();

				setTimeout(() => {
					// initialize any adminLTE box widgets
					$('.box').boxWidget();
				}, 500);
			}
		};

		$scope.resetIndicatorsDeleteForm = function(){

			$scope.selectedIndicatorDataset = undefined;
			$scope.currentApplicableDates = [];
			$scope.selectIndicatorTimestampsInput = false;
			$scope.currentApplicableSpatialUnits = [];
			$scope.selectIndicatorSpatialUnitsInput = false;
			$scope.indicatorDeleteType = $scope.indicatorDeleteTypes[0];

			$scope.successfullyDeletedDatasets = [];
				$scope.successfullyDeletedTimestamps = [];
				$scope.successfullyDeletedSpatialUnits = [];
				$scope.failedDatasetsAndErrors = [];
				$scope.failedTimestampsAndErrors = [];
				$scope.failedSpatialUnitsAndErrors = [];
			$scope.affectedScripts = [];
			$scope.affectedIndicatorReferences = [];
			$scope.affectedGeoresourceReferences = [];
			$("#georesourcesDeleteSuccessAlert").hide();
			$("#georesourcesDeleteErrorAlert").hide();

			
		};

		$scope.gatherAffectedScripts = function(){
			$scope.affectedScripts = [];

			kommonitorDataExchangeService.availableProcessScripts.forEach(function(script){
				var requiredIndicatorIds = script.requiredIndicatorIds;

				for(var i=0; i<requiredIndicatorIds.length; i++){
					var indicatorId = requiredIndicatorIds[i];
					if(indicatorId === $scope.selectedIndicatorDataset.indicatorId){
						$scope.affectedScripts.push(script);
						break;
					}
				}
			});

			return $scope.affectedScripts;
		};

		$scope.gatherAffectedGeoresourceReferences = function(){
			$scope.affectedGeoresourceReferences = [];

			var georesourceReferences = $scope.selectedIndicatorDataset.referencedGeoresources;

				for(var i=0; i<georesourceReferences.length; i++){
					var georesourceReference = georesourceReferences[i];

					$scope.affectedGeoresourceReferences.push({
						"indicatorMetadata": $scope.selectedIndicatorDataset,
						"georesourceReference": georesourceReference
					});
				}

			return $scope.affectedGeoresourceReferences;
		};

		$scope.gatherAffectedIndicatorReferences = function(){
			$scope.affectedIndicatorReferences = [];

			// first add all direct references from selected indicator
			var indicatorReferences_selectedIndicator = $scope.selectedIndicatorDataset.referencedIndicators;

				for(var i=0; i<indicatorReferences_selectedIndicator.length; i++){
					var indicatorReference_selectedIndicator = indicatorReferences_selectedIndicator[i];

					$scope.affectedIndicatorReferences.push({
						"indicatorMetadata": $scope.selectedIndicatorDataset,
						"indicatorReference": indicatorReference_selectedIndicator
					});
				}


			// then add all references, where selected indicator is the referencedIndicator 

			kommonitorDataExchangeService.availableIndicators.forEach(function(indicator){
				var indicatorReferences = indicator.referencedIndicators;

				for(var i=0; i<indicatorReferences.length; i++){
					var indicatorReference = indicatorReferences[i];
					if(indicatorReference.referencedIndicatorId === $scope.selectedIndicatorDataset.indicatorId){
						$scope.affectedIndicatorReferences.push({
							"indicatorMetadata": $scope.selectedIndicatorDataset,
							"indicatorReference": indicatorReference
						});						
					}
				}
			});

			return $scope.affectedIndicatorReferences;
		};

		$scope.deleteIndicatorData = function(){

			$scope.loadingData = true;

			$scope.successfullyDeletedDatasets = [];
				$scope.successfullyDeletedTimestamps = [];
				$scope.successfullyDeletedSpatialUnits = [];
				$scope.failedDatasetsAndErrors = [];
				$scope.failedTimestampsAndErrors = [];
				$scope.failedSpatialUnitsAndErrors = [];

			// depending on deleteType we must execute different DELETE requests

			if ($scope.indicatorDeleteType.apiName === "indicatorDataset"){
				// delete complete dataset
				$scope.deleteWholeIndicatorDataset();
			}
			else if ($scope.indicatorDeleteType.apiName === "indicatorTimestamp"){
				// delete all selected timestamps from indicator
				$scope.deleteSelectedIndicatorTimestamps();
			}
			else if ($scope.indicatorDeleteType.apiName === "indicatorSpatialUnit"){
				// delete all selected spatial units from indicator
				$scope.deleteSelectedIndicatorSpatialUnits();
			}

		};

		$scope.deleteWholeIndicatorDataset = function(){
			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.selectedIndicatorDataset.indicatorId,
				method: "DELETE"
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(async function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successfullyDeletedDatasets.push($scope.selectedIndicatorDataset);

					// fetch indicatorMetada again as a indicator was deleted
					await kommonitorDataExchangeService.fetchIndicatorsMetadata();
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");
					$rootScope.$broadcast("refreshIndicatorOverviewTable");
					$("#indicatorsDeleteSuccessAlert").show();

					$timeout(function(){
				
						$scope.loadingData = false;
					});	

					// $scope.resetIndicatorsDeleteForm();

				}, function errorCallback(error) {
					if(error.data){							
						$scope.failedDatasetsAndErrors.push([$scope.selectedIndicatorDataset, kommonitorDataExchangeService.syntaxHighlightJSON(error.data)]);
					}
					else{
						$scope.failedDatasetsAndErrors.push([$scope.selectedIndicatorDataset, kommonitorDataExchangeService.syntaxHighlightJSON(error)]);
					}

					$("#indicatorsDeleteErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#indicatorEditMetadataSuccessAlert").hide();
					// }, 3000);
			});
		};

		$scope.deleteSelectedIndicatorTimestamps = async function(){

			// iterate over all appicableSpatialUnits and selected applicableDates
			for (const applicableDate of $scope.currentApplicableDates) {
				if(applicableDate.isSelected){
					for (const applicableSpatialUnit of $scope.currentApplicableSpatialUnits) {				
						await $scope.getDeleteTimestampPromise(applicableDate, applicableSpatialUnit.spatialUnitMetadata.spatialUnitId);
					}
				}				
			}

			if($scope.failedTimestampsAndErrors.length > 0){
				// error handling
				$("#indicatorsDeleteErrorAlert").show();
				// if ($scope.successfullyDeletedDatasets.length > 0){
				// 	$("#indicatorsDeleteSuccessAlert").show();
				// }

				$scope.loadingData = false;
			}
			if($scope.successfullyDeletedTimestamps.length > 0){
				$("#indicatorsDeleteSuccessAlert").show();

				// fetch indicatorMetada again as a georesource was deleted
				await kommonitorDataExchangeService.fetchIndicatorsMetadata();
				// refresh overview table
				$rootScope.$broadcast("refreshIndicatorOverviewTable");

				// refresh all admin dashboard diagrams due to modified metadata
				$rootScope.$broadcast("refreshAdminDashboardDiagrams");

				$scope.loadingData = false;

				// $scope.resetIndicatorsDeleteForm();
			}

		};

		$scope.deleteSelectedIndicatorSpatialUnits = async function(){

			// iterate over all appicableSpatialUnits
			for (const applicableSpatialUnit of $scope.currentApplicableSpatialUnits) {
				if(applicableSpatialUnit.isSelected){					
					 await $scope.getDeleteSpatialUnitPromise(applicableSpatialUnit);
				}
			}

			if($scope.failedSpatialUnitsAndErrors.length > 0){
				// error handling
				$("#indicatorsDeleteErrorAlert").show();
				// if ($scope.successfullyDeletedDatasets.length > 0){
				// 	$("#indicatorsDeleteSuccessAlert").show();
				// }

				$scope.loadingData = false;
			}
			if($scope.successfullyDeletedSpatialUnits.length > 0){
				$("#indicatorsDeleteSuccessAlert").show();

				// fetch indicatorMetada again as a georesource was deleted
				await kommonitorDataExchangeService.fetchIndicatorsMetadata();
				// refresh overview table
				$rootScope.$broadcast("refreshIndicatorOverviewTable");

				// refresh all admin dashboard diagrams due to modified metadata
				$rootScope.$broadcast("refreshAdminDashboardDiagrams");

				$scope.loadingData = false;

				// $scope.resetIndicatorsDeleteForm();
			}
		};

			$scope.getDeleteTimestampPromise = function(applicableDate, spatialUnitId){

				// timestamp looks like  2020-12-31
				var timestamp = applicableDate.timestamp;

				// [yyyy, mm, tt]
				var timestampComps = timestamp.split("-");

				return $http({
					url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.selectedIndicatorDataset.indicatorId + "/" +  spatialUnitId + "/" + timestampComps[0]  + "/" + timestampComps[1]  + "/" + timestampComps[2],
					method: "DELETE"
				}).then(function successCallback(response) {
							if(! $scope.successfullyDeletedTimestamps.includes(applicableDate)){								
								$scope.successfullyDeletedTimestamps.push(applicableDate);
							}

					}, function errorCallback(error) {
						if(error.data){							
							$scope.failedTimestampsAndErrors.push([applicableDate, kommonitorDataExchangeService.syntaxHighlightJSON(error.data)]);
						}
						else{
							$scope.failedTimestampsAndErrors.push([applicableDate, kommonitorDataExchangeService.syntaxHighlightJSON(error)]);
						}
				});
			};

			$scope.getDeleteSpatialUnitPromise = function(applicableSpatialUnit){

				return $http({
					url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + $scope.selectedIndicatorDataset.indicatorId + "/" +  applicableSpatialUnit.spatialUnitMetadata.spatialUnitId,
					method: "DELETE"
				}).then(function successCallback(response) {
							if(! $scope.successfullyDeletedSpatialUnits.includes(applicableSpatialUnit)){								
								$scope.successfullyDeletedSpatialUnits.push(applicableSpatialUnit);
							}

					}, function errorCallback(error) {
						if(error.data){							
							$scope.failedSpatialUnitsAndErrors.push([applicableSpatialUnit, kommonitorDataExchangeService.syntaxHighlightJSON(error.data)]);
						}
						else{
							$scope.failedSpatialUnitsAndErrors.push([applicableSpatialUnit, kommonitorDataExchangeService.syntaxHighlightJSON(error)]);
						}
				});
			};

			$scope.hideSuccessAlert = function(){
				$("#indicatorsDeleteSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#indicatorsDeleteErrorAlert").hide();
			};

	}
]});
