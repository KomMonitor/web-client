import { Component, ViewChild, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { FormsModule } from '@angular/forms';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';
import { ScriptStepIntroductionComponent } from './scriptStepIntroduction/script-step-introduction.component';
import {
  ScriptMetadata,
  ScriptStepMetadataComponent,
} from './scriptStepMetadata/script-step-metadata.component';
import { ScriptStepContentComponent } from './scriptStepContent/script-step-content.component';
import { StepperComponent, StepperStep } from '../../../common/stepper/stepper.component';

@Component({
  selector: 'app-script-add-modal',
  templateUrl: './script-add-modal.component.html',
  styleUrls: ['./script-add-modal.component.scss'],
  imports: [
    FormsModule,
    StepperComponent,
    ScriptStepIntroductionComponent,
    ScriptStepMetadataComponent,
    ScriptStepContentComponent,
  ],
  standalone: true,
})
export class ScriptAddModalComponent {
  activeModal = inject(NgbActiveModal);
  scriptHelperService = inject(ScriptHelperService);
  private broadcastService = inject(BroadcastService);

  currentStep: number = 1;

  readonly stepperSteps: StepperStep[] = [
    { label: 'Einleitende Hinweise' },
    { label: 'Metadaten des Indikators-Skripts' },
    { label: 'Skriptinhalt und Parametrisierung' },
  ];

  @ViewChild(ScriptStepContentComponent)
  scriptStepContent!: ScriptStepContentComponent;

  scriptMetadata: ScriptMetadata = {
    name: '',
    description: '',
    associatedIndicatorId: '',
  };

  loadingData: boolean = false;
  // Alerts
  showSuccessAlert: boolean = false;
  showErrorAlert: boolean = false;
  errorMessagePart: string = '';
  successMessagePart: string = '';

  resetForm(): void {
    this.currentStep = 1;
    this.scriptMetadata = {
      name: '',
      description: '',
      associatedIndicatorId: '',
    };
    this.showSuccessAlert = false;
    this.showErrorAlert = false;
    this.errorMessagePart = '';
    this.successMessagePart = '';
    this.scriptHelperService.reset();
    this.scriptStepContent?.reset();
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }

  nextStep(): void {
    if (this.currentStep < this.stepperSteps.length) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // ---- Submit ----
  async addScript(): Promise<void> {
    this.loadingData = true;
    this.showSuccessAlert = false;
    this.showErrorAlert = false;
    this.errorMessagePart = '';
    this.successMessagePart = '';

    // this.prepareParametersForScriptType();

    const name = this.scriptMetadata.name.trim();
    const description = this.scriptMetadata.description.trim();
    const associatedIndicatorId = this.scriptMetadata.associatedIndicatorId.trim();
    try {
      await this.scriptHelperService.postNewScript(name, description, associatedIndicatorId);

      this.broadcastService.broadcast(BroadcastMessage.RefreshScriptOverviewTable, {
        crudType: 'add',
      });
      this.broadcastService.broadcast(BroadcastMessage.RefreshAdminDashboardDiagrams);
      this.showSuccessAlert = true;
      this.loadingData = false;
    } catch (error: any) {
      const errData = error?.error || error;
      this.errorMessagePart = JSON.stringify(errData, null, 2);
      this.showErrorAlert = true;
      this.loadingData = false;
    }
  }

  hideSuccessAlert(): void {
    this.showSuccessAlert = false;
  }

  hideErrorAlert(): void {
    this.showErrorAlert = false;
  }

  isFormValid(): boolean {
    return (
      this.scriptMetadata.name.trim() !== '' &&
      this.scriptMetadata.description.trim() !== '' &&
      this.scriptMetadata.associatedIndicatorId.trim() !== ''
    );
  }
}
