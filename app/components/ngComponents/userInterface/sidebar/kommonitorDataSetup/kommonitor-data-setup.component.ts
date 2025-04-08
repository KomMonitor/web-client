import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { error } from 'jquery';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchange, DataExchangeService, IndicatorTopic } from 'services/data-exchange-service/data-exchange.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { MapService } from 'services/map-service/map.service';
import * as noUiSlider from 'nouislider';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-kommonitor-data-setup',
  templateUrl: './kommonitor-data-setup.component.html',
  styleUrls: ['./kommonitor-data-setup.component.css']
})
export class KommonitorDataSetupComponent implements OnInit {

  exchangeData!:DataExchange;
  topicsCollapsed:string[] = [];

  isCollapsed_headlineIndicatorHierarchyItem = true;

  loadingData = true;
  changeIndicatorWasClicked = false;
  spatialUnitName!:any;
  date!:any;

  datePicker;
  datesAsMs;
  
  indicatorNameFilter = undefined;
  INDICATOR_DATE_PREFIX = window.__env.indicatorDatePrefix

  selectedDate;					

  preppedIndicatorTopics: IndicatorTopic[] = [];

  dateSlider;
  config: any  = {
    behaviour: 'drag',
    connect: true,
    range: {
        'min': 0,
        'max': 100
    },
    start: [0],
    keyboard: true, 
    pips: {
      mode: 'range',
      density: 2,
      values: 4,
      stepped: true
    }
  };
  
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

  constructor(
    public dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    private elementVisibilityHelperService: ElementVisibilityHelperService,
    private mapService: MapService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.exchangeData = this.dataExchangeService.pipedData;

    this.setupSlider();

    // todo like "initialMetadataLoadingCompleted"
    window.setTimeout( () => {
      this.preppedIndicatorTopics = this.prepareIndicatorTopicsRecursive(this.exchangeData.topicIndicatorHierarchy);
      this.addClickListenerToEachCollapseTrigger();

      this.onInitialMetadataLoadingComplete();

    },2000);

    $(document).ready(function() {
      $(".nav li.disabled a").click(function() {
        return false;
      });
    });

    this.broadcastService.currentBroadcastMsg.subscribe(res => {
      let msg = res.msg;
      let values:any = res.values;

      switch (msg) {
        case 'DisableDateSlider' : {
          this.DisableDateSlider();
        } break;
        case 'EnableDateSlider' : {
          this.EnableDateSlider();
        } break;
        case 'changeIndicatorDate': {
          this.changeIndicatorDate(values);
        } break;
      }
    });
  }
  
  setupSlider() {
    this.dateSlider = document.getElementById('dateSlider');
    noUiSlider.create(this.dateSlider, this.config);
  }

