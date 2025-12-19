import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { WmsDataset, WmsResourceType } from 'components/ngComponents/models/services.models';
import { Subscription } from 'rxjs';
import { OgcDataGridHelperServiceFactory } from 'services/adminOgcServices/ogc-data-grid-helper-factory.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { WmsAddModalComponent } from './wms-add-modal/wms-add-modal.component';

@Component({
  selector: 'app-wms-admin-table',
  templateUrl: './wms-admin-table.component.html',
  styleUrls: ['./wms-admin-table.component.css']
})
export class WmsAdminTableComponent implements OnInit, AfterViewInit {

  @ViewChild('wmsGrid', { static: false }) wmsGrid!: AgGridAngular;
  @Input() resourceType!: WmsResourceType;
  @Input() tableViewSwitcher:boolean = false;

  public wmsGridOptions: any = {};
  
  private subscriptions: Subscription[] = [];
  
  isIndicatorWmsOverviewCollapse:boolean = false;

  ogcDataGridHelperService;

  constructor(
    private ogcDataGridHelperServiceFactory: OgcDataGridHelperServiceFactory,
    private dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    private modalService: NgbModal
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
  }

  initializeOrRefreshOverviewTable() {

    const wmsDatasets = this.initOgcDatasets();
    this.ogcDataGridHelperService.buildDataGrid_wms(wmsDatasets);
  }

  private initOgcDatasets(): WmsDataset[] {

    let filteredReturn:WmsDataset[] = [];

    if (this.tableViewSwitcher) {
      filteredReturn = this.dataExchangeService.availableWmsDatasets.filter(
        (e: any) => !(e.userPermissions.length === 1 && e.userPermissions.includes('viewer'))
      );
    } else {
      filteredReturn = this.dataExchangeService.availableWmsDatasets;
    }

    return filteredReturn.filter(e => e.resourceType==this.resourceType);
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

  openAddModal() {
    const modalRef = this.modalService.open(WmsAddModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-medium',
      windowClass: 'modal-medium'
    });
  }
}
