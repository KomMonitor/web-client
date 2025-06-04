import { ajskommonitorReachabilityHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReachabilityHelperService {

  pipedData:any;

  public constructor(
    @Inject('kommonitorReachabilityHelperService') private ajskommonitorReachabilityHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorReachabilityHelperServiceProvider;
  }

  resetSettings() {
    this.ajskommonitorReachabilityHelperServiceProvider.resetSettings();
  }

  fetchGeoJSONForIsochrones() {
    this.ajskommonitorReachabilityHelperServiceProvider.fetchGeoJSONForIsochrones();
  }

  startIsochroneCalculation(used) {
    this.ajskommonitorReachabilityHelperServiceProvider.startIsochroneCalculation(used);
  }
}
