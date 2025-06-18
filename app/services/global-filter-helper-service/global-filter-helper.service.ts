import { ajskommonitorGlobalFilterHelperServiceProvider } from './../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalFilterHelperService {

  baseUrlToKomMonitorDataAPI = window.__env.apiUrl + window.__env.basePath;

  queryParamMap = new Map();
  currentShareLink = "";

  paramName_app = "application";
  applicationFilterId:any = "";
  applicationFilter:any;
  filterParamSet = false;

  applyQueryParams(){
    // todo
   /*  if ($routeParams[this.paramName_app]){
      this.applicationFilterId = $routeParams[this.paramName_app];

      window.__env.filterConfig.some((filterConfig) => {
        if (filterConfig['name'] === this.applicationFilterId) {
          this.applicationFilter = filterConfig;
          return true;
        }
      });
    }  */
  };

  init(){
// todo
    // No need to parse sharing params if sharing is not true
 /*    if ($routeParams[this.paramName_app]) {
      this.filterParamSet = true;
      // set config and data options from params
      this.applyQueryParams();
    } else
      this.filterParamSet = false; */
  };

  applyFilterSelection(filterConfig) {

    if(filterConfig.length) 
      this.applicationFilter = this.merge(filterConfig);
    else
      this.applicationFilter = undefined;
  }

  merge(filterConfig) {

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
  
  editGlobalFilterConfig (filterConfig, index, topicType, topicId) {

    if(filterConfig[index].checked===true) {
      if(filterConfig[index][topicType].indexOf(topicId)<0)
        filterConfig[index][topicType].push(topicId);
    } else
      filterConfig[index][topicType] = filterConfig[index][topicType].filter(e => e!=topicId);
  }

  isFilterParamSet () {
    return this.filterParamSet;
  }
}
