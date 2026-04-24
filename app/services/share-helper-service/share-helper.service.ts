import { Inject, Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'services/auth-service/auth.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { Location } from '@angular/common';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Injectable({
  providedIn: 'root'
})
export class ShareHelperService implements OnInit{

  queryParamMap = new Map();
  currentShareLink = "";

  $routeParams:any[] = [];

  paramName_sharing = "share";
  paramName_loginRequired = "login";
  paramName_indicatorId = "ind";
  paramName_spatialUnitName = "spu";
  paramName_zoomLevel = "zoom";
  paramName_latitude = "lat";
  paramName_longitude = "lon";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private dataExchangeService: DataExchangeService,
    private location: Location,
    private envConfigService: EnvConfigService,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const entries = Array.from(params.keys).map(key => [key, params.get(key)!]);
      this.$routeParams = entries;
    });
  }

  initParamsMap(){
    // set map content from params
    this.queryParamMap = new Map();

    for (const key in this.$routeParams) {
      if (Object.hasOwnProperty.call(this.$routeParams, key) && key != "iss") {
        const value = this.$routeParams[key];
        this.queryParamMap.set(key, value);
      }
    }
  };

  applyQueryParams(){
    if (this.$routeParams[this.paramName_indicatorId]){
      this.envConfigService.initialIndicatorId = this.$routeParams[this.paramName_indicatorId];
    }
    if (this.$routeParams[this.paramName_spatialUnitName]){
      this.envConfigService.initialSpatialUnitName = this.$routeParams[this.paramName_spatialUnitName];
    }
    if (this.$routeParams[this.paramName_latitude]){
      this.envConfigService.initialLatitude = this.$routeParams[this.paramName_latitude];
    }
    if (this.$routeParams[this.paramName_longitude]){
      this.envConfigService.initialLongitude = this.$routeParams[this.paramName_longitude];
    }
    if (this.$routeParams[this.paramName_zoomLevel]){
      this.envConfigService.initialZoomLevel = this.$routeParams[this.paramName_zoomLevel];
    }
  };

  init() {

    // No need to parse sharing params if sharing is not true
    if (this.$routeParams[this.paramName_sharing] && JSON.parse(this.$routeParams[this.paramName_sharing])) {
      // parse query params
      this.initParamsMap();

      // if login required then route to login page with same link as redirect URL
      if (this.$routeParams[this.paramName_loginRequired] && JSON.parse(this.$routeParams[this.paramName_loginRequired])){
        // login required
        if(this.envConfigService.enableKeycloakSecurity){
          if (this.authService.isAuthenticated()) {
            // if (Auth.keycloak.showAdminView) {
            //   return true;
            // } else {
            //   return $q.reject('Not Authenticated');
            // }
          }
          else {
            this.authService.login({
              redirectUri: this.currentShareLink
            });
          }
        }        
      }
      // set config and data options from params
      this.applyQueryParams();
    }
  };

  generateCurrentShareLink(){

    this.currentShareLink = "";

    this.setShareLinkParam_mapExtent();
    this.setShareLinkParam_currentIndicatorId();
    this.setShareLinkParam_currentSpatialUnitName();

    // regerenate the share link from all current parameters
    this.currentShareLink = this.generateFullUrl();

    if(this.currentShareLink.includes("?")){
      this.currentShareLink = this.currentShareLink.split("?")[0];
    }

    this.currentShareLink += "?";
    this.currentShareLink += this.paramName_sharing + "=true";

    this.queryParamMap.forEach((value, key) => { 
      this.currentShareLink += "&" + key + "=" + value;
      } 
    );
  };

  generateFullUrl():string {

    const origin = window.location.origin;    
    const path = this.location.path();         

    return `${origin}/${path}`;
  }

  setShareLinkParam(paramName, value){
    this.queryParamMap.set(paramName, value);
  };

  setShareLinkParam_currentIndicatorId(){
    this.setShareLinkParam(this.paramName_indicatorId, this.dataExchangeService.selectedIndicator.indicatorId);

    if(this.dataExchangeService.selectedIndicator.permissions.length > 0){
      this.setShareLinkParam(this.paramName_loginRequired, "true");
    }
    else{
      for (const spatialUnit of this.dataExchangeService.selectedIndicator.applicableSpatialUnits) {
        if(spatialUnit.spatialUnitName == this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel){
          if (spatialUnit.permissions.length > 0){
            this.setShareLinkParam(this.paramName_loginRequired, "true");
          }
        }
      }
    }
    
  };

  setShareLinkParam_currentSpatialUnitName(){
    this.setShareLinkParam(this.paramName_spatialUnitName, this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel);
    if(this.dataExchangeService.selectedSpatialUnit.permissions.length > 0){
      this.setShareLinkParam(this.paramName_loginRequired, "true");
    }
  };

  setShareLinkParam_mapExtent(){
    this.setShareLinkParam(this.paramName_latitude, this.envConfigService.currentLatitude);
    this.setShareLinkParam(this.paramName_longitude, this.envConfigService.currentLongitude);
    this.setShareLinkParam(this.paramName_zoomLevel, this.envConfigService.currentZoomLevel);
    this.envConfigService.centerMapInitially = false;
  };
}