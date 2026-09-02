import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import * as echarts from 'echarts';
import * as ecStat from 'echarts-stat';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { MetadataFilterService } from 'services/metadata-filter-service/metadata-filter.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DiagramsUpdate, MapService } from 'services/map-service/map.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { IndicatorNameFilter } from 'pipes/indicator-title-filter.pipe';
import { SelectedIndicatorFilter } from 'pipes/selected-indicator-filter.pipe';
import { BaseIndicatorOfComputedIndicatorFilter } from 'pipes/base-indicator-of-computed-indicator-filter.pipe';
import { BaseIndicatorOfHeadlineIndicatorFilter } from 'pipes/base-indicator-of-headline-indicator-filter.pipe';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Component({
  selector: 'app-regression-diagram',
  templateUrl: './regression-diagram.component.html',
  styleUrls: ['./regression-diagram.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExpandableBoxComponent,
    IndicatorNameFilter,
    SelectedIndicatorFilter,
    BaseIndicatorOfComputedIndicatorFilter,
    BaseIndicatorOfHeadlineIndicatorFilter,
  ],
})
export class RegressionDiagramComponent implements OnInit, AfterViewInit, OnDestroy {
  protected diagramHelperService = inject(DiagramHelperServiceService);
  private exportButtonVisibility = inject(ExportButtonVisibilityService);
  private metadataFilterService = inject(MetadataFilterService);
  private indicatorValueService = inject(IndicatorValueService);
  protected selectionState = inject(SelectionStateService);
  private broadcastService = inject(BroadcastService);
  private mapService = inject(MapService);
  private filterHelperService = inject(FilterHelperService);
  private envConfigService = inject(EnvConfigService);

  activeTab = 0;

  isIndicatorSelectCollapsed = false;
  isRadarCollapsed = false;

  selection: any = {
    indicatorNameFilterForXAxis: undefined,
    indicatorNameFilterForYAxis: undefined,
    selectedIndicatorForXAxis: undefined,
    selectedIndicatorForXAxis_backup: undefined,
    selectedIndicatorForYAxis: undefined,
    selectedIndicatorForYAxis_backup: undefined,
  };

  private DATE_PREFIX = this.envConfigService.indicatorDatePrefix;
  private defaultColorForClickedFeatures = this.envConfigService.defaultColorForClickedFeatures;

  temp;

  indicatorPropertyName;
  indicatorMetadataAndGeoJSON;
  defaultBrew;
  gtMeasureOfValueBrew;
  ltMeasureOfValueBrew;
  dynamicIncreaseBrew;
  dynamicDecreaseBrew;
  isMeasureOfValueChecked;
  measureOfValue;

  setupCompleted = true;

  //allIndicatorProperties;
  correlation;
  linearRegression;
  regressionOption;
  regressionChart;
  data;
  dataWithLabels;
  eventsRegistered = false;
  // userHoveresOverItem = false;

  sortedIndicatorProps;
  spatialUnitName;
  date;

  enableScatterPlotRegression: any;

  chartTitle!: string;

