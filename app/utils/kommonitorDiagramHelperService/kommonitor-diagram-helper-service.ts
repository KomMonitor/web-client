import { Injectable, EventEmitter } from '@angular/core';
import { KommonitorFilterHelperService } from './kommonitor-filter-helper.service';
import { KommonitorMapService } from './kommonitor-map.service';
import { KommonitorDataExchangeService } from './kommonitor-data-exchange.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'env_backup';

@Injectable({
  providedIn: 'root'
})

export class KommonitorDiagramHelperService {
  public INDICATOR_DATE_PREFIX = environment.indicatorDatePrefix;
  public defaultColorForHoveredFeatures = environment.defaultColorForHoveredFeatures;
  public defaultColorForClickedFeatures = environment.defaultColorForClickedFeatures;
  public numberOfDecimals = environment.numberOfDecimals;
  public defaultColorForZeroValues = environment.defaultColorForZeroValues;
  public defaultColorForNoDataValues = environment.defaultColorForNoDataValues;
  public defaultColorForFilteredValues = environment.defaultColorForFilteredValues;
  public defaultColorForOutliers_high = environment.defaultColorForOutliers_high;
  public defaultBorderColorForOutliers_high = environment.defaultBorderColorForOutliers_high;
  public defaultFillOpacityForOutliers_high = environment.defaultFillOpacityForOutliers_high;
  public defaultColorForOutliers_low = environment.defaultColorForOutliers_low;
  public defaultBorderColorForOutliers_low = environment.defaultBorderColorForOutliers_low;
  public defaultFillOpacityForOutliers_low = environment.defaultFillOpacityForOutliers_low;
  public indicatorPropertyName = "";
  public barChartOptions: any = {};
  public lineChartOptions: any = {};
  public histogramChartOptions: any = {};
  public radarChartOptions: any = {};
  public regressionChartOptions: any = {};
  public allIndicatorPropertiesForCurrentSpatialUnitAndTime: any[] = [];
  public filterSameUnitAndSameTime = false;
  public allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin = new EventEmitter<void>();
  public allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted = new EventEmitter<void>();
  public geoMapChartOptions: any={};
  
  constructor(
    private mapService: KommonitorMapService,
    private dataExchangeService: KommonitorDataExchangeService,
    private filterHelperService: KommonitorFilterHelperService,
    private http: HttpClient,
    
  ) {}

