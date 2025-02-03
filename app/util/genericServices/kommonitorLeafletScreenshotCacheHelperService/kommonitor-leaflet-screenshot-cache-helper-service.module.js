angular.module('kommonitorLeafletScreenshotCacheHelper', []);


angular
  .module('kommonitorLeafletScreenshotCacheHelper', [])
  .service(
    'kommonitorLeafletScreenshotCacheHelperService', ['$http', '__env', 'Auth', '$rootScope', '$timeout',
    function ($http, __env, Auth, $rootScope, $timeout) {

      let self = this;

      const CacheKey_prefix = __env.localStoragePrefix;

      self.cacheMap = new Map();

      this.targetNumberOfSpatialUnitFeatures;
      this.screenshotsForCurrentSpatialUnitUpdate = false;
      this.executedScreenshotMapKeys = new Map();
      this.logProgressIndexSeparator;

      // we intend to make keys for every feature of every possible spatial unit
      // i.e. "<CacheKey_prefix>__leaflet_screenshot_<spatialUnitID>_<featureID>"
      const CacheKey_leafletScreenshotPrefix = CacheKey_prefix + "_leaflet_screenshot_";

      this.generateUniqueCacheKey = function (spatialUnitId, featureId) {
        return CacheKey_leafletScreenshotPrefix + spatialUnitId + "_" + featureId;
      };

      this.storeResourceInCache = function (spatialUnitId, featureId, imageDataUrl) {
        // let timestampInSeconds = Math.floor(Date.now() / 1000);

        let CacheKey = CacheKey_leafletScreenshotPrefix + spatialUnitId + "_" + featureId;

        let item = {
          // "timestamp": timestampInSeconds,
          "imageDataUrl": imageDataUrl
        }

        self.cacheMap.set(CacheKey, item);
        self.executedScreenshotMapKeys.set(CacheKey, CacheKey);
        if (self.executedScreenshotMapKeys.size % this.logProgressIndexSeparator === 0){
          $rootScope.$broadcast("screenshotsForCurrentSpatialUnitUpdate");
        }


        if (this.targetNumberOfSpatialUnitFeatures <= this.executedScreenshotMapKeys.size) {
          this.screenshotsForCurrentSpatialUnitUpdate = true;
          $rootScope.$broadcast("screenshotsForCurrentSpatialUnitUpdate");
        }
      };

      this.getResourceFromCache = function (spatialUnitId, featureId) {
        let CacheKey = CacheKey_leafletScreenshotPrefix + spatialUnitId + "_" + featureId;

        let item = self.cacheMap.get(CacheKey);

        if (item && item.imageDataUrl) {
          return item.imageDataUrl;
        }
        return undefined;
      }

      this.takeScreenshotAndStoreInCache = async function (spatialUnitId, featureId, domElement) {

        let CacheKey = CacheKey_leafletScreenshotPrefix + spatialUnitId + "_" + featureId;
        if (!self.cacheMap.has(CacheKey)) {
          // we now trigger a process that will actually set this item after a timeout. However, for each spatial unit, two requests occur
          // for now we try to only execute one screenshot process for each spatial unit
          // thus we simply set an empty object for the current key to prevent multiple screenshot taking processes for the same item         
          setTimeout(function () {
            console.log("trigger domToImage for leaflet map");
            let leafletMapScreenshot = domtoimage
              .toJpeg(domElement, { quality: 1 })
              .then(function (dataUrl) {
                self.storeResourceInCache(spatialUnitId, featureId, dataUrl);
              })
              .catch(function (error) {
                console.error('oops, something went wrong!', error);
              });
          }, 300);
        }

        // setTimeout(function(){
        //   console.log("trigger domToImage for leaflet map");
        //   let leafletMapScreenshot = domtoimage
        //     .toJpeg(domElement, { quality: 1 })
        //     .then(function (dataUrl) {
        //       self.storeResourceInCache(spatialUnitId, featureId, dataUrl);
        //     })
        //     .catch(function (error) {
        //         console.error('oops, something went wrong!', error);
        //     });
        // }, 300);

      }

      this.init = function (targetNumberOfSpatialUnitFeatures) {
        this.targetNumberOfSpatialUnitFeatures = targetNumberOfSpatialUnitFeatures;
        this.screenshotsForCurrentSpatialUnitUpdate = false;
        this.executedScreenshotMapKeys = new Map();

        // create progress log after each 10th percent of features
        this.logProgressIndexSeparator = Math.round(targetNumberOfSpatialUnitFeatures / 100 * 10);
      }


    }]);
