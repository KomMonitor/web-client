angular.module('kommonitorLeafletScreenshotCacheHelper', []);


angular
  .module('kommonitorLeafletScreenshotCacheHelper', [])
  .service(
    'kommonitorLeafletScreenshotCacheHelperService', ['$http', '__env', 'Auth', '$rootScope', '$timeout',
    function ($http, __env, Auth, $rootScope, $timeout) {

      let self = this;

      const CacheKey_prefix = __env.localStoragePrefix;

      self.cacheMap = new Map();

      // Initialize IndexedDB
      let dbName = 'leafletScreenshotCache';
      this.indexedDB;

      this.targetNumberOfSpatialUnitFeatures = 0;
      this.screenshotsForCurrentSpatialUnitUpdate = true;
      this.executedScreenshotMapKeys = new Map();
      this.logProgressIndexSeparator;

      // we intend to make keys for every feature of every possible spatial unit
      // i.e. "<CacheKey_prefix>__leaflet_screenshot_<spatialUnitID>_<featureID>"
      const CacheKey_leafletScreenshotPrefix = CacheKey_prefix + "_leaflet_screenshot_";

      this.generateUniqueCacheKey = function (mapName, spatialUnitId, featureId, pageOrientation) {

        return CacheKey_leafletScreenshotPrefix  + "_" + mapName + "_" + spatialUnitId + "_" + featureId + "_" + pageOrientation
      };

      this.storeResourceInCache = async function (mapName, spatialUnitId, featureId, pageOrientation, imageDataUrl) {
        // let timestampInSeconds = Math.floor(Date.now() / 1000);

        let CacheKey = self.generateUniqueCacheKey(mapName, spatialUnitId, featureId, pageOrientation);

        let item = {
          // "timestamp": timestampInSeconds,
          "imageDataUrl": imageDataUrl
        }

        self.cacheMap.set(CacheKey, item);
        self.executedScreenshotMapKeys.set(CacheKey, CacheKey);

        const blob = await (await fetch(imageDataUrl)).blob({ type: 'image/png' });
        // Convert blob to array buffer
        const arrayBuffer = await blob.arrayBuffer();

        // Compress with pako (zlib compression)
        const compressed = pako.deflate(new Uint8Array(arrayBuffer));

        // Save to IndexedDB
        await self.saveScreenshotInIndexedDB(CacheKey, compressed);
        console.log('Screenshot saved in IndexedDB (lossless compressed).');

        // send UI update information
        self.logProgress();        
      };

      this.logProgress = function(){
        if (self.executedScreenshotMapKeys.size % this.logProgressIndexSeparator === 0){
          $rootScope.$broadcast("screenshotsForCurrentSpatialUnitUpdate");
        }

        if (this.targetNumberOfSpatialUnitFeatures <= this.executedScreenshotMapKeys.size) {
          this.screenshotsForCurrentSpatialUnitUpdate = true;
          $rootScope.$broadcast("screenshotsForCurrentSpatialUnitUpdate");
        }
      }

      this.getResourceFromCache = function (mapName, spatialUnitId, featureId, pageOrientation) {
        let CacheKey = this.generateUniqueCacheKey(mapName, spatialUnitId, featureId, pageOrientation);

        let item = self.cacheMap.get(CacheKey);

        if (item && item.imageDataUrl) {
          return item.imageDataUrl;
        }
        return undefined;
      }

      this.checkForScreenshot = async function (mapName, spatialUnitId, featureId, pageOrientation, domElement) {

        let CacheKey = this.generateUniqueCacheKey(mapName, spatialUnitId, featureId, pageOrientation);
        if (!self.cacheMap.has(CacheKey)) {
          // we now trigger a process that will actually set this item after a timeout. However, for each spatial unit, two requests occur
          // for now we try to only execute one screenshot process for each spatial unit
          // thus we simply set an empty object for the current key to prevent multiple screenshot taking processes for the same item         
          setTimeout(function () {
            let leafletMapScreenshot = domtoimage
              .toJpeg(domElement, { quality: 1 })
              .then(function (dataUrl) {
                self.storeResourceInCache(mapName, spatialUnitId, featureId, pageOrientation, dataUrl);
              })
              .catch(function (error) {
                console.error('oops, something went wrong!', error);
              });
          }, 150);
        }
        else{
          // only increase executedCacheMap due to log progress
          self.executedScreenshotMapKeys.set(CacheKey, CacheKey);
          // send UI update information
          self.logProgress();     
        }

      }

      // (re)init the whole thing, counter and map of screenshots
      this.init = async function (targetNumberOfSpatialUnitFeatures) {
        // this.targetNumberOfSpatialUnitFeatures = targetNumberOfSpatialUnitFeatures;
        self.screenshotsForCurrentSpatialUnitUpdate = false;
        self.executedScreenshotMapKeys = new Map();
        self.cacheMap = new Map();

        // create progress log after each 10th percent of features
        // self.logProgressIndexSeparator = Math.round(targetNumberOfSpatialUnitFeatures / 100 * 10);

        await self.openIndexedDB();   
        await self.loadScreenshotsFromIndexedDB();         
      }

      this.clearScreenshotMap = function(){
        this.executedScreenshotMapKeys = new Map();
        this.cacheMap = new Map();
      }

      // reset will not empty the current map of screeshots, instead it just resets the counter
      this.resetCounter = function (targetNumberOfSpatialUnitFeatures, clearCacheMap) {
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
      this.resetCounter_keepingCurrentTargetFeatures = function (clearCacheMap) {
        this.executedScreenshotMapKeys = new Map();
        if (clearCacheMap){
          this.cacheMap = new Map();
        }
        this.screenshotsForCurrentSpatialUnitUpdate = false;

        this.logProgress();
      }

      this.openIndexedDB = () => {
        return new Promise((resolve, reject) => {

          console.log('setting persistence...');

          // navigator.storage.persist().then(granted => {
          //   if (granted) {
          //     console.log("Storage will not be cleared except by the user");
          //   } else {
          //     console.log("Storage may be cleared by the browser under storage pressure.");
          //   }
          // });

          const request = indexedDB.open(dbName, 1);
          request.onupgradeneeded = (event) => {
            self.indexedDB = event.target.result;
            self.indexedDB.createObjectStore('screenshots');
          };
          request.onsuccess = (event) => {
            self.indexedDB = event.target.result;
            resolve();
          };
          request.onerror = (event) => reject(event.target.error);
        });
      };

      this.saveScreenshotInIndexedDB = async (key, data) => {
        const tx = self.indexedDB.transaction(['screenshots'], 'readwrite');
        const store = tx.objectStore('screenshots');
        store.put(data, key);
      };

      this.loadScreenshotFromIndexedDB = async (cacheKey) => {
        const tx = self.indexedDB.transaction(['screenshots'], 'readonly');
        const store = tx.objectStore('screenshots');
        const req = store.get(cacheKey);

        req.onsuccess = () => {
          const compressed = req.result;
          const decompressed = pako.inflate(compressed);
          const blob = new Blob([decompressed], { type: 'image/png' });

          const url = URL.createObjectURL(blob);
          return url;
        };
      };

      this.loadScreenshotsFromIndexedDB = async () => {
        return new Promise((resolve, reject) => {
          const tx = self.indexedDB.transaction(['screenshots'], 'readonly');
          const store = tx.objectStore('screenshots');

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

              self.cacheMap.set(cursor.key, item);
              cursor.continue();
            } else {
              resolve(result); // Done iterating
            }
          };

          cursorRequest.onerror = (event) => reject(event.target.error);
      });
      }

      this.init();

    }]);
