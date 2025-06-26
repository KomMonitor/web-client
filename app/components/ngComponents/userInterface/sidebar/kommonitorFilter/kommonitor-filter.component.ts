import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { dualListInput, item } from 'components/ngComponents/customElements/dual-list-box/dual-list-box.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { MapService } from 'services/map-service/map.service';
import * as noUiSlider from 'nouislider';
import { GlobalFilterHelperService } from 'services/global-filter-helper-service/global-filter-helper.service';
import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';

@Component({
  selector: 'app-kommonitor-filter',
  templateUrl: './kommonitor-filter.component.html',
  styleUrls: ['./kommonitor-filter.component.css']
})
export class KommonitorFilterComponent implements OnInit, AfterViewInit{

  INDICATOR_DATE_PREFIX = window.__env.indicatorDatePrefix;
  /* kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
  kommonitorMapServiceInstance = kommonitorMapService;
  kommonitorFilterHelperServiceInstance = kommonitorFilterHelperService; */
  numberOfDecimals = window.__env.numberOfDecimals;

  // initialize any adminLTE box widgets
  // todo 
  // $('.box').boxWidget();

  kommonitorFilterModes = window.window.__env.filterModes;

  considerAllowedSpatialUnitsOfCurrentIndicator = true;
  loadingData = true;

  rangeSliderForFilter;
  valueRangeMinValue;
  valueRangeMaxValue;
  currentLowerFilterValue;
  currentHigherFilterValue;
  lowerFilterInputNotValid = false;
  higherFilterInputNotValid = false;
  indicatorMetadataAndGeoJSON;

  showManualSelectionSpatialFilter;
  showSelectionByFeatureSpatialFilter; 

  previouslySelectedIndicator:any;
  previouslySelectedSpatialUnit:any;

  inputLowerFilterValue;
  inputHigherFilterValue;

  //measureOfValue stuff
  movMinValue;
  movMaxValue;
  movMiddleValue;
  movStep;
  movRangeSlider;

  slider;
  measureSlider;
  sliderNormalConfig: any  = {
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
  };
  
  sliderSingleConfig: any  = {
    behaviour: 'drag',
    connect: true,
    range: {
        'min': 0,
        'max': 100
    },
    start: [50],
    keyboard: true, 
    pips: {
      mode: 'range',
      density: 2,
      values: 4,
      stepped: true
    }
  };

  // SPATIAL FILTER STUFF
  selectedSpatialUnitForFilter;
  selectedSpatialUnitIdForFilter;
  higherSpatialUnits;
  higherSpatialUnitFilterFeatureGeoJSON;
  reappliedFilter = false;

  selectionByFeatureSpatialFilterDuallistOptions:any = {
    items: [],
    selectedItems: []
  };
  reloadList = false;
  reloadManualList = false;

  manualSelectionSpatialFilterDuallistOptions:any = {
    items: [],
    selectedItems: []
  };              
  
  // Global filter
  globalFilters:any = undefined;

  inputNotValid = false;

  exchangeData:DataExchange;

  constructor(
    protected dataExchangeService: DataExchangeService,
    protected filterHelperService: FilterHelperService,
    private mapService: MapService,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    private globalFilterHelperService: GlobalFilterHelperService,
    private configStorageService:ConfigStorageService
  ) {
    this.exchangeData = this.dataExchangeService.pipedData;
  }


  ngOnInit(): void {
      this.broadcastService.currentBroadcastMsg.subscribe(result => {
        let msg = result.msg;
        let val:any = result.values;

        switch (msg) {
          case 'onChangeSelectedIndicator': {
            this.onOnChangeSelectedIndicator();
          } break;
          case 'replaceIndicatorAsGeoJSON': {
            this.replaceIndicatorAsGeoJSON(val);
          } break;
          case 'updateMeasureOfValueBar' :{
            this.updateMeasureOfValueBar(val);
          } break;
          case 'updateIndicatorValueRangeFilter' : {
            this.updateIndicatorValueRangeFilter(val);
          } break;
        }
      });
  }

