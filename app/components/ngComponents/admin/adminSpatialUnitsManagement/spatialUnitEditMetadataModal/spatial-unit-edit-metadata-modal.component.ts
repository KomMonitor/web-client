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
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { SpatialUnitRefreshRequest } from '../spatial-unit-refresh.model';
import { HttpClient } from '@angular/common/http';
import { SpatialUnitOverviewType as SpatialUnitMetadata } from 'models/data-management-api';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import {
  LABELED_LOI_DASH_ARRAY_OBJECTS,
  SPATIAL_UNIT_METADATA_STRUCTURE,
  buildSpatialUnitMetadataExport,
  buildSpatialUnitMetadataPatchBody,
  validateSpatialUnitMetadata,
} from 'services/adminSpatialUnit/spatial-unit-metadata.util';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';

import { KmColorPickerComponent } from '../../../customElements/color-picker/km-color-picker.component';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { getErrorMessage } from '../spatial-unit-import.util';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { ResourceMetadataFormComponent } from '../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import {
  buildResourceMetadataForm,
  patchMetadataFormFromApi,
  ResourceMetadataFormValue,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';

// Remove jQuery declaration - no longer needed
// declare var $: any;

@Component({
  selector: 'app-spatial-unit-edit-metadata-modal',
  templateUrl: './spatial-unit-edit-metadata-modal.component.html',
  styleUrls: ['./spatial-unit-edit-metadata-modal.component.scss'],
  providers: [],
  imports: [
    FormsModule,
    CommonModule,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
    StepperComponent,
    ResourceMetadataFormComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialUnitEditMetadataModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  protected envConfigService = inject(EnvConfigService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);
  private http = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  private sanitizer = inject(DomSanitizer);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  /** Emitted after metadata changed so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'metadata', label: 'Metadaten der Raumebene' },
    { key: 'general', label: 'Allgemeine Metadaten' },
  ]);

  // Form data — signal: toggled across await boundaries (OnPush).
  loadingData = signal(false);

  // Current dataset being edited
  currentSpatialUnitDataset: SpatialUnitMetadata | null = null;

  // Basic form data
  spatialUnitLevel = '';
  spatialUnitLevelInvalid = false;
  metadataForm = buildResourceMetadataForm();
  /** Read-only view of the metadata form value for patch-body/export building. */
  get metadata(): ResourceMetadataFormValue {
    return this.metadataForm.getRawValue();
  }

  // Date picker model for ng-bootstrap - using string format directly
  // Remove the custom visibility control since ng-bootstrap handles it
  // showDatepicker = false;

  // Date picker visibility control
  // showDatepicker = false;

  // Hierarchy
  nextLowerHierarchySpatialUnit: any = null;
  nextUpperHierarchySpatialUnit: any = null;
  hierarchyInvalid = false;

  // Outline layer settings
  isOutlineLayer = false;
  outlineColor = '#bf3d2c';
  outlineWidth = 2;
  selectedOutlineDashArrayObject: LinePatternOption | null = null;
  selectedoutlineDashArrayObject: LinePatternOption | null = null; // Keep both for compatibility with original

  // Color picker handled by km-color-picker component
  // Line pattern picker handled by km-line-pattern-picker component

  // Available options
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  availableLoiDashArrayObjects: any[] = [];

  // Import/Export functionality
  metadataImportSettings: any = null;
  // Signal: written from the async FileReader callback (OnPush).
  spatialUnitMetadataImportError = signal('');

  // Add flag to track if SVGs have been injected
  private svgInjected = false;

  get availableLinePatternOptions(): LinePatternOption[] {
    return (LABELED_LOI_DASH_ARRAY_OBJECTS || []).map((option) => ({
      label: option.label,
      dashArrayValue: option.dashArrayValue,
      svgString: option.svgString,
    }));
  }

  ngOnInit() {
    this.loadInitialData();

    // If currentSpatialUnitDataset is already set (from parent component), initialize form
    if (this.currentSpatialUnitDataset) {
      this.resetForm();
    }
  }

  private loadInitialData() {
    this.loadingData.set(true);

    // Load available spatial units
    if (this.spatialUnitStore.availableSpatialUnits) {
      this.availableSpatialUnits = this.spatialUnitStore.availableSpatialUnits;
    }

    // Load update interval options
    if (this.envConfigService.updateIntervalOptions) {
      this.updateIntervalOptions = this.envConfigService.updateIntervalOptions;
    }

    // Load available dash array objects
    if (LABELED_LOI_DASH_ARRAY_OBJECTS) {
      this.availableLoiDashArrayObjects = LABELED_LOI_DASH_ARRAY_OBJECTS;
    }

    this.loadingData.set(false);
  }

  // Date picker change handler - now using ng-bootstrap's built-in functionality
  // The datepicker will automatically handle the date selection and close
  // No need for custom methods since ng-bootstrap handles everything

  // Remove custom click outside and escape key handlers since ng-bootstrap handles this

  resetForm() {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return;

    this.spatialUnitLevel = dataset.spatialUnitLevel;
    this.spatialUnitLevelInvalid = false;

    // Reset metadata from the dataset being edited
    patchMetadataFormFromApi(this.metadataForm, dataset.metadata, this.updateIntervalOptions);

    // If no update interval is set, fall back to the first available option
    if (!this.metadataForm.controls.updateInterval.value && this.updateIntervalOptions.length > 0) {
      this.metadataForm.controls.updateInterval.setValue(this.updateIntervalOptions[0]);
    }

    // Set hierarchy
    this.nextLowerHierarchySpatialUnit = null;
    this.nextUpperHierarchySpatialUnit = null;

    this.availableSpatialUnits.forEach((spatialUnit) => {
      if (spatialUnit.spatialUnitLevel === dataset.nextLowerHierarchyLevel) {
        this.nextLowerHierarchySpatialUnit = spatialUnit;
      }
      if (spatialUnit.spatialUnitLevel === dataset.nextUpperHierarchyLevel) {
        this.nextUpperHierarchySpatialUnit = spatialUnit;
      }
    });

    // Set outline layer settings - FIXED: Properly initialize outline layer properties
    this.isOutlineLayer = dataset.isOutlineLayer || false;
    this.outlineColor = dataset.outlineColor || '#bf3d2c';
    this.outlineWidth = dataset.outlineWidth || 2;

    // Set dash array
    this.selectedOutlineDashArrayObject = null;
    this.selectedoutlineDashArrayObject = null;
    if (this.availableLoiDashArrayObjects && this.availableLoiDashArrayObjects.length > 0) {
      this.availableLoiDashArrayObjects.forEach((option) => {
        if (option.dashArrayValue === dataset.outlineDashArrayString) {
          this.selectedOutlineDashArrayObject = {
            label: option.label,
            dashArrayValue: option.dashArrayValue,
            svgString: option.svgString,
          };
          this.selectedoutlineDashArrayObject = this.selectedOutlineDashArrayObject;
        }
      });
      if (!this.selectedOutlineDashArrayObject) {
        const firstOption = this.availableLoiDashArrayObjects[0];
        this.selectedOutlineDashArrayObject = {
          label: firstOption.label,
          dashArrayValue: firstOption.dashArrayValue,
          svgString: firstOption.svgString,
        };
        this.selectedoutlineDashArrayObject = this.selectedOutlineDashArrayObject;
      }

      // Line pattern picker will handle the display automatically
    }

    // Set date picker value with null check - now using ng-bootstrap
    // The datepicker will automatically display the date from metadata.lastUpdate

    this.hierarchyInvalid = false;

    // No role management in this version to match AngularJS

    // Reset to first step
    this.stepper.reset();
  }

  checkSpatialUnitName() {
    const dataset = this.currentSpatialUnitDataset;
    this.spatialUnitLevelInvalid = false;
    this.availableSpatialUnits.forEach((spatialUnit) => {
      if (
        spatialUnit.spatialUnitLevel === this.spatialUnitLevel &&
        spatialUnit.spatialUnitId !== dataset?.spatialUnitId
      ) {
        this.spatialUnitLevelInvalid = true;
        return;
      }
    });
  }

  checkSpatialUnitHierarchy() {
    this.hierarchyInvalid = false;

    if (this.nextLowerHierarchySpatialUnit && this.nextUpperHierarchySpatialUnit) {
      let indexOfLowerHierarchyUnit = -1;
      let indexOfUpperHierarchyUnit = -1;

      for (let i = 0; i < this.availableSpatialUnits.length; i++) {
        const spatialUnit = this.availableSpatialUnits[i];
        if (spatialUnit.spatialUnitLevel === this.nextLowerHierarchySpatialUnit.spatialUnitLevel) {
          indexOfLowerHierarchyUnit = i;
        }
        if (spatialUnit.spatialUnitLevel === this.nextUpperHierarchySpatialUnit.spatialUnitLevel) {
          indexOfUpperHierarchyUnit = i;
        }
      }

      if (indexOfLowerHierarchyUnit <= indexOfUpperHierarchyUnit) {
        this.hierarchyInvalid = true;
      }
    }
  }

  onChangeOutlineDashArray(outlineDashArrayObject: LinePatternOption | null) {
    this.selectedOutlineDashArrayObject = outlineDashArrayObject;
    this.selectedoutlineDashArrayObject = outlineDashArrayObject; // Keep both for compatibility

    // No need to update dropdown display or close dropdown - handled by km-line-pattern-picker
  }

  // Deprecated inline color picker click handler removed

  async editSpatialUnitMetadata() {
    if (!this.currentSpatialUnitDataset) return;

    // Prevent multiple submissions
    if (this.loadingData()) return;

    const spatialUnitName_old = this.currentSpatialUnitDataset.spatialUnitLevel;
    const spatialUnitName_new = this.spatialUnitLevel;

    // Validate using service method
    const validation = validateSpatialUnitMetadata(this.metadata, this.spatialUnitLevel);

    if (!validation.isValid) {
      this.notificationService.showError(validation.errors.join('\n'));
      this.loadingData.set(false);
      return;
    }

    // Build patch body using service method
    const patchBody = buildSpatialUnitMetadataPatchBody(
      this.spatialUnitLevel,
      this.metadata,
      this.nextLowerHierarchySpatialUnit
        ? this.nextLowerHierarchySpatialUnit.spatialUnitLevel
        : null,
      this.nextUpperHierarchySpatialUnit
        ? this.nextUpperHierarchySpatialUnit.spatialUnitLevel
        : null,
      this.isOutlineLayer,
      this.outlineColor,
      this.outlineWidth,
      this.selectedOutlineDashArrayObject
        ? this.selectedOutlineDashArrayObject.dashArrayValue
        : null
    );

    // No role management in this version to match AngularJS

    this.loadingData.set(true);

    try {
      await this.http
        .patch(
          `${this.envConfigService.baseUrlToKomMonitorDataAPI}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}`,
          patchBody
        )
        .toPromise();

      // Ask the parent to refresh its overview table for this spatial unit.
      this.refreshRequested.emit({
        crudType: 'edit',
        targetSpatialUnitId: this.currentSpatialUnitDataset.spatialUnitId,
      });
      // The indicator overview lives in a sibling admin area, so that refresh
      // stays on the global event bus.
      if (spatialUnitName_old !== spatialUnitName_new) {
        this.broadcastService.broadcast(BroadcastMessage.RefreshIndicatorOverviewTable);
      }

      this.loadingData.set(false);
      this.notificationService.showSuccess(
        `Metadaten für Raumebene "${this.currentSpatialUnitDataset.spatialUnitLevel}" erfolgreich aktualisiert.`
      );
      this.activeModal.close({
        action: 'updated',
        spatialUnitId: this.currentSpatialUnitDataset.spatialUnitId,
      });
    } catch (error: any) {
      this.notificationService.showError(
        'Fehler beim Aktualisieren der Metadaten: ' + getErrorMessage(error)
      );
      this.loadingData.set(false);
    }
  }

  // Import/Export functionality
  onImportSpatialUnitEditMetadata() {
    this.spatialUnitMetadataImportError.set('');
    if (this.metadataImportFile) {
      this.metadataImportFile.nativeElement.click();
    }
  }

  onMetadataFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.parseMetadataFromFile(file);
    }
  }

  parseMetadataFromFile(file: File) {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMetadataFile(event);
      } catch {
        this.spatialUnitMetadataImportError.set(
          'Uploaded Metadata File cannot be parsed correctly'
        );
      }
      // The import rewrites many ngModel-bound fields from an async callback —
      // mark the OnPush view once instead of converting each field to a signal.
      this.cdr.markForCheck();
    };

    fileReader.readAsText(file);
  }

  parseFromMetadataFile(event: any) {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      this.spatialUnitMetadataImportError.set(
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.'
      );
      return;
    }

    // Apply imported metadata
    patchMetadataFormFromApi(
      this.metadataForm,
      this.metadataImportSettings.metadata,
      this.updateIntervalOptions
    );

    // Set hierarchy
    this.availableSpatialUnits.forEach((spatialUnit) => {
      if (spatialUnit.spatialUnitLevel === this.metadataImportSettings.nextLowerHierarchyLevel) {
        this.nextLowerHierarchySpatialUnit = spatialUnit;
      }
      if (spatialUnit.spatialUnitLevel === this.metadataImportSettings.nextUpperHierarchyLevel) {
        this.nextUpperHierarchySpatialUnit = spatialUnit;
      }
    });

    this.spatialUnitLevel = this.metadataImportSettings.spatialUnitLevel;

    // Set outline layer settings from import
    this.isOutlineLayer = this.metadataImportSettings.isOutlineLayer || false;
    this.outlineColor = this.metadataImportSettings.outlineColor || '#bf3d2c';
    this.outlineWidth = this.metadataImportSettings.outlineWidth || 2;

    // Set dash array from import
    if (this.metadataImportSettings.outlineDashArrayString && this.availableLoiDashArrayObjects) {
      this.availableLoiDashArrayObjects.forEach((option) => {
        if (option.dashArrayValue === this.metadataImportSettings.outlineDashArrayString) {
          this.selectedOutlineDashArrayObject = {
            label: option.label,
            dashArrayValue: option.dashArrayValue,
            svgString: option.svgString,
          };
          this.selectedoutlineDashArrayObject = this.selectedOutlineDashArrayObject;
        }
      });
    }

    // Set date picker value from import
    // The datepicker will automatically display the imported date

    // No role management in this version to match AngularJS
  }

  onExportSpatialUnitEditMetadata() {
    // Build export data using service method
    const metadataExport = buildSpatialUnitMetadataExport(
      this.metadata,
      this.spatialUnitLevel,
      this.nextLowerHierarchySpatialUnit
        ? this.nextLowerHierarchySpatialUnit.spatialUnitLevel
        : null,
      this.nextUpperHierarchySpatialUnit
        ? this.nextUpperHierarchySpatialUnit.spatialUnitLevel
        : null,
      this.isOutlineLayer,
      this.outlineColor,
      this.outlineWidth,
      this.selectedOutlineDashArrayObject
        ? this.selectedOutlineDashArrayObject.dashArrayValue
        : null
    );

    // No role management in this version to match AngularJS

    const metadataJSON = JSON.stringify(metadataExport, null, 2);
    const fileName = `Raumebene_Metadaten_Export${this.spatialUnitLevel ? '-' + this.spatialUnitLevel : ''}.json`;
    this.downloadFile(metadataJSON, fileName);
  }

  private downloadFile(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = fileName;
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Metadata structure for export - now using service
  get spatialUnitMetadataStructure() {
    return SPATIAL_UNIT_METADATA_STRUCTURE;
  }

  hideMetadataErrorAlert() {
    this.spatialUnitMetadataImportError.set('');
  }

  cancel() {
    this.activeModal.dismiss();
  }

  onSubmit(event?: Event) {
    // Prevent default form submission behavior
    if (event) {
      event.preventDefault();
    }

    // Only proceed if not already loading
    if (!this.loadingData()) {
      this.editSpatialUnitMetadata();
    }
  }

  // Missing function for metadata export template
  onExportSpatialUnitEditMetadataTemplate() {
    const metadataStructure = this.spatialUnitMetadataStructure;
    const metadataJSON = JSON.stringify(metadataStructure, null, 2);
    const fileName = 'Raumebene_Metadaten_Vorlage_Export.json';
    this.downloadFile(metadataJSON, fileName);
  }

  // km-date-picker handles validation and coercion itself; no blur handler needed
}
