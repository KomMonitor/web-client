import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import $ from 'jquery';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { ClassificationStateService } from 'services/classification-state-service/classification-state.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';
import { IndicatorClassificationService } from './indicator-classification.service';

const DATE = '2024-01-01';
const PROP = 'DATE_' + DATE;

interface FixtureOptions {
  indicatorType?: string;
  classificationMethod?: string;
  numClasses?: number;
  items?: any[];
}

function makeIndicatorDataset(values: (number | null)[], opts: FixtureOptions = {}) {
  return {
    indicatorName: 'Test-Indikator',
    unit: '%',
    indicatorType: opts.indicatorType || 'STATUS_ABSOLUTE',
    metadata: { description: 'test indicator' },
    defaultClassificationMapping: {
      classificationMethod: opts.classificationMethod,
      numClasses: opts.numClasses ?? 3,
      colorBrewerSchemeName: 'Oranges',
      items: opts.items || [],
    },
    geoJSON: {
      type: 'FeatureCollection',
      features: values.map((value, index) => ({
        type: 'Feature',
        properties: {
          ID: 'f' + index,
          NAME: 'Feature ' + index,
          [PROP]: value,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [7 + index, 51],
              [7.1 + index, 51],
              [7.1 + index, 51.1],
              [7 + index, 51.1],
            ],
          ],
        },
      })),
    },
  };
}

