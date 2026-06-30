import { Component, OnInit, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { HttpClient } from '@angular/common/http';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';

declare const __env: any;

@Component({
  selector: 'app-spatial-unit-delete-modal',
  templateUrl: './spatial-unit-delete-modal.component.html',
  styleUrls: ['./spatial-unit-delete-modal.component.scss'],
  imports: [LoadingOverlayComponent],
  standalone: true,
})
export class SpatialUnitDeleteModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  private http = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  private notificationService = inject(NotificationService);

  @Input() datasetsToDelete: any[] = [];

  loadingData = false;

  successfullyDeletedDatasets: any[] = [];
  failedDatasetsAndErrors: any[] = [];

  ngOnInit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors = [];
  }

  async deleteSpatialUnits(): Promise<void> {
    this.loadingData = true;
    this.resetForm();

    try {
      // Use service method for bulk deletion
      const spatialUnitIds = this.datasetsToDelete.map((dataset) => dataset.spatialUnitId);
      const result =
        await this.kommonitorDataExchangeService.bulkDeleteSpatialUnits(spatialUnitIds);

      // Process results
      this.successfullyDeletedDatasets = this.datasetsToDelete.filter((dataset) =>
        result.successful.includes(dataset.spatialUnitId)
      );

      this.failedDatasetsAndErrors = result.failed.map((failure) => {
        const dataset = this.datasetsToDelete.find((d) => d.spatialUnitId === failure.id);
        return [dataset, failure.error];
      });

      if (this.successfullyDeletedDatasets.length > 0) {
        // Fetch indicator metadata again as spatial units were deleted
        await this.kommonitorDataExchangeService.fetchIndicatorsMetadata(
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles
        );

        // Refresh spatial unit overview table
        const deletedIds = this.successfullyDeletedDatasets.map((dataset) => dataset.spatialUnitId);
        this.broadcastService.broadcast(BroadcastMessage.RefreshSpatialUnitOverviewTable, {
          crudType: 'delete',
          targetSpatialUnitId: deletedIds,
        });

        // Refresh all admin dashboard diagrams due to modified metadata
        setTimeout(() => {
          this.broadcastService.broadcast(BroadcastMessage.RefreshAdminDashboardDiagrams);
        }, 500);

        this.notificationService.showSuccess(
          `${this.successfullyDeletedDatasets.length} Raumebene(n) erfolgreich gelöscht.`
        );
      }

      if (this.failedDatasetsAndErrors.length > 0) {
        this.notificationService.showError('Einige Raumebenen konnten nicht gelöscht werden.');
      }

      this.loadingData = false;

      // Close only when everything succeeded; otherwise keep the modal open so
      // the per-dataset failure table stays visible.
      if (
        this.successfullyDeletedDatasets.length > 0 &&
        this.failedDatasetsAndErrors.length === 0
      ) {
        this.activeModal.close({
          action: 'deleted',
          deletedDatasets: this.successfullyDeletedDatasets,
        });
      }
    } catch {
      this.notificationService.showError('Ein unerwarteter Fehler ist aufgetreten.');
      this.loadingData = false;
    }
  }

  // Modal control methods
  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }

  // Helper methods
  get hasValidDatasets(): boolean {
    return this.datasetsToDelete && this.datasetsToDelete.length > 0;
  }

  get canDelete(): boolean {
    return this.hasValidDatasets && !this.loadingData;
  }
}
