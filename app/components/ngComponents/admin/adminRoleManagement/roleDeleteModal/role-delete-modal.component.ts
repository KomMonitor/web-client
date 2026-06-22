import { Component, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AccessControlMetadata } from "services/adminSpatialUnit/kommonitor-data-exchange.service";
import { forkJoin } from "rxjs";
import { AdminRoleManagementService } from "../admin-role-management.service";
import { NotificationService } from "../../../common/notification/notification.service";
import { LoadingOverlayComponent } from "components/ngComponents/common/loading-overlay/loading-overlay.component";

@Component({
  selector: "app-role-delete-modal",
  templateUrl: "./role-delete-modal.component.html",
  imports: [CommonModule, LoadingOverlayComponent],
  standalone: true,
})
export class RoleDeleteModalComponent implements OnInit {
  @Input() datasetsToDelete: AccessControlMetadata[] = [];

  deletingInProgress: boolean = false;
  failedDatasetsAndErrors: [AccessControlMetadata, string][] = [];

  readonly PROTECTED_NAMES = ["public", "kommonitor"];

  constructor(
    public activeModal: NgbActiveModal,
    private notificationService: NotificationService,
    private roleMgmgSrvc: AdminRoleManagementService,
  ) {}

  ngOnInit(): void {
    // Filter out protected entries and warn user
    const original = this.datasetsToDelete.length;
    this.datasetsToDelete = this.datasetsToDelete.filter(
      (ou) => !this.PROTECTED_NAMES.includes(ou.name),
    );
    if (this.datasetsToDelete.length < original) {
      this.failedDatasetsAndErrors.push([
        {
          organizationalUnitId: "",
          name: "public / kommonitor",
          permissions: [],
        },
        "System-Organisationseinheiten können nicht gelöscht werden! Die betroffene Einheit wurde aus der Liste entfernt.",
      ]);
    }
  }

  close(): void {
    this.activeModal.dismiss("closed");
  }

  hasChildrenConflict(): boolean {
    return this.datasetsToDelete.some(
      (ou) => ou.children && ou.children.length > 0,
    );
  }

  deleteOrganizationalUnits(): void {
    if (this.datasetsToDelete.length === 0) return;

    this.deletingInProgress = true;
    this.failedDatasetsAndErrors = [];

    const deletionsObs = this.datasetsToDelete.map((dataset) =>
      this.roleMgmgSrvc.deleteOrganizationalUnit(dataset),
    );

    forkJoin(deletionsObs).subscribe((results) => {
      results.forEach((res) => {
        if (res.success) {
          this.notificationService.showSuccess(
            `Die Organisationseinheit "${res.dataset.name}" wurde erfolgreich gelöscht.`,
          );
        } else {
          this.failedDatasetsAndErrors.push([
            res.dataset,
            res.error || JSON.stringify(res),
          ]);
        }
      });

      this.deletingInProgress = false;

      if (this.failedDatasetsAndErrors.length === 0) {
        this.activeModal.close(true);
      }
    });
  }
}
