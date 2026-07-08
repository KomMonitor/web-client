import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { AdminRoleManagementService, RoleDelegatePutEntry } from '../admin-role-management.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { NotificationService } from '../../../common/notification/notification.service';
import { forkJoin } from 'rxjs';
import {
  AdvancedAccessControlRow,
  buildAdvancedColumnDefs,
  buildAdvancedRoleRowData,
  buildRoleDelegatesPutBody,
  collectSelectedPermissionIds,
  createAdvancedRoleComponents,
} from '../advanced-role-permissions';

@Component({
  selector: 'app-role-edit-group-rights-modal',
  templateUrl: './role-edit-group-rights-modal.component.html',
  styleUrls: ['./role-edit-group-rights-modal.component.scss'],
  imports: [
    FormsModule,
    AgGridAngular,
    StepperComponent,
    ExpandableBoxComponent,
    LoadingOverlayComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleEditGroupRightsModalComponent implements OnInit {
  protected activeModal = inject(NgbActiveModal);
  private accessControlService = inject(AccessControlService);
  private roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private adminRoleManagementService = inject(AdminRoleManagementService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  @Input() currentDataset!: AccessControlMetadata;

  loadingData: boolean = false;
  showErrorAlert: boolean = false;
  errorMessagePart: string | undefined;
  activeDelegatedRolesOnly: boolean = true;

  protected readonly stepper = new WizardStepper([
    { key: 'ownRights', label: 'Eigene Rechte an anderen Gruppen' },
    { key: 'foreignRights', label: 'Rechte anderer Gruppen an gewählter Gruppe' },
  ]);

  // Authority table (step 1, read-only)
  authorityColumnDefs: ColDef[] = [];
  authorityRowData: AdvancedAccessControlRow[] = [];
  authorityDefaultColDef: ColDef = {};
  authorityGridOptions: GridOptions = {};

  // Delegated table (step 2, editable)
  delegatedColumnDefs: ColDef[] = [];
  delegatedRowData: AdvancedAccessControlRow[] = [];
  delegatedDefaultColDef: ColDef = {};
  delegatedGridOptions: GridOptions = {};
  private delegatedGridApi: GridApi | null = null;

  private allDelegatedRowData: AdvancedAccessControlRow[] = [];
  private delegatedRoleIds: string[] = [];

  ngOnInit(): void {
    this.loadingData = true;

    forkJoin({
      authorities: this.adminRoleManagementService.getAuthorityRoles(
        this.currentDataset.organizationalUnitId
      ),
      delegates: this.adminRoleManagementService.getDelegatedRoles(
        this.currentDataset.organizationalUnitId
      ),
    }).subscribe({
      next: ({ authorities, delegates }) => {
        this.buildAuthorityTable(authorities.authorityRoles);
        this.buildDelegatedTable(delegates.roleDelegates);
        this.loadingData = false;
        // Both grids' bound fields were rebuilt in this async callback — mark
        // the OnPush view once instead of converting each field to a signal.
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError('Die Rollendaten konnten nicht geladen werden.');
        this.loadingData = false;
        this.cdr.markForCheck();
      },
    });
  }

  private buildAuthorityTable(
    authorityRoles: Array<{
      organizationalUnitId: string;
      adminRoles: string[];
    }>
  ): void {
    const authorityRoleIds = authorityRoles.map((r) => r.organizationalUnitId);
    const authorityPermissionIds = authorityRoles.flatMap((r) =>
      r.adminRoles.map((role) => `${r.organizationalUnitId}-${role}`)
    );

    const access = this.accessControlService.accessControl.filter((item) =>
      authorityRoleIds.includes(item.organizationalUnitId)
    );

    const rowData = buildAdvancedRoleRowData(access, authorityPermissionIds, true);
    const components = createAdvancedRoleComponents();

    this.authorityColumnDefs = buildAdvancedColumnDefs();
    this.authorityRowData = rowData;
    this.authorityDefaultColDef = {
      ...this.roleManagementHelper.buildRoleManagementDefaultColDef(),
      filter: true,
      floatingFilter: true,
      minWidth: 110,
    };
    const baseOptions = this.roleManagementHelper.buildRoleManagementGridOptionsPublic(components);
    this.authorityGridOptions = {
      ...baseOptions,
      paginationPageSize: 5,
      paginationPageSizeSelector: [5, 10, 25, 50],
      headerHeight: 52,
      rowHeight: 42,
    };
  }

  private buildDelegatedTable(
    roleDelegates: Array<{
      organizationalUnitId: string;
      adminRoles: string[];
    }>
  ): void {
    this.delegatedRoleIds = roleDelegates.map((r) => r.organizationalUnitId);
    const delegatedPermissionIds = roleDelegates.flatMap((r) =>
      r.adminRoles.map((role) => `${r.organizationalUnitId}-${role}`)
    );

    if (this.delegatedRoleIds.length === 0) {
      this.activeDelegatedRolesOnly = false;
    }

    const allAccess = this.accessControlService.accessControl;
    this.allDelegatedRowData = buildAdvancedRoleRowData(allAccess, delegatedPermissionIds, false);

    const components = createAdvancedRoleComponents();
    this.delegatedColumnDefs = buildAdvancedColumnDefs();
    this.delegatedDefaultColDef = {
      ...this.roleManagementHelper.buildRoleManagementDefaultColDef(),
      filter: true,
      floatingFilter: true,
      minWidth: 110,
    };
    const baseOptions = this.roleManagementHelper.buildRoleManagementGridOptionsPublic(components);
    this.delegatedGridOptions = {
      ...baseOptions,
      paginationPageSize: 5,
      paginationPageSizeSelector: [5, 10, 25, 50],
      headerHeight: 52,
      rowHeight: 42,
      onGridReady: (params: GridReadyEvent) => {
        this.delegatedGridApi = params.api;
      },
    };

    this.applyDelegatedFilter();
  }

  onActiveDelegatedRolesOnlyChange(): void {
    this.applyDelegatedFilter();
  }

  private applyDelegatedFilter(): void {
    if (this.delegatedRoleIds.length > 0 && this.activeDelegatedRolesOnly) {
      this.delegatedRowData = this.allDelegatedRowData.filter((row) =>
        this.delegatedRoleIds.includes(row.organizationalUnitId)
      );
    } else {
      this.delegatedRowData = [...this.allDelegatedRowData];
    }
  }

  private buildPutBody(): RoleDelegatePutEntry[] {
    const selectedPermissionIds = collectSelectedPermissionIds(
      this.delegatedGridApi,
      this.delegatedRowData
    );
    return buildRoleDelegatesPutBody(
      selectedPermissionIds,
      (id) => this.accessControlService.getAccessControlById(id) ?? undefined
    );
  }

  updateDelegatedRoles(): void {
    this.loadingData = true;
    this.showErrorAlert = false;

    const putBody = this.buildPutBody();

    this.adminRoleManagementService
      .updateDelegatedRoles(this.currentDataset.organizationalUnitId, putBody)
      .subscribe((result) => {
        if (result.success) {
          this.notificationService.showSuccess(
            `Gruppenrechte für '${this.currentDataset.name}' erfolgreich aktualisiert.`
          );
          this.activeModal.close(true);
        } else {
          this.errorMessagePart = result.errorMessagePart;
          this.showErrorAlert = true;
          this.loadingData = false;
          this.cdr.markForCheck();
        }
      });
  }

  reset(): void {
    this.showErrorAlert = false;
    this.errorMessagePart = undefined;
    this.ngOnInit();
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }
}
