import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
}

export interface TimeseriesData {
  value: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RealTimeDataService {

  stationData:StationData[] = [];
  
  lineChartOptions = {series: [{name:''}]};

  customFontFamily!:any; 

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

  getTimeseries(station: StationData, parameter: ParameterData):Observable<any> {
    return this.http.get<TimeseriesData[]>(`${this.dataExchangeService.baseUrlToRealTimeData}/timeseries/${station.id}/${parameter.id}`);
  }

  setLineChartOptions(parameter:ParameterData, valuesArray:number[], datesArray:string[], title) {

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
        text: 'Zeitreihe - ' + title,
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
        type: "scroll",
        bottom: 0,
        data: []
      },
      xAxis: {
        name: parameter.name,
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
      series: [          
        {
          name: `${parameter.name} [${parameter.unit}]`,
          type: 'line',
          data: valuesArray,
          symbolSize: 6,
          symbol: "emptyCircle",
          lineStyle: {
            normal: {
              color: 'gray',
              width: 2,
              type: 'dashed'
            }
          },
          itemStyle: {
            normal: {
              borderWidth: 3,
              color: 'gray'
            }
          }
        }
      ]
    };     
    
    // use configuration item and data specified to show chart
    this.lineChartOptions = lineOption;
  }

  buildDatesArray(data:TimeseriesData[]):string[] {
    return data.map(e => {
      return new Date(e.timestamp).toLocaleDateString('de-DE'); 
    });
  }

  buildValuesArray(data:TimeseriesData[]):number[] {
    return data.map(e => {
      return e.value; 
    });
  }
}
