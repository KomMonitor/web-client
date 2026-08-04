import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import * as turf from '@turf/turf';
import * as echarts from 'echarts';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { ReachabilityStateService } from 'services/reachability-state-service/reachability-state.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';

@Component({
  selector: 'app-reachability-poi-in-iso',
  standalone: true,
  templateUrl: './reachability-poi-in-iso.component.html',
  styleUrls: ['./reachability-poi-in-iso.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class ReachabilityPoiInIsoComponent implements OnInit {
  protected reachabilityStateService = inject(ReachabilityStateService);
  private reachabilityMapHelperService = inject(ReachabilityMapHelperService);
  protected mapOverlayState = inject(MapOverlayStateService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private selectionState = inject(SelectionStateService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private diagramHelperService = inject(DiagramHelperServiceService);
  private http = inject(HttpClient);
  private broadcastService = inject(BroadcastService);

  private readonly destroyRef = inject(DestroyRef);

  domId = 'reachabilityScenarioPoiInIsoGeoMap';
  mapParts;

  timeout_manualdate;

  isUsedInReporting = false;
  loadingData = false;

  filteredDisplayableGeoresources: any[] = [];

  echartsInstances_reachabilityAnalysis = new Map();

  ngOnInit(): void {
    this.init();

    this.metadataBootstrap.metadataLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value == MetadataLoadingState.COMPLETE) this.prepDisplayableGeoresources();
      });

    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((broadcastMsg) => {
        const title = broadcastMsg.msg;
        const values: any = broadcastMsg.values;

        switch (title) {
          case BroadcastMessage.ResetPoisInIsochrone:
            {
              this.resetPoisInIsochrone();
            }
            break;
          case BroadcastMessage.IsochronesCalculationFinished:
            {
              this.isochronesCalculationFinished(values);
            }
            break;
          case BroadcastMessage.SelectedIndicatorDateHasChanged:
            {
              this.selectedIndicatorDateHasChanged();
            }
            break;
          case BroadcastMessage.ReinitPoisInReachabilityMap:
            {
              this.reachabilityMapHelperService.invalidateMap(this.domId);
            }
            break;
        }
      });

    this.reachabilityStateService.reachabilityMapSubject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.scenarioState) {
          this.isochronesCalculationFinished(true);
        }
      });
  }

  //$('#manualDateDatepicker_reachabilityAnalysis').datepicker(this.dataExchangeService.datePickerOptions);

  init() {
    this.mapParts = this.reachabilityMapHelperService.initReachabilityGeoMap(this.domId);
  }

  onNameFilterChange(name: any) {
    const value = name.target.value.toLowerCase();

    this.filteredDisplayableGeoresources = this.georesourceStore.displayableGeoresources.filter(
      (e) => e.datasetName.toLowerCase().includes(value)
    );
  }

  prepDisplayableGeoresources() {
    this.filteredDisplayableGeoresources = this.georesourceStore.displayableGeoresources.filter(
      (e) => e.isPOI == true
    );
    this.filteredDisplayableGeoresources = this.georesourceStore.displayableGeoresources.filter(
      (e) => e.datasetName != '!-- leerer neuer Datensatz --'
    );

    // sort available dates and preselect last item (as on the UI)
    this.filteredDisplayableGeoresources.forEach((e) => {
      e.availablePeriodsOfValidity.sort((a, b) => a.startDate - b.startDate);
      e.selectedDate = e.availablePeriodsOfValidity[e.availablePeriodsOfValidity.length - 1];
    });
  }

  isochronesCalculationFinished(reinit) {
    if (reinit) {
      this.init();
      this.resetPoisInIsochrone();
    }

    this.reachabilityMapHelperService.replaceIsochroneGeoJSON(
      this.domId,
      this.reachabilityStateService.settings.selectedStartPointLayer.datasetName,
      this.reachabilityStateService.currentIsochronesGeoJSON,
      this.reachabilityStateService.settings.transitMode,
      this.reachabilityStateService.settings.focus,
      this.reachabilityStateService.settings.rangeArray,
      this.reachabilityStateService.settings.useMultipleStartPoints,
      this.reachabilityStateService.settings.dissolveIsochrones
    );
  }

  resetPoisInIsochrone() {
    this.echartsInstances_reachabilityAnalysis = new Map();
    document.getElementById('reachability_diagrams_section')!.innerHTML = '';
    for (const poi of this.georesourceStore.displayableGeoresources) {
      if (poi.isSelected_reachabilityAnalysis) {
        poi.isSelected_reachabilityAnalysis = false;
        //remove POI layer from map
        this.removePoiLayerFromMap(poi);
      }
    }

    // also clear this step's own isochrone/marker layer, e.g. when the scenario modal
    // is fully reset — otherwise it keeps showing the isochrones of the cleared session
    this.reachabilityMapHelperService.removeReachabilityLayers(this.domId);
    this.reachabilityMapHelperService.invalidateMap(this.domId);
  }

  //////////////////////////// SECTION FOR GORESOURCE AND INDICATOR ANALYSIS

  getQueryDate(resource) {
    if (resource.isTmpDataLayer || resource.isNewReachabilityDataSource) {
      return 'tmpDataLayer';
    }

    if (
      this.reachabilityStateService.settings.dateSelectionType.selectedDateType ===
      this.reachabilityStateService.settings.dateSelectionType_valueIndicator
    ) {
      return this.selectionState.selectedDate;
    } else if (
      this.reachabilityStateService.settings.dateSelectionType.selectedDateType ===
      this.reachabilityStateService.settings.dateSelectionType_valueManual
    ) {
      return this.reachabilityStateService.settings.selectedDate_manual;
    } else if (
      this.reachabilityStateService.settings.dateSelectionType.selectedDateType ===
      this.reachabilityStateService.settings.dateSelectionType_valuePerDataset
    ) {
      return resource.selectedDate.startDate;
    } else {
      return this.selectionState.selectedDate;
    }
  }

  // async
  async handlePoiForAnalysis(poi) {
    this.georesourceStore.displayableGeoresources = this.filteredDisplayableGeoresources;

    this.reachabilityStateService.settings.loadingData = true;

    try {
      if (poi.isSelected_reachabilityAnalysis) {
        await this.fetchGeoJSONForDate(poi).then((value) => (poi = value));
      }

      poi = await this.handlePoiOnDiagram(poi);
      if (this.georesourceStore.isDisplayableGeoresource(poi)) {
        this.handlePoiOnMap(poi);
      }
    } catch (error) {
      console.error(error);
    }

    this.reachabilityStateService.settings.loadingData = false;
  }

  fetchGeoJSONForDate(poiGeoresource) {
    // if is an imported file data layer then no data can be retrieved from data management component
    // instead use geoJSON of file contents
    if (poiGeoresource.isTmpDataLayer || poiGeoresource.isNewReachabilityDataSource) {
      if (!poiGeoresource.geoJSON_poiInIsochrones) {
        poiGeoresource.geoJSON_poiInIsochrones =
          poiGeoresource.geoJSON_reachability || poiGeoresource.geoJSON;
      }
      return poiGeoresource;
    }

    const id = poiGeoresource.georesourceId;

    const date = this.getQueryDate(poiGeoresource);

    const dateComps = date.split('-');

    const year = dateComps[0];
    const month = dateComps[1];
    const day = dateComps[2];

    const url =
      this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
      '/georesources/' +
      id +
      '/' +
      year +
      '/' +
      month +
      '/' +
      day;

    return new Promise((resolve, reject) => {
      this.http.get(url).subscribe({
        next: (response) => {
          // this callback will be called asynchronously
          // when the response is available
          const geoJSON = response;

          poiGeoresource.geoJSON_poiInIsochrones = geoJSON;
          resolve(poiGeoresource);
        },
        error: (error) => {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          this.reachabilityStateService.settings.loadingData = false;
          this.mapErrorNotificationService.displayMapApplicationError(error);
          reject(error);
        },
      });
    });
  }

  //async
  async handlePoiOnDiagram(poi) {
    if (poi.isSelected_reachabilityAnalysis) {
      // maps range value to result GeoJSON
      const pointsPerIsochroneRangeMap = await this.computePoisWithinIsochrones(poi);
      this.addOrReplaceWithinDiagrams(poi, pointsPerIsochroneRangeMap);
      // now filter the geoJSON to only include those datasets that are actually inside any isochrone
      poi = this.filterGeoJSONPointsInsideLargestIsochrone(poi, pointsPerIsochroneRangeMap);
    } else {
      //remove POI layer from map
      this.removePoiFromDiagram(poi);
    }

    return poi;
  }

  filterGeoJSONPointsInsideLargestIsochrone(poi, pointsPerIsochroneRangeMap) {
    const keyIter = pointsPerIsochroneRangeMap.keys();

    let nextKey = keyIter.next();

    let largestRange;

    while (nextKey.value) {
      const nextRange = nextKey.value;
      if (!largestRange) {
        largestRange = Number(nextRange);
      } else if (largestRange < Number(nextRange)) {
        largestRange = Number(nextRange);
      }

      nextKey = keyIter.next();
    }

    // map stores keys as string
    poi.geoJSON_poiInIsochrones = pointsPerIsochroneRangeMap.get('' + largestRange);

    return poi;
  }

  // async
  async computePoisWithinIsochrones(poi) {
    const pointsPerIsochroneRangeMap = this.initializeMapWithRangeKeys();
    if (!poi.geoJSON_poiInIsochrones) {
      poi = await this.fetchGeoJSONForDate(poi);
    }

    // as there might be mutliple isochrone ranges
    // we must perform point in polygon for each range
    const keyIter = pointsPerIsochroneRangeMap.keys();

    let nextKey = keyIter.next();

    while (nextKey.value) {
      const nextKeyValue = nextKey.value;

      const geoJSON_featureCollection = this.computePoisWithinIsochrone(nextKeyValue, poi);
      pointsPerIsochroneRangeMap.set(nextKeyValue, geoJSON_featureCollection);
      nextKey = keyIter.next();
    }

    return pointsPerIsochroneRangeMap;
  }

  computePoisWithinIsochrone(rangeValue, poi) {
    // create clones of poi geoJSON and isochrone geoJSON
    const isochrones_geoJSON_clone = JSON.parse(
      JSON.stringify(this.reachabilityStateService.currentIsochronesGeoJSON)
    );
    const poi_geoJSON_clone = JSON.parse(JSON.stringify(poi.geoJSON_poiInIsochrones));

    // filter isochrone geoJSON clone by range value
    isochrones_geoJSON_clone.features = isochrones_geoJSON_clone.features.filter((feature) => {
      return String(feature.properties.value) === String(rangeValue);
    });

    // filter poi geoJSON clone by spatial within isochrone
    const pointsWithinIsochrones = turf.pointsWithinPolygon(
      poi_geoJSON_clone,
      isochrones_geoJSON_clone
    );

    return pointsWithinIsochrones;
  }

  initializeMapWithRangeKeys() {
    const map = new Map();

    for (const feature of this.reachabilityStateService.currentIsochronesGeoJSON.features) {
      map.set('' + feature.properties.value, null);
    }

    return map;
  }

  addOrReplaceWithinDiagrams(poi, pointsPerIsochroneRangeMap) {
    const mapEntries = pointsPerIsochroneRangeMap.entries();

    let nextEntry = mapEntries.next();
    while (nextEntry.value) {
      const nextEntry_keyRange = nextEntry.value[0];
      const nextEntry_valueGeoJSON = nextEntry.value[1];
      let numberOfFeatures = 0;

      let nextEntry_keyRange_label = nextEntry_keyRange;
      if (this.reachabilityStateService.settings.focus == 'time') {
        // compute seconds to minutes for display
        nextEntry_keyRange_label = nextEntry_keyRange_label / 60;
      }

      if (nextEntry_valueGeoJSON) {
        numberOfFeatures = nextEntry_valueGeoJSON.features.length;
      }
      const date = this.getQueryDate(poi);

      if (
        this.echartsInstances_reachabilityAnalysis &&
        this.echartsInstances_reachabilityAnalysis.has(nextEntry_keyRange)
      ) {
        // append to diagram

        const echartsInstance = this.echartsInstances_reachabilityAnalysis.get(nextEntry_keyRange);
        let echartsOptions = echartsInstance.getOption();
        echartsOptions = this.diagramHelperService.appendToReachabilityAnalysisOptions(
          poi,
          nextEntry_valueGeoJSON,
          echartsOptions,
          date
        );
        echartsInstance.setOption(echartsOptions);
        this.echartsInstances_reachabilityAnalysis.set(nextEntry_keyRange, echartsInstance);
      } else {
        const reachabilityDiagramsSectionNode: any = document.getElementById(
          'reachability_diagrams_section'
        );
        const newChartNode = document.createElement('div');
        newChartNode.innerHTML =
          '<hr><h4>Punkte in Erreichbarkeit ' +
          nextEntry_keyRange_label +
          ' [' +
          this.mapOverlayState.isochroneLegend.cutOffUnit +
          ']</h4><br/><br/><div class="chart"><div  id="reachability_pieDiagram_range_' +
          nextEntry_keyRange +
          '" style="width:100%; min-height:150px;"></div></div>';
        reachabilityDiagramsSectionNode.appendChild(newChartNode);

        // init new echarts instance
        const echartsInstance: any = echarts.init(
          document.getElementById('reachability_pieDiagram_range_' + nextEntry_keyRange + '')
        );
        // use configuration item and data specified to show chart
        const echartsOptions: any =
          this.diagramHelperService.createInitialReachabilityAnalysisPieOptions(
            poi,
            nextEntry_valueGeoJSON,
            nextEntry_keyRange_label + ' ' + this.mapOverlayState.isochroneLegend.cutOffUnit,
            date
          );
        echartsInstance.setOption(echartsOptions);

        echartsInstance.hideLoading();

        this.echartsInstances_reachabilityAnalysis.set(nextEntry_keyRange, echartsInstance);

        setTimeout(() => {
          echartsInstance.resize();
        }, 350);
      }

      nextEntry = mapEntries.next();
    }
  }

  removePoiFromDiagram(poiGeoresource) {
    const chart_entries = this.echartsInstances_reachabilityAnalysis.entries();

    let nextChartInstanceEntry = chart_entries.next();
    while (nextChartInstanceEntry.value) {
      const nextChartInstance = nextChartInstanceEntry.value[1];
      let nextChartOptions = nextChartInstance.getOption();

      nextChartOptions = this.diagramHelperService.removePoiFromReachabilityAnalysisOption(
        nextChartOptions,
        poiGeoresource
      );
      nextChartInstance.setOption(nextChartOptions);

      this.echartsInstances_reachabilityAnalysis.set(
        nextChartInstanceEntry.value[0],
        nextChartInstance
      );

      nextChartInstanceEntry = chart_entries.next();
    }
  }

  handlePoiOnMap(poi) {
    if (poi.isSelected_reachabilityAnalysis) {
      //display on Map
      this.addPoiLayerToMap(poi);
    } else {
      //remove POI layer from map
      this.removePoiLayerFromMap(poi);
    }
  }

  addPoiLayerToMap(poiGeoresource) {
    this.reachabilityStateService.settings.loadingData = true;

    // fale --> useCluster = false
    this.reachabilityMapHelperService.addPoiGeoresourceGeoJSON_reachabilityAnalysis(
      this.domId,
      poiGeoresource,
      this.getQueryDate(poiGeoresource),
      false
    );
    this.reachabilityStateService.settings.loadingData = false;
  }

  removePoiLayerFromMap(poiGeoresource) {
    this.reachabilityStateService.settings.loadingData = true;

    this.reachabilityMapHelperService.removePoiGeoresource_reachabilityAnalysis(
      this.domId,
      poiGeoresource
    );
    this.reachabilityStateService.settings.loadingData = false;
  }

  //async
  async refreshPoiLayers() {
    for (let poi of this.georesourceStore.displayableGeoresources) {
      if (poi.isSelected_reachabilityAnalysis) {
        //remove POI layer from map
        this.removePoiLayerFromMap(poi);

        poi = await this.fetchGeoJSONForDate(poi);

        // remove layer and add layer again
        this.addPoiLayerToMap(poi);
      }
    }
  }

  onClickUseIndicatorTimestamp() {
    this.reachabilityStateService.settings.dateSelectionType.selectedDateType =
      this.reachabilityStateService.settings.dateSelectionType_valueIndicator;

    this.refreshSelectedGeoresources();
  }

  isNoValidDate(dateCandidate) {
    const dateComps = dateCandidate.split('-');

    if (dateComps.length < 3) {
      return true;
    } else if (!dateComps[0] || !dateComps[1] || !dateComps[2]) {
      return true;
    } else if (isNaN(dateComps[0]) || isNaN(dateComps[1]) || isNaN(dateComps[2])) {
      return true;
    } else if (Number(dateComps[1]) > 12 || Number(dateComps[2]) > 31) {
      return true;
    }

    return false;
  }

  onChangeManualDate() {
    // check if date is an actual date
    // if so then refresh selected layers

    // Clear the timeout if it has already been set.
    // This will prevent the previous task from executing
    // if it has been less than <MILLISECONDS>
    clearTimeout(this.timeout_manualdate);

    // Make a new timeout set to go off in 1000ms (1 second)
    this.timeout_manualdate = setTimeout(() => {
      const dateCandidate = this.reachabilityStateService.settings.selectedDate_manual;

      if (this.isNoValidDate(dateCandidate)) {
        return;
      }

      setTimeout(() => {
        this.loadingData = true;
      });

      setTimeout(() => {
        this.refreshSelectedGeoresources();
      }, 250);
    }, 1000);
  }

  onChangeManualDate_isochroneConfig() {
    // check if date is an actual date
    // if so then refresh selected layers

    // Clear the timeout if it has already been set.
    // This will prevent the previous task from executing
    // if it has been less than <MILLISECONDS>
    clearTimeout(this.timeout_manualdate);

    // Make a new timeout set to go off in 1000ms (1 second)
    this.timeout_manualdate = setTimeout(() => {
      const dateCandidate =
        this.reachabilityStateService.settings.isochroneConfig.selectedDate_manual;

      if (this.isNoValidDate(dateCandidate)) {
        return;
      }

      if (!this.isUsedInReporting) {
        // todo, this function does exist in reachability comp AND reachability helper service, which one??!?!
        // this.fetchGeoJSONForIsochrones();
      }

      // $timeout(function(){

      // 	this.loadingData = true;
      //
      // });

      // $timeout(function(){

      // 	this.fetchGeoJSONForIsochrones();
      // }, 250);
    }, 1000);
  }

  selectedIndicatorDateHasChanged() {
    // only refresh georesources if sync with indicator timestamp is selected
    if (
      !this.reachabilityStateService.settings.dateSelectionType.selectedDateType.includes(
        this.reachabilityStateService.settings.dateSelectionType_valueIndicator
      )
    ) {
      return;
    }

    setTimeout(() => {
      this.loadingData = true;
    });

    setTimeout(() => {
      this.refreshSelectedGeoresources();
    }, 250);
  }

  //async
  async refreshSelectedGeoresources() {
    for (const georesource of this.georesourceStore.displayableGeoresources) {
      if (georesource.isSelected_reachabilityAnalysis) {
        if (georesource.isPOI) {
          georesource.isSelected_reachabilityAnalysis = false;
          await this.handlePoiForAnalysis(georesource);
          georesource.isSelected_reachabilityAnalysis = true;
          await this.handlePoiForAnalysis(georesource);
        }
      }
    }

    this.loadingData = false;
  }

  //async
  async onChangeSelectedDate(georesourceDataset) {
    // only if it s already selected, we must modify the shown dataset

    if (georesourceDataset.isSelected_reachabilityAnalysis) {
      // depending on type we must call different methods
      if (georesourceDataset.isPOI) {
        georesourceDataset.isSelected_reachabilityAnalysis = false;
        await this.handlePoiForAnalysis(georesourceDataset);
        georesourceDataset.isSelected_reachabilityAnalysis = true;
        await this.handlePoiForAnalysis(georesourceDataset);
      }
    }
  }

  /* 
    $(window).on('resize', () {
      var chart_entries = this.echartsInstances_reachabilityAnalysis.entries();
  
      var nextChartInstanceEntry = chart_entries.next();
      while (nextChartInstanceEntry.value) {
  
        var nextChartInstance = nextChartInstanceEntry.value[1];
        if (nextChartInstance != null && nextChartInstance != undefined) {
          nextChartInstance.resize();
        }
        nextChartInstanceEntry = chart_entries.next();
      }
  
  
    }); */
}
