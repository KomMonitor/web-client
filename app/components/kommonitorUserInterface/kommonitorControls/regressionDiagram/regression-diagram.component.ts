import { Component, OnInit,OnDestroy, ElementRef } from '@angular/core';


@Component({
  selector: 'regression-chart',
  templateUrl: 'regression-diagram.template.html'
})


export class RegressionDiagramComponent implements OnInit, OnDestroy {
 

  filterIndicatorsBySpatialUnitAndDate = (item: any) => {
    return async () => {
      if (item.applicableSpatialUnits.some((o: any) => o.spatialUnitName === this.kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
        return item.applicableDates.includes(this.kommonitorDataExchangeService.selectedDate);
      } else {
        return false;
      }
    };
  };

  wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  activeTab = 0;
  selection: {
    indicatorNameFilterForXAxis?: string,
    indicatorNameFilterForYAxis?: string
  } = {};
  DATE_PREFIX: string;
  numberOfDecimals: number;
  defaultColorForFilteredValues: string;
  defaultColorForZeroValues: string;
  defaultColorForNoDataValues: string;
  defaultColorForHoveredFeatures: string;
  defaultColorForClickedFeatures: string;
  defaultColorForOutliers_high: string;
  defaultBorderColorForOutliers_high: string;
  defaultFillOpacityForOutliers_high: number;
  defaultColorForOutliers_low: string;
  defaultBorderColorForOutliers_low: string;
  defaultFillOpacityForOutliers_low: number;
  setupCompleted = true;
  selectedIndicatorForXAxis: any;
  selectedIndicatorForYAxis: any;
  correlation: any;
  linearRegression: any;
  regressionOption: any;
  regressionChart: any;
  data: any;
  dataWithLabels: any;
  eventsRegistered = false;
  sortedIndicatorProps: any;
  spatialUnitName: string;
  date: any;
  private resizeSubscription: Subscription;

  constructor(
    private elementRef :ElementRef,
    private kommonitorDataExchangeService: KommonitorDataExchangeService,
    private kommonitorDiagramHelperService: KommonitorDiagramHelperService
  ) {
    this.DATE_PREFIX = this.kommonitorDataExchangeService.indicatorDatePrefix;
    this.numberOfDecimals = this.kommonitorDataExchangeService.numberOfDecimals;
    this.defaultColorForFilteredValues = this.kommonitorDataExchangeService.defaultColorForFilteredValues;
    this.defaultColorForZeroValues = this.kommonitorDataExchangeService.defaultColorForZeroValues;
    this.defaultColorForNoDataValues = this.kommonitorDataExchangeService.defaultColorForNoDataValues;
    this.defaultColorForHoveredFeatures = this.kommonitorDataExchangeService.defaultColorForHoveredFeatures;
    this.defaultColorForClickedFeatures = this.kommonitorDataExchangeService.defaultColorForClickedFeatures;
    this.defaultColorForOutliers_high = this.kommonitorDataExchangeService.defaultColorForOutliers_high;
    this.defaultBorderColorForOutliers_high = this.kommonitorDataExchangeService.defaultBorderColorForOutliers_high;
    this.defaultFillOpacityForOutliers_high = this.kommonitorDataExchangeService.defaultFillOpacityForOutliers_high;
    this.defaultColorForOutliers_low = this.kommonitorDataExchangeService.defaultColorForOutliers_low;
    this.defaultBorderColorForOutliers_low = this.kommonitorDataExchangeService.defaultBorderColorForOutliers_low;
    this.defaultFillOpacityForOutliers_low = this.kommonitorDataExchangeService.defaultFillOpacityForOutliers_low;
  }

  ngOnInit(): void {
    this.setupResizeListener();    

    this.kommonitorDiagramHelperService.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin$.subscribe(async () => {
      await this.wait(130);
      this.setupCompleted = false;
      this.$timeout(() => {
        this.$digest();
      }, 500);
    });
    

    this.kommonitorDiagramHelperService.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted$.subscribe(async () => {
      await this.wait(100);
      this.$timeout(() => {
        this.setupCompleted = true;
        this.$digest();
        this.onChangeSelectedIndicators();
      }, 500);
    });






  }

  onChangeSelectedDate(input: any): void {
    this.onChangeSelectedIndicators();
  }

  onChangeFilterSameUnitAndSameTime(): void {
    if (this.regressionChart) {
      this.regressionChart.dispose();
      this.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
    }
    this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
    this.kommonitorDiagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(this.kommonitorDiagramHelperService.filterSameUnitAndSameTime);
  }

  ngOnDestroy(): void {
    this.resizeSubscription.unsubscribe();
  }

  private setupResizeListener(): void {
    this.resizeSubscription = this.kommonitorDiagramHelperService.resizeDiagrams$.subscribe(() => {
      this.resizeChart();
    });
  }

  private resizeChart(): void {
    if (this.regressionChart) {
      setTimeout(() => {
        this.regressionChart.resize();
      }, 350);
    }
  }

  filterIndicators(): any {
    return this.kommonitorDataExchangeService.filterIndicators();
  }

  updateDiagrams(
    indicatorMetadataAndGeoJSON: any,
    spatialUnitName: string,
    spatialUnitId: string,
    date: any,
    defaultBrew: any,
    gtMeasureOfValueBrew: any,
    ltMeasureOfValueBrew: any,
    dynamicIncreaseBrew: any,
    dynamicDecreaseBrew: any,
    isMeasureOfValueChecked: boolean,
    measureOfValue: string,
    justRestyling: boolean
  ): void {

    if (justRestyling) {
      this.onChangeSelectedIndicators();
    } else {
      if (this.regressionChart) {
        this.regressionChart.dispose();
        this.regressionChart = undefined;
      }

      this.setupCompleted = false;

      this.selection.selectedIndicatorForXAxis = undefined;
      this.selection.selectedIndicatorForYAxis = undefined;

      this.$timeout(() => {
        $("option").each((index: number, element: any) => {
          const text = $(element).text();
          $(element).attr("title", text);
        });
      });
    }
    this.activeTab = 0;
    if (this.kommonitorDataExchangeService.selectedIndicator.creationType === "COMPUTATION") {
      this.activeTab = 1;
    }
    if (this.kommonitorDataExchangeService.selectedIndicator.isHeadlineIndicator) {
      this.activeTab = 2;
    }
    this.$timeout(() => {
      this.onChangeSelectedIndicators();
    }, 500);
  }

  this.kommonitorDiagramHelperService.updateDiagramsForHoveredFeature$.subscribe((featureProperties: any) => {
    if (!this.regressionChart) {
      return;
    }

    // if (this.userHoveresOverItem) {
    //   return;
    // }

    let index = -1;
    for (let i = 0; i < this.regressionOption.series[0].data.length; i++) {
      if (this.regressionOption.series[0].data[i].name === featureProperties[this.__env.FEATURE_NAME_PROPERTY_NAME]) {
        index = i;
        break;
      }
    }

    if (index > -1) {
      this.regressionChart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: index
      });

      // tooltip
      this.regressionChart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: index
      });
    }
  });




  this.kommonitorDiagramHelperService.updateDiagramsForUnhoveredFeature$.subscribe((featureProperties: any) => {
    if (!this.regressionChart) {
      return;
    }

    if (!this.kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[this.__env.FEATURE_ID_PROPERTY_NAME])) {
      // highlight the corresponding bar diagram item
      let index = -1;
      for (let i = 0; i < this.regressionOption.series[0].data.length; i++) {
        if (this.regressionOption.series[0].data[i].name === featureProperties[this.__env.FEATURE_NAME_PROPERTY_NAME]) {
          index = i;
          break;
        }
      }

      if (index > -1) {
        this.regressionChart.dispatchAction({
          type: 'downplay',
          seriesIndex: 0,
          dataIndex: index
        });

        // tooltip
        this.regressionChart.dispatchAction({
          type: 'hideTip',
          seriesIndex: 0,
          dataIndex: index
        });
      }
    }
  });


  getAllIndicatorPropertiesSortedBySpatialUnitFeatureName() {
    if (this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
      this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.forEach((indicatorProperty: any) => {
        indicatorProperty.indicatorProperties.sort((a: any, b: any) => {
          const nameA = a[this.__env.FEATURE_NAME_PROPERTY_NAME].toUpperCase();
          const nameB = b[this.__env.FEATURE_NAME_PROPERTY_NAME].toUpperCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });
      });
      return this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime;
    }
    return [];
}

