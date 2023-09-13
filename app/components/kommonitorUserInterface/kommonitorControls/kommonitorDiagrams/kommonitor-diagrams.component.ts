import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
//import { KommonitorDataExchangeService } from 'your-data-exchange-service-path'; // Replace with your actual service path
//import { KommonitorDiagramHelperService } from 'your-diagram-helper-service-path'; // Replace with your actual service path
//import { KommonitorFilterHelperService } from 'your-filter-helper-service-path'; // Replace with your actual service path
import * as echarts from 'echarts'; // Import echarts library

  import { environment } from 'env_backup';
@Component({
  selector: 'kommonitor-diagrams',
  templateUrl: 'kommonitor-diagrams.template.html', // Replace with your actual HTML file path

})
export class KommonitorDiagramsComponent implements OnInit{
    //private subscription: Subscription;
    private eventsRegistered = false;
    private isTooManyFeatures = false;
    private histogramCanBeDisplayed = false;
    private spatialUnitName: string | undefined;
    private date: string | undefined;
    private numberOfDecimals: number | undefined;
    private defaultColorForZeroValues: string | undefined;
    private defaultColorForNoDataValues: string | undefined;
    private defaultColorForFilteredValues: string | undefined;
    private defaultColorForOutliers_high:string | undefined;
    private defaultBorderColorForOutliers_high: string | undefined;
    private defaultFillOpacityForOutliers_high: string | undefined;
    private defaultColorForOutliers_low: string | undefined;
    private defaultBorderColorForOutliers_low: string | undefined;
    private defaultFillOpacityForOutliers_low: string | undefined;
    private histogramChart: echarts.ECharts | undefined; // Define chart properties
    private BarChart: echarts.ECharts | undefined; // Define chart properties
    private lineChart: echarts.ECharts | undefined;
    histogramOption: any;
    barOption!: echarts.EChartsOption;
    appendSeriesToLineChart: any;

  constructor(

  ) {}

