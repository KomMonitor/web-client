import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject,AfterViewInit } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { environment } from 'env_backup';
import * as echarts from 'echarts';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ajskommonitorDataExchangeServiceeProvider, ajskommonitorDiagramHelperServiceProvider, ajskommonitorFilterHelperServiceProvider } from 'app-upgraded-providers';
@Component({
  selector: 'app-indicator-radar',
  templateUrl: 'indicator-radar.template.html',
  providers:[ajskommonitorDataExchangeServiceeProvider,ajskommonitorDiagramHelperServiceProvider,ajskommonitorFilterHelperServiceProvider]
})
export class IndicatorRadarComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('radarDiagram', { static: false }) radarDiagram: ElementRef | undefined;
  private destroy$ = new Subject<void>();
  setupCompleted = false;
  private ngUnsubscribe: Subject<void> = new Subject<void>();
  eventsRegistered=false
  private resizeSubscription= new Subscription;
  public activeTab = 0;
  // public radarChart;
  radarOption;
  private DATE_PREFIX = environment.indicatorDatePrefix;
  public indicatorNameFilter = undefined;
  private numberOfDecimals = environment.numberOfDecimals;
  public date='';
  public spatialUnitName:string | undefined;
 public indicatorPropertiesForCurrentSpatialUnitAndTime: any[] = [];
 @ViewChild('radarChart') radarChart: any;

 FEATURE_ID_PROPERTY_NAME = environment.FEATURE_ID_PROPERTY_NAME;
 defaultSeriesValueArray: any[] = [];
 resizeTimeout: any;


  constructor(
    @Inject('ajsKommonitorDataExchangeService') private kommonitorDataExchangeService:any,
   @Inject('ajsKommonitorDiagramHelperService') private kommonitorDiagramHelperService:any,
   @Inject('ajsKommonitorFilterHelperService') private kommonitorFilterHelperService:any,
 
  ) { 
    
  }

  ngOnInit() {
    // Your initialization logic
    $('.box').boxWidget();

    $(window).on('resize', this.resizeChart.bind(this));

    // subscribe to the "resizeDiagrams" event
    // assuming that it's a Subject in your service
    this.kommonitorDiagramHelperService.resizeDiagrams.subscribe(() => {
      this.resizeTimeout = setTimeout(this.resizeChart.bind(this), 350);
    });

    this.kommonitorDiagramHelperService.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin$
    .pipe(takeUntil(this.destroy$))
    .subscribe(async () => {
      await this.wait(130);
      this.setupCompleted = false;
      setTimeout(() => this.filterDisplayedIndicatorsOnRadar(), 500);
    });

  this.kommonitorDiagramHelperService.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted$
    .pipe(takeUntil(this.destroy$))
    .subscribe(async () => {
      await this.wait(130);
      this.setupCompleted = true;
      setTimeout(() => this.filterDisplayedIndicatorsOnRadar(), 500);
    });


  }
  resizeChart() {
    if (this.radarChart) {
      this.radarChart.resize();
    }
  }

  ngAfterViewInit() {
    this.resizeSubscription = fromEvent(window, 'resize').subscribe(e => {
      if (this.radarChart) {
        this.radarChart.resize();
      }
    });
  }
  

  ngOnDestroy() {
    this.resizeSubscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    $(window).off('resize', this.resizeChart.bind(this));
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  onChangeFilterSameUnitAndSameTime() {
    if (this.radarChart && this.radarDiagram && this.radarDiagram.nativeElement) {
      this.radarChart.dispose();
      this.radarChart = echarts.init(this.radarDiagram.nativeElement);
    }
    
    this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
    this.kommonitorDiagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(this.kommonitorDiagramHelperService.filterSameUnitAndSameTime);
  }

  updateDiagrams(event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) {
    if (justRestyling) {
      return;
    }
    console.log("updating radar diagram");
    this.setupCompleted = false;
    this.updateRadarChart(indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date);
    // this.preserveHighlightedFeatures.emit();
  }

  async updateRadarChart(indicatorMetadataAndGeoJSON: any, spatialUnitName: string, spatialUnitId: string, date: any) {
    this.date = date;
    this.spatialUnitName = spatialUnitName;

    if (!this.radarChart) {
      this.radarChart = echarts.init(document.getElementById('radarDiagram'));
    } else {
      this.radarChart.dispose();
      this.radarChart = echarts.init(document.getElementById('radarDiagram'));
      this.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
    }

    await this.radarChart.showLoading();
    this.kommonitorDiagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime();
    
    this.activeTab = 0;

    if (this.kommonitorDataExchangeService.selectedIndicator.creationType === 'COMPUTATION') {
      this.activeTab = 1;
    }

    if (this.kommonitorDataExchangeService.selectedIndicator.isHeadlineIndicator) {
      this.activeTab = 2;
    }

    this.modifyRadarContent(this.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }

  private wait(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }
  onChangeSelectedDate(input: any): void {
    if (input.isSelected) {
      this.modifyRadarContent(this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
    }
  }
  appendSelectedFeaturesIfNecessary(sampleProperties: any[]) { // adjust the type of sampleProperties
    for (const propertiesInstance of sampleProperties) {
      if (this.kommonitorFilterHelperService.featureIsCurrentlySelected(propertiesInstance[environment.FEATURE_ID_PROPERTY_NAME])) {
        this.appendSeriesToRadarChart(propertiesInstance);
      }
    }
  }
  async modifyRadarContent(indicatorsForRadar: any[]): Promise<void> {
    const indicatorArrayForRadarChart:any[] = [];
    const defaultSeriesValueArray: any[] = [];
    let sampleProperties:any = undefined;

    
    for (let i = 0; i < indicatorsForRadar.length; i++) {
      if (indicatorsForRadar[i].isSelected) {
        await this.kommonitorDiagramHelperService.fetchIndicatorPropertiesIfNotExists(i);
        let indicatorProperties = indicatorsForRadar[i].indicatorProperties;
        if (this.kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay && this.kommonitorFilterHelperService.filteredIndicatorFeatureIds.size > 0) {
          indicatorProperties = indicatorProperties.filter(featureProperties => !this.kommonitorFilterHelperService.featureIsCurrentlyFiltered(featureProperties[this.FEATURE_ID_PROPERTY_NAME]));
        }
        sampleProperties = indicatorsForRadar[i].indicatorProperties;
        const sample = indicatorProperties[0];
        let maxValue = sample[this.DATE_PREFIX + indicatorsForRadar[i].selectedDate];
        let minValue = sample[this.DATE_PREFIX + indicatorsForRadar[i].selectedDate];
        let valueSum = 0;

        for (const indicatorPropertyInstance of indicatorProperties) {
          if (!this.kommonitorDataExchangeService.indicatorValueIsNoData(indicatorPropertyInstance[this.DATE_PREFIX + indicatorsForRadar[i].selectedDate])) {
            const value = this.kommonitorDataExchangeService.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, indicatorsForRadar[i].selectedDate);
            valueSum += value;
            if (value > maxValue)
              maxValue = value;
            if (value < minValue)
              minValue = value;
          }
        }
        if (minValue == null) {
          minValue = 0;
        }
        if (maxValue == null) {
          maxValue = 1;
        }
        let object = {
          name: indicatorsForRadar[i].indicatorMetadata.indicatorName + " - " + indicatorsForRadar[i].selectedDate,
          unit: indicatorsForRadar[i].indicatorMetadata.unit,
          max:maxValue,
          min: minValue
        };
        indicatorArrayForRadarChart.push(object);
        defaultSeriesValueArray.push(this.kommonitorDataExchangeService.getIndicatorValue_asNumber(Number(valueSum / indicatorProperties.length)));
      }
    };//end of for loop
    if (this.defaultSeriesValueArray.length === 0) {
      this.disposeRadarChart();
    } 
    else 
    {
      if (!this.radarChart) {
        this.radarChart = echarts.init(document.getElementById('radarDiagram'));
      }
      this.radarOption = {
        grid: {
          left: '4%',
          top: 0,
          right: '4%',
          bottom: 30,
          containLabel: true
        },
        title: {
          text: 'Indikatorenradar - ' + this.spatialUnitName + ' - ' + this.date,
          left: 'center',
          top: 0,
          show: false
        },
        tooltip: {
          confine: 'true',
          formatter: (params) => {
            let string = "" + params.name + "<br/>";
            for (let index = 0; index < params.value.length; index++) {
              string += this.radarOption.radar.indicator[index].name + ": " + this.kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value[index]) + " [" + this.radarOption.radar.indicator[index].unit + "]<br/>";
            }
            return string;
          }
        },
        toolbox :{
          show: true,
          right: '15',
          feature: {
            dataView: {
              show: this.kommonitorDataExchangeService.showDiagramExportButtons, 
              readOnly: true, 
              title: "Datenansicht", 
              lang: ['Datenansicht - Indikatorenradar', 'schließen', 'refresh'], 
              optionToContent: (opt: any) => {                                    
                let radarSeries = opt.series[0].data;
                let indicators = opt.radar[0].indicator;
                let dataTableId = "radarDataTable";
                let tableExportName = opt.title[0].text;
                let htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
                htmlString += "<thead>";
                htmlString += "<tr>";
                htmlString += "<th style='text-align:center;'>Feature-Name</th>";
                for (let i = 0; i < indicators.length; i++) {
                  htmlString += "<th style='text-align:center;'>" + indicators[i].name + " [" + indicators[i].unit + "]</th>";
                }
                htmlString += "</tr>";
                htmlString += "</thead>";
                htmlString += "<tbody>";
                for (let j = 0; j < radarSeries.length; j++) {
                  htmlString += "<tr>";
                  htmlString += "<td>" + radarSeries[j].name + "</td>";
                  for (let k = 0; k < indicators.length; k++) {
                    htmlString += "<td>" + this.kommonitorDataExchangeService.getIndicatorValue_asNumber(radarSeries[j].value[k]) + "</td>";
                  }
                  htmlString += "</tr>";
                }
                htmlString += "</tbody>";
                htmlString += "</table>";
                // Broadcast event to append export buttons for table
                // $rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);
                return htmlString;
              }
            },
            restore: { show: false, title: "Darstellung erneuern" },
            saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
          }
        },
    
        legend : {
          type: "scroll",
          bottom: 0,
          align: 'left',
          left: 5,
          data: ['Arithmetisches Mittel']
        },
    
        radar : {
          name: {
            formatter: (value: any, indicator: any) => {
              return this.kommonitorDataExchangeService.formatIndicatorNameForLabel(value, 15);
            },
            textStyle: {
              color: '#525252'
            },
            fontSize: 11
          },
          indicator: [] // indicatorArrayForRadarChart
        },
        series:[{
          name: 'Indikatorvergleich',
          type: 'radar',
          symbolSize: 8,
          data: [
            {
              value: this.defaultSeriesValueArray,
              name: 'Arithmetisches Mittel',
              lineStyle: {
                color: 'gray',
                type: 'dashed',
                width: 3
              },
              itemStyle: {
                borderWidth: 2,
                color: 'gray'
              },
              emphasis: {
                lineStyle: {
                  width: 4
                },
                itemStyle: {
                  borderType: 'dashed'
                }
              }
            }
          ]
        }]



        // Add other options here
      }//end of radar options
    }// end of else
    this.appendSelectedFeaturesIfNecessary(sampleProperties);
    this.radarChart.setOption(this.radarChart.nativeElement, this.radarOption); // Assuming you have a method to set the option
    this.radarChart.hideLoading(this.radarChart.nativeElement); // Assuming you have a method to hide loading
    setTimeout(() => {
      this.radarChart.resize(this.radarChart.nativeElement); // Assuming you have a method to resize the chart
    }, 350);
    this.registerEventsIfNecessary(); // Assuming you have this method

    
  
  } // endof modifycharater

 

  registerEventsIfNecessary() {
    if (!this.eventsRegistered) {
      this.radarChart.on('mouseOver', (params: any) => { // adjust the type of params
        const spatialFeatureName = params.data.name;
        if (spatialFeatureName) {
          // broadcast event
        }
      });

      this.radarChart.on('mouseOut', (params: any) => { // adjust the type of params
        const spatialFeatureName = params.data.name;
        if (spatialFeatureName) {
          // broadcast event
        }
      });

      this.eventsRegistered = true;
    }
  }

  updateDiagramsForHoveredFeature(featureProperties: any) { // adjust the type of featureProperties
    if (!this.radarChart || !this.radarOption || !this.radarOption.legend || !this.radarOption.series) {
      return;
    }
    if (!this.kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[environment.FEATURE_ID_PROPERTY_NAME])) {
      this.appendSeriesToRadarChart(featureProperties);
    }
    this.highlightFeatureInRadarChart(featureProperties);
  }

  appendSeriesToRadarChart(featureProperties: any): void {
    this.radarOption.legend.data.push(featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
    let valueArray: any[] = [];
    let featureSeries = {
      name: featureProperties[environment.FEATURE_NAME_PROPERTY_NAME],
      value: valueArray,
      emphasis: {
        lineStyle: {
          width: 4,
          type: 'dotted'
        }
      },
      lineStyle: {
        width: 3,
        type: 'solid'
      },
      itemStyle: {
        borderWidth: 2
      }
    };

    for (let i = 0; i < this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.length; i++) {
      if (this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].isSelected) {
        let indicatorProperties = this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorProperties;
        let date = this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].selectedDate;
        for (let indicatorPropertyInstance of indicatorProperties) {
          if (indicatorPropertyInstance[environment.FEATURE_NAME_PROPERTY_NAME] == featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]) {
            if (!this.kommonitorDataExchangeService.indicatorValueIsNoData(indicatorPropertyInstance[date])) {
              featureSeries.value.push(this.kommonitorDataExchangeService.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, date));
            }
            else {
              featureSeries.value.push();
            }
            break;
          }
        }
      }
    }

    this.radarOption.series[0].data.push(featureSeries);
    this.radarChart.setOption(this.radarOption);
    setTimeout(() => {
      this.radarChart.resize();
    }, 350);
    this.registerEventsIfNecessary();
  }

  highlightFeatureInRadarChart(featureProperties: any): void {
    let dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
    if (dataIndex > -1) {
      this.radarChart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: dataIndex
      });
    }
  }

  updateDiagramsForUnhoveredFeature(event: any, featureProperties: any): void {
    if (!this.radarChart || !this.radarOption || !this.radarOption.legend || !this.radarOption.series) {
      return;
    }
    this.unhighlightFeatureInRadarChart(featureProperties);
    if (!this.kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[environment.FEATURE_ID_PROPERTY_NAME])) {
      this.removeSeriesFromRadarChart(featureProperties);
    }
  }


  getSeriesDataIndexByFeatureName(featureName: string): number {
    for (let index = 0; index < this.radarOption.series[0].data.length; index++) {
      if (this.radarOption.series[0].data[index].name == featureName)
        return index;
    }
    //return -1 if none was found
    return -1;
  }

  removeSeriesFromRadarChart(featureProperties: any): void {
    // remove feature from legend
    let legendIndex = this.radarOption.legend.data.indexOf(featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
    if (legendIndex > -1) {
      this.radarOption.legend.data.splice(legendIndex, 1);
    }
    // remove feature data series
    let dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
    if (dataIndex > -1) {
      this.radarOption.series[0].data.splice(dataIndex, 1);
    }
    // second parameter tells echarts to not merge options with previous data. hence really remove series from graphic
    this.radarChart.setOption(this.radarOption, true);
    setTimeout(() => {
      this.radarChart.resize();
    }, 350);
    this.registerEventsIfNecessary();
  }

  unhighlightFeatureInRadarChart(featureProperties: any): void {
    // highlight the corresponding bar diagram item
    // get series index of series
    let dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
    if (dataIndex > -1) {
      this.radarChart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        dataIndex: dataIndex
      });
    }
  }

  filterDisplayedIndicatorsOnRadar(): void {
    console.log("Filtering indicator radar");
    this.modifyRadarContent(this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }

  selectAllIndicatorsForRadar() {
    for (let indicator of this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
        indicator.isSelected = true;
    }
    this.modifyRadarContent(this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
}

deselectAllIndicatorsForRadar() {
    for (let indicator of this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
        indicator.isSelected = false;
    }
    this.modifyRadarContent(this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
}












  disposeRadarChart() {
    if (this.radarChart) {
      this.radarChart.dispose();
      this.radarChart = undefined;
    }
  }














} // class ending of IndicatorRadarComponent





























