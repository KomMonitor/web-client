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
  indicatorDatePrefix!: string;
  selectedIndicatorBackup!: IndicatorsDataset;
  classifyZeroSeparately_backup: any;
  FEATURE_NAME_PROPERTY_NAME: any;
  adminUserName;
  adminPassword;
  adminIsLoggedIn;

  fileDatasets: GeoresourcesImportDataset[] = [];
}
