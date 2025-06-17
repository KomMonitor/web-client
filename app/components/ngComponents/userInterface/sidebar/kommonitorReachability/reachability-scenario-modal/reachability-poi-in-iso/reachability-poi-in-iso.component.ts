import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';
import * as echarts from 'echarts';
import * as turf from '@turf/turf';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  selector: 'app-reachability-poi-in-iso',
  standalone: true,
  templateUrl: './reachability-poi-in-iso.component.html',
  styleUrls: ['./reachability-poi-in-iso.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ReachabilityPoiInIsoComponent implements OnInit {

  domId = "reachabilityScenarioPoiInIsoGeoMap";
  mapParts;

  timeout_manualdate;

  isUsedInReporting = false;
  loadingData = false;

  originGeoresources:any[] = [];
  filteredDisplayableGeoresources:any[] = [];

  echartsInstances_reachabilityAnalysis = new Map();

  constructor(
    protected reachabilityHelperService: ReachabilityHelperService,
    private reachabilityMapHelperService: ReachabilityMapHelperService, 
    protected dataExchangeService: DataExchangeService,
    private diagramHelperService: DiagramHelperServiceService,
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) {
    this.originGeoresources = this.dataExchangeService.pipedData.displayableGeoresources;
    this.filteredDisplayableGeoresources = this.originGeoresources;
  }

  ngOnInit(): void {

    this.init();

    this.prepDisplayableGeoresources();

    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'resetPoisInIsochrone' : {
          this.resetPoisInIsochrone();
        } break;
        case 'isochronesCalculationFinished': {
          this.isochronesCalculationFinished(values);
        } break;
        case 'selectedIndicatorDateHasChanged': {
          this.selectedIndicatorDateHasChanged();
        } break;
      }
    });
  }

  //$('#manualDateDatepicker_reachabilityAnalysis').datepicker(this.dataExchangeService.pipedData.datePickerOptions);

  init() {
    this.mapParts = this.reachabilityMapHelperService.initReachabilityGeoMap(this.domId);
  }

  onNameFilterChange(name:any) {
    let value = name.target.value;

    this.filteredDisplayableGeoresources = this.originGeoresources.filter(e => e.datasetName.includes(value));
    this.prepDisplayableGeoresources();
  }

  prepDisplayableGeoresources() {
    this.filteredDisplayableGeoresources = this.filteredDisplayableGeoresources.filter(e => e.isPOI==true);
    this.filteredDisplayableGeoresources = this.filteredDisplayableGeoresources.filter(e => e.datasetName!="!-- leerer neuer Datensatz --");

    // sort available dates and preselect last item (as on the UI)
    this.filteredDisplayableGeoresources.forEach(e => {
      e.availablePeriodsOfValidity.sort((a, b) => a.startDate - b.startDate);
      e.selectedDate = e.availablePeriodsOfValidity[e.availablePeriodsOfValidity.length-1];
    });
  }


  isochronesCalculationFinished(reinit) {

    if(reinit){
      this.init();
      this.resetPoisInIsochrone();
    }

    this.reachabilityMapHelperService
      .replaceIsochroneGeoJSON(
        this.domId,
        this.reachabilityHelperService.settings.selectedStartPointLayer.datasetName,
        this.reachabilityHelperService.currentIsochronesGeoJSON,
        this.reachabilityHelperService.settings.transitMode,
        this.reachabilityHelperService.settings.focus,
        this.reachabilityHelperService.settings.rangeArray,
        this.reachabilityHelperService.settings.useMultipleStartPoints,
        this.reachabilityHelperService.settings.dissolveIsochrones);
  }

  resetPoisInIsochrone() {
    this.echartsInstances_reachabilityAnalysis = new Map();
    document.getElementById("reachability_diagrams_section")!.innerHTML = "";
    for (var poi of this.dataExchangeService.pipedData.displayableGeoresources) {
      if (poi.isSelected_reachabilityAnalysis) {
        poi.isSelected_reachabilityAnalysis = false;
        //remove POI layer from map
        this.removePoiLayerFromMap(poi);
      }
    }
  };

  //////////////////////////// SECTION FOR GORESOURCE AND INDICATOR ANALYSIS

  getQueryDate(resource) {

    if(resource.isTmpDataLayer || resource.isNewReachabilityDataSource){
      return "tmpDataLayer";
    }

    if (this.reachabilityHelperService.settings.dateSelectionType.selectedDateType === this.reachabilityHelperService.settings.dateSelectionType_valueIndicator) {
      return this.dataExchangeService.pipedData.selectedDate;
    }
    else if (this.reachabilityHelperService.settings.dateSelectionType.selectedDateType === this.reachabilityHelperService.settings.dateSelectionType_valueManual) {
      return this.reachabilityHelperService.settings.selectedDate_manual;
    }
    else if (this.reachabilityHelperService.settings.dateSelectionType.selectedDateType === this.reachabilityHelperService.settings.dateSelectionType_valuePerDataset) {
      return resource.selectedDate.startDate;
    }
    else {
      return this.dataExchangeService.pipedData.selectedDate;
    }
  };

  // async
  async handlePoiForAnalysis(poi) {

    this.dataExchangeService.pipedData.displayableGeoresources = this.filteredDisplayableGeoresources;

    this.reachabilityHelperService.settings.loadingData = true;
    

    try {
      if (poi.isSelected_reachabilityAnalysis) {
        await this.fetchGeoJSONForDate(poi).then((value) => poi = value );
      }

      poi = await this.handlePoiOnDiagram(poi);
      if (this.dataExchangeService.isDisplayableGeoresource(poi)) {
        this.handlePoiOnMap(poi);
      }
      
    } catch (error) {
      console.error(error);
    }

    this.reachabilityHelperService.settings.loadingData = false;
  };

  fetchGeoJSONForDate(poiGeoresource) {

    // if is an imported file data layer then no data can be retrieved from data management component
    // instead use geoJSON of file contents
    if(poiGeoresource.isTmpDataLayer || poiGeoresource.isNewReachabilityDataSource){
      if (! poiGeoresource.geoJSON_poiInIsochrones){
        poiGeoresource.geoJSON_poiInIsochrones = poiGeoresource.geoJSON_reachability || poiGeoresource.geoJSON;
      }
      return poiGeoresource;
    }

    var id = poiGeoresource.georesourceId;

    var date = this.getQueryDate(poiGeoresource);

    var dateComps = date.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day;

    return new Promise((resolve, reject) => {
      this.http.get(url).subscribe({
        next: response => {
          // this callback will be called asynchronously
          // when the response is available
          var geoJSON = response;

          poiGeoresource.geoJSON_poiInIsochrones = geoJSON;
          resolve(poiGeoresource);
        },
        error: error => {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          this.reachabilityHelperService.settings.loadingData = false;
          this.dataExchangeService.displayMapApplicationError(error);
          reject(error);
        }
      });
    });
  };

  //async
  async handlePoiOnDiagram(poi) {
    if (poi.isSelected_reachabilityAnalysis) {
      // maps range value to result GeoJSON
      var pointsPerIsochroneRangeMap = await this.computePoisWithinIsochrones(poi);
      this.addOrReplaceWithinDiagrams(poi, pointsPerIsochroneRangeMap);
      // now filter the geoJSON to only include those datasets that are actually inside any isochrone
      poi = this.filterGeoJSONPointsInsideLargestIsochrone(poi, pointsPerIsochroneRangeMap);
    }
    else {
      //remove POI layer from map
      this.removePoiFromDiagram(poi);
    }

    return poi;
  };

  filterGeoJSONPointsInsideLargestIsochrone(poi, pointsPerIsochroneRangeMap) {
    var keyIter = pointsPerIsochroneRangeMap.keys();

    var nextKey = keyIter.next();

    var largestRange;

    while (nextKey.value) {
      var nextRange = nextKey.value;
      if (!largestRange) {
        largestRange = Number(nextRange);
      }
      else if (largestRange < Number(nextRange)) {
        largestRange = Number(nextRange);
      }

      nextKey = keyIter.next();
    }

    // map stores keys as string
    poi.geoJSON_poiInIsochrones = pointsPerIsochroneRangeMap.get("" + largestRange);

    return poi;
  }

  // async
  async computePoisWithinIsochrones(poi) {
    var pointsPerIsochroneRangeMap = this.initializeMapWithRangeKeys();
    if (!poi.geoJSON_poiInIsochrones) {
      poi = await this.fetchGeoJSONForDate(poi);
    }

    // as there might be mutliple isochrone ranges
    // we must perform point in polygon for each range
    var keyIter = pointsPerIsochroneRangeMap.keys();

    var nextKey = keyIter.next();

    while (nextKey.value) {
      var nextKeyValue = nextKey.value;

      var geoJSON_featureCollection = this.computePoisWithinIsochrone(nextKeyValue, poi);
      pointsPerIsochroneRangeMap.set(nextKeyValue, geoJSON_featureCollection);
      nextKey = keyIter.next();
    }

    return pointsPerIsochroneRangeMap;
  };

  computePoisWithinIsochrone(rangeValue, poi) {
    // create clones of poi geoJSON and isochrone geoJSON
    var isochrones_geoJSON_clone = JSON.parse(JSON.stringify(this.reachabilityHelperService.currentIsochronesGeoJSON));
    var poi_geoJSON_clone = JSON.parse(JSON.stringify(poi.geoJSON_poiInIsochrones));

    // filter isochrone geoJSON clone by range value
    isochrones_geoJSON_clone.features = isochrones_geoJSON_clone.features.filter(feature => {
      return String(feature.properties.value) === String(rangeValue);
    });

    // filter poi geoJSON clone by spatial within isochrone
    var pointsWithinIsochrones = turf.pointsWithinPolygon(poi_geoJSON_clone, isochrones_geoJSON_clone);

    return pointsWithinIsochrones;
  };


  initializeMapWithRangeKeys() {
    var map = new Map();

    for (const feature of this.reachabilityHelperService.currentIsochronesGeoJSON.features) {
      map.set("" + feature.properties.value, null);
    }

    return map;
  };



  addOrReplaceWithinDiagrams(poi, pointsPerIsochroneRangeMap) {
    var mapEntries = pointsPerIsochroneRangeMap.entries();

    var nextEntry = mapEntries.next();
    while (nextEntry.value) {

      var nextEntry_keyRange = nextEntry.value[0];
      var nextEntry_valueGeoJSON = nextEntry.value[1];
      var numberOfFeatures = 0;

      var nextEntry_keyRange_label = nextEntry_keyRange;
      if (this.reachabilityHelperService.settings.focus == 'time') {
        // compute seconds to minutes for display
        nextEntry_keyRange_label = nextEntry_keyRange_label / 60;
      }

      if (nextEntry_valueGeoJSON) {
        numberOfFeatures = nextEntry_valueGeoJSON.features.length;
      }
      console.log("Number of Points wihtin Range '" + nextEntry_keyRange + "' is '" + numberOfFeatures + "'");

      var date = this.getQueryDate(poi);

      if (this.echartsInstances_reachabilityAnalysis && this.echartsInstances_reachabilityAnalysis.has(nextEntry_keyRange)) {
        // append to diagram

        var echartsInstance = this.echartsInstances_reachabilityAnalysis.get(nextEntry_keyRange);
        var echartsOptions = echartsInstance.getOption();
        echartsOptions = this.diagramHelperService.appendToReachabilityAnalysisOptions(poi, nextEntry_valueGeoJSON, echartsOptions, date);
        echartsInstance.setOption(echartsOptions);
        this.echartsInstances_reachabilityAnalysis.set(nextEntry_keyRange, echartsInstance);
      }
      else {
        var reachabilityDiagramsSectionNode:any = document.getElementById("reachability_diagrams_section");
        var newChartNode = document.createElement("div");
        newChartNode.innerHTML = '<hr><h4>Analyse Einzugsgebiet ' + nextEntry_keyRange_label + ' [' + this.dataExchangeService.pipedData.isochroneLegend.cutOffUnit + ']</h4><br/><br/><div class="chart"><div  id="reachability_pieDiagram_range_' + nextEntry_keyRange + '" style="width:100%; min-height:150px;"></div></div>';
        reachabilityDiagramsSectionNode.appendChild(newChartNode);

        // init new echarts instance
        var echartsInstance:any = echarts.init(document.getElementById('reachability_pieDiagram_range_' + nextEntry_keyRange + ''));
        // use configuration item and data specified to show chart
        var echartsOptions:any = this.diagramHelperService.createInitialReachabilityAnalysisPieOptions(poi, nextEntry_valueGeoJSON, nextEntry_keyRange_label + " " + this.dataExchangeService.pipedData.isochroneLegend.cutOffUnit, date);
        echartsInstance.setOption(echartsOptions);

        echartsInstance.hideLoading();

        this.echartsInstances_reachabilityAnalysis.set(nextEntry_keyRange, echartsInstance);

        setTimeout(() => {
          echartsInstance.resize();
        }, 350);
      }

      nextEntry = mapEntries.next();
    }
  };

  removePoiFromDiagram(poiGeoresource) {
    var chart_entries = this.echartsInstances_reachabilityAnalysis.entries();

    var nextChartInstanceEntry = chart_entries.next();
    while (nextChartInstanceEntry.value) {

      var nextChartInstance = nextChartInstanceEntry.value[1];
      var nextChartOptions = nextChartInstance.getOption();

      nextChartOptions = this.diagramHelperService.removePoiFromReachabilityAnalysisOption(nextChartOptions, poiGeoresource);
      nextChartInstance.setOption(nextChartOptions);

      this.echartsInstances_reachabilityAnalysis.set(nextChartInstanceEntry.value[0], nextChartInstance);

      nextChartInstanceEntry = chart_entries.next();
    }
  };

  handlePoiOnMap(poi) {

    if (poi.isSelected_reachabilityAnalysis) {
      //display on Map
      this.addPoiLayerToMap(poi);
    }
    else {
      //remove POI layer from map
      this.removePoiLayerFromMap(poi);
    }

  };

  addPoiLayerToMap(poiGeoresource) {
    this.reachabilityHelperService.settings.loadingData = true;
    

    // fale --> useCluster = false 
    this.reachabilityMapHelperService.addPoiGeoresourceGeoJSON_reachabilityAnalysis(this.domId, poiGeoresource, this.getQueryDate(poiGeoresource), false);
    this.reachabilityHelperService.settings.loadingData = false;
    

  };

  removePoiLayerFromMap(poiGeoresource) {
    this.reachabilityHelperService.settings.loadingData = true;
    

    poiGeoresource = poiGeoresource;

    this.reachabilityMapHelperService.removePoiGeoresource_reachabilityAnalysis(this.domId, poiGeoresource);
    this.reachabilityHelperService.settings.loadingData = false;
  };

  //async
  async refreshPoiLayers() {
    for (var poi of this.dataExchangeService.pipedData.displayableGeoresources) {
      if (poi.isSelected_reachabilityAnalysis) {
        //remove POI layer from map
        this.removePoiLayerFromMap(poi);

        poi = await this.fetchGeoJSONForDate(poi);

        // remove layer and add layer again
        this.addPoiLayerToMap(poi);
      }
    }
  };

  onClickUseIndicatorTimestamp() {
    this.reachabilityHelperService.settings.dateSelectionType.selectedDateType = this.reachabilityHelperService.settings.dateSelectionType_valueIndicator;

    this.refreshSelectedGeoresources();
  };

  isNoValidDate(dateCandidate) {
    var dateComps = dateCandidate.split("-");

    if (dateComps.length < 3) {
      return true;
    }
    else if (!dateComps[0] || !dateComps[1] || !dateComps[2]) {
      return true;
    }
    else if (isNaN(dateComps[0]) || isNaN(dateComps[1]) || isNaN(dateComps[2])) {
      return true;
    }
    else if (Number(dateComps[1]) > 12 || Number(dateComps[2]) > 31) {
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
      var dateCandidate = this.reachabilityHelperService.settings.selectedDate_manual;

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

  };

  onChangeManualDate_isochroneConfig() {
    // check if date is an actual date
    // if so then refresh selected layers

    // Clear the timeout if it has already been set.
    // This will prevent the previous task from executing
    // if it has been less than <MILLISECONDS>
    clearTimeout(this.timeout_manualdate);

    // Make a new timeout set to go off in 1000ms (1 second)
    this.timeout_manualdate = setTimeout(() => {
      var dateCandidate = this.reachabilityHelperService.settings.isochroneConfig.selectedDate_manual;

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

  };

	selectedIndicatorDateHasChanged() {

    console.log("refresh selected georesource layers according to new date");

    // only refresh georesources if sync with indicator timestamp is selected
    if (!this.reachabilityHelperService.settings.dateSelectionType.selectedDateType.includes(this.reachabilityHelperService.settings.dateSelectionType_valueIndicator)) {
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
    for (const georesource of this.dataExchangeService.pipedData.displayableGeoresources) {
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
    
  };

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
  };

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
