import { Component, OnInit } from '@angular/core';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import * as echarts from 'echarts';
import * as ecStat from 'echarts-stat';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';

@Component({
  selector: 'app-regression-diagram',
  templateUrl: './regression-diagram.component.html',
  styleUrls: ['./regression-diagram.component.css']
})
export class RegressionDiagramComponent implements OnInit {
  
  activeTab = 0;


  selection:any = {
    indicatorNameFilterForXAxis: undefined,
    indicatorNameFilterForYAxis: undefined,
    selectedIndicatorForXAxis: undefined,
    selectedIndicatorForXAxis_backup: undefined,
    selectedIndicatorForYAxis: undefined,
    selectedIndicatorForYAxis_backup: undefined,
  };

  DATE_PREFIX = window.__env.indicatorDatePrefix;
  numberOfDecimals = window.__env.numberOfDecimals;
  defaultColorForFilteredValues = window.__env.defaultColorForFilteredValues;
  defaultColorForZeroValues = window.__env.defaultColorForZeroValues;
  defaultColorForNoDataValues = window.__env.defaultColorForNoDataValues;
  defaultColorForHoveredFeatures = window.__env.defaultColorForHoveredFeatures;
  defaultColorForClickedFeatures = window.__env.defaultColorForClickedFeatures;

  defaultColorForOutliers_high = window.__env.defaultColorForOutliers_high;
  defaultBorderColorForOutliers_high = window.__env.defaultBorderColorForOutliers_high;
  defaultFillOpacityForOutliers_high = window.__env.defaultFillOpacityForOutliers_high;
  defaultColorForOutliers_low = window.__env.defaultColorForOutliers_low;
  defaultBorderColorForOutliers_low = window.__env.defaultBorderColorForOutliers_low;
  defaultFillOpacityForOutliers_low = window.__env.defaultFillOpacityForOutliers_low;

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

  exchangeData;

  constructor(
    protected diagramHelperService: DiagramHelperServiceService,
    private dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    private filterHelperService: FilterHelperService
  ) {
    this.exchangeData = this.dataExchangeService.pipedData;
  }
  
