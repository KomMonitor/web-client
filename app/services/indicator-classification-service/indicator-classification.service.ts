import { Injectable, inject } from '@angular/core';
import {
  CategoricalClassificationItem,
  isQualitativeMapping,
} from 'components/ngComponents/models/classification.models';
import jStat from 'jstat';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { ClassificationStateService } from 'services/classification-state-service/classification-state.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';

export type ClassificationMode = 'replace' | 'restyle';

export interface ClassificationInput {
  mode: ClassificationMode;
  /**
   * Mutated in place: NoData values are set to null (replace only), an outlier
   * property is stamped on every feature, and for raster spatial units the
   * NoData features are removed from the feature array (replace only).
   */
  indicatorMetadataAndGeoJSON: any;
  /** Fully qualified feature property holding the indicator value (date prefix + date). */
  indicatorPropertyName: string;
  /**
   * The indicator type of the currently displayed layer (a string such as
   * 'STATUS_ABSOLUTE'). Required for 'restyle' (the layer may show a computed
   * dataset); ignored for 'replace', which reads the type from the metadata.
   */
  indicatorType?: string | string[];
  /**
   * Carry-over of the negative-values flag from the previous render. Branches
   * that do not recompute it (e.g. the measure-of-value branch) keep this
   * value, mirroring the stale-field semantics of the legacy implementation.
   */
  datasetContainsNegativeValues?: boolean;
}

export interface IndicatorDataFacts {
  containsZeroValues: boolean;
  containsNoDataValues: boolean;
  containsOutliers_high: boolean;
  containsOutliers_low: boolean;
  outliers_high: any[];
  outliers_low: any[];
}

export interface ClassificationResult {
  defaultBrew: any;
  manualBrew: any;
  gtMeasureOfValueBrew: any;
  ltMeasureOfValueBrew: any;
  dynamicIncreaseBrew: any;
  dynamicDecreaseBrew: any;
  datasetContainsNegativeValues: boolean;
  facts: IndicatorDataFacts;
  isCategorical: boolean;
  categoricalData: CategoricalClassificationItem[];
  /** Complete Leaflet style for a feature: tempData prep + filtered check + branch style. */
  styleFor(feature: any): any;
}

/** Which style function the pipeline selected for the current render. */
type StyleBranch = 'mov' | 'default' | 'manual-default' | 'dynamic' | 'categorical';

/**
 * Single classification pipeline for the main-map indicator layer.
 *
 * Consolidates the formerly duplicated brew/classification/styling logic of
 * KommonitorMapComponent._replaceIndicatorLayer and .restyleCurrentLayer into
 * one implementation. Mode divergences of the two legacy code paths are kept
 * as explicit `mode === …` branches and commented in place.
 *
 * The service deliberately keeps using the shared mutable state of
 * VisualStyleHelperServiceNew (classifyMethod, numClasses, breaks, brews) —
 * the classification component and the legend read those fields directly.
 * Migrating that state is out of scope here (see MAP_REFACTORING_PLAN.md,
 * Phase 2b).
 */
@Injectable({
  providedIn: 'root',
})
export class IndicatorClassificationService {
  private visualStyleHelperService = inject(VisualStyleHelperServiceNew);
  private classificationState = inject(ClassificationStateService);
  private envConfigService = inject(EnvConfigService);
  private chartDisplayState = inject(ChartDisplayStateService);
  private selectionState = inject(SelectionStateService);
  private filterHelperService = inject(FilterHelperService);
  private indicatorValueService = inject(IndicatorValueService);

  private classifyZeroSeparately_backup: any;

