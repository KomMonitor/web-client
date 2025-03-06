import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilterHelperService {

  pipedData: any;

  public constructor(
    @Inject('kommonitorFilterHelperService') private ajskommonitorFilterHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
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

  featureIsCurrentlyFiltered(properties) {
    return this.ajskommonitorFilterHelperServiceProvider.featureIsCurrentlyFiltered(properties);
  }

  addFeatureToSelection(feature) {
    this.ajskommonitorFilterHelperServiceProvider.addFeatureToSelection(feature);
  }

  removeFeatureFromSelection(feature) {
    this.ajskommonitorFilterHelperServiceProvider.removeFeatureFromSelection(feature);
  }

  clearSelectedFeatures() {
    this.ajskommonitorFilterHelperServiceProvider.clearSelectedFeatures();
  }
}