async getPropertiesForIndicatorName(indicatorName: string) {
  for (const [index, indicator] of this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.entries()) {
    if (indicator.indicatorMetadata.indicatorName === indicatorName) {
      await this.kommonitorDiagramHelperService.fetchIndicatorPropertiesIfNotExists(index);

      // var closestApplicableTimestamp = this.kommonitorDiagramHelperService.findClostestTimestamForTargetDate(indicator, this.kommonitorDataExchangeService.selectedDate);
      // indicator.closestTimestamp = closestApplicableTimestamp;

      return indicator.indicatorProperties;
    }
  }
}

getColor(featureName: string) {
  let color: string | undefined;

  for (let index = 0; index < this.indicatorMetadataAndGeoJSON.geoJSON.features.length; index++) {
    const feature = this.indicatorMetadataAndGeoJSON.geoJSON.features[index];
    if (feature.properties[this.__env.FEATURE_NAME_PROPERTY_NAME] === featureName) {
      color = this.kommonitorDiagramHelperService.getColorForFeature(
        feature,
        this.indicatorMetadataAndGeoJSON,
        this.indicatorPropertyName,
        this.defaultBrew,
        this.gtMeasureOfValueBrew,
        this.ltMeasureOfValueBrew,
        this.dynamicIncreaseBrew,
        this.dynamicDecreaseBrew,
        this.isMeasureOfValueChecked,
        this.measureOfValue
      );
      break;
    }
  }

  return color;
}



