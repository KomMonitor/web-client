import { Injectable, inject } from '@angular/core';
import * as leafletNs from 'leaflet';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { PoiPresentationService } from 'services/poi-presentation-service/poi-presentation.service';
import 'leaflet.awesome-markers';

import 'leaflet-draw';
import { IconTranslateService } from 'services/icon-translate/icon-translate.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeaturePopupHelperService } from 'services/feature-popup-helper-service/feature-popup-helper.service';
import { createGrayscaleTileLayer } from 'util/leaflet-grayscale';
import { DEFAULT_POI_SIZE } from 'services/poi-presentation-service/poi-presentation.service';

// UMD Leaflet plugins (leaflet.awesome-markers, leaflet-draw, ...) augment Leaflet's
// *live* exports object with top-level members like `L.AwesomeMarkers` / `L.Draw`. In
// production, Angular's esbuild ESM/CJS interop hands each module a *snapshot* of the
// Leaflet namespace captured before those plugins run, so newly added top-level members
// are missing from `import * as L` (see util/leaflet-cluster.ts for the full story).
// Leaflet's UMD assigns its live exports to `window.L`, which the plugins do mutate, so
// we bind `L` to that live object here; core `L.*` calls behave identically.
const L: any = (window as unknown as { L?: typeof leafletNs }).L ?? leafletNs;

@Injectable({
  providedIn: 'root',
})
export class GenericMapHelperService {
  private poiPresentationService = inject(PoiPresentationService);
  private broadcastService = inject(BroadcastService);
  private iconTranslate = inject(IconTranslateService);
  private envConfigService = inject(EnvConfigService);
  private featurePopupHelperService = inject(FeaturePopupHelperService);

  resourceType_point = 'POINT';
  resourceType_line = 'LINE';
  resourceType_polygon = 'POLYGON';

  screenshoterOptions = {
    cropImageByInnerWH: true, // crop blank opacity from image borders
    hidden: true, // hide screen icon
    preventDownload: false, // prevent download on button click
    domtoimageOptions: {}, // see options for dom-to-image
    position: 'topleft', // position of take screen icon
    screenName: 'screen', // string or function
    // hideElementsWithSelectors: ['.leaflet-control-container'], // by default hide map controls All els must be child of _map._container
    hideElementsWithSelectors: [], // by default hide map controls All els must be child of _map._container
    mimeType: 'image/png', // used if format == image,
    caption: null, // string or function, added caption to bottom of screen
    captionFontSize: 15,
    captionFont: 'Arial',
    captionColor: 'black',
    captionBgColor: 'white',
    captionOffset: 5,
    // callback for manually edit map if have warn: "May be map size very big on that zoom level, we have error"
    // and screenshot not created
    onPixelDataFail: async function ({
      node: _node,
      plugin,
      error: _error,
      mapPane: _mapPane,
      domtoimageOptions,
    }) {
      // Solutions:
      // decrease size of map
      // or decrease zoom level
      // or remove elements with big distanses
      // and after that return image in Promise - plugin._getPixelDataOfNormalMap
      return plugin._getPixelDataOfNormalMap(domtoimageOptions);
    },
  };

  removeLayerFromLayerControl(layerControl, layer) {
    if (layerControl && layer) {
      layerControl.removeLayer(layer);
    }
  }

  removeLayerFromMap(map, layer) {
    if (map && layer) {
      map.removeLayer(layer);
    }
  }

  removeControlFromMap(map, control) {
    map.removeControl(control);
  }

