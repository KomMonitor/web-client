import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { OrganizationalUnitPermissionInputType } from 'models/data-management-api';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { KeycloakHelperService } from 'services/keycloak-helper-service/keycloak-helper.service';

import { AdminRoleManagementService } from './admin-role-management.service';

/** Covers the batch permission update; the other calls predate this spec. */
describe('AdminRoleManagementService', () => {
  const BASE = 'http://dm-api/management';
  let service: AdminRoleManagementService;
  let httpMock: HttpTestingController;

  const body: OrganizationalUnitPermissionInputType[] = [
    {
      organizationalUnitId: 'a',
      permissions: {
        georesources: [{ id: 'g', permissions: ['a-viewer'] }],
        indicatorspatialunits: [{ id: 'i', spatialUnitId: 's', permissions: [] }],
      },
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EnvConfigService, useValue: { baseUrlToKomMonitorDataAPI: BASE } },
        { provide: AccessControlService, useValue: {} },
        { provide: IndicatorValueService, useValue: {} },
        { provide: KeycloakHelperService, useValue: {} },
      ],
    });
    service = TestBed.inject(AdminRoleManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('patchDatasetPermissions', () => {
    it('sends the whole batch in one PATCH without a unit id in the path', async () => {
      const done = firstValueFrom(service.patchDatasetPermissions(body));

      const request = httpMock.expectOne(`${BASE}/organizationalUnits/permissions`);
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual(body);
      request.flush([{ id: 'a', name: 'a', permissions: [] }]);

      await expect(done).resolves.toBeUndefined();
    });

    it('passes an error on to the caller', async () => {
      const done = firstValueFrom(service.patchDatasetPermissions(body));

      httpMock
        .expectOne(`${BASE}/organizationalUnits/permissions`)
        .flush({ message: 'unknown permission' }, { status: 400, statusText: 'Bad Request' });

      await expect(done).rejects.toMatchObject({
        status: 400,
        error: { message: 'unknown permission' },
      });
    });
  });
});