  ngAfterViewInit(): void {
      

    this.slider = document.getElementById('filterRangeSlider');
    noUiSlider.create(this.slider, this.sliderNormalConfig);
    
    this.measureSlider = document.getElementById('measureOfValueSlider');
    noUiSlider.create(this.measureSlider, this.sliderSingleConfig);
    
    if(!this.globalFilters)
      this.loadGlobalFilters();
  }

  loadGlobalFilters() {
     this.configStorageService.getFilterConfig().subscribe({
      next: response => {
        console.log('Filter config loaded')
        this.globalFilters = response;
      },
      error: error => {
        console.error(error, "Error while getting filter config from config storage service.");
      }
    });
  }

  onChangeFilterSelection() {

    this.loadingData = true;
    this.globalFilterHelperService.applyFilterSelection(this.globalFilters.filter(e => e.checked===true));

    if(this.globalFilterHelperService.applicationFilter)
      this.dataExchangeService.fetchAllMetadata(this.globalFilterHelperService.applicationFilter);
    else
      this.dataExchangeService.fetchAllMetadata();

    this.broadcastService.broadcast("onGlobalFilterChange");
    setTimeout(() => {
      console.log('LIKEinitialMetadataLoadingCompleted broadcasted')
      this.broadcastService.broadcast("LIKEinitialMetadataLoadingCompleted");
    },1000)
  }

  globalFiltersActive() {
    if(this.globalFilters && !this.globalFilterHelperService.isFilterParamSet())
      return true;

    return false;
  }

  onUpdatedSelectedItems(items:any) {
    this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems = items;  
  }

  onUpdatedManualSelectedItems(items:any) {
    this.manualSelectionSpatialFilterDuallistOptions.selectedItems = items;  
  }

  isFilterModeActive(id) {
    // hier
    //return this.kommonitorFilterModes.indexOf(id) !== -1;
    return true;
  }


    setupSpatialUnitFilter(indicatorMetadataAndGeoJSON, spatialUnitName, date){
      
      this.loadingData = true;
      
      let allowedSpatialUnitIds = indicatorMetadataAndGeoJSON.applicableSpatialUnits.map(spatialUnitEntry => {									
        return spatialUnitEntry.spatialUnitId;									
      });
      
      this.higherSpatialUnits = JSON.parse(JSON.stringify(this.exchangeData.availableSpatialUnits));
      
      // only show those spatial units that are actually visible according to keycloak role
      // and associated to the current indicator as well
      for (let index = 0; index < this.higherSpatialUnits.length; index++) {
        const spatialUnitMetadata = this.higherSpatialUnits[index];
        
        // remove if it is not applicable for current indicator OR
        // remove if it is the currently displayed spatial unit to show only hierarchically higher spatial units
        if(this.considerAllowedSpatialUnitsOfCurrentIndicator && ! allowedSpatialUnitIds.includes(spatialUnitMetadata.spatialUnitId)){	
          
          // only remove the current element
          // which represents a spatial unit that is 
          // not supported by the current indicator 
          this.higherSpatialUnits.splice(index, 1);
        }

        // since we query through a hierarchically sorted array of ALL spatial units
        // we have to stop when we identify the currently displayed spatial unit
        // in that case we have to remove that from the list of upper  
        if (spatialUnitName == spatialUnitMetadata.spatialUnitLevel){
          // remove current all all remaining elements from array
          // (which are lower hierarchy spatial units)
          this.higherSpatialUnits.splice(index);
          break;
        }
      }

      // this.higherSpatialUnits.splice(targetIndex);
      this.selectedSpatialUnitForFilter = this.higherSpatialUnits[this.higherSpatialUnits.length - 1];

      this.loadingData = false;
    };

