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
    'kommonitorKeycloakHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', '__env',
    async function ($rootScope, $timeout,
      kommonitorDataExchangeService, $http, __env) {

        this.keycloakRoles = [];
        this.targetUrlToKeycloakInstance = "";
        this.realm = "";
        this.clientId = "";

        this.init = async function(){
          await $http.get('keycloak.json').then(function (response) {
            var keycloakConfig = JSON.parse(response.data);
            self.targetUrlToKeycloakInstance = keycloakConfig['auth-server-url'];
            self.realm = keycloakConfig['realm'];
            self.clientId = keycloakConfig['resource'];
          });
        };

      await this.init();
      
      this.fetchRoles = async function(){
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
            kommonitorDataExchangeService.displayMapApplicationError(error);

        });
      };

      this.keycloakRoles = await this.fetchRoles();

    }]);
