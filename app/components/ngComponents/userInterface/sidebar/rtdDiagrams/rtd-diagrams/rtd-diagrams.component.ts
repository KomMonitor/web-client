import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { ParameterData, RealTimeDataService, StationData, TimeseriesData, TimeseriesMap } from 'services/real-time-data-service/real-time-data.service';
import * as echarts from 'echarts';

export interface InputData {
  parameter: ParameterData;
  poiFeature: any;
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
export class RtdDiagramsComponent implements OnInit {

  loadingData:boolean = false;

  lineTitle: string = '';

  lineChart!:any;
  lineOption!:any;

  parameter!:ParameterData;

  constructor(
    private rtdService: RealTimeDataService
  ) {}

  ngOnInit(): void {
    // listen to changed rtd selected data
    this.rtdService.selectedData$.subscribe(value => {
      if(value.parameter) {
        this.parameter = value.parameter;
        this.lineTitle = `${this.parameter.name} [${this.parameter.unit}]`;   
      
        this.rtdService.getTimeseries(value.parameter).subscribe(
          result => this.buildLineChart(result)
        )
      }
    });
  }

  buildLineChart(data:TimeseriesMap) {

    this.rtdService.setLineChartOptions(this.parameter, this.rtdService.buildValuesArray(data), this.rtdService.buildDatesArray(data));

    // based on prepared DOM, initialize echarts instance
    if (!this.lineChart)
      this.lineChart = echarts.init(document.getElementById('rtdLineDiagram'));
    else {
      // explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
      this.lineChart.dispose();
      this.lineChart = echarts.init(document.getElementById('rtdLineDiagram'));
    }

    // use configuration item and data specified to show chart
    this.lineChart.setOption(this.rtdService.lineChartOptions);

    this.lineChart.hideLoading();
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }
}
