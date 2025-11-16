import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { AuthService } from 'services/auth-service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class KeycloakHelperService implements OnInit {

  availableKeycloakRoles:any[] = [];
  availableKeycloakGroups:any[] = [];
  targetUrlToKeycloakInstance = "";
  targetRealmUrlToKeycloakInstance = "";
  realm = "";
  clientId = "";

  roleSuffixes = ["viewer", "editor", "publisher", "creator"];

  adminRoleSuffixes = window.__env.keycloakKomMonitorGroupsEditRoleNames.concat(window.__env.keycloakKomMonitorThemesEditRoleNames).concat(window.__env.keycloakKomMonitorGeodataEditRoleNames);

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
      this.init();
  }

  async init() {
    console.log("KEYCLOAK INIT");
    try {
      if (window.__env.keycloakConfig) {
        this.configureKeycloakParameters(window.__env.keycloakConfig);
      }
      else {
        await this.httpClient.get('./config/keycloak_backup.json').subscribe({
          next: response => {
            this.configureKeycloakParameters(response);
          }
        });
      }

      // await this.fetchAndSetKeycloakGroups();
      await this.fetchAndSetKeycloakRoles();
    } catch (error) {
      console.error("Error while initializing kommonitorKeycloakHelperService. Error while fetching and interpreting config file. Error is: " + error);
      throw error;
    }
  };

  configureKeycloakParameters(keycloakConfig) {
    // // https://<keycloak.url>/auth/
    this.targetUrlToKeycloakInstance = keycloakConfig['auth-server-url'];
    this.realm = keycloakConfig['realm'];
    this.clientId = keycloakConfig['resource'];

    // https://<keycloak.url>/auth/admin/<realm-name>/console
    this.targetRealmUrlToKeycloakInstance = this.targetUrlToKeycloakInstance + "admin/" + this.realm + "/console/";
  }

  async fetchRoles() {

    console.log("Fetching roles from Keycloak instance at " + this.targetUrlToKeycloakInstance);
    return await this.httpClient.get(this.targetUrlToKeycloakInstance + this.realm + "/clients/" + this.clientId + "/roles").subscribe({
      next: response => {
        // this callback will be called asynchronously
        // when the response is available

        return response;
      },
      error: error => {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        
        console.error("Error while fetching roles from keycloak.");
      }
    });
  };

  async postNewRole_withToken(bearerToken, rolesBody) {

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.post(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles", rolesBody, {headers: header}).subscribe({
      next: response => {
        return response;
      },
      error: error => {
        console.error("Error while posting role to keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async renameExistingRole_withToken(bearerToken, oldRoleName, newRoleName, organizationalUnit) {
    let keycloakRole = this.getKeycloakRoleNyName(oldRoleName);
    var rolesBody = {
      "name": newRoleName,
      "attributes": {
        "kommonitorOrganizationalUnitId": [organizationalUnit.organizationalUnitId]
      }
    };

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.put(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles-by-id/" + keycloakRole.id, rolesBody, {headers: header}).subscribe({
      next: response => {
        return response;
      },
      error: error => {
        console.error("Error while posting role to keycloak.");
        console.error(error);
        throw error;
      }
    });
  };


  /* 
  
  return await this.httpClient.post(url, body, {headers: }).subscribe({
      next: response => {

      },
      error: error => {

      }
    });


  */
  async deleteRole_withToken(bearerToken, roleName) {

    let keycloakRole = this.getKeycloakRoleNyName(roleName);

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.delete(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles-by-id/" + keycloakRole.id, {headers: header}).subscribe({
      next: response => {
        return response;
      },
      error: error => {
        console.error("Error while deleting role from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async getAllRoles_withToken(bearerToken) {

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles", {headers: header}).subscribe({
      next: response => {
        return response;
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  };

  async addCompositeRole_withToken(bearerToken, baseRoleName, composite) {
    let data = [{
      "id": composite.id,
      "name": composite.name
    }];

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.post(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles/" + baseRoleName + "/composites", data, {headers: header}).subscribe({
      next: response => {
        return response;
      },
      error: error => {
        console.error("Error while creating composite role in keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async renameExistingRoles(oldOrganizationalUnitName, newOrganizationalUnitName, organizationalUnit) {
    try {
      // first get auth token to make admin requests
      var bearerToken = this.authService.Auth.keycloak.token;

      for (let suffix of this.roleSuffixes) {
        await this.renameExistingRole_withToken(bearerToken, oldOrganizationalUnitName + "-" + suffix, newOrganizationalUnitName + "-" + suffix, organizationalUnit);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }

  };

  async deleteRoles(organizationalUnitName) {
    try {
      // first get auth token to make admin requests
      var bearerToken = this.authService.Auth.keycloak.token;

      for (let suffix of this.roleSuffixes) {
        await this.deleteRole_withToken(bearerToken, organizationalUnitName + "-" + suffix);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  async getAllRoles() {
    try {
      // first get auth token to make admin requests
      var bearerToken = this.authService.Auth.keycloak.token;

      // then make admin request
      return await this.getAllRoles_withToken(bearerToken);
    } catch (error) {
      console.error(error);
      throw error;
    }

  };

  setAvailableKeycloakRoles(roles) {
    this.availableKeycloakRoles = roles;
  }

  getKeycloakRoleNyName(roleName){
    for (const role of this.availableKeycloakRoles) {
      if (role.name == roleName){
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
    let realmManagementClientId = await this.getRealmManagementClientId();

    var bearerToken = this.authService.Auth.keycloak.token;

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/roles?search=query-users", {headers: header}).subscribe({
      next: response => {
        return response[0];
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async getMemberCountForGroup(memberId){
    
    var bearerToken = this.authService.Auth.keycloak.token;

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + memberId + "/members", {headers: header}).subscribe({
      next: (response:any) => {
        return response.length;
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async getClientQueryGroupsRole(){
    let realmManagementClientId = await this.getRealmManagementClientId();

    var bearerToken = this.authService.Auth.keycloak.token;

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/roles?search=query-groups", {headers: header}).subscribe({
      next: (response:any) => {
        return response[0];
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async postNewGroup(organizationalUnit, parentOrganizationalUnit) {
    try {
      // get auth token to make admin requests
      var bearerToken = this.authService.Auth.keycloak.token;

      let groupBody = { 
        "name": organizationalUnit.name, 
        "attributes": {
          "mandant": [organizationalUnit.mandant]
          //"kommonitorOrganizationalUnitId": [organizationalUnit.organizationalUnitId]   // we post keycloak group before creating kommonitor org.
        }
      };

      if(parentOrganizationalUnit && parentOrganizationalUnit.keycloakId){
        await this.postNewSubTierGroup_withToken(bearerToken, groupBody, parentOrganizationalUnit.keycloakId);
      }
      else{
        await this.postNewTopTierGroup_withToken(bearerToken, groupBody);
      }
      
      // fetch view-users client-role
      // to make each new role a composite role
      // thus enabling any person with those roles to view all users
      // TODO FIXME only issue is, that with client-role view-users the person can see all other groups as well, which is not desired
      let role_client_query_users = await this.getClientQueryUsersRole();
      let role_client_query_groups = await this.getClientQueryGroupsRole(); 

      // post individual roles
      for (let suffix of this.adminRoleSuffixes) {
        // post individual role
        let roleBody = { 
          "name": organizationalUnit.name + "." + suffix,              
        }
        // if (suffix.includes("users")){
        //   roleBody.composite = true;
        //   roleBody.composites = [{
        //     "id": role_client_view_users.id,
        //     "name": role_client_view_users.name
        //   }]
        // }
        await this.postNewRole_withToken(bearerToken, roleBody);
        if(suffix.includes("users")){
          await this.addCompositeRole_withToken(bearerToken, organizationalUnit.name + "." + suffix, role_client_query_groups);
          await this.addCompositeRole_withToken(bearerToken, organizationalUnit.name + "." + suffix, role_client_query_users);
        }            
      }
      // const allRoles = await this.getAllRoles_withToken(bearerToken);
      // var roleMap = allRoles.filter(role => role.name.startsWith(organizationalUnit.name + "."))
      //   .reduce((prev, curr) => (prev[curr.name] = curr, prev), {});

    } catch (error) {

      console.error(error);
      throw error;
    }
  };

  async postNewTopTierGroup_withToken(bearerToken, groupBody) {

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.post(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups", groupBody, {headers: header}).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        console.error("Error while posting group to keycloak.");
        console.error(error);
        throw error;
      }
    });
  };

  async postNewSubTierGroup_withToken(bearerToken, groupBody, parentGroupId) {

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.post(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + parentGroupId + "/children", groupBody, {headers: header}).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        console.error("Error while posting group to keycloak.");
        console.error(error);
        throw error;
      }
    });
  };

  async getAllGroups() {
    try {
      // first get auth token to make admin requests
      var bearerToken = this.authService.Auth.keycloak.token;

      // then make admin request
      return await this.getAllGroups_withToken(bearerToken);
    } catch (error) {
      console.error(error);
      throw error;
    }

  };

  async getAllGroups_withToken(bearerToken) {

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups?populateHierarchy=true&briefRepresentation=false", {headers: header}).subscribe({
      next: async (response:any) => {
        let topTierGroups = response;
        return await this.fetchAndAddSubGroups(topTierGroups, bearerToken);
      },
      error: error => {
        console.error("Error while fetching groups from keycloak.");
        console.error(error);
        throw error;
      }
    });
  };

  async fetchAndAddSubGroups(groups, bearerToken){
    // method currently creates duplicate entries
    for (const group of groups) {
      if (group.subGroupCount && group.subGroupCount > 0){
        let subGroups:any = await this.fetchSubGroups(group, bearerToken);            
                      
        subGroups = subGroups.concat(await this.fetchAndAddSubGroups(subGroups, bearerToken));
        groups = groups.concat(subGroups);
      }
    }

    //remove duplicates
    return [... new Set(groups)];
  }

  async fetchSubGroups(group, bearerToken){

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + group.id + "/children?populateHierarchy=true&briefRepresentation=false", {headers: header}).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        console.error("Error while fetching sub groups from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  setAvailableKeycloakGroups(groups) {
    this.availableKeycloakGroups = groups;
  };

  async fetchAndSetKeycloakGroups() {
    this.setAvailableKeycloakGroups(await this.getAllGroups());
  };

  isGroupInKeycloak(groupName) {
    for (const keycloakGroup of this.availableKeycloakGroups) {
      if (keycloakGroup.name === groupName) {
        return true;
      }
    }
    return false;
  };

  async getGroupDetails_rootGroup(organizationalUnit, bearerToken){

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/?search=" + organizationalUnit.name, {headers: header}).subscribe({
      next: (response:any) => {
        return response[0];
      },
      error: error => {
        console.error("Error while fetching sub groups from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async getGroupDetails_subGroup(organizationalUnit, parentOrganizationalUnit, bearerToken){

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + parentOrganizationalUnit.keycloakId, {headers: header}).subscribe({
      next: async (response:any) => {
        let subgroups;

        if (response.subGroupCount && response.subGroupCount > 0){
          subgroups = await this.fetchSubGroups(response, bearerToken)
        }
        else{
          subgroups = response.subGroups;
        } 
        
        for (const subGroup of subgroups) {
          if (subGroup.name == organizationalUnit.name){
            return subGroup;
          }
        }
      },
      error: error => {
        console.error("Error while fetching sub groups from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async getGroupDetails(organizationalUnit, parentOrganizationalUnit){

    var bearerToken = this.authService.Auth.keycloak.token;

    // differentiate between root tier and sub tier

    if (organizationalUnit.parentId && organizationalUnit.parentId != ""){
      return await this.getGroupDetails_subGroup(organizationalUnit, parentOrganizationalUnit, bearerToken);
    }
    else{
      return await this.getGroupDetails_rootGroup(organizationalUnit, bearerToken);
    }
  }

  async updateExistingGroup(organizationalUnit, oldName, parentOrganizationalUnit){
    // get auth token to make admin requests
    var bearerToken = this.authService.Auth.keycloak.token;

    let groupBody = { 
      "id": organizationalUnit.keycloakId,
      "name": organizationalUnit.name, 
      "attributes": {
        "mandant": [organizationalUnit.mandant],
        "kommonitorOrganizationalUnitId": [organizationalUnit.organizationalUnitId]
      }
    };

      if (parentOrganizationalUnit && parentOrganizationalUnit.keycloakId){
        await this.updateSubTierGroup_withToken(bearerToken, groupBody, parentOrganizationalUnit.keycloakId);
      }
      else{
        await this.updateTopTierGroup_withToken(bearerToken, groupBody);
      }

    // post individual roles
    for (let suffix of this.adminRoleSuffixes) {
      // post individual role
      await this.renameExistingRole_withToken(bearerToken, oldName + "." + suffix, organizationalUnit.name + "." + suffix, organizationalUnit);
    }
  }

  async updateTopTierGroup_withToken(bearerToken, groupBody) { 

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.put(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + groupBody.id, groupBody, {headers: header}).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        console.error("Error while renaming group in keycloak.");
        console.error(error);
        throw error;
      }
    });
  };

  async updateSubTierGroup_withToken(bearerToken, groupBody, parentId) {        

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.post(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + parentId + "/children", groupBody, {headers: header}).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        console.error("Error while renaming group in keycloak.");
        console.error(error);
        throw error;
      }
    });
  };

  async deleteGroup(organizationalUnit){
    try {
      // first get auth token to make admin requests
      var bearerToken = this.authService.Auth.keycloak.token;

      await this.deleteGroup_withToken(bearerToken, organizationalUnit.keycloakId);

      for (let suffix of this.adminRoleSuffixes) {
        await this.deleteRole_withToken(bearerToken, organizationalUnit.name + "." + suffix);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  async deleteGroup_withToken(bearerToken, keycloakId){

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.delete(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + keycloakId, {headers: header}).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        console.error("Error while deleting role from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  getOwnChildGroupsCount(groupId){
    let group = this.availableKeycloakGroups.filter(item => item.id == groupId)[0];

    if(group && group.subGroupCount){
      return group.subGroupCount;
    }
    return 0;
  }

  getOwnChildGroupNames(childOrganizationalUnits){

    if(!childOrganizationalUnits || childOrganizationalUnits.length == 0){
      return "";
    }
    
    let childOrganizationalUnitKeycloakIds = childOrganizationalUnits.map(item => item.keycloakId);

    let associatedKeycloakGroups = this.availableKeycloakGroups.filter(item => childOrganizationalUnitKeycloakIds.includes(item.id) );

    return JSON.stringify(associatedKeycloakGroups.map(item => item.name));
  }

  async getRealmManagementClientId() {
    var bearerToken = this.authService.Auth.keycloak.token;

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients?search=true&clientId=realm-management", {headers: header}).subscribe({
      next: (response:any) => {
        console.log("realm management client id response ");
        console.log(response);
        return response[0].id;       
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async enableFineGrainedPermissionsForGroup(groupId) {
    var bearerToken = this.authService.Auth.keycloak.token;

    let body = {
      "enabled":true
    }

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.put(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + groupId + "/management/permissions", body, {headers: header}).subscribe({
      next: (response:any) => {
        console.log("fine grained permissions enablement response");
        console.log(response);
        return response;   
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async postPolicyForRole(keycloakRole, realmManagementClientId) {
    var bearerToken = this.authService.Auth.keycloak.token;

    let body = {
      "name": "member-of-" + keycloakRole.name,
      "description": "memberOf(" + keycloakRole.name + ")",
      "roles": [
        {
          "id": keycloakRole.id,
          "required": true
        }
      ],
      "logic": "POSITIVE"
      }

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.post(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/policy/role", body, {headers: header}).subscribe({
      next: (response:any) => {
        
        console.log("policy response");
        console.log(response);
        return response;   
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async generateRolePolicies(realmManagementClientId, organizationalUnit){
    // create a policy for each user-creator role of this orga
    let policyArray:any[] = [];

    // individual role policies
    let userSuffixes = this.adminRoleSuffixes.filter(suffix => suffix.includes("user"));
    let userAdminRoles = this.availableKeycloakRoles.filter(role => {
      for (const userSuffix of userSuffixes) {
        if (role.name == organizationalUnit.name + "." + userSuffix){
          return true;
        }
      }
      
      return false;          
    });
    for (let userAdminRole of userAdminRoles) {
      policyArray.push(await this.postPolicyForRole(userAdminRole, realmManagementClientId));
    }

    return policyArray;
  }

  async getSingleParentClientUserRolePolicy(realmManagementClientId, parentOrganizationalUnit){
    // fetch the client-users-creator role policy of the parent org

    var bearerToken = this.authService.Auth.keycloak.token;

    let parentClientUserCreatorPolicyName = parentOrganizationalUnit.name + ".client-users-creator";

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/policy?name=" + parentClientUserCreatorPolicyName, {headers: header}).subscribe({
      next: (response:any) => {
        console.log(response);
        return response[0];  
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async getAllParentClientUserRolePolicies(realmManagementClientId, organizationalUnit, allOrganizationalUnitsMap){
    let parentRolePolicies:any[] = [];

    if (organizationalUnit.parentId){         
      let parentOrganizationalUnit = allOrganizationalUnitsMap.get(organizationalUnit.parentId);
      parentRolePolicies.push(await this.getSingleParentClientUserRolePolicy(realmManagementClientId, parentOrganizationalUnit));

      parentRolePolicies = parentRolePolicies.concat(await this.getAllParentClientUserRolePolicies(realmManagementClientId, parentOrganizationalUnit, allOrganizationalUnitsMap));
    }

    //remove duplicates
    return [... new Set(parentRolePolicies)];
  }

  async putRolePoliciesForKeycloakGroup(realmManagementClientId, fineGrainPermissionResource, groupId, rolePoliciesArray){
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
      let scopeUUID = fineGrainPermissionResource.scopePermissions[scopePermissionName];           
      await this.putRolePolicyForKeycloakGroupResourceScope(realmManagementClientId, fineGrainPermissionResource.resource, scopeUUID, scopePermissionName, groupId, rolePoliciesArray);          
    }
  }

  async getScopeResourceId(realmManagementClientId, scopeUUID){
    // http://keycloak:8080/admin/realms/kommonitor/clients/ab58087d-9911-4a76-9d70-89a422e4f644/authz/resource-server/policy/7e1274c7-6b40-4e53-baad-9009f0633e3c/scopes
    var bearerToken = this.authService.Auth.keycloak.token;

    let header = {
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/policy/" + scopeUUID + "/scopes", {headers: header}).subscribe({
      next: (response:any) => {
        return response[0].id;
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async putRolePolicyForKeycloakGroupResourceScope(realmManagementClientId, fineGrainPermissionResourceUUID, scopeUUID, scopePermissionName, groupId, rolePoliciesArray){
    var bearerToken = this.authService.Auth.keycloak.token;

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
    let policyIds = rolePoliciesArray.map(policy => policy.id); 

    // we must replace permission names including "-" with "." in order to make keycloak internal join true
    // otherwise the policies are not attached to the specific scope 
    let scopeResourceId = await this.getScopeResourceId(realmManagementClientId, scopeUUID); 
    let body = {
      "id": scopeUUID,
      "name": scopePermissionName.replace("-", ".") + ".permission.group." + groupId,
      "type": "scope",
      "logic": "POSITIVE",
      "decisionStrategy": "AFFIRMATIVE", // at least one policy is true
      "resources": [fineGrainPermissionResourceUUID],
      "policies": policyIds,
      "scopes": [scopeResourceId],
      "description": ""
    };

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.put(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/permission/scope/" + scopeUUID, body, {headers: header}).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  };
  
  async setKeycloakPoliciesForKomMonitorOrganization(organizationalUnit, allOrganizationalUnits) {
    // get auth token to make admin requests
    var bearerToken = this.authService.Auth.keycloak.token;

    try {


      // 1. enable fine grain permissions on new group 
      // --> permission resource
      // 2. create policies for new associated group (unit-users-creator and client-users-creator)
      // --> array of policies
      // 3. set policies for new group to enable group and subgroup management for admins with associated roles
      // 4. set same policies for associated user-creator roles for scope map-role

      let realmManagementClientId = await this.getRealmManagementClientId();

      // 1. enable fine grain permissions on new group 
      // --> permission resource
      let fineGrainPermissionResource_group = await this.enableFineGrainedPermissionsForGroup(organizationalUnit.keycloakId);

      // 2. create policies for new associated group (unit-users-creator and client-users-creator)
      // --> array of policies
      let rolePoliciesArray = await this.generateRolePolicies(realmManagementClientId, organizationalUnit);

      rolePoliciesArray = rolePoliciesArray.concat(await this.getAllParentClientUserRolePolicies(realmManagementClientId, organizationalUnit, allOrganizationalUnits));

      // 3. set policies for new group to enable group and subgroup management for admins with associated roles
      await this.putRolePoliciesForKeycloakGroup(realmManagementClientId, fineGrainPermissionResource_group, organizationalUnit.keycloakId, rolePoliciesArray);
    
      // 4. set same policies for associated user-creator roles for scope map-role
      await this.postRolePoliciesForKeycloakUserCreatorRealmRoles(realmManagementClientId, organizationalUnit, rolePoliciesArray);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  async postRolePoliciesForKeycloakUserCreatorRealmRoles(realmManagementClientId, organizationalUnit, rolePoliciesArray){
    
    for (let suffix of this.adminRoleSuffixes) {
      await this.postRolePoliciesForKeycloakUserCreatorRealmRole(realmManagementClientId, organizationalUnit.name + "." + suffix, rolePoliciesArray);
    }
  };

  async postRolePoliciesForKeycloakUserCreatorRealmRole(realmManagementClientId, roleName, rolePoliciesArray){

    let role:any = await this.getRoleByName(roleName);
    
    let fineGrainPermissionResource_role:any = await this.enableFineGrainedPermissionsForRole(role);

    var bearerToken = this.authService.Auth.keycloak.token;

    let policyIds = rolePoliciesArray.map(policy => policy.id); 
    let scopeUUID = fineGrainPermissionResource_role.scopePermissions["map-role"];

    let scopeResourceId = await this.getScopeResourceId(realmManagementClientId, scopeUUID); 

    let body = {
      "id": scopeUUID,
      "name": "map-role.permission." + role.id,
      "type": "scope",
      "logic": "POSITIVE",
      "decisionStrategy": "AFFIRMATIVE", // at least one policy is true
      "resources": [fineGrainPermissionResource_role.resource],
      "policies": policyIds,
      "scopes": [scopeResourceId],
      "description": ""
    };

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.put(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/permission/scope/" + scopeUUID, body, {headers: header}).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  };

  async getRoleByName(roleName){

    var bearerToken = this.authService.Auth.keycloak.token;

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.get(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles/" + roleName, {headers: header}).subscribe({
      next: (response:any) => {
        return response;
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }

  async enableFineGrainedPermissionsForRole(role) {
    var bearerToken = this.authService.Auth.keycloak.token;

    let body = {
      "enabled":true
    }

    let header = {
      'Content-Type': 'application/json',
      'Authorization': "Bearer " + bearerToken // Note the appropriate header
    };

    return await this.httpClient.put(this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles-by-id/" + role.id + "/management/permissions", body, {headers: header}).subscribe({
      next: (response:any) => {
        console.log("fine grained permissions enablement response");
        console.log(response);
        return response;      
      },
      error: error => {
        console.error("Error while fetching roles from keycloak.");
        console.error(error);
        throw error;
      }
    });
  }
}
