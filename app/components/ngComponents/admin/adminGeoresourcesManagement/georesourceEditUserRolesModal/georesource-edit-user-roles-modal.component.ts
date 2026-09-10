import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { HttpClient } from '@angular/common/http';
import { Subscription, firstValueFrom } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { getErrorMessage } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
import { GeoresourceRefreshRequest } from '../georesource-refresh.model';
import { FormsModule } from '@angular/forms';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from '../../adminShared/roleManagementPanel/owner-organization-select.component';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-georesource-edit-user-roles-modal',
  templateUrl: './georesource-edit-user-roles-modal.component.html',
  styleUrls: ['./georesource-edit-user-roles-modal.component.scss'],
  imports: [
    FormsModule,
    LoadingOverlayComponent,
    StepperComponent,
    RoleManagementGridComponent,
    OwnerOrganizationSelectComponent,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoresourceEditUserRolesModalComponent implements OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);
  protected envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private http = inject(HttpClient);

  /** Emitted after a successful permissions/ownership update so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<GeoresourceRefreshRequest>();

  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'roles', label: 'ADMIN_SHARED_UI.STEP_LABELS.ACCESS_PROTECTION' },
    { key: 'ownership', label: 'ADMIN_SHARED_UI.STEP_LABELS.OWNERSHIP' },
  ]);

  // Signal: toggled across await boundaries (OnPush).
  loadingData = signal(false);

  // Current dataset being edited
  private _currentGeoresourceDataset: any;

  get currentGeoresourceDataset(): any {
    return this._currentGeoresourceDataset;
  }

  set currentGeoresourceDataset(value: any) {
    this._currentGeoresourceDataset = value;
    if (value) {
      this.resetGeoresourceEditUserRolesForm();
    }
  }

  /** Target owner selected in step 2; empty keeps the current owner. */
  ownerOrganization: string = '';

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Rebuild the grid when the available roles changed elsewhere (role admin area)
    const broadcastSubscription = this.broadcastService.currentBroadcastMsg.subscribe(
      (broadcastMsg) => {
        if (broadcastMsg?.msg === BroadcastMessage.AvailableRolesUpdate) {
          this.roleGrid?.reset();
        }
      }
    );
    this.subscriptions.push(broadcastSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onChangeOwner(ownerOrganization: string): void {
    this.ownerOrganization = ownerOrganization;
    this.roleGrid?.applyOwner(ownerOrganization);
  }

  resetGeoresourceEditUserRolesForm(): void {
    this.ownerOrganization = this.currentGeoresourceDataset?.ownerId ?? '';
    this.stepper.reset();
    this.roleGrid?.reset();
  }

  async editGeoresourceEditUserRolesForm(): Promise<void> {
    const dataset = this.currentGeoresourceDataset;
    if (!dataset) return;

    const ownershipChanging = this.isOwnershipChanging();
    if (ownershipChanging) {
      const confirmMessage = this.translate.instant(
        'ADMIN_GEORESOURCES.ROLES_MODAL.MSG.OWNERSHIP_TRANSFER_CONFIRM'
      );
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
      this.translate.instant('ADMIN_GEORESOURCES.ROLES_MODAL.MSG.RIGHTS_UPDATED', {
        name: dataset.datasetName,
      })
    );
    this.activeModal.close({
      action: 'updated',
      georesourceId: dataset.georesourceId,
    });
  }

  private async putUserRoles(): Promise<boolean> {
    const dataset = this.currentGeoresourceDataset;
    if (!dataset) return false;
    try {
      this.loadingData.set(true);

      const putBody = {
        permissions: this.roleGrid?.getSelectedRoleIds() ?? [],
        isPublic: dataset.isPublic,
      };

      await firstValueFrom(
        this.http.put(
          `${this.envConfigService.baseUrlToKomMonitorDataAPI}/georesources/${dataset.georesourceId}/permissions`,
          putBody,
          { headers: { 'Content-Type': 'application/json' } }
        )
      );

      this.refreshRequested.emit({
        crudType: 'edit',
        targetGeoresourceId: dataset.georesourceId,
      });
      // Persist latest selection locally so the grid reflects changes on refresh
      dataset.permissions = putBody.permissions;
      this.roleGrid?.reset();
      return true;
    } catch (error: any) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_GEORESOURCES.ROLES_MODAL.MSG.RIGHTS_UPDATE_FAILED', {
          error: getErrorMessage(error),
        })
      );
      return false;
    } finally {
      this.loadingData.set(false);
    }
  }

  private async putOwnership(): Promise<boolean> {
    const dataset = this.currentGeoresourceDataset;
    if (!dataset) return false;
    try {
      this.loadingData.set(true);

      const putBody = {
        ownerId: this.ownerOrganization || dataset.ownerId,
      };

      await firstValueFrom(
        this.http.put(
          `${this.envConfigService.baseUrlToKomMonitorDataAPI}/georesources/${dataset.georesourceId}/ownership`,
          putBody,
          { headers: { 'Content-Type': 'application/json' } }
        )
      );

      this.refreshRequested.emit({
        crudType: 'edit',
        targetGeoresourceId: dataset.georesourceId,
      });
      return true;
    } catch (error: any) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_GEORESOURCES.ROLES_MODAL.MSG.OWNERSHIP_UPDATE_FAILED', {
          error: getErrorMessage(error),
        })
      );
      return false;
    } finally {
      this.loadingData.set(false);
    }
  }

  isOwnershipChanging(): boolean {
    return !!(
      this.ownerOrganization && this.ownerOrganization !== this.currentGeoresourceDataset?.ownerId
    );
  }

  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }
}
