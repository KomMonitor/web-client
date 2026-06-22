import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription, forkJoin } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';

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
  styleUrls: ['./georesource-delete-modal.component.css'],
  imports: [LoadingOverlayComponent],
  standalone: true,
})
export class GeoresourceDeleteModalComponent implements OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);
  kommonitorDataExchangeService = inject<any>('kommonitorDataExchangeService' as any);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);

  datasetsToDelete: any[] = [];
  loadingData: boolean = false;

  successfullyDeletedDatasets: any[] = [];
  failedDatasetsAndErrors: [any, string][] = [];

  affectedScripts: AffectedScript[] = [];
  affectedIndicatorReferences: AffectedIndicatorReference[] = [];

  // Alert states
  showSuccessAlert: boolean = false;
  showErrorAlert: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor() {
    console.log('GeoresourceDeleteModalComponent constructor initialized');
  }

  ngOnInit(): void {
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private setupEventListeners(): void {
    // Listen for broadcast events
    const deleteSubscription = this.broadcastService.currentBroadcastMsg.subscribe(
      (broadcastMsg) => {
        if (broadcastMsg.msg === 'onDeleteGeoresources') {
          this.onDeleteGeoresources(
            Array.isArray(broadcastMsg.values) ? broadcastMsg.values : [broadcastMsg.values]
          );
        }
      }
    );
    this.subscriptions.push(deleteSubscription);
  }

  onDeleteGeoresources(datasets: any[]): void {
    console.log('onDeleteGeoresources called with datasets:', datasets);
    this.loadingData = true;
    this.datasetsToDelete = datasets;
    this.resetGeoresourcesDeleteForm();

    setTimeout(() => {
      this.loadingData = false;
    }, 250);
  }

  resetGeoresourcesDeleteForm(): void {
    console.log('Resetting delete form');
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors = [];
    this.affectedScripts = this.gatherAffectedScripts();
    this.affectedIndicatorReferences = this.gatherAffectedIndicatorReferences();
    this.hideSuccessAlert();
    this.hideErrorAlert();
  }

  gatherAffectedScripts(): AffectedScript[] {
    const affectedScripts: AffectedScript[] = [];

    if (this.kommonitorDataExchangeService && this.kommonitorDataExchangeService.availableScripts) {
      this.datasetsToDelete.forEach((dataset) => {
        this.kommonitorDataExchangeService.availableScripts.forEach((script: any) => {
          if (script.requiredGeoresources) {
            script.requiredGeoresources.forEach((requiredGeoresource: any) => {
              if (requiredGeoresource.referencedGeoresourceId === dataset.georesourceId) {
                affectedScripts.push({
                  scriptId: script.scriptId,
                  name: script.name,
                  description: script.description,
                  indicatorId: script.indicatorId,
                });
              }
            });
          }
        });
      });
    }

    return affectedScripts;
  }

  gatherAffectedIndicatorReferences(): AffectedIndicatorReference[] {
    const affectedIndicatorReferences: AffectedIndicatorReference[] = [];

    if (
      this.kommonitorDataExchangeService &&
      this.kommonitorDataExchangeService.availableIndicators
    ) {
      this.datasetsToDelete.forEach((dataset) => {
        this.kommonitorDataExchangeService.availableIndicators.forEach((indicator: any) => {
          if (indicator.referencedGeoresources) {
            indicator.referencedGeoresources.forEach((georesourceReference: any) => {
              if (georesourceReference.referencedGeoresourceId === dataset.georesourceId) {
                affectedIndicatorReferences.push({
                  indicatorMetadata: {
                    indicatorId: indicator.indicatorId,
                    indicatorName: indicator.indicatorName,
                    characteristicValue: indicator.characteristicValue,
                    indicatorType: indicator.indicatorType,
                    description: indicator.description,
                  },
                  georesourceReference: georesourceReference,
                });
              }
            });
          }
        });
      });
    }

    return affectedIndicatorReferences;
  }

  deleteGeoresources(): void {
    console.log('Starting deletion of georesources');
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

  private getDeleteDatasetPromise(dataset: any) {
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/georesources/${dataset.georesourceId}`;

    return this.http.delete(url).pipe(
      tap((_response) => {
        console.log(`Successfully deleted georesource ${dataset.georesourceId}`);
        this.successfullyDeletedDatasets.push(dataset);

        // Remove entry from array
        const index = this.kommonitorDataExchangeService.availableGeoresources.findIndex(
          (geo: any) => geo.georesourceId === dataset.georesourceId
        );

        if (index > -1) {
          this.kommonitorDataExchangeService.availableGeoresources.splice(index, 1);
        }
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
      this.broadcastService.broadcast('refreshGeoresourceOverviewTable', {
        crudType: 'delete',
        targetIds: this.successfullyDeletedDatasets.map((dataset) => dataset.georesourceId),
      });

      // Refresh admin dashboard diagrams
      setTimeout(() => {
        this.broadcastService.broadcast('refreshAdminDashboardDiagrams', null);
      }, 500);
    }

    setTimeout(() => {
      this.loadingData = false;
    }, 500);
  }

  // Filter methods for template
  getPoiDatasets(): any[] {
    return this.datasetsToDelete.filter((dataset) => dataset.isPOI);
  }

  getLoiDatasets(): any[] {
    return this.datasetsToDelete.filter((dataset) => dataset.isLOI);
  }

  getAoiDatasets(): any[] {
    return this.datasetsToDelete.filter((dataset) => dataset.isAOI);
  }

  getSuccessfulPoiDatasets(): any[] {
    return this.successfullyDeletedDatasets.filter((dataset) => dataset.isPOI);
  }

  getSuccessfulLoiDatasets(): any[] {
    return this.successfullyDeletedDatasets.filter((dataset) => dataset.isLOI);
  }

  getSuccessfulAoiDatasets(): any[] {
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
