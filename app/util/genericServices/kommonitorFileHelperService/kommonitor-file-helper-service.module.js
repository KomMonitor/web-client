angular.module('kommonitorFileHelper', ['kommonitorToastHelper', 'kommonitorDataExchange']);


angular
  .module('kommonitorFileHelper', [])
  .service(
    'kommonitorFileHelperService', [
    'kommonitorToastHelperService', 'kommonitorDataExchangeService', '$rootScope',
    function (kommonitorToastHelperService, kommonitorDataExchangeService, $rootScope) {

      /*
        idea: have a service that parses arbitrary files from different formats and offers methods
        to transform them to GeoJSON (as a KomMonitor georessource)
        and to derive file schema from it
      */

      let self = this;

      this.getFeatureSchema_fromGeoJSON = function (geoJSON) {
        // if there are any existing properties, then use the first entry
        let schema = [];
        if (geoJSON && geoJSON.features && geoJSON.features[0] &&
          geoJSON.features[0].properties) {
          for (var property in geoJSON.features[0].properties) {
            if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME) {
              schema.push(
                property
              );
            }
          }
        }

        return schema;
      }

      this.transformFileToKomMonitorGeoressource = function (file, customColor) {
        console.log('... file[' + i + '].name = ' + file.name);
        let tmpKommonitorGeoresource;

        var fileEnding = file.name.split('.').pop();

        if (fileEnding.toUpperCase() === "json".toUpperCase() || fileEnding.toUpperCase() === "geojson".toUpperCase()) {
          console.log("Potential GeoJSON file identified")
          tmpKommonitorGeoresource = this.processFileInput_geoJson(file, customColor);
        }
        else if (fileEnding.toUpperCase() === "zip".toUpperCase()) {
          console.log("Potential Shapefile file identified")
          tmpKommonitorGeoresource = this.processFileInput_shape(file, customColor);
        }
        else {
          let fileLayerError = "Dateiformat kann nicht verarbeitet werden";
          kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Dateiverarbeitung", fileLayerError);
        }

        return tmpKommonitorGeoresource;
      }

      this.makeGeoresourceMetadata = function (file, customColor, type, geoJSON) {
        let tmpKommonitorGeoresource = {
          "allowedRoles": [

          ],
          "aoiColor": customColor,
          "availablePeriodsOfValidity": [
            {
              "endDate": undefined,
              "startDate": undefined
            }
          ],
          "datasetName": file.name,
          "georesourceId": undefined,
          "isAOI": false,
          "isLOI": false,
          "isPOI": false,
          "loiColor": customColor,
          "loiDashArrayString": "10",
          "loiWidth": 1,
          "metadata": {
            "contact": "",
            "databasis": "",
            "datasource": "",
            "description": "",
            "lastUpdate": "",
            "literature": "",
            "note": "",
            "sridEPSG": 0,
            "updateInterval": "ARBITRARY"
          },
          "poiMarkerColor": "orange",
          "poiSymbolBootstrap3Name": "home",
          "poiSymbolColor": "white",
          "topicReference": "",
          "userPermissions": [

          ],
          "wfsUrl": "",
          "wmsUrl": ""
        }

        tmpKommonitorGeoresource.isTmpDataLayer = true;
        tmpKommonitorGeoresource.isSelected = true;
        tmpKommonitorGeoresource.displayColor = customColor;
        tmpKommonitorGeoresource.type = type;
        tmpKommonitorGeoresource.geoJSON = geoJSON;
        tmpKommonitorGeoresource.transparency = 0;

        tmpKommonitorGeoresource.featureSchema = this.getFeatureSchema_fromGeoJSON(geoJSON);

        // guess geom type from first dataset
        if (geoJSON.features) {
          // featureCollection
          if (geoJSON.features[0].geometry) {
            tmpKommonitorGeoresource = this.setGeometryType(tmpKommonitorGeoresource, geoJSON.features[0].geometry);

          }
        }
        else if (geoJSON.geometry) {
          // single object
          tmpKommonitorGeoresource = this.setGeometryType(tmpKommonitorGeoresource, geoJSON.geometry);
        }
        else if (geoJSON.geometries) {
          // geometryCollection
          tmpKommonitorGeoresource = this.setGeometryType(tmpKommonitorGeoresource, geoJSON.geometries[0]);
        }

        return tmpKommonitorGeoresource;
      }

      this.setGeometryType = function (kommonitorGeoresource, geoJSON_geometry) {
        if (geoJSON_geometry.type == "LineString" || geoJSON_geometry.type == "MultiLineString") {
          kommonitorGeoresource.isLOI = true;
        }
        else if (geoJSON_geometry.type == "Point" || geoJSON_geometry.type == "MultiPoint") {
          kommonitorGeoresource.isPOI = true;
        }
        else if (geoJSON_geometry.type == "Polygon" || geoJSON_geometry.type == "MultiPolygon") {
          kommonitorGeoresource.isAOI = true;
        }

        return kommonitorGeoresource;
      }

      this.processFileInput_geoJson = function (file, customColor) {
        var fileReader = new FileReader();

        fileReader.onload = function (event) {
          var geoJSON = JSON.parse(event.target.result);

          let tmpKommonitorGeoresource = self.makeGeoresourceMetadata(file, customColor, "GeoJSON", geoJSON);

          $rootScope.$broadcast("GeoJSONFromFileFinished", tmpKommonitorGeoresource);
        };

        fileReader.readAsText(file);
      }

      this.getGeoJSON_fromShape = async function (arrayBuffer) {
        // transform shape ZIP arrayBuffer to GeoJSON
        // var geoJSON = await shp(dataset.content).then(
        // var zip = shp.parseZip(dataset.content);
        return await shp(arrayBuffer).then(
          function (geojson) {
            console.log("Shapefile parsed successfully");

            return geojson;
          },
          function (reason) {
            console.error("Error while parsing Shapefile");
            console.error(reason);
            kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Dateiverarbeitung", reason);
          }
        );
      }

      this.processFileInput_shape = function (file, customColor) {
        var fileReader = new FileReader();

        fileReader.onload = async function (event) {
          var arrayBuffer = event.target.result;

          let geoJSON = await self.getGeoJSON_fromShape(arrayBuffer);

          let tmpKommonitorGeoresource = self.makeGeoresourceMetadata(file, customColor, "GeoJSON", geoJSON);
          $rootScope.$broadcast("GeoJSONFromFileFinished", tmpKommonitorGeoresource);
        };

        fileReader.readAsArrayBuffer(file);
      };

    }]);
