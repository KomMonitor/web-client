import { Component, Inject, OnInit, NgZone, OnDestroy } from "@angular/core";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { CommonModule, DOCUMENT } from "@angular/common";
import { Subscription } from "rxjs";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import * as echarts from "echarts";
import { SmallBoxComponent } from "./small-box/small-box.component";
declare const $: any;

@Component({
  selector: "admin-dashboard-management-new",
  templateUrl: "./admin-dashboard-management.component.html",
  styleUrls: ["./admin-dashboard-management.component.css"],
  imports: [SmallBoxComponent, TranslateModule, CommonModule],
  standalone: true,
})
export class AdminDashboardManagementComponent implements OnInit, OnDestroy {
  loadingData = true;
  numberOfMainTopics = 0;
  numberOfSubTopics = 0;

  indicatorsPerTopicChart: any;
  georesourcesPerTypeChart: any;
  indicatorsPerSpatialUnitChart: any;

  indicatorsPerTopicChartOptions: any;
  georesourcesPerTypeChartOptions: any;
  indicatorsPerSpatialUnitChartOptions: any;

  pieChartTooltip = {
    trigger: 'item',
    confine: 'true',
    formatter: '{a} <br/>{b} : {c} ({d}%)',
    textStyle: { fontSize: 12 }
  };
  pieChartLabel = {
    normal: { position: 'inside', fontSize: 12 }
  };

  private subscription: Subscription | undefined;
  private initializationTimeout: any;

  constructor(
    private broadcastService: BroadcastService,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document,
    private translateService: TranslateService,
    protected kommonitorDataExchangeService: DataExchangeService
  ) {
    console.log('AdminDashboardManagementComponent constructor initialized');
  }

