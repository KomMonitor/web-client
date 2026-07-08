import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { OgcService } from 'services/ogcServices/ogc.service';

@Component({
  selector: 'app-wms-delete-modal',
  templateUrl: './wms-delete-modal.component.html',
  styleUrls: ['./wms-delete-modal.component.scss'],
  imports: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WmsDeleteModalComponent {
  activeModal = inject(NgbActiveModal);
  private ogcService = inject(OgcService);
  private cdr = inject(ChangeDetectorRef);

  datasetToDelete: WmsDataset | undefined;

  loadingData: boolean = false;
  // Signals: toggled from async HTTP callbacks and read by the template (OnPush)
  showSuccessAlert = signal(false);
  showErrorAlert = signal(false);

  errorMessage = signal('');

  close(): void {
    this.activeModal.close(true);
  }

  hideSuccessAlert(): void {
    this.showSuccessAlert.set(false);
  }

  hideErrorAlert(): void {
    this.showErrorAlert.set(false);
  }

  deleteGeoresources() {
    if (this.datasetToDelete)
      this.ogcService.deleteWms(this.datasetToDelete).subscribe({
        next: (response) => {
          this.showSuccessAlert.set(true);
          this.datasetToDelete = undefined;
          // datasetToDelete is a plain modal input rewritten in this async
          // callback and read by the template.
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.showErrorAlert.set(true);
          this.errorMessage.set(error.message);
        },
      });
  }
}
