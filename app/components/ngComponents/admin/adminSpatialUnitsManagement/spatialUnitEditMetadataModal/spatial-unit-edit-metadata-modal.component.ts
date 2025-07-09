import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'spatial-unit-edit-metadata-modal-new',
  templateUrl: './spatial-unit-edit-metadata-modal.component.html',
  styleUrls: ['./spatial-unit-edit-metadata-modal.component.css']
})
export class SpatialUnitEditMetadataModalComponent implements OnInit, OnDestroy {
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

  // Hierarchy
  nextLowerHierarchySpatialUnit: any = null;
  nextUpperHierarchySpatialUnit: any = null;
  hierarchyInvalid = false;

  // Outline layer settings
  isOutlineLayer = false;
  outlineColor = '#bf3d2c';
  outlineWidth = 2;
  selectedOutlineDashArrayObject: any = null;

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

  constructor(
    public activeModal: NgbActiveModal,
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    @Inject('kommonitorDataGridHelperService') private kommonitorDataGridHelperService: any,
    @Inject('kommonitorMultiStepFormHelperService') private kommonitorMultiStepFormHelperService: any,
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) {
    console.log('SpatialUnitEditMetadataModalComponent constructor initialized');
  }

  ngOnInit() {
    console.log('SpatialUnitEditMetadataModalComponent ngOnInit');
    this.loadInitialData();
    this.setupEventListeners();
    
    // Initialize date picker
    setTimeout(() => {
      if (this.kommonitorDataExchangeService.datePickerOptions) {
        ($ as any)('#spatialUnitEditMetadataLastUpdateDatepicker').datepicker(this.kommonitorDataExchangeService.datePickerOptions);
      }
    }, 100);

    // Initialize dash array dropdown
    setTimeout(() => {
      if (this.kommonitorDataExchangeService.availableLoiDashArrayObjects) {
        for (let i = 0; i < this.kommonitorDataExchangeService.availableLoiDashArrayObjects.length; i++) {
          const element = document.getElementById(`outlineDashArrayDropdownItem-editMetadata-${i}`);
          if (element) {
            element.innerHTML = this.kommonitorDataExchangeService.availableLoiDashArrayObjects[i].svgString;
          }
        }
      }
    }, 1000);
    
    // If currentSpatialUnitDataset is already set (from parent component), initialize form
    if (this.currentSpatialUnitDataset) {
      this.resetForm();
    }
  }

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



