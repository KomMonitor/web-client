import { Component, OnInit } from '@angular/core';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import * as echarts from 'echarts';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndicatorNameFilter } from 'pipes/indicator-title-filter.pipe';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';

@Component({
  selector: 'app-indicator-radar',
  templateUrl: './indicator-radar.component.html',
  styleUrls: ['./indicator-radar.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IndicatorNameFilter, ExpandableBoxComponent]
}) export class IndicatorRadarComponent implements OnInit {

  
  activeTab = 0;

  isRadarChartCollapsed = false;
  isIndicatorSelectCollapsed = false;
  
  date;
  spatialUnitName;
  radarChart;
  private DATE_PREFIX = this.envConfigService.indicatorDatePrefix;
  indicatorNameFilter = undefined;
  eventsRegistered = false;
  private numberOfDecimals = this.envConfigService.numberOfDecimals;
  setupCompleted = true;
  radarOption:any;

  preppedIndicatorPropertiesForCurrentSpatialUnitAndTime!:any;
  propertiesForCurrentlySelectedIndicator!:any;
  propertiesForBaseIndicatorsOfCurrentHeadlineIndicator!: any;

  chartTitle!: string;

  indicatorNames_shortVersion = false;
  printLayout = false;
  radarHeight = '60vh';
  radarheight_defaultNum = 60;

  constructor(
    protected diagramHelperService: DiagramHelperServiceService,
    protected exportButtonVisibility: ExportButtonVisibilityService,
    private indicatorValueService: IndicatorValueService,
    protected selectionState: SelectionStateService,
    private topicHierarchyStore: TopicHierarchyStoreService,
    private filterHelperService: FilterHelperService,
    private broadcastService: BroadcastService,
    private envConfigService: EnvConfigService
  ) { }

  // Local precision-resolving wrappers (formerly the DataExchangeService facade glue, Prio7 B1).
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

  private getIndicatorValueFromArray_asNumber(propertiesArray, targetDateString, precision = undefined) {
    return this.indicatorValueService.getIndicatorValueFromArray_asNumber(
      propertiesArray,
      targetDateString,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  ngOnInit(): void {

    setTimeout(() => {
      // Skip the initial seed if metadata / selection state is not ready yet; the radar
      // is re-driven via the 'updateDiagrams' broadcast once an indicator is selected.
      if (!this.selectionState.selectedIndicator || !this.selectionState.selectedSpatialUnit) {
        return;
      }

      this.diagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(true);

      this.propertiesForCurrentlySelectedIndicator = this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.filter(e => e.indicatorMetadata.indicatorId === this.selectionState.selectedIndicator.indicatorId);
      this.propertiesForBaseIndicatorsOfCurrentHeadlineIndicator = this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.filter(e => {

        const headlineIndicatorEntry = this.topicHierarchyStore.headlineIndicatorHierarchy.filter(element => element.headlineIndicator.indicatorId == this.selectionState.selectedIndicator.indicatorId)[0];

        if(headlineIndicatorEntry){
          const baseIndicators_filtered = headlineIndicatorEntry.baseIndicators.filter(element => element.indicatorId == e.indicatorMetadata.indicatorId);
          if (baseIndicators_filtered.length > 0){
            return true;
          }
        }
        return false;
      });

      this.chartTitle = `Indikatorenradar - ${this.spatialUnitName}`;
    },2000);

    this.broadcastService.currentBroadcastMsg.subscribe(result => {
      const msg = result.msg;
      const val:any = result.values;

      switch (msg) {
        case 'resizeDiagrams': {
          this.onResizeDiagrams();
        } break;
        case BroadcastMessage.UpdateDiagrams: {
          this.onUpdateDiagrams(val);
        } break;
        case BroadcastMessage.AllIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin: {
          this.onAllIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin();
        } break;
        case BroadcastMessage.AllIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted: {
          this.onAllIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_completed();
        } break;
        case BroadcastMessage.UpdateDiagramsForHoveredFeature: {
          this.onUpdateDiagramsForHoveredFeature(val);
        } break;
        case BroadcastMessage.UpdateDiagramsForUnhoveredFeature: {
          this.onUpdateDiagramsForUnhoveredFeature(val);
        } break;
        case BroadcastMessage.UnselectAllFeatures: {

        } break;
      }
    });
  }

  // initialize any adminLTE box widgets
 /*  $('.box').boxWidget();
  $(window).on('resize', function () {
      if (this.radarChart != null && this.radarChart != undefined) {
          this.radarChart.resize();
      }
  }); 
*/

  filterAvailableIndicators(event:any) {
    const value = event.target.value;
    this.indicatorNameFilter = value;
  }

  onResizeDiagrams(){
      setTimeout( () => {
          if (this.radarChart != null && this.radarChart != undefined) {
              this.radarChart.resize();
          }
      }, 350);
  }

  onChangeFilterSameUnitAndSameTime() {
      if (this.radarChart) {
          this.radarChart.dispose();
          this.radarChart = echarts.init(document.getElementById('radarDiagram'));
      }
      this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
      this.diagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(this.diagramHelperService.filterSameUnitAndSameTime);
  };

  onUpdateDiagrams([indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling]) {
      // if the layer is just restyled (i.e. due to change of measureOfValue)
      // then we do not need to costly update the radar diagram
      if (justRestyling) {
          return;
      }
      console.log("updating radar diagram");
      this.setupCompleted = false;
      this.updateRadarChart(indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date);
      this.broadcastService.broadcast(BroadcastMessage.PreserveHighlightedFeatures);
  }

  // RADAR CHART TIME SERIES FUNCTION
  updateRadarChart(indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date) {
      // based on prepared DOM, initialize echarts instance
      this.date = date;
      this.spatialUnitName = spatialUnitName;
      if (!this.radarChart)
          this.radarChart = echarts.init(document.getElementById('radarDiagram'));
      else {
          // explicitly kill and reinstantiate radar diagram to avoid zombie states on spatial unit change
          this.radarChart.dispose();
          this.radarChart = echarts.init(document.getElementById('radarDiagram'));
          this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
      }
      this.radarChart.showLoading();
      this.diagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime();
      this.activeTab = 0;
      if (this.selectionState.selectedIndicator.creationType == "COMPUTATION") {
          this.activeTab = 1;
      }
      if (this.selectionState.selectedIndicator.isHeadlineIndicator) {
          this.activeTab = 2;
      }
      this.modifyRadarContent(this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  };

  onChangeSelectedDate(input) {
      if (input.isSelected) {
          this.modifyRadarContent(this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
      }
  };

  wait = ms => new Promise((r, j) => setTimeout(r, ms));

  onAllIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin() {
      this.wait(130);
      this.setupCompleted = false;
  }

  onAllIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_completed() {
      this.wait(130);
      this.setupCompleted = true;
      setTimeout( () => {
          this.filterDisplayedIndicatorsOnRadar();
      }, 500);
  }

  modifyRadarContent(indicatorsForRadar) {

    for (let i = 0; i < indicatorsForRadar.length; i++) {
      if (indicatorsForRadar[i].isSelected) {
        
          this.diagramHelperService.fetchIndicatorPropertiesIfNotExists(i);
      }
    }

    setTimeout(() => {

      const indicatorArrayForRadarChart: any[] = [];
      const defaultSeriesValueArray: any[] = [];
      let sampleProperties = null;
      
      for (let i = 0; i < indicatorsForRadar.length; i++) {
          if (indicatorsForRadar[i].isSelected) {
            

              // make object to hold indicatorName, max value and average value
              let indicatorProperties = indicatorsForRadar[i].indicatorProperties;
              if (this.filterHelperService.completelyRemoveFilteredFeaturesFromDisplay && this.filterHelperService.filteredIndicatorFeatureIds.size > 0) {
                  indicatorProperties = indicatorProperties.filter(featureProperties => !this.filterHelperService.featureIsCurrentlyFiltered(featureProperties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]));
              }
              sampleProperties = indicatorsForRadar[i].indicatorProperties;
              // var closestApplicableTimestamp = kommonitorDiagramHelperService.findClostestTimestamForTargetDate(indicatorsForRadar[i], this.date);
              // indicatorsForRadar[i].closestTimestamp = closestApplicableTimestamp;
              const sample:any[] = indicatorProperties[0];
              let maxValue = sample[this.DATE_PREFIX + indicatorsForRadar[i].selectedDate];
              let minValue = sample[this.DATE_PREFIX + indicatorsForRadar[i].selectedDate];
              let valueSum = 0;
              for (const indicatorPropertyInstance of indicatorProperties) {
                  // for average only apply real numeric values
                  if (!this.indicatorValueService.indicatorValueIsNoData(indicatorPropertyInstance[this.DATE_PREFIX + indicatorsForRadar[i].selectedDate])) {
                    const value = this.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, indicatorsForRadar[i].selectedDate, indicatorsForRadar[i].indicatorMetadata.precision);
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
              // IT MIGHT HAPPEN THAT AN INDICATOR IS INSPECTED THAT DOES NOT SUPPORT THE DATE
              // HENCE ONLY ADD VALUES TO DEFAULT IF THEY SHOW MEANINGFUL VALUES
              // if(valueSum != null){

              let name = indicatorsForRadar[i].indicatorMetadata.indicatorName;
              if(this.indicatorNames_shortVersion && (indicatorsForRadar[i].indicatorMetadata.abbreviation!='' && indicatorsForRadar[i].indicatorMetadata.abbreviation!=null && indicatorsForRadar[i].indicatorMetadata.abbreviation!=undefined))
                name = indicatorsForRadar[i].indicatorMetadata.abbreviation

              indicatorArrayForRadarChart.push({
                  name: name + " - " + indicatorsForRadar[i].selectedDate,
                  unit: indicatorsForRadar[i].indicatorMetadata.unit,
									precision: indicatorsForRadar[i].indicatorMetadata.precision,
                  max: maxValue,
                  min: minValue
              });
              defaultSeriesValueArray.push(this.getIndicatorValue_asNumber(Number(valueSum / indicatorProperties.length), indicatorsForRadar[i].indicatorMetadata.precision));
              // }
          }
      }
      if (defaultSeriesValueArray.length === 0) {
          if (this.radarChart) {
              this.radarChart.dispose();
              this.radarChart = undefined;
          }
      }
      else {
          if (!this.radarChart)
              this.radarChart = echarts.init(document.getElementById('radarDiagram'));
          // else{
          // 	// explicitly kill and reinstantiate radar diagram to avoid zombie states on spatial unit change
          // 	this.radarChart.dispose();
          // 	this.radarChart = echarts.init(document.getElementById('radarDiagram'));
          // }


          //get custom fontFamilyAdd 
          const elem:any = document.querySelector('#fontFamily-reference');
          const style = getComputedStyle(elem);

          this.radarOption = {
              textStyle: {
                  fontFamily: style.fontFamily
              },
              grid: {
                  left: '4%',
                  top: 0,
                  right: '4%',
                  bottom: 50,
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
                          string += this.radarOption.radar.indicator[index].name + ": " + this.getIndicatorValue_asFormattedText(params.value[index], this.radarOption.radar.indicator[index].precision) + " [" + this.radarOption.radar.indicator[index].unit + "]<br/>";
                      }
                      ;
                      return string;
                  }
                  // position: ['50%', '50%']
              },
              toolbox: {
                  show: true,
                  right: '15',
                  feature: {
                      // mark : {show: true},
                      dataView: {
                          show: this.exportButtonVisibility.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Indikatorenradar', 'schlie&szlig;en', 'refresh'], optionToContent: (opt) => {
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
                              const radarSeries = opt.series[0].data;
                              const indicators = opt.radar[0].indicator;
                              const dataTableId = "radarDataTable";
                              const tableExportName = opt.title[0].text;
                              let htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
                              htmlString += "<thead>";
                              htmlString += "<tr>";
                              htmlString += "<th style='text-align:center;'>Raumeinheits-Name</th>";
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
                                      htmlString += "<td>" + this.getIndicatorValue_asFormattedText(radarSeries[j].value[k], this.radarOption.radar.indicator[k].precision) + "</td>";
                                  }
                                  htmlString += "</tr>";
                              }
                              htmlString += "</tbody>";
                              htmlString += "</table>";
                              this.broadcastService.broadcast(BroadcastMessage.AppendExportButtonsForTable, [dataTableId, tableExportName]);
                              return htmlString;
                          }
                      },
                      restore: { show: false, title: "Darstellung erneuern" },
                      saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
                  }
              },
              radar: {
                radius: '55%',
                center: ['50%', '45%'],
                  // shape: 'circle',
                  // name: {
                  //     textStyle: {
                  //         color: '#fff',
                  //         backgroundColor: '#999',
                  //         borderRadius: 3,
                  //         padding: [3, 5]
                  //    }
                  // },
                name: {
                    formatter: (value, indicator) => {
                        return this.indicatorValueService.formatIndicatorNameForLabel(value, 15);
                    },
                    textStyle: {
                        color: '#525252'
                    },
                    fontSize: 11
                },
                indicator: indicatorArrayForRadarChart
              },
              series: [{
                      name: 'Indikatorvergleich',
                      type: 'radar',
                      symbolSize: 8,
                      data: [
                          {
                              value: defaultSeriesValueArray,
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
          };

          // set legend either in scroll or plain mode for print layout (scroll is not beeing displayed in print version)
          if(this.printLayout)
            this.radarOption.legend = {
              orient: 'horizontal',
              type: 'plain',
              bottom: 0,
              width: '80%',
              align: 'left',
              left: 5,
              data: ['Arithmetisches Mittel']
            }
          else
            this.radarOption.legend = {
              type: "scroll",
              bottom: 0,
              align: 'left',
              left: 5,
              data: ['Arithmetisches Mittel']
            }

          // check if any feature is still clicked/selected
          // then append those as series within radar chart
          this.appendSelectedFeaturesIfNecessary(sampleProperties);
          // use configuration item and data specified to show chart
          this.radarChart.setOption(this.radarOption);
          this.radarChart.hideLoading();
          setTimeout( () => {
              this.radarChart.resize();
          }, 350);
          this.registerEventsIfNecessary();
      }
      
    },1000);

  };

  appendSelectedFeaturesIfNecessary(sampleProperties) {
      for (const propertiesInstance of sampleProperties) {
          if (this.filterHelperService.featureIsCurrentlySelected(propertiesInstance[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
              this.appendSeriesToRadarChart(propertiesInstance);
          }
      }
  }

  registerEventsIfNecessary() {
      if (!this.eventsRegistered) {
          // when hovering over elements of the chart then highlight them in the map.
          this.radarChart.on('mouseOver', (params) => {
              // this.userHoveresOverItem = true;
              const spatialFeatureName = params.data.name;
              // console.log(spatialFeatureName);
              if (spatialFeatureName) {
                  this.broadcastService.broadcast(BroadcastMessage.HighlightFeatureOnMap, [spatialFeatureName]);
              }
          });
          this.radarChart.on('mouseOut', (params) => {
              // this.userHoveresOverItem = false;
              const spatialFeatureName = params.data.name;
              // console.log(spatialFeatureName);
              if (spatialFeatureName) {
                  this.broadcastService.broadcast(BroadcastMessage.UnhighlightFeatureOnMap, [spatialFeatureName]);
              }
          });
          //disable feature removal for radar chart - seems to be unintuititve
          // this.radarChart.on('click', function(params){
          // 	var spatialFeatureName = params.data.name;
          // 	// console.log(spatialFeatureName);
          // if(spatialFeatureName){
          // 	this.broadcastService.broadcast(BroadcastMessage.SwitchHighlightFeatureOnMap, spatialFeatureName);
          // }
          // });
          this.eventsRegistered = true;
      }
  }

  onUpdateDiagramsForHoveredFeature([featureProperties]) {
      if (!this.radarChart || !this.radarOption || !this.radarOption.legend || !this.radarOption.series) {
          return;
      }

      const legendIndex = this.radarOption.legend.data.indexOf(featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]);
      if (legendIndex === -1) {
        if (!this.filterHelperService.featureIsCurrentlySelected(featureProperties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
            console.log("Feature append");
            this.appendSeriesToRadarChart(featureProperties);
        }
      }
      this.highlightFeatureInRadarChart(featureProperties);
  }

  onChangeIndicatorNames() {
            
    // indicator names changes to abbreviation
    this.modifyRadarContent(this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }

  onChangePrintLayout() {

    // layout change to legend in plain iso scroll mode
    this.modifyRadarContent(this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);

    this.checkResizeRadarChart();

    setTimeout(() => {
      this.radarChart.resize();
    }, 350);
  }

  checkResizeRadarChart() {

    // only adjust if printLayout (e.g. legend fully visible)
    if(this.printLayout) {

      const strLengthTotal = this.radarOption.legend.data.reduce(function (sum, str) {
                                                                    return sum + str.length;
                                                                  }, 0);

                                              // 6 pixel for each letter                      35 for each coloured rect
      const legendLengthTotal = (strLengthTotal * 6) + (this.radarOption.legend.data.length * 40);
      const elem = document.getElementById('radarDiagram');

      if(elem) {
        const boxWidthTotal = elem.clientWidth;
        const numLines = Math.ceil( legendLengthTotal / boxWidthTotal );

                                          // 5 vh for each line, rough estimate
        this.radarHeight = (55 + (numLines * 8)) + 'vh';
      }
    } else
      this.radarHeight = this.radarheight_defaultNum + 'vh';
  }

  appendSeriesToRadarChart(featureProperties) {
      // append feature name to legend
      this.radarOption.legend.data.push(featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]);
      
      // check resize radar div based on legend entries (for printLayout)
      this.checkResizeRadarChart();

      // create feature data series
      const featureSeries:any = {};
      featureSeries.name = featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME];
      featureSeries.value = [];
      featureSeries.emphasis = {
          lineStyle: {
              width: 4,
              type: 'dotted'
          }
      };
      featureSeries.lineStyle = {
          width: 3,
          type: 'solid'
      };
      featureSeries.itemStyle = {
          borderWidth: 2
      };
      // for each indicator create series data entry for feature
      for (let i = 0; i < this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.length; i++) {
          if (this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].isSelected) {
              // make object to hold indicatorName, max value and average value
              const indicatorProperties = this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorProperties;
              const date = this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].selectedDate;
              for (const indicatorPropertyInstance of indicatorProperties) {
                  if (indicatorPropertyInstance[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] == featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]) {
                      if (!this.indicatorValueService.indicatorValueIsNoData(indicatorPropertyInstance[this.DATE_PREFIX + date])) {
                          featureSeries.value.push(this.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, date, this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorMetadata.precision));
                      }
                      else {
                          featureSeries.value.push(null);
                      }
                      break;
                  }
              }
          }
      }
      this.radarOption.series[0].data.push(featureSeries);
      this.radarChart.setOption(this.radarOption);
      setTimeout( () => {
          this.radarChart.resize();
      }, 350);
      this.registerEventsIfNecessary();
  }

  highlightFeatureInRadarChart(featureProperties) {
    // highlight the corresponding bar diagram item
    // get series index of series
    const dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]);
    if (dataIndex > -1) {
        this.radarChart.dispatchAction({
            type: 'highlight',
            seriesIndex: 0,
            dataIndex: dataIndex
        });
    }
  }

  onUpdateDiagramsForUnhoveredFeature([featureProperties]) {
    if (!this.radarChart || !this.radarOption || !this.radarOption.legend || !this.radarOption.series) {
        return;
    }
    this.unhighlightFeatureInRadarChart(featureProperties);
    if (!this.filterHelperService.featureIsCurrentlySelected(featureProperties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
        this.removeSeriesFromRadarChart(featureProperties);
    }
  }

  getSeriesDataIndexByFeatureName(featureName) {
    for (let index = 0; index < this.radarOption.series[0].data.length; index++) {
        if (this.radarOption.series[0].data[index].name == featureName)
            return index;
    }
    //return -1 if none was found
    return -1;
  }

  removeSeriesFromRadarChart(featureProperties) {
      // remove feature from legend
      const targetIndices: number[] = [];  
      this.radarOption.legend.data.forEach((val: any, index: number) => {
        if (val === featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]) {
            targetIndices.push(index);
        }
      });

      // check resize radar div based on legend entries (for printLayout)
      this.checkResizeRadarChart();
      
      targetIndices.forEach(legendIndex => {
        if (legendIndex > -1) {
            this.radarOption.legend.data.splice(legendIndex, 1);
        }
        // remove feature data series
        const dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]);
        if (dataIndex > -1) {
            this.radarOption.series[0].data.splice(dataIndex, 1);
        }
        // second parameter tells echarts to not merge options with previous data. hence really remove series from graphic
        this.radarChart.setOption(this.radarOption, true);
        setTimeout( () => {
            this.radarChart.resize();
        }, 350);
        this.registerEventsIfNecessary();
      });

  }
  
  unhighlightFeatureInRadarChart(featureProperties) {
      // highlight the corresponding bar diagram item
      // get series index of series
      const dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]);
      if (dataIndex > -1) {
          this.radarChart.dispatchAction({
              type: 'downplay',
              seriesIndex: 0,
              dataIndex: dataIndex
          });
      }
  }

  filterDisplayedIndicatorsOnRadar() {
      console.log("Filtering indicator radar");
      this.modifyRadarContent(this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }

  selectAllIndicatorsForRadar() {
      for (const indicator of this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
          indicator.isSelected = true;
      }
      this.modifyRadarContent(this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }

  deselectAllIndicatorsForRadar() {
      for (const indicator of this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
          indicator.isSelected = false;
      }
      this.modifyRadarContent(this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  };
}