  ngOnInit(): void {

    $(document).ready(function() {
      $(".nav li.disabled a").click(function() {
        return false;
      });
    });

    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'updateDiagrams' : {
          this.updateDiagrams(values);
        } break;
        case 'updateDiagramsForHoveredFeature': {
          this.updateDiagramsForHoveredFeature(values);
        } break;
        case 'updateDiagramsForUnhoveredFeature': {
          this.updateDiagramsForUnhoveredFeature(values);
        } break;
        case 'resizeDiagrams': {
          this.resizeDiagrams();
        } break;  
        case 'allIndicatorPropertiesForCurrentSpatialUnitAndTime setup begin': {
          this.allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin();
        } break;
        case 'allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed': {
          this.allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_completed();
        } break;
      }
    });
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

  filterAvailableIndicatorsXAxis(event:any) {
    let value = event.target.value;
    this.selection.indicatorNameFilterForXAxis = value;
  }

  filterAvailableIndicatorsYAxis(event:any) {
    let value = event.target.value;
    this.selection.indicatorNameFilterForYAxis = value;
  }

  resizeDiagrams() {

    setTimeout(() => {
      if(this.regressionChart != null && this.regressionChart != undefined){
          this.regressionChart.resize();
      }
    }, 350);
  }

  filterIndicators() {

    return this.dataExchangeService.filterIndicators();
  };

  filterIndicatorsBySpatialUnitAndDate() {
    return ( item ) => {
      //
      // await wait(2000);

      if(item.applicableSpatialUnits.some(o => o.spatialUnitName == this.exchangeData.selectedSpatialUnit.spatialUnitLevel)){
        return item.applicableDates.includes(this.exchangeData.selectedDate);
      }
      else{
        return false;
      }

    };
  };

  wait = ms => new Promise((r, j)=>setTimeout(r, ms));

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
  };

  onChangeFilterSameUnitAndSameTime(){
    if(this.regressionChart){
      this.regressionChart.dispose();
      this.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
    }
    this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
    
    this.diagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(this.diagramHelperService.filterSameUnitAndSameTime);
  };

  updateDiagrams([indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling]) {

    this.correlation = undefined;
    this.linearRegression = undefined;
    this.regressionOption = undefined;
    this.sortedIndicatorProps = undefined;
    this.data = undefined;
    this.dataWithLabels = undefined;
    this.eventsRegistered = false;
    this.indicatorPropertyName = this.DATE_PREFIX + this.exchangeData.selectedDate;
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

    if(justRestyling){
      this.onChangeSelectedIndicators();
    }
    else{
      if(this.regressionChart){
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
    if(this.exchangeData.selectedIndicator.creationType == "COMPUTATION"){
      this.activeTab = 1;
    }
    if(this.exchangeData.selectedIndicator.isHeadlineIndicator){
      this.activeTab = 2;
    }

    setTimeout(() => {
      this.onChangeSelectedIndicators();
    }, 500);
                      
  }

  updateDiagramsForHoveredFeature([featureProperties]) {

    if(!this.regressionChart){
      return;
    }

    // if(this.userHoveresOverItem){
    // 	return;
    // }

    var index = -1;
    for(var i=0; i<this.regressionOption.series[0].data.length; i++){
      if(this.regressionOption.series[0].data[i].name == featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]){
        index = i;
        break;
      }
    }

    if(index > -1){
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
  }

  updateDiagramsForUnhoveredFeature([featureProperties]) {

    if(!this.regressionChart){
      return;
    }

    if(! this.filterHelperService.featureIsCurrentlySelected(featureProperties[window.__env.FEATURE_ID_PROPERTY_NAME])){
      // highlight the corresponding bar diagram item
      var index = -1;
      for(var i=0; i<this.regressionOption.series[0].data.length; i++){
        if(this.regressionOption.series[0].data[i].name == featureProperties[window.__env.FEATURE_NAME_PROPERTY_NAME]){
          index = i;
          break;
        }
      }

      if(index > -1){
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
  }



  getAllIndicatorPropertiesSortedBySpatialUnitFeatureName(){
    for(var i=0; i<this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.length; i++){
        // make object to hold indicatorName, max value and average value
        this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorProperties.sort(function(a, b) {
          // a and b are arrays of indicatorProperties for all features of the selected spatialUnit. We sort them by their property "spatialUnitFeatureName"

            var nameA = a[window.__env.FEATURE_NAME_PROPERTY_NAME].toUpperCase(); // ignore upper and lowercase
            var nameB = b[window.__env.FEATURE_NAME_PROPERTY_NAME].toUpperCase(); // ignore upper and lowercase
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
  };
 
  getPropertiesForIndicatorName(indicatorName){
    for (var [index, indicator] of this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.entries()){
      if(indicator.indicatorMetadata.indicatorName == indicatorName){
        
        return indicator.indicatorProperties;
      }
    }
  };

  getColor(featureName){

    var color;

    for (let index=0; index<this.indicatorMetadataAndGeoJSON.geoJSON.features.length; index++){
      let feature = this.indicatorMetadataAndGeoJSON.geoJSON.features[index];
      if (feature.properties[window.__env.FEATURE_NAME_PROPERTY_NAME] == featureName){
        color = this.diagramHelperService.getColorForFeature(feature, this.indicatorMetadataAndGeoJSON, this.indicatorPropertyName, this.defaultBrew, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.isMeasureOfValueChecked, this.measureOfValue);
        break;
      }
    }

    return color;
  };
 
  mapRegressionData(indicatorPropertiesArray, timestamp, map, axisValueName){

    for (const indicatorPropertiesEntry of indicatorPropertiesArray) {
      let featureName = indicatorPropertiesEntry[window.__env.FEATURE_NAME_PROPERTY_NAME];
      let indicatorValue;

      if (this.dataExchangeService.indicatorValueIsNoData(indicatorPropertiesEntry[this.DATE_PREFIX + timestamp])){
        indicatorValue = null;
      }
      else{
        indicatorValue = this.dataExchangeService.getIndicatorValue_asNumber(indicatorPropertiesEntry[this.DATE_PREFIX + timestamp]);
      }

      if(map.has(featureName)){
        let oldObject = map.get(featureName);
        oldObject[axisValueName] = indicatorValue;
        map.set(featureName, oldObject);
      }
      else{
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
  
  buildDataArrayForSelectedIndicators(){
    this.data = new Array();
    this.dataWithLabels = new Array();

    for (var [index, indicator] of this.diagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.entries()){
      if(indicator.indicatorMetadata.indicatorName == this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName){
        this.diagramHelperService.fetchIndicatorPropertiesIfNotExists(index);
      }

      if(indicator.indicatorMetadata.indicatorName == this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName){
        this.diagramHelperService.fetchIndicatorPropertiesIfNotExists(index);
      }
    }

    // both await
    setTimeout(() => {
      var indicatorPropertiesArrayForXAxis = this.getPropertiesForIndicatorName(this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName);
      var indicatorPropertiesArrayForYAxis = this.getPropertiesForIndicatorName(this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName);

      // hier indicatorPropertiesArrayForXAxis and ...YAxis undefined, look getPropertiesForIndicatorName

      if(this.filterHelperService.completelyRemoveFilteredFeaturesFromDisplay && this.filterHelperService.filteredIndicatorFeatureIds.size > 0){
        indicatorPropertiesArrayForXAxis = indicatorPropertiesArrayForXAxis.filter(featureProperties => ! this.filterHelperService.featureIsCurrentlyFiltered(featureProperties[window.__env.FEATURE_ID_PROPERTY_NAME]));
        indicatorPropertiesArrayForYAxis = indicatorPropertiesArrayForYAxis.filter(featureProperties => ! this.filterHelperService.featureIsCurrentlyFiltered(featureProperties[window.__env.FEATURE_ID_PROPERTY_NAME]));						
      }

      var timestamp_xAxis = this.selection.selectedIndicatorForXAxis.selectedDate;
      var timestamp_yAxis = this.selection.selectedIndicatorForYAxis.selectedDate;

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
      let xAxisName = "xValue";
      let yAxisName = "yValue";
      let dataCandidateMap = this.mapRegressionData(indicatorPropertiesArrayForXAxis, timestamp_xAxis, new Map(), xAxisName);
      dataCandidateMap = this.mapRegressionData(indicatorPropertiesArrayForYAxis, timestamp_yAxis, dataCandidateMap, yAxisName);

      // now iterate over map and identify those objects that have both indicator axis values set
      // put those into resulting lists 

      dataCandidateMap.forEach((regressionObject, key, map) => {
        // this.data.push([xAxisDataElement, yAxisDataElement])
        if (regressionObject[xAxisName] && regressionObject[yAxisName]){
          this.data.push([regressionObject[xAxisName], regressionObject[yAxisName]]);

          regressionObject.value = [regressionObject[xAxisName], regressionObject[yAxisName]];

          this.dataWithLabels.push(
            regressionObject
          );
        }
      });
    },1000);

  };

  //Source: http://stevegardner.net/2012/06/11/javascript-code-to-calculate-the-pearson-correlation-coefficient/
  
  getPearsonCorrelation(x, y) {
    var shortestArrayLength = 0;

    if(x.length == y.length) {
        shortestArrayLength = x.length;
    } else if(x.length > y.length) {
        shortestArrayLength = y.length;
        console.error('x has more items in it, the last ' + (x.length - shortestArrayLength) + ' item(s) will be ignored');
    } else {
        shortestArrayLength = x.length;
        console.error('y has more items in it, the last ' + (y.length - shortestArrayLength) + ' item(s) will be ignored');
    }

    var x_numeric:any[] = [];
    var y_numeric:any[] = [];
    var xy:any[] = [];
    var x2:any[] = [];
    var y2:any[] = [];

    for(var i=0; i<shortestArrayLength; i++) {

      if(x[i] && y[i]){
        x_numeric.push(x[i]);
        y_numeric.push(y[i]);
        xy.push(x[i] * y[i]);
        x2.push(x[i] * x[i]);
        y2.push(y[i] * y[i]);
      }
    }

    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_x2 = 0;
    var sum_y2 = 0;

    for(var i=0; i< x_numeric.length; i++) {
        sum_x += x_numeric[i];
        sum_y += y_numeric[i];
        sum_xy += xy[i];
        sum_x2 += x2[i];
        sum_y2 += y2[i];
    }

    var step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
    var step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
    var step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
    var step4 = Math.sqrt(step2 * step3);
    var answer = step1 / step4;

    return Number(+answer.toFixed(2));
  }

  calculatePearsonCorrelation(data){
    // data is an array of arrays containing the pairs of [x, y]

    var xArray = new Array();
    var yArray = new Array();

    data.forEach(function(xyPair) {
      xArray.push(xyPair[0]);
      yArray.push(xyPair[1]);
    });

    return this.getPearsonCorrelation(xArray, yArray);
  }

  onChangeSelectedIndicators(){

    if(this.selection.selectedIndicatorForXAxis){
      this.selection.selectedIndicatorForXAxis_backup = this.selection.selectedIndicatorForXAxis;
    }
    else if (this.selection.selectedIndicatorForXAxis_backup){
      this.selection.selectedIndicatorForXAxis = this.selection.selectedIndicatorForXAxis_backup;
    }

    if(this.selection.selectedIndicatorForYAxis){
      this.selection.selectedIndicatorForYAxis_backup = this.selection.selectedIndicatorForYAxis;
    }
    else if (this.selection.selectedIndicatorForYAxis_backup){
      this.selection.selectedIndicatorForYAxis = this.selection.selectedIndicatorForYAxis_backup;
    }

    if(this.selection.selectedIndicatorForXAxis && this.selection.selectedIndicatorForYAxis){

      this.eventsRegistered = false;

      if(!this.regressionChart)
        this.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
      else{
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

        let data = this.data;

        data.sort(function(a, b) {
            return a[0] - b[0];
        });

        this.correlation = this.calculatePearsonCorrelation(data);

        this.linearRegression = ecStat.regression('linear', data,1);

        let titlePrefix = this.exchangeData.enableScatterPlotRegression ? 'Lineare Regression - ' : 'Streudiagramm - ';
        let dataViewTitle =  this.exchangeData.enableScatterPlotRegression ? 'Datenansicht - lineare Regression' : 'Datenansicht - Streudiagramm';

        this.regressionOption = {
          grid: {
            left: '10%',
            top: 10,
            right: '5%',
            bottom: 55,
            containLabel: true
          },
            title: {
                text: titlePrefix + this.spatialUnitName + ' - ' + this.date,
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
                          if(!(params && params.value && params.value[0] && params.value[1])){
                            return "";
                          }
                            var string = "" + params.name + "<br/>";

                            string += this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName + ": " + this.dataExchangeService.getIndicatorValue_asFormattedText(params.value[0]) + " [" + this.selection.selectedIndicatorForXAxis.indicatorMetadata.unit + "]<br/>";
                            string += this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName + ": " + this.dataExchangeService.getIndicatorValue_asFormattedText(params.value[1]) + " [" + this.selection.selectedIndicatorForYAxis.indicatorMetadata.unit + "]<br/>";
                            return string;
                          }
            },
            xAxis: {
                name: this.dataExchangeService.formatIndicatorNameForLabel(this.selection.selectedIndicatorForXAxis.indicatorMetadata.indicatorName + " - " + this.selection.selectedIndicatorForXAxis.selectedDate + " [" + this.selection.selectedIndicatorForXAxis.indicatorMetadata.unit + "]", 100),
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
                name: this.dataExchangeService.formatIndicatorNameForLabel(this.selection.selectedIndicatorForYAxis.indicatorMetadata.indicatorName + " - " + this.selection.selectedIndicatorForYAxis.selectedDate + " [" + this.selection.selectedIndicatorForYAxis.indicatorMetadata.unit + "]", 75),
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
                show : true,
                right: '15',
                feature : {
                    // mark : {show: true},
                    dataView : {show: this.exchangeData.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: [dataViewTitle, 'schlie&szlig;en', 'refresh'], optionToContent: (opt) => {

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

                    // has properties "name" and "value"
                    // value: [Number(xAxisDataElement.toFixed(4)), Number(yAxisDataElement.toFixed(4))]
                    var scatterSeries = opt.series[0].data;
                    var lineSeries;
                    
                    if (this.exchangeData.enableScatterPlotRegression) {
                      lineSeries = opt.series[1].data;
                    }

                    var dataTableId = "regressionDataTable";
                    var tableExportName = opt.title[0].text + " - Scatter Table";

                    var htmlString = this.exchangeData.enableScatterPlotRegression
                            ? 
                            "<p>Data View enth&auml;lt zwei nachstehende Tabellen, die Tabelle der Datenpunkte des Streudiagramms und die Tabelle der Punkte der Regressionsgeraden.</p><br/>"
                            :
                            "<p>Data View enth&auml;lt die Tabelle der Datenpunkte des Streudiagramms.</p><br/>";
                    htmlString += '<h4>Scatter Plot Tabelle</h4>';
                      htmlString += '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
                      htmlString += "<thead>";
                      htmlString += "<tr>";
                      htmlString += "<th style='text-align:center;'>Feature-Name</th>";
                      htmlString += "<th style='text-align:center;'>" + opt.xAxis[0].name + "</th>";
                      htmlString += "<th style='text-align:center;'>" + opt.yAxis[0].name + "</th>";

                      htmlString += "</tr>";
                      htmlString += "</thead>";

                      htmlString += "<tbody>";

                      for (var j=0; j<scatterSeries.length; j++){
                        htmlString += "<tr>";
                        htmlString += "<td>" + scatterSeries[j].name + "</td>";

                        htmlString += "<td>" + this.dataExchangeService.getIndicatorValue_asNumber(scatterSeries[j].value[0]) + "</td>";
                        htmlString += "<td>" + this.dataExchangeService.getIndicatorValue_asNumber(scatterSeries[j].value[1]) + "</td>";
                        htmlString += "</tr>";
                      }

                      htmlString += "</tbody>";
                      htmlString += "</table>";

                      let lineTableId;
                      let lineTableExportName;

                      if (this.exchangeData.enableScatterPlotRegression) {

                        lineTableId = "lineDataTable";
                        lineTableExportName = opt.title[0].text + " - Line Table";

                        htmlString += "<br/><h4>Referenzpunkte der Regressionsgraden '" + this.linearRegression.expression + "'</h4>";

                        htmlString += '<table id="' + lineTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
                        htmlString += "<thead>";
                        htmlString += "<tr>";
                        htmlString += "<th style='text-align:center;'>X</th>";
                        htmlString += "<th style='text-align:center;'>Y</th>";
                        htmlString += "</tr>";
                        htmlString += "</thead>";

                        htmlString += "<tbody>";
                      
                        for (var j=0; j<lineSeries.length; j++){
                          htmlString += "<tr>";
                          htmlString += "<td>" + this.dataExchangeService.getIndicatorValue_asNumber(lineSeries[j][0]) + "</td>";
                          htmlString += "<td>" + this.dataExchangeService.getIndicatorValue_asNumber(lineSeries[j][1]) + "</td>";
                          htmlString += "</tr>";
                        }
                        
                        htmlString += "</tbody>";
                        htmlString += "</table>";
                      }	

                      this.broadcastService.broadcast("AppendExportButtonsForTable", [dataTableId, tableExportName]);

                      if (this.exchangeData.enableScatterPlotRegression) {
                        this.broadcastService.broadcast("AppendExportButtonsForTable", [lineTableId, lineTableExportName]);
                      }
                      
                      return htmlString;
                    }},
                    restore : {show: false, title: "Erneuern"},
                    saveAsImage : {show: true, title: "Export", pixelRatio: 4}
                }
            },
            series: [{
                name: "scatter",
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
                  borderColor: 'black'
                },
                emphasis: {
                  itemStyle: {
                    borderWidth: 4,
                    borderColor: this.defaultColorForClickedFeatures
                  }
                },
                data: this.dataWithLabels
            }
        ]
        };

        if (this.exchangeData.enableScatterPlotRegression) {
          this.regressionOption.series.push(
            {
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
              }
          )
        }

        this.regressionChart.setOption(this.regressionOption);

        // await
        this.regressionChart.hideLoading();
        setTimeout(() => {
          this.regressionChart.resize();
        }, 350);

        this.registerEventsIfNecessary();

        this.broadcastService.broadcast("preserveHighlightedFeatures");
        
      },1500);
    }
  };

  registerEventsIfNecessary(){
    if(!this.eventsRegistered){
      // when hovering over elements of the chart then highlight them in the map.
      this.regressionChart.on('mouseOver', (params) => {
        // this.userHoveresOverItem = true;
        var spatialFeatureName = params.data.name;
        // console.log(spatialFeatureName);
        if(spatialFeatureName){
          this.broadcastService.broadcast("highlightFeatureOnMap", [spatialFeatureName]);
        }

      });

      this.regressionChart.on('mouseOut', (params) => {
        // this.userHoveresOverItem = false;

        var spatialFeatureName = params.data.name;
        // console.log(spatialFeatureName);
        if(spatialFeatureName){
          this.broadcastService.broadcast("unhighlightFeatureOnMap", [spatialFeatureName]);
        }										
      });

      this.regressionChart.on('click', (params) => {
        var spatialFeatureName = params.data.name;
        // console.log(spatialFeatureName);
        if(spatialFeatureName){
          this.broadcastService.broadcast("switchHighlightFeatureOnMap", [spatialFeatureName]);
        }
        
      });

      this.eventsRegistered = true;
    }
  };

  onChangeEnableScatterPlotRegression(){
    this.onChangeSelectedIndicators();
  }
}
