import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { IndicatorRefreshRequest } from '../indicator-refresh.model';
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
    TranslateModule,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  protected state = inject(IndicatorAddFormStateService);
  private indicatorValueService = inject(IndicatorValueService);
  private http = inject(HttpClient);
  protected envConfigService = inject(EnvConfigService);
  private modalService = inject(NgbModal);
  private cdr = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  // Re-render this OnPush view whenever the shared form-state service reports
  // an async bulk rewrite of its plain fields (see stateRevision docs).
  private readonly stateSync = effect(() => {
    this.state.stateRevision();
    this.cdr.markForCheck();
  });

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

      this.state.loadingData = false;

      if (isEdit) {
        this.notificationService.showSuccess(
          this.translate.instant('ADMIN_INDICATORS.ADD_MODAL.SUCCESS_UPDATED_TEXT', {
            name: this.state.postBody_indicators.datasetName,
          })
        );
        this.activeModal.close('success');
        return;
      }

      this.state.successMessagePart = this.state.postBody_indicators.datasetName;

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
