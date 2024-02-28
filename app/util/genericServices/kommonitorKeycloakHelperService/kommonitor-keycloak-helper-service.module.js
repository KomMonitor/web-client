angular.module('kommonitorKeycloakHelper', []);

angular
  .module('kommonitorKeycloakHelper', [])
  .service(
    'kommonitorKeycloakHelperService', ['$rootScope', '$timeout', '$http', '$httpParamSerializerJQLike', 'Auth', '__env',    
    function ($rootScope, $timeout, $http, $httpParamSerializerJQLike, Auth, __env) {

      var self = this;
      this.availableKeycloakRoles = [];
      this.availableKeycloakGroups = [];
      this.targetUrlToKeycloakInstance = "";
      this.targetRealmUrlToKeycloakInstance = "";
      this.realm = "";
      this.clientId = "";

      this.roleSuffixes = ["viewer", "editor", "publisher", "creator"];
      /*
        window.__env.keycloakKomMonitorGroupsEditRoleNames = ["client-users-creator", "unit-users-creator"];
        window.__env.keycloakKomMonitorThemesEditRoleNames = ["client-themes-creator", "unit-themes-creator"];
        window.__env.keycloakKomMonitorGeodataEditRoleNames = ["client-resources-creator", "unit-resources-creator"];
      */
      this.adminRoleSuffixes = __env.keycloakKomMonitorGroupsEditRoleNames.concat(__env.keycloakKomMonitorThemesEditRoleNames).concat(__env.keycloakKomMonitorGeodataEditRoleNames);

      this.init = async function () {
        try {
          if (window.__env.keycloakConfig) {
            this.configureKeycloakParameters(window.__env.keycloakConfig);
          }
          else {
            await $http.get('./config/keycloak_backup.json').then(async function (response) {
              self.configureKeycloakParameters(response.data);
            });
          }

          // await this.fetchAndSetKeycloakGroups();
          await this.fetchAndSetKeycloakRoles();
        } catch (error) {
          console.error("Error while initializing kommonitorKeycloakHelperService. Error while fetching and interpreting config file. Error is: " + error);
          throw error;
        }
      };

      this.configureKeycloakParameters = function (keycloakConfig) {
        // // https://<keycloak.url>/auth/
        self.targetUrlToKeycloakInstance = keycloakConfig['auth-server-url'];
        self.realm = keycloakConfig['realm'];
        self.clientId = keycloakConfig['resource'];

        // https://<keycloak.url>/auth/admin/<realm-name>/console
        self.targetRealmUrlToKeycloakInstance = self.targetUrlToKeycloakInstance + "admin/" + self.realm + "/console";
      };

      this.fetchRoles = async function () {

        console.log = "Fetching roles from Keycloak instance at " + this.targetUrlToKeycloakInstance;
        return await $http({
          url: this.targetUrlToKeycloakInstance + this.realm + "/clients/" + this.clientId + "/roles",
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          return response.data;

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");

        });
      };

      this.postNewRole_withToken = async function (bearerToken, rolesBody) {

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles",
          method: 'POST',
          data: rolesBody,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // return created response location
          return response.data;
        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while posting role to keycloak.");
          console.error(error);
          throw error;
        });
      };

      this.renameExistingRole_withToken = async function (bearerToken, oldRoleName, newRoleName, organizationalUnit) {
        let keycloakRole = this.getKeycloakRoleNyName(oldRoleName);
        var rolesBody = {
          "name": newRoleName,
          "attributes": {
            "kommonitorOrganizationalUnitId": [organizationalUnit.organizationalUnitId]
          }
        };

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles-by-id/" + keycloakRole.id,
          method: 'PUT',
          data: rolesBody,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          return response.data;

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while posting role to keycloak.");
          console.error(error);
          throw error;

        });
      };

      this.deleteRole_withToken = async function (bearerToken, roleName) {

        let keycloakRole = this.getKeycloakRoleNyName(roleName);

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles-by-id/" + keycloakRole.id,
          method: 'DELETE',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          return response.data;

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while deleting role from keycloak.");
          console.error(error);
          throw error;

        });
      };

      this.getAllRoles_withToken = async function (bearerToken) {

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles",
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          return response.data;

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
      };

      this.addCompositeRole_withToken = async function (bearerToken, baseRoleName, composite) {
        let data = [{
          "id": composite.id,
          "name": composite.name
        }];
        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles/" + baseRoleName + "/composites",
          method: 'POST',
          data: data,
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          return response.data;
        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while creating composite role in keycloak.");
          console.error(error);
          throw error;
        });
      }

      this.renameExistingRoles = async function (oldOrganizationalUnitName, newOrganizationalUnitName, organizationalUnit) {
        try {
          // first get auth token to make admin requests
          var bearerToken = Auth.keycloak.token;

          for (let suffix of this.roleSuffixes) {
            await this.renameExistingRole_withToken(bearerToken, oldOrganizationalUnitName + "-" + suffix, newOrganizationalUnitName + "-" + suffix, organizationalUnit);
          }
        } catch (error) {
          console.error(error);
          throw error;
        }

      };

      this.deleteRoles = async function (organizationalUnitName) {
        try {
          // first get auth token to make admin requests
          var bearerToken = Auth.keycloak.token;

          for (let suffix of this.roleSuffixes) {
            await this.deleteRole_withToken(bearerToken, organizationalUnitName + "-" + suffix);
          }
        } catch (error) {
          console.error(error);
          throw error;
        }
      };

      this.getAllRoles = async function () {
        try {
          // first get auth token to make admin requests
          var bearerToken = Auth.keycloak.token;

          // then make admin request
          return await this.getAllRoles_withToken(bearerToken);
        } catch (error) {
          console.error(error);
          throw error;
        }

      };

      this.setAvailableKeycloakRoles = function (roles) {
        this.availableKeycloakRoles = roles;
      };

      this.getKeycloakRoleNyName = function(roleName){
        for (const role of this.availableKeycloakRoles) {
          if (role.name == roleName){
            return role;
          }
        }
      }

      this.fetchAndSetKeycloakRoles = async function (username, password) {
        this.setAvailableKeycloakRoles(await this.getAllRoles(username, password));
      };

      this.isRoleInKeycloak = function (roleName) {
        for (const keycloakRole of this.availableKeycloakRoles) {
          if (keycloakRole.name === roleName) {
            return true;
          }
        }
        return false;
      };

      this.getClientQueryUsersRole = async function(){
        let realmManagementClientId = await this.getRealmManagementClientId();

        var bearerToken = Auth.keycloak.token;

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/roles?search=query-users",
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

         return response.data[0];          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });

      }

      this.getClientQueryGroupsRole = async function(){
        let realmManagementClientId = await this.getRealmManagementClientId();

        var bearerToken = Auth.keycloak.token;

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/roles?search=query-groups",
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

         return response.data[0];          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });

      }

      this.postNewGroup = async function (organizationalUnit, parentOrganizationalUnit) {
        try {
          // get auth token to make admin requests
          var bearerToken = Auth.keycloak.token;

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

      this.postNewTopTierGroup_withToken = async function (bearerToken, groupBody) {

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups",
          method: 'POST',
          data: groupBody,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // return created response location
          return response.data;
        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while posting group to keycloak.");
          console.error(error);
          throw error;
        });
      };

      this.postNewSubTierGroup_withToken = async function (bearerToken, groupBody, parentGroupId) {

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + parentGroupId + "/children",
          method: 'POST',
          data: groupBody,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // return created response location
          return response.data;
        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while posting group to keycloak.");
          console.error(error);
          throw error;
        });
      };

      this.getAllGroups = async function () {
        try {
          // first get auth token to make admin requests
          var bearerToken = Auth.keycloak.token;

          // then make admin request
          return await this.getAllGroups_withToken(bearerToken);
        } catch (error) {
          console.error(error);
          throw error;
        }

      };

      this.getAllGroups_withToken = async function (bearerToken) {

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups?populateHierarchy=true&briefRepresentation=false",
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(async function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          let topTierGroups = response.data;
          return await self.fetchAndAddSubGroups(topTierGroups, bearerToken);

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching groups from keycloak.");
          console.error(error);
          throw error;

        });
      };

      this.fetchAndAddSubGroups = async function(groups, bearerToken){
        // method currently creates duplicate entries
        for (const group of groups) {
          if (group.subGroupCount && group.subGroupCount > 0){
            let subGroups = await self.fetchSubGroups(group, bearerToken);            
                         
            subGroups = subGroups.concat(await this.fetchAndAddSubGroups(subGroups, bearerToken));
            groups = groups.concat(subGroups);
          }
        }

        //remove duplicates
        return [... new Set(groups)];
      }

      this.fetchSubGroups = async function(group, bearerToken){
        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + group.id + "/children?populateHierarchy=true&briefRepresentation=false",
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(async function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          return response.data;          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching sub groups from keycloak.");
          console.error(error);
          throw error;

        });
      }

      this.setAvailableKeycloakGroups = function (groups) {
        this.availableKeycloakGroups = groups;
      };

      this.fetchAndSetKeycloakGroups = async function (username, password) {
        this.setAvailableKeycloakGroups(await this.getAllGroups(username, password));
      };

      this.isGroupInKeycloak = function (groupName) {
        for (const keycloakGroup of this.availableKeycloakGroups) {
          if (keycloakGroup.name === groupName) {
            return true;
          }
        }
        return false;
      };

      this.getGroupDetails_rootGroup = async function(organizationalUnit, bearerToken){
        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/?search=" + organizationalUnit.name,
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          return response.data[0];          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching sub groups from keycloak.");
          console.error(error);
          throw error;

        });
      }

      this.getGroupDetails_subGroup = async function(organizationalUnit, parentOrganizationalUnit, bearerToken){
        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + parentOrganizationalUnit.keycloakId,
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(async function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          // depending on keycloak version
          // the response may have subGroups with all sub group detail (keycloka v 21)
          // or an subGroupCount attribute (keycloak > v23)

          let subgroups;

          if (response.data.subGroupCount && response.data.subGroupCount > 0){
            subgroups = await self.fetchSubGroups(response.data, bearerToken)
          }
          else{
            subgroups = response.data.subGroups;
          } 
          
          for (const subGroup of subgroups) {
            if (subGroup.name == organizationalUnit.name){
              return subGroup;
            }
          }

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching sub groups from keycloak.");
          console.error(error);
          throw error;

        });
      }

      this.getGroupDetails = async function(organizationalUnit, parentOrganizationalUnit){

        var bearerToken = Auth.keycloak.token;

        // differentiate between root tier and sub tier

        if (organizationalUnit.parentId && organizationalUnit.parentId != ""){
          return await this.getGroupDetails_subGroup(organizationalUnit, parentOrganizationalUnit, bearerToken);
        }
        else{
          return await this.getGroupDetails_rootGroup(organizationalUnit, bearerToken);
        }
      }

      this.updateExistingGroup = async function(organizationalUnit, oldName, parentOrganizationalUnit){
        // get auth token to make admin requests
        var bearerToken = Auth.keycloak.token;

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

      this.updateTopTierGroup_withToken = async function (bearerToken, groupBody) {        

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + groupBody.id,
          method: 'PUT',
          data: groupBody,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          return response.data;

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while renaming group in keycloak.");
          console.error(error);
          throw error;

        });
      };

      this.updateSubTierGroup_withToken = async function (bearerToken, groupBody, parentId) {        

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + parentId + "/children",
          method: 'POST',
          data: groupBody,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          return response.data;

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while renaming group in keycloak.");
          console.error(error);
          throw error;

        });
      };

      this.deleteGroup = async function(organizationalUnit){
        try {
          // first get auth token to make admin requests
          var bearerToken = Auth.keycloak.token;

          await this.deleteGroup_withToken(bearerToken, organizationalUnit.keycloakId);

          for (let suffix of this.adminRoleSuffixes) {
            await this.deleteRole_withToken(bearerToken, organizationalUnit.name + "." + suffix);
          }
        } catch (error) {
          console.error(error);
          throw error;
        }
      };

      this.deleteGroup_withToken = async function(bearerToken, keycloakId){
        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + keycloakId,
          method: 'DELETE',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          return response.data;

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while deleting role from keycloak.");
          console.error(error);
          throw error;

        });
      }

      this.getOwnChildGroupsCount = function(groupId){
        let group = this.availableKeycloakGroups.filter(item => item.id == groupId)[0];

        if(group && group.subGroupCount){
          return group.subGroupCount;
        }
        return 0;
      }

      this.getOwnChildGroupNames = function(childOrganizationalUnits){

        if(!childOrganizationalUnits || childOrganizationalUnits.length == 0){
          return "";
        }
        
        let childOrganizationalUnitKeycloakIds = childOrganizationalUnits.map(item => item.keycloakId);

        let associatedKeycloakGroups = this.availableKeycloakGroups.filter(item => childOrganizationalUnitKeycloakIds.includes(item.id) );

        return JSON.stringify(associatedKeycloakGroups.map(item => item.name));
      }

      this.getRealmManagementClientId = async function () {
        var bearerToken = Auth.keycloak.token;

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients?search=true&clientId=realm-management",
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          /*
            [
              {
                  "id": "ab58087d-9911-4a76-9d70-89a422e4f644",
                  "clientId": "realm-management",
                  ...
              }
            ]
          */
         console.log("realm management client id response ");
         console.log(response);
         return response.data[0].id;          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
      }

      this.enableFineGrainedPermissionsForGroup = async function (groupId) {
        var bearerToken = Auth.keycloak.token;

        let body = {
          "enabled":true
        }

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/groups/" + groupId + "/management/permissions",
          method: 'PUT',
          data: body,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

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
         console.log("fine grained permissions enablement response");
         console.log(response);
         return response.data;          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
      }

      this.postPolicyForRole = async function (keycloakRole, realmManagementClientId) {
        var bearerToken = Auth.keycloak.token;

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

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/policy/role",
          method: 'POST',
          data: body,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          /*
            {
              "id": "${policy.uuid}",
              "name": "member-of-<orga_name>.<client-themes-creator>",
              "description": "memberOf(<orga_name>.<client-themes-creator>)",
              "type": "role",
              "logic": "POSITIVE",
              "decisionStrategy": "UNANIMOUS",
              "roles": [
                  {
                      "id": "${role.uuid}",
                      "required": false
                  }
              ]
            }
          */
         console.log("policy response");
         console.log(response);
         return response.data;          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
      }

      this.generateRolePolicies = async function(realmManagementClientId, organizationalUnit){
        // create a policy for each user-creator role of this orga
        let policyArray = [];

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

      this.getSingleParentClientUserRolePolicy = async function(realmManagementClientId, parentOrganizationalUnit){
        // fetch the client-users-creator role policy of the parent org

        var bearerToken = Auth.keycloak.token;

        let parentClientUserCreatorPolicyName = parentOrganizationalUnit.name + ".client-users-creator";

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/policy?name=" + parentClientUserCreatorPolicyName,
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          /*
            [
              {
                  "id": "1fa8c0b6-7378-4fd1-aa51-8cf84b1a9459",
                  "name": "asdf",
                  "description": "asdf",
                  "type": "role",
                  "logic": "POSITIVE",
                  "decisionStrategy": "UNANIMOUS",
                  "config": {
                      "roles": "[{\"id\":\"e7418caa-688b-4ff2-b313-c5e9c8d78ab3\",\"required\":true}]"
                  }
              },
            ]
          */
         console.log(response);
         return response.data[0];          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
      }

      this.getAllParentClientUserRolePolicies = async function(realmManagementClientId, organizationalUnit, allOrganizationalUnitsMap){
        let parentRolePolicies = [];

        if (organizationalUnit.parentId){         
          let parentOrganizationalUnit = allOrganizationalUnitsMap.get(organizationalUnit.parentId);
          parentRolePolicies.push(await this.getSingleParentClientUserRolePolicy(realmManagementClientId, parentOrganizationalUnit));

          parentRolePolicies = parentRolePolicies.concat(await this.getAllParentClientUserRolePolicies(realmManagementClientId, parentOrganizationalUnit, allOrganizationalUnitsMap));
        }

        //remove duplicates
        return [... new Set(parentRolePolicies)];
      }

      this.putRolePoliciesForKeycloakGroup = async function(realmManagementClientId, fineGrainPermissionResource, groupId, rolePoliciesArray){
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

      this.getScopeResourceId = async function(realmManagementClientId, scopeUUID){
        // http://keycloak:8080/admin/realms/kommonitor/clients/ab58087d-9911-4a76-9d70-89a422e4f644/authz/resource-server/policy/7e1274c7-6b40-4e53-baad-9009f0633e3c/scopes
        var bearerToken = Auth.keycloak.token;

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/policy/" + scopeUUID + "/scopes",
          method: 'GET',
          headers: {
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          /*
            [{"id":"941f1a39-3f76-40b3-a941-6811fa19c910","name":"view"}]
          */
         return response.data[0].id;          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
     
      }

      this.putRolePolicyForKeycloakGroupResourceScope = async function(realmManagementClientId, fineGrainPermissionResourceUUID, scopeUUID, scopePermissionName, groupId, rolePoliciesArray){
        var bearerToken = Auth.keycloak.token;

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

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/permission/scope/" + scopeUUID,
          method: 'PUT',
          data: body,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

         return response.data;          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
      };
      
      this.setKeycloakPoliciesForKomMonitorOrganization = async function (organizationalUnit, allOrganizationalUnits) {
        // get auth token to make admin requests
        var bearerToken = Auth.keycloak.token;

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

      this.postRolePoliciesForKeycloakUserCreatorRealmRoles = async function(realmManagementClientId, organizationalUnit, rolePoliciesArray){
        
        for (let suffix of this.adminRoleSuffixes) {
          await this.postRolePoliciesForKeycloakUserCreatorRealmRole(realmManagementClientId, organizationalUnit.name + "." + suffix, rolePoliciesArray);
        }
      };

      this.postRolePoliciesForKeycloakUserCreatorRealmRole = async function(realmManagementClientId, roleName, rolePoliciesArray){

        let role = await this.getRoleByName(roleName);
        
        let fineGrainPermissionResource_role = await this.enableFineGrainedPermissionsForRole(role);

        var bearerToken = Auth.keycloak.token;

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

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/clients/" + realmManagementClientId + "/authz/resource-server/permission/scope/" + scopeUUID,
          method: 'PUT',
          data: body,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

         return response.data;          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
      };

      this.getRoleByName = async function(roleName){

        var bearerToken = Auth.keycloak.token;

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles/" + roleName,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
         return response.data;          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
      }

      this.enableFineGrainedPermissionsForRole = async function (role) {
        var bearerToken = Auth.keycloak.token;

        let body = {
          "enabled":true
        }

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles-by-id/" + role.id + "/management/permissions",
          method: 'PUT',
          data: body,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + bearerToken // Note the appropriate header
          }
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          /*
            {
              "enabled": true,
              "resource": "a9cbcfc7-9ca9-4a6f-9707-464e5979e322",
              "scopePermissions": {
                  "map-role": "4e46a22a-a0ca-4c5d-9445-cf9a8ef4e378",
                  "map-role-client-scope": "1f64f4e7-a599-4a73-997c-ff896c3071a6",
                  "map-role-composite": "1d0cda08-97af-4365-ad73-96eff67b68e5"
              }
            }
          */
         console.log("fine grained permissions enablement response");
         console.log(response);
         return response.data;          

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          
          console.error("Error while fetching roles from keycloak.");
          console.error(error);
          throw error;

        });
      }

      var self = this;
      this.init();

    }]);
