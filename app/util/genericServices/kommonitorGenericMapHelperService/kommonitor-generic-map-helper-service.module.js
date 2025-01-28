angular.module('kommonitorGenericMapHelper', ['kommonitorDataExchange']);

angular
  .module('kommonitorGenericMapHelper', [])
  .service(
    'kommonitorGenericMapHelperService', ['$rootScope', '__env', '$timeout', 'kommonitorDataExchangeService', 
    function ($rootScope, __env, $timeout, kommonitorDataExchangeService) {

      var self = this;

      // from the docs, most of it is probably not needed
      this.screenshoterOptions = {
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
        onPixelDataFail: async function ({ node, plugin, error, mapPane, domtoimageOptions }) {
          // Solutions:
          // decrease size of map
          // or decrease zoom level
          // or remove elements with big distanses
          // and after that return image in Promise - plugin._getPixelDataOfNormalMap
          return plugin._getPixelDataOfNormalMap(domtoimageOptions)
        }
      }

      this.resourceType_point = "POINT";
      this.resourceType_line = "LINE";
      this.resourceType_polygon = "POLYGON";

      /*
      Localization for draw control
      */
      L.drawLocal = {
        edit: {
          toolbar: {
            actions: {
              save: {
                title: "Bearbeitung speichern.",
                text: "Speichern",
              },
              cancel: {
                title: "Bearbeitung verwerfen.",
                text: "Abbrechen",
              },
              clearAll: {
                title: "Alle Features entfernen.",
                text: "Alle Features entfernen",
              },
            },
            buttons: {
              edit: "Layer editieren.",
              editDisabled: "Keine Layer zum editieren vorhanden.",
              remove: "Layer entfernen.",
              removeDisabled: "Keine Layer zum entfernen vorhanden.",
            },
          },
          handlers: {
            edit: {
              tooltip: {
                text: "Bearbeitungspunkte oder Punktmarker ziehen, um Feature zu editieren.",
                subtext: "Abbrechen klicken, um Bearbeitung zu verwefen.",
              },
            },
            remove: {
              tooltip: {
                text: "Feature anklicken, um es zu entfernen",
              },
            },
          }
        },
        draw: {
          toolbar: {
            actions: {
              title: "Zeichnen abbrechen",
              text: "Abbrechen",
            },
            finish: {
              title: "Zeichnen beenden",
              text: "Beenden",
            },
            undo: {
              title: "Zuletzt gezeichneten Punkt entfernen",
              text: "Letzten Punkt entfernen",
            },
            buttons: {
              polyline: "Polylinie zeichnen",
              polygon: "Polygon zeichnen",
              rectangle: "Rechteck zeichnen",
              circle: "Kreis zeichnen",
              marker: "Punkt zeichnen",
              circlemarker: "Kreispunkt zeichnen",
            },
          },
          handlers: {
            circle: {
              tooltip: {
                start: "Klicken und halten, um Kreis zu zeichnen.",
              },
              radius: "Radius",
            },
            circlemarker: {
              tooltip: {
                start: "Klicken, um einen Punkt zu markieren.",
              },
            },
            marker: {
              tooltip: {
                start: "Klicken, um einen Punkt zu markieren.",
              },
            },
            polygon: {
              tooltip: {
                start: "Klicken, um ein Polygon zu beginnen.",
                cont: "Klicken, um das Polygon weiter zu zeichnen.",
                end: "Ersten Punkt anklicken, um Polygon zu beenden.",
              },
            },
            polyline: {
              error: "<strong>Fehler:</strong> Selbstueberschneidung!",
              tooltip: {
                start: "Klicken, um eine Polylinie zu beginnen.",
                cont: "Klicken, um die Polylinie weiter zu zeichnen.",
                end: "Letzten Punkt erneut anklicken, um Polylinie zu beenden.",
              },
            },
            rectangle: {
              tooltip: {
                start: "Klicken und halten, um Rechteck zu zeichnen.",
              },
            },
            simpleshape: {
              tooltip: {
                end: "Maus loslassen, um Zeichnung zu beenden.",
              },
            },
          }
        }

      };

      /*
         * L.TileLayer.Grayscale is a regular tilelayer with grayscale makeover.
         */

      L.TileLayer.Grayscale = L.TileLayer.extend({
        options: {
          quotaRed: 21,
          quotaGreen: 71,
          quotaBlue: 8,
          quotaDividerTune: 0,
          quotaDivider: function () {
            return this.quotaRed + this.quotaGreen + this.quotaBlue + this.quotaDividerTune;
          }
        },

        initialize: function (url, options) {
          options = options || {};
          options.crossOrigin = true;
          L.TileLayer.prototype.initialize.call(this, url, options);

          this.on('tileload', function (e) {
            this._makeGrayscale(e.tile);
          });
        },

        _createTile: function () {
          var tile = L.TileLayer.prototype._createTile.call(this);
          tile.crossOrigin = "Anonymous";
          return tile;
        },

        _makeGrayscale: function (img) {
          if (img.getAttribute('data-grayscaled'))
            return;

          img.crossOrigin = '';
          var canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var pix = imgd.data;
          for (var i = 0, n = pix.length; i < n; i += 4) {
            pix[i] = pix[i + 1] = pix[i + 2] = (this.options.quotaRed * pix[i] + this.options.quotaGreen * pix[i + 1] + this.options.quotaBlue * pix[i + 2]) / this.options.quotaDivider();
          }
          ctx.putImageData(imgd, 0, 0);
          img.setAttribute('data-grayscaled', true);
          img.src = canvas.toDataURL();
        }
      });

      this.invalidateMap = function (map) {
        if (map) {
          // just wait a bit in order to ensure that map element is visible to make invalidateSize actually work
          $timeout(function () {
            map.invalidateSize(true);
          }, 500);
        }
      };

      this.zoomToLayer = function (map, layer) {
        if (map && layer && layer.getBounds()) {
          // just wait a bit in order to ensure that map element is visible to make invalidateSize actually work
          $timeout(function () {
            map.fitBounds(layer.getBounds());
          }, 750);
        }
      };

      this.generateBackgroundMap_osmGrayscale = function () {
        return new L.TileLayer.Grayscale("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel, attribution: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors" });
      };

      this.generateBackgroundMap_cartoDbPositron = function () {
        return new L.TileLayer("https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", { minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel, attribution: "Map data © CartoDB Positron" });
      };

      this.clearMap = function(map){
        if(map){
          map.off();
          map.remove();
        }
      };

      this.initMap = function (domId, withLayerControl, withGeosearchControl, withDrawControl, withScreenshoter, drawResourceType, editMode) {
        // clean any old map instance
        var domNode = document.getElementById(domId);

        while (domNode.hasChildNodes()) {
          domNode.removeChild(domNode.lastChild);
        }

        let layerControl, map, geosearchControl, backgroundLayer, drawControlObject, screenshoter;

        // backgroundLayer
        // backgroundLayer = this.generateBackgroundMap_osmGrayscale();
        backgroundLayer = this.generateBackgroundMap_cartoDbPositron();

        map = L.map(domId, {
          center: [__env.initialLatitude, __env.initialLongitude],
          zoom: __env.initialZoomLevel,
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

        if (withDrawControl) {
          drawControlObject = this.initDrawControl(map, drawResourceType, editMode);
        }

        if(withScreenshoter){
          screenshoter = L.simpleMapScreenshoter(this.screenshoterOptions).addTo(map);
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

      };

      this.initLayerControl = function (map, backgroundLayer) {
        let baseLayers = {
          "Hintergrundkarte (CartoDB Positron)": backgroundLayer
        };
        let overlays = {};

        return L.control.layers(baseLayers, overlays, { position: "topright" }).addTo(map);
      };

      this.initGeosearchControl = function (map) {
        /////////////////////////////////////////////////////
        ///// LEAFLET GEOSEARCH SETUP
        /////////////////////////////////////////////////////
        var GeoSearchControl = window.GeoSearch.GeoSearchControl;
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

        return geosearchControl.addTo(map);
      };

      this.initDrawControlOptions = function (featureLayer, resourceType, enableDrawToolbar, editMode) {
        let options = {
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
      };

      this.initDrawControl = function (map, resourceType, editMode) {
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

        map.on(L.Draw.Event.CREATED, function (event) {
          var layer = event.layer;

          featureLayer.addLayer(layer);

          // disable draw tools
          map.removeControl(drawControl);
          drawControl = new L.Control.Draw(self.initDrawControlOptions(featureLayer, resourceType, false, editMode));
          map.addControl(drawControl);

          $rootScope.$broadcast("onUpdateSingleFeatureGeometry", featureLayer.toGeoJSON(), drawControl);
        });

        map.on(L.Draw.Event.EDITED, function (event) {

          $rootScope.$broadcast("onUpdateSingleFeatureGeometry", featureLayer.toGeoJSON(), drawControl);
        });

        map.on(L.Draw.Event.DELETED, function (event) {

          // reinit featureGroupLayer
          featureLayer.clearLayers();

          // enable draw tools
          map.removeControl(drawControl);
          drawControl = new L.Control.Draw(self.initDrawControlOptions(featureLayer, resourceType, true, editMode));
          map.addControl(drawControl);

          $rootScope.$broadcast("onUpdateSingleFeatureGeometry", undefined, drawControl);
        });

        return {
          "drawControl": drawControl,
          "featureLayer": featureLayer
        }
      };

      this.changeEditableFeature = function (feature, featureLayer) {
        let singlePointLayer = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
        featureLayer.clearLayers();
        featureLayer.addLayer(singlePointLayer);
      }

      this.addDataLayer = function (geoJSON, map, layerControl, layerName, onEachFeature, pointToLayer, style) {

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
          self.invalidateMap(map);

          if(layerControl && layerName){
            layerControl.addOverlay(geojsonLayer, layerName);
          }
        }

        return geojsonLayer;
      };

      this.removeLayerFromMap = function(map, layer){
        if(map && layer){
          map.removeLayer(layer);
        }
      };

      this.removeLayerFromLayerControl = function(layerControl, layer){
        if(layerControl && layer){
          layerControl.removeLayer(layer);
        }
      };

      /*
      HELPER SECTION
      */

      this.createCustomMarkersFromWfsPoints = function(wfsLayer, poiMarkerLayer, dataset){
        for (var layerPropName in wfsLayer._layers){
          var geoJSONFeature = wfsLayer._layers[layerPropName].feature;
          var latlng = wfsLayer._layers[layerPropName]._latlng;

          geoJSONFeature.geometry = {
            type: "Point",
            coordinates: [latlng.lng, latlng.lat]
          };

          var customMarker = this.createCustomMarker(geoJSONFeature, dataset.poiMarkerStyle, dataset.poiMarkerText, dataset.poiSymbolColor, dataset.poiMarkerColor, dataset.poiSymbolBootstrap3Name, dataset);
          poiMarkerLayer = this.addPoiMarker(poiMarkerLayer, customMarker);
        }

        return poiMarkerLayer;
      };

      this.createCustomMarker = function(poiFeature, poiMarkerStyle, poiMarkerText, poiSymbolColor, poiMarkerColor, poiSymbolBootstrap3Name, metadataObject){
        var customMarker;

        var customMarker = L.VectorMarkers.icon({
          viewBox: '0 0 32 52',
          iconSize: [30 * kommonitorDataExchangeService.selectedPOISize.scaleFactor, 50 * kommonitorDataExchangeService.selectedPOISize.scaleFactor],
          iconAnchor: [ 15 * kommonitorDataExchangeService.selectedPOISize.scaleFactor, 50 * kommonitorDataExchangeService.selectedPOISize.scaleFactor ],
          shadowSize: [0, 0], // ausgeschaltete Schatten
          // um Schatten einzuschalten: //shadowSize:   [36 * kommonitorDataExchangeService.selectedPOISize.scaleFactor, 16 * kommonitorDataExchangeService.selectedPOISize.scaleFactor ],
          // um Schatten einzuschalten: //shadowAnchor: [35 * kommonitorDataExchangeService.selectedPOISize.scaleFactor, 10 * kommonitorDataExchangeService.selectedPOISize.scaleFactor],
          icon: poiSymbolBootstrap3Name,
          prefix: 'glyphicon',
          markerColor: poiMarkerColor,
          iconColor: poiSymbolColor,
          extraClasses: kommonitorDataExchangeService.selectedPOISize.iconClassName
        });

        // special treatment for geocoded results
        if(metadataObject.isGeocodedDataset){
          if (poiFeature.properties["geocoder_geocoderank"] == 2){
            customMarker = L.VectorMarkers.icon({
              markerColor: "green",
              viewBox: '0 0 32 52',
              iconSize: [30 * kommonitorDataExchangeService.selectedPOISize.scaleFactor, 50 * kommonitorDataExchangeService.selectedPOISize.scaleFactor],
              iconAnchor: [ 15 * kommonitorDataExchangeService.selectedPOISize.scaleFactor, 50 * kommonitorDataExchangeService.selectedPOISize.scaleFactor ],
              shadowSize: [0, 0], // ausgeschaltete Schatten
              // um Schatten einzuschalten: //shadowSize:   [36 * kommonitorDataExchangeService.selectedPOISize.scaleFactor, 16 * kommonitorDataExchangeService.selectedPOISize.scaleFactor ],
              // um Schatten einzuschalten: //shadowAnchor: [35 * kommonitorDataExchangeService.selectedPOISize.scaleFactor, 10 * kommonitorDataExchangeService.selectedPOISize.scaleFactor],
              icon: poiSymbolBootstrap3Name,
              prefix: 'glyphicon',
              iconColor: poiSymbolColor,
              extraClasses: kommonitorDataExchangeService.selectedPOISize.iconClassName
            });
          }          
        }

        var newMarker;

        if(poiFeature.geometry.type === "Point"){              
          // LAT LON order
          newMarker = L.marker([Number(poiFeature.geometry.coordinates[1]), Number(poiFeature.geometry.coordinates[0])], { icon: customMarker });

          //populate the original geoJSOn feature to the marker layer!
          newMarker.feature = poiFeature;
          newMarker.metadataObject = metadataObject;
        }
        else if (poiFeature.geometry.type === "MultiPoint"){

          // simply take the first point as feature reference POI
          // LAT LON order
          newMarker = L.marker([Number(poiFeature.geometry.coordinates[0][1]), Number(poiFeature.geometry.coordinates[0][0])], { icon: customMarker });

          //populate the original geoJSOn feature to the marker layer!
          newMarker.feature = poiFeature;
          newMarker.metadataObject = metadataObject;
        }
        else{
          console.error("NO POI object: instead got feature of type " + poiFeature.geometry.type);
        }

        if(poiMarkerStyle == "text" && poiMarkerText) {
          newMarker = this.bindPOITextStyleTooltip(newMarker, poiMarkerText, poiSymbolColor);
        }
        
        return newMarker;

      };

      this.bindPOITextStyleTooltip = function (marker, poiText, poiSymbolColor) {
        marker.options.icon.options.icon = "";
        let fontSize = "13px;"
        let offset = [0, -25];

        if (kommonitorDataExchangeService.selectedPOISize.label == "sehr klein") {
          offset = [0, -12];
          if(poiText.length == 1) { fontSize = "9px"; }
          else if(poiText.length == 2) { fontSize = "6px"; }
          else if(poiText.length == 3) { fontSize = "4px"; }
        }
        else if (kommonitorDataExchangeService.selectedPOISize.label == "klein") {
          offset = [0, -20];
          if(poiText.length == 1) { fontSize = "11px"; }
          else if(poiText.length == 2) { fontSize = "8px"; }
          else if(poiText.length == 3) { fontSize = "5px"; }
        }
        else if (kommonitorDataExchangeService.selectedPOISize.label == "mittel") {
          offset = [0, -25];
          if(poiText.length == 1) { fontSize = "13px"; }
          else if(poiText.length == 2) { fontSize = "11px"; }
          else if(poiText.length == 3) { fontSize = "9px"; }
        }
        else if (kommonitorDataExchangeService.selectedPOISize.label == "groß") {
          offset = [0, -32];
          if(poiText.length == 1) { fontSize = "20px"; }
          else if(poiText.length == 2) { fontSize = "15px"; }
          else if(poiText.length == 3) { fontSize = "10px"; }
        }
      
        marker.bindTooltip(
          "<div style='color:" + poiSymbolColor 
          +"; font-size: " + fontSize + "'>" 
          + poiText + "</div>", {
          permanent: true,
          direction: 'center',
          className: "poi-text-tooltip",
          offset: offset
        });

        return marker;
      }

      this.addPoiMarker = function(markers, poiMarker){
            
        // var propertiesString = "<pre>" + JSON.stringify(poiMarker.feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

        var popupContent = '<div class="poiInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
          for (var p in poiMarker.feature.properties) {
              popupContent += '<tr><td>' + p + '</td><td>'+ poiMarker.feature.properties[p] + '</td></tr>';
          }
          popupContent += '</table></div>';

        if (poiMarker.feature.properties.name) {
          poiMarker.bindPopup(poiMarker.feature.properties.name + "\n\n" + popupContent);
        }
        else if (poiMarker.feature.properties.NAME) {
          poiMarker.bindPopup(poiMarker.feature.properties.NAME + "\n\n" + popupContent);
        }
        else if (poiMarker.feature.properties[__env.FEATURE_NAME_PROPERTY_NAME]) {
          poiMarker.bindPopup(poiMarker.feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] + "\n\n" + popupContent);
        }
        else {
          // poiMarker.bindPopup(propertiesString);
          poiMarker.bindPopup(popupContent);
        }
        markers.addLayer(poiMarker);

        return markers;
    };

    this.removeControlFromMap = function(map, control){
      map.removeControl(control);
    }


    }]);
