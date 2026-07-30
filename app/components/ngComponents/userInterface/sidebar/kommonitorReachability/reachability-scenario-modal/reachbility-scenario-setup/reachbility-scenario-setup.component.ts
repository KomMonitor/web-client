import { UserFavourites } from 'components/ngComponents/models/favorites.models';

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ReachabilityStateService } from 'services/reachability-state-service/reachability-state.service';
import { ColorPickerDirective } from 'ngx-color-picker';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';

@Component({
  standalone: true,
  selector: 'app-reachbility-scenario-setup',
  templateUrl: './reachbility-scenario-setup.component.html',
  styleUrls: ['./reachbility-scenario-setup.component.scss'],
  imports: [FormsModule],
})
export class ReachbilityScenarioSetupComponent implements OnInit {
  protected reachabilityStateService = inject(ReachabilityStateService);
  private broadcastService = inject(BroadcastService);

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.reachabilityStateService.reachabilityMapSubject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.scenarioState) {
          this.importScenarioFromQuickSetup();
        }
      });
  }

  importScenarioFromQuickSetup() {
    this.reachabilityStateService.settings.selectedStartPointLayer =
      this.reachabilityStateService.selectedStartPointLayer;
    this.reachabilityStateService.settings.isochroneConfig.selectedDate =
      this.reachabilityStateService.selectedStartDate;

    if (this.reachabilityStateService.settings.selectedStartPointLayer) {
      if (
        this.reachabilityStateService.settings.selectedStartPointLayer
          .isNewReachabilityDataSource ||
        this.reachabilityStateService.settings.selectedStartPointLayer.isTmpDataLayer
      ) {
        this.initPoiResourceEditFeaturesMenu();
      } else {
        this.fetchPoiResourceGeoJSON();
      }
    }
  }

  onChangePoiResource() {
    this.reachabilityStateService.settings.selectedStartPointLayer =
      this.reachabilityStateService.selectedStartPointLayer;

    if (!this.reachabilityStateService.settings.selectedStartPointLayer) {
      return;
    }

    if (
      this.reachabilityStateService.poiDataset &&
      this.reachabilityStateService.poiDataset.poiName &&
      this.reachabilityStateService.settings?.selectedStartPointLayer &&
      this.reachabilityStateService.poiDataset.poiName !=
        this.reachabilityStateService.settings.selectedStartPointLayer.datasetName
    ) {
      //kommonitorToastHelperService.displayWarningToast("Datenquelle neu gesetzt", "Die weiteren Abschnitte weisen vielleicht veraltete Daten auf.");
    }

    // if emtpy layer is selected then no features can be fetched at all!
    if (
      this.reachabilityStateService.settings.selectedStartPointLayer.isNewReachabilityDataSource ||
      this.reachabilityStateService.settings.selectedStartPointLayer.isTmpDataLayer
    ) {
      // if tmp datalayer has been selected we assume that there are features already in property .geoJSON
      if (this.reachabilityStateService.settings.selectedStartPointLayer.isTmpDataLayer) {
        this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON_reachability =
          this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON;
      }

      // init geoMap with empty dataset
      this.initPoiResourceEditFeaturesMenu();
      return;
    }

    if (!this.reachabilityStateService.settings.isochroneConfig.selectedDate) {
      this.reachabilityStateService.settings.isochroneConfig.selectedDate =
        this.reachabilityStateService.settings.selectedStartPointLayer?.availablePeriodsOfValidity[
          this.reachabilityStateService.settings.selectedStartPointLayer.availablePeriodsOfValidity
            .length - 1
        ].startDate;
    }

    this.reachabilityStateService.prepAvailablePeriods();
    this.reachabilityStateService.selectedStartDate =
      this.reachabilityStateService.filteredAvailablePeriodsOfValidity.at(0).startDate;
    this.reachabilityStateService.settings.isochroneConfig.selectedDate =
      this.reachabilityStateService.filteredAvailablePeriodsOfValidity.at(0).startDate;

    this.fetchPoiResourceGeoJSON();
  }

  compareLayers(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.georesourceId === o2.georesourceId : o1 === o2;
  }

  fetchPoiResourceGeoJSON() {
    this.reachabilityStateService.fetchPoiResourceGeoJSON(false);
    this.initPoiResourceEditFeaturesMenu();
  }

  initPoiResourceEditFeaturesMenu() {
    // check if empty dataset for a new POI dataset has been selected
    // if so, no features can be fetched from KomMonitor Database as thex do not exist
    // then we must init feature edit component with empty dataset!
    let isReachabilityDatasetOnly = false;

    if (
      this.reachabilityStateService.settings.selectedStartPointLayer.isNewReachabilityDataSource ||
      this.reachabilityStateService.settings.selectedStartPointLayer.isTmpDataLayer
    ) {
      isReachabilityDatasetOnly = true;
      // check if geoJSON is available
      // is required by editFeature component
      if (!this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON) {
        this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON =
          this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON_reachability;
      }
    }

    this.broadcastService.broadcast(BroadcastMessage.OnEditGeoresourceFeatures, [
      this.reachabilityStateService.settings.selectedStartPointLayer,
      isReachabilityDatasetOnly,
    ]);
  }
}