  onInitialMetadataLoadingComplete() {
    console.log("Load an initial example indicator");

    if (this.exchangeData.displayableIndicators == null || this.exchangeData.displayableIndicators == undefined || this.exchangeData.displayableIndicators.length === 0){
      console.error("Kein darstellbarer Indikator konnte gefunden werden.");

      this.dataExchangeService.displayMapApplicationError("Kein darstellbarer Indikator konnte gefunden werden.");										
      this.loadingData = false;
      
      this.broadcastService.broadcast('hideLoadingIconOnMap');

      return;
    }

    try{
      var indicatorIndex:any = undefined;

      for (var index=0; index < this.exchangeData.displayableIndicators.length; index++){
        if (this.exchangeData.displayableIndicators[index].indicatorId === window.__env.initialIndicatorId){
          if(this.exchangeData.displayableIndicators[index].applicableDates.length > 0){
            indicatorIndex = index;
            break;
          }											
        }
      }

      if( indicatorIndex === undefined){
          for(var t=0; t < 75; t++){
            
            var randIndex = this.getRandomInt(0, this.exchangeData.displayableIndicators.length - 1);
            if (this.exchangeData.displayableIndicators[randIndex].applicableDates.length > 0){
              indicatorIndex = randIndex;
              break;
            }													
          }
      }

      if( indicatorIndex === undefined){
        throw Error();
      }

      this.exchangeData.selectedIndicator = this.exchangeData.displayableIndicators[indicatorIndex];
      // create Backup which is used when currently selected indicator is filtered out in select
      this.exchangeData.selectedIndicatorBackup = this.exchangeData.selectedIndicator;

      // set spatialUnit
      for (var spatialUnitEntry of this.exchangeData.availableSpatialUnits){
        if(spatialUnitEntry.spatialUnitLevel === window.__env.initialSpatialUnitName){
          this.exchangeData.selectedSpatialUnit = spatialUnitEntry;
          break;
        }
      }
      if(!this.exchangeData.selectedSpatialUnit){
          this.exchangeData.selectedSpatialUnit = this.getFirstSpatialUnitForSelectedIndicator();
      }

      if(! window.__env.centerMapInitially){
        this.onChangeSelectedIndicator(false);	
      }
      else{
        this.onChangeSelectedIndicator(true);	
      }
                        

    }
    catch(error){
      console.error("Initiales Darstellen eines Indikators ist gescheitert.");

      this.dataExchangeService.displayMapApplicationError("Initiales Darstellen eines Indikators ist gescheitert.");										
      this.loadingData = false;
      this.broadcastService.broadcast('hideLoadingIconOnMap');

      return;
    }

    //reinit visibility of elements due to fact that now some HTML elements are actually available
    this.elementVisibilityHelperService.initElementVisibility();
  }

  prepareIndicatorTopicsRecursive(tree:IndicatorTopic[]) {

    let retTree:IndicatorTopic[] = tree.sort( (a:IndicatorTopic, b:IndicatorTopic) => {
      return (a.topicName>b.topicName) ? 1 : 0;
    }).filter(e => e.indicatorCount>0);

    retTree.forEach( (elem:IndicatorTopic) => {

      if(!this.topicsCollapsed.includes(elem.topicId))
        this.topicsCollapsed.push(elem.topicId);

      if(elem.subTopics.length>0) {
        elem.subTopics = this.prepareIndicatorTopicsRecursive(elem.subTopics);
      }
    });

    return retTree;
  }

  onTopicClick(topicID:string) {
    if(this.topicsCollapsed.includes(topicID))
      this.topicsCollapsed = this.topicsCollapsed.filter(e => e!=topicID);
    else
      this.topicsCollapsed.push(topicID);
  }

  addClickListenerToEachCollapseTrigger(){
    setTimeout(function(){
      $('.list-group-item > .collapseTrigger').on('click', function(e) {
        
        $('.glyphicon', e)
        .toggleClass('glyphicon-chevron-right')
        .toggleClass('glyphicon-chevron-down');

          // manage uncollapsed entries
          // var clickedTopicId = $(this).attr('id');
          // if ($scope.unCollapsedTopicIds.includes(clickedTopicId)){
          // 	var index = $scope.unCollapsedTopicIds.indexOf(clickedTopicId);
          // 	$scope.unCollapsedTopicIds.splice(index, 1);
          // }
          // else{
          // 	$scope.unCollapsedTopicIds.push(clickedTopicId);
          // }
      });
    }, 500);
  };

/*
					

  this.addGeopackage = function(){
    this.kommonitorMapServiceInstance.addSpatialUnitGeopackage();
  }
  this.addGeoJSON = function(){
    this.kommonitorMapServiceInstance.addSpatialUnitGeoJSON();
  }
  */
  onClickHierarchyIndicator(indicatorMetadata){
    this.exchangeData.selectedIndicator = indicatorMetadata;
    this.onChangeSelectedIndicator(false);
  };

