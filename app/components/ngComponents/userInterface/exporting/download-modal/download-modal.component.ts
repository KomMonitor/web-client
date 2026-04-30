import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ExportTypSelectionComponent } from "../export-typ-selection/export-typ-selection.component";
import { ExportDatasetListComponent } from "../export-dataset-list/export-dataset-list.component";
import { EpsgSelectorComponent } from "../epsg-selector/epsg-selector.component";
import {
  ExportingStateService,
} from "../exporting-state.service";
import { ExpandableBoxComponent } from "../../../common/expandable-box/expandable-box.component";

@Component({
  selector: "app-download-modal",
  templateUrl: "./download-modal.component.html",
  styleUrls: ["./download-modal.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    ExportTypSelectionComponent,
    ExportDatasetListComponent,
    ExpandableBoxComponent,
    EpsgSelectorComponent,
  ],
})
export class DownloadModalComponent {
  activeModal = inject(NgbActiveModal);

  constructor(protected srvc: ExportingStateService) {}

  onEpsgCodeChange(code: number | null): void {
    this.srvc.selectedEpsgCode.set(code);
  }

  startDownload() {
    throw new Error("Method not implemented.");
  }
}
