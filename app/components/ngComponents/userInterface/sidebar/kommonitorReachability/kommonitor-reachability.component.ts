import { MapService } from 'services/map-service/map.service';
import { Component, OnInit, inject } from '@angular/core';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReachabilityScenarioModalComponent } from './reachability-scenario-modal/reachability-scenario-modal.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import {
  NgbNavContent,
  NgbNav,
  NgbNavItem,
  NgbNavItemRole,
  NgbNavLinkButton,
  NgbNavLinkBase,
  NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import { OpenStreetMapProvider, SearchControl } from 'leaflet-geosearch';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ReachabilityStateService } from 'services/reachability-state-service/reachability-state.service';
import { MultiSelectSliderComponent } from 'components/ngComponents/common/multi-select-slider/multi-select-slider.component';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import uuidv4 from '../../../../../../customizedExternalLibs/uuidv4.js';

@Component({
  standalone: true,
  selector: 'app-kommonitor-reachability',
  templateUrl: './kommonitor-reachability.component.html',
  styleUrls: ['./kommonitor-reachability.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ExpandableBoxComponent,
    NgbNavContent,
    NgbNav,
    NgbNavItem,
    NgbNavItemRole,
    NgbNavLinkButton,
    NgbNavLinkBase,
    NgbNavOutlet,
    MultiSelectSliderComponent,
    LoadingOverlayComponent,
  ],
})
export class KommonitorReachabilityComponent implements OnInit {
  protected mapOverlayState = inject(MapOverlayStateService);
  protected reachabilityScenarioHelperService = inject(ReachabilityScenarioHelperService);
  private mapService = inject(MapService);
  private modalService = inject(NgbModal);
  private broadcastService = inject(BroadcastService);
  private envConfigService = inject(EnvConfigService);
  protected reachabilityStateService = inject(ReachabilityStateService);

  error = undefined;
  manualStartPoints = undefined;

  settings: any = {};

  active = 1;

  loadingData: boolean = false;

  sliderRange: number[] = [1, 300];

  loading$ = this.reachabilityStateService.loadingState$;

