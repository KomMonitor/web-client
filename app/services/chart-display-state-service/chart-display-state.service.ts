import { Injectable } from '@angular/core';

/**
 * Holds the "balance" / "measure of value" display-mode state shared between
 * the map, legend, classification, filter and chart components. Extracted in the
 * Prio 7 god-service split (see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 */
@Injectable({
  providedIn: 'root',
})
export class ChartDisplayStateService {
  isBalanceChecked!: boolean;
  indicatorAndMetadataAsBalance: any;
  isMeasureOfValueChecked = false;
  measureOfValue: any;
}
