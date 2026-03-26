import { Injectable } from '@angular/core';
import * as uuidv4 from '../../../customizedExternalLibs/uuidv4.js';
import shp from 'shpjs';
import Papa from 'papaparse';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BehaviorSubject } from 'rxjs';
import { GeoresourcesDataset, GeoresourcesMetadata } from 'components/ngComponents/models/georesources.models.js';


export interface FileUploadSubject {
  state: FileUploadState;
  value: any | undefined;
}

export enum FileUploadState {
  NONE,
  GEOJSON,
  CSV,
  SUCCESS,
  ERROR
}

@Injectable({
  providedIn: 'root'
})
export class FileHelperService {

  private fileImportSubject = new BehaviorSubject<FileUploadSubject>({state: FileUploadState.NONE, value: undefined});
  fileImport$ = this.fileImportSubject.asObservable();

  constructor(
    private broadcastService: BroadcastService
  ) { }

  setValue(state: FileUploadState, value: any) {
    this.fileImportSubject.next({state: state, value: value});
  }

  getFeatureSchema_fromGeoJSON(geoJSON) {
    // if there are any existing properties, then use the first entry
    let schema:any = [];
    if (geoJSON && geoJSON.features && geoJSON.features[0] &&
      geoJSON.features[0].properties) {
      for (var property in geoJSON.features[0].properties) {
        schema.push(
          property
        );
      }
    }

    return schema;
  }

  getFeatureSchema_fromCsvRows(rows) {
    // if there are any existing properties, then use the first entry
    let schema:any = [];
    if (rows && rows[0]) {
      for (var property in rows[0]) {
        schema.push(
          property
        );

      }
    }

    return schema;
  }

  transformFileToKomMonitorGeoressource(file, customColor, customMarkerColor) {
    let tmpKommonitorGeoresource;

    var fileEnding = file.name.split('.').pop();

    if (fileEnding.toUpperCase() === "json".toUpperCase() || fileEnding.toUpperCase() === "geojson".toUpperCase()) {
      console.log("Potential GeoJSON file identified")
      tmpKommonitorGeoresource = this.processFileInput_georesource_geoJson(file, customColor, customMarkerColor);
    }
    else if (fileEnding.toUpperCase() === "zip".toUpperCase()) {
      console.log("Potential Shapefile file identified")
      tmpKommonitorGeoresource = this.processFileInput_georesource_shape(file, customColor, customMarkerColor);
    }
    else if (fileEnding.toUpperCase() === "csv".toUpperCase()) {
      console.log("Potential CSV file identified")
      tmpKommonitorGeoresource = this.processFileInput_georesource_csv(file, customColor, customMarkerColor);
    }
    else {
      let fileLayerError = "Dateiformat kann nicht verarbeitet werden";
      //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Dateiverarbeitung", fileLayerError);
    }

    return tmpKommonitorGeoresource;
  }

