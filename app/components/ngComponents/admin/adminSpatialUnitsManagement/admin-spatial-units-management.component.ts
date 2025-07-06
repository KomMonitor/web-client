import { Component, Inject, OnInit, NgZone, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpatialUnitAddModalComponent } from './spatialUnitAddModal/spatial-unit-add-modal.component';
import { SpatialUnitEditMetadataModalComponent } from './spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.component';
import { SpatialUnitEditFeaturesModalComponent } from './spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.component';
declare const agGrid: any;
declare const $: any;
declare const __env: any;

@Component({
  selector: 'admin-spatial-units-management-new',
  templateUrl: './admin-spatial-units-management.component.html',
  styleUrls: ['./admin-spatial-units-management.component.css']
})
export class AdminSpatialUnitsManagementComponent implements OnInit, OnDestroy {
  @ViewChild('spatialUnitOverviewTable', { static: true }) spatialUnitOverviewTable!: ElementRef;

  loadingData = true;
  tableViewSwitcher = false;
  gridApi: any;
  gridColumnApi: any;
  gridOptions: any;
  kommonitorDataExchangeServiceInstance: any;

  private subscription: Subscription | undefined;
  private initializationTimeout: any;

  constructor(
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    @Inject('kommonitorCacheHelperService') public kommonitorCacheHelperService: any,
    @Inject('kommonitorDataGridHelperService') public kommonitorDataGridHelperService: any,
    private broadcastService: BroadcastService,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document,
    private http: HttpClient,
    private modalService: NgbModal
  ) {
    console.log('AdminSpatialUnitsManagementComponent constructor initialized');
    this.kommonitorDataExchangeServiceInstance = this.kommonitorDataExchangeService;
  }

