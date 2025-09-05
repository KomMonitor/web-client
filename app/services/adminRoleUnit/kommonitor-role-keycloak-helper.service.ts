import { Injectable, Inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KommonitorRoleKeycloakHelperService {

  constructor(
    @Inject('kommonitorKeycloackHelperService') private angularJsKeycloakHelper: any
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
}


