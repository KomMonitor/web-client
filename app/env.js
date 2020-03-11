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
  window.__env.apiUrl = 'http://kommonitor-re.fbg-hsbo.de/';
  // window.__env.apiUrl = 'http://localhost:8085/';
  // Base url for Data Management API
  window.__env.basePath = 'management';

  // Processing Engine URL
  window.__env.targetUrlToProcessingEngine = 'http://kommonitor-re.fbg-hsbo.de/processing';
  // window.__env.targetUrlToProcessingEngine = 'http://localhost:8086/processing/';

  // Open Route Service URL
    // window.__env.apiUrl = 'http://kommonitor.fbg-hsbo.de/openrouteservice';
  window.__env.targetUrlToReachabilityService_ORS = 'https://ors5.fbg-hsbo.de';

  // Open Trip Planner URL - currently not integrated
  window.__env.targetUrlToReachabilityService_OTP = 'http://kommonitor-re.fbg-hsbo.de/opentripplanner';
  // window.__env.targetUrlToReachabilityService_OTP = 'http://localhost:8090/opentripplanner';

  // Data Imporert URL
  window.__env.targetUrlToImporterService = 'http://localhost:8087/';

  // optional geometry simplification (a feature of Data Management API)
  window.__env.simplifyGeometriesParameterName = "simplifyGeometries";
  // allowed values and meaning:
  // ["original" --> no simplification; "weak" --> weak simplification,
  // "medium" --> medium simplification; "strong" --> string simplification]
  window.__env.simplifyGeometriesOptions = [{"label": "nein", "value": "original"}, {"label": "schwach", "value": "weak"}, {"label": "mittel", "value": "medium"}, {"label": "stark", "value": "strong"}];
  // use strong as default to minimize size of queried features
  // for display, strong simplification is okay
  window.__env.simplifyGeometries = "strong";

  // number of decimals for display of numeric values in app
  window.__env.numberOfDecimals = 2;

  // starting viewpoint parameters and zoom level
  window.__env.initialLatitude = 51.7462374;
  window.__env.initialLongitude = 7.1817236;
  window.__env.initialZoomLevel = 12;
  // window.__env.minZoomLevel = 11;
  window.__env.minZoomLevel = 5;
  window.__env.maxZoomLevel = 18;

  // starting indicator and spatial unit
  // if faulty values are provided, a random indicator will be displayed
  window.__env.initialIndicatorId = "e61762c4-8b11-4631-8dd5-9ae0a5fc6f99";
  window.__env.initialSpatialUnitName = "Stadtteilebene";

 // various color settings
  window.__env.defaultColorForNoDataValues = "black";
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
      title: "Lärmkartierung - Flugverkehr 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "FLG_DEN"
    },
    {
      title: "Lärmkartierung - Flugverkehr Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "FLG_NGT"
    },
    {
      title: "Lärmkartierung - Industrie 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "IND_DEN"
    },
    {
      title: "Lärmkartierung - Industrie Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "IND_NGT"
    },
    {
      title: "Lärmkartierung - Straße 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "STR_DEN"
    },
    {
      title: "Lärmkartierung - Straße Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "STR_NGT"
    },
    {
      title: "Lärmkartierung - Schiene sonstige 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "SCS_DEN"
    },
    {
      title: "Lärmkartierung - Schiene sonstige Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "SCS_NGT"
    },
    {
      title: "Lärmkartierung - Schiene Bund 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "SCB_DEN"
    },
    {
      title: "Lärmkartierung - Schiene Bund Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      layerName: "SCB_NGT"
    },
    // {
    //   title: "Lärmkartierung - Gebaeude",
    //   description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
    //   url: "https://www.wms.nrw.de/umwelt/laerm?",
    //   layerName: "Gebaeude"
    // },
    // {
    //   title: "Lärmkartierung - Modell",
    //   description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
    //   url: "https://www.wms.nrw.de/umwelt/laerm?",
    //   layerName: "Modell"
    // },
    {
      title: "Versiegelungsgrad - 2006 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessDensity_2006/MapServer/WMSServer?",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - 2009 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessDensity_2009/MapServer/WMSServer?",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - 2012 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_Imperviousness_Density_2012/MapServer/WMSServer?",
      layerName: "Imperviousness density 2012 20m"
    },
    {
      title: "Versiegelungsgrad - 2015 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessDensity_2015/MapServer/WMSServer?",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Ver&auml;nderung 2006-2009 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessChange_06_09/MapServer/WMSServer?",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Ver&auml;nderung 2009-2012 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessChange_09_12/MapServer/WMSServer?",
      layerName: "Imperviousness density change 09-12 20m"
    },
    {
      title: "Versiegelungsgrad - Ver&auml;nderung 2012-2015 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessChange_12_15/MapServer/WMSServer?",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Klassifizierte Ver&auml;nderung 2006-2009 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessClassifiedChange_06_09/MapServer/WMSServer?",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Klassifizierte Ver&auml;nderung 2009-2012 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessClassifiedChange_09_12/MapServer/WMSServer?",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Klassifizierte Ver&auml;nderung 2012-2015 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessChange_12_15/MapServer/WMSServer?",
      layerName: "0"
    },
    {
      title: "Bodennutzung - Bebauungsplanumringe",
      description: "Umringe der Bebauungspl&auml;ne gem&auml;&szlig; geodaten.metropoleruhr.de",
      url: "https://geodaten.metropoleruhr.de/inspire/bodennutzung/metropoleruhr?",
      layerName: "bplan"
    }
  ];

  window.__env.wfsDatasets = [
    {
      title: "Bodennutzung - Bebauungsplanumringe",
      description: "Umringe der Bebauungspl&auml;ne gem&auml;&szlig; geodaten.metropoleruhr.de. <b>WFS-Dienst unterst&uuml;tzt keine r&auml;umllichen Filter. Daher m&uuml;ssen zwingend alle Features abgerufen werden</b>.",
      url: "https://geodaten.metropoleruhr.de/inspire/bodennutzung/metropoleruhr?",
      featureTypeNamespace: "ms",
      featureTypeName: "bplan_stand",
      featureTypeGeometryName: "geom",
      displayColor: "#00aabb",
      filterFeaturesToMapBBOX: false
    }
    // {
    //   title: "Verwaltungsgrenzen Kreise und kreisfreie St&auml;dte",
    //   description: "Verwaltungsgrenzen gem&auml;ß Bezirksregierung K&ouml;ln",
    //   url: "https://www.wfs.nrw.de/geobasis/wfs_nw_dvg?",
    //   featureTypeNamespace: "dvg",
    //   featureTypeName: "nw_dvg1_gem",
    //   featureTypeGeometryName: "msGeometry",
    //   displayColor: "#00aabb",
    //   filterFeaturesToMapBBOX: true
    // },
    // {
    //   title: "Freizeitkataster",
    //   description: "Freizeitkataster gem&auml;ß Bezirksregierung K&ouml;ln",
    //   url: "https://www.wfs.nrw.de/geobasis/wfs_nw_fzk?",
    //   featureTypeNamespace: "fzk",
    //   featureTypeName: "POI_p",
    //   featureTypeGeometryName: "msGeometry",
    //   displayColor: null,
    //   filterFeaturesToMapBBOX: true
    // }
  ];

// }(this));
