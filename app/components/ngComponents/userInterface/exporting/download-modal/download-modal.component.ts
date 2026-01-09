import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ExportTypSelectionComponent } from "../export-typ-selection/export-typ-selection.component";
import { ExportDatasetListComponent } from "../export-dataset-list/export-dataset-list.component";
import { ExportingService } from "../../../../../services/exporting/exporting.service";

@Component({
  selector: "app-download-modal",
  templateUrl: "./download-modal.component.html",
  styleUrls: ["./download-modal.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    ExportTypSelectionComponent,
    ExportDatasetListComponent,
  ],
})
export class DownloadModalComponent {
  activeModal = inject(NgbActiveModal);

  constructor(protected srvc: ExportingService) {}

  startDownload() {
    throw new Error("Method not implemented.");
  }
}
