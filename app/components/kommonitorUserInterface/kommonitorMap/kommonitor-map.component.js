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
                '__env',
                function MapController($rootScope, $http, $scope, $timeout, kommonitorMapService, kommonitorDataExchangeService, __env) {

                    const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
                    const numberOfDecimals = __env.numberOfDecimals;

                    this.kommonitorMapServiceInstance = kommonitorMapService;
					          this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
                    $scope.inputLayerCounter = 0;

                    $scope.latCenter = __env.initialLatitude;
                    $scope.lonCenter = __env.initialLongitude;
                    $scope.zoomLevel = __env.initialZoomLevel;

                    $scope.loadingData = true;

                    $scope.drawnItems = new L.FeatureGroup();
                    $scope.drawControl;

                    $scope.allDrawingToolsEnabled = false;

                    // central map object
              			$scope.map;
                    $scope.scaleBar;
                    $scope.layerControl;
                    $scope.overlays = new Array();
                    $scope.baseMaps = new Array();
                    $scope.baseMapLayers = new L.LayerGroup();
                    const spatialUnitLayerGroupName = "Raumeinheiten";
                    const georesourceLayerGroupName = "Georessourcen";
                    const indicatorLayerGroupName = "Indikatoren";

                    // create classyBrew object
                    $scope.defaultBrew = new classyBrew();
                    $scope.gtMeasureOfValueBrew = new classyBrew();
                    $scope.ltMeasureOfValueBrew = new classyBrew();

                    $scope.currentIndicatorMetadataAndGeoJSON;
                    $scope.currentIndicatorLayerOfCurrentLayer;
                    $scope.currentIndicatorContainsZeroValues = false;
                    $scope.indicatorTypeOfCurrentLayer;
                    $scope.defaultColorForZeroValues = __env.defaultColorForZeroValues;

                    $scope.customIndicatorPropertyName;
                    $scope.customIndicatorName;
                    $scope.customIndicatorUnit;

                    $scope.currentCustomIndicatorLayerOfCurrentLayer;
                    $scope.customPropertyName;

                    $scope.currentCustomIndicatorLayer;

              			this.initializeMap = function() {

                      // initialize map referring to div element with id="map"


                      // create OSM tile layer with correct attribution
                      var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                      var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
                      var osm = new L.TileLayer(osmUrl, {minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel, attribution: osmAttrib});
                      osm.StyledLayerControl = {
                    		removable : false,
                    		visible : false
                    	};

                      var osm_blackWhite = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {minZoom: 1, maxZoom: 19, attribution: osmAttrib});
                      osm_blackWhite.StyledLayerControl = {
                    		removable : false,
                    		visible : true
                    	};

                      var wmsLayerRVR = L.tileLayer.wms('https://geodaten.metropoleruhr.de/spw2?', {
                          layers: 'stadtplan_rvr'
                      });
                      wmsLayerRVR.StyledLayerControl = {
                    		removable : false,
                    		visible : false
                    	};

                      osm_blackWhite.addTo($scope.baseMapLayers);
                      osm.addTo($scope.baseMapLayers);
                      wmsLayerRVR.addTo($scope.baseMapLayers);

                      // $scope.map = L.map('map').setView([51.4386432, 7.0115552], 12);
                      $scope.map = L.map('map', {
                          center: [$scope.latCenter, $scope.lonCenter],
                          zoom: $scope.zoomLevel,
                          layers: [osm_blackWhite]
                      });

                      var osmBaseMapGroup = {};
                      osmBaseMapGroup.groupName = "Basiskarten";
                      osmBaseMapGroup.expanded = true;
                      osmBaseMapGroup.layers = {};
                      osmBaseMapGroup.layers["RVR Stadtplan"] = wmsLayerRVR;
                      osmBaseMapGroup.layers["OpenStreetMap - Graustufen"] = osm_blackWhite;
                      osmBaseMapGroup.layers["OpenStreetMap"] = osm;

                      $scope.baseMaps.push(osmBaseMapGroup);

                      // overlays
                      var overlays = [
                  					 {
                  						groupName : spatialUnitLayerGroupName,
                  						expanded  : true,
                  						layers    : {
                  						}
                  					 }, {
                  						groupName : georesourceLayerGroupName,
                  						expanded  : true,
                  						layers    : {
                  						}
                  					 }, {
                  						groupName : indicatorLayerGroupName,
                              expanded  : true,
                  						layers    : {
                  						}
                  					 }
                  	];

                      var options = {
                    		container_width 	: "300px",
                    		container_maxHeight : "350px",
                    		group_maxHeight     : "80px",
                    		exclusive       	: false
                    	};

                      $scope.layerControl = L.Control.styledLayerControl($scope.baseMaps, $scope.overlays, options);
	                    $scope.map.addControl($scope.layerControl);

                      $scope.scaleBar = L.control.scale();
                      $scope.scaleBar.addTo($scope.map);

                      $scope.loadingData = false;

              			}

                    $scope.$on("showLoadingIconOnMap", function (event) {
                      console.log("Show loading icon on map");
                      $scope.loadingData = true;
                    });

                    $scope.$on("hideLoadingIconOnMap", function (event) {
                      console.log("Hide loading icon on map");
                      $scope.loadingData = false;
                    });

                    $scope.makeInfoControl = function(date){

                      if($scope.infoControl){
                        try{
                          $scope.map.removeControl($scope.infoControl);
                          $scope.infoControl = undefined;
                        }
                        catch(error){
                        }
                      }


                      $scope.infoControl = L.control({position: 'topright'});

                      $scope.infoControl.onAdd = function (map) {
                          this._div = L.DomUtil.create('div', 'info legend'); // create a div with a class "info"

                          this._div.innerHTML = '<h4>' + $scope.indicatorName + ' ' + date +'</h4><br/>';
                          // this._div.innerHTML += '<p>' + $scope.indicatorDescription + '</p>'
                          this._div.innerHTML += '<b>Beschreibung: </b> ' + $scope.indicatorDescription + '<br/>';
                          this._div.innerHTML += '<b>Datenquelle: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.datasource + '<br/>';
                          this._div.innerHTML += '<b>Kontakt: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.contact + '<br/>';
                          this._div.innerHTML += '<b>Aktualisierungszyklus: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.updateInterval + '<br/>';
                          this._div.innerHTML += '<b>letzte Aktualisierung: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.lastUpdate + '<br/><br/>';
                          this._div.innerHTML +=  '<h4>Selektiertes Feature:</h4> &uuml;ber ein Feature hovern';

                          // this.update();
                          return this._div;
                      };

                      // method that we will use to update the control based on feature properties passed
                      $scope.infoControl.update = function (props) {
                        this._div.innerHTML = '<h4>' + $scope.indicatorName + ' ' + date +'</h4><br/>';
                        // this._div.innerHTML += '<p>' + $scope.indicatorDescription + '</p>'
                        this._div.innerHTML += '<b>Beschreibung: </b> ' + $scope.indicatorDescription + '<br/>';
                        this._div.innerHTML += '<b>Datenquelle: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.datasource + '<br/>';
                        this._div.innerHTML += '<b>Kontakt: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.contact + '<br/>';
                        this._div.innerHTML += '<b>Aktualisierungszyklus: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.updateInterval + '<br/>';
                        this._div.innerHTML += '<b>letzte Aktualisierung: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.lastUpdate + '<br/><br/>';

                        this._div.innerHTML +=  (props ?
                          '<h4>Selektiertes Feature:</h4> <b>' + props.spatialUnitFeatureName + '</b> ' + +Number(props[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) + ' ' + $scope.indicatorUnit
                          : '<h4>Selektiertes Feature:</h4> &uuml;ber ein Feature hovern');
                      };

                      $scope.infoControl.addTo($scope.map);
                    }

                    $scope.makeCustomInfoControl = function(date){

                      if($scope.infoControl){
                        try{
                          $scope.map.removeControl($scope.infoControl);
                          $scope.infoControl = undefined;
                        }
                        catch(error){
                        }
                      }


                      $scope.infoControl = L.control({position: 'topright'});

                      $scope.infoControl.onAdd = function (map) {
                          this._div = L.DomUtil.create('div', 'info legend'); // create a div with a class "info"

                          this._div.innerHTML = '<h4>' + $scope.customIndicatorName + ' ' + date +'</h4>';
                          // this._div.innerHTML += '<p>' + $scope.indicatorDescription + '</p>'
                          this._div.innerHTML += '<p>' + $scope.customIndicatorDescription + '</p>';
                          this._div.innerHTML +=  '<p>&uuml;ber ein Feature hovern</p>';

                          // this.update();
                          return this._div;
                      };

                      // method that we will use to update the control based on feature properties passed
                      $scope.infoControl.update = function (props) {
                        this._div.innerHTML = '<h4>' + $scope.customIndicatorName + ' ' + date +'</h4>';
                        this._div.innerHTML += '<p>' + $scope.customIndicatorDescription + '</p>';
                        this._div.innerHTML +=  (props ?
                          '<b>' + props.spatialUnitFeatureName + '</b><br />' + props[$scope.customIndicatorPropertyName] + ' ' + $scope.customIndicatorUnit
                          : '&uuml;ber ein Feature hovern');
                      };

                      $scope.infoControl.addTo($scope.map);
                    }

                    $scope.makeDefaultLegend = function(defaultClassificationMapping){

                      if($scope.legendControl){
                        try{
                          $scope.map.removeControl($scope.legendControl);
                          $scope.legendControl = undefined;
                        }
                        catch(error){
                        }
                      }

                      $scope.legendControl = L.control({position: 'topright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'info legend');
                            labels = $scope.defaultBrew.getBreaks();
                            colors = $scope.defaultBrew.getColors();

                        $scope.div.innerHTML = "";

                        // loop through our density intervals and generate a label with a colored square for each interval
                        // for (var i = 0; i < labels.length; i++) {
                        //     $scope.div.innerHTML +=
                        //         '<i style="background:' + $scope.defaultBrew.getColorInRange(labels[i] + 1) + '"></i> ' +
                        //         labels[i] + (labels[i + 1] ? ' &mdash; ' + labels[i + 1] + '<br>' : '+');
                        // }

                        $scope.div.innerHTML += "<label>Status-Indikator</label><br/><em>Darstellung der Indikatorenwerte zum gew&auml;hlten Zeitpunkt</em><br/><br/>";
                        $scope.div.innerHTML += "<label>Einheit: </label> " + $scope.indicatorUnit + "<br/><br/>";

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '"></i> ' +
                              "0" + '<br>';
                        }

                        for (var i = 0; i < colors.length; i++) {
                            $scope.div.innerHTML +=
                                '<i style="background:' + colors[i] + '"></i> ' +
                                defaultClassificationMapping.items[i].defaultCustomRating + ' (' + (+labels[i].toFixed(numberOfDecimals)) + ((+labels[i + 1]) ? ' &mdash; ' + (+labels[i + 1].toFixed(numberOfDecimals)) + ') <br>' : '+');
                        }

                        return $scope.div;
                      };

                      $scope.legendControl.addTo($scope.map);

                    }

                    $scope.makeDynamicIndicatorLegend = function(){

                      if($scope.legendControl){
                        try{
                          $scope.map.removeControl($scope.legendControl);
                          $scope.legendControl = undefined;
                        }
                        catch(error){
                        }
                      }

                      $scope.legendControl = L.control({position: 'topright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'info legend');

                        $scope.div.innerHTML = "";

                        $scope.div.innerHTML += "<label>Dynamik-Indikator</label><br/><em>Darstellung der zeitlichen Entwicklung</em><br/><br/>";
                        $scope.div.innerHTML += "<label>Einheit: </label> " + $scope.indicatorUnit + "<br/><br/>";

                        // dynamic legend creation depending on number of positive and negative classes
                        if($scope.dynamicDecreaseBrew){
                          labelsDynamicDecrease = $scope.dynamicDecreaseBrew.breaks;
                          colorsDynamicDecrease = $scope.dynamicDecreaseBrew.colors;

                          $scope.div.innerHTML += "<label>Sinkende Entwicklung</label><br/>";

                            // invert color labeling as colorization of lT features is also inverted
                            for (var i = 0; i < colorsDynamicDecrease.length; i++) {
                                $scope.div.innerHTML +=
                                    '<i style="background:' + colorsDynamicDecrease[colorsDynamicDecrease.length - 1 - i] + '"></i> ' +
                                    (+labelsDynamicDecrease[i].toFixed(numberOfDecimals)) + ((+labelsDynamicDecrease[i + 1]) ? ' &mdash; ' + (+labelsDynamicDecrease[i + 1].toFixed(numberOfDecimals)) + '<br>' : ' &mdash; 0');
                            }
                          $scope.div.innerHTML += "<br/>";
                        }

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '"></i> ' +
                              "0" + '<br><br>';
                        }

                        if($scope.dynamicIncreaseBrew){
                          labelsDynamicIncrease = $scope.dynamicIncreaseBrew.breaks;
                          colorsDynamicIncrease = $scope.dynamicIncreaseBrew.colors;

                          $scope.div.innerHTML += "<label>Steigende Entwicklung</label><br/>";

                            // invert color labeling as colorization of lT features is also inverted
                            for (var i = 0; i < colorsDynamicIncrease.length; i++) {
                                $scope.div.innerHTML +=
                                    '<i style="background:' + colorsDynamicIncrease[i] + '"></i> ' +
                                    (+labelsDynamicIncrease[i].toFixed(numberOfDecimals)) + (typeof labelsDynamicIncrease[i + 1] === 'undefined' ? '' : ' &mdash; ' + (+labelsDynamicIncrease[i + 1].toFixed(numberOfDecimals)) + '<br>');
                            }
                          $scope.div.innerHTML += "<br/>";
                        }

                        return $scope.div;
                      };

                      $scope.legendControl.addTo($scope.map);

                    }

                    $scope.makeMeasureOfValueLegend = function(){

                      if($scope.legendControl){
                        try{
                          $scope.map.removeControl($scope.legendControl);
                          $scope.legendControl = undefined;
                        }
                        catch(error){
                        }
                      }

                      $scope.legendControl = L.control({position: 'topright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'info legend');

                        $scope.div.innerHTML = "";

                        $scope.div.innerHTML += "<label>Schwellwert-Klassifizierung</label><br/>";

                        $scope.div.innerHTML += "<em>aktueller Schwellwert: </em> " + kommonitorDataExchangeService.measureOfValue + " " + $scope.indicatorUnit + "<br/><br/>";

                        $scope.div.innerHTML += "<label>Einheit: </label> " + $scope.indicatorUnit + "<br/><br/>";

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '"></i> ' +
                              "0" + '<br><br>';
                        }

                        // loop through our density intervals and generate a label with a colored square for each interval
                        // for (var i = 0; i < labels.length; i++) {
                        //     $scope.div.innerHTML +=
                        //         '<i style="background:' + $scope.defaultBrew.getColorInRange(labels[i] + 1) + '"></i> ' +
                        //         labels[i] + (labels[i + 1] ? ' &mdash; ' + labels[i + 1] + '<br>' : '+');
                        // }

                        if($scope.ltMeasureOfValueBrew){
                          labelsLtMeasureOfValue = $scope.ltMeasureOfValueBrew.breaks;
                          colorsLtMeasureOfValue = $scope.ltMeasureOfValueBrew.colors;
                          $scope.div.innerHTML += "<label>Features < Schwellwert</label><br/>";

                          // var labelArray_below = ["deutlich kleiner Schwellwert", "moderat kleiner Schwellwert", "geringfügig kleiner Schwellwert"];
                          // var labelArray_upper = ["geringfügig über Schwellwert", "moderat über Schwellwert", "deutlich über Schwellwert"];

                          // invert color labeling as colorization of lT features is also inverted
                          // for (var i = 0; i < colorsLtMeasureOfValue.length; i++) {
                          //     $scope.div.innerHTML +=
                          //         '<i style="background:' + colorsLtMeasureOfValue[colorsLtMeasureOfValue.length - 1 - i] + '"></i> ' +
                          //         //(+labelsLtMeasureOfValue[i].toFixed(4)) + ((+labelsLtMeasureOfValue[i + 1].toFixed(4)) ? ' &mdash; ' + (+labelsLtMeasureOfValue[i + 1].toFixed(4)) + '<br>' : '+');
                          //         labelArray_below[i] + ' (' + (+labelsLtMeasureOfValue[i].toFixed(numberOfDecimals)) + ((+labelsLtMeasureOfValue[i + 1]) ? ' &mdash; ' + (+labelsLtMeasureOfValue[i + 1].toFixed(numberOfDecimals)) + ') <br>' : '+');
                          // }
                          for (var i = 0; i < colorsLtMeasureOfValue.length; i++) {
                              $scope.div.innerHTML +=
                                  '<i style="background:' + colorsLtMeasureOfValue[colorsLtMeasureOfValue.length - 1 -i] + '"></i> ' +
                                  (+labelsLtMeasureOfValue[i].toFixed(numberOfDecimals)) + (typeof labelsLtMeasureOfValue[i + 1] === 'undefined' ? '' : ' &mdash; ' + (+labelsLtMeasureOfValue[i + 1].toFixed(numberOfDecimals)) + '<br>');
                          }

                          $scope.div.innerHTML += "<br/>";
                        }

                        if($scope.gtMeasureOfValueBrew){
                          labelsGtMeasureOfValue = $scope.gtMeasureOfValueBrew.breaks;
                          colorsGtMeasureOfValue = $scope.gtMeasureOfValueBrew.colors;

                          $scope.div.innerHTML += "<label>Features >= Schwellwert</label><br/>";

                          // for (var i = 0; i < colorsGtMeasureOfValue.length; i++) {
                          //     $scope.div.innerHTML +=
                          //         '<i style="background:' + colorsGtMeasureOfValue[i] + '"></i> ' +
                          //         labelArray_upper[i] + ' (' + (+labelsGtMeasureOfValue[i].toFixed(numberOfDecimals)) + ((+labelsGtMeasureOfValue[i + 1]) ? ' &mdash; ' + (+labelsGtMeasureOfValue[i + 1].toFixed(numberOfDecimals)) + ') <br>' : '+');
                          // }
                          for (var i = 0; i < colorsGtMeasureOfValue.length; i++) {
                              $scope.div.innerHTML +=
                                  '<i style="background:' + colorsGtMeasureOfValue[i] + '"></i> ' +
                                  (+labelsGtMeasureOfValue[i].toFixed(numberOfDecimals)) + (typeof labelsGtMeasureOfValue[i + 1] === 'undefined' ? '' : ' &mdash; ' + (+labelsGtMeasureOfValue[i + 1].toFixed(numberOfDecimals)) + '<br>');
                          }
                        }

                        return $scope.div;
                      };

                      $scope.legendControl.addTo($scope.map);

                    }

                    /**
                     * binds the popup of a clicked output
                     * to layer.feature.properties.popupContent
                     */
                    function onEachFeatureSpatialUnit(feature, layer) {
                        // does this feature have a property named popupContent?
                        layer.on({
                            click: function () {

                                var popupContent = layer.feature.properties.spatialUnitFeatureName;

                                if (popupContent)
                                    layer.bindPopup("SpatialUnitFeatureName: " + popupContent);
                            }
                        })
                    };

                    /**
                     * binds the popup of a clicked output
                     * to layer.feature.properties.popupContent
                     */
                    function onEachFeatureGeoresource(feature, layer) {
                        // does this feature have a property named popupContent?
                        layer.on({
                            click: function () {

                                 var popupContent = layer.feature.properties;
                                 // var popupContent = "TestValue";

                                if (popupContent)
                                    layer.bindPopup("Georesource: " + JSON.stringify(popupContent));
                            }
                        })
                    };

                    /**
                     * binds the popup of a clicked output
                     * to layer.feature.properties.popupContent
                     */
                    function onEachFeatureIndicator(feature, layer) {
                        // does this feature have a property named popupContent?
                        layer.on({
                            mouseover: highlightFeature,
                            mouseout: resetHighlight,
                            click: function () {
                              switchHighlightFeature(layer);
                            }
                        })
                    };



                    function switchHighlightFeature(layer){
                      // add or remove feature within a list of "clicked features"
                      // those shall be treated specially, i.e. keep being highlighted
                      if(! kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                        kommonitorDataExchangeService.clickedIndicatorFeatureNames.push(layer.feature.properties.spatialUnitFeatureName);
                        highlightClickedFeature(layer);
                      }

                      else{
                        //remove from array
                        var index = kommonitorDataExchangeService.clickedIndicatorFeatureNames.indexOf(layer.feature.properties.spatialUnitFeatureName);
                        kommonitorDataExchangeService.clickedIndicatorFeatureNames.splice(index, 1);
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
                        })
                    };


                    $scope.$on("addSpatialUnitAsGeopackage", function (event) {

                                  console.log('addSpatialUnitAsGeopackage was called');

                                  var layer = L.geoPackageFeatureLayer([], {
                                      geoPackageUrl: './test1234.gpkg',
                                      layerName: 'test1234',
                                      style: function (feature) {
                                        return {
                                          color: "#F00",
                                          weight: 2,
                                          opacity: 1
                                        };
                                      },
                                      onEachFeature: onEachFeatureSpatialUnit
                                  });

                                  layer.StyledLayerControl = {
                                		removable : true,
                                		visible : true
                                	};

                                  $scope.layerControl.addOverlay( layer, "GeoPackage", {groupName : spatialUnitLayerGroupName} );


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
                                          weight: 2,
                                          opacity: 1
                                        };
                                      },
                                      onEachFeature: onEachFeatureSpatialUnit
                                  });

                                  layer.StyledLayerControl = {
                                		removable : true,
                                		visible : true
                                	};

                                  $scope.layerControl.addOverlay( layer, spatialUnitMetadataAndGeoJSON.spatialUnitLevel + "_" + date, {groupName : spatialUnitLayerGroupName} );

                              });

                              $scope.$on("addGeoresourceAsGeoJSON", function (event, georesourceMetadataAndGeoJSON, date) {
                                console.log('addGeoresourceAsGeoJSON was called');

                                var layer = L.geoJSON(georesourceMetadataAndGeoJSON.geoJSON, {
                                    style: function (feature) {
                                      return {
                                        color: "red",
                                        weight: 2,
                                        opacity: 1
                                      };
                                    },
                                    onEachFeature: onEachFeatureGeoresource
                                });

                                layer.StyledLayerControl = {
                                  removable : true,
                                  visible : true
                                };

                                $scope.layerControl.addOverlay( layer, georesourceMetadataAndGeoJSON.datasetName + "_" + date, {groupName : georesourceLayerGroupName} );


                                            //
                                            // if ($scope.layers.overlays[georesourceMetadataAndGeoJSON.datasetName]) {
                                            //     delete $scope.layers.overlays[georesourceMetadataAndGeoJSON.datasetName];
                                            //
                                            //     console.log($scope.layers.overlays);
                                            // }
                                            //
                                            // var geoJSONLayer = {
                                            //     name: georesourceMetadataAndGeoJSON.datasetName,
                                            //     type: "geoJSONShape",
                                            //     data: georesourceMetadataAndGeoJSON.geoJSON,
                                            //     visible: true,
                                            //     layerOptions: {
                                            //         style: {
                                            //             color: '#1B4F72',
                                            //             fillColor: 'red',
                                            //             weight: 2.0,
                                            //             opacity: 0.6,
                                            //             fillOpacity: 0.2
                                            //         },
                                            //         onEachFeature: onEachFeatureGeoresource
                                            //     }
                                            // };
                                            //
                                            // $scope.layers.overlays[georesourceMetadataAndGeoJSON.datasetName] = geoJSONLayer;
                                            //
                                            // // refresh the layer!!! Otherwise display is not updated properly in case
                                            // // an existing overlay is updated!
                                            // $scope.layers.overlays[georesourceMetadataAndGeoJSON.datasetName].doRefresh = true;
                                        });

                                        var setupDefaultBrew = function(geoJSON, propertyName, numClasses, colorCode, classifyMethod){
                                          // pass values from your geojson object into an empty array
                                          // see link above to view geojson used in this example
                                          var values = [];
                                          for (var i = 0; i < geoJSON.features.length; i++){
                                              if (geoJSON.features[i].properties[propertyName] == null || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
                                                continue;
                                              values.push(geoJSON.features[i].properties[propertyName]);
                                          }

                                          // pass array to our classyBrew series
                                          $scope.defaultBrew.setSeries(values);

                                          // define number of classes
                                          $scope.defaultBrew.setNumClasses(numClasses);

                                          // set color ramp code
                                          $scope.defaultBrew.setColorCode(colorCode);

                                          // classify by passing in statistical method
                                          // i.e. equal_interval, jenks, quantile
                                          $scope.defaultBrew.classify(classifyMethod);
                                        }

                                        var setupMeasureOfValueBrew = function(geoJSON, propertyName, colorCodeForGreaterThanValues, colorCodeForLesserThanValues, classifyMethod, measureOfValue){

                                          /*
                                          * Idea: Analyse the complete geoJSON property array for each feature and make conclusion about how to build the legend

                                          e.g. if there are only positive values then display only positive values within 5 categories - same for only negative values

                                          e.g. if there are equally many positive as negative values then display both using 3 categories each

                                          e.g. if there are way more positive than negative values, then display both with 2 (negative) and 4 (positive) classes

                                          --> implement special cases (0, 1 or 2 negative/positive values --> apply colors manually)
                                          --> treat all other cases equally to measureOfValue
                                          */

                                          $scope.gtMeasureOfValueBrew = {};
                                          $scope.ltMeasureOfValueBrew = {};

                                          var greaterThanValues = [];
                                          var lesserThanValues = [];

                                          for (var i = 0; i < geoJSON.features.length; i++){
                                              if (geoJSON.features[i].properties[propertyName] == null || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
                                                continue;
                                              else if(Number(geoJSON.features[i].properties[propertyName]) >= measureOfValue)
                                                greaterThanValues.push(geoJSON.features[i].properties[propertyName]);
                                              else
                                                lesserThanValues.push(geoJSON.features[i].properties[propertyName]);
                                          }

                                          setupGtMeasureOfValueBrew(greaterThanValues, colorCodeForGreaterThanValues, classifyMethod);
                                          setupLtMeasureOfValueBrew(lesserThanValues, colorCodeForLesserThanValues, classifyMethod);
                                        }

                                        var setupGtMeasureOfValueBrew = function(greaterThanValues, colorCodeForGreaterThanValues, classifyMethod){
                                          var tempBrew = new classyBrew();
                                          if(greaterThanValues.length > 5){
                                            // pass array to our classyBrew series
                                            tempBrew.setSeries(greaterThanValues);
                                            // define number of classes
                                            tempBrew.setNumClasses(5);
                                            // set color ramp code
                                            tempBrew.setColorCode(colorCodeForGreaterThanValues);
                                            // classify by passing in statistical method
                                            // i.e. equal_interval, jenks, quantile
                                            tempBrew.classify(classifyMethod);

                                            $scope.gtMeasureOfValueBrew.colors = tempBrew.getColors();
                                            $scope.gtMeasureOfValueBrew.breaks = tempBrew.getBreaks();
                                          }
                                          else if(greaterThanValues.length === 4 || greaterThanValues.length === 5){
                                            // pass array to our classyBrew series
                                            tempBrew.setSeries(greaterThanValues);
                                            // define number of classes
                                            tempBrew.setNumClasses(3);
                                            // set color ramp code
                                            tempBrew.setColorCode(colorCodeForGreaterThanValues);
                                            // classify by passing in statistical method
                                            // i.e. equal_interval, jenks, quantile
                                            tempBrew.classify(classifyMethod);

                                            $scope.gtMeasureOfValueBrew.colors = tempBrew.getColors();
                                            $scope.gtMeasureOfValueBrew.breaks = tempBrew.getBreaks();
                                          }
                                          else if(greaterThanValues.length === 3){
                                            greaterThanValues.sort((a, b) => a - b);

                                            $scope.gtMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForGreaterThanValues]['3'];
                                            $scope.gtMeasureOfValueBrew.breaks = greaterThanValues;
                                          }
                                          else if(greaterThanValues.length === 2){
                                            greaterThanValues.sort((a, b) => a - b);

                                            $scope.gtMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForGreaterThanValues]['3'];
                                            $scope.gtMeasureOfValueBrew.breaks = greaterThanValues;

                                            $scope.gtMeasureOfValueBrew.colors.shift(); // remove first element of array
                                          }
                                          else if(greaterThanValues.length === 1){
                                            greaterThanValues.sort((a, b) => a - b);

                                            $scope.gtMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForGreaterThanValues]['3'];
                                            $scope.gtMeasureOfValueBrew.breaks = greaterThanValues;

                                            $scope.gtMeasureOfValueBrew.colors.shift(); // remove first element of array
                                            $scope.gtMeasureOfValueBrew.colors.shift(); // remove first element of array
                                          }
                                          else{
                                            // no positive values
                                            $scope.gtMeasureOfValueBrew = undefined;
                                          }
                                        }

                                        var setupLtMeasureOfValueBrew = function(lesserThanValues, colorCodeForLesserThanValues, classifyMethod){
                                          var tempBrew = new classyBrew();
                                          if(lesserThanValues.length > 5){
                                            // pass array to our classyBrew series
                                            tempBrew.setSeries(lesserThanValues);
                                            // define number of classes
                                            tempBrew.setNumClasses(5);
                                            // set color ramp code
                                            tempBrew.setColorCode(colorCodeForLesserThanValues);
                                            // classify by passing in statistical method
                                            // i.e. equal_interval, jenks, quantile
                                            tempBrew.classify(classifyMethod);

                                            $scope.ltMeasureOfValueBrew.colors = tempBrew.getColors();
                                            $scope.ltMeasureOfValueBrew.breaks = tempBrew.getBreaks();
                                          }
                                          else if(lesserThanValues.length === 4 || lesserThanValues.length === 5){
                                            // pass array to our classyBrew series
                                            tempBrew.setSeries(lesserThanValues);
                                            // define number of classes
                                            tempBrew.setNumClasses(3);
                                            // set color ramp code
                                            tempBrew.setColorCode(colorCodeForLesserThanValues);
                                            // classify by passing in statistical method
                                            // i.e. equal_interval, jenks, quantile
                                            tempBrew.classify(classifyMethod);

                                            $scope.ltMeasureOfValueBrew.colors = tempBrew.getColors();
                                            $scope.ltMeasureOfValueBrew.breaks = tempBrew.getBreaks();
                                          }
                                          else if(lesserThanValues.length === 3){
                                            lesserThanValues.sort((a, b) => a - b);

                                            $scope.ltMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForLesserThanValues]['3'];
                                            $scope.ltMeasureOfValueBrew.breaks = lesserThanValues;
                                          }
                                          else if(lesserThanValues.length === 2){
                                            lesserThanValues.sort((a, b) => a - b);

                                            $scope.ltMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForLesserThanValues]['3'];
                                            $scope.ltMeasureOfValueBrew.breaks = lesserThanValues;

                                            $scope.ltMeasureOfValueBrew.colors.shift(); // remove first element of array
                                          }
                                          else if(lesserThanValues.length === 1){
                                            lesserThanValues.sort((a, b) => a - b);

                                            $scope.ltMeasureOfValueBrew.colors = tempBrew.colorSchemes[colorCodeForLesserThanValues]['3'];
                                            $scope.ltMeasureOfValueBrew.breaks = lesserThanValues;

                                            $scope.ltMeasureOfValueBrew.colors.shift(); // remove first element of array
                                            $scope.ltMeasureOfValueBrew.colors.shift(); // remove first element of array
                                          }
                                          else{
                                            // no positive values
                                            $scope.ltMeasureOfValueBrew = undefined;
                                          }
                                        }

                                        var setupDynamicIndicatorBrew = function(geoJSON, propertyName, colorCodeForPositiveValues, colorCodeForNegativeValues, classifyMethod){

                                          /*
                                          * Idea: Analyse the complete geoJSON property array for each feature and make conclusion about how to build the legend

                                          e.g. if there are only positive values then display only positive values within 5 categories - same for only negative values

                                          e.g. if there are equally many positive as negative values then display both using 3 categories each

                                          e.g. if there are way more positive than negative values, then display both with 2 (negative) and 4 (positive) classes

                                          --> implement special cases (0, 1 or 2 negative/positive values --> apply colors manually)
                                          --> treat all other cases equally to measureOfValue
                                          */

                                          $scope.dynamicIncreaseBrew = {};
                                          $scope.dynamicDecreaseBrew = {};

                                          var positiveValues = [];
                                          var negativeValues = [];

                                          for (var i = 0; i < geoJSON.features.length; i++){
                                              if (geoJSON.features[i].properties[propertyName] == null || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
                                                continue;
                                              else if(Number(geoJSON.features[i].properties[propertyName]) > 0)
                                                positiveValues.push(geoJSON.features[i].properties[propertyName]);
                                              else
                                                negativeValues.push(geoJSON.features[i].properties[propertyName]);
                                          }

                                          setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod);
                                          setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod);
                                        }

                                        function setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod){
                                          // analyse length of value arrays

                                          var tempBrew = new classyBrew();
                                          if(positiveValues.length > 5){
                                            // pass array to our classyBrew series
                                            tempBrew.setSeries(positiveValues);
                                            // define number of classes
                                            tempBrew.setNumClasses(5);
                                            // set color ramp code
                                            tempBrew.setColorCode(colorCodeForPositiveValues);
                                            // classify by passing in statistical method
                                            // i.e. equal_interval, jenks, quantile
                                            tempBrew.classify(classifyMethod);

                                            $scope.dynamicIncreaseBrew.colors = tempBrew.getColors();
                                            $scope.dynamicIncreaseBrew.breaks = tempBrew.getBreaks();
                                          }
                                          else if(positiveValues.length === 4 || positiveValues.length === 5){
                                            // pass array to our classyBrew series
                                            tempBrew.setSeries(positiveValues);
                                            // define number of classes
                                            tempBrew.setNumClasses(3);
                                            // set color ramp code
                                            tempBrew.setColorCode(colorCodeForPositiveValues);
                                            // classify by passing in statistical method
                                            // i.e. equal_interval, jenks, quantile
                                            tempBrew.classify(classifyMethod);

                                            $scope.dynamicIncreaseBrew.colors = tempBrew.getColors();
                                            $scope.dynamicIncreaseBrew.breaks = tempBrew.getBreaks();
                                          }
                                          else if(positiveValues.length === 3){
                                            positiveValues.sort((a, b) => a - b);

                                            $scope.dynamicIncreaseBrew.colors = tempBrew.colorSchemes[colorCodeForPositiveValues]['3'];
                                            $scope.dynamicIncreaseBrew.breaks = positiveValues;
                                          }
                                          else if(positiveValues.length === 2){
                                            positiveValues.sort((a, b) => a - b);

                                            $scope.dynamicIncreaseBrew.colors = tempBrew.colorSchemes[colorCodeForPositiveValues]['3'];
                                            $scope.dynamicIncreaseBrew.breaks = positiveValues;

                                            $scope.dynamicIncreaseBrew.colors.shift(); // remove first element of array
                                          }
                                          else if(positiveValues.length === 1){
                                            positiveValues.sort((a, b) => a - b);

                                            $scope.dynamicIncreaseBrew.colors = tempBrew.colorSchemes[colorCodeForPositiveValues]['3'];
                                            $scope.dynamicIncreaseBrew.breaks = positiveValues;

                                            $scope.dynamicIncreaseBrew.colors.shift(); // remove first element of array
                                            $scope.dynamicIncreaseBrew.colors.shift(); // remove first element of array
                                          }
                                          else{
                                            // no positive values
                                            $scope.dynamicIncreaseBrew = undefined;
                                          }
                                        }

                                        function setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod){
                                          var tempBrew = new classyBrew();
                                          // analyse length of value arrays
                                          if(negativeValues.length > 5){
                                            // pass array to our classyBrew series
                                            tempBrew.setSeries(negativeValues);
                                            // define number of classes
                                            tempBrew.setNumClasses(5);
                                            // set color ramp code
                                            tempBrew.setColorCode(colorCodeForNegativeValues);
                                            // classify by passing in statistical method
                                            // i.e. equal_interval, jenks, quantile
                                            tempBrew.classify(classifyMethod);

                                            $scope.dynamicDecreaseBrew.colors = tempBrew.getColors();
                                            $scope.dynamicDecreaseBrew.breaks = tempBrew.getBreaks();
                                          }
                                          else if(negativeValues.length === 4 || negativeValues.length === 5){
                                            // pass array to our classyBrew series
                                            tempBrew.setSeries(negativeValues);
                                            // define number of classes
                                            tempBrew.setNumClasses(3);
                                            // set color ramp code
                                            tempBrew.setColorCode(colorCodeForNegativeValues);
                                            // classify by passing in statistical method
                                            // i.e. equal_interval, jenks, quantile
                                            tempBrew.classify(classifyMethod);

                                            $scope.dynamicDecreaseBrew.colors = tempBrew.getColors();
                                            $scope.dynamicDecreaseBrew.breaks = tempBrew.getBreaks();
                                          }
                                          else if(negativeValues.length === 3){

                                            negativeValues.sort((a, b) => a - b);

                                            $scope.dynamicDecreaseBrew.colors = tempBrew.colorSchemes[colorCodeForNegativeValues]['3'];
                                            $scope.dynamicDecreaseBrew.breaks = negativeValues;
                                          }
                                          else if(negativeValues.length === 2){
                                            negativeValues.sort((a, b) => a - b);

                                            $scope.dynamicDecreaseBrew.colors = tempBrew.colorSchemes[colorCodeForNegativeValues]['3'];
                                            $scope.dynamicDecreaseBrew.breaks = negativeValues;

                                            $scope.dynamicDecreaseBrew.colors.shift(); // remove first element of array
                                          }
                                          else if(negativeValues.length === 1){
                                            negativeValues.sort((a, b) => a - b);

                                            $scope.dynamicDecreaseBrew.colors = tempBrew.colorSchemes[colorCodeForNegativeValues]['3'];
                                            $scope.dynamicDecreaseBrew.breaks = negativeValues;

                                            $scope.dynamicDecreaseBrew.colors.shift(); // remove first element of array
                                            $scope.dynamicDecreaseBrew.colors.shift(); // remove first element of array
                                          }
                                          else{
                                            // no positive values
                                            $scope.dynamicDecreaseBrew = undefined;
                                          }
                                        }

                                        // style function to return
                                        // fill color based on $scope.defaultBrew.getColorInRange() method
                                        function styleDefault(feature) {

                                          var fillColor;
                                          if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                            fillColor = $scope.defaultColorForZeroValues;
                                          }
                                          else{
                                            fillColor = $scope.defaultBrew.getColorInRange(feature.properties[$scope.propertyName]);
                                          }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: 'white',
                                                dashArray: '3',
                                                fillOpacity: 0.7,
                                                fillColor: fillColor
                                            }
                                        }

                                        function styleCustomDefault(feature) {

                                          var fillColor;
                                          if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                            fillColor = $scope.defaultColorForZeroValues;
                                          }
                                          else{
                                            fillColor = $scope.defaultBrew.getColorInRange(feature.properties[$scope.propertyName]);
                                          }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: 'white',
                                                dashArray: '3',
                                                fillOpacity: 0.7,
                                                fillColor: fillColor
                                            }
                                        }

                                        function styleMeasureOfValue (feature) {

                                          if(feature.properties[$scope.indicatorPropertyName] >= kommonitorDataExchangeService.measureOfValue){
                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                            }
                                            else{
                                              for (var index=0; index < $scope.gtMeasureOfValueBrew.breaks.length; index++){
                                                if (feature.properties[$scope.propertyName] <= $scope.gtMeasureOfValueBrew.breaks[index]){
                                                  if($scope.gtMeasureOfValueBrew.colors[index]){
                                                    fillColor = $scope.gtMeasureOfValueBrew.colors[index];
                                                  }
                                                  else{
                                                    fillColor = $scope.gtMeasureOfValueBrew.colors[index-1];
                                                  }
                                                  break;
                                                }
                                              }
                                            }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: 'white',
                                                dashArray: '3',
                                                fillOpacity: 0.7,
                                                fillColor: fillColor
                                            }
                                          }
                                          else{

                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                            }
                                            else{
                                              // invert colors, so that lowest values will become strong colored!
                                              for (var index=0; index < $scope.ltMeasureOfValueBrew.breaks.length; index++){
                                                if (feature.properties[$scope.propertyName] <= $scope.ltMeasureOfValueBrew.breaks[index]){
                                                  if($scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index]){
                                                    fillColor = $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index];
                                                  }
                                                  else{
                                                    fillColor = $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index - 1];
                                                  }
                                                  break;
                                                }
                                              }
                                            }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: 'white',
                                                dashArray: '3',
                                                fillOpacity: 0.7,
                                                fillColor: fillColor
                                            }
                                          }

                                        }

                                        function styleDynamicIndicator (feature) {

                                          if(feature.properties[$scope.indicatorPropertyName] >= 0){
                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                            }
                                            else{
                                              for (var index=0; index < $scope.dynamicIncreaseBrew.breaks.length; index++){
                                                if (feature.properties[$scope.propertyName] <= $scope.dynamicIncreaseBrew.breaks[index]){
                                                  if($scope.dynamicIncreaseBrew.colors[index]){
                                                    fillColor = $scope.dynamicIncreaseBrew.colors[index];
                                                  }
                                                  else{
                                                    fillColor = $scope.dynamicIncreaseBrew.colors[index-1];
                                                  }
                                                  break;
                                                }
                                              }
                                            }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: 'white',
                                                dashArray: '3',
                                                fillOpacity: 0.7,
                                                fillColor: fillColor
                                            }
                                          }
                                          else{

                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                            }
                                            else{
                                              // invert colors, so that lowest values will become strong colored!
                                              for (var index=0; index < $scope.dynamicDecreaseBrew.breaks.length; index++){
                                                if (feature.properties[$scope.propertyName] <= $scope.dynamicDecreaseBrew.breaks[index]){
                                                  if($scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index]){
                                                    fillColor = $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index];
                                                  }
                                                  else{
                                                    fillColor = $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index - 1];
                                                  }
                                                  break;
                                                }
                                              }
                                            }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: 'white',
                                                dashArray: '3',
                                                fillOpacity: 0.7,
                                                fillColor: fillColor
                                            }
                                          }

                                        }

                                        function highlightFeature(e) {
                                            var layer = e.target;

                                            highlightFeatureForLayer(layer);

                                        }

                                        function highlightFeatureForLayer(layer) {

                                            if(kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                              highlightClickedFeature(layer);
                                              return;
                                            }

                                            layer.setStyle({
                                                weight: 5,
                                                color: '#42e5f4',
                                                dashArray: '',
                                                fillOpacity: 0.7
                                            });

                                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                                layer.bringToFront();
                                            }
                                            $scope.infoControl.update(layer.feature.properties);

                                            // update diagrams for hovered feature
                                            $rootScope.$broadcast("updateDiagramsForHoveredFeature", layer.feature.properties);

                                        }

                                        function highlightClickedFeature(layer) {

                                            layer.setStyle({
                                                weight: 6,
                                                color: '#42e5f4',
                                                dashArray: '',
                                                fillOpacity: 0.8
                                            });

                                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                                layer.bringToFront();
                                            }
                                            $scope.infoControl.update(layer.feature.properties);

                                            // update diagrams for hovered feature
                                            $rootScope.$broadcast("updateDiagramsForHoveredFeature", layer.feature.properties);

                                        }

                                        function resetHighlight(e) {
                                          var layer = e.target;
                                          resetHighlightForLayer(layer);
                                        }

                                        function resetHighlightForLayer(layer) {

                                          // only restyle feature when not in list of clicked features
                                          if(! kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                            //$scope.currentIndicatorLayer.resetStyle(layer);
                                            if(! kommonitorDataExchangeService.isMeasureOfValueChecked){
                                              //$scope.currentIndicatorLayer.resetStyle(layer);
                                              if($scope.indicatorTypeOfCurrentLayer === 'DYNAMIC'){
                                                  layer.setStyle(styleDynamicIndicator(layer.feature));
                                              }
                                              else{
                                              layer.setStyle(styleDefault(layer.feature));
                                              }
                                            }
                                            else{
                                              layer.setStyle(styleMeasureOfValue(layer.feature));
                                            }
                                          }
                                          $scope.infoControl.update();

                                            //update diagrams for unhoveredFeature
                                            $rootScope.$broadcast("updateDiagramsForUnhoveredFeature", layer.feature.properties);
                                        }

                                        function resetHighlightClickedFeature(layer) {
                                          //$scope.currentIndicatorLayer.resetStyle(layer);

                                          if(! kommonitorDataExchangeService.isMeasureOfValueChecked){
                                            //$scope.currentIndicatorLayer.resetStyle(layer);
                                            if($scope.indicatorTypeOfCurrentLayer === 'DYNAMIC'){
                                                layer.setStyle(styleDynamicIndicator(layer.feature));
                                            }
                                            else{
                                                layer.setStyle(styleDefault(layer.feature));
                                            }
                                          }
                                          else{
                                            layer.setStyle(styleMeasureOfValue(layer.feature));
                                          }
                                        }

                                        function resetHighlightCustom(e) {
                                            $scope.currentCustomIndicatorLayer.resetStyle(e.target);
                                            $scope.infoControl.update();
                                        }

                                        var wait = ms => new Promise((r, j)=>setTimeout(r, ms))

                                        $scope.$on("recenterMapContent", async function (event) {

                                          await wait(100);

                                          fitBounds();
                                        });

                                        $scope.$on("recenterMapOnHideSideBar", async function (event) {

                                          await wait(100);

                                          panToCenterOnUnactiveMenue();
                                        });

                                        $scope.$on("recenterMapOnShowSideBar", async function (event) {

                                          await wait(100);

                                          panToCenterOnActiveMenue();
                                        });

                                        function fitBounds(){
                                          if($scope.map && $scope.currentIndicatorLayer){

                                            // $scope.map.setView(L.latLng($scope.latCenter, $scope.lonCenter), $scope.zoomLevel);
                                            $scope.map.fitBounds($scope.currentIndicatorLayer.getBounds());
                                          }

                                        }

                                        function panToCenterOnActiveMenue(){
                                          if($scope.map && $scope.currentIndicatorLayer){

                                            //$scope.map.setView(L.latLng($scope.latCenter, $scope.lonCenter + 0.15), $scope.zoomLevel);
                                            // $scope.map.panTo(L.latLng($scope.latCenter, $scope.lonCenter + 0.15));
                                            $scope.map.panBy(L.point(500, 0));

                                          }
                                        }

                                        function panToCenterOnUnactiveMenue(){
                                          if($scope.map && $scope.currentIndicatorLayer){

                                            //$scope.map.setView(L.latLng($scope.latCenter, $scope.lonCenter), $scope.zoomLevel);
                                            // $scope.map.panTo(L.latLng($scope.latCenter, $scope.lonCenter));
                                            $scope.map.panBy(L.point(-500, 0));
                                          }
                                        }

                                        function zoomToFeature(e) {
                                            map.fitBounds(e.target.getBounds());
                                        }

                                                  $scope.$on("replaceIndicatorAsGeoJSON", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date) {

                                                                console.log('replaceIndicatorAsGeoJSON was called');

                                                                $scope.currentIndicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;

                                                                // empty layer of possibly selected features
                                                                kommonitorDataExchangeService.clickedIndicatorFeatureNames = [];

                                                                console.log("Remove old indicatorLayer if exists");
                                                                if($scope.currentIndicatorLayer)
                                                                  $scope.layerControl.removeLayer($scope.currentIndicatorLayer);

                                                                $scope.currentIndicatorContainsZeroValues = false;

                                                                // check if measureOfValueCheckbox is checked

                                                                $scope.date = date;

                                                                $scope.indicatorPropertyName = INDICATOR_DATE_PREFIX + date;
                                                                $scope.indicatorName = indicatorMetadataAndGeoJSON.indicatorName;
                                                                $scope.indicatorDescription = indicatorMetadataAndGeoJSON.metadata.description;
                                                                $scope.indicatorUnit = indicatorMetadataAndGeoJSON.unit;

                                                                $scope.currentIndicatorLayerOfCurrentLayer = indicatorMetadataAndGeoJSON.geoJSON;

                                                                for (var i = 0; i < indicatorMetadataAndGeoJSON.geoJSON.features.length; i++){
                                                                    if (indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName] == 0 || indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName] == "0"){
                                                                      $scope.currentIndicatorContainsZeroValues = true;
                                                                      break;
                                                                    };
                                                                }

                                                                var layer;

                                                                $scope.indicatorTypeOfCurrentLayer = indicatorMetadataAndGeoJSON.indicatorType;

                                                                if(kommonitorDataExchangeService.isMeasureOfValueChecked){
                                                                  setupMeasureOfValueBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, "YlOrBr", "Purples", "jenks", kommonitorDataExchangeService.measureOfValue);
                                                                  $scope.propertyName = INDICATOR_DATE_PREFIX + date;

                                                                  layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                      style: styleMeasureOfValue,
                                                                      onEachFeature: onEachFeatureIndicator
                                                                  });

                                                                  $scope.makeInfoControl(date);
                                                                  $scope.makeMeasureOfValueLegend();

                                                                }
                                                                else{

                                                                  if (indicatorMetadataAndGeoJSON.indicatorType === "STATUS"){
                                                                    setupDefaultBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, indicatorMetadataAndGeoJSON.defaultClassificationMapping.items.length, indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, "jenks");
                                                                    $scope.propertyName = INDICATOR_DATE_PREFIX + date;

                                                                    layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                        style: styleDefault,
                                                                        onEachFeature: onEachFeatureIndicator
                                                                    });
                                                                    $scope.makeInfoControl(date);
                                                                    $scope.makeDefaultLegend(indicatorMetadataAndGeoJSON.defaultClassificationMapping);
                                                                  }
                                                                  else if (indicatorMetadataAndGeoJSON.indicatorType === "DYNAMIC"){
                                                                    setupDynamicIndicatorBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, "PuBuGn", "YlOrRd", "jenks");
                                                                    $scope.propertyName = INDICATOR_DATE_PREFIX + date;

                                                                    layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                        style: styleDynamicIndicator,
                                                                        onEachFeature: onEachFeatureIndicator
                                                                    });
                                                                    $scope.makeInfoControl(date);
                                                                    $scope.makeDynamicIndicatorLegend();
                                                                  }


                                                                }

                                                                $scope.currentIndicatorLayer = layer;

                                                                layer.StyledLayerControl = {
                                                                  removable : true,
                                                                  visible : true
                                                                };

                                                                $scope.layerControl.addOverlay( layer, indicatorMetadataAndGeoJSON.indicatorName + "_" + spatialUnitName + "_" + date, {groupName : indicatorLayerGroupName} );

                                                                var justRestyling = false;

                                                                // fitBounds();

                                                                $rootScope.$broadcast("updateDiagrams", kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId, date, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, kommonitorDataExchangeService.isMeasureOfValueChecked, kommonitorDataExchangeService.measureOfValue, justRestyling);
                                                            });

                                                  $scope.$on("addCustomIndicatorAsGeoJSON", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date) {

                                                                console.log('addCustomIndicatorAsGeoJSON was called');

                                                                $scope.date = date;

                                                                $scope.customIndicatorPropertyName = INDICATOR_DATE_PREFIX + date;
                                                                $scope.customIndicatorName = indicatorMetadataAndGeoJSON.indicatorName;
                                                                $scope.customIndicatorUnit = indicatorMetadataAndGeoJSON.unit;
                                                                $scope.customIndicatorDescription = indicatorMetadataAndGeoJSON.metadata.description;

                                                                $scope.currentCustomIndicatorLayerOfCurrentLayer = indicatorMetadataAndGeoJSON.geoJSON;

                                                                setupDefaultBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.customIndicatorPropertyName, indicatorMetadataAndGeoJSON.defaultClassificationMapping.items.length, indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, "jenks");
                                                                $scope.customPropertyName = INDICATOR_DATE_PREFIX + date;

                                                                var layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                    style: styleCustomDefault,
                                                                    onEachFeature: onEachFeatureCustomIndicator
                                                                });

                                                                $scope.currentCustomIndicatorLayer = layer;

                                                                layer.StyledLayerControl = {
                                                                  removable : true,
                                                                  visible : true
                                                                };

                                                                $scope.layerControl.addOverlay( layer, indicatorMetadataAndGeoJSON.indicatorName + "_" + spatialUnitName + "_" + date + "_CUSTOM", {groupName : indicatorLayerGroupName} );

                                                                $scope.makeCustomInfoControl(date);
                                                                $scope.makeDefaultLegend(indicatorMetadataAndGeoJSON.defaultClassificationMapping);
                                                            });


                                                            $scope.$on("restyleCurrentLayer", function (event) {

                                                                          if($scope.currentIndicatorLayer){

                                                                            if(kommonitorDataExchangeService.isMeasureOfValueChecked){
                                                                              setupMeasureOfValueBrew($scope.currentIndicatorLayerOfCurrentLayer, $scope.indicatorPropertyName, "YlOrBr", "Purples", "jenks", kommonitorDataExchangeService.measureOfValue);
                                                                              $scope.makeMeasureOfValueLegend();
                                                                              $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                layer.setStyle(styleMeasureOfValue(layer.feature));
                                                                              });
                                                                            }
                                                                            else{

                                                                              if($scope.indicatorTypeOfCurrentLayer === 'DYNAMIC'){
                                                                                setupDynamicIndicatorBrew($scope.currentIndicatorLayerOfCurrentLayer, $scope.indicatorPropertyName, "PuBuGn", "YlOrRd", "jenks");
                                                                                $scope.makeDynamicIndicatorLegend();

                                                                                $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                  layer.setStyle(styleDynamicIndicator(layer.feature));
                                                                                });
                                                                              }
                                                                              else{
                                                                                $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                  setupDefaultBrew($scope.currentIndicatorLayerOfCurrentLayer, $scope.indicatorPropertyName, kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.items.length, kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName, "jenks");
                                                                                  $scope.makeDefaultLegend(kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping);

                                                                                  $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                    layer.setStyle(styleDefault(layer.feature));
                                                                                  });
                                                                                });
                                                                              }

                                                                            }

                                                                            var justRestyling = true;

                                                                            $rootScope.$broadcast("updateDiagrams", kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId, $scope.date, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, kommonitorDataExchangeService.isMeasureOfValueChecked, kommonitorDataExchangeService.measureOfValue, justRestyling);


                                                                            // $scope.currentIndicatorLayer.resetStyle($scope.currentIndicatorLayer);
                                                                            // $scope.currentIndicatorLayer.setStyle();
                                                                            // $scope.infoControl.update();
                                                                          }

                                                            });

                                                            $scope.$on("highlightFeatureOnMap", function (event, spatialFeatureName) {

                                            									console.log("highlight feature on map for featureName " + spatialFeatureName);

                                                              var done = false;

                                                              $scope.map.eachLayer(function(layer){
                                                                if(!done && layer.feature){
                                                                  if(layer.feature.properties.spatialUnitFeatureName === spatialFeatureName){
                                                                    highlightFeatureForLayer(layer);
                                                                    done = true;
                                                                  }
                                                                }

                                                              });

                                            								});

                                                            $scope.$on("unhighlightFeatureOnMap", function (event, spatialFeatureName) {

                                            									console.log("unhighlight feature on map for featureName " + spatialFeatureName);

                                                              var done = false;

                                                              $scope.map.eachLayer(function(layer){
                                                                if(!done && layer.feature){
                                                                  if(layer.feature.properties.spatialUnitFeatureName === spatialFeatureName){
                                                                    resetHighlightForLayer(layer);
                                                                    done = true;
                                                                  }
                                                                }

                                                              });

                                            								});

                                                            $scope.$on("switchHighlightFeatureOnMap", function (event, spatialFeatureName) {

                                            									console.log("switch highlight feature on map for featureName " + spatialFeatureName);

                                            									var done = false;

                                                              $scope.map.eachLayer(function(layer){
                                                                if(!done && layer.feature){
                                                                  if(layer.feature.properties.spatialUnitFeatureName === spatialFeatureName){
                                                                    switchHighlightFeature(layer);
                                                                    done = true;
                                                                  }
                                                                }

                                                              });

                                            								});

                                                            $scope.$on("unselectAllFeatures", function (event) {

                                                              if(kommonitorDataExchangeService.clickedIndicatorFeatureNames && kommonitorDataExchangeService.clickedIndicatorFeatureNames.length > 0){
                                                                $scope.map.eachLayer(function(layer){
                                                                  if(layer.feature){
                                                                    if(kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                                                      var index = kommonitorDataExchangeService.clickedIndicatorFeatureNames.indexOf(layer.feature.properties.spatialUnitFeatureName);
                                                                      kommonitorDataExchangeService.clickedIndicatorFeatureNames.splice(index, 1);
                                                                      resetHighlightForLayer(layer);
                                                                    }
                                                                  }
                                                                });
                                                              }
                                                            });

                }
            ]
        });
