import {
  ChangeDetectionStrategy,
  Component,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  OutputRef,
  signal,
} from '@angular/core';
import { WmsSharedComponentsService } from 'components/ngComponents/admin/adminShared/wms-admin-table/wms-admin-tables-shared.service';
import { TranslateModule } from '@ngx-translate/core';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { WmsResourceType } from './../../models/services.models';

import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, GridOptions } from 'ag-grid-community';
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
import { AdminModalService } from '../adminShared/modal/admin-modal.service';
import { IndicatorRefreshRequest } from './indicator-refresh.model';
import { IndicatorAddModalComponent } from './indicatorAddModal/indicator-add-modal.component';
import { IndicatorBatchUpdateModalComponent } from './indicatorBatchUpdateModal/indicator-batch-update-modal.component';
import { IndicatorDeleteModalComponent } from './indicatorDeleteModal/indicator-delete-modal.component';
import { IndicatorEditFeaturesModalComponent } from './indicatorEditFeaturesModal/indicator-edit-features-modal.component';
import { IndicatorEditIndicatorSpatialUnitRolesModalComponent } from './indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.component';
import { MODAL_CONFIRM, MODAL_WIDE } from 'util/modal-presets';

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
  private modals = inject(AdminModalService);
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
        // No `cellStyle`: it restated the global `.ag-cell` rule in app.scss
        // property for property, and its `'font-size': '12px;'` carried a
        // trailing semicolon inside the value, so the CSSOM dropped that one
        // declaration anyway. Cell typography lives in app.scss.
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
      onCellClicked: (event: CellClickedEvent) => this.onEditButtonsCellClicked(event),
      onViewportChanged: () => {
        this.typesetMath();
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
    this.modals.open(IndicatorAddModalComponent, MODAL_WIDE, this.forwardRefreshRequests);
  }

  onClickEditMetadata(indicatorMetadata: any): void {
    // Editing reuses the add wizard, pre-filled with the existing indicator's
    // values; on submit it sends a metadata PATCH instead of a POST.
    this.modals.open(IndicatorAddModalComponent, MODAL_WIDE, (modal) => {
      modal.editIndicatorDataset = indicatorMetadata;
      this.forwardRefreshRequests(modal);
    });
  }

  onClickEditFeatures(indicatorMetadata: any): void {
    this.modals.open(IndicatorEditFeaturesModalComponent, MODAL_WIDE, (modal) => {
      modal.openModal(indicatorMetadata);
      this.forwardRefreshRequests(modal);
    });
  }

  onClickEditIndicatorSpatialUnitRoles(indicatorMetadata: any): void {
    this.modals.open(IndicatorEditIndicatorSpatialUnitRolesModalComponent, MODAL_WIDE, (modal) => {
      modal.openModal(indicatorMetadata);
      this.forwardRefreshRequests(modal);
    });
  }

  openDeleteIndicatorModal(indicatorDataset?: any): void {
    // A confirmation, like the delete dialogs for spatial units and topics: the
    // selection controls stack vertically and the metadata summary scrolls
    // inside its own accordion, so this needs no more than the confirm width.
    this.modals.open(IndicatorDeleteModalComponent, MODAL_CONFIRM, (modal) => {
      // Preselect the passed indicator (from a per-row trash button). The modal's
      // ngOnInit resets its form, so we hand the preselection over as an input it
      // re-applies after that reset instead of assigning it here (which would be
      // wiped). Set it directly too, to also cover a synchronous ngOnInit.
      modal.preselectedIndicatorDataset = indicatorDataset ?? null;
      if (indicatorDataset) {
        modal.selectedIndicatorDataset = indicatorDataset;
        modal.onChangeSelectedIndicator();
      }
      this.forwardRefreshRequests(modal);
    });
  }

  async onClickBatchUpdate(): Promise<void> {
    const result = await this.modals.open(
      IndicatorBatchUpdateModalComponent,
      MODAL_WIDE,
      this.forwardRefreshRequests
    );
    if (result) {
      // Modal was closed successfully, re-render from the store.
      this.initializeOrRefreshOverviewTable();
    }
  }

  /** Subscribes the overview table to a CRUD modal's refreshRequested output. */
  private readonly forwardRefreshRequests = (modal: {
    refreshRequested: OutputRef<IndicatorRefreshRequest>;
  }): void => {
    modal.refreshRequested.subscribe((request) => this.handleRefreshRequest(request));
  };

  // Handles a modal's refreshRequested output; replaces the former
  // RefreshIndicatorOverviewTable broadcast round-trip.
  private handleRefreshRequest(request: IndicatorRefreshRequest): void {
    this.refreshIndicatorOverviewTable(request.crudType, request.targetIndicatorId);
  }

  refreshIndicatorOverviewTable(crudType?: string, targetIndicatorId?: string): void {
    const roles = this.accessControlService.currentKeycloakLoginRoles;

    // Re-render the table and notify open modals that the refresh finished.
    // The completed broadcast is consumed by the edit-features modal to refresh
    // its own view — it must fire even on error.
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
}