  resetForm() {
    if (!this.currentSpatialUnitDataset) return;

    this.spatialUnitLevel = this.currentSpatialUnitDataset.spatialUnitLevel;
    this.spatialUnitLevelInvalid = false;

    // Reset metadata
    this.metadata = {
      note: this.currentSpatialUnitDataset.metadata.note,
      literature: this.currentSpatialUnitDataset.metadata.literature,
      sridEPSG: 4326,
      datasource: this.currentSpatialUnitDataset.metadata.datasource,
      databasis: this.currentSpatialUnitDataset.metadata.databasis,
      contact: this.currentSpatialUnitDataset.metadata.contact,
      description: this.currentSpatialUnitDataset.metadata.description,
      lastUpdate: this.currentSpatialUnitDataset.metadata.lastUpdate,
      updateInterval: null
    };

    // Set update interval
    this.updateIntervalOptions.forEach(option => {
      if (option.apiName === this.currentSpatialUnitDataset.metadata.updateInterval) {
        this.metadata.updateInterval = option;
      }
    });

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

    // Set outline layer settings
    this.isOutlineLayer = this.currentSpatialUnitDataset.isOutlineLayer || false;
    this.outlineColor = this.currentSpatialUnitDataset.outlineColor || '#bf3d2c';
    this.outlineWidth = this.currentSpatialUnitDataset.outlineWidth || 2;

    // Set dash array
    this.selectedOutlineDashArrayObject = null;
    if (this.availableLoiDashArrayObjects && this.availableLoiDashArrayObjects.length > 0) {
      this.availableLoiDashArrayObjects.forEach(option => {
        if (option.dashArrayValue === this.currentSpatialUnitDataset.outlineDashArrayString) {
          this.selectedOutlineDashArrayObject = option;
        }
      });
      if (!this.selectedOutlineDashArrayObject) {
        this.selectedOutlineDashArrayObject = this.availableLoiDashArrayObjects[0];
      }
    }

    // Initialize dash array dropdown
    setTimeout(() => {
      if (this.availableLoiDashArrayObjects) {
        for (let i = 0; i < this.availableLoiDashArrayObjects.length; i++) {
          const element = document.getElementById(`outlineDashArrayDropdownItem-editMetadata-${i}`);
          if (element) {
            element.innerHTML = this.availableLoiDashArrayObjects[i].svgString;
          }
        }
      }
      if (this.selectedOutlineDashArrayObject) {
        this.onChangeOutlineDashArray(this.selectedOutlineDashArrayObject);
      }
    }, 1000);

    // Set date picker value
    setTimeout(() => {
      ($ as any)('#spatialUnitEditMetadataLastUpdateDatepicker').datepicker('setDate', this.currentSpatialUnitDataset.metadata.lastUpdate);
    }, 100);

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

  onChangeOutlineDashArray(outlineDashArrayObject: any) {
    this.selectedOutlineDashArrayObject = outlineDashArrayObject;
    
    // Update dropdown button display
    const buttonElement = document.getElementById('outlineDashArrayDropdownButton_editSpatialUnit');
    if (buttonElement && outlineDashArrayObject && outlineDashArrayObject.svgString) {
      buttonElement.innerHTML = outlineDashArrayObject.svgString;
    }
  }

  onColorPickerClick() {
    // Implement color picker functionality if needed
    console.log('Color picker clicked');
  }

  async editSpatialUnitMetadata() {
    if (!this.currentSpatialUnitDataset) return;

    const spatialUnitName_old = this.currentSpatialUnitDataset.spatialUnitLevel;
    const spatialUnitName_new = this.spatialUnitLevel;

    const patchBody = {
      datasetName: this.spatialUnitLevel,
      metadata: {
        note: this.metadata.note,
        literature: this.metadata.literature,
        updateInterval: this.metadata.updateInterval.apiName,
        sridEPSG: this.metadata.sridEPSG,
        datasource: this.metadata.datasource,
        contact: this.metadata.contact,
        lastUpdate: this.metadata.lastUpdate,
        description: this.metadata.description,
        databasis: this.metadata.databasis
      },
      allowedRoles: [],
      nextLowerHierarchyLevel: this.nextLowerHierarchySpatialUnit ? this.nextLowerHierarchySpatialUnit.spatialUnitLevel : null,
      nextUpperHierarchyLevel: this.nextUpperHierarchySpatialUnit ? this.nextUpperHierarchySpatialUnit.spatialUnitLevel : null,
      isOutlineLayer: this.isOutlineLayer,
      outlineColor: this.outlineColor,
      outlineWidth: this.outlineWidth,
      outlineDashArrayString: this.selectedOutlineDashArrayObject ? this.selectedOutlineDashArrayObject.dashArrayValue : ''
    };

    // No role management in this version to match AngularJS

    this.loadingData = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await this.http.patch(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}`,
        patchBody
      ).toPromise();

      this.successMessagePart = this.currentSpatialUnitDataset.spatialUnitLevel;
      this.successMessage = `Metadaten für Raumebene "${this.successMessagePart}" erfolgreich aktualisiert.`;

      // Broadcast refresh events
      this.broadcastService.broadcast('refreshSpatialUnitOverviewTable');
      if (spatialUnitName_old !== spatialUnitName_new) {
        this.broadcastService.broadcast('refreshIndicatorOverviewTable');
      }

      this.loadingData = false;
      
      // Close modal with success result
      this.activeModal.close({ action: 'updated', spatialUnitId: this.currentSpatialUnitDataset.spatialUnitId });
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
        console.error('Uploaded Metadata File cannot be parsed.');
        this.spatialUnitMetadataImportError = 'Uploaded Metadata File cannot be parsed correctly';
      }
    };

    fileReader.readAsText(file);
  }

  parseFromMetadataFile(event: any) {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      console.error('uploaded Metadata File cannot be parsed - wrong structure.');
      this.spatialUnitMetadataImportError = 'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      return;
    }

    // Apply imported metadata
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
          this.selectedOutlineDashArrayObject = option;
        }
      });
    }

    // No role management in this version to match AngularJS
  }

  onExportSpatialUnitEditMetadata() {
    const metadataExport = {
      ...this.spatialUnitMetadataStructure,
      metadata: {
        note: this.metadata.note || "",
        literature: this.metadata.literature || "",
        sridEPSG: this.metadata.sridEPSG || "",
        datasource: this.metadata.datasource || "",
        contact: this.metadata.contact || "",
        lastUpdate: this.metadata.lastUpdate || "",
        description: this.metadata.description || "",
        databasis: this.metadata.databasis || "",
        updateInterval: this.metadata.updateInterval ? this.metadata.updateInterval.apiName : ""
      },
      spatialUnitLevel: this.spatialUnitLevel || "",
      nextLowerHierarchyLevel: this.nextLowerHierarchySpatialUnit ? this.nextLowerHierarchySpatialUnit.spatialUnitLevel : "",
      nextUpperHierarchyLevel: this.nextUpperHierarchySpatialUnit ? this.nextUpperHierarchySpatialUnit.spatialUnitLevel : "",
      allowedRoles: [],
      isOutlineLayer: this.isOutlineLayer,
      outlineColor: this.outlineColor,
      outlineWidth: this.outlineWidth,
      outlineDashArrayString: this.selectedOutlineDashArrayObject ? this.selectedOutlineDashArrayObject.dashArrayValue : ""
    };

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

  // Metadata structure for export
  get spatialUnitMetadataStructure() {
    return {
      "metadata": {
        "note": "an optional note",
        "literature": "optional text about literature",
        "updateInterval": "YEARLY|HALF_YEARLY|QUARTERLY|MONTHLY|ARBITRARY",
        "sridEPSG": 4326,
        "datasource": "text about data source",
        "contact": "text about contact details",
        "lastUpdate": "YYYY-MM-DD",
        "description": "description about spatial unit dataset",
        "databasis": "text about data basis"
      },
      "allowedRoles": ['roleId'],
      "nextLowerHierarchyLevel": "Name of lower hierarchy level",
      "spatialUnitLevel": "Name of spatial unit dataset",
      "nextUpperHierarchyLevel": "Name of upper hierarchy level"
    };
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

  cancel() {
    this.activeModal.dismiss();
  }

  onSubmit() {
    this.editSpatialUnitMetadata();
  }

  // Missing function for metadata export template
  onExportSpatialUnitEditMetadataTemplate() {
    const metadataStructure = this.spatialUnitMetadataStructure;
    const metadataJSON = JSON.stringify(metadataStructure, null, 2);
    const fileName = "Raumebene_Metadaten_Vorlage_Export.json";
    this.downloadFile(metadataJSON, fileName);
  }
} 