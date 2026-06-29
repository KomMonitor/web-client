import { Injectable, inject } from '@angular/core';
import pako from 'pako';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import domtoimage from 'dom-to-image-more';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Injectable({
  providedIn: 'root',
})
export class LeafletScreenshotCacheHelperService {
  private broadcastService = inject(BroadcastService);
  private envConfigService = inject(EnvConfigService);

  cacheMap = new Map();
  pendingPromises = new Map<string, Promise<string>>();

  // Initialize IndexedDB
  dbName = 'leafletScreenshotCache';
  storeName = 'screenshots';
  indexedDB!: IDBDatabase;
  indexedDbCount;

  argetNumberOfSpatialUnitFeatures = 0;
  screenshotsForCurrentSpatialUnitUpdate = true;
  executedScreenshotMapKeys = new Map();
  logProgressIndexSeparator;

  targetNumberOfSpatialUnitFeatures;

  // we intend to make keys for every feature of every possible spatial unit
  // i.e. "<CacheKey_prefix>__leaflet_screenshot_<spatialUnitID>_<featureID>"
  CacheKey_leafletScreenshotPrefix =
    this.envConfigService.localStoragePrefix + '_leaflet_screenshot_';

  constructor() {
    const request = indexedDB.open(this.dbName, 2);
    request.onupgradeneeded = (event: any) => {
      this.indexedDB = event.target.result;
      if (!this.indexedDB.objectStoreNames.contains(this.storeName)) {
        this.indexedDB.createObjectStore(this.storeName);
      }
    };
    request.onsuccess = (event: any) => {
      this.indexedDB = event.target.result;
      console.log('Database initialized successfully');
    };
    request.onerror = (event: any) => {
      console.error('Error initializing database:', event.target.error);
    };
  }

  async init() {
    this.screenshotsForCurrentSpatialUnitUpdate = false;
    this.executedScreenshotMapKeys = new Map();
    this.cacheMap = new Map();
    await this.loadScreenshotsFromIndexedDB();
  }

  generateUniqueCacheKey(mapName, spatialUnitId, featureId, pageOrientation, templateName?) {
    return (
      this.CacheKey_leafletScreenshotPrefix +
      '_' +
      mapName +
      '_' +
      spatialUnitId +
      '_' +
      featureId +
      '_' +
      pageOrientation +
      (templateName ? '_' + templateName : '')
    );
  }

  async storeResourceInCache(mapName, spatialUnitId, featureId, pageOrientation, imageDataUrl, templateName?) {
    const CacheKey = this.generateUniqueCacheKey(
      mapName,
      spatialUnitId,
      featureId,
      pageOrientation,
      templateName
    );

    const item = {
      imageDataUrl: imageDataUrl,
    };

    this.cacheMap.set(CacheKey, item);
    this.executedScreenshotMapKeys.set(CacheKey, CacheKey);

    try {
      const img = await fetch(imageDataUrl);
      if (img.ok) {
        const imgData = await img.blob();
        const blob = new Blob([imgData], { type: 'image/png' });
        const arrayBuffer = await blob.arrayBuffer();
        const compressed = pako.deflate(new Uint8Array(arrayBuffer));
        await this.saveScreenshotInIndexedDB(CacheKey, compressed);
      }
    } catch (e) {
      console.warn('Could not persist screenshot to IndexedDB:', e);
    }

    this.logProgress();
  }

  logProgress() {
    if (this.executedScreenshotMapKeys.size % this.logProgressIndexSeparator === 0) {
      this.broadcastService.broadcast('screenshotsForCurrentSpatialUnitUpdate');
    }

    if (this.targetNumberOfSpatialUnitFeatures <= this.executedScreenshotMapKeys.size) {
      this.screenshotsForCurrentSpatialUnitUpdate = true;
      this.broadcastService.broadcast('screenshotsForCurrentSpatialUnitUpdate');
    }
  }

  getResourceFromCache(mapName, spatialUnitId, featureId, pageOrientation, templateName?) {
    const CacheKey = this.generateUniqueCacheKey(
      mapName,
      spatialUnitId,
      featureId,
      pageOrientation,
      templateName
    );

    const item = this.cacheMap.get(CacheKey);

    if (item && item.imageDataUrl) {
      return item.imageDataUrl;
    }
    return undefined;
  }

