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
import { HttpClient } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { forkJoin, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { GeoresourceRefreshRequest } from '../georesource-refresh.model';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
interface AffectedScript {
  scriptId: string;
  name: string;
  description: string;
  indicatorId: string;
}

interface AffectedIndicatorReference {
  indicatorMetadata: {
    indicatorId: string;
    indicatorName: string;
    characteristicValue: string;
    indicatorType: string;
    description: string;
  };
  georesourceReference: {
    referencedGeoresourceId: string;
    referencedGeoresourceName: string;
    referencedGeoresourceDescription: string;
  };
}

@Component({
  selector: 'app-georesource-delete-modal',
  templateUrl: './georesource-delete-modal.component.html',
  styleUrls: ['./georesource-delete-modal.component.scss'],
  imports: [LoadingOverlayComponent, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoresourceDeleteModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private envConfigService = inject(EnvConfigService);
  private indicatorValueService = inject(IndicatorValueService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private http = inject(HttpClient);

  @Input() datasetsToDelete: GeoresourcesDataset[] = [];

  /** Emitted after deletion so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<GeoresourceRefreshRequest>();

  // Signals: written from the async delete pipeline (OnPush).
  loadingData = signal(false);

  successfullyDeletedDatasets: GeoresourcesDataset[] = [];
  failedDatasetsAndErrors = signal<[GeoresourcesDataset, string][]>([]);

  affectedScripts: AffectedScript[] = [];
  affectedIndicatorReferences: AffectedIndicatorReference[] = [];

  ngOnInit(): void {
    this.resetGeoresourcesDeleteForm();
  }

  resetGeoresourcesDeleteForm(): void {
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors.set([]);
    this.affectedScripts = this.gatherAffectedScripts();
    this.affectedIndicatorReferences = this.gatherAffectedIndicatorReferences();
  }

  gatherAffectedScripts(): AffectedScript[] {
    const affectedScripts: AffectedScript[] = [];

    this.datasetsToDelete.forEach((dataset) => {
      this.processScriptStore.availableProcessScripts.forEach((script) => {
        if (script.requiredGeoresourceIds?.includes(dataset.georesourceId)) {
          affectedScripts.push({
            scriptId: script.scriptId,
            name: script.name,
            description: script.description,
            indicatorId: script.indicatorId,
          });
        }
      });
    });

    return affectedScripts;
  }

  gatherAffectedIndicatorReferences(): AffectedIndicatorReference[] {
    const affectedIndicatorReferences: AffectedIndicatorReference[] = [];

    this.datasetsToDelete.forEach((dataset) => {
      this.indicatorStore.availableIndicators.forEach((indicator) => {
        indicator.referencedGeoresources?.forEach((georesourceReference: any) => {
          if (georesourceReference.referencedGeoresourceId === dataset.georesourceId) {
            affectedIndicatorReferences.push({
              indicatorMetadata: {
                indicatorId: indicator.indicatorId,
                indicatorName: indicator.indicatorName,
                characteristicValue: indicator.characteristicValue,
                indicatorType: indicator.indicatorType,
                description: indicator.metadata?.description,
              } as AffectedIndicatorReference['indicatorMetadata'],
              georesourceReference: georesourceReference,
            });
          }
        });
      });
    });

    return affectedIndicatorReferences;
  }

  deleteGeoresources(): void {
    this.loadingData.set(true);

    const deletePromises = this.datasetsToDelete.map((dataset) =>
      this.getDeleteDatasetPromise(dataset)
    );

    forkJoin(deletePromises).subscribe({
      next: (_results) => {
        console.log('All delete operations completed');
        this.handleDeleteResults();
      },
      error: (error) => {
        console.error('Error in delete operations:', error);
        this.handleDeleteResults();
      },
    });
  }

  private getDeleteDatasetPromise(dataset: GeoresourcesDataset) {
    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/georesources/${dataset.georesourceId}`;

    return this.http.delete(url).pipe(
      tap((_response) => {
        this.successfullyDeletedDatasets.push(dataset);

        // Remove entry from the store (keeps the id-map in sync and notifies reactive consumers)
        this.georesourceStore.deleteSingleGeoresourceMetadata(dataset.georesourceId);
      }),
      catchError((error) => {
        console.error(`Failed to delete georesource ${dataset.georesourceId}:`, error);
        const errorMessage = error.error
          ? this.indicatorValueService.syntaxHighlightJSON(error.error)
          : this.indicatorValueService.syntaxHighlightJSON(error);
        this.failedDatasetsAndErrors.update((failures) => [...failures, [dataset, errorMessage]]);

        // Return a resolved observable so forkJoin continues
        return of(null);
      })
    );
  }

  private handleDeleteResults(): void {
    if (this.successfullyDeletedDatasets.length > 0) {
      // Refresh overview table
      this.refreshRequested.emit({
        crudType: 'delete',
        targetGeoresourceId: this.successfullyDeletedDatasets.map(
          (dataset) => dataset.georesourceId
        ),
      });

      this.notificationService.showSuccess(
        this.translate.instant('ADMIN_GEORESOURCES.DELETE_MODAL.MSG.DELETED', {
          count: this.successfullyDeletedDatasets.length,
        })
      );
    }

    if (this.failedDatasetsAndErrors().length > 0) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_GEORESOURCES.DELETE_MODAL.MSG.SOME_FAILED')
      );
    }

    this.loadingData.set(false);

    // Close only when everything succeeded; otherwise keep the modal open so
    // the per-dataset failure table stays visible.
    if (
      this.successfullyDeletedDatasets.length > 0 &&
      this.failedDatasetsAndErrors().length === 0
    ) {
      this.activeModal.close({
        action: 'deleted',
        deletedDatasets: this.successfullyDeletedDatasets,
      });
    }
  }

  // Filter methods for template
  getPoiDatasets(): GeoresourcesDataset[] {
    return this.datasetsToDelete.filter((dataset) => dataset.isPOI);
  }

  getLoiDatasets(): GeoresourcesDataset[] {
    return this.datasetsToDelete.filter((dataset) => dataset.isLOI);
  }

  getAoiDatasets(): GeoresourcesDataset[] {
    return this.datasetsToDelete.filter((dataset) => dataset.isAOI);
  }

  // TrackBy function for *ngFor
  trackByIndex(index: number, _item: any): number {
    return index;
  }

  // Modal control
  cancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
