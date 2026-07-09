import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import CodeMirror from 'codemirror';
import { firstValueFrom } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ConfigStorageService } from '../../../../../services/config-storage-service/config-storage.service';

// CodeMirror module is not loaded properly (why?!), reload necessary files
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
  selector: 'app-admin-controls-config',
  templateUrl: './admin-controls-config.component.html',
  styleUrls: ['./admin-controls-config.component.scss'],
  imports: [TranslateModule, ExpandableBoxComponent, AdminContentViewComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminControlsConfigComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private kommonitorConfigStorageService = inject(ConfigStorageService);
  private envConfigService = inject(EnvConfigService);
  private kommonitorScriptHelperService = inject(ScriptHelperService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  @ViewChild('controlsConfigEditor') controlsConfigEditor!: ElementRef;
  @ViewChild('templateCodeMirror') templateCodeMirrorElement!: ElementRef;
  @ViewChild('currentCodeMirror') currentCodeMirrorElement!: ElementRef;
  @ViewChild('newCodeMirror') newCodeMirrorElement!: ElementRef;

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
  controlsConfigTemplate: string = '';
  controlsConfigTmp: string = '';
  controlsConfigCurrent: string = '';
  controlsConfigNew: string = '';
  configSettingInvalid = signal(false);
  lintingIssues: LintingIssue[] = [];
  private dataLoaded = false;

  constructor() {
    if (!this.kommonitorScriptHelperService) {
      console.error('kommonitorScriptHelperService is not available');
    }
  }

  ngOnInit() {
    this.init();
  }

  ngAfterViewInit() {
    this.waitForDataAndInitEditors();
  }

  private async waitForDataAndInitEditors() {
    // Wait for data to be loaded
    while (!this.dataLoaded) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.initCodeEditor();
  }

  async init() {
    try {
      if (!this.kommonitorScriptHelperService) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const response = await firstValueFrom(
        this.http.get('./config/controls-config_backup_forAdminViewExplanation.txt', {
          responseType: 'text',
        })
      );
      if (typeof response === 'string') {
        this.controlsConfigTemplate = response;
        if (this.kommonitorScriptHelperService) {
          this.kommonitorScriptHelperService.prettifyScriptCodePreview(
            'controlsConfig_backupTemplate'
          );
        }
        try {
          const config = this.envConfigService.controlsConfig;
          if (!config) {
            await this.kommonitorConfigStorageService.getControlsConfig();
            const storedConfig = this.kommonitorConfigStorageService.controlsConfig;
            if (storedConfig) {
              this.controlsConfigTmp = JSON.stringify(storedConfig, null, '    ');
              this.controlsConfigCurrent = JSON.stringify(storedConfig, null, '    ');
              this.controlsConfigNew = JSON.stringify(storedConfig, null, '    ');
            }
          } else {
            this.controlsConfigTmp = JSON.stringify(config, null, '    ');
            this.controlsConfigCurrent = JSON.stringify(config, null, '    ');
            this.controlsConfigNew = JSON.stringify(config, null, '    ');
          }
        } catch (error) {
          console.error('Error getting controls config:', error);
        }

        if (this.kommonitorScriptHelperService) {
          this.kommonitorScriptHelperService.prettifyScriptCodePreview('controlsConfig_current');
        }
      }
    } catch (error: any) {
      console.error('Error initializing controls config:', error);
      this.notificationService.showError(
        this.translate.instant('ADMIN_CONFIG.CONTROLS.MSG.LOAD_FAILED', {
          error:
            error?.error?.message ||
            error?.message ||
            this.translate.instant('ADMIN_SHARED.UNKNOWN_ERROR'),
        }),
        { autohide: false }
      );
    } finally {
      this.loadingData.set(false);
      this.dataLoaded = true;
    }
  }

  initCodeEditor() {
    if (!this.controlsConfigEditor?.nativeElement) {
      console.error('Could not find controlsConfigEditor element');
      return;
    }

    // Initialize main editor
    this.codeMirrorEditor = CodeMirror.fromTextArea(this.controlsConfigEditor.nativeElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode: 'application/json',
      gutters: ['CodeMirror-lint-markers'],
      lint: {
        getAnnotations: this.validateCode.bind(this),
        async: true,
      },
      lineWrapping: true,
    });
    this.codeMirrorEditor.setSize(null, 450);

    this.codeMirrorEditor.on('change', () => {
      this.controlsConfigTmp = this.codeMirrorEditor.getValue();
      this.onChangeControlsConfig();
    });

    // Set the value after a short delay to ensure the editor is ready
    setTimeout(() => {
      if (this.controlsConfigCurrent) {
        this.codeMirrorEditor.setValue(this.controlsConfigCurrent);
      }
    }, 100);

    // Initialize template editor
    if (this.templateCodeMirrorElement?.nativeElement) {
      this.templateCodeMirrorEditor = CodeMirror(this.templateCodeMirrorElement.nativeElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: 'application/json',
        readOnly: true,
        theme: 'panda-syntax',
        lineWrapping: true,
      });
      this.templateCodeMirrorEditor.setSize(null, 450);

      // Set the value after a short delay
      setTimeout(() => {
        if (this.controlsConfigTemplate) {
          this.templateCodeMirrorEditor.setValue(this.controlsConfigTemplate);
        }
      }, 100);
    }

    // Initialize current editor
    if (this.currentCodeMirrorElement?.nativeElement) {
      this.currentCodeMirrorEditor = CodeMirror(this.currentCodeMirrorElement.nativeElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: 'application/json',
        readOnly: true,
        theme: 'panda-syntax',
        lineWrapping: true,
      });
      this.currentCodeMirrorEditor.setSize(null, 450);

      // Set the value after a short delay
      setTimeout(() => {
        if (this.controlsConfigCurrent) {
          this.currentCodeMirrorEditor.setValue(this.controlsConfigCurrent);
        }
      }, 100);
    }

    // Initialize new editor
    if (this.newCodeMirrorElement?.nativeElement) {
      this.newCodeMirrorEditor = CodeMirror(this.newCodeMirrorElement.nativeElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: 'application/json',
        readOnly: true,
        theme: 'panda-syntax',
        lineWrapping: true,
      });
      this.newCodeMirrorEditor.setSize(null, 450);

      // Set the value after a short delay
      setTimeout(() => {
        if (this.controlsConfigNew) {
          this.newCodeMirrorEditor.setValue(this.controlsConfigNew);
        }
      }, 100);
    }
  }

  validateCode(cm: any, updateLinting: (issues: LintingIssue[]) => void, options: any) {
    try {
      this.lintingIssues = CodeMirror.lint.json(cm, options);
      updateLinting(this.lintingIssues);
    } catch (error) {
      console.error('Error while linting controls config json code. Error is: \n' + error);
    }
    this.onChangeControlsConfig();
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

  onChangeControlsConfig() {
    const configString = this.controlsConfigTmp;
    this.configSettingInvalid.set(this.isConfigSettingInvalid(configString));
    setTimeout(() => {
      this.controlsConfigNew = configString;
      if (this.newCodeMirrorEditor) {
        this.newCodeMirrorEditor.setValue(configString);
      }
    });
  }

  async editControlsConfig() {
    this.loadingData.set(true);
    try {
      await firstValueFrom(
        this.kommonitorConfigStorageService.postControlsConfig(this.controlsConfigTmp)
      );
      // Call getControlsConfig which will update the service's controlsConfig property
      this.kommonitorConfigStorageService.getControlsConfig();
      // Use the updated controlsConfig from the service
      this.controlsConfigCurrent = JSON.stringify(
        this.kommonitorConfigStorageService.controlsConfig,
        null,
        '    '
      );
      if (this.currentCodeMirrorEditor) {
        this.currentCodeMirrorEditor.setValue(this.controlsConfigCurrent);
      }
      this.notificationService.showSuccess(
        this.translate.instant('ADMIN_CONFIG.CONTROLS.MSG.SAVED')
      );
    } catch (error: any) {
      console.error('Error editing controls config:', error);
      this.notificationService.showError(
        this.translate.instant('ADMIN_CONFIG.CONTROLS.MSG.SAVE_FAILED', {
          error:
            error?.error?.message ||
            error?.message ||
            this.translate.instant('ADMIN_SHARED.UNKNOWN_ERROR'),
        }),
        { autohide: false }
      );
    } finally {
      this.loadingData.set(false);
    }
  }
}
