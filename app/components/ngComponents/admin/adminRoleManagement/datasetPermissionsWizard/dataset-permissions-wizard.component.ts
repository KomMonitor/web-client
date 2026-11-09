import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';

import { DatasetPermissionsWizardStateService } from './dataset-permissions-wizard-state.service';
import { DatasetSelectionStepComponent } from './steps/dataset-selection-step.component';

/**
 * The dataset-permissions wizard: an admin grants or revokes read and edit
 * rights of several groups on many datasets of one owner at once.
 *
 * Three steps — select datasets, set rights, review and transfer — all freely
 * reachable through the stepper. The state lives in
 * `DatasetPermissionsWizardStateService`, provided here so every opening
 * starts fresh; this component only frames it.
 *
 * Opened with `MODAL_WIDE`, so Esc and a click beside the dialog do not close
 * it: it holds input that is not saved yet.
 */
@Component({
  selector: 'app-dataset-permissions-wizard',
  templateUrl: './dataset-permissions-wizard.component.html',
  imports: [
    TranslateModule,
    StepperComponent,
    LoadingOverlayComponent,
    DatasetSelectionStepComponent,
  ],
  providers: [DatasetPermissionsWizardStateService],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetPermissionsWizardComponent implements OnInit {
  private readonly activeModal = inject(NgbActiveModal);
  private readonly accessControlService = inject(AccessControlService);
  protected readonly state = inject(DatasetPermissionsWizardStateService);

  /** The organizational unit whose datasets are worked on; set by the opener. */
  ownerId = '';

  readonly stepper = new WizardStepper([
    { key: 'datasets', label: 'ADMIN_DATASET_PERMISSIONS.STEPS.DATASETS' },
    { key: 'rights', label: 'ADMIN_DATASET_PERMISSIONS.STEPS.RIGHTS' },
    { key: 'review', label: 'ADMIN_DATASET_PERMISSIONS.STEPS.REVIEW' },
  ]);

  /**
   * The admin area loads the metadata on entry, and the wizard may open before
   * that is done. The datasets then fill in by themselves once it is.
   */
  protected readonly loading = toSignal(
    inject(MetadataBootstrapService).metadataLoading$.pipe(
      map((state) => state === MetadataLoadingState.INPROGRESS)
    ),
    { initialValue: false }
  );

  protected readonly ownerName = computed(() => {
    const ownerId = this.state.ownerId();
    return ownerId ? (this.accessControlService.getAccessControlById(ownerId)?.name ?? '') : '';
  });

  ngOnInit(): void {
    this.state.start(this.ownerId);
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
