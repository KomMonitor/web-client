(function (window) {
  window.__env = window.__env || {};

  // Whether or not to enable debug mode
  // Setting this to false will disable console output
  window.__env.enableDebug = true;

  // API url
  window.__env.apiUrl = 'http://localhost:8085';

  // Base url
  window.__env.basePath = '/rest/v1';

  window.__env.indicatorDatePrefix = "DATE_";

  window.__env.numberOfDecimals = 4;

  window.__env.initialLatitude = 51.4386432;
  window.__env.initialLongitude = 7.0115552;
  window.__env.initialZoomLevel = 12;
  window.__env.minZoomLevel = 1;
  window.__env.maxZoomLevel = 19;

  window.__env.defaultColorForZeroValues = "#525252";


}(this));
