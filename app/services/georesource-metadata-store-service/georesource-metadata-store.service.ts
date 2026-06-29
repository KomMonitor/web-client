import { Injectable, inject, signal } from '@angular/core';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { WmsResourceType, WmsDataset } from 'components/ngComponents/models/services.models';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';

/**
 * Georesource / WMS / WFS metadata store + filtering, extracted from DataExchangeService
 * (Prio 7 / B6e + B4-georesource — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Combines the georesource/WMS/WFS domain store (B6e) with its keyword/type filtering (B4)
 * because the two are mutually coupled (setGeoresources <-> onChangeGeoresourceKeywordFilter).
 * Cross-domain inputs come from injected stores (availableTopics from TopicMetadataStoreService;
 * hierarchy build via TopicHierarchyStoreService). The DataExchangeService facade re-exposes the
 * fields via getters so its consumers stay unchanged.
 */
@Injectable({
  providedIn: 'root',
})
export class GeoresourceMetadataStoreService {
  private envConfigService = inject(EnvConfigService);
  private topicHierarchyService = inject(TopicHierarchyService);
  private topicHierarchyStore = inject(TopicHierarchyStoreService);
  private topicStore = inject(TopicMetadataStoreService);

  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _availableGeoresources = signal<GeoresourcesDataset[]>([]);
  get availableGeoresources(): GeoresourcesDataset[] {
    return this._availableGeoresources();
  }
  set availableGeoresources(value: GeoresourcesDataset[]) {
    this._availableGeoresources.set(value);
  }
  availableGeoresources_map = new Map();
  displayableGeoresources: any;

