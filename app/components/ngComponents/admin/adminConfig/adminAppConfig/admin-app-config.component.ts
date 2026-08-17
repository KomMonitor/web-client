import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import CodeMirror from 'codemirror';

import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ConfigEditorComponent } from '../configEditor/config-editor.component';
import { ConfigEditorDescriptor } from '../configEditor/config-editor.model';

/**
 * The /administration app-config route. All UI and editor mechanics live in
 * <app-config-editor>; this component only describes what is specific to the
 * JavaScript-based app config.
 */
@Component({
  selector: 'app-admin-app-config',
  templateUrl: './admin-app-config.component.html',
  imports: [ConfigEditorComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAppConfigComponent {
  private http = inject(HttpClient);
  private configStorageService = inject(ConfigStorageService);
  private envConfigService = inject(EnvConfigService);

  /** Keys env.js has to define; checked verbatim against the editor content. */
  private static readonly REQUIRED_KEYWORDS = [
    'window.__env',
    'window.__env.appTitle',
    'window.__env.enableKeycloakSecurity',
    'window.__env.encryption',
    'window.__env.FEATURE_ID_PROPERTY_NAME',
    'window.__env.FEATURE_NAME_PROPERTY_NAME',
    'window.__env.VALID_START_DATE_PROPERTY_NAME',
    'window.__env.VALID_END_DATE_PROPERTY_NAME',
    'window.__env.indicatorDatePrefix',
    'window.__env.apiUrl',
    'window.__env.targetUrlToProcessingEngine',
    'window.__env.targetUrlToReachabilityService_ORS',
    'window.__env.targetUrlToImporterService',
    'window.__env.simplifyGeometriesParameterName',
    'window.__env.simplifyGeometriesOptions',
    'window.__env.simplifyGeometries',
    'window.__env.numberOfDecimals',
    'window.__env.initialLatitude',
    'window.__env.initialLongitude',
    'window.__env.initialZoomLevel',
    'window.__env.minZoomLevel',
    'window.__env.maxZoomLevel',
    'window.__env.baseLayers',
    'window.__env.initialIndicatorId',
    'window.__env.initialSpatialUnitName',
    'window.__env.useTransparencyOnIndicator',
    'window.__env.useOutlierDetectionOnIndicator',
    'window.__env.classifyZeroSeparately',
    'window.__env.classifyUsingWholeTimeseries',
    'window.__env.updateIntervalOptions',
    'window.__env.indicatorCreationTypeOptions',
    'window.__env.indicatorUnitOptions',
    'window.__env.indicatorTypeOptions',
    'window.__env.wmsDatasets',
    'window.__env.wfsDatasets',
    'window.__env.isAdvancedMode',
    'window.__env.showAdvancedModeSwitch',
    'window.__env.customLogoURL',
    'window.__env.customLogo_onClickURL',
    'window.__env.customLogoWidth',
    'window.__env.customGreetingsContact_name',
    'window.__env.customGreetingsContact_organisation',
    'window.__env.customGreetingsContact_mail',
  ];

  readonly descriptor: ConfigEditorDescriptor = {
    i18nPrefix: 'ADMIN_CONFIG.APP',
    mode: 'javascript',
    formatLabel: 'JavaScript',
    requiredKeywords: AdminAppConfigComponent.REQUIRED_KEYWORDS,
    lint: (cm, options) => CodeMirror.lint.javascript(cm, options),
    loadTemplate: () =>
      firstValueFrom(this.http.get('./config/env_backup.js', { responseType: 'text' })),
    // Populated by env.js at startup, so it is read from the runtime config
    // rather than re-fetched.
    loadCurrent: async () => this.envConfigService.appConfig,
    save: async (value) => {
      await firstValueFrom(this.configStorageService.postAppConfig(value));
      return await firstValueFrom(this.configStorageService.getAppConfig());
    },
  };
}