  ngOnInit(): void {
    console.log('AdminDashboardManagementComponent ngOnInit');
    this.loadingData = true;
    
    // initialize any adminLTE box widgets
    /* ($('.box') as any).boxWidget(); */
    
    this.initCharts();
    this.setupEventListeners();
    this.setupBroadcastListeners();
    this.setupLanguageChangeListener();
    
    // Check if data is already available and initialize immediately
    this.checkDataAvailabilityAndInitialize();
    
    // Fallback timeout in case no events are fired
    this.initializationTimeout = setTimeout(() => {
      console.log('Fallback: Initializing dashboard after timeout');
      this.checkDataAvailabilityAndInitialize();
    }, 5000); // 5 second fallback
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
    }
  }

  getIndicatorScriptCount(): string {
    return this.kommonitorDataExchangeService.availableProcessScripts
      ? this.kommonitorDataExchangeService.availableProcessScripts.length.toString()
      : "";
  }

  getOrganisationCount(): string {
    return this.kommonitorDataExchangeService.accessControl
      ? this.kommonitorDataExchangeService.accessControl.length.toString()
      : "0";
  }

  getTopicCounts(): string {
    return `${this.numberOfMainTopics}/${this.numberOfSubTopics}`;
  }

  getTopicsLabel(): string {
    return `${this.translateService.instant("ADMIN_DASHBOARD.MAIN_TOPICS")}/${this.translateService.instant("ADMIN_DASHBOARD.SUB_TOPICS")}`;
  }

  getIndicatorCount(): string {
    return this.kommonitorDataExchangeService.availableIndicators
      ? this.kommonitorDataExchangeService.availableIndicators.length.toString()
      : "";
  }

  getGeoresourceCount(): string {
    return this.kommonitorDataExchangeService.availableGeoresources
      ? this.kommonitorDataExchangeService.availableGeoresources.length.toString()
      : "";
  }

  getSpatialUnitCount(): string {
    return this.kommonitorDataExchangeService.availableSpatialUnits
      ? this.kommonitorDataExchangeService.availableSpatialUnits.length.toString()
      : "";
  }

  private checkDataAvailabilityAndInitialize(): void {
    // Check if required data is available
    if (this.isDataAvailable()) {
      console.log('Data is available, initializing dashboard');
      this.refreshAdminDashboardDiagrams();
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
      }
    } else {
      console.log('Data not yet available, waiting for events...');
    }
  }

  private isDataAvailable(): boolean {
    return this.kommonitorDataExchangeService &&
           this.kommonitorDataExchangeService.availableTopics &&
           this.kommonitorDataExchangeService.availableTopics.length > 0 &&
           this.kommonitorDataExchangeService.availableIndicators &&
           this.kommonitorDataExchangeService.availableIndicators.length >= 0 &&
           this.kommonitorDataExchangeService.availableGeoresources &&
           this.kommonitorDataExchangeService.availableGeoresources.length >= 0 &&
           this.kommonitorDataExchangeService.availableSpatialUnits &&
           this.kommonitorDataExchangeService.availableSpatialUnits.length >= 0;
  }

  private setupBroadcastListeners(): void {
    this.subscription = this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      if (broadcastMsg.msg === 'refreshAdminDashboardDiagrams') {
        console.log("refresh admin charts");
        this.refreshAdminDashboardDiagrams();
      } else if (broadcastMsg.msg === 'initialMetadataLoadingFailed') {
        console.log("Metadata loading failed");
        this.loadingData = false;
        if (this.initializationTimeout) {
          clearTimeout(this.initializationTimeout);
        }
      } else if (broadcastMsg.msg === 'initialMetadataLoadingCompleted') {
        console.log("refresh admin overview");
        if (this.initializationTimeout) {
          clearTimeout(this.initializationTimeout);
        }
        setTimeout(() => {
          this.refreshAdminDashboardDiagrams();
        }, 250);
      }
    });
  }

  private setupLanguageChangeListener(): void {
    this.translateService.onLangChange.subscribe(() => {
      console.log('Language changed, refreshing dashboard charts');
      if (this.isDataAvailable()) {
        this.refreshAdminDashboardDiagrams();
      }
    });
  }

  private initCharts(): void {
    this.indicatorsPerTopicChart = echarts.init(this.document.getElementById('indicatorsPerTopicDiagram'));
    this.georesourcesPerTypeChart = echarts.init(this.document.getElementById('georesourcesPerTypeDiagram'));
    this.indicatorsPerSpatialUnitChart = echarts.init(this.document.getElementById('indicatorsPerSpatialUnitDiagram'));
    this.indicatorsPerTopicChart.showLoading();
    this.georesourcesPerTypeChart.showLoading();
    this.indicatorsPerSpatialUnitChart.showLoading();
  }

  private setupEventListeners(): void {
    $(window).on('resize', () => {
      this.ngZone.runOutsideAngular(() => {
        if (this.indicatorsPerTopicChart) this.indicatorsPerTopicChart.resize();
        if (this.georesourcesPerTypeChart) this.georesourcesPerTypeChart.resize();
        if (this.indicatorsPerSpatialUnitChart) this.indicatorsPerSpatialUnitChart.resize();
      });
    });
  }

  refreshAdminDashboardDiagrams(): void {
    try {
      console.log('Refreshing admin dashboard diagrams');
      
      if (!this.isDataAvailable()) {
        console.warn('Data not available for dashboard refresh');
        this.loadingData = false;
        return;
      }

      const mainTopics: any[] = [];
      let subTopics: any[] = [];
      
      this.kommonitorDataExchangeService.availableTopics.forEach((topic: any) => {
        if (topic.topicType === 'main') {
          mainTopics.push(topic);
        }
      });
      
      subTopics = this.addSubTopics(mainTopics, subTopics);
      this.numberOfMainTopics = mainTopics.length;
      this.numberOfSubTopics = subTopics.length;
      
      this.updateCharts();
      this.loadingData = false;
      
      console.log('Dashboard refresh completed');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      this.loadingData = false;
    }
  }

  private addSubTopics(mainTopics: any[], subTopics: any[]): any[] {
    for (const mainTopic of mainTopics) {
      if (mainTopic.subTopics && mainTopic.subTopics.length > 0) {
        for (const subTopic of mainTopic.subTopics) {
          subTopics.push(subTopic);
          if (subTopic.subTopics && subTopic.subTopics.length > 0) {
            subTopics = this.addSubTopics(subTopic.subTopics, subTopics);
          }
        }
      }
    }
    return subTopics;
  }

  private updateCharts(): void {
    this.updateIndicatorsPerTopicChart();
    this.updateGeoresourcesPerTypeChart();
    this.updateIndicatorsPerSpatialUnitChart();
  }

  private updateIndicatorsPerTopicChart(): void {
    try {
      this.indicatorsPerTopicChart.showLoading();
      const indicatorsPerTopicSeriesData: any[] = [];
      
      if (this.kommonitorDataExchangeService.topicIndicatorHierarchy) {
        this.kommonitorDataExchangeService.topicIndicatorHierarchy.forEach((mainTopic: any) => {
          if (mainTopic.indicatorCount > 0) {
            indicatorsPerTopicSeriesData.push({
              name: mainTopic.topicName,
              value: mainTopic.indicatorCount
            });
          }
        });
      }
      
      this.indicatorsPerTopicChartOptions = {
        title: {
          text: this.translateService.instant('ADMIN_DASHBOARD.INDICATORS_PER_TOPIC'),
          left: 'center',
          show: true,
          top: 15,
          fontSize: 12
        },
        tooltip: this.pieChartTooltip,
        series: [
          {
            name: this.translateService.instant('ADMIN_DASHBOARD.INDICATORS_PER_TOPIC'),
            type: 'pie',
            radius: '90%',
            center: ['50%', '50%'],
            data: indicatorsPerTopicSeriesData,
            itemStyle: {
              normal: {
                color: '#00a65b',
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              },
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: this.pieChartLabel
          }
        ]
      };
      this.indicatorsPerTopicChart.setOption(this.indicatorsPerTopicChartOptions);
      this.indicatorsPerTopicChart.hideLoading();
    } catch (error) {
      console.error('Error updating indicators per topic chart:', error);
      this.indicatorsPerTopicChart.hideLoading();
    }
  }

  private updateGeoresourcesPerTypeChart(): void {
    try {
      this.georesourcesPerTypeChart.showLoading();
      const georesourcesPerTypeMap: Map<string, number> = new Map();
      
      if (this.kommonitorDataExchangeService.availableGeoresources) {
        this.kommonitorDataExchangeService.availableGeoresources.forEach((georesource: any) => {
          let georesourceType = 'POI';
          if (georesource.isLOI) {
            georesourceType = 'LOI';
          } else if (georesource.isAOI) {
            georesourceType = 'AOI';
          }
          if (georesourcesPerTypeMap.has(georesourceType)) {
            georesourcesPerTypeMap.set(georesourceType, georesourcesPerTypeMap.get(georesourceType)! + 1);
          } else {
            georesourcesPerTypeMap.set(georesourceType, 1);
          }
        });
      }
      
      const georesourcesPerTypeSeriesData: any[] = [];
      if (georesourcesPerTypeMap.has('POI')) {
        georesourcesPerTypeSeriesData.push({ name: this.translateService.instant('ADMIN_DASHBOARD.POINTS_OF_INTEREST'), value: georesourcesPerTypeMap.get('POI') });
      }
      if (georesourcesPerTypeMap.has('LOI')) {
        georesourcesPerTypeSeriesData.push({ name: this.translateService.instant('ADMIN_DASHBOARD.LINES_OF_INTEREST'), value: georesourcesPerTypeMap.get('LOI') });
      }
      if (georesourcesPerTypeMap.has('AOI')) {
        georesourcesPerTypeSeriesData.push({ name: this.translateService.instant('ADMIN_DASHBOARD.AREAS_OF_INTEREST'), value: georesourcesPerTypeMap.get('AOI') });
      }
      
      this.georesourcesPerTypeChartOptions = {
        title: {
          text: this.translateService.instant('ADMIN_DASHBOARD.GEORESOURCES_PER_TYPE'),
          left: 'center',
          show: true,
          top: 15,
          fontSize: 12
        },
        tooltip: this.pieChartTooltip,
        series: [
          {
            name: this.translateService.instant('ADMIN_DASHBOARD.GEORESOURCES_PER_TYPE'),
            type: 'pie',
            radius: '90%',
            center: ['50%', '50%'],
            data: georesourcesPerTypeSeriesData,
            itemStyle: {
              normal: {
                color: '#ff851b',
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              },
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: this.pieChartLabel
          }
        ]
      };
      this.georesourcesPerTypeChart.setOption(this.georesourcesPerTypeChartOptions);
      this.georesourcesPerTypeChart.hideLoading();
    } catch (error) {
      console.error('Error updating georesources per type chart:', error);
      this.georesourcesPerTypeChart.hideLoading();
    }
  }

  private updateIndicatorsPerSpatialUnitChart(): void {
    try {
      this.indicatorsPerSpatialUnitChart.showLoading();
      const indicatorsPerSpatialUnitMap: Map<string, number> = new Map();
      
      if (this.kommonitorDataExchangeService.availableIndicators) {
        this.kommonitorDataExchangeService.availableIndicators.forEach((indicator: any) => {
          if (indicator.applicableSpatialUnits) {
            indicator.applicableSpatialUnits.forEach((applicableSpatialUnit: any) => {
              const spatialUnitName = applicableSpatialUnit.spatialUnitName;
              if (indicatorsPerSpatialUnitMap.has(spatialUnitName)) {
                indicatorsPerSpatialUnitMap.set(spatialUnitName, indicatorsPerSpatialUnitMap.get(spatialUnitName)! + 1);
              } else {
                indicatorsPerSpatialUnitMap.set(spatialUnitName, 1);
              }
            });
          }
        });
      }
      
      const indicatorsPerSpatialUnitSeriesData: any[] = [];
      if (this.kommonitorDataExchangeService.availableSpatialUnits) {
        this.kommonitorDataExchangeService.availableSpatialUnits.forEach((spatialUnit: any) => {
          if (indicatorsPerSpatialUnitMap.has(spatialUnit.spatialUnitLevel)) {
            indicatorsPerSpatialUnitSeriesData.push({
              name: spatialUnit.spatialUnitLevel,
              value: indicatorsPerSpatialUnitMap.get(spatialUnit.spatialUnitLevel)
            });
          }
        });
      }
      
      this.indicatorsPerSpatialUnitChartOptions = {
        title: {
          text: this.translateService.instant('ADMIN_DASHBOARD.INDICATORS_PER_SPATIAL_UNIT'),
          left: 'center',
          show: true,
          top: 15,
          fontSize: 12
        },
        tooltip: this.pieChartTooltip,
        series: [
          {
            name: this.translateService.instant('ADMIN_DASHBOARD.INDICATORS_PER_SPATIAL_UNIT'),
            type: 'pie',
            radius: '90%',
            center: ['50%', '50%'],
            data: indicatorsPerSpatialUnitSeriesData,
            itemStyle: {
              normal: {
                color: '#337ab7',
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              },
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: this.pieChartLabel
          }
        ]
      };
      this.indicatorsPerSpatialUnitChart.setOption(this.indicatorsPerSpatialUnitChartOptions);
      this.indicatorsPerSpatialUnitChart.hideLoading();
    } catch (error) {
      console.error('Error updating indicators per spatial unit chart:', error);
      this.indicatorsPerSpatialUnitChart.hideLoading();
    }
  }
} 