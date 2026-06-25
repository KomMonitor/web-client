import { Injectable, inject } from '@angular/core';
import {
  DEFAULT_POI_SIZE,
  LOI_DASH_ARRAY_OBJECTS,
  MetadataLoadingState,
  PoiSize,
} from './data-exchange.constants';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { IndicatorsDataset } from 'components/ngComponents/models/indicators.models';
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

  // Prio7 B5: hierarchy results live in TopicHierarchyStoreService; consumers read them
  // directly from the store now (facade getters removed). The build* wrappers below stay
  // because they drive the facade-internal metadata-fetch orchestration.
  currentKeycloakUser!: KeycloakProfile;

  setMetadataState(state: MetadataLoadingState) {
    this.metadataLoadingSubject.next(state);
  }

  hideErrorAlert() {
    $('.mapApplicationErrorAlert').hide();
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
          JSON.stringify(this.topicHierarchyStore.topicIndicatorHierarchy)
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

  }

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
      this.metadataFilterService.displayableIndicators_keywordFiltered,
      this.processScriptStore.availableProcessScripts
    );
  }

  private buildTopicIndicatorHierarchy() {
    this.topicHierarchyStore.buildTopicIndicatorHierarchy(
      this.topicStore.availableTopics,
      this.metadataFilterService.displayableIndicators_keywordFiltered,
      this.georesourceStore.getAvailableIndiWmsDatasets()
    );
  }

  modifyIndicatorApplicableSpatialUnitsForLoginRoles() {
    this.indicatorStore.modifyIndicatorApplicableSpatialUnitsForLoginRoles(
      this.spatialUnitStore.availableSpatialUnits
    );
    this.metadataFilterService.displayableIndicators_keywordFiltered = JSON.parse(
      JSON.stringify(this.indicatorStore.displayableIndicators)
    );
  }

  private buildHeadlineIndicatorHierarchy() {
    this.topicHierarchyStore.buildHeadlineIndicatorHierarchy(
      this.metadataFilterService.displayableIndicators_keywordFiltered,
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

      this.broadcastService.broadcast('hideLoadingIconOnMap');

      $('.mapApplicationErrorAlert').show();
    }, 1000);
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

}
