import { UserFavourites } from 'components/ngComponents/models/favorites.models';

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ReachabilityStateService } from 'services/reachability-state-service/reachability-state.service';
import { ColorPickerDirective } from 'ngx-color-picker';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';

@Component({
  standalone: true,
  selector: 'app-reachbility-scenario-setup',
  templateUrl: './reachbility-scenario-setup.component.html',
  styleUrls: ['./reachbility-scenario-setup.component.scss'],
  imports: [FormsModule, LoadingOverlayComponent],
})
export class ReachbilityScenarioSetupComponent implements OnInit {
  protected reachabilityStateService = inject(ReachabilityStateService);
  private broadcastService = inject(BroadcastService);
  private reachabilityMapHelperService = inject(ReachabilityMapHelperService);

  private readonly destroyRef = inject(DestroyRef);

  // DOM id of the interactive map showing the currently selected point data
  // source, mirroring the map used in the "Erreichbarkeit berechnen" step.
  domId = 'reachabilityScenarioSetupGeoMap';

  ngOnInit(): void {
    this.reachabilityMapHelperService.initReachabilityGeoMap(this.domId);
    // reflect whatever data source is already selected (e.g. re-opening the
    // modal on an existing scenario, or after a quick-calc import) — otherwise
    // the map would stay empty until the user changes the selection.
    this.updateMapLayer();
    // show the indicator currently selected on KomMonitor's main map as an additional
    // context layer, same as on the "Punkte bearbeiten" step
    this.reachabilityMapHelperService.replaceMainIndicatorContextLayer(this.domId);

    this.reachabilityStateService.reachabilityMapSubject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.scenarioState) {
          this.importScenarioFromQuickSetup();
        }
      });

    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((broadcastMsg) => {
        switch (broadcastMsg.msg) {
          case BroadcastMessage.ReinitScenarioSetupMap:
            {
              // fixes leaflet's internal size cache after this step's fieldset was
              // hidden (display:none) while the user was on another step
              this.reachabilityMapHelperService.invalidateMap(this.domId);
              // refresh the main-indicator context layer in case the user changed the
              // selected indicator/date on the main map while on another step
              this.reachabilityMapHelperService.replaceMainIndicatorContextLayer(this.domId);
            }
            break;
          case BroadcastMessage.ResetReachabilityScenarioSetup:
            {
              this.resetScenarioSetupMap();
            }
            break;
        }
      });
  }

  /** Displays the currently selected start point layer's POI dataset on the map,
   * replacing whatever layer was shown for a previously selected data source/date. */
  updateMapLayer() {
    this.reachabilityMapHelperService.replaceStartPointLayer(
      this.domId,
      this.reachabilityStateService.settings.selectedStartPointLayer
    );
  }

  /** Clears this step's own point layer, e.g. when the scenario modal is fully reset. */
  resetScenarioSetupMap() {
    this.reachabilityMapHelperService.removeStartPointLayer(this.domId);
    this.reachabilityMapHelperService.removeMainIndicatorContextLayer(this.domId);
    this.reachabilityMapHelperService.invalidateMap(this.domId);
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
        this.updateMapLayer();
      } else {
        this.fetchPoiResourceGeoJSON();
      }
    }
  }

  onChangePoiResource() {
    this.reachabilityStateService.settings.selectedStartPointLayer =
      this.reachabilityStateService.selectedStartPointLayer;

    if (!this.reachabilityStateService.settings.selectedStartPointLayer) {
      this.updateMapLayer();
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
      this.updateMapLayer();
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

  async fetchPoiResourceGeoJSON() {
    // clear the previous data source's/date's map layer immediately, so its markers
    // don't linger on the map while the new dataset is still loading (mirrors how
    // fetchGeoJSONForIsochrones clears its previous result before recalculating)
    this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON_reachability = undefined;
    this.updateMapLayer();

    // awaiting this ensures the map layer (and loading spinner) update only after the
    // GeoJSON has actually arrived and been attached to the selected start point layer
    await this.reachabilityStateService.fetchPoiResourceGeoJSON(false);
    this.initPoiResourceEditFeaturesMenu();
    this.updateMapLayer();
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
