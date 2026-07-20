import { Injectable, inject } from '@angular/core';
import {
  CATEGORICAL_OTHER_COLOR,
  CategoricalClassificationItem,
} from 'components/ngComponents/models/classification.models';
import { IndicatorsDataset } from 'components/ngComponents/models/indicators.models';
import L from 'leaflet';
import 'leaflet.pattern';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { ClassificationStateService } from 'services/classification-state-service/classification-state.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import classyBrew from '../../../customizedExternalLibs/classyBrew.js';
import { colorbrewer } from './../../components/ngComponents/userInterface/kommonitorClassification/colors';

@Injectable({
  providedIn: 'root',
})
export class VisualStyleHelperServiceNew {
  private chartDisplayState = inject(ChartDisplayStateService);
  private envConfigService = inject(EnvConfigService);
  private indicatorValueService = inject(IndicatorValueService);
  private selectionState = inject(SelectionStateService);
  private classificationState = inject(ClassificationStateService);

  // Local precision-resolving wrapper (formerly the DataExchangeService facade glue, Prio7 B1).
  private getIndicatorValue_asNumber(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asNumber(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  colorbrewer = colorbrewer;

  // transient work arrays of the brew setup methods
  private greaterThanValues: any = [];
  private lesserThanValues: any = [];
  private positiveValues: any = [];
  private negativeValues: any = [];

  private numberOfDecimals = this.envConfigService.numberOfDecimals;
  private defaultColorForFilteredValues = this.envConfigService.defaultColorForFilteredValues;
  private defaultBorderColorForFilteredValues =
    this.envConfigService.defaultBorderColorForFilteredValues;
  private defaultBorderColor = this.envConfigService.defaultBorderColor;
  private defaultFillOpacity = this.envConfigService.defaultFillOpacity;
  private defaultFillOpacityForFilteredFeatures =
    this.envConfigService.defaultFillOpacityForFilteredFeatures;
  private defaultFillOpacityForHighlightedFeatures =
    this.envConfigService.defaultFillOpacityForHighlightedFeatures;
  private defaultFillOpacityForZeroFeatures =
    this.envConfigService.defaultFillOpacityForZeroFeatures;
  private defaultColorBrewerPaletteForBalanceIncreasingValues =
    this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues;
  private defaultColorBrewerPaletteForBalanceDecreasingValues =
    this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues;
  private defaultColorBrewerPaletteForGtMovValues =
    this.envConfigService.defaultColorBrewerPaletteForGtMovValues;
  private defaultColorBrewerPaletteForLtMovValues =
    this.envConfigService.defaultColorBrewerPaletteForLtMovValues;
  private defaultColorForHoveredFeatures = this.envConfigService.defaultColorForHoveredFeatures;
  private defaultColorForClickedFeatures = this.envConfigService.defaultColorForClickedFeatures;
  private defaultBorderColorForNoDataValues =
    this.envConfigService.defaultBorderColorForNoDataValues;
  private defaultColorForNoDataValues = this.envConfigService.defaultColorForNoDataValues;
  private defaultFillOpacityForNoDataValues =
    this.envConfigService.defaultFillOpacityForNoDataValues;

  private indicatorTransparency = 1 - this.envConfigService.defaultFillOpacity;

  private defaultColorForZeroValues = this.envConfigService.defaultColorForZeroValues;
  private defaultColorForOutliers_high = this.envConfigService.defaultColorForOutliers_high;
  private defaultBorderColorForOutliers_high =
    this.envConfigService.defaultBorderColorForOutliers_high;
  private defaultFillOpacityForOutliers_high =
    this.envConfigService.defaultFillOpacityForOutliers_high;
  private defaultColorForOutliers_low = this.envConfigService.defaultColorForOutliers_low;
  private defaultBorderColorForOutliers_low =
    this.envConfigService.defaultBorderColorForOutliers_low;
  private defaultFillOpacityForOutliers_low =
    this.envConfigService.defaultFillOpacityForOutliers_low;
  private useOutlierDetectionOnIndicator = this.envConfigService.useOutlierDetectionOnIndicator;
  private customColorSchemes = this.envConfigService.customColorSchemes;

  outlierPropertyName = 'outlier';
  outlierPropertyValue_high_soft = 'high-soft';
  outlierPropertyValue_low_soft = 'low-soft';
  outlierPropertyValue_high_extreme = 'high-extreme';
  outlierPropertyValue_low_extreme = 'low-extreme';
  outlierPropertyValue_no = 'no';

  outlierFillPattern_low = new L.StripePattern({
    weight: 1,
    spaceweight: 1,
    patternTransform: 'rotate(45)',
  });
  //outlierFillPattern_low = [];

  outlierFillPattern_high = new L.StripePattern({
    weight: 1,
    spaceweight: 1,
    patternTransform: 'rotate(-45)',
  });
  //outlierFillPattern_high = [];

  /* shape = new L.PatternCircle({
    x: 5,
    y: 5,
    radius: 1,
    fill: true,
    color: this.selectionState.selectedSpatialUnitIsRaster() ? undefined : defaultColorForNoDataValues
  }); */
  noDataFillPattern = new L.Pattern({ width: 8, height: 8 });
  //noDataFillPattern = [];
  //noDataFillPattern.addShape(shape);

  outlierStyle_high = {
    weight: 1,
    opacity: 1,
    color: this.selectionState.selectedSpatialUnitIsRaster()
      ? undefined
      : this.envConfigService.defaultBorderColorForOutliers_high,
    dashArray: '',
    fillOpacity: this.envConfigService.defaultFillOpacityForOutliers_high,
    fillColor: this.envConfigService.defaultColorForOutliers_high,
    fillPattern: this.outlierFillPattern_high,
  };

  outlierStyle_low = {
    weight: 1,
    opacity: 1,
    color: this.selectionState.selectedSpatialUnitIsRaster()
      ? undefined
      : this.envConfigService.defaultBorderColorForOutliers_low,
    dashArray: '',
    fillOpacity: this.envConfigService.defaultFillOpacityForOutliers_low,
    fillColor: this.envConfigService.defaultColorForOutliers_low,
    fillPattern: this.outlierFillPattern_low,
  };

  noDataStyle = {
    weight: 1,
    opacity: 1,
    color: this.selectionState.selectedSpatialUnitIsRaster()
      ? undefined
      : this.envConfigService.defaultBorderColorForNoDataValues,
    dashArray: '',
    fillOpacity: this.envConfigService.defaultFillOpacityForNoDataValues,
    fillColor: this.envConfigService.defaultColorForNoDataValues,
    // fillPattern: this.noDataFillPattern
  };

  filteredStyle = {
    weight: 1,
    opacity: 1,
    color: this.selectionState.selectedSpatialUnitIsRaster()
      ? undefined
      : this.envConfigService.defaultBorderColorForFilteredValues,
    dashArray: '',
    fillOpacity: this.envConfigService.defaultFillOpacityForFilteredFeatures,
    fillColor: this.envConfigService.defaultColorForFilteredValues,
  };

  getFillColorForZero(incrementFeatures) {
    if (incrementFeatures) {
      this.classificationState.featuresPerZero++;
    }
    return this.defaultColorForZeroValues;
  }

  // Return type is `any` on purpose: classyBrew.js is an untyped vendored lib.
  // The build (allowJs:false) sees the import as `any`; ts-jest (allowJs:true)
  // analyzes the .js and would infer an instance type lacking the dynamically
  // assigned `.colors` property. Casting + `any` keeps both configs consistent.
  createNewClassyBrewInstance(): any {
    const classyBrewInstance: any = new (classyBrew as any)();

    // Add custom color themes from configuration properties
    if (this.customColorSchemes) {
      this.colorbrewer = Object.assign(this.customColorSchemes, this.colorbrewer);
    }

    // must overwrite the color schemes of classybrew if there are any custom color palettes defined by KomMonitor users
    // that are not part of official colorbrewer project
    // deep clone colorbrewer content in case some methods use .shift method on color palette arrays
    classyBrewInstance.colorSchemes = jQuery.extend(true, {}, this.colorbrewer);

    return classyBrewInstance;
  }

  setupDefaultBrew(
    geoJSON,
    propertyName,
    numClasses,
    colorCode,
    classifyMethod,
    forceProvidedIndicator = false,
    indicator: IndicatorsDataset | false = false
  ) {
    this.classificationState.resetFeatureCounters();

    let values = [];

    if (this.envConfigService.classifyUsingWholeTimeseries) {
      values = this.setupDefaultBrewValues_wholeTimeseries(
        geoJSON,
        values,
        forceProvidedIndicator,
        indicator
      );
    } else {
      values = this.setupDefaultBrewValues_singleTimestamp(geoJSON, propertyName, values);
    }

    this.classificationState.defaultBrew = this.setupClassyBrew_usingFeatureCount(
      values,
      colorCode,
      classifyMethod,
      numClasses
    );
    return this.classificationState.defaultBrew;
  }

  setupDefaultBrewValues_singleTimestamp(geoJSON, propertyName, values) {
    for (const feature of geoJSON.features) {
      if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[propertyName]))
        continue;

      if (
        this.envConfigService.classifyZeroSeparately &&
        this.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0
      ) {
        continue;
      }

      // check if is outlier, then do not use within classification, as it will be marked on map with special color
      if (
        feature.properties[this.outlierPropertyName] &&
        feature.properties[this.outlierPropertyName] !== this.outlierPropertyValue_no &&
        this.envConfigService.useOutlierDetectionOnIndicator
      ) {
        continue;
      }

      if (!values.includes(this.getIndicatorValue_asNumber(feature.properties[propertyName]))) {
        values.push(this.getIndicatorValue_asNumber(feature.properties[propertyName]));
      }
    }

    return values;
  }

