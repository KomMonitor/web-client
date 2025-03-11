import { Component, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { MapService } from 'services/map-service/map.service';
import * as jStat from 'jstat';
import * as noUiSlider from 'nouislider';

@Component({
  selector: 'app-kommonitor-balance',
  templateUrl: './kommonitor-balance.component.html',
  styleUrls: ['./kommonitor-balance.component.css']
})
export class KommonitorBalanceComponent implements OnInit {

  exchangeData!: DataExchange;

  constructor(
    private dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    private filterHelperService: FilterHelperService,
    private mapService: MapService,
    private diagramHelperService: DiagramHelperServiceService
  ) {
    this.exchangeData = dataExchangeService.pipedData;
  }

  ngOnInit(): void {

    this.setupSlider();

    this.broadcastService.currentBroadcastMsg.subscribe(res => {
      let msg = res.msg;
      let values:any = res.values;

      switch (msg) {
        case 'updateBalanceSlider' : {

          this.setupRangeSliderForBalance(values);
        } break;
      }
    });
  }


  INDICATOR_DATE_PREFIX = window.__env.indicatorDatePrefix;

  numberOfDecimals = window.__env.numberOfDecimals;

  targetDate;
  targetIndicatorProperty;
  rangeSliderForBalance;
  datesAsMs;

  trendChart_allFeatures;
  trendAnalysis_allFeatures;
  trendOption;

  someRange;

  slider;
  config: any  = {
    behaviour: 'drag',
    connect: true,
    range: {
        'min': 0,
        'max': 100
    },
    start: [0,100],
    keyboard: true, 
    pips: {
      mode: 'range',
      density: 2,
      values: 4,
      stepped: true
    }
  }
  
 /*  {
    behaviour: 'drag',
    connect: true,
    start: [0,5],
    keyboard: true,  // same as [keyboard]="true"
    step: 0.1,
    pageSteps: 10,  // number of page steps, defaults to 10
    pips: {
      mode: 'count',
      density: 2,
      values: 6,
      stepped: true
    }
  } */

  setupSlider() {
    this.slider = document.getElementById('rangeSlider');
    noUiSlider.create(this.slider, this.config);
  }
  
  trendConfig_allFeatures = {
    showMinMax: true,
    showCompleteTimeseries: true,
    trendComputationType: "linear"
  };
 /*
						this.$on("DisableBalance", function (event) {
							this.exchangeData.isBalanceChecked = false;
							if(this.rangeSliderForBalance){
								this.rangeSliderForBalance.update({
										block: true
								});
							}

							// reanebalbe DateSlider on map
							$rootScope.$broadcast("EnableDateSlider");
						});

						this.$on("replaceBalancedIndicator", function (event) {
							if(this.exchangeData.isBalanceChecked){
								this.onChangeUseBalance();
							}
						});
*/  
						onChangeUseBalance(){

							if(this.exchangeData.isMeasureOfValueChecked){
								this.exchangeData.isMeasureOfValueChecked = false;
							}

							let indicatorMetadataAndGeoJSON;

							if(this.exchangeData.isBalanceChecked){
								this.exchangeData.isMeasureOfValueChecked = false;
								this.exchangeData.classifyUsingWholeTimeseries = false;
								this.slider.noUiSlider.enable();

								// disable DateSlider on map
                this.broadcastService.broadcast('DisableDateSlider')
								if(!this.exchangeData.indicatorAndMetadataAsBalance){
									this.exchangeData.indicatorAndMetadataAsBalance = jQuery.extend(true, {}, this.exchangeData.selectedIndicator);
									var indicatorType = this.exchangeData.selectedIndicator.indicatorType;
									if(indicatorType.includes("ABSOLUTE")){
										this.exchangeData.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_ABSOLUTE";
									}
									else if(indicatorType.includes("RELATIVE")){
										this.exchangeData.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_RELATIVE";
									}
									else if(indicatorType.includes("STANDARDIZED")){
										this.exchangeData.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_STANDARDIZED";
									}

								}
								var data = this.getFormatedSliderReturn();
								this.computeAndSetBalance(data);
								setTimeout(() => {
								
									this.updateTrendChart(this.exchangeData.selectedIndicator, data);	
								});
								indicatorMetadataAndGeoJSON = this.exchangeData.indicatorAndMetadataAsBalance;
								// kommonitorMapService.replaceIndicatorGeoJSON(this.exchangeData.indicatorAndMetadataAsBalance, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.targetDate, true);
							}
							else{
								
								this.slider.noUiSlider.disable();
                
								// reanebalbe DateSlider on map
                this.broadcastService.broadcast('EnableDateSlider');
								indicatorMetadataAndGeoJSON = this.exchangeData.selectedIndicator;
								// kommonitorMapService.replaceIndicatorGeoJSON(this.exchangeData.selectedIndicator, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.targetDate, true);
							}
							// $rootScope.$broadcast("updateIndicatorValueRangeFilter", this.targetDate, indicatorMetadataAndGeoJSON);
							// do not replace dataset directly, but check if any filter can be applied when changing balance mode for the current dataset
							this.filterHelperService.filterAndReplaceDataset();
						};


						getFromDate_asPropertyString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							var fromDate = new Date(this.datesAsMs[datePeriodSliderData.from]);

							var fromDateAsPropertyString = this.makePropertyString(fromDate);
							var fromDateAsString = this.makeDateString(fromDate);
							if(this.exchangeData.indicatorAndMetadataAsBalance && !this.exchangeData.indicatorAndMetadataAsBalance.applicableDates.includes(fromDateAsString)){
								fromDateAsPropertyString = this.snapToNearestUpperDate(fromDate, this.exchangeData.indicatorAndMetadataAsBalance.applicableDates);
							}

							return fromDateAsPropertyString;
						}

						getFromDate_asDateString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							var fromDate = new Date(this.datesAsMs[datePeriodSliderData.from]);

							var fromDateAsString = this.makeDateString(fromDate);

							return fromDateAsString;
						}

						getToDate_asPropertyString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							var toDate = new Date(this.datesAsMs[datePeriodSliderData.to]);

							var toDateAsPropertyString = this.makePropertyString(toDate);
							var toDateAsString = this.makeDateString(toDate);
							if(this.exchangeData.indicatorAndMetadataAsBalance && !this.exchangeData.indicatorAndMetadataAsBalance.applicableDates.includes(toDateAsString)){
								toDateAsPropertyString = this.snapToNearestLowerDate(toDate, this.exchangeData.indicatorAndMetadataAsBalance.applicableDates);
							}

							return toDateAsPropertyString;
						}

						getToDate_asDateString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							var toDate = new Date(this.datesAsMs[datePeriodSliderData.to]);

							var toDateAsString = this.makeDateString(toDate);

							return toDateAsString;
						}

						updateTrendChart(indicatorMetadata, datePeriodSliderData){
							

							var fromDateAsPropertyString = this.getFromDate_asPropertyString(datePeriodSliderData);
							var toDateAsPropertyString = this.getToDate_asPropertyString(datePeriodSliderData);
							var fromDateString = this.getFromDate_asDateString(datePeriodSliderData);
							var fromDate_date = new Date(fromDateString);
							var toDateString = this.getToDate_asDateString(datePeriodSliderData);
          					var toDate_date = new Date(toDateString);  

							// based on prepared DOM, initialize echarts instance
							if (!this.trendChart_allFeatures)
								this.trendChart_allFeatures = echarts.init(document.getElementById('trendDiagram_allFeatures'));
							else {
								// explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
								this.trendChart_allFeatures.dispose();
								this.trendChart_allFeatures = echarts.init(document.getElementById('trendDiagram_allFeatures'));
							}

							// use configuration item and data specified to show chart
							this.trendOption = this.diagramHelperService.makeTrendChartOptions_forAllFeatures(indicatorMetadata, fromDateAsPropertyString, toDateAsPropertyString, this.trendConfig_allFeatures.showMinMax, this.trendConfig_allFeatures.showCompleteTimeseries, this.trendConfig_allFeatures.trendComputationType, this.exchangeData.enableBilanceTrend);
							this.trendChart_allFeatures.setOption(this.trendOption);

							this.trendChart_allFeatures.hideLoading();
							setTimeout( () => {
								this.trendChart_allFeatures.resize();
							}, 350);

							var trendData:any[] = [];
							var timeseriesData; 
							timeseriesData = this.trendOption.series[0].data;

							if(! this.trendConfig_allFeatures.showCompleteTimeseries){
								for (let index = 0; index < timeseriesData.length; index++) {
									var dateCandidate = new Date(indicatorMetadata.applicableDates[index]);
									if(dateCandidate >= fromDate_date && dateCandidate <= toDate_date){
										trendData.push(timeseriesData[index]);
									}            
								}
							}
							else{
								trendData = timeseriesData;
							}

							

							var balanceValue = this.dataExchangeService.getIndicatorValue_asFormattedText(trendData[trendData.length - 1] - trendData[0]);
							var balanceValue_numeric = this.dataExchangeService.getIndicatorValue_asNumber(trendData[trendData.length - 1] - trendData[0]);
							var trendValue = "";
							if(Number(balanceValue_numeric) == 0){
								trendValue = "gleichbleibend";
							}
							else if(Number(balanceValue_numeric) > 0){
								trendValue = "steigend";
							}
							else {
								trendValue = "sinkend";
							}

							this.trendAnalysis_allFeatures = {
								min: this.dataExchangeService.getIndicatorValue_asFormattedText(jStat.min(trendData)),
								max: this.dataExchangeService.getIndicatorValue_asFormattedText(jStat.max(trendData)),
								deviation: this.dataExchangeService.getIndicatorValue_asFormattedText(jStat.stdev(trendData)),
								variance: this.dataExchangeService.getIndicatorValue_asFormattedText(jStat.variance(trendData)),
								mean: this.dataExchangeService.getIndicatorValue_asFormattedText(jStat.mean(trendData)),
								median: this.dataExchangeService.getIndicatorValue_asFormattedText(jStat.median(trendData)),
								balance: balanceValue,
								trend: trendValue
							};
							
						};
