import { Component, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorRoleDataExchangeService } from 'services/adminRoleUnit/kommonitor-role-data-exchange.service';
import { KommonitorRoleKeycloakHelperService } from 'services/adminRoleUnit/kommonitor-role-keycloak-helper.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  selector: 'app-role-add-modal',
  templateUrl: './role-add-modal.component.html',
  styleUrls: ['./role-add-modal.component.css']
})
export class RoleAddModalComponent {
  loadingData: boolean = false;

  newOrganizationalUnit: any = {
    name: '',
    description: '',
    contact: '',
    mandant: false,
    parentId: ''
  };

  nameInvalid: boolean = false;
  errorMessagePart: string | undefined = undefined;
  keycloakErrorMessagePart: string | undefined = undefined;

  parentOrganizationalUnitFilter: string = '';
  parentOrganizationalUnit: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    private roleDataExchange: KommonitorRoleDataExchangeService,
    private roleKeycloakHelper: KommonitorRoleKeycloakHelperService,
    private broadcastService: BroadcastService,
    @Inject('kommonitorKeycloackHelperService') private kommonitorKeycloakHelperService: any
  ) {}

  get accessControlList(): any[] {
    return this.kommonitorDataExchangeService.accessControl || [];
  }

  onChangeParentOrganizationalUnit(ou: any): void {
    this.parentOrganizationalUnit = ou;
    this.newOrganizationalUnit.parentId = ou ? ou.organizationalUnitId : '';
  }

  checkRoleName(): void {
    const accessControl = this.kommonitorDataExchangeService.accessControl || [];
    this.nameInvalid = !!accessControl.some(ou => ou.name === this.newOrganizationalUnit.name);
  }

  resetRoleAddForm(): void {
    this.newOrganizationalUnit = {
      name: '',
      description: '',
      contact: '',
      mandant: false,
      parentId: ''
    };
    this.parentOrganizationalUnit = null;
    this.errorMessagePart = undefined;
    this.keycloakErrorMessagePart = undefined;
    this.checkRoleName();
  }

  async addRole(): Promise<void> {
    this.errorMessagePart = undefined;
    this.keycloakErrorMessagePart = undefined;

    try {
      const postBody: any = {
        name: this.newOrganizationalUnit.name,
        description: this.newOrganizationalUnit.description,
        contact: this.newOrganizationalUnit.contact
      };

      this.loadingData = true;

      const response: any = await this.roleDataExchange.createOrganizationalUnit(postBody).toPromise();

      try {
        await this.kommonitorDataExchangeService.fetchAccessControlMetadata().toPromise();
        const created = (this.kommonitorDataExchangeService.accessControl || []).find(e => e.name === this.newOrganizationalUnit.name);

        // Attempt to create Keycloak group and associated roles (best-effort)
        try {
          const parent = this.parentOrganizationalUnit || null;
          const organizationalUnitForKeycloak = {
            ...created,
            mandant: !!this.newOrganizationalUnit.mandant
          };
          await this.roleKeycloakHelper.postNewGroup(organizationalUnitForKeycloak, parent);
          await this.roleKeycloakHelper.fetchAndSetKeycloakRoles();
        } catch (kcError: any) {
          this.keycloakErrorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(kcError?.data || kcError);
        }

        // Broadcast refresh to overview table
        this.broadcastService.broadcast('refreshAccessControlTable', { crudType: 'add', targetId: created?.organizationalUnitId });
      } catch (refreshError) {
        // ignore
      }

      this.loadingData = false;
      this.activeModal.close('success');
    } catch (error: any) {
      if (error && error.error) {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error);
      } else {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
      this.loadingData = false;
    }
  }

  canSubmit(): boolean {
    const hasBasics = !!this.newOrganizationalUnit.name && !!this.newOrganizationalUnit.description && !!this.newOrganizationalUnit.contact;
    const parentOk = this.newOrganizationalUnit.mandant ? !this.newOrganizationalUnit.parentId : true;
    return hasBasics && parentOk && !this.nameInvalid;
  }
}


