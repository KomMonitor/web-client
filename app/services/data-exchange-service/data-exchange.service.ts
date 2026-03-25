import { Injectable } from "@angular/core";
import { LOI_DASH_ARRAY_OBJECTS } from "./data-exchange.constants";
import { PdfExportService } from "services/pdf-export-service/pdf-export.service";
import {
  IndicatorsDataset,
  IndicatorsTopicsHierarchy,
} from "components/ngComponents/models/indicators.models";
import { EnvConfigService } from "services/env-config-service/env-config.service";
import { forkJoin } from "rxjs";
import { AuthService } from "services/auth-service/auth.service";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { CacheHelperServiceService } from "services/cache-helper-service/cache-helper.service";
import { TopicHierarchyService } from "services/topic-hierarchy-service/topic-hierarchy.service";
import {
  WmsResourceType,
  WmsDataset,
} from "components/ngComponents/models/services.models";
import { GeoresourcesDataset } from "components/ngComponents/models/georesources.models";
import { AccessControlMetadata } from "components/ngComponents/models/permissions.models";
import { KeycloakProfile } from "keycloak-js";
import { GeoresourcesImportDataset } from "components/ngComponents/userInterface/sidebar/kommonitorDataImport/kommonitor-data-import.component";

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
  providedIn: "root",
})
export class DataExchangeService {
  showDiagramExportButtons = true;
  showGeoresourceExportButtons = true;
  configMeanDataDisplay = this.envConfigService.configMeanDataDisplay || "both";

  selectedIndicator!: IndicatorsDataset;
  availableSpatialUnits: SpatialUnit[] = [];
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
  simplifyGeometriesParameterName: any;
  simplifyGeometries: any;
  FEATURE_NAME_PROPERTY_NAME: any;
  availableGeoresources: GeoresourcesDataset[] = [];
  availableIndicators: any = [];
  reachabilityScenarioOnMainMap: any;
  isochroneLegend: any = false;
  displayableGeoresources: any;
  adminUserName;
  adminPassword;
  adminIsLoggedIn;
  rangeFilterIsApplied: any;
  baseLayerDefinitionsArray!: any[];

  errorMessage = undefined;

  isRealmAdmin: boolean = false;
  currentKeycloakLoginGroupNames: any;

  // todo topics hirarchy interface ?!
  availableTopics: any[] = [];

  anySideBarIsShown = false;

  tmpIndicatorGeoJSON = undefined;

