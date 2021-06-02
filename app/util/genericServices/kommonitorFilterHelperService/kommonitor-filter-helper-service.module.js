angular.module('kommonitorFilterHelper', []);

angular
  .module('kommonitorFilterHelper', [])
  .service(
    'kommonitorFilterHelperService', ['$rootScope', '$timeout', '__env', 
    function ($rootScope, $timeout,
      __env) {

      var self = this;
      
      this.filteredIndicatorFeatureNames = [];

      this.completelyRemoveFilteredFeaturesFromDisplay = false;

      this.onChangeFilterBehaviourToggle = function(){
        if(this.completelyRemoveFilteredFeaturesFromDisplay){

        }
        else{

        }
      };

      this.applyRangeFilter = function(features, targetDateProperty, minFilterValue, maxFilterValue){
        if(!this.filteredIndicatorFeatureNames){
          this.filteredIndicatorFeatureNames = [];
        }
        for (const feature of features) {
          var value = +Number(feature.properties[targetDateProperty]).toFixed(__env.numberOfDecimals);

          if(value >= minFilterValue && value <= maxFilterValue){
            // feature must not be filtered - make sure it is not marked as filtered
            if (this.filteredIndicatorFeatureNames.includes(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME])){
              var index = this.filteredIndicatorFeatureNames.indexOf(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME]);
              this.filteredIndicatorFeatureNames.splice(index, 1);
            }
          }
          else{
            // feature must be filtered
            if (!this.filteredIndicatorFeatureNames.includes(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME])){
              this.filteredIndicatorFeatureNames.push(feature.properties[__env.FEATURE_NAME_PROPERTY_NAME]);
            }
          }
        }
      };
  
    }]);
