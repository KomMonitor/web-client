import { Component, OnInit, NgZone, OnDestroy, ViewChild } from "@angular/core";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { CommonModule } from "@angular/common";
import { Subscription } from "rxjs";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, GridOptions, GridReadyEvent } from "ag-grid-community";
import { FormsModule } from "@angular/forms";
import { AdminContentViewComponent } from "../admin-content-view/admin-content-view.component";
import { ScriptAddModalComponent } from "./scriptAddModal/script-add-modal.component";
import { ScriptDeleteModalComponent } from "./scriptDeleteModal/script-delete-modal.component";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { KommonitorDataGridHelperService } from "../../../../services/adminSpatialUnit/kommonitor-data-grid-helper.service";
import { ScriptIndicatorsCellRendererComponent } from "./script-indicators-cell-renderer.component";
import { ScriptGeoresourcesCellRendererComponent } from "./script-georesources-cell-renderer.component";
import { ScriptProcessParametersCellRendererComponent } from "./script-process-parameters-cell-renderer.component";

@Component({
  selector: "admin-script-management",
  templateUrl: "./admin-script-management.component.html",
  styleUrls: ["./admin-script-management.component.css"],
  imports: [
    AgGridAngular,
    FormsModule,
    CommonModule,
    AdminContentViewComponent,
  ],
  standalone: true,
})
export class AdminScriptManagementComponent implements OnInit, OnDestroy {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  public loadingData: boolean = true;
  public initializationCompleted: boolean = false;

  public defaultColDef: ColDef =
    this.kommonitorDataGridHelperService.buildDefaultColDef();
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public gridOptions: GridOptions =
    this.kommonitorDataGridHelperService.buildGridOptions();
  public selectedRows: any[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private zone: NgZone,
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    public dataExchangeService: DataExchangeService,
    private kommonitorDataGridHelperService: KommonitorDataGridHelperService,
  ) {}

  ngOnInit(): void {
    this.buildColumnDefs();
    this.setupEventListeners();
    this.initializeOrRefreshOverviewTable();

    setTimeout(() => {
      if (this.loadingData) {
        this.initializeOrRefreshOverviewTable();
        if (this.loadingData) {
          this.loadingData = false;
        }
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private buildColumnDefs(): void {
    this.columnDefs = [
      {
        headerName: "Id",
        field: "scriptId",
        pinned: "left",
        maxWidth: 125,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
      },
      { headerName: "Name", field: "name", pinned: "left", maxWidth: 300 },
      {
        headerName: "Ziel-Indikatoren-Id",
        field: "indicatorId",
        maxWidth: 125,
      },
      {
        headerName: "Ziel-Indikatoren-Name",
        minWidth: 200,
        valueGetter: (params: any) =>
          (
            this.dataExchangeService.getIndicatorMetadataById(
              params.data?.indicatorId,
            ) as any
          )?.indicatorName ?? "",
        filter: "agTextColumnFilter",
      },
      { headerName: "Beschreibung", field: "description", minWidth: 300 },
      {
        headerName: "notwendige Basis-Indikatoren",
        minWidth: 300,
        cellRenderer: ScriptIndicatorsCellRendererComponent,
        filter: "agTextColumnFilter",
        filterValueGetter: (params: any) =>
          params.data?.requiredIndicatorIds?.join(", ") ?? "keine",
      },
      {
        headerName: "notwendige Basis-Georessourcen",
        minWidth: 300,
        cellRenderer: ScriptGeoresourcesCellRendererComponent,
        filter: "agTextColumnFilter",
        filterValueGetter: (params: any) =>
          params.data?.requiredGeoresourceIds?.join(", ") ?? "keine",
      },
      {
        headerName: "Prozessparameter",
        minWidth: 600,
        cellRenderer: ScriptProcessParametersCellRendererComponent,
        filter: "agTextColumnFilter",
        filterValueGetter: (params: any) =>
          params.data?.variableProcessParameters
            ? JSON.stringify(params.data.variableProcessParameters)
            : "keine",
      },
    ];
  }

  private setupEventListeners(): void {
    const sub = this.broadcastService.currentBroadcastMsg.subscribe((data) => {
      if (data.msg === "initialMetadataLoadingCompleted") {
        this.zone.run(() => {
          setTimeout(() => this.initializeOrRefreshOverviewTable(), 250);
        });
      } else if (data.msg === "initialMetadataLoadingFailed") {
        this.zone.run(() => {
          this.loadingData = false;
        });
      } else if (data.msg === "refreshScriptOverviewTable") {
        this.zone.run(() => {
          this.loadingData = true;
          const payload = data as any;
          this.refreshScriptOverviewTable(payload.crudType, payload.scriptId);
        });
      }
    });
    this.subscriptions.push(sub);
  }

  public initializeOrRefreshOverviewTable(): void {
    const scripts = this.dataExchangeService.availableProcessScripts;
    if (scripts && scripts.length >= 0) {
      this.loadingData = false;
      this.initializationCompleted = true;
      this.rowData = scripts;
    } else {
      this.loadingData = true;
      this.initializationCompleted = false;
    }
  }

  public refreshScriptOverviewTable(
    crudType?: string,
    scriptId?: string | string[],
  ): void {
    if (!crudType || !scriptId) {
      this.dataExchangeService
        .fetchIndicatorScriptsMetadata()
        .then(() => {
          this.initializeOrRefreshOverviewTable();
          this.loadingData = false;
        })
        .catch(() => {
          this.loadingData = false;
        });
    } else if (crudType === "delete") {
      const idsToDelete = Array.isArray(scriptId) ? scriptId : [scriptId];
      for (const id of idsToDelete) {
        const idx = this.dataExchangeService.availableProcessScripts.findIndex(
          (s: any) => s.scriptId === id,
        );
        if (idx > -1) {
          this.dataExchangeService.availableProcessScripts.splice(idx, 1);
        }
      }
      this.initializeOrRefreshOverviewTable();
      this.loadingData = false;
    } else {
      // For add/edit: re-fetch all scripts
      this.dataExchangeService
        .fetchIndicatorScriptsMetadata()
        .then(() => {
          this.initializeOrRefreshOverviewTable();
          this.loadingData = false;
        })
        .catch(() => {
          this.loadingData = false;
        });
    }
  }

  public onSelectionChanged(): void {
    if (this.agGrid?.api) {
      this.selectedRows = this.agGrid.api.getSelectedRows();
    }
  }

  public onClickAddScript(): void {
    // if (!this.dataExchangeService.checkCreatePermission()) return;
    const modalRef = this.modalService.open(ScriptAddModalComponent, {
      // modalDialogClass: "modal-medium",
      size: "xl",
      backdrop: "static",
    });
  }

  public onClickDeleteScripts(): void {
    const selectedScripts = this.agGrid?.api?.getSelectedRows() || [];
    if (selectedScripts.length === 0) return;

    const modalRef = this.modalService.open(ScriptDeleteModalComponent, {
      size: "lg",
      backdrop: "static",
    });
    modalRef.componentInstance.datasetsToDelete = JSON.parse(
      JSON.stringify(selectedScripts),
    );
  }
}
