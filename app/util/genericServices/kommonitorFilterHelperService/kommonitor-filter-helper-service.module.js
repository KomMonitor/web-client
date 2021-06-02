angular.module('kommonitorFilterHelper', []);

angular
  .module('kommonitorFilterHelper', [])
  .service(
    'kommonitorFilterHelperService', ['$rootScope', '$timeout', '__env', 
    function ($rootScope, $timeout,
      __env) {

      var self = this;
      
      this.filteredIndicatorFeatureIds = new Map();

      this.completelyRemoveFilteredFeaturesFromDisplay = false;

      this.onChangeFilterBehaviourToggle = function(){
        if(this.completelyRemoveFilteredFeaturesFromDisplay){

        }
        else{

        }
      };

      this.featureIsCurrentlyFiltered = function(featureId){
        return this.filteredIndicatorFeatureIds.has(featureId);
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
            if (this.filteredIndicatorFeatureIds.has(feature.properties[__env.FEATURE_ID_PROPERTY_NAME])){
              this.filteredIndicatorFeatureIds.delete(feature.properties[__env.FEATURE_ID_PROPERTY_NAME]);
            }
          }
          else{
            // feature must be filtered
            if (!this.filteredIndicatorFeatureIds.has(feature.properties[__env.FEATURE_ID_PROPERTY_NAME])){
              this.filteredIndicatorFeatureIds.set(feature.properties[__env.FEATURE_ID_PROPERTY_NAME], feature);
            }
          }
        }
      };
  
    }]);
