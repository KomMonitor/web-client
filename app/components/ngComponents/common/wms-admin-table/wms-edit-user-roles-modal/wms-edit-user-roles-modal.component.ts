import { Component, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { forkJoin } from 'rxjs';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { OgcService } from 'services/ogcServices/ogc.service';

import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';
import {
  StepperComponent,
  StepperStep,
} from 'components/ngComponents/common/stepper/stepper.component';
import { RoleManagementGridComponent } from 'components/ngComponents/admin/adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from 'components/ngComponents/admin/adminShared/roleManagementPanel/owner-organization-select.component';

@Component({
  selector: 'app-wms-edit-user-roles-modal',
  templateUrl: './wms-edit-user-roles-modal.component.html',
  styleUrls: ['./wms-edit-user-roles-modal.component.scss'],
  imports: [
    FormsModule,
    StepperComponent,
    RoleManagementGridComponent,
    OwnerOrganizationSelectComponent,
  ],
  standalone: true,
})
export class WmsEditUserRolesModalComponent {
  activeModal = inject(NgbActiveModal);
  protected accessControlService = inject(AccessControlService);
  private ogcService = inject(OgcService);
  protected envConfigService = inject(EnvConfigService);

  currentGeoresourceDataset!: WmsDataset;

  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;

  totalSteps: number = 2;
  currentStep: number = 1;
  steps: StepperStep[] = [{ label: 'Zugriffsschutz' }, { label: 'Eigentümerschaft' }];

  isSubmitting = false;
  errorMessage = false;
  successMessage = false;
  loadingData = false;

  // Role management (grid handled by <app-role-management-grid>)
  ownerOrganization = '';
  isPublic = false;

  successMessagePart = '';
  errorMessagePart = '';

  // Multi-step form navigation
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

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
    const ownershipData = {
      ownerId: this.ownerOrganization,
    };

    const permissionData = {
      isPublic: this.isPublic,
      permissions: this.roleGrid?.getSelectedRoleIds() ?? [],
    };

    forkJoin({
      ownership: this.ogcService.updateOwnership(this.currentGeoresourceDataset.id, ownershipData),
      permissions: this.ogcService.updatePermissions(
        this.currentGeoresourceDataset.id,
        permissionData
      ),
    }).subscribe({
      next: (_response: any) => {
        this.successMessagePart = this.currentGeoresourceDataset.title;
        this.successMessage = true;
      },
      error: (error) => {
        this.errorMessagePart = error.message;
        this.errorMessage = true;
      },
    });
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
    this.ownerOrganization = '';
    this.isPublic = false;
    this.roleGrid?.reset();
  }

  hideSuccessAlert(): void {
    this.successMessage = false;
  }

  hideErrorAlert(): void {
    this.errorMessage = false;
  }
}
