import { Injectable, Inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KommonitorRoleKeycloakHelperService {

  constructor(
    @Inject('kommonitorKeycloakHelperService') private angularJsKeycloakHelper: any
  ) {}

  async fetchAndSetKeycloakRoles(): Promise<void> {
    if (this.angularJsKeycloakHelper?.fetchAndSetKeycloakRoles) {
      await this.angularJsKeycloakHelper.fetchAndSetKeycloakRoles();
    }
  }

  async postNewGroup(organizationalUnit: any, parentOrganizationalUnit: any | null): Promise<void> {
    if (this.angularJsKeycloakHelper?.postNewGroup) {
      await this.angularJsKeycloakHelper.postNewGroup(organizationalUnit, parentOrganizationalUnit);
    }
  }

  async renameExistingRoles(oldName: string, newName: string): Promise<void> {
    if (oldName === newName) {
      return;
    }
    if (this.angularJsKeycloakHelper?.renameExistingRoles) {
      await this.angularJsKeycloakHelper.renameExistingRoles(oldName, newName);
    }
  }
}