  createCustomMarker(
    poiFeature,
    poiMarkerStyle,
    poiMarkerText,
    poiSymbolColor,
    poiMarkerColor,
    poiSymbolBootstrap3Name,
    metadataObject
  ) {
    if (poiFeature.properties['geocoder_geocoderank'] == 2) poiMarkerColor = 'green';

    const customMarker = L.AwesomeMarkers.icon({
      icon: this.iconTranslate.translate(poiSymbolBootstrap3Name),
      prefix: 'fa',
      markerColor: poiMarkerColor,
      iconColor: poiSymbolColor,
      extraClasses: `${this.poiPresentationService.selectedPoiSize.iconClassName} vector-marker-icon-color-${poiMarkerColor}`,
    });

    let newMarker;

    if (poiFeature.geometry.type === 'Point') {
      // LAT LON order
      newMarker = L.marker(
        [Number(poiFeature.geometry.coordinates[1]), Number(poiFeature.geometry.coordinates[0])],
        { icon: customMarker }
      );

      //populate the original geoJSOn feature to the marker layer!
      newMarker.feature = poiFeature;
      newMarker.metadataObject = metadataObject;
    } else if (poiFeature.geometry.type === 'MultiPoint') {
      // simply take the first point as feature reference POI
      // LAT LON order
      newMarker = L.marker(
        [
          Number(poiFeature.geometry.coordinates[0][1]),
          Number(poiFeature.geometry.coordinates[0][0]),
        ],
        { icon: customMarker }
      );

      //populate the original geoJSOn feature to the marker layer!
      newMarker.feature = poiFeature;
      newMarker.metadataObject = metadataObject;
    } else {
      console.error('NO POI object: instead got feature of type ' + poiFeature.geometry.type);
    }

    if (poiMarkerStyle == 'text' && poiMarkerText) {
      newMarker = this.bindPOITextStyleTooltip(newMarker, poiMarkerText, poiSymbolColor);
    }

    return newMarker;
  }

  bindPOITextStyleTooltip(marker, poiText, poiSymbolColor) {
    marker.options.icon.options.icon = '';
    let fontSize = '13px;';
    let offset = [0, -25];

    if (DEFAULT_POI_SIZE.label == 'sehr klein') {
      offset = [0, -12];
      if (poiText.length == 1) {
        fontSize = '9px';
      } else if (poiText.length == 2) {
        fontSize = '6px';
      } else if (poiText.length == 3) {
        fontSize = '4px';
      }
    } else if (DEFAULT_POI_SIZE.label == 'klein') {
      offset = [0, -20];
      if (poiText.length == 1) {
        fontSize = '11px';
      } else if (poiText.length == 2) {
        fontSize = '8px';
      } else if (poiText.length == 3) {
        fontSize = '5px';
      }
    } else if (DEFAULT_POI_SIZE.label == 'mittel') {
      offset = [0, -25];
      if (poiText.length == 1) {
        fontSize = '13px';
      } else if (poiText.length == 2) {
        fontSize = '11px';
      } else if (poiText.length == 3) {
        fontSize = '9px';
      }
    } else if (DEFAULT_POI_SIZE.label == 'groß') {
      offset = [0, -32];
      if (poiText.length == 1) {
        fontSize = '20px';
      } else if (poiText.length == 2) {
        fontSize = '15px';
      } else if (poiText.length == 3) {
        fontSize = '10px';
      }
    }

    marker.bindTooltip(
      "<div style='color:" +
        poiSymbolColor +
        '; font-size: ' +
        fontSize +
        "'>" +
        poiText +
        '</div>',
      {
        permanent: true,
        direction: 'center',
        className: 'poi-text-tooltip',
        offset: offset,
      }
    );

    return marker;
  }

