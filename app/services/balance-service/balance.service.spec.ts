import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import $ from 'jquery';

import { BalanceService } from './balance.service';

describe('BalanceService', () => {
  let service: BalanceService;
  let previousEnv: any;

  const dates = ['2020-12-31', '2021-12-31', '2022-12-31'];
  const makeIndicator = () => ({
    indicatorName: 'Test indicator',
    indicatorType: 'STATUS_RELATIVE',
    unit: '%',
    precision: null,
    applicableDates: [...dates],
    geoJSON: {
      features: [
        { properties: { 'DATE_2020-12-31': 1, 'DATE_2021-12-31': 2, 'DATE_2022-12-31': 3 } },
        { properties: { 'DATE_2020-12-31': 3, 'DATE_2021-12-31': 4, 'DATE_2022-12-31': 7 } },
      ],
    },
  });
  const allConfig = {
    showMinMax: true,
    showCompleteTimeseries: true,
    showTrend: true,
    trendComputationType: 'linear',
  };

  beforeEach(() => {
    // the balance indicator is a deep copy via the jQuery global the app loads
    (window as any).jQuery = $;
    previousEnv = (window as any).__env;
    (window as any).__env = {
      ...previousEnv,
      indicatorDatePrefix: 'DATE_',
      numberOfDecimals: 2,
      configMeanDataDisplay: 'both',
    };
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BalanceService);
  });

  afterEach(() => {
    (window as any).__env = previousEnv;
  });

  it.each([
    ['STATUS_ABSOLUTE', 'DYNAMIC_ABSOLUTE'],
    ['STATUS_RELATIVE', 'DYNAMIC_RELATIVE'],
    ['STATUS_STANDARDIZED', 'DYNAMIC_STANDARDIZED'],
    ['DYNAMIC_ABSOLUTE', 'DYNAMIC_ABSOLUTE'],
  ])('maps indicator type %s to %s', (type, expected) => {
    expect(service.toDynamicIndicatorType(type)).toBe(expected);
  });

  describe('snapToApplicableDate', () => {
    it('keeps a date the indicator has', () => {
      expect(service.snapToApplicableDate('2021-12-31', dates, 'later')).toBe('2021-12-31');
      expect(service.snapToApplicableDate('2021-12-31', dates, 'earlier')).toBe('2021-12-31');
    });

    it('snaps a missing date to the next later or earlier one', () => {
      expect(service.snapToApplicableDate('2021-06-30', dates, 'later')).toBe('2021-12-31');
      expect(service.snapToApplicableDate('2021-06-30', dates, 'earlier')).toBe('2020-12-31');
    });

    it('falls back to the last or first date beyond the range', () => {
      expect(service.snapToApplicableDate('2030-01-01', dates, 'later')).toBe('2022-12-31');
      expect(service.snapToApplicableDate('2010-01-01', dates, 'earlier')).toBe('2020-12-31');
    });
  });

  it('snaps a stale slider period inwards onto the indicator dates', () => {
    const sliderDates = ['2019-12-31', ...dates, '2023-12-31'];
    expect(service.resolvePeriod(sliderDates, 0, 4, dates)).toEqual({
      from: '2020-12-31',
      to: '2022-12-31',
    });
  });

  it('writes end minus start per feature to the target date of a dynamic copy', () => {
    const indicator = makeIndicator();
    const balance = service.makeBalanceIndicator(
      indicator,
      { from: '2020-12-31', to: '2022-12-31' },
      '2022-12-31'
    );

    expect(balance.indicatorType).toBe('DYNAMIC_RELATIVE');
    expect(balance.geoJSON.features.map((f) => f.properties['DATE_2022-12-31'])).toEqual([2, 4]);
    expect(balance.fromDate).toBe('31. Dezember 2020');
    expect(balance.toDate).toBe('31. Dezember 2022');
    // the selected indicator stays untouched
    expect(indicator.geoJSON.features[0].properties['DATE_2022-12-31']).toBe(3);
    expect(indicator.indicatorType).toBe('STATUS_RELATIVE');
  });

  it('computes the statistics over the period only', () => {
    const meanValues = service.valuesInPeriod([2, 3, 5], dates, {
      from: '2021-12-31',
      to: '2022-12-31',
    });
    const stats = service.computeStatistics(meanValues, makeIndicator());

    expect(meanValues).toEqual([3, 5]);
    expect(stats).toMatchObject({
      min: '3',
      max: '5',
      mean: '4',
      balance: '2',
      balanceValue: 2,
      direction: 'rising',
      trend: 'steigend',
    });
  });

  it.each([
    [[5, 3], 'falling', 'sinkend'],
    [[4, 4], 'constant', 'gleichbleibend'],
  ])('reports %j as %s', (values, direction, trend) => {
    expect(service.computeStatistics(values, makeIndicator())).toMatchObject({
      direction,
      trend,
    });
  });

  // The balance panel used to clone the line chart the diagrams panel had
  // prepared, and crashed when that panel had never been opened.
  it('builds the trend chart without a prepared line chart', () => {
    const options = service.makeTrendChartOptions(
      makeIndicator(),
      'Stadtteile',
      { from: '2020-12-31', to: '2022-12-31' },
      allConfig
    );

    expect(options.series.map((series) => series.name)).toEqual([
      'rechnerisches arithmetisches Mittel',
      'Min',
      'Max',
      'MinStack',
      'MaxStack',
      'Trendlinie',
    ]);
    expect(options.series[0].data).toEqual([2, 3, 5]);
  });

  it('leaves out the min/max band and trend line when switched off', () => {
    const options = service.makeTrendChartOptions(
      makeIndicator(),
      'Stadtteile',
      { from: '2020-12-31', to: '2022-12-31' },
      { ...allConfig, showMinMax: false, showTrend: false }
    );

    expect(options.series.map((series) => series.name)).toEqual([
      'rechnerisches arithmetisches Mittel',
    ]);
  });

  it('cuts every series to the period, the min/max band included', () => {
    const options = service.makeTrendChartOptions(
      makeIndicator(),
      'Stadtteile',
      { from: '2021-12-31', to: '2022-12-31' },
      { ...allConfig, showCompleteTimeseries: false }
    );

    expect(options.xAxis.data).toEqual(['2021-12-31', '2022-12-31']);
    for (const series of options.series) {
      expect(series.data).toHaveLength(2);
    }
  });
});
