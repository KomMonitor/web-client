import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import CodeMirror from 'codemirror';
import { firstValueFrom, skip } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColDef, GridOptions, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';

import { GlobalFilterEntry } from 'components/ngComponents/models/globalFilters.models';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { KommonitorFilterDataGridHelperService } from '../../../../../services/adminFilterConfig/kommonitor-data-grid-helper.service';
import { BroadcastMessage } from '../../../../../services/broadcast-service/broadcast-message';
import { BroadcastService } from '../../../../../services/broadcast-service/broadcast.service';
import { ConfigStorageService } from '../../../../../services/config-storage-service/config-storage.service';
import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from '../../../../../services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from '../../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { TopicMetadataStoreService } from '../../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { ExpandableBoxComponent } from '../../../common/expandable-box/expandable-box.component';
import { NotificationService } from '../../../common/notification/notification.service';
import { AdminContentViewComponent } from '../../admin-content-view/admin-content-view.component';
import { ConfigEditorDescriptor } from '../configEditor/config-editor.model';
import { ConfigEditorPanesComponent } from '../configEditor/config-editor-panes.component';
import { AdminFilterEditModalComponent } from './adminFilterEditModal/admin-filter-edit-modal.component';

/** JSON indentation the filter config is stored and displayed with. */
const CONFIG_INDENT = '    ';

