angular.module('kommonitorGlobalFilterHelper', []);


angular
  .module('kommonitorGlobalFilterHelper', [])
  .service(
    'kommonitorGlobalFilterHelperService', [ 
    '$http', '__env', 'Auth', '$routeParams', '$location',
    function ($http, __env, Auth, $routeParams, $location) {

      this.baseUrlToKomMonitorDataAPI = __env.apiUrl + __env.basePath;
      let self = this;

      this.queryParamMap = new Map();
      this.currentShareLink = "";

      this.paramName_app = "application";
      this.applicationFilterId="";
      this.applicationFilter;
      this.filterParamSet = false;

      this.applyQueryParams = function(){
        if ($routeParams[this.paramName_app]){
          this.applicationFilterId = $routeParams[this.paramName_app];

          __env.filterConfig.some(function(filterConfig) {
            if (filterConfig['name'] === self.applicationFilterId) {
              self.applicationFilter = filterConfig;
              return true;
            }
          });
        } 
      };

      this.init = function(){

        // No need to parse sharing params if sharing is not true
        if ($routeParams[this.paramName_app]) {
          this.filterParamSet = true;
          // set config and data options from params
          this.applyQueryParams();
        } else
          this.filterParamSet = false;
      };

      this.applyFilterSelection = function(filterConfig) {

        if(filterConfig.length) 
          self.applicationFilter = this.merge(filterConfig);
        else
          self.applicationFilter = undefined;
      }

      this.merge = function(filterConfig) {

        var mergedConfig = {
          "indicatorTopics": [],
          "indicators": [],
          "georesourceTopics": [],
          "georesources": []
        };

        filterConfig.forEach(current => {
          for (var key in current) {
            if(mergedConfig.hasOwnProperty(key)) {
              mergedConfig[key] = [...new Set([...mergedConfig[key] ,...current[key]])];
            }
          }
        });

        return mergedConfig;
      }
      
      this.editGlobalFilterConfig = function(filterConfig, index, topicType, topicId) {

        if(filterConfig[index].checked===true) {
          if(filterConfig[index][topicType].indexOf(topicId)<0)
            filterConfig[index][topicType].push(topicId);
        } else
          filterConfig[index][topicType] = filterConfig[index][topicType].filter(e => e!=topicId);
      }

      this.isFilterParamSet = function() {
        return this.filterParamSet;
      }
    }
  ]);
