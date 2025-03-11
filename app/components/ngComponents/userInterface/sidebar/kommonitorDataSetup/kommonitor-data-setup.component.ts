import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { error } from 'jquery';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchange, DataExchangeService, IndicatorTopic } from 'services/data-exchange-service/data-exchange.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { MapService } from 'services/map-service/map.service';

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

  dateSlider;
  datePicker;
  datesAsMs;
  
  indicatorNameFilter = undefined;
  INDICATOR_DATE_PREFIX = window.__env.indicatorDatePrefix

  selectedDate;					

  preppedIndicatorTopics: IndicatorTopic[] = [];

  constructor(
    public dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    private elementVisibilityHelperService: ElementVisibilityHelperService,
    private mapService: MapService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.exchangeData = this.dataExchangeService.pipedData;

    // todo like "initialMetadataLoadingCompleted"
    window.setTimeout( () => {
      this.preppedIndicatorTopics = this.prepareIndicatorTopicsRecursive(this.exchangeData.topicIndicatorHierarchy);
      this.addClickListenerToEachCollapseTrigger();

      this.onInitialMetadataLoadingComplete();

    },1000);
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
  // var rangeslide = require("rangeslide");

  this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
  this.kommonitorDataExchangeServiceInstance.selectedServiceUrl = '';
  this.kommonitorMapServiceInstance = kommonitorMapService;

  $scope.loadingData = true;
  $scope.changeIndicatorWasClicked = false;

  $scope.dateSlider;
  $scope.datePicker;
  $scope.datesAsMs;

  $scope.selectedDate;								

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
  this.onClickTheme = function(topicName){

    for(const topic of this.kommonitorDataExchangeServiceInstance.availableTopics){
      if(topic.topicName === topicName){
        document.getElementById(topicName).setAttribute("class", "active");
        this.kommonitorDataExchangeServiceInstance.selectedTopic = topic;
      }
      else {
        if(document.getElementById(topic.topicName)){
          document.getElementById(topic.topicName).setAttribute("class", "");
        }
      }
    };

    if(kommonitorDataExchangeService.selectedIndicator){
      kommonitorDataExchangeService.selectedIndicatorBackup = kommonitorDataExchangeService.selectedIndicator;
    }

    // $scope.$digest();
  };

  this.unsetTopic = function(){
    this.kommonitorDataExchangeServiceInstance.selectedTopic = null;

    for(const topic of this.kommonitorDataExchangeServiceInstance.availableTopics){
      if (document.getElementById(topic.topicName)){
          document.getElementById(topic.topicName).setAttribute("class", "");
      }
    };

    if(!kommonitorDataExchangeService.selectedIndicator){
      kommonitorDataExchangeService.selectedIndicator = kommonitorDataExchangeService.selectedIndicatorBackup;
    }

    // $scope.$digest();
  };

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

  // load exemplar indicator
  $scope.$on("initialMetadataLoadingCompleted", function (event) {

    console.log("Load an initial example indicator");

    if (kommonitorDataExchangeService.displayableIndicators == null || kommonitorDataExchangeService.displayableIndicators == undefined || kommonitorDataExchangeService.displayableIndicators.length === 0){
      console.error("Kein darstellbarer Indikator konnte gefunden werden.");

      kommonitorDataExchangeService.displayMapApplicationError("Kein darstellbarer Indikator konnte gefunden werden.");										
      $scope.loadingData = false;
      $scope.$broadcast("hideLoadingIconOnMap");

      return;
    }

    try{
      var indicatorIndex = undefined;

      for (var index=0; index < kommonitorDataExchangeService.displayableIndicators.length; index++){
        if (kommonitorDataExchangeService.displayableIndicators[index].indicatorId === __env.initialIndicatorId){
          if(kommonitorDataExchangeService.displayableIndicators[index].applicableDates.length > 0){
            indicatorIndex = index;
            break;
          }											
        }
      }

      if( indicatorIndex === undefined){
          for(var t=0; t < 75; t++){
            
            var randIndex = getRandomInt(0, kommonitorDataExchangeService.displayableIndicators.length - 1);
            if (kommonitorDataExchangeService.displayableIndicators[randIndex].applicableDates.length > 0){
              indicatorIndex = randIndex;
              break;
            }													
          }
      }

      if( indicatorIndex === undefined){
        throw Error();
      }

      kommonitorDataExchangeService.selectedIndicator = kommonitorDataExchangeService.displayableIndicators[indicatorIndex];
      // create Backup which is used when currently selected indicator is filtered out in select
      kommonitorDataExchangeService.selectedIndicatorBackup = kommonitorDataExchangeService.selectedIndicator;

      // set spatialUnit
      for (var spatialUnitEntry of kommonitorDataExchangeService.availableSpatialUnits){
        if(spatialUnitEntry.spatialUnitLevel === __env.initialSpatialUnitName){
          kommonitorDataExchangeService.selectedSpatialUnit = spatialUnitEntry;
          break;
        }
      }
      if(!kommonitorDataExchangeService.selectedSpatialUnit){
          kommonitorDataExchangeService.selectedSpatialUnit = $scope.getFirstSpatialUnitForSelectedIndicator();
      }

      if(! __env.centerMapInitially){
        $scope.onChangeSelectedIndicator(false);	
      }
      else{
        $scope.onChangeSelectedIndicator(true);	
      }
                        

    }
    catch(error){
      console.error("Initiales Darstellen eines Indikators ist gescheitert.");

      kommonitorDataExchangeService.displayMapApplicationError("Initiales Darstellen eines Indikators ist gescheitert.");										
      $scope.loadingData = false;
      $scope.$broadcast("hideLoadingIconOnMap");

      return;
    }

    //reinit visibility of elements due to fact that now some HTML elements are actually available
    kommonitorElementVisibilityHelperService.initElementVisibility();
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
    console.log("call me")
    
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

    // todo
    /* if(this.dateSlider){
        this.dateSlider.destroy();
    }

    var domNode:HTMLElement | null = document.getElementById("dateSlider");

    if(domNode) {
      while (domNode!.hasChildNodes()) {
        domNode.removeChild(domNode.lastChild!);
      }
    } */

    var availableDates = this.exchangeData.selectedIndicator.applicableDates;
    this.date = availableDates[availableDates.length - 1];
    this.selectedDate = availableDates[availableDates.length - 1];
    this.exchangeData.selectedDate = availableDates[availableDates.length - 1];

    this.datesAsMs = this.createDatesFromIndicatorDates(this.exchangeData.selectedIndicator.applicableDates);

    // new Date() uses month between 0-11!
    // todo
   /*  $("#dateSlider").ionRangeSlider({
        skin: "big",
        type: "single",
        grid: true,
        values: this.datesAsMs,
        from: this.datesAsMs.length -1, // index, not the date
        force_edges: true,
        prettify: prettifyDateSliderLabels,
        onChange: this.onChangeDateSliderItem
    }); */

    //todo
    // this.dateSlider = $("#dateSlider").data("ionRangeSlider");
    // make sure that the handle is properly set to max value
   /*  this.dateSlider.update({
        from: this.datesAsMs.length -1 // index, not the date
    }); */
  };

  setupDatePickerForIndicator(){

      // todo
  /*   if(this.datePicker){
      $('#indicatorDatePicker').datepicker('destroy');
      this.datePicker = undefined;
    }

    var domNode:HTMLElement | null = document.getElementById("indicatorDatePicker");

    if(domNode) {
      while (domNode.hasChildNodes()) {
        domNode.removeChild(domNode.lastChild!);
      }
    } */

    var availableDates = this.exchangeData.selectedIndicator.applicableDates;
    this.date = availableDates[availableDates.length - 1];
    this.selectedDate = availableDates[availableDates.length - 1];
    this.exchangeData.selectedDate = availableDates[availableDates.length - 1];

    // todo
    //this.datePicker = $('#indicatorDatePicker').datepicker(this.dataExchangeService.getLimitedDatePickerOptions(availableDates));																		
    
  };
/*

  $scope.onChangeDateSliderItem = async function(data){

    if(!$scope.changeIndicatorWasClicked && kommonitorDataExchangeService.selectedIndicator){
      $scope.loadingData = true;
      $rootScope.$broadcast("showLoadingIconOnMap");

      console.log("Change selected date");

      //data.from is index of date!

      $scope.selectedDate = kommonitorDataExchangeService.selectedIndicator.applicableDates[data.from];
      $scope.date = $scope.selectedDate;
      kommonitorDataExchangeService.selectedDate = $scope.selectedDate;

      $('#indicatorDatePicker').datepicker('update', new Date(kommonitorDataExchangeService.selectedDate));

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
        $rootScope.$broadcast('applyNoDataDisplay')

      $scope.loadingData = false;
      $rootScope.$broadcast("hideLoadingIconOnMap");
      $rootScope.$broadcast("selectedIndicatorDateHasChanged");
      $rootScope.$apply();
    }
  };

  $scope.$on("DisableDateSlider", function (event) {
    if($scope.dateSlider){
      $scope.dateSlider.update({
          block: true
      });
    }

    kommonitorDataExchangeService.disableIndicatorDatePicker = true;
  });

  $scope.$on("EnableDateSlider", function (event) {
    if($scope.dateSlider){
      $scope.dateSlider.update({
          block: false
      });
    }

    kommonitorDataExchangeService.disableIndicatorDatePicker = false;
  });

  var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
  */
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

    // todo

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

  $scope.$on("changeIndicatorDate", async function(event){	
    
    if(kommonitorDataExchangeService.selectedIndicator && kommonitorDataExchangeService.selectedDate){
      $scope.loadingData = true;
      $rootScope.$broadcast("showLoadingIconOnMap");

      console.log("Change selected date");

      //data.from is index of date!
      var index = kommonitorDataExchangeService.selectedIndicator.applicableDates.indexOf(kommonitorDataExchangeService.selectedDate);									;

      $scope.dateSlider.update({
        from: index // index, not the date
      });

      $scope.date = kommonitorDataExchangeService.selectedDate;
      $scope.selectedDate = kommonitorDataExchangeService.selectedDate;

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
        $rootScope.$broadcast('applyNoDataDisplay')	

      $scope.loadingData = false;
      $rootScope.$broadcast("hideLoadingIconOnMap");
      $rootScope.$broadcast("selectedIndicatorDateHasChanged");
      $rootScope.$apply();
    }

  });

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

      // todo
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

    //todo
    //7$rootScope.$broadcast("updateBalanceSlider", this.exchangeData.selectedDate);
    this.broadcastService.broadcast("updateBalanceSlider", [this.exchangeData.selectedDate]);
    //$rootScope.$broadcast("updateIndicatorValueRangeFilter", this.exchangeData.selectedDate, this.exchangeData.selectedIndicator);
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
