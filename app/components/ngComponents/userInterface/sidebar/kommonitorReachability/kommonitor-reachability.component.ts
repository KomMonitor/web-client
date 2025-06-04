import { MapService } from 'services/map-service/map.service';
import { Component, OnInit } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReachabilityScenarioModalComponent } from './reachability-scenario-modal/reachability-scenario-modal.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  selector: 'app-kommonitor-reachability',
  templateUrl: './kommonitor-reachability.component.html',
  styleUrls: ['./kommonitor-reachability.component.css']
})
export class KommonitorReachabilityComponent implements OnInit {
  
  numberOfDecimals = window.__env.numberOfDecimals;
  error = undefined;


  /**
  * start points that were drawn manually
  * direct GeoJSON structure
  */
  manualStartPoints = undefined;

  settings:any = {};

  constructor(
    protected dataExchangeService: DataExchangeService,
    protected reachabilityScenarioHelperService: ReachabilityScenarioHelperService,
    private mapService: MapService,
    private modalService: NgbModal,
    private broadcastService: BroadcastService
  ) {}

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
  }

  /* 
    unclear what old kommonitor-reachability.component.ts <---- "ts" is used for. As it is TypeScript
    holds a lot of functionality, but maybe unused??!?!

    next 4 functions are based on this old ts file.. maybe replace/reposition
  */
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

}
