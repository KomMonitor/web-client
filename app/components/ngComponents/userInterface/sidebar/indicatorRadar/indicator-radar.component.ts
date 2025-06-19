import { Component, OnInit } from '@angular/core';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import * as echarts from 'echarts';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  selector: 'app-indicator-radar',
  templateUrl: './indicator-radar.component.html',
  styleUrls: ['./indicator-radar.component.css']
})
export class IndicatorRadarComponent implements OnInit {

  
  activeTab = 0;
  
  date;
  spatialUnitName;
  radarChart;
  DATE_PREFIX = window.window.__env.indicatorDatePrefix;
  indicatorNameFilter = undefined;
  eventsRegistered = false;
  numberOfDecimals = window.window.__env.numberOfDecimals;
  setupCompleted = true;
  radarOption:any;

  exchangeData!: DataExchange;

  preppedIndicatorPropertiesForCurrentSpatialUnitAndTime!:any;
  propertiesForCurrentlySelectedIndicator!:any;
  propertiesForBaseIndicatorsOfCurrentHeadlineIndicator!: any;

  constructor(
    protected diagramHelperService: DiagramHelperServiceService,
    private dataExchangeService: DataExchangeService,
    private filterHelperService: FilterHelperService,
    private broadcastService: BroadcastService
  ) {
    this.exchangeData = this.dataExchangeService.pipedData;
  }

