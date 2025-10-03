import { Component, AfterViewInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DataExchangeService } from '../../../../../services/data-exchange-service/data-exchange.service';
import { ConfigStorageService, LandingpageConfig } from '../../../../../services/config-storage-service/config-storage.service';
import { firstValueFrom } from 'rxjs';
import CodeMirror from 'codemirror';

// CodeMirror module is not loaded properly (why?!), reload necessary files 
import 'codemirror/mode/xml/xml.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';

import 'codemirror/addon/display/autoRefresh.js';

declare var $: any;

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
  selector: 'app-admin-landingpage-config',
  templateUrl: './admin-landingpage-config.component.html',
  styleUrls: ['./admin-landingpage-config.component.css']
})
export class AdminLandingpageConfigComponent implements AfterViewInit { 

  loadingData = true;
  codeMirrorEditor!: CodeMirrorEditor;
  templateCodeMirrorEditor!: CodeMirrorEditor;
  currentCodeMirrorEditor!: CodeMirrorEditor;
  newCodeMirrorEditor!: CodeMirrorEditor;
 
  appConfigTemplate: string = '';
  appConfigTmp: string = '';
  appConfigCurrent: string = '';
  appConfigNew: string = '';
  errorMessagePart: string = '';

  configLoaded = false;

  constructor(
    private http: HttpClient,
    private kommonitorConfigStorageService: ConfigStorageService,
    @Inject('kommonitorDataExchangeService') private ajskommonitorDataExchangeService: any
  ) {}


  ngOnInit() {
  }

  ngAfterViewInit() {
    this.init();
  }

  async init() {

    // get current config or set blank
    await this.kommonitorConfigStorageService.getLandingpageConfig().subscribe({
      next: response => {
          this.appConfigTmp = response;
          this.appConfigCurrent = response;
          this.appConfigNew = response;
          
          this.configLoaded = true;
      },
      error: error => {
        console.error('Default landingpageConfig not set, reverting to template');
      }
    });

    try {
      if (!this.configLoaded) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await firstValueFrom(this.http.get('./config/landingPage_backup.html', { responseType: 'text' }));
      if (typeof response === 'string') {
        this.appConfigTemplate = response;
     
        this.initCodeEditor();
        this.onChangeAppConfig();
      }
    } catch (error) {
      console.error('Error initializing app config:', error);
      if (error instanceof HttpErrorResponse) {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.error);
      } else {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
      $("#appConfigEditErrorAlert").show();
    } finally {
      this.loadingData = false;
    }
  }

  initCodeEditor() {

    const editorElement = document.getElementById("appLandingpageEditor");
    if (!editorElement) {
      console.error('Could not find appLandingpageEditor element');
      return;
    }

    // Initialize main editor
    this.codeMirrorEditor = CodeMirror.fromTextArea(editorElement, {
      lineNumbers: true,
      autoRefresh: true,
      mode: 'htmlmixed'
    });
    this.codeMirrorEditor.setSize(null, 450);
    this.codeMirrorEditor.on('change', (cMirror: any) => {
      this.appConfigTmp = this.codeMirrorEditor.getValue();
      // del if html lint active
      this.onChangeAppConfig();
    });
    this.codeMirrorEditor.setValue(this.appConfigCurrent);

    // Initialize template editor
    const templateElement = document.getElementById("landingpageTemplateCodeMirror");
    if (templateElement) {
      this.templateCodeMirrorEditor = CodeMirror(templateElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: "htmlmixed",
        readOnly: true,
        theme: "panda-syntax",
        lineWrapping: true
      });
      this.templateCodeMirrorEditor.setSize(null, 450);
      this.templateCodeMirrorEditor.setValue(this.appConfigTemplate);
    }
 
    // Initialize current editor
    const currentElement = document.getElementById("currentLandingpageCodeMirror");
    if (currentElement) {
      this.currentCodeMirrorEditor = CodeMirror(currentElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: "htmlmixed",
        readOnly: true,
        theme: "panda-syntax",
        lineWrapping: true
      });
      this.currentCodeMirrorEditor.setSize(null, 450);
      this.currentCodeMirrorEditor.setValue(this.appConfigCurrent);
    }

    // Initialize new editor
    const newElement = document.getElementById("newLandingpageCodeMirror");
    if (newElement) {
      this.newCodeMirrorEditor = CodeMirror(newElement, {
        lineNumbers: true,
        autoRefresh: true,
        mode: "htmlmixed",
        readOnly: true,
        theme: "panda-syntax",
        lineWrapping: true
      });
      this.newCodeMirrorEditor.setSize(null, 450);
      this.newCodeMirrorEditor.setValue(this.appConfigNew);
    }
    
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
    this.errorMessagePart = '';
    try {

      const config: LandingpageConfig = {
        startPage: JSON.stringify(this.appConfigTmp),
        pageName: ''
      }

      await this.kommonitorConfigStorageService.postLandingpageConfig(config).toPromise();
      this.kommonitorConfigStorageService.getLandingpageConfig().subscribe({
        next: (newCurrentConfig: string) => {
          this.appConfigCurrent = newCurrentConfig;
          if (this.currentCodeMirrorEditor) {
            this.currentCodeMirrorEditor.setValue(newCurrentConfig);
          }
          $("#appLandingpageConfigEditSuccessAlert").show();
          this.loadingData = false;
        },
        error: (error: any) => {
          if (error.data) {
            this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.data);
          } else {
            this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
          }
          $("#appLandingpageConfigEditErrorAlert").show();
          this.loadingData = false; 
        }
      }
     );
    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.ajskommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
      $("#appLandingpageConfigEditErrorAlert").show();
      this.loadingData = false;
    }
  }

  hideSuccessAlert() {
    $("#appLandingpageConfigEditSuccessAlert").hide();
  }

  hideErrorAlert() {
    $("#appLandingpageConfigEditErrorAlert").hide();
  }
}
