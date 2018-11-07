angular.module('wpsMap').component(
        'wpsMap',
        {
            templateUrl: "components/wpsUserInterface/wpsMap/wps-map.template.html",
            controller: [
                '$rootScope',
				'$http',
                '$scope',
                '$timeout',
                'wpsMapService',
                'wpsExecuteInputService',
                'leafletData',
				'wpsPropertiesService',
                function MapController($rootScope, $http, $scope, $timeout, wpsMapService, wpsExecuteInputService, leafletData, wpsPropertiesService) {

                    const INDICATOR_DATE_PREFIX = "DATE_";

                    this.wpsMapServiceInstance = wpsMapService;
					          this.wpsPropertiesServiceInstance = wpsPropertiesService;
                    this.wpsExecuteSetupInputs = wpsExecuteInputService;
                    $scope.inputLayerCounter = 0;

                    $scope.latCenter = 51.4386432;
                    $scope.lonCenter = 7.0115552;
                    $scope.zoomLevel = 12;

                    $scope.loadingData = true;

                    $scope.drawnItems = new L.FeatureGroup();
                    $scope.drawControl;

                    $scope.allDrawingToolsEnabled = false;

                    // central map object
              			$scope.map;
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

                    $scope.currentIndicatorLayerOfCurrentLayer;
                    $scope.currentIndicatorContainsZeroValues = false;
                    $scope.defaultColorForZeroValues = "#525252";

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
                      var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 19, attribution: osmAttrib});
                      osm.StyledLayerControl = {
                    		removable : false,
                    		visible : false
                    	};

                      var osm_blackWhite = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {minZoom: 1, maxZoom: 19, attribution: osmAttrib});
                      osm_blackWhite.StyledLayerControl = {
                    		removable : false,
                    		visible : true
                    	};

                      osm_blackWhite.addTo($scope.baseMapLayers);
                      osm.addTo($scope.baseMapLayers);

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

                      if($scope.infoControl)
                        $scope.map.removeControl($scope.infoControl);

                      $scope.infoControl = L.control({position: 'topright'});

                      $scope.infoControl.onAdd = function (map) {
                          this._div = L.DomUtil.create('div', 'info legend'); // create a div with a class "info"

                          this._div.innerHTML = '<h4>' + $scope.indicatorName + ' ' + date +'</h4>';
                          // this._div.innerHTML += '<p>' + $scope.indicatorDescription + '</p>'
                          this._div.innerHTML += '<p>' + $scope.indicatorDescription + '</p>';
                          this._div.innerHTML +=  '<p>&uuml;ber ein Feature hovern</p>';

                          // this.update();
                          return this._div;
                      };

                      // method that we will use to update the control based on feature properties passed
                      $scope.infoControl.update = function (props) {
                        this._div.innerHTML = '<h4>' + $scope.indicatorName + ' ' + date +'</h4>';
                        this._div.innerHTML += '<p>' + $scope.indicatorDescription + '</p>';
                        this._div.innerHTML +=  (props ?
                          '<b>' + props.spatialUnitFeatureName + '</b><br />' + props[$scope.indicatorPropertyName] + ' ' + $scope.indicatorUnit
                          : '&uuml;ber ein Feature hovern');
                      };

                      $scope.infoControl.addTo($scope.map);
                    }

                    $scope.makeCustomInfoControl = function(date){

                      if($scope.infoControl)
                        $scope.map.removeControl($scope.infoControl);

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

                      if($scope.legendControl)
                        $scope.map.removeControl($scope.legendControl);

                      $scope.legendControl = L.control({position: 'topright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'info legend'),
                            labels = $scope.defaultBrew.getBreaks();
                            colors = $scope.defaultBrew.getColors();

                        $scope.div.innerHTML = "";

                        // loop through our density intervals and generate a label with a colored square for each interval
                        // for (var i = 0; i < labels.length; i++) {
                        //     $scope.div.innerHTML +=
                        //         '<i style="background:' + $scope.defaultBrew.getColorInRange(labels[i] + 1) + '"></i> ' +
                        //         labels[i] + (labels[i + 1] ? '&ndash;' + labels[i + 1] + '<br>' : '+');
                        // }

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '"></i> ' +
                              "0" + '<br>';
                        }

                        for (var i = 0; i < colors.length; i++) {
                            $scope.div.innerHTML +=
                                '<i style="background:' + colors[i] + '"></i> ' +
                                defaultClassificationMapping.items[i].defaultCustomRating + ' (' + (+labels[i].toFixed(4)) + ((+labels[i + 1].toFixed(4)) ? '&ndash;' + (+labels[i + 1].toFixed(4)) + ') <br>' : '+');
                        }

                        return $scope.div;
                      };

                      $scope.legendControl.addTo($scope.map);

                    }

                    $scope.makeMeasureOfValueLegend = function(){

                      if($scope.legendControl)
                        $scope.map.removeControl($scope.legendControl);

                      $scope.legendControl = L.control({position: 'topright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'info legend'),
                            labelsGtMeasureOfValue = $scope.gtMeasureOfValueBrew.getBreaks();
                            colorsGtMeasureOfValue = $scope.gtMeasureOfValueBrew.getColors();

                            labelsLtMeasureOfValue = $scope.ltMeasureOfValueBrew.getBreaks();
                            colorsLtMeasureOfValue = $scope.ltMeasureOfValueBrew.getColors();

                        $scope.div.innerHTML = "";

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '"></i> ' +
                              "0" + '<br><br>';
                        }

                        // loop through our density intervals and generate a label with a colored square for each interval
                        // for (var i = 0; i < labels.length; i++) {
                        //     $scope.div.innerHTML +=
                        //         '<i style="background:' + $scope.defaultBrew.getColorInRange(labels[i] + 1) + '"></i> ' +
                        //         labels[i] + (labels[i + 1] ? '&ndash;' + labels[i + 1] + '<br>' : '+');
                        // }

                        $scope.div.innerHTML += "<label>< Schwellwert</label><br/>";

                        var labelArray_below = ["deutlich kleiner Schwellwert", "moderat kleiner Schwellwert", "geringfügig kleiner Schwellwert"];
                        var labelArray_upper = ["geringfügig über Schwellwert", "moderat über Schwellwert", "deutlich über Schwellwert"];

                        // invert color labeling as colorization of lT features is also inverted
                        for (var i = 0; i < colorsLtMeasureOfValue.length; i++) {
                            $scope.div.innerHTML +=
                                '<i style="background:' + colorsLtMeasureOfValue[colorsLtMeasureOfValue.length - 1 - i] + '"></i> ' +
                                //(+labelsLtMeasureOfValue[i].toFixed(4)) + ((+labelsLtMeasureOfValue[i + 1].toFixed(4)) ? '&ndash;' + (+labelsLtMeasureOfValue[i + 1].toFixed(4)) + '<br>' : '+');
                                labelArray_below[i] + ' (' + (+labelsLtMeasureOfValue[i].toFixed(3)) + ((+labelsLtMeasureOfValue[i + 1].toFixed(3)) ? '&ndash;' + (+labelsLtMeasureOfValue[i + 1].toFixed(3)) + ') <br>' : '+');
                        }

                        $scope.div.innerHTML += "<br/>";

                        $scope.div.innerHTML += "<label>>= Schwellwert</label><br/>";

                        for (var i = 0; i < colorsGtMeasureOfValue.length; i++) {
                            $scope.div.innerHTML +=
                                '<i style="background:' + colorsGtMeasureOfValue[i] + '"></i> ' +
                                labelArray_upper[i] + ' (' + (+labelsGtMeasureOfValue[i].toFixed(3)) + ((+labelsGtMeasureOfValue[i + 1].toFixed(3)) ? '&ndash;' + (+labelsGtMeasureOfValue[i + 1].toFixed(3)) + ') <br>' : '+');
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
                      if(! wpsPropertiesService.clickedIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                        wpsPropertiesService.clickedIndicatorFeatureNames.push(layer.feature.properties.spatialUnitFeatureName);
                        highlightClickedFeature(layer);
                      }

                      else{
                        //remove from array
                        var index = wpsPropertiesService.clickedIndicatorFeatureNames.indexOf(layer.feature.properties.spatialUnitFeatureName);
                        wpsPropertiesService.clickedIndicatorFeatureNames.splice(index, 1);
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

                                        var setupGtMeasureOfValueBrew = function(geoJSON, propertyName, numClasses, colorCode, classifyMethod, measureOfValue){
                                          // pass values from your geojson object into an empty array
                                          // see link above to view geojson used in this example
                                          var values = [];
                                          for (var i = 0; i < geoJSON.features.length; i++){
                                              if (geoJSON.features[i].properties[propertyName] == null || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
                                                continue;

                                              if(geoJSON.features[i].properties[propertyName] >= measureOfValue)
                                                values.push(geoJSON.features[i].properties[propertyName]);
                                          }

                                          // pass array to our classyBrew series
                                          $scope.gtMeasureOfValueBrew.setSeries(values);

                                          // define number of classes
                                          // if(values.length < numClasses){
                                          //   if(values.length < 2)
                                          //     $scope.gtMeasureOfValueBrew.setNumClasses(values.length);
                                          //   else
                                          //     $scope.gtMeasureOfValueBrew.setNumClasses(values.length);
                                          // }
                                          // else
                                          $scope.gtMeasureOfValueBrew.setNumClasses(numClasses);

                                          // set color ramp code
                                          $scope.gtMeasureOfValueBrew.setColorCode(colorCode);

                                          // classify by passing in statistical method
                                          // i.e. equal_interval, jenks, quantile
                                          $scope.gtMeasureOfValueBrew.classify(classifyMethod);
                                        }

                                        var setupLtMeasureOfValueBrew = function(geoJSON, propertyName, numClasses, colorCode, classifyMethod, measureOfValue){
                                          // pass values from your geojson object into an empty array
                                          // see link above to view geojson used in this example
                                          var values = [];
                                          for (var i = 0; i < geoJSON.features.length; i++){
                                              if (geoJSON.features[i].properties[propertyName] == null || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
                                                continue;

                                              if(geoJSON.features[i].properties[propertyName] < measureOfValue)
                                                values.push(geoJSON.features[i].properties[propertyName]);
                                          }

                                          // pass array to our classyBrew series
                                          $scope.ltMeasureOfValueBrew.setSeries(values);

                                          // define number of classes
                                          // if(values.length < numClasses){
                                          //   if(values.length < 2)
                                          //     $scope.ltMeasureOfValueBrew.setNumClasses(values.length);
                                          //   else
                                          //     $scope.ltMeasureOfValueBrew.setNumClasses(values.length);
                                          // }
                                          // else
                                          $scope.ltMeasureOfValueBrew.setNumClasses(numClasses);

                                          // set color ramp code
                                          $scope.ltMeasureOfValueBrew.setColorCode(colorCode);

                                          // classify by passing in statistical method
                                          // i.e. equal_interval, jenks, quantile
                                          $scope.ltMeasureOfValueBrew.classify(classifyMethod);
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

                                          if(feature.properties[$scope.indicatorPropertyName] >= wpsPropertiesService.measureOfValue){
                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                            }
                                            else{
                                              fillColor = $scope.gtMeasureOfValueBrew.getColorInRange(feature.properties[$scope.propertyName]);
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
                                              var ltColors = $scope.ltMeasureOfValueBrew.getColors();
                                              var ltBreaks = $scope.ltMeasureOfValueBrew.getBreaks();

                                              // we use 3 classes --> thus 4 breaks and 3 colors

                                              if(feature.properties[$scope.propertyName] >= ltBreaks[0] && feature.properties[$scope.propertyName] < ltBreaks[1]){
                                                // strongest color
                                                fillColor = ltColors[2];
                                              }
                                              else if(feature.properties[$scope.propertyName] >= ltBreaks[1] && feature.properties[$scope.propertyName] < ltBreaks[2]){
                                                // middle color
                                                fillColor = ltColors[1];
                                              }
                                              else{
                                                fillColor = ltColors[0];
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

                                            if(wpsPropertiesService.clickedIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                              highlightClickedFeature(layer);
                                              return;
                                            }

                                            layer.setStyle({
                                                weight: 5,
                                                color: '#666',
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
                                          if(! wpsPropertiesService.clickedIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                            //$scope.currentIndicatorLayer.resetStyle(layer);
                                            if(! wpsPropertiesService.isMeasureOfValueChecked){
                                              //$scope.currentIndicatorLayer.resetStyle(layer);
                                              layer.setStyle(styleDefault(layer.feature));
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

                                          if(! wpsPropertiesService.isMeasureOfValueChecked){
                                            //$scope.currentIndicatorLayer.resetStyle(layer);
                                            layer.setStyle(styleDefault(layer.feature));
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

                                        function fitBounds(){
                                          console.log("fit map bounds for current indicator");
                                          if($scope.map && $scope.currentIndicatorLayer){

                                            // $scope.map.setView(L.latLng($scope.latCenter, $scope.lonCenter), $scope.zoomLevel);
                                            $scope.map.fitBounds($scope.currentIndicatorLayer.getBounds());
                                          }

                                        }

                                        function zoomToFeature(e) {
                                            map.fitBounds(e.target.getBounds());
                                        }

                                                  $scope.$on("replaceIndicatorAsGeoJSON", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date) {

                                                                console.log('replaceIndicatorAsGeoJSON was called');

                                                                // empty layer of possibly selected features
                                                                wpsPropertiesService.clickedIndicatorFeatureNames = [];

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

                                                                if(wpsPropertiesService.isMeasureOfValueChecked){

                                                                  setupGtMeasureOfValueBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, 3, "YlOrBr", "jenks", wpsPropertiesService.measureOfValue);
                                                                  setupLtMeasureOfValueBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, 3, "Purples", "jenks", wpsPropertiesService.measureOfValue);
                                                                  $scope.propertyName = INDICATOR_DATE_PREFIX + date;

                                                                  layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                      style: styleMeasureOfValue,
                                                                      onEachFeature: onEachFeatureIndicator
                                                                  });

                                                                  $scope.makeInfoControl(date);
                                                                  $scope.makeMeasureOfValueLegend();

                                                                }
                                                                else{
                                                                  setupDefaultBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, indicatorMetadataAndGeoJSON.defaultClassificationMapping.items.length, indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, "jenks");
                                                                  $scope.propertyName = INDICATOR_DATE_PREFIX + date;

                                                                  layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                      style: styleDefault,
                                                                      onEachFeature: onEachFeatureIndicator
                                                                  });
                                                                  $scope.makeInfoControl(date);
                                                                  $scope.makeDefaultLegend(indicatorMetadataAndGeoJSON.defaultClassificationMapping);

                                                                }

                                                                $scope.currentIndicatorLayer = layer;

                                                                layer.StyledLayerControl = {
                                                                  removable : true,
                                                                  visible : true
                                                                };

                                                                $scope.layerControl.addOverlay( layer, indicatorMetadataAndGeoJSON.indicatorName + "_" + spatialUnitName + "_" + date, {groupName : indicatorLayerGroupName} );

                                                                var justRestyling = false;

                                                                // fitBounds();

                                                                $rootScope.$broadcast("updateDiagrams", wpsPropertiesService.selectedIndicator, wpsPropertiesService.selectedSpatialUnit.spatialUnitLevel, wpsPropertiesService.selectedSpatialUnit.spatialUnitId, date, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, wpsPropertiesService.isMeasureOfValueChecked, wpsPropertiesService.measureOfValue, justRestyling);
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

                                                                            if(wpsPropertiesService.isMeasureOfValueChecked){
                                                                              $scope.currentIndicatorLayer.eachLayer(function(layer) {

                                                                                setupGtMeasureOfValueBrew($scope.currentIndicatorLayerOfCurrentLayer, $scope.indicatorPropertyName, 3, "YlOrBr", "jenks", wpsPropertiesService.measureOfValue);
                                                                                setupLtMeasureOfValueBrew($scope.currentIndicatorLayerOfCurrentLayer, $scope.indicatorPropertyName, 3, "Purples", "jenks", wpsPropertiesService.measureOfValue);

                                                                                $scope.makeMeasureOfValueLegend();

                                                                                layer.setStyle(styleMeasureOfValue(layer.feature));
                                                                              });
                                                                            }
                                                                            else{
                                                                              $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                setupDefaultBrew($scope.currentIndicatorLayerOfCurrentLayer, $scope.indicatorPropertyName, wpsPropertiesService.selectedIndicator.defaultClassificationMapping.items.length, wpsPropertiesService.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName, "jenks");

                                                                                $scope.makeDefaultLegend(wpsPropertiesService.selectedIndicator.defaultClassificationMapping);

                                                                                layer.setStyle(styleDefault(layer.feature));
                                                                              });
                                                                            }

                                                                            var justRestyling = true;

                                                                            $rootScope.$broadcast("updateDiagrams", wpsPropertiesService.selectedIndicator, wpsPropertiesService.selectedSpatialUnit.spatialUnitLevel, wpsPropertiesService.selectedSpatialUnit.spatialUnitId, $scope.date, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, wpsPropertiesService.isMeasureOfValueChecked, wpsPropertiesService.measureOfValue, justRestyling);


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












































					$scope.$on("addBaseDataLayerAsWMS", function (event, args) {

                        console.log('addBaseDataLayerAsWMS was called');

						selectedBaseData = args;

                        if ($scope.layers.overlays[selectedBaseData.name]) {
                            delete $scope.layers.overlays[selectedBaseData.name];

                            console.log($scope.layers.overlays);
                        }

                        var wmsLayer = {
                            name: selectedBaseData.name,
                            type: 'wms',
                            visible: true,
                            url: selectedBaseData.wmsURL,
                            layerParams: {
                                layers: selectedBaseData.layerName,
                                format: 'image/png',
                                transparent: true
                            }
                        };

                        $scope.layers.overlays[selectedBaseData.name] = wmsLayer;
                    });

                    $scope.$on("addSpatialUnitAsWFS", function (event, name, wfsURL) {

                                  console.log('addSpatialUnitAsWFS was called');

                                  if ($scope.layers.overlays[name]) {
                                      delete $scope.layers.overlays[name];

                                      console.log($scope.layers.overlays);
                                  }

                                  var wfsLayer = new L.WFS({
                      						url: wfsURL,
                      						typeNS: 'kommonitor',
                      						typeName: 'SPATIAL_UNIT_1',
                      						type: "wfs",
                      						crs: L.CRS.EPSG4326,
                      						style: {
                      							color: 'blue',
                      							weight: 2
                      						}
                      						});

                                  // var geoJSONLayer = {
                                  //     name: spatialUnitMetadataAndGeoJSON.spatialUnitLevel,
                                  //     type: "geoJSONShape",
                                  //     data: spatialUnitMetadataAndGeoJSON.geoJSON,
                                  //     visible: true,
                                  //     layerOptions: {
                                  //         style: {
                                  //             color: '#1B4F72',
                                  //             fillColor: 'blue',
                                  //             weight: 2.0,
                                  //             opacity: 0.6,
                                  //             fillOpacity: 0.2
                                  //         },
                                  //         onEachFeature: onEachFeatureSpatialUnit
                                  //     }
                                  // };

                                  $scope.layers.overlays[name] = wfsLayer;

                                  // refresh the layer!!! Otherwise display is not updated properly in case
                                  // an existing overlay is updated!
                                  $scope.layers.overlays[name].doRefresh = true;
                              });

					$scope.$on('addBaseDataLayerAsWFS', function (event, args){

                        console.log('addBaseDataLayerAsWFS was called');

						selectedBaseData = args;

                        if ($scope.layers.overlays[selectedBaseData.name]) {
                            delete $scope.layers.overlays[selectedBaseData.name];

                            console.log($scope.layers.overlays);
                        }

						var wfsLayer = new L.WFS({
						url: selectedBaseData.wfsURL,
						typeNS: 'kommonitor',
						typeName: selectedBaseData.name,
						type: "wfs",
						crs: L.CRS.EPSG4326,
						style: {
							color: 'blue',
							weight: 2
						}
						});

                        //checkPopupContentProperty(geojson, identifier);

                        $scope.layers.overlays[selectedBaseData.name] = wfsLayer;

                        // refresh the layer!!! Otherwise display is not updated properly in case
                        // an existing overlay is updated!
                        $scope.layers.overlays[selectedBaseData.name].doRefresh = true;
                    });

					$scope.$on("addIndicatorLayerAsWMS", function (event, args) {

                        console.log('addIndicatorLayerAsWMS was called');

						selectedIndicator = args;

                        if ($scope.layers.overlays[selectedIndicator.name]) {
                            delete $scope.layers.overlays[selectedIndicator.name];

                            console.log($scope.layers.overlays);
                        }

                        var wmsLayer = {
                            name: selectedIndicator.name,
                            type: 'wms',
                            visible: true,
                            url: selectedIndicator.wmsURL,
                            layerParams: {
                                layers: selectedIndicator.layerName,
                                format: 'image/png',
								styles: selectedIndicator.styleNameSLD,
                                transparent: true
                            }
                        };

                        $scope.layers.overlays[selectedIndicator.name] = wmsLayer;



						// update indicatorLegend image
						wpsPropertiesService.selectedIndicatorLegendURL = selectedIndicator.layerLegendURL;

						console.log("image should be there!");

                    });

					$scope.$on("addIndicatorLayerAsWMS_withNameAndStyle", function (event, args) {

                        console.log('addIndicatorLayerAsWMS_withNameAndStyle was called');

						var selectedIndicator = args.selectedIndicator;
						var layerName = args.layerName;
						var sldName = args.sldName;

                        if ($scope.layers.overlays[layerName]) {
                            delete $scope.layers.overlays[layerName];

                            console.log($scope.layers.overlays);
                        }

                        var wmsLayer = {
                            name: layerName,
                            type: 'wms',
                            visible: true,
                            url: selectedIndicator.wmsURL,
                            layerParams: {
                                layers: selectedIndicator.layerName,
                                format: 'image/png',
								styles: sldName,
                                transparent: true
                            }
                        };

                        $scope.layers.overlays[layerName] = wmsLayer;



						// update indicatorLegend image
						wpsPropertiesService.selectedIndicatorLegendURL = selectedIndicator.layerLegendURL;

						console.log("image should be there!");

                    });




                    // add an input layer to the map:
                    $scope.$on('add-input-layer', function (event, args) {
                        console.log("add-input-layer has been called.");
                        var geojson = JSON.parse(args.geojson);
                        // TODO: error no json format feedback to user
                        $scope.addInputLayer(geojson, args.name, args.layerPropertyName);
                        // TODO: error json no geojson format feedback to user
                    });

                    // set leaflet plugins for complex data input enabled:
                    $scope.$on('set-complex-data-map-input-enabled', function (event, args) {
                        console.log("set-complex-data-map-input-enabled has been called.");
                        console.log(args);

                        // get params of broadcast:
                        $scope.allDrawingToolsEnabled = args.enabled;

                        if ($scope.allDrawingToolsEnabled) {
                            // enable
                            $scope.setDrawEnabled_complex(true);
                        } else {
                            // disable
                            $scope.setDrawEnabled_complex(false);
                        }
                    });

                    // set leaflet plugins for bbox data input enabled:
                    $scope.$on('set-bbox-data-map-input-enabled', function (event, args) {
                        console.log("set-bbox-data-map-input-enabled has been called.");
                        console.log(args);

                        // get params of broadcast:
                        $scope.allDrawingToolsEnabled = args.enabled;

                        if ($scope.allDrawingToolsEnabled) {
                            // enable
                            $scope.setDrawEnabled_bbox(true);
                        } else {
                            // disable
                            $scope.setDrawEnabled_bbox(false);
                        }
                    });







                    /**
                     * Resets the map, which includes:
                     *  - deletion of all overlays
                     */
                    var resetMap = function () {
                        deleteAllOverlays();

						wpsPropertiesService.selectedBaseData = undefined;
						wpsPropertiesService.selectedIndicator = undefined;
						wpsPropertiesService.selectedIndicatorLegendURL = undefined;
                    };

                    var deleteAllOverlays = function () {
                        $scope.layers.overlays = {};
                    };

                    /**
                     * delete overlay for given input identifier
                     */
                    $scope.$on('delete-overlay-for-input', function (event, args) {
                        console.log("delete-overlay-for-input has been called.");

                        var inputIdentifier = args.inputIdentifier;

                        var inputLayerPropertyName = wpsMapService.generateUniqueInputLayerPropertyName(inputIdentifier)

                        delete $scope.layers.overlays[inputLayerPropertyName];

                        console.log($scope.layers.overlays);

                    });

                    /**
                     * remove all overlays from map
                     */
                    $scope.$on('reset-map-overlays', function (event, args) {
                        console.log("reset-map-overlays has been called.");

                        resetMap();

                    });

                    /**
                     * clear all layers of leaflet-draw layer
                     */
                    $scope.$on('clear-draw-layers', function (event, args) {
                        console.log("clear-draw-layers has been called.");

                        $scope.drawnItems.clearLayers();

                    });

                    /**
                     * delete a specific overlay for specific input identifier
                     */
                    $scope.$on('add-geometry-to-leaflet-draw-from-geojson-input', function (event, args) {
                        console.log("add-geometry-to-leaflet-draw-from-geojson-input has been called.");
                        console.log(args);
                        var geoJSON_asObject = args.geoJSON;

                        L.geoJson(geoJSON_asObject, {
                            onEachFeature: function (feature, layer) {
                                if (layer.getLayers) {
                                    layer.getLayers().forEach(function (currentLayer) {
                                        $scope.drawnItems.addLayer(currentLayer);
                                    })
                                } else {
                                    $scope.drawnItems.addLayer(layer);
                                }
                            },
                            style: {
                                color: '#f06eaa',
                                fillColor: null,
                                weight: 4.0,
                                opacity: 0.5,
                                fillOpacity: 0.2
                            }
                        });
                        console.log($scope.drawnItems);
                    });

                    /**
                     * clear all layers of leaflet-draw layer
                     */
                    $scope.$on('clear-draw-layers', function (event, args) {
                        console.log("clear-draw-layers has been called.");

                        $scope.drawnItems.clearLayers();

                    });

                    var customResetMapControl = L.Control.extend({
                        options: {
                            position: 'topright'
                                    //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
                        },
                        onAdd: function (map) {
                            var container = L.DomUtil.create('input', 'leaflet-bar leaflet-control leaflet-control-custom');

                            container.type = 'button';
                            container.title = 'Reset Layers';
                            container.value = 'Reset Layers';
                            container.style.backgroundColor = 'white';
                            container.style.width = '90px';
                            container.style.height = '25px';

                            container.onmouseover = function () {
                                container.style.backgroundColor = '#F4F4F4';
                            }
                            container.onmouseout = function () {
                                container.style.backgroundColor = 'white';
                            }

                            container.onclick = function () {
                                resetMap();
                            }
                            return container;
                        },
                    });

                    // called, when the map has loaded:
                    leafletData.getMap().then(function (map) {
                        // create draw layers Control:
                        $scope.drawnItems = new L.featureGroup().addTo(map);
//                        $scope.drawControl = new L.Control.Draw({
//                            position: "bottomright",
//                            edit: {
//                                featureGroup: $scope.drawnItems
//                            }
//                        });
//
//                        // called, when a single geojson feature is created via leaflet.draw:
//                        map.on('draw:created', function (e) {
//                            var layer = e.layer;
//                            $scope.drawnItems.addLayer(layer);
//                            console.log(JSON.stringify($scope.drawnItems.toGeoJSON()));
//                        });


                        // add resetMap button
                        map.addControl(new customResetMapControl());

//                        // add drawItems-layer to mapcontrols and enable 'edit'-feature on it:
//                        map.addControl(new L.Control.Draw({
//                            position: "bottomright",
//                            edit: {featureGroup: drawnItems}
//                        }));

                        // drawControl.addTo(map);

                        // add drawControls to map:
//                        $scope.setDrawEnabled_complex(false);

                        console.log(map);

                    });

                    $scope.drawctrlEnabled = true;

                    /**
                     * decides wether a layer is a circle or not.
                     * @param {type} layer
                     * @returns {boolean}
                     */
                    var isCircle = function (layer) {
                        if (layer._mRadius)
                            return true;
                        return false;
                    };

                    var d2r = Math.PI / 180; // degrees to radians
                    var r2d = 180 / Math.PI; // radians to degrees
                    var earthsradius = 3963; // 3963 is the radius of the earth in miles

                    /**
                     * creates a CirclePolygone Geojsonfeature with nPoints number of points.
                     * @param {type} layer - drawlayer
                     * @param {type} nPoints - number of points for the polygone
                     * @returns {undefined}
                     */
                    var getCirclePolygone = function (layer) {

                        var polyCircle = {
                            type: "FeatureCollection",
                            features: [{
                                    type: "Feature",
                                    properties: {},
                                    geometry: {
                                        type: "Polygon",
                                        coordinates: [
                                            [
                                            ]
                                        ]
                                    }
                                }]
                        };
                        var radius = layer._mRadius / 1609.344; // meters -> miles
                        var lat = layer._latlng.lat;
                        var lng = layer._latlng.lng;

                        // find the radius in lat/lon
                        var rlat = (radius / earthsradius) * r2d;
                        var rlng = rlat / Math.cos(lat * d2r);

                        var nPoints = 32;

                        for (var i = 0; i < nPoints + 1; i++) // one extra here makes sure we connect the
                        {
                            var theta = Math.PI * (i / (nPoints / 2));
                            var ex = lng + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
                            var ey = lat + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
                            polyCircle.features[0].geometry.coordinates[0].push(
                                    [ex, ey]
                                    );
                        }
                        return polyCircle;
                    }
                    ;

                    /**
                     * enables/disables the Leaflet-Draw tools
                     * @param {type} enabled - true to enable the draw controls/ false to disable the draw controls
                     * @returns {undefined}
                     */
                    $scope.setDrawEnabled_complex = function (enabled) {

                        leafletData.getMap().then(function (map) {

                            if (enabled) {

                                $scope.drawControl = new L.Control.Draw({
                                    position: "bottomright",
                                    edit: {
                                        featureGroup: $scope.drawnItems
                                    }
                                });

                                // called, when a single geojson feature is created via leaflet.draw:
                                map.on('draw:created', function (e) {
                                    var layer = e.layer;
                                    if (isCircle(e.layer)) {
                                        var circlePoly = getCirclePolygone(layer);
                                        // create circlePoly layer and add it to drawnItems:
                                        var geoJSON_asObject = circlePoly;

                                        L.geoJson(geoJSON_asObject, {
                                            onEachFeature: function (feature, layer) {
                                                console.log(layer);
                                                if (layer.getLayers) {
                                                    layer.getLayers().forEach(function (currentLayer) {
                                                        $scope.drawnItems.addLayer(currentLayer);
                                                        console.log("added");
                                                    });
                                                } else {
                                                    $scope.drawnItems.addLayer(layer);
                                                    console.log("added");
                                                }
                                            },
                                            style: {
                                                color: '#3388ff',
                                                fillColor: '#3388ff',
                                                weight: 4.0,
                                                opacity: 0.5,
                                                fillOpacity: 0.2
                                            }
                                        });
                                    } else {
                                        $scope.drawnItems.addLayer(layer);
                                        console.log("added");
                                    }
                                    wpsExecuteInputService.complexPayload = JSON.stringify($scope.drawnItems.toGeoJSON());
                                    // update geojson-selection in service:
                                    console.log(JSON.stringify($scope.drawnItems.toGeoJSON()));
                                    console.log(e.layer);
                                });

                                // called, when a single geojson feature is created via leaflet.draw:
                                map.on('draw:edited', function (e) {
                                    var layer = e.layer;
                                    //  $scope.drawnItems.addLayer(layer);
                                    console.log(JSON.stringify($scope.drawnItems.toGeoJSON()));
                                    // update geojson-selection in service:
                                    wpsExecuteInputService.complexPayload = JSON.stringify($scope.drawnItems.toGeoJSON());
                                });

                                // called, when a single geojson feature is created via leaflet.draw:
                                map.on('draw:deleted', function (e) {
                                    var layer = e.layer;
                                    //drawnItems.addLayer(layer);
                                    console.log(JSON.stringify($scope.drawnItems.toGeoJSON()));
                                    // update geojson-selection in service:
                                    wpsExecuteInputService.complexPayload = JSON.stringify($scope.drawnItems.toGeoJSON());
                                });

                                // add drawItems-layer to mapcontrols and enable 'edit'-feature on it:
                                //drawControl.addTo(map);
                                map.addControl($scope.drawControl);
                                $scope.allDrawingToolsEnabled = true;
                            } else {
                                console.log(map);

                                try {
                                    map.removeControl($scope.drawControl);
                                } catch (e) {
                                    console.log(e);
                                }

                            }
                        });
                    };

                    /**
                     * enables/disables the Leaflet-Draw tools for BoundingBoxInputs
                     * @param {type} enabled - true to enable the draw controls/ false to disable the draw controls
                     * @returns {undefined}
                     */
                    $scope.setDrawEnabled_bbox = function (enabled) {

                        leafletData.getMap().then(function (map) {

                            console.log(map);

                            if (enabled) {

                                $scope.drawControl = new L.Control.Draw({
                                    position: "bottomright",
                                    draw: {
                                        polygon: false,
                                        marker: false,
                                        circle: false,
                                        polyline: false
                                    },
                                    edit: {
                                        featureGroup: $scope.drawnItems
                                    }
                                });

                                // called, when a single geojson feature is created via leaflet.draw:
                                map.on('draw:created', function (e) {
                                    var layer = e.layer;
                                    $scope.drawnItems.addLayer(layer);

                                    var geoJson_bbox = $scope.drawnItems.toGeoJSON();

                                    console.log(JSON.stringify(geoJson_bbox));
                                    // update geojson-selection in service:

                                    wpsExecuteInputService.bboxAsGeoJSON = geoJson_bbox;

                                    var corners = extractBboxCornersFromGeoJSON(geoJson_bbox);

                                    wpsExecuteInputService.bboxLowerCorner = corners.lowerCorner;
                                    wpsExecuteInputService.bboxUpperCorner = corners.upperCorner;
                                });

                                // called, when a single geojson feature is created via leaflet.draw:
                                map.on('draw:edited', function (e) {
                                    var layer = e.layer;
                                    var geoJson_bbox = $scope.drawnItems.toGeoJSON();

                                    console.log(JSON.stringify(geoJson_bbox));

                                    wpsExecuteInputService.bboxAsGeoJSON = geoJson_bbox;

                                    var corners = extractBboxCornersFromGeoJSON(geoJson_bbox);

                                    wpsExecuteInputService.bboxLowerCorner = corners.lowerCorner;
                                    wpsExecuteInputService.bboxUpperCorner = corners.upperCorner;
                                });

                                // called, when a single geojson feature is created via leaflet.draw:
                                map.on('draw:deleted', function (e) {
                                    var layer = e.layer;
                                    var geoJson_bbox = $scope.drawnItems.toGeoJSON();

                                    console.log(JSON.stringify(geoJson_bbox));

                                    wpsExecuteInputService.bboxAsGeoJSON = geoJson_bbox;

                                    var corners = extractBboxCornersFromGeoJSON(geoJson_bbox);

                                    wpsExecuteInputService.bboxLowerCorner = corners.lowerCorner;
                                    wpsExecuteInputService.bboxUpperCorner = corners.upperCorner;
                                });

                                // add drawItems-layer to mapcontrols and enable 'edit'-feature on it:
                                map.addControl($scope.drawControl);
                                $scope.allDrawingToolsEnabled = true;
                            } else {
                                console.log(map);

                                try {
                                    map.removeControl($scope.drawControl);
                                } catch (e) {
                                    console.log(e);
                                }

                            }
                        });

                    };

                    var extractBboxCornersFromGeoJSON = function (geoJson_bbox) {

                        var corners = {};

                        var lonMin;
                        var lonMax;
                        var latMin;
                        var latMax;

                        /*
                         * BBOX is encoded as GeoJSON FeatureCollection
                         *
                         * hence geometry is available via object.features[0].geometry.coordinates[0]
                         */

                        var coordinatesArray = geoJson_bbox.features[0].geometry.coordinates;

                        /*
                         * coordinates array may look like: [[lon,lat],[lon,lat]]
                         */
                        var points = coordinatesArray[0];

                        /*
                         * initialize variables with first point
                         */
                        var firstPoint = points[0];
                        lonMax = firstPoint[0];
                        lonMin = firstPoint[0];
                        latMax = firstPoint[1];
                        latMin = firstPoint[1];

                        // remaining points
                        for (var index = 1; index < points.length; index++) {
                            var currentPoint = points[index];

                            var currentLat = currentPoint[1];
                            var currentLon = currentPoint[0];

                            if (currentLat > latMax)
                                latMax = currentLat;

                            else if (currentLat < latMin)
                                latMin = currentLat;

                            if (currentLon > lonMax)
                                lonMax = currentLon;

                            else if (currentLon < lonMin)
                                lonMin = currentLon;
                        }

                        var lowerLeftCornerString = latMin + " " + lonMin;
                        var upperRightCornerString = latMax + " " + lonMax;

                        corners.lowerCorner = lowerLeftCornerString;
                        corners.upperCorner = upperRightCornerString;

                        return corners;
                    };

                    /**
                     * adds a geojson featurecollection as a layer onto the leaflet map
                     * @param {type} geojson
                     * @returns {undefined}
                     */
                    $scope.addInputLayer = function (geojson, identifier, layerPropertyName) {

                        console.log(geojson);

                        if ($scope.layers.overlays[layerPropertyName]) {
                            delete $scope.layers.overlays[layerPropertyName];

                            console.log($scope.layers.overlays);
                        }

                        var geoJSONLayer = {
                            name: "Input: " + identifier,
                            type: "geoJSONShape",
                            data: geojson,
                            visible: true,
                            layerOptions: {
                                style: {
                                    color: '#1B4F72',
                                    fillColor: 'blue',
                                    weight: 2.0,
                                    opacity: 0.6,
                                    fillOpacity: 0.2
                                },
                                onEachFeature: onEachFeature
                            }
                        };

                        checkPopupContentProperty(geojson, identifier);

                        $scope.layers.overlays[layerPropertyName] = geoJSONLayer;

                        // refresh the layer!!! Otherwise display is not updated properly in case
                        // an existing overlay is updated!
                        $scope.layers.overlays[layerPropertyName].doRefresh = true;
                    };

                    /*
                     * event/method to add a GeoJSON output to the map
                     */
                    $scope.$on("addGeoJSONOutput", function (event, args) {

                        var geoJsonOutput = args.geoJSONFeature;
                        var layerPropertyName = args.layerPropertyName;
                        var outputIdentifier = args.outputIdentifier;

                        checkPopupContentProperty(geoJsonOutput, outputIdentifier);

                        var geoJSONLayer = {
                            name: 'Output: ' + outputIdentifier,
                            type: 'geoJSONShape',
                            data: geoJsonOutput,
                            visible: true,
                            layerOptions: {
                                style: {
                                    color: '#922B21',
                                    fillColor: 'red',
                                    weight: 2.0,
                                    opacity: 0.6,
                                    fillOpacity: 0.2
                                },
                                onEachFeature: onEachFeature
                            }
                        };

                        $scope.layers.overlays[layerPropertyName] = geoJSONLayer;

                        // center map to new output
                        $scope.centerGeoJSONOutput(layerPropertyName);

                    });

//                    var addWMSOutput = function() {
//
//                        var url = 'http://demo.opengeo.org/geoserver/ows?';
//                        var layerPropertyName = 'testWMS';
//                        var outputIdentifier = 'testWMS';
//
//                        var wmsLayer = {
//                                name: 'Output: ' + outputIdentifier,
//                                type: 'wms',
//                                visible: true,
//                                url: url,
//                                layerParams: {
//                                	layers: 'ne:ne',
//                                	format: 'image/png',
//                                    transparent: true
//                                }
//                            };
//
//                        $scope.layers.overlays[layerPropertyName] = wmsLayer;
//
//                        console.log("Test WMS");
//
//                    };

                    /*
                     * event/method to add a WMS output to the map
                     */
                    $scope.$on("addWMSOutput", function (event, args) {

                        var wmsURL = args.wmsURL;
                        var layerPropertyName = args.layerPropertyName;
                        var outputIdentifier = args.outputIdentifier;
                        var layerNamesString = args.layerNamesString;
//                        var testLayerNames = layerNamesString + ",topp:tasmania_state_boundaries";
//                        console.log(testLayerNames);

                        var wmsLayer = {
                            name: 'Output: ' + outputIdentifier,
                            type: 'wms',
                            visible: true,
                            url: wmsURL,
                            layerParams: {
                                layers: layerNamesString,
                                format: 'image/png',
                                transparent: true
                            }
                        };

                        $scope.layers.overlays[layerPropertyName] = wmsLayer;
                    });

                    var checkPopupContentProperty = function (geoJson, identifier) {
                        /*
                         * check if geoJsonOutput has a .property.popupContent attribute
                         * (important for click interaction with displayed output,
                         * as it will be displayed in a popup)
                         *
                         * if not, then set it with the identifier
                         */
                        if (geoJson.properties) {
                            if (geoJson.properties.popupContent) {
                                /*
                                 * here we have to do nothing, as the desired property is already set
                                 */
                            } else
                                geoJson.properties.popupContent = identifier;
                        } else {
                            geoJson.properties = {};
                            geoJson.properties.popupContent = identifier;
                        }

                        /*
                         * here we check the .properties.popupContent property for each feature of the output!
                         */
                        if (geoJson.features) {
                            var features = geoJson.features;

                            for (var i in features) {
                                var currentFeature = features[i];

                                if (currentFeature.properties) {
                                    if (currentFeature.properties.popupContent) {
                                        /*
                                         * here we have to do nothing, as the desired property is already set
                                         */
                                    } else
                                        currentFeature.properties.popupContent = identifier;
                                } else {
                                    currentFeature.properties = {};
                                    currentFeature.properties.popupContent = identifier;
                                }

                                features[i] = currentFeature;
                            }
                        }
                    };

                    /**
                     * Centers the map according to the given overlay
                     *
                     */
                    $scope.centerGeoJSONOutput = function (layerPropertyName) {

                        var latlngs = [];

                        /*
                         * TODO how to detect the array depth of coordinates???
                         *
                         * FIXME how to detect the array depth of coordinates???
                         *
                         * maybe use geoJSON type property to gues the array depth
                         * (e.g. multiPolygon has different depth than simple Polygon)
                         */

                        var coordinates;

                        if ($scope.layers.overlays[layerPropertyName].data.geometry) {
                            coordinates = $scope.layers.overlays[layerPropertyName].data.geometry.coordinates;

                            for (var i in coordinates) {
                                var points = coordinates[i];
                                for (var k in points) {
                                    latlngs.push(L.GeoJSON.coordsToLatLng(points[k]));
                                }
                            }
                        } else if ($scope.layers.overlays[layerPropertyName].data.features) {
                            coordinates = $scope.layers.overlays[layerPropertyName].data.features[0].geometry.coordinates;

                            for (var i in coordinates) {
                                var coord = coordinates[i];
                                for (var j in coord) {
                                    var points = coord[j];
                                    for (var k in points) {
                                        latlngs.push(L.GeoJSON.coordsToLatLng(points[k]));
                                    }
                                }
                            }
                        } else
                            return;

                        leafletData.getMap().then(function (map) {
                            map.fitBounds(latlngs);
                        });
                    };

                    /**
                     * binds the popup of a clicked output
                     * to layer.feature.properties.popupContent
                     */
                    function onEachFeature(feature, layer) {
                        // does this feature have a property named popupContent?
                        layer.on({
                            click: function () {

                                var popupContent = layer.feature.properties.popupContent;

                                if (popupContent)
                                    layer.bindPopup(popupContent);
                            }
                        })
                    };

                }
            ]
        });
