import { Injectable, inject, signal } from '@angular/core';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

/**
 * Permissions / roles / access-control state and logic extracted from
 * DataExchangeService (Prio 7 / B3 — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Cohesive block: owns its own state (Keycloak/KomMonitor login info, accessControl
 * collections, available roles) and only mutates that state. The DataExchangeService
 * facade re-exposes the externally/orchestration-used fields via get/set delegation,
 * so its consumers and the remaining auth/fetch orchestration stay unchanged.
 */
@Injectable({
  providedIn: 'root',
})
export class AccessControlService {
  private envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);

  isRealmAdmin: boolean = false;
  currentKeycloakLoginGroupNames: any;

  availablePermissions: any[] = [];
  availableUsers: any[] = [];

  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _accessControl = signal<any[]>([]);
  get accessControl(): any[] {
    return this._accessControl();
  }
  set accessControl(value: any[]) {
    this._accessControl.set(value);
  }
  accessControl_map = new Map();
  allowedAccessControl: any[] = [];

  currentKeycloakLoginRoles: any[] = [];
  currentKomMonitorLoginRoleNames: any[] = [];
  currentKeycloakLoginGroups: any[] = [];
  currentKomMonitorLoginOrganizationalUnits: any[] = [];

  availableRoles: any[] = [];

  /**
   * Populate the current login roles/groups/admin flag from a parsed Keycloak token
   * (Prio 7 / B2 — moved out of the DataExchangeService bootstrap, which should not
   * own auth state derivation).
   */
  applyLoginStateFromToken(tokenParsed: any) {
    if (tokenParsed && tokenParsed.realm_access && tokenParsed.realm_access.roles) {
      this.currentKeycloakLoginRoles = tokenParsed.realm_access.roles;
      if (
        this.currentKeycloakLoginRoles.includes(
          this.envConfigService.keycloakKomMonitorAdminRoleName
        )
      ) {
        this.isRealmAdmin = true;
      }
      if (tokenParsed['groups']) {
        this.currentKeycloakLoginGroups = tokenParsed['groups'];
      }
      this.currentKeycloakLoginGroupNames = this.currentKeycloakLoginGroups.map(
        (groupPath) => groupPath.split('/')[groupPath.split('/').length - 1]
      );
    } else {
      this.currentKeycloakLoginRoles = [];
      this.currentKeycloakLoginGroups = [];
    }
  }

  checkDeletePermission() {
    if (this.checkAdminPermission()) {
      return true;
    }

    for (const role of this.currentKeycloakLoginRoles) {
      const roleNameParts = role.split('.');
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (
        permissionLevel === 'client-resources-creator' ||
        permissionLevel === 'unit-resources-creator'
      ) {
        return true;
      }
    }
    return false;
  }

  getAllowedRolesString(allowedPermissionIds) {
    const permissions: any[] = [];
    for (const organizationalUnit of this.accessControl) {
      for (const permission of organizationalUnit.permissions) {
        if (allowedPermissionIds.includes(permission.permissionId)) {
          permissions.push(organizationalUnit.name + '-' + permission.permissionLevel);
        }
      }
    }
    return permissions.join(', ');
  }

  getRoleTitle(organizationalUnitId) {
    const roles = this.accessControl.filter((e) => e.organizationalUnitId == organizationalUnitId);
    if (roles && roles.length > 0) {
      return roles[0].name;
    }
    return '';
  }

  getAccessControlById(id: string): AccessControlMetadata | null {
    return this.accessControl.find((unit) => unit.organizationalUnitId === id) || null;
  }

  setCurrentKomMonitorLoginOrganizationalUnits() {
    // now iterate once over all possible KomMonitor orgas and check if user belongs to this orga via its keycloak group
    this.currentKomMonitorLoginOrganizationalUnits = this.accessControl.filter((org) =>
      this.currentKeycloakLoginGroupNames.includes(org.name)
    );
  }

  setCurrentKomMonitorLoginRoleNames() {
    /*
      window.__env.keycloakKomMonitorGroupsEditRoleNames = ["client-users-creator", "unit-users-creator"];
      window.__env.keycloakKomMonitorThemesEditRoleNames = ["client-themes-creator", "unit-themes-creator"];
      window.__env.keycloakKomMonitorGeodataEditRoleNames = ["client-resources-creator", "unit-resources-creator"];
    */
    const roleSuffixes = this.envConfigService.keycloakKomMonitorGroupsEditRoleNames
      .concat(this.envConfigService.keycloakKomMonitorThemesEditRoleNames)
      .concat(this.envConfigService.keycloakKomMonitorGeodataEditRoleNames);
    const possibleRoles = ['kommonitor-creator'];
    this.accessControl.forEach((organizationalUnit) => {
      for (const roleSuffix of roleSuffixes) {
        possibleRoles.push(organizationalUnit.name + '.' + roleSuffix);
      }
    });
    this.currentKomMonitorLoginRoleNames = this.currentKeycloakLoginRoles.filter((role) =>
      possibleRoles.includes(role)
    );
  }

  setAccessControl(input) {
    this.accessControl_map = new Map(input.map((e) => [e.organizationalUnitId, e]));
    this.accessControl = Array.from(this.accessControl_map.values());
    this.updateAvailableRoles();
    this.allowedAccessControl = this.filterAllowedAccessControl(this.accessControl);
  }

  private filterAllowedAccessControl(acArray) {
    if (this.checkAdminPermission()) {
      return acArray;
    }

    const clientUserRoles = this.filterClientUserAdminRoles();
    const filtered: any[] = [];
    const existingOrgaIds: any[] = [];

    acArray.forEach((orga) => {
      const currentOrga = orga;
      while (orga) {
        clientUserRoles.forEach((role) => {
          const roleNameParts = role.split('.');
          const orgaName = roleNameParts[roleNameParts.length - 2];

          if (
            orgaName === orga.name &&
            !existingOrgaIds.includes(currentOrga.organizationalUnitId)
          ) {
            filtered.push(currentOrga);
            existingOrgaIds.push(currentOrga.organizationalUnitId);
          }
        });
        orga = this.accessControl_map.get(orga.parentId);
      }
    });
    return filtered;
  }

  filterClientUserAdminRoles() {
    return this.currentKeycloakLoginRoles.filter((role) => {
      const roleNameParts = role.split('.');
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (permissionLevel === 'client-users-creator') {
        return true;
      }
      return false;
    });
  }

  checkAdminPermission() {
    if (
      this.currentKeycloakLoginRoles.includes(this.envConfigService.keycloakKomMonitorAdminRoleName)
    ) {
      return true;
    }
    return false;
  }

  updateAvailableRoles() {
    this.availableRoles = [];

    for (const elem of this.accessControl) {
      for (const permission of elem.permissions) {
        const available = {
          ...permission,
          ...{
            organizationalUnit: elem,
            roleName: elem.name + '-' + permission.permissionLevel,
          },
        };
        this.availableRoles.push(available);
      }
    }
    // we need to refresh all modals as roles have changed
    this.broadcastService.broadcast(BroadcastMessage.AvailableRolesUpdate);
  }

  checkCreatePermission() {
    if (this.checkAdminPermission()) {
      return true;
    }

    for (const role of this.currentKeycloakLoginRoles) {
      const roleNameParts = role.split('.');
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (
        permissionLevel === 'client-resources-creator' ||
        permissionLevel === 'unit-resources-creator'
      ) {
        return true;
      }
    }
    return false;
  }

  checkEditorPermission() {
    if (this.checkAdminPermission()) {
      return true;
    }

    for (const role of this.currentKeycloakLoginRoles) {
      const roleNameParts = role.split('.');
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (
        permissionLevel === 'client-resources-creator' ||
        permissionLevel === 'unit-resources-creator'
      ) {
        return true;
      }
    }
    return false;
  }

  getRoleTitles() {
    return this.currentKeycloakLoginRoles.map(
      (role) => role.split('.')[role.split('.').length - 1]
    );
  }

  checkGroupsEditPermission() {
    if (this.checkAdminPermission()) return true;

    const splitRoles = this.getRoleTitles();
    let ret = false;

    this.envConfigService.keycloakKomMonitorGroupsEditRoleNames.forEach((targetRole) => {
      if (splitRoles.includes(targetRole)) ret = true;
    });

    return ret;
  }

  checkThemesEditPermission() {
    if (this.checkAdminPermission()) return true;

    const splitRoles = this.getRoleTitles();
    let ret = false;

    this.envConfigService.keycloakKomMonitorThemesEditRoleNames.forEach((targetRole) => {
      if (splitRoles.includes(targetRole)) ret = true;
    });

    return ret;
  }

  checkResourcesEditPermission() {
    if (this.checkAdminPermission()) return true;

    const splitRoles = this.getRoleTitles();
    let ret = false;

    this.envConfigService.keycloakKomMonitorGeodataEditRoleNames.forEach((targetRole) => {
      if (splitRoles.includes(targetRole)) ret = true;
    });

    return ret;
  }
}
