import { ActivatedRoute, Router } from '@angular/router';
import { Injectable, inject } from '@angular/core';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalFilterHelperService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private envConfigService = inject(EnvConfigService);

  queryParamMap = new Map();
  currentShareLink = '';

  paramName_app = 'application';
  applicationFilterId: any = '';
  applicationFilter: any;
  filterParamSet = false;
  filterApplied: boolean = false;

  applyQueryParams() {
    // todo, once fully migrated, change to ngRoute with valid url params and adjust code here accordingly

    if (window.location.href.includes(this.paramName_app)) {
      const urlParts = window.location.href.split(`${this.paramName_app}=`);
      this.applicationFilterId = urlParts[1];

      this.envConfigService.filterConfig.some((filterConfig) => {
        if (filterConfig['name'] === this.applicationFilterId) {
          this.applicationFilter = filterConfig;
          return true;
        }

        return false;
      });
    }
  }

  init() {
    // todo, once fully migrated, change to ngRoute with valid url params and adjust code here accordingly

    // No need to parse sharing params if sharing is not true
    if (window.location.href.includes(this.paramName_app)) {
      this.filterParamSet = true;
      this.filterApplied = true;
      // set config and data options from params
      this.applyQueryParams();
    } else {
      this.filterParamSet = false;
      this.filterApplied = false;
    }
  }

  applyFilterSelection(filterConfig) {
    if (filterConfig.length) {
      this.applicationFilter = this.merge(filterConfig);
      this.filterApplied = true;
    } else {
      this.applicationFilter = undefined;
      this.filterApplied = false;
    }
  }

  merge(filterConfig) {
    const mergedConfig = {
      indicatorTopics: [],
      indicators: [],
      georesourceTopics: [],
      georesources: [],
    };

    filterConfig.forEach((current) => {
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(mergedConfig, key)) {
          mergedConfig[key] = [...new Set([...mergedConfig[key], ...current[key]])];
        }
      }
    });

    return mergedConfig;
  }

  editGlobalFilterConfig(filterConfig, index, topicType, topicId) {
    if (filterConfig[index].checked === true) {
      if (filterConfig[index][topicType].indexOf(topicId) < 0)
        filterConfig[index][topicType].push(topicId);
    } else
      filterConfig[index][topicType] = filterConfig[index][topicType].filter((e) => e != topicId);
  }

  isFilterParamSet() {
    return this.filterParamSet;
  }

  globalFilterApplied(): boolean {
    return this.filterParamSet || this.filterApplied;
  }

  reset() {
    if (this.filterParamSet) {
      this.router.navigate(['/']);
      this.filterParamSet = false;
    }

    this.applicationFilter = undefined;
    this.filterApplied = false;
  }
}
