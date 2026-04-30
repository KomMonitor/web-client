import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import {
  ExportingStateService,
  SelectionType,
} from "../exporting-state.service";

@Component({
  selector: "app-export-typ-selection",
  templateUrl: "./export-typ-selection.component.html",
  styleUrls: ["./export-typ-selection.component.css"],
  imports: [CommonModule],
  standalone: true,
})
export class ExportTypSelectionComponent {
  options: { val: SelectionType; label: string }[] = [
    { val: "none", label: "Einzel-Export (Standard)" },
    {
      val: "multiIndicator",
      label: "Mehrere Indikatoren für eine Raumebene",
    },
    {
      val: "multiSpatialUnit",
      label: "Ein Indikator für mehrere Raumebenen",
    },
  ];

  constructor(protected srvc: ExportingStateService) {}

  updateSelectedSpatialUnit(evt: Event): void {
    const value = (evt.target as HTMLSelectElement).value;
    this.srvc.selectedSpatialUnit.set(value);
  }

  setSelectionType(type: SelectionType): void {
    this.srvc.selectionType.set(type);
    // this.combinedConfig.set({ level: "", selectedIndicatorIds: [] });
    // // Reset multi-levels when switching mode
    // this.exportItems.update((items) =>
    //   items.map((item) => ({ ...item, selectedMultiLevels: [] }))
    // );
  }
}
