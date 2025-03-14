import { Inject, Injectable } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  public constructor(
      @Inject('kommonitorMapService') private ajskommonitorMapServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
      private broadcastService: BroadcastService
  ) {
    //this.pipedData = this.ajskommonitorDataExchangeServiceeProvider;
  }

  removePoiGeoresource(reference) {
    this.broadcastService.broadcast('removePoiGeoresource', [reference]);
  }

  removeWfsLayerFromMap(wfs) {
    this.broadcastService.broadcast("removeWfsLayerFromMap",[wfs]);
  }

  addWfsLayerToMap(wfs, opacity, useCluster) {
    console.log("addWfsLayerToMap");
    this.broadcastService.broadcast("addWfsLayerToMap",[wfs, opacity, useCluster]);
  }

  removeLoiGeoresource(loiGeoresource) {
    this.broadcastService.broadcast('removeLoiGeoresource', [loiGeoresource]);
  }

  addWmsLayerToMap(dataset, opacity) {
    console.log("addWmsLayerToMap");
    this.broadcastService.broadcast('addWmsLayerToMap', [dataset, opacity]);
  }

  removeWmsLayerFromMap(dataset) {
    this.broadcastService.broadcast("removeWmsLayerFromMap", [dataset]);
  }

  adjustOpacityForWmsLayer(dataset, opacity) {
    this.ajskommonitorMapServiceProvider.adjustOpacityForWmsLayer(dataset, opacity);
  }

  adjustOpacityForAoiLayer(dataset, opacity) {
    this.ajskommonitorMapServiceProvider.adjustOpacityForAoiLayer(dataset, opacity);
  }

  adjustOpacityForPoiLayer(dataset, opacity) {
    this.ajskommonitorMapServiceProvider.adjustOpacityForPoiLayer(dataset, opacity);
  }

  adjustOpacityForLoiLayer(dataset, opacity) {
    this.ajskommonitorMapServiceProvider.adjustOpacityForLoiLayer(dataset, opacity);
  }

  adjustOpacityForWfsLayer(dataset, opacity) {
    this.ajskommonitorMapServiceProvider.adjustOpacityForWfsLayer(dataset, opacity);
  }

  adjustColorForWfsLayer(dataset, opacity) {
    this.ajskommonitorMapServiceProvider.adjustColorForWfsLayer(dataset, opacity);
  }

  restyleCurrentLayer() {
    this.ajskommonitorMapServiceProvider.restyleCurrentLayer();
  }

  replaceIndicatorGeoJSON(indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation=false) {
    //this.ajskommonitorMapServiceProvider.replaceIndicatorGeoJSON(indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation);
    this.broadcastService.broadcast("replaceIndicatorAsGeoJSON", [indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation]);
  }

  addPoiGeoresourceGeoJSON(poiGeoresource, date, useCluster) {
    this.broadcastService.broadcast("addPoiGeoresourceAsGeoJSON", [poiGeoresource, date, useCluster]);
  }

  addAoiGeoresourceGeoJSON(aoiGeoresource, date) {
    this.broadcastService.broadcast("addAoiGeoresourceAsGeoJSON", [aoiGeoresource, date]);
  }

  addLoiGeoresourceGeoJSON(loiGeoresource, date) {
    this.broadcastService.broadcast("addLoiGeoresourceAsGeoJSON", [loiGeoresource, date]);
  }

  removeAoiGeoresource(aoiGeoresource) {
    this.broadcastService.broadcast('removeAoiGeoresource', [aoiGeoresource]);
  }
}
