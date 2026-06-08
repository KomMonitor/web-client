import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ExportMenuModalComponent } from "../export-menu-modal/export-menu-modal.component";
import { ExportingStateService } from "../exporting-state.service";

@Component({
  selector: "app-export-menu-button",
  templateUrl: "./export-menu-button.component.html",
  styleUrls: ["./export-menu-button.component.css"],
  standalone: true,
  imports: [CommonModule],
})
export class ExportMenuButtonComponent {
  private readonly modalService = inject(NgbModal);
  protected readonly exportingStateService = inject(ExportingStateService);

  exportItemCount = computed(
    () =>
      this.exportingStateService.indicatorItems().length +
      this.exportingStateService.georessourceItems().length,
  );

  openExportMenuModal() {
    this.modalService.open(ExportMenuModalComponent, {
      windowClass: "modal-holder",
      centered: true,
    });
  }
}
