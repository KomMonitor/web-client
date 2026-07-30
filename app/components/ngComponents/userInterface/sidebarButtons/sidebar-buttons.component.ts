import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { GlobalFilterHelperService } from 'services/global-filter-helper-service/global-filter-helper.service';
import { RangeFilterStateService } from 'services/range-filter-state-service/range-filter-state.service';
import { SidebarStateService } from 'services/sidebar-state-service/sidebar-state.service';
import { DiagramMenuButtonComponent } from '../diagramMenuButton/diagram-menu-button.component';
import { ExportMenuButtonComponent } from '../exporting/export-menu-button/export-menu-button.component';
import { ReportingModalComponent } from '../reporting/reporting-modal.component';

/**
 * The left sidebar-button column: one toggle button per dockable sidebar panel,
 * the diagram submenu button, the reporting button and the export menu. Extracted
 * from UserInterfaceComponent; it is fully driven by shared root services and its
 * own reporting modal, with no inputs/outputs.
 */
@Component({
  selector: 'app-sidebar-buttons',
  templateUrl: './sidebar-buttons.component.html',
  styleUrls: ['./sidebar-buttons.component.scss'],
  standalone: true,
  imports: [CommonModule, DiagramMenuButtonComponent, ExportMenuButtonComponent],
})
export class SidebarButtonsComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  protected readonly visibilityHelperService = inject(ElementVisibilityHelperService);
  private readonly globalFilterHelperService = inject(GlobalFilterHelperService);
  private readonly chartDisplayState = inject(ChartDisplayStateService);
  private readonly rangeFilterState = inject(RangeFilterStateService);
  private readonly modalService = inject(NgbModal);

  /** True while any display filter (global/measure-of-value/range) is active. */
  filterModusActive(): boolean {
    return (
      this.globalFilterHelperService.globalFilterApplied() ||
      this.chartDisplayState.isMeasureOfValueChecked ||
      this.rangeFilterState.rangeFilterIsApplied
    );
  }

  openReportingModal() {
    this.modalService.open(ReportingModalComponent, {
      windowClass: 'modal-holder',
      centered: true,
    });
  }
}
