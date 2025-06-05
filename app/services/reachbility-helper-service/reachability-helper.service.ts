import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import * as turf from '@turf/turf';

@Injectable({
  providedIn: 'root'
})
export class ReachabilityHelperService {

  settings:any = {};

  currentIsochronesGeoJSON = undefined;
	original_nonDissolved_isochrones:any = undefined;

  error = undefined;

  public constructor(
    private broadcastService: BroadcastService,
    private http: HttpClient,
    private dataExchangeService: DataExchangeService
  ) {

    this.settings.pointSourceConfigured = false;
    this.settings.useMultipleStartPoints = false;
    this.settings.unit = 'Meter';

    this.settings.locationsArray = [];
    this.settings.locationsArrayIdArray = [];

    this.settings.dateSelectionType_valueIndicator = "date_indicator";
    this.settings.dateSelectionType_valueManual = "date_manual";
    this.settings.dateSelectionType_valuePerDataset = "date_perDataset";
    this.settings.dateSelectionType = {
      selectedDateType: this.settings.dateSelectionType_valuePerDataset
    };

    this.settings.selectedDate_manual = undefined;

    this.settings.isochroneConfig = {};
    this.settings.isochroneConfig.dateSelectionType_valueIndicator = "date_indicator";
    this.settings.isochroneConfig.dateSelectionType_valueManual = "date_manual";
    this.settings.isochroneConfig.dateSelectionType_valuePerDataset = "date_perDataset";
    this.settings.isochroneConfig.dateSelectionType = {
      selectedDateType: this.settings.isochroneConfig.dateSelectionType_valuePerDataset
    };

    this.settings.isochroneConfig.selectedDate_manual = undefined;

    this.settings.dissolveIsochrones = true;

    this.settings.routingStartPointInput = undefined;
    this.settings.routingEndPointInput = undefined;

    /**
     * The current time-or-distance value of the
     * analysis. The unit of the stored value can be
     * found in the variable 'unit'. This value
     * represents value of the slider in the GUI and
     * handed to the routing API.
     */
    this.settings.currentTODValue = 1;

    /**
     * Specifies the route preference.
     *
     * Allowed values are:
     * - "fastest"
     * - "shortest"
     * - "recommended"
     */
    this.settings.preference = "fastest";

    this.settings.isochroneInput = undefined;

    /**
       * Variable to save the keywords used by the
       * routing API. Valid values are:
       * driving-car
       * driving-hgv // LKW
       * cycling-regular
       * cycling-road
       * cycling-safe
       * cycling-mountain
       * cycling-tour
       * cycling-electric
       * foot-walking
       * foot-hiking
       * wheelchair
       */
    this.settings.transitMode = 'buffer';

    /**
     * The focus of the analysis. Valid values are:
     * 'distance' and 'time'. TODO : Starke
     * Ueberschneidung mit der Variablen 'focus',
     * die im Grunde genau das gleiche speichert.
     */
    this.settings.focus = 'distance';

    /**
     * config of starting points source (layer or manual draw) for isochrones
     */
    this.settings.startPointsSource = "fromLayer";

    /**
    * selected start point layer for isochrone computation
    * GeoJSON within property .geoJSON
    */
    this.settings.selectedStartPointLayer = undefined;
  }

