import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
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

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-role-add-modal',
  templateUrl: './role-add-modal.component.html',
  styleUrls: ['./role-add-modal.component.scss'],
  imports: [
    ReactiveFormsModule,
    FormErrorComponent,
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
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  // Signal-backed: written from the async create-request callbacks, which would
  // not trigger a re-render of this OnPush component otherwise.
  processCreation = signal(false);

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

  /**
   * The four editable fields. `parentId` is not an input — it is set from the
   * parent-organization picker — so it stays a plain field and is merged into
   * `newOrganizationalUnit` for the payload.
   */
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        uniqueNameValidator(
          () => (this.accessControlService.accessControl ?? []).map((ou) => ou.name),
          { caseSensitive: true }
        ),
      ],
    }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contact: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    mandant: new FormControl(false, { nonNullable: true }),
  });

  parentId?: string;

  get nameInvalid(): boolean {
    return this.form.controls.name.hasError('uniqueName');
  }

  /** Assembled view of the edited unit, as the service and the payload expect it. */
  get newOrganizationalUnit(): {
    name?: string;
    description?: string;
    contact?: string;
    mandant?: boolean;
    parentId?: string;
  } {
    const value = this.form.getRawValue();
    return {
      name: value.name,
      description: value.description,
      contact: value.contact,
      mandant: value.mandant,
      parentId: this.parentId,
    };
  }

  protected readonly stepper = new WizardStepper([
    { key: 'basics', label: 'ADMIN_SHARED_UI.STEP_LABELS.BASIC_INFO' },
    { key: 'rights', label: 'ADMIN_SHARED_UI.STEP_LABELS.RIGHTS_OF_OTHER_GROUPS_NEW' },
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
    return !!this.parentId;
  }

  get canSubmit(): boolean {
    if (this.processCreation() || this.form.invalid || !this.isRealmAdmin) {
      return false;
    }
    // A unit is either its own tenant or hangs below a parent.
    return this.form.controls.mandant.value === true || this.parentId !== undefined;
  }

  reset(): void {
    this.form.reset();
    this.parentId = undefined;
    this.errorMessagePart.set(undefined);
    this.keycloakErrorMessagePart.set(undefined);
    this.showErrorAlert.set(false);
    this.showKeycloakErrorAlert.set(false);
    this.stepper.reset();

    if (this.accessControlService.accessControl.length > 0) {
      this.buildRoleDelegatesTable();
    }
  }

  /** The rule is `uniqueNameValidator` on the control now. */
  checkName(): void {
    this.form.controls.name.updateValueAndValidity();
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  onMandantChange(): void {
    if (this.form.controls.mandant.value) {
      this.parentId = undefined;
    }
  }

  onParentOrganizationalUnitChange(parent: AccessControlMetadata): void {
    this.parentId = parent.organizationalUnitId || undefined;

    if (this.parentId) {
      this.form.controls.mandant.setValue(false);
    }
  }

  getParentOrganizationalUnit(): AccessControlMetadata | null {
    if (!this.parentId) {
      return null;
    }

    return this.accessControlService.getAccessControlById(this.parentId) || null;
  }

  onRoleDelegatesGridReady(params: GridReadyEvent): void {
    this.roleDelegatesGridApi = params.api;
  }

  private buildRoleDelegatesTable(): void {
    const rowData = buildAdvancedRoleRowData(this.accessControlService.accessControl, []);
    const components = createAdvancedRoleComponents();

    this.roleDelegatesColumnDefs = buildAdvancedColumnDefs(this.translate);
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
            this.translate.instant('ADMIN_ROLES.ADD_MODAL.MSG.CREATED', {
              name: this.newOrganizationalUnit.name,
            })
          );
          this.notificationService.showSuccess(
            this.translate.instant('ADMIN_ROLES.ADD_MODAL.MSG.KEYCLOAK_ROLES_CREATED')
          );
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
