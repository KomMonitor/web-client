import { ChangeDetectionStrategy, Component, ViewChild, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { Observable, concatMap, finalize, of } from 'rxjs';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { OgcService } from 'services/ogcServices/ogc.service';

import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { RoleManagementGridComponent } from 'components/ngComponents/admin/adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from 'components/ngComponents/admin/adminShared/roleManagementPanel/owner-organization-select.component';

@Component({
  selector: 'app-wms-edit-user-roles-modal',
  templateUrl: './wms-edit-user-roles-modal.component.html',
  styleUrls: ['./wms-edit-user-roles-modal.component.scss'],
  imports: [
    TranslateModule,
    FormsModule,
    LoadingOverlayComponent,
    StepperComponent,
    RoleManagementGridComponent,
    OwnerOrganizationSelectComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WmsEditUserRolesModalComponent {
  activeModal = inject(NgbActiveModal);
  protected accessControlService = inject(AccessControlService);
  private ogcService = inject(OgcService);
  protected envConfigService = inject(EnvConfigService);

  currentGeoresourceDataset!: WmsDataset;

  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;

  readonly stepper = new WizardStepper([
    { key: 'roles', label: 'ADMIN_SHARED_UI.STEP_LABELS.ACCESS_PROTECTION' },
    { key: 'ownership', label: 'ADMIN_SHARED_UI.STEP_LABELS.OWNERSHIP' },
  ]);

  // Signals: toggled from async HTTP callbacks and read by the template (OnPush)
  errorMessage = signal(false);
  successMessage = signal(false);
  /** True while the save request is in flight; drives the overlay and blocks double submits. */
  isSubmitting = signal(false);

  // Role management (grid handled by <app-role-management-grid>)
  /** Target owner selected in step 2; empty keeps the current owner (picker runs in 'transfer' mode). */
  ownerOrganization = '';
  isPublic = false;

  successMessagePart = signal('');
  errorMessagePart = signal('');

  close(): void {
    this.activeModal.close(true);
  }

  reInit() {
    this.isPublic = this.currentGeoresourceDataset.isPublic;
    this.ownerOrganization = this.currentGeoresourceDataset.ownerId;
    // The grid seeds itself from its [permissions]/[ownerId] inputs bound to the dataset
    this.roleGrid?.reset();
  }

  editData() {
    if (this.isSubmitting()) return;
    const dataset = this.currentGeoresourceDataset;

    const permissionData = {
      isPublic: this.isPublic,
      permissions: this.roleGrid?.getSelectedRoleIds() ?? [],
    };

    // Mirrors the spatial-unit roles modal: permissions first, and the ownership
    // is only transferred when it actually changes. An empty selection keeps the
    // current owner, so `ownerId: ''` is never sent.
    const ownershipChanging = this.isOwnershipChanging();
    const ownershipData = { ownerId: this.ownerOrganization || dataset.ownerId };

    this.isSubmitting.set(true);
    this.ogcService
      .updatePermissions(dataset.id, permissionData)
      .pipe(
        concatMap(
          (): Observable<unknown> =>
            ownershipChanging
              ? this.ogcService.updateOwnership(dataset.id, ownershipData)
              : of(null)
        ),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessagePart.set(dataset.title);
          this.successMessage.set(true);
        },
        error: (error) => {
          this.errorMessagePart.set(error.message);
          this.errorMessage.set(true);
        },
      });
  }

  isOwnershipChanging(): boolean {
    return !!(
      this.ownerOrganization && this.ownerOrganization !== this.currentGeoresourceDataset?.ownerId
    );
  }

  onChangeOwner(orgUnitId: string): void {
    // Deliberately no grid re-seeding here (matches the historical behavior:
    // the legacy refreshRoles call was disabled).
    this.ownerOrganization = orgUnitId;
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }

  resetWmsEditForm() {
    // Restore the dataset's stored values. Resetting `isPublic` to false used to
    // silently make a public dataset private on the next submit.
    this.reInit();
  }

  hideSuccessAlert(): void {
    this.successMessage.set(false);
  }

  hideErrorAlert(): void {
    this.errorMessage.set(false);
  }
}
