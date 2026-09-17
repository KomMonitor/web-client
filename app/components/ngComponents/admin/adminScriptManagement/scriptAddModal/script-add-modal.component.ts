import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { FormsModule } from '@angular/forms';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ScheduleDraftService } from 'services/schedule-draft-service/schedule-draft.service';
import { renderFormula, renderLegend } from 'services/schedule-draft-service/legend-template.util';
import { ScriptStepIntroductionComponent } from './scriptStepIntroduction/script-step-introduction.component';
import { ScheduleInputsStepComponent } from './scheduleInputsStep/schedule-inputs-step.component';
import { ScheduleTargetStepComponent } from './scheduleTargetStep/schedule-target-step.component';
import { ScheduleTimingStepComponent } from './scheduleTimingStep/schedule-timing-step.component';
import { LoadingOverlayComponent } from '../../../common/loading-overlay/loading-overlay.component';
import { StepperComponent } from '../../../common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { ScriptRefreshRequest } from '../script-refresh.model';
import { MathjaxDirective } from 'util/directives/mathjax.directive';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Creating a schedule.
 *
 * Four steps instead of the former three, and no script code anywhere: what
 * used to be a JavaScript file the user typed in is now a process that the
 * Processing Engine owns. The middle step is generated from the chosen
 * process' description — see `ScheduleInputsStepComponent`.
 */
@Component({
  selector: 'app-script-add-modal',
  templateUrl: './script-add-modal.component.html',
  styleUrls: ['./script-add-modal.component.scss'],
  imports: [
    TranslateModule,
    FormsModule,
    LoadingOverlayComponent,
    StepperComponent,
    ScriptStepIntroductionComponent,
    ScheduleTargetStepComponent,
    ScheduleInputsStepComponent,
    ScheduleTimingStepComponent,
    MathjaxDirective,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptAddModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  protected draft = inject(ScheduleDraftService);
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);

  // Asks the management component to refresh the overview table; replaces the
  // former RefreshScriptOverviewTable broadcast round-trip.
  @Output() refreshRequested = new EventEmitter<ScriptRefreshRequest>();

  readonly stepper = new WizardStepper([
    { key: 'intro', label: 'ADMIN_SHARED_UI.STEP_LABELS.INTRO_NOTES' },
    { key: 'target', label: 'ADMIN_SCRIPTS.ADD_MODAL.STEP_TARGET' },
    { key: 'inputs', label: 'ADMIN_SCRIPTS.ADD_MODAL.STEP_INPUTS' },
    { key: 'timing', label: 'ADMIN_SCRIPTS.ADD_MODAL.STEP_TIMING' },
  ]);

  // Signal-backed: written after the awaited POST, which would not trigger a
  // re-render of this OnPush component otherwise.
  loadingData = signal(false);
  showSuccessAlert = signal(false);
  showErrorAlert = signal(false);
  errorMessagePart = signal('');

  /** C9: copy the generated methodology into the indicator's metadata. */
  applyMethodology = signal(false);
  methodologyFailed = signal(false);

  /**
   * The methodology text this schedule would produce: the formula, then its
   * legend, both with their placeholders filled. Master composes the same two
   * parts; a process may carry either, both or neither.
   */
  protected methodology = computed(() => {
    const uiParams = this.draft.selectedProcess()?.uiParams;
    const inputs = this.draft.processInputs();

    const legend = renderLegend(uiParams?.dynamicLegend as string | undefined, {
      inputs,
      enumLabel: (inputKey, apiName) => this.enumLabel(inputKey, apiName),
      indicatorName: (id) => this.indicatorStore.getIndicatorMetadataById(id)?.indicatorName ?? '',
      indicatorUnit: (id) => this.indicatorStore.getIndicatorMetadataById(id)?.unit ?? '',
      georesourceName: (id) =>
        this.georesourceStore.getGeoresourceMetadataById(id)?.datasetName ?? '',
    });

    // Only 7 of the 19 UI processes vary their formula with the inputs; the
    // rest carry a fixed one, which master shows unchanged.
    const formula = uiParams?.dynamicFormula
      ? renderFormula(uiParams.dynamicFormula, inputs)
      : (uiParams?.formula ?? '');
    if (!formula) {
      return legend;
    }
    return legend ? formula + '<br/><br/>' + legend : formula;
  });

  ngOnInit(): void {
    this.draft.reset();
    void this.draft.ensureProcessesLoaded();
  }

  resetForm(): void {
    this.stepper.reset();
    this.draft.reset();
    this.showSuccessAlert.set(false);
    this.showErrorAlert.set(false);
    this.errorMessagePart.set('');
    this.applyMethodology.set(false);
    this.methodologyFailed.set(false);
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  async addScript(): Promise<void> {
    this.loadingData.set(true);
    this.showSuccessAlert.set(false);
    this.showErrorAlert.set(false);
    this.errorMessagePart.set('');
    this.methodologyFailed.set(false);

    const targetIndicatorId = this.draft.targetIndicatorId();
    const methodology = this.methodology();
    const shouldApplyMethodology = this.applyMethodology();

    try {
      await this.draft.submit();

      // The schedule exists from here on; a failing methodology patch must not
      // present the whole operation as failed.
      if (shouldApplyMethodology && methodology) {
        try {
          await this.patchMethodology(targetIndicatorId, methodology);
        } catch (error) {
          console.error('Could not write the methodology to the indicator:', error);
          this.methodologyFailed.set(true);
        }
      }

      this.refreshRequested.emit({ crudType: 'add' });
      this.showSuccessAlert.set(true);
      // Back to a blank form at step one, so the next schedule does not start
      // from the previous one's values.
      this.resetFormKeepingSuccess();
    } catch (error: unknown) {
      const errData = (error as { error?: unknown })?.error ?? error;
      this.errorMessagePart.set(JSON.stringify(errData, null, 2));
      this.showErrorAlert.set(true);
    } finally {
      this.loadingData.set(false);
    }
  }

  hideSuccessAlert(): void {
    this.showSuccessAlert.set(false);
  }

  hideErrorAlert(): void {
    this.showErrorAlert.set(false);
  }

  isFormValid(): boolean {
    return this.draft.isComplete();
  }

  private resetFormKeepingSuccess(): void {
    const methodologyFailed = this.methodologyFailed();
    this.resetForm();
    this.showSuccessAlert.set(true);
    this.methodologyFailed.set(methodologyFailed);
  }

  /**
   * Writes the methodology onto the indicator.
   *
   * Only `processDescription` is sent. Master rebuilds a full metadata body and
   * had to be fixed once because it carried `permissions` along (`b37d60ec`); a
   * one-field patch cannot reintroduce that class of bug.
   */
  private async patchMethodology(indicatorId: string, processDescription: string): Promise<void> {
    const url = this.envConfigService.baseUrlToKomMonitorDataAPI + '/indicators/' + indicatorId;
    await this.http.patch(url, { processDescription }).toPromise();
  }

  private enumLabel(inputKey: string, apiName: string): string {
    const declaration = this.draft.selectedProcess()?.description.inputs?.[inputKey];
    const option = declaration?.schema?.enum?.find((entry) => entry.apiName === apiName);
    return option?.displayName ?? apiName;
  }
}
