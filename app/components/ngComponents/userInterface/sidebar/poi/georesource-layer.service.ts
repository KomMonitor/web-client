import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  GeoresourcesDataset,
  GeoresourcesTopicsHierarchy,
} from 'components/ngComponents/models/georesources.models';
import { GeoressourceExportModalComponent } from 'components/ngComponents/userInterface/exporting/georessource-export-modal/georessource-export-modal.component';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import type { MapLayerOwner } from 'services/map-layer-registry-service/map-layer.model';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MapService } from 'services/map-service/map.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { GeoresourceExportModeService } from './georesource-export-mode.service';
import { GeoresourceFilterService } from './georesource-filter.service';

/**
 * Leaflet's own default path colour. `aoiColor` and `loiColor` are optional keys
 * of the `window.__env.wfsDatasets` entries (schema: `app/config/env_backup.js`)
 * and nothing in the client fills them in, so a WFS layer configured without a
 * colour is already drawn in exactly this colour. Using it as the picker's
 * fallback means the swatch shows what is on the map instead of a guess.
 */
export const WFS_FALLBACK_COLOR = '#3388ff';

/**
 * Which colour field a WFS dataset uses depends on its geometry type — the same
 * distinction `getWfsStyle()` makes when it builds the Leaflet style. The colour
 * picker is only offered for the non-POI geometries (POI datasets are drawn with
 * a marker icon instead), so LOI vs. "everything else" is exhaustive here.
 */
export function getWfsColor(dataset: any): string {
  const color = dataset.geometryType === 'LOI' ? dataset.loiColor : dataset.aoiColor;
  return color || WFS_FALLBACK_COLOR;
}

/** Counterpart of {@link getWfsColor}: writes a picked colour back to the dataset. */
export function setWfsColor(dataset: any, color: string): void {
  if (dataset.geometryType === 'LOI') {
    dataset.loiColor = color;
  } else {
    dataset.aoiColor = color;
  }
}

/**
 * Encapsulates the side-effecting georesource layer logic that used to live in
 * {@link PoiComponent}: adding/removing POI/LOI/AOI layers, WMS/WFS toggling,
 * export download, the loading-spinner flag, the cluster setting and the date
 * (validity timestamp) selection used to query layers.
 *
 * Toggling a single dataset includes unticking its topics, so that the layer
 * panel can deselect a dataset while the sidebar section is closed: the layers
 * this service adds carry an owner that does exactly that. Selecting whole
 * topics and fav handling remain in the components.
 */
@Injectable({ providedIn: 'root' })
export class GeoresourceLayerService {
  private mapOverlayState = inject(MapOverlayStateService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private selectionState = inject(SelectionStateService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private mapService = inject(MapService);
  private http = inject(HttpClient);
  private modalService = inject(NgbModal);
  private exportMode = inject(GeoresourceExportModeService);
  private broadcastService = inject(BroadcastService);
  private topicHierarchyStore = inject(TopicHierarchyStoreService);
  private filterService = inject(GeoresourceFilterService);

  constructor() {
    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      if (broadcastMsg.msg === BroadcastMessage.SelectedIndicatorDateHasChanged) {
        this.selectedIndicatorDateHasChanged();
      }
    });
  }

  /** Whether POI layers are clustered on the map. Bound by the settings header. */
  useCluster = true;
  /** Drives the sidebar loading spinner while layers are (re)loaded. */
  loadingData = false;

  readonly dateSelectionType_valueIndicator = 'date_indicator';
  readonly dateSelectionType_valueManual = 'date_manual';
  readonly dateSelectionType_valuePerDataset = 'date_perDataset';
  dateSelectionType = {
    selectedDateType: this.dateSelectionType_valuePerDataset,
  };

  selectedDate_manual: any = undefined;

  private timeout_manualdate: any;

  /** True when datasets carry their own per-dataset validity date selection. */
  get isPerDatasetDate(): boolean {
    return this.dateSelectionType.selectedDateType === this.dateSelectionType_valuePerDataset;
  }

  onClickUseIndicatorTimestamp() {
    this.dateSelectionType.selectedDateType = this.dateSelectionType_valueIndicator;

    this.refreshSelectedGeoresources();
  }

  isNoValidDate(dateCandidate) {
    const dateComps = dateCandidate.split('-');

    if (dateComps.length < 3) {
      return true;
    } else if (!dateComps[0] || !dateComps[1] || !dateComps[2]) {
      return true;
    } else if (isNaN(dateComps[0]) || isNaN(dateComps[1]) || isNaN(dateComps[2])) {
      return true;
    } else if (Number(dateComps[1]) > 12 || Number(dateComps[2]) > 31) {
      return true;
    }

    return false;
  }

