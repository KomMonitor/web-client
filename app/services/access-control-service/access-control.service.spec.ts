import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AccessControlService } from './access-control.service';

describe('AccessControlService', () => {
  let service: AccessControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccessControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('re-derives permission checks read reactively once the login roles arrive', () => {
    // The roles are applied after the first render (metadata bootstrap); an
    // OnPush template calling checkCreatePermission() must see the change.
    (window as any).__env = {
      ...(window as any).__env,
      keycloakKomMonitorAdminRoleName: 'kommonitor-creator',
    };
    const canCreate = computed(() => service.checkCreatePermission());
    expect(canCreate()).toBe(false);

    service.applyLoginStateFromToken({ realm_access: { roles: ['kommonitor-creator'] } });

    expect(canCreate()).toBe(true);
  });

  it('getRoleTitle returns the org name for a matching organizationalUnitId', () => {
    service.accessControl = [{ organizationalUnitId: 'o1', name: 'Org One' }];
    expect(service.getRoleTitle('o1')).toBe('Org One');
    expect(service.getRoleTitle('missing')).toBe('');
  });

  it('getRoleTitles maps roles to their last dot-segment', () => {
    service.currentKeycloakLoginRoles = ['a.b.client-users-creator', 'x.viewer'];
    expect(service.getRoleTitles()).toEqual(['client-users-creator', 'viewer']);
  });

  it('getAccessControlById finds the unit or returns null', () => {
    const unit = { organizationalUnitId: 'o1' };
    service.accessControl = [unit];
    expect(service.getAccessControlById('o1')).toBe(unit);
    expect(service.getAccessControlById('nope')).toBeNull();
  });

  it('updateAvailableRoles flattens permissions of all org units into availableRoles', () => {
    service.accessControl = [
      { name: 'Org', permissions: [{ permissionId: 'p1', permissionLevel: 'viewer' }] },
    ];
    service.updateAvailableRoles();
    expect(service.availableRoles.length).toBe(1);
    expect(service.availableRoles[0].roleName).toBe('Org-viewer');
  });
});
