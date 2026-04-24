import { Inject, Injectable, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

export interface MapRefreshObject {
  values: MapRefreshValues,
  error: boolean;
  errorMsg?: string[] | undefined;
}

export interface MapRefreshValues {
  indicator: any | undefined, 
  spatialUnit: any | undefined,
  date: any | undefined,
  justRestyling?: boolean | undefined,
  customComputation?: boolean | undefined,
}

export interface MapRecenterObject {
  resize: boolean;
  recenter: boolean;
}

export interface DateSliderObject {
  data: Date[] | undefined;
  selected: Date | undefined;
  disabled: boolean | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private mapRefreshStateSubject = new BehaviorSubject<MapRefreshObject>({
    values: {
      indicator: undefined, 
      spatialUnit: undefined,
      date: undefined
    },
    error: false
  });
  mapRefreshState$ = this.mapRefreshStateSubject.asObservable();

  private mapRecenterSubject = new BehaviorSubject<MapRecenterObject>({
   resize: false,
   recenter: false
  });
  mapRecenter$ = this.mapRecenterSubject.asObservable();

  private dateSliderSubject = new BehaviorSubject<DateSliderObject>({
    data: undefined,
    selected: undefined,
    disabled: undefined
  });
  dateSlider$ = this.dateSliderSubject.asObservable();
  
  public constructor(
      private broadcastService: BroadcastService
  ) { }

  setDateSliderValues(patch: Partial<DateSliderObject>) {
    this.dateSliderSubject.next({
      ...this.dateSliderSubject.value,
      ...patch
    });
  }

  setMapRecenterState(patch: Partial<MapRecenterObject>) {
    this.mapRecenterSubject.next({
      ...this.mapRecenterSubject.value,
      ...patch
    });
  }

  setMapRefreshValues(values:MapRefreshValues) {
    this.mapRefreshStateSubject.next({
      ...this.mapRefreshStateSubject.value, 
      values: values
    });
  }

  readyForRefresh():boolean {
    if(this.mapRefreshStateSubject.value.values.indicator!==undefined && 
        this.mapRefreshStateSubject.value.values.spatialUnit!==undefined && 
        this.mapRefreshStateSubject.value.values.date!==undefined)
      return true;

    return false;
  }

  resetMapRefreshState() {
    this.mapRefreshStateSubject.next({
      values: {
        indicator: undefined, 
        spatialUnit: undefined,
        date: undefined,
        justRestyling: false,
        customComputation: false,
      },
      error: false
    });
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
    //this.ajskommonitorMapServiceProvider.adjustOpacityForWmsLayer(dataset, opacity);
    this.broadcastService.broadcast("adjustOpacityForWmsLayer",[dataset, opacity]);
  }

  adjustOpacityForAoiLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustOpacityForAoiLayer(dataset, opacity);
    this.broadcastService.broadcast("adjustOpacityForAoiLayer",[dataset, opacity]);
  }

  adjustOpacityForPoiLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustOpacityForPoiLayer(dataset, opacity);
    this.broadcastService.broadcast("adjustOpacityForPoiLayer",[dataset, opacity]);
  }

  adjustOpacityForLoiLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustOpacityForLoiLayer(dataset, opacity);
    this.broadcastService.broadcast("adjustOpacityForLoiLayer",[dataset, opacity]);
  }

  adjustOpacityForWfsLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustOpacityForWfsLayer(dataset, opacity);
    this.broadcastService.broadcast("adjustOpacityForWfsLayer",[dataset, opacity]);
  }

  adjustColorForWfsLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustColorForWfsLayer(dataset, opacity);
    this.broadcastService.broadcast("adjustColorForWfsLayer",[dataset, opacity]);
  }

  restyleCurrentLayer() {
    //this.ajskommonitorMapServiceProvider.restyleCurrentLayer();
    this.broadcastService.broadcast("restyleCurrentLayer",[false]);
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

  replaceReachabilityScenarioOnMainMap(reachabilityScenario) {
    //this.ajskommonitorMapServiceProvider.replaceReachabilityScenarioOnMainMap(reachabilityScenario);
    this.broadcastService.broadcast("replaceReachabilityScenarioOnMainMap", [reachabilityScenario]);
  }

  removeReachabilityScenarioFromMainMap() {
    //this.ajskommonitorMapServiceProvider.removeReachabilityScenarioFromMainMap();
    this.broadcastService.broadcast("removeReachabilityScenarioFromMainMap");
  }

  addFileLayerToMap(dataset, opacity) {
    this.broadcastService.broadcast("addFileLayerToMap",[dataset]);
  }

  removeFileLayerFromMap(dataset) {
    this.broadcastService.broadcast("removeFileLayerFromMap", [dataset]);
  }

  adjustOpacityForFileLayer(dataset, opacity) {
    this.broadcastService.broadcast("adjustOpacityForFileLayer",[dataset, opacity]);
  }

  adjustColorForFileLayer(dataset) {
    this.broadcastService.broadcast("adjustColorForFileLayer",dataset);
  }
}
