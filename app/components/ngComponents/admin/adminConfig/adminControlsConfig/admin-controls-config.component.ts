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
 * The /administration controls-config route: the page frame lives in the
 * template, all editor mechanics in <app-config-editor-panes>. This component
 * only describes what is specific to the JSON-based controls config.
 */
@Component({
  selector: 'app-admin-controls-config',
  templateUrl: './admin-controls-config.component.html',
  imports: [
    TranslateModule,
    ExpandableBoxComponent,
    AdminContentViewComponent,
    ConfigEditorPanesComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminControlsConfigComponent {
  private http = inject(HttpClient);
  private configStorageService = inject(ConfigStorageService);
  private envConfigService = inject(EnvConfigService);

  /** Top-level keys a controls config has to define. */
  private static readonly REQUIRED_KEYWORDS = [
    'id',
    'groups',
    'indicatorConfig',
    'poi',
    'dataImport',
    'filter',
    'measureOfValueClassification',
    'balance',
    'diagrams',
    'radarDiagram',
    'regressionDiagram',
    'reachability',
    'processing',
    'indicatorLegendExportButtons',
    'reportingButton',
    'diagramExportButtons',
    'georesourceExportButtons',
  ];

  readonly descriptor: ConfigEditorDescriptor = {
    i18nPrefix: 'ADMIN_CONFIG.CONTROLS',
    mode: 'application/json',
    formatLabel: 'JSON',
    requiredKeywords: AdminControlsConfigComponent.REQUIRED_KEYWORDS,
    lint: (cm, options) => CodeMirror.lint.json(cm, options),
    loadTemplate: () =>
      firstValueFrom(
        this.http.get('./config/controls-config_backup_forAdminViewExplanation.txt', {
          responseType: 'text',
        })
      ),
    // Prefer the config the app started with; fall back to the stored one.
    loadCurrent: async () => {
      const config =
        this.envConfigService.controlsConfig ||
        (await firstValueFrom(this.configStorageService.getControlsConfig()));
      return config ? JSON.stringify(config, null, '    ') : '';
    },
    save: async (value) => {
      await firstValueFrom(this.configStorageService.postControlsConfig(value));
      const stored = await firstValueFrom(this.configStorageService.getControlsConfig());
      return JSON.stringify(stored, null, '    ');
    },
  };
}
