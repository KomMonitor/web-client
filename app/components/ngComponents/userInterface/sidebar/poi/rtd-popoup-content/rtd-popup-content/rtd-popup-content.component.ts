import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ParameterData, RealTimeDataService, StationData } from 'services/real-time-data-service/real-time-data.service';
import { SidebarService } from '../../../sidebar.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rtd-popup-content',
  templateUrl: './rtd-popup-content.component.html',
  styleUrls: ['./rtd-popup-content.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RtdPopupContentComponent {

  @Input() stationData!: StationData;
  @Input() poiFeature!: any;

  constructor(
    private sidebarService: SidebarService,
    private rtdService: RealTimeDataService
  ) {}

  onChangeSelectedParameter(parameter: ParameterData) {
    this.rtdService.selectedData$.next({...this.rtdService.selectedData$.getValue(), parameter: parameter, poiFeature: this.poiFeature});
  }

  onParameterClick(parameter: ParameterData) {
    if(parameter.selected!==true) {
      parameter.selected = true;
      this.onChangeSelectedParameter(parameter);
    }
    
    this.sidebarService.sidebarOpenElement$.next({sidebarIdentifier:'sidebarRtdDiagramCollapse'});
  }
}
