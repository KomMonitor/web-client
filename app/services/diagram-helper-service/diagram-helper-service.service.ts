import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { Injectable, inject } from '@angular/core';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { LabelService } from 'services/label-service/label.service';
import { HttpClient } from '@angular/common/http';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import * as echarts from 'echarts';
import * as turf from '@turf/turf';
import * as ecStat from 'echarts-stat';

@Injectable({
  providedIn: 'root',
})
export class DiagramHelperServiceService {
  private broadcastService = inject(BroadcastService);
  private exportButtonVisibility = inject(ExportButtonVisibilityService);
  private chartDisplayState = inject(ChartDisplayStateService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private filterHelperService = inject(FilterHelperService);
  private http = inject(HttpClient);
  private labelService = inject(LabelService);
  private envConfigService = inject(EnvConfigService);
  private indicatorValueService = inject(IndicatorValueService);
  private selectionState = inject(SelectionStateService);

  // Local precision-resolving wrappers (formerly the DataExchangeService facade glue, Prio7 B1).
  private getIndicatorValue_asNumber(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asNumber(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  private getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFormattedText(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  private getIndicatorValue_asFixedPrecisionNumber(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFixedPrecisionNumber(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  private getIndicatorValueFromArray_asNumber(propertiesArray, targetDateString, precision = undefined) {
    return this.indicatorValueService.getIndicatorValueFromArray_asNumber(
      propertiesArray,
      targetDateString,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  pipedData: any;
  indicatorPropertiesForCurrentSpatialUnitAndTime: any[] = [];
  filterSameUnitAndSameTime = false;

  private INDICATOR_DATE_PREFIX = this.envConfigService.indicatorDatePrefix;
  private defaultColorForClickedFeatures = this.envConfigService.defaultColorForClickedFeatures;

  private numberOfDecimals = this.envConfigService.numberOfDecimals;
  private defaultColorForZeroValues = this.envConfigService.defaultColorForZeroValues;
  private defaultColorForNoDataValues = this.envConfigService.defaultColorForNoDataValues;
  private defaultColorForFilteredValues = this.envConfigService.defaultColorForFilteredValues;

  private defaultColorForOutliers_high = this.envConfigService.defaultColorForOutliers_high;
  private defaultColorForOutliers_low = this.envConfigService.defaultColorForOutliers_low;

  indicatorPropertyName = '';

  barChartOptions = {};
  lineChartOptions = { series: [{ name: '' }] };
  histogramChartOptions = {};
  radarChartOptions = {};
  regressionChartOptions = {};
  geoMapChartOptions = {};

  setCustomFontFamily() {
    const elem: any = document.querySelector('#fontFamily-reference');
    const style = getComputedStyle(elem);
    return style.fontFamily;
  }

  customFontFamily = this.setCustomFontFamily();

  prepCustomStyling(customFontFamilyEnabled, options) {
    if (customFontFamilyEnabled === true) options.textStyle = { fontFamily: this.customFontFamily };

    return options;
  }

  isCloserToTargetDate(date, closestDate, targetDate) {
    const targetMonth = targetDate.split('-')[1];
    const targetDay = targetDate.split('-')[2];

    const closestDateComps = closestDate.split('-');
    const closestDateMonth = closestDateComps[1];
    const closestDateDay = closestDateComps[2];

    const dateComps = date.split('-');
    const month = dateComps[1];
    const day = dateComps[2];

    const monthDiff_closestDate = Math.abs(targetMonth - closestDateMonth);
    const monthDiff_date = Math.abs(targetMonth - month);

    if (monthDiff_date <= monthDiff_closestDate) {
      const dayDiff_closestDate = Math.abs(targetDay - closestDateDay);
      const dayDiff_date = Math.abs(targetDay - day);

      if (dayDiff_date < dayDiff_closestDate) {
        return true;
      }
    }
    return false;
  }

  findClostestTimestamForTargetDate(indicatorForRadar, targetDate) {
    const applicableDates = indicatorForRadar.indicatorMetadata.applicableDates;

    let closestDate = undefined;

    for (const date of applicableDates) {
      const dateComps = date.split('-');
      const year = dateComps[0];

      if (targetDate.includes(year)) {
        if (!closestDate) {
          closestDate = date;
        } else {
          if (this.isCloserToTargetDate(date, closestDate, targetDate)) {
            closestDate = date;
          }
        }
      }
    }

    return closestDate;
  }

  setupIndicatorPropertiesForCurrentSpatialUnitAndTime(filterBySameUnitAndSameTime = false) {
    // Bail out if metadata / selection state is not ready yet. The radar seeds this
    // via a fixed timeout in ngOnInit, which can fire before metadata loading has
    // populated displayableIndicators (or before a spatial unit / date is selected).
    // Consumers re-run this via the 'updateDiagrams' broadcast once data is available.
    if (
      !this.indicatorStore.displayableIndicators ||
      !this.selectionState.selectedDate ||
      !this.selectionState.selectedSpatialUnit
    ) {
      this.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
      return;
    }

    this.broadcastService.broadcast(
      BroadcastMessage.AllIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin
    );

    this.indicatorPropertiesForCurrentSpatialUnitAndTime = [];

    this.indicatorStore.displayableIndicators.forEach((indicatorMetadata) => {
      const targetYear = this.selectionState.selectedDate.split('-')[0];
      const indicatorCandidateYears: any = [];
      indicatorMetadata.applicableDates.forEach((date, _i) => {
        indicatorCandidateYears.push(date.split('-')[0]);
      });

      // if (indicatorCandidateYears.includes(targetYear) && indicatorMetadata.applicableSpatialUnits.some(o => o.spatialUnitName ===  kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
      //   var selectableIndicatorEntry = {};
      //   selectableIndicatorEntry.indicatorProperties = null;
      //   // per default show no indicators on radar
      //   selectableIndicatorEntry.isSelected = false;
      //   selectableIndicatorEntry.indicatorMetadata = indicatorMetadata;
      //   selectableIndicatorEntry.closestTimestamp = undefined;

      //   this.indicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
      // }

      if (
        indicatorMetadata.applicableSpatialUnits.some(
          (o) => o.spatialUnitName === this.selectionState.selectedSpatialUnit.spatialUnitLevel
        )
      ) {
        let canBeAdded = true;

        if (filterBySameUnitAndSameTime) {
          if (indicatorCandidateYears.includes(targetYear)) {
            canBeAdded = true;
          } else {
            canBeAdded = false;
          }
        }

        if (canBeAdded) {
          const selectableIndicatorEntry: any = {};
          selectableIndicatorEntry.indicatorProperties = null;
          // per default show no indicators on radar
          selectableIndicatorEntry.isSelected = false;
          selectableIndicatorEntry.indicatorMetadata = indicatorMetadata;
          selectableIndicatorEntry.selectedDate =
            indicatorMetadata.applicableDates[indicatorMetadata.applicableDates.length - 1];
          // selectableIndicatorEntry.closestTimestamp = undefined;

          this.indicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
        }
      }
    });
    this.broadcastService.broadcast(
      BroadcastMessage.AllIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted
    );
  }

  fetchIndicatorPropertiesIfNotExists(index) {
    if (
      this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === null ||
      this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === undefined
    ) {
      // var dateComps = kommonitorDataExchangeService.selectedDate.split("-");
      //
      // 	var year = dateComps[0];
      // 	var month = dateComps[1];
      // 	var day = dateComps[2];
      this.setIndicatorProperties(index);
    }
  }

  setIndicatorProperties(index) {
    const url =
      this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
      '/indicators/' +
      this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorMetadata.indicatorId +
      '/' +
      this.selectionState.selectedSpatialUnit.spatialUnitId +
      '/without-geometry';
    return this.http.get(url).subscribe({
      next: (response: any) => {
        this.indicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties = response;
      },
      error: (error) => {
        this.mapErrorNotificationService.displayMapApplicationError(error);
      },
    });
  }

  fetchIndicatorProperties(indicatorMetadata, spatialUnitId) {
    const url =
      this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
      '/indicators/' +
      indicatorMetadata.indicatorId +
      '/' +
      spatialUnitId +
      '/without-geometry';
    return this.http.get(url).subscribe({
      next: (response: any) => {
        return response;
      },
      error: (error) => {
        this.mapErrorNotificationService.displayMapApplicationError(error);
      },
    });
  }

  getColorForFeature(
    feature,
    indicatorMetadataAndGeoJSON,
    targetDate,
    defaultBrew,
    gtMeasureOfValueBrew,
    ltMeasureOfValueBrew,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    isMeasureOfValueChecked,
    measureOfValue
  ) {
    let color;

    if (!targetDate.includes(this.INDICATOR_DATE_PREFIX)) {
      targetDate = this.INDICATOR_DATE_PREFIX + targetDate;
    }

    if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[targetDate])) {
      color = this.defaultColorForNoDataValues;
    } else if (
      this.filterHelperService.featureIsCurrentlyFiltered(
        feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
      )
    ) {
      color = this.defaultColorForFilteredValues;
    } else if (
      this.envConfigService.classifyZeroSeparately &&
      this.getIndicatorValueFromArray_asNumber(
        feature.properties,
        targetDate
      ) == 0
    ) {
      color = this.defaultColorForZeroValues;
    } else if (
      feature.properties['outlier'] !== undefined &&
      feature.properties['outlier'].includes('low') &&
      this.envConfigService.useOutlierDetectionOnIndicator
    ) {
      color = this.defaultColorForOutliers_low;
    } else if (
      feature.properties['outlier'] !== undefined &&
      feature.properties['outlier'].includes('high') &&
      this.envConfigService.useOutlierDetectionOnIndicator
    ) {
      color = this.defaultColorForOutliers_high;
    } else if (isMeasureOfValueChecked) {
      if (
        this.getIndicatorValueFromArray_asNumber(
          feature.properties,
          targetDate
        ) >= +Number(measureOfValue).toFixed(this.numberOfDecimals)
      ) {
        color = this.getColorFromBrewInstance(gtMeasureOfValueBrew, feature, targetDate);
      } else {
        color = this.getColorFromBrewInstance(ltMeasureOfValueBrew, feature, targetDate);
      }
    } else {
      if (indicatorMetadataAndGeoJSON.indicatorType.includes('DYNAMIC')) {
        if (feature.properties[targetDate] < 0) {
          color = this.getColorFromBrewInstance(dynamicDecreaseBrew, feature, targetDate);
        } else {
          color = this.getColorFromBrewInstance(dynamicIncreaseBrew, feature, targetDate);
        }
      } else {
        if (this.containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON, targetDate)) {
          if (
            this.getIndicatorValue_asNumber(feature.properties[targetDate]) >= 0
          ) {
            if (
              this.envConfigService.classifyZeroSeparately &&
              this.getIndicatorValue_asNumber(feature.properties[targetDate]) ==
                0
            ) {
              color = this.defaultColorForZeroValues;
              // if(__env.useTransparencyOnIndicator){
              //   fillOpacity = __env.defaultFillOpacityForZeroFeatures;
              // }
            } else {
              color = this.getColorFromBrewInstance(dynamicIncreaseBrew, feature, targetDate);
            }
          } else {
            if (
              this.envConfigService.classifyZeroSeparately &&
              this.getIndicatorValue_asNumber(feature.properties[targetDate]) ==
                0
            ) {
              color = this.defaultColorForZeroValues;
              // if(__env.useTransparencyOnIndicator){
              //   fillOpacity = __env.defaultFillOpacityForZeroFeatures;
              // }
            } else {
              color = this.getColorFromBrewInstance(dynamicDecreaseBrew, feature, targetDate);
            }
          }
        } else {
          color = this.getColorFromBrewInstance(defaultBrew, feature, targetDate);
        }
      }
    }

    return color;
  }

  containsNegativeValues(geoJSON, date) {
    let propertyName = date;

    if (!propertyName.includes(this.envConfigService.indicatorDatePrefix)) {
      propertyName = this.envConfigService.indicatorDatePrefix + propertyName;
    }

    let containsNegativeValues = false;
    for (const feature of geoJSON.features) {
      if (feature.properties[propertyName] < 0) {
        containsNegativeValues = true;
        break;
      }
    }

    return containsNegativeValues;
  }

  getColorFromBrewInstance(brewInstance, feature, targetDate) {
    let color;
    for (let index = 0; index < brewInstance.breaks.length; index++) {
      if (
        this.getIndicatorValueFromArray_asNumber(
          feature.properties,
          targetDate
        ) == this.getIndicatorValue_asNumber(brewInstance.breaks[index])
      ) {
        if (index < brewInstance.breaks.length - 1) {
          // min value
          color = brewInstance.colors[index];
          break;
        } else {
          //max value
          if (brewInstance.colors[index]) {
            color = brewInstance.colors[index];
          } else {
            color = brewInstance.colors[index - 1];
          }
          break;
        }
      } else {
        if (
          this.getIndicatorValueFromArray_asNumber(
            feature.properties,
            targetDate
          ) < this.getIndicatorValue_asNumber(brewInstance.breaks[index + 1])
        ) {
          color = brewInstance.colors[index];
          break;
        }
      }
    }

    return color;
  }

  getBarChartOptions(customFontFamilyEnabled = false) {
    return this.prepCustomStyling(customFontFamilyEnabled, this.barChartOptions);
  }

  getGeoMapChartOptions(customFontFamilyEnabled = false) {
    return this.prepCustomStyling(customFontFamilyEnabled, this.geoMapChartOptions);
  }

  getHistogramChartOptions(customFontFamilyEnabled = false) {
    return this.prepCustomStyling(customFontFamilyEnabled, this.histogramChartOptions);
  }

  getLineChartOptions(customFontFamilyEnabled = false) {
    return this.prepCustomStyling(customFontFamilyEnabled, this.lineChartOptions);
  }

  prepareAllDiagramResources_forCurrentMapIndicator(
    indicatorMetadataAndGeoJSON,
    spatialUnitName,
    date,
    defaultBrew,
    gtMeasureOfValueBrew,
    ltMeasureOfValueBrew,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    isMeasureOfValueChecked,
    measureOfValue,
    filterOutFutureDates
  ) {
    this.prepareAllDiagramResources(
      indicatorMetadataAndGeoJSON,
      spatialUnitName,
      date,
      defaultBrew,
      gtMeasureOfValueBrew,
      ltMeasureOfValueBrew,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      isMeasureOfValueChecked,
      measureOfValue,
      filterOutFutureDates,
      false
    );
  }

  prepareAllDiagramResources_forReportingIndicator(
    indicatorMetadataAndGeoJSON,
    spatialUnitName,
    date,
    defaultBrew,
    gtMeasureOfValueBrew,
    ltMeasureOfValueBrew,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    isMeasureOfValueChecked,
    measureOfValue,
    filterOutFutureDates
  ) {
    this.prepareAllDiagramResources(
      indicatorMetadataAndGeoJSON,
      spatialUnitName,
      date,
      defaultBrew,
      gtMeasureOfValueBrew,
      ltMeasureOfValueBrew,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      isMeasureOfValueChecked,
      measureOfValue,
      filterOutFutureDates,
      true,
      true
    );
  }

  prepareAllDiagramResources(
    indicatorMetadataAndGeoJSON,
    spatialUnitName,
    date,
    defaultBrew,
    gtMeasureOfValueBrew,
    ltMeasureOfValueBrew,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    isMeasureOfValueChecked,
    measureOfValue,
    filterOutFutureDates,
    forceUseSubmittedIndicatorForTimeseries,
    fixedPrecision = false
  ) {
    this.indicatorPropertyName = this.INDICATOR_DATE_PREFIX + date;

    const featureNamesArray: any[] = [];
    const indicatorValueArray: any[] = [];
    const indicatorValueBarChartArray: any[] = [];

    //sort array of features
    const cartographicFeatures = indicatorMetadataAndGeoJSON.geoJSON.features;
    cartographicFeatures.sort((a, b) => this.compareFeaturesByIndicatorValue(a, b));

    for (const cartographicFeature of cartographicFeatures) {
      // diff occurs when balance mode is activated
      // then, cartographicFeatures display balance over time period, which shall be reflected in bar chart and histogram
      // the other diagrams must use the "normal" unbalanced indicator instead --> selectedFeatures

      let indicatorValue;
      if (
        this.indicatorValueService.indicatorValueIsNoData(
          cartographicFeature.properties[this.indicatorPropertyName]
        )
      ) {
        indicatorValue = null;
      } else {
        if (!fixedPrecision)
          indicatorValue = this.getIndicatorValue_asNumber(
            cartographicFeature.properties[this.indicatorPropertyName]
          );
        else
          indicatorValue = this.getIndicatorValue_asFixedPrecisionNumber(
            cartographicFeature.properties[this.indicatorPropertyName],
            indicatorMetadataAndGeoJSON.precision
          );

        indicatorValue = this.getIndicatorValue_asNumber(
          cartographicFeature.properties[this.indicatorPropertyName]
        );
      }

      const featureName =
        cartographicFeature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME];
      featureNamesArray.push(featureName);
      indicatorValueArray.push(indicatorValue);

      const color = this.getColorForFeature(
        cartographicFeature,
        indicatorMetadataAndGeoJSON,
        date,
        defaultBrew,
        gtMeasureOfValueBrew,
        ltMeasureOfValueBrew,
        dynamicIncreaseBrew,
        dynamicDecreaseBrew,
        isMeasureOfValueChecked,
        measureOfValue
      );

      const seriesItem = {
        value: indicatorValue,
        name: featureName,
        itemStyle: {
          color: color,
          // borderWidth: 1,
          // borderColor: 'black'
        },
      };

      indicatorValueBarChartArray.push(seriesItem);
    }

    // TIMESERIES
    let indicatorTimeSeriesDatesArray = indicatorMetadataAndGeoJSON.applicableDates;

    if (filterOutFutureDates) {
      // remove all timestamps that are newer than the given date
      const dateInDateFormat = Date.parse(date);
      indicatorTimeSeriesDatesArray = indicatorTimeSeriesDatesArray.filter((t) => {
        const tInDateFormat = Date.parse(t);
        if (tInDateFormat <= dateInDateFormat) {
          return true;
        } else {
          return false;
        }
      });
    }
    const indicatorTimeSeriesAverageArray = new Array(indicatorTimeSeriesDatesArray.length);
    const indicatorTimeSeriesMaxArray = new Array(indicatorTimeSeriesDatesArray.length);
    const indicatorTimeSeriesMinArray = new Array(indicatorTimeSeriesDatesArray.length);
    const indicatorTimeSeriesCountArray = new Array(indicatorTimeSeriesDatesArray.length);

    const indicatorTimeSeriesRegionalMeanArray = new Array(indicatorTimeSeriesDatesArray.length);
    const indicatorTimeSeriesRegionalSpatiallyUnassignableArray = new Array(
      indicatorTimeSeriesDatesArray.length
    );
    const regionalReferencesMap = new Map();

    if (indicatorMetadataAndGeoJSON.regionalReferenceValues) {
      for (const entry of indicatorMetadataAndGeoJSON.regionalReferenceValues) {
        regionalReferencesMap.set(entry.referenceDate, entry);
      }
    }

    // initialize timeSeries arrays
    for (let i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
      indicatorTimeSeriesAverageArray[i] = 0;
      indicatorTimeSeriesCountArray[i] = 0;
    }

    let indicatorMetadataForTimeseries = indicatorMetadataAndGeoJSON;

    if (!forceUseSubmittedIndicatorForTimeseries && this.chartDisplayState.isBalanceChecked) {
      indicatorMetadataForTimeseries = this.selectionState.selectedIndicator;
    }
    // we must use the original selectedIndicator in case balance mode is active
    // otherwise balance timestamp will have balance values
    for (const indicatorFeature of indicatorMetadataForTimeseries.geoJSON.features) {
      // continue timeSeries arrays by adding and counting all time series values
      for (let i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
        const datePropertyName = this.INDICATOR_DATE_PREFIX + indicatorTimeSeriesDatesArray[i];
        if (
          !this.indicatorValueService.indicatorValueIsNoData(
            indicatorFeature.properties[datePropertyName]
          )
        ) {
          // indicatorTimeSeriesAverageArray[i] += selectedFeature.properties[datePropertyName];
          indicatorTimeSeriesAverageArray[i] += indicatorFeature.properties[datePropertyName];
          indicatorTimeSeriesCountArray[i]++;

          // min stack
          if (
            indicatorTimeSeriesMinArray[i] === undefined ||
            indicatorTimeSeriesMinArray[i] === null
          ) {
            indicatorTimeSeriesMinArray[i] = indicatorFeature.properties[datePropertyName];
          } else {
            if (indicatorFeature.properties[datePropertyName] < indicatorTimeSeriesMinArray[i]) {
              indicatorTimeSeriesMinArray[i] = indicatorFeature.properties[datePropertyName];
            }
          }

          // max stack
          if (
            indicatorTimeSeriesMaxArray[i] === undefined ||
            indicatorTimeSeriesMaxArray[i] === null
          ) {
            indicatorTimeSeriesMaxArray[i] = indicatorFeature.properties[datePropertyName];
          } else {
            if (indicatorFeature.properties[datePropertyName] > indicatorTimeSeriesMaxArray[i]) {
              indicatorTimeSeriesMaxArray[i] = indicatorFeature.properties[datePropertyName];
            }
          }

          // regional reference values
          // als map auslagern und dann hier prüfen, ob ein element in der map drin ist.
          // falls nicht, dann null setzen,
          if (regionalReferencesMap.has(indicatorTimeSeriesDatesArray[i])) {
            const regionalAverage = regionalReferencesMap.get(
              indicatorTimeSeriesDatesArray[i]
            ).regionalAverage;
            if (regionalAverage && typeof regionalAverage == 'number') {
              indicatorTimeSeriesRegionalMeanArray[i] = regionalAverage;
            } else {
              indicatorTimeSeriesRegionalMeanArray[i] = null;
            }

            const regionalSpatiallyUnassignable = regionalReferencesMap.get(
              indicatorTimeSeriesDatesArray[i]
            ).spatiallyUnassignable;
            if (regionalSpatiallyUnassignable && typeof regionalSpatiallyUnassignable == 'number') {
              indicatorTimeSeriesRegionalSpatiallyUnassignableArray[i] =
                regionalSpatiallyUnassignable;
            } else {
              indicatorTimeSeriesRegionalSpatiallyUnassignableArray[i] = null;
            }
          } else {
            indicatorTimeSeriesRegionalMeanArray[i] = null;
            indicatorTimeSeriesRegionalSpatiallyUnassignableArray[i] = null;
          }
        }
      }
    }

    // finish timeSeries arrays by computing averages of all time series values
    for (let i = 0; i < indicatorTimeSeriesDatesArray.length; i++) {
      indicatorTimeSeriesAverageArray[i] = this.getIndicatorValue_asNumber(
        indicatorTimeSeriesAverageArray[i] / indicatorTimeSeriesCountArray[i]
      );
    }

    let meanLineLabel = 'rechnerischer Durchschnitt';
    const arithmMeanValueIndex = indicatorTimeSeriesDatesArray.indexOf(date);
    // replace formatted string like "12.506,32" to 12506.32 in order to parse the correct number
    let meanLineValue = parseFloat(indicatorTimeSeriesAverageArray[arithmMeanValueIndex]);
    let regionalMeanValueUsed = false;
    let enableHorizontalMeanLine = true;

    if (indicatorMetadataForTimeseries.regionalReferenceValues) {
      for (const regionalReferenceValuesEntry of indicatorMetadataForTimeseries.regionalReferenceValues) {
        if (
          regionalReferenceValuesEntry.referenceDate &&
          regionalReferenceValuesEntry.referenceDate == date
        ) {
          if (
            regionalReferenceValuesEntry.regionalAverage &&
            typeof regionalReferenceValuesEntry.regionalAverage == 'number'
          ) {
            meanLineValue = regionalReferenceValuesEntry.regionalAverage;
            // meanLineValue = parseFloat(kommonitorDataExchangeService.allFeaturesRegionalMean.replace(/\./g, '').replace(/,/g, '.'));
            meanLineLabel = 'gesamtregionaler Durchschnitt';
            regionalMeanValueUsed = true;
          }
        }
      }
    }

    if (
      !regionalMeanValueUsed &&
      this.envConfigService.configMeanDataDisplay == 'regionalMeanOrNone'
    ) {
      enableHorizontalMeanLine = false;
    }

    // setHistogramChartOptions(indicatorMetadataAndGeoJSON, indicatorValueArray, spatialUnitName, date);
    this.setLineChartOptions(
      indicatorMetadataAndGeoJSON,
      indicatorTimeSeriesDatesArray,
      indicatorTimeSeriesAverageArray,
      indicatorTimeSeriesMaxArray,
      indicatorTimeSeriesMinArray,
      indicatorTimeSeriesRegionalMeanArray,
      indicatorTimeSeriesRegionalSpatiallyUnassignableArray,
      spatialUnitName,
      date
    );

    this.setBarChartOptions(
      indicatorMetadataAndGeoJSON,
      featureNamesArray,
      indicatorValueBarChartArray,
      spatialUnitName,
      date,
      defaultBrew,
      gtMeasureOfValueBrew,
      ltMeasureOfValueBrew,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      isMeasureOfValueChecked,
      measureOfValue,
      meanLineLabel,
      meanLineValue,
      enableHorizontalMeanLine
    );

    this.setGeoMapChartOptions(
      indicatorMetadataAndGeoJSON,
      featureNamesArray,
      indicatorValueBarChartArray,
      spatialUnitName,
      date,
      defaultBrew,
      gtMeasureOfValueBrew,
      ltMeasureOfValueBrew,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      isMeasureOfValueChecked,
      measureOfValue
    );
  }

  setGeoMapChartOptions(
    indicatorMetadataAndGeoJSON,
    featureNamesArray,
    indicatorValueBarChartArray,
    spatialUnitName,
    date,
    defaultBrew,
    gtMeasureOfValueBrew,
    ltMeasureOfValueBrew,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    isMeasureOfValueChecked,
    measureOfValue
  ) {
    indicatorMetadataAndGeoJSON.geoJSON.features.forEach((feature) => {
      feature.properties.name =
        feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME];
    });

    const uniqueMapRef = 'geoMapChart';

    echarts.registerMap(uniqueMapRef, indicatorMetadataAndGeoJSON.geoJSON);

    // specify chart configuration item and data

    const legendConfig = this.setupVisualMap(
      indicatorMetadataAndGeoJSON,
      featureNamesArray,
      indicatorValueBarChartArray,
      spatialUnitName,
      date,
      defaultBrew,
      gtMeasureOfValueBrew,
      ltMeasureOfValueBrew,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      isMeasureOfValueChecked,
      measureOfValue
    );

    // default fontSize of echarts
    const fontSize = 18;
    const geoMapChartTitel =
      indicatorMetadataAndGeoJSON.indicatorName + ' - ' + spatialUnitName + ' - ' + date;

    const seriesData: any = [];

    for (let index = 0; index < featureNamesArray.length; index++) {
      const featureName = featureNamesArray[index];

      /*
      var seriesItem = {
        value: indicatorValue,
        itemStyle: {
          color: color
          // borderWidth: 1,
          // borderColor: 'black'
        }
      };
      */
      const featureValue = indicatorValueBarChartArray[index].value;

      seriesData.push({
        name: featureName,
        value: featureValue,
      });
    }

    // needed for reporting
    for (const feature of indicatorMetadataAndGeoJSON.geoJSON.features) {
      feature.properties.bbox = turf.bbox(feature); // calculate bbox for each feature
    }
    let bbox = this.calculateOverallBoundingBoxFromGeoJSON(
      indicatorMetadataAndGeoJSON.geoJSON.features
    );
    // change format of bbox to match the format needed for echarts
    bbox = [
      [bbox[0], bbox[3]], // north-west lon lat
      [bbox[2], bbox[1]], // south-east lon lat
    ];

    const geoMapOption = {
      // grid get rid of whitespace around chart
      // grid: {
      //   left: '4%',
      //   top: 32,
      //   right: '4%',
      //   bottom: 32,
      //   containLabel: true
      // },
      title: {
        text: geoMapChartTitel,
        left: 'center',
        textStyle: {
          fontSize: fontSize,
        },
        show: true,
        // top: 15
      },
      tooltip: {
        trigger: 'item',
        confine: 'true',
        showDelay: 0,
        transitionDuration: 0.2,
        formatter: (params) => {
          const value = this.getIndicatorValue_asFormattedText(params.value);
          return '' + params.name + ': ' + value + ' [' + indicatorMetadataAndGeoJSON.unit + ']';
        },
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: this.exportButtonVisibility.showDiagramExportButtons,
            readOnly: true,
            title: 'Datenansicht',
            lang: ['Datenansicht - Geo Map Chart', 'schlie&szlig;en', 'refresh'],
            optionToContent: (opt) => {
              const dataTableId = 'geoMapDataTable_' + Math.random();
              const tableExportName =
                indicatorMetadataAndGeoJSON.indicatorName + ' - ' + opt.title[0].text;

              let htmlString =
                '<table id="' +
                dataTableId +
                '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += '<thead>';
              htmlString += '<tr>';
              htmlString += "<th style='text-align:center;'>Feature-Name</th>";
              htmlString +=
                "<th style='text-align:center;'>" +
                indicatorMetadataAndGeoJSON.indicatorName +
                ' [' +
                indicatorMetadataAndGeoJSON.indicatorName +
                ']</th>';
              htmlString += '</tr>';
              htmlString += '</thead>';

              htmlString += '<tbody>';

              for (const seriesItem of seriesData) {
                const value = this.getIndicatorValue_asFormattedText(
                  seriesItem.value
                );
                htmlString += '<tr>';
                htmlString += '<td>' + seriesItem.name + '</td>';
                htmlString += '<td>' + value + '</td>';
                htmlString += '</tr>';
              }

              htmlString += '</tbody>';
              htmlString += '</table>';

              this.broadcastService.broadcast(BroadcastMessage.AppendExportButtonsForTable, [
                dataTableId,
                tableExportName,
              ]);

              return htmlString;
            },
          },
          restore: { show: false, title: 'Erneuern' },
          saveAsImage: { show: true, title: 'Export', pixelRatio: 4 },
        },
      },
      // legend: {
      // 		//data:[indicatorMetadataAndGeoJSON.indicatorName]
      // },
      visualMap: {
        left: 'left',
        type: 'piecewise',
        pieces: legendConfig,
        // selectedMode: 'multiple',
        precision: indicatorMetadataAndGeoJSON.precision,
        show: true,
      },
      series: [
        {
          name: indicatorMetadataAndGeoJSON.indicatorName,
          type: 'map',
          roam: true,
          boundingCoords: bbox,
          map: uniqueMapRef,
          emphasis: {
            label: {
              show: true,
            },
          },
          data: seriesData,
        },
      ],
    };

    // use configuration item and data specified to show chart
    this.geoMapChartOptions = geoMapOption;
  }

  calculateOverallBoundingBoxFromGeoJSON(features) {
    const result: any = [];
    for (const feature of features) {
      // check if we have to modify our overall bbox (result)
      if (result.length === 0) {
        // for first feature
        result.push(...feature.properties.bbox);
      } else {
        // all other features
        const bbox = feature.properties.bbox;
        result[0] = bbox[0] < result[0] ? bbox[0] : result[0];
        result[1] = bbox[1] < result[1] ? bbox[1] : result[1];
        result[2] = bbox[2] > result[2] ? bbox[2] : result[2];
        result[3] = bbox[3] > result[3] ? bbox[3] : result[3];
      }
    }
    return result;
  }

  setBarChartOptions(
    indicatorMetadataAndGeoJSON,
    featureNamesArray,
    indicatorValueBarChartArray,
    spatialUnitName,
    date,
    defaultBrew,
    gtMeasureOfValueBrew,
    ltMeasureOfValueBrew,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    isMeasureOfValueChecked,
    measureOfValue,
    meanLineLabel,
    meanLineValue,
    enableHorizontalMeanLine
  ) {
    // specify chart configuration item and data
    const labelOption_singleBars = {
      show: this.envConfigService.showBarChartLabel,
      position: 'insideBottom',
      align: 'left',
      verticalAlign: 'middle',
      rotate: 90,
      formatter: (params) => {
        return (
          params.name +
          '  ' +
          this.getIndicatorValue_asFormattedText(params.value)
        );
      },
      // formatter: '{b} {c}'
    };

    // default fontSize of echarts
    let fontSize = 18;
    let barChartTitel = 'Ranking - ' + spatialUnitName + ' - ';
    if (indicatorMetadataAndGeoJSON.fromDate) {
      barChartTitel +=
        'Bilanz ' +
        indicatorMetadataAndGeoJSON.fromDate +
        ' - ' +
        indicatorMetadataAndGeoJSON.toDate;
      fontSize = 14;
    } else {
      barChartTitel += date;
    }

    const legendConfig = this.setupVisualMap(
      indicatorMetadataAndGeoJSON,
      featureNamesArray,
      indicatorValueBarChartArray,
      spatialUnitName,
      date,
      defaultBrew,
      gtMeasureOfValueBrew,
      ltMeasureOfValueBrew,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      isMeasureOfValueChecked,
      measureOfValue
    );

    const barOption: any = {
      // grid get rid of whitespace around chart
      grid: {
        left: '4%',
        top: 32,
        right: '4%',
        bottom: 32,
        containLabel: true,
      },
      title: {
        text: barChartTitel,
        left: 'center',
        textStyle: {
          fontSize: fontSize,
        },
        show: false,
        // top: 15
      },
      tooltip: {
        trigger: 'item',
        confine: 'true',
        formatter: (params, _ticket, _callback) => {
          const value = this.getIndicatorValue_asFormattedText(params.value);
          return '' + params.name + ': ' + value + ' [' + indicatorMetadataAndGeoJSON.unit + ']';
        },
        axisPointer: {
          type: 'line',
          crossStyle: {
            color: '#999',
          },
        },
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: this.exportButtonVisibility.showDiagramExportButtons,
            readOnly: true,
            title: 'Datenansicht',
            lang: ['Datenansicht - Feature-Vergleich', 'schlie&szlig;en', 'refresh'],
            optionToContent: (opt) => {
              const barData = opt.series[0].data;
              const featureNames = opt.xAxis[0].data;

              const dataTableId = 'barDataTable_' + Math.random();
              const tableExportName = opt.xAxis[0].name + ' - ' + opt.title[0].text;

              let htmlString =
                '<table id="' +
                dataTableId +
                '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += '<thead>';
              htmlString += '<tr>';
              htmlString += "<th style='text-align:center;'>Feature-Name</th>";
              htmlString +=
                "<th style='text-align:center;'>" +
                opt.xAxis[0].name +
                ' [' +
                opt.yAxis[0].name +
                ']</th>';
              htmlString += '</tr>';
              htmlString += '</thead>';

              htmlString += '<tbody>';

              for (let i = 0; i < barData.length; i++) {
                const value = this.getIndicatorValue_asFormattedText(
                  barData[i].value
                );
                htmlString += '<tr>';
                htmlString += '<td>' + featureNames[i] + '</td>';
                htmlString += '<td>' + value + '</td>';
                htmlString += '</tr>';
              }

              htmlString += '</tbody>';
              htmlString += '</table>';

              this.broadcastService.broadcast(BroadcastMessage.AppendExportButtonsForTable, [
                dataTableId,
                tableExportName,
              ]);

              return htmlString;
            },
          },
          restore: { show: false, title: 'Erneuern' },
          saveAsImage: { show: true, title: 'Export', pixelRatio: 4 },
        },
      },
      xAxis: {
        name: indicatorMetadataAndGeoJSON.indicatorName,
        nameLocation: 'center',
        nameGap: 15,
        axisLabel: {
          rotate: 90,
          interval: 0,
          inside: true,
          show: false,
        },
        axisTick: {
          show: false,
        },
        z: 6,
        zlevel: 6,
        data: featureNamesArray,
      },
      yAxis: {
        type: 'value',
        name: indicatorMetadataAndGeoJSON.unit,
        axisLabel: {
          formatter: (value, _index) => {
            return this.getIndicatorValue_asFormattedText(value);
          },
        },
        // splitArea: {
        //     show: true
        // }
      },
      label: labelOption_singleBars,
      series: [
        {
          name: 'Ranking',
          type: 'bar',
          emphasis: {
            itemStyle: {
              borderWidth: 4,
              borderColor: this.defaultColorForClickedFeatures,
            },
          },
          data: indicatorValueBarChartArray,
        },
      ],
      visualMap: [
        {
          left: 'left',
          type: 'piecewise',
          pieces: legendConfig,
          precision: indicatorMetadataAndGeoJSON.precision,
          show: false,
        },
      ],
    };

