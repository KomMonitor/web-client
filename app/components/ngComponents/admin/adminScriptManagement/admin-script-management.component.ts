import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

declare const $: any;

@Component({
  selector: 'admin-script-management-new',
  templateUrl: './admin-script-management.component.html',
  styleUrls: ['./admin-script-management.component.css']
})
export class AdminScriptManagementComponent implements OnInit, OnDestroy {

  loadingData: boolean = true;
  availableScriptDatasets: any[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private zone: NgZone,
    private broadcastService: BroadcastService,
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    @Inject('kommonitorDataGridHelperService') public kommonitorDataGridHelperService: any
  ) {}

  ngOnInit(): void {
    // initialize any adminLTE box widgets
    try { (window as any).$('.box').boxWidget(); } catch {}

    // Make component available for debugging if needed
    (window as any).adminScriptManagementComponent = this;

    // Listen for metadata loading events
    const sub = this.broadcastService.currentBroadcastMsg.subscribe(data => {
      if (data.msg === 'initialMetadataLoadingCompleted') {
        this.zone.run(() => {
          setTimeout(() => this.initializeOrRefreshOverviewTable(), 250);
        });
      } else if (data.msg === 'initialMetadataLoadingFailed') {
        this.zone.run(() => { this.loadingData = false; });
      } else if (data.msg === 'refreshScriptOverviewTable') {
        this.zone.run(() => {
          const crudType = (data as any).values?.crudType;
          const scriptId = (data as any).values?.scriptId;
          this.refreshScriptOverviewTable(crudType, scriptId);
        });
      }
    });
    this.subscriptions.push(sub);

    // Try an initial build in case data is already present
    setTimeout(() => this.initializeOrRefreshOverviewTable(), 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if ((window as any).adminScriptManagementComponent === this) {
      delete (window as any).adminScriptManagementComponent;
    }
  }

  initializeOrRefreshOverviewTable(): void {
    this.loadingData = true;
    const scripts = this.kommonitorDataExchangeService?.availableProcessScripts || [];
    this.availableScriptDatasets = JSON.parse(JSON.stringify(scripts));

    try {
      this.kommonitorDataGridHelperService.buildDataGrid_scripts(this.availableScriptDatasets);
    } catch (e) {
      // ignore, keep loading flag reset below
    }
    this.loadingData = false;
  }

  refreshScriptOverviewTable(crudType?: string, targetScriptId?: string): void {
    this.loadingData = true;
    if (!crudType || !targetScriptId) {
      this.kommonitorDataExchangeService.fetchIndicatorScriptsMetadata(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles
      ).then(() => {
        this.initializeOrRefreshOverviewTable();
        this.loadingData = false;
      }).catch(() => {
        this.loadingData = false;
      });
      return;
    }

    if (crudType === 'add') {
      this.kommonitorDataExchangeService
        .addSingleProcessScriptMetadata(
          // Note: keep behavior consistent with legacy by fetching latest metadata first
          this.kommonitorDataExchangeService.getProcessScriptMetadataById?.(targetScriptId)
        );
      this.initializeOrRefreshOverviewTable();
      this.loadingData = false;
    } else if (crudType === 'edit') {
      // Replace with latest fetched metadata
      this.kommonitorDataExchangeService.replaceSingleProcessScriptMetadata(
        this.kommonitorDataExchangeService.getProcessScriptMetadataById?.(targetScriptId)
      );
      this.initializeOrRefreshOverviewTable();
      this.loadingData = false;
    } else if (crudType === 'delete') {
      if (Array.isArray(targetScriptId)) {
        for (const id of targetScriptId) {
          this.kommonitorDataExchangeService.deleteSingleProcessScriptMetadata(id);
        }
      } else {
        this.kommonitorDataExchangeService.deleteSingleProcessScriptMetadata(targetScriptId);
      }
      this.initializeOrRefreshOverviewTable();
      this.loadingData = false;
    } else {
      this.loadingData = false;
    }
  }

  onClickDeleteDatasets(): void {
    this.loadingData = true;
    let markedEntriesForDeletion: any[] = [];
    try {
      markedEntriesForDeletion = this.kommonitorDataGridHelperService.getSelectedScriptsMetadata();
    } catch {}
    // Broadcast to legacy AngularJS delete modal
    this.broadcastService.broadcast('onDeleteScripts', markedEntriesForDeletion);
    this.loadingData = false;
  }

  checkCreatePermission(): boolean {
    try { return !!this.kommonitorDataExchangeService.checkCreatePermission(); } catch { return false; }
  }

  checkDeletePermission(): boolean {
    try { return !!this.kommonitorDataExchangeService.checkDeletePermission(); } catch { return false; }
  }
}