@Component({
  selector: 'app-admin-filter-config',
  templateUrl: './admin-filter-config.component.html',
  styleUrls: ['./admin-filter-config.component.scss'],
  imports: [
    TranslateModule,
    AgGridAngular,
    ExpandableBoxComponent,
    AdminContentViewComponent,
    ConfigEditorPanesComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFilterConfigComponent implements OnInit {
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private kommonitorConfigStorageService = inject(ConfigStorageService);
  private kommonitorDataGridHelperService = inject(KommonitorFilterDataGridHelperService);
  private httpClient = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private destroyRef = inject(DestroyRef);
  private envConfigService = inject(EnvConfigService);
  private translate = inject(TranslateService);
  private modalService = inject(NgbModal);
  private notificationService = inject(NotificationService);

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  // Resolves only after the first change detection: the content sits in an
  // <ng-template> that admin-content-view renders through an outlet.
  @ViewChild(ConfigEditorPanesComponent) configPanes?: ConfigEditorPanesComponent;

  // AG Grid properties
  // Signals: rebuilt from config fetches and broadcast callbacks (OnPush).
  public columnDefs = signal<ColDef[]>([]);
  public rowData = signal<any[]>([]);
  public gridOptions: GridOptions = {};
  public selectedRows: any[] = [];

  loadingData = true;
  origConfig: any = undefined;
  mergedFilterConfig: any = undefined;

  /**
   * The editor half of this page. Everything CodeMirror-related lives in
   * <app-config-editor-panes>; this only says what is specific to the filter
   * config. No required keywords: the config is a plain JSON array of filters,
   * so there is no key that has to be present — the JSON linter is the only
   * validation.
   */
  readonly descriptor: ConfigEditorDescriptor = {
    i18nPrefix: 'ADMIN_CONFIG.FILTER',
    mode: 'application/json',
    formatLabel: 'JSON',
    requiredKeywords: [],
    lint: (cm, options) => CodeMirror.lint.json(cm, options),
    loadTemplate: () =>
      firstValueFrom(
        this.httpClient.get('./config/filter-config_backup_forAdminViewExplanation.txt', {
          responseType: 'text',
        })
      ),
    // StartupService puts the active filter config into the runtime config.
    loadCurrent: async () => this.stringifyConfig(this.envConfigService.filterConfig),
    save: async (value) => {
      await firstValueFrom(this.kommonitorConfigStorageService.postFilterConfig(value));
      this.adoptSavedConfig(value);
      const stored = await firstValueFrom(this.kommonitorConfigStorageService.getFilterConfig());
      return this.stringifyConfig(stored);
    },
  };

  async ngOnInit() {
    // The editor panes fetch their own template and current config through the
    // descriptor; this is only the overview grid's data.
    this.kommonitorConfigStorageService.getFilterConfig().subscribe({
      next: (response) => {
        this.origConfig = response;

        this.initializeOrRefreshOverviewTable();
      },
    });

    // React to metadata loading completion. skip(1) drops the BehaviorSubject's
    // replayed current value so this keeps the original one-shot semantics of
    // the former broadcast event.
    this.metadataBootstrap.metadataLoading$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state === MetadataLoadingState.COMPLETE) {
          this.initialMetadataLoadingCompleted();
        }
      });

    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
      const values: any = broadcastMsg.values;

      switch (title) {
        case BroadcastMessage.OnGlobalFilterDelete:
          {
            this.onGlobalFilterDelete(values);
          }
          break;
        case BroadcastMessage.RefreshAdminFilterOverview:
          {
            this.refreshAdminFilterOverview();
          }
          break;
      }
    });
  }

  public initializeOrRefreshOverviewTable(): void {
    if (!this.origConfig) {
      // Data not ready yet, keep loading
      this.loadingData = true;
      return;
    }

    // An empty configuration is a valid state (the last filter was deleted) and
    // has to clear the grid rather than leave the removed rows on screen.
    this.loadingData = false;

    // The grid shows names, the configuration stores ids
    this.prepGlobalFilterData();

    // Set up grid options first
    this.setupGridOptions(this.mergedFilterConfig);

    // Use the data grid helper service to build column definitions and row data
    this.columnDefs.set(
      this.kommonitorDataGridHelperService.buildDataGridColumnConfig_filters(
        this.mergedFilterConfig
      )
    );
    this.rowData.set(
      this.kommonitorDataGridHelperService.buildDataGridRowData_filters(this.mergedFilterConfig)
    );

    // Force change detection
    setTimeout(() => {
      if (this.agGrid && this.agGrid.api) {
        this.agGrid.api.setGridOption('rowData', this.rowData());
        this.agGrid.api.setGridOption('columnDefs', this.columnDefs());
        this.agGrid.api.refreshCells();
      }
    }, 200);
  }

  private setupGridOptions(globalFilterArray: GlobalFilterEntry[]): void {
    this.gridOptions = {
      defaultColDef: {
        editable: false,
        cellDataType: false,
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
          this.kommonitorDataGridHelperService.displayEditButtons_filters,
      },
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 25, 50, 100],
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
        this.onModelUpdated(globalFilterArray);
      },
      onViewportChanged: () => {
        this.onViewportChanged(globalFilterArray);
      },
      onSelectionChanged: (event: SelectionChangedEvent) => {
        this.onSelectionChanged(event);
      },
    };
  }

  /**
   * Opens the filter wizard without a `selectedItem`, which puts it into add
   * mode. The modal broadcasts RefreshAdminFilterOverview after a successful
   * save, which refreshes the grid and the editor below.
   */
  onAddFilter() {
    this.modalService.open(AdminFilterEditModalComponent, {
      windowClass: 'modal-holder',
      size: 'xl',
      centered: true,
    });
  }

  // Grid event handlers
  onGridReady(params: GridReadyEvent): void {
    // If we have data, set it now
    if (this.rowData().length > 0) {
      params.api.setGridOption('rowData', this.rowData());
      params.api.setGridOption('columnDefs', this.columnDefs());
    } else {
      // If no data is available, try to load it
    }
  }

  onFirstDataRendered(): void {
    // no-op: no action required on first data render
  }

  onColumnResized(): void {
    // Column resized
  }

  onModelUpdated(_globalFilterArray: GlobalFilterEntry[]): void {
    // no-op: model updates need no handling here
  }

  onViewportChanged(_globalFilterArray: GlobalFilterEntry[]): void {
    /* setTimeout(() => {
      // MathJax rendering if available
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        (window as any).MathJax.typesetPromise().then(() => {
          // MathJax rendering completed
        });
      }
    }, 250); */
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    this.selectedRows = event.api.getSelectedRows();
  }

  // make sure that initial fetching of availableRoles has happened
  initialMetadataLoadingCompleted() {
    // The stores are filled now, so the ids in the configuration resolve to names
    this.initializeOrRefreshOverviewTable();
  }

  /**
   * Removes one filter from the stored configuration. `filterIndex` is the grid
   * row's `filterId`, i.e. the entry's position in the configuration array.
   */
  async onGlobalFilterDelete(filterIndex: number) {
    let storedConfig: any[];
    try {
      storedConfig = await this.fetchFilterConfig();
    } catch (error) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_CONFIG.FILTER.MSG.LOAD_FAILED', {
          error: this.describeError(error),
        })
      );
      return;
    }

    const item = storedConfig[filterIndex];
    if (!item) return;

    if (
      !confirm(
        this.translate.instant('ADMIN_CONFIG.FILTER.MSG.DELETE_CONFIRM', { name: item.name })
      )
    ) {
      return;
    }

    const configNew = storedConfig.filter((_entry, index) => index !== filterIndex);

    try {
      await firstValueFrom(
        this.kommonitorConfigStorageService.postFilterConfig(this.stringifyConfig(configNew))
      );
    } catch (error) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_CONFIG.FILTER.MSG.SAVE_FAILED', {
          error: this.describeError(error),
        })
      );
      return;
    }

    this.notificationService.showSuccess(
      this.translate.instant('ADMIN_CONFIG.FILTER.MSG.DELETED', { name: item.name })
    );

    await this.refreshAdminFilterOverview();
  }

  async refreshAdminFilterOverview() {
    this.origConfig = await this.fetchFilterConfig();
    this.initializeOrRefreshOverviewTable();

    await this.reloadCodeEditor();
  }

  /**
   * Projects the stored configuration onto the rows the grid displays: the
   * configuration holds ids, the table shows the corresponding names.
   *
   * This used to overwrite the id arrays of `mergedFilterConfig` in place, which
   * made it a one-shot operation — a second run would have looked the names up
   * as ids and blanked the table. Building a copy keeps `origConfig` the single
   * source of truth, so the rows can be rebuilt whenever the metadata stores
   * fill up or the configuration changes.
   */
  prepGlobalFilterData() {
    if (!this.origConfig) return;

    const indicatorTopics = this.topicStore.availableTopics.filter(
      (e) => e.topicResource == 'indicator'
    );
    const georesourceTopics = this.topicStore.availableTopics.filter(
      (e) => e.topicResource == 'georesource'
    );

    this.mergedFilterConfig = this.origConfig.map((filter, filterIndex) => ({
      ...filter,
      filterId: filterIndex,
      indicators: (filter.indicators ?? []).map(
        (indicatorId) =>
          this.indicatorStore.availableIndicators.find((e) => e.indicatorId == indicatorId)
            ?.indicatorName
      ),
      georesources: (filter.georesources ?? []).map(
        (georesourceId) =>
          this.georesourceStore.availableGeoresources.find((e) => e.georesourceId == georesourceId)
            ?.datasetName
      ),
      indicatorTopics: (filter.indicatorTopics ?? []).map((topicId) =>
        this.searchTopicRecursive(indicatorTopics, topicId)
      ),
      georesourceTopics: (filter.georesourceTopics ?? []).map((topicId) =>
        this.searchTopicRecursive(georesourceTopics, topicId)
      ),
    }));
  }

  searchTopicRecursive(topicsTree, itemId) {
    for (const elem of topicsTree) {
      if (elem.topicId == itemId) {
        return elem.topicName;
      } else {
        const subTopics = elem.subTopics ?? [];
        if (subTopics.length > 0) {
          const found = this.searchTopicRecursive(subTopics, itemId);
          if (found) return found;
        }
      }
    }
  }

  /**
   * Pushes the stored configuration back into the editor after this page
   * changed it outside the panes (filter deleted, filter added in the modal).
   */
  async reloadCodeEditor() {
    const confNew = await firstValueFrom(this.kommonitorConfigStorageService.getFilterConfig());
    this.configPanes?.setStoredConfig(this.stringifyConfig(confNew));
  }

  private stringifyConfig(config: unknown): string {
    return JSON.stringify(config, null, CONFIG_INDENT);
  }

  private async fetchFilterConfig(): Promise<any[]> {
    const response = await firstValueFrom(this.kommonitorConfigStorageService.getFilterConfig());
    return Array.isArray(response) ? response : [];
  }

  private describeError(error: any): string {
    return (
      error?.error?.message ??
      error?.message ??
      this.translate.instant('ADMIN_SHARED.UNKNOWN_ERROR')
    );
  }

  /** Rebuilds the overview grid from the configuration the panes just saved. */
  private adoptSavedConfig(savedValue: string): void {
    this.origConfig = JSON.parse(savedValue);

    this.initializeOrRefreshOverviewTable();
  }
}
