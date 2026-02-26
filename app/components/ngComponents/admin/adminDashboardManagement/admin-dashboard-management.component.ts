import { Component, OnInit, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { CommonModule } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import * as echarts from "echarts/core";
import type { EChartsOption, TooltipComponentOption } from "echarts";

import { SmallBoxComponent } from "./small-box/small-box.component";
import { AdminContentViewComponent } from "../admin-content-view/admin-content-view.component";

import { NgxEchartsDirective, provideEchartsCore } from "ngx-echarts";

interface PieSeriesDataItem {
  name: string;
  value: number;
}

const PIE_EMPHASIS = {
  itemStyle: {
    shadowBlur: 10,
    shadowOffsetX: 0,
    shadowColor: "rgba(0, 0, 0, 0.5)",
  },
};

const PIE_TOOLTIP: TooltipComponentOption = {
  trigger: "item",
  confine: true,
  formatter: "{a} <br/>{b} : {c} ({d}%)",
  textStyle: { fontSize: 12 },
};

const PIE_LABEL = { position: "inner" as const };

const FALLBACK_TIMEOUT_MS = 5_000;

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
  color: string,
): EChartsOption {
  return {
    title: { text: title, left: "center", show: true, top: 15 },
    tooltip: PIE_TOOLTIP,
    series: [
      {
        name: title,
        type: "pie",
        radius: "90%",
        center: ["50%", "50%"],
        data,
        itemStyle: { color, shadowBlur: 20, shadowColor: "rgba(0, 0, 0, 0.5)" },
        emphasis: PIE_EMPHASIS,
        label: PIE_LABEL,
      },
    ],
  };
}

/** Maps a georesource to its geometry type key. */
function georesourceTypeOf(georesource: any): "POI" | "LOI" | "AOI" {
  if (georesource.isLOI) return "LOI";
  if (georesource.isAOI) return "AOI";
  return "POI";
}

const GEORESOURCE_TYPE_I18N: Record<string, string> = {
  POI: "ADMIN_DASHBOARD.POINTS_OF_INTEREST",
  LOI: "ADMIN_DASHBOARD.LINES_OF_INTEREST",
  AOI: "ADMIN_DASHBOARD.AREAS_OF_INTEREST",
};

