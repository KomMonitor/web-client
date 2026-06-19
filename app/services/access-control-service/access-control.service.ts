import { Injectable } from "@angular/core";
import { EnvConfigService } from "services/env-config-service/env-config.service";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { AccessControlMetadata } from "components/ngComponents/models/permissions.models";

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
  providedIn: "root",
})
export class AccessControlService {

  isRealmAdmin: boolean = false;
  currentKeycloakLoginGroupNames: any;

  availablePermissions: any[] = [];
  availableUsers: any[] = [];

  accessControl: any[] = [];
  accessControl_map = new Map();
  allowedAccessControl: any[] = [];

  currentKeycloakLoginRoles: any[] = [];
  currentKomMonitorLoginRoleNames: any[] = [];
  currentKeycloakLoginGroups: any[] = [];
  currentKomMonitorLoginOrganizationalUnits: any[] = [];

  availableRoles: any[] = [];

  constructor(
    private envConfigService: EnvConfigService,
    private broadcastService: BroadcastService,
  ) {}

  checkDeletePermission() {
    if (this.checkAdminPermission()) {
      return true;
    }

    for (const role of this.currentKeycloakLoginRoles) {
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (
        permissionLevel === "client-resources-creator" ||
        permissionLevel === "unit-resources-creator"
      ) {
        return true;
      }
    }
    return false;
  }

  getAllowedRolesString(allowedPermissionIds) {
    var permissions: any[] = [];
    for (const organizationalUnit of this.accessControl) {
      for (const permission of organizationalUnit.permissions) {
        if (allowedPermissionIds.includes(permission.permissionId)) {
          permissions.push(
            organizationalUnit.name + "-" + permission.permissionLevel,
          );
        }
      }
    }
    return permissions.join(", ");
  }

  getRoleTitle(organizationalUnitId) {
    var roles = this.accessControl.filter(
      (e) => e.organizationalUnitId == organizationalUnitId,
    );
    if (roles && roles.length > 0) {
      return roles[0].name;
    }
    return "";
  }

  getAccessControlById(id: string): AccessControlMetadata | null {
    return (
      this.accessControl.find((unit) => unit.organizationalUnitId === id) ||
      null
    );
  }

  setCurrentKomMonitorLoginOrganizationalUnits() {
    // now iterate once over all possible KomMonitor orgas and check if user belongs to this orga via its keycloak group
    this.currentKomMonitorLoginOrganizationalUnits = this.accessControl.filter(
      (org) => this.currentKeycloakLoginGroupNames.includes(org.name),
    );
  }

  setCurrentKomMonitorLoginRoleNames() {
    /*
      window.__env.keycloakKomMonitorGroupsEditRoleNames = ["client-users-creator", "unit-users-creator"];
      window.__env.keycloakKomMonitorThemesEditRoleNames = ["client-themes-creator", "unit-themes-creator"];
      window.__env.keycloakKomMonitorGeodataEditRoleNames = ["client-resources-creator", "unit-resources-creator"];
    */
    let roleSuffixes =
      this.envConfigService.keycloakKomMonitorGroupsEditRoleNames
        .concat(this.envConfigService.keycloakKomMonitorThemesEditRoleNames)
        .concat(this.envConfigService.keycloakKomMonitorGeodataEditRoleNames);
    var possibleRoles = ["kommonitor-creator"];
    this.accessControl.forEach((organizationalUnit) => {
      for (const roleSuffix of roleSuffixes) {
        possibleRoles.push(organizationalUnit.name + "." + roleSuffix);
      }
    });
    this.currentKomMonitorLoginRoleNames =
      this.currentKeycloakLoginRoles.filter((role) =>
        possibleRoles.includes(role),
      );
  }

  setAccessControl(input) {
    this.accessControl_map = new Map(
      input.map((e) => [e.organizationalUnitId, e]),
    );
    this.accessControl = Array.from(this.accessControl_map.values());
    this.updateAvailableRoles();
    this.allowedAccessControl = this.filterAllowedAccessControl(
      this.accessControl,
    );
  }

  private filterAllowedAccessControl(acArray) {
    if (this.checkAdminPermission()) {
      return acArray;
    }

    var clientUserRoles = this.filterClientUserAdminRoles();
    var filtered: any[] = [];
    var existingOrgaIds: any[] = [];

    acArray.forEach((orga) => {
      const currentOrga = orga;
      while (orga) {
        clientUserRoles.forEach((role) => {
          let roleNameParts = role.split(".");
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
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (permissionLevel === "client-users-creator") {
        return true;
      }
      return false;
    });
  }

  checkAdminPermission() {
    if (
      this.currentKeycloakLoginRoles.includes(
        this.envConfigService.keycloakKomMonitorAdminRoleName,
      )
    ) {
      return true;
    }
    return false;
  }

  updateAvailableRoles() {
    this.availableRoles = [];

    for (let elem of this.accessControl) {
      for (let permission of elem.permissions) {
        let available = {
          ...permission,
          ...{
            organizationalUnit: elem,
            roleName: elem.name + "-" + permission.permissionLevel,
          },
        };
        this.availableRoles.push(available);
      }
    }
    // we need to refresh all modals as roles have changed
    this.broadcastService.broadcast("availableRolesUpdate");
  }

  checkCreatePermission() {
    if (this.checkAdminPermission()) {
      return true;
    }

    for (const role of this.currentKeycloakLoginRoles) {
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (
        permissionLevel === "client-resources-creator" ||
        permissionLevel === "unit-resources-creator"
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
      let roleNameParts = role.split(".");
      const permissionLevel = roleNameParts[roleNameParts.length - 1];
      if (
        permissionLevel === "client-resources-creator" ||
        permissionLevel === "unit-resources-creator"
      ) {
        return true;
      }
    }
    return false;
  }

  getRoleTitles() {
    return this.currentKeycloakLoginRoles.map(
      (role) => role.split(".")[role.split(".").length - 1],
    );
  }

  checkGroupsEditPermission() {
    if (this.checkAdminPermission()) return true;

    let splitRoles = this.getRoleTitles();
    let ret = false;

    this.envConfigService.keycloakKomMonitorGroupsEditRoleNames.forEach(
      (targetRole) => {
        if (splitRoles.includes(targetRole)) ret = true;
      },
    );

    return ret;
  }

  checkThemesEditPermission() {
    if (this.checkAdminPermission()) return true;

    let splitRoles = this.getRoleTitles();
    let ret = false;

    this.envConfigService.keycloakKomMonitorThemesEditRoleNames.forEach(
      (targetRole) => {
        if (splitRoles.includes(targetRole)) ret = true;
      },
    );

    return ret;
  }

  checkResourcesEditPermission() {
    if (this.checkAdminPermission()) return true;

    let splitRoles = this.getRoleTitles();
    let ret = false;

    this.envConfigService.keycloakKomMonitorGeodataEditRoleNames.forEach(
      (targetRole) => {
        if (splitRoles.includes(targetRole)) ret = true;
      },
    );

    return ret;
  }
}
