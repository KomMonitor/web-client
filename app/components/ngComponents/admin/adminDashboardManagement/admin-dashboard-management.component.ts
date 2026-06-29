import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

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

/** Builds a standard ECharts pie-chart option object. */
function buildPieChartOptions(
  title: string,
  data: PieSeriesDataItem[],
  color: string
): EChartsOption {
  return {
    title: { text: title, left: 'center', show: true, top: 15 },
    tooltip: PIE_TOOLTIP,
    series: [
      {
        name: title,
        type: 'pie',
        radius: '90%',
        center: ['50%', '50%'],
        data,
        itemStyle: { color, shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        emphasis: PIE_EMPHASIS,
        label: PIE_LABEL,
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

  // Tracks language switches so translation-dependent computeds re-run on change.
  private langChange = toSignal(this.translateService.onLangChange);

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
  topicsLabel = computed(() =>
    [this.t('ADMIN_DASHBOARD.MAIN_TOPICS'), this.t('ADMIN_DASHBOARD.SUB_TOPICS')].join('/')
  );

  indicatorsPerTopicChartOptions = computed<EChartsOption>(() => {
    const data: PieSeriesDataItem[] = (this.topicHierarchyStore.topicIndicatorHierarchy ?? [])
      .filter((t: any) => t.indicatorCount > 0)
      .map((t: any) => ({ name: t.topicName, value: t.indicatorCount }));

    return buildPieChartOptions(this.t('ADMIN_DASHBOARD.INDICATORS_PER_TOPIC'), data, '#00a65b');
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

  indicatorsPerSpatialUnitChartOptions = computed<EChartsOption>(() => {
    const countMap = countBy(
      (this.indicatorStore.availableIndicators ?? []).flatMap(
        (indicator: any) => indicator.applicableSpatialUnits ?? []
      ),
      (su: any) => su.spatialUnitName
    );

    const data: PieSeriesDataItem[] = (this.spatialUnitStore.availableSpatialUnits ?? [])
      .filter((su: any) => countMap.has(su.spatialUnitLevel))
      .map((su: any) => ({
        name: su.spatialUnitLevel,
        value: countMap.get(su.spatialUnitLevel)!,
      }));

    return buildPieChartOptions(
      this.t('ADMIN_DASHBOARD.INDICATORS_PER_SPATIAL_UNIT'),
      data,
      '#337ab7'
    );
  });

  /** Translate a key while tracking language changes so dependent computeds re-run on switch. */
  private t(key: string): string {
    this.langChange();
    return this.translateService.instant(key);
  }
}
