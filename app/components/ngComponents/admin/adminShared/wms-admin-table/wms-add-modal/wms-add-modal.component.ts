import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
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
import uuidv4 from '../../../../../../../customizedExternalLibs/uuidv4.js';
import { AdminTopicsManagementComponent } from 'components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component';
import { RoleManagementGridComponent } from 'components/ngComponents/admin/adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from 'components/ngComponents/admin/adminShared/roleManagementPanel/owner-organization-select.component';

import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { TopicHierarchyFormComponent } from '../../topicHierarchyForm/topic-hierarchy-form.component';
import { FormErrorComponent } from '../../formError/form-error.component';
import {
  buildTopicHierarchyForm,
  topicHierarchyToApi,
} from '../../topicHierarchyForm/topic-hierarchy-form.model';
import { buildSecurityStepForm } from '../../securityForm/security-form.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-wms-add-modal',
  templateUrl: './wms-add-modal.component.html',
  styleUrls: ['./wms-add-modal.component.scss'],
  imports: [
    TranslateModule,
    FormsModule,
    LoadingOverlayComponent,
    ExpandableBoxComponent,
    ReactiveFormsModule,
    AdminTopicsManagementComponent,
    TopicHierarchyFormComponent,
    FormErrorComponent,
    StepperComponent,
    RoleManagementGridComponent,
    OwnerOrganizationSelectComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WmsAddModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  protected accessControlService = inject(AccessControlService);
  private topicStore = inject(TopicMetadataStoreService);
  private ogcService = inject(OgcService);
  protected envConfigService = inject(EnvConfigService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @Input() resourceType!: any;

  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;

  // Multi-step form; the security step is only present when Keycloak is
  // enabled (fixes navigating onto a blank fourth step without Keycloak —
  // totalSteps was hard-coded to 4 before).
  readonly stepper = new WizardStepper([
    { key: 'metadata', label: 'ADMIN_SHARED_UI.STEP_LABELS.WMS_METADATA' },
    { key: 'connection', label: 'ADMIN_SHARED_UI.STEP_LABELS.WMS_REQUEST_PARAMETERS' },
    { key: 'topics', label: 'ADMIN_SHARED_UI.TOPICS.TITLE' },
    {
      key: 'security',
      label: 'ADMIN_SHARED_UI.SECURITY.ACCESS_OWNERSHIP_TITLE',
      when: () => this.envConfigService.enableKeycloakSecurity,
    },
  ]);

  isSubmitting = false;
  // Signals: toggled from async HTTP callbacks and read by the template (OnPush)
  errorMessage = signal(false);
  successMessage = signal(false);
  loadingData = false;

  testErrorMessage = signal(false);
  testSuccessMessage = signal(false);

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

  // Topic hierarchy — the shared four-level cascade.
  readonly topicsForm = buildTopicHierarchyForm({ requireMainTopic: true });

  availableTopics!: any;

  // Role management (grid handled by <app-role-management-grid>)
  readonly securityForm = buildSecurityStepForm({
    withSecurity: this.envConfigService.enableKeycloakSecurity,
  });
  get ownerOrganization(): string {
    return this.securityForm.controls.ownerOrganization.value;
  }
  get isPublic(): boolean {
    return this.securityForm.controls.isPublic.value;
  }

  successMessagePart = signal('');
  errorMessagePart = signal('');

  ngOnInit(): void {
    this.availableTopics = this.topicStore.availableTopics.filter(
      (e) => e.topicResource == this.resourceType
    );

    // Seeding the role grid used to hang off the owner select's output.
    this.securityForm.controls.ownerOrganization.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ownerId) => this.roleGrid?.applyOwner(ownerId));
  }

  close(): void {
    this.activeModal.close(true);
  }

  addWms() {
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
      ownerId: this.ownerOrganization,
      serviceResource: this.resourceType,
      isPublic: this.isPublic,
      permissions: this.roleGrid?.getSelectedRoleIds() ?? [],
    };

    this.ogcService.registerWms(data).subscribe({
      next: (response) => {
        this.successMessagePart.set(response.title);
        this.successMessage.set(true);
        this.resetWmsAddForm();
        // resetWmsAddForm rewrites several plain template-bound fields
        // (topic selections, owner, isPublic) from this async callback.
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessagePart.set(error.message);
        this.errorMessage.set(true);
      },
    });
  }

  resetWmsAddForm() {
    this.metadataForm.reset();
    this.connectForm.reset();
    this.topicsForm.reset();
    this.securityForm.reset();

    this.wmsTestStatus = undefined;

    this.roleGrid?.reset();

    this.stepper.reset();
  }

  hideSuccessAlert(): void {
    this.successMessage.set(false);
    this.testSuccessMessage.set(false);
    this.successMessagePart.set('');
  }

  hideErrorAlert(): void {
    this.errorMessage.set(false);
    this.testErrorMessage.set(false);
    this.errorMessagePart.set('');
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
