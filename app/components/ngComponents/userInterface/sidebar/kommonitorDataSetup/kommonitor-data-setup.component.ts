import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { SpatialUnitMetadataStoreService } from "services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service";
import { ElementVisibilityHelperService } from "services/element-visibility-helper-service/element-visibility-helper.service";
import { MapService } from "services/map-service/map.service";
import { IndicatorsTopicsHierarchy } from "components/ngComponents/models/indicators.models";
import { AdminTopicsManagementService } from "../../../admin/adminTopicsManagement/admin-topics-management.service";
import { TopicOrderMode } from "../../../admin/adminTopicsManagement/admin-topics-management.component";
import { IndicatorMetadataTooltipComponent } from "components/ngComponents/customElements/indicator-metadata-tooltip/indicator-metadata-tooltip.component";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import { EnvConfigService } from "services/env-config-service/env-config.service";
import { MetadataLoadingState } from "services/data-exchange-service/data-exchange.constants";
import { FavoritesTabComponent } from "./favoritesTab/favorites-tab.component";
import { TopicTreeComponent } from "./topicTree/topic-tree.component";
import { KommonitorDataSetupService } from "./kommonitor-data-setup.service";
import { ExportModeService } from "./export-mode.service";
import { FavoritesStateService } from "./favorites-state.service";
import { ExportItemCheckboxComponent } from "../../exporting/export-item-checkbox/export-item-checkbox.component";
import { Indicator } from "../../exporting/models";
import { IndicatorsDataset } from "components/ngComponents/models/indicators.models";

@Component({
  selector: "app-kommonitor-data-setup",
  templateUrl: "./kommonitor-data-setup.component.html",
  styleUrls: ["./kommonitor-data-setup.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IndicatorMetadataTooltipComponent,
    ExpandableBoxComponent,
    FavoritesTabComponent,
    TopicTreeComponent,
    ExportItemCheckboxComponent,
  ],
})
export class KommonitorDataSetupComponent implements OnInit {
  protected readonly dataExchangeService = inject(DataExchangeService);
  private readonly spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private readonly broadcastService = inject(BroadcastService);
  private readonly elementVisibilityHelperService = inject(
    ElementVisibilityHelperService,
  );
  private readonly mapService = inject(MapService);
  private readonly dataSetupService = inject(KommonitorDataSetupService);
  protected readonly exportModeService = inject(ExportModeService);
  protected readonly favStateService = inject(FavoritesStateService);
  private readonly adminTopicsManagementService = inject(
    AdminTopicsManagementService,
  );
  private readonly envConfigService = inject(EnvConfigService);
  private readonly destroyRef = inject(DestroyRef);

  headlineTopicsCollapsed: string[] = [];

  loadingData = true;
  changeIndicatorWasClicked = false;
  date!: any;

  indicatorNameFilter = undefined;

  selectedDate;

  preppedIndicatorTopics: IndicatorsTopicsHierarchy[] = [];
  preppedKeywordList: any[] = [];
  topicSorting: TopicOrderMode | undefined;

  ngOnInit(): void {
    this.adminTopicsManagementService
      .getOrderMode("indicator")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => (this.topicSorting = res));

