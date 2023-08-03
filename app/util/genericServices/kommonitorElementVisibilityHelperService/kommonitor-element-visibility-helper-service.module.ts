
/**
 * a common serviceInstance that holds all needed properties for a WPS service.
 *
 * This service represents a shared object ´which is used across the different
 * application tabs/components like Setup, Capabilities, Execute etc.
 *
 * This way, one single service instance can be used to easily share values and
 * parameters for each WPS operation represented by different Angular components
 */
// Import required modules and interfaces
import { Injectable } from '@angular/core';
import { ControlsConfigService } from '../kommonitorConfigStorageService/kommonitor-config-storage-service.module';
import { kommonitorDataExchangeService } from '../kommonitorDataExchangeService/kommonitor-data-exchange-service.module'
import { kommonitorKeycloakHelperService } from '../kommonitorKeycloakHelperService/kommonitor-keycloak-helper-service.module'';

// Define the Angular service
@Injectable({
  providedIn: 'root'
})
export class KommonitorElementVisibilityHelperService {
const Auth;
  elementVisibility: { [key: string]: boolean } = {};

  isAdvancedMode = __env.isAdvancedMode;
  showAdvancedModeSwitch = __env.showAdvancedModeSwitch;
  advancedModeRoleName = "fakeAdvancedModeRole";

  constructor(
    private controlsConfigService: ControlsConfigService,
    private auth: Auth,
    private kommonitorDataExchangeService: kommonitorDataExchangeService,
    private kommonitorKeycloakHelperService: kommonitorKeycloakHelperService
  ) {
    this.initElementVisibility();
  }

  initElementVisibility(): void {
    this.kommonitorDataExchangeService.showDiagramExportButtons = true;
    this.kommonitorDataExchangeService.showGeoresourceExportButtons = true;

    this.elementVisibility = {};
    const config = this.controlsConfigService.getControlsConfig();
    config.forEach(element => {
      this.elementVisibility[element.id] = this.checkElementVisibility(element.id);
    });
  }

  onChangeIsAdvancedMode(): void {
    this.initElementVisibility();
    // if any sidebar was previously not displayed we must ensure that it is properly instantiated for the current indicator
    $rootScope.$broadcast("changeIndicatorDate");
  }

  private checkElementVisibility(id: string): boolean {
    const element = this.controlsConfigService.getControlsConfig().filter(element => element.id === id)[0];

    if (element.roles === undefined || element.roles.length === 0) {
      return true;
    } else if (this.isAdvancedMode && element.roles && element.roles.includes(this.advancedModeRoleName)) {
      return true;
    } else if (this.auth.keycloak.authenticated) {
      // admin role user always sees all data and widgets
      if (this.auth.keycloak.showAdminView) {
        return true;
      }
      let hasAllowedRole = false;
      for (const role of element.roles) {
        if (this.auth.keycloak.tokenParsed.realm_access.roles.includes(role)) {
          return true;
        }
      }

      // special case for diagram export buttons
      if (!hasAllowedRole && element.id === "diagramExportButtons") {
        this.kommonitorDataExchangeService.showDiagramExportButtons = false;
      }
      // special case for georesource export buttons
      if (!hasAllowedRole && element.id === "georesourceExportButtons") {
        this.kommonitorDataExchangeService.showGeoresourceExportButtons = false;
      }

      return hasAllowedRole;
    } else {
      if (!this.kommonitorDataExchangeService.enableKeycloakSecurity) {
        if (element.roles && element.roles.includes(this.advancedModeRoleName)) {

          // special case for diagram export buttons
          if (element.id === "diagramExportButtons") {
            this.kommonitorDataExchangeService.showDiagramExportButtons = false;
          }
          // special case for georesource export buttons
          if (element.id === "georesourceExportButtons") {
            this.kommonitorDataExchangeService.showGeoresourceExportButtons = false;
          }

          return false;
        }
        return true;
      } else {
        // special case for diagram export buttons
        if (element.id === "diagramExportButtons") {
          this.kommonitorDataExchangeService.showDiagramExportButtons = false;
        }
        // special case for georesource export buttons
        if (element.id === "georesourceExportButtons") {
          this.kommonitorDataExchangeService.showGeoresourceExportButtons = false;
        }

        return false;
      }
    }
  }
}