  setupDefaultBrewValues_wholeTimeseries(geoJSON, values, forceProvidedIndicator, indicator) {
    let indicatorTimeSeriesDatesArray;
    if (forceProvidedIndicator) {
      indicatorTimeSeriesDatesArray = indicator.applicableDates;
    } else {
      indicatorTimeSeriesDatesArray = this.selectionState.selectedIndicator.applicableDates;
    }

    for (const date of indicatorTimeSeriesDatesArray) {
      const propertyName = this.envConfigService.indicatorDatePrefix + date;
      values = this.setupDefaultBrewValues_singleTimestamp(geoJSON, propertyName, values);
    }

    return values;
  }

  setupManualBrew(numClasses, colorCode, breaks) {
    this.classificationState.resetFeatureCounters();

    const colorBrewerInstance = this.createNewClassyBrewInstance();
    numClasses = breaks.length - 1;

    if (numClasses >= 3) {
      colorBrewerInstance.colors = colorBrewerInstance.colorSchemes[colorCode][numClasses];
    } else {
      colorBrewerInstance.colors = colorBrewerInstance.colorSchemes[colorCode][3];
      if (numClasses == 2) {
        colorBrewerInstance.colors.shift();
      }
      if (numClasses == 1) {
        colorBrewerInstance.colors.shift();
        colorBrewerInstance.colors.shift();
      }
      if (numClasses <= 0) {
        colorBrewerInstance.colors = [];
      }
    }

    colorBrewerInstance.numClasses = numClasses;
    colorBrewerInstance.colorCode = colorCode;

    colorBrewerInstance.breaks = breaks;

    return colorBrewerInstance;
  }

