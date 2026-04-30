import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import {
  ExportingStateService,
  ExportType,
} from "../exporting-state.service";

@Component({
  selector: "app-export-typ-selection",
  templateUrl: "./export-typ-selection.component.html",
  styleUrls: ["./export-typ-selection.component.css"],
  imports: [CommonModule],
  standalone: true,
})
export class ExportTypSelectionComponent {
  options: { val: ExportType; label: string }[] = [
    { val: "single", label: "Einzel-Export (Standard)" },
    {
      val: "spatialUnit",
      label: "Mehrere Indikatoren für eine Raumebene",
    },
    {
      val: "multiple",
      label: "Ein Indikator für mehrere Raumebenen",
    },
  ];

  constructor(protected srvc: ExportingStateService) {}

  updateSelectedSpatialUnit(evt: Event): void {
    const value = (evt.target as HTMLSelectElement).value;
    this.srvc.selectedSpatialUnit.set(value);
  }

  setSelectionType(type: ExportType): void {
    this.srvc.exportType.set(type);
    // this.combinedConfig.set({ level: "", selectedIndicatorIds: [] });
    // // Reset multi-levels when switching mode
    // this.exportItems.update((items) =>
    //   items.map((item) => ({ ...item, selectedMultiLevels: [] }))
    // );
  }
}
