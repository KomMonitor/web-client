import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorRoleDataExchangeService } from 'services/adminRoleUnit/kommonitor-role-data-exchange.service';
import { KommonitorRoleKeycloakHelperService } from 'services/adminRoleUnit/kommonitor-role-keycloak-helper.service';
import { KommonitorRoleDataGridHelperService } from 'services/adminRoleUnit/kommonitor-role-data-grid-helper.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  selector: 'app-role-add-modal',
  templateUrl: './role-add-modal.component.html',
  styleUrls: ['./role-add-modal.component.css']
})
export class RoleAddModalComponent {
  loadingData: boolean = false;
  currentStep: number = 0;

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

  infoExpanded: boolean = false;

  parentOrganizationalUnitFilter: string = '';
  parentOrganizationalUnit: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    private roleDataExchange: KommonitorRoleDataExchangeService,
    private roleKeycloakHelper: KommonitorRoleKeycloakHelperService,
    public roleDataGridHelper: KommonitorRoleDataGridHelperService,
    private broadcastService: BroadcastService
  ) {}

  get accessControlList(): any[] {
    return this.kommonitorDataExchangeService.accessControl || [];
  }

  goToStep(step: number): void {
    if (step < 0) {
      this.currentStep = 0;
      return;
    }
    if (step > 1) {
      this.currentStep = 1;
      return;
    }
    this.currentStep = step;

    // Build grid when entering step 2
    if (this.currentStep === 1) {
      this.buildDelegatedRolesTable();
    }
  }

  nextStep(): void {
    this.goToStep(this.currentStep + 1);
  }

  prevStep(): void {
    this.goToStep(this.currentStep - 1);
  }

  toggleInfo(): void {
    this.infoExpanded = !this.infoExpanded;
  }

  // --- ag-Grid (delegated roles) ---
  delegatedRoleManagementTableOptions: any = undefined;
  delegatedColumnDefs: any[] = [];
  delegatedRowData: any[] = [];
  delegatedDefaultColDef: any = {};
  delegatedGridOptions: any = {};
  access: any[] = [];

  private extendAccessWithAdvancedRoles(access: any[]): any[] {
    const permissionStrings = [
      'unit-users-creator',
      'client-users-creator',
      'unit-resources-creator',
      'client-resources-creator',
      'unit-themes-creator',
      'client-themes-creator'
    ];
    (access || []).forEach((elem: any) => {
      elem.permissions = elem.permissions || [];
      permissionStrings.forEach(role => {
        elem.permissions.push({
          permissionLevel: role,
          permissionId: `${elem.organizationalUnitId}-${role}`
        });
      });
    });
    return access;
  }

  private buildDelegatedRolesTable(): void {
    // Ensure access control is available
    this.access = this.kommonitorDataExchangeService.accessControl || [];
    if (!this.access || this.access.length === 0) {
      this.kommonitorDataExchangeService.fetchAccessControlMetadata().subscribe({
        next: () => {
          this.access = this.kommonitorDataExchangeService.accessControl || [];
          this.access = this.extendAccessWithAdvancedRoles(this.access);
          this.initializeDelegatedGrid();
        },
        error: () => {
          // ignore, grid will stay empty
        }
      });
      return;
    }

    this.access = this.extendAccessWithAdvancedRoles(this.access);
    this.initializeDelegatedGrid();
  }

  private initializeDelegatedGrid(): void {
    this.delegatedRoleManagementTableOptions = this.roleDataGridHelper.buildAdvancedRoleManagementGrid(
      'addRoleEditGroupRoleManagementTable',
      this.delegatedRoleManagementTableOptions,
      this.access,
      []
    );

    if (this.delegatedRoleManagementTableOptions) {
      // Ensure column headers match AngularJS advanced version
      // Columns: Organisationseinheit | Verwalten von Nutzern (Dieser Gruppe | Untergruppen)
      //          | Verwalten von Resourcen (Dieser Gruppe | Untergruppen)
      //          | Verwalten von Themen (Dieser Gruppe | Untergruppen)
      this.delegatedColumnDefs = [
        {
          headerName: 'Organisationseinheit',
          field: 'name',
          minWidth: 200,
        },
        {
          headerName: 'Verwalten von Nutzern',
          field: 'permissions',
          filter: false,
          sortable: false,
          children: [
            {
              headerName: 'Dieser Gruppe',
              field: 'permissions',
              filter: false,
              sortable: false,
              width: 120,
              cellRenderer: 'CheckboxRenderer_UM_group'
            },
            {
              headerName: 'Untergruppen',
              field: 'permissions',
              filter: false,
              sortable: false,
              width: 120,
              cellRenderer: 'CheckboxRenderer_UM_subGroup'
            }
          ]
        },
        {
          headerName: 'Verwalten von Resourcen',
          field: 'permissions',
          filter: false,
          sortable: false,
          children: [
            {
              headerName: 'Dieser Gruppe',
              field: 'permissions',
              filter: false,
              sortable: false,
              width: 120,
              cellRenderer: 'CheckboxRenderer_RM_group'
            },
            {
              headerName: 'Untergruppen',
              field: 'permissions',
              filter: false,
              sortable: false,
              width: 120,
              cellRenderer: 'CheckboxRenderer_RM_subGroup'
            }
          ]
        },
        {
          headerName: 'Verwalten von Themen',
          field: 'permissions',
          filter: false,
          sortable: false,
          children: [
            {
              headerName: 'Dieser Gruppe',
              field: 'permissions',
              filter: false,
              sortable: false,
              width: 120,
              cellRenderer: 'CheckboxRenderer_TM_group'
            },
            {
              headerName: 'Untergruppen',
              field: 'permissions',
              filter: false,
              sortable: false,
              width: 120,
              cellRenderer: 'CheckboxRenderer_TM_subGroup'
            }
          ]
        }
      ];
      this.delegatedRowData = this.delegatedRoleManagementTableOptions.rowData || [];
      // Enable floating filters as in AngularJS version for visual parity
      this.delegatedDefaultColDef = {
        ...this.roleDataGridHelper.buildRoleManagementDefaultColDef(),
        filter: true,
        floatingFilter: true
      };
      const base = this.roleDataGridHelper.buildRoleManagementGridOptionsPublic(this.roleDataGridHelper.getAdvancedRoleManagementGridComponents());
      this.delegatedGridOptions = {
        ...base,
        onGridReady: (params: any) => {
          this.roleDataGridHelper.setGridApi(params.api);
        }
      };
    }
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

        // After creating the OU, build delegated role PUT body from selected checkboxes (advanced grid)
        try {
          const createdOu = created;
          const permissionIdList: string[] = this.roleDataGridHelper.getSelectedRoleIds_roleManagementGrid(this.delegatedRoleManagementTableOptions);

          const unitToRoles: Record<string, string[]> = {};
          for (const id of permissionIdList || []) {
            const parts = (id || '').split('-');
            if (parts.length < 6) { continue; }
            const unitId = parts.slice(0, 5).join('-');
            const role = parts.slice(5).join('-');
            if (!unitToRoles[unitId]) { unitToRoles[unitId] = []; }
            if (!unitToRoles[unitId].includes(role)) { unitToRoles[unitId].push(role); }
          }

          const putBody: any[] = [];
          const access = this.kommonitorDataExchangeService.accessControl || [];
          Object.keys(unitToRoles).forEach(unitId => {
            const orgUnit = access.find((e: any) => e.organizationalUnitId === unitId);
            if (orgUnit) {
              putBody.push({
                organizationalUnitId: unitId,
                organizationalUnitName: orgUnit.name,
                keycloakId: orgUnit.keycloakId,
                adminRoles: unitToRoles[unitId]
              });
            }
          });

          if (createdOu?.organizationalUnitId && putBody.length > 0) {
            await this.http.put(
              `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/organizationalUnits/${createdOu.organizationalUnitId}/role-delegates`,
              putBody
            ).toPromise();
          }
        } catch (e) {
          // non-fatal; continue
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


