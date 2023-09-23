import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef,Inject,NgZone,ViewChild} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import { debounceTime ,takeUntil} from 'rxjs/operators';
import { environment } from 'env_backup';
declare var echarts: any; 
import { TableExport } from 'dependencies/tableexport/tableexport';
@Component({
  selector: 'app-kommonitor-diagrams',
  templateUrl: 'kommonitor-diagrams.template.html',
  styleUrls: ['./kommonitor-diagrams.component.css']
})
export class KommonitorDiagramsComponent implements OnInit, OnDestroy, AfterViewInit {
  histogramChart: any;
  barChart: any;
  lineChart: any;

  // replace these with actual environment values
  INDICATOR_DATE_PREFIX: string=environment.indicatorDatePrefix;
  defaultColorForHoveredFeatures: string=echarts.defaultColorForHoveredFeatures;
  defaultColorForClickedFeatures: string=echarts.defaultColorForClickedFeatures;
  numberOfDecimals: number=environment.numberOfDecimals;
  defaultColorForZeroValues: string=environment.defaultColorForZeroValues;
  defaultColorForNoDataValues: string=environment.defaultColorForNoDataValues;
  defaultColorForFilteredValues: string=environment.defaultColorForFilteredValues;
  defaultColorForOutliers_high: string=environment.defaultColorForOutliers_high;
  defaultBorderColorForOutliers_high: string=environment.defaultBorderColorForOutliers_high;
  defaultFillOpacityForOutliers_high: string=environment.defaultFillOpacityForOutliers_high;
  defaultColorForOutliers_low: string=environment.defaultColorForOutliers_low;
  defaultBorderColorForOutliers_low: string=environment.defaultBorderColorForOutliers_low;
  defaultFillOpacityForOutliers_low:string=environment.defaultFillOpacityForOutliers_low;

  private barOption: any;
  isTooManyFeatures = false;
  histogramCanBeDisplayed :boolean=false;
  indicatorPropertyName!: string;
  spatialUnitName!: string;
  date: any;
  loadingData!: boolean;
  private destroy$: Subject<void> = new Subject<void>();
  @ViewChild('lineDiagram', { static: false })
  lineDiagram!: ElementRef;
  private ngUnsubscribe = new Subject();
  lineOption: any = { legend: { data: [] } };
  FEATURE_NAME_PROPERTY_NAME = environment.FEATURE_NAME_PROPERTY_NAME; 
  private resizeSubscription: Subscription=new Subscription();
  private eventsRegistered: boolean = false;
indicatorPr
  private highlightFeatureOnMap: Subject<string> = new Subject<string>();
  private unhighlightFeatureOnMap: Subject<string> = new Subject<string>();
  private switchHighlightFeatureOnMap: Subject<string> = new Subject<string>();
  @ViewChild('lineDiagram')
  //lineDiagram!: ElementRef;
  private unsubscribe$ = new Subject<void>();
  featureNamePropertyName: string =environment.FEATURE_NAME_PROPERTY_NAME; 

  constructor( private ngZone: NgZone, 
    @Inject('ajsKommonitorDataExchangeService') private kommonitorDataExchangeService: any,
    @Inject('ajsKommonitorDiagramHelperService') private kommonitorDiagramHelperService: any,
    @Inject('ajsKommonitorFilterHelperService') private kommonitorFilterHelperService: any
  ) {}


  ngOnInit(): void {
 


    this.resizeSubscription = fromEvent(window, 'resize')
    .pipe(debounceTime(350))
    .subscribe(() => this.resizeCharts());

     
    this.kommonitorDiagramHelperService.updateDiagramsEvent.pipe(takeUntil(this.destroy$)).subscribe(event => {
      this.loadingData = true;
      this.showLoadingIcons();
      this.spatialUnitName = event.spatialUnitName;
      this.date = event.date;
      this.kommonitorDiagramHelperService.prepareAllDiagramResources_forCurrentMapIndicator(event.indicatorMetadataAndGeoJSON, event.spatialUnitName, event.date, event.defaultBrew, event.gtMeasureOfValueBrew, event.ltMeasureOfValueBrew, event.dynamicIncreaseBrew, event.dynamicDecreaseBrew, event.isMeasureOfValueChecked, event.measureOfValue, false);
      this.updateLineChart({},[],[])
      this.updateBarChart();
      this.loadingData = false;
    });


  } //end of ngoninit

  ngAfterViewInit() {
    this.histogramChart = echarts.init(document.getElementById('histogramChart'));
    this.barChart = echarts.init(document.getElementById('barChart'));
    this.lineChart = echarts.init(document.getElementById('lineChart'));
    this.initLineChart();
    
  }

