import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  // Signal-backed: written from HTTP subscribe callbacks and the
  // Promise.allSettled continuation, which would not trigger a re-render of
  // this OnPush component otherwise.
  loadingData = signal(false);
  successfullyDeletedDatasets = signal<any[]>([]);
  failedDatasetsAndErrors = signal<[any, string][]>([]);
  showSuccessAlert = signal(false);
  showErrorAlert = signal(false);

  ngOnInit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.successfullyDeletedDatasets.set([]);
    this.failedDatasetsAndErrors.set([]);
    this.showSuccessAlert.set(false);
    this.showErrorAlert.set(false);
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  deleteScripts(): void {
    if (this.datasetsToDelete.length === 0) return;

    this.loadingData.set(true);
    this.resetForm();

    const deletePromises = this.datasetsToDelete.map((dataset) =>
      this.getDeleteDatasetPromise(dataset)
    );

    Promise.allSettled(deletePromises).then(() => {
      if (this.failedDatasetsAndErrors().length > 0) {
        this.showErrorAlert.set(true);
      }
      if (this.successfullyDeletedDatasets().length > 0) {
        this.showSuccessAlert.set(true);

        const deletedIds = this.successfullyDeletedDatasets().map((d) => d.scriptId);
        this.refreshRequested.emit({ crudType: 'delete', scriptId: deletedIds });
      }
      this.loadingData.set(false);
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
            this.successfullyDeletedDatasets.update((datasets) => [...datasets, dataset]);
            resolve();
          },
          error: (error: any) => {
            const errorMsg = this.indicatorValueService.syntaxHighlightJSON
              ? this.indicatorValueService.syntaxHighlightJSON(error.error || error)
              : JSON.stringify(error.error || error);
            this.failedDatasetsAndErrors.update((entries) => [...entries, [dataset, errorMsg]]);
            resolve();
          },
        });
    });
  }

  hideSuccessAlert(): void {
    this.showSuccessAlert.set(false);
  }

  hideErrorAlert(): void {
    this.showErrorAlert.set(false);
  }
}
