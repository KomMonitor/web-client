import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilterHelperService {

  pipedData: any;

  public constructor(
    @Inject('kommonitorDataExchangeService') private ajskommonitorFilterHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorFilterHelperServiceProvider;
  }

  applyRangeFilter(features, dateProperty, currentLowerFilterValue, currentHigherFilterValue) {
    this.ajskommonitorFilterHelperServiceProvider.applyRangeFilter(features, dateProperty, currentLowerFilterValue, currentHigherFilterValue);
  }

  filterAndReplaceDataset() {
    this.ajskommonitorFilterHelperServiceProvider.filterAndReplaceDataset();
  }

  applySpatialFilter_higherSpatialUnitFeatures(higherSpatialUnitFilterFeatureGeoJSON, targetFeatureNames) {
    this.ajskommonitorFilterHelperServiceProvider.applySpatialFilter_higherSpatialUnitFeatures(higherSpatialUnitFilterFeatureGeoJSON, targetFeatureNames);
  }

  clearFilteredFeatures() {
    this.ajskommonitorFilterHelperServiceProvider.clearFilteredFeatures();
  }

  applySpatialFilter_currentSpatialUnitFeatures(targetFeatureNames) {
    this.ajskommonitorFilterHelperServiceProvider.applySpatialFilter_currentSpatialUnitFeatures(targetFeatureNames);
  }

  featureIsCurrentlySelected(id) {
    return this.ajskommonitorFilterHelperServiceProvider.featureIsCurrentlySelected(id);
  }

  onChangeFilterBehaviourToggle() {
    this.ajskommonitorFilterHelperServiceProvider.onChangeFilterBehaviourToggle();
  }
}