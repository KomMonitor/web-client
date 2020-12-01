angular.module('kommonitorKeycloakHelper', ['kommonitorDataExchange']);

/**
 * a common serviceInstance that holds all needed properties for a WPS service.
 *
 * This service represents a shared object ´which is used across the different
 * application tabs/components like Setup, Capabilities, Execute etc.
 *
 * This way, one single service instance can be used to easily share values and
 * parameters for each WPS operation represented by different Angular components
 */
angular
  .module('kommonitorKeycloakHelper', [])
  .service(
    'kommonitorKeycloakHelperService', ['$rootScope', '$timeout', '$http', '$httpParamSerializerJQLike', '__env',
    function ($rootScope, $timeout,
      $http, $httpParamSerializerJQLike, __env) {

      var self = this;
      this.availableKeycloakRoles = [];
      this.targetUrlToKeycloakInstance = "";
      this.realm = "";
      this.clientId = "";
      this.adminRoleName = "";
      this.adminRolePassword = "";

      this.init = async function () {
        try {
          await $http.get('keycloak.json').then(async function (response) {
            var keycloakConfig = response.data;
            self.targetUrlToKeycloakInstance = keycloakConfig['auth-server-url'];
            self.realm = keycloakConfig['realm'];
            self.clientId = keycloakConfig['resource'];
            self.adminRoleName = keycloakConfig['admin-rolename']; 
            self.adminRolePassword = keycloakConfig["admin-rolepassword"];           

            self.fetchAndSetKeycloakRoles();
          });
        } catch (error) {
          console.error("Error while initializing kommonitorKeycloakHelperService. Error while fetching and interpreting config file. Error is: " + error);
        }
      };

      this.init();

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
          //$scope.error = response.statusText;
          console.error("Error while fetching roles from keycloak.");

        });
      };

      this.requestToken = async function(){
        var parameters = {
          "username": this.adminRoleName,
          "password": this.adminRolePassword,
          "client_id": "admin-cli",
          "grant_type": "password"
        };

        return await $http({
            url: this.targetUrlToKeycloakInstance + "realms/master/protocol/openid-connect/token",
            method: 'POST',
            data: $httpParamSerializerJQLike(parameters), // Make sure to inject the service you choose to the controller
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded' // Note the appropriate header
            }
          }).then(function successCallback(response) {
            /*
            {
                "access_token": "tokenString",
                "expires_in": 60,
                "refresh_expires_in": 1800,
                "refresh_token": "tokenString",
                "token_type": "bearer",
                "not-before-policy": 0,
                "session_state": "5d9d8418-be24-4641-a47c-3309bb243d8d",
                "scope": "email profile"
            }
          */
          return response.data;
  
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while requesting auth bearer token from keycloak.");
            throw error;

        });
      }; 

      this.postNewRole_withToken = async function(bearerToken, roleName){
        var rolesBody = {
          "name": roleName
        };

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles",
          method: 'POST',
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
            //$scope.error = response.statusText;
            console.error("Error while posting role to keycloak.");
            throw error;

        });
      };

      this.renameExistingRole_withToken = async function(bearerToken, oldRoleName, newRoleName){
        var rolesBody = {
          "name": newRoleName
        };

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles/" + oldRoleName,
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
            //$scope.error = response.statusText;
            console.error("Error while posting role to keycloak.");
            throw error;

        });
      };

      this.deleteRole_withToken = async function(bearerToken, roleName){

        return await $http({
          url: this.targetUrlToKeycloakInstance + "admin/realms/" + this.realm + "/roles/" + roleName,
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
            //$scope.error = response.statusText;
            console.error("Error while deleting role from keycloak.");
            throw error;

        });
      };

      this.getAllRoles_withToken = async function(bearerToken){

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
            //$scope.error = response.statusText;
            console.error("Error while deleting role from keycloak.");
            throw error;

        });
      };

      this.postNewRole = async function(roleName){
        try {
            // first get auth token to make admin requests
            var tokenResponse = await this.requestToken();
            var bearerToken = tokenResponse["access_token"];

            // then make admin request
            return await this.postNewRole_withToken(bearerToken, roleName);  
        } catch (error) {
          throw error;
        }
        
      };

      this.renameExistingRole = async function(oldRoleName, newRoleName){
        try {
            // first get auth token to make admin requests
            var tokenResponse = await this.requestToken();
            var bearerToken = tokenResponse["access_token"];

            // then make admin request
            return await this.renameExistingRole_withToken(bearerToken, oldRoleName, newRoleName);  
        } catch (error) {
          throw error;
        }
        
      };

      this.deleteRole = async function(roleName){
        try {
            // first get auth token to make admin requests
            var tokenResponse = await this.requestToken();
            var bearerToken = tokenResponse["access_token"];

            // then make admin request
            return await this.deleteRole_withToken(bearerToken, roleName);  
        } catch (error) {
          throw error;
        }
        
      };

      this.getAllRoles = async function(){
        try {
            // first get auth token to make admin requests
            var tokenResponse = await this.requestToken();
            var bearerToken = tokenResponse["access_token"];

            // then make admin request
            return await this.getAllRoles_withToken(bearerToken);  
        } catch (error) {
          throw error;
        }
        
      };

      this.setAvailableKeycloakRoles = function(roles){
        this.availableKeycloakRoles = roles;
      };

      this.fetchAndSetKeycloakRoles = async function(){
        this.setAvailableKeycloakRoles(await this.getAllRoles());
      };

      this.isRoleInKeycloak = function(roleName){
        for (const keycloakRole of this.availableKeycloakRoles) {
          if(keycloakRole.name === roleName){
            return true;
          }
        }
        return false;
      };

    }]);
