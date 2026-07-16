import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { IndicatorMetadataTooltipComponent } from 'components/ngComponents/customElements/indicator-metadata-tooltip/indicator-metadata-tooltip.component';
import {
  IndicatorsDataset,
  IndicatorsTopicsHierarchy,
} from 'components/ngComponents/models/indicators.models';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MapService } from 'services/map-service/map.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { MetadataFilterService } from 'services/metadata-filter-service/metadata-filter.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { TopicOrderMode } from '../../../admin/adminTopicsManagement/admin-topics-management.component';
import { AdminTopicsManagementService } from '../../../admin/adminTopicsManagement/admin-topics-management.service';
import { ExportItemCheckboxComponent } from '../../exporting/export-item-checkbox/export-item-checkbox.component';
import { Indicator } from '../../exporting/models';
import { ExportModeService } from './export-mode.service';
import { FavoritesStateService } from './favorites-state.service';
import { FavoritesTabComponent } from './favoritesTab/favorites-tab.component';
import { KommonitorDataSetupService } from './kommonitor-data-setup.service';
import { TopicTreeComponent } from './topicTree/topic-tree.component';

@Component({
  selector: 'app-kommonitor-data-setup',
  templateUrl: './kommonitor-data-setup.component.html',
  styleUrls: ['./kommonitor-data-setup.component.scss'],
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
  selectedIndicatorBackup!: IndicatorsDataset;
  private metadataBootstrap = inject(MetadataBootstrapService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  protected readonly selectionState = inject(SelectionStateService);
  protected readonly topicHierarchyStore = inject(TopicHierarchyStoreService);
  private readonly metadataFilterService = inject(MetadataFilterService);
  private readonly spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private readonly indicatorStore = inject(IndicatorMetadataStoreService);
  private readonly broadcastService = inject(BroadcastService);
  private readonly elementVisibilityHelperService = inject(ElementVisibilityHelperService);
  private readonly mapService = inject(MapService);
  private readonly dataSetupService = inject(KommonitorDataSetupService);
  protected readonly exportModeService = inject(ExportModeService);
  protected readonly favStateService = inject(FavoritesStateService);
  private readonly adminTopicsManagementService = inject(AdminTopicsManagementService);
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
      .getOrderMode('indicator')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => (this.topicSorting = res));

    this.mapService.mapCommand$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((command) => {
      if (command.type === 'changeSpatialUnit') this.onChangeSelectedSpatialUnit();
    });

    this.metadataBootstrap.metadataLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value == MetadataLoadingState.COMPLETE) this.onInitialMetadataLoadingComplete();
      });

    this.mapService.dateSlider$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (value.selected) this.onChangeDateSliderItem(value.selected);
    });

    this.selectionState.selectedDate$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.changeIndicatorDate();
    });

    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const msg = res.msg;
        const values: any = res.values;

        switch (msg) {
          case 'updateIndicatorOgcServices':
            this.dataSetupService.updateIndicatorOgcServices(values);
            break;
        }
      });
  }

  onInitialMetadataLoadingComplete() {
    console.log('Load an initial example indicator');

    this.mapService.resetMapRefreshState();

    this.preppedIndicatorTopics = this.dataSetupService.prepareIndicatorTopicsRecursive(
      this.topicHierarchyStore.topicIndicatorHierarchy,
      this.topicSorting
    );
    this.preppedKeywordList = this.dataSetupService.prepareKeywordFilteredList();

    this.prepareHeadlineIndicatorTopics();

    if (
      this.indicatorStore.displayableIndicators == null ||
      this.indicatorStore.displayableIndicators == undefined ||
      this.indicatorStore.displayableIndicators.length === 0
    ) {
      console.error('Kein darstellbarer Indikator konnte gefunden werden.');

      this.mapErrorNotificationService.displayMapApplicationError(
        'Kein darstellbarer Indikator konnte gefunden werden.'
      );
      this.loadingData = false;

      this.mapService.hideLoadingIcon();

      return;
    }

    try {
      let indicatorIndex: number | undefined = undefined;

      for (let index = 0; index < this.indicatorStore.displayableIndicators.length; index++) {
        if (
          this.indicatorStore.displayableIndicators[index].indicatorId ===
          this.envConfigService.initialIndicatorId
        ) {
          if (this.indicatorStore.displayableIndicators[index].applicableDates.length > 0) {
            indicatorIndex = index;
            break;
          }
        }
      }

      if (indicatorIndex === undefined) {
        for (let t = 0; t < 75; t++) {
          const randIndex = this.dataSetupService.getRandomInt(
            0,
            this.indicatorStore.displayableIndicators.length - 1
          );
          if (this.indicatorStore.displayableIndicators[randIndex].applicableDates.length > 0) {
            indicatorIndex = randIndex;
            break;
          }
        }
      }

      if (indicatorIndex === undefined) {
        throw Error();
      }

      this.selectionState.selectedIndicator =
        this.indicatorStore.displayableIndicators[indicatorIndex];
      // create Backup which is used when currently selected indicator is filtered out in select
      this.selectedIndicatorBackup = this.selectionState.selectedIndicator;

      // set spatialUnit
      for (const spatialUnitEntry of this.spatialUnitStore.availableSpatialUnits) {
        if (spatialUnitEntry.spatialUnitLevel === this.envConfigService.initialSpatialUnitName) {
          this.selectionState.selectedSpatialUnit = spatialUnitEntry;
          break;
        }
      }
      if (!this.selectionState.selectedSpatialUnit) {
        this.selectionState.selectedSpatialUnit =
          this.dataSetupService.getFirstSpatialUnitForSelectedIndicator();
      }

      this.onChangeSelectedIndicator(this.envConfigService.centerMapInitially);
    } catch (error) {
      console.error('Initiales Darstellen eines Indikators ist gescheitert.');

      this.mapErrorNotificationService.displayMapApplicationError(
        'Initiales Darstellen eines Indikators ist gescheitert.'
      );
      this.loadingData = false;
      this.mapService.hideLoadingIcon();

      return;
    }

    //reinit visibility of elements due to fact that now some HTML elements are actually available
    this.elementVisibilityHelperService.initElementVisibility();

    this.favStateService.initFromUserInfo();

    setTimeout(() => {
      if (this.elementVisibilityHelperService.elementVisibility.favSelection === true)
        this.favStateService.showFavSelection = true;
    }, 1000);

    this.favStateService.indicatorFavTopicsTree = this.dataSetupService.prepTopicsTree(
      this.topicHierarchyStore.topicIndicatorHierarchy,
      0,
      undefined
    );
  }

  prepareHeadlineIndicatorTopics() {
    this.topicHierarchyStore.headlineIndicatorHierarchy.forEach((elem: any) => {
      if (!this.headlineTopicsCollapsed.includes(elem.headlineIndicator.indicatorId))
        this.headlineTopicsCollapsed.push(elem.headlineIndicator.indicatorId);
    });
  }

  onHeadlineTopicClick(topicID: string) {
    if (this.headlineTopicsCollapsed.includes(topicID))
      this.headlineTopicsCollapsed = this.headlineTopicsCollapsed.filter((e) => e != topicID);
    else this.headlineTopicsCollapsed.push(topicID);
  }

  onClickHierarchyIndicator(indicatorMetadata) {
    this.selectionState.selectedIndicator = indicatorMetadata;
    this.onChangeSelectedIndicator(false);
  }

  toExportIndicator(indicator: IndicatorsDataset): Indicator {
    return this.dataSetupService.toExportIndicator(indicator);
  }

  setupDateSliderForIndicator() {
    const availableDates = this.selectionState.selectedIndicator.applicableDates;
    this.selectionState.selectedDate = availableDates[availableDates.length - 1];
    const dates = this.selectionState.selectedIndicator.applicableDates.map((e) => new Date(e));

    this.mapService.setDateSliderValues({
      data: dates,
      selected: dates[dates.length - 1],
    });
  }

  onChangeIndicatorFilter() {
    this.metadataFilterService.onChangeIndicatorKeywordFilter(this.indicatorNameFilter);

    this.preppedIndicatorTopics = this.dataSetupService.prepareIndicatorTopicsRecursive(
      this.topicHierarchyStore.topicIndicatorHierarchy,
      this.topicSorting
    );
  }

  setupDatePickerForIndicator() {
    const availableDates = this.selectionState.selectedIndicator.applicableDates;
    this.date = availableDates[availableDates.length - 1];
    this.selectedDate = availableDates[availableDates.length - 1];
    this.selectionState.selectedDate = availableDates[availableDates.length - 1];

    const ngbDates = this.dataSetupService.prepNgbDates(availableDates);
    this.broadcastService.broadcast(BroadcastMessage.UpdateDatePickerAvailableDates, [ngbDates]);
    this.broadcastService.broadcast(BroadcastMessage.UpdateDatePickerSelectedDate, [
      ngbDates[ngbDates.length - 1],
    ]);
  }

  onChangeDateSliderItem(data: Date) {
    if (!this.changeIndicatorWasClicked && this.selectionState.selectedIndicator) {
      this.selectedDate = data.toISOString().split('T')[0];
      this.date = this.selectedDate;
      this.selectionState.selectedDate = this.selectedDate;

      const preppedDate = this.dataSetupService.prepNgbDates([this.selectionState.selectedDate])[0];
      this.broadcastService.broadcast(BroadcastMessage.UpdateDatePickerSelectedDate, [preppedDate]);

      if (this.applyMeasureOfValueUpdate()) {
        this.broadcastService.broadcast(BroadcastMessage.SelectedIndicatorDateHasChanged);
      }
    }
  }

  private applyMeasureOfValueUpdate(): boolean {
    this.loadingData = true;
    this.mapService.showLoadingIcon();

    try {
      this.tryUpdateMeasureOfValueBarForIndicator();
    } catch (error) {
      console.error(error);
      this.loadingData = false;
      this.mapService.hideLoadingIcon();
      this.mapErrorNotificationService.displayMapApplicationError(error);
      return false;
    }

    this.dataSetupService.modifyExports(false);

    if (this.envConfigService.useNoDataToggle) {
      this.broadcastService.broadcast(BroadcastMessage.ApplyNoDataDisplay);
    }

    this.loadingData = false;
    this.mapService.hideLoadingIcon();
    return true;
  }

  tryUpdateMeasureOfValueBarForIndicator() {
    this.dataSetupService.fetchIndicatorGeoJson(this.date).subscribe({
      next: (response: any) => {
        this.selectionState.selectedIndicator.geoJSON = response;
        this.broadcastService.broadcast(BroadcastMessage.UpdateMeasureOfValueBar, [
          this.date,
          this.selectionState.selectedIndicator,
        ]);
      },
      error: (error) => {
        this.loadingData = false;
        this.mapErrorNotificationService.displayMapApplicationError(error);
        this.mapService.hideLoadingIcon();
      },
    });
  }

  changeIndicatorDate() {
    if (this.selectionState.selectedIndicator && this.selectionState.selectedDate) {
      this.date = this.selectionState.selectedDate;
      this.selectedDate = this.selectionState.selectedDate;

      if (this.applyMeasureOfValueUpdate()) {
        this.broadcastService.broadcast(BroadcastMessage.SelectedIndicatorDateHasChanged);
      }
    }
  }

  onChangeSelectedSpatialUnit() {
    if (!this.changeIndicatorWasClicked && this.selectionState.selectedIndicator) {
      this.applyMeasureOfValueUpdate();
    }
  }

  handleWmsOnMap(dataset): void {
    this.dataSetupService.handleWmsOnMap(dataset);
  }

  onChangeSelectedIndicator_fromAlphabeticalList(dataset) {
    if (dataset.listType == 'indicator') {
      this.selectionState.selectedIndicator = dataset;
      this.onChangeSelectedIndicator(false);
    } else {
      dataset.isSelected = !dataset.isSelected;
      this.dataSetupService.handleWmsOnMap(dataset);
    }
  }

  getIndicatorFeatures() {
    this.dataSetupService.fetchIndicatorGeoJson(this.date).subscribe({
      next: (response: any) => {
        this.selectionState.selectedIndicator.geoJSON = response;
        this.mapService.setMapRefreshValues({
          indicator: this.selectionState.selectedIndicator,
          spatialUnit: this.selectionState.selectedSpatialUnit.spatialUnitLevel,
          date: this.selectionState.selectedDate,
          justRestyling: false,
          customComputation: false,
        });
      },
      error: (error) => {
        this.loadingData = false;
        // Hide the map's loading overlay too; onChangeSelectedIndicator showed it
        // via "showLoadingIconOnMap" and the success path only clears it after the
        // map renders, so without this the overlay stays stuck on a load failure.
        this.mapService.hideLoadingIcon();
        this.mapErrorNotificationService.displayMapApplicationError(error);
      },
    });
  }

  onChangeSelectedIndicator(recenterMap) {
    this.broadcastService.broadcast(BroadcastMessage.OnChangeSelectedIndicator);

    if (this.selectionState.selectedIndicator) {
      this.loadingData = true;
      this.mapService.showLoadingIcon();

      this.changeIndicatorWasClicked = true;

      this.selectedIndicatorBackup = this.selectionState.selectedIndicator;

      this.selectionState.setSelectedDate(
        this.selectionState.selectedIndicator.applicableDates.at(-1)
      );

      this.setupDateSliderForIndicator();
      this.setupDatePickerForIndicator();

      if (
        !this.selectionState.selectedSpatialUnit ||
        !this.selectionState.selectedIndicator.applicableSpatialUnits.some(
          (o) => o.spatialUnitName === this.selectionState.selectedSpatialUnit.spatialUnitLevel
        )
      ) {
        this.selectionState.selectedSpatialUnit =
          this.dataSetupService.getFirstSpatialUnitForSelectedIndicator();
      }

      try {
        this.getIndicatorFeatures();
      } catch (error) {
        console.error(error);
        this.loadingData = false;
        this.mapService.hideLoadingIcon();

        this.mapErrorNotificationService.displayMapApplicationError(error);
        return;
      }

      this.broadcastService.broadcast(BroadcastMessage.DisableBalance);

      this.dataSetupService.modifyExports(true);

      if (this.envConfigService.useNoDataToggle) {
        this.broadcastService.broadcast(BroadcastMessage.ApplyNoDataDisplay);
      }

      this.loadingData = false;

      if (recenterMap) {
        this.mapService.setMapRecenterState({ recenter: true });
      }

      this.changeIndicatorWasClicked = false;
    } else {
      if (this.selectedIndicatorBackup) {
        this.selectionState.selectedIndicator = this.selectedIndicatorBackup;
      }
    }
    this.broadcastService.broadcast(BroadcastMessage.SelectedIndicatorDateHasChanged);
  }
}
