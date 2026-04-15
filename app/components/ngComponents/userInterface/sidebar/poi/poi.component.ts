import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { FavService } from 'services/fav-service/fav.service';
import { MapService } from 'services/map-service/map.service';
import { GeoFavFilter } from 'pipes/georesources-fav-filter.pipe';
import { GeoFavItemFilter } from 'pipes/georesources-fav-item-filter.pipe';
import { GeoresourcesDataset, GeoresourcesTopicsHierarchy } from '../../../models/georesources.models';
import { OgcService } from 'services/ogcServices/ogc.service';
import { UserFavourites } from 'components/ngComponents/models/favorites.models';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IconTranslate } from 'pipes/icon-translate.pipe';
import { TopicHierarchyService } from '../../../../../services/topic-hierarchy-service/topic-hierarchy.service';
import { DEFAULT_POI_SIZE, POI_SIZES } from '../../../../../services/data-exchange-service/data-exchange.constants';


@Component({
  selector: 'app-poi',
  templateUrl: './poi.component.html',
  styleUrls: ['./poi.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ExpandableBoxComponent, GeoFavFilter, GeoFavItemFilter, IconTranslate]
})
export class PoiComponent implements OnInit {

  useCluster = true;
  loadingData = false;
  date:any;
  topicsCollapsed:string[] = [];

  isCollapsed_noTopic = true;

  poiNameFilter = undefined;
  loiNameFilter = undefined;
  aoiNameFilter = undefined;

  georesourceNameFilter = {value: undefined};
  
  dateSelectionType_valueIndicator = "date_indicator";
  dateSelectionType_valueManual = "date_manual";
  dateSelectionType_valuePerDataset = "date_perDataset";
  dateSelectionType = {
    selectedDateType: this.dateSelectionType_valuePerDataset
  };

  selectedDate_manual = undefined;

  timeout_manualdate;

  preppedTopicGeoresourceHierarchy!:any;

  georesourceFavTopicsTree = [];

  georesourceTopicFavItems:any[] = [];
  poiFavItems:any[] = [];
  wmsFavItems:any[] = [];

  // own temp list as fav items should remain visible in fav-tab even if deleted, until save/reload
  FavTabGeoresourceTopicFavItems:any[] = []; 
  FavTabPoiFavItems:any[] = [];
  FavTabWmsFavItems:any[] = [];

  favSelectionToastStatus = 0;
  showFavSelection = false;

  favSelectionToastText = ['',
    'Favoriten-Auswahl nicht gesichert. Zum speichern hier klicken',
    'Auswahl erfolgreich gespeichert'];

  isPoiSelectCollapsed = false;
  poiAlphListCollapse:any[] = [true,true,true,true,true];

  readonly poiSizes = POI_SIZES;

  constructor(
    protected dataExchangeService: DataExchangeService,
    private mapService: MapService,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    private elementVisibilityHelperService: ElementVisibilityHelperService,
    private topicHierarchyService: TopicHierarchyService,
    private favService: FavService,
    protected ogcService: OgcService,
    private envConfigService: EnvConfigService
  ) {
  }

  ngOnInit(): void {

    window.setTimeout( () => {
      this.init();
    },2000);

    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'selectedIndicatorDateHasChanged': {
          this.selectedIndicatorDateHasChanged();
        } break; 
        case 'geoFavItemsStored': {
          this.favItemsStored();
        } break;
        case 'LIKEinitialMetadataLoadingCompleted': {
          this.init();
        } break;
      }
    });
  }

  init() {
    this.preppedTopicGeoresourceHierarchy = this.prepareTopicGeoresourceHierarchyRecursive(this.dataExchangeService.topicGeoresourceHierarchy);
    this.georesourceFavTopicsTree = this.prepTopicsTree(this.dataExchangeService.topicGeoresourceHierarchy,0,undefined);

    if(this.elementVisibilityHelperService.elementVisibility.favSelection===true)
      this.showFavSelection = true;

    var userInfo:UserFavourites = this.favService.getUserInfo();
  
    if(userInfo.georesourceFavourites) {
      this.poiFavItems = userInfo.georesourceFavourites;
      this.wmsFavItems = userInfo.webServiceFavourites;
      this.FavTabPoiFavItems = userInfo.georesourceFavourites;
      this.FavTabWmsFavItems = userInfo.webServiceFavourites;
    }

    if(userInfo.georesourceTopicFavourites) {
      this.georesourceTopicFavItems = userInfo.georesourceTopicFavourites;
      this.FavTabGeoresourceTopicFavItems = userInfo.georesourceTopicFavourites;
    }

    this.addClickListenerToEachCollapseTrigger();
  }

  checkHierarchyPoiSelected(topic: GeoresourcesTopicsHierarchy) {
    
    return this.searchSelectedIndicatorRecursive(topic);
  }

  searchSelectedIndicatorRecursive(topic:GeoresourcesTopicsHierarchy):boolean {
  
    let match = false;

    let poiMatch = topic.poiData.filter(e => e.isSelected===true);
    let aoiMatch = topic.aoiData.filter(e => e.isSelected===true);
    let loiMatch = topic.loiData.filter(e => e.isSelected===true);
    let wmsMatch = topic.wmsData.filter(e => e.isSelected===true);

    if(poiMatch.length || aoiMatch.length || loiMatch.length || wmsMatch.length) {
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

  prepTopicsTree(tree, level, parent) {
    tree.forEach(entry => {
      entry.level = level;
      entry.parent = parent;

      if(entry.subTopics.length>0) {
        let newLevel = level+1;
        entry.subTopics = this.prepTopicsTree(entry.subTopics, newLevel, entry.topicId);
      }
    });

    return tree;
  }

  isFavSubTopicCollapsed(topicId) {
    return (document.getElementById('georesourcesFavSubTopic-'+topicId)!.style.display=='none');
  }

  onTopicClick(topicID:string) {
    if(this.topicsCollapsed.includes(topicID))
      this.topicsCollapsed = this.topicsCollapsed.filter(e => e!=topicID);
    else
      this.topicsCollapsed.push(topicID);
  }

  prepareTopicGeoresourceHierarchyRecursive(tree:any[]) {

    let retTree:any[] = tree.filter(e => e.totalCount>0);
  
    retTree.forEach( (elem:any) => {

       if(!this.topicsCollapsed.includes(elem.topicId))
        this.topicsCollapsed.push(elem.topicId);

      if(elem.poiData.length>0) {
        elem.poiData.forEach(poiElem => {
          poiElem.selectedDate = poiElem.availablePeriodsOfValidity[0];
        });
      }
      if(elem.aoiData.length>0) {
        elem.aoiData.forEach(aoiElem => {
          aoiElem.selectedDate = aoiElem.availablePeriodsOfValidity[0];
        });
      }
      if(elem.loiData.length>0) {
        elem.loiData.forEach(loiElem => {
          loiElem.selectedDate = loiElem.availablePeriodsOfValidity[0];
        });
      }

      if(elem.subTopics.length>0) {
        elem.subTopics = this.prepareTopicGeoresourceHierarchyRecursive(elem.subTopics);
      }
    });

    return retTree;
  }

  /*  todo
  $('#manualDateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);
 */
  
  protected enabledGeoresourcesInfrastructure = this.envConfigService.enabledGeoresourcesInfrastructure;
  protected enabledGeoresourcesGeoservices = this.envConfigService.enabledGeoresourcesGeoservices;


  isGeoresourceInfrastructureEnabled(id) {
      return this.enabledGeoresourcesInfrastructure.indexOf(id) !== -1;
  }

  isGeoresourceGeoserviceEnabled(id) {
      return this.enabledGeoresourcesGeoservices.indexOf(id) !== -1;
  }

  protected showPOI = this.isGeoresourceInfrastructureEnabled('poi');
  protected showLOI = this.isGeoresourceInfrastructureEnabled('loi');
  protected showAOI = this.isGeoresourceInfrastructureEnabled('aoi');
  protected showWMS = this.isGeoresourceGeoserviceEnabled('wms');
  protected showWFS = this.isGeoresourceGeoserviceEnabled('wfs');

  showAllForTopic_null = false;

  onChangeGeoresourceKeywordFilter(){    

    this.dataExchangeService.onChangeGeoresourceKeywordFilter(this.georesourceNameFilter.value, this.showPOI, this.showLOI, this.showAOI, this.showWMS, this.showWFS);

    setTimeout(() => {
      this.preppedTopicGeoresourceHierarchy = this.prepareTopicGeoresourceHierarchyRecursive(this.dataExchangeService.topicGeoresourceHierarchy);
      this.addClickListenerToEachCollapseTrigger();
    },250);
  }						
  

  // todo
  // initialize any adminLTE box widgets
 /*  $timeout(function(){
    $('.box').boxWidget();
  }, 750);
   */

  //var numberOfDecimals = window.__env.numberOfDecimals;

  // initialize colorpicker after some time
  // wait to ensure that elements ar available on DOM
/*   setTimeout(function() {

    // todo
     var colorPickerInputs = $('.input-group.colorpicker-component')
    colorPickerInputs.colorpicker(); 

    // $('.input-group.colorpicker-component').each((index, value){
    // 	$(this).colorpicker();
    // });
  }, 3000); */

  addClickListenerToEachCollapseTrigger(){
    setTimeout(function(){
      $('.list-group-item > .collapseTrigger').on('click', function(e) {
        
        $('.glyphicon', e)
        .toggleClass('glyphicon-chevron-right')
        .toggleClass('glyphicon-chevron-down');

          // manage uncollapsed entries
          // var clickedTopicId = $(this).attr('id');
          // if (this.unCollapsedTopicIds.includes(clickedTopicId)){
          // 	var index = this.unCollapsedTopicIds.indexOf(clickedTopicId);
          // 	this.unCollapsedTopicIds.splice(index, 1);
          // }
          // else{
          // 	this.unCollapsedTopicIds.push(clickedTopicId);
          // }
      });

      $('.list-group-item > .georesourcesFavCollapseTrigger:not(.clickBound)').addClass('clickBound').on('click', (e) => {
      $('.glyphicon', e)
        .toggleClass('glyphicon-chevron-right')
        .toggleClass('glyphicon-chevron-down');

        // manage entries
         // todo rebuild dirty elem[0] structure, maybe with ngb
        let elem:any = $(e);
        var clickedTopicId = elem[0].currentTarget.id;
        if(document.getElementById('georesourcesFavSubTopic-'+clickedTopicId)?.style.display=='none')
          document.getElementById('georesourcesFavSubTopic-'+clickedTopicId)!.style.display = 'block';
        else
          document.getElementById('georesourcesFavSubTopic-'+clickedTopicId)!.style.display = 'none';
      });
    }, 500);
  };

/*   $(document).ready(function() {

    //addClickListenerToEachCollapseTrigger();
  }); */

  onChangeShowPOI(){
    if (this.showPOI){
      this.showPOI = false;
    }
    else{
      this.showPOI = true;
    }

  };

  onChangeShowLOI(){
    if (this.showLOI){
      this.showLOI = false;
    }
    else{
      this.showLOI = true;
    }

  };

  onChangeShowAOI(){
    if (this.showAOI){
      this.showAOI = false;
    }
    else{
      this.showAOI = true;
    }

  };

  onChangeShowWMS(){
    if (this.showWMS){
      this.showWMS = false;
    }
    else{
      this.showWMS = true;
    }


  };

  onChangeShowWFS(){
    if (this.showWFS){
      this.showWFS = false;
    }
    else{
      this.showWFS = true;
    }

 
  };

  filterByNoTopic(){
    return ( item ) => {

      try{
        if (! item.topicReference || item.topicReference === ""){
          return true;
        }
        if(!this.topicHierarchyService.referencedTopicIdExists(this.dataExchangeService.availableTopics, item.topicReference)){
          return true;
        }
        return false;
      }
      catch(error){
        return false;
      }
    };
  };

  //georesourceTopicFavItems und preppedTopicGeoresourceHierarchy syncen, damit handleShowAllOnTopic() in hierarchy und favorites gleichermaßen checkboxes setzt

  searchGeoresourcesTopicsRecursive(dataset: GeoresourcesTopicsHierarchy, tree:GeoresourcesTopicsHierarchy[], type:string):boolean {

    let match = false;

    tree.forEach(topic => {

      if(topic.topicId==dataset.topicId) {
        this.markTopicsCheckboxById(topic.topicId, dataset.isSelected, type);
        topic.isSelected = dataset.isSelected;

        match = true;
      } else {
        if(topic.subTopics.length) {
          match = this.searchGeoresourcesTopicsRecursive(dataset,topic.subTopics, type);
        }
      }
    });

    return match;
  }

  markTopicsCheckboxById(id, type, datasetType) {
    
    let elem!:any;
    if(datasetType=='favs')
      elem = document.getElementById(`showAllForTopic_${id}`);
    else
      elem = document.getElementById(`showAllForFavTopic_${id}`);

    // showAllForFavTopic_ may not exists if only subTopics in Favs iso entire tree
    if(elem)
      elem.checked = type;
  }

  handleShowAllOnTopic(topic:GeoresourcesTopicsHierarchy, type:string) {

    // check sibling checkbox in favs/data-catalogue dataset
    if(type=='list')
      this.searchGeoresourcesTopicsRecursive(topic, this.georesourceFavTopicsTree, type);
    else
      this.searchGeoresourcesTopicsRecursive(topic, this.preppedTopicGeoresourceHierarchy, type);

    for (let poi of topic.poiData) {
      poi.isSelected = topic.isSelected;
    }
    for (let loi of topic.loiData) {
      loi.isSelected = topic.isSelected;
    }
    for (let aoi of topic.aoiData) {
      aoi.isSelected = topic.isSelected;
    }
    // if (topic.isSelected){
    // 	topic.isSelected = false;
    // }
    // else{
    // 	topic.isSelected = true;
    // }

    var relevantDatasets = this.dataExchangeService.getGeoresourceDatasets(topic, this.georesourceNameFilter.value, this.showPOI, this.showLOI, this.showAOI, this.showWMS, this.showWFS);

    if(topic === null){
      // if (this.showAllForTopic_null){
      // 	this.showAllForTopic_null = false;
      // }
      // else{
      // 	this.showAllForTopic_null = true;
      // }
      if(this.showAllForTopic_null){
        relevantDatasets.forEach(element => {
          if(! element.isSelected){
            element.isSelected = true;

            if (element.isPOI){
              this.handlePoiOnMap(element);
            }
            else if (element.isLOI){
              this.handleLoiOnMap(element);
            }
            else if (element.isAOI){
              this.handleAoiOnMap(element);
            }
            else if (element.layerName){
              this.handleWmsOnMap(element);
            }
            else if (element.featureTypeName){
              this.handleWfsOnMap(element);
            }
            else{
              console.error("unknown dataset: " + element);
            }
          }										
      
        });
      }
      else{
        relevantDatasets.forEach(element => {
          if(element.isSelected){
            element.isSelected = true;

            if (element.isPOI){
              this.handlePoiOnMap(element);
            }
            else if (element.isLOI){
              this.handleLoiOnMap(element);
            }
            else if (element.isAOI){
              this.handleAoiOnMap(element);
            }
            else if (element.layerName){
              this.handleWmsOnMap(element);
            }
            else if (element.featureTypeName){
              this.handleWfsOnMap(element);
            }
            else{
              console.error("unknown dataset: " + element);
            }
          }										
      
        });
      }
    }

    else if(topic.isSelected){
      relevantDatasets.forEach(element => {
        element.isSelected = true;

        if (element.isPOI){
          this.handlePoiOnMap(element);
        }
        else if (element.isLOI){
          this.handleLoiOnMap(element);
        }
        else if (element.isAOI){
          this.handleAoiOnMap(element);
        }
        else if (element.layerName){
          this.handleWmsOnMap(element);
        }
        else if (element.featureTypeName){
          this.handleWfsOnMap(element);
        }
        else{
          console.error("unknown dataset: " + element);
        }								
    
      });
    }
    else if(! topic.isSelected){
      relevantDatasets.forEach(element => {
        if(element.isSelected){
          element.isSelected = false;

          if (element.isPOI){
            this.handlePoiOnMap(element);
          }
          else if (element.isLOI){
            this.handleLoiOnMap(element);
          }
          else if (element.isAOI){
            this.handleAoiOnMap(element);
          }
          else if (element.layerName){
            this.handleWmsOnMap(element);
          }
          else if (element.featureTypeName){
            this.handleWfsOnMap(element);
          }
          else{
            console.error("unknown dataset: " + element);
          }
        }										
    
      });
    }

  };

  onClickUseIndicatorTimestamp(){
    this.dateSelectionType.selectedDateType = this.dateSelectionType_valueIndicator;

    this.refreshSelectedGeoresources();
  };

  isNoValidDate(dateCandidate){
    var dateComps = dateCandidate.split("-");

    if(dateComps.length < 3){
      return true;
    }
    else if(! dateComps[0] || ! dateComps[1] || ! dateComps[2]){
      return true;
    }
    else if(isNaN(dateComps[0]) || isNaN(dateComps[1]) || isNaN(dateComps[2])){
      return true;
    }
    else if(Number(dateComps[1]) > 12 || Number(dateComps[2]) > 31){
      return true;
    }

    return false;
  }

  onChangeManualDate(){
    // check if date is an actual date
    // if so then refresh selected layers

     // Clear the timeout if it has already been set.
    // This will prevent the previous task from executing
    // if it has been less than <MILLISECONDS>
    clearTimeout(this.timeout_manualdate);

    // Make a new timeout set to go off in 1000ms (1 second)
    this.timeout_manualdate = setTimeout(() => {
      var dateCandidate = this.selectedDate_manual;

      if(this.isNoValidDate(dateCandidate)){
        return;
      }

      // ggf todo
      //$timeout(function(){

        this.loadingData = true;
      /*   $rootScope.$broadcast("showLoadingIconOnMap");
      }); */

      setTimeout(() => {
        this.refreshSelectedGeoresources();
      }, 250);
        	
    }, 1000);

  };

  selectedIndicatorDateHasChanged() {

    console.log("refresh selected georesource layers according to new date - poi");

    // only refresh georesources if sync with indicator timestamp is selected
    if(! this.dateSelectionType.selectedDateType.includes(this.dateSelectionType_valueIndicator)){
      return;
    }

    setTimeout(() => {

      this.loadingData = true;
      this.broadcastService.broadcast('showLoadingIconOnMap');
    });

    setTimeout(() => {

      this.refreshSelectedGeoresources();
    }, 250);							
  }

  refreshSelectedGeoresources(){
    for (const georesource of this.dataExchangeService.displayableGeoresources_keywordFiltered) {
      if (georesource.isSelected){

        if(georesource.isPOI){
          georesource.isSelected = false;
          this.handlePoiOnMap(georesource);
          georesource.isSelected = true;
          this.handlePoiOnMap(georesource);
        }
        else if(georesource.isLOI){
          georesource.isSelected = false;
          this.handleLoiOnMap(georesource);
          georesource.isSelected = true;
          this.handleLoiOnMap(georesource);
        }
        else if(georesource.isAOI){
          georesource.isSelected = false;
          this.handleAoiOnMap(georesource);
          georesource.isSelected = true;
          this.handleAoiOnMap(georesource);
        }											

      }
    }

    this.loadingData = false;
    // todo
    // // todo $rootScope.$broadcast("hideLoadingIconOnMap");
  }

  onChangeSelectedFavDate(georesourceDataset,event){

    georesourceDataset.selectedDate = georesourceDataset.availablePeriodsOfValidity[event.srcElement.value];

    // only if it s already selected, we must modify the shown dataset 
    if(georesourceDataset.isSelected){
      // depending on type we must call different methods
      if (georesourceDataset.isPOI){
        this.removePoiLayerFromMap(georesourceDataset);
        this.addPoiLayerToMap(georesourceDataset, this.useCluster);
      }
      else if (georesourceDataset.isLOI){
        this.removeLoiLayerFromMap(georesourceDataset);
        this.addLoiLayerToMap(georesourceDataset);
      }
      else if (georesourceDataset.isAOI){
        this.removeAoiLayerFromMap(georesourceDataset);
        this.addAoiLayerToMap(georesourceDataset);
      }
      else{
        console.error("unknown dataset: " + georesourceDataset);
      }
    }
  }

  onChangeSelectedDate(georesourceDataset:GeoresourcesDataset){

    // only if it s already selected, we must modify the shown dataset 
    if(georesourceDataset.isSelected){
      // depending on type we must call different methods
      if (georesourceDataset.isPOI){
        this.removePoiLayerFromMap(georesourceDataset);
        this.addPoiLayerToMap(georesourceDataset, this.useCluster);
      }
      else if (georesourceDataset.isLOI){
        this.removeLoiLayerFromMap(georesourceDataset);
        this.addLoiLayerToMap(georesourceDataset);
      }
      else if (georesourceDataset.isAOI){
        this.removeAoiLayerFromMap(georesourceDataset);
        this.addAoiLayerToMap(georesourceDataset);
      }
      else{
        console.error("unknown dataset: " + georesourceDataset);
      }
    }
  }

  getQueryDate(resource){
    if (this.dateSelectionType.selectedDateType === this.dateSelectionType_valueIndicator){
      return this.dataExchangeService.selectedDate;
    }
    else if(this.dateSelectionType.selectedDateType === this.dateSelectionType_valueManual){
      return this.selectedDate_manual;
    }
    else if(this.dateSelectionType.selectedDateType === this.dateSelectionType_valuePerDataset && resource.selectedDate){
      return resource.selectedDate.startDate;
    }
    else{
      return this.dataExchangeService.selectedDate;
    }
  };
  
  handlePoiOnMap(poi:GeoresourcesDataset){

    this.checkGeoresourcesRecursive(poi);

    if(poi.isSelected){
      //display on Map
      this.addPoiLayerToMap(poi, this.useCluster);
    }
    else{
      // unselect topic
      for (var i = 0; i < this.dataExchangeService.topicGeoresourceHierarchy.length; i++) {
        if(this.dataExchangeService.topicGeoresourceHierarchy[i].topicId === poi.topicReference){
          this.dataExchangeService.topicGeoresourceHierarchy[i].isSelected = false;
        }
      }
      //remove POI layer from map
      this.removePoiLayerFromMap(poi);
    }

  };

  checkGeoresourcesRecursive(georesource:GeoresourcesDataset) {

    this.searchGeoresourcesRecursive(georesource,this.preppedTopicGeoresourceHierarchy);
  }

  searchGeoresourcesRecursive(georesource:GeoresourcesDataset, tree:GeoresourcesTopicsHierarchy[]):boolean {

    let match = false;

    tree.forEach(topic => {
      let poiMatch = topic.poiData.filter(e => e.georesourceId==georesource.georesourceId);
      let aoiMatch = topic.aoiData.filter(e => e.georesourceId==georesource.georesourceId);
      let loiMatch = topic.loiData.filter(e => e.georesourceId==georesource.georesourceId);

      if(poiMatch.length || aoiMatch.length || loiMatch.length) {
        this.markCheckboxById(topic.topicId, georesource.isSelected);

        match = true;
      } else {
        if(topic.subTopics.length) {
          match = this.searchGeoresourcesRecursive(georesource,topic.subTopics);

          if(match) {
            this.markCheckboxById(topic.topicId, georesource.isSelected);
          }
        }
      }
    });

    return match;
  }

  markCheckboxById(id:string, type:boolean) {

    let elem:any = document.getElementById(`showAllForTopic_${id}`);
    let elemFav:any = document.getElementById(`showAllForFavTopic_${id}`);

    /* if(elem.checked===false)
      elem.indeterminate = type;
    
    if(elemFav && elemFav.checked===false)
      elemFav.indeterminate = type; */

    if(type===false) {
      elem.checked = false;

      if(elemFav)
        elemFav.checked = false;
    }
  }

  addPoiLayerToMap(poiGeoresource, useCluster) {
    this.loadingData = true;
    this.broadcastService.broadcast('showLoadingIconOnMap');

    var id = poiGeoresource.georesourceId;

    var date = this.getQueryDate(poiGeoresource);

    var dateComps = date.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day;
    this.http.get(url).subscribe({
      next: response => {
        var geoJSON = response;

        poiGeoresource.geoJSON = geoJSON;

        this.mapService.addPoiGeoresourceGeoJSON(poiGeoresource, date, useCluster);
        this.loadingData = false;
      },
      error: error => {
        this.loadingData = false;
        this.dataExchangeService.displayMapApplicationError(error);
      }
    })
  };

  removePoiLayerFromMap(poiGeoresource) {
    this.loadingData = true;
    this.broadcastService.broadcast('showLoadingIconOnMap');

    poiGeoresource = poiGeoresource;

    this.mapService.removePoiGeoresource(poiGeoresource);
    this.loadingData = false;
  };

  refreshPoiLayers(){

    for (var poi of this.dataExchangeService.displayableGeoresources_keywordFiltered){
      if (poi.isSelected){
        //remove POI layer from map
        this.removePoiLayerFromMap(poi);

        // remove layer and add layer again
        this.addPoiLayerToMap(poi, this.useCluster);
      }
    }

    for (var wfs of this.dataExchangeService.wfsDatasets){
      if (wfs.geometryType == 'POI' && wfs.isSelected){
        //remove POI layer from map
        this.mapService.removeWfsLayerFromMap(wfs);

        // remove layer and add layer again
        var opacity = 1 - wfs.transparency;
        this.mapService.addWfsLayerToMap(wfs, opacity, this.useCluster);											
      }
    }
  };

  getExportLinkForPoi(poi){
    var date = this.getQueryDate(poi);

    var dateComps = date.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    var url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + poi.georesourceId + "/" + year + "/" + month + "/" + day;
    var fileName = poi.datasetName + "-" + year + "-" + month + "-" + day;

    this.http.get(url).subscribe({
      next: response => {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON_string = JSON.stringify(response);

        this.dataExchangeService.generateAndDownloadGeoresourceZIP(poi, geoJSON_string, fileName, ".geojson", {});
      },
      error: error => {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        this.loadingData = false;
        this.dataExchangeService.displayMapApplicationError(error);
        // todo $rootScope.$broadcast("hideLoadingIconOnMap");
      }
    })

  };




  ////////// AOI
  handleAoiOnMap(aoi){

    if(aoi.isSelected){
      //display on Map
      this.addAoiLayerToMap(aoi);
    }
    else{
      // unselect topic
      for (var i = 0; i < this.dataExchangeService.topicGeoresourceHierarchy.length; i++) {
        if(this.dataExchangeService.topicGeoresourceHierarchy[i].topicId === aoi.topicReference){
          this.dataExchangeService.topicGeoresourceHierarchy[i].isSelected = false;
        }
      }
      //remove POI layer from map
      this.removeAoiLayerFromMap(aoi);
    }

  };

  addAoiLayerToMap(aoiGeoresource) {
    this.loadingData = true;
    this.broadcastService.broadcast('showLoadingIconOnMap');

    var id = aoiGeoresource.georesourceId;

    var date = this.getQueryDate(aoiGeoresource);

    var dateComps = date.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day;
    this.http.get(url).subscribe({
      next: response => {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON = response;

        aoiGeoresource.geoJSON = geoJSON;

        this.mapService.addAoiGeoresourceGeoJSON(aoiGeoresource, date);
        this.loadingData = false;
      },
      error: error => {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        this.loadingData = false;
        this.dataExchangeService.displayMapApplicationError(error);
        // todo $rootScope.$broadcast("hideLoadingIconOnMap");
      }
    })
  };

  removeAoiLayerFromMap(aoiGeoresource) {
    this.loadingData = true;
    // todo
    // // todo $rootScope.$broadcast("showLoadingIconOnMap");

    aoiGeoresource = aoiGeoresource;

    this.mapService.removeAoiGeoresource(aoiGeoresource);
    this.loadingData = false;
    // todo 
    // // todo $rootScope.$broadcast("hideLoadingIconOnMap");

  };

  getExportLinkForAoi(aoi){
    var date = this.getQueryDate(aoi);

    var dateComps = date.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    var url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + aoi.georesourceId + "/" + year + "/" + month + "/" + day;
    var fileName = aoi.datasetName + "-" + year + "-" + month + "-" + day;

    this.http.get(url).subscribe({
      next: response => {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON = response;

        var element = document.createElement('a');
        element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJSON)));
        element.setAttribute('download', fileName);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
      },
      error: error => {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        this.loadingData = false;
        this.dataExchangeService.displayMapApplicationError(error);
        // todo $rootScope.$broadcast("hideLoadingIconOnMap");
      }
    })

  };

    ////////// LOI
    handleLoiOnMap(loi){

      if(loi.isSelected){
        //display on Map
        this.addLoiLayerToMap(loi);
      }
      else{
        // unselect topic
        for (var i = 0; i < this.dataExchangeService.topicGeoresourceHierarchy.length; i++) {
          if(this.dataExchangeService.topicGeoresourceHierarchy[i].topicId === loi.topicReference){
            this.dataExchangeService.topicGeoresourceHierarchy[i].isSelected = false;
          }
        }
        //remove POI layer from map
        this.removeLoiLayerFromMap(loi);
      }

    };

    addLoiLayerToMap(loiGeoresource) {
      this.loadingData = true;
      this.broadcastService.broadcast('showLoadingIconOnMap');

      var id = loiGeoresource.georesourceId;

      var date = this.getQueryDate(loiGeoresource);

      var dateComps = date.split("-");

      var year = dateComps[0];
      var month = dateComps[1];
      var day = dateComps[2];

      let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day;
      this.http.get(url).subscribe({
        next: response => {
          var geoJSON = response;

          loiGeoresource.geoJSON = geoJSON;

          this.mapService.addLoiGeoresourceGeoJSON(loiGeoresource, date);
          this.loadingData = false;
        },
        error: error => {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          this.loadingData = false;
          this.dataExchangeService.displayMapApplicationError(error);
        }
      });
    };

    removeLoiLayerFromMap(loiGeoresource) {
      this.loadingData = true;
      this.broadcastService.broadcast('showLoadingIconOnMap');

      loiGeoresource = loiGeoresource;

      this.mapService.removeLoiGeoresource(loiGeoresource);
      this.loadingData = false;

    };

    getExportLinkForLoi(aoi){
      var date = this.getQueryDate(aoi);

      var dateComps = date.split("-");

      var year = dateComps[0];
      var month = dateComps[1];
      var day = dateComps[2];

      var url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + aoi.georesourceId + "/" + year + "/" + month + "/" + day;
      var fileName = aoi.datasetName + "-" + year + "-" + month + "-" + day;

      this.http.get(url).subscribe({
        next: response => {
          // this callback will be called asynchronously
          // when the response is available
          var geoJSON = response;

          var element = document.createElement('a');
          element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJSON)));
          element.setAttribute('download', fileName);

          element.style.display = 'none';
          document.body.appendChild(element);

          element.click();

          document.body.removeChild(element);
        },
        error: error => {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          this.loadingData = false;
          this.dataExchangeService.displayMapApplicationError(error);
          // todo $rootScope.$broadcast("hideLoadingIconOnMap");
        }
      })

  };


  handleWmsOnMap(dataset){
    this.dataExchangeService.wmsLegendImage = undefined;
    console.log("Toggle WMS: " + dataset.title);

    if(dataset.isSelected){
      //display on Map
      var opacity = 1 - dataset.transparency;
      this.mapService.addWmsLayerToMap(dataset, opacity);

    }
    else{
      //remove WMS layer from map
      this.mapService.removeWmsLayerFromMap(dataset);
    }
  };

  adjustWMSLayerTransparency(dataset){

    var opacity = 1 - dataset.transparency;

    this.mapService.adjustOpacityForWmsLayer(dataset, opacity);
  };

  adjustAOILayerTransparency(dataset){

    var opacity = 1 - dataset.transparency;

    this.mapService.adjustOpacityForAoiLayer(dataset, opacity);
  };
  
  adjustPOILayerTransparency(dataset){

    var opacity = 1 - dataset.transparency;

    this.mapService.adjustOpacityForPoiLayer(dataset, opacity);
  };

  adjustLOILayerTransparency(dataset){

    var opacity = 1 - dataset.transparency;

    this.mapService.adjustOpacityForLoiLayer(dataset, opacity);
  };

  handleWfsOnMap(dataset){
    console.log("Toggle WFS: " + dataset.title);

    if(dataset.isSelected){
      //display on Map
      var opacity = 1 - dataset.transparency;
      this.mapService.addWfsLayerToMap(dataset, opacity, this.useCluster);

    }
    else{
      //remove WMS layer from map
      this.mapService.removeWfsLayerFromMap(dataset);

    }
  };

  adjustWFSLayerTransparency(dataset){

    var opacity = 1 - dataset.transparency;

    this.mapService.adjustOpacityForWfsLayer(dataset, opacity);
  };

  adjustWfsLayerColor(dataset){

    var opacity = 1 - dataset.transparency;

    this.mapService.adjustColorForWfsLayer(dataset, opacity);
  };

  zoomToLayer(georesourceMetadata){
    // todo $rootScope.$broadcast("zoomToGeoresourceLayer", georesourceMetadata);
  };

  toggleNoTopicHierarchy(){

    this.isCollapsed_noTopic = ! this.isCollapsed_noTopic;

    //this.digest();
  }

  georesourceTopicFavSelected(topicId) {
    return this.georesourceTopicFavItems.includes(topicId);
  }

  poiFavSelected(id) {

    if(Array.isArray(id))
      return id.some(e => this.poiFavItems.includes(e.georesourceId));
    else
      return this.poiFavItems.includes(id);
  }

  wmsFavSelected(id) {
    if(Array.isArray(id))
      return id.some(e => this.wmsFavItems.includes(e.id));
    else
      return this.wmsFavItems.includes(id);
  }

  onPoiFavClick(id, favTab = false) {
    if(!this.poiFavItems.includes(id))
      this.poiFavItems.push(id);
    else
      this.poiFavItems = this.poiFavItems.filter(e => e!=id);

    this.onHandleFavSelection(favTab);
  }

  onWmsFavClick(id, favTab = false) {
    if(!this.wmsFavItems.includes(id))
      this.wmsFavItems.push(id);
    else
      this.wmsFavItems = this.wmsFavItems.filter(e => e!=id);

    this.onHandleFavSelection(favTab);
  }

  onGeoresourceTopicFavClick(topicId, favTab = false) {
    if(!this.georesourceTopicFavItems.includes(topicId))
      this.searchGeoresourceTopicFavItemsRecursive(this.dataExchangeService.topicGeoresourceHierarchy, topicId, true);
    else
      this.searchGeoresourceTopicFavItemsRecursive(this.dataExchangeService.topicGeoresourceHierarchy, topicId, false);                  

    this.onHandleFavSelection(favTab);
  }

  onHandleFavSelection(favTab = false) {

    if(favTab===false) {
      this.FavTabGeoresourceTopicFavItems = this.georesourceTopicFavItems;
      this.FavTabPoiFavItems = this.poiFavItems;
    }

    this.handleToastStatus(1);

    this.favService.handleFavSelection({
      georesourceTopicFavourites: this.georesourceTopicFavItems,
      georesourceFavourites: this.poiFavItems
    });

    this.addClickListenerToEachCollapseTrigger();
  }

  onSaveFavSelection([broadcast = true]) {
    if(broadcast===true)
      this.favService.storeFavSelection();

    this.FavTabGeoresourceTopicFavItems = this.georesourceTopicFavItems;
    this.FavTabPoiFavItems = this.poiFavItems;

    this.handleToastStatus(2);

    if(broadcast===true)
      this.broadcastService.broadcast("geoFavItemsStored",[false]);
  }

  favItemsStored() {
    this.onSaveFavSelection([false]);
  }

  handleToastStatus(type) {

    this.favSelectionToastStatus = type;

    if(type==2) {
      setTimeout(() => {
        this.favSelectionToastStatus = 0;
      },1000);
    }
  }

  searchGeoresourceTopicFavItemsRecursive(tree, id, selected) {

    let ret = false;

    tree.forEach(entry => {
      if(entry.topicId==id) {
        if(selected===true) {
          if(!this.georesourceTopicFavItems.includes(id))
            this.georesourceTopicFavItems.push(id);
        } else
          this.georesourceTopicFavItems = this.georesourceTopicFavItems.filter(e => e!=id);

        // recursive selection of topics / georesources
        /* if(entry.subTopics.length>0)
          checkGeoresourceTopicFavItemsRecursive(entry.subTopics, selected);
        if(entry.poiData.length>0 || entry.aoiData.length>0 || entry.loiData.length>0)
          checkGeoresourceDataFavItems(entry, selected); */

        ret = true;
      } else {
        let itemFound = this.searchGeoresourceTopicFavItemsRecursive(entry.subTopics, id, selected);
        if(itemFound===true) 
          ret = true;
      }
    });

    return ret;
  }

  checkGeoresourceDataFavItems(entry, selected) {

    let types = [{ 
        typeName:'poiData',
        typeFav: 'poiFavItems'},
      { 
        typeName:'aoiData',
        typeFav: 'poiFavItems'},
      { 
        typeName:'loiData',
        typeFav: 'poiFavItems'}];

    types.forEach(type => {
      entry[type.typeName].forEach(typeElem => {
        if(selected===true) {
          if(!this[type.typeFav].includes(typeElem.georesourceId))
            this[type.typeFav].push(typeElem.georesourceId);
        } else 
          this[type.typeFav] = this[type.typeFav].filter(e => e!=typeElem.georesourceId);
      });
    });
  }

  checkGeoresourceTopicFavItemsRecursive(tree, selected) {
    tree.forEach(entry => {
      if(selected===true) {
        if(!this.georesourceTopicFavItems.includes(entry.topicId))
          this.georesourceTopicFavItems.push(entry.topicId);
      } else
        this.georesourceTopicFavItems = this.georesourceTopicFavItems.filter(e => e!=entry.topicId);

      if(entry.subTopics.length>0)
        this.checkGeoresourceTopicFavItemsRecursive(entry.subTopics, selected);

      if(entry.poiData.length>0 || entry.aoiData.length>0 || entry.loiData.length>0)
        this.checkGeoresourceDataFavItems(entry, selected);
    });
  }

  favTabShowTopic(topic:GeoresourcesTopicsHierarchy) {

    if(this.topicOrGeoresourceInFavRecursive([topic]) || this.topicInFavTopBottom(topic))
      return true;

    return false;
  }

  topicInFavTopBottom(topic) {

    var parentNext = topic.parent;
    var ret = false;

    if(this.FavTabGeoresourceTopicFavItems.includes(topic.topicId))
      ret = true;

    while(parentNext!==undefined && ret===false) {
      // hier
      ret = this.parentInFavRecursive(this.georesourceFavTopicsTree, parentNext);
      if(ret===false) 
        parentNext = this.findParentNextRecursive(this.georesourceFavTopicsTree, parentNext);
    }

    return ret;
  }

  parentInFavRecursive(tree, parentId) {

    var ret = false;
    tree.forEach(elem => {

      if(elem.topicId==parentId && this.FavTabGeoresourceTopicFavItems.includes(parentId))
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

  FavTabShowPOIHeader(topic) {

    if(topic.poiData.some(e => this.FavTabPoiFavItems.includes(e.georesourceId)) || 
        topic.aoiData.some(e => this.FavTabPoiFavItems.includes(e.georesourceId)) || 
        topic.loiData.some(e => this.FavTabPoiFavItems.includes(e.georesourceId)) ||
        topic.wmsData.some(e => this.FavTabWmsFavItems.includes(e.id)) ||  
        this.topicInFavTopBottom(topic))
      return true;

    return false;
  }

  FavTabShowPoi(topic,georesourceId) {

    if(this.FavTabPoiFavItems.includes(georesourceId) || this.topicInFavTopBottom(topic))
      return true;

    return false;
  }

  topicOrGeoresourceInFavRecursive(tree:GeoresourcesTopicsHierarchy[]) {

    let ret = false;
    tree.forEach(elem => {
// hier
      if(this.FavTabGeoresourceTopicFavItems.includes(elem.topicId) || 
        this.georesourceInFavItems(elem.poiData, this.FavTabPoiFavItems) || 
        this.georesourceInFavItems(elem.aoiData, this.FavTabPoiFavItems) || 
        this.georesourceInFavItems(elem.loiData, this.FavTabPoiFavItems) || 
        this.wmsInFavItems(elem.wmsData, this.FavTabWmsFavItems))
          ret = true;

      if(elem.subTopics && elem.subTopics.length>0 && ret===false)
        ret = this.topicOrGeoresourceInFavRecursive(elem.subTopics);
    });

    return ret;
  }

  georesourceInFavItems(elems, favItems) {
    return elems.filter(e => favItems.includes(e.georesourceId)).length>0 ? true : false;
  }

  wmsInFavItems(elems:WmsDataset[], favItems) {
    return elems.filter(e => favItems.includes(e.id)).length>0 ? true : false;
  }
}
