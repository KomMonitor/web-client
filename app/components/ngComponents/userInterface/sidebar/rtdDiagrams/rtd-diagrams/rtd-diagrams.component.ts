import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { ParameterData, RealTimeDataService, TimeseriesMap } from 'services/real-time-data-service/real-time-data.service';
import * as echarts from 'echarts';
import * as noUiSlider from 'nouislider';
import { CustomSliderComponent, DisplayType, SliderType } from 'components/ngComponents/common/custom-slider/custom-slider.component';


export interface InputData {
  parameter: ParameterData;
  poiFeature: any;
}

@Component({
  selector: 'app-rtd-diagrams',
  templateUrl: './rtd-diagrams.component.html',
  styleUrls: ['./rtd-diagrams.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ExpandableBoxComponent,
    CustomSliderComponent
  ]
})
export class RtdDiagramsComponent implements OnInit, AfterViewInit {

  loadingData:boolean = false;

  lineTitle: string = '';

  lineChart!:any;
  lineOption!:any;

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
      
        this.rtdService.getTimeseries(value.parameter).subscribe(
          result => {
            this.buildLineChart(result);

            var timestamps = this.rtdService.buildRangeSliderValues(result);
            this.sliderData = timestamps;
            this.sliderMarker = [timestamps[0], timestamps[timestamps.length-1]];

            this.loadingData = false;
          }
        )
      }
    });
  }

  onSliderChange(value: number | number[]) {
    console.log(value);
  }

  ngAfterViewInit(): void {
   
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
