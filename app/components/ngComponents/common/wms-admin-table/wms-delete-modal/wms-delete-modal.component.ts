import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { OgcService } from 'services/ogcServices/ogc.service';

@Component({
  selector: 'app-wms-delete-modal',
  templateUrl: './wms-delete-modal.component.html',
  styleUrls: ['./wms-delete-modal.component.css'],
  imports: [CommonModule],
  standalone: true
})
export class WmsDeleteModalComponent {
 
  datasetToDelete: WmsDataset | undefined;

  loadingData:boolean = false;
  showSuccessAlert = false;
  showErrorAlert = false;

  errorMessage!:string;

  constructor(
    public activeModal: NgbActiveModal,
    protected dataExchangeService: DataExchangeService,
    private ogcService: OgcService
  ) {}

  close(): void {
    this.activeModal.close(true);
  }
  
  hideSuccessAlert(): void {
    this.showSuccessAlert = false;
  }

  hideErrorAlert(): void {
    this.showErrorAlert = false;
  }

  deleteGeoresources() {

    if(this.datasetToDelete)
      this.ogcService.deleteWms(this.datasetToDelete).subscribe({
        next: response => {
          this.showSuccessAlert = true;
          this.datasetToDelete = undefined;
        },
        error: error => {
          this.showErrorAlert = true;
          this.errorMessage = error.message;
        }
      });
  }
}
