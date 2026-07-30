// NOTE: the Angular test environment (setupZoneTestEnv) is initialized by
// @angular-builders/jest 19's own built-in setup file, which runs before this one.
// We must NOT call it again here (double init → "Cannot set base providers").
// This file only adds polyfills / global stubs on top.

// Define the global $localize used at runtime by ng-bootstrap components (e.g. ngb-toast),
// matching the @angular/localize/init polyfill registered in angular.json for the app build.
import '@angular/localize/init';

// Polyfill HTMLCanvasElement.getContext (jsdom has none). Needed by Leaflet,
// ECharts and other canvas-based libs that components/services touch on init.
import 'jest-canvas-mock';
import { TextEncoder, TextDecoder } from 'util';
import { deserialize, serialize } from 'node:v8';
// fake-indexeddb/auto installs a global indexedDB implementation. Needed by
// leaflet-screenshot-cache-helper.service (indexedDB.open in its constructor).
import 'fake-indexeddb/auto';

// jsdom lacks TextEncoder/TextDecoder; Node provides them via `util`. Required
// by shpjs / leaflet-geosearch and other libs pulled in transitively.
Object.assign(globalThis, { TextEncoder, TextDecoder });

// jest's jsdom environment does not expose structuredClone (Node's global is not
// visible inside the sandbox). Polyfill via V8 structured clone, which preserves
// Dates/Maps/Sets/TypedArrays (unlike a JSON round-trip). Used e.g. by
// reporting.service to clone template configs.
if (typeof (globalThis as { structuredClone?: unknown }).structuredClone !== 'function') {
  (globalThis as { structuredClone?: unknown }).structuredClone = (value: unknown) =>
    deserialize(serialize(value));
}

// DiagramHelperServiceService reads getComputedStyle(querySelector('#fontFamily-reference'))
// in a field initializer; without the element, getComputedStyle(null) throws. Provide it
// so the (ECharts-using) diagram services/components can be constructed in jsdom.
if (!document.getElementById('fontFamily-reference')) {
  const fontFamilyRef = document.createElement('div');
  fontFamilyRef.id = 'fontFamily-reference';
  document.body.appendChild(fontFamilyRef);
}

/**
 * Global test setup.
 *
 * The app reads runtime configuration from the global `window.__env` object
 * (populated at runtime by StartupService and wrapped by EnvConfigService).
 * In unit tests there is no startup phase, so we provide a minimal stub here.
 * Most EnvConfigService getters simply return `window.__env.<key>` and tolerate
 * `undefined`; we pre-populate the handful of keys that are dereferenced further
 * (e.g. `.sort()` / string concatenation) so light/medium specs don't crash.
 *
 * Extend this object as real tests start asserting on specific config values.
 */
window.__env = window.__env || {};
Object.assign(window.__env, {
  // API URLs (baseUrlToKomMonitorDataAPI concatenates these)
  apiUrl: 'http://localhost:8085',
  basePath: '/management',

  // Map defaults
  initialLatitude: 51.5,
  initialLongitude: 7.0,
  initialZoomLevel: 12,
  minZoomLevel: 4,
  maxZoomLevel: 18,
  centerMapInitially: true,
  baseLayers: [],
  sortableLayers: [],
  wfsDatasets: [],
  customColorSchemes: [],

  // Georesource catalogue toggles (GeoresourceFilterService calls .indexOf on these)
  enabledGeoresourcesInfrastructure: [],
  enabledGeoresourcesGeoservices: [],

  // Geocoder (GeocoderHelperService calls .split("nominatim") on this URL)
  targetUrlToGeocoderService: 'http://localhost/nominatim/',

  // Dropdown option arrays (some getters call .sort()/iterate)
  indicatorUnitOptions: [],
  indicatorTypeOptions: [],
  updateIntervalOptions: [],
  indicatorCreationTypeOptions: [],
  geodataSourceFormats: [],
  simplifyGeometriesOptions: [],
  simplifyGeometriesParameterName: 'simplifyGeometries',
  simplifyGeometries: 'medium',

  // Feature property names
  FEATURE_ID_PROPERTY_NAME: 'ID',
  FEATURE_NAME_PROPERTY_NAME: 'NAME',
  VALID_START_DATE_PROPERTY_NAME: 'validStartDate',
  VALID_END_DATE_PROPERTY_NAME: 'validEndDate',

  // Auth
  enableKeycloakSecurity: false,

  // Misc
  localStoragePrefix: 'kommonitor_test',
  enableDebug: false,
  filterConfig: {},
  filterModes: [],
});
