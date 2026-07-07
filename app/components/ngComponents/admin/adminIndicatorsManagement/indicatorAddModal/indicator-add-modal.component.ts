import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  TemplateRef,
  inject,
  Output,
  EventEmitter,
} from '@angular/core';
import { IndicatorRefreshRequest } from '../indicator-refresh.model';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
  private modalService = inject(NgbModal);

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('missingFieldsModal', { static: false }) missingFieldsModalTpl!: TemplateRef<unknown>;

  @Output() refreshRequested = new EventEmitter<IndicatorRefreshRequest>();

  // Set by the caller (before ngOnInit) to open the wizard in edit mode,
  // pre-filled with this existing indicator's metadata. Left null for "add new".
  editIndicatorDataset: any = null;

  // Required fields still missing when the user tried to register (for the dialog).
  protected missingFields: { label: string }[] = [];

  ngOnInit() {
    this.state.loadInitialData();
    this.state.initializeMultiStepForm();

    // Edit mode: pre-fill the whole wizard from the existing indicator. Runs
    // after the init above so option lists and classification tabs already exist.
    if (this.editIndicatorDataset) {
      this.state.enterEditMode(this.editIndicatorDataset);
    }
  }

  // Register (add) or save (edit) the indicator. Validates the required fields
  // first and, if any are still blank, lists them in a modal instead of sending
  // the request.
  async addIndicator() {
    this.missingFields = this.state.getV3MissingRequiredFields();
    if (this.missingFields.length > 0) {
      this.modalService.open(this.missingFieldsModalTpl, {
        backdrop: true,
        container: 'body',
        scrollable: true,
      });
      return;
    }

    if (this.state.editMode) {
      await this.submitIndicator(this.state.buildPatchBody_indicators_v3(), true);
    } else {
      await this.submitIndicator(this.state.buildPostBody_indicators_v3(), false);
    }
  }

  // Shared submit + success/refresh/error handling. Sends a POST to create a new
  // indicator, or a metadata PATCH to /indicators/{id} when editing.
  private async submitIndicator(body: any, isEdit: boolean) {
    this.state.loadingData = true;
    this.state.successMessagePart = '';
    this.state.errorMessagePart = '';

    try {
      this.state.postBody_indicators = body;

      // Check if service is available
      if (!this.envConfigService.baseUrlToKomMonitorDataAPI) {
        throw new Error('Data exchange service not available');
      }

      const indicatorsUrl = this.envConfigService.baseUrlToKomMonitorDataAPI + '/indicators';
      let targetIndicatorId: string;

      if (isEdit) {
        const indicatorId = this.state.editIndicatorId as string;
        await this.http.patch(indicatorsUrl + '/' + indicatorId, body).toPromise();
        targetIndicatorId = indicatorId;
      } else {
        const response = await this.http.post(indicatorsUrl, body).toPromise();
        targetIndicatorId = (response as any).indicatorId;
      }

      this.refreshRequested.emit({
        crudType: isEdit ? 'edit' : 'add',
        targetIndicatorId,
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
