import { Injectable } from '@angular/core';

/**
 * Single implementation of the feature popup/tooltip HTML that was previously
 * copied ~8 times across the map component and the map helper services
 * (map refactoring plan, Phase 3).
 */
@Injectable({
  providedIn: 'root',
})
export class FeaturePopupHelperService {
  /** Builds the property table popup (`<div class="<cssClass> featurePropertyPopupContent"><table>…`). */
  buildFeaturePropertiesPopup(properties: any, popupCssClass: string): string {
    let popupContent =
      '<div class="' +
      popupCssClass +
      ' featurePropertyPopupContent"><table class="table table-condensed">';
    for (const p in properties) {
      popupContent += '<tr><td>' + p + '</td><td>' + properties[p] + '</td></tr>';
    }
    popupContent += '</table></div>';
    return popupContent;
  }

  /** Lazily binds the property table popup when the feature is clicked (main-map behavior). */
  bindFeaturePropertiesPopupOnClick(feature: any, layer: any, popupCssClass: string) {
    layer.on({
      click: () => {
        layer.bindPopup(this.buildFeaturePropertiesPopup(feature.properties, popupCssClass));
      },
    });
  }

  /** `<b>Name</b><br/>value [unit]` tooltip used for indicator features. */
  buildIndicatorTooltip(
    featureName: any,
    indicatorValueText: any,
    unitText: any,
    label?: any
  ): string {
    let optionalLabel = label ? '<br/>' + label : '';
    return (
      '<b>' + featureName + '</b><br/>' + indicatorValueText + ' [' + unitText + ']' + optionalLabel
    );
  }
}
