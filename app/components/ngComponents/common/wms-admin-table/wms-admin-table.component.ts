import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { WmsDataset, WmsResourceType } from 'components/ngComponents/models/services.models';
import { Subscription } from 'rxjs';
import { OgcDataGridHelperServiceFactory } from 'services/adminOgcServices/ogc-data-grid-helper-factory.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { WmsAddModalComponent } from './wms-add-modal/wms-add-modal.component';
import { WmsEditModalComponent } from './wms-edit-modal/wms-edit-modal.component';
import { WmsEditUserRolesModalComponent } from './wms-edit-user-roles-modal/wms-edit-user-roles-modal.component';
import { WmsDeleteModalComponent } from './wms-delete-modal/wms-delete-modal.component';
import { WmsSharedComponentsService } from './wms-admin-tables-shared.service';
import { ExpandableBoxComponent } from "../expandable-box/expandable-box.component";

@Component({
  selector: 'app-wms-admin-table',
  templateUrl: './wms-admin-table.component.html',
  styleUrls: ['./wms-admin-table.component.scss'],
  imports: [ExpandableBoxComponent, AgGridAngular],
  standalone: true,
})
export class WmsAdminTableComponent implements OnInit, AfterViewInit {

  @ViewChild('wmsGrid', { static: false }) wmsGrid!: AgGridAngular;
  @Input() resourceType!: WmsResourceType;
  @Input() tableViewSwitcher:boolean = false;

  public wmsGridOptions: any = {};
  
  private subscriptions: Subscription[] = [];

  ogcDataGridHelperService;

  constructor(
    private ogcDataGridHelperServiceFactory: OgcDataGridHelperServiceFactory,
    private dataExchangeService: DataExchangeService,
    private georesourceStore: GeoresourceMetadataStoreService,
    private broadcastService: BroadcastService,
    private modalService: NgbModal,
    private wmsSharedComponentsService: WmsSharedComponentsService
  ) {
    this.ogcDataGridHelperService = this.ogcDataGridHelperServiceFactory.create();
  }

  ngOnInit(): void {
    this.wmsGridOptions = this.ogcDataGridHelperService.getWmsGridOptions();

    // Listen for broadcast messages
    const broadcastSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'initialMetadataLoadingCompleted') {
        setTimeout(() => {
          this.initializeOrRefreshOverviewTable();
        }, 250);
      } else if (data.msg === 'refreshGeoresourceOverviewTable') {
        //this.refreshGeoresourceOverviewTable(data.values.crudType, data.values.targetGeoresourceId);
      }
    });

    this.subscriptions.push(broadcastSub);

    // listen to addOpen calls from indicator/georesources overview components (+ erstellen - buttons)
    this.wmsSharedComponentsService.onOpenAddModal().subscribe((resourceType:WmsResourceType) => {
      this.openAddModal(resourceType);
    })
  }

  initializeOrRefreshOverviewTable() {

    this.dataExchangeService.reinitServices().then(() => {
      const wmsDatasets = this.initOgcDatasets();
      this.ogcDataGridHelperService.buildDataGrid_wms(wmsDatasets);
    });
  }

  private initOgcDatasets(): WmsDataset[] {

    let filteredReturn:WmsDataset[] = [];

    if (this.tableViewSwitcher) {
      filteredReturn = this.georesourceStore.availableWmsDatasets.filter(
        (e: any) => !(e.userPermissions.length === 1 && e.userPermissions.includes('viewer'))
      );
    } else {
      filteredReturn = this.georesourceStore.availableWmsDatasets;
    }

    return filteredReturn.filter(e => e.serviceResource==this.resourceType);
  }
  

  ngAfterViewInit(): void {
    this.ogcDataGridHelperService.initializeGrids(
      this.wmsGrid
    );
    
    this.ogcDataGridHelperService.setComponentRef(this);
  }

  checkCreatePermission(): boolean {
    return this.dataExchangeService.checkCreatePermission();
  }

  checkEditorPermission(): boolean {
    return this.dataExchangeService.checkEditorPermission();
  }

  checkDeletePermission(): boolean {
    return this.dataExchangeService.checkDeletePermission();
  }

  public openAddModal(resourceType: WmsResourceType) {

    // check whether the requested modal type matches the actual component
    // otherwise both add modals (geores. / indi.) will open, as both tables exist
    if(resourceType==this.resourceType) {
      const modalRef = this.modalService.open(WmsAddModalComponent, {
        backdrop: true,
        keyboard: false,
        container: 'body',
        animation: false,
        modalDialogClass: 'modal-medium',
        windowClass: 'modal-medium'
      });

      modalRef.componentInstance.resourceType = resourceType;

      modalRef.result.then((result) => {
        if (result) {
          this.initializeOrRefreshOverviewTable();
        }
      }).catch(() => {
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
      windowClass: 'modal-medium'
    });
    
    modalRef.componentInstance.currentGeoresourceDataset = wmsMetadata;
    modalRef.componentInstance.reInit();
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
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
      windowClass: 'modal-medium'
    });
    
    modalRef.componentInstance.currentGeoresourceDataset = wmsMetadata;
    modalRef.componentInstance.reInit();
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      } 
    }).catch(() => {
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
      windowClass: 'modal-medium'
    });
    
    modalRef.componentInstance.datasetToDelete = wmsMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }
}
