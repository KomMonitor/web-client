import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { SingleFeatureMapHelperService } from 'services/single-feature-map-helper-service/single-feature-map-helper.service';
import * as uuidv4 from '../../../../../customizedExternalLibs/uuidv4.js';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-single-feature-edit',
  standalone: true,
  templateUrl: './single-feature-edit.component.html',
  styleUrls: ['./single-feature-edit.component.css'],
  imports: [CommonModule, FormsModule]
})
export class SingleFeatureEditComponent implements OnInit {

  
domId = "singleFeatureGeoMap";

currentGeoresourceDataset:any = undefined;
isReachabilityDatasetOnly = false;

georesourceFeaturesGeoJSON:any = undefined;
featureInfoText_singleFeatureAddMenu;

// variables for single feature import
featureIdValue = 0;
// record id of kommonitor database
featureRecordId = undefined;
featureIdExampleString:any = undefined;
featureIdIsUnique = false;
featureNameValue = undefined;
featureGeometryValue = undefined;
featureStartDateValue = undefined;
featureEndDateValue = undefined;
// [{property: name, value: value}]
featureSchemaProperties:any[] = [];
schemaObject;
  

constructor(
  private dataExchangeService: DataExchangeService,
  protected singleFeatureMapHelperService: SingleFeatureMapHelperService,
  private broadcastService: BroadcastService,
  private http: HttpClient
) {}

ngOnInit(): void {

  // catch broadcast msgs
  this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
    let title = broadcastMsg.msg;
    let values:any = broadcastMsg.values;

    switch (title) {
      case 'onEditGeoresourceFeatures' : {
        this.onEditGeoresourceFeatures(values);
      } break;
    }
  });
}

 
        // init datepickers
        /* $('#georesourceSingleFeatureDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);
        $('#georesourceSingleFeatureDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions); */
  
