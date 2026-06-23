import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ExportingStateService } from "../exporting-state.service";
import { Georessource, Indicator } from "../models";

export type ExportItemKind = "indicator" | "georessource";

@Component({
  selector: "app-export-item-checkbox",
  templateUrl: "./export-item-checkbox.component.html",
  styleUrls: ["./export-item-checkbox.component.scss"],
  imports: [CommonModule],
  standalone: true,
})
export class ExportItemCheckboxComponent {
  @Input({ required: true }) kind!: ExportItemKind;
  @Input({ required: true }) dataset!: Indicator | Georessource;

  constructor(protected srvc: ExportingStateService) {}

  isInExport(): boolean {
    if (this.kind === "indicator") {
      return this.srvc
        .indicatorItems()
        .some((item) => item.dataset.id === this.dataset.id);
    }
    return this.srvc
      .georessourceItems()
      .some((item) => item.dataset.id === this.dataset.id);
  }

  toggle(): void {
    if (this.isInExport()) {
      this.remove();
    } else {
      this.add();
    }
  }

  private add(): void {
    if (this.kind === "indicator") {
      this.srvc.addIndicator(this.dataset as Indicator);
    } else {
      this.srvc.addGeoressource(this.dataset as Georessource);
    }
  }

  private remove(): void {
    if (this.kind === "indicator") {
      this.srvc.removeIndicator(this.dataset.id);
    } else {
      this.srvc.removeGeoressource(this.dataset.id);
    }
  }
}
