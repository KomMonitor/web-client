import { Component, OnInit } from '@angular/core';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { MapService } from 'services/map-service/map.service';

@Component({
  selector: 'app-poi',
  templateUrl: './poi.component.html',
  styleUrls: ['./poi.component.css']
})
export class PoiComponent implements OnInit{

  useCluster = true;
  loadingData = false;
  date:any;

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

  exchangeData!: DataExchange;
  preppedTopicGeoresourceHierarchy!:any;

  constructor(
    protected dataExchangeService: DataExchangeService,
    private mapService: MapService
  ) {
    this.exchangeData = dataExchangeService.pipedData;
  }

  ngOnInit(): void {
    this.preppedTopicGeoresourceHierarchy = this.prepareTopicGeoresourceHierarchyRecursive(this.exchangeData.topicGeoresourceHierarchy);
  }

  onTopicClick(topicId) {
    
  }

  prepareTopicGeoresourceHierarchyRecursive(tree:any[]) {

    let retTree:any[] = tree.filter(e => e.totalCount>0);
  
    retTree.forEach( (elem:any) => {

      /*  if(!this.topicsCollapsed.includes(elem.topicId))
        this.topicsCollapsed.push(elem.topicId); */

      if(elem.subTopics.length>0) {
        elem.subTopics = this.prepareTopicGeoresourceHierarchyRecursive(elem.subTopics);
      }
    });

    return retTree;
  }

  /*  todo
  $('#manualDateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);
 */
  
  enabledGeoresourcesInfrastructure = window.__env.enabledGeoresourcesInfrastructure;
  enabledGeoresourcesGeoservices = window.__env.enabledGeoresourcesGeoservices;


  isGeoresourceInfrastructureEnabled(id) {
      return this.enabledGeoresourcesInfrastructure.indexOf(id) !== -1;
  }

  isGeoresourceGeoserviceEnabled(id) {
      return this.enabledGeoresourcesGeoservices.indexOf(id) !== -1;
  }

  showPOI = this.isGeoresourceInfrastructureEnabled('poi');
  showLOI = this.isGeoresourceInfrastructureEnabled('loi');
  showAOI = this.isGeoresourceInfrastructureEnabled('aoi');
  showWMS = this.isGeoresourceGeoserviceEnabled('wms');
  showWFS = this.isGeoresourceGeoserviceEnabled('wfs');

  showAllForTopic_null = false;

  onChangeGeoresourceKeywordFilter(georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS){     
    showPOI = showPOI;
    showLOI = showLOI;
    showAOI = showAOI;
    showWMS = showWMS;
    showWFS = showWFS;

    this.dataExchangeService.onChangeGeoresourceKeywordFilter(georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS);
  }						
  

  // todo
  // initialize any adminLTE box widgets
 /*  $timeout(function(){
    $('.box').boxWidget();
  }, 750);
   */

  DATE_PREFIX = window.__env.indicatorDatePrefix;

  //var numberOfDecimals = window.__env.numberOfDecimals;

