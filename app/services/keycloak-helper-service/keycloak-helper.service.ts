import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'services/auth-service/auth.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/** Realm role as returned by the Keycloak Admin REST API (subset). */
interface KeycloakRole {
  id: string;
  name: string;
}

/**
 * Keycloak Admin REST access for the role-management area: keeps KomMonitor
 * organizational units in sync with Keycloak realm roles and groups.
 *
 * Rewritten as part of the god-service cleanup (step 4 of the admin
 * refactoring — see documentation/ADMIN_REFACTORING_ANALYSIS.md). The former
 * 1375-line version had two structural problems:
 *
 * 1. Every HTTP method returned `await http.…().subscribe(...)` — i.e. the
 *    rxjs Subscription, not the response. Awaits resolved immediately, the
 *    admin requests raced each other, response payloads were lost (the role
 *    cache held a Subscription, so role rename/delete threw on iteration) and
 *    errors never propagated to callers.
 * 2. ~700 lines of Keycloak group-update/-delete and fine-grained-permission
 *    policy management had no callers anywhere in the app (and could not have
 *    worked due to 1.). That block was removed; see the git history to
 *    resurrect it as a starting point. NOTE the functional gap this makes
 *    explicit: deleting/renaming an organizational unit in the admin UI only
 *    deletes/renames the realm roles — the Keycloak *group* is left untouched.
 */
@Injectable({
  providedIn: 'root',
})
export class KeycloakHelperService {
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private envConfigService = inject(EnvConfigService);

  availableKeycloakRoles: KeycloakRole[] = [];
  targetUrlToKeycloakInstance = '';
  targetRealmUrlToKeycloakInstance = '';
  realm = '';
  clientId = '';

  /** Suffixes of the per-unit resource roles ("<unit>-viewer", …). */
  private readonly roleSuffixes = ['viewer', 'editor', 'publisher', 'creator'];

  /** Suffixes of the per-unit admin roles ("<unit>.<suffix>"), from config. */
  private adminRoleSuffixes: string[] = [];

  async init() {
    this.adminRoleSuffixes = this.envConfigService.keycloakKomMonitorGroupsEditRoleNames
      .concat(this.envConfigService.keycloakKomMonitorThemesEditRoleNames)
      .concat(this.envConfigService.keycloakKomMonitorGeodataEditRoleNames);

    try {
      if (this.envConfigService.keycloakConfig) {
        this.configureKeycloakParameters(this.envConfigService.keycloakConfig);
      } else {
        this.configureKeycloakParameters(
          await firstValueFrom(this.httpClient.get('./config/keycloak_backup.json'))
        );
      }

      await this.fetchAndSetKeycloakRoles();
    } catch (error) {
      console.error(
        'Error while initializing KeycloakHelperService (fetching/interpreting the Keycloak config):',
        error
      );
      throw error;
    }
  }

  configureKeycloakParameters(keycloakConfig) {
    // https://<keycloak.url>/auth/
    this.targetUrlToKeycloakInstance = keycloakConfig['auth-server-url'];
    this.realm = keycloakConfig['realm'];
    this.clientId = keycloakConfig['resource'];

    // https://<keycloak.url>/auth/admin/<realm-name>/console
    this.targetRealmUrlToKeycloakInstance =
      this.targetUrlToKeycloakInstance + 'admin/' + this.realm + '/console/';
  }

  // ---------------------------------------------------------------------
  // Roles
  // ---------------------------------------------------------------------

  /** Refresh the local realm-role cache used for name -> id resolution. */
  async fetchAndSetKeycloakRoles(): Promise<void> {
    this.availableKeycloakRoles = await firstValueFrom(
      this.httpClient.get<KeycloakRole[]>(this.adminRealmUrl('/roles'), {
        headers: this.authHeaders(),
      })
    );
  }

  /**
   * Rename the per-unit resource roles ("<old>-viewer" -> "<new>-viewer", …)
   * after an organizational unit was renamed.
   */
  async renameExistingRoles(
    oldOrganizationalUnitName: string,
    newOrganizationalUnitName: string,
    organizationalUnit
  ): Promise<void> {
    for (const suffix of this.roleSuffixes) {
      await this.renameExistingRole(
        oldOrganizationalUnitName + '-' + suffix,
        newOrganizationalUnitName + '-' + suffix,
        organizationalUnit
      );
    }
  }

  /** Delete the per-unit resource roles after an organizational unit was deleted. */
  async deleteRoles(organizationalUnitName: string): Promise<void> {
    for (const suffix of this.roleSuffixes) {
      const keycloakRole = this.requireKeycloakRoleByName(organizationalUnitName + '-' + suffix);
      await firstValueFrom(
        this.httpClient.delete(this.adminRealmUrl('/roles-by-id/' + keycloakRole.id), {
          headers: this.authHeaders(),
        })
      );
    }
  }