  ngOnInit() {
    // Initialize your component here
   // this.initializeComponent();
  }
/*
  ngOnDestroy() {
    // Unsubscribe from any subscriptions if needed
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private initializeComponent() {
    // Add your component initialization logic here
    this.numberOfDecimals = environment.numberOfDecimals;
    this.defaultColorForZeroValues = environment.defaultColorForZeroValues;
    this.defaultColorForNoDataValues = environment.defaultColorForNoDataValues;
    this.defaultColorForFilteredValues = environment.defaultColorForFilteredValues;
    this.defaultColorForOutliers_high = environment.defaultColorForOutliers_high;
    this.defaultBorderColorForOutliers_high = environment.defaultBorderColorForOutliers_high;
    this.defaultFillOpacityForOutliers_high = environment.defaultFillOpacityForOutliers_high;
    this.defaultColorForOutliers_low = environment.defaultColorForOutliers_low;
    this.defaultBorderColorForOutliers_low = environment.defaultBorderColorForOutliers_low;
    this.defaultFillOpacityForOutliers_low = environment.defaultFillOpacityForOutliers_low;



  }

  private compareFeaturesByIndicatorValue(featureA, featureB): number {
    if (featureA.properties[this.indicatorPropertyName] < featureB.properties[this.indicatorPropertyName])
      return -1;
    if (featureA.properties[this.indicatorPropertyName] > featureB.properties[this.indicatorPropertyName])
      return 1;
    return 0;
  }

  private showLoadingIcons(): void {
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

  // Handle window resize event and trigger chart resizes
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
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


   //HISTOGRAM CHART FUNCTION

private updateHistogramChart(): void {
    this.histogramCanBeDisplayed = false;
    if (!this.histogramChart) {
      this.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
    } else {
      // explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
      this.histogramChart.dispose();
      this.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
    }
    this.histogramOption = this.kommonitorDiagramHelperService.getHistogramChartOptions();
    this.histogramChart.setOption(this.histogramOption);
    this.histogramChart.hideLoading();
    this.histogramCanBeDisplayed = true;
    setTimeout(() => {
      this.kommonitorDiagramHelperService.histogramChart.resize();
    }, 350);
  }
  
// BAR CHART FUNCTION
// Inside your Angular component class
private updateBarChart(
    indicatorMetadataAndGeoJSON: any, // Replace with the appropriate type
    featureNamesArray: any[], // Replace with the appropriate type
    indicatorValueBarChartArray: any[] // Replace with the appropriate type
  ): void {
    // based on prepared DOM, initialize echarts instance
    this.eventsRegistered = false;
    if (!this.barChart) {
      this.barChart = echarts.init(document.getElementById('barDiagram'));
    } else {
      // explicitly kill and reinstantiate bar diagram to avoid zombie states on spatial unit change
      this.barChart.dispose();
      this.barChart = echarts.init(document.getElementById('barDiagram'));
    }
    // use configuration item and data specified to show chart
    this.barOption = this.kommonitorDiagramHelperService.getBarChartOptions();
    this.barChart.setOption(this.barOption);
    this.barChart.hideLoading();
    setTimeout(() => {
      this.barChart.resize();
    }, 350);
    this.registerEventsIfNecessary();
  }
  
  // registering events if necessary 
private registerEventsIfNecessary(): void {
    if (!this.eventsRegistered) {
      // when hovering over elements of the chart then highlight them in the map.
      this.barChart.on('mouseOver', (params) => {
        const seriesIndex = params.seriesIndex;
        const dataIndex = params.dataIndex;
        const spatialFeatureName = this.barOption.xAxis.data[dataIndex];
        if (spatialFeatureName) {
          this.$rootScope.$broadcast("highlightFeatureOnMap", spatialFeatureName);
        }
      });
  
      this.barChart.on('mouseOut', (params) => {
        const seriesIndex = params.seriesIndex;
        const dataIndex = params.dataIndex;
        const spatialFeatureName = this.barOption.xAxis.data[dataIndex];
        if (spatialFeatureName) {
          this.$rootScope.$broadcast("unhighlightFeatureOnMap", spatialFeatureName);
        }
      });
  
      this.barChart.on('click', (params) => {
        const seriesIndex = params.seriesIndex;
        const dataIndex = params.dataIndex;
        const spatialFeatureName = this.barOption.xAxis.data[dataIndex];
        if (spatialFeatureName) {
          this.$rootScope.$broadcast("switchHighlightFeatureOnMap", spatialFeatureName);
        }
      });
  
      this.eventsRegistered = true;
    }
  }

  // Inside your Angular component class
private updateLineChart(
    indicatorMetadataAndGeoJSON: any, // Replace with the appropriate type
    indicatorTimeSeriesDatesArray: any[], // Replace with the appropriate type
    indicatorTimeSeriesAverageArray: any[] // Replace with the appropriate type
  ): void {
    // based on prepared DOM, initialize echarts instance
    if (!this.lineChart) {
      this.lineChart = echarts.init(document.getElementById('lineDiagram'));
    } else {
      // explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
      this.lineChart.dispose();
      this.lineChart = echarts.init(document.getElementById('lineDiagram'));
    }
    // use configuration item and data specified to show chart
    this.lineOption = this.kommonitorDiagramHelperService.getLineChartOptions();
    this.lineChart.setOption(this.lineOption);
    this.lineChart.hideLoading();
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }

@HostListener('updateDiagramsForHoveredFeature', ['$event', 'featureProperties'])
private onUpdateDiagramsForHoveredFeature(event: any, featureProperties: any): void {
  if (!this.lineOption.legend.data.includes(featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME])) {
    this.appendSeriesToLineChart(featureProperties);
  }
  this.highlightFeatureInBarChart(featureProperties);
  this.highlightFeatureInLineChart(featureProperties);
}


// Inside your Angular component class
private appendSeriesToLineChart(featureProperties: any): void {
    // In case of activated balance mode, we must use the properties of kommonitorDataExchangeService.selectedIndicator to acquire the correct time series item
    if (this.kommonitorDataExchangeServiceInstance.isBalanceChecked) {
      featureProperties = this.findPropertiesForTimeSeries(featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    }
 
    this.lineOption.legend.data.push(featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    // Create feature data series
    const featureSeries: any = {};
    featureSeries.name = featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME];
    featureSeries.type = 'line';
    featureSeries.data = new Array();
    // For each date, create a series data entry for the feature
    for (const date of this.lineOption.xAxis.data) {
      let value;
      if (this.kommonitorDataExchangeServiceInstance.indicatorValueIsNoData(featureProperties[this.INDICATOR_DATE_PREFIX + date])) {
        value = null;
      } else {
        value = this.kommonitorDataExchangeServiceInstance.getIndicatorValue_asNumber(featureProperties[this.INDICATOR_DATE_PREFIX + date]);
      }
      featureSeries.data.push(value);
    }
    this.lineOption.series.push(featureSeries);
    this.lineChart.setOption(this.lineOption);
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }
  
  private findPropertiesForTimeSeries(spatialUnitFeatureName: string): any {
    for (const feature of this.kommonitorDataExchangeServiceInstance.selectedIndicator.geoJSON.features) {
      if (feature.properties[this.environment.FEATURE_NAME_PROPERTY_NAME] === spatialUnitFeatureName) {
        return feature.properties;
      }
    }
  }
  
  // Inside your Angular component class
private highlightFeatureInBarChart(featureProperties: any): void {
    // Highlight the corresponding bar diagram item
    // Get index of bar item
    const index = this.barOption.xAxis.data.findIndex(item => item === featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    if (index > -1) {
      this.barChart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: index,
      });
      // Tooltip
      this.barChart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: index,
      });
    }
  }
  
  private highlightFeatureInLineChart(featureProperties: any): void {
    // Highlight the corresponding bar diagram item
    // Get series index of series
    const seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    if (seriesIndex > -1) {
      this.lineChart.dispatchAction({
        type: 'highlight',
        seriesIndex: seriesIndex,
      });
    }
  }
  
  private unhighlightFeatureInBarChart(featureProperties: any): void {
    // Unhighlight the corresponding bar diagram item
    // Get index of bar item
    const index = this.barOption.xAxis.data.findIndex(item => item === featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    if (index > -1) {
      this.barChart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        dataIndex: index,
      });
      // Tooltip
      this.barChart.dispatchAction({
        type: 'hideTip',
        seriesIndex: 0,
        dataIndex: index,
      });
    }
  }
  
  private unhighlightFeatureInLineChart(featureProperties: any): void {
    // Unhighlight the corresponding bar diagram item
    // Get series index of series
    const seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    if (seriesIndex > -1) {
      this.lineChart.dispatchAction({
        type: 'downplay',
        seriesIndex: seriesIndex,
      });
    }
  }
  
  private getSeriesIndexByFeatureName(featureName: string): number {
    for (let index = 0; index < this.lineOption.series.length; index++) {
      if (this.lineOption.series[index].name === featureName) {
        return index;
      }
    }
    // Return -1 if none was found
    return -1;
  }
  // Inside your Angular component class
private removeSeriesFromLineChart(featureProperties: any): void {
    // Remove feature from legend
    const legendIndex = this.lineOption.legend.data.indexOf(featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    if (legendIndex > -1) {
      this.lineOption.legend.data.splice(legendIndex, 1);
    }
    // Remove feature data series
    const seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    if (seriesIndex > -1) {
      this.lineOption.series.splice(seriesIndex, 1);
    }
    // Second parameter tells echarts to not merge options with previous data, hence really remove series from graphic
    this.lineChart.setOption(this.lineOption, true);
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }
  
  private unhighlightFeatureInBarChart(featureProperties: any): void {
    // Unhighlight the corresponding bar diagram item
    // Get index of bar item
    const index = this.barOption.xAxis.data.findIndex(item => item === featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    if (index > -1) {
      this.barChart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        dataIndex: index,
      });
      // Tooltip
      this.barChart.dispatchAction({
        type: 'hideTip',
        seriesIndex: 0,
        dataIndex: index,
      });
    }
  }
  
  private unhighlightFeatureInLineChart(featureProperties: any): void {
    // Unhighlight the corresponding bar diagram item
    // Get series index of series
    const seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[this.environment.FEATURE_NAME_PROPERTY_NAME]);
    if (seriesIndex > -1) {
      this.lineChart.dispatchAction({
        type: 'downplay',
        seriesIndex: seriesIndex,
      });
    }
  }
  
  
    // Use @HostListener to listen for the event
    document: any.addEventListener('AppendExportButtonsForTable', (event: CustomEvent) => {
      const tableId = event.detail.tableId;
      const tableExportName = event.detail.tableExportName;

      setTimeout(() => {
        new TableExport(document.getElementById(tableId), {
          headers: true,
          footers: true,
          formats: ['xlsx', 'csv', 'txt'],
          filename: tableExportName,
          bootstrap: true,
          exportButtons: true,
          position: 'top',
          ignoreRows: null,
          ignoreCols: null,
          trimWhitespace: true, // (Boolean), remove all leading/trailing newlines, spaces, and tabs from cell text in the exported file(s) (default: false)
        });
      }, 50);
    });
  



















*/




  // Define your methods for updating charts, handling events, etc.
}
