// (function (window) {
  window.__env = window.__env || {};

  // Whether or not to enable debug mode
  // Setting this to false will disable console output
  window.__env.enableDebug = true;

  // enable/disable role based access using keycloak
  window.__env.enableKeycloakSecurity = false;

  // encrypted data transfer from Data Management API settings
  window.__env.encryption = {
    enabled: false,
    password: "password",
    ivLength_byte: 16
  };

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
  window.__env.apiUrl = 'https://maps2.smartdemography.de/data-management/management';
  // window.__env.apiUrl = 'http://localhost:8085/';
  // Base url for Data Management API
  window.__env.basePath = '';

  // Processing Engine URL
  window.__env.targetUrlToProcessingEngine = 'https://maps2.smartdemography.de/processing';
  // window.__env.targetUrlToProcessingEngine = 'http://localhost:8086/processing/';

  // Open Route Service URL
    // window.__env.apiUrl = 'http://kommonitor.fbg-hsbo.de/openrouteservice';
  window.__env.targetUrlToReachabilityService_ORS = 'https://maps.smartdemography.de/ors';

  // Open Trip Planner URL - currently not integrated
  window.__env.targetUrlToReachabilityService_OTP = 'https://maps2.smartdemography.de/opentripplanner';
  // window.__env.targetUrlToReachabilityService_OTP = 'http://localhost:8090/opentripplanner';

  // Data Imporert URL
  window.__env.targetUrlToImporterService = 'https://maps2.smartdemography.de/data-importer/importer/';

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

  // starting viewpoint parameters and zoom level
  window.__env.initialLatitude = 51.7462374;
  window.__env.initialLongitude = 7.1817236;
  window.__env.initialZoomLevel = 12;
  // window.__env.minZoomLevel = 11;
  window.__env.minZoomLevel = 5;
  window.__env.maxZoomLevel = 18;

  window.__env.baseLayers = [ // baseLayers of instance; first will be set as default starting layer
    // {
    //   name: "",  // display name
    //   url: "", // URL to layer
    //   layerType: "TILE_LAYER", // TILE_LAYER | TILE_LAYER_GRAYSCALE | WMS
    //   layerName_WMS: "", // only relevant for layers of type WMS - multiple layers comma-separated
    //   attributen_html: "", // attribution info displayed at the bottom of the map as HTML string
    //   minZoomLevel: window.__env.minZoomLevel, // min zoom level for this layer (number between 1-20)
    //   maxZoomLevel: window.__env.maxZoomLevel // max zoom level for this layer (number between 1-20, greater than minZoomLevel)
    // },
    {
      name: "Open Street Map - Graustufen", 
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", 
      layerType: "TILE_LAYER_GRAYSCALE", 
      layerName_WMS: "", 
      attributen_html: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors", 
      minZoomLevel: window.__env.minZoomLevel, 
      maxZoomLevel: window.__env.maxZoomLevel 
    },
    {
      name: "Open Street Map - Farbe", 
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      layerType: "TILE_LAYER", 
      layerName_WMS: "", 
      attributen_html: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors", 
      minZoomLevel: window.__env.minZoomLevel, 
      maxZoomLevel: window.__env.maxZoomLevel 
    },    
    {
      name: "RVR Stadtplan - Farbe", 
      url: "https://geodaten.metropoleruhr.de/spw2?", 
      layerType: "WMS", 
      layerName_WMS: "stadtplan_rvr", 
      attributen_html: "Map data © <a href='https://geodaten.metropoleruhr.de'>https://geodaten.metropoleruhr.de</a>", 
      minZoomLevel: window.__env.minZoomLevel, 
      maxZoomLevel: window.__env.maxZoomLevel 
    },
    {
      name: "RVR Stadtplan - Graublau", 
      url: "https://geodaten.metropoleruhr.de/spw2?", 
      layerType: "WMS", 
      layerName_WMS: "spw2_graublau",
      attributen_html: "Map data © <a href='https://geodaten.metropoleruhr.de'>https://geodaten.metropoleruhr.de</a>", 
      minZoomLevel: window.__env.minZoomLevel, 
      maxZoomLevel: window.__env.maxZoomLevel 
    },
    {
      name: "NRW Digitale Topographische Karte", 
      url: "https://www.wms.nrw.de/geobasis/wms_nw_dtk?", 
      layerType: "WMS", 
      layerName_WMS: "nw_dtk_pan", 
      attributen_html: "Map data © <a href='https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/'>Geobasis NRW</a>", 
      minZoomLevel: window.__env.minZoomLevel, 
      maxZoomLevel: window.__env.maxZoomLevel 
    },
    {
      name: "NRW Digitale Orthophotos (Luftbilder)", 
      url: "https://www.wms.nrw.de/geobasis/wms_nw_dop?",
      layerType: "WMS",
      layerName_WMS: "nw_dop_rgb", 
      attributen_html: "Map data © <a href='https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/'>Geobasis NRW</a>", 
      minZoomLevel: window.__env.minZoomLevel, 
      maxZoomLevel: window.__env.maxZoomLevel 
    },
    {
      name: "Stadt Essen - Automatisierte Liegenschaftskarte", 
      url: "https://geo.essen.de/arcgis/services/basemap/Stadtplanpaket_ALK_grau/MapServer/WMSServer?",
      layerType: "WMS", 
      layerName_WMS: "0,1,2,3", 
      attributen_html: "Stadt Essen: Amt f&uumlr Geoinformation, Vermessung und Kataster", 
      minZoomLevel: window.__env.minZoomLevel, 
      maxZoomLevel: window.__env.maxZoomLevel 
    },
    {
      name: "Stadt Essen - Amtliche Basiskarte", 
      url: "https://geo.essen.de/arcgis/services/basemap/Uebersicht_ABK_Stadtgrundkarte/MapServer/WMSServer?", 
      layerType: "WMS", 
      layerName_WMS: "nw_dop_rgb", 
      attributen_html: "Stadt Essen: Amt f&uumlr Geoinformation, Vermessung und Kataster", 
      minZoomLevel: window.__env.minZoomLevel, 
      maxZoomLevel: window.__env.maxZoomLevel 
    }
  ];


  // starting indicator and spatial unit
  // if faulty values are provided, a random indicator will be displayed
  window.__env.initialIndicatorId = "e61762c4-8b11-4631-8dd5-9ae0a5fc6f99";
  window.__env.initialSpatialUnitName = "Stadtteilebene";

 // various color settings
  window.__env.defaultColorForNoDataValues = "rgba(255,255,255,0)";
  window.__env.defaultBorderColorForNoDataValues = "black";
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
  // window.__env.arrayOfNameSubstringsForHidingIndicators = ["Standardabweichung", "Bevölkerung - ", "Soziale Lage - ", "Soziale Lage (Leitindikator)", "Sterberisiko", "mittlerer Bodenversiegelungsgrad"];
  window.__env.arrayOfNameSubstringsForHidingIndicators = [];
  // window.__env.arrayOfNameSubstringsForHidingIndicators = [];
  
  window.__env.arrayOfNameSubstringsForHidingGeoresources = [];

  // e-mail recipient for feedback mail
  window.__env.feedbackMailRecipient = "E.Holtmann@kreis-re.de";
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
    {
      title: "Lärmkartierung",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Maßstabsabhängige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm",
      topicReference: "3af3b65e-4792-4998-8531-54616564b5bc",
      layerName:"laerm"	
    },
    {
      title: "Flächennutzungskartierung",
      description: "Die Flächennutzungskartierung (FNK) dokumentiert die Nutzungen der Siedlungs-, Freiflächen und Wirtschaftsflächen im Verbandsgebiet und ist somit eine wichtiges Monitoringinstrument für die Stadt-, Freiraum- und Regionalplanung sowie der Wirtschaftsförderung.<b>Maßstabsabhängige Darstellung - ggf. zoomen erforderlich</b> ",
      url: "https://geoserver.kartenportal.org/geoserver/regioplaner/ows?",
      topicReference: "c712af89-ff11-40ff-ad84-b3592901e085",
      layerName:"fnk_el"	
    },	
    {
      title: "Flächennutzungsplan",
      description: "Der Flächennutzungsplan (FNP) stellt die beabsichtigte städtebauliche Entwicklung einer Gemeinde für die nächsten 15 bis 20 Jahre dar. Er ist das Ergebnis eines grundsätzlichen politischen sowie fachlichen Planungsprozesses einer Gemeinde.",
      url: "https://geoserver.kartenportal.org/geoserver/regioplaner/ows?",
      topicReference: "c712af89-ff11-40ff-ad84-b3592901e085",
      layerName:"smartd_fnp"	
    },	
    {
      title: "Landesentwicklungsplan NRW",
      description: "Der LEP NRW ist die fachübergreifende, integrierte Konzeption für die räumliche Entwicklung Nordrhein-Westfalens.",
      url: "https://geoserver.kartenportal.org/geoserver/regioplaner/ows?",
      topicReference: "99a41e4d-a8d0-4c5a-83a0-820eb3a6d36d",
      layerName:"karte_lep_nrw_2017_unkomprimiert"	
    },	
    {
      title: "Regionalplan Teilabschnitt Emscher-Lippe",
      description: "In Nordrhein-Westfalen werden für die einzelnen Teilräume Regionalpläne (vormals: Gebietsentwicklungspläne) erstellt, die landesplanerische Vorgaben auf Ebene einer Region konkretisieren.",
      url: "https://geoserver.kartenportal.org/geoserver/regioplaner/ows?",
      topicReference: "99a41e4d-a8d0-4c5a-83a0-820eb3a6d36d",
      layerName:"regionalplanEL"	
    },		
    {
      title: "Unfalldaten 2019",
      description: "Unfalldaten des statistischen Bundesamtes</b>",
      url: "https://www.wms.nrw.de/wms/unfallatlas?",
      topicReference: "7255b83f-feb0-4f01-9dc1-6b355447206d",
      layerName:"Unfallorte_2019" 
    },
    {
      title: "Bodennutzung - Bebauungsplanumringe",
      description: "Umringe der Bebauungspl&auml;ne gem&auml;&szlig; geodaten.metropoleruhr.de",
      url: "https://geodaten.metropoleruhr.de/inspire/bodennutzung/metropoleruhr?",
      topicReference: "c712af89-ff11-40ff-ad84-b3592901e085",
      layerName: "bplan"
    }

  ];

  window.__env.wfsDatasets = [ 
  ];

// }(this));
