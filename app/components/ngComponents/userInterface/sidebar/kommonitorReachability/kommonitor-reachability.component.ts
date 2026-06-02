import { MapService } from 'services/map-service/map.service';
import { Component, OnInit } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReachabilityScenarioModalComponent } from './reachability-scenario-modal/reachability-scenario-modal.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import {
	NgbNavContent,
	NgbNav,
	NgbNavItem,
	NgbNavItemRole,
	NgbNavLinkButton,
	NgbNavLinkBase,
	NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import { OpenStreetMapProvider, SearchControl } from 'leaflet-geosearch';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ReachabilityCombinerService } from 'services/reachability-combiner-service/reachability-combiner.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';
import { MultiSelectSliderComponent } from 'components/ngComponents/common/multi-select-slider/multi-select-slider.component';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';

@Component({
  standalone: true,
  selector: 'app-kommonitor-reachability',
  templateUrl: './kommonitor-reachability.component.html',
  styleUrls: ['./kommonitor-reachability.component.scss'],
  imports: [
    CommonModule, 
    FormsModule,
    ExpandableBoxComponent,
    NgbNavContent, 
    NgbNav, 
    NgbNavItem, 
    NgbNavItemRole, 
    NgbNavLinkButton,
    NgbNavLinkBase, 
    NgbNavOutlet,
    MultiSelectSliderComponent,
    LoadingOverlayComponent
  ]
})
export class KommonitorReachabilityComponent implements OnInit {
  error = undefined;
  manualStartPoints = undefined;

  settings:any = {};

  active = 1;

  loadingData: boolean = false;

  sliderRange:number[] = [1,300];

  constructor(
    protected dataExchangeService: DataExchangeService,
    protected reachabilityScenarioHelperService: ReachabilityScenarioHelperService,
    private mapService: MapService,
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    private envConfigService: EnvConfigService,
    protected reachabilityCombinerService: ReachabilityCombinerService,
    protected reachabilityHelperService: ReachabilityHelperService
  ) {
  }

  ngOnInit(): void {
       // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'switchReportingMode' : {
          this.changeStartPointsSource_fromLayer();
        } break;
        case 'removePotentialDrawnStartingPoints': {
          this.removePotentialDrawnStartingPoints();
        } break;
      }
    });

    this.openReachabilityScenarioModal();
  }

  geoserachProvider = new OpenStreetMapProvider({
    params: {
      'accept-language': 'de', // render results in Dutch
      countrycodes: 'de', // limit search results to the Netherlands
      addressdetails: 1, // include additional address detail parts  
      viewbox: "" + (Number(this.envConfigService.initialLongitude) - 0.001) + "," + (Number(this.envConfigService.initialLatitude) - 0.001) + "," + (Number(this.envConfigService.initialLongitude) + 0.001) + "," + (Number(this.envConfigService.initialLatitude) + 0.001)             
    },
    searchUrl: this.envConfigService.targetUrlToGeocoderService + '/search',
    reverseUrl: this.envConfigService.targetUrlToGeocoderService + '/reverse'
  });

  geosearchControl = SearchControl({
    position: "topleft",
    provider: this.geoserachProvider,
    style: 'button',
    autoComplete: true,
    autoCompleteDelay: 250,
    showMarker: true,                                   // optional: true|false  - default true
    showPopup: false,                                   // optional: true|false  - default false
    popupFormat: ({ query, result }) => result.label,   // optional: function    - default returns result label
    maxMarkers: 1,                                      // optional: number      - default 1
    retainZoomLevel: false,                             // optional: true|false  - default false
    animateZoom: true,                                  // optional: true|false  - default true
    autoClose: false,                                   // optional: true|false  - default false
    searchLabel: 'Suche nach Adressen ...',                       // optional: string      - default 'Enter address'
    keepResult: false                                   // optional: true|false  - default false
  });

  results: any[] = [];
  query = '';

  async onSearch(value: string) {
    this.query = value;

    if (!value || value.length < 3) {
      this.results = [];
      return;
    }

    this.results = await this.geoserachProvider.search({
      query: value
    });
  }

  selectResult(result: any) {
    this.query = result.label;
    this.results = [];

    this.reachabilityCombinerService.addLocation({type: 'Feature', geometry: {type: 'Point', coordinates: [result.x, result.y]}});
  }

  startCalculation() {
    this.reachabilityCombinerService.startQuickCalculation();
  }

  changeStartPointsSource_fromLayer() {

    this.disablePointDrawTool();	
    this.settings.startPointsSource = "fromLayer";					

  };

  disablePointDrawTool(){
    // disable/hide leaflet-draw toolbar for only POINT features
    this.broadcastService.broadcast("disablePointDrawTool");
  }

  removePotentialDrawnStartingPoints() {
    this.manualStartPoints = undefined;
    this.disablePointDrawTool();
    this.removeAllDrawnPoints();
  }

  removeAllDrawnPoints(){
    this.broadcastService.broadcast("removeAllDrawnPoints");
  }

  openReachabilityScenarioModal(scenarioDataset=false){

    const modalRef = this.modalService.open(ReachabilityScenarioModalComponent, {windowClass: 'modal-holder', centered: true});
    if(scenarioDataset){
      // submit selected spatial unit to modal controller
      //$rootScope.$broadcast("onManageReachabilityScenario", scenarioDataset);
    }
    else{
      // open modal controller without dataset
      //$rootScope.$broadcast("onManageReachabilityScenario");
    }
  }

  displayReachabilityScenarioOnMainMap(reachabilityScenario) {		
    this.mapService.replaceReachabilityScenarioOnMainMap(reachabilityScenario);
  }

  removeReachabilityScenarioFromMainMap(){
    this.mapService.removeReachabilityScenarioFromMainMap();
  } 

  onSinglePointSelection() {
    this.reachabilityCombinerService.manualMapSelectionMode = false;
    this.reachabilityCombinerService.resetLocations();
  }

  onMapSelection() {
    this.reachabilityCombinerService.manualMapSelectionMode = true;
    this.reachabilityCombinerService.resetLocations();
  }

  onLayerSelection() {
    this.reachabilityCombinerService.manualMapSelectionMode = false;
    this.reachabilityCombinerService.resetLocations();
  } 

  onFocusModeChange() {
    if(this.reachabilityCombinerService.settings.focus=='distance')
      this.sliderRange = [1,300];
    else
      this.sliderRange = [1,15];
  }
}
