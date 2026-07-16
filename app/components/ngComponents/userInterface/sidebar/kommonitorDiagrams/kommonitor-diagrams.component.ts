import { Component, OnInit, inject } from '@angular/core';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { LabelService } from 'services/label-service/label.service';
import * as echarts from 'echarts';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { MapService } from 'services/map-service/map.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { fromEvent, Observable, Subscription } from 'rxjs';

import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';

@Component({
  selector: 'app-kommonitor-diagrams',
  templateUrl: './kommonitor-diagrams.component.html',
  styleUrls: ['./kommonitor-diagrams.component.scss'],
  standalone: true,
  imports: [FormsModule, ExpandableBoxComponent],
})
export class KommonitorDiagramsComponent implements OnInit {
  protected chartDisplayState = inject(ChartDisplayStateService);
  private indicatorValueService = inject(IndicatorValueService);
  protected selectionState = inject(SelectionStateService);
  protected labelService = inject(LabelService);
  private diagramHelperService = inject(DiagramHelperServiceService);
  private broadcastService = inject(BroadcastService);
  private mapService = inject(MapService);
  private filterHelperService = inject(FilterHelperService);
  protected envConfigService = inject(EnvConfigService);

  resizeObservable$!: Observable<Event>;
  resizeSubscription$!: Subscription;

  isBarchartCollapsed = false;
  isLinechartCollapsed = false;

  title!: string;
  lineTitle!: string;

  showBarChartLabel: boolean = false;
  showBarChartAverageLine: boolean = false;

  constructor() {
    const envConfigService = this.envConfigService;

    this.showBarChartLabel = envConfigService.showBarChartLabel;
    this.showBarChartAverageLine = envConfigService.showBarChartAverageLine;
  }

