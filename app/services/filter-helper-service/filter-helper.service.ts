import { Inject, Injectable } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { MapService } from 'services/map-service/map.service';
import * as turf from '@turf/turf';

@Injectable({
  providedIn: 'root'
})
export class FilterHelperService {

  exchangeData!: DataExchange; 

  filteredIndicatorFeatureIds = new Map();
  selectedIndicatorFeatureIds = new Map();
  completelyRemoveFilteredFeaturesFromDisplay = true;

  public constructor(
    private dataExchangeService: DataExchangeService,
    private mapService: MapService,
    private broadcastService: BroadcastService,
  ) {
    this.exchangeData = this.dataExchangeService.pipedData
  }

  applyRangeFilter(features, targetDateProperty, minFilterValue, maxFilterValue) {
    //this.ajskommonitorFilterHelperServiceProvider.applyRangeFilter(features, dtargetDateProperty, minFilterValue, maxFilterValue);
    if (!this.filteredIndicatorFeatureIds) {
      this.filteredIndicatorFeatureIds = new Map();
    }
    for (const feature of features) {
        var value = +Number(feature.properties[targetDateProperty]).toFixed(window.__env.numberOfDecimals);
        if (value >= minFilterValue && value <= maxFilterValue) {
            // feature must not be filtered - make sure it is not marked as filtered
            if (this.filteredIndicatorFeatureIds.has("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME])) {
                this.filteredIndicatorFeatureIds.delete("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME]);
            }
        }
        else {
            // feature must be filtered
            if (!this.filteredIndicatorFeatureIds.has("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME])) {
                this.filteredIndicatorFeatureIds.set("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME], feature);
            }
        }
    }
    // range filter should only display filtered items as filtered, not remove them totally, as this qould require either
    // more complicated management of all features or direct update of range min/max values
    this.mapService.restyleCurrentLayer();
  }

  filterAndReplaceDataset() {
    //this.ajskommonitorFilterHelperServiceProvider.filterAndReplaceDataset();

    // function already merged to new service due to issues on map
      let indicatorMetadataAndGeoJSON;
      if (this.exchangeData.isBalanceChecked) {
          let filteredIndicatorFeatures = this.exchangeData.indicatorAndMetadataAsBalance.geoJSON.features.filter(feature => !this.filteredIndicatorFeatureIds.has("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME]));
          indicatorMetadataAndGeoJSON = JSON.parse(JSON.stringify(this.exchangeData.indicatorAndMetadataAsBalance));
          indicatorMetadataAndGeoJSON.geoJSON.features = filteredIndicatorFeatures;
          this.mapService.replaceIndicatorGeoJSON(indicatorMetadataAndGeoJSON, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.exchangeData.selectedDate, false);
      }
      else {
          let filteredIndicatorFeatures = this.exchangeData.selectedIndicator.geoJSON.features.filter(feature => !this.filteredIndicatorFeatureIds.has("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME]));
          indicatorMetadataAndGeoJSON = JSON.parse(JSON.stringify(this.exchangeData.selectedIndicator));
          indicatorMetadataAndGeoJSON.geoJSON.features = filteredIndicatorFeatures;
          this.mapService.replaceIndicatorGeoJSON(indicatorMetadataAndGeoJSON, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.exchangeData.selectedDate, false);
      }
      this.broadcastService.broadcast("updateIndicatorValueRangeFilter", [this.exchangeData.selectedDate, indicatorMetadataAndGeoJSON]);
      this.broadcastService.broadcast("updateMeasureOfValueBar", [this.exchangeData.selectedDate, indicatorMetadataAndGeoJSON]);
  }

  applySpatialFilter_higherSpatialUnitFeatures(higherSpatialUnitFilterFeatureGeoJSON, targetFeatureNames) {
    //this.ajskommonitorFilterHelperServiceProvider.applySpatialFilter_higherSpatialUnitFeatures(higherSpatialUnitFilterFeatureGeoJSON, targetFeatureNames);

    if (!this.filteredIndicatorFeatureIds) {
      this.filteredIndicatorFeatureIds = new Map();
    }
    // manage map of filtered features
    let targetHigherSpatialUnitFilterFeatures = higherSpatialUnitFilterFeatureGeoJSON.features.filter(feature => targetFeatureNames.includes(feature.properties[window.__env.FEATURE_NAME_PROPERTY_NAME]));
    for (const feature of this.exchangeData.selectedIndicator.geoJSON.features) {
        this.filteredIndicatorFeatureIds.set("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME], feature);
        for (const higherSpatialUnitFeature of targetHigherSpatialUnitFilterFeatures) {
            if (turf.booleanPointInPolygon(turf.pointOnFeature(feature), higherSpatialUnitFeature)) {
                this.filteredIndicatorFeatureIds.delete("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME]);
                break;
            }
        }
    }
    // apply filter
    this.performSpatialFilter();
  }

  performSpatialFilter() {
    if (!this.completelyRemoveFilteredFeaturesFromDisplay) {
        // kommonitorMapService.restyleCurrentLayer();
        if (this.exchangeData.isBalanceChecked) {
            this.mapService.replaceIndicatorGeoJSON(this.exchangeData.indicatorAndMetadataAsBalance, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.exchangeData.selectedDate, false);
        }
        else {
            this.mapService.replaceIndicatorGeoJSON(this.exchangeData.selectedIndicator, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.exchangeData.selectedDate, false);
        }
    }
    else {
        this.filterAndReplaceDataset();
    }
    this.checkFeatureSelection();
  };

  checkFeatureSelection() {
    // remove any selected items that are not visible in current filtered dataset
    // only if features are fully removed from dataset
    if (this.completelyRemoveFilteredFeaturesFromDisplay) {
        let oldSelectionMap = this.selectedIndicatorFeatureIds;
        for (let key of this.selectedIndicatorFeatureIds.keys()) {
            if (this.filteredIndicatorFeatureIds.has("" + key)) {
                this.selectedIndicatorFeatureIds.delete("" + key);
            }
        }
    }
    this.broadcastService.broadcast("onRemovedFeatureFromSelection", [this.selectedIndicatorFeatureIds]);
  };

  clearFilteredFeatures() {
    this.filteredIndicatorFeatureIds = new Map();
  }

  applySpatialFilter_currentSpatialUnitFeatures(targetFeatureNames) {
    // if(!this.filteredIndicatorFeatureIds){
    // }
    this.filteredIndicatorFeatureIds = new Map();
    // manage map of filtered features        
    for (const feature of this.exchangeData.selectedIndicator.geoJSON.features) {
        if (!targetFeatureNames.includes(feature.properties[window.__env.FEATURE_NAME_PROPERTY_NAME])) {
            this.filteredIndicatorFeatureIds.set("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME], feature);
        }
    }
    // apply filter
    this.performSpatialFilter();
  }

  featureIsCurrentlySelected(id) {
    return this.filteredIndicatorFeatureIds.has("" + id);
  }

  onChangeFilterBehaviourToggle() {
      this.performSpatialFilter();
  }

  featureIsCurrentlyFiltered(properties) {
    return this.filteredIndicatorFeatureIds.has("" + properties);
  }

  addFeatureToSelection(feature) {
    if (feature.properties) {
        this.selectedIndicatorFeatureIds.set("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME], feature);
    }
    else {
        this.selectedIndicatorFeatureIds.set("" + feature[window.__env.FEATURE_ID_PROPERTY_NAME], feature);
    }
    this.broadcastService.broadcast("onAddedFeatureToSelection", [this.selectedIndicatorFeatureIds]);
  }

  removeFeatureFromSelection(feature) {
    this.selectedIndicatorFeatureIds.delete("" + feature);
    this.broadcastService.broadcast("onRemovedFeatureFromSelection", [this.selectedIndicatorFeatureIds]);
  }

  clearSelectedFeatures() {
    this.selectedIndicatorFeatureIds = new Map();
  }
}