  /**
   * Returns and array of color brewer instances for greater and lesser than measure of value colors
   *
   * [gtMeasureOfValueBrew, ltMeasureOfValueBrew]
   */
  setupMeasureOfValueBrew(
    geoJSON,
    propertyName,
    colorCodeForGreaterThanValues,
    colorCodeForLesserThanValues,
    classifyMethod,
    measureOfValue,
    manualBreaks,
    regionalDefaultMOVBreaks,
    numClasses
  ) {
    /*
    * Idea: Analyse the complete geoJSON property array for each feature and make conclusion about how to build the legend

    e.g. if there are only positive values then display only positive values within 5 categories - same for only negative values

    e.g. if there are equally many positive as negative values then display both using 3 categories each

    e.g. if there are way more positive than negative values, then display both with 2 (negative) and 4 (positive) classes

    --> implement special cases (0, 1 or 2 negative/positive values --> apply colors manually)
    --> treat all other cases equally to measureOfValue
    */

    this.classificationState.resetFeatureCounters();

    this.greaterThanValues = [];
    this.lesserThanValues = [];

    if (this.envConfigService.classifyUsingWholeTimeseries) {
      this.setupMovBrewValues_wholeTimeseries(geoJSON, measureOfValue);
    } else {
      this.setupMovBrewValues_singleTimestamp(geoJSON, propertyName, measureOfValue);
    }

    let gtMeasureOfValueBrew = this.setupGtMeasureOfValueBrew(
      this.greaterThanValues,
      colorCodeForGreaterThanValues,
      classifyMethod,
      Math.ceil(numClasses / 2)
    );
    let ltMeasureOfValueBrew = this.setupLtMeasureOfValueBrew(
      this.lesserThanValues,
      colorCodeForLesserThanValues,
      classifyMethod,
      Math.floor(numClasses / 2)
    );

    if (
      classifyMethod == 'regional_default' &&
      regionalDefaultMOVBreaks[0] &&
      regionalDefaultMOVBreaks[1]
    ) {
      gtMeasureOfValueBrew = this.setupManualBrew(
        regionalDefaultMOVBreaks[0].length - 1,
        colorCodeForGreaterThanValues,
        regionalDefaultMOVBreaks[0]
      );
      ltMeasureOfValueBrew = this.setupManualBrew(
        regionalDefaultMOVBreaks[1].length - 1,
        colorCodeForLesserThanValues,
        regionalDefaultMOVBreaks[1]
      );
      ltMeasureOfValueBrew.colors = ltMeasureOfValueBrew.colors.reverse();
    } else if (classifyMethod == 'manual') {
      if (!manualBreaks || manualBreaks.length == 0) {
        manualBreaks = [];
        manualBreaks[0] = gtMeasureOfValueBrew ? gtMeasureOfValueBrew.breaks : [];
        manualBreaks[1] = ltMeasureOfValueBrew ? ltMeasureOfValueBrew.breaks : [];
      }

      const manualBreaksMatchMeasureOfValue =
        manualBreaks[1][manualBreaks[1].length - 1] <= measureOfValue &&
        measureOfValue <= manualBreaks[0][0];

      if (manualBreaksMatchMeasureOfValue) {
        gtMeasureOfValueBrew = this.setupManualBrew(
          manualBreaks[0].length - 1,
          colorCodeForGreaterThanValues,
          manualBreaks[0]
        );
        ltMeasureOfValueBrew = this.setupManualBrew(
          manualBreaks[1].length - 1,
          colorCodeForLesserThanValues,
          manualBreaks[1]
        );
        ltMeasureOfValueBrew.colors = ltMeasureOfValueBrew.colors.reverse();
      }
    }

    this.classificationState.measureOfValueBrew = [gtMeasureOfValueBrew, ltMeasureOfValueBrew];
    return this.classificationState.measureOfValueBrew;
  }

