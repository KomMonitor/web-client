import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';

import { DatasetPermissionsWizardStateService } from './dataset-permissions-wizard-state.service';
import { DatasetSelectionStepComponent } from './steps/dataset-selection-step.component';
import { ReviewStepComponent } from './steps/review-step.component';
import { RightsStepComponent } from './steps/rights-step.component';

/** What the success view shows after a transfer. */
interface TransferDone {
  datasetCount: number;
  /** False when the datasets could not be reloaded, so their rights on screen are outdated. */
  reloaded: boolean;
}

/**
 * The dataset-permissions wizard: an admin grants or revokes read and edit
 * rights of several groups on many datasets of one owner at once.
 *
 * Three steps — select datasets, set rights, review and transfer — all freely
 * reachable through the stepper, then a success view from which a further
 * transfer starts over. The state lives in `DatasetPermissionsWizardStateService`,
 * provided here so every opening starts fresh; this component frames it and
 * tells the user how a save ended.
 *
 * Opened with `MODAL_WIDE`, so Esc and a click beside the dialog do not close
 * it: it holds input that is not saved yet.
 */
@Component({
  selector: 'app-dataset-permissions-wizard',
  templateUrl: './dataset-permissions-wizard.component.html',
  styleUrls: ['./dataset-permissions-wizard.component.scss'],
  imports: [
    TranslateModule,
    StepperComponent,
    LoadingOverlayComponent,
    DatasetSelectionStepComponent,
    RightsStepComponent,
    ReviewStepComponent,
  ],
  providers: [DatasetPermissionsWizardStateService],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetPermissionsWizardComponent implements OnInit {
  private readonly activeModal = inject(NgbActiveModal);
  private readonly accessControlService = inject(AccessControlService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);
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
  private readonly bootstrapLoading = toSignal(
    inject(MetadataBootstrapService).metadataLoading$.pipe(
      map((state) => state === MetadataLoadingState.INPROGRESS)
    ),
    { initialValue: false }
  );

  protected readonly loading = computed(() => this.bootstrapLoading() || this.state.reloading());

  /** Set once a transfer succeeded; the success view replaces the steps. */
  protected readonly done = signal<TransferDone | null>(null);

  /** Set when a transfer was held back because the stored rights had changed meanwhile. */
  protected readonly changedMeanwhile = signal(false);

  protected readonly ownerName = computed(() => {
    const ownerId = this.state.ownerId();
    return ownerId ? (this.accessControlService.getAccessControlById(ownerId)?.name ?? '') : '';
  });

  ngOnInit(): void {
    void this.state.start(this.ownerId);
  }

  /** Retries loading the current rights; offered when a reload failed. */
  async reload(): Promise<void> {
    const reloaded = await this.state.reload();
    if (reloaded) {
      this.done.update((done) => (done ? { ...done, reloaded: true } : done));
    }
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  /**
   * Sends the transfer. Anything but success keeps the dialog on the review
   * step with everything entered, so the user can retry. A failed reload
   * before sending (`unverified`) needs no message of its own: the notice
   * bound to `state.loadFailed()` already shows.
   */
  async transfer(): Promise<void> {
    this.changedMeanwhile.set(false);
    const result = await this.state.save();
    if (result.status === 'changed') {
      this.changedMeanwhile.set(true);
    } else if (result.status === 'failed') {
      // Stays until closed: it carries the backend's reason why nothing was stored.
      this.notificationService.showError(
        this.translate.instant('ADMIN_DATASET_PERMISSIONS.SAVE_FAILED', {
          message: result.message,
        }),
        { autohide: false }
      );
    } else if (result.status === 'saved') {
      this.done.set({ datasetCount: result.datasetCount, reloaded: result.reloaded });
    }
  }

  /**
   * "Further transfer": back to the first step with the selection kept and
   * nothing decided. The current rights are the stored ones already, as the
   * save reloaded the datasets.
   */
  restart(): void {
    this.changedMeanwhile.set(false);
    this.state.resetDecisions();
    this.done.set(null);
    this.stepper.currentStep = 1;
  }
}
