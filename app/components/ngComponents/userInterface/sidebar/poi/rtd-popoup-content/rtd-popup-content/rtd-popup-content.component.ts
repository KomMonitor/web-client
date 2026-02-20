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

  @Input() stationData!: StationData;
  @Input() poiFeature!: any;

  constructor(
    private sidebarService: SidebarService
  ) {}

  onParameterClick(parameter: ParameterData) {

    this.sidebarService.sidebarOpenElement$.next({sidebarIdentifier:'sidebarRtdDiagramCollapse', data: {station: this.stationData, parameter: parameter, poiFeature: this.poiFeature}});
  }
}
