angular.module('kommonitorKeycloakHelper', ['kommonitorDataExchange']);

angular
  .module('kommonitorKeycloakHelper', [])
  .service(
    'kommonitorKeycloakHelperService', ['$rootScope', '$timeout', '$http', '$httpParamSerializerJQLike', 'Auth', '__env',
    function ($rootScope, $timeout, $http, $httpParamSerializerJQLike, Auth, __env) {

      var self = this;
      this.availableKeycloakRoles = [];
      this.targetUrlToKeycloakInstance = "";
      this.realm = "";
      this.clientId = "";

      this.roleSuffixes = ["viewer", "editor", "publisher", "creator"];

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
        } catch (error) {
          console.error("Error while initializing kommonitorKeycloakHelperService. Error while fetching and interpreting config file. Error is: " + error);
        }
      };

      this.configureKeycloakParameters = function (keycloakConfig) {
        self.targetUrlToKeycloakInstance = keycloakConfig['auth-server-url'];
        self.realm = keycloakConfig['realm'];
        self.clientId = keycloakConfig['resource'];
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
          //$scope.error = response.statusText;
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
          //$scope.error = response.statusText;
          console.error("Error while posting role to keycloak.");
          throw error;
        });
      };

      this.renameExistingRole_withToken = async function (bearerToken, oldRoleName, newRoleName) {
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

      this.deleteRole_withToken = async function (bearerToken, roleName) {

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
          //$scope.error = response.statusText;
          console.error("Error while adding role to keycloak.");
          throw error;

        });
      };

      this.addCompositeRole_withToken = async function (bearerToken, baseRole, composite) {
        data = [{
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
          //$scope.error = response.statusText;
          console.error("Error while creating composite role in keycloak.");
          throw error;
        });
      }

      this.postNewRoles = async function (organizationalUnitName) {
        try {
          // get auth token to make admin requests
          var bearerToken = Auth.keycloak.token

          // post individual roles
          for (suffix of this.roleSuffixes) {
            // post individual role
            await this.postNewRole_withToken(bearerToken, { "name": organizationalUnitName + "-" + suffix });
          }
          const allRoles = await this.getAllRoles_withToken(bearerToken)
          var roleMap = allRoles.filter(role => role.name.startsWith(organizationalUnitName + "-"))
            .reduce((prev, curr) => (prev[curr.name] = curr, prev), {});

          // Add composites
          await this.addCompositeRole_withToken(
            bearerToken,
            roleMap[organizationalUnitName + "-editor"],
            roleMap[organizationalUnitName + "-viewer"]
          );
          await this.addCompositeRole_withToken(
            bearerToken,
            roleMap[organizationalUnitName + "-publisher"],
            roleMap[organizationalUnitName + "-editor"]
          );
          await this.addCompositeRole_withToken(
            bearerToken,
            roleMap[organizationalUnitName + "-creator"],
            roleMap[organizationalUnitName + "-publisher"]
          );
        } catch (error) {
          throw error;
        }
      };

      this.renameExistingRoles = async function (oldOrganizationalUnitName, newOrganizationalUnitName) {
        try {
          // first get auth token to make admin requests
          var bearerToken = Auth.keycloak.token

          for (suffix of this.roleSuffixes) {
            await this.renameExistingRole_withToken(bearerToken, oldOrganizationalUnitName + "-" + suffix, newOrganizationalUnitName + "-" + suffix);
          }
        } catch (error) {
          throw error;
        }

      };

      this.deleteRoles = async function (organizationalUnitName) {
        try {
          // first get auth token to make admin requests
          var bearerToken = Auth.keycloak.token

          for (suffix of this.roleSuffixes) {
            await this.deleteRole_withToken(bearerToken, organizationalUnitName + "-" + suffix);
          }
        } catch (error) {
          throw error;
        }
      };

      this.getAllRoles = async function () {
        try {
          // first get auth token to make admin requests
          var bearerToken = Auth.keycloak.token

          // then make admin request
          return await this.getAllRoles_withToken(bearerToken);
        } catch (error) {
          throw error;
        }

      };

      this.setAvailableKeycloakRoles = function (roles) {
        this.availableKeycloakRoles = roles;
      };

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

      var self = this;
      this.init();

    }]);