    onOnChangeSelectedIndicator() {
      this.reappliedFilter = false;
    }
						/* 

							this.$on("indicatortMapDisplayFinished", function(){
								// trigger the continous display of current filter									
								if(! this.reappliedFilter){
									this.reappliedFilter = true;
									if (this.showSelectionByFeatureSpatialFilter){
										this.onSelectionByFeatureSpatialFilterSelectBtnPressed();
									}
									if (this.showManualSelectionSpatialFilter){
										this.onManualSelectionBySelectedMapFeaturesBtnPressed();
									}										
								}	
							});
  */
							replaceIndicatorAsGeoJSON([indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation]) {

								this.setupSpatialUnitFilter(indicatorMetadataAndGeoJSON, spatialUnitName, date);

								if(! this.previouslySelectedIndicator){
									this.previouslySelectedIndicator = this.exchangeData.selectedIndicator;
								}
								if(! this.previouslySelectedSpatialUnit){
									this.previouslySelectedSpatialUnit = this.exchangeData.selectedSpatialUnit;
								}

								// if(this.previouslySelectedIndicator.indicatorId != indicatorMetadataAndGeoJSON.indicatorId || this.previouslySelectedSpatialUnit.spatialUnitLevel != spatialUnitName){
								if(this.previouslySelectedSpatialUnit.spatialUnitLevel != spatialUnitName){
									// reset filter component
									if (this.showSelectionByFeatureSpatialFilter)
										this.updateSelectableAreas("byFeature");
										this.filterHelperService.clearFilteredFeatures();
										this.filterHelperService.clearSelectedFeatures();
									if (this.showManualSelectionSpatialFilter)
										this.updateSelectableAreas("manual");
										this.filterHelperService.clearFilteredFeatures();
										this.filterHelperService.clearSelectedFeatures();
								}

								this.previouslySelectedIndicator = this.exchangeData.selectedIndicator;
								this.previouslySelectedSpatialUnit = this.exchangeData.selectedSpatialUnit;
								
							}

							updateIndicatorValueRangeFilter([date, indicatorMetadataAndGeoJSON]) {

									this.setupRangeSliderForFilter(date, indicatorMetadataAndGeoJSON);

							}

							setupRangeSliderForFilter(date, indicatorMetadataAndGeoJSON){
                // hier
								date = this.INDICATOR_DATE_PREFIX + date;

								if(this.rangeSliderForFilter){
									this.exchangeData.rangeFilterData = undefined;
									this.rangeSliderForFilter.destroy();

									var domNode: HTMLElement | null = document.getElementById("rangeSliderForFiltering");

                  if(domNode && domNode.lastChild) {
                    while (domNode.hasChildNodes()) {
                      domNode.removeChild(domNode.lastChild);
                    }
                  }
								}

								this.indicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;

								var values:any[] = [];

								this.indicatorMetadataAndGeoJSON.geoJSON.features.forEach((feature:any) => {
									// if (feature.properties[date] > movMaxValue)
									// 	movMaxValue = feature.properties[date];
									//
									// else if (feature.properties[date] < movMinValue)
									// 	movMinValue = feature.properties[date];

									if(! this.dataExchangeService.indicatorValueIsNoData(feature.properties[date])){
											values.push(feature.properties[date]);
									}
								});

								if(values.length === 0){
									console.warn("Filter range slider cannot be created, as there is no valid indicator value on the selected dataset for the selected date.");
									return ;
								}

								//sort ascending order
								values.sort(function(a, b){return a-b});

								// initialize and fill in loop
								this.valueRangeMinValue = values[0];
								this.valueRangeMaxValue = values[values.length - 1];

								this.valueRangeMinValue = this.dataExchangeService.getIndicatorValue_asNumber(this.valueRangeMinValue);
								this.valueRangeMaxValue = this.dataExchangeService.getIndicatorValue_asNumber(this.valueRangeMaxValue);

								this.currentLowerFilterValue = this.valueRangeMinValue;
								this.currentHigherFilterValue = this.valueRangeMaxValue;

								this.inputLowerFilterValue = this.valueRangeMinValue;
								this.inputHigherFilterValue = this.valueRangeMaxValue;

                this.slider.noUiSlider.updateOptions({
                  range: {
                      'min': this.valueRangeMinValue,
                      'max': this.valueRangeMaxValue
                  },
                  start: [this.valueRangeMinValue, this.valueRangeMaxValue],
                  step: 0.01,
                  tooltips: true,
                  pips: {
                    mode: 'range',
                    density: 25
                  }
                });
              
                this.slider.noUiSlider.on('set', () => {
                  this.onChangeRangeFilter(this.getFormatedSliderReturn());
                });

							};

