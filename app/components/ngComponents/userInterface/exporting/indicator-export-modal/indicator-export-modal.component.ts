import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, finalize, switchMap } from 'rxjs';
import {
  ExportResponse,
  ExportingService,
  SingleExportParams,
} from 'services/exporting/exporting.service';
import { NotificationService } from '../../../common/notification/notification.service';
import { EpsgSelectorComponent } from '../epsg-selector/epsg-selector.component';
import { ExportIndicatorCardComponent } from '../export-indicator-card/export-indicator-card.component';
import { buildTargetTime, mapFormats } from '../export-mapping';
import { ExportFormat, Indicator, IndicatorExportItem } from '../models';

/**
 * Slim, self-contained export dialog for the single currently selected indicator (opened from
 * the legend). It keeps its own local IndicatorExportItem and never touches the shared,
 * persisted ExportingStateService, so it does not pollute the combined export basket.
 */
@Component({
  selector: 'app-indicator-export-modal',
  templateUrl: './indicator-export-modal.component.html',
  styleUrls: ['./indicator-export-modal.component.scss'],
  standalone: true,
  imports: [ExportIndicatorCardComponent, EpsgSelectorComponent],
})
export class IndicatorExportModalComponent implements OnInit {
  private http = inject(HttpClient);
  activeModal = inject(NgbActiveModal);
  private exportSrvc = inject(ExportingService);
  private notificationSrvc = inject(NotificationService);

  /** The indicator to export, set by the opener via `modalRef.componentInstance.indicator`. */
  @Input({ required: true }) indicator!: Indicator;

  /** Optional spatial unit id to pre-select (e.g. the one currently active in the legend). */
  @Input() preselectedSpatialUnitId?: string;

  item = signal<IndicatorExportItem>({
    dataset: { id: '', name: '', spatialUnits: [], availableTimestamps: [] },
    selectedFormats: [],
    selectedSpatialUnitIds: [],
  });

  private selectedEpsgCode = signal<number | null>(4326);

  isLoading = signal(false);

  isValid = computed(() => {
    const item = this.item();
    return item.selectedSpatialUnitIds.length > 0 && item.selectedFormats.length > 0;
  });

  ngOnInit(): void {
    // Pre-select the passed-in spatial unit, but only if it applies to this indicator.
    const preselected =
      this.preselectedSpatialUnitId &&
      this.indicator.spatialUnits.some((unit) => unit.id === this.preselectedSpatialUnitId)
        ? [this.preselectedSpatialUnitId]
        : [];

    this.item.set({
      dataset: this.indicator,
      selectedFormats: [],
      selectedSpatialUnitIds: preselected,
    });
  }

  onEpsgCodeChange(code: number | null): void {
    this.selectedEpsgCode.set(code);
  }

  toggleSpatialUnit(spatialUnitId: string): void {
    this.item.update((item) => {
      const ids = new Set(item.selectedSpatialUnitIds);
      if (ids.has(spatialUnitId)) ids.delete(spatialUnitId);
      else ids.add(spatialUnitId);
      return { ...item, selectedSpatialUnitIds: [...ids] };
    });
  }

  toggleFormat(format: ExportFormat): void {
    this.item.update((item) => {
      const formats = new Set(item.selectedFormats);
      if (formats.has(format)) formats.delete(format);
      else formats.add(format);
      return { ...item, selectedFormats: [...formats] };
    });
  }

  private downloadFile(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }

  startDownload(): void {
    const epsgCode = this.selectedEpsgCode();
    if (!epsgCode || !this.isValid()) return;

    const item = this.item();
    const params: SingleExportParams = {
      crs: `EPSG:${epsgCode}`,
      indicators: [
        {
          indicator_id: item.dataset.id,
          spatial_unit_ids: item.selectedSpatialUnitIds,
          target_time: buildTargetTime(item.selectedTargetTime, item.dataset.availableTimestamps),
          download_format: mapFormats(item.selectedFormats),
        },
      ],
      georessources: [],
    };

    this.isLoading.set(true);
    this.exportSrvc
      .executeSingleExport(params)
      .pipe(
        switchMap((result: ExportResponse) => {
          if (result.status === 'successful' && result.file?.href) {
            this.notificationSrvc.showSuccess(
              'Export wurde erstellt. Der Download wird gestartet …'
            );
            return this.downloadFile(result.file.href);
          }
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (blob: Blob) => {
          const blobUrl = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${item.dataset.name}.zip`;

          document.body.appendChild(link);
          link.click();

          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);

          this.notificationSrvc.showSuccess('Download abgeschlossen.');
        },
        error: (err) => {
          console.error('Error while exporting data', err);
        },
      });
  }
}
