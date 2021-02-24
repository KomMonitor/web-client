angular.module('kommonitorElementVisibilityHelper', ['kommonitorDataExchange', 'kommonitorKeycloakHelper']);

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
  .module('kommonitorElementVisibilityHelper', [])
  .service(
    'kommonitorElementVisibilityHelperService', ['$rootScope', '$timeout', '$http', '$httpParamSerializerJQLike', '__env', 
    'ControlsConfigService', 'Auth', 'kommonitorDataExchangeService', 'kommonitorKeycloakHelperService',
    function ($rootScope, $timeout,
      $http, $httpParamSerializerJQLike, __env, ControlsConfigService, Auth, kommonitorDataExchangeService, kommonitorKeycloakHelperService) {

      var self = this;
      this.elementVisibility = {};

      this.initElementVisibility = function () {
        this.elementVisibility = {};
        var config = ControlsConfigService.getControlsConfig();
        config.forEach(element => {
          this.elementVisibility[element.id] = checkElementVisibility(element.id);
        });
      };

      var checkElementVisibility = function(id) {

        var element = ControlsConfigService.getControlsConfig().filter(element => element.id === id)[0];
        if(element.roles === undefined || element.roles.length === 0) {
          return true;
        }
        else if(Auth.keycloak.authenticated) {
          // admin role user always sees all data and widgets
          if(kommonitorDataExchangeService.currentKeycloakLoginRoles.includes(kommonitorKeycloakHelperService.adminRoleName)){
            return true;
          }
          var hasAllowedRole = false;
          for (var i = 0; i < element.roles.length; i++) {
            if(Auth.keycloak.tokenParsed.realm_access.roles.includes(element.roles[i])){
              return true;
            }	
          }
          return hasAllowedRole;
        } else {
          if(! kommonitorDataExchangeService.enableKeycloakSecurity){
            return true;
          }
          else{
            return false;
          }				
        }
      };

      this.initElementVisibility();
  
    }]);
