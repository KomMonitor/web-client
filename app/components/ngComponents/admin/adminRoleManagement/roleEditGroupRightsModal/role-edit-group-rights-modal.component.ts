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
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
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
    TranslateModule,
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
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  @Input() currentDataset!: AccessControlMetadata;

  loadingData: boolean = false;
  showErrorAlert: boolean = false;
  errorMessagePart: string | undefined;
  activeDelegatedRolesOnly: boolean = true;

  protected readonly stepper = new WizardStepper([
    { key: 'ownRights', label: 'ADMIN_SHARED_UI.STEP_LABELS.OWN_RIGHTS_OTHER_GROUPS' },
    { key: 'foreignRights', label: 'ADMIN_SHARED_UI.STEP_LABELS.RIGHTS_OF_OTHER_GROUPS_SELECTED' },
  ]);

  /*
   * ag-grid reads `gridOptions` exactly once, when it creates the grid, and
   * silently drops anything assigned afterwards — cell-renderer registrations
   * included. Both grids are therefore configured here, before the first
   * render; the async fetch in ngOnInit only fills in the live `columnDefs` /
   * `rowData` / `defaultColDef` inputs, which ag-grid does keep watching.
   *
   * Step 1's grid used to be created while these were still `{}`, because
   * buildAuthorityTable() runs in a subscribe callback. Its six permission
   * columns rendered empty ("Could not find 'checkboxRenderer_UM_group'
   * component") and its page size fell back to ag-grid's default of 100. Step 2
   * only worked because its grid is not rendered until the step is opened, by
   * which time the callback had run.
   */
  private readonly gridComponents = createAdvancedRoleComponents();

  private readonly baseGridOptions: GridOptions = {
    ...this.roleManagementHelper.buildRoleManagementGridOptionsPublic(this.gridComponents),
    paginationPageSize: 5,
    paginationPageSizeSelector: [5, 10, 25, 50],
    // Applies to all three header rows — ag-grid falls back to headerHeight for
    // the column-group and floating-filter rows, giving 3 x 52px.
    headerHeight: 52,
    // No rowHeight here on purpose: the shared defaultColDef sets
    // `autoHeight: true`, so ag-grid measures each row from its content and
    // ignores rowHeight entirely. Setting it only suggested a fixed height the
    // grid never honours.
  };

  // Authority table (step 1, read-only)
  authorityColumnDefs: ColDef[] = [];
  authorityRowData: AdvancedAccessControlRow[] = [];
  authorityDefaultColDef: ColDef = {};
  authorityGridOptions: GridOptions = { ...this.baseGridOptions };

  // Delegated table (step 2, editable)
  delegatedColumnDefs: ColDef[] = [];
  delegatedRowData: AdvancedAccessControlRow[] = [];
  delegatedDefaultColDef: ColDef = {};
  delegatedGridOptions: GridOptions = {
    ...this.baseGridOptions,
    onGridReady: (params: GridReadyEvent) => {
      this.delegatedGridApi = params.api;
    },
  };
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
        this.notificationService.showError(
          this.translate.instant('ADMIN_ROLES.EDIT_RIGHTS_MODAL.MSG.LOAD_FAILED')
        );
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

    this.authorityColumnDefs = buildAdvancedColumnDefs(this.translate);
    this.authorityRowData = rowData;
    this.authorityDefaultColDef = {
      ...this.roleManagementHelper.buildRoleManagementDefaultColDef(),
      filter: true,
      floatingFilter: true,
      minWidth: 110,
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

    this.delegatedColumnDefs = buildAdvancedColumnDefs(this.translate);
    this.delegatedDefaultColDef = {
      ...this.roleManagementHelper.buildRoleManagementDefaultColDef(),
      filter: true,
      floatingFilter: true,
      minWidth: 110,
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
            this.translate.instant('ADMIN_ROLES.EDIT_RIGHTS_MODAL.MSG.RIGHTS_UPDATED', {
              name: this.currentDataset.name,
            })
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
    // Back to step 1, matching what the add dialog's reset does. Without this
    // the button discarded the pending checkbox edits and refetched, but left
    // the user on step 2 staring at a table that had silently changed under
    // them.
    this.stepper.reset();
    this.ngOnInit();
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }
}
