// (function (window) {
  window.__env = window.__env || {};

  // Whether or not to enable debug mode
  // Setting this to false will disable console output
  window.__env.enableDebug = true;

  window.__env.adminUserName = "Admin";
  window.__env.adminPassword = "kmAdmin";

  // property names of feature id and name (relevant for all spatial features) - KomMonitor specific
  window.__env.FEATURE_ID_PROPERTY_NAME = "ID";
  window.__env.FEATURE_NAME_PROPERTY_NAME = "NAME";
  window.__env.VALID_START_DATE_PROPERTY_NAME = "validStartDate";
  window.__env.VALID_END_DATE_PROPERTY_NAME = "validEndDate";
  window.__env.indicatorDatePrefix = "DATE_";

  // API url
  window.__env.apiUrl = 'https://kommonitor.geoportal.ruhr/datamanagement/management';
  // window.__env.apiUrl = 'http://localhost:8085/';
  // Base url
  window.__env.basePath = '';

  window.__env.targetUrlToProcessingEngine = 'https://kommonitor.geoportal.ruhr/dataprocessing/processing/';
  // window.__env.targetUrlToProcessingEngine = 'http://localhost:8086/processing/script-engine/customizableIndicatorComputation';
  window.__env.targetUrlToReachabilityService_OTP = 'https://kommonitor.geoportal.ruhr/opentripplanner';
