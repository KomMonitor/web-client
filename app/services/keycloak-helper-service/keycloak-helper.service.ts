import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthService } from 'services/auth-service/auth.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Injectable({
  providedIn: 'root',
})
export class KeycloakHelperService {
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private envConfigService = inject(EnvConfigService);

  availableKeycloakRoles: any[] = [];
  availableKeycloakGroups: any[] = [];
  targetUrlToKeycloakInstance = '';
  targetRealmUrlToKeycloakInstance = '';
  realm = '';
  clientId = '';

  roleSuffixes = ['viewer', 'editor', 'publisher', 'creator'];

  adminRoleSuffixes;

  async init() {
    this.adminRoleSuffixes = this.envConfigService.keycloakKomMonitorGroupsEditRoleNames
      .concat(this.envConfigService.keycloakKomMonitorThemesEditRoleNames)
      .concat(this.envConfigService.keycloakKomMonitorGeodataEditRoleNames);

    console.log('KEYCLOAK INIT');
    try {
      if (this.envConfigService.keycloakConfig) {
        this.configureKeycloakParameters(this.envConfigService.keycloakConfig);
      } else {
        await this.httpClient.get('./config/keycloak_backup.json').subscribe({
          next: (response) => {
            this.configureKeycloakParameters(response);
          },
        });
      }

      // await this.fetchAndSetKeycloakGroups();
      await this.fetchAndSetKeycloakRoles();
    } catch (error) {
      console.error(
        'Error while initializing kommonitorKeycloakHelperService. Error while fetching and interpreting config file. Error is: ' +
          error
      );
      throw error;
    }
  }

  configureKeycloakParameters(keycloakConfig) {
    // // https://<keycloak.url>/auth/
    this.targetUrlToKeycloakInstance = keycloakConfig['auth-server-url'];
    this.realm = keycloakConfig['realm'];
    this.clientId = keycloakConfig['resource'];

    // https://<keycloak.url>/auth/admin/<realm-name>/console
    this.targetRealmUrlToKeycloakInstance =
      this.targetUrlToKeycloakInstance + 'admin/' + this.realm + '/console/';
  }

  async fetchRoles() {
    console.log('Fetching roles from Keycloak instance at ' + this.targetUrlToKeycloakInstance);
    return await this.httpClient
      .get(this.targetUrlToKeycloakInstance + this.realm + '/clients/' + this.clientId + '/roles')
      .subscribe({
        next: (response) => {
          // this callback will be called asynchronously
          // when the response is available

          return response;
        },
        error: (_error) => {
          // called asynchronously if an error occurs
          // or server returns response with an error status.

          console.error('Error while fetching roles from keycloak.');
        },
      });
  }

