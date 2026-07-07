import { Component, OnInit, inject, output, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { BroadcastService } from '../../../../../services/broadcast-service/broadcast.service';
import { BroadcastMessage } from '../../../../../services/broadcast-service/broadcast-message';
import { IndicatorValueService } from '../../../../../services/indicator-value-service/indicator-value.service';
import { SpatialUnitMetadataStoreService } from '../../../../../services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { IndicatorMetadataStoreService } from '../../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessScriptMetadataStoreService } from '../../../../../services/process-script-metadata-store-service/process-script-metadata-store.service';
import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';
import { AccessControlService } from '../../../../../services/access-control-service/access-control.service';
import { MetadataBootstrapService } from '../../../../../services/metadata-bootstrap-service/metadata-bootstrap.service';
import { TopicMetadataStoreService } from '../../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { TopicHierarchyService } from '../../../../../services/topic-hierarchy-service/topic-hierarchy.service';
import { FormsModule } from '@angular/forms';
import { IndicatorRefreshRequest } from '../indicator-refresh.model';

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
  indicatorReference: any;
}

interface AffectedGeoresourceReference {
  georesourceReference: any;
}

@Component({
  selector: 'app-indicator-delete-modal',
  templateUrl: './indicator-delete-modal.component.html',
  styleUrls: ['./indicator-delete-modal.component.scss'],
  imports: [FormsModule],
  standalone: true,
})
export class IndicatorDeleteModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private http = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  private indicatorValueService = inject(IndicatorValueService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private envConfigService = inject(EnvConfigService);
  private accessControlService = inject(AccessControlService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private topicStore = inject(TopicMetadataStoreService);
  private topicHierarchyService = inject(TopicHierarchyService);

  readonly refreshRequested = output<IndicatorRefreshRequest>();

  // Collapsible state of the selected indicator's metadata table.
  readonly showMetadata = signal(false);

  indicatorDeleteTypes: IndicatorDeleteType[] = [
    {
      displayName: 'Gesamter Datensatz',
      apiName: 'indicatorDataset',
    },
    {
      displayName: 'Einzelne Zeitschnitte',
      apiName: 'indicatorTimestamp',
    },
    {
      displayName: 'Einzelne Raumebenen',
      apiName: 'indicatorSpatialUnit',
    },
  ];

  indicatorDeleteType: IndicatorDeleteType = this.indicatorDeleteTypes[0];
  selectedIndicatorDataset: any = undefined;
  // Optional indicator to preselect when the modal is opened from a per-row
  // trash button. Applied in ngOnInit after the form reset.
  preselectedIndicatorDataset: any = null;
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

  ngOnInit(): void {
    this.resetIndicatorsDeleteForm();

    // Apply a preselection handed in by the caller (per-row trash button) after
    // the reset above, so it survives the reset regardless of ngOnInit timing.
    if (this.preselectedIndicatorDataset) {
      this.selectedIndicatorDataset = this.preselectedIndicatorDataset;
      this.onChangeSelectedIndicator();
    }
  }

  onChangeSelectIndicatorTimestampEntries(): void {
    this.selectIndicatorTimestampsInput = !this.selectIndicatorTimestampsInput;

    this.currentApplicableDates.forEach((applicableDate) => {
      applicableDate.isSelected = this.selectIndicatorTimestampsInput;
    });
  }

  onChangeSelectIndicatorSpatialUnitsEntries(): void {
    this.selectIndicatorSpatialUnitsInput = !this.selectIndicatorSpatialUnitsInput;

    this.currentApplicableSpatialUnits.forEach((applicableSpatialUnit) => {
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
      for (const timestamp of this.selectedIndicatorDataset.applicableDates ?? []) {
        this.currentApplicableDates.push({
          timestamp: timestamp,
          isSelected: false,
        });
      }

      this.currentApplicableSpatialUnits = [];
      for (const spatialUnitMetadata of this.spatialUnitStore.availableSpatialUnits) {
        if (
          this.selectedIndicatorDataset.applicableSpatialUnits &&
          this.selectedIndicatorDataset.applicableSpatialUnits.some(
            (o: any) => o.spatialUnitName === spatialUnitMetadata.spatialUnitLevel
          )
        ) {
          this.currentApplicableSpatialUnits.push({
            spatialUnitMetadata: spatialUnitMetadata,
            isSelected: false,
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
    this.showMetadata.set(false);

    this.hideSuccessAlert();
    this.hideErrorAlert();
  }

  gatherAffectedScripts(): AffectedScript[] {
    const affectedScripts: AffectedScript[] = [];

    this.processScriptStore.availableProcessScripts.forEach((script) => {
      const requiredIndicatorIds = script.requiredIndicatorIds;

      for (const indicatorId of requiredIndicatorIds) {
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

    const georesourceReferences = this.selectedIndicatorDataset.referencedGeoresources ?? [];

    for (const georesourceReference of georesourceReferences) {
      affectedGeoresourceReferences.push({
        georesourceReference: georesourceReference,
      });
    }

    return affectedGeoresourceReferences;
  }

  gatherAffectedIndicatorReferences(): AffectedIndicatorReference[] {
    const affectedIndicatorReferences: AffectedIndicatorReference[] = [];

    // First add all direct references from selected indicator
    const indicatorReferences_selectedIndicator =
      this.selectedIndicatorDataset.referencedIndicators ?? [];

    for (const indicatorReference_selectedIndicator of indicatorReferences_selectedIndicator) {
      affectedIndicatorReferences.push({
        indicatorReference: indicatorReference_selectedIndicator,
      });
    }

    // Then add all references, where selected indicator is the referencedIndicator
    this.indicatorStore.availableIndicators.forEach((indicator) => {
      const indicatorReferences = indicator.referencedIndicators ?? [];

      for (const indicatorReference of indicatorReferences) {
        if (
          indicatorReference.referencedIndicatorId === this.selectedIndicatorDataset.indicatorId
        ) {
          affectedIndicatorReferences.push({
            indicatorReference: indicatorReference,
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
    if (this.indicatorDeleteType.apiName === 'indicatorDataset') {
      // Delete complete dataset
      this.deleteWholeIndicatorDataset();
    } else if (this.indicatorDeleteType.apiName === 'indicatorTimestamp') {
      // Delete all selected timestamps from indicator
      this.deleteSelectedIndicatorTimestamps();
    } else if (this.indicatorDeleteType.apiName === 'indicatorSpatialUnit') {
      // Delete all selected spatial units from indicator
      this.deleteSelectedIndicatorSpatialUnits();
    }
  }

  deleteWholeIndicatorDataset(): void {
    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/indicators/${this.selectedIndicatorDataset.indicatorId}`;

    this.http.delete(url).subscribe({
      next: (_response) => {
        this.successfullyDeletedDatasets.push(this.selectedIndicatorDataset);

        // Fetch indicator metadata again as an indicator was deleted
        this.refreshRequested.emit({
          crudType: 'delete',
          targetIndicatorId: this.currentIndicatorId,
        });

        setTimeout(() => {
          this.broadcastService.broadcast(BroadcastMessage.RefreshAdminDashboardDiagrams);
        }, 500);

        this.showSuccessAlert = true;

        setTimeout(() => {
          this.loadingData = false;
        });
      },
      error: (error) => {
        this.failedDatasetsAndErrors.push([
          this.selectedIndicatorDataset,
          this.indicatorValueService.formatError(error),
        ]);

        this.showErrorAlert = true;
        this.loadingData = false;
      },
    });
  }

  async deleteSelectedIndicatorTimestamps(): Promise<void> {
    // Iterate over all applicable spatial units and selected applicable dates
    for (const applicableDate of this.currentApplicableDates) {
      if (applicableDate.isSelected) {
        for (const applicableSpatialUnit of this.currentApplicableSpatialUnits) {
          await this.getDeleteTimestampPromise(
            applicableDate,
            applicableSpatialUnit.spatialUnitMetadata.spatialUnitId
          );
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
      this.refreshRequested.emit({
        crudType: 'edit',
        targetIndicatorId: this.currentIndicatorId,
      });

      // Refresh all admin dashboard diagrams due to modified metadata
      setTimeout(() => {
        this.broadcastService.broadcast(BroadcastMessage.RefreshAdminDashboardDiagrams);
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
      await this.metadataBootstrap.fetchIndicatorsMetadata(
        this.accessControlService.currentKeycloakLoginRoles
      );

      // Refresh overview table
      this.refreshRequested.emit({
        crudType: 'edit',
        targetIndicatorId: this.currentIndicatorId,
      });

      // Refresh all admin dashboard diagrams due to modified metadata
      setTimeout(() => {
        this.broadcastService.broadcast(BroadcastMessage.RefreshAdminDashboardDiagrams);
      }, 500);

      this.loadingData = false;
    }
  }

  getDeleteTimestampPromise(applicableDate: ApplicableDate, spatialUnitId: string): Promise<void> {
    // Timestamp looks like 2020-12-31
    const timestamp = applicableDate.timestamp;

    // [yyyy, mm, dd]
    const timestampComps = timestamp.split('-');

    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/indicators/${this.selectedIndicatorDataset.indicatorId}/${spatialUnitId}/${timestampComps[0]}/${timestampComps[1]}/${timestampComps[2]}`;

    return firstValueFrom(this.http.delete(url)).then(
      () => {
        if (!this.successfullyDeletedTimestamps.includes(applicableDate)) {
          this.successfullyDeletedTimestamps.push(applicableDate);
        }
      },
      (error) => {
        this.failedTimestampsAndErrors.push([
          applicableDate,
          this.indicatorValueService.formatError(error),
        ]);
      }
    );
  }

  getDeleteSpatialUnitPromise(applicableSpatialUnit: ApplicableSpatialUnit): Promise<void> {
    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/indicators/${this.selectedIndicatorDataset.indicatorId}/${applicableSpatialUnit.spatialUnitMetadata.spatialUnitId}`;

    return firstValueFrom(this.http.delete(url)).then(
      () => {
        if (!this.successfullyDeletedSpatialUnits.includes(applicableSpatialUnit)) {
          this.successfullyDeletedSpatialUnits.push(applicableSpatialUnit);
        }
      },
      (error) => {
        this.failedSpatialUnitsAndErrors.push([
          applicableSpatialUnit,
          this.indicatorValueService.formatError(error),
        ]);
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
    return this.indicatorStore.availableIndicators.filter((indicator) =>
      indicator.userPermissions.includes('creator')
    );
  }

  getFilteredIndicators(): any[] {
    const indicators = this.getIndicatorsWithPermission();
    if (!this.indicatorNameFilter) {
      return indicators;
    }
    return indicators.filter((indicator) =>
      indicator.indicatorName.toLowerCase().includes(this.indicatorNameFilter.toLowerCase())
    );
  }

  toggleMetadataDetails(): void {
    this.showMetadata.update((shown) => !shown);
  }

  // Resolve the selected indicator's topicReference (a single topic id) to a
  // human-readable hierarchy string, matching the overview grid's column.
  getTopicHierarchyDisplayString(): string {
    return this.topicHierarchyService.getTopicHierarchyDisplayString(
      this.topicStore.availableTopics,
      this.selectedIndicatorDataset?.topicReference
    );
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
