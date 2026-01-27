import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { KommonitorDataSetupComponent } from './kommonitorDataSetup/kommonitor-data-setup.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, KommonitorDataSetupComponent]
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
    this.element = 'sidebarIndicatorConfigCollapse';
  }

  closeSidebar() {
    this.element = undefined;
    this.broadcastService.broadcast('sidebarClosed');
  }
}
