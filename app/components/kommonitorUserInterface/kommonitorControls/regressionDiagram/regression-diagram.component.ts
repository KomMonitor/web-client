import { Component, OnInit, OnDestroy, Output,ViewChild,ElementRef ,ChangeDetectorRef} from '@angular/core';
import { EventEmitter,Inject } from '@angular/core';
import { Subscription ,Subject} from 'rxjs';
import { ajskommonitorDataExchangeServiceeProvider, ajskommonitorDiagramHelperServiceProvider, ajskommonitorFilterHelperServiceProvider } from 'app-upgraded-providers';
import { environment } from 'env_backup';
import { takeUntil } from 'rxjs';
declare var $: any;
import * as echarts from 'echarts';
import * as ecStat from 'echarts-stat';
import * as $ from 'jquery';

@Component({
  selector: 'regression-diagram',
  templateUrl: 'regression-diagram.template.html',
  providers:[ajskommonitorDataExchangeServiceeProvider,ajskommonitorDiagramHelperServiceProvider,ajskommonitorFilterHelperServiceProvider]
})
export class RegressionDiagramComponent implements OnInit, OnDestroy {
private ngUnsubscribe: Subject<void> = new Subject<void>();
@Output() appendExportButtonsForTable = new EventEmitter<{ id: string, name: string }>();
  activeTab = 0;
  DATE_PREFIX = environment.indicatorDatePrefix;
  numberOfDecimals = environment.numberOfDecimals;
  defaultColorForFilteredValues = environment.defaultColorForFilteredValues;
  defaultColorForZeroValues = environment.defaultColorForZeroValues;
  defaultColorForNoDataValues = environment.defaultColorForNoDataValues;
  defaultColorForHoveredFeatures = environment.defaultColorForHoveredFeatures;
  defaultColorForClickedFeatures = environment.defaultColorForClickedFeatures;
  defaultColorForOutliers_high = environment.defaultColorForOutliers_high;
  defaultBorderColorForOutliers_high = environment.defaultBorderColorForOutliers_high;
  defaultFillOpacityForOutliers_high = environment.defaultFillOpacityForOutliers_high;
  defaultColorForOutliers_low = environment.defaultColorForOutliers_low;
  defaultBorderColorForOutliers_low = environment.defaultBorderColorForOutliers_low;
  defaultFillOpacityForOutliers_low = environment.defaultFillOpacityForOutliers_low;
  selectedIndicatorForXAxis: any;
  selectedIndicatorForXAxis_backup: any;
  selectedIndicatorForYAxis: any;
  selectedIndicatorForYAxis_backup: any;
  correlation: any;
 public linearRegression: any;
  public regressionOption: any;
  public regressionChart: any;
  data: any;
  dataWithLabels: any;
  eventsRegistered = false;
  sortedIndicatorProps: any;
  spatialUnitName: any;
  date:string='';
  @ViewChild('regressionDiagram') regressionDiagram: ElementRef | undefined;
  @Output() updateDiagrams = new EventEmitter<any>();
  indicatorPropertyName: string | undefined;
  indicatorMetadataAndGeoJSON: any;
  defaultBrew: any;
  gtMeasureOfValueBrew: any;
  ltMeasureOfValueBrew: any;
  dynamicIncreaseBrew: any;
  dynamicDecreaseBrew: any;
  isMeasureOfValueChecked: boolean | undefined;
  measureOfValue: any;
  setupCompleted = false;
  selection :any= {
    selectedIndicatorForXAxis: null,
    selectedIndicatorForXAxis_backup: null,
    selectedIndicatorForYAxis: null,
    selectedIndicatorForYAxis_backup: null
  };
  resizeDiagramsSubscription: Subscription=new Subscription();
  private resizeSubscription: Subscription = new Subscription();
  toolbox: any;
  dataTableId: string | undefined;
  tableExportName: string | undefined;
  htmlString: string | undefined;
  scatterSeries: any;
  lineSeries: any;
  lineTableId: string | undefined;
  lineTableExportName: string |undefined
  
  constructor( private cd:ChangeDetectorRef,
   @Inject('kommonitorDataExchangeService') private kommonitorDataExchangeService:any,
   @Inject('kommonitorDiagramHelperService') private kommonitorDiagramHelperService:any,
   @Inject('kommonitorFilterHelperService') private kommonitorFilterHelperService:any,
  ) { }


