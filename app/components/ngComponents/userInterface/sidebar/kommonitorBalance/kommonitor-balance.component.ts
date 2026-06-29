import { Component, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { RangeFilterStateService } from 'services/range-filter-state-service/range-filter-state.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { MapService } from 'services/map-service/map.service';
import * as jStat from 'jstat';
import * as noUiSlider from 'nouislider';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Component({
  selector: 'app-kommonitor-balance',
  templateUrl: './kommonitor-balance.component.html',
  styleUrls: ['./kommonitor-balance.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ExpandableBoxComponent]
})
export class KommonitorBalanceComponent implements OnInit {

  constructor(
    protected rangeFilterState: RangeFilterStateService,
    protected chartDisplayState: ChartDisplayStateService,
    private indicatorValueService: IndicatorValueService,
    private selectionState: SelectionStateService,
    private broadcastService: BroadcastService,
    private filterHelperService: FilterHelperService,
    private mapService: MapService,
    private diagramHelperService: DiagramHelperServiceService,
    protected envConfigService: EnvConfigService
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

  ngOnInit(): void {

    this.setupSlider();

    this.broadcastService.currentBroadcastMsg.subscribe(res => {
      const msg = res.msg;
      const values:any = res.values;

      switch (msg) {
        case BroadcastMessage.UpdateBalanceSlider: {
            // hier war mal ein 1000 timeout
            this.setupRangeSliderForBalance(values);
        } break;
        case BroadcastMessage.DisableBalance: {
          this.disableBalance();
        } break;
      }
    });
  }


  INDICATOR_DATE_PREFIX  = this.envConfigService.indicatorDatePrefix;

  numberOfDecimals = this.envConfigService.numberOfDecimals;

  targetDate;
  targetIndicatorProperty;
  rangeSliderForBalance;
  datesAsMs;

  trendChart_allFeatures;
  trendAnalysis_allFeatures;
  trendOption;

  someRange;

  balanceSlider;
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

  months = [
    'Januar',
    'Fabruar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember'
  ];
  
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
    this.balanceSlider = document.getElementById('rangeSlider');
    noUiSlider.create(this.balanceSlider, this.config);
  }
  
  trendConfig_allFeatures = {
    showMinMax: true,
    showCompleteTimeseries: true,
    trendComputationType: "linear"
  };
 
  disableBalance() {
    this.chartDisplayState.isBalanceChecked = false;
    if(this.balanceSlider){
      this.createNewBalanceInstance();
    }
  }
						
  onChangeUseBalance(){

    if(this.chartDisplayState.isMeasureOfValueChecked){
      this.chartDisplayState.isMeasureOfValueChecked = false;
    }

    let indicatorMetadataAndGeoJSON;

    if(this.chartDisplayState.isBalanceChecked){
      this.chartDisplayState.isMeasureOfValueChecked = false;
      this.envConfigService.classifyUsingWholeTimeseries = false;
      this.balanceSlider.noUiSlider.enable();

      // disable DateSlider / picker on map
      this.mapService.setDateSliderValues({disabled: true});
      this.selectionState.disableIndicatorDatePicker = true;

      if(!this.chartDisplayState.indicatorAndMetadataAsBalance){
        this.chartDisplayState.indicatorAndMetadataAsBalance = jQuery.extend(true, {}, this.selectionState.selectedIndicator);
        
        const indicatorType = this.selectionState.selectedIndicator.indicatorType;
        if(indicatorType.includes("ABSOLUTE")){
          this.chartDisplayState.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_ABSOLUTE";
        }
        else if(indicatorType.includes("RELATIVE")){
          this.chartDisplayState.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_RELATIVE";
        }
        else if(indicatorType.includes("STANDARDIZED")){
          this.chartDisplayState.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_STANDARDIZED";
        }

      }
      const data = this.getFormatedSliderReturn();
      this.computeAndSetBalance(data);
      setTimeout(() => {
      
        this.updateTrendChart(this.selectionState.selectedIndicator, data);	
      });
      indicatorMetadataAndGeoJSON = this.chartDisplayState.indicatorAndMetadataAsBalance;
      // kommonitorMapService.replaceIndicatorGeoJSON(this.exchangeData.indicatorAndMetadataAsBalance, this.selectionState.selectedSpatialUnit.spatialUnitLevel, this.targetDate, true);
    }
    else{
      
      this.balanceSlider.noUiSlider.disable();
      
      // reanebalbe DateSlider on map
      this.mapService.setDateSliderValues({disabled: false});
      indicatorMetadataAndGeoJSON = this.selectionState.selectedIndicator;
      // kommonitorMapService.replaceIndicatorGeoJSON(this.selectionState.selectedIndicator, this.selectionState.selectedSpatialUnit.spatialUnitLevel, this.targetDate, true);
    }
    // $rootScope.$broadcast("updateIndicatorValueRangeFilter", this.targetDate, indicatorMetadataAndGeoJSON);
    // do not replace dataset directly, but check if any filter can be applied when changing balance mode for the current dataset
    this.filterHelperService.filterAndReplaceDataset();
  }

            // hier onChangeUseBalance (1) -> filterAndReplaceDataset (2 new) -> replaceIndicatorGeoJSON -> replaceIndicatorAsGeoJSON (replaceIndi...) 
             // --> da wird dynamicBrew auf undefined gesetzt, und scheinbar nicht neu definiert
             // --> auskommentiert, bringt nix, ist scheinbar auch vorher nicht gesetzt, to check, wo und WANN wird das definiert?!

             // setupDynamicIndicatorBrew


						getFromDate_asPropertyString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							const fromDate = new Date(this.datesAsMs[datePeriodSliderData.from]);

							let fromDateAsPropertyString = this.makePropertyString(fromDate);
							const fromDateAsString = this.makeDateString(fromDate);
							if(this.chartDisplayState.indicatorAndMetadataAsBalance && !this.chartDisplayState.indicatorAndMetadataAsBalance.applicableDates.includes(fromDateAsString)){
								fromDateAsPropertyString = this.snapToNearestUpperDate(fromDate, this.chartDisplayState.indicatorAndMetadataAsBalance.applicableDates);
							}

							return fromDateAsPropertyString;
						}

						getFromDate_asDateString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							const fromDate = new Date(this.datesAsMs[datePeriodSliderData.from]);

							const fromDateAsString = this.makeDateString(fromDate);

							return fromDateAsString;
						}

						getToDate_asPropertyString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							const toDate = new Date(this.datesAsMs[datePeriodSliderData.to]);

							let toDateAsPropertyString = this.makePropertyString(toDate);
							const toDateAsString = this.makeDateString(toDate);
							if(this.chartDisplayState.indicatorAndMetadataAsBalance && !this.chartDisplayState.indicatorAndMetadataAsBalance.applicableDates.includes(toDateAsString)){
								toDateAsPropertyString = this.snapToNearestLowerDate(toDate, this.chartDisplayState.indicatorAndMetadataAsBalance.applicableDates);
							}

							return toDateAsPropertyString;
						}

						getToDate_asDateString(datePeriodSliderData){
							// data.from and data.to are index values, not the actual dates! (because we use "values" for rangeSlider)
							const toDate = new Date(this.datesAsMs[datePeriodSliderData.to]);

							const toDateAsString = this.makeDateString(toDate);

							return toDateAsString;
						}

						updateTrendChart(indicatorMetadata, datePeriodSliderData){

							const fromDateAsPropertyString = this.getFromDate_asPropertyString(datePeriodSliderData);
							const toDateAsPropertyString = this.getToDate_asPropertyString(datePeriodSliderData);
							const fromDateString = this.getFromDate_asDateString(datePeriodSliderData);
							const fromDate_date = new Date(fromDateString);
							const toDateString = this.getToDate_asDateString(datePeriodSliderData);
          					const toDate_date = new Date(toDateString);  

							// based on prepared DOM, initialize echarts instance
							if (!this.trendChart_allFeatures)
								this.trendChart_allFeatures = echarts.init(document.getElementById('trendDiagram_allFeatures'));
							else {
								// explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
								this.trendChart_allFeatures.dispose();
								this.trendChart_allFeatures = echarts.init(document.getElementById('trendDiagram_allFeatures'));
							}

							// use configuration item and data specified to show chart
							this.trendOption = this.diagramHelperService.makeTrendChartOptions_forAllFeatures(indicatorMetadata, fromDateAsPropertyString, toDateAsPropertyString, this.trendConfig_allFeatures.showMinMax, this.trendConfig_allFeatures.showCompleteTimeseries, this.trendConfig_allFeatures.trendComputationType, this.envConfigService.enableBilanceTrend, true);
							this.trendChart_allFeatures.setOption(this.trendOption);

							this.trendChart_allFeatures.hideLoading();
							setTimeout( () => {
								this.trendChart_allFeatures.resize();
							}, 350);

							let trendData:any[] = [];
							let timeseriesData; 
							timeseriesData = this.trendOption.series[0].data;

							if(! this.trendConfig_allFeatures.showCompleteTimeseries){
								for (let index = 0; index < timeseriesData.length; index++) {
									const dateCandidate = new Date(indicatorMetadata.applicableDates[index]);
									if(dateCandidate >= fromDate_date && dateCandidate <= toDate_date){
										trendData.push(timeseriesData[index]);
									}            
								}
							}
							else{
								trendData = timeseriesData;
							}

							

							const balanceValue = this.getIndicatorValue_asFormattedText(trendData[trendData.length - 1] - trendData[0]);
							const balanceValue_numeric = this.getIndicatorValue_asNumber(trendData[trendData.length - 1] - trendData[0]);
							let trendValue = "";
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
								min: this.getIndicatorValue_asFormattedText(jStat.min(trendData)),
								max: this.getIndicatorValue_asFormattedText(jStat.max(trendData)),
								deviation: this.getIndicatorValue_asFormattedText(jStat.stdev(trendData)),
								variance: this.getIndicatorValue_asFormattedText(jStat.variance(trendData)),
								mean: this.getIndicatorValue_asFormattedText(jStat.mean(trendData)),
								median: this.getIndicatorValue_asFormattedText(jStat.median(trendData)),
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
							const date = new Date(dateAsMs);
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

          for (let index=0; index < indicatorDates.length; index++){
            // year-month-day
            const dateComponents = indicatorDates[index].split("-");
            this.datesAsMs.push(this.dateToTS(new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]))));
          }
          return this.datesAsMs;
        }

        getFormatedSliderReturn() {

          const data = this.balanceSlider.noUiSlider.get(true);
          
          return {
            from: Math.round(data[0]),
            to: Math.round(data[1])
          };
        }

        dateStringToMs(dateStr) {
          const parts = dateStr.split(' ');
          // get timezoneOffset w/o daylight saving time by referencing a specific date
          const offset = new Date('November 1, 2000 00:00:00').getTimezoneOffset()*60*1000;
          
          const year = parts[2];
          let month:any = this.months.indexOf(parts[1])+1;
          let day:any = parts[0].replace('.','');

          if(month<10)
            month = '0'+month;
          
          if(day<10)
            day = '0'+day;

          const tms = new Date(`${year}-${month}-${day}T00:00:00Z`).getTime();
          return tms+offset;
        }

        createNewBalanceInstance(){
          this.datesAsMs = this.createDatesFromIndicatorDates(this.selectionState.selectedIndicator.applicableDates);

          this.balanceSlider.noUiSlider.updateOptions({
            range: {
                'min': 0, // index from
                'max': this.datesAsMs.length-1 // index to
            },
            start: [ this.tsToDateString(this.datesAsMs[1]), this.tsToDateString(this.datesAsMs[this.datesAsMs.length-2])],
            step: 1,
            tooltips: true,
            format: {
              to: (value) => {
                return this.tsToDateString(this.datesAsMs[Math.round(value)]);  
              },
              from: (value) => {
                return this.datesAsMs.indexOf(this.dateStringToMs(value));
              }
            },
            pips: {
              mode: 'range',
              density: 25,
              format: {
                to: (value) => {
                  return this.tsToDateString(this.datesAsMs[Math.round(value)]);
                },
                from: (value) => {
                  return this.datesAsMs.indexOf(this.dateStringToMs(value));
                }
              }
            }
          });
       
          // event type set to "end" because of constant calls of type "set" when slider is re-initiated by changing indicators
          this.balanceSlider.noUiSlider.on('end', () => {
            this.onChangeBalanceRange(this.getFormatedSliderReturn());
          });

          if (!this.chartDisplayState.isBalanceChecked){
            // deactivate balance slider
            this.balanceSlider.noUiSlider.disable();
          }
        }

        removeOldInstance(){
          this.rangeFilterState.rangeFilterData = undefined;
          this.rangeSliderForBalance.destroy();
          this.chartDisplayState.indicatorAndMetadataAsBalance = undefined;

          const domNode = document.getElementById("rangeSliderForBalance");

          if(domNode) {
            while (domNode.hasChildNodes()) {
              domNode.removeChild(domNode.lastChild!);
            }
          }
        }

        setupRangeSliderForBalance([date]){
          this.targetDate = date;
          this.targetIndicatorProperty = this.INDICATOR_DATE_PREFIX + date;

          if(!this.balanceSlider){
            // create new instance
            this.createNewBalanceInstance();
          } else {

            if(this.chartDisplayState.indicatorAndMetadataAsBalance){
              if (this.selectionState.selectedIndicator.indicatorName != this.chartDisplayState.indicatorAndMetadataAsBalance.indicatorName){
                //this.removeOldInstance();

                // create new instance
                this.createNewBalanceInstance();
              }
            }
            else{
              //this.removeOldInstance();
              this.createNewBalanceInstance();
            }
          }

        };

        onChangeBalanceRange(data) {
          // create balance GeoJSON and broadcast "replaceIndicatorAsGeoJSON"
          // Called every time handle position is changed

          this.computeAndSetBalance(data);
        
          setTimeout(() => {
            
            this.updateTrendChart(this.selectionState.selectedIndicator, data);	
          });
          // hier we must call replaceIndicatorGeoJSON because the feature vaues have changed. calling restyle will not work as it only restyles the old numbers
          this.mapService.replaceIndicatorGeoJSON(this.chartDisplayState.indicatorAndMetadataAsBalance, this.selectionState.selectedSpatialUnit.spatialUnitLevel, this.targetDate, true);
        };

        computeAndSetBalance(data){

          const fromDateAsPropertyString = this.getFromDate_asPropertyString(data);
          const fromDateAsDateString = this.getFromDate_asDateString(data);
          const toDateAsPropertyString = this.getToDate_asPropertyString(data);
          const toDateAsDateString = this.getToDate_asDateString(data);

          // make another copy of selectedIndicator to ensure that feature order matches each other
          this.chartDisplayState.indicatorAndMetadataAsBalance = jQuery.extend(true, {}, this.selectionState.selectedIndicator);
// bis hier passt, wo aber replaceIndocatorASGeojson etc... wie in demo?
          const indicatorType = this.selectionState.selectedIndicator.indicatorType;
          if(indicatorType.includes("ABSOLUTE")){
            this.chartDisplayState.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_ABSOLUTE";
          }
          else if(indicatorType.includes("RELATIVE")){
            this.chartDisplayState.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_RELATIVE";
          }
          else if(indicatorType.includes("STANDARDIZED")){
            this.chartDisplayState.indicatorAndMetadataAsBalance.indicatorType = "DYNAMIC_STANDARDIZED";
          }

          // set value of selected target property with the computed balance between toDate - FromDate
          for (let index=0; index < this.selectionState.selectedIndicator.geoJSON.features.length; index++){

            const toDateValue = this.getIndicatorValue_asNumber(this.selectionState.selectedIndicator.geoJSON.features[index].properties[toDateAsPropertyString]);
            const fromDateValue = this.getIndicatorValue_asNumber(this.selectionState.selectedIndicator.geoJSON.features[index].properties[fromDateAsPropertyString]);

            this.chartDisplayState.indicatorAndMetadataAsBalance.geoJSON.features[index].properties[this.targetIndicatorProperty] = this.getIndicatorValue_asNumber(toDateValue - fromDateValue);
          }
          this.chartDisplayState.indicatorAndMetadataAsBalance['fromDate'] = this.dateToDateString(new Date(fromDateAsDateString));
          this.chartDisplayState.indicatorAndMetadataAsBalance['toDate'] = this.dateToDateString(new Date(toDateAsDateString));
        };

        snapToNearestLowerDate(toDate, applicableDates){
          const earliestDateStringComponents = applicableDates[0].split("-");

          const earliestDate = new Date(Number(earliestDateStringComponents[0]), Number(earliestDateStringComponents[1]) - 1, Number(earliestDateStringComponents[2]));
          const dateCandidate = toDate;

          // we need to find the next lower applicableDate
          // decrement day by one and check, otherwise decrement month and/or year
          dateCandidate.setDate(dateCandidate.getDate() - 1);

          let targetDatePropertyString;

          while(dateCandidate > earliestDate){
            const dateCandidateString = this.makeDateString(dateCandidate);
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
          const lastDateStringComponents = applicableDates[applicableDates.length -1].split("-");

          const latestDate = new Date(Number(lastDateStringComponents[0]), Number(lastDateStringComponents[1]) - 1, Number(lastDateStringComponents[2]));
          const dateCandidate = fromDate;

          // we need to find the next upper applicableDate
          // increment day by one and check, otherwise increment month and/or year
          dateCandidate.setDate(dateCandidate.getDate() + 1);

          let targetDatePropertyString;

          while(dateCandidate < latestDate){
            const dateCandidateString = this.makeDateString(dateCandidate);
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
          const year = date.getFullYear();
          const month = date.getMonth() + 1; // because month is from 0-11
          const day = date.getDate();

          // e.g. 2018-01-01
          let propertyString = year + "-";

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
          const dateString = this.makeDateString(date);
          return this.INDICATOR_DATE_PREFIX + dateString;
        };


        onChangeTrendConfig(){
          console.log(this.trendConfig_allFeatures.trendComputationType)
          const data = this.getFormatedSliderReturn();
            setTimeout(() => {
            
              this.updateTrendChart(this.selectionState.selectedIndicator, data);	
            });
        };

        onChangeEnableBilanceTrend(){
          const data = this.getFormatedSliderReturn();
            setTimeout(() => {
            
              this.updateTrendChart(this.selectionState.selectedIndicator, data);	
            });
        }

}
