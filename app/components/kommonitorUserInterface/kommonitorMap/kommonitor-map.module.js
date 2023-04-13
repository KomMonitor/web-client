angular.module('kommonitorMap', ['kommonitorDataExchange', 'kommonitorVisualStyleHelper', 'kommonitorInfoLegendHelper', 'kommonitorFilterHelper']);
/**
 * a common serviceInstance that holds all needed properties and methods for
 * interacting with a map (openlayers).
 */
angular.module('kommonitorMap').service(
		'kommonitorMapService',
		[ '$rootScope', '$http', function($rootScope, $http) {


			// // central map object
			// this.map;
			//
			// this.initializeMap = function() {
			//
      //   // initialize map referring to div element with id="map"
      //   this.map = L.map('map').setView([51.4386432, 7.0115552], 12);
			//
      //   // create OSM tile layer with correct attribution
      //   var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      //   var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
      //   var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 19, attribution: osmAttrib}).addTo(this.map);
			//
			// }

			this.addSpatialUnitGeopackage = function () {

				$rootScope.$broadcast("addSpatialUnitAsGeopackage");
			};


			this.addSpatialUnitGeoJSON = function (spatialUnitMetadataAndGeoJSON, date) {

				$rootScope.$broadcast("addSpatialUnitAsGeoJSON",
						spatialUnitMetadataAndGeoJSON, date);
			};

			this.addSpatialUnitWFS = function (name, wfsUrl) {

				$rootScope.$broadcast("addSpatialUnitAsWFS",
						name, wfsUrl);
			};

			this.addGeoresourceGeoJSON = function (georesourceMetadataAndGeoJSON, date) {

				$rootScope.$broadcast("addGeoresourceAsGeoJSON",
						georesourceMetadataAndGeoJSON, date);
			};

      this.addPoiGeoresourceGeoJSON = function (georesourceMetadataAndGeoJSON, date, useCluster) {

				$rootScope.$broadcast("addPoiGeoresourceAsGeoJSON",
						georesourceMetadataAndGeoJSON, date, useCluster);
			};

	   this.addPoiGeoresourceGeoJSON_reachabilityAnalysis = function (georesourceMetadataAndGeoJSON, date, useCluster) {

				$rootScope.$broadcast("addPoiGeoresourceAsGeoJSON_reachabilityAnalysis",
						georesourceMetadataAndGeoJSON, date, useCluster);
			};	

      this.addLoiGeoresourceGeoJSON = function (georesourceMetadataAndGeoJSON, date) {

				$rootScope.$broadcast("addLoiGeoresourceAsGeoJSON",
						georesourceMetadataAndGeoJSON, date);
			};

      this.addAoiGeoresourceGeoJSON = function (georesourceMetadataAndGeoJSON, date) {

				$rootScope.$broadcast("addAoiGeoresourceAsGeoJSON",
						georesourceMetadataAndGeoJSON, date);
			};

      this.replaceIsochroneGeoJSON = function (geoJSON, transitMode, reachMode, cutOffValues, useMultipleStartPoints, dissolveIsochrones) {

				$rootScope.$broadcast("replaceIsochronesAsGeoJSON",
						geoJSON, transitMode, reachMode, cutOffValues, useMultipleStartPoints, dissolveIsochrones);
			};

      this.replaceRouteGeoJSON = function (geoJSON, transitMode, preference, routingStartPoint, routingEndPoint,
		routeDistance_km, routeDuration_minutes) {

				$rootScope.$broadcast("replaceRouteAsGeoJSON", geoJSON, transitMode, preference, routingStartPoint, routingEndPoint, 
				routeDistance_km, routeDuration_minutes);
			};

      this.replaceIsochroneMarker = function (lonLatArray) {

				$rootScope.$broadcast("replaceIsochroneMarker",
						lonLatArray);
			};

      this.removePoiGeoresource = function (georesourceMetadataAndGeoJSON) {

				$rootScope.$broadcast("removePoiGeoresource",
						georesourceMetadataAndGeoJSON);
			};

	   this.removePoiGeoresource_reachabilityAnalysis = function (georesourceMetadataAndGeoJSON) {

				$rootScope.$broadcast("removePoiGeoresource_reachabilityAnalysis",
						georesourceMetadataAndGeoJSON);
			};		

      this.removeLoiGeoresource = function (georesourceMetadataAndGeoJSON) {

				$rootScope.$broadcast("removeLoiGeoresource",
						georesourceMetadataAndGeoJSON);
			};

      this.removeAoiGeoresource = function (georesourceMetadataAndGeoJSON) {

				$rootScope.$broadcast("removeAoiGeoresource",
						georesourceMetadataAndGeoJSON);
			};

      this.removeReachabilityLayers = function(){
        $rootScope.$broadcast("removeReachabilityLayers");
      }

      this.removeRoutingLayers = function(){
        $rootScope.$broadcast("removeRoutingLayers");
      }

			this.addIndicatorGeoJSON = function (indicatorMetadataAndGeoJSON, spatialUnitName, date) {

				$rootScope.$broadcast("addIndicatorAsGeoJSON",
						indicatorMetadataAndGeoJSON, spatialUnitName, date);
			};

			this.replaceIndicatorGeoJSON = function (indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation) {

				$rootScope.$broadcast("replaceIndicatorAsGeoJSON",
						indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation);
			};

			this.addCustomIndicatorGeoJSON = function (indicatorMetadataAndGeoJSON, spatialUnitName, date) {

				$rootScope.$broadcast("addCustomIndicatorAsGeoJSON",
						indicatorMetadataAndGeoJSON, spatialUnitName, date);
			};

			this.restyleCurrentLayer = function () {

				$rootScope.$broadcast("restyleCurrentLayer");
			};

      this.addWmsLayerToMap = function (dataset, opacity) {
        $rootScope.$broadcast("addWmsLayerToMap",
            dataset);
      };

      this.adjustOpacityForWmsLayer = function (dataset, opacity) {
        $rootScope.$broadcast("adjustOpacityForWmsLayer",
            dataset, opacity);
	  };

	  this.adjustOpacityForAoiLayer = function (dataset, opacity) {
        $rootScope.$broadcast("adjustOpacityForAoiLayer",
            dataset, opacity);
	  };
	  
	  this.adjustOpacityForPoiLayer = function (dataset, opacity) {
        $rootScope.$broadcast("adjustOpacityForPoiLayer",
            dataset, opacity);
	  };
	  
	  this.adjustOpacityForLoiLayer = function (dataset, opacity) {
        $rootScope.$broadcast("adjustOpacityForLoiLayer",
            dataset, opacity);
      };

      this.removeWmsLayerFromMap = function (dataset) {
        $rootScope.$broadcast("removeWmsLayerFromMap",
            dataset);
      };

      this.addWfsLayerToMap = function (dataset, opacity, useCluster) {
        $rootScope.$broadcast("addWfsLayerToMap",
            dataset, opacity, useCluster);
      };

      this.adjustOpacityForWfsLayer = function (dataset, opacity) {
        $rootScope.$broadcast("adjustOpacityForWfsLayer",
            dataset, opacity);
      };

      this.adjustColorForWfsLayer = function (dataset, opacity) {
        $rootScope.$broadcast("adjustColorForWfsLayer",
            dataset, opacity);
      };

      this.removeWfsLayerFromMap = function (dataset) {
        $rootScope.$broadcast("removeWfsLayerFromMap",
            dataset);
      };

      this.addFileLayerToMap = function (dataset, opacity) {
        $rootScope.$broadcast("addFileLayerToMap",
            dataset);
      };

      this.adjustOpacityForFileLayer = function (dataset, opacity) {
        $rootScope.$broadcast("adjustOpacityForFileLayer",
            dataset, opacity);
      };

      this.adjustColorForFileLayer = function (dataset, color) {
        $rootScope.$broadcast("adjustColorForFileLayer",
            dataset, color);
      };

      this.removeFileLayerFromMap = function (dataset) {
        $rootScope.$broadcast("removeFileLayerFromMap",
            dataset);
      };



					this.addBaseDataLayer = function (selectedBaseData) {

						$rootScope.$broadcast("addBaseDataLayerAsWMS",
								selectedBaseData);

          };

					this.addIndicatorLayer = function (selectedIndicator) {

						$rootScope.$broadcast("addIndicatorLayerAsWMS",
								selectedIndicator);

                    };

					this.addIndicatorLayer_withNameAndStyle = function(selectedIndicator, layerName, sldName){
						$rootScope.$broadcast("addIndicatorLayerAsWMS_withNameAndStyle",
						{
						'selectedIndicator':selectedIndicator,
						'layerName':layerName,
						'sldName':sldName
						});
					}



					this.visualizeGeometricOutputs = function(geometricOutputs){

						for (var i=0; i < geometricOutputs.length; i++){

							var currentNameForLayerProperty = this.generateUniqueOutputLayerPropertyName();

							/*
							 * if output is a "reference" output, then we will not display
							 * it on the map --> hence continue!
							 */
							if(geometricOutputs[i].reference)
								continue;
							else
								this.addGeometricOutputToMap(geometricOutputs[i], currentNameForLayerProperty);
						}
					};

					this.generateUniqueOutputLayerPropertyName = function(){

						/*
						 * basic name for layer property
						 *
						 * important if we add multiple layers as overlays,
						 * since each layer has to be defined as unique property
						 */
						var baseNameForLayerProperty = 'Output';
						var min = 1;
						var max = 1000;

						var randomNameExtension = (Math.random() * (max - min)) + min;

						return baseNameForLayerProperty + '_' + randomNameExtension;
					};

					this.generateUniqueInputLayerPropertyName = function(inputIdentifier){

						/*
						 * basic name for layer property
						 *
						 * important if we add multiple layers as overlays,
						 * since each layer has to be defined as unique property
						 */
						var baseNameForLayerProperty = 'Input_' + inputIdentifier;

						return baseNameForLayerProperty;

//						var min = 1;
//						var max = 1000;
//
//						var randomNameExtension = (Math.random() * (max - min)) + min;
//
//						return baseNameForLayerProperty + '_' + randomNameExtension;
					};

					this.addGeometricOutputToMap = function(geometricOutput, currentNameForLayerProperty){
						/*
						 * output may be complex output or bbox output
						 */

						if(geometricOutput.data.complexData)
							this.addComplexOutputToMap(geometricOutput, currentNameForLayerProperty);

						else if(geometricOutput.data.boundingBoxData)
							this.addBboxOutputToMap(geometricOutput, currentNameForLayerProperty);

						else
							// should never reach this line; error
							return null;
					};

					this.addComplexOutputToMap = function(complexOutput, currentNameForLayerProperty){
						/*
						 * format will be GeoJSON or a WMS. Hence we must inspect its format/mimeType.
						 */

						var format = complexOutput.data.complexData.mimeType;

						if(format === 'application/WMS'){
							/*
							 * it is a WMS data!
							 */
							this.processAsWMS(complexOutput, currentNameForLayerProperty);
						}
						else{
							/*
							 * it is GeoJSON data!
							 */
							this.processAsGeoJSON(complexOutput, currentNameForLayerProperty);
						}
					};

					this.processAsGeoJSON = function(complexOutput, currentNameForLayerProperty){
						var geoJSONValue = complexOutput.data.complexData.value;

						/*
						 * geoJSONValue can either be a String or directly a GeoJSON object!
						 *
						 * if it it a GeoJSON object, it should have a "type" property!
						 */
						var geoJSONFeature;
						if(geoJSONValue.type){
							/*
							 * is already GeoJSON object!
							 */
							geoJSONFeature = geoJSONValue;
						}
						else{
							/*
							 * it is a String, so we parse it as JSON
							 */
							geoJSONFeature = JSON.parse(geoJSONValue);
						}

						var outputIdentifier = complexOutput.identifier;

						/*
						 * calls the associated event/method from wps-map controller!
						 */
						$rootScope.$broadcast("addGeoJSONOutput",
								{ geoJSONFeature: geoJSONFeature,
								  layerPropertyName: currentNameForLayerProperty,
								  outputIdentifier: outputIdentifier});
					};

					this.processAsWMS = function(complexOutput, currentNameForLayerProperty){

						/*
						 * the WMS URL is currently included as follows:
						 *
						 * <wps:ComplexData mimeType="application/WMS"><![CDATA[http://geoprocessing.demo.52north.org:8080/geoserver/wms?Service=WMS&Request=GetMap&Version=1.1.1&layers=N52:primary3416203586858505312.tif_b5f8f00c-903c-477d-876b-86bfe1fe8788&width=252&height=185&format=image/png&bbox=385735.0,5666656.0,386214.0,5667008.0&srs=EPSG:25832]]></wps:ComplexData>
						 */
						var wmsURL_complexDataValue = complexOutput.data.complexData.value;

						var wmsURL_withQueryParameters = extract_WMS_URL(wmsURL_complexDataValue);

						/*
						 * comma-separated String of layerNames listed in WMS Capabilities
						 *
						 * retrieved from query parameter within wmsURL:
						 * Example: "layers=N52:primary3416203586858505312.tif_b5f8f00c-903c-477d-876b-86bfe1fe8788"
						 */
						var layerNamesString = getUrlQueryParameterValueByName("layers", wmsURL_withQueryParameters);
						console.log("layers query parameter: " + layerNamesString);

						var outputIdentifier = complexOutput.identifier;

						//remove all query parameters to obtain base WMS URL
						var wmsBaseURL = wmsURL_withQueryParameters.split("?")[0];
						//re-append "?" as required by Leaflet
						wmsBaseURL = wmsBaseURL + "?";

						/*
						 * TODO retrieve Capabilities of WMS and get layer names
						 *
						 * TODO maybe there is a JS library that can help us here!
						 *
						 * TODO simply use all layers???
						 *
						 * TODO or similar to reference outputs: Change result forms to show available
						 * WMS Layers and let user choose the layer he/she intends to visualize!
						 */

						/*
						 * calls the associated event/method from wps-map controller!
						 */
						$rootScope.$broadcast("addWMSOutput",
								{ wmsURL: wmsBaseURL,
								  layerNamesString: layerNamesString,
								  layerPropertyName: currentNameForLayerProperty,
								  outputIdentifier: outputIdentifier});
					};

					var extract_WMS_URL = function(wmsURL_complexDataValue){

						/*
						 * WMS URL value might look like this:
						 * "<![CDATA[http://geoprocessing.demo.52north.org:8080/geoserver/wms?Service=WMS&Request=GetMap&Version=1.1.1&layers=N52:primary3416203586858505312.tif_b5f8f00c-903c-477d-876b-86bfe1fe8788&width=252&height=185&format=image/png&bbox=385735.0,5666656.0,386214.0,5667008.0&srs=EPSG:25832]]>"
						 *
						 * Hence we must remove the leading "![CDATA[" and trailing "]]"
						 */

						var leadingCdataString = "<![CDATA[";
						var trailingBracketsString = "]]>";

						console.log(wmsURL_complexDataValue);

						if (wmsURL_complexDataValue.startsWith(leadingCdataString)){
							/*
							 * remove leading and trailing sections
							 */
							var wmsTargetURL = wmsURL_complexDataValue.replace(leadingCdataString, "");

							wmsTargetURL = wmsTargetURL.replace(trailingBracketsString, "");

							console.log(wmsTargetURL);

							return wmsTargetURL;
						}
						else if (wmsURL_complexDataValue.startsWith("http")){
							/*
							 * seems to be the target URL already, no extraction needed
							 */
							return wmsURL_complexDataValue;
						}
						else{
							/*
							 * TODO can this line be reached? Then, how to handle correctly?
							 */
							return wmsURL_complexDataValue;
						}

					};

					function getUrlQueryParameterValueByName(parameterName, url) {

						parameterName = parameterName.replace(/[\[\]]/g, "\\$&");
					    var regex = new RegExp("[?&]" + parameterName + "(=([^&#]*)|&|#|$)"),
					        resultsArray = regex.exec(url);
					    if (!resultsArray)
					    	return null;
					    if (!resultsArray[2])
					    	return '';

					    return decodeURIComponent(resultsArray[2].replace(/\+/g, " "));
					}

					this.addBboxOutputToMap = function(bboxOutput, currentNameForLayerProperty){

						/*
						 * TODO check CRS --> GeoJSON requires WGS84
						 * project if necessary!
						 */

						var outputIdentifier = bboxOutput.identifier;

						var description = bboxOutput.abstractValue || bboxOutput.title;

						var crs = bboxOutput.data.boundingBoxData.crs;

						/*
						 * TODO check CRS --> WGS84 should be used for GeoJSON
						 */

						var lowerCorner = bboxOutput.data.boundingBoxData.lowerCorner;
						var upperCorner = bboxOutput.data.boundingBoxData.upperCorner;

						var coordinatesArray = this.createCoordinatesArrayFromBbox(lowerCorner, upperCorner);

						var geoJSONFeature = {
							    "type": "Feature",
							    "properties": {"popupContent": description},
							    "geometry": {
							        "type": "Polygon",
							        "coordinates": coordinatesArray
							    }
							};

						/*
						 * calls the associated event/method from wps-map controller!
						 */
						$rootScope.$broadcast("addGeoJSONOutput",
								{ geoJSONFeature: geoJSONFeature,
								  layerPropertyName: currentNameForLayerProperty,
								  outputIdentifier: outputIdentifier});
					};

					/**
					 * Creates a Coordinates Array for GeoJSON feature representing the
					 * Bounding Box
					 */
					this.createCoordinatesArrayFromBbox = function(lowerCorner, upperCorner){

						var lat_lowerLeft = parseFloat(lowerCorner.split(" ")[0]);
						var lat_upperRight = parseFloat(upperCorner.split(" ")[0]);
						var lon_lowerLeft = parseFloat(lowerCorner.split(" ")[1]);
						var lon_upperRight = parseFloat(upperCorner.split(" ")[1]);

						var coordinatesArray = [[
    										     [lon_lowerLeft, lat_lowerLeft],
     										     [lon_lowerLeft, lat_upperRight],
 										         [lon_upperRight, lat_upperRight],
 										         [lon_upperRight, lat_lowerLeft],
 										         [lon_lowerLeft, lat_lowerLeft]
    										    ]];

						return coordinatesArray;
					};

		}]);
