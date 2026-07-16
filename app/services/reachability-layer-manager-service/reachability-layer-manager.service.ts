import { Injectable, inject } from '@angular/core';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MAP_LAYER_GROUPS, MapContext } from 'services/map-service/map-context';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';

/**
 * Manages the reachability scenario layers (start point markers + isochrones)
 * on the main map (map refactoring plan, Phase 3 — extracted from
 * KommonitorMapComponent).
 */
@Injectable({
  providedIn: 'root',
})
export class ReachabilityLayerManagerService {
  private reachabilityMapHelperService = inject(ReachabilityMapHelperService);
  private mapOverlayState = inject(MapOverlayStateService);

  private context!: MapContext;

  private markerLayer: any = undefined;
  private isochroneLayer: any = undefined;

  initialize(context: MapContext) {
    this.context = context;
  }

  removeScenario() {
    this.removeScenarioLayers();

    this.mapOverlayState.reachabilityScenarioOnMainMap = false;
  }

  replaceScenario(reachabilityScenario) {
    this.removeScenarioLayers();

    const poiDataset = reachabilityScenario.reachabilitySettings.selectedStartPointLayer;
    const locationsArray: any[] = [];

    poiDataset.geoJSON.features.forEach((feature: any) => {
      locationsArray.push(feature.geometry.coordinates);
    });

    this.markerLayer = this.reachabilityMapHelperService.makeIsochroneMarkerLayer(locationsArray);

    this.mapOverlayState.reachabilityScenarioOnMainMap = true;

    this.isochroneLayer = this.reachabilityMapHelperService.makeIsochroneLayer(
      reachabilityScenario.reachabilitySettings.selectedStartPointLayer.datasetName,
      reachabilityScenario.isochrones_dissolved,
      reachabilityScenario.reachabilitySettings.transitMode,
      reachabilityScenario.reachabilitySettings.focus,
      reachabilityScenario.reachabilitySettings.rangeArray,
      reachabilityScenario.reachabilitySettings.useMultipleStartPoints,
      reachabilityScenario.reachabilitySettings.dissolveIsochrones
    );

    this.context.layerControl.addOverlay(
      this.markerLayer,
      'Startpunkte der Isochronenberechnung - ' + poiDataset.datasetName,
      MAP_LAYER_GROUPS.reachability
    );
    this.context.layerControl.addOverlay(
      this.isochroneLayer,
      'Erreichbarkeits-Isochronen_' +
        reachabilityScenario.reachabilitySettings.transitMode +
        '_' +
        poiDataset.datasetName,
      MAP_LAYER_GROUPS.reachability
    );

    this.markerLayer.addTo(this.context.map);
    this.isochroneLayer.addTo(this.context.map);

    this.context.map.invalidateSize(true);
    this.context.map.fitBounds(this.isochroneLayer.getBounds());
  }

  private removeScenarioLayers() {
    if (this.markerLayer) {
      this.context.layerControl.removeLayer(this.markerLayer);
      this.context.map.removeLayer(this.markerLayer);
    }
    if (this.isochroneLayer) {
      this.context.layerControl.removeLayer(this.isochroneLayer);
      this.context.map.removeLayer(this.isochroneLayer);
    }
  }
}
