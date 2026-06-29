import { AfterViewInit, Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { WmsDataset, WmsResourceType } from 'components/ngComponents/models/services.models';
import { Subscription, skip } from 'rxjs';
import { OgcDataGridHelperServiceFactory } from 'services/adminOgcServices/ogc-data-grid-helper-factory.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { WmsAddModalComponent } from './wms-add-modal/wms-add-modal.component';
import { WmsEditModalComponent } from './wms-edit-modal/wms-edit-modal.component';
import { WmsEditUserRolesModalComponent } from './wms-edit-user-roles-modal/wms-edit-user-roles-modal.component';
import { WmsDeleteModalComponent } from './wms-delete-modal/wms-delete-modal.component';
import { WmsSharedComponentsService } from './wms-admin-tables-shared.service';
import { ExpandableBoxComponent } from '../expandable-box/expandable-box.component';

@Component({
  selector: 'app-wms-admin-table',
  templateUrl: './wms-admin-table.component.html',
  styleUrls: ['./wms-admin-table.component.scss'],
  imports: [ExpandableBoxComponent, AgGridAngular],
  standalone: true,
})
export class WmsAdminTableComponent implements OnInit, AfterViewInit {
  private ogcDataGridHelperServiceFactory = inject(OgcDataGridHelperServiceFactory);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private accessControlService = inject(AccessControlService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private broadcastService = inject(BroadcastService);
  private modalService = inject(NgbModal);
  private wmsSharedComponentsService = inject(WmsSharedComponentsService);

  @ViewChild('wmsGrid', { static: false }) wmsGrid!: AgGridAngular;
  @Input() resourceType!: WmsResourceType;
  @Input() tableViewSwitcher: boolean = false;

  public wmsGridOptions: any = {};

  private subscriptions: Subscription[] = [];

  ogcDataGridHelperService;

  constructor() {
    this.ogcDataGridHelperService = this.ogcDataGridHelperServiceFactory.create();
  }

  ngOnInit(): void {
    this.wmsGridOptions = this.ogcDataGridHelperService.getWmsGridOptions();

    // React to metadata loading state transitions. skip(1) drops the
    // BehaviorSubject's replayed current value so this keeps the original
    // one-shot semantics of the former broadcast event.
    const loadingSub = this.metadataBootstrap.metadataLoading$.pipe(skip(1)).subscribe((state) => {
      if (state === MetadataLoadingState.COMPLETE) {
        setTimeout(() => {
          this.initializeOrRefreshOverviewTable();
        }, 250);
      }
    });
    this.subscriptions.push(loadingSub);

    // Listen for broadcast messages
    const broadcastSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === BroadcastMessage.RefreshGeoresourceOverviewTable) {
        //this.refreshGeoresourceOverviewTable(data.values.crudType, data.values.targetGeoresourceId);
      }
    });

    this.subscriptions.push(broadcastSub);

    // listen to addOpen calls from indicator/georesources overview components (+ erstellen - buttons)
    this.wmsSharedComponentsService.onOpenAddModal().subscribe((resourceType: WmsResourceType) => {
      this.openAddModal(resourceType);
    });
  }

  initializeOrRefreshOverviewTable() {
    this.metadataBootstrap.reinitServices().then(() => {
      const wmsDatasets = this.initOgcDatasets();
      this.ogcDataGridHelperService.buildDataGrid_wms(wmsDatasets);
    });
  }

  private initOgcDatasets(): WmsDataset[] {
    let filteredReturn: WmsDataset[] = [];

    if (this.tableViewSwitcher) {
      filteredReturn = this.georesourceStore.availableWmsDatasets.filter(
        (e: any) => !(e.userPermissions.length === 1 && e.userPermissions.includes('viewer'))
      );
    } else {
      filteredReturn = this.georesourceStore.availableWmsDatasets;
    }

    return filteredReturn.filter((e) => e.serviceResource == this.resourceType);
  }

  ngAfterViewInit(): void {
    this.ogcDataGridHelperService.initializeGrids(this.wmsGrid);

    this.ogcDataGridHelperService.setComponentRef(this);
  }

  checkCreatePermission(): boolean {
    return this.accessControlService.checkCreatePermission();
  }

  checkEditorPermission(): boolean {
    return this.accessControlService.checkEditorPermission();
  }

  checkDeletePermission(): boolean {
    return this.accessControlService.checkDeletePermission();
  }

  public openAddModal(resourceType: WmsResourceType) {
    // check whether the requested modal type matches the actual component
    // otherwise both add modals (geores. / indi.) will open, as both tables exist
    if (resourceType == this.resourceType) {
      const modalRef = this.modalService.open(WmsAddModalComponent, {
        backdrop: true,
        keyboard: false,
        container: 'body',
        animation: false,
        modalDialogClass: 'modal-medium',
        windowClass: 'modal-medium',
      });

      modalRef.componentInstance.resourceType = resourceType;

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
  }

  onClickEditMetadata(wmsMetadata: any): void {
    const modalRef = this.modalService.open(WmsEditModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-medium',
      windowClass: 'modal-medium',
    });

    modalRef.componentInstance.currentGeoresourceDataset = wmsMetadata;
    modalRef.componentInstance.reInit();

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

  onClickEditUserRoles(wmsMetadata: any): void {
    const modalRef = this.modalService.open(WmsEditUserRolesModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-medium',
      windowClass: 'modal-medium',
    });

    modalRef.componentInstance.currentGeoresourceDataset = wmsMetadata;
    modalRef.componentInstance.reInit();

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

  onClickDelete(wmsMetadata: any[]): void {
    const modalRef = this.modalService.open(WmsDeleteModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-medium',
      windowClass: 'modal-medium',
    });

    modalRef.componentInstance.datasetToDelete = wmsMetadata;

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
}
