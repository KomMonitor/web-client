import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Component({
  selector: 'app-wms-add-modal',
  templateUrl: './wms-add-modal.component.html',
  styleUrls: ['./wms-add-modal.component.css']
})
export class WmsAddModalComponent {

  totalSteps:number = 4;
  currentStep: number = 1;

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  loadingData = false;

  metadataForm = new FormGroup({
    title: new FormControl<string>(''),
    description: new FormControl<string>(''),
    databasis: new FormControl<string>(''),
    datasource: new FormControl<string>(''),
    contact: new FormControl<string>(''),
    note: new FormControl<string>('')
  });

  datasetNameInvalid: boolean = false;
  
  // Topic hierarchy
  georesourceTopic_mainTopic: any = null;
  georesourceTopic_subTopic: any = null;
  georesourceTopic_subsubTopic: any = null;
  georesourceTopic_subsubsubTopic: any = null;

  availableTopics!: any;

  ownerOrganization = '';
  ownerOrgFilter = '';
  isPublic = false;

  resourcesCreatorRights: any[] = [];

  successMessagePart = '';
  errorMessagePart = '';

  constructor(
    public activeModal: NgbActiveModal,
    protected dataExchangeService: DataExchangeService
  ) {
    this.availableTopics = this.dataExchangeService.availableTopics.filter(e => e.topicResource=='georesource');
  }

  // Multi-step form navigation
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Modal control methods
  cancel(): void {
    this.activeModal.dismiss();
  }

  addWms() {

  }

  checkDatasetName() {

  }

  onChangeOwner(orgUnitId: string): void {
    this.ownerOrganization = orgUnitId;
   // this.refreshRoles();
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }
  
/*   private refreshRoles(): void {
    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.kommonitorDataExchangeService.accessControl, 
      this.kommonitorDataExchangeService.getCurrentKomMonitorLoginRoleIds()
    );
  } */

  resetWmsAddForm() {

  }
  
  hideSuccessAlert(): void {
    this.successMessage = '';
  }

  hideErrorAlert(): void {
    this.errorMessage = '';
  }
}
