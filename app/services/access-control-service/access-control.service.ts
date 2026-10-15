import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AccessControlMetadata,
  AvailableRole,
} from 'components/ngComponents/models/permissions.models';
import { KeycloakTokenParsed } from 'keycloak-js';
import { AdminRoleType } from 'models/data-management-api';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * The administrative roles the Data Management API evaluates. A Keycloak realm
 * role carrying one is named `<organizational unit name>.<role>`.
 */
const ADMIN_ROLE_TYPES: readonly string[] = [
  'client-users-creator',
  'unit-users-creator',
  'client-resources-creator',
  'unit-resources-creator',
  'client-themes-creator',
  'unit-themes-creator',
] satisfies readonly AdminRoleType[];

/** An administrative role of the login, split into its group and the role itself. */
interface LoginAdminRole {
  readonly group: string;
  readonly role: AdminRoleType;
}

function isAdminRoleType(role: string): role is AdminRoleType {
  return ADMIN_ROLE_TYPES.includes(role);
}

/**
 * Permissions / roles / access-control state and logic. Extracted in the Prio 7 god-service split.
 *
 * Cohesive block: owns its own state (Keycloak/KomMonitor login info, accessControl
 * collections, available roles) and only mutates that state.
 */
@Injectable({
  providedIn: 'root',
})
export class AccessControlService {
  private envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);

  isRealmAdmin: boolean = false;
  currentKeycloakLoginGroupNames: string[] = [];

  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _accessControl = signal<AccessControlMetadata[]>([]);
  get accessControl(): AccessControlMetadata[] {
    return this._accessControl();
  }
  set accessControl(value: AccessControlMetadata[]) {
    this._accessControl.set(value);
  }
  accessControl_map = new Map<string, AccessControlMetadata>();

  // Signal-backed like `accessControl`: the roles arrive asynchronously during
  // the metadata bootstrap, after the first render. OnPush templates that call
  // `check…Permission()` register this signal as a dependency and re-render —
  // otherwise e.g. the admin "Erstellen" buttons stayed disabled whenever no
  // other event happened to re-render the page (an empty backend, say).
  private _currentKeycloakLoginRoles = signal<string[]>([]);
  get currentKeycloakLoginRoles(): string[] {
    return this._currentKeycloakLoginRoles();
  }
  set currentKeycloakLoginRoles(value: string[]) {
    this._currentKeycloakLoginRoles.set(value);
  }
  currentKomMonitorLoginRoleNames: string[] = [];
  currentKeycloakLoginGroups: string[] = [];
  currentKomMonitorLoginOrganizationalUnits: AccessControlMetadata[] = [];

  /**
   * The organizational units by id and by name. Derived from the signal rather
   * than read from `accessControl_map`, so they stay right however
   * `accessControl` is set, and callers re-derive when it changes. Names are
   * unique; the backend's table enforces it.
   */
  private readonly unitsById = computed(
    () => new Map(this._accessControl().map((unit) => [unit.organizationalUnitId, unit]))
  );
  private readonly unitsByName = computed(
    () => new Map(this._accessControl().map((unit) => [unit.name, unit]))
  );

  /**
   * The administrative roles of the login. Split at the last dot: group names
   * may contain dots, the roles never do. Everything else the token carries
   * (`offline_access`, the admin role, …) is dropped.
   */
  private readonly loginAdminRoles = computed<LoginAdminRole[]>(() =>
    this._currentKeycloakLoginRoles().flatMap((roleName) => {
      const separator = roleName.lastIndexOf('.');
      const role = roleName.slice(separator + 1);
      return separator > 0 && isAdminRoleType(role)
        ? [{ group: roleName.slice(0, separator), role }]
        : [];
    })
  );

  availableRoles: AvailableRole[] = [];

  /**
   * Populate the current login roles/groups/admin flag from a parsed Keycloak token
   * (moved out of the metadata bootstrap in the Prio 7 god-service split — the
   * bootstrap should not own auth state derivation).
   */
  applyLoginStateFromToken(tokenParsed: KeycloakTokenParsed | undefined) {
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
      // Keep the admin flag in step with the roles it was derived from, so a
      // later token-less call cannot leave isRealmAdmin stuck on true.
      this.isRealmAdmin = false;
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

  getAllowedRolesString(allowedPermissionIds: string[] | null | undefined): string {
    if (!allowedPermissionIds) {
      return '';
    }
    const permissions: string[] = [];
    for (const organizationalUnit of this.accessControl) {
      for (const permission of organizationalUnit.permissions) {
        if (allowedPermissionIds.includes(permission.permissionId)) {
          permissions.push(organizationalUnit.name + '-' + permission.permissionLevel);
        }
      }
    }
    return permissions.join(', ');
  }

  getRoleTitle(organizationalUnitId: string): string {
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
    const possibleRoles = [this.envConfigService.keycloakKomMonitorAdminRoleName];
    this.accessControl.forEach((organizationalUnit) => {
      for (const roleSuffix of roleSuffixes) {
        possibleRoles.push(organizationalUnit.name + '.' + roleSuffix);
      }
    });
    this.currentKomMonitorLoginRoleNames = this.currentKeycloakLoginRoles.filter((role) =>
      possibleRoles.includes(role)
    );
  }

  setAccessControl(input: AccessControlMetadata[]) {
    this.accessControl_map = new Map(input.map((e) => [e.organizationalUnitId, e]));
    this.accessControl = Array.from(this.accessControl_map.values());
    this.updateAvailableRoles();
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

  /*
   * The checks below mirror the Data Management API's own rules
   * (GroupBasedAuthInfoProvider), group by group — unlike the suffix checks
   * above, which only ask whether the user holds a role of that kind anywhere.
   * The admin area binds its buttons to them, so a user learns that an action
   * is not theirs before the backend answers it with a 403.
   */

  /**
   * Whether the user may create, edit, delete and rearrange the spatial unit
   * hierarchies of a tenant. Mirrors `checkMandantOperationPermissions`: only
   * `<tenant>.client-resources-creator` on the tenant group itself counts. The
   * same role on a subgroup does not, nor does `unit-resources-creator` on the
   * tenant.
   */
  canManageHierarchiesOf(mandantName: string): boolean {
    if (this.checkAdminPermission()) {
      return true;
    }
    const mandant = this.unitsByName().get(mandantName);
    if (!mandant?.mandant) {
      return false;
    }
    return this.loginAdminRoles().some(
      ({ group, role }) => role === 'client-resources-creator' && group === mandant.name
    );
  }

  /**
   * Whether the user may edit an organizational unit, delegate its rights or
   * delete it. Mirrors `checkOrganizationalUnitPermissions`:
   * `unit-users-creator` on the unit itself, or `client-users-creator` on the
   * unit or one of its ancestors.
   */
  canManageOrganization(organizationalUnitId: string): boolean {
    if (this.checkAdminPermission()) {
      return true;
    }
    const unit = this.unitsById().get(organizationalUnitId);
    if (!unit) {
      return false;
    }
    const lineage = this.lineageNames(unit);
    return this.loginAdminRoles().some(
      ({ group, role }) =>
        (role === 'unit-users-creator' && group === unit.name) ||
        (role === 'client-users-creator' && lineage.includes(group))
    );
  }

  /**
   * Whether the user may create a subgroup below `parentId` — or, for `null`, a
   * group without a parent, which is how a new tenant starts. Mirrors
   * `checkOrganizationalUnitCreationPermissions`: `client-users-creator` on the
   * parent or one of its ancestors; groups without a parent are the platform
   * administrator's alone.
   */
  canCreateSubgroupUnder(parentId: string | null): boolean {
    if (this.checkAdminPermission()) {
      return true;
    }
    const parent = parentId ? this.unitsById().get(parentId) : undefined;
    if (!parent) {
      return false;
    }
    const lineage = this.lineageNames(parent);
    return this.loginAdminRoles().some(
      ({ group, role }) => role === 'client-users-creator' && lineage.includes(group)
    );
  }

  /**
   * The names of a unit and all of its ancestors, nearest first. A cyclic
   * parent chain ends at the first unit seen twice instead of looping forever.
   */
  private lineageNames(unit: AccessControlMetadata): string[] {
    const names: string[] = [];
    const visited = new Set<string>();
    let current: AccessControlMetadata | undefined = unit;
    while (current && !visited.has(current.organizationalUnitId)) {
      visited.add(current.organizationalUnitId);
      names.push(current.name);
      current = current.parentId ? this.unitsById().get(current.parentId) : undefined;
    }
    return names;
  }
}
