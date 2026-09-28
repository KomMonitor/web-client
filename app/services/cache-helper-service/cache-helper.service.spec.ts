import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CacheHelperServiceService } from './cache-helper.service';

const API = 'http://dm/';
const LAST_MOD_URL = API + 'management/public/database/last-modification';
const SPATIAL_UNITS_URL = API + 'management/spatial-units';

/** Lets the chained awaits inside the service run up to the next HTTP request. */
const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve));

describe('CacheHelperServiceService', () => {
  let service: CacheHelperServiceService;
  let http: HttpTestingController;
  let previousEnv: any;

  beforeEach(() => {
    previousEnv = (window as any).__env;
    (window as any).__env = {
      ...previousEnv,
      apiUrl: API,
      basePath: 'management',
      localStoragePrefix: 'spec',
      keycloakKomMonitorAdminRoleName: 'kommonitor-creator',
    };
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CacheHelperServiceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    (window as any).__env = previousEnv;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('shares one last-modification request between concurrent callers', async () => {
    const first = service.fetchLastDatabaseModificationObject();
    const second = service.fetchLastDatabaseModificationObject();

    http.expectOne(LAST_MOD_URL).flush({ 'spatial-units': 't1' });
    await Promise.all([first, second]);

    expect(service.lastDatabaseModificationInfo?.['spatial-units']).toBe('t1');
  });

  it('refetches a resource list once the server reports a newer modification', async () => {
    const roles = ['kommonitor-creator'];

    // First load: nothing cached, so the list comes from the server.
    const initial = service.fetchSpatialUnitsMetadata(roles);
    http.expectOne(LAST_MOD_URL).flush({ 'spatial-units': 't1' });
    await flushMicrotasks();
    http.expectOne(SPATIAL_UNITS_URL).flush([{ spatialUnitLevel: 'Testquartiere' }]);
    expect((await initial).map((unit) => unit.spatialUnitLevel)).toEqual(['Testquartiere']);

    // Unchanged timestamp: served from localStorage, no list request.
    const cached = service.fetchSpatialUnitsMetadata(roles);
    http.expectOne(LAST_MOD_URL).flush({ 'spatial-units': 't1' });
    expect((await cached).map((unit) => unit.spatialUnitLevel)).toEqual(['Testquartiere']);

    // A spatial unit was registered: the new timestamp forces a server fetch.
    const refreshed = service.fetchSpatialUnitsMetadata(roles);
    http.expectOne(LAST_MOD_URL).flush({ 'spatial-units': 't2' });
    await flushMicrotasks();
    http
      .expectOne(SPATIAL_UNITS_URL)
      .flush([{ spatialUnitLevel: 'Testquartiere 2' }, { spatialUnitLevel: 'Testquartiere' }]);
    expect((await refreshed).map((unit) => unit.spatialUnitLevel)).toEqual([
      'Testquartiere 2',
      'Testquartiere',
    ]);
  });
});
