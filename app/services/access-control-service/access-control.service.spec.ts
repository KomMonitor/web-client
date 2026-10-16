import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
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

  it('lists the configured admin role among the KomMonitor login roles', () => {
    const previousEnv = (window as any).__env;
    (window as any).__env = {
      ...previousEnv,
      keycloakKomMonitorAdminRoleName: 'realm-admin',
      keycloakKomMonitorGroupsEditRoleNames: ['client-users-creator'],
      keycloakKomMonitorThemesEditRoleNames: [],
      keycloakKomMonitorGeodataEditRoleNames: ['unit-resources-creator'],
    };
    try {
      service.accessControl = [{ organizationalUnitId: 'o1', name: 'Org One' }];
      service.currentKeycloakLoginRoles = [
        'realm-admin',
        'kommonitor-creator',
        'Org One.unit-resources-creator',
        'offline_access',
      ];

      service.setCurrentKomMonitorLoginRoleNames();

      expect(service.currentKomMonitorLoginRoleNames).toEqual([
        'realm-admin',
        'Org One.unit-resources-creator',
      ]);
    } finally {
      (window as any).__env = previousEnv;
    }
  });

  describe('per-group checks mirroring the backend', () => {
    // Tenant 52N with the subgroup "editor" and its subgroup "team", plus a
    // second tenant whose name contains a dot.
    const units: AccessControlMetadata[] = [
      { organizationalUnitId: 'm', name: '52N', mandant: true, permissions: [] },
      { organizationalUnitId: 'e', name: 'editor', parentId: 'm', mandant: false, permissions: [] },
      { organizationalUnitId: 't', name: 'team', parentId: 'e', mandant: false, permissions: [] },
      { organizationalUnitId: 'd', name: 'Stadt.Nord', mandant: true, permissions: [] },
    ];
    let previousEnv: any;

    beforeEach(() => {
      previousEnv = (window as any).__env;
      (window as any).__env = {
        ...previousEnv,
        keycloakKomMonitorAdminRoleName: 'kommonitor-creator',
      };
      service.accessControl = units;
    });

    afterEach(() => {
      (window as any).__env = previousEnv;
    });

    const loginWith = (...roles: string[]) => {
      service.currentKeycloakLoginRoles = roles;
    };

    describe('canManageHierarchiesOf', () => {
      it('allows the platform administrator', () => {
        loginWith('kommonitor-creator');
        expect(service.canManageHierarchiesOf('52N')).toBe(true);
      });

      it('allows client-resources-creator on the tenant itself', () => {
        loginWith('52N.client-resources-creator');
        expect(service.canManageHierarchiesOf('52N')).toBe(true);
        expect(service.canManageHierarchiesOf('Stadt.Nord')).toBe(false);
      });

      it('refuses unit-resources-creator on the tenant', () => {
        loginWith('52N.unit-resources-creator');
        expect(service.canManageHierarchiesOf('52N')).toBe(false);
      });

      it('refuses client-resources-creator on a subgroup of the tenant', () => {
        loginWith('editor.client-resources-creator');
        expect(service.canManageHierarchiesOf('52N')).toBe(false);
      });

      it('refuses the 52n-editor profile', () => {
        loginWith('editor.unit-resources-creator', 'kommonitor-viewer');
        expect(service.canManageHierarchiesOf('52N')).toBe(false);
      });

      it('refuses a group that is no tenant, and an unknown name', () => {
        loginWith('editor.client-resources-creator');
        expect(service.canManageHierarchiesOf('editor')).toBe(false);
        expect(service.canManageHierarchiesOf('')).toBe(false);
        expect(service.canManageHierarchiesOf('nowhere')).toBe(false);
      });

      it('reads tenant names containing a dot', () => {
        loginWith('Stadt.Nord.client-resources-creator');
        expect(service.canManageHierarchiesOf('Stadt.Nord')).toBe(true);
      });

      it('re-derives reactively once roles and groups arrive', () => {
        service.accessControl = [];
        const canManage = computed(() => service.canManageHierarchiesOf('52N'));
        expect(canManage()).toBe(false);

        loginWith('52N.client-resources-creator');
        expect(canManage()).toBe(false);

        service.accessControl = units;
        expect(canManage()).toBe(true);
      });
    });

    describe('canManageOrganization', () => {
      it('allows the platform administrator, even for an unknown unit', () => {
        loginWith('kommonitor-creator');
        expect(service.canManageOrganization('nowhere')).toBe(true);
      });

      it('allows unit-users-creator and client-users-creator on the unit itself', () => {
        loginWith('editor.unit-users-creator');
        expect(service.canManageOrganization('e')).toBe(true);
        loginWith('editor.client-users-creator');
        expect(service.canManageOrganization('e')).toBe(true);
      });

      it('allows client-users-creator on an ancestor', () => {
        loginWith('52N.client-users-creator');
        expect(service.canManageOrganization('t')).toBe(true);
      });

      it('refuses unit-users-creator on the parent', () => {
        loginWith('editor.unit-users-creator');
        expect(service.canManageOrganization('t')).toBe(false);
      });

      it('refuses a descendant role and resource roles', () => {
        loginWith('team.client-users-creator', 'editor.client-resources-creator');
        expect(service.canManageOrganization('e')).toBe(false);
      });

      it('refuses an unknown unit', () => {
        loginWith('52N.client-users-creator');
        expect(service.canManageOrganization('nowhere')).toBe(false);
      });
    });

    describe('canCreateSubgroupUnder', () => {
      it('allows client-users-creator on the parent or an ancestor', () => {
        loginWith('editor.client-users-creator');
        expect(service.canCreateSubgroupUnder('e')).toBe(true);
        loginWith('52N.client-users-creator');
        expect(service.canCreateSubgroupUnder('t')).toBe(true);
      });

      it('refuses unit-users-creator on the parent', () => {
        loginWith('editor.unit-users-creator');
        expect(service.canCreateSubgroupUnder('e')).toBe(false);
      });

      it('leaves groups without a parent to the platform administrator', () => {
        loginWith('52N.client-users-creator');
        expect(service.canCreateSubgroupUnder(null)).toBe(false);
        loginWith('kommonitor-creator');
        expect(service.canCreateSubgroupUnder(null)).toBe(true);
      });

      it('terminates on a cyclic parent chain', () => {
        service.accessControl = [
          { organizationalUnitId: 'a', name: 'A', parentId: 'b', permissions: [] },
          { organizationalUnitId: 'b', name: 'B', parentId: 'a', permissions: [] },
        ];
        loginWith('C.client-users-creator');
        expect(service.canCreateSubgroupUnder('a')).toBe(false);
        loginWith('B.client-users-creator');
        expect(service.canCreateSubgroupUnder('a')).toBe(true);
      });
    });
  });
});