              getFormatedSliderReturn() {

                let data = this.slider.noUiSlider.get(true);
                
                return {
                  from: data[0],
                  to: data[1]
                };
              }

							onChangeLowerFilterValue(value){

								this.inputLowerFilterValue = value;

                this.updateFilterRangeSlideronInputChange();

								if((this.inputLowerFilterValue >= this.valueRangeMinValue) && (this.inputLowerFilterValue <= this.valueRangeMaxValue) && (this.inputLowerFilterValue <= this.inputHigherFilterValue)){	
									this.currentLowerFilterValue = this.inputLowerFilterValue;
									this.lowerFilterInputNotValid = false;
									this.rangeSliderForFilter.update({
											from: this.currentLowerFilterValue,
											to: this.currentHigherFilterValue
									});

									this.applyRangeFilter();
								}
								else{
									this.lowerFilterInputNotValid = true;
								}
							};

              updateFilterRangeSlideronInputChange() {

                this.slider.noUiSlider.updateOptions({
                  start: [this.inputLowerFilterValue, this.inputHigherFilterValue]
                });
              }

							onChangeHigherFilterValue(value){

								this.inputHigherFilterValue = value;

                this.updateFilterRangeSlideronInputChange();

								if((this.inputHigherFilterValue <= this.valueRangeMaxValue) && (this.inputHigherFilterValue >= this.valueRangeMinValue) && (this.inputLowerFilterValue <= this.inputHigherFilterValue)){
									this.currentHigherFilterValue = this.inputHigherFilterValue;
									this.higherFilterInputNotValid = false;
									this.rangeSliderForFilter.update({
											from: this.currentLowerFilterValue,
											to: this.currentHigherFilterValue
									});

									this.applyRangeFilter();
								}
								else{
									this.higherFilterInputNotValid = true;
								}
							};

							onChangeRangeFilter (data) {
								// Called every time handle position is changed
								this.exchangeData.rangeFilterData = data;

								this.lowerFilterInputNotValid = false;
								this.higherFilterInputNotValid = false;

								this.currentLowerFilterValue = data.from;
								this.inputLowerFilterValue = data.from;

                (<HTMLInputElement>document.getElementById('inputLowerValue')).value = this.inputLowerFilterValue;

								this.currentHigherFilterValue = data.to;
								this.inputHigherFilterValue = data.to;

								(<HTMLInputElement>document.getElementById('inputHigherValue')).value = this.inputHigherFilterValue;

								this.applyRangeFilter();
							};

							applyRangeFilter(){

								var dateProperty = this.INDICATOR_DATE_PREFIX + this.exchangeData.selectedDate;

								this.filterHelperService.applyRangeFilter(this.indicatorMetadataAndGeoJSON.geoJSON.features, dateProperty, this.currentLowerFilterValue, this.currentHigherFilterValue);

								//this.$digest();
							}

							onChangeUseMeasureOfValue(){

                let middle = this.valueRangeMinValue + ((this.valueRangeMaxValue-this.valueRangeMinValue)/2);

                this.measureSlider.noUiSlider.updateOptions({
                  range: {
                      'min': this.valueRangeMinValue,
                      'max': this.valueRangeMaxValue
                  },
                  start: [middle],
                  step: 0.01,
                  tooltips: true,
                  pips: {
                    mode: 'range',
                    density: 25
                  }
                });
              
                this.measureSlider.noUiSlider.on('set', () => {
                  let data = this.measureSlider.noUiSlider.get(true);

                  this.exchangeData.measureOfValue = data;
                  this.onMeasureOfValueChangeByText();
                });

								if(this.exchangeData.isBalanceChecked){

                  // todo
								/* 	$rootScope.$broadcast("DisableBalance");
									$rootScope.$broadcast("updateIndicatorValueRangeFilter", this.exchangeData.selectedDate, this.exchangeData.selectedIndicator); */
									//replace displayed indicator on map
									this.filterHelperService.filterAndReplaceDataset();
									// kommonitorMapService.replaceIndicatorGeoJSON(this.exchangeData.selectedIndicator, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.exchangeData.selectedDate, true);
								}
								else{
									this.mapService.restyleCurrentLayer();
								}

							};

