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

  // Messages
  errorMessagePart: string = '';

  /** Target owner selected in step 3; empty keeps the current owner. */
  ownerOrganization: string = '';

  // Loading states
  // Signal: toggled from the four permission/ownership PUT subscriptions (OnPush).
  loadingData = signal(false);

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'metadataRoles', label: 'Zugriffsschutz Indikator-Metadaten' },
    { key: 'timeseriesRoles', label: 'Zugriffsschutz Indikator-Zeitreihe pro Raumeinheit' },
    { key: 'ownership', label: 'Eigentümerschaft' },
  ]);

  activeModal = inject(NgbActiveModal);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  protected accessControlService = inject(AccessControlService);
  private indicatorValueService = inject(IndicatorValueService);
  private envConfigService = inject(EnvConfigService);
  private notificationService = inject(NotificationService);

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
    this.errorMessagePart = '';
  }

  onChangeOwner(ownerOrganization: string): void {
    this.ownerOrganization = ownerOrganization;
    // Re-seed both grids with the new owner unit's default viewer/editor permissions
    this.metadataRoleGrid?.applyOwner(ownerOrganization);
    this.timeseriesRoleGrid?.applyOwner(ownerOrganization);
  }

  editIndicatorSpatialUnitRoles(): void {
    if (this.ownerOrganization && this.ownerOrganization !== this.currentIndicatorDataset.ownerId) {
      if (
        !confirm(
          'Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?'
        )
      ) {
        return;
      }
    }

    this.executeRequest_indicatorMetadataRoles();
    this.executeRequest_indicatorOwnership();
    this.executeRequest_indicatorSpatialUnitRoles();
    this.executeRequest_indicatorSpatialUnitOwnership();
  }

  executeRequest_indicatorMetadataRoles(): void {
    this.loadingData.set(true);

    const putBody = {
      permissions: this.metadataRoleGrid?.getSelectedRoleIds() ?? [],
      isPublic: this.currentIndicatorDataset.isPublic,
    };

    this.http
      .put(
        this.envConfigService.baseUrlToKomMonitorDataAPI +
          '/indicators/' +
          this.currentIndicatorDataset.indicatorId +
          '/permissions',
        putBody
      )
      .subscribe({
        next: (_response: any) => {
          this.refreshRequested.emit({
            crudType: 'edit',
            targetIndicatorId: this.currentIndicatorDataset.indicatorId,
          });
          this.showSuccessAlert();
          this.loadingData.set(false);
        },
        error: (error: any) => {
          this.errorMessagePart =
            'Fehler beim Aktualisieren der Metadaten-Zugriffsrechte. Fehler lautet: \n\n';
          this.errorMessagePart += this.indicatorValueService.formatError(error);
          this.showErrorAlert();
          this.loadingData.set(false);
        },
      });
  }

  executeRequest_indicatorOwnership(): void {
    this.loadingData.set(true);

    const putBody = {
      ownerId: this.ownerOrganization || this.currentIndicatorDataset.ownerId,
    };

    this.http
      .put(
        this.envConfigService.baseUrlToKomMonitorDataAPI +
          '/indicators/' +
          this.currentIndicatorDataset.indicatorId +
          '/ownership',
        putBody
      )
      .subscribe({
        next: (_response: any) => {
          this.refreshRequested.emit({
            crudType: 'edit',
            targetIndicatorId: this.currentIndicatorDataset.indicatorId,
          });
          this.showSuccessAlert();
          this.loadingData.set(false);
        },
        error: (error: any) => {
          this.errorMessagePart =
            'Fehler beim Aktualisieren der Metadaten-Eigentümerschaft. Fehler lautet: \n\n';
          this.errorMessagePart += this.indicatorValueService.formatError(error);
          this.showErrorAlert();
          this.loadingData.set(false);
        },
      });
  }

  executeRequest_indicatorSpatialUnitOwnership(): void {
    this.loadingData.set(true);

    if (
      this.currentIndicatorDataset.applicableSpatialUnits &&
      this.currentIndicatorDataset.applicableSpatialUnits.length > 0
    ) {
      this.currentIndicatorDataset.applicableSpatialUnits.forEach((indicatorSpatialUnit: any) => {
        const putBody = {
          ownerId: this.ownerOrganization || this.currentIndicatorDataset.ownerId,
        };

        this.http
          .put(
            this.envConfigService.baseUrlToKomMonitorDataAPI +
              '/indicators/' +
              this.currentIndicatorDataset.indicatorId +
              '/' +
              indicatorSpatialUnit.spatialUnitId +
              '/ownership',
            putBody
          )
          .subscribe({
            next: (_response: any) => {
              this.refreshRequested.emit({
                crudType: 'edit',
                targetIndicatorId: this.currentIndicatorDataset.indicatorId,
              });
              this.showSuccessAlert();
              this.loadingData.set(false);
            },
            error: (error: any) => {
              this.errorMessagePart =
                'Fehler beim Aktualisieren der Metadaten-Eigentümerschaft. Fehler lautet: \n\n';
              this.errorMessagePart += this.indicatorValueService.formatError(error);
              this.showErrorAlert();
              this.loadingData.set(false);
            },
          });
      });
    }
  }

  executeRequest_indicatorSpatialUnitRoles(): void {
    if (!this.targetApplicableSpatialUnit) {
      return;
    }

    const putBody = {
      permissions: this.timeseriesRoleGrid?.getSelectedRoleIds() ?? [],
      isPublic: this.targetApplicableSpatialUnit.isPublic,
    };

    this.loadingData.set(true);

    this.http
      .put(
        this.envConfigService.baseUrlToKomMonitorDataAPI +
          '/indicators/' +
          this.currentIndicatorDataset.indicatorId +
          '/' +
          this.targetApplicableSpatialUnit.spatialUnitId +
          '/permissions',
        putBody
      )
      .subscribe({
        next: (_response: any) => {
          this.refreshRequested.emit({
            crudType: 'edit',
            targetIndicatorId: this.currentIndicatorDataset.indicatorId,
          });
          this.showSuccessAlert();
          this.loadingData.set(false);
        },
        error: (error: any) => {
          this.errorMessagePart =
            'Fehler beim Aktualisieren der Zugriffsrechte auf Zeitreihe der Raumeinheit ' +
            this.targetApplicableSpatialUnit.spatialUnitName +
            '. Fehler lautet: \n\n';
          this.errorMessagePart += this.indicatorValueService.formatError(error);
          this.showErrorAlert();
          this.loadingData.set(false);
        },
      });
  }

  // Multi-step form navigation
  // Alert management
  showSuccessAlert(): void {
    let message = `Zugriffsschutz und Eigentümerschaft für Indikator '${this.currentIndicatorDataset?.indicatorName}' aktualisiert.`;
    if (this.targetApplicableSpatialUnit?.spatialUnitName) {
      message += ` Verknüpfte Raumebene '${this.targetApplicableSpatialUnit.spatialUnitName}' wurde ebenfalls aktualisiert.`;
    }
    this.notificationService.showSuccess(message);
  }

  showErrorAlert(): void {
    // errorMessagePart may contain HTML (syntax-highlighted JSON); reduce it to plain text for the toast
    const tmp = document.createElement('div');
    tmp.innerHTML = this.errorMessagePart || '';
    const detail = (tmp.textContent || '').trim();
    this.notificationService.showError(
      'Aktualisierung des Zugriffsschutzes und der Eigentümerschaft gescheitert.' +
        (detail ? ' ' + detail : ''),
      { autohide: false }
    );
  }
}
