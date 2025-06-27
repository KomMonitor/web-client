import { Component, OnInit } from '@angular/core';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import * as echarts from 'echarts';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  selector: 'app-kommonitor-diagrams',
  templateUrl: './kommonitor-diagrams.component.html',
  styleUrls: ['./kommonitor-diagrams.component.css']
})
export class KommonitorDiagramsComponent implements OnInit{

  exchangeData!: DataExchange;

  constructor(
    private dataExchangeService: DataExchangeService,
    private diagramHelperService: DiagramHelperServiceService,
    private broadcastService: BroadcastService
  ) {
    this.exchangeData = this.dataExchangeService.pipedData;
  }

  ngOnInit(): void {
    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'updateDiagrams': {
          setTimeout(() => {
            this.updateDiagrams(values);
          },1500);
        } break;
      }
    });
  }

 /*  $(window).on('resize', () {
    if (this.histogramChart != null && this.histogramChart != undefined) {
      this.histogramChart.resize();
    }

    if (this.barChart != null && this.barChart != undefined) {
      this.barChart.resize();
    }

    if (this.lineChart != null && this.lineChart != undefined) {
      this.lineChart.resize();
    }
  });

  $on("resizeDiagrams", (event) {

    setTimeout(() {
      if (this.histogramChart != null && this.histogramChart != undefined) {
        this.histogramChart.resize();
      }

      if (this.barChart != null && this.barChart != undefined) {
        this.barChart.resize();
      }

      if (this.lineChart != null && this.lineChart != undefined) {
        this.lineChart.resize();
      }
    }, 350);
  });
  */

  loadingData = false;

  INDICATOR_DATE_PREFIX = window.__env.indicatorDatePrefix;
  defaultColorForHoveredFeatures = window.__env.defaultColorForHoveredFeatures;
  defaultColorForClickedFeatures = window.__env.defaultColorForClickedFeatures;

  // $scope.userHoveresOverBarItem = false;
  eventsRegistered = false;
  isTooManyFeatures = false;
  histogramCanBeDisplayed = false;
  spatialUnitName;
  date;
  numberOfDecimals = window.__env.numberOfDecimals;
  defaultColorForZeroValues = window.__env.defaultColorForZeroValues;
  defaultColorForNoDataValues = window.__env.defaultColorForNoDataValues;
  defaultColorForFilteredValues = window.__env.defaultColorForFilteredValues;

  defaultColorForOutliers_high = window.__env.defaultColorForOutliers_high;
  defaultBorderColorForOutliers_high = window.__env.defaultBorderColorForOutliers_high;
  defaultFillOpacityForOutliers_high = window.__env.defaultFillOpacityForOutliers_high;
  defaultColorForOutliers_low = window.__env.defaultColorForOutliers_low;
  defaultBorderColorForOutliers_low = window.__env.defaultBorderColorForOutliers_low;
  defaultFillOpacityForOutliers_low = window.__env.defaultFillOpacityForOutliers_low;

  indicatorPropertyName!:any;
  histogramChart!:any;
  barChart!:any;
  lineChart!:any;
  histogramOption!:any;
  barOption!:any;
  lineOption!:any;

  compareFeaturesByIndicatorValue(featureA, featureB) {
    if (featureA.properties[this.indicatorPropertyName] < featureB.properties[this.indicatorPropertyName])
      return -1;
    if (featureA.properties[this.indicatorPropertyName] > featureB.properties[this.indicatorPropertyName])
      return 1;
    return 0;
  }

  showLoadingIcons() {

    if (this.histogramChart)
      this.histogramChart.showLoading();

    if (this.barChart)
      this.barChart.showLoading();

    if (this.lineChart)
      this.lineChart.showLoading();
  };

  onChangeShowBarChartLabel(){
    if (this.exchangeData.showBarChartLabel){
      this.updateBarChart(true, this.exchangeData.showBarChartAverageLine);
    }
    else{
      this.updateBarChart(false, this.exchangeData.showBarChartAverageLine);
    }						
  }

  onChangeShowBarChartAverageLine(){
    if (this.exchangeData.showBarChartAverageLine){
      this.updateBarChart(this.exchangeData.showBarChartLabel, true);
    }
    else{
      this.updateBarChart(this.exchangeData.showBarChartLabel, false);
    }		
  }

  updateDiagrams([indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling]) {

    // console.log("Updating diagrams!");

    this.loadingData = true;

    this.showLoadingIcons();

    this.spatialUnitName = spatialUnitName;
    this.date = date;

    this.diagramHelperService.prepareAllDiagramResources_forCurrentMapIndicator(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, false);

    // updateHistogramChart();

    this.updateLineChart();

    this.updateBarChart(this.exchangeData.showBarChartLabel, this.exchangeData.showBarChartAverageLine);
    this.loadingData = false;
  }

  //HISTOGRAM CHART FUNCTION
  updateHistogramChart() {

    this.histogramCanBeDisplayed = false;

    if (!this.histogramChart)
      this.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
    else {
      // explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
      this.histogramChart.dispose();
      this.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
    }

    this.histogramOption = this.diagramHelperService.getHistogramChartOptions();

    this.histogramChart.setOption(this.histogramOption);
    this.histogramChart.hideLoading();
    this.histogramCanBeDisplayed = true;
    setTimeout(() => {
      this.histogramChart.resize();
    }, 350);
  };

  // BAR CHART FUNCTION

  updateBarChart(showBarChartLabel, showBarChartAverageLine) {
    // based on prepared DOM, initialize echarts instance
    this.eventsRegistered = false;

    if (!this.barChart)
      this.barChart = echarts.init(document.getElementById('barDiagram'));
    else {
      // explicitly kill and reinstantiate bar diagram to avoid zombie states on spatial unit change
      this.barChart.dispose();
      this.barChart = echarts.init(document.getElementById('barDiagram'));
    }

    // use configuration item and data specified to show chart
    // this.barOption = JSON.parse(JSON.stringify(kommonitorDiagramHelperService.getBarChartOptions()));
    this.barOption = this.diagramHelperService.getBarChartOptions(true);
    if (showBarChartLabel){
      this.barOption.label.show = true;
    }
    else{
      this.barOption.label.show = false;
    }
    if (showBarChartAverageLine){
      // do nothing as we simply overtake the action
      if(this.barOption.series[0].markLine_backup){
        this.barOption.series[0].markLine = this.barOption.series[0].markLine_backup;
      }							
    }
    else{
      // replace markLineConfig by empty object
      this.barOption.series[0].markLine_backup = this.barOption.series[0].markLine;
      this.barOption.series[0].markLine = {};
    }
    this.barChart.setOption(this.barOption);

    this.barChart.hideLoading();

    setTimeout(() => {
      this.barChart.resize();
    }, 350);

    this.registerEventsIfNecessary();
  };

  registerEventsIfNecessary() {
    if (!this.eventsRegistered) {
      // when hovering over elements of the chart then highlight them in the map.
/*       this.barChart.on('mouseOver', (params) {
        // this.userHoveresOverBarItem = true;
        let seriesIndex = params.seriesIndex;
        let dataIndex = params.dataIndex;

        // console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
        //
        // let barElement = this.barOption.series[seriesIndex].data[dataIndex];
        //
        // console.log(barElement);

        let spatialFeatureName = this.barOption.xAxis.data[dataIndex];
        if(spatialFeatureName){
          // console.log(spatialFeatureName);
          this.broadcastService.broadcast("highlightFeatureOnMap", [spatialFeatureName]);
        }
        
      }); */

  /*     this.barChart.on('mouseOut', (params) {
        // this.userHoveresOverBarItem = false;
        let seriesIndex = params.seriesIndex;
        let dataIndex = params.dataIndex;

        // console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
        //
        // let barElement = this.barOption.series[seriesIndex].data[dataIndex];
        //
        // console.log(barElement);

        let spatialFeatureName = this.barOption.xAxis.data[dataIndex];
        // console.log(spatialFeatureName);
        if(spatialFeatureName){
          this.broadcastService.broadcast("unhighlightFeatureOnMap", [spatialFeatureName]);
        }
        
      }); */

   /*    this.barChart.on('click', (params) {
        let seriesIndex = params.seriesIndex;
        let dataIndex = params.dataIndex;

        // console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
        //
        // let barElement = this.barOption.series[seriesIndex].data[dataIndex];
        //
        // console.log(barElement);

        let spatialFeatureName = this.barOption.xAxis.data[dataIndex];
        // console.log(spatialFeatureName);
        if(spatialFeatureName){
          this.broadcastService.broadcast("switchHighlightFeatureOnMap", [spatialFeatureName]);
        }
        
      }); */

      this.eventsRegistered = true;
    }
  };

  // LINE CHART TIME SERIES FUNCTION
  //updateLineChart(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray) {
  updateLineChart() {
    // based on prepared DOM, initialize echarts instance
    if (!this.lineChart)
      this.lineChart = echarts.init(document.getElementById('lineDiagram'));
    else {
      // explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
      this.lineChart.dispose();
      this.lineChart = echarts.init(document.getElementById('lineDiagram'));
    }

    // use configuration item and data specified to show chart
    this.lineOption = this.diagramHelperService.getLineChartOptions(true);
    this.lineChart.setOption(this.lineOption);

    this.lineChart.hideLoading();
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  };
/* 
  $on("updateDiagramsForHoveredFeature", (event, featureProperties) {

    if (!this.lineOption.legend.data.includes(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME])) {
      this.appendSeriesToLineChart(featureProperties);
    }

    this.highlightFeatureInBarChart(featureProperties);
    this.highlightFeatureInLineChart(featureProperties);
  }); */

  appendSeriesToLineChart(featureProperties) {

    // in case of activated balance mode, we must use the properties of this.exchangeData.selectedIndicator, to aquire the correct time series item!
    if (this.exchangeData.isBalanceChecked) {
      featureProperties = this.findPropertiesForTimeSeries(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);
    }

    // append feature name to legend
    this.lineOption.legend.data.push(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);

    // create feature data series
    let featureSeries:any = {};
    featureSeries.name = featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME];
    featureSeries.type = 'line';
    featureSeries.data = new Array();

    // for each date create series data entry for feature
    for (let date of this.lineOption.xAxis.data) {
      let value;
      if (this.dataExchangeService.indicatorValueIsNoData(featureProperties[this.INDICATOR_DATE_PREFIX + date])) {
        value = null;
      }
      else {
        value = this.dataExchangeService.getIndicatorValue_asNumber(featureProperties[this.INDICATOR_DATE_PREFIX + date]);
      }
      featureSeries.data.push(value);
    }

    this.lineOption.series.push(featureSeries);

    this.lineChart.setOption(this.lineOption);
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  };

  findPropertiesForTimeSeries(spatialUnitFeatureName) {
    for (let feature of this.exchangeData.selectedIndicator.geoJSON.features) {
      if (feature.properties[window.__env.FEATURE_NAME_PROPERTY_NAME] == spatialUnitFeatureName) {
        return feature.properties;
      }
    }
  }

  highlightFeatureInBarChart(featureProperties) {
    // highlight the corresponding bar diagram item
    // get index of bar item

    // if(this.userHoveresOverBarItem){
    // 	return;
    // }

    let index = -1;
    for (let i = 0; i < this.barOption.xAxis.data.length; i++) {
      if (this.barOption.xAxis.data[i] === featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]) {
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
      // tooltip
      this.barChart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: index
      });
    }
  };

  highlightFeatureInLineChart(featureProperties) {
    // highlight the corresponding bar diagram item
    // get series index of series
    let seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);

    if (seriesIndex > -1) {
      this.lineChart.dispatchAction({
        type: 'highlight',
        seriesIndex: seriesIndex
      });
    }
  };

