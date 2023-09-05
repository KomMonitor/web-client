angular.module('reachabilityIndicatorStatistics').component('reachabilityIndicatorStatistics', {
	templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/reachabilityScenarioModal/reachabilityIndicatorStatistics/reachability-indicator-statistics.template.html",
	controller: ['kommonitorDataExchangeService',
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorReachabilityHelperService', 'kommonitorDiagramHelperService',
		'kommonitorReachabilityMapHelperService', 'kommonitorSpatialDataProcessorHelperService',
		function reachabilityIndicatorStatisticsController(kommonitorDataExchangeService,
			$scope, $rootScope, $http, __env, $timeout, kommonitorReachabilityHelperService, kommonitorDiagramHelperService,
			kommonitorReachabilityMapHelperService, kommonitorSpatialDataProcessorHelperService) {

			this.kommonitorReachabilityHelperServiceInstance = kommonitorReachabilityHelperService;
			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorDiagramHelperServiceInstance = kommonitorDiagramHelperService;
			this.kommonitorSpatialDataProcessorHelperServiceInstance = kommonitorSpatialDataProcessorHelperService;

			$scope.selectedIndicatorForStatistics = undefined;
			$scope.selectedSpatialUnit = undefined;
			$scope.selectedIndicatorDate = undefined;

			$scope.indicatorStatistics = [];

			$scope.weightStrategyOptions = [
				{
					apiName: "simple",
					displayName: "überlappende Fläche",
					tooltip: "einfache Gewichtung anhand der geschnittenen Fläche pro Raumeinheit"
				},
				{
					apiName: "residential_areas",
					displayName: "überlappende Wohngebiete",
					tooltip: "beücksichtigt nur geschnittene Wohnflächen pro Raumeinheit"
				}
			];
			$scope.weightStrategy = $scope.weightStrategyOptions[0];

			// interactive map stuff
			$scope.domId = "reachabilityScenarioIsochroneStatisticsGeoMap";
			$scope.mapParts;

			$scope.init = function () {
				$scope.mapParts = kommonitorReachabilityMapHelperService.initReachabilityIndicatorStatisticsGeoMap($scope.domId);
			};

			$rootScope.$on("isochronesCalculationFinished", function () {

				kommonitorReachabilityMapHelperService
					.replaceIsochroneGeoJSON(
						$scope.domId,
						kommonitorReachabilityHelperService.currentIsochronesGeoJSON,
						kommonitorReachabilityHelperService.settings.transitMode,
						kommonitorReachabilityHelperService.settings.focus,
						kommonitorReachabilityHelperService.rangeArray,
						kommonitorReachabilityHelperService.settings.useMultipleStartPoints,
						kommonitorReachabilityHelperService.settings.dissolveIsochrones);

			});

			$scope.onChangeSelectedIndicatorForStatistics = function () {
				// $scope.selectedIndicatorForStatistics;

				$scope.selectedSpatialUnit = $scope.selectedIndicatorForStatistics.applicableSpatialUnits[$scope.selectedIndicatorForStatistics.applicableSpatialUnits.length - 1];
				$scope.selectedIndicatorDate = $scope.selectedIndicatorForStatistics.applicableDates[$scope.selectedIndicatorForStatistics.applicableDates.length - 1];			
			};

			$scope.onChangeSelectedSpatialUnit = function () {

			};

			$scope.queryJobStatus = function(jobId){
				let jobCompletedOrFailed = false;				
				// query every second
				$timeout(async function () {
					/*
						queued - The job has been created but process execution has not started, yet.
						running - Process execution has started.
						finished - Process execution has finished.
						failed - The job failed due to an error during process execution.
					*/
					let jobStatus = await kommonitorSpatialDataProcessorHelperService.getJobStatus(jobId);
					if(jobStatus == undefined || jobStatus.status == undefined){
						jobCompletedOrFailed = true;
						$scope.modifyJobStatus(jobId, "failed");
					}
					if (jobStatus.status == "finished" || jobStatus.status == "failed") {
						jobCompletedOrFailed = true;

						// trigger result retrieval
						if (jobStatus.status == "finished") {
							$scope.retrieveJobResult(jobId);
						}
					}
					$scope.modifyJobStatus(jobId, jobStatus.status);

					if (! jobCompletedOrFailed){
						// query again
						$scope.queryJobStatus(jobId);
					}
				}, 1000);
			};

			$scope.modifyJobStatus = function (jobId, jobStatus) {
				for (const indicatorStatisticsEntry of $scope.indicatorStatistics) {
					if (indicatorStatisticsEntry.jobId == jobId) {
						indicatorStatisticsEntry.progress = jobStatus;
						break;
					}
				}
			};

			$scope.retrieveJobResult = async function (jobId) {
				let response = await kommonitorSpatialDataProcessorHelperService.getJobResult(jobId);

				for (const indicatorStatisticsEntry of $scope.indicatorStatistics) {
					if (indicatorStatisticsEntry.jobId == jobId) {
						// as wen only query spatial data processor for one indicator and on timestamp at a time we can use first entry of result array
						// but we must consider that maybe multiple ranges have been queried
						indicatorStatisticsEntry.coverageResult = response.result[0];

						$scope.$digest();

						$scope.displayIndicatorStatisticOnMap(indicatorStatisticsEntry);
						break;
					}
				}
			}

			$scope.appendNewIsochroneStatistic = function (jobId) {
				let newIsochroneStatisticsEntry = {
					indicator: {
						indicatorId: $scope.selectedIndicatorForStatistics.indicatorId,
						indicatorName: $scope.selectedIndicatorForStatistics.indicatorName,
						unit: $scope.selectedIndicatorForStatistics.unit
					},
					spatialUnit: {
						spatialUnitId: $scope.selectedSpatialUnit.spatialUnitId,
						spatialUnitName: $scope.selectedSpatialUnit.spatialUnitName
					},
					weightStrategy: $scope.weightStrategy,
					timestamp: $scope.selectedIndicatorDate,
					progress: "queued",
					jobId: jobId,
					coverageResult: undefined
				}

				$scope.indicatorStatistics.push(newIsochroneStatisticsEntry);

				// now trigger periodical query of job status
				$scope.queryJobStatus(jobId);				
			}

			$scope.removeIndicatorStatistic = function(indicatorStatisticsCandidate){
				for (let index = 0; index < $scope.indicatorStatistics.length; index++) {
					const entry = $scope.indicatorStatistics[index];
					if(entry.jobId == indicatorStatisticsCandidate.jobId){
						$scope.indicatorStatistics.splice(index, 1);
						break;
					}					
				}
			};

			$scope.displayIndicatorStatisticOnMap = function(indicatorStatisticsCandidate){
				// property coverageResult stores isochrone prune result

				let poiDataset = kommonitorReachabilityHelperService.settings.selectedStartPointLayer;
				let original_nonDissolved_isochrones = kommonitorReachabilityHelperService.original_nonDissolved_isochrones;
				kommonitorReachabilityMapHelperService.replaceReachabilityIndicatorStatisticsOnMap($scope.domId, poiDataset, original_nonDissolved_isochrones, indicatorStatisticsCandidate);
			};

			$scope.computeReachabilityIndicatorStatistic = async function () {
				// query spatial data processor in order to compute indicator statistics

				let indicatorIdArray = [$scope.selectedIndicatorForStatistics.indicatorId];
				// weighting options: residential_areas, simple
				let weight = $scope.weightStrategy.apiName;
				let isochroneGeoJson = kommonitorReachabilityHelperService.original_nonDissolved_isochrones;
				let targetDate = $scope.selectedIndicatorDate;
				let spatialUnitId = $scope.selectedSpatialUnit.spatialUnitId;

				// postNewIsochroneStatistic = async function (indicatorIdArray, isochroneGeoJson, spatialUnitId, targetDate, weighting) 
				let jobId = await kommonitorSpatialDataProcessorHelperService.postNewIsochroneStatistic(indicatorIdArray, isochroneGeoJson, spatialUnitId, targetDate, weight);

				$scope.appendNewIsochroneStatistic(jobId);
			};

			// init component
			$scope.init();

		}
	]
});


