import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { error } from 'jquery';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchange, DataExchangeService, IndicatorTopic } from 'services/data-exchange-service/data-exchange.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { MapService } from 'services/map-service/map.service';
import * as noUiSlider from 'nouislider';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FavService } from 'services/fav-service/fav.service';

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
  
  indicatorFavTopicsTree:any[] = [];
  indicatorFavTopicsTreePimped:any = {};

  indicatorTopicFavItems:any[] = []; 
  indicatorFavItems:any[] = [];

  // own temp list as fav items should remain visible in fav-tab even if deleted, until save/reload
  FavTabIndicatorTopicFavItems:any[] = []; 
  FavTabIndicatorFavItems:any[] = [];

  headlineIndicatorFavItems:any[] = [];
  baseIndicatorFavItems:any[] = [];
  favSelectionToastStatus = 0;
  showFavSelection = false;

  favSelectionToastText = ['',
    'Favoriten-Auswahl nicht gesichert. Zum speichern hier klicken',
    'Auswahl erfolgreich gespeichert'];

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
    protected dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService,
    private elementVisibilityHelperService: ElementVisibilityHelperService,
    private mapService: MapService,
    private http: HttpClient,
    private favService: FavService
  ) {}

  ngOnInit(): void {
    this.exchangeData = this.dataExchangeService.pipedData;

    this.setupSlider();

    // todo like "initialMetadataLoadingCompleted"
    window.setTimeout( () => {

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
        case 'changeSpatialUnit': {
          this.onChangeSelectedSpatialUnit();
        } break;
        case 'updateIndicatorOgcServices': {
          this.updateIndicatorOgcServices(values);
        } break;
        case 'favItemsStored': {
          this.onSaveFavSelection(values); 
          // why called again?! button click calls onSaveFavSelection(true), which saves and broadcasts onSaveFavSelection(false) again ... // todo, check
        } break;
        case 'LIKEinitialMetadataLoadingCompleted': {
          this.onInitialMetadataLoadingComplete();
        } break;
      }
    });
  }
  
  setupSlider() {
    this.dateSlider = document.getElementById('dateSlider');

    noUiSlider.cssClasses.target += ' custom-dateSlider';
    noUiSlider.create(this.dateSlider, this.config);
  }

  onInitialMetadataLoadingComplete() {
    console.log("Load an initial example indicator");

    this.preppedIndicatorTopics = this.prepareIndicatorTopicsRecursive(this.exchangeData.topicIndicatorHierarchy);

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

    this.indicatorFavTopicsTree = this.prepTopicsTree(this.dataExchangeService.pipedData.topicIndicatorHierarchy,0,undefined);
    this.indicatorFavTopicsTreePimped = {
      topicName: 'Test',
      subTopics: this.prepTopicsTree(this.dataExchangeService.pipedData.topicIndicatorHierarchy,0,undefined)
    };
    this.addClickListenerToEachCollapseTrigger();

    var userInfo = this.favService.getUserInfo();
    if(userInfo.indicatorFavourites) {
      this.indicatorFavItems = userInfo.indicatorFavourites;
      this.FavTabIndicatorFavItems = userInfo.indicatorFavourites;
    }
    
    if(userInfo.indicatorFavourites) {
      this.indicatorTopicFavItems = userInfo.indicatorTopicFavourites;
      this.FavTabIndicatorTopicFavItems = userInfo.indicatorTopicFavourites;
    }

    if(this.elementVisibilityHelperService.elementVisibility.favSelection===true)
      this.showFavSelection = true;
  }

  prepTopicsTree(tree, level, parent) {
    tree.forEach(entry => {
      entry.level = level;
      entry.parent = parent

      if(entry.subTopics.length>0) {
        let newLevel = level+1;
        entry.subTopics = this.prepTopicsTree(entry.subTopics, newLevel, entry.topicId);
      }
    });

    return tree;
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

      // addClass "clickBound" sets trigger, that listener has been added, not:.clickBound filters for that. otherwise multiple listeners will be added
      $('.list-group-item > .indicatorFavCollapseTrigger:not(.clickBound)').addClass('clickBound').on('click', (e) => {
        $('.glyphicon', e)
          .toggleClass('glyphicon-chevron-right')
          .toggleClass('glyphicon-chevron-down');

        // manage entries;
        // todo rebuild dirty elem[0] structure, maybe with ngb
        let elem:any = $(e);
        var clickedTopicId = elem[0].currentTarget.id;
        if(document.getElementById('indicatorFavSubTopic-'+clickedTopicId)?.style.display=='none')
          document.getElementById('indicatorFavSubTopic-'+clickedTopicId)!.style.display = 'block';
        else
          document.getElementById('indicatorFavSubTopic-'+clickedTopicId)!.style!.display = 'none';
      });
    }, 500);
  };

