import { Inject, Injectable } from '@angular/core';
import { IndicatorsDataset, IndicatorsTopicsHierarchy } from 'components/ngComponents/models/indicators.models';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import autoTable from 'jspdf-autotable';
import domtoimage from 'dom-to-image-more';
import { forkJoin } from 'rxjs';
import { AuthService } from 'services/auth-service/auth.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GlobalFilterHelperService } from 'services/global-filter-helper-service/global-filter-helper.service';
import { WmsResourceType, WmsDataset } from 'components/ngComponents/models/services.models';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

export interface DataExchange {
  customGreetingsContact_mail: string;
  customGreetingsContact_name: string;
  customGreetingsContact_organisation: string;
  customGreetingsTextInfoMessage: string;
  selectedIndicator: IndicatorsDataset;
  availableSpatialUnits: SpatialUnit[];
  selectedDate: any;
  selectedSpatialUnit: SpatialUnit;
  disableIndicatorDatePicker: boolean;
  isBalanceChecked: boolean;
  indicatorAndMetadataAsBalance: any;
  indicatorDatePrefix: string;
  measureOfValue: any;
  isMeasureOfValueChecked: any;
  useOutlierDetectionOnIndicator: any;
  classifyZeroSeparately: any;
  allFeaturesRegionalMean: any;
  enableMeanDataDisplayInLegend: any;
  labelMean_regional: any;
  labelMean: any;
  allFeaturesMean: any;
  configMeanDataDisplay: any;
  wmsDatasets_keywordFiltered: any;
  labelAllFeatures: any;
  labelFilteredFeatures: any;
  labelSelectedFeatures: any;
  labelNumberOfFeatures: any;
  allFeaturesNumberOfFeatures: any;
  selectedFeaturesNumberOfFeatures: any;
  labelSum: any;
  allFeaturesSum: any;
  labelSum_regional: any;
  allFeaturesRegionalSum: any;
  selectedFeaturesSum: any;
  selectedFeaturesMean: any;
  labelMin: any;
  labelMax: any;
  allFeaturesMin: any;
  selectedFeaturesMin: any;
  allFeaturesMax: any;
  selectedFeaturesMax: any;
  labelSpatiallyUnassignable_regional: any;
  allFeaturesRegionalSpatiallyUnassignable: any;
  classifyUsingWholeTimeseries: any;
  useNoDataToggle: any;
  topicIndicatorHierarchy: IndicatorsTopicsHierarchy[];
  selectedIndicatorBackup: IndicatorsDataset;
  displayableIndicators: any;
  wmsUrlForSelectedIndicator: any;
  wfsUrlForSelectedIndicator: any;
  headlineIndicatorHierarchy: any;
  displayableIndicators_keywordFiltered: any;
  POISizes: any;
  topicGeoresourceHierarchy: any;
  showGeoresourceExportButtons: any;
  displayableGeoresources_keywordFiltered: any; 
  wfsDatasets: any;
  wmsLegendImage: any;
  topicGeoresourceHierarchy_unmappedEntries: any;
  displayableGeoresources_keywordFiltered_forAlphabeticalDisplay: any;
  selectedPOISize: any;
  rangeFilterData: any;
  classifyZeroSeparately_backup: any;
  simplifyGeometriesParameterName:any;
  simplifyGeometries:any;
  enableBilanceTrend: any;
  showBarChartLabel:any;
  showBarChartAverageLine:any; 
  appTitle: string;
  customLogo_onClickURL: any;
  customLogoURL: any;
  customLogoWidth: any;
  currentKeycloakUser: KeycloakUser;
  keycloakTokenExpirationInfo: any;
  enableKeycloakSecurity: any;
  currentKomMonitorLoginRoleNames:any;
  currentKeycloakLoginGroups: any;
  currentKeycloakLoginRoles: any;
  showDiagramExportButtons:any;
  computationIndicatorHierarchy:any[];
  rankingChartAverageLabel:any;
  rankingChartRegionalReferenceValueLabel:any;
  FEATURE_NAME_PROPERTY_NAME:any;
  availableGeoresources:any;
  availableIndicators:any;
  reachabilityScenarioOnMainMap: any;
  isochroneLegend: any;
  displayableGeoresources:any;
  adminUserName;
  adminPassword;
  adminIsLoggedIn;
  loginInfoText:any;
  customLandingPage: boolean;
  wmsDatasets:any;
  rangeFilterIsApplied:any;
  baseLayerDefinitionsArray: any[];
}

