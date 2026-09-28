import { Router } from '@angular/router';
import { Injectable, inject } from '@angular/core';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/** Route param name for the global-filter route, see app.routes.ts ('app/:filterId'). */
export const FILTER_ID_ROUTE_PARAM = 'filterId';

@Injectable({
  providedIn: 'root',
})
export class GlobalFilterHelperService {
  private router = inject(Router);
  private envConfigService = inject(EnvConfigService);
  private notificationService = inject(NotificationService);

  applicationFilterId: any = '';
  applicationFilter: any;
  filterParamSet = false;
  filterApplied: boolean = false;

  /** The filterId route param of the currently matched top-level route, if any (see app.routes.ts: 'app/:filterId'). */
  private getFilterIdFromRoute(): string | null {
    return (
      this.router.routerState.snapshot.root.firstChild?.paramMap.get(FILTER_ID_ROUTE_PARAM) ?? null
    );
  }

  /** Resolves applicationFilterId/applicationFilter from the route; returns whether a matching filter was found. */
  applyRouteFilter(): boolean {
    this.applicationFilterId = this.getFilterIdFromRoute();

    return (this.envConfigService.filterConfig ?? []).some((filterConfig) => {
      if (filterConfig['name'] === this.applicationFilterId) {
        this.applicationFilter = filterConfig;
        return true;
      }

      return false;
    });
  }

  init() {
    const filterId = this.getFilterIdFromRoute();

    // No need to parse the filter route param if sharing is not active
    if (!filterId) {
      this.filterParamSet = false;
      this.filterApplied = false;
      return;
    }

    // set config and data options from the route
    if (this.applyRouteFilter()) {
      this.filterParamSet = true;
      this.filterApplied = true;
    } else {
      this.filterParamSet = false;
      this.filterApplied = false;
      // Keep this visible until the user dismisses it - an unknown filterId is
      // easy to miss otherwise, since the default toast auto-hides after 5s.
      this.notificationService.showError('Räuml. Filter konnte nicht gefunden werden', {
        autohide: false,
      });
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