  private async renameExistingRole(
    oldRoleName: string,
    newRoleName: string,
    organizationalUnit
  ): Promise<void> {
    const keycloakRole = this.requireKeycloakRoleByName(oldRoleName);
    const rolesBody = {
      name: newRoleName,
      attributes: {
        kommonitorOrganizationalUnitId: [organizationalUnit.organizationalUnitId],
      },
    };

    await firstValueFrom(
      this.httpClient.put(this.adminRealmUrl('/roles-by-id/' + keycloakRole.id), rolesBody, {
        headers: this.authHeaders(),
      })
    );
  }

  private requireKeycloakRoleByName(roleName: string): KeycloakRole {
    const role = this.availableKeycloakRoles.find((r) => r.name === roleName);
    if (!role) {
      throw new Error(`Keycloak role '${roleName}' not found in the fetched realm roles.`);
    }
    return role;
  }

  private async postNewRole(rolesBody): Promise<void> {
    await firstValueFrom(
      this.httpClient.post(this.adminRealmUrl('/roles'), rolesBody, {
        headers: this.authHeaders(),
      })
    );
  }

  private async addCompositeRole(baseRoleName: string, composite: KeycloakRole): Promise<void> {
    const data = [{ id: composite.id, name: composite.name }];
    await firstValueFrom(
      this.httpClient.post(this.adminRealmUrl('/roles/' + baseRoleName + '/composites'), data, {
        headers: this.authHeaders(),
      })
    );
  }

  // ---------------------------------------------------------------------
  // Groups (creation only — update/delete were never wired into the UI)
  // ---------------------------------------------------------------------

  /**
   * Create the Keycloak group for a new organizational unit (top-tier or as a
   * child of the parent unit's group) plus its per-unit admin roles. The
   * "…users…" roles become composites of the realm-management query roles so
   * their holders can look up users/groups.
   */
  async postNewGroup(organizationalUnit, parentOrganizationalUnit): Promise<void> {
    const groupBody = {
      name: organizationalUnit.name,
      attributes: {
        mandant: [organizationalUnit.mandant],
        // no kommonitorOrganizationalUnitId: the keycloak group is created
        // before the KomMonitor organizational unit exists
      },
    };

    if (parentOrganizationalUnit && parentOrganizationalUnit.keycloakId) {
      await firstValueFrom(
        this.httpClient.post(
          this.adminRealmUrl('/groups/' + parentOrganizationalUnit.keycloakId + '/children'),
          groupBody,
          { headers: this.authHeaders() }
        )
      );
    } else {
      await firstValueFrom(
        this.httpClient.post(this.adminRealmUrl('/groups'), groupBody, {
          headers: this.authHeaders(),
        })
      );
    }

    const roleClientQueryUsers = await this.getRealmManagementRole('query-users');
    const roleClientQueryGroups = await this.getRealmManagementRole('query-groups');

    for (const suffix of this.adminRoleSuffixes) {
      const roleName = organizationalUnit.name + '.' + suffix;
      await this.postNewRole({ name: roleName });
      if (suffix.includes('users')) {
        await this.addCompositeRole(roleName, roleClientQueryGroups);
        await this.addCompositeRole(roleName, roleClientQueryUsers);
      }
    }
  }

  // ---------------------------------------------------------------------
  // Realm-management client plumbing
  // ---------------------------------------------------------------------

  private async getRealmManagementRole(roleName: string): Promise<KeycloakRole> {
    const realmManagementClientId = await this.getRealmManagementClientId();
    const roles = await firstValueFrom(
      this.httpClient.get<KeycloakRole[]>(
        this.adminRealmUrl('/clients/' + realmManagementClientId + '/roles?search=' + roleName),
        { headers: this.authHeaders() }
      )
    );
    if (!roles?.length) {
      throw new Error(`Keycloak realm-management role '${roleName}' not found.`);
    }
    return roles[0];
  }

  private async getRealmManagementClientId(): Promise<string> {
    const clients = await firstValueFrom(
      this.httpClient.get<Array<{ id: string }>>(
        this.adminRealmUrl('/clients?search=true&clientId=realm-management'),
        { headers: this.authHeaders() }
      )
    );
    if (!clients?.length) {
      throw new Error('Keycloak realm-management client not found.');
    }
    return clients[0].id;
  }

  // ---------------------------------------------------------------------
  // Request plumbing
  // ---------------------------------------------------------------------

  private adminRealmUrl(path: string): string {
    return this.targetUrlToKeycloakInstance + 'admin/realms/' + this.realm + path;
  }

  private authHeaders(): { [header: string]: string } {
    return {
      Authorization: 'Bearer ' + this.authService.getToken(),
    };
  }
}
