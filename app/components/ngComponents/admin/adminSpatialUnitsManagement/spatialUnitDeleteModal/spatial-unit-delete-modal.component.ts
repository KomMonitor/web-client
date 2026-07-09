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
import { SpatialUnitRefreshRequest } from '../spatial-unit-refresh.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SpatialUnitOverviewType as SpatialUnitMetadata } from 'models/data-management-api';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-spatial-unit-delete-modal',
  templateUrl: './spatial-unit-delete-modal.component.html',
  styleUrls: ['./spatial-unit-delete-modal.component.scss'],
  imports: [LoadingOverlayComponent, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialUnitDeleteModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private accessControlService = inject(AccessControlService);
  private envConfigService = inject(EnvConfigService);
  private indicatorValueService = inject(IndicatorValueService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  @Input() datasetsToDelete: SpatialUnitMetadata[] = [];

  /** Emitted after deletion so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();

  // Signals: written across await boundaries during the bulk delete, which
  // would not re-render an OnPush component via plain fields.
  loadingData = signal(false);

  successfullyDeletedDatasets = signal<SpatialUnitMetadata[]>([]);
  failedDatasetsAndErrors = signal<any[]>([]);

  ngOnInit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.successfullyDeletedDatasets.set([]);
    this.failedDatasetsAndErrors.set([]);
  }

  async deleteSpatialUnits(): Promise<void> {
    this.loadingData.set(true);
    this.resetForm();

    try {
      const spatialUnitIds = this.datasetsToDelete.map((dataset) => dataset.spatialUnitId);
      const result = await this.bulkDeleteSpatialUnits(spatialUnitIds);

      // Process results
      this.successfullyDeletedDatasets.set(
        this.datasetsToDelete.filter((dataset) => result.successful.includes(dataset.spatialUnitId))
      );

      this.failedDatasetsAndErrors.set(
        result.failed.map((failure) => {
          const dataset = this.datasetsToDelete.find((d) => d.spatialUnitId === failure.id);
          return [dataset, failure.error];
        })
      );

      if (this.successfullyDeletedDatasets().length > 0) {
        // Fetch indicator metadata again as spatial units were deleted
        await this.metadataBootstrap.fetchIndicatorsMetadata(
          this.accessControlService.currentKeycloakLoginRoles
        );

        // Refresh spatial unit overview table
        const deletedIds = this.successfullyDeletedDatasets().map(
          (dataset) => dataset.spatialUnitId
        );
        this.refreshRequested.emit({
          crudType: 'delete',
          targetSpatialUnitId: deletedIds,
        });

        this.notificationService.showSuccess(
          `${this.successfullyDeletedDatasets().length} Raumebene(n) erfolgreich gelöscht.`
        );
      }

      if (this.failedDatasetsAndErrors().length > 0) {
        this.notificationService.showError('Einige Raumebenen konnten nicht gelöscht werden.');
      }

      this.loadingData.set(false);

      // Close only when everything succeeded; otherwise keep the modal open so
      // the per-dataset failure table stays visible.
      if (
        this.successfullyDeletedDatasets().length > 0 &&
        this.failedDatasetsAndErrors().length === 0
      ) {
        this.activeModal.close({
          action: 'deleted',
          deletedDatasets: this.successfullyDeletedDatasets(),
        });
      }
    } catch {
      this.notificationService.showError('Ein unerwarteter Fehler ist aufgetreten.');
      this.loadingData.set(false);
    }
  }

  /**
   * Delete the given spatial units one by one (moved here from the former
   * data-exchange god service; this modal is the only consumer). Successful
   * deletions are removed from the canonical store.
   */
  private async bulkDeleteSpatialUnits(spatialUnitIds: string[]): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of spatialUnitIds) {
      try {
        await firstValueFrom(
          this.http.delete(
            `${this.envConfigService.baseUrlToKomMonitorDataAPI}/spatial-units/${id}`
          )
        );
        successful.push(id);
        this.spatialUnitStore.deleteSingleSpatialUnitMetadata(id);
      } catch (error) {
        failed.push({ id, error: this.indicatorValueService.formatError(error) });
      }
    }

    return { successful, failed };
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
    return this.hasValidDatasets && !this.loadingData();
  }
}