  wmsDatasets!: WmsDataset[];
  wfsDatasets = this.envConfigService.wfsDatasets.sort((a, b) =>
    a.title > b.title ? 1 : -1,
  );
  wmsDatasets_keywordFiltered!: WmsDataset[];
  wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));

  allFeaturesPropertyUnit;

  fileDatasets: GeoresourcesImportDataset[] = [];

  availablePermissions: any[] = [];
  availableUsers: any[] = [];
  availableProcessScripts: any[] = [];

  availableIndicators_map = new Map();
  availableGeoresources_map = new Map();
  availableSpatialUnits_map = new Map();
  availableProcessScripts_map = new Map();

  accessControl: any[] = [];
  accessControl_map = new Map();

  allowedAccessControl = [];

  topicIndicatorHierarchy_forOrderView: any[] = [];

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

  headlineIndicatorHierarchy: any[] = [];
  computationIndicatorHierarchy: any[] = [];
  topicIndicatorHierarchy: IndicatorsTopicsHierarchy[] = [];

  topicGeoresourceHierarchy: any[] = [];
  topicGeoresourceHierarchy_unmappedEntries: any = {};
  georesourceMapKey_forUnmappedTopicReferences = "unmapped";

  currentKeycloakLoginRoles: any[] = [];
  currentKomMonitorLoginRoleNames: any[] = [];
  currentKeycloakLoginGroups: any[] = [];
  currentKomMonitorLoginOrganizationalUnits: any[] = [];
  currentKeycloakUser!: KeycloakProfile;

  availableRoles: any[] = [];

  public constructor(
    private authService: AuthService,
    private cacheHelperService: CacheHelperServiceService,
    private broadcastService: BroadcastService,
    private topicHierarchyService: TopicHierarchyService,
    private envConfigService: EnvConfigService,
    private pdfExportService: PdfExportService,
  ) {}

  hideErrorAlert() {
    $(".mapApplicationErrorAlert").hide();
  }

  isAllowedSpatialUnitForCurrentIndicator(spatialUnitMetadata: any) {
    if (!this.selectedIndicator) {
      return false;
    }

    if (!spatialUnitMetadata || !spatialUnitMetadata.spatialUnitLevel) {
      return false;
    }

    var filteredApplicableUnits =
      this.selectedIndicator.applicableSpatialUnits.filter(function (
        applicableSpatialUnit: any,
      ) {
        if (
          applicableSpatialUnit.spatialUnitId ===
          spatialUnitMetadata.spatialUnitId
        ) {
          return true;
        } else {
          return false;
        }
      });

    return filteredApplicableUnits.length > 0;
  }

  async fetchAllMetadata(filter = undefined) {
    await this.cacheHelperService.init();
    console.log("fetching all metadata from management component");

    if (this.authService.isAuthenticated()) {
      const loadUser$ = this.authService.loadUserProfile();
      if (!loadUser$) {
        console.log("User profile is not available");
        return;
      }
      await loadUser$
        .then((profile) => {
          // set user profile
          this.currentKeycloakUser = profile;
          console.log("User logged in with email: " + profile.email);

          const tokenParsed = this.authService.getTokenParsed();
          if (
            tokenParsed &&
            tokenParsed.realm_access &&
            tokenParsed.realm_access.roles
          ) {
            this.currentKeycloakLoginRoles = tokenParsed.realm_access.roles;
            if (
              this.currentKeycloakLoginRoles.includes(
                this.envConfigService.keycloakKomMonitorAdminRoleName,
              )
            ) {
              this.isRealmAdmin = true;
              // this.currentKeycloakLoginRoles = this.currentKeycloakLoginRoles.concat(Auth.keycloak.tokenParsed.resource_access["realm-management"].roles);
            }
            if (tokenParsed["groups"]) {
              this.currentKeycloakLoginGroups = tokenParsed["groups"];
            }
            this.currentKeycloakLoginGroupNames =
              this.currentKeycloakLoginGroups.map(
                (groupPath) =>
                  groupPath.split("/")[groupPath.split("/").length - 1],
              );
          } else {
            this.currentKeycloakLoginRoles = [];
            this.currentKeycloakLoginGroups = [];
          }
        })
        .catch(function () {
          console.log("Failed to load user profile");
        });
      var promise = await this.fetchAccessControlMetadata(
        this.currentKeycloakLoginRoles,
      );
    }

    // revise metadata fecthing for protected endpoints
    forkJoin({
      // scriptsPromise: this.fetchIndicatorScriptsMetadata(),
      topicsPromise: this.fetchTopicsMetadata(this.currentKeycloakLoginRoles),
      spatialUnitsPromise: this.fetchSpatialUnitsMetadata(
        this.currentKeycloakLoginRoles,
      ),
      georesourcesPromise: this.fetchGeoresourcesMetadata(
        this.currentKeycloakLoginRoles,
        filter,
      ),
      indicatorsPromise: this.fetchIndicatorsMetadata(
        this.currentKeycloakLoginRoles,
        filter,
      ),
      servicePromises: this.fetchServices(
        this.currentKeycloakLoginRoles,
        filter,
      ),
    }).subscribe({
      next: (response: any) => {
        this.modifyIndicatorApplicableSpatialUnitsForLoginRoles();

        this.buildHeadlineIndicatorHierarchy();
        this.buildTopicIndicatorHierarchy();
        this.topicIndicatorHierarchy_forOrderView = JSON.parse(
          JSON.stringify(this.topicIndicatorHierarchy),
        );
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
      error: (error) => {
        // todo error handling
        this.displayMapApplicationError(
          "Beim Laden der erforderlichen Anwendungsdaten ist ein Fehler aufgetreten. Bitte wenden Sie sich an Ihren Administrator.",
        );
        this.broadcastService.broadcast("initialMetadataLoadingFailed", [
          error,
        ]);
      },
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

  async fetchTopicsMetadata(keycloakRolesArray) {
    this.setTopics(
      await this.cacheHelperService.fetchTopicsMetadata(keycloakRolesArray),
    );
  }

  async fetchSpatialUnitsMetadata(keycloakRolesArray) {
    this.setSpatialUnits(
      await this.cacheHelperService.fetchSpatialUnitsMetadata(
        keycloakRolesArray,
      ),
    );
  }

  async fetchGeoresourcesMetadata(keycloakRolesArray, filter) {
    this.setGeoresources(
      await this.cacheHelperService.fetchGeoresourceMetadata(
        keycloakRolesArray,
        filter,
      ),
    );
  }

  async fetchIndicatorsMetadata(keycloakRolesArray, filter: any = undefined) {
    this.setIndicators(
      await this.cacheHelperService.fetchIndicatorsMetadata(
        keycloakRolesArray,
        filter,
      ),
    );
  }

  async fetchIndicatorScriptsMetadata() {
    this.setProcessScripts(
      await this.cacheHelperService.fetchProcessScriptsMetadata(
        this.currentKeycloakLoginRoles,
      ),
    );
  }

  async fetchServices(keycloakRolesArray, filter = undefined) {
    this.setServices(
      await this.cacheHelperService.fetchServices(keycloakRolesArray, filter),
    );
  }

  async reinitServices(): Promise<void> {
    await this.fetchServices(this.currentKeycloakLoginRoles);
  }

  private setServices(servicesArray: WmsDataset[]) {
    this.availableWmsDatasets = servicesArray;

    this.wmsDatasets = servicesArray;
    this.wmsDatasets_keywordFiltered = servicesArray;
  }

  addSingleGeoresourceMetadata(georesourceMetadata) {
    this.availableGeoresources_map.set(
      georesourceMetadata.georesourceId,
      georesourceMetadata,
    );
    this.availableGeoresources = [
      georesourceMetadata,
      ...this.availableGeoresources,
    ];
  }

  replaceSingleGeoresourceMetadata(georesourceMetadata) {
    const index = this.availableGeoresources.findIndex(
      (g) => g.georesourceId === georesourceMetadata.georesourceId,
    );
    if (index !== -1) this.availableGeoresources[index] = georesourceMetadata;
    this.availableGeoresources_map.set(
      georesourceMetadata.georesourceId,
      georesourceMetadata,
    );
  }

  getLoiDashSvgFromStringValue(loiDashArrayString) {
    for (const loiDashArrayObject of LOI_DASH_ARRAY_OBJECTS) {
      if (loiDashArrayObject.dashArrayValue == loiDashArrayString) {
        return loiDashArrayObject.svgString;
      }
    }

    return "";
  }

  deleteSingleGeoresourceMetadata(georesourceId) {
    const index = this.availableGeoresources.findIndex(
      (g) => g.georesourceId === georesourceId,
    );
    if (index !== -1) this.availableGeoresources.splice(index, 1);
    this.availableGeoresources_map.delete(georesourceId);
  }

  setProcessScripts(scriptsArray) {
    this.availableProcessScripts_map = new Map(
      scriptsArray.map((s) => [s.scriptId, s]),
    );
    this.availableProcessScripts = Array.from(
      this.availableProcessScripts_map.values(),
    );
  }

  setIndicators(indicatorsArray) {
    this.availableIndicators = this.modifyIndicators(indicatorsArray);
    this.availableIndicators_map = new Map(
      this.availableIndicators.map((i) => [i.indicatorId, i]),
    );
  }

  getAvailableGeoWmsDatasets(): WmsDataset[] {
    return this.availableWmsDatasets.filter(
      (e) => e.serviceResource == WmsResourceType.GEORESOURCE,
    );
  }

  getAvailableIndiWmsDatasets(): WmsDataset[] {
    return this.availableWmsDatasets.filter(
      (e) => e.serviceResource == WmsResourceType.INDICATOR,
    );
  }

  setGeoresources(georesourcesArray) {
    // wms are not part of availableGeoresources anymore, maybe add again. But no use-case for the time beeing
    this.availableGeoresources_map = new Map(
      georesourcesArray.map((g) => [g.georesourceId, g]),
    );
    this.availableGeoresources = Array.from(
      this.availableGeoresources_map.values(),
    );

    this.displayableGeoresources = this.availableGeoresources.filter((item) =>
      this.isDisplayableGeoresource(item),
    );
    this.displayableGeoresources_keywordFiltered = JSON.parse(
      JSON.stringify(this.displayableGeoresources),
    );

    //this.wmsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wmsDatasets));
    this.wmsDatasets_keywordFiltered = this.getAvailableGeoWmsDatasets();
    this.wfsDatasets_keywordFiltered = JSON.parse(
      JSON.stringify(this.wfsDatasets),
    );

    this.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay = {
      poiData: this.displayableGeoresources_keywordFiltered.filter(
        (item) => item.isPOI,
      ),
      loiData: this.displayableGeoresources_keywordFiltered.filter(
        (item) => item.isLOI,
      ),
      aoiData: this.displayableGeoresources_keywordFiltered.filter(
        (item) => item.isAOI,
      ),
      wmsData: this.wmsDatasets_keywordFiltered,
      wfsData: this.wfsDatasets_keywordFiltered,
    };
    // ggf
    /*  wmsData: this.wmsDatasets_keywordFiltered,
      wfsData: this.wfsDat asets_keywordFiltered
                                    
      ggf in setServices auslagern, da beide requests parallel laufen und services evtl noch nicht verfügbar sind */

    var enabledGeoresources =
      this.envConfigService.enabledGeoresourcesInfrastructure.concat(
        this.envConfigService.enabledGeoresourcesGeoservices,
      );

    var showPOI = enabledGeoresources.indexOf("poi") !== -1;
    var showLOI = enabledGeoresources.indexOf("loi") !== -1;
    var showAOI = enabledGeoresources.indexOf("aoi") !== -1;
    var showWMS = enabledGeoresources.indexOf("wms") !== -1;
    var showWFS = enabledGeoresources.indexOf("wfs") !== -1;

    this.onChangeGeoresourceKeywordFilter(
      undefined,
      showPOI,
      showLOI,
      showAOI,
      showWMS,
      showWFS,
    );
  }

  setTopics(topicsArray) {
    this.availableTopics = topicsArray;
  }

  setSpatialUnits(spatialUnitsArray) {
    this.availableSpatialUnits_map = new Map(
      spatialUnitsArray.map((u) => [u.spatialUnitId, u]),
    );
    this.availableSpatialUnits = Array.from(
      this.availableSpatialUnits_map.values(),
    );
  }

  addSingleIndicatorMetadata(indicatorMetadata) {
    const modified = this.modifySingleIndicator(indicatorMetadata);
    this.availableIndicators = [modified, ...this.availableIndicators];
    this.availableIndicators_map.set(indicatorMetadata.indicatorId, modified);
  }

  replaceSingleIndicatorMetadata(indicatorMetadata) {
    const modified = this.modifySingleIndicator(indicatorMetadata);
    const index = this.availableIndicators.findIndex(
      (i) => i.indicatorId === indicatorMetadata.indicatorId,
    );
    if (index !== -1) this.availableIndicators[index] = modified;
    this.availableIndicators_map.set(indicatorMetadata.indicatorId, modified);
  }

  checkDeletePermission() {
    if (this.checkAdminPermission()) {
      return true;
    }

    for (const role of this.currentKeycloakLoginRoles) {
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (
        permissionLevel === "client-resources-creator" ||
        permissionLevel === "unit-resources-creator"
      ) {
        return true;
      }
    }
    return false;
  }

  getAllowedRolesString(allowedPermissionIds) {
    var permissions: any[] = [];
    for (const organizationalUnit of this.accessControl) {
      for (const permission of organizationalUnit.permissions) {
        if (allowedPermissionIds.includes(permission.permissionId)) {
          permissions.push(
            organizationalUnit.name + "-" + permission.permissionLevel,
          );
        }
      }
    }
    return permissions.join(", ");
  }

  getRoleTitle(organizationalUnitId) {
    var roles = this.accessControl.filter(
      (e) => e.organizationalUnitId == organizationalUnitId,
    );
    if (roles && roles.length > 0) {
      return roles[0].name;
    }
    return "";
  }

  getIndicatorMetadataById(indicatorId) {
    return this.availableIndicators_map.get(indicatorId);
  }

  getGeoresourceMetadataById(georesourceId) {
    return this.availableGeoresources_map.get(georesourceId);
  }

  getSpatialUnitMetadataById(spatialUnitId) {
    return this.availableSpatialUnits_map.get(spatialUnitId);
  }

  deleteSingleIndicatorMetadata(indicatorId) {
    const index = this.availableIndicators.findIndex(
      (i) => i.indicatorId === indicatorId,
    );
    if (index !== -1) this.availableIndicators.splice(index, 1);
    this.availableIndicators_map.delete(indicatorId);
  }

  modifySingleIndicator(indicator) {
    var temp = this.modifyIndicators([indicator]);
    return temp[0];
  }

  modifyIndicators(indicators) {
    var decimalDefault = 2;
    if (this.envConfigService.numberOfDecimals !== undefined)
      decimalDefault = this.envConfigService.numberOfDecimals;

    indicators.forEach((elem) => {
      if (elem.precision === null) {
        elem.precision = decimalDefault;
        elem.defaultPrecision = true;
      } else elem.defaultPrecision = false;
    });

    return indicators;
  }

  onMetadataLoadingCompleted() {
    this.broadcastService.broadcast("initialMetadataLoadingCompleted");

    setTimeout(() => {
      $("option").each(function (index, element) {
        var text = $(element).text();
        $(element).attr("title", text);
      });
    }, 1000);
  }

  private buildTopicGeoresourceHierarchy(filter: any = undefined) {
    const result = this.topicHierarchyService.buildTopicGeoresourceHierarchy(
      this.availableTopics,
      this.displayableGeoresources_keywordFiltered,
      this.wmsDatasets_keywordFiltered,
      this.wfsDatasets_keywordFiltered,
      this.georesourceMapKey_forUnmappedTopicReferences,
      filter,
    );
    this.topicGeoresourceHierarchy = result.hierarchy;
    this.topicGeoresourceHierarchy_unmappedEntries = result.unmappedEntries;
  }

  private buildComputationIndicatorHierarchy() {
    this.computationIndicatorHierarchy =
      this.topicHierarchyService.buildComputationIndicatorHierarchy(
        this.displayableIndicators_keywordFiltered,
        this.availableProcessScripts,
      );
  }

  private buildTopicIndicatorHierarchy() {
    this.topicIndicatorHierarchy =
      this.topicHierarchyService.buildTopicIndicatorHierarchy(
        this.availableTopics,
        this.displayableIndicators_keywordFiltered,
        this.getAvailableIndiWmsDatasets(),
      );
  }

  modifyIndicatorApplicableSpatialUnitsForLoginRoles() {
    var availableSpatialUnitNames: any[] = [];
    for (const spatialUnit of this.availableSpatialUnits) {
      availableSpatialUnitNames.push(spatialUnit.spatialUnitLevel);
    }
    for (const indicator of this.availableIndicators) {
      indicator.applicableSpatialUnits =
        indicator.applicableSpatialUnits.filter((applicableSpatialUnit) =>
          availableSpatialUnitNames.includes(
            applicableSpatialUnit.spatialUnitName,
          ),
        );
    }

    this.displayableIndicators = this.availableIndicators.filter((item) =>
      this.isDisplayableIndicator(item),
    );
    this.displayableIndicators_keywordFiltered = JSON.parse(
      JSON.stringify(this.displayableIndicators),
    );
  }

  isDisplayableIndicator(item) {
    // var arrayOfNameSubstringsForHidingIndicators = ["Standardabweichung", "Prozentuale Ver"];
    var arrayOfNameSubstringsForHidingIndicators =
      this.envConfigService.arrayOfNameSubstringsForHidingIndicators;

    // this is an item from i.e. indicatorRadar, that has a different structure
    if (item.indicatorMetadata) {
      if (
        item.indicatorMetadata.applicableDates == undefined ||
        item.indicatorMetadata.applicableDates.length === 0
      )
        return false;

      if (
        item.indicatorMetadata.applicableSpatialUnits == undefined ||
        item.indicatorMetadata.applicableSpatialUnits.length === 0
      )
        return false;

      var isIndicatorThatShallNotBeDisplayed =
        arrayOfNameSubstringsForHidingIndicators.some((substring) =>
          String(item.indicatorMetadata.indicatorName).includes(substring),
        );

      if (isIndicatorThatShallNotBeDisplayed) {
        return false;
      }

      //  if(! roleMappingAllowsDisplay(item.indicatorMetadata)){
      //    return false;
      //  }

      return true;
    } else {
      //
      if (
        item.applicableDates == undefined ||
        item.applicableDates.length === 0
      )
        return false;

      if (
        item.applicableSpatialUnits == undefined ||
        item.applicableSpatialUnits.length === 0
      )
        return false;

      // var isIndicatorThatShallNotBeDisplayed = item.indicatorName.includes("Standardabweichung") || item.indicatorName.includes("Prozentuale Ver");
      var isIndicatorThatShallNotBeDisplayed =
        arrayOfNameSubstringsForHidingIndicators.some((substring) =>
          String(item.indicatorName).includes(substring),
        );

      if (isIndicatorThatShallNotBeDisplayed) {
        return false;
      }

      //  if(! roleMappingAllowsDisplay(item)){
      //   return false;
      // }

      return true;
    }
  }

  private buildHeadlineIndicatorHierarchy() {
    this.headlineIndicatorHierarchy =
      this.topicHierarchyService.buildHeadlineIndicatorHierarchy(
        this.displayableIndicators_keywordFiltered,
        this.availableProcessScripts,
      );
  }

  indicatorValueIsNoData(indicatorValue) {
    if (
      Number.isNaN(indicatorValue) ||
      indicatorValue === null ||
      indicatorValue === undefined
    ) {
      return true;
    }
    return false;
  }

  async fetchAccessControlMetadata(keycloakRolesArray) {
    this.setAccessControl(
      await this.cacheHelperService.fetchAccessControlMetadata(
        keycloakRolesArray,
      ),
    );
    this.setCurrentKomMonitorLoginRoleNames();
    this.setCurrentKomMonitorLoginOrganizationalUnits();
  }

  /**
   * Get access control metadata by organizational unit ID
   */
  getAccessControlById(id: string): AccessControlMetadata | null {
    return (
      this.accessControl.find((unit) => unit.organizationalUnitId === id) ||
      null
    );
  }

  setCurrentKomMonitorLoginOrganizationalUnits() {
    // now iterate once over all possible KomMonitor orgas and check if user belongs to this orga via its keycloak group
    this.currentKomMonitorLoginOrganizationalUnits = this.accessControl.filter(
      (org) => this.currentKeycloakLoginGroupNames.includes(org.name),
    );
  }

  setCurrentKomMonitorLoginRoleNames() {
    /*
      window.__env.keycloakKomMonitorGroupsEditRoleNames = ["client-users-creator", "unit-users-creator"];
      window.__env.keycloakKomMonitorThemesEditRoleNames = ["client-themes-creator", "unit-themes-creator"];
      window.__env.keycloakKomMonitorGeodataEditRoleNames = ["client-resources-creator", "unit-resources-creator"];
    */
    let roleSuffixes =
      this.envConfigService.keycloakKomMonitorGroupsEditRoleNames
        .concat(this.envConfigService.keycloakKomMonitorThemesEditRoleNames)
        .concat(this.envConfigService.keycloakKomMonitorGeodataEditRoleNames);
    var possibleRoles = ["kommonitor-creator"];
    this.accessControl.forEach((organizationalUnit) => {
      for (const roleSuffix of roleSuffixes) {
        possibleRoles.push(organizationalUnit.name + "." + roleSuffix);
      }
    });
    this.currentKomMonitorLoginRoleNames =
      this.currentKeycloakLoginRoles.filter((role) =>
        possibleRoles.includes(role),
      );
  }

  private setAccessControl(input) {
    this.accessControl_map = new Map(
      input.map((e) => [e.organizationalUnitId, e]),
    );
    this.accessControl = Array.from(this.accessControl_map.values());
    this.updateAvailableRoles();
    this.allowedAccessControl = this.filterAllowedAccessControl(
      this.accessControl,
    );
  }

  private filterAllowedAccessControl(acArray) {
    if (this.checkAdminPermission()) {
      return acArray;
    }

    var clientUserRoles = this.filterClientUserAdminRoles();
    var filtered: any[] = [];
    var existingOrgaIds: any[] = [];

    acArray.forEach((orga) => {
      const currentOrga = orga;
      while (orga) {
        clientUserRoles.forEach((role) => {
          let roleNameParts = role.split(".");
          const orgaName = roleNameParts[roleNameParts.length - 2];

          if (
            orgaName === orga.name &&
            !existingOrgaIds.includes(currentOrga.organizationalUnitId)
          ) {
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
    return this.currentKeycloakLoginRoles.filter((role) => {
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (permissionLevel === "client-users-creator") {
        return true;
      }
      return false;
    });
  }

  checkAdminPermission() {
    if (
      this.currentKeycloakLoginRoles.includes(
        this.envConfigService.keycloakKomMonitorAdminRoleName,
      )
    ) {
      return true;
    }
    return false;
  }

  updateAvailableRoles() {
    this.availableRoles = [];

    for (let elem of this.accessControl) {
      for (let permission of elem.permissions) {
        let available = {
          ...permission,
          ...{
            organizationalUnit: elem,
            roleName: elem.name + "-" + permission.permissionLevel,
          },
        };
        this.availableRoles.push(available);
      }
    }
    // we need to refresh all modals as roles have changed
    this.broadcastService.broadcast("availableRolesUpdate");
  }

  async downloadMetadataPDF_georesource(georesourceMetadata) {
    return this.pdfExportService.downloadMetadataPDF_georesource(
      georesourceMetadata,
      this.availableTopics,
    );
  }

  async createMetadataPDF_georesource(georesource, pdfName) {
    return this.pdfExportService.createMetadataPDF_georesource(
      georesource,
      pdfName,
      this.availableTopics,
    );
  }

  async createMetadataPDF_indicator(indicator) {
    return this.pdfExportService.createMetadataPDF_indicator(
      indicator,
      this.availableSpatialUnits,
      this.availableTopics,
    );
  }

  getImageDimensions(file) {
    return this.pdfExportService["_getImageDimensions"](file);
  }

  getIndicatorStringFromIndicatorType(indicatorType) {
    return this.pdfExportService.getIndicatorStringFromIndicatorType(
      indicatorType,
    );
  }

  tsToDate_withOptionalUpdateInterval(
    ts,
    updateIntervalApiName: any = undefined,
  ) {
    return this.pdfExportService.tsToDate_withOptionalUpdateInterval(
      ts,
      updateIntervalApiName,
    );
  }

  dateToTS(date) {
    return this.pdfExportService.dateToTS(date);
  }

  private getTopicHierarchyForTopicId(topicReferenceId) {
    return this.topicHierarchyService.getTopicHierarchyForTopicId(
      this.availableTopics,
      topicReferenceId,
    );
  }

  async generateAndDownloadIndicatorZIP(
    indicatorData,
    fileName,
    fileEnding,
    jsZipOptions,
  ) {
    return this.pdfExportService.generateAndDownloadIndicatorZIP(
      indicatorData,
      fileName,
      fileEnding,
      jsZipOptions,
      this.selectedIndicator,
      this.availableSpatialUnits,
      this.availableTopics,
    );
  }

  async generateIndicatorMetadataPdf_asBlob() {
    return this.pdfExportService.generateIndicatorMetadataPdf_asBlob(
      this.selectedIndicator,
      this.availableSpatialUnits,
      this.availableTopics,
    );
  }

  async generateIndicatorMetadataPdf(indicatorMetadata, pdfName) {
    return this.pdfExportService.generateIndicatorMetadataPdf(
      indicatorMetadata,
      pdfName,
      this.availableSpatialUnits,
      this.availableTopics,
    );
  }

  getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    var maximumDecimals = this.envConfigService.numberOfDecimals;
    var minimumDecimals = 0;
    if (precision !== undefined) {
      maximumDecimals = precision;
      minimumDecimals = precision;
    } else {
      if (this.selectedIndicator && this.selectedIndicator.precision !== null) {
        maximumDecimals = this.selectedIndicator.precision;
        minimumDecimals = this.selectedIndicator.precision;
      }
    }

    var value;
    if (this.indicatorValueIsNoData(indicatorValue)) {
      value = "NoData";
    } else {
      value = Number(indicatorValue).toLocaleString("de-DE", {
        maximumFractionDigits: maximumDecimals,
        minimumFractionDigits: minimumDecimals,
      });
    }

    // if the original value is greater than zero but would be rounded as 0 then we must return the original result
    if (Number(value) == 0 && indicatorValue > 0) {
      value = Number(indicatorValue).toLocaleString("de-DE", {
        minimumFractionDigits: minimumDecimals,
        maximumFractionDigits: maximumDecimals,
      });
    }

    return value;
  }

  displayMapApplicationError(error) {
    setTimeout(() => {
      if (error.data) {
        this.errorMessage = this.syntaxHighlightJSON(error.data);
      }
      if (error.message) {
        this.errorMessage = this.syntaxHighlightJSON(error.message);
      } else {
        this.errorMessage = this.syntaxHighlightJSON(error);
      }

      // $rootScope.$apply();
      this.broadcastService.broadcast("hideLoadingIconOnMap");

      $(".mapApplicationErrorAlert").show();
    }, 1000);
  }

  syntaxHighlightJSON = function (json) {
    if (typeof json != "string") {
      json = JSON.stringify(json, undefined, 2);
    }
    json = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        var cls = "number";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "key";
          } else {
            cls = "string";
          }
        } else if (/true|false/.test(match)) {
          cls = "boolean";
        } else if (/null/.test(match)) {
          cls = "null";
        }
        return '<span class="' + cls + '">' + match + "</span>";
      },
    );
  };

  getBaseUrlToKomMonitorDataAPI_spatialResource() {
    return (
      this.envConfigService.baseUrlToKomMonitorDataAPI +
      this.cacheHelperService.spatialResourceGETUrlPath_forAuthentication
    );
  }

  onChangeIndicatorKeywordFilter(indicatorNameFilter) {
    this.displayableIndicators_keywordFiltered = JSON.parse(
      JSON.stringify(this.displayableIndicators),
    );

    if (indicatorNameFilter && indicatorNameFilter != "") {
      this.displayableIndicators_keywordFiltered =
        this.filterArrayObjectsByValue(
          this.displayableIndicators_keywordFiltered,
          indicatorNameFilter,
        );
    }

    this.buildTopicIndicatorHierarchy();
    this.buildHeadlineIndicatorHierarchy();
    this.buildComputationIndicatorHierarchy();
  }

  filterArrayObjectsByValue(array, string) {
    return array.filter((o) => {
      return Object.keys(o).some((k) => {
        if (typeof o[k] === "string")
          return o[k].toLowerCase().includes(string.toLowerCase());
      });
    });
  }

  onChangeGeoresourceKeywordFilter(
    georesourceNameFilter,
    showPOI,
    showLOI,
    showAOI,
    showWMS,
    showWFS,
  ) {
    //this.wmsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wmsDatasets));
    this.wmsDatasets_keywordFiltered = this.getAvailableGeoWmsDatasets();
    this.wfsDatasets_keywordFiltered = JSON.parse(
      JSON.stringify(this.wfsDatasets),
    );

    this.displayableGeoresources_keywordFiltered = JSON.parse(
      JSON.stringify(this.displayableGeoresources),
    );

    if (georesourceNameFilter && georesourceNameFilter != "") {
      this.displayableGeoresources_keywordFiltered =
        this.filterArrayObjectsByValue(
          this.displayableGeoresources_keywordFiltered,
          georesourceNameFilter,
        );

      this.wmsDatasets_keywordFiltered = this.filterArrayObjectsByValue(
        this.wmsDatasets_keywordFiltered,
        georesourceNameFilter,
      );
      this.wfsDatasets_keywordFiltered = this.filterArrayObjectsByValue(
        this.wfsDatasets_keywordFiltered,
        georesourceNameFilter,
      );
    }

    this.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay = {
      poiData: this.displayableGeoresources_keywordFiltered.filter(
        (item) => item.isPOI,
      ),
      loiData: this.displayableGeoresources_keywordFiltered.filter(
        (item) => item.isLOI,
      ),
      aoiData: this.displayableGeoresources_keywordFiltered.filter(
        (item) => item.isAOI,
      ),
      wmsData: this.wmsDatasets_keywordFiltered,
      wfsData: this.wfsDatasets_keywordFiltered,
    };

    if (!showWMS) {
      this.wmsDatasets_keywordFiltered = [];
    }
    if (!showWFS) {
      this.wfsDatasets_keywordFiltered = [];
    }

    if (!(showPOI && showLOI && showAOI)) {
      this.displayableGeoresources_keywordFiltered =
        this.displayableGeoresources_keywordFiltered.filter((item) => {
          if (!showPOI && item.isPOI) {
            return false;
          }
          if (!showLOI && item.isLOI) {
            return false;
          }

          if (!showAOI && item.isAOI) {
            return false;
          }

          return true;
        });
    }

    this.buildTopicGeoresourceHierarchy();
  }

  getGeoresourceDatasets(
    topic,
    georesourceNameFilter,
    showPOI,
    showLOI,
    showAOI,
    showWMS,
    showWFS,
  ) {
    var availableGeoresources: any = this.getAvailableGeoresources(
      topic,
      georesourceNameFilter,
      showPOI,
      showLOI,
      showAOI,
    );
    var wmsDatasets = this.getAvailableTopicWmsDatasets(
      topic,
      georesourceNameFilter,
      showWMS,
    );
    var wfsDatasets = this.getAvailableWfsDatasets(
      topic,
      georesourceNameFilter,
      showWFS,
    );

    var datasets = availableGeoresources
      .concat(wmsDatasets)
      .concat(wfsDatasets);
    return datasets;
  }

  getAvailableWfsDatasets(topic, georesourceNameFilter, showWFS) {
    if (!showWFS) {
      return [];
    }

    var wfsDatasets: any[] = [];

    var filteredWfsDatasets = this.wfsDatasets;

    if (georesourceNameFilter && georesourceNameFilter != "") {
      filteredWfsDatasets = this.filterArrayObjectsByValue(
        filteredWfsDatasets,
        georesourceNameFilter,
      );
    }

    for (const wfsMetadata of filteredWfsDatasets) {
      if (this.topicHierarchyContainsWms(topic, wfsMetadata)) {
        wfsDatasets.push(wfsMetadata);
      }
    }

    return wfsDatasets;
  }

  getAvailableTopicWmsDatasets(topic, georesourceNameFilter, showWMS) {
    if (!showWMS) {
      return [];
    }

    var wmsDatasets: any[] = [];

    var filteredWmsDatasets = this.getAvailableGeoWmsDatasets();

    if (georesourceNameFilter && georesourceNameFilter != "") {
      filteredWmsDatasets = this.filterArrayObjectsByValue(
        filteredWmsDatasets,
        georesourceNameFilter,
      );
    }

    for (const wmsMetadata of filteredWmsDatasets) {
      if (this.topicHierarchyContainsWms(topic, wmsMetadata)) {
        wmsDatasets.push(wmsMetadata);
      }
    }

    return wmsDatasets;
  }

  private topicHierarchyContainsGeoresource(topic, georesourceMetadata) {
    return this.topicHierarchyService.topicHierarchyContainsGeoresource(
      this.availableTopics,
      topic,
      georesourceMetadata,
    );
  }

  private topicHierarchyContainsWms(topic, wmsMetadata) {
    return this.topicHierarchyService.topicHierarchyContainsWms(
      this.availableTopics,
      topic,
      wmsMetadata,
    );
  }

  filterByGeoresourceNamesToHide(filteredGeoresources) {
    return filteredGeoresources.filter((georesourceMetadata) => {
      return this.isDisplayableGeoresource(georesourceMetadata);
    });
  }

  getAvailableGeoresources(
    topic,
    georesourceNameFilter,
    showPOI,
    showLOI,
    showAOI,
  ) {
    var georesources: any[] = [];

    var filteredGeoresources = this.availableGeoresources;

    filteredGeoresources =
      this.filterByGeoresourceNamesToHide(filteredGeoresources);

    if (georesourceNameFilter && georesourceNameFilter != "") {
      filteredGeoresources = this.filterArrayObjectsByValue(
        filteredGeoresources,
        georesourceNameFilter,
      );
    }

    filteredGeoresources = this.filterGeoresourcesByTypes(
      filteredGeoresources,
      showPOI,
      showLOI,
      showAOI,
    );

    for (const georesourceMetadata of filteredGeoresources) {
      if (this.topicHierarchyContainsGeoresource(topic, georesourceMetadata)) {
        georesources.push(georesourceMetadata);
      }
    }

    return georesources;
  }

  filterGeoresourcesByTypes(
    georesourceMetadataArray,
    showPOI,
    showLOI,
    showAOI,
  ) {
    if (!showPOI && !showLOI && !showAOI) {
      return [];
    }

    return georesourceMetadataArray.filter((georesourceMetadata) => {
      if (georesourceMetadata.isPOI) {
        if (showPOI) {
          return true;
        } else {
          return false;
        }
      } else if (georesourceMetadata.isLOI) {
        if (showLOI) {
          return true;
        } else {
          return false;
        }
      } else if (georesourceMetadata.isAOI) {
        if (showAOI) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
  }

  removeAoiGeoresource(aoiGeoresource) {
    //return this.ajskommonitorDataExchangeServiceeProvider.removeAoiGeoresource(aoiGeoresource);
  }

  getIndicatorValue_asNumber(indicatorValue, precision = undefined) {
    var maximumDecimals = this.envConfigService.numberOfDecimals;
    if (precision !== undefined) {
      maximumDecimals = precision;
    } else {
      if (this.selectedIndicator && this.selectedIndicator.precision !== null)
        maximumDecimals = this.selectedIndicator.precision;
    }

    var value;
    if (this.indicatorValueIsNoData(indicatorValue)) {
      value = "NoData";
    } else {
      value = +Number(indicatorValue).toFixed(maximumDecimals);
      // value = +Number(indicatorValue).toFixed(numberOfDecimals);
    }

    // if the original value is greater than zero but would be rounded as 0 then we must return the original result
    if (Number(value) == 0 && indicatorValue > 0) {
      value = Number(indicatorValue);
    }

    return value;
  }

  getIndicatorValueFromArray_asNumber(
    propertiesArray,
    targetDateString,
    precision = undefined,
  ) {
    if (!targetDateString.includes(this.envConfigService.indicatorDatePrefix)) {
      targetDateString =
        this.envConfigService.indicatorDatePrefix + targetDateString;
    }
    var indicatorValue = propertiesArray[targetDateString];
    var value;
    if (this.indicatorValueIsNoData(indicatorValue)) {
      value = "NoData";
    } else {
      value = this.getIndicatorValue_asNumber(indicatorValue, precision);
    }

    return value;
  }

  setAllFeaturesProperty(indicatorMetadataAndGeoJSON, propertyName) {
    let sum = 0;
    let count = 0;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    for (const feature of indicatorMetadataAndGeoJSON.geoJSON.features) {
      if (!this.indicatorValueIsNoData(feature.properties[propertyName])) {
        let value = this.getIndicatorValueFromArray_asNumber(
          feature.properties,
          propertyName,
        );
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
    if (count > 0) this.allFeaturesMean = sum / count;
    else this.allFeaturesMean = 0;
    this.allFeaturesMin = min;
    this.allFeaturesMax = max;

    this.allFeaturesRegionalSum = undefined;
    this.allFeaturesRegionalMean = undefined;
    this.allFeaturesRegionalSpatiallyUnassignable = undefined;

    if (indicatorMetadataAndGeoJSON.regionalReferenceValues) {
      for (const regionalReferenceValuesEntry of indicatorMetadataAndGeoJSON.regionalReferenceValues) {
        if (
          regionalReferenceValuesEntry.referenceDate &&
          regionalReferenceValuesEntry.referenceDate == this.selectedDate
        ) {
          this.allFeaturesRegionalSum =
            regionalReferenceValuesEntry.regionalSum;
          this.allFeaturesRegionalMean =
            regionalReferenceValuesEntry.regionalAverage;
          this.allFeaturesRegionalSpatiallyUnassignable =
            regionalReferenceValuesEntry.spatiallyUnassignable;
        }
      }
    }
  }

  setSelectedFeatureProperty(selectedFeaturesMap, propertyName) {
    let sum = 0;
    let count = 0;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    selectedFeaturesMap.forEach((feature, key, map) => {
      if (!this.indicatorValueIsNoData(feature.properties[propertyName])) {
        let value = this.getIndicatorValueFromArray_asNumber(
          feature.properties,
          propertyName,
        );
        sum += value;
        if (value < min) min = value;
        if (value > max) max = value;
        count++;
      }
    });

    if (count === 0) {
      // no feature selected, overwrite initial values for min and max
      min = 0;
      max = 0;
    }

    this.selectedFeaturesNumberOfFeatures = count;
    this.selectedFeaturesSum = sum;
    // no division by zero
    if (count > 0) this.selectedFeaturesMean = sum / count;
    else this.selectedFeaturesMean = 0;
    this.selectedFeaturesMin = min;
    this.selectedFeaturesMax = max;
  }

  selectedSpatialUnitIsRaster() {
    var spatialUnitName = this.selectedSpatialUnit
      ? this.selectedSpatialUnit.spatialUnitLevel
      : "";

    return (
      spatialUnitName.includes("raster") ||
      spatialUnitName.includes("Raster") ||
      spatialUnitName.includes("RASTER") ||
      spatialUnitName.includes("grid") ||
      spatialUnitName.includes("GRID") ||
      spatialUnitName.includes("Grid")
    );
  }

  async generateAndDownloadGeoresourceZIP(
    georesourceMetadata,
    georesourceData,
    fileName,
    fileEnding,
    jsZipOptions,
  ) {
    return this.pdfExportService.generateAndDownloadGeoresourceZIP(
      georesourceMetadata,
      georesourceData,
      fileName,
      fileEnding,
      jsZipOptions,
      this.availableTopics,
    );
  }

  async generateGeoresourceMetadataPdf_asBlob(georesourceMetadata) {
    return this.pdfExportService.generateGeoresourceMetadataPdf_asBlob(
      georesourceMetadata,
      this.availableTopics,
    );
  }

  createDualListInputArray(array, nameProperty, idProperty): any[] {
    /* return this.ajskommonitorDataExchangeServiceeProvider.createDualListInputArray(areaNames, name, id);*/
    var result: any[] = [];

    if (array && Array.isArray(array)) {
      for (var i = 0; i < array.length; i++) {
        var obj = {};
        obj["category"] = array[i][nameProperty];
        obj["name"] = array[i][nameProperty];
        if (idProperty && array[i][idProperty] !== undefined) {
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
      this.setSelectedFeatureProperty(
        selectedIndicatorFeatureIds,
        propertyName,
      );
    });
  }

  buildIndicatorPropertyName() {
    const INDICATOR_DATE_PREFIX = this.envConfigService.indicatorDatePrefix;
    let propertyName = INDICATOR_DATE_PREFIX + this.selectedDate;
    return propertyName;
  }

  formatIndicatorNameForLabel(indicatorName, maxCharsPerLine) {
    var arr: any[] = [];
    var space = /\s/;

    const words = indicatorName.split(space);
    // push first word into new array
    if (words[0].length) {
      arr.push(words[0]);
    }

    for (let i = 1; i < words.length; i++) {
      if (words[i].length + arr[arr.length - 1].length < maxCharsPerLine) {
        arr[arr.length - 1] = `${arr[arr.length - 1]} ${words[i]}`;
      } else {
        arr.push(words[i]);
      }
    }
    return arr.join("\n");
  }

  filterIndicators() {
    return (item) => {
      return this.isDisplayableIndicator(item);
    };
  }

  isDisplayableGeoresource(item) {
    var arrayOfNameSubstringsForHidingGeoresources =
      this.envConfigService.arrayOfNameSubstringsForHidingGeoresources;

    if (
      item.availablePeriodsOfValidity == undefined ||
      item.availablePeriodsOfValidity.length === 0
    )
      return false;

    var isGeoresourceThatShallNotBeDisplayed =
      arrayOfNameSubstringsForHidingGeoresources.some((substring) =>
        String(item.datasetName).includes(substring),
      );

    if (isGeoresourceThatShallNotBeDisplayed) {
      return false;
    }
    return true;
  }

  getIndicatorValue_asFixedPrecisionNumber(indicatorValue, precision) {
    var maximumDecimals = this.envConfigService.numberOfDecimals;
    var minimumDecimals = 0;
    if (precision !== undefined) {
      maximumDecimals = precision;
      minimumDecimals = precision;
    } else {
      if (this.selectedIndicator && this.selectedIndicator.precision !== null) {
        maximumDecimals = this.selectedIndicator.precision;
        minimumDecimals = this.selectedIndicator.precision;
      }
    }

    var value;
    if (this.indicatorValueIsNoData(indicatorValue)) {
      value = "NoData";
    } else {
      // value = string with . as separator, without "," as thounsand-sep
      value = indicatorValue
        .toLocaleString("en-GB", {
          maximumFractionDigits: maximumDecimals,
          minimumFractionDigits: minimumDecimals,
        })
        .replace(",", "");
    }

    // if the original value is greater than zero but would be rounded as 0 then we must return the original result
    if (Number(value) == 0 && indicatorValue > 0) {
      value = Number(indicatorValue);
    }

    return value;
  }

  getIndicatorAbbreviationFromIndicatorId(indicatorId) {
    for (var indicatorMetadata of this.availableIndicators) {
      if (indicatorMetadata.indicatorId === indicatorId) {
        return indicatorMetadata.abbreviation;
      }
    }
  }

  checkCreatePermission() {
    if (this.checkAdminPermission()) {
      return true;
    }

    for (const role of this.currentKeycloakLoginRoles) {
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (
        permissionLevel === "client-resources-creator" ||
        permissionLevel === "unit-resources-creator"
      ) {
        return true;
      }
    }
    return false;
  }

  checkEditorPermission() {
    if (this.checkAdminPermission()) {
      return true;
    }

    for (const role of this.currentKeycloakLoginRoles) {
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (
        permissionLevel === "client-resources-creator" ||
        permissionLevel === "unit-resources-creator"
      ) {
        return true;
      }
    }
    return false;
  }

  getRoleTitles() {
    return this.currentKeycloakLoginRoles.map(
      (role) => role.split(".")[role.split(".").length - 1],
    );
  }

  checkGroupsEditPermission() {
    if (this.checkAdminPermission()) return true;

    let splitRoles = this.getRoleTitles();
    let ret = false;

    this.envConfigService.keycloakKomMonitorGroupsEditRoleNames.forEach(
      (targetRole) => {
        if (splitRoles.includes(targetRole)) ret = true;
      },
    );

    return ret;
  }

  checkThemesEditPermission() {
    if (this.checkAdminPermission()) return true;

    let splitRoles = this.getRoleTitles();
    let ret = false;

    this.envConfigService.keycloakKomMonitorThemesEditRoleNames.forEach(
      (targetRole) => {
        if (splitRoles.includes(targetRole)) ret = true;
      },
    );

    return ret;
  }

  checkResourcesEditPermission() {
    if (this.checkAdminPermission()) return true;

    let splitRoles = this.getRoleTitles();
    let ret = false;

    this.envConfigService.keycloakKomMonitorGeodataEditRoleNames.forEach(
      (targetRole) => {
        if (splitRoles.includes(targetRole)) ret = true;
      },
    );

    return ret;
  }

  setWmsLayerActive(dataset: WmsDataset) {
    this.wmsDatasets = this.wmsDatasets.map((e) =>
      e.id === dataset.id ? { ...e, isSelected: true } : e,
    );
  }

  setWmsLayerInactive(dataset: WmsDataset) {
    this.wmsDatasets = this.wmsDatasets.map((e) =>
      e.id === dataset.id ? { ...e, isSelected: false } : e,
    );
  }
}
