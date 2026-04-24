import { Injectable, Inject, OnInit } from '@angular/core';
import { AuthService } from 'services/auth-service/auth.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Injectable({
  providedIn: 'root'
})
export class ElementVisibilityHelperService implements OnInit {

  pipedData:any;

  elementVisibility:any = {};

  private isAdvancedMode = this.envConfigService.isAdvancedMode;

  advancedModeGroupName = "fakeAdvancedModeGroup"; 
  advancedModeRoleName = "fakeAdvancedModeRole";

  controlsConfig:any;

  public constructor(
    private dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    private configStorageService: ConfigStorageService,
    private authService: AuthService,
    private envConfigService: EnvConfigService
  ) {
  }

  ngOnInit(): void {
      this.initElementVisibility();
  }

  initElementVisibility() {
    this.dataExchangeService.showDiagramExportButtons = true;
    this.dataExchangeService.showGeoresourceExportButtons = true;
    this.elementVisibility = {};
    this.configStorageService.controlsConfig.forEach(element => {
        this.elementVisibility[element.id] = this.checkElementVisibility(element.id);
    });

    if(this.authService.isAuthenticated() && this.envConfigService.showFavoriteSelection)
      this.elementVisibility['favSelection'] = true;
    else
      this.elementVisibility['favSelection'] = false;
        
    /* this.broadcastService.broadcast("changeIndicatorDate"); */
  }
  
  onChangeIsAdvancedMode() {
    this.initElementVisibility();
    // if any sidebar was previously not displayed we must ensure that it is properly instantiated for current indicator 
    this.broadcastService.broadcast("changeIndicatorDate");
  }

  checkElementVisibility(id) {
    var element = this.configStorageService.controlsConfig.filter(element => element.id === id)[0];

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
    
    if (element.restricted === undefined || element.restricted === false) {
      if(element.groups === undefined || element.groups.length === 0) {
          return true;
      }
      if(this.isAdvancedMode && element.groups && element.groups.includes(this.advancedModeGroupName)){
        return true;
      }

      return false;
    } else {

      // authenticated access control
      if (this.authService.isAuthenticated()) {
        if (element.groups === undefined || element.groups.length === 0) {
            return true;
        }
        if (this.isAdvancedMode && element.groups && element.groups.includes(this.advancedModeGroupName)) {
          return true;
        }
        // admin role user always sees all data and widgets
        // role kommonitor-creator still exists
        if (this.authService.getTokenParsed()?.realm_access?.roles.includes(this.envConfigService.keycloakKomMonitorAdminRoleName)) {
          return true;
        }
        var hasAllowedGroup = false;          
        for (var i = 0; i < element.groups.length; i++) {
          // get groups and compare to each leaf node in group hierarchy.
          // get group name by identifying last '/' from group hierarchy
          let groupNames = this.authService.getTokenParsed()?.['groups'].map(groupstring => groupstring.substring(groupstring.lastIndexOf("/") + 1)) ?? [];
          if(groupNames.includes(element.groups[i])){
            hasAllowedGroup = true;
            return true;
          }	
        }

        // special case for diagram export buttons
        if(! hasAllowedGroup && element.id === "diagramExportButtons"){
          this.dataExchangeService.showDiagramExportButtons = false;
        }
        // special case for georesource export buttons
        if(! hasAllowedGroup && element.id === "georesourceExportButtons"){
          this.dataExchangeService.showGeoresourceExportButtons = false;
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
            this.dataExchangeService.showDiagramExportButtons = false;
          }
          // special case for georesource export buttons
          if(element.id === "georesourceExportButtons"){
            this.dataExchangeService.showGeoresourceExportButtons = false;
          }

          var domElement = document.getElementById(id);
          if (domElement && domElement.style){
            domElement.style.display = 'none';
          }
          // $("#" + id).remove();
          return false;	
      }
    }
  }
}
