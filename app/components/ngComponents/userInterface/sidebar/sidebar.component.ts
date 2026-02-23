import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { KommonitorDataSetupComponent } from './kommonitorDataSetup/kommonitor-data-setup.component';
import { PoiComponent } from './poi/poi.component';
import { KommonitorFilterComponent } from './kommonitorFilter/kommonitor-filter.component';
import { KommonitorBalanceComponent } from './kommonitorBalance/kommonitor-balance.component';
import { KommonitorDiagramsComponent } from './kommonitorDiagrams/kommonitor-diagrams.component';
import { IndicatorRadarComponent } from './indicatorRadar/indicator-radar.component';
import { RegressionDiagramComponent } from './regressionDiagram/regression-diagram.component';
import { RtdDiagramsComponent } from './rtdDiagrams/rtd-diagrams/rtd-diagrams.component';
import { SidebarService } from './sidebar.service';

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
    RtdDiagramsComponent]
})
export class SidebarComponent implements OnInit{

  @Input() element:any = undefined;

  data!:any;

  expandedWidthElements = [
    'sidebarDiagramsCollapse',
    'sidebarRadarDiagramCollapse',
    'sidebarRegressionDiagramCollapse'
  ];

  constructor(
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {

    // listen to open/close calls
    this.sidebarService.sidebarOpenElement$.subscribe(value => {
      this.element = value.sidebarIdentifier;
    });
  }

  closeSidebar() {
    this.element = undefined;
  }
}