  // Local precision-resolving wrapper (formerly the DataExchangeService facade glue, Prio7 B1).
  private getIndicatorValue_asNumber(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asNumber(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  ngOnInit(): void {
    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
      const values: any = broadcastMsg.values;

      switch (title) {
        case BroadcastMessage.UpdateDiagrams:
          {
            this.updateDiagrams(values);
          }
          break;
        case BroadcastMessage.UpdateDiagramsForHoveredFeature:
          {
            this.updateDiagramsForHoveredFeature(values);
          }
          break;
        case BroadcastMessage.UpdateDiagramsForUnhoveredFeature:
          {
            this.updateDiagramsForUnhoveredFeature(values);
          }
          break;
        case 'resizeDiagrams':
          {
            this.resizeDiagrams();
          }
          break;
        case BroadcastMessage.AppendExportButtonsForTable:
          {
            this.AppendExportButtonsForTable(values);
          }
          break;
      }
    });

    this.resizeObservable$ = fromEvent(window, 'resize');
    this.resizeSubscription$ = this.resizeObservable$.subscribe((evt) => {
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
  }

  loadingData = false;

  private INDICATOR_DATE_PREFIX = this.envConfigService.indicatorDatePrefix;

  // $scope.userHoveresOverBarItem = false;
  eventsRegistered = false;
  isTooManyFeatures = false;
  histogramCanBeDisplayed = false;
  spatialUnitName;
  date;

  indicatorPropertyName!: any;
  histogramChart!: any;
  barChart!: any;
  lineChart!: any;
  histogramOption!: any;
  barOption!: any;
  lineOption!: any;

  resizeDiagrams() {
    setTimeout(() => {
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
  }

  compareFeaturesByIndicatorValue(featureA, featureB) {
    if (
      featureA.properties[this.indicatorPropertyName] <
      featureB.properties[this.indicatorPropertyName]
    )
      return -1;
    if (
      featureA.properties[this.indicatorPropertyName] >
      featureB.properties[this.indicatorPropertyName]
    )
      return 1;
    return 0;
  }

  showLoadingIcons() {
    if (this.histogramChart) this.histogramChart.showLoading();

    if (this.barChart) this.barChart.showLoading();

    if (this.lineChart) this.lineChart.showLoading();
  }

  updateDiagrams([
    indicatorMetadataAndGeoJSON,
    spatialUnitName,
    spatialUnitId,
    date,
    defaultBrew,
    gtMeasureOfValueBrew,
    ltMeasureOfValueBrew,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    isMeasureOfValueChecked,
    measureOfValue,
    justRestyling,
  ]) {
    console.log('Updating diagrams!');

    this.title = `Raumeinheits-Vergleich - ${spatialUnitName} - ${date}`;
    this.lineTitle = `Zeitreihe - ${spatialUnitName}`;

    this.loadingData = true;

    this.showLoadingIcons();

    this.spatialUnitName = spatialUnitName;
    this.date = date;

    this.diagramHelperService.prepareAllDiagramResources_forCurrentMapIndicator(
      indicatorMetadataAndGeoJSON,
      spatialUnitName,
      date,
      defaultBrew,
      gtMeasureOfValueBrew,
      ltMeasureOfValueBrew,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      isMeasureOfValueChecked,
      measureOfValue,
      false
    );

    // updateHistogramChart();

    setTimeout(() => {
      this.updateLineChart();

      this.updateBarChart();
      this.loadingData = false;
    }, 500);
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
  }

  // BAR CHART FUNCTION

  updateBarChart() {
    // based on prepared DOM, initialize echarts instance
    this.eventsRegistered = false;

    if (!this.barChart) this.barChart = echarts.init(document.getElementById('barDiagram'));
    else {
      // explicitly kill and reinstantiate bar diagram to avoid zombie states on spatial unit change
      this.barChart.dispose();
      this.barChart = echarts.init(document.getElementById('barDiagram'));
    }

    // use configuration item and data specified to show chart
    // this.barOption = JSON.parse(JSON.stringify(kommonitorDiagramHelperService.getBarChartOptions()));
    this.barOption = this.diagramHelperService.getBarChartOptions(true);
    if (this.showBarChartLabel) {
      this.barOption.label.show = true;
    } else {
      this.barOption.label.show = false;
    }
    if (this.showBarChartAverageLine) {
      // do nothing as we simply overtake the action
      if (this.barOption.series[0].markLine_backup) {
        this.barOption.series[0].markLine = this.barOption.series[0].markLine_backup;
      }
    } else {
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
  }

  registerEventsIfNecessary() {
    if (!this.eventsRegistered) {
      // when hovering over elements of the chart then highlight them in the map.
      this.barChart.on('mouseOver', (params) => {
        // this.userHoveresOverBarItem = true;
        const seriesIndex = params.seriesIndex;
        const dataIndex = params.dataIndex;

        // console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
        //
        // let barElement = this.barOption.series[seriesIndex].data[dataIndex];
        //
        // console.log(barElement);

        const spatialFeatureName = this.barOption.xAxis.data[dataIndex];
        if (spatialFeatureName) {
          // console.log(spatialFeatureName);
          this.mapService.highlightFeature(spatialFeatureName);
        }
      });

      this.barChart.on('mouseOut', (params) => {
        // this.userHoveresOverBarItem = false;
        const seriesIndex = params.seriesIndex;
        const dataIndex = params.dataIndex;

        // console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
        //
        // let barElement = this.barOption.series[seriesIndex].data[dataIndex];
        //
        // console.log(barElement);

        const spatialFeatureName = this.barOption.xAxis.data[dataIndex];
        // console.log(spatialFeatureName);
        if (spatialFeatureName) {
          this.mapService.unhighlightFeature(spatialFeatureName);
        }
      });

      this.barChart.on('click', (params) => {
        const seriesIndex = params.seriesIndex;
        const dataIndex = params.dataIndex;

        // console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
        //
        // let barElement = this.barOption.series[seriesIndex].data[dataIndex];
        //
        // console.log(barElement);

        const spatialFeatureName = this.barOption.xAxis.data[dataIndex];
        // console.log(spatialFeatureName);
        if (spatialFeatureName) {
          this.mapService.switchHighlightFeature(spatialFeatureName);
        }
      });

      this.eventsRegistered = true;
    }
  }

  // LINE CHART TIME SERIES FUNCTION
  //updateLineChart(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray) {
  updateLineChart() {
    // based on prepared DOM, initialize echarts instance
    if (!this.lineChart) this.lineChart = echarts.init(document.getElementById('lineDiagram'));
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
  }

  updateDiagramsForHoveredFeature([featureProperties]) {
    if (!this.lineOption) return;

    if (
      !this.lineOption.legend.data.includes(
        featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
      )
    ) {
      this.appendSeriesToLineChart(featureProperties);
    }

    this.highlightFeatureInBarChart(featureProperties);
    this.highlightFeatureInLineChart(featureProperties);
  }

  appendSeriesToLineChart(featureProperties) {
    // in case of activated balance mode, we must use the properties of this.selectionState.selectedIndicator, to aquire the correct time series item!
    if (this.chartDisplayState.isBalanceChecked) {
      featureProperties = this.findPropertiesForTimeSeries(
        featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
      );
    }

    // append feature name to legend
    this.lineOption.legend.data.push(
      featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
    );

    // create feature data series
    const featureSeries: any = {};
    featureSeries.name = featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME];
    featureSeries.type = 'line';
    featureSeries.data = [];

    // for each date create series data entry for feature
    for (const date of this.lineOption.xAxis.data) {
      let value;
      if (
        this.indicatorValueService.indicatorValueIsNoData(
          featureProperties[this.INDICATOR_DATE_PREFIX + date]
        )
      ) {
        value = null;
      } else {
        value = this.getIndicatorValue_asNumber(
          featureProperties[this.INDICATOR_DATE_PREFIX + date]
        );
      }
      featureSeries.data.push(value);
    }

    this.lineOption.series.push(featureSeries);

    this.lineChart.setOption(this.lineOption);
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }

  findPropertiesForTimeSeries(spatialUnitFeatureName) {
    for (const feature of this.selectionState.selectedIndicator.geoJSON.features) {
      if (
        feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] ==
        spatialUnitFeatureName
      ) {
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
      if (
        this.barOption.xAxis.data[i] ===
        featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
      ) {
        index = i;
        break;
      }
    }

    if (index > -1) {
      this.barChart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: index,
      });
      // tooltip
      this.barChart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: index,
      });
    }
  }

