import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { OgcService } from 'services/ogcServices/ogc.service';

@Component({
  selector: 'app-wms-delete-modal',
  templateUrl: './wms-delete-modal.component.html',
  styleUrls: ['./wms-delete-modal.component.css']
})
export class WmsDeleteModalComponent {
 
  datasetToDelete: WmsDataset | undefined = undefined;

  loadingData:boolean = false;
  showSuccessAlert = false;
  showErrorAlert = false;

  successMessage!:string;
  errorMessage!:string;

  constructor(
    public activeModal: NgbActiveModal,
    protected dataExchangeService: DataExchangeService,
    private ogcService: OgcService
  ) {}

  // Modal control methods
  cancel(): void {
    this.activeModal.dismiss();
  } 
  
  hideSuccessAlert(): void {
    this.showSuccessAlert = false;
  }

  hideErrorAlert(): void {
    this.showErrorAlert = false;
  }

  deleteGeoresources() {
    
  }
}
