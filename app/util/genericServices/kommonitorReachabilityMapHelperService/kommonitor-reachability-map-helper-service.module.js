angular.module('kommonitorReachabilityMapHelper', ['kommonitorDataExchange', 'kommonitorGenericMapHelper', 'kommonitorVisualStyleHelper']);

angular
  .module('kommonitorReachabilityMapHelper')
  .service(
    'kommonitorReachabilityMapHelperService', ['$rootScope', '__env', '$timeout', '$http',
    'kommonitorDataExchangeService', 'kommonitorGenericMapHelperService', 'kommonitorVisualStyleHelperService',
    function ($rootScope, __env, $timeout, $http,
      kommonitorDataExchangeService, kommonitorGenericMapHelperService, kommonitorVisualStyleHelperService) {

      var self = this;

      /* Map of mapParts for certain dom IDs
        {
          "map": mapObject,
          "layerControl": layerControl,
          "backgroundLayer": backgroundLayer,
          "geosearchControl": geosearchControl,
          "screenshoter": screenshoter,
          "isochroneLayers": {
            "markerLayer": markerLayer,
            "isochroneLayer": isochroneLayer
          },
          "poiInIsoLayers": poiInIsoLayersMap, // map object
          "indicatorStatistics": {
            "poiLayer": poiLayer, // layer with enhanced indicatorStatisticInformation
            "poiIsochroneLayer": poiIsochroneLayer, // individual isochrone of active clicked poi
            
            "indicatorLayer": indicatorLayer  // the indicator of interest on the spatial unit of interest
          }
        }
        */
      this.mapPartsMap = new Map();

      this.getMapParts_byDomId = function(domId){
        return this.mapPartsMap.get(domId);
      }

      this.initReachabilityGeoMap = function (domId) {
        // init leaflet map
        let mapParts = this.mapPartsMap.get(domId);

        if (mapParts && mapParts.map)
          kommonitorGenericMapHelperService.clearMap(mapParts.map);

        //function (domId, withLayerControl, withGeosearchControl, withDrawControl, drawResourceType, editMode)
        mapParts = kommonitorGenericMapHelperService.initMap(domId, true, true, false, true, undefined, undefined);
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

      this.takeScreenshot_image = async function (domId, overridedPluginOptions) {
        let mapParts = this.mapPartsMap.get(domId);

        let format = "image";
        
        if (!overridedPluginOptions) {
          overridedPluginOptions = {

          }
        }
        if (mapParts && mapParts.map && mapParts.screenshoter) {

          var node = document.getElementById(domId);

          return await domtoimage
              .toJpeg(node, { quality: 0.95 })
              .then(function (dataUrl) {
                return dataUrl;
              })
              .catch(function (error) {
                  console.error('oops, something went wrong!', error);
              });
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

      this.zoomToIndicatorFeature = function(domId, feature){
        let mapParts = this.mapPartsMap.get(domId);
        if (mapParts && mapParts.map && mapParts.indicatorStatistics && mapParts.indicatorStatistics.indicatorLayer) {
          for (const layerKey in mapParts.indicatorStatistics.indicatorLayer._layers) {
            if (Object.hasOwnProperty.call(mapParts.indicatorStatistics.indicatorLayer._layers, layerKey)) {
              const layer = mapParts.indicatorStatistics.indicatorLayer._layers[layerKey];
              
              if(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME] == feature.properties[__env.FEATURE_ID_PROPERTY_NAME]){
                mapParts.map.fitBounds(layer.getBounds());
                mapParts.map.invalidateSize(true);
              }
            }
          }          
        }
      }

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

            if (kommonitorDataExchangeService.isochroneLegend.reachMode_apiValue == "time") {
              //transform seconds to minutes
              isochroneValue = isochroneValue / 60;
            }
            var popupContent = "" + isochroneValue + " " + kommonitorDataExchangeService.isochroneLegend.cutOffUnit;
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

      this.replaceIsochroneGeoJSON = function (domId, datasetName, geoJSON, transitMode, reachMode, cutOffValues, useMultipleStartPoints, dissolveIsochrones) {

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
          datasetName: datasetName,
          transitMode: transitModeValue,
          reachMode: reachModeValue,
          reachMode_apiValue: reachMode,
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

      this.generatePoiMarkers = function (georesourceMetadataAndGeoJSON, useCluster, geojsonPropName) {
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

        georesourceMetadataAndGeoJSON[geojsonPropName].features.forEach(function (poiFeature) {
          // index 0 should be longitude and index 1 should be latitude
          //.bindPopup( poiFeature.properties.name )
          var newMarker = kommonitorGenericMapHelperService.createCustomMarker(poiFeature, georesourceMetadataAndGeoJSON.poiSymbolColor, georesourceMetadataAndGeoJSON.poiMarkerColor, georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name, georesourceMetadataAndGeoJSON);

          markers = kommonitorGenericMapHelperService.addPoiMarker(markers, newMarker);
        });

        // markers.StyledLayerControl = {
        //   removable : false,
        //   visible : true
        // };

        return markers;

      };

      this.addPoiGeoresourceGeoJSON_reachabilityAnalysis = function (domId, georesourceMetadataAndGeoJSON, date, useCluster) {

        let mapParts = this.mapPartsMap.get(domId);

        if (mapParts && mapParts.isochroneLayers && mapParts.isochroneLayers.poiInIsoLayers
          && mapParts.isochroneLayers.poiInIsoLayers.has(georesourceMetadataAndGeoJSON.georesourceId)) {
          let layer = mapParts.isochroneLayers.poiInIsoLayers.get(georesourceMetadataAndGeoJSON.georesourceId);
          kommonitorGenericMapHelperService.removeLayerFromMap(mapParts.map, layer);
          kommonitorGenericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, layer);
        }

        let markers = this.generatePoiMarkers(georesourceMetadataAndGeoJSON, useCluster, "geoJSON_poiInIsochrones");

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

      /*
        ISOCHRONE STATISTICS SECTION
      */

      this.initReachabilityIndicatorStatisticsGeoMap = function (domId) {
        // init leaflet map
        let mapParts = this.mapPartsMap.get(domId);

        // remember this domId in order to use it in an on click event for a leaflet point
        if(domId != "leaflet_map_poi_individual_indicator_coverage"){
          this.domId_indicatorStatistics = domId;
        }        

        if (mapParts && mapParts.map)
          kommonitorGenericMapHelperService.clearMap(mapParts.map);

        //function (domId, withLayerControl, withGeosearchControl, withDrawControl, drawResourceType, editMode)
        mapParts = kommonitorGenericMapHelperService.initMap(domId, true, true, false, true, undefined, undefined);
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
        mapParts.indicatorStatistics = {
          "poiLayer": undefined,
          "poiIsochroneLayer": undefined,
          "indicatorLayer": undefined
        }

        // empty map of poiInIsoLayers
        mapParts.isochroneLayers.poiInIsoLayers = new Map();

        this.mapPartsMap.set(domId, mapParts);
        return mapParts;
      };
      this.removeOldLayers_reachabilityIndicatorStatistics = function (domId) {
        let mapParts = this.mapPartsMap.get(domId);
        /*
          "indicatorStatistics": {
            "poiLayer": poiLayer, // layer with enhanced indicatorStatisticInformation
            "poiIsochroneLayer": poiIsochroneLayer, // individual isochrone of active clicked poi
            
            "indicatorLayer": indicatorLayer  // the indicator of interest on the spatial unit of interest
          }
        */
        if (mapParts && mapParts.indicatorStatistics && mapParts.indicatorStatistics.poiLayer) {
          let poiLayer = mapParts.indicatorStatistics.poiLayer;
          kommonitorGenericMapHelperService.removeLayerFromMap(mapParts.map, poiLayer);
          kommonitorGenericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, poiLayer);
        }

        if (mapParts && mapParts.indicatorStatistics && mapParts.indicatorStatistics.poiIsochroneLayer) {
          let poiIsochroneLayer = mapParts.indicatorStatistics.poiIsochroneLayer;
          kommonitorGenericMapHelperService.removeLayerFromMap(mapParts.map, poiIsochroneLayer);
          kommonitorGenericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, poiIsochroneLayer);
        }

        if (mapParts && mapParts.indicatorStatistics && mapParts.indicatorStatistics.indicatorLayer) {
          let indicatorLayer = mapParts.indicatorStatistics.indicatorLayer;
          kommonitorGenericMapHelperService.removeLayerFromMap(mapParts.map, indicatorLayer);
          kommonitorGenericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, indicatorLayer);
        }
      };

      this.fetchIndicatorForSpatialUnit = async function (indicatorId, spatialUnitId, timestamp) {

        let dateComps = timestamp.split("-");
        var year = dateComps[0];
        var month = dateComps[1];
        var day = dateComps[2];

        return await $http({
          url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + indicatorId + "/" + spatialUnitId + "/" + year + "/" + month + "/" + day + "?" + kommonitorDataExchangeService.simplifyGeometriesParameterName + "=" + kommonitorDataExchangeService.simplifyGeometries,
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          return response.data;

        }, function errorCallback(error) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });
      }

      /**
      * binds the popup of a clicked output
      * to layer.feature.properties.popupContent
      */
      this.onEachFeatureIndicator = function (feature, layer, indicatorProperty) {
        var indicatorValue = feature.properties[indicatorProperty];
        var indicatorValueText;
        if (kommonitorDataExchangeService.indicatorValueIsNoData(indicatorValue)) {
          indicatorValueText = "NoData";
        }
        else {
          indicatorValueText = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(indicatorValue);
        }
        var tooltipHtml = "<b>" + feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] + "</b><br/>" + indicatorValueText + " [" + kommonitorDataExchangeService.selectedIndicator.unit + "]";
        layer.bindTooltip(tooltipHtml, {
          sticky: false // If true, the tooltip will follow the mouse instead of being fixed at the feature center.
        });

      };

      this.generateIndicatorLayer = async function (indicatorMetadataAndGeoJSON, indicatorPropertyName, defaultBrew) {

        let outlierDetection_currentGLobalValue = kommonitorDataExchangeService.useOutlierDetectionOnIndicator;
        kommonitorDataExchangeService.useOutlierDetectionOnIndicator = false;
        let layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
          style: function (feature) {
            return kommonitorVisualStyleHelperService.styleDefault(feature, defaultBrew, undefined, undefined, indicatorPropertyName, true, false);
          },
          onEachFeature: function (feature, layer) {
            return self.onEachFeatureIndicator(feature, layer, indicatorPropertyName);
          }
        });

        kommonitorDataExchangeService.useOutlierDetectionOnIndicator = outlierDetection_currentGLobalValue;

        return layer;
      }

      this.setupIndicator = async function (indicatorStatisticsCandidate) {
        /*  
          {
            indicator: {
              indicatorId: $scope.selectedIndicatorForStatistics.indicatorId,
              indicatorName: $scope.selectedIndicatorForStatistics.indicatorName,
              unit: $scope.selectedIndicatorForStatistics.unit
            },
            spatialUnit: {
              spatialUnitId: $scope.selectedSpatialUnit.spatialUnitId,
              spatialUnitName: $scope.selectedSpatialUnit.spatialUnitName
            },
            weightStrategy: $scope.weightStrategy,
            timestamp: $scope.selectedIndicatorDate,
            progress: "queued",
            jobId: jobId,
            coverageResult: undefined
          }
        */
        let indicatorId = indicatorStatisticsCandidate.indicator.indicatorId;
        let spatialUnitId = indicatorStatisticsCandidate.spatialUnit.spatialUnitId;
        let timestamp = indicatorStatisticsCandidate.timestamp;
        let indicatorMetadataAndGeoJSON = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);
        indicatorMetadataAndGeoJSON.geoJSON = await this.fetchIndicatorForSpatialUnit(indicatorId, spatialUnitId, timestamp);
        indicatorStatisticsCandidate.indicator.geoJSON = indicatorMetadataAndGeoJSON.geoJSON;

        return indicatorMetadataAndGeoJSON;
      }

      this.getMapsParts_byDomId = function(domId){
        return this.mapPartsMap.get(domId);
      }

      this.replaceReachabilityIndicatorStatisticsOnMap = async function (domId, poiDataset, original_nonDissolved_isochrones, indicatorStatisticsCandidate) {
        let mapParts = this.mapPartsMap.get(domId);

        this.removeOldLayers_reachabilityIndicatorStatistics(domId);

        let indicatorMetadataAndGeoJSON = await this.setupIndicator(indicatorStatisticsCandidate);
        let timestamp = indicatorStatisticsCandidate.timestamp;
        let indicatorPropertyName = __env.indicatorDatePrefix + timestamp;
        let defaultBrew = kommonitorVisualStyleHelperService.setupDefaultBrew(indicatorMetadataAndGeoJSON.geoJSON, indicatorPropertyName, indicatorMetadataAndGeoJSON.defaultClassificationMapping.items.length, indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, kommonitorVisualStyleHelperService.classifyMethod);

        let indicatorLayer = await this.generateIndicatorLayer(indicatorMetadataAndGeoJSON, indicatorPropertyName, defaultBrew);
        let indicatorLegendControl = this.generateIndicatorLegend(defaultBrew, indicatorMetadataAndGeoJSON);
        indicatorLegendControl.addTo(mapParts.map);

        // generate poiLayer from POI geometries, original_undissolved isochrones per POI and isochrone prune Result per poi_and_undissolved_isochrone
        let poiLayer = this.generatePoiLayerForIndicatorStatistic(poiDataset, original_nonDissolved_isochrones, indicatorStatisticsCandidate);

        /*
          "indicatorStatistics": {
            "poiLayer": poiLayer, // layer with enhanced indicatorStatisticInformation
            "poiIsochroneLayer": poiIsochroneLayer, // individual isochrone of active clicked poi
            
            "indicatorLayer": indicatorLayer  // the indicator of interest on the spatial unit of interest
          }
        */
        mapParts.indicatorStatistics.poiLayer = poiLayer;
        mapParts.indicatorStatistics.indicatorLayer = indicatorLayer;

        mapParts.layerControl.addOverlay(poiLayer, poiDataset.datasetName);
        poiLayer.addTo(mapParts.map);

        mapParts.layerControl.addOverlay(indicatorLayer, indicatorStatisticsCandidate.indicator.indicatorName + " [" + indicatorStatisticsCandidate.indicator.unit + "]");
        indicatorLayer.addTo(mapParts.map);

        // redraw whole isochrone layer to display it on top of indicator layer        
        if (mapParts && mapParts.isochroneLayers && mapParts.isochroneLayers.isochroneLayer && mapParts.layerControl) {
          // mapParts.layerControl.removeLayer(mapParts.isochroneLayers.isochroneLayer);
          mapParts.map.removeLayer(mapParts.isochroneLayers.isochroneLayer);
          mapParts.isochroneLayers.isochroneLayer.addTo(mapParts.map);

        }

        this.invalidateMap(domId);
        // this.zoomToIsochroneLayer(domId);

        this.mapPartsMap.set(domId, mapParts);
      }

      this.generateIndicatorLegend = function (defaultBrew, indicatorMetadataAndGeoJSON) {
        var legend = L.control({ position: 'bottomright' });

        legend.onAdd = function (map) {

          let grades = [];
          for (const breakValue of defaultBrew.breaks) {
            grades.push(kommonitorDataExchangeService.getIndicatorValue_asFormattedText(breakValue));
          }

          var div = L.DomUtil.create('div', 'reachabilityIndicatorInfo reachabilityIndicatorLegend'),
            labels = [];

          // loop through our density intervals and generate a label with a colored square for each interval
          for (var i = 0; i < defaultBrew.colors.length; i++) {
            div.innerHTML +=
              '<i style="background:' + defaultBrew.colors[i] + '"></i> ' +
              grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
          }

          return div;
        };

        return legend;
      }

      this.getIndicatorFeature_forSpatialUnitFeatureId = function (indicatorGeoJSON, spatialUnitFeatureId) {
        for (const feature of indicatorGeoJSON.features) {
          if (feature.properties[__env.FEATURE_ID_PROPERTY_NAME] == spatialUnitFeatureId) {
            return feature;
          }
        }
      };

      this.generatePoiPopupContent = function (poiFeature, indicatorStatisticsCandidate) {

        /*
          ISOCHRONE PRUNE RESULT EXAMPLE
          {
            "poiFeatureId": "35_5",
            "overallCoverage": [
              {
                "date": "2023-01-01",
                "absoluteCoverage": 6.3172536,
                "relativeCoverage": 0.0020464053
              }
            ],
            "spatialUnitCoverage": [
              {
                "spatialUnitFeatureId": "7",
                "coverage": [
                  {
                    "date": "2023-01-01",
                    "absoluteCoverage": 6.3172536,
                    "relativeCoverage": 0.0186901
                  }
                ]
              }
            ]
          },
        */

        let html = "<div style='max-height: 30vh; overflow:auto;'><h3>" + poiFeature.properties[__env.FEATURE_NAME_PROPERTY_NAME] + "</h3>";

        poiFeature.properties.individualIsochronePruneResults.sort((a, b) => {
          let range_a = Number(a.poiFeatureId.split("_")[1]);
          let range_b = Number(b.poiFeatureId.split("_")[1]);
          return range_a - range_b;
        });

        for (const isochronePruneResult of poiFeature.properties.individualIsochronePruneResults) {
          let range = isochronePruneResult.poiFeatureId.split("_")[1];
          let unit = "Minuten";
          // if(kommonitorReachabilityHelperService.settings.focus == 'distance'){
          //   unit = "Meter";
          // } 
          html += "<h4>" + range + " [" + unit + "]</h4>";
          html += "<h4><i>Gesamtgebiet</i></h4>"

          html += "<i>" + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(isochronePruneResult.overallCoverage[0].absoluteCoverage) + " von " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(indicatorStatisticsCandidate.coverageResult.timeseries[0].value) + " [" + indicatorStatisticsCandidate.indicator.unit + "]</i>";
          html += "<br/>";
          html += "entspricht <i>" + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(isochronePruneResult.overallCoverage[0].relativeCoverage * 100) + " [%]</i><br/><br/>";

          /*
            "spatialUnitCoverage": [
              {
                "spatialUnitFeatureId": "7",
                "coverage": [
                  {
                    "date": "2023-01-01",
                    "absoluteCoverage": 6.3172536,
                    "relativeCoverage": 0.0186901
                  }
                ]
              }
            ]
          */
          for (const spatialUnitCoverageEntry of isochronePruneResult.spatialUnitCoverage) {

            let indicatorGeoJSON = indicatorStatisticsCandidate.indicator.geoJSON;
            let indicatorFeature = self.getIndicatorFeature_forSpatialUnitFeatureId(indicatorGeoJSON, spatialUnitCoverageEntry.spatialUnitFeatureId);

            html += "<h4><i>" + indicatorFeature.properties[__env.FEATURE_NAME_PROPERTY_NAME] + "</i></h4>";
            // we can directly query the first element of coverage array as we only query one indicator timestamp at a time
            html += "<i>" + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(spatialUnitCoverageEntry.coverage[0].absoluteCoverage) + " von "
              + indicatorFeature.properties[__env.indicatorDatePrefix + indicatorStatisticsCandidate.timestamp]
              + " [" + indicatorStatisticsCandidate.indicator.unit + "]</i>";
            html += "<br/>";
            html += "entspricht <i>" + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(spatialUnitCoverageEntry.coverage[0].relativeCoverage * 100) + " [%]</i><br/><br/>";
          }

          html += "<br/><hr><br/>"
        }

        html += "</div>";

        return html;
      };

      this.onClickPoiMarker_indicatorStatistics = function (event) {        

        self.removeSinglePoiIsochroneLayer(self.domId_indicatorStatistics);      

        let feature = event.target.feature;        

        let poiIsochroneLayer = self.generateSinglePoiIsochroneLayer(feature);        

        self.addSinglePoiIsochroneLayer(self.domId_indicatorStatistics, feature, poiIsochroneLayer, false)
      };

      this.removeSinglePoiIsochroneLayer = function(domId){
        let mapParts = self.mapPartsMap.get(domId);

        //remove any old layer
        if (mapParts && mapParts.indicatorStatistics && mapParts.indicatorStatistics.poiIsochroneLayer && mapParts.layerControl) {
          mapParts.layerControl.removeLayer(mapParts.indicatorStatistics.poiIsochroneLayer);
          mapParts.map.removeLayer(mapParts.indicatorStatistics.poiIsochroneLayer);
        }   
        self.mapPartsMap.set(domId, mapParts);
      };

      this.addSinglePoiIsochroneLayer = function(domId, feature, poiIsochroneLayer, zoomToLayer) {
        let mapParts = self.mapPartsMap.get(domId);

        mapParts.indicatorStatistics.poiIsochroneLayer = poiIsochroneLayer;

        mapParts.layerControl.addOverlay(mapParts.indicatorStatistics.poiIsochroneLayer, "Isochronen um Punkt '" + feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] + "'");
        mapParts.indicatorStatistics.poiIsochroneLayer.addTo(mapParts.map);

        if(zoomToLayer) {
          mapParts.map.fitBounds(mapParts.indicatorStatistics.poiIsochroneLayer.getBounds());
        }

        self.invalidateMap(domId);
        self.mapPartsMap.set(domId, mapParts);
      };

      this.generateSinglePoiIsochroneLayer = function(feature){
        poiIsochroneLayer = L.featureGroup();
        // array of GeoJSON features
        let isochrones = feature.properties.individualIsochrones;

        // sort features to ensure correct z-order of layers (begin with smallest isochrones)
        isochrones.sort((a, b) => a.properties.value - b.properties.value);

        for (var index = isochrones.length - 1; index >= 0; index--) {

          var styleIndex = getStyleIndexForFeature(isochrones[index], kommonitorDataExchangeService.isochroneLegend.colorValueEntries, kommonitorDataExchangeService.isochroneLegend.reachMode_apiValue);

          var style = {
            color: kommonitorDataExchangeService.isochroneLegend.colorValueEntries[styleIndex].color,
            weight: 1,
            opacity: 0.4,
            fillOpacity: 0.3
          };

          L.geoJSON(isochrones[index], {
            style: style,
            onEachFeature: self.onEachFeature_isochrones
          }).addTo(poiIsochroneLayer);
        }

        return poiIsochroneLayer;
      }

      this.generatePoiMarkers_indicatorStatistics = function (poiDataset, indicatorStatisticsCandidate) {
        let markers = this.generatePoiMarkers(poiDataset, false, "geoJSON_reachability");

        // now replace bindPopup method and add click interaction event

        markers.eachLayer(function (marker) {
          let feature = marker.feature;
          let popupContent = self.generatePoiPopupContent(feature, indicatorStatisticsCandidate);
          marker.bindPopup(popupContent);

          marker.on('click', self.onClickPoiMarker_indicatorStatistics)
        });

        return markers;
      }

      this.generatePoiLayerForIndicatorStatistic = function (poiDataset, original_nonDissolved_isochrones, indicatorStatisticsCandidate) {
        // for each point attach its personal isochrones (one for each range) as array in it's feature properties. 
        // so after click on a point we can inspect its properties and draw the respective isochrones on the map.

        // the information about queried geometries for reachability analysis is stored in reachabilityHelperService settings

        let poiMap = this.initPoiMap(poiDataset.geoJSON_reachability);
        poiMap = this.attachIndividualIsochronesToPOIs(poiMap, original_nonDissolved_isochrones);

        // also store its POI specific isochrone prune result as feature property to display it's information within a popup
        poiMap = this.attachIndividualIsochronePruneResultsToPOIs(poiMap, indicatorStatisticsCandidate.coverageResult);

        // make geoJSON again
        poiDataset.geoJSON_reachability.features = Array.from(poiMap.values());

        let markersLayer = this.generatePoiMarkers_indicatorStatistics(poiDataset, indicatorStatisticsCandidate);

        return markersLayer;
      };

      this.initPoiMap = function (poiGeoJSON) {
        let poiMap = new Map();

        for (const poiFeature of poiGeoJSON.features) {
          // ensure that each poi does not hold old information from another scenario
          delete poiFeature.properties.individualIsochrones;
          delete poiFeature.properties.individualIsochronePruneResults;
          poiMap.set(poiFeature.properties[__env.FEATURE_ID_PROPERTY_NAME], poiFeature);
        }

        return poiMap;
      };

      this.attachIndividualIsochronesToPOIs = function (poiMap, original_nonDissolved_isochrones) {

        for (const isochroneFeature of original_nonDissolved_isochrones.features) {
          // each feature ID consists of poiFeatureID and isochrone rangeValue separated by "_"
          // i.e. <id>_<range>
          let poiFeatureID = isochroneFeature.properties[__env.FEATURE_ID_PROPERTY_NAME].split("_")[0]

          let poiFeature = poiMap.get(poiFeatureID);

          if (poiFeature) {
            if (!poiFeature.properties.individualIsochrones) {
              poiFeature.properties.individualIsochrones = [];
            }
            poiFeature.properties.individualIsochrones.push(isochroneFeature);
            poiMap.set(poiFeatureID, poiFeature);
          }
        }

        return poiMap;
      }

      this.attachIndividualIsochronePruneResultsToPOIs = function (poiMap, isochronePruneResults) {

        // isochronePruneResults.result is per indicator --> but we only allow one indicator at the same time currently
        // hence we can directly go to first entry and ask its poiCoverage for each range
        for (const poiCoverage_foreach_range of isochronePruneResults.poiCoverage) {

          // each feature ID consists of poiFeatureID and isochrone rangeValue separated by "_"
          // i.e. <id>_<range>
          let poiFeatureID = poiCoverage_foreach_range["poiFeatureId"].split("_")[0]

          let poiFeature = poiMap.get(poiFeatureID);

          if (poiFeature) {
            if (!poiFeature.properties.individualIsochronePruneResults) {
              poiFeature.properties.individualIsochronePruneResults = [];
            }
            poiFeature.properties.individualIsochronePruneResults.push(poiCoverage_foreach_range);
            poiMap.set(poiFeatureID, poiFeature);
          }
        }

        return poiMap;
      }


    }]);
