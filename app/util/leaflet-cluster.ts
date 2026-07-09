import * as L from 'leaflet';
import 'leaflet.markercluster';

/**
 * Creates a Leaflet MarkerClusterGroup in a way that survives production builds.
 *
 * `leaflet.markercluster` is a UMD plugin that augments Leaflet's *live* exports
 * object with the top-level members `markerClusterGroup` / `MarkerClusterGroup`.
 * In production, Angular's esbuild ESM/CJS interop hands each module a *snapshot*
 * of the Leaflet namespace (`__toESM(require('leaflet'))`) captured before the
 * plugin's side-effect import runs, so these newly added top-level members are
 * missing from the imported `L` — calling `L.markerClusterGroup(...)` then throws
 * "markerClusterGroup is not a constructor". (Nested augmentations such as
 * `L.control.measure` keep working because they mutate a shared sub-object.)
 *
 * Leaflet's UMD assigns its live exports to `window.L`, which the plugin does
 * mutate, so we resolve the factory from there and fall back to the imported
 * namespace for non-bundled/test environments.
 */
export function createMarkerClusterGroup(options?: unknown): any {
  const leaflet: any = (window as any).L ?? L;
  return leaflet.markerClusterGroup(options);
}
