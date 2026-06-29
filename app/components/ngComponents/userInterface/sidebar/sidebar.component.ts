import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { KommonitorDataSetupComponent } from './kommonitorDataSetup/kommonitor-data-setup.component';
import { PoiComponent } from './poi/poi.component';
import { KommonitorFilterComponent } from './kommonitorFilter/kommonitor-filter.component';
import { KommonitorBalanceComponent } from './kommonitorBalance/kommonitor-balance.component';
import { KommonitorDiagramsComponent } from './kommonitorDiagrams/kommonitor-diagrams.component';
import { IndicatorRadarComponent } from './indicatorRadar/indicator-radar.component';
import { RegressionDiagramComponent } from './regressionDiagram/regression-diagram.component';
import { KommonitorDataImportComponent } from './kommonitorDataImport/kommonitor-data-import.component';
import { MapService } from 'services/map-service/map.service';
import { KommonitorReachabilityComponent } from './kommonitorReachability/kommonitor-reachability.component';

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
  private broadcastService = inject(BroadcastService);
  private mapService = inject(MapService);

  @Input() element: any = undefined;
  @Output() sidebarClosed = new EventEmitter<any>(undefined);

  expandedWidthElements = [
    'sidebarDiagramsCollapse',
    'sidebarRadarDiagramCollapse',
    'sidebarRegressionDiagramCollapse',
  ];

  closeSidebar() {
    this.element = undefined;
    this.mapService.setMapRecenterState({ recenter: true, resize: true });
    this.sidebarClosed.emit(true);
  }
}