onEditGeoresourceFeatures([georesourceDataset, isReachabilityDatasetOnly]) {
  if (this.currentGeoresourceDataset && this.currentGeoresourceDataset.datasetName === georesourceDataset.datasetName) {
    return;
  }
  else {
    this.currentGeoresourceDataset = georesourceDataset;
    this.georesourceFeaturesGeoJSON = undefined;
    this.isReachabilityDatasetOnly = isReachabilityDatasetOnly;

    this.initFeatureSchema();
    this.initGeoMap();
  }
}

   /* 
        $scope.onChangeEditMode = function () {
          $scope.reinitSingleFeatureEdit();
        };
  
        $scope.resetContent = function () {
  
          // variables for single feature import
          $scope.featureIdValue = 0;
          // record id of kommonitor database
          $scope.featureRecordId = undefined;
          $scope.featureIdExampleString = undefined;
          $scope.featureIdIsUnique = false;
          $scope.featureNameValue = undefined;
          $scope.featureGeometryValue = undefined;
          $scope.featureStartDateValue = undefined;
          $scope.featureEndDateValue = undefined;
          // [{property: name, value: value}]
          $scope.featureSchemaProperties = [];
          $scope.schemaObject;
  
          $scope.validateSingleFeatureId();
        };
  
        $scope.resetContentFromFeature = function (feature) {
          // variables for single feature import
          $scope.featureIdValue = feature.properties[__env.FEATURE_ID_PROPERTY_NAME];
          $scope.featureIdExampleString = undefined;
          $scope.featureNameValue = feature.properties[__env.FEATURE_NAME_PROPERTY_NAME];
          $scope.featureGeometryValue = {
            "type": "FeatureCollection",
            "features": []
          }
          $scope.featureGeometryValue.features[0] = feature;
          $scope.featureStartDateValue = feature.properties[__env.VALID_START_DATE_PROPERTY_NAME];
          $scope.featureEndDateValue = feature.properties[__env.VALID_END_DATE_PROPERTY_NAME];;
          // [{property: name, value: value}]
          let newFeatureSchemaProperties = [];
          for (const featureSchemaEntry of $scope.featureSchemaProperties) {
            featureSchemaEntry.value = feature.properties[featureSchemaEntry.property];
            newFeatureSchemaProperties.push(featureSchemaEntry);
          }
          $scope.featureSchemaProperties = newFeatureSchemaProperties;
  
          // record id of kommonitor database
          $scope.featureRecordId = feature.id;
  
          $scope.validateSingleFeatureId();
  
          $timeout(function () {
            $scope.$digest();
          }, 250)
        };
  
        $scope.$on("reinitSingleFeatureEdit", function () {
          $scope.reinitSingleFeatureEdit();
        });
  
        $scope.reinitSingleFeatureEdit = async function () {
  
          $scope.resetContent();
          await $scope.initFeatureSchema();
          await $scope.initGeoMap();
        };
  */
        initDefaultSchema() {
          let schemaObject = {};
          schemaObject[window.__env.FEATURE_ID_PROPERTY_NAME] = "number";
          schemaObject[window.__env.FEATURE_NAME_PROPERTY_NAME] = "string";
          schemaObject[window.__env.VALID_START_DATE_PROPERTY_NAME] = "date";
          schemaObject[window.__env.VALID_END_DATE_PROPERTY_NAME] = "date";
  
          return schemaObject;
        };
    
        initFeatureSchema() {
          this.featureSchemaProperties = [];
  
          this.schemaObject = this.initDefaultSchema();
  
          // only fetch more details if possible - that is - if data is actually stored in database
          if (!this.isReachabilityDatasetOnly) {

            let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + this.currentGeoresourceDataset.georesourceId + "/schema";

            this.http.get(url).subscribe({
              next: response => {
                this.schemaObject = response;
    
                for (var property in this.schemaObject) {
                  if (property != window.__env.FEATURE_ID_PROPERTY_NAME && property != window.__env.FEATURE_NAME_PROPERTY_NAME && property != window.__env.VALID_START_DATE_PROPERTY_NAME && property != window.__env.VALID_END_DATE_PROPERTY_NAME) {
                    this.featureSchemaProperties.push(
                      {
                        property: property,
                        value: undefined
                      }
                    );
                  }
                }
    
                //return this.schemaObject; 
              },
              error: error => {
                console.log(error);
                return;
              }
            })
          }
          else{
            // if there are any existing properties, then use the first entry
            if (this.currentGeoresourceDataset && this.currentGeoresourceDataset.geoJSON &&
              this.currentGeoresourceDataset.geoJSON.features && this.currentGeoresourceDataset.geoJSON.features[0] &&
              this.currentGeoresourceDataset.geoJSON.features[0].properties ){
              for (var property in this.currentGeoresourceDataset.geoJSON.features[0].properties) {
                if (property != window.__env.FEATURE_ID_PROPERTY_NAME && property != window.__env.FEATURE_NAME_PROPERTY_NAME && property != window.__env.VALID_START_DATE_PROPERTY_NAME && property != window.__env.VALID_END_DATE_PROPERTY_NAME
                  && property != "individualIsochrones" && property != "individualIsochronePruneResults") {
                  this.featureSchemaProperties.push(
                    {
                      property: property,
                      value: undefined
                    }
                  );
                }
              }
            }
          }
  
        };
  
        initGeoMap() {
          let resourceType = this.singleFeatureMapHelperService.pipedData.resourceType_point;
          if (this.currentGeoresourceDataset.isLOI) {
            resourceType = this.singleFeatureMapHelperService.pipedData.resourceType_line;
          }
          else if (this.currentGeoresourceDataset.isAOI) {
            resourceType = this.singleFeatureMapHelperService.pipedData.resourceType_polygon;
          }
          this.singleFeatureMapHelperService.initSingleFeatureGeoMap(this.domId, resourceType);
  
          this.initGeoresourceFeatures();
        };
 
        initEmptyGeoJSON() {
          return {
            "type": "FeatureCollection",
            "features": []
          };
        }

        initGeoresourceFeatures() {
          // only fetch data from db if it is not reachability dataset and if it has not been fetched before!				
          if (!this.isReachabilityDatasetOnly && !this.georesourceFeaturesGeoJSON) {
            // add data layer to singleFeatureMap
            let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + this.currentGeoresourceDataset.georesourceId + "/allFeatures";
            
            this.http.get(url).subscribe({
              next: response => {
                this.georesourceFeaturesGeoJSON = response;
              }, 
              error: error => {
                this.featureInfoText_singleFeatureAddMenu = "Keine Features im Datensatz vorhanden oder Fehler bei Abruf";
              }
            });
          }
          if (!this.georesourceFeaturesGeoJSON) {
            if (this.currentGeoresourceDataset.geoJSON && this.currentGeoresourceDataset.geoJSON.features &&
              this.currentGeoresourceDataset.geoJSON.features.length > 0) {
              this.georesourceFeaturesGeoJSON = this.currentGeoresourceDataset.geoJSON;
            }
            else {
              this.georesourceFeaturesGeoJSON = this.initEmptyGeoJSON();
            }
          }
  
          this.singleFeatureMapHelperService.addDataLayertoSingleFeatureGeoMap(this.georesourceFeaturesGeoJSON);
  
          this.featureInfoText_singleFeatureAddMenu = "" + this.georesourceFeaturesGeoJSON.features.length + " Features im Datensatz vorhanden";
  
          //once the dataset features are fetched we may make a proposal for the ID of a new Feature
          this.featureIdValue = this.generateIdProposalFromExistingFeatures();

          this.addExampleValuesToSchemaProperties();
          this.validateSingleFeatureId();
        }
   
        generateIdProposalFromExistingFeatures() {
          if (!this.georesourceFeaturesGeoJSON) {
            return 0;
          }
          // String or Integer
          let idDataType = this.schemaObject[window.__env.FEATURE_ID_PROPERTY_NAME];
  
          // array of id values
          let existingFeatureIds = this.georesourceFeaturesGeoJSON.features.map(feature => {
            if (feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME]) {
              return feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME];
            }
            else {
              return 0;
            }
          });
  
          let length = existingFeatureIds.length;
          this.featureIdExampleString = "" + existingFeatureIds[0] + "; " + existingFeatureIds[Math.round(length / 2)] + "; " + existingFeatureIds[length - 1];
  
          if (idDataType == "Integer" || idDataType == "Double") {
            return this.generateIdProposalFromExistingFeatures_numeric(existingFeatureIds);
          }
          else {
            // generate UUID
            return this.generateIdProposalFromExistingFeatures_uuid(existingFeatureIds);
          }
        }
  
        generateIdProposalFromExistingFeatures_numeric(existingFeatureIds) {
  
          // determine max value
          let maxValue = Math.max(...existingFeatureIds);
  
          // return increment
          return maxValue + 1;
        }
  
        generateIdProposalFromExistingFeatures_uuid(existingFeatureIds) {
          // return UUID using UUID library 
          return uuidv4();
        }
  
        validateSingleFeatureId  () {
          this.featureIdIsUnique = true;
          if (this.georesourceFeaturesGeoJSON && this.featureIdValue) {
            let filteredFeatures = this.georesourceFeaturesGeoJSON.features.filter(feature => feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME] == this.featureIdValue);
  
            if (filteredFeatures.length == 0) {
              this.featureIdIsUnique = true;
            }
            else {
              this.featureIdIsUnique = false;
            }
            return this.featureIdIsUnique;
          }
          else {
            // no other data available in dataset
            if (this.featureIdValue == undefined || this.featureIdValue == null) {
              this.featureIdIsUnique = false;
            }
            else {
              this.featureIdIsUnique = true;
            }
          }
  
          return this.featureIdIsUnique;
        };
   
        addExampleValuesToSchemaProperties() {
          if (this.georesourceFeaturesGeoJSON && this.featureSchemaProperties && this.georesourceFeaturesGeoJSON.features && this.georesourceFeaturesGeoJSON.features[0]) {
            let exampleFeature = this.georesourceFeaturesGeoJSON.features[0];
            for (const element of this.featureSchemaProperties) {
              element.exampleValue = exampleFeature.properties[element.property];
            }
          }
        };
  /*
        $scope.buildSingleFeature = function () {
          // build new feature object and add it to geoJSON
          // then broadcast updated resources
          $scope.featureGeometryValue.features[0].properties[__env.FEATURE_ID_PROPERTY_NAME] = $scope.featureIdValue;
          $scope.featureGeometryValue.features[0].properties[__env.FEATURE_NAME_PROPERTY_NAME] = $scope.featureNameValue;
          $scope.featureGeometryValue.features[0].properties[__env.VALID_START_DATE_PROPERTY_NAME] = $scope.featureStartDateValue;
          $scope.featureGeometryValue.features[0].properties[__env.VALID_END_DATE_PROPERTY_NAME] = $scope.featureEndDateValue;
  
          for (const element of $scope.featureSchemaProperties) {
            $scope.featureGeometryValue.features[0].properties[element.property] = element.value;
          }
  
          // if original geojson feature has so called record id then add it again to perform single feature updates in
          // edit georesource features form
  
          if ($scope.featureRecordId){
            $scope.featureGeometryValue.features[0].id = $scope.featureRecordId; 
          }
            
        };
  
        $scope.addSingleGeoresourceFeature = async function () {
  
          $scope.buildSingleFeature();
  
          // as the update was successfull we must prevent the user from importing the same object again
          $scope.featureIdIsUnique = false;
          // add the new feature to current dataset!
          if ($scope.georesourceFeaturesGeoJSON) {
            $scope.georesourceFeaturesGeoJSON.features.push($scope.featureGeometryValue.features[0]);
          }
          else {
            $scope.georesourceFeaturesGeoJSON = turf.featureCollection([
              $scope.featureGeometryValue.features[0]
            ]);
          }
  
          $scope.broadcastUpdate_addSingleFeature();
          $scope.broadcastUpdate_wholeGeoJSON();
          $scope.reinitSingleFeatureEdit();
        };
        $scope.editSingleGeoresourceFeature = function () {
          $scope.buildSingleFeature();
  
          // replace updated feature in geoJSON
          for (let index = 0; index < $scope.georesourceFeaturesGeoJSON.features.length; index++) {
            const feature = $scope.georesourceFeaturesGeoJSON.features[index];
            if (feature.properties[__env.FEATURE_ID_PROPERTY_NAME] == $scope.featureGeometryValue.features[0].properties[__env.FEATURE_ID_PROPERTY_NAME]) {
              $scope.georesourceFeaturesGeoJSON.features[index] = $scope.featureGeometryValue.features[0];
            }
          }
  
          $scope.broadcastUpdate_editSingleFeature();
          $scope.broadcastUpdate_wholeGeoJSON();
          $scope.reinitSingleFeatureEdit();
        };
  
        $scope.deleteSingleGeoresourceFeature = function () {
          $scope.buildSingleFeature();
  
          // remove selected feature from geoJSON
          for (let index = 0; index < $scope.georesourceFeaturesGeoJSON.features.length; index++) {
            const feature = $scope.georesourceFeaturesGeoJSON.features[index];
            if (feature.properties[__env.FEATURE_ID_PROPERTY_NAME] == $scope.featureGeometryValue.features[0].properties[__env.FEATURE_ID_PROPERTY_NAME]) {
              $scope.georesourceFeaturesGeoJSON.features.splice(index, 1);
            }
          }
  
          $scope.broadcastUpdate_deleteSingleFeature();
          $scope.broadcastUpdate_wholeGeoJSON();
          $scope.reinitSingleFeatureEdit();
        };
  
        $scope.$on("singleFeatureSelected", function (event, feature) {				
  
          // depending on editMode we must tell mapHelper to put feature into editable featureLayer
          if(kommonitorSingleFeatureMapHelperService.editMode != "create"){
            $scope.resetContentFromFeature(feature);
            kommonitorSingleFeatureMapHelperService.changeEditableFeature(feature);
          }
        });
  
        $scope.broadcastUpdate_addSingleFeature = function () {
          $rootScope.$broadcast("georesourceGeoJSONUpdated_addSingleFeature", $scope.featureGeometryValue.features[0]);
        };
  
        $scope.broadcastUpdate_editSingleFeature = function () {
          $rootScope.$broadcast("georesourceGeoJSONUpdated_editSingleFeature", $scope.featureGeometryValue.features[0]);
        };
  
        $scope.broadcastUpdate_deleteSingleFeature = function () {
          $rootScope.$broadcast("georesourceGeoJSONUpdated_deleteSingleFeature", $scope.featureGeometryValue.features[0]);
        };
  
        $scope.broadcastUpdate_wholeGeoJSON = function () {
          $rootScope.$broadcast("georesourceGeoJSONUpdated", $scope.georesourceFeaturesGeoJSON);
        };
  
        $scope.$on("onUpdateSingleFeatureGeometry", function (event, geoJSON, drawControl) {
          $scope.featureGeometryValue = geoJSON;
          $scope.$digest();
        });
  
        $scope.exportCurrentDataset = function(){
          let geoJSON = JSON
                .stringify($scope.georesourceFeaturesGeoJSON);
      
              var fileName = $scope.currentGeoresourceDataset.datasetName + '_export.json';
      
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
          } */
}