// window.__env.targetUrlToReachabilityService_OTP = 'http://localhost:8090/opentripplanner';

  // Open Route Service URL
    // window.__env.apiUrl = 'http://kommonitor.fbg-hsbo.de/openrouteservice';
  window.__env.targetUrlToReachabilityService_ORS = 'https://ors5.fbg-hsbo.de';

  // Data Imporert URL
  window.__env.targetUrlToImporterService = 'https://kommonitor.geoportal.ruhr/importer/';

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
  window.__env.initialLatitude = 51.4386432;
  window.__env.initialLongitude = 7.0115552;
  window.__env.initialZoomLevel = 12;
  // window.__env.minZoomLevel = 11;
  window.__env.minZoomLevel = 5;
  window.__env.maxZoomLevel = 18;

  // starting indicator and spatial unit
  // if faulty values are provided, a random indicator will be displayed
  window.__env.initialIndicatorId = "baad078b-8e91-4999-aa94-0fee5a50cec6";
  window.__env.initialSpatialUnitName = "Stadtteilebene";

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
  window.__env.arrayOfNameSubstringsForHidingIndicators = ["Standardabweichung", "Bevölkerung - ", "Soziale Lage - ", "Soziale Lage (Leitindikator)", "Sterberisiko", "mittlerer Bodenversiegelungsgrad", "Kinder"];
  // window.__env.arrayOfNameSubstringsForHidingIndicators = [];
  
  window.__env.arrayOfNameSubstringsForHidingGeoresources = [];

  // e-mail recipient for feedback mail
  window.__env.feedbackMailRecipient = "thomas.blasche@amt62.essen.de";
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
      title: "Lärmkartierung - Flugverkehr 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
      layerName: "FLG_DEN"
    },
    {
      title: "Lärmkartierung - Flugverkehr Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
      layerName: "FLG_NGT"
    },
    {
      title: "Lärmkartierung - Industrie 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
      layerName: "IND_DEN"
    },
    {
      title: "Lärmkartierung - Industrie Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
      layerName: "IND_NGT"
    },
    {
      title: "Lärmkartierung - Straße 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
      layerName: "STR_DEN"
    },
    {
      title: "Lärmkartierung - Straße Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
      layerName: "STR_NGT"
    },
    {
      title: "Lärmkartierung - Schiene sonstige 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
      layerName: "SCS_DEN"
    },
    {
      title: "Lärmkartierung - Schiene sonstige Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
      layerName: "SCS_NGT"
    },
    {
      title: "Lärmkartierung - Schiene Bund 24h-Pegel LDEN",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
      layerName: "SCB_DEN"
    },
    {
      title: "Lärmkartierung - Schiene Bund Nachtpegel LNight",
      description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Ma&szlig;stabsabh&auml;ngige Darstellung - ggf. zoomen erforderlich</b>",
      url: "https://www.wms.nrw.de/umwelt/laerm?",
      topicReference: "e94c8100-3790-4ddd-b977-fe48b4f93e26",
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
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - 2009 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessDensity_2009/MapServer/WMSServer?",
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - 2012 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_Imperviousness_Density_2012/MapServer/WMSServer?",
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "Imperviousness density 2012 20m"
    },
    {
      title: "Versiegelungsgrad - 2015 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessDensity_2015/MapServer/WMSServer?",
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Ver&auml;nderung 2006-2009 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessChange_06_09/MapServer/WMSServer?",
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Ver&auml;nderung 2009-2012 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessChange_09_12/MapServer/WMSServer?",
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "Imperviousness density change 09-12 20m"
    },
    {
      title: "Versiegelungsgrad - Ver&auml;nderung 2012-2015 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessChange_12_15/MapServer/WMSServer?",
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Klassifizierte Ver&auml;nderung 2006-2009 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessClassifiedChange_06_09/MapServer/WMSServer?",
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Klassifizierte Ver&auml;nderung 2009-2012 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessClassifiedChange_09_12/MapServer/WMSServer?",
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "0"
    },
    {
      title: "Versiegelungsgrad - Klassifizierte Ver&auml;nderung 2012-2015 anhand von Copernicus Satellitendaten - 20m Rasterzellen",
      description: "Mehr Informationen unter <a href='https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness' rel='noopener noreferrer' target='_blank'>https://land.copernicus.eu/pan-european/high-resolution-layers/imperviousness</a>",
      url: "https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessChange_12_15/MapServer/WMSServer?",
      topicReference: "c46ecf8b-3f77-4be6-9ec1-851dc48e3eb8",
      layerName: "0"
    },
    {
      title: "Bodennutzung - Bebauungsplanumringe",
      description: "Umringe der Bebauungspl&auml;ne gem&auml;&szlig; geodaten.metropoleruhr",
      url: "https://geodaten.metropoleruhr/inspire/bodennutzung/metropoleruhr?",
      topicReference: null,
      layerName: "bplan"
    },
    {
      title: "Klimaanpassung",
      description: "Erste Einschätzung der klimatischen Verhältnisse in der Metropole Ruhr anhand vorliegender Geodaten (Flächennutzungskartierung des RVR, Luftbilder, Digitales Geländemodell, städtische Klimaanalysen)",
      url: "http://geodaten.metropoleruhr.de/klima/klimaanpassung?",
      topicReference: "f3808c0e-9207-42f6-a26f-b8dbefa44d86",
      layerName: "OGC:WMS"
    },    
    {
      title: "Höhen (m.ü.NN)",
      description: "Eine ausgeprägte Reliefstruktur kann einen großen Einfluss auf die Belüftung einer Region haben, sei es in Form einer Tallage mit dadurch bedingter Ablenkung der Hauptwindrichtung oder in Form einer insgesamt schlechten Belüftungssituation im Falle einer Kessellage",
      url: "http://geodaten.metropoleruhr.de/klima/klimaanpassung?",
      topicReference: "f3808c0e-9207-42f6-a26f-b8dbefa44d86",
      layerName: "hoehen"
    },  
    {
      title: "Belüftung",
      description: "Die Flächen werden in Abhängigkeit von ihrer Belüftungsfunktion in drei Kategorien eingeteilt (gut, mittel, schlecht belüftet). Schlecht belüftete Räume besitzen ein erhöhtes Immissionspotential, wobei insbesondere die bodennahen Emissionen eine Rolle spielen. Die Einstufung in die Belüftungskategorien gibt Auskunft darüber, wie effektiv warme Luftmassen durch kühlere ersetzt werden bzw. inwieweit Luftschadstoffe verdünnt und abtransportiert werden können. Die Einteilung in diese Kategorien erfolgte anhand der Auswertung der Geländehöhe und der Oberflächenrauhigkeit",
      url: "http://geodaten.metropoleruhr.de/klima/klimaanpassung?",
      topicReference: "f3808c0e-9207-42f6-a26f-b8dbefa44d86",
      layerName: "belueftung"
    },
    {
      title: "Jahresmittel der Windgeschwindigkeit (m/s)",
      description: "Die Ergebnisse zum Windfeld wurden mit Hilfe eines multiplen Regressionsansatzes flächendeckend für das Ruhrgebiet berechnet. Die Abschätzung der mittleren Windgeschwindigkeit [m/s] während nächtlicher Strahlungswetterlagen erfolgte mit dem folgenden Regressionsmodell: Vn = H*0,009222+R12*0,3404-0,386645 mit: vn = Jahresmittel der Windgeschwindigkeit [m/s] H = Geländehöhe über NN [m] R12 = Prozentualer Anteil der Rauhigkeitsklassen 1 und 2 bezogen auf einen Rasterquadrat 500 m [%]",
      url: "http://geodaten.metropoleruhr.de/klima/klimaanpassung?",
      topicReference: "f3808c0e-9207-42f6-a26f-b8dbefa44d86",
      layerName: "windgeschwindigkeit"
    },
    {
      title: "Kaltluftproduktionsflächen > 50 ha",
      description: "Dargestellt werden die Kaltluftproduktionsflächen über 50 ha, gegliedert in die drei Flächentypen Park, Wald und Freiland",
      url: "http://geodaten.metropoleruhr.de/klima/klimaanpassung?",
      topicReference: "f3808c0e-9207-42f6-a26f-b8dbefa44d86",
      layerName: "kaltluftproduktionsflaechen"
    },
    {
      title: "Klimatope",
      description: "Klimatope beschreiben Gebiete mit ähnlichen mikroklimatischen Ausprägungen, bestimmt durch die jeweilige Flächennutzung",
      url: "http://geodaten.metropoleruhr.de/klima/klimaanpassung?",
      topicReference: "f3808c0e-9207-42f6-a26f-b8dbefa44d86",
      layerName: "klimatope"
    }    
  ];

  window.__env.wfsDatasets = [    
    // {
    //   title: "Bäckereien",
    //   description: "Standorte von Bäckereien",
    //   url: "https://geoserver.kartenportal.org/geoserver/smartdemography/ows?",
    //   featureTypeNamespace: "smartdemography",
    //   featureTypeName: "sd_infrastruktur_p",
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
    //   filterEncoding: {
    //     PropertyIsEqualTo: {
    //       propertyName: "beschreibung",
    //       propertyValue: "Bäckerei"
    //     }
    //   },
    //   topicReference: "68f49954-8cb9-4d33-b478-dbad949be0e1"
    // }
  ];



// }(this));
