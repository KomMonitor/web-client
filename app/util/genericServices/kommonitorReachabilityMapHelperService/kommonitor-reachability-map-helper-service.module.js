angular.module('kommonitorReachabilityMapHelper', ['kommonitorDataExchange', 'kommonitorGenericMapHelper']);

angular
  .module('kommonitorReachabilityMapHelper')
  .service(
    'kommonitorReachabilityMapHelperService', ['$rootScope', '__env', '$timeout',
    'kommonitorDataExchangeService', 'kommonitorGenericMapHelperService',
    function ($rootScope, __env, $timeout, kommonitorDataExchangeService, kommonitorGenericMapHelperService) {

      var self = this;

      /* Map of mapParts for certain dom IDs
        {
          "map": mapObject,
          "layerControl": layerControl,
          "backgroundLayer": backgroundLayer,
          "geosearchControl": geosearchControl,
          "isochroneLayers": {
            "markerLayer": markerLayer,
            "isochroneLayer": isochroneLayer
          },
          "poiInIsoLayers": poiInIsoLayersMap // map object
        }
        */
      this.mapPartsMap = new Map();

      this.initReachabilityGeoMap = function (domId) {
        // init leaflet map
        let mapParts = this.mapPartsMap.get(domId);

        if (mapParts && mapParts.map)
          kommonitorGenericMapHelperService.clearMap(mapParts.map);

        //function (domId, withLayerControl, withGeosearchControl, withDrawControl, drawResourceType, editMode)
        mapParts = kommonitorGenericMapHelperService.initMap(domId, true, true, false, undefined, this.editMode);
        // response:
        /*
        {
          "map": mapObject,
          "layerControl": layerControl,
          "backgroundLayer": backgroundLayer,
          "geosearchControl": geosearchControl,
        }
        */

        mapParts.isochroneLayers = {
          "markerLayer": undefined,
          "isochroneLayer": undefined
        }

        // empty map of poiInIsoLayers
        mapParts.isochroneLayers.poiInIsoLayers = new Map();

        this.mapPartsMap.set(domId, mapParts);
        return mapParts;
      };

      this.invalidateMaps = function () {

        for (let [key, value] of this.mapPartsMap) {
          self.invalidateMap(key);
        }
      };

      this.invalidateMap = function (domId) {
        let mapParts = this.mapPartsMap.get(domId);
        if (mapParts && mapParts.map) {
          kommonitorGenericMapHelperService.invalidateMap(mapParts.map);
        }
      };

      this.zoomToIsochroneLayers = function () {

        for (let [key, value] of this.mapPartsMap) {
          self.zoomToIsochroneLayer(key);
        }
      };

      this.zoomToIsochroneLayer = function (domId) {
        let mapParts = this.mapPartsMap.get(domId);
        if (mapParts && mapParts.map && mapParts.isochroneLayers && mapParts.isochroneLayers.isochroneLayer) {
          kommonitorGenericMapHelperService.zoomToLayer(mapParts.map, mapParts.isochroneLayers.isochroneLayer);
        }
      };

      this.zoomToMarkerLayer = function (domId) {
        let mapParts = this.mapPartsMap.get(domId);
        if (mapParts && mapParts.map && mapParts.isochroneLayers && mapParts.isochroneLayers.markerLayer) {
          kommonitorGenericMapHelperService.zoomToLayer(mapParts.map, mapParts.isochroneLayers.markerLayer);
        }
      };

      this.styleIsochrones = function (feature) {
        return {
          color: "red",
          weight: 1,
          opacity: 1
        };
      };

      this.onEachFeature_isochrones = function (feature, layer) {
        layer.on({
          click: function () {

            var isochroneValue = layer.feature.properties.value;

            if ($scope.isochroneReachMode === "time") {
              //transform seconds to minutes
              isochroneValue = isochroneValue / 60;
            }
            var popupContent = "" + isochroneValue + " " + cutOffUnitValue;
            // var popupContent = "TestValue";

            if (popupContent)
              layer.bindPopup("Isochrone: " + JSON.stringify(popupContent));
          }
        });
      };

      this.addDataLayertoSingleFeatureGeoMap = function (geoJSON) {

        //function (geoJSON, map, layerControl, layerName)
        this.mapParts.dataLayer = kommonitorGenericMapHelperService.addDataLayer(geoJSON, this.mapParts.map, undefined, "", this.onEachFeature, this.pointToLayer, this.style);
      };

      this.replaceIsochroneMarker = function (domId, lonLatArray) {

        let mapParts = this.mapPartsMap.get(domId);

        if (mapParts && mapParts.isochroneLayers && mapParts.isochroneLayers.markerLayer && mapParts.layerControl) {
          mapParts.layerControl.removeLayer(mapParts.isochroneLayers.markerLayer);
          mapParts.map.removeLayer(mapParts.isochroneLayers.markerLayer);
        }

        mapParts.isochroneLayers.markerLayer = L.featureGroup();

        lonLatArray.forEach(function (lonLat) {
          var layer = L.marker([lonLat[1], lonLat[0]]);
          layer.bindPopup("Startpunkt der Isochronenberechnung");
          layer.addTo(mapParts.isochroneLayers.markerLayer);
        });

        mapParts.layerControl.addOverlay(mapParts.isochroneLayers.markerLayer, "Startpunkte für Isochronenberechnung");
        mapParts.isochroneLayers.markerLayer.addTo(mapParts.map);

        this.invalidateMap(domId);
        this.zoomToMarkerLayer(domId);

        this.mapPartsMap.set(domId, mapParts);
      };

      this.replaceIsochroneGeoJSON = function (domId, geoJSON, transitMode, reachMode, cutOffValues, useMultipleStartPoints, dissolveIsochrones) {

        let mapParts = this.mapPartsMap.get(domId);

        if (mapParts && mapParts.isochroneLayers && mapParts.isochroneLayers.isochroneLayer && mapParts.layerControl) {
          mapParts.layerControl.removeLayer(mapParts.isochroneLayers.isochroneLayer);
          mapParts.map.removeLayer(mapParts.isochroneLayers.isochroneLayer);
        }

        mapParts.isochroneLayers.isochroneLayer = L.featureGroup();

        var cutOffUnitValue = "Meter";
        var reachModeValue = "Distanz";
        if (reachMode === "time") {
          cutOffUnitValue = "Minuten";
          reachModeValue = "Zeit";
        }

        var transitModeValue = "Passant";
        switch (transitMode) {
          case "buffer":
            transitModeValue = "Puffer (Luftlinie)";
            break;
          case "cycling-regular":
            transitModeValue = "Fahrrad";
            break;
          case "driving-car":
            transitModeValue = "PKW";
            break;
          case "wheelchair":
            transitModeValue = "Barrierefrei";
            break;
          default:
            transitModeValue = "Passant";
        }

        kommonitorDataExchangeService.isochroneLegend = {
          transitMode: transitModeValue,
          reachMode: reachModeValue,
          colorValueEntries: [],
          cutOffValues: cutOffValues,
          cutOffUnit: cutOffUnitValue
        };

        if (cutOffValues.length === 0) {
          return;
        }
        else if (cutOffValues.length === 1) {
          kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
            color: "green",
            value: cutOffValues[0]
          }];
        }
        else if (cutOffValues.length === 2) {
          kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
            color: "yellow",
            value: cutOffValues[1]
          },
          {
            color: "green",
            value: cutOffValues[0]
          }];
        }
        else if (cutOffValues.length === 3) {
          kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
            color: "red",
            value: cutOffValues[2]
          },
          {
            color: "yellow",
            value: cutOffValues[1]
          },
          {
            color: "green",
            value: cutOffValues[0]
          }];
        }
        else if (cutOffValues.length === 4) {
          kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
            color: "red",
            value: cutOffValues[3]
          },
          {
            color: "orange",
            value: cutOffValues[2]
          },
          {
            color: "yellow",
            value: cutOffValues[1]
          },
          {
            color: "green",
            value: cutOffValues[0]
          }];
        }
        else if (cutOffValues.length === 5) {
          kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
            color: "brown",
            value: cutOffValues[4]
          }, {
            color: "red",
            value: cutOffValues[3]
          },
          {
            color: "orange",
            value: cutOffValues[2]
          },
          {
            color: "yellow",
            value: cutOffValues[1]
          },
          {
            color: "green",
            value: cutOffValues[0]
          }];
        }
        else {
          kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
            color: "brown",
            value: cutOffValues[4]
          }, {
            color: "red",
            value: cutOffValues[3]
          },
          {
            color: "orange",
            value: cutOffValues[2]
          },
          {
            color: "yellow",
            value: cutOffValues[1]
          },
          {
            color: "green",
            value: cutOffValues[0]
          }];
        }

        if (useMultipleStartPoints && dissolveIsochrones) {
          // merge intersecting isochrones of same cutOffValue

          // execute it 3 times in order to dissolve multiple intersections
          geoJSON = mergeIntersectingIsochrones(geoJSON);
          geoJSON = mergeIntersectingIsochrones(geoJSON);
          geoJSON = mergeIntersectingIsochrones(geoJSON);
        }

        // sort features to ensure correct z-order of layers (begin with smallest isochrones)
        geoJSON.features.sort((a, b) => a.properties.value - b.properties.value);

        for (var index = geoJSON.features.length - 1; index >= 0; index--) {

          var styleIndex = getStyleIndexForFeature(geoJSON.features[index], kommonitorDataExchangeService.isochroneLegend.colorValueEntries, reachMode);

          var style = {
            color: kommonitorDataExchangeService.isochroneLegend.colorValueEntries[styleIndex].color,
            weight: 1,
            opacity: 0.4,
            fillOpacity: 0.3
          };

          L.geoJSON(geoJSON.features[index], {
            style: style,
            onEachFeature: self.onEachFeature_isochrones
          }).addTo(mapParts.isochroneLayers.isochroneLayer);
        }

        mapParts.layerControl.addOverlay(mapParts.isochroneLayers.isochroneLayer, "Erreichbarkeits-Isochronen_" + transitModeValue);
        mapParts.isochroneLayers.isochroneLayer.addTo(mapParts.map);

        this.invalidateMap(domId);
        this.zoomToIsochroneLayer(domId);

        this.mapPartsMap.set(domId, mapParts);
      };

      let getStyleIndexForFeature = function (feature, colorValueEntries, reachMode) {
        var index = 0;
        var featureCutOffValue = feature.properties.value;

        if (reachMode === "time") {
          // answe has time in seconds - we expect minutes!
          featureCutOffValue = featureCutOffValue / 60;
        }

        for (var i = 0; i < colorValueEntries.length; i++) {
          if (featureCutOffValue == colorValueEntries[i].value) {
            index = i;
            break;
          }
        }

        return index;
      };

      let mergeIntersectingIsochrones = function (geoJSON) {
        // use turf to dissolve any overlapping/intersecting isochrones that have the same cutOffValue!

        try {
          var dissolved = turf.dissolve(geoJSON, { propertyName: 'value' });

          return dissolved;
        } catch (e) {
          console.error("Dissolving Isochrones failed with error: " + e);
          console.error("Will return undissolved isochrones");
          return geoJSON;
        } finally {

        }

      };

      this.removeReachabilityLayers = function (domId) {
        let mapParts = this.mapPartsMap.get(domId);

        kommonitorGenericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, mapParts.isochroneLayers.markerLayer);
        kommonitorGenericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, mapParts.isochroneLayers.isochroneLayer);

        kommonitorGenericMapHelperService.removeLayerFromMap(mapParts.map, mapParts.isochroneLayers.markerLayer);
        kommonitorGenericMapHelperService.removeLayerFromMap(mapParts.map, mapParts.isochroneLayers.isochroneLayer);
      };

      /*
      POI IN ISOCHRONES SECTION
      */

      this.addPoiGeoresourceGeoJSON_reachabilityAnalysis = function (domId, georesourceMetadataAndGeoJSON, date, useCluster) {

        let mapParts = this.mapPartsMap.get(domId);

        if (mapParts && mapParts.isochroneLayers && mapParts.isochroneLayers.poiInIsoLayers
          && mapParts.isochroneLayers.poiInIsoLayers.has(georesourceMetadataAndGeoJSON.georesourceId)) {
          let layer = mapParts.isochroneLayers.poiInIsoLayers.get(georesourceMetadataAndGeoJSON.georesourceId);
          kommonitorGenericMapHelperService.removeLayerFromMap(mapParts.map, layer);
          kommonitorGenericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, layer);
        }

        // use leaflet.markercluster to cluster markers!
        var markers;
        if (useCluster) {
          markers = L.markerClusterGroup({
            iconCreateFunction: function (cluster) {
              var childCount = cluster.getChildCount();

              var c = 'cluster-';
              if (childCount < 10) {
                c += 'small';
              } else if (childCount < 30) {
                c += 'medium';
              } else {
                c += 'large';
              }

              var className = "marker-cluster " + c + " awesome-marker-legend-TransparentIcon-" + georesourceMetadataAndGeoJSON.poiMarkerColor;

              //'marker-cluster' + c + ' ' +
              return new L.DivIcon({ html: '<div class="awesome-marker-legend-icon-' + georesourceMetadataAndGeoJSON.poiMarkerColor + '" ><span>' + childCount + '</span></div>', className: className, iconSize: new L.Point(40, 40) });
            }
          });
        }
        else {
          markers = L.layerGroup();
        }

        georesourceMetadataAndGeoJSON.geoJSON.features.forEach(function (poiFeature) {
          // index 0 should be longitude and index 1 should be latitude
          //.bindPopup( poiFeature.properties.name )
          var newMarker = kommonitorGenericMapHelperService.createCustomMarker(poiFeature, georesourceMetadataAndGeoJSON.poiSymbolColor, georesourceMetadataAndGeoJSON.poiMarkerColor, georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name, georesourceMetadataAndGeoJSON);

          markers = kommonitorGenericMapHelperService.addPoiMarker(markers, newMarker);
        });

        // markers.StyledLayerControl = {
        //   removable : false,
        //   visible : true
        // };

        mapParts.isochroneLayers.poiInIsoLayers.set(georesourceMetadataAndGeoJSON.georesourceId, markers);

        mapParts.layerControl.addOverlay(markers, georesourceMetadataAndGeoJSON.datasetName + "_" + date + "_inEinzugsgebiet");
        markers.addTo(mapParts.map);

        this.invalidateMap(domId);
        this.zoomToIsochroneLayer(domId);

        this.mapPartsMap.set(domId, mapParts);
      };

      this.removePoiGeoresource_reachabilityAnalysis = function (domId, georesourceMetadataAndGeoJSON) {

        let mapParts = this.mapPartsMap.get(domId);

        if (mapParts && mapParts.isochroneLayers && mapParts.isochroneLayers.poiInIsoLayers
          && mapParts.isochroneLayers.poiInIsoLayers.has(georesourceMetadataAndGeoJSON.georesourceId)) {
          let layer = mapParts.isochroneLayers.poiInIsoLayers.get(georesourceMetadataAndGeoJSON.georesourceId);
          kommonitorGenericMapHelperService.removeLayerFromMap(mapParts.map, layer);
          kommonitorGenericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, layer);
        }

        this.invalidateMap(domId);
        this.zoomToIsochroneLayer(domId);

        this.mapPartsMap.set(domId, mapParts);
      };

    }]);
