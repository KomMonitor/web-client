import {
  ChangeDetectionStrategy,
  Component,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { WmsSharedComponentsService } from 'components/ngComponents/admin/adminShared/wms-admin-table/wms-admin-tables-shared.service';
import { TranslateModule } from '@ngx-translate/core';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { WmsResourceType } from './../../models/services.models';

import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { WmsAdminTableComponent } from 'components/ngComponents/admin/adminShared/wms-admin-table/wms-admin-table.component';
import { skip, Subscription } from 'rxjs';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { AccessControlService } from '../../../../services/access-control-service/access-control.service';
import { IndicatorMetadataStoreService } from '../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { IndicatorRefreshRequest } from './indicator-refresh.model';
import { IndicatorAddModalComponent } from './indicatorAddModal/indicator-add-modal.component';
import { IndicatorBatchUpdateModalComponent } from './indicatorBatchUpdateModal/indicator-batch-update-modal.component';
import { IndicatorDeleteModalComponent } from './indicatorDeleteModal/indicator-delete-modal.component';
import { IndicatorEditFeaturesModalComponent } from './indicatorEditFeaturesModal/indicator-edit-features-modal.component';
import { IndicatorEditIndicatorSpatialUnitRolesModalComponent } from './indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.component';

@Component({
  selector: 'app-admin-indicators-management',
  templateUrl: './admin-indicators-management.component.html',
  styleUrls: ['./admin-indicators-management.component.scss'],
  imports: [
    TranslateModule,
    ExpandableBoxComponent,
    AgGridAngular,
    WmsAdminTableComponent,
    FormsModule,
    AdminContentViewComponent,
    NgbDropdownModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminIndicatorsManagementComponent implements OnInit, OnDestroy {
  private zone = inject(NgZone);
  private modalService = inject(NgbModal);
  private broadcastService = inject(BroadcastService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private kommonitorDataGridHelperService = inject(KommonitorIndicatorDataGridHelperService);
  protected wmsSharedComponentsService = inject(WmsSharedComponentsService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private accessControlService = inject(AccessControlService);
  private indicatorStore = inject(IndicatorMetadataStoreService);

  public tableViewSwitcher: boolean = false;

  // AG Grid properties — signals: reassigned from store/fetch callbacks and
  // bus subscriptions, which would not re-render this OnPush component otherwise.
  public columnDefs = signal<ColDef[]>([]);
  public rowData = signal<any[]>([]);
  public gridOptions: GridOptions = {};
  public selectedRows: any[] = [];

  resourceType: WmsResourceType = WmsResourceType.INDICATOR;

  private subscriptions: Subscription[] = [];

  WmsResourceType = WmsResourceType;

  async ngOnInit(): Promise<void> {
    // Grid options never depend on the data, so build them once up front —
    // before the grid is created — to guarantee its callbacks are wired.
    this.setupGridOptions();
    this.setupEventListeners();

    // Load metadata if the store is empty; the table renders from the store
    // either way. The metadataLoading$ subscription additionally covers the
    // case where the initial app-wide load finishes while this view is open.
    if (!this.indicatorStore.availableIndicators?.length) {
      try {
        await this.metadataBootstrap.fetchIndicatorsMetadata(
          this.accessControlService.currentKeycloakLoginRoles
        );
      } catch (error) {
        console.error('Error fetching indicators:', error);
      }
    }
    this.initializeOrRefreshOverviewTable();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // React to the app-wide metadata load completing while this view is open.
    // skip(1) drops the BehaviorSubject's replayed current value so this keeps
    // the original one-shot semantics of the former broadcast events.
    const loadingSub = this.metadataBootstrap.metadataLoading$.pipe(skip(1)).subscribe((state) => {
      if (state === MetadataLoadingState.COMPLETE) {
        this.zone.run(() => this.initializeOrRefreshOverviewTable());
      }
    });
    this.subscriptions.push(loadingSub);

    // Cross-area refresh: sibling admin areas (the script runner and the
    // spatial-unit metadata editor) still request a full indicator overview
    // refresh over the global bus. Modal-driven refreshes now come in through
    // each modal's refreshRequested output instead (see handleRefreshRequest).
    const refreshSub = this.broadcastService.currentBroadcastMsg.subscribe((data) => {
      if (data.msg === BroadcastMessage.RefreshIndicatorOverviewTable) {
        this.zone.run(() => this.refreshIndicatorOverviewTable());
      }
    });
    this.subscriptions.push(refreshSub);
  }

  /**
   * Opens the matching modal when one of the edit/delete buttons rendered by
   * `displayEditButtons_indicators` is clicked. The buttons are plain HTML in a
   * string cell renderer, so we dispatch on the clicked button's CSS class via
   * AG Grid's cell-click event instead of jQuery click bindings.
   */
  private onEditButtonsCellClicked(event: CellClickedEvent): void {
    const target = event.event?.target as HTMLElement | null;
    const button = target?.closest('button');
    const data = event.data;
    if (!button || button.disabled || !data) {
      return;
    }

    if (button.classList.contains('indicatorEditMetadataBtn')) {
      this.onClickEditMetadata(data);
    } else if (button.classList.contains('indicatorEditFeaturesBtn')) {
      this.onClickEditFeatures(data);
    } else if (button.classList.contains('indicatorEditRoleBasedAccessBtn')) {
      this.onClickEditIndicatorSpatialUnitRoles(data);
    } else if (button.classList.contains('indicatorDeleteBtn')) {
      this.openDeleteIndicatorModal(data);
    }
  }

  public initializeOrRefreshOverviewTable(): void {
    // columnDefs/rowData are bound as AG Grid inputs in the template, so
    // assigning them is enough — the grid reacts on its own. An empty array
    // simply renders an empty grid.
    const indicators = this.getFilteredIndicators();
    this.columnDefs.set(
      this.kommonitorDataGridHelperService.buildDataGridColumnConfig_indicators(indicators)
    );
    this.rowData.set(
      this.kommonitorDataGridHelperService.buildDataGridRowData_indicators(indicators)
    );
  }

  private setupGridOptions(): void {
    this.gridOptions = {
      defaultColDef: {
        editable: false,
        cellDataType: false,
        sortable: true,
        flex: 1,
        minWidth: 200,
        filter: true,
        floatingFilter: true,
        resizable: true,
        wrapText: true,
        autoHeight: true,
        cellStyle: {
          'font-size': '12px;',
          'white-space': 'normal !important',
          'line-height': '20px !important',
          'word-break': 'break-word !important',
          'padding-top': '17px',
          'padding-bottom': '17px',
        },
        headerComponentParams: {
          template:
            '<div class="ag-cell-label-container" role="presentation">' +
            '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
            '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
            '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
            '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
            '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
            '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
            '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
            '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
            '  </div>' +
            '</div>',
        },
      },
      components: {
        displayEditButtons_indicators:
          this.kommonitorDataGridHelperService.displayEditButtons_indicators,
      },
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 25, 50, 100],
      suppressColumnVirtualisation: true,
      rowSelection: 'multiple',
      suppressRowClickSelection: true,
      onCellClicked: (event: CellClickedEvent) => this.onEditButtonsCellClicked(event),
      onViewportChanged: () => {
        this.typesetMath();
      },
      onSelectionChanged: (event: SelectionChangedEvent) => {
        this.onSelectionChanged(event);
      },
    };
  }

  private typesetMath(): void {
    setTimeout(() => {
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        (window as any).MathJax.typesetPromise();
      }
    }, 250);
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    this.selectedRows = event.api.getSelectedRows();
  }

  private getFilteredIndicators(): any[] {
    const allIndicators = this.indicatorStore.availableIndicators ?? [];

    if (!this.tableViewSwitcher) {
      return allIndicators;
    }
    // Filter out indicators where the user only has viewer permission.
    return allIndicators.filter(
      (e) =>
        !(
          e.userPermissions &&
          e.userPermissions.length === 1 &&
          e.userPermissions.includes('viewer')
        )
    );
  }

  // Table view switcher method
  onTableViewSwitch(): void {
    // Filter the data based on the tableViewSwitcher state
    this.initializeOrRefreshOverviewTable();
  }

  // Alias for the add indicator modal (matching HTML template)
  openAddIndicatorModal(): void {
    this.onClickAddIndicator();
  }

  // Modal event handlers
  onClickAddIndicator(): void {
    try {
      const modalRef = this.modalService.open(IndicatorAddModalComponent, {
        backdrop: true,
        keyboard: false,
        container: 'body',
        animation: false,
        modalDialogClass: 'modal-large',
        windowClass: 'modal-large',
      });

      const modalComponent = modalRef.componentInstance as IndicatorAddModalComponent;
      modalComponent.refreshRequested.subscribe((request: IndicatorRefreshRequest) =>
        this.handleRefreshRequest(request)
      );

      modalRef.result.catch(() => {
        // Modal dismissed
      });
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  }

  onClickEditMetadata(indicatorMetadata: any): void {
    try {
      // Editing reuses the add wizard, pre-filled with the existing indicator's
      // values; on submit it sends a metadata PATCH instead of a POST.
      const modalRef = this.modalService.open(IndicatorAddModalComponent, {
        backdrop: true,
        keyboard: false,
        container: 'body',
        animation: false,
        modalDialogClass: 'modal-large',
        windowClass: 'modal-large',
      });

      const modalComponent = modalRef.componentInstance as IndicatorAddModalComponent;
      modalComponent.editIndicatorDataset = indicatorMetadata;
      modalComponent.refreshRequested.subscribe((request: IndicatorRefreshRequest) =>
        this.handleRefreshRequest(request)
      );

      modalRef.result.catch(() => {
        // Modal dismissed
      });
    } catch (error) {
      console.error('Error opening edit metadata modal:', error);
    }
  }

  onClickEditFeatures(indicatorMetadata: any): void {
    try {
      const modalRef = this.modalService.open(IndicatorEditFeaturesModalComponent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        container: 'body',
        animation: false,
      });

      const modalComponent = modalRef.componentInstance as IndicatorEditFeaturesModalComponent;
      modalComponent.openModal(indicatorMetadata);
      modalComponent.refreshRequested.subscribe((request: IndicatorRefreshRequest) =>
        this.handleRefreshRequest(request)
      );

      modalRef.result.catch(() => {
        // Modal dismissed
      });
    } catch (error) {
      console.error('Error opening edit features modal:', error);
    }
  }

  onClickEditIndicatorSpatialUnitRoles(indicatorMetadata: any): void {
    try {
      const modalRef = this.modalService.open(
        IndicatorEditIndicatorSpatialUnitRolesModalComponent,
        {
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
          container: 'body',
          animation: false,
        }
      );

      const modalComponent =
        modalRef.componentInstance as IndicatorEditIndicatorSpatialUnitRolesModalComponent;
      modalComponent.openModal(indicatorMetadata);
      modalComponent.refreshRequested.subscribe((request: IndicatorRefreshRequest) =>
        this.handleRefreshRequest(request)
      );

      modalRef.result.catch(() => {
        // Modal dismissed
      });
    } catch (error) {
      console.error('Error opening edit indicator spatial unit roles modal:', error);
    }
  }

  openDeleteIndicatorModal(indicatorDataset?: any): void {
    // Narrow modal: the selection controls stack vertically; the wide metadata
    // table scrolls horizontally within the full-width accordion.
    const modalRef = this.modalService.open(IndicatorDeleteModalComponent, {
      size: 'lg',
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
    });

    // Preselect the passed indicator (from a per-row trash button). The modal's
    // ngOnInit resets its form, so we hand the preselection over as an input it
    // re-applies after that reset instead of assigning it here (which would be
    // wiped). Set it directly too, to also cover a synchronous ngOnInit.
    const modalComponent = modalRef.componentInstance as IndicatorDeleteModalComponent;
    modalComponent.preselectedIndicatorDataset = indicatorDataset ?? null;
    if (indicatorDataset) {
      modalComponent.selectedIndicatorDataset = indicatorDataset;
      modalComponent.onChangeSelectedIndicator();
    }
    modalComponent.refreshRequested.subscribe((request: IndicatorRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    modalRef.result.catch(() => {
      // Delete modal dismissed
    });
  }

  onClickBatchUpdate(): void {
    try {
      const modalRef = this.modalService.open(IndicatorBatchUpdateModalComponent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        container: 'body',
        animation: false,
      });

      // Pass the modal reference to the component
      const modalComponent = modalRef.componentInstance as IndicatorBatchUpdateModalComponent;
      modalComponent.modalRef = modalRef;

      modalRef.result
        .then((result) => {
          if (result) {
            // Modal was closed successfully, re-render from the store.
            this.initializeOrRefreshOverviewTable();
          }
        })
        .catch((_error) => {
          // Modal dismissed
        });
    } catch (error) {
      console.error('Error opening batch update modal:', error);
    }
  }

  // Handles a modal's refreshRequested output; replaces the former
  // RefreshIndicatorOverviewTable broadcast round-trip.
  private handleRefreshRequest(request: IndicatorRefreshRequest): void {
    this.refreshIndicatorOverviewTable(request.crudType, request.targetIndicatorId);
  }

  refreshIndicatorOverviewTable(crudType?: string, targetIndicatorId?: string): void {
    const roles = this.accessControlService.currentKeycloakLoginRoles;

    // Re-render the table and notify open modals that the refresh finished.
    // The completed broadcast is consumed by the edit-features and batch-update
    // modals to refresh their own view — it must fire even on error.
    const complete = () => {
      this.initializeOrRefreshOverviewTable();
      this.broadcastService.broadcast(BroadcastMessage.RefreshIndicatorOverviewTableCompleted);
    };
    const notifyOnly = () =>
      this.broadcastService.broadcast(BroadcastMessage.RefreshIndicatorOverviewTableCompleted);

    // Targeted single-indicator updates avoid refetching the whole overview.
    if (crudType === 'delete' && targetIndicatorId) {
      this.indicatorStore.deleteSingleIndicatorMetadata(targetIndicatorId);
      complete();
      return;
    }

    if ((crudType === 'add' || crudType === 'edit') && targetIndicatorId) {
      this.cacheHelperService
        .fetchSingleIndicatorMetadata(targetIndicatorId)
        .then((data) => {
          if (crudType === 'add') {
            this.indicatorStore.addSingleIndicatorMetadata(data);
          } else {
            this.indicatorStore.replaceSingleIndicatorMetadata(data);
          }
          complete();
        })
        .catch(notifyOnly);
      return;
    }

    // Fallback: refetch all indicator metadata.
    this.metadataBootstrap.fetchIndicatorsMetadata(roles).then(complete).catch(notifyOnly);
  }

  // Utility methods
  checkCreatePermission(): boolean {
    return this.accessControlService.checkCreatePermission();
  }

  checkEditorPermission(): boolean {
    return this.accessControlService.checkEditorPermission();
  }

  checkDeletePermission(): boolean {
    return this.accessControlService.checkDeletePermission();
  }

  getSelectedIndicatorsMetadata(): any[] {
    return this.selectedRows;
  }
}
