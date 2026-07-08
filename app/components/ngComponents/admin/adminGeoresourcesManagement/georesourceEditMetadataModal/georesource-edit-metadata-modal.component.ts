import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { getErrorMessage } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { GeoresourceRefreshRequest } from '../georesource-refresh.model';

import {
  StepperComponent,
  StepperStep,
} from 'components/ngComponents/common/stepper/stepper.component';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
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

@Component({
  selector: 'app-georesource-edit-metadata-modal',
  templateUrl: './georesource-edit-metadata-modal.component.html',
  styleUrls: ['./georesource-edit-metadata-modal.component.scss'],
  imports: [
    FormsModule,
    AdminTopicsManagementComponent,
    StepperComponent,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
    ResourceMetadataFormComponent,
  ],
  standalone: true,
})
export class GeoresourceEditMetadataModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);

  /** Emitted after a successful metadata update so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<GeoresourceRefreshRequest>();
  protected accessControlService = inject(AccessControlService);
  private indicatorValueService = inject(IndicatorValueService);
  private notificationService = inject(NotificationService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private topicHierarchyService = inject(TopicHierarchyService);
  private http = inject(HttpClient);
  protected envConfigService = inject(EnvConfigService);

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;

  // Component state
  loadingData = false;
  currentGeoresourceDataset: any;
  currentStep = 1;
  steps: StepperStep[] = [
    { label: 'Metadaten der Georessource' },
    { label: 'Allgemeine Metadaten' },
    { label: 'Themenhierarchie' },
  ];

  // Form data
  datasetName: string = '';
  datasetNameInvalid = false;
  poiMarkerText: string = '';
  poiMarkerTextInvalid = false;

  // Metadata
  metadataForm = buildResourceMetadataForm();
  /** Read-only view of the metadata form value for patch-body/export building. */
  get metadata(): ResourceMetadataFormValue {
    return this.metadataForm.getRawValue();
  }

  // Georesource type
  georesourceType: string = 'poi';
  isPOI = true;
  isLOI = false;
  isAOI = false;

  // POI specific
  selectedPoiMarkerColor: any;
  selectedPoiSymbolColor: any;
  selectedPoiMarkerStyle: string = 'symbol';
  selectedPoiIconName: string = 'home';

  // LOI specific
  selectedLoiDashArrayObject: any;
  loiColor: string = '#bf3d2c';
  loiWidth: number = 3;

  // AOI specific
  aoiColor: string = '#bf3d2c';

  // Topic hierarchy
  georesourceTopic_mainTopic: any;
  georesourceTopic_subTopic: any;
  georesourceTopic_subsubTopic: any;
  georesourceTopic_subsubsubTopic: any;

  // Roles pass-through for PATCH/export: metadata editing does not manage
  // permissions (that is the edit-user-roles modal's job, like in the
  // spatial-unit area) — the current roles are just echoed back. Sourced from
  // the dataset on reset and from an imported metadata file. Historically this
  // went through an invisible role grid that was never rendered.
  allowedRoles: string[] = [];

  // Import/Export
  metadataImportSettings: any;
  georesourceMetadataImportError: string = '';
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
  importErrorAlertVisible = false;

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
      allowedRoles: ['roleId'],
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

    this.currentStep = 1;
    this.datasetName = this.currentGeoresourceDataset.datasetName;
    this.datasetNameInvalid = false;

    // Reset metadata from the dataset being edited
    patchMetadataFormFromApi(
      this.metadataForm,
      this.currentGeoresourceDataset.metadata,
      this.envConfigService.updateIntervalOptions
    );

    this.allowedRoles = [...(this.currentGeoresourceDataset.allowedRoles ?? [])];

    // Set georesource type
    this.isPOI = this.currentGeoresourceDataset.isPOI;
    this.isLOI = this.currentGeoresourceDataset.isLOI;
    this.isAOI = this.currentGeoresourceDataset.isAOI;

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

    if (topicHierarchy && topicHierarchy[0]) {
      this.georesourceTopic_mainTopic = topicHierarchy[0];
    }
    if (topicHierarchy && topicHierarchy[1]) {
      this.georesourceTopic_subTopic = topicHierarchy[1];
    }
    if (topicHierarchy && topicHierarchy[2]) {
      this.georesourceTopic_subsubTopic = topicHierarchy[2];
    }
    if (topicHierarchy && topicHierarchy[3]) {
      this.georesourceTopic_subsubsubTopic = topicHierarchy[3];
    }
  }

  // Validation methods
  checkDatasetName(): void {
    this.datasetNameInvalid = false;
    this.georesourceStore.availableGeoresources.forEach((georesource: any) => {
      if (
        georesource.datasetName === this.datasetName &&
        georesource.georesourceId !== this.currentGeoresourceDataset?.georesourceId
      ) {
        this.datasetNameInvalid = true;
        return;
      }
    });
  }

  checkPoiMarkerText(): void {
    this.poiMarkerTextInvalid = this.poiMarkerText.length > 3;
  }

  // Georesource type change
  onChangeGeoresourceType(): void {
    this.isPOI = this.georesourceType === 'poi';
    this.isLOI = this.georesourceType === 'loi';
    this.isAOI = this.georesourceType === 'aoi';
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
    this.georesourceMetadataImportError = '';
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
        this.georesourceMetadataImportError = 'Uploaded Metadata File cannot be parsed correctly';
        this.showMetadataImportErrorAlert();
      }
    };

    fileReader.readAsText(file);
  }

  private parseFromMetadataFile(event: any): void {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      console.error('uploaded Metadata File cannot be parsed - wrong structure.');
      this.georesourceMetadataImportError =
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
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

    this.allowedRoles = [...(this.metadataImportSettings.allowedRoles ?? [])];

    // Set georesource specific properties
    this.isPOI = this.metadataImportSettings.isPOI;
    this.isLOI = this.metadataImportSettings.isLOI;
    this.isAOI = this.metadataImportSettings.isAOI;

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

    if (topicHierarchy && topicHierarchy[0]) {
      this.georesourceTopic_mainTopic = topicHierarchy[0];
    }
    if (topicHierarchy && topicHierarchy[1]) {
      this.georesourceTopic_subTopic = topicHierarchy[1];
    }
    if (topicHierarchy && topicHierarchy[2]) {
      this.georesourceTopic_subsubTopic = topicHierarchy[2];
    }
    if (topicHierarchy && topicHierarchy[3]) {
      this.georesourceTopic_subsubsubTopic = topicHierarchy[3];
    }
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

    metadataExport.allowedRoles = [...this.allowedRoles];

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
    if (this.georesourceTopic_subsubsubTopic) {
      metadataExport.topicReference = this.georesourceTopic_subsubsubTopic.topicId;
    } else if (this.georesourceTopic_subsubTopic) {
      metadataExport.topicReference = this.georesourceTopic_subsubTopic.topicId;
    } else if (this.georesourceTopic_subTopic) {
      metadataExport.topicReference = this.georesourceTopic_subTopic.topicId;
    } else if (this.georesourceTopic_mainTopic) {
      metadataExport.topicReference = this.georesourceTopic_mainTopic.topicId;
    } else {
      metadataExport.topicReference = '';
    }

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
    const patchBody: any = {
      metadata: metadataFormToApi(this.metadataForm),
      allowedRoles: [...this.allowedRoles],
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
    if (this.georesourceTopic_subsubsubTopic) {
      patchBody.topicReference = this.georesourceTopic_subsubsubTopic.topicId;
    } else if (this.georesourceTopic_subsubTopic) {
      patchBody.topicReference = this.georesourceTopic_subsubTopic.topicId;
    } else if (this.georesourceTopic_subTopic) {
      patchBody.topicReference = this.georesourceTopic_subTopic.topicId;
    } else if (this.georesourceTopic_mainTopic) {
      patchBody.topicReference = this.georesourceTopic_mainTopic.topicId;
    } else {
      patchBody.topicReference = '';
    }

    this.loadingData = true;

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
          this.loadingData = false;
          this.notificationService.showSuccess(
            `Metadaten der Georessource "${this.datasetName}" wurden aktualisiert.`
          );
          this.activeModal.close({
            action: 'updated',
            georesourceId: this.currentGeoresourceDataset.georesourceId,
          });
        },
        error: (error: any) => {
          this.notificationService.showError(
            'Fehler beim Aktualisieren der Metadaten: ' + getErrorMessage(error)
          );
          this.loadingData = false;
        },
      });
  }

  // Alert methods (template-bound flags)
  showMetadataImportErrorAlert(): void {
    this.importErrorAlertVisible = true;
  }

  hideMetadataErrorAlert(): void {
    this.importErrorAlertVisible = false;
  }

  // Get filtered topics for georesource
  getMainTopicsForGeoresource(): any[] {
    return this.topicStore.availableTopics.filter(
      (topic: any) => topic.topicType === 'main' && topic.topicResource === 'georesource'
    );
  }

  // Validation for form submission
  canSubmitForm(): boolean {
    return !this.datasetNameInvalid && this.metadataForm.valid && !this.poiMarkerTextInvalid;
  }

  // Step navigation
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 3) {
      this.currentStep = step;
    }
  }

  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }
}
