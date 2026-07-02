import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  Output,
  EventEmitter,
} from '@angular/core';
import { IndicatorRefreshRequest } from '../indicator-refresh.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { HttpClient } from '@angular/common/http';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { CommonModule } from '@angular/common';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { IndicatorAddFormStateService } from './indicator-add-form-state.service';
import { IndicatorAddStep1BasicComponent } from './steps/indicator-add-step1-basic.component';
import { IndicatorAddStep2MetadataComponent } from './steps/indicator-add-step2-metadata.component';
import { IndicatorAddStep3TopicsComponent } from './steps/indicator-add-step3-topics.component';
import { IndicatorAddStep4ReferencesComponent } from './steps/indicator-add-step4-references.component';
import { IndicatorAddStep5ClassificationComponent } from './steps/indicator-add-step5-classification.component';
import { IndicatorAddStep6ComparisonComponent } from './steps/indicator-add-step6-comparison.component';
import { IndicatorAddStep7AccessComponent } from './steps/indicator-add-step7-access.component';

@Component({
  selector: 'app-indicator-add-modal',
  templateUrl: './indicator-add-modal.component.html',
  styleUrls: ['./indicator-add-modal.component.scss', './indicator-add-form.shared.scss'],
  imports: [
    CommonModule,
    StepperComponent,
    IndicatorAddStep1BasicComponent,
    IndicatorAddStep2MetadataComponent,
    IndicatorAddStep3TopicsComponent,
    IndicatorAddStep4ReferencesComponent,
    IndicatorAddStep5ClassificationComponent,
    IndicatorAddStep6ComparisonComponent,
    IndicatorAddStep7AccessComponent,
  ],
  providers: [IndicatorAddFormStateService],
  standalone: true,
})
export class IndicatorAddModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  protected state = inject(IndicatorAddFormStateService);
  private indicatorValueService = inject(IndicatorValueService);
  private http = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  protected envConfigService = inject(EnvConfigService);

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;

  @Output() refreshRequested = new EventEmitter<IndicatorRefreshRequest>();

  ngOnInit() {
    this.state.loadInitialData();
    this.state.initializeMultiStepForm();
  }

  async addIndicator() {
    this.state.loadingData = true;
    this.state.successMessagePart = '';
    this.state.errorMessagePart = '';

    try {
      this.state.postBody_indicators = this.state.buildPostBody_indicators();

      // Check if service is available
      if (!this.envConfigService.baseUrlToKomMonitorDataAPI) {
        throw new Error('Data exchange service not available');
      }

      const response = await this.http
        .post(
          this.envConfigService.baseUrlToKomMonitorDataAPI + '/indicators',
          this.state.postBody_indicators
        )
        .toPromise();

      this.refreshRequested.emit({
        crudType: 'add',
        targetIndicatorId: (response as any).indicatorId,
      });

      // Refresh all admin dashboard diagrams due to modified metadata
      setTimeout(() => {
        this.broadcastService.broadcast(BroadcastMessage.RefreshAdminDashboardDiagrams);
      }, 500);

      this.state.successMessagePart = this.state.postBody_indicators.datasetName;
      this.state.loadingData = false;

      // Close modal with success result
      setTimeout(() => {
        this.activeModal.close('success');
      }, 2000);
    } catch (error: any) {
      this.state.errorMessagePart = this.indicatorValueService.formatError(error);
      this.state.loadingData = false;
    }
  }

  onSubmit() {
    if (!this.state.datasetNameInvalid && !this.state.classBreaksInvalid) {
      this.addIndicator();
    }
  }

  // Import/Export functionality
  onImportIndicatorAddMetadata() {
    this.state.indicatorMetadataImportError = '';
    if (this.metadataImportFile) {
      this.metadataImportFile.nativeElement.click();
    }
  }

  onMetadataFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.state.parseMetadataFromFile(file);
    }
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }
}