  // Resolve the indicator precision from the current selection before
  // delegating to IndicatorValueService.
  private getIndicatorValue_asNumber(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asNumber(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  private getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFormattedText(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  private subscriptions = new Subscription();

  ngOnInit(): void {
    $(document).ready(function () {
      $('.nav li.disabled a').click(function () {
        return false;
      });
    });

    // catch broadcast msgs
    this.subscriptions.add(
      this.mapService.mapCommand$.subscribe((command) => {
        if (command.type === 'beginIndicatorTimeSetup')
          this.allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin();
      })
    );

    this.subscriptions.add(
      this.mapService.mapEvent$.subscribe((event) => {
        switch (event.type) {
          case 'diagramsUpdate':
            this.updateDiagrams(event.update);
            break;
          case 'featureHovered':
            this.updateDiagramsForHoveredFeature(event.properties);
            break;
          case 'featureUnhovered':
            this.updateDiagramsForUnhoveredFeature(event.properties);
            break;
        }
      })
    );

    this.subscriptions.add(
      this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
        const title = broadcastMsg.msg;
        const values: any = broadcastMsg.values;

        switch (title) {
          case 'resizeDiagrams':
            {
              this.resizeDiagrams();
            }
            break;
          case BroadcastMessage.AllIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted:
            {
              this.allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_completed();
            }
            break;
        }
      })
    );

    this.chartTitle = this.enableScatterPlotRegression
      ? `Lineare Regression - ${this.spatialUnitName}`
      : `Streudiagramm - ${this.spatialUnitName}`;
  }

  ngAfterViewInit(): void {
    // The component is created lazily (only when the regression panel opens), so it
    // misses the diagramsUpdate event the map emitted earlier. Replay the latest one
    // to load the current map context (geoJSON, brews, spatial unit, date). Use
    // justRestyling=true so setupCompleted stays true and no stale chart is built —
    // the actual chart is only rendered once the user picks the X/Y indicators.
    const latestUpdate = this.mapService.latestDiagramsUpdate;
    if (latestUpdate) {
      this.updateDiagrams({ ...latestUpdate, justRestyling: true });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.regressionChart?.dispose();
  }

  /*  
// initialize any adminLTE box widgets
  $('.box').boxWidget();


  $(window).on('resize', function(){
      if(this.regressionChart != null && this.regressionChart != undefined){
          this.regressionChart.resize();
      }
  });
*/

  filterAvailableIndicatorsXAxis(event: any) {
    const value = event.target.value;
    this.selection.indicatorNameFilterForXAxis = value;
  }

  filterAvailableIndicatorsYAxis(event: any) {
    const value = event.target.value;
    this.selection.indicatorNameFilterForYAxis = value;
  }

  resizeDiagrams() {
    setTimeout(() => {
      if (this.regressionChart != null && this.regressionChart != undefined) {
        this.regressionChart.resize();
      }
    }, 350);
  }

  filterIndicators() {
    return this.metadataFilterService.filterIndicators();
  }

  filterIndicatorsBySpatialUnitAndDate() {
    return (item) => {
      //
      // await wait(2000);

      if (
        item.applicableSpatialUnits.some(
          (o) => o.spatialUnitName == this.selectionState.selectedSpatialUnit.spatialUnitLevel
        )
      ) {
        return item.applicableDates.includes(this.selectionState.selectedDate);
      } else {
        return false;
      }
    };
  }

  wait = (ms) => new Promise((r, j) => setTimeout(r, ms));

  allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin() {
    this.wait(130);
    this.setupCompleted = false;

    /* 
    setTimeout(() => {
      this.$digest();
    }, 500); */
  }

  allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_completed() {
    this.wait(100);

    setTimeout(() => {
      this.setupCompleted = true;
      //this.$digest();
      this.onChangeSelectedIndicators();
    }, 500);
  }

  onChangeSelectedDate() {
    this.onChangeSelectedIndicators();
  }

  onChangeFilterSameUnitAndSameTime() {
    if (this.regressionChart) {
      this.regressionChart.dispose();
      this.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
    }
    this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];

    this.diagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(
      this.diagramHelperService.filterSameUnitAndSameTime
    );
  }

  updateDiagrams(update: DiagramsUpdate) {
    const {
      indicatorMetadataAndGeoJSON,
      spatialUnitLevel: spatialUnitName,
      spatialUnitId,
      date,
      brew: defaultBrew,
      gtMeasureOfValueBrew,
      ltMeasureOfValueBrew,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      isMeasureOfValueChecked,
      measureOfValue,
      justRestyling,
    } = update;
    this.correlation = undefined;
    this.linearRegression = undefined;
    this.regressionOption = undefined;
    this.sortedIndicatorProps = undefined;
    this.data = undefined;
    this.dataWithLabels = undefined;
    this.eventsRegistered = false;
    this.indicatorPropertyName = this.DATE_PREFIX + this.selectionState.selectedDate;
    this.spatialUnitName = spatialUnitName;
    this.date = date;
    this.indicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;
    this.defaultBrew = defaultBrew;
    this.gtMeasureOfValueBrew = gtMeasureOfValueBrew;
    this.ltMeasureOfValueBrew = ltMeasureOfValueBrew;
    this.dynamicIncreaseBrew = dynamicIncreaseBrew;
    this.dynamicDecreaseBrew = dynamicDecreaseBrew;
    this.isMeasureOfValueChecked = isMeasureOfValueChecked;
    this.measureOfValue = measureOfValue;

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

      /*      $timeout(function () {
           $("option").each(function (index, element) {
              var text = $(element).text();
              $(element).attr("title", text);
           });
      }); */
    }

    this.activeTab = 0;
    if (this.selectionState.selectedIndicator.creationType == 'COMPUTATION') {
      this.activeTab = 1;
    }
    if (this.selectionState.selectedIndicator.isHeadlineIndicator) {
      this.activeTab = 2;
    }

    setTimeout(() => {
      this.onChangeSelectedIndicators();
    }, 500);
  }

