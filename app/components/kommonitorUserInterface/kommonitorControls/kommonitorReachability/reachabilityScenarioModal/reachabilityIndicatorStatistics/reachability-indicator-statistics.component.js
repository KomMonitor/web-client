angular.module('reachabilityIndicatorStatistics').component('reachabilityIndicatorStatistics', {
	templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/reachabilityScenarioModal/reachabilityIndicatorStatistics/reachability-indicator-statistics.template.html",
	controller: ['kommonitorDataExchangeService',
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorReachabilityHelperService', 'kommonitorDiagramHelperService',
		'kommonitorReachabilityMapHelperService', 'kommonitorSpatialDataProcessorHelperService', 'kommonitorReachabilityScenarioHelperService',
		'kommonitorReachabilityCoverageReportsHelperService', 'kommonitorToastHelperService', 
		function reachabilityIndicatorStatisticsController(kommonitorDataExchangeService,
			$scope, $rootScope, $http, __env, $timeout, kommonitorReachabilityHelperService, kommonitorDiagramHelperService,
			kommonitorReachabilityMapHelperService, kommonitorSpatialDataProcessorHelperService, kommonitorReachabilityScenarioHelperService,
			kommonitorReachabilityCoverageReportsHelperService, kommonitorToastHelperService) {

			this.kommonitorReachabilityHelperServiceInstance = kommonitorReachabilityHelperService;
			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorDiagramHelperServiceInstance = kommonitorDiagramHelperService;
			this.kommonitorSpatialDataProcessorHelperServiceInstance = kommonitorSpatialDataProcessorHelperService;
			this.kommonitorReachabilityScenarioHelperServiceInstance = kommonitorReachabilityScenarioHelperService;
			this.kommonitorReachabilityCoverageReportsHelperServiceInstance = kommonitorReachabilityCoverageReportsHelperService;

			$scope.selectedIndicatorForStatistics = undefined;
			$scope.selectedSpatialUnit = undefined;
			$scope.selectedIndicatorDate = undefined;

			kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics = [];

			$scope.weightStrategyOptions = [
				{
					apiName: "simple",
					displayName: "überlappende Fläche",
					tooltip: "einfache Gewichtung anhand der geschnittenen Fläche pro Raumebene"
				},
				{
					apiName: "residential_areas",
					displayName: "überlappende Wohngebiete",
					tooltip: "beücksichtigt nur geschnittene Wohnflächen pro Raumebene"
				}
			];
			$scope.weightStrategy = $scope.weightStrategyOptions[0];

			// interactive map stuff
			$scope.domId = "reachabilityScenarioIsochroneStatisticsGeoMap";
			$scope.mapParts;

			$scope.init = function () {
				$scope.mapParts = kommonitorReachabilityMapHelperService.initReachabilityIndicatorStatisticsGeoMap($scope.domId);
			};

			$rootScope.$on("isochronesCalculationFinished", function (event, reinit) {

				if (reinit) {
					$scope.init();

					for (const indicatorStatistic of kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics) {
						if (indicatorStatistic.active) {
							$scope.displayIndicatorStatisticOnMap(indicatorStatistic);
						}
					}
				}

				kommonitorReachabilityMapHelperService
					.replaceIsochroneGeoJSON(
						$scope.domId,
						kommonitorReachabilityHelperService.settings.selectedStartPointLayer.datasetName,
						kommonitorReachabilityHelperService.currentIsochronesGeoJSON,
						kommonitorReachabilityHelperService.settings.transitMode,
						kommonitorReachabilityHelperService.settings.focus,
						kommonitorReachabilityHelperService.settings.rangeArray,
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

			$scope.queryJobStatus = function (jobId) {
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
					if (jobStatus == undefined || jobStatus.status == undefined || jobStatus.status == "failed") {
						jobCompletedOrFailed = true;
						$scope.modifyJobStatus(jobId, "failed");
						kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Indikatoren-Statistik-Berechnung", "Versuchen Sie es bitte erneut. Probieren Sie, falls möglich, andere Raumebenen oder Indikatoren. Wenden Sie sich bei anhaltenden Problemen an das KomMonitor-Team");
						$scope.$digest();
						return;
					}
					else if (jobStatus.status == "finished") {
						jobCompletedOrFailed = true;

						// trigger result retrieval
						if (jobStatus.status == "finished") {
							kommonitorToastHelperService.displaySuccessToast_upperLeft("Indikatoren-Statistik-Berechnung erfolgreich", "Ergebnisse wurden in die Tabelle eingetragen");						
							$scope.retrieveJobResult(jobId);
						}
					}
					$scope.modifyJobStatus(jobId, jobStatus.status);

					if (!jobCompletedOrFailed) {
						// query again
						$scope.queryJobStatus(jobId);
					}
				}, 1000);
			};

			$scope.modifyJobStatus = function (jobId, jobStatus) {
				for (const indicatorStatisticsEntry of kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics) {
					if (indicatorStatisticsEntry.jobId == jobId) {
						indicatorStatisticsEntry.progress = jobStatus;
						break;
					}
				}
			};

			$scope.retrieveJobResult = async function (jobId) {
				let response = await kommonitorSpatialDataProcessorHelperService.getJobResult(jobId);

				for (const indicatorStatisticsEntry of kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics) {
					indicatorStatisticsEntry.active = false;
					if (indicatorStatisticsEntry.jobId == jobId) {
						// as wen only query spatial data processor for one indicator and on timestamp at a time we can use first entry of result array
						// but we must consider that maybe multiple ranges have been queried
						indicatorStatisticsEntry.coverageResult = response.result[0];
						indicatorStatisticsEntry.active = true;

						$scope.$digest();

						$scope.displayIndicatorStatisticOnMap(indicatorStatisticsEntry);
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
					coverageResult: undefined,
					active: false
				}

				// insert at first place to emphasize where the new computation is happening
				kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics.splice(0, 0, newIsochroneStatisticsEntry);

				// now trigger periodical query of job status
				$scope.queryJobStatus(jobId);
			}

			$scope.removeIndicatorStatistic = function (indicatorStatisticsCandidate) {

				// remove from map if active
				if (indicatorStatisticsCandidate.active) {
					kommonitorReachabilityMapHelperService.removeOldLayers_reachabilityIndicatorStatistics($scope.domId);
				}

				for (let index = 0; index < kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics.length; index++) {
					const entry = kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics[index];
					if (entry.jobId == indicatorStatisticsCandidate.jobId) {
						kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics.splice(index, 1);
						break;
					}
				}
			};

			$scope.displayIndicatorStatisticOnMap = function (indicatorStatisticsCandidate) {
				// property coverageResult stores isochrone prune result

				// mark active list element
				for (const indicatorStatisticsEntry of kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics) {
					indicatorStatisticsEntry.active = false;
					if (indicatorStatisticsEntry.jobId == indicatorStatisticsCandidate.jobId) {
						indicatorStatisticsEntry.active = true;
					}
				}

				let poiDataset = kommonitorReachabilityHelperService.settings.selectedStartPointLayer;
				let original_nonDissolved_isochrones = kommonitorReachabilityHelperService.original_nonDissolved_isochrones;
				kommonitorReachabilityMapHelperService.replaceReachabilityIndicatorStatisticsOnMap($scope.domId, poiDataset, original_nonDissolved_isochrones, indicatorStatisticsCandidate);
			};

			$scope.computeReachabilityIndicatorStatistic = async function () {
				// query spatial data processor in order to compute indicator statistics

				// in order to make UI consistent and have the ability to compare current scenario against any changes done in the ui regarding
				// recahbility config, we must set the current settings as activeScenario.
				kommonitorReachabilityScenarioHelperService.configureActiveScenario();

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


