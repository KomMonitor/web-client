import { GeoresourcesDataset } from './../../models/georesources.models';
import { GeoresourceRefreshRequest } from './georesource-refresh.model';
import { WmsResourceType } from './../../models/services.models';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Subscription } from 'rxjs';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from '../../../../services/broadcast-service/broadcast.service';
import { BroadcastMessage } from '../../../../services/broadcast-service/broadcast-message';
import { KommonitorGeoresourceDataExchangeService } from '../../../../services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from '../../../../services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, ICellRendererParams } from 'ag-grid-community';
import { GeoresourceAddModalComponent } from './georesourceAddModal/georesource-add-modal.component';
import { GeoresourceEditMetadataModalComponent } from './georesourceEditMetadataModal/georesource-edit-metadata-modal.component';
import { GeoresourceEditFeaturesModalComponent } from './georesourceEditFeaturesModal/georesource-edit-features-modal.component';
import { GeoresourceEditUserRolesModalComponent } from './georesourceEditUserRolesModal/georesource-edit-user-roles-modal.component';
import { GeoresourceDeleteModalComponent } from './georesourceDeleteModal/georesource-delete-modal.component';
import { WmsSharedComponentsService } from 'components/ngComponents/admin/adminShared/wms-admin-table/wms-admin-tables-shared.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { WmsAdminTableComponent } from '../adminShared/wms-admin-table/wms-admin-table.component';
import { FormsModule } from '@angular/forms';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-admin-georesources-management',
  templateUrl: './admin-georesources-management.component.html',
  styleUrls: ['./admin-georesources-management.component.scss'],
  imports: [
    ExpandableBoxComponent,
    AgGridAngular,
    WmsAdminTableComponent,
    FormsModule,
    AdminContentViewComponent,
    NgbDropdownModule,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminGeoresourcesManagementComponent implements OnInit, OnDestroy {
  private modalService = inject(NgbModal);
  private broadcastService = inject(BroadcastService);
  kommonitorDataExchangeService = inject(KommonitorGeoresourceDataExchangeService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private kommonitorDataGridHelperService = inject(KommonitorGeoresourceDataGridHelperService);
  protected wmsSharedComponentsService = inject(WmsSharedComponentsService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  public tableViewSwitcher = signal(false);

  // Row data derived reactively from the signal-backed georesource store: any
  // store mutation (full refetch, single add/replace/delete, view switch)
  // re-renders the grids without imperative rebuild calls or timing hacks.
  private visibleGeoresources = computed(() => {
    const georesources = this.kommonitorDataExchangeService.availableGeoresources;
    if (!this.tableViewSwitcher()) {
      return georesources;
    }
    return georesources.filter(
      (e) => !(e.userPermissions?.length === 1 && e.userPermissions.includes('viewer'))
    );
  });
  poiRowData = computed(() => this.visibleGeoresources().filter((item) => item.isPOI));
  loiRowData = computed(() => this.visibleGeoresources().filter((item) => item.isLOI));
  aoiRowData = computed(() => this.visibleGeoresources().filter((item) => item.isAOI));

  // Assigned in ngOnInit rather than here: the headers resolve through
  // translate.instant().
  poiColumnDefs: ColDef[] = [];
  loiColumnDefs: ColDef[] = [];
  aoiColumnDefs: ColDef[] = [];

  public defaultColDef: ColDef = {
    editable: false,
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    wrapText: true,
    autoHeight: true,
  };
  public paginationPageSizeSelector: number[] = [10, 25, 50, 100];

  private subscriptions: Subscription[] = [];

  WmsResourceType = WmsResourceType;

  resourceType: WmsResourceType = WmsResourceType.GEORESOURCE;

  ngOnInit(): void {
    this.poiColumnDefs = this.buildColumnDefs('poi');
    this.loiColumnDefs = this.buildColumnDefs('loi');
    this.aoiColumnDefs = this.buildColumnDefs('aoi');
    // The admin modals report changes via their refreshRequested outputs; this
    // broadcast listener remains only for external senders (wms-admin-table).
    const broadcastSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === BroadcastMessage.RefreshGeoresourceOverviewTable) {
        this.refreshGeoresourceOverviewTable(data.values.crudType, data.values.targetGeoresourceId);
      }
    });
    this.subscriptions.push(broadcastSub);

    // The route-level bootstrap normally provides the metadata; refetch only
    // when the store is still empty (e.g. deep link with a failed bootstrap).
    if (this.kommonitorDataExchangeService.availableGeoresources.length === 0) {
      this.kommonitorDataExchangeService
        .fetchGeoresourcesMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles)
        .catch(() => {
          this.notificationService.showError(
            this.translate.instant('ADMIN_GEORESOURCES.MSG.LOAD_LIST_FAILED')
          );
        });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private buildColumnDefs(type: 'poi' | 'loi' | 'aoi'): ColDef[] {
    return [
      this.buildEditButtonsColumn(),
      ...this.kommonitorDataGridHelperService.buildGeoresourceColumnDefs(type),
    ];
  }

  /**
   * Edit/delete buttons rendered as plain HTML in a string cell renderer; the
   * clicks are dispatched on the clicked button's CSS class via AG Grid's
   * cell-click event (same pattern as the spatial-units overview) — no DOM
   * listener registration or setTimeout re-registration needed.
   */
  private buildEditButtonsColumn(): ColDef {
    return {
      headerName: this.translate.instant('ADMIN_SHARED.EDIT_FUNCTIONS'),
      pinned: 'left',
      maxWidth: 200,
      minWidth: 180,
      filter: false,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<GeoresourcesDataset>) =>
        this.displayEditButtons(params),
      onCellClicked: (event: CellClickedEvent<GeoresourcesDataset>) =>
        this.onEditButtonsCellClicked(event),
    };
  }

  private displayEditButtons(params: ICellRendererParams<GeoresourcesDataset>): string {
    const data = params.data;
    if (!data || !data.georesourceId) {
      return '';
    }

    const userPermissions = data.userPermissions || [];
    const hasEditorPermission =
      userPermissions.includes('editor') || userPermissions.includes('creator');
    const hasCreatorPermission = userPermissions.includes('creator');

    let html = '<div class="btn-group btn-group-sm">';
    html +=
      '<button class="btn btn-warning btn-sm georesourceEditMetadataBtn" type="button" title="' +
      this.translate.instant('ADMIN_SHARED_UI.GRID.EDIT_METADATA_TITLE') +
      '" ' +
      (hasEditorPermission ? '' : 'disabled') +
      '><i class="fas fa-pencil-alt"></i></button>';
    html +=
      '<button class="btn btn-warning btn-sm georesourceEditFeaturesBtn" type="button" title="' +
      this.translate.instant('ADMIN_SHARED.EDIT_FEATURES') +
      '" ' +
      (hasEditorPermission ? '' : 'disabled') +
      '><i class="fas fa-draw-polygon"></i></button>';
    html +=
      '<button class="btn btn-warning btn-sm georesourceEditUserRolesBtn" type="button" title="' +
      this.translate.instant('ADMIN_SHARED_UI.GRID.EDIT_ACCESS_TITLE') +
      '" ' +
      (hasCreatorPermission ? '' : 'disabled') +
      '><i class="fas fa-user-lock"></i></button>';
    html +=
      '<button class="btn btn-danger btn-sm georesourceDeleteBtn" type="button" title="' +
      this.translate.instant('ADMIN_GEORESOURCES.GRID.DELETE_TITLE') +
      '" ' +
      (hasCreatorPermission ? '' : 'disabled') +
      '><i class="fas fa-trash"></i></button>';
    html += '</div>';

    return html;
  }

  private onEditButtonsCellClicked(event: CellClickedEvent<GeoresourcesDataset>): void {
    const target = event.event?.target as HTMLElement | null;
    const button = target?.closest('button');
    const data = event.data;
    if (!button || button.disabled || !data) {
      return;
    }

    if (button.classList.contains('georesourceEditMetadataBtn')) {
      this.onClickEditMetadata(data);
    } else if (button.classList.contains('georesourceEditFeaturesBtn')) {
      this.onClickEditFeatures(data);
    } else if (button.classList.contains('georesourceEditUserRolesBtn')) {
      this.onClickEditUserRoles(data);
    } else if (button.classList.contains('georesourceDeleteBtn')) {
      this.onClickDeleteGeoresource(data);
    }
  }

  public refreshGeoresourceOverviewTable(crudType?: string, targetGeoresourceId?: string): void {
    // The grids update reactively via the store-backed computed row data;
    // this only has to bring the store up to date.
    if (!crudType || !targetGeoresourceId) {
      // refetch all metadata from georesources to update table
      this.kommonitorDataExchangeService
        .fetchGeoresourcesMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles)
        .catch(() => {
          this.notificationService.showError(
            this.translate.instant('ADMIN_GEORESOURCES.MSG.LOAD_LIST_FAILED')
          );
        });
    } else if (crudType === 'add' || crudType === 'edit') {
      this.cacheHelperService
        .fetchSingleGeoresourceMetadata(targetGeoresourceId)
        .then((data) => {
          if (crudType === 'add') {
            this.kommonitorDataExchangeService.addSingleGeoresourceMetadata(data);
          } else {
            this.kommonitorDataExchangeService.replaceSingleGeoresourceMetadata(data);
          }
        })
        .catch(() => {
          this.notificationService.showError(
            this.translate.instant('ADMIN_GEORESOURCES.MSG.LOAD_ONE_FAILED')
          );
        });
    } else if (crudType === 'delete') {
      // targetGeoresourceId might be array in this case
      const ids = Array.isArray(targetGeoresourceId) ? targetGeoresourceId : [targetGeoresourceId];
      for (const id of ids) {
        this.kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(id);
      }
    }
  }

  /**
   * Handles a refresh request emitted by one of the CRUD modals. Subscribed on
   * each modal's `refreshRequested` output at open time — this replaces the
   * former RefreshGeoresourceOverviewTable broadcast round-trip.
   */
  private handleRefreshRequest(request: GeoresourceRefreshRequest): void {
    this.refreshGeoresourceOverviewTable(request.crudType, request.targetGeoresourceId as any);
  }

  // Modal event handlers
  onClickAddGeoresource(): void {
    const modalRef = this.modalService.open(GeoresourceAddModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false,
    });

    modalRef.componentInstance.refreshRequested.subscribe((request: GeoresourceRefreshRequest) =>
      this.handleRefreshRequest(request)
    );
  }

  public onClickEditMetadata(georesourceDataset: any): void {
    const modalRef = this.modalService.open(GeoresourceEditMetadataModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false,
    });

    // Pass the georesource dataset to the modal
    modalRef.componentInstance.currentGeoresourceDataset = georesourceDataset;
    modalRef.componentInstance.refreshRequested.subscribe((request: GeoresourceRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    // The table refresh is driven by the modal's refreshRequested output, so
    // the close result only needs to swallow the dismissal rejection.
    modalRef.result.catch(() => undefined);
  }

  public onClickEditFeatures(georesourceDataset: any): void {
    const modalRef = this.modalService.open(GeoresourceEditFeaturesModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false,
    });

    // Pass the georesource dataset to the modal
    modalRef.componentInstance.currentGeoresourceDataset = georesourceDataset;
    modalRef.componentInstance.refreshRequested.subscribe((request: GeoresourceRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    modalRef.result.catch(() => undefined);
  }

  public onClickEditUserRoles(georesourceDataset: any): void {
    const modalRef = this.modalService.open(GeoresourceEditUserRolesModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false,
    });
    modalRef.componentInstance.currentGeoresourceDataset = georesourceDataset;
    modalRef.componentInstance.refreshRequested.subscribe((request: GeoresourceRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    modalRef.result.catch(() => undefined);
  }

  public onClickDeleteGeoresource(georesourceDataset: any): void {
    const modalRef = this.modalService.open(GeoresourceDeleteModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false,
    });

    // Pass the georesource dataset directly to the modal (the former
    // OnDeleteGeoresources broadcast detour is gone)
    modalRef.componentInstance.datasetsToDelete = [georesourceDataset];
    modalRef.componentInstance.refreshRequested.subscribe((request: GeoresourceRefreshRequest) =>
      this.handleRefreshRequest(request)
    );

    modalRef.result.catch(() => undefined);
  }

  // Utility methods
  checkCreatePermission(): boolean {
    return this.kommonitorDataExchangeService.checkCreatePermission();
  }

  checkEditorPermission(): boolean {
    return this.kommonitorDataExchangeService.checkEditorPermission();
  }

  checkDeletePermission(): boolean {
    return this.kommonitorDataExchangeService.checkDeletePermission();
  }
}