export interface KeycloakUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SpatialUnit {
  spatialUnitLevel: string;
  spatialUnitId: any;
  isOutlineLayer: any;
  outlineColor: any;
  outlineWidth: any;
  outlineDashArrayString: any;
  permissions: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataExchangeService {

  // todo delete pipedData etc
  pipedData = this;

  appTitle = window.__env.appTitle;
  loginInfoText = window.__env.loginInfoText;
  customLandingPage = window.__env.customLandingPage;

  customLogoURL = window.__env.customLogoURL;
  customLogo_onClickURL = window.__env.customLogo_onClickURL;
  customLogoWidth = window.__env.customLogoWidth; 
  customGreetingsContact_name = window.__env.customGreetingsContact_name;
  customGreetingsContact_organisation = window.__env.customGreetingsContact_organisation;
  customGreetingsContact_mail = window.__env.customGreetingsContact_mail;
  customGreetingsTextInfoMessage = window.__env.customGreetingsTextInfoMessage; // maybe undefined or empty string

  showDiagramExportButtons = true;
  showGeoresourceExportButtons = true;
  showBarChartLabel = window.__env.showBarChartLabel;
  showBarChartAverageLine = window.__env.showBarChartAverageLine;

  customReportFontSize = window.__env.customReportFontSize;

  enableMeanDataDisplayInLegend = window.__env.enableMeanDataDisplayInLegend;
  configMeanDataDisplay = window.__env.configMeanDataDisplay || 'both';
  
  defaultNumberOfDecimals = window.__env.numberOfDecimals;
  DATE_PREFIX = window.__env.indicatorDatePrefix;
  defaultColorForZeroValues = window.__env.defaultColorForZeroValues;
  defaultColorForNoDataValues = window.__env.defaultColorForNoDataValues;
  defaultColorForFilteredValues = window.__env.defaultColorForFilteredValues;

  defaultColorForOutliers_high = window.__env.defaultColorForOutliers_high;
  defaultBorderColorForOutliers_high = window.__env.defaultBorderColorForOutliers_high;
  defaultFillOpacityForOutliers_high = window.__env.defaultFillOpacityForOutliers_high;
  defaultColorForOutliers_low = window.__env.defaultColorForOutliers_low;
  defaultBorderColorForOutliers_low = window.__env.defaultBorderColorForOutliers_low;
  defaultFillOpacityForOutliers_low = window.__env.defaultFillOpacityForOutliers_low; 

  selectedIndicator!: IndicatorsDataset;
  availableSpatialUnits!: SpatialUnit[];
  availableWmsDatasets: WmsDataset[] = [];
  selectedDate: any;
  selectedSpatialUnit!: SpatialUnit;
  disableIndicatorDatePicker!: boolean;
  isBalanceChecked!: boolean;
  indicatorAndMetadataAsBalance: any;
  indicatorDatePrefix!: string;
  measureOfValue: any;
  isMeasureOfValueChecked: boolean = false;
  allFeaturesRegionalMean: any;
  allFeaturesMean: any;

  labelAllFeatures = "alle Raumeinheiten";
  labelFilteredFeatures = "gefilterte Raumeinheiten";
  labelSelectedFeatures = "selektierte Raumeinheiten";
  labelNumberOfFeatures = "Anzahl:"
  labelSum = "rechnerische Summe:"
  labelMean = "rechnerisches arith. Mittel:"
  labelSum_regional = "gesamtregionale Vergleichssumme:"
  labelSpatiallyUnassignable_regional = "räumlich nicht zuordenbare:"
  labelMean_regional = "gesamtregionaler Vergleichsmittelwert:"
  labelMin = "Minimalwert:"
  labelMax = "Maximalwert"

  allFeaturesNumberOfFeatures: any;
  selectedFeaturesNumberOfFeatures: any;
  allFeaturesSum: any;
  allFeaturesRegionalSum: any;
  selectedFeaturesSum: any;
  selectedFeaturesMean: any;
  allFeaturesMin: any;
  selectedFeaturesMin: any;
  allFeaturesMax: any;
  selectedFeaturesMax: any;
  allFeaturesRegionalSpatiallyUnassignable: any;
  selectedIndicatorBackup!: IndicatorsDataset;
  displayableIndicators: any;
  wmsUrlForSelectedIndicator: any;
  wfsUrlForSelectedIndicator: any;
  displayableIndicators_keywordFiltered: any;
  displayableGeoresources_keywordFiltered: any;
  wmsLegendImage: any;
  displayableGeoresources_keywordFiltered_forAlphabeticalDisplay: any = {};
  rangeFilterData: any;
  classifyZeroSeparately_backup: any;
  simplifyGeometriesParameterName:any;
  simplifyGeometries:any;
  keycloakTokenExpirationInfo: any;
  FEATURE_NAME_PROPERTY_NAME:any;
  availableGeoresources!:GeoresourcesDataset[];
  availableIndicators:any;
  reachabilityScenarioOnMainMap: any;
  isochroneLegend: any = false;
  displayableGeoresources:any;
  adminUserName;
  adminPassword;
  adminIsLoggedIn;
  rangeFilterIsApplied:any;
  baseLayerDefinitionsArray!: any[];
  
  errorMessage = undefined;

  isRealmAdmin:boolean = false;
  currentKeycloakLoginGroupNames:any;

  // todo topics hirarchy interface ?!
	availableTopics:any[] = [];

  updateInterval = new Map([
    ["ARBITRARY", "beliebig"],
    ["YEARLY", "jährlich"],
    ["HALF_YEARLY", "halbjährig"],
    ["MONTHLY", "monatlich"],
    ["QUARTERLY", "vierteljährlich"]
  ]);

  updateIntervalOptions = window.__env.updateIntervalOptions;
  indicatorTypeOptions = window.__env.indicatorTypeOptions;
  indicatorUnitOptions = window.__env.indicatorUnitOptions.sort();
  indicatorCreationTypeOptions = window.__env.indicatorCreationTypeOptions;
  geodataSourceFormats = window.__env.geodataSourceFormats;

  anySideBarIsShown = false;

  tmpIndicatorGeoJSON = undefined;

  baseUrlToKomMonitorDataAPI = window.__env.apiUrl + window.__env.basePath;
  simplifyGeometriesOptions = window.__env.simplifyGeometriesOptions;

  baseUrlToRealTimeData = 'http://localhost:8085/timeseries-management';

  wmsDatasets!:WmsDataset[];
  wfsDatasets = window.__env.wfsDatasets.sort((a, b) => (a.title > b.title) ? 1 : -1);
  wmsDatasets_keywordFiltered!:WmsDataset[];
  wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));

  allFeaturesPropertyUnit;

  fileDatasets:any[] = [];

  availablePermissions:any[] = [];
  availableUsers:any[] = [];
  availableProcessScripts:any[] = [];

  availableIndicators_map = new Map();
  availableGeoresources_map = new Map();
  availableSpatialUnits_map = new Map();
  availableProcessScripts_map = new Map();

  accessControl:any[] = [];
  accessControl_map = new Map();

  allowedAccessControl = [];
  allowedAccessControl_map = new Map();

  useOutlierDetectionOnIndicator = window.__env.useOutlierDetectionOnIndicator;
  classifyZeroSeparately = window.__env.classifyZeroSeparately;
  classifyUsingWholeTimeseries = window.__env.classifyUsingWholeTimeseries;
  useNoDataToggle = window.__env.useNoDataToggle;
  
  topicIndicatorHierarchy_forOrderView:any[] = [];

  /* reportingDefaultTemplatePageElements = [
  {
    "type": "indicatorTitle-landscape",
    "dimensions": {
      "top": "15px",
      "left": "15px",
      "width": "720px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Titel des Indikators [Einheit]",
    "text": "",
    "css": "text-align: left; padding-left: 5px; font-weight: bold;"
  },
  {
    "type": "indicatorTitle-portrait",
    "dimensions": {
      "top": "15px",
      "left": "15px",
      "width": "470px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Titel des Indikators [Einheit]",
    "text": "",
    "css": "text-align: left; padding-left: 5px; font-weight: bold;"
  },
  {
    "type": "dataTimestamp-landscape",
    "dimensions": {
      "top": "50px",
      "left": "15px",
      "width": "720px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Datenstand",
    "text": "",
    "css": "text-align: left; padding-left: 5px;"
  },
  {
    "type": "dataTimestamp-portrait",
    "dimensions": {
      "top": "50px",
      "left": "15px",
      "width": "470px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Datenstand",
    "text": "",
    "css": "text-align: left; padding-left: 5px;"
  },
  {
    "type": "dataTimeseries-landscape",
    "dimensions": {
      "top": "50px",
      "left": "15px",
      "width": "720px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Zeitreihe von - bis",
    "text": "",
    "css": "text-align: left; padding-left: 5px;"
  },
  {
    "type": "dataTimeseries-portrait",
    "dimensions": {
      "top": "50px",
      "left": "15px",
      "width": "470px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Zeitreihe von - bis",
    "text": "",
    "css": "text-align: left; padding-left: 5px;"
  },
  {
    "type": "reachability-subtitle-landscape",
    "dimensions": {
      "top": "50px",
      "left": "15px",
      "width": "720px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Aktueller Datenstand, Fortbewegungsmittel, [Indikator]",
    "text": "",
    "css": "text-align: left; padding-left: 5px;"
  },
  {
    "type": "reachability-subtitle-portrait",
    "dimensions": {
      "top": "50px",
      "left": "15px",
      "width": "470px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Aktueller Datenstand, Fortbewegungsmittel, [Indikator]",
    "text": "",
    "css": "text-align: left; padding-left: 5px;"
  },
  {
    "type": "communeLogo-landscape",
    "dimensions": {
      "top": "15px",
      "left": "740px",
      "width": "75px",
      "height": "65px"
    },
    "isPlaceholder": true,
    "placeholderText": "Logo",
    "src": ""
  },
  {
    "type": "communeLogo-portrait",
    "dimensions": {
      "top": "15px",
      "left": "490px",
      "width": "75px",
      "height": "65px"
    },
    "isPlaceholder": true,
    "placeholderText": "Logo",
    "src": ""
  },
  {
    "type": "footerHorizontalSpacer-landscape",
    "dimensions": {
      "top": "535px",
      "left": "15px",
      "width": "800px",
      "height": "0px"
    },
    "css": "border-top: solid rgb(148, 148, 148) 1px;"
  },
  {
    "type": "footerHorizontalSpacer-portrait",
    "dimensions": {
      "top": "750px",
      "left": "15px",
      "width": "550px",
      "height": "0px"
    },
    "css": "border-top: solid rgb(148, 148, 148) 1px;"
  },

  {
    "type": "footerCreationInfo-landscape",
    "dimensions": {
      "top": "545px",
      "left": "15px",
      "width": "720px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Erstellt am [Datum] von [Name d. Bearbeiters], [Name d. Kommune]",
    "css": "text-align: left; padding-left: 5px;"
  },
  {
    "type": "footerCreationInfo-portrait",
    "dimensions": {
      "top": "760px",
      "left": "15px",
      "width": "470px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "Erstellt am [Datum] von [Name d. Bearbeiters], [Name d. Kommune]",
    "css": "text-align: left; padding-left: 5px;"
  },
  {
    "type": "pageNumber-landscape",
    "dimensions": {
      "top": "545px",
      "left": "740px",
      "width": "75px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "[Seitenzahl]",
    "css": "text-align: right; padding-right: 5px;"
  },
  {
    "type": "pageNumber-portrait",
    "dimensions": {
      "top": "760px",
      "left": "490px",
      "width": "75px",
      "height": "30px"
    },
    "isPlaceholder": true,
    "placeholderText": "[Seitenzahl]",
    "css": "text-align: right; padding-right: 5px;"
  },
]; */

  POISizes = [{
    id: 0,
    label: 'sehr klein',
    iconClassName: 'vector-marker-icon-extra-small',
    scaleFactor: 0.4
  }, {
    id: 1,
    label: 'klein',
    iconClassName: 'vector-marker-icon-small',
    scaleFactor: 0.6
  }, {
    id: 2,
    label: 'mittel',
    iconClassName: 'vector-marker-icon-middlesized',
    scaleFactor: 0.75
  }, {
    id: 3,
    label: 'groß',
    iconClassName: '',
    scaleFactor: 1
  }];

  availableLoiDashArrayObjects = [
    {
      "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black"/></svg>',
      "dashArrayValue" : ""
    },
    {
      "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20"/></svg>',
      "dashArrayValue" : "20"
    },
    {
      "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10"/></svg>',
      "dashArrayValue" : "20 10"
    },
    {
      "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10 5 10"/></svg>',
      "dashArrayValue" : "20 10 5 10"
    },
    {
      "svgString" : '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="5"/></svg>',
      "dashArrayValue" : "5"
    }
  ];

  availablePoiMarkerColors = [
    {
      "colorName" : "red",
      "colorValue" : "rgb(205,59,40)"
    },
    {
      "colorName" : "white",
      "colorValue" : "rgb(255,255,255)"
    },
    {
      "colorName" : "orange",
      "colorValue" : "rgb(235,144,46)"
    },
    {
      "colorName" : "beige",
      "colorValue" : "rgb(255,198,138)"
    },
    {
      "colorName" : "green",
      "colorValue" : "rgb(108,166,36)"
    },
    {
      "colorName" : "blue",
      "colorValue" : "rgb(53,161,209)"
    },
    {
      "colorName" : "purple",
      "colorValue" : "rgb(198,77,175)"
    },
    {
      "colorName" : "pink",
      "colorValue" : "rgb(255,138,232)"
    },
    {
      "colorName" : "gray",
      "colorValue" : "rgb(163,163,163)"
    },
    {
      "colorName" : "black",
      "colorValue" : "rgb(47,47,47)"
    }
  ];
  selectedPOISize = this.POISizes[2];

  datePickerOptions = {
    autoclose: true,
    language: 'de',
    format: 'yyyy-mm-dd'
  };

  rankingChartAverageLabel = "rechnerisches arithmetisches Mittel";
  rankingChartRegionalReferenceValueLabel = "gesamtregionaler Vergleichsdurchschnitt";

  headlineIndicatorHierarchy:any[] = [];
  computationIndicatorHierarchy:any[] = [];
  topicIndicatorHierarchy:IndicatorsTopicsHierarchy[] = [];

  topicGeoresourceHierarchy = [];
  topicGeoresourceHierarchy_unmappedEntries:any = {};
  georesourceMapKey_forUnmappedTopicReferences = "unmapped";

  enableKeycloakSecurity = window.__env.enableKeycloakSecurity;
  currentKeycloakLoginRoles:any[] = [];
  currentKomMonitorLoginRoleNames:any[] = [];
  currentKeycloakLoginGroups:any[] = [];
  currentKomMonitorLoginOrganizationalUnits:any[] = [];
  currentKeycloakUser!:KeycloakUser;

  enableScatterPlotRegression = window.__env.enableScatterPlotRegression;
  enableBilanceTrend = window.__env.enableBilanceTrend;

  availableRoles:any[] = [];

  public constructor(
    private authService: AuthService,
    private cacheHelperService: CacheHelperServiceService,
    private broadcastService: BroadcastService,
    private globalFilterService: GlobalFilterHelperService
  ) {}

  hideErrorAlert(){
    $(".mapApplicationErrorAlert").hide();
  }

  isAllowedSpatialUnitForCurrentIndicator(spatialUnitMetadata:any) {

    if(!this.selectedIndicator){
      return false;
    }

    if(! spatialUnitMetadata || ! spatialUnitMetadata.spatialUnitLevel){
      return false;
    }

    var filteredApplicableUnits = this.selectedIndicator.applicableSpatialUnits.filter(function (applicableSpatialUnit:any) {
      if (applicableSpatialUnit.spatialUnitId ===  spatialUnitMetadata.spatialUnitId){
        return true;
      }
      else{
        return false;
      }
    });
   
    return filteredApplicableUnits.length > 0;
  }

  async fetchAllMetadata(filter = undefined){

    await this.cacheHelperService.init();
    console.log("fetching all metadata from management component");

    if (this.authService.Auth.keycloak.authenticated){
      await this.authService.Auth.keycloak.loadUserProfile()
      .then((profile) => {
        // set user profile
        this.currentKeycloakUser = profile;
        console.log("User logged in with email: " + profile.email);

        if(this.authService.Auth.keycloak.tokenParsed && this.authService.Auth.keycloak.tokenParsed.realm_access && this.authService.Auth.keycloak.tokenParsed.realm_access.roles){
          this.currentKeycloakLoginRoles = this.authService.Auth.keycloak.tokenParsed.realm_access.roles;
          if (this.currentKeycloakLoginRoles.includes(window.__env.keycloakKomMonitorAdminRoleName)) {
            this.isRealmAdmin = true;
            // this.currentKeycloakLoginRoles = this.currentKeycloakLoginRoles.concat(Auth.keycloak.tokenParsed.resource_access["realm-management"].roles);
          }
          if (this.authService.Auth.keycloak.tokenParsed.groups) {
            this.currentKeycloakLoginGroups = this.authService.Auth.keycloak.tokenParsed.groups;
          }
          this.currentKeycloakLoginGroupNames = this.currentKeycloakLoginGroups.map(groupPath => groupPath.split("/")[groupPath.split("/").length - 1]);
        } else {
          this.currentKeycloakLoginRoles = [];
          this.currentKeycloakLoginGroups = [];
        }

        // set token expiration
        this.startCheckSessionExpiration();                
        })
      .catch(function () {
        console.log('Failed to load user profile');
      });
      var promise = await this.fetchAccessControlMetadata(this.currentKeycloakLoginRoles);
    }

    // revise metadata fecthing for protected endpoints 
    forkJoin({
      scriptsPromise: this.fetchIndicatorScriptsMetadata(this.currentKeycloakLoginRoles),
      topicsPromise: this.fetchTopicsMetadata(this.currentKeycloakLoginRoles),
      spatialUnitsPromise: this.fetchSpatialUnitsMetadata(this.currentKeycloakLoginRoles),
      georesourcesPromise: this.fetchGeoresourcesMetadata(this.currentKeycloakLoginRoles, filter),
      indicatorsPromise: this.fetchIndicatorsMetadata(this.currentKeycloakLoginRoles, filter),
      servicePromises: this.fetchServices(this.currentKeycloakLoginRoles, filter)
    }).subscribe({
      next: (response:any) => {

        this.modifyIndicatorApplicableSpatialUnitsForLoginRoles();

        this.buildHeadlineIndicatorHierarchy();
        this.buildTopicIndicatorHierarchy();
        this.topicIndicatorHierarchy_forOrderView = JSON.parse(JSON.stringify(this.topicIndicatorHierarchy));
        this.buildComputationIndicatorHierarchy();

        this.buildTopicGeoresourceHierarchy(filter);

       /*  this.mergeServices(); */

        console.log("Metadata fetched. Call initialize event.");
        this.onMetadataLoadingCompleted();

        // todo ?! nutzen?
       /*  setTimeout((e) => {
          $('.list-group-item > .collapseTrigger').on('click', function() {
            $('.glyphicon', e)
              .toggleClass('glyphicon-chevron-right')
              .toggleClass('glyphicon-chevron-down');

          });
        }); */
      },
      error: error => {
        // todo error handling
        this.displayMapApplicationError("Beim Laden der erforderlichen Anwendungsdaten ist ein Fehler aufgetreten. Bitte wenden Sie sich an Ihren Administrator.");
        this.broadcastService.broadcast("initialMetadataLoadingFailed", [error]);
      }
    });

/* 
    $q.all(metadataPromises).then(function successCallback(successArray) {

          this.modifyIndicatorApplicableSpatialUnitsForLoginRoles();

          this.buildHeadlineIndicatorHierarchy();
          this.buildTopicIndicatorHierarchy();
          this.topicIndicatorHierarchy_forOrderView = JSON.parse(JSON.stringify(this.topicIndicatorHierarchy));
          this.buildComputationIndicatorHierarchy();

          this.buildTopicGeoresourceHierarchy(filter);

          console.log("Metadata fetched. Call initialize event.");
          onMetadataLoadingCompleted();

          $timeout(function(){
            $('.list-group-item > .collapseTrigger').on('click', function() {
              $('.glyphicon', this)
                .toggleClass('glyphicon-chevron-right')
                .toggleClass('glyphicon-chevron-down');

            });
          });
      }, function errorCallback(errorArray) {
        // todo error handling
        this.displayMapApplicationError("Beim Laden der erforderlichen Anwendungsdaten ist ein Fehler aufgetreten. Bitte wenden Sie sich an Ihren Administrator.");
        $rootScope.$broadcast("initialMetadataLoadingFailed", errorArray);
    }); */

  }

 /*  mergeServices() {
    console.log(this.availableWmsDatasets)

    let geoServices:WmsDataset[] = this.availableWmsDatasets.filter(e => e.resourceType == WmsResourceType.GEORESOURCE);
    if(geoServices.length) {

      geoServices.forEach((elem:WmsDataset) => {

        this.availableGeoresources.push({
          aoiColor: undefined,
          georesourceName: undefined,
          availablePeriodsOfValidity: undefined,
          datasetName: elem.title,
          geoJSON: undefined,
          georesourceId: elem.id,
          isAOI: false,
          isLOI: false,
          isPOI: false,
          isWMS: true,
          isPublic: false,
          isSelected: false,
          loiColor: undefined,
          loiDashArrayString: undefined,
          loiWidth: undefined,
          metadata: {
            contact: '',
            databasis: '',
            datasource: '',
            description: '',
            lastUpdate: '',
            literature: '',
            note: '',
            sridEPSG: '',
            updateInterval: ''
          },
          ownerId: undefined,
          permissions: elem.userPermissions,
          poiMarkerColor: undefined,
          poiMarkerStyle: undefined,
          poiMarkerText: undefined,
          poiSymbolBootstrap3Name: undefined,
          poiSymbolColor: undefined,
          selectedDate: undefined,
          topicReference: elem.topicReference,
          userPermissions: undefined,
          wfsUrl: undefined,
          wmsUrl: elem.url,
        })
      });
    }
    console.log(this.availableGeoresources);
  } */

  async fetchTopicsMetadata(keycloakRolesArray){
    this.setTopics(await this.cacheHelperService.fetchTopicsMetadata(keycloakRolesArray));
  }

  async fetchSpatialUnitsMetadata(keycloakRolesArray){
    this.setSpatialUnits(await this.cacheHelperService.fetchSpatialUnitsMetadata(keycloakRolesArray));
  }

  async fetchGeoresourcesMetadata(keycloakRolesArray, filter){
    this.setGeoresources(await this.cacheHelperService.fetchGeoresourceMetadata(keycloakRolesArray, filter));
  }

  async fetchIndicatorsMetadata(keycloakRolesArray, filter){
    this.setIndicators(await this.cacheHelperService.fetchIndicatorsMetadata(keycloakRolesArray, filter));
  }

  async fetchIndicatorScriptsMetadata(keycloakRolesArray){
    this.setProcessScripts(await this.cacheHelperService.fetchProcessScriptsMetadata(keycloakRolesArray));
  }

  async fetchServices(keycloakRolesArray, filter = undefined) {
    this.setServices(await this.cacheHelperService.fetchServices(keycloakRolesArray, filter));
  }

  async reinitServices(): Promise<void> {
    await this.fetchServices(this.currentKeycloakLoginRoles);
  }

  setServices(servicesArray:WmsDataset[]) {
    this.availableWmsDatasets = servicesArray;

    this.wmsDatasets = servicesArray;
    this.wmsDatasets_keywordFiltered = servicesArray;
  }

  addSingleGeoresourceMetadata(georesourceMetadata){
    let tmpArray = [georesourceMetadata];
    Array.prototype.push.apply(tmpArray, this.availableGeoresources);
    this.availableGeoresources =  tmpArray;
    this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
  }

  replaceSingleGeoresourceMetadata(georesourceMetadata){
    for (let index = 0; index < this.availableGeoresources.length; index++) {
      let georesource = this.availableGeoresources[index];
      if(georesource.georesourceId == georesourceMetadata.georesourceId){
        this.availableGeoresources[index] = georesourceMetadata;
        break;
      }
    }
    this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
  }

  getLoiDashSvgFromStringValue(loiDashArrayString){
    for (const loiDashArrayObject of this.availableLoiDashArrayObjects) {
      if(loiDashArrayObject.dashArrayValue == loiDashArrayString){
        return loiDashArrayObject.svgString;
      }
    }

    return '';
  }

  deleteSingleGeoresourceMetadata(georesourceId){
    for (let index = 0; index < this.availableGeoresources.length; index++) {
      const georesource = this.availableGeoresources[index];
      if(georesource.georesourceId == georesourceId){
        this.availableGeoresources.splice(index, 1);
        break;
      }              
    }
    this.availableGeoresources_map.delete(georesourceId);
  }

  
  setProcessScripts(scriptsArray){
    this.availableProcessScripts = scriptsArray;
    this.availableProcessScripts_map = new Map();
    for (const scriptMetadata of scriptsArray) {
      this.availableProcessScripts_map.set(scriptMetadata.scriptId, scriptMetadata);
    }
  }

  setIndicators(indicatorsArray){
    
    this.availableIndicators = this.modifyIndicators(indicatorsArray);
    this.availableIndicators_map = new Map();
    
    for (const indicatorMetadata of indicatorsArray) {
      this.availableIndicators_map.set(indicatorMetadata.indicatorId, indicatorMetadata);
    }
  }

  getAvailableGeoWmsDatasets():WmsDataset[] {
    return this.availableWmsDatasets.filter(e => e.serviceResource == WmsResourceType.GEORESOURCE);
  }

  getAvailableIndiWmsDatasets():WmsDataset[] {
    return this.availableWmsDatasets.filter(e => e.serviceResource == WmsResourceType.INDICATOR);
  }

  setGeoresources(georesourcesArray){

    // wms are not part of availableGeoresources anymore, maybe add again. But no use-case for the time beeing
    this.availableGeoresources = georesourcesArray;

    //this.availableGeoresources_map = new Map();
    for (const georesourceMetadata of georesourcesArray) {
      this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
    }

    this.displayableGeoresources = this.availableGeoresources.filter(item => this.isDisplayableGeoresource(item));
    this.displayableGeoresources_keywordFiltered = JSON.parse(JSON.stringify(this.displayableGeoresources));

    //this.wmsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wmsDatasets));
    this.wmsDatasets_keywordFiltered = this.getAvailableGeoWmsDatasets();
    this.wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));

    this.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay = {
      poiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isPOI),
      loiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isLOI),
      aoiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isAOI),
      wmsData: this.wmsDatasets_keywordFiltered,
      wfsData: this.wfsDatasets_keywordFiltered      
    };
    // ggf 
    /*  wmsData: this.wmsDatasets_keywordFiltered,
      wfsData: this.wfsDat asets_keywordFiltered
                                    
      ggf in setServices auslagern, da beide requests parallel laufen und services evtl noch nicht verfügbar sind */

    var enabledGeoresources = window.__env.enabledGeoresourcesInfrastructure.concat(window.__env.enabledGeoresourcesGeoservices);

    var showPOI = enabledGeoresources.indexOf('poi') !== -1;
    var showLOI = enabledGeoresources.indexOf('loi') !== -1;
    var showAOI = enabledGeoresources.indexOf('aoi') !== -1;
    var showWMS = enabledGeoresources.indexOf('wms') !== -1;
    var showWFS = enabledGeoresources.indexOf('wfs') !== -1;

    this.onChangeGeoresourceKeywordFilter(undefined, showPOI, showLOI, showAOI, showWMS, showWFS);
  }

  setTopics(topicsArray) {
    this.availableTopics = topicsArray;
  }

  setSpatialUnits(spatialUnitsArray){
    this.availableSpatialUnits = spatialUnitsArray;
    this.availableSpatialUnits_map = new Map();
    for (const spatialUnitMetadata of spatialUnitsArray) {
      this.availableSpatialUnits_map.set(spatialUnitMetadata.spatialUnitId, spatialUnitMetadata);
    }
  }

  addSingleIndicatorMetadata(indicatorMetadata){
    let tmpArray = this.modifyIndicators([indicatorMetadata]);
    Array.prototype.push.apply(tmpArray, this.availableIndicators);
    this.availableIndicators =  tmpArray;
    this.availableIndicators_map.set(indicatorMetadata.indicatorId, indicatorMetadata);
  }

  replaceSingleIndicatorMetadata(indicatorMetadata){
    for (let index = 0; index < this.availableIndicators.length; index++) {
      let indicator = this.availableIndicators[index];
      if(indicator.indicatorId == indicatorMetadata.indicatorId){
        this.availableIndicators[index] = this.modifySingleIndicator(indicatorMetadata);
        break;
      }
    }
    this.availableIndicators_map.set(indicatorMetadata.indicatorId, indicatorMetadata);
  }

  checkDeletePermission(){
    if(this.checkAdminPermission()) {
      return true;
    }
      
    for(const role of this.currentKeycloakLoginRoles){
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if(permissionLevel === "client-resources-creator" || permissionLevel === "unit-resources-creator"){
        return true;
      }
    }
    return false;
  }

  getAllowedRolesString(allowedPermissionIds){
    var permissions:any[] = [];
    for(const organizationalUnit of this.accessControl){
      for(const permission of organizationalUnit.permissions){
        if(allowedPermissionIds.includes(permission.permissionId)){
          permissions.push(organizationalUnit.name + "-" + permission.permissionLevel)
        }
      }
    }
    return permissions.join(", ");
  }

  getTopicHierarchyDisplayString(topicReferenceId){
    var topicHierarchyArray = this.getTopicHierarchyForTopicId(topicReferenceId);
    
    var topicsString = "";
    for (let index = 0; index < topicHierarchyArray.length; index++) {
      if (index === 0) {
        // mainTopic --> first tier
        topicsString += topicHierarchyArray[index].topicName;
      }
      else {
        var numberOfWhitespaces = 2 * index;
        var whitespaceString = "";
        for (let k = 0; k < numberOfWhitespaces; k++) {
          whitespaceString += "&nbsp;";
        }
        topicsString += whitespaceString + topicHierarchyArray[index].topicName;
      }

      if (index < topicHierarchyArray.length) {
        topicsString += "<br/>";
      }

    }

    return topicsString;
  }

  getRoleTitle(organizationalUnitId){
    var roles = this.accessControl.filter(e => e.organizationalUnitId==organizationalUnitId);
    if(roles && roles.length > 0) {
      return roles[0].name;
    }
    return "";
  }

  getIndicatorMetadataById(indicatorId){
    return this.availableIndicators_map.get(indicatorId);
  }

  getGeoresourceMetadataById(georesourceId){
    return this.availableGeoresources_map.get(georesourceId);
  }

  getSpatialUnitMetadataById(spatialUnitId){
    return this.availableSpatialUnits_map.get(spatialUnitId);
  }

  deleteSingleIndicatorMetadata(indicatorId){
    for (let index = 0; index < this.availableIndicators.length; index++) {
      const indicator = this.availableIndicators[index];
      if(indicator.indicatorId == indicatorId){
        this.availableIndicators.splice(index, 1);
        break;
      }              
    }
    this.availableIndicators_map.delete(indicatorId);
  }

  modifySingleIndicator(indicator) {
    var temp = this.modifyIndicators([indicator]);
    return temp[0];
  }

  modifyIndicators(indicators) {

    var decimalDefault = 2;
    if(window.__env.numberOfDecimals !== undefined)
      decimalDefault = window.__env.numberOfDecimals;
      
    indicators.forEach(elem => {
      if(elem.precision===null) {
        elem.precision = decimalDefault;
        elem.defaultPrecision = true;
      } else 
        elem.defaultPrecision = false;
    });

    return indicators;
  }

  onMetadataLoadingCompleted(){

    this.broadcastService.broadcast("initialMetadataLoadingCompleted");

    setTimeout(() => {
      $("option").each(function (index, element) {
        var text = $(element).text();
        $(element).attr("title", text);
      });
    }, 1000);
  }

  buildTopicsMap_georesources(georesourceTopics){
    var topicsMap = new Map();            

    for (const topic of georesourceTopics) {
      topicsMap.set(topic.topicId, {
        poiDatasets: [],
        loiDatasets: [],
        aoiDatasets: [],
        wmsDatasets: [],
        wfsDatasets: []
      });
      if(topic.subTopics.length > 0){
        topicsMap = this.addSubTopicsToMap_georesources(topic.subTopics, topicsMap);
      }
    }

    topicsMap.set(this.georesourceMapKey_forUnmappedTopicReferences, {
      poiDatasets: [],
      loiDatasets: [],
      aoiDatasets: [],
      wmsDatasets: [],
      wfsDatasets: []
    });

    return topicsMap;
  }

  addSubTopicsToMap_georesources(subTopicsArray, topicsMap){

    for (const subTopic of subTopicsArray) {
      topicsMap.set(subTopic.topicId, {
        poiDatasets: [],
        loiDatasets: [],
        aoiDatasets: [],
        wmsDatasets: [],
        wfsDatasets: []
      });
      if(subTopic.subTopics.length > 0){
        topicsMap = this.addSubTopicsToMap_georesources(subTopic.subTopics, topicsMap);
      } 
    } 
    
    return topicsMap;
  }

  buildTopicGeoresourceHierarchy(filter:any = undefined){

    var georesourceTopics = JSON.parse(JSON.stringify(this.availableTopics)).filter(topic => topic.topicResource === "georesource");
    /*
    topicsMap.set(topic.topicId, {
        poiDatasets: [],
        loiDatasets: [],
        aoiDatasets: [],
        wmsDatasets: [],
        wfsDatasets: []
      })

      + special entry with key "unmapped" for all datasets without valid topic reference
    */
    var topicsMap = this.buildTopicsMap_georesources(georesourceTopics);
    

    // PROCESS GEORESOURCES
    var filteredGeoresources = this.displayableGeoresources_keywordFiltered;

    for (const georesourceMetadata of filteredGeoresources) {
      if (topicsMap.has(georesourceMetadata.topicReference)){
        var georesourceDatasets = topicsMap.get(georesourceMetadata.topicReference);
        
        // catch any frehsly created reachability scenario data sources as they are handled differently (only for reachability analysis)
        if(georesourceMetadata.isNewReachabilityDataSource){
          continue;
        }

        else if(georesourceMetadata.isPOI){
          georesourceDatasets.poiDatasets.push(georesourceMetadata);
        }
        else if(georesourceMetadata.isLOI){
          georesourceDatasets.loiDatasets.push(georesourceMetadata);
        }
        else if(georesourceMetadata.isAOI){
          georesourceDatasets.aoiDatasets.push(georesourceMetadata);
        }                

        topicsMap.set(georesourceMetadata.topicReference, georesourceDatasets);
      }
      else{
        var georesourceDatasets_unmapped = topicsMap.get(this.georesourceMapKey_forUnmappedTopicReferences);
        
        // catch any frehsly created reachability scenario data sources as they are handled differently (only for reachability analysis)
        if(georesourceMetadata.isNewReachabilityDataSource){
          continue;
        }

        else if(georesourceMetadata.isPOI){
          georesourceDatasets_unmapped.poiDatasets.push(georesourceMetadata);
        }
        else if(georesourceMetadata.isLOI){
          georesourceDatasets_unmapped.loiDatasets.push(georesourceMetadata);
        }
        else if(georesourceMetadata.isAOI){
          georesourceDatasets_unmapped.aoiDatasets.push(georesourceMetadata);
        }                

        topicsMap.set(this.georesourceMapKey_forUnmappedTopicReferences, georesourceDatasets_unmapped);
      }
    }

    // PROCESS WMS and WFS
    // hier
    for (const wmsMetadata of this.wmsDatasets_keywordFiltered) {
      if (topicsMap.has(wmsMetadata.topicReference)){
        if(!filter || (filter && filter.georesourceTopics.includes(wmsMetadata.topicReference))) {
          var georesourceDatasets = topicsMap.get(wmsMetadata.topicReference);                
          georesourceDatasets.wmsDatasets.push(wmsMetadata);              

          topicsMap.set(wmsMetadata.topicReference, georesourceDatasets);
        }
      }
      else{
        var georesourceDatasets_unmapped = topicsMap.get(this.georesourceMapKey_forUnmappedTopicReferences);
        
        georesourceDatasets_unmapped.wmsDatasets.push(wmsMetadata);               

        topicsMap.set(this.georesourceMapKey_forUnmappedTopicReferences, georesourceDatasets_unmapped);
      }
    }

    // PROCESS WMS and WFS
    for (const wfsMetadata of this.wfsDatasets_keywordFiltered) {
      if (topicsMap.has(wfsMetadata.topicReference)){
        if(!filter || (filter && filter.georesourceTopics.includes(wfsMetadata.topicReference))) {
          var georesourceDatasets = topicsMap.get(wfsMetadata.topicReference);                
          georesourceDatasets.wfsDatasets.push(wfsMetadata);              

          topicsMap.set(wfsMetadata.topicReference, georesourceDatasets);
        }
      }
      else{
        var georesourceDatasets_unmapped = topicsMap.get(this.georesourceMapKey_forUnmappedTopicReferences);
        
        georesourceDatasets_unmapped.wfsDatasets.push(wfsMetadata);               

        topicsMap.set(this.georesourceMapKey_forUnmappedTopicReferences, georesourceDatasets_unmapped);
      }
    }

    this.topicGeoresourceHierarchy = this.addGeoresourceDataToTopicHierarchy(georesourceTopics, topicsMap);
  }

  addGeoresourceDataToTopicHierarchy(topicsArray, topicsMap){

    /*
    topicsMap.set(topic.topicId, {
        poiDatasets: [],
        loiDatasets: [],
        aoiDatasets: [],
        wmsDatasets: [],
        wfsDatasets: []
      })

      + special entry with key "unmapped" for all datasets without valid topic reference
    */

    for (var topic of topicsArray) {
      var topicsDataEntry = topicsMap.get(topic.topicId);
      topic.poiData = topicsDataEntry.poiDatasets;
      topic.poiCount = topicsDataEntry.poiDatasets.length;

      topic.loiData = topicsDataEntry.loiDatasets;
      topic.loiCount = topicsDataEntry.loiDatasets.length;

      topic.aoiData = topicsDataEntry.aoiDatasets;
      topic.aoiCount = topicsDataEntry.aoiDatasets.length;

      topic.wmsData = topicsDataEntry.wmsDatasets;
      topic.wmsCount = topicsDataEntry.wmsDatasets.length;

      topic.wfsData = topicsDataEntry.wfsDatasets;
      topic.wfsCount = topicsDataEntry.wfsDatasets.length;

      topic.totalCount = topic.poiCount + topic.loiCount + topic.aoiCount + topic.wmsCount + topic.wfsCount;
      topic.ownCount = topic.poiCount + topic.loiCount + topic.aoiCount + topic.wmsCount + topic.wfsCount;

      if(topic.subTopics.length > 0){
        topic = this.addGeoresourceDataToSubTopics(topic, topicsMap);
      }
    }

    // PROCESS UNMAPPED entries
    this.topicGeoresourceHierarchy_unmappedEntries = {};
    var topicsDataEntry_unmapped = topicsMap.get(this.georesourceMapKey_forUnmappedTopicReferences);
    this.topicGeoresourceHierarchy_unmappedEntries.poiData = topicsDataEntry_unmapped.poiDatasets;
    this.topicGeoresourceHierarchy_unmappedEntries.poiCount = topicsDataEntry_unmapped.poiDatasets.length;

    this.topicGeoresourceHierarchy_unmappedEntries.loiData = topicsDataEntry_unmapped.loiDatasets;
    this.topicGeoresourceHierarchy_unmappedEntries.loiCount = topicsDataEntry_unmapped.loiDatasets.length;

    this.topicGeoresourceHierarchy_unmappedEntries.aoiData = topicsDataEntry_unmapped.aoiDatasets;
    this.topicGeoresourceHierarchy_unmappedEntries.aoiCount = topicsDataEntry_unmapped.aoiDatasets.length;

    this.topicGeoresourceHierarchy_unmappedEntries.wmsData = topicsDataEntry_unmapped.wmsDatasets;
    this.topicGeoresourceHierarchy_unmappedEntries.wmsCount = topicsDataEntry_unmapped.wmsDatasets.length;

    this.topicGeoresourceHierarchy_unmappedEntries.wfsData = topicsDataEntry_unmapped.wfsDatasets;
    this.topicGeoresourceHierarchy_unmappedEntries.wfsCount = topicsDataEntry_unmapped.wfsDatasets.length;

    this.topicGeoresourceHierarchy_unmappedEntries.totalCount = this.topicGeoresourceHierarchy_unmappedEntries.poiCount + 
    this.topicGeoresourceHierarchy_unmappedEntries.loiCount + 
    this.topicGeoresourceHierarchy_unmappedEntries.aoiCount + 
    this.topicGeoresourceHierarchy_unmappedEntries.wmsCount + 
    this.topicGeoresourceHierarchy_unmappedEntries.wfsCount;

    return topicsArray;
  }

  addGeoresourceDataToSubTopics(topic, topicsMap){
    for (var subTopic of topic.subTopics) { 
      
      var topicsDataEntry = topicsMap.get(subTopic.topicId);
      subTopic.poiData = topicsDataEntry.poiDatasets;
      subTopic.poiCount = topicsDataEntry.poiDatasets.length;

      subTopic.loiData = topicsDataEntry.loiDatasets;
      subTopic.loiCount = topicsDataEntry.loiDatasets.length;

      subTopic.aoiData = topicsDataEntry.aoiDatasets;
      subTopic.aoiCount = topicsDataEntry.aoiDatasets.length;

      subTopic.wmsData = topicsDataEntry.wmsDatasets;
      subTopic.wmsCount = topicsDataEntry.wmsDatasets.length;

      subTopic.wfsData = topicsDataEntry.wfsDatasets;
      subTopic.wfsCount = topicsDataEntry.wfsDatasets.length;

      subTopic.totalCount = subTopic.poiCount + subTopic.loiCount + subTopic.aoiCount + subTopic.wmsCount + subTopic.wfsCount;
      subTopic.ownCount = subTopic.poiCount + subTopic.loiCount + subTopic.aoiCount + subTopic.wmsCount + subTopic.wfsCount;

      if(subTopic.subTopics.length > 0){
        subTopic = this.addGeoresourceDataToSubTopics(subTopic, topicsMap);
      }
      topic.poiCount = topic.poiCount + subTopic.poiCount;
      topic.loiCount = topic.loiCount + subTopic.loiCount;
      topic.aoiCount = topic.aoiCount + subTopic.aoiCount;
      topic.wmsCount = topic.wmsCount + subTopic.wmsCount;
      topic.wfsCount = topic.wfsCount + subTopic.wfsCount;
      topic.totalCount = topic.totalCount + subTopic.totalCount;
    }

    return topic;
  }

  buildComputationIndicatorHierarchy(){

    var indicatorsMap = new Map();

    var filteredIndicators = this.displayableIndicators_keywordFiltered;

    for (const indicatorMetadata of filteredIndicators) {
      indicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
    }
    
    var computationIndicatorsArray = filteredIndicators.filter(indicatorMetadata => indicatorMetadata.creationType == "COMPUTATION");

    var computationIndicatorsIdArray = computationIndicatorsArray.map(indicatorMetadata => indicatorMetadata.indicatorId);

    var computationIndicatorsMap = new Map();

    for (const indicatorMetadata of computationIndicatorsArray) {
      computationIndicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
    }

    var computationIndicatorScriptsMap = new Map();
    for (const scriptMetadata of this.availableProcessScripts) {
      if(computationIndicatorsIdArray.includes(scriptMetadata.indicatorId)){                
        computationIndicatorScriptsMap.set(scriptMetadata.indicatorId, scriptMetadata);
      }
    }

    this.computationIndicatorHierarchy = [];

    // var item = {
    //   computationIndicator: {metadata}
    //   baseIndicators: [{metadata}]
    //   maybeSomeAnalysisItems?
    // }

    for (const computationIndicatorMetadata of computationIndicatorsArray) {
      var item:any = {};
      item.computationIndicator = computationIndicatorMetadata;
      item.baseIndicators = [];

      if(computationIndicatorScriptsMap.has(computationIndicatorMetadata.indicatorId)){
        var targetScriptMetadata = computationIndicatorScriptsMap.get(computationIndicatorMetadata.indicatorId);
        for (const requiredIndicatorId of targetScriptMetadata.requiredIndicatorIds) {
          if (indicatorsMap.has(requiredIndicatorId)){
            item.baseIndicators.push(indicatorsMap.get(requiredIndicatorId));
          }                
        }
      }              

      this.computationIndicatorHierarchy.push(item);
    }            

  }

  buildTopicIndicatorHierarchy(){

    var indicatorTopics = JSON.parse(JSON.stringify(this.availableTopics)).filter(topic => topic.topicResource === "indicator");
    var topicsMap = this.buildTopicsMap_indicators(indicatorTopics);

    var filteredIndicators = this.displayableIndicators_keywordFiltered;

    for (const indicatorMetadata of filteredIndicators) {
      if (topicsMap.has(indicatorMetadata.topicReference)){
        var indicatorArray = topicsMap.get(indicatorMetadata.topicReference);
        indicatorArray.push(indicatorMetadata);
        topicsMap.set(indicatorMetadata.topicReference, indicatorArray);
      }
    }

    let tempTopicsData = this.addIndicatorDataToTopicHierarchy(indicatorTopics, topicsMap);
    this.topicIndicatorHierarchy = this.addWmsDataToTopicHierarchyRecursive(tempTopicsData);
    this.addWmsCountRecursive(this.topicIndicatorHierarchy);
  }

  buildTopicsMap_indicators(indicatorTopics){
    var topicsMap = new Map();            

    for (const topic of indicatorTopics) {
      topicsMap.set(topic.topicId, []);
      if(topic.subTopics.length > 0){
        topicsMap = this.addSubTopicsToMap_indicators(topic.subTopics, topicsMap);
      }
    }

    return topicsMap;
  }

  addSubTopicsToMap_indicators(subTopicsArray, topicsMap){

    for (const subTopic of subTopicsArray) {
      topicsMap.set(subTopic.topicId, []);
      if(subTopic.subTopics.length > 0){
        topicsMap = this.addSubTopicsToMap_indicators(subTopic.subTopics, topicsMap);
      } 
    } 
    
    return topicsMap;
  }

  addWmsDataToTopicHierarchyRecursive(tempTopicsData:IndicatorsTopicsHierarchy[]):IndicatorsTopicsHierarchy[] {

    tempTopicsData.forEach((topicData:IndicatorsTopicsHierarchy) => {
      
      let wmsDatasets = this.getAvailableIndiWmsDatasets().filter(e => e.topicReference==topicData.topicId);

      if(wmsDatasets.length) {
        topicData.wmsData = wmsDatasets;
        topicData.wmsCount = topicData.wmsData.length;
      } else {
        topicData.wmsData = [];
        topicData.wmsCount = 0;
      }

      if(topicData.subTopics.length) 
        topicData.subTopics = this.addWmsDataToTopicHierarchyRecursive(topicData.subTopics);
    });

    return tempTopicsData;
  }

  addWmsCountRecursive(topicData:IndicatorsTopicsHierarchy[]):number {

    let num = 0;

    topicData.forEach((topic:IndicatorsTopicsHierarchy)=> {

      num += topic.wmsCount;

      if(topic.subTopics.length) {

        num += this.addWmsCountRecursive(topic.subTopics);
        topic.wmsCount += num; 
      }
    });

    return num;
  }

 /*  getWmsCountTopicsDownwards_Recursive(topicData:IndicatorsTopicsHierarchy[]):number {
    
    topicData.forEach((topic:IndicatorsTopicsHierarchy) => {
      if(topic.subTopics.length)
        topic.wmsCount = this.getWmsCountTopicsDownwards_Recursive(topic.subTopics);
    });

    return num;
  } */

  addIndicatorDataToTopicHierarchy(topicsArray, topicsMap){
    for (var topic of topicsArray) {
      topic.indicatorData = topicsMap.get(topic.topicId);
      topic.indicatorData.sort((a,b) => (a.displayOrder > b.displayOrder) ? 1 : ((b.displayOrder > a.displayOrder) ? -1 : 0));
      topic.indicatorCount = topic.indicatorData.length;
      if(topic.subTopics.length > 0){
        topic = this.addIndicatorDataToSubTopics(topic, topicsMap);
      }
    }

    return topicsArray;
  }

  addIndicatorDataToSubTopics(topic, topicsMap){
    for (var subTopic of topic.subTopics) {
      subTopic.indicatorData = topicsMap.get(subTopic.topicId);
      subTopic.indicatorData.sort((a,b) => (a.displayOrder > b.displayOrder) ? 1 : ((b.displayOrder > a.displayOrder) ? -1 : 0));
      subTopic.indicatorCount = subTopic.indicatorData.length;              
      if(subTopic.subTopics.length > 0){
        subTopic = this.addIndicatorDataToSubTopics(subTopic, topicsMap);
      }
      topic.indicatorCount = topic.indicatorCount + subTopic.indicatorCount;
    }

    return topic;
  }

  modifyIndicatorApplicableSpatialUnitsForLoginRoles(){
    var availableSpatialUnitNames:any[] = [];
    for (const spatialUnit of this.availableSpatialUnits) {
      availableSpatialUnitNames.push(spatialUnit.spatialUnitLevel);
    }
    for (const indicator of this.availableIndicators) {
      indicator.applicableSpatialUnits = indicator.applicableSpatialUnits.filter(applicableSpatialUnit => availableSpatialUnitNames.includes(applicableSpatialUnit.spatialUnitName)); 
    }

    this.displayableIndicators = this.availableIndicators.filter(item => this.isDisplayableIndicator(item));
    this.displayableIndicators_keywordFiltered = JSON.parse(JSON.stringify(this.displayableIndicators));
  }

  isDisplayableIndicator(item){
    // var arrayOfNameSubstringsForHidingIndicators = ["Standardabweichung", "Prozentuale Ver"];
    var arrayOfNameSubstringsForHidingIndicators = window.__env.arrayOfNameSubstringsForHidingIndicators;

    // this is an item from i.e. indicatorRadar, that has a different structure
    if(item.indicatorMetadata){
      if(item.indicatorMetadata.applicableDates == undefined || item.indicatorMetadata.applicableDates.length === 0)
        return false;

      if(item.indicatorMetadata.applicableSpatialUnits == undefined || item.indicatorMetadata.applicableSpatialUnits.length === 0)
        return false;  

        var isIndicatorThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingIndicators.some(substring => String(item.indicatorMetadata.indicatorName).includes(substring));

        if(isIndicatorThatShallNotBeDisplayed){
          return false;
        }

      //  if(! roleMappingAllowsDisplay(item.indicatorMetadata)){
      //    return false;
      //  }

      return true;
    }
    else{
      //
      if(item.applicableDates == undefined || item.applicableDates.length === 0)
        return false;

      if(item.applicableSpatialUnits == undefined || item.applicableSpatialUnits.length === 0)
        return false;    

        // var isIndicatorThatShallNotBeDisplayed = item.indicatorName.includes("Standardabweichung") || item.indicatorName.includes("Prozentuale Ver");
        var isIndicatorThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingIndicators.some(substring => String(item.indicatorName).includes(substring));

        if(isIndicatorThatShallNotBeDisplayed){
          return false;
        }

      //  if(! roleMappingAllowsDisplay(item)){
      //   return false;
      // }

      return true;
    }
}

  buildHeadlineIndicatorHierarchy(){

    var indicatorsMap = new Map();

    var filteredIndicators = this.displayableIndicators_keywordFiltered;

    for (const indicatorMetadata of filteredIndicators) {
      indicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
    }
    
    var headlineIndicatorsArray = filteredIndicators.filter(indicatorMetadata => indicatorMetadata.isHeadlineIndicator == true);

    var headlineIndicatorsIdArray = headlineIndicatorsArray.map(indicatorMetadata => indicatorMetadata.indicatorId);

    var headlineIndicatorsMap = new Map();

    for (const indicatorMetadata of headlineIndicatorsArray) {
      headlineIndicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
    }

    var headlineIndicatorScriptsMap = new Map();
    for (const scriptMetadata of this.availableProcessScripts) {
      if(headlineIndicatorsIdArray.includes(scriptMetadata.indicatorId)){                
        headlineIndicatorScriptsMap.set(scriptMetadata.indicatorId, scriptMetadata);
      }
    }

    this.headlineIndicatorHierarchy = [];

    // var item = {
    //   headlineIndicator: {metadata}
    //   baseIndicators: [{metadata}]
    //   maybeSomeAnalysisItems?
    // }

    for (const headlineIndicatorMetadata of headlineIndicatorsArray) {
      var item:any = {};
      item.headlineIndicator = headlineIndicatorMetadata;
      item.baseIndicators = [];

      if(headlineIndicatorScriptsMap.has(headlineIndicatorMetadata.indicatorId)){
        var targetScriptMetadata = headlineIndicatorScriptsMap.get(headlineIndicatorMetadata.indicatorId);
        for (const requiredIndicatorId of targetScriptMetadata.requiredIndicatorIds) {
          if (indicatorsMap.has(requiredIndicatorId)){
            item.baseIndicators.push(indicatorsMap.get(requiredIndicatorId));
          }                
        }
      }              

      this.headlineIndicatorHierarchy.push(item);
    }            

  }

  indicatorValueIsNoData(indicatorValue){
    if(Number.isNaN(indicatorValue) || indicatorValue === null || indicatorValue === undefined){
      return true;
    }
    return false;
  };

  startCheckSessionExpiration() {
    setInterval(() => {
      // minutes until current browser session invalidates
      // use refresh token as this is used when calling "updateToken" keycloak method. Only if that is invalid the whole session is invalid
      this.keycloakTokenExpirationInfo = Math.round((this.authService.Auth.keycloak.refreshTokenParsed.exp + this.authService.Auth.keycloak.timeSkew - new Date().getTime() / 1000) / 60);
      if(! this.keycloakTokenExpirationInfo){
        this.keycloakTokenExpirationInfo = 30;
      }

      // if session is expired then show warning to User!
      if (this.keycloakTokenExpirationInfo < 0){
        this.keycloakTokenExpirationInfo = 0;
        this.displayMapApplicationError("Ihre aktuelle Login-Session ist abgelaufen. Sie müssen sich neu einloggen. Nutzen Sie dazu das User-Menü oben rechts.");
      }

    }, 1000 * 60);            
  }

  async fetchAccessControlMetadata(keycloakRolesArray){
    this.setAccessControl(await this.cacheHelperService.fetchAccessControlMetadata(keycloakRolesArray));
    this.setCurrentKomMonitorLoginRoleNames();
    this.setCurrentKomMonitorLoginOrganizationalUnits();            
  };

  /**
   * Get access control metadata by organizational unit ID
   */
  getAccessControlById(id: string): AccessControlMetadata | null {
    return this.accessControl.find(unit => unit.organizationalUnitId === id) || null;
  }

  setCurrentKomMonitorLoginOrganizationalUnits() {  
    
    // now iterate once over all possible KomMonitor orgas and check if user belongs to this orga via its keycloak group
    this.currentKomMonitorLoginOrganizationalUnits = this.accessControl.filter(org => this.currentKeycloakLoginGroupNames.includes(org.name));
  }

  setCurrentKomMonitorLoginRoleNames() {
    /*
      window.__env.keycloakKomMonitorGroupsEditRoleNames = ["client-users-creator", "unit-users-creator"];
      window.__env.keycloakKomMonitorThemesEditRoleNames = ["client-themes-creator", "unit-themes-creator"];
      window.__env.keycloakKomMonitorGeodataEditRoleNames = ["client-resources-creator", "unit-resources-creator"];
    */
    let roleSuffixes = window.__env.keycloakKomMonitorGroupsEditRoleNames.concat(window.__env.keycloakKomMonitorThemesEditRoleNames).concat(window.__env.keycloakKomMonitorGeodataEditRoleNames);
    var possibleRoles = ["kommonitor-creator"];
    this.accessControl.forEach(organizationalUnit => {
      for (const roleSuffix of roleSuffixes) {
        possibleRoles.push(organizationalUnit.name + "." + roleSuffix); 
      }              
    });
    this.currentKomMonitorLoginRoleNames = this.currentKeycloakLoginRoles.filter(role => possibleRoles.includes(role));
  }

  setAccessControl(input){
    this.accessControl = input;
    this.accessControl_map = new Map();
    for (const entry of input) {
      this.accessControl_map.set(entry.organizationalUnitId, entry);
    }
    this.updateAvailableRoles();
    this.allowedAccessControl = this.filterAllowedAccessControl(this.accessControl);
  }

  filterAllowedAccessControl(acArray) {

    if (this.checkAdminPermission()) {
      return acArray;
    }
    
    var clientUserRoles = this.filterClientUserAdminRoles();
    var filtered:any[] = [];
    var existingOrgaIds:any[] = [];

    acArray.forEach(orga => {
      const currentOrga = orga;
      while (orga) {
        clientUserRoles.forEach(role => {
          let roleNameParts = role.split(".");
          const orgaName = roleNameParts[roleNameParts.length - 2];
          
          if (orgaName === orga.name && !existingOrgaIds.includes(currentOrga.organizationalUnitId)) {
            filtered.push(currentOrga);
            existingOrgaIds.push(currentOrga.organizationalUnitId);
          }
        });
        orga = this.accessControl_map.get(orga.parentId);
      }
    });
    return filtered;
  }

  filterClientUserAdminRoles() {
    return this.currentKeycloakLoginRoles.filter(role => {
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if(permissionLevel === "client-users-creator"){
        return true;
      }
      return false;
    });
  }

  checkAdminPermission(){
    if(this.currentKeycloakLoginRoles.includes(window.__env.keycloakKomMonitorAdminRoleName)){
      return true;
    }
    return false;
  }

  updateAvailableRoles() {
    this.availableRoles = [];

    for (let elem of this.accessControl) {
      for (let permission of elem.permissions) {
        let available = {...permission, ...{"organizationalUnit": elem, "roleName": elem.name + "-" + permission.permissionLevel}};
        this.availableRoles.push(available);
      }
    }
    // we need to refresh all modals as roles have changed
    this.broadcastService.broadcast("availableRolesUpdate");
  }

  async downloadMetadataPDF_georesource(georesourceMetadata){            
    var pdfName = georesourceMetadata.datasetName + ".pdf";
    var jspdf = await this.createMetadataPDF_georesource(georesourceMetadata, pdfName);							
    return jspdf.save(pdfName);
  }

  async createMetadataPDF_georesource(georesource, pdfName) {

    let doc:any = new jsPDF({
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(16);
    // jspdf.text("Metadatenblatt", 70, 6);

    //insert logo
    var img = new Image();
    var subPath = location.pathname;
    img.src = subPath + 'logos/KM_Logo1.png';
    doc.addImage(img, 'PNG', 193, 5, 12, 12);

    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bolditalic', 'normal');
    var titleArray = doc.splitTextToSize("Geodatensatz: " + georesource.datasetName, 180);
    doc.text(titleArray, 14, 25);


    doc.setFontSize(11);

    var initialStartY = 30;

    if (titleArray.length > 1) {
      titleArray.forEach(function (item) {
        initialStartY += 5;
      });
    }

    var headStyles = {
      fontStyle: 'bold',
      fontSize: 12,
      fillColor: '#337ab7',
      // auto or wrap
      cellWidth: 'auto'
    };

    var bodyStyles = {
      fontStyle: 'normal',
      fontSize: 11,
      // auto or wrap or number
      cellWidth: 'auto'
    };

    // first column with fixed width
    var columnStyles = {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { fontStyle: 'normal' }
    };

    var topicsString = "";

    var topicReferenceId = georesource.topicReference;

    // will be an array representing the topic hierarchy
    // i.e. [mainTopic, subTopicFirstTier, subTopicSecondTier, ...]
    var topicHierarchyArray = this.getTopicHierarchyForTopicId(topicReferenceId);

    for (let index = 0; index < topicHierarchyArray.length; index++) {
      if (index === 0) {
        // mainTopic --> first tier
        topicsString += topicHierarchyArray[index].topicName;
      }
      else {
        var numberOfWhitespaces = 2 * index;
        var whitespaceString = "";
        for (let k = 0; k < numberOfWhitespaces; k++) {
          whitespaceString += " ";
        }
        topicsString += whitespaceString + topicHierarchyArray[index].topicName;
      }

      if (index < topicHierarchyArray.length - 1) {
        topicsString += "\n";
      }

    }

    var category = "Punkt";
    if (georesource.isLOI) {
      category = "Linie";
    }
    else if(georesource.isAOI){
      category = "Fläche";
    }

    // Or JavaScript:
    doc.autoTable({
      head: [['Themenfeld', 'Datentyp', 'letzte Aktualisierung']],
      body: [
        [topicsString, category, this.tsToDate_withOptionalUpdateInterval(this.dateToTS(georesource.metadata.lastUpdate))]
        // ...
      ],
      theme: 'grid',
      headStyles: headStyles,
      bodyStyles: bodyStyles,
      startY: initialStartY
    });

    var datesString = "";

    if(georesource.availablePeriodsOfValidity.length <= 10){
      for (var [j, period] of georesource.availablePeriodsOfValidity.entries()) {

        var startDate = new Date(period.startDate);
        var endDate = period.endDate? new Date(period.endDate) : undefined;

        datesString += "Zeitspanne: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(startDate));
        if(endDate){
          datesString += " - " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(endDate));
        }
        else{
          datesString += "- 'null' (demnach gültig bis auf weiteres)";
        }

        if (j < georesource.availablePeriodsOfValidity.length - 1) {
          datesString += "\n";
        }
      }
    }
    else{
      datesString += "insgesamt " + georesource.availablePeriodsOfValidity.length + " Zeitspannen\n\n";

      var earliestStartDate;
      var latestEndDate:any = -1; // my be null --> enc init with -1

      for (var [j, period] of georesource.availablePeriodsOfValidity.entries()) {

        if(! earliestStartDate){
          earliestStartDate = new Date(period.startDate);
        }
        else{
          if(new Date(period.startDate) < earliestStartDate){
            earliestStartDate = new Date(period.startDate);
          }
        }
        
        if(latestEndDate == -1){
          if(period.endDate){
            latestEndDate = new Date(period.endDate);
          }
          else if(period.endDate == null){
            latestEndDate = null;
          }
          
        }
        else{
          if(latestEndDate && period.endDate && new Date(period.endDate) > latestEndDate){
            latestEndDate = new Date(period.endDate);
          }
        }
      }

      datesString += "frühestes Startdatum: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(earliestStartDate)) + "\n";
      if(latestEndDate != null && latestEndDate != -1){
        datesString += "spätestes Enddatum: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(latestEndDate)) + "\n";
      }
      else{
        datesString += "spätestes Enddatum: ohne explizites Enddatum (demnach gültig bis auf weiteres)\n";
      }
      

    }            

    // linked elements
    doc.autoTable({
      head: [],
      body: [
        ["Beschreibung", georesource.metadata.description],
        ["Datengrundlage", georesource.metadata.databasis ? georesource.metadata.databasis : "-"],
        ["Datenquelle", georesource.metadata.datasource ? georesource.metadata.datasource : "-"],
        ["Datenhalter und Kontakt", georesource.metadata.contact ? georesource.metadata.contact : "-"],
        ["Bemerkung", georesource.metadata.note ? georesource.metadata.note : "-"],
        // $scope.updateInteval is a map mapping the english KEYs to german expressions
        ["Zeitbezug / Fortführungsintervall", this.updateInterval.get(georesource.metadata.updateInterval.toUpperCase())],
        ["Verfügbare Gültigkeitszeiträume", datesString],
        ["Quellen / Literatur", georesource.metadata.literature ? georesource.metadata.literature : "-"]
      ],
      theme: 'grid',
      headStyles: headStyles,
      bodyStyles: bodyStyles,
      columnStyles: columnStyles,
      startY: doc.autoTable.previous.finalY + 10
    });

    doc.setProperties({
      title: 'KomMonitor Geodatenblatt',
      subject: pdfName,
      author: 'KomMonitor',
      keywords: 'Geodaten, Metadatenblatt',
      creator: 'KomMonitor'
    });
    return doc;
  }

  async createMetadataPDF_indicator(indicator) {

    let doc:any = new jsPDF({
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(16);
    // doc.text("Metadatenblatt", 70, 6);

    //insert logo
    var img = new Image();
    var subPath = location.pathname;
    img.src = subPath + 'logos/KM_Logo1.png';
    doc.addImage(img, 'PNG', 193, 5, 12, 12);

    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bolditalic', 'normal');
    var titleArray = doc.splitTextToSize("Indikator: " +indicator.indicatorName, 180);
    doc.text(titleArray, 14, 25);

    if (indicator.characteristicValue && indicator.characteristicValue != "-" && indicator.characteristicValue != "") {
      doc.setFontSize(14);
      doc.text(indicator.characteristicValue, 14, 25);
    }


    doc.setFontSize(11);

    var initialStartY = 30;

    if (titleArray.length > 1) {
      titleArray.forEach(function (item) {
        initialStartY += 5;
      });
    }
    if (indicator.characteristicValue && indicator.characteristicValue != "-" && indicator.characteristicValue != "") {
      initialStartY += 5;
    }

    var headStyles = {
      fontStyle: 'bold',
      fontSize: 12,
      fillColor: '#337ab7',
      // auto or wrap
      cellWidth: 'auto'
    };

    var bodyStyles = {
      fontStyle: 'normal',
      fontSize: 11,
      // auto or wrap or number
      cellWidth: 'auto'
    };

    // first column with fixed width
    var columnStyles = {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { fontStyle: 'normal' }
    };

    var topicsString = "";

    var topicReferenceId = indicator.topicReference;

    // will be an array representing the topic hierarchy
    // i.e. [mainTopic, subTopicFirstTier, subTopicSecondTier, ...]
    var topicHierarchyArray = this.getTopicHierarchyForTopicId(topicReferenceId);

    for (let index = 0; index < topicHierarchyArray.length; index++) {
      if (index === 0) {
        // mainTopic --> first tier
        topicsString += topicHierarchyArray[index].topicName;
      }
      else {
        var numberOfWhitespaces = 2 * index;
        var whitespaceString = "";
        for (let k = 0; k < numberOfWhitespaces; k++) {
          whitespaceString += " ";
        }
        topicsString += whitespaceString + topicHierarchyArray[index].topicName;
      }

      if (index < topicHierarchyArray.length - 1) {
        topicsString += "\n";
      }

    }

    var category = "Basisindikator";
    if (indicator.isHeadlineIndicator) {
      category = "Leitindikator";
    }

    // Or JavaScript:
    doc.autoTable({
      head: [['Themenfeld', 'Kategorie', 'Typ', 'Kennzeichen']],
      body: [
        [topicsString, category, this.getIndicatorStringFromIndicatorType(indicator.indicatorType), indicator.abbreviation ? indicator.abbreviation : "-"]
        // ...
      ],
      theme: 'grid',
      headStyles: headStyles,
      bodyStyles: bodyStyles,
      startY: initialStartY
    });

    var linkedIndicatorsString = "";

    if (indicator.referencedIndicators && indicator.referencedIndicators.length > 0){
      for (var [index, linkedIndicator] of indicator.referencedIndicators.entries()) {
      linkedIndicatorsString += linkedIndicator.referencedIndicatorName + " - \n   " + linkedIndicator.referencedIndicatorDescription;

      if (index < indicator.referencedIndicators.length - 1) {
        linkedIndicatorsString += "\n\n";
      }
    }
    }
    

    if (linkedIndicatorsString === "") {
      linkedIndicatorsString = "-";
    }

    var linkedGeoresourcesString = "";

    if (indicator.referencedGeoresources && indicator.referencedGeoresources.length > 0){
      for (var [k, linkedGeoresource] of indicator.referencedGeoresources.entries()) {
      linkedGeoresourcesString += linkedGeoresource.referencedGeoresourceName + " - \n   " + linkedGeoresource.referencedGeoresourceDescription;

      if (k < indicator.referencedGeoresources.length - 1) {
        linkedGeoresourcesString += "\n\n";
      }
    }
    }
    

    if (linkedGeoresourcesString === "") {
      linkedGeoresourcesString = "-";
    }

    // doc.autoTable({
    //     head: [],
    //     body: [
    //         ["Beschreibung", indicator.metadata.description],
    //         ["Maßeinheit", indicator.unit],
    //         ["Definition des Leitindikators", "-"],
    //         ["Klassifizierung", "-"],
    //         ["Interpretation", "-"],
    //         ["Verknüpfte Indikatoren", linkedIndicatorsString],
    //         ["Verknüpfte Geodaten", linkedGeoresourcesString]
    //         // ...
    //     ],
    //     startY: doc.autoTable.previous.finalY + 20,
    // });

    var spatialUnitsString = "";
    var processedSpatialUnits = 0;

    for (var availableSpatialUnit of this.availableSpatialUnits) {

      for (var applicableSpatialUnit of indicator.applicableSpatialUnits) {

        if (availableSpatialUnit.spatialUnitLevel === applicableSpatialUnit.spatialUnitName) {
          spatialUnitsString += applicableSpatialUnit.spatialUnitName;
          processedSpatialUnits++;

          if (processedSpatialUnits < indicator.applicableSpatialUnits.length) {
            spatialUnitsString += "\n";
          }
        }

      }
    }

    var datesString = "";

    if(indicator.applicableDates.length <= 20){
      for (var [j, date] of indicator.applicableDates.entries()) {
        var asDate = new Date(date);

        datesString += this.tsToDate_withOptionalUpdateInterval(this.dateToTS(asDate), indicator.metadata.updateInterval);

        if (j < indicator.applicableDates.length - 1) {
          datesString += "    ";
        }
      }
    }
    else{
      datesString += "Zeitreihe umfasst insgesamt " + indicator.applicableDates.length + " Zeitpunkte\n\n";

      datesString += "frühester Zeitpunkt: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(indicator.applicableDates[0]), indicator.metadata.updateInterval) + "\n";
      datesString += "spätester Zeitpunkt: " + this.tsToDate_withOptionalUpdateInterval(this.dateToTS(indicator.applicableDates[indicator.applicableDates.length - 1]), indicator.metadata.updateInterval);
    
    }            

    var imgData;
    var imgWidth;
    var imgHeight;

    if(indicator.processDescription && indicator.processDescription.includes("$")){

      let node = document.querySelector("#indicatorProcessDescription");

      await domtoimage
      .toJpeg(node, { quality: 1.0 })
      .then(function (dataUrl) {
        imgData = dataUrl;
      })
      .catch(function (error) {
          console.error(error);
      });

      var dimensions:any = await this.getImageDimensions(imgData);
      imgWidth = dimensions.w;
      imgHeight = dimensions.h;
    }            

    doc.autoTable({
      head: [],
      body: [
        ["Beschreibung", indicator.metadata.description],
        ["Maßeinheit", indicator.unit],
        ["Methodik", indicator.processDescription ? indicator.processDescription : "-"],
        // ["Klassifizierung", "-"],
        ["Interpretation", indicator.interpretation ? indicator.interpretation : "-"],
        ["Tags", indicator.tags ? JSON.stringify(indicator.tags) : "-"],
        ["Verknüpfte Indikatoren", linkedIndicatorsString],
        ["Verknüpfte Geodaten", linkedGeoresourcesString]
      ],
      theme: 'grid',
      headStyles: headStyles,
      bodyStyles: bodyStyles,
      columnStyles: columnStyles,
      startY: doc.autoTable.previous.finalY + 10,
      willDrawCell: function(data) {
        if (imgData && data.row.index === 2 && data.column.index === 1 && data.cell.section === 'body') {                   
            data.row.height = 2.5 * data.cell.height;
            data.row.maxCellHeight = 2.5 * data.cell.height;
            data.cell.height = 2.5 * data.cell.height;
            data.cell.text = "";
        }
        if (imgData && data.row.index === 2 && data.column.index === 0 && data.cell.section === 'body') {                   
          data.row.height = 2.5 * data.cell.height;
          data.row.maxCellHeight = 2.5 * data.cell.height;
          data.cell.height = 2.5 * data.cell.height;
        }
      },
      didDrawCell: function(data) {
        if (imgData && data.row.index === 2 && data.column.index === 1 && data.cell.section === 'body') {
            var cellHeight = data.cell.height - data.cell.padding('vertical');
            var cellWidth = data.cell.width - data.cell.padding('horizontal');                   

            var imgScale = cellHeight / imgHeight;
            var width = imgWidth * imgScale;
            if (width > cellWidth){
              width = cellWidth;
            }

            doc.addImage(imgData, "PNG", data.cell.x,  data.cell.y, width, cellHeight);
        }
      }
    });

    // // linked elements
    // doc.autoTable({
    //     head: [],
    //     body: [
    //         ["Verknüpfte Indikatoren", linkedIndicatorsString],
    //         ["Verknüpfte Geodaten", linkedGeoresourcesString]
    //     ],
    //     theme: 'grid',
    //     headStyles: headStyles,
    //     bodyStyles: bodyStyles,
    //     columnStyles: columnStyles,
    //     startY: doc.autoTable.previous.finalY + 10
    // });

    // linked elements
    doc.autoTable({
      head: [],
      body: [
        ["Datengrundlage", indicator.metadata.databasis ? indicator.metadata.databasis : "-"],
        ["Datenquelle", indicator.metadata.datasource ? indicator.metadata.datasource : "-"],
        ["Datenhalter und Kontakt", indicator.metadata.contact ? indicator.metadata.contact : "-"],
        ["Bemerkung", indicator.metadata.note ? indicator.metadata.note : "-"],
        ["Raumbezug", spatialUnitsString],
        // $scope.updateInteval is a map mapping the english KEYs to german expressions
        ["Zeitbezug / Fortführungsintervall", this.updateInterval.get(indicator.metadata.updateInterval.toUpperCase())],
        ["Hinweise zum Referenzdatum", indicator.referenceDateNote ? indicator.referenceDateNote : "-"],
        ["Verfügbare Zeitreihen", datesString],
        ["Datum der letzten Aktualisierung", this.tsToDate_withOptionalUpdateInterval(this.dateToTS(indicator.metadata.lastUpdate))],
        ["Quellen / Literatur", indicator.metadata.literature ? indicator.metadata.literature : "-"]
      ],
      theme: 'grid',
      headStyles: headStyles,
      bodyStyles: bodyStyles,
      columnStyles: columnStyles,
      startY: doc.autoTable.previous.finalY + 10
    });

    //
    // doc.autoTable({
    //     head: [],
    //     body: [
    //         ["Quellen / Literatur", indicator.metadata.literature ? indicator.metadata.literature : "-"]
    //         // ...
    //     ],
    //     theme: 'grid',
    //     headStyles: headStyles,
    //     bodyStyles: bodyStyles,
    //     columnStyles: columnStyles,
    //     startY: doc.autoTable.previous.finalY + 10
    // });

    return doc;
  }
  
  getImageDimensions(file) {
    return new Promise (function (resolved, rejected) {
      var i = new Image();
      i.onload = function(){
        resolved({w: i.width, h: i.height})
      };
      i.src = file;
    });
  }

  getIndicatorStringFromIndicatorType(indicatorType) {
    var indicatorTypeString;

    for (const indicatorTypeOption of this.indicatorTypeOptions) {
      if (indicatorType.includes(indicatorTypeOption.apiName)) {
        indicatorTypeString = indicatorTypeOption.displayName;
        break;
      }
    }

    return indicatorTypeString;
  }

  tsToDate_withOptionalUpdateInterval(ts, updateIntervalApiName:any = undefined) {
    if(ts){
      var date = new Date(ts);

      /**
      * TODO FIXME dateSLider formatter will return only year for now to prevent misleading month and day settings
      */

      // return date.getFullYear();

      if(updateIntervalApiName){
        if(updateIntervalApiName.toLowerCase() === "yearly"){
          return date.getFullYear();
        }
        else if(updateIntervalApiName.toLowerCase() === "half_yearly"){
          return (date.getMonth() + 1) + "/" +  date.getFullYear();                
        }
        else if(updateIntervalApiName.toLowerCase() === "monthly"){
          return (date.getMonth() + 1) + "/" +  date.getFullYear();
        }
        // else if(updateIntervalApiName.toLowerCase() === "weekly"){
        //   return date.toLocaleDateString("de-DE", {
        //     year: 'numeric',
        //     month: 'short',
        //     day: 'numeric'
        //   });
        // }
        // else if(updateIntervalApiName.toLowerCase() === "daily"){
        //   return date.toLocaleDateString("de-DE", {
        //     year: 'numeric',
        //     month: 'short',
        //     day: 'numeric'
        //   });
        // }
        else if(updateIntervalApiName.toLowerCase() === "quarterly"){
          var year = date.getFullYear();
          var month = date.getMonth();
          if(month < 4){
            return "Q1/" + year;
          }
          else if(month < 7){
            return "Q2/" + year;
          }
          else if(month < 10){
            return "Q3/" + year;
          }
          else {
            return "Q4/" + year;
          }
        }
        else{
          // includes daily and weekly, as they are presented equally
          return date.toLocaleDateString("de-DE", {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
      else{
        return date.toLocaleDateString("de-DE", {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

    } else
      return '';       
  }

  getTopicHierarchyForTopicId(topicReferenceId){
    // create an array respresenting the topic hierarchy
    // i.e. [mainTopic_firstTier, subTopic_secondTier, subTopic_thirdTier, ...]
    var topicHierarchyArray:any[] = [];

    for (var i = 0; i < this.availableTopics.length; i++) {

      var mainTopicCandidate = this.availableTopics[i];

      if(mainTopicCandidate.topicId === topicReferenceId){
        topicHierarchyArray.push(mainTopicCandidate);
        break;
      }

      else if(this.findIdInAnySubTopicHierarchy(topicReferenceId, mainTopicCandidate.subTopics)){
        topicHierarchyArray.push(mainTopicCandidate);
        topicHierarchyArray = this.addSubTopicHierarchy(topicHierarchyArray, topicReferenceId, mainTopicCandidate.subTopics);
      }
    }

    return topicHierarchyArray;
  }

  addSubTopicHierarchy(topicHierarchyArray, topicReferenceId, subTopicsArray){
    for (let index = 0; index < subTopicsArray.length; index++) {
      const subTopicCandidate = subTopicsArray[index];

      if(subTopicCandidate.topicId === topicReferenceId){
        topicHierarchyArray.push(subTopicCandidate);
        break;
      }

      else if(this.findIdInAnySubTopicHierarchy(topicReferenceId, subTopicCandidate.subTopics)){
        topicHierarchyArray.push(subTopicCandidate);
        topicHierarchyArray = this.addSubTopicHierarchy(topicHierarchyArray, topicReferenceId, subTopicCandidate.subTopics);
      }
    }

    return topicHierarchyArray;
  }

  findIdInAnySubTopicHierarchy(topicReferenceId, subTopicsArray){
    for (let index = 0; index < subTopicsArray.length; index++) {
      const subTopicCandidate = subTopicsArray[index];

      if(subTopicCandidate.topicId === topicReferenceId){
        return true;
      }

      else if(this.findIdInAnySubTopicHierarchy(topicReferenceId, subTopicCandidate.subTopics)){
        return true;
      }
    }

    return false;
  }

  async generateAndDownloadIndicatorZIP(indicatorData, fileName, fileEnding, jsZipOptions){
    // generate metadata file and include actual dataset and metadata file in download

    var metadataPdf = await this.generateIndicatorMetadataPdf_asBlob();							
    var zip = new JSZip();
    zip.file(fileName + fileEnding, indicatorData, jsZipOptions);
    zip.file(fileName + "_Metadata.pdf", metadataPdf);
    zip.generateAsync({type:"blob"}).then((content) => {
      // see FileSaver.js
      saveAs(content, fileName + ".zip");
    });
  }
  
  async generateIndicatorMetadataPdf_asBlob(){
    // create PDF from currently selected/displayed indicator!
    var indicatorMetadata = this.selectedIndicator;
    var pdfName = indicatorMetadata.indicatorName + ".pdf";
    var jspdf = await this.generateIndicatorMetadataPdf(indicatorMetadata, pdfName);							
    return jspdf.output("blob", {filename: pdfName});
  }

  async generateIndicatorMetadataPdf(indicatorMetadata, pdfName){																					
    var jspdf = await this.createMetadataPDF_indicator(indicatorMetadata);

    jspdf.setProperties({
    title: 'KomMonitor Indikatorenblatt',
    subject: pdfName,
    author: 'KomMonitor',
    keywords: 'Indikator, Metadatenblatt',
    creator: 'KomMonitor'
    });
    return jspdf;
  }

  getIndicatorValue_asFormattedText(indicatorValue, precision = undefined){

    var maximumDecimals = this.defaultNumberOfDecimals;
    var minimumDecimals = 0;
    if (precision !== undefined) {
      maximumDecimals = precision;
      minimumDecimals = precision;
    } else {
      if (this.selectedIndicator && this.selectedIndicator.precision!==null) {
        maximumDecimals = this.selectedIndicator.precision;
        minimumDecimals = this.selectedIndicator.precision;
      }
    }
    

    var value;
    if(this.indicatorValueIsNoData(indicatorValue)){
      value = "NoData";
    }
    else{
      value = Number(indicatorValue).toLocaleString('de-DE', {maximumFractionDigits: maximumDecimals, minimumFractionDigits: minimumDecimals});
    }
    
    // if the original value is greater than zero but would be rounded as 0 then we must return the original result
    if(Number(value) == 0 && indicatorValue > 0){
      value = Number(indicatorValue).toLocaleString('de-DE', {minimumFractionDigits: minimumDecimals, maximumFractionDigits: maximumDecimals});
    } 

    return value;
  }

  dateToTS(date) {
    if(date){
      return date.valueOf();
    }
  }

  displayMapApplicationError(error){
    setTimeout(() => {
        if(error.data){							
          this.errorMessage = this.syntaxHighlightJSON(error.data);
        }
        if(error.message){							
          this.errorMessage = this.syntaxHighlightJSON(error.message);
        }
        else{
          this.errorMessage = this.syntaxHighlightJSON(error);
        }

        // $rootScope.$apply();
        this.broadcastService.broadcast("hideLoadingIconOnMap");

        $(".mapApplicationErrorAlert").show();
      }, 1000);
  }

  syntaxHighlightJSON = function(json) {
      if (typeof json != 'string') {
            json = JSON.stringify(json, undefined, 2);
      }
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
          var cls = 'number';
          if (/^"/.test(match)) {
              if (/:$/.test(match)) {
                  cls = 'key';
              } else {
                  cls = 'string';
              }
          } else if (/true|false/.test(match)) {
              cls = 'boolean';
          } else if (/null/.test(match)) {
              cls = 'null';
          }
          return '<span class="' + cls + '">' + match + '</span>';
      });
  }

  getBaseUrlToKomMonitorDataAPI_spatialResource (){
    return this.baseUrlToKomMonitorDataAPI + this.cacheHelperService.spatialResourceGETUrlPath_forAuthentication;
  }    

  onChangeIndicatorKeywordFilter(indicatorNameFilter){
    this.displayableIndicators_keywordFiltered = JSON.parse(JSON.stringify(this.displayableIndicators));

    if(indicatorNameFilter && indicatorNameFilter != "") {
      this.displayableIndicators_keywordFiltered = this.filterArrayObjectsByValue(this.displayableIndicators_keywordFiltered, indicatorNameFilter);									
    }

    this.buildTopicIndicatorHierarchy();
    this.buildHeadlineIndicatorHierarchy();
    this.buildComputationIndicatorHierarchy();             
  }

  filterArrayObjectsByValue(array, string) {
    return array.filter(o => { 
      return Object.keys(o).some(k => { 
        if (typeof o[k] === 'string') 
          return o[k].toLowerCase().includes(string.toLowerCase()); 
      }); 
    });
  }

  onChangeGeoresourceKeywordFilter(georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS){    

    //this.wmsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wmsDatasets));
    this.wmsDatasets_keywordFiltered = this.getAvailableGeoWmsDatasets();
    this.wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));

    this.displayableGeoresources_keywordFiltered = JSON.parse(JSON.stringify(this.displayableGeoresources));

    if(georesourceNameFilter && georesourceNameFilter != ""){
      this.displayableGeoresources_keywordFiltered = this.filterArrayObjectsByValue(this.displayableGeoresources_keywordFiltered, georesourceNameFilter);									
      
      this.wmsDatasets_keywordFiltered = this.filterArrayObjectsByValue(this.wmsDatasets_keywordFiltered, georesourceNameFilter);
      this.wfsDatasets_keywordFiltered = this.filterArrayObjectsByValue(this.wfsDatasets_keywordFiltered, georesourceNameFilter);
    }

    this.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay = {
      poiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isPOI),
      loiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isLOI),
      aoiData: this.displayableGeoresources_keywordFiltered.filter(item => item.isAOI),
      wmsData: this.wmsDatasets_keywordFiltered,
      wfsData: this.wfsDatasets_keywordFiltered
    };

    if(!showWMS){
      this.wmsDatasets_keywordFiltered = [];
    }
    if(!showWFS){
      this.wfsDatasets_keywordFiltered = [];
    }

    if(! (showPOI && showLOI && showAOI)){
      this.displayableGeoresources_keywordFiltered = this.displayableGeoresources_keywordFiltered.filter(item => {
        if (! showPOI && item.isPOI){
          return false;
        }
        if (! showLOI && item.isLOI){
          return false;
        }

        if (! showAOI && item.isAOI){
          return false;
        }

        return true;
      });
    }

    this.buildTopicGeoresourceHierarchy();          
  }

  getGeoresourceDatasets(topic, georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS){
    var availableGeoresources:any = this.getAvailableGeoresources(topic, georesourceNameFilter, showPOI, showLOI, showAOI); 
    var wmsDatasets = this.getAvailableTopicWmsDatasets(topic, georesourceNameFilter, showWMS);
    var wfsDatasets = this.getAvailableWfsDatasets(topic, georesourceNameFilter, showWFS);
    
    var datasets = availableGeoresources.concat(wmsDatasets).concat(wfsDatasets);
    return datasets;
  }

  getAvailableWfsDatasets(topic, georesourceNameFilter, showWFS){
    if(!showWFS){
      return [];
    }

    var wfsDatasets:any[] = [];

    var filteredWfsDatasets = this.wfsDatasets;
    
    if(georesourceNameFilter && georesourceNameFilter != ""){
      filteredWfsDatasets = this.filterArrayObjectsByValue(filteredWfsDatasets, georesourceNameFilter);									
    }
    
    for (const wfsMetadata of filteredWfsDatasets) {
      if (this.topicHierarchyContainsWms(topic, wfsMetadata)){
        wfsDatasets.push(wfsMetadata);
      }
    }

    return wfsDatasets;
  }

  getAvailableTopicWmsDatasets(topic, georesourceNameFilter, showWMS){
    if(!showWMS){
      return [];
    }

    var wmsDatasets:any[] = [];

    var filteredWmsDatasets = this.getAvailableGeoWmsDatasets();
    
    if(georesourceNameFilter && georesourceNameFilter != ""){
      filteredWmsDatasets = this.filterArrayObjectsByValue(filteredWmsDatasets, georesourceNameFilter);									
    }
    
    for (const wmsMetadata of filteredWmsDatasets) {
      if (this.topicHierarchyContainsWms(topic, wmsMetadata)){
        wmsDatasets.push(wmsMetadata);
      }
    }

    return wmsDatasets;
  }

  topicHierarchyContainsGeoresource(topic, georesourceMetadata){
    // luckily, the topicReference is defined exactly like for indicators
    // hence we can simply refer to that method

    return this.topicHierarchyContainsIndicator(topic, georesourceMetadata);
  };

  topicHierarchyContainsWms(topic, wmsMetadata){
    // luckily, the topicReference is defined exactly like for indicators
    // hence we can simply refer to that method

    return this.topicHierarchyContainsIndicator(topic, wmsMetadata);
  };

  topicHierarchyContainsWfs(topic, wfsMetadata){
    // luckily, the topicReference is defined exactly like for indicators
    // hence we can simply refer to that method

    return this.topicHierarchyContainsIndicator(topic, wfsMetadata);
  }

  topicHierarchyContainsIndicator(topic, indicatorMetadata){
    if(topic === null || topic === ""){
      if (indicatorMetadata.topicReference === null || indicatorMetadata.topicReference === "" || ! this.referencedTopicIdExists(indicatorMetadata.topicReference)){
        return true;
      }
      else{
        return false;
      }
    }

    if (topic.topicId === indicatorMetadata.topicReference){
      return true;
    }
    else{
      return this.anySubTopicContainsIndicator(topic, indicatorMetadata);
    }
  };

  anySubTopicContainsIndicator(topic, indicatorMetadata){
    var isContained = false;

    for (const subTopic of topic.subTopics) {
      isContained = this.topicHierarchyContainsIndicator(subTopic, indicatorMetadata);

      if(isContained){
        break;
      }
    }

    return isContained;
  }

  filterByGeoresourceNamesToHide(filteredGeoresources){

    return filteredGeoresources.filter(georesourceMetadata => { 
      return this.isDisplayableGeoresource(georesourceMetadata);
    });
  }

  getAvailableGeoresources(topic, georesourceNameFilter, showPOI, showLOI, showAOI){
    var georesources:any[] = [];

    var filteredGeoresources = this.availableGeoresources;

    filteredGeoresources = this.filterByGeoresourceNamesToHide(filteredGeoresources);
    
    if(georesourceNameFilter && georesourceNameFilter != ""){
      filteredGeoresources = this.filterArrayObjectsByValue(filteredGeoresources, georesourceNameFilter);									
    }

    filteredGeoresources = this.filterGeoresourcesByTypes(filteredGeoresources, showPOI, showLOI, showAOI);
    
    for (const georesourceMetadata of filteredGeoresources) {              
      if (this.topicHierarchyContainsGeoresource(topic, georesourceMetadata)){
        georesources.push(georesourceMetadata);
      }
    }

    return georesources;
  }

  filterGeoresourcesByTypes(georesourceMetadataArray, showPOI, showLOI, showAOI){

    if(!showPOI && !showLOI && !showAOI){
      return [];
    }

    return georesourceMetadataArray.filter(georesourceMetadata => { 
      if(georesourceMetadata.isPOI){
        if(showPOI){
          return true;
        }
        else{
          return false;
        }
      }
      else if(georesourceMetadata.isLOI){
        if(showLOI){
          return true;
        }
        else{
          return false;
        }
      }
      else if(georesourceMetadata.isAOI){
        if(showAOI){
          return true;
        }
        else{
          return false;
        }
      }
      else{
        return false;
      }
    });
  }

  referencedTopicIdExists(topicId){
    var topicHierarchy = this.getTopicHierarchyForTopicId(topicId);

    if(topicHierarchy.length === 0){
      return false;
    }
    else{
      return true;
    }
  }

  removeAoiGeoresource(aoiGeoresource) {
    //return this.ajskommonitorDataExchangeServiceeProvider.removeAoiGeoresource(aoiGeoresource);
  }

  getIndicatorValue_asNumber(indicatorValue, precision = undefined){

    var maximumDecimals = this.defaultNumberOfDecimals;
    if (precision !== undefined) {
      maximumDecimals = precision
    } else {
      if(this.selectedIndicator && this.selectedIndicator.precision!==null)
        maximumDecimals = this.selectedIndicator.precision;
    }

    var value;
    if(this.indicatorValueIsNoData(indicatorValue)){
      value = "NoData";
    }
    else{ 
      value = +(Number(indicatorValue)).toFixed(maximumDecimals);
      // value = +Number(indicatorValue).toFixed(numberOfDecimals);
    }
    
    // if the original value is greater than zero but would be rounded as 0 then we must return the original result
    if(Number(value) == 0 && indicatorValue > 0){
      value = Number(indicatorValue);
    } 

    return value;
  }

  getIndicatorValueFromArray_asNumber(propertiesArray, targetDateString, precision = undefined){
    if(!targetDateString.includes(this.DATE_PREFIX)){
      targetDateString = this.DATE_PREFIX + targetDateString;
    }
    var indicatorValue = propertiesArray[targetDateString];
    var value;
    if(this.indicatorValueIsNoData(indicatorValue)){
      value = "NoData";
    }
    else{
      value = this.getIndicatorValue_asNumber(indicatorValue, precision);
    }

    return value;
  }

  setAllFeaturesProperty(indicatorMetadataAndGeoJSON, propertyName){
    let sum = 0;
    let count = 0;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    for (const feature of indicatorMetadataAndGeoJSON.geoJSON.features) {
      if(! this.indicatorValueIsNoData(feature.properties[propertyName])){
        let value = this.getIndicatorValueFromArray_asNumber(feature.properties, propertyName)
        sum += value;
        if (value < min) min = value;
        if (value > max) max = value;
        count++;
      }
    }

    this.allFeaturesPropertyUnit = indicatorMetadataAndGeoJSON.unit;
    this.allFeaturesNumberOfFeatures = count;
    this.allFeaturesSum = sum;
    // no division by zero
    if (count > 0) 
    this.allFeaturesMean = sum / count;
    else 
      this.allFeaturesMean = 0;
    this.allFeaturesMin = min;
    this.allFeaturesMax = max;

    this.allFeaturesRegionalSum = undefined;
    this.allFeaturesRegionalMean = undefined;
    this.allFeaturesRegionalSpatiallyUnassignable = undefined;

    if (indicatorMetadataAndGeoJSON.regionalReferenceValues){
      for (const regionalReferenceValuesEntry of indicatorMetadataAndGeoJSON.regionalReferenceValues) {
        if (regionalReferenceValuesEntry.referenceDate && regionalReferenceValuesEntry.referenceDate == this.selectedDate){
          this.allFeaturesRegionalSum = regionalReferenceValuesEntry.regionalSum;
          this.allFeaturesRegionalMean = regionalReferenceValuesEntry.regionalAverage;
          this.allFeaturesRegionalSpatiallyUnassignable = regionalReferenceValuesEntry.spatiallyUnassignable;
        }
      }
    }
    
  }
  
  setSelectedFeatureProperty(selectedFeaturesMap, propertyName) {
    let sum = 0;
    let count = 0
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    
    selectedFeaturesMap.forEach((feature, key, map) => {
      if(! this.indicatorValueIsNoData(feature.properties[propertyName])){
        let value = this.getIndicatorValueFromArray_asNumber(feature.properties, propertyName);
        sum += value;
        if (value < min) min = value;
        if (value > max) max = value;
        count++;
      }
    });

    if(count === 0) {
      // no feature selected, overwrite initial values for min and max
      min = 0;
      max = 0;
    }
    

    this.selectedFeaturesNumberOfFeatures = count;
    this.selectedFeaturesSum = sum;
    // no division by zero
    if (count > 0) 
      this.selectedFeaturesMean = sum / count;
    else 
      this.selectedFeaturesMean = 0;
    this.selectedFeaturesMin = min;
    this.selectedFeaturesMax = max;
  }
  
  selectedSpatialUnitIsRaster(){
    var spatialUnitName = this.selectedSpatialUnit ? this.selectedSpatialUnit.spatialUnitLevel : "";

    return (spatialUnitName.includes("raster") || spatialUnitName.includes("Raster") || spatialUnitName.includes("RASTER") || spatialUnitName.includes("grid") || spatialUnitName.includes("GRID") || spatialUnitName.includes("Grid"));
  }

  async generateAndDownloadGeoresourceZIP(georesourceMetadata, georesourceData, fileName, fileEnding, jsZipOptions){
    // generate metadata file and include actual dataset and metadata file in download
    
    var metadataPdf = await this.generateGeoresourceMetadataPdf_asBlob(georesourceMetadata);							
    var zip = new JSZip();
    zip.file(fileName + fileEnding, georesourceData, jsZipOptions);
    zip.file(fileName + "_Metadata.pdf", metadataPdf);
    zip.generateAsync({type:"blob"})
    .then(function(content) {
      // see FileSaver.js
      saveAs(content, fileName + ".zip");
    });
  }

  async generateGeoresourceMetadataPdf_asBlob(georesourceMetadata){            
    var pdfName = georesourceMetadata.datasetName + ".pdf";
    var jspdf = await this.createMetadataPDF_georesource(georesourceMetadata, pdfName);							
    return jspdf.output("blob", {filename: pdfName});
  }

  createDualListInputArray(array, nameProperty, idProperty):any[] {
    /* return this.ajskommonitorDataExchangeServiceeProvider.createDualListInputArray(areaNames, name, id);*/
    var result:any[] = [];

    if(array && Array.isArray(array)){
      for (var i=0;i<array.length;i++) {
        var obj = {};
        obj["category"] = array[i][nameProperty];
        obj["name"] = array[i][nameProperty];
        if(idProperty && array[i][idProperty]!==undefined){
          obj["id"] = array[i][idProperty];
        }
        result.push(obj);
      }
    }
    
    return result;
  }

  onRemovedFeatureFromSelection([selectedIndicatorFeatureIds]) {
    let propertyName = this.buildIndicatorPropertyName();

    setTimeout(() => {
      this.setSelectedFeatureProperty(selectedIndicatorFeatureIds, propertyName);
    });
  }

  buildIndicatorPropertyName() {
    const INDICATOR_DATE_PREFIX = window.__env.indicatorDatePrefix;
    let propertyName = INDICATOR_DATE_PREFIX + this.selectedDate;
    return propertyName;
  }

  formatIndicatorNameForLabel(indicatorName, maxCharsPerLine){
    var arr:any[] = [];
    var space = /\s/;
  
    const words = indicatorName.split(space);
    // push first word into new array
    if (words[0].length) {
      arr.push(words[0]);
    }
  
    for (let i = 1; i < words.length; i++) {
      if (words[i].length + arr[arr.length - 1].length < maxCharsPerLine) {
        arr[arr.length - 1] = `${arr[arr.length - 1]} ${words[i
                  ]}`;
      } 
      else {
        arr.push(words[i]);
      }
    }
    return arr.join("\n");
  }

  filterIndicators(){
    return ( item ) => {

      return this.isDisplayableIndicator(item);
    };
  }

  tryLogoutUser() {
    this.authService.Auth.keycloak.logout();
  }

  extendKeycloakSession() {
    // Auth.keycloak.updateToken(5).then(function () {
    //   console.log("keycloak token refreshed.");
    // }).catch(function () {
    //   console.error('Failed to refresh token. Will redirect to Login screen');
    //   Auth.keycloak.login();
    // });

    this.authService.Auth.keycloak.login();
  }

  isDisplayableGeoresource(item){
    var arrayOfNameSubstringsForHidingGeoresources = window.__env.arrayOfNameSubstringsForHidingGeoresources;

    if(item.availablePeriodsOfValidity == undefined || item.availablePeriodsOfValidity.length === 0)
      return false;

      var isGeoresourceThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingGeoresources.some(substring => String(item.datasetName).includes(substring));

      if(isGeoresourceThatShallNotBeDisplayed){
        return false;
      }
    return true;
  }

  getIndicatorValue_asFixedPrecisionNumber(indicatorValue, precision){

    var maximumDecimals = this.defaultNumberOfDecimals;
    var minimumDecimals = 0;
    if (precision !== undefined) {
      maximumDecimals = precision;
      minimumDecimals = precision;
    } else {
      if(this.selectedIndicator && this.selectedIndicator.precision!==null) {
        maximumDecimals = this.selectedIndicator.precision;
        minimumDecimals = this.selectedIndicator.precision;
      }
    }

    var value;
    if(this.indicatorValueIsNoData(indicatorValue)){
      value = "NoData";
    }
    else{ 
      // value = string with . as separator, without "," as thounsand-sep
      value = indicatorValue.toLocaleString('en-GB', {maximumFractionDigits: maximumDecimals, minimumFractionDigits: minimumDecimals}).replace(',','');
    }
    
    // if the original value is greater than zero but would be rounded as 0 then we must return the original result
    if(Number(value) == 0 && indicatorValue > 0){
      value = Number(indicatorValue);
    } 

    return value;
  }

  getIndicatorAbbreviationFromIndicatorId(indicatorId){
    for (var indicatorMetadata of this.availableIndicators) {
      if (indicatorMetadata.indicatorId === indicatorId){
        return indicatorMetadata.abbreviation;
      }
    }
  }

  
  checkCreatePermission(){    
      if(this.checkAdminPermission()) {
        return true;
      }
      
      for(const role of this.currentKeycloakLoginRoles){
        let roleNameParts = role.split(".");
        const permissionLevel = roleNameParts[roleNameParts.length - 1];
        if(permissionLevel === "client-resources-creator" || permissionLevel === "unit-resources-creator"){
          return true;
        }
      }
      return false;
    }

    checkEditorPermission(){
      if(this.checkAdminPermission()) {
        return true;
      }
        

      for(const role of this.currentKeycloakLoginRoles){
        let roleNameParts = role.split(".");
        const permissionLevel = roleNameParts[roleNameParts.length - 1];
        if(permissionLevel === "client-resources-creator" || permissionLevel === "unit-resources-creator"){
          return true;
        }
      }
      return false;
    }

    getRoleTitles(){

      return this.currentKeycloakLoginRoles.map(role => role.split('.')[role.split('.').length-1]);
    }

    checkGroupsEditPermission() {

      if(this.checkAdminPermission())
        return true;

      let splitRoles = this.getRoleTitles();
      let ret = false;

      window.__env.keycloakKomMonitorGroupsEditRoleNames.forEach(targetRole => {
        if(splitRoles.includes(targetRole))
          ret = true;
      });

      return ret;
    }

    checkThemesEditPermission() {

      if(this.checkAdminPermission())
        return true;

      let splitRoles = this.getRoleTitles();
      let ret = false;

      window.__env.keycloakKomMonitorThemesEditRoleNames.forEach(targetRole => {
        if(splitRoles.includes(targetRole))
          ret = true;
      });

      return ret;
    }

    checkResourcesEditPermission() {
      
      if(this.checkAdminPermission())
        return true;

      let splitRoles = this.getRoleTitles();
      let ret = false;

      window.__env.keycloakKomMonitorGeodataEditRoleNames.forEach(targetRole => {
        if(splitRoles.includes(targetRole))
          ret = true;
      });

      return ret;
    }

    setWmsLayerActive(dataset:WmsDataset) {
 
      this.wmsDatasets = this.wmsDatasets.map(e =>
        e.id === dataset.id
          ? { ...e, isSelected: true }
          : e
      );
    }
    
    setWmsLayerInactive(dataset:WmsDataset) {
      
      this.wmsDatasets = this.wmsDatasets.map(e =>
        e.id === dataset.id
          ? { ...e, isSelected: false }
          : e
      );
    }
}
