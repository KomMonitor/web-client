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
                    const defaultColorBrewerPaletteForBalanceIncreasingValues = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
                    const defaultColorBrewerPaletteForBalanceDecreasingValues = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
                    const defaultColorBrewerPaletteForGtMovValues = __env.defaultColorBrewerPaletteForGtMovValues;
                    const defaultColorBrewerPaletteForLtMovValues = __env.defaultColorBrewerPaletteForLtMovValues;
                    const defaultColorForHoveredFeatures = __env.defaultColorForHoveredFeatures;
                    const defaultColorForClickedFeatures = __env.defaultColorForClickedFeatures;

                    const defaultColorForOutliers_high = __env.defaultColorForOutliers_high;
                    const defaultBorderColorForOutliers_high = __env.defaultBorderColorForOutliers_high;
                    const defaultFillOpacityForOutliers_high = __env.defaultFillOpacityForOutliers_high;
                    const defaultColorForOutliers_low = __env.defaultColorForOutliers_low;
                    const defaultBorderColorForOutliers_low = __env.defaultBorderColorForOutliers_low;
                    const defaultFillOpacityForOutliers_low = __env.defaultFillOpacityForOutliers_low;
                    const useOutlierDetectionOnIndicator = __env.useOutlierDetectionOnIndicator;

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

                    $scope.outlierFillPattern_high;
                    $scope.outlierFillPattern_low;

                    $scope.showOutlierInfoAlert = false;

                    $scope.outlierStyle_high = {
                        weight: 2,
                        opacity: 1,
                        color: defaultBorderColorForOutliers_high,
                        dashArray: '3',
                        fillOpacity: defaultFillOpacityForOutliers_high,
                        fillColor: defaultColorForOutliers_high,
                        fillPattern: $scope.outlierFillPattern_high
                    };

                    $scope.outlierStyle_low = {
                        weight: 2,
                        opacity: 1,
                        color: defaultBorderColorForOutliers_low,
                        dashArray: '3',
                        fillOpacity: defaultFillOpacityForOutliers_low,
                        fillColor: defaultColorForOutliers_low,
                        fillPattern: $scope.outlierFillPattern_low
                    };

                    $scope.onCloseOutlierAlert = function(){
                			// $("#outlierInfo").hide();
                      $scope.showOutlierInfoAlert = false;
                		};

                    var refreshOutliersStyle = function(){

                      $scope.containsOutliers_high = false;
                      $scope.containsOutliers_low = false;
                      $scope.outlierMinValue = undefined;
                      $scope.outlierMaxValue = undefined;
                      $scope.showOutlierInfoAlert = false;


                      var fillOpacity_high = 1;
                      var fillOpacity_low = 1;
                      if($scope.useTransparencyOnIndicator){
                        fillOpacity_high = defaultFillOpacityForOutliers_high;
                        fillOpacity_low = defaultFillOpacityForOutliers_low;
                      }

                      // $scope.outlierStyle_high = {
                      //     weight: 2,
                      //     opacity: 1,
                      //     color: defaultBorderColorForOutliers_high,
                      //     dashArray: '',
                      //     fillOpacity: fillOpacity_high,
                      //     fillColor: defaultColorForOutliers_high
                      // };
                      //
                      // $scope.outlierStyle_low = {
                      //     weight: 2,
                      //     opacity: 1,
                      //     color: defaultBorderColorForOutliers_low,
                      //     dashArray: '',
                      //     fillOpacity: fillOpacity_low,
                      //     fillColor: defaultColorForOutliers_low
                      // };

                      $scope.outlierStyle_high = {
                          weight: 2,
                          opacity: 1,
                          color: defaultBorderColorForOutliers_high,
                          dashArray: '3',
                          fillOpacity: defaultFillOpacityForOutliers_high,
                          fillColor: defaultColorForOutliers_high,
                          fillPattern: $scope.outlierFillPattern_high
                      };

                      $scope.outlierStyle_low = {
                          weight: 2,
                          opacity: 1,
                          color: defaultBorderColorForOutliers_low,
                          dashArray: '3',
                          fillOpacity: defaultFillOpacityForOutliers_low,
                          fillColor: defaultColorForOutliers_low,
                          fillPattern: $scope.outlierFillPattern_low
                      };
                    };

                    $scope.useTransparencyOnIndicator = __env.useTransparencyOnIndicator;

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
                        opacity: 1,
                        color: defaultBorderColorForFilteredValues,
                        dashArray: '',
                        fillOpacity: defaultFillOpacityForFilteredFeatures,
                        fillColor: defaultColorForFilteredValues
                    };

                    var refreshFilteredStyle = function(){
                      var fillOpacity = 1;
                      if($scope.useTransparencyOnIndicator){
                        fillOpacity = defaultFillOpacityForFilteredFeatures;
                      }

                      $scope.filteredStyle = {
                          weight: 2,
                          opacity: 1,
                          color: defaultBorderColorForFilteredValues,
                          dashArray: '',
                          fillOpacity: fillOpacity,
                          fillColor: defaultColorForFilteredValues
                      };
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

                      $scope.loadingData = true;

                      // initialize map referring to div element with id="map"


                      // create OSM tile layer with correct attribution
                      var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                      var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
                      var osm = new L.TileLayer(osmUrl, {minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel, attribution: osmAttrib});

                      var osm_blackWhite = L.tileLayer('https://www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel, attribution: osmAttrib});

                      var wmsLayerRVR = L.tileLayer.wms('https://geodaten.metropoleruhr.de/spw2?', {
                          layers: 'stadtplan_rvr',
                          minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel
                      });
                      var wmsLayerDTK = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dtk?', {
                          layers: 'nw_dtk_pan',
                          minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel
                      });
                      var wmsLayerDOP = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop?', {
                          layers: 'nw_dop_rgb',
                          minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel
                      });

                      //CITY OF ESSEN WMS #1
               var wms_essen_ALK_grau = L.tileLayer.wms('https://geo.essen.de/arcgis/services/basemap/Stadtplanpaket_ALK_grau/MapServer/WMSServer?',
                                              {
                                                     minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel,
                                                     layers : "0,1,2,3",
                                                     attribution : 'Stadt Essen: Amt f&uumlr Geoinformation, Vermessung und Kataster'
                                              });
               // CITY OF ESSEN WMS #2
               var wms_essen_ABK = L.tileLayer
                               .wms(
                                              'https://geo.essen.de/arcgis/services/basemap/Uebersicht_ABK_Stadtgrundkarte/MapServer/WMSServer?',
                                              {
                                                     minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel,
                                                     layers : "0,1,2,3",
                                                     attribution : 'Stadt Essen: Amt f&uumlr Geoinformation, Vermessung und Kataster'
                                              });


                      $scope.map = L.map('map', {
                          center: [$scope.latCenter, $scope.lonCenter],
                          zoom: $scope.zoomLevel,
                          layers: [osm_blackWhite]
                      });

                      $scope.baseMaps = {
                        "Stadt Essen - Amtliche Liegenschaftskarte": wms_essen_ALK_grau,
                        "Stadt Essen - Amtliche Basiskarte": wms_essen_ABK,
                        "OpenStreetMap - Graustufen": osm_blackWhite,
                        "OpenStreetMap - Farbe": osm,
                        "NRW Digitale Topographische Karte": wmsLayerDTK,
                        "NRW Digitale Orthophotos (Luftbilder)": wmsLayerDOP,
                        "RVR Stadtplan": wmsLayerRVR
                      };

                    $scope.groupedOverlays = {
                      indicatorLayerGroupName: {

                      },
                      poiLayerGroupName: {

                      },
                      reachabilityLayerGroupName: {

                      }
                    };

                      $scope.layerControl = L.control.groupedLayers($scope.baseMaps, $scope.groupedOverlays, {position: 'topleft'});
	                    $scope.map.addControl($scope.layerControl);

                      $scope.scaleBar = L.control.scale();
                      $scope.scaleBar.addTo($scope.map);



                      // hatch patterns
                      // var diagonalPattern = new L.PatternPath({ d: "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" , fill: true });

                      // $scope.outlierFillPattern_high = new L.Pattern();
                      // $scope.outlierFillPattern_high.addShape(diagonalPattern);
                      // $scope.outlierFillPattern_high.addTo($scope.map);

                      $scope.outlierFillPattern_low = new L.StripePattern({patternTransform: "rotate(45)"});
                      $scope.outlierFillPattern_low.addTo($scope.map);

                      $scope.outlierFillPattern_high = new L.StripePattern({patternTransform: "rotate(-45)"});
                      $scope.outlierFillPattern_high.addTo($scope.map);

                      // $scope.loadingData = false;

              			};

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

                    // $(document).on('change','#selectSimplifyGeometriesViaInfoControl',function(){
                    //   var selector = document.getElementById('selectSimplifyGeometriesViaInfoControl');
                    //   var simplifyGeometries = selector[selector.selectedIndex].value;
                    //
                    //   kommonitorDataExchangeService.simplifyGeometries = simplifyGeometries;
                    //
                    //   $rootScope.$broadcast("changeSpatialUnit");
                    // });

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
                      // innerHTMLString += "<br/>";

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

                    $(document).on('click','#downloadMetadata',function(e){
                      // create PDF from currently selected/displayed indicator!
                      var indicatorMetadata = kommonitorDataExchangeService.selectedIndicator;

                      var jspdf = new jsPDF();

                      jspdf.setFontSize(18);
                      jspdf.text('KomMonitor - (vorläufiges) Metadatenblatt', 14, 22);
                      jspdf.setFontSize(12);

                      var topicsString = "";

                      for (var [index, topic] of indicatorMetadata.applicableTopics.entries()){
                        topicsString += topic;

                        if(index < indicatorMetadata.applicableTopics.length - 1){
                          topicsString += "\n";
                        }
                      }

                      // Or JavaScript:
                      jspdf.autoTable({
                          head: [['Themenfeld', 'Name des Indikators', 'Kategorie', 'Kurzbezeichnung']],
                          body: [
                              [topicsString, indicatorMetadata.indicatorName, "Indikator", "-"]
                              // ...
                          ],
                          startY: 40
                      });

                      var linkedIndicatorsString = "";

                      for (var [index, linkedIndicator] of indicatorMetadata.referencedIndicators.entries()){
                        linkedIndicatorsString += linkedIndicator.referencedIndicatorName + " - \n   " + linkedIndicator.referencedIndicatorDescription;

                        if(index < indicatorMetadata.referencedIndicators.length - 1){
                          linkedIndicatorsString += "\n\n";
                        }
                      }

                      if(linkedIndicatorsString === ""){
                        linkedIndicatorsString = "-";
                      }

                      var linkedGeoresourcesString = "";

                      for (var [index, linkedGeoresource] of indicatorMetadata.referencedGeoresources.entries()){
                        linkedGeoresourcesString += linkedGeoresource.referencedGeoresourceName + " - \n   " + linkedGeoresource.referencedGeoresourceDescription;

                        if(index < indicatorMetadata.referencedGeoresources.length - 1){
                          linkedGeoresourcesString += "\n\n";
                        }
                      }

                      if(linkedGeoresourcesString === ""){
                        linkedGeoresourcesString = "-";
                      }

                      // jspdf.autoTable({
                      //     head: [],
                      //     body: [
                      //         ["Beschreibung", indicatorMetadata.metadata.description],
                      //         ["Maßeinheit", indicatorMetadata.unit],
                      //         ["Definition des Leitindikators", "-"],
                      //         ["Klassifizierung", "-"],
                      //         ["Interpretation", "-"],
                      //         ["Verknüpfte Indikatoren", linkedIndicatorsString],
                      //         ["Verknüpfte Geodaten", linkedGeoresourcesString]
                      //         // ...
                      //     ],
                      //     startY: jspdf.autoTable.previous.finalY + 20,
                      // });

                      var spatialUnitsString = "";

                      for (var [index, spatialUnit] of indicatorMetadata.applicableSpatialUnits.entries()){
                        spatialUnitsString += spatialUnit;

                        if(index < indicatorMetadata.applicableSpatialUnits.length - 1){
                          spatialUnitsString += "\n";
                        }
                      }

                      var datesString = "";

                      for (var [index, date] of indicatorMetadata.applicableDates.entries()){
                        datesString += date;

                        if(index < indicatorMetadata.applicableDates.length - 1){
                          datesString += "\n";
                        }
                      }

                      jspdf.autoTable({
                          head: [],
                          body: [
                              ["Beschreibung", indicatorMetadata.metadata.description],
                              ["Maßeinheit", indicatorMetadata.unit],
                              // ["Definition des Leitindikators", "-"],
                              // ["Klassifizierung", "-"],
                              ["Interpretation", "-"],
                              ["Verknüpfte Indikatoren", linkedIndicatorsString],
                              ["Verknüpfte Geodaten", linkedGeoresourcesString],
                              ["Datenquelle", indicatorMetadata.metadata.datasource],
                              ["Datenhalter", indicatorMetadata.metadata.contact],
                              ["Raumbezug", spatialUnitsString],
                              // $scope.updateInteval is a map mapping the english KEYs to german expressions
                              ["Zeitbezug / Fortführungsintervall", $scope.updateInterval.get(indicatorMetadata.metadata.updateInterval.toUpperCase())],
                              ["Verfügbare Zeitreihe", datesString],
                              ["Letzte Aktualisierung", indicatorMetadata.metadata.lastUpdate],
                              ["Weiterführende Literatur", "-"]
                              // ...
                          ],
                          startY: jspdf.autoTable.previous.finalY + 20
                      });

                      var pdfName = indicatorMetadata.indicatorName + ".pdf"

                      jspdf.save(pdfName);
                    });

                    $scope.appendInfoCloseButton = function(){
                      return '<div id="info_close" class="btn btn-link" style="right: 0px; position: relative; float: right;" title="schlie&szlig;en"><span class="glyphicon glyphicon-remove"></span></div>';
                    }

                    $scope.appendLegendCloseButton = function(){
                      return '<div id="legend_close" class="btn btn-link" style="right: 0px; position: relative; float: right;" title="schlie&szlig;en"><span class="glyphicon glyphicon-remove"></span></div>';
                    }

                    $scope.makeInfoControl = function(date, isCustomComputation){

                      if(!$scope.showInfoControl){
                        try{
                          toggleInfoControl();
                        }
                        catch(error){
                        }
                      }

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

                          this._div.id = "infoControl";
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
                          // this._div.innerHTML += '<b>Kontakt: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.contact + '<br/>';
                          this._div.innerHTML += '<b>Aktualisierungszyklus: </b> ' + $scope.updateInterval.get($scope.currentIndicatorMetadataAndGeoJSON.metadata.updateInterval.toUpperCase()) + '<br/>';
                          this._div.innerHTML += '<b>zuletzt aktualisiert am: </b> ' + tsToDate(dateToTS(lastUpdateAsDate)) + '<br/><br/>';
                          this._div.innerHTML += '<button id="downloadMetadata" class="btn btn-default"><i class="fa fa-download"></i>&nbsp;&nbsp;Download Metadatenblatt</button><br/><br/>';

                          this._div.innerHTML += $scope.appendSpatialUnitOptions();
                          this._div.innerHTML += $scope.appendTransparencyCheckbox();

                          // this._div.innerHTML += $scope.appendSimplifyGeometriesOptions();
                          return this._div;
                      };

                      $scope.infoControl.addTo($scope.map);
                    }

                    $scope.makeCustomInfoControl = function(date){

                      if(!$scope.showInfoControl){
                        try{
                          toggleInfoControl();
                        }
                        catch(error){
                        }
                      }

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

                    $(document).on('click','#controlIndicatorTransparency',function(e){
                      var indicatorTransparencyCheckbox = document.getElementById('controlIndicatorTransparency');
                      if (indicatorTransparencyCheckbox.checked){
                        $scope.useTransparencyOnIndicator = true;
                      }
                      else{
                        $scope.useTransparencyOnIndicator = false;
                      }
                      $rootScope.$broadcast("restyleCurrentLayer");

                      // ensure that highlighted features remain highlighted
                      preserveHighlightedFeatures();
                    });

                    $(document).on('click','#controlIndicatorOutlierDetection',function(e){
                      var indicatorOutlierCheckbox = document.getElementById('controlIndicatorOutlierDetection');
                      if (indicatorOutlierCheckbox.checked){
                        kommonitorDataExchangeService.useOutlierDetectionOnIndicator = true;
                      }
                      else{
                        kommonitorDataExchangeService.useOutlierDetectionOnIndicator = false;
                      }
                      $rootScope.$broadcast("restyleCurrentLayer");

                      // ensure that highlighted features remain highlighted
                      preserveHighlightedFeatures();
                    });

                    $scope.$on("changeClassifyMethod", function (event, method) {
                      $scope.classifyMethod = method;

                      $rootScope.$broadcast("restyleCurrentLayer");
                    });


                    $scope.appendClassifyRadioOptions = function(){
                      var innerHTMLString = "<strong title='Hier können Sie die Klassifizierungsmethode ändern. Das Herüberfahren des Mauszeigers über eine der Optionen öffnet einen Tooltip mit Informationen zu den Methoden. In Zukunft sollen auch manuelle Klassifikationen möglich gemacht werden.'>Klassifizierungsmethode:</strong>";

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
                        innerHTMLString += ' <label title="Mit der Methode Gleiches Intervall wird der Bereich der Attributwerte in gleich große Teilbereiche unterteilt. Bei der Quantil-Methode enthält jede Klasse die gleiche Anzahl von Features. Bei Jenks (Natürliche Unterbrechungen) werden Klassengrenzen identifiziert, die ähnliche Werte möglichst gut gruppieren und zugleich die Unterschiede zwischen den Klassen maximieren." class="radio-inline"><input id="radio' + option.value + '" type="radio" name="classifyMethod" ';
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

                    $scope.appendTransparencyCheckbox = function(){
                      // <label class='checkbox-inline' >
        							// 	<input type="checkbox" value="" checked>
        							// 	<b title="">Text</b>
        							// </label>
                      var innerHTMLString = "<label class='checkbos-inline' title='Einstellung, ob der Indikatorenlayer semi-transparent oder opak dargestellt wird'>";
                      innerHTMLString += "<input id='controlIndicatorTransparency' type='checkbox' value='useTransparency'";
                      if($scope.useTransparencyOnIndicator){
                        innerHTMLString += " checked";
                      }
                      innerHTMLString += ">";

                      innerHTMLString += '<b>Indikator semi-transparent darstellen</b>';
                      innerHTMLString += '</label>';

                      return innerHTMLString;
                    };

                    $scope.appendOutliersCheckbox = function(){
                      // <label class='checkbox-inline' >
        							// 	<input type="checkbox" value="" checked>
        							// 	<b title="">Text</b>
        							// </label>
                      var innerHTMLString = "<label class='checkbos-inline' title='Einstellung, ob extreme Ausreißer gesondert markiert werden sollen'>";
                      innerHTMLString += "<input id='controlIndicatorOutlierDetection' type='checkbox' value='useOutlierDetection'";
                      if(kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                        innerHTMLString += " checked";
                      }
                      innerHTMLString += ">";

                      innerHTMLString += '<b>extreme Ausreißer gesondert markieren</b>';
                      innerHTMLString += '</label>';
                      innerHTMLString += '<br/>';
                      innerHTMLString += '<br/>';

                      return innerHTMLString;
                    };

                    function makeOutliersLowLegendString (outliersArray){
                      if(outliersArray.length > 1){

                        return "(" + (Number(outliersArray[0]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) +  " &ndash; " + (Number(outliersArray[outliersArray.length -1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + ")";
                      }
                      else{
                        return "(" + (Number(outliersArray[0]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + ")";
                      }
                    };

                    function makeOutliersHighLegendString (outliersArray){
                      if(outliersArray.length > 1){
                        return "(" + (Number(outliersArray[0]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) +  " &ndash; " + (Number(outliersArray[outliersArray.length -1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + ")";
                      }
                      else{
                        return "(" + (Number(outliersArray[0]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + ")";
                      }
                    };

                    $scope.makeDefaultLegend = function(defaultClassificationMapping){

                      if(!$scope.showLegendControl){
                        try{
                          toggleLegendControl();
                        }
                        catch(error){
                        }
                      }

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


                        $scope.div.id = "legendControl";

                            labels = $scope.defaultBrew.getBreaks();
                            colors = $scope.defaultBrew.getColors();

                        $scope.div.innerHTML = $scope.appendLegendCloseButton();
                        var opacity = 1;
                        if($scope.useTransparencyOnIndicator){
                          opacity = defaultFillOpacity;
                        }

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

                        if($scope.containsOutliers_low || $scope.containsOutliers_high){
                          this._div.innerHTML += $scope.appendOutliersCheckbox();
                        }

                        var useFilteredOrZeroOrOutlierValues = false;

                        if($scope.containsOutliers_low && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){

                              var svgString = '<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:3" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:3" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:3" />Sorry, your browser does not support inline SVG.</svg>'

                              $scope.div.innerHTML +=
                                  // '<i style="opacity: ' + opacity + ';">' + svgString + '</i> ' +
                                  '<i>' + svgString + '</i> ' +
                                  "extreme untere Ausrei&szlig;er " + makeOutliersLowLegendString($scope.outliers_low) + '<br/>';
                                  useFilteredOrZeroOrOutlierValues = true;
                        }
                        if($scope.containsOutliers_high && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                          var svgString = '<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:3" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:3" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:3" />Sorry, your browser does not support inline SVG.</svg>'

                          $scope.div.innerHTML +=
                              // '<i style="opacity: ' + opacity + ';">' + svgString + '</i> ' +
                              '<i>' + svgString + '</i> ' +
                              "extreme obere Ausrei&szlig;er " + makeOutliersHighLegendString($scope.outliers_high) + '<br/>';
                              useFilteredOrZeroOrOutlierValues = true;
                        }

                        if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.length > 0){
                          $scope.div.innerHTML +=
                              '<i style="background:' + defaultColorForFilteredValues + '; border: 2px solid ' + defaultBorderColorForFilteredValues + '; opacity: ' + opacity + ';"></i> ' +
                              "gefilterte Features" + '<br/>';
                              useFilteredOrZeroOrOutlierValues = true;
                        }

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '; opacity: ' + opacity + ';"></i> ' +
                              "0" + '<br/>';
                              useFilteredOrZeroOrOutlierValues = true;
                        }

                        if(useFilteredOrZeroOrOutlierValues){
                          $scope.div.innerHTML += '<br/>';
                        }

                        //TODO FIXME defaultCustomRating comes in the wrong order! inspect that behaviour server-side
                        for (var i = 0; i < colors.length; i++) {
                            $scope.div.innerHTML +=
                                // '<i style="background:' + colors[i] + '"></i> ' +
                                // defaultClassificationMapping.items[defaultClassificationMapping.items.length - 1 - i].defaultCustomRating + ' (' + (+labels[i].toFixed(numberOfDecimals)) + ((+labels[i + 1]) ? ' &ndash; &lt; ' + (+labels[i + 1].toFixed(numberOfDecimals)) + ') <br>' : '+');
                                '<i style="background:' + colors[i] + '; opacity: ' + opacity + ';"></i> ' +
                                (Number(labels[i]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + ((Number(labels[i + 1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) ? ' &ndash; &lt; ' + (Number(labels[i + 1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + ' <br>' : '+');
                        }

                        $scope.div.innerHTML += '</div>';

                        return $scope.div;
                      };

                      $scope.legendControl.addTo($scope.map);

                    }

                    $scope.makeDynamicIndicatorLegend = function(){

                      if(!$scope.showLegendControl){
                        try{
                          toggleLegendControl();
                        }
                        catch(error){
                        }
                      }

                      if($scope.legendControl){
                        try{
                          $scope.map.removeControl($scope.legendControl);
                          $scope.legendControl = undefined;
                        }
                        catch(error){
                        }
                      }

                      var opacity = 1;
                      if($scope.useTransparencyOnIndicator){
                        opacity = defaultFillOpacity;
                      }

                      $scope.legendControl = L.control({position: 'bottomright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'legendMap');
                        $scope.div.id = "legendControl";

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

                        if($scope.containsOutliers_low || $scope.containsOutliers_high){
                          $scope.div.innerHTML += $scope.appendOutliersCheckbox();
                        }

                        var useFilteredOrZeroOrOutlierValues = false;

                        if($scope.containsOutliers_low && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){

                              var svgString = '<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:3" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:3" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:3" />Sorry, your browser does not support inline SVG.</svg>'

                              $scope.div.innerHTML +=
                                  // '<i style="opacity: ' + opacity + ';">' + svgString + '</i> ' +
                                  '<i>' + svgString + '</i> ' +
                                  "extreme untere Ausrei&szlig;er " + makeOutliersLowLegendString($scope.outliers_low) + '<br/>';
                                  useFilteredOrZeroOrOutlierValues = true;
                        }
                        if($scope.containsOutliers_high && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                          var svgString = '<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:3" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:3" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:3" />Sorry, your browser does not support inline SVG.</svg>'

                          $scope.div.innerHTML +=
                              // '<i style="opacity: ' + opacity + ';">' + svgString + '</i> ' +
                              '<i>' + svgString + '</i> ' +
                              "extreme obere Ausrei&szlig;er " + makeOutliersHighLegendString($scope.outliers_high) + '<br/>';
                              useFilteredOrZeroOrOutlierValues = true;
                        }

                        if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.length > 0){
                          $scope.div.innerHTML +=
                              '<i style="background:' + defaultColorForFilteredValues + '; border: 2px solid ' + defaultBorderColorForFilteredValues + '; opacity: ' + opacity + ';"></i> ' +
                              "gefilterte Features" + '<br/>';
                              useFilteredOrZeroOrOutlierValues = true;
                        }

                        if(useFilteredOrZeroOrOutlierValues){
                          $scope.div.innerHTML += '<br/>';
                        }

                        // dynamic legend creation depending on number of positive and negative classes
                        if($scope.dynamicDecreaseBrew){
                          labelsDynamicDecrease = $scope.dynamicDecreaseBrew.breaks;
                          colorsDynamicDecrease = $scope.dynamicDecreaseBrew.colors;

                          $scope.div.innerHTML += "<label>Abnahme</label><br/>";

                            // invert color labeling as colorization of lT features is also inverted
                            for (var i = 0; i < colorsDynamicDecrease.length; i++) {
                                $scope.div.innerHTML +=
                                    '<i style="background:' + colorsDynamicDecrease[colorsDynamicDecrease.length - 1 - i] + '; opacity: ' + opacity + ';"></i> ' +
                                    (Number(labelsDynamicDecrease[i]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + (typeof labelsDynamicDecrease[i + 1] != 'undefined' ? ' &ndash; &lt; ' + (Number(labelsDynamicDecrease[i + 1]).toLocaleString("de-DE", {maximumFractionDigits: numberOfDecimals})) + '<br>' : ' &ndash; &lt; 0');
                            }

                        }

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML += "<br/>";
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '; opacity: ' + opacity + ';"></i> ' +
                              "0" + '</br>';
                        }

                        if($scope.dynamicIncreaseBrew){
                          $scope.div.innerHTML += "<br/>";
                          labelsDynamicIncrease = $scope.dynamicIncreaseBrew.breaks;
                          colorsDynamicIncrease = $scope.dynamicIncreaseBrew.colors;

                          $scope.div.innerHTML += "<label>Zunahme</label><br/>";

                            // invert color labeling as colorization of lT features is also inverted
                            for (var i = 0; i < colorsDynamicIncrease.length; i++) {
                                $scope.div.innerHTML +=
                                    '<i style="background:' + colorsDynamicIncrease[i] + '; opacity: ' + opacity + ';"></i> ' +
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

                      if(!$scope.showLegendControl){
                        try{
                          toggleLegendControl();
                        }
                        catch(error){
                        }
                      }

                      if($scope.legendControl){
                        try{
                          $scope.map.removeControl($scope.legendControl);
                          $scope.legendControl = undefined;
                        }
                        catch(error){
                        }
                      }

                      var opacity = 1;
                      if($scope.useTransparencyOnIndicator){
                        opacity = defaultFillOpacity;
                      }

                      var dateComponents = $scope.date.split("-");
                      var dateAsDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));

                      $scope.legendControl = L.control({position: 'bottomright'});

                      $scope.legendControl.onAdd = function (map) {

                        $scope.div = L.DomUtil.create('div', 'legendMap');
                        $scope.div.id = "legendControl";

                        $scope.div.innerHTML = $scope.appendLegendCloseButton();
                        $scope.div.innerHTML += '<div>';

                        $scope.div.innerHTML += "<h4><b>Indikatorenlegende</b><br/>Schwellwert-Klassifizierung</h4><br/><em>Gew&auml;hlter Zeitpunkt: " + tsToDate(dateToTS(dateAsDate)) + "</em><br/>";

                        $scope.div.innerHTML += "<em>aktueller Schwellwert: </em> " + kommonitorDataExchangeService.measureOfValue + "<br/><br/>";

                        $scope.div.innerHTML += "<label>Einheit: </label> " + $scope.indicatorUnit + "<br/>";

                        $scope.div.innerHTML += $scope.appendClassifyRadioOptions();

                        if($scope.containsOutliers_low || $scope.containsOutliers_high){
                          $scope.div.innerHTML += $scope.appendOutliersCheckbox();
                        }

                        var useFilteredOrZeroOrOutlierValues = false;

                        if($scope.containsOutliers_low && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){

                              var svgString = '<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:3" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:3" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' + defaultColorForOutliers_low + ';stroke-width:3" />Sorry, your browser does not support inline SVG.</svg>'

                              $scope.div.innerHTML +=
                                  // '<i style="opacity: ' + opacity + ';">' + svgString + '</i> ' +
                                  '<i>' + svgString + '</i> ' +
                                  "extreme untere Ausrei&szlig;er " + makeOutliersLowLegendString($scope.outliers_low) + '<br/>';
                                  useFilteredOrZeroOrOutlierValues = true;
                        }
                        if($scope.containsOutliers_high && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                          var svgString = '<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:3" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:3" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' + defaultColorForOutliers_high + ';stroke-width:3" />Sorry, your browser does not support inline SVG.</svg>'

                          $scope.div.innerHTML +=
                              // '<i style="opacity: ' + opacity + ';">' + svgString + '</i> ' +
                              '<i>' + svgString + '</i> ' +
                              "extreme obere Ausrei&szlig;er " + makeOutliersHighLegendString($scope.outliers_high) + '<br/>';
                              useFilteredOrZeroOrOutlierValues = true;
                        }

                        if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.length > 0){
                          $scope.div.innerHTML +=
                              '<i style="background:' + defaultColorForFilteredValues + '; border: 2px solid ' + defaultBorderColorForFilteredValues + '; opacity: ' + opacity + ';"></i> ' +
                              "gefilterte Features" + '</br>';
                              useFilteredOrZeroOrOutlierValues = true;
                        }

                        if($scope.currentIndicatorContainsZeroValues){
                          $scope.div.innerHTML +=
                              '<i style="background:' + $scope.defaultColorForZeroValues + '; opacity: ' + opacity + ';"></i> ' +
                              "0" + '<br>';
                              useFilteredOrZeroOrOutlierValues = true;
                        }

                        if(useFilteredOrZeroOrOutlierValues){
                          $scope.div.innerHTML += '<br/>';
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
                                  '<i style="background:' + colorsLtMeasureOfValue[colorsLtMeasureOfValue.length - 1 -i] + '; opacity: ' + opacity + ';"></i> ' +
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
                                  '<i style="background:' + colorsGtMeasureOfValue[i] + '; opacity: ' + opacity + ';"></i> ' +
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

                              $scope.$on("replaceIsochronesAsGeoJSON", function (event, geoJSON, transitMode, reachMode, cutOffValues, useMultipleStartPoints) {

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
                                  cutOffUnit: "Sekunden"
                                };

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

                                if(useMultipleStartPoints){
                                  // merge intersecting isochrones of same cutOffValue
                                  geoJSON = mergeIntersectingIsochrones(geoJSON);
                                }

                                // sort features to ensure correct z-order of layers (begin with smallest isochrones)
                                geoJSON.features.sort((a, b) => a.properties.value - b.properties.value);

                                for(var index=geoJSON.features.length-1; index>=0; index--){

                                  var styleIndex = getStyleIndexForFeature(geoJSON.features[index], kommonitorDataExchangeService.isochroneLegend.colorValueEntries);

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

                              var getStyleIndexForFeature = function(feature, colorValueEntries){
                                var index=0;
                                var featureCutOffValue = feature.properties.value;

                                for(var i=0; i<colorValueEntries.length; i++){
                                  if (featureCutOffValue === colorValueEntries[i].value){
                                    index = i;
                                    break;
                                  }
                                }

                                return index;
                              };

                              var mergeIntersectingIsochrones = function(geoJSON){
                                // use turf to dissolve any overlapping/intersecting isochrones that have the same cutOffValue!

                                var dissolved = turf.dissolve(geoJSON, {propertyName: 'value'});

                                return dissolved;
                              };

                              $scope.$on("replaceIsochroneMarker", function (event, lonLatArray) {

                                if($scope.isochroneMarkerLayer){
                                  $scope.layerControl.removeLayer($scope.isochroneMarkerLayer);
                                  $scope.map.removeLayer($scope.isochroneMarkerLayer);
                                }

                                $scope.isochroneMarkerLayer = L.featureGroup();

                                lonLatArray.forEach(function(lonLat){
                                  var layer = L.marker([lonLat[1], lonLat[0]]);
                                  layer.bindPopup("Startpunkt der Isochronenberechnung");
                                  layer.addTo($scope.isochroneMarkerLayer);
                                })

                                $scope.layerControl.addOverlay( $scope.isochroneMarkerLayer, "Startpunkte für Isochronenberechnung", reachabilityLayerGroupName );
                                $scope.isochroneMarkerLayer.addTo($scope.map);
                              });

                              $scope.$on("addPoiGeoresourceAsGeoJSON", function (event, georesourceMetadataAndGeoJSON, date, useCluster) {

                                // use leaflet.markercluster to cluster markers!
                                var markers;
                                if(useCluster){
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
                                  		return new L.DivIcon({ html: '<div class="awesome-marker-legend-icon-' + georesourceMetadataAndGeoJSON.poiMarkerColor + '" ><span>' + childCount + '</span></div>', className: className, iconSize: new L.Point(40,40) });
                              			}
                                  });
                                }
                                else{
                                  markers = L.layerGroup();
                                }
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
                                  //.bindPopup( poiFeature.properties.name )
                                  var newMarker = L.marker( [Number(poiFeature.geometry.coordinates[1]), Number(poiFeature.geometry.coordinates[0])], {icon: customMarker} );
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

                                              // check if is outlier, then do not use within classification, as it will be marked on map with special color
                                              if(geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                                                continue;
                                              }

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

                                                // check if is outlier, then do not use within classification, as it will be marked on map with special color
                                                if(geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                                                  continue;
                                                }

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

                                                // check if is outlier, then do not use within classification, as it will be marked on map with special color
                                                if(geoJSON.features[i].properties[outlierPropertyName] !== outlierPropertyValue_no && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                                                  continue;
                                                }

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

                                        function styleOutlier(feature) {
                                          if((feature.properties[outlierPropertyName] === outlierPropertyValue_low_soft) || (feature.properties[outlierPropertyName] === outlierPropertyValue_low_extreme)){
                                            $scope.containsOutliers_low = true;
                                            return $scope.outlierStyle_low;
                                          }
                                          else{
                                            $scope.containsOutliers_high = true;
                                            return $scope.outlierStyle_high;
                                          }
                                        };

                                        // style function to return
                                        // fill color based on $scope.defaultBrew.getColorInRange() method
                                        function styleDefault(feature) {
                                          // check if feature is outlier
                                          if((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                                            return styleOutlier(feature);
                                          }

                                          var fillOpacity = 1;
                                          if($scope.useTransparencyOnIndicator){
                                            fillOpacity = defaultFillOpacity;
                                          }

                                          var fillColor;
                                          if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                            fillColor = $scope.defaultColorForZeroValues;
                                            if($scope.useTransparencyOnIndicator){
                                              fillOpacity = defaultFillOpacityForZeroFeatures;
                                            }

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
                                                fillColor: fillColor,
                                                fillPattern: undefined
                                            }
                                        }

                                        function styleCustomDefault(feature) {

                                          // check if feature is outlier
                                          if((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                                            return styleOutlier(feature);
                                          }

                                          var fillColor;
                                          if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                            fillColor = $scope.defaultColorForZeroValues;
                                          }
                                          else{
                                            fillColor = $scope.defaultBrew.getColorInRange(feature.properties[$scope.propertyName]);
                                          }

                                          var fillOpacity = 1;
                                          if($scope.useTransparencyOnIndicator){
                                            fillOpacity = defaultFillOpacity;
                                          }

                                            return {
                                                weight: 2,
                                                opacity: 1,
                                                color: defaultBorderColor,
                                                dashArray: '',
                                                fillOpacity: fillOpacity,
                                                fillColor: fillColor,
                                                fillPattern: undefined
                                            }
                                        }

                                        function styleMeasureOfValue (feature) {

                                          // check if feature is outlier
                                          if((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                                            return styleOutlier(feature);
                                          }

                                          var fillOpacity = 1;
                                          if($scope.useTransparencyOnIndicator){
                                            fillOpacity = defaultFillOpacity;
                                          }

                                          if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) >= kommonitorDataExchangeService.measureOfValue){
                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                              if($scope.useTransparencyOnIndicator){
                                                fillOpacity = defaultFillOpacityForZeroFeatures;
                                              }
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
                                                fillColor: fillColor,
                                                fillPattern: undefined
                                            }
                                          }
                                          else{

                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                              if($scope.useTransparencyOnIndicator){
                                                fillOpacity = defaultFillOpacityForZeroFeatures;
                                              }
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
                                                fillColor: fillColor,
                                                fillPattern: undefined
                                            }
                                          }

                                        }

                                        function styleDynamicIndicator (feature) {

                                          // check if feature is outlier
                                          if((feature.properties[outlierPropertyName] !== outlierPropertyValue_no) && kommonitorDataExchangeService.useOutlierDetectionOnIndicator){
                                            return styleOutlier(feature);
                                          }

                                          var fillOpacity = 1;
                                          if($scope.useTransparencyOnIndicator){
                                            fillOpacity = defaultFillOpacity;
                                          }

                                          if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) >= 0){
                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                              if($scope.useTransparencyOnIndicator){
                                                fillOpacity = defaultFillOpacityForZeroFeatures;
                                              }
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
                                                fillColor: fillColor,
                                                fillPattern: undefined
                                            }
                                          }
                                          else{

                                            var fillColor;
                                            if(feature.properties[$scope.propertyName] == 0 || feature.properties[$scope.propertyName] == "0"){
                                              fillColor = $scope.defaultColorForZeroValues;
                                              if($scope.useTransparencyOnIndicator){
                                                fillOpacity = defaultFillOpacityForZeroFeatures;
                                              }
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
                                                fillColor: fillColor,
                                                fillPattern: undefined
                                            }
                                          }

                                        }

                                        function highlightFeature(e) {
                                            var layer = e.target;

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

                                        function setPermanentlyHighlightedStyle(layer){
                                          var fillOpacity = 1;
                                          if($scope.useTransparencyOnIndicator){
                                            fillOpacity = defaultFillOpacityForHighlightedFeatures;
                                          }

                                            layer.setStyle({
                                                weight: 6,
                                                color: defaultColorForClickedFeatures,
                                                dashArray: '',
                                                fillOpacity: fillOpacity
                                            });

                                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                                layer.bringToFront();
                                            }
                                        };

                                        function setTemporarilyHighlightedStyle(layer){
                                          var fillOpacity = 1;
                                          if($scope.useTransparencyOnIndicator){
                                            fillOpacity = defaultFillOpacity;
                                          }

                                          layer.setStyle({
                                              weight: 5,
                                              color: defaultColorForHoveredFeatures,
                                              dashArray: '',
                                              fillOpacity: fillOpacity
                                          });

                                          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                              layer.bringToFront();
                                          }
                                        };

                                        function preserveHighlightedFeatures(){
                                          $scope.map.eachLayer(function(layer){
                                            if(layer.feature){
                                              if(kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                                setPermanentlyHighlightedStyle(layer);
                                                $rootScope.$broadcast("updateDiagramsForHoveredFeature", layer.feature.properties);
                                              }
                                            }
                                          });
                                        };

                                        $scope.$on("preserveHighlightedFeatures", function (event) {
                                            preserveHighlightedFeatures();
                                        });

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
                                            else{
                                              setPermanentlyHighlightedStyle(layer);
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

                                          if(kommonitorDataExchangeService.anySideBarIsShown){
                                            await wait(300);

                                            // $scope.map.setZoom($scope.zoomLevel);
                                            // var latlng = L.latLng($scope.latCenter, $scope.lonCenter);
                                            // var currentZoom = $scope.map.getZoom();
                                            // var centerPointPixels = L.CRS.latLngToPoint(latlng, currentZoom);
                                            // centerPointPixels = L.Point(centerPointPixels.x - 500, centerPointPixels.y);
                                            // latlng = L.CRS.pointToLatLng(centerPointPixels);
                                            // $scope.map.panTo(latlng);

                                            panToCenterOnActiveMenue(500);
                                          }
                                          // else{
                                          //   await wait(100);
                                          //   fitBounds();
                                          // }

                                        });

                                        $scope.$on("recenterMapOnHideSideBar", async function (event) {

                                          await wait(100);

                                          panToCenterOnUnactiveMenue(500);
                                        });

                                        $scope.$on("recenterMapOnShowSideBar", async function (event) {

                                          await wait(100);

                                          panToCenterOnActiveMenue(500);
                                        });

                                        function fitBounds(){
                                          if($scope.map && $scope.currentIndicatorLayer){

                                            // $scope.map.setView(L.latLng($scope.latCenter, $scope.lonCenter), $scope.zoomLevel);
                                            $scope.map.fitBounds($scope.currentIndicatorLayer.getBounds());
                                          }

                                        }

                                        function panToCenterOnActiveMenue(numPixels){
                                          if($scope.map && $scope.currentIndicatorLayer){

                                            //$scope.map.setView(L.latLng($scope.latCenter, $scope.lonCenter + 0.15), $scope.zoomLevel);
                                            // $scope.map.panTo(L.latLng($scope.latCenter, $scope.lonCenter + 0.15));
                                            $scope.map.panBy(L.point(numPixels, 0));

                                          }
                                        }

                                        function panToCenterOnUnactiveMenue(numPixels){
                                          if($scope.map && $scope.currentIndicatorLayer){

                                            //$scope.map.setView(L.latLng($scope.latCenter, $scope.lonCenter), $scope.zoomLevel);
                                            // $scope.map.panTo(L.latLng($scope.latCenter, $scope.lonCenter));
                                            $scope.map.panBy(L.point(-numPixels, 0));
                                          }
                                        }

                                        function zoomToFeature(e) {
                                            map.fitBounds(e.target.getBounds());
                                        }

                                        function markOutliers(indicatorMetadataAndGeoJSON, indicatorPropertyName){
                                          // identify possible data outliers
                                          // mark them using a dedicated property

                                          $scope.outliers_high = [];
                                          $scope.outliers_low = [];

                                          var valueArray = new Array();

                                          indicatorMetadataAndGeoJSON.geoJSON.features.forEach(function(feature){
                                              valueArray.push(feature.properties[indicatorPropertyName]);
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

                                          indicatorMetadataAndGeoJSON.geoJSON.features.forEach(function(feature){
                                            // compare feature value to whiskers and set property
                                              if (feature.properties[indicatorPropertyName] < whisker_low_extreme){
                                                feature.properties[outlierPropertyName] = outlierPropertyValue_low_extreme;
                                                $scope.containsOutliers_low = true;
                                                $scope.outliers_low.push(feature.properties[indicatorPropertyName]);
                                              }
                                              // else if (feature.properties[indicatorPropertyName] < whisker_low_soft){
                                              //   feature.properties[outlierPropertyName] = outlierPropertyValue_low_soft;
                                              //   $scope.containsOutliers_low = true;
                                              //   $scope.outliers_low.push(feature.properties[indicatorPropertyName]);
                                              // }
                                              else if (feature.properties[indicatorPropertyName] > whisker_high_extreme){
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
                                          $scope.outliers_high.sort(function(a, b) {
                                            return a - b;
                                          });
                                          $scope.outliers_low.sort(function(a, b) {
                                            return a - b;
                                          });

                                          return indicatorMetadataAndGeoJSON;
                                        }

                                                  $scope.$on("replaceIndicatorAsGeoJSON", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation) {

                                                                console.log('replaceIndicatorAsGeoJSON was called');

                                                                refreshFilteredStyle();
                                                                refreshOutliersStyle();

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

                                                                $scope.date = date;

                                                                $scope.indicatorPropertyName = INDICATOR_DATE_PREFIX + date;
                                                                $scope.indicatorName = indicatorMetadataAndGeoJSON.indicatorName;
                                                                $scope.indicatorDescription = indicatorMetadataAndGeoJSON.metadata.description;
                                                                $scope.indicatorUnit = indicatorMetadataAndGeoJSON.unit;

                                                                // identify and mark outliers prior to setting up of styling
                                                                // in styling methods, outliers should be removed from classification!
                                                                  $scope.currentIndicatorMetadataAndGeoJSON = markOutliers($scope.currentIndicatorMetadataAndGeoJSON, $scope.indicatorPropertyName);

                                                                $scope.currentGeoJSONOfCurrentLayer = $scope.currentIndicatorMetadataAndGeoJSON.geoJSON;

                                                                for (var i = 0; i < indicatorMetadataAndGeoJSON.geoJSON.features.length; i++){
                                                                    if (indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName] === 0 || indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName] === "0"){
                                                                      $scope.currentIndicatorContainsZeroValues = true;
                                                                      break;
                                                                    };
                                                                }

                                                                var layer;

                                                                $scope.indicatorTypeOfCurrentLayer = indicatorMetadataAndGeoJSON.indicatorType;

                                                                if(kommonitorDataExchangeService.isMeasureOfValueChecked){
                                                                  setupMeasureOfValueBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, defaultColorBrewerPaletteForGtMovValues, defaultColorBrewerPaletteForLtMovValues, $scope.classifyMethod, kommonitorDataExchangeService.measureOfValue);
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
                                                                    setupDynamicIndicatorBrew(indicatorMetadataAndGeoJSON.geoJSON, $scope.indicatorPropertyName, defaultColorBrewerPaletteForBalanceIncreasingValues, defaultColorBrewerPaletteForBalanceDecreasingValues, $scope.classifyMethod);
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

                                                                if($scope.containsOutliers_low || $scope.containsOutliers_high){
                                                                  $scope.showOutlierInfoAlert = true;
                                                                }

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

                                                                          refreshFilteredStyle();
                                                                          refreshOutliersStyle();

                                                                          if($scope.currentIndicatorLayer){

                                                                            if(!kommonitorDataExchangeService.isBalanceChecked){
                                                                              // if mode is not balance then we have to make use of "normal" unbalanced indicator values
                                                                              $scope.currentIndicatorMetadataAndGeoJSON = kommonitorDataExchangeService.selectedIndicator;
                                                                                $scope.currentIndicatorMetadataAndGeoJSON = markOutliers($scope.currentIndicatorMetadataAndGeoJSON, $scope.indicatorPropertyName);
                                                                              $scope.currentGeoJSONOfCurrentLayer = kommonitorDataExchangeService.selectedIndicator.geoJSON;
                                                                            }
                                                                            else{
                                                                              // if mode is not balance then we have to make use of "normal" unbalanced indicator values
                                                                              $scope.currentIndicatorMetadataAndGeoJSON = kommonitorDataExchangeService.indicatorAndMetadataAsBalance;
                                                                                $scope.currentIndicatorMetadataAndGeoJSON = markOutliers($scope.currentIndicatorMetadataAndGeoJSON, $scope.indicatorPropertyName);
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
                                                                              setupMeasureOfValueBrew($scope.currentGeoJSONOfCurrentLayer, $scope.indicatorPropertyName, defaultColorBrewerPaletteForGtMovValues, defaultColorBrewerPaletteForLtMovValues, $scope.classifyMethod, kommonitorDataExchangeService.measureOfValue);
                                                                              $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                                                                  layer.setStyle($scope.filteredStyle);
                                                                                }
                                                                                else{
                                                                                  layer.setStyle(styleMeasureOfValue(layer.feature));
                                                                                }

                                                                              });

                                                                              $scope.makeMeasureOfValueLegend();
                                                                            }
                                                                            else{

                                                                              if($scope.indicatorTypeOfCurrentLayer === 'DYNAMIC'){
                                                                                setupDynamicIndicatorBrew($scope.currentGeoJSONOfCurrentLayer, $scope.indicatorPropertyName, defaultColorBrewerPaletteForBalanceIncreasingValues, defaultColorBrewerPaletteForBalanceDecreasingValues, $scope.classifyMethod);

                                                                                $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                  if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                                                                    layer.setStyle($scope.filteredStyle);
                                                                                  }
                                                                                  else{
                                                                                    layer.setStyle(styleDynamicIndicator(layer.feature));
                                                                                  }

                                                                                });
                                                                                $scope.makeDynamicIndicatorLegend();
                                                                              }
                                                                              else{
                                                                                setupDefaultBrew($scope.currentGeoJSONOfCurrentLayer, $scope.indicatorPropertyName, kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.items.length, kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName, $scope.classifyMethod);
                                                                                $scope.currentIndicatorLayer.eachLayer(function(layer) {
                                                                                    if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(layer.feature.properties.spatialUnitFeatureName)){
                                                                                      layer.setStyle($scope.filteredStyle);
                                                                                    }
                                                                                    else{
                                                                                      layer.setStyle(styleDefault(layer.feature));
                                                                                    }
                                                                                });
                                                                                $scope.makeDefaultLegend(kommonitorDataExchangeService.selectedIndicator.defaultClassificationMapping);
                                                                              }

                                                                            }

                                                                            var justRestyling = true;

                                                                            var indicatorObjectForDiagramUpdate = kommonitorDataExchangeService.selectedIndicator;
                                                                            if(kommonitorDataExchangeService.isBalanceChecked){
                                                                              indicatorObjectForDiagramUpdate = $scope.currentIndicatorMetadataAndGeoJSON;
                                                                            }
                                                                            $rootScope.$broadcast("updateDiagrams", indicatorObjectForDiagramUpdate, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId, $scope.date, $scope.defaultBrew, $scope.gtMeasureOfValueBrew, $scope.ltMeasureOfValueBrew, $scope.dynamicIncreaseBrew, $scope.dynamicDecreaseBrew, kommonitorDataExchangeService.isMeasureOfValueChecked, kommonitorDataExchangeService.measureOfValue, justRestyling);

                                                                            //ensure that highlighted feature remain highlighted
                                                                            preserveHighlightedFeatures();
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
