import { Injectable, Inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from '../broadcast-service/broadcast.service';
import { KommonitorGeoresourceDataExchangeService } from './kommonitor-data-exchange.service';
import { 
  GridOptions, 
  ColDef, 
  GridApi, 
  ColumnApi,
  ICellRendererParams,
  ICellRendererComp,
  GridReadyEvent
} from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

// Declare environment variables
declare const __env: any;

@Injectable({
  providedIn: 'root'
})
export class KommonitorGeoresourceDataGridHelperService {

  // Store the data grid options
  private dataGridOptions_georesources_poi: GridOptions | null = null;
  private dataGridOptions_georesources_loi: GridOptions | null = null;
  private dataGridOptions_georesources_aoi: GridOptions | null = null;
  private gridApi_georesources_poi: GridApi | null = null;
  private gridApi_georesources_loi: GridApi | null = null;
  private gridApi_georesources_aoi: GridApi | null = null;

  // Resource type constants
  readonly resourceType_georesource = 'georesource';

  // Timestamp properties for feature table updates
  featureTable_georesource_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_georesource_lastUpdate_timestamp_failure: Date | undefined = undefined;

  constructor(
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    private kommonitorDataExchangeService: KommonitorGeoresourceDataExchangeService,
    @Inject('kommonitorDataGridHelperService') private angularJsDataGridHelperService: any
  ) {}

  /**
   * Build data grid for georesources - delegates to AngularJS service
   */
  buildDataGrid_georesources(georesourcesArray: any[]): void {
    this.angularJsDataGridHelperService.buildDataGrid_georesources(georesourcesArray);
  }

  /**
   * Get selected georesources metadata - delegates to AngularJS service
   */
  getSelectedGeoresourcesMetadata(): any[] {
    return this.angularJsDataGridHelperService.getSelectedGeoresourcesMetadata() || [];
  }

  /**
   * Get current timestamp string - delegates to AngularJS service
   */
  getCurrentTimestampString(): string {
    return this.angularJsDataGridHelperService.getCurrentTimestampString();
  }
} 