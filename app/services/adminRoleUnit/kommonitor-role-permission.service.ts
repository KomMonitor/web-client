import { Injectable } from '@angular/core';
import { KommonitorDataExchangeService } from '../adminSpatialUnit/kommonitor-data-exchange.service';

declare const __env: any;

@Injectable({ providedIn: 'root' })
export class KommonitorRolePermissionService {

  constructor(private core: KommonitorDataExchangeService) {}

  get enableKeycloakSecurity(): boolean {
    return this.core.enableKeycloakSecurity;
  }

  checkGroupCreatePermission(): boolean {
    if (this.core.checkAdminPermission()) {
      return true;
    }
    return this.hasGroupAdminRoles();
  }

  checkGroupsEditPermission(): boolean {
    if (this.core.checkAdminPermission()) {
      return true;
    }
    return this.hasGroupAdminRoles();
  }

  private hasGroupAdminRoles(): boolean {
    const roles = this.core.currentKomMonitorLoginRoleNames || [];
    const suffixes: string[] = (window as any)?.__env?.keycloakKomMonitorGroupsEditRoleNames || [];
    if (!Array.isArray(suffixes) || suffixes.length === 0) {
      return false;
    }
    return roles.some(role => suffixes.some(suffix => role.endsWith('.' + suffix) || role.endsWith(suffix)));
  }
}


