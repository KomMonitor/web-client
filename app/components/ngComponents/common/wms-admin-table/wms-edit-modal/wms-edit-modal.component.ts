import { HttpClient } from '@angular/common/http';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColDef, ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { OgcDataGridHelperService } from 'services/adminOgcServices/ogc-data-grid-helper.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { OgcService } from 'services/ogcServices/ogc.service';

@Component({
  selector: 'app-wms-edit-modal',
  templateUrl: './wms-edit-modal.component.html',
  styleUrls: ['./wms-edit-modal.component.css']
})
export class WmsEditModalComponent {

  currentGeoresourceDataset!: WmsDataset;

  totalSteps:number = 3;
  currentStep: number = 1;

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  loadingData = false;

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
    protected dataExchangeService: DataExchangeService,
    private ogcService: OgcService,
    protected dataGridHelperService: OgcDataGridHelperService
  ) {
    this.availableTopics = this.dataExchangeService.availableTopics.filter(e => e.topicResource=='georesource');
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
      url: new FormControl<string>(this.currentGeoresourceDataset.url, Validators.required),
      layer: new FormControl<string>(this.currentGeoresourceDataset.layerName, Validators.required)
    });

    // Set topic hierarchy
    const topicHierarchy = this.dataExchangeService.getTopicHierarchyForTopicId(
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

  // Modal control methods
  cancel(): void {
    this.activeModal.dismiss();
  }

  editWms() {

    let data = {
      metadata : {
        title: this.metadataForm.controls.title.value,
        description: this.metadataForm.controls.description.value,
        databasis: this.metadataForm.controls.databasis.value,
        datasource: this.metadataForm.controls.datasource.value,
        contact: this.metadataForm.controls.contact.value,
        note: this.metadataForm.controls.note.value 
      },
      connection: {
        url: this.connectForm.controls.url.value,
        layer: this.connectForm.controls.layer.value
      },
      topic: {
        mainTopics: this.georesourceTopic_mainTopic,
        subTopic: this.georesourceTopic_subTopic,
        subsubTopic: this.georesourceTopic_subsubTopic,
        subsubsubTopic: this.georesourceTopic_subsubsubTopic
      }
    };

    console.log(data);
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
    this.successMessage = '';
  }

  hideErrorAlert(): void {
    this.errorMessage = '';
  }

  testConnection() {

    let url = this.connectForm.controls.url.value;
    let layer = this.connectForm.controls.layer.value;

    if(url && layer) {

      this.ogcService.testConnection(url).subscribe({
        next: response => {
          this.wmsTestStatus = response.success; 
        },
        error: error => {
          console.log
        }
      })
    }
  }
}
