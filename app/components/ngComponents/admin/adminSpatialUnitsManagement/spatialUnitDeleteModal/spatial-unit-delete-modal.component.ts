import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription, forkJoin } from 'rxjs';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';

declare const $: any;
declare const __env: any;

@Component({
  selector: 'spatial-unit-delete-modal-new',
  templateUrl: './spatial-unit-delete-modal.component.html',
  styleUrls: ['./spatial-unit-delete-modal.component.css']
})
export class SpatialUnitDeleteModalComponent implements OnInit, OnDestroy {
  @Input() datasetsToDelete: any[] = [];

  loadingData = false;
  errorMessage = '';
  successMessage = '';
  
  successfullyDeletedDatasets: any[] = [];
  failedDatasetsAndErrors: any[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) {
    console.log('SpatialUnitDeleteModalComponent constructor initialized');
  }

  ngOnInit(): void {
    this.setupEventListeners();
    this.resetForm();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // Setup broadcast listeners
    const broadcastSubscription = this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      if (broadcastMsg && broadcastMsg.msg === 'onDeleteSpatialUnits') {
        const datasets = Array.isArray(broadcastMsg.values) ? broadcastMsg.values : [broadcastMsg.values];
        this.onDeleteSpatialUnits(datasets);
      }
    });

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

    const deleteRequests = this.datasetsToDelete.map(dataset => 
      this.getDeleteDatasetRequest(dataset)
    );

    try {
      await Promise.allSettled(deleteRequests);

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
        const deletedIds = this.successfullyDeletedDatasets.map(dataset => dataset.spatialUnitId);
        this.broadcastService.broadcast('refreshSpatialUnitOverviewTable', ['delete', deletedIds]);

        // Refresh all admin dashboard diagrams due to modified metadata
        setTimeout(() => {
          this.broadcastService.broadcast('refreshAdminDashboardDiagrams');
        }, 500);
      }

      this.loadingData = false;

      // Auto-close modal after successful deletion
      if (this.successfullyDeletedDatasets.length > 0 && this.failedDatasetsAndErrors.length === 0) {
        setTimeout(() => {
          this.activeModal.close({ 
            action: 'deleted', 
            deletedDatasets: this.successfullyDeletedDatasets 
          });
        }, 2000);
      }

    } catch (error) {
      console.error('Error during bulk deletion:', error);
      this.errorMessage = 'Ein unerwarteter Fehler ist aufgetreten.';
      this.loadingData = false;
    }
  }

  private async getDeleteDatasetRequest(dataset: any): Promise<void> {
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${dataset.spatialUnitId}`;

    try {
      await this.http.delete(url).toPromise();
      
      // Add to successful deletions
      this.successfullyDeletedDatasets.push(dataset);

      // Remove from available spatial units
      const index = this.kommonitorDataExchangeService.availableSpatialUnits.findIndex(
        (spatialUnit: any) => spatialUnit.spatialUnitId === dataset.spatialUnitId
      );

      if (index > -1) {
        this.kommonitorDataExchangeService.availableSpatialUnits.splice(index, 1);
      }

    } catch (error) {
      console.error(`Failed to delete spatial unit ${dataset.spatialUnitLevel}:`, error);
      
      const errorMessage = error && (error as any).error ? 
        this.kommonitorDataExchangeService.syntaxHighlightJSON((error as any).error) :
        this.kommonitorDataExchangeService.syntaxHighlightJSON(error);

      this.failedDatasetsAndErrors.push([dataset, errorMessage]);
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