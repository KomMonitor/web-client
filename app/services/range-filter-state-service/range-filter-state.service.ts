import { Injectable } from '@angular/core';

/**
 * Holds the indicator range-filter state shared between the filter panel, the
 * balance panel and the top-level user-interface component: the current filter
 * data and whether a range filter is currently applied. Extracted in the Prio 7
 * god-service split (see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 */
@Injectable({
  providedIn: 'root',
})
export class RangeFilterStateService {
  rangeFilterData: any;
  rangeFilterIsApplied: any;
}
