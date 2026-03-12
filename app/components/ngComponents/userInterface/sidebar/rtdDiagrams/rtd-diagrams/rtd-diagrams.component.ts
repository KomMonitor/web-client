import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { AggTimeseriesData, AggTimeseriesMap, ParameterData, RealTimeDataService, TimeseriesMap } from 'services/real-time-data-service/real-time-data.service';
import * as echarts from 'echarts';
import { CustomSliderComponent, DisplayType, SliderType } from 'components/ngComponents/common/custom-slider/custom-slider.component';
import { FormsModule } from '@angular/forms';
import { CdkDragPlaceholder } from "@angular/cdk/drag-drop";


export interface InputData {
  parameter: ParameterData;
  poiFeature: any;
}

export enum DisplayFormat {
  STD = 'std',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  SUM = 'sum'
}

export enum DisplayBreakup {
  DAY = '1 day',
  MONTH = '1 month',
  YEAR = '1 year'
}

@Component({
  selector: 'app-rtd-diagrams',
  templateUrl: './rtd-diagrams.component.html',
  styleUrls: ['./rtd-diagrams.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ExpandableBoxComponent,
    CustomSliderComponent,
    FormsModule
]
})
export class RtdDiagramsComponent implements OnInit {

  loadingData:boolean = false;

  lineTitle: string = '';

  lineChart!:any;
  lineOption!:any;

  displayFormat: DisplayFormat = DisplayFormat.AVG;
  displayFormatOptions = DisplayFormat;

  displayBreakup: DisplayBreakup = DisplayBreakup.DAY;
  displayBreakupOptions = DisplayBreakup;

  parameter!:ParameterData;

  DisplayMode = DisplayType;  
  SliderType = SliderType;
  sliderMarker:any[] = [];
  sliderData:any[] = [];

  constructor(
    private rtdService: RealTimeDataService
  ) {}

  ngOnInit(): void {
    // listen to changed rtd selected data
    this.rtdService.selectedData$.subscribe(value => {

      if(value.parameter) {
        this.loadingData = true;
        this.parameter = value.parameter;
        this.lineTitle = `${this.parameter.name} [${this.parameter.unit}]`;   
        
        var timestamps = this.rtdService.getRangeSliderValues(value.parameter);
        this.sliderData = timestamps;

        if(!this.rtdService.selectedData$.value.range)
          this.sliderMarker = [timestamps[0], timestamps[timestamps.length-1]];
        else
          this.sliderMarker = [this.rtdService.selectedData$.value.range.start, this.rtdService.selectedData$.value.range.end];
      
        this.rtdService.getTimeseries(value.parameter).subscribe(
          (result:any) => {

            if(this.rtdService.selectedData$.value.displayFormat!=this.displayFormatOptions.STD)
              this.buildLineChart(this.orderData(this.normalizeData(result)));
            else
              this.buildLineChart(this.orderData(result));

            this.loadingData = false;
          }
        )
      } 
    });
  }

  normalizeData(data:AggTimeseriesMap): TimeseriesMap {
    return Object.fromEntries(
      Object.entries(data).map(([key, values]) => [
        key,
        (values ?? []).map(v => ({
          value: v.aggregated_values,
          timestamp: v.time_bucket
        }))
      ])
    );
  }

  orderData(data: TimeseriesMap): TimeseriesMap {
    Object.values(data).forEach(series => {
      series.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });

    return data;
  }

  onChangeDisplayFormat() {

    if(this.displayFormat==this.displayFormatOptions.STD)
      this.displayBreakup = this.displayBreakupOptions.DAY;

    this.rtdService.selectedData$.next({...this.rtdService.selectedData$.getValue(), displayFormat: this.displayFormat, displayBreakup: this.displayBreakup});
  }

  onSliderChange(value: number | number[]) {
    this.rtdService.selectedData$.next({...this.rtdService.selectedData$.getValue(), range: {start: value[0], end: value[1]}});
  }

  buildLineChart(data:TimeseriesMap) {

    this.rtdService.setLineChartOptions(this.parameter, data);

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