  availableWmsDatasets: WmsDataset[] = [];
  wmsDatasets!: WmsDataset[];
  wfsDatasets = this.envConfigService.wfsDatasets.sort((a, b) => (a.title > b.title ? 1 : -1));
  wmsDatasets_keywordFiltered!: WmsDataset[];
  wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));

  displayableGeoresources_keywordFiltered: any;
  displayableGeoresources_keywordFiltered_forAlphabeticalDisplay: any = {};

  georesourceMapKey_forUnmappedTopicReferences = 'unmapped';

  setServices(servicesArray: WmsDataset[]) {
    this.availableWmsDatasets = servicesArray;

    this.wmsDatasets = servicesArray;
    this.wmsDatasets_keywordFiltered = servicesArray;
  }

  addSingleGeoresourceMetadata(georesourceMetadata) {
    this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
    this.availableGeoresources = [georesourceMetadata, ...this.availableGeoresources];
  }

  replaceSingleGeoresourceMetadata(georesourceMetadata) {
    const index = this.availableGeoresources.findIndex(
      (g) => g.georesourceId === georesourceMetadata.georesourceId
    );
    if (index !== -1)
      this.availableGeoresources = this.availableGeoresources.map((it, i) =>
        i === index ? georesourceMetadata : it
      );
    this.availableGeoresources_map.set(georesourceMetadata.georesourceId, georesourceMetadata);
  }

  deleteSingleGeoresourceMetadata(georesourceId) {
    const index = this.availableGeoresources.findIndex((g) => g.georesourceId === georesourceId);
    if (index !== -1)
      this.availableGeoresources = this.availableGeoresources.filter((_, i) => i !== index);
    this.availableGeoresources_map.delete(georesourceId);
  }

  getGeoresourceMetadataById(georesourceId) {
    return this.availableGeoresources_map.get(georesourceId);
  }

  getAvailableGeoWmsDatasets(): WmsDataset[] {
    return this.availableWmsDatasets.filter(
      (e) => e.serviceResource == WmsResourceType.GEORESOURCE
    );
  }

  getAvailableIndiWmsDatasets(): WmsDataset[] {
    return this.availableWmsDatasets.filter((e) => e.serviceResource == WmsResourceType.INDICATOR);
  }

  setGeoresources(georesourcesArray) {
    // wms are not part of availableGeoresources anymore, maybe add again. But no use-case for the time beeing
    this.availableGeoresources_map = new Map(georesourcesArray.map((g) => [g.georesourceId, g]));
    this.availableGeoresources = Array.from(this.availableGeoresources_map.values());

    this.displayableGeoresources = this.availableGeoresources.filter((item) =>
      this.isDisplayableGeoresource(item)
    );
    this.displayableGeoresources_keywordFiltered = JSON.parse(
      JSON.stringify(this.displayableGeoresources)
    );

    //this.wmsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wmsDatasets));
    this.wmsDatasets_keywordFiltered = this.getAvailableGeoWmsDatasets();
    this.wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));

    this.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay = {
      poiData: this.displayableGeoresources_keywordFiltered.filter((item) => item.isPOI),
      loiData: this.displayableGeoresources_keywordFiltered.filter((item) => item.isLOI),
      aoiData: this.displayableGeoresources_keywordFiltered.filter((item) => item.isAOI),
      wmsData: this.wmsDatasets_keywordFiltered,
      wfsData: this.wfsDatasets_keywordFiltered,
    };

    const enabledGeoresources = this.envConfigService.enabledGeoresourcesInfrastructure.concat(
      this.envConfigService.enabledGeoresourcesGeoservices
    );

    const showPOI = enabledGeoresources.indexOf('poi') !== -1;
    const showLOI = enabledGeoresources.indexOf('loi') !== -1;
    const showAOI = enabledGeoresources.indexOf('aoi') !== -1;
    const showWMS = enabledGeoresources.indexOf('wms') !== -1;
    const showWFS = enabledGeoresources.indexOf('wfs') !== -1;

    this.onChangeGeoresourceKeywordFilter(undefined, showPOI, showLOI, showAOI, showWMS, showWFS);
  }

  private filterArrayObjectsByValue(array, string) {
    return array.filter((o) => {
      return Object.keys(o).some((k) => {
        if (typeof o[k] === 'string') return o[k].toLowerCase().includes(string.toLowerCase());
        return false;
      });
    });
  }

  onChangeGeoresourceKeywordFilter(
    georesourceNameFilter,
    showPOI,
    showLOI,
    showAOI,
    showWMS,
    showWFS
  ) {
    this.wmsDatasets_keywordFiltered = this.getAvailableGeoWmsDatasets();
    this.wfsDatasets_keywordFiltered = JSON.parse(JSON.stringify(this.wfsDatasets));

    this.displayableGeoresources_keywordFiltered = JSON.parse(
      JSON.stringify(this.displayableGeoresources)
    );

    if (georesourceNameFilter && georesourceNameFilter != '') {
      this.displayableGeoresources_keywordFiltered = this.filterArrayObjectsByValue(
        this.displayableGeoresources_keywordFiltered,
        georesourceNameFilter
      );

      this.wmsDatasets_keywordFiltered = this.filterArrayObjectsByValue(
        this.wmsDatasets_keywordFiltered,
        georesourceNameFilter
      );
      this.wfsDatasets_keywordFiltered = this.filterArrayObjectsByValue(
        this.wfsDatasets_keywordFiltered,
        georesourceNameFilter
      );
    }

    this.displayableGeoresources_keywordFiltered_forAlphabeticalDisplay = {
      poiData: this.displayableGeoresources_keywordFiltered.filter((item) => item.isPOI),
      loiData: this.displayableGeoresources_keywordFiltered.filter((item) => item.isLOI),
      aoiData: this.displayableGeoresources_keywordFiltered.filter((item) => item.isAOI),
      wmsData: this.wmsDatasets_keywordFiltered,
      wfsData: this.wfsDatasets_keywordFiltered,
    };

    if (!showWMS) {
      this.wmsDatasets_keywordFiltered = [];
    }
    if (!showWFS) {
      this.wfsDatasets_keywordFiltered = [];
    }

    if (!(showPOI && showLOI && showAOI)) {
      this.displayableGeoresources_keywordFiltered =
        this.displayableGeoresources_keywordFiltered.filter((item) => {
          if (!showPOI && item.isPOI) {
            return false;
          }
          if (!showLOI && item.isLOI) {
            return false;
          }

          if (!showAOI && item.isAOI) {
            return false;
          }

          return true;
        });
    }

    this.topicHierarchyStore.buildTopicGeoresourceHierarchy(
      this.topicStore.availableTopics,
      this.displayableGeoresources_keywordFiltered,
      this.wmsDatasets_keywordFiltered,
      this.wfsDatasets_keywordFiltered,
      this.georesourceMapKey_forUnmappedTopicReferences
    );
  }

  getGeoresourceDatasets(
    topic,
    georesourceNameFilter,
    showPOI,
    showLOI,
    showAOI,
    showWMS,
    showWFS
  ) {
    const availableGeoresources: any = this.getAvailableGeoresources(
      topic,
      georesourceNameFilter,
      showPOI,
      showLOI,
      showAOI
    );
    const wmsDatasets = this.getAvailableTopicWmsDatasets(topic, georesourceNameFilter, showWMS);
    const wfsDatasets = this.getAvailableWfsDatasets(topic, georesourceNameFilter, showWFS);

    const datasets = availableGeoresources.concat(wmsDatasets).concat(wfsDatasets);
    return datasets;
  }

  getAvailableWfsDatasets(topic, georesourceNameFilter, showWFS) {
    if (!showWFS) {
      return [];
    }

    const wfsDatasets: any[] = [];

    let filteredWfsDatasets = this.wfsDatasets;

    if (georesourceNameFilter && georesourceNameFilter != '') {
      filteredWfsDatasets = this.filterArrayObjectsByValue(
        filteredWfsDatasets,
        georesourceNameFilter
      );
    }

    for (const wfsMetadata of filteredWfsDatasets) {
      if (this.topicHierarchyContainsWms(topic, wfsMetadata)) {
        wfsDatasets.push(wfsMetadata);
      }
    }

    return wfsDatasets;
  }

  getAvailableTopicWmsDatasets(topic, georesourceNameFilter, showWMS) {
    if (!showWMS) {
      return [];
    }

    const wmsDatasets: any[] = [];

    let filteredWmsDatasets = this.getAvailableGeoWmsDatasets();

    if (georesourceNameFilter && georesourceNameFilter != '') {
      filteredWmsDatasets = this.filterArrayObjectsByValue(
        filteredWmsDatasets,
        georesourceNameFilter
      );
    }

    for (const wmsMetadata of filteredWmsDatasets) {
      if (this.topicHierarchyContainsWms(topic, wmsMetadata)) {
        wmsDatasets.push(wmsMetadata);
      }
    }

    return wmsDatasets;
  }

  private topicHierarchyContainsGeoresource(topic, georesourceMetadata) {
    return this.topicHierarchyService.topicHierarchyContainsGeoresource(
      this.topicStore.availableTopics,
      topic,
      georesourceMetadata
    );
  }

  private topicHierarchyContainsWms(topic, wmsMetadata) {
    return this.topicHierarchyService.topicHierarchyContainsWms(
      this.topicStore.availableTopics,
      topic,
      wmsMetadata
    );
  }

  filterByGeoresourceNamesToHide(filteredGeoresources) {
    return filteredGeoresources.filter((georesourceMetadata) => {
      return this.isDisplayableGeoresource(georesourceMetadata);
    });
  }

  getAvailableGeoresources(topic, georesourceNameFilter, showPOI, showLOI, showAOI) {
    const georesources: any[] = [];

    let filteredGeoresources = this.availableGeoresources;

    filteredGeoresources = this.filterByGeoresourceNamesToHide(filteredGeoresources);

    if (georesourceNameFilter && georesourceNameFilter != '') {
      filteredGeoresources = this.filterArrayObjectsByValue(
        filteredGeoresources,
        georesourceNameFilter
      );
    }

    filteredGeoresources = this.filterGeoresourcesByTypes(
      filteredGeoresources,
      showPOI,
      showLOI,
      showAOI
    );

    for (const georesourceMetadata of filteredGeoresources) {
      if (this.topicHierarchyContainsGeoresource(topic, georesourceMetadata)) {
        georesources.push(georesourceMetadata);
      }
    }

    return georesources;
  }

  filterGeoresourcesByTypes(georesourceMetadataArray, showPOI, showLOI, showAOI) {
    if (!showPOI && !showLOI && !showAOI) {
      return [];
    }

    return georesourceMetadataArray.filter((georesourceMetadata) => {
      if (georesourceMetadata.isPOI) {
        if (showPOI) {
          return true;
        } else {
          return false;
        }
      } else if (georesourceMetadata.isLOI) {
        if (showLOI) {
          return true;
        } else {
          return false;
        }
      } else if (georesourceMetadata.isAOI) {
        if (showAOI) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
  }

  removeAoiGeoresource(_aoiGeoresource) {
    //return this.ajskommonitorDataExchangeServiceeProvider.removeAoiGeoresource(aoiGeoresource);
  }

  isDisplayableGeoresource(item) {
    const arrayOfNameSubstringsForHidingGeoresources =
      this.envConfigService.arrayOfNameSubstringsForHidingGeoresources;

    if (
      item.availablePeriodsOfValidity == undefined ||
      item.availablePeriodsOfValidity.length === 0
    )
      return false;

    const isGeoresourceThatShallNotBeDisplayed = arrayOfNameSubstringsForHidingGeoresources.some(
      (substring) => String(item.datasetName).includes(substring)
    );

    if (isGeoresourceThatShallNotBeDisplayed) {
      return false;
    }
    return true;
  }

  setWmsLayerActive(dataset: WmsDataset) {
    this.wmsDatasets = this.wmsDatasets.map((e) =>
      e.id === dataset.id ? { ...e, isSelected: true } : e
    );
  }

  setWmsLayerInactive(dataset: WmsDataset) {
    this.wmsDatasets = this.wmsDatasets.map((e) =>
      e.id === dataset.id ? { ...e, isSelected: false } : e
    );
  }
}
