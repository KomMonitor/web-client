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

  prepCustomStyling(customFontFamilyEnabled, options) {

    if(customFontFamilyEnabled===true)
      options.textStyle = {fontFamily: this.customFontFamily};

    return options;
  }

  getLineChartOptions(customFontFamilyEnabled = false) {
    return this.prepCustomStyling(customFontFamilyEnabled, this.lineChartOptions);
  };

  setLineChartOptions(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray, indicatorTimeSeriesMaxArray, indicatorTimeSeriesMinArray, indicatorTimeSeriesRegionalMeanArray, indicatorTimeSeriesRegionalSpatiallyUnassignableArray, spatialUnitName, date) {

    var lineOption:any = {
      // grid get rid of whitespace around chart
      grid: {
        left: '4%',
        top: 32,
        right: '4%',
        bottom: 55,
        containLabel: true
      },
      title: {
        text: 'Zeitreihe - ' + spatialUnitName,
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
              string += paramObj.seriesName + ": " + value + " [" + indicatorMetadataAndGeoJSON.unit + "]" + "<br/>";
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

              // 	<table class="table table-condensed table-hover">
              // 	<thead>
              // 		<tr>
              // 			<th>Indikator-Name</th>
              // 			<th>Beschreibung der Verkn&uuml;pfung</th>
              // 		</tr>
              // 	</thead>
              // 	<tbody>
              // 		<tr ng-repeat="indicator in $ctrl.kommonitorDataExchangeServiceInstance.selectedIndicator.referencedIndicators">
              // 			<td>{{indicator.referencedIndicatorName}}</td>
              // 			<td>{{indicator.referencedIndicatorDescription}}</td>
              // 		</tr>
              // 	</tbody>
              // </table>

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
        name: indicatorMetadataAndGeoJSON.indicatorName,
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
        data: indicatorTimeSeriesDatesArray
      },
      yAxis: {
        type: 'value',
        name: indicatorMetadataAndGeoJSON.unit,
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
      
      ]
    };


    let meanLine = {
      name: this.dataExchangeService.rankingChartAverageLabel,
      type: 'line',
      data: indicatorTimeSeriesAverageArray,
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
    };

    let regionalMeanLine = {
      name: this.dataExchangeService.rankingChartRegionalReferenceValueLabel,
      type: 'line',
      symbolSize: 8,
      symbol: "circle",
      data: indicatorTimeSeriesRegionalMeanArray,
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
    };           

    let regionalMeanUsed = false;

    // only add regional mean line if it contains at least one meaningful entry
    if(indicatorTimeSeriesRegionalMeanArray.some(el => el !== null)){
      lineOption.series.push(regionalMeanLine);
      lineOption.legend.data.push(this.dataExchangeService.rankingChartRegionalReferenceValueLabel);
      regionalMeanUsed = true;
    }

    if(this.dataExchangeService.configMeanDataDisplay == "both" || (regionalMeanUsed == false && this.dataExchangeService.configMeanDataDisplay == 'preferRegionalMeanIfAvailable')){
      lineOption.series.push(meanLine);
      lineOption.legend.data.push(this.dataExchangeService.rankingChartAverageLabel);
    }     

    // SETTING FOR MIN AND MAX STACK

    // default for min value of 0
    var minStack:any = {
      name: "MinStack",
      type: 'line',
      data: indicatorTimeSeriesMinArray,
      stack: "MinMax",
      // areaStyle:{
      //   color: "#d6d6d6"
      // },
      lineStyle: {
        opacity: 0
      },
      itemStyle: {
        opacity: 0
      },
      silent: true
    };

    var minLine = {
      name: "Min",
      type: 'line',
      data: indicatorTimeSeriesMinArray,
      lineStyle: {
        opacity: 0,
        color: "#d6d6d6"
      },
      itemStyle: {
        opacity: 0
      }
    };

    var maxStack =  {
      name: "MaxStack",
      type: 'line',
      data: indicatorTimeSeriesMaxArray,
      stack: "MinMax",
      areaStyle:{
        color: "#d6d6d6"
      },
      lineStyle: {
        opacity: 0
      },
      itemStyle: {
        opacity: 0
      },
      silent: true
    };

    var maxLine =  {
      name: "Max",
      type: 'line',
      data: indicatorTimeSeriesMaxArray,
      lineStyle: {
        opacity: 0,
        color: "#d6d6d6"
      },
      itemStyle: {
        opacity: 0
      }
    };

    // perform checks if there are negative values or only > 0 values
    // then stacks must be adjusted to be correctly displayed
    var minStack_minValue = Math.min(...indicatorTimeSeriesMinArray);
    if(minStack_minValue < 0){
      minStack.areaStyle = {
          color: "#d6d6d6"
      };
    }

    let indicatorTimeSeriesMaxArray_copy = JSON.parse(JSON.stringify(indicatorTimeSeriesMaxArray));

    if ((indicatorTimeSeriesMinArray.filter(item => item > 0))){
      for (let index = 0; index < indicatorTimeSeriesMaxArray_copy.length; index++) {

        if(indicatorTimeSeriesMinArray[index] > 0){
          indicatorTimeSeriesMaxArray_copy[index] = indicatorTimeSeriesMaxArray_copy[index] - indicatorTimeSeriesMinArray[index];
        }            
      }
      maxStack.data = indicatorTimeSeriesMaxArray_copy;
    }

    lineOption.series.push(minLine);
    lineOption.series.push(maxLine);
    lineOption.series.push(minStack);
    lineOption.series.push(maxStack);

    // spatially unassignable
    let regionalSpatiallyUnassignableLine = {
      name: "räumlich nicht zuordenbare",
      type: 'line',
      symbol: "diamond",
      symbolSize: 10,
      data: indicatorTimeSeriesRegionalSpatiallyUnassignableArray,
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
    };
    // only add regional spatially unassignable line if it contains at least one meaningful entry
    if(indicatorTimeSeriesRegionalSpatiallyUnassignableArray.some(el => el !== null)){
      lineOption.series.push(regionalSpatiallyUnassignableLine);
      lineOption.legend.data.push("räumlich nicht zuordenbare");
    };
    

    // use configuration item and data specified to show chart
    this.lineChartOptions = lineOption;
  }
}
