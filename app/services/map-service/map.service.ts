import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  public constructor(
      @Inject('kommonitorMapService') private ajskommonitorMapServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    ) {
      //this.pipedData = this.ajskommonitorDataExchangeServiceeProvider;
    }

  removePoiGeoresource(reference) {
    return this.ajskommonitorMapServiceProvider.removePoiGeoresource(reference);
  }

  removeWfsLayerFromMap(wfs) {
    this.ajskommonitorMapServiceProvider.removeWfsLayerFromMap(wfs);
  }

  addWfsLayerToMap(wfs, opacity, useCluster) {
    this.ajskommonitorMapServiceProvider.addWfsLayerToMap(wfs, opacity, useCluster);
  }

  removeLoiGeoresource(loiGeoresource) {
    this.ajskommonitorMapServiceProvider.removeLoiGeoresource(loiGeoresource);
  }

  addWmsLayerToMap(dataset, opacity) {
    this.ajskommonitorMapServiceProvider.addWmsLayerToMap(dataset, opacity);
  }

  removeWmsLayerFromMap(dataset) {
    this.ajskommonitorMapServiceProvider.removeWmsLayerFromMap(dataset);
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
}