  ngOnInit() {
    this.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
    $('.box').boxWidget();
    $(window).on('resize', () => {
      if (this.regressionChart) {
        this.regressionChart.resize();
      }
    });
    this.resizeDiagramsSubscription = this.kommonitorDiagramHelperService.resizeDiagrams.subscribe(() => {
      setTimeout(() => {
        if (this.regressionChart) {
          this.regressionChart.resize();
        }
      }, 350);
    });
    this.kommonitorDataExchangeService.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin.subscribe(async () => {
        await this.wait(130);
        this.setupCompleted = false;
      });
  
      this.kommonitorDataExchangeService.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted.subscribe(async () => {
        await this.wait(100);
        this.setupCompleted = true;
        this.onChangeSelectedIndicators();
      });




      this.updateDiagrams.subscribe((eventData: any) => {
        this.resetValues();
        this.indicatorPropertyName = 'DATE_PREFIX' + this.kommonitorDataExchangeService.selectedDate;
        this.spatialUnitName = eventData.spatialUnitName;
        this.date = eventData.date;
        this.indicatorMetadataAndGeoJSON = eventData.indicatorMetadataAndGeoJSON;
        this.defaultBrew = eventData.defaultBrew;
        this.gtMeasureOfValueBrew = eventData.gtMeasureOfValueBrew;
        this.ltMeasureOfValueBrew = eventData.ltMeasureOfValueBrew;
        this.dynamicIncreaseBrew = eventData.dynamicIncreaseBrew;
        this.dynamicDecreaseBrew = eventData.dynamicDecreaseBrew;
        this.isMeasureOfValueChecked = eventData.isMeasureOfValueChecked;
        this.measureOfValue = eventData.measureOfValue;
        if (eventData.justRestyling) {
          this.onChangeSelectedIndicators();
        } else {
          if (this.regressionChart) {
            this.regressionChart.dispose();
            this.regressionChart = undefined;
          }
          this.setupCompleted = false;
          this.selection.selectedIndicatorForXAxis = undefined;
          this.selection.selectedIndicatorForYAxis = undefined;
        

          setTimeout(() => {
            let options = document.querySelectorAll('option');
            options.forEach((element) => {
              let text = element.textContent || '';
              element.setAttribute("title", text);
            });
          }, 0);
          
        }
        this.activeTab = 0;
        if (this.kommonitorDataExchangeService.selectedIndicator.creationType == 'COMPUTATION') {
          this.activeTab = 1;
        }
        if (this.kommonitorDataExchangeService.selectedIndicator.isHeadlineIndicator) {
          this.activeTab = 2;
        }
        setTimeout(() => {
          this.onChangeSelectedIndicators();
        }, 500);
      });

//updatediagramsforhoveredfeature
      this.kommonitorFilterHelperService.updateDiagramsForHoveredFeature.pipe(takeUntil(this.ngUnsubscribe)).subscribe(featureProperties => {
        if (!this.regressionChart) {
          return;
        }
        let index = this.regressionOption.series[0].data.findIndex(data => data.name === featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
        if (index > -1) {
          this.regressionChart.dispatchAction({
            type: 'highlight',
            seriesIndex: 0,
            dataIndex: index
          });
          this.regressionChart.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            dataIndex: index
          });
        }
      });
  //updatediagramforunhiveredfeature
      this.kommonitorFilterHelperService.updateDiagramsForUnhoveredFeature.pipe(takeUntil(this.ngUnsubscribe)).subscribe(featureProperties => {
        if (!this.regressionChart) {
          return;
        }
        if (!this.kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[environment.FEATURE_ID_PROPERTY_NAME])) {
          let index = this.regressionOption.series[0].data.findIndex(data => data.name === featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
          if (index > -1) {
            this.regressionChart.dispatchAction({
              type: 'downplay',
              seriesIndex: 0,
              dataIndex: index
            });
            this.regressionChart.dispatchAction({
              type: 'hideTip',
              seriesIndex: 0,
              dataIndex: index
            });
          }
        }
      });





  } // closing for thr nginit

  ngOnDestroy() {
    $(window).off('resize');
    this.resizeDiagramsSubscription.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  filterIndicators() {
    return this.kommonitorDataExchangeService.filterIndicators();
  }

  async filterIndicatorsBySpatialUnitAndDate(item) {
    if (item.applicableSpatialUnits.some(o => o.spatialUnitName === this.kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
      return item.applicableDates.includes(this.kommonitorDataExchangeService.selectedDate);
    } else {
      return false;
    }
  }

  wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

// this function is gonna be coming in later parts of the code as line number 340
  onChangeSelectedIndicators():void {

      if (this.selection.selectedIndicatorForXAxis) {
          this.selection.selectedIndicatorForXAxis_backup = this.selection.selectedIndicatorForXAxis;
      }
      else if (this.selection.selectedIndicatorForXAxis_backup) {
          this.selection.selectedIndicatorForXAxis = this.selection.selectedIndicatorForXAxis_backup;
      }
      if (this.selection.selectedIndicatorForYAxis) {
          this.selection.selectedIndicatorForYAxis_backup = this.selection.selectedIndicatorForYAxis;
      }
      else if (this.selection.selectedIndicatorForYAxis_backup) {
          this.selection.selectedIndicatorForYAxis = this.selection.selectedIndicatorForYAxis_backup;
      }
      if (this.selection.selectedIndicatorForXAxis && this.selection.selectedIndicatorForYAxis) {
          this.eventsRegistered = false;
          if (!this.regressionChart)
              this.regressionChart = echarts.init(this.regressionDiagram.nativeElement);
          else {
              // explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
              this.regressionChart.dispose();
              this.regressionChart = echarts.init(this.regressionDiagram.nativeElement);
          }
          this.regressionChart.showLoading();
          // if(!this.sortedIndicatorProps){
          //  this.sortedIndicatorProps = this.getAllIndicatorPropertiesSortedBySpatialUnitFeatureName();
          // }
          this.buildDataArrayForSelectedIndicators().then(data => {
            data.sort(function (a, b) {
                return a[0] - b[0];
            });
          });
          
          this.correlation = this.calculatePearsonCorrelation(this.data);
          this.linearRegression = ecStat.regression('linear', this.data,0 );
          this.regressionOption = {
              grid: {
                  left: '10%',
                  top: 10,
                  right: '5%',
                  bottom: 55,
                  containLabel: true
              },
              title: {
                  text: 'Lineare Regression - ' + this.spatialUnitName + ' - ' + this.date,
                  left: 'center',
                  show: false
              },
              tooltip: {
                  trigger: 'item',
                  confine: 'true',
                  axisPointer: {
                      type: 'cross'
                  },
                  formatter: function (params) {
                      if (!(params && params.value && params.value[0] && params.value[1])) {
                          return "";
                      }
                      var string = "" + params.name + "<br/>";
                      string += this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName + ": " + this.kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value[0]) + " [" + this.selection.selectedIndicatorForXAxis.indicatorMetadata.unit + "]<br/>";
                      string += this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName + ": " + this.kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value[1]) + " [" + this.selection.selectedIndicatorForYAxis.indicatorMetadata.unit + "]<br/>";
                      return string;
                  }
              },

              xAxis :{
                name: this.kommonitorDataExchangeService.formatIndicatorNameForLabel(`${this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName} - ${this.selection.selectedIndicatorForXAxis.selectedDate} [${this.selection.selectedIndicatorForXAxis.indicatorMetadata.unit}]`, 100),
                nameLocation: 'center',
                nameGap: 22,
                scale: true,
                type: 'value',
                splitLine: {
                  lineStyle: {
                    type: 'dashed'
                  }
                },
              },
            
              yAxis: {
                name: this.kommonitorDataExchangeService.formatIndicatorNameForLabel(`${this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName} - ${this.selection.selectedIndicatorForYAxis.selectedDate} [${this.selection.selectedIndicatorForYAxis.indicatorMetadata.unit}]`, 75),
                nameLocation: 'center',
                nameGap: 50,
                type: 'value',
                splitLine: {
                  lineStyle: {
                    type: 'dashed'
                  }
                },
              },
              toolbox : {
                show: true,
                right: '15',
                feature: {
                  dataView: {
                    show: this.kommonitorDataExchangeService.showDiagramExportButtons,
                    readOnly: true,
                    title: "Datenansicht",
                    lang: ['Datenansicht - lineare Regression', 'schließ;en', 'refresh'],
                    optionToContent(opt: any) {
                      let scatterSeries = opt.series[0].data;
                      let lineSeries = opt.series[1].data;
                      let dataTableId = "regressionDataTable";
                      let tableExportName = `${opt.title[0].text} - Scatter Table`;
                      let htmlString = "<p>Data View enthä;lt zwei nachstehende Tabellen, die Tabelle des Scatter Plots und die Tabelle der Punkte der Regressionsgeraden.</p><br/>";
                      htmlString += '<h4>Scatter Plot Tabelle</h4>';
                      htmlString += `<table id="${dataTableId}" class="table table-bordered table-condensed" style="width:100%;text-align:center;">`;
                      htmlString += "<thead>";
                      htmlString += "<tr>";
                      htmlString += "<th style='text-align:center;'>Feature-Name</th>";
                      htmlString += `<th style='text-align:center;'>${opt.xAxis[0].name}</th>`;
                      htmlString += `<th style='text-align:center;'>${opt.yAxis[0].name}</th>`;
                      htmlString += "</tr>";
                      htmlString += "</thead>";
                      htmlString += "<tbody>";
                      for (let j = 0; j < scatterSeries.length; j++) {
                        htmlString += "<tr>";
                        htmlString += `<td>${scatterSeries[j].name}</td>`;
                        htmlString += `<td>${this.kommonitorDataExchangeService.getIndicatorValue_asNumber(scatterSeries[j].value[0])}</td>`;
                        htmlString += `<td>${this.kommonitorDataExchangeService.getIndicatorValue_asNumber(scatterSeries[j].value[1])}</td>`;
                        htmlString += "</tr>";
                      }
                      htmlString += "</tbody>";
                      htmlString += "</table>";
                      let lineTableId = "lineDataTable";
                      let lineTableExportName = `${opt.title[0].text} - Line Table`;
                      htmlString += `<br/><h4>Referenzpunkte der Regressionsgraden '${this.scope.linearRegression.expression}'</h4>`;
                      htmlString += `<table id="${lineTableId}" class="table table-bordered table-condensed" style="width:100%;text-align:center;">`;
                      htmlString += "<thead>";
                      htmlString += "<tr>"; 
                      htmlString += "<th style='text-align:center;'>X</th>";   
                      htmlString += "<th style='text-align:center;'>Y</th>";    
                      htmlString += "</tr>";   
                      htmlString += "</thead>";  
                      htmlString += "<tbody>";
                      for (let j = 0; j < lineSeries.length; j++) {
                        htmlString += "<tr>"; 
                        htmlString += `<td>${this.kommonitorDataExchangeService.getIndicatorValue_asNumber(lineSeries[j][0])}</td>`;
                        htmlString += `<td>${this.kommonitorDataExchangeService.getIndicatorValue_asNumber(lineSeries[j][1])}</td>`;
                        htmlString += "</tr>";
                      }
                      htmlString += "</tbody>";  
                      htmlString += "</table>";
                      this.$rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);
                      this.$rootScope.$broadcast("AppendExportButtonsForTable", lineTableId, lineTableExportName);
                      return htmlString;
                    }
                    
                  },//data view
                  restore: { show: false, title: "Erneuern" },
                  saveAsImage: { show: true, title: "Export", pixelRatio: 4 }

                }
              },// end of tool tip
              series: [{
                name: "scatter",
                type: 'scatter',
                itemStyle: {
                    borderWidth: 1,
                    borderColor: 'black'
                },
                emphasis: {
                    itemStyle: {
                        borderWidth: 4,
                        borderColor: this.defaultColorForClickedFeatures
                    }
                },
                data: this.dataWithLabels
            }, {
                name: 'line',
                type: 'line',
                showSymbol: false,
                data: this.linearRegression.points,
                markPoint: {
                    itemStyle: {
                        normal: {
                            color: 'transparent'
                        }
                    },
                    label: {
                        normal: {
                            show: true,
                            position: 'left',
                            formatter: this.linearRegression.expression,
                            textStyle: {
                                color: '#333',
                                fontSize: 14
                            }
                        }
                    },
                    data: [{
                        coord: this.linearRegression.points[this.linearRegression.points.length - 1]
                    }]
                }
            }]
            



          }//regression options end here






      }// ifcondition class ends here
  


      this.regressionChart.setOption(this.regressionOption);
      await this.regressionChart.hideLoading();
      setTimeout(() => {
          this.regressionChart.resize();
      }, 350);
      this.registerEventsIfNecessary();
      this.rootScope.$broadcast('preserveHighlightedFeatures');
      setTimeout(() => {
          this.cd.detectChanges();
      }, 500);
      



  }// classfor ending the indicators diagram

  onChangeSelectedDate(input: any): void {
    this.onChangeSelectedIndicators();
}