  buildClassification(input: ClassificationInput): ClassificationResult {
    const vsh = this.visualStyleHelperService;
    const state = this.classificationState;
    const { mode, indicatorMetadataAndGeoJSON, indicatorPropertyName } = input;
    const indicatorType =
      mode === 'replace' ? indicatorMetadataAndGeoJSON.indicatorType : input.indicatorType || [];

    let defaultBrew: any = undefined;
    let manualBrew: any = undefined;
    let gtMeasureOfValueBrew: any = undefined;
    let ltMeasureOfValueBrew: any = undefined;
    let dynamicIncreaseBrew: any = undefined;
    let dynamicDecreaseBrew: any = undefined;
    // stale carry-over unless a branch below recomputes it (legacy semantics)
    let datasetContainsNegativeValues = !!input.datasetContainsNegativeValues;
    let styleBranch: StyleBranch = 'default';
    let categoricalData: CategoricalClassificationItem[] = [];

    // Qualitative (categorical) indicators are colored per category, independent of
    // the numeric MOV/dynamic/negative branches. Detect it up front so the numeric
    // regional-default / brew setup (which assumes numeric mapping fields such as
    // `items`) is skipped, and so the categorical branch wins regardless of the
    // MOV/balance toggles.
    const mapping = indicatorMetadataAndGeoJSON.defaultClassificationMapping;
    const isCategorical = isQualitativeMapping(mapping);
    if (isCategorical) {
      styleBranch = 'categorical';
      categoricalData = mapping?.categoricalData ?? [];
    }

    if (mode === 'replace') {
      // reset the shared classification state before any brew setup
      // (order preserved from the legacy replace path)
      state.manualMOVBreaks = [];
      state.regionalDefaultMOVBreaks = [];
      state.regionalDefaultBreaks = [];
      state.measureOfValueBrew = [];
      state.manualBrew = undefined;
      state.dynamicBrew = undefined;
      state.dynamicBrewBreaks = [];

      this.setNoDataValuesAsNull(indicatorMetadataAndGeoJSON, indicatorPropertyName);
    } else {
      // restyle evaluates the zero handling before a potential
      // regional_default fallback in checkAvailabilityOfRegionalDefault
      this.setClassifyZeroForClassifyMethod();
    }

    // identify and mark outliers prior to setting up of styling
    // in styling methods, outliers should be removed from classification!
    const facts = this.markOutliers(indicatorMetadataAndGeoJSON, indicatorPropertyName);
    this.scanForZeroAndNoDataValues(indicatorMetadataAndGeoJSON, indicatorPropertyName, facts);

    if (mode === 'replace') {
      // Raster special treatment: improve raster display by eliminating
      // NoData cells (their border is omitted in the styling methods)
      if (this.selectionState.selectedSpatialUnitIsRaster()) {
        indicatorMetadataAndGeoJSON.geoJSON.features =
          indicatorMetadataAndGeoJSON.geoJSON.features.filter(
            (feature) =>
              !this.indicatorValueService.indicatorValueIsNoData(
                feature.properties[indicatorPropertyName]
              )
          );
      }

      this.applyDefaultClassificationSettings(indicatorMetadataAndGeoJSON);
    }

    // Regional-default availability is a numeric-classification concern and reads
    // `mapping.items` (absent on categorical mappings); skip it for categorical.
    if (!isCategorical) {
      this.checkAvailabilityOfRegionalDefault(indicatorMetadataAndGeoJSON);
    }

    if (mode === 'replace') {
      this.setClassifyZeroForClassifyMethod();
    }

    const geoJSON = indicatorMetadataAndGeoJSON.geoJSON;
    const isDynamicOrNegative = () =>
      indicatorType.includes('DYNAMIC') || datasetContainsNegativeValues;

    if (isCategorical) {
      // No numeric brews to build; styling happens per category in styleFor. The
      // numeric setup*Brew calls normally reset the feature counters, so reset here
      // explicitly before styleFor recounts features per category color.
      state.resetFeatureCounters();
    } else if (this.chartDisplayState.isMeasureOfValueChecked) {
      styleBranch = 'mov';

      const measureOfValueBrewArray = vsh.setupMeasureOfValueBrew(
        geoJSON,
        indicatorPropertyName,
        this.envConfigService.defaultColorBrewerPaletteForGtMovValues,
        this.envConfigService.defaultColorBrewerPaletteForLtMovValues,
        state.classifyMethod,
        this.chartDisplayState.measureOfValue,
        state.manualMOVBreaks,
        state.regionalDefaultMOVBreaks,
        state.numClasses
      );
      gtMeasureOfValueBrew = measureOfValueBrewArray[0];
      ltMeasureOfValueBrew = measureOfValueBrewArray[1];

      if (mode === 'replace') {
        // replace refills the MOV breaks from the fresh brews and syncs them
        // back into the manual breaks unconditionally
        state.manualMOVBreaks = [];
        state.manualMOVBreaks[0] = measureOfValueBrewArray[0]
          ? measureOfValueBrewArray[0].breaks
          : [];
        state.manualMOVBreaks[1] = measureOfValueBrewArray[1]
          ? measureOfValueBrewArray[1].breaks
          : [];
        this.updateDefaultManualBreaksFromMOVManualBreaks(isDynamicOrNegative());

        if (indicatorType.includes('DYNAMIC')) {
          const dynamicIndicatorBrewArray = vsh.setupDynamicIndicatorBrew(
            geoJSON,
            indicatorPropertyName,
            this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
            this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
            state.classifyMethod,
            state.numClasses,
            []
          );
          dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
          dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
          this.updateDefaultManualBreaksFromMOVManualBreaks(isDynamicOrNegative());
        }
      } else if (state.classifyMethod == 'manual') {
        // restyle keeps the existing MOV breaks and only syncs for manual mode
        this.updateDefaultManualBreaksFromMOVManualBreaks(isDynamicOrNegative());
      }
    } else if (mode === 'replace') {
      if (indicatorType.includes('STATUS')) {
        datasetContainsNegativeValues = this.containsNegativeValues(geoJSON, indicatorPropertyName);
        if (datasetContainsNegativeValues) {
          const dynamicIndicatorBrewArray = vsh.setupDynamicIndicatorBrew(
            geoJSON,
            indicatorPropertyName,
            this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
            this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
            state.classifyMethod,
            state.numClasses,
            state.dynamicBrewBreaks
          );
          dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
          dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
        } else {
          defaultBrew = vsh.setupDefaultBrew(
            geoJSON,
            indicatorPropertyName,
            indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses || 5,
            indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
            state.classifyMethod
          );
        }
        if (state.classifyMethod == 'regional_default') {
          ({ defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew } =
            this.applyRegionalDefaultClassification(indicatorMetadataAndGeoJSON, {
              defaultBrew,
              dynamicIncreaseBrew,
              dynamicDecreaseBrew,
            }));
        }
        state.manualBrew = defaultBrew;
        styleBranch = 'default';
      } else if (indicatorType.includes('DYNAMIC')) {
        const dynamicIndicatorBrewArray = vsh.setupDynamicIndicatorBrew(
          geoJSON,
          indicatorPropertyName,
          this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
          this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
          state.classifyMethod,
          state.numClasses,
          state.dynamicBrewBreaks
        );
        dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
        dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
        styleBranch = 'dynamic';
      }

      this.updateManualMOVBreaksFromDefaultManualBreaks(isDynamicOrNegative());
    } else {
      // restyle, no measure of value
      if (indicatorType.includes('DYNAMIC') || datasetContainsNegativeValues) {
        const dynamicIndicatorBrewArray = vsh.setupDynamicIndicatorBrew(
          geoJSON,
          indicatorPropertyName,
          this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
          this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
          state.classifyMethod,
          state.numClasses,
          state.dynamicBrewBreaks
        );
        dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
        dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];

        if (state.classifyMethod == 'regional_default') {
          ({ defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew } =
            this.applyRegionalDefaultClassification(indicatorMetadataAndGeoJSON, {
              defaultBrew,
              dynamicIncreaseBrew,
              dynamicDecreaseBrew,
            }));
        }
        styleBranch = 'dynamic';
      } else {
        datasetContainsNegativeValues = this.containsNegativeValues(geoJSON, indicatorPropertyName);
        if (datasetContainsNegativeValues) {
          const dynamicIndicatorBrewArray = vsh.setupDynamicIndicatorBrew(
            geoJSON,
            indicatorPropertyName,
            this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
            this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
            state.classifyMethod,
            state.numClasses,
            state.dynamicBrewBreaks
          );
          dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
          dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
        } else {
          // restyle uses the (possibly user-changed) shared numClasses,
          // replace uses the metadata default — do not unify
          defaultBrew = vsh.setupDefaultBrew(
            geoJSON,
            indicatorPropertyName,
            state.numClasses,
            indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
            state.classifyMethod
          );
        }

        if (state.classifyMethod == 'regional_default') {
          ({ defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew } =
            this.applyRegionalDefaultClassification(indicatorMetadataAndGeoJSON, {
              defaultBrew,
              dynamicIncreaseBrew,
              dynamicDecreaseBrew,
            }));
        } else if (state.classifyMethod == 'manual') {
          manualBrew = vsh.setupManualBrew(
            state.numClasses,
            indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
            state.manualBrew.breaks
          );
          state.manualBrew = manualBrew;
        }

        styleBranch = state.classifyMethod == 'manual' ? 'manual-default' : 'default';

        this.updateManualMOVBreaksFromDefaultManualBreaks(isDynamicOrNegative());
      }
    }

