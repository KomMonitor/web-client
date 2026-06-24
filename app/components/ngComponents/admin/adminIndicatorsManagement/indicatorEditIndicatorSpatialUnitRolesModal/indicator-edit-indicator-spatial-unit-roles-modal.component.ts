import { Component, OnInit, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { MultiStepHelperServiceService } from 'services/multi-step-helper-service/multi-step-helper-service.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { HttpClient } from '@angular/common/http';

import { FormsModule } from '@angular/forms';
import { FilterPipe } from '../../../../../pipes/filter.pipe';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';

@Component({
  selector: 'app-indicator-edit-indicator-spatial-unit-roles-modal',
  templateUrl: './indicator-edit-indicator-spatial-unit-roles-modal.component.html',
  styleUrls: ['./indicator-edit-indicator-spatial-unit-roles-modal.component.scss'],
  imports: [FormsModule, FilterPipe],
  standalone: true,
})
export class IndicatorEditIndicatorSpatialUnitRolesModalComponent implements OnInit {
  // Form data
  currentIndicatorDataset: any;
  targetApplicableSpatialUnit: any;

  // Role management tables
  roleManagementTableOptions_indicatorMetadata: any;
  roleManagementTableOptions_indicatorSpatialUnitTimeseries: any;

  // Messages
  successMessagePart: string = '';
  errorMessagePart: string = '';

  // Form controls
  ownerOrgFilter: string = '';
  ownerOrganization: any;
  activeRolesOnly: boolean = true;
  activeConnectedRolesOnly: boolean = true;
  permissions: any[] = [];
  resourcesCreatorRights: any[] = [];

  // Loading states
  loadingData: boolean = false;

  // Multi-step form
  currentStep: number = 1;
  totalSteps: number = 3;

  activeModal = inject(NgbActiveModal);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  public dataExchangeService = inject(DataExchangeService);
  protected accessControlService = inject(AccessControlService);
  private indicatorValueService = inject(IndicatorValueService);
  private roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private multiStepHelperService = inject(MultiStepHelperServiceService);
  private envConfigService = inject(EnvConfigService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.setupEventListeners();
    this.initializeForm();
  }

  private setupEventListeners(): void {
    this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'availableRolesUpdate') {
        this.refreshRoleManagementTable_indicatorMetadata();
        this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
      }
    });
  }

  private initializeForm(): void {
    this.resetIndicatorEditIndicatorSpatialUnitRolesForm();
  }

  // Called by the parent after opening the modal via NgbModal to set up the form data.
  openModal(indicatorDataset: any): void {
    this.currentIndicatorDataset = indicatorDataset;
    this.prepareCreatorList();
    this.resetIndicatorEditIndicatorSpatialUnitRolesForm();

    // Register the multi-step form handler
    this.multiStepHelperService.registerClickHandler('indicatorEditIndicatorSpatialUnitRolesForm');
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  prepareCreatorList(): void {
    if (this.dataExchangeService.currentKomMonitorLoginRoleNames.length > 0) {
      const creatorRights: string[] = [];
      const creatorRightsChildren: string[] = [];

      this.dataExchangeService.currentKomMonitorLoginRoleNames.forEach((roles: string) => {
        const key = roles.split('.')[0];
        const role = roles.split('.')[1];

        // case unit-resources-creator
        if (role == 'unit-resources-creator' && !this.resourcesCreatorRights.includes(key)) {
          creatorRights.push(key);
        }

        // case client-resources-creator, gather unit-ids first, then fetch all unit-data
        if (role == 'client-resources-creator' && !creatorRightsChildren.includes(key)) {
          creatorRightsChildren.push(key);
        }
      });

      // gather all children
      this.gatherCreatorRightsChildren(creatorRights, creatorRightsChildren);

      this.resourcesCreatorRights = this.dataExchangeService.accessControl.filter((elem: any) =>
        creatorRights.includes(elem.name)
      );
    }
  }

  gatherCreatorRightsChildren(creatorRights: string[], creatorRightsChildren: string[]): void {
    if (creatorRightsChildren.length > 0) {
      this.dataExchangeService.accessControl
        .filter((elem: any) => creatorRightsChildren.includes(elem.name))
        .flatMap((res: any) => res.children)
        .forEach((child: any) => {
          this.dataExchangeService.accessControl
            .filter((elem: any) => elem.organizationalUnitId == child)
            .forEach((childData: any) => {
              creatorRights.push(childData.name);
              this.gatherCreatorRightsChildren(creatorRights, [childData.name]);
            });
        });
    }
  }

  resetIndicatorEditIndicatorSpatialUnitRolesForm(): void {
    this.ownerOrganization = this.currentIndicatorDataset?.ownerId;
    this.ownerOrgFilter = '';
    this.targetApplicableSpatialUnit = this.currentIndicatorDataset?.applicableSpatialUnits?.[0];

    this.refreshRoleManagementTable_indicatorMetadata();
    this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();

    this.successMessagePart = '';
    this.errorMessagePart = '';
  }

  refreshRoleManagementTable_indicatorMetadata(): void {
    this.permissions = this.currentIndicatorDataset ? this.currentIndicatorDataset.permissions : [];

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.dataExchangeService.accessControl.forEach((item: any) => {
      if (this.currentIndicatorDataset) {
        if (item.organizationalUnitId == this.currentIndicatorDataset.ownerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    if (this.permissions.length == 0) {
      this.activeRolesOnly = false;
    }

    let access = this.dataExchangeService.accessControl;
    if (this.permissions.length > 0 && this.activeRolesOnly) {
      access = this.dataExchangeService.accessControl.filter((unit: any) => {
        return unit.permissions.filter((unitPermission: any) =>
          this.permissions.includes(unitPermission.permissionId)
        ).length > 0
          ? true
          : false;
      });
    }

    this.roleManagementTableOptions_indicatorMetadata =
      this.roleManagementHelper.buildRoleManagementGrid(
        'indicatorEditRoleManagementTable',
        this.roleManagementTableOptions_indicatorMetadata,
        access,
        this.permissions,
        true
      );
  }

  refreshRoleManagementTable_indicatorSpatialUnitTimeseries(): void {
    if (this.targetApplicableSpatialUnit && this.targetApplicableSpatialUnit.permissions) {
      if (this.targetApplicableSpatialUnit.permissions.length == 0) {
        this.activeConnectedRolesOnly = false;
      }

      let connectedAccess = this.dataExchangeService.accessControl;
      if (
        this.targetApplicableSpatialUnit.permissions.length > 0 &&
        this.activeConnectedRolesOnly
      ) {
        connectedAccess = this.dataExchangeService.accessControl.filter((unit: any) => {
          return unit.permissions.filter((unitPermission: any) =>
            this.targetApplicableSpatialUnit.permissions.includes(unitPermission.permissionId)
          ).length > 0
            ? true
            : false;
        });
      }

      this.roleManagementTableOptions_indicatorSpatialUnitTimeseries =
        this.roleManagementHelper.buildRoleManagementGrid(
          'indicatorEditIndicatorSpatialUnitsRoleManagementTable',
          this.roleManagementTableOptions_indicatorSpatialUnitTimeseries,
          connectedAccess,
          this.targetApplicableSpatialUnit.permissions,
          true
        );
    } else {
      this.activeConnectedRolesOnly = false;
      this.roleManagementTableOptions_indicatorSpatialUnitTimeseries =
        this.roleManagementHelper.buildRoleManagementGrid(
          'indicatorEditIndicatorSpatialUnitsRoleManagementTable',
          this.roleManagementTableOptions_indicatorSpatialUnitTimeseries,
          this.dataExchangeService.accessControl,
          [],
          true
        );
    }
  }

  onActiveConnectedRolesOnlyChange(): void {
    this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
  }

  onActiveRolesOnlyChange(): void {
    this.refreshRoleManagementTable_indicatorMetadata();
  }

  onChangeOwner(ownerOrganization: any): void {
    this.ownerOrganization = ownerOrganization;
    this.refreshRoles(this.ownerOrganization);
  }

  refreshRoles(orgUnitId: string): void {
    const permissionIds_ownerUnit = orgUnitId
      ? (this.accessControlService.getAccessControlById(orgUnitId)?.permissions ?? [])
          .filter(
            (permission: any) =>
              permission.permissionLevel == 'viewer' || permission.permissionLevel == 'editor'
          )
          .map((permission: any) => permission.permissionId)
      : [];

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.dataExchangeService.accessControl.forEach((item: any) => {
      if (item.organizationalUnitId == orgUnitId) {
        item.datasetOwner = true;
      } else {
        item.datasetOwner = false;
      }
    });

    this.roleManagementTableOptions_indicatorMetadata =
      this.roleManagementHelper.buildRoleManagementGrid(
        'indicatorEditRoleManagementTable',
        this.roleManagementTableOptions_indicatorMetadata,
        this.dataExchangeService.accessControl,
        permissionIds_ownerUnit,
        true
      );

    this.roleManagementTableOptions_indicatorSpatialUnitTimeseries =
      this.roleManagementHelper.buildRoleManagementGrid(
        'indicatorEditIndicatorSpatialUnitsRoleManagementTable',
        this.roleManagementTableOptions_indicatorSpatialUnitTimeseries,
        this.dataExchangeService.accessControl,
        permissionIds_ownerUnit,
        true
      );
  }

  editIndicatorSpatialUnitRoles(): void {
    if (
      this.ownerOrganization !== undefined &&
      this.ownerOrganization != this.currentIndicatorDataset.ownerId
    ) {
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
    this.loadingData = true;

    const putBody = {
      permissions: this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions_indicatorMetadata
      ),
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
          this.successMessagePart = this.currentIndicatorDataset.indicatorName;
          this.broadcastService.broadcast('refreshIndicatorOverviewTable', {
            crudType: 'edit',
            targetIndicatorId: this.currentIndicatorDataset.indicatorId,
          });
          this.showSuccessAlert();
          this.loadingData = false;
        },
        error: (error: any) => {
          this.errorMessagePart =
            'Fehler beim Aktualisieren der Metadaten-Zugriffsrechte. Fehler lautet: \n\n';
          if (error.data) {
            this.errorMessagePart += this.indicatorValueService.syntaxHighlightJSON(error.data);
          } else {
            this.errorMessagePart += this.indicatorValueService.syntaxHighlightJSON(error);
          }
          this.showErrorAlert();
          this.loadingData = false;
        },
      });
  }

  executeRequest_indicatorOwnership(): void {
    this.loadingData = true;

    const putBody = {
      ownerId:
        this.ownerOrganization === undefined
          ? this.currentIndicatorDataset.ownerId
          : this.ownerOrganization,
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
          this.successMessagePart = this.currentIndicatorDataset.indicatorName;
          this.broadcastService.broadcast('refreshIndicatorOverviewTable', {
            crudType: 'edit',
            targetIndicatorId: this.currentIndicatorDataset.indicatorId,
          });
          this.showSuccessAlert();
          this.loadingData = false;
        },
        error: (error: any) => {
          this.errorMessagePart =
            'Fehler beim Aktualisieren der Metadaten-Eigentümerschaft. Fehler lautet: \n\n';
          if (error.data) {
            this.errorMessagePart += this.indicatorValueService.syntaxHighlightJSON(error.data);
          } else {
            this.errorMessagePart += this.indicatorValueService.syntaxHighlightJSON(error);
          }
          this.showErrorAlert();
          this.loadingData = false;
        },
      });
  }

  executeRequest_indicatorSpatialUnitOwnership(): void {
    this.loadingData = true;

    if (
      this.currentIndicatorDataset.applicableSpatialUnits &&
      this.currentIndicatorDataset.applicableSpatialUnits.length > 0
    ) {
      this.currentIndicatorDataset.applicableSpatialUnits.forEach((indicatorSpatialUnit: any) => {
        const putBody = {
          ownerId:
            this.ownerOrganization === undefined
              ? this.currentIndicatorDataset.ownerId
              : this.ownerOrganization,
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
              this.successMessagePart = this.currentIndicatorDataset.indicatorName;
              this.broadcastService.broadcast('refreshIndicatorOverviewTable', {
                crudType: 'edit',
                targetIndicatorId: this.currentIndicatorDataset.indicatorId,
              });
              this.showSuccessAlert();
              this.loadingData = false;
            },
            error: (error: any) => {
              this.errorMessagePart =
                'Fehler beim Aktualisieren der Metadaten-Eigentümerschaft. Fehler lautet: \n\n';
              if (error.data) {
                this.errorMessagePart += this.indicatorValueService.syntaxHighlightJSON(error.data);
              } else {
                this.errorMessagePart += this.indicatorValueService.syntaxHighlightJSON(error);
              }
              this.showErrorAlert();
              this.loadingData = false;
            },
          });
      });
    }
  }

  executeRequest_indicatorSpatialUnitRoles(): void {
    const putBody = {
      permissions: this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions_indicatorSpatialUnitTimeseries
      ),
      isPublic: this.targetApplicableSpatialUnit.isPublic,
    };

    this.loadingData = true;

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
          this.broadcastService.broadcast('refreshIndicatorOverviewTable', {
            crudType: 'edit',
            targetIndicatorId: this.currentIndicatorDataset.indicatorId,
          });
          this.showSuccessAlert();
          this.loadingData = false;
        },
        error: (error: any) => {
          this.errorMessagePart =
            'Fehler beim Aktualisieren der Zugriffsrechte auf Zeitreihe der Raumeinheit ' +
            this.targetApplicableSpatialUnit.spatialUnitName +
            '. Fehler lautet: \n\n';
          if (error.data) {
            this.errorMessagePart += this.indicatorValueService.syntaxHighlightJSON(error.data);
          } else {
            this.errorMessagePart += this.indicatorValueService.syntaxHighlightJSON(error);
          }
          this.showErrorAlert();
          this.loadingData = false;
        },
      });
  }

  onChangeSelectedSpatialUnit(_targetApplicableSpatialUnit: any): void {
    this.refreshRoleManagementTable_indicatorSpatialUnitTimeseries();
  }

  // Multi-step form navigation
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

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

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
