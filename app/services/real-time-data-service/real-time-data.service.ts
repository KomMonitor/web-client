import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DisplayFormat } from 'components/ngComponents/userInterface/sidebar/rtdDiagrams/rtd-diagrams/rtd-diagrams.component';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

export interface StationData {
  name: string;
  id: number;
  position: {
    x: number;
    y: number;
  },
  parameters: ParameterData[];
}

export interface ParameterData {
  id: number;
  name: string;
  unit: string;
  last_entry: TimeseriesData;
  range: {
    start: Date;
    end: Date;
  }
  selected: boolean;
}

export interface TimeseriesData {
  value: number;
  timestamp: Date;
}

export interface TimeseriesMap {
  [key: string]: TimeseriesData[];
}

export interface SelectedData {
  parameter: ParameterData | undefined;
  poiFeature: any | undefined;
  displayFormat: DisplayFormat;
}

@Injectable({
  providedIn: 'root'
})
export class RealTimeDataService {

  stationData:StationData[] = [];
  
  lineChartOptions = {series: [{name:''}]};

  customFontFamily!:any; 

  selectedData$ = new BehaviorSubject<SelectedData>({parameter: undefined, poiFeature: undefined, displayFormat: DisplayFormat.STD});

  lineColor:string[] = [
    'red',
    'green',
    'yellow',
    'blue',
    'purple',
    'amber',
  ];

  constructor(
    private http: HttpClient,
    private dataExchangeService: DataExchangeService
  ) { 
    this.customFontFamily = this.setCustomFontFamily();

    //this.setLineChartOptions()
  }

  setCustomFontFamily() {
    var elem:any = document.querySelector('#fontFamily-reference');
    var style = getComputedStyle(elem);
    return style.fontFamily;
  }

  loadStationData():Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<StationData[]>(`${this.dataExchangeService.baseUrlToRealTimeData}/stations`).subscribe({
        next: response=> {
          this.stationData = response;
          resolve();
        }
      })
    });
  }

  getStationData(stationId):StationData | undefined {
    return this.stationData.find(e => e.id==stationId);
  }

  stationExists(stationId: number):boolean {
    return this.stationData.some(e => e.id==stationId);
  }

  getTimeseries(parameter: ParameterData):Observable<TimeseriesMap> {

    var selectedItems = this.stationData.filter(e => e.parameters.some(p => p.id==parameter.id && p.selected===true));

    const requests = selectedItems.reduce((acc, station) => {
      acc[station.name] = this.http.get<TimeseriesData[]>(`${this.dataExchangeService.baseUrlToRealTimeData}/timeseries/${station.id}/${parameter.id}`);
      return acc;
    }, {} as Record<string, Observable<any>>);

    return forkJoin(requests);
  }

  setLineChartOptions(parameter:ParameterData, series:any[], datesArray:string[]) {

    var lineOption:any = {
      textStyle: {fontFamily: this.customFontFamily},
      // grid get rid of whitespace around chart
      grid: {
        left: '4%',
        top: 32,
        right: '4%',
        bottom: 55,
        containLabel: true
      },
      title: {
        text: `Zeitreihe - ${parameter.name}`,
        left: 'center',
        show: false,
        textStyle: {
          fontSize: 18
        },
        // top: 15
      },
      tooltip: {
        trigger: 'axis',
        confine: 'true',
        formatter: (params) => {

          var string = "" + params[0].axisValueLabel + "<br/>";

          params.forEach((paramObj) => {

            if(! paramObj.seriesName.includes("Stack")){
              var value = this.dataExchangeService.getIndicatorValue_asFormattedText(paramObj.value);
              string += paramObj.seriesName + ": " + value + " [" + parameter.unit + "]" + "<br/>";
            }                
          });

          return string;
        },
        axisPointer: {
          type: 'line',
          crossStyle: {
            color: '#999'
          }
        }
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: this.dataExchangeService.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Zeitreihe', 'schlie&szlig;en', 'refresh'], optionToContent: (opt) => {

              var lineSeries = opt.series;
              var timestamps = opt.xAxis[0].data;

              var dataTableId = "lineDataTable_" + Math.random();
              var tableExportName = opt.xAxis[0].name + " - " + opt.title[0].text;

              var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += "<thead>";
              htmlString += "<tr>";
              htmlString += "<th style='text-align:center;'>Zeitpunkt</th>";

              for (var i = 0; i < lineSeries.length; i++) {
                htmlString += "<th style='text-align:center;'>" + lineSeries[i].name + " [" + opt.yAxis[0].name + "]</th>";
              }

              htmlString += "</tr>";
              htmlString += "</thead>";

              htmlString += "<tbody>";

              for (var j = 0; j < timestamps.length; j++) {
                htmlString += "<tr>";
                htmlString += "<td>" + timestamps[j] + "</td>";
                for (var k = 0; k < lineSeries.length; k++) {
                  var value = this.dataExchangeService.getIndicatorValue_asFormattedText(lineSeries[k].data[j]);
                  htmlString += "<td>" + value + "</td>";
                }
                htmlString += "</tr>";
              }

              htmlString += "</tbody>";
              htmlString += "</table>";

              //this.broadcastService.broadcast("AppendExportButtonsForTable", [dataTableId, tableExportName]);

              return htmlString;
            }
          },
          restore: { show: false, title: "Erneuern" },
          saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
        }
      },
      legend: {
        type: "plain",
        orient: "horizontal",
        bottom: 0
      },
      xAxis: {
        name: 'Zeit',
        nameLocation: 'center',
        nameGap: 22,
        // axisLabel: {
        // 	rotate: 90,
        // 	interval: 0,
        // 	inside: true
        // },
        // z: 6,
        // zlevel: 6,
        type: 'category',
        axisTick: {
          show: false
        },
        data: datesArray
      },
      yAxis: {
        type: 'value',
        name: parameter.unit,
        axisLabel: {
          formatter: (value, index) => {
            return this.dataExchangeService.getIndicatorValue_asFormattedText(value);
          }
        }
        
        // splitArea: {
        //     show: true
        // }
      },
      series: series
    };     
    
    // use configuration item and data specified to show chart
    this.lineChartOptions = lineOption;
  }

  buildRangeSliderValues(data: TimeseriesMap):Date[] {

    let dates:Date[] = [];

    Object.entries(data).forEach(([id, value]) => {
      value.forEach(e => {
        if(!dates.includes(e.timestamp))
          dates.push(e.timestamp);
      })
    });
    
    return dates;
  }

  buildDatesArray(data:TimeseriesMap):string[] {

    let dates:Date[] = [];

    Object.entries(data).forEach(([id, value]) => {
      value.forEach(e => {
        if(!dates.includes(e.timestamp))
          dates.push(e.timestamp);
      })
    });
    
    return dates.map(e => { return new Date(e).toLocaleDateString('de-DE'); });
  }

  buildValuesArray(data:TimeseriesMap):any {

    var series:any[] = [];
    var index = 0;

    Object.entries(data).forEach(([id, value]) => {

      series.push({
        name: id,
        type: 'line',
        data: value.map(e => e.value),
        symbolSize: 6,
        symbol: "emptyCircle",
        lineStyle: {
          normal: {
            color: this.lineColor[index],
            width: 2,
          }
        },
        itemStyle: {
          normal: {
            borderWidth: 3,
            color: 'gray'
          }
        }
      });

      index++;
    });  

    return series;
  }
}