    if (
      !isCategorical &&
      state.classifyMethod == 'regional_default' &&
      this.chartDisplayState.isMeasureOfValueChecked
    ) {
      if (mode === 'restyle' && state.regionalDefaultBreaks.length == 0) {
        // restyle-only bootstrap: derive the regional default breaks first
        defaultBrew = vsh.setupDefaultBrew(
          geoJSON,
          indicatorPropertyName,
          state.numClasses,
          indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
          state.classifyMethod
        );
        ({ defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew } =
          this.applyRegionalDefaultClassification(indicatorMetadataAndGeoJSON, {
            defaultBrew,
            dynamicIncreaseBrew,
            dynamicDecreaseBrew,
          }));
      }

      state.regionalDefaultMOVBreaks = this.calcMOVBreaks(
        state.regionalDefaultBreaks,
        this.chartDisplayState.measureOfValue
      );
      const measureOfValueBrewArray = vsh.setupMeasureOfValueBrew(
        geoJSON,
        indicatorPropertyName,
        this.envConfigService.defaultColorBrewerPaletteForGtMovValues,
        this.envConfigService.defaultColorBrewerPaletteForLtMovValues,
        state.classifyMethod,
        this.chartDisplayState.measureOfValue,
        state.manualMOVBreaks,
        state.regionalDefaultMOVBreaks,
        state.numClasses
      );
      gtMeasureOfValueBrew = measureOfValueBrewArray[0];
      ltMeasureOfValueBrew = measureOfValueBrewArray[1];
      styleBranch = 'mov';
    }

