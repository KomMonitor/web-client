angular.module('kommonitorKeycloakHelper', []);

angular
  .module('kommonitorKeycloakHelper', [])
  .service(
    'kommonitorKeycloakHelperService', ['$rootScope', '$timeout', '$http', '$httpParamSerializerJQLike', 'Auth', '__env',    
    function ($rootScope, $timeout, $http, $httpParamSerializerJQLike, Auth, __env) {

      var self = this;
      this.availableKeycloakRoles = [];
      this.availableKeycloakGroups = [];
      this.availableKeycloakGroupsAndSubgroups = [];
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

          await this.fetchAndSetKeycloakGroups();
          await this.fetchAndSetKeycloakRoles();
        } catch (error) {
          console.error("Error while initializing kommonitorKeycloakHelperService. Error while fetching and interpreting config file. Error is: " + error);
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

      this.addCompositeRole_withToken = async function (bearerToken, baseRole, composite) {
        let data = [{
          "id": composite.id,
          "name": composite.name
        }];
        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles/" + baseRole.name + "/composites",
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
          

          // post individual roles
          for (let suffix of this.adminRoleSuffixes) {
            // post individual role
            await this.postNewRole_withToken(bearerToken, { "name": organizationalUnit.name + "." + suffix });
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

      this.setAvailableKeycloakGroupAndSubgroups = function (groups) {

        let tempGroups = [];

        groups.forEach(parent => {
          tempGroups.push(parent);
          if(parent.subGroups.length>0) {
            parent.subGroups.forEach(child => {
              tempGroups.push(child);
            });
          }
        });

        this.availableKeycloakGroupsAndSubgroups = tempGroups;
      };

      this.fetchAndSetKeycloakGroups = async function (username, password) {
        this.setAvailableKeycloakGroups(await this.getAllGroups(username, password));
        this.setAvailableKeycloakGroupAndSubgroups(await this.getAllGroups(username, password));
      };

      this.isGroupInKeycloak = function (groupName) {
        for (const keycloakGroup of this.availableKeycloakGroups) {
          if (keycloakGroup.name === groupName) {
            return true;
          }
        }
        return false;
      };

      this.getGroupId = function(organizationalUnit){
        for (const keycloakGroup of this.availableKeycloakGroupsAndSubgroups) {
          if (keycloakGroup.name === organizationalUnit.name){
            return keycloakGroup.id;
          } 
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

        if(group && group.subGroups.length>0){
          return group.subGroups.length;
        }
        return 0;
      }

      this.getOwnChildGroupNames = function(childOrganizationalUnits){
        
        if(!childOrganizationalUnits || childOrganizationalUnits.length == 0){
          return "";
        }

        return  JSON.stringify(childOrganizationalUnits.map(item => item.name));
      }

      var self = this;
      this.init();

    }]);