registerEventsIfNecessary(): void {
  if (!this.eventsRegistered) {
    // when hovering over elements of the chart then highlight them in the map.
    this.regressionChart.on('mouseOver', (params: any) => { // define the type of params
      const spatialFeatureName = params.data.name;

      if (spatialFeatureName) {
        this.rootScope.$broadcast("highlightFeatureOnMap", spatialFeatureName);
      }
    });

    this.regressionChart.on('mouseOut', (params: any) => { // define the type of params
      const spatialFeatureName = params.data.name;

      if (spatialFeatureName) {
        this.rootScope.$broadcast("unhighlightFeatureOnMap", spatialFeatureName);
      }
    });

    this.regressionChart.on('click', (params: any) => { // define the type of params
      const spatialFeatureName = params.data.name;

      if (spatialFeatureName) {
        this.$rootScope.$broadcast("switchHighlightFeatureOnMap", spatialFeatureName);
      }
    });

    this.eventsRegistered = true;
  }
}



onChangeFilterSameUnitAndSameTime() {
  if (this.regressionChart) {
    this.regressionChart.dispose();
    this.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
  }
  this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
  this.kommonitorDiagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(this.kommonitorDiagramHelperService.filterSameUnitAndSameTime);
}

resetValues(): void {
  this.correlation = undefined;
  this.linearRegression = undefined;
  this.regressionOption = undefined;
  this.sortedIndicatorProps = undefined;
  this.data = undefined;
  this.dataWithLabels = undefined;
  this.eventsRegistered = false;
}

