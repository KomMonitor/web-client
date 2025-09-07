import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service/auth.service';

@Injectable({ providedIn: 'root' })
export class KommonitorRoleKeycloakHelperService {

  private initialized = false;
  private keycloakBaseUrl: string | null = null; // e.g., https://keycloak/auth/
  private realm: string | null = null;          // e.g., kommonitor
  private clientId: string | null = null;       // e.g., kommonitor-client

  // Cached roles for convenience (similar to legacy service)
  private availableKeycloakRoles: any[] = [];

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  get targetUrlToKeycloakInstance(): string | undefined {
    return this.keycloakBaseUrl || (window as any)?.__env?.keycloakConfig?.['auth-server-url'];
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const env = (window as any)?.__env;
    const cfg = env?.keycloakConfig;

    if (cfg) {
      this.keycloakBaseUrl = cfg['auth-server-url'];
      this.realm = cfg['realm'];
      this.clientId = cfg['resource'];
      this.initialized = true;
      return;
    }

    // Fallback: try loading backup config like the legacy service
    try {
      const backup: any = await this.http.get('./config/keycloak_backup.json').toPromise();
      this.keycloakBaseUrl = backup['auth-server-url'];
      this.realm = backup['realm'];
      this.clientId = backup['resource'];
      this.initialized = true;
    } catch (_err) {
      // Leave uninitialized; calls will fail with clear errors
      this.initialized = false;
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth?.Auth?.keycloak?.token;
    if (!token) {
      throw new Error('Keycloak token unavailable. Ensure user is authenticated.');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private get adminBase(): string {
    if (!this.keycloakBaseUrl || !this.realm) {
      throw new Error('Keycloak not initialized. Missing base URL or realm.');
    }
    return `${this.keycloakBaseUrl}admin/realms/${this.realm}`;
  }

  async fetchAndSetKeycloakRoles(): Promise<void> {
    await this.ensureInitialized();
    const headers = this.getAuthHeaders();
    const url = `${this.adminBase}/roles`;
    this.availableKeycloakRoles = await this.http.get<any[]>(url, { headers }).toPromise() || [];
  }

  private async getRoleByName(roleName: string): Promise<any | null> {
    await this.ensureInitialized();
    const headers = this.getAuthHeaders();
    const url = `${this.adminBase}/roles/${encodeURIComponent(roleName)}`;
    try {
      return await this.http.get<any>(url, { headers }).toPromise();
    } catch (_e) {
      return null;
    }
  }

  private async renameRoleById(roleId: string, newRoleName: string): Promise<void> {
    await this.ensureInitialized();
    const headers = this.getAuthHeaders();
    const url = `${this.adminBase}/roles-by-id/${encodeURIComponent(roleId)}`;
    const body = { name: newRoleName };
    await this.http.put(url, body, { headers }).toPromise();
  }

  async renameExistingRoles(oldName: string, newName: string): Promise<void> {
    if (!oldName || !newName || oldName === newName) {
      return;
    }
    await this.ensureInitialized();

    // Legacy behavior: rename the quartet of viewer/editor/publisher/creator roles
    const suffixes = ['viewer', 'editor', 'publisher', 'creator'];

    for (const suffix of suffixes) {
      const fromRoleName = `${oldName}-${suffix}`;
      const toRoleName = `${newName}-${suffix}`;
      const role = await this.getRoleByName(fromRoleName);
      if (role?.id) {
        await this.renameRoleById(role.id, toRoleName);
      }
    }
  }

  async postNewGroup(organizationalUnit: any, parentOrganizationalUnit: any | null): Promise<void> {
    await this.ensureInitialized();
    const headers = this.getAuthHeaders();

    // 1) Create group (top-level or as child)
    const groupBody = {
      name: organizationalUnit?.name,
      attributes: {
        mandant: [organizationalUnit?.mandant]
      }
    };

    if (!organizationalUnit?.name) {
      throw new Error('postNewGroup: organizationalUnit.name is required');
    }

    if (parentOrganizationalUnit?.keycloakId) {
      const url = `${this.adminBase}/groups/${encodeURIComponent(parentOrganizationalUnit.keycloakId)}/children`;
      await this.http.post(url, groupBody, { headers }).toPromise();
    } else {
      const url = `${this.adminBase}/groups`;
      await this.http.post(url, groupBody, { headers }).toPromise();
    }

    // 2) Create admin roles for this org-unit based on env suffixes (dot-separated)
    const env = (window as any)?.__env;
    const adminSuffixes: string[] = [
      ...(env?.keycloakKomMonitorGroupsEditRoleNames || []),
      ...(env?.keycloakKomMonitorThemesEditRoleNames || []),
      ...(env?.keycloakKomMonitorGeodataEditRoleNames || [])
    ];

    const rolesUrl = `${this.adminBase}/roles`;
    for (const suffix of adminSuffixes) {
      const roleName = `${organizationalUnit.name}.${suffix}`;
      try {
        await this.http.post(rolesUrl, { name: roleName }, { headers }).toPromise();
      } catch (_e) {
        // Ignore if already exists
      }
    }

    // Refresh cached roles best-effort
    try {
      await this.fetchAndSetKeycloakRoles();
    } catch { /* noop */ }
  }
}


