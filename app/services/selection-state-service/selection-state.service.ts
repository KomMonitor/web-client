import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Selection state + derived feature aggregates, extracted from DataExchangeService
 * (Prio 7 / B7 — see documentation/PRIO7_GOD_SERVICE_SPLIT.md). Last Teil-B cut.
 *
 * Holds the current selection (indicator / spatial unit / date) and the all-/selected-features
 * aggregates. Depends only on IndicatorValueService (value parsing) and EnvConfigService
 * (date-prefix). The DataExchangeService facade re-exposes the fields via get/set so its many
 * consumers stay unchanged. (Plain fields for now; signals/computed remain an optional later step.)
 */
@Injectable({
  providedIn: 'root',
})
export class SelectionStateService {
  private indicatorValueService = inject(IndicatorValueService);
  private envConfigService = inject(EnvConfigService);

  selectedIndicator: any;
  selectedSpatialUnit: any;
  selectedDate: any;

  allFeaturesPropertyUnit: any;
  allFeaturesNumberOfFeatures: any;
  allFeaturesSum: any;
  allFeaturesMean: any;
  allFeaturesMin: any;
  allFeaturesMax: any;
  allFeaturesRegionalSum: any;
  allFeaturesRegionalMean: any;
  allFeaturesRegionalSpatiallyUnassignable: any;

  selectedFeaturesNumberOfFeatures: any;
  selectedFeaturesSum: any;
  selectedFeaturesMean: any;
  selectedFeaturesMin: any;
  selectedFeaturesMax: any;

  // object to share changes on selectedDate, still needs the "real" 'selectedDate' as numerous components use it
  private selectedDateSubject = new BehaviorSubject<Date | undefined>(undefined);
  selectedDate$ = this.selectedDateSubject.asObservable();

  /**
   * Resolve the effective decimal precision from the explicit argument or the currently
   * selected indicator. Owned here because selectedIndicator lives here; IndicatorValueService
   * stays pure.
   */
  resolveSelectedPrecision(precision = undefined) {
    if (precision !== undefined) {
      return precision;
    }
    if (this.selectedIndicator && this.selectedIndicator.precision !== null) {
      return this.selectedIndicator.precision;
    }
    return undefined;
  }

  setSelectedDate(dateString: string | undefined) {
    if (dateString) {
      this.selectedDate = dateString;
      this.selectedDateSubject.next(new Date(dateString));
    }
  }

  setAllFeaturesProperty(indicatorMetadataAndGeoJSON, propertyName) {
    let sum = 0;
    let count = 0;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    for (const feature of indicatorMetadataAndGeoJSON.geoJSON.features) {
      if (!this.indicatorValueService.indicatorValueIsNoData(feature.properties[propertyName])) {
        const value = this.indicatorValueService.getIndicatorValueFromArray_asNumber(
          feature.properties,
          propertyName,
          this.resolveSelectedPrecision()
        );
        sum += value;
        if (value < min) min = value;
        if (value > max) max = value;
        count++;
      }
    }

    this.allFeaturesPropertyUnit = indicatorMetadataAndGeoJSON.unit;
    this.allFeaturesNumberOfFeatures = count;
    this.allFeaturesSum = sum;
    // no division by zero
    if (count > 0) this.allFeaturesMean = sum / count;
    else this.allFeaturesMean = 0;
    this.allFeaturesMin = min;
    this.allFeaturesMax = max;

    this.allFeaturesRegionalSum = undefined;
    this.allFeaturesRegionalMean = undefined;
    this.allFeaturesRegionalSpatiallyUnassignable = undefined;

    if (indicatorMetadataAndGeoJSON.regionalReferenceValues) {
      for (const regionalReferenceValuesEntry of indicatorMetadataAndGeoJSON.regionalReferenceValues) {
        if (
          regionalReferenceValuesEntry.referenceDate &&
          regionalReferenceValuesEntry.referenceDate == this.selectedDate
        ) {
          this.allFeaturesRegionalSum = regionalReferenceValuesEntry.regionalSum;
          this.allFeaturesRegionalMean = regionalReferenceValuesEntry.regionalAverage;
          this.allFeaturesRegionalSpatiallyUnassignable =
            regionalReferenceValuesEntry.spatiallyUnassignable;
        }
      }
    }
  }

  setSelectedFeatureProperty(selectedFeaturesMap, propertyName) {
    let sum = 0;
    let count = 0;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    selectedFeaturesMap.forEach((feature, _key, _map) => {
      if (!this.indicatorValueService.indicatorValueIsNoData(feature.properties[propertyName])) {
        const value = this.indicatorValueService.getIndicatorValueFromArray_asNumber(
          feature.properties,
          propertyName,
          this.resolveSelectedPrecision()
        );
        sum += value;
        if (value < min) min = value;
        if (value > max) max = value;
        count++;
      }
    });

    if (count === 0) {
      // no feature selected, overwrite initial values for min and max
      min = 0;
      max = 0;
    }

    this.selectedFeaturesNumberOfFeatures = count;
    this.selectedFeaturesSum = sum;
    // no division by zero
    if (count > 0) this.selectedFeaturesMean = sum / count;
    else this.selectedFeaturesMean = 0;
    this.selectedFeaturesMin = min;
    this.selectedFeaturesMax = max;
  }

  onRemovedFeatureFromSelection([selectedIndicatorFeatureIds]) {
    const propertyName = this.buildIndicatorPropertyName();

    setTimeout(() => {
      this.setSelectedFeatureProperty(selectedIndicatorFeatureIds, propertyName);
    });
  }

  buildIndicatorPropertyName() {
    const INDICATOR_DATE_PREFIX = this.envConfigService.indicatorDatePrefix;
    const propertyName = INDICATOR_DATE_PREFIX + this.selectedDate;
    return propertyName;
  }
}
