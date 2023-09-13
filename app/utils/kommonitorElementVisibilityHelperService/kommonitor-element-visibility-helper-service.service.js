import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
export let KommonitorElementVisibilityHelperService = class KommonitorElementVisibilityHelperService {
    constructor(http, controlsConfigService, authService, dataExchangeService, keycloakHelperService) {
        this.http = http;
        this.controlsConfigService = controlsConfigService;
        this.authService = authService;
        this.dataExchangeService = dataExchangeService;
        this.keycloakHelperService = keycloakHelperService;
        this.elementVisibility = {};
        this.isAdvancedMode = false;
        this.showAdvancedModeSwitch = false;
        this.advancedModeRoleName = "fakeAdvancedModeRole";
        this.initElementVisibility();
    }
    initElementVisibility() {
        this.dataExchangeService.showDiagramExportButtonsSubject.next(true);
        this.dataExchangeService.showGeoresourceExportButtonsSubject.next(true);
        this.elementVisibility = {};
        const config = this.controlsConfigService.getControlsConfig();
        config.forEach(element => {
            this.elementVisibility[element.id] = this.checkElementVisibility(element.id);
        });
    }
    onChangeIsAdvancedMode() {
        this.initElementVisibility();
        this.dataExchangeService.changeIndicatorDateSubject.next();
    }
    checkElementVisibility(id) {
        const element = this.controlsConfigService.getControlsConfig().find(element => element.id === id);
        if (!element.roles || element.roles.length === 0) {
            return true;
        }
        else if (this.isAdvancedMode && element.roles && element.roles.includes(this.advancedModeRoleName)) {
            return true;
        }
        else if (this.authService.isAuthenticated()) {
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
        }
        else {
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
            }
            else {
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
};
KommonitorElementVisibilityHelperService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], KommonitorElementVisibilityHelperService);
//# sourceMappingURL=kommonitor-element-visibility-helper-service.service.js.map