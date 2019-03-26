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
                    const defaultColorForFilteredValues = __env.defaultColorForFilteredValues;
                    const defaultBorderColorForFilteredValues = __env.defaultBorderColorForFilteredValues;
                    const defaultBorderColor = __env.defaultBorderColor;
                    const defaultFillOpacity = __env.defaultFillOpacity;
                    const defaultFillOpacityForFilteredFeatures = __env.defaultFillOpacityForFilteredFeatures;
                    const defaultFillOpacityForHighlightedFeatures = __env.defaultFillOpacityForHighlightedFeatures;
                    const defaultFillOpacityForZeroFeatures = __env.defaultFillOpacityForZeroFeatures;
                    //allowesValues: equal_interval, quantile, jenks
                    $scope.classifyMethods = [{
                      name: "Jenks",
                      value: "jenks"
                    },{
                      name: "Gleiches Intervall",
                      value: "equal_interval"
                    },{
                      name: "Quantile",
                      value: "quantile"
                    }];

                    // updateInterval (from kommonitor data management api) = ['ARBITRARY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']
                    $scope.updateInterval = new Map();
                    $scope.updateInterval.set("ARBITRARY", "beliebig");
                    $scope.updateInterval.set("YEARLY", "jährlich");
                    $scope.updateInterval.set("HALF_YEARLY", "halbjährig");
                    $scope.updateInterval.set("MONTHLY", "monatlich");
                    $scope.updateInterval.set("QUARTERLY", "vierteljährlich");

                    $scope.classifyMethod = __env.defaultClassifyMethod || "jenks";

                    $scope.filteredStyle = {
                        weight: 2,
                        opacity: 0.5,
                        color: defaultBorderColorForFilteredValues,
                        dashArray: '',
                        fillOpacity: defaultFillOpacityForFilteredFeatures,
                        fillColor: defaultColorForFilteredValues
                    };

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
                    $scope.date;

                    // central map object
              			$scope.map;
                    $scope.scaleBar;
                    $scope.layerControl;
                    $scope.showInfoControl = true;
                    $scope.showLegendControl = true;
                    $scope.showLegend = true;
                    $scope.overlays = new Array();
                    $scope.baseMaps = new Array();
                    $scope.baseMapLayers = new L.LayerGroup();
                    const spatialUnitLayerGroupName = "Raumeinheiten";
                    const georesourceLayerGroupName = "Georessourcen";
                    const poiLayerGroupName = "Points of Interest";
                    const indicatorLayerGroupName = "Indikatoren";
                    const reachabilityLayerGroupName = "Erreichbarkeiten";

                    // create classyBrew object
                    $scope.defaultBrew = new classyBrew();
                    $scope.gtMeasureOfValueBrew = new classyBrew();
                    $scope.ltMeasureOfValueBrew = new classyBrew();

                    $scope.currentIndicatorMetadataAndGeoJSON;
                    $scope.currentGeoJSONOfCurrentLayer;
                    $scope.currentIndicatorContainsZeroValues = false;
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

              			this.initializeMap = function() {

                      // initialize map referring to div element with id="map"


                      // create OSM tile layer with correct attribution
                      var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                      var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
                      var osm = new L.TileLayer(osmUrl, {minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel, attribution: osmAttrib});
                      // osm.StyledLayerControl = {
                    	// 	removable : false,
                    	// 	visible : false
                    	// };

                      var osm_blackWhite = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {minZoom: 1, maxZoom: 19, attribution: osmAttrib});
                      // osm_blackWhite.StyledLayerControl = {
                    	// 	removable : false,
                    	// 	visible : true
                    	// };

                      var wmsLayerRVR = L.tileLayer.wms('https://geodaten.metropoleruhr.de/spw2?', {
                          layers: 'stadtplan_rvr'
                      });
                      // wmsLayerRVR.StyledLayerControl = {
                    	// 	removable : false,
                    	// 	visible : false
                    	// };

                      // osm_blackWhite.addTo($scope.baseMapLayers);
                      // osm.addTo($scope.baseMapLayers);
                      // wmsLayerRVR.addTo($scope.baseMapLayers);

                      // $scope.map = L.map('map').setView([51.4386432, 7.0115552], 12);
                      $scope.map = L.map('map', {
                          center: [$scope.latCenter, $scope.lonCenter],
                          zoom: $scope.zoomLevel,
                          layers: [osm_blackWhite]
                      });

                      // var osmBaseMapGroup = {};
                      // osmBaseMapGroup.groupName = "Basiskarten";
                      // osmBaseMapGroup.expanded = true;
                      // osmBaseMapGroup.layers = {};
                      // osmBaseMapGroup.layers["RVR Stadtplan"] = wmsLayerRVR;
                      // osmBaseMapGroup.layers["OpenStreetMap - Graustufen"] = osm_blackWhite;
                      // osmBaseMapGroup.layers["OpenStreetMap"] = osm;

                      // $scope.baseMaps.push(osmBaseMapGroup);
                      $scope.baseMaps = {
                        "OpenStreetMap - Graustufen": osm_blackWhite,
                        "OpenStreetMap - Farbe": osm,
                        "RVR Stadtplan": wmsLayerRVR
                      };

                      // overlays
                    //   var overlays = [
                  	// 				 {
                  	// 					groupName : spatialUnitLayerGroupName,
                  	// 					expanded  : true,
                  	// 					layers    : {
                  	// 					}
                  	// 				 }, {
                  	// 					groupName : georesourceLayerGroupName,
                  	// 					expanded  : true,
                  	// 					layers    : {
                  	// 					}
                  	// 				 }, {
                  	// 					groupName : indicatorLayerGroupName,
                    //           expanded  : true,
                  	// 					layers    : {
                  	// 					}
                  	// 				 }, {
                  	// 					groupName : poiLayerGroupName,
                    //           expanded  : true,
                  	// 					layers    : {
                  	// 					}
                  	// 				 }, {
                  	// 					groupName : reachabilityLayerGroupName,
                    //           expanded  : true,
                  	// 					layers    : {
                  	// 					}
                  	// 				 }
                  	// ];

                    $scope.groupedOverlays = {
                      indicatorLayerGroupName: {

                      },
                      poiLayerGroupName: {

                      },
                      reachabilityLayerGroupName: {

                      }
                    };

                      // var options = {
                    	// 	container_width 	: "600px",
                    	// 	container_maxHeight : "600px",
                    	// 	group_maxHeight     : "80px",
                    	// 	exclusive       	: false,
                      //   position: 'topleft'
                    	// };

                      // $scope.layerControl = L.Control.styledLayerControl($scope.baseMaps, $scope.overlays, options);
                      $scope.layerControl = L.control.groupedLayers($scope.baseMaps, $scope.groupedOverlays, {position: 'topleft'});
	                    $scope.map.addControl($scope.layerControl);

                      $scope.scaleBar = L.control.scale();
                      $scope.scaleBar.addTo($scope.map);

                      $scope.loadingData = false;

              			}

                    $scope.$on("showLoadingIconOnMap", function (event) {
                      // console.log("Show loading icon on map");
                      $scope.loadingData = true;
                    });

                    $scope.$on("hideLoadingIconOnMap", function (event) {
                      // console.log("Hide loading icon on map");
                      $scope.loadingData = false;
                    });

                    $(document).on('change','#selectSpatialUnitViaInfoControl',function(){
                      var selector = document.getElementById('selectSpatialUnitViaInfoControl');
                      var spatialUnitLevel = selector[selector.selectedIndex].value;

                     $rootScope.$broadcast("changeSpatialUnitViaInfoControl", spatialUnitLevel);
                    });

                    $scope.$on("changeSpatialUnitViaInfoControl", function (event, spatialUnitLevel) {
                      //TODO
                      for (var i=0; i< kommonitorDataExchangeService.availableSpatialUnits.length; i++){
                        if(kommonitorDataExchangeService.availableSpatialUnits[i].spatialUnitLevel === spatialUnitLevel){
                            kommonitorDataExchangeService.selectedSpatialUnit = kommonitorDataExchangeService.availableSpatialUnits[i];
                            break;
                        }
                      }

                        $rootScope.$broadcast("changeSpatialUnit");

                    });


                    $scope.appendSpatialUnitOptions = function(){

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

                      var innerHTMLString = "<form>";
                      innerHTMLString += "<label>Raumebene:  ";
                      innerHTMLString += "<select id='selectSpatialUnitViaInfoControl'>";


                      for (var option of kommonitorDataExchangeService.availableSpatialUnits){

                        if (kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits.includes(option.spatialUnitLevel)){
                          innerHTMLString += ' <option value="' + option.spatialUnitLevel + '" ';
                          if (kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel === option.spatialUnitLevel){
                            innerHTMLString +=' selected ';
                          }
                          innerHTMLString +='>' + option.spatialUnitLevel + '</option>';
                        }
                      }
                      innerHTMLString += "</select>";
                      innerHTMLString += "</label>";
                      innerHTMLString += "</form>";
                      innerHTMLString += "<br/>";

                      return innerHTMLString;
                    };

                    function dateToTS (date) {
        								return date.valueOf();
        						}

        						function tsToDate (ts) {
        								var d = new Date(ts);

        								return d.toLocaleDateString("de-DE", {
        										year: 'numeric',
        										month: 'long',
        										day: 'numeric'
        								});
        						}

                    var toggleInfoControl = function(){
                      if($scope.showInfoControl === true){
                      /* use jquery to select your DOM elements that has the class 'legend' */
                         $('.info').hide();
                         $scope.showInfoControl = false;

                         $('#toggleInfoControlButton').show();
                      }else{
                         $('.info').show();
                         $scope.showInfoControl = true;

                         // button is defined in kommonitor-user-interface component
                         $('#toggleInfoControlButton').hide();
                      }
                    }

                    var toggleLegendControl = function(){
                      if($scope.showLegendControl === true){
                      /* use jquery to select your DOM elements that has the class 'legend' */
                         $('.legendMap').hide();
                         $scope.showLegendControl = false;

                         $('#toggleLegendControlButton').show();
                      }else{
                         $('.legendMap').show();
                         $scope.showLegendControl = true;

                         // button is defined in kommonitor-user-interface component
                         $('#toggleLegendControlButton').hide();
                      }
                    }

                    $scope.$on("toggleInfoControl", function(event){
                      toggleInfoControl();
                    });

                    $scope.$on("toggleLegendControl", function(event){
                      toggleLegendControl();
                    });

                    $(document).on('click','#info_close',function(e){
                      toggleInfoControl();
                    });

                    $(document).on('click','#legend_close',function(e){
                      toggleLegendControl();
                    });

                    $scope.appendInfoCloseButton = function(){
                      return '<div id="info_close" class="btn btn-link" style="right: 0px; position: relative; float: right;" title="schlie&szlig;en"><span class="glyphicon glyphicon-remove"></span></div>';
                    }

                    $scope.appendLegendCloseButton = function(){
                      return '<div id="legend_close" class="btn btn-link" style="right: 0px; position: relative; float: right;" title="schlie&szlig;en"><span class="glyphicon glyphicon-remove"></span></div>';
                    }

                    $scope.makeInfoControl = function(date, isCustomComputation){

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
                          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"

                          // [year, month, day]
            							var lastUpdateComponents = $scope.currentIndicatorMetadataAndGeoJSON.metadata.lastUpdate.split("-");
            							var lastUpdateAsDate = new Date(Number(lastUpdateComponents[0]), Number(lastUpdateComponents[1]) - 1, Number(lastUpdateComponents[2]));

                          this._div.innerHTML = $scope.appendInfoCloseButton();
                          this._div.innerHTML += '<div>';
                          var titel = $scope.indicatorName;

                          if(isCustomComputation){
                            titel += " - <i>individuelles Berechnungsergebnis</i>"
                          }

                          this._div.innerHTML += '<h4><b>Indikatoreninformation</b><br/>' + $scope.indicatorName + '</h4><br/>';
                          // this._div.innerHTML += '<p>' + $scope.indicatorDescription + '</p>'
                          this._div.innerHTML += '<b>Beschreibung: </b> ' + $scope.indicatorDescription + '<br/>';
                          this._div.innerHTML += '<b>Datenquelle: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.datasource + '<br/>';
                          this._div.innerHTML += '<b>Kontakt: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.contact + '<br/>';
                          this._div.innerHTML += '<b>Aktualisierungszyklus: </b> ' + $scope.updateInterval.get($scope.currentIndicatorMetadataAndGeoJSON.metadata.updateInterval.toUpperCase()) + '<br/>';
                          this._div.innerHTML += '<b>zuletzt aktualisiert am: </b> ' + tsToDate(dateToTS(lastUpdateAsDate)) + '<br/><br/>';
                          this._div.innerHTML += '<a href="IndicatorMetadata" download>Download Indikatorenbeschreibung</a><br/><br/>';


                          this._div.innerHTML += $scope.appendSpatialUnitOptions();
                          return this._div;
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
                          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"

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

                    $(document).on('click','#radiojenks',function(e){
                      $rootScope.$broadcast("changeClassifyMethod", "jenks");
                    });

                    $(document).on('click','#radioquantile',function(e){
                     $rootScope.$broadcast("changeClassifyMethod", "quantile");
                    });

                    $(document).on('click','#radioequal_interval',function(e){
                     $rootScope.$broadcast("changeClassifyMethod", "equal_interval");
                    });

                    $scope.$on("changeClassifyMethod", function (event, method) {
                      $scope.classifyMethod = method;

                      $rootScope.$broadcast("restyleCurrentLayer");
                    });


                    $scope.appendClassifyRadioOptions = function(){
                      var innerHTMLString = "<strong>Klassifizierungsmethode:</strong>";

                      // <label class="radio-inline"><input type="radio" name="optradio" checked>Option 1</label>
                      // <label class="radio-inline"><input type="radio" name="optradio">Option 2</label>
                      // <label class="radio-inline"><input type="radio" name="optradio">Option 3</label>

                      // angular
                        //<form>
                        //   <div ng-repeat="option in occurrenceOptions track by $index">
                        //     <input type="radio" name="occurrences" ng-value="option" ng-model="model.selectedOccurrence" />
                        //     <label>{{ option }}</label>
                        //   </div>
                        // </form>
                      innerHTMLString += "<form>";
                      innerHTMLString += '<div>';
                      for (var option of $scope.classifyMethods){
                        // innerHTMLString += ' <label class="radio-inline"><input type="radio" name="classifyMethod" onclick="onClickClassifyMethod(\'' + option.value + '\')" ';
                        innerHTMLString += ' <label class="radio-inline"><input id="radio' + option.value + '" type="radio" name="classifyMethod" ';
                        if ($scope.classifyMethod === option.value){
                          innerHTMLString +=' checked ';
                        }
                        innerHTMLString +='>' + option.name + '</label>';

                      }
                      innerHTMLString += "</div>";
                      innerHTMLString += "</form>";
                      innerHTMLString += "<br/>";

                      return innerHTMLString;
                    };

                    $scope.makeDefaultLegend = function(defaultClassificationMapping){

                      if($scope.legendControl){
                        try{
                          $scope.map.removeControl($scope.legendControl);
                          $scope.legendControl = undefined;
                        }
                        catch(error){
                        }
                      }

                      var dateComponents = $scope.date.split("-");
                      var dateAsDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));

                      $scope.legendControl = L.control({position: 'bottomright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'legendMap');
                            labels = $scope.defaultBrew.getBreaks();
                            colors = $scope.defaultBrew.getColors();

                        $scope.div.innerHTML = $scope.appendLegendCloseButton();
                        $scope.div.innerHTML += '<div>';

                        // loop through our density intervals and generate a label with a colored square for each interval
                        // for (var i = 0; i < labels.length; i++) {
                        //     $scope.div.innerHTML +=
                        //         '<i style="background:' + $scope.defaultBrew.getColorInRange(labels[i] + 1) + '"></i> ' +
                        //         labels[i] + (labels[i + 1] ? ' &ndash; &lt; ' + labels[i + 1] + '<br>' : '+');
                        // }

                        $scope.div.innerHTML += "<h4><b>Indikatorenlegende</b><br/>Status-Indikator</h4><br/><em>Darstellung der Indikatorenwerte zum gew&auml;hlten Zeitpunkt " + tsToDate(dateToTS(dateAsDate)) + "</em><br/><br/>";
                        $scope.div.innerHTML += "<label>Einheit: </label> " + $scope.indicatorUnit + "<br/>";

                        $scope.div.innerHTML += $scope.appendClassifyRadioOptions();

                        var useFilteredOrZeroValues = false;

                        if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.length > 0){
                          $scope.div.innerHTML +=
                              '<i style="background:' + defaultColorForFilteredValues + '; border: 2px solid ' + defaultBorderColorForFilteredValues + ';"></i> ' +
                              "gefilterte Features" + '<br>';
                              useFilteredOrZeroValues = true;
                        }

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '"></i> ' +
                              "0" + '<br>';
                              useFilteredOrZeroValues = true;
                        }

                        if(useFilteredOrZeroValues){
                          $scope.div.innerHTML += '<br/>';
                        }

                        //TODO FIXME defaultCustomRating comes in the wrong order! inspect that behaviour server-side
                        for (var i = 0; i < colors.length; i++) {
                            $scope.div.innerHTML +=
                                // '<i style="background:' + colors[i] + '"></i> ' +
                                // defaultClassificationMapping.items[defaultClassificationMapping.items.length - 1 - i].defaultCustomRating + ' (' + (+labels[i].toFixed(numberOfDecimals)) + ((+labels[i + 1]) ? ' &ndash; &lt; ' + (+labels[i + 1].toFixed(numberOfDecimals)) + ') <br>' : '+');
                                '<i style="background:' + colors[i] + '"></i> ' +
                                (Number(labels[i]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + ((Number(labels[i + 1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) ? ' &ndash; &lt; ' + (Number(labels[i + 1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + ' <br>' : '+');
                        }

                        $scope.div.innerHTML += '</div>';

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

                      $scope.legendControl = L.control({position: 'bottomright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'legendMap');

                        $scope.div.innerHTML = $scope.appendLegendCloseButton();
                        $scope.div.innerHTML += '<div>';

                        if($scope.currentIndicatorMetadataAndGeoJSON['fromDate']){
                          $scope.div.innerHTML += "<h4><b>Indikatorenlegende</b><br/>Bilanzierung</h4><br/>";
                          $scope.div.innerHTML += "<em>" + $scope.currentIndicatorMetadataAndGeoJSON['fromDate'] + " - " + $scope.currentIndicatorMetadataAndGeoJSON['toDate'] + "</em><br/><br/>";
                        }
                        else{

                          var dateComponents = $scope.date.split("-");
                          var dateAsDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));
                          $scope.div.innerHTML += "<h4><b>Indikatorenlegende</b><br/>Dynamik-Indikator</h4><br/><em>Darstellung der zeitlichen Entwicklung zum gew&auml;hlten Zeitpunkt " + tsToDate(dateToTS(dateAsDate)) + "</em><br/><br/>";
                        }

                        $scope.div.innerHTML += "<label>Einheit: </label> " + $scope.indicatorUnit + "<br/>";

                        $scope.div.innerHTML += $scope.appendClassifyRadioOptions();

                        if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.length > 0){
                          $scope.div.innerHTML +=
                              '<i style="background:' + defaultColorForFilteredValues + '; border: 2px solid ' + defaultBorderColorForFilteredValues + ';"></i> ' +
                              "gefilterte Features" + '<br/>';
                        }

                        // dynamic legend creation depending on number of positive and negative classes
                        if($scope.dynamicDecreaseBrew){
                          labelsDynamicDecrease = $scope.dynamicDecreaseBrew.breaks;
                          colorsDynamicDecrease = $scope.dynamicDecreaseBrew.colors;

                          $scope.div.innerHTML += "<label>Sinkende Entwicklung</label><br/>";

                            // invert color labeling as colorization of lT features is also inverted
                            for (var i = 0; i < colorsDynamicDecrease.length; i++) {
                                $scope.div.innerHTML +=
                                    '<i style="background:' + colorsDynamicDecrease[colorsDynamicDecrease.length - 1 - i] + '"></i> ' +
                                    (Number(labelsDynamicDecrease[i]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + (typeof labelsDynamicDecrease[i + 1] != 'undefined' ? ' &ndash; &lt; ' + (Number(labelsDynamicDecrease[i + 1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + '<br>' : ' &ndash; &lt; 0');
                            }

                        }

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML += "<br/>";
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '"></i> ' +
                              "0" + '</br>';
                        }

                        if($scope.dynamicIncreaseBrew){
                          $scope.div.innerHTML += "<br/>";
                          labelsDynamicIncrease = $scope.dynamicIncreaseBrew.breaks;
                          colorsDynamicIncrease = $scope.dynamicIncreaseBrew.colors;

                          $scope.div.innerHTML += "<label>Steigende Entwicklung</label><br/>";

                            // invert color labeling as colorization of lT features is also inverted
                            for (var i = 0; i < colorsDynamicIncrease.length; i++) {
                                $scope.div.innerHTML +=
                                    '<i style="background:' + colorsDynamicIncrease[i] + '"></i> ' +
                                    (Number(labelsDynamicIncrease[i]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + (typeof labelsDynamicIncrease[i + 1] === 'undefined' ? '' : ' &ndash; &lt; ' + (Number(labelsDynamicIncrease[i + 1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + '<br>');
                            }
                          $scope.div.innerHTML += "<br/>";
                        }

                        $scope.div.innerHTML += '</div>';

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

                      var dateComponents = $scope.date.split("-");
                      var dateAsDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));

                      $scope.legendControl = L.control({position: 'bottomright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'legendMap');

                        $scope.div.innerHTML = $scope.appendLegendCloseButton();
                        $scope.div.innerHTML += '<div>';

                        $scope.div.innerHTML += "<h4><b>Indikatorenlegende</b><br/>Schwellwert-Klassifizierung</h4><br/><em>Gew&auml;hlter Zeitpunkt: " + tsToDate(dateToTS(dateAsDate)) + "</em><br/>";

                        $scope.div.innerHTML += "<em>aktueller Schwellwert: </em> " + kommonitorDataExchangeService.measureOfValue + "<br/><br/>";

                        $scope.div.innerHTML += "<label>Einheit: </label> " + $scope.indicatorUnit + "<br/>";

                        $scope.div.innerHTML += $scope.appendClassifyRadioOptions();

                        if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.length > 0){
                          $scope.div.innerHTML +=
                              '<i style="background:' + defaultColorForFilteredValues + '; border: 2px solid ' + defaultBorderColorForFilteredValues + ';"></i> ' +
                              "gefilterte Features" + '</br>';
                        }

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '"></i> ' +
                              "0" + '<br>';
                        }

                        // loop through our density intervals and generate a label with a colored square for each interval
                        // for (var i = 0; i < labels.length; i++) {
                        //     $scope.div.innerHTML +=
                        //         '<i style="background:' + $scope.defaultBrew.getColorInRange(labels[i] + 1) + '"></i> ' +
                        //         labels[i] + (labels[i + 1] ? ' &ndash; &lt; ' + labels[i + 1] + '<br>' : '+');
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
                          //         //(+labelsLtMeasureOfValue[i].toFixed(4)) + ((+labelsLtMeasureOfValue[i + 1].toFixed(4)) ? ' &ndash; &lt; ' + (+labelsLtMeasureOfValue[i + 1].toFixed(4)) + '<br>' : '+');
                          //         labelArray_below[i] + ' (' + (+labelsLtMeasureOfValue[i].toFixed(numberOfDecimals)) + ((+labelsLtMeasureOfValue[i + 1]) ? ' &ndash; &lt; ' + (+labelsLtMeasureOfValue[i + 1].toFixed(numberOfDecimals)) + ') <br>' : '+');
                          // }
                          for (var i = 0; i < colorsLtMeasureOfValue.length; i++) {
                              $scope.div.innerHTML +=
                                  '<i style="background:' + colorsLtMeasureOfValue[colorsLtMeasureOfValue.length - 1 -i] + '"></i> ' +
                                  (Number(labelsLtMeasureOfValue[i]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + (typeof labelsLtMeasureOfValue[i + 1] === 'undefined' ? '' : ' &ndash; &lt; ' + (Number(labelsLtMeasureOfValue[i + 1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + '</br>');
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
                          //         labelArray_upper[i] + ' (' + (+labelsGtMeasureOfValue[i].toFixed(numberOfDecimals)) + ((+labelsGtMeasureOfValue[i + 1]) ? ' &ndash; &lt; ' + (+labelsGtMeasureOfValue[i + 1].toFixed(numberOfDecimals)) + ') <br>' : '+');
                          // }
                          for (var i = 0; i < colorsGtMeasureOfValue.length; i++) {
                              $scope.div.innerHTML +=
                                  '<i style="background:' + colorsGtMeasureOfValue[i] + '"></i> ' +
                                  (Number(labelsGtMeasureOfValue[i]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + (typeof labelsGtMeasureOfValue[i + 1] === 'undefined' ? '' : ' &ndash; &lt; ' + (Number(labelsGtMeasureOfValue[i + 1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + '<br>');
                          }
                        }

                        $scope.div.innerHTML += '</div>';

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
                      var tooltipHtml = "<b>" + feature.properties.spatialUnitFeatureName + "</b><br/>" + Number(feature.properties[INDICATOR_DATE_PREFIX + $scope.date]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals}) + " [" + kommonitorDataExchangeService.selectedIndicator.unit + "]";
                        layer.bindTooltip(tooltipHtml, {
                          sticky: true // If true, the tooltip will follow the mouse instead of being fixed at the feature center.
                        });
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

                                  // layer.StyledLayerControl = {
                                	// 	removable : true,
                                	// 	visible : true
                                	// };

                                  $scope.layerControl.addOverlay( layer, "GeoPackage", {groupName : spatialUnitLayerGroupName} );
                                  layer.addTo($scope.map);


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

                                  // layer.StyledLayerControl = {
                                	// 	removable : true,
                                	// 	visible : true
                                	// };

                                  $scope.layerControl.addOverlay( layer, spatialUnitMetadataAndGeoJSON.spatialUnitLevel + "_" + date, spatialUnitLayerGroupName );
                                  layer.addTo($scope.map);

                              });

                              $scope.$on("addGeoresourceAsGeoJSON", function (event, georesourceMetadataAndGeoJSON, date) {

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

                                // layer.StyledLayerControl = {
                                //   removable : false,
                                //   visible : true
                                // };

                                $scope.layerControl.addOverlay( layer, georesourceMetadataAndGeoJSON.datasetName + "_" + date, georesourceLayerGroupName );
                                layer.addTo($scope.map);
                              });

                              $scope.$on("replaceIsochronesAsGeoJSON", function (event, geoJSON, transitMode, reachMode, cutOffValues, cutOffUnit) {

                                if($scope.isochronesLayer){
                                  $scope.layerControl.removeLayer($scope.isochronesLayer);
                                  $scope.map.removeLayer($scope.isochronesLayer);
                                }

                                $scope.isochronesLayer = L.featureGroup();

                                kommonitorDataExchangeService.isochroneLegend = {
                                  transitMode: transitMode,
                                  reachMode: reachMode,
                                  colorValueEntries: [],
                                  cutOffValues: cutOffValues,
                                  cutOffUnit: cutOffUnit
                                };

                                var numFeatures = geoJSON.features.length;

                                if(cutOffValues.length === 0){
                                  return;
                                }
                                else if(cutOffValues.length === 1){
                                  kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
                                    color: "green",
                                    value: cutOffValues[0]
                                  }];
                                }
                                else if(cutOffValues.length === 2){
                                  kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
                                    color: "yellow",
                                    value: cutOffValues[1]
                                  },
                                  {
                                    color: "green",
                                    value: cutOffValues[0]
                                  }]
                                }
                                else if(cutOffValues.length === 3){
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
                                  }]
                                }
                                else if(cutOffValues.length === 4){
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
                                  }]
                                }
                                else if(cutOffValues.length === 5){
                                  kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
                                    color: "brown",
                                    value: cutOffValues[4]
                                  },{
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
                                  }]
                                }
                                else{
                                  kommonitorDataExchangeService.isochroneLegend.colorValueEntries = [{
                                    color: "brown",
                                    value: cutOffValues[4]
                                  },{
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
                                  }]
                                }

                                for(var index=numFeatures-1; index>=0; index--){

                                  var styleIndex = (numFeatures-index-1) % (kommonitorDataExchangeService.isochroneLegend.colorValueEntries.length);

                                  var style = {
                                    color: kommonitorDataExchangeService.isochroneLegend.colorValueEntries[styleIndex].color,
                                    weight: 2,
                                    opacity: 1
                                  };

                                  L.geoJSON(geoJSON.features[index], {
                                      style: style,
                                      onEachFeature: function(feature, layer){
                                        layer.on({
                                            click: function () {

                                                 var popupContent = "" + layer.feature.properties.value + " Sekunden (" + Number(layer.feature.properties.value/60).toLocaleString("de-DE", {maximumFractionDigits: 2}) + " Minuten)";
                                                 // var popupContent = "TestValue";

                                                if (popupContent)
                                                    layer.bindPopup("Isochrone: " + JSON.stringify(popupContent));
                                            }
                                        })
                                      }
                                  }).addTo($scope.isochronesLayer);
                                }

                                // $scope.isochronesLayer.StyledLayerControl = {
                                //   removable : false,
                                //   visible : true
                                // };

                                $scope.layerControl.addOverlay( $scope.isochronesLayer, "Erreichbarkeits-Isochronen 5-15 Minuten per " + transitMode, reachabilityLayerGroupName );
                                $scope.isochronesLayer.addTo($scope.map);
                              });

                              $scope.$on("replaceIsochroneMarker", function (event, latitude, longitude) {

                                if($scope.isochroneMarkerLayer){
                                  $scope.layerControl.removeLayer($scope.isochroneMarkerLayer);
                                  $scope.map.removeLayer($scope.isochroneMarkerLayer);
                                }

                                $scope.isochroneMarkerLayer = L.marker([latitude, longitude]);
                                $scope.isochroneMarkerLayer.bindPopup("Startpunkt der Isochronenberechnung");

                                // $scope.isochroneMarkerLayer.StyledLayerControl = {
                                //   removable : false,
                                //   visible : true
                                // };

                                $scope.layerControl.addOverlay( $scope.isochroneMarkerLayer, "Startpunkt für Isochronenberechnung", reachabilityLayerGroupName );
                                $scope.isochroneMarkerLayer.addTo($scope.map);
                              });

                              $scope.$on("addPoiGeoresourceAsGeoJSON", function (event, georesourceMetadataAndGeoJSON, date) {

                                // use leaflet.markercluster to cluster markers!
                                var markers = L.markerClusterGroup();
                                var customMarker;
                                try{
                                  customMarker = L.AwesomeMarkers.icon({
                                    icon: georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name,
                                    iconColor: georesourceMetadataAndGeoJSON.poiSymbolColor,
                                    markerColor: georesourceMetadataAndGeoJSON.poiMarkerColor
                                  });
                                }catch(err){
                                  customMarker = L.AwesomeMarkers.icon({
                                    icon: 'home', // default back to home
                                    iconColor: georesourceMetadataAndGeoJSON.poiSymbolColor,
                                    markerColor: georesourceMetadataAndGeoJSON.poiMarkerColor
                                  });
                                }

                                georesourceMetadataAndGeoJSON.geoJSON.features.forEach(function(poiFeature){
                                  // index 0 should be longitude and index 1 should be latitude
                                  var newMarker = L.marker( [Number(poiFeature.geometry.coordinates[1]), Number(poiFeature.geometry.coordinates[0])], {icon: customMarker} ).bindPopup( poiFeature.properties.name );
                                    markers.addLayer(newMarker);
                                });


                                // markers.StyledLayerControl = {
                                //   removable : false,
                                //   visible : true
                                // };

                                $scope.layerControl.addOverlay( markers, georesourceMetadataAndGeoJSON.datasetName + "_" + date, poiLayerGroupName );
                                markers.addTo($scope.map);
                                // $scope.map.addLayer( markers );
                              });

                              $scope.$on("removePoiGeoresource", function (event, georesourceMetadataAndGeoJSON) {

                                var layerName = georesourceMetadataAndGeoJSON.datasetName;

                                $scope.layerControl._layers.forEach(function(layer){
                                  if(layer.group.name === poiLayerGroupName && layer.name.includes(layerName)){
                                    $scope.layerControl.removeLayer(layer.layer);
                                    $scope.map.removeLayer(layer.layer);
                                  }
                                });
                              });

                              $scope.$on("removeReachabilityLayers", function (event) {

                                var layerNamePartly = "Isochrone";

                                $scope.layerControl._layers.forEach(function(layer){
                                  if(layer.group.name === reachabilityLayerGroupName && layer.name.includes(layerNamePartly)){
                                    $scope.layerControl.removeLayer(layer.layer);
                                    $scope.map.removeLayer(layer.layer);
                                  }
                                });
                              });

                                        var setupDefaultBrew = function(geoJSON, propertyName, numClasses, colorCode, classifyMethod){
                                          // pass values from your geojson object into an empty array
                                          // see link above to view geojson used in this example
                                          var values = [];
                                          for (var i = 0; i < geoJSON.features.length; i++){
                                              if (geoJSON.features[i].properties[propertyName] == null || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
                                                continue;
                                              values.push(+Number(geoJSON.features[i].properties[propertyName]).toFixed(numberOfDecimals));
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

                                            if(geoJSON.features[i].properties.spatialUnitFeatureName === "Heidhausen"){
                                              console.log("");
                                            }

                                              if (geoJSON.features[i].properties[propertyName] == null || geoJSON.features[i].properties[propertyName] == 0 || geoJSON.features[i].properties[propertyName] == "0")
                                                continue;
                                              else if(+Number(geoJSON.features[i].properties[propertyName]).toFixed(numberOfDecimals) >= +Number(measureOfValue).toFixed(numberOfDecimals))
                                                greaterThanValues.push(+Number(geoJSON.features[i].properties[propertyName]).toFixed(numberOfDecimals));
                                              else
                                                lesserThanValues.push(+Number(geoJSON.features[i].properties[propertyName]).toFixed(numberOfDecimals));
                                          }

                                          setupGtMeasureOfValueBrew(greaterThanValues, colorCodeForGreaterThanValues, classifyMethod);
                                          setupLtMeasureOfValueBrew(lesserThanValues, colorCodeForLesserThanValues, classifyMethod);
                                        }

                                        var setupGtMeasureOfValueBrew = function(greaterThanValues, colorCodeForGreaterThanValues, classifyMethod){
                                          var tempBrew = new classyBrew();
                                          // if(greaterThanValues.length > 5){
                                          //   // pass array to our classyBrew series
                                          //   tempBrew.setSeries(greaterThanValues);
                                          //   // define number of classes
                                          //   tempBrew.setNumClasses(5);
                                          //   // set color ramp code
                                          //   tempBrew.setColorCode(colorCodeForGreaterThanValues);
                                          //   // classify by passing in statistical method
                                          //   // i.e. equal_interval, jenks, quantile
                                          //   tempBrew.classify(classifyMethod);
                                          //
                                          //   $scope.gtMeasureOfValueBrew.colors = tempBrew.getColors();
                                          //   $scope.gtMeasureOfValueBrew.breaks = tempBrew.getBreaks();
                                          // }
                                          // else if(greaterThanValues.length === 4 || greaterThanValues.length === 5){
                                          //   // pass array to our classyBrew series
                                          //   tempBrew.setSeries(greaterThanValues);
                                          //   // define number of classes
                                          //   tempBrew.setNumClasses(3);
                                          //   // set color ramp code
                                          //   tempBrew.setColorCode(colorCodeForGreaterThanValues);
                                          //   // classify by passing in statistical method
                                          //   // i.e. equal_interval, jenks, quantile
                                          //   tempBrew.classify(classifyMethod);
                                          //
                                          //   $scope.gtMeasureOfValueBrew.colors = tempBrew.getColors();
                                          //   $scope.gtMeasureOfValueBrew.breaks = tempBrew.getBreaks();
                                          // }
                                          if(greaterThanValues.length === 4 || greaterThanValues.length >= 5){
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
                                          // if(lesserThanValues.length > 5){
                                          //   // pass array to our classyBrew series
                                          //   tempBrew.setSeries(lesserThanValues);
                                          //   // define number of classes
                                          //   tempBrew.setNumClasses(5);
                                          //   // set color ramp code
                                          //   tempBrew.setColorCode(colorCodeForLesserThanValues);
                                          //   // classify by passing in statistical method
                                          //   // i.e. equal_interval, jenks, quantile
                                          //   tempBrew.classify(classifyMethod);
                                          //
                                          //   $scope.ltMeasureOfValueBrew.colors = tempBrew.getColors();
                                          //   $scope.ltMeasureOfValueBrew.breaks = tempBrew.getBreaks();
                                          // }
                                          // else if(lesserThanValues.length === 4 || lesserThanValues.length === 5){
                                          //   // pass array to our classyBrew series
                                          //   tempBrew.setSeries(lesserThanValues);
                                          //   // define number of classes
                                          //   tempBrew.setNumClasses(3);
                                          //   // set color ramp code
                                          //   tempBrew.setColorCode(colorCodeForLesserThanValues);
                                          //   // classify by passing in statistical method
                                          //   // i.e. equal_interval, jenks, quantile
                                          //   tempBrew.classify(classifyMethod);
                                          //
                                          //   $scope.ltMeasureOfValueBrew.colors = tempBrew.getColors();
                                          //   $scope.ltMeasureOfValueBrew.breaks = tempBrew.getBreaks();
                                          // }
                                          if(lesserThanValues.length === 4 || lesserThanValues.length >= 5){
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
                                              else if(+Number(geoJSON.features[i].properties[propertyName]).toFixed(numberOfDecimals) > 0)
                                                positiveValues.push(+Number(geoJSON.features[i].properties[propertyName]).toFixed(numberOfDecimals));
                                              else
                                                negativeValues.push(+Number(geoJSON.features[i].properties[propertyName]).toFixed(numberOfDecimals));
                                          }

                                          setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod);
                                          setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod);
                                        }

                                        function setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod){
                                          // analyse length of value arrays

                                          var tempBrew = new classyBrew();
                                          // if(positiveValues.length > 5){
                                          //   // pass array to our classyBrew series
                                          //   tempBrew.setSeries(positiveValues);
                                          //   // define number of classes
                                          //   tempBrew.setNumClasses(5);
                                          //   // set color ramp code
                                          //   tempBrew.setColorCode(colorCodeForPositiveValues);
                                          //   // classify by passing in statistical method
                                          //   // i.e. equal_interval, jenks, quantile
                                          //   tempBrew.classify(classifyMethod);
                                          //
                                          //   $scope.dynamicIncreaseBrew.colors = tempBrew.getColors();
                                          //   $scope.dynamicIncreaseBrew.breaks = tempBrew.getBreaks();
                                          // }
                                          // else if(positiveValues.length === 4 || positiveValues.length === 5){
                                          //   // pass array to our classyBrew series
                                          //   tempBrew.setSeries(positiveValues);
                                          //   // define number of classes
                                          //   tempBrew.setNumClasses(3);
                                          //   // set color ramp code
                                          //   tempBrew.setColorCode(colorCodeForPositiveValues);
                                          //   // classify by passing in statistical method
                                          //   // i.e. equal_interval, jenks, quantile
                                          //   tempBrew.classify(classifyMethod);
                                          //
                                          //   $scope.dynamicIncreaseBrew.colors = tempBrew.getColors();
                                          //   $scope.dynamicIncreaseBrew.breaks = tempBrew.getBreaks();
                                          // }
                                          if(positiveValues.length === 4 || positiveValues.length >= 5){
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
                                          // if(negativeValues.length > 5){
                                          //   // pass array to our classyBrew series
                                          //   tempBrew.setSeries(negativeValues);
                                          //   // define number of classes
                                          //   tempBrew.setNumClasses(5);
                                          //   // set color ramp code
                                          //   tempBrew.setColorCode(colorCodeForNegativeValues);
                                          //   // classify by passing in statistical method
                                          //   // i.e. equal_interval, jenks, quantile
                                          //   tempBrew.classify(classifyMethod);
                                          //
                                          //   $scope.dynamicDecreaseBrew.colors = tempBrew.getColors();
                                          //   $scope.dynamicDecreaseBrew.breaks = tempBrew.getBreaks();
                                          // }
                                          // else if(negativeValues.length === 4 || negativeValues.length === 5){
                                          //   // pass array to our classyBrew series
                                          //   tempBrew.setSeries(negativeValues);
                                          //   // define number of classes
                                          //   tempBrew.setNumClasses(3);
                                          //   // set color ramp code
                                          //   tempBrew.setColorCode(colorCodeForNegativeValues);
                                          //   // classify by passing in statistical method
                                          //   // i.e. equal_interval, jenks, quantile
                                          //   tempBrew.classify(classifyMethod);
                                          //
                                          //   $scope.dynamicDecreaseBrew.colors = tempBrew.getColors();
                                          //   $scope.dynamicDecreaseBrew.breaks = tempBrew.getBreaks();
                                          // }
                                          if(negativeValues.length === 4 || negativeValues.length >= 5){
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

                                          var fillOpacity = defaultFillOpacity;
                                          var fillColor;
                                          if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                            fillColor = $scope.defaultColorForZeroValues;
                                            var fillOpacity = defaultFillOpacityForZeroFeatures;
                                          }
                                          else{
                                            fillColor = $scope.defaultBrew.getColorInRange(+Number(feature.properties[$scope.propertyName]).toFixed(numberOfDecimals));
                                          }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: defaultBorderColor,
                                                dashArray: '',
                                                fillOpacity: fillOpacity,
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
                                                color: defaultBorderColor,
                                                dashArray: '',
                                                fillOpacity: defaultFillOpacity,
                                                fillColor: fillColor
                                            }
                                        }

                                        function styleMeasureOfValue (feature) {

                                          var fillOpacity = defaultFillOpacity;

                                          if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) >= kommonitorDataExchangeService.measureOfValue){
                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                              var fillOpacity = defaultFillOpacityForZeroFeatures;
                                            }
                                            else{



                                              for (var index=0; index < $scope.gtMeasureOfValueBrew.breaks.length; index++){

                                                if(+Number(feature.properties[$scope.propertyName]).toFixed(numberOfDecimals) == +Number($scope.gtMeasureOfValueBrew.breaks[index]).toFixed(numberOfDecimals)){
                                                  if(index < $scope.gtMeasureOfValueBrew.breaks.length -1){
                                                    // min value
                                                    fillColor =  $scope.gtMeasureOfValueBrew.colors[index];
                                                    break;
                                                  }
                                                  else {
                                                    //max value
                                                    if ($scope.gtMeasureOfValueBrew.colors[index]){
                                                      fillColor =  $scope.gtMeasureOfValueBrew.colors[index];
                                                    }
                                                    else{
                                                      fillColor =  $scope.gtMeasureOfValueBrew.colors[index - 1];
                                                    }
                                                    break;
                                                  }
                                                }
                                                else{
                                                  if(+Number(feature.properties[$scope.propertyName]).toFixed(numberOfDecimals) < +Number($scope.gtMeasureOfValueBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
                                      							fillColor =  $scope.gtMeasureOfValueBrew.colors[index];
                                                    break;
                                      						}
                                                }
                                              }
                                            }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: defaultBorderColor,
                                                dashArray: '',
                                                fillOpacity: fillOpacity,
                                                fillColor: fillColor
                                            }
                                          }
                                          else{

                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                              var fillOpacity = defaultFillOpacityForZeroFeatures;
                                            }
                                            else{
                                              // invert colors, so that lowest values will become strong colored!
                                              for (var index=0; index < $scope.ltMeasureOfValueBrew.breaks.length; index++){
                                                if(+Number(feature.properties[$scope.propertyName]).toFixed(numberOfDecimals) == +Number($scope.ltMeasureOfValueBrew.breaks[index]).toFixed(numberOfDecimals)){
                                                  if(index < $scope.ltMeasureOfValueBrew.breaks.length -1){
                                                    // min value
                                                    fillColor =  $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index - 1];
                                                    break;
                                                  }
                                                  else {
                                                    //max value
                                                    if ($scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index]){
                                                      fillColor =  $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index];
                                                    }
                                                    else{
                                                      fillColor =  $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index - 1];
                                                    }
                                                    break;
                                                  }
                                                }
                                                else{
                                                  if(+Number(feature.properties[$scope.propertyName]).toFixed(numberOfDecimals) < +Number($scope.ltMeasureOfValueBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
                                      							fillColor =  $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index - 1];
                                                    break;
                                      						}
                                                }
                                              }
                                            }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: defaultBorderColor,
                                                dashArray: '',
                                                fillOpacity: fillOpacity,
                                                fillColor: fillColor
                                            }
                                          }

                                        }

                                        function styleDynamicIndicator (feature) {

                                          var fillOpacity = defaultFillOpacity;

                                          if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) >= 0){
                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                              var fillOpacity = defaultFillOpacityForZeroFeatures;
                                            }
                                            else{
                                              for (var index=0; index < $scope.dynamicIncreaseBrew.breaks.length; index++){
                                                if(+Number(feature.properties[$scope.propertyName]).toFixed(numberOfDecimals) == +Number($scope.dynamicIncreaseBrew.breaks[index]).toFixed(numberOfDecimals)){
                                                  if(index < $scope.dynamicIncreaseBrew.breaks.length -1){
                                                    // min value
                                                    fillColor =  $scope.dynamicIncreaseBrew.colors[index];
                                                    break;
                                                  }
                                                  else {
                                                    //max value
                                                    if ($scope.dynamicIncreaseBrew.colors[index]){
                                                      fillColor =  $scope.dynamicIncreaseBrew.colors[index];
                                                    }
                                                    else{
                                                      fillColor =  $scope.dynamicIncreaseBrew.colors[index - 1];
                                                    }
                                                    break;
                                                  }
                                                }
                                                else{
                                                  if(+Number(feature.properties[$scope.propertyName]).toFixed(numberOfDecimals) < +Number($scope.dynamicIncreaseBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
                                      							fillColor =  $scope.dynamicIncreaseBrew.colors[index];
                                                    break;
                                      						}
                                                }
                                              }
                                            }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: defaultBorderColor,
                                                dashArray: '',
                                                fillOpacity: fillOpacity,
                                                fillColor: fillColor
                                            }
                                          }
                                          else{

                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                              var fillOpacity = defaultFillOpacityForZeroFeatures;
                                            }
                                            else{
                                              // invert colors, so that lowest values will become strong colored!
                                              for (var index=0; index < $scope.dynamicDecreaseBrew.breaks.length; index++){
                                                if(+Number(feature.properties[$scope.propertyName]).toFixed(numberOfDecimals) == +Number($scope.dynamicDecreaseBrew.breaks[index]).toFixed(numberOfDecimals)){
                                                  if(index < $scope.dynamicDecreaseBrew.breaks.length -1){
                                                    // min value
                                                    fillColor =  $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index - 1];
                                                    break;
                                                  }
                                                  else {
                                                    //max value
                                                    if ($scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index]){
                                                      fillColor =  $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index];
                                                    }
                                                    else{
                                                      fillColor =  $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index - 1];
                                                    }
                                                    break;
                                                  }
                                                }
                                                else{
                                                  if(+Number(feature.properties[$scope.propertyName]).toFixed(numberOfDecimals) < +Number($scope.dynamicDecreaseBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
                                      							fillColor =  $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index - 1];
                                                    break;
                                      						}
                                                }
                                              }
                                            }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: defaultBorderColor,
                                                dashArray: '',
                                                fillOpacity: fillOpacity,
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
                                                fillOpacity: defaultFillOpacity
                                            });

                                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                                layer.bringToFront();
                                            }

                                            // update diagrams for hovered feature
                                            $rootScope.$broadcast("updateDiagramsForHoveredFeature", layer.feature.properties);

                                        }

                                        function highlightClickedFeature(layer) {

                                            layer.setStyle({
                                                weight: 6,
                                                color: '#42e5f4',
                                                dashArray: '',
                                                fillOpacity: defaultFillOpacityForHighlightedFeatures
                                            });

                                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                                layer.bringToFront();
                                            }

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
                                            if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                              layer.setStyle($scope.filteredStyle);
                                            }
                                            else if(! kommonitorDataExchangeService.isMeasureOfValueChecked){
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

                                            //update diagrams for unhoveredFeature
                                            $rootScope.$broadcast("updateDiagramsForUnhoveredFeature", layer.feature.properties);
                                        }

                                        function resetHighlightClickedFeature(layer) {
                                          //$scope.currentIndicatorLayer.resetStyle(layer);
                                          if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                            layer.setStyle($scope.filteredStyle);
                                          }
                                          else if(! kommonitorDataExchangeService.isMeasureOfValueChecked){
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

                                                  $scope.$on("replaceIndicatorAsGeoJSON", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation) {

                                                                console.log('replaceIndicatorAsGeoJSON was called');

                                                                $scope.currentIndicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;

                                                                if (!justRestyling){
                                                                  // empty layer of possibly selected features
                                                                  kommonitorDataExchangeService.clickedIndicatorFeatureNames = [];
                                                                  kommonitorDataExchangeService.filteredIndicatorFeatureNames = [];

                                                                  $rootScope.$broadcast("checkBalanceMenueAndButton");
                                                                }

                                                                console.log("Remove old indicatorLayer if exists");
                                                                if($scope.currentIndicatorLayer){
                                                                  $scope.layerControl.removeLayer($scope.currentIndicatorLayer);
                                                                  $scope.map.removeLayer($scope.currentIndicatorLayer);
                                                                }

                                                                $scope.currentIndicatorContainsZeroValues = false;

                                                                // check if measureOfValueCheckbox is checked

                                                                $scope.date = date;

                                                                $scope.indicatorPropertyName = INDICATOR_DATE_PREFIX + date;
                                                                $scope.indicatorName = indicatorMetadataAndGeoJSON.indicatorName;
                                                                $scope.indicatorDescription = indicatorMetadataAndGeoJSON.metadata.description;
                                                                $scope.indicatorUnit = indicatorMetadataAndGeoJSON.unit;

                                                                $scope.currentGeoJSONOfCurrentLayer = indicatorMetadataAndGeoJSON.geoJSON;

                                                                for (var i = 0; i < indicatorMetadataAndGeoJSON.geoJSON.features.length; i++){
                                                                    if (indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName] === 0 || indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName] === "0"){
                                                                      $scope.currentIndicatorContainsZeroValues = true;
                                                                      break;
                                                                    };
                                                                }

                                                                var layer;

                                                                $scope.indicatorTypeOfCurrentLayer = indicatorMetadataAndGeoJSON.indicatorType;

                                                                if(kommonitorDataExchangeService.isMeasureOfValueChecked){
                                                                  setupMeasureOfValueBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, "YlOrBr", "Purples", $scope.classifyMethod, kommonitorDataExchangeService.measureOfValue);
                                                                  $scope.propertyName = INDICATOR_DATE_PREFIX + date;

                                                                  layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                      style: styleMeasureOfValue,
                                                                      onEachFeature: onEachFeatureIndicator
                                                                  });

                                                                  $scope.makeInfoControl(date, isCustomComputation);
                                                                  $scope.makeMeasureOfValueLegend();

                                                                }
                                                                else{

                                                                  if (indicatorMetadataAndGeoJSON.indicatorType === "STATUS"){
                                                                    setupDefaultBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, indicatorMetadataAndGeoJSON.defaultClassificationMapping.items.length, indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, $scope.classifyMethod);
                                                                    $scope.propertyName = INDICATOR_DATE_PREFIX + date;

                                                                    layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                        style: styleDefault,
                                                                        onEachFeature: onEachFeatureIndicator
                                                                    });
                                                                    $scope.makeInfoControl(date, isCustomComputation);
                                                                    $scope.makeDefaultLegend(indicatorMetadataAndGeoJSON.defaultClassificationMapping);
                                                                  }
                                                                  else if (indicatorMetadataAndGeoJSON.indicatorType === "DYNAMIC"){
                                                                    setupDynamicIndicatorBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, "Greens", "Reds", $scope.classifyMethod);
                                                                    $scope.propertyName = INDICATOR_DATE_PREFIX + date;

                                                                    layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                        style: styleDynamicIndicator,
                                                                        onEachFeature: onEachFeatureIndicator
                                                                    });
                                                                    $scope.makeInfoControl(date, isCustomComputation);
                                                                    $scope.makeDynamicIndicatorLegend();
                                                                  }


                                                                }

                                                                $scope.currentIndicatorLayer = layer;

                                                                // layer.StyledLayerControl = {
                                                                //   removable : false,
                                                                //   visible : true
                                                                // };

                                                                var layerName = indicatorMetadataAndGeoJSON.indicatorName + "_" + spatialUnitName + "_" + date;

                                                                if(isCustomComputation){
                                                                  layerName += " - individuelles Berechnungsergebnis";
                                                                }
                                                                $scope.layerControl.addOverlay( layer, layerName, indicatorLayerGroupName );
                                                                layer.addTo($scope.map);

                                                                // var justRestyling = false;

                                                                // fitBounds();

                                                                $rootScope.$broadcast("updateDiagrams", $scope.currentIndicatorMetadataAndGeoJSON, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId, date, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, kommonitorDataExchangeService.isMeasureOfValueChecked, kommonitorDataExchangeService.measureOfValue, justRestyling);
                                                            });

                                                  $scope.$on("addCustomIndicatorAsGeoJSON", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date) {

                                                                console.log('addCustomIndicatorAsGeoJSON was called');

                                                                $scope.date = date;

                                                                $scope.customIndicatorPropertyName = INDICATOR_DATE_PREFIX + date;
                                                                $scope.customIndicatorName = indicatorMetadataAndGeoJSON.indicatorName;
                                                                $scope.customIndicatorUnit = indicatorMetadataAndGeoJSON.unit;
                                                                $scope.customIndicatorDescription = indicatorMetadataAndGeoJSON.metadata.description;

                                                                $scope.currentCustomIndicatorLayerOfCurrentLayer = indicatorMetadataAndGeoJSON.geoJSON;

                                                                setupDefaultBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.customIndicatorPropertyName, indicatorMetadataAndGeoJSON.defaultClassificationMapping.items.length, indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, $scope.classifyMethod);
                                                                $scope.customPropertyName = INDICATOR_DATE_PREFIX + date;

                                                                var layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
                                                                    style: styleCustomDefault,
                                                                    onEachFeature: onEachFeatureCustomIndicator
                                                                });

                                                                $scope.currentCustomIndicatorLayer = layer;

                                                                // layer.StyledLayerControl = {
                                                                //   removable : false,
                                                                //   visible : true
                                                                // };

                                                                $scope.layerControl.addOverlay( layer, indicatorMetadataAndGeoJSON.indicatorName + "_" + spatialUnitName + "_" + date + "_CUSTOM", indicatorLayerGroupName );
                                                                layer.addTo($scope.map);

                                                                $scope.makeCustomInfoControl(date);
                                                                $scope.makeDefaultLegend(indicatorMetadataAndGeoJSON.defaultClassificationMapping);
                                                            });


                                                            $scope.$on("restyleCurrentLayer", function (event) {

                                                                          if($scope.currentIndicatorLayer){

                                                                            if(!kommonitorDataExchangeService.isBalanceChecked){
                                                                              // if mode is not balance then we have to make use of "normal" unbalanced indicator values
                                                                              $scope.currentIndicatorMetadataAndGeoJSON = kommonitorDataExchangeService.selectedIndicator;
                                                                              $scope.currentGeoJSONOfCurrentLayer = kommonitorDataExchangeService.selectedIndicator.geoJSON;
                                                                            }
                                                                            else{
                                                                              // if mode is not balance then we have to make use of "normal" unbalanced indicator values
                                                                              $scope.currentIndicatorMetadataAndGeoJSON = kommonitorDataExchangeService.indicatorAndMetadataAsBalance;
                                                                              $scope.currentGeoJSONOfCurrentLayer = kommonitorDataExchangeService.indicatorAndMetadataAsBalance.geoJSON;
                                                                            }

                                                                            $scope.currentIndicatorContainsZeroValues = false;

                                                                            for (var i = 0; i < $scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features.length; i++){
                                                                                if ($scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName] === 0 || $scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName] === "0"){
                                                                                  $scope.currentIndicatorContainsZeroValues = true;
                                                                                  break;
                                                                                };
                                                                            }

                                                                            if(kommonitorDataExchangeService.isMeasureOfValueChecked){
                                                                              setupMeasureOfValueBrew($scope.currentGeoJSONOfCurrentLayer, $scope.indicatorPropertyName, "YlOrBr", "Purples", $scope.classifyMethod, kommonitorDataExchangeService.measureOfValue);
                                                                              $scope.makeMeasureOfValueLegend();
                                                                              $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                                                                  layer.setStyle($scope.filteredStyle);
                                                                                }
                                                                                else{
                                                                                  layer.setStyle(styleMeasureOfValue(layer.feature));
                                                                                }

                                                                              });
                                                                            }
                                                                            else{

                                                                              if($scope.indicatorTypeOfCurrentLayer === 'DYNAMIC'){
                                                                                setupDynamicIndicatorBrew($scope.currentGeoJSONOfCurrentLayer, $scope.indicatorPropertyName, "Greens", "Reds", $scope.classifyMethod);
                                                                                $scope.makeDynamicIndicatorLegend();

                                                                                $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                  if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                                                                    layer.setStyle($scope.filteredStyle);
                                                                                  }
                                                                                  else{
                                                                                    layer.setStyle(styleDynamicIndicator(layer.feature));
                                                                                  }

                                                                                });
                                                                              }
                                                                              else{
                                                                                $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                  setupDefaultBrew($scope.currentGeoJSONOfCurrentLayer, $scope.indicatorPropertyName, kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.items.length, kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName, $scope.classifyMethod);
                                                                                  $scope.makeDefaultLegend(kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping);

                                                                                  $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                    if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                                                                      layer.setStyle($scope.filteredStyle);
                                                                                    }
                                                                                    else{
                                                                                      layer.setStyle(styleDefault(layer.feature));
                                                                                    }

                                                                                  });
                                                                                });
                                                                              }

                                                                            }

                                                                            var justRestyling = true;

                                                                            var indicatorObjectForDiagramUpdate = kommonitorDataExchangeService.selectedIndicator;
                                                                            if(kommonitorDataExchangeService.isBalanceChecked){
                                                                              indicatorObjectForDiagramUpdate = $scope.currentIndicatorMetadataAndGeoJSON;
                                                                            }
                                                                            $rootScope.$broadcast("updateDiagrams", indicatorObjectForDiagramUpdate, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId, $scope.date, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, kommonitorDataExchangeService.isMeasureOfValueChecked, kommonitorDataExchangeService.measureOfValue, justRestyling);
                                                                          }

                                                            });

                                                            $scope.$on("highlightFeatureOnMap", function (event, spatialFeatureName) {

                                            									// console.log("highlight feature on map for featureName " + spatialFeatureName);

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

                                            									// console.log("unhighlight feature on map for featureName " + spatialFeatureName);

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

                                            									// console.log("switch highlight feature on map for featureName " + spatialFeatureName);

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