getAllIndicatorPropertiesSortedBySpatialUnitFeatureName(): any {
  for (let i = 0; i < this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.length; i++) {
    // make object to hold indicatorName, max value and average value
    this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorProperties.sort((a, b) => {
      // a and b are arrays of indicatorProperties for all features of the selected spatialUnit. We sort them by their property "spatialUnitFeatureName"
      let nameA = a[environment.FEATURE_NAME_PROPERTY_NAME].toUpperCase(); // ignore upper and lowercase
      let nameB = b[environment.FEATURE_NAME_PROPERTY_NAME].toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      // names are equal
      return 0;
    });
  }
  return this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime;
}

async getPropertiesForIndicatorName(indicatorName: string): Promise<any> {
  for (let [index, indicator] of this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.entries()) {
    if (indicator.indicatorMetadata.indicatorName === indicatorName) {
      await this.kommonitorDiagramHelperService.fetchIndicatorPropertiesIfNotExists(index);
      return indicator.indicatorProperties;
    }
  }
}

getColor(featureName: string): string {
  let color: string='defaultcolour'
  for (let index = 0; index < this.indicatorMetadataAndGeoJSON.geoJSON.features.length; index++) {
    let feature = this.indicatorMetadataAndGeoJSON.geoJSON.features[index];
    if (feature.properties[environment.FEATURE_NAME_PROPERTY_NAME] === featureName) {
      color = this.kommonitorDiagramHelperService.getColorForFeature(feature, this.indicatorMetadataAndGeoJSON, this.indicatorPropertyName, this.defaultBrew, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.isMeasureOfValueChecked, this.measureOfValue);
      break;
    }
  }
  return color;
}

