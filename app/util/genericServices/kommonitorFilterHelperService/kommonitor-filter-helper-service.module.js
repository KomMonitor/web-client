angular.module('kommonitorFilterHelper', []);

angular
  .module('kommonitorFilterHelper', ['kommonitorMap', 'kommonitorDataExchange'])
  .service(
    'kommonitorFilterHelperService', ['$rootScope', '$timeout', '__env', 'kommonitorMapService', "kommonitorDataExchangeService",
    function ($rootScope, $timeout,
      __env, kommonitorMapService, kommonitorDataExchangeService) {

      var self = this;
      
      this.filteredIndicatorFeatureIds = new Map();
      this.selectedIndicatorFeatureIds = new Map();

      this.completelyRemoveFilteredFeaturesFromDisplay = true;

      this.onChangeFilterBehaviourToggle = function(){
        this.performSpatialFilter();
      };

      // FEATURE SELECTION

      this.featureIsCurrentlySelected = function(featureId){
        return this.selectedIndicatorFeatureIds.has("" + featureId);
      };

      this.clearSelectedFeatures = function(){
        this.selectedIndicatorFeatureIds = new Map();
      };

      this.addFeatureToSelection = function(feature){
        if(feature.properties){
          this.selectedIndicatorFeatureIds.set("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME], feature);
        }
        else{
          this.selectedIndicatorFeatureIds.set("" + feature[__env.FEATURE_ID_PROPERTY_NAME], feature);
        }
        $rootScope.$broadcast("onAddedFeatureToSelection", this.selectedIndicatorFeatureIds);
      };

      this.removeFeatureFromSelection = function(featureId){
        this.selectedIndicatorFeatureIds.delete("" + featureId);
        $rootScope.$broadcast("onRemovedFeatureFromSelection", this.selectedIndicatorFeatureIds);
      };


      // FEATURE FILTER      

      this.featureIsCurrentlyFiltered = function(featureId){
        return this.filteredIndicatorFeatureIds.has("" + featureId);
      };

      this.clearFilteredFeatures = function(){
        this.filteredIndicatorFeatureIds = new Map();
      };

      this.applyRangeFilter = function(features, targetDateProperty, minFilterValue, maxFilterValue){
        if(!this.filteredIndicatorFeatureIds){
          this.filteredIndicatorFeatureIds = new Map();
        }
        for (const feature of features) {
          var value = +Number(feature.properties[targetDateProperty]).toFixed(__env.numberOfDecimals);

          if(value >= minFilterValue && value <= maxFilterValue){
            // feature must not be filtered - make sure it is not marked as filtered
            if (this.filteredIndicatorFeatureIds.has("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME])){
              this.filteredIndicatorFeatureIds.delete("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME]);
            }
          }
          else{
            // feature must be filtered
            if (!this.filteredIndicatorFeatureIds.has("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME])){
              this.filteredIndicatorFeatureIds.set("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME], feature);
            }
          }
        }

        // range filter should only display filtered items as filtered, not remove them totally, as this qould require either
        // more complicated management of all features or direct update of range min/max values
        kommonitorMapService.restyleCurrentLayer();
        
      };

      this.performSpatialFilter = function(){        
        if(! this.completelyRemoveFilteredFeaturesFromDisplay){
          // kommonitorMapService.restyleCurrentLayer();
          if(kommonitorDataExchangeService.isBalanceChecked){
            kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.indicatorAndMetadataAsBalance, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedDate, false);        
          }
          else{
            kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedDate, false);        
          }
        }        
        else{
          this.filterAndReplaceDataset();          
        }

        this.checkFeatureSelection();
      };

      this.checkFeatureSelection = function(){
        // remove any selected items that are not visible in current filtered dataset
        // only if features are fully removed from dataset
        if(this.completelyRemoveFilteredFeaturesFromDisplay){
          let oldSelectionMap = this.selectedIndicatorFeatureIds;
          
          for (let key of this.selectedIndicatorFeatureIds.keys()) {
            if (this.filteredIndicatorFeatureIds.has("" + key)){
              this.selectedIndicatorFeatureIds.delete("" + key);
            }
          }
        }
        
        $rootScope.$broadcast("onRemovedFeatureFromSelection", this.selectedIndicatorFeatureIds);
      };

      this.filterAndReplaceDataset = function(){
        let indicatorMetadataAndGeoJSON;
        if(kommonitorDataExchangeService.isBalanceChecked){            
          let filteredIndicatorFeatures = kommonitorDataExchangeService.indicatorAndMetadataAsBalance.geoJSON.features.filter(feature => !self.filteredIndicatorFeatureIds.has("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME]));
    
          indicatorMetadataAndGeoJSON = JSON.parse(JSON.stringify(kommonitorDataExchangeService.indicatorAndMetadataAsBalance));
          indicatorMetadataAndGeoJSON.geoJSON.features = filteredIndicatorFeatures;
          kommonitorMapService.replaceIndicatorGeoJSON(indicatorMetadataAndGeoJSON, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedDate, false);
        
        }
        else{
          let filteredIndicatorFeatures = kommonitorDataExchangeService.selectedIndicator.geoJSON.features.filter(feature => !self.filteredIndicatorFeatureIds.has("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME]));
    
          indicatorMetadataAndGeoJSON = JSON.parse(JSON.stringify(kommonitorDataExchangeService.selectedIndicator));
          indicatorMetadataAndGeoJSON.geoJSON.features = filteredIndicatorFeatures;          
          kommonitorMapService.replaceIndicatorGeoJSON(indicatorMetadataAndGeoJSON, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, kommonitorDataExchangeService.selectedDate, false);
          
        }
        
        $rootScope.$broadcast("updateIndicatorValueRangeFilter", kommonitorDataExchangeService.selectedDate, indicatorMetadataAndGeoJSON);
        $rootScope.$broadcast("updateMeasureOfValueBar", kommonitorDataExchangeService.selectedDate, indicatorMetadataAndGeoJSON);
      };

      this.applySpatialFilter_higherSpatialUnitFeatures = function(higherSpatialUnitFilterFeatureGeoJSON, targetFeatureNames){

        // if(!this.filteredIndicatorFeatureIds){
          
        // }
        this.filteredIndicatorFeatureIds = new Map();

        // manage map of filtered features
        let targetHigherSpatialUnitFilterFeatures = higherSpatialUnitFilterFeatureGeoJSON.features.filter(feature => targetFeatureNames.includes(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME]));
          
        for (const feature of kommonitorDataExchangeService.selectedIndicator.geoJSON.features) {
          this.filteredIndicatorFeatureIds.set("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME], feature);
          for (const higherSpatialUnitFeature of targetHigherSpatialUnitFilterFeatures) {
            if(turf.booleanWithin(turf.pointOnFeature(feature), higherSpatialUnitFeature)){
              this.filteredIndicatorFeatureIds.delete("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME]);
              break;
            }
          }          
        }

        // apply filter
        this.performSpatialFilter();
      };

      this.applySpatialFilter_currentSpatialUnitFeatures = function(targetFeatureNames){
         // if(!this.filteredIndicatorFeatureIds){
          
        // }
        this.filteredIndicatorFeatureIds = new Map();

        // manage map of filtered features        
        for (const feature of kommonitorDataExchangeService.selectedIndicator.geoJSON.features) {
          if(!targetFeatureNames.includes(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME])){
            this.filteredIndicatorFeatureIds.set("" + feature.properties[__env.FEATURE_ID_PROPERTY_NAME], feature);
          }         
        }

        // apply filter
        this.performSpatialFilter();
      };
  
    }]);
