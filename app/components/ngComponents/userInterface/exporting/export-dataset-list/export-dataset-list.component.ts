import { Component, signal } from "@angular/core";
import { ExportItem, Indicator } from "../models";
import { CommonModule } from "@angular/common";
import { ExportItemTimeSelectionComponent } from "../export-item-time-selection/export-item-time-selection.component";
import { ExportingStateService } from "../exporting-state.service";

@Component({
  selector: "app-export-dataset-list",
  templateUrl: "./export-dataset-list.component.html",
  styleUrls: ["./export-dataset-list.component.css"],
  imports: [CommonModule, ExportItemTimeSelectionComponent],
  standalone: true,
})
export class ExportDatasetListComponent {
  // active = 1;

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

  AVAILABLE_FORMATS = ["GeoPackage", "Excel", "CSV", "GeoJSON"];

  constructor(protected srvc: ExportingStateService) {}

  isItemRelevant(item: ExportItem): boolean {
    // const type = this.combinedExportType();
    // if (type === 'none') return true;
    // if (type === 'indicatorsPerLevel') return true;
    // if (type === 'levelsPerIndicator') return item.dataset.type === 'indicator';
    return false;
  }

  getIndicatorLevels(item: ExportItem): string[] {
    if (item.dataset.type === "indicator") {
      return (item.dataset as Indicator).availableLevels;
    }
    return [];
  }

  updateSelectedSpatialUnit($event: Event) {
    debugger;
  }
}
