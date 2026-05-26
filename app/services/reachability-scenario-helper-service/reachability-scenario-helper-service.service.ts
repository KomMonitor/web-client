import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReachabilityScenarioHelperService {

  reachabilityScenarios:any = [];

  tmpActiveScenario:any = {
    reachabilitySettings: {}, // settings from rechability helper service for isochrone config
      "scenarioName": "", // unique scenario name
      "indicatorStatistics": [], // array of all calculated indicator statistics
      "isochrones_dissolved": {}, // kommonitorReachabilityHelperService.currentIsochronesGeoJSON 
      "isochrones_perPoint": {}, //kommonitorReachabilityHelperService.original_nonDissolved_isochrones
      "poiDataset": {
        "poiId": "",
        "poiName": "",
        "poiDate": "",
      }
  };


  public constructor( ) {}

  onImportScenariosFile() {
    //return this.ajskommonitorReachabilityScenarioHelperServiceProvider.onImportScenariosFile();
  }

  exportScenarios() {
    //this.ajskommonitorReachabilityScenarioHelperServiceProvider.exportScenarios();
  }

  removeReachabilityScenario(reachabilityScenario) {
    //this.ajskommonitorReachabilityScenarioHelperServiceProvider.removeReachabilityScenario(reachabilityScenario);
  }
  
  cloneReachabilityScenario(reachabilityScenario) {
    //this.ajskommonitorReachabilityScenarioHelperServiceProvider.cloneReachabilityScenario(reachabilityScenario);
  }
}