    const styleFor = (feature: any) => {
      feature = this.prepFeatureModelForMapUse(feature, indicatorPropertyName);

      if (
        this.filterHelperService.featureIsCurrentlyFiltered(
          feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
        )
      ) {
        return vsh.filteredStyle;
      }

      switch (styleBranch) {
        case 'categorical':
          return vsh.styleCategorical(
            feature,
            categoricalData,
            indicatorPropertyName,
            this.envConfigService.useTransparencyOnIndicator,
            true
          );
        case 'mov':
          return vsh.styleMeasureOfValue(
            feature,
            gtMeasureOfValueBrew,
            ltMeasureOfValueBrew,
            indicatorPropertyName,
            this.envConfigService.useTransparencyOnIndicator,
            true
          );
        case 'dynamic':
          return vsh.styleDynamicIndicator(
            feature,
            dynamicIncreaseBrew,
            dynamicDecreaseBrew,
            indicatorPropertyName,
            this.envConfigService.useTransparencyOnIndicator,
            true
          );
        case 'manual-default':
          return vsh.styleDefault(
            feature,
            manualBrew,
            dynamicIncreaseBrew,
            dynamicDecreaseBrew,
            indicatorPropertyName,
            this.envConfigService.useTransparencyOnIndicator,
            datasetContainsNegativeValues,
            true
          );
        default:
          return vsh.styleDefault(
            feature,
            defaultBrew,
            dynamicIncreaseBrew,
            dynamicDecreaseBrew,
            indicatorPropertyName,
            this.envConfigService.useTransparencyOnIndicator,
            datasetContainsNegativeValues,
            true
          );
      }
    };