  resetSettings() {
   
    this.settings = {};

    this.settings.pointSourceConfigured = false;
    this.settings.useMultipleStartPoints = false;
    this.settings.unit = 'Meter';

    this.settings.locationsArray = [];

    this.settings.dateSelectionType_valueIndicator = "date_indicator";
    this.settings.dateSelectionType_valueManual = "date_manual";
    this.settings.dateSelectionType_valuePerDataset = "date_perDataset";
    this.settings.dateSelectionType = {
      selectedDateType: this.settings.dateSelectionType_valuePerDataset
    };

    this.settings.selectedDate_manual = undefined;

    this.settings.isochroneConfig = {};
    this.settings.isochroneConfig.dateSelectionType_valueIndicator = "date_indicator";
    this.settings.isochroneConfig.dateSelectionType_valueManual = "date_manual";
    this.settings.isochroneConfig.dateSelectionType_valuePerDataset = "date_perDataset";
    this.settings.isochroneConfig.dateSelectionType = {
      selectedDateType: this.settings.isochroneConfig.dateSelectionType_valuePerDataset
    };

    this.settings.isochroneConfig.selectedDate_manual = undefined;


    this.settings.dissolveIsochrones = true;
    this.settings.transitMode = 'buffer';
    document.getElementById("optBuffer")?.click();
    this.settings.focus = 'distance';
    document.getElementById("focus_distance")?.click();
    this.settings.startPointsSource = "fromLayer";

    this.settings.selectedStartPointLayer = undefined;

    this.settings.loadingData = false;

    this.settings.currentTODValue = 1;

    this.settings.preference = "fastest";

    this.settings.routingStartPointInput = undefined;
    this.settings.routingEndPointInput = undefined;
  }

  createRoutingRequest(transitMode, preference, routingStartPointInput, routingEndPointInput) {
    var locString = routingStartPointInput + '%7C' + routingEndPointInput;

    // if user never clicked transit mode set standard 
    if (transitMode === "buffer") {
      transitMode = "foot-walking";
    }

    // var getRequest = __env.targetUrlToReachabilityService_ORS
    // 	+ '/routes?'
    // 	+ 'coordinates=' + locString
    // 	+ '&profile='+transitMode
    // 	+ '&preference='+preference
    // 	+ '&units='+'km'
    // 	+ '&language='+'de'
    // 	+ '&format='+'geojson'
    // 	+ '&instructions='+'true'
    // 	+ '&instructions_format='+'html'
    // 	+ '&maneuvers='+'true'
    // 	+ '&attributes='+'avgspeed'
    // 	+ '&elevation='+'true';

    //console.log(getRequest);

    var getRequest = window.__env.targetUrlToReachabilityService_ORS
      + '/v2/directions/' + transitMode + '?'
      + 'start=' + routingStartPointInput
      + '&end=' + routingEndPointInput;

    return getRequest;
  }

