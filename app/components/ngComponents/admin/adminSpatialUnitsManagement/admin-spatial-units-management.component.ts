import { Component, OnInit, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';

import { Subscription, skip } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpatialUnitAddModalComponent } from './spatialUnitAddModal/spatial-unit-add-modal.component';
import { SpatialUnitEditMetadataModalComponent } from './spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.component';
import { SpatialUnitEditFeaturesModalComponent } from './spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.component';
import { SpatialUnitEditUserRolesModalComponent } from './spatialUnitEditUserRolesModal/spatial-unit-edit-user-roles-modal.component';
import { SpatialUnitDeleteModalComponent } from './spatialUnitDeleteModal/spatial-unit-delete-modal.component';
import {
  KommonitorDataExchangeService,
  SpatialUnitMetadata,
} from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorCacheHelperService } from 'services/adminSpatialUnit/kommonitor-cache-helper.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { FormsModule } from '@angular/forms';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';

interface RefreshBroadcastValues {
  crudType: string;
  targetSpatialUnitId: string | string[];
}

@Component({
  selector: 'app-admin-spatial-units-management',
  templateUrl: './admin-spatial-units-management.component.html',
  styleUrls: ['./admin-spatial-units-management.component.scss'],
  imports: [ExpandableBoxComponent, AgGridAngular, FormsModule, AdminContentViewComponent],
  standalone: true,
})
export class AdminSpatialUnitsManagementComponent implements OnInit, OnDestroy {
  private zone = inject(NgZone);
  private modalService = inject(NgbModal);
  private broadcastService = inject(BroadcastService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  private kommonitorCacheHelperService = inject(KommonitorCacheHelperService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);

  @ViewChild('spatialUnitOverviewTable', { static: true })
  spatialUnitOverviewTable!: AgGridAngular;

  public loadingData: boolean = true;
  public initializationCompleted: boolean = false;
  public tableViewSwitcher: boolean = false;
  private subscriptions: Subscription[] = [];

  // AG Grid properties
  public columnDefs: ColDef[] = [
    {
      headerName: 'Editierfunktionen',
      pinned: 'left',
      maxWidth: 170,
      checkboxSelection: false,
      headerCheckboxSelection: false,
      headerCheckboxSelectionFilteredOnly: true,
      filter: false,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<SpatialUnitMetadata>) =>
        this.displayEditButtons_spatialUnits(params),
    },
    { headerName: 'Id', field: 'spatialUnitId', pinned: 'left', maxWidth: 125 },
    {
      headerName: 'Name',
      field: 'spatialUnitLevel',
      pinned: 'left',
      minWidth: 300,
    },
    {
      headerName: 'Beschreibung',
      minWidth: 400,
      cellRenderer: (params: ICellRendererParams) => params.data.metadata.description,
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + params.data!.metadata.description,
    },
    {
      headerName: 'Nächst niedrigere Raumebene',
      field: 'nextLowerHierarchyLevel',
      minWidth: 250,
    },
    {
      headerName: 'Nächst höhere Raumebene',
      field: 'nextUpperHierarchyLevel',
      minWidth: 250,
    },
    {
      headerName: 'Gültigkeitszeitraum',
      minWidth: 400,
      cellRenderer: (params: ICellRendererParams) => {
        let html =
          '<ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; word-break: break-word !important;">';
        for (const periodOfValidity of params.data.availablePeriodsOfValidity) {
          html += '<li style="margin-right: 15px;">';
          if (periodOfValidity.endDate) {
            html +=
              '<p>' + periodOfValidity.startDate + ' &dash; ' + periodOfValidity.endDate + '</p>';
          } else {
            html += '<p>' + periodOfValidity.startDate + ' &dash; heute</p>';
          }
          html += '</li>';
        }
        html += '</ul>';
        return html;
      },
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) => {
        if (
          params.data!.availablePeriodsOfValidity &&
          params.data!.availablePeriodsOfValidity.length > 1
        ) {
          return '' + JSON.stringify(params.data!.availablePeriodsOfValidity);
        }
        return params.data!.availablePeriodsOfValidity;
      },
    },
    {
      headerName: 'Datenquelle',
      minWidth: 400,
      cellRenderer: (params: ICellRendererParams) => params.data.metadata.datasource,
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + params.data!.metadata.datasource,
    },
    {
      headerName: 'Datenhalter und Kontakt',
      minWidth: 400,
      cellRenderer: (params: ICellRendererParams) => params.data.metadata.contact,
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + params.data!.metadata.contact,
    },
    {
      headerName: 'Rollen',
      minWidth: 400,
      cellRenderer: (params: ICellRendererParams) =>
        this.kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions),
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + this.kommonitorDataExchangeService.getAllowedRolesString(params.data!.permissions),
    },
    {
      headerName: 'Öffentlich sichtbar',
      minWidth: 400,
      cellRenderer: (params: ICellRendererParams) => (params.data.isPublic ? 'ja' : 'nein'),
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + (params.data!.isPublic ? 'ja' : 'nein'),
    },
    {
      headerName: 'Eigentümer',
      minWidth: 400,
      cellRenderer: (params: ICellRendererParams) =>
        this.kommonitorDataExchangeService.getRoleTitle(params.data.ownerId),
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + this.kommonitorDataExchangeService.getRoleTitle(params.data!.ownerId),
    },
    {
      headerName: 'Linienfarbe (Umringslayer)',
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<SpatialUnitMetadata>) =>
        params.data!.outlineColor || '-',
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + (params.data!.outlineColor || '-'),
    },
    {
      headerName: 'Linienbreite (Umringslayer)',
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<SpatialUnitMetadata>) =>
        params.data!.outlineWidth || '-',
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + (params.data!.outlineWidth || '-'),
    },
    {
      headerName: 'Linienmuster (Umringslayer)',
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<SpatialUnitMetadata>) =>
        params.data!.outlineDashArrayString || '-',
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + (params.data!.outlineDashArrayString || '-'),
    },
  ];
  public rowData: SpatialUnitMetadata[] = [];
  public defaultColDef: ColDef = this.kommonitorDataGridHelperService.buildDefaultColDef();
  public gridOptions: GridOptions = {};

  // Pagination properties
  public paginationPageSize: number = 10;
  public paginationPageSizeSelector: number[] = [10, 25, 50, 100];

  ngOnInit(): void {
    this.setupSubscriptions();
    this.setupEventListeners();
    this.fetchSpatialUnitsData();
    this.setupFallbackTimeout();
  }

  private setupSubscriptions(): void {
    // Subscribe to spatial units data
    const spatialUnitsSub = this.kommonitorDataExchangeService.spatialUnits$.subscribe(
      (spatialUnits) => {
        if (spatialUnits && spatialUnits.length > 0) {
          this.loadingData = false;
          this.initializationCompleted = true;
          this.rowData = spatialUnits;
        }
      }
    );
    this.subscriptions.push(spatialUnitsSub);

    // Subscribe to loading state
    const loadingSub = this.kommonitorDataExchangeService.loading$.subscribe((loading) => {
      this.loadingData = loading;
    });
    this.subscriptions.push(loadingSub);

    // Subscribe to error state
    const errorSub = this.kommonitorDataExchangeService.error$.subscribe((error) => {
      if (error) {
        // You can add error handling UI here
      }
    });
    this.subscriptions.push(errorSub);
  }

  private setupFallbackTimeout(): void {
    // Fallback to prevent infinite loading if no data arrives within 3 seconds
    setTimeout(() => {
      if (this.loadingData) {
        this.fetchSpatialUnitsData();

        if (
          !this.kommonitorDataExchangeService.availableSpatialUnits ||
          this.kommonitorDataExchangeService.availableSpatialUnits.length === 0
        ) {
          this.loadingData = false;
          this.initializationCompleted = true;
        }
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  displayEditButtons_spatialUnits(params: ICellRendererParams<SpatialUnitMetadata>): string {
    const data = params.data;
    let html = '<div class="btn-group btn-group-sm">';
    if (data && data.userPermissions) {
      // Edit Metadata Button
      html +=
        '<button id="btn_spatialUnit_editMetadata_' +
        data.spatialUnitId +
        '" class="btn btn-warning btn-sm spatialUnitEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-metadata" title="Metadaten editieren" ' +
        (data.userPermissions.includes('editor') ? '' : 'disabled') +
        '><i class="fas fa-pencil-alt"></i></button>';

      // Edit Features Button
      html +=
        '<button id="btn_spatialUnit_editFeatures_' +
        data.spatialUnitId +
        '" class="btn btn-warning btn-sm spatialUnitEditFeaturesBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-features" title="Features fortführen" ' +
        (data.userPermissions.includes('editor') ? '' : 'disabled') +
        '><i class="fas fa-draw-polygon"></i></button>';

      // Edit User Roles Button
      html +=
        '<button id="btn_spatialUnit_editUserRoles_' +
        data.spatialUnitId +
        '" class="btn btn-warning btn-sm spatialUnitEditUserRolesBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-user-roles" title="Zugriffsschutz und Eigentümerschaft editieren" ' +
        (data.userPermissions.includes('creator') ? '' : 'disabled') +
        '><i class="fas fa-user-lock"></i></button>';

      // Delete Button
      html +=
        '<button id="btn_spatialUnit_deleteSpatialUnit_' +
        data.spatialUnitId +
        '" class="btn btn-danger btn-sm spatialUnitDeleteBtn" type="button" data-toggle="modal" data-target="#modal-delete-spatial-units" title="Raumebene entfernen" ' +
        (data.userPermissions.includes('creator') ? '' : 'disabled') +
        '><i class="fas fa-trash"></i></button>';

      html += '</div>';
    }
    return html;
  }

  private setupEventListeners(): void {
    // React to metadata loading state transitions. skip(1) drops the
    // BehaviorSubject's replayed current value so this keeps the original
    // one-shot semantics of the former broadcast event.
    const loadingSub = this.metadataBootstrap.metadataLoading$
      .pipe(skip(1))
      .subscribe((state) => {
        if (state === MetadataLoadingState.COMPLETE) {
          this.zone.run(() => {
            this.fetchSpatialUnitsData();
          });
        }
      });
    this.subscriptions.push(loadingSub);

    // Listen for the global metadata loading completion event
    const sub = this.broadcastService.currentBroadcastMsg.subscribe((data) => {
      if (data.msg === 'refreshSpatialUnitOverviewTable') {
        this.zone.run(() => {
          this.loadingData = true;
          // Extract crudType and targetSpatialUnitId from the broadcast data values
          const crudType = (data.values as RefreshBroadcastValues)?.crudType;
          const targetSpatialUnitId = (data.values as RefreshBroadcastValues)?.targetSpatialUnitId;
          this.refreshSpatialUnitOverviewTable(crudType, targetSpatialUnitId);
        });
      }
      // Handle grid button click events
      else if (data.msg === 'onEditSpatialUnitMetadata') {
        this.zone.run(() => {
          this.onClickEditMetadata(data.values);
        });
      } else if (data.msg === 'onEditSpatialUnitFeatures') {
        this.zone.run(() => {
          this.onClickEditFeatures(data.values);
        });
      } else if (data.msg === 'onEditSpatialUnitUserRoles') {
        this.zone.run(() => {
          this.onClickEditUserRoles(data.values);
        });
      } else if (data.msg === 'onDeleteSpatialUnits') {
        this.zone.run(() => {
          // Ensure data.values is an array for delete operation
          const datasetsToDelete = Array.isArray(data.values) ? data.values : [data.values];
          this.onClickDeleteSpatialUnits(datasetsToDelete);
        });
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Fetch spatial units data from the service
   */
  private fetchSpatialUnitsData(): void {
    // Get current roles or use empty array as fallback
    const currentRoles = this.kommonitorDataExchangeService.currentKeycloakLoginRoles || [];

    this.kommonitorDataExchangeService.fetchSpatialUnitsMetadata(currentRoles).subscribe({
      next: (_spatialUnits) => {
        // The data will be handled by the subscription in ngOnInit
      },
      error: (_error) => {
        this.loadingData = false;
        this.initializationCompleted = true;
      },
    });
  }

  public initializeOrRefreshOverviewTable(): void {
    this.fetchSpatialUnitsData();
  }

  // Table view switcher method
  onTableViewSwitch(): void {
    // Filter the data based on the tableViewSwitcher state
    // For now, just refresh the table
    this.initializeOrRefreshOverviewTable();
  }

  // Alias for the add spatial unit modal (matching HTML template)
  openAddSpatialUnitModal(): void {
    this.onClickAddSpatialUnit();
  }

  // Modal event handlers
  onClickAddSpatialUnit(): void {
    const modalRef = this.modalService.open(SpatialUnitAddModalComponent, {
      // omit size to avoid Bootstrap max-width caps like modal-lg
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-large',
      windowClass: 'modal-large-window',
    });

    modalRef.result
      .then((result) => {
        if (result) {
          this.initializeOrRefreshOverviewTable();
        }
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  onClickEditMetadata(spatialUnitMetadata: SpatialUnitMetadata): void {
    const modalRef = this.modalService.open(SpatialUnitEditMetadataModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-medium',
      windowClass: 'modal-medium',
    });

    modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitMetadata;

    modalRef.result
      .then((result) => {
        if (result) {
          this.initializeOrRefreshOverviewTable();
        }
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  onClickEditFeatures(spatialUnitMetadata: SpatialUnitMetadata): void {
    const modalRef = this.modalService.open(SpatialUnitEditFeaturesModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-medium',
      windowClass: 'modal-medium',
    });

    modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitMetadata;

    modalRef.result
      .then((result) => {
        if (result) {
          this.initializeOrRefreshOverviewTable();
        }
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  onClickEditUserRoles(spatialUnitMetadata: SpatialUnitMetadata): void {
    const modalRef = this.modalService.open(SpatialUnitEditUserRolesModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-medium',
      windowClass: 'modal-medium',
    });

    modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitMetadata;

    modalRef.result
      .then((result) => {
        if (result) {
          this.initializeOrRefreshOverviewTable();
        }
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  onClickDeleteSpatialUnits(spatialUnitsMetadata: SpatialUnitMetadata[]): void {
    const modalRef = this.modalService.open(SpatialUnitDeleteModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-medium',
      windowClass: 'modal-medium',
    });

    modalRef.componentInstance.datasetsToDelete = spatialUnitsMetadata;

    modalRef.result
      .then((result) => {
        if (result) {
          this.initializeOrRefreshOverviewTable();
        }
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  // Utility methods
  checkCreatePermission(): boolean {
    return this.kommonitorDataExchangeService.checkCreatePermission();
  }

  refreshSpatialUnitOverviewTable(
    crudType?: string,
    targetSpatialUnitId?: string | string[]
  ): void {
    if (!crudType || !targetSpatialUnitId) {
      // Refetch all metadata from spatial units to update table
      this.kommonitorDataExchangeService
        .fetchSpatialUnitsMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles)
        .subscribe({
          next: (_response) => {
            this.initializeOrRefreshOverviewTable();
            this.loadingData = false;
          },
          error: (_response) => {
            this.loadingData = false;
          },
        });
    } else if (crudType && targetSpatialUnitId) {
      if (crudType === 'edit') {
        // Fetch single spatial unit metadata and update the table
        this.kommonitorCacheHelperService
          .fetchSingleSpatialUnitMetadata(
            targetSpatialUnitId as string,
            this.kommonitorDataExchangeService.currentKeycloakLoginRoles
          )
          .subscribe({
            next: (data) => {
              this.kommonitorDataExchangeService.replaceSingleSpatialUnitMetadata(data);
              this.initializeOrRefreshOverviewTable();
              this.loadingData = false;
            },
            error: (_response) => {
              this.loadingData = false;
            },
          });
      } else if (crudType === 'add') {
        // Fetch single spatial unit metadata and add to table
        this.kommonitorCacheHelperService
          .fetchSingleSpatialUnitMetadata(
            targetSpatialUnitId as string,
            this.kommonitorDataExchangeService.currentKeycloakLoginRoles
          )
          .subscribe({
            next: (data) => {
              this.kommonitorDataExchangeService.addSingleSpatialUnitMetadata(data);
              this.initializeOrRefreshOverviewTable();
              this.loadingData = false;
            },
            error: (_response) => {
              this.loadingData = false;
            },
          });
      } else if (crudType === 'delete') {
        // Handle delete operation
        if (typeof targetSpatialUnitId === 'string') {
          this.kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(targetSpatialUnitId);
        } else if (Array.isArray(targetSpatialUnitId)) {
          for (const id of targetSpatialUnitId) {
            this.kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(id);
          }
        }
        this.initializeOrRefreshOverviewTable();
        this.loadingData = false;
      }
    }
  }
}
