// (function (window) {
  window.__env = window.__env || {};

  // Whether or not to enable debug mode
  // Setting this to false will disable console output
  window.__env.enableDebug = true;

  window.__env.adminUserName = "Admin";
  window.__env.adminPassword = "kmAdmin";

  // property names of feature id and name (relevant for all spatial features) - KomMonitor specific
  // DO NOT CHANGE THEM - ONLY IF YOU REALLY KNOW WHAT YOU ARE DOING
  window.__env.FEATURE_ID_PROPERTY_NAME = "ID";
  window.__env.FEATURE_NAME_PROPERTY_NAME = "NAME";
  window.__env.VALID_START_DATE_PROPERTY_NAME = "validStartDate";
  window.__env.VALID_END_DATE_PROPERTY_NAME = "validEndDate";
  window.__env.indicatorDatePrefix = "DATE_";

  // Data Management API URL
  window.__env.apiUrl = 'https://kommonitor.muelheim-ruhr.de/';
  // window.__env.apiUrl = 'http://localhost:8085/';
  // Base url for Data Management API
  window.__env.basePath = 'management';

  // Processing Engine URL
  window.__env.targetUrlToProcessingEngine = 'https://kommonitor.muelheim-ruhr.de/processing/';
  // window.__env.targetUrlToProcessingEngine = 'http://localhost:8086/processing/';

  // Open Route Service URL
    // window.__env.apiUrl = 'http://kommonitor.fbg-hsbo.de/openrouteservice';
  window.__env.targetUrlToReachabilityService_ORS = 'https://ors5.fbg-hsbo.de';

  // Open Trip Planner URL - currently not integrated
  window.__env.targetUrlToReachabilityService_OTP = 'https://kommonitor.muelheim-ruhr.de/opentripplanner';
  // window.__env.targetUrlToReachabilityService_OTP = 'http://localhost:8090/opentripplanner';

  // Data Imporert URL
  window.__env.targetUrlToImporterService = 'https://kommonitor.muelheim-ruhr.de/importer';

  // optional geometry simplification (a feature of Data Management API)
  window.__env.simplifyGeometriesParameterName = "simplifyGeometries";
  // allowed values and meaning:
  // ["original" --> no simplification; "weak" --> weak simplification,
  // "medium" --> medium simplification; "strong" --> string simplification]
  window.__env.simplifyGeometriesOptions = [{"label": "nein", "value": "original"}, {"label": "schwach", "value": "weak"}, {"label": "mittel", "value": "medium"}, {"label": "stark", "value": "strong"}];
  // use strong as default to minimize size of queried features
  // for display, strong simplification is okay
  window.__env.simplifyGeometries = "original";

  // number of decimals for display of numeric values in app
  window.__env.numberOfDecimals = 2;

  window.__env.initialLatitude = 51.4136432;
  window.__env.initialLongitude = 6.8915552;
  window.__env.initialZoomLevel = 12.5;
  window.__env.minZoomLevel = 11;
  window.__env.maxZoomLevel = 22;

  // window.__env.initialIndicatorId = "d6f447c1-5432-4405-9041-7d5b05fd9ece";
  window.__env.initialIndicatorId = "f397fd73-7963-42e5-bb5b-8c54a0080254";
  window.__env.initialSpatialUnitName = "Statistische Bezirke";

 // various color settings
  window.__env.defaultColorForNoDataValues = "black";
  window.__env.defaultBorderColorForNoDataValues = "red";
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
  window.__env.defaultFillOpacityForNoDataFeatures = "0.7";
  window.__env.defaultFillOpacityForHighlightedFeatures = "0.8";
  window.__env.useTransparencyOnIndicator = true;
  window.__env.useOutlierDetectionOnIndicator = true;
  window.__env.classifyZeroSeparately = true;
  window.__env.classifyUsingWholeTimeseries = true;

  // default color for specific classification as ColorBrewer palette name
  // i.e. balance mode
  // i.e. measure of value classification (German: Schwellwertklassifizierung)
  window.__env.defaultColorBrewerPaletteForBalanceIncreasingValues = "Purples";
  window.__env.defaultColorBrewerPaletteForBalanceDecreasingValues = "YlOrBr";
  window.__env.defaultColorBrewerPaletteForGtMovValues = "YlOrBr";
  window.__env.defaultColorBrewerPaletteForLtMovValues = "Blues";

  // classification
  //allowesValues: equal_interval, quantile, jenks
  window.__env.defaultClassifyMethod = "equal_interval";

  // array of indicator name substring that shal be used to filter out / hide certain indicators by their name
  // e.g. set ["entwicklung"] to hide all indicators whose name contains the substring "entwicklung"
  window.__env.arrayOfNameSubstringsForHidingIndicators = ["Standardabweichung", "Bevölkerung - ", "Soziale Lage - ", "Soziale Lage (Leitindikator)", "Sterberisiko", "mittlerer Bodenversiegelungsgrad"];
  // window.__env.arrayOfNameSubstringsForHidingIndicators = [];
  
  window.__env.arrayOfNameSubstringsForHidingGeoresources = [];

  // e-mail recipient for feedback mail
  window.__env.feedbackMailRecipient = "marcel.thelen@muelheim-ruhr.de";
  // window.__env.feedbackMailRecipient = "christian.danowski-buhren@hs-bochum.de";

  window.__env.updateIntervalOptions = [
    {
        displayName: "jährlich",
        apiName: "YEARLY"
    },
    {
        displayName: "halbjährlich",
        apiName: "HALF_YEARLY"
    },
    {
        displayName: "vierteljährlich",
        apiName: "QUARTERLY"
    },
    {
        displayName: "monatlich",
        apiName: "MONTHLY"
    },
    {
      displayName: "wöchentlich",
      apiName: "WEEKLY"
    },
    {
      displayName: "täglich",
      apiName: "DAILY"
    },
    {
        displayName: "beliebig",
        apiName: "ARBITRARY"
    }
  ];

  window.__env.indicatorCreationTypeOptions = [
    {
        displayName: "manuell",
        apiName: "INSERTION"
    },
    {
        displayName: "automatisierte Berechnung durch KomMonitor",
        apiName: "COMPUTATION"
    }
  ];

  window.__env.indicatorUnitOptions = [ "Anzahl", "Anteil", "Prozent", "Einwohner", "m", "m²", "km", "km²", "ha", "dimensionslos", "standardisiert", "z-transformierte Werte"
  ];

  window.__env.indicatorTypeOptions = [
    {
        displayName: "Status-Indikator (absolut)",
        apiName: "STATUS_ABSOLUTE"
    },
    {
        displayName: "Status-Indikator (relativ)",
        apiName: "STATUS_RELATIVE"
    },
    {
        displayName: "Dynamik-Indikator (absolut)",
        apiName: "DYNAMIC_ABSOLUTE"
    },
    {
        displayName: "Dynamik-Indikator (relativ)",
        apiName: "DYNAMIC_RELATIVE"
    },
    {
        displayName: "Status-Indikator (standardisiert)",
        apiName: "STATUS_STANDARDIZED"
    },
    {
        displayName: "Dynamik-Indikator (standardisiert)",
        apiName: "DYNAMIC_STANDARDIZED"
    }
    
  ];

  window.__env.geodataSourceFormats = [
    {
        displayName: "GeoJSON FeatureCollection",
        value: "geojson"
    }
  ];

  window.__env.wmsDatasets = [
    
  ];

  window.__env.wfsDatasets = [    
    // {
    //   title: "Bäckereien",
    //   description: "Standorte von Bäckereien",
    //   url: "https://geoserver.kartenportal.org/geoserver/smartdemography/ows?",
    //   featureTypeNamespace: "smartdemography",
    //   featureTypeName: "sd_baeckerei_p",
    //   featureTypeGeometryName: "the_geom",
    //   geometryType: "POI", // POI|LOI|AOI
    //   poiSymbolColor: "white", // ['white', 'red', 'orange', 'beige', 'green', 'blue', 'purple', 'pink', 'gray', 'black']
    //   poiMarkerColor: "red", // ['white', 'red', 'orange', 'beige', 'green', 'blue', 'purple', 'pink', 'gray', 'black']
    //   poiSymbolBootstrap3Name: "home",
    //   loiColor: "#00aabb",
    //   loiWidth: 3,
    //   loiDashArrayString: "",
    //   aoiColor: "#00aabb",
    //   filterFeaturesToMapBBOX: false,
    //   topicReference: "68f49954-8cb9-4d33-b478-dbad949be0e1"
    // }
  ];



// }(this));
