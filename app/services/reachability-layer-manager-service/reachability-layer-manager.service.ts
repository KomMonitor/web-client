import { Injectable, inject } from '@angular/core';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MapContext } from 'services/map-service/map-context';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';

const SCENARIO_ISOCHRONES_ID = 'reachability:scenario:isochrones';
const SCENARIO_START_ID = 'reachability:scenario:start';

/**
 * Shows a reachability scenario (isochrones + start points) on the main map by
 * registering both with its layer registry. A new scenario replaces the
 * previous one under the same ids.
 */
@Injectable({
  providedIn: 'root',
})
export class ReachabilityLayerManagerService {
  private reachabilityMapHelperService = inject(ReachabilityMapHelperService);
  private mapOverlayState = inject(MapOverlayStateService);

  private context!: MapContext;

  initialize(context: MapContext) {
    this.context = context;
  }

  removeScenario() {
    this.context.layers.unregister(SCENARIO_ISOCHRONES_ID);
    this.context.layers.unregister(SCENARIO_START_ID);

    this.mapOverlayState.reachabilityScenarioOnMainMap = false;
  }

  replaceScenario(reachabilityScenario) {
    const layers = this.context.layers;
    const settings = reachabilityScenario.reachabilitySettings;
    const poiDataset = settings.selectedStartPointLayer;
    const locationsArray = poiDataset.geoJSON.features.map(
      (feature: any) => feature.geometry.coordinates
    );

    const isochroneLayer = this.reachabilityMapHelperService.makeIsochroneLayer(
      poiDataset.datasetName,
      reachabilityScenario.isochrones_dissolved,
      settings.transitMode,
      settings.focus,
      settings.rangeArray,
      settings.useMultipleStartPoints,
      settings.dissolveIsochrones,
      layers.paneFor(SCENARIO_ISOCHRONES_ID)
    );
    const markerLayer = this.reachabilityMapHelperService.makeIsochroneMarkerLayer(
      locationsArray,
      layers.paneFor(SCENARIO_START_ID)
    );

    this.mapOverlayState.reachabilityScenarioOnMainMap = true;

    // Isochrones first: a new entry goes on top, so the start points end up above them.
    layers.register({
      id: SCENARIO_ISOCHRONES_ID,
      groupId: 'reachability',
      title: 'Isochronen (Szenario)',
      subtitle: `${poiDataset.datasetName} · ${settings.transitMode}`,
      kind: 'vector',
      symbol: { kind: 'isochrone' },
      layer: isochroneLayer,
    });
    layers.register({
      id: SCENARIO_START_ID,
      groupId: 'reachability',
      title: 'Startpunkte (Szenario)',
      subtitle: poiDataset.datasetName,
      kind: 'marker',
      // Leaflet's default marker
      symbol: { kind: 'point', color: '#2a81cb' },
      layer: markerLayer,
    });
    // showing a scenario on the map is an explicit action: bring it back if it was hidden
    layers.setVisible(SCENARIO_ISOCHRONES_ID, true);
    layers.setVisible(SCENARIO_START_ID, true);

    this.context.map.invalidateSize(true);
    layers.zoomTo(SCENARIO_ISOCHRONES_ID);
  }
}
