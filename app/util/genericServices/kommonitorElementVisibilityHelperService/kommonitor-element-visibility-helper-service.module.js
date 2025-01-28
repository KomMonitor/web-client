"use strict";
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
    .service('kommonitorElementVisibilityHelperService', ['$rootScope', '$timeout', '$http', '$httpParamSerializerJQLike', '__env',
    'ControlsConfigService', 'Auth', 'kommonitorDataExchangeService', 'kommonitorKeycloakHelperService',
    function ($rootScope, $timeout,
      $http, $httpParamSerializerJQLike, __env, ControlsConfigService, Auth, kommonitorDataExchangeService, kommonitorKeycloakHelperService) {

      var self = this;
      this.elementVisibility = {};

      this.isAdvancedMode = __env.isAdvancedMode;
      this.showAdvancedModeSwitch = __env.showAdvancedModeSwitch;

      this.advancedModeGroupName = "fakeAdvancedModeGroup"; 

      this.initElementVisibility = function () {
        kommonitorDataExchangeService.showDiagramExportButtons = true;
        kommonitorDataExchangeService.showGeoresourceExportButtons = true;

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
            $timeout(function () {
                $rootScope.$apply();
            });
        };
        this.onChangeIsAdvancedMode = function () {
            this.initElementVisibility();
            // if any sidebar was previously not displayed we must ensure that it is properly instantiated for current indicator 
            $rootScope.$broadcast("changeIndicatorDate");
        };
        var checkElementVisibility = function (id) {
            var element = ControlsConfigService.getControlsConfig().filter(element => element.id === id)[0];
            if (element.roles === undefined || element.roles.length === 0) {
                return true;
            }
            else if (self.isAdvancedMode && element.roles && element.roles.includes(self.advancedModeRoleName)) {
                return true;
            }
            else if (Auth.keycloak.authenticated) {
                // admin role user always sees all data and widgets
                if (Auth.keycloak.showAdminView) {
                    return true;
                }
                var hasAllowedRole = false;
                for (var i = 0; i < element.roles.length; i++) {
                    if (Auth.keycloak.tokenParsed.realm_access.roles.includes(element.roles[i])) {
                        return true;
                    }
                }
                // special case for diagram export buttons
                if (!hasAllowedRole && element.id === "diagramExportButtons") {
                    kommonitorDataExchangeService.showDiagramExportButtons = false;
                }
                // special case for georesource export buttons
                if (!hasAllowedRole && element.id === "georesourceExportButtons") {
                    kommonitorDataExchangeService.showGeoresourceExportButtons = false;
                }
                return hasAllowedRole;
            }
            else {
                if (!kommonitorDataExchangeService.enableKeycloakSecurity) {
                    if (element.roles && element.roles.includes(self.advancedModeRoleName)) {
                        // special case for diagram export buttons
                        if (element.id === "diagramExportButtons") {
                            kommonitorDataExchangeService.showDiagramExportButtons = false;
                        }
                        // special case for georesource export buttons
                        if (element.id === "georesourceExportButtons") {
                            kommonitorDataExchangeService.showGeoresourceExportButtons = false;
                        }
                        return false;
                    }
                    return true;
                }
                else {
                    // special case for diagram export buttons
                    if (element.id === "diagramExportButtons") {
                        kommonitorDataExchangeService.showDiagramExportButtons = false;
                    }
                    // special case for georesource export buttons
                    if (element.id === "georesourceExportButtons") {
                        kommonitorDataExchangeService.showGeoresourceExportButtons = false;
                    }
                    return false;
                }
            }
        };
        this.initElementVisibility();

        // if any sidebar was previously not displayed we must ensure that it is properly instantiated for current indicator 
        $rootScope.$broadcast("changeIndicatorDate");
      };

      var checkElementVisibility = function(id) {

        var element = ControlsConfigService.getControlsConfig().filter(element => element.id === id)[0];

        /*
          migration from v3 to v4
          if there are old role entries, we can simply rename them to required groups          
        */
        if (element.roles){
          element.groups = element.roles;
        }

        var domElement = document.getElementById(id);
        if (domElement && domElement.style){
          domElement.style.display = 'block';
        }
        

        if(element.groups === undefined || element.groups.length === 0) {          
          return true;
        }
        if(self.isAdvancedMode && element.groups && element.groups.includes(self.advancedModeGroupName)){
          return true;
        }
        // authenticated access control
        if(Auth.keycloak.authenticated) {
          // admin role user always sees all data and widgets
          // role kommonitor-creator still exists
          if(Auth.keycloak.tokenParsed.realm_access.roles.includes(__env.keycloakKomMonitorAdminRoleName)){
            return true;
          }
          var hasAllowedGroup = false;          
          for (var i = 0; i < element.groups.length; i++) {
            // get groups and compare to each leaf node in group hierarchy.
            // get group name by identifying last '/' from group hierarchy
            let groupNames = Auth.keycloak.tokenParsed.groups.map(groupstring => groupstring.substring(groupstring.lastIndexOf("/") + 1));
            if(groupNames.includes(element.groups[i])){
              hasAllowedGroup = true;
              // return true;
            }	
          }

          // special case for diagram export buttons
          if(! hasAllowedGroup && element.id === "diagramExportButtons"){
            kommonitorDataExchangeService.showDiagramExportButtons = false;
          }
          // special case for georesource export buttons
          if(! hasAllowedGroup && element.id === "georesourceExportButtons"){
            kommonitorDataExchangeService.showGeoresourceExportButtons = false;
          }

          if (! hasAllowedGroup){
            var domElement = document.getElementById(id);
            if (domElement && domElement.style){
              domElement.style.display = 'none';
            }
            // $("#" + id).remove();
          }

          return hasAllowedGroup;
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
//# sourceMappingURL=kommonitor-element-visibility-helper-service.module.js.map