import { Component, OnInit, OnDestroy, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from '../../../../services/broadcast-service/broadcast.service';
import { KommonitorGeoresourceDataExchangeService } from '../../../../services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { KommonitorGeoresourceCacheHelperService } from '../../../../services/adminGeoresourceUnit/kommonitor-cache-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from '../../../../services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';
import { AgGridAngular } from 'ag-grid-angular';
import { GeoresourceAddModalComponent } from './georesourceAddModal/georesource-add-modal.component';
import { GeoresourceBatchUpdateModalComponent } from './georesourceBatchUpdateModal/georesource-batch-update-modal.component';
import { GeoresourceEditMetadataModalComponent } from './georesourceEditMetadataModal/georesource-edit-metadata-modal.component';
import { GeoresourceEditFeaturesModalComponent } from './georesourceEditFeaturesModal/georesource-edit-features-modal.component';
import { GeoresourceEditUserRolesModalComponent } from './georesourceEditUserRolesModal/georesource-edit-user-roles-modal.component';
import { GeoresourceDeleteModalComponent } from './georesourceDeleteModal/georesource-delete-modal.component';

// Declare jQuery for AdminLTE
declare const $: any;

@Component({
  selector: 'admin-georesources-management-new',
  templateUrl: './admin-georesources-management.component.html',
  styleUrls: ['./admin-georesources-management.component.css']
})
export class AdminGeoresourcesManagementComponent implements OnInit, OnDestroy, AfterViewInit {

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

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    public kommonitorDataExchangeService: KommonitorGeoresourceDataExchangeService,
    private kommonitorCacheHelperService: KommonitorGeoresourceCacheHelperService,
    private kommonitorDataGridHelperService: KommonitorGeoresourceDataGridHelperService
  ) {}

  ngOnInit(): void {
    this.setupEventListeners();
    this.initialize();
    
    // Initialize grid options with the service
    this.poiGridOptions = this.kommonitorDataGridHelperService.getPoiGridOptions();
    this.loiGridOptions = this.kommonitorDataGridHelperService.getLoiGridOptions();
    this.aoiGridOptions = this.kommonitorDataGridHelperService.getAoiGridOptions();

    // Subscribe to service observables for reactive updates
    this.subscribeToServiceObservables();
  }

  ngAfterViewInit(): void {
    // Initialize grids after view is ready
    this.kommonitorDataGridHelperService.initializeGrids(
      this.poiGrid,
      this.loiGrid,
      this.aoiGrid
    );

    // Set component reference for callbacks
    this.kommonitorDataGridHelperService.setComponentRef(this);

    // Load data if not already loaded
    if (this.kommonitorDataExchangeService.availableGeoresources.length === 0) {
      this.loadDataFallback();
    }

    // Re-register click handlers after a delay to ensure DOM is ready
    setTimeout(() => {
      this.reRegisterClickHandlers();
    }, 1000);
  }

  private loadDataFallback(): void {
    // If we still don't have data after 1 second, try to manually trigger data loading
    if (!this.kommonitorDataExchangeService.availableGeoresources || 
        this.kommonitorDataExchangeService.availableGeoresources.length === 0) {
      
      // Try to fetch metadata manually
      this.kommonitorDataExchangeService.fetchGeoresourcesMetadata(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles
      ).then((response: any) => {
        this.initializeOrRefreshOverviewTable();
      }).catch((error: any) => {
        // As a last resort, try with test data to verify grids are working
        this.testGridsWithSampleData();
        
        this.loadingData = false;
      });
    }
  }

  private testGridsWithSampleData(): void {
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
          description: 'Test POI description'
        },
        ownerId: 'test-owner',
        userPermissions: ['creator']
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
          description: 'Test LOI description'
        },
        ownerId: 'test-owner',
        userPermissions: ['creator']
      },
      {
        georesourceId: 'test-aoi-1',
        datasetName: 'Test AOI 1',
        isPOI: false,
        isLOI: false,
        isAOI: true,
        aoiColor: '#ffff00',
        metadata: {
          description: 'Test AOI description'
        },
        ownerId: 'test-owner',
        userPermissions: ['creator']
      }
    ];
    
    this.kommonitorDataGridHelperService.buildDataGrid_georesources(testData);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // Listen for broadcast messages
    const broadcastSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'initialMetadataLoadingCompleted') {
        setTimeout(() => {
          this.initializeOrRefreshOverviewTable();
        }, 250);
      } else if (data.msg === 'initialMetadataLoadingFailed') {
        this.loadingData = false;
      } else if (data.msg === 'refreshGeoresourceOverviewTable') {
        this.loadingData = true;
        this.refreshGeoresourceOverviewTable(data.values.crudType, data.values.targetGeoresourceId);
      }
    });

    this.subscriptions.push(broadcastSub);
  }

  /**
   * Subscribe to service observables for reactive updates
   */
  private subscribeToServiceObservables(): void {
    // Subscribe to georesources updates
    const georesourcesSub = this.kommonitorDataExchangeService.georesources$.subscribe(georesources => {
      if (georesources && georesources.length > 0) {
        this.initializeOrRefreshOverviewTable();
      }
    });

    // Subscribe to loading state
    const loadingSub = this.kommonitorDataExchangeService.loading$.subscribe(loading => {
      this.loadingData = loading;
    });

    // Subscribe to error state
    const errorSub = this.kommonitorDataExchangeService.error$.subscribe(error => {
      if (error) {
        console.error('Data exchange service error:', error);
        // You could show a toast notification here
      }
    });

    // Subscribe to cache helper service observables
    const cacheLoadingSub = this.kommonitorCacheHelperService.loading$.subscribe(loading => {
      if (loading) {
        this.loadingData = true;
      }
    });

    const cacheErrorSub = this.kommonitorCacheHelperService.error$.subscribe(error => {
      if (error) {
        console.error('Cache helper service error:', error);
        // You could show a toast notification here
      }
    });

    // Add all subscriptions to the array for cleanup
    this.subscriptions.push(
      georesourcesSub,
      loadingSub,
      errorSub,
      cacheLoadingSub,
      cacheErrorSub
    );
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
      
      // Re-register click handlers after grid is built
      setTimeout(() => {
        this.reRegisterClickHandlers();
      }, 600);
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
      this.kommonitorDataExchangeService.fetchGeoresourcesMetadata(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles
      ).then((response: any) => {
        this.initializeOrRefreshOverviewTable();
        this.broadcastService.broadcast('refreshGeoresourceOverviewTableCompleted');
        this.loadingData = false;
      }).catch((error: any) => {
        console.error('Error refreshing georesource overview table:', error);
        this.loadingData = false;
        this.broadcastService.broadcast('refreshGeoresourceOverviewTableCompleted');
      });
    } else if (crudType && targetGeoresourceId) {
      if (crudType === 'add') {
        this.kommonitorCacheHelperService.fetchSingleGeoresourceMetadata(
          targetGeoresourceId, 
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles
        ).then((data: any) => {
          this.kommonitorDataExchangeService.addSingleGeoresourceMetadata(data);
          this.initializeOrRefreshOverviewTable();
          this.broadcastService.broadcast('refreshGeoresourceOverviewTableCompleted');
          this.loadingData = false;
        }).catch((error: any) => {
          console.error('Error adding single georesource metadata:', error);
          this.loadingData = false;
          this.broadcastService.broadcast('refreshGeoresourceOverviewTableCompleted');
        });
      } else if (crudType === 'edit') {
        this.kommonitorCacheHelperService.fetchSingleGeoresourceMetadata(
          targetGeoresourceId, 
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles
        ).then((data: any) => {
          this.kommonitorDataExchangeService.replaceSingleGeoresourceMetadata(data);
          this.initializeOrRefreshOverviewTable();
          this.broadcastService.broadcast('refreshGeoresourceOverviewTableCompleted');
          this.loadingData = false;
        }).catch((error: any) => {
          console.error('Error editing single georesource metadata:', error);
          this.loadingData = false;
          this.broadcastService.broadcast('refreshGeoresourceOverviewTableCompleted');
        });
      } else if (crudType === 'delete') {
        // targetGeoresourceId might be array in this case
        if (targetGeoresourceId && typeof targetGeoresourceId === 'string') {
          this.kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(targetGeoresourceId);
          this.initializeOrRefreshOverviewTable();
          this.broadcastService.broadcast('refreshGeoresourceOverviewTableCompleted');
          this.loadingData = false;
        } else if (targetGeoresourceId && Array.isArray(targetGeoresourceId)) {
          for (const id of targetGeoresourceId) {
            this.kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(id);
          }
          this.initializeOrRefreshOverviewTable();
          this.broadcastService.broadcast('refreshGeoresourceOverviewTableCompleted');
          this.loadingData = false;
        }
      }
    }
  }

  // Modal event handlers
  onClickAddGeoresource(): void {
    const modalRef = this.modalService.open(GeoresourceAddModalComponent, {
      // omit size to avoid Bootstrap max-width caps like modal-lg
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'georesource-add-modal',
      windowClass: 'georesource-add-modal-window'
    });
    
    modalRef.result.then((result) => {
      if (result) {
        // Handle successful add
        this.refreshGeoresourceOverviewTable('add', result.georesourceId);
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickBatchUpdateGeoresource(): void {
    const modalRef = this.modalService.open(GeoresourceBatchUpdateModalComponent, {
      // omit size to avoid Bootstrap max-width caps like modal-lg
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'georesource-batch-update-modal',
      windowClass: 'georesource-batch-update-modal-window'
    });
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  public onClickEditMetadata(georesourceDataset: any): void {
    const modalRef = this.modalService.open(GeoresourceEditMetadataModalComponent, {
      // omit size to avoid Bootstrap max-width caps like modal-lg
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'georesource-edit-metadata-modal',
      windowClass: 'georesource-edit-metadata-modal-window'
    });

    // Pass the georesource dataset to the modal
    modalRef.componentInstance.currentGeoresourceDataset = georesourceDataset;
    
    modalRef.result.then((result) => {
      if (result) {
        // Handle successful edit
        this.refreshGeoresourceOverviewTable('edit', georesourceDataset.georesourceId);
      }
    }, (reason) => {
      // Modal dismissed
    });
  }

  public onClickEditFeatures(georesourceDataset: any): void {
    const modalRef = this.modalService.open(GeoresourceEditFeaturesModalComponent, {
      // omit size to avoid Bootstrap max-width caps like modal-lg
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'georesource-edit-features-modal',
      windowClass: 'georesource-edit-features-modal-window'
    });

    // Pass the georesource dataset to the modal
    modalRef.componentInstance.currentGeoresourceDataset = georesourceDataset;
    
    modalRef.result.then((result) => {
      if (result) {
        // Handle successful edit
        this.refreshGeoresourceOverviewTable('edit', georesourceDataset.georesourceId);
      }
    }, (reason) => {
      // Modal dismissed
    });
  }

  public onClickEditUserRoles(georesourceDataset: any): void {
    const modalRef = this.modalService.open(GeoresourceEditUserRolesModalComponent, {
      // omit size to avoid Bootstrap max-width caps like modal-lg
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'georesource-edit-user-roles-modal',
      windowClass: 'georesource-edit-user-roles-modal-window'
    });
    modalRef.componentInstance.currentGeoresourceDataset = georesourceDataset;
    
    modalRef.result.then((result) => {
      if (result) {
        // Handle successful edit
        this.refreshGeoresourceOverviewTable('edit', georesourceDataset.georesourceId);
      }
    }, (reason) => {
      // Modal dismissed
    });
  }

  public onClickDeleteGeoresource(georesourceDataset: any): void {
    const modalRef = this.modalService.open(GeoresourceDeleteModalComponent, {
      // omit size to avoid Bootstrap max-width caps like modal-lg
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'georesource-delete-modal',
      windowClass: 'georesource-delete-modal-window'
    });

    // Pass the georesource dataset directly to the modal (array like original)
    (modalRef.componentInstance as any).datasetsToDelete = [georesourceDataset];

    modalRef.result.then(
      (result) => {
        console.log('Georesource delete modal closed with result:', result);
      },
      (reason) => {
        console.log('Georesource delete modal dismissed with reason:', reason);
      }
    );
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

  // Callback methods for cell renderer
  onEditMetadata(georesourceDataset: any): void {
    // Broadcast the event like the original AngularJS component
    this.broadcastService.broadcast('onEditGeoresourceMetadata', georesourceDataset);
    
    // Then open the modal
    this.onClickEditMetadata(georesourceDataset);
  }

  onEditFeatures(georesourceDataset: any): void {
    // Open the modal directly
    this.onClickEditFeatures(georesourceDataset);
  }

  onEditUserRoles(georesourceDataset: any): void {
    // Broadcast the event like the original AngularJS component
    this.broadcastService.broadcast('onEditGeoresourceUserRoles', georesourceDataset);
    
    // Then open the modal
    this.onClickEditUserRoles(georesourceDataset);
  }

  /**
   * Handle bulk deletion of selected georesources (like original AngularJS component)
   */
  onClickDeleteDatasets(): void {
    this.loadingData = true;
    
    const markedEntriesForDeletion = this.kommonitorDataGridHelperService.getSelectedGeoresourcesMetadata();
    
    if (markedEntriesForDeletion && markedEntriesForDeletion.length > 0) {
      // Submit selected georesources to modal controller
      this.broadcastService.broadcast('onDeleteGeoresources', markedEntriesForDeletion);
      
      // Refresh the table after deletion
      setTimeout(() => {
        this.initializeOrRefreshOverviewTable();
        this.loadingData = false;
      }, 100);
    } else {
      // No items selected
      this.loadingData = false;
      console.warn('No georesources selected for deletion');
    }
  }

  /**
   * Get selected georesources for bulk operations
   */
  getSelectedGeoresources(): any[] {
    return this.kommonitorDataGridHelperService.getSelectedGeoresourcesMetadata();
  }

  /**
   * Clear all grid selections
   */
  clearAllSelections(): void {
    this.kommonitorDataGridHelperService.clearAllSelections();
  }

  /**
   * Export grid data to CSV
   */
  exportGridToCsv(gridType: 'poi' | 'loi' | 'aoi'): void {
    this.kommonitorDataGridHelperService.exportToCsv(gridType);
  }

  /**
   * Save grid state for persistence
   */
  saveGridState(gridType: 'poi' | 'loi' | 'aoi'): void {
    this.kommonitorDataGridHelperService.saveGridState(gridType);
  }

  /**
   * Restore grid state from persistence
   */
  restoreGridState(gridType: 'poi' | 'loi' | 'aoi'): void {
    this.kommonitorDataGridHelperService.restoreGridState(gridType);
  }

  /**
   * Refresh all data from cache helper service
   */
  async refreshAllData(): Promise<void> {
    try {
      this.loadingData = true;
      await this.kommonitorCacheHelperService.refreshAllData(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles
      );
      this.initializeOrRefreshOverviewTable();
    } catch (error) {
      console.error('Error refreshing all data:', error);
    } finally {
      this.loadingData = false;
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.kommonitorCacheHelperService.clearAllCaches();
    console.log('All caches cleared');
  }

  /**
   * Manually re-register click handlers for grid buttons
   */
  reRegisterClickHandlers(): void {
    this.kommonitorDataGridHelperService.reRegisterClickHandlers();
  }

  /**
   * Force refresh grid data and re-register handlers
   */
  forceRefreshGrids(): void {
    console.log('Force refreshing grids...');
    this.loadingData = true;
    
    // Re-register click handlers
    this.reRegisterClickHandlers();
    
    // Refresh the overview table
    setTimeout(() => {
      this.initializeOrRefreshOverviewTable();
      this.loadingData = false;
    }, 1000);
  }

  /**
   * Debug method to check button state in DOM
   */
  debugButtonState(): void {
    console.log('=== Debugging Button State ===');
    
    const editMetadataButtons = document.querySelectorAll('.georesourceEditMetadataBtn');
    const editFeaturesButtons = document.querySelectorAll('.georesourceEditFeaturesBtn');
    const editUserRolesButtons = document.querySelectorAll('.georesourceEditUserRolesBtn');
    const deleteButtons = document.querySelectorAll('.georesourceDeleteBtn');
    
    console.log('Edit Metadata Buttons:', editMetadataButtons.length);
    editMetadataButtons.forEach((btn: any, index) => {
      console.log(`  ${index}:`, btn.id, btn.className, btn.disabled);
    });
    
    console.log('Edit Features Buttons:', editFeaturesButtons.length);
    editFeaturesButtons.forEach((btn: any, index) => {
      console.log(`  ${index}:`, btn.id, btn.className, btn.disabled);
    });
    
    console.log('Edit User Roles Buttons:', editUserRolesButtons.length);
    editUserRolesButtons.forEach((btn: any, index) => {
      console.log(`  ${index}:`, btn.id, btn.className, btn.disabled);
    });
    
    console.log('Delete Buttons:', deleteButtons.length);
    deleteButtons.forEach((btn: any, index) => {
      console.log(`  ${index}:`, btn.id, btn.className, btn.disabled);
    });
    
    console.log('=== End Debug ===');
  }
} 