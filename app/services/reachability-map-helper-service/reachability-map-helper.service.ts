import { ajskommonitorReachabilityMapHelperServiceProvider } from './../../app-upgraded-providers';
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

  initReachabilityGeoMap(id) {
    return this.ajskommonitorReachabilityMapHelperServiceProvider.initReachabilityGeoMap(id);
  }

  removeReachabilityLayers(domId) {
    this.ajskommonitorReachabilityMapHelperServiceProvider.removeReachabilityLayers(domId);
  }

  replaceIsochroneMarker(domId, locationsArray) {
    this.ajskommonitorReachabilityMapHelperServiceProvider.replaceIsochroneMarker(domId, locationsArray);
  }

  replaceIsochroneGeoJSON(
        domId,
        datasetName,
        currentIsochronesGeoJSON,
        transitMode,
        focus,
        rangeArray,
        useMultipleStartPoints,
        dissolveIsochrones) {
    this.ajskommonitorReachabilityMapHelperServiceProvider.replaceIsochroneGeoJSON(
        domId,
        datasetName,
        currentIsochronesGeoJSON,
        transitMode,
        focus,
        rangeArray,
        useMultipleStartPoints,
        dissolveIsochrones);
  }

  addPoiGeoresourceGeoJSON_reachabilityAnalysis(domId, poiGeoresource, queryDate, bol) {
    this.ajskommonitorReachabilityMapHelperServiceProvider.addPoiGeoresourceGeoJSON_reachabilityAnalysis(domId, poiGeoresource, queryDate, bol);
  }

  removePoiGeoresource_reachabilityAnalysis(domId, poiGeoresource) {
    this.ajskommonitorReachabilityMapHelperServiceProvider.removePoiGeoresource_reachabilityAnalysis(domId, poiGeoresource);
  }

  initReachabilityIndicatorStatisticsGeoMap(domId) {
    this.ajskommonitorReachabilityMapHelperServiceProvider.initReachabilityIndicatorStatisticsGeoMap(domId);
  }

  replaceReachabilityIndicatorStatisticsOnMap(domId, poiDataset, original_nonDissolved_isochrones, indicatorStatisticsCandidate) {
    this.ajskommonitorReachabilityMapHelperServiceProvider.replaceReachabilityIndicatorStatisticsOnMap(domId, poiDataset, original_nonDissolved_isochrones, indicatorStatisticsCandidate);
  }

  removeOldLayers_reachabilityIndicatorStatistics(domId) {
    this.ajskommonitorReachabilityMapHelperServiceProvider.removeOldLayers_reachabilityIndicatorStatistics(domId);
  }
}
