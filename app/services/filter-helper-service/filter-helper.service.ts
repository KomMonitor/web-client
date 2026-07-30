import { Injectable, inject } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { MapService } from 'services/map-service/map.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import * as turf from '@turf/turf';

@Injectable({
  providedIn: 'root',
})
export class FilterHelperService {
  private chartDisplayState = inject(ChartDisplayStateService);
  private selectionState = inject(SelectionStateService);
  private mapService = inject(MapService);
  private broadcastService = inject(BroadcastService);
  private envConfigService = inject(EnvConfigService);
  private indicatorValueService = inject(IndicatorValueService);

  filteredIndicatorFeatureIds = new Map();
  selectedIndicatorFeatureIds = new Map();
  completelyRemoveFilteredFeaturesFromDisplay = true;

  private getIndicatorValue_asNumber(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asNumber(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  applyRangeFilter(features, targetDateProperty, minFilterValue, maxFilterValue) {
    //this.ajskommonitorFilterHelperServiceProvider.applyRangeFilter(features, dtargetDateProperty, minFilterValue, maxFilterValue);
    if (!this.filteredIndicatorFeatureIds) {
      this.filteredIndicatorFeatureIds = new Map();
    }
    for (const feature of features) {
      const value = this.getIndicatorValue_asNumber(feature.properties[targetDateProperty]);
      if (value >= minFilterValue && value <= maxFilterValue) {
        // feature must not be filtered - make sure it is not marked as filtered
        if (
          this.filteredIndicatorFeatureIds.has(
            '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
          )
        ) {
          this.filteredIndicatorFeatureIds.delete(
            '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
          );
        }
      } else {
        // feature must be filtered
        if (
          !this.filteredIndicatorFeatureIds.has(
            '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
          )
        ) {
          this.filteredIndicatorFeatureIds.set(
            '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME],
            feature
          );
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
    if (this.chartDisplayState.isBalanceChecked) {
      const filteredIndicatorFeatures =
        this.chartDisplayState.indicatorAndMetadataAsBalance.geoJSON.features.filter(
          (feature) =>
            !this.filteredIndicatorFeatureIds.has(
              '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
            )
        );
      indicatorMetadataAndGeoJSON = JSON.parse(
        JSON.stringify(this.chartDisplayState.indicatorAndMetadataAsBalance)
      );
      indicatorMetadataAndGeoJSON.geoJSON.features = filteredIndicatorFeatures;
      this.mapService.replaceIndicatorGeoJSON(
        indicatorMetadataAndGeoJSON,
        this.selectionState.selectedSpatialUnit.spatialUnitLevel,
        this.selectionState.selectedDate,
        false
      );
    } else {
      const filteredIndicatorFeatures =
        this.selectionState.selectedIndicator.geoJSON.features.filter(
          (feature) =>
            !this.filteredIndicatorFeatureIds.has(
              '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
            )
        );
      indicatorMetadataAndGeoJSON = JSON.parse(
        JSON.stringify(this.selectionState.selectedIndicator)
      );
      indicatorMetadataAndGeoJSON.geoJSON.features = filteredIndicatorFeatures;
      this.mapService.replaceIndicatorGeoJSON(
        indicatorMetadataAndGeoJSON,
        this.selectionState.selectedSpatialUnit.spatialUnitLevel,
        this.selectionState.selectedDate,
        false
      );
    }
    this.broadcastService.broadcast(BroadcastMessage.UpdateIndicatorValueRangeFilter, [
      this.selectionState.selectedDate,
      indicatorMetadataAndGeoJSON,
    ]);
    this.broadcastService.broadcast(BroadcastMessage.UpdateMeasureOfValueBar, [
      this.selectionState.selectedDate,
      indicatorMetadataAndGeoJSON,
    ]);
  }

  applySpatialFilter_higherSpatialUnitFeatures(
    higherSpatialUnitFilterFeatureGeoJSON,
    targetFeatureNames
  ) {
    //this.ajskommonitorFilterHelperServiceProvider.applySpatialFilter_higherSpatialUnitFeatures(higherSpatialUnitFilterFeatureGeoJSON, targetFeatureNames);

    if (!this.filteredIndicatorFeatureIds) {
      this.filteredIndicatorFeatureIds = new Map();
    }
    // manage map of filtered features
    const targetHigherSpatialUnitFilterFeatures =
      higherSpatialUnitFilterFeatureGeoJSON.features.filter((feature) =>
        targetFeatureNames.includes(
          feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
        )
      );
    for (const feature of this.selectionState.selectedIndicator.geoJSON.features) {
      this.filteredIndicatorFeatureIds.set(
        '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME],
        feature
      );
      for (const higherSpatialUnitFeature of targetHigherSpatialUnitFilterFeatures) {
        if (turf.booleanPointInPolygon(turf.pointOnFeature(feature), higherSpatialUnitFeature)) {
          this.filteredIndicatorFeatureIds.delete(
            '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
          );
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
      if (this.chartDisplayState.isBalanceChecked) {
        this.mapService.replaceIndicatorGeoJSON(
          this.chartDisplayState.indicatorAndMetadataAsBalance,
          this.selectionState.selectedSpatialUnit.spatialUnitLevel,
          this.selectionState.selectedDate,
          false
        );
      } else {
        this.mapService.replaceIndicatorGeoJSON(
          this.selectionState.selectedIndicator,
          this.selectionState.selectedSpatialUnit.spatialUnitLevel,
          this.selectionState.selectedDate,
          false
        );
      }
    } else {
      this.filterAndReplaceDataset();
    }
    this.checkFeatureSelection();
  }

  checkFeatureSelection() {
    // remove any selected items that are not visible in current filtered dataset
    // only if features are fully removed from dataset
    if (this.completelyRemoveFilteredFeaturesFromDisplay) {
      for (const key of this.selectedIndicatorFeatureIds.keys()) {
        if (this.filteredIndicatorFeatureIds.has('' + key)) {
          this.selectedIndicatorFeatureIds.delete('' + key);
        }
      }
    }
    this.broadcastService.broadcast(BroadcastMessage.OnRemovedFeatureFromSelection, [
      this.selectedIndicatorFeatureIds,
    ]);
  }

  clearFilteredFeatures() {
    this.filteredIndicatorFeatureIds = new Map();
  }

  applySpatialFilter_currentSpatialUnitFeatures(targetFeatureNames) {
    // if(!this.filteredIndicatorFeatureIds){
    // }
    this.filteredIndicatorFeatureIds = new Map();
    // manage map of filtered features
    for (const feature of this.selectionState.selectedIndicator.geoJSON.features) {
      if (
        !targetFeatureNames.includes(
          feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]
        )
      ) {
        this.filteredIndicatorFeatureIds.set(
          '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME],
          feature
        );
      }
    }
    // apply filter
    this.performSpatialFilter();
  }

  featureIsCurrentlySelected(id) {
    return this.selectedIndicatorFeatureIds.has('' + id);
  }

  onChangeFilterBehaviourToggle() {
    this.performSpatialFilter();
  }

  featureIsCurrentlyFiltered(properties) {
    return this.filteredIndicatorFeatureIds.has('' + properties);
  }

  addFeatureToSelection(feature) {
    if (feature.properties) {
      this.selectedIndicatorFeatureIds.set(
        '' + feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME],
        feature
      );
    } else {
      this.selectedIndicatorFeatureIds.set(
        '' + feature[this.envConfigService.FEATURE_ID_PROPERTY_NAME],
        feature
      );
    }
    this.broadcastService.broadcast(BroadcastMessage.OnAddedFeatureToSelection, [
      this.selectedIndicatorFeatureIds,
    ]);
  }

  removeFeatureFromSelection(feature) {
    this.selectedIndicatorFeatureIds.delete('' + feature);
    this.broadcastService.broadcast(BroadcastMessage.OnRemovedFeatureFromSelection, [
      this.selectedIndicatorFeatureIds,
    ]);
  }

  clearSelectedFeatures() {
    this.selectedIndicatorFeatureIds = new Map();
  }
}
