import { Component, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SpatialUnitRefreshRequest } from '../spatial-unit-refresh.model';
import {
  KommonitorDataExchangeService,
  SpatialUnitMetadata,
} from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { getErrorMessage } from '../spatial-unit-import.util';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from '../../adminShared/roleManagementPanel/owner-organization-select.component';

@Component({
  selector: 'app-spatial-unit-edit-user-roles-modal',
  templateUrl: './spatial-unit-edit-user-roles-modal.component.html',
  styleUrls: ['./spatial-unit-edit-user-roles-modal.component.scss'],
  imports: [
    FormsModule,
    StepperComponent,
    RoleManagementGridComponent,
    OwnerOrganizationSelectComponent,
  ],
  standalone: true,
})
export class SpatialUnitEditUserRolesModalComponent {
  activeModal = inject(NgbActiveModal);
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  /** Emitted after roles/ownership changed so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();

  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;

  private _currentSpatialUnitDataset: SpatialUnitMetadata | null = null;

  get currentSpatialUnitDataset(): SpatialUnitMetadata | null {
    return this._currentSpatialUnitDataset;
  }

  set currentSpatialUnitDataset(value: SpatialUnitMetadata | null) {
    this._currentSpatialUnitDataset = value;
    if (value) {
      this.resetForm();
    }
  }

  /** Target owner selected in step 2; empty keeps the current owner. */
  ownerOrganization: string = '';

  loadingData: boolean = false;
  readonly stepper = new WizardStepper([
    { key: 'roles', label: 'Zugriffsschutz' },
    { key: 'ownership', label: 'Eigentümerschaft' },
  ]);

  onChangeOwner(ownerOrganization: string): void {
    this.ownerOrganization = ownerOrganization;
    this.roleGrid?.applyOwner(ownerOrganization);
  }

  resetForm(): void {
    this.ownerOrganization = this.currentSpatialUnitDataset?.ownerId ?? '';
    this.stepper.reset();
    this.roleGrid?.reset();
  }

  async editSpatialUnitUserRoles(): Promise<void> {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return;

    const ownershipChanging = this.isOwnershipChanging();
    if (ownershipChanging) {
      const confirmMessage =
        'Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?';
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    // Persist the permissions first. If that fails, abort: otherwise an
    // ownership transfer could succeed and mask the failure while the
    // permissions were never saved.
    const rolesSaved = await this.putUserRoles();
    if (!rolesSaved) {
      return;
    }

    // Only transfer ownership when it actually changed.
    if (ownershipChanging) {
      const ownershipSaved = await this.putOwnership();
      if (!ownershipSaved) {
        return;
      }
    }

    this.notificationService.showSuccess(
      `Zugriffsrechte für Raumebene "${dataset.spatialUnitLevel}" wurden aktualisiert.`
    );
    this.activeModal.close({
      action: 'updated',
      spatialUnitId: dataset.spatialUnitId,
    });
  }

  private async putUserRoles(): Promise<boolean> {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return false;
    try {
      this.loadingData = true;

      const putBody = {
        permissions: this.roleGrid?.getSelectedRoleIds() ?? [],
        isPublic: dataset.isPublic,
      };

      await firstValueFrom(
        this.http.put(
          `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${dataset.spatialUnitId}/permissions`,
          putBody,
          { headers: { 'Content-Type': 'application/json' } }
        )
      );

      this.refreshRequested.emit({
        crudType: 'edit',
        targetSpatialUnitId: dataset.spatialUnitId,
      });
      // Persist latest selection locally so the grid reflects changes on refresh
      dataset.permissions = putBody.permissions;
      this.roleGrid?.reset();
      return true;
    } catch (error: any) {
      this.notificationService.showError(
        'Fehler beim Aktualisieren der Zugriffsrechte: ' + getErrorMessage(error)
      );
      return false;
    } finally {
      this.loadingData = false;
    }
  }

  private async putOwnership(): Promise<boolean> {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return false;
    try {
      this.loadingData = true;

      const putBody = {
        ownerId: this.ownerOrganization || dataset.ownerId,
      };

      await firstValueFrom(
        this.http.put(
          `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${dataset.spatialUnitId}/ownership`,
          putBody,
          { headers: { 'Content-Type': 'application/json' } }
        )
      );

      this.refreshRequested.emit({
        crudType: 'edit',
        targetSpatialUnitId: dataset.spatialUnitId,
      });
      return true;
    } catch (error: any) {
      this.notificationService.showError(
        'Fehler beim Aktualisieren der Eigentümerschaft: ' + getErrorMessage(error)
      );
      return false;
    } finally {
      this.loadingData = false;
    }
  }

  isOwnershipChanging(): boolean {
    return !!(
      this.ownerOrganization && this.ownerOrganization !== this.currentSpatialUnitDataset?.ownerId
    );
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  // Method to initialize the component with data (called from parent)
  initializeWithData(spatialUnitDataset: any): void {
    this.currentSpatialUnitDataset = spatialUnitDataset;
    this.resetForm();
  }
}
