import { Component, Input, OnDestroy, OnInit, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'script-delete-modal-new',
  templateUrl: './script-delete-modal.component.html',
  styleUrls: ['./script-delete-modal.component.css']
})
export class ScriptDeleteModalComponent implements OnInit, OnDestroy {
  @Input() datasetsToDelete: any[] = [];

  loadingData: boolean = false;
  successfullyDeletedDatasets: any[] = [];
  failedDatasetsAndErrors: Array<[any, any]> = [];
  successMessage: string = '';
  errorMessage: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    private broadcastService: BroadcastService,
    @Inject('kommonitorDataExchangeService') private angularJsDataExchangeService: any
  ) {}

  ngOnInit(): void {
    this.resetScriptsDeleteForm();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  onDeleteScripts(datasets: any[]): void {
    this.datasetsToDelete = Array.isArray(datasets) ? datasets : [];
    this.resetScriptsDeleteForm();
  }

  resetScriptsDeleteForm(): void {
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors = [];
    this.successMessage = '';
    this.errorMessage = '';
  }

  async deleteScripts(): Promise<void> {
    this.loadingData = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors = [];

    const baseUrl: string = this.angularJsDataExchangeService?.baseUrlToKomMonitorDataAPI || '';
    const deletePromises = (this.datasetsToDelete || []).map(async (dataset: any) => {
      const id = dataset?.scriptId;
      if (!id) { return; }
      try {
        await firstValueFrom(this.http.delete(`${baseUrl}/process-scripts/${id}`));
        this.successfullyDeletedDatasets.push(dataset);
      } catch (error: any) {
        const errorPayload = error?.error ? error.error : error;
        this.failedDatasetsAndErrors.push([dataset, errorPayload]);
      }
    });

    await Promise.all(deletePromises);

    if (this.failedDatasetsAndErrors.length > 0) {
      this.errorMessage = 'Einige Skripte konnten nicht gelöscht werden.';
    }
    if (this.successfullyDeletedDatasets.length > 0) {
      this.successMessage = `${this.successfullyDeletedDatasets.length} Skript(e) erfolgreich gelöscht.`;

      // Refresh script overview table
      const deletedIds = this.successfullyDeletedDatasets.map(d => d.scriptId);
      this.broadcastService.broadcast('refreshScriptOverviewTable', { crudType: 'delete', scriptId: deletedIds });

      // Refresh all admin dashboard diagrams due to modified metadata
      setTimeout(() => {
        this.broadcastService.broadcast('refreshAdminDashboardDiagrams');
      }, 300);
    }

    this.loadingData = false;

    // Auto-close modal if all successful and none failed
    if (this.successfullyDeletedDatasets.length > 0 && this.failedDatasetsAndErrors.length === 0) {
      setTimeout(() => {
        this.activeModal.close({ action: 'deleted', deleted: this.successfullyDeletedDatasets });
      }, 1200);
    }
  }

  hideSuccessAlert(): void {
    this.successMessage = '';
  }

  hideErrorAlert(): void {
    this.errorMessage = '';
  }

  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }
}


