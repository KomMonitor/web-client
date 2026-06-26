import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';

export interface MapRefreshObject {
  values: MapRefreshValues;
  error: boolean;
  errorMsg?: string[] | undefined;
}

export interface MapRefreshValues {
  indicator: any | undefined;
  spatialUnit: any | undefined;
  date: any | undefined;
  justRestyling?: boolean | undefined;
  customComputation?: boolean | undefined;
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
  providedIn: 'root',
})
export class MapService {
  private broadcastService = inject(BroadcastService);

  private mapRefreshStateSubject = new BehaviorSubject<MapRefreshObject>({
    values: {
      indicator: undefined,
      spatialUnit: undefined,
      date: undefined,
    },
    error: false,
  });
  mapRefreshState$ = this.mapRefreshStateSubject.asObservable();

  private replaceIndicatorLayerSubject = new Subject<{
    indicator: any;
    spatialUnitName: string;
    date: string;
    isCustomComputation: boolean;
  }>();
  replaceIndicatorLayerSubject$ = this.replaceIndicatorLayerSubject.asObservable();

  private mapRecenterSubject = new BehaviorSubject<MapRecenterObject>({
    resize: false,
    recenter: false,
  });
  mapRecenter$ = this.mapRecenterSubject.asObservable();

  private dateSliderSubject = new BehaviorSubject<DateSliderObject>({
    data: undefined,
    selected: undefined,
    disabled: undefined,
  });
  dateSlider$ = this.dateSliderSubject.asObservable();

  replaceIndicatorLayer(
    indicator: any,
    spatialUnitName: string,
    date: string,
    isCustomComputation: boolean
  ) {
    this.replaceIndicatorLayerSubject.next({
      indicator,
      spatialUnitName,
      date,
      isCustomComputation,
    });
  }

  setDateSliderValues(patch: Partial<DateSliderObject>) {
    this.dateSliderSubject.next({
      ...this.dateSliderSubject.value,
      ...patch,
    });
  }

  setMapRecenterState(patch: Partial<MapRecenterObject>) {
    this.mapRecenterSubject.next({
      ...this.mapRecenterSubject.value,
      ...patch,
    });
  }

  setMapRefreshValues(values: MapRefreshValues) {
    this.mapRefreshStateSubject.next({
      ...this.mapRefreshStateSubject.value,
      values: values,
    });
  }