/*
					

  this.addGeopackage(){
    this.kommonitorMapServiceInstance.addSpatialUnitGeopackage();
  }
  this.addGeoJSON(){
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
 
  $scope.filterGeoresourcesByIndicator() {
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

  $scope.filterReferencedIndicatorsByIndicator() {
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

  $scope.filterGeoresourcesByTopic() {
    return function( item ) {
      if (kommonitorDataExchangeService.selectedTopic)
        return item.applicableTopics.includes(kommonitorDataExchangeService.selectedTopic.topicName);

      return true;
    };
  };

  $scope.filterSpatialUnitsByIndicator() {
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
  this.onDateChange(){

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

  $scope.$on("initialMetadataLoadingFailed", (event, errorArray) {

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
  this.addSelectedSpatialUnitToMap() {
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
    }).then(successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON = response.data;

        kommonitorDataExchangeService.selectedSpatialUnit.geoJSON = geoJSON;

        kommonitorMapService.addSpatialUnitGeoJSON(kommonitorDataExchangeService.selectedSpatialUnit, $scope.date);
        $scope.loadingData = false;
        $rootScope.$broadcast("hideLoadingIconOnMap");

      }, errorCallback(error) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        $scope.loadingData = false;
        kommonitorDataExchangeService.displayMapApplicationError(error);
        $rootScope.$broadcast("hideLoadingIconOnMap");
    });
  };

  this.addSelectedSpatialUnitToMapAsWFS() {
    $scope.loadingData = true;
    $rootScope.$broadcast("showLoadingIconOnMap");

    var metadata = kommonitorDataExchangeService.selectedSpatialUnit;

    var name = metadata.spatialUnitLevel;

    var wfsUrl = metadata.wfsUrl;

    kommonitorMapService.addSpatialUnitWFS(name, wfsUrl);
    $scope.loadingData = false;
    $rootScope.$broadcast("hideLoadingIconOnMap");

  };

  this.addSelectedGeoresourceToMap() {
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
    }).then(successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON = response.data;

        kommonitorDataExchangeService.selectedGeoresource.geoJSON = geoJSON;

        kommonitorMapService.addGeoresourceGeoJSON(kommonitorDataExchangeService.selectedGeoresource, $scope.date);
        $scope.loadingData = false;
        $rootScope.$broadcast("hideLoadingIconOnMap");

      }, errorCallback(error) {
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
  prettifyDateSlidertopicNames (dateAsMs) {
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
   console.log(this.datesAsMs)
    this.dateSlider.noUiSlider.updateOptions({
      range: {
          'min': 0, // index from
          'max': this.datesAsMs.length-1 // index to
      },
      start: [this.datesAsMs.length-1 ], // index 
      step: 1,
      tooltips: true,
      format: {
        to: (value) => { // test
          console.log("to",value)
          if(value)
            return this.tsToDateString(this.datesAsMs[Math.round(value)]);    
          else
            return;
        },
        from: (value) => { 
          return this.datesAsMs[value];
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
  
    this.dateSlider.noUiSlider.on('end', () => {
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
    console.log(dateStr)
    let parts = dateStr.split(' ');
    // get timezoneOffset w/o daylight saving time by referencing a specific date
    let offset = new Date('November 1, 2000 00:00:00').getTimezoneOffset()*60*1000;
   
    let tms = new Date(parts[2]+'-'+(this.months.indexOf(parts[1])+1)+'-'+parts[0].replace('.','')+'T00:00:00Z').getTime();
    return tms+offset;
  }

  tsToDateString (dateAsMs) {
    var date = new Date(dateAsMs);
    return date.getFullYear();

    /* return date.toLocaleDateString("de-DE", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }); */
  }

  setupDatePickerForIndicator(){

    var availableDates = this.exchangeData.selectedIndicator.applicableDates;
    this.date = availableDates[availableDates.length - 1];
    this.selectedDate = availableDates[availableDates.length - 1];
    this.exchangeData.selectedDate = availableDates[availableDates.length - 1];

    let ngbDates = this.prepNgbDates(availableDates);
    this.broadcastService.broadcast('updateDatePickerAvailableDates',[ngbDates]);																
    this.broadcastService.broadcast('updateDatePickerSelectedDate',[ngbDates[ngbDates.length-1]]);		
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
      this.dataExchangeService.displayMapApplicationError("Beim Versuch, einen Beispielindikator zu laden, ist ein Fehler aufgetreten. Der Datenbankeintrag scheint eine fehlerhafte Kombination aus Raumebene und Zeitschnitt zu enthalten.");
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

  datePickerToDateSlider(datePickerDate:NgbDateStruct) {

    return `${datePickerDate.day}. ${this.months[datePickerDate.month-1]} ${datePickerDate.year}`;
  }

  changeIndicatorDate([datePickerDate]){	
    console.log(datePickerDate);
    if(this.exchangeData.selectedIndicator && this.exchangeData.selectedDate){
      this.loadingData = true;
      this.broadcastService.broadcast("showLoadingIconOnMap");

      console.log("Change selected date");

      console.log(this.datesAsMs)

      // hier problem, wählt nicht das korrekte datum aus
     /*  this.dateSlider.noUiSlider.updateOptions({
        start: [ this.datePickerToDateSlider(datePickerDate) ],
      }); */

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

  onChangeSelectedSpatialUnit(){
    if(!this.changeIndicatorWasClicked && this.exchangeData.selectedIndicator){
      this.loadingData = true;
      this.broadcastService.broadcast("showLoadingIconOnMap");

      console.log("Change spatial unit");

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
        this.broadcastService.broadcast('applyNoDataDisplay');

      this.loadingData = false;
      this.broadcastService.broadcast("hideLoadingIconOnMap");
    }
  }

  markAssociatedHierarchyElement(selectedIndicatorMetadata){
    var selectedIndicatorId = selectedIndicatorMetadata.indicatorId;

    setTimeout(() => {
      for (var indicator of this.exchangeData.displayableIndicators) {
        $("#indicatorHierarchyElement-" + indicator.indicatorId).removeClass('active');
      }

      $("#indicatorHierarchyElement-" + selectedIndicatorId).addClass('active');
    },500);
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
    },1000); 
    // time here seems to be crucial, "500" does not work.. maybe fix, maybe leave it

    this.addSelectedIndicatorToMap(changeIndicator);

  }

  updateIndicatorOgcServices([indicatorWmsUrl, indicatorWfsUrl]) {

    console.log('updateIndicatorOgcServices was called');

    this.exchangeData.wmsUrlForSelectedIndicator = indicatorWmsUrl;
    this.exchangeData.wfsUrlForSelectedIndicator = indicatorWfsUrl;
  }

  public favTabShowTopic(topic) {
    if(this.topicOrIndicatorInFavRecursive([topic]) || this.topicInFavTopBottom(topic))
      return true;

    return false;
  }

  favTabShowIndicator(indicatorId, topic) {

    if(this.FavTabIndicatorFavItems.includes(indicatorId) || this.topicInFavTopBottom(topic))
      return true;

    return false;
  }

  topicInFavTopBottom(topic) {

    var parentNext = topic.parent;
    var ret = false;

    if(this.FavTabIndicatorTopicFavItems.includes(topic.topicId))
      ret = true;

    while(parentNext!==undefined && ret===false) {
      ret = this.parentInFavRecursive(this.indicatorFavTopicsTree, parentNext);
      if(ret===false)
        parentNext = this.findParentNextRecursive(this.indicatorFavTopicsTree, parentNext);
    }

    return ret;
  }

  parentInFavRecursive(tree, parentId) {

    var ret = false;
    tree.forEach(elem => {

      if(elem.topicId==parentId && this.FavTabIndicatorTopicFavItems.includes(parentId))
          ret = true;

      if(elem.subTopics && elem.subTopics.length>0 && ret===false) 
        ret = this.parentInFavRecursive(elem.subTopics, parentId);
    });

    return ret;
  }

  findParentNextRecursive(tree, parent) {

    var parentNext = undefined;
    tree.forEach(elem => {

      if(elem.topicId==parent) {
        parentNext = elem.parent;
      }

      if(elem.subTopics && elem.subTopics.length>0 && parentNext===undefined)
        parentNext = this.findParentNextRecursive(elem.subTopics, parent);
    });

    return parentNext;
  }

  topicOrIndicatorInFavRecursive(tree) {

    let ret = false;
    tree.forEach(elem => {

      if(this.FavTabIndicatorTopicFavItems.includes(elem.topicId) || this.FavTabIndicatorFavItems.includes(elem.indicatorId))
        ret = true;

      if(elem.subTopics && elem.subTopics.length>0 && ret===false)
        ret = this.topicOrIndicatorInFavRecursive(elem.subTopics);

      if(elem.indicatorData && elem.indicatorData.length>0 && ret===false)
        ret = this.topicOrIndicatorInFavRecursive(elem.indicatorData);
    });

    return ret;
  }

  indicatorTopicFavSelected(topicId) {
    return this.indicatorTopicFavItems.includes(topicId);
  }

  indicatorFavSelected(topicId) {
    return this.indicatorFavItems.includes(topicId);
  }

  headlineIndicatorFavSelected(topicId) {
    return this.indicatorFavItems.includes(topicId);
  }

  baseIndicatorFavSelected(topicId) {
    return this.indicatorFavItems.includes(topicId);
  }

  searchIndicatorTopicFavItemsRecursive(tree, id, selected) {

    let ret = false;

    tree.forEach(entry => {
      if(entry.topicId==id) {
        if(selected===true) {
          if(!this.indicatorTopicFavItems.includes(id))
            this.indicatorTopicFavItems.push(id);
        } else
          this.indicatorTopicFavItems = this.indicatorTopicFavItems.filter(e => e!=id);

        // recursive selection of topics / indicators
        /*  if(entry.subTopics.length>0)
          checkIndicatorTopicFavItemsRecursive(entry.subTopics, selected);
        if(entry.indicatorData.length>0)
          checkIndicatorMetadataFavItems(entry.indicatorData, selected); */

        ret = true;
      } else {
        let itemFound = this.searchIndicatorTopicFavItemsRecursive(entry.subTopics, id, selected);
        if(itemFound===true) 
          ret = true;
      }
    });

    return ret;
  }

  checkIndicatorTopicFavItemsRecursive(tree, selected) {
    tree.forEach(entry => {
      if(selected===true) {
        if(!this.indicatorTopicFavItems.includes(entry.topicId))
          this.indicatorTopicFavItems.push(entry.topicId);
      } else
        this.indicatorTopicFavItems = this.indicatorTopicFavItems.filter(e => e!=entry.topicId);

      if(entry.subTopics.length>0)
        this.checkIndicatorTopicFavItemsRecursive(entry.subTopics, selected);

      if(entry.indicatorData.length>0)
        this.checkIndicatorMetadataFavItems(entry.indicatorData, selected);
    });
  }

  checkIndicatorMetadataFavItems(tree, selected) {
    tree.forEach(entry => {
      if(selected===true) {
        if(!this.indicatorFavItems.includes(entry.indicatorId))
          this.indicatorFavItems.push(entry.indicatorId);
      } else {
        this.indicatorFavItems = this.indicatorFavItems.filter(e => e!=entry.indicatorId);
      }
    });
  }

  checkBaseIndicatorFavItems(id, selected) {
    this.dataExchangeService.pipedData.headlineIndicatorHierarchy.forEach(entry => {
      if(entry.headlineIndicator.indicatorId==id) {

        entry.baseIndicators.forEach(base => {
          if(selected===true) {
            if(!this.indicatorFavItems.includes(entry.indicatorId))
              this.indicatorFavItems.push(base.indicatorId);
          } else {
            this.indicatorFavItems = this.indicatorFavItems.filter(e => e!=base.indicatorId);
          }
        });
      }
    });
  }

  onIndicatorTopicFavClick(topicId, favTab = false) {
    if(!this.indicatorTopicFavItems.includes(topicId))
      this.searchIndicatorTopicFavItemsRecursive(this.dataExchangeService.pipedData.topicIndicatorHierarchy, topicId, true);
    else
      this.searchIndicatorTopicFavItemsRecursive(this.dataExchangeService.pipedData.topicIndicatorHierarchy, topicId, false);

    this.onHandleFavSelection(favTab);
  }

  onIndicatorFavClick(id, favTab = false) {
    if(!this.indicatorFavItems.includes(id))
      this.indicatorFavItems.push(id);
    else
      this.indicatorFavItems = this.indicatorFavItems.filter(e => e!=id);

    this.onHandleFavSelection(favTab);
  }

  onHeadlineIndicatorFavClick(id) {
    if(!this.indicatorFavItems.includes(id)) {
      this.indicatorFavItems.push(id);
      this.checkBaseIndicatorFavItems(id, true);
    } else {
      this.indicatorFavItems = this.indicatorFavItems.filter(e => e!=id);
      this.checkBaseIndicatorFavItems(id, false);
    }

    this.onHandleFavSelection();
  }

  onBaseIndicatorFavClick(id) {
    if(!this.indicatorFavItems.includes(id))
      this.indicatorFavItems.push(id);
    else
      this.indicatorFavItems = this.indicatorFavItems.filter(e => e!=id);

    this.onHandleFavSelection();
  }

  onHandleFavSelection(favTab = false) {

    if(favTab===false) {
      this.FavTabIndicatorTopicFavItems = this.indicatorTopicFavItems;
      this.FavTabIndicatorFavItems = this.indicatorFavItems;
    }

    this.handleToastStatus(1);

    this.favService.handleFavSelection({
      indicatorTopicFavourites: this.indicatorTopicFavItems,
      indicatorFavourites: this.indicatorFavItems
    });

    this.addClickListenerToEachCollapseTrigger();
  }

  onSaveFavSelection([broadcast]) {
    if(broadcast===true)
      this.favService.storeFavSelection();

    this.FavTabIndicatorTopicFavItems = this.indicatorTopicFavItems;
    this.FavTabIndicatorFavItems = this.indicatorFavItems;

    this.handleToastStatus(2);

    if(broadcast===true)
      this.broadcastService.broadcast("favItemsStored",[false]);
  }

  handleToastStatus(type) {
    this.favSelectionToastStatus = type;

    if(type==2) {
      setTimeout(() => {
        this.favSelectionToastStatus = 0;
      },1000);
    }
  }
}
