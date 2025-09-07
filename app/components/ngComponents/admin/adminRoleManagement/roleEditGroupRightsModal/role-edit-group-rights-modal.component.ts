import { Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorRoleDataExchangeService } from 'services/adminRoleUnit/kommonitor-role-data-exchange.service';
import { KommonitorRoleDataGridHelperService } from 'services/adminRoleUnit/kommonitor-role-data-grid-helper.service';

declare const $: any;

@Component({
  selector: 'role-edit-group-rights-modal-new',
  templateUrl: './role-edit-group-rights-modal.component.html',
  styleUrls: ['./role-edit-group-rights-modal.component.css']
})
export class RoleEditGroupRightsModalComponent implements OnInit, OnDestroy {

  loadingData: boolean = false;
  private pendingLoads: number = 0;

  current: any = {};
  access: any[] = [];

  authorityRoleManagementTableOptions: any = undefined;
  delegatedRoleManagementTableOptions: any = undefined;

  // ag-Grid explicit bindings (mirror working pattern)
  authorityColumnDefs: any[] = [];
  authorityRowData: any[] = [];
  authorityDefaultColDef: any = {};
  authorityGridOptions: any = {};

  delegatedColumnDefs: any[] = [];
  delegatedRowData: any[] = [];
  delegatedDefaultColDef: any = {};
  delegatedGridOptions: any = {};

  authorityRoleIDs: string[] = [];
  authorityAccess: any[] | undefined = undefined;
  authorityPermissions: string[] = [];

  delegatedRoleIDs: string[] = [];
  delegatedAccess: any[] | undefined = undefined;
  delegatedPermissions: string[] = [];
  activeDelegatedRolesOnly: boolean = true;

  successMessagePart: string | undefined = undefined;
  errorMessagePart: string | undefined = undefined;

  authorityInfoExpanded: boolean = false;
  delegatedInfoExpanded: boolean = false;

  currentStep: number = 1;
  totalSteps: number = 2;

  private subscriptions: Subscription[] = [];

