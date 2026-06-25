import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Selection state + derived feature aggregates, extracted from DataExchangeService
 * (Prio 7 / B7 — see documentation/PRIO7_GOD_SERVICE_SPLIT.md). Last Teil-B cut.
 *
 * Holds the current selection (indicator / spatial unit / date) and the all-/selected-features
 * aggregates. Depends only on IndicatorValueService (value parsing) and EnvConfigService
 * (date-prefix).
 *
 * The feature aggregates are exposed as writable signals: they are imperatively (re)computed in
 * setAllFeaturesProperty / setSelectedFeatureProperty whenever new data or a new selection arrives,
 * and consumers read them reactively via `aggregate()`. (selectedIndicator/selectedSpatialUnit/
 * selectedDate stay plain fields — they are read by many consumers and not derived here.)
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

  allFeaturesPropertyUnit = signal<any>(undefined);
  allFeaturesNumberOfFeatures = signal<any>(undefined);
  allFeaturesSum = signal<any>(undefined);
  allFeaturesMean = signal<any>(undefined);
  allFeaturesMin = signal<any>(undefined);
  allFeaturesMax = signal<any>(undefined);
  allFeaturesRegionalSum = signal<any>(undefined);
  allFeaturesRegionalMean = signal<any>(undefined);
  allFeaturesRegionalSpatiallyUnassignable = signal<any>(undefined);

  selectedFeaturesNumberOfFeatures = signal<any>(undefined);
  selectedFeaturesSum = signal<any>(undefined);
  selectedFeaturesMean = signal<any>(undefined);
  selectedFeaturesMin = signal<any>(undefined);
  selectedFeaturesMax = signal<any>(undefined);

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

    this.allFeaturesPropertyUnit.set(indicatorMetadataAndGeoJSON.unit);
    this.allFeaturesNumberOfFeatures.set(count);
    this.allFeaturesSum.set(sum);
    // no division by zero
    if (count > 0) this.allFeaturesMean.set(sum / count);
    else this.allFeaturesMean.set(0);
    this.allFeaturesMin.set(min);
    this.allFeaturesMax.set(max);

    this.allFeaturesRegionalSum.set(undefined);
    this.allFeaturesRegionalMean.set(undefined);
    this.allFeaturesRegionalSpatiallyUnassignable.set(undefined);

    if (indicatorMetadataAndGeoJSON.regionalReferenceValues) {
      for (const regionalReferenceValuesEntry of indicatorMetadataAndGeoJSON.regionalReferenceValues) {
        if (
          regionalReferenceValuesEntry.referenceDate &&
          regionalReferenceValuesEntry.referenceDate == this.selectedDate
        ) {
          this.allFeaturesRegionalSum.set(regionalReferenceValuesEntry.regionalSum);
          this.allFeaturesRegionalMean.set(regionalReferenceValuesEntry.regionalAverage);
          this.allFeaturesRegionalSpatiallyUnassignable.set(
            regionalReferenceValuesEntry.spatiallyUnassignable
          );
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

    this.selectedFeaturesNumberOfFeatures.set(count);
    this.selectedFeaturesSum.set(sum);
    // no division by zero
    if (count > 0) this.selectedFeaturesMean.set(sum / count);
    else this.selectedFeaturesMean.set(0);
    this.selectedFeaturesMin.set(min);
    this.selectedFeaturesMax.set(max);
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
