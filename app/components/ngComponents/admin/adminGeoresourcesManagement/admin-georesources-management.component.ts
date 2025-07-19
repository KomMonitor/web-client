import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { BroadcastService } from '../../../../services/broadcast-service/broadcast.service';
import { KommonitorGeoresourceDataExchangeService } from '../../../../services/adminGeoresourceUnit/kommonitor-data-exchange.service';
import { KommonitorGeoresourceCacheHelperService } from '../../../../services/adminGeoresourceUnit/kommonitor-cache-helper.service';
import { KommonitorGeoresourceDataGridHelperService } from '../../../../services/adminGeoresourceUnit/kommonitor-data-grid-helper.service';

// Declare jQuery for AdminLTE
declare const $: any;

@Component({
  selector: 'app-admin-georesources-management',
  templateUrl: './admin-georesources-management.component.html',
  styleUrls: ['./admin-georesources-management.component.css']
})
export class AdminGeoresourcesManagementComponent implements OnInit, OnDestroy {

  public loadingData: boolean = true;
  public tableViewSwitcher: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private broadcastService: BroadcastService,
    public kommonitorDataExchangeService: KommonitorGeoresourceDataExchangeService,
    private kommonitorCacheHelperService: KommonitorGeoresourceCacheHelperService,
    private kommonitorDataGridHelperService: KommonitorGeoresourceDataGridHelperService
  ) {}

  ngOnInit(): void {
    this.setupEventListeners();
    this.initialize();
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
    
    this.kommonitorDataGridHelperService.buildDataGrid_georesources(this.initGeoresources());

    setTimeout(() => {
      this.loadingData = false;
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
      }).catch((response: any) => {
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
        }).catch((response: any) => {
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
        }).catch((response: any) => {
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

  public onClickDeleteDatasets(): void {
    this.loadingData = true;

    const markedEntriesForDeletion = this.kommonitorDataGridHelperService.getSelectedGeoresourcesMetadata();

    // submit selected georesources to modal controller
    this.broadcastService.broadcast('onDeleteGeoresources', markedEntriesForDeletion);

    setTimeout(() => {
      this.loadingData = false;
    }, 100);
  }

  public onClickEditMetadata(georesourceDataset: any): void {
    // submit selected georesource to modal controller
    this.broadcastService.broadcast('onEditGeoresourceMetadata', georesourceDataset);
  }

  public onClickEditFeatures(georesourceDataset: any): void {
    // submit selected georesource to modal controller
    this.broadcastService.broadcast('onEditGeoresourceFeatures', georesourceDataset);
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
} 