  ngOnInit(): void {
    console.log('AdminSpatialUnitsManagementComponent ngOnInit');
    this.loadingData = true;
    
    // initialize any adminLTE box widgets
    ($('.box') as any).boxWidget();
    
    this.setupBroadcastListeners();
    
    // Check if data is already available and initialize immediately
    this.checkDataAvailabilityAndInitialize();
    
    // Fallback timeout in case no events are fired
    this.initializationTimeout = setTimeout(() => {
      console.log('Fallback: Initializing spatial units management after timeout');
      this.checkDataAvailabilityAndInitialize();
    }, 5000); // 5 second fallback
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
    }
  }

  private checkDataAvailabilityAndInitialize(): void {
    // Check if required data is available
    if (this.isDataAvailable()) {
      console.log('Data is available, initializing spatial units management');
      this.initializeOrRefreshOverviewTable();
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
      }
    } else {
      console.log('Data not yet available, waiting for events...');
    }
  }

  private isDataAvailable(): boolean {
    return this.kommonitorDataExchangeService &&
           this.kommonitorDataExchangeService.availableSpatialUnits &&
           this.kommonitorDataExchangeService.availableSpatialUnits.length >= 0;
  }

  private setupBroadcastListeners(): void {
    this.subscription = this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      if (broadcastMsg.msg === 'initialMetadataLoadingCompleted') {
        console.log("Initial metadata loading completed");
        if (this.initializationTimeout) {
          clearTimeout(this.initializationTimeout);
        }
        setTimeout(() => {
          this.initializeOrRefreshOverviewTable();
        }, 250);
      } else if (broadcastMsg.msg === 'initialMetadataLoadingFailed') {
        console.log("Metadata loading failed");
        this.loadingData = false;
        if (this.initializationTimeout) {
          clearTimeout(this.initializationTimeout);
        }
      } else if (broadcastMsg.msg === 'refreshSpatialUnitOverviewTable') {
        console.log("Refreshing spatial unit overview table");
        this.loadingData = true;
        const values = broadcastMsg.values as any[];
        this.refreshSpatialUnitOverviewTable(values[0], values[1]);
      }
    });
  }

  initializeOrRefreshOverviewTable(): void {
    this.loadingData = true;
    
    this.kommonitorDataGridHelperService.buildDataGrid_spatialUnits(this.initSpatialUnits());
    
    setTimeout(() => {
      this.loadingData = false;
    });
  }

  initSpatialUnits(): any[] {
    if (this.tableViewSwitcher) {
      return this.kommonitorDataExchangeService.availableSpatialUnits.filter(
        (e: any) => !(e.userPermissions.length === 1 && e.userPermissions.includes('viewer'))
      );
    } else {
      return this.kommonitorDataExchangeService.availableSpatialUnits;
    }
  }

  onTableViewSwitch(): void {
    this.initializeOrRefreshOverviewTable();
  }

  refreshSpatialUnitOverviewTable(crudType?: string, targetSpatialUnitId?: string | string[]): void {
    if (!crudType || !targetSpatialUnitId) {
      // refetch all metadata from spatial units to update table
      this.kommonitorDataExchangeService.fetchSpatialUnitsMetadata(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles
      ).then((response: any) => {
        this.initializeOrRefreshOverviewTable();
        setTimeout(() => {
          this.loadingData = false;
        });
      }, (error: any) => {
        setTimeout(() => {
          this.loadingData = false;
        });
      });
    } else if (crudType && targetSpatialUnitId) {
      if (crudType === 'add') {
        this.kommonitorCacheHelperService.fetchSingleSpatialUnitMetadata(
          targetSpatialUnitId as string, 
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles
        ).then((data: any) => {
          this.kommonitorDataExchangeService.addSingleSpatialUnitMetadata(data);
          this.initializeOrRefreshOverviewTable();
          setTimeout(() => {
            this.loadingData = false;
          });
        }, (error: any) => {
          setTimeout(() => {
            this.loadingData = false;
          });
        });
      } else if (crudType === 'edit') {
        this.kommonitorCacheHelperService.fetchSingleSpatialUnitMetadata(
          targetSpatialUnitId as string, 
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles
        ).then((data: any) => {
          this.kommonitorDataExchangeService.replaceSingleSpatialUnitMetadata(data);
          this.initializeOrRefreshOverviewTable();
          setTimeout(() => {
            this.loadingData = false;
          });
        }, (error: any) => {
          setTimeout(() => {
            this.loadingData = false;
          });
        });
      } else if (crudType === 'delete') {
        // targetSpatialUnitId might be array in this case
        if (targetSpatialUnitId && typeof targetSpatialUnitId === 'string') {
          this.kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(targetSpatialUnitId);
          this.initializeOrRefreshOverviewTable();
          setTimeout(() => {
            this.loadingData = false;
          });
        } else if (targetSpatialUnitId && Array.isArray(targetSpatialUnitId)) {
          for (const id of targetSpatialUnitId) {
            this.kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(id);
          }
          this.initializeOrRefreshOverviewTable();
          setTimeout(() => {
            this.loadingData = false;
          });
        }
      }
    }
  }

  onChangeSelectDataset(spatialUnitDataset: any): void {
    console.log(spatialUnitDataset.spatialUnitLevel);
  }

  onClickDeleteDatasets(): void {
    this.loadingData = true;

    const markedEntriesForDeletion = this.kommonitorDataGridHelperService.getSelectedSpatialUnitsMetadata();

    // submit selected spatial units to modal controller
    this.broadcastService.broadcast('onDeleteSpatialUnits', markedEntriesForDeletion);

    setTimeout(() => {
      this.loadingData = false;
    });
  }

  onClickEditMetadata(spatialUnitDataset: any): void {
    this.openEditMetadataModal(spatialUnitDataset);
  }

  openEditMetadataModal(spatialUnitDataset: any) {
    console.log('Opening edit spatial unit metadata modal for:', spatialUnitDataset);
    
    try {
      // Open modal using NgbModal
      const modalRef = this.modalService.open(SpatialUnitEditMetadataModalComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        container: 'body',
        animation: false,
        windowClass: 'spatial-unit-edit-metadata-modal'
      });
      
      console.log('Edit metadata modal reference created:', modalRef);
      
      // Pass the spatial unit dataset to the modal
      modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitDataset;
      modalRef.componentInstance.resetForm();
      
      // Handle modal result
      modalRef.result.then(
        (result) => {
          console.log('Edit metadata modal closed with result:', result);
          if (result && result.action === 'updated') {
            // Refresh the spatial units table
            this.refreshSpatialUnitOverviewTable('edit', spatialUnitDataset.spatialUnitId);
          }
        },
        (reason) => {
          console.log('Edit metadata modal dismissed with reason:', reason);
        }
      );
    } catch (error: any) {
      console.error('Error opening edit metadata modal:', error);
      // Fallback: broadcast event for old AngularJS modal
      this.broadcastService.broadcast('onEditSpatialUnitMetadata', spatialUnitDataset);
    }
  }

  onClickEditFeatures(spatialUnitDataset: any): void {
    this.openEditFeaturesModal(spatialUnitDataset);
  }

  openEditFeaturesModal(spatialUnitDataset: any) {
    console.log('Opening edit spatial unit features modal for:', spatialUnitDataset);
    
    try {
      // Open modal using NgbModal
      const modalRef = this.modalService.open(SpatialUnitEditFeaturesModalComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        container: 'body',
        animation: false,
        windowClass: 'spatial-unit-edit-features-modal'
      });
      
      console.log('Edit features modal reference created:', modalRef);
      
      // Pass the spatial unit dataset to the modal
      modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitDataset;
      modalRef.componentInstance.resetForm();
      
      // Handle modal result
      modalRef.result.then(
        (result) => {
          console.log('Edit features modal closed with result:', result);
          if (result && result.action === 'updated') {
            // Refresh the spatial units table
            this.refreshSpatialUnitOverviewTable('edit', spatialUnitDataset.spatialUnitId);
          }
        },
        (reason) => {
          console.log('Edit features modal dismissed with reason:', reason);
        }
      );
    } catch (error: any) {
      console.error('Error opening edit features modal:', error);
      // Fallback: broadcast event for old AngularJS modal
      this.broadcastService.broadcast('onEditSpatialUnitFeatures', spatialUnitDataset);
    }
  }

  checkCreatePermission(): boolean {
    return this.kommonitorDataExchangeService.checkCreatePermission();
  }

  openAddSpatialUnitModal() {
    console.log('Opening add spatial unit modal');
    
    // Test if modal service is working
    console.log('Modal service available:', this.modalService);
    console.log('SpatialUnitAddModalComponent available:', SpatialUnitAddModalComponent);
    
    try {
      // Open modal using NgbModal
      const modalRef = this.modalService.open(SpatialUnitAddModalComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        container: 'body',
        animation: false,
        windowClass: 'spatial-unit-add-modal'
      });
      
      console.log('Modal reference created:', modalRef);
      
      // Handle modal result
      modalRef.result.then(
        (result) => {
          console.log('Modal closed with result:', result);
          if (result.action === 'created') {
            // Refresh the spatial units table
            this.initializeOrRefreshOverviewTable();
          }
        },
        (reason) => {
          console.log('Modal dismissed with reason:', reason);
        }
      );
    } catch (error: any) {
      console.error('Error opening modal:', error);
      // Fallback: show alert
      alert('Modal failed to open: ' + (error?.message || 'Unknown error'));
    }
  }
} 