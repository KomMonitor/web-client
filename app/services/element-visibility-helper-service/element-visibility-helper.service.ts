import { Injectable, Inject, OnInit } from '@angular/core';
import { AuthService } from 'services/auth-service/auth.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Injectable({
  providedIn: 'root'
})
export class ElementVisibilityHelperService implements OnInit {

  pipedData:any;

  elementVisibility:any = {};

  isAdvancedMode = window.__env.isAdvancedMode;
  showAdvancedModeSwitch = window.__env.showAdvancedModeSwitch;

  advancedModeGroupName = "fakeAdvancedModeGroup"; 
  advancedModeRoleName = "fakeAdvancedModeRole";

  controlsConfig:any;

  public constructor(
    private dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    private configStorageService: ConfigStorageService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
      this.initElementVisibility();
  }

  initElementVisibility() {

    this.dataExchangeService.pipedData.showDiagramExportButtons = true;
    this.dataExchangeService.pipedData.showGeoresourceExportButtons = true;
    this.elementVisibility = {};
    this.configStorageService.controlsConfig.forEach(element => {
        this.elementVisibility[element.id] = this.checkElementVisibility(element.id);
    });
        
    /* this.broadcastService.broadcast("changeIndicatorDate"); */
  }
  
  onChangeIsAdvancedMode() {
    this.initElementVisibility();
    // if any sidebar was previously not displayed we must ensure that it is properly instantiated for current indicator 
    this.broadcastService.broadcast("changeIndicatorDate");
  }

  checkElementVisibility(id) {
    var element = this.configStorageService.controlsConfig.filter(element => element.id === id)[0];
    if (element.roles === undefined || element.roles.length === 0) {
      return true;
    }
    else if (this.isAdvancedMode && element.roles && element.roles.includes(this.advancedModeRoleName)) {
      return true;
    }
    else if (this.authService.Auth.keycloak.authenticated) {
      // admin role user always sees all data and widgets
      if (this.authService.Auth.keycloak.showAdminView) {
        return true;
      }
      var hasAllowedRole = false;
      for (var i = 0; i < element.roles.length; i++) {
        if (this.authService.Auth.keycloak.tokenParsed.realm_access.roles.includes(element.roles[i])) {
          return true;
        }
      }
      // special case for diagram export buttons
      if (!hasAllowedRole && element.id === "diagramExportButtons") {
        this.dataExchangeService.pipedData.showDiagramExportButtons = false;
      }
      // special case for georesource export buttons
      if (!hasAllowedRole && element.id === "georesourceExportButtons") {
        this.dataExchangeService.pipedData.showGeoresourceExportButtons = false;
      }
      return hasAllowedRole;
    }
    else {
      if (!this.dataExchangeService.pipedData.enableKeycloakSecurity) {
        if (element.roles && element.roles.includes(this.advancedModeRoleName)) {
          // special case for diagram export buttons
          if (element.id === "diagramExportButtons") {
            this.dataExchangeService.pipedData.showDiagramExportButtons = false;
          }
          // special case for georesource export buttons
          if (element.id === "georesourceExportButtons") {
            this.dataExchangeService.pipedData.showGeoresourceExportButtons = false;
          }
          return false;
        }
        return true;
      }
      else {
        // special case for diagram export buttons
        if (element.id === "diagramExportButtons") {
          this.dataExchangeService.pipedData.showDiagramExportButtons = false;
        }
        // special case for georesource export buttons
        if (element.id === "georesourceExportButtons") {
          this.dataExchangeService.pipedData.showGeoresourceExportButtons = false;
        }
        return false;
      }
    }
  }
}
