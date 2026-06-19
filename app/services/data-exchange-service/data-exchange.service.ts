import { Injectable } from "@angular/core";
import { DEFAULT_POI_SIZE, LOI_DASH_ARRAY_OBJECTS, MetadataLoadingState, POI_SIZES, PoiSize } from "./data-exchange.constants";
import { MetadataExportService } from "services/metadata-export-service/metadata-export.service";
import {
  IndicatorsDataset,
  IndicatorsTopicsHierarchy,
} from "components/ngComponents/models/indicators.models";
import { EnvConfigService } from "services/env-config-service/env-config.service";
import { IndicatorValueService } from "services/indicator-value-service/indicator-value.service";
import { AccessControlService } from "services/access-control-service/access-control.service";
import { TopicHierarchyStoreService } from "services/topic-hierarchy-store-service/topic-hierarchy-store.service";
import { SpatialUnitMetadataStoreService } from "services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service";
import { BehaviorSubject, forkJoin } from "rxjs";
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

  private metadataLoadingSubject = new BehaviorSubject<MetadataLoadingState>(MetadataLoadingState.NONE);
  metadataLoading$ = this.metadataLoadingSubject.asObservable();

  // object to share changes on selectedDate, still needs the "real" 'selectedDate' as numerous components use it
  private selectedDateSubject = new BehaviorSubject<Date | undefined>(undefined);
  selectedDate$ = this.selectedDateSubject.asObservable();

  selectedDateInit = false;

  showDiagramExportButtons = true;
  showGeoresourceExportButtons = true;
  configMeanDataDisplay = this.envConfigService.configMeanDataDisplay || "both";

  selectedIndicator!: IndicatorsDataset;
  // Prio7 B6a: spatial-unit metadata lives in SpatialUnitMetadataStoreService; facade getter keeps consumers unchanged
  get availableSpatialUnits(): SpatialUnit[] { return this.spatialUnitStore.availableSpatialUnits; }
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

  selectedPoiSize: PoiSize = DEFAULT_POI_SIZE;

  errorMessage = undefined;

  // --- Prio7 B3: access-control state lives in AccessControlService; these
  // facade get/set keep consumers + the auth/fetch orchestration unchanged ---
  get isRealmAdmin(): boolean { return this.accessControlService.isRealmAdmin; }
  set isRealmAdmin(v: boolean) { this.accessControlService.isRealmAdmin = v; }
  get currentKeycloakLoginGroupNames(): any { return this.accessControlService.currentKeycloakLoginGroupNames; }
  set currentKeycloakLoginGroupNames(v: any) { this.accessControlService.currentKeycloakLoginGroupNames = v; }
  get currentKeycloakLoginRoles(): any[] { return this.accessControlService.currentKeycloakLoginRoles; }
  set currentKeycloakLoginRoles(v: any[]) { this.accessControlService.currentKeycloakLoginRoles = v; }
  get currentKeycloakLoginGroups(): any[] { return this.accessControlService.currentKeycloakLoginGroups; }
  set currentKeycloakLoginGroups(v: any[]) { this.accessControlService.currentKeycloakLoginGroups = v; }
  get currentKomMonitorLoginRoleNames(): any[] { return this.accessControlService.currentKomMonitorLoginRoleNames; }
  set currentKomMonitorLoginRoleNames(v: any[]) { this.accessControlService.currentKomMonitorLoginRoleNames = v; }
  get currentKomMonitorLoginOrganizationalUnits(): any[] { return this.accessControlService.currentKomMonitorLoginOrganizationalUnits; }
  set currentKomMonitorLoginOrganizationalUnits(v: any[]) { this.accessControlService.currentKomMonitorLoginOrganizationalUnits = v; }
  get accessControl(): any[] { return this.accessControlService.accessControl; }
  set accessControl(v: any[]) { this.accessControlService.accessControl = v; }

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

  availableProcessScripts: any[] = [];

  availableIndicators_map = new Map();
  availableGeoresources_map = new Map();
  availableProcessScripts_map = new Map();


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

  // Prio7 B5: hierarchy results live in TopicHierarchyStoreService; facade getters keep consumers unchanged
  get headlineIndicatorHierarchy(): any[] { return this.topicHierarchyStore.headlineIndicatorHierarchy; }
  get computationIndicatorHierarchy(): any[] { return this.topicHierarchyStore.computationIndicatorHierarchy; }
  get topicIndicatorHierarchy(): IndicatorsTopicsHierarchy[] { return this.topicHierarchyStore.topicIndicatorHierarchy; }
  get topicGeoresourceHierarchy(): any[] { return this.topicHierarchyStore.topicGeoresourceHierarchy; }
  get topicGeoresourceHierarchy_unmappedEntries(): any { return this.topicHierarchyStore.topicGeoresourceHierarchy_unmappedEntries; }
  georesourceMapKey_forUnmappedTopicReferences = "unmapped";

  currentKeycloakUser!: KeycloakProfile;

  public constructor(
    private authService: AuthService,
    private cacheHelperService: CacheHelperServiceService,
    private broadcastService: BroadcastService,
    private topicHierarchyService: TopicHierarchyService,
    private envConfigService: EnvConfigService,
    private metadataExportService: MetadataExportService,
    private indicatorValueService: IndicatorValueService,
    private accessControlService: AccessControlService,
    private topicHierarchyStore: TopicHierarchyStoreService,
    private spatialUnitStore: SpatialUnitMetadataStoreService,
  ) {}

  /**
   * Resolve the effective decimal precision from the explicit argument or the
   * currently selected indicator. Kept in the facade because selection state
   * (selectedIndicator) lives here until B7; the IndicatorValueService stays pure.
   */
  private resolveSelectedPrecision(precision = undefined) {
    if (precision !== undefined) {
      return precision;
    }
    if (this.selectedIndicator && this.selectedIndicator.precision !== null) {
      return this.selectedIndicator.precision;
    }
    return undefined;
  }

  setSelectedDate(dateString:string | undefined) {
    
    if(dateString) {
      this.selectedDate = dateString;
      this.selectedDateSubject.next(new Date(dateString));
    }
  }

  setMetadataState(state: MetadataLoadingState) {
    this.metadataLoadingSubject.next(state);
  }

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

    this.setMetadataState(MetadataLoadingState.INPROGRESS);

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

        console.log("Metadata fetched. Call initialize event.");

        this.setMetadataState(MetadataLoadingState.COMPLETE);
        this.onMetadataLoadingCompleted();
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
    this.spatialUnitStore.setSpatialUnits(spatialUnitsArray);
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
    return this.accessControlService.checkDeletePermission();
  }

  getAllowedRolesString(allowedPermissionIds) {
    return this.accessControlService.getAllowedRolesString(allowedPermissionIds);
  }

  getRoleTitle(organizationalUnitId) {
    return this.accessControlService.getRoleTitle(organizationalUnitId);
  }

  getIndicatorMetadataById(indicatorId) {
    return this.availableIndicators_map.get(indicatorId);
  }

  getGeoresourceMetadataById(georesourceId) {
    return this.availableGeoresources_map.get(georesourceId);
  }

  getSpatialUnitMetadataById(spatialUnitId) {
    return this.spatialUnitStore.getSpatialUnitMetadataById(spatialUnitId);
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
    this.topicHierarchyStore.buildTopicGeoresourceHierarchy(
      this.availableTopics,
      this.displayableGeoresources_keywordFiltered,
      this.wmsDatasets_keywordFiltered,
      this.wfsDatasets_keywordFiltered,
      this.georesourceMapKey_forUnmappedTopicReferences,
      filter,
    );
  }

  private buildComputationIndicatorHierarchy() {
    this.topicHierarchyStore.buildComputationIndicatorHierarchy(
      this.displayableIndicators_keywordFiltered,
      this.availableProcessScripts,
    );
  }

  private buildTopicIndicatorHierarchy() {
    this.topicHierarchyStore.buildTopicIndicatorHierarchy(
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
    this.topicHierarchyStore.buildHeadlineIndicatorHierarchy(
      this.displayableIndicators_keywordFiltered,
      this.availableProcessScripts,
    );
  }

  indicatorValueIsNoData(indicatorValue) {
    return this.indicatorValueService.indicatorValueIsNoData(indicatorValue);
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
    return this.accessControlService.getAccessControlById(id);
  }

  setCurrentKomMonitorLoginOrganizationalUnits() {
    return this.accessControlService.setCurrentKomMonitorLoginOrganizationalUnits();
  }

  setCurrentKomMonitorLoginRoleNames() {
    return this.accessControlService.setCurrentKomMonitorLoginRoleNames();
  }

  private setAccessControl(input) {
    return this.accessControlService.setAccessControl(input);
  }

  filterClientUserAdminRoles() {
    return this.accessControlService.filterClientUserAdminRoles();
  }

  checkAdminPermission() {
    return this.accessControlService.checkAdminPermission();
  }

  updateAvailableRoles() {
    return this.accessControlService.updateAvailableRoles();
  }

  async downloadMetadataPDF_georesource(georesourceMetadata) {
    return this.metadataExportService.downloadMetadataPDF_georesource(
      georesourceMetadata,
      this.availableTopics,
    );
  }

  async createMetadataPDF_georesource(georesource, pdfName) {
    return this.metadataExportService.createMetadataPDF_georesource(
      georesource,
      pdfName,
      this.availableTopics,
    );
  }

  async createMetadataPDF_indicator(indicator) {
    return this.metadataExportService.createMetadataPDF_indicator(
      indicator,
      this.availableSpatialUnits,
      this.availableTopics,
    );
  }

  getImageDimensions(file) {
    return this.metadataExportService.getImageDimensions(file);
  }

  getIndicatorStringFromIndicatorType(indicatorType) {
    return this.metadataExportService.getIndicatorStringFromIndicatorType(
      indicatorType,
    );
  }

  tsToDate_withOptionalUpdateInterval(
    ts,
    updateIntervalApiName: any = undefined,
  ) {
    return this.metadataExportService.tsToDate_withOptionalUpdateInterval(
      ts,
      updateIntervalApiName,
    );
  }

  dateToTS(date) {
    return this.metadataExportService.dateToTS(date);
  }

  private getTopicHierarchyForTopicId(topicReferenceId) {
    return this.topicHierarchyStore.getTopicHierarchyForTopicId(
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
    return this.metadataExportService.generateAndDownloadIndicatorZIP(
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
    return this.metadataExportService.generateIndicatorMetadataPdf_asBlob(
      this.selectedIndicator,
      this.availableSpatialUnits,
      this.availableTopics,
    );
  }

  async generateIndicatorMetadataPdf(indicatorMetadata, pdfName) {
    return this.metadataExportService.generateIndicatorMetadataPdf(
      indicatorMetadata,
      pdfName,
      this.availableSpatialUnits,
      this.availableTopics,
    );
  }

  getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFormattedText(
      indicatorValue,
      this.resolveSelectedPrecision(precision),
    );
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

  syntaxHighlightJSON(json) {
    return this.indicatorValueService.syntaxHighlightJSON(json);
  }

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
        return false;
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
    return this.indicatorValueService.getIndicatorValue_asNumber(
      indicatorValue,
      this.resolveSelectedPrecision(precision),
    );
  }

  getIndicatorValueFromArray_asNumber(
    propertiesArray,
    targetDateString,
    precision = undefined,
  ) {
    return this.indicatorValueService.getIndicatorValueFromArray_asNumber(
      propertiesArray,
      targetDateString,
      this.resolveSelectedPrecision(precision),
    );
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
    return this.metadataExportService.generateAndDownloadGeoresourceZIP(
      georesourceMetadata,
      georesourceData,
      fileName,
      fileEnding,
      jsZipOptions,
      this.availableTopics,
    );
  }

  async generateGeoresourceMetadataPdf_asBlob(georesourceMetadata) {
    return this.metadataExportService.generateGeoresourceMetadataPdf_asBlob(
      georesourceMetadata,
      this.availableTopics,
    );
  }

  createDualListInputArray(array, nameProperty, idProperty): any[] {
    return this.indicatorValueService.createDualListInputArray(
      array,
      nameProperty,
      idProperty,
    );
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
    return this.indicatorValueService.formatIndicatorNameForLabel(
      indicatorName,
      maxCharsPerLine,
    );
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
    return this.indicatorValueService.getIndicatorValue_asFixedPrecisionNumber(
      indicatorValue,
      this.resolveSelectedPrecision(precision),
    );
  }

  getIndicatorAbbreviationFromIndicatorId(indicatorId) {
    for (var indicatorMetadata of this.availableIndicators) {
      if (indicatorMetadata.indicatorId === indicatorId) {
        return indicatorMetadata.abbreviation;
      }
    }
  }

  checkCreatePermission() {
    return this.accessControlService.checkCreatePermission();
  }

  checkEditorPermission() {
    return this.accessControlService.checkEditorPermission();
  }

  getRoleTitles() {
    return this.accessControlService.getRoleTitles();
  }

  checkGroupsEditPermission() {
    return this.accessControlService.checkGroupsEditPermission();
  }

  checkThemesEditPermission() {
    return this.accessControlService.checkThemesEditPermission();
  }

  checkResourcesEditPermission() {
    return this.accessControlService.checkResourcesEditPermission();
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
