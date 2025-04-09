import { ajskommonitorGenericMapHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';
import * as L from 'leaflet';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Injectable({
  providedIn: 'root'
})
export class GenericMapHelperService {

  pipedData: any;
  exchangeData:DataExchange;

  public constructor(
    @Inject('kommonitorGenericMapHelperService') private ajskommonitorGenericMapHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    private dataExchangeService: DataExchangeService
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
}
