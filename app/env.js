(function (window) {
  window.__env = window.__env || {};

  // Whether or not to enable debug mode
  // Setting this to false will disable console output
  window.__env.enableDebug = false;

  // API url
  window.__env.apiUrl = 'http://localhost:8085';

  // Base url
  window.__env.basePath = '/rest/v1';

  window.__env.initialLatitude = 51.4386432;
}(this));
