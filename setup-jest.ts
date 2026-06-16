import "jest-preset-angular/setup-jest";

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
  apiUrl: "http://localhost:8085",
  basePath: "/management",

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

  // Dropdown option arrays (some getters call .sort()/iterate)
  indicatorUnitOptions: [],
  indicatorTypeOptions: [],
  updateIntervalOptions: [],
  indicatorCreationTypeOptions: [],
  geodataSourceFormats: [],
  simplifyGeometriesOptions: [],

  // Feature property names
  FEATURE_ID_PROPERTY_NAME: "ID",
  FEATURE_NAME_PROPERTY_NAME: "NAME",
  VALID_START_DATE_PROPERTY_NAME: "validStartDate",
  VALID_END_DATE_PROPERTY_NAME: "validEndDate",

  // Auth
  enableKeycloakSecurity: false,

  // Misc
  localStoragePrefix: "kommonitor_test",
  enableDebug: false,
  filterConfig: {},
  filterModes: [],
});
