import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { forkJoin, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { GeoresourceRefreshRequest } from '../georesource-refresh.model';

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
  imports: [LoadingOverlayComponent],
  standalone: true,
})
export class GeoresourceDeleteModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  // Formerly a broken string-token inject ('kommonitorDataExchangeService') that
  // threw a NullInjectorError on modal open; wired to the real services now.
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private http = inject(HttpClient);

  @Input() datasetsToDelete: GeoresourcesDataset[] = [];

  /** Emitted after deletion so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<GeoresourceRefreshRequest>();

  loadingData: boolean = false;

  successfullyDeletedDatasets: GeoresourcesDataset[] = [];
  failedDatasetsAndErrors: [GeoresourcesDataset, string][] = [];

  affectedScripts: AffectedScript[] = [];
  affectedIndicatorReferences: AffectedIndicatorReference[] = [];

  // Alert states
  showSuccessAlert: boolean = false;
  showErrorAlert: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  ngOnInit(): void {
    this.resetGeoresourcesDeleteForm();
  }

  resetGeoresourcesDeleteForm(): void {
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors = [];
    this.affectedScripts = this.gatherAffectedScripts();
    this.affectedIndicatorReferences = this.gatherAffectedIndicatorReferences();
    this.hideSuccessAlert();
    this.hideErrorAlert();
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
    this.loadingData = true;

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
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/georesources/${dataset.georesourceId}`;

    return this.http.delete(url).pipe(
      tap((_response) => {
        this.successfullyDeletedDatasets.push(dataset);

        // Remove entry from the store (keeps the id-map in sync and notifies reactive consumers)
        this.georesourceStore.deleteSingleGeoresourceMetadata(dataset.georesourceId);
      }),
      catchError((error) => {
        console.error(`Failed to delete georesource ${dataset.georesourceId}:`, error);
        const errorMessage = error.error
          ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error)
          : this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        this.failedDatasetsAndErrors.push([dataset, errorMessage]);

        // Return a resolved observable so forkJoin continues
        return of(null);
      })
    );
  }

  private handleDeleteResults(): void {
    if (this.failedDatasetsAndErrors.length > 0) {
      this.showErrorAlert = true;
      this.errorMessage = 'Löschen gescheitert';
    }

    if (this.successfullyDeletedDatasets.length > 0) {
      this.showSuccessAlert = true;
      this.successMessage =
        'Folgende Georessourcen sowie assoziierte Indikatorenreferenzen und Skripte wurden erfolgreich gelöscht';

      // Refresh overview table
      this.refreshRequested.emit({
        crudType: 'delete',
        targetGeoresourceId: this.successfullyDeletedDatasets.map(
          (dataset) => dataset.georesourceId
        ),
      });
    }

    setTimeout(() => {
      this.loadingData = false;
    }, 500);
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

  getSuccessfulPoiDatasets(): GeoresourcesDataset[] {
    return this.successfullyDeletedDatasets.filter((dataset) => dataset.isPOI);
  }

  getSuccessfulLoiDatasets(): GeoresourcesDataset[] {
    return this.successfullyDeletedDatasets.filter((dataset) => dataset.isLOI);
  }

  getSuccessfulAoiDatasets(): GeoresourcesDataset[] {
    return this.successfullyDeletedDatasets.filter((dataset) => dataset.isAOI);
  }

  // Alert methods
  hideSuccessAlert(): void {
    this.showSuccessAlert = false;
  }

  hideErrorAlert(): void {
    this.showErrorAlert = false;
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
