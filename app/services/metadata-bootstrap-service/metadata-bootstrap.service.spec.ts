import { TestBed } from '@angular/core/testing';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AuthService } from 'services/auth-service/auth.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MetadataFilterService } from 'services/metadata-filter-service/metadata-filter.service';
import { OptionTitleTooltipService } from 'services/option-title-tooltip-service/option-title-tooltip.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';

import { MetadataBootstrapService, MetadataLoadingState } from './metadata-bootstrap.service';

/** Minimal manually-resolvable promise for controlling async timing in tests. */
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('MetadataBootstrapService', () => {
  let service: MetadataBootstrapService;

  let authService: {
    isAuthenticated: jest.Mock;
    loadUserProfile: jest.Mock;
    getTokenParsed: jest.Mock;
  };
  let cacheHelper: {
    init: jest.Mock;
    fetchTopicsMetadata: jest.Mock;
    fetchSpatialUnitsMetadata: jest.Mock;
    fetchGeoresourceMetadata: jest.Mock;
    fetchIndicatorsMetadata: jest.Mock;
    fetchServices: jest.Mock;
    fetchAccessControlMetadata: jest.Mock;
  };
  let mapError: jest.Mock;
  let tooltip: { applyToAllOptions: jest.Mock };

  beforeEach(() => {
    authService = {
      isAuthenticated: jest.fn().mockReturnValue(false),
      loadUserProfile: jest.fn(),
      getTokenParsed: jest.fn().mockReturnValue({}),
    };
    cacheHelper = {
      init: jest.fn().mockResolvedValue(undefined),
      fetchTopicsMetadata: jest.fn().mockResolvedValue([]),
      fetchSpatialUnitsMetadata: jest.fn().mockResolvedValue([]),
      fetchGeoresourceMetadata: jest.fn().mockResolvedValue([]),
      fetchIndicatorsMetadata: jest.fn().mockResolvedValue([]),
      fetchServices: jest.fn().mockResolvedValue([]),
      fetchAccessControlMetadata: jest.fn().mockResolvedValue([]),
    };
    mapError = jest.fn();
    tooltip = { applyToAllOptions: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        MetadataBootstrapService,
        { provide: AuthService, useValue: authService },
        { provide: CacheHelperServiceService, useValue: cacheHelper },
        {
          provide: MapErrorNotificationService,
          useValue: { displayMapApplicationError: mapError },
        },
        { provide: OptionTitleTooltipService, useValue: tooltip },
        {
          provide: AccessControlService,
          useValue: {
            currentKeycloakLoginRoles: [],
            applyLoginStateFromToken: jest.fn(),
            setAccessControl: jest.fn(),
            setCurrentKomMonitorLoginRoleNames: jest.fn(),
            setCurrentKomMonitorLoginOrganizationalUnits: jest.fn(),
          },
        },
        {
          provide: SpatialUnitMetadataStoreService,
          useValue: { setSpatialUnits: jest.fn(), availableSpatialUnits: [] },
        },
        {
          provide: ProcessScriptMetadataStoreService,
          useValue: { setProcessScripts: jest.fn(), availableProcessScripts: [] },
        },
        {
          provide: TopicMetadataStoreService,
          useValue: { setTopics: jest.fn(), availableTopics: [] },
        },
        {
          provide: IndicatorMetadataStoreService,
          useValue: {
            setIndicators: jest.fn(),
            modifyIndicatorApplicableSpatialUnitsForLoginRoles: jest.fn(),
            displayableIndicators: [],
          },
        },
        {
          provide: GeoresourceMetadataStoreService,
          useValue: {
            setGeoresources: jest.fn(),
            setServices: jest.fn(),
            displayableGeoresources_keywordFiltered: [],
            wmsDatasets_keywordFiltered: [],
            wfsDatasets_keywordFiltered: [],
            georesourceMapKey_forUnmappedTopicReferences: {},
            getAvailableIndiWmsDatasets: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: MetadataFilterService,
          useValue: { displayableIndicators_keywordFiltered: [] },
        },
        {
          provide: TopicHierarchyStoreService,
          useValue: {
            buildTopicGeoresourceHierarchy: jest.fn(),
            buildComputationIndicatorHierarchy: jest.fn(),
            buildTopicIndicatorHierarchy: jest.fn(),
            buildHeadlineIndicatorHierarchy: jest.fn(),
            topicIndicatorHierarchy: [],
          },
        },
      ],
    });

    service = TestBed.inject(MetadataBootstrapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('resolves only after all source fetches complete and signals COMPLETE', async () => {
    const states: MetadataLoadingState[] = [];
    service.metadataLoading$.subscribe((s) => states.push(s));

    await service.fetchAllMetadata();

    expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(1);
    expect(cacheHelper.fetchIndicatorsMetadata).toHaveBeenCalledTimes(1);
    expect(states).toEqual([
      MetadataLoadingState.NONE,
      MetadataLoadingState.INPROGRESS,
      MetadataLoadingState.COMPLETE,
    ]);
    expect(tooltip.applyToAllOptions).toHaveBeenCalledTimes(1);
  });

  it('transitions to ERROR when a fetch rejects', async () => {
    cacheHelper.fetchIndicatorsMetadata.mockRejectedValueOnce(new Error('boom'));
    const states: MetadataLoadingState[] = [];
    service.metadataLoading$.subscribe((s) => states.push(s));

    await service.fetchAllMetadata();

    expect(states).toContain(MetadataLoadingState.ERROR);
    expect(states).not.toContain(MetadataLoadingState.COMPLETE);
    expect(mapError).toHaveBeenCalledTimes(1);
    expect(tooltip.applyToAllOptions).not.toHaveBeenCalled();
  });

  it('loads the user profile and access control only when authenticated', async () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.loadUserProfile.mockReturnValue(Promise.resolve({ email: 'a@b.de' }));

    await service.fetchAllMetadata();

    expect(authService.loadUserProfile).toHaveBeenCalledTimes(1);
    expect(cacheHelper.fetchAccessControlMetadata).toHaveBeenCalledTimes(1);
    expect(service.currentKeycloakUser).toEqual({ email: 'a@b.de' });
  });

  it('serializes overlapping loads instead of running them concurrently', async () => {
    const gate1 = deferred();
    const gate2 = deferred();
    cacheHelper.fetchTopicsMetadata
      .mockReturnValueOnce(gate1.promise)
      .mockReturnValueOnce(gate2.promise);

    const flush = () => new Promise((r) => setTimeout(r, 0));

    const p1 = service.fetchAllMetadata();
    const p2 = service.fetchAllMetadata();

    // Let pending tasks settle; the second run must not have started yet
    // because the first one is still blocked on its topics fetch.
    await flush();
    expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(1);

    gate1.resolve(undefined);
    await p1;
    await flush();
    // First run finished; the chained second run has now begun.
    expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(2);

    gate2.resolve(undefined);
    await p2;
  });

  describe('ensureMetadataLoaded', () => {
    it('skips the fetch when a load with the same filter already completed', async () => {
      await service.fetchAllMetadata();
      expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(1);

      await service.ensureMetadataLoaded();
      expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(1);
    });

    it('joins an in-flight load with the same filter instead of chaining a new one', async () => {
      const gate = deferred();
      cacheHelper.fetchTopicsMetadata.mockReturnValueOnce(gate.promise);

      const first = service.fetchAllMetadata();
      const joined = service.ensureMetadataLoaded();

      gate.resolve(undefined);
      await Promise.all([first, joined]);
      expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(1);
    });

    it('refetches when the requested filter differs from the last load', async () => {
      await service.fetchAllMetadata({ keywords: ['a'] });
      expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(1);

      // admin entry requests the unfiltered state
      await service.ensureMetadataLoaded();
      expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(2);
    });

    it('fetches when nothing was loaded yet', async () => {
      await service.ensureMetadataLoaded();
      expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(1);
    });

    it('retries after a failed load instead of treating it as loaded', async () => {
      cacheHelper.fetchTopicsMetadata.mockRejectedValueOnce(new Error('boom'));
      await service.fetchAllMetadata();

      await service.ensureMetadataLoaded();
      expect(cacheHelper.fetchTopicsMetadata).toHaveBeenCalledTimes(2);
    });
  });
});