    this.dataExchangeService.metadataLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value == MetadataLoadingState.COMPLETE)
          this.onInitialMetadataLoadingComplete();
      });

    this.mapService.dateSlider$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.selected) this.onChangeDateSliderItem(value.selected);
      });

    this.dataExchangeService.selectedDate$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.changeIndicatorDate();
      });

    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const msg = res.msg;
        const values: any = res.values;

        switch (msg) {
          case "changeSpatialUnit":
            this.onChangeSelectedSpatialUnit();
            break;
          case "updateIndicatorOgcServices":
            this.dataSetupService.updateIndicatorOgcServices(values);
            break;
          case "LIKEinitialMetadataLoadingCompleted":
            this.onInitialMetadataLoadingComplete();
            break;
        }
      });
  }

  onInitialMetadataLoadingComplete() {
    console.log("Load an initial example indicator");

    this.mapService.resetMapRefreshState();

    this.preppedIndicatorTopics =
      this.dataSetupService.prepareIndicatorTopicsRecursive(
        this.dataExchangeService.topicIndicatorHierarchy,
        this.topicSorting,
      );
    this.preppedKeywordList =
      this.dataSetupService.prepareKeywordFilteredList();

    this.prepareHeadlineIndicatorTopics();

    if (
      this.dataExchangeService.displayableIndicators == null ||
      this.dataExchangeService.displayableIndicators == undefined ||
      this.dataExchangeService.displayableIndicators.length === 0
    ) {
      console.error("Kein darstellbarer Indikator konnte gefunden werden.");

      this.dataExchangeService.displayMapApplicationError(
        "Kein darstellbarer Indikator konnte gefunden werden.",
      );
      this.loadingData = false;

      this.broadcastService.broadcast("hideLoadingIconOnMap");

      return;
    }

    try {
      let indicatorIndex: number | undefined = undefined;

      for (
        let index = 0;
        index < this.dataExchangeService.displayableIndicators.length;
        index++
      ) {
        if (
          this.dataExchangeService.displayableIndicators[index].indicatorId ===
          this.envConfigService.initialIndicatorId
        ) {
          if (
            this.dataExchangeService.displayableIndicators[index]
              .applicableDates.length > 0
          ) {
            indicatorIndex = index;
            break;
          }
        }
      }

      if (indicatorIndex === undefined) {
        for (let t = 0; t < 75; t++) {
          const randIndex = this.dataSetupService.getRandomInt(
            0,
            this.dataExchangeService.displayableIndicators.length - 1,
          );
          if (
            this.dataExchangeService.displayableIndicators[randIndex]
              .applicableDates.length > 0
          ) {
            indicatorIndex = randIndex;
            break;
          }
        }
      }

      if (indicatorIndex === undefined) {
        throw Error();
      }

      this.dataExchangeService.selectedIndicator =
        this.dataExchangeService.displayableIndicators[indicatorIndex];
      // create Backup which is used when currently selected indicator is filtered out in select
      this.dataExchangeService.selectedIndicatorBackup =
        this.dataExchangeService.selectedIndicator;

      // set spatialUnit
      for (const spatialUnitEntry of this.spatialUnitStore
        .availableSpatialUnits) {
        if (
          spatialUnitEntry.spatialUnitLevel ===
          this.envConfigService.initialSpatialUnitName
        ) {
          this.dataExchangeService.selectedSpatialUnit = spatialUnitEntry;
          break;
        }
      }
      if (!this.dataExchangeService.selectedSpatialUnit) {
        this.dataExchangeService.selectedSpatialUnit =
          this.dataSetupService.getFirstSpatialUnitForSelectedIndicator();
      }

      this.onChangeSelectedIndicator(this.envConfigService.centerMapInitially);
    } catch (error) {
      console.error("Initiales Darstellen eines Indikators ist gescheitert.");

      this.dataExchangeService.displayMapApplicationError(
        "Initiales Darstellen eines Indikators ist gescheitert.",
      );
      this.loadingData = false;
      this.broadcastService.broadcast("hideLoadingIconOnMap");

      return;
    }

    //reinit visibility of elements due to fact that now some HTML elements are actually available
    this.elementVisibilityHelperService.initElementVisibility();

    this.favStateService.initFromUserInfo();

    setTimeout(() => {
      if (
        this.elementVisibilityHelperService.elementVisibility.favSelection ===
        true
      )
        this.favStateService.showFavSelection = true;
    }, 1000);

    this.favStateService.indicatorFavTopicsTree =
      this.dataSetupService.prepTopicsTree(
        this.dataExchangeService.topicIndicatorHierarchy,
        0,
        undefined,
      );
  }

  prepareHeadlineIndicatorTopics() {
    this.dataExchangeService.headlineIndicatorHierarchy.forEach((elem: any) => {
      if (
        !this.headlineTopicsCollapsed.includes(
          elem.headlineIndicator.indicatorId,
        )
      )
        this.headlineTopicsCollapsed.push(elem.headlineIndicator.indicatorId);
    });
  }

  onHeadlineTopicClick(topicID: string) {
    if (this.headlineTopicsCollapsed.includes(topicID))
      this.headlineTopicsCollapsed = this.headlineTopicsCollapsed.filter(
        (e) => e != topicID,
      );
    else this.headlineTopicsCollapsed.push(topicID);
  }

  onClickHierarchyIndicator(indicatorMetadata) {
    this.dataExchangeService.selectedIndicator = indicatorMetadata;
    this.onChangeSelectedIndicator(false);
  }

  toExportIndicator(indicator: IndicatorsDataset): Indicator {
    return this.dataSetupService.toExportIndicator(indicator);
  }

  setupDateSliderForIndicator() {
    const availableDates =
      this.dataExchangeService.selectedIndicator.applicableDates;
    this.dataExchangeService.selectedDate =
      availableDates[availableDates.length - 1];
    const dates =
      this.dataExchangeService.selectedIndicator.applicableDates.map(
        (e) => new Date(e),
      );

    this.mapService.setDateSliderValues({
      data: dates,
      selected: dates[dates.length - 1],
    });
  }

  onChangeIndicatorFilter() {
    this.dataExchangeService.onChangeIndicatorKeywordFilter(
      this.indicatorNameFilter,
    );

    this.preppedIndicatorTopics =
      this.dataSetupService.prepareIndicatorTopicsRecursive(
        this.dataExchangeService.topicIndicatorHierarchy,
        this.topicSorting,
      );
  }

  setupDatePickerForIndicator() {
    const availableDates =
      this.dataExchangeService.selectedIndicator.applicableDates;
    this.date = availableDates[availableDates.length - 1];
    this.selectedDate = availableDates[availableDates.length - 1];
    this.dataExchangeService.selectedDate =
      availableDates[availableDates.length - 1];

    const ngbDates = this.dataSetupService.prepNgbDates(availableDates);
    this.broadcastService.broadcast("updateDatePickerAvailableDates", [
      ngbDates,
    ]);
    this.broadcastService.broadcast("updateDatePickerSelectedDate", [
      ngbDates[ngbDates.length - 1],
    ]);
  }

  onChangeDateSliderItem(data: Date) {
    if (
      !this.changeIndicatorWasClicked &&
      this.dataExchangeService.selectedIndicator
    ) {
      this.selectedDate = data.toISOString().split("T")[0];
      this.date = this.selectedDate;
      this.dataExchangeService.selectedDate = this.selectedDate;

      const preppedDate = this.dataSetupService.prepNgbDates([
        this.dataExchangeService.selectedDate,
      ])[0];
      this.broadcastService.broadcast("updateDatePickerSelectedDate", [
        preppedDate,
      ]);

      if (this.applyMeasureOfValueUpdate()) {
        this.broadcastService.broadcast("selectedIndicatorDateHasChanged");
      }
    }
  }

  private applyMeasureOfValueUpdate(): boolean {
    this.loadingData = true;
    this.broadcastService.broadcast("showLoadingIconOnMap");

    try {
      this.tryUpdateMeasureOfValueBarForIndicator();
    } catch (error) {
      console.error(error);
      this.loadingData = false;
      this.broadcastService.broadcast("hideLoadingIconOnMap");
      this.dataExchangeService.displayMapApplicationError(error);
      return false;
    }

    this.dataSetupService.modifyExports(false);

    if (this.envConfigService.useNoDataToggle) {
      this.broadcastService.broadcast("applyNoDataDisplay");
    }

    this.loadingData = false;
    this.broadcastService.broadcast("hideLoadingIconOnMap");
    return true;
  }

  tryUpdateMeasureOfValueBarForIndicator() {
    this.dataSetupService.fetchIndicatorGeoJson(this.date).subscribe({
      next: (response: any) => {
        this.dataExchangeService.selectedIndicator.geoJSON = response;
        this.broadcastService.broadcast("updateMeasureOfValueBar", [
          this.date,
          this.dataExchangeService.selectedIndicator,
        ]);
      },
      error: (error) => {
        this.loadingData = false;
        this.dataExchangeService.displayMapApplicationError(error);
        this.broadcastService.broadcast("hideLoadingIconOnMap");
      },
    });
  }

  changeIndicatorDate() {
    if (
      this.dataExchangeService.selectedIndicator &&
      this.dataExchangeService.selectedDate
    ) {
      this.date = this.dataExchangeService.selectedDate;
      this.selectedDate = this.dataExchangeService.selectedDate;

      if (this.applyMeasureOfValueUpdate()) {
        this.broadcastService.broadcast("selectedIndicatorDateHasChanged");
      }
    }
  }

  onChangeSelectedSpatialUnit() {
    if (
      !this.changeIndicatorWasClicked &&
      this.dataExchangeService.selectedIndicator
    ) {
      this.applyMeasureOfValueUpdate();
    }
  }

  handleWmsOnMap(dataset): void {
    this.dataSetupService.handleWmsOnMap(dataset);
  }

  onChangeSelectedIndicator_fromAlphabeticalList(dataset) {
    if (dataset.listType == "indicator") {
      this.dataExchangeService.selectedIndicator = dataset;
      this.onChangeSelectedIndicator(false);
    } else {
      dataset.isSelected = !dataset.isSelected;
      this.dataSetupService.handleWmsOnMap(dataset);
    }
  }

  getIndicatorFeatures() {
    this.dataSetupService.fetchIndicatorGeoJson(this.date).subscribe({
      next: (response: any) => {
        this.dataExchangeService.selectedIndicator.geoJSON = response;
        this.mapService.setMapRefreshValues({
          indicator: this.dataExchangeService.selectedIndicator,
          spatialUnit:
            this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel,
          date: this.dataExchangeService.selectedDate,
          justRestyling: false,
          customComputation: false,
        });
      },
      error: (error) => {
        this.loadingData = false;
        this.dataExchangeService.displayMapApplicationError(error);
      },
    });
  }

  onChangeSelectedIndicator(recenterMap) {
    this.broadcastService.broadcast("onChangeSelectedIndicator");

    if (this.dataExchangeService.selectedIndicator) {
      this.loadingData = true;
      this.broadcastService.broadcast("showLoadingIconOnMap");

      this.changeIndicatorWasClicked = true;

      this.dataExchangeService.selectedIndicatorBackup =
        this.dataExchangeService.selectedIndicator;

      this.dataExchangeService.setSelectedDate(
        this.dataExchangeService.selectedIndicator.applicableDates.at(-1),
      );

      this.setupDateSliderForIndicator();
      this.setupDatePickerForIndicator();

      if (
        !this.dataExchangeService.selectedSpatialUnit ||
        !this.dataExchangeService.selectedIndicator.applicableSpatialUnits.some(
          (o) =>
            o.spatialUnitName ===
            this.dataExchangeService.selectedSpatialUnit.spatialUnitLevel,
        )
      ) {
        this.dataExchangeService.selectedSpatialUnit =
          this.dataSetupService.getFirstSpatialUnitForSelectedIndicator();
      }

      try {
        this.getIndicatorFeatures();
      } catch (error) {
        console.error(error);
        this.loadingData = false;
        this.broadcastService.broadcast("hideLoadingIconOnMap");

        this.dataExchangeService.displayMapApplicationError(error);
        return;
      }

      this.broadcastService.broadcast("DisableBalance");

      this.dataSetupService.modifyExports(true);

      if (this.envConfigService.useNoDataToggle) {
        this.broadcastService.broadcast("applyNoDataDisplay");
      }

      this.loadingData = false;

      if (recenterMap) {
        this.mapService.setMapRecenterState({ recenter: true });
      }

      this.changeIndicatorWasClicked = false;
    } else {
      if (this.dataExchangeService.selectedIndicatorBackup) {
        this.dataExchangeService.selectedIndicator =
          this.dataExchangeService.selectedIndicatorBackup;
      }
    }
    this.broadcastService.broadcast("selectedIndicatorDateHasChanged");
  }
}
