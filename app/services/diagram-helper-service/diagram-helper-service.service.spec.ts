import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DiagramHelperServiceService } from './diagram-helper-service.service';

describe('DiagramHelperServiceService', () => {
  let service: DiagramHelperServiceService;
  let previousEnv: any;

  const indicator = {
    indicatorName: 'Test indicator',
    unit: '%',
    applicableDates: ['2020-12-31', '2021-12-31', '2022-12-31'],
    geoJSON: {
      features: [
        { properties: { 'DATE_2020-12-31': 1, 'DATE_2021-12-31': 2, 'DATE_2022-12-31': 3 } },
        { properties: { 'DATE_2020-12-31': 3, 'DATE_2021-12-31': 4, 'DATE_2022-12-31': 7 } },
      ],
    },
  };

  beforeEach(() => {
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
    service = TestBed.inject(DiagramHelperServiceService);
  });

  afterEach(() => {
    (window as any).__env = previousEnv;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('aggregates mean, min and max per date', () => {
    const timeseries = service.computeTimeseries(indicator);

    expect(timeseries.dates).toEqual(indicator.applicableDates);
    expect(timeseries.average).toEqual([2, 3, 5]);
    expect(timeseries.min).toEqual([1, 2, 3]);
    expect(timeseries.max).toEqual([3, 4, 7]);
  });

  // The balance panel used to clone the line chart the diagrams panel had
  // prepared, and crashed when that panel had never been opened.
  it('builds the balance trend chart without a prepared line chart', () => {
    const options = service.makeTrendChartOptions_forAllFeatures(
      indicator,
      'Stadtteile',
      'DATE_2020-12-31',
      'DATE_2022-12-31',
      true,
      true,
      'linear',
      true
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
    const options = service.makeTrendChartOptions_forAllFeatures(
      indicator,
      'Stadtteile',
      'DATE_2020-12-31',
      'DATE_2022-12-31',
      false,
      true,
      'linear',
      false
    );

    expect(options.series.map((series) => series.name)).toEqual([
      'rechnerisches arithmetisches Mittel',
    ]);
  });
});
