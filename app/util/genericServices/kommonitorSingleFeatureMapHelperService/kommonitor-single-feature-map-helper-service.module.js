angular.module('kommonitorSingleFeatureMapHelper', ['kommonitorGenericMapHelper']);

angular
  .module('kommonitorSingleFeatureMapHelper')
  .service(
    'kommonitorSingleFeatureMapHelperService', ['$rootScope', '__env', '$timeout', 'kommonitorGenericMapHelperService',
    function ($rootScope, __env, $timeout, kommonitorGenericMapHelperService) {

      var self = this;

      // create, edit, delete
      this.editMode = "create";

      this.georesourceData_geoJSON;

      this.resourceType_point = "POINT";
      this.resourceType_line = "LINE";
      this.resourceType_polygon = "POLYGON";

      /*
        {
          "map": mapObject,
          "layerControl": layerControl,
          "backgroundLayer": backgroundLayer,
          "geosearchControl": geosearchControl,
          "drawControlObject": {
            "drawControl": drawControl,
            "featureLayer": featuerLayer
          }
          "dataLayer": geoJsonDataLayer
        }
        */
      this.mapParts;

      $rootScope.$on("onUpdateSingleFeatureGeometry", function (event, geoJSON, drawControl) {
				self.mapParts.drawControlObject.drawControl = drawControl;
			});

      this.initSingleFeatureGeoMap = function (domId, resourceType) {
        // init leaflet map

        // add geometry editing tool for the respective RESOURCE TYPE

        // add geocoding plugin if it is POINT resource

        // register events that broadcast new geometry to other components

        if(this.mapParts && this.mapParts.map)
        kommonitorGenericMapHelperService.clearMap(this.mapParts.map);

        //function (domId, withLayerControl, withGeosearchControl, withDrawControl, drawResourceType, editMode)
        this.mapParts = kommonitorGenericMapHelperService.initMap(domId, false, true, true, resourceType, this.editMode);
        // response:
        /*
        {
          "map": mapObject,
          "layerControl": layerControl,
          "backgroundLayer": backgroundLayer,
          "geosearchControl": geosearchControl,
          "drawControlObject": drawControlObject
        }
        */
      };

      this.invalidateMap = function(){
        if(this.mapParts && this.mapParts.map){
          kommonitorGenericMapHelperService.invalidateMap(this.mapParts.map);
        } 
      };

      this.zoomToDataLayer = function(){
        if(this.mapParts && this.mapParts.map && this.mapParts.dataLayer){
          kommonitorGenericMapHelperService.zoomToLayer(this.mapParts.map, this.mapParts.dataLayer);
        } 
      };

      this.changeEditableFeature = function (feature) {
        kommonitorGenericMapHelperService.changeEditableFeature(feature, this.mapParts.drawControlObject.featureLayer);
      };

      this.pointToLayer = function (geoJsonPoint, latlng) {
        return L.circleMarker(latlng, {
          radius: 6
        });
      };

      this.style = function (feature) {
        return {
          color: "red",
          weight: 1,
          opacity: 1
        };
      };

      this.onEachFeature = function (feature, layer) {
        layer.on({
          click: function () {

            $rootScope.$broadcast("singleFeatureSelected", feature);

            var popupContent = '<div class="georesourceInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
            for (var p in feature.properties) {
              popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
            }
            popupContent += '</table></div>';

            layer.bindPopup(popupContent);
          }
        });
      };

      this.addDataLayertoSingleFeatureGeoMap = function (geoJSON) {

        this.georesourceData_geoJSON = geoJSON;

        //function (geoJSON, map, layerControl, layerName)
        this.mapParts.dataLayer = kommonitorGenericMapHelperService.addDataLayer(geoJSON, this.mapParts.map, undefined, "", this.onEachFeature, this.pointToLayer, this.style);
      };


    }]);
