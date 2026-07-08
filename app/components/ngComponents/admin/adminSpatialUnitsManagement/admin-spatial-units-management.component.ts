import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NgZone,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';

import { skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpatialUnitAddModalComponent } from './spatialUnitAddModal/spatial-unit-add-modal.component';
import { SpatialUnitEditMetadataModalComponent } from './spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.component';
import { SpatialUnitEditFeaturesModalComponent } from './spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.component';
import { SpatialUnitEditUserRolesModalComponent } from './spatialUnitEditUserRolesModal/spatial-unit-edit-user-roles-modal.component';
import { SpatialUnitDeleteModalComponent } from './spatialUnitDeleteModal/spatial-unit-delete-modal.component';
import { SpatialUnitOverviewType as SpatialUnitMetadata } from 'models/data-management-api';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellClickedEvent,
  ColDef,
  GridOptions,
  ICellRendererParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { FormsModule } from '@angular/forms';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { SpatialUnitRefreshRequest } from './spatial-unit-refresh.model';

@Component({
  selector: 'app-admin-spatial-units-management',
  templateUrl: './admin-spatial-units-management.component.html',
  styleUrls: ['./admin-spatial-units-management.component.scss'],
  imports: [ExpandableBoxComponent, AgGridAngular, FormsModule, AdminContentViewComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpatialUnitsManagementComponent implements OnInit {
  private zone = inject(NgZone);
  private modalService = inject(NgbModal);
  private metadataBootstrap = inject(MetadataBootstrapService);
  protected accessControlService = inject(AccessControlService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('spatialUnitOverviewTable', { static: true })
  spatialUnitOverviewTable!: AgGridAngular;

  public loadingData: boolean = true;
  public tableViewSwitcher: boolean = false;

  // Full, unfiltered metadata list; `rowData` is derived from it via the
  // "show only editable datasets" table-view filter.
  private allSpatialUnits: SpatialUnitMetadata[] = [];

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
      onCellClicked: (event: CellClickedEvent<SpatialUnitMetadata>) =>
        this.onEditButtonsCellClicked(event),
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
              '<p>' + periodOfValidity.startDate + ' &ndash; ' + periodOfValidity.endDate + '</p>';
          } else {
            html += '<p>' + periodOfValidity.startDate + ' &ndash; heute</p>';
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
        this.accessControlService.getAllowedRolesString(params.data.permissions),
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + this.accessControlService.getAllowedRolesString(params.data!.permissions),
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
        this.accessControlService.getRoleTitle(params.data.ownerId),
      filter: 'agTextColumnFilter',
      filterValueGetter: (params: ValueGetterParams<SpatialUnitMetadata>) =>
        '' + this.accessControlService.getRoleTitle(params.data!.ownerId ?? ''),
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
  // Signal-backed: written from the store subscription and fetch callbacks,
  // which would not trigger a re-render of this OnPush component otherwise.
  public rowData = signal<SpatialUnitMetadata[]>([]);
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
    // Subscribe to spatial units data (canonical store stream)
    this.spatialUnitStore.availableSpatialUnits$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((spatialUnits) => {
        if (spatialUnits && spatialUnits.length > 0) {
          this.loadingData = false;
          this.allSpatialUnits = spatialUnits;
          this.applyTableViewFilter();
        }
      });
  }

  private setupFallbackTimeout(): void {
    // Fallback to prevent infinite loading if no data arrives within 3 seconds
    setTimeout(() => {
      if (this.loadingData) {
        this.fetchSpatialUnitsData();

        if (
          !this.spatialUnitStore.availableSpatialUnits ||
          this.spatialUnitStore.availableSpatialUnits.length === 0
        ) {
          this.loadingData = false;
        }
      }
    }, 3000);
  }

  displayEditButtons_spatialUnits(params: ICellRendererParams<SpatialUnitMetadata>): string {
    const data = params.data;
    let html = '<div class="btn-group btn-group-sm">';
    if (data && data.userPermissions) {
      // Edit Metadata Button
      html +=
        '<button id="btn_spatialUnit_editMetadata_' +
        data.spatialUnitId +
        '" class="btn btn-warning btn-sm spatialUnitEditMetadataBtn" type="button" title="Metadaten editieren" ' +
        (data.userPermissions.includes('editor') ? '' : 'disabled') +
        '><i class="fas fa-pencil-alt"></i></button>';

      // Edit Features Button
      html +=
        '<button id="btn_spatialUnit_editFeatures_' +
        data.spatialUnitId +
        '" class="btn btn-warning btn-sm spatialUnitEditFeaturesBtn" type="button" title="Features fortführen" ' +
        (data.userPermissions.includes('editor') ? '' : 'disabled') +
        '><i class="fas fa-draw-polygon"></i></button>';

      // Edit User Roles Button
      html +=
        '<button id="btn_spatialUnit_editUserRoles_' +
        data.spatialUnitId +
        '" class="btn btn-warning btn-sm spatialUnitEditUserRolesBtn" type="button" title="Zugriffsschutz und Eigentümerschaft editieren" ' +
        (data.userPermissions.includes('creator') ? '' : 'disabled') +
        '><i class="fas fa-user-lock"></i></button>';

      // Delete Button
      html +=
        '<button id="btn_spatialUnit_deleteSpatialUnit_' +
        data.spatialUnitId +
        '" class="btn btn-danger btn-sm spatialUnitDeleteBtn" type="button" title="Raumebene entfernen" ' +
        (data.userPermissions.includes('creator') ? '' : 'disabled') +
        '><i class="fas fa-trash"></i></button>';

      html += '</div>';
    }
    return html;
  }

  /**
   * Opens the matching modal when one of the edit/delete buttons rendered by
   * `displayEditButtons_spatialUnits` is clicked. The buttons are plain HTML in
   * a string cell renderer, so we dispatch on the clicked button's CSS class via
   * AG Grid's cell-click event instead of Angular click bindings.
   */
  private onEditButtonsCellClicked(event: CellClickedEvent<SpatialUnitMetadata>): void {
    const target = event.event?.target as HTMLElement | null;
    const button = target?.closest('button');
    const data = event.data;
    if (!button || button.disabled || !data) {
      return;
    }

    if (button.classList.contains('spatialUnitEditMetadataBtn')) {
      this.onClickEditMetadata(data);
    } else if (button.classList.contains('spatialUnitEditFeaturesBtn')) {
      this.onClickEditFeatures(data);
    } else if (button.classList.contains('spatialUnitEditUserRolesBtn')) {
      this.onClickEditUserRoles(data);
    } else if (button.classList.contains('spatialUnitDeleteBtn')) {
      this.onClickDeleteSpatialUnits([data]);
    }
  }

  private setupEventListeners(): void {
    // React to metadata loading state transitions. skip(1) drops the
    // BehaviorSubject's replayed current value so this keeps the original
    // one-shot semantics of the former broadcast event.
    this.metadataBootstrap.metadataLoading$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state === MetadataLoadingState.COMPLETE) {
          this.zone.run(() => {
            this.fetchSpatialUnitsData();
          });
        }
      });
  }

  /**
   * Refresh the overview table after a modal reported a CRUD change. Wired to
   * each modal's `refreshRequested` output at open time — this replaces the
   * former `RefreshSpatialUnitOverviewTable` broadcast, which routed a plain
   * modal -> parent notification needlessly through the global event bus.
   */
  private handleRefreshRequest(request: SpatialUnitRefreshRequest): void {
    this.loadingData = true;
    this.refreshSpatialUnitOverviewTable(request.crudType, request.targetSpatialUnitId);
  }

  /**
   * Fetch spatial units data from the service
   */
  private fetchSpatialUnitsData(): void {
    const currentRoles = this.accessControlService.currentKeycloakLoginRoles || [];

    this.loadingData = true;
    this.metadataBootstrap
      .fetchSpatialUnitsMetadata(currentRoles)
      // The data itself arrives via the store subscription in ngOnInit
      .catch(() => {
        this.notificationService.showError('Die Raumebenen konnten nicht geladen werden.');
      })
      .finally(() => {
        this.loadingData = false;
      });
  }

  public initializeOrRefreshOverviewTable(): void {
    this.fetchSpatialUnitsData();
  }

  // Table view switcher: toggles between all datasets and only those the
  // current user may edit.
  onTableViewSwitch(): void {
    this.applyTableViewFilter();
  }

  private applyTableViewFilter(): void {
    this.rowData.set(
      this.tableViewSwitcher
        ? this.allSpatialUnits.filter((su) => su.userPermissions?.includes('editor'))
        : this.allSpatialUnits
    );
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

    modalRef.componentInstance.refreshRequested.subscribe((request: SpatialUnitRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    // The table refresh is driven by the modal's refreshRequested output, so
    // the result promise only needs its rejection swallowed on dismiss.
    modalRef.result.catch(() => {
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
    modalRef.componentInstance.refreshRequested.subscribe((request: SpatialUnitRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    // The table refresh is driven by the modal's refreshRequested output, so
    // the result promise only needs its rejection swallowed on dismiss.
    modalRef.result.catch(() => {
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
    modalRef.componentInstance.refreshRequested.subscribe((request: SpatialUnitRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    // The table refresh is driven by the modal's refreshRequested output, so
    // the result promise only needs its rejection swallowed on dismiss.
    modalRef.result.catch(() => {
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
    modalRef.componentInstance.refreshRequested.subscribe((request: SpatialUnitRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    // The table refresh is driven by the modal's refreshRequested output, so
    // the result promise only needs its rejection swallowed on dismiss.
    modalRef.result.catch(() => {
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
    modalRef.componentInstance.refreshRequested.subscribe((request: SpatialUnitRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    // The table refresh is driven by the modal's refreshRequested output, so
    // the result promise only needs its rejection swallowed on dismiss.
    modalRef.result.catch(() => {
      // Modal dismissed
    });
  }

  // Utility methods
  checkCreatePermission(): boolean {
    return this.accessControlService.checkCreatePermission();
  }

  refreshSpatialUnitOverviewTable(
    crudType?: string,
    targetSpatialUnitId?: string | string[]
  ): void {
    if (!crudType || !targetSpatialUnitId) {
      // Refetch all metadata from spatial units to update table
      this.fetchSpatialUnitsData();
    } else if (crudType && targetSpatialUnitId) {
      if (crudType === 'edit') {
        // Fetch single spatial unit metadata and update the table
        this.cacheHelperService
          .fetchSingleSpatialUnitMetadata(targetSpatialUnitId as string)
          .then((data) => {
            this.spatialUnitStore.replaceSingleSpatialUnitMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.loadingData = false;
          })
          .catch(() => {
            this.loadingData = false;
          });
      } else if (crudType === 'add') {
        // Fetch single spatial unit metadata and add to table
        this.cacheHelperService
          .fetchSingleSpatialUnitMetadata(targetSpatialUnitId as string)
          .then((data) => {
            this.spatialUnitStore.addSingleSpatialUnitMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.loadingData = false;
          })
          .catch(() => {
            this.loadingData = false;
          });
      } else if (crudType === 'delete') {
        // Handle delete operation
        if (typeof targetSpatialUnitId === 'string') {
          this.spatialUnitStore.deleteSingleSpatialUnitMetadata(targetSpatialUnitId);
        } else if (Array.isArray(targetSpatialUnitId)) {
          for (const id of targetSpatialUnitId) {
            this.spatialUnitStore.deleteSingleSpatialUnitMetadata(id);
          }
        }
        this.initializeOrRefreshOverviewTable();
        this.loadingData = false;
      }
    }
  }
}
