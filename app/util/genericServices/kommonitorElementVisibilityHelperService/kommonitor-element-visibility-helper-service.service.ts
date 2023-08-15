import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KommonitorElementVisibilityHelperService {
  elementVisibility: any = {};
  isAdvancedMode = window.__env.isAdvancedMode;
  showAdvancedModeSwitch = window.__env.showAdvancedModeSwitch;
  advancedModeRoleName = 'fakeAdvancedModeRole';
  diagramExportButtonsVisible = true;
  georesourceExportButtonsVisible = true;

  constructor(
  ) {
    this.initElementVisibility();
  }

  private checkElementVisibility(id: string): boolean {
    // const element = this.controlsConfigService.getControlsConfig().find((element) => element.id === id);
    const element = window.__env.config.find((element) => element.id === id);

    if (!element.roles || element.roles.length === 0) {
      return true;
    } else if (this.isAdvancedMode && element.roles && element.roles.includes(this.advancedModeRoleName)) {
      return true;
    } else {
      // Implement the logic to check user roles and permissions
      // Replace this with your actual authentication logic
      // Example: return this.authService.hasPermission(element.roles);
      return true; // Temporary value for demonstration purposes
    }
  }

  initElementVisibility(): void {
    this.diagramExportButtonsVisible = true;
    this.georesourceExportButtonsVisible = true;

    window.__env.config.forEach((element) => {
      this.elementVisibility[element.id] = this.checkElementVisibility(element.id);
    });
  }

  onChangeIsAdvancedMode(): void {
    this.initElementVisibility();
    // If any sidebar was previously not displayed, we must ensure that it is properly instantiated for the current indicator
    // Replace this with your actual logic
    // ...
  }
}