  // $scope.$watch('filteredSpatialUnits', function(value){
  //   if ($scope.filteredSpatialUnits) {
  //     kommonitorDataExchangeService.selectedSpatialUnit = $scope.filteredSpatialUnits[0];
  //   }
  // }, true);
/*
 
  $scope.filterGeoresourcesByIndicator = function() {
    return function( item ) {

      try{
        var referencedGeoresources = kommonitorDataExchangeService.selectedIndicator.referencedGeoresources;
        var georesourceId = item.georesourceId;

        for (const refGeoresource of referencedGeoresources){
          if(refGeoresource.referencedGeoresourceId === georesourceId)
            return true;
        };

        // return referencedGeoresources.includes(georesourceId);
      }
      catch(error){
        return false;
      }
    };
  };

  $scope.filterReferencedIndicatorsByIndicator = function() {
    return function( item ) {

      try{
        var referencedIndicators = kommonitorDataExchangeService.selectedIndicator.referencedIndicators;
        var indicatorId = item.indicatorId;

        for (const refIndicator of referencedIndicators){
          if(refIndicator.referencedIndicatorId === indicatorId)
            return true;
        };

      }
      catch(error){
        return false;
      }
    };
  };

  $scope.filterGeoresourcesByTopic = function() {
    return function( item ) {
      if (kommonitorDataExchangeService.selectedTopic)
        return item.applicableTopics.includes(kommonitorDataExchangeService.selectedTopic.topicName);

      return true;
    };
  };

  $scope.filterSpatialUnitsByIndicator = function() {
    return function( item ) {

      try{
        var applicableSpatialUnits = kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits;
        
        return applicableSpatialUnits.some(o => o.spatialUnitName === item.spatialUnitLevel);
      }
      catch(error){
        return false;
      }
    };
  };
  */
  getFirstSpatialUnitForSelectedIndicator() {

    var result:any = undefined;

      var applicableSpatialUnits = this.exchangeData.selectedIndicator.applicableSpatialUnits;

      for (const spatialUnitEntry of this.exchangeData.availableSpatialUnits){
        if(applicableSpatialUnits.some(o => o.spatialUnitName === spatialUnitEntry.spatialUnitLevel)){
          result = spatialUnitEntry;
          break;
        }
      }

      return result;
  };
/*
  this.onDateChange = function(){

    var date = new Date($scope.selectedDate);

    var month = date.getMonth()+1;
    var day = date.getDate();

    if (month < 10)
      month = "0" + month;

    if (day < 10)
      day = "0" + day;

    $scope.selectedDate = date.getFullYear() + "-" + month  + "-" + day;
    kommonitorDataExchangeService.selectedDate = $scope.selectedDate;

    $scope.$digest();
  };

  $scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {

    $scope.loadingData = false;
    $scope.$broadcast("hideLoadingIconOnMap");

  });

  

   */
  getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
  }