    return {
      defaultBrew,
      manualBrew,
      gtMeasureOfValueBrew,
      ltMeasureOfValueBrew,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      datasetContainsNegativeValues,
      facts,
      isCategorical,
      categoricalData,
      styleFor,
    };
  }

  /**
   * Splits the manual breaks into gt/lt halves around the current measure of
   * value and stores them as the shared manual MOV breaks. Public because the
   * classification controls (changeBreaks/changeDynamicBreaks and the
   * time-setup flow) trigger this outside of a full pipeline run.
   *
   * @param isDynamicOrNegative whether the current layer is a DYNAMIC
   *   indicator or contains negative values (callers pass their cached
   *   layer context)
   */
  updateManualMOVBreaksFromDefaultManualBreaks(isDynamicOrNegative: boolean) {
    const state = this.classificationState;
    const gtBreaks: any[] = [];
    const ltBreaks: any[] = [];
    let breaks: any[] = [];

    if (isDynamicOrNegative) {
      // Legacy behavior kept 1:1: the recombined dynamic breaks were computed
      // into a shadowed variable and never used, so the MOV breaks are derived
      // from an empty list in the dynamic/negative case. Fixing this would
      // silently change the MOV break derivation for dynamic indicators.
      // TODO revisit deliberately (see MAP_REFACTORING_PLAN.md).
    } else {
      breaks = state.manualBrew ? state.manualBrew.breaks : [];
    }
    breaks.forEach((br) => {
      if (br < this.chartDisplayState.measureOfValue) {
        gtBreaks.push(br);
      } else {
        ltBreaks.push(br);
      }
    });
    gtBreaks.push(this.chartDisplayState.measureOfValue);
    ltBreaks.unshift(this.chartDisplayState.measureOfValue);
    state.manualMOVBreaks = [];
    state.manualMOVBreaks[0] = ltBreaks;
    state.manualMOVBreaks[1] = gtBreaks;
  }

  /** Inverse of updateManualMOVBreaksFromDefaultManualBreaks: recombines the MOV break halves into the shared manual/dynamic breaks. */
  private updateDefaultManualBreaksFromMOVManualBreaks(isDynamicOrNegative: boolean) {
    const state = this.classificationState;
    const ltBreaks = [...state.manualMOVBreaks[0]];
    const gtBreaks = [...state.manualMOVBreaks[1]];

    ltBreaks.shift();
    gtBreaks.pop();

    if (isDynamicOrNegative) {
      const decreaseBreaks: any[] = [];
      const increaseBreaks: any[] = [];
      gtBreaks.forEach((br) => {
        if (br < 0) {
          decreaseBreaks.push(br);
        } else {
          increaseBreaks.push(br);
        }
      });
      ltBreaks.forEach((br) => {
        if (br < 0) {
          decreaseBreaks.push(br);
        } else {
          increaseBreaks.push(br);
        }
      });
      state.dynamicBrewBreaks = [[...increaseBreaks], [...decreaseBreaks]];
    }

    // no-op on a fresh replace where the shared manualBrew is still undefined
    // (the legacy code wrote into it unconditionally — latent TypeError)
    state.setManualBreaks([...gtBreaks, ...ltBreaks]);
  }

  private markOutliers(indicatorMetadataAndGeoJSON, indicatorPropertyName): IndicatorDataFacts {
    const vsh = this.visualStyleHelperService;
    const facts: IndicatorDataFacts = {
      containsZeroValues: false,
      containsNoDataValues: false,
      containsOutliers_high: false,
      containsOutliers_low: false,
      outliers_high: [],
      outliers_low: [],
    };

    const valueArray: any[] = [];
    indicatorMetadataAndGeoJSON.geoJSON.features.forEach((feature) => {
      if (
        !this.indicatorValueService.indicatorValueIsNoData(
          feature.properties[indicatorPropertyName]
        )
      ) {
        if (!valueArray.includes(feature.properties[indicatorPropertyName])) {
          valueArray.push(feature.properties[indicatorPropertyName]);
        }
      }
    });

    // https://jstat.github.io/all.html#quartiles
    const quartiles = jStat.quartiles(valueArray);
    const quartile_25 = quartiles[0];
    const quartile_75 = quartiles[2];

    const diff = quartile_75 - quartile_25;
    const whiskerRange_outliers_extreme = diff * 3;

    const whisker_low_extreme = quartile_25 - whiskerRange_outliers_extreme;
    const whisker_high_extreme = quartile_75 + whiskerRange_outliers_extreme;

    // for now only mark extreme outliers!
    indicatorMetadataAndGeoJSON.geoJSON.features.forEach((feature) => {
      // compare feature value to whiskers and set property
      if (
        this.indicatorValueService.indicatorValueIsNoData(feature.properties[indicatorPropertyName])
      ) {
        feature.properties[vsh.outlierPropertyName] = vsh.outlierPropertyValue_no;
      } else if (feature.properties[indicatorPropertyName] < whisker_low_extreme) {
        feature.properties[vsh.outlierPropertyName] = vsh.outlierPropertyValue_low_extreme;
        facts.containsOutliers_low = true;
        facts.outliers_low.push(feature.properties[indicatorPropertyName]);
      } else if (feature.properties[indicatorPropertyName] > whisker_high_extreme) {
        feature.properties[vsh.outlierPropertyName] = vsh.outlierPropertyValue_high_extreme;
        facts.containsOutliers_high = true;
        facts.outliers_high.push(feature.properties[indicatorPropertyName]);
      } else {
        feature.properties[vsh.outlierPropertyName] = vsh.outlierPropertyValue_no;
      }
    });

    facts.outliers_high.sort((a, b) => a - b);
    facts.outliers_low.sort((a, b) => a - b);

    return facts;
  }

  private scanForZeroAndNoDataValues(
    indicatorMetadataAndGeoJSON,
    indicatorPropertyName,
    facts: IndicatorDataFacts
  ) {
    for (const feature of indicatorMetadataAndGeoJSON.geoJSON.features) {
      if (
        this.indicatorValueService.getIndicatorValue_asNumber(
          feature.properties[indicatorPropertyName],
          this.selectionState.resolveSelectedPrecision(undefined)
        ) == 0
      ) {
        facts.containsZeroValues = true;
      }

      if (
        this.indicatorValueService.indicatorValueIsNoData(feature.properties[indicatorPropertyName])
      ) {
        facts.containsNoDataValues = true;
      }

      if (facts.containsZeroValues && facts.containsNoDataValues) {
        break;
      }
    }
  }

  private setNoDataValuesAsNull(indicatorMetadataAndGeoJSON, indicatorPropertyName) {
    indicatorMetadataAndGeoJSON.geoJSON.features.forEach((feature) => {
      if (
        this.indicatorValueService.indicatorValueIsNoData(feature.properties[indicatorPropertyName])
      ) {
        feature.properties[indicatorPropertyName] = null;
      }
    });
  }

  private applyDefaultClassificationSettings(indicatorMetadataAndGeoJSON) {
    if (indicatorMetadataAndGeoJSON.defaultClassificationMapping.classificationMethod) {
      this.classificationState.classifyMethod =
        indicatorMetadataAndGeoJSON.defaultClassificationMapping.classificationMethod.toLowerCase();
    }
    if (indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses) {
      this.classificationState.numClasses =
        indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses;
    }
  }

  private calcMOVBreaks(breaks, measureOfValue) {
    const movBreaks: any[] = [[], []];
    breaks.forEach((br) => {
      if (br < measureOfValue) {
        movBreaks[1].push(br);
      } else {
        movBreaks[0].push(br);
      }
    });
    movBreaks[1].push(measureOfValue);
    movBreaks[0].unshift(measureOfValue);
    return movBreaks;
  }

  /**
   * Applies the regional default breaks of the currently selected spatial
   * unit to the passed brews (default brew for status indicators, otherwise
   * the dynamic increase/decrease pair) and returns the adjusted brews.
   */
  private applyRegionalDefaultClassification(
    indicatorMetadataAndGeoJSON,
    brews: { defaultBrew: any; dynamicIncreaseBrew: any; dynamicDecreaseBrew: any }
  ) {
    const vsh = this.visualStyleHelperService;
    const state = this.classificationState;
    const { defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew } = brews;

    if (indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses) {
      state.numClasses = indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses;
    }

    let firstBreak;
    let lastBreak;
    if (defaultBrew && defaultBrew.breaks) {
      firstBreak = defaultBrew.breaks[0];
      lastBreak = defaultBrew.breaks[defaultBrew.breaks.length - 1];
    } else {
      firstBreak = dynamicDecreaseBrew.breaks[0];
      lastBreak = dynamicIncreaseBrew.breaks[dynamicIncreaseBrew.breaks.length - 1];
    }

    for (const item of indicatorMetadataAndGeoJSON.defaultClassificationMapping.items) {
      if (item.spatialUnitId == this.selectionState.selectedSpatialUnit.spatialUnitId) {
        const regionalDefaultBreaks = [...item.breaks];
        if (firstBreak < regionalDefaultBreaks[0]) {
          regionalDefaultBreaks.unshift(firstBreak);
        }
        if (lastBreak > regionalDefaultBreaks[regionalDefaultBreaks.length - 1]) {
          regionalDefaultBreaks.push(lastBreak);
        }
        if (defaultBrew && defaultBrew.breaks) {
          const brew: any = vsh.setupManualBrew(
            indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses,
            indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
            regionalDefaultBreaks
          );
          defaultBrew.breaks = regionalDefaultBreaks;
          defaultBrew.colors = brew.colors;
          state.regionalDefaultBreaks = regionalDefaultBreaks;
        } else {
          const decreaseBreaks = regionalDefaultBreaks.filter((n) => n < 0);
          if (
            dynamicDecreaseBrew.breaks[dynamicDecreaseBrew.breaks.length - 1] >
            decreaseBreaks[decreaseBreaks.length - 1]
          ) {
            decreaseBreaks.push(dynamicDecreaseBrew.breaks[dynamicDecreaseBrew.breaks.length - 1]);
          }
          const increaseBreaks = regionalDefaultBreaks.filter((n) => n > 0);
          if (dynamicIncreaseBrew.breaks[0] < increaseBreaks[0]) {
            increaseBreaks.unshift(dynamicIncreaseBrew.breaks[0]);
          }

          const decreaseBrew: any = vsh.setupManualBrew(
            decreaseBreaks.length - 1,
            this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
            decreaseBreaks
          );
          const increaseBrew: any = vsh.setupManualBrew(
            increaseBreaks.length - 1,
            this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
            increaseBreaks
          );

          dynamicDecreaseBrew.breaks = decreaseBreaks;
          dynamicIncreaseBrew.breaks = increaseBreaks;

          dynamicDecreaseBrew.colors = decreaseBrew.colors;
          dynamicIncreaseBrew.colors = increaseBrew.colors;
        }
      }
    }

    return { defaultBrew, dynamicIncreaseBrew, dynamicDecreaseBrew };
  }

  /** Falls back from regional_default to equal_interval when no breaks exist for the selected spatial unit or a balance is shown. */
  private checkAvailabilityOfRegionalDefault(indicatorMetadataAndGeoJSON) {
    const state = this.classificationState;
    let breaksAvailableForSelectedSpatialUnit = false;
    for (const item of indicatorMetadataAndGeoJSON.defaultClassificationMapping.items) {
      if (item.spatialUnitId == this.selectionState.selectedSpatialUnit.spatialUnitId) {
        breaksAvailableForSelectedSpatialUnit = true;
      }
    }
    if (state.classifyMethod == 'regional_default') {
      if (!breaksAvailableForSelectedSpatialUnit || this.chartDisplayState.isBalanceChecked) {
        state.classifyMethod = 'equal_interval';
        state.numClasses = state.numClasses ? state.numClasses : 5;
      }
    }
  }

  /**
   * regional_default classifies zero values inline, all other methods keep
   * the configured behavior; the configured value is backed up and restored
   * when leaving regional_default.
   */
  private setClassifyZeroForClassifyMethod() {
    if (this.classificationState.classifyMethod == 'regional_default') {
      if (this.classifyZeroSeparately_backup == undefined) {
        this.classifyZeroSeparately_backup = this.envConfigService.classifyZeroSeparately;
      }
      this.envConfigService.classifyZeroSeparately = false;
    } else {
      this.envConfigService.classifyZeroSeparately =
        this.classifyZeroSeparately_backup != undefined
          ? this.classifyZeroSeparately_backup
          : this.envConfigService.classifyZeroSeparately;
      this.classifyZeroSeparately_backup = undefined;
    }
  }

  private containsNegativeValues(geoJSON, indicatorPropertyName) {
    for (const feature of geoJSON.features) {
      if (feature.properties[indicatorPropertyName] < 0) {
        return true;
      }
    }
    return false;
  }

  /** Attaches the tempData tooltip model (formatted value + unit) to a feature. */
  private prepFeatureModelForMapUse(feature, indicatorPropertyName) {
    feature.tempData = {};
    const indicatorValue = feature.properties[indicatorPropertyName];
    if (this.indicatorValueService.indicatorValueIsNoData(indicatorValue)) {
      feature.tempData.indicatorValueText = 'NoData';
    } else {
      feature.tempData.indicatorValueText =
        this.indicatorValueService.getIndicatorValue_asFormattedText(
          indicatorValue,
          this.selectionState.resolveSelectedPrecision(undefined)
        );
    }

    feature.tempData.unitText = this.selectionState.selectedIndicator.unit;

    return feature;
  }
}
