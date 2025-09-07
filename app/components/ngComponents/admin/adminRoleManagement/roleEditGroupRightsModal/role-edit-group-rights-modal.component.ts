import { Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';

declare const $: any;

@Component({
  selector: 'role-edit-group-rights-modal-new',
  templateUrl: './role-edit-group-rights-modal.component.html',
  styleUrls: ['./role-edit-group-rights-modal.component.css']
})
export class RoleEditGroupRightsModalComponent implements OnInit, OnDestroy {

  loadingData: boolean = false;

  current: any = {};
  access: any[] = [];

  authorityRoleManagementTableOptions: any = undefined;
  delegatedRoleManagementTableOptions: any = undefined;

  authorityRoleIDs: string[] = [];
  authorityAccess: any[] | undefined = undefined;
  authorityPermissions: string[] = [];

  delegatedRoleIDs: string[] = [];
  delegatedAccess: any[] | undefined = undefined;
  delegatedPermissions: string[] = [];
  activeDelegatedRolesOnly: boolean = true;

  successMessagePart: string | undefined = undefined;
  errorMessagePart: string | undefined = undefined;

  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    @Inject('kommonitorMultiStepFormHelperService') private multiStepFormHelper: any,
    @Inject('kommonitorDataGridHelperService') private legacyDataGridHelper: any
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

    try {
      this.multiStepFormHelper?.registerClickHandler('roleEditGroupRightsMultistepForm');
    } catch {}
  }

  onActiveDelegatedRolesOnlyChange(): void {
    this.buildDelegatedRolesTable();
  }

  buildAuthorityRolesTable(): void {
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
      this.authorityRoleManagementTableOptions = this.legacyDataGridHelper.buildAdvancedRoleManagementGrid(
        'editAuthorityGroupRoleManagementTable',
        this.authorityRoleManagementTableOptions,
        this.authorityAccess,
        this.authorityPermissions,
        true
      );
    });
  }

  buildDelegatedRolesTable(): void {
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

      this.delegatedRoleManagementTableOptions = this.legacyDataGridHelper.buildAdvancedRoleManagementGrid(
        'editDelegatedGroupRoleManagementTable',
        this.delegatedRoleManagementTableOptions,
        this.delegatedAccess,
        this.delegatedPermissions
      );
    });
  }

  async editRoleDelegates(): Promise<void> {
    // Recreate json permission structure out of "unitIds-roleName"
    const permissions: Record<string, string[]> = {};
    this.delegatedRoleIDs = [];

    const selected = this.legacyDataGridHelper.getSelectedRoleIds_roleManagementGrid(this.delegatedRoleManagementTableOptions) || [];
    (selected as string[]).forEach((permission: string) => {
      const parts = permission.split('-');
      const unitId = parts.slice(0, 5).join('-');
      const role = parts.slice(5).join('-');

      if (!permissions[unitId]) {
        permissions[unitId] = [];
      }
      if (!permissions[unitId].includes(role)) {
        permissions[unitId].push(role);
        this.delegatedRoleIDs.push(unitId);
      }
    });

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
        this.buildAuthorityRolesTable();
        this.buildDelegatedRolesTable();

        const successEl = document.getElementById('editOuRoleDelegatesSuccessAlert');
        if (successEl) { successEl.hidden = false; }
        setTimeout(() => { this.loadingData = false; }, 0);
      },
      error: (error: any) => {
        if (error && error.error) {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error);
        } else {
          this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        }
        const errorEl = document.getElementById('editRoleDelegatesErrorAlert');
        if (errorEl) { errorEl.hidden = false; }
        this.loadingData = false;
      }
    });
  }

  resetRoleDelegatesForm(): void {
    this.successMessagePart = undefined;
    this.errorMessagePart = undefined;

    this.buildDelegatedRolesTable();

    const successEl = document.getElementById('editOuRoleDelegatesSuccessAlert');
    if (successEl) { successEl.hidden = true; }
    const errorEl = document.getElementById('editRoleDelegatesErrorAlert');
    if (errorEl) { errorEl.hidden = true; }
  }

  hideSuccessAlert(): void {
    const successEl = document.getElementById('editOuRoleDelegatesSuccessAlert');
    if (successEl) { successEl.hidden = true; }
  }

  hideErrorAlert(): void {
    const errorEl = document.getElementById('editRoleDelegatesErrorAlert');
    if (errorEl) { errorEl.hidden = true; }
  }
}