  ngOnInit(): void {
    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
      const values: any = broadcastMsg.values;

      switch (title) {
        case 'switchReportingMode':
          {
            this.changeStartPointsSource_fromLayer();
          }
          break;
        case BroadcastMessage.RemovePotentialDrawnStartingPoints:
          {
            this.removePotentialDrawnStartingPoints();
          }
          break;
      }
    });

    // this.openReachabilityScenarioModal();
  }

  geoserachProvider = new OpenStreetMapProvider({
    params: {
      'accept-language': 'de', // render results in Dutch
      countrycodes: 'de', // limit search results to the Netherlands
      addressdetails: 1, // include additional address detail parts
      viewbox:
        '' +
        (Number(this.envConfigService.initialLongitude) - 0.001) +
        ',' +
        (Number(this.envConfigService.initialLatitude) - 0.001) +
        ',' +
        (Number(this.envConfigService.initialLongitude) + 0.001) +
        ',' +
        (Number(this.envConfigService.initialLatitude) + 0.001),
    },
    searchUrl: this.envConfigService.targetUrlToGeocoderService + '/search',
    reverseUrl: this.envConfigService.targetUrlToGeocoderService + '/reverse',
  });

  geosearchControl = SearchControl({
    position: 'topleft',
    provider: this.geoserachProvider,
    style: 'button',
    autoComplete: true,
    autoCompleteDelay: 250,
    showMarker: true, // optional: true|false  - default true
    showPopup: false, // optional: true|false  - default false
    popupFormat: ({ query, result }) => result.label, // optional: function    - default returns result label
    maxMarkers: 1, // optional: number      - default 1
    retainZoomLevel: false, // optional: true|false  - default false
    animateZoom: true, // optional: true|false  - default true
    autoClose: false, // optional: true|false  - default false
    searchLabel: 'Suche nach Adressen ...', // optional: string      - default 'Enter address'
    keepResult: false, // optional: true|false  - default false
  });

  results: any[] = [];
  query = '';

  async onSearch(value: string) {
    this.query = value;

    if (!value || value.length < 3) {
      this.results = [];
      return;
    }

    this.results = await this.geoserachProvider.search({
      query: value,
    });
  }

  selectResult(result: any) {
    this.query = result.label;
    this.results = [];

    this.reachabilityStateService.addLocation({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [result.x, result.y] },
    });
  }

  onClickImport() {
    //reachabilityScenarioHelperService.importScenarios()
  }

  createScenario() {
    const state = this.reachabilityStateService;

    state.settings.startPointsSource = state.startPointsSource;

    if (state.startPointsSource == 'fromLayer') {
      state.scenarioTitle = `Erreichbarkeitsszenario - ${state.selectedStartPointLayer.datasetName}`;
      state.selectedStartPointLayer.geoJSON_reachability = {
        type: 'FeatureCollection',
        features: state.features,
      };
    } else {
      state.scenarioTitle = `Erreichbarkeitsszenario`;

      // Find empty/new dataset template in filteredDisplayableGeoresources
      const emptyDataset = state.filteredDisplayableGeoresources.find(
        (e) => e.isNewReachabilityDataSource
      );
      if (emptyDataset) {
        // Clone the template dataset so we don't mutate the shared template reference
        const clonedDataset = JSON.parse(JSON.stringify(emptyDataset));
        clonedDataset.georesourceId = uuidv4(); // Generate a unique ID for this instance
        clonedDataset.datasetName = 'manuelle Punkte';
        clonedDataset.geoJSON_reachability = {
          type: 'FeatureCollection',
          features: state.features,
        };
        clonedDataset.geoJSON = clonedDataset.geoJSON_reachability;
        state.selectedStartPointLayer = clonedDataset;
      }
      state.settings.manualStartPoints = { features: state.features };
    }

    // the scenario wizard's engine reads its start-point layer from `settings`, which
    // is a distinct field from the quick-calc UI's `selectedStartPointLayer` above
    state.settings.selectedStartPointLayer = state.selectedStartPointLayer;

    // translate the quick-calc UI's simplified settings into the wizard's config shape
    state.settings.transitMode = state.quickCalcSettings.transitMode;
    state.settings.focus = state.quickCalcSettings.focus;
    state.settings.isochroneInput = state.quickCalcSettings.ranges.join(',');

    state.makeLocationsArrayFromStartPoints();

    // carry over the already-computed quick-calc result so the wizard doesn't recalculate
    state.currentIsochronesGeoJSON = state.isochronesGeoJson;
    state.settings.useMultipleStartPoints = true;
    state.settings.dissolveIsochrones = true;

    state.setScenarioState = true;

    this.openReachabilityScenarioModal();
  }

  startCalculation() {
    this.reachabilityStateService.startQuickCalculation();
  }

  changeStartPointsSource_fromLayer() {
    this.disablePointDrawTool();
    this.settings.startPointsSource = 'fromLayer';
  }

  disablePointDrawTool() {
    // disable/hide leaflet-draw toolbar for only POINT features
    this.broadcastService.broadcast(BroadcastMessage.DisablePointDrawTool);
  }

  removePotentialDrawnStartingPoints() {
    this.manualStartPoints = undefined;
    this.disablePointDrawTool();
    this.removeAllDrawnPoints();
  }

  removeAllDrawnPoints() {
    this.broadcastService.broadcast(BroadcastMessage.RemoveAllDrawnPoints);
  }

  openReachabilityScenarioModal(scenarioDataset: any = false) {
    this.reachabilityStateService.showOnMainMap = false;
    this.active = 1;
    this.onSinglePointSelection();

    const modalRef = this.modalService.open(ReachabilityScenarioModalComponent, {
      windowClass: 'modal-holder',
      centered: true,
    });
    if (scenarioDataset) {
      modalRef.componentInstance.onManageReachabilityScenario(scenarioDataset);
    }
  }

  displayReachabilityScenarioOnMainMap(reachabilityScenario) {
    this.mapService.replaceReachabilityScenarioOnMainMap(reachabilityScenario);
  }

  removeReachabilityScenarioFromMainMap() {
    this.mapService.removeReachabilityScenarioFromMainMap();
  }

  onSinglePointSelection() {
    this.reachabilityStateService.showOnMainMap = true;
    this.reachabilityStateService.resetLocations();
    this.reachabilityStateService.startPointsSource = 'manual';
    this.reachabilityStateService.manualMapSelectionMode = false;
  }

  onMapSelection() {
    this.reachabilityStateService.showOnMainMap = true;
    this.reachabilityStateService.resetLocations();
    this.reachabilityStateService.startPointsSource = 'manual';
    this.reachabilityStateService.manualMapSelectionMode = true;
  }

  onLayerSelection() {
    this.reachabilityStateService.showOnMainMap = true;
    this.reachabilityStateService.resetLocations();
    this.reachabilityStateService.startPointsSource = 'fromLayer';
    this.reachabilityStateService.manualMapSelectionMode = false;
  }

  onFocusModeChange() {
    if (this.reachabilityStateService.quickCalcSettings.focus == 'distance')
      this.sliderRange = [1, 300];
    else this.sliderRange = [1, 15];
  }
}
