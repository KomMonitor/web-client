import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { kommonitorReachabilityCoverageReportsHelper } from 'util/genericServices/kommonitorReachabilityCoverageReportsHelperService/kommonitor-reachability-coverage-reports-helper-service.module';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';
import { ReachabilityCoverageReportsHelperService } from 'services/reachability-coverage-reports-helper-service/reachability-coverage-reports-helper.service';
import { SpatialDataProcessorHelperService } from 'services/spatial-data-processor-helper/spatial-data-processor-helper.service';

@Component({
  selector: 'app-reachability-indicator-statistics',
  standalone: true,
  templateUrl: './reachability-indicator-statistics.component.html',
  styleUrls: ['./reachability-indicator-statistics.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ReachabilityIndicatorStatisticsComponent implements OnInit {

  selectedIndicatorForStatistics:any;
  indicatorNameFilter:any;
  selectedSpatialUnit:any;
  selectedIndicatorDate:any;

  weightStrategyOptions = [
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
  weightStrategy:any= this.weightStrategyOptions[0];

  domId = "reachabilityScenarioIsochroneStatisticsGeoMap";
  mapParts;

  constructor(
    protected dataExchangeService: DataExchangeService,
    protected reachabilityScenarioHelperService: ReachabilityScenarioHelperService,
    protected reachabilityHelperService: ReachabilityHelperService,
    protected reachabilityCoverageReportsHelperService: ReachabilityCoverageReportsHelperService,
    private reachabilityMapHelperService: ReachabilityMapHelperService,
    private spatialDataProcessorHelperService: SpatialDataProcessorHelperService
  ) {
    this.reachabilityScenarioHelperService.pipedData.tmpActiveScenario.indicatorStatistics = [];
  }


  ngOnInit(): void {
      this.mapParts = this.reachabilityMapHelperService.initReachabilityIndicatorStatisticsGeoMap(this.domId);
  }

 /*  $rootScope.$on("isochronesCalculationFinished", function (event, reinit) {

    if (reinit) {
      this.init();

      for (const indicatorStatistic of kommonitorReachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics) {
        if (indicatorStatistic.active) {
          this.displayIndicatorStatisticOnMap(indicatorStatistic);
        }
      }
    } 

    kommonitorReachabilityMapHelperService
      .replaceIsochroneGeoJSON(
        this.domId,
        kommonitorReachabilityHelperService.settings.selectedStartPointLayer.datasetName,
        kommonitorReachabilityHelperService.currentIsochronesGeoJSON,
        kommonitorReachabilityHelperService.settings.transitMode,
        kommonitorReachabilityHelperService.settings.focus,
        kommonitorReachabilityHelperService.settings.rangeArray,
        kommonitorReachabilityHelperService.settings.useMultipleStartPoints,
        kommonitorReachabilityHelperService.settings.dissolveIsochrones);

  });*/

  onChangeSelectedIndicatorForStatistics() {
    // this.selectedIndicatorForStatistics;

    this.selectedSpatialUnit = this.selectedIndicatorForStatistics.applicableSpatialUnits[this.selectedIndicatorForStatistics.applicableSpatialUnits.length - 1];
    this.selectedIndicatorDate = this.selectedIndicatorForStatistics.applicableDates[this.selectedIndicatorForStatistics.applicableDates.length - 1];
  };

  onChangeSelectedSpatialUnit() {

  };

  queryJobStatus(jobId) {
    let jobCompletedOrFailed = false;
    // query every second
    setTimeout(async () => {
      
        // queued - The job has been created but process execution has not started, yet.
        // running - Process execution has started.
        // finished - Process execution has finished.
        // failed - The job failed due to an error during process execution.
      
      let jobStatus = await this.spatialDataProcessorHelperService.getJobStatus(jobId);
      if (jobStatus == undefined || jobStatus.status == undefined || jobStatus.status == "failed") {
        jobCompletedOrFailed = true;
        this.modifyJobStatus(jobId, "failed");
        // todo
        //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Indikatoren-Statistik-Berechnung", "Versuchen Sie es bitte erneut. Probieren Sie, falls möglich, andere Raumeinheiten oder Indikatoren. Wenden Sie sich bei anhaltenden Problemen an das KomMonitor-Team");
        return;
      }
      else if (jobStatus.status == "finished") {
        jobCompletedOrFailed = true;

        // trigger result retrieval
        if (jobStatus.status == "finished") {
          // todo
          //kommonitorToastHelperService.displaySuccessToast_upperLeft("Indikatoren-Statistik-Berechnung erfolgreich", "Ergebnisse wurden in die Tabelle eingetragen");						
          this.retrieveJobResult(jobId);
        }
      }
      this.modifyJobStatus(jobId, jobStatus.status);

      if (!jobCompletedOrFailed) {
        // query again
        this.queryJobStatus(jobId);
      }
    }, 1000);
  };

  modifyJobStatus(jobId, jobStatus) {
    for (const indicatorStatisticsEntry of this.reachabilityScenarioHelperService.pipedData.tmpActiveScenario.indicatorStatistics) {
      if (indicatorStatisticsEntry.jobId == jobId) {
        indicatorStatisticsEntry.progress = jobStatus;
        break;
      }
    }
  };

  async retrieveJobResult(jobId) {
    let response = await this.spatialDataProcessorHelperService.getJobResult(jobId);

    for (const indicatorStatisticsEntry of this.reachabilityScenarioHelperService.pipedData.tmpActiveScenario.indicatorStatistics) {
      indicatorStatisticsEntry.active = false;
      if (indicatorStatisticsEntry.jobId == jobId) {
        // as wen only query spatial data processor for one indicator and on timestamp at a time we can use first entry of result array
        // but we must consider that maybe multiple ranges have been queried
        indicatorStatisticsEntry.coverageResult = response.result[0];
        indicatorStatisticsEntry.active = true;

        this.displayIndicatorStatisticOnMap(indicatorStatisticsEntry);
      }
    }
  }

  appendNewIsochroneStatistic(jobId) {
    let newIsochroneStatisticsEntry = {
      indicator: {
        indicatorId: this.selectedIndicatorForStatistics.indicatorId,
        indicatorName: this.selectedIndicatorForStatistics.indicatorName,
        unit: this.selectedIndicatorForStatistics.unit
      },
      spatialUnit: {
        spatialUnitId: this.selectedSpatialUnit.spatialUnitId,
        spatialUnitName: this.selectedSpatialUnit.spatialUnitName
      },
      weightStrategy: this.weightStrategy,
      timestamp: this.selectedIndicatorDate,
      progress: "queued",
      jobId: jobId,
      coverageResult: undefined,
      active: false
    }

    // insert at first place to emphasize where the new computation is happening
    this.reachabilityScenarioHelperService.pipedData.tmpActiveScenario.indicatorStatistics.splice(0, 0, newIsochroneStatisticsEntry);

    // now trigger periodical query of job status
    this.queryJobStatus(jobId);
  }

 removeIndicatorStatistic(indicatorStatisticsCandidate) {

    // remove from map if active
    if (indicatorStatisticsCandidate.active) {
      this.reachabilityMapHelperService.removeOldLayers_reachabilityIndicatorStatistics(this.domId);
    }

    for (let index = 0; index < this.reachabilityScenarioHelperService.pipedData.tmpActiveScenario.indicatorStatistics.length; index++) {
      const entry = this.reachabilityScenarioHelperService.pipedData.tmpActiveScenario.indicatorStatistics[index];
      if (entry.jobId == indicatorStatisticsCandidate.jobId) {
        this.reachabilityScenarioHelperService.pipedData.tmpActiveScenario.indicatorStatistics.splice(index, 1);
        break;
      }
    }
  };

  displayIndicatorStatisticOnMap(indicatorStatisticsCandidate) {
    // property coverageResult stores isochrone prune result

    // mark active list element
    for (const indicatorStatisticsEntry of this.reachabilityScenarioHelperService.pipedData.tmpActiveScenario.indicatorStatistics) {
      indicatorStatisticsEntry.active = false;
      if (indicatorStatisticsEntry.jobId == indicatorStatisticsCandidate.jobId) {
        indicatorStatisticsEntry.active = true;
      }
    }

    let poiDataset = this.reachabilityHelperService.settings.selectedStartPointLayer;
    let original_nonDissolved_isochrones = this.reachabilityHelperService.original_nonDissolved_isochrones;
    this.reachabilityMapHelperService.replaceReachabilityIndicatorStatisticsOnMap(this.domId, poiDataset, original_nonDissolved_isochrones, indicatorStatisticsCandidate);
  };

  async computeReachabilityIndicatorStatistic() {
    // query spatial data processor in order to compute indicator statistics

    // in order to make UI consistent and have the ability to compare current scenario against any changes done in the ui regarding
    // recahbility config, we must set the current settings as activeScenario.
    this.reachabilityScenarioHelperService.pipedData.configureActiveScenario();

    let indicatorIdArray = [this.selectedIndicatorForStatistics.indicatorId];
    // weighting options: residential_areas, simple
    let weight = this.weightStrategy.apiName;
    let isochroneGeoJson = this.reachabilityHelperService.original_nonDissolved_isochrones;
    let targetDate = this.selectedIndicatorDate;
    let spatialUnitId = this.selectedSpatialUnit.spatialUnitId;

    // postNewIsochroneStatistic = async function (indicatorIdArray, isochroneGeoJson, spatialUnitId, targetDate, weighting) 
    let jobId = await this.spatialDataProcessorHelperService.postNewIsochroneStatistic(indicatorIdArray, isochroneGeoJson, spatialUnitId, targetDate, weight);

    this.appendNewIsochroneStatistic(jobId);
  };

}
