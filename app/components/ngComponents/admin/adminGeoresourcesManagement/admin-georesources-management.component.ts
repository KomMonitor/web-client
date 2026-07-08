import { GeoresourcesDataset } from './../../models/georesources.models';
import { GeoresourceRefreshRequest } from './georesource-refresh.model';
import { WmsResourceType } from './../../models/services.models';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';

import { Subscription, skip } from 'rxjs';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from '../../../../services/broadcast-service/broadcast.service';
import { BroadcastMessage } from '../../../../services/broadcast-service/broadcast-message';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { KommonitorGeoresourceDataExchangeService } from '../../../../services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from '../../../../services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';
import { AgGridAngular } from 'ag-grid-angular';
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

// Declare jQuery for AdminLTE
declare const $: any;

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
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminGeoresourcesManagementComponent implements OnInit, OnDestroy, AfterViewInit {
  private document = inject<Document>(DOCUMENT);
  private modalService = inject(NgbModal);
  private broadcastService = inject(BroadcastService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  kommonitorDataExchangeService = inject(KommonitorGeoresourceDataExchangeService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private kommonitorDataGridHelperService = inject(KommonitorGeoresourceDataGridHelperService);
  protected wmsSharedComponentsService = inject(WmsSharedComponentsService);

  @ViewChild('poiGrid', { static: false }) poiGrid!: AgGridAngular;
  @ViewChild('loiGrid', { static: false }) loiGrid!: AgGridAngular;
  @ViewChild('aoiGrid', { static: false }) aoiGrid!: AgGridAngular;

  public loadingData: boolean = true;
  public tableViewSwitcher: boolean = false;

  // Grid options for each table
  public poiGridOptions: any = {};
  public loiGridOptions: any = {};
  public aoiGridOptions: any = {};

  private subscriptions: Subscription[] = [];

  WmsResourceType = WmsResourceType;

  resourceType: WmsResourceType = WmsResourceType.GEORESOURCE;

  ngOnInit(): void {
    this.setupEventListeners();
    this.initialize();

    // Initialize grid options with the service
    this.poiGridOptions = this.kommonitorDataGridHelperService.getPoiGridOptions();
    this.loiGridOptions = this.kommonitorDataGridHelperService.getLoiGridOptions();
    this.aoiGridOptions = this.kommonitorDataGridHelperService.getAoiGridOptions();
  }

  ngAfterViewInit(): void {
    // Initialize grids after view is ready
    this.kommonitorDataGridHelperService.initializeGrids(this.poiGrid, this.loiGrid, this.aoiGrid);

    // Set component reference for callbacks
    this.kommonitorDataGridHelperService.setComponentRef(this);

    // Load data if not already loaded
    if (this.kommonitorDataExchangeService.availableGeoresources.length === 0) {
      this.loadDataFallback();
    }
  }

  private loadDataFallback(): void {
    // If we still don't have data after 1 second, try to manually trigger data loading
    if (
      !this.kommonitorDataExchangeService.availableGeoresources ||
      this.kommonitorDataExchangeService.availableGeoresources.length === 0
    ) {
      // Try to fetch metadata manually
      this.kommonitorDataExchangeService
        .fetchGeoresourcesMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles)
        .then((_response: any) => {
          this.initializeOrRefreshOverviewTable();
        })
        .catch((_error: any) => {
          // As a last resort, try with test data to verify grids are working
          this.testGridsWithSampleData();

          this.loadingData = false;
        });
    }
  }

  private testGridsWithSampleData(): void {
    // Debug-only sample rows; deliberately partial/invalid objects (hex colors
    // instead of the API color names), hence the unchecked cast below
    const testData = [
      {
        georesourceId: 'test-poi-1',
        datasetName: 'Test POI 1',
        isPOI: true,
        isLOI: false,
        isAOI: false,
        poiSymbolColor: '#ff0000',
        poiSymbolBootstrap3Name: 'home',
        poiMarkerColor: '#0000ff',
        metadata: {
          description: 'Test POI description',
        },
        ownerId: 'test-owner',
        userPermissions: ['creator'],
      },
      {
        georesourceId: 'test-loi-1',
        datasetName: 'Test LOI 1',
        isPOI: false,
        isLOI: true,
        isAOI: false,
        loiColor: '#00ff00',
        loiWidth: 2,
        loiDashArrayString: '5 5',
        metadata: {
          description: 'Test LOI description',
        },
        ownerId: 'test-owner',
        userPermissions: ['creator'],
      },
      {
        georesourceId: 'test-aoi-1',
        datasetName: 'Test AOI 1',
        isPOI: false,
        isLOI: false,
        isAOI: true,
        aoiColor: '#ffff00',
        metadata: {
          description: 'Test AOI description',
        },
        ownerId: 'test-owner',
        userPermissions: ['creator'],
      },
    ];

    this.kommonitorDataGridHelperService.buildDataGrid_georesources(
      testData as unknown as GeoresourcesDataset[]
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // React to metadata loading state transitions. skip(1) drops the
    // BehaviorSubject's replayed current value so this keeps the original
    // one-shot semantics of the former broadcast events.
    const loadingSub = this.metadataBootstrap.metadataLoading$.pipe(skip(1)).subscribe((state) => {
      if (state === MetadataLoadingState.COMPLETE) {
        setTimeout(() => {
          this.initializeOrRefreshOverviewTable();
        }, 250);
      } else if (state === MetadataLoadingState.ERROR) {
        this.loadingData = false;
      }
    });
    this.subscriptions.push(loadingSub);

    // The admin modals report changes via their refreshRequested outputs; this
    // broadcast listener remains only for external senders (wms-admin-table).
    const broadcastSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === BroadcastMessage.RefreshGeoresourceOverviewTable) {
        this.loadingData = true;
        this.refreshGeoresourceOverviewTable(data.values.crudType, data.values.targetGeoresourceId);
      }
    });

    this.subscriptions.push(broadcastSub);
  }

  private initialize(): void {
    // Initialize any adminLTE box widgets
    if (typeof $ !== 'undefined' && $ && $.fn && $.fn.boxWidget) {
      $('.box').boxWidget();
    }
  }

  public onTableViewSwitch(): void {
    this.initializeOrRefreshOverviewTable();
  }

  public initializeOrRefreshOverviewTable(): void {
    this.loadingData = true;

    const georesources = this.initGeoresources();

    this.kommonitorDataGridHelperService.buildDataGrid_georesources(georesources);

    setTimeout(() => {
      this.loadingData = false;
    }, 100);
  }

  private initGeoresources(): any[] {
    if (this.tableViewSwitcher) {
      return this.kommonitorDataExchangeService.availableGeoresources.filter(
        (e: any) => !(e.userPermissions.length === 1 && e.userPermissions.includes('viewer'))
      );
    } else {
      return this.kommonitorDataExchangeService.availableGeoresources;
    }
  }

  public refreshGeoresourceOverviewTable(crudType?: string, targetGeoresourceId?: string): void {
    if (!crudType || !targetGeoresourceId) {
      // refetch all metadata from georesources to update table
      this.kommonitorDataExchangeService
        .fetchGeoresourcesMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles)
        .then((_response: any) => {
          this.initializeOrRefreshOverviewTable();
          this.loadingData = false;
        })
        .catch((_response: any) => {
          this.loadingData = false;
        });
    } else if (crudType && targetGeoresourceId) {
      if (crudType === 'add') {
        this.cacheHelperService
          .fetchSingleGeoresourceMetadata(targetGeoresourceId)
          .then((data) => {
            this.kommonitorDataExchangeService.addSingleGeoresourceMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.loadingData = false;
          })
          .catch((_response: any) => {
            this.loadingData = false;
          });
      } else if (crudType === 'edit') {
        this.cacheHelperService
          .fetchSingleGeoresourceMetadata(targetGeoresourceId)
          .then((data) => {
            this.kommonitorDataExchangeService.replaceSingleGeoresourceMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.loadingData = false;
          })
          .catch((_response: any) => {
            this.loadingData = false;
          });
      } else if (crudType === 'delete') {
        // targetGeoresourceId might be array in this case
        if (targetGeoresourceId && typeof targetGeoresourceId === 'string') {
          this.kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(targetGeoresourceId);
          this.initializeOrRefreshOverviewTable();
          this.loadingData = false;
        } else if (targetGeoresourceId && Array.isArray(targetGeoresourceId)) {
          for (const id of targetGeoresourceId) {
            this.kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(id);
          }
          this.initializeOrRefreshOverviewTable();
          this.loadingData = false;
        }
      }
    }
  }

  /**
   * Handles a refresh request emitted by one of the CRUD modals. Subscribed on
   * each modal's `refreshRequested` output at open time — this replaces the
   * former RefreshGeoresourceOverviewTable broadcast round-trip.
   */
  private handleRefreshRequest(request: GeoresourceRefreshRequest): void {
    this.loadingData = true;
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