/*   $on("updateDiagramsForUnhoveredFeature", (event, featureProperties) {

    if (!kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[window.__env.FEATURE_ID_PROPERTY_NAME])) {
      this.unhighlightFeatureInLineChart(featureProperties);

      this.removeSeriesFromLineChart(featureProperties);

      this.unhighlightFeatureInBarChart(featureProperties);
    }
  }); */

  getSeriesIndexByFeatureName(featureName) {
    for (let index = 0; index < this.lineOption.series.length; index++) {
      if (this.lineOption.series[index].name === featureName)
        return index;
    }

    //return -1 if none was found
    return -1;
  };

  removeSeriesFromLineChart(featureProperties) {
    // remove feature from legend
    let legendIndex = this.lineOption.legend.data.indexOf(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);
    if (legendIndex > -1) {
      this.lineOption.legend.data.splice(legendIndex, 1);
    }

    // remove feature data series
    let seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);
    if (seriesIndex > -1) {
      this.lineOption.series.splice(seriesIndex, 1);
    }

    // second parameter tells echarts to not merge options with previous data. hence really remove series from graphic
    this.lineChart.setOption(this.lineOption, true);
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  };

  unhighlightFeatureInBarChart(featureProperties) {
    // highlight the corresponding bar diagram item
    // get index of bar item
    let index = -1;
    for (let i = 0; i < this.barOption.xAxis.data.length; i++) {
      if (this.barOption.xAxis.data[i] === featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]) {
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
      // tooltip
      this.barChart.dispatchAction({
        type: 'hideTip',
        seriesIndex: 0,
        dataIndex: index
      });
    }
  };

  unhighlightFeatureInLineChart(featureProperties) {
    // highlight the corresponding bar diagram item
    // get series index of series
    let seriesIndex = this.getSeriesIndexByFeatureName(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);

    if (seriesIndex > -1) {
      this.lineChart.dispatchAction({
        type: 'downplay',
        seriesIndex: seriesIndex
      });
    }
  };

 /*  this.$on("AppendExportButtonsForTable", (event, tableId, tableExportName) {

    setTimeout(() {


      // new TableExport(document.getElementsByTagName("table"), {
      new TableExport(document.getElementById(tableId), {
        headers: true,                              // (Boolean), display table headers (th or td elements) in the <thead>, (default: true)
        footers: true,                              // (Boolean), display table footers (th or td elements) in the <tfoot>, (default: false)
        formats: ['xlsx', 'csv', 'txt'],            // (String[]), filetype(s) for the export, (default: ['xlsx', 'csv', 'txt'])
        filename: tableExportName,                             // (id, String), filename for the downloaded file, (default: 'id')
        bootstrap: true,                           // (Boolean), style buttons using bootstrap, (default: true)
        exportButtons: true,                        // (Boolean), automatically generate the built-in export buttons for each of the specified formats (default: true)
        position: 'top',                         // (top, bottom), position of the caption element relative to table, (default: 'bottom')
        ignoreRows: null,                           // (Number, Number[]), row indices to exclude from the exported file(s) (default: null)
        ignoreCols: null,                           // (Number, Number[]), column indices to exclude from the exported file(s) (default: null)
        trimWhitespace: true                        // (Boolean), remove all leading/trailing newlines, spaces, and tabs from cell text in the exported file(s) (default: false)
      });
    }, 50);


  } */
}