              // todo
						/* 	this.$on("updateMeasureOfValueBar", function (event, date, indicatorMetadataAndGeoJSON) {

									this.updateMeasureOfValueBar(date, indicatorMetadataAndGeoJSON);

							}); */

							updateMeasureOfValueBar([date, indicatorMetadataAndGeoJSON]){

								//append date prefix to access correct property!
								date = this.INDICATOR_DATE_PREFIX + date;
								var geoJSON = indicatorMetadataAndGeoJSON.geoJSON;

								// var measureOfValueInput = document.getElementById("measureOfValueInput");

								var values:any[] = [];

								geoJSON.features.forEach((feature:any) => {
									// if (feature.properties[date] > movMaxValue)
									// 	movMaxValue = feature.properties[date];
									//
									// else if (feature.properties[date] < movMinValue)
									// 	movMinValue = feature.properties[date];

									if(! this.dataExchangeService.indicatorValueIsNoData(feature.properties[date])){
											values.push(feature.properties[date]);
									}
								});

								//sort ascending order
								values.sort(function(a, b){return a-b});

								this.movMinValue = +Number(values[0]).toFixed(this.numberOfDecimals);
								this.movMaxValue = +Number(values[values.length - 1]).toFixed(this.numberOfDecimals);

								this.movMiddleValue = +((this.movMaxValue + this.movMinValue) / 2).toFixed(this.numberOfDecimals);
								// this.movStep = +((this.movMaxValue - this.movMinValue)/35).toFixed(numberOfDecimals);
								this.movStep = 0.01;

								// measureOfValueInput.setAttribute("min", this.movMinValue);
								// measureOfValueInput.setAttribute("max", this.movMaxValue);
								// measureOfValueInput.setAttribute("movStep", this.movStep);
								// measureOfValueInput.setAttribute("value", this.movMiddleValue);

								this.exchangeData.measureOfValue = this.movMiddleValue;

								var measureOfValueTextInput = <HTMLInputElement>document.getElementById("measureOfValueTextInput");
								measureOfValueTextInput.setAttribute("min", this.movMinValue);
								measureOfValueTextInput.setAttribute("max", this.movMaxValue);
								measureOfValueTextInput.setAttribute("value", this.movMiddleValue);
								measureOfValueTextInput.setAttribute("step", this.movStep);

								if(this.movRangeSlider){
									this.movRangeSlider.destroy();

									var domNode = <HTMLInputElement>document.getElementById("measureOfValueInput");

                  if(domNode && domNode.lastChild) {
                    while (domNode.hasChildNodes()) {
                      domNode.removeChild(domNode.lastChild);
                    }
                  }
								}
                
                let middle = this.movMinValue + ((this.movMaxValue-this.movMinValue)/2);

                this.measureSlider.noUiSlider.updateOptions({
                  range: {
                      'min': this.movMinValue,
                      'max': this.movMaxValue
                  },
                  start: [middle],
                  step: 0.01,
                  tooltips: true,
                  pips: {
                    mode: 'range',
                    density: 25
                  }
                });

								this.inputNotValid = false;

							};

							onMeasureOfValueChange(data){

								this.exchangeData.measureOfValue = +Number(data.from).toFixed(this.numberOfDecimals);

								// this.exchangeData.measureOfValue = +Number(this.exchangeData.measureOfValue).toFixed(numberOfDecimals);

								if(this.exchangeData.measureOfValue >= this.movMinValue && this.exchangeData.measureOfValue <= this.movMaxValue){
									this.inputNotValid = false;
									// todo 
                  // $rootScope.$broadcast("changeMOV", this.exchangeData.measureOfValue);
									this.mapService.restyleCurrentLayer();
								}
								else{
									this.inputNotValid = true;
								}

							};

