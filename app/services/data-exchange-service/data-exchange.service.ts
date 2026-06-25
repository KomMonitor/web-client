import { Injectable, inject } from '@angular/core';
import {
  DEFAULT_POI_SIZE,
  LOI_DASH_ARRAY_OBJECTS,
  PoiSize,
} from './data-exchange.constants';
import { IndicatorsDataset } from 'components/ngComponents/models/indicators.models';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { GeoresourcesImportDataset } from 'components/ngComponents/userInterface/sidebar/kommonitorDataImport/kommonitor-data-import.component';

export interface SpatialUnit {
  spatialUnitLevel: string;
  spatialUnitId: any;
  isOutlineLayer: any;
  outlineColor: any;
  outlineWidth: any;
  outlineDashArrayString: any;
  permissions: any;
}

@Injectable({
  providedIn: 'root',
})
export class DataExchangeService {
  private envConfigService = inject(EnvConfigService);
  private metadataBootstrap = inject(MetadataBootstrapService);

  selectedDateInit = false;

  showDiagramExportButtons = true;
  showGeoresourceExportButtons = true;
  configMeanDataDisplay = this.envConfigService.configMeanDataDisplay || 'both';

  disableIndicatorDatePicker!: boolean;
  isBalanceChecked!: boolean;
  indicatorAndMetadataAsBalance: any;
  indicatorDatePrefix!: string;
  measureOfValue: any;
  isMeasureOfValueChecked: boolean = false;
  selectedIndicatorBackup!: IndicatorsDataset;
  wmsUrlForSelectedIndicator: any;
  wfsUrlForSelectedIndicator: any;
  wmsLegendImage: any;
  rangeFilterData: any;
  classifyZeroSeparately_backup: any;
  simplifyGeometriesParameterName: any;
  simplifyGeometries: any;
  FEATURE_NAME_PROPERTY_NAME: any;
  reachabilityScenarioOnMainMap: any;
  isochroneLegend: any = false;
  adminUserName;
  adminPassword;
  adminIsLoggedIn;
  rangeFilterIsApplied: any;
  baseLayerDefinitionsArray!: any[];

  selectedPoiSize: PoiSize = DEFAULT_POI_SIZE;

  anySideBarIsShown = false;

  tmpIndicatorGeoJSON = undefined;

  fileDatasets: GeoresourcesImportDataset[] = [];

  availablePoiMarkerColors = [
    {
      colorName: 'red',
      colorValue: 'rgb(205,59,40)',
    },
    {
      colorName: 'white',
      colorValue: 'rgb(255,255,255)',
    },
    {
      colorName: 'orange',
      colorValue: 'rgb(235,144,46)',
    },
    {
      colorName: 'beige',
      colorValue: 'rgb(255,198,138)',
    },
    {
      colorName: 'green',
      colorValue: 'rgb(108,166,36)',
    },
    {
      colorName: 'blue',
      colorValue: 'rgb(53,161,209)',
    },
    {
      colorName: 'purple',
      colorValue: 'rgb(198,77,175)',
    },
    {
      colorName: 'pink',
      colorValue: 'rgb(255,138,232)',
    },
    {
      colorName: 'gray',
      colorValue: 'rgb(163,163,163)',
    },
    {
      colorName: 'black',
      colorValue: 'rgb(47,47,47)',
    },
  ];

  // Prio7 B1: metadata bootstrap orchestration lives in MetadataBootstrapService.
  // The remaining fetch* wrappers below still delegate there until their (admin-layer)
  // consumers are migrated off the facade.
  getLoiDashSvgFromStringValue(loiDashArrayString) {
    for (const loiDashArrayObject of LOI_DASH_ARRAY_OBJECTS) {
      if (loiDashArrayObject.dashArrayValue == loiDashArrayString) {
        return loiDashArrayObject.svgString;
      }
    }

    return '';
  }

  fetchTopicsMetadata(keycloakRolesArray) {
    return this.metadataBootstrap.fetchTopicsMetadata(keycloakRolesArray);
  }

  fetchSpatialUnitsMetadata(keycloakRolesArray) {
    return this.metadataBootstrap.fetchSpatialUnitsMetadata(keycloakRolesArray);
  }

  fetchGeoresourcesMetadata(keycloakRolesArray, filter) {
    return this.metadataBootstrap.fetchGeoresourcesMetadata(keycloakRolesArray, filter);
  }

  fetchIndicatorsMetadata(keycloakRolesArray, filter: any = undefined) {
    return this.metadataBootstrap.fetchIndicatorsMetadata(keycloakRolesArray, filter);
  }

  fetchAccessControlMetadata(keycloakRolesArray) {
    return this.metadataBootstrap.fetchAccessControlMetadata(keycloakRolesArray);
  }
}
