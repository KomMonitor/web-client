import { Component, Input, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ExportFormat, ExportItem } from "../models";
import {
  ExportingStateService,
  ExportType,
} from "../exporting-state.service";

export const FORMAT_CONFIG: Record<ExportType, ExportFormat[]> = {
  single: ["GeoPackage", "Excel", "CSV", "GeoJSON"],
  spatialUnit: ["GeoPackage", "Excel", "CSV"],
  multiple: ["GeoPackage"],
};

@Component({
  selector: "app-export-format-selection",
  templateUrl: "./export-format-selection.component.html",
  styleUrls: ["./export-format-selection.component.css"],
  imports: [CommonModule],
  standalone: true,
})
export class ExportFormatSelectionComponent {
  @Input({ required: true })
  public exportItem!: ExportItem;

  AVAILABLE_FORMATS = computed(() => FORMAT_CONFIG[this.srvc.exportType()]);

  constructor(protected srvc: ExportingStateService) {}
}
