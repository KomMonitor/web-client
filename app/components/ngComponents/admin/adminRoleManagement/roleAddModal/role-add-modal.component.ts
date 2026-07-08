import { Component, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OrganizationalUnitInputType } from 'models/data-management-api';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import {
  AccessControlMetadata,
  KommonitorDataExchangeService,
} from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { AdminRoleManagementService } from '../admin-role-management.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { FilterableSelectComponent } from 'components/ngComponents/common/filterableSelect/filterable-select.component';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { NotificationService } from '../../../common/notification/notification.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import {
  AdvancedAccessControlRow,
  buildAdvancedColumnDefs,
  buildAdvancedRoleRowData,
  buildRoleDelegatesPutBody,
  collectSelectedPermissionIds,
  createAdvancedRoleComponents,
} from '../advanced-role-permissions';
import { RoleDelegatePutEntry } from '../admin-role-management.service';

@Component({
  selector: 'app-role-add-modal',
  templateUrl: './role-add-modal.component.html',
  styleUrls: ['./role-add-modal.component.scss'],
  imports: [
    FormsModule,
    StepperComponent,
    AgGridAngular,
    FilterableSelectComponent,
    ExpandableBoxComponent,
    LoadingOverlayComponent,
  ],
  standalone: true,
})
export class RoleAddModalComponent implements OnInit {
  protected activeModal = inject(NgbActiveModal);
  protected kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  private roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private adminRoleManagementService = inject(AdminRoleManagementService);
  private notificationService = inject(NotificationService);

  processCreation: boolean = false;
  nameInvalid: boolean = false;

  roleDelegatesColumnDefs: ColDef[] = [];
  roleDelegatesRowData: AdvancedAccessControlRow[] = [];
  roleDelegatesDefaultColDef: ColDef = {};
  roleDelegatesGridOptions: GridOptions = {};
  roleDelegatesTableOptions: {
    components?: Record<string, unknown>;
    rowData?: AdvancedAccessControlRow[];
    columnDefs?: ColDef[];
  } = {};
  private roleDelegatesGridApi: GridApi | null = null;

  errorMessagePart: string | undefined;
  keycloakErrorMessagePart: string | undefined;
  showErrorAlert: boolean = false;
  showKeycloakErrorAlert: boolean = false;

  newOrganizationalUnit: {
    name?: string;
    description?: string;
    contact?: string;
    mandant?: boolean;
    parentId?: string;
    organizationalUnitId?: string;
  } = {};

  protected readonly stepper = new WizardStepper([
    { key: 'basics', label: 'Basisinformationen' },
    { key: 'rights', label: 'Rechte anderer Gruppen an neuer Gruppe' },
  ]);
  protected accessControlOptions = [...this.kommonitorDataExchangeService.accessControl].sort(
    (left, right) => left.name.localeCompare(right.name, 'de')
  );

  ngOnInit(): void {
    this.reset();

    if (this.kommonitorDataExchangeService.accessControl.length > 0) {
      this.buildRoleDelegatesTable();
      return;
    }

    this.kommonitorDataExchangeService.fetchAccessControlMetadata(true).subscribe({
      next: () => this.buildRoleDelegatesTable(),
    });
  }

  get isRealmAdmin(): boolean {
    return this.kommonitorDataExchangeService.checkAdminPermission();
  }

  get parentSelected(): boolean {
    return !!this.newOrganizationalUnit.parentId;
  }

  get canSubmit(): boolean {
    if (
      this.processCreation ||
      this.nameInvalid ||
      !this.isRealmAdmin ||
      !this.newOrganizationalUnit.name ||
      !this.newOrganizationalUnit.description ||
      !this.newOrganizationalUnit.contact
    ) {
      return false;
    }

    if (
      this.newOrganizationalUnit.mandant === true ||
      this.newOrganizationalUnit.parentId !== undefined
    ) {
      return true;
    }
    return false;
  }

  reset(): void {
    this.newOrganizationalUnit = { mandant: false, parentId: undefined };
    this.errorMessagePart = undefined;
    this.keycloakErrorMessagePart = undefined;
    this.showErrorAlert = false;
    this.showKeycloakErrorAlert = false;
    this.nameInvalid = false;
    this.stepper.reset();

    if (this.kommonitorDataExchangeService.accessControl.length > 0) {
      this.buildRoleDelegatesTable();
    }
  }

