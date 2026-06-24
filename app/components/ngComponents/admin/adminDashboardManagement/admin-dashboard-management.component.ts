import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { EChartsOption, TooltipComponentOption } from 'echarts';
import * as echarts from 'echarts';

import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { SmallBoxComponent } from './small-box/small-box.component';

import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { BroadcastService } from '../../../../services/broadcast-service/broadcast.service';
import { MetadataLoadingState } from '../../../../services/data-exchange-service/data-exchange.constants';
import { DataExchangeService } from '../../../../services/data-exchange-service/data-exchange.service';
import { ProcessScriptMetadataStoreService } from '../../../../services/process-script-metadata-store-service/process-script-metadata-store.service';
import { SpatialUnitMetadataStoreService } from '../../../../services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicMetadataStoreService } from '../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { IndicatorMetadataStoreService } from '../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';

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
  const result: any[] = [];
  for (const topic of topics) {
    if (topic.subTopics?.length) {
      for (const sub of topic.subTopics) {
        result.push(sub);
        result.push(...collectSubTopics([sub]));
      }
    }
  }
  return result;
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
export class AdminDashboardManagementComponent implements OnInit {
  private broadcastService = inject(BroadcastService);
  private translateService = inject(TranslateService);
  protected dataExchange = inject(DataExchangeService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);

  private readonly destroyRef = inject(DestroyRef);

  loadingData = signal(true);

  organisationCount = signal('0');
  topicCounts = signal('0/0');
  topicsLabel = signal('');
  indicatorCount = signal('');
  georesourceCount = signal('');
  spatialUnitCount = signal('');
  indicatorScriptCount = signal('');

  indicatorsPerTopicChartOptions = signal<EChartsOption | null>(null);
  georesourcesPerTypeChartOptions = signal<EChartsOption | null>(null);
  indicatorsPerSpatialUnitChartOptions = signal<EChartsOption | null>(null);

  ngOnInit(): void {
    this.dataExchange.metadataLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state === MetadataLoadingState.COMPLETE) {
          this.refreshDashboard();
        } else if (state === MetadataLoadingState.ERROR) {
          this.loadingData.set(false);
        }
      });

    // Refresh the diagrams after admin CRUD operations broadcast a change.
    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg) => {
        if (msg.msg === 'refreshAdminDashboardDiagrams') {
          this.refreshDashboard();
        }
      });

    this.setupLanguageChangeListener();
  }

  private setupLanguageChangeListener(): void {
    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshDashboard());
  }

  refreshDashboard(): void {
    // Writing the signals below is enough to (re-)render: even though this runs
    // downstream of awaited Keycloak/cache promises that may resolve outside the
    // Angular zone, signal writes notify Angular's reactive scheduler, which
    // schedules change detection itself — no NgZone / detectChanges() required.
    try {
      this.updateDisplayValues();
      this.updateChartOptions();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      this.loadingData.set(false);
    }
  }

  private updateDisplayValues(): void {
    const d = this.dataExchange;

    this.organisationCount.set(String(d.accessControl?.length ?? 0));
    this.indicatorCount.set(String(this.indicatorStore.availableIndicators?.length ?? 0));
    this.georesourceCount.set(String(d.availableGeoresources?.length ?? 0));
    this.spatialUnitCount.set(String(this.spatialUnitStore.availableSpatialUnits?.length ?? 0));
    this.indicatorScriptCount.set(String(this.processScriptStore.availableProcessScripts?.length ?? 0));

    const mainTopics = (this.topicStore.availableTopics ?? []).filter((t: any) => t.topicType === 'main');
    const subTopics = collectSubTopics(mainTopics);

    this.topicCounts.set(`${mainTopics.length}/${subTopics.length}`);
    this.topicsLabel.set(
      [
        this.translateService.instant('ADMIN_DASHBOARD.MAIN_TOPICS'),
        this.translateService.instant('ADMIN_DASHBOARD.SUB_TOPICS'),
      ].join('/')
    );
  }

  private updateChartOptions(): void {
    this.indicatorsPerTopicChartOptions.set(this.buildIndicatorsPerTopicChart());
    this.georesourcesPerTypeChartOptions.set(this.buildGeoresourcesPerTypeChart());
    this.indicatorsPerSpatialUnitChartOptions.set(this.buildIndicatorsPerSpatialUnitChart());
  }

  private buildIndicatorsPerTopicChart(): EChartsOption {
    const data: PieSeriesDataItem[] = (this.dataExchange.topicIndicatorHierarchy ?? [])
      .filter((t: any) => t.indicatorCount > 0)
      .map((t: any) => ({ name: t.topicName, value: t.indicatorCount }));

    return buildPieChartOptions(
      this.translateService.instant('ADMIN_DASHBOARD.INDICATORS_PER_TOPIC'),
      data,
      '#00a65b'
    );
  }

  private buildGeoresourcesPerTypeChart(): EChartsOption {
    const countMap = new Map<string, number>();

    for (const geo of this.dataExchange.availableGeoresources ?? []) {
      const type = georesourceTypeOf(geo);
      countMap.set(type, (countMap.get(type) ?? 0) + 1);
    }

    const data: PieSeriesDataItem[] = ['POI', 'LOI', 'AOI']
      .filter((key) => countMap.has(key))
      .map((key) => ({
        name: this.translateService.instant(GEORESOURCE_TYPE_I18N[key]),
        value: countMap.get(key)!,
      }));

    return buildPieChartOptions(
      this.translateService.instant('ADMIN_DASHBOARD.GEORESOURCES_PER_TYPE'),
      data,
      '#ff851b'
    );
  }

  private buildIndicatorsPerSpatialUnitChart(): EChartsOption {
    const countMap = new Map<string, number>();

    for (const indicator of this.indicatorStore.availableIndicators ?? []) {
      for (const su of indicator.applicableSpatialUnits ?? []) {
        const name: string = su.spatialUnitName;
        countMap.set(name, (countMap.get(name) ?? 0) + 1);
      }
    }

    const data: PieSeriesDataItem[] = (this.spatialUnitStore.availableSpatialUnits ?? [])
      .filter((su: any) => countMap.has(su.spatialUnitLevel))
      .map((su: any) => ({
        name: su.spatialUnitLevel,
        value: countMap.get(su.spatialUnitLevel)!,
      }));

    return buildPieChartOptions(
      this.translateService.instant('ADMIN_DASHBOARD.INDICATORS_PER_SPATIAL_UNIT'),
      data,
      '#337ab7'
    );
  }
}