  // initialize colorpicker after some time
  // wait to ensure that elements ar available on DOM
/*   setTimeout(function() {

    // todo
     var colorPickerInputs = $('.input-group.colorpicker-component')
    colorPickerInputs.colorpicker(); 

    // $('.input-group.colorpicker-component').each(function (index, value){
    // 	$(this).colorpicker();
    // });
  }, 3000); */

/*   var addClickListenerToEachCollapseTrigger(){
    setTimeout(function(){
      $('.list-group-item > .collapseTrigger').on('click', function() {
        $('.glyphicon', this)
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
    }, 500);
  }; */

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
        if(!this.dataExchangeService.referencedTopicIdExists(item.topicReference)){
          return true;
        }
        return false;
      }
      catch(error){
        return false;
      }
    };
  };
  
  handleShowAllOnTopic(topic) {
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

  // todo
 /*  $scope.$on("selectedIndicatorDateHasChanged", function (event) {

    console.log("refresh selected georesource layers according to new date");

    // only refresh georesources if sync with indicator timestamp is selected
    if(! this.dateSelectionType.selectedDateType.includes(this.dateSelectionType_valueIndicator)){
      return;
    }

    $timeout(function(){

      this.loadingData = true;
      // todo $rootScope.$broadcast("showLoadingIconOnMap");
    });

    $timeout(function(){

      this.refreshSelectedGeoresources();
    }, 250);							
  }); */

  refreshSelectedGeoresources(){
    for (const georesource of this.exchangeData.displayableGeoresources_keywordFiltered) {
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
  };

  onChangeSelectedDate(georesourceDataset){
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
  };

  getQueryDate(resource){
    if (this.dateSelectionType.selectedDateType === this.dateSelectionType_valueIndicator){
      return this.exchangeData.selectedDate;
    }
    else if(this.dateSelectionType.selectedDateType === this.dateSelectionType_valueManual){
      return this.selectedDate_manual;
    }
    else if(this.dateSelectionType.selectedDateType === this.dateSelectionType_valuePerDataset && resource.selectedDate){
      return resource.selectedDate.startDate;
    }
    else{
      return this.exchangeData.selectedDate;
    }
  };
  
  handlePoiOnMap(poi){

    if(poi.isSelected){
      //display on Map
      this.addPoiLayerToMap(poi, this.useCluster);
    }
    else{
      // unselect topic
      for (var i = 0; i < this.exchangeData.topicGeoresourceHierarchy.length; i++) {
        if(this.exchangeData.topicGeoresourceHierarchy[i].topicId === poi.topicReference){
          this.exchangeData.topicGeoresourceHierarchy[i].isSelected = false;
        }
      }
      //remove POI layer from map
      this.removePoiLayerFromMap(poi);
    }

  };

  addPoiLayerToMap(poiGeoresource, useCluster) {
    this.loadingData = true;
    // todo
    // // todo $rootScope.$broadcast("showLoadingIconOnMap");

    var id = poiGeoresource.georesourceId;

    var date = this.getQueryDate(poiGeoresource);

    var dateComps = date.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    // todo
  /*   await $http({
      url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
      method: "GET"
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON = response.data;

        poiGeoresource.geoJSON = geoJSON;

        this.mapService.addPoiGeoresourceGeoJSON(poiGeoresource, date, useCluster);
        this.loadingData = false;
        // todo $rootScope.$broadcast("hideLoadingIconOnMap");

      }, function errorCallback(error) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        this.loadingData = false;
        kommonitorDataExchangeService.displayMapApplicationError(error);
        // todo $rootScope.$broadcast("hideLoadingIconOnMap");
    }); */

  };

  removePoiLayerFromMap(poiGeoresource) {
    this.loadingData = true;
    // todo
    // // todo $rootScope.$broadcast("showLoadingIconOnMap");

    poiGeoresource = poiGeoresource;

    this.mapService.removePoiGeoresource(poiGeoresource);
    this.loadingData = false;
    //todo 
    // // todo $rootScope.$broadcast("hideLoadingIconOnMap");

  };

  refreshPoiLayers(){
    for (var poi of this.exchangeData.displayableGeoresources_keywordFiltered){
      if (poi.isSelected){
        //remove POI layer from map
        this.removePoiLayerFromMap(poi);

        // remove layer and add layer again
        this.addPoiLayerToMap(poi, this.useCluster);
      }
    }

    for (var wfs of this.exchangeData.wfsDatasets){
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

    // todo
  /*   $http({
      url: url,
      method: "GET"
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON_string = JSON.stringify(response.data);

        kommonitorDataExchangeService.generateAndDownloadGeoresourceZIP(poi, geoJSON_string, fileName, ".geojson", {});

      }, function errorCallback(error) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        this.loadingData = false;
        kommonitorDataExchangeService.displayMapApplicationError(error);
        // todo $rootScope.$broadcast("hideLoadingIconOnMap");
    }); */

  };




  ////////// AOI
  handleAoiOnMap(aoi){

    if(aoi.isSelected){
      //display on Map
      this.addAoiLayerToMap(aoi);
    }
    else{
      // unselect topic
      for (var i = 0; i < this.exchangeData.topicGeoresourceHierarchy.length; i++) {
        if(this.exchangeData.topicGeoresourceHierarchy[i].topicId === aoi.topicReference){
          this.exchangeData.topicGeoresourceHierarchy[i].isSelected = false;
        }
      }
      //remove POI layer from map
      this.removeAoiLayerFromMap(aoi);
    }

  };

  addAoiLayerToMap(aoiGeoresource) {
    this.loadingData = true;
    // todo
    // // todo $rootScope.$broadcast("showLoadingIconOnMap");

    var id = aoiGeoresource.georesourceId;

    var date = this.getQueryDate(aoiGeoresource);

    var dateComps = date.split("-");

    var year = dateComps[0];
    var month = dateComps[1];
    var day = dateComps[2];

    // todo
   /*  await $http({
      url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
      method: "GET"
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON = response.data;

        aoiGeoresource.geoJSON = geoJSON;

        this.mapService.addAoiGeoresourceGeoJSON(aoiGeoresource, date);
        this.loadingData = false;
        // todo $rootScope.$broadcast("hideLoadingIconOnMap");

      }, function errorCallback(error) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        this.loadingData = false;
        kommonitorDataExchangeService.displayMapApplicationError(error);
        // todo $rootScope.$broadcast("hideLoadingIconOnMap");
    }); */

  };

  removeAoiLayerFromMap(aoiGeoresource) {
    this.loadingData = true;
    // todo
    // // todo $rootScope.$broadcast("showLoadingIconOnMap");

    aoiGeoresource = aoiGeoresource;

    this.dataExchangeService.removeAoiGeoresource(aoiGeoresource);
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

    // todo
  /*   $http({
      url: url,
      method: "GET"
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        var geoJSON = response.data;

        var element = document.createElement('a');
        element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJSON)));
        element.setAttribute('download', fileName);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

      }, function errorCallback(error) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        this.loadingData = false;
        kommonitorDataExchangeService.displayMapApplicationError(error);
        // todo $rootScope.$broadcast("hideLoadingIconOnMap");
    }); */

  };

    ////////// LOI
    handleLoiOnMap(loi){

      if(loi.isSelected){
        //display on Map
        this.addLoiLayerToMap(loi);
      }
      else{
        // unselect topic
        for (var i = 0; i < this.exchangeData.topicGeoresourceHierarchy.length; i++) {
          if(this.exchangeData.topicGeoresourceHierarchy[i].topicId === loi.topicReference){
            this.exchangeData.topicGeoresourceHierarchy[i].isSelected = false;
          }
        }
        //remove POI layer from map
        this.removeLoiLayerFromMap(loi);
      }

    };

    addLoiLayerToMap(loiGeoresource) {
      this.loadingData = true;
      // todo
      // // todo $rootScope.$broadcast("showLoadingIconOnMap");

      var id = loiGeoresource.georesourceId;

      var date = this.getQueryDate(loiGeoresource);

      var dateComps = date.split("-");

      var year = dateComps[0];
      var month = dateComps[1];
      var day = dateComps[2];

      // todo
    /*   await $http({
        url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
        method: "GET"
      }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          var geoJSON = response.data;

          loiGeoresource.geoJSON = geoJSON;

          this.mapService.addLoiGeoresourceGeoJSON(loiGeoresource, date);
          this.loadingData = false;
          // todo $rootScope.$broadcast("hideLoadingIconOnMap");

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          this.loadingData = false;
          kommonitorDataExchangeService.displayMapApplicationError(error);
          // todo $rootScope.$broadcast("hideLoadingIconOnMap");
      }); */

    };

    removeLoiLayerFromMap(loiGeoresource) {
      this.loadingData = true;
      // todo 
      // // todo $rootScope.$broadcast("showLoadingIconOnMap");

      loiGeoresource = loiGeoresource;

      this.mapService.removeLoiGeoresource(loiGeoresource);
      this.loadingData = false;
      // todo
      // // todo $rootScope.$broadcast("hideLoadingIconOnMap");

    };

    getExportLinkForLoi(aoi){
      var date = this.getQueryDate(aoi);

      var dateComps = date.split("-");

      var year = dateComps[0];
      var month = dateComps[1];
      var day = dateComps[2];

      var url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + aoi.georesourceId + "/" + year + "/" + month + "/" + day;
      var fileName = aoi.datasetName + "-" + year + "-" + month + "-" + day;

      // todo
    /*   $http({
        url: url,
        method: "GET"
      }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          var geoJSON = response.data;

          var element = document.createElement('a');
          element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJSON)));
          element.setAttribute('download', fileName);

          element.style.display = 'none';
          document.body.appendChild(element);

          element.click();

          document.body.removeChild(element);

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          this.loadingData = false;
          kommonitorDataExchangeService.displayMapApplicationError(error);
          // todo $rootScope.$broadcast("hideLoadingIconOnMap");
      }); */

  };


  handleWmsOnMap(dataset){
    this.exchangeData.wmsLegendImage = undefined;
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

}