  makeGeoresourceMetadata(file, customColor, customMarkerColor, type, geoJSON):GeoresourcesDataset {
    let tmpKommonitorGeoresource:GeoresourcesDataset = {
      permissions: [

      ],
      aoiColor: customColor,
      availablePeriodsOfValidity: [
        {
          endDate: undefined,
          startDate: undefined
        }
      ],
      datasetName: file.name,
      georesourceId: uuidv4(),
      georesourceName: undefined,
      isAOI: false,
      isLOI: false,
      isPOI: false,
      loiColor: customColor,
      loiDashArrayString: "10",
      loiWidth: 1,
      metadata: {
        contact: "",
        databasis: "",
        datasource: "",
        description: "",
        lastUpdate: "",
        literature: "",
        note: "",
        sridEPSG: 0,
        updateInterval: "ARBITRARY"
      },
      poiMarkerColor: customMarkerColor.colorName,
      poiSymbolBootstrap3Name: "thumbtack",
      poiSymbolColor: "white",
      topicReference: "",
      userPermissions: [

      ],
      wfsUrl: "",
      wmsUrl: "",
      geoJSON: geoJSON,
      isTmpDataLayer: true,
      isSelected: true,
      displayColor: customColor,
      type: type,
      transparency: 0,
      isPublic: false,
      ownerId: undefined,
      poiMarkerStyle: undefined,
      poiMarkerText: undefined,
      selectedDate: undefined
    }


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

  makeGeoresourceMetadata_fromCsvRows(file, customColor, customMarkerColor, type, rows):GeoresourcesDataset {
    let tmpKommonitorGeoresource:GeoresourcesDataset = {
      permissions: [

      ],
      aoiColor: customColor,
      availablePeriodsOfValidity: [
        {
          endDate: undefined,
          startDate: undefined
        }
      ],
      datasetName: file.name,
      georesourceId: uuidv4(),
      isAOI: false,
      isLOI: false,
      isPOI: true,
      loiColor: customColor,
      loiDashArrayString: "10",
      loiWidth: 1,
      metadata: {
        contact: "",
        databasis: "",
        datasource: "",
        description: "",
        lastUpdate: "",
        literature: "",
        note: "",
        sridEPSG: 0,
        updateInterval: "ARBITRARY"
      },
      poiMarkerColor: customMarkerColor.colorName,
      poiSymbolBootstrap3Name: "thumbtack",
      poiSymbolColor: "white",
      topicReference: "",
      userPermissions: [

      ],
      wfsUrl: "",
      wmsUrl: "",
      georesourceName: undefined, 
      geoJSON: undefined, 
      isPublic: false, 
      isTmpDataLayer: true,
      isSelected: true,
      displayColor: customColor,
      type: type,
      transparency:0,
      dataRows: rows,
      featureSchema: this.getFeatureSchema_fromCsvRows(rows),
      ownerId: undefined, 
      poiMarkerStyle: undefined, 
      poiMarkerText: undefined, 
      selectedDate: undefined
    }

    return tmpKommonitorGeoresource;
  }

  setGeometryType(kommonitorGeoresource, geoJSON_geometry) {
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

  processFileInput_georesource_geoJson(file, customColor, customMarkerColor) {
    var fileReader = new FileReader();

    fileReader.onload = (event:any) => {
      var geoJSON = JSON.parse(event.target.result);
      let tmpKommonitorGeoresource = this.makeGeoresourceMetadata(file, customColor, customMarkerColor, "GeoJSON", geoJSON);
      this.setValue(FileUploadState.GEOJSON, tmpKommonitorGeoresource);
    };

    fileReader.readAsText(file);
  }

  getGeoJSON_fromShape = async function (arrayBuffer) {
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
        //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Dateiverarbeitung", reason);
      }
    );
  }

  processFileInput_georesource_shape(file, customColor, customMarkerColor) {
    var fileReader = new FileReader();

    fileReader.onload = async (event:any) => {
      var arrayBuffer = event.target.result;

      let geoJSON = await this.getGeoJSON_fromShape(arrayBuffer);

      let tmpKommonitorGeoresource = this.makeGeoresourceMetadata(file, customColor, customMarkerColor, "GeoJSON", geoJSON);
      this.setValue(FileUploadState.GEOJSON, tmpKommonitorGeoresource);
    };

    fileReader.readAsArrayBuffer(file);
  };

  processFileInput_georesource_csv(file, customColor, customMarkerColor) {
    var fileReader = new FileReader();

    fileReader.onload = (event:any) => {
      // Key data by field name instead of index/position
      let results = Papa.parse(event.target.result, {
        header: true,
        skipEmptyLines: true,
      });

      let tmpKommonitorGeoresource = this.makeGeoresourceMetadata_fromCsvRows(file, customColor, customMarkerColor, "CSV", results.data);
      this.setValue(FileUploadState.CSV, tmpKommonitorGeoresource);
    };

    fileReader.readAsText(file);
  }

  makeIndicatorReferenceValuesObjects(rows){
    let indicatorRegionalReferenceValuesObject = {
      "dataRows": rows,
      "featureSchema": this.getFeatureSchema_indicatorRegionalReferenceValues(rows)
    };

    return indicatorRegionalReferenceValuesObject;
  };

  transformFileToKomMonitorIndicatorRegionalReferenceValuesObject(file){
    var fileReader = new FileReader();

    fileReader.onload = (event:any) => {
      // Key data by field name instead of index/position
      let results = Papa.parse(event.target.result, {
        header: true,
        skipEmptyLines: true,
      });

      let indicatorRegionalReferenceValuesObject = this.makeIndicatorReferenceValuesObjects(results.data);

      this.broadcastService.broadcast("CSVFromFileFinished_indicatorRegionalReferenceValues", indicatorRegionalReferenceValuesObject);
    };

    fileReader.readAsText(file);
  }

  getFeatureSchema_indicatorRegionalReferenceValues(rows) {
    // if there are any existing properties, then use the first entry
    let schema:any = [];
    if (rows && rows[0]) {
      for (var property in rows[0]) {
        schema.push(
          property
        );

      }
    }

    return schema;
  }
}
