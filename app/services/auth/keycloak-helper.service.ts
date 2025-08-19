import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from, of, firstValueFrom } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

import {
  KeycloakConfig,
  KeycloakRole,
  KeycloakGroup,
  OrganizationalUnit,
  RoleBody,
  GroupBody,
  FineGrainedPermissionResource,
  PolicyBody,
  ScopePermissionBody
} from './keycloak-config.interface';

declare global {
  interface Window {
    __env: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class KeycloakHelperService {
  // Configuration properties
  public availableKeycloakRoles: KeycloakRole[] = [];
  public availableKeycloakGroups: KeycloakGroup[] = [];
  public targetUrlToKeycloakInstance = '';
  public targetRealmUrlToKeycloakInstance = '';
  public realm = '';
  public clientId = '';

  // Role suffixes for organizational units
  private roleSuffixes = ['viewer', 'editor', 'publisher', 'creator'];
  private adminRoleSuffixes: string[] = [];

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService
  ) {
    this.initializeAdminRoleSuffixes();
    this.init();
  }

  private initializeAdminRoleSuffixes(): void {
    if (window.__env) {
      this.adminRoleSuffixes = [
        ...(window.__env.keycloakKomMonitorGroupsEditRoleNames || []),
        ...(window.__env.keycloakKomMonitorThemesEditRoleNames || []),
        ...(window.__env.keycloakKomMonitorGeodataEditRoleNames || [])
      ];
    }
  }

  private async init(): Promise<void> {
    try {
      console.log('Initializing KeycloakHelperService...');
      
      if (window.__env?.keycloakConfig) {
        this.configureKeycloakParameters(window.__env.keycloakConfig);
      } else {
        const config = await this.loadBackupConfig();
        this.configureKeycloakParameters(config);
      }

      await this.fetchAndSetKeycloakRoles();
      console.log('KeycloakHelperService initialized successfully');
    } catch (error) {
      console.error('Error while initializing KeycloakHelperService:', error);
      throw error;
    }
  }

  private loadBackupConfig(): Promise<KeycloakConfig> {
    return this.http.get<KeycloakConfig>('./config/keycloak_backup.json').toPromise().then(config => {
      if (!config) {
        throw new Error('Failed to load Keycloak backup configuration');
      }
      return config;
    });
  }

  private configureKeycloakParameters(keycloakConfig: KeycloakConfig): void {
    this.targetUrlToKeycloakInstance = keycloakConfig['auth-server-url'];
    this.realm = keycloakConfig['realm'];
    this.clientId = keycloakConfig['resource'];
    this.targetRealmUrlToKeycloakInstance = `${this.targetUrlToKeycloakInstance}admin/${this.realm}/console/`;
    
    console.log('Keycloak parameters configured:', {
      targetUrl: this.targetUrlToKeycloakInstance,
      realm: this.realm,
      clientId: this.clientId
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.keycloakService.getKeycloakInstance().token;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Role Management Methods
  public fetchRoles(): Observable<KeycloakRole[]> {
    console.log('Fetching roles from Keycloak instance at', this.targetUrlToKeycloakInstance);
    
    const url = `${this.targetUrlToKeycloakInstance}${this.realm}/clients/${this.clientId}/roles`;
    
    return this.http.get<KeycloakRole[]>(url).pipe(
      catchError(error => {
        console.error('Error while fetching roles from keycloak:', error);
        return throwError(error);
      })
    );
  }

  public postNewRoleWithToken(bearerToken: string, rolesBody: RoleBody): Observable<KeycloakRole> {
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/roles`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.post<KeycloakRole>(url, rolesBody, { headers }).pipe(
      catchError(error => {
        console.error('Error while posting role to keycloak:', error);
        return throwError(error);
      })
    );
  }

  public renameExistingRoleWithToken(
    bearerToken: string, 
    oldRoleName: string, 
    newRoleName: string, 
    organizationalUnit: OrganizationalUnit
  ): Observable<KeycloakRole> {
    const keycloakRole = this.getKeycloakRoleByName(oldRoleName);
    if (!keycloakRole) {
      return throwError(new Error(`Role ${oldRoleName} not found`));
    }

    const rolesBody: RoleBody = {
      name: newRoleName,
      attributes: {
        kommonitorOrganizationalUnitId: [organizationalUnit.organizationalUnitId]
      }
    };

    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/roles-by-id/${keycloakRole.id}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.put<KeycloakRole>(url, rolesBody, { headers }).pipe(
      catchError(error => {
        console.error('Error while renaming role in keycloak:', error);
        return throwError(error);
      })
    );
  }

  public deleteRoleWithToken(bearerToken: string, roleName: string): Observable<any> {
    const keycloakRole = this.getKeycloakRoleByName(roleName);
    if (!keycloakRole) {
      return throwError(new Error(`Role ${roleName} not found`));
    }

    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/roles-by-id/${keycloakRole.id}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.delete(url, { headers }).pipe(
      catchError(error => {
        console.error('Error while deleting role from keycloak:', error);
        return throwError(error);
      })
    );
  }

  public getAllRolesWithToken(bearerToken: string): Observable<KeycloakRole[]> {
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/roles`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<KeycloakRole[]>(url, { headers }).pipe(
      catchError(error => {
        console.error('Error while fetching all roles from keycloak:', error);
        return throwError(error);
      })
    );
  }

  public addCompositeRoleWithToken(
    bearerToken: string, 
    baseRoleName: string, 
    composite: KeycloakRole
  ): Observable<any> {
    const data = [{
      id: composite.id,
      name: composite.name
    }];

    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/roles/${baseRoleName}/composites`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.post(url, data, { headers }).pipe(
      catchError(error => {
        console.error('Error while creating composite role in keycloak:', error);
        return throwError(error);
      })
    );
  }

  // Public API methods for backward compatibility
  public async renameExistingRoles(
    oldOrganizationalUnitName: string, 
    newOrganizationalUnitName: string, 
    organizationalUnit: OrganizationalUnit
  ): Promise<void> {
    try {
      const bearerToken = this.keycloakService.getKeycloakInstance().token;
      if (!bearerToken) {
        throw new Error('No authentication token available');
      }
      
      for (const suffix of this.roleSuffixes) {
        await firstValueFrom(this.renameExistingRoleWithToken(
          bearerToken, 
          `${oldOrganizationalUnitName}-${suffix}`, 
          `${newOrganizationalUnitName}-${suffix}`, 
          organizationalUnit
        ));
      }
    } catch (error) {
      console.error('Error renaming existing roles:', error);
      throw error;
    }
  }

  public async deleteRoles(organizationalUnitName: string): Promise<void> {
    try {
      const bearerToken = this.keycloakService.getKeycloakInstance().token;
      if (!bearerToken) {
        throw new Error('No authentication token available');
      }
      
      for (const suffix of this.roleSuffixes) {
        await firstValueFrom(this.deleteRoleWithToken(bearerToken, `${organizationalUnitName}-${suffix}`));
      }
    } catch (error) {
      console.error('Error deleting roles:', error);
      throw error;
    }
  }

  public async getAllRoles(): Promise<KeycloakRole[]> {
    try {
      const bearerToken = this.keycloakService.getKeycloakInstance().token;
      if (!bearerToken) {
        throw new Error('No authentication token available');
      }
      const roles = await firstValueFrom(this.getAllRolesWithToken(bearerToken));
      if (!roles) {
        throw new Error('Failed to fetch roles');
      }
      return roles;
    } catch (error) {
      console.error('Error getting all roles:', error);
      throw error;
    }
  }

  public setAvailableKeycloakRoles(roles: KeycloakRole[]): void {
    this.availableKeycloakRoles = roles;
  }

  public getKeycloakRoleByName(roleName: string): KeycloakRole | undefined {
    return this.availableKeycloakRoles.find(role => role.name === roleName);
  }

  public async fetchAndSetKeycloakRoles(): Promise<void> {
    try {
      const roles = await this.getAllRoles();
      this.setAvailableKeycloakRoles(roles);
    } catch (error) {
      console.error('Error fetching and setting Keycloak roles:', error);
      throw error;
    }
  }

  public isRoleInKeycloak(roleName: string): boolean {
    return this.availableKeycloakRoles.some(role => role.name === roleName);
  }

  // Group Management Methods
  public async postNewGroup(
    organizationalUnit: OrganizationalUnit, 
    parentOrganizationalUnit?: OrganizationalUnit
  ): Promise<void> {
    try {
      const bearerToken = this.keycloakService.getKeycloakInstance().token;
      if (!bearerToken) {
        throw new Error('No authentication token available');
      }
      
      const groupBody: GroupBody = {
        name: organizationalUnit.name,
        attributes: {
          mandant: [organizationalUnit.mandant]
        }
      };

      if (parentOrganizationalUnit?.keycloakId) {
        await this.postNewSubTierGroupWithToken(bearerToken, groupBody, parentOrganizationalUnit.keycloakId).toPromise();
      } else {
        await this.postNewTopTierGroupWithToken(bearerToken, groupBody).toPromise();
      }

      // Fetch required roles for composite role creation
      const roleClientQueryUsers = await this.getClientQueryUsersRole().toPromise();
      const roleClientQueryGroups = await this.getClientQueryGroupsRole().toPromise();

      if (!roleClientQueryUsers || !roleClientQueryGroups) {
        throw new Error('Failed to fetch required roles for composite role creation');
      }

      // Post individual roles
      for (const suffix of this.adminRoleSuffixes) {
        const roleBody: RoleBody = {
          name: `${organizationalUnit.name}.${suffix}`
        };
        
        await this.postNewRoleWithToken(bearerToken, roleBody).toPromise();
        
        if (suffix.includes('users')) {
          await this.addCompositeRoleWithToken(bearerToken, `${organizationalUnit.name}.${suffix}`, roleClientQueryGroups).toPromise();
          await this.addCompositeRoleWithToken(bearerToken, `${organizationalUnit.name}.${suffix}`, roleClientQueryUsers).toPromise();
        }
      }
    } catch (error) {
      console.error('Error posting new group:', error);
      throw error;
    }
  }

  public postNewTopTierGroupWithToken(bearerToken: string, groupBody: GroupBody): Observable<KeycloakGroup> {
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.post<KeycloakGroup>(url, groupBody, { headers }).pipe(
      catchError(error => {
        console.error('Error while posting top tier group to keycloak:', error);
        return throwError(error);
      })
    );
  }

  public postNewSubTierGroupWithToken(
    bearerToken: string, 
    groupBody: GroupBody, 
    parentGroupId: string
  ): Observable<KeycloakGroup> {
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups/${parentGroupId}/children`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.post<KeycloakGroup>(url, groupBody, { headers }).pipe(
      catchError(error => {
        console.error('Error while posting sub tier group to keycloak:', error);
        return throwError(error);
      })
    );
  }

  public async getAllGroups(): Promise<KeycloakGroup[]> {
    try {
      const bearerToken = this.keycloakService.getKeycloakInstance().token;
      if (!bearerToken) {
        throw new Error('No authentication token available');
      }
      const groups = await this.getAllGroupsWithToken(bearerToken).toPromise();
      if (!groups) {
        throw new Error('Failed to fetch groups');
      }
      return groups;
    } catch (error) {
      console.error('Error getting all groups:', error);
      throw error;
    }
  }

  public getAllGroupsWithToken(bearerToken: string): Observable<KeycloakGroup[]> {
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups?populateHierarchy=true&briefRepresentation=false`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<KeycloakGroup[]>(url, { headers }).pipe(
      switchMap(topTierGroups => this.fetchAndAddSubGroups(topTierGroups, bearerToken)),
      catchError(error => {
        console.error('Error while fetching groups from keycloak:', error);
        return throwError(error);
      })
    );
  }

  private async fetchAndAddSubGroups(groups: KeycloakGroup[], bearerToken: string): Promise<KeycloakGroup[]> {
    for (const group of groups) {
      if (group.subGroupCount && group.subGroupCount > 0) {
        const subGroups = await this.fetchSubGroups(group, bearerToken).toPromise();
        if (subGroups) {
          const nestedSubGroups = await this.fetchAndAddSubGroups(subGroups, bearerToken);
          groups = groups.concat(subGroups, nestedSubGroups);
        }
      }
    }
    
    // Remove duplicates
    return [...new Set(groups)];
  }

  public fetchSubGroups(group: KeycloakGroup, bearerToken: string): Observable<KeycloakGroup[]> {
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups/${group.id}/children?populateHierarchy=true&briefRepresentation=false`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<KeycloakGroup[]>(url, { headers }).pipe(
      catchError(error => {
        console.error('Error while fetching sub groups from keycloak:', error);
        return throwError(error);
      })
    );
  }

  public setAvailableKeycloakGroups(groups: KeycloakGroup[]): void {
    this.availableKeycloakGroups = groups;
  }

  public async fetchAndSetKeycloakGroups(): Promise<void> {
    try {
      const groups = await this.getAllGroups();
      this.setAvailableKeycloakGroups(groups);
    } catch (error) {
      console.error('Error fetching and setting Keycloak groups:', error);
      throw error;
    }
  }

  public isGroupInKeycloak(groupName: string): boolean {
    return this.availableKeycloakGroups.some(group => group.name === groupName);
  }

  // Utility Methods
  public getClientQueryUsersRole(): Observable<KeycloakRole> {
    return this.getRealmManagementClientId().pipe(
      switchMap(realmManagementClientId => {
        const bearerToken = this.keycloakService.getKeycloakInstance().token;
        const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/clients/${realmManagementClientId}/roles?search=query-users`;
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${bearerToken}`
        });

        return this.http.get<KeycloakRole[]>(url, { headers }).pipe(
          map(roles => roles[0]),
          catchError(error => {
            console.error('Error while fetching client query users role from keycloak:', error);
            return throwError(error);
          })
        );
      })
    );
  }

  public getClientQueryGroupsRole(): Observable<KeycloakRole> {
    return this.getRealmManagementClientId().pipe(
      switchMap(realmManagementClientId => {
        const bearerToken = this.keycloakService.getKeycloakInstance().token;
        const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/clients/${realmManagementClientId}/roles?search=query-groups`;
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${bearerToken}`
        });

        return this.http.get<KeycloakRole[]>(url, { headers }).pipe(
          map(roles => roles[0]),
          catchError(error => {
            console.error('Error while fetching client query groups role from keycloak:', error);
            return throwError(error);
          })
        );
      })
    );
  }

  public getRealmManagementClientId(): Observable<string> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/clients?search=true&clientId=realm-management`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<any[]>(url, { headers }).pipe(
      map(clients => clients[0].id),
      catchError(error => {
        console.error('Error while fetching realm management client id from keycloak:', error);
        return throwError(error);
      })
    );
  }

  // Additional utility methods for backward compatibility
  public getOwnChildGroupsCount(groupId: string): number {
    const group = this.availableKeycloakGroups.find(item => item.id === groupId);
    return group?.subGroupCount || 0;
  }

  public getOwnChildGroupNames(childOrganizationalUnits: OrganizationalUnit[]): string {
    if (!childOrganizationalUnits || childOrganizationalUnits.length === 0) {
      return '';
    }
    
    const childOrganizationalUnitKeycloakIds = childOrganizationalUnits.map(item => item.keycloakId);
    const associatedKeycloakGroups = this.availableKeycloakGroups.filter(item => 
      childOrganizationalUnitKeycloakIds.includes(item.id)
    );

    return JSON.stringify(associatedKeycloakGroups.map(item => item.name));
  }

  // Placeholder methods for complex permission management (to be implemented as needed)
  public async postNewRoles(organizationalUnitName: string): Promise<void> {
    // Implementation for creating new roles
    console.log('postNewRoles called for:', organizationalUnitName);
    // This would need to be implemented based on the original logic
  }

  public async updateExistingGroup(
    organizationalUnit: OrganizationalUnit, 
    oldName: string, 
    parentOrganizationalUnit?: OrganizationalUnit
  ): Promise<void> {
    try {
      const bearerToken = this.keycloakService.getKeycloakInstance().token;
      if (!bearerToken) {
        throw new Error('No authentication token available');
      }

      const groupBody: GroupBody = {
        id: organizationalUnit.keycloakId,
        name: organizationalUnit.name,
        attributes: {
          mandant: [organizationalUnit.mandant],
          kommonitorOrganizationalUnitId: [organizationalUnit.organizationalUnitId]
        }
      };

      if (parentOrganizationalUnit?.keycloakId) {
        await this.updateSubTierGroupWithToken(bearerToken, groupBody, parentOrganizationalUnit.keycloakId).toPromise();
      } else {
        await this.updateTopTierGroupWithToken(bearerToken, groupBody).toPromise();
      }

      // Update individual roles
      for (const suffix of this.adminRoleSuffixes) {
        await this.renameExistingRoleWithToken(
          bearerToken, 
          `${oldName}.${suffix}`, 
          `${organizationalUnit.name}.${suffix}`, 
          organizationalUnit
        ).toPromise();
      }
    } catch (error) {
      console.error('Error updating existing group:', error);
      throw error;
    }
  }

  // Group Management Methods - Missing from new service
  public getMemberCountForGroup(memberId: string): Observable<number> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups/${memberId}/members`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<any[]>(url, { headers }).pipe(
      map(members => members.length),
      catchError(error => {
        console.error('Error while fetching member count for group:', error);
        return throwError(error);
      })
    );
  }

  public getGroupDetailsRootGroup(organizationalUnit: OrganizationalUnit): Observable<KeycloakGroup> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups/?search=${organizationalUnit.name}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<KeycloakGroup[]>(url, { headers }).pipe(
      map(groups => groups[0]),
      catchError(error => {
        console.error('Error while fetching root group details:', error);
        return throwError(error);
      })
    );
  }

  public getGroupDetailsSubGroup(
    organizationalUnit: OrganizationalUnit, 
    parentOrganizationalUnit: OrganizationalUnit
  ): Observable<KeycloakGroup> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups/${parentOrganizationalUnit.keycloakId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<KeycloakGroup>(url, { headers }).pipe(
      switchMap(group => {
        if (group.subGroupCount && group.subGroupCount > 0) {
          return this.fetchSubGroups(group, bearerToken!).pipe(
            map(subGroups => {
              const targetSubGroup = subGroups.find(subGroup => subGroup.name === organizationalUnit.name);
              if (!targetSubGroup) {
                throw new Error(`Subgroup ${organizationalUnit.name} not found`);
              }
              return targetSubGroup;
            })
          );
        } else if (group.subGroups) {
          const targetSubGroup = group.subGroups.find(subGroup => subGroup.name === organizationalUnit.name);
          if (!targetSubGroup) {
            throw new Error(`Subgroup ${organizationalUnit.name} not found`);
          }
          return of(targetSubGroup);
        } else {
          throw new Error('No subgroups found');
        }
      }),
      catchError(error => {
        console.error('Error while fetching subgroup details:', error);
        return throwError(error);
      })
    );
  }

  public getGroupDetails(
    organizationalUnit: OrganizationalUnit, 
    parentOrganizationalUnit?: OrganizationalUnit
  ): Observable<KeycloakGroup> {
    if (organizationalUnit.parentId && organizationalUnit.parentId !== '') {
      if (!parentOrganizationalUnit) {
        return throwError(new Error('Parent organizational unit is required for subgroups'));
      }
      return this.getGroupDetailsSubGroup(organizationalUnit, parentOrganizationalUnit);
    } else {
      return this.getGroupDetailsRootGroup(organizationalUnit);
    }
  }

  public updateTopTierGroupWithToken(bearerToken: string, groupBody: GroupBody): Observable<KeycloakGroup> {
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups/${groupBody.id}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.put<KeycloakGroup>(url, groupBody, { headers }).pipe(
      catchError(error => {
        console.error('Error while updating top tier group in keycloak:', error);
        return throwError(error);
      })
    );
  }

  public updateSubTierGroupWithToken(
    bearerToken: string, 
    groupBody: GroupBody, 
    parentId: string
  ): Observable<KeycloakGroup> {
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups/${parentId}/children`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.post<KeycloakGroup>(url, groupBody, { headers }).pipe(
      catchError(error => {
        console.error('Error while updating sub tier group in keycloak:', error);
        return throwError(error);
      })
    );
  }

  public async deleteGroup(organizationalUnit: OrganizationalUnit): Promise<void> {
    try {
      const bearerToken = this.keycloakService.getKeycloakInstance().token;
      if (!bearerToken) {
        throw new Error('No authentication token available');
      }

      await this.deleteGroupWithToken(bearerToken, organizationalUnit.keycloakId!).toPromise();

      for (const suffix of this.adminRoleSuffixes) {
        await this.deleteRoleWithToken(bearerToken, `${organizationalUnit.name}.${suffix}`).toPromise();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  public deleteGroupWithToken(bearerToken: string, keycloakId: string): Observable<any> {
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups/${keycloakId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.delete(url, { headers }).pipe(
      catchError(error => {
        console.error('Error while deleting group from keycloak:', error);
        return throwError(error);
      })
    );
  }

  // Fine-Grained Permission Management Methods
  public enableFineGrainedPermissionsForGroup(groupId: string): Observable<FineGrainedPermissionResource> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/groups/${groupId}/management/permissions`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    const body = { enabled: true };

    return this.http.put<FineGrainedPermissionResource>(url, body, { headers }).pipe(
      catchError(error => {
        console.error('Error while enabling fine-grained permissions for group:', error);
        return throwError(error);
      })
    );
  }

  public postPolicyForRole(keycloakRole: KeycloakRole, realmManagementClientId: string): Observable<any> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/clients/${realmManagementClientId}/authz/resource-server/policy/role`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    const body = {
      name: `member-of-${keycloakRole.name}`,
      description: `memberOf(${keycloakRole.name})`,
      roles: [
        {
          id: keycloakRole.id,
          required: true
        }
      ],
      logic: 'POSITIVE'
    };

    return this.http.post(url, body, { headers }).pipe(
      catchError(error => {
        console.error('Error while posting policy for role:', error);
        return throwError(error);
      })
    );
  }

  public async generateRolePolicies(realmManagementClientId: string, organizationalUnit: OrganizationalUnit): Promise<any[]> {
    const policyArray: any[] = [];

    // Individual role policies
    const userSuffixes = this.adminRoleSuffixes.filter(suffix => suffix.includes('user'));
    const userAdminRoles = this.availableKeycloakRoles.filter(role => {
      return userSuffixes.some(userSuffix => role.name === `${organizationalUnit.name}.${userSuffix}`);
    });

    for (const userAdminRole of userAdminRoles) {
      const policy = await this.postPolicyForRole(userAdminRole, realmManagementClientId).toPromise();
      policyArray.push(policy);
    }

    return policyArray;
  }

  public getSingleParentClientUserRolePolicy(
    realmManagementClientId: string, 
    parentOrganizationalUnit: OrganizationalUnit
  ): Observable<any> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const parentClientUserCreatorPolicyName = `${parentOrganizationalUnit.name}.client-users-creator`;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/clients/${realmManagementClientId}/authz/resource-server/policy?name=${parentClientUserCreatorPolicyName}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<any[]>(url, { headers }).pipe(
      map(policies => policies[0]),
      catchError(error => {
        console.error('Error while fetching single parent client user role policy:', error);
        return throwError(error);
      })
    );
  }

  public async getAllParentClientUserRolePolicies(
    realmManagementClientId: string, 
    organizationalUnit: OrganizationalUnit, 
    allOrganizationalUnitsMap: Map<string, OrganizationalUnit>
  ): Promise<any[]> {
    const parentRolePolicies: any[] = [];

    if (organizationalUnit.parentId) {
      const parentOrganizationalUnit = allOrganizationalUnitsMap.get(organizationalUnit.parentId);
      if (parentOrganizationalUnit) {
        const parentPolicy = await this.getSingleParentClientUserRolePolicy(realmManagementClientId, parentOrganizationalUnit).toPromise();
        parentRolePolicies.push(parentPolicy);

        const grandParentPolicies = await this.getAllParentClientUserRolePolicies(
          realmManagementClientId, 
          parentOrganizationalUnit, 
          allOrganizationalUnitsMap
        );
        parentRolePolicies.push(...grandParentPolicies);
      }
    }

    // Remove duplicates
    return [...new Set(parentRolePolicies)];
  }

  public async putRolePoliciesForKeycloakGroup(
    realmManagementClientId: string, 
    fineGrainPermissionResource: FineGrainedPermissionResource, 
    groupId: string, 
    rolePoliciesArray: any[]
  ): Promise<void> {
    // Multiple scopes exist within fineGrainPermissionResource
    // We must register a similar policy for each scope
    for (const scopePermissionName in fineGrainPermissionResource.scopePermissions) {
      const scopeUUID = fineGrainPermissionResource.scopePermissions[scopePermissionName];
      await this.putRolePolicyForKeycloakGroupResourceScope(
        realmManagementClientId, 
        fineGrainPermissionResource.resource, 
        scopeUUID, 
        scopePermissionName, 
        groupId, 
        rolePoliciesArray
      ).toPromise();
    }
  }

  public getScopeResourceId(realmManagementClientId: string, scopeUUID: string): Observable<string> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/clients/${realmManagementClientId}/authz/resource-server/policy/${scopeUUID}/scopes`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<any[]>(url, { headers }).pipe(
      map(scopes => scopes[0].id),
      catchError(error => {
        console.error('Error while fetching scope resource id:', error);
        return throwError(error);
      })
    );
  }

  public putRolePolicyForKeycloakGroupResourceScope(
    realmManagementClientId: string, 
    fineGrainPermissionResourceUUID: string, 
    scopeUUID: string, 
    scopePermissionName: string, 
    groupId: string, 
    rolePoliciesArray: any[]
  ): Observable<any> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/clients/${realmManagementClientId}/authz/resource-server/permission/scope/${scopeUUID}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.getScopeResourceId(realmManagementClientId, scopeUUID).pipe(
      switchMap(scopeResourceId => {
        const policyIds = rolePoliciesArray.map(policy => policy.id);
        const body = {
          id: scopeUUID,
          name: scopePermissionName.replace('-', '.') + '.permission.group.' + groupId,
          type: 'scope',
          logic: 'POSITIVE',
          decisionStrategy: 'AFFIRMATIVE', // at least one policy is true
          resources: [fineGrainPermissionResourceUUID],
          policies: policyIds,
          scopes: [scopeResourceId],
          description: ''
        };

        return this.http.put(url, body, { headers });
      }),
      catchError(error => {
        console.error('Error while putting role policy for Keycloak group resource scope:', error);
        return throwError(error);
      })
    );
  }

  public async setKeycloakPoliciesForKomMonitorOrganization(
    organizationalUnit: OrganizationalUnit, 
    allOrganizationalUnits: OrganizationalUnit[]
  ): Promise<void> {
    try {
      const bearerToken = this.keycloakService.getKeycloakInstance().token;
      if (!bearerToken) {
        throw new Error('No authentication token available');
      }

      const realmManagementClientId = await this.getRealmManagementClientId().toPromise();

      // 1. Enable fine grain permissions on new group
      const fineGrainPermissionResourceGroup = await firstValueFrom(this.enableFineGrainedPermissionsForGroup(organizationalUnit.keycloakId!));

      // 2. Create policies for new associated group (unit-users-creator and client-users-creator)
      let rolePoliciesArray = await this.generateRolePolicies(realmManagementClientId!, organizationalUnit);

      // Create map for efficient lookup
      const allOrganizationalUnitsMap = new Map<string, OrganizationalUnit>();
      allOrganizationalUnits.forEach(unit => allOrganizationalUnitsMap.set(unit.organizationalUnitId, unit));

      const parentPolicies = await this.getAllParentClientUserRolePolicies(
        realmManagementClientId!, 
        organizationalUnit, 
        allOrganizationalUnitsMap
      );
      rolePoliciesArray = rolePoliciesArray.concat(parentPolicies);

      // 3. Set policies for new group to enable group and subgroup management for admins with associated roles
      if (!fineGrainPermissionResourceGroup) {
        throw new Error('Failed to enable fine-grained permissions for group');
      }
      
      await this.putRolePoliciesForKeycloakGroup(
        realmManagementClientId!, 
        fineGrainPermissionResourceGroup, 
        organizationalUnit.keycloakId!, 
        rolePoliciesArray
      );

      // 4. Set same policies for associated user-creator roles for scope map-role
      await this.postRolePoliciesForKeycloakUserCreatorRealmRoles(
        realmManagementClientId!, 
        organizationalUnit, 
        rolePoliciesArray
      );
    } catch (error) {
      console.error('Error setting Keycloak policies for KomMonitor organization:', error);
      throw error;
    }
  }

  public async postRolePoliciesForKeycloakUserCreatorRealmRoles(
    realmManagementClientId: string, 
    organizationalUnit: OrganizationalUnit, 
    rolePoliciesArray: any[]
  ): Promise<void> {
    for (const suffix of this.adminRoleSuffixes) {
      await this.postRolePoliciesForKeycloakUserCreatorRealmRole(
        realmManagementClientId, 
        `${organizationalUnit.name}.${suffix}`, 
        rolePoliciesArray
      ).toPromise();
    }
  }

  public postRolePoliciesForKeycloakUserCreatorRealmRole(
    realmManagementClientId: string, 
    roleName: string, 
    rolePoliciesArray: any[]
  ): Observable<any> {
    return this.getRoleByName(roleName).pipe(
      switchMap(role => this.enableFineGrainedPermissionsForRole(role)),
      switchMap(fineGrainPermissionResourceRole => {
        const bearerToken = this.keycloakService.getKeycloakInstance().token;
        const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/clients/${realmManagementClientId}/authz/resource-server/permission/scope/${fineGrainPermissionResourceRole.scopePermissions['map-role']}`;
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        });

        return this.getScopeResourceId(realmManagementClientId, fineGrainPermissionResourceRole.scopePermissions['map-role']).pipe(
          switchMap(scopeResourceId => {
            const policyIds = rolePoliciesArray.map(policy => policy.id);
            const body = {
              id: fineGrainPermissionResourceRole.scopePermissions['map-role'],
              name: 'map-role.permission.' + fineGrainPermissionResourceRole.resource,
              type: 'scope',
              logic: 'POSITIVE',
              decisionStrategy: 'AFFIRMATIVE', // at least one policy is true
              resources: [fineGrainPermissionResourceRole.resource],
              policies: policyIds,
              scopes: [scopeResourceId],
              description: ''
            };

            return this.http.put(url, body, { headers });
          })
        );
      }),
      catchError(error => {
        console.error('Error while posting role policies for Keycloak user creator realm role:', error);
        return throwError(error);
      })
    );
  }

  public getRoleByName(roleName: string): Observable<KeycloakRole> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/roles/${roleName}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    return this.http.get<KeycloakRole>(url, { headers }).pipe(
      catchError(error => {
        console.error('Error while fetching role by name:', error);
        return throwError(error);
      })
    );
  }

  public enableFineGrainedPermissionsForRole(role: KeycloakRole): Observable<FineGrainedPermissionResource> {
    const bearerToken = this.keycloakService.getKeycloakInstance().token;
    const url = `${this.targetUrlToKeycloakInstance}admin/realms/${this.realm}/roles-by-id/${role.id}/management/permissions`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`
    });

    const body = { enabled: true };

    return this.http.put<FineGrainedPermissionResource>(url, body, { headers }).pipe(
      catchError(error => {
        console.error('Error while enabling fine-grained permissions for role:', error);
        return throwError(error);
      })
    );
  }
} 