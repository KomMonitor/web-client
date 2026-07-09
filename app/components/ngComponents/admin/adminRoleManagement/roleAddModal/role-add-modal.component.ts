import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OrganizationalUnitInputType } from 'models/data-management-api';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
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
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleAddModalComponent implements OnInit {
  protected activeModal = inject(NgbActiveModal);
  protected accessControlService = inject(AccessControlService);
  private indicatorValueService = inject(IndicatorValueService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private adminRoleManagementService = inject(AdminRoleManagementService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  // Signal-backed: written from the async create-request callbacks, which would
  // not trigger a re-render of this OnPush component otherwise.
  processCreation = signal(false);
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

  errorMessagePart = signal<string | undefined>(undefined);
  keycloakErrorMessagePart = signal<string | undefined>(undefined);
  showErrorAlert = signal(false);
  showKeycloakErrorAlert = signal(false);

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
  protected accessControlOptions = [...this.accessControlService.accessControl].sort(
    (left, right) => left.name.localeCompare(right.name, 'de')
  );

  ngOnInit(): void {
    this.reset();

    if (this.accessControlService.accessControl.length > 0) {
      this.buildRoleDelegatesTable();
      return;
    }

    this.metadataBootstrap
      .fetchAccessControlMetadata(this.accessControlService.currentKeycloakLoginRoles)
      .then(() => this.buildRoleDelegatesTable());
  }

  get isRealmAdmin(): boolean {
    return this.accessControlService.checkAdminPermission();
  }

  get parentSelected(): boolean {
    return !!this.newOrganizationalUnit.parentId;
  }

  get canSubmit(): boolean {
    if (
      this.processCreation() ||
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
    this.errorMessagePart.set(undefined);
    this.keycloakErrorMessagePart.set(undefined);
    this.showErrorAlert.set(false);
    this.showKeycloakErrorAlert.set(false);
    this.nameInvalid = false;
    this.stepper.reset();

    if (this.accessControlService.accessControl.length > 0) {
      this.buildRoleDelegatesTable();
    }
  }

  checkName(): void {
    this.nameInvalid = this.accessControlService.accessControl.some(
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
      this.accessControlService.getAccessControlById(this.newOrganizationalUnit.parentId) || null
    );
  }

  onRoleDelegatesGridReady(params: GridReadyEvent): void {
    this.roleDelegatesGridApi = params.api;
  }

  private buildRoleDelegatesTable(): void {
    const rowData = buildAdvancedRoleRowData(this.accessControlService.accessControl, []);
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

    // This method bulk-rewrites the grid inputs and also runs from the async
    // access-control fetch, so mark the OnPush view for check once instead of
    // converting each grid field to a signal.
    this.cdr.markForCheck();
  }

  private buildRoleDelegatesPutBody(): RoleDelegatePutEntry[] {
    const selectedPermissionIds = collectSelectedPermissionIds(
      this.roleDelegatesGridApi,
      this.roleDelegatesRowData
    );
    return buildRoleDelegatesPutBody(
      selectedPermissionIds,
      (id) => this.accessControlService.getAccessControlById(id) ?? undefined
    );
  }

  addOrganizationalUnit(): void {
    if (!this.canSubmit) return;

    // canSubmit already ensures these are set; the local check narrows the types
    const { name, contact } = this.newOrganizationalUnit;
    if (!name || !contact) return;

    this.errorMessagePart.set(undefined);
    this.keycloakErrorMessagePart.set(undefined);
    this.processCreation.set(true);

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
          this.processCreation.set(false);
          this.activeModal.close(true);
        },
        error: (error: any) => {
          const payload = error?.error || error;

          // Distinguish HTTP/backend errors from Keycloak/service errors by status presence
          if (error && error.status !== undefined) {
            this.errorMessagePart.set(this.indicatorValueService.syntaxHighlightJSON(payload));
            this.showErrorAlert.set(true);
          } else {
            this.keycloakErrorMessagePart.set(
              this.indicatorValueService.syntaxHighlightJSON(payload)
            );
            if (!this.showErrorAlert()) {
              this.showKeycloakErrorAlert.set(true);
            }
          }

          this.processCreation.set(false);
        },
      });
  }
}
