import { Component, OnInit, signal } from "@angular/core";
import { IndicatorExportItem, SpatialUnit } from "../models";
import { CommonModule } from "@angular/common";
import { ExportItemTimeSelectionComponent } from "../export-item-time-selection/export-item-time-selection.component";
import { ExportFormatSelectionComponent } from "../export-format-selection/export-format-selection.component";
import { ExportingStateService } from "../exporting-state.service";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-export-dataset-list",
  templateUrl: "./export-dataset-list.component.html",
  styleUrls: ["./export-dataset-list.component.css"],
  imports: [
    CommonModule,
    ExportItemTimeSelectionComponent,
    ExportFormatSelectionComponent,
    NgbNavModule,
  ],
  standalone: true,
})
export class ExportDatasetListComponent implements OnInit {
  activeTab: "indicators" | "georessources" = "indicators";

  combinedConfig = signal<{ level: string; selectedIndicatorIds: string[] }>({
    level: "",
    selectedIndicatorIds: [],
  });

  combinedExportType = signal<
    "none" | "indicatorsPerLevel" | "levelsPerIndicator"
  >("none");

  openMultiSelectId = signal<string | null>(null);

  sortTimestamps = (timestamps: string[]): string[] =>
    [...timestamps].sort((a, b) => b.localeCompare(a));

  sortTimestampsAsc = (timestamps: string[]): string[] =>
    [...timestamps].sort((a, b) => a.localeCompare(b));

  constructor(protected srvc: ExportingStateService) {}

  ngOnInit(): void {
    if (
      this.srvc.indicatorItems().length === 0 &&
      this.srvc.georessourceItems().length > 0
    ) {
      this.activeTab = "georessources";
    }
  }

  getIndicatorLevels(item: IndicatorExportItem): SpatialUnit[] {
    return item.dataset.spatialUnits;
  }
}