/*
  this.addSelectedSpatialUnitToMap = function() {
    $scope.loadingData = true;
    $rootScope.$broadcast("showLoadingIconOnMap");

    var metadata = kommonitorDataExchangeService.selectedSpatialUnit;

    var id = metadata.spatialUnitId;

    $scope.date = $scope.selectedDate;

    var dateComps = $scope.selectedDate.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    $http({
      url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/spatial-units/" + id + "/" + year + "/" + month + "/" + day + "?" + kommonitorDataExchangeService.simplifyGeometriesParameterName + "=" + kommonitorDataExchangeService.simplifyGeometries,
      method: "GET"
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON = response.data;

        kommonitorDataExchangeService.selectedSpatialUnit.geoJSON = geoJSON;

        kommonitorMapService.addSpatialUnitGeoJSON(kommonitorDataExchangeService.selectedSpatialUnit, $scope.date);
        $scope.loadingData = false;
        $rootScope.$broadcast("hideLoadingIconOnMap");

      }, function errorCallback(error) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        $scope.loadingData = false;
        kommonitorDataExchangeService.displayMapApplicationError(error);
        $rootScope.$broadcast("hideLoadingIconOnMap");
    });
  };

  this.addSelectedSpatialUnitToMapAsWFS = function() {
    $scope.loadingData = true;
    $rootScope.$broadcast("showLoadingIconOnMap");

    var metadata = kommonitorDataExchangeService.selectedSpatialUnit;

    var name = metadata.spatialUnitLevel;

    var wfsUrl = metadata.wfsUrl;

    kommonitorMapService.addSpatialUnitWFS(name, wfsUrl);
    $scope.loadingData = false;
    $rootScope.$broadcast("hideLoadingIconOnMap");

  };

  this.addSelectedGeoresourceToMap = function() {
    $scope.loadingData = true;
    $rootScope.$broadcast("showLoadingIconOnMap");

    var metadata = kommonitorDataExchangeService.selectedGeoresource;

    var id = metadata.georesourceId;

    $scope.date = $scope.selectedDate;

    var dateComps = $scope.selectedDate.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    $http({
      url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day  + "?" + kommonitorDataExchangeService.simplifyGeometriesParameterName + "=" + kommonitorDataExchangeService.simplifyGeometries,
      method: "GET"
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON = response.data;

        kommonitorDataExchangeService.selectedGeoresource.geoJSON = geoJSON;

        kommonitorMapService.addGeoresourceGeoJSON(kommonitorDataExchangeService.selectedGeoresource, $scope.date);
        $scope.loadingData = false;
        $rootScope.$broadcast("hideLoadingIconOnMap");

      }, function errorCallback(error) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        $scope.loadingData = false;
        kommonitorDataExchangeService.displayMapApplicationError(error);
        $rootScope.$broadcast("hideLoadingIconOnMap");
    });

  };
  */
  addSelectedIndicatorToMap(changeIndicator) {
    
    if(changeIndicator){
      //todo
      // $rootScope.$broadcast("DisableBalance");
      this.mapService.replaceIndicatorGeoJSON(this.exchangeData.selectedIndicator, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.selectedDate, false);
    }
    else {
      // check if balance mode is active
      if (this.exchangeData.isBalanceChecked){
        //todo
        // $rootScope.$broadcast("replaceBalancedIndicator");
      }
      else {
        this.mapService.replaceIndicatorGeoJSON(this.exchangeData.selectedIndicator, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.selectedDate, false);
      }
    }
  };
