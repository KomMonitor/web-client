angular.module('kommonitorMap').component(
  'kommonitorMap',
  {
    templateUrl: "components/kommonitorUserInterface/kommonitorMap/kommonitor-map.template.html",
    controller: [
      '$rootScope',
      '$http',
      '$scope',
      '$timeout',
      'kommonitorMapService',
      'kommonitorDataExchangeService',
      'kommonitorVisualStyleHelperService',
      'kommonitorInfoLegendHelperService',
      'kommonitorFilterHelperService', 
      'kommonitorToastHelperService',
      'kommonitorGenericMapHelperService',
      '__env',
      'kommonitorReachabilityMapHelperService',
      function MapController($rootScope, $http, $scope, $timeout, kommonitorMapService, kommonitorDataExchangeService, kommonitorVisualStyleHelperService, 
        kommonitorInfoLegendHelperService, kommonitorFilterHelperService, kommonitorToastHelperService, kommonitorGenericMapHelperService, __env,
        kommonitorReachabilityMapHelperService) {

          /*
           
          #################################################################################
          #TODO FIXME could be refactored to make intensive use of genericMapHelperService#
          #################################################################################
           */
        this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

        const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
        const numberOfDecimals = __env.numberOfDecimals;
        var defaultColorForFilteredValues = __env.defaultColorForFilteredValues;
        var defaultBorderColorForFilteredValues = __env.defaultBorderColorForFilteredValues;
        var defaultBorderColor = __env.defaultBorderColor;
        var defaultFillOpacity = __env.defaultFillOpacity;
        var defaultFillOpacityForFilteredFeatures = __env.defaultFillOpacityForFilteredFeatures;
        var defaultFillOpacityForHighlightedFeatures = __env.defaultFillOpacityForHighlightedFeatures;
        var defaultFillOpacityForZeroFeatures = __env.defaultFillOpacityForZeroFeatures;
        var defaultColorBrewerPaletteForBalanceIncreasingValues = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
        var defaultColorBrewerPaletteForBalanceDecreasingValues = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
        var defaultColorBrewerPaletteForGtMovValues = __env.defaultColorBrewerPaletteForGtMovValues;
        var defaultColorBrewerPaletteForLtMovValues = __env.defaultColorBrewerPaletteForLtMovValues;
        var defaultColorForHoveredFeatures = __env.defaultColorForHoveredFeatures;
        var defaultColorForClickedFeatures = __env.defaultColorForClickedFeatures;
        var defaultBorderColorForNoDataValues = __env.defaultBorderColorForNoDataValues;
        var defaultColorForNoDataValues = __env.defaultColorForNoDataValues;
        var defaultFillOpacityForNoDataValues = __env.defaultFillOpacityForNoDataValues;


        var defaultColorForOutliers_high = __env.defaultColorForOutliers_high;
        var defaultBorderColorForOutliers_high = __env.defaultBorderColorForOutliers_high;
        var defaultFillOpacityForOutliers_high = __env.defaultFillOpacityForOutliers_high;
        var defaultColorForOutliers_low = __env.defaultColorForOutliers_low;
        var defaultBorderColorForOutliers_low = __env.defaultBorderColorForOutliers_low;
        var defaultFillOpacityForOutliers_low = __env.defaultFillOpacityForOutliers_low;
        var useOutlierDetectionOnIndicator = __env.useOutlierDetectionOnIndicator;

        const outlierPropertyName = "outlier";
        const outlierPropertyValue_high_soft = "high-soft";
        const outlierPropertyValue_low_soft = "low-soft";
        const outlierPropertyValue_high_extreme = "high-extreme";
        const outlierPropertyValue_low_extreme = "low-extreme";
        const outlierPropertyValue_no = "no";

        $scope.containsOutliers_high = false;
        $scope.containsOutliers_low = false;
        $scope.outliers_high = undefined;
        $scope.outliers_low = undefined;
        kommonitorDataExchangeService.useOutlierDetectionOnIndicator = useOutlierDetectionOnIndicator;

        $scope.svgString_outlierLow = '<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_low + ';" />Sorry, your browser does not support inline SVG.</svg>';
        $scope.svgString_outlierHigh = '<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_high + ';" />Sorry, your browser does not support inline SVG.</svg>';

        $scope.showOutlierInfoAlert = false;



        $scope.drawnPointFeatures = undefined;
        $scope.drawPointControl = undefined;

        $scope.featuresWithValues = [];
        $scope.featuresWithoutValues = [];


        const MultipleResultsLeafletSearch = L.Control.Search.extend({

          _makeUniqueKey: function (featureName, featureId) {
            return featureName + " (Name) - " + featureId + " (ID)";
          },

          _searchInLayer: function (layer, retRecords, propName) {
            var self = this, loc;
            var key_withUniqueID;

            if (layer instanceof L.Control.Search.Marker) return;

            if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
              if (self._getPath(layer.options, propName)) {
                loc = layer.getLatLng();
                loc.layer = layer;
                retRecords[self._getPath(layer.options, propName)] = loc;
              }
              else if (self._getPath(layer.feature.properties, propName)) {
                loc = layer.getLatLng();
                loc.layer = layer;
                key_withUniqueID = this._makeUniqueKey(self._getPath(layer.feature.properties, propName), layer.feature.properties.ID);
                retRecords[key_withUniqueID] = loc;
              }
              else {
                //throw new Error("propertyName '"+propName+"' not found in marker");
                console.warn("propertyName '" + propName + "' not found in marker");
              }
            }
            else if (layer instanceof L.Path || layer instanceof L.Polyline || layer instanceof L.Polygon) {
              if (self._getPath(layer.options, propName)) {
                loc = layer.getBounds().getCenter();
                loc.layer = layer;
                retRecords[self._getPath(layer.options, propName)] = loc;
              }
              else if (self._getPath(layer.feature.properties, propName)) {
                loc = layer.getBounds().getCenter();
                loc.layer = layer;
                key_withUniqueID = this._makeUniqueKey(self._getPath(layer.feature.properties, propName), layer.feature.properties.ID);
                retRecords[key_withUniqueID] = loc;
              }
              else {
                //throw new Error("propertyName '"+propName+"' not found in shape");
                console.warn("propertyName '" + propName + "' not found in shape");
              }
            }
            else if (layer.hasOwnProperty('feature'))//GeoJSON
            {
              if (layer.feature.properties.hasOwnProperty(propName)) {

                key_withUniqueID = this._makeUniqueKey(self._getPath(layer.feature.properties, propName), layer.feature.properties.ID);
                if (layer.getLatLng && typeof layer.getLatLng === 'function') {
                  loc = layer.getLatLng();
                  loc.layer = layer;
                  retRecords[key_withUniqueID] = loc;
                } else if (layer.getBounds && typeof layer.getBounds === 'function') {
                  loc = layer.getBounds().getCenter();
                  loc.layer = layer;
                  retRecords[key_withUniqueID] = loc;
                } else {
                  console.warn("Unknown type of Layer");
                }
              }
              else {
                //throw new Error("propertyName '"+propName+"' not found in feature");
                console.warn("propertyName '" + propName + "' not found in feature");
              }
            }
            else if (layer instanceof L.LayerGroup) {
              layer.eachLayer(function (layer) {
                self._searchInLayer(layer, retRecords, propName);
              });
            }
          },
          _defaultMoveToLocation: function (latlng, title, map) {
            if (this.options.zoom)
              this._map.setView(latlng, this.options.zoom);
            else
              this._map.panTo(latlng);

            // add collapse after click on item
            this.collapse();
          },
          _handleAutoresize: function () {
            var maxWidth;

            if (!this._map) {
              this._map = $scope.map;
            }

            if (this._input.style.maxWidth !== this._map._container.offsetWidth) {
              maxWidth = this._map._container.clientWidth;

              // other side margin + padding + width border + width search-button + width search-cancel
              maxWidth -= 10 + 20 + 1 + 30 + 22;

              this._input.style.maxWidth = maxWidth.toString() + 'px';
            }

            if (this.options.autoResize && (this._container.offsetWidth + 20 < this._map._container.offsetWidth)) {
              this._input.size = this._input.value.length < this._inputMinSize ? this._inputMinSize : this._input.value.length;
            }
          }
        });

        $scope.onCloseOutlierAlert = function () {
          // $("#outlierInfo").hide();
          $scope.showOutlierInfoAlert = false;
        };


        var refreshNoDataStyle = function () {

          $scope.currentIndicatorContainsNoDataValues = false;
          $scope.svgString_noData = '<svg height="18" width="18">' +
            '<circle style="stroke-opacity: ' + defaultFillOpacityForNoDataValues + ';" cx="4" cy="4" r="1.5" stroke="' + defaultBorderColorForNoDataValues + '" stroke-width="2" fill="' + defaultColorForNoDataValues + '" />' +
            '<circle style="stroke-opacity: ' + defaultFillOpacityForNoDataValues + ';" cx="14" cy="4" r="1.5" stroke="' + defaultBorderColorForNoDataValues + '" stroke-width="2" fill="' + defaultColorForNoDataValues + '" />' +
            '<circle style="stroke-opacity: ' + defaultFillOpacityForNoDataValues + ';" cx="4" cy="14" r="1.5" stroke="' + defaultBorderColorForNoDataValues + '" stroke-width="2" fill="' + defaultColorForNoDataValues + '" />' +
            '<circle style="stroke-opacity: ' + defaultFillOpacityForNoDataValues + ';" cx="14" cy="14" r="1.5" stroke="' + defaultBorderColorForNoDataValues + '" stroke-width="2" fill="' + defaultColorForNoDataValues + '" />' +
            'Sorry, your browser does not support inline SVG.</svg>';

          $scope.noDataStyle = kommonitorVisualStyleHelperService.noDataStyle;
        };

        var refreshOutliersStyle = function () {

          $scope.containsOutliers_high = false;
          $scope.containsOutliers_low = false;
          $scope.outlierMinValue = undefined;
          $scope.outlierMaxValue = undefined;
          $scope.showOutlierInfoAlert = false;

          $scope.svgString_outlierLow = '<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_low + ';" />Sorry, your browser does not support inline SVG.</svg>';
          $scope.svgString_outlierHigh = '<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + defaultFillOpacityForOutliers_high + ';" />Sorry, your browser does not support inline SVG.</svg>';

          // if ($scope.useTransparencyOnIndicator) {
          //   fillOpacity_high = defaultFillOpacityForOutliers_high;
          //   fillOpacity_low = defaultFillOpacityForOutliers_low;
          // }

          $scope.outlierStyle_high = kommonitorVisualStyleHelperService.outlierStyle_high;

          $scope.outlierStyle_low = kommonitorVisualStyleHelperService.outlierStyle_low;
        };

        $scope.useTransparencyOnIndicator = __env.useTransparencyOnIndicator;

        $scope.filteredStyle = kommonitorVisualStyleHelperService.filteredStyle;

        var refreshFilteredStyle = function () {

          $scope.filteredStyle = kommonitorVisualStyleHelperService.filteredStyle;
        };

        this.kommonitorMapServiceInstance = kommonitorMapService;
        this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
        $scope.inputLayerCounter = 0;

        $scope.latCenter = __env.initialLatitude;
        $scope.lonCenter = __env.initialLongitude;
        $scope.zoomLevel = __env.initialZoomLevel;

        $scope.loadingData = true;

        $scope.drawnItems = new L.FeatureGroup();
        $scope.drawControl = undefined;

        $scope.allDrawingToolsEnabled = false;
        $scope.date = undefined;

        // central map object
        $scope.map = undefined;
        $scope.scaleBar = undefined;
        $scope.layerControl = undefined;
        $scope.showInfoControl = true;
        $scope.showLegendControl = true;
        $scope.showLegend = true;
        $scope.overlays = new Array();
        $scope.baseMaps = new Array();
        const spatialUnitLayerGroupName = "Raumebenen";
        const georesourceLayerGroupName = "Georessourcen";
        const poiLayerGroupName = "Points of Interest";
        const loiLayerGroupName = "Lines of Interest";
        const aoiLayerGroupName = "Areas of Interest";
        const indicatorLayerGroupName = "Indikatoren";
        const reachabilityLayerGroupName = "Erreichbarkeiten";
        const wmsLayerGroupName = "Web Map Services (WMS)";
        const wfsLayerGroupName = "Web Feature Services (WFS)";
        const fileLayerGroupName = "Dateilayer";
        const spatialUnitOutlineLayerGroupName = "Raumebenen Umringe";

        let sortableLayers = ["Web Map Services (WMS)"];
        if (__env.sortableLayers) {
          sortableLayers = __env.sortableLayers;
        } 
        else {
          sortableLayers = ["Web Map Services (WMS)"];
        }        

        // create classyBrew object
        $scope.defaultBrew = undefined;
        $scope.gtMeasureOfValueBrew = undefined;
        $scope.ltMeasureOfValueBrew = undefined;
        $scope.manualBrew = undefined;
        $scope.dynamicDecreaseBrew = undefined;
        $scope.dynamicIncreaseBrew = undefined;

        $scope.currentIndicatorMetadataAndGeoJSON;
        $scope.currentGeoJSONOfCurrentLayer;
        $scope.currentIndicatorContainsZeroValues = false;
        $scope.currentIndicatorContainsNoDataValues = false;
        $scope.indicatorTypeOfCurrentLayer;
        $scope.defaultColorForZeroValues = __env.defaultColorForZeroValues;

        $scope.customIndicatorPropertyName;
        $scope.customIndicatorName;
        $scope.customIndicatorUnit;

        $scope.currentCustomIndicatorLayerOfCurrentLayer;
        $scope.customPropertyName;

        $scope.currentCustomIndicatorLayer;
        $scope.isochronesLayer = undefined;
        $scope.isochroneMarkerLayer = undefined;

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

        L.tileLayer.grayscale = function (url, options) {
          return new L.TileLayer.Grayscale(url, options);
        };        

        let initSpatialUnitOutlineLayer = function(){
          for (const spatialUnit of kommonitorDataExchangeService.availableSpatialUnits) {
            if(spatialUnit.isOutlineLayer){

              let url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
									"/spatial-units/" + spatialUnit.spatialUnitId + "/allFeatures";

								$http({
									url: url,
									method: "GET"
								}).then(function successCallback(response) { //TODO add error callback for the case that the combination of indicator and nextUpperHierarchyLevel doesn't exist
									let geoJSON = response.data;

									let layer = L.geoJSON(geoJSON, {
                    style: function (feature) {
                      return {
                        color: spatialUnit.outlineColor,
                        weight: spatialUnit.outlineWidth,
                        opacity: 1,
                        fillOpacity: 0,
                        fill: false,
                        dashArray: spatialUnit.outlineDashArrayString
                      };
                    },
                    onEachFeature: onEachFeatureSpatialUnit
                  });
        
                  // layer.StyledLayerControl = {
                  // 	removable : true,
                  // 	visible : true
                  // };
        
                  $scope.layerControl.addOverlay(layer, spatialUnit.spatialUnitLevel + "_Umringe", spatialUnitOutlineLayerGroupName);
                  $scope.updateSearchControl();
								});
            }
          }
        };

        $scope.$on("onGlobalFilterChange",function() {
          // reset custom layers when global filters change. otherwise douplicates might be added
          $scope.layerControl._layers = $scope.layerControl._layers.filter(e => e.overlay===undefined);
        });

        $rootScope.$on("initialMetadataLoadingCompleted", function(){
          initSpatialUnitOutlineLayer();
        });

        this.initializeMap = function () {

          $scope.loadingData = true;

          // initialize map referring to div element with id="map"

          var baseLayerDefinitionsMap = new Map();

          for (const baseMapEntry of __env.baseLayers) {              
            
            if (baseMapEntry.layerType === "TILE_LAYER_GRAYSCALE"){
              var grayscaleLayer = new L.tileLayer.grayscale(baseMapEntry.url, { minZoom: baseMapEntry.minZoomLevel, maxZoom: baseMapEntry.maxZoomLevel, attribution: baseMapEntry.attribution_html });
              baseLayerDefinitionsMap.set(baseMapEntry.name, grayscaleLayer);
            }
            else if (baseMapEntry.layerType === "TILE_LAYER"){
              var tileLayer = new L.tileLayer(baseMapEntry.url, { minZoom: baseMapEntry.minZoomLevel, maxZoom: baseMapEntry.maxZoomLevel, attribution: baseMapEntry.attribution_html });
              baseLayerDefinitionsMap.set(baseMapEntry.name, tileLayer);
            }
            else if (baseMapEntry.layerType === "WMS"){
              var wmsLayer = new L.tileLayer.wms(baseMapEntry.url, { minZoom: baseMapEntry.minZoomLevel, maxZoom: baseMapEntry.maxZoomLevel, attribution: baseMapEntry.attribution_html, layers: baseMapEntry.layerName_WMS, format: 'image/png' });
              baseLayerDefinitionsMap.set(baseMapEntry.name, wmsLayer);
            }
          }

          $scope.map = L.map('map', {
            center: [$scope.latCenter, $scope.lonCenter],
            zoom: $scope.zoomLevel,
            zoomDelta: 0.5,
            zoomSnap: 0.5,
            layers: [baseLayerDefinitionsMap.get(__env.baseLayers[0].name)]
          });

          __env.currentLatitude = $scope.latCenter;
          __env.currentLongitude = $scope.lonCenter;
          __env.currentZoomLevel = $scope.zoomLevel;

          // execute update search control on layer add and remove
          $scope.map.on('overlayadd', function (eo) {
            $scope.updateSearchControl();
          });
          $scope.map.on('overlayremove', function (eo) {
            $scope.updateSearchControl();
          });

          // update zoom and extent
          $scope.map.on('zoomend', function (eo) {
            let latLng = $scope.map.getCenter();
            __env.currentLatitude = latLng.lat;
            __env.currentLongitude = latLng.lng;
            __env.currentZoomLevel = $scope.map.getZoom();
          });
          $scope.map.on('moveend', function (eo) {
            let latLng = $scope.map.getCenter();
            __env.currentLatitude = latLng.lat;
            __env.currentLongitude = latLng.lng;
            __env.currentZoomLevel = $scope.map.getZoom();
          });

          $scope.baseMaps = {
          };   

          baseLayerDefinitionsMap.forEach(function(value, key, map){
            $scope.baseMaps[key] = value;
          });          

          $scope.groupedOverlays = {
            indicatorLayerGroupName: {

            },
            poiLayerGroupName: {

            },
            loiLayerGroupName: {

            },
            aoiLayerGroupName: {

            },
            wmsLayerGroupName: {

            },
            wfsLayerGroupName: {

            },
            fileLayerGroupName: {

            },
            reachabilityLayerGroupName: {

            },
            spatialUnitOutlineLayerGroupName: {

            }
          };

          $scope.layerControl = L.control.groupedLayers($scope.baseMaps, $scope.groupedOverlays, {collapsed: false, position: 'topleft', sortableLayers });
          $scope.map.addControl($scope.layerControl);

          // Hide Leaflet layer control button in favor of a custom button for opening the layer control group
          $('.leaflet-control-layers').hide();
          $scope.$on("openLayerControl", function (event) {
            $('.leaflet-control-layers').toggle();
          });

          // Disable dragging when user's cursor enters the element
          $scope.layerControl.getContainer().addEventListener('mouseover', function () {
            $scope.map.dragging.disable();
            $scope.map.touchZoom.disable();
            $scope.map.doubleClickZoom.disable();
            $scope.map.scrollWheelZoom.disable();
          });

          // Re-enable dragging when user's cursor leaves the element
          $scope.layerControl.getContainer().addEventListener('mouseout', function () {
            $scope.map.dragging.enable();
            $scope.map.touchZoom.enable();
            $scope.map.doubleClickZoom.enable();
            $scope.map.scrollWheelZoom.enable();
          });

          $scope.scaleBar = L.control.scale();
          $scope.scaleBar.addTo($scope.map);



          // hatch patterns
          // var diagonalPattern = new L.PatternPath({ d: "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" , fill: true });

          // $scope.outlierFillPattern_high = new L.Pattern();
          // $scope.outlierFillPattern_high.addShape(diagonalPattern);
          // $scope.outlierFillPattern_high.addTo($scope.map);

          $scope.outlierFillPattern_low = kommonitorVisualStyleHelperService.outlierFillPattern_low;
          $scope.outlierFillPattern_low.addTo($scope.map);

          $scope.outlierFillPattern_high = kommonitorVisualStyleHelperService.outlierFillPattern_high;
          $scope.outlierFillPattern_high.addTo($scope.map);

          $scope.noDataFillPattern = kommonitorVisualStyleHelperService.noDataFillPattern;
          $scope.noDataFillPattern.addTo($scope.map);

          // $scope.loadingData = false;

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

          $scope.geosearchControl = new GeoSearchControl({
            position: "topleft",
            provider: provider,
            style: 'button',
            autoComplete: true,
            autoCompleteDelay: 250,
            showMarker: true,                                   // optional: true|false  - default true
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

          $scope.map.addControl($scope.geosearchControl);


          /////////////////////////////////////////////////////
          ///// LEAFLET SEARCH SETUP
          /////////////////////////////////////////////////////
          // will be updated once example indicator layer is loaded
          $scope.searchControl = new MultipleResultsLeafletSearch({
          });
          $scope.searchControl.addTo($scope.map);


          /////////////////////////////////////////////////////
          ///// LEAFLET MEASURE SETUP
          /////////////////////////////////////////////////////
          var measureOptions = {
            position: 'topleft',
            primaryLengthUnit: 'meters',
            secondaryLengthUnit: 'kilometers',
            primaryAreaUnit: 'sqmeters',
            activeColor: "#d15c54",
            completedColor: "#d15c54",
            decPoint: ',',
            thousandsSep: '.'
          };

          $scope.measureControl = new L.Control.Measure(measureOptions);
          $scope.measureControl.addTo($scope.map);

        }; // end initialize map


        function filterForScreenshot (node) {
          return (
            node.tagName !== 'BUTTON' && 
            node.tagName !== 'A' && ( 
              node.className instanceof SVGAnimatedString || 
              !node.className.includes('leaflet-control')
            )
          );
        }

        $scope.$on("exportMap", function (event) {

           var node = document.getElementById("map");

          return domtoimage
              .toBlob(node, {"quality": 1.0, filter: filterForScreenshot})
              .then(function (blob) {
                // FileSaver saveAs method
                saveAs(blob, 'KomMonitor-Screenshot.png');
              })
              .catch(function (error) {
                console.log("Error while exporting map view.");
                console.error(error);
    
                kommonitorDataExchangeService.displayMapApplicationError(error);
              });

        });

        function isKomMonitorSpecificProperty(propertyKey){
          let isKomMonitorSpecificProperty = false;

          if(propertyKey == "outlier"){
            isKomMonitorSpecificProperty = true;
          }
          else if(propertyKey == __env.VALID_START_DATE_PROPERTY_NAME){
            isKomMonitorSpecificProperty = true;
          }
          else if(propertyKey == __env.VALID_END_DATE_PROPERTY_NAME){
            isKomMonitorSpecificProperty = true;
          }
          else if(propertyKey == "bbox"){
            isKomMonitorSpecificProperty = true;
          }
          else if(propertyKey.includes(__env.indicatorDatePrefix)){
            isKomMonitorSpecificProperty = true;
          }

          return isKomMonitorSpecificProperty;
        }

        $scope.updateSearchControl = function () {

          setTimeout(function () {
            if ($scope.searchControl) {
              try {
                $scope.map.removeControl($scope.searchControl);
                $scope.searchControl = undefined;
              }
              catch (error) {
                kommonitorDataExchangeService.displayMapApplicationError(error);
              }
            }

            // build L.featureGroup of available POI layers
            var featureLayers = [];

            for (var layerEntry of $scope.layerControl._layers) {
              if (layerEntry) {
                if (layerEntry.overlay) {
                  if ($scope.map.hasLayer(layerEntry.layer)) {
                    if (layerEntry.group.name === poiLayerGroupName || layerEntry.group.name === loiLayerGroupName || layerEntry.group.name === aoiLayerGroupName || layerEntry.group.name === indicatorLayerGroupName || layerEntry.group.name === wfsLayerGroupName || layerEntry.group.name === fileLayerGroupName) {
                      featureLayers.push(layerEntry.layer);
                    }
                  }

                }
              }
            }

            var layerGroup;
            // if no relevant layers are currently displayed, then
            if (featureLayers.length === 0) {
              $scope.searchControl = new MultipleResultsLeafletSearch({
              });
              $scope.searchControl.addTo($scope.map);
            }
            else {
              layerGroup = L.featureGroup(featureLayers);

              $scope.searchControl = new MultipleResultsLeafletSearch({
                position: "topleft",
                layer: layerGroup,
                initial: false,
                propertyName: __env.FEATURE_NAME_PROPERTY_NAME,
                textPlaceholder: "Layer-Objekte nach Name und/oder ID filtern",
                textCancel: "Abbrechen",
                textErr: "Position nicht gefunden",
                hideMarkerOnCollapse: true,
                zoom: 15,
                autoResize: true,
                autoCollapse: false,
                autoType: true,
                formatData: function (json) {	//adds coordinates to name.
                  var propName = this.options.propertyName,
                    propLoc = this.options.propertyLoc,
                    i, jsonret = {};
                  if (L.Util.isArray(propLoc))
                    for (i in json) {
                      if (!this._getPath(json[i], propName)) continue;
                      jsonret[this._getPath(json[i], propName) + " (" + json[i][propLoc[0]] + "," + json[i][propLoc[1]] + ")"] = L.latLng(json[i][propLoc[0]], json[i][propLoc[1]]);
                    }
                  else
                    for (i in json) {
                      if (!this._getPath(json[i], propName)) continue;
                      jsonret[this._getPath(json[i], propName) + " (" + json[i][propLoc][0] + "," + json[i][propLoc][1] + ")"] = L.latLng(this._getPath(json[i], propLoc));
                    }
                  return jsonret;
                },
                filterData: function (text, records) {
                  var I, icase, regSearch, frecords = {};

                  text = text.replace(/[.*+?^${}()|[\]\\]/g, '');  //sanitize remove all special characters
                  if (text === '')
                    return [];

                  I = this.options.initial ? '^' : '';  //search only initial text
                  icase = !this.options.casesensitive ? 'i' : undefined;

                  regSearch = new RegExp(I + text, icase);

                  for (var key in records) {

                    // make a searchable string from all relevant feature properties
                    let recordString = "";
                    let record = records[key];
                    let recordProperties = record.layer.feature.properties;

                    for (const propertyKey in recordProperties) {
                      if(recordProperties[propertyKey] && !isKomMonitorSpecificProperty(propertyKey)){
                        recordString += recordProperties[propertyKey];
                      }
                    }

                    if (regSearch.test(recordString))
                      frecords[key] = records[key];
                  }

                  return frecords;
                },
                buildTip: function (text, val) {
                  var emString = "";

                  if (val.layer.metadataObject) {
                    if (val.layer.metadataObject.isPOI) {
                      emString += '<i style="width:14px;height:14px;float:left;" class="awesome-marker-legend awesome-marker-legend-icon-' + val.layer.metadataObject.poiMarkerColor + '">';
                      emString += "<span style='margin-left:3px; top:-2px; font-size:0.7em; color:" + val.layer.metadataObject.poiSymbolColor + ";' align='center' class='glyphicon glyphicon-" + val.layer.metadataObject.poiSymbolBootstrap3Name + "' aria-hidden='true'></span>";
                      emString += '</i>';
                    }
                  }
                  else {
                    emString += "<i style='font-size:1.0em;' class='fas fa-sitemap'></i>";
                  }
                  return '<a href="" class="search-tip">' + emString + '&nbsp;&nbsp;' + text + '</a>';
                }
              });

              $scope.searchControl.addTo($scope.map);
            }
          }, 200);
        };

        $scope.$on("showLoadingIconOnMap", function (event) {
          // console.log("Show loading icon on map");
          $scope.loadingData = true;
        });

        $scope.$on("hideLoadingIconOnMap", function (event) {
          // console.log("Hide loading icon on map");
          $timeout(function(){
            $scope.loadingData = false;
          }, 250);

        });

        $(document).on('click', '#selectSpatialUnitViaInfoControl li p', function () {
          var spatialUnitName = $(this).text();
          $('#selectSpatialUnitViaInfoControl_text').text(spatialUnitName);

          $rootScope.$broadcast("changeSpatialUnitViaInfoControl", spatialUnitName);
        });

        // $(document).on('change','#selectSimplifyGeometriesViaInfoControl',function(){
        //   var selector = document.getElementById('selectSimplifyGeometriesViaInfoControl');
        //   var simplifyGeometries = selector[selector.selectedIndex].value;
        //
        //   kommonitorDataExchangeService.simplifyGeometries = simplifyGeometries;
        //
        //   $rootScope.$broadcast("changeSpatialUnit");
        // });

        $scope.$on("changeSpatialUnitViaInfoControl", function (event, spatialUnitLevel) {

          $rootScope.$broadcast("changeSpatialUnit");

        });


        $scope.appendSpatialUnitOptions = function () {

          // <form action="select.html">
          //   <label>Künstler(in):
          //     <select name="top5" size="5">
          //       <option>Heino</option>
          //       <option>Michael Jackson</option>
          //       <option>Tom Waits</option>
          //       <option>Nina Hagen</option>
          //       <option>Marianne Rosenberg</option>
          //     </select>
          //   </label>
          // </form>

          // var innerHTMLString = "<form>";
          // innerHTMLString += "<label>Raumebene:  ";
          // innerHTMLString += "<select id='selectSpatialUnitViaInfoControl'>";
          //
          //
          // for (var option of kommonitorDataExchangeService.availableSpatialUnits){
          //
          //   if (kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits.some(o => o.spatialUnitName ===  option.spatialUnitLevel)){
          //     innerHTMLString += ' <option value="' + option.spatialUnitLevel + '" ';
          //     if (kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel === option.spatialUnitLevel){
          //       innerHTMLString +=' selected ';
          //     }
          //     innerHTMLString +='>' + option.spatialUnitLevel + '</option>';
          //   }
          // }
          // innerHTMLString += "</select>";
          // innerHTMLString += "</label>";
          // innerHTMLString += "</form>";
          // // innerHTMLString += "<br/>";

          // <div class="dropdown">
          //     <a aria-expanded="false" aria-haspopup="true" role="button" data-toggle="dropdown" class="dropdown-toggle" href="#">
          //       <span id="selected">Chose option</span><span class="caret"></span></a>
          //   <ul class="dropdown-menu">
          //     <li><a href="#">Option 1</a></li>
          //     <li><a href="#">Option 2</a></li>
          //     <li><a href="#">Option 3</a></li>
          //     <li><a href="#">Option 4</a></li>
          //   </ul>
          // </div>

          var innerHTMLString = '<div class="row" style="margin-right: 0px;">';
          innerHTMLString += "<div class='col-sm-3'><div class='text-left'><label>Raumebene:   </label></div></div>";
          innerHTMLString += "<div class='col-sm-9'><div class='text-left'><div id='selectSpatialUnitViaInfoControl' class='dropdown'>";
          innerHTMLString += '<button class="btn btn-primary btn-xs dropdown-toggle" type="button" data-toggle="dropdown"><span id="selectSpatialUnitViaInfoControl_text">' + kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel + '&nbsp;&nbsp;&nbsp;</span><span class="caret"></span></button>';
          innerHTMLString += '<ul id="spatialUnitInfoControlDropdown" class="dropdown-menu">';

          for (var option of kommonitorDataExchangeService.availableSpatialUnits) {

            if (kommonitorDataExchangeService.isAllowedSpatialUnitForCurrentIndicator(option)) {
              innerHTMLString += ' <li><p style="cursor: pointer; font-size:12px;">' + option.spatialUnitLevel;
              innerHTMLString += '</p></li>';
            }
          }
          innerHTMLString += "</ul>";
          innerHTMLString += "</div></div></div>";
          innerHTMLString += "</div>";

          return innerHTMLString;
        };

        // $scope.appendSimplifyGeometriesOptions = function(){
        //
        //   // <form action="select.html">
        //   //   <label>Künstler(in):
        //   //     <select name="top5" size="5">
        //   //       <option>Heino</option>
        //   //       <option>Michael Jackson</option>
        //   //       <option>Tom Waits</option>
        //   //       <option>Nina Hagen</option>
        //   //       <option>Marianne Rosenberg</option>
        //   //     </select>
        //   //   </label>
        //   // </form>
        //
        //   var innerHTMLString = "<form>";
        //   innerHTMLString += "<label title='Angabe, ob die Geometrien für die Kartendarstellung vereinfacht werden sollen. Jede der Optionen schwach, mittel, stark, reduziert dabei die Stützpunkte der Geometrien um ein Zunehmendes Maß. Dies reduziert die Geometrie-Komplexitität und erhöht die Performanz.'>Geometrie vereinfachen?  ";
        //   innerHTMLString += "<select id='selectSimplifyGeometriesViaInfoControl'>";
        //
        //
        //   for (var option of kommonitorDataExchangeService.simplifyGeometriesOptions){
        //       innerHTMLString += ' <option value="' + option.value + '" ';
        //       if (kommonitorDataExchangeService.simplifyGeometries === option.value){
        //         innerHTMLString +=' selected ';
        //       }
        //       innerHTMLString +='>' + option.label + '</option>';
        //   }
        //   innerHTMLString += "</select>";
        //   innerHTMLString += "</label>";
        //   innerHTMLString += "</form>";
        //   // innerHTMLString += "<br/>";
        //
        //   return innerHTMLString;
        // };

        var toggleInfoControl = function () {
          if ($scope.showInfoControl === true) {
            /* use jquery to select your DOM elements that has the class 'legend' */
            $('.info').hide();
            $scope.showInfoControl = false;

            $('#toggleInfoControlButton').show();
          } else {
            $('.info').show();
            $scope.showInfoControl = true;

            // button is defined in kommonitor-user-interface component
            $('#toggleInfoControlButton').hide();
          }
        };

        var toggleLegendControl = function () {
          if ($scope.showLegendControl === true) {
            /* use jquery to select your DOM elements that has the class 'legend' */
            $('.legendMap').hide();
            $scope.showLegendControl = false;

            $('#toggleLegendControlButton').show();
          } else {
            $('.legendMap').show();
            $scope.showLegendControl = true;

            // button is defined in kommonitor-user-interface component
            $('#toggleLegendControlButton').hide();
          }
        };

        $scope.$on("toggleInfoControl", function (event) {
          toggleInfoControl();
        });

        $scope.$on("toggleLegendControl", function (event) {
          toggleLegendControl();
        });

        $scope.appendInfoCloseButton = function () {
          return '<div id="info_close" class="btn btn-link" style="right: 0px; position: relative; float: right;" title="beenden"><span class="glyphicon glyphicon-remove"></span></div>';
        };

        $scope.appendLegendCloseButton = function () {
          return '<div id="legend_close" class="btn btn-link" style="right: 0px; position: relative; float: right;" title="beenden"><span class="glyphicon glyphicon-remove"></span></div>';
        };

        $scope.appendIndicatorInformation = function(isCustomComputation){
          var indicatorInfoHTML = '<div>';
            var titel = $scope.indicatorName;

            if (isCustomComputation) {
              titel += " - <i>individuelles Berechnungsergebnis</i>";
            }

            indicatorInfoHTML += '<h4>' + titel + '</h4><br/>';
            indicatorInfoHTML += '<b>Beschreibung: </b> ' + $scope.indicatorDescription + '<br/>';
            indicatorInfoHTML += '<b>Datenquelle: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.datasource + '<br/>';
            indicatorInfoHTML += $scope.appendSpatialUnitOptions();

            var transparencyDomString = "";
            transparencyDomString += '<br/><div class="row vertical-align" style="margin-right:0px;">';
            transparencyDomString += '<div class="col-sm-3">';
            transparencyDomString += '<div class="text-left">';
            transparencyDomString += '<label>Transparenz</label>';
            transparencyDomString += '</div>';
            transparencyDomString += '</div>';
            transparencyDomString += '<div class="col-sm-7">';
            transparencyDomString += '<div class="text-left">';
            transparencyDomString += '<input style="width:100%;" id="indicatorTransparencyInput" type="range" value="' + (1 - kommonitorVisualStyleHelperService.getOpacity()).toFixed(numberOfDecimals) + '" min="0" max="1" step="0.01">';
            transparencyDomString += '</div>';
            transparencyDomString += '</div>';
            transparencyDomString += '<div class="col-sm-2">';
            transparencyDomString += '<div class="text-left">';
            transparencyDomString += '<label id="indicatorTransparencyLabel">' + (1 - kommonitorVisualStyleHelperService.getOpacity()).toFixed(numberOfDecimals) + '</label>';
            transparencyDomString += '</div>';
            transparencyDomString += '</div>';
            transparencyDomString += '</div>';

            indicatorInfoHTML += transparencyDomString;

            var exportDomString = '<br/><div class="btn-group">';
            exportDomString += "<label><i class='fa fa-file-download'></i>&nbsp;&nbsp;&nbsp;Export</label>";
            exportDomString += '<br/><button id="downloadMetadata" class="btn btn-default btn-xs">Metadatenblatt</button>';
            exportDomString += '<button id="downloadGeoJSON" class="btn btn-primary btn-xs">GeoJSON</button>';
            exportDomString += '<button id="downloadShape" class="btn btn-primary btn-xs">ESRI Shape</button>';
            // temporarily disable WMS and WFS export
            exportDomString += '<a style="color:white;pointer-events: none;cursor: default;" class="btn btn-primary btn-xs disabled" href="' + kommonitorDataExchangeService.wmsUrlForSelectedIndicator + '" target="_blank" rel="noopener noreferrer" id="downloadWMS"><span title="WMS Link in Zukunft abrufbar">WMS</span></a>';
            exportDomString += '<a style="color:white;pointer-events: none;cursor: default;" class="btn btn-primary btn-xs disabled" href="' + kommonitorDataExchangeService.wfsUrlForSelectedIndicator + '" target="_blank" rel="noopener noreferrer" id="downloadWFS"><span title="WFS Link in Zukunft abrufbar">WFS</span></a>';
            exportDomString += "</div>";

            indicatorInfoHTML += exportDomString;

            indicatorInfoHTML += "<br/><br/><hr><br/>";

            // indicatorInfoHTML += $scope.appendSimplifyGeometriesOptions();
            return indicatorInfoHTML;
        };

        
        $(document).on('click', '#controlIndicatorTransparency', function (e) {
          var indicatorTransparencyCheckbox = document.getElementById('controlIndicatorTransparency');
          if (indicatorTransparencyCheckbox.checked) {
            $scope.useTransparencyOnIndicator = true;
          }
          else {
            $scope.useTransparencyOnIndicator = false;
          }
          $rootScope.$broadcast("restyleCurrentLayer", false);

          // ensure that highlighted features remain highlighted
          preserveHighlightedFeatures();
        });

        $(document).on('click', '#controlIndicatorOutlierDetection', function (e) {
          var indicatorOutlierCheckbox = document.getElementById('controlIndicatorOutlierDetection');
          if (indicatorOutlierCheckbox.checked) {
            kommonitorDataExchangeService.useOutlierDetectionOnIndicator = true;
          }
          else {
            kommonitorDataExchangeService.useOutlierDetectionOnIndicator = false;
          }
          $rootScope.$broadcast("restyleCurrentLayer", false);

          // ensure that highlighted features remain highlighted
          preserveHighlightedFeatures();
        });

        $(document).on('click', '#controlIndicatorZeroClassifyOption', function (e) {
          var zeroClassifyCheckbox = document.getElementById('controlIndicatorZeroClassifyOption');
          if (zeroClassifyCheckbox.checked) {
            kommonitorDataExchangeService.classifyZeroSeparately = true;
          }
          else {
            kommonitorDataExchangeService.classifyZeroSeparately = false;
          }
          $rootScope.$broadcast("restyleCurrentLayer", false);

          // ensure that highlighted features remain highlighted
          preserveHighlightedFeatures();
        });      

        $scope.$on("changeClassifyMethod", function (event, method) {
          kommonitorVisualStyleHelperService.classifyMethod = method;  
          
          $timeout(function(){
            kommonitorVisualStyleHelperService.classifyMethod = method;  
            $rootScope.$apply();
          }, 350);

          $rootScope.$broadcast("restyleCurrentLayer", false);
        });

        $scope.$on("changeNumClasses", function (event, num) {
          kommonitorVisualStyleHelperService.numClasses = num;  
          
          $timeout(function(){
            kommonitorVisualStyleHelperService.numClasses = num;  
            $rootScope.$apply();
          }, 350);

          $rootScope.$broadcast("restyleCurrentLayer", false);
        });

        $scope.$on("changeColorScheme", function (event, colorSchemeName) {
          $scope.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName = colorSchemeName; 

          $rootScope.$broadcast("restyleCurrentLayer", false);
        });

        $scope.$on("changeBreaks", function (event, breaks) {
          breaks = [...new Set(breaks)];
          breaks.sort(function(a, b) {
            return a - b;
          });

          kommonitorVisualStyleHelperService.manualBrew.breaks = breaks; 
          $scope.updateManualMOVBreaksFromDefaultManualBreaks();

          $timeout(function(){ 
            kommonitorVisualStyleHelperService.manualBrew.breaks = breaks;
            $scope.updateManualMOVBreaksFromDefaultManualBreaks();
            $rootScope.$apply();
            $rootScope.$broadcast("restyleCurrentLayer", false);
          }, 1);

        });

        $scope.$on("changeDynamicBreaks", function (event, breaks) {
          breaks[0] = [...new Set(breaks[0])];
          breaks[0].sort(function(a, b) {
            return a - b;
          });
          breaks[1] = [...new Set(breaks[1])];
          breaks[1].sort(function(a, b) {
            return a - b;
          });


          kommonitorVisualStyleHelperService.dynamicBrewBreaks = breaks;
          if (kommonitorVisualStyleHelperService.dynamicBrew[1]) {
            kommonitorVisualStyleHelperService.dynamicBrew[1].breaks = breaks[1];
          }
          if (kommonitorVisualStyleHelperService.dynamicBrew[0]) {
            kommonitorVisualStyleHelperService.dynamicBrew[0].breaks = breaks[0];
          }
          
          $timeout(function(){ 
            kommonitorVisualStyleHelperService.dynamicBrewBreaks = breaks;
            if (kommonitorVisualStyleHelperService.dynamicBrew[1]) {
              kommonitorVisualStyleHelperService.dynamicBrew[1].breaks = breaks[1];
            }
            if (kommonitorVisualStyleHelperService.dynamicBrew[0]) {
              kommonitorVisualStyleHelperService.dynamicBrew[0].breaks = breaks[0];
            }
            $rootScope.$apply();
          }, 1);
          $scope.updateManualMOVBreaksFromDefaultManualBreaks();

          $rootScope.$broadcast("restyleCurrentLayer", false);
        });

        $scope.$on("changeMOV", function (event, mov) {
          $scope.updateManualMOVBreaksFromDefaultManualBreaks();
        });

        $(document).on('click', '#controlNoDataDisplay', function (e) {
          var controlNoDataDisplayCheckbox = document.getElementById('controlNoDataDisplay');

          if (controlNoDataDisplayCheckbox.checked) {
            $scope.applyNoDataDisplay();
          } else {
            $scope.resetNoDataDisplay();
          }

          $rootScope.$broadcast("restyleCurrentLayer", false);

          // ensure that highlighted features remain highlighted
          preserveHighlightedFeatures();
        }); 


        $scope.$on("applyNoDataDisplay", function() {
          $scope.applyNoDataDisplay();
        });
        
        
        $scope.applyNoDataDisplay = function() {
          kommonitorDataExchangeService.useNoDataToggle = true;
          $scope.featuresWithValues = [];
          for (var i = 0; i < $scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features.length; i++) {
            if (!kommonitorDataExchangeService.indicatorValueIsNoData($scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName])) {
              $scope.featuresWithValues.push($scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i])
            } else {
              $scope.featuresWithoutValues.push($scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i])
            }
          }
          
          // get feature names array
          let featuresWithValuesNames = [];
          for (var i = 0; i < $scope.featuresWithValues.length; i++) {
            featuresWithValuesNames.push( $scope.featuresWithValues[i].properties["name"]);
          }

          // store checkbox state
          let completelyRemoveFilteredFeaturesFromDisplayChbState = kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay;
          kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay = true; // set checkbox true
          // perform spatial filter
          kommonitorFilterHelperService.applySpatialFilter_currentSpatialUnitFeatures(featuresWithValuesNames);
          // set checkbox to previous state
          kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay = completelyRemoveFilteredFeaturesFromDisplayChbState;
        }


        $scope.$on("resetNoDataDisplay", function() {
          $scope.resetNoDataDisplay();
        });

        $scope.resetNoDataDisplay = function() {
          kommonitorDataExchangeService.useNoDataToggle = false;
            let visibleFeatures = $scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features;
            let visibleAndNoDataFeatures = visibleFeatures.concat($scope.featuresWithoutValues);

            // get feature names array
            let visibleAndNoDataFeaturesNames = [];
            for (var i = 0; i < visibleAndNoDataFeatures.length; i++) {
              visibleAndNoDataFeaturesNames.push( visibleAndNoDataFeatures[i].properties["name"]);
            }

            // store checkbox state
            let completelyRemoveFilteredFeaturesFromDisplayChbState = kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay;
            kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay = true; // set checkbox true
            // perform spatial filter
            kommonitorFilterHelperService.applySpatialFilter_currentSpatialUnitFeatures(visibleAndNoDataFeaturesNames);
            // set checkbox to previous state
            kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay = completelyRemoveFilteredFeaturesFromDisplayChbState;

            $scope.featuresWithoutValues = [];
        }

        
        /**
         * binds the popup of a clicked output
         * to layer.feature.properties.popupContent
         */
        function onEachFeatureSpatialUnit(feature, layer) {
          // does this feature have a property named popupContent?
          layer.on({
            click: function () {

              // var propertiesString = "<pre>" + JSON.stringify(feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

              var popupContent = '<div class="spatialUnitInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
              for (var p in feature.properties) {
                  popupContent += '<tr><td>' + p + '</td><td>'+ feature.properties[p] + '</td></tr>';
              }
              popupContent += '</table></div>';

              layer.bindPopup(popupContent);              

              // if (propertiesString)
              //   layer.bindPopup(propertiesString);
            }
          });
        }

        /**
         * binds the popup of a clicked output
         * to layer.feature.properties.popupContent
         */
        function onEachFeatureGeoresource(feature, layer) {
          // does this feature have a property named popupContent?
          layer.on({
            click: function () {

              var popupContent = '<div class="georesourceInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
              for (var p in feature.properties) {
                  popupContent += '<tr><td>' + p + '</td><td>'+ feature.properties[p] + '</td></tr>';
              }
              popupContent += '</table></div>';

              layer.bindPopup(popupContent);

              // var propertiesString = "<pre>" + JSON.stringify(feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

              // if (propertiesString)
              //   layer.bindPopup(propertiesString);
            }
          });
        }

        /**
         * binds the popup of a clicked output
         * to layer.feature.properties.popupContent
         */
        function onEachFeatureIndicator(feature, layer) {
          var indicatorValue = feature.properties[INDICATOR_DATE_PREFIX + $scope.date];
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
          layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: function () {
              switchHighlightFeature(layer);
            }
          });
        }



        function switchHighlightFeature(layer) {
          // add or remove feature within a list of "clicked features"
          // those shall be treated specially, i.e. keep being highlighted
          if (!kommonitorFilterHelperService.featureIsCurrentlySelected(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
            kommonitorFilterHelperService.addFeatureToSelection(layer.feature);
            highlightClickedFeature(layer);
          }

          else {
            //remove from array
            kommonitorFilterHelperService.removeFeatureFromSelection(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME]);
            resetHighlightClickedFeature(layer);
          }
        }

        function onEachFeatureCustomIndicator(feature, layer) {
          // does this feature have a property named popupContent?
          layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlightCustom,
            click: function () {

              var popupContent = layer.feature.properties;

              if (popupContent)
                layer.bindPopup("Indicator: " + JSON.stringify(popupContent));
            }
          });
        }


        $scope.$on("addSpatialUnitAsGeopackage", function (event) {

          console.log('addSpatialUnitAsGeopackage was called');

          var layer = L.geoPackageFeatureLayer([], {
            geoPackageUrl: './test1234.gpkg',
            layerName: 'test1234',
            style: function (feature) {
              return {
                color: "#F00",
                weight: 1,
                opacity: 1
              };
            },
            onEachFeature: onEachFeatureSpatialUnit
          });

          // layer.StyledLayerControl = {
          // 	removable : true,
          // 	visible : true
          // };

          $scope.layerControl.addOverlay(layer, "GeoPackage", { groupName: spatialUnitLayerGroupName });
          layer.addTo($scope.map);
          $scope.updateSearchControl();


        });

        $scope.$on("addSpatialUnitAsGeoJSON", function (event, spatialUnitMetadataAndGeoJSON, date) {

          console.log('addSpatialUnitAsGeoJSON was called');

          // if ($scope.layers.overlays[spatialUnitMetadataAndGeoJSON.spatialUnitLevel]) {
          //     delete $scope.layers.overlays[spatialUnitMetadataAndGeoJSON.spatialUnitLevel];
          //
          //     console.log($scope.layers.overlays);
          // }

          var layer = L.geoJSON(spatialUnitMetadataAndGeoJSON.geoJSON, {
            style: function (feature) {
              return {
                color: "blue",
                weight: 1,
                opacity: 1
              };
            },
            onEachFeature: onEachFeatureSpatialUnit
          });

          // layer.StyledLayerControl = {
          // 	removable : true,
          // 	visible : true
          // };

          $scope.layerControl.addOverlay(layer, spatialUnitMetadataAndGeoJSON.spatialUnitLevel + "_" + date, spatialUnitLayerGroupName);
          layer.addTo($scope.map);
          $scope.updateSearchControl();

        });

        $scope.$on("addGeoresourceAsGeoJSON", function (event, georesourceMetadataAndGeoJSON, date) {

          var layer = L.geoJSON(georesourceMetadataAndGeoJSON.geoJSON, {
            style: function (feature) {
              return {
                color: "red",
                weight: 1,
                opacity: 1
              };
            },
            onEachFeature: onEachFeatureGeoresource
          });

          // layer.StyledLayerControl = {
          //   removable : false,
          //   visible : true
          // };

          $scope.layerControl.addOverlay(layer, georesourceMetadataAndGeoJSON.datasetName + "_" + date, georesourceLayerGroupName);
          layer.addTo($scope.map);
          $scope.updateSearchControl();

          $scope.map.invalidateSize(true);
        });        

        $scope.$on("addPoiGeoresourceAsGeoJSON", function (event, georesourceMetadataAndGeoJSON, date, useCluster) {

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
            markers = L.featureGroup();
          }          

          georesourceMetadataAndGeoJSON.geoJSON.features.forEach(function (poiFeature) {
            // index 0 should be longitude and index 1 should be latitude
            //.bindPopup( poiFeature.properties.name )
            var newMarker = kommonitorGenericMapHelperService.createCustomMarker(poiFeature, georesourceMetadataAndGeoJSON.poiMarkerStyle, georesourceMetadataAndGeoJSON.poiMarkerText, georesourceMetadataAndGeoJSON.poiSymbolColor, georesourceMetadataAndGeoJSON.poiMarkerColor, georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name, georesourceMetadataAndGeoJSON);            
            
            markers = kommonitorGenericMapHelperService.addPoiMarker(markers, newMarker);
          });

          // markers.StyledLayerControl = {
          //   removable : false,
          //   visible : true
          // };

          $scope.layerControl.addOverlay(markers, georesourceMetadataAndGeoJSON.datasetName + "_" + date, poiLayerGroupName);
          markers.addTo($scope.map);
          $scope.updateSearchControl();
          // $scope.map.addLayer( markers );
          $scope.map.invalidateSize(true);
        });

        $scope.$on("removePoiGeoresource", function (event, georesourceMetadataAndGeoJSON) {

          var layerName = georesourceMetadataAndGeoJSON.datasetName;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === poiLayerGroupName && layer.name.includes(layerName + "_")) {
              $scope.layerControl.removeLayer(layer.layer);
              $scope.map.removeLayer(layer.layer);
              $scope.updateSearchControl();
            }
          });
        });

        $scope.$on("addAoiGeoresourceAsGeoJSON", function (event, georesourceMetadataAndGeoJSON, date) {

          var color = georesourceMetadataAndGeoJSON.aoiColor;

          var layer = L.geoJSON(georesourceMetadataAndGeoJSON.geoJSON, {
            style: function (feature) {
              return {
                fillColor: color,
                color: "black",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.7
              };
            },
            onEachFeature: onEachFeatureGeoresource
          });

          // layer.StyledLayerControl = {
          //   removable : false,
          //   visible : true
          // };

          $scope.layerControl.addOverlay(layer, georesourceMetadataAndGeoJSON.datasetName + "_" + date, aoiLayerGroupName);
          layer.addTo($scope.map);
          $scope.updateSearchControl();

          $scope.map.invalidateSize(true);
        });

        $scope.$on("removeAoiGeoresource", function (event, georesourceMetadataAndGeoJSON) {

          var layerName = georesourceMetadataAndGeoJSON.datasetName;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === aoiLayerGroupName && layer.name.includes(layerName + "_")) {
              $scope.layerControl.removeLayer(layer.layer);
              $scope.map.removeLayer(layer.layer);
              $scope.updateSearchControl();
            }
          });
        });

        $scope.$on("addLoiGeoresourceAsGeoJSON", function (event, georesourceMetadataAndGeoJSON, date) {

          var color = georesourceMetadataAndGeoJSON.aoiColor;

          var featureGroup = L.featureGroup();

          var style = {
            color: georesourceMetadataAndGeoJSON.loiColor,
            dashArray: georesourceMetadataAndGeoJSON.loiDashArrayString,
            weight: georesourceMetadataAndGeoJSON.loiWidth || 3,
            opacity: 1
          };



          georesourceMetadataAndGeoJSON.geoJSON.features.forEach((item, i) => {
            var type = item.geometry.type;

            if (type === "Polygon" || type === "MultiPolygon"){
              var lines = turf.polygonToLine(item);

              L.geoJSON(lines, {
                style: style,
                onEachFeature: onEachFeatureGeoresource
              }).addTo(featureGroup);
            }
            else{
              L.geoJSON(item, {
                style: style,
                onEachFeature: onEachFeatureGeoresource
              }).addTo(featureGroup);
            }
          });

          // georesourceMetadataAndGeoJSON.geoJSON.features.forEach((loiFeature, i) => {
          //   var latLngs =
          //   var polyline = L.polyline(loiFeature.geometry.coordinates);
          //
          //   var geoJSON = polyline.toGeoJSON();
          //
          //   var geoJSON_line = L.geoJSON(geoJSON, {
          //     style: style,
          //     onEachFeature: onEachFeatureGeoresource
          //   })
          //
          //   geoJSON_line.addTo(featureGroup);
          // });

          // layer.StyledLayerControl = {
          //   removable : false,
          //   visible : true
          // };

          $scope.layerControl.addOverlay(featureGroup, georesourceMetadataAndGeoJSON.datasetName + "_" + date, loiLayerGroupName);
          featureGroup.addTo($scope.map);
          $scope.updateSearchControl();

          $scope.map.invalidateSize(true);
        });

        $scope.$on("removeLoiGeoresource", function (event, georesourceMetadataAndGeoJSON) {

          var layerName = georesourceMetadataAndGeoJSON.datasetName;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === loiLayerGroupName && layer.name.includes(layerName + "_")) {
              $scope.layerControl.removeLayer(layer.layer);
              $scope.map.removeLayer(layer.layer);
              $scope.updateSearchControl();
            }
          });
        });

        $scope.$on("addWmsLayerToMap", function (event, dataset, opacity) {
          var wmsLayer = L.tileLayer.betterWms(dataset.url, {
            layers: dataset.layerName,
            transparent: true,
            format: 'image/png',
            minZoom: __env.minZoomLevel,
            maxZoom: __env.maxZoomLevel,
            opacity: opacity
          });

          $scope.layerControl.addOverlay(wmsLayer, dataset.title, wmsLayerGroupName);
          wmsLayer.addTo($scope.map);
          $scope.updateSearchControl();
          $scope.map.invalidateSize(true);
        });

        $scope.$on("adjustOpacityForWmsLayer", function (event, dataset, opacity) {
          var layerName = dataset.title;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === wmsLayerGroupName && layer.name.includes(layerName)) {
              layer.layer.setOpacity(opacity);
            }
          });
        });

        $scope.$on("adjustOpacityForAoiLayer", function (event, dataset, opacity) {
          var layerName = dataset.datasetName;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === aoiLayerGroupName && layer.name.includes(layerName)) {
              layer.layer.setStyle({
                fillOpacity:opacity,
                opacity:opacity
              });
            }
          });
        });

        $scope.$on("adjustOpacityForLoiLayer", function (event, dataset, opacity) {
          var layerName = dataset.datasetName;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === loiLayerGroupName && layer.name.includes(layerName)) {
              layer.layer.setStyle({
                fillOpacity:opacity,
                opacity:opacity
              });
            }
          });
        });

        $scope.$on("adjustOpacityForPoiLayer", function (event, dataset, opacity) {
          var layerName = dataset.datasetName;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === poiLayerGroupName && layer.name.includes(layerName)) {

              if(layer.layer._layers){
                for(var layerId in layer.layer._layers){
                  layer.layer._layers[layerId].setOpacity(opacity);
                }
              } 
              else if(layer.layer._featureGroup){
                for(var layerId in layer.layer._featureGroup._layers){
                  layer.layer._featureGroup._layers[layerId].setOpacity(opacity);
                }
              }   
              else{                
                layer.layer.setOpacity(opacity);
              } 
            }
          });
        });

        $scope.$on("removeWmsLayerFromMap", function (event, dataset) {

          var layerName = dataset.title;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === wmsLayerGroupName && layer.name.includes(layerName)) {
              $scope.layerControl.removeLayer(layer.layer);
              $scope.map.removeLayer(layer.layer);
            }
          });
        });

        var getWfsStyle = function(dataset, opacity){

          if(dataset.geometryType === "POI"){
            return {
              weight: 1,
              opacity: opacity,
              color: dataset.poiMarkerColor,
              dashArray: '',
              fillOpacity: opacity,
              fillColor: dataset.poiMarkerColor
            };
          }

          else if (dataset.geometryType === "LOI"){
            return {
              weight: dataset.loiWidth,
              opacity: opacity,
              color: dataset.loiColor,
              dashArray: dataset.loiDashArrayString,
              fillOpacity: opacity,
              fillColor: dataset.loiColor
            };
          }

          else{
            return {
              weight: 1,
              opacity: opacity,
              color: dataset.aoiColor,
              dashArray: '',
              fillOpacity: opacity,
              fillColor: dataset.aoiColor
            };
          }

        };

        $scope.getFilterEncoding = function(dataset){

          var filterExpressions = [];

          if(dataset.filterEncoding.PropertyIsEqualTo && dataset.filterEncoding.PropertyIsEqualTo.propertyName && dataset.filterEncoding.PropertyIsEqualTo.propertyValue){
            filterExpressions.push(new L.Filter.EQ(dataset.filterEncoding.PropertyIsEqualTo.propertyName, dataset.filterEncoding.PropertyIsEqualTo.propertyValue));
          }

          if (dataset.filterFeaturesToMapBBOX) {
            filterExpressions.push(new L.Filter.BBox(dataset.featureTypeGeometryName, $scope.map.getBounds(), L.CRS.EPSG3857));
          }

          if (filterExpressions.length == 0){
            return undefined;
          }

          if (filterExpressions.length < 2){
            return filterExpressions;
          }
          else{
            // var stringifiedFilterExpressions = [];

            // for (const filterExpr of filterExpressions) {
            //   stringifiedFilterExpressions.push(L.XmlUtil.serializeXmlDocumentString(filterExpr.toGml()));
            // }

            // return new L.Filter.And(...stringifiedFilterExpressions);
            return new L.Filter.And(...filterExpressions);
          }          
          
        };

        $scope.$on("addWfsLayerToMap", function (event, dataset, opacity, useCluster) {
          var wfsLayerOptions = {
            url: dataset.url,
            typeNS: dataset.featureTypeNamespace,
            namespaceUri: "http://mapserver.gis.umn.edu/mapserver",
            typeName: dataset.featureTypeName,
            geometryField: dataset.featureTypeGeometryName,
            // maxFeatures: null,
            style: getWfsStyle(dataset, opacity)
          };

          var filterEncoding = $scope.getFilterEncoding(dataset);
          if (filterEncoding){
            wfsLayerOptions.filter = filterEncoding;
          }
                     

          var wfsLayer;
          var poiMarkerLayer;

          if(dataset.geometryType === "POI"){

            if (useCluster) {
              poiMarkerLayer = L.markerClusterGroup({
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

                  var className = "marker-cluster " + c + " awesome-marker-legend-TransparentIcon-" + dataset.poiMarkerColor;

                  //'marker-cluster' + c + ' ' +
                  return new L.DivIcon({ html: '<div class="awesome-marker-legend-icon-' + dataset.poiMarkerColor + '" ><span>' + childCount + '</span></div>', className: className, iconSize: new L.Point(40, 40) });
                }
              });
            }
            else {
              poiMarkerLayer = L.featureGroup();
            } 

            wfsLayer = new L.WFS(wfsLayerOptions);
          }
          else{
            wfsLayer = new L.WFS(wfsLayerOptions);
          }

          try {
            wfsLayer.once('load', function () {

              if(dataset.geometryType === "POI"){
                poiMarkerLayer = kommonitorGenericMapHelperService.createCustomMarkersFromWfsPoints(wfsLayer, poiMarkerLayer, dataset);
              }

              console.log("Try to fit bounds on wfsLayer");
              $scope.map.fitBounds(wfsLayer.getBounds());

              console.log("Tried fit bounds on wfsLayer");

              $scope.map.invalidateSize(true);
              // $scope.loadingData = false;
            });

            wfsLayer.on('click', function (event) {
              // var propertiesString = "<pre>" + JSON.stringify(event.layer.feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

              var popupContent = '<div class="wfsInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
              for (var p in event.layer.feature.properties) {
                  popupContent += '<tr><td>' + p + '</td><td>'+ event.layer.feature.properties[p] + '</td></tr>';
              }
              popupContent += '</table></div>';

              var popup = L.popup();
              popup
                .setLatLng(event.latlng)
                .setContent(popupContent)
                .openOn($scope.map);
            });
            if(poiMarkerLayer){
              $scope.layerControl.addOverlay(poiMarkerLayer, dataset.title, wfsLayerGroupName);
              poiMarkerLayer.addTo($scope.map);
            }
            else{
              $scope.layerControl.addOverlay(wfsLayer, dataset.title, wfsLayerGroupName);
              wfsLayer.addTo($scope.map);
            }            
            $scope.updateSearchControl();

          }
          catch (error) {
            $scope.loadingData = false;
            kommonitorDataExchangeService.displayMapApplicationError(error);
          }

        });

        $scope.$on("adjustOpacityForWfsLayer", function (event, dataset, opacity) {
          var layerName = dataset.title;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === wfsLayerGroupName && layer.name.includes(layerName)) {
              // layer.layer.setOpacity(opacity);
              var newStyle = getWfsStyle(dataset, opacity);
              // layer.layer.options.style = newStyle;
              if(layer.layer._layers){
                for(var layerId in layer.layer._layers){

  
                  if(dataset.geometryType === "POI"){
                    layer.layer._layers[layerId].setOpacity(opacity);
                  }
                  else{
                    layer.layer._layers[layerId].setStyle(newStyle);
                  }
                }
              }   
              else{                

                if(dataset.geometryType === "POI"){
                  layer.layer.setOpacity(opacity);
                }
                else{
                  layer.layer.setStyle(newStyle);
                }
              }           
              
            }
          });
        });

        $scope.$on("adjustColorForWfsLayer", function (event, dataset, opacity) {
          var layerName = dataset.title;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === wfsLayerGroupName && layer.name.includes(layerName)) {
              var newStyle = getWfsStyle(dataset, opacity);

              layer.layer.setStyle(newStyle);
            }
          });
        });

        $scope.$on("removeWfsLayerFromMap", function (event, dataset) {

          var layerName = dataset.title;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === wfsLayerGroupName && layer.name.includes(layerName)) {
              $scope.layerControl.removeLayer(layer.layer);
              $scope.map.removeLayer(layer.layer);
            }
          });
        });

        $scope.$on("addFileLayerToMap", function (event, dataset, opacity) {
          try {
            var fileLayer;

            if (dataset.isPOI){
              fileLayer = L.featureGroup();
    
              dataset.geoJSON.features.forEach(function (poiFeature) {
                // index 0 should be longitude and index 1 should be latitude
                //.bindPopup( poiFeature.properties.name )
                var newMarker = kommonitorGenericMapHelperService.createCustomMarker(poiFeature, dataset.poiMarkerStyle, dataset.poiMarkerText, dataset.poiSymbolColor, dataset.poiMarkerColor, dataset.poiSymbolBootstrap3Name, dataset);            
                
                fileLayer = kommonitorGenericMapHelperService.addPoiMarker(fileLayer, newMarker);
              });
            }
            else{
              var style = {
                weight: 1,
                opacity: opacity,
                color: defaultBorderColor,
                dashArray: '',
                fillOpacity: 1,
                fillColor: dataset.displayColor
              };
  
              fileLayer = L.geoJSON(dataset.geoJSON, {
                style: style,
                onEachFeature: function (feature, layer) {
                  layer.on({
                    click: function () {
  
                      // var propertiesString = "<pre>" + JSON.stringify(feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";
  
                      var popupContent = '<div class="fileInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
                      for (var p in feature.properties) {
                          popupContent += '<tr><td>' + p + '</td><td>'+ feature.properties[p] + '</td></tr>';
                      }
                      popupContent += '</table></div>';
  
                      if (popupContent)
                        layer.bindPopup(popupContent);
                    }
                  });
                }
              });
            }

            $scope.showFileLayer(fileLayer, dataset); 
          } catch (error) {
            console.error(error);
            $rootScope.$broadcast("FileLayerError", error, dataset);
          }          
        });

        $scope.showFileLayer = function (fileLayer, dataset) {
          try {
            $scope.layerControl.addOverlay(fileLayer, dataset.datasetName, fileLayerGroupName);
            fileLayer.addTo($scope.map);

            $scope.map.fitBounds(fileLayer.getBounds());

            $rootScope.$broadcast("FileLayerSuccess", dataset);

            $scope.updateSearchControl();

            $scope.map.invalidateSize(true);
          } catch (error) {
            $rootScope.$broadcast("FileLayerError", error, dataset);
          }          
        };

        $scope.$on("adjustOpacityForFileLayer", function (event, dataset, opacity) {
          var layerName = dataset.datasetName;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === fileLayerGroupName && layer.name.includes(layerName)) {
              var newStyle = {
                weight: 1,
                opacity: opacity,
                color: defaultBorderColor,
                dashArray: '',
                fillOpacity: opacity,
                fillColor: dataset.displayColor
              };

              // layer.layer.options.style = newStyle;
              layer.layer.setStyle(newStyle);
            }
          });
        });

        $scope.$on("adjustColorForFileLayer", function (event, dataset) {
          var layerName = dataset.datasetName;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === fileLayerGroupName && layer.name.includes(layerName)) {

                var newStyle = {
                  weight: 1,
                  color: defaultBorderColor,
                  dashArray: '',
                  fillColor: dataset.displayColor
                };
  
                layer.layer.setStyle(newStyle);
                            
            }
          });
        });

        $scope.$on("removeFileLayerFromMap", function (event, dataset) {

          var layerName = dataset.datasetName;

          $scope.layerControl._layers.forEach(function (layer) {
            if (layer.group.name === fileLayerGroupName && layer.name.includes(layerName)) {
              $scope.layerControl.removeLayer(layer.layer);
              $scope.map.removeLayer(layer.layer);
            }
          });
        });

        function highlightFeature(e) {
          var layer = e.target;
          kommonitorVisualStyleHelperService.setOpacity(layer.options.fillOpacity);

          highlightFeatureForLayer(layer);
        }

        function highlightFeatureForLayer(layer) {

          setTemporarilyHighlightedStyle(layer);

          // update diagrams for hovered feature
          $rootScope.$broadcast("updateDiagramsForHoveredFeature", layer.feature.properties);

        }

        function highlightClickedFeature(layer) {

          setPermanentlyHighlightedStyle(layer);

          // update diagrams for hovered feature
          $rootScope.$broadcast("updateDiagramsForHoveredFeature", layer.feature.properties);
        }

        function setPermanentlyHighlightedStyle(layer) {
          var fillOpacity = 1;
          if ($scope.useTransparencyOnIndicator) {
            fillOpacity = defaultFillOpacityForHighlightedFeatures;
          }

          layer.setStyle({
            weight: 3,
            color: defaultColorForClickedFeatures,
            dashArray: '',
            fillOpacity: fillOpacity
          });

          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
            // also bring possible isochrone layer to front
            // so it will not disapper behing indicator layer
            if ($scope.isochronesLayer) {
              $scope.isochronesLayer.bringToFront();
            }
          }
        }

        function setTemporarilyHighlightedStyle(layer) {
          var fillOpacity = 1;
          if ($scope.useTransparencyOnIndicator) {
            fillOpacity = defaultFillOpacity;
          }

          layer.setStyle({
            weight: 3,
            color: defaultColorForHoveredFeatures,
            dashArray: '',
            fillOpacity: fillOpacity
          });

          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
            // also bring possible isochrone layer to front
            // so it will not disapper behing indicator layer
            if ($scope.isochronesLayer) {
              $scope.isochronesLayer.bringToFront();
            }
          }
        }

        function preserveHighlightedFeatures() {
          $scope.map.eachLayer(function (layer) {
            if (layer.feature) {
              if (kommonitorFilterHelperService.featureIsCurrentlySelected(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                setPermanentlyHighlightedStyle(layer);
                $rootScope.$broadcast("updateDiagramsForHoveredFeature", layer.feature.properties);
              }
            }
          });
        }

        $scope.$on("preserveHighlightedFeatures", function (event) {
          preserveHighlightedFeatures();
        });

        function resetHighlight(e) {
          var layer = e.target;
          resetHighlightForLayer(layer);

          if (!kommonitorFilterHelperService.featureIsCurrentlySelected(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
            layer.bringToBack();
          }
          //layer.bringToBack();
        }

        function resetHighlightForLayer(layer) {

          var style;

          // only restyle feature when not in list of clicked features
          if (!kommonitorFilterHelperService.featureIsCurrentlySelected(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
            if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
              style = $scope.filteredStyle;
            }
            else if (!kommonitorDataExchangeService.isMeasureOfValueChecked) {
              //$scope.currentIndicatorLayer.resetStyle(layer);
              if ($scope.indicatorTypeOfCurrentLayer.includes('DYNAMIC')) {
                style = kommonitorVisualStyleHelperService.styleDynamicIndicator(layer.feature, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, false);
              }
              else {
                if (kommonitorVisualStyleHelperService.classifyMethod == 'manual'){
                  style = kommonitorVisualStyleHelperService.styleDefault(layer.feature, $scope.manualBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, $scope.datasetContainsNegativeValues, false);
                }
                else {
                  style = kommonitorVisualStyleHelperService.styleDefault(layer.feature, $scope.defaultBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, $scope.datasetContainsNegativeValues, false);
                }
              }
            }
            else {
              style = kommonitorVisualStyleHelperService.styleMeasureOfValue(layer.feature, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, false);
            }
            layer.setStyle(style);
          }
          else {
            setPermanentlyHighlightedStyle(layer);
          }

          //update diagrams for unhoveredFeature
          $rootScope.$broadcast("updateDiagramsForUnhoveredFeature", layer.feature.properties);
        }

        function resetHighlightClickedFeature(layer) {
          var style;
          //$scope.currentIndicatorLayer.resetStyle(layer);
          if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
            layer.setStyle($scope.filteredStyle);
          }
          else if (!kommonitorDataExchangeService.isMeasureOfValueChecked) {
            //$scope.currentIndicatorLayer.resetStyle(layer);
            if ($scope.indicatorTypeOfCurrentLayer.includes('DYNAMIC')) {
              style = kommonitorVisualStyleHelperService.styleDynamicIndicator(layer.feature, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, false);

              layer.setStyle(style);
            }
            else {
              style = kommonitorVisualStyleHelperService.styleDefault(layer.feature, $scope.defaultBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, $scope.datasetContainsNegativeValues, false);

              layer.setStyle(style);
            }
          }
          else {
            style = kommonitorVisualStyleHelperService.styleMeasureOfValue(layer.feature, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, false);

            layer.setStyle(style);
          }
        }

        function resetHighlightCustom(e) {
          $scope.currentCustomIndicatorLayer.resetStyle(e.target);
          if (!kommonitorFilterHelperService.featureIsCurrentlySelected(e.target.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
            e.target.bringToBack();
          }
        }

        var wait = ms => new Promise((r, j) => setTimeout(r, ms))

        $scope.recenterMap = function () {
          $scope.map.invalidateSize(true);

          fitBounds();

        };

        $scope.$on("recenterMapContent", function (event) {
          $scope.recenterMap();
        });

        $scope.$on("invalidateMapSize", function (event) {
          $timeout(function(){
            $scope.map.invalidateSize(true);
          }, 500);          
        });

        $scope.$on("recenterMapOnHideSideBar", async function (event) {
          //wait due to animation of the sidebar

          // make animation in 30 steps
          // var waitForInMs = 30;
          // for(var i=0; i<=300; i++){
          //
          //   i += waitForInMs;
          //
          //   await wait(waitForInMs);
          //
          //   $scope.map.invalidateSize(true);
          //
          //   panToCenterOnInActiveMenue(500);
          //   // $scope.recenterMap();
          // }

          var waitForInMs = 100;
          await wait(waitForInMs);
          panToCenterOnInActiveMenue(500);
        });

        $scope.$on("recenterMapOnShowSideBar", async function (event) {
          //wait due to animation of the sidebar

          // make animation in 30 steps
          // var waitForInMs = 30;
          // for(var i=0; i<=300; i++){
          //
          //   i += waitForInMs;
          //
          //   await wait(waitForInMs);
          //
          //   $scope.map.invalidateSize(true);
          //
          //   panToCenterOnActiveMenue(500);
          //   // $scope.recenterMap();
          // }

          var waitForInMs = 100;
          await wait(waitForInMs);
          panToCenterOnActiveMenue(500);

        });

        function panToCenterOnActiveMenue(numPixels) {
          if ($scope.map) {
            $scope.map.invalidateSize(true);
            $scope.map.panBy(L.point(numPixels, 0));

            $scope.map.invalidateSize(true);
          }
        };

        function panToCenterOnInActiveMenue(numPixels) {
          if ($scope.map) {
            $scope.map.invalidateSize(true);
            $scope.map.panBy(L.point(-numPixels, 0));

            $scope.map.invalidateSize(true);
          }
        };


        function fitBounds() {
          if ($scope.map && $scope.currentIndicatorLayer) {

            $scope.map.invalidateSize(true);
            // $scope.map.setView(L.latLng($scope.latCenter, $scope.lonCenter), $scope.zoomLevel);
            $scope.map.fitBounds($scope.currentIndicatorLayer.getBounds());
          }

        }

        function zoomToFeature(e) {
          map.fitBounds(e.target.getBounds());
        }

        function markOutliers(indicatorMetadataAndGeoJSON, indicatorPropertyName) {
          // identify possible data outliers
          // mark them using a dedicated property

          $scope.outliers_high = [];
          $scope.outliers_low = [];

          var valueArray = new Array();

          indicatorMetadataAndGeoJSON.geoJSON.features.forEach(function (feature) {
            if (!kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[indicatorPropertyName])) {
              if (!valueArray.includes(feature.properties[indicatorPropertyName])) {
                valueArray.push(feature.properties[indicatorPropertyName]);
              }
            }
          });

          // https://jstat.github.io/all.html#quartiles
          var quartiles = jStat.quartiles(valueArray);
          var quartile_25 = quartiles[0];
          var quartile_75 = quartiles[2];

          var diff = quartile_75 - quartile_25;
          var whiskerRange_outliers_soft = diff * 1.5;
          var whiskerRange_outliers_extreme = diff * 3;

          var whisker_low_soft = quartile_25 - whiskerRange_outliers_soft;
          var whisker_high_soft = quartile_75 + whiskerRange_outliers_soft;

          var whisker_low_extreme = quartile_25 - whiskerRange_outliers_extreme;
          var whisker_high_extreme = quartile_75 + whiskerRange_outliers_extreme;

          // for now only mark extreme outliers!

          indicatorMetadataAndGeoJSON.geoJSON.features.forEach(function (feature) {
            // compare feature value to whiskers and set property
            if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[indicatorPropertyName])) {
              feature.properties[outlierPropertyName] = outlierPropertyValue_no;
            }
            else if (feature.properties[indicatorPropertyName] < whisker_low_extreme) {
              feature.properties[outlierPropertyName] = outlierPropertyValue_low_extreme;
              $scope.containsOutliers_low = true;
              $scope.outliers_low.push(feature.properties[indicatorPropertyName]);
            }
            // else if (feature.properties[indicatorPropertyName] < whisker_low_soft){
            //   feature.properties[outlierPropertyName] = outlierPropertyValue_low_soft;
            //   $scope.containsOutliers_low = true;
            //   $scope.outliers_low.push(feature.properties[indicatorPropertyName]);
            // }
            else if (feature.properties[indicatorPropertyName] > whisker_high_extreme) {
              feature.properties[outlierPropertyName] = outlierPropertyValue_high_extreme;
              $scope.containsOutliers_high = true;
              $scope.outliers_high.push(feature.properties[indicatorPropertyName]);
            }
            // else if (feature.properties[indicatorPropertyName] > whisker_high_soft){
            //   feature.properties[outlierPropertyName] = outlierPropertyValue_high_soft;
            //   $scope.containsOutliers_high = true;
            //   $scope.outliers_high.push(feature.properties[indicatorPropertyName]);
            // }
            else {
              feature.properties[outlierPropertyName] = outlierPropertyValue_no;
            }
          });

          // sort outliers arrays
          $scope.outliers_high.sort(function (a, b) {
            return a - b;
          });
          $scope.outliers_low.sort(function (a, b) {
            return a - b;
          });

          return indicatorMetadataAndGeoJSON;
        }

        $scope.setNoDataValuesAsNull = function (indicatorMetadataAndGeoJSON) {
          indicatorMetadataAndGeoJSON.geoJSON.features.forEach(function (feature) {
            if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[$scope.indicatorPropertyName])) {
              feature.properties[$scope.indicatorPropertyName] = null;
            }
          });

          return indicatorMetadataAndGeoJSON;
        }

        $scope.applyDefaultClassificationSettings = function (indicatorMetadataAndGeoJSON) {
          if (indicatorMetadataAndGeoJSON.defaultClassificationMapping.classificationMethod) {
            kommonitorVisualStyleHelperService.classifyMethod = indicatorMetadataAndGeoJSON.defaultClassificationMapping.classificationMethod.toLowerCase();
          }
          if (indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses) {
            kommonitorVisualStyleHelperService.numClasses = indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses;
          }
        }

        $scope.calcMOVBreaks = function (breaks, measureOfValue) {
          let movBreaks = [[], []];
          breaks.forEach((br) => {
            if (br < measureOfValue) {
              movBreaks[1].push(br);
            }
            else {
              movBreaks[0].push(br);
            }
          });
          movBreaks[1].push(measureOfValue);
          movBreaks[0].unshift(measureOfValue);
          return movBreaks;
        }

        $scope.applyRegionalDefaultClassification = function (indicatorMetadataAndGeoJSON) {
          if (indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses) {
            kommonitorVisualStyleHelperService.numClasses = indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses;
          }

          let firstBreak;
          let lastBreak;
          if ($scope.defaultBrew && $scope.defaultBrew.breaks) {
            firstBreak = $scope.defaultBrew.breaks[0];
            lastBreak = $scope.defaultBrew.breaks[$scope.defaultBrew.breaks.length-1];
          }
          else {
            firstBreak = $scope.dynamicDecreaseBrew.breaks[0];
            lastBreak = $scope.dynamicIncreaseBrew.breaks[$scope.dynamicIncreaseBrew.breaks.length-1];
          }

          for (let item of indicatorMetadataAndGeoJSON.defaultClassificationMapping.items) {
            if(item.spatialUnitId == kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId) {
              let regionalDefaultBreaks = [...item.breaks];
              if(firstBreak < regionalDefaultBreaks[0]){
                regionalDefaultBreaks.unshift(firstBreak);
              }
              if(lastBreak > regionalDefaultBreaks[regionalDefaultBreaks.length-1]){
                regionalDefaultBreaks.push(lastBreak);
              }
              if($scope.defaultBrew && $scope.defaultBrew.breaks) {
                let brew = kommonitorVisualStyleHelperService.setupManualBrew(
                  indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses, 
                  indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, 
                  regionalDefaultBreaks);
                $scope.defaultBrew.breaks = regionalDefaultBreaks;
                $scope.defaultBrew.colors = brew.colors;
                kommonitorVisualStyleHelperService.regionalDefaultBreaks = regionalDefaultBreaks;
              }
              else {
                let decreaseBreaks = regionalDefaultBreaks.filter(n => n < 0);
                if ($scope.dynamicDecreaseBrew.breaks[$scope.dynamicDecreaseBrew.breaks.length-1] > decreaseBreaks[decreaseBreaks.length-1]) {
                  decreaseBreaks.push($scope.dynamicDecreaseBrew.breaks[$scope.dynamicDecreaseBrew.breaks.length-1]);
                }
                let increaseBreaks = regionalDefaultBreaks.filter(n => n > 0);
                if ($scope.dynamicIncreaseBrew.breaks[0] < increaseBreaks[0]) {
                  increaseBreaks.unshift($scope.dynamicIncreaseBrew.breaks[0]);
                }

                console.log(indicatorMetadataAndGeoJSON);

                let decreaseBrew = kommonitorVisualStyleHelperService.setupManualBrew(
                  decreaseBreaks.length-1, 
                  defaultColorBrewerPaletteForBalanceDecreasingValues, 
                  decreaseBreaks);
                let increaseBrew = kommonitorVisualStyleHelperService.setupManualBrew(
                  increaseBreaks.length-1, 
                  defaultColorBrewerPaletteForBalanceIncreasingValues, 
                  increaseBreaks);

                $scope.dynamicDecreaseBrew.breaks = decreaseBreaks;
                $scope.dynamicIncreaseBrew.breaks = increaseBreaks;

                $scope.dynamicDecreaseBrew.colors = decreaseBrew.colors;
                $scope.dynamicIncreaseBrew.colors = increaseBrew.colors;
              }
            }
          }
        }

        $scope.checkAvailabilityOfRegionalDefault = function (indicatorMetadataAndGeoJSON) {
          let breaksAvailableForSelectedSpatialUnit = false;
          for (let item of indicatorMetadataAndGeoJSON.defaultClassificationMapping.items) {
            if(item.spatialUnitId == kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId) {
              breaksAvailableForSelectedSpatialUnit = true;
            }
          }
          if(kommonitorVisualStyleHelperService.classifyMethod == "regional_default") {
            if(!breaksAvailableForSelectedSpatialUnit || kommonitorDataExchangeService.isBalanceChecked) {
              if (!breaksAvailableForSelectedSpatialUnit) {
                kommonitorToastHelperService.displayWarningToast("Für diese Raumebene ist kein regionaler Standard verfügbar", "Es wird zur Klassifizierungsmethode Gleiches Intervall gewechselt");
              }
              else if (kommonitorDataExchangeService.isBalanceChecked) {
                kommonitorToastHelperService.displayWarningToast("Für die Bilanzierung ist kein regionaler Standard verfügbar", "Es wird zur Klassifizierungsmethode Gleiches Intervall gewechselt");
              }
              kommonitorVisualStyleHelperService.classifyMethod = 'equal_interval';
              kommonitorVisualStyleHelperService.numClasses = kommonitorVisualStyleHelperService.numClasses ? kommonitorVisualStyleHelperService.numClasses : 5;
            }
          }
          $rootScope.$broadcast("updateShowRegionalDefaultOption", breaksAvailableForSelectedSpatialUnit && !kommonitorDataExchangeService.isBalanceChecked);
        }

        $scope.setClassifyZeroForClassifyMethod = function(){
          if(kommonitorVisualStyleHelperService.classifyMethod == "regional_default") {
            if (kommonitorDataExchangeService.classifyZeroSeparately_backup == undefined) {
              kommonitorDataExchangeService.classifyZeroSeparately_backup = kommonitorDataExchangeService.classifyZeroSeparately;
            }
            kommonitorDataExchangeService.classifyZeroSeparately = false;
          }
          else {
            kommonitorDataExchangeService.classifyZeroSeparately = kommonitorDataExchangeService.classifyZeroSeparately_backup != undefined ? kommonitorDataExchangeService.classifyZeroSeparately_backup : kommonitorDataExchangeService.classifyZeroSeparately;
            kommonitorDataExchangeService.classifyZeroSeparately_backup = undefined;
          }
        }

        $scope.$on("replaceIndicatorAsGeoJSON", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation) {

          console.log('replaceIndicatorAsGeoJSON was called');

          kommonitorVisualStyleHelperService.isCustomComputation = false;
          if (isCustomComputation){
            kommonitorVisualStyleHelperService.isCustomComputation = true;
          }

          //reset opacity
          kommonitorVisualStyleHelperService.setOpacity(__env.defaultFillOpacity);

          refreshFilteredStyle();
          refreshOutliersStyle();
          refreshNoDataStyle();

          $scope.defaultBrew = undefined;
          $scope.gtMeasureOfValueBrew = undefined;
          $scope.ltMeasureOfValueBrew = undefined;
          $scope.manualBrew = undefined;

          kommonitorVisualStyleHelperService.manualMOVBreaks = [];
          kommonitorVisualStyleHelperService.regionalDefaultMOVBreaks = [];
          kommonitorVisualStyleHelperService.regionalDefaultBreaks = [];
          kommonitorVisualStyleHelperService.measureOfValueBrewArray = [];
          kommonitorVisualStyleHelperService.measureOfValueBrew = [];
          kommonitorVisualStyleHelperService.manualBrew = undefined;
          kommonitorVisualStyleHelperService.dynamicBrew = undefined;
          kommonitorVisualStyleHelperService.dynamicBrewBreaks = [];

          $scope.currentIndicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;

          if (!justRestyling) {
            // empty layer of possibly selected features
            // kommonitorFilterHelperService.clearSelectedFeatures();
            // kommonitorFilterHelperService.clearFilteredFeatures();

            $rootScope.$broadcast("checkBalanceMenueAndButton");
          }

          console.log("Remove old indicatorLayer if exists");
          if ($scope.currentIndicatorLayer) {
            $scope.layerControl.removeLayer($scope.currentIndicatorLayer);
            $scope.map.removeLayer($scope.currentIndicatorLayer);
          }

          $scope.currentIndicatorContainsZeroValues = false;

          $scope.date = date;

          $scope.indicatorPropertyName = INDICATOR_DATE_PREFIX + date;
          $scope.indicatorName = indicatorMetadataAndGeoJSON.indicatorName;
          $scope.indicatorDescription = indicatorMetadataAndGeoJSON.metadata.description;
          $scope.indicatorUnit = indicatorMetadataAndGeoJSON.unit;

          $scope.currentIndicatorMetadataAndGeoJSON = $scope.setNoDataValuesAsNull($scope.currentIndicatorMetadataAndGeoJSON);

          // identify and mark outliers prior to setting up of styling
          // in styling methods, outliers should be removed from classification!
          $scope.currentIndicatorMetadataAndGeoJSON = markOutliers($scope.currentIndicatorMetadataAndGeoJSON, $scope.indicatorPropertyName);

          kommonitorDataExchangeService.setAllFeaturesProperty(indicatorMetadataAndGeoJSON, $scope.indicatorPropertyName);
          kommonitorDataExchangeService.setSelectedFeatureProperty(kommonitorFilterHelperService.selectedIndicatorFeatureIds, $scope.indicatorPropertyName);

          $scope.currentGeoJSONOfCurrentLayer = $scope.currentIndicatorMetadataAndGeoJSON.geoJSON;

          for (var i = 0; i < indicatorMetadataAndGeoJSON.geoJSON.features.length; i++) {
            var containsZero = false;
            var containsNoData = false;
            if (kommonitorDataExchangeService.getIndicatorValue_asNumber(indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName]) == 0) {
              $scope.currentIndicatorContainsZeroValues = true;
              containsZero = true;
            };

            if (kommonitorDataExchangeService.indicatorValueIsNoData(indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName])) {
              $scope.currentIndicatorContainsNoDataValues = true;
              containsNoData = true;
            };

            if (containsZero && containsNoData) {
              break;
            }
          }

          /* ///////////////////////////////// RASTER SPECIAL TREATMENT
          // improve Raster display by eliminiating NoData cells and 
          // omitting display border in style
          */

          if(kommonitorDataExchangeService.selectedSpatialUnitIsRaster()){
            indicatorMetadataAndGeoJSON.geoJSON.features = indicatorMetadataAndGeoJSON.geoJSON.features.filter(feature => {
              if (kommonitorDataExchangeService.indicatorValueIsNoData(feature.properties[$scope.indicatorPropertyName])) {
                return false;
              }
              return true;
            });
          }

          var layer;

          $scope.indicatorTypeOfCurrentLayer = indicatorMetadataAndGeoJSON.indicatorType;

          $scope.applyDefaultClassificationSettings(indicatorMetadataAndGeoJSON);
          $scope.checkAvailabilityOfRegionalDefault(indicatorMetadataAndGeoJSON);

          $scope.setClassifyZeroForClassifyMethod();          
          
          if (kommonitorDataExchangeService.isMeasureOfValueChecked) {       
            var measureOfValueBrewArray = kommonitorVisualStyleHelperService.setupMeasureOfValueBrew(
              $scope.currentGeoJSONOfCurrentLayer, 
              $scope.indicatorPropertyName, 
              defaultColorBrewerPaletteForGtMovValues, 
              defaultColorBrewerPaletteForLtMovValues, 
              kommonitorVisualStyleHelperService.classifyMethod, 
              kommonitorDataExchangeService.measureOfValue,
              kommonitorVisualStyleHelperService.manualMOVBreaks,
              kommonitorVisualStyleHelperService.regionalDefaultMOVBreaks,
              kommonitorVisualStyleHelperService.numClasses
            );
            $scope.gtMeasureOfValueBrew = measureOfValueBrewArray[0];
            $scope.ltMeasureOfValueBrew = measureOfValueBrewArray[1];

            kommonitorVisualStyleHelperService.manualMOVBreaks = [];
            kommonitorVisualStyleHelperService.manualMOVBreaks[0] = measureOfValueBrewArray[0] ? measureOfValueBrewArray[0].breaks : [];
            kommonitorVisualStyleHelperService.manualMOVBreaks[1] = measureOfValueBrewArray[1] ? measureOfValueBrewArray[1].breaks : [];
            $scope.updateDefaultManualBreaksFromMOVManualBreaks();

            $scope.propertyName = INDICATOR_DATE_PREFIX + date;

            layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
              style: function (feature) {
                if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                  return $scope.filteredStyle;
                }
                return kommonitorVisualStyleHelperService.styleMeasureOfValue(feature, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, true);
              },
              onEachFeature: onEachFeatureIndicator
            });

            // $scope.makeMeasureOfValueLegend(isCustomComputation);

            if (indicatorMetadataAndGeoJSON.indicatorType.includes("DYNAMIC")) {
              var dynamicIndicatorBrewArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew(
                indicatorMetadataAndGeoJSON.geoJSON, 
                $scope.indicatorPropertyName, 
                defaultColorBrewerPaletteForBalanceIncreasingValues, 
                defaultColorBrewerPaletteForBalanceDecreasingValues, 
                kommonitorVisualStyleHelperService.classifyMethod,
                kommonitorVisualStyleHelperService.numClasses,
                []);
              $scope.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
              $scope.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
              kommonitorVisualStyleHelperService.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
              kommonitorVisualStyleHelperService.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
              $scope.updateDefaultManualBreaksFromMOVManualBreaks();
            }

          }
          else {

            if (indicatorMetadataAndGeoJSON.indicatorType.includes("STATUS")) {
              $scope.datasetContainsNegativeValues = $scope.containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON);
              if ($scope.datasetContainsNegativeValues) {
                var dynamicIndicatorBrewArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew(
                  indicatorMetadataAndGeoJSON.geoJSON, 
                  $scope.indicatorPropertyName, 
                  defaultColorBrewerPaletteForBalanceIncreasingValues, 
                  defaultColorBrewerPaletteForBalanceDecreasingValues, 
                  kommonitorVisualStyleHelperService.classifyMethod,
                  kommonitorVisualStyleHelperService.numClasses,
                  kommonitorVisualStyleHelperService.dynamicBrewBreaks);
                $scope.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
                $scope.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];

              }
              else {
                $scope.defaultBrew = kommonitorVisualStyleHelperService.setupDefaultBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses || 5, indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, kommonitorVisualStyleHelperService.classifyMethod);
              }
              if (kommonitorVisualStyleHelperService.classifyMethod == "regional_default") {
                $scope.applyRegionalDefaultClassification(indicatorMetadataAndGeoJSON);
              }
              kommonitorVisualStyleHelperService.manualBrew = $scope.defaultBrew;

              $scope.propertyName = INDICATOR_DATE_PREFIX + date;

              layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                style: function (feature) {
                  if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                    return $scope.filteredStyle;
                  }
                  return kommonitorVisualStyleHelperService.styleDefault(feature, $scope.defaultBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, $scope.datasetContainsNegativeValues, true);
                },
                onEachFeature: onEachFeatureIndicator
              });
              // $scope.makeDefaultLegend(indicatorMetadataAndGeoJSON.defaultClassificationMapping, $scope.datasetContainsNegativeValues, isCustomComputation);
            }
            else if (indicatorMetadataAndGeoJSON.indicatorType.includes("DYNAMIC")) {
              var dynamicIndicatorBrewArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew(
                indicatorMetadataAndGeoJSON.geoJSON, 
                $scope.indicatorPropertyName, 
                defaultColorBrewerPaletteForBalanceIncreasingValues, 
                defaultColorBrewerPaletteForBalanceDecreasingValues, 
                kommonitorVisualStyleHelperService.classifyMethod,
                kommonitorVisualStyleHelperService.numClasses,
                kommonitorVisualStyleHelperService.dynamicBrewBreaks);
              $scope.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
              $scope.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];

              $scope.propertyName = INDICATOR_DATE_PREFIX + date;

              layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                style: function(feature){
                  if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                    return $scope.filteredStyle;
                  }
                  return kommonitorVisualStyleHelperService.styleDynamicIndicator(feature, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, true);
                },
                onEachFeature: onEachFeatureIndicator
              });
              // $scope.makeDynamicIndicatorLegend(isCustomComputation);
            }

            $scope.updateManualMOVBreaksFromDefaultManualBreaks();

          }

          if(kommonitorVisualStyleHelperService.classifyMethod == "regional_default" 
            && kommonitorDataExchangeService.isMeasureOfValueChecked) {
            kommonitorVisualStyleHelperService.regionalDefaultMOVBreaks = $scope.calcMOVBreaks(
              kommonitorVisualStyleHelperService.regionalDefaultBreaks,
              kommonitorDataExchangeService.measureOfValue
            )
            var measureOfValueBrewArray = kommonitorVisualStyleHelperService.setupMeasureOfValueBrew(
              $scope.currentGeoJSONOfCurrentLayer, 
              $scope.indicatorPropertyName, 
              defaultColorBrewerPaletteForGtMovValues, 
              defaultColorBrewerPaletteForLtMovValues, 
              kommonitorVisualStyleHelperService.classifyMethod, 
              kommonitorDataExchangeService.measureOfValue,
              kommonitorVisualStyleHelperService.manualMOVBreaks,
              kommonitorVisualStyleHelperService.regionalDefaultMOVBreaks,
              kommonitorVisualStyleHelperService.numClasses
            );
            $scope.gtMeasureOfValueBrew = measureOfValueBrewArray[0];
            $scope.ltMeasureOfValueBrew = measureOfValueBrewArray[1];
            $scope.propertyName = INDICATOR_DATE_PREFIX + date;

            layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
              style: function (feature) {
                if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                  return $scope.filteredStyle;
                }
                return kommonitorVisualStyleHelperService.styleMeasureOfValue(feature, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, true);
              },
              onEachFeature: onEachFeatureIndicator
            });
          }

          $scope.currentIndicatorLayer = layer;

          $rootScope.$broadcast("updateLegendDisplay", $scope.currentIndicatorContainsZeroValues, $scope.datasetContainsNegativeValues, $scope.currentIndicatorContainsNoDataValues, $scope.containsOutliers_high, $scope.containsOutliers_low, $scope.outliers_low, $scope.outliers_high, kommonitorDataExchangeService.selectedDate);

          // if(spatialUnitName.includes("raster") || spatialUnitName.includes("Raster") || spatialUnitName.includes("grid") || spatialUnitName.includes("Grid")){
          //   layer.style.color = undefined;
          // }

          

          // layer.StyledLayerControl = {
          //   removable : false,
          //   visible : true
          // };

          var layerName = indicatorMetadataAndGeoJSON.indicatorName + "_" + spatialUnitName + "_" + date;

          if (isCustomComputation) {
            layerName += " - individuelles Berechnungsergebnis";
          }
          $scope.layerControl.addOverlay(layer, layerName, indicatorLayerGroupName);
          layer.addTo($scope.map);
          $scope.updateSearchControl();

          // var justRestyling = false;

          // fitBounds();

          if ($scope.containsOutliers_low || $scope.containsOutliers_high) {
            $scope.showOutlierInfoAlert = true;
          }

          $rootScope.$broadcast("updateDiagrams", $scope.currentIndicatorMetadataAndGeoJSON, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId, date, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, kommonitorDataExchangeService.isMeasureOfValueChecked, kommonitorDataExchangeService.measureOfValue, justRestyling);          
          $rootScope.$broadcast("indicatortMapDisplayFinished");

          $scope.map.invalidateSize(true);
        });

        $scope.containsNegativeValues = function (geoJSON) {

          var containsNegativeValues = false;
          $scope.datasetContainsNegativeValues = false;
          for (var i = 0; i < geoJSON.features.length; i++) {
            if (geoJSON.features[i].properties[$scope.indicatorPropertyName] < 0) {
              containsNegativeValues = true;
              break;
            }
          }

          return containsNegativeValues;
        };

        $scope.$on("changeSpatialUnit", function(event){
          kommonitorVisualStyleHelperService.dynamicBrewBreaks = null;
        });

        $scope.$on("allIndicatorPropertiesForCurrentSpatialUnitAndTime setup begin", function (event) {
          $scope.updateManualMOVBreaksFromDefaultManualBreaks();
          $scope.$broadcast("restyleCurrentLayer", false);
        });

        $scope.$on("restyleCurrentLayer", function (event, skipDiagramRefresh) {

          // var transparency = document.getElementById("indicatorTransparencyInput").value;
          // var opacity = 1 - transparency;
          //
          // kommonitorVisualStyleHelperService.setOpacity(opacity);

          refreshFilteredStyle();
          refreshOutliersStyle();
          refreshNoDataStyle();

          $scope.defaultBrew = undefined;
          $scope.gtMeasureOfValueBrew = undefined;
          $scope.ltMeasureOfValueBrew = undefined;
          $scope.manualBrew = undefined;

          $scope.setClassifyZeroForClassifyMethod();

          var style;
          if ($scope.currentIndicatorLayer) {

            $scope.currentIndicatorMetadataAndGeoJSON = markOutliers($scope.currentIndicatorMetadataAndGeoJSON, $scope.indicatorPropertyName);
            $scope.currentGeoJSONOfCurrentLayer = $scope.currentIndicatorMetadataAndGeoJSON.geoJSON;

            $scope.currentIndicatorContainsZeroValues = false;

            for (var i = 0; i < $scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features.length; i++) {
              var containsZero = false;
              var containsNoData = false;
              if (kommonitorDataExchangeService.getIndicatorValue_asNumber($scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName]) == 0) {
                $scope.currentIndicatorContainsZeroValues = true;
                containsZero = true;
              };

              if (kommonitorDataExchangeService.indicatorValueIsNoData($scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName])) {
                $scope.currentIndicatorContainsNoDataValues = true;
                containsNoData = true;
              };

              if (containsZero && containsNoData) {
                break;
              }
            }

            $scope.checkAvailabilityOfRegionalDefault($scope.currentIndicatorMetadataAndGeoJSON);

            if (kommonitorDataExchangeService.isMeasureOfValueChecked) {
              var measureOfValueBrewArray = kommonitorVisualStyleHelperService.setupMeasureOfValueBrew(
                $scope.currentGeoJSONOfCurrentLayer, 
                $scope.indicatorPropertyName, 
                defaultColorBrewerPaletteForGtMovValues, 
                defaultColorBrewerPaletteForLtMovValues, 
                kommonitorVisualStyleHelperService.classifyMethod, 
                kommonitorDataExchangeService.measureOfValue,
                kommonitorVisualStyleHelperService.manualMOVBreaks,
                kommonitorVisualStyleHelperService.regionalDefaultMOVBreaks,
                kommonitorVisualStyleHelperService.numClasses
              );
              $scope.gtMeasureOfValueBrew = measureOfValueBrewArray[0];
              $scope.ltMeasureOfValueBrew = measureOfValueBrewArray[1];

              if(kommonitorVisualStyleHelperService.classifyMethod == 'manual') {
                $scope.updateDefaultManualBreaksFromMOVManualBreaks();
              }

              $scope.currentIndicatorLayer.eachLayer(function (layer) {
                if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                  layer.setStyle($scope.filteredStyle);
                }
                else {
                  style = kommonitorVisualStyleHelperService.styleMeasureOfValue(layer.feature, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, true);

                  layer.setStyle(style);
                }

              });

              // $scope.makeMeasureOfValueLegend();
            }
            else {

              if ($scope.indicatorTypeOfCurrentLayer.includes('DYNAMIC') || $scope.datasetContainsNegativeValues) {
                var dynamicIndicatorBrewArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew(
                  $scope.currentIndicatorMetadataAndGeoJSON.geoJSON, 
                  $scope.indicatorPropertyName, 
                  defaultColorBrewerPaletteForBalanceIncreasingValues, 
                  defaultColorBrewerPaletteForBalanceDecreasingValues, 
                  kommonitorVisualStyleHelperService.classifyMethod,
                  kommonitorVisualStyleHelperService.numClasses,
                  kommonitorVisualStyleHelperService.dynamicBrewBreaks);
                $scope.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
                $scope.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];

                if (kommonitorVisualStyleHelperService.classifyMethod == "regional_default") {
                  $scope.applyRegionalDefaultClassification($scope.currentIndicatorMetadataAndGeoJSON);
                }

                $scope.currentIndicatorLayer.eachLayer(function (layer) {
                  if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                    layer.setStyle($scope.filteredStyle);
                  }
                  else {
                    style = kommonitorVisualStyleHelperService.styleDynamicIndicator(layer.feature, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, true);

                    layer.setStyle(style);
                  }

                });
                // $scope.makeDynamicIndicatorLegend();
              }
              else {
                $scope.datasetContainsNegativeValues = $scope.containsNegativeValues($scope.currentGeoJSONOfCurrentLayer);
                if ($scope.datasetContainsNegativeValues) {
                  var dynamicIndicatorBrewArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew(
                    $scope.currentIndicatorMetadataAndGeoJSON.geoJSON, 
                    $scope.indicatorPropertyName, 
                    defaultColorBrewerPaletteForBalanceIncreasingValues, 
                    defaultColorBrewerPaletteForBalanceDecreasingValues, 
                    kommonitorVisualStyleHelperService.classifyMethod,
                    kommonitorVisualStyleHelperService.numClasses,
                    kommonitorVisualStyleHelperService.dynamicBrewBreaks);
                  $scope.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
                  $scope.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
                }
                else {
                  $scope.defaultBrew = kommonitorVisualStyleHelperService.setupDefaultBrew(
                    $scope.currentGeoJSONOfCurrentLayer, 
                    $scope.indicatorPropertyName, 
                    kommonitorVisualStyleHelperService.numClasses, 
                    $scope.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, 
                    kommonitorVisualStyleHelperService.classifyMethod);
                }

                if (kommonitorVisualStyleHelperService.classifyMethod == "regional_default") {
                  $scope.applyRegionalDefaultClassification($scope.currentIndicatorMetadataAndGeoJSON);
                }
                else if(kommonitorVisualStyleHelperService.classifyMethod == 'manual') {
                  $scope.manualBrew = kommonitorVisualStyleHelperService.setupManualBrew(
                    kommonitorVisualStyleHelperService.numClasses, 
                    $scope.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, 
                    kommonitorVisualStyleHelperService.manualBrew.breaks);
                  
                  kommonitorVisualStyleHelperService.manualBrew = $scope.manualBrew;
                }

                $scope.currentIndicatorLayer.eachLayer(function (layer) {
                  let style;
                  if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                    style = $scope.filteredStyle;
                  }
                  else {
                    if (kommonitorVisualStyleHelperService.classifyMethod == 'manual') {
                      style = kommonitorVisualStyleHelperService.styleDefault(layer.feature, $scope.manualBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, $scope.datasetContainsNegativeValues, true);
                    }
                    else {
                      style = kommonitorVisualStyleHelperService.styleDefault(layer.feature, $scope.defaultBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, $scope.datasetContainsNegativeValues, true);
                    }
                  }
                  layer.setStyle(style);
                });

                $scope.updateManualMOVBreaksFromDefaultManualBreaks();
                // $scope.makeDefaultLegend(kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping, $scope.datasetContainsNegativeValues);
              }
            }

            if(kommonitorVisualStyleHelperService.classifyMethod == "regional_default" 
              && kommonitorDataExchangeService.isMeasureOfValueChecked) {
              if(kommonitorVisualStyleHelperService.regionalDefaultBreaks.length == 0) {
                $scope.defaultBrew = kommonitorVisualStyleHelperService.setupDefaultBrew(
                  $scope.currentGeoJSONOfCurrentLayer, 
                  $scope.indicatorPropertyName, 
                  kommonitorVisualStyleHelperService.numClasses, 
                  $scope.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, 
                  kommonitorVisualStyleHelperService.classifyMethod);
                $scope.applyRegionalDefaultClassification($scope.currentIndicatorMetadataAndGeoJSON);
              }
              kommonitorVisualStyleHelperService.regionalDefaultMOVBreaks = $scope.calcMOVBreaks(
                kommonitorVisualStyleHelperService.regionalDefaultBreaks,
                kommonitorDataExchangeService.measureOfValue
              )
              var measureOfValueBrewArray = kommonitorVisualStyleHelperService.setupMeasureOfValueBrew(
                $scope.currentGeoJSONOfCurrentLayer, 
                $scope.indicatorPropertyName, 
                defaultColorBrewerPaletteForGtMovValues, 
                defaultColorBrewerPaletteForLtMovValues, 
                kommonitorVisualStyleHelperService.classifyMethod, 
                kommonitorDataExchangeService.measureOfValue,
                kommonitorVisualStyleHelperService.manualMOVBreaks,
                kommonitorVisualStyleHelperService.regionalDefaultMOVBreaks,
                kommonitorVisualStyleHelperService.numClasses
              );
              $scope.gtMeasureOfValueBrew = measureOfValueBrewArray[0];
              $scope.ltMeasureOfValueBrew = measureOfValueBrewArray[1];

              $scope.currentIndicatorLayer.eachLayer(function (layer) {
                if (kommonitorFilterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                  layer.setStyle($scope.filteredStyle);
                }
                else {
                  style = kommonitorVisualStyleHelperService.styleMeasureOfValue(layer.feature, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.propertyName, $scope.useTransparencyOnIndicator, true);

                  layer.setStyle(style);
                }

              });
            }

            $rootScope.$broadcast("updateLegendDisplay", $scope.currentIndicatorContainsZeroValues, $scope.datasetContainsNegativeValues, $scope.currentIndicatorContainsNoDataValues, $scope.containsOutliers_high, $scope.containsOutliers_low, $scope.outliers_low, $scope.outliers_high, kommonitorDataExchangeService.selectedDate);

            if (!skipDiagramRefresh) {
              var justRestyling = true;

              if (kommonitorVisualStyleHelperService.classifyMethod == 'manual') {
                $rootScope.$broadcast("updateDiagrams", $scope.currentIndicatorMetadataAndGeoJSON, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId, $scope.date, $scope.manualBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, kommonitorDataExchangeService.isMeasureOfValueChecked, kommonitorDataExchangeService.measureOfValue, justRestyling);
              }
              else {
                $rootScope.$broadcast("updateDiagrams", $scope.currentIndicatorMetadataAndGeoJSON, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId, $scope.date, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, kommonitorDataExchangeService.isMeasureOfValueChecked, kommonitorDataExchangeService.measureOfValue, justRestyling);
              }
              
            }

            //ensure that highlighted feature remain highlighted
            preserveHighlightedFeatures();
          }

          $scope.map.invalidateSize(true);

        });

        $scope.updateDefaultManualBreaksFromMOVManualBreaks = function (){
          let ltBreaks = [...kommonitorVisualStyleHelperService.manualMOVBreaks[0]];
          let gtBreaks = [...kommonitorVisualStyleHelperService.manualMOVBreaks[1]];

          ltBreaks.shift()
          gtBreaks.pop();

          if ($scope.indicatorTypeOfCurrentLayer.includes('DYNAMIC')
            || $scope.datasetContainsNegativeValues) {
            let decreaseBreaks = [];
            let increaseBreaks = [];
            gtBreaks.forEach((br) => {
              if (br < 0) {
                decreaseBreaks.push(br);
              }
              else {
                increaseBreaks.push(br);
              }
            });
            ltBreaks.forEach((br) => {
              if (br < 0) {
                decreaseBreaks.push(br);
              }
              else {
                increaseBreaks.push(br);
              }
            });
            kommonitorVisualStyleHelperService.dynamicBrewBreaks = [[...increaseBreaks], [...decreaseBreaks]];
          }

          kommonitorVisualStyleHelperService.manualBrew.breaks = [...gtBreaks, ...ltBreaks];
        };

        $scope.updateManualMOVBreaksFromDefaultManualBreaks = function () {
          let gtBreaks = [];
          let ltBreaks = [];
          let breaks = [];

          if ($scope.indicatorTypeOfCurrentLayer.includes('DYNAMIC') || $scope.datasetContainsNegativeValues) {
            let decreaseBreaks = $scope.dynamicDecreaseBrew ? $scope.dynamicDecreaseBrew.breaks : [];
            let increaseBreaks = $scope.dynamicIncreaseBrew ? $scope.dynamicIncreaseBrew.breaks : [];
            breaks = [...decreaseBreaks, ...increaseBreaks]
          }
          else {
            breaks = kommonitorVisualStyleHelperService.manualBrew ? kommonitorVisualStyleHelperService.manualBrew.breaks : [];
          }
          breaks.forEach((br) => {
            if (br < kommonitorDataExchangeService.measureOfValue) {
              gtBreaks.push(br);
            }
            else {
              ltBreaks.push(br);
            }
          });
          gtBreaks.push(kommonitorDataExchangeService.measureOfValue);
          ltBreaks.unshift(kommonitorDataExchangeService.measureOfValue);
          kommonitorVisualStyleHelperService.manualMOVBreaks = [];
          kommonitorVisualStyleHelperService.manualMOVBreaks[0] = ltBreaks;
          kommonitorVisualStyleHelperService.manualMOVBreaks[1] = gtBreaks;
        }

        $scope.$on("highlightFeatureOnMap", function (event, spatialFeatureName) {

          // console.log("highlight feature on map for featureName " + spatialFeatureName);

          if(!spatialFeatureName){
            return;
          }
          var done = false;

          $scope.map.eachLayer(function (layer) {
            if (!done && layer.feature) {
              if (layer.feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] == spatialFeatureName) {
                highlightFeatureForLayer(layer);
                done = true;
              }
            }

          });

        });

        $scope.$on("unhighlightFeatureOnMap", function (event, spatialFeatureName) {
          if(!spatialFeatureName){
            return;
          }

          // console.log("unhighlight feature on map for featureName " + spatialFeatureName);

          var done = false;

          $scope.map.eachLayer(function (layer) {
            if (!done && layer.feature) {
              if (layer.feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] == spatialFeatureName) {
                resetHighlightForLayer(layer);
                done = true;
              }
            }

          });

        });

        $scope.$on("switchHighlightFeatureOnMap", function (event, spatialFeatureName) {
          if(!spatialFeatureName){
            return;
          }

          // console.log("switch highlight feature on map for featureName " + spatialFeatureName);

          var done = false;

          $scope.map.eachLayer(function (layer) {
            if (!done && layer.feature) {
              if (layer.feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] == spatialFeatureName) {
                switchHighlightFeature(layer);
                done = true;
              }
            }

          });

        });

        $scope.$on("unselectAllFeatures", function (event) {

          kommonitorFilterHelperService.clearSelectedFeatures();
          $rootScope.$broadcast("restyleCurrentLayer", false);
        });

        $scope.$on("removeAllDrawnPoints", function (event) {

          if ($scope.drawnPointFeatures) {
            $scope.drawnPointFeatures.clearLayers();
            $rootScope.$broadcast("onUpdateDrawnPointFeatures");
          }
        });

        $scope.$on("enablePointDrawTool", function (event) {

          // FeatureGroup is to store editable layers
          if (!$scope.drawnPointFeatures) {
            $scope.drawnPointFeatures = new L.FeatureGroup();
          }

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

          $scope.map.addLayer($scope.drawnPointFeatures);
          $scope.drawPointControl = new L.Control.Draw({
            edit: {
              featureGroup: $scope.drawnPointFeatures
            },
            draw: {
              polyline: false,
              polygon: false,
              rectangle: false,
              circle: false,
              circlemarker: false
            },
            position: 'bottomleft'

          });

          $scope.map.addControl($scope.drawPointControl);

          $scope.map.on(L.Draw.Event.CREATED, function (event) {
            var layer = event.layer;

            $scope.drawnPointFeatures.addLayer(layer);

            $rootScope.$broadcast("onUpdateDrawnPointFeatures", $scope.drawnPointFeatures);
          });

          $scope.map.on(L.Draw.Event.EDITED, function (event) {

            $rootScope.$broadcast("onUpdateDrawnPointFeatures", $scope.drawnPointFeatures);
          });

          $scope.map.on(L.Draw.Event.DELETED, function (event) {

            $rootScope.$broadcast("onUpdateDrawnPointFeatures", $scope.drawnPointFeatures);
          });

        });

        $scope.$on("disablePointDrawTool", function (event) {

          try {
            $scope.drawPointControl = undefined;
            $scope.map.removeLayer($scope.drawnPointFeatures);
            $scope.map.removeControl($scope.drawPointControl);            
          }
          catch (error) {
            // kommonitorDataExchangeService.displayMapApplicationError(error);
          }

        });

        $scope.$on("zoomToGeoresourceLayer", async function (event, georesourceMetadata) {

          let layerName = georesourceMetadata.datasetName;

          let layerGroupName = undefined;

          if (georesourceMetadata.isPOI){
            layerGroupName = poiLayerGroupName;
          }
          else if(georesourceMetadata.isLOI){
            layerGroupName = loiLayerGroupName;
          }
          else if(georesourceMetadata.isAOI){
            layerGroupName = aoiLayerGroupName;
          } 

          $scope.layerControl._layers.forEach(function (layer) {
            if (layerGroupName && layer.group.name === layerGroupName && layer.name.includes(layerName + "_")) {
              $scope.map.fitBounds(layer.layer.getBounds());
            }
            else if (layer.name.includes(layerName + "_")){
              $scope.map.fitBounds(layer.layer.getBounds());
            }
          });
        });

        $scope.$on("removeReachabilityScenarioFromMainMap", function (event, reachabilityScenario){
          if ($scope.markerLayer) {
            $scope.layerControl.removeLayer($scope.markerLayer);
            $scope.map.removeLayer($scope.markerLayer);
          }
          if ($scope.isochroneLayer) {
            $scope.layerControl.removeLayer($scope.isochroneLayer);
            $scope.map.removeLayer($scope.isochroneLayer);
          }

          kommonitorDataExchangeService.reachabilityScenarioOnMainMap = false;
        });

        $scope.$on("replaceReachabilityScenarioOnMainMap", function (event, reachabilityScenario){

          if ($scope.markerLayer) {
            $scope.layerControl.removeLayer($scope.markerLayer);
            $scope.map.removeLayer($scope.markerLayer);
          }
          if ($scope.isochroneLayer) {
            $scope.layerControl.removeLayer($scope.isochroneLayer);
            $scope.map.removeLayer($scope.isochroneLayer);
          }

          let poiDataset = reachabilityScenario.reachabilitySettings.selectedStartPointLayer;
          let locationsArray = [];

          poiDataset.geoJSON.features.forEach(function (feature) {
						locationsArray.push(feature.geometry.coordinates);						
					});
          
          $scope.markerLayer = kommonitorReachabilityMapHelperService.makeIsochroneMarkerLayer(locationsArray);

          kommonitorDataExchangeService.reachabilityScenarioOnMainMap = true;
          
          $scope.isochroneLayer = kommonitorReachabilityMapHelperService
          .makeIsochroneLayer(            
            reachabilityScenario.reachabilitySettings.selectedStartPointLayer.datasetName,
            reachabilityScenario.isochrones_dissolved,
            reachabilityScenario.reachabilitySettings.transitMode,
            reachabilityScenario.reachabilitySettings.focus,
            reachabilityScenario.reachabilitySettings.rangeArray,
            reachabilityScenario.reachabilitySettings.useMultipleStartPoints,
            reachabilityScenario.reachabilitySettings.dissolveIsochrones);

            $scope.layerControl.addOverlay($scope.markerLayer, "Startpunkte der Isochronenberechnung - " + poiDataset.datasetName, reachabilityLayerGroupName);
            $scope.layerControl.addOverlay($scope.isochroneLayer, "Erreichbarkeits-Isochronen_" + reachabilityScenario.reachabilitySettings.transitMode + "_" + poiDataset.datasetName, reachabilityLayerGroupName);
            
            $scope.markerLayer.addTo($scope.map);
            $scope.isochroneLayer.addTo($scope.map);

            $scope.map.invalidateSize(true);
            $scope.map.fitBounds($scope.isochroneLayer.getBounds()); 
        });
       
      
      }
    ]
  });