  addPoiMarker(markers, poiMarker) {
    const popupContent = this.featurePopupHelperService.buildFeaturePropertiesPopup(
      poiMarker.feature.properties,
      'poiInfoPopupContent'
    );

    if (poiMarker.feature.properties.name) {
      poiMarker.bindPopup(poiMarker.feature.properties.name + '\n\n' + popupContent);
    } else if (poiMarker.feature.properties.NAME) {
      poiMarker.bindPopup(poiMarker.feature.properties.NAME + '\n\n' + popupContent);
    } else if (poiMarker.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]) {
      poiMarker.bindPopup(
        poiMarker.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] +
          '\n\n' +
          popupContent
      );
    } else {
      // poiMarker.bindPopup(propertiesString);
      poiMarker.bindPopup(popupContent);
    }
    markers.addLayer(poiMarker);

    return markers;
  }

  createCustomMarkersFromWfsPoints(wfsLayer, poiMarkerLayer, dataset) {
    for (const layerPropName in wfsLayer._layers) {
      const geoJSONFeature = wfsLayer._layers[layerPropName].feature;
      const latlng = wfsLayer._layers[layerPropName]._latlng;

      geoJSONFeature.geometry = {
        type: 'Point',
        coordinates: [latlng.lng, latlng.lat],
      };

      const customMarker = this.createCustomMarker(
        geoJSONFeature,
        dataset.poiMarkerStyle,
        dataset.poiMarkerText,
        dataset.poiSymbolColor,
        dataset.poiMarkerColor,
        dataset.poiSymbolBootstrap3Name,
        dataset
      );
      poiMarkerLayer = this.addPoiMarker(poiMarkerLayer, customMarker);
    }

    return poiMarkerLayer;
  }

  clearMap(map) {
    if (map) {
      map.off();
      map.remove();
    }
  }

  initMap(
    domId,
    withLayerControl,
    withGeosearchControl,
    withDrawControl,
    withScreenshoter,
    drawResourceType,
    editMode
  ) {
    // clean any old map instance
    const domNode: any = document.getElementById(domId);

    while (domNode.hasChildNodes()) {
      domNode.removeChild(domNode.lastChild);
    }

    let layerControl, geosearchControl, drawControlObject, screenshoter;

    // backgroundLayer
    // backgroundLayer = this.generateBackgroundMap_osmGrayscale();
    const backgroundLayer = this.generateBackgroundMap_cartoDbPositron();

    const map = L.map(domId, {
      center: [this.envConfigService.initialLatitude, this.envConfigService.initialLongitude],
      zoom: this.envConfigService.initialZoomLevel,
      zoomDelta: 0.25,
      zoomSnap: 0.25,
      layers: [backgroundLayer],
    });

    // Fix for leaflet-draw icons
    L.Icon.Default.imagePath = 'assets/leaflet/images/';

    L.control.scale().addTo(map);

    if (withLayerControl) {
      layerControl = this.initLayerControl(map, backgroundLayer);
    }

    if (withGeosearchControl) {
      geosearchControl = this.initGeosearchControl(map);
    }

    // todo
    if (withDrawControl) {
      drawControlObject = this.initDrawControl(map, drawResourceType, editMode);
    }

    /*   if(withScreenshoter){
      screenshoter = (L.simpleMapScreenshoter as any)(this.screenshoterOptions).addTo(map);
    } */

    this.invalidateMap(map);

    return {
      map: map,
      layerControl: layerControl,
      backgroundLayer: backgroundLayer,
      geosearchControl: geosearchControl,
      drawControlObject: drawControlObject,
      screenshoter: screenshoter,
    };
  }

  generateBackgroundMap_cartoDbPositron() {
    return new L.TileLayer('https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      minZoom: this.envConfigService.minZoomLevel,
      maxZoom: this.envConfigService.maxZoomLevel,
      attribution: 'Map data \u00a9 CartoDB Positron',
    });
  }

  /**
   * Builds the configured base layers (TILE_LAYER, TILE_LAYER_GRAYSCALE, WMS)
   * for the main map, keyed by their configured name. Entries with an unknown
   * layer type are skipped (map refactoring plan, Phase 4).
   */
  createBaseLayers(baseLayerConfigs: any[]): Map<string, any> {
    const baseLayersByName = new Map<string, any>();

    for (const baseMapEntry of baseLayerConfigs) {
      if (baseMapEntry.layerType === 'TILE_LAYER_GRAYSCALE') {
        baseLayersByName.set(
          baseMapEntry.name,
          createGrayscaleTileLayer(baseMapEntry.url, {
            minZoom: baseMapEntry.minZoomLevel,
            maxZoom: baseMapEntry.maxZoomLevel,
            attribution: baseMapEntry.attribution_html,
          })
        );
      } else if (baseMapEntry.layerType === 'TILE_LAYER') {
        baseLayersByName.set(
          baseMapEntry.name,
          L.tileLayer(baseMapEntry.url, {
            minZoom: baseMapEntry.minZoomLevel,
            maxZoom: baseMapEntry.maxZoomLevel,
            attribution: baseMapEntry.attribution_html,
          })
        );
      } else if (baseMapEntry.layerType === 'WMS') {
        baseLayersByName.set(
          baseMapEntry.name,
          L.tileLayer.wms(baseMapEntry.url, {
            minZoom: baseMapEntry.minZoomLevel,
            maxZoom: baseMapEntry.maxZoomLevel,
            attribution: baseMapEntry.attribution_html,
            layers: baseMapEntry.layerName_WMS,
            format: 'image/png',
          })
        );
      }
    }

    return baseLayersByName;
  }

  initLayerControl(map, backgroundLayer) {
    const baseLayers = {
      'OpenStreetMap Graustufen': backgroundLayer,
    };
    const overlays = {};

    return L.control.layers(baseLayers, overlays, { position: 'topright' }).addTo(map);
  }

  initGeosearchControl(_map) {
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
          viewbox: "" + (Number(this.envConfigService.initialLongitude) - 0.001) + "," + (Number(this.envConfigService.initialLatitude) - 0.001) + "," + (Number(this.envConfigService.initialLongitude) + 0.001) + "," + (Number(this.envConfigService.initialLatitude) + 0.001)
        },
        searchUrl: this.envConfigService.targetUrlToGeocoderService + '/search',
        reverseUrl: this.envConfigService.targetUrlToGeocoderService + '/reverse'
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
    const options: any = {
      position: 'bottomright',
    };

    // only allow edit toolbar if creating/editing items
    if (editMode != 'delete') {
      options.edit = {
        featureGroup: featureLayer,
      };
    }

    if (enableDrawToolbar) {
      options.draw = {
        polyline: resourceType == this.resourceType_line ? true : false,
        polygon: resourceType == this.resourceType_polygon ? true : false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: resourceType == this.resourceType_point ? true : false,
      };
    } else {
      options.draw = false;
    }

    return options;
  }

  initDrawControl(map, resourceType, editMode) {
    // FeatureGroup is to store editable layers
    const featureLayer = new L.FeatureGroup();

    map.addLayer(featureLayer);
    let enableDraw = false;
    if (editMode === 'create') {
      enableDraw = true;
    }
    const drawControlOptions = this.initDrawControlOptions(
      featureLayer,
      resourceType,
      enableDraw,
      editMode
    );

    let drawControl = new L.Control.Draw(drawControlOptions);

    map.addControl(drawControl);

    // ggf. 'draw:created' etc
    map.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;

      featureLayer.addLayer(layer);

      // disable draw tools
      map.removeControl(drawControl);
      drawControl = new L.Control.Draw(
        this.initDrawControlOptions(featureLayer, resourceType, false, editMode)
      );
      map.addControl(drawControl);

      this.broadcastService.broadcast(BroadcastMessage.OnUpdateSingleFeatureGeometry, [
        featureLayer.toGeoJSON(),
        drawControl,
      ]);
    });

    map.on(L.Draw.Event.EDITED, (_event) => {
      this.broadcastService.broadcast(BroadcastMessage.OnUpdateSingleFeatureGeometry, [
        featureLayer.toGeoJSON(),
        drawControl,
      ]);
    });

    map.on(L.Draw.Event.DELETED, (_event) => {
      // reinit featureGroupLayer
      featureLayer.clearLayers();

      // enable draw tools
      map.removeControl(drawControl);
      drawControl = new L.Control.Draw(
        this.initDrawControlOptions(featureLayer, resourceType, true, editMode)
      );
      map.addControl(drawControl);

      this.broadcastService.broadcast(BroadcastMessage.OnUpdateSingleFeatureGeometry, [
        undefined,
        drawControl,
      ]);
    });

    return {
      drawControl: drawControl,
      featureLayer: featureLayer,
    };
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
    const geojsonLayer = L.geoJSON(geoJSON, {
      onEachFeature: onEachFeature,
      pointToLayer: pointToLayer,
      style: style,
    });

    if (map) {
      geojsonLayer.addTo(map);

      if (geoJSON.features && geoJSON.features.length > 0) {
        map.fitBounds(geojsonLayer.getBounds());
      }
      this.invalidateMap(map);

      if (layerControl && layerName) {
        layerControl.addOverlay(geojsonLayer, layerName);
      }
    }

    return geojsonLayer;
  }

  zoomToLayer(map, layer) {
    // guard against plain L.layerGroup()/other layer types that don't implement
    // getBounds() (only FeatureGroup/GeoJSON/Path layers etc. do) — calling it
    // unconditionally would throw "layer.getBounds is not a function"
    if (map && layer && typeof layer.getBounds === 'function' && layer.getBounds()) {
      // just wait a bit in order to ensure that map element is visible to make invalidateSize actually work
      setTimeout(function () {
        map.fitBounds(layer.getBounds());
      }, 750);
    }
  }

  changeEditableFeature(feature, featureLayer) {
    const singlePointLayer = L.marker([
      feature.geometry.coordinates[1],
      feature.geometry.coordinates[0],
    ]);
    featureLayer.clearLayers();
    featureLayer.addLayer(singlePointLayer);
  }
}
