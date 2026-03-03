import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";

@Component({
  selector: "app-script-delete-modal",
  templateUrl: "./script-delete-modal.component.html",
  imports: [CommonModule],
  standalone: true,
})
export class ScriptDeleteModalComponent implements OnInit {
  @Input() datasetsToDelete: any[] = [];

  loadingData: boolean = false;
  successfullyDeletedDatasets: any[] = [];
  failedDatasetsAndErrors: [any, string][] = [];
  showSuccessAlert: boolean = false;
  showErrorAlert: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    private dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
  ) {}

  ngOnInit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.successfullyDeletedDatasets = [];
    this.failedDatasetsAndErrors = [];
    this.showSuccessAlert = false;
    this.showErrorAlert = false;
  }

  close(): void {
    this.activeModal.dismiss("closed");
  }

  deleteScripts(): void {
    if (this.datasetsToDelete.length === 0) return;

    this.loadingData = true;
    this.resetForm();

    const deletePromises = this.datasetsToDelete.map((dataset) =>
      this.getDeleteDatasetPromise(dataset),
    );

    Promise.allSettled(deletePromises).then(() => {
      if (this.failedDatasetsAndErrors.length > 0) {
        this.showErrorAlert = true;
      }
      if (this.successfullyDeletedDatasets.length > 0) {
        this.showSuccessAlert = true;

        const deletedIds = this.successfullyDeletedDatasets.map(
          (d) => d.scriptId,
        );
        this.broadcastService.broadcast("refreshScriptOverviewTable", {
          crudType: "delete",
          scriptId: deletedIds,
        });
        this.broadcastService.broadcast("refreshAdminDashboardDiagrams");
      }
      this.loadingData = false;
    });
  }

  private getDeleteDatasetPromise(dataset: any): Promise<void> {
    return new Promise((resolve) => {
      this.http
        .delete(
          this.dataExchangeService.baseUrlToKomMonitorDataAPI +
            "/process-scripts/" +
            dataset.scriptId,
        )
        .subscribe({
          next: () => {
            this.successfullyDeletedDatasets.push(dataset);
            resolve();
          },
          error: (error: any) => {
            const errorMsg = this.dataExchangeService.syntaxHighlightJSON
              ? this.dataExchangeService.syntaxHighlightJSON(
                  error.error || error,
                )
              : JSON.stringify(error.error || error);
            this.failedDatasetsAndErrors.push([dataset, errorMsg]);
            resolve();
          },
        });
    });
  }

  hideSuccessAlert(): void {
    this.showSuccessAlert = false;
  }

  hideErrorAlert(): void {
    this.showErrorAlert = false;
  }
}
