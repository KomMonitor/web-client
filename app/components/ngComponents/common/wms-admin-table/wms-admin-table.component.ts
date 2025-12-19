import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { WmsDataset, WmsResourceType } from 'components/ngComponents/models/services.models';
import { Subscription } from 'rxjs';
import { OgcDataGridHelperServiceFactory } from 'services/adminOgcServices/ogc-data-grid-helper-factory.service';
import { OgcDataGridHelperService } from 'services/adminOgcServices/ogc-data-grid-helper.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Component({
  selector: 'app-wms-admin-table',
  templateUrl: './wms-admin-table.component.html',
  styleUrls: ['./wms-admin-table.component.css'],
  standalone: true,
  imports: [CommonModule, NgbCollapse, AgGridAngular]
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
    private broadcastService: BroadcastService
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
}
