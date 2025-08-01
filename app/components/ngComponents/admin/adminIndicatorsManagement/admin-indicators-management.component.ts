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
import { AuthService } from 'services/auth-service/auth.service';
import { IndicatorAddModalComponent } from './indicatorAddModal/indicator-add-modal.component';
import { IndicatorEditMetadataModalComponent } from './indicatorEditMetadataModal/indicator-edit-metadata-modal.component';
import { IndicatorEditFeaturesModalComponent } from './indicatorEditFeaturesModal/indicator-edit-features-modal.component';
import { IndicatorDeleteModalComponent } from './indicatorDeleteModal/indicator-delete-modal.component';
import { IndicatorBatchUpdateModalComponent } from './indicatorBatchUpdateModal/indicator-batch-update-modal.component';

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

  // Drag & Drop properties
  public collapsedTopics: Set<string> = new Set();
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
          // Success - refresh the data to reflect the new order
          this.refreshDataAfterDragDrop();
        },
        error: (error: any) => {
          this.kommonitorDataExchangeService.displayMapApplicationError(error);
        }
      });
    }
  };
  private subscriptions: Subscription[] = [];
  
  // Timeout properties for debouncing
  private modelUpdateTimeout: any = null;
  private viewportChangeTimeout: any = null;
  
  // Polling control
  private isPolling: boolean = false;
  
  // Debouncing for initializeOrRefreshOverviewTable
  private initializeTableTimeout: any = null;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private zone: NgZone,
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private kommonitorCacheHelperService: KommonitorIndicatorCacheHelperService,
    private kommonitorDataGridHelperService: KommonitorIndicatorDataGridHelperService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initialize any adminLTE box widgets
    (window as any).$('.box').boxWidget();
    
    // Make component available globally for debugging
    (window as any).adminIndicatorsComponent = this;
    
    // Try to load data if not already available
    this.ensureDataLoaded();
    
    this.initializeOrRefreshOverviewTable();
    this.setupEventListeners();
    
    // Add polling mechanism to check for data availability
    this.startDataPolling();
    
    // Add a fallback timeout to prevent infinite loading
    setTimeout(() => {
      if (this.loadingData) {
        console.log("Fallback timeout triggered - attempting to load data again");
        this.ensureDataLoaded();
        this.initializeOrRefreshOverviewTable();
        
        // If still no data after fallback, stop loading anyway
        const filteredIndicators = this.getFilteredIndicators();
        if (!filteredIndicators || filteredIndicators.length === 0) {
          this.loadingData = false;
          this.initializationCompleted = true;
          console.warn("No data available after fallback timeout");
        }
      }
    }, 3000); // 3 second timeout
  }

  private async ensureDataLoaded(): Promise<void> {
    // If no indicators are available, try to fetch them
    if (!this.kommonitorDataExchangeService.availableIndicators || 
        this.kommonitorDataExchangeService.availableIndicators.length === 0) {
      try {
        // Get roles from AuthService (like other Angular components)
        let roles: string[] = [];
        
        if (this.authService.Auth && this.authService.Auth.keycloak && 
            this.authService.Auth.keycloak.tokenParsed && 
            this.authService.Auth.keycloak.tokenParsed.realm_access && 
            this.authService.Auth.keycloak.tokenParsed.realm_access.roles) {
          roles = this.authService.Auth.keycloak.tokenParsed.realm_access.roles;
          console.log("Admin Component - Roles retrieved from AuthService:", roles);
        } else {
          console.log("Admin Component - AuthService not ready, Auth object:", this.authService.Auth);
          // If no roles available, try with empty array
          roles = [];
        }
        
        await this.kommonitorDataExchangeService.fetchIndicatorsMetadata(roles);
        // Force refresh the table after data is loaded
        setTimeout(() => {
          this.forceRefreshGrid();
        }, 100);
      } catch (error) {
        console.error("Admin Component - Error fetching indicators:", error);
        // Set loading to false to prevent infinite retries
        this.loadingData = false;
        this.initializationCompleted = true;
      }
    }
  }

  private forceRefreshGrid(): void {
    const indicators = this.getFilteredIndicators();
    console.log("indicators level1 ", indicators);
    if (!indicators || !Array.isArray(indicators)) {
      this.loadingData = false;
      return;
    }
    
    if (indicators && indicators.length > 0) {
      this.columnDefs = this.kommonitorDataGridHelperService.buildDataGridColumnConfig_indicators(indicators);
      this.rowData = this.kommonitorDataGridHelperService.buildDataGridRowData_indicators(indicators);
      
      // Update the grid if it's ready
      if (this.agGrid && this.agGrid.api) {
        this.agGrid.api.setGridOption('rowData', this.rowData);
        this.agGrid.api.setColumnDefs(this.columnDefs);
        this.agGrid.api.refreshCells();
        this.loadingData = false;
        this.initializationCompleted = true;
      }
    } else {
      this.loadingData = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Clean up timeouts
    if (this.modelUpdateTimeout) {
      clearTimeout(this.modelUpdateTimeout);
    }
    if (this.viewportChangeTimeout) {
      clearTimeout(this.viewportChangeTimeout);
    }
    if (this.initializeTableTimeout) {
      clearTimeout(this.initializeTableTimeout);
    }
    
    // Clean up global reference
    if ((window as any).adminIndicatorsComponent === this) {
      delete (window as any).adminIndicatorsComponent;
    }
  }

  private setupEventListeners(): void {
    // Listen for the global metadata loading completion event
    const sub = this.broadcastService.currentBroadcastMsg.subscribe(data => {
      if (data.msg === 'initialMetadataLoadingCompleted') {
        this.zone.run(() => {
          setTimeout(() => {
            this.initializeOrRefreshOverviewTable();
            // Also ensure topics are collapsed when metadata is loaded
            this.initializeCollapsedTopics();
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
    });
    this.subscriptions.push(sub);
  }

  public initializeOrRefreshOverviewTable(): void {
    // Add debouncing to prevent excessive calls
    if (this.initializeTableTimeout) {
      clearTimeout(this.initializeTableTimeout);
    }
    
    this.initializeTableTimeout = setTimeout(() => {
      const indicators = this.getFilteredIndicators();
      
      if (indicators && indicators.length > 0) {
        this.loadingData = false;
        this.initializationCompleted = true;
        
        // Initialize all topics as collapsed
        this.initializeCollapsedTopics();
        
        // Set up grid options first
        this.setupGridOptions(indicators);
        
        // Use the data grid helper service to build column definitions and row data
        this.columnDefs = this.kommonitorDataGridHelperService.buildDataGridColumnConfig_indicators(indicators);
        this.rowData = this.kommonitorDataGridHelperService.buildDataGridRowData_indicators(indicators);
        
        // Force change detection
        setTimeout(() => {
          if (this.agGrid && this.agGrid.api) {
            this.agGrid.api.setGridOption('rowData', this.rowData);
            this.agGrid.api.setColumnDefs(this.columnDefs);
            this.agGrid.api.refreshCells();
          }
        }, 100);
      } else {
        // Check if we should stop trying to load data
        const availableIndicators = this.kommonitorDataExchangeService.availableIndicators;
        if (availableIndicators && Array.isArray(availableIndicators)) {
          // Data is available but filtered out, stop loading
          this.loadingData = false;
          this.initializationCompleted = true;
        } else {
          // Data not ready yet, keep loading
          this.loadingData = true;
          this.initializationCompleted = false;
        }
      }
    }, 100); // 100ms debounce
  }

  private setupGridOptions(indicatorMetadataArray: any[]): void {
    this.gridOptions = {
      defaultColDef: {
        editable: false,
        sortable: true,
        flex: 1,
        minWidth: 200,
        filter: true,
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
      onSelectionChanged: (event: SelectionChangedEvent) => {
        this.onSelectionChanged(event);
      }
    };
  }

  // Grid event handlers
  onGridReady(params: GridReadyEvent): void {
    // If we have data, set it now
    if (this.rowData && this.rowData.length > 0) {
      params.api.setGridOption('rowData', this.rowData);
      params.api.setColumnDefs(this.columnDefs);
    } else {
      // If no data is available, try to load it
      if (!this.kommonitorDataExchangeService.availableIndicators || 
          this.kommonitorDataExchangeService.availableIndicators.length === 0) {
        this.ensureDataLoaded();
      } else {
        this.forceRefreshGrid();
      }
    }
  }

  onFirstDataRendered(event: any): void {
    this.registerClickHandler_indicators();
  }

  onColumnResized(event: any): void {
    // Column resized
  }

  onRowDataChanged(): void {
    this.registerClickHandler_indicators();
  }

  onModelUpdated(): void {
    // Add debouncing to prevent excessive calls
    if (this.modelUpdateTimeout) {
      clearTimeout(this.modelUpdateTimeout);
    }
    
    this.modelUpdateTimeout = setTimeout(() => {
      this.registerClickHandler_indicators();
    }, 100);
  }

  onViewportChanged(): void {
    // Add debouncing to prevent excessive calls
    if (this.viewportChangeTimeout) {
      clearTimeout(this.viewportChangeTimeout);
    }
    
    this.viewportChangeTimeout = setTimeout(() => {
      this.registerClickHandler_indicators();
      setTimeout(() => {
        // MathJax rendering if available
        if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
          (window as any).MathJax.typesetPromise().then(() => {
            // MathJax rendering completed
          });
        }
      }, 250);
    }, 100);
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    this.selectedRows = event.api.getSelectedRows();
  }

  private registerClickHandler_indicators(): void {
    console.log('registerClickHandler_indicators called');
    
    // Use event delegation on the grid container instead of individual buttons
    // This ensures handlers work even for dynamically rendered buttons
    const $ = (window as any).$;
    
    if (!$) {
      console.error('jQuery not available');
      return;
    }
    
    const gridContainer = $('#adminIndicatorsOverviewTable');
    console.log('Grid container found:', gridContainer.length > 0);
    
    // Remove any existing handlers first to avoid duplicates
    gridContainer.off('click', '.indicatorEditMetadataBtn');
    gridContainer.off('click', '.indicatorEditFeaturesBtn');
    gridContainer.off('click', '.indicatorEditRoleBasedAccessBtn');

    // Edit Metadata Button - use event delegation
    gridContainer.on('click', '.indicatorEditMetadataBtn', (event: any) => {
      console.log('=== EDIT METADATA BUTTON CLICKED ===');
      console.log('Event target:', event.target);
      console.log('Event currentTarget:', event.currentTarget);
      event.stopPropagation();
      event.preventDefault();
      
      // Get the button element (could be the icon inside)
      const button = $(event.target).closest('.indicatorEditMetadataBtn')[0];
      console.log('Button element:', button);
      console.log('Button ID:', button?.id);
      console.log('Button classes:', button?.className);
      
      if (button && button.id) {
        const indicatorId = button.id.split('_')[3];
        console.log('Indicator ID:', indicatorId);
        
        const indicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);
        console.log('Indicator metadata:', indicatorMetadata);
        
        if (indicatorMetadata) {
          console.log('Calling onClickEditMetadata...');
          this.zone.run(() => {
            this.onClickEditMetadata(indicatorMetadata);
          });
        } else {
          console.error('No indicator metadata found for ID:', indicatorId);
        }
      } else {
        console.error('Button element or ID not found');
      }
    });

    // Edit Features Button - use event delegation
    gridContainer.on('click', '.indicatorEditFeaturesBtn', (event: any) => {
      console.log('=== EDIT FEATURES BUTTON CLICKED ===');
      console.log('Event target:', event.target);
      console.log('Event currentTarget:', event.currentTarget);
      event.stopPropagation();
      event.preventDefault();
      
      // Get the button element (could be the icon inside)
      const button = $(event.target).closest('.indicatorEditFeaturesBtn')[0];
      console.log('Button element:', button);
      console.log('Button ID:', button?.id);
      console.log('Button classes:', button?.className);
      
      const indicatorId = button.id.split('_')[3];
      console.log('Indicator ID:', indicatorId);
      const indicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);
      console.log('Indicator metadata:', indicatorMetadata);
      
      if (indicatorMetadata) {
        console.log('Calling onClickEditFeatures...');
        this.zone.run(() => {
          this.onClickEditFeatures(indicatorMetadata);
        });
      }
    });

    // Edit Role-Based Access Button - use event delegation
    gridContainer.on('click', '.indicatorEditRoleBasedAccessBtn', (event: any) => {
      console.log('Edit role-based access button clicked!');
      event.stopPropagation();
      event.preventDefault();
      
      // Get the button element (could be the icon inside)
      const button = $(event.target).closest('.indicatorEditRoleBasedAccessBtn')[0];
      const indicatorId = button.id.split('_')[3];
      const indicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);
      
      if (indicatorMetadata) {
        this.zone.run(() => {
          this.onClickEditIndicatorSpatialUnitRoles(indicatorMetadata);
        });
      }
    });
  }

  private getFilteredIndicators(): any[] {
    const allIndicators = this.kommonitorDataExchangeService.availableIndicators;
    
    if (!allIndicators || !Array.isArray(allIndicators)) {
      return [];
    }
    
    if (this.tableViewSwitcher) {
      // Filter out indicators where user only has viewer permission
      const filtered = allIndicators.filter(e => !(e.userPermissions && e.userPermissions.length === 1 && e.userPermissions.includes('viewer')));
      return filtered;
    } else {
      return allIndicators;
    }
  }

  // Debug method to force stop loading
  stopLoading(): void {
    this.loadingData = false;
    this.initializationCompleted = true;
  }

  // Debug method to manually refresh the grid
  debugRefreshGrid(): void {
    // Force refresh
    this.forceRefreshGrid();
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
    const modalRef = this.modalService.open(IndicatorAddModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    });

    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickEditMetadata(indicatorMetadata: any): void {
    console.log('=== onClickEditMetadata called ===');
    console.log('Opening IndicatorEditMetadataModalComponent');
    console.log('Indicator metadata:', indicatorMetadata);
    
    const modalRef = this.modalService.open(IndicatorEditMetadataModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    });
    
    console.log('Modal ref created:', modalRef);
    console.log('Setting currentIndicatorDataset on modal component');
    modalRef.componentInstance.currentIndicatorDataset = indicatorMetadata;
    console.log('Modal component instance:', modalRef.componentInstance);
    
    // Remove explicit openModal call - modal will initialize automatically in ngOnInit
    // if (modalRef.componentInstance.openModal) {
    //   console.log('Calling openModal on IndicatorEditMetadataModalComponent');
    //   modalRef.componentInstance.openModal();
    // }
    
    modalRef.result.then((result) => {
      console.log('Modal result:', result);
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch((error) => {
      console.log('Modal dismissed or error:', error);
      // Modal dismissed
    });
  }

  onClickEditFeatures(indicatorMetadata: any): void {
    console.log('=== onClickEditFeatures called ===');
    console.log('Opening IndicatorEditFeaturesModalComponent');
    console.log('Indicator metadata:', indicatorMetadata);
    
    const modalRef = this.modalService.open(IndicatorEditFeaturesModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    });
    
    console.log('Modal ref created:', modalRef);
    modalRef.componentInstance.currentIndicatorDataset = indicatorMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickEditIndicatorSpatialUnitRoles(indicatorMetadata: any): void {
    try {
      // Open the modal directly instead of broadcasting
      // Note: This would need to be implemented with the actual modal component
      // For now, we'll keep the broadcast for this specific case as it might be handled elsewhere
      this.broadcastService.broadcast('onEditIndicatorSpatialUnitRoles', indicatorMetadata);
    } catch (error) {
      // Error opening edit indicator spatial unit roles modal
    }
  }

  onClickDeleteIndicators(indicatorsMetadata: any[]): void {
    if (indicatorsMetadata.length === 1) {
      // Open the Angular delete modal for single indicator
      this.openDeleteIndicatorModal(indicatorsMetadata[0]);
    } else {
      // For multiple indicators, we might need to handle differently
      // For now, just open the modal with the first indicator
    }
  }

  openDeleteIndicatorModal(indicatorDataset: any): void {
    const modalRef = this.modalService.open(IndicatorDeleteModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    });

    modalRef.componentInstance.selectedIndicatorDataset = indicatorDataset;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickBatchUpdate(): void {
    const modalRef = this.modalService.open(IndicatorBatchUpdateModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    });

    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickDeleteSelected(): void {
    const selectedIndicators = this.getSelectedIndicatorsMetadata();
    if (selectedIndicators.length > 0) {
      this.onClickDeleteIndicators(selectedIndicators);
    } else {
      // Show message that no indicators are selected
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
    if (this.isPolling) {
      return;
    }
    
    let pollCount = 0;
    const maxPolls = 20; // Maximum number of polls (10 seconds at 500ms intervals)
    
    this.isPolling = true;
    
    // Poll every 500ms for data availability
    const pollInterval = setInterval(() => {
      pollCount++;
      
      if (this.loadingData && pollCount < maxPolls) {
        this.initializeOrRefreshOverviewTable();
        
        // If data is found, stop polling
        if (!this.loadingData) {
          clearInterval(pollInterval);
          this.isPolling = false;
        }
      } else {
        // Data loaded or max polls reached, stop polling
        clearInterval(pollInterval);
        this.isPolling = false;
      }
    }, 500);
    
    // Stop polling after 10 seconds regardless
    setTimeout(() => {
      clearInterval(pollInterval);
      this.isPolling = false;
      // Force stop loading if polling times out
      if (this.loadingData) {
        this.loadingData = false;
        this.initializationCompleted = true;
      }
    }, 10000);
  }

  getSelectedIndicatorsMetadata(): any[] {
    return this.selectedRows;
  }

  // Getter to check if we have topic hierarchy data
  get hasTopicData(): boolean {
    return this.kommonitorDataExchangeService.topicIndicatorHierarchy_forOrderView && 
           this.kommonitorDataExchangeService.topicIndicatorHierarchy_forOrderView.length > 0;
  }

  // Drag & Drop methods
  initializeCollapsedTopics(): void {
    // Clear existing collapsed topics
    this.collapsedTopics.clear();
    
    // Initialize all topics as collapsed by default
    if (this.kommonitorDataExchangeService.topicIndicatorHierarchy_forOrderView && 
        this.kommonitorDataExchangeService.topicIndicatorHierarchy_forOrderView.length > 0) {
      
      this.kommonitorDataExchangeService.topicIndicatorHierarchy_forOrderView.forEach((mainTopic: any) => {
        this.collapsedTopics.add(mainTopic.topicId);
        
        if (mainTopic.subTopics && mainTopic.subTopics.length > 0) {
          mainTopic.subTopics.forEach((subTopic: any) => {
            this.collapsedTopics.add(subTopic.topicId);
            
            if (subTopic.subTopics && subTopic.subTopics.length > 0) {
              subTopic.subTopics.forEach((subsubTopic: any) => {
                this.collapsedTopics.add(subsubTopic.topicId);
                
                if (subsubTopic.subTopics && subsubTopic.subTopics.length > 0) {
                  subsubTopic.subTopics.forEach((subsubsubTopic: any) => {
                    this.collapsedTopics.add(subsubsubTopic.topicId);
                  });
                }
              });
            }
          });
        }
      });
      
    } else {
      // No topic hierarchy data available yet
    }
  }

  toggleTopicCollapse(topicId: string): void {
    if (this.collapsedTopics.has(topicId)) {
      this.collapsedTopics.delete(topicId);
    } else {
      this.collapsedTopics.add(topicId);
    }
  }

  isTopicCollapsed(topicId: string): boolean {
    // If topic hierarchy is not loaded yet, assume collapsed
    if (!this.kommonitorDataExchangeService.topicIndicatorHierarchy_forOrderView || 
        this.kommonitorDataExchangeService.topicIndicatorHierarchy_forOrderView.length === 0) {
      return true;
    }
    
    // If the collapsedTopics set is empty, initialize it and return true (collapsed by default)
    if (this.collapsedTopics.size === 0) {
      this.initializeCollapsedTopics();
      return true;
    }
    
    return this.collapsedTopics.has(topicId);
  }

  onDragEnd(event: any, indicators: any[]): void {
    const { previousIndex, currentIndex } = event;
    
    if (previousIndex === currentIndex) {
      return;
    }

    // Reorder the indicators array
    const movedItem = indicators.splice(previousIndex, 1)[0];
    indicators.splice(currentIndex, 0, movedItem);

    // Update display order for all indicators in this group
    const patchBody: Array<{indicatorId: string, displayOrder: number}> = [];
    for (let index = 0; index < indicators.length; index++) {
      const indicatorMetadata = indicators[index];
      patchBody.push({
        "indicatorId": indicatorMetadata.indicatorId,
        "displayOrder": index
      });
    }

    // Send API request to persist new sort order
    this.http.patch(
      this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/display-order",
      patchBody
    ).subscribe({
      next: (response: any) => {
        // Display order updated successfully - refresh the data
        this.refreshDataAfterDragDrop();
      },
      error: (error: any) => {
        this.kommonitorDataExchangeService.displayMapApplicationError(error);
      }
    });
  }

  private refreshDataAfterDragDrop(): void {
    console.log("refreshDataAfterDragDrop called");
    // Refresh the indicators data to reflect the new order
    if (this.authService.Auth && this.authService.Auth.keycloak && 
        this.authService.Auth.keycloak.tokenParsed && 
        this.authService.Auth.keycloak.tokenParsed.realm_access && 
        this.authService.Auth.keycloak.tokenParsed.realm_access.roles) {
      const roles = this.authService.Auth.keycloak.tokenParsed.realm_access.roles;
      console.log("Refreshing data with roles:", roles);
      
      // Fetch fresh data to reflect the new order
      this.kommonitorDataExchangeService.fetchIndicatorsMetadata(roles).then(() => {
        console.log("Data refreshed successfully");
        // Force refresh the table and topic hierarchy
        this.initializeOrRefreshOverviewTable();
        this.initializeCollapsedTopics();
        console.log("UI refreshed");
      }).catch((error) => {
        console.error("Error refreshing data after drag drop:", error);
      });
    } else {
      console.log("No roles available for refresh");
    }
  }
} 