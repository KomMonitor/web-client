import { MapService } from 'services/map-service/map.service';
import { Component } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReachabilityScenarioModalComponent } from './reachability-scenario-modal/reachability-scenario-modal.component';

@Component({
  selector: 'app-kommonitor-reachability',
  templateUrl: './kommonitor-reachability.component.html',
  styleUrls: ['./kommonitor-reachability.component.css']
})
export class KommonitorReachabilityComponent {
  
  numberOfDecimals = window.__env.numberOfDecimals;
  error = undefined;

  constructor(
    protected dataExchangeService: DataExchangeService,
    protected reachabilityScenarioHelperService: ReachabilityScenarioHelperService,
    private mapService: MapService,
    private modalService: NgbModal
  ) {}

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