  highlightFeatureInLineChart(featureProperties) {
    // highlight the corresponding bar diagram item
    // get series index of series
    const seriesIndex = this.getSeriesIndexByFeatureName(
      featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
    );

    if (seriesIndex > -1) {
      this.lineChart.dispatchAction({
        type: 'highlight',
        seriesIndex: seriesIndex,
      });
    }
  }

  updateDiagramsForUnhoveredFeature([featureProperties]) {
    if (!this.lineChart) return;

    if (
      !this.filterHelperService.featureIsCurrentlySelected(
        featureProperties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
      )
    ) {
      this.unhighlightFeatureInLineChart(featureProperties);

      this.removeSeriesFromLineChart(featureProperties);

      this.unhighlightFeatureInBarChart(featureProperties);
    }
  }

  getSeriesIndexByFeatureName(featureName) {
    for (let index = 0; index < this.lineOption.series.length; index++) {
      if (this.lineOption.series[index].name === featureName) return index;
    }

    //return -1 if none was found
    return -1;
  }

  removeSeriesFromLineChart(featureProperties) {
    // remove feature from legend
    const legendIndex = this.lineOption.legend.data.indexOf(
      featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
    );
    if (legendIndex > -1) {
      this.lineOption.legend.data.splice(legendIndex, 1);
    }

    // remove feature data series
    const seriesIndex = this.getSeriesIndexByFeatureName(
      featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
    );
    if (seriesIndex > -1) {
      this.lineOption.series.splice(seriesIndex, 1);
    }

    // second parameter tells echarts to not merge options with previous data. hence really remove series from graphic
    this.lineChart.setOption(this.lineOption, true);
    setTimeout(() => {
      this.lineChart.resize();
    }, 350);
  }

  unhighlightFeatureInBarChart(featureProperties) {
    // highlight the corresponding bar diagram item
    // get index of bar item
    let index = -1;
    for (let i = 0; i < this.barOption.xAxis.data.length; i++) {
      if (
        this.barOption.xAxis.data[i] ===
        featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
      ) {
        index = i;
        break;
      }
    }

    if (index > -1) {
      this.barChart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        dataIndex: index,
      });
      // tooltip
      this.barChart.dispatchAction({
        type: 'hideTip',
        seriesIndex: 0,
        dataIndex: index,
      });
    }
  }

  unhighlightFeatureInLineChart(featureProperties) {
    // highlight the corresponding bar diagram item
    // get series index of series
    const seriesIndex = this.getSeriesIndexByFeatureName(
      featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
    );

    if (seriesIndex > -1) {
      this.lineChart.dispatchAction({
        type: 'downplay',
        seriesIndex: seriesIndex,
      });
    }
  }

  AppendExportButtonsForTable([tableId, tableExportName]) {
    setTimeout(() => {
      // todo throws error, currently unable to identify reason. maybe replace package
      /*  let temp:any = document.getElementsByTagName(tableId);
      // new TableExport(document.getElementsByTagName("table"), {
      new TableExport(temp, {
        headers: true,                              // (Boolean), display table headers (th or td elements) in the <thead>, (default: true)
        footers: true,                              // (Boolean), display table footers (th or td elements) in the <tfoot>, (default: false)
        formats: ['xlsx', 'csv', 'txt'],            // (String[]), filetype(s) for the export, (default: ['xlsx', 'csv', 'txt'])
        filename: tableExportName,                             // (id, String), filename for the downloaded file, (default: 'id')
        bootstrap: true,                           // (Boolean), style buttons using bootstrap, (default: true)
        exportButtons: true,                        // (Boolean), automatically generate the built-in export buttons for each of the specified formats (default: true)
        position: 'top',                         // (top, bottom), position of the caption element relative to table, (default: 'bottom')
        ignoreRows: undefined,                      // (Number, Number[]), row indices to exclude from the exported file(s) (default: null)
        ignoreCols: undefined,                      // (Number, Number[]), column indices to exclude from the exported file(s) (default: null)
        trimWhitespace: true                        // (Boolean), remove all leading/trailing newlines, spaces, and tabs from cell text in the exported file(s) (default: false)
      }); */
    }, 50);
  }
}
