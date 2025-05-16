import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReachabilityScenarioHelperService {

  pipedData:any;

  public constructor(
    @Inject('kommonitorReachabilityScenarioHelperService') private ajskommonitorReachabilityScenarioHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorReachabilityScenarioHelperServiceProvider;
  }

  onImportScenariosFile() {
    return this.ajskommonitorReachabilityScenarioHelperServiceProvider.onImportScenariosFile();
  }

  exportScenarios() {
    this.ajskommonitorReachabilityScenarioHelperServiceProvider.exportScenarios();
  }

  removeReachabilityScenario(reachabilityScenario) {
    this.ajskommonitorReachabilityScenarioHelperServiceProvider.removeReachabilityScenario(reachabilityScenario);
  }
  
  cloneReachabilityScenario(reachabilityScenario) {
    this.ajskommonitorReachabilityScenarioHelperServiceProvider.cloneReachabilityScenario(reachabilityScenario);
  }
}