    if (enableHorizontalMeanLine) {
      barOption.series[0].markLine = {
        name: meanLineLabel,
        data: [{ yAxis: meanLineValue, name: meanLineLabel }],
        label: {
          position: 'insideStartTop',
          rotate: 0,
          fontStyle: 'italic',
          fontWeight: 'bold',
          name: meanLineLabel,
        },
        lineStyle: {
          color: 'gray',
        },
      };
    }

    // if (indicatorMetadataAndGeoJSON.geoJSON.features.length > 50) {
    //   // barOption.xAxis.data = undefined;
    //   barOption.xAxis.axisLabel.show = false;
    // }

    // use configuration item and data specified to show chart
    this.barChartOptions = barOption;
  }

  setLineChartOptions(
    indicatorMetadataAndGeoJSON,
    indicatorTimeSeriesDatesArray,
    indicatorTimeSeriesAverageArray,
    indicatorTimeSeriesMaxArray,
    indicatorTimeSeriesMinArray,
    indicatorTimeSeriesRegionalMeanArray,
    indicatorTimeSeriesRegionalSpatiallyUnassignableArray,
    spatialUnitName,
    _date
  ) {
    const lineOption: any = {
      // grid get rid of whitespace around chart
      grid: {
        left: '4%',
        top: 32,
        right: '4%',
        bottom: 55,
        containLabel: true,
      },
      title: {
        text: 'Zeitreihe - ' + spatialUnitName,
        left: 'center',
        show: false,
        textStyle: {
          fontSize: 18,
        },
        // top: 15
      },
      tooltip: {
        trigger: 'axis',
        confine: 'true',
        formatter: (params) => {
          let string = '' + params[0].axisValueLabel + '<br/>';

          params.forEach((paramObj) => {
            if (!paramObj.seriesName.includes('Stack')) {
              const value = this.getIndicatorValue_asFormattedText(
                paramObj.value
              );
              string +=
                paramObj.seriesName +
                ': ' +
                value +
                ' [' +
                indicatorMetadataAndGeoJSON.unit +
                ']' +
                '<br/>';
            }
          });

          return string;
        },
        axisPointer: {
          type: 'line',
          crossStyle: {
            color: '#999',
          },
        },
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: this.exportButtonVisibility.showDiagramExportButtons,
            readOnly: true,
            title: 'Datenansicht',
            lang: ['Datenansicht - Zeitreihe', 'schlie&szlig;en', 'refresh'],
            optionToContent: (opt) => {
              // 	<table class="table table-condensed table-hover">
              // 	<thead>
              // 		<tr>
              // 			<th>Indikator-Name</th>
              // 			<th>Beschreibung der Verkn&uuml;pfung</th>
              // 		</tr>
              // 	</thead>
              // 	<tbody>
              // 		<tr ng-repeat="indicator in $ctrl.kommonitorDataExchangeServiceInstance.selectedIndicator.referencedIndicators">
              // 			<td>{{indicator.referencedIndicatorName}}</td>
              // 			<td>{{indicator.referencedIndicatorDescription}}</td>
              // 		</tr>
              // 	</tbody>
              // </table>

              const lineSeries = opt.series;
              const timestamps = opt.xAxis[0].data;

              const dataTableId = 'lineDataTable_' + Math.random();
              const tableExportName = opt.xAxis[0].name + ' - ' + opt.title[0].text;

              let htmlString =
                '<table id="' +
                dataTableId +
                '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += '<thead>';
              htmlString += '<tr>';
              htmlString += "<th style='text-align:center;'>Zeitpunkt</th>";

              for (const lineSeriesItem of lineSeries) {
                htmlString +=
                  "<th style='text-align:center;'>" +
                  lineSeriesItem.name +
                  ' [' +
                  opt.yAxis[0].name +
                  ']</th>';
              }

              htmlString += '</tr>';
              htmlString += '</thead>';

              htmlString += '<tbody>';

              for (let j = 0; j < timestamps.length; j++) {
                htmlString += '<tr>';
                htmlString += '<td>' + timestamps[j] + '</td>';
                for (const lineSeriesItem of lineSeries) {
                  const value = this.getIndicatorValue_asFormattedText(
                    lineSeriesItem.data[j]
                  );
                  htmlString += '<td>' + value + '</td>';
                }
                htmlString += '</tr>';
              }

              htmlString += '</tbody>';
              htmlString += '</table>';

              this.broadcastService.broadcast(BroadcastMessage.AppendExportButtonsForTable, [
                dataTableId,
                tableExportName,
              ]);

              return htmlString;
            },
          },
          restore: { show: false, title: 'Erneuern' },
          saveAsImage: { show: true, title: 'Export', pixelRatio: 4 },
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        data: [],
      },
      xAxis: {
        name: indicatorMetadataAndGeoJSON.indicatorName,
        nameLocation: 'center',
        nameGap: 22,
        // axisLabel: {
        // 	rotate: 90,
        // 	interval: 0,
        // 	inside: true
        // },
        // z: 6,
        // zlevel: 6,
        type: 'category',
        axisTick: {
          show: false,
        },
        data: indicatorTimeSeriesDatesArray,
      },
      yAxis: {
        type: 'value',
        name: indicatorMetadataAndGeoJSON.unit,
        axisLabel: {
          formatter: (value, _index) => {
            return this.getIndicatorValue_asFormattedText(value);
          },
        },

        // splitArea: {
        //     show: true
        // }
      },
      series: [],
    };

    const meanLine = {
      name: this.labelService.rankingChartAverageLabel,
      type: 'line',
      data: indicatorTimeSeriesAverageArray,
      symbolSize: 6,
      symbol: 'emptyCircle',
      lineStyle: {
        normal: {
          color: 'gray',
          width: 2,
          type: 'dashed',
        },
      },
      itemStyle: {
        normal: {
          borderWidth: 3,
          color: 'gray',
        },
      },
    };

    const regionalMeanLine = {
      name: this.labelService.rankingChartRegionalReferenceValueLabel,
      type: 'line',
      symbolSize: 8,
      symbol: 'circle',
      data: indicatorTimeSeriesRegionalMeanArray,
      lineStyle: {
        normal: {
          color: 'gray',
          width: 2,
          type: 'dashed',
        },
      },
      itemStyle: {
        normal: {
          borderWidth: 3,
          color: 'gray',
        },
      },
    };

    let regionalMeanUsed = false;

    // only add regional mean line if it contains at least one meaningful entry
    if (indicatorTimeSeriesRegionalMeanArray.some((el) => el !== null)) {
      lineOption.series.push(regionalMeanLine);
      lineOption.legend.data.push(this.labelService.rankingChartRegionalReferenceValueLabel);
      regionalMeanUsed = true;
    }

    if (
      this.envConfigService.configMeanDataDisplay == 'both' ||
      (regionalMeanUsed == false &&
        this.envConfigService.configMeanDataDisplay == 'preferRegionalMeanIfAvailable')
    ) {
      lineOption.series.push(meanLine);
      lineOption.legend.data.push(this.labelService.rankingChartAverageLabel);
    }

    // SETTING FOR MIN AND MAX STACK

    // default for min value of 0
    const minStack: any = {
      name: 'MinStack',
      type: 'line',
      data: indicatorTimeSeriesMinArray,
      stack: 'MinMax',
      // areaStyle:{
      //   color: "#d6d6d6"
      // },
      lineStyle: {
        opacity: 0,
      },
      itemStyle: {
        opacity: 0,
      },
      silent: true,
    };

    const minLine = {
      name: 'Min',
      type: 'line',
      data: indicatorTimeSeriesMinArray,
      lineStyle: {
        opacity: 0,
        color: '#d6d6d6',
      },
      itemStyle: {
        opacity: 0,
      },
    };

    const maxStack = {
      name: 'MaxStack',
      type: 'line',
      data: indicatorTimeSeriesMaxArray,
      stack: 'MinMax',
      areaStyle: {
        color: '#d6d6d6',
      },
      lineStyle: {
        opacity: 0,
      },
      itemStyle: {
        opacity: 0,
      },
      silent: true,
    };

    const maxLine = {
      name: 'Max',
      type: 'line',
      data: indicatorTimeSeriesMaxArray,
      lineStyle: {
        opacity: 0,
        color: '#d6d6d6',
      },
      itemStyle: {
        opacity: 0,
      },
    };

    // perform checks if there are negative values or only > 0 values
    // then stacks must be adjusted to be correctly displayed
    const minStack_minValue = Math.min(...indicatorTimeSeriesMinArray);
    if (minStack_minValue < 0) {
      minStack.areaStyle = {
        color: '#d6d6d6',
      };
    }

    const indicatorTimeSeriesMaxArray_copy = JSON.parse(
      JSON.stringify(indicatorTimeSeriesMaxArray)
    );

    if (indicatorTimeSeriesMinArray.filter((item) => item > 0)) {
      for (let index = 0; index < indicatorTimeSeriesMaxArray_copy.length; index++) {
        if (indicatorTimeSeriesMinArray[index] > 0) {
          indicatorTimeSeriesMaxArray_copy[index] =
            indicatorTimeSeriesMaxArray_copy[index] - indicatorTimeSeriesMinArray[index];
        }
      }
      maxStack.data = indicatorTimeSeriesMaxArray_copy;
    }

    lineOption.series.push(minLine);
    lineOption.series.push(maxLine);
    lineOption.series.push(minStack);
    lineOption.series.push(maxStack);

    // spatially unassignable
    const regionalSpatiallyUnassignableLine = {
      name: 'räumlich nicht zuordenbare',
      type: 'line',
      symbol: 'diamond',
      symbolSize: 10,
      data: indicatorTimeSeriesRegionalSpatiallyUnassignableArray,
      lineStyle: {
        normal: {
          color: 'gray',
          width: 2,
          type: 'dashed',
        },
      },
      itemStyle: {
        normal: {
          borderWidth: 3,
          color: 'gray',
        },
      },
    };
    // only add regional spatially unassignable line if it contains at least one meaningful entry
    if (indicatorTimeSeriesRegionalSpatiallyUnassignableArray.some((el) => el !== null)) {
      lineOption.series.push(regionalSpatiallyUnassignableLine);
      lineOption.legend.data.push('räumlich nicht zuordenbare');
    }

    // use configuration item and data specified to show chart
    this.lineChartOptions = lineOption;
  }

  compareFeaturesByIndicatorValue(featureA, featureB) {
    if (
      featureA.properties[this.indicatorPropertyName] <
      featureB.properties[this.indicatorPropertyName]
    )
      return -1;
    if (
      featureA.properties[this.indicatorPropertyName] >
      featureB.properties[this.indicatorPropertyName]
    )
      return 1;
    return 0;
  }

  setupVisualMap(
    indicatorMetadataAndGeoJSON,
    featureNamesArray,
    indicatorValueBarChartArray,
    spatialUnitName,
    date,
    defaultBrew,
    gtMeasureOfValueBrew,
    ltMeasureOfValueBrew,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    isMeasureOfValueChecked,
    _measureOfValue
  ) {
    /*
    pieces: [
          // Range of a piece can be specified by property min and max,
          // where min will be set as -Infinity if ignored,
          // and max will be set as Infinity if ignored.
          {min: 1500},
          {min: 900, max: 1500},
          {min: 310, max: 1000},
          {min: 200, max: 300},
          // Label of the piece can be specified.
          {min: 10, max: 200, label: '10 to 200 (custom label) '},
          // Color of the piece can be specified.
          {value: 123, label: '123 (custom special color) ', color: 'grey'},
          {max: 5}
      ]
    */

    const indicatorType = indicatorMetadataAndGeoJSON.indicatorType;

    const pieces: any = [];

    if (this.containsZeroValues(indicatorMetadataAndGeoJSON.geoJSON, date)) {
      pieces.push({
        min: 0,
        opacity: 0.8,
        max: 0,
        color: this.defaultColorForZeroValues,
      });
    }

    const outliers = indicatorMetadataAndGeoJSON.geoJSON.features.filter(
      (feature) => feature.properties['outlier'] !== undefined
    );

    if (this.envConfigService.useOutlierDetectionOnIndicator && outliers.length > 0) {
      outliers.sort((a, b) => this.compareFeaturesByIndicatorValue(a, b));
      const smallestValue = outliers[0].properties[this.indicatorPropertyName];
      const highestValue = outliers[outliers.length - 1].properties[this.indicatorPropertyName];

      pieces.push({
        min: smallestValue,
        opacity: 0.8,
        color: this.defaultColorForOutliers_low,
      });

      pieces.push({
        max: highestValue,
        opacity: 0.8,
        color: this.defaultColorForOutliers_high,
      });
    }

    // if(containsOutlierValues(indicatorMetadataAndGeoJSON.geoJSON, date)){
    //   pieces.push({
    //     min: 0,
    //     opacity: 0.8,
    //     max: 0,
    //     color: defaultColorForZeroValues
    //   });
    // }

    if (isMeasureOfValueChecked) {
      if (gtMeasureOfValueBrew && gtMeasureOfValueBrew.breaks && gtMeasureOfValueBrew.colors) {
        // measure of value brew
        const gtBreaks = gtMeasureOfValueBrew.breaks;
        const gtColors = gtMeasureOfValueBrew.colors;

        for (let j = 0; j < gtColors.length; j++) {
          const legendItem_gtMov: any = {
            min: gtBreaks[j],
            opacity: 0.8,
            color: gtColors[j],
          };
          if (gtBreaks[j + 1]) {
            legendItem_gtMov.max = gtBreaks[j + 1];
          }

          pieces.push(legendItem_gtMov);
        }
      }

      if (ltMeasureOfValueBrew && ltMeasureOfValueBrew.breaks && ltMeasureOfValueBrew.colors) {
        const ltBreaks = ltMeasureOfValueBrew.breaks;
        const ltColors = ltMeasureOfValueBrew.colors;

        for (let j = 0; j < ltColors.length; j++) {
          const legendItem_ltMov: any = {
            min: ltBreaks[j],
            opacity: 0.8,
            color: ltColors[ltColors.length - 1 - j],
          };
          if (ltBreaks[j + 1]) {
            legendItem_ltMov.max = ltBreaks[j + 1];
          }

          pieces.push(legendItem_ltMov);
        }
      }
    } else if (indicatorType.includes('DYNAMIC')) {
      // dynamic brew

      if (dynamicDecreaseBrew) {
        const dynamicDecreaseBreaks = dynamicDecreaseBrew.breaks;
        const dynamicDecreaseColors = dynamicDecreaseBrew.colors;

        for (let j = 0; j < dynamicDecreaseColors.length; j++) {
          const legendItem_dynamicDecreaseMov: any = {
            min: dynamicDecreaseBreaks[j],
            opacity: 0.8,
            // color: dynamicDecreaseColors[dynamicDecreaseColors.length - 1 - j]
            color: dynamicDecreaseColors[j],
          };
          if (dynamicDecreaseBreaks[j + 1]) {
            legendItem_dynamicDecreaseMov.max = dynamicDecreaseBreaks[j + 1];
            legendItem_dynamicDecreaseMov.label =
              '' + dynamicDecreaseBreaks[j] + ' - < ' + dynamicDecreaseBreaks[j + 1];

            // in negative scala we must ensure that smallest value near 0 (here max) is included in range
            if (j == dynamicDecreaseColors.length - 1) {
              legendItem_dynamicDecreaseMov.max = -0.01;
            }
          } else {
            legendItem_dynamicDecreaseMov.max = -0.01;
            legendItem_dynamicDecreaseMov.label = dynamicDecreaseBreaks[j];
          }

          pieces.push(legendItem_dynamicDecreaseMov);
        }
      }

      if (dynamicIncreaseBrew) {
        const dynamicIncreaseBreaks = dynamicIncreaseBrew.breaks;
        const dynamicIncreaseColors = dynamicIncreaseBrew.colors;

        for (let j = 0; j < dynamicIncreaseColors.length; j++) {
          const legendItem_dynamicIncreaseMov: any = {
            min: dynamicIncreaseBreaks[j],
            opacity: 0.8,
            color: dynamicIncreaseColors[j],
          };
          if (dynamicIncreaseBreaks[j + 1]) {
            legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j + 1];
            legendItem_dynamicIncreaseMov.label =
              '' + dynamicIncreaseBreaks[j] + ' - < ' + dynamicIncreaseBreaks[j + 1];
          } else {
            legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j];
          }

          pieces.push(legendItem_dynamicIncreaseMov);
        }
      }
    } else {
      // default brew

      if (this.containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON, date)) {
        // dynamic brew
        if (dynamicDecreaseBrew) {
          const dynamicDecreaseBreaks = dynamicDecreaseBrew.breaks;
          const dynamicDecreaseColors = dynamicDecreaseBrew.colors;

          for (let j = 0; j < dynamicDecreaseColors.length; j++) {
            const legendItem_dynamicDecreaseMov: any = {
              min: dynamicDecreaseBreaks[j],
              opacity: 0.8,
              // color: dynamicDecreaseColors[dynamicDecreaseColors.length - 1 - j]
              color: dynamicDecreaseColors[j],
            };
            if (dynamicDecreaseBreaks[j + 1]) {
              legendItem_dynamicDecreaseMov.max = dynamicDecreaseBreaks[j + 1];
              legendItem_dynamicDecreaseMov.label =
                '' + dynamicDecreaseBreaks[j] + ' - < ' + dynamicDecreaseBreaks[j + 1];

              // in negative scala we must ensure that smallest value near 0 (here max) is included in range
              if (j == dynamicDecreaseColors.length - 1) {
                legendItem_dynamicDecreaseMov.max = -0.01;
              }
            } else {
              legendItem_dynamicDecreaseMov.max = -0.01;
              legendItem_dynamicDecreaseMov.label = dynamicDecreaseBreaks[j];
            }

            pieces.push(legendItem_dynamicDecreaseMov);
          }
        }

        if (dynamicIncreaseBrew) {
          const dynamicIncreaseBreaks = dynamicIncreaseBrew.breaks;
          const dynamicIncreaseColors = dynamicIncreaseBrew.colors;

          for (let j = 0; j < dynamicIncreaseColors.length; j++) {
            const legendItem_dynamicIncreaseMov: any = {
              min: dynamicIncreaseBreaks[j],
              opacity: 0.8,
              color: dynamicIncreaseColors[j],
            };
            if (dynamicIncreaseBreaks[j + 1]) {
              legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j + 1];
              legendItem_dynamicIncreaseMov.label =
                '' + dynamicIncreaseBreaks[j] + ' - < ' + dynamicIncreaseBreaks[j + 1];
            } else {
              legendItem_dynamicIncreaseMov.max = dynamicIncreaseBreaks[j];
            }

            pieces.push(legendItem_dynamicIncreaseMov);
          }
        }
      } else {
        if (defaultBrew && defaultBrew.breaks && defaultBrew.colors) {
          const breaks = defaultBrew.breaks;
          const colors = defaultBrew.colors;

          for (let j = 0; j < colors.length; j++) {
            const legendItem_default = {
              min: breaks[j],
              opacity: 0.8,
              max: breaks[j + 1],
              color: colors[j],
            };

            pieces.push(legendItem_default);
          }
        }
      }
    }

    return pieces;
  }

  containsZeroValues(geoJSON, date) {
    let propertyName = date;

    if (!propertyName.includes(this.envConfigService.indicatorDatePrefix)) {
      propertyName = this.envConfigService.indicatorDatePrefix + propertyName;
    }

    let containsZeroValues = false;
    for (const feature of geoJSON.features) {
      if (feature.properties[propertyName] === 0 || feature.properties[propertyName] === '0') {
        containsZeroValues = true;
        break;
      }
    }

    return containsZeroValues;
  }

  onlyContainsPositiveNumbers(indicatorValueArray) {
    let ret = true;
    indicatorValueArray.forEach((element) => {
      if (element < 0) {
        ret = false;
      }
    });

    return ret;
  }

  findPropertiesForTimeSeries(spatialUnitFeatureName) {
    for (const feature of this.selectionState.selectedIndicator.geoJSON.features) {
      if (
        feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] ==
        spatialUnitFeatureName
      ) {
        return feature.properties;
      }
    }
  }

  getSeriesIndexByFeatureName(featureName) {
    for (let index = 0; index < this.lineChartOptions.series.length; index++) {
      if (this.lineChartOptions.series[index].name === featureName) return index;
    }

    //return -1 if none was found
    return -1;
  }

  makeFeatureNameForPoiInIsochroneDiagram(poiGeoresource, geoJSONFeatureCollection, date) {
    return (
      poiGeoresource.datasetName +
      ' - ' +
      date +
      ' (' +
      geoJSONFeatureCollection.features.length +
      ')'
    );
  }

  createInitialReachabilityAnalysisPieOptions(
    poiGeoresource,
    geoJSONFeatureCollection,
    rangeValue,
    date
  ) {
    const option = {
      grid: {
        left: '4%',
        top: 0,
        right: '4%',
        bottom: 30,
        containLabel: true,
      },
      title: {
        text: 'Analyse Einzugsgebiet ' + rangeValue,
        left: 'center',
        fontSize: '10',
        show: false,
        // top: 15
      },
      toolbox: {
        show: false,
        fontSize: '8',
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: this.exportButtonVisibility.showDiagramExportButtons,
            readOnly: true,
            title: 'Datenansicht',
            lang: [
              'Datenansicht - Punkte im Einzugsgebiet ' + rangeValue,
              'schlie&szlig;en',
              'refresh',
            ],
            optionToContent: (opt) => {
              const poiData = opt.series[0].data;

              const dataTableId = 'poiInIsochroneTable_' + Math.random();
              const tableExportName = opt.title[0].text;

              let htmlString =
                '<table id="' +
                dataTableId +
                '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += '<thead>';
              htmlString += '<tr>';
              htmlString += "<th style='text-align:center;'>Punktlayer</th>";
              htmlString += "<th style='text-align:center;'>Anzahl Punkte im Einzugsgebiet</th>";
              htmlString += '</tr>';
              htmlString += '</thead>';

              htmlString += '<tbody>';

              for (const poiItem of poiData) {
                htmlString += '<tr>';
                htmlString += '<td>' + poiItem.name + '</td>';
                htmlString += '<td>' + poiItem.value + '</td>';
                htmlString += '</tr>';
              }

              htmlString += '</tbody>';
              htmlString += '</table>';

              this.broadcastService.broadcast(BroadcastMessage.AppendExportButtonsForTable, [
                dataTableId,
                tableExportName,
              ]);

              return htmlString;
            },
          },
          restore: { show: false, title: 'Erneuern' },
          saveAsImage: { show: true, title: 'Export', pixelRatio: 4 },
        },
      },
      tooltip: {
        show: false,
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
        fontSize: '10',
        confine: true,
      },
      legend: {
        orient: 'vertical',
        type: 'scroll',
        fontSize: '8',
        left: 0,
        data: [
          this.makeFeatureNameForPoiInIsochroneDiagram(
            poiGeoresource,
            geoJSONFeatureCollection,
            date
          ),
        ],
        // data: [legendText]
      },
      series: [
        {
          name: 'Punkte im Einzugsgebiet ' + rangeValue,
          type: 'pie',
          radius: ['20%', '30%'],
          center: ['50%', '80%'],
          avoidLabelOverlap: true,
          label: {
            show: false,
            position: 'center',
            fontSize: '10',
          },

          emphasis: {
            label: {
              show: true,
              fontSize: '10',
              // fontWeight: 'bold'
            },
          },
          labelLine: {
            show: true,
          },
          data: [
            {
              value: geoJSONFeatureCollection.features.length,
              name: this.makeFeatureNameForPoiInIsochroneDiagram(
                poiGeoresource,
                geoJSONFeatureCollection,
                date
              ),
            },
          ],
        },
      ],
    };

    return option;
  }

  appendToReachabilityAnalysisOptions(
    poiGeoresource,
    geoJSONFeatureCollection,
    eChartsOptions,
    date
  ) {
    eChartsOptions.legend[0].data.push(
      this.makeFeatureNameForPoiInIsochroneDiagram(poiGeoresource, geoJSONFeatureCollection, date)
    );
    eChartsOptions.series[0].data.push({
      value: geoJSONFeatureCollection.features.length,
      name: this.makeFeatureNameForPoiInIsochroneDiagram(
        poiGeoresource,
        geoJSONFeatureCollection,
        date
      ),
    });

    return eChartsOptions;
  }

  removePoiFromReachabilityAnalysisOption(eChartOptions, poiGeoresource) {
    for (let index = 0; index < eChartOptions.legend[0].data.length; index++) {
      const legendItem = eChartOptions.legend[0].data[index];
      if (legendItem.includes(poiGeoresource.datasetName)) {
        eChartOptions.legend[0].data.splice(index, 1);
      }
    }

    for (let index2 = 0; index2 < eChartOptions.series[0].data.length; index2++) {
      const dataItem = eChartOptions.series[0].data[index2];
      if (dataItem.name.includes(poiGeoresource.datasetName)) {
        eChartOptions.series[0].data.splice(index2, 1);
      }
    }

    return eChartOptions;
  }

  makeTrendChartOptions_forAllFeatures(
    indicatorMetadataAndGeoJSON,
    fromDateAsPropertyString,
    toDateAsPropertyString,
    showMinMax,
    showCompleteTimeseries,
    computationType,
    trendEnabled,
    customFontFamilyEnabled = false
  ) {
    // we may base on the the precomputed timeseries lineOptions and modify that from a cloned instance

    const timeseriesOptions = jQuery.extend(
      true,
      {},
      this.getLineChartOptions(customFontFamilyEnabled)
    );

    // remove any additional lines for concrete features
    timeseriesOptions.series.length = 5;

    // add markedAreas for periods out of scope

    const fromDateString = fromDateAsPropertyString.split(
      this.envConfigService.indicatorDatePrefix
    )[1];
    const fromDate_date = new Date(fromDateString);
    const toDateString = toDateAsPropertyString.split(this.envConfigService.indicatorDatePrefix)[1];
    const toDate_date = new Date(toDateString);

    if (showCompleteTimeseries) {
      timeseriesOptions.series[0].markArea = {
        silent: true,
        itemStyle: {
          color: '#b50b0b',
          opacity: 0.3,
        },
        data: [
          [
            {
              xAxis: indicatorMetadataAndGeoJSON.applicableDates[0],
            },
            {
              xAxis: fromDateString,
            },
          ],
          [
            {
              xAxis: toDateString,
            },
            {
              xAxis:
                indicatorMetadataAndGeoJSON.applicableDates[
                  indicatorMetadataAndGeoJSON.applicableDates.length - 1
                ],
            },
          ],
        ],
      };
    }

    // hide data points
    timeseriesOptions.series[0].itemStyle = { opacity: 0, width: 3, type: 'solid' };

    const trendData: any = [];

    let timeseriesData = timeseriesOptions.series[0].data;
    const minSeriesData = timeseriesOptions.series[1].data;
    const maxSeriesData = timeseriesOptions.series[2].data;

    if (!showCompleteTimeseries) {
      const xData: any = [];
      const timeData: any = [];
      const minData: any = [];
      const maxData: any = [];
      for (let index = 0; index < timeseriesData.length; index++) {
        const date_candidate = new Date(indicatorMetadataAndGeoJSON.applicableDates[index]);
        if (date_candidate >= fromDate_date && date_candidate <= toDate_date) {
          const value = timeseriesData[index];
          // const date = indicatorMetadataAndGeoJSON.applicableDates[index];

          timeData.push(value);
          xData.push(indicatorMetadataAndGeoJSON.applicableDates[index]);
          minData.push(minSeriesData[index]);
          maxData.push(maxSeriesData[index]);
        }
      }

      timeseriesOptions.series[0].data = timeData;
      timeseriesOptions.series[1].data = minData;
      timeseriesOptions.series[2].data = maxData;

      timeseriesOptions.xAxis.data = xData;
    }

    // update value if it has changed
    timeseriesData = timeseriesOptions.series[0].data;
    const xAxisData = timeseriesOptions.xAxis.data;
    for (let index = 0; index < timeseriesData.length; index++) {
      const dateCandidate = new Date(xAxisData[index]);
      if (dateCandidate >= fromDate_date && dateCandidate <= toDate_date) {
        const value = timeseriesData[index];
        // const date = indicatorMetadataAndGeoJSON.applicableDates[index];

        trendData.push([index, value]);
      }
    }

    // add regression line according to option
    if (trendEnabled) {
      let trendLine;
      if (computationType.includes('linear')) {
        trendLine = ecStat.regression('linear', trendData, 0);
      } else if (computationType.includes('exponential')) {
        trendLine = ecStat.regression('exponential', trendData, 0);
      } else if (computationType.includes('polynomial_3')) {
        trendLine = ecStat.regression('polynomial', trendData, 3);
      } else {
        trendLine = ecStat.regression('linear', trendData, 0);
      }

      timeseriesOptions.legend.data.push('Trendlinie');

      // make array of numeric values for series
      const trendLineNumbers: any = [];
      const trendLinePointsMap: any = new Map();
      for (const trendLineItem of trendLine.points) {
        trendLinePointsMap.set(trendLineItem[0], trendLineItem[1]);
      }
      for (let index = 0; index < timeseriesData.length; index++) {
        if (trendLinePointsMap.has(index)) {
          trendLineNumbers.push(trendLinePointsMap.get(index));
        } else {
          trendLineNumbers.push(NaN);
        }
      }

      timeseriesOptions.series.push({
        name: 'Trendlinie',
        type: 'line',
        showSymbol: false,
        data: trendLineNumbers,
        lineStyle: {
          normal: {
            color: 'red',
            width: 4,
            type: 'dashed',
          },
        },
        itemStyle: {
          normal: {
            borderWidth: 3,
            color: 'red',
            opacity: 0,
          },
        },
        markPoint: {
          itemStyle: {
            normal: {
              color: 'transparent',
            },
          },
          // label: {
          //     normal: {
          //         show: true,
          //         position: 'left',
          //         formatter: trendLine.expression,
          //         textStyle: {
          //             color: '#333',
          //             fontSize: 14
          //         }
          //     }
          // },
          data: [
            {
              coord: trendLine.points[trendLine.points.length - 1],
            },
          ],
        },
      });
    }

    if (!showMinMax) {
      timeseriesOptions.series.splice(1, 4);
    }

    return timeseriesOptions;
  }

  // Returns an image.
  // Attribution has to be converted to an image anyway for report generation.
  createReportingReachabilityMapAttribution() {
    const attributionText = 'Leaflet | Map data @ OpenStreetMap contributors';
    let canvas = document.createElement('canvas');
    canvas.width = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '8pt Arial';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgb(60, 60, 60)';
      ctx.fillText(attributionText, 0, 0);
    }
    canvas = this.trimCanvas(canvas, 5);

    const image = new Image(canvas.width, canvas.height);
    image.style.backgroundColor = 'white';
    return new Promise((resolve, _reject) => {
      image.onload = function () {
        resolve(image);
      };
      image.src = canvas.toDataURL();
    });
  }

  // Returns an image.
  // Legend has to be converted to an image anyway for report generation.
  createReportingReachabilityMapLegend(
    echartsOptions,
    selectedSpatialUnit,
    isochronesRangeType,
    isochronesRangeUnits
  ) {
    const legendEntries: any = [];
    let isochronesHeadingAdded = false;
    for (const series of echartsOptions.series) {
      if (series.name === 'spatialUnitBoundaries') {
        legendEntries.push({
          label: selectedSpatialUnit.spatialUnitName
            ? selectedSpatialUnit.spatialUnitName
            : selectedSpatialUnit.spatialUnitLevel,
          iconColor: series.itemStyle.borderColor,
          iconHeight: 4,
          isGroupHeading: false,
        });
      }

      if (series.name.includes('isochrones')) {
        if (!isochronesHeadingAdded) {
          // add heading above first isochrone entry
          legendEntries.push({
            label: 'Erreichbarkeit',
            isGroupHeading: true,
          });
          isochronesHeadingAdded = true;
        }

        const value = series.data[0].value;
        legendEntries.push({
          label: value,
          iconColor: series.data[0].itemStyle.areaColor,
          iconOpacity: series.data[0].itemStyle.opacity,
          iconHeight: 12,
          isGroupHeading: false,
          isIsochroneEntry: true,
        });
      }
    }

    let canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    const fontStyle = '8pt Arial';
    if (ctx) ctx.font = fontStyle;
    const xPos = 5;
    let yPos = 5;
    const rowHeight = 20;
    const iconWidth = 30;

    for (const entry of legendEntries) {
      if (entry.isGroupHeading) {
        const isochronesRangeTypeMapping = {
          time: 'Zeit',
          distance: 'Distanz',
        };
        // only draw label
        ctx!.font = 'bold ' + fontStyle;
        ctx!.fillStyle = 'black';
        ctx!.textBaseline = 'top';
        const text = entry.label + ' [' + isochronesRangeTypeMapping[isochronesRangeType] + ']';
        ctx!.fillText(text, xPos, yPos);
        yPos += rowHeight;
      } else {
        // icon
        if (entry.isIsochroneEntry) {
          const isochroneEntries = legendEntries.filter((entry) => {
            return entry.isIsochroneEntry;
          });
          // layer isochrone icons on top of each other unitl we reach the current one
          for (const isochroneEntry of isochroneEntries.reverse()) {
            if (isochroneEntry === entry) {
              break;
            }
            ctx!.fillStyle = isochroneEntry.iconColor;
            ctx!.globalAlpha = isochroneEntry.iconOpacity;
            ctx!.fillRect(
              xPos,
              yPos + (12 - entry.iconHeight) / 2,
              iconWidth,
              isochroneEntry.iconHeight
            );
            ctx!.globalAlpha = 1;
          }
        }

        ctx!.fillStyle = entry.iconColor;
        ctx!.globalAlpha = entry.iconOpacity ? entry.iconOpacity : 1;
        ctx!.fillRect(xPos, yPos + (12 - entry.iconHeight) / 2, iconWidth, entry.iconHeight);
        ctx!.globalAlpha = 1;
        // and label
        ctx!.font = fontStyle;
        ctx!.fillStyle = 'black';
        ctx!.textBaseline = 'top';
        if (entry.isIsochroneEntry) {
          const text = entry.label + ' ' + isochronesRangeUnits;
          ctx!.fillText(text, xPos + iconWidth + 5, yPos);
        } else {
          ctx!.fillText(entry.label, xPos + iconWidth + 5, yPos);
        }
        yPos += rowHeight;
      }
    }

    canvas = this.trimCanvas(canvas, 5);
    const image = new Image(canvas.width, canvas.height);
    image.style.backgroundColor = 'white';
    return new Promise((resolve, _reject) => {
      image.onload = function () {
        resolve(image);
      };
      image.src = canvas.toDataURL();
    });
  }

  trimCanvas(canvas, padding = 0) {
    function rowBlank(imageData, width, y) {
      for (let x = 0; x < width; ++x) {
        if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
      }
      return true;
    }

    function columnBlank(imageData, width, x, top, bottom) {
      for (let y = top; y < bottom; ++y) {
        if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
      }
      return true;
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let top = 0,
      bottom = imageData.height,
      left = 0,
      right = imageData.width;

    while (top < bottom && rowBlank(imageData, width, top)) ++top;
    while (bottom - 1 > top && rowBlank(imageData, width, bottom - 1)) --bottom;
    while (left < right && columnBlank(imageData, width, left, top, bottom)) ++left;
    while (right - 1 > left && columnBlank(imageData, width, right - 1, top, bottom)) --right;

    const trimmed = ctx.getImageData(left, top, right - left, bottom - top);
    const copy = canvas.ownerDocument.createElement('canvas');
    const copyCtx = copy.getContext('2d');
    copy.width = trimmed.width + padding * 2;
    copy.height = trimmed.height + padding * 2;
    copyCtx.putImageData(trimmed, padding, padding);

    return copy;
  }

  /* 
  setHistogramChartOptions = function (indicatorMetadataAndGeoJSON, indicatorValueArray, spatialUnitName, date) {
    var bins;
    try {
      bins = ecStat.histogram(indicatorValueArray);
    }
    catch (error) {
      console.log("Histogram chart cannot be drawn - error in bins creation");
      // kommonitorDataExchangeService.displayMapApplicationError(error);          
    }

    // default fontSize of echarts title
    var fontSize = 18;
    var histogramChartTitel = 'Histogramm - ' + spatialUnitName + ' - ';
    if (indicatorMetadataAndGeoJSON.fromDate) {
      histogramChartTitel += "Bilanz " + indicatorMetadataAndGeoJSON.fromDate + " - " + indicatorMetadataAndGeoJSON.toDate;
      fontSize = 14;
    }
    else {
      histogramChartTitel += date;
    }

    var histogramOption = {
      // grid get rid of whitespace around chart
      grid: {
        left: '4%',
        top: 32,
        right: '4%',
        bottom: 35,
        containLabel: true
      },
      title: {
        text: histogramChartTitel,
        left: 'center',
        textStyle: {
          fontSize: fontSize
        },
        show: false
        // top: 15
      },
      tooltip: {
        trigger: 'item',
        confine: 'true',
        axisPointer: {
          type: 'line',
          crossStyle: {
            color: '#999'
          }
        }
      },
      toolbox: {
        show: true,
        right: '15',
        feature: {
          // mark : {show: true},
          dataView: {
            show: kommonitorDataExchangeService.showDiagramExportButtons, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Histogramm', 'schlie&szlig;en', 'refresh'], optionToContent: function (opt) {

              // 	<table class="table table-condensed table-hover">
              // 	<thead>
              // 		<tr>
              // 			<th>Indikator-Name</th>
              // 			<th>Beschreibung der Verkn&uuml;pfung</th>
              // 		</tr>
              // 	</thead>
              // 	<tbody>
              // 		<tr ng-repeat="indicator in $ctrl.kommonitorDataExchangeServiceInstance.selectedIndicator.referencedIndicators">
              // 			<td>{{indicator.referencedIndicatorName}}</td>
              // 			<td>{{indicator.referencedIndicatorDescription}}</td>
              // 		</tr>
              // 	</tbody>
              // </table>

              var histogramData = opt.series[0].data;

              var dataTableId = "histogramDataTable_" + Math.random();
              var tableExportName = opt.xAxis[0].name + " - " + opt.title[0].text;

              var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
              htmlString += "<thead>";
              htmlString += "<tr>";
              htmlString += "<th style='text-align:center;'>Wertintervall</th>";
              htmlString += "<th style='text-align:center;'>H&auml;ufigkeit</th>";
              htmlString += "</tr>";
              htmlString += "</thead>";

              htmlString += "<tbody>";

              for (var i = 0; i < histogramData.length; i++) {
                htmlString += "<tr>";
                htmlString += "<td>" + histogramData[i][0] + " &mdash; " + histogramData[i][1] + "</td>";
                htmlString += "<td>" + histogramData[i][2] + "</td>";
                htmlString += "</tr>";
              }

              htmlString += "</tbody>";
              htmlString += "</table>";

              $rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);

              return htmlString;
            }
          },
          restore: { show: false, title: "Erneuern" },
          saveAsImage: { show: true, title: "Export", pixelRatio: 4 }
        }
      },
      xAxis: [{
        name: indicatorMetadataAndGeoJSON.indicatorName,
        nameLocation: 'center',
        nameGap: 22,
        scale: true,
      }],
      yAxis: {
        name: 'Anzahl Features',
        axisLabel: {
          formatter: function (value, index) {
            return kommonitorDataExchangeService.getIndicatorValue_asFormattedText(value);
          }
        }
        // nameGap: 35,
        // nameLocation: 'center',
        // nameRotate: 90,
      },
      series: [{
        type: 'custom',
        name: indicatorMetadataAndGeoJSON.indicatorName,
        renderItem: function (params, api) {
          var yValue = api.value(2);
          var start = api.coord([api.value(0), yValue]);
          var size = api.size([api.value(1) - api.value(0), yValue]);
          return {
            type: 'rect',
            shape: {
              x: start[0],
              y: start[1],
              width: size[0] * 0.99,
              height: size[1]
            },
            style: api.style()
          };
        },
        itemStyle: {
          color: '#337ab7'
        },
        // label: {
        //     normal: {
        //         show: true,
        //         position: 'insideTop'
        //     }
        // },
        dimensions: ['untere Intervallgrenze', 'obere Intervallgrenze', 'Anzahl'],
        encode: {
          x: [0, 1],
          y: 2,
          tooltip: [0, 1, 2]
        },
        data: bins ? bins.customData : undefined
      }]
    };

    // var option = {
    //     title: {
    //         text: 'Histogram Chart',
    //         left: 'center',
    //         top: 20
    //     },
    // 		tooltip: {
    // 					trigger: 'axis',
    // 					axisPointer: {
    // 							type: 'line',
    // 							crossStyle: {
    // 									color: '#999'
    // 							}
    // 					}
    // 				},
    //     color: ['rgb(25, 183, 207)'],
    //     grid: {
    //         left: '3%',
    //         right: '3%',
    //         bottom: '3%',
    //         containLabel: true
    //     },
    // 		xAxis: [{
    // 				type: 'value',
    // 					name: 'Wertintervalle',
    // 					nameLocation: 'center',
    // 					nameGap: 15,
    //             scale: true,
    //         }],
    //         yAxis: {
    // 					type: 'value',
    // 					name: 'Anzahl Features',
    // 					nameGap: 22,
    // 					nameLocation: 'center',
    // 					nameRotate: 90,
    //         },
    //     series: [{
    //         name: 'Anzahl',
    //         type: 'bar',
    // 				barWidth: '99,3%',
    //         // label: {
    //         //     normal: {
    //         //         show: true,
    //         //         position: 'insideTop',
    //         //         formatter: function (params) {
    //         //             return params.value[1];
    //         //         }
    //         //     }
    //         // },
    //         data: bins.data
    //     }]
    // };

    if (onlyContainsPositiveNumbers(indicatorValueArray)) {
      histogramOption.xAxis.min = 0;
    }

    self.histogramChartOptions = histogramOption;
  }; */
}
