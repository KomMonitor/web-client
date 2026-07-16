/**
 * Narrow handle on the main Leaflet map that KommonitorMapComponent passes to
 * the layer manager services (map refactoring plan, Phase 3). The Leaflet
 * instance itself stays encapsulated in the component — managers only receive
 * this context object and must not hand it on.
 */
export interface MapContext {
  /** The Leaflet map instance of the main map. */
  map: any;
  /** The grouped layer control of the main map. */
  layerControl: any;
  /** Rebuilds the feature search index after layers changed. */
  updateSearchControl(): void;
  /** Hides the map loading spinner. */
  hideLoadingIcon(): void;
}

/** Display names of the layer groups in the grouped layer control of the main map. */
export const MAP_LAYER_GROUPS = {
  spatialUnit: 'Raumebenen',
  georesource: 'Georessourcen',
  poi: 'Points of Interest',
  loi: 'Lines of Interest',
  aoi: 'Areas of Interest',
  indicator: 'Indikatoren',
  reachability: 'Erreichbarkeiten',
  wms: 'Web Map Services (WMS)',
  wfs: 'Web Feature Services (WFS)',
  file: 'Dateilayer',
  spatialUnitOutline: 'Raumebenen Umringe',
} as const;
