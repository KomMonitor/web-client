import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as echarts from 'echarts';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { MapService } from 'services/map-service/map.service';
import {
  BalancePeriod,
  BalanceService,
  BalanceStatistics,
} from 'services/balance-service/balance.service';
import * as noUiSlider from 'nouislider';

import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Component({
  selector: 'app-kommonitor-balance',
  templateUrl: './kommonitor-balance.component.html',
  styleUrls: ['./kommonitor-balance.component.scss'],
  standalone: true,
  imports: [FormsModule, ExpandableBoxComponent],
})
export class KommonitorBalanceComponent implements AfterViewInit, OnDestroy {
  protected chartDisplayState = inject(ChartDisplayStateService);
  private selectionState = inject(SelectionStateService);
  private broadcastService = inject(BroadcastService);
  private filterHelperService = inject(FilterHelperService);
  private mapService = inject(MapService);
  private balanceService = inject(BalanceService);
  protected envConfigService = inject(EnvConfigService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly sliderElement = viewChild.required<ElementRef<HTMLElement>>('rangeSlider');
  private readonly trendChartElement = viewChild.required<ElementRef<HTMLElement>>('trendChart');

  // After view init: the slider needs its element, and both broadcasts drive the slider.
  ngAfterViewInit(): void {
    this.setupSlider();

    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ msg, values }) => {
        switch (msg) {
          case BroadcastMessage.UpdateBalanceSlider:
            this.setupRangeSliderForBalance(values as any);
            break;
          case BroadcastMessage.DisableBalance:
            this.disableBalance();
            break;
        }
      });
  }

  targetDate;
  // The applicable dates the slider was built for; its values are indices into this.
  sliderDates: string[] = [];

  trendChart_allFeatures;
  trendAnalysis_allFeatures?: BalanceStatistics;
  balanceColor = '';
  unit = '';
  trendOption;
  // Shown above the slider and kept current while a handle is dragged.
  periodLabel?: { from: string; to: string };

  balanceSlider;
  config: any = {
    behaviour: 'drag',
    connect: true,
    range: {
      min: 0,
      max: 100,
    },
    start: [0, 100],
    keyboard: true,
    pips: {
      mode: 'range',
      density: 2,
      values: 4,
      stepped: true,
    },
  };

  private trendChartResizeObserver?: ResizeObserver;

  setupSlider() {
    this.balanceSlider = this.sliderElement().nativeElement;
    noUiSlider.create(this.balanceSlider, this.config);

    // Registered once here: updateOptions() keeps listeners, so registering on
    // every indicator change would recompute the balance once per past change.
    // Event type "end" because "set" fires constantly while the slider is re-initialised.
    this.balanceSlider.noUiSlider.on('end', () => {
      this.onChangeBalanceRange(this.getSelectedPeriod());
    });
    // Cheap enough for every move; "end" above does the actual recomputation.
    this.balanceSlider.noUiSlider.on('update', () => this.updatePeriodLabel());
  }

  private updatePeriodLabel() {
    if (!this.sliderDates.length || !this.selectionState.selectedIndicator) {
      return;
    }
    const period = this.getSelectedPeriod();
    this.periodLabel = {
      from: this.balanceService.formatShortDate(period.from),
      to: this.balanceService.formatShortDate(period.to),
    };
  }

  ngOnDestroy(): void {
    this.trendChartResizeObserver?.disconnect();
    this.trendChart_allFeatures?.dispose();
  }

  // Panel state only; the app config merely decides whether the trend line starts switched on.
  trendConfig_allFeatures = {
    showMinMax: true,
    showCompleteTimeseries: true,
    showTrend: this.envConfigService.enableBilanceTrend,
    trendComputationType: 'linear',
  };

  disableBalance() {
    this.chartDisplayState.isBalanceChecked = false;
    if (this.balanceSlider) {
      this.createNewBalanceInstance();
    }
  }

  onChangeUseBalance() {
    if (this.chartDisplayState.isMeasureOfValueChecked) {
      this.chartDisplayState.isMeasureOfValueChecked = false;
    }

    if (this.chartDisplayState.isBalanceChecked) {
      this.chartDisplayState.isMeasureOfValueChecked = false;
      this.envConfigService.classifyUsingWholeTimeseries = false;
      this.balanceSlider.noUiSlider.enable();

      // disable DateSlider / picker on map
      this.mapService.setDateSliderValues({ disabled: true });
      this.selectionState.disableIndicatorDatePicker = true;

      const period = this.getSelectedPeriod();
      this.computeAndSetBalance(period);
      setTimeout(() => {
        this.updateTrendChart(this.selectionState.selectedIndicator, period);
      });
    } else {
      this.balanceSlider.noUiSlider.disable();

      // re-enable DateSlider on map
      this.mapService.setDateSliderValues({ disabled: false });
    }
    // do not replace dataset directly, but check if any filter can be applied when changing balance mode for the current dataset
    this.filterHelperService.filterAndReplaceDataset();
  }

  updateTrendChart(indicatorMetadata, period: BalancePeriod) {
    const chartContainer = this.trendChartElement().nativeElement;

    // explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
    this.trendChart_allFeatures?.dispose();
    this.trendChart_allFeatures = echarts.init(chartContainer);

    if (!this.trendChartResizeObserver) {
      this.trendChartResizeObserver = new ResizeObserver(() =>
        this.trendChart_allFeatures?.resize()
      );
      this.trendChartResizeObserver.observe(chartContainer);
    }

    this.trendOption = this.balanceService.makeTrendChartOptions(
      indicatorMetadata,
      this.selectionState.selectedSpatialUnit?.spatialUnitLevel,
      period,
      this.trendConfig_allFeatures,
      true
    );
    this.trendChart_allFeatures.setOption(this.trendOption);
    this.trendChart_allFeatures.hideLoading();

    // The chart may show the complete series; the statistics describe the period.
    const meanValues = this.balanceService.valuesInPeriod(
      this.trendOption.series[0].data,
      this.trendOption.xAxis.data,
      period
    );
    this.trendAnalysis_allFeatures = this.balanceService.computeStatistics(
      meanValues,
      indicatorMetadata
    );
    this.balanceColor = this.balanceService.directionColor(
      this.trendAnalysis_allFeatures.direction
    );
    this.unit = indicatorMetadata.unit ?? '';
  }

  // The period the slider handles select, snapped onto the selected indicator's dates.
  getSelectedPeriod(): BalancePeriod {
    const [fromIndex, toIndex] = this.balanceSlider.noUiSlider.get(true);
    return this.balanceService.resolvePeriod(
      this.sliderDates,
      Math.round(fromIndex),
      Math.round(toIndex),
      this.selectionState.selectedIndicator.applicableDates
    );
  }

  createNewBalanceInstance() {
    const applicableDates: string[] = this.selectionState.selectedIndicator.applicableDates;
    this.sliderDates = [...applicableDates];
    // Numeric on purpose: the slider tooltips sit centred on the handles and a
    // spelled-out month made them stick out of the panel at both ends.
    const dateLabels = applicableDates.map((date) => this.balanceService.formatShortDate(date));
    // With one date per year (all on the same day), the year alone is the
    // meaningful scale label; the tooltips still show the full date.
    const isYearly = new Set(applicableDates.map((date) => date.slice(5))).size === 1;
    const pipLabels = isYearly ? applicableDates.map((date) => date.slice(0, 4)) : dateLabels;
    // Slider values are date indices. Formatted labels map back via their
    // position; raw numbers (e.g. the start values) pass through as indices.
    const labelToIndex = (value) => {
      const index = dateLabels.indexOf(String(value));
      return index >= 0 ? index : Number(value);
    };

    this.balanceSlider.noUiSlider.updateOptions({
      range: {
        min: 0, // index from
        max: applicableDates.length - 1, // index to
      },
      start: [0, applicableDates.length - 1],
      step: 1,
      tooltips: true,
      format: {
        to: (value) => dateLabels[Math.round(value)],
        from: labelToIndex,
      },
      pips: {
        mode: 'range',
        density: 25,
        format: {
          to: (value) => pipLabels[Math.round(value)],
          from: labelToIndex,
        },
      },
    });

    if (!this.chartDisplayState.isBalanceChecked) {
      // deactivate balance slider
      this.balanceSlider.noUiSlider.disable();
    }
  }

  setupRangeSliderForBalance([date]) {
    this.targetDate = date;

    // Rebuild the slider unless a balance of this very indicator is already set up.
    const balanceIndicator = this.chartDisplayState.indicatorAndMetadataAsBalance;
    if (
      !balanceIndicator ||
      balanceIndicator.indicatorName !== this.selectionState.selectedIndicator.indicatorName
    ) {
      this.createNewBalanceInstance();
    }
  }

  onChangeBalanceRange(period: BalancePeriod) {
    // create balance GeoJSON and broadcast "replaceIndicatorAsGeoJSON"
    // Called every time handle position is changed

    this.computeAndSetBalance(period);

    setTimeout(() => {
      this.updateTrendChart(this.selectionState.selectedIndicator, period);
    });
    // replaceIndicatorGeoJSON, not restyle: the feature values themselves have changed
    this.mapService.replaceIndicatorGeoJSON(
      this.chartDisplayState.indicatorAndMetadataAsBalance,
      this.selectionState.selectedSpatialUnit.spatialUnitLevel,
      this.targetDate,
      true
    );
  }

  computeAndSetBalance(period: BalancePeriod) {
    this.chartDisplayState.indicatorAndMetadataAsBalance = this.balanceService.makeBalanceIndicator(
      this.selectionState.selectedIndicator,
      period,
      this.targetDate
    );
  }

  onChangeTrendConfig() {
    const period = this.getSelectedPeriod();
    setTimeout(() => {
      this.updateTrendChart(this.selectionState.selectedIndicator, period);
    });
  }
}
