import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, finalize, Observable, switchMap } from 'rxjs';
import {
  DownloadFormat,
  ExportingService,
  ExportResponse,
  GeoressourceExportInput,
  IndicatorExportInput,
  MultipleExportIndicatorInput,
  MultipleExportParams,
  SingleExportParams,
  SpatialUnitExportParams,
} from '../../../../../services/exporting/exporting.service';
import { ExpandableBoxComponent } from '../../../common/expandable-box/expandable-box.component';
import { NotificationService } from '../../../common/notification/notification.service';
import { EpsgSelectorComponent } from '../epsg-selector/epsg-selector.component';
import { ExportDatasetListComponent } from '../export-dataset-list/export-dataset-list.component';
import { buildTargetTime, mapFormats } from '../export-mapping';
import { ExportTypSelectionComponent } from '../export-typ-selection/export-typ-selection.component';
import { ExportingStateService } from '../exporting-state.service';

@Component({
  selector: 'app-export-menu-modal',
  templateUrl: './export-menu-modal.component.html',
  styleUrls: ['./export-menu-modal.component.scss'],
  standalone: true,
  imports: [
    ExportTypSelectionComponent,
    ExportDatasetListComponent,
    ExpandableBoxComponent,
    EpsgSelectorComponent,
  ],
})
export class ExportMenuModalComponent {
  private http = inject(HttpClient);

  activeModal = inject(NgbActiveModal);
  stateSrvc = inject(ExportingStateService);
  exportSrvc = inject(ExportingService);
  notificationSrvc = inject(NotificationService);
  isLoading = signal(false);

  downloadFile(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }

  onEpsgCodeChange(code: number | null): void {
    this.stateSrvc.selectedEpsgCode.set(code);
  }

  startDownload(): void {
    const epsgCode = this.stateSrvc.selectedEpsgCode();
    if (!epsgCode) return;

    const crs = `EPSG:${epsgCode}`;
    const exportType = this.stateSrvc.exportType();

    let request$: Observable<any>;
    switch (exportType) {
      case 'single':
        request$ = this.exportSrvc.executeSingleExport(this.buildSingleExportParams(crs));
        break;
      case 'spatialUnit':
        request$ = this.exportSrvc.executeSpatialUnitExport(this.buildSpatialUnitExportParams(crs));
        break;
      case 'multiple':
        request$ = this.exportSrvc.executeMultipleExport(this.buildMultipleExportParams(crs));
        break;
    }

    this.isLoading.set(true);
    request$
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
          link.download = `export-${Date.now()}.zip`;

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

  private filteredIndicatorItems() {
    return this.stateSrvc
      .indicatorItems()
      .filter((item) => item.selectedSpatialUnitIds.length > 0)
      .filter((item) => item.selectedFormats.length > 0);
  }

  private buildSingleExportParams(crs: string): SingleExportParams {
    const indicators: IndicatorExportInput[] = this.filteredIndicatorItems().map((item) => ({
      indicator_id: item.dataset.id,
      spatial_unit_ids: item.selectedSpatialUnitIds,
      target_time: buildTargetTime(item.selectedTargetTime, item.dataset.availableTimestamps),
      download_format: mapFormats(item.selectedFormats),
    }));
    const georessources: GeoressourceExportInput[] = this.stateSrvc
      .georessourceItems()
      .filter((item) => item.selectedFormats.length > 0)
      .map((item) => ({
        georessource_id: item.dataset.id,
        target_time: buildTargetTime(item.selectedTargetTime, item.dataset.availableTimestamps),
        download_format: mapFormats(item.selectedFormats),
      }));

    return { crs, indicators, georessources };
  }

  private buildSpatialUnitExportParams(crs: string): SpatialUnitExportParams {
    const spatialUnitId = this.stateSrvc.selectedSpatialUnit() ?? '';
    const allFormats = new Set<DownloadFormat>();
    const indicators = this.stateSrvc
      .indicatorItems()
      .filter((item) => item.selectedFormats.length > 0)
      .map((item) => {
        mapFormats(item.selectedFormats).forEach((f) => allFormats.add(f));
        return {
          indicator_id: item.dataset.id,
          target_time: buildTargetTime(item.selectedTargetTime, item.dataset.availableTimestamps),
        };
      });

    return {
      crs,
      spatial_unit_id: spatialUnitId,
      download_format: [...allFormats],
      indicators,
    };
  }

  private buildMultipleExportParams(crs: string): MultipleExportParams {
    const indicators: MultipleExportIndicatorInput[] = this.filteredIndicatorItems().map(
      (item) => ({
        indicator_id: item.dataset.id,
        spatial_unit_ids: item.selectedSpatialUnitIds,
        target_time: buildTargetTime(item.selectedTargetTime, item.dataset.availableTimestamps),
      })
    );
    return { crs, indicators };
  }
}