  /*
    updateDiagrams(event: any, indicatorMetadataAndGeoJSON: any, spatialUnitName: string, spatialUnitId: string, date: string, defaultBrew: any, gtMeasureOfValueBrew: any, ltMeasureOfValueBrew: any, dynamicIncreaseBrew: any, dynamicDecreaseBrew: any, isMeasureOfValueChecked: boolean, measureOfValue: any, justRestyling: boolean) {
      this.loadingData = true;
      this.showLoadingIcons();
      this.spatialUnitName = spatialUnitName;
      this.date = date;
      this.kommonitorDiagramHelperService.prepareAllDiagramResources_forCurrentMapIndicator(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, false);
      this.updateLineChart();
      this.updateBarChart();
      this.loadingData = false;
    }
  */







  


  ngOnDestroy() {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.ngUnsubscribe.next(0);
    this.ngUnsubscribe.complete();
  }


 
  resizeCharts() {
    if (this.histogramChart) {
      this.histogramChart.resize();
    }

    if (this.barChart) {
      this.barChart.resize();
    }

    if (this.lineChart) {
      this.lineChart.resize();
    }
  }

  compareFeaturesByIndicatorValue(featureA, featureB) {
    if (featureA.properties[this.indicatorPropertyName] < featureB.properties[this.indicatorPropertyName])
      return -1;
    if (featureA.properties[this.indicatorPropertyName] > featureB.properties[this.indicatorPropertyName])
      return 1;
    return 0;
  }


  showLoadingIcons() {
    if (this.histogramChart) {
      this.histogramChart.showLoading();
    }
    if (this.barChart) {
      this.barChart.showLoading();
    }
    if (this.lineChart) {
      this.lineChart.showLoading();
    }
  }

  updateHistogramChart() {
    this.histogramCanBeDisplayed = false;
    if (!this.histogramChart) {
      this.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
    } else {
      this.histogramChart.dispose();
      this.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
    }
    let histogramOption = this.kommonitorDiagramHelperService.getHistogramChartOptions();
    this.histogramChart.setOption(histogramOption);
    this.histogramChart.hideLoading();
    this.histogramCanBeDisplayed = true;
    setTimeout(() => {
      this.histogramChart.resize();
    }, 350);
  }

//Bar Chart diagram info
  updateBarChart() {
    this.eventsRegistered = false;
    if (!this.barChart) {
      this.barChart = echarts.init(document.getElementById('barDiagram'));
    } else {
      this.barChart.dispose();
      this.barChart = echarts.init(document.getElementById('barDiagram'));
    }
    let barOption = this.kommonitorDiagramHelperService.getBarChartOptions();
    this.barChart.setOption(barOption);
    this.barChart.hideLoading();
    setTimeout(() => {
      this.barChart.resize();
    }, 350);
    this.registerEventsIfNecessary();
  }

  registerEventsIfNecessary() {
    if (!this.eventsRegistered) {
      this.ngZone.runOutsideAngular(() => {
        this.barChart.on('mouseOver', (params) => {
          let seriesIndex = params.seriesIndex;
          let dataIndex = params.dataIndex;
          let spatialFeatureName = this.barOption.xAxis.data[dataIndex];
          if(spatialFeatureName){
            this.highlightFeatureOnMap.next(spatialFeatureName);
          }
        });

        this.barChart.on('mouseOut', (params) => {
          let seriesIndex = params.seriesIndex;
          let dataIndex = params.dataIndex;
          let spatialFeatureName = this.barOption.xAxis.data[dataIndex];
          if(spatialFeatureName){
            this.unhighlightFeatureOnMap.next(spatialFeatureName);
          }
        });

        this.barChart.on('click', (params) => {
          let seriesIndex = params.seriesIndex;
          let dataIndex = params.dataIndex;
          let spatialFeatureName = this.barOption.xAxis.data[dataIndex];
          if(spatialFeatureName){
            this.switchHighlightFeatureOnMap.next(spatialFeatureName);
          }
        });

        this.eventsRegistered = true;
      });
    }
  }




 

  updateLineChart(indicatorMetadataAndGeoJSON: any, indicatorTimeSeriesDatesArray: any, indicatorTimeSeriesAverageArray: any) {
    this.initLineChart();
    this.lineOption = this.kommonitorDiagramHelperService.getLineChartOptions();
    this.lineChart.setOption(this.lineOption);
    this.lineChart.hideLoading();
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }

