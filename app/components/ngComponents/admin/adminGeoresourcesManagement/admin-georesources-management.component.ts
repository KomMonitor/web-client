import { WmsResourceType } from "./../../models/services.models";
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  ViewChild,
  AfterViewInit,
} from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { Subscription } from "rxjs";
import { NgbDropdownModule, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { BroadcastService } from "../../../../services/broadcast-service/broadcast.service";
import { KommonitorGeoresourceDataExchangeService } from "../../../../services/adminGeoresourceUnit/kommonitor-data-exchange.service";
import { KommonitorGeoresourceCacheHelperService } from "../../../../services/adminGeoresourceUnit/kommonitor-cache-helper.service";
import { KommonitorGeoresourceDataGridHelperService } from "../../../../services/adminGeoresourceUnit/kommonitor-data-grid-helper.service";
import { AgGridAngular } from "ag-grid-angular";
import { GeoresourceAddModalComponent } from "./georesourceAddModal/georesource-add-modal.component";
import { GeoresourceBatchUpdateModalComponent } from "./georesourceBatchUpdateModal/georesource-batch-update-modal.component";
import { GeoresourceEditMetadataModalComponent } from "./georesourceEditMetadataModal/georesource-edit-metadata-modal.component";
import { GeoresourceEditFeaturesModalComponent } from "./georesourceEditFeaturesModal/georesource-edit-features-modal.component";
import { GeoresourceEditUserRolesModalComponent } from "./georesourceEditUserRolesModal/georesource-edit-user-roles-modal.component";
import { GeoresourceDeleteModalComponent } from "./georesourceDeleteModal/georesource-delete-modal.component";
import { WmsSharedComponentsService } from "components/ngComponents/common/wms-admin-table/wms-admin-tables-shared.service";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import { WmsAdminTableComponent } from "../../common/wms-admin-table/wms-admin-table.component";
import { FormsModule } from "@angular/forms";
import { AdminContentViewComponent } from "../admin-content-view/admin-content-view.component";

// Declare jQuery for AdminLTE
declare const $: any;

@Component({
  selector: "admin-georesources-management-new",
  templateUrl: "./admin-georesources-management.component.html",
  styleUrls: ["./admin-georesources-management.component.css"],
  imports: [
    ExpandableBoxComponent,
    AgGridAngular,
    CommonModule,
    WmsAdminTableComponent,
    FormsModule,
    AdminContentViewComponent,
    NgbDropdownModule,
  ],
  standalone: true,
})
export class AdminGeoresourcesManagementComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild("poiGrid", { static: false }) poiGrid!: AgGridAngular;
  @ViewChild("loiGrid", { static: false }) loiGrid!: AgGridAngular;
  @ViewChild("aoiGrid", { static: false }) aoiGrid!: AgGridAngular;

  public loadingData: boolean = true;
  public tableViewSwitcher: boolean = false;

  // Grid options for each table
  public poiGridOptions: any = {};
  public loiGridOptions: any = {};
  public aoiGridOptions: any = {};

  private subscriptions: Subscription[] = [];

  WmsResourceType = WmsResourceType;

  resourceType: WmsResourceType = WmsResourceType.GEORESOURCE;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    public kommonitorDataExchangeService: KommonitorGeoresourceDataExchangeService,
    private kommonitorCacheHelperService: KommonitorGeoresourceCacheHelperService,
    private kommonitorDataGridHelperService: KommonitorGeoresourceDataGridHelperService,
    protected wmsSharedComponentsService: WmsSharedComponentsService,
  ) {}

  ngOnInit(): void {
    this.setupEventListeners();
    this.initialize();

    // Initialize grid options with the service
    this.poiGridOptions =
      this.kommonitorDataGridHelperService.getPoiGridOptions();
    this.loiGridOptions =
      this.kommonitorDataGridHelperService.getLoiGridOptions();
    this.aoiGridOptions =
      this.kommonitorDataGridHelperService.getAoiGridOptions();
  }

  ngAfterViewInit(): void {
    // Initialize grids after view is ready
    this.kommonitorDataGridHelperService.initializeGrids(
      this.poiGrid,
      this.loiGrid,
      this.aoiGrid,
    );

    // Set component reference for callbacks
    this.kommonitorDataGridHelperService.setComponentRef(this);

    // Load data if not already loaded
    if (this.kommonitorDataExchangeService.availableGeoresources.length === 0) {
      this.loadDataFallback();
    }
  }

  private loadDataFallback(): void {
    // If we still don't have data after 1 second, try to manually trigger data loading
    if (
      !this.kommonitorDataExchangeService.availableGeoresources ||
      this.kommonitorDataExchangeService.availableGeoresources.length === 0
    ) {
      // Try to fetch metadata manually
      this.kommonitorDataExchangeService
        .fetchGeoresourcesMetadata(
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles,
        )
        .then((response: any) => {
          this.initializeOrRefreshOverviewTable();
        })
        .catch((error: any) => {
          // As a last resort, try with test data to verify grids are working
          this.testGridsWithSampleData();

          this.loadingData = false;
        });
    }
  }

  private testGridsWithSampleData(): void {
    const testData = [
      {
        georesourceId: "test-poi-1",
        datasetName: "Test POI 1",
        isPOI: true,
        isLOI: false,
        isAOI: false,
        poiSymbolColor: "#ff0000",
        poiSymbolBootstrap3Name: "home",
        poiMarkerColor: "#0000ff",
        metadata: {
          description: "Test POI description",
        },
        ownerId: "test-owner",
        userPermissions: ["creator"],
      },
      {
        georesourceId: "test-loi-1",
        datasetName: "Test LOI 1",
        isPOI: false,
        isLOI: true,
        isAOI: false,
        loiColor: "#00ff00",
        loiWidth: 2,
        loiDashArrayString: "5 5",
        metadata: {
          description: "Test LOI description",
        },
        ownerId: "test-owner",
        userPermissions: ["creator"],
      },
      {
        georesourceId: "test-aoi-1",
        datasetName: "Test AOI 1",
        isPOI: false,
        isLOI: false,
        isAOI: true,
        aoiColor: "#ffff00",
        metadata: {
          description: "Test AOI description",
        },
        ownerId: "test-owner",
        userPermissions: ["creator"],
      },
    ];

    this.kommonitorDataGridHelperService.buildDataGrid_georesources(testData);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // Listen for broadcast messages
    const broadcastSub = this.broadcastService.currentBroadcastMsg.subscribe(
      (data: any) => {
        if (data.msg === "initialMetadataLoadingCompleted") {
          setTimeout(() => {
            this.initializeOrRefreshOverviewTable();
          }, 250);
        } else if (data.msg === "initialMetadataLoadingFailed") {
          this.loadingData = false;
        } else if (data.msg === "refreshGeoresourceOverviewTable") {
          this.loadingData = true;
          this.refreshGeoresourceOverviewTable(
            data.values.crudType,
            data.values.targetGeoresourceId,
          );
        }
      },
    );

    this.subscriptions.push(broadcastSub);
  }

  private initialize(): void {
    // Initialize any adminLTE box widgets
    if (typeof $ !== "undefined" && $ && $.fn && $.fn.boxWidget) {
      $(".box").boxWidget();
    }
  }

  public onTableViewSwitch(): void {
    this.initializeOrRefreshOverviewTable();
  }

  public initializeOrRefreshOverviewTable(): void {
    this.loadingData = true;

    const georesources = this.initGeoresources();

    this.kommonitorDataGridHelperService.buildDataGrid_georesources(
      georesources,
    );

    setTimeout(() => {
      this.loadingData = false;
    }, 100);
  }

  private initGeoresources(): any[] {
    if (this.tableViewSwitcher) {
      return this.kommonitorDataExchangeService.availableGeoresources.filter(
        (e: any) =>
          !(
            e.userPermissions.length === 1 &&
            e.userPermissions.includes("viewer")
          ),
      );
    } else {
      return this.kommonitorDataExchangeService.availableGeoresources;
    }
  }

  public refreshGeoresourceOverviewTable(
    crudType?: string,
    targetGeoresourceId?: string,
  ): void {
    if (!crudType || !targetGeoresourceId) {
      // refetch all metadata from georesources to update table
      this.kommonitorDataExchangeService
        .fetchGeoresourcesMetadata(
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles,
        )
        .then((response: any) => {
          this.initializeOrRefreshOverviewTable();
          this.broadcastService.broadcast(
            "refreshGeoresourceOverviewTableCompleted",
          );
          this.loadingData = false;
        })
        .catch((response: any) => {
          this.loadingData = false;
          this.broadcastService.broadcast(
            "refreshGeoresourceOverviewTableCompleted",
          );
        });
    } else if (crudType && targetGeoresourceId) {
      if (crudType === "add") {
        this.kommonitorCacheHelperService
          .fetchSingleGeoresourceMetadata(
            targetGeoresourceId,
            this.kommonitorDataExchangeService.currentKeycloakLoginRoles,
          )
          .then((data: any) => {
            this.kommonitorDataExchangeService.addSingleGeoresourceMetadata(
              data,
            );
            this.initializeOrRefreshOverviewTable();
            this.broadcastService.broadcast(
              "refreshGeoresourceOverviewTableCompleted",
            );
            this.loadingData = false;
          })
          .catch((response: any) => {
            this.loadingData = false;
            this.broadcastService.broadcast(
              "refreshGeoresourceOverviewTableCompleted",
            );
          });
      } else if (crudType === "edit") {
        this.kommonitorCacheHelperService
          .fetchSingleGeoresourceMetadata(
            targetGeoresourceId,
            this.kommonitorDataExchangeService.currentKeycloakLoginRoles,
          )
          .then((data: any) => {
            this.kommonitorDataExchangeService.replaceSingleGeoresourceMetadata(
              data,
            );
            this.initializeOrRefreshOverviewTable();
            this.broadcastService.broadcast(
              "refreshGeoresourceOverviewTableCompleted",
            );
            this.loadingData = false;
          })
          .catch((response: any) => {
            this.loadingData = false;
            this.broadcastService.broadcast(
              "refreshGeoresourceOverviewTableCompleted",
            );
          });
      } else if (crudType === "delete") {
        // targetGeoresourceId might be array in this case
        if (targetGeoresourceId && typeof targetGeoresourceId === "string") {
          this.kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(
            targetGeoresourceId,
          );
          this.initializeOrRefreshOverviewTable();
          this.broadcastService.broadcast(
            "refreshGeoresourceOverviewTableCompleted",
          );
          this.loadingData = false;
        } else if (targetGeoresourceId && Array.isArray(targetGeoresourceId)) {
          for (const id of targetGeoresourceId) {
            this.kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(
              id,
            );
          }
          this.initializeOrRefreshOverviewTable();
          this.broadcastService.broadcast(
            "refreshGeoresourceOverviewTableCompleted",
          );
          this.loadingData = false;
        }
      }
    }
  }

  // Modal event handlers
  onClickAddGeoresource(): void {
    const modalRef = this.modalService.open(GeoresourceAddModalComponent, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
      container: "body",
      animation: false,
    });
  }

  onClickBatchUpdateGeoresource(): void {
    const modalRef = this.modalService.open(
      GeoresourceBatchUpdateModalComponent,
      {
        size: "lg",
        backdrop: "static",
        keyboard: false,
        container: "body",
        animation: false,
      },
    );

    modalRef.result
      .then((result) => {
        if (result) {
          this.initializeOrRefreshOverviewTable();
        }
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  public onClickEditMetadata(georesourceDataset: any): void {
    const modalRef = this.modalService.open(
      GeoresourceEditMetadataModalComponent,
      {
        size: "lg",
        backdrop: "static",
        keyboard: false,
        container: "body",
        animation: false,
      },
    );

    // Pass the georesource dataset to the modal
    modalRef.componentInstance.currentGeoresourceDataset = georesourceDataset;

    modalRef.result.then(
      (result) => {
        if (result) {
          // Handle successful edit
          this.refreshGeoresourceOverviewTable(
            "edit",
            georesourceDataset.georesourceId,
          );
        }
      },
      (reason) => {
        // Modal dismissed
      },
    );
  }

  public onClickEditFeatures(georesourceDataset: any): void {
    const modalRef = this.modalService.open(
      GeoresourceEditFeaturesModalComponent,
      {
        size: "xl",
        backdrop: "static",
        keyboard: false,
        container: "body",
        animation: false,
      },
    );

    // Pass the georesource dataset to the modal
    modalRef.componentInstance.currentGeoresourceDataset = georesourceDataset;

    modalRef.result.then(
      (result) => {
        if (result) {
          // Handle successful edit
          this.refreshGeoresourceOverviewTable(
            "edit",
            georesourceDataset.georesourceId,
          );
        }
      },
      (reason) => {
        // Modal dismissed
      },
    );
  }

  public onClickEditUserRoles(georesourceDataset: any): void {
    const modalRef = this.modalService.open(
      GeoresourceEditUserRolesModalComponent,
      {
        size: "xl",
        backdrop: "static",
        keyboard: false,
        container: "body",
        animation: false,
      },
    );
    modalRef.componentInstance.currentGeoresourceDataset = georesourceDataset;

    modalRef.result.then(
      (result) => {
        if (result) {
          // Handle successful edit
          this.refreshGeoresourceOverviewTable(
            "edit",
            georesourceDataset.georesourceId,
          );
        }
      },
      (reason) => {
        // Modal dismissed
      },
    );
  }

  public onClickDeleteGeoresource(georesourceDataset: any): void {
    const modalRef = this.modalService.open(GeoresourceDeleteModalComponent, {
      size: "xl",
      backdrop: "static",
      keyboard: false,
      container: "body",
      animation: false,
    });

    // Pass the georesource dataset to the modal (as array like original)
    this.broadcastService.broadcast("onDeleteGeoresources", [
      georesourceDataset,
    ]);

    modalRef.result.then(
      (result) => {
        console.log("Georesource delete modal closed with result:", result);
      },
      (reason) => {
        console.log("Georesource delete modal dismissed with reason:", reason);
      },
    );
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

  // Callback methods for cell renderer
  onEditMetadata(georesourceDataset: any): void {
    this.broadcastService.broadcast(
      "onEditGeoresourceMetadata",
      georesourceDataset,
    );
  }

  onEditFeatures(georesourceDataset: any): void {
    this.onClickEditFeatures(georesourceDataset);
  }

  onEditUserRoles(georesourceDataset: any): void {
    this.onClickEditUserRoles(georesourceDataset);
  }
}
