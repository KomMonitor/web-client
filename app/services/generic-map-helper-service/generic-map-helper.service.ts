import { ajskommonitorGenericMapHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GenericMapHelperService {

  pipedData: any;

  public constructor(
    @Inject('kommonitorGenericMapHelperService') private ajskommonitorGenericMapHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorGenericMapHelperServiceProvider;
  }

  createCustomMarker(poiFeature, poiMarkerStyle, poiMarkerText, poiSymbolColor, poiMarkerColor, poiSymbolBootstrap3Name, georesourceMetadataAndGeoJSON) {
    return this.ajskommonitorGenericMapHelperServiceProvider.createCustomMarker(poiFeature, poiMarkerStyle, poiMarkerText, poiSymbolColor, poiMarkerColor, poiSymbolBootstrap3Name, georesourceMetadataAndGeoJSON);
  }
  
  addPoiMarker(markers, newMarker) {
    return this.ajskommonitorGenericMapHelperServiceProvider.addPoiMarker(markers, newMarker);
  }

  createCustomMarkersFromWfsPoints(wfsLayer, poiMarkerLayer, dataset) {
    return ajskommonitorGenericMapHelperServiceProvider.createCustomMarkersFromWfsPoints(wfsLayer, poiMarkerLayer, dataset);
  }
}