  ngOnInit(): void {

    setTimeout(() => {
      this.diagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(true);

      this.propertiesForCurrentlySelectedIndicator = this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.filter(e => e.indicatorMetadata.indicatorId === this.exchangeData.selectedIndicator.indicatorId);
      this.propertiesForBaseIndicatorsOfCurrentHeadlineIndicator = this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.filter(e => {

        var headlineIndicatorEntry = this.exchangeData.headlineIndicatorHierarchy.filter(element => element.headlineIndicator.indicatorId == this.exchangeData.selectedIndicator.indicatorId)[0];

        if(headlineIndicatorEntry){
          var baseIndicators_filtered = headlineIndicatorEntry.baseIndicators.filter(element => element.indicatorId == e.indicatorMetadata.indicatorId);
          if (baseIndicators_filtered.length > 0){
            return true;
          }
        }
        return false;
      });
    },2000);

    this.broadcastService.currentBroadcastMsg.subscribe(result => {
      let msg = result.msg;
      let val:any = result.values;

      switch (msg) {
        case 'resizeDiagrams': {
          this.onResizeDiagrams();
        } break;
        case 'updateDiagrams': {
          this.onUpdateDiagrams(val);
        } break;
        case 'allIndicatorPropertiesForCurrentSpatialUnitAndTime setup begin' : {
          this.onAllIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin();
        } break;
        case 'allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed' : {
          this.onAllIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_completed();
        } break;
        case 'updateDiagramsForHoveredFeature': {
          this.onUpdateDiagramsForHoveredFeature(val);
        } break;
        case 'updateDiagramsForUnhoveredFeature': {
          this.onUpdateDiagramsForHoveredFeature(val);
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
    let value = event.target.value;
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
      this.broadcastService.broadcast("preserveHighlightedFeatures");
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
          this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = new Array();
      }
      this.radarChart.showLoading();
      this.diagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime();
      this.activeTab = 0;
      if (this.exchangeData.selectedIndicator.creationType == "COMPUTATION") {
          this.activeTab = 1;
      }
      if (this.exchangeData.selectedIndicator.isHeadlineIndicator) {
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

      let indicatorArrayForRadarChart = new Array();
      let defaultSeriesValueArray = new Array();
      let sampleProperties = null;
      
      for (let i = 0; i < indicatorsForRadar.length; i++) {
          if (indicatorsForRadar[i].isSelected) {
            

              // make object to hold indicatorName, max value and average value
              let indicatorProperties = indicatorsForRadar[i].indicatorProperties;
              if (this.filterHelperService.completelyRemoveFilteredFeaturesFromDisplay && this.filterHelperService.filteredIndicatorFeatureIds.size > 0) {
                  indicatorProperties = indicatorProperties.filter(featureProperties => !this.filterHelperService.featureIsCurrentlyFiltered(featureProperties[window.window.__env.FEATURE_ID_PROPERTY_NAME]));
              }
              sampleProperties = indicatorsForRadar[i].indicatorProperties;
              // var closestApplicableTimestamp = kommonitorDiagramHelperService.findClostestTimestamForTargetDate(indicatorsForRadar[i], this.date);
              // indicatorsForRadar[i].closestTimestamp = closestApplicableTimestamp;
              let sample:any[] = indicatorProperties[0];
              let maxValue = sample[this.DATE_PREFIX + indicatorsForRadar[i].selectedDate];
              let minValue = sample[this.DATE_PREFIX + indicatorsForRadar[i].selectedDate];
              let valueSum = 0;
              for (let indicatorPropertyInstance of indicatorProperties) {
                  // for average only apply real numeric values
                  if (!this.dataExchangeService.indicatorValueIsNoData(indicatorPropertyInstance[this.DATE_PREFIX + indicatorsForRadar[i].selectedDate])) {
                    let value = this.dataExchangeService.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, indicatorsForRadar[i].selectedDate, indicatorsForRadar[i].indicatorMetadata.precision);
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
              indicatorArrayForRadarChart.push({
                  name: indicatorsForRadar[i].indicatorMetadata.indicatorName + " - " + indicatorsForRadar[i].selectedDate,
                  unit: indicatorsForRadar[i].indicatorMetadata.unit,
									precision: indicatorsForRadar[i].indicatorMetadata.precision,
                  max: maxValue,
                  min: minValue
              });
              defaultSeriesValueArray.push(this.dataExchangeService.getIndicatorValue_asNumber(Number(valueSum / indicatorProperties.length), indicatorsForRadar[i].indicatorMetadata.precision));
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
          //get custom fontFamilyAdd commentMore actions

          var elem:any = document.querySelector('#fontFamily-reference');
          var style = getComputedStyle(elem);

          this.radarOption = {
              textStyle: {
                  fontFamily: style.fontFamily
              },
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
                      var string = "" + params.name + "<br/>";
                      for (var index = 0; index < params.value.length; index++) {
                          string += this.radarOption.radar.indicator[index].name + ": " + this.dataExchangeService.getIndicatorValue_asFormattedText(params.value[index], this.radarOption.radar.indicator[index].precision) + " [" + this.radarOption.radar.indicator[index].unit + "]<br/>";
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
                          show: this.exchangeData.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Indikatorenradar', 'schlie&szlig;en', 'refresh'], optionToContent: (opt) => {
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
                              var radarSeries = opt.series[0].data;
                              var indicators = opt.radar[0].indicator;
                              var dataTableId = "radarDataTable";
                              var tableExportName = opt.title[0].text;
                              var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
                              htmlString += "<thead>";
                              htmlString += "<tr>";
                              htmlString += "<th style='text-align:center;'>Raumeinheits-Name</th>";
                              for (var i = 0; i < indicators.length; i++) {
                                  htmlString += "<th style='text-align:center;'>" + indicators[i].name + " [" + indicators[i].unit + "]</th>";
                              }
                              htmlString += "</tr>";
                              htmlString += "</thead>";
                              htmlString += "<tbody>";
                              for (let j = 0; j < radarSeries.length; j++) {
                                  htmlString += "<tr>";
                                  htmlString += "<td>" + radarSeries[j].name + "</td>";
                                  for (let k = 0; k < indicators.length; k++) {
                                      htmlString += "<td>" + this.dataExchangeService.getIndicatorValue_asFormattedText(radarSeries[j].value[k], this.radarOption.radar.indicator[k].precision) + "</td>";
                                  }
                                  htmlString += "</tr>";
                              }
                              htmlString += "</tbody>";
                              htmlString += "</table>";
                              this.broadcastService.broadcast("AppendExportButtonsForTable", [dataTableId, tableExportName]);
                              return htmlString;
                          }
                      },
                      restore: { show: false, title: "Darstellung erneuern" },
                      saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
                  }
              },
              legend: {
                  type: "scroll",
                  bottom: 0,
                  align: 'left',
                  left: 5,
                  data: ['Arithmetisches Mittel']
              },
              radar: {
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
                          return this.dataExchangeService.formatIndicatorNameForLabel(value, 15);
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
      for (var propertiesInstance of sampleProperties) {
          if (this.filterHelperService.featureIsCurrentlySelected(propertiesInstance[window.__env.FEATURE_ID_PROPERTY_NAME])) {
              this.appendSeriesToRadarChart(propertiesInstance);
          }
      }
  }

  registerEventsIfNecessary() {
      if (!this.eventsRegistered) {
          // when hovering over elements of the chart then highlight them in the map.
          this.radarChart.on('mouseOver', (params) => {
              // this.userHoveresOverItem = true;
              var spatialFeatureName = params.data.name;
              // console.log(spatialFeatureName);
              if (spatialFeatureName) {
                  this.broadcastService.broadcast("highlightFeatureOnMap", [spatialFeatureName]);
              }
          });
          this.radarChart.on('mouseOut', (params) => {
              // this.userHoveresOverItem = false;
              var spatialFeatureName = params.data.name;
              // console.log(spatialFeatureName);
              if (spatialFeatureName) {
                  this.broadcastService.broadcast("unhighlightFeatureOnMap", [spatialFeatureName]);
              }
          });
          //disable feature removal for radar chart - seems to be unintuititve
          // this.radarChart.on('click', function(params){
          // 	var spatialFeatureName = params.data.name;
          // 	// console.log(spatialFeatureName);
          // if(spatialFeatureName){
          // 	this.broadcastService.broadcast("switchHighlightFeatureOnMap", spatialFeatureName);
          // }
          // });
          this.eventsRegistered = true;
      }
  }

  onUpdateDiagramsForHoveredFeature(featureProperties) {
      if (!this.radarChart || !this.radarOption || !this.radarOption.legend || !this.radarOption.series) {
          return;
      }
      if (!this.filterHelperService.featureIsCurrentlySelected(featureProperties[window.__env.FEATURE_ID_PROPERTY_NAME])) {
          this.appendSeriesToRadarChart(featureProperties);
      }
      this.highlightFeatureInRadarChart(featureProperties);
  }

  appendSeriesToRadarChart(featureProperties) {
      // append feature name to legend
      this.radarOption.legend.data.push(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);
      // create feature data series
      var featureSeries:any = {};
      featureSeries.name = featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME];
      featureSeries.value = new Array();
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
      for (var i = 0; i < this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.length; i++) {
          if (this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].isSelected) {
              // make object to hold indicatorName, max value and average value
              var indicatorProperties = this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorProperties;
              var date = this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].selectedDate;
              for (var indicatorPropertyInstance of indicatorProperties) {
                  if (indicatorPropertyInstance[window.__env.FEATURE_NAME_PROPERTY_NAME] == featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]) {
                      if (!this.dataExchangeService.indicatorValueIsNoData(indicatorPropertyInstance[this.DATE_PREFIX + date])) {
                          featureSeries.value.push(this.dataExchangeService.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, date, this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorMetadata.precision));
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
      var dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);
      if (dataIndex > -1) {
          this.radarChart.dispatchAction({
              type: 'highlight',
              seriesIndex: 0,
              dataIndex: dataIndex
          });
      }
  }

  onUpdateDiagramsForUnhoveredFeature(featureProperties) {
      if (!this.radarChart || !this.radarOption || !this.radarOption.legend || !this.radarOption.series) {
          return;
      }
      this.unhighlightFeatureInRadarChart(featureProperties);
      if (!this.filterHelperService.featureIsCurrentlySelected(featureProperties[window.__env.FEATURE_ID_PROPERTY_NAME])) {
          this.removeSeriesFromRadarChart(featureProperties);
      }
  }

  getSeriesDataIndexByFeatureName(featureName) {
      for (var index = 0; index < this.radarOption.series[0].data.length; index++) {
          if (this.radarOption.series[0].data[index].name == featureName)
              return index;
      }
      //return -1 if none was found
      return -1;
  }

  removeSeriesFromRadarChart(featureProperties) {
      // remove feature from legend
      var legendIndex = this.radarOption.legend.data.indexOf(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);
      if (legendIndex > -1) {
          this.radarOption.legend.data.splice(legendIndex, 1);
      }
      // remove feature data series
      var dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);
      if (dataIndex > -1) {
          this.radarOption.series[0].data.splice(dataIndex, 1);
      }
      // second parameter tells echarts to not merge options with previous data. hence really remove series from graphic
      this.radarChart.setOption(this.radarOption, true);
      setTimeout( () => {
          this.radarChart.resize();
      }, 350);
      this.registerEventsIfNecessary();
  }
  
  unhighlightFeatureInRadarChart(featureProperties) {
      // highlight the corresponding bar diagram item
      // get series index of series
      var dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]);
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
      for (var indicator of this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
          indicator.isSelected = true;
      }
      this.modifyRadarContent(this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }

  deselectAllIndicatorsForRadar() {
      for (var indicator of this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
          indicator.isSelected = false;
      }
      this.modifyRadarContent(this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  };
}