@Component({
  selector: "admin-dashboard-management",
  templateUrl: "./admin-dashboard-management.component.html",
  styleUrls: ["./admin-dashboard-management.component.css"],
  imports: [
    SmallBoxComponent,
    TranslateModule,
    CommonModule,
    NgxEchartsDirective,
    AdminContentViewComponent,
  ],
  providers: [provideEchartsCore({ echarts })],
  standalone: true,
})
export class AdminDashboardManagementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  loadingData = true;

  organisationCount = "0";
  topicCounts = "0/0";
  topicsLabel = "";
  indicatorCount = "";
  georesourceCount = "";
  spatialUnitCount = "";
  indicatorScriptCount = "";

  indicatorsPerTopicChartOptions: EChartsOption | null = null;
  georesourcesPerTypeChartOptions: EChartsOption | null = null;
  indicatorsPerSpatialUnitChartOptions: EChartsOption | null = null;

  private initializationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private broadcastService: BroadcastService,
    private translateService: TranslateService,
    protected dataExchange: DataExchangeService,
  ) {}

  ngOnInit(): void {
    this.setupBroadcastListeners();
    this.setupLanguageChangeListener();

    this.tryInitialize();

    // Fallback in case broadcast events never fire
    this.initializationTimeout = setTimeout(() => {
      this.tryInitialize();
    }, FALLBACK_TIMEOUT_MS);

    this.destroyRef.onDestroy(() => this.clearTimeout());
  }

  private tryInitialize(): void {
    if (this.isDataAvailable()) {
      this.refreshDashboard();
      this.clearTimeout();
    }
  }

  private isDataAvailable(): boolean {
    const d = this.dataExchange;
    return !!(
      d?.availableTopics?.length &&
      d.availableIndicators &&
      d.availableGeoresources &&
      d.availableSpatialUnits
    );
  }

  private clearTimeout(): void {
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }
  }

  private setupBroadcastListeners(): void {
    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg) => {
        switch (msg.msg) {
          case "refreshAdminDashboardDiagrams":
            this.refreshDashboard();
            break;
          case "initialMetadataLoadingFailed":
            this.loadingData = false;
            this.clearTimeout();
            break;
          case "initialMetadataLoadingCompleted":
            this.clearTimeout();
            setTimeout(() => this.refreshDashboard(), 250);
            break;
        }
      });
  }

  private setupLanguageChangeListener(): void {
    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isDataAvailable()) {
          this.refreshDashboard();
        }
      });
  }

  refreshDashboard(): void {
    if (!this.isDataAvailable()) {
      this.loadingData = false;
      return;
    }

    try {
      this.updateDisplayValues();
      this.updateChartOptions();
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      this.loadingData = false;
    }
  }

  private updateDisplayValues(): void {
    const d = this.dataExchange;

    this.organisationCount = String(d.accessControl?.length ?? 0);
    this.indicatorCount = String(d.availableIndicators?.length ?? 0);
    this.georesourceCount = String(d.availableGeoresources?.length ?? 0);
    this.spatialUnitCount = String(d.availableSpatialUnits?.length ?? 0);
    this.indicatorScriptCount = String(d.availableProcessScripts?.length ?? 0);

    const mainTopics = d.availableTopics.filter(
      (t: any) => t.topicType === "main",
    );
    const subTopics = collectSubTopics(mainTopics);

    this.topicCounts = `${mainTopics.length}/${subTopics.length}`;
    this.topicsLabel = [
      this.translateService.instant("ADMIN_DASHBOARD.MAIN_TOPICS"),
      this.translateService.instant("ADMIN_DASHBOARD.SUB_TOPICS"),
    ].join("/");
  }

  private updateChartOptions(): void {
    this.indicatorsPerTopicChartOptions = this.buildIndicatorsPerTopicChart();
    this.georesourcesPerTypeChartOptions = this.buildGeoresourcesPerTypeChart();
    this.indicatorsPerSpatialUnitChartOptions =
      this.buildIndicatorsPerSpatialUnitChart();
  }

  private buildIndicatorsPerTopicChart(): EChartsOption {
    const data: PieSeriesDataItem[] = (
      this.dataExchange.topicIndicatorHierarchy ?? []
    )
      .filter((t: any) => t.indicatorCount > 0)
      .map((t: any) => ({ name: t.topicName, value: t.indicatorCount }));

    return buildPieChartOptions(
      this.translateService.instant("ADMIN_DASHBOARD.INDICATORS_PER_TOPIC"),
      data,
      "#00a65b",
    );
  }

  private buildGeoresourcesPerTypeChart(): EChartsOption {
    const countMap = new Map<string, number>();

    for (const geo of this.dataExchange.availableGeoresources ?? []) {
      const type = georesourceTypeOf(geo);
      countMap.set(type, (countMap.get(type) ?? 0) + 1);
    }

    const data: PieSeriesDataItem[] = ["POI", "LOI", "AOI"]
      .filter((key) => countMap.has(key))
      .map((key) => ({
        name: this.translateService.instant(GEORESOURCE_TYPE_I18N[key]),
        value: countMap.get(key)!,
      }));

    return buildPieChartOptions(
      this.translateService.instant("ADMIN_DASHBOARD.GEORESOURCES_PER_TYPE"),
      data,
      "#ff851b",
    );
  }

  private buildIndicatorsPerSpatialUnitChart(): EChartsOption {
    const countMap = new Map<string, number>();

    for (const indicator of this.dataExchange.availableIndicators ?? []) {
      for (const su of indicator.applicableSpatialUnits ?? []) {
        const name: string = su.spatialUnitName;
        countMap.set(name, (countMap.get(name) ?? 0) + 1);
      }
    }

    const data: PieSeriesDataItem[] = (
      this.dataExchange.availableSpatialUnits ?? []
    )
      .filter((su: any) => countMap.has(su.spatialUnitLevel))
      .map((su: any) => ({
        name: su.spatialUnitLevel,
        value: countMap.get(su.spatialUnitLevel)!,
      }));

    return buildPieChartOptions(
      this.translateService.instant(
        "ADMIN_DASHBOARD.INDICATORS_PER_SPATIAL_UNIT",
      ),
      data,
      "#337ab7",
    );
  }
}
