import { Component, OnInit, ViewChild } from "@angular/core";
import { ConfigStorageService } from "services/config-storage-service/config-storage.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { ScriptHelperService } from "services/script-helper-service/script-helper.service";
import CodeMirror from "codemirror";

// CodeMirror module is not loaded properly (why?!), reload necessary files
import "codemirror/mode/xml/xml.js";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/css/css.js";
import "codemirror/mode/htmlmixed/htmlmixed.js";

// import 'codemirror/addon/display/autoRefresh.js';
import { HttpClient } from "@angular/common/http";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { AgGridAngular } from "ag-grid-angular";
import {
  ColDef,
  GridOptions,
  GridReadyEvent,
  SelectionChangedEvent,
} from "ag-grid-community";
import { KommonitorFilterDataGridHelperService } from "services/adminFilterConfig/kommonitor-data-grid-helper.service";
import { GlobalFilterEntry } from "components/ngComponents/models/globalFilters.models";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { CommonModule } from "@angular/common";
import { AdminContentViewComponent } from "../../admin-content-view/admin-content-view.component";

@Component({
  selector: "app-admin-filter-config",
  templateUrl: "./admin-filter-config.component.html",
  styleUrls: ["./admin-filter-config.component.css"],
  imports: [
    AgGridAngular,
    ExpandableBoxComponent,
    CommonModule,
    AdminContentViewComponent,
  ],
  standalone: true,
})
export class AdminFilterConfigComponent implements OnInit {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  // AG Grid properties
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public gridOptions: GridOptions = {};
  public selectedRows: any[] = [];

  // initialize any adminLTE box widgets
  //$('.box').boxWidget();

  loadingData = true;
  codeMirrorEditor: any = undefined;
  lintingIssues;

  missingRequiredParameters = [];
  missingRequiredParameters_string = "";

  keywordsInConfig = [];

  filterConfigTemplate: any = undefined;
  filterConfigTmp: any = undefined;
  filterConfigCurrent: any = undefined;
  filterConfigNew: any = undefined;
  origConfig: any = undefined;
  mergedFilterConfig: any = undefined;

  configSettingInvalid = false;

  errorMessagePart;

  constructor(
    private kommonitorDataExchangeService: DataExchangeService,
    private kommonitorScriptHelperService: ScriptHelperService,
    private kommonitorConfigStorageService: ConfigStorageService,
    private kommonitorDataGridHelperService: KommonitorFilterDataGridHelperService,
    private httpClient: HttpClient,
    private broadcastService: BroadcastService,
    private envConfigService: EnvConfigService,
  ) {}

