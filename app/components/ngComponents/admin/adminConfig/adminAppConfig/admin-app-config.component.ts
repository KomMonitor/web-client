import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import CodeMirror from 'codemirror';

import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { AdminContentViewComponent } from '../../admin-content-view/admin-content-view.component';
import { ExpandableBoxComponent } from '../../../common/expandable-box/expandable-box.component';
import { ConfigEditorDescriptor } from '../configEditor/config-editor.model';
import { ConfigEditorPanesComponent } from '../configEditor/config-editor-panes.component';

/**
 * The /administration app-config route: the page frame lives in the template,
 * all editor mechanics in <app-config-editor-panes>. This component only
 * describes what is specific to the JavaScript-based app config.
 */
@Component({
  selector: 'app-admin-app-config',
  templateUrl: './admin-app-config.component.html',
  imports: [
    TranslateModule,
    ExpandableBoxComponent,
    AdminContentViewComponent,
    ConfigEditorPanesComponent,
  ],
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
    // StartupService keeps the source of the executed env.js in the runtime
    // config, so prefer that; fall back to the stored config if it is missing.
    loadCurrent: async () =>
      this.envConfigService.appConfig ||
      (await firstValueFrom(this.configStorageService.getAppConfig())),
    save: async (value) => {
      await firstValueFrom(this.configStorageService.postAppConfig(value));
      return await firstValueFrom(this.configStorageService.getAppConfig());
    },
  };
}