  async postNewRole_withToken(bearerToken, rolesBody) {
    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .post(this.targetUrlToKeycloakInstance + 'admin/realms/' + this.realm + '/roles', rolesBody, {
        headers: header,
      })
      .subscribe({
        next: (response) => {
          return response;
        },
        error: (error) => {
          console.error('Error while posting role to keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async renameExistingRole_withToken(bearerToken, oldRoleName, newRoleName, organizationalUnit) {
    const keycloakRole = this.getKeycloakRoleNyName(oldRoleName);
    const rolesBody = {
      name: newRoleName,
      attributes: {
        kommonitorOrganizationalUnitId: [organizationalUnit.organizationalUnitId],
      },
    };

    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .put(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/roles-by-id/' +
          keycloakRole.id,
        rolesBody,
        { headers: header }
      )
      .subscribe({
        next: (response) => {
          return response;
        },
        error: (error) => {
          console.error('Error while posting role to keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  /* 
  
  return await this.httpClient.post(url, body, {headers: }).subscribe({
      next: response => {

      },
      error: error => {

      }
    });


  */
  async deleteRole_withToken(bearerToken, roleName) {
    const keycloakRole = this.getKeycloakRoleNyName(roleName);

    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .delete(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/roles-by-id/' +
          keycloakRole.id,
        { headers: header }
      )
      .subscribe({
        next: (response) => {
          return response;
        },
        error: (error) => {
          console.error('Error while deleting role from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async getAllRoles_withToken(bearerToken) {
    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(this.targetUrlToKeycloakInstance + 'admin/realms/' + this.realm + '/roles', {
        headers: header,
      })
      .subscribe({
        next: (response) => {
          return response;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async addCompositeRole_withToken(bearerToken, baseRoleName, composite) {
    const data = [
      {
        id: composite.id,
        name: composite.name,
      },
    ];

    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .post(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/roles/' +
          baseRoleName +
          '/composites',
        data,
        { headers: header }
      )
      .subscribe({
        next: (response) => {
          return response;
        },
        error: (error) => {
          console.error('Error while creating composite role in keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async renameExistingRoles(
    oldOrganizationalUnitName,
    newOrganizationalUnitName,
    organizationalUnit
  ) {
    try {
      // first get auth token to make admin requests
      const bearerToken = this.authService.getToken();

      for (const suffix of this.roleSuffixes) {
        await this.renameExistingRole_withToken(
          bearerToken,
          oldOrganizationalUnitName + '-' + suffix,
          newOrganizationalUnitName + '-' + suffix,
          organizationalUnit
        );
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteRoles(organizationalUnitName) {
    try {
      // first get auth token to make admin requests
      const bearerToken = this.authService.getToken();

      for (const suffix of this.roleSuffixes) {
        await this.deleteRole_withToken(bearerToken, organizationalUnitName + '-' + suffix);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAllRoles() {
    try {
      // first get auth token to make admin requests
      const bearerToken = this.authService.getToken();

      // then make admin request
      return await this.getAllRoles_withToken(bearerToken);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  setAvailableKeycloakRoles(roles) {
    this.availableKeycloakRoles = roles;
  }

  getKeycloakRoleNyName(roleName) {
    for (const role of this.availableKeycloakRoles) {
      if (role.name == roleName) {
        return role;
      }
    }
  }

  async fetchAndSetKeycloakRoles() {
    this.setAvailableKeycloakRoles(await this.getAllRoles());
  }

  isRoleInKeycloak(roleName) {
    for (const keycloakRole of this.availableKeycloakRoles) {
      if (keycloakRole.name === roleName) {
        return true;
      }
    }
    return false;
  }

  async getClientQueryUsersRole() {
    const realmManagementClientId = await this.getRealmManagementClientId();

    const bearerToken = this.authService.getToken();

    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/clients/' +
          realmManagementClientId +
          '/roles?search=query-users',
        { headers: header }
      )
      .subscribe({
        next: (response) => {
          return response[0];
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async getMemberCountForGroup(memberId) {
    const bearerToken = this.authService.getToken();

    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/groups/' +
          memberId +
          '/members',
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response.length;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async getClientQueryGroupsRole() {
    const realmManagementClientId = await this.getRealmManagementClientId();

    const bearerToken = this.authService.getToken();

    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/clients/' +
          realmManagementClientId +
          '/roles?search=query-groups',
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response[0];
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async postNewGroup(organizationalUnit, parentOrganizationalUnit) {
    try {
      // get auth token to make admin requests
      const bearerToken = this.authService.getToken();

      const groupBody = {
        name: organizationalUnit.name,
        attributes: {
          mandant: [organizationalUnit.mandant],
          //"kommonitorOrganizationalUnitId": [organizationalUnit.organizationalUnitId]   // we post keycloak group before creating kommonitor org.
        },
      };

      if (parentOrganizationalUnit && parentOrganizationalUnit.keycloakId) {
        await this.postNewSubTierGroup_withToken(
          bearerToken,
          groupBody,
          parentOrganizationalUnit.keycloakId
        );
      } else {
        await this.postNewTopTierGroup_withToken(bearerToken, groupBody);
      }

      // fetch view-users client-role
      // to make each new role a composite role
      // thus enabling any person with those roles to view all users
      // TODO FIXME only issue is, that with client-role view-users the person can see all other groups as well, which is not desired
      const role_client_query_users = await this.getClientQueryUsersRole();
      const role_client_query_groups = await this.getClientQueryGroupsRole();

      // post individual roles
      for (const suffix of this.adminRoleSuffixes) {
        // post individual role
        const roleBody = {
          name: organizationalUnit.name + '.' + suffix,
        };
        // if (suffix.includes("users")){
        //   roleBody.composite = true;
        //   roleBody.composites = [{
        //     "id": role_client_view_users.id,
        //     "name": role_client_view_users.name
        //   }]
        // }
        await this.postNewRole_withToken(bearerToken, roleBody);
        if (suffix.includes('users')) {
          await this.addCompositeRole_withToken(
            bearerToken,
            organizationalUnit.name + '.' + suffix,
            role_client_query_groups
          );
          await this.addCompositeRole_withToken(
            bearerToken,
            organizationalUnit.name + '.' + suffix,
            role_client_query_users
          );
        }
      }
      // const allRoles = await this.getAllRoles_withToken(bearerToken);
      // var roleMap = allRoles.filter(role => role.name.startsWith(organizationalUnit.name + "."))
      //   .reduce((prev, curr) => (prev[curr.name] = curr, prev), {});
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async postNewTopTierGroup_withToken(bearerToken, groupBody) {
    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .post(
        this.targetUrlToKeycloakInstance + 'admin/realms/' + this.realm + '/groups',
        groupBody,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response;
        },
        error: (error) => {
          console.error('Error while posting group to keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async postNewSubTierGroup_withToken(bearerToken, groupBody, parentGroupId) {
    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .post(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/groups/' +
          parentGroupId +
          '/children',
        groupBody,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response;
        },
        error: (error) => {
          console.error('Error while posting group to keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async getAllGroups() {
    try {
      // first get auth token to make admin requests
      const bearerToken = this.authService.getToken();

      // then make admin request
      return await this.getAllGroups_withToken(bearerToken);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAllGroups_withToken(bearerToken) {
    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/groups?populateHierarchy=true&briefRepresentation=false',
        { headers: header }
      )
      .subscribe({
        next: async (response: any) => {
          const topTierGroups = response;
          return await this.fetchAndAddSubGroups(topTierGroups, bearerToken);
        },
        error: (error) => {
          console.error('Error while fetching groups from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async fetchAndAddSubGroups(groups, bearerToken) {
    // method currently creates duplicate entries
    for (const group of groups) {
      if (group.subGroupCount && group.subGroupCount > 0) {
        let subGroups: any = await this.fetchSubGroups(group, bearerToken);

        subGroups = subGroups.concat(await this.fetchAndAddSubGroups(subGroups, bearerToken));
        groups = groups.concat(subGroups);
      }
    }

    //remove duplicates
    return [...new Set(groups)];
  }

  async fetchSubGroups(group, bearerToken) {
    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/groups/' +
          group.id +
          '/children?populateHierarchy=true&briefRepresentation=false',
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response;
        },
        error: (error) => {
          console.error('Error while fetching sub groups from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  setAvailableKeycloakGroups(groups) {
    this.availableKeycloakGroups = groups;
  }

  async fetchAndSetKeycloakGroups() {
    this.setAvailableKeycloakGroups(await this.getAllGroups());
  }

  isGroupInKeycloak(groupName) {
    for (const keycloakGroup of this.availableKeycloakGroups) {
      if (keycloakGroup.name === groupName) {
        return true;
      }
    }
    return false;
  }

  async getGroupDetails_rootGroup(organizationalUnit, bearerToken) {
    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/groups/?search=' +
          organizationalUnit.name,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response[0];
        },
        error: (error) => {
          console.error('Error while fetching sub groups from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async getGroupDetails_subGroup(organizationalUnit, parentOrganizationalUnit, bearerToken) {
    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/groups/' +
          parentOrganizationalUnit.keycloakId,
        { headers: header }
      )
      .subscribe({
        next: async (response: any) => {
          let subgroups;

          if (response.subGroupCount && response.subGroupCount > 0) {
            subgroups = await this.fetchSubGroups(response, bearerToken);
          } else {
            subgroups = response.subGroups;
          }

          for (const subGroup of subgroups) {
            if (subGroup.name == organizationalUnit.name) {
              return subGroup;
            }
          }
        },
        error: (error) => {
          console.error('Error while fetching sub groups from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async getGroupDetails(organizationalUnit, parentOrganizationalUnit) {
    const bearerToken = this.authService.getToken();

    // differentiate between root tier and sub tier

    if (organizationalUnit.parentId && organizationalUnit.parentId != '') {
      return await this.getGroupDetails_subGroup(
        organizationalUnit,
        parentOrganizationalUnit,
        bearerToken
      );
    } else {
      return await this.getGroupDetails_rootGroup(organizationalUnit, bearerToken);
    }
  }

  async updateExistingGroup(organizationalUnit, oldName, parentOrganizationalUnit) {
    // get auth token to make admin requests
    const bearerToken = this.authService.getToken();

    const groupBody = {
      id: organizationalUnit.keycloakId,
      name: organizationalUnit.name,
      attributes: {
        mandant: [organizationalUnit.mandant],
        kommonitorOrganizationalUnitId: [organizationalUnit.organizationalUnitId],
      },
    };

    if (parentOrganizationalUnit && parentOrganizationalUnit.keycloakId) {
      await this.updateSubTierGroup_withToken(
        bearerToken,
        groupBody,
        parentOrganizationalUnit.keycloakId
      );
    } else {
      await this.updateTopTierGroup_withToken(bearerToken, groupBody);
    }

    // post individual roles
    for (const suffix of this.adminRoleSuffixes) {
      // post individual role
      await this.renameExistingRole_withToken(
        bearerToken,
        oldName + '.' + suffix,
        organizationalUnit.name + '.' + suffix,
        organizationalUnit
      );
    }
  }

  async updateTopTierGroup_withToken(bearerToken, groupBody) {
    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .put(
        this.targetUrlToKeycloakInstance + 'admin/realms/' + this.realm + '/groups/' + groupBody.id,
        groupBody,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response;
        },
        error: (error) => {
          console.error('Error while renaming group in keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async updateSubTierGroup_withToken(bearerToken, groupBody, parentId) {
    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .post(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/groups/' +
          parentId +
          '/children',
        groupBody,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response;
        },
        error: (error) => {
          console.error('Error while renaming group in keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async deleteGroup(organizationalUnit) {
    try {
      // first get auth token to make admin requests
      const bearerToken = this.authService.getToken();

      await this.deleteGroup_withToken(bearerToken, organizationalUnit.keycloakId);

      for (const suffix of this.adminRoleSuffixes) {
        await this.deleteRole_withToken(bearerToken, organizationalUnit.name + '.' + suffix);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteGroup_withToken(bearerToken, keycloakId) {
    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .delete(
        this.targetUrlToKeycloakInstance + 'admin/realms/' + this.realm + '/groups/' + keycloakId,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response;
        },
        error: (error) => {
          console.error('Error while deleting role from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  getOwnChildGroupsCount(groupId) {
    const group = this.availableKeycloakGroups.filter((item) => item.id == groupId)[0];

    if (group && group.subGroupCount) {
      return group.subGroupCount;
    }
    return 0;
  }

  getOwnChildGroupNames(childOrganizationalUnits) {
    if (!childOrganizationalUnits || childOrganizationalUnits.length == 0) {
      return '';
    }

    const childOrganizationalUnitKeycloakIds = childOrganizationalUnits.map(
      (item) => item.keycloakId
    );

    const associatedKeycloakGroups = this.availableKeycloakGroups.filter((item) =>
      childOrganizationalUnitKeycloakIds.includes(item.id)
    );

    return JSON.stringify(associatedKeycloakGroups.map((item) => item.name));
  }

  async getRealmManagementClientId() {
    const bearerToken = this.authService.getToken();

    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/clients?search=true&clientId=realm-management',
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          console.log('realm management client id response ');
          console.log(response);
          return response[0].id;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async enableFineGrainedPermissionsForGroup(groupId) {
    const bearerToken = this.authService.getToken();

    const body = {
      enabled: true,
    };

    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .put(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/groups/' +
          groupId +
          '/management/permissions',
        body,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          console.log('fine grained permissions enablement response');
          console.log(response);
          return response;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async postPolicyForRole(keycloakRole, realmManagementClientId) {
    const bearerToken = this.authService.getToken();

    const body = {
      name: 'member-of-' + keycloakRole.name,
      description: 'memberOf(' + keycloakRole.name + ')',
      roles: [
        {
          id: keycloakRole.id,
          required: true,
        },
      ],
      logic: 'POSITIVE',
    };

    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .post(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/clients/' +
          realmManagementClientId +
          '/authz/resource-server/policy/role',
        body,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          console.log('policy response');
          console.log(response);
          return response;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async generateRolePolicies(realmManagementClientId, organizationalUnit) {
    // create a policy for each user-creator role of this orga
    const policyArray: any[] = [];

    // individual role policies
    const userSuffixes = this.adminRoleSuffixes.filter((suffix) => suffix.includes('user'));
    const userAdminRoles = this.availableKeycloakRoles.filter((role) => {
      for (const userSuffix of userSuffixes) {
        if (role.name == organizationalUnit.name + '.' + userSuffix) {
          return true;
        }
      }

      return false;
    });
    for (const userAdminRole of userAdminRoles) {
      policyArray.push(await this.postPolicyForRole(userAdminRole, realmManagementClientId));
    }

    return policyArray;
  }

  async getSingleParentClientUserRolePolicy(realmManagementClientId, parentOrganizationalUnit) {
    // fetch the client-users-creator role policy of the parent org

    const bearerToken = this.authService.getToken();

    const parentClientUserCreatorPolicyName =
      parentOrganizationalUnit.name + '.client-users-creator';

    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/clients/' +
          realmManagementClientId +
          '/authz/resource-server/policy?name=' +
          parentClientUserCreatorPolicyName,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          console.log(response);
          return response[0];
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async getAllParentClientUserRolePolicies(
    realmManagementClientId,
    organizationalUnit,
    allOrganizationalUnitsMap
  ) {
    let parentRolePolicies: any[] = [];

    if (organizationalUnit.parentId) {
      const parentOrganizationalUnit = allOrganizationalUnitsMap.get(organizationalUnit.parentId);
      parentRolePolicies.push(
        await this.getSingleParentClientUserRolePolicy(
          realmManagementClientId,
          parentOrganizationalUnit
        )
      );

      parentRolePolicies = parentRolePolicies.concat(
        await this.getAllParentClientUserRolePolicies(
          realmManagementClientId,
          parentOrganizationalUnit,
          allOrganizationalUnitsMap
        )
      );
    }

    //remove duplicates
    return [...new Set(parentRolePolicies)];
  }

  async putRolePoliciesForKeycloakGroup(
    realmManagementClientId,
    fineGrainPermissionResource,
    groupId,
    rolePoliciesArray
  ) {
    // multiple scopes exist within fineGrainPermissionResource
    // we must register a similar policy for each scope

    /*
      {
        "enabled": true,
        "resource": "${resource.uuid}",
        "scopePermissions": {
            "view": "${scopePermission.uuid}",
            "manage": "${scopePermission.uuid}",
            "view-members": "${scopePermission.uuid}",
            "manage-members": "${scopePermission.uuid}",
            "manage-membership": "${scopePermission.uuid}"
        }
      }
    */
    for (const scopePermissionName in fineGrainPermissionResource.scopePermissions) {
      const scopeUUID = fineGrainPermissionResource.scopePermissions[scopePermissionName];
      await this.putRolePolicyForKeycloakGroupResourceScope(
        realmManagementClientId,
        fineGrainPermissionResource.resource,
        scopeUUID,
        scopePermissionName,
        groupId,
        rolePoliciesArray
      );
    }
  }

  async getScopeResourceId(realmManagementClientId, scopeUUID) {
    // http://keycloak:8080/admin/realms/kommonitor/clients/ab58087d-9911-4a76-9d70-89a422e4f644/authz/resource-server/policy/7e1274c7-6b40-4e53-baad-9009f0633e3c/scopes
    const bearerToken = this.authService.getToken();

    const header = {
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/clients/' +
          realmManagementClientId +
          '/authz/resource-server/policy/' +
          scopeUUID +
          '/scopes',
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response[0].id;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async putRolePolicyForKeycloakGroupResourceScope(
    realmManagementClientId,
    fineGrainPermissionResourceUUID,
    scopeUUID,
    scopePermissionName,
    groupId,
    rolePoliciesArray
  ) {
    const bearerToken = this.authService.getToken();

    /*
      {
        "id": "${scopePermission.uuid}",
        "name": "manage.permission.group.${group.uuid}",
        "type": "scope",
        "logic": "POSITIVE",
        "decisionStrategy": "UNANIMOUS",
        "resources": ["${resource.uuid}"],
        "policies": ["${policy.uuid}"],
        "scopes": ["${scope.uuid}"],
        "description": ""
      }

    */
    const policyIds = rolePoliciesArray.map((policy) => policy.id);

    // we must replace permission names including "-" with "." in order to make keycloak internal join true
    // otherwise the policies are not attached to the specific scope
    const scopeResourceId = await this.getScopeResourceId(realmManagementClientId, scopeUUID);
    const body = {
      id: scopeUUID,
      name: scopePermissionName.replace('-', '.') + '.permission.group.' + groupId,
      type: 'scope',
      logic: 'POSITIVE',
      decisionStrategy: 'AFFIRMATIVE', // at least one policy is true
      resources: [fineGrainPermissionResourceUUID],
      policies: policyIds,
      scopes: [scopeResourceId],
      description: '',
    };

    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .put(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/clients/' +
          realmManagementClientId +
          '/authz/resource-server/permission/scope/' +
          scopeUUID,
        body,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async setKeycloakPoliciesForKomMonitorOrganization(organizationalUnit, allOrganizationalUnits) {
    // get auth token to make admin requests
    const _bearerToken = this.authService.getToken();

    try {
      // 1. enable fine grain permissions on new group
      // --> permission resource
      // 2. create policies for new associated group (unit-users-creator and client-users-creator)
      // --> array of policies
      // 3. set policies for new group to enable group and subgroup management for admins with associated roles
      // 4. set same policies for associated user-creator roles for scope map-role

      const realmManagementClientId = await this.getRealmManagementClientId();

      // 1. enable fine grain permissions on new group
      // --> permission resource
      const fineGrainPermissionResource_group = await this.enableFineGrainedPermissionsForGroup(
        organizationalUnit.keycloakId
      );

      // 2. create policies for new associated group (unit-users-creator and client-users-creator)
      // --> array of policies
      let rolePoliciesArray = await this.generateRolePolicies(
        realmManagementClientId,
        organizationalUnit
      );

      rolePoliciesArray = rolePoliciesArray.concat(
        await this.getAllParentClientUserRolePolicies(
          realmManagementClientId,
          organizationalUnit,
          allOrganizationalUnits
        )
      );

      // 3. set policies for new group to enable group and subgroup management for admins with associated roles
      await this.putRolePoliciesForKeycloakGroup(
        realmManagementClientId,
        fineGrainPermissionResource_group,
        organizationalUnit.keycloakId,
        rolePoliciesArray
      );

      // 4. set same policies for associated user-creator roles for scope map-role
      await this.postRolePoliciesForKeycloakUserCreatorRealmRoles(
        realmManagementClientId,
        organizationalUnit,
        rolePoliciesArray
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async postRolePoliciesForKeycloakUserCreatorRealmRoles(
    realmManagementClientId,
    organizationalUnit,
    rolePoliciesArray
  ) {
    for (const suffix of this.adminRoleSuffixes) {
      await this.postRolePoliciesForKeycloakUserCreatorRealmRole(
        realmManagementClientId,
        organizationalUnit.name + '.' + suffix,
        rolePoliciesArray
      );
    }
  }

  async postRolePoliciesForKeycloakUserCreatorRealmRole(
    realmManagementClientId,
    roleName,
    rolePoliciesArray
  ) {
    const role: any = await this.getRoleByName(roleName);

    const fineGrainPermissionResource_role: any =
      await this.enableFineGrainedPermissionsForRole(role);

    const bearerToken = this.authService.getToken();

    const policyIds = rolePoliciesArray.map((policy) => policy.id);
    const scopeUUID = fineGrainPermissionResource_role.scopePermissions['map-role'];

    const scopeResourceId = await this.getScopeResourceId(realmManagementClientId, scopeUUID);

    const body = {
      id: scopeUUID,
      name: 'map-role.permission.' + role.id,
      type: 'scope',
      logic: 'POSITIVE',
      decisionStrategy: 'AFFIRMATIVE', // at least one policy is true
      resources: [fineGrainPermissionResource_role.resource],
      policies: policyIds,
      scopes: [scopeResourceId],
      description: '',
    };

    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .put(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/clients/' +
          realmManagementClientId +
          '/authz/resource-server/permission/scope/' +
          scopeUUID,
        body,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          return response;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async getRoleByName(roleName) {
    const bearerToken = this.authService.getToken();

    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .get(this.targetUrlToKeycloakInstance + 'admin/realms/' + this.realm + '/roles/' + roleName, {
        headers: header,
      })
      .subscribe({
        next: (response: any) => {
          return response;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }

  async enableFineGrainedPermissionsForRole(role) {
    const bearerToken = this.authService.getToken();

    const body = {
      enabled: true,
    };

    const header = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearerToken, // Note the appropriate header
    };

    return await this.httpClient
      .put(
        this.targetUrlToKeycloakInstance +
          'admin/realms/' +
          this.realm +
          '/roles-by-id/' +
          role.id +
          '/management/permissions',
        body,
        { headers: header }
      )
      .subscribe({
        next: (response: any) => {
          console.log('fine grained permissions enablement response');
          console.log(response);
          return response;
        },
        error: (error) => {
          console.error('Error while fetching roles from keycloak.');
          console.error(error);
          throw error;
        },
      });
  }
}
