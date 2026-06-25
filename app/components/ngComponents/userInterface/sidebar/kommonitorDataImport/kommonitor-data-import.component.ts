import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbDropdown,NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { PoiPresentationService } from 'services/poi-presentation-service/poi-presentation.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { FileHelperService, FileUploadState } from 'services/file-helper-service/file-helper.service';
import { GeocoderHelperService } from 'services/geocoder-helper-service/geocoder-helper.service';
import { MapService } from 'services/map-service/map.service';
import { ColorPickerModule } from 'ngx-color-picker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';

export interface GeoresourcesImportDataset extends GeoresourcesDataset {
   ID_ATTRIBUTE: any;
  NAME_ATTRIBUTE: any;
  LON_ATTRIBUTE: any;
  LAT_ATTRIBUTE: any;
  CITY_ATTRIBUTE: any;
  POSTCODE_ATTRIBUTE: any;
  STREET_ATTRIBUTE: any;
  isGeocodedDataset: boolean;
  dataRows_notGeocoded: any[] | undefined;
}

export interface CSVImportType {
  displayName: string;
  apiName: string;
}

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
    ColorPickerModule,
    FormsModule
  ]
})
export class KommonitorDataImportComponent implements OnInit {

  @ViewChild('poiColorDropdown') poiColorDropdown!: NgbDropdown;
  private readonly destroyRef = inject(DestroyRef);

  fileUploadStateOptions = FileUploadState;

  filteredPoiMarkerColors;

  color = 'red';

  isDragging = false;
  file: File | null = null;

  constructor(
    protected kommonitorDataExchangeService: DataExchangeService,
    protected poiPresentationService: PoiPresentationService,
    private georesourceStore: GeoresourceMetadataStoreService,
    private kommonitorMapService: MapService,
    private kommonitorGeocoderHelperService: GeocoderHelperService,
    private kommonitorFileHelperService: FileHelperService
  ) {
    this.filteredPoiMarkerColors = this.poiPresentationService.availablePoiMarkerColors.filter(e => e.colorName!='white');
  }

  loadingData = false;
  date;

  fileLayerError;

  wmsNameFilter = undefined;

  customFileInputColor = `#00AABB`;
  customFileInputMarkerColor = this.poiPresentationService.availablePoiMarkerColors[0];

  tmpKommonitorGeoresource_table;
  tableProcessType = 'latLon';
  tableProcessTypes:CSVImportType[] = [
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

  ngOnInit(): void {
    
    this.kommonitorFileHelperService.fileImport$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {

        if(value.state==FileUploadState.GEOJSON) 
          this.GeoJSONFromFileFinished(value.value);
        
        if(value.state==FileUploadState.CSV) 
          this.CSVFromFileFinished(value.value);
        
        if(value.state==FileUploadState.SUCCESS)
          this.FileLayerSuccess(value.value);
        
        if(value.state==FileUploadState.ERROR)
          this.FileLayerError(value.value);
      })
  }

  onChangeCustomMarkerColor(markerColor){
    this.customFileInputMarkerColor = markerColor;

    this.poiColorDropdown.close();
  }

  addUniqueFileToMap(dataset) {
    console.log("Toggle File Layer: " + dataset.datasetName);

    let clone = JSON.parse(JSON.stringify(dataset));	
    if(dataset.type == "CSV"){
      clone.datasetName = clone.datasetName + "_" + this.tableProcessType;
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

  GeoJSONFromFileFinished(tmpKommonitorGeoresource:GeoresourcesDataset) {

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
  }

  initSpecialFields(dataset:GeoresourcesDataset):GeoresourcesImportDataset {

    let tmpKommonitorGeoresource = dataset as GeoresourcesImportDataset;

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

  CSVFromFileFinished(tmpKommonitorGeoresource) {
    try {
      tmpKommonitorGeoresource = this.initSpecialFields(tmpKommonitorGeoresource)

      this.tmpKommonitorGeoresource_table = tmpKommonitorGeoresource;

      //kommonitorToastHelperService.displayInfoToast_upperLeft("CSV-Datei erkannt", "Weitere Konfiguration erforderlich");

    } catch (error) {
      console.error(error);
      this.loadingData = false;
      //kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler beim Laden der CSV-Datei", error);
    }						
  }

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

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer?.files.length) {
      this.dropHandler(event);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {

      for (var i = 0; i < input.files.length; i++) {
        var file = input.files[i];
        this.kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, this.customFileInputColor, this.customFileInputMarkerColor);
      }
    }
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

  adjustFileLayerColor(color, dataset) {
    /* don´t user 2way binding for [colorPicker] as the change event laggs behind the binding. known problem. use $event as it is */
    dataset.displayColor = color;

    this.kommonitorMapService.adjustColorForFileLayer(dataset);
  };

  adjustFileLayerMarkerColor(dataset, markerColor){
    dataset.poiMarkerColor = markerColor.colorName;

    this.refreshDataLayer(dataset);
  }

  translateColorName(colorName):string | undefined {
    return this.poiPresentationService.availablePoiMarkerColors.find(e => e.colorName==colorName)?.colorValue;
  }

  FileLayerError([errorMsg, dataset]) {
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
  }

  FileLayerSuccess(dataset) {
    this.fileLayerError = undefined;
    this.loadingData = false;						
    
    //remove any old entry with the same name to prevent dupes
    this.removeDataLayerFromOverviewTables(dataset);
    
    this.kommonitorDataExchangeService.fileDatasets.push(JSON.parse(JSON.stringify(dataset)));
    this.georesourceStore.displayableGeoresources.push(dataset);

    setTimeout( () => {

      setTimeout(() => {
        // initialize colorpicker
        //$('.input-group.colorpicker-component').colorpicker();
      }, 350);
    }, 350);
  }

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
    for (let i = 0; i < this.georesourceStore.displayableGeoresources.length; i++) {
      if (this.georesourceStore.displayableGeoresources[i].datasetName == dataset.datasetName) {
        this.georesourceStore.displayableGeoresources.splice(i, 1);
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
