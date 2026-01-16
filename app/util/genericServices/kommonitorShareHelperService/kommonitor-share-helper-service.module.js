angular.module('kommonitorShareHelper', ['kommonitorDataExchange']);


angular
  .module('kommonitorShareHelper', [])
  .service(
    'kommonitorShareHelperService', [ 
    '$http', '__env', 'Auth', '$routeParams', '$location', 'kommonitorDataExchangeService',
    function ($http, __env, Auth, $routeParams, $location, kommonitorDataExchangeService) {

      this.baseUrlToKomMonitorDataAPI = __env.apiUrl + __env.basePath;
      let self = this;

      this.queryParamMap = new Map();
      this.currentShareLink = "";

      this.paramName_sharing = "share";
      this.paramName_loginRequired = "login";
      this.paramName_indicatorId = "ind";
      this.paramName_spatialUnitName = "spu";
      this.paramName_zoomLevel = "zoom";
      this.paramName_latitude = "lat";
      this.paramName_longitude = "lon";
      this.paramName_viewMode = "viewMode";
      this.paramName_mapStyle = "mapStyle";
      this.paramName_symbolStyle = "symbolStyle";
      this.paramName_speechOutput = "speechOutput";
      this.paramName_landmarks = "landmarks";

      this.initParamsMap = function(){
        // set map content from params
        this.queryParamMap = new Map();

        for (const key in $routeParams) {
          if (Object.hasOwnProperty.call($routeParams, key) && key != "iss") {
            const value = $routeParams[key];
            this.queryParamMap.set(key, value);
          }
        }
      };

      this.applyQueryParams = function(){
        if ($routeParams[this.paramName_indicatorId]){
          __env.initialIndicatorId = $routeParams[this.paramName_indicatorId];
        }
        if ($routeParams[this.paramName_spatialUnitName]){
          __env.initialSpatialUnitName = $routeParams[this.paramName_spatialUnitName];
        }
        if ($routeParams[this.paramName_latitude]){
          __env.initialLatitude = Number($routeParams[this.paramName_latitude]);
        }
        if ($routeParams[this.paramName_longitude]){
          __env.initialLongitude = Number($routeParams[this.paramName_longitude]);
        }
        if ($routeParams[this.paramName_zoomLevel]){
          __env.initialZoomLevel = Number($routeParams[this.paramName_zoomLevel]);
        }

        if ($routeParams[this.paramName_viewMode]){
          __env.initialViewMode = $routeParams[this.paramName_viewMode];
        }
        if ($routeParams[this.paramName_mapStyle]){
          __env.initialMapStyle = $routeParams[this.paramName_mapStyle];
        }
        if ($routeParams[this.paramName_symbolStyle]){
          __env.initialSymbolStyle = $routeParams[this.paramName_symbolStyle];
        }
        if ($routeParams[this.paramName_speechOutput]){
          __env.initialSpeechOutput = $routeParams[this.paramName_speechOutput];
        }
        if ($routeParams[this.paramName_landmarks]){
          __env.initialLandmarks = $routeParams[this.paramName_landmarks];
        }
      };

      this.init = function(){

        // No need to parse sharing params if sharing is not true
        // if ($routeParams[this.paramName_sharing] && JSON.parse($routeParams[this.paramName_sharing])) {


        // DiKomAll: Always parse params to set initial view mode, map style, symbol style, speech output, landmarks, etc.
          // parse query params
          this.initParamsMap();

          // if login required then route to login page with same link as redirect URL
          if ($routeParams[this.paramName_loginRequired] && JSON.parse($routeParams[this.paramName_loginRequired])){
            // login required
            if(window.__env.enableKeycloakSecurity){
              if (Auth.keycloak.authenticated) {
                // if (Auth.keycloak.showAdminView) {
                //   return true;
                // } else {
                //   return $q.reject('Not Authenticated');
                // }
              }
              else {
                Auth.keycloak.login({
                  redirectUri: this.currentShareLink
                });
              }
            }        
          }
          // set config and data options from params
          this.applyQueryParams();
        // }
      };

      this.generateCurrentShareLink = function(){

        this.currentShareLink = "";

        this.setShareLinkParam_mapExtent();
        this.setShareLinkParam_currentIndicatorId();
        this.setShareLinkParam_currentSpatialUnitName();

        // regerenate the share link from all current parameters
        this.currentShareLink = $location.absUrl();

        if(this.currentShareLink.includes("?")){
          this.currentShareLink = this.currentShareLink.split("?")[0];
        }

        this.currentShareLink += "?";
        this.currentShareLink += this.paramName_sharing + "=true";

        this.queryParamMap.forEach((value, key) => { 
          self.currentShareLink += "&" + key + "=" + value;
          } 
        );

      };

      this.setShareLinkParam = function(paramName, value){
        this.queryParamMap.set(paramName, value);
      };

      this.setShareLinkParam_currentIndicatorId = function(){
        this.setShareLinkParam(this.paramName_indicatorId, kommonitorDataExchangeService.selectedIndicator.indicatorId);

        if(kommonitorDataExchangeService.selectedIndicator.allowedRoles.length > 0){
          this.setShareLinkParam(this.paramName_loginRequired, "true");
        }
        else{
          for (const spatialUnit of kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits) {
            if(spatialUnit.spatialUnitName == kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel){
              if (spatialUnit.allowedRoles.length > 0){
                this.setShareLinkParam(this.paramName_loginRequired, "true");
              }
            }
          }
        }
        
      };

      this.setShareLinkParam_currentSpatialUnitName = function(){
        this.setShareLinkParam(this.paramName_spatialUnitName, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel);
        if(kommonitorDataExchangeService.selectedSpatialUnit.allowedRoles.length > 0){
          this.setShareLinkParam(this.paramName_loginRequired, "true");
        }
      };

      this.setShareLinkParam_mapExtent = function(){
        this.setShareLinkParam(this.paramName_latitude, __env.currentLatitude);
        this.setShareLinkParam(this.paramName_longitude, __env.currentLongitude);
        this.setShareLinkParam(this.paramName_zoomLevel, __env.currentZoomLevel);
        __env.centerMapInitially = false;
      };

    }]);
