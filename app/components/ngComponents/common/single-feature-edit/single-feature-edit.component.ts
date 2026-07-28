import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SingleFeatureMapHelperService } from 'services/single-feature-map-helper-service/single-feature-map-helper.service';
import uuidv4 from '../../../../../customizedExternalLibs/uuidv4.js';
import { FormsModule } from '@angular/forms';
import * as turf from '@turf/turf';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-single-feature-edit',
  templateUrl: './single-feature-edit.component.html',
  styleUrls: ['./single-feature-edit.component.scss'],
  imports: [CommonModule, FormsModule, NgbDatepickerModule],
  standalone: true,
})
export class SingleFeatureEditComponent implements OnInit {
  private cacheHelperService = inject(CacheHelperServiceService);
  private selectionState = inject(SelectionStateService);
  protected singleFeatureMapHelperService = inject(SingleFeatureMapHelperService);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);

  private readonly destroyRef = inject(DestroyRef);

  domId = 'singleFeatureGeoMap';

  currentGeoresourceDataset: any = undefined;
  isReachabilityDatasetOnly = false;

  georesourceFeaturesGeoJSON: any = undefined;
  featureInfoText_singleFeatureAddMenu;

  // variables for single feature import
  featureIdValue = 0;
  // record id of kommonitor database
  featureRecordId = undefined;
  featureIdExampleString: any = undefined;
  featureIdIsUnique = false;
  featureNameValue = undefined;
  featureGeometryValue: any = undefined;
  featureStartDateValue: string | undefined = undefined;
  featureEndDateValue: string | undefined = undefined;
  // [{property: name, value: value}]
  featureSchemaProperties: any[] = [];
  schemaObject;

  ngOnInit(): void {
    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((broadcastMsg) => {
        const title = broadcastMsg.msg;
        const values: any = broadcastMsg.values;

        switch (title) {
          case BroadcastMessage.OnEditGeoresourceFeatures:
            {
              this.onEditGeoresourceFeatures(values);
            }
            break;
          case BroadcastMessage.ReinitSingleFeatureEdit:
            {
              this.reinitSingleFeatureEdit();
            }
            break;
          case BroadcastMessage.ResetSingleFeatureEdit:
            {
              this.resetSingleFeatureEditState();
            }
            break;
          case BroadcastMessage.SingleFeatureSelected:
            {
              this.singleFeatureSelected(values);
            }
            break;
          case BroadcastMessage.OnUpdateSingleFeatureGeometry:
            {
              this.onUpdateSingleFeatureGeometry(values);
            }
            break;
        }
      });

    this.singleFeatureMapHelperService.invalidateMap();
  }

  // init datepickers
  /* $('#georesourceSingleFeatureDatepickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);
        $('#georesourceSingleFeatureDatepickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions); */

  onEditGeoresourceFeatures([georesourceDataset, isReachabilityDatasetOnly]) {
    if (
      this.currentGeoresourceDataset &&
      this.currentGeoresourceDataset.datasetName === georesourceDataset.datasetName
    ) {
      return;
    } else {
      this.currentGeoresourceDataset = georesourceDataset;
      this.georesourceFeaturesGeoJSON = undefined;
      this.isReachabilityDatasetOnly = isReachabilityDatasetOnly;

      this.initFeatureSchema();
      this.initGeoMap();
    }
  }

  onChangeEditMode(value) {
    this.singleFeatureMapHelperService.editMode = value;
    this.reinitSingleFeatureEdit();
  }

  resetContent() {
    // variables for single feature import
    this.featureIdValue = 0;
    // record id of kommonitor database
    this.featureRecordId = undefined;
    this.featureIdExampleString = undefined;
    this.featureIdIsUnique = false;
    this.featureNameValue = undefined;
    this.featureGeometryValue = undefined;
    this.featureStartDateValue = undefined;
    this.featureEndDateValue = undefined;
    // [{property: name, value: value}]
    this.featureSchemaProperties = [];

    this.validateSingleFeatureId();
  }

  resetContentFromFeature(feature) {
    // variables for single feature import
    this.featureIdValue = feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME];
    this.featureIdExampleString = undefined;
    this.featureNameValue = feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME];
    this.featureGeometryValue = {
      type: 'FeatureCollection',
      features: [],
    };
    this.featureGeometryValue.features[0] = feature;
    this.featureStartDateValue =
      feature.properties[this.envConfigService.VALID_START_DATE_PROPERTY_NAME];
    this.featureEndDateValue =
      feature.properties[this.envConfigService.VALID_END_DATE_PROPERTY_NAME];
    // [{property: name, value: value}]
    const newFeatureSchemaProperties: any[] = [];
    for (const featureSchemaEntry of this.featureSchemaProperties) {
      featureSchemaEntry.value = feature.properties[featureSchemaEntry.property];
      newFeatureSchemaProperties.push(featureSchemaEntry);
    }
    this.featureSchemaProperties = newFeatureSchemaProperties;

    // record id of kommonitor database
    this.featureRecordId = feature.id;

    this.validateSingleFeatureId();
  }

  reinitSingleFeatureEdit() {
    this.resetContent();
    this.initFeatureSchema();
    this.initGeoMap();
  }

  /**
   * Fully clears this editor, unlike `reinitSingleFeatureEdit()` which reloads the
   * currently selected dataset — used when there is no longer any dataset to edit
   * (e.g. the reachability scenario modal's "Zurücksetzen" button).
   */
  resetSingleFeatureEditState() {
    this.currentGeoresourceDataset = undefined;
    this.georesourceFeaturesGeoJSON = undefined;
    this.resetContent();
    this.singleFeatureMapHelperService.initSingleFeatureGeoMap(
      this.domId,
      this.singleFeatureMapHelperService.resourceType_point
    );
  }

  initDefaultSchema() {
    const schemaObject = {};
    schemaObject[this.envConfigService.FEATURE_ID_PROPERTY_NAME] = 'number';
    schemaObject[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] = 'string';
    schemaObject[this.envConfigService.VALID_START_DATE_PROPERTY_NAME] = 'date';
    schemaObject[this.envConfigService.VALID_END_DATE_PROPERTY_NAME] = 'date';

    return schemaObject;
  }

  initFeatureSchema() {
    this.featureSchemaProperties = [];

    this.schemaObject = this.initDefaultSchema();

    // only fetch more details if possible - that is - if data is actually stored in database
    if (!this.isReachabilityDatasetOnly) {
      const url =
        this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
        '/georesources/' +
        this.currentGeoresourceDataset.georesourceId +
        '/schema';

      this.http.get(url).subscribe({
        next: (response) => {
          this.schemaObject = response;

          for (const property in this.schemaObject) {
            if (
              property != this.envConfigService.FEATURE_ID_PROPERTY_NAME &&
              property != this.envConfigService.FEATURE_NAME_PROPERTY_NAME &&
              property != this.envConfigService.VALID_START_DATE_PROPERTY_NAME &&
              property != this.envConfigService.VALID_END_DATE_PROPERTY_NAME
            ) {
              this.featureSchemaProperties.push({
                property: property,
                value: undefined,
              });
            }
          }

          //return this.schemaObject;
        },
        error: (error) => {
          console.log(error);
          return;
        },
      });
    } else {
      // if there are any existing properties, then use the first entry
      if (
        this.currentGeoresourceDataset &&
        this.currentGeoresourceDataset.geoJSON &&
        this.currentGeoresourceDataset.geoJSON.features &&
        this.currentGeoresourceDataset.geoJSON.features[0] &&
        this.currentGeoresourceDataset.geoJSON.features[0].properties
      ) {
        for (const property in this.currentGeoresourceDataset.geoJSON.features[0].properties) {
          if (
            property != this.envConfigService.FEATURE_ID_PROPERTY_NAME &&
            property != this.envConfigService.FEATURE_NAME_PROPERTY_NAME &&
            property != this.envConfigService.VALID_START_DATE_PROPERTY_NAME &&
            property != this.envConfigService.VALID_END_DATE_PROPERTY_NAME &&
            property != 'individualIsochrones' &&
            property != 'individualIsochronePruneResults'
          ) {
            this.featureSchemaProperties.push({
              property: property,
              value: undefined,
            });
          }
        }
      }
    }
  }

  initGeoMap() {
    let resourceType = this.singleFeatureMapHelperService.resourceType_point;
    if (this.currentGeoresourceDataset.isLOI) {
      resourceType = this.singleFeatureMapHelperService.resourceType_line;
    } else if (this.currentGeoresourceDataset.isAOI) {
      resourceType = this.singleFeatureMapHelperService.resourceType_polygon;
    }
    this.singleFeatureMapHelperService.initSingleFeatureGeoMap(this.domId, resourceType);

    this.initGeoresourceFeatures();
  }

  initEmptyGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  initGeoresourceFeatures() {
    // only fetch data from db if it is not reachability dataset and if it has not been fetched before!
    if (!this.isReachabilityDatasetOnly && !this.georesourceFeaturesGeoJSON) {
      // add data layer to singleFeatureMap
      const url =
        this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
        '/georesources/' +
        this.currentGeoresourceDataset.georesourceId +
        '/allFeatures';

      this.http.get(url).subscribe({
        next: (response) => {
          this.georesourceFeaturesGeoJSON = response;
        },
        error: (error) => {
          this.featureInfoText_singleFeatureAddMenu =
            'Keine Features im Datensatz vorhanden oder Fehler bei Abruf';
        },
      });
    }
    if (!this.georesourceFeaturesGeoJSON) {
      if (
        this.currentGeoresourceDataset.geoJSON &&
        this.currentGeoresourceDataset.geoJSON.features &&
        this.currentGeoresourceDataset.geoJSON.features.length > 0
      ) {
        this.georesourceFeaturesGeoJSON = this.currentGeoresourceDataset.geoJSON;
      } else {
        this.georesourceFeaturesGeoJSON = this.initEmptyGeoJSON();
      }
    }

    // add context layer of currently selected indicator features
    if (this.selectionState.selectedIndicator && this.selectionState.selectedIndicator.geoJSON) {
      this.singleFeatureMapHelperService.addContextLayerToSingleFeatureGeoMap_indicator(
        this.selectionState.selectedIndicator.geoJSON
      );
    }

    this.singleFeatureMapHelperService.addDataLayertoSingleFeatureGeoMap_georesource(
      this.georesourceFeaturesGeoJSON
    );

    this.featureInfoText_singleFeatureAddMenu =
      '' + this.georesourceFeaturesGeoJSON.features.length + ' Features im Datensatz vorhanden';

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
    const idDataType = this.schemaObject[this.envConfigService.FEATURE_ID_PROPERTY_NAME];

    // array of id values
    const existingFeatureIds = this.georesourceFeaturesGeoJSON.features.map((feature) => {
      if (feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]) {
        return feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME];
      } else {
        return 0;
      }
    });

    const length = existingFeatureIds.length;
    this.featureIdExampleString =
      '' +
      existingFeatureIds[0] +
      '; ' +
      existingFeatureIds[Math.round(length / 2)] +
      '; ' +
      existingFeatureIds[length - 1];

    if (idDataType == 'Integer' || idDataType == 'Double' || idDataType == 'number') {
      return this.generateIdProposalFromExistingFeatures_numeric(existingFeatureIds);
    } else {
      // generate UUID
      return this.generateIdProposalFromExistingFeatures_uuid(existingFeatureIds);
    }
  }

  generateIdProposalFromExistingFeatures_numeric(existingFeatureIds) {
    // determine max value
    const maxValue = Math.max(...existingFeatureIds);

    // return increment
    return maxValue + 1;
  }

  generateIdProposalFromExistingFeatures_uuid(existingFeatureIds) {
    // return UUID using UUID library
    return uuidv4();
  }

  onStartDateChange(date: NgbDateStruct) {
    this.featureStartDateValue = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  }

  onEndDateChange(date: NgbDateStruct) {
    this.featureEndDateValue = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  }

  validateSingleFeatureId() {
    this.featureIdIsUnique = true;
    if (this.georesourceFeaturesGeoJSON && this.featureIdValue) {
      const filteredFeatures = this.georesourceFeaturesGeoJSON.features.filter(
        (feature) =>
          feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME] == this.featureIdValue
      );

      if (filteredFeatures.length == 0) {
        this.featureIdIsUnique = true;
      } else {
        this.featureIdIsUnique = false;
      }
      return this.featureIdIsUnique;
    } else {
      // no other data available in dataset
      if (this.featureIdValue == undefined || this.featureIdValue == null) {
        this.featureIdIsUnique = false;
      } else {
        this.featureIdIsUnique = true;
      }
    }

    return this.featureIdIsUnique;
  }

  addExampleValuesToSchemaProperties() {
    if (
      this.georesourceFeaturesGeoJSON &&
      this.featureSchemaProperties &&
      this.georesourceFeaturesGeoJSON.features &&
      this.georesourceFeaturesGeoJSON.features[0]
    ) {
      const exampleFeature = this.georesourceFeaturesGeoJSON.features[0];
      for (const element of this.featureSchemaProperties) {
        element.exampleValue = exampleFeature.properties[element.property];
      }
    }
  }

  buildSingleFeature() {
    // build new feature object and add it to geoJSON
    // then broadcast updated resources
    this.featureGeometryValue.features[0].properties[
      this.envConfigService.FEATURE_ID_PROPERTY_NAME
    ] = this.featureIdValue;
    this.featureGeometryValue.features[0].properties[
      this.envConfigService.FEATURE_NAME_PROPERTY_NAME
    ] = this.featureNameValue;
    this.featureGeometryValue.features[0].properties[
      this.envConfigService.VALID_START_DATE_PROPERTY_NAME
    ] = this.featureStartDateValue;
    this.featureGeometryValue.features[0].properties[
      this.envConfigService.VALID_END_DATE_PROPERTY_NAME
    ] = this.featureEndDateValue;

    for (const element of this.featureSchemaProperties) {
      this.featureGeometryValue.features[0].properties[element.property] = element.value;
    }

    // if original geojson feature has so called record id then add it again to perform single feature updates in
    // edit georesource features form

    if (this.featureRecordId) {
      this.featureGeometryValue.features[0].id = this.featureRecordId;
    }
  }

  addSingleGeoresourceFeature() {
    this.buildSingleFeature();

    // as the update was successfull we must prevent the user from importing the same object again
    this.featureIdIsUnique = false;
    // add the new feature to current dataset!
    if (this.georesourceFeaturesGeoJSON) {
      this.georesourceFeaturesGeoJSON.features.push(this.featureGeometryValue.features[0]);
    } else {
      this.georesourceFeaturesGeoJSON = turf.featureCollection([
        this.featureGeometryValue.features[0],
      ]);
    }

    this.broadcastUpdate_addSingleFeature();
    this.broadcastUpdate_wholeGeoJSON();
    this.reinitSingleFeatureEdit();
  }

  editSingleGeoresourceFeature() {
    this.buildSingleFeature();

    // replace updated feature in geoJSON
    for (let index = 0; index < this.georesourceFeaturesGeoJSON.features.length; index++) {
      const feature = this.georesourceFeaturesGeoJSON.features[index];
      if (
        feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME] ==
        this.featureGeometryValue.features[0].properties[
          this.envConfigService.FEATURE_ID_PROPERTY_NAME
        ]
      ) {
        this.georesourceFeaturesGeoJSON.features[index] = this.featureGeometryValue.features[0];
      }
    }

    this.broadcastUpdate_editSingleFeature();
    this.broadcastUpdate_wholeGeoJSON();
    this.reinitSingleFeatureEdit();
  }

  deleteSingleGeoresourceFeature() {
    this.buildSingleFeature();

    // remove selected feature from geoJSON
    for (let index = 0; index < this.georesourceFeaturesGeoJSON.features.length; index++) {
      const feature = this.georesourceFeaturesGeoJSON.features[index];
      if (
        feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME] ==
        this.featureGeometryValue.features[0].properties[
          this.envConfigService.FEATURE_ID_PROPERTY_NAME
        ]
      ) {
        this.georesourceFeaturesGeoJSON.features.splice(index, 1);
      }
    }

    this.broadcastUpdate_deleteSingleFeature();
    this.broadcastUpdate_wholeGeoJSON();
    this.reinitSingleFeatureEdit();
  }

  singleFeatureSelected([feature]) {
    // depending on editMode we must tell mapHelper to put feature into editable featureLayer
    if (this.singleFeatureMapHelperService.editMode != 'create') {
      this.resetContentFromFeature(feature);
      this.singleFeatureMapHelperService.changeEditableFeature(feature);
    }
  }

  broadcastUpdate_addSingleFeature() {
    this.broadcastService.broadcast(BroadcastMessage.GeoresourceGeoJSONUpdatedAddSingleFeature, [
      this.featureGeometryValue.features[0],
    ]);
  }

  broadcastUpdate_editSingleFeature() {
    this.broadcastService.broadcast(BroadcastMessage.GeoresourceGeoJSONUpdatedEditSingleFeature, [
      this.featureGeometryValue.features[0],
    ]);
  }

  broadcastUpdate_deleteSingleFeature() {
    this.broadcastService.broadcast(BroadcastMessage.GeoresourceGeoJSONUpdatedDeleteSingleFeature, [
      this.featureGeometryValue.features[0],
    ]);
  }

  broadcastUpdate_wholeGeoJSON() {
    this.broadcastService.broadcast(BroadcastMessage.GeoresourceGeoJSONUpdated, [
      this.georesourceFeaturesGeoJSON,
    ]);
  }

  onUpdateSingleFeatureGeometry([geoJSON, drawControl]) {
    this.featureGeometryValue = geoJSON;
  }

  exportCurrentDataset() {
    const geoJSON = JSON.stringify(this.georesourceFeaturesGeoJSON);

    const fileName = this.currentGeoresourceDataset.datasetName + '_export.json';

    const blob = new Blob([geoJSON], {
      type: 'application/json',
    });
    const data = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = 'JSON';
    a.target = '_self';
    a.rel = 'noopener noreferrer';
    a.click();
    a.remove();
  }
}
