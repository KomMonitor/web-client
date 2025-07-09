import { Component, Inject, OnInit, NgZone, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpatialUnitAddModalComponent } from './spatialUnitAddModal/spatial-unit-add-modal.component';
import { SpatialUnitEditMetadataModalComponent } from './spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.component';
import { SpatialUnitEditFeaturesModalComponent } from './spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.component';
import { SpatialUnitEditUserRolesModalComponent } from './spatialUnitEditUserRolesModal/spatial-unit-edit-user-roles-modal.component';
import { SpatialUnitDeleteModalComponent } from './spatialUnitDeleteModal/spatial-unit-delete-modal.component';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorCacheHelperService } from 'services/adminSpatialUnit/kommonitor-cache-helper.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
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

  public loadingData: boolean = true;
  public initializationCompleted: boolean = false;
  public tableViewSwitcher: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private zone: NgZone,
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    private kommonitorCacheHelperService: KommonitorCacheHelperService,
    private kommonitorDataGridHelperService: KommonitorDataGridHelperService
  ) {}

  ngOnInit(): void {
    this.initializeOrRefreshOverviewTable();
    this.setupEventListeners();
    
    // Add polling mechanism to check for data availability
    this.startDataPolling();
    
    // Add a fallback timeout to prevent infinite loading
    setTimeout(() => {
      if (this.loadingData) {
        this.initializeOrRefreshOverviewTable();
        
        // If still no data after fallback, stop loading anyway
        if (!this.kommonitorDataExchangeService.availableSpatialUnits || this.kommonitorDataExchangeService.availableSpatialUnits.length === 0) {
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
          this.initializeOrRefreshOverviewTable();
        });
      }
      // Handle grid button click events
      else if (data.msg === 'onEditSpatialUnitMetadata') {
        this.zone.run(() => {
          this.onClickEditMetadata(data.values);
        });
      }
      else if (data.msg === 'onEditSpatialUnitFeatures') {
        this.zone.run(() => {
          this.onClickEditFeatures(data.values);
        });
      }
      else if (data.msg === 'onEditSpatialUnitUserRoles') {
        this.zone.run(() => {
          this.onClickEditUserRoles(data.values);
        });
      }
      else if (data.msg === 'onDeleteSpatialUnits') {
        this.zone.run(() => {
          // Ensure data.values is an array for delete operation
          const datasetsToDelete = Array.isArray(data.values) ? data.values : [data.values];
          this.onClickDeleteSpatialUnits(datasetsToDelete);
        });
      }
    });
    this.subscriptions.push(sub);
  }

  public initializeOrRefreshOverviewTable(): void {
    const spatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits;
    
    if (spatialUnits && spatialUnits.length > 0) {
      this.loadingData = false;
      this.initializationCompleted = true;
      
      // Use the new Angular service to build the data grid
      this.kommonitorDataGridHelperService.buildDataGrid_spatialUnits(spatialUnits);
    } else {
      // Data not ready yet, keep loading
      this.loadingData = true;
      this.initializationCompleted = false;
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
    // For now, just refresh the table
    this.initializeOrRefreshOverviewTable();
  }

  // Alias for the add spatial unit modal (matching HTML template)
  openAddSpatialUnitModal(): void {
    this.onClickAddSpatialUnit();
  }

  // Modal event handlers
  onClickAddSpatialUnit(): void {
    const modalRef = this.modalService.open(SpatialUnitAddModalComponent, {
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

  onClickEditMetadata(spatialUnitMetadata: any): void {
    const modalRef = this.modalService.open(SpatialUnitEditMetadataModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    });
    
    modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickEditFeatures(spatialUnitMetadata: any): void {
    const modalRef = this.modalService.open(SpatialUnitEditFeaturesModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    });
    
    modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickEditUserRoles(spatialUnitMetadata: any): void {
    const modalRef = this.modalService.open(SpatialUnitEditUserRolesModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    });
    
    modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickDeleteSpatialUnits(spatialUnitsMetadata: any[]): void {
    const modalRef = this.modalService.open(SpatialUnitDeleteModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    });
    
    modalRef.componentInstance.datasetsToDelete = spatialUnitsMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  // Utility methods
  checkCreatePermission(): boolean {
    return this.kommonitorDataExchangeService.checkCreatePermission();
  }

  getSelectedSpatialUnitsMetadata(): any[] {
    return this.kommonitorDataGridHelperService.getSelectedSpatialUnitsMetadata();
  }

  refreshSpatialUnitOverviewTable(): void {
            this.initializeOrRefreshOverviewTable();
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
} 