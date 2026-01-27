import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
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
