import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { KommonitorDataSetupComponent } from './kommonitorDataSetup/kommonitor-data-setup.component';
import { PoiComponent } from './poi/poi.component';
import { KommonitorFilterComponent } from './kommonitorFilter/kommonitor-filter.component';
import { KommonitorBalanceComponent } from './kommonitorBalance/kommonitor-balance.component';
import { KommonitorDiagramsComponent } from './kommonitorDiagrams/kommonitor-diagrams.component';
import { IndicatorRadarComponent } from './indicatorRadar/indicator-radar.component';

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
    IndicatorRadarComponent]
})
export class SidebarComponent implements OnInit{

  @Input() element:any = undefined;

  expandedWidthElements = [
    'sidebarDiagramsCollapse',
    'sidebarRadarDiagramCollapse',
    'sidebarRegressionDiagramCollapse'
  ];

  constructor(
    private broadcastService: BroadcastService 
  ) {}

  ngOnInit(): void {
    // default open
    this.element = 'sidebarRadarDiagramCollapse';
  }

  closeSidebar() {
    this.element = undefined;
    this.broadcastService.broadcast('sidebarClosed');
  }
}