  // Advanced checkbox renderers (ported from AngularJS)
  private CheckboxRenderer_UM_group = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className: string | undefined = undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'unit-users-creator') {
            exists = true;
            isChecked = !!permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className || '';
        input.type = 'checkbox';
        input.checked = isChecked;

        // disabled when row disabled or higher-level (client) permission is checked
        input.disabled = !!params.data?.disabled || this.anyHigherChecked('client-users-creator');

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        this.eGui = document.createElement('span');
      }
    }

    private anyHigherChecked(higherLevel: string): boolean {
      if (!this.params?.data?.permissions) return false;
      for (const p of this.params.data.permissions) {
        if (p.permissionLevel === higherLevel) {
          return !!p.isChecked;
        }
      }
      return false;
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-users-creator') {
          permission.isChecked = checked;
          break;
        }
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  private CheckboxRenderer_UM_subGroup = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className: string | undefined = undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'client-users-creator') {
            exists = true;
            isChecked = !!permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className || '';
        input.type = 'checkbox';
        input.checked = isChecked;
        input.disabled = !!params.data?.disabled;

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-users-creator') {
          if (checked) {
            permission.isChecked = true;
          }
        } else if (permission.permissionLevel === 'client-users-creator') {
          permission.isChecked = checked;
        }
      }
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  private CheckboxRenderer_RM_group = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className: string | undefined = undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'unit-resources-creator') {
            exists = true;
            isChecked = !!permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className || '';
        input.type = 'checkbox';
        input.checked = isChecked;
        input.disabled = !!params.data?.disabled || this.anyHigherChecked('client-resources-creator');

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        this.eGui = document.createElement('span');
      }
    }

    private anyHigherChecked(higherLevel: string): boolean {
      if (!this.params?.data?.permissions) return false;
      for (const p of this.params.data.permissions) {
        if (p.permissionLevel === higherLevel) {
          return !!p.isChecked;
        }
      }
      return false;
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-resources-creator') {
          permission.isChecked = checked;
          break;
        }
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  private CheckboxRenderer_RM_subGroup = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className: string | undefined = undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'client-resources-creator') {
            exists = true;
            isChecked = !!permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className || '';
        input.type = 'checkbox';
        input.checked = isChecked;
        input.disabled = !!params.data?.disabled;

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-resources-creator') {
          if (checked) {
            permission.isChecked = true;
          }
        } else if (permission.permissionLevel === 'client-resources-creator') {
          permission.isChecked = checked;
        }
      }
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  private CheckboxRenderer_TM_group = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className: string | undefined = undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'unit-themes-creator') {
            exists = true;
            isChecked = !!permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className || '';
        input.type = 'checkbox';
        input.checked = isChecked;
        input.disabled = !!params.data?.disabled || this.anyHigherChecked('client-themes-creator');

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        this.eGui = document.createElement('span');
      }
    }

    private anyHigherChecked(higherLevel: string): boolean {
      if (!this.params?.data?.permissions) return false;
      for (const p of this.params.data.permissions) {
        if (p.permissionLevel === higherLevel) {
          return !!p.isChecked;
        }
      }
      return false;
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-themes-creator') {
          permission.isChecked = checked;
          break;
        }
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  private CheckboxRenderer_TM_subGroup = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className: string | undefined = undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'client-themes-creator') {
            exists = true;
            isChecked = !!permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className || '';
        input.type = 'checkbox';
        input.checked = isChecked;
        input.disabled = !!params.data?.disabled;

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel === 'unit-themes-creator') {
          if (checked) {
            permission.isChecked = true;
          }
        } else if (permission.permissionLevel === 'client-themes-creator') {
          permission.isChecked = checked;
        }
      }
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorRoleDataExchangeService,
    @Inject('kommonitorMultiStepFormHelperService') private multiStepFormHelper: any,
    public roleDataGridHelper: KommonitorRoleDataGridHelperService
  ) {}

  ngOnInit(): void {
    if (this.current && this.current.organizationalUnitId) {
      // Parent passed data via componentInstance
      this.onEditOrganizationalUnitGroupRights(this.current);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }

  private onEditOrganizationalUnitGroupRights(organizationalUnit: any): void {
    this.current = organizationalUnit || {};
    this.access = this.kommonitorDataExchangeService.accessControl || [];

    // extend permissions with advanced admin roles
    const permissionStrings = [
      'unit-users-creator',
      'client-users-creator',
      'unit-resources-creator',
      'client-resources-creator',
      'unit-themes-creator',
      'client-themes-creator'
    ];

    (this.access || []).forEach((elem: any) => {
      elem.permissions = elem.permissions || [];
      permissionStrings.forEach(role => {
        elem.permissions.push({
          permissionLevel: role,
          permissionId: `${elem.organizationalUnitId}-${role}`
        });
      });
    });

    this.buildAuthorityRolesTable();
    this.buildDelegatedRolesTable();

    // Do not register legacy jQuery multi-step handlers in Angular component
    // to avoid conflicts with Angular's currentStep state.
  }

  onActiveDelegatedRolesOnlyChange(): void {
    this.buildDelegatedRolesTable();
  }

  buildAuthorityRolesTable(): void {
    this.beginLoading();
    this.authorityPermissions = [];
    this.authorityRoleIDs = [];

    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/organizationalUnits/${this.current.organizationalUnitId}/role-authorities`;
    this.http.get<any>(url).subscribe((response) => {
      const roleAuthorities = response?.authorityRoles || [];
      roleAuthorities.forEach((elem: any) => {
        this.authorityRoleIDs.push(elem.organizationalUnitId);
        (elem.adminRoles || []).forEach((role: string) => {
          this.authorityPermissions.push(`${elem.organizationalUnitId}-${role}`);
        });
      });

      this.authorityAccess = (this.access || []).filter(elem => this.authorityRoleIDs.includes(elem.organizationalUnitId));
      this.authorityRoleManagementTableOptions = this.roleDataGridHelper.buildAdvancedRoleManagementGrid(
        'editAuthorityGroupRoleManagementTable',
        this.authorityRoleManagementTableOptions,
        this.authorityAccess,
        this.authorityPermissions,
        true
      );

      if (this.authorityRoleManagementTableOptions) {
        // Use shared advanced components to avoid registration mismatches
        this.authorityRoleManagementTableOptions.components = this.roleDataGridHelper.getAdvancedRoleManagementGridComponents();
        this.authorityColumnDefs = this.buildAdvancedRoleManagementGridColumnConfig();
        // Mark rows disabled to make authority table read-only
        this.authorityRowData = (this.authorityRoleManagementTableOptions.rowData || []).map((row: any) => ({ ...row, disabled: true }));
        this.authorityDefaultColDef = this.roleDataGridHelper.buildRoleManagementDefaultColDef();
        const base = this.roleDataGridHelper.buildRoleManagementGridOptionsPublic(this.authorityRoleManagementTableOptions.components);
        this.authorityGridOptions = {
          ...base,
          overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No rows to show</span>',
          onGridReady: (params: any) => {
            this.roleDataGridHelper.setGridApi(params.api);
          }
        };
      }
      this.endLoading();
    }, (err) => {
      this.endLoading();
    });
  }

  buildDelegatedRolesTable(): void {
    this.beginLoading();
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/organizationalUnits/${this.current.organizationalUnitId}/role-delegates`;
    this.http.get<any>(url).subscribe((response) => {
      this.delegatedRoleIDs = [];
      this.delegatedPermissions = [];

      const roleDelegates = response?.roleDelegates || [];
      roleDelegates.forEach((elem: any) => {
        this.delegatedRoleIDs.push(elem.organizationalUnitId);
        (elem.adminRoles || []).forEach((role: string) => {
          this.delegatedPermissions.push(`${elem.organizationalUnitId}-${role}`);
        });
      });

      if (this.delegatedRoleIDs.length === 0) {
        this.activeDelegatedRolesOnly = false;
      }

      this.delegatedAccess = this.access;
      if (this.delegatedRoleIDs.length > 0 && this.activeDelegatedRolesOnly) {
        this.delegatedAccess = (this.access || []).filter((elem: any) => this.delegatedRoleIDs.includes(elem.organizationalUnitId));
      }

      this.delegatedRoleManagementTableOptions = this.roleDataGridHelper.buildAdvancedRoleManagementGrid(
        'editDelegatedGroupRoleManagementTable',
        this.delegatedRoleManagementTableOptions,
        this.delegatedAccess,
        this.delegatedPermissions
      );

      if (this.delegatedRoleManagementTableOptions) {
        // Use shared advanced components to avoid registration mismatches
        this.delegatedRoleManagementTableOptions.components = this.roleDataGridHelper.getAdvancedRoleManagementGridComponents();
        this.delegatedColumnDefs = this.buildAdvancedRoleManagementGridColumnConfig();
        this.delegatedRowData = this.delegatedRoleManagementTableOptions.rowData || [];
        this.delegatedDefaultColDef = this.roleDataGridHelper.buildRoleManagementDefaultColDef();
        const base = this.roleDataGridHelper.buildRoleManagementGridOptionsPublic(this.delegatedRoleManagementTableOptions.components);
        this.delegatedGridOptions = {
          ...base,
          overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No rows to show</span>',
          onGridReady: (params: any) => {
            this.roleDataGridHelper.setGridApi(params.api);
          }
        };
      }
      this.endLoading();
    }, (err) => {
      this.endLoading();
    });
  }

  private buildAdvancedRoleManagementGridColumnConfig(): any[] {
    const columnDefs: any[] = [];
    columnDefs.push({
      headerName: 'Organisationseinheit',
      field: 'name',
      minWidth: 200,
      cellClassRules: {
        'user-roles-normal': (row: any) => row != undefined
      }
    });
    columnDefs.push({
      headerName: 'Verwalten von Nutzern',
      children: [
        { field: 'Dieser Gruppe', cellRenderer: 'CheckboxRenderer_UM_group' },
        { field: 'Untergruppen', cellRenderer: 'CheckboxRenderer_UM_subGroup' }
      ],
      field: 'permissions',
      filter: false,
      sortable: false,
      maxWidth: 100
    });
    columnDefs.push({
      headerName: 'Verwalten von Resourcen',
      children: [
        { field: 'Dieser Gruppe', cellRenderer: 'CheckboxRenderer_RM_group' },
        { field: 'Untergruppen', cellRenderer: 'CheckboxRenderer_RM_subGroup' }
      ],
      field: 'permissions',
      filter: false,
      sortable: false,
      maxWidth: 100
    });
    columnDefs.push({
      headerName: 'Verwalten von Themen',
      children: [
        { field: 'Dieser Gruppe', cellRenderer: 'CheckboxRenderer_TM_group' },
        { field: 'Untergruppen', cellRenderer: 'CheckboxRenderer_TM_subGroup' }
      ],
      field: 'permissions',
      filter: false,
      sortable: false,
      maxWidth: 100
    });
    return columnDefs;
  }

  async editRoleDelegates(): Promise<void> {
    // Build permissions directly from delegated grid rowData to avoid cross-grid API conflicts
    const permissions: Record<string, string[]> = {};
    this.delegatedRoleIDs = [];

    const rows: any[] = (this.delegatedRoleManagementTableOptions?.rowData || []) as any[];
    for (const row of rows) {
      if (!row?.permissions) continue;
      for (const p of row.permissions) {
        if (!p?.isChecked || !p?.permissionId) continue;
        const parts = (p.permissionId as string).split('-');
        const unitId = parts.slice(0, 5).join('-');
        const role = parts.slice(5).join('-');
        if (!permissions[unitId]) permissions[unitId] = [];
        if (!permissions[unitId].includes(role)) permissions[unitId].push(role);
      }
    }
    this.delegatedRoleIDs = Object.keys(permissions);

    const putBody: any[] = [];
    for (const key of Object.keys(permissions)) {
      const orgUnit = (this.access || []).find(elem => elem.organizationalUnitId === key);
      putBody.push({
        organizationalUnitId: key,
        organizationalUnitName: orgUnit?.name,
        keycloakId: orgUnit?.keycloakId,
        adminRoles: permissions[key]
      });
    }

    this.loadingData = true;
    this.errorMessagePart = undefined;
    this.successMessagePart = undefined;

    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/organizationalUnits/${this.current.organizationalUnitId}/role-delegates`;
    this.http.put(url, putBody).subscribe({
      next: async () => {
        this.successMessagePart = this.current?.name;
        this.errorMessagePart = undefined;
        this.buildAuthorityRolesTable();
        this.buildDelegatedRolesTable();
        setTimeout(() => { this.loadingData = false; }, 0);
      },
      error: (error: any) => {
        if (error && error.error) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error);
        } else {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        }
        this.successMessagePart = undefined;
        this.loadingData = false;
      }
    });
  }

  resetRoleDelegatesForm(): void {
    this.successMessagePart = undefined;
    this.errorMessagePart = undefined;
    this.buildDelegatedRolesTable();
  }

  hideSuccessAlert(): void {
    this.successMessagePart = undefined;
  }

  hideErrorAlert(): void {
    this.errorMessagePart = undefined;
  }

  toggleAuthorityInfo(): void {
    this.authorityInfoExpanded = !this.authorityInfoExpanded;
  }

  toggleDelegatedInfo(): void {
    this.delegatedInfoExpanded = !this.delegatedInfoExpanded;
  }

  nextStep(): void {
    this.goToStep(this.currentStep + 1);
  }

  prevStep(): void {
    this.goToStep(this.currentStep - 1);
  }

  goToStep(step: number): void {
    if (step < 1) {
      this.currentStep = 1;
    } else if (step > this.totalSteps) {
      this.currentStep = this.totalSteps;
    } else {
      this.currentStep = step;
    }

    // Build tables on entering steps, mirroring role-add modal behavior
    if (this.currentStep === 1) {
      // ensure authority grid is ready
      this.buildAuthorityRolesTable();
    } else if (this.currentStep === 2) {
      this.buildDelegatedRolesTable();
    }
  }

  private beginLoading(): void {
    this.pendingLoads++;
    this.loadingData = true;
  }

  private endLoading(): void {
    this.pendingLoads = Math.max(0, this.pendingLoads - 1);
    if (this.pendingLoads === 0) {
      this.loadingData = false;
    }
  }
}
