import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, inject } from '@angular/core';
import {
  ConfigStorageService,
  LandingpageConfig,
} from '../../../../../services/config-storage-service/config-storage.service';

import CodeMirror from 'codemirror';

// CodeMirror module is not loaded properly (why?!), reload necessary files
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/xml/xml.js';
import { PipesModule } from '../../../../../pipes.module';

// import 'codemirror/addon/display/autoRefresh.js';
import { NotificationService } from '../../../common/notification/notification.service';

interface CodeMirrorEditor {
  getValue(): string;
  setValue(value: string): void;
  setSize(width: number | null, height: number): void;
  on(event: string, callback: (cm: any) => void): void;
}

@Component({
  selector: 'app-admin-landingpage-config',
  templateUrl: './admin-landingpage-config.component.html',
  styleUrls: ['./admin-landingpage-config.component.scss'],
  imports: [PipesModule],
  standalone: true,
})
export class AdminLandingpageConfigComponent implements AfterViewInit {
  loadingData = true;
  codeMirrorEditor!: CodeMirrorEditor;
  templateCodeMirrorEditor!: CodeMirrorEditor;
  currentCodeMirrorEditor!: CodeMirrorEditor;
  newCodeMirrorEditor!: CodeMirrorEditor;

  appConfigTmp: string = '';
  appConfigCurrent: string = '';
  appConfigNew: string = '';
  configLoaded = false;

  private http = inject(HttpClient);
  private kommonitorConfigStorageService = inject(ConfigStorageService);
  private notificationService = inject(NotificationService);

  ngAfterViewInit() {
    this.init();
  }

  async init() {
    try {
      await this.kommonitorConfigStorageService.getLandingpageConfig().subscribe({
        next: (response) => {
          this.appConfigCurrent = response;
          this.appConfigNew = response;

          this.initCodeEditor();
          this.onChangeAppConfig();
        },
        error: (_error) => {
          console.error('Default landingpageConfig not set, reverting to template');
        },
      });
    } catch (error: any) {
      console.error('Error initializing landing page config:', error);
      this.notificationService.showError(
        'Laden der Landingpage-Konfiguration gescheitert: ' +
          (error?.error?.message || error?.message || 'Unbekannter Fehler'),
        { autohide: false }
      );
    } finally {
      this.loadingData = false;
    }
  }

  initCodeEditor() {
    const editorElement = document.getElementById('appLandingpageEditor');
    if (!editorElement) {
      console.error('Could not find appLandingpageEditor element');
      return;
    }

    // Initialize main editor
    this.codeMirrorEditor = CodeMirror.fromTextArea(editorElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode: 'htmlmixed',
    });
    this.codeMirrorEditor.setSize(null, 450);
    this.codeMirrorEditor.on('change', (_cMirror: any) => {
      this.appConfigTmp = this.codeMirrorEditor.getValue();
      this.onChangeAppConfig();
    });
    this.codeMirrorEditor.setValue(this.appConfigCurrent);
  }

  onChangeAppConfig() {
    const configString = this.appConfigTmp;
    setTimeout(() => {
      this.appConfigNew = configString;
      if (this.newCodeMirrorEditor) {
        this.newCodeMirrorEditor.setValue(configString);
      }
    });
  }

  async editAppConfig() {
    this.loadingData = true;
    try {
      const config: LandingpageConfig = {
        startPage: JSON.stringify(this.appConfigTmp),
        pageName: '',
      };

      await this.kommonitorConfigStorageService.postLandingpageConfig(config).toPromise();
      this.kommonitorConfigStorageService.getLandingpageConfig().subscribe({
        next: (newCurrentConfig: string) => {
          this.appConfigCurrent = newCurrentConfig;
          if (this.currentCodeMirrorEditor) {
            this.currentCodeMirrorEditor.setValue(newCurrentConfig);
          }
          this.notificationService.showSuccess('Landingpage-Konfiguration gespeichert.');
          this.loadingData = false;
        },
        error: (error: any) => {
          this.showSaveError(error);
          this.loadingData = false;
        },
      });
    } catch (error: any) {
      this.showSaveError(error);
      this.loadingData = false;
    }
  }

  private showSaveError(error: any): void {
    console.error('Error saving landing page config:', error);
    this.notificationService.showError(
      'Speichern der Landingpage-Konfiguration gescheitert: ' +
        (error?.error?.message || error?.data || error?.message || 'Unbekannter Fehler'),
      { autohide: false }
    );
  }
}