  async ngOnInit() {
    this.httpClient
      .get("./config/filter-config_backup_forAdminViewExplanation.txt", {
        responseType: "text",
      })
      .subscribe({
        next: (response) => {
          this.filterConfigTemplate = response;

          this.kommonitorScriptHelperService.prettifyScriptCodePreview(
            "filterConfig_backupTemplate",
          );
        },
      });

    // set in app.js
    this.filterConfigTmp = JSON.stringify(
      this.envConfigService.filterConfig,
      null,
      "    ",
    );
    this.filterConfigCurrent = JSON.stringify(
      this.envConfigService.filterConfig,
      null,
      "    ",
    );
    this.filterConfigNew = JSON.stringify(
      this.envConfigService.filterConfig,
      null,
      "    ",
    );
    this.kommonitorScriptHelperService.prettifyScriptCodePreview(
      "filterConfig_current",
    );

    this.kommonitorConfigStorageService.getFilterConfig().subscribe({
      next: (response) => {
        this.origConfig = response;
        this.mergedFilterConfig = response;

        this.initCodeEditor();
        this.initializeOrRefreshOverviewTable();

        this.onChangeFilterConfig();
      },
    });

    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      let title = broadcastMsg.msg;
      let values: any = broadcastMsg.values;

      switch (title) {
        case "initialMetadataLoadingCompleted":
          {
            this.initialMetadataLoadingCompleted();
          }
          break;
        case "onGlobalFilterDelete":
          {
            this.onGlobalFilterDelete(values);
          }
          break;
        case "refreshAdminFilterOverview":
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
      this.columnDefs =
        this.kommonitorDataGridHelperService.buildDataGridColumnConfig_filters(
          this.origConfig,
        );
      this.rowData =
        this.kommonitorDataGridHelperService.buildDataGridRowData_filters(
          this.origConfig,
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
          "font-size": "12px;",
          "white-space": "normal !important",
          "line-height": "20px !important",
          "word-break": "break-word !important",
          "padding-top": "17px",
          "padding-bottom": "17px",
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
            "  </div>" +
            "</div>",
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
      rowSelection: "multiple",
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
    this.broadcastService.broadcast("onOpenAddFilterModal");
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

  onModelUpdated(globalFilterArray: GlobalFilterEntry[]): void {}

  onViewportChanged(globalFilterArray: GlobalFilterEntry[]): void {
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
    console.log("delete", itemId);

    this.origConfig =
      await this.kommonitorConfigStorageService.getFilterConfig();

    let item = this.mergedFilterConfig.filter((e) => e.filterId == itemId);
    if (item.length == 1) {
      if (
        confirm(
          "Wollen Sie den Filter " +
            item[0].name +
            " sicher dauerhaft löschen?",
        )
      ) {
        let configNew = this.origConfig
          .filter((e, i) => i != itemId)
          .map((e) => {
            delete e.filterId;
            return e;
          });
        var addConfigResponse =
          await this.kommonitorConfigStorageService.postFilterConfig(
            JSON.stringify(configNew, null, "    "),
          );

        this.origConfig =
          await this.kommonitorConfigStorageService.getFilterConfig();
        this.mergedFilterConfig = configNew;

        setTimeout(() => {
          this.prepGlobalFilterData();
          this.initializeOrRefreshOverviewTable();
        }, 250);

        setTimeout(() => {
          this.reloadCodeEditor();
        }, 1000);
      }
    } else console.log("Filter id not found");
  }

  async refreshAdminFilterOverview() {
    this.origConfig =
      await this.kommonitorConfigStorageService.getFilterConfig();
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
            this.kommonitorDataExchangeService.availableIndicators
              .filter((e) => e.indicatorId == indicatorElement)
              .map((e) => e.indicatorName)[0];
        });
        filter.georesources.forEach((georesourceElement, georesourceIndex) => {
          this.mergedFilterConfig[filterIndex].georesources[georesourceIndex] =
            this.kommonitorDataExchangeService.availableGeoresources
              .filter((e) => e.georesourceId == georesourceElement)
              .map((e) => e.datasetName)[0];
        });

        filter.indicatorTopics.forEach(
          (indicatorTopicElement, indicatorTopicIndex) => {
            this.mergedFilterConfig[filterIndex].indicatorTopics[
              indicatorTopicIndex
            ] = this.searchTopicRecursive(
              this.kommonitorDataExchangeService.availableTopics.filter(
                (e) => e.topicResource == "indicator",
              ),
              indicatorTopicElement,
            );
          },
        );
        filter.georesourceTopics.forEach(
          (georesourceTopicElement, georesourceTopicIndex) => {
            this.mergedFilterConfig[filterIndex].georesourceTopics[
              georesourceTopicIndex
            ] = this.searchTopicRecursive(
              this.kommonitorDataExchangeService.availableTopics.filter(
                (e) => e.topicResource == "georesource",
              ),
              georesourceTopicElement,
            );
          },
        );
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
    let confNew = await this.kommonitorConfigStorageService.getFilterConfig();
    //this.filterConfigCurrent = JSON.stringify(confNew, null, "    ");

    /* document.getElementById('filterConfig_current')!.innerHTML = 
      PR.prettyPrintOne(JSON.stringify(confNew, null, "    "),
      'javascript', true); */

    this.codeMirrorEditor.setValue(JSON.stringify(confNew, null, "    "));

    this.onChangeFilterConfig();
  }

  initCodeEditor() {
    this.codeMirrorEditor = CodeMirror.fromTextArea(
      document.getElementById("filterConfigEditor"),
      {
        lineNumbers: true,
        autoRefresh: true,
        mode: "application/json",
        gutters: ["CodeMirror-lint-markers"],
        lint: {
          getAnnotations: this.validateCode,
          async: true,
        },
      },
    );

    this.codeMirrorEditor.setSize(null, 300);

    this.codeMirrorEditor.on("change", (cMirror) => {
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
      console.error(
        "Error while linting filter config json code. Error is: \n" + error,
      );
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
    var isInvalid = true;

    isInvalid = !this.keywordsInConfig.every((keyword) =>
      configString.includes(keyword),
    );
    this.missingRequiredParameters = this.keywordsInConfig.filter(
      (keyword) => !configString.includes(keyword),
    );
    this.missingRequiredParameters_string = JSON.stringify(
      this.missingRequiredParameters,
    );

    if (this.lintingIssues && this.lintingIssues.length > 0) {
      isInvalid = true;
    }

    return isInvalid;
  }

  onChangeFilterConfig() {
    // check by searching for keywords

    var configString = this.filterConfigTmp;

    if (typeof configString === "object" && configString !== null) {
      configString = JSON.stringify(configString, null, "    ");
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

    this.errorMessagePart = undefined;

    try {
      var addConfigResponse = await this.kommonitorConfigStorageService
        .postFilterConfig(this.filterConfigTmp)
        .subscribe({
          next: async (response) => {
            $("#filterConfigEditSuccessAlert").show();
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
      if (error.data) {
        this.errorMessagePart =
          this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart =
          this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }

      $("#filterConfigEditErrorAlert").show();
      this.loadingData = false;
    }
  }

  hideSuccessAlert() {
    $("#filterConfigEditSuccessAlert").hide();
  }

  hideErrorAlert() {
    $("#filterConfigEditErrorAlert").hide();
  }
}
