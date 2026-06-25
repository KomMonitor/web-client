import { Injectable, inject } from '@angular/core';
import {
  DEFAULT_POI_SIZE,
  LOI_DASH_ARRAY_OBJECTS,
  MetadataLoadingState,
  PoiSize,
} from './data-exchange.constants';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import {
  IndicatorsDataset,
  IndicatorsTopicsHierarchy,
} from 'components/ngComponents/models/indicators.models';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { MetadataFilterService } from 'services/metadata-filter-service/metadata-filter.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { AuthService } from 'services/auth-service/auth.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { KeycloakProfile } from 'keycloak-js';
import { GeoresourcesImportDataset } from 'components/ngComponents/userInterface/sidebar/kommonitorDataImport/kommonitor-data-import.component';

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
  providedIn: 'root',
})
export class DataExchangeService {
  private authService = inject(AuthService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private broadcastService = inject(BroadcastService);
  private envConfigService = inject(EnvConfigService);
  private metadataExportService = inject(MetadataExportService);
  private indicatorValueService = inject(IndicatorValueService);
  private accessControlService = inject(AccessControlService);
  private topicHierarchyStore = inject(TopicHierarchyStoreService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private metadataFilterService = inject(MetadataFilterService);
  private selectionState = inject(SelectionStateService);

  private metadataLoadingSubject = new BehaviorSubject<MetadataLoadingState>(
    MetadataLoadingState.NONE
  );
  metadataLoading$ = this.metadataLoadingSubject.asObservable();

  selectedDateInit = false;

  showDiagramExportButtons = true;
  showGeoresourceExportButtons = true;
  configMeanDataDisplay = this.envConfigService.configMeanDataDisplay || 'both';

  disableIndicatorDatePicker!: boolean;
  isBalanceChecked!: boolean;
  indicatorAndMetadataAsBalance: any;
  indicatorDatePrefix!: string;
  measureOfValue: any;
  isMeasureOfValueChecked: boolean = false;
  selectedIndicatorBackup!: IndicatorsDataset;
  wmsUrlForSelectedIndicator: any;
  wfsUrlForSelectedIndicator: any;
  // Prio7 B4: indicator keyword filter lives in MetadataFilterService; facade get/set keeps consumers + the B6d wrapper unchanged
  get displayableIndicators_keywordFiltered(): any {
    return this.metadataFilterService.displayableIndicators_keywordFiltered;
  }
  set displayableIndicators_keywordFiltered(v: any) {
    this.metadataFilterService.displayableIndicators_keywordFiltered = v;
  }
  wmsLegendImage: any;
  rangeFilterData: any;
  classifyZeroSeparately_backup: any;
  simplifyGeometriesParameterName: any;
  simplifyGeometries: any;
  FEATURE_NAME_PROPERTY_NAME: any;
  reachabilityScenarioOnMainMap: any;
  isochroneLegend: any = false;
  adminUserName;
  adminPassword;
  adminIsLoggedIn;
  rangeFilterIsApplied: any;
  baseLayerDefinitionsArray!: any[];

  selectedPoiSize: PoiSize = DEFAULT_POI_SIZE;

  errorMessage = undefined;

  // todo topics hirarchy interface ?!

  anySideBarIsShown = false;

  tmpIndicatorGeoJSON = undefined;

  fileDatasets: GeoresourcesImportDataset[] = [];

  topicIndicatorHierarchy_forOrderView: any[] = [];

  availablePoiMarkerColors = [
    {
      colorName: 'red',
      colorValue: 'rgb(205,59,40)',
    },
    {
      colorName: 'white',
      colorValue: 'rgb(255,255,255)',
    },
    {
      colorName: 'orange',
      colorValue: 'rgb(235,144,46)',
    },
    {
      colorName: 'beige',
      colorValue: 'rgb(255,198,138)',
    },
    {
      colorName: 'green',
      colorValue: 'rgb(108,166,36)',
    },
    {
      colorName: 'blue',
      colorValue: 'rgb(53,161,209)',
    },
    {
      colorName: 'purple',
      colorValue: 'rgb(198,77,175)',
    },
    {
      colorName: 'pink',
      colorValue: 'rgb(255,138,232)',
    },
    {
      colorName: 'gray',
      colorValue: 'rgb(163,163,163)',
    },
    {
      colorName: 'black',
      colorValue: 'rgb(47,47,47)',
    },
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
  get headlineIndicatorHierarchy(): any[] {
    return this.topicHierarchyStore.headlineIndicatorHierarchy;
  }
  get computationIndicatorHierarchy(): any[] {
    return this.topicHierarchyStore.computationIndicatorHierarchy;
  }
  get topicIndicatorHierarchy(): IndicatorsTopicsHierarchy[] {
    return this.topicHierarchyStore.topicIndicatorHierarchy;
  }
  get topicGeoresourceHierarchy(): any[] {
    return this.topicHierarchyStore.topicGeoresourceHierarchy;
  }
  get topicGeoresourceHierarchy_unmappedEntries(): any {
    return this.topicHierarchyStore.topicGeoresourceHierarchy_unmappedEntries;
  }
  currentKeycloakUser!: KeycloakProfile;

  setMetadataState(state: MetadataLoadingState) {
    this.metadataLoadingSubject.next(state);
  }

  hideErrorAlert() {
    $('.mapApplicationErrorAlert').hide();
  }

  isAllowedSpatialUnitForCurrentIndicator(spatialUnitMetadata: any) {
    if (!this.selectionState.selectedIndicator) {
      return false;
    }

    if (!spatialUnitMetadata || !spatialUnitMetadata.spatialUnitLevel) {
      return false;
    }

    const filteredApplicableUnits = this.selectionState.selectedIndicator.applicableSpatialUnits.filter(function (
      applicableSpatialUnit: any
    ) {
      if (applicableSpatialUnit.spatialUnitId === spatialUnitMetadata.spatialUnitId) {
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
    console.log('fetching all metadata from management component');

    if (this.authService.isAuthenticated()) {
      const loadUser$ = this.authService.loadUserProfile();
      if (!loadUser$) {
        console.log('User profile is not available');
        return;
      }
      await loadUser$
        .then((profile) => {
          // set user profile
          this.currentKeycloakUser = profile;
          console.log('User logged in with email: ' + profile.email);

          const tokenParsed = this.authService.getTokenParsed();
          if (tokenParsed && tokenParsed.realm_access && tokenParsed.realm_access.roles) {
            this.accessControlService.currentKeycloakLoginRoles = tokenParsed.realm_access.roles;
            if (
              this.accessControlService.currentKeycloakLoginRoles.includes(
                this.envConfigService.keycloakKomMonitorAdminRoleName
              )
            ) {
              this.accessControlService.isRealmAdmin = true;
              // this.accessControlService.currentKeycloakLoginRoles = this.accessControlService.currentKeycloakLoginRoles.concat(Auth.keycloak.tokenParsed.resource_access["realm-management"].roles);
            }
            if (tokenParsed['groups']) {
              this.accessControlService.currentKeycloakLoginGroups = tokenParsed['groups'];
            }
            this.accessControlService.currentKeycloakLoginGroupNames = this.accessControlService.currentKeycloakLoginGroups.map(
              (groupPath) => groupPath.split('/')[groupPath.split('/').length - 1]
            );
          } else {
            this.accessControlService.currentKeycloakLoginRoles = [];
            this.accessControlService.currentKeycloakLoginGroups = [];
          }
        })
        .catch(function () {
          console.log('Failed to load user profile');
        });
      await this.fetchAccessControlMetadata(this.accessControlService.currentKeycloakLoginRoles);
    }

    // revise metadata fecthing for protected endpoints
    forkJoin({
      // scriptsPromise: this.fetchIndicatorScriptsMetadata(),
      topicsPromise: this.fetchTopicsMetadata(this.accessControlService.currentKeycloakLoginRoles),
      spatialUnitsPromise: this.fetchSpatialUnitsMetadata(this.accessControlService.currentKeycloakLoginRoles),
      georesourcesPromise: this.fetchGeoresourcesMetadata(this.accessControlService.currentKeycloakLoginRoles, filter),
      indicatorsPromise: this.fetchIndicatorsMetadata(this.accessControlService.currentKeycloakLoginRoles, filter),
      servicePromises: this.fetchServices(this.accessControlService.currentKeycloakLoginRoles, filter),
    }).subscribe({
      next: (_response: any) => {
        this.modifyIndicatorApplicableSpatialUnitsForLoginRoles();

        this.buildHeadlineIndicatorHierarchy();
        this.buildTopicIndicatorHierarchy();
        this.topicIndicatorHierarchy_forOrderView = JSON.parse(
          JSON.stringify(this.topicIndicatorHierarchy)
        );
        this.buildComputationIndicatorHierarchy();

        this.buildTopicGeoresourceHierarchy(filter);

        console.log('Metadata fetched. Call initialize event.');

        this.setMetadataState(MetadataLoadingState.COMPLETE);
        this.onMetadataLoadingCompleted();
      },
      error: (error) => {
        // todo error handling
        this.displayMapApplicationError(
          'Beim Laden der erforderlichen Anwendungsdaten ist ein Fehler aufgetreten. Bitte wenden Sie sich an Ihren Administrator.'
        );
        this.broadcastService.broadcast('initialMetadataLoadingFailed', [error]);
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
    this.topicStore.setTopics(await this.cacheHelperService.fetchTopicsMetadata(keycloakRolesArray));
  }

  async fetchSpatialUnitsMetadata(keycloakRolesArray) {
    this.spatialUnitStore.setSpatialUnits(
      await this.cacheHelperService.fetchSpatialUnitsMetadata(keycloakRolesArray)
    );
  }

  async fetchGeoresourcesMetadata(keycloakRolesArray, filter) {
    this.georesourceStore.setGeoresources(
      await this.cacheHelperService.fetchGeoresourceMetadata(keycloakRolesArray, filter)
    );
  }

  async fetchIndicatorsMetadata(keycloakRolesArray, filter: any = undefined) {
    this.indicatorStore.setIndicators(
      await this.cacheHelperService.fetchIndicatorsMetadata(keycloakRolesArray, filter)
    );
  }

  async fetchIndicatorScriptsMetadata() {
    this.processScriptStore.setProcessScripts(
      await this.cacheHelperService.fetchProcessScriptsMetadata(this.accessControlService.currentKeycloakLoginRoles)
    );
  }

  async fetchServices(keycloakRolesArray, filter = undefined) {
    this.georesourceStore.setServices(
      await this.cacheHelperService.fetchServices(keycloakRolesArray, filter)
    );
  }

  async reinitServices(): Promise<void> {
    await this.fetchServices(this.accessControlService.currentKeycloakLoginRoles);
  }

  getLoiDashSvgFromStringValue(loiDashArrayString) {
    for (const loiDashArrayObject of LOI_DASH_ARRAY_OBJECTS) {
      if (loiDashArrayObject.dashArrayValue == loiDashArrayString) {
        return loiDashArrayObject.svgString;
      }
    }

    return '';
  }

  onMetadataLoadingCompleted() {
    this.broadcastService.broadcast('initialMetadataLoadingCompleted');

    setTimeout(() => {
      $('option').each(function (index, element) {
        const text = $(element).text();
        $(element).attr('title', text);
      });
    }, 1000);
  }

  private buildTopicGeoresourceHierarchy(filter: any = undefined) {
    this.topicHierarchyStore.buildTopicGeoresourceHierarchy(
      this.topicStore.availableTopics,
      this.georesourceStore.displayableGeoresources_keywordFiltered,
      this.georesourceStore.wmsDatasets_keywordFiltered,
      this.georesourceStore.wfsDatasets_keywordFiltered,
      this.georesourceStore.georesourceMapKey_forUnmappedTopicReferences,
      filter
    );
  }

  private buildComputationIndicatorHierarchy() {
    this.topicHierarchyStore.buildComputationIndicatorHierarchy(
      this.displayableIndicators_keywordFiltered,
      this.processScriptStore.availableProcessScripts
    );
  }

  private buildTopicIndicatorHierarchy() {
    this.topicHierarchyStore.buildTopicIndicatorHierarchy(
      this.topicStore.availableTopics,
      this.displayableIndicators_keywordFiltered,
      this.georesourceStore.getAvailableIndiWmsDatasets()
    );
  }

  modifyIndicatorApplicableSpatialUnitsForLoginRoles() {
    this.indicatorStore.modifyIndicatorApplicableSpatialUnitsForLoginRoles(
      this.spatialUnitStore.availableSpatialUnits
    );
    // displayableIndicators_keywordFiltered is B4 state and stays in the facade
    this.displayableIndicators_keywordFiltered = JSON.parse(
      JSON.stringify(this.indicatorStore.displayableIndicators)
    );
  }


  private buildHeadlineIndicatorHierarchy() {
    this.topicHierarchyStore.buildHeadlineIndicatorHierarchy(
      this.displayableIndicators_keywordFiltered,
      this.processScriptStore.availableProcessScripts
    );
  }

  async fetchAccessControlMetadata(keycloakRolesArray) {
    this.accessControlService.setAccessControl(
      await this.cacheHelperService.fetchAccessControlMetadata(keycloakRolesArray)
    );
    this.accessControlService.setCurrentKomMonitorLoginRoleNames();
    this.accessControlService.setCurrentKomMonitorLoginOrganizationalUnits();
  }

  async downloadMetadataPDF_georesource(georesourceMetadata) {
    return this.metadataExportService.downloadMetadataPDF_georesource(
      georesourceMetadata,
      this.topicStore.availableTopics
    );
  }

  async createMetadataPDF_georesource(georesource, pdfName) {
    return this.metadataExportService.createMetadataPDF_georesource(
      georesource,
      pdfName,
      this.topicStore.availableTopics
    );
  }

  async createMetadataPDF_indicator(indicator) {
    return this.metadataExportService.createMetadataPDF_indicator(
      indicator,
      this.spatialUnitStore.availableSpatialUnits,
      this.topicStore.availableTopics
    );
  }

  private getTopicHierarchyForTopicId(topicReferenceId) {
    return this.topicHierarchyStore.getTopicHierarchyForTopicId(
      this.topicStore.availableTopics,
      topicReferenceId
    );
  }

  async generateAndDownloadIndicatorZIP(indicatorData, fileName, fileEnding, jsZipOptions) {
    return this.metadataExportService.generateAndDownloadIndicatorZIP(
      indicatorData,
      fileName,
      fileEnding,
      jsZipOptions,
      this.selectionState.selectedIndicator,
      this.spatialUnitStore.availableSpatialUnits,
      this.topicStore.availableTopics
    );
  }

  async generateIndicatorMetadataPdf_asBlob() {
    return this.metadataExportService.generateIndicatorMetadataPdf_asBlob(
      this.selectionState.selectedIndicator,
      this.spatialUnitStore.availableSpatialUnits,
      this.topicStore.availableTopics
    );
  }

  async generateIndicatorMetadataPdf(indicatorMetadata, pdfName) {
    return this.metadataExportService.generateIndicatorMetadataPdf(
      indicatorMetadata,
      pdfName,
      this.spatialUnitStore.availableSpatialUnits,
      this.topicStore.availableTopics
    );
  }

  displayMapApplicationError(error) {
    setTimeout(() => {
      if (error.data) {
        this.errorMessage = this.indicatorValueService.syntaxHighlightJSON(error.data);
      }
      if (error.message) {
        this.errorMessage = this.indicatorValueService.syntaxHighlightJSON(error.message);
      } else {
        this.errorMessage = this.indicatorValueService.syntaxHighlightJSON(error);
      }

      // $rootScope.$apply();
      this.broadcastService.broadcast('hideLoadingIconOnMap');

      $('.mapApplicationErrorAlert').show();
    }, 1000);
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

  selectedSpatialUnitIsRaster() {
    const spatialUnitName = this.selectionState.selectedSpatialUnit
      ? this.selectionState.selectedSpatialUnit.spatialUnitLevel
      : '';

    return (
      spatialUnitName.includes('raster') ||
      spatialUnitName.includes('Raster') ||
      spatialUnitName.includes('RASTER') ||
      spatialUnitName.includes('grid') ||
      spatialUnitName.includes('GRID') ||
      spatialUnitName.includes('Grid')
    );
  }

  async generateAndDownloadGeoresourceZIP(
    georesourceMetadata,
    georesourceData,
    fileName,
    fileEnding,
    jsZipOptions
  ) {
    return this.metadataExportService.generateAndDownloadGeoresourceZIP(
      georesourceMetadata,
      georesourceData,
      fileName,
      fileEnding,
      jsZipOptions,
      this.topicStore.availableTopics
    );
  }

  async generateGeoresourceMetadataPdf_asBlob(georesourceMetadata) {
    return this.metadataExportService.generateGeoresourceMetadataPdf_asBlob(
      georesourceMetadata,
      this.topicStore.availableTopics
    );
  }

  filterIndicators() {
    return this.metadataFilterService.filterIndicators();
  }

  isDisplayableGeoresource(item) {
    return this.georesourceStore.isDisplayableGeoresource(item);
  }

  getIndicatorAbbreviationFromIndicatorId(indicatorId) {
    for (const indicatorMetadata of this.indicatorStore.availableIndicators) {
      if (indicatorMetadata.indicatorId === indicatorId) {
        return indicatorMetadata.abbreviation;
      }
    }
  }

}
