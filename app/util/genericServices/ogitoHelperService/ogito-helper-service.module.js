angular.module('ogitoHelper', ['kommonitorDataExchange', 'kommonitorFileHelper']);

/**
 * a common serviceInstance that holds all needed properties for a WPS service.
 *
 * This service represents a shared object ´which is used across the different
 * application tabs/components like Setup, Capabilities, Execute etc.
 *
 * This way, one single service instance can be used to easily share values and
 * parameters for each WPS operation represented by different Angular components
 */
angular
  .module('ogitoHelper', [])
  .service(
    'ogitoHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', 
      '__env', 'kommonitorFileHelperService',
    function ($rootScope, $timeout,
      kommonitorDataExchangeService, $http, __env, kommonitorFileHelperService) {

        let self = this;

        this.targetURLToOgito_WFS = "https://ogito.hs-gesundheit.de/cgi-bin/qgis_mapserv.fcgi?SERVICE=WFS&map=/home/qgis/projects/lap_bo_workshop.qgs";

        this.init = function(){
          // add known datasets to WMS and WFS interfaces
          // kommonitorDataExchangeService.wfsDatasets.push({
          //     title: "OGITO - LAP - Sketch Linien",
          //     description: "OGITO",
          //     url: "https://ogito.hs-gesundheit.de/cgi-bin/qgis_mapserv.fcgi?SERVICE=WFS&VERSION=1.3.0&map=/home/qgis/projects/lap_bo_workshop.qgs",
          //     featureTypeNamespace: "",
          //     featureTypeName: "sketch_ls",
          //     featureTypeGeometryName: "geom",
          //     geometryType: "LOI", // POI|LOI|AOI
          //     poiSymbolColor: "white", // ['white', 'red', 'orange', 'beige', 'green', 'blue', 'purple', 'pink', 'gray', 'black']
          //     poiMarkerColor: "red", // ['white', 'red', 'orange', 'beige', 'green', 'blue', 'purple', 'pink', 'gray', 'black']
          //     poiSymbolBootstrap3Name: "home",
          //     loiColor: "#00aabb",
          //     loiWidth: 3,
          //     loiDashArrayString: "",
          //     aoiColor: "#00aabb",
          //     filterFeaturesToMapBBOX: false,
          //     filterEncoding: {
          //       // PropertyIsEqualTo: {
          //       //   propertyName: undefined,
          //       //   propertyValue: undefined
          //     // }
          //     },
          //     topicReference: ""
          //   }
          // );

          // kommonitorDataExchangeService.wfsDatasets.push({
          //     title: "OGITO - LAP - Sketch Punkte",
          //     description: "OGITO",
          //     url: "https://ogito.hs-gesundheit.de/cgi-bin/qgis_mapserv.fcgi?map=/home/qgis/projects/lap_bo_workshop.qgs",
          //     featureTypeNamespace: "",
          //     featureTypeName: "sketch_points",
          //     featureTypeGeometryName: "geom",
          //     geometryType: "POI", // POI|LOI|AOI
          //     poiSymbolColor: "white", // ['white', 'red', 'orange', 'beige', 'green', 'blue', 'purple', 'pink', 'gray', 'black']
          //     poiMarkerColor: "red", // ['white', 'red', 'orange', 'beige', 'green', 'blue', 'purple', 'pink', 'gray', 'black']
          //     poiSymbolBootstrap3Name: "home",
          //     loiColor: "#00aabb",
          //     loiWidth: 3,
          //     loiDashArrayString: "",
          //     aoiColor: "#00aabb",
          //     filterFeaturesToMapBBOX: false,
          //     filterEncoding: {
          //       // PropertyIsEqualTo: {
          //       //   propertyName: undefined,
          //       //   propertyValue: undefined
          //     // }
          //     },
          //     topicReference: ""
          //   }
          // );

          kommonitorDataExchangeService.wmsDatasets.push({
            title: "OGITO - Online Beteiligung LAP",
            description: "",
            url: "https://ogito.hs-gesundheit.de/cgi-bin/qgis_mapserv.fcgi?map=/home/qgis/projects/lap_bo_workshop.qgs",
            topicReference: "ee7752dd-767d-41dc-85eb-a72e918b3309",
            layerName: "Online Beteiligung"
          }
          );

          kommonitorDataExchangeService.wmsDatasets.push({
            title: "OGITO - Tempozonen LAP",
            description: "",
            url: "https://ogito.hs-gesundheit.de/cgi-bin/qgis_mapserv.fcgi?map=/home/qgis/projects/lap_bo_workshop.qgs",
            topicReference: "ee7752dd-767d-41dc-85eb-a72e918b3309",
            layerName: "Tempozonen"
          }
          );

        }

        this.init();

        this.loadSketchData_pois = async function(){
          return await $http({
          url: this.targetURLToOgito_WFS + "&request=GetFeature&typeName=sketch_pt&outputFormat=application/json&srsName=EPSG:4326",
          method: "GET",
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            let geoJSON = response.data;
            let customColor = `#00AABB`;
					  let customMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[2];
            let datasetName = "OGITO - Sketch - Punkte LAP";
            let customIcon = "pushpin"; 
            
            let tmpGeoresource_fromKobo = kommonitorFileHelperService.makeGeoresourceMetadata_fromKobotoolboxDataset(datasetName, customColor, customMarkerColor, customIcon, "GeoJSON", geoJSON);
            
            $rootScope.$broadcast("GeoJSONFromFileFinished", tmpGeoresource_fromKobo);
  
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            kommonitorDataExchangeService.displayMapApplicationError(error);

        });
        }

        this.loadSketchData_lois = async function(){
          return await $http({
          url: this.targetURLToOgito_WFS + "&request=GetFeature&typeName=sketch_ls&outputFormat=application/json&srsName=EPSG:4326",
          method: "GET",
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            let geoJSON = response.data;
            let customColor = `#00AABB`;
					  let customMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[4];
            let datasetName = "OGITO - Sketch - Linien LAP";
            let customIcon = "pushpin"; 
            
            let tmpGeoresource_fromKobo = kommonitorFileHelperService.makeGeoresourceMetadata_fromKobotoolboxDataset(datasetName, customColor, customMarkerColor, customIcon, "GeoJSON", geoJSON);
            
            $rootScope.$broadcast("GeoJSONFromFileFinished", tmpGeoresource_fromKobo);
  
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            kommonitorDataExchangeService.displayMapApplicationError(error);

        });
        }

        this.loadSketchData_aois = async function(){
          return await $http({
          url: this.targetURLToOgito_WFS + "&request=GetFeature&typeName=sketch_poly&outputFormat=application/json&srsName=EPSG:4326",
          method: "GET",
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            let geoJSON = response.data;
            let customColor = `#00AABB`;
					  let customMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[4];
            let datasetName = "OGITO - Sketch - Polygone LAP";
            let customIcon = "pushpin"; 
            
            let tmpGeoresource_fromKobo = kommonitorFileHelperService.makeGeoresourceMetadata_fromKobotoolboxDataset(datasetName, customColor, customMarkerColor, customIcon, "GeoJSON", geoJSON);
            
            $rootScope.$broadcast("GeoJSONFromFileFinished", tmpGeoresource_fromKobo);
  
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            kommonitorDataExchangeService.displayMapApplicationError(error);

        });
        }

        this.loadMeasures = async function(){
          return await $http({
          url: this.targetURLToOgito_WFS + "&request=GetFeature&typeName=measures&outputFormat=application/json&srsName=EPSG:3857",
          method: "GET",
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            let geoJSON = response.data;
            let customColor = `#00AABB`;
					  let customMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[5];
            let datasetName = "OGITO - Maßnahmen";
            let customIcon = "pushpin"; 
            
            let tmpGeoresource_fromKobo = kommonitorFileHelperService.makeGeoresourceMetadata_fromKobotoolboxDataset(datasetName, customColor, customMarkerColor, customIcon, "GeoJSON", geoJSON);
            
            $rootScope.$broadcast("GeoJSONFromFileFinished", tmpGeoresource_fromKobo);
  
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            kommonitorDataExchangeService.displayMapApplicationError(error);

        });
        }
      
    }]);
