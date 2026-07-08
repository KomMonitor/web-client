import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfigStorageService } from '../../../../../services/config-storage-service/config-storage.service';

import CodeMirror from 'codemirror';

import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/xml/xml.js';

import { AdminContentViewComponent } from '../../admin-content-view/admin-content-view.component';

// import 'codemirror/addon/display/autoRefresh.js';
import { ScriptHelperService } from '../../../../../services/script-helper-service/script-helper.service';
import { ExpandableBoxComponent } from '../../../common/expandable-box/expandable-box.component';
import { NotificationService } from '../../../common/notification/notification.service';

interface CodeMirrorEditor {
  getValue(): string;
  setValue(value: string): void;
  setSize(width: number | null, height: number): void;
  on(event: string, callback: (cm: any) => void): void;
}

interface LintingIssue {
  severity: 'error' | 'warning';
  message: string;
  from: { line: number; ch: number };
  to: { line: number; ch: number };
}

@Component({
  selector: 'app-admin-app-config',
  templateUrl: './admin-app-config.component.html',
  styleUrls: ['./admin-app-config.component.scss'],
  imports: [ExpandableBoxComponent, AdminContentViewComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAppConfigComponent implements OnInit {
  private http = inject(HttpClient);
  private kommonitorConfigStorageService = inject(ConfigStorageService);
  private kommonitorScriptHelperService = inject(ScriptHelperService);
  private notificationService = inject(NotificationService);

  @ViewChild('appConfigEditor') appConfigEditor!: ElementRef;

  // Signal: toggled from awaits/subscriptions (OnPush).
  loadingData = signal(true);
  codeMirrorEditor!: CodeMirrorEditor;
  templateCodeMirrorEditor!: CodeMirrorEditor;
  currentCodeMirrorEditor!: CodeMirrorEditor;
  newCodeMirrorEditor!: CodeMirrorEditor;
  // Signals: written from CodeMirror lint callbacks, which run outside
  // Angular's template-event path (OnPush).
  missingRequiredParameters = signal<string[]>([]);
  missingRequiredParameters_string = signal('');
  keywordsInConfig = [
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
  appConfigTemplate: string = '';
  appConfigTmp: string = '';
  appConfigCurrent: string = '';
  appConfigNew: string = '';
  configSettingInvalid = signal(false);
  lintingIssues: LintingIssue[] = [];

  constructor() {
    if (!this.kommonitorScriptHelperService) {
      console.error('kommonitorScriptHelperService is not available');
    }
  }

  ngOnInit() {
    this.init();
  }

  async init() {
    try {
      if (!this.kommonitorScriptHelperService) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const response = await firstValueFrom(
        this.http.get('./config/env_backup.js', { responseType: 'text' })
      );
      if (typeof response === 'string') {
        this.appConfigTemplate = response;
        if (this.kommonitorScriptHelperService) {
          this.kommonitorScriptHelperService.prettifyScriptCodePreview('appConfig_backupTemplate');
        }

        // set in app.js
        this.appConfigTmp = (window as any).__env.appConfig;
        this.appConfigCurrent = (window as any).__env.appConfig;
        this.appConfigNew = (window as any).__env.appConfig;
        if (this.kommonitorScriptHelperService) {
          this.kommonitorScriptHelperService.prettifyScriptCodePreview('appConfig_current');
        }
        this.initCodeEditor();
        this.onChangeAppConfig();
      }
    } catch (error: any) {
      console.error('Error initializing app config:', error);
      this.notificationService.showError(
        'Laden der App-Konfiguration gescheitert: ' +
          (error?.error?.message || error?.message || 'Unbekannter Fehler'),
        { autohide: false }
      );
    } finally {
      this.loadingData.set(false);
    }
  }

  initCodeEditor() {
    const editorElement = document.getElementById('appConfigEditor');
    if (!editorElement) {
      console.error('Could not find appConfigEditor element');
      return;
    }

    // Initialize main editor
    this.codeMirrorEditor = CodeMirror.fromTextArea(editorElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode: 'javascript',
      gutters: ['CodeMirror-lint-markers'],
      lint: {
        getAnnotations: this.validateCode.bind(this),
        async: true,
      },
    });
    this.codeMirrorEditor.setSize(null, 450);
    this.codeMirrorEditor.on('change', (_cMirror: any) => {
      this.appConfigTmp = this.codeMirrorEditor.getValue();
    });
    this.codeMirrorEditor.setValue(this.appConfigCurrent);

    // Initialize template editor
    const templateElement = document.getElementById('templateCodeMirror');
    if (templateElement) {
      this.templateCodeMirrorEditor = CodeMirror(templateElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: 'javascript',
        readOnly: true,
        theme: 'panda-syntax',
        lineWrapping: true,
      });
      this.templateCodeMirrorEditor.setSize(null, 450);
      this.templateCodeMirrorEditor.setValue(this.appConfigTemplate);
    }

    // Initialize current editor
    const currentElement = document.getElementById('currentCodeMirror');
    if (currentElement) {
      this.currentCodeMirrorEditor = CodeMirror(currentElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: 'javascript',
        readOnly: true,
        theme: 'panda-syntax',
        lineWrapping: true,
      });
      this.currentCodeMirrorEditor.setSize(null, 450);
      this.currentCodeMirrorEditor.setValue(this.appConfigCurrent);
    }

    // Initialize new editor
    const newElement = document.getElementById('newCodeMirror');
    if (newElement) {
      this.newCodeMirrorEditor = CodeMirror(newElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: 'javascript',
        readOnly: true,
        theme: 'panda-syntax',
        lineWrapping: true,
      });
      this.newCodeMirrorEditor.setSize(null, 450);
      this.newCodeMirrorEditor.setValue(this.appConfigNew);
    }
  }

  validateCode(cm: any, updateLinting: (issues: LintingIssue[]) => void, options: any) {
    try {
      this.lintingIssues = CodeMirror.lint.javascript(cm, options);
      updateLinting(this.lintingIssues);
    } catch (error) {
      console.error('Error while linting app config script code. Error is: \n' + error);
    }
    this.onChangeAppConfig();
  }

  isConfigSettingInvalid(configString: string): boolean {
    let isInvalid = true;
    isInvalid = !this.keywordsInConfig.every((keyword) => configString.includes(keyword));
    this.missingRequiredParameters.set(
      this.keywordsInConfig.filter((keyword) => !configString.includes(keyword))
    );
    this.missingRequiredParameters_string.set(JSON.stringify(this.missingRequiredParameters()));
    if (this.lintingIssues && this.lintingIssues.length > 0) {
      const errors = this.lintingIssues.filter((issue) => issue.severity === 'error');
      if (errors && errors.length > 0) {
        isInvalid = true;
      }
    }
    return isInvalid;
  }

  onChangeAppConfig() {
    const configString = this.appConfigTmp;
    this.configSettingInvalid.set(this.isConfigSettingInvalid(configString));
    setTimeout(() => {
      this.appConfigNew = configString;
      if (this.newCodeMirrorEditor) {
        this.newCodeMirrorEditor.setValue(configString);
      }
    });
  }

  async editAppConfig() {
    this.loadingData.set(true);
    try {
      await this.kommonitorConfigStorageService.postAppConfig(this.appConfigTmp).toPromise();
      this.kommonitorConfigStorageService.getAppConfig().subscribe({
        next: (newCurrentConfig: string) => {
          this.appConfigCurrent = newCurrentConfig;
          if (this.currentCodeMirrorEditor) {
            this.currentCodeMirrorEditor.setValue(newCurrentConfig);
          }
          this.notificationService.showSuccess(
            'App-Konfiguration gespeichert. Die neue Parametrisierung wird beim nächsten Start der Anwendung geladen.'
          );
          this.loadingData.set(false);
        },
        error: (error: any) => {
          this.showSaveError(error);
          this.loadingData.set(false);
        },
      });
    } catch (error: any) {
      this.showSaveError(error);
      this.loadingData.set(false);
    }
  }

  private showSaveError(error: any): void {
    console.error('Error saving app config:', error);
    this.notificationService.showError(
      'Speichern der App-Konfiguration in Config Storage Server gescheitert: ' +
        (error?.error?.message || error?.data || error?.message || 'Unbekannter Fehler'),
      { autohide: false }
    );
  }
}

/* // Downgrade the component
angular.module('adminAppConfig')
  .directive('adminAppConfigNew',
    downgradeComponent({ component: AdminAppConfigComponent }) as angular.IDirectiveFactory
  );  */
