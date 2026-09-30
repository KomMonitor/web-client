import { Injectable, inject } from '@angular/core';
import * as ecStat from 'echarts-stat';
import * as jStat from 'jstat';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { LabelService } from 'services/label-service/label.service';
import { mergeColorSchemes } from 'components/ngComponents/userInterface/kommonitorClassification/colors';

/** The period a balance covers, as applicable dates (`YYYY-MM-DD`). */
export interface BalancePeriod {
  from: string;
  to: string;
}

export type BalanceDirection = 'rising' | 'falling' | 'constant';

/** Statistics of the mean line over a balance period, formatted for display. */
export interface BalanceStatistics {
  min: string;
  max: string;
  mean: string;
  median: string;
  deviation: string;
  variance: string;
  /** Signed, e.g. "+2,49". */
  balance: string;
  /** Last minus first value of the period, rounded like the indicator. */
  balanceValue: number;
  direction: BalanceDirection;
  trend: string;
}

export type TrendComputationType = 'linear' | 'exponential' | 'polynomial_3';

export interface TrendChartConfig {
  showMinMax: boolean;
  showCompleteTimeseries: boolean;
  showTrend: boolean;
  trendComputationType: TrendComputationType | string;
}

const TREND_LABELS: Record<BalanceDirection, string> = {
  rising: 'steigend',
  falling: 'sinkend',
  constant: 'gleichbleibend',
};

const NEUTRAL_COLOR = '#6c757d';
const FALLBACK_PRIMARY_COLOR = '#337ab7';

/**
 * Computations behind the balance panel (Bilanzierung): the period the slider
 * selects, the balance indicator drawn on the map, the trend chart and the
 * statistics of its mean line. Holds no state — the panel keeps slider and
 * chart, ChartDisplayStateService keeps the balance state that filter,
 * classification, legend and map read.
 */
