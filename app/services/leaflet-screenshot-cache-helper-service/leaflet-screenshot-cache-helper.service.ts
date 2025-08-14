import { Inject, Injectable } from '@angular/core';
import pako from 'pako';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import domtoimage from 'dom-to-image-more';

@Injectable({
  providedIn: 'root'
})
export class LeafletScreenshotCacheHelperService {

  CacheKey_prefix = window.__env.localStoragePrefix;

  cacheMap = new Map();

  // Initialize IndexedDB
  dbName = 'leafletScreenshotCache';
  storeName = "screenshots";
  indexedDB;
  indexedDbCount;

  argetNumberOfSpatialUnitFeatures = 0;
  screenshotsForCurrentSpatialUnitUpdate = true;
  executedScreenshotMapKeys = new Map();
  logProgressIndexSeparator;

  targetNumberOfSpatialUnitFeatures;

  // we intend to make keys for every feature of every possible spatial unit
  // i.e. "<CacheKey_prefix>__leaflet_screenshot_<spatialUnitID>_<featureID>"
  CacheKey_leafletScreenshotPrefix = this.CacheKey_prefix + "_leaflet_screenshot_";

  constructor(
    private broadcastService: BroadcastService
  ) {}

  generateUniqueCacheKey(mapName, spatialUnitId, featureId, pageOrientation) {

    return this.CacheKey_leafletScreenshotPrefix  + "_" + mapName + "_" + spatialUnitId + "_" + featureId + "_" + pageOrientation
  };

  async storeResourceInCache(mapName, spatialUnitId, featureId, pageOrientation, imageDataUrl) {
    // let timestampInSeconds = Math.floor(Date.now() / 1000);

    let CacheKey = this.generateUniqueCacheKey(mapName, spatialUnitId, featureId, pageOrientation);

    let item = {
      // "timestamp": timestampInSeconds,
      "imageDataUrl": imageDataUrl
    }

    this.cacheMap.set(CacheKey, item);
    this.executedScreenshotMapKeys.set(CacheKey, CacheKey);

    // todo
    //const blob = await (await fetch(imageDataUrl)).blob({ type: 'image/png' });
    const blob = await (await fetch(imageDataUrl)).blob();
    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer();

    // Compress with pako (zlib compression)
    const compressed = pako.deflate(new Uint8Array(arrayBuffer));

    // Save to IndexedDB
    await this.saveScreenshotInIndexedDB(CacheKey, compressed);

    // send UI update information
    this.logProgress();        
  };

  logProgress(){
    if (this.executedScreenshotMapKeys.size % this.logProgressIndexSeparator === 0){
      this.broadcastService.broadcast("screenshotsForCurrentSpatialUnitUpdate");
    }

    if (this.targetNumberOfSpatialUnitFeatures <= this.executedScreenshotMapKeys.size) {
      this.screenshotsForCurrentSpatialUnitUpdate = true;
      this.broadcastService.broadcast("screenshotsForCurrentSpatialUnitUpdate");
    }
  }

  getResourceFromCache(mapName, spatialUnitId, featureId, pageOrientation) {
    let CacheKey = this.generateUniqueCacheKey(mapName, spatialUnitId, featureId, pageOrientation);

    let item = this.cacheMap.get(CacheKey);

    if (item && item.imageDataUrl) {
      return item.imageDataUrl;
    }
    return undefined;
  }

  async checkForScreenshot(mapName, spatialUnitId, featureId, pageOrientation, domElement) {

    let CacheKey = this.generateUniqueCacheKey(mapName, spatialUnitId, featureId, pageOrientation);
    if (!this.cacheMap.has(CacheKey)) {
      // we now trigger a process that will actually set this item after a timeout. However, for each spatial unit, two requests occur
      // for now we try to only execute one screenshot process for each spatial unit
      // thus we simply set an empty object for the current key to prevent multiple screenshot taking processes for the same item         
      setTimeout(() => {
        let leafletMapScreenshot = domtoimage
          .toJpeg(domElement, { quality: 1 })
          .then((dataUrl) => {
            this.storeResourceInCache(mapName, spatialUnitId, featureId, pageOrientation, dataUrl);
          })
          .catch(function (error) {
            console.error('oops, something went wrong!', error);
          });
      }, 150);
    }
    else{
      // only increase executedCacheMap due to log progress
      this.executedScreenshotMapKeys.set(CacheKey, CacheKey);
      // send UI update information
      this.logProgress();     
    }

  }

