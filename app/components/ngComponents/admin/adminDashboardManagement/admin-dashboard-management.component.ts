import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { EChartsOption, TooltipComponentOption } from 'echarts';
import * as echarts from 'echarts';

import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { SmallBoxComponent } from './small-box/small-box.component';

import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { AccessControlService } from '../../../../services/access-control-service/access-control.service';
import { GeoresourceMetadataStoreService } from '../../../../services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from '../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessScriptMetadataStoreService } from '../../../../services/process-script-metadata-store-service/process-script-metadata-store.service';
import { SpatialUnitMetadataStoreService } from '../../../../services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicHierarchyStoreService } from '../../../../services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { TopicMetadataStoreService } from '../../../../services/topic-metadata-store-service/topic-metadata-store.service';

interface PieSeriesDataItem {
  name: string;
  value: number;
}

const PIE_EMPHASIS = {
  itemStyle: {
    shadowBlur: 10,
    shadowOffsetX: 0,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
  },
};

const PIE_TOOLTIP: TooltipComponentOption = {
  trigger: 'item',
  confine: true,
  formatter: '{a} <br/>{b} : {c} ({d}%)',
  textStyle: { fontSize: 12 },
};

const PIE_LABEL = { position: 'inner' as const };

// Hides labels that would collide instead of stacking them on top of each other.
const PIE_LABEL_LAYOUT = { hideOverlap: true };

const BAR_TOOLTIP: TooltipComponentOption = {
  trigger: 'item',
  confine: true,
  formatter: '{b}: {c}',
  textStyle: { fontSize: 12 },
};

/**
 * How many spatial units the ranked bar chart shows. The tail of the
 * distribution is a long flat run of ones that carries no information but
 * would triple the chart's height.
 */
const TOP_N_SPATIAL_UNITS = 15;

/** Recursively collects all sub-topics from a topic tree. */
function collectSubTopics(topics: any[]): any[] {
  return topics.flatMap((topic) =>
    (topic.subTopics ?? []).flatMap((sub: any) => [sub, ...collectSubTopics([sub])])
  );
}

