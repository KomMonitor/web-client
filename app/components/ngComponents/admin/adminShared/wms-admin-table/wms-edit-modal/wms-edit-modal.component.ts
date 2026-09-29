import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { OgcDataGridHelperService } from 'services/adminOgcServices/ogc-data-grid-helper.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { AdminTopicsManagementComponent } from 'components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component';

import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { TopicHierarchyFormComponent } from '../../topicHierarchyForm/topic-hierarchy-form.component';
import { FormErrorComponent } from '../../formError/form-error.component';
import { FormControlAriaDirective } from '../../formError/form-control-aria.directive';
import { controlInvalidSignal } from '../../forms/control-state';
import {
  buildTopicHierarchyForm,
  patchTopicHierarchyFromChain,
  topicHierarchyToApi,
} from '../../topicHierarchyForm/topic-hierarchy-form.model';

// Step keys in stepper order; onSubmit() jumps to the first invalid one.
const STEP_KEYS = ['metadata', 'connection', 'topics'] as const;
type StepKey = (typeof STEP_KEYS)[number];

@Component({
  selector: 'app-wms-edit-modal',
  templateUrl: './wms-edit-modal.component.html',
  styleUrls: ['./wms-edit-modal.component.scss'],
  imports: [
    TranslateModule,
    FormsModule,
    LoadingOverlayComponent,
    ExpandableBoxComponent,
    ReactiveFormsModule,
    AdminTopicsManagementComponent,
    TopicHierarchyFormComponent,
    FormErrorComponent,
    FormControlAriaDirective,
    StepperComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WmsEditModalComponent {
  activeModal = inject(NgbActiveModal);
  protected accessControlService = inject(AccessControlService);
  private topicStore = inject(TopicMetadataStoreService);
  private ogcService = inject(OgcService);
  protected dataGridHelperService = inject(OgcDataGridHelperService);
  private topicHierarchyService = inject(TopicHierarchyService);

  currentGeoresourceDataset!: WmsDataset;

  isSubmitting = false;
  // Signals: toggled from async HTTP callbacks and read by the template (OnPush)
  errorMessage = signal(false);
  successMessage = signal(false);
  loadingData = false;

  testErrorMessage = signal(false);
  testSuccessMessage = signal(false);

  // Built once and refilled by reInit(): the step markings below observe these
  // exact instances, so replacing them would leave the stepper watching stale forms.
  readonly metadataForm = new FormGroup({
    title: new FormControl<string>('', Validators.required),
    description: new FormControl<string>('', Validators.required),
    databasis: new FormControl<string>(''),
    datasource: new FormControl<string>('', Validators.required),
    contact: new FormControl<string>('', Validators.required),
    note: new FormControl<string>(''),
  });

  readonly connectForm = new FormGroup({
    url: new FormControl<string>('', Validators.required),
    layer: new FormControl<string>('', Validators.required),
  });

  // Topic hierarchy
  // Topic hierarchy — the shared four-level cascade.
  readonly topicsForm = buildTopicHierarchyForm({ requireMainTopic: true });

  // Per-step invalid markings; shown only once a step has been touched/left.
  private readonly metadataStepInvalid = controlInvalidSignal(this.metadataForm, {
    whenTouched: true,
  });
  private readonly connectionStepInvalid = controlInvalidSignal(this.connectForm, {
    whenTouched: true,
  });
  private readonly topicsStepInvalid = controlInvalidSignal(this.topicsForm, {
    whenTouched: true,
  });

  readonly stepper = new WizardStepper([
    {
      key: 'metadata',
      label: 'ADMIN_SHARED_UI.STEP_LABELS.WMS_METADATA',
      invalid: this.metadataStepInvalid,
      onLeave: () => this.metadataForm.markAllAsTouched(),
    },
    {
      key: 'connection',
      label: 'ADMIN_SHARED_UI.STEP_LABELS.WMS_REQUEST_PARAMETERS',
      invalid: this.connectionStepInvalid,
      onLeave: () => this.connectForm.markAllAsTouched(),
    },
    {
      key: 'topics',
      label: 'ADMIN_SHARED_UI.TOPICS.TITLE',
      invalid: this.topicsStepInvalid,
      onLeave: () => this.topicsForm.markAllAsTouched(),
    },
  ]);

  availableTopics!: any;

  successMessagePart = signal('');
  errorMessagePart = signal('');

  constructor() {
    this.availableTopics = this.topicStore.availableTopics.filter(
      (e) => e.topicResource == 'georesource'
    );
  }

  reInit() {
    const dataset = this.currentGeoresourceDataset;
    if (!dataset) {
      return;
    }
    this.metadataForm.reset({
      title: dataset.title,
      description: dataset.description,
      databasis: dataset.databasis,
      datasource: dataset.datasource,
      contact: dataset.contact,
      note: dataset.note,
    });
    this.connectForm.reset({
      url: dataset.connectionDetails.baseUrl,
      layer: dataset.connectionDetails.layerName,
    });

    // Set topic hierarchy
    const topicHierarchy = this.topicHierarchyService.getTopicHierarchyForTopicId(
      this.topicStore.availableTopics,
      this.currentGeoresourceDataset.topicReference
    );

    patchTopicHierarchyFromChain(this.topicsForm, topicHierarchy);
  }

  close(): void {
    this.activeModal.close(true);
  }

  /** The form group behind each wizard step. */
  private stepForm(key: StepKey) {
    switch (key) {
      case 'metadata':
        return this.metadataForm;
      case 'connection':
        return this.connectForm;
      case 'topics':
        return this.topicsForm;
    }
  }

  /**
   * Submit handler of the always-active button: saves when every step is
   * valid, otherwise reveals all field errors and jumps to the first
   * incomplete step.
   */
  onSubmit(): void {
    const forms = STEP_KEYS.map((key) => this.stepForm(key));
    if (forms.every((form) => form.valid)) {
      this.editWms();
      return;
    }
    forms.forEach((form) => form.markAllAsTouched());
    const firstInvalidStep = STEP_KEYS.find((key) => this.stepForm(key).invalid);
    if (firstInvalidStep) {
      this.stepper.goToKey(firstInvalidStep);
    }
  }

  editWms() {
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
      topicReference: topicHierarchyToApi(this.topicsForm),
      serviceResource: this.currentGeoresourceDataset.serviceResource,
    };

    this.ogcService.updateWms(this.currentGeoresourceDataset.id, data).subscribe({
      next: (response) => {
        this.successMessagePart.set(this.currentGeoresourceDataset.title);
        this.successMessage.set(true);
      },
      error: (error) => {
        this.errorMessagePart.set(error.message);
        this.errorMessage.set(true);
      },
    });
  }

  resetWmsAddForm() {
    // Restore the stored values. Clearing the fields, as the add dialog does,
    // left an edit that could only be saved after retyping every one of them.
    this.topicsForm.reset();
    this.reInit();
    this.stepper.reset();

    // A connection test belongs to the form being reset; its alert must not
    // outlive it (e.g. an old failure shown next to a successful register).
    this.testSuccessMessage.set(false);
    this.testErrorMessage.set(false);
  }

  hideSuccessAlert(): void {
    this.successMessage.set(false);
    this.testSuccessMessage.set(false);
  }

  hideErrorAlert(): void {
    this.errorMessage.set(false);
    this.testErrorMessage.set(false);
  }

  testConnection() {
    this.testErrorMessage.set(false);
    this.testSuccessMessage.set(false);

    const url = this.connectForm.controls.url.value;
    const layer = this.connectForm.controls.layer.value;

    if (url && layer) {
      this.ogcService.testConnection(url).subscribe({
        next: (response) => {
          if (response.success === true) this.testSuccessMessage.set(true);
          else this.testErrorMessage.set(true);
        },
        error: (error) => {
          this.testErrorMessage.set(true);
        },
      });
    }
  }
}