mapRegressionData(indicatorPropertiesArray: any[], timestamp: string, map: Map<string, any>, axisValueName: string) {
  for (const indicatorPropertiesEntry of indicatorPropertiesArray) {
    const featureName = indicatorPropertiesEntry[this.__env.FEATURE_NAME_PROPERTY_NAME];
    let indicatorValue;

    if (this.kommonitorDataExchangeService.indicatorValueIsNoData(indicatorPropertiesEntry[this.DATE_PREFIX + timestamp])) {
      indicatorValue = null;
    } else {
      indicatorValue = this.kommonitorDataExchangeService.getIndicatorValue_asNumber(indicatorPropertiesEntry[this.DATE_PREFIX + timestamp]);
    }

    if (map.has(featureName)) {
      const oldObject = map.get(featureName);
      oldObject[axisValueName] = indicatorValue;
      map.set(featureName, oldObject);
    } else {
      const color = this.getColor(featureName);
      const regressionObject = {
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

  const indicatorPropertiesArrayForXAxis = await this.getPropertiesForIndicatorName(this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName);
  const indicatorPropertiesArrayForYAxis = await this.getPropertiesForIndicatorName(this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName);

  if (this.kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay && this.kommonitorFilterHelperService.filteredIndicatorFeatureIds.size > 0) {
    indicatorPropertiesArrayForXAxis = indicatorPropertiesArrayForXAxis.filter(featureProperties => !this.kommonitorFilterHelperService.featureIsCurrentlyFiltered(featureProperties[this.__env.FEATURE_ID_PROPERTY_NAME]));
    indicatorPropertiesArrayForYAxis = indicatorPropertiesArrayForYAxis.filter(featureProperties => !this.kommonitorFilterHelperService.featureIsCurrentlyFiltered(featureProperties[this.__env.FEATURE_ID_PROPERTY_NAME]));
  }

  const timestamp_xAxis = this.selection.selectedIndicatorForXAxis.selectedDate;
  const timestamp_yAxis = this.selection.selectedIndicatorForYAxis.selectedDate;

  /*
  consider several cases
  across data timestamps or whole features might not exist
  --> cope with that and only preserve those result objects that have both timestamp values 
  for x and y axis 
  */

  // store data in a map to check the above prerequisites
  // key = ID, 
  // value = regressionObject = {
  // 	name: featureName,											
  // 	itemStyle: {
  // 		color: color
  // 	},
  //  xAxisName: indicatorValue_x,
  //  yAxisName: indicatorValue_y
  //}
  const xAxisName = "xValue";
  const yAxisName = "yValue";
  let dataCandidateMap = this.mapRegressionData(indicatorPropertiesArrayForXAxis, timestamp_xAxis, new Map(), xAxisName);
  dataCandidateMap = this.mapRegressionData(indicatorPropertiesArrayForYAxis, timestamp_yAxis, dataCandidateMap, yAxisName);

  // now iterate over map and identify those objects that have both indicator axis values set
  // put those into resulting lists 

  dataCandidateMap.forEach((regressionObject, key) => {
    if (regressionObject[xAxisName] !== undefined && regressionObject[yAxisName] !== undefined) {
      this.data.push([regressionObject[xAxisName], regressionObject[yAxisName]]);

      regressionObject.value = [regressionObject[xAxisName], regressionObject[yAxisName]];

      this.dataWithLabels.push(regressionObject);
    }
  });

  return this.data;
}




function getPearsonCorrelation(x: number[], y: number[]): number {
  let shortestArrayLength = 0;

  if (x.length === y.length) {
      shortestArrayLength = x.length;
  } else if (x.length > y.length) {
      shortestArrayLength = y.length;
      console.error('x has more items in it, the last ' + (x.length - shortestArrayLength) + ' item(s) will be ignored');
  } else {
      shortestArrayLength = x.length;
      console.error('y has more items in it, the last ' + (y.length - shortestArrayLength) + ' item(s) will be ignored');
  }

  const x_numeric: number[] = [];
  const y_numeric: number[] = [];
  const xy: number[] = [];
  const x2: number[] = [];
  const y2: number[] = [];

  for (let i = 0; i < shortestArrayLength; i++) {
      if (x[i] !== undefined && y[i] !== undefined) {
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

  return Number(+answer.toFixed(2));
}


calculatePearsonCorrelation(data: number[][]): number {
  // data is an array of arrays containing the pairs of [x, y]

  const xArray: number[] = [];
  const yArray: number[] = [];

  data.forEach((xyPair) => {
      xArray.push(xyPair[0]);
      yArray.push(xyPair[1]);
  });

  return this.getPearsonCorrelation(xArray, yArray);
}

this.$scope.onChangeSelectedIndicators = async () => {
  if (this.$scope.selection.selectedIndicatorForXAxis) {
    this.$scope.selection.selectedIndicatorForXAxis_backup = this.$scope.selection.selectedIndicatorForXAxis;
  } else if (this.$scope.selection.selectedIndicatorForXAxis_backup) {
    this.$scope.selection.selectedIndicatorForXAxis = this.$scope.selection.selectedIndicatorForXAxis_backup;
  }

  if (this.$scope.selection.selectedIndicatorForYAxis) {
    this.$scope.selection.selectedIndicatorForYAxis_backup = this.$scope.selection.selectedIndicatorForYAxis;
  } else if (this.$scope.selection.selectedIndicatorForYAxis_backup) {
    this.$scope.selection.selectedIndicatorForYAxis = this.$scope.selection.selectedIndicatorForYAxis_backup;
  }

  if (this.$scope.selection.selectedIndicatorForXAxis && this.$scope.selection.selectedIndicatorForYAxis) {
    this.$scope.eventsRegistered = false;

    if (!this.$scope.regressionChart) {
      this.$scope.regressionChart = echarts.init(this.elementRef.nativeElement.querySelector('#regressionDiagram'));
    } else {
      // explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
      this.$scope.regressionChart.dispose();
      this.$scope.regressionChart = echarts.init(this.elementRef.nativeElement.querySelector('#regressionDiagram'));
    }

    await this.$scope.regressionChart.showLoading();

    const data = await this.$scope.buildDataArrayForSelectedIndicators();

    data.sort((a, b) => {
      return a[0] - b[0];
    });

    this.$scope.correlation = this.$scope.calculatePearsonCorrelation(data);

    this.$scope.linearRegression = ecStat.regression('linear', data);

    this.$scope.regressionOption = {
      grid: {
        left: '10%',
        top: 10,
        right: '5%',
        bottom: 55,
        containLabel: true
      },
      title: {
        text: 'Lineare Regression - ' + this.$scope.spatialUnitName + ' - ' + this.$scope.date,
        left: 'center',
        show: false
      },
      tooltip: {
        trigger: 'item',
        confine: 'true',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params) => {
          if (!(params && params.value && params.value[0] && params.value[1])) {
            return '';
          }
          let string = '' + params.name + '<br/>';
          string += this.$scope.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName + ': ' + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value[0]) + ' [' + this.$scope.selection.selectedIndicatorForXAxis.indicatorMetadata.unit + ']<br/>';
          string += this.$scope.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName + ': ' + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value[1]) + ' [' + this.$scope.selection.selectedIndicatorForYAxis.indicatorMetadata.unit + ']<br/>';
          return string;
        }
      },
      xAxis: {
        name: kommonitorDataExchangeService.formatIndicatorNameForLabel(this.$scope.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName + ' - ' + this.$scope.selection.selectedIndicatorForXAxis.selectedDate + ' [' + this.$scope.selection.selectedIndicatorForXAxis.indicatorMetadata.unit + ']', 100),
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
        name: kommonitorDataExchangeService.formatIndicatorNameForLabel(this.$scope.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName + ' - ' + this.$scope.selection.selectedIndicatorForYAxis.selectedDate + ' [' + this.$scope.selection.selectedIndicatorForYAxis.indicatorMetadata.unit + ']', 75),
        nameLocation: 'center',
        nameGap: 50,
        type: 'value',
        splitLine: {
          lineStyle: {
            type: 'dashed'
          }
        },
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: kommonitorDataExchangeService.showDiagramExportButtons,
            readOnly: true,
            title: 'Datenansicht',
            lang: ['Datenansicht - lineare Regression', 'schlie&szlig;en', 'refresh'],
            optionToContent: (opt) => {
              const scatterSeries = opt.series[0].data;
              const lineSeries = opt.series[1].data;
              const dataTableId = 'regressionDataTable';
              const tableExportName = opt.title[0].text + ' - Scatter Table';
              let htmlString = "<p>Data View enth&auml;lt zwei nachstehende Tabellen, die Tabelle des Scatter Plots und die Tabelle der Punkte der Regressionsgeraden.</p><br/>";
              htmlString += '<h4>Scatter Plot Tabelle</h4>';
              htmlString += '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += '<thead>';
              htmlString += '<tr>';
              htmlString += '<th style="text-align:center;">Feature-Name</th>';
              htmlString += '<th style="text-align:center;">' + opt.xAxis[0].name + '</th>';
              htmlString += '<th style="text-align:center;">' + opt.yAxis[0].name + '</th>';
              htmlString += '</tr>';
              htmlString += '</thead>';
              htmlString += '<tbody>';
              for (let j = 0; j < scatterSeries.length; j++) {
                htmlString += '<tr>';
                htmlString += '<td>' + scatterSeries[j].name + '</td>';
                htmlString += '<td>' + kommonitorDataExchangeService.getIndicatorValue_asNumber(scatterSeries[j].value[0]) + '</td>';
                htmlString += '<td>' + kommonitorDataExchangeService.getIndicatorValue_asNumber(scatterSeries[j].value[1]) + '</td>';
                htmlString += '</tr>';
              }
              htmlString += '</tbody>';
              htmlString += '</table>';
              const lineTableId = 'lineDataTable';
              const lineTableExportName = opt.title[0].text + ' - Line Table';
              htmlString += "<br/><h4>Referenzpunkte der Regressionsgraden '" + this.$scope.linearRegression.expression + "'</h4>";
              htmlString += '<table id="' + lineTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += '<thead>';
              htmlString += '<tr>';
              htmlString += '<th style="text-align:center;">X</th>';
              htmlString += '<th style="text-align:center;">Y</th>';
              htmlString += '</tr>';
              htmlString += '</thead>';
              htmlString += '<tbody>';
              for (let j = 0; j < lineSeries.length; j++) {
                htmlString += '<tr>';
                htmlString += '<td>' + kommonitorDataExchangeService.getIndicatorValue_asNumber(lineSeries[j][0]) + '</td>';
                htmlString += '<td>' + kommonitorDataExchangeService.getIndicatorValue_asNumber(lineSeries[j][1]) + '</td>';
                htmlString += '</tr>';
              }
              htmlString += '</tbody>';
              htmlString += '</table>';
              $rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);
              $rootScope.$broadcast("AppendExportButtonsForTable", lineTableId, lineTableExportName);
              return htmlString;
            }
          },
          restore: { show: false, title: 'Erneuern' },
          saveAsImage: { show: true, title: 'Export', pixelRatio: 4 }
        }
      },
      series: [
        {
          name: 'scatter',
          type: 'scatter',
          itemStyle: {
            borderWidth: 1,
            borderColor: 'black'
          },
          emphasis: {
            itemStyle: {
              borderWidth: 4,
              borderColor: defaultColorForClickedFeatures
            }
          },
          data: this.$scope.dataWithLabels
        },
        {
          name: 'line',
          type: 'line',
          showSymbol: false,
          data: this.$scope.linearRegression.points,
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
                formatter: this.$scope.linearRegression.expression,
                textStyle: {
                  color: '#333',
                  fontSize: 14
                }
              }
            },
            data: [
              {
                coord: this.$scope.linearRegression.points[this.$scope.linearRegression.points.length - 1]
              }
            ]
          }
        }
      ]
    };

    this.$scope.regressionChart.setOption(this.$scope.regressionOption);

    await this.$scope.regressionChart.hideLoading();
    setTimeout(() => {
      this.$scope.regressionChart.resize();
    }, 350);

    this.registerEventsIfNecessary();

    $rootScope.$broadcast("preserveHighlightedFeatures");

    $timeout(() => {
      this.$scope.$digest();
    }, 500);
  }
};



if (!this.$scope.eventsRegistered) {
  this.$scope.regressionChart.on('mouseover', (params) => {
    const spatialFeatureName = params.data.name;
    if (spatialFeatureName) {
      this.$rootScope.$broadcast('highlightFeatureOnMap', spatialFeatureName);
    }
  });

  this.$scope.regressionChart.on('mouseout', (params) => {
    const spatialFeatureName = params.data.name;
    if (spatialFeatureName) {
      this.$rootScope.$broadcast('unhighlightFeatureOnMap', spatialFeatureName);
    }
  });

  this.$scope.regressionChart.on('click', (params) => {
    const spatialFeatureName = params.data.name;
    if (spatialFeatureName) {
      this.$rootScope.$broadcast('switchHighlightFeatureOnMap', spatialFeatureName);
    }
  });

  this.$scope.eventsRegistered = true;
}


}