  readyForRefresh(): boolean {
    if (
      this.mapRefreshStateSubject.value.values.indicator !== undefined &&
      this.mapRefreshStateSubject.value.values.spatialUnit !== undefined &&
      this.mapRefreshStateSubject.value.values.date !== undefined
    )
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
      error: false,
    });
  }

  removePoiGeoresource(reference) {
    this.broadcastService.broadcast(BroadcastMessage.RemovePoiGeoresource, [reference]);
  }

  removeWfsLayerFromMap(wfs) {
    this.broadcastService.broadcast(BroadcastMessage.RemoveWfsLayerFromMap, [wfs]);
  }

  addWfsLayerToMap(wfs, opacity, useCluster) {
    console.log('addWfsLayerToMap');
    this.broadcastService.broadcast(BroadcastMessage.AddWfsLayerToMap, [wfs, opacity, useCluster]);
  }

  removeLoiGeoresource(loiGeoresource) {
    this.broadcastService.broadcast(BroadcastMessage.RemoveLoiGeoresource, [loiGeoresource]);
  }

  addWmsLayerToMap(dataset, opacity) {
    console.log('addWmsLayerToMap');
    this.broadcastService.broadcast(BroadcastMessage.AddWmsLayerToMap, [dataset, opacity]);
  }

  removeWmsLayerFromMap(dataset) {
    this.broadcastService.broadcast(BroadcastMessage.RemoveWmsLayerFromMap, [dataset]);
  }

  adjustOpacityForWmsLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustOpacityForWmsLayer(dataset, opacity);
    this.broadcastService.broadcast(BroadcastMessage.AdjustOpacityForWmsLayer, [dataset, opacity]);
  }

  adjustOpacityForAoiLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustOpacityForAoiLayer(dataset, opacity);
    this.broadcastService.broadcast(BroadcastMessage.AdjustOpacityForAoiLayer, [dataset, opacity]);
  }

  adjustOpacityForPoiLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustOpacityForPoiLayer(dataset, opacity);
    this.broadcastService.broadcast(BroadcastMessage.AdjustOpacityForPoiLayer, [dataset, opacity]);
  }

  adjustOpacityForLoiLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustOpacityForLoiLayer(dataset, opacity);
    this.broadcastService.broadcast(BroadcastMessage.AdjustOpacityForLoiLayer, [dataset, opacity]);
  }

  adjustOpacityForWfsLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustOpacityForWfsLayer(dataset, opacity);
    this.broadcastService.broadcast(BroadcastMessage.AdjustOpacityForWfsLayer, [dataset, opacity]);
  }

  adjustColorForWfsLayer(dataset, opacity) {
    //this.ajskommonitorMapServiceProvider.adjustColorForWfsLayer(dataset, opacity);
    this.broadcastService.broadcast(BroadcastMessage.AdjustColorForWfsLayer, [dataset, opacity]);
  }

  restyleCurrentLayer() {
    //this.ajskommonitorMapServiceProvider.restyleCurrentLayer();
    this.broadcastService.broadcast(BroadcastMessage.RestyleCurrentLayer, [false]);
  }

  replaceIndicatorGeoJSON(
    indicatorMetadataAndGeoJSON,
    spatialUnitName,
    date,
    justRestyling,
    isCustomComputation = false
  ) {
    //this.ajskommonitorMapServiceProvider.replaceIndicatorGeoJSON(indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation);
    this.broadcastService.broadcast(BroadcastMessage.ReplaceIndicatorAsGeoJSON, [
      indicatorMetadataAndGeoJSON,
      spatialUnitName,
      date,
      justRestyling,
      isCustomComputation,
    ]);
  }

  addPoiGeoresourceGeoJSON(poiGeoresource, date, useCluster) {
    this.broadcastService.broadcast(BroadcastMessage.AddPoiGeoresourceAsGeoJSON, [
      poiGeoresource,
      date,
      useCluster,
    ]);
  }

  addAoiGeoresourceGeoJSON(aoiGeoresource, date) {
    this.broadcastService.broadcast(BroadcastMessage.AddAoiGeoresourceAsGeoJSON, [aoiGeoresource, date]);
  }

  addLoiGeoresourceGeoJSON(loiGeoresource, date) {
    this.broadcastService.broadcast(BroadcastMessage.AddLoiGeoresourceAsGeoJSON, [loiGeoresource, date]);
  }

  removeAoiGeoresource(aoiGeoresource) {
    this.broadcastService.broadcast(BroadcastMessage.RemoveAoiGeoresource, [aoiGeoresource]);
  }

  replaceReachabilityScenarioOnMainMap(reachabilityScenario) {
    this.broadcastService.broadcast(BroadcastMessage.ReplaceReachabilityScenarioOnMainMap, [reachabilityScenario]);
  }

  removeReachabilityScenarioFromMainMap() {
    this.broadcastService.broadcast(BroadcastMessage.RemoveReachabilityScenarioFromMainMap);
  }

  addFileLayerToMap(dataset, _opacity) {
    this.broadcastService.broadcast(BroadcastMessage.AddFileLayerToMap, [dataset]);
  }

  removeFileLayerFromMap(dataset) {
    this.broadcastService.broadcast(BroadcastMessage.RemoveFileLayerFromMap, [dataset]);
  }

  adjustOpacityForFileLayer(dataset, opacity) {
    this.broadcastService.broadcast(BroadcastMessage.AdjustOpacityForFileLayer, [dataset, opacity]);
  }

  adjustColorForFileLayer(dataset) {
    this.broadcastService.broadcast(BroadcastMessage.AdjustColorForFileLayer, dataset);
  }
}
