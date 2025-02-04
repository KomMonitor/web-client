angular.module('kommonitorLeafletScreenshotCacheHelper', []);


angular
  .module('kommonitorLeafletScreenshotCacheHelper', [])
  .service(
    'kommonitorLeafletScreenshotCacheHelperService', ['$http', '__env', 'Auth', '$rootScope', '$timeout',
    function ($http, __env, Auth, $rootScope, $timeout) {

      let self = this;

      const CacheKey_prefix = __env.localStoragePrefix;

      self.cacheMap = new Map();

      this.targetNumberOfSpatialUnitFeatures = 0;
      this.screenshotsForCurrentSpatialUnitUpdate = true;
      this.executedScreenshotMapKeys = new Map();
      this.logProgressIndexSeparator;

      // we intend to make keys for every feature of every possible spatial unit
      // i.e. "<CacheKey_prefix>__leaflet_screenshot_<spatialUnitID>_<featureID>"
      const CacheKey_leafletScreenshotPrefix = CacheKey_prefix + "_leaflet_screenshot_";

      this.generateUniqueCacheKey = function (spatialUnitId, featureId, pageOrientation) {

        return CacheKey_leafletScreenshotPrefix + spatialUnitId + "_" + featureId + "_" + pageOrientation
      };

      this.storeResourceInCache = function (spatialUnitId, featureId, pageOrientation, imageDataUrl) {
        // let timestampInSeconds = Math.floor(Date.now() / 1000);

        let CacheKey = this.generateUniqueCacheKey(spatialUnitId, featureId, pageOrientation);

        let item = {
          // "timestamp": timestampInSeconds,
          "imageDataUrl": imageDataUrl
        }

        self.cacheMap.set(CacheKey, item);
        self.executedScreenshotMapKeys.set(CacheKey, CacheKey);

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

      this.getResourceFromCache = function (spatialUnitId, featureId, pageOrientation) {
        let CacheKey = this.generateUniqueCacheKey(spatialUnitId, featureId, pageOrientation);

        let item = self.cacheMap.get(CacheKey);

        if (item && item.imageDataUrl) {
          return item.imageDataUrl;
        }
        return undefined;
      }

      this.checkForScreenshot = async function (spatialUnitId, featureId, pageOrientation, domElement) {

        let CacheKey = this.generateUniqueCacheKey(spatialUnitId, featureId, pageOrientation);
        if (!self.cacheMap.has(CacheKey)) {
          // we now trigger a process that will actually set this item after a timeout. However, for each spatial unit, two requests occur
          // for now we try to only execute one screenshot process for each spatial unit
          // thus we simply set an empty object for the current key to prevent multiple screenshot taking processes for the same item         
          setTimeout(function () {
            console.log("trigger domToImage for leaflet map");
            let leafletMapScreenshot = domtoimage
              .toJpeg(domElement, { quality: 1 })
              .then(function (dataUrl) {
                self.storeResourceInCache(spatialUnitId, featureId, pageOrientation, dataUrl);
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
      this.init = function (targetNumberOfSpatialUnitFeatures) {
        this.targetNumberOfSpatialUnitFeatures = targetNumberOfSpatialUnitFeatures;
        this.screenshotsForCurrentSpatialUnitUpdate = false;
        this.executedScreenshotMapKeys = new Map();
        this.cacheMap = new Map();

        // create progress log after each 10th percent of features
        this.logProgressIndexSeparator = Math.round(targetNumberOfSpatialUnitFeatures / 100 * 10);
      }

      this.clearScreenshotMap = function(){
        this.executedScreenshotMapKeys = new Map();
        this.cacheMap = new Map();
      }

      // reset will not empty the current map of screeshots, instead it just resets the counter
      this.resetCounter = function (targetNumberOfSpatialUnitFeatures) {
        this.targetNumberOfSpatialUnitFeatures = targetNumberOfSpatialUnitFeatures;
        this.executedScreenshotMapKeys = new Map();
        this.screenshotsForCurrentSpatialUnitUpdate = false;

        // create progress log after each 10th percent of features
        this.logProgressIndexSeparator = Math.round(targetNumberOfSpatialUnitFeatures / 100 * 10);
      }


    }]);
