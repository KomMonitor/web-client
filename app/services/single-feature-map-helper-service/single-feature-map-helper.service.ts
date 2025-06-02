import { ajskommonitorSingleFeatureMapHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';
import L from 'leaflet';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';

@Injectable({
  providedIn: 'root'
})
export class SingleFeatureMapHelperService {

  pipedData:any;

  mapParts:any;
  georesourceData_geoJSON:any;

  // create, edit, delete
  editMode = "create";

  public constructor(
    @Inject('kommonitorSingleFeatureMapHelperService') private ajskommonitorSingleFeatureMapHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    private genericMapHelperService: GenericMapHelperService,
    private broadcastService: BroadcastService
  ) {
    this.pipedData = this.ajskommonitorSingleFeatureMapHelperServiceProvider;
  }

  invalidateMap() {
    if(this.mapParts && this.mapParts.map){
      this.genericMapHelperService.invalidateMap(this.mapParts.map);
    } 
  }
  
  zoomToDataLayer() {
    this.ajskommonitorSingleFeatureMapHelperServiceProvider.zoomToDataLayer();
  }

  /* initSingleFeatureGeoMap(domId, resourceType) {
    this.ajskommonitorSingleFeatureMapHelperServiceProvider.initSingleFeatureGeoMap(domId, resourceType);
  } */

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

 /*  onEachFeature(feature, layer) {
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
    this.ajskommonitorSingleFeatureMapHelperServiceProvider.changeEditableFeature(feature);
  }
}
