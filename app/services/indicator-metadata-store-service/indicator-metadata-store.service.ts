import { Injectable, inject, signal } from '@angular/core';
import { IndicatorsDataset } from 'components/ngComponents/models/indicators.models';
import { SpatialUnitOverviewType } from 'models/data-management-api';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Indicator metadata store. Extracted in the Prio 7 god-service split
 * (see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Owns the indicator collection (availableIndicators + id-map) and the derived
 * displayableIndicators. Depends only on EnvConfigService (decimals / hide-substrings).
 * Cross-domain inputs are passed in: modifyIndicatorApplicableSpatialUnitsForLoginRoles
 * receives availableSpatialUnits as a param; the keyword-filtered view
 * (displayableIndicators_keywordFiltered) lives in MetadataFilterService.
 */
@Injectable({
  providedIn: 'root',
})
export class IndicatorMetadataStoreService {
  private envConfigService = inject(EnvConfigService);

  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _availableIndicators = signal<IndicatorsDataset[]>([]);
  get availableIndicators(): IndicatorsDataset[] {
    return this._availableIndicators();
  }
  set availableIndicators(value: IndicatorsDataset[]) {
    this._availableIndicators.set(value);
  }
  availableIndicators_map = new Map<string, IndicatorsDataset>();
  displayableIndicators: IndicatorsDataset[] = [];

  getIndicatorAbbreviationFromIndicatorId(indicatorId: string): string | undefined {
    for (const indicatorMetadata of this.availableIndicators) {
      if (indicatorMetadata.indicatorId === indicatorId) {
        return indicatorMetadata.abbreviation;
      }
    }
    return undefined;
  }

  setIndicators(indicatorsArray: IndicatorsDataset[]) {
    this.availableIndicators = this.modifyIndicators(indicatorsArray);
    this.availableIndicators_map = new Map(this.availableIndicators.map((i) => [i.indicatorId, i]));
  }

  addSingleIndicatorMetadata(indicatorMetadata: IndicatorsDataset) {
    const modified = this.modifySingleIndicator(indicatorMetadata);
    this.availableIndicators = [modified, ...this.availableIndicators];
    this.availableIndicators_map.set(indicatorMetadata.indicatorId, modified);
  }

  replaceSingleIndicatorMetadata(indicatorMetadata: IndicatorsDataset) {
    const modified = this.modifySingleIndicator(indicatorMetadata);
    const index = this.availableIndicators.findIndex(
      (i) => i.indicatorId === indicatorMetadata.indicatorId
    );
    if (index !== -1)
      this.availableIndicators = this.availableIndicators.map((it, i) =>
        i === index ? modified : it
      );
    this.availableIndicators_map.set(indicatorMetadata.indicatorId, modified);
  }

  getIndicatorMetadataById(indicatorId: string): IndicatorsDataset | undefined {
    return this.availableIndicators_map.get(indicatorId);
  }

  deleteSingleIndicatorMetadata(indicatorId: string) {
    const index = this.availableIndicators.findIndex((i) => i.indicatorId === indicatorId);
    if (index !== -1)
      this.availableIndicators = this.availableIndicators.filter((_, i) => i !== index);
    this.availableIndicators_map.delete(indicatorId);
  }

  modifySingleIndicator(indicator: IndicatorsDataset): IndicatorsDataset {
    const temp = this.modifyIndicators([indicator]);
    return temp[0];
  }

  modifyIndicators(indicators: IndicatorsDataset[]): IndicatorsDataset[] {
    let decimalDefault = 2;
    if (this.envConfigService.numberOfDecimals !== undefined)
      decimalDefault = this.envConfigService.numberOfDecimals;

    indicators.forEach((elem) => {
      if (elem.precision === null) {
        elem.precision = decimalDefault;
        elem.defaultPrecision = true;
      } else elem.defaultPrecision = false;
    });

    return indicators;
  }

  /**
   * Filters each indicator's applicableSpatialUnits to those available for the current
   * login roles and rebuilds displayableIndicators. `availableSpatialUnits` is passed in
   * by the facade (SpatialUnitMetadataStoreService). The B4 keyword-filtered snapshot is
   * derived by the facade afterwards.
   */
  modifyIndicatorApplicableSpatialUnitsForLoginRoles(
    availableSpatialUnits: SpatialUnitOverviewType[]
  ) {
    const availableSpatialUnitNames: string[] = [];
    for (const spatialUnit of availableSpatialUnits) {
      availableSpatialUnitNames.push(spatialUnit.spatialUnitLevel);
    }
    for (const indicator of this.availableIndicators) {
      indicator.applicableSpatialUnits = indicator.applicableSpatialUnits.filter(
        (applicableSpatialUnit) =>
          availableSpatialUnitNames.includes(applicableSpatialUnit.spatialUnitName)
      );
    }

    this.displayableIndicators = this.availableIndicators.filter((item) =>
      this.isDisplayableIndicator(item)
    );
  }

  isDisplayableIndicator(item) {
    // var arrayOfNameSubstringsForHidingIndicators = ["Standardabweichung", "Prozentuale Ver"];
    const arrayOfNameSubstringsForHidingIndicators =
      this.envConfigService.arrayOfNameSubstringsForHidingIndicators;

    // this is an item from i.e. indicatorRadar, that has a different structure
    if (item.indicatorMetadata) {
      if (
        item.indicatorMetadata.applicableDates == undefined ||
        item.indicatorMetadata.applicableDates.length === 0
      )
        return false;

      if (
        item.indicatorMetadata.applicableSpatialUnits == undefined ||
        item.indicatorMetadata.applicableSpatialUnits.length === 0
      )
        return false;

      const isIndicatorThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingIndicators.some(
        (substring) => String(item.indicatorMetadata.indicatorName).includes(substring)
      );

      if (isIndicatorThatShallNotBeDisplayed) {
        return false;
      }

      return true;
    } else {
      if (item.applicableDates == undefined || item.applicableDates.length === 0) return false;

      if (item.applicableSpatialUnits == undefined || item.applicableSpatialUnits.length === 0)
        return false;

      const isIndicatorThatShallNotBeDisplayed2 = arrayOfNameSubstringsForHidingIndicators.some(
        (substring) => String(item.indicatorName).includes(substring)
      );

      if (isIndicatorThatShallNotBeDisplayed2) {
        return false;
      }

      return true;
    }
  }
}