/*
						$(window).on('resize', function () {
	
							if (this.trendChart_allFeatures != null && this.trendChart_allFeatures != undefined) {
								this.trendChart_allFeatures.resize();
							}
						});

 */
						dateToTS (date) {
								return date.valueOf();
						}

						tsToDateString (dateAsMs) {
							var date = new Date(dateAsMs);
							// return date.getFullYear();

              return date.toLocaleDateString("de-DE", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
 
        dateToDateString (date) {


          // return date.getFullYear();

            return date.toLocaleDateString("de-DE", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        createDatesFromIndicatorDates(indicatorDates) {

          this.datesAsMs = [];

          for (var index=0; index < indicatorDates.length; index++){
            // year-month-day
            var dateComponents = indicatorDates[index].split("-");
            this.datesAsMs.push(this.dateToTS(new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]))));
          }
          return this.datesAsMs;
        }

        getFormatedSliderReturn() {

          let data = this.slider.noUiSlider.get(true);
          return {
            from: Math.round(data[0]),
            to: Math.round(data[1])
          };
        }

        createNewBalanceInstance(){
          this.datesAsMs = this.createDatesFromIndicatorDates(this.exchangeData.selectedIndicator.applicableDates);

          this.slider.noUiSlider.updateOptions({
            range: {
                'min': this.datesAsMs[0],
                'max': this.datesAsMs[this.datesAsMs.length-1]
            },
            start: [ this.datesAsMs[0], this.datesAsMs[this.datesAsMs.length-1]],
            pips: {
              mode: 'steps',
              density: 4,
              format: {
                to: this.tsToDateString
              }
            }
          });
        
          this.slider.noUiSlider.on('set', () => {
            this.onChangeBalanceRange(this.getFormatedSliderReturn());
          })

          if (!this.exchangeData.isBalanceChecked){
            // deactivate balance slider
            this.slider.noUiSlider.disable();
          }
        }

        removeOldInstance(){
          this.exchangeData.rangeFilterData = undefined;
          this.rangeSliderForBalance.destroy();
          this.exchangeData.indicatorAndMetadataAsBalance = undefined;

          var domNode = document.getElementById("rangeSliderForBalance");

          if(domNode) {
            while (domNode.hasChildNodes()) {
              domNode.removeChild(domNode.lastChild!);
            }
          }
        }

        setupRangeSliderForBalance([date]){
          this.targetDate = date;
          this.targetIndicatorProperty = this.INDICATOR_DATE_PREFIX + date;

          if(!this.rangeSliderForBalance){
            // create new instance
            this.createNewBalanceInstance();
          }
          else {

            if(this.exchangeData.indicatorAndMetadataAsBalance){
              if (this.exchangeData.selectedIndicator.indicatorName != this.exchangeData.indicatorAndMetadataAsBalance.indicatorName){
                this.removeOldInstance();

                // create new instance
                this.createNewBalanceInstance();
              }
            }
            else{
              this.removeOldInstance();
              this.createNewBalanceInstance();
            }

          }

        };

        onChangeBalanceRange (data) {
          // create balance GeoJSON and broadcast "replaceIndicatorAsGeoJSON"
          // Called every time handle position is changed
          this.computeAndSetBalance(data);
        
          setTimeout(() => {
            
            this.updateTrendChart(this.exchangeData.selectedIndicator, data);	
          });
          // we must call replaceIndicatorGeoJSON because the feature vaues have changed. calling restyle will not work as it only restyles the old numbers
          this.mapService.replaceIndicatorGeoJSON(this.exchangeData.indicatorAndMetadataAsBalance, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.targetDate, true);
        };

        computeAndSetBalance(data){

          var fromDateAsPropertyString = this.getFromDate_asPropertyString(data);
          var fromDateAsDateString = this.getFromDate_asDateString(data);
          var toDateAsPropertyString = this.getToDate_asPropertyString(data);
          var toDateAsDateString = this.getToDate_asDateString(data);

          // make another copy of selectedIndicator to ensure that feature order matches each other
          this.exchangeData.indicatorAndMetadataAsBalance = jQuery.extend(true, {}, this.exchangeData.selectedIndicator);

          var indicatorType = this.exchangeData.selectedIndicator.indicatorType;
          if(indicatorType.includes("ABSOLUTE")){
            this.exchangeData.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_ABSOLUTE";
          }
          else if(indicatorType.includes("RELATIVE")){
            this.exchangeData.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_RELATIVE";
          }
          else if(indicatorType.includes("STANDARDIZED")){
            this.exchangeData.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_STANDARDIZED";
          }

          // set value of selected target property with the computed balance between toDate - FromDate
          for (var index=0; index < this.exchangeData.selectedIndicator.geoJSON.features.length; index++){

            var toDateValue = this.dataExchangeService.getIndicatorValue_asNumber(this.exchangeData.selectedIndicator.geoJSON.features[index].properties[toDateAsPropertyString]);
            var fromDateValue = this.dataExchangeService.getIndicatorValue_asNumber(this.exchangeData.selectedIndicator.geoJSON.features[index].properties[fromDateAsPropertyString]);

            this.exchangeData.indicatorAndMetadataAsBalance.geoJSON.features[index].properties[this.targetIndicatorProperty] = this.dataExchangeService.getIndicatorValue_asNumber(toDateValue - fromDateValue);
          }
          this.exchangeData.indicatorAndMetadataAsBalance['fromDate'] = this.dateToDateString(new Date(fromDateAsDateString));
          this.exchangeData.indicatorAndMetadataAsBalance['toDate'] = this.dateToDateString(new Date(toDateAsDateString));
        };

        snapToNearestLowerDate(toDate, applicableDates){
          var earliestDateStringComponents = applicableDates[0].split("-");

          var earliestDate = new Date(Number(earliestDateStringComponents[0]), Number(earliestDateStringComponents[1]) - 1, Number(earliestDateStringComponents[2]));
          var dateCandidate = toDate;

          // we need to find the next lower applicableDate
          // decrement day by one and check, otherwise decrement month and/or year
          dateCandidate.setDate(dateCandidate.getDate() - 1);

          var targetDatePropertyString;

          while(dateCandidate > earliestDate){
            var dateCandidateString = this.makeDateString(dateCandidate);
            if (applicableDates.includes(dateCandidateString)){
              targetDatePropertyString = this.makePropertyString(dateCandidate);
              break;
            }
            //decrement by one day
            dateCandidate.setDate(dateCandidate.getDate() - 1);
          }

          if(!targetDatePropertyString)
            targetDatePropertyString = this.makePropertyString(earliestDate);

          return targetDatePropertyString;
        }

        snapToNearestUpperDate(fromDate, applicableDates){
          var lastDateStringComponents = applicableDates[applicableDates.length -1].split("-");

          var latestDate = new Date(Number(lastDateStringComponents[0]), Number(lastDateStringComponents[1]) - 1, Number(lastDateStringComponents[2]));
          var dateCandidate = fromDate;

          // we need to find the next upper applicableDate
          // increment day by one and check, otherwise increment month and/or year
          dateCandidate.setDate(dateCandidate.getDate() + 1);

          var targetDatePropertyString;

          while(dateCandidate < latestDate){
            var dateCandidateString = this.makeDateString(dateCandidate);
            if (applicableDates.includes(dateCandidateString)){
              targetDatePropertyString = this.makePropertyString(dateCandidate);
              break;
            }
            //increment by one day
            dateCandidate.setDate(dateCandidate.getDate() + 1);
          }

          if(!targetDatePropertyString)
            targetDatePropertyString = this.makePropertyString(latestDate);

          return targetDatePropertyString;
        }
  
        makeDateString(date){
          var year = date.getFullYear();
          var month = date.getMonth() + 1; // because month is from 0-11
          var day = date.getDate();

          // e.g. 2018-01-01
          var propertyString = year + "-";

          if(month < 10){
            propertyString += "0" + month + "-";
          }
          else{
            propertyString += month  + "-";
          }

          if(day < 10){
            propertyString += "0" + day;
          }
          else{
            propertyString += day;
          }

          return propertyString;
        };

        makePropertyString(date){
          var dateString = this.makeDateString(date);
          return this.INDICATOR_DATE_PREFIX + dateString;
        };


        onChangeTrendConfig(){
          var data = this.rangeSliderForBalance.result;
            setTimeout(() => {
            
              this.updateTrendChart(this.exchangeData.selectedIndicator, data);	
            });
        };

        onChangeEnableBilanceTrend(){
          var data = this.rangeSliderForBalance.result;
            setTimeout(() => {
            
              this.updateTrendChart(this.exchangeData.selectedIndicator, data);	
            });
        }

}
