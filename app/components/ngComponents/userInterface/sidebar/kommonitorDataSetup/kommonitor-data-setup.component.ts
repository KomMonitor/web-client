import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { MapService } from 'services/map-service/map.service';
import * as noUiSlider from 'nouislider';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FavService } from 'services/fav-service/fav.service';
import { IndicatorsTopicsHierarchy } from 'components/ngComponents/models/indicators.models';
import { AdminTopicsManagementService } from '../../../admin/adminTopicsManagement/admin-topics-management.service';
import { TopicOrderMode } from '../../../admin/adminTopicsManagement/admin-topics-management.component';
import { OgcService } from 'services/ogcServices/ogc.service';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { UserFavourites } from 'components/ngComponents/models/favorites.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndicatorMetadataTooltipComponent } from 'components/ngComponents/customElements/indicator-metadata-tooltip/indicator-metadata-tooltip.component';
import { IndicatorFavFilter } from 'pipes/indicator-fav-filter.pipe';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Component({
  selector: 'app-kommonitor-data-setup',
  templateUrl: './kommonitor-data-setup.component.html',
  styleUrls: ['./kommonitor-data-setup.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IndicatorMetadataTooltipComponent, IndicatorFavFilter, ExpandableBoxComponent]
})
export class KommonitorDataSetupComponent implements OnInit {

  topicsCollapsed:string[] = [];
  headlineTopicsCollapsed:string[] = [];

  isCollapsed_headlineIndicatorHierarchyItem = true;

  loadingData = true;
  changeIndicatorWasClicked = false;
  spatialUnitName!:any;
  date!:any;

  datePicker;
  datesAsMs;
  
  indicatorNameFilter = undefined;

  selectedDate;		
  
  indicatorFavTopicsTree:any[] = [];
  indicatorFavTopicsTreePimped:any = {};

  indicatorTopicFavItems:any[] = []; 
  indicatorFavItems:any[] = [];
  wmsFavItems:any[] = [];

  // own temp list as fav items should remain visible in fav-tab even if deleted, until save/reload
  FavTabIndicatorTopicFavItems:any[] = []; 
  FavTabIndicatorFavItems:any[] = [];
  FavTabWmsFavItems:any[] = [];

  headlineIndicatorFavItems:any[] = [];
  baseIndicatorFavItems:any[] = [];
  favSelectionToastStatus = 0;
  showFavSelection = false;

  favSelectionToastText = ['',
    'Favoriten-Auswahl nicht gesichert. Zum speichern hier klicken',
    'Auswahl erfolgreich gespeichert'];

  preppedIndicatorTopics: IndicatorsTopicsHierarchy[] = [];
  preppedKeywordList: any[] = [];
  topicSorting: TopicOrderMode | undefined;

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
    private favService: FavService,
    private adminTopicsManagementService: AdminTopicsManagementService,
    protected ogcService: OgcService,
    private envConfigService: EnvConfigService
  ) { }

  ngOnInit(): void {

    this.adminTopicsManagementService.getOrderMode("indicator").subscribe((res) => this.topicSorting = res);

    this.setupSlider();

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
        case 'initialMetadataLoadingCompleted': {
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

    this.preppedIndicatorTopics = this.prepareIndicatorTopicsRecursive(this.dataExchangeService.topicIndicatorHierarchy);
    this.preppedKeywordList = this.prepareKeywordFilteredList();

    this.prepareHeadlineIndicatorTopics();

    if (this.dataExchangeService.displayableIndicators == null || this.dataExchangeService.displayableIndicators == undefined || this.dataExchangeService.displayableIndicators.length === 0){
      console.error("Kein darstellbarer Indikator konnte gefunden werden.");

      this.dataExchangeService.displayMapApplicationError("Kein darstellbarer Indikator konnte gefunden werden.");										
      this.loadingData = false;
      
      this.broadcastService.broadcast('hideLoadingIconOnMap');

      return;
    }

    try{
      var indicatorIndex:any = undefined;

      for (var index=0; index < this.dataExchangeService.displayableIndicators.length; index++){
        if (this.dataExchangeService.displayableIndicators[index].indicatorId === this.envConfigService.initialIndicatorId){
          if(this.dataExchangeService.displayableIndicators[index].applicableDates.length > 0){
            indicatorIndex = index;
            break;
          }											
        }
      }

      if( indicatorIndex === undefined){
          for(var t=0; t < 75; t++){
            
            var randIndex = this.getRandomInt(0, this.dataExchangeService.displayableIndicators.length - 1);
            if (this.dataExchangeService.displayableIndicators[randIndex].applicableDates.length > 0){
              indicatorIndex = randIndex;
              break;
            }													
          }
      }

      if( indicatorIndex === undefined){
        throw Error();
      }

      this.dataExchangeService.selectedIndicator = this.dataExchangeService.displayableIndicators[indicatorIndex];
      // create Backup which is used when currently selected indicator is filtered out in select
      this.dataExchangeService.selectedIndicatorBackup = this.dataExchangeService.selectedIndicator;

      // set spatialUnit
      for (var spatialUnitEntry of this.dataExchangeService.availableSpatialUnits){
        if(spatialUnitEntry.spatialUnitLevel === this.envConfigService.initialSpatialUnitName){
          this.dataExchangeService.selectedSpatialUnit = spatialUnitEntry;
          break;
        }
      }
      if(!this.dataExchangeService.selectedSpatialUnit){
          this.dataExchangeService.selectedSpatialUnit = this.getFirstSpatialUnitForSelectedIndicator();
      }

      if(! this.envConfigService.centerMapInitially){
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

    var userInfo:UserFavourites = this.favService.getUserInfo();
    if(userInfo.indicatorFavourites) {
      this.indicatorFavItems = userInfo.indicatorFavourites;
      this.FavTabIndicatorFavItems = userInfo.indicatorFavourites;
    }
    
    if(userInfo.indicatorFavourites) {
      this.indicatorTopicFavItems = userInfo.indicatorTopicFavourites;
      this.FavTabIndicatorTopicFavItems = userInfo.indicatorTopicFavourites;
    }

    setTimeout(() => {
    if(this.elementVisibilityHelperService.elementVisibility.favSelection===true)
      this.showFavSelection = true;
    },1000)

    this.indicatorFavTopicsTree = this.prepTopicsTree(this.dataExchangeService.topicIndicatorHierarchy,0,undefined);
    this.indicatorFavTopicsTreePimped = {
      topicName: 'Test',
      subTopics: this.prepTopicsTree(this.dataExchangeService.topicIndicatorHierarchy,0,undefined)
    };
    this.addClickListenerToEachCollapseTrigger();
  }


  prepareKeywordFilteredList() {

    let indicators = this.dataExchangeService.displayableIndicators_keywordFiltered.map(item => ({
      ...item,
      listType: 'indicator'
    }));
    let wms = this.dataExchangeService.getAvailableIndiWmsDatasets().map(item => ({
      ...item,
      listType: 'wms'
    }));

    const mergedAndSorted = [...indicators, ...wms].sort((a, b) => {
      const aKey = (a.indicatorName ?? a.title)?.toLowerCase() ?? '';
      const bKey = (b.indicatorName ?? b.title)?.toLowerCase() ?? '';

      return aKey.localeCompare(bKey);
    });

    console.log(mergedAndSorted)

    return mergedAndSorted;
  }


  prepareHeadlineIndicatorTopics() {
    this.dataExchangeService.headlineIndicatorHierarchy.forEach( (elem:any) => {

      if(!this.headlineTopicsCollapsed.includes(elem.headlineIndicator.indicatorId))
        this.headlineTopicsCollapsed.push(elem.headlineIndicator.indicatorId);
    });
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

  prepareIndicatorTopicsRecursive(tree:IndicatorsTopicsHierarchy[]) {
    // filter out topics with no indicators
    let retTree = tree.filter(e => e.indicatorCount>0);

    // sort according to current sorting mode
    if (this.topicSorting === "custom") {
      retTree = retTree.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    if (this.topicSorting === "alphabetical") {
      retTree = retTree.sort((a, b) => (a.topicName > b.topicName ? 1 : -1));
    }

    retTree.forEach( (elem:IndicatorsTopicsHierarchy) => {

      if(!this.topicsCollapsed.includes(elem.topicId))
        this.topicsCollapsed.push(elem.topicId);

      if(elem.subTopics.length>0) {
        elem.subTopics = this.prepareIndicatorTopicsRecursive(elem.subTopics);
      }
    });

    return retTree;
  }
  
  onHeadlineTopicClick(topicID:string) {
    if(this.headlineTopicsCollapsed.includes(topicID))
      this.headlineTopicsCollapsed = this.headlineTopicsCollapsed.filter(e => e!=topicID);
    else
      this.headlineTopicsCollapsed.push(topicID);
  }

  onTopicClick(topicID:string) {
    if(this.topicsCollapsed.includes(topicID))
      this.topicsCollapsed = this.topicsCollapsed.filter(e => e!=topicID);
    else
      this.topicsCollapsed.push(topicID);
  }

  addClickListenerToEachCollapseTrigger(){
    setTimeout(function(){

      // addClass "clickBound" sets trigger, that listener has been added, not:.clickBound filters for that. otherwise multiple listeners will be added
      $('.list-group-item > .indicatorFavCollapseTrigger:not(.clickBound)').addClass('clickBound').on('click', (e) => {

        // todo rebuild dirty elem[0] structure, maybe with ngb
        let elem:any = $(e);
        var clickedTopicId = elem[0].currentTarget.id;

        $('.glyphicon', clickedTopicId)
          .toggleClass('glyphicon-chevron-right')
          .toggleClass('glyphicon-chevron-down');

        // manage entries;
        
        if(document.getElementById('indicatorFavSubTopic-'+clickedTopicId)?.style.display=='none')
          document.getElementById('indicatorFavSubTopic-'+clickedTopicId)!.style.display = 'block';
        else
          document.getElementById('indicatorFavSubTopic-'+clickedTopicId)!.style!.display = 'none';
      });
    }, 1000);
  };

  isFavSubTopicCollapsed(topicId) {
    return (document.getElementById('indicatorFavSubTopic-'+topicId)!.style.display=='none');
  }

/*
					

  this.addGeopackage(){
    this.kommonitorMapServiceInstance.addSpatialUnitGeopackage();
  }
  this.addGeoJSON(){
    this.kommonitorMapServiceInstance.addSpatialUnitGeoJSON();
  }
  */
  onClickHierarchyIndicator(indicatorMetadata){
    this.dataExchangeService.selectedIndicator = indicatorMetadata;
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

      var applicableSpatialUnits = this.dataExchangeService.selectedIndicator.applicableSpatialUnits;

      for (const spatialUnitEntry of this.dataExchangeService.availableSpatialUnits){
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
      this.mapService.replaceIndicatorGeoJSON(this.dataExchangeService.selectedIndicator, this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel, this.selectedDate, false);
    }
    else {
      // check if balance mode is active
      if (this.dataExchangeService.isBalanceChecked){
        //todo
        // $rootScope.$broadcast("replaceBalancedIndicator");
      }
      else {
        this.mapService.replaceIndicatorGeoJSON(this.dataExchangeService.selectedIndicator, this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel, this.selectedDate, false);
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

    var availableDates = this.dataExchangeService.selectedIndicator.applicableDates;
    this.date = availableDates[availableDates.length - 1];
    this.selectedDate = availableDates[availableDates.length - 1];
    this.dataExchangeService.selectedDate = availableDates[availableDates.length - 1];

    this.datesAsMs = this.createDatesFromIndicatorDates(this.dataExchangeService.selectedIndicator.applicableDates);

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
    
    this.preppedIndicatorTopics = this.prepareIndicatorTopicsRecursive(this.dataExchangeService.topicIndicatorHierarchy);
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
    return date.getFullYear();

    /* return date.toLocaleDateString("de-DE", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }); */
  }

  setupDatePickerForIndicator(){

    var availableDates = this.dataExchangeService.selectedIndicator.applicableDates;
    this.date = availableDates[availableDates.length - 1];
    this.selectedDate = availableDates[availableDates.length - 1];
    this.dataExchangeService.selectedDate = availableDates[availableDates.length - 1];

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

    if(!this.changeIndicatorWasClicked && this.dataExchangeService.selectedIndicator){
      this.loadingData = true;
      this.broadcastService.broadcast("showLoadingIconOnMap");

      console.log("Change selected date");

      //data.from is index of date!

      this.selectedDate = this.dataExchangeService.selectedIndicator.applicableDates[data.from];
      this.date = this.selectedDate;
      this.dataExchangeService.selectedDate = this.selectedDate;

      let preppedDate = this.prepNgbDates([this.dataExchangeService.selectedDate])[0];
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

      if(this.envConfigService.useNoDataToggle)
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

    this.dataExchangeService.disableIndicatorDatePicker = true;
  }

  EnableDateSlider() {
    if(this.dateSlider){
      this.dateSlider.noUiSlider.enable();
    }

    this.dataExchangeService.disableIndicatorDatePicker = false;
  }

  tryUpdateMeasureOfValueBarForIndicator(){
    var indicatorId = this.dataExchangeService.selectedIndicator.indicatorId;

    if(! (this.date && this.dataExchangeService.selectedSpatialUnit && indicatorId)){
      this.dataExchangeService.displayMapApplicationError("Beim Versuch, einen Beispielindikator zu laden, ist ein Fehler aufgetreten. Der Datenbankeintrag scheint eine fehlerhafte Kombination aus Raumebene und Zeitschnitt zu enthalten.");
      throw Error("Not all parameters have been set up yet.");
    }										
    //
    // $scope.selectedDate = $scope.selectedDate;
    this.spatialUnitName = this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel;

    var dateComps = this.date.split("-");
    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + indicatorId + "/" + this.dataExchangeService.selectedSpatialUnit.spatialUnitId + "/" + year + "/" + month + "/" + day + "?" + this.dataExchangeService.simplifyGeometriesParameterName + "=" + this.dataExchangeService.simplifyGeometries;
    this.http.get(url).subscribe({
      next: (response:any) => {
        var geoJSON = response;

        this.dataExchangeService.selectedIndicator.geoJSON = geoJSON;

        this.broadcastService.broadcast('updateMeasureOfValueBar', [this.date, this.dataExchangeService.selectedIndicator]);

        return this.dataExchangeService.selectedIndicator;
      },
      error: (error) => {
        this.loadingData = false;
        this.dataExchangeService.displayMapApplicationError(error);

        this.broadcastService.broadcast('hideLoadingIconOnMap');

        return this.dataExchangeService.selectedIndicator;
      }
    });

  };

  datePickerToDateSlider(datePickerDate:NgbDateStruct) {

    return `${datePickerDate.day}. ${this.months[datePickerDate.month-1]} ${datePickerDate.year}`;
  }

  changeIndicatorDate([datePickerDate]){	

    if(this.dataExchangeService.selectedIndicator && this.dataExchangeService.selectedDate){
      this.loadingData = true;
      this.broadcastService.broadcast("showLoadingIconOnMap");

      console.log("Change selected date");

      // hier problem, wählt nicht das korrekte datum aus
     /*  this.dateSlider.noUiSlider.updateOptions({
        start: [ this.datePickerToDateSlider(datePickerDate) ],
      }); */

      this.date = this.dataExchangeService.selectedDate;
      this.selectedDate = this.dataExchangeService.selectedDate;

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

      if(this.envConfigService.useNoDataToggle)
        this.broadcastService.broadcast('applyNoDataDisplay')	

      this.loadingData = false;
      this.broadcastService.broadcast("hideLoadingIconOnMap");
      this.broadcastService.broadcast("selectedIndicatorDateHasChanged");
    }

  }

  onChangeSelectedSpatialUnit(){
    if(!this.changeIndicatorWasClicked && this.dataExchangeService.selectedIndicator){
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

      if(this.envConfigService.useNoDataToggle)
        this.broadcastService.broadcast('applyNoDataDisplay');

      this.loadingData = false;
      this.broadcastService.broadcast("hideLoadingIconOnMap");
    }
  }

  onChangeSelectedIndicator_fromAlphabeticalList(dataset){
    
    if(dataset.listType=='indicator') {
      this.dataExchangeService.selectedIndicator = dataset;
      this.onChangeSelectedIndicator(false);
    } else {
    
      // manually set "isSelected", to keep the model consistent, although not really necessary here
      dataset.isSelected = !dataset.isSelected;
      this.handleWmsOnMap(dataset);
    }
  };

  onChangeSelectedIndicator(recenterMap){

    this.broadcastService.broadcast('onChangeSelectedIndicator');
    
    if(this.dataExchangeService.selectedIndicator){

      this.loadingData = true;
      this.broadcastService.broadcast('showLoadingIconOnMap');

      this.changeIndicatorWasClicked = true;
     
      this.dataExchangeService.selectedIndicatorBackup = this.dataExchangeService.selectedIndicator;

      this.setupDateSliderForIndicator();
      this.setupDatePickerForIndicator();
      
      if(!this.dataExchangeService.selectedSpatialUnit || !this.dataExchangeService.selectedIndicator.applicableSpatialUnits.some(o => o.spatialUnitName === this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel)){
        this.dataExchangeService.selectedSpatialUnit = this.getFirstSpatialUnitForSelectedIndicator();
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

      if(this.envConfigService.useNoDataToggle) {
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
      if (this.dataExchangeService.selectedIndicatorBackup){
        this.dataExchangeService.selectedIndicator = this.dataExchangeService.selectedIndicatorBackup;
      }
    }
    this.broadcastService.broadcast('selectedIndicatorDateHasChanged');
  }

  modifyExports(changeIndicator){

    this.dataExchangeService.wmsUrlForSelectedIndicator = undefined;
    this.dataExchangeService.wfsUrlForSelectedIndicator = undefined;
    
    var selectedSpatialUnitName = this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel;

    for(const ogcServiceEntry of this.dataExchangeService.selectedIndicator.ogcServices){
      if (ogcServiceEntry.spatialUnit === selectedSpatialUnitName){
        this.dataExchangeService.wmsUrlForSelectedIndicator = ogcServiceEntry.wmsUrl;
        this.dataExchangeService.wfsUrlForSelectedIndicator = ogcServiceEntry.wfsUrl;
        break;
      }
    };

    this.broadcastService.broadcast("updateBalanceSlider", [this.dataExchangeService.selectedDate]);
    setTimeout(() => {
      this.broadcastService.broadcast("updateIndicatorValueRangeFilter", [this.dataExchangeService.selectedDate, this.dataExchangeService.selectedIndicator]);
    },1000); 
    // time here seems to be crucial, "500" does not work.. maybe fix, maybe leave it

    this.addSelectedIndicatorToMap(changeIndicator);

  }

  updateIndicatorOgcServices([indicatorWmsUrl, indicatorWfsUrl]) {

    console.log('updateIndicatorOgcServices was called');

    this.dataExchangeService.wmsUrlForSelectedIndicator = indicatorWmsUrl;
    this.dataExchangeService.wfsUrlForSelectedIndicator = indicatorWfsUrl;
  }

  public favTabShowTopic(topic:IndicatorsTopicsHierarchy) {
    if(this.matchInFavRecursive([topic]) || this.topicInFavTopBottom(topic))
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

  matchInFavRecursive(tree:IndicatorsTopicsHierarchy[]) {

    let ret = false;
    tree.forEach(elem => {

      if(this.FavTabIndicatorTopicFavItems.includes(elem.topicId))
        ret = true;

      if(elem.indicatorData.length>0 && ret===false) {
        ret = elem.indicatorData.some(indicator =>
          this.FavTabIndicatorFavItems.includes(indicator.indicatorId)
        );
      }
      
      if(elem.wmsData.length>0 && ret===false) {
        ret = elem.wmsData.some(wms =>
          this.FavTabWmsFavItems.includes(wms.id)
        );
      }
      
      if(elem.subTopics && elem.subTopics.length>0 && ret===false)
        ret = this.matchInFavRecursive(elem.subTopics);
    });

    return ret;
  }

  indicatorTopicFavSelected(topicId) {
    return this.indicatorTopicFavItems.includes(topicId);
  }

  indicatorFavSelected(indicatorId) {
    return this.indicatorFavItems.includes(indicatorId);
  }

  wmsFavSelected(wmsId) {
    return this.wmsFavItems.includes(wmsId);
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

  checkHierarchyIndicatorSelected(topic:IndicatorsTopicsHierarchy):boolean {

    return this.searchSelectedIndicatorRecursive(topic);
  }

  searchSelectedIndicatorRecursive(topic:IndicatorsTopicsHierarchy):boolean {
  
      let match = false;
  
      let indicatorMatch = topic.indicatorData.filter(e => e.indicatorId==this.dataExchangeService.selectedIndicator.indicatorId);
      let wmsMatch = topic.wmsData.filter(e => e.isSelected===true);

      if(indicatorMatch.length || wmsMatch.length) {
        match = true;
      } else {
        if(topic.subTopics.length) {
          topic.subTopics.forEach(subTopic => {
            let subMatch = this.searchSelectedIndicatorRecursive(subTopic);

            if(subMatch===true)
              match = subMatch;
          });
        }
      }
  
      return match;
    }

  checkBaseIndicatorFavItems(id, selected) {
    this.dataExchangeService.headlineIndicatorHierarchy.forEach(entry => {
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
      this.searchIndicatorTopicFavItemsRecursive(this.dataExchangeService.topicIndicatorHierarchy, topicId, true);
    else
      this.searchIndicatorTopicFavItemsRecursive(this.dataExchangeService.topicIndicatorHierarchy, topicId, false);

    this.onHandleFavSelection(favTab);
  }

  onIndicatorFavClick(id, favTab = false) {
    if(!this.indicatorFavItems.includes(id))
      this.indicatorFavItems.push(id);
    else
      this.indicatorFavItems = this.indicatorFavItems.filter(e => e!=id);

    this.onHandleFavSelection(favTab);
  }

  onWmsFavClick(id, favTab = false) {
    if(!this.wmsFavItems.includes(id))
      this.wmsFavItems.push(id);
    else
      this.wmsFavItems = this.wmsFavItems.filter(e => e!=id);

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
      this.FavTabWmsFavItems = this.wmsFavItems;
    }

    this.handleToastStatus(1);

    this.favService.handleFavSelection({
      indicatorTopicFavourites: this.indicatorTopicFavItems,
      indicatorFavourites: this.indicatorFavItems,
      webServiceFavourites: this.wmsFavItems
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

  handleWmsOnMap(dataset:WmsDataset){
    this.dataExchangeService.wmsLegendImage = undefined;
    console.log("Toggle Indicator WMS: " + dataset.title);

    if(dataset.isSelected){
      //display on Map
      var opacity = 1 - dataset.transparency;
      this.mapService.addWmsLayerToMap(dataset, opacity);
      this.dataExchangeService.setWmsLayerActive(dataset);
    }
    else{
      //remove WMS layer from map
      this.mapService.removeWmsLayerFromMap(dataset);
      this.dataExchangeService.setWmsLayerInactive(dataset);
    }
  };
}