  appendSeriesToLineChart(featureProperties: any) {
    if (this.kommonitorDataExchangeService.isBalanceChecked) {
      featureProperties = this.findPropertiesForTimeSeries(featureProperties[this.FEATURE_NAME_PROPERTY_NAME]);
    }
    this.lineOption.legend.data.push(featureProperties[this.FEATURE_NAME_PROPERTY_NAME]);
    let featureSeries:any = {};
    featureSeries.name = featureProperties[this.FEATURE_NAME_PROPERTY_NAME];
    featureSeries.type = 'line';
    featureSeries.data = new Array();
    for (let date of this.lineOption.xAxis.data) {
      let value;
      //remove this operator and indicator_date_prefix
      if (this.kommonitorDataExchangeService.indicatorValueIsNoData(featureProperties[this.INDICATOR_DATE_PREFIX + date])) {
        value = null;
      }
      else {
        value = this.kommonitorDataExchangeService.getIndicatorValue_asNumber(featureProperties[this.INDICATOR_DATE_PREFIX + date]);
      }
      featureSeries.data.push(value);
    }
    this.lineOption.series.push(featureSeries);
    this.lineChart.setOption(this.lineOption);
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }

  findPropertiesForTimeSeries(spatialUnitFeatureName: string) {
    for (let feature of this.kommonitorDataExchangeService.selectedIndicator.geoJSON.features) {
      if (feature.properties[this.FEATURE_NAME_PROPERTY_NAME] === spatialUnitFeatureName) {
        return feature.properties;
      }
    }
  }

  highlightFeatureInBarChart(featureProperties: any) {
    let index = -1;
    for (let i = 0; i < this.barOption.xAxis.data.length; i++) {
      if (this.barOption.xAxis.data[i] === featureProperties[this.FEATURE_NAME_PROPERTY_NAME]) {
        index = i;
        break;
      }
    }

    if (index > -1) {
      this.barChart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: index
      });
      this.barChart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: index
      });
    }
  }

  private initLineChart() {
    if (!this.lineChart) {
      this.lineChart = echarts.init(this.lineDiagram.nativeElement);
    } else {
      this.lineChart.dispose();
      this.lineChart = echarts.init(this.lineDiagram.nativeElement);
    }
  }


  highlightFeatureInLineChart(featureProperties: any): void {
    const seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
    if (seriesIndex > -1) {
      this.lineChart.dispatchAction({
        type: 'highlight',
        seriesIndex: seriesIndex
      });
    }
  }

  updateDiagramsForHoveredFeature(featureProperties: any) {
    if (!this.lineOption.legend.data.includes(featureProperties[this.featureNamePropertyName])) {
      this.appendSeriesToLineChart(featureProperties);
    }
    this.highlightFeatureInBarChart(featureProperties);
    this.highlightFeatureInLineChart(featureProperties);
  }

  updateDiagramsForUnhoveredFeature(featureProperties: any): void {
    if (!this.kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[environment.FEATURE_ID_PROPERTY_NAME])) {
      this.unhighlightFeatureInLineChart(featureProperties);
      this.removeSeriesFromLineChart(featureProperties);
      this.unhighlightFeatureInBarChart(featureProperties);
    }
  }


  getSeriesIndexByFeatureName(featureName: string): number {
    for (let index = 0; index < this.lineOption.series.length; index++) {
      if (this.lineOption.series[index].name === featureName) return index;
    }
    return -1;
  }

  removeSeriesFromLineChart(featureProperties: any): void {
    const legendIndex = this.lineOption.legend.data.indexOf(featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
    if (legendIndex > -1) {
      this.lineOption.legend.data.splice(legendIndex, 1);
    }

    const seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]);
    if (seriesIndex > -1) {
      this.lineOption.series.splice(seriesIndex, 1);
    }

    this.lineChart.setOption(this.lineOption, true);
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }

  unhighlightFeatureInBarChart(featureProperties: any): void {
    let index = -1;
    for (let i = 0; i < this.barOption.xAxis.data.length; i++) {
      if (this.barOption.xAxis.data[i] === featureProperties[environment.FEATURE_NAME_PROPERTY_NAME]) {
        index = i;
        break;
      }
    }

    if (index > -1) {
      this.barChart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        dataIndex: index
      });
      this.barChart.dispatchAction({
        type: 'hideTip',
        seriesIndex: 0,
        dataIndex: index
      });
    }
  }


  
  unhighlightFeatureInLineChart(featureProperties: any) {
    let seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[this.FEATURE_NAME_PROPERTY_NAME]);

    if (seriesIndex > -1) {
      this.lineChart.dispatchAction({
        type: 'downplay',
        seriesIndex: seriesIndex
      });
    }
  }





  


    appendExportButtonsForTable(tableId: string, tableExportName: string) {
      setTimeout(() => {
        const tableElement = document.getElementById(tableId);
        if (tableElement) {
          new TableExport(tableElement, {
            headers: true,
            footers: true,
            formats: ['xlsx', 'csv', 'txt'],
            filename: tableExportName,
            bootstrap: true,
            exportButtons: true,
            position: 'top',
            ignoreRows: [], // they generally arent needed
            ignoreCols:[], // they are generally not needed AND THEY CAN BE ARRAY or removed from the code
            trimWhitespace: true
          });
        } else {
          console.error(`Element with id "${tableId}" not found`);
        }
      }, 50);
    }
    




} //end of class
