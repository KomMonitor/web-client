import { Component, Inject, OnInit, NgZone, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
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
    private http: HttpClient
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
    // submit selected spatial unit to modal controller
    this.broadcastService.broadcast('onEditSpatialUnitMetadata', spatialUnitDataset);
  }

  onClickEditFeatures(spatialUnitDataset: any): void {
    // submit selected spatial unit to modal controller
    this.broadcastService.broadcast('onEditSpatialUnitFeatures', spatialUnitDataset);
  }

  checkCreatePermission(): boolean {
    return this.kommonitorDataExchangeService.checkCreatePermission();
  }
} 