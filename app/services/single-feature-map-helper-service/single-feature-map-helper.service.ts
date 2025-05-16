import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SingleFeatureMapHelperService {

  pipedData:any;

  public constructor(
    @Inject('kommonitorSingleFeatureMapHelperService') private ajskommonitorSingleFeatureMapHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorSingleFeatureMapHelperServiceProvider;
  }

  invalidateMap() {
    this.ajskommonitorSingleFeatureMapHelperServiceProvider.invalidateMap();
  }
  
  zoomToDataLayer() {
    this.ajskommonitorSingleFeatureMapHelperServiceProvider.zoomToDataLayer();
  }
}