							onMeasureOfValueChangeByText(){

								this.exchangeData.measureOfValue = +Number(this.exchangeData.measureOfValue).toFixed(this.numberOfDecimals);

								// this.exchangeData.measureOfValue = +Number(this.exchangeData.measureOfValue).toFixed(numberOfDecimals);

								if(this.exchangeData.measureOfValue >= this.movMinValue && this.exchangeData.measureOfValue <= this.movMaxValue){
									this.inputNotValid = false;
                  
									// todo 
								/* 	this.movRangeSlider.update({
							        from: this.exchangeData.measureOfValue
							    }); */
                  // $rootScope.$broadcast("changeMOV", this.exchangeData.measureOfValue);
									this.mapService.restyleCurrentLayer();
								}
								else{
									this.inputNotValid = true;
								}

							};

							updateSelectableAreas(selectionType) {

								this.loadingData = true;
								//send request to datamanagement API
								let selectedSpatialUnit = this.exchangeData.selectedSpatialUnit;
								let selectedSpatialUnitId = selectedSpatialUnit.spatialUnitId;
								let upperSpatialUnitId = undefined;
								
								// spatial filter not applicable since no upper spatial unit is available or selected
								if(! this.selectedSpatialUnitForFilter){
									this.loadingData = false;
									return;
								}

								if (selectionType === "byFeature" && this.selectedSpatialUnitForFilter) {	
									upperSpatialUnitId = this.selectedSpatialUnitForFilter.spatialUnitId;				
								}
								let selectedIndicatorId = this.exchangeData.selectedIndicator.indicatorId;

								// example: 2020-12-31
								let selectedDateComponents = this.exchangeData.selectedDate.split("-");

								//build request
								let datePath = "";
								if(selectedDateComponents && selectedDateComponents.length && selectedDateComponents.length == 3){
									datePath = selectedDateComponents[0] + "/" + selectedDateComponents[1] + "/" + selectedDateComponents[2];
								}
								else{
									// fallback option, if no valid date could be used
									datePath = "allFeatures";
								}
								let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
									"/spatial-units/" + selectedSpatialUnitId + "/" + datePath;
								
								if (selectionType === "byFeature" && upperSpatialUnitId)
									url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
									"/spatial-units/" + upperSpatialUnitId + "/" + datePath;

								//send request
                this.http.get(url).subscribe({
                  next: response => {
                    let areaNames:any[] = [];
                    response['features'].forEach( (obj, id) => {
                      areaNames.push({name: obj.properties[window.__env.FEATURE_NAME_PROPERTY_NAME], id: obj.properties[window.__env.FEATURE_ID_PROPERTY_NAME]});
                    });

                    if (selectionType === "manual") {
                      this.manualSelectionSpatialFilterDuallistOptions.selectedItems = [];
                      let dataArray = this.dataExchangeService.createDualListInputArray(areaNames, "name", "id");
                      this.manualSelectionSpatialFilterDuallistOptions.items = dataArray;
                    }

                    if (selectionType === "byFeature") {
                      this.higherSpatialUnitFilterFeatureGeoJSON = response;
                      this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems = [];
                      let dataArray = this.dataExchangeService.createDualListInputArray(areaNames, "name", "id");
                      this.selectionByFeatureSpatialFilterDuallistOptions.items = dataArray;
                    }

                    this.loadingData = false;
                    this.reloadList = !this.reloadList;
                  }, 
                  error: error => {

                  }
                })
               
							};

							onChangeShowManualSelection(checked) {

								this.showManualSelectionSpatialFilter = checked;

								// return if toggle was deactivated
								if(!this.showManualSelectionSpatialFilter)
									this.onManualSelectionSpatialFilterResetBtnPressed();						
								else {
									this.showSelectionByFeatureSpatialFilter = false;
									this.onManualSelectionSpatialFilterResetBtnPressed();								
								}
							};