  checkName(): void {
    this.nameInvalid = this.kommonitorDataExchangeService.accessControl.some(
      (ou) => ou.name === this.newOrganizationalUnit.name
    );
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  onMandantChange(): void {
    if (this.newOrganizationalUnit.mandant) {
      this.newOrganizationalUnit.parentId = undefined;
    }
  }

  onParentOrganizationalUnitChange(parent: AccessControlMetadata): void {
    this.newOrganizationalUnit.parentId = parent.organizationalUnitId || undefined;

    if (this.newOrganizationalUnit.parentId) {
      this.newOrganizationalUnit.mandant = false;
    }
  }

  getParentOrganizationalUnit(): AccessControlMetadata | null {
    if (!this.newOrganizationalUnit.parentId) {
      return null;
    }

    return (
      this.kommonitorDataExchangeService.getAccessControlById(
        this.newOrganizationalUnit.parentId
      ) || null
    );
  }

  onRoleDelegatesGridReady(params: GridReadyEvent): void {
    this.roleDelegatesGridApi = params.api;
  }

  private buildRoleDelegatesTable(): void {
    const rowData = buildAdvancedRoleRowData(this.kommonitorDataExchangeService.accessControl, []);
    const components = createAdvancedRoleComponents();

    this.roleDelegatesColumnDefs = buildAdvancedColumnDefs();
    this.roleDelegatesRowData = rowData;
    this.roleDelegatesDefaultColDef = {
      ...this.roleManagementHelper.buildRoleManagementDefaultColDef(),
      filter: true,
      floatingFilter: true,
      minWidth: 110,
    };
    this.roleDelegatesTableOptions = {
      components,
      rowData,
      columnDefs: this.roleDelegatesColumnDefs,
    };

    const baseGridOptions =
      this.roleManagementHelper.buildRoleManagementGridOptionsPublic(components);

    this.roleDelegatesGridOptions = {
      ...baseGridOptions,
      paginationPageSize: 5,
      paginationPageSizeSelector: [5, 10, 25, 50],
      headerHeight: 52,
      rowHeight: 42,
      onGridReady: (params) => this.onRoleDelegatesGridReady(params),
    };
  }

  private buildRoleDelegatesPutBody(): RoleDelegatePutEntry[] {
    const selectedPermissionIds = collectSelectedPermissionIds(
      this.roleDelegatesGridApi,
      this.roleDelegatesRowData
    );
    return buildRoleDelegatesPutBody(selectedPermissionIds, (id) =>
      this.kommonitorDataExchangeService.getAccessControlById(id)
    );
  }

  addOrganizationalUnit(): void {
    if (!this.canSubmit) return;

    // canSubmit already ensures these are set; the local check narrows the types
    const { name, contact } = this.newOrganizationalUnit;
    if (!name || !contact) return;

    this.errorMessagePart = undefined;
    this.keycloakErrorMessagePart = undefined;
    this.processCreation = true;

    const postBody: OrganizationalUnitInputType = {
      name,
      description: this.newOrganizationalUnit.description,
      contact,
      mandant: !!this.newOrganizationalUnit.mandant,
      parentId: this.newOrganizationalUnit.parentId,
    };

    const parentOrganizationalUnit = this.getParentOrganizationalUnit();

    const roleDelegatesPutBody = this.buildRoleDelegatesPutBody();

    this.adminRoleManagementService
      .addOrganizationalUnit(postBody, parentOrganizationalUnit, roleDelegatesPutBody)
      .subscribe({
        next: () => {
          this.notificationService.showSuccess(
            `Die neue Organisationseinheit '${this.newOrganizationalUnit.name}' wurde erfolgreich erstellt..`
          );
          this.notificationService.showSuccess('Keycloak-Rollen erfolgreich angelegt.');
          this.processCreation = false;
          this.activeModal.close(true);
        },
        error: (error: any) => {
          const payload = error?.error || error;

          // Distinguish HTTP/backend errors from Keycloak/service errors by status presence
          if (error && error.status !== undefined) {
            this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(payload);
            this.showErrorAlert = true;
          } else {
            this.keycloakErrorMessagePart =
              this.kommonitorDataExchangeService.syntaxHighlightJSON(payload);
            if (!this.showErrorAlert) {
              this.showKeycloakErrorAlert = true;
            }
          }

          this.processCreation = false;
        },
      });
  }
}