  onChangeManualDate() {
    // check if date is an actual date
    // if so then refresh selected layers

    // Clear the timeout if it has already been set.
    // This will prevent the previous task from executing
    // if it has been less than <MILLISECONDS>
    clearTimeout(this.timeout_manualdate);

    // Make a new timeout set to go off in 1000ms (1 second)
    this.timeout_manualdate = setTimeout(() => {
      const dateCandidate = this.selectedDate_manual;

      if (this.isNoValidDate(dateCandidate)) {
        return;
      }

      this.loadingData = true;

      setTimeout(() => {
        this.refreshSelectedGeoresources();
      }, 250);
    }, 1000);
  }

  selectedIndicatorDateHasChanged() {
    console.log('refresh selected georesource layers according to new date - poi');

    // only refresh georesources if sync with indicator timestamp is selected
    if (!this.dateSelectionType.selectedDateType.includes(this.dateSelectionType_valueIndicator)) {
      return;
    }

    setTimeout(() => {
      this.loadingData = true;
      this.mapService.showLoadingIcon();
    });

    setTimeout(() => {
      this.refreshSelectedGeoresources();
    }, 250);
  }

  // Reloading registers the layer again under the same id, which replaces it on
  // the map and keeps its visibility, opacity and position; removing it first
  // would lose them. Until the new data is there, the old layer stays.
  refreshSelectedGeoresources() {
    for (const georesource of this.georesourceStore.displayableGeoresources_keywordFiltered) {
      if (georesource.isSelected && (georesource.isPOI || georesource.isLOI || georesource.isAOI)) {
        this.addGeoresourceLayerToMap(georesource);
      }
    }
    this.loadingData = false;
  }

  onChangeSelectedFavDate(georesourceDataset, event) {
    georesourceDataset.selectedDate =
      georesourceDataset.availablePeriodsOfValidity[event.srcElement.value];
    if (georesourceDataset.isSelected) {
      this.addGeoresourceLayerToMap(georesourceDataset);
    }
  }

  onChangeSelectedDate(georesourceDataset: GeoresourcesDataset) {
    if (georesourceDataset.isSelected) {
      this.addGeoresourceLayerToMap(georesourceDataset);
    }
  }

  getQueryDate(resource: any) {
    if (this.dateSelectionType.selectedDateType === this.dateSelectionType_valueIndicator) {
      return this.selectionState.selectedDate;
    } else if (this.dateSelectionType.selectedDateType === this.dateSelectionType_valueManual) {
      return this.selectedDate_manual;
    } else if (
      this.dateSelectionType.selectedDateType === this.dateSelectionType_valuePerDataset &&
      resource.selectedDate
    ) {
      return resource.selectedDate.startDate;
    } else {
      return this.selectionState.selectedDate;
    }
  }

  addGeoresourceLayerToMap(resource: GeoresourcesDataset) {
    this.loadingData = true;
    this.mapService.showLoadingIcon();
    const date = this.getQueryDate(resource);
    const [year, month, day] = date.split('-');
    const url = `${this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/georesources/${resource.georesourceId}/${year}/${month}/${day}`;
    this.http.get(url).subscribe({
      next: (response) => {
        // deselected while loading: do not bring it back
        if (!resource.isSelected) {
          this.loadingData = false;
          this.mapService.hideLoadingIcon();
          return;
        }
        resource.geoJSON = response;
        const owner = this.georesourceOwner(resource);
        if (resource.isPOI)
          this.mapService.addPoiGeoresourceGeoJSON(resource, date, this.useCluster, owner);
        else if (resource.isLOI) this.mapService.addLoiGeoresourceGeoJSON(resource, date, owner);
        else if (resource.isAOI) this.mapService.addAoiGeoresourceGeoJSON(resource, date, owner);
        this.loadingData = false;
      },
      error: (error) => {
        this.loadingData = false;
        this.mapErrorNotificationService.displayMapApplicationError(error);
      },
    });
  }

  /**
   * Shows or hides a POI/LOI/AOI dataset after its checkbox changed. Unticking
   * one also unticks the topics above it, which are then no longer complete.
   */
  handleGeoresourceOnMap(resource: GeoresourcesDataset) {
    this.searchGeoresourcesRecursive(resource, this.filterService.preppedTopicGeoresourceHierarchy);

    if (resource.isSelected) {
      this.addGeoresourceLayerToMap(resource);
    } else {
      for (const topic of this.topicHierarchyStore.topicGeoresourceHierarchy) {
        if (topic.topicId === resource.topicReference) topic.isSelected = false;
      }
      this.removeGeoresourceLayerFromMap(resource);
    }
  }