  setupMovBrewValues_singleTimestamp(geoJSON, propertyName, measureOfValue) {
    for (const feature of geoJSON.features) {
      if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[propertyName]))
        continue;

      if (
        this.envConfigService.classifyZeroSeparately &&
        this.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0
      ) {
        continue;
      }

      // check if is outlier, then do not use within classification, as it will be marked on map with special color
      if (
        feature.properties[this.outlierPropertyName] &&
        feature.properties[this.outlierPropertyName] !== this.outlierPropertyValue_no &&
        this.envConfigService.useOutlierDetectionOnIndicator
      ) {
        continue;
      } else if (
        this.getIndicatorValue_asNumber(feature.properties[propertyName]) >=
        this.getIndicatorValue_asNumber(measureOfValue)
      ) {
        if (
          !this.greaterThanValues.includes(
            this.getIndicatorValue_asNumber(feature.properties[propertyName])
          )
        ) {
          this.greaterThanValues.push(
            this.getIndicatorValue_asNumber(feature.properties[propertyName])
          );
        }
      } else {
        if (
          !this.lesserThanValues.includes(
            this.getIndicatorValue_asNumber(feature.properties[propertyName])
          )
        ) {
          this.lesserThanValues.push(
            this.getIndicatorValue_asNumber(feature.properties[propertyName])
          );
        }
      }
    }
  }

  setupMovBrewValues_wholeTimeseries(geoJSON, measureOfValue) {
    const indicatorTimeSeriesDatesArray = this.selectionState.selectedIndicator.applicableDates;

    for (const date of indicatorTimeSeriesDatesArray) {
      const propertyName = this.envConfigService.indicatorDatePrefix + date;
      this.setupMovBrewValues_singleTimestamp(geoJSON, propertyName, measureOfValue);
    }
  }

  setupClassyBrew_usingFeatureCount(valuesArray, colorCode, classifyMethod, maxNumberOfClasses) {
    if (!maxNumberOfClasses) {
      maxNumberOfClasses = 5;
    }

    const tempBrew = this.createNewClassyBrewInstance();
    let colorBrewerInstance = this.createNewClassyBrewInstance();

    if (valuesArray.length >= 5) {
      // pass array to our classyBrew series
      tempBrew.setSeries(valuesArray);
      // define number of classes
      tempBrew.setNumClasses(maxNumberOfClasses);
      // set color ramp code
      tempBrew.setColorCode(colorCode);
      // classify by passing in statistical method
      // i.e. equal_interval, jenks, quantile

      tempBrew.classify(classifyMethod);

      colorBrewerInstance.colors = tempBrew.getColors();
      colorBrewerInstance.breaks = tempBrew.getBreaks();

      if (tempBrew.numClasses == 2) {
        colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
        colorBrewerInstance.colors.shift();
      }
      if (tempBrew.numClasses == 1) {
        colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
        colorBrewerInstance.colors.shift();
        colorBrewerInstance.colors.shift();
      }
    } else if (valuesArray.length === 4) {
      valuesArray.sort((a, b) => a - b);

      colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['4'];
      colorBrewerInstance.breaks = valuesArray;
    } else if (valuesArray.length === 3) {
      valuesArray.sort((a, b) => a - b);

      colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
      colorBrewerInstance.breaks = valuesArray;
    } else if (valuesArray.length === 2) {
      valuesArray.sort((a, b) => a - b);

      colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
      colorBrewerInstance.breaks = valuesArray;

      colorBrewerInstance.colors.shift(); // remove first element of array
    } else if (valuesArray.length === 1) {
      valuesArray.sort((a, b) => a - b);

      colorBrewerInstance.colors = tempBrew.colorSchemes[colorCode]['3'];
      colorBrewerInstance.breaks = valuesArray;

      colorBrewerInstance.colors.shift(); // remove first element of array
      colorBrewerInstance.colors.shift(); // remove first element of array
    } else {
      // no positive values
      colorBrewerInstance = undefined;
    }

    // round values
    if (colorBrewerInstance && colorBrewerInstance.breaks) {
      for (let index = 0; index < colorBrewerInstance.breaks.length; index++) {
        colorBrewerInstance.breaks[index] = this.getIndicatorValue_asNumber(
          colorBrewerInstance.breaks[index]
        );
      }
    }
    return colorBrewerInstance;
  }

  setupGtMeasureOfValueBrew(
    greaterThanValues,
    colorCodeForGreaterThanValues,
    classifyMethod,
    numClasses
  ) {
    return this.setupClassyBrew_usingFeatureCount(
      greaterThanValues,
      colorCodeForGreaterThanValues,
      classifyMethod,
      numClasses
    );
  }

  setupLtMeasureOfValueBrew(
    lesserThanValues,
    colorCodeForLesserThanValues,
    classifyMethod,
    numClasses
  ) {
    const brew = this.setupClassyBrew_usingFeatureCount(
      lesserThanValues,
      colorCodeForLesserThanValues,
      classifyMethod,
      numClasses
    );
    if (brew && brew.colors && brew.colors.length > 1) {
      brew.colors = brew.colors.reverse();
    }
    return brew;
  }

  /**
   * Returns and array of color brewer instances for dynamic increase and decrease colors
   *
   * [dynamicIncreaseBrew, dynamicDecreaseBrew]
   */
  setupDynamicIndicatorBrew(
    geoJSON,
    propertyName,
    colorCodeForPositiveValues,
    colorCodeForNegativeValues,
    classifyMethod,
    numClasses,
    breaks
  ) {
    /*
    * Idea: Analyse the complete geoJSON property array for each feature and make conclusion about how to build the legend

    e.g. if there are only positive values then display only positive values within 5 categories - same for only negative values

    e.g. if there are equally many positive as negative values then display both using 3 categories each

    e.g. if there are way more positive than negative values, then display both with 2 (negative) and 4 (positive) classes

    --> implement special cases (0, 1 or 2 negative/positive values --> apply colors manually)
    --> treat all other cases equally to measureOfValue
    */

    this.classificationState.resetFeatureCounters();

    this.positiveValues = [];
    this.negativeValues = [];

    if (this.envConfigService.classifyUsingWholeTimeseries) {
      this.setupDynamicBrewValues_wholeTimeseries(geoJSON);
    } else {
      this.setupDynamicBrewValues_singleTimestamp(geoJSON, propertyName);
    }

    let dynamicIncreaseBrew = this.setupDynamicIncreaseBrew(
      this.positiveValues,
      colorCodeForPositiveValues,
      classifyMethod,
      Math.ceil(numClasses / 2)
    );
    let dynamicDecreaseBrew = this.setupDynamicDecreaseBrew(
      this.negativeValues,
      colorCodeForNegativeValues,
      classifyMethod,
      Math.floor(numClasses / 2)
    );

    if (classifyMethod == 'manual') {
      if (!breaks || breaks.length == 0) {
        breaks = [];
        breaks[0] = dynamicIncreaseBrew ? dynamicIncreaseBrew.breaks : [];
        breaks[1] = dynamicDecreaseBrew ? dynamicDecreaseBrew.breaks : [];
      }
      dynamicIncreaseBrew = this.setupManualBrew(
        breaks[0].length - 1,
        colorCodeForPositiveValues,
        breaks[0]
      );
      dynamicDecreaseBrew = this.setupManualBrew(
        breaks[1].length - 1,
        colorCodeForNegativeValues,
        breaks[1]
      );
      dynamicDecreaseBrew.colors = dynamicDecreaseBrew.colors.reverse();
    }

    this.classificationState.dynamicBrew = [dynamicIncreaseBrew, dynamicDecreaseBrew];

    return this.classificationState.dynamicBrew;
  }

  setupDynamicBrewValues_wholeTimeseries(geoJSON) {
    const indicatorTimeSeriesDatesArray = this.selectionState.selectedIndicator.applicableDates;

    for (const date of indicatorTimeSeriesDatesArray) {
      const propertyName = this.envConfigService.indicatorDatePrefix + date;
      this.setupDynamicBrewValues_singleTimestamp(geoJSON, propertyName);
    }
  }

  setupDynamicBrewValues_singleTimestamp(geoJSON, propertyName) {
    for (const feature of geoJSON.features) {
      if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[propertyName]))
        continue;

      if (
        this.envConfigService.classifyZeroSeparately &&
        this.getIndicatorValue_asNumber(feature.properties[propertyName]) == 0
      ) {
        continue;
      }

      // check if is outlier, then do not use within classification, as it will be marked on map with special color
      if (
        feature.properties[this.outlierPropertyName] &&
        feature.properties[this.outlierPropertyName] !== this.outlierPropertyValue_no &&
        this.envConfigService.useOutlierDetectionOnIndicator
      ) {
        continue;
      } else if (this.getIndicatorValue_asNumber(feature.properties[propertyName]) >= 0) {
        if (
          !this.positiveValues.includes(
            this.getIndicatorValue_asNumber(feature.properties[propertyName])
          )
        ) {
          this.positiveValues.push(
            this.getIndicatorValue_asNumber(feature.properties[propertyName])
          );
        }
      } else if (this.getIndicatorValue_asNumber(feature.properties[propertyName]) < 0) {
        if (
          !this.negativeValues.includes(
            this.getIndicatorValue_asNumber(feature.properties[propertyName])
          )
        ) {
          this.negativeValues.push(
            this.getIndicatorValue_asNumber(feature.properties[propertyName])
          );
        }
      }
    }
  }

  setupDynamicIncreaseBrew(positiveValues, colorCodeForPositiveValues, classifyMethod, numClasses) {
    return this.setupClassyBrew_usingFeatureCount(
      positiveValues,
      colorCodeForPositiveValues,
      classifyMethod,
      numClasses
    );
  }

  setupDynamicDecreaseBrew(negativeValues, colorCodeForNegativeValues, classifyMethod, numClasses) {
    const brew = this.setupClassyBrew_usingFeatureCount(
      negativeValues,
      colorCodeForNegativeValues,
      classifyMethod,
      numClasses
    );
    if (brew && brew.colors && brew.colors.length > 1) {
      brew.colors = brew.colors.reverse();
    }
    return brew;
  }

  styleNoData(feature, incrementFeatures) {
    if (incrementFeatures) {
      this.classificationState.featuresPerNoData++;
    }
    return this.noDataStyle;
  }

  styleOutlier(feature, incrementFeatures) {
    if (
      feature.properties[this.outlierPropertyName] === this.outlierPropertyValue_low_soft ||
      feature.properties[this.outlierPropertyName] === this.outlierPropertyValue_low_extreme
    ) {
      if (incrementFeatures) {
        this.classificationState.featuresPerOutlierLow++;
      }
      return this.outlierStyle_low;
    } else {
      if (incrementFeatures) {
        this.classificationState.featuresPerOutlierHigh++;
      }
      return this.outlierStyle_high;
    }
  }

  getOpacity(_opacity) {
    return this.defaultFillOpacity;
  }

  setOpacity(opacity) {
    opacity = Number(opacity);
    this.indicatorTransparency = Number((1 - opacity).toFixed(this.numberOfDecimals));
    this.classificationState.currentIndicatorOpacity = opacity;

    this.defaultFillOpacity = opacity;
    this.defaultFillOpacityForOutliers_low = opacity;
    this.defaultFillOpacityForOutliers_high = opacity;
    this.defaultFillOpacityForZeroFeatures = opacity;
    this.defaultFillOpacityForNoDataValues = opacity;
    this.defaultFillOpacityForFilteredFeatures = opacity;
  }

  /**
   * Builds the standard Leaflet path style shared by the classified-feature
   * styles. `opacity` defaults to `fillOpacity` to preserve styleDefault's
   * original behavior; callers wanting a fixed border opacity pass it explicitly.
   */
  private buildIndicatorStyle(fillColor, fillOpacity, opacity = fillOpacity) {
    return {
      weight: 1,
      opacity,
      color: this.selectionState.selectedSpatialUnitIsRaster()
        ? undefined
        : this.defaultBorderColor,
      dashArray: '',
      fillOpacity,
      fillColor,
      fillPattern: undefined,
    };
  }

  styleDefault(
    feature,
    defaultBrew,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    propertyName,
    useTransparencyOnIndicator,
    datasetContainsNegativeValues,
    incrementFeatures
  ) {
    // check if feature is NoData
    if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[propertyName])) {
      return this.styleNoData(feature, incrementFeatures);
    }

    // check if feature is outlier
    if (
      feature.properties[this.outlierPropertyName] !== this.outlierPropertyValue_no &&
      this.envConfigService.useOutlierDetectionOnIndicator
    ) {
      return this.styleOutlier(feature, incrementFeatures);
    }

    let fillOpacity = useTransparencyOnIndicator ? this.defaultFillOpacity : 1;
    const value = this.getIndicatorValue_asNumber(feature.properties[propertyName]);

    let fillColor;
    if (this.envConfigService.classifyZeroSeparately && value == 0) {
      fillColor = this.getFillColorForZero(incrementFeatures);
      if (useTransparencyOnIndicator) {
        fillOpacity = this.defaultFillOpacityForZeroFeatures;
      }
    } else {
      // With negative values present, positives and negatives use separate
      // brews (the decrease brew has its colors inverted at setup, so the
      // lowest values become strong-colored); otherwise the single default brew.
      const brew = datasetContainsNegativeValues
        ? value >= 0
          ? dynamicIncreaseBrew
          : dynamicDecreaseBrew
        : defaultBrew;
      fillColor = this.findColorInRange(feature, propertyName, brew, incrementFeatures);
    }

    return this.buildIndicatorStyle(fillColor, fillOpacity);
  }

  /**
   * Styles a feature of a qualitative (categorical) indicator: its fill color is
   * the color of the category whose `categoricalValue` matches the feature's raw
   * property value. Values matching no category fall into the shared "other"
   * bucket ({@link CATEGORICAL_OTHER_COLOR}). NoData values keep the standard
   * NoData style. In every case the resulting color is counted into
   * `featuresPerColorMap`, which the legend reads for the per-category count.
   *
   * Unlike the numeric styles this does not go through `resolveClassColor`
   * (which requires a numeric value) — categories are matched as strings.
   */
  styleCategorical(
    feature,
    categoricalData: CategoricalClassificationItem[],
    propertyName,
    useTransparencyOnIndicator,
    incrementFeatures
  ) {
    // check if feature is NoData
    if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[propertyName])) {
      return this.styleNoData(feature, incrementFeatures);
    }

    const fillOpacity = useTransparencyOnIndicator ? this.defaultFillOpacity : 1;
    const color = this.resolveCategoricalColor(feature.properties[propertyName], categoricalData);

    if (incrementFeatures) {
      this.classificationState.incrementFeaturesPerColor(color);
    }

    return this.buildIndicatorStyle(color, fillOpacity);
  }

  /**
   * Resolves the fill color for a categorical feature value by matching it against
   * the category definitions (normalized string comparison), returning the shared
   * "other" color when nothing matches.
   */
  private resolveCategoricalColor(value, categoricalData: CategoricalClassificationItem[]): string {
    const normalized = String(value).trim();
    const match = categoricalData?.find(
      (category) => String(category.categoricalValue).trim() === normalized
    );
    return match?.color ?? CATEGORICAL_OTHER_COLOR;
  }

  private findColorInRange(feature, propertyName, colorBrewInstance, incrementFeatures) {
    const value = this.getIndicatorValue_asNumber(feature.properties[propertyName]);
    const color = this.resolveClassColor(value, colorBrewInstance);

    if (incrementFeatures) {
      this.classificationState.incrementFeaturesPerColor(color);
    }

    return color;
  }

  private resolveClassColor(value, colorBrewInstance) {
    const colors = colorBrewInstance?.colors;
    const breaks = colorBrewInstance?.breaks;
    if (!colors?.length || !breaks?.length || typeof value !== 'number') {
      return undefined;
    }

    const lastColorIndex = colors.length - 1;

    // Below the smallest break -> lowest class.
    if (value < this.getIndicatorValue_asNumber(breaks[0])) {
      return colors[0];
    }

    // First half-open interval [breaks[i], breaks[i + 1]) that contains value.
    for (let index = 0; index < breaks.length - 1; index++) {
      if (value < this.getIndicatorValue_asNumber(breaks[index + 1])) {
        return colors[Math.min(index, lastColorIndex)];
      }
    }
    // At or above the largest break -> highest class.
    return colors[lastColorIndex];
  }

  // this.findColorInRange_invertedColorGradient (feature, propertyName, colorBrewInstance){
  //   var color;

  //   for (var k = 0; k < colorBrewInstance.breaks.length; k++) {
  //     if (this.getIndicatorValue_asNumber(feature.properties[propertyName]) == this.getIndicatorValue_asNumber(colorBrewInstance.breaks[k])) {
  //       if (k < colorBrewInstance.breaks.length - 1) {
  //         // min value
  //         color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
  //         break;
  //       }
  //       else {
  //         //max value
  //         if (colorBrewInstance.colors[colorBrewInstance.colors.length - k]) {
  //           color = colorBrewInstance.colors[colorBrewInstance.colors.length - k];
  //         }
  //         else {
  //           color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
  //         }
  //         break;
  //       }
  //     }
  //     else {
  //       if (this.getIndicatorValue_asNumber(feature.properties[propertyName]) < this.getIndicatorValue_asNumber(colorBrewInstance.breaks[k + 1])) {
  //         color = colorBrewInstance.colors[colorBrewInstance.colors.length - k - 1];
  //         break;
  //       }
  //     }
  //   }

  //   this.incrementFeaturesPerColor(color);

  //   return color;
  // };

  styleMeasureOfValue(
    feature,
    gtMeasureOfValueBrew,
    ltMeasureOfValueBrew,
    propertyName,
    useTransparencyOnIndicator,
    incrementFeatures
  ) {
    // check if feature is NoData
    if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[propertyName])) {
      return this.styleNoData(feature, incrementFeatures);
    }

    // check if feature is outlier
    if (
      feature.properties[this.outlierPropertyName] !== this.outlierPropertyValue_no &&
      this.envConfigService.useOutlierDetectionOnIndicator
    ) {
      return this.styleOutlier(feature, incrementFeatures);
    }

    let fillOpacity = useTransparencyOnIndicator ? this.defaultFillOpacity : 1;
    const value = this.getIndicatorValue_asNumber(feature.properties[propertyName]);

    let fillColor;
    if (this.envConfigService.classifyZeroSeparately && value == 0) {
      fillColor = this.getFillColorForZero(incrementFeatures);
      if (useTransparencyOnIndicator) {
        fillOpacity = this.defaultFillOpacityForZeroFeatures;
      }
    } else {
      // At/above the measure of value uses the "greater-than" brew; below it the
      // "lesser-than" brew (its colors inverted at setup, so the lowest values
      // become strong-colored).
      const brew =
        value >= this.chartDisplayState.measureOfValue
          ? gtMeasureOfValueBrew
          : ltMeasureOfValueBrew;
      fillColor = this.findColorInRange(feature, propertyName, brew, incrementFeatures);
    }

    return this.buildIndicatorStyle(fillColor, fillOpacity, 1);
  }

  styleDynamicIndicator(
    feature,
    dynamicIncreaseBrew,
    dynamicDecreaseBrew,
    propertyName,
    useTransparencyOnIndicator,
    incrementFeatures
  ) {
    // check if feature is NoData
    if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[propertyName])) {
      return this.styleNoData(feature, incrementFeatures);
    }

    // check if feature is outlier
    if (
      feature.properties[this.outlierPropertyName] !== this.outlierPropertyValue_no &&
      this.envConfigService.useOutlierDetectionOnIndicator
    ) {
      return this.styleOutlier(feature, incrementFeatures);
    }

    let fillOpacity = useTransparencyOnIndicator ? this.defaultFillOpacity : 1;
    const value = this.getIndicatorValue_asNumber(feature.properties[propertyName]);

    let fillColor;
    if (this.envConfigService.classifyZeroSeparately && value == 0) {
      fillColor = this.getFillColorForZero(incrementFeatures);
      if (useTransparencyOnIndicator) {
        fillOpacity = this.defaultFillOpacityForZeroFeatures;
      }
    } else {
      // Non-negative values use the increase brew; negative values the decrease
      // brew (its colors inverted at setup, so the lowest values become
      // strong-colored).
      const brew = value >= 0 ? dynamicIncreaseBrew : dynamicDecreaseBrew;
      fillColor = this.findColorInRange(feature, propertyName, brew, incrementFeatures);
    }

    return this.buildIndicatorStyle(fillColor, fillOpacity, 1);
  }
}