  updateDiagramsForHoveredFeature(featureProperties) {
    if (!this.regressionChart) {
      return;
    }

    // if(this.userHoveresOverItem){
    // 	return;
    // }

    let index = -1;
    for (let i = 0; i < this.regressionOption.series[0].data.length; i++) {
      if (
        this.regressionOption.series[0].data[i].name ==
        featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
      ) {
        index = i;
        break;
      }
    }

    if (index > -1) {
      this.regressionChart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: index,
      });
      // tooltip
      this.regressionChart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: index,
      });
    }
  }

  updateDiagramsForUnhoveredFeature(featureProperties) {
    if (!this.regressionChart) {
      return;
    }

    if (
      !this.filterHelperService.featureIsCurrentlySelected(
        featureProperties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
      )
    ) {
      // highlight the corresponding bar diagram item
      let index = -1;
      for (let i = 0; i < this.regressionOption.series[0].data.length; i++) {
        if (
          this.regressionOption.series[0].data[i].name ==
          featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
        ) {
          index = i;
          break;
        }
      }

      if (index > -1) {
        this.regressionChart.dispatchAction({
          type: 'downplay',
          seriesIndex: 0,
          dataIndex: index,
        });
        // tooltip
        this.regressionChart.dispatchAction({
          type: 'hideTip',
          seriesIndex: 0,
          dataIndex: index,
        });
      }
    }
  }

  getAllIndicatorPropertiesSortedBySpatialUnitFeatureName() {
    for (const indicatorProperty of this.diagramHelperService
      .indicatorPropertiesForCurrentSpatialUnitAndTime) {
      // make object to hold indicatorName, max value and average value
      indicatorProperty.indicatorProperties.sort((a, b) => {
        // a and b are arrays of indicatorProperties for all features of the selected spatialUnit. We sort them by their property "spatialUnitFeatureName"
        const nameA = a[this.envConfigService.FEATURE_NAME_PROPERTY_NAME].toUpperCase(); // ignore upper and lowercase
        const nameB = b[this.envConfigService.FEATURE_NAME_PROPERTY_NAME].toUpperCase(); // ignore upper and lowercase
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

    return this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime;
  }

  getPropertiesForIndicatorName(indicatorName) {
    for (const [
      index,
      indicator,
    ] of this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.entries()) {
      if (indicator.indicatorMetadata.indicatorName == indicatorName) {
        return indicator.indicatorProperties;
      }
    }
  }

  getColor(featureName) {
    let color;

    for (const feature of this.indicatorMetadataAndGeoJSON.geoJSON.features) {
      if (feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] == featureName) {
        color = this.diagramHelperService.getColorForFeature(
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

  mapRegressionData(indicatorPropertiesArray, timestamp, map, axisValueName, axisPrecision) {
    for (const indicatorPropertiesEntry of indicatorPropertiesArray) {
      const featureName =
        indicatorPropertiesEntry[this.envConfigService.FEATURE_NAME_PROPERTY_NAME];
      let indicatorValue;

      if (
        this.indicatorValueService.indicatorValueIsNoData(
          indicatorPropertiesEntry[this.DATE_PREFIX + timestamp]
        )
      ) {
        indicatorValue = null;
      } else {
        indicatorValue = this.getIndicatorValue_asNumber(
          indicatorPropertiesEntry[this.DATE_PREFIX + timestamp],
          axisPrecision
        );
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
            color: color,
          },
        };

        regressionObject[axisValueName] = indicatorValue;
        map.set(featureName, regressionObject);
      }
    }

    return map;
  }

  buildDataArrayForSelectedIndicators() {
    this.data = [];
    this.dataWithLabels = [];

    for (const [
      index,
      indicator,
    ] of this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.entries()) {
      if (
        indicator.indicatorMetadata.indicatorName ==
        this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName
      ) {
        this.diagramHelperService.fetchIndicatorPropertiesIfNotExists(index);
      }

      if (
        indicator.indicatorMetadata.indicatorName ==
        this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName
      ) {
        this.diagramHelperService.fetchIndicatorPropertiesIfNotExists(index);
      }
    }

    // both await
    setTimeout(() => {
      let indicatorPropertiesArrayForXAxis = this.getPropertiesForIndicatorName(
        this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName
      );
      let indicatorPropertiesArrayForYAxis = this.getPropertiesForIndicatorName(
        this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName
      );

      // hier indicatorPropertiesArrayForXAxis and ...YAxis undefined, look getPropertiesForIndicatorName

      if (
        this.filterHelperService.completelyRemoveFilteredFeaturesFromDisplay &&
        this.filterHelperService.filteredIndicatorFeatureIds.size > 0
      ) {
        indicatorPropertiesArrayForXAxis = indicatorPropertiesArrayForXAxis.filter(
          (featureProperties) =>
            !this.filterHelperService.featureIsCurrentlyFiltered(
              featureProperties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
            )
        );
        indicatorPropertiesArrayForYAxis = indicatorPropertiesArrayForYAxis.filter(
          (featureProperties) =>
            !this.filterHelperService.featureIsCurrentlyFiltered(
              featureProperties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
            )
        );
      }

      const timestamp_xAxis = this.selection.selectedIndicatorForXAxis.selectedDate;
      const timestamp_yAxis = this.selection.selectedIndicatorForYAxis.selectedDate;

      // store data in a map to check above prerequesits
      // key = ID,
      // value = regressionObject = {
      // 	name: featureName,
      // 	itemStyle: {
      // 		color: color
      // 	},
      //  xAxisName: indicatorValue_x,
      //  yAxisName: indicatorValue_y
      //}
      const xAxisName = 'xValue';
      const yAxisName = 'yValue';
      const xAxisPrecision = this.selection.selectedIndicatorForXAxis.indicatorMetadata.precision;
      const yAxisPrecision = this.selection.selectedIndicatorForYAxis.indicatorMetadata.precision;

      let dataCandidateMap = this.mapRegressionData(
        indicatorPropertiesArrayForXAxis,
        timestamp_xAxis,
        new Map(),
        xAxisName,
        xAxisPrecision
      );
      dataCandidateMap = this.mapRegressionData(
        indicatorPropertiesArrayForYAxis,
        timestamp_yAxis,
        dataCandidateMap,
        yAxisName,
        yAxisPrecision
      );

      // now iterate over map and identify those objects that have both indicator axis values set
      // put those into resulting lists

      dataCandidateMap.forEach((regressionObject, key, map) => {
        // this.data.push([xAxisDataElement, yAxisDataElement])
        if (regressionObject[xAxisName] && regressionObject[yAxisName]) {
          this.data.push([regressionObject[xAxisName], regressionObject[yAxisName]]);

          regressionObject.value = [regressionObject[xAxisName], regressionObject[yAxisName]];

          this.dataWithLabels.push(regressionObject);
        }
      });
    }, 1000);
  }

  //Source: http://stevegardner.net/2012/06/11/javascript-code-to-calculate-the-pearson-correlation-coefficient/

  getPearsonCorrelation(x, y) {
    let shortestArrayLength = 0;

    if (x.length == y.length) {
      shortestArrayLength = x.length;
    } else if (x.length > y.length) {
      shortestArrayLength = y.length;
      console.error(
        'x has more items in it, the last ' +
          (x.length - shortestArrayLength) +
          ' item(s) will be ignored'
      );
    } else {
      shortestArrayLength = x.length;
      console.error(
        'y has more items in it, the last ' +
          (y.length - shortestArrayLength) +
          ' item(s) will be ignored'
      );
    }

    const x_numeric: any[] = [];
    const y_numeric: any[] = [];
    const xy: any[] = [];
    const x2: any[] = [];
    const y2: any[] = [];

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

    const step1 = shortestArrayLength * sum_xy - sum_x * sum_y;
    const step2 = shortestArrayLength * sum_x2 - sum_x * sum_x;
    const step3 = shortestArrayLength * sum_y2 - sum_y * sum_y;
    const step4 = Math.sqrt(step2 * step3);
    const answer = step1 / step4;

    return Number(+answer.toFixed(2));
  }

  calculatePearsonCorrelation(data) {
    // data is an array of arrays containing the pairs of [x, y]

    const xArray: any[] = [];
    const yArray: any[] = [];

    data.forEach(function (xyPair) {
      xArray.push(xyPair[0]);
      yArray.push(xyPair[1]);
    });

    return this.getPearsonCorrelation(xArray, yArray);
  }

  onChangeSelectedIndicators() {
    if (this.selection.selectedIndicatorForXAxis) {
      this.selection.selectedIndicatorForXAxis_backup = this.selection.selectedIndicatorForXAxis;
    } else if (this.selection.selectedIndicatorForXAxis_backup) {
      this.selection.selectedIndicatorForXAxis = this.selection.selectedIndicatorForXAxis_backup;
    }

    if (this.selection.selectedIndicatorForYAxis) {
      this.selection.selectedIndicatorForYAxis_backup = this.selection.selectedIndicatorForYAxis;
    } else if (this.selection.selectedIndicatorForYAxis_backup) {
      this.selection.selectedIndicatorForYAxis = this.selection.selectedIndicatorForYAxis_backup;
    }

    if (this.selection.selectedIndicatorForXAxis && this.selection.selectedIndicatorForYAxis) {
      this.eventsRegistered = false;

      if (!this.regressionChart)
        this.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
      else {
        // explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
        this.regressionChart.dispose();
        this.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
      }

      // await
      this.regressionChart.showLoading();

      // if(!this.sortedIndicatorProps){
      // 	this.sortedIndicatorProps = this.getAllIndicatorPropertiesSortedBySpatialUnitFeatureName();
      // }

      // await
      this.buildDataArrayForSelectedIndicators();

      setTimeout(() => {
        const data = this.data;

        data.sort(function (a, b) {
          return a[0] - b[0];
        });

        this.correlation = this.calculatePearsonCorrelation(data);

        this.linearRegression = ecStat.regression('linear', data, 1);

        const titlePrefix = this.enableScatterPlotRegression
          ? 'Lineare Regression - '
          : 'Streudiagramm - ';
        const dataViewTitle = this.enableScatterPlotRegression
          ? 'Datenansicht - lineare Regression'
          : 'Datenansicht - Streudiagramm';

        //get custom fontFamily
        const elem: any = document.querySelector('#fontFamily-reference');
        const style = getComputedStyle(elem);

        this.regressionOption = {
          textStyle: {
            fontFamily: style.fontFamily,
          },
          grid: {
            left: '10%',
            top: 10,
            right: '5%',
            bottom: 55,
            containLabel: true,
          },
          title: {
            text: titlePrefix + this.spatialUnitName + ' - ' + this.date,
            left: 'center',
            show: false,
          },
          tooltip: {
            trigger: 'item',
            confine: 'true',
            axisPointer: {
              type: 'cross',
              label: {
                formatter: (params, index) => {
                  //y-axis
                  if (params.axisDimension === 'y') {
                    return this.getIndicatorValue_asFormattedText(
                      params.value,
                      this.selection.selectedIndicatorForYAxis.indicatorMetadata.precision
                    );
                  }
                  //x-axis
                  else if (params.axisDimension === 'x') {
                    return this.getIndicatorValue_asFormattedText(
                      params.value,
                      this.selection.selectedIndicatorForXAxis.indicatorMetadata.precision
                    );
                  } else {
                    return this.getIndicatorValue_asFormattedText(params.value);
                  }
                },
              },
            },
            formatter: (params) => {
              if (!(params && params.value && params.value[0] && params.value[1])) {
                return '';
              }
              let string = '' + params.name + '<br/>';

              string +=
                this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName +
                ': ' +
                this.getIndicatorValue_asFormattedText(
                  params.value[0],
                  this.selection.selectedIndicatorForXAxis.indicatorMetadata.precision
                ) +
                ' [' +
                this.selection.selectedIndicatorForXAxis.indicatorMetadata.unit +
                ']<br/>';
              string +=
                this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName +
                ': ' +
                this.getIndicatorValue_asFormattedText(
                  params.value[1],
                  this.selection.selectedIndicatorForYAxis.indicatorMetadata.precision
                ) +
                ' [' +
                this.selection.selectedIndicatorForYAxis.indicatorMetadata.unit +
                ']<br/>';
              return string;
            },
          },
          xAxis: {
            name: this.indicatorValueService.formatIndicatorNameForLabel(
              this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName +
                ' - ' +
                this.selection.selectedIndicatorForXAxis.selectedDate +
                ' [' +
                this.selection.selectedIndicatorForXAxis.indicatorMetadata.unit +
                ']',
              100
            ),
            nameLocation: 'center',
            nameGap: 22,
            scale: true,
            type: 'value',
            splitLine: {
              lineStyle: {
                type: 'dashed',
              },
            },
            axisLabel: {
              formatter: (value, index) => {
                return this.getIndicatorValue_asFormattedText(
                  value,
                  this.selection.selectedIndicatorForXAxis.indicatorMetadata.precision
                );
              },
            },
          },
          yAxis: {
            name: this.indicatorValueService.formatIndicatorNameForLabel(
              this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName +
                ' - ' +
                this.selection.selectedIndicatorForYAxis.selectedDate +
                ' [' +
                this.selection.selectedIndicatorForYAxis.indicatorMetadata.unit +
                ']',
              75
            ),
            nameLocation: 'center',
            nameGap: 80,
            type: 'value',
            splitLine: {
              lineStyle: {
                type: 'dashed',
              },
            },
            axisLabel: {
              formatter: (value, index) => {
                return this.getIndicatorValue_asFormattedText(
                  value,
                  this.selection.selectedIndicatorForYAxis.indicatorMetadata.precision
                );
              },
            },
          },
          toolbox: {
            show: true,
            right: '15',
            feature: {
              // mark : {show: true},
              dataView: {
                show: this.exportButtonVisibility.showDiagramExportButtons,
                readOnly: true,
                title: 'Datenansicht',
                lang: [dataViewTitle, 'schlie&szlig;en', 'refresh'],
                optionToContent: (opt) => {
                  // has properties "name" and "value"
                  // value: [Number(xAxisDataElement.toFixed(4)), Number(yAxisDataElement.toFixed(4))]
                  const scatterSeries = opt.series[0].data;
                  let lineSeries;

                  if (this.enableScatterPlotRegression) {
                    lineSeries = opt.series[1].data;
                  }

                  const dataTableId = 'regressionDataTable';
                  const tableExportName = opt.title[0].text + ' - Scatter Table';

                  let htmlString = this.enableScatterPlotRegression
                    ? '<p>Data View enth&auml;lt zwei nachstehende Tabellen, die Tabelle der Datenpunkte des Streudiagramms und die Tabelle der Punkte der Regressionsgeraden.</p><br/>'
                    : '<p>Data View enth&auml;lt die Tabelle der Datenpunkte des Streudiagramms.</p><br/>';
                  htmlString += '<h4>Scatter Plot Tabelle</h4>';
                  htmlString +=
                    '<table id="' +
                    dataTableId +
                    '" class="table table-bordered table-sm" style="width:100%;text-align:center;">';
                  htmlString += '<thead>';
                  htmlString += '<tr>';
                  htmlString += "<th style='text-align:center;'>Raumeinheits-Name</th>";
                  htmlString += "<th style='text-align:center;'>" + opt.xAxis[0].name + '</th>';
                  htmlString += "<th style='text-align:center;'>" + opt.yAxis[0].name + '</th>';

                  htmlString += '</tr>';
                  htmlString += '</thead>';

                  htmlString += '<tbody>';

                  for (const scatterSeriesEntry of scatterSeries) {
                    htmlString += '<tr>';
                    htmlString += '<td>' + scatterSeriesEntry.name + '</td>';

                    htmlString +=
                      '<td>' +
                      this.getIndicatorValue_asNumber(
                        scatterSeriesEntry.value[0],
                        this.selection.selectedIndicatorForXAxis.indicatorMetadata.precision
                      ) +
                      '</td>';
                    htmlString +=
                      '<td>' +
                      this.getIndicatorValue_asNumber(
                        scatterSeriesEntry.value[1],
                        this.selection.selectedIndicatorForYAxis.indicatorMetadata.precision
                      ) +
                      '</td>';
                    htmlString += '</tr>';
                  }

                  htmlString += '</tbody>';
                  htmlString += '</table>';

                  let lineTableId;
                  let lineTableExportName;

                  if (this.enableScatterPlotRegression) {
                    lineTableId = 'lineDataTable';
                    lineTableExportName = opt.title[0].text + ' - Line Table';

                    htmlString +=
                      "<br/><h4>Referenzpunkte der Regressionsgraden '" +
                      this.linearRegression.expression +
                      "'</h4>";

                    htmlString +=
                      '<table id="' +
                      lineTableId +
                      '" class="table table-bordered table-sm" style="width:100%;text-align:center;">';
                    htmlString += '<thead>';
                    htmlString += '<tr>';
                    htmlString += "<th style='text-align:center;'>X</th>";
                    htmlString += "<th style='text-align:center;'>Y</th>";
                    htmlString += '</tr>';
                    htmlString += '</thead>';

                    htmlString += '<tbody>';

                    for (const lineSeriesEntry of lineSeries) {
                      htmlString += '<tr>';
                      htmlString +=
                        '<td>' +
                        this.getIndicatorValue_asNumber(
                          lineSeriesEntry[0],
                          this.selection.selectedIndicatorForXAxis.indicatorMetadata.precision
                        ) +
                        '</td>';
                      htmlString +=
                        '<td>' +
                        this.getIndicatorValue_asNumber(
                          lineSeriesEntry[1],
                          this.selection.selectedIndicatorForYAxis.indicatorMetadata.precision
                        ) +
                        '</td>';
                      htmlString += '</tr>';
                    }

                    htmlString += '</tbody>';
                    htmlString += '</table>';
                  }

                  this.broadcastService.broadcast(BroadcastMessage.AppendExportButtonsForTable, [
                    dataTableId,
                    tableExportName,
                  ]);

                  if (this.enableScatterPlotRegression) {
                    this.broadcastService.broadcast(BroadcastMessage.AppendExportButtonsForTable, [
                      lineTableId,
                      lineTableExportName,
                    ]);
                  }

                  return htmlString;
                },
              },
              restore: { show: false, title: 'Erneuern' },
              saveAsImage: { show: true, title: 'Export', pixelRatio: 4 },
            },
          },
          series: [
            {
              name: 'scatter',
              type: 'scatter',
              // label: {
              //     emphasis: {
              //         show: false,
              //         position: 'left',
              //         textStyle: {
              //             color: 'blue',
              //             fontSize: 16
              //         }
              //     }
              // },
              itemStyle: {
                borderWidth: 1,
                borderColor: 'black',
              },
              emphasis: {
                itemStyle: {
                  borderWidth: 4,
                  borderColor: this.defaultColorForClickedFeatures,
                },
              },
              data: this.dataWithLabels,
            },
          ],
        };

        if (this.enableScatterPlotRegression) {
          this.regressionOption.series.push({
            name: 'line',
            type: 'line',
            showSymbol: false,
            data: this.linearRegression.points,
            markPoint: {
              itemStyle: {
                normal: {
                  color: 'transparent',
                },
              },
              label: {
                normal: {
                  show: true,
                  position: 'left',
                  formatter: this.linearRegression.expression,
                  textStyle: {
                    color: '#333',
                    fontSize: 14,
                  },
                },
              },
              data: [
                {
                  coord: this.linearRegression.points[this.linearRegression.points.length - 1],
                },
              ],
            },
          });
        }

        this.regressionChart.setOption(this.regressionOption);

        // await
        this.regressionChart.hideLoading();
        setTimeout(() => {
          this.regressionChart.resize();
        }, 350);

        this.registerEventsIfNecessary();

        this.mapService.preserveHighlightedFeatures();
      }, 1500);
    }
  }

  registerEventsIfNecessary() {
    if (!this.eventsRegistered) {
      // when hovering over elements of the chart then highlight them in the map.
      this.regressionChart.on('mouseOver', (params) => {
        // this.userHoveresOverItem = true;
        const spatialFeatureName = params.data.name;
        // console.log(spatialFeatureName);
        if (spatialFeatureName) {
          this.mapService.highlightFeature(spatialFeatureName);
        }
      });

      this.regressionChart.on('mouseOut', (params) => {
        // this.userHoveresOverItem = false;

        const spatialFeatureName = params.data.name;
        // console.log(spatialFeatureName);
        if (spatialFeatureName) {
          this.mapService.unhighlightFeature(spatialFeatureName);
        }
      });

      this.regressionChart.on('click', (params) => {
        const spatialFeatureName = params.data.name;
        // console.log(spatialFeatureName);
        if (spatialFeatureName) {
          this.mapService.switchHighlightFeature(spatialFeatureName);
        }
      });

      this.eventsRegistered = true;
    }
  }

  onChangeEnableScatterPlotRegression() {
    this.onChangeSelectedIndicators();
  }
}
