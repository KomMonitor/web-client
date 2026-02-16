import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ParameterData, StationData } from 'services/real-time-data-service/real-time-data.service';
import { SidebarService } from '../../../sidebar.service';

@Component({
  selector: 'app-rtd-popup-content',
  templateUrl: './rtd-popup-content.component.html',
  styleUrls: ['./rtd-popup-content.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class RtdPopupContentComponent {

  @Input() data!: StationData;

  constructor(
    private sidebarService: SidebarService
  ) {}

  onParameterClick(station: StationData, parameter: ParameterData) {
    this.sidebarService.sidebarOpenElement$.next({sidebarIdentifier:'sidebarRtdDiagramCollapse', data: {station: station, parameter: parameter}});
  }
}