							onChangeShowSelectionByFeature(checked) {

								this.showSelectionByFeatureSpatialFilter = checked;

								// return if toggle was deactivated
								if(!this.showSelectionByFeatureSpatialFilter)
									this.onSelectionByFeatureSpatialFilterResetBtnPressed();
								else {
									this.showManualSelectionSpatialFilter = false;
									this.onSelectionByFeatureSpatialFilterResetBtnPressed();								
								}
							};

							onChangeSelectedSpatialUnitForFilter(){

								this.selectedSpatialUnitForFilter = this.higherSpatialUnits.filter(e => e.spatialUnitId==this.selectedSpatialUnitIdForFilter)[0];

								if (this.showSelectionByFeatureSpatialFilter) 
									this.updateSelectableAreas("byFeature");

								if(this.showManualSelectionSpatialFilter){
									this.updateSelectableAreas("manual");
								}
							};

							onSelectionByFeatureSpatialFilterSelectBtnPressed(){
								if(this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems && this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems.length > 0){
                  
									// objects like {category: category, name:name}									
									//this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems
									let targetFeatureNames = this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems.map((object:any) => object.name);
                  console.log(this.higherSpatialUnitFilterFeatureGeoJSON,targetFeatureNames)
									this.filterHelperService.applySpatialFilter_higherSpatialUnitFeatures(this.higherSpatialUnitFilterFeatureGeoJSON, targetFeatureNames);
								}
							};

							onSelectionByFeatureSpatialFilterResetBtnPressed(){
								this.updateSelectableAreas("byFeature");

								this.filterHelperService.clearFilteredFeatures();
								this.filterHelperService.filterAndReplaceDataset();
								if(this.exchangeData.useNoDataToggle) {
									// todo $rootScope.$broadcast('applyNoDataDisplay')	
                }
							};

							onManualSelectionSpatialFilterSelectBtnPressed(){
								if(this.manualSelectionSpatialFilterDuallistOptions.selectedItems && this.manualSelectionSpatialFilterDuallistOptions.selectedItems.length > 0){
									// objects like {category: category, name:name}									
									//this.manualSelectionSpatialFilterDuallistOptions.selectedItems
									let targetFeatureNames = this.manualSelectionSpatialFilterDuallistOptions.selectedItems.map((object:any) => object.name);

									this.filterHelperService.applySpatialFilter_currentSpatialUnitFeatures(targetFeatureNames);
								}
							};

							onManualSelectionSpatialFilterResetBtnPressed(){
								this.updateSelectableAreas("manual");

								this.filterHelperService.clearFilteredFeatures();
								this.filterHelperService.filterAndReplaceDataset();
								if(this.exchangeData.useNoDataToggle) {
									// todo $rootScope.$broadcast('applyNoDataDisplay')	
                }
							};

							onManualSelectionBySelectedMapFeaturesBtnPressed(){
								// manage duallist items display
								this.manageManualDualList_fromMapSelection();
								
								// apply spatial filter from selected map features
								this.onManualSelectionSpatialFilterSelectBtnPressed();
							};

							manageManualDualList_fromMapSelection(){
								this.manualSelectionSpatialFilterDuallistOptions.items = this.manualSelectionSpatialFilterDuallistOptions.items.concat(this.manualSelectionSpatialFilterDuallistOptions.selectedItems);
								this.manualSelectionSpatialFilterDuallistOptions.selectedItems = [];

								this.manualSelectionSpatialFilterDuallistOptions.selectedItems = this.manualSelectionSpatialFilterDuallistOptions.items.filter((item:any) => this.filterHelperService.featureIsCurrentlySelected(item.id));								
								this.manualSelectionSpatialFilterDuallistOptions.items = this.manualSelectionSpatialFilterDuallistOptions.items.filter((item:any) => ! this.filterHelperService.featureIsCurrentlySelected(item.id));								
							};

							// $rootScope.$on("changeSpatialUnit", function() {
							// 	if (this.showSelectionByFeatureSpatialFilter)
							// 		this.updateSelectableAreas("byFeature");
							// 	if (this.showManualSelectionSpatialFilter)
							// 		this.updateSelectableAreas("manual");
							// });

							//TODO on indicator change
}
