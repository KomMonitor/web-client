import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { KommonitorConfigStorageService } from '../kommonitorConfigStorageService/kommonitor-config-storage'
// Update the path to the typescript mannetr
// need to fix this in the typescript manner
import { kommonitorKeycloackHelperService } from 'util/genericServices/kommonitorKeycloakHelperService/kommonitor-keycloak-helper-service.module';
import { kommonitorDataExchangeService } from 'util/genericServices/kommonitorDataExchangeService/kommonitor-data-exchange-service.module';

@Injectable({
  providedIn: 'root'
})
export class KommonitorElementVisibilityHelperService {

  elementVisibility: any = {};
  isAdvancedMode: boolean = false;
  showAdvancedModeSwitch: boolean = false;
  advancedModeRoleName: string = "fakeAdvancedModeRole";

  constructor(
    private http: HttpClient,
    private controlsConfigService: KommonitorConfigStorageService,
    private authService: AuthService,
    private dataExchangeService: KommonitorDataExchangeService,
    private keycloakHelperService: kommonitorKeycloackHelperService
  ) {
    this.initElementVisibility();
  }

  private initElementVisibility(): void {
    this.dataExchangeService.showDiagramExportButtonsSubject.next(true);
    this.dataExchangeService.showGeoresourceExportButtonsSubject.next(true);

    this.elementVisibility = {};
    const config = this.controlsConfigService.getControlsConfig();
    config.forEach(element => {
      this.elementVisibility[element.id] = this.checkElementVisibility(element.id);
    });
  }

  onChangeIsAdvancedMode(): void {
    this.initElementVisibility();
    this.dataExchangeService.changeIndicatorDateSubject.next();
  }

  private checkElementVisibility(id: string): boolean {
    const element = this.controlsConfigService.getControlsConfig().find(element => element.id === id);
    if (!element.roles || element.roles.length === 0) {
      return true;
    } else if (this.isAdvancedMode && element.roles && element.roles.includes(this.advancedModeRoleName)) {
      return true;
    } else if (this.authService.isAuthenticated()) {
      if (this.authService.showAdminView()) {
        return true;
      }
      const hasAllowedRole = element.roles.some(role => this.authService.hasRole(role));

      if (!hasAllowedRole) {
        if (element.id === "diagramExportButtons") {
          this.dataExchangeService.showDiagramExportButtonsSubject.next(false);
        }
        if (element.id === "georesourceExportButtons") {
          this.dataExchangeService.showGeoresourceExportButtonsSubject.next(false);
        }
      }
      return hasAllowedRole;
    } else {
      if (!this.keycloakHelperService.enableKeycloakSecurity) {
        if (element.roles && element.roles.includes(this.advancedModeRoleName)) {
          if (element.id === "diagramExportButtons") {
            this.dataExchangeService.showDiagramExportButtonsSubject.next(false);
          }
          if (element.id === "georesourceExportButtons") {
            this.dataExchangeService.showGeoresourceExportButtonsSubject.next(false);
          }
          return false;
        }
        return true;
      } else {
        if (element.id === "diagramExportButtons") {
          this.dataExchangeService.showDiagramExportButtonsSubject.next(false);
        }
        if (element.id === "georesourceExportButtons") {
          this.dataExchangeService.showGeoresourceExportButtonsSubject.next(false);
        }
        return false;
      }
    }
  }
}
