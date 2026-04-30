import { Component, computed, signal } from "@angular/core";
import { IndicatorExportItem, SpatialUnit } from "../models";
import { CommonModule } from "@angular/common";
import { ExportItemTimeSelectionComponent } from "../export-item-time-selection/export-item-time-selection.component";
import {
  ExportingStateService,
  FORMAT_CONFIG,
} from "../exporting-state.service";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-export-dataset-list",
  templateUrl: "./export-dataset-list.component.html",
  styleUrls: ["./export-dataset-list.component.css"],
  imports: [CommonModule, ExportItemTimeSelectionComponent, NgbNavModule],
  standalone: true,
})
export class ExportDatasetListComponent {
  activeTab: "indicators" | "georesources" = "indicators";

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

  sortTimestampsAsc = (timestamps: string[]): string[] => {
    return [...timestamps].sort((a, b) => a.localeCompare(b));
  };

  AVAILABLE_FORMATS = computed(() => FORMAT_CONFIG[this.srvc.exportType()]);

  constructor(protected srvc: ExportingStateService) {}

  getIndicatorLevels(item: IndicatorExportItem): SpatialUnit[] {
    return item.dataset.spatialUnits;
  }

  updateSelectedSpatialUnit($event: Event) {
    debugger;
  }
}
