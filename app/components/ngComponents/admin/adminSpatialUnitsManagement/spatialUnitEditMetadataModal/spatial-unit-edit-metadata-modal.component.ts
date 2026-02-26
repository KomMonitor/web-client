import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { ColorEvent } from 'ngx-color';
import { KmColorPickerComponent } from '../../../customElements/color-picker/km-color-picker.component';
import { KmLinePatternPickerComponent, LinePatternOption } from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Remove jQuery declaration - no longer needed
// declare var $: any;

@Component({
  selector: 'spatial-unit-edit-metadata-modal',
  templateUrl: './spatial-unit-edit-metadata-modal.component.html',
  styleUrls: ['./spatial-unit-edit-metadata-modal.component.css'],
  providers: [],
  imports: [FormsModule, CommonModule, KmColorPickerComponent, KmLinePatternPickerComponent],
  standalone: true,
})
export class SpatialUnitEditMetadataModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;

  // Multi-step form
  currentStep = 1;
  totalSteps = 2;

  // Form data
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  loadingData = false;

  // Current dataset being edited
  currentSpatialUnitDataset: any = null;

  // Basic form data
  spatialUnitLevel = '';
  spatialUnitLevelInvalid = false;
  metadata: any = {
    description: '',
    databasis: '',
    datasource: '',
    contact: '',
    updateInterval: null,
    lastUpdate: '',
    literature: '',
    note: '',
    sridEPSG: 4326
  };

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
  spatialUnitMetadataImportError = '';

  // Success/Error data
  successMessagePart = '';
  errorMessagePart = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Add flag to track if SVGs have been injected
  private svgInjected = false;

  get availableLinePatternOptions(): LinePatternOption[] {
    return (this.kommonitorDataExchangeService.availableLoiDashArrayObjects || []).map(option => ({
      label: option.label,
      dashArrayValue: option.dashArrayValue,
      svgString: option.svgString
    }));
  }

  constructor(
    public activeModal: NgbActiveModal,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    private kommonitorDataGridHelperService: KommonitorDataGridHelperService,
    private http: HttpClient,
    private broadcastService: BroadcastService,
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnInit() {
    this.loadInitialData();
    this.setupEventListeners();
    
    // Remove jQuery date picker initialization - no longer needed
    
    // If currentSpatialUnitDataset is already set (from parent component), initialize form
    if (this.currentSpatialUnitDataset) {
      this.resetForm();
    }
  }

  ngAfterViewInit() {
    // Remove Bootstrap dropdown initialization - no longer needed for date picker
    // setTimeout(() => {
    //   try {
    //     $('.dropdown-toggle').dropdown();
    //   } catch (error) {
    //     // Bootstrap dropdown initialization failed
    //   }
    // }, 300);
  }

  // Remove manual SVG injection - now handled by Angular templates
  private injectSvgContentSimple() {
  }

  // Remove the complex injection methods - not needed
  private injectSvgContent() {
  }

  private checkElementsExist(): boolean {
    return true;
  }

  private performSvgInjection() {
  }

  // Color picker logic removed; handled by km-color-picker

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners() {
    // Listen for broadcast messages if needed
    // Currently no role management in this version to match AngularJS
  }

  private loadInitialData() {
    this.loadingData = true;
    
    // Load available spatial units
    if (this.kommonitorDataExchangeService.availableSpatialUnits) {
      this.availableSpatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits;
    }

    // Load update interval options
    if (this.kommonitorDataExchangeService.updateIntervalOptions) {
      this.updateIntervalOptions = this.kommonitorDataExchangeService.updateIntervalOptions;
    }

    // Load available dash array objects
    if (this.kommonitorDataExchangeService.availableLoiDashArrayObjects) {
      this.availableLoiDashArrayObjects = this.kommonitorDataExchangeService.availableLoiDashArrayObjects;
    }

    // Always 2 steps to match AngularJS version
    this.totalSteps = 2;

    this.loadingData = false;
  }

  // Date picker change handler - now using ng-bootstrap's built-in functionality
  // The datepicker will automatically handle the date selection and close
  // No need for custom methods since ng-bootstrap handles everything

  // Remove custom click outside and escape key handlers since ng-bootstrap handles this

  resetForm() {
    if (!this.currentSpatialUnitDataset) return;

    this.spatialUnitLevel = this.currentSpatialUnitDataset.spatialUnitLevel;
    this.spatialUnitLevelInvalid = false;

    // Reset metadata with null checks
    const metadata = this.currentSpatialUnitDataset.metadata || {};
    this.metadata = {
      note: metadata.note || '',
      literature: metadata.literature || '',
      sridEPSG: 4326,
      datasource: metadata.datasource || '',
      databasis: metadata.databasis || '',
      contact: metadata.contact || '',
      description: metadata.description || '',
      lastUpdate: metadata.lastUpdate || '',
      updateInterval: null
    };

    // km-date-picker binds directly to string; no separate model needed

    // Set update interval with null check
    if (metadata.updateInterval) {
      this.updateIntervalOptions.forEach(option => {
        if (option.apiName === metadata.updateInterval) {
          this.metadata.updateInterval = option;
        }
      });
    } else {
      // If no update interval is set, try to find a default one
      if (this.updateIntervalOptions && this.updateIntervalOptions.length > 0) {
        this.metadata.updateInterval = this.updateIntervalOptions[0];
      }
    }

    // Set hierarchy
    this.nextLowerHierarchySpatialUnit = null;
    this.nextUpperHierarchySpatialUnit = null;
    
    this.availableSpatialUnits.forEach(spatialUnit => {
      if (spatialUnit.spatialUnitLevel === this.currentSpatialUnitDataset.nextLowerHierarchyLevel) {
        this.nextLowerHierarchySpatialUnit = spatialUnit;
      }
      if (spatialUnit.spatialUnitLevel === this.currentSpatialUnitDataset.nextUpperHierarchyLevel) {
        this.nextUpperHierarchySpatialUnit = spatialUnit;
      }
    });

    // Set outline layer settings - FIXED: Properly initialize outline layer properties
    this.isOutlineLayer = this.currentSpatialUnitDataset.isOutlineLayer || false;
    this.outlineColor = this.currentSpatialUnitDataset.outlineColor || '#bf3d2c';
    this.outlineWidth = this.currentSpatialUnitDataset.outlineWidth || 2;

    // Set dash array
    this.selectedOutlineDashArrayObject = null;
    this.selectedoutlineDashArrayObject = null;
    if (this.availableLoiDashArrayObjects && this.availableLoiDashArrayObjects.length > 0) {
      this.availableLoiDashArrayObjects.forEach(option => {
        if (option.dashArrayValue === this.currentSpatialUnitDataset.outlineDashArrayString) {
          this.selectedOutlineDashArrayObject = {
            label: option.label,
            dashArrayValue: option.dashArrayValue,
            svgString: option.svgString
          };
          this.selectedoutlineDashArrayObject = this.selectedOutlineDashArrayObject;
        }
      });
      if (!this.selectedOutlineDashArrayObject) {
        const firstOption = this.availableLoiDashArrayObjects[0];
        this.selectedOutlineDashArrayObject = {
          label: firstOption.label,
          dashArrayValue: firstOption.dashArrayValue,
          svgString: firstOption.svgString
        };
        this.selectedoutlineDashArrayObject = this.selectedOutlineDashArrayObject;
      }
      
      // Line pattern picker will handle the display automatically
    }

    // Set date picker value with null check - now using ng-bootstrap
    // The datepicker will automatically display the date from metadata.lastUpdate

    this.hierarchyInvalid = false;
    this.successMessagePart = '';
    this.errorMessagePart = '';

    // No role management in this version to match AngularJS

    // Reset to first step
    this.currentStep = 1;
  }

  checkSpatialUnitName() {
    this.spatialUnitLevelInvalid = false;
    this.availableSpatialUnits.forEach(spatialUnit => {
      if (spatialUnit.spatialUnitLevel === this.spatialUnitLevel && 
          spatialUnit.spatialUnitId !== this.currentSpatialUnitDataset.spatialUnitId) {
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
    if (this.loadingData) return;

    const spatialUnitName_old = this.currentSpatialUnitDataset.spatialUnitLevel;
    const spatialUnitName_new = this.spatialUnitLevel;

    // Validate using service method
    const validation = this.kommonitorDataExchangeService.validateSpatialUnitMetadata(
      this.metadata, 
      this.spatialUnitLevel
    );
    
    if (!validation.isValid) {
      this.errorMessage = validation.errors.join('\n');
      this.loadingData = false;
      return;
    }

    // Build patch body using service method
    const patchBody = this.kommonitorDataExchangeService.buildSpatialUnitMetadataPatchBody(
      this.spatialUnitLevel,
      this.metadata,
      this.nextLowerHierarchySpatialUnit ? this.nextLowerHierarchySpatialUnit.spatialUnitLevel : null,
      this.nextUpperHierarchySpatialUnit ? this.nextUpperHierarchySpatialUnit.spatialUnitLevel : null,
      this.isOutlineLayer,
      this.outlineColor,
      this.outlineWidth,
      this.selectedOutlineDashArrayObject ? this.selectedOutlineDashArrayObject.dashArrayValue : null
    );

    // No role management in this version to match AngularJS

    this.loadingData = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.errorMessagePart = '';
    this.successMessagePart = '';

    try {
      const response = await this.http.patch(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}`,
        patchBody
      ).toPromise();

      this.successMessagePart = this.currentSpatialUnitDataset.spatialUnitLevel;
      this.successMessage = `Metadaten für Raumebene "${this.successMessagePart}" erfolgreich aktualisiert.`;

      // Broadcast refresh events with proper parameters
      this.broadcastService.broadcast('refreshSpatialUnitOverviewTable', { 
        crudType: 'edit', 
        targetSpatialUnitId: this.currentSpatialUnitDataset.spatialUnitId 
      });
      if (spatialUnitName_old !== spatialUnitName_new) {
        this.broadcastService.broadcast('refreshIndicatorOverviewTable');
      }

      this.loadingData = false;
      
      // Don't close modal immediately - let user see success message
      // User can close manually or we can auto-close after a delay
      setTimeout(() => {
        this.activeModal.close({ action: 'updated', spatialUnitId: this.currentSpatialUnitDataset.spatialUnitId });
      }, 5000); // Close after 5 seconds
    } catch (error: any) {
      
      this.errorMessagePart = error.error ? 
        this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error) : 
        this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      this.errorMessage = 'Fehler beim Aktualisieren der Metadaten.';
      this.loadingData = false;
    }
  }

  // Multi-step form navigation
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  // Import/Export functionality
  onImportSpatialUnitEditMetadata() {
    this.spatialUnitMetadataImportError = '';
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
      } catch (error) {
        this.spatialUnitMetadataImportError = 'Uploaded Metadata File cannot be parsed correctly';
      }
    };

    fileReader.readAsText(file);
  }

  parseFromMetadataFile(event: any) {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      this.spatialUnitMetadataImportError = 'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      return;
    }

    // Apply imported metadata using service method for consistency
    this.metadata = {
      note: this.metadataImportSettings.metadata.note,
      literature: this.metadataImportSettings.metadata.literature,
      sridEPSG: this.metadataImportSettings.metadata.sridEPSG,
      datasource: this.metadataImportSettings.metadata.datasource,
      contact: this.metadataImportSettings.metadata.contact,
      lastUpdate: this.metadataImportSettings.metadata.lastUpdate,
      description: this.metadataImportSettings.metadata.description,
      databasis: this.metadataImportSettings.metadata.databasis,
      updateInterval: null
    };

    // km-date-picker binds directly to string; no separate model needed

    // Set update interval
    this.updateIntervalOptions.forEach(option => {
      if (option.apiName === this.metadataImportSettings.metadata.updateInterval) {
        this.metadata.updateInterval = option;
      }
    });

    // Set hierarchy
    this.availableSpatialUnits.forEach(spatialUnit => {
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
      this.availableLoiDashArrayObjects.forEach(option => {
        if (option.dashArrayValue === this.metadataImportSettings.outlineDashArrayString) {
          this.selectedOutlineDashArrayObject = {
            label: option.label,
            dashArrayValue: option.dashArrayValue,
            svgString: option.svgString
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
    const metadataExport = this.kommonitorDataExchangeService.buildSpatialUnitMetadataExport(
      this.metadata,
      this.spatialUnitLevel,
      this.nextLowerHierarchySpatialUnit ? this.nextLowerHierarchySpatialUnit.spatialUnitLevel : null,
      this.nextUpperHierarchySpatialUnit ? this.nextUpperHierarchySpatialUnit.spatialUnitLevel : null,
      this.isOutlineLayer,
      this.outlineColor,
      this.outlineWidth,
      this.selectedOutlineDashArrayObject ? this.selectedOutlineDashArrayObject.dashArrayValue : null
    );

    // No role management in this version to match AngularJS

    const metadataJSON = JSON.stringify(metadataExport, null, 2);
    const fileName = `Raumebene_Metadaten_Export${this.spatialUnitLevel ? '-' + this.spatialUnitLevel : ''}.json`;
    this.downloadFile(metadataJSON, fileName);
  }

  private downloadFile(content: string, fileName: string) {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = fileName;
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Metadata structure for export - now using service
  get spatialUnitMetadataStructure() {
    return this.kommonitorDataExchangeService.spatialUnitMetadataStructure;
  }

  hideSuccessAlert() {
    this.successMessage = '';
  }

  hideErrorAlert() {
    this.errorMessage = '';
  }

  hideMetadataErrorAlert() {
    this.spatialUnitMetadataImportError = '';
  }

  closeOnSuccess() {
    this.activeModal.close({ action: 'updated', spatialUnitId: this.currentSpatialUnitDataset?.spatialUnitId });
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
    if (!this.loadingData) {
      this.editSpatialUnitMetadata();
    }
  }

  // Missing function for metadata export template
  onExportSpatialUnitEditMetadataTemplate() {
    const metadataStructure = this.spatialUnitMetadataStructure;
    const metadataJSON = JSON.stringify(metadataStructure, null, 2);
    const fileName = "Raumebene_Metadaten_Vorlage_Export.json";
    this.downloadFile(metadataJSON, fileName);
  }


  // km-date-picker handles validation and coercion itself; no blur handler needed

} 