import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';

import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';
import { ScriptRefreshRequest } from '../script-refresh.model';

@Component({
  selector: 'app-script-delete-modal',
  templateUrl: './script-delete-modal.component.html',
  imports: [],
  standalone: true,
})
export class ScriptDeleteModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private http = inject(HttpClient);
  private indicatorValueService = inject(IndicatorValueService);
  private envConfigService = inject(EnvConfigService);

  @Input() datasetsToDelete: any[] = [];

  // Asks the management component to refresh the overview table; replaces the
  // former RefreshScriptOverviewTable broadcast round-trip.
  @Output() refreshRequested = new EventEmitter<ScriptRefreshRequest>();

  loadingData: boolean = false;
  successfullyDeletedDatasets: any[] = [];
  failedDatasetsAndErrors: [any, string][] = [];
  showSuccessAlert: boolean = false;
  showErrorAlert: boolean = false;

  ngOnInit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors = [];
    this.showSuccessAlert = false;
    this.showErrorAlert = false;
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  deleteScripts(): void {
    if (this.datasetsToDelete.length === 0) return;

    this.loadingData = true;
    this.resetForm();

    const deletePromises = this.datasetsToDelete.map((dataset) =>
      this.getDeleteDatasetPromise(dataset)
    );

    Promise.allSettled(deletePromises).then(() => {
      if (this.failedDatasetsAndErrors.length > 0) {
        this.showErrorAlert = true;
      }
      if (this.successfullyDeletedDatasets.length > 0) {
        this.showSuccessAlert = true;

        const deletedIds = this.successfullyDeletedDatasets.map((d) => d.scriptId);
        this.refreshRequested.emit({ crudType: 'delete', scriptId: deletedIds });
      }
      this.loadingData = false;
    });
  }

  private getDeleteDatasetPromise(dataset: any): Promise<void> {
    return new Promise((resolve) => {
      this.http
        .delete(
          this.envConfigService.baseUrlToKomMonitorDataAPI + '/process-scripts/' + dataset.scriptId
        )
        .subscribe({
          next: () => {
            this.successfullyDeletedDatasets.push(dataset);
            resolve();
          },
          error: (error: any) => {
            const errorMsg = this.indicatorValueService.syntaxHighlightJSON
              ? this.indicatorValueService.syntaxHighlightJSON(error.error || error)
              : JSON.stringify(error.error || error);
            this.failedDatasetsAndErrors.push([dataset, errorMsg]);
            resolve();
          },
        });
    });
  }

  hideSuccessAlert(): void {
    this.showSuccessAlert = false;
  }

  hideErrorAlert(): void {
    this.showErrorAlert = false;
  }
}
