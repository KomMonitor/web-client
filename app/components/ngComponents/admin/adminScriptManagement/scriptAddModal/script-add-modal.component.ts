import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { FormsModule } from '@angular/forms';
import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';
import { ScriptStepIntroductionComponent } from './scriptStepIntroduction/script-step-introduction.component';
import {
  ScriptMetadata,
  ScriptStepMetadataComponent,
} from './scriptStepMetadata/script-step-metadata.component';
import { ScriptStepContentComponent } from './scriptStepContent/script-step-content.component';
import { StepperComponent } from '../../../common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { ScriptRefreshRequest } from '../script-refresh.model';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-script-add-modal',
  templateUrl: './script-add-modal.component.html',
  styleUrls: ['./script-add-modal.component.scss'],
  imports: [
    TranslateModule,
    FormsModule,
    StepperComponent,
    ScriptStepIntroductionComponent,
    ScriptStepMetadataComponent,
    ScriptStepContentComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptAddModalComponent {
  activeModal = inject(NgbActiveModal);
  scriptHelperService = inject(ScriptHelperService);

  // Asks the management component to refresh the overview table; replaces the
  // former RefreshScriptOverviewTable broadcast round-trip.
  @Output() refreshRequested = new EventEmitter<ScriptRefreshRequest>();

  readonly stepper = new WizardStepper([
    { key: 'intro', label: 'Einleitende Hinweise' },
    { key: 'metadata', label: 'Metadaten des Indikators-Skripts' },
    { key: 'script', label: 'Skriptinhalt und Parametrisierung' },
  ]);

  @ViewChild(ScriptStepContentComponent)
  scriptStepContent!: ScriptStepContentComponent;

  scriptMetadata: ScriptMetadata = {
    name: '',
    description: '',
    associatedIndicatorId: '',
  };

  // Signal-backed: written after the awaited script POST in addScript(), which
  // would not trigger a re-render of this OnPush component otherwise.
  loadingData = signal(false);
  // Alerts
  showSuccessAlert = signal(false);
  showErrorAlert = signal(false);
  errorMessagePart = signal('');
  successMessagePart: string = '';

  resetForm(): void {
    this.stepper.reset();
    this.scriptMetadata = {
      name: '',
      description: '',
      associatedIndicatorId: '',
    };
    this.showSuccessAlert.set(false);
    this.showErrorAlert.set(false);
    this.errorMessagePart.set('');
    this.successMessagePart = '';
    this.scriptHelperService.reset();
    this.scriptStepContent?.reset();
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  // ---- Submit ----
  async addScript(): Promise<void> {
    this.loadingData.set(true);
    this.showSuccessAlert.set(false);
    this.showErrorAlert.set(false);
    this.errorMessagePart.set('');
    this.successMessagePart = '';

    // this.prepareParametersForScriptType();

    const name = this.scriptMetadata.name.trim();
    const description = this.scriptMetadata.description.trim();
    const associatedIndicatorId = this.scriptMetadata.associatedIndicatorId.trim();
    try {
      await this.scriptHelperService.postNewScript(name, description, associatedIndicatorId);

      this.refreshRequested.emit({ crudType: 'add' });
      this.showSuccessAlert.set(true);
      this.loadingData.set(false);
    } catch (error: any) {
      const errData = error?.error || error;
      this.errorMessagePart.set(JSON.stringify(errData, null, 2));
      this.showErrorAlert.set(true);
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
    return (
      this.scriptMetadata.name.trim() !== '' &&
      this.scriptMetadata.description.trim() !== '' &&
      this.scriptMetadata.associatedIndicatorId.trim() !== ''
    );
  }
}
