import { Injectable, inject } from '@angular/core';
import { KeycloakProfile } from 'keycloak-js';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AuthService } from 'services/auth-service/auth.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MetadataFilterService } from 'services/metadata-filter-service/metadata-filter.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';

/** Loading state of the app-startup metadata orchestration (MetadataBootstrapService). */
export enum MetadataLoadingState {
  NONE,
  INPROGRESS,
  COMPLETE,
  ERROR,
}

/**
 * Initial metadata bootstrap orchestration, extracted from DataExchangeService
 * (Prio 7 / B1 — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Owns the app-startup metadata flow: auth/user-profile load, the parallel
 * fetch of topics/spatial-units/georesources/indicators/services into their
 * stores, the hierarchy (re)build and the loading-state signalling. The
 * DataExchangeService facade re-exposes the externally-used members via thin
 * wrappers so its consumers stay unchanged (consumer migration is a later step).
 */
@Injectable({
  providedIn: 'root',
})
export class MetadataBootstrapService {
  private authService = inject(AuthService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private accessControlService = inject(AccessControlService);
  private broadcastService = inject(BroadcastService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private topicHierarchyStore = inject(TopicHierarchyStoreService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private metadataFilterService = inject(MetadataFilterService);

  private metadataLoadingSubject = new BehaviorSubject<MetadataLoadingState>(
    MetadataLoadingState.NONE
  );
  metadataLoading$ = this.metadataLoadingSubject.asObservable();

  currentKeycloakUser!: KeycloakProfile;

  topicIndicatorHierarchy_forOrderView: any[] = [];

  setMetadataState(state: MetadataLoadingState) {
    this.metadataLoadingSubject.next(state);
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

          this.accessControlService.applyLoginStateFromToken(this.authService.getTokenParsed());
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
        this.mapErrorNotificationService.displayMapApplicationError(
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

  async fetchAccessControlMetadata(keycloakRolesArray) {
    this.accessControlService.setAccessControl(
      await this.cacheHelperService.fetchAccessControlMetadata(keycloakRolesArray)
    );
    this.accessControlService.setCurrentKomMonitorLoginRoleNames();
    this.accessControlService.setCurrentKomMonitorLoginOrganizationalUnits();
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

  modifyIndicatorApplicableSpatialUnitsForLoginRoles() {
    this.indicatorStore.modifyIndicatorApplicableSpatialUnitsForLoginRoles(
      this.spatialUnitStore.availableSpatialUnits
    );
    this.metadataFilterService.displayableIndicators_keywordFiltered = JSON.parse(
      JSON.stringify(this.indicatorStore.displayableIndicators)
    );
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

  private buildHeadlineIndicatorHierarchy() {
    this.topicHierarchyStore.buildHeadlineIndicatorHierarchy(
      this.metadataFilterService.displayableIndicators_keywordFiltered,
      this.processScriptStore.availableProcessScripts
    );
  }
}
