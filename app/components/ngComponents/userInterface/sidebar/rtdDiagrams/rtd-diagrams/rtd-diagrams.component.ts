import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { ParameterData, RealTimeDataService, StationData, TimeseriesData } from 'services/real-time-data-service/real-time-data.service';
import * as echarts from 'echarts';

export interface InputData {
  station: StationData;
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
export class RtdDiagramsComponent implements OnChanges {

  @Input() data!: InputData;

  loadingData:boolean = false;

  lineTitle: string = '';
  poiTitle: string = '';
  poiAddress: string = '';

  lineChart!:any;
  lineOption!:any;

  constructor(
    private rtdService: RealTimeDataService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {

    if(this.data) {
      this.poiTitle = this.data.poiFeature.properties[window.__env.FEATURE_NAME_PROPERTY_NAME];
      this.poiAddress = this.data.poiFeature.properties.Adresse;
      this.lineTitle = `${this.data.parameter.name} [${this.data.parameter.unit}]`;   
    
      this.rtdService.getTimeseries(this.data.station, this.data.parameter).subscribe({
        next: (response:TimeseriesData[]) => {
          this.buildLineChart(response);
        },
        error: error => {
          console.error('Unable to get timeseries data', error);
        }
      });
    }
  }

  buildLineChart(data:TimeseriesData[]) {
    
    this.rtdService.setLineChartOptions(this.data.parameter, this.rtdService.buildValuesArray(data), this.rtdService.buildDatesArray(data), this.data.station.name);

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
