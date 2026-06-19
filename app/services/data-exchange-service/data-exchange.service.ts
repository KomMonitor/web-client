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
import { ProcessScriptMetadataStoreService } from "services/process-script-metadata-store-service/process-script-metadata-store.service";
import { TopicMetadataStoreService } from "services/topic-metadata-store-service/topic-metadata-store.service";
import { IndicatorMetadataStoreService } from "services/indicator-metadata-store-service/indicator-metadata-store.service";
import { GeoresourceMetadataStoreService } from "services/georesource-metadata-store-service/georesource-metadata-store.service";
import { MetadataFilterService } from "services/metadata-filter-service/metadata-filter.service";
import { SelectionStateService } from "services/selection-state-service/selection-state.service";
import { BehaviorSubject, forkJoin } from "rxjs";
import { AuthService } from "services/auth-service/auth.service";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { CacheHelperServiceService } from "services/cache-helper-service/cache-helper.service";
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

  // Prio7 B7: selectedDate stream lives in SelectionStateService
  get selectedDate$() { return this.selectionState.selectedDate$; }

  selectedDateInit = false;

  showDiagramExportButtons = true;
  showGeoresourceExportButtons = true;
  configMeanDataDisplay = this.envConfigService.configMeanDataDisplay || "both";

  // Prio7 B7: selection state lives in SelectionStateService; facade get/set keeps consumers unchanged
  get selectedIndicator(): IndicatorsDataset { return this.selectionState.selectedIndicator; }
  set selectedIndicator(v: IndicatorsDataset) { this.selectionState.selectedIndicator = v; }
  // Prio7 B6a: spatial-unit metadata lives in SpatialUnitMetadataStoreService; facade getter keeps consumers unchanged
  get availableSpatialUnits(): SpatialUnit[] { return this.spatialUnitStore.availableSpatialUnits; }
  // Prio7 B6e: georesource/WMS/WFS state lives in GeoresourceMetadataStoreService; facade getters keep consumers unchanged
  get availableWmsDatasets(): WmsDataset[] { return this.georesourceStore.availableWmsDatasets; }
  get selectedDate(): any { return this.selectionState.selectedDate; }
  set selectedDate(v: any) { this.selectionState.selectedDate = v; }
  get selectedSpatialUnit(): SpatialUnit { return this.selectionState.selectedSpatialUnit; }
  set selectedSpatialUnit(v: SpatialUnit) { this.selectionState.selectedSpatialUnit = v; }
  disableIndicatorDatePicker!: boolean;
  isBalanceChecked!: boolean;
  indicatorAndMetadataAsBalance: any;
  indicatorDatePrefix!: string;
  measureOfValue: any;
  isMeasureOfValueChecked: boolean = false;
  // Prio7 B7: feature aggregates live in SelectionStateService; facade getters keep consumers unchanged
  get allFeaturesRegionalMean(): any { return this.selectionState.allFeaturesRegionalMean; }
  get allFeaturesMean(): any { return this.selectionState.allFeaturesMean; }
  get allFeaturesNumberOfFeatures(): any { return this.selectionState.allFeaturesNumberOfFeatures; }
  get selectedFeaturesNumberOfFeatures(): any { return this.selectionState.selectedFeaturesNumberOfFeatures; }
  get allFeaturesSum(): any { return this.selectionState.allFeaturesSum; }
  get allFeaturesRegionalSum(): any { return this.selectionState.allFeaturesRegionalSum; }
  get selectedFeaturesSum(): any { return this.selectionState.selectedFeaturesSum; }
  get selectedFeaturesMean(): any { return this.selectionState.selectedFeaturesMean; }
  get allFeaturesMin(): any { return this.selectionState.allFeaturesMin; }
  get selectedFeaturesMin(): any { return this.selectionState.selectedFeaturesMin; }
  get allFeaturesMax(): any { return this.selectionState.allFeaturesMax; }
  get selectedFeaturesMax(): any { return this.selectionState.selectedFeaturesMax; }
  get allFeaturesRegionalSpatiallyUnassignable(): any { return this.selectionState.allFeaturesRegionalSpatiallyUnassignable; }
  selectedIndicatorBackup!: IndicatorsDataset;
  // Prio7 B6d: indicator metadata lives in IndicatorMetadataStoreService; facade getters keep consumers unchanged
  get displayableIndicators(): any { return this.indicatorStore.displayableIndicators; }
  wmsUrlForSelectedIndicator: any;
  wfsUrlForSelectedIndicator: any;
  // Prio7 B4: indicator keyword filter lives in MetadataFilterService; facade get/set keeps consumers + the B6d wrapper unchanged
  get displayableIndicators_keywordFiltered(): any { return this.metadataFilterService.displayableIndicators_keywordFiltered; }
  set displayableIndicators_keywordFiltered(v: any) { this.metadataFilterService.displayableIndicators_keywordFiltered = v; }
  get displayableGeoresources_keywordFiltered(): any { return this.georesourceStore.displayableGeoresources_keywordFiltered; }
  wmsLegendImage: any;
  get displayableGeoresources_keywordFiltered_forAlphabeticalDisplay(): any { return this.georesourceStore.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay; }
  rangeFilterData: any;
  classifyZeroSeparately_backup: any;
  simplifyGeometriesParameterName: any;
  simplifyGeometries: any;
  FEATURE_NAME_PROPERTY_NAME: any;
  get availableGeoresources(): GeoresourcesDataset[] { return this.georesourceStore.availableGeoresources; }
  get availableIndicators(): any { return this.indicatorStore.availableIndicators; }
  reachabilityScenarioOnMainMap: any;
  isochroneLegend: any = false;
  get displayableGeoresources(): any { return this.georesourceStore.displayableGeoresources; }
  set displayableGeoresources(v: any) { this.georesourceStore.displayableGeoresources = v; }
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
  // Prio7 B6c: topic metadata lives in TopicMetadataStoreService; facade getter keeps consumers unchanged
  get availableTopics(): any[] { return this.topicStore.availableTopics; }

  anySideBarIsShown = false;

  tmpIndicatorGeoJSON = undefined;

  get wmsDatasets(): WmsDataset[] { return this.georesourceStore.wmsDatasets; }
  get wfsDatasets(): any { return this.georesourceStore.wfsDatasets; }
  get wmsDatasets_keywordFiltered(): WmsDataset[] { return this.georesourceStore.wmsDatasets_keywordFiltered; }
  get wfsDatasets_keywordFiltered(): any { return this.georesourceStore.wfsDatasets_keywordFiltered; }

  get allFeaturesPropertyUnit(): any { return this.selectionState.allFeaturesPropertyUnit; }

  fileDatasets: GeoresourcesImportDataset[] = [];

  // Prio7 B6b: process-script metadata lives in ProcessScriptMetadataStoreService; facade getter keeps consumers unchanged
  get availableProcessScripts(): any[] { return this.processScriptStore.availableProcessScripts; }



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
  get georesourceMapKey_forUnmappedTopicReferences(): string { return this.georesourceStore.georesourceMapKey_forUnmappedTopicReferences; }

  currentKeycloakUser!: KeycloakProfile;

  public constructor(
    private authService: AuthService,
    private cacheHelperService: CacheHelperServiceService,
    private broadcastService: BroadcastService,
    private envConfigService: EnvConfigService,
    private metadataExportService: MetadataExportService,
    private indicatorValueService: IndicatorValueService,
    private accessControlService: AccessControlService,
    private topicHierarchyStore: TopicHierarchyStoreService,
    private spatialUnitStore: SpatialUnitMetadataStoreService,
    private processScriptStore: ProcessScriptMetadataStoreService,
    private topicStore: TopicMetadataStoreService,
    private indicatorStore: IndicatorMetadataStoreService,
    private georesourceStore: GeoresourceMetadataStoreService,
    private metadataFilterService: MetadataFilterService,
    private selectionState: SelectionStateService,
  ) {}

  /**
   * Resolve the effective decimal precision from the explicit argument or the
   * currently selected indicator. Kept in the facade because selection state
   * (selectedIndicator) lives here until B7; the IndicatorValueService stays pure.
   */
  private resolveSelectedPrecision(precision = undefined) {
    return this.selectionState.resolveSelectedPrecision(precision);
  }

  setSelectedDate(dateString:string | undefined) {
    this.selectionState.setSelectedDate(dateString);
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
    this.georesourceStore.setServices(servicesArray);
  }

  addSingleGeoresourceMetadata(georesourceMetadata) {
    this.georesourceStore.addSingleGeoresourceMetadata(georesourceMetadata);
  }

  replaceSingleGeoresourceMetadata(georesourceMetadata) {
    this.georesourceStore.replaceSingleGeoresourceMetadata(georesourceMetadata);
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
    this.georesourceStore.deleteSingleGeoresourceMetadata(georesourceId);
  }

  setProcessScripts(scriptsArray) {
    this.processScriptStore.setProcessScripts(scriptsArray);
  }

  setIndicators(indicatorsArray) {
    this.indicatorStore.setIndicators(indicatorsArray);
  }

  getAvailableGeoWmsDatasets(): WmsDataset[] {
    return this.georesourceStore.getAvailableGeoWmsDatasets();
  }

  getAvailableIndiWmsDatasets(): WmsDataset[] {
    return this.georesourceStore.getAvailableIndiWmsDatasets();
  }

  setGeoresources(georesourcesArray) {
    this.georesourceStore.setGeoresources(georesourcesArray);
  }

  setTopics(topicsArray) {
    this.topicStore.setTopics(topicsArray);
  }

  setSpatialUnits(spatialUnitsArray) {
    this.spatialUnitStore.setSpatialUnits(spatialUnitsArray);
  }

  addSingleIndicatorMetadata(indicatorMetadata) {
    this.indicatorStore.addSingleIndicatorMetadata(indicatorMetadata);
  }

  replaceSingleIndicatorMetadata(indicatorMetadata) {
    this.indicatorStore.replaceSingleIndicatorMetadata(indicatorMetadata);
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
    return this.indicatorStore.getIndicatorMetadataById(indicatorId);
  }

  getGeoresourceMetadataById(georesourceId) {
    return this.georesourceStore.getGeoresourceMetadataById(georesourceId);
  }

  getSpatialUnitMetadataById(spatialUnitId) {
    return this.spatialUnitStore.getSpatialUnitMetadataById(spatialUnitId);
  }

  deleteSingleIndicatorMetadata(indicatorId) {
    this.indicatorStore.deleteSingleIndicatorMetadata(indicatorId);
  }

  modifySingleIndicator(indicator) {
    return this.indicatorStore.modifySingleIndicator(indicator);
  }

  modifyIndicators(indicators) {
    return this.indicatorStore.modifyIndicators(indicators);
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
    this.indicatorStore.modifyIndicatorApplicableSpatialUnitsForLoginRoles(
      this.availableSpatialUnits,
    );
    // displayableIndicators_keywordFiltered is B4 state and stays in the facade
    this.displayableIndicators_keywordFiltered = JSON.parse(
      JSON.stringify(this.displayableIndicators),
    );
  }

  isDisplayableIndicator(item) {
    return this.indicatorStore.isDisplayableIndicator(item);
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
    this.metadataFilterService.onChangeIndicatorKeywordFilter(indicatorNameFilter);
  }

  onChangeGeoresourceKeywordFilter(
    georesourceNameFilter,
    showPOI,
    showLOI,
    showAOI,
    showWMS,
    showWFS,
  ) {
    this.georesourceStore.onChangeGeoresourceKeywordFilter(
      georesourceNameFilter,
      showPOI,
      showLOI,
      showAOI,
      showWMS,
      showWFS,
    );
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
    return this.georesourceStore.getGeoresourceDatasets(
      topic,
      georesourceNameFilter,
      showPOI,
      showLOI,
      showAOI,
      showWMS,
      showWFS,
    );
  }

  getAvailableWfsDatasets(topic, georesourceNameFilter, showWFS) {
    return this.georesourceStore.getAvailableWfsDatasets(
      topic,
      georesourceNameFilter,
      showWFS,
    );
  }

  getAvailableTopicWmsDatasets(topic, georesourceNameFilter, showWMS) {
    return this.georesourceStore.getAvailableTopicWmsDatasets(
      topic,
      georesourceNameFilter,
      showWMS,
    );
  }

  filterByGeoresourceNamesToHide(filteredGeoresources) {
    return this.georesourceStore.filterByGeoresourceNamesToHide(
      filteredGeoresources,
    );
  }

  getAvailableGeoresources(
    topic,
    georesourceNameFilter,
    showPOI,
    showLOI,
    showAOI,
  ) {
    return this.georesourceStore.getAvailableGeoresources(
      topic,
      georesourceNameFilter,
      showPOI,
      showLOI,
      showAOI,
    );
  }

  filterGeoresourcesByTypes(
    georesourceMetadataArray,
    showPOI,
    showLOI,
    showAOI,
  ) {
    return this.georesourceStore.filterGeoresourcesByTypes(
      georesourceMetadataArray,
      showPOI,
      showLOI,
      showAOI,
    );
  }

  removeAoiGeoresource(aoiGeoresource) {
    return this.georesourceStore.removeAoiGeoresource(aoiGeoresource);
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
    this.selectionState.setAllFeaturesProperty(
      indicatorMetadataAndGeoJSON,
      propertyName,
    );
  }

  setSelectedFeatureProperty(selectedFeaturesMap, propertyName) {
    this.selectionState.setSelectedFeatureProperty(
      selectedFeaturesMap,
      propertyName,
    );
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
    this.selectionState.onRemovedFeatureFromSelection([selectedIndicatorFeatureIds]);
  }

  buildIndicatorPropertyName() {
    return this.selectionState.buildIndicatorPropertyName();
  }

  formatIndicatorNameForLabel(indicatorName, maxCharsPerLine) {
    return this.indicatorValueService.formatIndicatorNameForLabel(
      indicatorName,
      maxCharsPerLine,
    );
  }

  filterIndicators() {
    return this.metadataFilterService.filterIndicators();
  }

  isDisplayableGeoresource(item) {
    return this.georesourceStore.isDisplayableGeoresource(item);
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
    this.georesourceStore.setWmsLayerActive(dataset);
  }

  setWmsLayerInactive(dataset: WmsDataset) {
    this.georesourceStore.setWmsLayerInactive(dataset);
  }
}
