import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WmsDataset, WmsResourceType } from 'components/ngComponents/models/services.models';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import uuidv4 from '../../../../../../customizedExternalLibs/uuidv4.js';
import { AdminTopicsManagementComponent } from 'components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component';
import { RoleManagementGridComponent } from 'components/ngComponents/admin/adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from 'components/ngComponents/admin/adminShared/roleManagementPanel/owner-organization-select.component';

import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';

@Component({
  selector: 'app-wms-add-modal',
  templateUrl: './wms-add-modal.component.html',
  styleUrls: ['./wms-add-modal.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AdminTopicsManagementComponent,
    StepperComponent,
    RoleManagementGridComponent,
    OwnerOrganizationSelectComponent,
  ],
  standalone: true,
})
export class WmsAddModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  protected accessControlService = inject(AccessControlService);
  private topicStore = inject(TopicMetadataStoreService);
  private ogcService = inject(OgcService);
  protected envConfigService = inject(EnvConfigService);

  @Input() resourceType!: any;

  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;

  // Multi-step form; the security step is only present when Keycloak is
  // enabled (fixes navigating onto a blank fourth step without Keycloak —
  // totalSteps was hard-coded to 4 before).
  readonly stepper = new WizardStepper([
    { key: 'metadata', label: 'Metadaten' },
    { key: 'connection', label: 'Anfrageparameter' },
    { key: 'topics', label: 'Themenhierarchie' },
    {
      key: 'security',
      label: 'Zugriffsschutz und Eigentümerschaft',
      when: () => this.envConfigService.enableKeycloakSecurity,
    },
  ]);

  isSubmitting = false;
  errorMessage = false;
  successMessage = false;
  loadingData = false;

  testErrorMessage = false;
  testSuccessMessage = false;

  wmsTestStatus: boolean | undefined = undefined;

  metadataForm = new FormGroup({
    title: new FormControl<string>('', Validators.required),
    description: new FormControl<string>('', Validators.required),
    databasis: new FormControl<string>(''),
    datasource: new FormControl<string>('', Validators.required),
    contact: new FormControl<string>('', Validators.required),
    note: new FormControl<string>(''),
  });

  connectForm = new FormGroup({
    url: new FormControl<string>('', Validators.required),
    layer: new FormControl<string>('', Validators.required),
  });

  datasetNameInvalid: boolean = false;

  // Topic hierarchy
  georesourceTopic_mainTopic: any = null;
  georesourceTopic_subTopic: any = null;
  georesourceTopic_subsubTopic: any = null;
  georesourceTopic_subsubsubTopic: any = null;

  availableTopics!: any;

  // Role management (grid handled by <app-role-management-grid>)
  ownerOrganization = '';
  isPublic = false;

  successMessagePart = '';
  errorMessagePart = '';

  ngOnInit(): void {
    this.availableTopics = this.topicStore.availableTopics.filter(
      (e) => e.topicResource == this.resourceType
    );
  }

  close(): void {
    this.activeModal.close(true);
  }

  addWms() {
    let topicRef = this.georesourceTopic_mainTopic;

    if (this.georesourceTopic_subTopic) topicRef = this.georesourceTopic_subTopic;

    if (this.georesourceTopic_subsubTopic) topicRef = this.georesourceTopic_subsubTopic;

    if (this.georesourceTopic_subsubsubTopic) topicRef = this.georesourceTopic_subsubsubTopic;

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
        serviceType: 'wms',
      },
      topicReference: topicRef.topicId,
      ownerId: this.ownerOrganization,
      serviceResource: this.resourceType,
      isPublic: this.isPublic,
      permissions: this.roleGrid?.getSelectedRoleIds() ?? [],
    };

    this.ogcService.registerWms(data).subscribe({
      next: (response) => {
        this.successMessagePart = response.title;
        this.successMessage = true;
        this.resetWmsAddForm();
      },
      error: (error) => {
        this.errorMessagePart = error.message;
        this.errorMessage = true;
      },
    });
  }

  checkDatasetName() {
    // no-op: WMS datasets require no name-uniqueness check
  }

  onChangeOwner(orgUnitId: string): void {
    this.ownerOrganization = orgUnitId;
    // Seed the grid with the owner unit's default viewer/editor permissions
    this.roleGrid?.applyOwner(orgUnitId);
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }

  resetWmsAddForm() {
    this.metadataForm.reset();
    this.connectForm.reset();

    this.georesourceTopic_mainTopic = null;
    this.georesourceTopic_subTopic = null;
    this.georesourceTopic_subsubTopic = null;
    this.georesourceTopic_subsubsubTopic = null;

    this.wmsTestStatus = undefined;

    this.ownerOrganization = '';
    this.isPublic = false;
    this.roleGrid?.reset();

    this.stepper.reset();
  }

  hideSuccessAlert(): void {
    this.successMessage = false;
    this.testSuccessMessage = false;
    this.successMessagePart = '';
  }

  hideErrorAlert(): void {
    this.errorMessage = false;
    this.testErrorMessage = false;
    this.errorMessagePart = '';
  }

  testConnection() {
    this.testErrorMessage = false;
    this.testSuccessMessage = false;

    const url = this.connectForm.controls.url.value;
    const layer = this.connectForm.controls.layer.value;

    if (url && layer) {
      this.ogcService.testConnection(url).subscribe({
        next: (response) => {
          if (response.success === true) this.testSuccessMessage = true;
          else this.testErrorMessage = true;
        },
        error: (error) => {
          this.testErrorMessage = true;
        },
      });
    }
  }
}
