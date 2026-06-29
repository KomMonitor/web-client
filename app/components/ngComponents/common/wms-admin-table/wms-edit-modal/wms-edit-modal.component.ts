import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { OgcDataGridHelperService } from 'services/adminOgcServices/ogc-data-grid-helper.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { AdminTopicsManagementComponent } from "components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component";
import { CommonModule } from '@angular/common';
import { TopicHierarchyService } from '../../../../../services/topic-hierarchy-service/topic-hierarchy.service';

@Component({
  selector: 'app-wms-edit-modal',
  templateUrl: './wms-edit-modal.component.html',
  styleUrls: ['./wms-edit-modal.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminTopicsManagementComponent],
  standalone: true
})
export class WmsEditModalComponent {

  currentGeoresourceDataset!: WmsDataset;

  totalSteps:number = 3;
  currentStep: number = 1;

  isSubmitting = false;
  errorMessage = false;
  successMessage = false;
  loadingData = false;
  
  testErrorMessage = false;
  testSuccessMessage = false;

  wmsTestStatus:boolean | undefined = undefined;

  metadataForm = new FormGroup({
    title: new FormControl<string>('', Validators.required),
    description: new FormControl<string>('', Validators.required),
    databasis: new FormControl<string>(''),
    datasource: new FormControl<string>('', Validators.required),
    contact: new FormControl<string>('', Validators.required),
    note: new FormControl<string>('')
  });

  connectForm = new FormGroup({
    url: new FormControl<string>('', Validators.required),
    layer: new FormControl<string>('', Validators.required)
  });

  datasetNameInvalid: boolean = false;
  
  // Topic hierarchy
  georesourceTopic_mainTopic: any = null;
  georesourceTopic_subTopic: any = null;
  georesourceTopic_subsubTopic: any = null;
  georesourceTopic_subsubsubTopic: any = null;

  availableTopics!: any;

  successMessagePart = '';
  errorMessagePart = '';

  constructor(
    public activeModal: NgbActiveModal,
    protected accessControlService: AccessControlService,
    private topicStore: TopicMetadataStoreService,
    private ogcService: OgcService,
    protected dataGridHelperService: OgcDataGridHelperService,
    private topicHierarchyService: TopicHierarchyService,
  ) {
    this.availableTopics = this.topicStore.availableTopics.filter(e => e.topicResource=='georesource');
  }

  reInit() {
    this.metadataForm = new FormGroup({
      title: new FormControl<string>(this.currentGeoresourceDataset.title, Validators.required),
      description: new FormControl<string>(this.currentGeoresourceDataset.description, Validators.required),
      databasis: new FormControl<string>(this.currentGeoresourceDataset.databasis),
      datasource: new FormControl<string>(this.currentGeoresourceDataset.datasource, Validators.required),
      contact: new FormControl<string>(this.currentGeoresourceDataset.contact, Validators.required),
      note: new FormControl<string>(this.currentGeoresourceDataset.note)
    });

    this.connectForm = new FormGroup({
      url: new FormControl<string>(this.currentGeoresourceDataset.connectionDetails.baseUrl, Validators.required),
      layer: new FormControl<string>(this.currentGeoresourceDataset.connectionDetails.layerName, Validators.required)
    });

    // Set topic hierarchy
    const topicHierarchy = this.topicHierarchyService.getTopicHierarchyForTopicId(
      this.topicStore.availableTopics,
      this.currentGeoresourceDataset.topicReference
    );

    if (topicHierarchy && topicHierarchy[0]) {
      this.georesourceTopic_mainTopic = topicHierarchy[0];
    }
    if (topicHierarchy && topicHierarchy[1]) {
      this.georesourceTopic_subTopic = topicHierarchy[1];
    }
    if (topicHierarchy && topicHierarchy[2]) {
      this.georesourceTopic_subsubTopic = topicHierarchy[2];
    }
    if (topicHierarchy && topicHierarchy[3]) {
      this.georesourceTopic_subsubsubTopic = topicHierarchy[3];
    }
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

  close(): void {
    this.activeModal.close(true);
  }

  editWms() {

    let topicRef = this.georesourceTopic_mainTopic;
    
    if(this.georesourceTopic_subTopic)
      topicRef = this.georesourceTopic_subTopic;

    if(this.georesourceTopic_subsubTopic)
      topicRef = this.georesourceTopic_subsubTopic;

    if(this.georesourceTopic_subsubsubTopic)
      topicRef = this.georesourceTopic_subsubsubTopic;

    const data = {
      title: this.metadataForm.controls.title.value,
      description: this.metadataForm.controls.description.value,
      databasis: this.metadataForm.controls.databasis.value,
      datasource: this.metadataForm.controls.datasource.value,
      contact: this.metadataForm.controls.contact.value,
      note: this.metadataForm.controls.note.value,
      connectionDetails: {
        id: '',
        baseUrl: this.connectForm.controls.url.value,
        layerName: this.connectForm.controls.layer.value,
        serviceType: 'wms'
      },
      topicReference: topicRef.topicId,
      serviceResource: this.currentGeoresourceDataset.serviceResource
    };

    this.ogcService.updateWms(this.currentGeoresourceDataset.id, data).subscribe({
      next: response => {
        this.successMessagePart = this.currentGeoresourceDataset.title;
        this.successMessage = true;
      }, 
      error: error => {
        this.errorMessagePart = error.message;
        this.errorMessage = true;
      }
    });
  }

  checkDatasetName() {

  }

  resetWmsAddForm() {
    this.metadataForm.reset();
    this.connectForm.reset();

    this.georesourceTopic_mainTopic = null;
    this.georesourceTopic_subTopic = null;
    this.georesourceTopic_subsubTopic = null;
    this.georesourceTopic_subsubsubTopic = null;

    this.wmsTestStatus = undefined;
  }
  
  hideSuccessAlert(): void {
    this.successMessage = false;
    this.testSuccessMessage = false;
  }

  hideErrorAlert(): void {
    this.errorMessage = false;
    this.testErrorMessage = false;
  }

  testConnection() {

    this.testErrorMessage = false;
    this.testSuccessMessage = false;

    const url = this.connectForm.controls.url.value;
    const layer = this.connectForm.controls.layer.value;

    if(url && layer) {

      this.ogcService.testConnection(url).subscribe({
        next: response => {

          if(response.success===true)
            this.testSuccessMessage = true;
          else
            this.testErrorMessage = true;
        },
        error: error => {
          this.testErrorMessage = true;
        }
      })
    }
  }
}
