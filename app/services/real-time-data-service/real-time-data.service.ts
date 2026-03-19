import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DisplayBreakup, DisplayFormat } from 'components/ngComponents/userInterface/sidebar/rtdDiagrams/rtd-diagrams/rtd-diagrams.component';
import { SidebarService } from 'components/ngComponents/userInterface/sidebar/sidebar.service';
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

export interface AggTimeseriesData {
  aggregated_values: number;
  time_bucket: Date;
}

export interface TimeseriesMap {
  [key: string]: TimeseriesData[];
}

export interface AggTimeseriesMap {
  [key: string]: AggTimeseriesData[];
}

export interface SelectedData {
  parameter: ParameterData | undefined;
  poiFeature: any | undefined;
  displayFormat: DisplayFormat;
  displayBreakup: DisplayBreakup;
  displayBreakupValue: number;
  range: undefined | {
    start: Date;
    end: Date;
  }
}

@Injectable({
  providedIn: 'root'
})
export class RealTimeDataService {

  stationData:StationData[] = [];
  
  lineChartOptions = {series: [{name:''}]};

  customFontFamily!:any; 

  displayFormat = DisplayFormat;
  displayBreakup = DisplayBreakup;

  selectedData$ = new BehaviorSubject<SelectedData>({parameter: undefined, poiFeature: undefined, displayFormat: DisplayFormat.AVG, displayBreakup: DisplayBreakup.DAY, displayBreakupValue: 1, range: undefined});

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
    private dataExchangeService: DataExchangeService,
    private sidebarService: SidebarService
  ) { 
    this.customFontFamily = this.setCustomFontFamily();

    //this.setLineChartOptions()
  }

  setCustomFontFamily() {
    var elem:any = document.querySelector('#fontFamily-reference');
    var style = getComputedStyle(elem);
    return style.fontFamily;
  }

  equalizeSelectedParameter(parameter: ParameterData) {
    // resets all previously selected parameters to false if param.ids do not match. only equal params can be displayed at once
    this.stationData.map(station => {
      station.parameters.map(param => {
        if(param.id!=parameter.id)
          param.selected = false;
      })
    });
  }

  checkForSelectedParams() {

    const selected = this.stationData.some(station => 
      station.parameters?.some(param => param.selected===true)
    );

    return selected;
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

  getTimeseries(parameter: ParameterData):Observable<TimeseriesMap | AggTimeseriesMap> {

    var selectedItems = this.stationData.filter(e => e.parameters.some(p => p.id==parameter.id && p.selected===true));

    let params = new HttpParams();
    if(this.selectedData$.value.range) {
      let start = new Date(this.selectedData$.value.range.start)

      // fix to always include the first time
      if(start.getMilliseconds()===0)
        start.setTime(start.getTime() -1);

      params = params.set('start', start.toISOString());

      let end = new Date(this.selectedData$.value.range.end);
      
      // fix to always include the last time
      if(end.getMilliseconds()===0)
        end.setTime(end.getTime() + 1);

      params = params.set('end', end.toISOString());
    }

    if(this.selectedData$.value.displayFormat && this.selectedData$.value.displayBreakup && this.selectedData$.value.displayBreakupValue) {
      params = params.set('function', this.selectedData$.value.displayFormat);
      params = params.set('frequency', `${this.selectedData$.value.displayBreakupValue} ${this.selectedData$.value.displayBreakup}`);
    }

    const requests = selectedItems.reduce((acc, station) => {
      acc[station.name] = this.http.get<TimeseriesData[]>(`${this.dataExchangeService.baseUrlToRealTimeData}/timeseries/${station.id}/${parameter.id}${(this.selectedData$.value.displayFormat!=this.displayFormat.STD)?'/aggregates':''}`,{params});
      return acc;
    }, {} as Record<string, Observable<any>>);

    return forkJoin(requests);
  }

  formatAxisValues(breakupValue:DisplayBreakup, breakupOptions) {
    return function (value) {
      const d = new Date(value);
      const hours = d.getHours();

      if(breakupValue==breakupOptions.MONTH) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear());
        
        if (hours === 0)
          return `${month}.${year}`;

        return '';
      }

      if(breakupValue==breakupOptions.YEAR) {
        const year = String(d.getFullYear());

        if (hours === 0)
          return year;

        return '';
      }

      const minutes = String(d.getMinutes()).padStart(2, '0');

      // Wenn Mitternacht → Datum anzeigen
      if (hours === 0) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `{bold|${day}.${month}.}`;
      }

      // sonst Uhrzeit
      return `${hours}:${minutes}`;
    };
  }

  setLineChartOptions(parameter:ParameterData, data:TimeseriesMap) {

    let series = this.buildValuesArray(data);

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
              var value = this.dataExchangeService.getIndicatorValue_asFormattedText(paramObj.value[1]);
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
        type: 'time',
        axisTick: {
          show: false
        },
        axisLabel: {
          formatter: this.formatAxisValues(this.selectedData$.value.displayBreakup, this.displayBreakup),
          rich: {
            bold: {
              fontWeight: 'bold',
              color: '#444'
            }
          }
        }
      },
      yAxis: {
        type: 'value',
        min: function (value) {
          return value.min - (value.min*0.1);
        },
        max: function (value) {
          return value.max + (value.max*0.1);
        },
        name: parameter.unit,
        axisLabel: {
          formatter: (value, index) => {
            return this.dataExchangeService.getIndicatorValue_asFormattedText(value);
          }
        }
      },
      series: series
    };     
    
    // use configuration item and data specified to show chart
    this.lineChartOptions = lineOption;
  }

  getRangeSliderValues(parameter:ParameterData):Date[] {

    let minStart: number | null = null;
    let maxEnd: number | null = null;

    var selectedItems = this.stationData.filter(e => e.parameters.some(p => p.id==parameter.id && p.selected===true));

    // globales start/end bestimmen
    for (const station of selectedItems) {
      for (const p of station.parameters) {
        if (p.id === parameter.id && p.selected) {

          const start = new Date(p.range.start).getTime();
          const end = new Date(p.range.end).getTime();

          if (minStart === null || start < minStart) {
            minStart = start;
          }

          if (maxEnd === null || end > maxEnd) {
            maxEnd = end;
          }
        }
      }
    }

    if (minStart === null || maxEnd === null) {
      return [];
    }

    // auf Tagesgrenzen normalisieren
    const startDate = new Date(minStart);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(maxEnd);
    endDate.setHours(23, 59, 59, 999);

    // Tagesarray erzeugen
    let timestamps: Date[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current.getTime() <= endDate.getTime()) {
      
      if(current.getTime()!=startDate.getTime())
        current.setHours(23, 59, 59, 999);

      const day = new Date(current);
      timestamps.push(day);

      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0); // wichtig
    }

    // breakup hours/minutes, dann array um stundenwerte erweitern
    if(this.selectedData$.value.displayBreakup==this.displayBreakup.HOUR || this.selectedData$.value.displayBreakup==this.displayBreakup.MINUTES) {

      const result:Date[] = [];
      let current = startDate;

      while (current <= endDate) {
        result.push(new Date(current));

        // +1 Stunde (UTC!)
        current.setUTCHours(current.getUTCHours() + 1);
      }

      timestamps = result;
    } 

    return timestamps;
  }

  mapValues(values:TimeseriesData[]):any[] {

    return values.map(e => [e.timestamp, e.value]);
  }

  
  buildValuesArray(data:TimeseriesMap):any {

    var series:any[] = [];
    var index = 0;

    Object.entries(data).forEach(([id, value]) => {

      series.push({
        name: id,
        type: 'line',
        data: this.mapValues(value),
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
