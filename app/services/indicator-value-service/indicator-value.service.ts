import { Injectable, inject } from '@angular/core';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Pure indicator value / formatting utilities. Extracted in the Prio 7 god-service
 * split (see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Deliberately stateless: depends only on EnvConfigService (decimals / date prefix)
 * and its parameters. The selection-derived `precision` is passed in by each caller
 * (see their local precision-resolving wrappers), so this service never touches
 * shared selection state.
 */
@Injectable({
  providedIn: 'root',
})
export class IndicatorValueService {
  private envConfigService = inject(EnvConfigService);

  indicatorValueIsNoData(indicatorValue) {
    if (Number.isNaN(indicatorValue) || indicatorValue === null || indicatorValue === undefined) {
      return true;
    }
    return false;
  }

  getIndicatorValue_asFormattedText(indicatorValue, precision: any = undefined) {
    let maximumDecimals = this.envConfigService.numberOfDecimals;
    let minimumDecimals = 0;
    if (precision !== undefined) {
      maximumDecimals = precision;
      minimumDecimals = precision;
    }

    let value;
    if (this.indicatorValueIsNoData(indicatorValue)) {
      value = 'NoData';
    } else {
      value = Number(indicatorValue).toLocaleString('de-DE', {
        maximumFractionDigits: maximumDecimals,
        minimumFractionDigits: minimumDecimals,
      });
    }

    // if the original value is greater than zero but would be rounded as 0 then we must return the original result
    if (Number(value) == 0 && indicatorValue > 0) {
      value = Number(indicatorValue).toLocaleString('de-DE', {
        minimumFractionDigits: minimumDecimals,
        maximumFractionDigits: maximumDecimals,
      });
    }

    return value;
  }

  getIndicatorValue_asNumber(indicatorValue, precision: any = undefined) {
    let maximumDecimals = this.envConfigService.numberOfDecimals;
    if (precision !== undefined) {
      maximumDecimals = precision;
    }

    let value;
    if (this.indicatorValueIsNoData(indicatorValue)) {
      value = 'NoData';
    } else {
      value = +Number(indicatorValue).toFixed(maximumDecimals);
    }

    // if the original value is greater than zero but would be rounded as 0 then we must return the original result
    if (Number(value) == 0 && indicatorValue > 0) {
      value = Number(indicatorValue);
    }

    return value;
  }

  getIndicatorValueFromArray_asNumber(
    propertiesArray,
    targetDateString,
    precision: any = undefined
  ) {
    if (!targetDateString.includes(this.envConfigService.indicatorDatePrefix)) {
      targetDateString = this.envConfigService.indicatorDatePrefix + targetDateString;
    }
    const indicatorValue = propertiesArray[targetDateString];
    let value;
    if (this.indicatorValueIsNoData(indicatorValue)) {
      value = 'NoData';
    } else {
      value = this.getIndicatorValue_asNumber(indicatorValue, precision);
    }

    return value;
  }

  getIndicatorValue_asFixedPrecisionNumber(indicatorValue, precision: any = undefined) {
    let maximumDecimals = this.envConfigService.numberOfDecimals;
    let minimumDecimals = 0;
    if (precision !== undefined) {
      maximumDecimals = precision;
      minimumDecimals = precision;
    }

    let value;
    if (this.indicatorValueIsNoData(indicatorValue)) {
      value = 'NoData';
    } else {
      // value = string with . as separator, without "," as thounsand-sep
      value = indicatorValue
        .toLocaleString('en-GB', {
          maximumFractionDigits: maximumDecimals,
          minimumFractionDigits: minimumDecimals,
        })
        .replace(',', '');
    }

    // if the original value is greater than zero but would be rounded as 0 then we must return the original result
    if (Number(value) == 0 && indicatorValue > 0) {
      value = Number(indicatorValue);
    }

    return value;
  }

  syntaxHighlightJSON(json) {
    if (typeof json != 'string') {
      json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key';
          } else {
            cls = 'string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean';
        } else if (/null/.test(match)) {
          cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
  }

  /**
   * Picks the most meaningful part of an error (HTTP response body or its
   * message, falling back to the raw error) and returns it as syntax-highlighted
   * JSON for display in the admin error alerts. Replaces the divergent inline
   * `error.error`/`error.data` cascades that previously lived in the indicator
   * management modals.
   */
  formatError(error) {
    const detail =
      error?.error?.message ?? error?.error ?? error?.data?.message ?? error?.data ?? error;
    return this.syntaxHighlightJSON(detail);
  }

  formatIndicatorNameForLabel(indicatorName, maxCharsPerLine) {
    const arr: any[] = [];
    const space = /\s/;

    const words = indicatorName.split(space);
    // push first word into new array
    if (words[0].length) {
      arr.push(words[0]);
    }

    for (let i = 1; i < words.length; i++) {
      if (words[i].length + arr[arr.length - 1].length < maxCharsPerLine) {
        arr[arr.length - 1] = `${arr[arr.length - 1]} ${words[i]}`;
      } else {
        arr.push(words[i]);
      }
    }
    return arr.join('\n');
  }

  createDualListInputArray(array, nameProperty, idProperty): any[] {
    const result: any[] = [];

    if (array && Array.isArray(array)) {
      for (const item of array) {
        const obj = {};
        obj['category'] = item[nameProperty];
        obj['name'] = item[nameProperty];
        if (idProperty && item[idProperty] !== undefined) {
          obj['id'] = item[idProperty];
        }
        result.push(obj);
      }
    }

    return result;
  }
}
