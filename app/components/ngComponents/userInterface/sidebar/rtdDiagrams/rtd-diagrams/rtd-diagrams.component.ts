import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { ParameterData, RealTimeDataService, StationData } from 'services/real-time-data-service/real-time-data.service';
import * as echarts from 'echarts';

export interface InputData {
  station: StationData;
  parameter: ParameterData;
}

@Component({
  selector: 'app-rtd-diagrams',
  templateUrl: './rtd-diagrams.component.html',
  styleUrls: ['./rtd-diagrams.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ExpandableBoxComponent
  ]
})
export class RtdDiagramsComponent implements OnChanges {

  @Input() data!: InputData;

  loadingData:boolean = false;

  lineTitle: string = '';

  lineChart!:any;
  lineOption!:any;

  constructor(
    private rtdService: RealTimeDataService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {

    if(this.data) {
      this.lineTitle = `${this.data.parameter.name} [${this.data.parameter.unit}]`;   
    
      this.rtdService.getTimeseries(this.data.station, this.data.parameter).subscribe({
        next: response => {
          this.updateLineChart();
        },
        error: error => {
          console.error('Unable to get timeseries data', error);
        }
      });
    }
  }

  updateLineChart() {
    // based on prepared DOM, initialize echarts instance
    if (!this.lineChart)
      this.lineChart = echarts.init(document.getElementById('rtdLineDiagram'));
    else {
      // explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
      this.lineChart.dispose();
      this.lineChart = echarts.init(document.getElementById('rtdLineDiagram'));
    }

    // use configuration item and data specified to show chart
    this.lineOption = this.rtdService.getLineChartOptions(true);
    this.lineChart.setOption(this.lineOption);

    this.lineChart.hideLoading();
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }
}
