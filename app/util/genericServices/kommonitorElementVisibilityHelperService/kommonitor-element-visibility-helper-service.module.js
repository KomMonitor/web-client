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

      this.isAdvancedMode = __env.isAdvancedMode;
      this.showAdvancedModeSwitch = __env.showAdvancedModeSwitch;

      this.advancedModeRoleName = "fakeAdvancedModeRole"; 

      this.initElementVisibility = function () {
        kommonitorDataExchangeService.showDiagramExportButtons = true;
        kommonitorDataExchangeService.showGeoresourceExportButtons = true;

        this.elementVisibility = {};
        var config = ControlsConfigService.getControlsConfig();
        config.forEach(element => {
          self.elementVisibility[element.id] = checkElementVisibility(element.id);
        });

        
        if(Auth.keycloak.authenticated)
          self.elementVisibility['favSelection'] = true;
        else
          self.elementVisibility['favSelection'] = false;

        $timeout(function(){
          $rootScope.$apply();

        });
        
        
      };

      this.onChangeIsAdvancedMode = function (){

        this.initElementVisibility();

        // if any sidebar was previously not displayed we must ensure that it is properly instantiated for current indicator 
        $rootScope.$broadcast("changeIndicatorDate");
      };

      var checkElementVisibility = function(id) {

        var element = ControlsConfigService.getControlsConfig().filter(element => element.id === id)[0];

        var domElement = document.getElementById(id);
        if (domElement && domElement.style){
          domElement.style.display = 'block';
        }
        

        if(element.roles === undefined || element.roles.length === 0) {          
          return true;
        }
        if(self.isAdvancedMode && element.roles && element.roles.includes(self.advancedModeRoleName)){
          return true;
        }
        // authenticated access control
        if(Auth.keycloak.authenticated) {
          // admin role user always sees all data and widgets
          if(Auth.keycloak.tokenParsed.realm_access.roles.includes(__env.keycloakKomMonitorAdminRoleName)){
            return true;
          }
          var hasAllowedRole = false;          
          for (var i = 0; i < element.roles.length; i++) {
            if(Auth.keycloak.tokenParsed.realm_access.roles.includes(element.roles[i])){
              hasAllowedRole = true;
              // return true;
            }	
          }

          // special case for diagram export buttons
          if(! hasAllowedRole && element.id === "diagramExportButtons"){
            kommonitorDataExchangeService.showDiagramExportButtons = false;
          }
          // special case for georesource export buttons
          if(! hasAllowedRole && element.id === "georesourceExportButtons"){
            kommonitorDataExchangeService.showGeoresourceExportButtons = false;
          }

          if (! hasAllowedRole){
            var domElement = document.getElementById(id);
            if (domElement && domElement.style){
              domElement.style.display = 'none';
            }
            // $("#" + id).remove();
          }

          return hasAllowedRole;
        } else {

            // special case for diagram export buttons
            if(element.id === "diagramExportButtons"){
              kommonitorDataExchangeService.showDiagramExportButtons = false;
            }
            // special case for georesource export buttons
            if(element.id === "georesourceExportButtons"){
              kommonitorDataExchangeService.showGeoresourceExportButtons = false;
            }

            var domElement = document.getElementById(id);
            if (domElement && domElement.style){
              domElement.style.display = 'none';
            }
            // $("#" + id).remove();
            return false;	
        }
      };
      
      this.initElementVisibility();            
  
    }]);
