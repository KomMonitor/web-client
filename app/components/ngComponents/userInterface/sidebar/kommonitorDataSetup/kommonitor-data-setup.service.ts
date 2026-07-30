import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { TopicOrderMode } from 'components/ngComponents/admin/adminTopicsManagement/topic.model';
import {
  IndicatorsDataset,
  IndicatorsTopicsHierarchy,
} from 'components/ngComponents/models/indicators.models';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { Indicator } from 'components/ngComponents/userInterface/exporting/models';
import { Observable } from 'rxjs';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeometrySimplificationService } from 'services/geometry-simplification-service/geometry-simplification.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MapService } from 'services/map-service/map.service';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { MetadataFilterService } from 'services/metadata-filter-service/metadata-filter.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

@Injectable({
  providedIn: 'root',
})
export class KommonitorDataSetupService {
  private readonly http = inject(HttpClient);
  private geometrySimplification = inject(GeometrySimplificationService);
  private mapOverlayState = inject(MapOverlayStateService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private readonly metadataFilterService = inject(MetadataFilterService);
  private readonly selectionState = inject(SelectionStateService);
  private readonly georesourceStore = inject(GeoresourceMetadataStoreService);
  private readonly spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private readonly metadataExportService = inject(MetadataExportService);
  private readonly broadcastService = inject(BroadcastService);
  private readonly mapService = inject(MapService);

  private readonly months = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];

  getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  toExportIndicator(dataset: IndicatorsDataset): Indicator {
    return {
      id: dataset.indicatorId,
      name: dataset.indicatorName,
      spatialUnits: dataset.applicableSpatialUnits.map((unit) => ({
        id: unit.spatialUnitId,
        name: unit.spatialUnitName,
      })),
      availableTimestamps: dataset.applicableDates,
    };
  }

  prepNgbDates(dates: string[]): NgbDateStruct[] {
    return dates.map((date) => {
      const parts = date.split('-');
      return {
        year: parseInt(parts[0]),
        month: parseInt(parts[1]),
        day: parseInt(parts[2]),
      };
    });
  }

  tsToDateString(dateAsMs: number): number {
    return new Date(dateAsMs).getFullYear();
  }

  datePickerToDateSlider(datePickerDate: NgbDateStruct): string {
    return `${datePickerDate.day}. ${this.months[datePickerDate.month - 1]} ${datePickerDate.year}`;
  }

  dateStringToMs(dateStr: string): number {
    const parts = dateStr.split(' ');
    const offset = new Date('November 1, 2000 00:00:00').getTimezoneOffset() * 60 * 1000;
    const tms = new Date(
      parts[2] +
        '-' +
        (this.months.indexOf(parts[1]) + 1) +
        '-' +
        parts[0].replace('.', '') +
        'T00:00:00Z'
    ).getTime();
    return tms + offset;
  }

  prepTopicsTree(tree: any[], level: number, parent: string | undefined): any[] {
    tree.forEach((entry) => {
      entry.level = level;
      entry.parent = parent;

      if (entry.subTopics.length > 0) {
        entry.subTopics = this.prepTopicsTree(entry.subTopics, level + 1, entry.topicId);
      }
    });

    return tree;
  }

  prepareKeywordFilteredList(): any[] {
    const indicators = this.metadataFilterService.displayableIndicators_keywordFiltered.map(
      (item: any) => ({ ...item, listType: 'indicator' })
    );
    const wms = this.georesourceStore
      .getAvailableIndiWmsDatasets()
      .map((item) => ({ ...item, listType: 'wms' }));

    return [...indicators, ...wms].sort((a, b) => {
      const aKey = (a.indicatorName ?? a.title)?.toLowerCase() ?? '';
      const bKey = (b.indicatorName ?? b.title)?.toLowerCase() ?? '';
      return aKey.localeCompare(bKey);
    });
  }