  /**
   * Unticks a dataset as its checkbox would. The keyword filter re-clones the
   * catalogue, so the dataset shown now may be another object than the one
   * whose layer was added; both are unticked.
   */
  deselectGeoresource(resource: GeoresourcesDataset) {
    const shown = this.georesourceStore.displayableGeoresources_keywordFiltered.find(
      (dataset) => dataset.georesourceId === resource.georesourceId
    );
    resource.isSelected = false;
    if (shown) {
      shown.isSelected = false;
    }
    this.handleGeoresourceOnMap(shown ?? resource);
  }

  /** Lets the layer panel remove the dataset's layer by deselecting the dataset. */
  private georesourceOwner(resource: GeoresourcesDataset): MapLayerOwner {
    return { remove: () => this.deselectGeoresource(resource) };
  }

  /** Unticks every topic of the tree that holds the dataset, unless it is selected. */
  private searchGeoresourcesRecursive(
    georesource: GeoresourcesDataset,
    tree: GeoresourcesTopicsHierarchy[]
  ): boolean {
    let match = false;

    tree.forEach((topic) => {
      const poiMatch = topic.poiData.filter((e) => e.georesourceId == georesource.georesourceId);
      const aoiMatch = topic.aoiData.filter((e) => e.georesourceId == georesource.georesourceId);
      const loiMatch = topic.loiData.filter((e) => e.georesourceId == georesource.georesourceId);

      if (poiMatch.length || aoiMatch.length || loiMatch.length) {
        if (!georesource.isSelected) topic.isSelected = false;

        match = true;
      } else {
        if (topic.subTopics.length) {
          match = this.searchGeoresourcesRecursive(georesource, topic.subTopics);

          if (match && !georesource.isSelected) topic.isSelected = false;
        }
      }
    });

    return match;
  }

  removeGeoresourceLayerFromMap(resource: GeoresourcesDataset) {
    this.loadingData = true;
    this.mapService.showLoadingIcon();
    if (resource.isPOI) this.mapService.removePoiGeoresource(resource);
    else if (resource.isLOI) this.mapService.removeLoiGeoresource(resource);
    else if (resource.isAOI) this.mapService.removeAoiGeoresource(resource);
    this.loadingData = false;
  }

  refreshPoiLayers() {
    for (const poi of this.georesourceStore.displayableGeoresources_keywordFiltered) {
      if (poi.isSelected) {
        this.addGeoresourceLayerToMap(poi);
      }
    }
    for (const wfs of this.georesourceStore.wfsDatasets) {
      if (wfs.geometryType === 'POI' && wfs.isSelected) {
        this.mapService.removeWfsLayerFromMap(wfs);
        this.mapService.addWfsLayerToMap(wfs, 1 - wfs.transparency, this.useCluster);
      }
    }
  }

  openGeoresourceExportModal(resource: GeoresourcesDataset) {
    const georessource = this.exportMode.toExportGeoresource(resource);
    const modalRef = this.modalService.open(GeoressourceExportModalComponent, {
      windowClass: 'modal-holder',
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.georessource = georessource;
  }

  handleWmsOnMap(dataset) {
    this.mapOverlayState.wmsLegendImage = undefined;
    console.log('Toggle WMS: ' + dataset.title);

    if (dataset.isSelected) {
      //display on Map
      const opacity = 1 - dataset.transparency;
      this.mapService.addWmsLayerToMap(dataset, opacity, {
        // the layer panel removes it as unticking it here would
        remove: () => {
          dataset.isSelected = false;
          this.handleWmsOnMap(dataset);
        },
      });
    } else {
      //remove WMS layer from map
      this.mapService.removeWmsLayerFromMap(dataset);
    }
  }

  handleWfsOnMap(dataset) {
    console.log('Toggle WFS: ' + dataset.title);

    if (dataset.isSelected) {
      //display on Map
      // `transparency` only exists on imported file layers, never on the WFS
      // config datasets, so without the fallback the opacity would be NaN.
      const opacity = 1 - (dataset.transparency ?? 0);
      this.mapService.addWfsLayerToMap(dataset, opacity, this.useCluster);
    } else {
      //remove WMS layer from map
      this.mapService.removeWfsLayerFromMap(dataset);
    }
  }

  adjustWfsLayerColor(dataset) {
    // see handleWfsOnMap: WFS datasets carry no `transparency`
    const opacity = 1 - (dataset.transparency ?? 0);

    this.mapService.adjustColorForWfsLayer(dataset, opacity);
  }
}
