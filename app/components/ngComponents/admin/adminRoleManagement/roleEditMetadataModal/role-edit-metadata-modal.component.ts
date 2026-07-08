import { Component, Input, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AdminRoleManagementService } from '../admin-role-management.service';
import { NotificationService } from '../../../common/notification/notification.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-role-edit-metadata-modal',
  templateUrl: './role-edit-metadata-modal.component.html',
  styleUrls: ['./role-edit-metadata-modal.component.scss'],
  imports: [FormsModule, LoadingOverlayComponent],
  standalone: true,
})
export class RoleEditMetadataModalComponent implements OnInit {
  private activeModal = inject(NgbActiveModal);
  private accessControlService = inject(AccessControlService);
  private adminRoleManagementService = inject(AdminRoleManagementService);
  private notificationSrvc = inject(NotificationService);

  @Input() currentDataset!: AccessControlMetadata;

  loadingData: boolean = false;
  nameInvalid: boolean = false;
  oldName: string = '';

  successMessagePart: string | undefined;
  errorMessagePart: string | undefined;
  keycloakErrorMessagePart: string | undefined;
  showErrorAlert: boolean = false;
  showKeycloakErrorAlert: boolean = false;

  ngOnInit(): void {
    this.oldName = this.currentDataset.name;
    this.resetAlerts();
  }

  resetAlerts(): void {
    this.successMessagePart = undefined;
    this.errorMessagePart = undefined;
    this.keycloakErrorMessagePart = undefined;
    this.showErrorAlert = false;
    this.showKeycloakErrorAlert = false;
  }

  checkName(): void {
    this.nameInvalid = this.accessControlService.accessControl.some(
      (ou) =>
        ou.name === this.currentDataset.name &&
        ou.organizationalUnitId !== this.currentDataset.organizationalUnitId
    );
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  editMetadata() {
    if (this.nameInvalid) return;

    this.resetAlerts();
    this.loadingData = true;

    this.adminRoleManagementService
      .editOrganizationalUnit(this.currentDataset, this.oldName)
      .subscribe((res) => {
        if (res.success) {
          this.successMessagePart = this.currentDataset.name;
          this.notificationSrvc.showSuccess(
            `Metadaten von '${this.successMessagePart}' erfolgreich gespeichert.`
          );

          if (res.keycloakErrorMessagePart) {
            this.keycloakErrorMessagePart = res.keycloakErrorMessagePart;
            this.showKeycloakErrorAlert = true;
          } else {
            this.notificationSrvc.showSuccess(
              `Keycloak-Rollen für '${this.successMessagePart}' erfolgreich aktualisiert.`
            );
          }

          this.loadingData = false;
          this.activeModal.close(true);
        } else {
          this.errorMessagePart = res.errorMessagePart;
          this.showErrorAlert = true;
          this.loadingData = false;
        }
      });
  }
}