  fetchGeoJSONForIsochrones() {
    if (!this.settings.selectedStartPointLayer) {
      this.settings.loadingData = false;
      return;
    }

    // clear any previous results
    this.settings.selectedStartPointLayer.geoJSON_reachability = undefined;

    var date;

    if (this.settings.isochroneConfig.dateSelectionType.selectedDateType === this.settings.isochroneConfig.dateSelectionType_valuePerDataset) {
      date = this.settings.isochroneConfig.selectedDate.startDate;
    }
    else if (this.settings.isochroneConfig.dateSelectionType.selectedDateType === this.settings.isochroneConfig.dateSelectionType_valueManual) {
      date = this.settings.isochroneConfig.selectedDate_manual;
    }
    else {
      date = this.dataExchangeService.pipedData.selectedDate;
    }

    if (!date) {
      this.settings.loadingData = false;
      return;
    }


    this.settings.loadingData = true;
    var id = this.settings.selectedStartPointLayer.georesourceId;

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

        this.settings.selectedStartPointLayer.geoJSON_reachability = geoJSON;
        this.settings.selectedStartPointLayer.geoJSON = geoJSON;

        this.settings.loadingData = false;
        this.settings.pointSourceConfigured = true;
      }, 
      error: error => {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        this.settings.pointSourceConfigured = false;
        this.settings.loadingData = false;
        console.error(error.statusText);
        this.dataExchangeService.displayMapApplicationError(error);
        this.error = error.statusText;
      }
    });

   /*  await $http({
      url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
      method: "GET"
    }).then(function successCallback(response) {
      // this callback will be called asynchronously
      // when the response is available
      var geoJSON = response.data;

      this.settings.selectedStartPointLayer.geoJSON_reachability = geoJSON;
      this.settings.selectedStartPointLayer.geoJSON = geoJSON;

      this.settings.loadingData = false;
      this.settings.pointSourceConfigured = true;

    }, function errorCallback(error) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
      this.settings.pointSourceConfigured = false;
      this.settings.loadingData = false;
      console.error(error.statusText);
      kommonitorDataExchangeService.displayMapApplicationError(error);
      this.error = error.statusText;
    }); */
  }

  async startIsochroneCalculation(isUsedInReporting) {
    //this.ajskommonitorReachabilityHelperServiceProvider.startIsochroneCalculation(used);

    if (!isUsedInReporting) { // reporting uses it's own loading overlay, which is controlled there
      this.settings.loadingData = true;
    } else {
     this.broadcastService.broadcast("reportingIsochronesCalculationStarted");
    }

    this.checkArrayInput();

    this.settings.locationsArray = this.makeLocationsArrayFromStartPoints();

    // SWITCH THE VALUE DEPENDING ON THE LENGTH
    // OF THE LOCATIONS ARRAY
    if (this.settings.locationsArray.length > 1)
      this.settings.useMultipleStartPoints = true;
    else
      this.settings.useMultipleStartPoints = false;

    var resultIsochrones;

    if (this.settings.transitMode === 'buffer') {
      resultIsochrones = this.createBuffers();
    }
    else {
      resultIsochrones = await this.createIsochrones();
    }

    if (isUsedInReporting) {
      // No need to add isochrones to main map.
      // Instead they are returned to reporting modal
      this.broadcastService.broadcast("reportingIsochronesCalculationFinished", resultIsochrones);
      return;
    }

    this.currentIsochronesGeoJSON = resultIsochrones;			

    this.broadcastService.broadcast("isochronesCalculationFinished");

    this.settings.loadingData = false;
  }

  checkArrayInput() {
    this.settings.rangeArray = [];
    var split = this.settings.isochroneInput.split(',');
    var actVal;
    if (split.length > 0) {
      for (var a = 0; a < split.length; a++) {
        if (!isNaN(split[a])) {
          actVal = parseFloat(split[a]);
          if (!isNaN(actVal))
            this.settings.rangeArray
              .push(actVal);
        }
      }
    }

    this.settings.rangeArray.sort(function (a, b) { return a - b; });
  }

  createBuffers() {
    var resultIsochrones;

    var startingPoints_geoJSON;
    // create Buffers for each input and range definition
    if (this.settings.startPointsSource === "manual") {
      // establish from drawn points
      startingPoints_geoJSON = jQuery.extend(true, {}, this.settings.manualStartPoints);
    }
    else {
      // establish from chosen layer
      startingPoints_geoJSON = jQuery.extend(true, {}, this.settings.selectedStartPointLayer.geoJSON_reachability);
    }

    // range in meters				
    for (const range of this.settings.rangeArray) {
      var geoJSON_buffered:any = turf.buffer(jQuery.extend(true, {}, startingPoints_geoJSON), Number(range) / 1000, { units: 'kilometers', steps: 12 });

      if (!geoJSON_buffered?.features) {
        // transform single feature to featureCollection
        geoJSON_buffered = turf.featureCollection([
          geoJSON_buffered
        ]);
      }

      // add property: value --> range
      if (geoJSON_buffered.features && geoJSON_buffered.features.length > 0) {
        for (const feature of geoJSON_buffered.features) {
          feature.properties.value = range;
        }
      }

      if (!resultIsochrones) {
        resultIsochrones = jQuery.extend(true, {}, geoJSON_buffered);
      }
      else {
        resultIsochrones.features = resultIsochrones.features.concat(jQuery.extend(true, {}, geoJSON_buffered).features);
      }
    }

    this.original_nonDissolved_isochrones = jQuery.extend(true, {}, resultIsochrones);
    // sort buffered isochrones before attaching featureIDs as that expects a certain order of the point buffers
    // each point must have consecutive indices and increasing range!
    this.original_nonDissolved_isochrones.features = this.original_nonDissolved_isochrones.features.sort(this.sortBuffers); 

    // attach metadata/query/range property for feature collection which is used by spatial data processor in indicator statistics computation
    this.original_nonDissolved_isochrones.metadata = {query: {
      range: this.settings.rangeArray
    }};

    this.original_nonDissolved_isochrones = this.attachPoiFeatureIDsToIsochrones();

    if (this.settings.dissolveIsochrones) {
      try {
        resultIsochrones = turf.dissolve(resultIsochrones, { propertyName: 'value' });
      } catch (e) {
        console.error("Dissolving Isochrones failed with error: " + e);
        console.error("Will return undissolved isochrones");
      } finally {

      }

    }

    return resultIsochrones;
  }

  sortBuffers(a, b){
    if (a.properties[window.__env.FEATURE_ID_PROPERTY_NAME] == b.properties[window.__env.FEATURE_ID_PROPERTY_NAME]) {
      // sort by ascending range
      if (a.properties["value"] < b.properties["value"]) {
        return -1;
        }
      else if (a.properties["value"] > b.properties["value"]) {
        return 1;
        } 
      else{
        return 0;
      }
      } 
    if (a.properties[window.__env.FEATURE_ID_PROPERTY_NAME] < b.properties[window.__env.FEATURE_ID_PROPERTY_NAME]) {
      return -1;
      } 
    else if (a.properties[window.__env.FEATURE_ID_PROPERTY_NAME] < b.properties[window.__env.FEATURE_ID_PROPERTY_NAME]) {
      return 1;
      }
      // a must be equal to b
      return 0;
  }

  makeLocationsArrayFromStartPoints() {
    // array of arrays of lon,lat
    this.settings.locationsArray = [];
    this.settings.locationsArrayIdArray = [];

    if (this.settings.startPointsSource === "manual") {
      // establish from drawn points
      this.settings.manualStartPoints.features.forEach( (feature) => {
        this.settings.locationsArray.push(feature.geometry.coordinates);
        this.settings.locationsArrayIdArray.push(feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME]);
      });
    }
    else {
      // establish from chosen layer
      this.settings.selectedStartPointLayer.geoJSON_reachability.features.forEach( (feature) => {
        this.settings.locationsArray.push(feature.geometry.coordinates);
        this.settings.locationsArrayIdArray.push(feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME]);
      });
    }

    return this.settings.locationsArray;
  }

  async createIsochrones() {
    var resultIsochrones;

    console.log('Calculating isochrones for ' +
      this.settings.locationsArray.length +
      ' start points.');

    var maxLocationsForORSRequest = 150;

    var featureIndex = 0;
    // log progress for each 10% of features
    var logProgressIndexSeparator = Math.round(this.settings.locationsArray.length / 100 * 10);

    var countFeatures = 0;
    var tempStartPointsArray:any[] = [];
    for (var pointIndex = 0; pointIndex < this.settings.locationsArray.length; pointIndex++) {
      tempStartPointsArray.push(this.settings.locationsArray[pointIndex]);
      countFeatures++;

      // if maxNumber of locations is reached or the last starting point is reached
      if (countFeatures === maxLocationsForORSRequest || pointIndex === this.settings.locationsArray.length - 1) {
        // make request, collect results

        // responses will be GeoJSON FeatureCollections
        var tempIsochrones:any;
        await this.fetchIsochrones(tempStartPointsArray).then((value) => {
          tempIsochrones = value;
        });

        if (!resultIsochrones) {
          resultIsochrones = tempIsochrones;
        }
        else {
          // apend results of tempIsochrones to resultIsochrones
          resultIsochrones.features = resultIsochrones.features.concat(tempIsochrones.features);
        }
        // increment featureIndex
        featureIndex++;
        if (featureIndex % logProgressIndexSeparator === 0) {
          console.log("PROGRESS: Computed isochrones for '" + featureIndex + "' of total '" + this.settings.locationsArray.length + "' starting points.");
        }

        // reset temp vars
        tempStartPointsArray = [];
        countFeatures = 0;

      } // end if
    } // end for

    this.original_nonDissolved_isochrones = resultIsochrones;
    this.original_nonDissolved_isochrones = this.attachPoiFeatureIDsToIsochrones();

    if (this.settings.dissolveIsochrones) {
      try {
        var dissolved = turf.dissolve(resultIsochrones, { propertyName: 'value' });

        return dissolved;
      } catch (e) {
        console.error("Dissolving Isochrones failed with error: " + e);
        console.error("Will return undissolved isochrones");
        //return response.data;
      } finally {

      }

    }

    return resultIsochrones;

  };

  fetchIsochrones(tempStartPointsArray) {
    var body = this.createORSIsochroneRequestBody(
      tempStartPointsArray,
      this.settings.rangeArray);

    let url = window.__env.targetUrlToReachabilityService_ORS +
    '/v2/isochrones/' + this.settings.transitMode;	

    var req = {
      method: 'POST',
      url: url,
      data: body,
      headers: {
        // 'Accept': 'application/json',
        "Content-Type": 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
      this.http.post(url,req.data,{headers: req.headers}).subscribe({
        next: response => {
          resolve(response);
        },
        error: error => {
          console.error(error.data.error.message);
          this.error = error.data.error.message;
          this.settings.loadingData = false;
          this.dataExchangeService.displayMapApplicationError(error);
          reject();
        }
      });
    });
  }

  createORSIsochroneRequestBody(locationsArray, rangeArray) {
    let body:any = { 
      "locations": [], 
      "range": [], 
      "attributes": ["reachfactor", "area"], 
      "location_type": "start", 
      "range_type": this.settings.focus, 
      "smoothing": 0, 
      "area_units": "km", 
      "units": "m" 
    };

    for (var index = 0; index < locationsArray.length; index++) {
      // element looks like
      // [longitude,latitude]
      let point = [locationsArray[index][0], locationsArray[index][1]];
      body.locations.push(point);
    };

      for (var i = 0; i < rangeArray.length; i++) {
        var cValue = rangeArray[i];

        // CALCULATE SECONDS FROM MINUTE VALUES IF TIME-ANALYSIS IS WANTED
        if(this.settings.focus=='time'){
          cValue = cValue*60;
        }
          
        body.range.push(cValue);
      };

    return body;
  };

  /*
    attaches the featureID of starting points to corresponding result isochrones
    using
    featureID_rangeValue
    i.e.
    1_300 --> may stand for featureID = 1 and rangeValue = 300
  */
  attachPoiFeatureIDsToIsochrones(){

    // the order of isochrone features following rules:
    // for two starting points an three ranges
    // the first starting point is on index 0,1,2 with increasing range value
    // then index 3,4,5 will represent the second point for each increasing range
    let locationsArrayIdIndex = 0;
    for (let isochroneIndex = 0; isochroneIndex < this.original_nonDissolved_isochrones.features.length; isochroneIndex++) {					

      for (let rangeIndex = 0; rangeIndex < this.settings.rangeArray.length; rangeIndex++) {
        const rangeValue = this.settings.rangeArray[rangeIndex];
        
        const resultIsochrone = this.original_nonDissolved_isochrones.features[isochroneIndex];
        resultIsochrone.properties.ID = this.settings.locationsArrayIdArray[locationsArrayIdIndex] + '_' + rangeValue;
        this.original_nonDissolved_isochrones.features[isochroneIndex] = resultIsochrone;

        // for multiple ranges we must increment the isochrone index in this inner loop
        // but not if the last range value has been processed
        if(rangeIndex != this.settings.rangeArray.length -1){
          isochroneIndex++;
        }						
      }	
      // now increment locationArrayIDIndex as now the point for each range has been processed 
      locationsArrayIdIndex++;				
    }

    return this.original_nonDissolved_isochrones;
  }
}
