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
import { SpatialUnitHierarchyApiService } from 'services/spatial-unit-hierarchy-service/spatial-unit-hierarchy-api.service';
import { SpatialUnitHierarchyOverviewType } from 'models/data-management-api';
import { HierarchyAssignmentPanelComponent } from '../hierarchyAssignment/hierarchy-assignment-panel.component';
import {
  buildAssignmentRow,
  membershipsByLevelForRows,
  rowForExistingMembership,
  sameMemberships,
} from '../hierarchyAssignment/hierarchy-assignment.model';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { FormControlAriaDirective } from '../../adminShared/formError/form-control-aria.directive';
import {
  EDIT_DEFAULT_OUTLINE_COLOR,
  EDIT_DEFAULT_OUTLINE_WIDTH,
  buildSpatialUnitEditMetadataForm,
} from './spatial-unit-edit-metadata-form.model';

import { KmColorPickerComponent } from '../../../customElements/color-picker/km-color-picker.component';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { getErrorMessage } from '../spatial-unit-import.util';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { ResourceMetadataFormComponent } from '../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import {
  ResourceMetadataFormGroup,
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
    ReactiveFormsModule,
    FormErrorComponent,
    FormControlAriaDirective,
    CommonModule,
    LoadingOverlayComponent,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
    StepperComponent,
    ResourceMetadataFormComponent,
    HierarchyAssignmentPanelComponent,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialUnitEditMetadataModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  protected envConfigService = inject(EnvConfigService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);
  private hierarchyApi = inject(SpatialUnitHierarchyApiService);
  private http = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  private sanitizer = inject(DomSanitizer);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  /** Emitted after metadata changed so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'metadata', label: 'ADMIN_SHARED_UI.STEP_LABELS.SPATIAL_UNIT_METADATA' },
    { key: 'general', label: 'ADMIN_SHARED_UI.STEP_LABELS.GENERAL_METADATA' },
  ]);

  // Form data — signal: toggled across await boundaries (OnPush).
  loadingData = signal(false);

  // Current dataset being edited
  currentSpatialUnitDataset: SpatialUnitMetadata | null = null;

  /**
   * Typed model of this modal. The accessors below keep the historic property
   * names working for the patch-body/export builders and the spec.
   */
  readonly editForm = buildSpatialUnitEditMetadataForm({
    existingLevelNames: () =>
      (this.availableSpatialUnits ?? []).map((unit: any) => unit.spatialUnitLevel),
    currentLevelName: () => this.currentSpatialUnitDataset?.spatialUnitLevel ?? null,
  });

  // Basic form data
  get spatialUnitLevel(): string {
    return this.editForm.controls.spatialUnitLevel.value;
  }
  set spatialUnitLevel(value: string) {
    this.editForm.controls.spatialUnitLevel.setValue(value ?? '');
  }
  get spatialUnitLevelInvalid(): boolean {
    return this.editForm.controls.spatialUnitLevel.hasError('uniqueName');
  }

  /** The shared "Allgemeine Metadaten" block; same instance on every call. */
  get metadataForm(): ResourceMetadataFormGroup {
    return this.editForm.controls.general;
  }
  /** Read-only view of the metadata form value for patch-body/export building. */
  get metadata(): ResourceMetadataFormValue {
    return this.metadataForm.getRawValue();
  }

  // Date picker model for ng-bootstrap - using string format directly
  // Remove the custom visibility control since ng-bootstrap handles it
  // showDatepicker = false;

  // Date picker visibility control
  // showDatepicker = false;

  // Outline layer settings
  get isOutlineLayer(): boolean {
    return this.editForm.controls.isOutlineLayer.value;
  }
  set isOutlineLayer(value: boolean) {
    this.editForm.controls.isOutlineLayer.setValue(!!value);
  }
  get outlineColor(): string {
    return this.editForm.controls.outlineColor.value;
  }
  set outlineColor(value: string) {
    this.editForm.controls.outlineColor.setValue(value || EDIT_DEFAULT_OUTLINE_COLOR);
  }
  get outlineWidth(): number {
    return this.editForm.controls.outlineWidth.value;
  }
  set outlineWidth(value: number) {
    this.editForm.controls.outlineWidth.setValue(value ?? EDIT_DEFAULT_OUTLINE_WIDTH);
  }
  get selectedOutlineDashArrayObject(): LinePatternOption | null {
    return this.editForm.controls.outlineDashArray.value;
  }
  set selectedOutlineDashArrayObject(value: LinePatternOption | null) {
    this.editForm.controls.outlineDashArray.setValue(value ?? null);
  }

  // Color picker handled by km-color-picker component
  // Line pattern picker handled by km-line-pattern-picker component

  // Available options
  availableSpatialUnits: any[] = [];

  /** The hierarchies of this dataset's tenant — the only ones it may join. */
  availableHierarchies: SpatialUnitHierarchyOverviewType[] = [];
  updateIntervalOptions: any[] = [];
  availableLoiDashArrayObjects: any[] = [];

  // Import/Export functionality
  metadataImportSettings: any = null;
  // Signal: written from the async FileReader callback (OnPush).
  spatialUnitMetadataImportError = signal('');

  // Add flag to track if SVGs have been injected
  private svgInjected = false;

  // Built once: a getter would hand out fresh objects on every change-detection
  // pass, which breaks reference identity with the selected option (and makes
  // the picker's ngOnChanges fire forever).
  readonly availableLinePatternOptions: LinePatternOption[] = (
    LABELED_LOI_DASH_ARRAY_OBJECTS || []
  ).map((option) => ({
    label: option.label,
    dashArrayValue: option.dashArrayValue,
    svgString: option.svgString,
  }));

  ngOnInit() {
    this.loadInitialData();

    // If currentSpatialUnitDataset is already set (from parent component), initialize form
    if (this.currentSpatialUnitDataset) {
      this.resetForm();
    }
  }

  private async loadInitialData() {
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

    // Unfiltered: the panel narrows them to this dataset's tenant, and keeps
    // the ones the dataset is already a member of whatever that filter says —
    // a row whose hierarchy is missing from the select would take its
    // membership with it on the next save.
    this.availableHierarchies = await this.hierarchyApi.getHierarchies();
    this.seedHierarchyRows();

    this.loadingData.set(false);
    // The list arrives after the first render; OnPush needs to be told.
    this.cdr.markForCheck();
  }

  // Date picker change handler - now using ng-bootstrap's built-in functionality
  // The datepicker will automatically handle the date selection and close
  // No need for custom methods since ng-bootstrap handles everything

  // Remove custom click outside and escape key handlers since ng-bootstrap handles this

  /** The tenant that decides which hierarchies this dataset may join. */
  protected get datasetMandantId(): string {
    return this.currentSpatialUnitDataset?.mandantId ?? '';
  }

  protected get datasetSpatialUnitId(): string {
    return this.currentSpatialUnitDataset?.spatialUnitId ?? '';
  }

  protected get hierarchyRows() {
    return this.editForm.controls.hierarchyAssignments;
  }

  /**
   * One row per hierarchy the dataset belongs to, each describing the place it
   * already holds — so a dialog nobody touched writes nothing.
   *
   * Cleared first, because this runs twice on open: once synchronously from
   * `resetForm`, off the memberships the dataset carries, and again once the
   * hierarchy list has arrived and the rows can name their neighbours from the
   * chains. Sorted by name so the panel does not reshuffle between opens.
   */
  private seedHierarchyRows(): void {
    const memberships = [...(this.currentSpatialUnitDataset?.hierarchies ?? [])].sort((a, b) =>
      (a.hierarchyName ?? '').localeCompare(b.hierarchyName ?? '')
    );
    this.hierarchyRows.clear();
    for (const membership of memberships) {
      const hierarchy = this.availableHierarchies.find(
        (entry) => entry.hierarchyId === membership.hierarchyId
      );
      this.hierarchyRows.push(buildAssignmentRow(rowForExistingMembership(membership, hierarchy)));
    }
  }

  resetForm() {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) return;

    this.spatialUnitLevel = dataset.spatialUnitLevel;

    // Reset metadata from the dataset being edited
    patchMetadataFormFromApi(this.metadataForm, dataset.metadata, this.updateIntervalOptions);

    // If no update interval is set, fall back to the first available option
    if (!this.metadataForm.controls.updateInterval.value && this.updateIntervalOptions.length > 0) {
      this.metadataForm.controls.updateInterval.setValue(this.updateIntervalOptions[0]);
    }

    this.seedHierarchyRows();

    // Set outline layer settings - FIXED: Properly initialize outline layer properties
    this.isOutlineLayer = dataset.isOutlineLayer || false;
    this.outlineColor = dataset.outlineColor || '#bf3d2c';
    this.outlineWidth = dataset.outlineWidth || 2;

    // Set dash array
    this.selectedOutlineDashArrayObject = null;
    if (this.availableLoiDashArrayObjects && this.availableLoiDashArrayObjects.length > 0) {
      this.availableLoiDashArrayObjects.forEach((option) => {
        if (option.dashArrayValue === dataset.outlineDashArrayString) {
          this.selectedOutlineDashArrayObject = {
            label: option.label,
            dashArrayValue: option.dashArrayValue,
            svgString: option.svgString,
          };
        }
      });
      if (!this.selectedOutlineDashArrayObject) {
        const firstOption = this.availableLoiDashArrayObjects[0];
        this.selectedOutlineDashArrayObject = {
          label: firstOption.label,
          dashArrayValue: firstOption.dashArrayValue,
          svgString: firstOption.svgString,
        };
      }

      // Line pattern picker will handle the display automatically
    }

    // Set date picker value with null check - now using ng-bootstrap
    // The datepicker will automatically display the date from metadata.lastUpdate

    // No role management in this version to match AngularJS

    // Reset to first step
    this.stepper.reset();
  }

  /** The rule is `uniqueNameValidator` on the control now. */
  checkSpatialUnitName() {
    this.editForm.controls.spatialUnitLevel.updateValueAndValidity();
  }

  onChangeOutlineDashArray(outlineDashArrayObject: LinePatternOption | null) {
    this.selectedOutlineDashArrayObject = outlineDashArrayObject;

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

      // The hierarchy memberships travel separately: SpatialUnitPATCHInputType
      // carries no `hierarchies` field, so they are written through the spatial
      // unit's own memberships endpoint. Order matters — the metadata is
      // already saved when this runs, which is what the error message says.
      try {
        await this.saveHierarchyMemberships();
      } catch (error: any) {
        this.loadingData.set(false);
        this.notificationService.showError(
          this.translate.instant(
            'ADMIN_SPATIAL_UNITS.EDIT_METADATA_MODAL.MSG.HIERARCHY_UPDATE_FAILED',
            { error: getErrorMessage(error) }
          )
        );
        return;
      }

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
        this.translate.instant('ADMIN_SPATIAL_UNITS.EDIT_METADATA_MODAL.MSG.METADATA_UPDATED', {
          name: this.currentSpatialUnitDataset.spatialUnitLevel,
        })
      );
      this.activeModal.close({
        action: 'updated',
        spatialUnitId: this.currentSpatialUnitDataset.spatialUnitId,
      });
    } catch (error: any) {
      this.notificationService.showError(
        this.translate.instant(
          'ADMIN_SPATIAL_UNITS.EDIT_METADATA_MODAL.MSG.METADATA_UPDATE_FAILED',
          { error: getErrorMessage(error) }
        )
      );
      this.loadingData.set(false);
    }
  }

  /**
   * Writes the memberships the rows describe, if they differ from the ones the
   * dataset already has. Skipped when nothing changed, so an ordinary metadata
   * edit stays a single request.
   *
   * The list always goes out whole: the endpoint replaces every membership of
   * the spatial unit, so a hierarchy no row names is a hierarchy it leaves.
   */
  private async saveHierarchyMemberships(): Promise<void> {
    const dataset = this.currentSpatialUnitDataset;
    if (!dataset) {
      return;
    }

    const target = membershipsByLevelForRows(
      this.hierarchyRows.getRawValue(),
      this.availableHierarchies,
      dataset.spatialUnitId
    );
    if (sameMemberships(target, dataset.hierarchies ?? [])) {
      return;
    }

    await this.hierarchyApi.updateMemberships(dataset.spatialUnitId, target);
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