/** Counts items by a derived string key. */
function countBy<T>(items: T[], keyOf: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Builds a standard ECharts pie-chart option object.
 *
 * Deliberately carries no `title`: chart headings are rendered as real HTML
 * above the canvas. ECharts centres and then clips its own title, which cut the
 * heading off at both ends once the column got narrow.
 */
function buildPieChartOptions(
  seriesName: string,
  data: PieSeriesDataItem[],
  color: string
): EChartsOption {
  return {
    tooltip: PIE_TOOLTIP,
    series: [
      {
        name: seriesName,
        type: 'pie',
        // Kept well under the container so the pie does not visually dwarf the
        // bar charts sitting next to it in the same row.
        radius: '62%',
        center: ['50%', '50%'],
        data,
        itemStyle: { color, shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        emphasis: PIE_EMPHASIS,
        label: PIE_LABEL,
        labelLayout: PIE_LABEL_LAYOUT,
      },
    ],
  };
}

/**
 * Builds a horizontal bar chart for ranked category counts.
 *
 * Used where a pie would be unreadable: with more than a handful of slices the
 * inner labels overlap into an illegible pile. Expects `data` pre-sorted
 * descending; the category axis is inverted so the largest bar sits on top.
 */
function buildBarChartOptions(
  seriesName: string,
  data: PieSeriesDataItem[],
  color: string
): EChartsOption {
  return {
    tooltip: BAR_TOOLTIP,
    grid: { left: 4, right: 36, top: 4, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 11 },
      splitLine: { lineStyle: { color: '#eee' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: data.map((item) => item.name),
      axisTick: { show: false },
      // Long spatial-unit names get truncated rather than widening the plot
      // area away from the bars; the full name stays available in the tooltip.
      axisLabel: { fontSize: 11, width: 120, overflow: 'truncate' },
    },
    series: [
      {
        name: seriesName,
        type: 'bar',
        data: data.map((item) => item.value),
        itemStyle: { color },
        barMaxWidth: 18,
        label: { show: true, position: 'right', fontSize: 11 },
      },
    ],
  };
}

/** Maps a georesource to its geometry type key. */
function georesourceTypeOf(georesource: any): 'POI' | 'LOI' | 'AOI' {
  if (georesource.isLOI) return 'LOI';
  if (georesource.isAOI) return 'AOI';
  return 'POI';
}

const GEORESOURCE_TYPE_I18N: Record<string, string> = {
  POI: 'ADMIN_DASHBOARD.POINTS_OF_INTEREST',
  LOI: 'ADMIN_DASHBOARD.LINES_OF_INTEREST',
  AOI: 'ADMIN_DASHBOARD.AREAS_OF_INTEREST',
};

@Component({
  selector: 'app-admin-dashboard-management',
  templateUrl: './admin-dashboard-management.component.html',
  styleUrls: ['./admin-dashboard-management.component.scss'],
  imports: [SmallBoxComponent, TranslateModule, NgxEchartsDirective, AdminContentViewComponent],
  providers: [provideEchartsCore({ echarts })],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardManagementComponent {
  private translateService = inject(TranslateService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private topicHierarchyStore = inject(TopicHierarchyStoreService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private accessControlService = inject(AccessControlService);

  // Tracks language switches AND async translation-bundle loading, so translation-dependent
  // computeds re-run once translations become available or change. onLangChange alone does not
  // fire on the initial async i18n load, which would otherwise leave titles stuck as raw keys.
  private translationsReady = toSignal(
    merge(
      this.translateService.onLangChange,
      this.translateService.onDefaultLangChange,
      this.translateService.onTranslationChange
    )
  );

  // All values below are derived directly from the signal-backed metadata stores: they
  // re-render automatically when store data changes (admin CRUD) or the language switches —
  // no manual refresh, broadcast subscription, or NgZone handling required.

  organisationCount = computed(() => String(this.accessControlService.accessControl?.length ?? 0));
  indicatorCount = computed(() => String(this.indicatorStore.availableIndicators?.length ?? 0));
  georesourceCount = computed(() =>
    String(this.georesourceStore.availableGeoresources?.length ?? 0)
  );
  spatialUnitCount = computed(() =>
    String(this.spatialUnitStore.availableSpatialUnits?.length ?? 0)
  );
  indicatorScriptCount = computed(() =>
    String(this.processScriptStore.availableProcessScripts?.length ?? 0)
  );

  private mainTopics = computed(() =>
    (this.topicStore.availableTopics ?? []).filter((t: any) => t.topicType === 'main')
  );
  topicCounts = computed(() => {
    const main = this.mainTopics();
    return `${main.length}/${collectSubTopics(main).length}`;
  });

  indicatorsPerTopicChartOptions = computed<EChartsOption>(() => {
    const data: PieSeriesDataItem[] = (this.topicHierarchyStore.topicIndicatorHierarchy ?? [])
      .filter((t: any) => t.indicatorCount > 0)
      .map((t: any) => ({ name: t.topicName, value: t.indicatorCount }));

    return buildBarChartOptions(
      this.t('ADMIN_DASHBOARD.INDICATORS_PER_TOPIC'),
      data.sort((a, b) => b.value - a.value),
      '#00a65b'
    );
  });

  georesourcesPerTypeChartOptions = computed<EChartsOption>(() => {
    const countMap = countBy(this.georesourceStore.availableGeoresources ?? [], georesourceTypeOf);

    const data: PieSeriesDataItem[] = ['POI', 'LOI', 'AOI']
      .filter((key) => countMap.has(key))
      .map((key) => ({
        name: this.t(GEORESOURCE_TYPE_I18N[key]),
        value: countMap.get(key)!,
      }));

    return buildPieChartOptions(this.t('ADMIN_DASHBOARD.GEORESOURCES_PER_TYPE'), data, '#ff851b');
  });

  /** All spatial units that carry at least one indicator, ranked descending. */
  private indicatorsPerSpatialUnitData = computed<PieSeriesDataItem[]>(() => {
    const countMap = countBy(
      (this.indicatorStore.availableIndicators ?? []).flatMap(
        (indicator: any) => indicator.applicableSpatialUnits ?? []
      ),
      (su: any) => su.spatialUnitName
    );

    return (this.spatialUnitStore.availableSpatialUnits ?? [])
      .filter((su: any) => countMap.has(su.spatialUnitLevel))
      .map((su: any) => ({
        name: su.spatialUnitLevel,
        value: countMap.get(su.spatialUnitLevel)!,
      }))
      .sort((a, b) => b.value - a.value);
  });

  /** Drives the "(Top n)" suffix on the heading, so truncation stays visible. */
  spatialUnitChartTopN = TOP_N_SPATIAL_UNITS;
  isSpatialUnitChartTruncated = computed(
    () => this.indicatorsPerSpatialUnitData().length > TOP_N_SPATIAL_UNITS
  );

  indicatorsPerSpatialUnitChartOptions = computed<EChartsOption>(() =>
    buildBarChartOptions(
      this.t('ADMIN_DASHBOARD.INDICATORS_PER_SPATIAL_UNIT'),
      this.indicatorsPerSpatialUnitData().slice(0, TOP_N_SPATIAL_UNITS),
      '#337ab7'
    )
  );

  /** Translate a key while tracking language changes so dependent computeds re-run on switch. */
  private t(key: string): string {
    this.translationsReady();
    return this.translateService.instant(key);
  }
}