@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  private envConfigService = inject(EnvConfigService);
  private indicatorValueService = inject(IndicatorValueService);
  private diagramHelperService = inject(DiagramHelperServiceService);
  private labelService = inject(LabelService);

  /** Balances are changes over time, so every indicator type becomes its DYNAMIC_* variant. */
  toDynamicIndicatorType(indicatorType: string): string {
    if (indicatorType.includes('ABSOLUTE')) {
      return 'DYNAMIC_ABSOLUTE';
    }
    if (indicatorType.includes('RELATIVE')) {
      return 'DYNAMIC_RELATIVE';
    }
    if (indicatorType.includes('STANDARDIZED')) {
      return 'DYNAMIC_STANDARDIZED';
    }
    return indicatorType;
  }

  /**
   * Nearest applicable date at or after (`later`) / at or before (`earlier`)
   * the given one; falls back to the last / first applicable date. Dates are
   * ISO strings, so string order is date order.
   */
  snapToApplicableDate(
    date: string,
    applicableDates: string[],
    direction: 'later' | 'earlier'
  ): string {
    const sorted = [...applicableDates].sort();
    if (direction === 'later') {
      return sorted.find((candidate) => candidate >= date) ?? sorted[sorted.length - 1];
    }
    return [...sorted].reverse().find((candidate) => candidate <= date) ?? sorted[0];
  }

  /**
   * Period for the slider's handle indices. The slider may still show the
   * dates of an earlier selection, so both ends snap inwards onto dates the
   * indicator actually has.
   */
  resolvePeriod(
    sliderDates: string[],
    fromIndex: number,
    toIndex: number,
    applicableDates: string[]
  ): BalancePeriod {
    return {
      from: this.snapToApplicableDate(sliderDates[fromIndex], applicableDates, 'later'),
      to: this.snapToApplicableDate(sliderDates[toIndex], applicableDates, 'earlier'),
    };
  }

  /**
   * Copy of the indicator whose value at `targetDate` is, per feature, the
   * value at the end of the period minus the value at its start. The map
   * shows `targetDate`, so that is where the balance has to sit.
   */
  makeBalanceIndicator(indicator, period: BalancePeriod, targetDate: string) {
    const prefix = this.envConfigService.indicatorDatePrefix;
    const precision = this.precisionOf(indicator);
    const toNumber = (value) =>
      this.indicatorValueService.getIndicatorValue_asNumber(value, precision);

    // deep copy, so the feature order matches the selected indicator's
    const balanceIndicator = jQuery.extend(true, {}, indicator);
    balanceIndicator.indicatorType = this.toDynamicIndicatorType(indicator.indicatorType);

    indicator.geoJSON.features.forEach((feature, index) => {
      const toValue = toNumber(feature.properties[prefix + period.to]);
      const fromValue = toNumber(feature.properties[prefix + period.from]);
      balanceIndicator.geoJSON.features[index].properties[prefix + targetDate] = toNumber(
        toValue - fromValue
      );
    });

    balanceIndicator.fromDate = this.formatLongDate(period.from);
    balanceIndicator.toDate = this.formatLongDate(period.to);
    return balanceIndicator;
  }

  /** The values whose date lies within the period, in order. */
  valuesInPeriod(values: any[], dates: string[], period: BalancePeriod): any[] {
    return values.filter((_value, index) => this.isInPeriod(dates[index], period));
  }

  /** Statistics of a mean line; `values` should already be cut to the period. */
  computeStatistics(values: number[], indicator): BalanceStatistics {
    const precision = this.precisionOf(indicator);
    const format = (value) =>
      this.indicatorValueService.getIndicatorValue_asFormattedText(value, precision);

    const change = values[values.length - 1] - values[0];
    const balanceValue = Number(
      this.indicatorValueService.getIndicatorValue_asNumber(change, precision)
    );
    const direction: BalanceDirection =
      balanceValue > 0 ? 'rising' : balanceValue < 0 ? 'falling' : 'constant';

    return {
      min: format(jStat.min(values)),
      max: format(jStat.max(values)),
      mean: format(jStat.mean(values)),
      median: format(jStat.median(values)),
      deviation: format(jStat.stdev(values)),
      variance: format(jStat.variance(values)),
      balance: (balanceValue > 0 ? '+' : '') + format(change),
      balanceValue,
      direction,
      trend: TREND_LABELS[direction],
    };
  }

  /**
   * Time series of the mean over all features with min/max band and optional
   * trend line. Computed from the indicator itself, so it does not depend on
   * the diagrams panel having drawn its line chart.
   * Series order is fixed: mean, Min, Max, MinStack, MaxStack[, Trendlinie].
   */
  makeTrendChartOptions(
    indicator,
    spatialUnitName,
    period: BalancePeriod,
    config: TrendChartConfig,
    customFontFamilyEnabled = false
  ) {
    const diagramHelper = this.diagramHelperService;
    const timeseries = diagramHelper.computeTimeseries(indicator);
    const options = diagramHelper.prepCustomStyling(
      customFontFamilyEnabled,
      diagramHelper.makeLineChartOptions(indicator, timeseries, spatialUnitName)
    );

    // The regular line chart picks its mean lines by config; the balance
    // statistics always describe the arithmetic mean, so use exactly that.
    options.series = [
      diagramHelper.makeTimeseriesMeanSeries(timeseries.average),
      ...diagramHelper.makeTimeseriesMinMaxSeries(timeseries.min, timeseries.max),
    ];
    options.legend.data = [this.labelService.rankingChartAverageLabel];

    const meanSeries = options.series[0];
    // hide data points
    meanSeries.itemStyle = { opacity: 0, width: 3, type: 'solid' };

    if (config.showCompleteTimeseries) {
      // shade the parts of the series outside the period
      const dates = timeseries.dates;
      meanSeries.markArea = {
        silent: true,
        itemStyle: {
          color: '#b50b0b',
          opacity: 0.3,
        },
        data: [
          [{ xAxis: dates[0] }, { xAxis: period.from }],
          [{ xAxis: period.to }, { xAxis: dates[dates.length - 1] }],
        ],
      };
    } else {
      // Cut every series, the stacks included — they draw the min/max band.
      for (const series of options.series) {
        series.data = this.valuesInPeriod(series.data, timeseries.dates, period);
      }
      options.xAxis.data = this.valuesInPeriod(timeseries.dates, timeseries.dates, period);
    }

    if (config.showTrend) {
      options.legend.data.push('Trendlinie');
      options.series.push(
        this.makeTrendLineSeries(
          meanSeries.data,
          options.xAxis.data,
          period,
          config.trendComputationType
        )
      );
    }

    if (!config.showMinMax) {
      options.series.splice(1, 4);
    }

    return options;
  }

  /**
   * Colour for a balance direction, from the palettes the map colours
   * increasing and decreasing balances with, so panel and map agree.
   */
  directionColor(direction: BalanceDirection): string {
    if (direction === 'constant') {
      return NEUTRAL_COLOR;
    }
    const paletteName =
      direction === 'rising'
        ? this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues
        : this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues;
    const palette = mergeColorSchemes(this.envConfigService.customColorSchemes)[paletteName];
    if (!palette) {
      return NEUTRAL_COLOR;
    }
    // Second-strongest class of the five-class variant: readable as text on
    // white without being the darkest shade.
    const classCounts = Object.keys(palette).map(Number);
    const classes = palette[5] ?? palette[Math.max(...classCounts)];
    return classes[classes.length - 2] ?? NEUTRAL_COLOR;
  }

  /** `YYYY-MM-DD` as e.g. "31. Dezember 2024", read as a local date. */
  formatLongDate(date: string): string {
    return this.toLocalDate(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /** `YYYY-MM-DD` as e.g. "31.12.2024", read as a local date. */
  formatShortDate(date: string): string {
    return this.toLocalDate(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private makeTrendLineSeries(
    meanValues: any[],
    dates: string[],
    period: BalancePeriod,
    computationType: string
  ) {
    // regression over the period only, as [x index, value] pairs
    const points: [number, number][] = [];
    meanValues.forEach((value, index) => {
      if (this.isInPeriod(dates[index], period)) {
        points.push([index, value]);
      }
    });

    let trendLine;
    if (computationType.includes('exponential')) {
      trendLine = ecStat.regression('exponential', points, 0);
    } else if (computationType.includes('polynomial_3')) {
      trendLine = ecStat.regression('polynomial', points, 3);
    } else {
      trendLine = ecStat.regression('linear', points, 0);
    }

    // one value per x position, NaN outside the period
    const trendLineValues = new Map<number, number>(
      trendLine.points.map(([x, y]) => [x, y] as [number, number])
    );
    const data = meanValues.map((_value, index) => trendLineValues.get(index) ?? NaN);

    // The app's primary colour sets the trend line off from the grey mean
    // line and band without the former signal red.
    const color = this.primaryColor();
    return {
      name: 'Trendlinie',
      type: 'line',
      showSymbol: false,
      data,
      lineStyle: {
        normal: {
          color,
          width: 3,
          type: 'dashed',
        },
      },
      itemStyle: {
        normal: {
          borderWidth: 3,
          color,
          opacity: 0,
        },
      },
      markPoint: {
        itemStyle: {
          normal: {
            color: 'transparent',
          },
        },
        data: [
          {
            coord: trendLine.points[trendLine.points.length - 1],
          },
        ],
      },
    };
  }

  private primaryColor(): string {
    const primary = getComputedStyle(document.documentElement)
      .getPropertyValue('--kommonitor-primary')
      .trim();
    return primary || FALLBACK_PRIMARY_COLOR;
  }

  private isInPeriod(date: string, period: BalancePeriod): boolean {
    return date >= period.from && date <= period.to;
  }

  // Same rule as SelectionStateService.resolveSelectedPrecision: a null
  // precision means "use the configured number of decimals".
  private precisionOf(indicator) {
    return indicator?.precision === null ? undefined : indicator?.precision;
  }

  private toLocalDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}