  public isCloserToTargetDate(date: string, closestDate: string, targetDate: string): boolean {
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

  public findClostestTimestamForTargetDate(indicatorForRadar: any, targetDate: string): string {
    const applicableDates = indicatorForRadar.indicatorMetadata.applicableDates;
    const targetYear = targetDate.split("-")[0];
    const targetMonth = targetDate.split("-")[1];
    const targetDay = targetDate.split("-")[2];
    let closestDate: string | undefined;
    for (const date of applicableDates) {
      const dateComps = date.split("-");
      const year = dateComps[0];
      const month = dateComps[1];
      const day = dateComps[2];
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
    return closestDate!;
  }

  public setupAllIndicatorPropertiesForCurrentSpatialUnitAndTime(filterBySameUnitAndSameTime: boolean): void {
    this.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin.emit();
    this.allIndicatorPropertiesForCurrentSpatialUnitAndTime = [];
    this.dataExchangeService.displayableIndicators.forEach((indicatorMetadata: any) => {
      const targetYear = this.dataExchangeService.selectedDate.split("-")[0];
      const indicatorCandidateYears: string[] = [];
      indicatorMetadata.applicableDates.forEach((date: string) => {
        indicatorCandidateYears.push(date.split("-")[0]);
      });
      if (indicatorMetadata.applicableSpatialUnits.some((o: any) => o.spatialUnitName === this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel)) {
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
          selectableIndicatorEntry.isSelected = false;
          selectableIndicatorEntry.indicatorMetadata = indicatorMetadata;
          this.allIndicatorPropertiesForCurrentSpatialUnitAndTime.push(selectableIndicatorEntry);
        }
      }
    });
    this.allIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted.emit();
  }

  public fetchIndicatorPropertiesIfNotExists = async (index: number): Promise<void> => {
    if (
      this.allIndicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === null ||
      this.allIndicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties === undefined
    ) {
      this.allIndicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorProperties = await this.fetchIndicatorProperties(
        this.allIndicatorPropertiesForCurrentSpatialUnitAndTime[index].indicatorMetadata,
        this.dataExchangeService.selectedSpatialUnit.spatialUnitId
      );
    }
  };
  public fetchIndicatorProperties(indicatorMetadata: any, spatialUnitId: string): Promise<any> {
    const url = `${this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/indicators/${indicatorMetadata.indicatorId}/${spatialUnitId}/without-geometry`;
    return this.http.get(url).toPromise();
  }  
  public getColorFromBrewInstance(brewInstance: any, feature: any, targetDate: string): string {
    let color: string;
    for (let index = 0; index < brewInstance.breaks.length; index++) {
      if (
        this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) ===
        this.dataExchangeService.getIndicatorValue_asNumber(brewInstance.breaks[index])
      ) {
        if (index < brewInstance.breaks.length - 1) {
          // min value
          color = brewInstance.colors[index];
          break;
        } else {
          // max value
          if (brewInstance.colors[index]) {
            color = brewInstance.colors[index];
          } else {
            color = brewInstance.colors[index - 1];
          }
          break;
        }
      } else {
        if (
          this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) <
          this.dataExchangeService.getIndicatorValue_asNumber(brewInstance.breaks[index + 1])
        ) {
          color = brewInstance.colors[index];
          break;
        }
      }
    }
    return color!;
  }

  public getColorForFeature(
    feature: any,
    indicatorMetadataAndGeoJSON: any,
    targetDate: string,
    defaultBrew: any,
    gtMeasureOfValueBrew: any,
    ltMeasureOfValueBrew: any,
    dynamicIncreaseBrew: any,
    dynamicDecreaseBrew: any,
    isMeasureOfValueChecked: boolean,
    measureOfValue: number
  ): string {
    let color: string;
    if (!targetDate.includes(this.INDICATOR_DATE_PREFIX)) {
      targetDate = this.INDICATOR_DATE_PREFIX + targetDate;
    }
    if (this.dataExchangeService.indicatorValueIsNoData(feature.properties[targetDate])) {
      color = this.defaultColorForNoDataValues;
    } else if (this.filterHelperService.featureIsCurrentlyFiltered(feature.properties[this.__env.FEATURE_ID_PROPERTY_NAME])) {
      color = this.defaultColorForFilteredValues;
    } else if (this.dataExchangeService.classifyZeroSeparately && this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) === 0) {
      color = this.defaultColorForZeroValues;
    } else if (feature.properties["outlier"] !== undefined && feature.properties["outlier"].includes("low") && this.dataExchangeService.useOutlierDetectionOnIndicator) {
      color = this.defaultColorForOutliers_low;
    } else if (feature.properties["outlier"] !== undefined && feature.properties["outlier"].includes("high") && this.dataExchangeService.useOutlierDetectionOnIndicator) {
      color = this.defaultColorForOutliers_high;
    } else if (isMeasureOfValueChecked) {
      if (this.dataExchangeService.getIndicatorValueFromArray_asNumber(feature.properties, targetDate) >= +Number(measureOfValue).toFixed(this.numberOfDecimals)) {
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
        if (containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON, targetDate)) {
          if (this.dataExchangeService.getIndicatorValue_asNumber(feature.properties[targetDate]) >= 0) {
            if (this.dataExchangeService.classifyZeroSeparately && (feature.properties[targetDate] == 0 || feature.properties[targetDate] == "0")) {
              color = this.defaultColorForZeroValues;
            } else {
              color = this.getColorFromBrewInstance(dynamicIncreaseBrew, feature, targetDate);
            }
          } else {
            if (this.dataExchangeService.classifyZeroSeparately && (feature.properties[targetDate] == 0 || feature.properties[targetDate] == "0")) {
              color = this.defaultColorForZeroValues;
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
  
  public setLineChartOptions(indicatorMetadataAndGeoJSON: any, indicatorTimeSeriesDatesArray: any, indicatorTimeSeriesAverageArray: any[], indicatorTimeSeriesMaxArray: any[], indicatorTimeSeriesMinArray: any[], spatialUnitName: string, date: string) {
    throw new Error('Function not implemented.');
}

  public getBarChartOptions(): any {
    return this.barChartOptions;
  }

  public getGeoMapChartOptions(): any {
    return this.geoMapChartOptions;
  }
  public getHistogramChartOptions(): any {
    return this.histogramChartOptions;
  }

  public getLineChartOptions(): any {
    return this.lineChartOptions;
  }

  public prepareAllDiagramResources_forCurrentMapIndicator(
    indicatorMetadataAndGeoJSON: any,
    spatialUnitName: string,
    date: string,
    defaultBrew: any,
    gtMeasureOfValueBrew: any,
    ltMeasureOfValueBrew: any,
    dynamicIncreaseBrew: any,
    dynamicDecreaseBrew: any,
    isMeasureOfValueChecked: boolean,
    measureOfValue: any,
    filterOutFutureDates: boolean
  ): void {
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

  public prepareAllDiagramResources_forReportingIndicator(
    indicatorMetadataAndGeoJSON: any,
    spatialUnitName: string,
    date: string,
    defaultBrew: any,
    gtMeasureOfValueBrew: any,
    ltMeasureOfValueBrew: any,
    dynamicIncreaseBrew: any,
    dynamicDecreaseBrew: any,
    isMeasureOfValueChecked: boolean,
    measureOfValue: any,
    filterOutFutureDates: boolean
  ): void {
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
      true
    );
  }
  
  public  compareFeaturesByIndicatorValue = (featureA, featureB) => {
    if (featureA.properties[this.indicatorPropertyName] < featureB.properties[this.indicatorPropertyName]) {
        return -1;
    }
    if (featureA.properties[this.indicatorPropertyName] > featureB.properties[this.indicatorPropertyName]) {
        return 1;
    }
    return 0;
}




























}
