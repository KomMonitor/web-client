import { Component, DOCUMENT, inject, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { WmsSharedComponentsService } from 'components/ngComponents/common/wms-admin-table/wms-admin-tables-shared.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { WmsResourceType } from './../../models/services.models';

import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { WmsAdminTableComponent } from 'components/ngComponents/common/wms-admin-table/wms-admin-table.component';
import { Subscription } from 'rxjs';
import { KommonitorIndicatorCacheHelperService } from 'services/adminIndicatorUnit/kommonitor-cache-helper.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import { DataExchangeService } from '../../../../services/data-exchange-service/data-exchange.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { AccessControlService } from '../../../../services/access-control-service/access-control.service';
import { IndicatorMetadataStoreService } from '../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { EnvConfigService } from '../../../../services/env-config-service/env-config.service';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { IndicatorAddModalComponent } from './indicatorAddModal/indicator-add-modal.component';
import { IndicatorBatchUpdateModalComponent } from './indicatorBatchUpdateModal/indicator-batch-update-modal.component';
import { IndicatorDeleteModalComponent } from './indicatorDeleteModal/indicator-delete-modal.component';
import { IndicatorEditFeaturesModalComponent } from './indicatorEditFeaturesModal/indicator-edit-features-modal.component';
import { IndicatorEditIndicatorSpatialUnitRolesModalComponent } from './indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.component';
import { IndicatorEditMetadataModalComponent } from './indicatorEditMetadataModal/indicator-edit-metadata-modal.component';

declare const __env: any;

@Component({
  selector: 'app-admin-indicators-management',
  templateUrl: './admin-indicators-management.component.html',
  styleUrls: ['./admin-indicators-management.component.scss'],
  imports: [
    ExpandableBoxComponent,
    AgGridAngular,
    WmsAdminTableComponent,
    FormsModule,
    AdminContentViewComponent,
    NgbDropdownModule,
  ],
  standalone: true,
})
export class AdminIndicatorsManagementComponent implements OnInit, OnDestroy {
  private document = inject<Document>(DOCUMENT);
  private zone = inject(NgZone);
  private modalService = inject(NgbModal);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  private kommonitorCacheHelperService = inject(KommonitorIndicatorCacheHelperService);
  private kommonitorDataGridHelperService = inject(KommonitorIndicatorDataGridHelperService);
  protected wmsSharedComponentsService = inject(WmsSharedComponentsService);
  private envConfigService = inject(EnvConfigService);
  private dataExchangeService = inject(DataExchangeService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private accessControlService = inject(AccessControlService);
  private indicatorStore = inject(IndicatorMetadataStoreService);

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

  resourceType: WmsResourceType = WmsResourceType.INDICATOR;

  // Drag & Drop properties
  public collapsedTopics: Set<string> = new Set();
  public sortableConfig: any = {
    onEnd: (evt: any) => {
      const updatedIndicatorMetadataEntries = evt.models;

      // for those models send API request to persist new sort order
      const patchBody: Array<{ indicatorId: string; displayOrder: number }> = [];
      for (let index = 0; index < updatedIndicatorMetadataEntries.length; index++) {
        const indicatorMetadata = updatedIndicatorMetadataEntries[index];

        patchBody.push({
          indicatorId: indicatorMetadata.indicatorId,
          displayOrder: index,
        });
      }

      this.http
        .patch(
          this.envConfigService.baseUrlToKomMonitorDataAPI + '/indicators/display-order',
          patchBody
        )
        .subscribe({
          next: (_response: any) => {
            // Success - no action needed
          },
          error: (error: any) => {
            this.mapErrorNotificationService.displayMapApplicationError(error);
          },
        });
    },
  };
  private subscriptions: Subscription[] = [];

  WmsResourceType = WmsResourceType;

  ngOnInit(): void {
    // Initialize any adminLTE box widgets
    //(window as any).$('.box').boxWidget();

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
        this.ensureDataLoaded();
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

  private async ensureDataLoaded(): Promise<void> {
    // If no indicators are available, try to fetch them
    if (
      !this.indicatorStore.availableIndicators ||
      this.indicatorStore.availableIndicators.length === 0
    ) {
      try {
        await this.dataExchangeService.fetchIndicatorsMetadata(
          this.accessControlService.currentKeycloakLoginRoles
        );
        // Force refresh the table after data is loaded
        setTimeout(() => {
          this.forceRefreshGrid();
        }, 100);
      } catch (error) {
        console.error('Error fetching indicators:', error);
      }
    }
  }

  private forceRefreshGrid(): void {
    const indicators = this.getFilteredIndicators();

    if (indicators && indicators.length > 0) {
      this.columnDefs =
        this.kommonitorDataGridHelperService.buildDataGridColumnConfig_indicators(indicators);
      this.rowData =
        this.kommonitorDataGridHelperService.buildDataGridRowData_indicators(indicators);

      // Update the grid if it's ready
      if (this.agGrid && this.agGrid.api) {
        this.agGrid.api.setRowData(this.rowData);
        this.agGrid.api.setColumnDefs(this.columnDefs);
        this.agGrid.api.refreshCells();
        this.loadingData = false;
        this.initializationCompleted = true;
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Clean up global reference
    if ((window as any).adminIndicatorsComponent === this) {
      delete (window as any).adminIndicatorsComponent;
    }
  }

  private setupEventListeners(): void {
    // Listen for the global metadata loading completion event
    const sub = this.broadcastService.currentBroadcastMsg.subscribe((data) => {
      if (data.msg === 'initialMetadataLoadingCompleted') {
        this.zone.run(() => {
          setTimeout(() => {
            this.initializeOrRefreshOverviewTable();
            // Also ensure topics are collapsed when metadata is loaded
            this.initializeCollapsedTopics();
          }, 250);
        });
      } else if (data.msg === 'initialMetadataLoadingFailed') {
        this.zone.run(() => {
          this.loadingData = false;
        });
      } else if (data.msg === 'refreshIndicatorOverviewTable') {
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
      } else if (data.msg === 'onEditIndicatorFeatures') {
        this.zone.run(() => {
          this.onClickEditFeatures(data.values);
        });
      } else if (data.msg === 'onDeleteIndicators') {
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
        this.onClickEditIndicatorSpatialUnitRoles(event.detail.values);
      });
    };

    // Add event listeners
    document.addEventListener('onEditIndicatorMetadata', handleEditMetadata as EventListener);
    document.addEventListener('onEditIndicatorFeatures', handleEditFeatures as EventListener);
    document.addEventListener(
      'onEditIndicatorSpatialUnitRoles',
      handleEditUserRoles as EventListener
    );

    // Store references for cleanup
    const customEventSubscription = {
      unsubscribe: () => {
        document.removeEventListener(
          'onEditIndicatorMetadata',
          handleEditMetadata as EventListener
        );
        document.removeEventListener(
          'onEditIndicatorFeatures',
          handleEditFeatures as EventListener
        );
        document.removeEventListener(
          'onEditIndicatorSpatialUnitRoles',
          handleEditUserRoles as EventListener
        );
      },
    } as any;
    this.subscriptions.push(customEventSubscription);
  }

  public initializeOrRefreshOverviewTable(): void {
    const indicators = this.getFilteredIndicators();

    if (indicators && indicators.length > 0) {
      this.loadingData = false;
      this.initializationCompleted = true;

      // Initialize all topics as collapsed
      this.initializeCollapsedTopics();

      // Set up grid options first
      this.setupGridOptions(indicators);

      // Use the data grid helper service to build column definitions and row data
      this.columnDefs =
        this.kommonitorDataGridHelperService.buildDataGridColumnConfig_indicators(indicators);
      this.rowData =
        this.kommonitorDataGridHelperService.buildDataGridRowData_indicators(indicators);

      // Force change detection
      setTimeout(() => {
        if (this.agGrid && this.agGrid.api) {
          this.agGrid.api.setRowData(this.rowData);
          this.agGrid.api.setColumnDefs(this.columnDefs);
          this.agGrid.api.refreshCells();
        }
      }, 100);
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
          'line-height': '20px !important',
          'word-break': 'break-word !important',
          'padding-top': '17px',
          'padding-bottom': '17px',
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
        displayEditButtons_indicators:
          this.kommonitorDataGridHelperService.displayEditButtons_indicators,
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
      },
    };
  }

  // Grid event handlers
  onGridReady(params: GridReadyEvent): void {
    // If we have data, set it now
    if (this.rowData && this.rowData.length > 0) {
      params.api.setRowData(this.rowData);
      params.api.setColumnDefs(this.columnDefs);
    } else {
      // If no data is available, try to load it
      if (
        !this.indicatorStore.availableIndicators ||
        this.indicatorStore.availableIndicators.length === 0
      ) {
        this.ensureDataLoaded();
      } else {
        this.forceRefreshGrid();
      }
    }
  }

  onFirstDataRendered(): void {}

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
    const allIndicators = this.indicatorStore.availableIndicators;

    if (this.tableViewSwitcher) {
      // Filter out indicators where user only has viewer permission
      const filtered = allIndicators.filter(
        (e) =>
          !(
            e.userPermissions &&
            e.userPermissions.length === 1 &&
            e.userPermissions.includes('viewer')
          )
      );
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
    try {
      const modalRef = this.modalService.open(IndicatorAddModalComponent, {
        backdrop: true,
        keyboard: false,
        container: 'body',
        animation: false,
        modalDialogClass: 'modal-large',
        windowClass: 'modal-large',
      });

      modalRef.result
        .then((result) => {
          if (result) {
            // Modal was closed successfully, refresh the table
            this.initializeOrRefreshOverviewTable();
          }
        })
        .catch((_error) => {
          // Modal dismissed
        });
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  }

  onClickEditMetadata(indicatorMetadata: any): void {
    try {
      const modalRef = this.modalService.open(IndicatorEditMetadataModalComponent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        container: 'body',
        animation: false,
      });

      // Set the current indicator dataset in the modal component
      const modalComponent = modalRef.componentInstance as IndicatorEditMetadataModalComponent;
      modalComponent.currentIndicatorDataset = indicatorMetadata;
      modalComponent.resetIndicatorEditMetadataForm();

      modalRef.result
        .then((result) => {
          if (result) {
            // Modal was closed successfully, refresh the table
            this.initializeOrRefreshOverviewTable();
          }
        })
        .catch((_error) => {
          // Modal dismissed
        });
    } catch (error) {
      console.error('Error opening edit metadata modal:', error);
    }
  }

  onClickEditFeatures(indicatorMetadata: any): void {
    try {
      const modalRef = this.modalService.open(IndicatorEditFeaturesModalComponent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        container: 'body',
        animation: false,
      });

      const modalComponent = modalRef.componentInstance as IndicatorEditFeaturesModalComponent;
      modalComponent.openModal(indicatorMetadata);

      modalRef.result
        .then((result) => {
          if (result) {
            // Modal was closed successfully, refresh the table
            this.initializeOrRefreshOverviewTable();
          }
        })
        .catch((_error) => {
          // Modal dismissed
        });
    } catch (error) {
      console.error('Error opening edit features modal:', error);
    }
  }

  onClickEditIndicatorSpatialUnitRoles(indicatorMetadata: any): void {
    try {
      const modalRef = this.modalService.open(
        IndicatorEditIndicatorSpatialUnitRolesModalComponent,
        {
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
          container: 'body',
          animation: false,
        }
      );

      const modalComponent =
        modalRef.componentInstance as IndicatorEditIndicatorSpatialUnitRolesModalComponent;
      modalComponent.openModal(indicatorMetadata);

      modalRef.result
        .then((result) => {
          if (result) {
            this.initializeOrRefreshOverviewTable();
          }
        })
        .catch((_error) => {
          // Modal dismissed
        });
    } catch (error) {
      console.error('Error opening edit indicator spatial unit roles modal:', error);
    }
  }

  onClickDeleteIndicators(indicatorsMetadata: any[]): void {
    if (indicatorsMetadata.length === 1) {
      // Open the Angular delete modal for single indicator
      this.openDeleteIndicatorModal(indicatorsMetadata[0]);
    } else {
      // For multiple indicators, we might need to handle differently
      // For now, just open the modal with the first indicator
      console.log('Multiple indicators delete not yet supported');
    }
  }

  openDeleteIndicatorModal(indicatorDataset: any): void {
    const modalRef = this.modalService.open(IndicatorDeleteModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false,
    });

    // Set the selected indicator in the modal
    modalRef.componentInstance.selectedIndicatorDataset = indicatorDataset;
    modalRef.componentInstance.onChangeSelectedIndicator();

    modalRef.result
      .then((_result) => {
        // Delete modal closed with result
      })
      .catch((_error) => {
        // Delete modal dismissed
      });
  }

  onClickBatchUpdate(): void {
    try {
      const modalRef = this.modalService.open(IndicatorBatchUpdateModalComponent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        container: 'body',
        animation: false,
      });

      // Pass the modal reference to the component
      const modalComponent = modalRef.componentInstance as IndicatorBatchUpdateModalComponent;
      modalComponent.modalRef = modalRef;

      modalRef.result
        .then((result) => {
          if (result) {
            // Modal was closed successfully, refresh the table
            this.initializeOrRefreshOverviewTable();
          }
        })
        .catch((_error) => {
          // Modal dismissed
        });
    } catch (error) {
      console.error('Error opening batch update modal:', error);
    }
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
      this.dataExchangeService
        .fetchIndicatorsMetadata(this.accessControlService.currentKeycloakLoginRoles)
        .then((_response: any) => {
          this.initializeOrRefreshOverviewTable();
          this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
          this.loadingData = false;
        })
        .catch((_response: any) => {
          this.loadingData = false;
          this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
        });
    } else if (crudType && targetIndicatorId) {
      if (crudType === 'add') {
        this.kommonitorCacheHelperService
          .fetchSingleIndicatorMetadata(
            targetIndicatorId,
            this.accessControlService.currentKeycloakLoginRoles
          )
          .then((data: any) => {
            this.indicatorStore.addSingleIndicatorMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
            this.loadingData = false;
          })
          .catch((_response: any) => {
            this.loadingData = false;
            this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
          });
      } else if (crudType === 'edit') {
        this.kommonitorCacheHelperService
          .fetchSingleIndicatorMetadata(
            targetIndicatorId,
            this.accessControlService.currentKeycloakLoginRoles
          )
          .then((data: any) => {
            this.indicatorStore.replaceSingleIndicatorMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
            this.loadingData = false;
          })
          .catch((_response: any) => {
            this.loadingData = false;
            this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
          });
      } else if (crudType === 'delete') {
        this.indicatorStore.deleteSingleIndicatorMetadata(targetIndicatorId);
        this.initializeOrRefreshOverviewTable();
        this.broadcastService.broadcast('refreshIndicatorOverviewTableCompleted');
        this.loadingData = false;
      }
    }
  }

  // Utility methods
  checkCreatePermission(): boolean {
    return this.accessControlService.checkCreatePermission();
  }

  checkEditorPermission(): boolean {
    return this.accessControlService.checkEditorPermission();
  }

  checkDeletePermission(): boolean {
    return this.accessControlService.checkDeletePermission();
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

  // Getter to check if we have topic hierarchy data
  get hasTopicData(): boolean {
    return (
      this.metadataBootstrap.topicIndicatorHierarchy_forOrderView &&
      this.metadataBootstrap.topicIndicatorHierarchy_forOrderView.length > 0
    );
  }

  // Drag & Drop methods
  initializeCollapsedTopics(): void {
    // Clear existing collapsed topics
    this.collapsedTopics.clear();

    // Initialize all topics as collapsed by default
    if (
      this.metadataBootstrap.topicIndicatorHierarchy_forOrderView &&
      this.metadataBootstrap.topicIndicatorHierarchy_forOrderView.length > 0
    ) {
      this.metadataBootstrap.topicIndicatorHierarchy_forOrderView.forEach((mainTopic: any) => {
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
    if (
      !this.metadataBootstrap.topicIndicatorHierarchy_forOrderView ||
      this.metadataBootstrap.topicIndicatorHierarchy_forOrderView.length === 0
    ) {
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
    const patchBody: Array<{ indicatorId: string; displayOrder: number }> = [];
    for (let index = 0; index < indicators.length; index++) {
      const indicatorMetadata = indicators[index];
      patchBody.push({
        indicatorId: indicatorMetadata.indicatorId,
        displayOrder: index,
      });
    }

    // Send API request to persist new sort order
    this.http
      .patch(
        this.envConfigService.baseUrlToKomMonitorDataAPI + '/indicators/display-order',
        patchBody
      )
      .subscribe({
        next: (_response: any) => {
          // Display order updated successfully
        },
        error: (error: any) => {
          this.mapErrorNotificationService.displayMapApplicationError(error);
        },
      });
  }
}
