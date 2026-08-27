import { Injectable } from '@angular/core';

/**
 * Holds map overlay / map-display state shared between the map component and the
 * surrounding panels: the reachability (isochrone) overlay, the WMS/WFS service
 * URLs and legend image for the selected indicator, and the base-layer
 * definitions. Extracted in the Prio 7 god-service split
 * (see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 */
@Injectable({
  providedIn: 'root',
})
export class MapOverlayStateService {
  wmsUrlForSelectedIndicator: any;
  wfsUrlForSelectedIndicator: any;
  wmsLegendImage: any;
  reachabilityScenarioOnMainMap: any;
  isochroneLegend: any = false;
  baseLayerDefinitionsArray!: any[];
}
