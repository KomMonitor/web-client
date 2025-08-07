import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

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

  ngOnInit(): void {
    // default open
    this.element = 'sidebarDiagramsCollapse';
  }
}