  prepareIndicatorTopicsRecursive(
    tree: IndicatorsTopicsHierarchy[],
    topicSorting: TopicOrderMode | undefined
  ): IndicatorsTopicsHierarchy[] {
    let retTree = tree.filter((e) => e.indicatorCount > 0);

    if (topicSorting === 'custom') {
      retTree = retTree.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    if (topicSorting === 'alphabetical') {
      retTree = retTree.sort((a, b) => (a.topicName > b.topicName ? 1 : -1));
    }

    retTree.forEach((elem) => {
      if (elem.subTopics.length > 0) {
        elem.subTopics = this.prepareIndicatorTopicsRecursive(elem.subTopics, topicSorting);
      }
    });

    return retTree;
  }

  isTopicContainingSelectedIndicator(topic: IndicatorsTopicsHierarchy): boolean {
    const indicatorMatch = topic.indicatorData.some(
      (e) => e.indicatorId === this.selectionState.selectedIndicator.indicatorId
    );
    const wmsMatch = topic.wmsData.some((e) => e.isSelected === true);

    if (indicatorMatch || wmsMatch) return true;

    return topic.subTopics.some((sub) => this.isTopicContainingSelectedIndicator(sub));
  }

  getFirstSpatialUnitForSelectedIndicator(): any {
    const applicableSpatialUnits = this.selectionState.selectedIndicator.applicableSpatialUnits;

    for (const spatialUnitEntry of this.spatialUnitStore.availableSpatialUnits) {
      if (
        applicableSpatialUnits.some((o) => o.spatialUnitName === spatialUnitEntry.spatialUnitLevel)
      ) {
        return spatialUnitEntry;
      }
    }

    return undefined;
  }

  createDatesFromIndicatorDates(indicatorDates: string[]): number[] {
    return indicatorDates
      .map((dateStr) => {
        const dateComponents = dateStr.split('-');
        return this.metadataExportService.dateToTS(
          new Date(
            Number(dateComponents[0]),
            Number(dateComponents[1]) - 1,
            Number(dateComponents[2])
          )
        );
      })
      .filter((v): v is number => v !== undefined);
  }

  modifyExports(_changeIndicator: boolean): void {
    this.mapOverlayState.wmsUrlForSelectedIndicator = undefined;
    this.mapOverlayState.wfsUrlForSelectedIndicator = undefined;

    const selectedSpatialUnitName = this.selectionState.selectedSpatialUnit.spatialUnitLevel;

    for (const ogcServiceEntry of this.selectionState.selectedIndicator.ogcServices) {
      if (ogcServiceEntry.spatialUnit === selectedSpatialUnitName) {
        this.mapOverlayState.wmsUrlForSelectedIndicator = ogcServiceEntry.wmsUrl;
        this.mapOverlayState.wfsUrlForSelectedIndicator = ogcServiceEntry.wfsUrl;
        break;
      }
    }

    this.broadcastService.broadcast(BroadcastMessage.UpdateBalanceSlider, [
      this.selectionState.selectedDate,
    ]);
  }

  updateIndicatorOgcServices([indicatorWmsUrl, indicatorWfsUrl]: [string, string]): void {
    this.mapOverlayState.wmsUrlForSelectedIndicator = indicatorWmsUrl;
    this.mapOverlayState.wfsUrlForSelectedIndicator = indicatorWfsUrl;
  }

  handleWmsOnMap(dataset: WmsDataset): void {
    this.mapOverlayState.wmsLegendImage = undefined;

    if (dataset.isSelected) {
      const opacity = 1 - dataset.transparency;
      this.mapService.addWmsLayerToMap(dataset, opacity);
      this.georesourceStore.setWmsLayerActive(dataset);
    } else {
      this.mapService.removeWmsLayerFromMap(dataset);
      this.georesourceStore.setWmsLayerInactive(dataset);
    }
  }

  fetchIndicatorGeoJson(date: string): Observable<any> {
    const indicatorId = this.selectionState.selectedIndicator.indicatorId;

    if (!(date && this.selectionState.selectedSpatialUnit && indicatorId)) {
      this.mapErrorNotificationService.displayMapApplicationError(
        'Beim Versuch, einen Beispielindikator zu laden, ist ein Fehler aufgetreten. Der Datenbankeintrag scheint eine fehlerhafte Kombination aus Raumebene und Zeitschnitt zu enthalten.'
      );
      throw Error('Not all parameters have been set up yet.');
    }

    const [year, month, day] = date.split('-');
    const { spatialUnitId } = this.selectionState.selectedSpatialUnit;
    const base = this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource();
    const simplify = `${this.geometrySimplification.simplifyGeometriesParameterName}=${this.geometrySimplification.simplifyGeometries}`;
    const url = `${base}/indicators/${indicatorId}/${spatialUnitId}/${year}/${month}/${day}?${simplify}`;

    return this.http.get(url);
  }
}
