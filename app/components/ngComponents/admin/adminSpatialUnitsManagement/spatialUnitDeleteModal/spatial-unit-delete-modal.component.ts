import { Component, OnInit, OnDestroy, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';

declare const __env: any;

@Component({
  selector: 'app-spatial-unit-delete-modal',
  templateUrl: './spatial-unit-delete-modal.component.html',
  styleUrls: ['./spatial-unit-delete-modal.component.scss'],
  imports: [LoadingOverlayComponent],
  standalone: true,
})
export class SpatialUnitDeleteModalComponent implements OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  private http = inject(HttpClient);
  private broadcastService = inject(BroadcastService);

  @Input() datasetsToDelete: any[] = [];

  loadingData = false;
  errorMessage = '';
  successMessage = '';

  successfullyDeletedDatasets: any[] = [];
  failedDatasetsAndErrors: any[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.setupEventListeners();
    this.resetForm();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // Setup broadcast listeners
    const broadcastSubscription = this.broadcastService.currentBroadcastMsg.subscribe(
      (broadcastMsg) => {
        if (broadcastMsg && broadcastMsg.msg === 'onDeleteSpatialUnits') {
          const datasets = Array.isArray(broadcastMsg.values)
            ? broadcastMsg.values
            : [broadcastMsg.values];
          this.onDeleteSpatialUnits(datasets);
        }
      }
    );

    this.subscriptions.push(broadcastSubscription);
  }

  onDeleteSpatialUnits(datasets: any[]): void {
    this.loadingData = true;
    this.datasetsToDelete = datasets;
    this.resetForm();

    setTimeout(() => {
      this.loadingData = false;
    }, 100);
  }

  resetForm(): void {
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors = [];
    this.errorMessage = '';
    this.successMessage = '';
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

      if (this.failedDatasetsAndErrors.length > 0) {
        this.errorMessage = 'Einige Raumebenen konnten nicht gelöscht werden.';
      }

      if (this.successfullyDeletedDatasets.length > 0) {
        this.successMessage = `${this.successfullyDeletedDatasets.length} Raumebene(n) erfolgreich gelöscht.`;

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
      }

      this.loadingData = false;

      // Auto-close modal after successful deletion
      if (
        this.successfullyDeletedDatasets.length > 0 &&
        this.failedDatasetsAndErrors.length === 0
      ) {
        setTimeout(() => {
          this.activeModal.close({
            action: 'deleted',
            deletedDatasets: this.successfullyDeletedDatasets,
          });
        }, 2000);
      }
    } catch {
      this.errorMessage = 'Ein unerwarteter Fehler ist aufgetreten.';
      this.loadingData = false;
    }
  }

  hideSuccessAlert(): void {
    this.successMessage = '';
  }

  hideErrorAlert(): void {
    this.errorMessage = '';
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
