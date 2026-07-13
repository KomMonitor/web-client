import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Observable, finalize, switchMap } from 'rxjs';
import {
  ExportResponse,
  ExportingService,
  SingleExportParams,
} from 'services/exporting/exporting.service';
import { NotificationService } from '../../../common/notification/notification.service';
import { EpsgSelectorComponent } from '../epsg-selector/epsg-selector.component';
import { ExportGeoressourceCardComponent } from '../export-georessource-card/export-georessource-card.component';
import { buildTargetTime, mapFormats } from '../export-mapping';
import { ExportFormat, Georessource, GeoressourceExportItem } from '../models';

/**
 * Slim, self-contained export dialog for a single georesource (opened from the georesource
 * selection). It keeps its own local GeoressourceExportItem and never touches the shared,
 * persisted ExportingStateService, so it does not pollute the combined export basket.
 */
@Component({
  selector: 'app-georessource-export-modal',
  templateUrl: './georessource-export-modal.component.html',
  styleUrls: ['./georessource-export-modal.component.scss'],
  standalone: true,
  imports: [ExportGeoressourceCardComponent, EpsgSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoressourceExportModalComponent implements OnInit {
  private http = inject(HttpClient);
  activeModal = inject(NgbActiveModal);
  private exportSrvc = inject(ExportingService);
  private notificationSrvc = inject(NotificationService);

  /** The georesource to export, set by the opener via `modalRef.componentInstance.georessource`. */
  @Input({ required: true }) georessource!: Georessource;

  item = signal<GeoressourceExportItem>({
    dataset: { id: '', name: '', availableTimestamps: [] },
    selectedFormats: [],
  });

  private selectedEpsgCode = signal<number | null>(4326);

  isLoading = signal(false);

  isValid = computed(() => this.item().selectedFormats.length > 0);

  ngOnInit(): void {
    this.item.set({
      dataset: this.georessource,
      selectedFormats: [],
    });
  }

  onEpsgCodeChange(code: number | null): void {
    this.selectedEpsgCode.set(code);
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
      indicators: [],
      georessources: [
        {
          georessource_id: item.dataset.id,
          target_time: buildTargetTime(item.selectedTargetTime, item.dataset.availableTimestamps),
          download_format: mapFormats(item.selectedFormats),
        },
      ],
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
