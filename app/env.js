(function (window) {
  window.__env = window.__env || {};

  // Whether or not to enable debug mode
  // Setting this to false will disable console output
  window.__env.enableDebug = true;

  // API url
  // window.__env.apiUrl = 'http://kommonitor.fbg-hsbo.de/';
  window.__env.apiUrl = 'http://localhost:8085/';
  // Base url
  window.__env.basePath = 'management';

  // window.__env.apiUrl = 'http://kommonitor.fbg-hsbo.de/processing';
  window.__env.targetUrlToProcessingEngine = 'http://localhost:8086/processing/';
    // window.__env.apiUrl = 'http://kommonitor.fbg-hsbo.de/openrouteservice';
  window.__env.targetUrlToReachabilityService_ORS = 'http://localhost:8090/openrouteservice-4.7.2';
  // window.__env.apiUrl = 'http://kommonitor.fbg-hsbo.de/opentripplanner';
  window.__env.targetUrlToReachabilityService_OTP = 'http://localhost:8090/opentripplanner';

  window.__env.simplifyGeometriesParameterName = "simplifyGeometries";
  window.__env.simplifyGeometriesOptions = [{"label": "nein", "value": "original"}, {"label": "schwach", "value": "weak"}, {"label": "mittel", "value": "medium"}, {"label": "stark", "value": "strong"}];
  window.__env.simplifyGeometries = "original";

  window.__env.indicatorDatePrefix = "DATE_";

  window.__env.numberOfDecimals = 2;

  window.__env.initialLatitude = 51.4036432;
  window.__env.initialLongitude = 6.9115552;
  window.__env.initialZoomLevel = 12;
  window.__env.minZoomLevel = 11;
  window.__env.maxZoomLevel = 22;

  // window.__env.initialIndicatorId = "d6f447c1-5432-4405-9041-7d5b05fd9ece";
  window.__env.initialIndicatorId = "c9f168a8-a547-416d-acfc-82ecfaa830d8";
  window.__env.initialSpatialUnitName = "Baublockebene";

  window.__env.defaultColorForOutliers_high = "#191919";
  window.__env.defaultBorderColorForOutliers_high = "black";
  window.__env.defaultFillOpacityForOutliers_high = "0.7";
  window.__env.defaultColorForOutliers_low = "#4f4f4f";
  window.__env.defaultBorderColorForOutliers_low = "black";
  window.__env.defaultFillOpacityForOutliers_low = "0.7";
  window.__env.defaultColorForHoveredFeatures = "#e01414";
  window.__env.defaultColorForClickedFeatures = "#42e5f4";
  window.__env.defaultColorForZeroValues = "#bababa";
  window.__env.defaultBorderColor = "black";
  window.__env.defaultColorForFilteredValues = "rgba(255,255,255,0)";
  window.__env.defaultBorderColorForFilteredValues = "black";
  window.__env.defaultFillOpacity = "0.7";
  window.__env.defaultFillOpacityForFilteredFeatures = "0.7";
  window.__env.defaultFillOpacityForZeroFeatures = "0.7";
  window.__env.defaultFillOpacityForHighlightedFeatures = "0.8";
  window.__env.useTransparencyOnIndicator = true;
  window.__env.useOutlierDetectionOnIndicator = false;
  //allowesValues: equal_interval, quantile, jenks
  window.__env.defaultClassifyMethod = "equal_interval";

  window.__env.defaultColorBrewerPaletteForBalanceIncreasingValues = "Purples";
  window.__env.defaultColorBrewerPaletteForBalanceDecreasingValues = "YlOrBr";
  window.__env.defaultColorBrewerPaletteForGtMovValues = "YlOrBr";
  window.__env.defaultColorBrewerPaletteForLtMovValues = "Blues";

  window.__env.feedbackMailRecipient = "thomas.blasche@amt62.essen.de";
  // window.__env.feedbackMailRecipient = "christian.danowski-buhren@hs-bochum.de";



}(this));
