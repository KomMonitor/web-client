import { __decorate } from "tslib";
import { Injectable, EventEmitter } from '@angular/core';
import { environment } from 'env_backup';
export let KommonitorDiagramHelperService = class KommonitorDiagramHelperService {
    constructor(mapService, dataExchangeService, filterHelperService, http) {
        this.mapService = mapService;
        this.dataExchangeService = dataExchangeService;
        this.filterHelperService = filterHelperService;
        this.http = http;
        this.INDICATOR_DATE_PREFIX = environment.indicatorDatePrefix;
        this.defaultColorForHoveredFeatures = environment.defaultColorForHoveredFeatures;
        this.defaultColorForClickedFeatures = environment.defaultColorForClickedFeatures;
        this.numberOfDecimals = environment.numberOfDecimals;
        this.defaultColorForZeroValues = environment.defaultColorForZeroValues;
        this.defaultColorForNoDataValues = environment.defaultColorForNoDataValues;
        this.defaultColorForFilteredValues = environment.defaultColorForFilteredValues;
        this.defaultColorForOutliers_high = environment.defaultColorForOutliers_high;
        this.defaultBorderColorForOutliers_high = environment.defaultBorderColorForOutliers_high;
        this.defaultFillOpacityForOutliers_high = environment.defaultFillOpacityForOutliers_high;
        this.defaultColorForOutliers_low = environment.defaultColorForOutliers_low;
        this.defaultBorderColorForOutliers_low = environment.defaultBorderColorForOutliers_low;
        this.defaultFillOpacityForOutliers_low = environment.defaultFillOpacityForOutliers_low;
        this.indicatorPropertyName = "";
        this.barChartOptions = {};
        this.lineChartOptions = {};
        this.histogramChartOptions = {};
        this.radarChartOptions = {};
        this.regressionChartOptions = {};
        this.allIndicatorPropertiesForCurrentSpatialUnitAndTime = [];
        this.filterSameUnitAndSameTime = false;
        this.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin = new EventEmitter();
        this.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted = new EventEmitter();
        this.geoMapChartOptions = {};
        this.fetchIndicatorPropertiesIfNotExists = async (index) => {
            if (this.allIndicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === null ||
                this.allIndicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === undefined) {
                this.allIndicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties = await this.fetchIndicatorProperties(this.allIndicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorMetadata, this.dataExchangeService.selectedSpatialUnit.spatialUnitId);
            }
        };
        this.compareFeaturesByIndicatorValue = (featureA, featureB) => {
            if (featureA.properties[this.indicatorPropertyName] < featureB.properties[this.indicatorPropertyName]) {
                return -1;
            }
            if (featureA.properties[this.indicatorPropertyName] > featureB.properties[this.indicatorPropertyName]) {
                return 1;
            }
            return 0;
        };
    }
    isCloserToTargetDate(date, closestDate, targetDate) {
        const targetYear = targetDate.split("-")[0];
        const targetMonth = targetDate.split("-")[1];
        const targetDay = targetDate.split("-")[2];
        const closestDateComps = closestDate.split("-");
        const closestDateYear = closestDateComps[0];
        const closestDateMonth = closestDateComps[1];
        const closestDateDay = closestDateComps[2];
        const dateComps = date.split("-");
        const year = dateComps[0];
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
        const targetYear = targetDate.split("-")[0];
        const targetMonth = targetDate.split("-")[1];
        const targetDay = targetDate.split("-")[2];
        let closestDate;
        for (const date of applicableDates) {
            const dateComps = date.split("-");
            const year = dateComps[0];
            const month = dateComps[1];
            const day = dateComps[2];
            if (targetDate.includes(year)) {
                if (!closestDate) {
                    closestDate = date;
                }
                else {
                    if (this.isCloserToTargetDate(date, closestDate, targetDate)) {
                        closestDate = date;
                    }
                }
            }
        }
        return closestDate;
    }
    setupAllIndicatorPropertiesForCurrentSpatialUnitAndTime(filterBySameUnitAndSameTime) {
        this.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin.emit();
        this.allIndicatorPropertiesForCurrentSpatialUnitAndTime = [];
        this.dataExchangeService.displayableIndicators.forEach((indicatorMetadata) => {
            const targetYear = this.dataExchangeService.selectedDate.split("-")[0];
            const indicatorCandidateYears = [];
            indicatorMetadata.applicableDates.forEach((date) => {
                indicatorCandidateYears.push(date.split("-")[0]);
            });
            if (indicatorMetadata.applicableSpatialUnits.some((o) => o.spatialUnitName === this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
                let canBeAdded = true;
                if (filterBySameUnitAndSameTime) {
                    if (indicatorCandidateYears.includes(targetYear)) {
                        canBeAdded = true;
                    }
                    else {
                        canBeAdded = false;
                    }
                }
                if (canBeAdded) {
                    const selectableIndicatorEntry = {};
                    selectableIndicatorEntry.indicatorProperties = null;
                    selectableIndicatorEntry.isSelected = false;
                    selectableIndicatorEntry.indicatorMetadata = indicatorMetadata;
                    this.allIndicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
                }
            }
        });
        this.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted.emit();
    }
    fetchIndicatorProperties(indicatorMetadata, spatialUnitId) {
        const url = `${this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/indicators/${indicatorMetadata.indicatorId}/${spatialUnitId}/without-geometry`;
        return this.http.get(url).toPromise();
    }
    getColorFromBrewInstance(brewInstance, feature, targetDate) {
        let color;
        for (let index = 0; index < brewInstance.breaks.length; index++) {
            if (this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) ===
                this.dataExchangeService.getIndicatorValue_asNumber(brewInstance.breaks[index])) {
                if (index < brewInstance.breaks.length - 1) {
                    // min value
                    color = brewInstance.colors[index];
                    break;
                }
                else {
                    // max value
                    if (brewInstance.colors[index]) {
                        color = brewInstance.colors[index];
                    }
                    else {
                        color = brewInstance.colors[index - 1];
                    }
                    break;
                }
            }
            else {
                if (this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) <
                    this.dataExchangeService.getIndicatorValue_asNumber(brewInstance.breaks[index + 1])) {
                    color = brewInstance.colors[index];
                    break;
                }
            }
        }
        return color;
    }
    getColorForFeature(feature, indicatorMetadataAndGeoJSON, targetDate, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue) {
        let color;
        if (!targetDate.includes(this.INDICATOR_DATE_PREFIX)) {
            targetDate = this.INDICATOR_DATE_PREFIX + targetDate;
        }
        if (this.dataExchangeService.indicatorValueIsNoData(feature.properties[targetDate])) {
            color = this.defaultColorForNoDataValues;
        }
        else if (this.filterHelperService.featureIsCurrentlyFiltered(feature.properties[this.__env.FEATURE_ID_PROPERTY_NAME])) {
            color = this.defaultColorForFilteredValues;
        }
        else if (this.dataExchangeService.classifyZeroSeparately && this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) === 0) {
            color = this.defaultColorForZeroValues;
        }
        else if (feature.properties["outlier"] !== undefined && feature.properties["outlier"].includes("low") && this.dataExchangeService.useOutlierDetectionOnIndicator) {
            color = this.defaultColorForOutliers_low;
        }
        else if (feature.properties["outlier"] !== undefined && feature.properties["outlier"].includes("high") && this.dataExchangeService.useOutlierDetectionOnIndicator) {
            color = this.defaultColorForOutliers_high;
        }
        else if (isMeasureOfValueChecked) {
            if (this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) >= +Number(measureOfValue).toFixed(this.numberOfDecimals)) {
                color = this.getColorFromBrewInstance(gtMeasureOfValueBrew, feature, targetDate);
            }
            else {
                color = this.getColorFromBrewInstance(ltMeasureOfValueBrew, feature, targetDate);
            }
        }
        else {
            if (indicatorMetadataAndGeoJSON.indicatorType.includes('DYNAMIC')) {
                if (feature.properties[targetDate] < 0) {
                    color = this.getColorFromBrewInstance(dynamicDecreaseBrew, feature, targetDate);
                }
                else {
                    color = this.getColorFromBrewInstance(dynamicIncreaseBrew, feature, targetDate);
                }
            }
            else {
                if (containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON, targetDate)) {
                    if (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[targetDate]) >= 0) {
                        if (this.dataExchangeService.classifyZeroSeparately && (feature.properties[targetDate] == 0 || feature.properties[targetDate] == "0")) {
                            color = this.defaultColorForZeroValues;
                        }
                        else {
                            color = this.getColorFromBrewInstance(dynamicIncreaseBrew, feature, targetDate);
                        }
                    }
                    else {
                        if (this.dataExchangeService.classifyZeroSeparately && (feature.properties[targetDate] == 0 || feature.properties[targetDate] == "0")) {
                            color = this.defaultColorForZeroValues;
                        }
                        else {
                            color = this.getColorFromBrewInstance(dynamicDecreaseBrew, feature, targetDate);
                        }
                    }
                }
                else {
                    color = this.getColorFromBrewInstance(defaultBrew, feature, targetDate);
                }
            }
        }
        return color;
    }
    setLineChartOptions(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray, indicatorTimeSeriesMaxArray, indicatorTimeSeriesMinArray, spatialUnitName, date) {
        throw new Error('Function not implemented.');
    }
    getBarChartOptions() {
        return this.barChartOptions;
    }
    getGeoMapChartOptions() {
        return this.geoMapChartOptions;
    }
    getHistogramChartOptions() {
        return this.histogramChartOptions;
    }
    getLineChartOptions() {
        return this.lineChartOptions;
    }
    prepareAllDiagramResources_forCurrentMapIndicator(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates) {
        this.prepareAllDiagramResources(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates, false);
    }
    prepareAllDiagramResources_forReportingIndicator(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates) {
        this.prepareAllDiagramResources(indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, filterOutFutureDates, true);
    }
};
KommonitorDiagramHelperService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], KommonitorDiagramHelperService);
//# sourceMappingURL=kommonitor-diagram-helper-service.js.map