describe('IndicatorClassificationService', () => {
  let service: IndicatorClassificationService;
  let vsh: VisualStyleHelperServiceNew;
  let state: ClassificationStateService;
  let chartDisplayState: ChartDisplayStateService;
  let selectionState: SelectionStateService;
  let filterHelper: FilterHelperService;

  beforeEach(() => {
    // classyBrew setup clones color schemes via the jQuery global (app loads it via angular.json)
    (window as any).jQuery = $;
    (window as any).$ = $;

    Object.assign((window as any).__env, {
      indicatorDatePrefix: 'DATE_',
      numberOfDecimals: 2,
      classifyZeroSeparately: false,
      classifyUsingWholeTimeseries: false,
      useOutlierDetectionOnIndicator: false,
      useTransparencyOnIndicator: false,
      defaultFillOpacity: 0.8,
      defaultColorBrewerPaletteForGtMovValues: 'Oranges',
      defaultColorBrewerPaletteForLtMovValues: 'PuBu',
      defaultColorBrewerPaletteForBalanceIncreasingValues: 'Greens',
      defaultColorBrewerPaletteForBalanceDecreasingValues: 'Reds',
    });

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IndicatorClassificationService);
    vsh = TestBed.inject(VisualStyleHelperServiceNew);
    state = TestBed.inject(ClassificationStateService);
    chartDisplayState = TestBed.inject(ChartDisplayStateService);
    selectionState = TestBed.inject(SelectionStateService);
    filterHelper = TestBed.inject(FilterHelperService);

    selectionState.selectedSpatialUnit = {
      spatialUnitId: 'SU1',
      spatialUnitLevel: 'Stadtteile',
    };
    selectionState.selectedIndicator = { unit: '%' };
    selectionState.selectedDate = DATE;

    chartDisplayState.isMeasureOfValueChecked = false;
    chartDisplayState.isBalanceChecked = false;
    chartDisplayState.measureOfValue = 5;

    filterHelper.clearFilteredFeatures();
    filterHelper.clearSelectedFeatures();

    state.classifyMethod = 'equal_interval';
    state.numClasses = 3;
    state.manualBrew = undefined;
    state.dynamicBrew = undefined;
    state.dynamicBrewBreaks = [];
    state.manualMOVBreaks = [];
    state.regionalDefaultBreaks = [];
    state.regionalDefaultMOVBreaks = [];
  });

  it('classifies a STATUS indicator with a default brew and styles features from it (replace)', () => {
    const dataset = makeIndicatorDataset([0, 5, 6, 7, 8, null, 1000000]);

    const result = service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: dataset,
      indicatorPropertyName: PROP,
    });

    expect(result.defaultBrew).toBeTruthy();
    expect(result.defaultBrew.colors.length).toBe(3); // metadata numClasses
    expect(result.datasetContainsNegativeValues).toBe(false);

    const style = result.styleFor(dataset.geoJSON.features[1]);
    expect(style).toBeTruthy();
    expect(style.fillColor).toBeDefined();
    // tooltip model is prepped as a side effect
    expect(dataset.geoJSON.features[1].tempData.indicatorValueText).toBe('5');
    expect(dataset.geoJSON.features[1].tempData.unitText).toBe('%');
  });

  it('reports zero/noData/outlier facts and stamps the outlier property (replace)', () => {
    const dataset = makeIndicatorDataset([0, 5, 6, 7, 8, null, 1000000]);

    const result = service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: dataset,
      indicatorPropertyName: PROP,
    });

    expect(result.facts.containsZeroValues).toBe(true);
    expect(result.facts.containsNoDataValues).toBe(true);
    expect(result.facts.containsOutliers_high).toBe(true);
    expect(result.facts.containsOutliers_low).toBe(false);
    expect(result.facts.outliers_high).toEqual([1000000]);

    const outlierFeature = dataset.geoJSON.features[6];
    expect(outlierFeature.properties[vsh.outlierPropertyName]).toBe(
      vsh.outlierPropertyValue_high_extreme
    );
  });

  it('uses dynamic brews for a STATUS indicator containing negative values (replace)', () => {
    const dataset = makeIndicatorDataset([-3, 2, 5, 8]);

    const result = service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: dataset,
      indicatorPropertyName: PROP,
    });

    expect(result.datasetContainsNegativeValues).toBe(true);
    expect(result.defaultBrew).toBeUndefined();
    expect(result.dynamicIncreaseBrew).toBeTruthy();
    expect(result.dynamicDecreaseBrew).toBeTruthy();
    expect(result.styleFor(dataset.geoJSON.features[0])).toBeTruthy();
  });

  it('uses dynamic brews for a DYNAMIC indicator (replace)', () => {
    const dataset = makeIndicatorDataset([-2, 3, 6], { indicatorType: 'DYNAMIC_ABSOLUTE' });

    const result = service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: dataset,
      indicatorPropertyName: PROP,
    });

    expect(result.dynamicIncreaseBrew).toBeTruthy();
    expect(result.dynamicDecreaseBrew).toBeTruthy();
    expect(result.defaultBrew).toBeUndefined();
    expect(result.styleFor(dataset.geoJSON.features[1])).toBeTruthy();
  });

  it('builds measure-of-value brews without crashing on the reset manualBrew (replace regression)', () => {
    chartDisplayState.isMeasureOfValueChecked = true;
    chartDisplayState.measureOfValue = 5;
    const dataset = makeIndicatorDataset([1, 2, 3, 4, 6, 7, 8, 9]);

    // legacy code wrote into the just-reset manualBrew here and would throw
    let result: any;
    expect(() => {
      result = service.buildClassification({
        mode: 'replace',
        indicatorMetadataAndGeoJSON: dataset,
        indicatorPropertyName: PROP,
      });
    }).not.toThrow();

    expect(result.gtMeasureOfValueBrew).toBeTruthy();
    expect(result.ltMeasureOfValueBrew).toBeTruthy();
    expect(state.manualMOVBreaks[0].length).toBeGreaterThan(0);
    expect(state.manualMOVBreaks[1].length).toBeGreaterThan(0);
    expect(result.styleFor(dataset.geoJSON.features[0])).toBeTruthy();
  });

  it('rebuilds the manual brew from the existing breaks (restyle)', () => {
    const dataset = makeIndicatorDataset([1, 4, 7, 9]);
    state.classifyMethod = 'manual';
    state.manualBrew = vsh.setupManualBrew(3, 'Oranges', [0, 3, 6, 10]);

    const result = service.buildClassification({
      mode: 'restyle',
      indicatorMetadataAndGeoJSON: dataset,
      indicatorPropertyName: PROP,
      indicatorType: 'STATUS_ABSOLUTE',
      datasetContainsNegativeValues: false,
    });

    expect(result.manualBrew).toBeTruthy();
    expect(result.manualBrew.breaks).toEqual([0, 3, 6, 10]);
    expect(state.manualBrew).toBe(result.manualBrew);

    const style = result.styleFor(dataset.geoJSON.features[0]);
    expect(style.fillColor).toBeDefined();
  });

  it('applies the regional default breaks of the selected spatial unit (replace)', () => {
    const dataset = makeIndicatorDataset([1, 4, 7, 9], {
      classificationMethod: 'REGIONAL_DEFAULT',
      items: [{ spatialUnitId: 'SU1', breaks: [0, 5, 10] }],
    });

    const result = service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: dataset,
      indicatorPropertyName: PROP,
    });

    expect(state.classifyMethod).toBe('regional_default');
    expect(state.regionalDefaultBreaks.length).toBeGreaterThanOrEqual(3);
    expect(result.defaultBrew.breaks).toEqual(state.regionalDefaultBreaks);
  });

  it('falls back to equal_interval when no regional default exists for the spatial unit (replace)', () => {
    const dataset = makeIndicatorDataset([1, 4, 7, 9], {
      classificationMethod: 'REGIONAL_DEFAULT',
      items: [{ spatialUnitId: 'OTHER_SU', breaks: [0, 5, 10] }],
    });

    service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: dataset,
      indicatorPropertyName: PROP,
    });

    expect(state.classifyMethod).toBe('equal_interval');
  });

  it('returns the filtered style for filtered features', () => {
    const dataset = makeIndicatorDataset([1, 4, 7, 9]);

    const result = service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: dataset,
      indicatorPropertyName: PROP,
    });

    const filteredFeature = dataset.geoJSON.features[0];
    filterHelper.filteredIndicatorFeatureIds.set('f0', filteredFeature);

    expect(result.styleFor(filteredFeature)).toBe(vsh.filteredStyle);
    expect(result.styleFor(dataset.geoJSON.features[1])).not.toBe(vsh.filteredStyle);
  });

  it('uses the metadata numClasses on replace but the shared numClasses on restyle', () => {
    const setupDefaultBrewSpy = jest.spyOn(vsh, 'setupDefaultBrew');

    service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: makeIndicatorDataset([1, 4, 7, 9], { numClasses: 6 }),
      indicatorPropertyName: PROP,
    });
    // replace derives the class count from the metadata default (6); note that
    // applyDefaultClassificationSettings also syncs state.numClasses to it
    expect(setupDefaultBrewSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      PROP,
      6,
      'Oranges',
      'equal_interval'
    );

    state.numClasses = 4;
    service.buildClassification({
      mode: 'restyle',
      indicatorMetadataAndGeoJSON: makeIndicatorDataset([1, 4, 7, 9], { numClasses: 6 }),
      indicatorPropertyName: PROP,
      indicatorType: 'STATUS_ABSOLUTE',
      datasetContainsNegativeValues: false,
    });
    // restyle uses the (possibly user-changed) shared numClasses instead
    expect(setupDefaultBrewSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      PROP,
      4,
      'Oranges',
      'equal_interval'
    );
  });

  it('resets the shared classification state on replace but keeps it on restyle', () => {
    state.manualMOVBreaks = [[1], [2]];
    state.regionalDefaultBreaks = [0, 5, 10];
    state.dynamicBrewBreaks = [[1], [-1]];

    service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: makeIndicatorDataset([1, 4, 7, 9]),
      indicatorPropertyName: PROP,
    });

    expect(state.regionalDefaultBreaks).toEqual([]);
    expect(state.dynamicBrewBreaks).toEqual([]);
  });

  it('converts NoData values to null on replace only', () => {
    const replaceDataset = makeIndicatorDataset([1, undefined as any, 3]);
    service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: replaceDataset,
      indicatorPropertyName: PROP,
    });
    expect(replaceDataset.geoJSON.features[1].properties[PROP]).toBeNull();

    const restyleDataset = makeIndicatorDataset([1, undefined as any, 3]);
    service.buildClassification({
      mode: 'restyle',
      indicatorMetadataAndGeoJSON: restyleDataset,
      indicatorPropertyName: PROP,
      indicatorType: 'STATUS_ABSOLUTE',
      datasetContainsNegativeValues: false,
    });
    expect(restyleDataset.geoJSON.features[1].properties[PROP]).toBeUndefined();
  });

  it('removes NoData features for raster spatial units (replace)', () => {
    selectionState.selectedSpatialUnit = {
      spatialUnitId: 'SU2',
      spatialUnitLevel: '100m Raster',
    };
    const dataset = makeIndicatorDataset([1, null, 3]);

    service.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON: dataset,
      indicatorPropertyName: PROP,
    });

    expect(dataset.geoJSON.features.length).toBe(2);
  });
});
