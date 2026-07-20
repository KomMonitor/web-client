import { Injectable, inject } from '@angular/core';
import { AuthService } from 'services/auth-service/auth.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Injectable({
  providedIn: 'root',
})
export class ElementVisibilityHelperService {
  private exportButtonVisibility = inject(ExportButtonVisibilityService);
  private broadcastService = inject(BroadcastService);
  private authService = inject(AuthService);
  private envConfigService = inject(EnvConfigService);

  pipedData: any;

  elementVisibility: any = {};

  isAdvancedMode = this.envConfigService.isAdvancedMode;

  advancedModeGroupName = 'fakeAdvancedModeGroup';
  advancedModeRoleName = 'fakeAdvancedModeRole';

  initElementVisibility() {
    this.exportButtonVisibility.showDiagramExportButtons = true;
    this.exportButtonVisibility.showGeoresourceExportButtons = true;
    this.elementVisibility = {};
    (this.envConfigService.controlsConfig ?? []).forEach((element) => {
      this.elementVisibility[element.id] = this.checkElementVisibility(element.id);
    });

    if (this.authService.isAuthenticated() && this.envConfigService.showFavoriteSelection)
      this.elementVisibility['favSelection'] = true;
    else this.elementVisibility['favSelection'] = false;

    /* this.broadcastService.broadcast(BroadcastMessage.ChangeIndicatorDate); */
  }

  onChangeIsAdvancedMode() {
    this.initElementVisibility();
    // if any sidebar was previously not displayed we must ensure that it is properly instantiated for current indicator
    this.broadcastService.broadcast(BroadcastMessage.ChangeIndicatorDate);
  }

  checkElementVisibility(id) {
    const element = (this.envConfigService.controlsConfig ?? []).filter(
      (element) => element.id === id
    )[0];

    /*
      migration from v3 to v4
      if there are old role entries, we can simply rename them to required groups          
    */
    if (element.roles) {
      element.groups = element.roles;
    }

    const domElement = document.getElementById(id);
    if (domElement && domElement.style) {
      domElement.style.display = 'block';
    }

    if (element.restricted === undefined || element.restricted === false) {
      if (element.groups === undefined || element.groups.length === 0) {
        return true;
      }
      if (
        this.isAdvancedMode &&
        element.groups &&
        element.groups.includes(this.advancedModeGroupName)
      ) {
        return true;
      }

      return false;
    } else {
      // authenticated access control
      if (this.authService.isAuthenticated()) {
        if (element.groups === undefined || element.groups.length === 0) {
          return true;
        }
        if (
          this.isAdvancedMode &&
          element.groups &&
          element.groups.includes(this.advancedModeGroupName)
        ) {
          return true;
        }
        // admin role user always sees all data and widgets
        // role kommonitor-creator still exists
        if (
          this.authService
            .getTokenParsed()
            ?.realm_access?.roles.includes(this.envConfigService.keycloakKomMonitorAdminRoleName)
        ) {
          return true;
        }
        let hasAllowedGroup = false;
        for (const groupName of element.groups) {
          // get groups and compare to each leaf node in group hierarchy.
          // get group name by identifying last '/' from group hierarchy
          const groupNames =
            this.authService
              .getTokenParsed()
              ?.[
                'groups'
              ].map((groupstring) => groupstring.substring(groupstring.lastIndexOf('/') + 1)) ?? [];
          if (groupNames.includes(groupName)) {
            hasAllowedGroup = true;
            return true;
          }
        }

        // special case for diagram export buttons
        if (!hasAllowedGroup && element.id === 'diagramExportButtons') {
          this.exportButtonVisibility.showDiagramExportButtons = false;
        }
        // special case for georesource export buttons
        if (!hasAllowedGroup && element.id === 'georesourceExportButtons') {
          this.exportButtonVisibility.showGeoresourceExportButtons = false;
        }

        if (!hasAllowedGroup) {
          const domElement = document.getElementById(id);
          if (domElement && domElement.style) {
            domElement.style.display = 'none';
          }
          // $("#" + id).remove();
        }

        return hasAllowedGroup;
      } else {
        // special case for diagram export buttons
        if (element.id === 'diagramExportButtons') {
          this.exportButtonVisibility.showDiagramExportButtons = false;
        }
        // special case for georesource export buttons
        if (element.id === 'georesourceExportButtons') {
          this.exportButtonVisibility.showGeoresourceExportButtons = false;
        }

        const domElement = document.getElementById(id);
        if (domElement && domElement.style) {
          domElement.style.display = 'none';
        }
        // $("#" + id).remove();
        return false;
      }
    }
  }
}
