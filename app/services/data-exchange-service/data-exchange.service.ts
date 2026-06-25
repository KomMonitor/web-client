import { Injectable, inject } from '@angular/core';
import { IndicatorsDataset } from 'components/ngComponents/models/indicators.models';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
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

  fileDatasets: GeoresourcesImportDataset[] = [];
}
