import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { KeycloakHelperService } from './keycloak-helper.service';
import { AuthService } from 'services/auth-service/auth.service';

describe('KeycloakHelperService', () => {
  let service: KeycloakHelperService;
  let httpMock: HttpTestingController;

  const BASE = 'http://keycloak/auth/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => 'token-123' } },
      ],
    });
    service = TestBed.inject(KeycloakHelperService);
    httpMock = TestBed.inject(HttpTestingController);

    service.configureKeycloakParameters({
      'auth-server-url': BASE,
      realm: 'kommonitor',
      resource: 'client',
    });
  });

  afterEach(() => httpMock.verify());

  it('derives the admin console URL from the keycloak config', () => {
    expect(service.targetRealmUrlToKeycloakInstance).toBe(BASE + 'admin/kommonitor/console/');
  });

  it('fetchAndSetKeycloakRoles stores the fetched realm roles (not a Subscription)', async () => {
    const promise = service.fetchAndSetKeycloakRoles();

    const req = httpMock.expectOne(BASE + 'admin/realms/kommonitor/roles');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush([{ id: 'r1', name: 'stadt-viewer' }]);

    await promise;
    expect(service.availableKeycloakRoles).toEqual([{ id: 'r1', name: 'stadt-viewer' }]);
  });

  it('deleteRoles deletes the four resource roles by their resolved ids, sequentially', async () => {
    service.availableKeycloakRoles = [
      { id: 'v', name: 'stadt-viewer' },
      { id: 'e', name: 'stadt-editor' },
      { id: 'p', name: 'stadt-publisher' },
      { id: 'c', name: 'stadt-creator' },
    ];

    const promise = service.deleteRoles('stadt');

    // requests are sequential: each one appears only after the previous flush
    for (const id of ['v', 'e', 'p', 'c']) {
      const req = httpMock.expectOne(BASE + 'admin/realms/kommonitor/roles-by-id/' + id);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
      // let the awaited firstValueFrom settle before the loop issues the next request
      await new Promise((resolve) => setTimeout(resolve));
    }

    await promise;
  });

  it('deleteRoles rejects with a clear error when a role is missing from the cache', async () => {
    service.availableKeycloakRoles = [];
    await expect(service.deleteRoles('stadt')).rejects.toThrow(
      "Keycloak role 'stadt-viewer' not found"
    );
  });

  it('renameExistingRoles PUTs the new names with the organizational-unit attribute', async () => {
    service.availableKeycloakRoles = [
      { id: 'v', name: 'alt-viewer' },
      { id: 'e', name: 'alt-editor' },
      { id: 'p', name: 'alt-publisher' },
      { id: 'c', name: 'alt-creator' },
    ];

    const promise = service.renameExistingRoles('alt', 'neu', { organizationalUnitId: 'ou-1' });

    for (const [id, suffix] of [
      ['v', 'viewer'],
      ['e', 'editor'],
      ['p', 'publisher'],
      ['c', 'creator'],
    ]) {
      const req = httpMock.expectOne(BASE + 'admin/realms/kommonitor/roles-by-id/' + id);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        name: 'neu-' + suffix,
        attributes: { kommonitorOrganizationalUnitId: ['ou-1'] },
      });
      req.flush({});
      await new Promise((resolve) => setTimeout(resolve));
    }

    await promise;
  });

  it('propagates HTTP errors to the caller', async () => {
    const promise = service.fetchAndSetKeycloakRoles();
    httpMock
      .expectOne(BASE + 'admin/realms/kommonitor/roles')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await expect(promise).rejects.toBeTruthy();
  });
});
