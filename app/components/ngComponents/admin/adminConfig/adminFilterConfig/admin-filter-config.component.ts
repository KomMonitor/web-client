import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import CodeMirror from 'codemirror';
import { skip } from 'rxjs';

// CodeMirror module is not loaded properly (why?!), reload necessary files
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/xml/xml.js';

// import 'codemirror/addon/display/autoRefresh.js';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
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
import { ScriptHelperService } from '../../../../../services/script-helper-service/script-helper.service';
import { TopicMetadataStoreService } from '../../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { ExpandableBoxComponent } from '../../../common/expandable-box/expandable-box.component';
import { NotificationService } from '../../../common/notification/notification.service';
import { AdminContentViewComponent } from '../../admin-content-view/admin-content-view.component';

@Component({
  selector: 'app-admin-filter-config',
  templateUrl: './admin-filter-config.component.html',
  styleUrls: ['./admin-filter-config.component.scss'],
  imports: [TranslateModule, AgGridAngular, ExpandableBoxComponent, AdminContentViewComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFilterConfigComponent implements OnInit {
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private kommonitorScriptHelperService = inject(ScriptHelperService);
  private kommonitorConfigStorageService = inject(ConfigStorageService);
  private kommonitorDataGridHelperService = inject(KommonitorFilterDataGridHelperService);
  private httpClient = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private destroyRef = inject(DestroyRef);
  private envConfigService = inject(EnvConfigService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  // Resolves only after the first change detection: the content sits in an
  // <ng-template> that admin-content-view renders through an outlet.
  @ViewChild('filterConfigEditor') filterConfigEditor!: ElementRef;

  // AG Grid properties
  // Signals: rebuilt from config fetches and broadcast callbacks (OnPush).
  public columnDefs = signal<ColDef[]>([]);
  public rowData = signal<any[]>([]);
  public gridOptions: GridOptions = {};
  public selectedRows: any[] = [];

  loadingData = true;
  codeMirrorEditor: any = undefined;
  lintingIssues;

  // Signals: written from CodeMirror lint callbacks, which run outside
  // Angular's template-event path (OnPush).
  missingRequiredParameters = signal<string[]>([]);
  missingRequiredParameters_string = signal('');

  keywordsInConfig = [];

  filterConfigTemplate: any = undefined;
  filterConfigTmp: any = undefined;
  filterConfigCurrent: any = undefined;
  filterConfigNew: any = undefined;
  origConfig: any = undefined;
  mergedFilterConfig: any = undefined;

  configSettingInvalid = signal(false);

  async ngOnInit() {
    this.httpClient
      .get('./config/filter-config_backup_forAdminViewExplanation.txt', {
        responseType: 'text',
      })
      .subscribe({
        next: (response) => {
          this.filterConfigTemplate = response;

          this.kommonitorScriptHelperService.prettifyScriptCodePreview(
            'filterConfig_backupTemplate'
          );
        },
      });

    // set in app.js
    this.filterConfigTmp = JSON.stringify(this.envConfigService.filterConfig, null, '    ');
    this.filterConfigCurrent = JSON.stringify(this.envConfigService.filterConfig, null, '    ');
    this.filterConfigNew = JSON.stringify(this.envConfigService.filterConfig, null, '    ');
    this.kommonitorScriptHelperService.prettifyScriptCodePreview('filterConfig_current');

    this.kommonitorConfigStorageService.getFilterConfig().subscribe({
      next: (response) => {
        this.origConfig = response;
        this.mergedFilterConfig = response;

        this.initCodeEditor();
        this.initializeOrRefreshOverviewTable();

        this.onChangeFilterConfig();
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
        case 'onGlobalFilterDelete':
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
    if (this.origConfig && this.origConfig.length > 0) {
      this.loadingData = false;

      // Set up grid options first
      this.setupGridOptions(this.origConfig);

      // Use the data grid helper service to build column definitions and row data
      this.columnDefs.set(
        this.kommonitorDataGridHelperService.buildDataGridColumnConfig_filters(this.origConfig)
      );
      this.rowData.set(
        this.kommonitorDataGridHelperService.buildDataGridRowData_filters(this.origConfig)
      );

      // Force change detection
      setTimeout(() => {
        if (this.agGrid && this.agGrid.api) {
          this.agGrid.api.setGridOption('rowData', this.rowData());
          this.agGrid.api.setGridOption('columnDefs', this.columnDefs());
          this.agGrid.api.refreshCells();
        }
      }, 200);
    } else {
      // Data not ready yet, keep loading
      this.loadingData = true;
    }
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

  onAddFilter() {
    this.broadcastService.broadcast(BroadcastMessage.OnOpenAddFilterModal);
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
    this.prepGlobalFilterData();
    this.initializeOrRefreshOverviewTable();
  }

  async onGlobalFilterDelete([itemId]) {
    console.log('delete', itemId);

    this.origConfig = await this.kommonitorConfigStorageService.getFilterConfig();

    const item = this.mergedFilterConfig.filter((e) => e.filterId == itemId);
    if (item.length == 1) {
      if (
        confirm(
          this.translate.instant('ADMIN_CONFIG.FILTER.MSG.DELETE_CONFIRM', { name: item[0].name })
        )
      ) {
        const configNew = this.origConfig
          .filter((e, i) => i != itemId)
          .map((e) => {
            delete e.filterId;
            return e;
          });

        await this.kommonitorConfigStorageService.postFilterConfig(
          JSON.stringify(configNew, null, '    ')
        );

        this.origConfig = await this.kommonitorConfigStorageService.getFilterConfig();
        this.mergedFilterConfig = configNew;

        setTimeout(() => {
          this.prepGlobalFilterData();
          this.initializeOrRefreshOverviewTable();
        }, 250);

        setTimeout(() => {
          this.reloadCodeEditor();
        }, 1000);
      }
    } else console.log('Filter id not found');
  }

  async refreshAdminFilterOverview() {
    this.origConfig = await this.kommonitorConfigStorageService.getFilterConfig();
    this.mergedFilterConfig = this.origConfig;
    setTimeout(() => {
      this.prepGlobalFilterData();
      this.initializeOrRefreshOverviewTable();
    }, 250);

    setTimeout(() => {
      this.reloadCodeEditor();
    }, 1000);
  }

  prepGlobalFilterData() {
    if (this.mergedFilterConfig) {
      this.mergedFilterConfig.forEach((filter, filterIndex) => {
        this.mergedFilterConfig[filterIndex].filterId = filterIndex;

        filter.indicators.forEach((indicatorElement, indicatorIndex) => {
          this.mergedFilterConfig[filterIndex].indicators[indicatorIndex] =
            this.indicatorStore.availableIndicators
              .filter((e) => e.indicatorId == indicatorElement)
              .map((e) => e.indicatorName)[0];
        });
        filter.georesources.forEach((georesourceElement, georesourceIndex) => {
          this.mergedFilterConfig[filterIndex].georesources[georesourceIndex] =
            this.georesourceStore.availableGeoresources
              .filter((e) => e.georesourceId == georesourceElement)
              .map((e) => e.datasetName)[0];
        });

        filter.indicatorTopics.forEach((indicatorTopicElement, indicatorTopicIndex) => {
          this.mergedFilterConfig[filterIndex].indicatorTopics[indicatorTopicIndex] =
            this.searchTopicRecursive(
              this.topicStore.availableTopics.filter((e) => e.topicResource == 'indicator'),
              indicatorTopicElement
            );
        });
        filter.georesourceTopics.forEach((georesourceTopicElement, georesourceTopicIndex) => {
          this.mergedFilterConfig[filterIndex].georesourceTopics[georesourceTopicIndex] =
            this.searchTopicRecursive(
              this.topicStore.availableTopics.filter((e) => e.topicResource == 'georesource'),
              georesourceTopicElement
            );
        });
      });
    }
  }

  searchTopicRecursive(topicsTree, itemId) {
    for (const elem of topicsTree) {
      if (elem.topicId == itemId) {
        return elem.topicName;
      } else {
        if (elem.subTopics.length > 0) {
          const found = this.searchTopicRecursive(elem.subTopics, itemId);
          if (found) return found;
        }
      }
    }
  }

  async reloadCodeEditor() {
    const confNew = await this.kommonitorConfigStorageService.getFilterConfig();
    this.codeMirrorEditor.setValue(JSON.stringify(confNew, null, '    '));

    this.onChangeFilterConfig();
  }

  initCodeEditor() {
    if (!this.filterConfigEditor?.nativeElement) {
      console.error('Could not find filterConfigEditor element');
      return;
    }

    this.codeMirrorEditor = CodeMirror.fromTextArea(this.filterConfigEditor.nativeElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode: 'application/json',
      gutters: ['CodeMirror-lint-markers'],
      lint: {
        getAnnotations: this.validateCode,
        async: true,
      },
    });

    this.codeMirrorEditor.setSize(null, 300);

    this.codeMirrorEditor.on('change', (_cMirror) => {
      // get value right from instance
      this.filterConfigTmp = this.codeMirrorEditor.getValue();
    });

    this.codeMirrorEditor.setValue(this.filterConfigCurrent);
  }

  validateCode(cm, updateLinting, options) {
    // call the built in css linter from addon/lint/css-lint.js
    try {
      this.lintingIssues = CodeMirror.lint.json(cm, options);

      updateLinting(this.lintingIssues);
    } catch (error) {
      console.error('Error while linting filter config json code. Error is: \n' + error);
    }

    this.onChangeFilterConfig();
  }

  async resetDefaultConfig() {
    this.filterConfigCurrent = this.filterConfigTemplate;
    this.filterConfigNew = this.filterConfigTemplate;
    this.filterConfigTmp = this.filterConfigTemplate;

    this.onChangeFilterConfig();

    // update config on server
    this.editFilterConfig();

    this.codeMirrorEditor.setValue(this.filterConfigCurrent);
  }

  isConfigSettingInvalid(configString) {
    let isInvalid = true;

    isInvalid = !this.keywordsInConfig.every((keyword) => configString.includes(keyword));
    this.missingRequiredParameters.set(
      this.keywordsInConfig.filter((keyword) => !configString.includes(keyword))
    );
    this.missingRequiredParameters_string.set(JSON.stringify(this.missingRequiredParameters()));

    if (this.lintingIssues && this.lintingIssues.length > 0) {
      isInvalid = true;
    }

    return isInvalid;
  }

  onChangeFilterConfig() {
    // check by searching for keywords

    let configString = this.filterConfigTmp;

    if (typeof configString === 'object' && configString !== null) {
      configString = JSON.stringify(configString, null, '    ');
    }

    this.configSettingInvalid.set(this.isConfigSettingInvalid(configString));

    setTimeout(() => {
      this.filterConfigNew = configString;
    });
  }

  async editFilterConfig() {
    setTimeout(() => {
      this.loadingData = true;
    });

    try {
      await this.kommonitorConfigStorageService.postFilterConfig(this.filterConfigTmp).subscribe({
        next: async (_response) => {
          this.notificationService.showSuccess(
            this.translate.instant('ADMIN_CONFIG.FILTER.MSG.SAVED')
          );
          this.loadingData = false;

          this.filterConfigCurrent = this.filterConfigTmp;

          setTimeout(() => {
            this.origConfig = JSON.parse(this.filterConfigTmp);
            this.mergedFilterConfig = JSON.parse(this.filterConfigTmp);

            this.prepGlobalFilterData();
            this.initializeOrRefreshOverviewTable();
          }, 250);
        },
      });
    } catch (error: any) {
      console.error('Error editing filter config:', error);
      this.notificationService.showError(
        this.translate.instant('ADMIN_CONFIG.FILTER.MSG.SAVE_FAILED', {
          error:
            error?.error?.message ||
            error?.data ||
            error?.message ||
            this.translate.instant('ADMIN_SHARED.UNKNOWN_ERROR'),
        }),
        { autohide: false }
      );
      this.loadingData = false;
    }
  }
}
