import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';
import CodeMirror from 'codemirror';

// CodeMirror module is not loaded properly (why?!), reload necessary files
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/xml/xml.js';

// import 'codemirror/addon/display/autoRefresh.js';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';

import { KommonitorFilterDataGridHelperService } from '../../../../../services/adminFilterConfig/kommonitor-data-grid-helper.service';
import { BroadcastService } from '../../../../../services/broadcast-service/broadcast.service';
import { BroadcastMessage } from '../../../../../services/broadcast-service/broadcast-message';
import { ConfigStorageService } from '../../../../../services/config-storage-service/config-storage.service';
import { GeoresourceMetadataStoreService } from '../../../../../services/georesource-metadata-store-service/georesource-metadata-store.service';
import { TopicMetadataStoreService } from '../../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { IndicatorMetadataStoreService } from '../../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';
import { ScriptHelperService } from '../../../../../services/script-helper-service/script-helper.service';
import { ExpandableBoxComponent } from '../../../common/expandable-box/expandable-box.component';
import { NotificationService } from '../../../common/notification/notification.service';
import { AdminContentViewComponent } from '../../admin-content-view/admin-content-view.component';
import { GlobalFilterEntry } from 'components/ngComponents/models/globalFilters.models';

@Component({
  selector: 'app-admin-filter-config',
  templateUrl: './admin-filter-config.component.html',
  styleUrls: ['./admin-filter-config.component.scss'],
  imports: [AgGridAngular, ExpandableBoxComponent, AdminContentViewComponent],
  standalone: true,
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

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  // AG Grid properties
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public gridOptions: GridOptions = {};
  public selectedRows: any[] = [];

  loadingData = true;
  codeMirrorEditor: any = undefined;
  lintingIssues;

  missingRequiredParameters = [];
  missingRequiredParameters_string = '';

  keywordsInConfig = [];

  filterConfigTemplate: any = undefined;
  filterConfigTmp: any = undefined;
  filterConfigCurrent: any = undefined;
  filterConfigNew: any = undefined;
  origConfig: any = undefined;
  mergedFilterConfig: any = undefined;

  configSettingInvalid = false;

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
      this.columnDefs = this.kommonitorDataGridHelperService.buildDataGridColumnConfig_filters(
        this.origConfig
      );
      this.rowData = this.kommonitorDataGridHelperService.buildDataGridRowData_filters(
        this.origConfig
      );

      // Force change detection
      setTimeout(() => {
        if (this.agGrid && this.agGrid.api) {
          this.agGrid.api.setRowData(this.rowData);
          this.agGrid.api.setColumnDefs(this.columnDefs);
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
    if (this.rowData && this.rowData.length > 0) {
      params.api.setRowData(this.rowData);
      params.api.setColumnDefs(this.columnDefs);
    } else {
      // If no data is available, try to load it
    }
  }

  onFirstDataRendered(): void {}

  onColumnResized(): void {
    // Column resized
  }

  onModelUpdated(_globalFilterArray: GlobalFilterEntry[]): void {}

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
      if (confirm('Wollen Sie den Filter ' + item[0].name + ' sicher dauerhaft löschen?')) {
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
              this.topicStore.availableTopics.filter(
                (e) => e.topicResource == 'indicator'
              ),
              indicatorTopicElement
            );
        });
        filter.georesourceTopics.forEach((georesourceTopicElement, georesourceTopicIndex) => {
          this.mergedFilterConfig[filterIndex].georesourceTopics[georesourceTopicIndex] =
            this.searchTopicRecursive(
              this.topicStore.availableTopics.filter(
                (e) => e.topicResource == 'georesource'
              ),
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
    //this.filterConfigCurrent = JSON.stringify(confNew, null, "    ");

    /* document.getElementById('filterConfig_current')!.innerHTML = 
      PR.prettyPrintOne(JSON.stringify(confNew, null, "    "),
      'javascript', true); */

    this.codeMirrorEditor.setValue(JSON.stringify(confNew, null, '    '));

    this.onChangeFilterConfig();
  }

  initCodeEditor() {
    this.codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById('filterConfigEditor'), {
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
    this.missingRequiredParameters = this.keywordsInConfig.filter(
      (keyword) => !configString.includes(keyword)
    );
    this.missingRequiredParameters_string = JSON.stringify(this.missingRequiredParameters);

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

    this.configSettingInvalid = this.isConfigSettingInvalid(configString);

    setTimeout(() => {
      this.filterConfigNew = configString;
    });

    setTimeout(() => {
      /*  document.getElementById('filterConfig_new')!.innerHTML = 
        PR.prettyPrintOne(this.filterConfigNew,
        'javascript', true); */
    }, 250);
  }

  async editFilterConfig() {
    setTimeout(() => {
      this.loadingData = true;
    });

    try {
      await this.kommonitorConfigStorageService.postFilterConfig(this.filterConfigTmp).subscribe({
        next: async (_response) => {
          this.notificationService.showSuccess('Filter-Konfiguration gespeichert.');
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
        'Speichern der Filter-Konfiguration gescheitert: ' +
          (error?.error?.message || error?.data || error?.message || 'Unbekannter Fehler'),
        { autohide: false }
      );
      this.loadingData = false;
    }
  }
}
