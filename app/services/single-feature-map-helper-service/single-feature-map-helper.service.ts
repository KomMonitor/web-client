import { Injectable, inject } from '@angular/core';
import L from 'leaflet';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeaturePopupHelperService } from 'services/feature-popup-helper-service/feature-popup-helper.service';

import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';

@Injectable({
  providedIn: 'root',
})
export class SingleFeatureMapHelperService {
  private genericMapHelperService = inject(GenericMapHelperService);
  private broadcastService = inject(BroadcastService);
  private visualStyleHelperService = inject(VisualStyleHelperServiceNew);
  private envConfigService = inject(EnvConfigService);
  private indicatorValueService = inject(IndicatorValueService);
  private selectionState = inject(SelectionStateService);
  private featurePopupHelperService = inject(FeaturePopupHelperService);

  // Local precision-resolving wrapper (formerly the DataExchangeService facade glue, Prio7 B1).
  private getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFormattedText(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  mapParts: any;
  georesourceData_geoJSON: any;

  resourceType_point = 'POINT';
  resourceType_line = 'LINE';
  resourceType_polygon = 'POLYGON';

  // create, edit, delete
  editMode = 'create';

  // NOTE: not an Angular lifecycle hook (services don't receive ngOnInit). Kept as a
  // plain method; currently uncalled — the same broadcast is also handled by
  // SingleFeatureEditComponent.
  initBroadcastSubscriptions(): void {
    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
      const values: any = broadcastMsg.values;

      switch (title) {
        case BroadcastMessage.OnUpdateSingleFeatureGeometry:
          {
            this.onUpdateSingleFeatureGeometry(values);
          }
          break;
      }
    });
  }

  addDataLayertoSingleFeatureGeoMap_georesource(geoJSON) {
    this.georesourceData_geoJSON = geoJSON;

    this.mapParts.dataLayer = this.genericMapHelperService.addDataLayer(
      geoJSON,
      this.mapParts.map,
      undefined,
      '',
      (feature, layer) => {
        layer.bindPopup(
          this.featurePopupHelperService.buildFeaturePropertiesPopup(
            feature.properties,
            'georesourceInfoPopupContent'
          )
        );

        layer.on({
          click: () => {
            this.broadcastService.broadcast(BroadcastMessage.SingleFeatureSelected, [feature]);
            layer.openPopup();
          },
        });
      },
      this.pointToLayer,
      this.style
    );
  }

  addContextLayerToSingleFeatureGeoMap_indicator(geoJSON) {
    const indicatorMetadata = this.selectionState.selectedIndicator;
    const date = this.selectionState.selectedDate;
    const propertyName = this.envConfigService.indicatorDatePrefix + date;

    // Simplified styling setup based on kommonitor-map.component
    const defaultBrew = this.visualStyleHelperService.setupDefaultBrew(
      geoJSON,
      propertyName,
      indicatorMetadata.defaultClassificationMapping.numClasses || 5,
      indicatorMetadata.defaultClassificationMapping.colorBrewerSchemeName,
      this.visualStyleHelperService.classifyMethod
    );

    const containsNegativeValues = geoJSON.features.some(
      (feature) => feature.properties[propertyName] < 0
    );

    let dynamicIncreaseBrew, dynamicDecreaseBrew;
    if (containsNegativeValues) {
      const dynamicBrewArray = this.visualStyleHelperService.setupDynamicIndicatorBrew(
        geoJSON,
        propertyName,
        this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
        this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
        this.visualStyleHelperService.classifyMethod,
        this.visualStyleHelperService.numClasses,
        []
      );
      dynamicIncreaseBrew = dynamicBrewArray[0];
      dynamicDecreaseBrew = dynamicBrewArray[1];
    }

    this.genericMapHelperService.addDataLayer(
      geoJSON,
      this.mapParts.map,
      undefined,
      '',
      (feature, layer) => this.onEachFeatureIndicator(feature, layer),
      this.pointToLayer,
      (feature) =>
        this.visualStyleHelperService.styleDefault(
          feature,
          defaultBrew,
          dynamicIncreaseBrew,
          dynamicDecreaseBrew,
          propertyName,
          this.envConfigService.useTransparencyOnIndicator,
          containsNegativeValues,
          false
        )
    );
  }

  onEachFeatureIndicator(feature, layer) {
    // Prepare feature data for map use, similar to kommonitor-map.component
    feature.tempData = {};
    const date = this.selectionState.selectedDate;
    const indicatorValue = feature.properties[this.envConfigService.indicatorDatePrefix + date];

    if (this.indicatorValueService.indicatorValueIsNoData(indicatorValue)) {
      feature.tempData.indicatorValueText = 'NoData';
    } else {
      feature.tempData.indicatorValueText = this.getIndicatorValue_asFormattedText(indicatorValue);
    }
    feature.tempData.unitText = this.selectionState.selectedIndicator.unit;

    const tooltipHtml = this.featurePopupHelperService.buildIndicatorTooltip(
      feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME],
      feature.tempData.indicatorValueText,
      feature.tempData.unitText
    );
    layer.bindTooltip(tooltipHtml, {
      sticky: false,
    });
  }

  onUpdateSingleFeatureGeometry([_geoJSON, drawControl]) {
    this.mapParts.drawControlObject.drawControl = drawControl;
  }

  invalidateMap() {
    if (this.mapParts && this.mapParts.map) {
      this.genericMapHelperService.invalidateMap(this.mapParts.map);
    }
  }

  zoomToDataLayer() {
    if (this.mapParts && this.mapParts.map && this.mapParts.dataLayer) {
      this.genericMapHelperService.zoomToLayer(this.mapParts.map, this.mapParts.dataLayer);
    }
  }

  initSingleFeatureGeoMap(domId, resourceType) {
    // init leaflet map

    // add geometry editing tool for the respective RESOURCE TYPE

    // add geocoding plugin if it is POINT resource

    // register events that broadcast new geometry to other components

    if (this.mapParts && this.mapParts.map)
      this.genericMapHelperService.clearMap(this.mapParts.map);

    //function (domId, withLayerControl, withGeosearchControl, withDrawControl, drawResourceType, editMode)
    this.mapParts = this.genericMapHelperService.initMap(
      domId,
      false,
      true,
      true,
      true,
      resourceType,
      this.editMode
    );
    // response:
    /*
    {
      "map": mapObject,
      "layerControl": layerControl,
      "backgroundLayer": backgroundLayer,
      "geosearchControl": geosearchControl,
      "drawControlObject": drawControlObject
    }
    */
  }

  addDataLayertoSingleFeatureGeoMap(geoJSON) {
    this.georesourceData_geoJSON = geoJSON;

    //function (geoJSON, map, layerControl, layerName)
    this.mapParts.dataLayer = this.genericMapHelperService.addDataLayer(
      geoJSON,
      this.mapParts.map,
      undefined,
      '',
      (feature, layer) => {
        layer.bindPopup(
          this.featurePopupHelperService.buildFeaturePropertiesPopup(
            feature.properties,
            'georesourceInfoPopupContent'
          )
        );

        layer.on({
          click: () => {
            this.broadcastService.broadcast(BroadcastMessage.SingleFeatureSelected, [feature]);
            layer.openPopup();
          },
        });
      },
      this.pointToLayer,
      this.style
    );
  }

  pointToLayer(geoJsonPoint, latlng) {
    return L.circleMarker(latlng, {
      radius: 6,
    });
  }

  style(_feature) {
    return {
      color: 'red',
      weight: 1,
      opacity: 1,
    };
  }

  /*  
  moved into addDataLayer call to be able to use local vars
 onEachFeature(feature, layer) {
    layer.on({
      click: () => {

        this.broadcastService.broadcast(BroadcastMessage.SingleFeatureSelected, [feature]);

        var popupContent = '<div class="georesourceInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
        for (var p in feature.properties) {
          popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
        }
        popupContent += '</table></div>';

        layer.bindPopup(popupContent);
      }
    });
  }; */

  changeEditableFeature(feature) {
    this.genericMapHelperService.changeEditableFeature(
      feature,
      this.mapParts.drawControlObject.featureLayer
    );
  }
}
