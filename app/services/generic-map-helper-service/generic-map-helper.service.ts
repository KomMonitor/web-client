import { ajskommonitorGenericMapHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';
import L from 'leaflet';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Injectable({
  providedIn: 'root'
})
export class GenericMapHelperService {

  pipedData: any;
  exchangeData:DataExchange;

  resourceType_point = "POINT";
  resourceType_line = "LINE";
  resourceType_polygon = "POLYGON";

  public constructor(
    @Inject('kommonitorGenericMapHelperService') private ajskommonitorGenericMapHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    private dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService
  ) {
    this.pipedData = this.ajskommonitorGenericMapHelperServiceProvider;
    this.exchangeData = this.dataExchangeService.pipedData;
  }

  createCustomMarker(poiFeature, poiMarkerStyle, poiMarkerText, poiSymbolColor, poiMarkerColor, poiSymbolBootstrap3Name, metadataObject) {
    //return this.ajskommonitorGenericMapHelperServiceProvider.createCustomMarker(poiFeature, poiMarkerStyle, poiMarkerText, poiSymbolColor, poiMarkerColor, poiSymbolBootstrap3Name, georesourceMetadataAndGeoJSON);
 
    var customMarker;
    // todo VectorMarkers
   /*  var customMarker = L.VectorMarkers.icon({
      viewBox: '0 0 32 52',
      iconSize: [30 * this.exchangeData.selectedPOISize.scaleFactor, 50 * this.exchangeData.selectedPOISize.scaleFactor],
      iconAnchor: [ 15 * this.exchangeData.selectedPOISize.scaleFactor, 50 * this.exchangeData.selectedPOISize.scaleFactor ],
      shadowSize: [0, 0], // ausgeschaltete Schatten
      // um Schatten einzuschalten: //shadowSize:   [36 * this.exchangeData.selectedPOISize.scaleFactor, 16 * this.exchangeData.selectedPOISize.scaleFactor ],
      // um Schatten einzuschalten: //shadowAnchor: [35 * this.exchangeData.selectedPOISize.scaleFactor, 10 * this.exchangeData.selectedPOISize.scaleFactor],
      icon: poiSymbolBootstrap3Name,
      prefix: 'glyphicon',
      markerColor: poiMarkerColor,
      iconColor: poiSymbolColor,
      extraClasses: this.exchangeData.selectedPOISize.iconClassName
    });

    // special treatment for geocoded results
    if(metadataObject.isGeocodedDataset){
      if (poiFeature.properties["geocoder_geocoderank"] == 2){
        customMarker = L.VectorMarkers.icon({
          markerColor: "green",
          viewBox: '0 0 32 52',
          iconSize: [30 * this.exchangeData.selectedPOISize.scaleFactor, 50 * this.exchangeData.selectedPOISize.scaleFactor],
          iconAnchor: [ 15 * this.exchangeData.selectedPOISize.scaleFactor, 50 * this.exchangeData.selectedPOISize.scaleFactor ],
          shadowSize: [0, 0], // ausgeschaltete Schatten
          // um Schatten einzuschalten: //shadowSize:   [36 * this.exchangeData.selectedPOISize.scaleFactor, 16 * this.exchangeData.selectedPOISize.scaleFactor ],
          // um Schatten einzuschalten: //shadowAnchor: [35 * this.exchangeData.selectedPOISize.scaleFactor, 10 * this.exchangeData.selectedPOISize.scaleFactor],
          icon: poiSymbolBootstrap3Name,
          prefix: 'glyphicon',
          iconColor: poiSymbolColor,
          extraClasses: this.exchangeData.selectedPOISize.iconClassName
        });
      }          
    } */

    var newMarker;

    if(poiFeature.geometry.type === "Point"){              
      // LAT LON order
      //newMarker = L.marker([Number(poiFeature.geometry.coordinates[1]), Number(poiFeature.geometry.coordinates[0])], { icon: customMarker });
      newMarker = L.marker([Number(poiFeature.geometry.coordinates[1]), Number(poiFeature.geometry.coordinates[0])]);

      //populate the original geoJSOn feature to the marker layer!
      newMarker.feature = poiFeature;
      newMarker.metadataObject = metadataObject;
    }
    else if (poiFeature.geometry.type === "MultiPoint"){

      // simply take the first point as feature reference POI
      // LAT LON order
      //newMarker = L.marker([Number(poiFeature.geometry.coordinates[0][1]), Number(poiFeature.geometry.coordinates[0][0])], { icon: customMarker });
      newMarker = L.marker([Number(poiFeature.geometry.coordinates[0][1]), Number(poiFeature.geometry.coordinates[0][0])]);

      //populate the original geoJSOn feature to the marker layer!
      newMarker.feature = poiFeature;
      newMarker.metadataObject = metadataObject;
    }
    else{
      console.error("NO POI object: instead got feature of type " + poiFeature.geometry.type);
    }

    if(poiMarkerStyle == "text" && poiMarkerText) {
      newMarker = this.ajskommonitorGenericMapHelperServiceProvider.bindPOITextStyleTooltip(newMarker, poiMarkerText, poiSymbolColor);
    }
    
    return newMarker;
  }
  
  addPoiMarker(markers, newMarker) {
    return this.ajskommonitorGenericMapHelperServiceProvider.addPoiMarker(markers, newMarker);
  }

  createCustomMarkersFromWfsPoints(wfsLayer, poiMarkerLayer, dataset) {
    return ajskommonitorGenericMapHelperServiceProvider.createCustomMarkersFromWfsPoints(wfsLayer, poiMarkerLayer, dataset);
  }

  clearMap(map){
    if(map){
      map.off();
      map.remove();
    }
  }

  initMap(domId, withLayerControl, withGeosearchControl, withDrawControl, withScreenshoter, drawResourceType, editMode) {
    // clean any old map instance
    var domNode:any = document.getElementById(domId);

    while (domNode.hasChildNodes()) {
      domNode.removeChild(domNode.lastChild);
    }

    let layerControl, map, geosearchControl, backgroundLayer, drawControlObject, screenshoter;

    // backgroundLayer
    // backgroundLayer = this.generateBackgroundMap_osmGrayscale();
    backgroundLayer = this.generateBackgroundMap_cartoDbPositron();

    map = L.map(domId, {
      center: [window.__env.initialLatitude, window.__env.initialLongitude],
      zoom: window.__env.initialZoomLevel,
      zoomDelta: 0.25,
      zoomSnap: 0.25,
      layers: [backgroundLayer]
    });

    L.control.scale().addTo(map);

    if (withLayerControl) {
      layerControl = this.initLayerControl(map, backgroundLayer);
    }


    if (withGeosearchControl) {
      geosearchControl = this.initGeosearchControl(map);
    }

    // todo
    /* if (withDrawControl) {
      drawControlObject = this.initDrawControl(map, drawResourceType, editMode);
    } */

    if(withScreenshoter){
      //screenshoter = L.simpleMapScreenshoter(this.screenshoterOptions).addTo(map);
    }

    this.invalidateMap(map);

    return {
      "map": map,
      "layerControl": layerControl,
      "backgroundLayer": backgroundLayer,
      "geosearchControl": geosearchControl,
      "drawControlObject": drawControlObject,
      "screenshoter": screenshoter
    }
  }

  generateBackgroundMap_cartoDbPositron() {
    return new L.TileLayer("https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", { minZoom: window.__env.minZoomLevel, maxZoom: window.__env.maxZoomLevel, attribution: "Map data © CartoDB Positron" });
  }

  initLayerControl(map, backgroundLayer) {
    let baseLayers = {
      "Hintergrundkarte (CartoDB Positron)": backgroundLayer
    };
    let overlays = {};

    return L.control.layers(baseLayers, overlays, { position: "topright" }).addTo(map);
  }

  initGeosearchControl(map) {

    // todo
    /////////////////////////////////////////////////////
    ///// LEAFLET GEOSEARCH SETUP
    /////////////////////////////////////////////////////
    /* var GeoSearchControl = window.GeoSearch.GeoSearchControl;
    var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;

    // remaining is the same as in the docs, accept for the var instead of const declarations
    var provider = new OpenStreetMapProvider(
      {
        params: {
          'accept-language': 'de', // render results in Dutch
          countrycodes: 'de', // limit search results to the Netherlands
          addressdetails: 1, // include additional address detail parts  
          viewbox: "" + (Number(__env.initialLongitude) - 0.001) + "," + (Number(__env.initialLatitude) - 0.001) + "," + (Number(__env.initialLongitude) + 0.001) + "," + (Number(__env.initialLatitude) + 0.001)
        },
        searchUrl: __env.targetUrlToGeocoderService + '/search',
        reverseUrl: __env.targetUrlToGeocoderService + '/reverse'
      }
    );

    let geosearchControl = new GeoSearchControl({
      position: "topright",
      provider: provider,
      style: 'button',
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: false,                                   // optional: true|false  - default true
      showPopup: false,                                   // optional: true|false  - default false
      marker: {                                           // optional: L.Marker    - default L.Icon.Default
        icon: new L.Icon.Default(),
        draggable: false,
      },
      popupFormat: ({ query, result }) => result.label,   // optional: function    - default returns result label
      maxMarkers: 1,                                      // optional: number      - default 1
      retainZoomLevel: false,                             // optional: true|false  - default false
      animateZoom: true,                                  // optional: true|false  - default true
      autoClose: false,                                   // optional: true|false  - default false
      searchLabel: 'Suche nach Adressen ...',                       // optional: string      - default 'Enter address'
      keepResult: false                                   // optional: true|false  - default false
    });

    return geosearchControl.addTo(map); */
  }

   initDrawControlOptions(featureLayer, resourceType, enableDrawToolbar, editMode) {
    let options:any = {
      position: 'bottomright'
    };

    // only allow edit toolbar if creating/editing items
    if (editMode != 'delete') {
      options.edit = {
        featureGroup: featureLayer
      };
    }

    if (enableDrawToolbar) {
      options.draw = {
        polyline: resourceType == this.resourceType_line ? true : false,
        polygon: resourceType == this.resourceType_polygon ? true : false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: resourceType == this.resourceType_point ? true : false
      };
    }
    else {
      options.draw = false;
    }

    return options;
  }

  initDrawControl(map, resourceType, editMode) {
    // FeatureGroup is to store editable layers
    let featureLayer = new L.FeatureGroup();



    map.addLayer(featureLayer);
    let enableDraw = false;
    if (editMode === "create") {
      enableDraw = true;
    }
    let drawControlOptions = this.initDrawControlOptions(featureLayer, resourceType, enableDraw, editMode);

    let drawControl = new L.Control.Draw(drawControlOptions);

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (event) => {
      var layer = event.layer;

      featureLayer.addLayer(layer);

      // disable draw tools
      map.removeControl(drawControl);
      drawControl = new L.Control.Draw(this.initDrawControlOptions(featureLayer, resourceType, false, editMode));
      map.addControl(drawControl);

      this.broadcastService.broadcast("onUpdateSingleFeatureGeometry", [featureLayer.toGeoJSON(), drawControl]);
    });

    map.on(L.Draw.Event.EDITED, (event) => {

      this.broadcastService.broadcast("onUpdateSingleFeatureGeometry", [featureLayer.toGeoJSON(), drawControl]);
    });

    map.on(L.Draw.Event.DELETED, (event) => {

      // reinit featureGroupLayer
      featureLayer.clearLayers();

      // enable draw tools
      map.removeControl(drawControl);
      drawControl = new L.Control.Draw(this.initDrawControlOptions(featureLayer, resourceType, true, editMode));
      map.addControl(drawControl);

      this.broadcastService.broadcast("onUpdateSingleFeatureGeometry", [undefined, drawControl]);
    });

    return {
      "drawControl": drawControl,
      "featureLayer": featureLayer
    }
  }

  invalidateMap(map) {
    if (map) {
      // just wait a bit in order to ensure that map element is visible to make invalidateSize actually work
      setTimeout(() => {
        map.invalidateSize(true);
      }, 500);
    }
  }

   addDataLayer(geoJSON, map, layerControl, layerName, onEachFeature, pointToLayer, style) {

    let geojsonLayer = L.geoJSON(geoJSON, {
      onEachFeature: onEachFeature,
      pointToLayer: pointToLayer,
      style: style
    });

    if (map) {

      geojsonLayer.addTo(map);

      if (geoJSON.features && geoJSON.features.length > 0) {
        map.fitBounds(geojsonLayer.getBounds());
      }
      this.invalidateMap(map);

      if(layerControl && layerName){
        layerControl.addOverlay(geojsonLayer, layerName);
      }
    }

    return geojsonLayer;
  }
}
