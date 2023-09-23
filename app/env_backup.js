const minZoomLevel = 5;
const maxZoomLevel = 18;
export const environment = {
    production: false,
    appTitle: "KomMonitor (Pilotversion)",
    localStoragePrefix: "kommonitor-develop",
    enableDebug: true,
    enableKeycloakSecurity: true,
    keycloakKomMonitorAdminRoleName: "kommonitor-creator",
    isAdvancedMode: true,
    showAdvancedModeSwitch: true,
    encryption: {
        enabled: false,
        password: "password",
        ivLength_byte: 16
    },
    /*
    PROPERTIES used within greetings window (infoModal component)
    to insert custom LOGO by URL with custom width
    and adjust individual information text
    as well as contact information
    */
    customLogoURL: "data:image/pngbase64,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::",
    customLogo_onClickURL: "https://www.hochschule-bochum.de/fbg/forschung-und-entwicklung/kommonitor/",
    customLogoWidth: "35px",
    customGreetingsContact_name: "Christian Danowski-Buhren",
    customGreetingsContact_organisation: "Hochschule Bochum, Fachbereich Geod&auml,sie",
    customGreetingsContact_mail: "christian.danowski-buhren@hs-bochum.de",
    customGreetingsTextInfoMessage: "",
    /*
    PROPERTIES used within special modal (spatialUnitNotification component)
    to show a customizable HTMLText only when user selects a certian spatial unit for any indicator
    */
    enableSpatialUnitNotificationSelection: false,
    enableSpatialUnitNotificationButton: false,
    spatialUnitNotificationSelection: ["Baublockebene"],
    spatialUnitNotificationTitle: "Informationsverlust auf kleinräumigen Ebenen (Bau- und Mittelblock)",
    spatialUnitNotificationMessage: "Alle Daten, die im KomMonitor dargestellt werden, halten die statistische Geheimhaltung ein. Das bedeutet, dass Angaben zu einzelnen Personen nicht offengelegt werden, insbesondere auch, wenn aus aggregierten Werten Rückschlüsse zu Einzelangaben ermöglicht werden. Aus diesem Grund werden Indikatorenwerte, die in einem räumlichen Aggregat eine absolute Fallzahl von < 3 Einwohnern aufweisen, so behandelt, als hätten diese 0 Einwohner.\
  Diese Methode der statistischen Geheimhaltung kann zu einem teilweise hohen Informationsverlust auf kleinräumigen Ebenen führen. Stark differenzierte Indikatoren auf kleinräumigen Ebenen, die insgesamt nur wenige Fallzahlen aufweisen, könnten so an vielen Stellen entsprechend bereinigt worden seien und somit keine validen Werte liefern. \
  Dies lässt sich daran erkennen, dass die Fallzahlen insgesamt niedrig sind und viele Gebiete 0-Werte haben. Eine flächendeckendes Bild ist somit nicht möglich. \
  Dennoch bieten diese Indikatoren trotz ungenauer Wertedie Möglichkeit, „Hot-Spots“ und „Cluster“ der jeweiligen Indikatoren zu ermitteln. \
  Zahlen auf kleinräumige Ebenen sollten vor diesem Hintergrund vorsichtig und sorgfältig interpretiert werden.",
    /*
    PROPERTIES used within extended info  modal (second tab) to show a customizable HTMLText
    */
    enableExtendedInfoModal: false,
    standardInfoModalTabTitle: "Informationen zu KomMonitor",
    extendedInfoModalTabTitle: "Weitere Informationen",
    extendedInfoModalHTMLMessage: "",
    // property names of feature id and name (relevant for all spatial features) - KomMonitor specific
    // DO NOT CHANGE THEM - ONLY IF YOU REALLY KNOW WHAT YOU ARE DOING
    FEATURE_ID_PROPERTY_NAME: "ID",
    FEATURE_NAME_PROPERTY_NAME: "NAME",
    VALID_START_DATE_PROPERTY_NAME: "validStartDate",
    VALID_END_DATE_PROPERTY_NAME: "validEndDate",
    indicatorDatePrefix: "DATE_",
    // Data Management API URL
    // apiUrl : 'http://kommonitor.fbg-hsbo.de/',
    apiUrl: 'http://localhost:8085/',
    // Base url for Data Management API
    basePath: 'management',
    // Processing Engine URL
    targetUrlToProcessingEngine: 'http://localhost:8086/processing/',
    // Open Route Service URL
    targetUrlToReachabilityService_ORS: 'https://ors5.fbg-hsbo.de',
    // Open Trip Planner URL - currently not integrated
    targetUrlToReachabilityService_OTP: 'http://localhost:8090/opentripplanner',
    // Data Imporret URL
    targetUrlToImporterService: 'http://localhost:8087/importer/',
    // KomMonitor Geocoder Proxy
    targetUrlToGeocoderService: 'https://geocoder.fbg-hsbo.de/nominatim/',
    // optional geometry simplification (a feature of Data Management API)
    simplifyGeometriesParameterName: "simplifyGeometries",
    // allowed values and meaning:
    // ["original" --> no simplification, "weak" --> weak simplification,
    // "medium" --> medium simplification, "strong" --> string simplification]
    simplifyGeometriesOptions: [{ "label": "nein", "value": "original" }, { "label": "schwach", "value": "weak" }, { "label": "mittel", "value": "medium" }, { "label": "stark", "value": "strong" }],
    // use strong as default to minimize size of queried features
    // for display, strong simplification is okay
    simplifyGeometries: "original",
    // number of decimals for display of numeric values in app
    numberOfDecimals: 2,
    // starting viewpoint parameters and zoom level
    initialLatitude: 51.4386432,
    initialLongitude: 7.0115552,
    initialZoomLevel: 12,
    // minZoomLevel : 11,
    minZoomLevel: 5,
    maxZoomLevel: 18,
    baseLayers: [
        // {
        //   name: "",  // display name
        //   url: "", // URL to layer
        //   layerType: "TILE_LAYER", // TILE_LAYER | TILE_LAYER_GRAYSCALE | WMS
        //   layerName_WMS: "", // only relevant for layers of type WMS - multiple layers comma-separated
        //   attribution_html: "", // attribution info displayed at the bottom of the map as HTML string
        //   minZoomLevel: minZoomLevel, // min zoom level for this layer (number between 1-20)
        //   maxZoomLevel: maxZoomLevel // max zoom level for this layer (number between 1-20, greater than minZoomLevel)
        // },
        {
            name: "Open Street Map - Graustufen",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            layerType: "TILE_LAYER_GRAYSCALE",
            layerName_WMS: "",
            attribution_html: "Map data © <a href:'http://openstreetmap.org'>OpenStreetMap</a> contributors",
            minZoomLevel: minZoomLevel,
            maxZoomLevel: maxZoomLevel
        },
        {
            name: "Open Street Map - Farbe",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            layerType: "TILE_LAYER",
            layerName_WMS: "",
            attribution_html: "Map data © <a href:'http://openstreetmap.org'>OpenStreetMap</a> contributors",
            minZoomLevel: minZoomLevel,
            maxZoomLevel: maxZoomLevel
        },
        {
            name: "RVR Stadtplan - Farbe",
            url: "https://geodaten.metropoleruhr.de/spw2?",
            layerType: "WMS",
            layerName_WMS: "stadtplan_rvr",
            attribution_html: "Map data © <a href:'https://geodaten.metropoleruhr.de'>https://geodaten.metropoleruhr.de</a>",
            minZoomLevel: minZoomLevel,
            maxZoomLevel: maxZoomLevel
        },
        {
            name: "RVR Stadtplan - Graublau",
            url: "https://geodaten.metropoleruhr.de/spw2?",
            layerType: "WMS",
            layerName_WMS: "spw2_graublau",
            attribution_html: "Map data © <a href:'https://geodaten.metropoleruhr.de'>https://geodaten.metropoleruhr.de</a>",
            minZoomLevel: minZoomLevel,
            maxZoomLevel: maxZoomLevel
        },
        {
            name: "NRW Digitale Topographische Karte",
            url: "https://www.wms.nrw.de/geobasis/wms_nw_dtk?",
            layerType: "WMS",
            layerName_WMS: "nw_dtk_sw",
            attribution_html: "Map data © <a href:'https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/'>Geobasis NRW</a>",
            minZoomLevel: minZoomLevel,
            maxZoomLevel: 20
        },
        {
            name: "NRW Digitale Orthophotos (Luftbilder)",
            url: "https://www.wms.nrw.de/geobasis/wms_nw_dop?",
            layerType: "WMS",
            layerName_WMS: "nw_dop_rgb",
            attribution_html: "Map data © <a href:'https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/'>Geobasis NRW</a>",
            minZoomLevel: minZoomLevel,
            maxZoomLevel: maxZoomLevel
        },
        {
            name: "Stadt Essen - Automatisierte Liegenschaftskarte",
            url: "https://geo.essen.de/arcgis/services/basemap/Stadtplanpaket_ALK_grau/MapServer/WMSServer?",
            layerType: "WMS",
            layerName_WMS: "0,1,2,3",
            attribution_html: "Stadt Essen: Amt f&uumlr Geoinformation, Vermessung und Kataster",
            minZoomLevel: minZoomLevel,
            maxZoomLevel: maxZoomLevel
        },
        {
            name: "Stadt Essen - Amtliche Basiskarte",
            url: "https://geo.essen.de/arcgis/services/basemap/Uebersicht_ABK_Stadtgrundkarte/MapServer/WMSServer?",
            layerType: "WMS",
            layerName_WMS: "nw_dop_rgb",
            attribution_html: "Stadt Essen: Amt f&uumlr Geoinformation, Vermessung und Kataster",
            minZoomLevel: minZoomLevel,
            maxZoomLevel: maxZoomLevel
        }
    ],
    // starting indicator and spatial unit
    // if faulty values are provided, a random indicator will be displayed
    initialIndicatorId: "48a18455-6a52-4e74-bdbf-99237187fc5c",
    initialSpatialUnitName: "Stadtteilebene",
    // various color settings
    defaultColorForNoDataValues: "rgba(255,255,255,0)",
    defaultBorderColorForNoDataValues: "black",
    defaultColorForOutliers_high: "#191919",
    defaultBorderColorForOutliers_high: "black",
    defaultFillOpacityForOutliers_high: "0.7",
    defaultColorForOutliers_low: "#4f4f4f",
    defaultBorderColorForOutliers_low: "black",
    defaultFillOpacityForOutliers_low: "0.7",
    defaultColorForHoveredFeatures: "#e01414",
    defaultColorForClickedFeatures: "#42e5f4",
    defaultColorForZeroValues: "#bababa",
    defaultBorderColor: "black",
    defaultColorForFilteredValues: "rgba(255,255,255,0)",
    defaultBorderColorForFilteredValues: "black",
    defaultFillOpacity: "0.7",
    defaultFillOpacityForFilteredFeatures: "0.7",
    defaultFillOpacityForZeroFeatures: "0.7",
    defaultFillOpacityForNoDataFeatures: "0.7",
    defaultFillOpacityForHighlightedFeatures: "0.8",
    useTransparencyOnIndicator: true,
    useOutlierDetectionOnIndicator: true,
    classifyZeroSeparately: true,
    classifyUsingWholeTimeseries: true,
    useNoDataToggle: false,
    // default color for specific classification as ColorBrewer palette name
    // i.e. balance mode
    // i.e. measure of value classification (German: Schwellwertklassifizierung)
    defaultColorBrewerPaletteForBalanceIncreasingValues: "Purples",
    defaultColorBrewerPaletteForBalanceDecreasingValues: "YlOrBr",
    defaultColorBrewerPaletteForGtMovValues: "YlOrBr",
    defaultColorBrewerPaletteForLtMovValues: "Blues",
    // classification
    //allowesValues: equal_interval, quantile, jenks
    defaultClassifyMethod: "equal_interval",
    // array of indicator name substring that shal be used to filter out / hide certain indicators by their name
    // e.g. set ["entwicklung"] to hide all indicators whose name contains the substring "entwicklung"
    arrayOfNameSubstringsForHidingIndicators: [],
    // window.__env.arrayOfNameSubstringsForHidingIndicators = [];
    arrayOfNameSubstringsForHidingGeoresources: [],
    // e-mail recipient for feedback mail
    feedbackMailRecipient: "christian.danowski-buhren@hochschule-bochum.de",
    // window.__env.feedbackMailRecipient = "christian.danowski-buhren@hs-bochum.de";
    // config array of available options for choosing update interval of indicators
    updateIntervalOptions: [
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
    ],
    // config array of available options for choosing creation type of indicators
    indicatorCreationTypeOptions: [
        {
            displayName: "manuell",
            apiName: "INSERTION"
        },
        {
            displayName: "automatisierte Berechnung durch KomMonitor",
            apiName: "COMPUTATION"
        }
    ],
    // config array of available options for choosing indicator's unit
    indicatorUnitOptions: ["Anzahl", "Anteil", "Prozent", "Einwohner", "m", "m²", "km", "km²", "ha", "dimensionslos", "standardisiert", "z-transformierte Werte"
    ],
    // config array of available options for choosing indicator type of indicators
    indicatorTypeOptions: [
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
    ],
    // array of available WMS datasets
    wmsDatasets: [
        // {
        //   title: "Title of WMS dataset",
        //   description: "Description as HTML code (HTML tags allowed)",
        //   url: "URL including '?' as last character (i.e. https://wms.example/myWMS)",
        //   topicReference: "3af3b65e-4792-4998-8531-54616564b5bc", // id of georesource topic to hang in the WMS entry 
        //   layerName:"laerm"	// name of WMS layer to display
        // },
        {
            title: "Lärmkartierung - Test",
            description: "Veröffentlichung der Lärmkarten gemäß Lärmkartierung nach Richtlinie 2002/49/EG - EU-Umgebungslärmrichtlinie <br/><br/><b>Maßstabsabhängige Darstellung - ggf. zoomen erforderlich</b>",
            url: "https://www.wms.nrw.de/umwelt/laerm?",
            topicReference: "3af3b65e-4792-4998-8531-54616564b5bc",
            layerName: "laerm"
        },
        {
            title: "Unfalldaten 2019",
            description: "Unfalldaten des statistischen Bundesamtes</b>",
            url: "https://www.wms.nrw.de/wms/unfallatlas?",
            topicReference: "7255b83f-feb0-4f01-9dc1-6b355447206d",
            layerName: "Unfallorte_2019"
        },
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
            description: "Umringe der Bebauungspl&auml;ne gem&auml;&szlig; geodaten.metropoleruhr.de",
            url: "https://geodaten.metropoleruhr.de/inspire/bodennutzung/metropoleruhr?",
            topicReference: null,
            layerName: "bplan"
        }
    ],
    // array if available WFS datasets
    wfsDatasets: [
        // {
        //   title: "Title of dataset",
        //   description: "Description as HTML code (HTML tags allowed)",
        //   url: "URL of dataset including '?' as last character (i.e. https://wfs.example/myWfS?)",
        //   featureTypeNamespace: "namespace of featureType",
        //   featureTypeName: "name of featureType",  // // check GetCapabilities Response
        //   featureTypeGeometryName: "name of geometry property of feature type", // check DescribeFeature Response
        //   geometryType: "AOI", // POI|LOI|AOI
        //   poiSymbolColor: "white", // ['white', 'red', 'orange', 'beige', 'green', 'blue', 'purple', 'pink', 'gray', 'black']
        //   poiMarkerColor: "red", // ['white', 'red', 'orange', 'beige', 'green', 'blue', 'purple', 'pink', 'gray', 'black']
        //   poiSymbolBootstrap3Name: "home",
        //   loiColor: "#00aabb", // color for LOI datasets
        //   loiWidth: 3, // 1 - 5
        //   loiDashArrayString: "", // e.g. "20, 20" for equal dash/space visuals
        //   aoiColor: "#00aabb", // color for AOI datasets
        //   filterFeaturesToMapBBOX: false, // applies BBOX filter to WFS request - if not supported by WFS may lead to error
        //   filterEncoding: { // only one filter is currently implemented (PropertyIsEqualTo)
        //     // PropertyIsEqualTo: {
        //     //   propertyName: undefined,  // name of property
        //     //   propertyValue: undefined  // value of property
        //   // }
        //   },
        //   topicReference: "c712af89-ff11-40ff-ad84-b3592901e085"  // id of georesource topic entry which shall be used to display the WFS dataset entry 
        // },
        {
            title: "Bodennutzung - Bebauungsplanumringe",
            description: "Umringe der Bebauungspl&auml;ne gem&auml;&szlig; geodaten.metropoleruhr.de. <b>WFS-Dienst unterst&uuml;tzt keine r&auml;umllichen Filter. Daher m&uuml;ssen zwingend alle Features abgerufen werden</b>.",
            url: "https://geodaten.metropoleruhr.de/inspire/bodennutzung/metropoleruhr?",
            featureTypeNamespace: "ms",
            featureTypeName: "bplan_stand",
            featureTypeGeometryName: "geom",
            geometryType: "AOI",
            poiSymbolColor: "white",
            poiMarkerColor: "red",
            poiSymbolBootstrap3Name: "home",
            loiColor: "#00aabb",
            loiWidth: 3,
            loiDashArrayString: "",
            aoiColor: "#00aabb",
            filterFeaturesToMapBBOX: false,
            filterEncoding: {
            // PropertyIsEqualTo: {
            //   propertyName: undefined,
            //   propertyValue: undefined
            // }
            },
            topicReference: "c712af89-ff11-40ff-ad84-b3592901e085"
        }
    ],
};
//# sourceMappingURL=env_backup.js.map