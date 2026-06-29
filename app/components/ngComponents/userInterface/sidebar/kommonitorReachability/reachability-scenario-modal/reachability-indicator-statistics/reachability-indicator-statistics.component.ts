import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MetadataBootstrapService, MetadataLoadingState } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { ReachabilityCoverageReportsHelperService } from 'services/reachability-coverage-reports-helper-service/reachability-coverage-reports-helper.service';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SpatialDataProcessorHelperService } from 'services/spatial-data-processor-helper/spatial-data-processor-helper.service';

@Component({
  selector: 'app-reachability-indicator-statistics',
  standalone: true,
  templateUrl: './reachability-indicator-statistics.component.html',
  styleUrls: ['./reachability-indicator-statistics.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class ReachabilityIndicatorStatisticsComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);

  availableIndicators:any;
  selectedIndicatorForStatistics:any;
  selectedIndicatorId:any;
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

  // Local precision-resolving wrapper (formerly the DataExchangeService facade glue, Prio7 B1).
  protected getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFormattedText(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  constructor(
    protected mapOverlayState: MapOverlayStateService,
    private metadataBootstrap: MetadataBootstrapService,
    private indicatorValueService: IndicatorValueService,
    private selectionState: SelectionStateService,
    protected indicatorStore: IndicatorMetadataStoreService,
    protected reachabilityScenarioHelperService: ReachabilityScenarioHelperService,
    protected reachabilityHelperService: ReachabilityHelperService,
    protected reachabilityCoverageReportsHelperService: ReachabilityCoverageReportsHelperService,
    private reachabilityMapHelperService: ReachabilityMapHelperService,
    private spatialDataProcessorHelperService: SpatialDataProcessorHelperService,
    private broadcastService: BroadcastService
  ) {
    this.reachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics = [];
  }


  ngOnInit(): void {

    this.init();

    this.metadataBootstrap.metadataLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {

        if(value==MetadataLoadingState.COMPLETE)  
          this.availableIndicators = this.indicatorStore.displayableIndicators;
      });


    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      const title = broadcastMsg.msg;
      const values:any = broadcastMsg.values;

      switch (title) {
        case BroadcastMessage.IsochronesCalculationFinished: {
          this.isochronesCalculationFinished(values);
        } break;
        case BroadcastMessage.ReinitIndicatorStatisticsConfiguration: {
          this.reachabilityMapHelperService.invalidateMap(this.domId);
        } break;
      }
    });
  }

  init() {
    this.mapParts = this.reachabilityMapHelperService.initReachabilityIndicatorStatisticsGeoMap(this.domId);
  }

  isochronesCalculationFinished(reinit=false) {

    if (reinit) {
      this.init();

      for (const indicatorStatistic of this.reachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics) {
        if (indicatorStatistic.active) {
          this.displayIndicatorStatisticOnMap(indicatorStatistic);
        }
      }
    } 

    this.reachabilityMapHelperService.replaceIsochroneGeoJSON(
      this.domId,
      this.reachabilityHelperService.settings.selectedStartPointLayer.datasetName,
      this.reachabilityHelperService.currentIsochronesGeoJSON,
      this.reachabilityHelperService.settings.transitMode,
      this.reachabilityHelperService.settings.focus,
      this.reachabilityHelperService.settings.rangeArray,
      this.reachabilityHelperService.settings.useMultipleStartPoints,
      this.reachabilityHelperService.settings.dissolveIsochrones);
  }

  onChangeSelectedIndicatorForStatistics() {
  
    this.selectedIndicatorForStatistics = this.availableIndicators.filter(e => e.indicatorId==this.selectedIndicatorId)[0];

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
      
      const jobStatus:any = await this.spatialDataProcessorHelperService.getJobStatus(jobId);
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
    for (const indicatorStatisticsEntry of this.reachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics) {
      if (indicatorStatisticsEntry.jobId == jobId) {
        indicatorStatisticsEntry.progress = jobStatus;
        break;
      }
    }
  };

  async retrieveJobResult(jobId) {
    const response:any = await this.spatialDataProcessorHelperService.getJobResult(jobId);

    for (const indicatorStatisticsEntry of this.reachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics) {
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
    const newIsochroneStatisticsEntry = {
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
    this.reachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics.splice(0, 0, newIsochroneStatisticsEntry);

    // now trigger periodical query of job status
    this.queryJobStatus(jobId);
  }

 removeIndicatorStatistic(indicatorStatisticsCandidate) {

    // remove from map if active
    if (indicatorStatisticsCandidate.active) {
      this.reachabilityMapHelperService.removeOldLayers_reachabilityIndicatorStatistics(this.domId);
    }

    for (let index = 0; index < this.reachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics.length; index++) {
      const entry = this.reachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics[index];
      if (entry.jobId == indicatorStatisticsCandidate.jobId) {
        this.reachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics.splice(index, 1);
        break;
      }
    }
  };

  displayIndicatorStatisticOnMap(indicatorStatisticsCandidate) {
    // property coverageResult stores isochrone prune result

    // mark active list element
    for (const indicatorStatisticsEntry of this.reachabilityScenarioHelperService.tmpActiveScenario.indicatorStatistics) {
      indicatorStatisticsEntry.active = false;
      if (indicatorStatisticsEntry.jobId == indicatorStatisticsCandidate.jobId) {
        indicatorStatisticsEntry.active = true;
      }
    }

    const poiDataset = this.reachabilityHelperService.settings.selectedStartPointLayer;
    const original_nonDissolved_isochrones = this.reachabilityHelperService.original_nonDissolved_isochrones;
    this.reachabilityMapHelperService.replaceReachabilityIndicatorStatisticsOnMap(this.domId, poiDataset, original_nonDissolved_isochrones, indicatorStatisticsCandidate);
  };

  async computeReachabilityIndicatorStatistic() {
    // query spatial data processor in order to compute indicator statistics

    // in order to make UI consistent and have the ability to compare current scenario against any changes done in the ui regarding
    // recahbility config, we must set the current settings as activeScenario.
    this.reachabilityScenarioHelperService.configureActiveScenario();

    const indicatorIdArray = [this.selectedIndicatorForStatistics.indicatorId];
    // weighting options: residential_areas, simple
    const weight = this.weightStrategy.apiName;
    const isochroneGeoJson = this.reachabilityHelperService.original_nonDissolved_isochrones;
    const targetDate = this.selectedIndicatorDate;
    const spatialUnitId = this.selectedSpatialUnit.spatialUnitId;

    // postNewIsochroneStatistic = async function (indicatorIdArray, isochroneGeoJson, spatialUnitId, targetDate, weighting) 
    const jobId = await this.spatialDataProcessorHelperService.postNewIsochroneStatistic(indicatorIdArray, isochroneGeoJson, spatialUnitId, targetDate, weight);

    this.appendNewIsochroneStatistic(jobId);
  };

}