  // (re)init the whole thing, counter and map of screenshots
  async init(targetNumberOfSpatialUnitFeatures) {
    // this.targetNumberOfSpatialUnitFeatures = targetNumberOfSpatialUnitFeatures;
    this.screenshotsForCurrentSpatialUnitUpdate = false;
    this.executedScreenshotMapKeys = new Map();
    this.cacheMap = new Map();

    // create progress log after each 10th percent of features
    // this.logProgressIndexSeparator = Math.round(targetNumberOfSpatialUnitFeatures / 100 * 10);

    await this.openIndexedDB();   
    await this.loadScreenshotsFromIndexedDB();         
  }

  clearScreenshotMap(){
    this.executedScreenshotMapKeys = new Map();
    this.cacheMap = new Map();
  }

  // reset will not empty the current map of screeshots, instead it just resets the counter
  resetCounter(targetNumberOfSpatialUnitFeatures, clearCacheMap) {
    this.targetNumberOfSpatialUnitFeatures = targetNumberOfSpatialUnitFeatures;
    this.executedScreenshotMapKeys = new Map();
    if (clearCacheMap){
      this.cacheMap = new Map();
    }
    this.screenshotsForCurrentSpatialUnitUpdate = false;

    // create progress log after each 10th percent of features
    this.logProgressIndexSeparator = Math.round(targetNumberOfSpatialUnitFeatures / 100 * 10);

    this.logProgress();
  }

  // reset will not empty the current map of screeshots, instead it just resets the counter
  resetCounter_keepingCurrentTargetFeatures(clearCacheMap) {
    this.executedScreenshotMapKeys = new Map();
    if (clearCacheMap){
      this.cacheMap = new Map();
    }
    this.screenshotsForCurrentSpatialUnitUpdate = false;

    this.logProgress();
  }

  openIndexedDB() {
    return new Promise((resolve, reject) => {

      // navigator.storage.persist().then(granted => {
      //   if (granted) {
      //     console.log("Storage will not be cleared except by the user");
      //   } else {
      //     console.log("Storage may be cleared by the browser under storage pressure.");
      //   }
      // });

      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event:any) => {
        this.indexedDB = event.target.result;
        this.indexedDB.createObjectStore(this.storeName);
      };
      request.onsuccess = (event:any) => {
        this.indexedDB = event.target.result;
        this.getScreenshotCountFromIndexedDB();
        // todo
        //resolve();
        resolve('');
      };
      request.onerror = (event:any) => reject(event.target.error);
    });
  }

  async clearScreenshotCache() {

    const tx = this.indexedDB.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);
    const clearRequest = store.clear(); // This is the method to clear the store

    clearRequest.onsuccess = (event) => {          
      this.resetCounter_keepingCurrentTargetFeatures(true); // also delete current cacheMap, as we want to force regeneration of all screenshots
      this.indexedDbCount = 0;
      return; // Resolve the promise when clearing is successful
    };

    clearRequest.onerror = (event) => {
      console.error("Error clearing store:", event.target.errorCode);
      throw new Error("Error clearing store");
    };
  }

  async getScreenshotCountFromIndexedDB() {
    const tx = this.indexedDB.transaction([this.storeName], 'readonly');
    const store = tx.objectStore(this.storeName);
    const countRequest = store.count();

    countRequest.onsuccess = (event) => {
      this.indexedDbCount = event.target.result;
      return this.indexedDbCount;   
    };

    countRequest.onerror = (event) => {
      console.error("Error counting entries:", event.target.errorCode);
      throw new Error("Error counting entries");
    };
  }

  async saveScreenshotInIndexedDB(key, data) {
    const tx = this.indexedDB.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);
    store.put(data, key);
    this.getScreenshotCountFromIndexedDB()
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

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const compressed = cursor.value;
          const decompressed = pako.inflate(compressed);
          const blob = new Blob([decompressed], { type: 'image/png' });

          const url = URL.createObjectURL(blob);
          let item = {
            // "timestamp": timestampInSeconds,
            "imageDataUrl": url
          }

          this.cacheMap.set(cursor.key, item);
          cursor.continue();
        } else {
          this.getScreenshotCountFromIndexedDB()
          resolve(result); // Done iterating
        }
      };

      cursorRequest.onerror = (event) => reject(event.target.error);
    });
  }
}