  checkForScreenshot(
    mapName: string,
    spatialUnitId: string,
    featureId: string,
    pageOrientation: string,
    domElement: HTMLElement | null,
    templateName: string
  ): Promise<string> {
    const CacheKey = this.generateUniqueCacheKey(
      mapName,
      spatialUnitId,
      featureId,
      pageOrientation,
      templateName
    );

    if (this.cacheMap.has(CacheKey)) {
      this.executedScreenshotMapKeys.set(CacheKey, CacheKey);
      this.logProgress();
      return Promise.resolve(this.cacheMap.get(CacheKey).imageDataUrl);
    }

    if (this.pendingPromises.has(CacheKey)) {
      return this.pendingPromises.get(CacheKey)!;
    }

    const promise = new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (!domElement) {
          resolve('');
          return;
        }
        const el: HTMLElement = domElement;

        const capture = () => {
          domtoimage
            .toPng(el)
            .then(async (dataUrl: string) => {
              if (dataUrl.startsWith('blob:')) {
                try {
                  const response = await fetch(dataUrl);
                  const blob = await response.blob();
                  dataUrl = await new Promise<string>((res, rej) => {
                    const reader = new FileReader();
                    reader.onloadend = () => res(reader.result as string);
                    reader.onerror = rej;
                    reader.readAsDataURL(blob);
                  });
                } catch (e) {
                  console.error('Failed to convert blob URL to data URL:', e);
                }
              }

              await this.storeResourceInCache(
                mapName,
                spatialUnitId,
                featureId,
                pageOrientation,
                dataUrl,
                templateName
              );
              this.pendingPromises.delete(CacheKey);
              resolve(dataUrl);
            })
            .catch((error: any) => {
              console.error('Screenshot capture failed:', error);
              this.pendingPromises.delete(CacheKey);
              reject(error);
            });
        };

        const tiles = el.querySelectorAll('.leaflet-tile');
        if (tiles.length === 0) {
          console.warn('No Leaflet tiles found in DOM yet. Retrying after short delay...');
          setTimeout(() => capture(), 500);
        } else {
          capture();
        }
      }, 500);
    });

    this.pendingPromises.set(CacheKey, promise);
    return promise;
  }

  clearScreenshotMap() {
    this.executedScreenshotMapKeys = new Map();
    this.cacheMap = new Map();
  }

  // reset will not empty the current map of screeshots, instead it just resets the counter
  resetCounter(targetNumberOfSpatialUnitFeatures, clearCacheMap) {
    this.targetNumberOfSpatialUnitFeatures = targetNumberOfSpatialUnitFeatures;
    this.executedScreenshotMapKeys = new Map();
    if (clearCacheMap) {
      this.cacheMap = new Map();
    }
    this.screenshotsForCurrentSpatialUnitUpdate = false;

    // create progress log after each 10th percent of features
    this.logProgressIndexSeparator = Math.round((targetNumberOfSpatialUnitFeatures / 100) * 10);

    this.logProgress();
  }

  // reset will not empty the current map of screeshots, instead it just resets the counter
  resetCounter_keepingCurrentTargetFeatures(clearCacheMap) {
    this.executedScreenshotMapKeys = new Map();
    if (clearCacheMap) {
      this.cacheMap = new Map();
    }
    this.screenshotsForCurrentSpatialUnitUpdate = false;

    this.logProgress();
  }

  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);
      request.onupgradeneeded = (event: any) => {
        this.indexedDB = event.target.result;
        this.indexedDB.createObjectStore(this.storeName);
      };
      request.onsuccess = (event: any) => {
        this.indexedDB = event.target.result;
        this.getScreenshotCountFromIndexedDB();
        resolve('');
      };
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  async clearScreenshotCache() {
    const tx = this.indexedDB.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);
    const clearRequest = store.clear();

    clearRequest.onsuccess = (_event) => {
      this.resetCounter_keepingCurrentTargetFeatures(true);
      this.indexedDbCount = 0;
    };

    clearRequest.onerror = (event: any) => {
      console.error('Error clearing store:', event.target.errorCode);
      throw new Error('Error clearing store');
    };
  }

  async getScreenshotCountFromIndexedDB() {
    const tx = this.indexedDB.transaction([this.storeName], 'readonly');
    const store = tx.objectStore(this.storeName);
    const countRequest = store.count();

    countRequest.onsuccess = (event: any) => {
      this.indexedDbCount = event.target.result;
      return this.indexedDbCount;
    };

    countRequest.onerror = (event: any) => {
      console.error('Error counting entries:', event.target.errorCode);
      throw new Error('Error counting entries');
    };
  }

  async saveScreenshotInIndexedDB(key, data) {
    const tx = this.indexedDB.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);
    await store.put(data, key);
    this.getScreenshotCountFromIndexedDB();
  }

  async loadScreenshotFromIndexedDB(cacheKey) {
    const tx = this.indexedDB.transaction([this.storeName], 'readonly');
    const store = tx.objectStore(this.storeName);
    const req = store.get(cacheKey);

    req.onsuccess = () => {
      const compressed = req.result;
      const decompressed = pako.inflate(compressed);
      const blob = new Blob([decompressed], { type: 'image/png' });

      const url = URL.createObjectURL(blob);
      return url;
    };
  }

  async loadScreenshotsFromIndexedDB() {
    return new Promise((resolve, reject) => {
      const tx = this.indexedDB.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);

      const result = {};
      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          const compressed = cursor.value;
          const decompressed = pako.inflate(compressed);
          const blob = new Blob([decompressed], { type: 'image/png' });

          const url = URL.createObjectURL(blob);
          const item = {
            imageDataUrl: url,
          };

          this.cacheMap.set(cursor.key, item);
          cursor.continue();
        } else {
          this.getScreenshotCountFromIndexedDB();
          resolve(result);
        }
      };

      cursorRequest.onerror = (event: any) => reject(event.target.error);
    });
  }
}
