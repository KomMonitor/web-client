import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { HttpClient } from '@angular/common/http';

import { FormsModule } from '@angular/forms';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { IndicatorRefreshRequest } from '../indicator-refresh.model';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from '../../adminShared/roleManagementPanel/owner-organization-select.component';

@Component({
  selector: 'app-indicator-edit-indicator-spatial-unit-roles-modal',
  templateUrl: './indicator-edit-indicator-spatial-unit-roles-modal.component.html',
  styleUrls: ['./indicator-edit-indicator-spatial-unit-roles-modal.component.scss'],
  imports: [
    TranslateModule,
    FormsModule,
    StepperComponent,
    RoleManagementGridComponent,
    OwnerOrganizationSelectComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorEditIndicatorSpatialUnitRolesModalComponent implements OnInit {
  @Output() refreshRequested = new EventEmitter<IndicatorRefreshRequest>();

  // Form data
  currentIndicatorDataset: any;
  targetApplicableSpatialUnit: any;

  /** Target owner selected in step 3; empty keeps the current owner. */
  ownerOrganization: string = '';

  // Loading states
  // Signal: toggled across the await boundaries of the sequential save (OnPush).
  loadingData = signal(false);

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'metadataRoles', label: 'ADMIN_SHARED_UI.STEP_LABELS.ACCESS_INDICATOR_METADATA' },
    { key: 'timeseriesRoles', label: 'ADMIN_SHARED_UI.STEP_LABELS.ACCESS_INDICATOR_TIMESERIES' },
    { key: 'ownership', label: 'ADMIN_SHARED_UI.STEP_LABELS.OWNERSHIP' },
  ]);

  activeModal = inject(NgbActiveModal);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  protected accessControlService = inject(AccessControlService);
  private indicatorValueService = inject(IndicatorValueService);
  private envConfigService = inject(EnvConfigService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  @ViewChild('metadataRoleGrid') metadataRoleGrid?: RoleManagementGridComponent;
  @ViewChild('timeseriesRoleGrid') timeseriesRoleGrid?: RoleManagementGridComponent;

  ngOnInit(): void {
    this.setupEventListeners();
    this.resetIndicatorEditIndicatorSpatialUnitRolesForm();
  }

  private setupEventListeners(): void {
    this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === BroadcastMessage.AvailableRolesUpdate) {
        this.metadataRoleGrid?.reset();
        this.timeseriesRoleGrid?.reset();
      }
    });
  }

  // Called by the parent after opening the modal via NgbModal to set up the form data.
  openModal(indicatorDataset: any): void {
    this.currentIndicatorDataset = indicatorDataset;
    this.resetIndicatorEditIndicatorSpatialUnitRolesForm();
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  resetIndicatorEditIndicatorSpatialUnitRolesForm(): void {
    this.ownerOrganization = this.currentIndicatorDataset?.ownerId ?? '';
    this.targetApplicableSpatialUnit = this.currentIndicatorDataset?.applicableSpatialUnits?.[0];
    this.metadataRoleGrid?.reset();
    this.timeseriesRoleGrid?.reset();
  }

  onChangeOwner(ownerOrganization: string): void {
    this.ownerOrganization = ownerOrganization;
    // Re-seed both grids with the new owner unit's default viewer/editor permissions
    this.metadataRoleGrid?.applyOwner(ownerOrganization);
    this.timeseriesRoleGrid?.applyOwner(ownerOrganization);
  }

  /**
   * Sequential save following the spatial-unit edit-user-roles pattern
   * (formerly four fire-and-forget parallel PUTs): permissions are persisted
   * first and abort the chain on failure — otherwise a later ownership
   * transfer could succeed, revoke our creator rights, and mask that the
   * permissions were never saved. Ownership is only transferred when it
   * actually changed. One success toast, then the modal closes.
   */
  async editIndicatorSpatialUnitRoles(): Promise<void> {
    const dataset = this.currentIndicatorDataset;
    if (!dataset) return;

    const ownershipChanging = !!(
      this.ownerOrganization && this.ownerOrganization !== dataset.ownerId
    );
    if (ownershipChanging) {
      if (
        !confirm(
          this.translate.instant('ADMIN_INDICATORS.EDIT_ROLES.MSG.OWNERSHIP_TRANSFER_CONFIRM')
        )
      ) {
        return;
      }
    }

    this.loadingData.set(true);
    try {
      if (!(await this.putIndicatorMetadataRoles())) return;
      if (!(await this.putIndicatorSpatialUnitRoles())) return;

      if (ownershipChanging) {
        if (!(await this.putIndicatorOwnership())) return;
        if (!(await this.putIndicatorSpatialUnitOwnership())) return;
      }

      this.refreshRequested.emit({
        crudType: 'edit',
        targetIndicatorId: dataset.indicatorId,
      });

      let message = this.translate.instant('ADMIN_INDICATORS.EDIT_ROLES.MSG.UPDATED', {
        name: dataset.indicatorName,
      });
      if (this.targetApplicableSpatialUnit?.spatialUnitName) {
        message +=
          ' ' +
          this.translate.instant('ADMIN_INDICATORS.EDIT_ROLES.MSG.UPDATED_LINKED_SPATIAL_UNIT', {
            name: this.targetApplicableSpatialUnit.spatialUnitName,
          });
      }
      this.notificationService.showSuccess(message);
      this.activeModal.close({
        action: 'updated',
        indicatorId: dataset.indicatorId,
      });
    } finally {
      this.loadingData.set(false);
    }
  }

  private async putIndicatorMetadataRoles(): Promise<boolean> {
    const putBody = {
      permissions: this.metadataRoleGrid?.getSelectedRoleIds() ?? [],
      isPublic: this.currentIndicatorDataset.isPublic,
    };

    try {
      await firstValueFrom(
        this.http.put(
          this.envConfigService.baseUrlToKomMonitorDataAPI +
            '/indicators/' +
            this.currentIndicatorDataset.indicatorId +
            '/permissions',
          putBody
        )
      );
      return true;
    } catch (error) {
      this.showErrorAlert(
        this.translate.instant('ADMIN_INDICATORS.EDIT_ROLES.MSG.METADATA_RIGHTS_FAILED'),
        error
      );
      return false;
    }
  }

  /** Timeseries permissions of the selected target spatial unit (step 2). */
  private async putIndicatorSpatialUnitRoles(): Promise<boolean> {
    if (!this.targetApplicableSpatialUnit) {
      return true;
    }

    const putBody = {
      permissions: this.timeseriesRoleGrid?.getSelectedRoleIds() ?? [],
      isPublic: this.targetApplicableSpatialUnit.isPublic,
    };

    try {
      await firstValueFrom(
        this.http.put(
          this.envConfigService.baseUrlToKomMonitorDataAPI +
            '/indicators/' +
            this.currentIndicatorDataset.indicatorId +
            '/' +
            this.targetApplicableSpatialUnit.spatialUnitId +
            '/permissions',
          putBody
        )
      );
      return true;
    } catch (error) {
      this.showErrorAlert(
        this.translate.instant('ADMIN_INDICATORS.EDIT_ROLES.MSG.TIMESERIES_RIGHTS_FAILED', {
          name: this.targetApplicableSpatialUnit.spatialUnitName,
        }),
        error
      );
      return false;
    }
  }

  private async putIndicatorOwnership(): Promise<boolean> {
    const putBody = { ownerId: this.ownerOrganization };

    try {
      await firstValueFrom(
        this.http.put(
          this.envConfigService.baseUrlToKomMonitorDataAPI +
            '/indicators/' +
            this.currentIndicatorDataset.indicatorId +
            '/ownership',
          putBody
        )
      );
      return true;
    } catch (error) {
      this.showErrorAlert(
        this.translate.instant('ADMIN_INDICATORS.EDIT_ROLES.MSG.METADATA_OWNERSHIP_FAILED'),
        error
      );
      return false;
    }
  }

  /** Timeseries ownership per applicable spatial unit, transferred one by one. */
  private async putIndicatorSpatialUnitOwnership(): Promise<boolean> {
    const spatialUnits = this.currentIndicatorDataset.applicableSpatialUnits ?? [];
    const putBody = { ownerId: this.ownerOrganization };

    for (const indicatorSpatialUnit of spatialUnits) {
      try {
        await firstValueFrom(
          this.http.put(
            this.envConfigService.baseUrlToKomMonitorDataAPI +
              '/indicators/' +
              this.currentIndicatorDataset.indicatorId +
              '/' +
              indicatorSpatialUnit.spatialUnitId +
              '/ownership',
            putBody
          )
        );
      } catch (error) {
        this.showErrorAlert(
          this.translate.instant('ADMIN_INDICATORS.EDIT_ROLES.MSG.TIMESERIES_OWNERSHIP_FAILED', {
            name: indicatorSpatialUnit.spatialUnitName,
          }),
          error
        );
        return false;
      }
    }
    return true;
  }

  private showErrorAlert(context: string, error: unknown): void {
    // formatError may return HTML (syntax-highlighted JSON); reduce it to plain text for the toast
    const tmp = document.createElement('div');
    tmp.innerHTML = this.indicatorValueService.formatError(error) || '';
    const detail = (tmp.textContent || '').trim();
    this.notificationService.showError(context + (detail ? ' ' + detail : ''), {
      autohide: false,
    });
  }
}
