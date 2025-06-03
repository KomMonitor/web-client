import { ajskommonitorSingleFeatureMapHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable, OnInit } from '@angular/core';
import L from 'leaflet';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';

@Injectable({
  providedIn: 'root'
})
export class SingleFeatureMapHelperService implements OnInit {


  mapParts:any;
  georesourceData_geoJSON:any;

  resourceType_point = "POINT";
  resourceType_line = "LINE";
  resourceType_polygon = "POLYGON";

  // create, edit, delete
  editMode = "create";

  public constructor(
    private genericMapHelperService: GenericMapHelperService,
    private broadcastService: BroadcastService
  ) {
  }

  ngOnInit(): void {
      // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'onUpdateSingleFeatureGeometry' : {
          this.onUpdateSingleFeatureGeometry(values);
        } break;
      }
    });
  }

  onUpdateSingleFeatureGeometry([geoJSON, drawControl]) {
    this.mapParts.drawControlObject.drawControl = drawControl;
  }

  invalidateMap() {
    if(this.mapParts && this.mapParts.map){
      this.genericMapHelperService.invalidateMap(this.mapParts.map);
    } 
  }
  
  zoomToDataLayer() {
    if(this.mapParts && this.mapParts.map && this.mapParts.dataLayer){
      this.genericMapHelperService.zoomToLayer(this.mapParts.map, this.mapParts.dataLayer);
    } 
  }

  initSingleFeatureGeoMap(domId, resourceType) {
    // init leaflet map

    // add geometry editing tool for the respective RESOURCE TYPE

    // add geocoding plugin if it is POINT resource

    // register events that broadcast new geometry to other components

    if(this.mapParts && this.mapParts.map)
    this.genericMapHelperService.clearMap(this.mapParts.map);

    //function (domId, withLayerControl, withGeosearchControl, withDrawControl, drawResourceType, editMode)
    this.mapParts = this.genericMapHelperService.initMap(domId, false, true, true, true, resourceType, this.editMode);
    // response:
    /*
    {
      "map": mapObject,
      "layerControl": layerControl,
      "backgroundLayer": backgroundLayer,
      "geosearchControl": geosearchControl,
      "drawControlObject": drawControlObject
    }
    */
  };

  addDataLayertoSingleFeatureGeoMap(geoJSON) {

    this.georesourceData_geoJSON = geoJSON;

    //function (geoJSON, map, layerControl, layerName)
    this.mapParts.dataLayer = this.genericMapHelperService.addDataLayer(geoJSON, this.mapParts.map, undefined, "", (feature, layer) => {
      layer.on({
        click: () => {

          this.broadcastService.broadcast("singleFeatureSelected", [feature]);

          var popupContent = '<div class="georesourceInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
          for (var p in feature.properties) {
            popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
          }
          popupContent += '</table></div>';

          layer.bindPopup(popupContent);
        }
      });
    }, this.pointToLayer, this.style);
  }

  pointToLayer(geoJsonPoint, latlng) {
    return L.marker(latlng);

     /* return L.circleMarker(latlng, {
          radius: 6
        }); */
  }

  style(feature) {
    return {
      color: "red",
      weight: 1,
      opacity: 1
    };
  }

 /*  
  moved into addDataLayer call to be able to use local vars
 onEachFeature(feature, layer) {
    layer.on({
      click: () => {

        this.broadcastService.broadcast("singleFeatureSelected", [feature]);

        var popupContent = '<div class="georesourceInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
        for (var p in feature.properties) {
          popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
        }
        popupContent += '</table></div>';

        layer.bindPopup(popupContent);
      }
    });
  }; */

  changeEditableFeature(feature) {
    this.genericMapHelperService.changeEditableFeature(feature, this.mapParts.drawControlObject.featureLayer);
  }
}
