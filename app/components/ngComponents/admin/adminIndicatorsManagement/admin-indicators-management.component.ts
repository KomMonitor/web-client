import { Component, Inject, OnInit, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridReadyEvent, RowNode, SelectionChangedEvent } from 'ag-grid-community';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';
import { KommonitorIndicatorCacheHelperService } from 'services/adminIndicatorUnit/kommonitor-cache-helper.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
declare const $: any;
declare const __env: any;

@Component({
  selector: 'admin-indicators-management-new',
  templateUrl: './admin-indicators-management.component.html',
  styleUrls: ['./admin-indicators-management.component.css']
})
export class AdminIndicatorsManagementComponent implements OnInit, OnDestroy {

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  public loadingData: boolean = true;
  public initializationCompleted: boolean = false;
  public tableViewSwitcher: boolean = false;
  public selectIndicatorEntriesInput: boolean = false;
  
  // AG Grid properties
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public gridOptions: GridOptions = {};
  public selectedRows: any[] = [];

  public sortableConfig: any = {
    onEnd: (evt: any) => {
      const updatedIndicatorMetadataEntries = evt.models;
      
      // for those models send API request to persist new sort order
      const patchBody: Array<{indicatorId: string, displayOrder: number}> = [];
      for (let index = 0; index < updatedIndicatorMetadataEntries.length; index++) {
        const indicatorMetadata = updatedIndicatorMetadataEntries[index];
        
        patchBody.push({
          "indicatorId": indicatorMetadata.indicatorId,
          "displayOrder": index
        });
      }

      this.http.patch(
        this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/display-order",
        patchBody
      ).subscribe({
        next: (response: any) => {
          // Success - no action needed
        },
        error: (error: any) => {
          this.kommonitorDataExchangeService.displayMapApplicationError(error);
        }
      });
    }
  };
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private zone: NgZone,
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private kommonitorCacheHelperService: KommonitorIndicatorCacheHelperService,
    private kommonitorDataGridHelperService: KommonitorIndicatorDataGridHelperService
  ) {}

  ngOnInit(): void {
    // Initialize any adminLTE box widgets
    (window as any).$('.box').boxWidget();
    
    this.initializeOrRefreshOverviewTable();
    this.setupEventListeners();
    
    // Add polling mechanism to check for data availability
    this.startDataPolling();
    
    // Add a fallback timeout to prevent infinite loading
    setTimeout(() => {
      if (this.loadingData) {
        this.initializeOrRefreshOverviewTable();
        
        // If still no data after fallback, stop loading anyway
        const filteredIndicators = this.getFilteredIndicators();
        if (!filteredIndicators || filteredIndicators.length === 0) {
          this.loadingData = false;
          this.initializationCompleted = true;
        }
      }
    }, 3000); // 3 second timeout
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // Listen for the global metadata loading completion event
    const sub = this.broadcastService.currentBroadcastMsg.subscribe(data => {
      if (data.msg === 'initialMetadataLoadingCompleted') {
        this.zone.run(() => {
          setTimeout(() => {
            this.initializeOrRefreshOverviewTable();
          }, 250);
        });
      }
      else if (data.msg === 'initialMetadataLoadingFailed') {
        this.zone.run(() => {
          this.loadingData = false;
        });
      }
      else if (data.msg === 'refreshIndicatorOverviewTable') {
        this.zone.run(() => {
          this.loadingData = true;
          // Extract crudType and targetIndicatorId from the broadcast data
          const crudType = (data as any).crudType;
          const targetIndicatorId = (data as any).targetIndicatorId;
          this.refreshIndicatorOverviewTable(crudType, targetIndicatorId);
        });
      }
      // Handle grid button click events
      else if (data.msg === 'onEditIndicatorMetadata') {
        this.zone.run(() => {
          this.onClickEditMetadata(data.values);
        });
      }
      else if (data.msg === 'onEditIndicatorFeatures') {
        this.zone.run(() => {
          this.onClickEditFeatures(data.values);
        });
      }
      else if (data.msg === 'onEditIndicatorUserRoles') {
        this.zone.run(() => {
          this.onClickEditUserRoles(data.values);
        });
      }
      else if (data.msg === 'onDeleteIndicators') {
        this.zone.run(() => {
          // Ensure data.values is an array for delete operation
          const datasetsToDelete = Array.isArray(data.values) ? data.values : [data.values];
          this.onClickDeleteIndicators(datasetsToDelete);
        });
      }
    });
    this.subscriptions.push(sub);

    // Listen for custom events from the data grid helper service
    const handleEditMetadata = (event: CustomEvent) => {
      this.zone.run(() => {
        this.onClickEditMetadata(event.detail.values);
      });
    };

    const handleEditFeatures = (event: CustomEvent) => {
      this.zone.run(() => {
        this.onClickEditFeatures(event.detail.values);
      });
    };

    const handleEditUserRoles = (event: CustomEvent) => {
      this.zone.run(() => {
        this.onClickEditUserRoles(event.detail.values);
      });
    };

    // Add event listeners
    document.addEventListener('onEditIndicatorMetadata', handleEditMetadata as EventListener);
    document.addEventListener('onEditIndicatorFeatures', handleEditFeatures as EventListener);
    document.addEventListener('onEditIndicatorSpatialUnitRoles', handleEditUserRoles as EventListener);

    // Store references for cleanup
    const customEventSubscription = {
      unsubscribe: () => {
        document.removeEventListener('onEditIndicatorMetadata', handleEditMetadata as EventListener);
        document.removeEventListener('onEditIndicatorFeatures', handleEditFeatures as EventListener);
        document.removeEventListener('onEditIndicatorSpatialUnitRoles', handleEditUserRoles as EventListener);
      }
    } as any;
    this.subscriptions.push(customEventSubscription);
  }

  public initializeOrRefreshOverviewTable(): void {
    const indicators = this.getFilteredIndicators();
    
    if (indicators && indicators.length > 0) {
      this.loadingData = false;
      this.initializationCompleted = true;
      
      // Set up grid options first
      this.setupGridOptions(indicators);
      
      // Use the data grid helper service to build column definitions and row data
      this.columnDefs = this.kommonitorDataGridHelperService.buildDataGridColumnConfig_indicators(indicators);
      this.rowData = this.kommonitorDataGridHelperService.buildDataGridRowData_indicators(indicators);
    } else {
      // Data not ready yet, keep loading
      this.loadingData = true;
      this.initializationCompleted = false;
    }
  }

  private setupGridOptions(indicatorMetadataArray: any[]): void {
    this.gridOptions = {
      defaultColDef: {
        editable: false,
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
          "line-height": "20px !important", 
          "word-break": "break-word !important", 
          "padding-top": "17px", 
          "padding-bottom": "17px" 
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
        displayEditButtons_indicators: this.kommonitorDataGridHelperService.displayEditButtons_indicators
      },
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      rowSelection: 'multiple',
      suppressRowClickSelection: true,
      onGridReady: (params: GridReadyEvent) => {
        this.onGridReady(params);
      },
      onFirstDataRendered: () => {
        this.onFirstDataRendered();
      },
      onColumnResized: () => {
        this.onColumnResized();
      },
      onModelUpdated: () => {
        this.onModelUpdated(indicatorMetadataArray);
      },
      onViewportChanged: () => {
        this.onViewportChanged(indicatorMetadataArray);
      },
      onSelectionChanged: (event: SelectionChangedEvent) => {
        this.onSelectionChanged(event);
      }
    };
  }

  // Grid event handlers
  onGridReady(params: GridReadyEvent): void {
    // Grid is ready
  }

  onFirstDataRendered(): void {
    // First data rendered
  }

  onColumnResized(): void {
    // Column resized
  }

  onModelUpdated(indicatorMetadataArray: any[]): void {
    this.kommonitorDataGridHelperService.registerClickHandler_indicators(indicatorMetadataArray);
  }



  onViewportChanged(indicatorMetadataArray: any[]): void {
    this.kommonitorDataGridHelperService.registerClickHandler_indicators(indicatorMetadataArray);
    setTimeout(() => {
      // MathJax rendering if available
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        (window as any).MathJax.typesetPromise().then(() => {
          // MathJax rendering completed
        });
      }
    }, 250);
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    this.selectedRows = event.api.getSelectedRows();
  }

  private getFilteredIndicators(): any[] {
    const allIndicators = this.kommonitorDataExchangeService.availableIndicators;
    
    if (this.tableViewSwitcher) {
      // Filter out indicators where user only has viewer permission
      return allIndicators.filter(e => !(e.userPermissions.length === 1 && e.userPermissions.includes('viewer')));
    } else {
      return allIndicators;
    }
  }

  // Debug method to force stop loading
  stopLoading(): void {
    this.loadingData = false;
    this.initializationCompleted = true;
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
    // TODO: Implement indicator add modal
    console.log('Add indicator clicked');
  }

  onClickEditMetadata(indicatorMetadata: any): void {
    // TODO: Implement indicator edit metadata modal
    console.log('Edit metadata clicked for:', indicatorMetadata);
  }

  onClickEditFeatures(indicatorMetadata: any): void {
    // TODO: Implement indicator edit features modal
    console.log('Edit features clicked for:', indicatorMetadata);
  }

  onClickEditUserRoles(indicatorMetadata: any): void {
    // TODO: Implement indicator edit user roles modal
    console.log('Edit user roles clicked for:', indicatorMetadata);
  }

  onClickDeleteIndicators(indicatorsMetadata: any[]): void {
    // TODO: Implement indicator delete modal
    console.log('Delete indicators clicked for:', indicatorsMetadata);
  }

  onClickBatchUpdate(): void {
    // TODO: Implement batch update modal
    console.log('Batch update clicked');
  }

  onClickDeleteSelected(): void {
    const selectedIndicators = this.getSelectedIndicatorsMetadata();
    if (selectedIndicators.length > 0) {
      this.onClickDeleteIndicators(selectedIndicators);
    } else {
      // Show message that no indicators are selected
      console.log('No indicators selected for deletion');
    }
  }

  onChangeSelectIndicatorEntries(): void {
    if (this.selectIndicatorEntriesInput) {
      // TODO: Implement when availableIndicatorDatasets is available
      // this.availableIndicatorDatasets.forEach(function(dataset) {
      //   dataset.isSelected = true;
      // });
    } else {
      // TODO: Implement when availableIndicatorDatasets is available
      // this.availableIndicatorDatasets.forEach(function(dataset) {
      //   dataset.isSelected = false;
      // });
    }
  }

  refreshIndicatorOverviewTable(crudType?: string, targetIndicatorId?: string): void {
    if (!crudType || !targetIndicatorId) {
      // refetch all metadata from indicators to update table
      this.kommonitorDataExchangeService.fetchIndicatorsMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles)
        .then((response: any) => {
          this.initializeOrRefreshOverviewTable();
          this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
          this.loadingData = false;
        })
        .catch((response: any) => {
          this.loadingData = false;
          this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
        });
    }
    else if (crudType && targetIndicatorId) {
      if (crudType === 'add') {
        this.kommonitorCacheHelperService.fetchSingleIndicatorMetadata(targetIndicatorId, this.kommonitorDataExchangeService.currentKeycloakLoginRoles)
          .then((data: any) => {
            this.kommonitorDataExchangeService.addSingleIndicatorMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
            this.loadingData = false;
          })
          .catch((response: any) => {
            this.loadingData = false;
            this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
          });
      }
      else if (crudType === 'edit') {
        this.kommonitorCacheHelperService.fetchSingleIndicatorMetadata(targetIndicatorId, this.kommonitorDataExchangeService.currentKeycloakLoginRoles)
          .then((data: any) => {
            this.kommonitorDataExchangeService.replaceSingleIndicatorMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
            this.loadingData = false;
          })
          .catch((response: any) => {
            this.loadingData = false;
            this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
          });
      }
      else if (crudType === 'delete') {
        this.kommonitorDataExchangeService.deleteSingleIndicatorMetadata(targetIndicatorId);
        this.initializeOrRefreshOverviewTable();
        this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
        this.loadingData = false;
      }
    }
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

  private startDataPolling(): void {
    // Poll every 500ms for data availability
    const pollInterval = setInterval(() => {
      if (this.loadingData) {
        this.initializeOrRefreshOverviewTable();
        
        // If data is found, stop polling
        if (!this.loadingData) {
          clearInterval(pollInterval);
        }
      } else {
        // Data loaded, stop polling
        clearInterval(pollInterval);
      }
    }, 500);
    
    // Stop polling after 10 seconds regardless
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 10000);
  }

  getSelectedIndicatorsMetadata(): any[] {
    return this.selectedRows;
  }
} 