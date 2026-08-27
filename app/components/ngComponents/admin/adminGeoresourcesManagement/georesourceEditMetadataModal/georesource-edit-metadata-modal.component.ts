import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { getErrorMessage } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { GeoresourceRefreshRequest } from '../georesource-refresh.model';

import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
import { TopicHierarchyFormComponent } from '../../adminShared/topicHierarchyForm/topic-hierarchy-form.component';
import {
  buildTopicHierarchyForm,
  patchTopicHierarchyFromChain,
  topicHierarchyToApi,
} from '../../adminShared/topicHierarchyForm/topic-hierarchy-form.model';
import {
  DEFAULT_AOI_COLOR,
  DEFAULT_LOI_COLOR,
  DEFAULT_LOI_WIDTH,
  DEFAULT_POI_ICON_NAME,
  DEFAULT_POI_MARKER_STYLE,
  buildGeoresourceMetadataStep,
} from '../georesourceAddModal/georesource-add-form.model';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { FormControlAriaDirective } from '../../adminShared/formError/form-control-aria.directive';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from 'components/ngComponents/customElements/line-pattern-picker/km-line-pattern-picker.component';
import {
  LOI_DASH_ARRAY_OBJECTS,
  POI_MARKER_COLORS,
} from 'services/poi-presentation-service/poi-presentation.service';
import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';
import { TopicHierarchyService } from '../../../../../services/topic-hierarchy-service/topic-hierarchy.service';
import { ResourceMetadataFormComponent } from '../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import {
  buildResourceMetadataForm,
  metadataFormToApi,
  patchMetadataFormFromApi,
  ResourceMetadataFormValue,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import { AdminTopicsManagementComponent } from '../../adminTopicsManagement/admin-topics-management.component';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-georesource-edit-metadata-modal',
  templateUrl: './georesource-edit-metadata-modal.component.html',
  styleUrls: ['./georesource-edit-metadata-modal.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TopicHierarchyFormComponent,
    FormErrorComponent,
    FormControlAriaDirective,
    AdminTopicsManagementComponent,
    StepperComponent,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
    ResourceMetadataFormComponent,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoresourceEditMetadataModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);

  /** Emitted after a successful metadata update so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<GeoresourceRefreshRequest>();
  protected accessControlService = inject(AccessControlService);
  private indicatorValueService = inject(IndicatorValueService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private topicHierarchyService = inject(TopicHierarchyService);
  private http = inject(HttpClient);
  protected envConfigService = inject(EnvConfigService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;

  // Component state — signal: toggled from the PATCH subscription (OnPush).
  loadingData = signal(false);
  currentGeoresourceDataset: any;
  readonly stepper = new WizardStepper([
    { key: 'metadata', label: 'ADMIN_SHARED_UI.STEP_LABELS.GEORESOURCE_METADATA' },
    { key: 'general', label: 'ADMIN_SHARED_UI.STEP_LABELS.GENERAL_METADATA' },
    { key: 'topics', label: 'ADMIN_SHARED_UI.TOPICS.TITLE' },
  ]);

  // Form data
  /**
   * Name, type and the nine style fields — the same block as the add wizard's
   * first step, plus the four-level topic cascade. The accessors below keep the
   * historic property names working for the patch-body/export builders.
   */
  readonly metadataStep = buildGeoresourceMetadataStep({
    existingDatasetNames: () =>
      (this.georesourceStore.availableGeoresources ?? []).map((g: any) => g.datasetName),
    currentDatasetName: () => this.currentGeoresourceDataset?.datasetName ?? null,
  });
  readonly topicsForm = buildTopicHierarchyForm({ requireMainTopic: true });

  private get styleGroup() {
    return this.metadataStep.controls.style;
  }

  get datasetName(): string {
    return this.metadataStep.controls.datasetName.value;
  }
  set datasetName(value: string) {
    this.metadataStep.controls.datasetName.setValue(value ?? '');
  }
  get datasetNameInvalid(): boolean {
    return this.metadataStep.controls.datasetName.hasError('uniqueName');
  }
  get poiMarkerText(): string {
    return this.styleGroup.controls.poiMarkerText.value;
  }
  set poiMarkerText(value: string) {
    this.styleGroup.controls.poiMarkerText.setValue(value ?? '');
  }
  get poiMarkerTextInvalid(): boolean {
    return this.styleGroup.controls.poiMarkerText.hasError('maxlength');
  }

  // Metadata
  metadataForm = buildResourceMetadataForm();
  /** Read-only view of the metadata form value for patch-body/export building. */
  get metadata(): ResourceMetadataFormValue {
    return this.metadataForm.getRawValue();
  }

  // Georesource type
  get georesourceType(): string {
    return this.metadataStep.controls.georesourceType.value;
  }
  set georesourceType(value: string) {
    this.metadataStep.controls.georesourceType.setValue(
      value === 'loi' || value === 'aoi' ? value : 'poi'
    );
  }
  get isPOI(): boolean {
    return this.georesourceType === 'poi';
  }
  get isLOI(): boolean {
    return this.georesourceType === 'loi';
  }
  get isAOI(): boolean {
    return this.georesourceType === 'aoi';
  }

  // POI specific
  get selectedPoiMarkerColor(): any {
    return this.styleGroup.controls.poiMarkerColor.value;
  }
  set selectedPoiMarkerColor(value: any) {
    this.styleGroup.controls.poiMarkerColor.setValue(value ?? null);
  }
  get selectedPoiSymbolColor(): any {
    return this.styleGroup.controls.poiSymbolColor.value;
  }
  set selectedPoiSymbolColor(value: any) {
    this.styleGroup.controls.poiSymbolColor.setValue(value ?? null);
  }
  get selectedPoiMarkerStyle(): string {
    return this.styleGroup.controls.poiMarkerStyle.value;
  }
  set selectedPoiMarkerStyle(value: string) {
    this.styleGroup.controls.poiMarkerStyle.setValue(value || DEFAULT_POI_MARKER_STYLE);
  }
  get selectedPoiIconName(): string {
    return this.styleGroup.controls.poiIconName.value;
  }
  set selectedPoiIconName(value: string) {
    this.styleGroup.controls.poiIconName.setValue(value || DEFAULT_POI_ICON_NAME);
  }

  // LOI specific
  get selectedLoiDashArrayObject(): any {
    return this.styleGroup.controls.loiDashArray.value;
  }
  set selectedLoiDashArrayObject(value: any) {
    this.styleGroup.controls.loiDashArray.setValue(value ?? null);
  }
  get loiColor(): string {
    return this.styleGroup.controls.loiColor.value;
  }
  set loiColor(value: string) {
    this.styleGroup.controls.loiColor.setValue(value || DEFAULT_LOI_COLOR);
  }
  get loiWidth(): number {
    return this.styleGroup.controls.loiWidth.value;
  }
  set loiWidth(value: number) {
    this.styleGroup.controls.loiWidth.setValue(value ?? DEFAULT_LOI_WIDTH);
  }

  // AOI specific
  get aoiColor(): string {
    return this.styleGroup.controls.aoiColor.value;
  }
  set aoiColor(value: string) {
    this.styleGroup.controls.aoiColor.setValue(value || DEFAULT_AOI_COLOR);
  }

  // Topic hierarchy
  get georesourceTopic_mainTopic(): any {
    return this.topicsForm.controls.mainTopic.value;
  }
  set georesourceTopic_mainTopic(value: any) {
    this.topicsForm.controls.mainTopic.setValue(value ?? null);
  }
  get georesourceTopic_subTopic(): any {
    return this.topicsForm.controls.subTopic.value;
  }
  set georesourceTopic_subTopic(value: any) {
    this.topicsForm.controls.subTopic.setValue(value ?? null);
  }
  get georesourceTopic_subsubTopic(): any {
    return this.topicsForm.controls.subsubTopic.value;
  }
  set georesourceTopic_subsubTopic(value: any) {
    this.topicsForm.controls.subsubTopic.setValue(value ?? null);
  }
  get georesourceTopic_subsubsubTopic(): any {
    return this.topicsForm.controls.subsubsubTopic.value;
  }
  set georesourceTopic_subsubsubTopic(value: any) {
    this.topicsForm.controls.subsubsubTopic.setValue(value ?? null);
  }

  // Roles pass-through for the metadata export only: metadata editing does not
  // manage permissions (that is the edit-user-roles modal's job, like in the
  // spatial-unit area), and GeoresourcePATCHInputType has no permission field —
  // so these are written to an exported metadata file but never PATCHed.
  // Sourced from the dataset on reset and from an imported metadata file.
  // Historically this went through an invisible role grid that was never
  // rendered.
  permissions: string[] = [];

  // Import/Export
  metadataImportSettings: any;
  // Signal: written from the async FileReader callback (OnPush).
  georesourceMetadataImportError = signal('');
  georesourceMetadataStructure: any;
  georesourceMetadataStructure_pretty: string = '';

  readonly poiMarkerColors = POI_MARKER_COLORS;

  /** LOI dash patterns mapped for the Angular line-pattern picker. */
  readonly availableLinePatternOptions: LinePatternOption[] = LOI_DASH_ARRAY_OBJECTS.map(
    (option) => ({
      label: option.dashArrayValue || 'durchgezogen',
      dashArrayValue: option.dashArrayValue,
      svgString: option.svgString,
    })
  );

  // Alert visibility (template binding; formerly toggled via document.getElementById).
  // Success/error feedback is toasted via NotificationService; only the inline
  // metadata-import error report remains.
  importErrorAlertVisible = signal(false);

  constructor() {
    this.initializeDefaultValues();
  }

  ngOnInit(): void {
    // The dataset arrives via the componentInstance input set by the management
    // component; the former OnEditGeoresourceMetadata broadcast subscription read
    // a non-existent payload field and never fired with data.
    this.initializeMetadataStructure();
  }

  private initializeDefaultValues(): void {
    this.selectedPoiMarkerColor = POI_MARKER_COLORS[0];
    this.selectedPoiSymbolColor = POI_MARKER_COLORS[1];
    this.selectedLoiDashArrayObject = LOI_DASH_ARRAY_OBJECTS[0];
  }

  private initializeMetadataStructure(): void {
    this.georesourceMetadataStructure = {
      metadata: {
        note: 'an optional note',
        literature: 'optional text about literature',
        updateInterval: 'YEARLY|HALF_YEARLY|QUARTERLY|MONTHLY|ARBITRARY',
        sridEPSG: 4326,
        datasource: 'text about data source',
        contact: 'text about contact details',
        lastUpdate: 'YYYY-MM-DD',
        description: 'description about spatial unit dataset',
        databasis: 'text about data basis',
      },
      permissions: ['roleId'],
      datasetName: 'Name of georesource dataset',
      isPOI:
        'boolean parameter for point of interest dataset - only one of isPOI, isLOI, isAOI can be true',
      isLOI:
        'boolean parameter for lines of interest dataset - only one of isPOI, isLOI, isAOI can be true',
      isAOI:
        'boolean parameter for area of interest dataset - only one of isPOI, isLOI, isAOI can be true',
      poiSymbolBootstrap3Name: 'glyphicon name of bootstrap 3 symbol to use for a POI resource',
      poiSymbolColor:
        "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
      loiDashArrayString: 'dash array string value - e.g. 20 20',
      poiMarkerColor:
        "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
      loiColor: 'color for lines of interest dataset',
      loiWidth: 'width for lines of interest dataset',
      aoiColor: 'color for area of interest dataset',
    };

    this.georesourceMetadataStructure_pretty = this.indicatorValueService.syntaxHighlightJSON(
      this.georesourceMetadataStructure
    );
  }

  // Form methods
  resetGeoresourceEditMetadataForm(): void {
    if (!this.currentGeoresourceDataset) return;

    this.stepper.reset();
    this.datasetName = this.currentGeoresourceDataset.datasetName;

    // Reset metadata from the dataset being edited
    patchMetadataFormFromApi(
      this.metadataForm,
      this.currentGeoresourceDataset.metadata,
      this.envConfigService.updateIntervalOptions
    );

    this.permissions = [...(this.currentGeoresourceDataset.permissions ?? [])];

    // Set georesource type
    this.georesourceType = this.currentGeoresourceDataset.isPOI
      ? 'poi'
      : this.currentGeoresourceDataset.isLOI
        ? 'loi'
        : 'aoi';

    if (this.isPOI) {
      this.georesourceType = 'poi';
    } else if (this.isLOI) {
      this.georesourceType = 'loi';
    } else {
      this.georesourceType = 'aoi';
    }

    // Set POI colors
    POI_MARKER_COLORS.forEach((option: any) => {
      if (option.colorName === this.currentGeoresourceDataset.poiMarkerColor) {
        this.selectedPoiMarkerColor = option;
      }
      if (option.colorName === this.currentGeoresourceDataset.poiSymbolColor) {
        this.selectedPoiSymbolColor = option;
      }
    });

    // Set LOI properties
    this.availableLinePatternOptions.forEach((option) => {
      if (option.dashArrayValue === this.currentGeoresourceDataset.loiDashArrayString) {
        this.selectedLoiDashArrayObject = option;
      }
    });

    this.loiColor = this.currentGeoresourceDataset.loiColor;
    this.loiWidth = this.currentGeoresourceDataset.loiWidth || 3;
    this.aoiColor = this.currentGeoresourceDataset.aoiColor;
    this.selectedPoiIconName = this.currentGeoresourceDataset.poiSymbolBootstrap3Name;

    // Set topic hierarchy
    const topicHierarchy = this.topicHierarchyService.getTopicHierarchyForTopicId(
      this.topicStore.availableTopics,
      this.currentGeoresourceDataset.topicReference
    );

    patchTopicHierarchyFromChain(this.topicsForm, topicHierarchy);
  }

  // Validation methods
  /** The rule is `uniqueNameValidator` on the control now. */
  checkDatasetName(): void {
    this.metadataStep.controls.datasetName.updateValueAndValidity();
  }

  /** The rule is `Validators.maxLength(3)` on the control now. */
  checkPoiMarkerText(): void {
    this.styleGroup.controls.poiMarkerText.updateValueAndValidity();
  }

  // Georesource type change. isPOI/isLOI/isAOI are derived from the single
  // georesourceType control now; kept as a template hook.
  onChangeGeoresourceType(): void {
    this.georesourceType = this.georesourceType;
  }

  // POI methods
  onChangeMarkerColor(markerColor: any): void {
    this.selectedPoiMarkerColor = markerColor;
  }

  onChangeSymbolColor(symbolColor: any): void {
    this.selectedPoiSymbolColor = symbolColor;
  }

  onChangeMarkerStyle(style: string): void {
    this.selectedPoiMarkerStyle = style;
  }

  // LOI methods
  onChangeLoiDashArray(loiDashArrayObject: LinePatternOption | null): void {
    this.selectedLoiDashArrayObject = loiDashArrayObject;
  }

  // Import/Export methods
  onImportGeoresourceEditMetadata(): void {
    this.georesourceMetadataImportError.set('');
    this.metadataImportFile.nativeElement.click();
  }

  onMetadataFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.parseMetadataFromFile(file);
    }
  }

  private parseMetadataFromFile(file: File): void {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMetadataFile(event);
      } catch {
        console.error('Uploaded Metadata File cannot be parsed.');
        this.georesourceMetadataImportError.set(
          'Uploaded Metadata File cannot be parsed correctly'
        );
        this.showMetadataImportErrorAlert();
      }
      // The import rewrites many ngModel-bound fields from an async callback —
      // mark the OnPush view once instead of converting each field to a signal.
      this.cdr.markForCheck();
    };

    fileReader.readAsText(file);
  }

  private parseFromMetadataFile(event: any): void {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      console.error('uploaded Metadata File cannot be parsed - wrong structure.');
      this.georesourceMetadataImportError.set(
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.'
      );
      this.showMetadataImportErrorAlert();
      return;
    }

    // Parse metadata
    patchMetadataFormFromApi(
      this.metadataForm,
      this.metadataImportSettings.metadata,
      this.envConfigService.updateIntervalOptions
    );

    this.datasetName = this.metadataImportSettings.datasetName;

    this.permissions = [...(this.metadataImportSettings.permissions ?? [])];

    // Set georesource specific properties
    this.georesourceType = this.metadataImportSettings.isPOI
      ? 'poi'
      : this.metadataImportSettings.isLOI
        ? 'loi'
        : 'aoi';

    if (this.metadataImportSettings.isPOI) {
      this.georesourceType = 'poi';
    } else if (this.metadataImportSettings.isLOI) {
      this.georesourceType = 'loi';
    } else {
      this.georesourceType = 'aoi';
    }

    // Set POI colors
    POI_MARKER_COLORS.forEach((option: any) => {
      if (option.colorName === this.metadataImportSettings.poiMarkerColor) {
        this.selectedPoiMarkerColor = option;
      }
      if (option.colorName === this.metadataImportSettings.poiSymbolColor) {
        this.selectedPoiSymbolColor = option;
      }
    });

    // Set LOI properties
    this.availableLinePatternOptions.forEach((option) => {
      if (option.dashArrayValue === this.metadataImportSettings.loiDashArrayString) {
        this.selectedLoiDashArrayObject = option;
      }
    });

    this.loiColor = this.metadataImportSettings.loiColor;
    this.loiWidth = this.metadataImportSettings.loiWidth;
    this.aoiColor = this.metadataImportSettings.aoiColor;
    this.selectedPoiIconName = this.metadataImportSettings.poiSymbolBootstrap3Name;

    // Set topic hierarchy
    const topicHierarchy = this.topicHierarchyService.getTopicHierarchyForTopicId(
      this.topicStore.availableTopics,
      this.metadataImportSettings.topicReference
    );

    patchTopicHierarchyFromChain(this.topicsForm, topicHierarchy);
  }

  onExportGeoresourceEditMetadata(): void {
    const metadataExport = JSON.parse(JSON.stringify(this.georesourceMetadataStructure));

    metadataExport.metadata.note = this.metadata.note || '';
    metadataExport.metadata.literature = this.metadata.literature || '';
    metadataExport.metadata.sridEPSG = this.metadata.sridEPSG || '';
    metadataExport.metadata.datasource = this.metadata.datasource || '';
    metadataExport.metadata.contact = this.metadata.contact || '';
    metadataExport.metadata.lastUpdate = this.metadata.lastUpdate || '';
    metadataExport.metadata.description = this.metadata.description || '';
    metadataExport.metadata.databasis = this.metadata.databasis || '';
    metadataExport.datasetName = this.datasetName || '';

    metadataExport.permissions = [...this.permissions];

    if (this.metadata.updateInterval) {
      metadataExport.metadata.updateInterval = this.metadata.updateInterval.apiName;
    }

    // Georesource specific properties
    metadataExport.isPOI = this.isPOI;
    metadataExport.isLOI = this.isLOI;
    metadataExport.isAOI = this.isAOI;

    if (this.isPOI) {
      metadataExport.poiSymbolBootstrap3Name = this.selectedPoiIconName;
      metadataExport.poiSymbolColor = this.selectedPoiSymbolColor.colorName;
      metadataExport.poiMarkerColor = this.selectedPoiMarkerColor.colorName;
      metadataExport.loiDashArrayString = '';
      metadataExport.loiColor = '';
      metadataExport.loiWidth = '';
      metadataExport.aoiColor = '';
    } else if (this.isLOI) {
      metadataExport.poiSymbolBootstrap3Name = '';
      metadataExport.poiSymbolColor = '';
      metadataExport.poiMarkerColor = '';
      metadataExport.loiDashArrayString = this.selectedLoiDashArrayObject.dashArrayValue;
      metadataExport.loiColor = this.loiColor;
      metadataExport.loiWidth = this.loiWidth;
      metadataExport.aoiColor = '';
    } else if (this.isAOI) {
      metadataExport.poiSymbolBootstrap3Name = '';
      metadataExport.poiSymbolColor = '';
      metadataExport.poiMarkerColor = '';
      metadataExport.loiDashArrayString = '';
      metadataExport.loiColor = '';
      metadataExport.loiWidth = '';
      metadataExport.aoiColor = this.aoiColor;
    }

    // Set topic reference
    metadataExport.topicReference = topicHierarchyToApi(this.topicsForm);

    const metadataJSON = JSON.stringify(metadataExport);
    let fileName = 'Georessource_Metadaten_Export';

    if (this.datasetName) {
      fileName += '-' + this.datasetName;
    }

    fileName += '.json';

    const blob = new Blob([metadataJSON], { type: 'application/json' });
    const data = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = 'JSON';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();

    a.remove();
  }

  // Main edit method
  editGeoresourceMetadata(): void {
    // No permission field: GeoresourcePATCHInputType does not declare one and
    // the AngularJS original never sent one either.
    const patchBody: any = {
      metadata: metadataFormToApi(this.metadataForm),
      datasetName: this.datasetName,
      isAOI: this.isAOI,
      isLOI: this.isLOI,
      isPOI: this.isPOI,
      topicReference: null,
    };

    if (this.isPOI) {
      patchBody.poiSymbolBootstrap3Name = this.selectedPoiIconName;
      patchBody.poiSymbolColor = this.selectedPoiSymbolColor.colorName;
      patchBody.poiMarkerColor = this.selectedPoiMarkerColor.colorName;
      patchBody.loiDashArrayString = null;
      patchBody.loiColor = null;
      patchBody.loiWidth = null;
      patchBody.aoiColor = null;
    } else if (this.isLOI) {
      patchBody.poiSymbolBootstrap3Name = null;
      patchBody.poiSymbolColor = null;
      patchBody.poiMarkerColor = null;
      patchBody.loiDashArrayString = this.selectedLoiDashArrayObject.dashArrayValue;
      patchBody.loiColor = this.loiColor;
      patchBody.loiWidth = this.loiWidth;
      patchBody.aoiColor = null;
    } else if (this.isAOI) {
      patchBody.poiSymbolBootstrap3Name = null;
      patchBody.poiSymbolColor = null;
      patchBody.poiMarkerColor = null;
      patchBody.loiDashArrayString = null;
      patchBody.loiColor = null;
      patchBody.loiWidth = null;
      patchBody.aoiColor = this.aoiColor;
    }

    // Set topic reference
    patchBody.topicReference = topicHierarchyToApi(this.topicsForm);

    this.loadingData.set(true);

    this.http
      .patch(
        this.envConfigService.baseUrlToKomMonitorDataAPI +
          '/georesources/' +
          this.currentGeoresourceDataset.georesourceId,
        patchBody
      )
      .subscribe({
        next: (_response: any) => {
          this.refreshRequested.emit({
            crudType: 'edit',
            targetGeoresourceId: this.currentGeoresourceDataset.georesourceId,
          });
          this.loadingData.set(false);
          this.notificationService.showSuccess(
            this.translate.instant('ADMIN_GEORESOURCES.METADATA_MODAL.MSG.METADATA_UPDATED', {
              name: this.datasetName,
            })
          );
          this.activeModal.close({
            action: 'updated',
            georesourceId: this.currentGeoresourceDataset.georesourceId,
          });
        },
        error: (error: any) => {
          this.notificationService.showError(
            this.translate.instant('ADMIN_GEORESOURCES.METADATA_MODAL.MSG.METADATA_UPDATE_FAILED', {
              error: getErrorMessage(error),
            })
          );
          this.loadingData.set(false);
        },
      });
  }

  // Alert methods (template-bound flags)
  showMetadataImportErrorAlert(): void {
    this.importErrorAlertVisible.set(true);
  }

  hideMetadataErrorAlert(): void {
    this.importErrorAlertVisible.set(false);
  }

  // Get filtered topics for georesource
  getMainTopicsForGeoresource(): any[] {
    return this.topicStore.availableTopics.filter(
      (topic: any) => topic.topicType === 'main' && topic.topicResource === 'georesource'
    );
  }

  // Validation for form submission
  canSubmitForm(): boolean {
    return this.metadataStep.valid && this.metadataForm.valid && this.topicsForm.valid;
  }

  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }
}
