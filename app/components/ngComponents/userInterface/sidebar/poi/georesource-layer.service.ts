import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { GeoressourceExportModalComponent } from 'components/ngComponents/userInterface/exporting/georessource-export-modal/georessource-export-modal.component';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MapService } from 'services/map-service/map.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { GeoresourceExportModeService } from './georesource-export-mode.service';

/**
 * Encapsulates the side-effecting georesource layer logic that used to live in
 * {@link PoiComponent}: adding/removing POI/LOI/AOI layers, WMS/WFS toggling,
 * export download, the loading-spinner flag, the cluster setting and the date
 * (validity timestamp) selection used to query layers.
 *
 * Tree/selection bookkeeping (which topic is selected, fav handling) remains in
 * the component; this service only performs the actual map interactions.
 */
@Injectable({ providedIn: 'root' })
export class GeoresourceLayerService {
  private mapOverlayState = inject(MapOverlayStateService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private selectionState = inject(SelectionStateService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private mapService = inject(MapService);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  private modalService = inject(NgbModal);
  private exportMode = inject(GeoresourceExportModeService);

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
      this.broadcastService.broadcast(BroadcastMessage.ShowLoadingIconOnMap);
    });

    setTimeout(() => {
      this.refreshSelectedGeoresources();
    }, 250);
  }

  refreshSelectedGeoresources() {
    for (const georesource of this.georesourceStore.displayableGeoresources_keywordFiltered) {
      if (georesource.isSelected && (georesource.isPOI || georesource.isLOI || georesource.isAOI)) {
        this.removeGeoresourceLayerFromMap(georesource);
        this.addGeoresourceLayerToMap(georesource);
      }
    }
    this.loadingData = false;
  }

  onChangeSelectedFavDate(georesourceDataset, event) {
    georesourceDataset.selectedDate =
      georesourceDataset.availablePeriodsOfValidity[event.srcElement.value];
    if (georesourceDataset.isSelected) {
      this.removeGeoresourceLayerFromMap(georesourceDataset);
      this.addGeoresourceLayerToMap(georesourceDataset);
    }
  }

  onChangeSelectedDate(georesourceDataset: GeoresourcesDataset) {
    if (georesourceDataset.isSelected) {
      this.removeGeoresourceLayerFromMap(georesourceDataset);
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
    this.broadcastService.broadcast(BroadcastMessage.ShowLoadingIconOnMap);
    const date = this.getQueryDate(resource);
    const [year, month, day] = date.split('-');
    const url = `${this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/georesources/${resource.georesourceId}/${year}/${month}/${day}`;
    this.http.get(url).subscribe({
      next: (response) => {
        resource.geoJSON = response;
        if (resource.isPOI)
          this.mapService.addPoiGeoresourceGeoJSON(resource, date, this.useCluster);
        else if (resource.isLOI) this.mapService.addLoiGeoresourceGeoJSON(resource, date);
        else if (resource.isAOI) this.mapService.addAoiGeoresourceGeoJSON(resource, date);
        this.loadingData = false;
      },
      error: (error) => {
        this.loadingData = false;
        this.mapErrorNotificationService.displayMapApplicationError(error);
      },
    });
  }

  removeGeoresourceLayerFromMap(resource: GeoresourcesDataset) {
    this.loadingData = true;
    this.broadcastService.broadcast(BroadcastMessage.ShowLoadingIconOnMap);
    if (resource.isPOI) this.mapService.removePoiGeoresource(resource);
    else if (resource.isLOI) this.mapService.removeLoiGeoresource(resource);
    else if (resource.isAOI) this.mapService.removeAoiGeoresource(resource);
    this.loadingData = false;
  }

  refreshPoiLayers() {
    for (const poi of this.georesourceStore.displayableGeoresources_keywordFiltered) {
      if (poi.isSelected) {
        this.removeGeoresourceLayerFromMap(poi);
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
      this.mapService.addWmsLayerToMap(dataset, opacity);
    } else {
      //remove WMS layer from map
      this.mapService.removeWmsLayerFromMap(dataset);
    }
  }

  handleWfsOnMap(dataset) {
    console.log('Toggle WFS: ' + dataset.title);

    if (dataset.isSelected) {
      //display on Map
      const opacity = 1 - dataset.transparency;
      this.mapService.addWfsLayerToMap(dataset, opacity, this.useCluster);
    } else {
      //remove WMS layer from map
      this.mapService.removeWfsLayerFromMap(dataset);
    }
  }

  adjustWfsLayerColor(dataset) {
    const opacity = 1 - dataset.transparency;

    this.mapService.adjustColorForWfsLayer(dataset, opacity);
  }
}
