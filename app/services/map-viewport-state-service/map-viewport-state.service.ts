import { Injectable } from '@angular/core';

/**
 * Current viewport (center + zoom) of the main map. Written by
 * KommonitorMapComponent on every zoomend/moveend, read e.g. by the share-link
 * builder. Previously this runtime state lived on EnvConfigService/window.__env
 * (map refactoring plan, Phase 4).
 */
@Injectable({
  providedIn: 'root',
})
export class MapViewportStateService {
  currentLatitude: any;
  currentLongitude: any;
  currentZoomLevel: any;

  setViewport(latitude: any, longitude: any, zoomLevel: any) {
    this.currentLatitude = latitude;
    this.currentLongitude = longitude;
    this.currentZoomLevel = zoomLevel;
  }
}
