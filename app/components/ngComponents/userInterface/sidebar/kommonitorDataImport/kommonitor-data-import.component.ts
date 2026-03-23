import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { NgbDropdown,NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { FileHelperService } from 'services/file-helper-service/file-helper.service';
import { GeocoderHelperService } from 'services/geocoder-helper-service/geocoder-helper.service';
import { MapService } from 'services/map-service/map.service';
import { ColorPickerDirective } from 'ngx-color-picker';

@Component({
  standalone: true,
  selector: 'app-kommonitor-data-import',
  templateUrl: './kommonitor-data-import.component.html',
  styleUrls: ['./kommonitor-data-import.component.scss'],
  imports: [
    CommonModule,
    ExpandableBoxComponent,
    NgbDropdown, 
    NgbDropdownToggle, 
    NgbDropdownMenu,
    ColorPickerDirective
  ]
})
export class KommonitorDataImportComponent {

  /*
    * reference to this.kommonitorDataExchangeService instances
    */

  @ViewChild('poiColorDropdown') poiColorDropdown!: NgbDropdown;

  filteredPoiMarkerColors;

  color = 'red';

  constructor(
    protected kommonitorDataExchangeService: DataExchangeService,
    private kommonitorMapService: MapService,
    private kommonitorGeocoderHelperService: GeocoderHelperService,
    private kommonitorFileHelperService: FileHelperService
  ) {
    this.filteredPoiMarkerColors = this.kommonitorDataExchangeService.availablePoiMarkerColors.filter(e => e.colorName!='white');
  }

  loadingData = false;
  date;

  fileLayerError;

  wmsNameFilter = undefined;

  customFileInputColor = `#00AABB`;
  customFileInputMarkerColor = this.kommonitorDataExchangeService.availablePoiMarkerColors[0];

  tmpKommonitorGeoresource_table;
  tableProcessType;
  tableProcessTypes = [
    {
      displayName: "Latitude und Longitude Spalten",
      apiName: "latLon"
    },
    {
      displayName: "Adressen - Ort, PLZ, Strasse",
      apiName: "address"
    }
  ]

 /*  $('#customFileInputColorDiv').colorpicker();

  // initialize colorpicker after some time
  // wait to ensure that elements ar available on DOM
  setTimeout(function () {

    var colorPickerInputs = $('.input-group.colorpicker-component')
    colorPickerInputs.colorpicker();

    // $('.input-group.colorpicker-component').each(function (index, value){
    // 	$(this).colorpicker();
    // });
  }, 3000); */


  // initialize any adminLTE box widgets
  /* $('.box').boxWidget(); */

  DATE_PREFIX = window.__env.indicatorDatePrefix;

  numberOfDecimals = window.__env.numberOfDecimals;

  onChangeCustomMarkerColor(markerColor){
    this.customFileInputMarkerColor = markerColor;

    this.poiColorDropdown.close();
  }

  addUniqueFileToMap(dataset) {
    console.log("Toggle File Layer: " + dataset.datasetName);

    let clone = JSON.parse(JSON.stringify(dataset));	
    if(dataset.type == "CSV"){
      clone.datasetName = clone.datasetName + "_" + this.tableProcessType.apiName;
    }

    if(this.fileWithSameNameAlreadyImported(clone)){
      //kommonitorToastHelperService.displayErrorToast_upperLeft("Datei mit gleichem Namen bereits vorhanden.", "Import der Datei abgebrochen.");
      return;
    }

    if(dataset.geoJSON.features.length == 0){
      //kommonitorToastHelperService.displayErrorToast_upperLeft("Datensatz kann nicht als Layer geladen werden.", "Keine Features im Datensatz.");
      return;
    }

    //kommonitorToastHelperService.displaySuccessToast_upperLeft("Datei erfolgreich importiert. Inhalt wird in Karte geladen", clone.title);

    this.toggleDataLayer(clone);
  };

  fileWithSameNameAlreadyImported(clone){
    for (let i = 0; i < this.kommonitorDataExchangeService.fileDatasets.length; i++) {
      if (this.kommonitorDataExchangeService.fileDatasets[i].datasetName == clone.datasetName) {
        return true;
      }
    }

    return false;
  }

  toggleDataLayer(dataset) {
    if (dataset.isSelected) {
      //display on Map
      var opacity = 1 - dataset.transparency;
      this.kommonitorMapService.addFileLayerToMap(dataset, opacity);
    }
    else {
      //remove WMS layer from map
      this.kommonitorMapService.removeFileLayerFromMap(dataset);
    }
  }

  refreshDataLayer(dataset) {
    if (dataset.isSelected) {
      this.kommonitorMapService.removeFileLayerFromMap(dataset);
      //display on Map
      var opacity = 1 - dataset.transparency;
      this.kommonitorMapService.addFileLayerToMap(dataset, opacity);
    }
  }

 /*  this.$on("GeoJSONFromFileFinished", function (event, tmpKommonitorGeoresource) {

    try {
      // init feature NAME and ID fields
      tmpKommonitorGeoresource = this.initSpecialFields(tmpKommonitorGeoresource);

      this.onChangeIdProperty(tmpKommonitorGeoresource);
      this.onChangeNameProperty(tmpKommonitorGeoresource);

      this.addUniqueFileToMap(tmpKommonitorGeoresource);
    } catch (error) {
      console.error(error);
      this.loadingData = false;
      //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler beim Laden der CSV-Datei", error);
    }						
  }); */

  initSpecialFields(tmpKommonitorGeoresource) {
    // init feature NAME and ID fields
    tmpKommonitorGeoresource.ID_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
    tmpKommonitorGeoresource.NAME_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
    tmpKommonitorGeoresource.LON_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
    tmpKommonitorGeoresource.LAT_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
    tmpKommonitorGeoresource.CITY_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
    tmpKommonitorGeoresource.POSTCODE_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
    tmpKommonitorGeoresource.STREET_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];

    for (const property of tmpKommonitorGeoresource.featureSchema) {
      if (property.toLowerCase().includes("id")) {
        tmpKommonitorGeoresource.ID_ATTRIBUTE = property;
      }
      if (property.toLowerCase().includes("name")) {
        tmpKommonitorGeoresource.NAME_ATTRIBUTE = property;
      }
      if (property.toLowerCase().includes("lon") || property.toLowerCase().includes("rechts") || property.toLowerCase().includes("x")) {
        tmpKommonitorGeoresource.LON_ATTRIBUTE = property;
      }
      if (property.toLowerCase().includes("lat") || property.toLowerCase().includes("hoch") || property.toLowerCase().includes("y")) {
        tmpKommonitorGeoresource.LAT_ATTRIBUTE = property;
      }
      if (property.toLowerCase().includes("stadt") || property.toLowerCase().includes("ort") || property.toLowerCase().includes("gemeinde")) {
        tmpKommonitorGeoresource.CITY_ATTRIBUTE = property;
      }
      if (property.toLowerCase().includes("plz") || property.toLowerCase().includes("post") || property.toLowerCase().includes("leit")) {
        tmpKommonitorGeoresource.POSTCODE_ATTRIBUTE = property;
      }
      if (property.toLowerCase().includes("str") || property.toLowerCase().includes("adr") || property.toLowerCase().includes("addr")) {
        tmpKommonitorGeoresource.STREET_ATTRIBUTE = property;
      }
    }

    return tmpKommonitorGeoresource;
  }

  /* $on("CSVFromFileFinished", function (event, tmpKommonitorGeoresource) {
    try {
      tmpKommonitorGeoresource = this.initSpecialFields(tmpKommonitorGeoresource)

      this.tmpKommonitorGeoresource_table = tmpKommonitorGeoresource;

      //kommonitorToastHelperService.displayInfoToast_upperLeft("CSV-Datei erkannt", "Weitere Konfiguration erforderlich");

      this.$digest();
    } catch (error) {
      console.error(error);
      this.loadingData = false;
      //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler beim Laden der CSV-Datei", error);
    }						
  }); */

  loadCSV_latLon() {
    try {
      let geoJSON = this.makeGeoJSONFromCSVRows_latLon(this.tmpKommonitorGeoresource_table);

      this.tmpKommonitorGeoresource_table.geoJSON = geoJSON;

      this.onChangeIdProperty(this.tmpKommonitorGeoresource_table);
      this.onChangeNameProperty(this.tmpKommonitorGeoresource_table);

      this.addUniqueFileToMap(this.tmpKommonitorGeoresource_table);
    } catch (error) {
      console.error(error);
      this.loadingData = false;
      //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler beim Laden der CSV-Datei", error);
    }
  }

  async loadCSV_address_city_postcode_street() {
    try {
      this.loadingData = true;
   
      let cityProperty = this.tmpKommonitorGeoresource_table.CITY_ATTRIBUTE;
      let postcodeProperty = this.tmpKommonitorGeoresource_table.POSTCODE_ATTRIBUTE;
      let streetProperty = this.tmpKommonitorGeoresource_table.STREET_ATTRIBUTE;
      let resultFeaturesArray = await this.kommonitorGeocoderHelperService.geocodeCSVRows(this.tmpKommonitorGeoresource_table.dataRows, cityProperty, postcodeProperty, streetProperty);

      this.tmpKommonitorGeoresource_table.geoJSON = this.makeFeatureCollection(this.tmpKommonitorGeoresource_table.dataRows, resultFeaturesArray);
      this.tmpKommonitorGeoresource_table.dataRows_notGeocoded = this.identifyNonGeocodedDataRows(this.tmpKommonitorGeoresource_table.dataRows, resultFeaturesArray);

      this.tmpKommonitorGeoresource_table.isGeocodedDataset = true;
      // set markerColor to orange --> guarantees, that gocode result are split up in two categories
      // green = high accuracy; orange = medium accuracy
      this.tmpKommonitorGeoresource_table.poiMarkerColor = "orange";

      //kommonitorToastHelperService.displaySuccessToast_upperLeft(this.tmpKommonitorGeoresource_table.geoJSON.features.length + " von " + this.tmpKommonitorGeoresource_table.dataRows.length + " Adressen geokodiert",
      //  "Objekteigenschaften 'geocoderank' und 'geocodedesc' bewerten Genauigkeit");

      if(this.tmpKommonitorGeoresource_table.dataRows_notGeocoded.length > 0){
        //kommonitorToastHelperService.displayWarningToast_upperLeft(this.tmpKommonitorGeoresource_table.dataRows_notGeocoded.length + " von " + this.tmpKommonitorGeoresource_table.dataRows.length + " Adressen nicht geokodiert");
      }							

      this.loadingData = false;
      
      this.onChangeIdProperty(this.tmpKommonitorGeoresource_table);
      this.onChangeNameProperty(this.tmpKommonitorGeoresource_table);

      this.addUniqueFileToMap(this.tmpKommonitorGeoresource_table);
    } catch (error) {
      console.error(error);
      this.loadingData = false;
      //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler beim Laden der CSV-Datei", error);
    }
  }

  makeFeatureCollection(dataRows, resultFeaturesArray) {
    let featureCollection:any = {
      "type": "FeatureCollection",
      "features": []
    }

    for (let index = 0; index < resultFeaturesArray.length; index++) {
      const singleFeatureArray = resultFeaturesArray[index];
      let row = dataRows[index];

      if (singleFeatureArray[0]) {

        singleFeatureArray[0].type = "Feature";

        // add prefix "geocode_" to all properties of geocoding result
        for (const property_old in singleFeatureArray[0].properties) {
          singleFeatureArray[0].properties["geocoder_" + property_old] = singleFeatureArray[0].properties[property_old]

          delete singleFeatureArray[0].properties[property_old];
        }
        // add lat and lon coord as properties
        singleFeatureArray[0].properties["geocoder_lon"] = singleFeatureArray[0].geometry.coordinates[0];
        singleFeatureArray[0].properties["geocoder_lat"] = singleFeatureArray[0].geometry.coordinates[1];

        // now add all original properties of dataRow
        for (const key in row) {
          if (Object.hasOwnProperty.call(row, key)) {
            singleFeatureArray[0].properties[key] = row[key];
          }
        }

        featureCollection.features.push(singleFeatureArray[0]);
      }
    }

    return featureCollection;
  }

  identifyNonGeocodedDataRows(dataRows, resultFeaturesArray) {
    let nonGeocodedDataRows:any = [];

    for (let index = 0; index < resultFeaturesArray.length; index++) {
      const singleFeatureArray = resultFeaturesArray[index];

      if (!singleFeatureArray[0]) {
        nonGeocodedDataRows.push(dataRows[index]);
      }
    }

    return nonGeocodedDataRows;
  }

  makeGeoJSONFromCSVRows_latLon(kommonitorGeoresource) {
    let geoJSON:any = {
      "type": "FeatureCollection",
      "features": []
    };

    for (const row of kommonitorGeoresource.dataRows) {
      if (row[kommonitorGeoresource.LON_ATTRIBUTE] && row[kommonitorGeoresource.LAT_ATTRIBUTE]) {
        let feature = {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [Number(row[kommonitorGeoresource.LON_ATTRIBUTE]), Number(row[kommonitorGeoresource.LAT_ATTRIBUTE])]
          },
          "properties": row
        };

        geoJSON.features.push(feature);
      }
    }

    return geoJSON;
  }

  dropHandler(ev) {
    this.fileLayerError = undefined;

    try {
      // Prevent default behavior (Prevent file from being opened)
      ev.preventDefault();

      if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (ev.dataTransfer.items[i].kind === 'file') {
            var file = ev.dataTransfer.items[i].getAsFile();
            this.kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, this.customFileInputColor, this.customFileInputMarkerColor);
          }
        }
      } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
          var file = ev.dataTransfer.files[i];
          this.kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, this.customFileInputColor, this.customFileInputMarkerColor);
        }
      }
    } catch (e) {
      this.fileLayerError = e;
      this.loadingData = false;
      console.error(e);
      //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Dateiverarbeitung", this.fileLayerError);
    } finally {

    }

  };

  adjustFileLayerTransparency(dataset) {

    var opacity = 1 - dataset.transparency;

    this.kommonitorMapService.adjustOpacityForFileLayer(dataset, opacity);
  };

  adjustFileLayerColor(dataset) {

    var color = dataset.displayColor;

    this.kommonitorMapService.adjustColorForFileLayer(dataset, color);
  };

  adjustFileLayerMarkerColor(dataset, markerColor){
    dataset.poiMarkerColor = markerColor.colorName;

    this.refreshDataLayer(dataset);
  }

 /*  $.$on("onDropFile", function (ev, dropEvent) {
    this.dropHandler(dropEvent);
  }); */

  // this.dragOverHandler = function(ev) {
  //   console.log('File(s) in drop zone');
  //
  //   // Prevent default behavior (Prevent file from being opened)
  //   ev.preventDefault();
  // };

  openFileDialog() {
    // $("#fileUploadInput").trigger("click");
    document.getElementById("fileUploadInput")?.click();
  };

  /* $(document).on('change', '#fileUploadInput', function () {

    // get the file
    var files = document.getElementById('fileUploadInput').files;

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      this.kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, this.customFileInputColor, this.customFileInputMarkerColor);
    }
  });

  this.$on("FileLayerError", function (event, errorMsg, dataset) {
    this.fileLayerError = errorMsg;
    this.loadingData = false;
    //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Dateiverarbeitung", this.fileLayerError);

    // remove element from fileDatasets
    for (var i = 0; i < this.kommonitorDataExchangeService.fileDatasets.length; i++) {
      if (this.kommonitorDataExchangeService.fileDatasets[i] === dataset) {
        this.kommonitorDataExchangeService.fileDatasets.splice(i, 1);
        break;
      }
    }
  });

  this.$on("FileLayerSuccess", function (event, dataset) {
    this.fileLayerError = undefined;
    this.loadingData = false;						
    
    //remove any old entry with the same name to prevent dupes
    this.removeDataLayerFromOverviewTables(dataset);
    
    this.kommonitorDataExchangeService.fileDatasets.push(JSON.parse(JSON.stringify(dataset)));
    this.kommonitorDataExchangeService.displayableGeoresources.push(dataset);

    setTimeout(function () {
      this.$digest();

      setTimeout(function () {
        // initialize colorpicker
        $('.input-group.colorpicker-component').colorpicker();
      }, 350);
    }, 350);
  }); */

  removeDataLayer(dataset) {

    if (dataset.isSelected) {
      this.kommonitorMapService.removeFileLayerFromMap(dataset);
    }

    this.removeDataLayerFromOverviewTables(dataset);
  }

  removeDataLayerFromOverviewTables(dataset) {

    for (let i = 0; i < this.kommonitorDataExchangeService.fileDatasets.length; i++) {
      if (this.kommonitorDataExchangeService.fileDatasets[i].datasetName == dataset.datasetName) {
        this.kommonitorDataExchangeService.fileDatasets.splice(i, 1);
      }
    }
    for (let i = 0; i < this.kommonitorDataExchangeService.displayableGeoresources.length; i++) {
      if (this.kommonitorDataExchangeService.displayableGeoresources[i].datasetName == dataset.datasetName) {
        this.kommonitorDataExchangeService.displayableGeoresources.splice(i, 1);
      }
    }
  }

  onChangeNameProperty(dataset) {
    // ensure it is a string
    for (const feature of dataset.geoJSON.features) {
      feature.properties[window.__env.FEATURE_NAME_PROPERTY_NAME] = "" + feature.properties[dataset.NAME_ATTRIBUTE]
    }

    // this.refreshDataLayer(dataset);
  }

  onChangeIdProperty(dataset) {
    // ensure it is a string
    for (const feature of dataset.geoJSON.features) {
      feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME] = "" + feature.properties[dataset.ID_ATTRIBUTE]
    }

    // this.refreshDataLayer(dataset);
  }

  downloadDataLayer(dataset) {
    let geoJSON = JSON
      .stringify(dataset.geoJSON);

    var fileName = dataset.datasetName + '_export.json';

    var blob = new Blob([geoJSON], {
      type: 'application/json'
    });
    var data = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = "JSON";
    a.target = "_self";
    a.rel = "noopener noreferrer";
    a.click()
    a.remove();
  }

  downloadGeocodedDataRowsAsGeoJSON_highAccuracy = function(dataset){
    let filteredGeoJSON = JSON.parse(JSON.stringify(dataset.geoJSON));
    filteredGeoJSON.features = filteredGeoJSON.features.filter(feature => feature.properties["geocoder_geocoderank"] == 2);
    let geoJSON = JSON
      .stringify(filteredGeoJSON);

    var fileName = dataset.datasetName + '_export.json';

    var blob = new Blob([geoJSON], {
      type: 'application/json'
    });
    var data = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = "JSON";
    a.target = "_self";
    a.rel = "noopener noreferrer";
    a.click()
    a.remove();
  }

  downloadNonGeocodedDataRowsAsCSV(dataset) {
    // let conf = {
    // 	quotes: false, //or array of booleans
    // 	quoteChar: '"',
    // 	escapeChar: '"',
    // 	delimiter: ";",
    // 	header: true,
    // 	newline: "\r\n",
    // 	skipEmptyLines: true, //other option is 'greedy', meaning skip delimiters, quotes, and whitespace.
    // 	columns: null //or array of strings
    // };
    /* var csv = Papa.unparse(dataset.dataRows_notGeocoded, {delimiter: ";", skipEmptyLines: true});

    var fileName = dataset.datasetName + '_nicht_geokodiert.csv';

    var blob = new Blob([csv], {
      type: 'text/csv'
    });
    var data = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = "CSV";
    a.target = "_self";
    a.rel = "noopener noreferrer";
    a.click()
    a.remove(); */

  }
}