mapRegressionData(indicatorPropertiesArray: any[], timestamp: string, map: Map<string, any>, axisValueName: string): Map<string, any> {
  for (const indicatorPropertiesEntry of indicatorPropertiesArray) {
    let featureName = indicatorPropertiesEntry[environment.FEATURE_NAME_PROPERTY_NAME];
    let indicatorValue: number | null;
    if (this.kommonitorDataExchangeService.indicatorValueIsNoData(indicatorPropertiesEntry[this.DATE_PREFIX + timestamp])) {
      indicatorValue = null;
    }
    else {
      indicatorValue = this.kommonitorDataExchangeService.getIndicatorValue_asNumber(indicatorPropertiesEntry[this.DATE_PREFIX + timestamp]);
    }
    if (map.has(featureName)) {
      let oldObject = map.get(featureName);
      oldObject[axisValueName] = indicatorValue;
      map.set(featureName, oldObject);
    }
    else {
      let color = this.getColor(featureName);
      let regressionObject = {
        name: featureName,
        itemStyle: {
          color: color
        }
      };
      regressionObject[axisValueName] = indicatorValue;
      map.set(featureName, regressionObject);
    }
  }
  return map;
}

async buildDataArrayForSelectedIndicators() {
  this.data = [];
  this.dataWithLabels = [];
  let indicatorPropertiesArrayForXAxis = await this.getPropertiesForIndicatorName(this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName);
  let indicatorPropertiesArrayForYAxis = await this.getPropertiesForIndicatorName(this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName);
  if (this.kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay && this.kommonitorFilterHelperService.filteredIndicatorFeatureIds.size > 0) {
      indicatorPropertiesArrayForXAxis = indicatorPropertiesArrayForXAxis.filter(featureProperties => !this.kommonitorFilterHelperService.featureIsCurrentlyFiltered(featureProperties[environment.FEATURE_ID_PROPERTY_NAME]));
      indicatorPropertiesArrayForYAxis = indicatorPropertiesArrayForYAxis.filter(featureProperties => !this.kommonitorFilterHelperService.featureIsCurrentlyFiltered(featureProperties[environment.FEATURE_ID_PROPERTY_NAME]));
  }
  let timestamp_xAxis = this.selection.selectedIndicatorForXAxis.selectedDate;
  let timestamp_yAxis = this.selection.selectedIndicatorForYAxis.selectedDate;
  let xAxisName = "xValue";
  let yAxisName = "yValue";
  let dataCandidateMap = this.mapRegressionData(indicatorPropertiesArrayForXAxis, timestamp_xAxis, new Map(), xAxisName);
  dataCandidateMap = this.mapRegressionData(indicatorPropertiesArrayForYAxis, timestamp_yAxis, dataCandidateMap, yAxisName);
  // now iterate over map and identify those objects that have both indicator axis values set
  // put those into resulting lists 
  dataCandidateMap.forEach((regressionObject, key) => {
      // this.data.push([xAxisDataElement, yAxisDataElement])
      if (regressionObject[xAxisName] && regressionObject[yAxisName]) {
          this.data.push([regressionObject[xAxisName], regressionObject[yAxisName]]);
          regressionObject.value = [regressionObject[xAxisName], regressionObject[yAxisName]];
          this.dataWithLabels.push(regressionObject);
      }
  });
  return this.data;
}
getPearsonCorrelation(x: number[], y: number[]): number {
  let shortestArrayLength = 0;
  if (x.length === y.length) {
      shortestArrayLength = x.length;
  } else if (x.length > y.length) {
      shortestArrayLength = y.length;
      console.error(`x has more items in it, the last ${x.length - shortestArrayLength} item(s) will be ignored`);
  } else {
      shortestArrayLength = x.length;
      console.error(`y has more items in it, the last ${y.length - shortestArrayLength} item(s) will be ignored`);
  }

  const x_numeric: number[] = [];
  const y_numeric: number[] = [];
  const xy: number[] = [];
  const x2: number[] = [];
  const y2: number[] = [];

  for (let i = 0; i < shortestArrayLength; i++) {
      if (x[i] && y[i]) {
          x_numeric.push(x[i]);
          y_numeric.push(y[i]);
          xy.push(x[i] * y[i]);
          x2.push(x[i] * x[i]);
          y2.push(y[i] * y[i]);
      }
  }

  let sum_x = 0;
  let sum_y = 0;
  let sum_xy = 0;
  let sum_x2 = 0;
  let sum_y2 = 0;

  for (let i = 0; i < x_numeric.length; i++) {
      sum_x += x_numeric[i];
      sum_y += y_numeric[i];
      sum_xy += xy[i];
      sum_x2 += x2[i];
      sum_y2 += y2[i];
  }

  const step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
  const step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
  const step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
  const step4 = Math.sqrt(step2 * step3);
  const answer = step1 / step4;

  return Number(answer.toFixed(2));
}


calculatePearsonCorrelation(data: [number, number][]): number {
  const xArray: number[] = [];
  const yArray: number[] = [];

  data.forEach((xyPair: [number, number]) => {
      xArray.push(xyPair[0]);
      yArray.push(xyPair[1]);
  });

  return this.getPearsonCorrelation(xArray, yArray);
}





} //closing for the class 