/*
  function prettifyDateSliderLabels (dateAsMs) {
    return kommonitorDataExchangeService.tsToDate_withOptionalUpdateInterval(dateAsMs, kommonitorDataExchangeService.selectedIndicator.metadata.updateInterval);									
  }
*/
  createDatesFromIndicatorDates(indicatorDates) {

    this.datesAsMs = [];

    for (var index=0; index < indicatorDates.length; index++){
      // year-month-day
      var dateComponents = indicatorDates[index].split("-");
      this.datesAsMs.push(this.dataExchangeService.dateToTS(new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]))));
    }
    return this.datesAsMs;
  }
  
  setupDateSliderForIndicator(){

    var availableDates = this.exchangeData.selectedIndicator.applicableDates;
    this.date = availableDates[availableDates.length - 1];
    this.selectedDate = availableDates[availableDates.length - 1];
    this.exchangeData.selectedDate = availableDates[availableDates.length - 1];

    this.datesAsMs = this.createDatesFromIndicatorDates(this.exchangeData.selectedIndicator.applicableDates);
   
    this.dateSlider.noUiSlider.updateOptions({
      range: {
          'min': 0, // index from
          'max': this.datesAsMs.length-1 // index to
      },
      start: [ this.tsToDateString(this.datesAsMs[this.datesAsMs.length-1])],
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
  
    this.dateSlider.noUiSlider.on('set', () => {
      this.onChangeDateSliderItem(this.getFormatedSliderReturn());
    })
  };

  onChangeIndicatorFilter() {
    this.dataExchangeService.onChangeIndicatorKeywordFilter(this.indicatorNameFilter);
    
    this.preppedIndicatorTopics = this.prepareIndicatorTopicsRecursive(this.exchangeData.topicIndicatorHierarchy);
    this.addClickListenerToEachCollapseTrigger();
  }

  getFormatedSliderReturn() {

    let data = this.dateSlider.noUiSlider.get(true);
    
    return {
      from: Math.round(data)
    };
  }

  dateStringToMs(dateStr) {
    let parts = dateStr.split(' ');
    // get timezoneOffset w/o daylight saving time by referencing a specific date
    let offset = new Date('November 1, 2000 00:00:00').getTimezoneOffset()*60*1000;
   
    let tms = new Date(parts[2]+'-'+(this.months.indexOf(parts[1])+1)+'-'+parts[0].replace('.','')+'T00:00:00Z').getTime();
    return tms+offset;
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

  setupDatePickerForIndicator(){

    var availableDates = this.exchangeData.selectedIndicator.applicableDates;
    this.date = availableDates[availableDates.length - 1];
    this.selectedDate = availableDates[availableDates.length - 1];
    this.exchangeData.selectedDate = availableDates[availableDates.length - 1];

    let ngbDates = this.prepNgbDates(availableDates);
    this.broadcastService.broadcast('updateDatePickerAvailableDates',[ngbDates]);																
  };

  prepNgbDates(dates):NgbDateStruct[] {

    let retDates:NgbDateStruct[] = [];

    dates.forEach(date => {
      let parts = date.split('-');

      retDates.push({year:parseInt(parts[0]), month:parseInt(parts[1]), day:parseInt(parts[2])});
    });

    return retDates;
  }

  onChangeDateSliderItem(data){

    if(!this.changeIndicatorWasClicked && this.exchangeData.selectedIndicator){
      this.loadingData = true;
      this.broadcastService.broadcast("showLoadingIconOnMap");

      console.log("Change selected date");

      //data.from is index of date!

      this.selectedDate = this.exchangeData.selectedIndicator.applicableDates[data.from];
      this.date = this.selectedDate;
      this.exchangeData.selectedDate = this.selectedDate;

      let preppedDate = this.prepNgbDates([this.exchangeData.selectedDate])[0];
      this.broadcastService.broadcast('updateDatePickerSelectedDate',[preppedDate]);

      try{
        var selectedIndicator = this.tryUpdateMeasureOfValueBarForIndicator();
      }
      catch(error){
        console.error(error);
        this.loadingData = false;
        this.broadcastService.broadcast("hideLoadingIconOnMap");
        this.dataExchangeService.displayMapApplicationError(error);
        return;
      }

      this.modifyExports(false);

      if(this.exchangeData.useNoDataToggle)
        this.broadcastService.broadcast('applyNoDataDisplay')

      this.loadingData = false;
      this.broadcastService.broadcast("hideLoadingIconOnMap");
      this.broadcastService.broadcast("selectedIndicatorDateHasChanged");
    }
  };


  DisableDateSlider() {
    if(this.dateSlider){
      this.dateSlider.noUiSlider.disable();
    }

    this.exchangeData.disableIndicatorDatePicker = true;
  }

  EnableDateSlider() {
    if(this.dateSlider){
      this.dateSlider.noUiSlider.enable();
    }

    this.exchangeData.disableIndicatorDatePicker = false;
  }

  tryUpdateMeasureOfValueBarForIndicator(){
    var indicatorId = this.exchangeData.selectedIndicator.indicatorId;

    if(! (this.date && this.exchangeData.selectedSpatialUnit && indicatorId)){
      this.dataExchangeService.displayMapApplicationError("Beim Versuch, einen Beispielindikator zu laden, ist ein Fehler aufgetreten. Der Datenbankeintrag scheint eine fehlerhafte Kombination aus Raumeinheit und Zeitschnitt zu enthalten.");
      throw Error("Not all parameters have been set up yet.");
    }										
    //
    // $scope.selectedDate = $scope.selectedDate;
    this.spatialUnitName = this.exchangeData.selectedSpatialUnit.spatialUnitLevel;

    var dateComps = this.date.split("-");
    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + indicatorId + "/" + this.exchangeData.selectedSpatialUnit.spatialUnitId + "/" + year + "/" + month + "/" + day + "?" + this.exchangeData.simplifyGeometriesParameterName + "=" + this.exchangeData.simplifyGeometries;
    this.http.get(url).subscribe({
      next: (response:any) => {
        var geoJSON = response;

        this.exchangeData.selectedIndicator.geoJSON = geoJSON;

        this.broadcastService.broadcast('updateMeasureOfValueBar', [this.date, this.exchangeData.selectedIndicator]);

        return this.exchangeData.selectedIndicator;
      },
      error: (error) => {
        this.loadingData = false;
        this.dataExchangeService.displayMapApplicationError(error);

        this.broadcastService.broadcast('hideLoadingIconOnMap');

        return this.exchangeData.selectedIndicator;
      }
    });

  };

/*  
  $scope.$on("changeSpatialUnit", function(event){
    $scope.onChangeSelectedSpatialUnit();
  });
  */

  datePickerToDateSlider(datePickerDate:NgbDateStruct) {

    return `${datePickerDate.day}. ${this.months[datePickerDate.month-1]} ${datePickerDate.year}`;
  }

  changeIndicatorDate([datePickerDate]){	
    
    if(this.exchangeData.selectedIndicator && this.exchangeData.selectedDate){
      this.loadingData = true;
      this.broadcastService.broadcast("showLoadingIconOnMap");

      console.log("Change selected date");

      this.dateSlider.noUiSlider.updateOptions({
        start: [ this.datePickerToDateSlider(datePickerDate) ],
      });

      this.date = this.exchangeData.selectedDate;
      this.selectedDate = this.exchangeData.selectedDate;

      try{
        var selectedIndicator = this.tryUpdateMeasureOfValueBarForIndicator();
      }
      catch(error){
        console.error(error);
        this.loadingData = false;
        this.broadcastService.broadcast("hideLoadingIconOnMap");
        this.dataExchangeService.displayMapApplicationError(error);
        return;
      }

      this.modifyExports(false);

      if(this.exchangeData.useNoDataToggle)
        this.broadcastService.broadcast('applyNoDataDisplay')	

      this.loadingData = false;
      this.broadcastService.broadcast("hideLoadingIconOnMap");
      this.broadcastService.broadcast("selectedIndicatorDateHasChanged");
    }

  }
/*
  $scope.onChangeSelectedSpatialUnit = async function(){
    if(!$scope.changeIndicatorWasClicked && kommonitorDataExchangeService.selectedIndicator){
      $scope.loadingData = true;
      $rootScope.$broadcast("showLoadingIconOnMap");

      console.log("Change spatial unit");

      try{
        var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
      }
      catch(error){
        console.error(error);
        $scope.loadingData = false;
        $rootScope.$broadcast("hideLoadingIconOnMap");
        kommonitorDataExchangeService.displayMapApplicationError(error);
        return;
      }

      $scope.modifyExports(false);

      if(kommonitorDataExchangeService.useNoDataToggle)
        $rootScope.$broadcast('applyNoDataDisplay');

      $scope.loadingData = false;
      $rootScope.$broadcast("hideLoadingIconOnMap");
      $scope.$digest();
    }
  }

  */
  
  markAssociatedHierarchyElement(selectedIndicatorMetadata){
    var selectedIndicatorId = selectedIndicatorMetadata.indicatorId;

    for (var indicator of this.exchangeData.displayableIndicators) {
      $("#indicatorHierarchyElement-" + indicator.indicatorId).removeClass('active');
    }

    $("#indicatorHierarchyElement-" + selectedIndicatorId).addClass('active');
  };

  onChangeSelectedIndicator_fromAlphabeticalList(indicatorMetadata){
    this.exchangeData.selectedIndicator = indicatorMetadata;
    this.onChangeSelectedIndicator(false);
  };

  onChangeSelectedIndicator(recenterMap){

    this.broadcastService.broadcast('onChangeSelectedIndicator');
    
    if(this.exchangeData.selectedIndicator){

      this.loadingData = true;
      this.broadcastService.broadcast('showLoadingIconOnMap');

      this.changeIndicatorWasClicked = true;

      this.markAssociatedHierarchyElement(this.exchangeData.selectedIndicator);
     
      this.exchangeData.selectedIndicatorBackup = this.exchangeData.selectedIndicator;

      this.setupDateSliderForIndicator();
      this.setupDatePickerForIndicator();
      
      if(!this.exchangeData.selectedSpatialUnit || !this.exchangeData.selectedIndicator.applicableSpatialUnits.some(o => o.spatialUnitName === this.exchangeData.selectedSpatialUnit.spatialUnitLevel)){
        this.exchangeData.selectedSpatialUnit = this.getFirstSpatialUnitForSelectedIndicator();
      }

      try{
        let selectedIndicator = this.tryUpdateMeasureOfValueBarForIndicator();
      }
      catch(error){
        console.error(error);
        this.loadingData = false;
        this.broadcastService.broadcast('hideLoadingIconOnMap');

        this.dataExchangeService.displayMapApplicationError(error);
        return;
      }

      this.broadcastService.broadcast('DisableBalance');

      this.modifyExports(true);

      if(this.exchangeData.useNoDataToggle) {
        this.broadcastService.broadcast('applyNoDataDisplay');
      }

      this.loadingData = false;

      if(recenterMap){
        this.broadcastService.broadcast('recenterMapContent');
      }

      //this.broadcastService.broadcast('hideLoadingIconOnMap');
      this.changeIndicatorWasClicked = false;

    }
    else{
      if (this.exchangeData.selectedIndicatorBackup){
        this.exchangeData.selectedIndicator = this.exchangeData.selectedIndicatorBackup;
      }
    }
    this.broadcastService.broadcast('selectedIndicatorDateHasChanged');
  }

  modifyExports(changeIndicator){

    this.exchangeData.wmsUrlForSelectedIndicator = undefined;
    this.exchangeData.wfsUrlForSelectedIndicator = undefined;
    
    var selectedSpatialUnitName = this.exchangeData.selectedSpatialUnit.spatialUnitLevel;

    for(const ogcServiceEntry of this.exchangeData.selectedIndicator.ogcServices){
      if (ogcServiceEntry.spatialUnit === selectedSpatialUnitName){
        this.exchangeData.wmsUrlForSelectedIndicator = ogcServiceEntry.wmsUrl;
        this.exchangeData.wfsUrlForSelectedIndicator = ogcServiceEntry.wfsUrl;
        break;
      }
    };

    this.broadcastService.broadcast("updateBalanceSlider", [this.exchangeData.selectedDate]);
    setTimeout(() => {
      this.broadcastService.broadcast("updateIndicatorValueRangeFilter", [this.exchangeData.selectedDate, this.exchangeData.selectedIndicator]);
    },2000); 
    this.addSelectedIndicatorToMap(changeIndicator);

  }
/*
  $scope.$on("updateIndicatorOgcServices", function (event, indicatorWmsUrl, indicatorWfsUrl) {

                console.log('updateIndicatorOgcServices was called');

                kommonitorDataExchangeService.wmsUrlForSelectedIndicator = indicatorWmsUrl;
                kommonitorDataExchangeService.wfsUrlForSelectedIndicator = indicatorWfsUrl;
                $scope.$digest();

  }); */

}
