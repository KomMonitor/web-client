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
				'wpsPropertiesService',
                function MapController($rootScope, $http, $scope, $timeout, wpsMapService, wpsExecuteInputService, wpsPropertiesService) {

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

                        $scope.div.innerHTML += "<label>Einheit: </label> " + $scope.indicatorUnit + "<br/><br/>";

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

                        $scope.div = L.DomUtil.create('div', 'info legend'),
                            labelsGtMeasureOfValue = $scope.gtMeasureOfValueBrew.getBreaks();
                            colorsGtMeasureOfValue = $scope.gtMeasureOfValueBrew.getColors();

                            labelsLtMeasureOfValue = $scope.ltMeasureOfValueBrew.getBreaks();
                            colorsLtMeasureOfValue = $scope.ltMeasureOfValueBrew.getColors();

                        $scope.div.innerHTML = "";

                        $scope.div.innerHTML += "<label>Einheit: </label> " + $scope.indicatorUnit + "<br/>";
                        $scope.div.innerHTML += "<label>aktueller Schwellwert: </label> " + wpsPropertiesService.measureOfValue + " " + $scope.indicatorUnit + "<br/><br/>";

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

                                                            $scope.$on("unselectAllFeatures", function (event) {

                                                              if(wpsPropertiesService.clickedIndicatorFeatureNames && wpsPropertiesService.clickedIndicatorFeatureNames.length > 0){
                                                                $scope.map.eachLayer(function(layer){
                                                                  if(layer.feature){
                                                                    if(wpsPropertiesService.clickedIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                                                      var index = wpsPropertiesService.clickedIndicatorFeatureNames.indexOf(layer.feature.properties.spatialUnitFeatureName);
                                                                      wpsPropertiesService.clickedIndicatorFeatureNames.splice(index, 1);
                                                                      resetHighlightForLayer(layer);
                                                                    }
                                                                  }
                                                                });
                                                              }
                                                            });

                }
            ]
        });
