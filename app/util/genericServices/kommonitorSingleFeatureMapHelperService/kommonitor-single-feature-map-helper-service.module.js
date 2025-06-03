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
      
      this.mapParts;

      /*
        {
          "map": mapObject,
          "layerControl": layerControl,
          "backgroundLayer": backgroundLayer,
          "geosearchControl": geosearchControl,
          "screenshoter": screenshoter,
          "drawControlObject": {
            "drawControl": drawControl,
            "featureLayer": featuerLayer
          }
          "dataLayer": geoJsonDataLayer
        }
        */

      // done
      $rootScope.$on("onUpdateSingleFeatureGeometry", function (event, geoJSON, drawControl) {
				self.mapParts.drawControlObject.drawControl = drawControl;
			});

      // done
      this.initSingleFeatureGeoMap = function (domId, resourceType) {
        // init leaflet map

        // add geometry editing tool for the respective RESOURCE TYPE

        // add geocoding plugin if it is POINT resource

        // register events that broadcast new geometry to other components

        if(this.mapParts && this.mapParts.map)
        kommonitorGenericMapHelperService.clearMap(this.mapParts.map);

        //function (domId, withLayerControl, withGeosearchControl, withDrawControl, drawResourceType, editMode)
        this.mapParts = kommonitorGenericMapHelperService.initMap(domId, false, true, true, true, resourceType, this.editMode);
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

      // done
      this.invalidateMap = function(){
        if(this.mapParts && this.mapParts.map){
          kommonitorGenericMapHelperService.invalidateMap(this.mapParts.map);
        } 
      };

      // done
      this.zoomToDataLayer = function(){
        if(this.mapParts && this.mapParts.map && this.mapParts.dataLayer){
          kommonitorGenericMapHelperService.zoomToLayer(this.mapParts.map, this.mapParts.dataLayer);
        } 
      };

      // done
      this.changeEditableFeature = function (feature) {
        kommonitorGenericMapHelperService.changeEditableFeature(feature, this.mapParts.drawControlObject.featureLayer);
      };

      // done
      this.pointToLayer = function (geoJsonPoint, latlng) {
        return L.circleMarker(latlng, {
          radius: 6
        });
      };

      // done
      this.style = function (feature) {
        return {
          color: "red",
          weight: 1,
          opacity: 1
        };
      };

      // done
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

      // done
      this.addDataLayertoSingleFeatureGeoMap = function (geoJSON) {

        this.georesourceData_geoJSON = geoJSON;

        //function (geoJSON, map, layerControl, layerName)
        this.mapParts.dataLayer = kommonitorGenericMapHelperService.addDataLayer(geoJSON, this.mapParts.map, undefined, "", this.onEachFeature, this.pointToLayer, this.style);
      };


    }]);
//# sourceMappingURL=kommonitor-single-feature-map-helper-service.module.js.map