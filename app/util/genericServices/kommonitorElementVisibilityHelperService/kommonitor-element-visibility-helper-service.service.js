import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
export let KommonitorElementVisibilityHelperService = class KommonitorElementVisibilityHelperService {
    constructor() {
        this.elementVisibility = {};
        this.isAdvancedMode = window.__env.isAdvancedMode;
        this.showAdvancedModeSwitch = window.__env.showAdvancedModeSwitch;
        this.advancedModeRoleName = 'fakeAdvancedModeRole';
        this.diagramExportButtonsVisible = true;
        this.georesourceExportButtonsVisible = true;
        this.initElementVisibility();
    }
    checkElementVisibility(id) {
        // const element = this.controlsConfigService.getControlsConfig().find((element) => element.id === id);
        const element = window.__env.config.find((element) => element.id === id);
        if (!element.roles || element.roles.length === 0) {
            return true;
        }
        else if (this.isAdvancedMode && element.roles && element.roles.includes(this.advancedModeRoleName)) {
            return true;
        }
        else {
            // Implement the logic to check user roles and permissions
            // Replace this with your actual authentication logic
            // Example: return this.authService.hasPermission(element.roles);
            return true; // Temporary value for demonstration purposes
        }
    }
    initElementVisibility() {
        this.diagramExportButtonsVisible = true;
        this.georesourceExportButtonsVisible = true;
        window.__env.config.forEach((element) => {
            this.elementVisibility[element.id] = this.checkElementVisibility(element.id);
        });
    }
    onChangeIsAdvancedMode() {
        this.initElementVisibility();
        // If any sidebar was previously not displayed, we must ensure that it is properly instantiated for the current indicator
        // Replace this with your actual logic
        // ...
    }
};
KommonitorElementVisibilityHelperService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], KommonitorElementVisibilityHelperService);
//# sourceMappingURL=kommonitor-element-visibility-helper-service.service.js.map