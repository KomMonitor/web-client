import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReachabilityMapHelperService {

  pipedData:any;

  public constructor(
    @Inject('kommonitorReachabilityMapHelperService') private ajskommonitorReachabilityMapHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorReachabilityMapHelperServiceProvider;
  }

  invalidateMaps() {
    this.ajskommonitorReachabilityMapHelperServiceProvider.invalidateMaps();
  }

  zoomToIsochroneLayers() {
    this.ajskommonitorReachabilityMapHelperServiceProvider.zoomToIsochroneLayers();
  }
}
