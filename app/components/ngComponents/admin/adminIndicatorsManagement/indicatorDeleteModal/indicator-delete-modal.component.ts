import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { DataExchangeService } from '../../../../../services/data-exchange-service/data-exchange.service';
import { BroadcastService } from '../../../../../services/broadcast-service/broadcast.service';

declare var __env: any;

interface IndicatorDeleteType {
  displayName: string;
  apiName: string;
}

interface ApplicableDate {
  timestamp: string;
  isSelected: boolean;
}

interface ApplicableSpatialUnit {
  spatialUnitMetadata: any;
  isSelected: boolean;
}

interface AffectedScript {
  scriptId: string;
  name: string;
  description: string;
  requiredIndicatorIds: string[];
}

interface AffectedIndicatorReference {
  indicatorMetadata: any;
  indicatorReference: any;
}

interface AffectedGeoresourceReference {
  indicatorMetadata: any;
  georesourceReference: any;
}

@Component({
  selector: 'app-indicator-delete-modal',
  templateUrl: './indicator-delete-modal.component.html',
  styleUrls: ['./indicator-delete-modal.component.css']
})
export class IndicatorDeleteModalComponent implements OnInit, OnDestroy {

  indicatorDeleteTypes: IndicatorDeleteType[] = [
    {
      displayName: "Gesamter Datensatz",
      apiName: "indicatorDataset"
    },
    {
      displayName: "Einzelne Zeitschnitte", 
      apiName: "indicatorTimestamp"
    },
    {
      displayName: "Einzelne Raumebenen",
      apiName: "indicatorSpatialUnit"
    }
  ];

  indicatorDeleteType: IndicatorDeleteType = this.indicatorDeleteTypes[0];
  selectedIndicatorDataset: any = undefined;
  currentIndicatorId: string = '';
  currentApplicableDates: ApplicableDate[] = [];
  selectIndicatorTimestampsInput: boolean = false;
  currentApplicableSpatialUnits: ApplicableSpatialUnit[] = [];
  selectIndicatorSpatialUnitsInput: boolean = false;
  indicatorNameFilter: string = '';

  loadingData: boolean = false;

  successfullyDeletedDatasets: any[] = [];
  successfullyDeletedTimestamps: ApplicableDate[] = [];
  successfullyDeletedSpatialUnits: ApplicableSpatialUnit[] = [];
  failedDatasetsAndErrors: [any, string][] = [];
  failedTimestampsAndErrors: [ApplicableDate, string][] = [];
  failedSpatialUnitsAndErrors: [ApplicableSpatialUnit, string][] = [];

  affectedScripts: AffectedScript[] = [];
  affectedIndicatorReferences: AffectedIndicatorReference[] = [];
  affectedGeoresourceReferences: AffectedGeoresourceReference[] = [];

