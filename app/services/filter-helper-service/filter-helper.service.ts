import { Inject, Injectable } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { MapService } from 'services/map-service/map.service';

@Injectable({
  providedIn: 'root'
})
export class FilterHelperService {

  pipedData: any;
  exchangeData!: DataExchange; 

  public constructor(
    @Inject('kommonitorFilterHelperService') private ajskommonitorFilterHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    private dataExchangeService: DataExchangeService,
    private mapService: MapService,
    private broadcastService: BroadcastService
  ) {
    this.pipedData = this.ajskommonitorFilterHelperServiceProvider;
    this.exchangeData = this.dataExchangeService.pipedData
  }

  applyRangeFilter(features, dateProperty, currentLowerFilterValue, currentHigherFilterValue) {
    this.ajskommonitorFilterHelperServiceProvider.applyRangeFilter(features, dateProperty, currentLowerFilterValue, currentHigherFilterValue);
  }

  filterAndReplaceDataset() {
    //this.ajskommonitorFilterHelperServiceProvider.filterAndReplaceDataset();

    // function already merged to new service due to issues on map
      let indicatorMetadataAndGeoJSON;
      if (this.exchangeData.isBalanceChecked) {
          let filteredIndicatorFeatures = this.exchangeData.indicatorAndMetadataAsBalance.geoJSON.features.filter(feature => !this.ajskommonitorFilterHelperServiceProvider.filteredIndicatorFeatureIds.has("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME]));
          indicatorMetadataAndGeoJSON = JSON.parse(JSON.stringify(this.exchangeData.indicatorAndMetadataAsBalance));
          indicatorMetadataAndGeoJSON.geoJSON.features = filteredIndicatorFeatures;
          this.mapService.replaceIndicatorGeoJSON(indicatorMetadataAndGeoJSON, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.exchangeData.selectedDate, false);
      }
      else {
          let filteredIndicatorFeatures = this.exchangeData.selectedIndicator.geoJSON.features.filter(feature => !this.ajskommonitorFilterHelperServiceProvider.filteredIndicatorFeatureIds.has("" + feature.properties[window.__env.FEATURE_ID_PROPERTY_NAME]));
          indicatorMetadataAndGeoJSON = JSON.parse(JSON.stringify(this.exchangeData.selectedIndicator));
          indicatorMetadataAndGeoJSON.geoJSON.features = filteredIndicatorFeatures;
          this.mapService.replaceIndicatorGeoJSON(indicatorMetadataAndGeoJSON, this.exchangeData.selectedSpatialUnit.spatialUnitLevel, this.exchangeData.selectedDate, false);
      }
      this.broadcastService.broadcast("updateIndicatorValueRangeFilter", [this.exchangeData.selectedDate, indicatorMetadataAndGeoJSON]);
      this.broadcastService.broadcast("updateMeasureOfValueBar", [this.exchangeData.selectedDate, indicatorMetadataAndGeoJSON]);
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