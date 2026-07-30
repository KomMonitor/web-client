import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SidebarStateService } from 'services/sidebar-state-service/sidebar-state.service';
import { IndicatorRadarComponent } from './indicatorRadar/indicator-radar.component';
import { KommonitorBalanceComponent } from './kommonitorBalance/kommonitor-balance.component';
import { KommonitorDataImportComponent } from './kommonitorDataImport/kommonitor-data-import.component';
import { KommonitorDataSetupComponent } from './kommonitorDataSetup/kommonitor-data-setup.component';
import { KommonitorDiagramsComponent } from './kommonitorDiagrams/kommonitor-diagrams.component';
import { KommonitorFilterComponent } from './kommonitorFilter/kommonitor-filter.component';
import { KommonitorReachabilityComponent } from './kommonitorReachability/kommonitor-reachability.component';
import { PoiComponent } from './poi/poi.component';
import { RegressionDiagramComponent } from './regressionDiagram/regression-diagram.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    KommonitorDataSetupComponent,
    PoiComponent,
    KommonitorFilterComponent,
    KommonitorBalanceComponent,
    KommonitorDiagramsComponent,
    IndicatorRadarComponent,
    RegressionDiagramComponent,
    KommonitorDataImportComponent,
    KommonitorReachabilityComponent,
  ],
})
export class SidebarComponent {
  protected readonly sidebarState = inject(SidebarStateService);

  /** Whether the currently docked sidebar renders at the wider layout. */
  protected get isExpandedWidth(): boolean {
    const active = this.sidebarState.activeElement();
    return active !== '' && this.sidebarState.expandedWidthElements.includes(active);
  }

  closeSidebar() {
    this.sidebarState.clearActive();
  }
}