  showSuccessAlert: boolean = false;
  showErrorAlert: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    private dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    @Inject('kommonitorDataExchangeService') public angularJsDataExchangeService: any
  ) { }

  ngOnInit(): void {
    this.resetIndicatorsDeleteForm();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onChangeSelectIndicatorTimestampEntries(): void {
    this.selectIndicatorTimestampsInput = !this.selectIndicatorTimestampsInput;

    this.currentApplicableDates.forEach(applicableDate => {
      applicableDate.isSelected = this.selectIndicatorTimestampsInput;
    });
  }

  onChangeSelectIndicatorSpatialUnitsEntries(): void {
    this.selectIndicatorSpatialUnitsInput = !this.selectIndicatorSpatialUnitsInput;

    this.currentApplicableSpatialUnits.forEach(applicableSpatialUnit => {
      applicableSpatialUnit.isSelected = this.selectIndicatorSpatialUnitsInput;
    });
  }

  onChangeSelectedIndicator(): void {
    if (this.selectedIndicatorDataset) {
      this.currentIndicatorId = this.selectedIndicatorDataset.indicatorId;
      
      this.successfullyDeletedDatasets = [];
      this.successfullyDeletedTimestamps = [];
      this.successfullyDeletedSpatialUnits = [];
      this.failedDatasetsAndErrors = [];
      this.failedTimestampsAndErrors = [];
      this.failedSpatialUnitsAndErrors = [];

      this.currentApplicableDates = [];
      for (const timestamp of this.selectedIndicatorDataset.applicableDates) {
        this.currentApplicableDates.push({
          timestamp: timestamp,
          isSelected: false
        });
      }

      this.currentApplicableSpatialUnits = [];
      for (const spatialUnitMetadata of this.angularJsDataExchangeService.availableSpatialUnits) {
        if (this.selectedIndicatorDataset.applicableSpatialUnits && 
            this.selectedIndicatorDataset.applicableSpatialUnits.some((o: any) => o.spatialUnitName === spatialUnitMetadata.spatialUnitLevel)) {
          
          this.currentApplicableSpatialUnits.push({
            spatialUnitMetadata: spatialUnitMetadata,
            isSelected: false
          });
        }
      }

      this.affectedScripts = this.gatherAffectedScripts();
      this.affectedIndicatorReferences = this.gatherAffectedIndicatorReferences();
      this.affectedGeoresourceReferences = this.gatherAffectedGeoresourceReferences();
    }
  }

  resetIndicatorsDeleteForm(): void {
    this.selectedIndicatorDataset = undefined;
    this.currentApplicableDates = [];
    this.selectIndicatorTimestampsInput = false;
    this.currentApplicableSpatialUnits = [];
    this.selectIndicatorSpatialUnitsInput = false;
    this.indicatorDeleteType = this.indicatorDeleteTypes[0];

    this.successfullyDeletedDatasets = [];
    this.successfullyDeletedTimestamps = [];
    this.successfullyDeletedSpatialUnits = [];
    this.failedDatasetsAndErrors = [];
    this.failedTimestampsAndErrors = [];
    this.failedSpatialUnitsAndErrors = [];
    this.affectedScripts = [];
    this.affectedIndicatorReferences = [];
    this.affectedGeoresourceReferences = [];
    
    this.hideSuccessAlert();
    this.hideErrorAlert();
  }

  gatherAffectedScripts(): AffectedScript[] {
    const affectedScripts: AffectedScript[] = [];

    this.angularJsDataExchangeService.availableProcessScripts.forEach(script => {
      const requiredIndicatorIds = script.requiredIndicatorIds;

      for (let i = 0; i < requiredIndicatorIds.length; i++) {
        const indicatorId = requiredIndicatorIds[i];
        if (indicatorId === this.selectedIndicatorDataset.indicatorId) {
          affectedScripts.push(script);
          break;
        }
      }
    });

    return affectedScripts;
  }

  gatherAffectedGeoresourceReferences(): AffectedGeoresourceReference[] {
    const affectedGeoresourceReferences: AffectedGeoresourceReference[] = [];

    const georesourceReferences = this.selectedIndicatorDataset.referencedGeoresources;

    for (let i = 0; i < georesourceReferences.length; i++) {
      const georesourceReference = georesourceReferences[i];

      affectedGeoresourceReferences.push({
        indicatorMetadata: this.selectedIndicatorDataset,
        georesourceReference: georesourceReference
      });
    }

    return affectedGeoresourceReferences;
  }

  gatherAffectedIndicatorReferences(): AffectedIndicatorReference[] {
    const affectedIndicatorReferences: AffectedIndicatorReference[] = [];

    // First add all direct references from selected indicator
    const indicatorReferences_selectedIndicator = this.selectedIndicatorDataset.referencedIndicators;

    for (let i = 0; i < indicatorReferences_selectedIndicator.length; i++) {
      const indicatorReference_selectedIndicator = indicatorReferences_selectedIndicator[i];

      affectedIndicatorReferences.push({
        indicatorMetadata: this.selectedIndicatorDataset,
        indicatorReference: indicatorReference_selectedIndicator
      });
    }

    // Then add all references, where selected indicator is the referencedIndicator 
    this.angularJsDataExchangeService.availableIndicators.forEach(indicator => {
      const indicatorReferences = indicator.referencedIndicators;

      for (let i = 0; i < indicatorReferences.length; i++) {
        const indicatorReference = indicatorReferences[i];
        if (indicatorReference.referencedIndicatorId === this.selectedIndicatorDataset.indicatorId) {
          affectedIndicatorReferences.push({
            indicatorMetadata: this.selectedIndicatorDataset,
            indicatorReference: indicatorReference
          });
        }
      }
    });

    return affectedIndicatorReferences;
  }

  deleteIndicatorData(): void {
    this.loadingData = true;

    this.successfullyDeletedDatasets = [];
    this.successfullyDeletedTimestamps = [];
    this.successfullyDeletedSpatialUnits = [];
    this.failedDatasetsAndErrors = [];
    this.failedTimestampsAndErrors = [];
    this.failedSpatialUnitsAndErrors = [];

    // Depending on deleteType we must execute different DELETE requests
    if (this.indicatorDeleteType.apiName === "indicatorDataset") {
      // Delete complete dataset
      this.deleteWholeIndicatorDataset();
    } else if (this.indicatorDeleteType.apiName === "indicatorTimestamp") {
      // Delete all selected timestamps from indicator
      this.deleteSelectedIndicatorTimestamps();
    } else if (this.indicatorDeleteType.apiName === "indicatorSpatialUnit") {
      // Delete all selected spatial units from indicator
      this.deleteSelectedIndicatorSpatialUnits();
    }
  }

  deleteWholeIndicatorDataset(): void {
    this.loadingData = true;

    const url = `${this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI}/indicators/${this.selectedIndicatorDataset.indicatorId}`;

    this.http.delete(url).subscribe({
      next: (response) => {
        this.successfullyDeletedDatasets.push(this.selectedIndicatorDataset);

        // Fetch indicator metadata again as an indicator was deleted
        this.broadcastService.broadcast("refreshIndicatorOverviewTable", { action: "delete", indicatorId: this.currentIndicatorId });

        setTimeout(() => {
          this.broadcastService.broadcast("refreshAdminDashboardDiagrams");
        }, 500);

        this.showSuccessAlert = true;

        setTimeout(() => {
          this.loadingData = false;
        });
      },
      error: (error) => {
        if (error.error) {
          this.failedDatasetsAndErrors.push([this.selectedIndicatorDataset, this.angularJsDataExchangeService.syntaxHighlightJSON(error.error)]);
        } else {
          this.failedDatasetsAndErrors.push([this.selectedIndicatorDataset, this.angularJsDataExchangeService.syntaxHighlightJSON(error)]);
        }

        this.showErrorAlert = true;
        this.loadingData = false;
      }
    });
  }

  async deleteSelectedIndicatorTimestamps(): Promise<void> {
    // Iterate over all applicable spatial units and selected applicable dates
    for (const applicableDate of this.currentApplicableDates) {
      if (applicableDate.isSelected) {
        for (const applicableSpatialUnit of this.currentApplicableSpatialUnits) {
          await this.getDeleteTimestampPromise(applicableDate, applicableSpatialUnit.spatialUnitMetadata.spatialUnitId);
        }
      }
    }

    if (this.failedTimestampsAndErrors.length > 0) {
      // Error handling
      this.showErrorAlert = true;
      this.loadingData = false;
    }
    
    if (this.successfullyDeletedTimestamps.length > 0) {
      this.showSuccessAlert = true;

      // Refresh overview table
      this.broadcastService.broadcast("refreshIndicatorOverviewTable", { action: "edit", indicatorId: this.currentIndicatorId });

      // Refresh all admin dashboard diagrams due to modified metadata
      setTimeout(() => {
        this.broadcastService.broadcast("refreshAdminDashboardDiagrams");
      }, 500);

      this.loadingData = false;
    }
  }

  async deleteSelectedIndicatorSpatialUnits(): Promise<void> {
    // Iterate over all applicable spatial units
    for (const applicableSpatialUnit of this.currentApplicableSpatialUnits) {
      if (applicableSpatialUnit.isSelected) {
        await this.getDeleteSpatialUnitPromise(applicableSpatialUnit);
      }
    }

    if (this.failedSpatialUnitsAndErrors.length > 0) {
      // Error handling
      this.showErrorAlert = true;
      this.loadingData = false;
    }
    
    if (this.successfullyDeletedSpatialUnits.length > 0) {
      this.showSuccessAlert = true;

      // Fetch indicator metadata again as an indicator was modified
      await this.angularJsDataExchangeService.fetchIndicatorsMetadata(this.angularJsDataExchangeService.currentKeycloakLoginRoles);
      
      // Refresh overview table
      this.broadcastService.broadcast("refreshIndicatorOverviewTable", { action: "edit", indicatorId: this.currentIndicatorId });

      // Refresh all admin dashboard diagrams due to modified metadata
      setTimeout(() => {
        this.broadcastService.broadcast("refreshAdminDashboardDiagrams");
      }, 500);

      this.loadingData = false;
    }
  }

  getDeleteTimestampPromise(applicableDate: ApplicableDate, spatialUnitId: string): Promise<void> {
    // Timestamp looks like 2020-12-31
    const timestamp = applicableDate.timestamp;

    // [yyyy, mm, dd]
    const timestampComps = timestamp.split("-");

    const url = `${this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI}/indicators/${this.selectedIndicatorDataset.indicatorId}/${spatialUnitId}/${timestampComps[0]}/${timestampComps[1]}/${timestampComps[2]}`;

    return this.http.delete(url).toPromise().then(
      (response) => {
        if (!this.successfullyDeletedTimestamps.includes(applicableDate)) {
          this.successfullyDeletedTimestamps.push(applicableDate);
        }
      },
      (error) => {
        if (error.error) {
          this.failedTimestampsAndErrors.push([applicableDate, this.angularJsDataExchangeService.syntaxHighlightJSON(error.error)]);
        } else {
          this.failedTimestampsAndErrors.push([applicableDate, this.angularJsDataExchangeService.syntaxHighlightJSON(error)]);
        }
      }
    );
  }

  getDeleteSpatialUnitPromise(applicableSpatialUnit: ApplicableSpatialUnit): Promise<void> {
    const url = `${this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI}/indicators/${this.selectedIndicatorDataset.indicatorId}/${applicableSpatialUnit.spatialUnitMetadata.spatialUnitId}`;

    return this.http.delete(url).toPromise().then(
      (response) => {
        if (!this.successfullyDeletedSpatialUnits.includes(applicableSpatialUnit)) {
          this.successfullyDeletedSpatialUnits.push(applicableSpatialUnit);
        }
      },
      (error) => {
        if (error.error) {
          this.failedSpatialUnitsAndErrors.push([applicableSpatialUnit, this.angularJsDataExchangeService.syntaxHighlightJSON(error.error)]);
        } else {
          this.failedSpatialUnitsAndErrors.push([applicableSpatialUnit, this.angularJsDataExchangeService.syntaxHighlightJSON(error)]);
        }
      }
    );
  }

  hideSuccessAlert(): void {
    this.showSuccessAlert = false;
  }

  hideErrorAlert(): void {
    this.showErrorAlert = false;
  }

  getIndicatorsWithPermission(): any[] {
    return this.angularJsDataExchangeService.availableIndicators.filter(indicator => 
      indicator.userPermissions.includes("creator")
    );
  }

  getFilteredIndicators(): any[] {
    const indicators = this.getIndicatorsWithPermission();
    if (!this.indicatorNameFilter) {
      return indicators;
    }
    return indicators.filter(indicator => 
      indicator.indicatorName.toLowerCase().includes(this.indicatorNameFilter.toLowerCase())
    );
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  close(): void {
    this.activeModal.dismiss();
  }
} 